const mongoose = require('mongoose');

const embeddedJournalLineSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  label: { type: String, default: '' },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  partnerType: { type: String, enum: ['customer', 'vendor', 'employee', 'none'], default: 'none' },
  partner: { type: mongoose.Schema.Types.ObjectId }
}, { _id: false });

const journalEntrySchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, trim: true },
  date: { type: Date, default: Date.now, index: true },
  memo: { type: String, default: '' },
  sourceType: {
    type: String,
    enum: ['manual', 'invoice', 'payment', 'bill', 'expense', 'purchase', 'payroll', 'commission', 'stock_movement', 'bank_reconciliation', 'period_close', 'transfer'],
    default: 'manual',
    index: true
  },
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ['draft', 'posted', 'locked', 'reversed', 'cancelled'], default: 'draft', index: true },
  lines: [embeddedJournalLineSchema],
  totalDebit: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversedByEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversalReason: { type: String, default: '' },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lockedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

journalEntrySchema.index(
  { sourceType: 1, sourceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: { $ne: 'manual' },
      sourceId: { $exists: true },
      status: { $in: ['posted', 'locked'] }
    }
  }
);

journalEntrySchema.pre('validate', function validateBalancedEntry(next) {
  const debit = (this.lines || []).reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = (this.lines || []).reduce((sum, line) => sum + Number(line.credit || 0), 0);
  this.totalDebit = Number(debit.toFixed(2));
  this.totalCredit = Number(credit.toFixed(2));
  const invalidLine = (this.lines || []).find((line) => {
    const lineDebit = Number(line.debit || 0);
    const lineCredit = Number(line.credit || 0);
    return !Number.isFinite(lineDebit) || !Number.isFinite(lineCredit) || lineDebit < 0 || lineCredit < 0 || (lineDebit > 0 && lineCredit > 0);
  });
  if (invalidLine) {
    return next(new Error('Journal lines must use non-negative finite debit or credit amounts'));
  }
  if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
    return next(new Error('Journal entry must balance debits and credits'));
  }
  next();
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
