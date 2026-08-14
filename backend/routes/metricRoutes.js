const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metricController');

router.get('/revenue-actuals', metricController.listRevenue);
router.post('/revenue-actuals', metricController.upsertRevenue);

router.get('/social-actuals', metricController.listSocial);
router.post('/social-actuals', metricController.upsertSocial);
router.get('/social-weekly-kpis', metricController.listSocialWeeklyKpis);
router.post('/social-weekly-kpis', metricController.upsertSocialWeeklyKpi);

module.exports = router;

