const mongoose = require('mongoose');

const SalesKpiSnapshotSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  periodType: { type: String, enum: ['month', 'week'], required: true },
  periodValue: { type: String, required: true, trim: true },
  target: { type: Number, default: 0, min: 0 },
  achieved: { type: Number, default: 0, min: 0 },
  coreOutput: { type: Number, default: 0, min: 0 },
  absents: { type: Number, default: 0, min: 0 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

SalesKpiSnapshotSchema.index(
  { agentId: 1, periodType: 1, periodValue: 1 },
  { unique: true }
);

module.exports = mongoose.model('SalesKpiSnapshot', SalesKpiSnapshotSchema);
