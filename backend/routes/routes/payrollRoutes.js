const express = require('express');
const router = express.Router();
const {
  getPayrollList,
  calculatePayrollForAll,
  submitHRAdjustment,
  submitFinanceAdjustment,
  getPayrollDetails,
  finalizePayrollForFinance,
  getPayrollHistory,
  approvePayroll,
  lockPayroll,
  submitCommission,
  getCommissionByUser,
  clearCommissionRecord,
  getSalesDataForCommission,
  deletePayrollRecord
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// All payroll routes require authentication
router.use(protect);

// More specific routes should come before generic ones

// GET /payroll/commission/:userId → Get commission data for a user
// Access: Admin, Finance, HR
router.get('/commission/:userId', authorize('admin', 'finance', 'Finance', 'hr', 'HR'), getCommissionByUser);

// GET /payroll/sales-data/:agentId → Get sales data for commission calculation
// Access: Admin, Finance, HR
router.get('/sales-data/:agentId', authorize('admin', 'finance', 'Finance', 'hr', 'HR'), getSalesDataForCommission);

// GET /payroll/:userId/details → detailed payroll view
// Access: HR, Finance, Admin, Employee (own data only)
router.get('/:userId/details', getPayrollDetails);

// GET /payroll/history ƒ+' List payroll history
router.get('/history', authorize('admin', 'finance', 'Finance', 'hr', 'HR'), getPayrollHistory);

// GET /payroll/:month → full payroll list
// Access: HR, Finance, Admin
router.get('/:month', getPayrollList);

// POST /payroll/calculate → run payroll engine
// Access: Admin, HR
router.post('/calculate', authorize('admin', 'hr', 'HR'), calculatePayrollForAll);

// POST /payroll/hr-adjust → HR attendance submission
// Access: HR
router.post('/hr-adjust', authorize('HR', 'hr'), submitHRAdjustment);

// POST /payroll/finance-adjust → Finance allowances & deductions
// Access: Finance
router.post('/finance-adjust', authorize('finance', 'Finance'), submitFinanceAdjustment);

// POST /payroll/commission → Submit or update commission data
// Access: Admin, Finance
router.post('/commission', authorize('admin', 'finance', 'Finance'), submitCommission);

// DELETE /payroll/commission ƒ+' Clear saved commission data
// Access: Admin, Finance
router.delete('/commission', authorize('admin', 'finance', 'Finance'), clearCommissionRecord);

// POST /payroll/:id/finalize ƒ+' Finance finalization
router.post('/:id/finalize', authorize('finance', 'Finance', 'admin', 'Admin'), finalizePayrollForFinance);

// PUT /payroll/:id/approve → Approve payroll
// Access: Admin, Finance
router.put('/:id/approve', authorize('admin', 'finance', 'Finance'), approvePayroll);

// PUT /payroll/:id/lock → Lock payroll
// Access: Admin
router.put('/:id/lock', authorize('admin'), lockPayroll);

// DELETE /payroll/:id — Delete payroll entry
// Access: Admin, Finance
router.delete('/:id', authorize('admin', 'finance', 'Finance'), deletePayrollRecord);

module.exports = router;
