const mongoose = require('mongoose');
const BankStatement = require('../models/BankStatement');
const BankStatementLine = require('../models/BankStatementLine');
const ReconciliationSession = require('../models/ReconciliationSession');
const ReconciliationLine = require('../models/ReconciliationLine');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Bill = require('../models/Bill');
const JournalEntry = require('../models/JournalEntry');
const { getAccountByCode, postJournalEntry } = require('./financePostingService');
const financeEvents = require('./financeEventBus');

const entityModels = {
  payment: Payment,
  invoice: Invoice,
  bill: Bill,
  journal_entry: JournalEntry
};

const createBankStatement = async (payload, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [statement] = await BankStatement.create([{
      bankAccount: payload.bankAccount,
      statementNumber: payload.statementNumber,
      startDate: payload.startDate,
      endDate: payload.endDate,
      openingBalance: Number(payload.openingBalance || 0),
      closingBalance: Number(payload.closingBalance || 0),
      createdBy: req.user?._id
    }], { session });

    const lines = await BankStatementLine.insertMany((payload.lines || []).map((line) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      const amount = Number(line.amount ?? (credit - debit));
      return {
        statement: statement._id,
        date: line.date || new Date(),
        description: line.description || '',
        reference: line.reference || '',
        debit,
        credit,
        amount
      };
    }), { session });

    await financeEvents.audit({
      req,
      action: 'BankStatementCreated',
      entityType: 'bank_statement',
      entityId: statement._id,
      newValue: { statement, lines },
      session
    });

    await session.commitTransaction();
    return { statement, lines };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reconcile = async ({ bankStatement, matches = [], notes = '' }, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const statement = await BankStatement.findById(bankStatement).session(session);
    if (!statement) throw new Error('Bank statement not found');

    const [reconciliationSession] = await ReconciliationSession.create([{
      bankStatement,
      notes,
      startedBy: req.user?._id
    }], { session });

    const lines = [];
    for (const match of matches) {
      const statementLine = await BankStatementLine.findById(match.statementLine).session(session);
      if (!statementLine) throw new Error('Bank statement line not found');
      if (statementLine.reconciled) throw new Error('Bank statement line is already reconciled');

      const Model = entityModels[match.matchedEntityType];
      if (!Model && match.matchedEntityType !== 'adjustment') throw new Error('Unsupported reconciliation match type');
      const matched = Model ? await Model.findById(match.matchedEntityId).session(session) : null;
      if (Model && !matched) throw new Error('Matched finance record not found');
      if (match.matchedEntityType === 'payment' && matched.status === 'reconciled') {
        throw new Error('Matched payment is already reconciled');
      }

      const statementAmount = Number(statementLine.amount || 0);
      const matchedAmount = Number(match.matchedAmount ?? matched?.amount ?? matched?.balance ?? matched?.total ?? 0);
      const difference = Number((statementAmount - matchedAmount).toFixed(2));
      let adjustmentJournalEntry;

      if (Math.abs(difference) > 0.01) {
        const cash = await getAccountByCode('1000', session);
        const gain = await getAccountByCode(difference > 0 ? '4300' : '5300', session);
        const amount = Math.abs(difference);
        adjustmentJournalEntry = await postJournalEntry({
          memo: `Bank reconciliation adjustment for ${statementLine.reference || statementLine._id}`,
          sourceType: 'bank_reconciliation',
          sourceId: statementLine._id,
          userId: req.user?._id,
          session,
          lines: difference > 0
            ? [
              { account: cash._id, label: 'Bank reconciliation gain', debit: amount, credit: 0 },
              { account: gain._id, label: 'Bank reconciliation gain', debit: 0, credit: amount }
            ]
            : [
              { account: gain._id, label: 'Bank reconciliation loss', debit: amount, credit: 0 },
              { account: cash._id, label: 'Bank reconciliation loss', debit: 0, credit: amount }
            ]
        });
      }

      const [reconciliationLine] = await ReconciliationLine.create([{
        session: reconciliationSession._id,
        statementLine: statementLine._id,
        matchedEntityType: match.matchedEntityType,
        matchedEntityId: match.matchedEntityId,
        statementAmount,
        matchedAmount,
        difference,
        adjustmentJournalEntry: adjustmentJournalEntry?._id,
        reconciledBy: req.user?._id
      }], { session });

      statementLine.reconciled = true;
      statementLine.reconciledAt = new Date();
      statementLine.reconciledBy = req.user?._id;
      statementLine.matchedEntityType = match.matchedEntityType;
      statementLine.matchedEntityId = match.matchedEntityId;
      statementLine.reconciliationSession = reconciliationSession._id;
      statementLine.adjustmentJournalEntry = adjustmentJournalEntry?._id;
      await statementLine.save({ session });

      if (match.matchedEntityType === 'payment' && matched) {
        matched.status = 'reconciled';
        await matched.save({ session });
      }

      lines.push(reconciliationLine);
    }

    reconciliationSession.status = 'completed';
    reconciliationSession.completedAt = new Date();
    reconciliationSession.completedBy = req.user?._id;
    await reconciliationSession.save({ session });

    const remaining = await BankStatementLine.countDocuments({ statement: statement._id, reconciled: false }).session(session);
    if (remaining === 0) {
      statement.status = 'reconciled';
    } else {
      statement.status = 'in_reconciliation';
    }
    await statement.save({ session });

    await financeEvents.emit({
      eventType: 'BankReconciled',
      entityType: 'bank_statement',
      entityId: statement._id,
      payload: { reconciliationSession: reconciliationSession._id, matchedLines: lines.length },
      req,
      session
    });

    await session.commitTransaction();
    return { session: reconciliationSession, lines, statement };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createBankStatement,
  reconcile
};
