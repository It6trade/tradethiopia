const express = require('express');
const router = express.Router();
const hrKpiController = require('../controllers/hrKpiController');

router.get('/', hrKpiController.getHrKpis);
router.post('/', hrKpiController.saveHrKpi);
router.get('/live-stats', hrKpiController.getLiveStats);

module.exports = router;
