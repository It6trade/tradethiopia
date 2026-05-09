const mongoose = require('mongoose');
const Account = require('../models/Account');
const Approval = require('../models/Approval');
const AuditLog = require('../models/AuditLog');
const BankAccount = require('../models/BankAccount');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const JournalEntry = require('../models/JournalEntry');
const Payment = require('../models/Payment');
const Payroll = require('../models/Payroll');
const Tax = require('../models/Tax');
const Vendor = require('../models/Vendor');
const Commission = require('../models/Commission');
const FiscalPeriod = require('../models/FiscalPeriod');
const PostingTemplate = require('../models/PostingTemplate');
const BankStatement = require('../models/BankStatement');
const BankStatementLine = require('../models/BankStatementLine');
const ReconciliationSession = require('../models/ReconciliationSession');
const ReconciliationLine = require('../models/ReconciliationLine');
const ApprovalPolicy = require('../models/ApprovalPolicy');
const Budget = require('../models/Budget');
const BudgetLine = require('../models/BudgetLine');
const BudgetConsumption = require('../models/BudgetConsumption');
const MonthEndClose = require('../models/MonthEndClose');
const FinanceEvent = require('../models/FinanceEvent');
const financePostingService = require('./financePostingService');
const financeEvents = require('./financeEventBus');
const reconciliationService = require('./reconciliationService');
const fiscalPeriodService = require('./fiscalPeriodService');
const { assertTransition, assertEditable } = require('./financeStateMachineService');
const { checkAndConsumeBudget, checkBudgetAvailability } = require('./budgetService');
const { getRequiredApprovals } = require('./approvalPolicyService');
const jobService = require('./jobService');
const inventoryAccountingService = require('./inventoryAccountingService');

const models = {
  accounts: Account,
  approvals: Approval,
  auditLogs: AuditLog,
  bankAccounts: BankAccount,
  bills: Bill,
  customers: Customer,
  expenses: Expense,
  invoices: Invoice,
  journalEntries: JournalEntry,
  payments: Payment,
  payroll: Payroll,
  taxes: Tax,
  vendors: Vendor,
  commissions: Commission,
  fiscalPeriods: FiscalPeriod,
  postingTemplates: PostingTemplate,
  bankStatements: BankStatement,
  bankStatementLines: BankStatementLine,
  reconciliationSessions: ReconciliationSession,
  reconciliationLines: ReconciliationLine,
  approvalPolicies: ApprovalPolicy,
  budgets: Budget,
  budgetLines: BudgetLine,
  budgetConsumptions: BudgetConsumption,
  monthEndCloses: MonthEndClose,
  financeEvents: FinanceEvent
};

const defaults = [
  ['1000', 'Cash and Bank', 'asset'],
  ['1100', 'Accounts Receivable', 'asset'],
  ['2000', 'Accounts Payable', 'liability'],
  ['2100', 'VAT Payable', 'liability'],
  ['3000', 'Owner Equity', 'equity'],
  ['4000', 'Sales Revenue', 'income'],
  ['5000', 'Operating Expenses', 'expense'],
  ['5100', 'Payroll Expense', 'expense'],
  ['5200', 'Commission Expense', 'expense']
];

const numberPrefix = {
  invoice: 'INV',
  bill: 'BILL',
  payment: 'PAY',
  expense: 'EXP',
  journal: 'JE'
};

