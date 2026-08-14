const mongoose = require('mongoose');

const CooKpiTargetSchema = new mongoose.Schema({
  kpiId: { type: String, required: true, trim: true, index: true },
  period: { type: String, required: true, trim: true },
  granularity: { type: String, enum: ['month', 'week'], default: 'month' },
  target: { type: Number, required: true, min: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CooKpiTargetSchema.index({ kpiId: 1, period: 1, granularity: 1 }, { unique: true });

module.exports = mongoose.model('CooKpiTarget', CooKpiTargetSchema);
