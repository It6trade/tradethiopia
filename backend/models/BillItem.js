const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', index: true },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  total: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BillItem', billItemSchema);
