const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const financeController = require('../controllers/financeController');

router.get('/metrics', financeController.getMetrics);
router.get('/summary', protect, financeController.getFinanceSummary);
router.get('/revenue-report', financeController.getRevenueReport);
router.get('/expense-report', financeController.getExpenseReport);
router.get('/agent-sales-performance', protect, financeController.getAgentSalesPerformance);
router.get('/purchase-summary', protect, financeController.getPurchaseSummary);
router.get('/recent-purchases', protect, financeController.getRecentPurchases);
router.get('/revenue-summary', financeController.getRevenueSummary);

module.exports = router;
