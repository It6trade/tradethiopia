const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  total: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('InvoiceItem', invoiceItemSchema);
