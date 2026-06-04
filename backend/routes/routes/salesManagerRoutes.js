const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getAllSales,
  updateSupervisorComment,
  getAllAgents,
  getTeamPerformance,
  getDashboardStats,
  getAgentSales,
  importSales
} = require('../controllers/salesManagerController');

// All routes are protected
// All endpoints allow Sales Manager, HR, Finance, and Admin roles to access data
router.route('/all-sales')
  .get(protect, authorize('salesmanager', 'hr', 'HR', 'finance', 'Finance', 'admin'), getAllSales);

router.route('/sales/:id/supervisor-comment')
  .put(protect, authorize('salesmanager'), updateSupervisorComment);

router.route('/agents')
  .get(protect, authorize('salesmanager'), getAllAgents);

router.route('/team-performance')
  .get(protect, authorize('salesmanager', 'coo'), getTeamPerformance);

router.route('/dashboard-stats')
  .get(protect, authorize('salesmanager'), getDashboardStats);

router.route('/agent-sales/:agentId')
  .get(protect, authorize('salesmanager'), getAgentSales);

router.route('/import-sales')
  .post(protect, authorize('salesmanager', 'hr', 'HR', 'finance', 'Finance', 'admin'), importSales);

module.exports = router;
