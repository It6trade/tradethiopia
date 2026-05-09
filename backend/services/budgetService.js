const Budget = require('../models/Budget');
const BudgetLine = require('../models/BudgetLine');
const BudgetConsumption = require('../models/BudgetConsumption');

class BudgetError extends Error {
  constructor(message, statusCode = 409) {
    super(message);
    this.name = 'BudgetError';
    this.statusCode = statusCode;
  }
}

const checkAndConsumeBudget = async ({ sourceType, sourceId, account, amount, department = '', branch = '', userId, session }) => {
  const budget = await Budget.findOne({
    status: 'active',
    $and: [
      { $or: [{ department }, { department: '' }, { department: { $exists: false } }] },
      { $or: [{ branch }, { branch: '' }, { branch: { $exists: false } }] }
    ]
  }).session(session || null);

  if (!budget) return { status: 'no_budget' };

  const line = await BudgetLine.findOne({ budget: budget._id, account }).session(session || null);
  if (!line) return { status: 'no_budget_line', budget };

  const requested = Number(amount || 0);
  const available = Number(line.amount || 0) - Number(line.consumedAmount || 0);
  const policyResult = requested > available ? (budget.policy === 'block' ? 'blocked' : 'warning') : 'within_budget';

  if (policyResult === 'blocked') {
    throw new BudgetError(`Budget exceeded by ${(requested - available).toFixed(2)} for account ${account}`);
  }

  const [consumption] = await BudgetConsumption.create([{
    budget: budget._id,
    budgetLine: line._id,
    sourceType,
    sourceId,
    amount: requested,
    policyResult,
    createdBy: userId
  }], { session });

  line.consumedAmount = Number((Number(line.consumedAmount || 0) + requested).toFixed(2));
  await line.save({ session });

  return { status: policyResult, budget, budgetLine: line, consumption };
};

const checkBudgetAvailability = async ({ account, amount, department = '', branch = '', session }) => {
  const budget = await Budget.findOne({
    status: 'active',
    $and: [
      { $or: [{ department }, { department: '' }, { department: { $exists: false } }] },
      { $or: [{ branch }, { branch: '' }, { branch: { $exists: false } }] }
    ]
  }).session(session || null);

  if (!budget) return { status: 'no_budget' };

  const line = await BudgetLine.findOne({ budget: budget._id, account }).session(session || null);
  if (!line) return { status: 'no_budget_line', budget };

  const requested = Number(amount || 0);
  const available = Number(line.amount || 0) - Number(line.consumedAmount || 0);
  const policyResult = requested > available ? (budget.policy === 'block' ? 'blocked' : 'warning') : 'within_budget';

  if (policyResult === 'blocked') {
    throw new BudgetError(`Budget exceeded by ${(requested - available).toFixed(2)} for account ${account}`);
  }

  return { status: policyResult, budget, budgetLine: line, requested, available };
};

module.exports = {
  BudgetError,
  checkBudgetAvailability,
  checkAndConsumeBudget
};