const nextNumber = async (type) => {
  const prefix = numberPrefix[type] || 'FIN';
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${stamp}-${Date.now().toString().slice(-6)}`;
};

const audit = async ({ req, action, entityType, entityId, before, after, session }) => {
  await financeEvents.audit({
    req,
    action,
    entityType,
    entityId,
    oldValue: before,
    newValue: after,
    session
  });
};

const ensureDefaultAccounts = async (session) => {
  await financePostingService.ensureDefaultAccounts(session);
  await financePostingService.ensureDefaultPostingTemplates(session);
};

const getAccountByCode = async (code, session) => {
  await ensureDefaultAccounts(session);
  return Account.findOne({ code }).session(session);
};

const postJournalEntry = async ({ lines, memo, sourceType, sourceId, userId, session }) => {
  return financePostingService.postJournalEntry({
    lines,
    memo,
    sourceType,
    sourceId,
    userId,
    session
  });
};

const list = async (resource, query = {}) => {
  const Model = models[resource];
  if (!Model) throw new Error('Unknown finance resource');
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const search = query.search?.trim();
  const filter = {};

  if (query.status) filter.status = query.status;
  if (search) {
    filter.$or = ['name', 'number', 'code', 'email', 'category', 'memo'].map((field) => ({
      [field]: { $regex: search, $options: 'i' }
    }));
  }

  const [data, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter)
  ]);

  return { data, page, limit, total, pages: Math.ceil(total / limit) || 1 };
};

const createResource = async (resource, body, req) => {
  const Model = models[resource];
  if (!Model) throw new Error('Unknown finance resource');

  const payload = { ...body, createdBy: req.user?._id };
  if (resource === 'invoices' && !payload.number) payload.number = await nextNumber('invoice');
  if (resource === 'bills' && !payload.number) payload.number = await nextNumber('bill');
  if (resource === 'expenses' && !payload.number) payload.number = await nextNumber('expense');
  if (resource === 'payments' && !payload.paymentNumber) payload.paymentNumber = await nextNumber('payment');
  if (resource === 'payments' && !payload.status) payload.status = 'draft';

  if (resource === 'expenses') {
    const expenseAccount = payload.account || (await getAccountByCode('5000'))._id;
    payload.account = expenseAccount;
    await checkBudgetAvailability({
      account: expenseAccount,
      amount: payload.amount,
      department: body.department || '',
      branch: body.branch || ''
    });
  }

  const doc = await Model.create(payload);
  if (resource === 'expenses') {
    await createApprovalRequests({
      targetType: 'expense',
      targetId: doc._id,
      amount: doc.amount,
      department: body.department || '',
      branch: body.branch || '',
      req
    });
  }
  await audit({ req, action: 'create', entityType: resource, entityId: doc._id, after: doc.toObject() });
  return doc;
};

const dateFieldByResource = {
  invoices: 'issueDate',
  bills: 'issueDate',
  expenses: 'expenseDate',
  journalEntries: 'date',
  payments: 'paymentDate'
};

const stateMachineByResource = {
  invoices: 'invoice',
  bills: 'bill',
  expenses: 'expense',
  journalEntries: 'journalEntry'
};

const updateResource = async (resource, id, body, req) => {
  const Model = models[resource];
  if (!Model) throw new Error('Unknown finance resource');

  const doc = await Model.findById(id);
  if (!doc) throw new Error('Finance resource not found');
  const before = doc.toObject();

  const stateMachine = stateMachineByResource[resource];
  if (stateMachine) assertEditable(stateMachine, doc.status);

  const dateField = dateFieldByResource[resource];
  if (dateField) {
    await fiscalPeriodService.assertPeriodOpen(doc[dateField]);
    if (body?.[dateField]) await fiscalPeriodService.assertPeriodOpen(body[dateField]);
  }

  Object.assign(doc, body, { updatedBy: req.user?._id });
  await doc.save();
  await audit({ req, action: `${resource}.updated`, entityType: resource, entityId: doc._id, before, after: doc.toObject() });
  return doc;
};

const createApprovalRequests = async ({ targetType, targetId, amount, department = '', branch = '', req, session }) => {
  const policies = await getRequiredApprovals({ documentType: targetType, amount, department, branch });
  if (!policies.length) return [];

  return Approval.insertMany(policies.map((policy) => ({
    targetType,
    targetId,
    status: 'pending',
    requestedBy: req.user?._id,
    requiredRole: policy.requiredRole,
    approvalSequence: policy.approvalSequence,
    note: `Approval policy ${policy.requiredRole} at sequence ${policy.approvalSequence}`
  })), { session });
};

const createSalesWorkflow = async (body, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await ensureDefaultAccounts(session);
    const receivable = await getAccountByCode('1100', session);
    const revenue = await getAccountByCode('4000', session);
    const cash = await getAccountByCode('1000', session);

    const [customer] = await Customer.create([body.customer], { session });
    const [invoice] = await Invoice.create([{
      number: body.invoice?.number || await nextNumber('invoice'),
      customer: customer._id,
      salesOrderNumber: body.salesOrderNumber,
      status: 'approved',
      items: body.items,
      createdBy: req.user?._id
    }], { session });

    const invoiceEntry = await financePostingService.postFromTemplate({
      templateKey: 'sales_invoice',
      context: {
        total: invoice.total,
        subtotal: invoice.subtotal || invoice.total,
        taxTotal: invoice.taxTotal || 0,
        label: invoice.number,
        partnerType: 'customer',
        partner: customer._id
      },
      memo: `Invoice ${invoice.number}`,
      sourceType: 'invoice',
      sourceId: invoice._id,
      userId: req.user?._id,
      session
    });

    invoice.journalEntry = invoiceEntry._id;
    invoice.status = 'posted';

    let payment;
    if (Number(body.payment?.amount || 0) > 0) {
      const [createdPayment] = await Payment.create([{
        paymentNumber: await nextNumber('payment'),
        direction: 'inbound',
        partnerType: 'customer',
        customer: customer._id,
        invoice: invoice._id,
        amount: Number(body.payment.amount),
        method: body.payment.method || 'bank',
        createdBy: req.user?._id
      }], { session });
      payment = createdPayment;

      const paymentEntry = await financePostingService.postFromTemplate({
        templateKey: 'customer_payment',
        context: {
          amount: payment.amount,
          label: payment.paymentNumber,
          partnerType: 'customer',
          partner: customer._id
        },
        memo: `Payment ${payment.paymentNumber} for ${invoice.number}`,
        sourceType: 'payment',
        sourceId: payment._id,
        userId: req.user?._id,
        session
      });

      payment.journalEntry = paymentEntry._id;
      await payment.save({ session });
      invoice.paidAmount = payment.amount;
      invoice.status = payment.amount >= invoice.total ? 'paid' : 'partially_paid';
    }

    await invoice.save({ session });
    await audit({ req, action: 'workflow.sales_order_to_ledger', entityType: 'invoice', entityId: invoice._id, after: invoice.toObject(), session });
    await session.commitTransaction();
    return { customer, invoice, payment, journalEntry: invoiceEntry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const createPurchaseWorkflow = async (body, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await ensureDefaultAccounts(session);
    const payable = await getAccountByCode('2000', session);
    const expenseAccount = await getAccountByCode('5000', session);
    const cash = await getAccountByCode('1000', session);

    const [vendor] = await Vendor.create([body.vendor], { session });
    const [bill] = await Bill.create([{
      number: body.bill?.number || await nextNumber('bill'),
      vendor: vendor._id,
      purchaseOrderNumber: body.purchaseOrderNumber,
      status: 'approved',
      items: body.items,
      createdBy: req.user?._id
    }], { session });

    await checkBudgetAvailability({
      account: expenseAccount._id,
      amount: bill.total,
      department: body.department || '',
      branch: body.branch || '',
      session
    });

    const approval = await Approval.create([{
      targetType: 'bill',
      targetId: bill._id,
      status: 'approved',
      requestedBy: req.user?._id,
      approvedBy: req.user?._id,
      decidedAt: new Date(),
      note: body.approvalNote || 'Auto-approved from ERP workflow'
    }], { session });

    await checkAndConsumeBudget({
      sourceType: 'bill',
      sourceId: bill._id,
      account: expenseAccount._id,
      amount: bill.total,
      userId: req.user?._id,
      session
    });

    const billEntry = await financePostingService.postFromTemplate({
      templateKey: 'vendor_bill',
      context: {
        total: bill.total,
        label: bill.number,
        partnerType: 'vendor',
        partner: vendor._id
      },
      memo: `Vendor bill ${bill.number}`,
      sourceType: 'bill',
      sourceId: bill._id,
      userId: req.user?._id,
      session
    });
    bill.status = 'posted';

    let payment;
    if (Number(body.payment?.amount || 0) > 0) {
      const [createdPayment] = await Payment.create([{
        paymentNumber: await nextNumber('payment'),
        direction: 'outbound',
        partnerType: 'vendor',
        vendor: vendor._id,
        bill: bill._id,
        amount: Number(body.payment.amount),
        method: body.payment.method || 'bank',
        createdBy: req.user?._id
      }], { session });
      payment = createdPayment;

      const paymentEntry = await financePostingService.postFromTemplate({
        templateKey: 'supplier_payment',
        context: {
          amount: payment.amount,
          label: payment.paymentNumber,
          partnerType: 'vendor',
          partner: vendor._id
        },
        memo: `Supplier payment ${payment.paymentNumber}`,
        sourceType: 'payment',
        sourceId: payment._id,
        userId: req.user?._id,
        session
      });
      payment.journalEntry = paymentEntry._id;
      await payment.save({ session });
      bill.paidAmount = payment.amount;
      bill.status = payment.amount >= bill.total ? 'paid' : 'partially_paid';
    }

    bill.journalEntry = billEntry._id;
    await bill.save({ session });
    await audit({ req, action: 'workflow.purchase_order_to_ledger', entityType: 'bill', entityId: bill._id, after: bill.toObject(), session });
    await session.commitTransaction();
    return { vendor, bill, approval: approval[0], payment, journalEntry: billEntry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const createExpenseWorkflow = async (body, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await ensureDefaultAccounts(session);
    const expenseAccount = await getAccountByCode('5000', session);
    const cash = await getAccountByCode('1000', session);

    const [expense] = await Expense.create([{
      number: body.number || await nextNumber('expense'),
      employee: body.employee || req.user?._id,
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      status: 'approved',
      account: body.account || expenseAccount._id,
      createdBy: req.user?._id,
      approvedBy: req.user?._id
    }], { session });

    const [approval] = await Approval.create([{
      targetType: 'expense',
      targetId: expense._id,
      status: 'approved',
      requestedBy: req.user?._id,
      approvedBy: req.user?._id,
      decidedAt: new Date()
    }], { session });

    await createApprovalRequests({
      targetType: 'expense',
      targetId: expense._id,
      amount: expense.amount,
      req,
      session
    });

    const accrualEntry = await financePostingService.postFromTemplate({
      templateKey: 'expense_accrual',
      context: {
        amount: expense.amount,
        label: expense.number,
        partnerType: 'employee',
        partner: expense.employee
      },
      memo: `Expense accrual ${expense.number}`,
      sourceType: 'expense',
      sourceId: expense._id,
      userId: req.user?._id,
      session
    });

    const [payment] = await Payment.create([{
      paymentNumber: await nextNumber('payment'),
      direction: 'outbound',
      partnerType: 'employee',
      expense: expense._id,
      amount: expense.amount,
      method: body.paymentMethod || 'cash',
      status: 'draft',
      createdBy: req.user?._id
    }], { session });

    await checkAndConsumeBudget({
      sourceType: 'expense',
      sourceId: expense._id,
      account: expense.account,
      amount: expense.amount,
      userId: req.user?._id,
      session
    });

    const paymentEntry = await financePostingService.postFromTemplate({
      templateKey: 'expense_payment',
      context: {
        amount: expense.amount,
        label: payment.paymentNumber,
        partnerType: 'employee',
        partner: expense.employee
      },
      memo: `Expense payment ${payment.paymentNumber}`,
      sourceType: 'payment',
      sourceId: payment._id,
      userId: req.user?._id,
      session
    });

    expense.status = 'paid';
    expense.payment = payment._id;
    expense.journalEntry = accrualEntry._id;
    expense.postedBy = req.user?._id;
    expense.postedAt = new Date();
    expense.paidBy = req.user?._id;
    expense.paidAt = new Date();
    payment.status = 'posted';
    payment.journalEntry = paymentEntry._id;
    await expense.save({ session });
    await payment.save({ session });
    await audit({ req, action: 'workflow.expense_to_reports', entityType: 'expense', entityId: expense._id, after: expense.toObject(), session });
    await session.commitTransaction();
    return { expense, approval, payment, journalEntry: accrualEntry, paymentJournalEntry: paymentEntry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const dashboard = async () => {
  await ensureDefaultAccounts();
  const [invoiceAgg, billAgg, expenseAgg, paymentAgg, recentTransactions, invoiceStats] = await Promise.all([
    Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total' }, balance: { $sum: '$balance' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $group: { _id: null, total: { $sum: '$total' }, balance: { $sum: '$balance' }, count: { $sum: 1 } } }]),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Payment.aggregate([{ $group: { _id: '$direction', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    JournalEntry.find().sort({ date: -1 }).limit(8).lean(),
    Invoice.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } }])
  ]);

  const revenue = invoiceAgg[0]?.total || 0;
  const billTotal = billAgg[0]?.total || 0;
  const expenseTotal = expenseAgg[0]?.total || 0;
  const paymentIn = paymentAgg.find((row) => row._id === 'inbound')?.total || 0;
  const paymentOut = paymentAgg.find((row) => row._id === 'outbound')?.total || 0;
  const expenses = billTotal + expenseTotal;

  return {
    metrics: {
      revenue,
      expenses,
      profit: revenue - expenses,
      receivables: invoiceAgg[0]?.balance || 0,
      payables: billAgg[0]?.balance || 0,
      cashMovement: paymentIn - paymentOut,
      invoices: invoiceAgg[0]?.count || 0,
      bills: billAgg[0]?.count || 0
    },
    invoiceStats,
    recentTransactions,
    charts: [
      { name: 'Revenue', value: revenue },
      { name: 'Expenses', value: expenses },
      { name: 'Profit', value: revenue - expenses },
      { name: 'Cash In', value: paymentIn },
      { name: 'Cash Out', value: paymentOut }
    ]
  };
};

const reports = async () => {
  const accounts = await Account.find({ active: true }).lean();
  const journalEntries = await JournalEntry.find({ status: 'posted' }).lean();
  const ledger = accounts.map((account) => {
    const lines = journalEntries.flatMap((entry) => (entry.lines || []).filter((line) => String(line.account) === String(account._id)));
    const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { account, debit, credit, balance: debit - credit };
  });

  const sumType = (type) => ledger
    .filter((row) => row.account.type === type)
    .reduce((sum, row) => sum + row.balance, 0);

  const rollupById = new Map(ledger.map((row) => [String(row.account._id), {
    account: row.account,
    debit: row.debit,
    credit: row.credit,
    balance: row.balance,
    childBalance: 0,
    rollupBalance: row.balance
  }]));

  const childrenByParent = new Map();
  for (const row of rollupById.values()) {
    const parentId = row.account.parentAccount || row.account.parent;
    if (parentId) {
      const key = String(parentId);
      childrenByParent.set(key, [...(childrenByParent.get(key) || []), String(row.account._id)]);
    }
  }

  const computeRollup = (accountId) => {
    const row = rollupById.get(String(accountId));
    if (!row) return 0;
    const childBalance = (childrenByParent.get(String(accountId)) || [])
      .reduce((sum, childId) => sum + computeRollup(childId), 0);
    row.childBalance = Number(childBalance.toFixed(2));
    row.rollupBalance = Number((row.balance + row.childBalance).toFixed(2));
    return row.rollupBalance;
  };

  for (const accountId of rollupById.keys()) computeRollup(accountId);

  const revenue = Math.abs(sumType('income'));
  const expenses = sumType('expense');
  const assets = sumType('asset');
  const liabilities = Math.abs(sumType('liability'));
  const equity = Math.abs(sumType('equity'));

  return {
    ledger,
    accountRollups: Array.from(rollupById.values()),
    trialBalance: {
      totalDebit: ledger.reduce((sum, row) => sum + row.debit, 0),
      totalCredit: ledger.reduce((sum, row) => sum + row.credit, 0)
    },
    profitAndLoss: { revenue, expenses, profit: revenue - expenses },
    balanceSheet: { assets, liabilities, equity, retainedEarnings: revenue - expenses },
    cashFlow: { operating: revenue - expenses, investing: 0, financing: 0 }
  };
};

const transitionDocument = async ({ Model, documentType, id, toStatus, req, updates = {}, session }) => {
  const doc = await Model.findById(id).session(session || null);
  if (!doc) throw new Error(`${documentType} not found`);
  const before = doc.toObject();
  assertTransition(documentType, doc.status, toStatus);
  doc.status = toStatus;
  Object.assign(doc, updates);
  await doc.save({ session });
  await audit({
    req,
    action: `${documentType}.${toStatus}`,
    entityType: documentType,
    entityId: doc._id,
    before,
    after: doc.toObject(),
    session
  });
  return doc;
};

const submitInvoice = async (id, req) => {
  const invoice = await transitionDocument({
    Model: Invoice,
    documentType: 'invoice',
    id,
    toStatus: 'pending_approval',
    req
  });
  await createApprovalRequests({
    targetType: 'invoice',
    targetId: invoice._id,
    amount: invoice.total,
    req
  });
  return invoice;
};

const approveInvoice = (id, req) => transitionDocument({
  Model: Invoice,
  documentType: 'invoice',
  id,
  toStatus: 'approved',
  updates: { approvedBy: req.user?._id, approvedAt: new Date() },
  req
});

const postInvoice = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await Invoice.findById(id).session(session);
    if (!invoice) throw new Error('Invoice not found');
    const before = invoice.toObject();
    assertTransition('invoice', invoice.status, 'posted');
    const entry = await financePostingService.postFromTemplate({
      templateKey: 'sales_invoice',
      context: {
        total: invoice.total,
        subtotal: invoice.subtotal || invoice.total,
        taxTotal: invoice.taxTotal || 0,
        label: invoice.number,
        partnerType: 'customer',
        partner: invoice.customer
      },
      memo: `Invoice ${invoice.number}`,
      sourceType: 'invoice',
      sourceId: invoice._id,
      userId: req.user?._id,
      session
    });
    invoice.status = 'posted';
    invoice.journalEntry = entry._id;
    invoice.postedBy = req.user?._id;
    invoice.postedAt = new Date();
    await invoice.save({ session });
    await financeEvents.emit({
      eventType: 'InvoicePosted',
      entityType: 'invoice',
      entityId: invoice._id,
      payload: { before, after: invoice.toObject(), journalEntry: entry._id },
      req,
      session
    });
    await session.commitTransaction();
    return { invoice, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reverseInvoice = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await Invoice.findById(id).session(session);
    if (!invoice) throw new Error('Invoice not found');
    const before = invoice.toObject();
    assertTransition('invoice', invoice.status, 'reversed');
    const reversal = invoice.journalEntry
      ? await financePostingService.reverseJournalEntry({
        journalEntryId: invoice.journalEntry,
        reason: req.body?.reason || 'Invoice reversal',
        userId: req.user?._id,
        session
      })
      : null;
    invoice.status = 'reversed';
    invoice.reversedByEntry = reversal?._id;
    invoice.reversedBy = req.user?._id;
    invoice.reversedAt = new Date();
    await invoice.save({ session });
    await financeEvents.emit({
      eventType: 'JournalReversed',
      entityType: 'invoice',
      entityId: invoice._id,
      payload: { before, after: invoice.toObject(), reversal: reversal?._id },
      req,
      session
    });
    await session.commitTransaction();
    return { invoice, reversal };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const markInvoiceOverdue = (id, req) => transitionDocument({
  Model: Invoice,
  documentType: 'invoice',
  id,
  toStatus: 'overdue',
  req
});

const cancelInvoice = (id, req) => transitionDocument({
  Model: Invoice,
  documentType: 'invoice',
  id,
  toStatus: 'cancelled',
  req,
  updates: { cancelledBy: req.user?._id, cancelledAt: new Date() }
});

const submitBill = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await Bill.findById(id).session(session);
    if (!bill) throw new Error('Bill not found');
    const expenseAccount = await getAccountByCode('5000', session);
    await checkBudgetAvailability({
      account: expenseAccount._id,
      amount: bill.total,
      session
    });
    const submittedBill = await transitionDocument({
      Model: Bill,
      documentType: 'bill',
      id,
      toStatus: 'submitted',
      updates: { submittedBy: req.user?._id, submittedAt: new Date() },
      req,
      session
    });
    await createApprovalRequests({
      targetType: 'bill',
      targetId: submittedBill._id,
      amount: submittedBill.total,
      req,
      session
    });
    await session.commitTransaction();
    return submittedBill;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const approveBill = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await transitionDocument({
      Model: Bill,
      documentType: 'bill',
      id,
      toStatus: 'approved',
      updates: { approvedBy: req.user?._id, approvedAt: new Date() },
      req,
      session
    });
    await financeEvents.emit({
      eventType: 'BillApproved',
      entityType: 'bill',
      entityId: bill._id,
      payload: bill.toObject(),
      req,
      session
    });
    await session.commitTransaction();
    return bill;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postBill = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await Bill.findById(id).session(session);
    if (!bill) throw new Error('Bill not found');
    assertTransition('bill', bill.status, 'posted');
    const expenseAccount = await getAccountByCode('5000', session);
    await checkAndConsumeBudget({
      sourceType: 'bill',
      sourceId: bill._id,
      account: expenseAccount._id,
      amount: bill.total,
      userId: req.user?._id,
      session
    });
    const entry = await financePostingService.postFromTemplate({
      templateKey: 'vendor_bill',
      context: { total: bill.total, label: bill.number, partnerType: 'vendor', partner: bill.vendor },
      memo: `Vendor bill ${bill.number}`,
      sourceType: 'bill',
      sourceId: bill._id,
      userId: req.user?._id,
      session
    });
    bill.status = 'posted';
    bill.journalEntry = entry._id;
    bill.postedBy = req.user?._id;
    bill.postedAt = new Date();
    await bill.save({ session });
    await session.commitTransaction();
    return { bill, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const payBill = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await Bill.findById(id).session(session);
    if (!bill) throw new Error('Bill not found');
    if (!['posted', 'partially_paid'].includes(bill.status)) {
      throw new Error(`Bill must be posted before payment; current status is ${bill.status}`);
    }
    const amount = financePostingService.assertValidAmount(req.body?.amount ?? bill.balance, 'amount');
    if (amount <= 0 || amount > bill.balance + 0.01) throw new Error('Payment amount must be greater than zero and cannot exceed bill balance');
    const [payment] = await Payment.create([{
      paymentNumber: await nextNumber('payment'),
      direction: 'outbound',
      partnerType: 'vendor',
      vendor: bill.vendor,
      bill: bill._id,
      amount,
      method: req.body?.method || 'bank',
      createdBy: req.user?._id
    }], { session });
    const entry = await financePostingService.postFromTemplate({
      templateKey: 'supplier_payment',
      context: { amount, label: payment.paymentNumber, partnerType: 'vendor', partner: bill.vendor },
      memo: `Supplier payment ${payment.paymentNumber}`,
      sourceType: 'payment',
      sourceId: payment._id,
      userId: req.user?._id,
      session
    });
    payment.journalEntry = entry._id;
    await payment.save({ session });
    bill.paidAmount = Number((Number(bill.paidAmount || 0) + amount).toFixed(2));
    bill.status = bill.paidAmount >= bill.total ? 'paid' : 'partially_paid';
    await bill.save({ session });
    await financeEvents.emit({
      eventType: 'PaymentReceived',
      entityType: 'bill',
      entityId: bill._id,
      payload: { payment: payment._id, amount },
      req,
      session
    });
    await session.commitTransaction();
    return { bill, payment, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reverseBill = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await Bill.findById(id).session(session);
    if (!bill) throw new Error('Bill not found');
    assertTransition('bill', bill.status, 'reversed');
    const reversal = bill.journalEntry
      ? await financePostingService.reverseJournalEntry({
        journalEntryId: bill.journalEntry,
        reason: req.body?.reason || 'Bill reversal',
        userId: req.user?._id,
        session
      })
      : null;
    bill.status = 'reversed';
    bill.reversedByEntry = reversal?._id;
    bill.reversedBy = req.user?._id;
    bill.reversedAt = new Date();
    await bill.save({ session });
    await financeEvents.emit({
      eventType: 'JournalReversed',
      entityType: 'bill',
      entityId: bill._id,
      payload: { reversal: reversal?._id },
      req,
      session
    });
    await session.commitTransaction();
    return { bill, reversal };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const closeBill = (id, req) => transitionDocument({
  Model: Bill,
  documentType: 'bill',
  id,
  toStatus: 'closed',
  req,
  updates: { closedBy: req.user?._id, closedAt: new Date() }
});

const approveExpense = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const draftExpense = await Expense.findById(id).session(session);
    if (!draftExpense) throw new Error('Expense not found');
    await checkBudgetAvailability({
      account: draftExpense.account || (await getAccountByCode('5000', session))._id,
      amount: draftExpense.amount,
      session
    });
    const expense = await transitionDocument({
      Model: Expense,
      documentType: 'expense',
      id,
      toStatus: 'approved',
      updates: { approvedBy: req.user?._id, approvedAt: new Date() },
      req,
      session
    });
    await financeEvents.emit({
      eventType: 'ExpenseApproved',
      entityType: 'expense',
      entityId: expense._id,
      payload: expense.toObject(),
      req,
      session
    });
    await session.commitTransaction();
    return expense;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const payExpense = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const expense = await Expense.findById(id).session(session);
    if (!expense) throw new Error('Expense not found');
    assertTransition('expense', expense.status, 'paid');
    if (!expense.journalEntry) {
      throw new Error('Expense must be posted before payment');
    }
    const [payment] = await Payment.create([{
      paymentNumber: await nextNumber('payment'),
      direction: 'outbound',
      partnerType: 'employee',
      expense: expense._id,
      amount: expense.amount,
      method: req.body?.method || 'cash',
      status: 'draft',
      createdBy: req.user?._id
    }], { session });
    const entry = await financePostingService.postFromTemplate({
      templateKey: 'expense_payment',
      context: { amount: expense.amount, label: payment.paymentNumber, partnerType: 'employee', partner: expense.employee },
      memo: `Expense payment ${payment.paymentNumber}`,
      sourceType: 'payment',
      sourceId: payment._id,
      userId: req.user?._id,
      session
    });
    expense.status = 'paid';
    expense.payment = payment._id;
    expense.paidBy = req.user?._id;
    expense.paidAt = new Date();
    payment.status = 'posted';
    payment.journalEntry = entry._id;
    await payment.save({ session });
    await expense.save({ session });
    await financeEvents.emit({
      eventType: 'PaymentReceived',
      entityType: 'expense',
      entityId: expense._id,
      payload: { payment: payment._id, amount: expense.amount },
      req,
      session
    });
    await session.commitTransaction();
    return { expense, payment, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postExpense = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const expense = await Expense.findById(id).session(session);
    if (!expense) throw new Error('Expense not found');
    assertTransition('expense', expense.status, 'posted');
    await checkAndConsumeBudget({
      sourceType: 'expense',
      sourceId: expense._id,
      account: expense.account || (await getAccountByCode('5000', session))._id,
      amount: expense.amount,
      userId: req.user?._id,
      session
    });
    const entry = await financePostingService.postFromTemplate({
      templateKey: 'expense_accrual',
      context: { amount: expense.amount, label: expense.number, partnerType: 'employee', partner: expense.employee },
      memo: `Expense accrual ${expense.number}`,
      sourceType: 'expense',
      sourceId: expense._id,
      userId: req.user?._id,
      session
    });
    expense.status = 'posted';
    expense.journalEntry = entry._id;
    expense.postedBy = req.user?._id;
    expense.postedAt = new Date();
    await expense.save({ session });
    await session.commitTransaction();
    return { expense, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reverseExpense = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const expense = await Expense.findById(id).session(session);
    if (!expense) throw new Error('Expense not found');
    assertTransition('expense', expense.status, 'reversed');
    const reversal = expense.journalEntry
      ? await financePostingService.reverseJournalEntry({
        journalEntryId: expense.journalEntry,
        reason: req.body?.reason || 'Expense reversal',
        userId: req.user?._id,
        session
      })
      : null;
    expense.status = 'reversed';
    expense.reversedByEntry = reversal?._id;
    expense.reversedBy = req.user?._id;
    expense.reversedAt = new Date();
    await expense.save({ session });
    await session.commitTransaction();
    return { expense, reversal };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postJournal = async (id, req) => {
  const entry = await financePostingService.postDraftJournalEntry({ journalEntryId: id, userId: req.user?._id });
  await financeEvents.audit({
    req,
    action: 'journalEntry.posted',
    entityType: 'journalEntry',
    entityId: entry._id,
    newValue: entry.toObject()
  });
  return entry;
};

const reverseJournal = async (id, req) => {
  const reversal = await financePostingService.reverseJournalEntry({
    journalEntryId: id,
    reason: req.body?.reason || 'Journal reversal',
    userId: req.user?._id
  });
  await financeEvents.emit({
    eventType: 'JournalReversed',
    entityType: 'journalEntry',
    entityId: id,
    payload: { reversal: reversal._id },
    req
  });
  return reversal;
};

const postPayment = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findById(id).session(session);
    if (!payment) throw new Error('Payment not found');
    assertTransition('payment', payment.status, 'posted');
    const amount = financePostingService.assertValidAmount(payment.amount, 'payment amount');
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');

    const isInbound = payment.direction === 'inbound';
    const entry = await financePostingService.postFromTemplate({
      templateKey: isInbound ? 'customer_payment' : 'supplier_payment',
      context: {
        amount,
        label: payment.paymentNumber || `Payment ${payment._id}`,
        partnerType: payment.partnerType || (isInbound ? 'customer' : 'vendor'),
        partner: payment.customer || payment.vendor
      },
      memo: `Payment ${payment.paymentNumber || payment._id}`,
      sourceType: 'payment',
      sourceId: payment._id,
      userId: req.user?._id,
      session
    });

    payment.status = 'posted';
    payment.journalEntry = entry._id;
    await payment.save({ session });

    if (payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice).session(session);
      if (invoice) {
        invoice.paidAmount = Number((Number(invoice.paidAmount || 0) + amount).toFixed(2));
        invoice.status = invoice.paidAmount >= invoice.total ? 'paid' : 'partially_paid';
        await invoice.save({ session });
      }
    }

    if (payment.bill) {
      const bill = await Bill.findById(payment.bill).session(session);
      if (bill) {
        bill.paidAmount = Number((Number(bill.paidAmount || 0) + amount).toFixed(2));
        bill.status = bill.paidAmount >= bill.total ? 'paid' : 'partially_paid';
        await bill.save({ session });
      }
    }

    if (payment.expense) {
      const expense = await Expense.findById(payment.expense).session(session);
      if (expense && expense.status === 'posted') {
        expense.status = 'paid';
        expense.payment = payment._id;
        expense.paidBy = req.user?._id;
        expense.paidAt = new Date();
        await expense.save({ session });
      }
    }
    await financeEvents.emit({
      eventType: 'PaymentReceived',
      entityType: 'payment',
      entityId: payment._id,
      payload: { journalEntry: entry._id, amount },
      req,
      session
    });
    await session.commitTransaction();
    return { payment, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reversePayment = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findById(id).session(session);
    if (!payment) throw new Error('Payment not found');
    assertTransition('payment', payment.status, 'reversed');
    if (!payment.journalEntry) throw new Error('Payment has no posted journal entry to reverse');

    const reversal = await financePostingService.reverseJournalEntry({
      journalEntryId: payment.journalEntry,
      reason: req.body?.reason || 'Payment reversal',
      userId: req.user?._id,
      session
    });

    payment.status = 'reversed';
    await payment.save({ session });
    await financeEvents.emit({
      eventType: 'JournalReversed',
      entityType: 'payment',
      entityId: payment._id,
      payload: { reversal: reversal._id },
      req,
      session
    });
    await session.commitTransaction();
    return { payment, reversal };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postPayroll = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payroll = await Payroll.findById(id).session(session);
    if (!payroll) throw new Error('Payroll record not found');
    if (!['approved', 'locked'].includes(payroll.status)) {
      throw new Error(`Payroll must be approved or locked before posting; current status is ${payroll.status}`);
    }

    const withholdingAmount = financePostingService.assertValidAmount(Number(payroll.incomeTax || 0) + Number(payroll.pension || 0), 'payroll withholding');
    const netAmount = financePostingService.assertValidAmount(payroll.netSalary || 0, 'payroll net salary');
    const grossAmount = financePostingService.assertValidAmount(netAmount + withholdingAmount, 'payroll posting amount');
    if (grossAmount <= 0) throw new Error('Payroll posting amount must be greater than zero');

    const entry = await financePostingService.postFromTemplate({
      templateKey: 'payroll_posting',
      context: {
        grossAmount,
        netAmount,
        withholdingAmount,
        label: `${payroll.employeeName} ${payroll.month}`,
        partnerType: 'employee',
        partner: payroll.userId
      },
      memo: `Payroll ${payroll.employeeName} ${payroll.month}`,
      sourceType: 'payroll',
      sourceId: payroll._id,
      userId: req.user?._id,
      session
    });

    payroll.status = 'locked';
    payroll.lockedBy = payroll.lockedBy || req.user?._id;
    payroll.lockedAt = payroll.lockedAt || new Date();
    payroll.journalEntry = entry._id;
    await payroll.save({ session });
    await financeEvents.emit({
      eventType: 'PayrollFinalized',
      entityType: 'payroll',
      entityId: payroll._id,
      payload: { journalEntry: entry._id, grossAmount, netAmount, withholdingAmount },
      req,
      session
    });
    await session.commitTransaction();
    return { payroll, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postCommission = async (id, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const commission = await Commission.findById(id).session(session);
    if (!commission) throw new Error('Commission record not found');

    const withholdingAmount = financePostingService.assertValidAmount(commission.commissionTax || 0, 'commission tax');
    const grossAmount = financePostingService.assertValidAmount(commission.grossCommission || commission.totalCommission || 0, 'commission amount');
    const netAmount = financePostingService.assertValidAmount(Math.max(grossAmount - withholdingAmount, 0), 'commission net amount');
    if (grossAmount <= 0) throw new Error('Commission amount must be greater than zero');

    const entry = await financePostingService.postFromTemplate({
      templateKey: 'commission_posting',
      context: {
        grossAmount,
        netAmount,
        withholdingAmount,
        label: `${commission.employeeName || 'Commission'} ${commission.month}`,
        partnerType: 'employee',
        partner: commission.userId
      },
      memo: `Commission ${commission.employeeName || commission.userId} ${commission.month}`,
      sourceType: 'commission',
      sourceId: commission._id,
      userId: req.user?._id,
      session
    });

    commission.journalEntry = entry._id;
    commission.status = 'posted';
    commission.postedAt = new Date();
    commission.postedBy = req.user?._id;
    await commission.save({ session });
    await financeEvents.audit({
      req,
      action: 'CommissionPosted',
      entityType: 'commission',
      entityId: commission._id,
      newValue: { journalEntry: entry._id, grossAmount, netAmount, withholdingAmount },
      session
    });
    await session.commitTransaction();
    return { commission, journalEntry: entry };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const closePeriod = async (id, req) => {
  const periodToClose = await FiscalPeriod.findById(id);
  if (!periodToClose) {
    const error = new Error('Fiscal period not found');
    error.statusCode = 404;
    throw error;
  }

  const closeWorkflow = await MonthEndClose.findOne({ fiscalPeriod: id });
  const requiredChecklist = [
    'reconcileBanks',
    'reviewUnpaidInvoices',
    'reviewUnpaidBills',
    'postAccruals',
    'finalizePayroll',
    'reviewTax',
    'generateStatements',
    'lockFiscalPeriod'
  ];
  const missing = requiredChecklist.filter((key) => !closeWorkflow?.checklist?.[key]);
  if (missing.length > 0) {
    const error = new Error(`Month-end close checklist is incomplete: ${missing.join(', ')}`);
    error.statusCode = 409;
    throw error;
  }

  const [unreconciledBankLines, unpostedJournals, unfinishedPayroll] = await Promise.all([
    BankStatementLine.countDocuments({
      date: { $gte: periodToClose.startDate, $lte: periodToClose.endDate },
      reconciled: false
    }),
    JournalEntry.countDocuments({
      date: { $gte: periodToClose.startDate, $lte: periodToClose.endDate },
      status: 'draft'
    }),
    Payroll.countDocuments({
      month: `${periodToClose.startDate.getFullYear()}-${String(periodToClose.startDate.getMonth() + 1).padStart(2, '0')}`,
      status: { $ne: 'locked' }
    })
  ]);

  const blockers = [];
  if (unreconciledBankLines > 0) blockers.push(`${unreconciledBankLines} unreconciled bank line(s)`);
  if (unpostedJournals > 0) blockers.push(`${unpostedJournals} unposted journal(s)`);
  if (unfinishedPayroll > 0) blockers.push(`${unfinishedPayroll} unfinished payroll record(s)`);
  if (blockers.length > 0) {
    const error = new Error(`Month-end close is blocked: ${blockers.join(', ')}`);
    error.statusCode = 409;
    throw error;
  }

  const period = await fiscalPeriodService.closePeriod({ periodId: id, userId: req.user?._id });
  closeWorkflow.status = 'locked';
  closeWorkflow.updatedBy = req.user?._id;
  await closeWorkflow.save();
  await financeEvents.emit({
    eventType: 'PeriodClosed',
    entityType: 'fiscalPeriod',
    entityId: period._id,
    payload: period.toObject(),
    req
  });
  return period;
};

const reopenPeriod = (id, req) => fiscalPeriodService.reopenPeriod({ periodId: id, userId: req.user?._id });

const ageingReport = async (type) => {
  const Model = type === 'ap' ? Bill : Invoice;
  const dateField = 'dueDate';
  const statuses = type === 'ap'
    ? ['posted', 'partially_paid', 'overdue', 'approved']
    : ['posted', 'partially_paid', 'overdue'];
  const docs = await Model.find({ status: { $in: statuses }, balance: { $gt: 0 } }).lean();
  const now = new Date();
  const buckets = {
    '0-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 }
  };
  for (const doc of docs) {
    const dueDate = doc[dateField] ? new Date(doc[dateField]) : new Date(doc.issueDate || doc.createdAt || now);
    const age = Math.max(Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)), 0);
    const bucket = age <= 30 ? '0-30' : age <= 60 ? '31-60' : age <= 90 ? '61-90' : '90+';
    buckets[bucket].count += 1;
    buckets[bucket].amount = Number((buckets[bucket].amount + Number(doc.balance || 0)).toFixed(2));
  }
  return { type, buckets, total: Object.values(buckets).reduce((sum, bucket) => sum + bucket.amount, 0) };
};

const createMonthEndClose = async (payload, req) => {
  const checklist = payload.checklist || {};
  const statementReady = Boolean(checklist.generateStatements);
  const lockReady = [
    'reconcileBanks',
    'reviewUnpaidInvoices',
    'reviewUnpaidBills',
    'postAccruals',
    'finalizePayroll',
    'reviewTax',
    'generateStatements',
    'lockFiscalPeriod'
  ].every((key) => Boolean(checklist[key]));
  const reviewStarted = Object.values(checklist).some(Boolean);
  const status = lockReady ? 'ready_to_lock' : statementReady ? 'statements_generated' : reviewStarted ? 'checklist_review' : 'open';

  const doc = await MonthEndClose.findOneAndUpdate(
    { fiscalPeriod: payload.fiscalPeriod },
    {
      $setOnInsert: { fiscalPeriod: payload.fiscalPeriod, createdBy: req.user?._id },
      $set: { checklist, status, notes: payload.notes || '', updatedBy: req.user?._id }
    },
    { upsert: true, new: true }
  );
  return doc;
};

const enqueueFinanceJob = (name, payload) => jobService.enqueue(name, payload);

module.exports = {
  list,
  createResource,
  updateResource,
  createSalesWorkflow,
  createPurchaseWorkflow,
  createExpenseWorkflow,
  dashboard,
  reports,
  postJournalEntry,
  submitInvoice,
  approveInvoice,
  postInvoice,
  reverseInvoice,
  markInvoiceOverdue,
  cancelInvoice,
  submitBill,
  approveBill,
  postBill,
  payBill,
  reverseBill,
  closeBill,
  approveExpense,
  payExpense,
  postExpense,
  reverseExpense,
  postJournal,
  reverseJournal,
  postPayment,
  reversePayment,
  postPayroll,
  postCommission,
  closePeriod,
  reopenPeriod,
  ageingReport,
  createBankStatement: reconciliationService.createBankStatement,
  reconcileBank: reconciliationService.reconcile,
  createMonthEndClose,
  enqueueFinanceJob,
  listJobs: jobService.listJobs,
  jobSetup: jobService.bullMqSetupNote,
  postInventoryPurchase: inventoryAccountingService.postInventoryPurchase,
  postInventoryDelivery: inventoryAccountingService.postInventoryDelivery,
  postInventoryAdjustment: inventoryAccountingService.postInventoryAdjustment
};
