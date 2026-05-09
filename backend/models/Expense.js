const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, trim: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'ETB' },
  expenseDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'paid', 'posted', 'reconciled', 'reversed'],
    default: 'submitted',
    index: true
  },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversedByEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
