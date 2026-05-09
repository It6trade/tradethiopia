const mongoose = require('mongoose');

const budgetConsumptionSchema = new mongoose.Schema({
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
  budgetLine: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetLine', required: true },
  sourceType: { type: String, enum: ['expense', 'purchase', 'bill'], required: true, index: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  policyResult: { type: String, enum: ['within_budget', 'warning', 'blocked'], default: 'within_budget' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

budgetConsumptionSchema.index({ sourceType: 1, sourceId: 1 });

module.exports = mongoose.model('BudgetConsumption', budgetConsumptionSchema);
