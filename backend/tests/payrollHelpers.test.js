const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveHrNetFromRecord,
  reapplyFinanceAdjustments
} = require('../controllers/payrollController');

test('deriveHrNetFromRecord preserves explicit finance adjustments without double-counting commission', () => {
  const baseNet = 5000;

  const derivedNet = deriveHrNetFromRecord({
    netSalary: baseNet,
    financeAllowances: 0,
    financeDeductions: 250
  }, baseNet);

  assert.equal(derivedNet, 4750);
});

test('reapplyFinanceAdjustments keeps finance allowances and deductions separate from commission totals', () => {
  const adjusted = reapplyFinanceAdjustments(4000, {
    financeAllowances: 150,
    financeDeductions: 80,
    salesCommission: 1200
  });

  assert.equal(adjusted.financeAllowances, 150);
  assert.equal(adjusted.financeDeductions, 80);
  assert.equal(adjusted.netSalary, 4000 + 150 - 80);
});
