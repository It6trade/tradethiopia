const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  followup: { type: mongoose.Schema.Types.ObjectId, ref: 'Followup' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: { type: String, enum: ['advance','fullpayment','halfpayment'], required: true },
  amount: { type: Number },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
