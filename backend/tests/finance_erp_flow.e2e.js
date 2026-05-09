const assert = require('assert');
const mongoose = require('mongoose');

const financeErpService = require('../services/financeErpService');
const AuditLog = require('../models/AuditLog');
const BankStatementLine = require('../models/BankStatementLine');
const FiscalPeriod = require('../models/FiscalPeriod');
const InventoryItem = require('../models/InventoryItem');
const JournalEntry = require('../models/JournalEntry');
const InventoryMovement = require('../models/InventoryMovement');
const Purchase = require('../models/Purchase');

const uri = process.env.FINANCE_E2E_MONGO_URI;

if (!uri) {
  console.log('skip - set FINANCE_E2E_MONGO_URI to run the full finance ERP flow test');
  process.exit(0);
}

const userId = new mongoose.Types.ObjectId();
const req = {
  user: { _id: userId, role: 'admin', permissions: ['*'] },
  body: {},
  ip: '127.0.0.1',
  headers: { 'user-agent': 'finance-e2e-test' }
};

const assertTrialBalance = (reports) => {
  const debit = Number(reports.trialBalance.totalDebit.toFixed(2));
  const credit = Number(reports.trialBalance.totalCredit.toFixed(2));
  assert.strictEqual(debit, credit, `trial balance mismatch ${debit} != ${credit}`);
};

(async () => {
  await mongoose.connect(uri);
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const issueDate = new Date('2026-05-08T00:00:00.000Z');

  try {
    await FiscalPeriod.findOneAndUpdate(
      { name: `E2E ${runId}` },
      {
        name: `E2E ${runId}`,
        periodType: 'monthly',
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T23:59:59.999Z'),
        status: 'open'
      },
      { upsert: true, new: true }
    );

    const customer = await financeErpService.createResource('customers', {
      code: `E2E-CUST-${runId}`,
      name: `E2E Customer ${runId}`
    }, req);

    const invoice = await financeErpService.createResource('invoices', {
      number: `E2E-INV-${runId}`,
      customer: customer._id,
      issueDate,
      dueDate: issueDate,
      items: [{ description: 'E2E sale', quantity: 1, unitPrice: 100, taxRate: 0 }]
    }, req);

    await financeErpService.submitInvoice(invoice._id, req);
    await financeErpService.approveInvoice(invoice._id, req);
    const posted = await financeErpService.postInvoice(invoice._id, req);
    assert.strictEqual(posted.invoice.status, 'posted');
    assert.ok(posted.journalEntry);

    const payment = await financeErpService.createResource('payments', {
      paymentNumber: `E2E-PAY-${runId}`,
      direction: 'inbound',
      partnerType: 'customer',
      customer: customer._id,
      invoice: invoice._id,
      amount: 100,
      method: 'bank',
      status: 'draft',
      paymentDate: issueDate
    }, req);
    const postedPayment = await financeErpService.postPayment(payment._id, req);
    assert.strictEqual(postedPayment.payment.status, 'posted');

    const bankAccount = await financeErpService.createResource('bankAccounts', {
      name: `E2E Bank ${runId}`,
      bankName: 'E2E Bank',
      accountNumber: runId
    }, req);

    const statementResult = await financeErpService.createBankStatement({
      bankAccount: bankAccount._id,
      statementNumber: `E2E-STMT-${runId}`,
      startDate: issueDate,
      endDate: issueDate,
      openingBalance: 0,
      closingBalance: 100,
      lines: [{
        date: issueDate,
        description: 'Customer deposit',
        reference: `E2E-PAY-${runId}`,
        credit: 100,
        amount: 100
      }]
    }, req);

    const reconciliation = await financeErpService.reconcileBank({
      bankStatement: statementResult.statement._id,
      matches: [{
        statementLine: statementResult.lines[0]._id,
        matchedEntityType: 'payment',
        matchedEntityId: payment._id,
        matchedAmount: 100
      }],
      notes: 'E2E reconciliation'
    }, req);
    assert.strictEqual(reconciliation.statement.status, 'reconciled');

    const linkedLine = await BankStatementLine.findById(statementResult.lines[0]._id).lean();
    assert.strictEqual(linkedLine.reconciled, true);
    assert.strictEqual(String(linkedLine.matchedEntityId), String(payment._id));

    await assert.rejects(() => financeErpService.reconcileBank({
      bankStatement: statementResult.statement._id,
      matches: [{
        statementLine: statementResult.lines[0]._id,
        matchedEntityType: 'payment',
        matchedEntityId: payment._id,
        matchedAmount: 100
      }]
    }, req), /already reconciled/);

    const reports = await financeErpService.reports();
    assertTrialBalance(reports);

    const auditCount = await AuditLog.countDocuments({
      entityId: { $in: [invoice._id, statementResult.statement._id] }
    });
    assert.ok(auditCount >= 2, 'expected audit logs for invoice and bank reconciliation');

    const journalCount = await JournalEntry.countDocuments({
      sourceId: { $in: [invoice._id, payment._id] },
      status: 'posted'
    });
    assert.strictEqual(journalCount, 2);

    const purchase = await Purchase.create({
      referenceNumber: `E2E-PO-${runId}`,
      supplier: 'E2E Supplier',
      status: 'received',
      totals: { totalCost: 75 },
      items: [{ item: 'E2E Stock', quantity: 1, unit: 'piece', totalCost: 75 }]
    });
    const purchasePosting = await financeErpService.postInventoryPurchase(purchase._id, req);
    assert.ok(purchasePosting.journalEntry);

    const inventoryItem = await InventoryItem.create({
      name: `E2E Stock ${runId}`,
      sku: `E2E-SKU-${runId}`,
      price: 100,
      quantity: 1
    });
    const movement = await InventoryMovement.create({
      item: inventoryItem._id,
      type: 'deliver',
      amount: 75,
      performedBy: userId
    });
    const cogsPosting = await financeErpService.postInventoryDelivery(movement._id, req);
    assert.ok(cogsPosting.journalEntry);

    console.log('ok - full finance flow: invoice -> approve -> post -> payment -> reconcile -> reports -> audit -> inventory purchase -> COGS');
  } finally {
    await mongoose.disconnect();
  }
})().catch(async (error) => {
  console.error('not ok - full finance ERP flow');
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
