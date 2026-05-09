const mongoose = require('mongoose');
const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const PostingTemplate = require('../models/PostingTemplate');
const { defaultAccounts, defaultPostingTemplates } = require('./financeConstants');
const { assertPeriodOpen } = require('./fiscalPeriodService');

class FinancePostingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'FinancePostingError';
    this.statusCode = statusCode;
  }
}

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const assertValidAmount = (value, label = 'amount') => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new FinancePostingError(`${label} must be a non-negative finite number`);
  }
  return roundMoney(amount);
};

const validateJournalLines = (lines) => {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new FinancePostingError('A journal entry requires at least two lines');
  }

  const normalized = lines.map((line, index) => {
    const debit = assertValidAmount(line.debit || 0, `lines[${index}].debit`);
    const credit = assertValidAmount(line.credit || 0, `lines[${index}].credit`);
    if (!line.account) throw new FinancePostingError(`lines[${index}].account is required`);
    if (debit > 0 && credit > 0) throw new FinancePostingError(`lines[${index}] cannot contain both debit and credit`);
    if (debit === 0 && credit === 0) throw new FinancePostingError(`lines[${index}] must contain a debit or credit amount`);
    return { ...line, debit, credit };
  });

  const totalDebit = roundMoney(normalized.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = roundMoney(normalized.reduce((sum, line) => sum + line.credit, 0));
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new FinancePostingError(`Unbalanced journal entry: debit ${totalDebit} does not equal credit ${totalCredit}`);
  }

  return { lines: normalized, totalDebit, totalCredit };
};

const ensureDefaultAccounts = async (session) => {
  for (const account of defaultAccounts) {
    const { normalBalance, systemAccount, ...insertFields } = account;
    await Account.updateOne(
      { code: account.code },
      {
        $setOnInsert: insertFields,
        $set: {
          normalBalance,
          systemAccount: systemAccount ?? true
        }
      },
      { upsert: true, session }
    );
  }
};

const ensureDefaultPostingTemplates = async (session) => {
  for (const template of defaultPostingTemplates) {
    await PostingTemplate.updateOne(
      { key: template.key },
      { $setOnInsert: { ...template, systemTemplate: true, active: true } },
      { upsert: true, session }
    );
  }
};

const getAccountByCode = async (code, session) => {
  await ensureDefaultAccounts(session);
  const account = await Account.findOne({ code, active: true }).session(session || null);
  if (!account) throw new FinancePostingError(`Posting account ${code} was not found or is inactive`);
  return account;
};

const nextJournalNumber = () => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `JE-${stamp}-${Date.now().toString().slice(-6)}`;
};

const applyAccountBalances = async (lines, session, multiplier = 1) => {
  for (const line of lines) {
    const amount = roundMoney((Number(line.debit || 0) - Number(line.credit || 0)) * multiplier);
    await Account.updateOne({ _id: line.account }, { $inc: { currentBalance: amount } }, { session });
  }
};

const pathValue = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

const buildLinesFromTemplate = async (templateKey, context, session) => {
  await ensureDefaultPostingTemplates(session);
  const template = await PostingTemplate.findOne({ key: templateKey, active: true }).session(session || null);
  if (!template) throw new FinancePostingError(`Posting template not found: ${templateKey}`);

  const lines = [];
  for (const line of template.lines) {
    const amount = assertValidAmount(pathValue(context, line.amountPath), `${templateKey}.${line.amountPath}`);
    if (amount === 0 && line.optional) continue;
    const account = await getAccountByCode(line.accountCode, session);
    lines.push({
      account: account._id,
      label: context.label || line.label || template.name,
      debit: line.side === 'debit' ? amount : 0,
      credit: line.side === 'credit' ? amount : 0,
      partnerType: context.partnerType || 'none',
      partner: context.partner
    });
  }
  return lines;
};

const runWithOptionalTransaction = async (session, work) => {
  if (session) return work(session);
  const ownedSession = await mongoose.startSession();
  ownedSession.startTransaction();
  try {
    const result = await work(ownedSession);
    await ownedSession.commitTransaction();
    return result;
  } catch (error) {
    await ownedSession.abortTransaction();
    throw error;
  } finally {
    ownedSession.endSession();
  }
};

