const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metricController');
const { getKpis, upsertKpiTarget } = require('../controllers/cooDashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.get('/revenue-actuals', metricController.listRevenue);
router.post('/revenue-actuals', metricController.upsertRevenue);

router.get('/social-actuals', metricController.listSocial);
router.post('/social-actuals', metricController.upsertSocial);
router.get('/social-weekly-kpis', metricController.listSocialWeeklyKpis);
router.post('/social-weekly-kpis', metricController.upsertSocialWeeklyKpi);
router.get('/coo-dashboard/kpis', protect, getKpis);
router.put('/coo-dashboard/kpi-target', protect, authorize('COO', 'CEO', 'admin'), upsertKpiTarget);

module.exports = router;

