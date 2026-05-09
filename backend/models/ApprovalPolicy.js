const mongoose = require('mongoose');

const approvalPolicySchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: ['invoice', 'bill', 'expense', 'purchase', 'payroll_adjustment', 'commission', 'journal_entry'],
    required: true,
    index: true
  },
  amountThreshold: { type: Number, default: 0, min: 0 },
  department: { type: String, default: '', trim: true },
  branch: { type: String, default: '', trim: true },
  requiredRole: { type: String, required: true, trim: true },
  approvalSequence: { type: Number, default: 1, min: 1 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

approvalPolicySchema.index({ documentType: 1, amountThreshold: 1, active: 1 });

module.exports = mongoose.model('ApprovalPolicy', approvalPolicySchema);
