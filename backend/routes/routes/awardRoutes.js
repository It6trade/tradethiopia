const express = require('express');
const router = express.Router();
const awardController = require('../controllers/awardController');
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/calculate', protect, isAdmin, awardController.calculate);
router.get('/month/:month', protect, awardController.getByMonth);
router.get('/department/:department', protect, awardController.getByDepartment);
router.get('/details/:month/:employeeId', protect, awardController.getPerformanceDetail);

module.exports = router;
