const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  code: { type: String, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  taxId: { type: String, trim: true },
  address: { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
