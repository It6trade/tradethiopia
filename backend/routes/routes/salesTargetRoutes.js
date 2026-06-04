const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  setSalesTarget,
  getSalesTargets,
  getCurrentSalesTargets,
  deleteSalesTarget
} = require('../controllers/salesTargetController');

// All routes are protected and require sales manager role
router.route('/')
  .post(protect, authorize('salesmanager', 'sales'), setSalesTarget)
  .get(protect, authorize('salesmanager', 'sales'), getCurrentSalesTargets);

router.route('/:agentId')
  .get(protect, authorize('salesmanager', 'sales'), getSalesTargets);

router.route('/:id')
  .delete(protect, authorize('salesmanager'), deleteSalesTarget);

module.exports = router;