const mongoose = require('mongoose');

const bankStatementLineSchema = new mongoose.Schema({
  statement: { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatement', required: true, index: true },
  date: { type: Date, required: true, index: true },
  description: { type: String, default: '' },
  reference: { type: String, trim: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true },
  matchedEntityType: { type: String, enum: ['payment', 'invoice', 'bill', 'journal_entry', 'adjustment', 'none'], default: 'none' },
  matchedEntityId: { type: mongoose.Schema.Types.ObjectId },
  reconciliationSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ReconciliationSession' },
  adjustmentJournalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reconciled: { type: Boolean, default: false, index: true },
  reconciledAt: { type: Date },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('BankStatementLine', bankStatementLineSchema);
