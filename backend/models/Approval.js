const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['invoice', 'bill', 'expense', 'purchase', 'commission', 'payment', 'journal_entry', 'payroll_adjustment'],
    required: true,
    index: true
  },
  requiredRole: { type: String, trim: true },
  approvalSequence: { type: Number, default: 1, min: 1 },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
  decidedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
