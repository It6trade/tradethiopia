const express = require('express');
const router = express.Router();
const awardController = require('../controllers/awardController');
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/calculate', protect, isAdmin, awardController.calculate);
router.get('/performances/:month', protect, isAdmin, awardController.getPerformancesByMonth);
router.put('/performance/:id', protect, isAdmin, awardController.updatePerformance);
router.get('/month/:month', protect, awardController.getByMonth);
router.get('/department/:department', protect, awardController.getByDepartment);
router.get('/details/:month/:employeeId', protect, awardController.getPerformanceDetail);

module.exports = router;
