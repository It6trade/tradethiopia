const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const controller = require('../controllers/attendanceIntegrationController');

const router = express.Router();
router.use(protect, authorize('HR', 'hr', 'admin'));

router.get('/mappings', asyncHandler(controller.getMappings));
router.patch('/mappings/:userId', asyncHandler(controller.updateMapping));
router.get('/connector-status', asyncHandler(controller.getConnectorStatus));
router.get('/today', asyncHandler(controller.getToday));
router.get('/history', asyncHandler(controller.getHistory));

module.exports = router;
