const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['vat', 'withholding', 'income', 'other'], default: 'vat' },
  rate: { type: Number, required: true, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  active: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Tax', taxSchema);
