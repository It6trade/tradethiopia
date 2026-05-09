const mongoose = require('mongoose');

const bankStatementSchema = new mongoose.Schema({
  bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true, index: true },
  statementNumber: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'in_reconciliation', 'reconciled'], default: 'draft', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

bankStatementSchema.index({ bankAccount: 1, statementNumber: 1 }, { unique: true });

module.exports = mongoose.model('BankStatement', bankStatementSchema);
