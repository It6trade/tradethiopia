const mongoose = require('mongoose');

const SocialActualSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    target: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SocialActualSchema.index({ platform: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SocialActual', SocialActualSchema);
