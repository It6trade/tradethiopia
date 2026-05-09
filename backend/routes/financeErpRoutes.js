const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireFinancePermission } = require('../middleware/financePermissions');
const {
  requireFields,
  validatePositiveAmount,
  validateJournalLines
} = require('../validation/financeValidation');
const controller = require('../controllers/financeErpController');

router.use(protect);

router.get('/dashboard', requireFinancePermission('finance:read'), controller.getDashboard);
router.get('/reports', requireFinancePermission('finance:reports'), controller.getReports);
router.get('/reports/aging/:type', requireFinancePermission('can_export_financials'), controller.getAgeingReport);
router.get('/jobs', requireFinancePermission('finance:read'), controller.listJobs);
router.post('/jobs/:name', requireFinancePermission('can_export_financials'), controller.enqueueFinanceJob);

router.post('/invoices/:id/submit', requireFinancePermission('can_create_invoice'), controller.submitInvoice);
router.post('/invoices/:id/approve', requireFinancePermission('can_approve_invoice'), controller.approveInvoice);
router.post('/invoices/:id/post', requireFinancePermission('can_post_invoice'), controller.postInvoice);
router.post('/invoices/:id/overdue', requireFinancePermission('can_post_invoice'), controller.markInvoiceOverdue);
router.post('/invoices/:id/cancel', requireFinancePermission('can_reverse_invoice'), controller.cancelInvoice);
router.post('/invoices/:id/reverse', requireFinancePermission('can_reverse_invoice'), controller.reverseInvoice);

router.post('/bills/:id/submit', requireFinancePermission('can_create_bill'), controller.submitBill);
router.post('/bills/:id/approve', requireFinancePermission('can_approve_bill'), controller.approveBill);
router.post('/bills/:id/post', requireFinancePermission('can_post_bill'), controller.postBill);
router.post('/bills/:id/pay', requireFinancePermission('finance:write'), validatePositiveAmount('amount'), controller.payBill);
router.post('/bills/:id/close', requireFinancePermission('can_post_bill'), controller.closeBill);
router.post('/bills/:id/reverse', requireFinancePermission('can_reverse_bill'), controller.reverseBill);

router.post('/expenses/:id/approve', requireFinancePermission('can_approve_bill'), controller.approveExpense);
router.post('/expenses/:id/pay', requireFinancePermission('finance:write'), controller.payExpense);
router.post('/expenses/:id/post', requireFinancePermission('can_post_journal'), controller.postExpense);
router.post('/expenses/:id/reverse', requireFinancePermission('can_reverse_journal'), controller.reverseExpense);

router.post('/journals/:id/post', requireFinancePermission('can_post_journal'), controller.postJournal);
router.post('/journals/:id/reverse', requireFinancePermission('can_reverse_journal'), controller.reverseJournal);
router.post('/payments/:id/post', requireFinancePermission('can_post_journal'), controller.postPayment);
router.post('/payments/:id/reverse', requireFinancePermission('can_reverse_journal'), controller.reversePayment);
router.post('/payroll/:id/post', requireFinancePermission('can_edit_payroll'), controller.postPayroll);
router.post('/commissions/:id/post', requireFinancePermission('can_post_journal'), controller.postCommission);

router.post('/bank/statements', requireFinancePermission('can_reconcile_bank'), controller.createBankStatement);
router.post('/bank/reconcile', requireFinancePermission('can_reconcile_bank'), controller.reconcileBank);
router.post('/inventory/purchases/:id/post', requireFinancePermission('can_post_journal'), controller.postInventoryPurchase);
router.post('/inventory/deliveries/:id/post-cogs', requireFinancePermission('can_post_journal'), controller.postInventoryDelivery);
router.post('/inventory/adjustments/:id/post', requireFinancePermission('can_post_journal'), controller.postInventoryAdjustment);
router.post('/periods/:id/close', requireFinancePermission('can_close_period'), controller.closePeriod);
router.post('/periods/:id/reopen', requireFinancePermission('can_close_period'), controller.reopenPeriod);
router.post('/month-end-close', requireFinancePermission('can_close_period'), controller.createMonthEndClose);

router.post(
  '/workflow/sales-order',
  requireFinancePermission('finance:write'),
  requireFields('customer', 'items'),
  controller.createSalesWorkflow
);

router.post(
  '/workflow/purchase-order',
  requireFinancePermission('finance:write'),
  requireFields('vendor', 'items'),
  controller.createPurchaseWorkflow
);

router.post(
  '/workflow/expense-request',
  requireFinancePermission('finance:write'),
  requireFields('category', 'amount'),
  validatePositiveAmount('amount'),
  controller.createExpenseWorkflow
);

router.post('/budgets', requireFinancePermission('can_manage_budget'), controller.createResource);
router.post('/budgetLines', requireFinancePermission('can_manage_budget'), controller.createResource);
router.put('/budgets/:id', requireFinancePermission('can_manage_budget'), controller.updateResource);
router.put('/budgetLines/:id', requireFinancePermission('can_manage_budget'), controller.updateResource);
router.post('/approvalPolicies', requireFinancePermission('can_manage_approval_policy'), controller.createResource);
router.put('/approvalPolicies/:id', requireFinancePermission('can_manage_approval_policy'), controller.updateResource);

router.get('/:resource', requireFinancePermission('finance:read'), controller.listResource);

router.post(
  '/:resource',
  requireFinancePermission('finance:write'),
  (req, res, next) => req.params.resource === 'journalEntries' ? validateJournalLines(req, res, next) : next(),
  controller.createResource
);

router.put('/:resource/:id', requireFinancePermission('finance:write'), controller.updateResource);

module.exports = router;
