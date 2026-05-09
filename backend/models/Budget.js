const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fiscalPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalPeriod' },
  department: { type: String, default: '', trim: true },
  branch: { type: String, default: '', trim: true },
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft', index: true },
  policy: { type: String, enum: ['warn', 'block'], default: 'warn' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
