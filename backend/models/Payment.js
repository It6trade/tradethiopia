const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  followup: { type: mongoose.Schema.Types.ObjectId, ref: 'Followup' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  paymentNumber: { type: String, trim: true, index: true },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
  partnerType: { type: String, enum: ['customer', 'vendor', 'employee', 'other'], default: 'customer' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: { type: String, enum: ['advance','fullpayment','halfpayment', 'cash', 'bank', 'transfer', 'card', 'mobile_money'], required: true },
  amount: { type: Number },
  currency: { type: String, default: 'ETB' },
  status: { type: String, enum: ['draft', 'posted', 'reconciled', 'reversed', 'cancelled'], default: 'posted' },
  paymentDate: { type: Date, default: Date.now },
  reference: { type: String, trim: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