const postJournalEntry = async ({
  lines,
  memo = '',
  date = new Date(),
  sourceType = 'manual',
  sourceId,
  userId,
  session,
  allowExisting = false
}) => runWithOptionalTransaction(session, async (activeSession) => {
  await assertPeriodOpen(date, activeSession);
  await ensureDefaultAccounts(activeSession);

  if (sourceType !== 'manual' && sourceId) {
    const existing = await JournalEntry.findOne({
      sourceType,
      sourceId,
      status: { $in: ['posted', 'locked'] }
    }).session(activeSession);
    if (existing) {
      if (allowExisting) return existing;
      throw new FinancePostingError(`Journal posting already exists for ${sourceType} ${sourceId}`, 409);
    }
  }

  const normalized = validateJournalLines(lines);
  const [entry] = await JournalEntry.create([{
    number: nextJournalNumber(),
    date,
    memo,
    sourceType,
    sourceId,
    status: 'posted',
    lines: normalized.lines,
    totalDebit: normalized.totalDebit,
    totalCredit: normalized.totalCredit,
    createdBy: userId,
    postedBy: userId
  }], { session: activeSession });

  await applyAccountBalances(normalized.lines, activeSession);
  return entry;
});

const postFromTemplate = async ({
  templateKey,
  context,
  memo,
  date,
  sourceType,
  sourceId,
  userId,
  session
}) => {
  const lines = await buildLinesFromTemplate(templateKey, context, session);
  return postJournalEntry({ lines, memo, date, sourceType, sourceId, userId, session });
};

const reverseJournalEntry = async ({ journalEntryId, reason = '', userId, session }) => runWithOptionalTransaction(session, async (activeSession) => {
  const entry = await JournalEntry.findById(journalEntryId).session(activeSession);
  if (!entry) throw new FinancePostingError('Journal entry not found', 404);
  if (!['posted', 'locked'].includes(entry.status)) {
    throw new FinancePostingError(`Only posted or locked journal entries can be reversed; current status is ${entry.status}`, 409);
  }
  await assertPeriodOpen(entry.date, activeSession);

  const reversalLines = (entry.lines || []).map((line) => ({
    account: line.account,
    label: `Reversal: ${line.label || entry.number}`,
    debit: Number(line.credit || 0),
    credit: Number(line.debit || 0),
    partnerType: line.partnerType,
    partner: line.partner
  }));

  const reversal = await postJournalEntry({
    lines: reversalLines,
    memo: `Reversal of ${entry.number}${reason ? `: ${reason}` : ''}`,
    date: new Date(),
    sourceType: 'manual',
    userId,
    session: activeSession
  });

  reversal.reversalOf = entry._id;
  reversal.reversalReason = reason;
  await reversal.save({ session: activeSession });

  entry.status = 'reversed';
  entry.reversedByEntry = reversal._id;
  entry.reversalReason = reason;
  await entry.save({ session: activeSession });

  return reversal;
});

const postDraftJournalEntry = async ({ journalEntryId, userId, session }) => runWithOptionalTransaction(session, async (activeSession) => {
  const entry = await JournalEntry.findById(journalEntryId).session(activeSession);
  if (!entry) throw new FinancePostingError('Journal entry not found', 404);
  if (entry.status !== 'draft') {
    throw new FinancePostingError(`Only draft journal entries can be posted; current status is ${entry.status}`, 409);
  }
  await assertPeriodOpen(entry.date, activeSession);
  const normalized = validateJournalLines(entry.lines || []);
  entry.lines = normalized.lines;
  entry.totalDebit = normalized.totalDebit;
  entry.totalCredit = normalized.totalCredit;
  entry.status = 'posted';
  entry.postedBy = userId;
  await entry.save({ session: activeSession });
  await applyAccountBalances(normalized.lines, activeSession);
  return entry;
});

module.exports = {
  FinancePostingError,
  assertValidAmount,
  validateJournalLines,
  ensureDefaultAccounts,
  ensureDefaultPostingTemplates,
  getAccountByCode,
  postJournalEntry,
  postFromTemplate,
  reverseJournalEntry,
  postDraftJournalEntry
};
