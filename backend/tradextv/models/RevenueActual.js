const mongoose = require('mongoose');

const RevenueActualSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    target: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RevenueActualSchema.index({ metric: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('RevenueActual', RevenueActualSchema);
