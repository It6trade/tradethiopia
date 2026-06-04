const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getPendingCommissions,
  approveCommission,
  getApprovedCommissions,
  getCommissionTotals
} = require('../controllers/commissionApprovalController');

// All routes are protected and require finance role
const financeOnly = [protect, authorize('finance', 'admin')];

router.route('/pending')
  .get(financeOnly, getPendingCommissions);

router.route('/approved')
  .get(financeOnly, getApprovedCommissions);

router.route('/totals')
  .get(financeOnly, getCommissionTotals);

router.route('/approve/:id')
  .post(financeOnly, approveCommission);

module.exports = router;
