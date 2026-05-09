const mongoose = require('mongoose');

const reconciliationSessionSchema = new mongoose.Schema({
  bankStatement: { type: mongoose.Schema.Types.ObjectId, ref: 'BankStatement', required: true, index: true },
  status: { type: String, enum: ['open', 'completed', 'cancelled'], default: 'open', index: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ReconciliationSession', reconciliationSessionSchema);
