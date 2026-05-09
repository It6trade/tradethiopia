const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, trim: true },
  currency: { type: String, default: 'ETB' },
  type: { type: String, enum: ['bank', 'cash', 'mobile_money'], default: 'bank' },
  ledgerAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
