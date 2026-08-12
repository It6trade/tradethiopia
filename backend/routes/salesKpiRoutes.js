const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/salesKpiController');

const router = express.Router();
router.get('/', protect, controller.list);
router.post('/bulk', protect, controller.saveBulk);
module.exports = router;
