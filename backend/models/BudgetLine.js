const mongoose = require('mongoose');

const budgetLineSchema = new mongoose.Schema({
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: true, min: 0 },
  consumedAmount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BudgetLine', budgetLineSchema);
