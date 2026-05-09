const mongoose = require('mongoose');

const reconciliationLineSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ReconciliationSession', required: true, index: true },
  statementLine: { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatementLine', required: true, index: true },
  matchedEntityType: { type: String, enum: ['payment', 'invoice', 'bill', 'journal_entry', 'adjustment'], required: true },
  matchedEntityId: { type: mongoose.Schema.Types.ObjectId },
  statementAmount: { type: Number, required: true },
  matchedAmount: { type: Number, required: true },
  difference: { type: Number, default: 0 },
  adjustmentJournalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ReconciliationLine', reconciliationLineSchema);
