const test = require('node:test');
const assert = require('node:assert/strict');

const { selectLatestAttendanceRecord } = require('../controllers/payrollController');

test('selectLatestAttendanceRecord prefers the most recent attendance entry for finance deductions', () => {
  const records = [
    { date: '2026-06-01T00:00:00.000Z', financeDeductions: 0 },
    { date: '2026-06-15T00:00:00.000Z', financeDeductions: 250 },
    { date: '2026-06-10T00:00:00.000Z', financeDeductions: 75 }
  ];

  const latest = selectLatestAttendanceRecord(records);

  assert.equal(latest.financeDeductions, 250);
  assert.equal(latest.date, '2026-06-15T00:00:00.000Z');
});
