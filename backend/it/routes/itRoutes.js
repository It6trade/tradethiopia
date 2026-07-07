const express = require('express');
const router = express.Router();
const itController = require('../controllers/itController');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch (error) {
    console.warn('IT optional auth failed:', error.message);
  }
  next();
};

router.use(optionalAuth);

// NOTE: Auth checks removed for now to allow IT UI to function without tokens during local use.
router.get('/', itController.getTasks);

// Reports
router.get('/reports/all', itController.getReports);
router.get('/reports/:id', itController.getReportById);
router.put('/reports/:id', itController.updateReport);
router.post('/reports', itController.createReport);

// Audit
router.get('/audit/all', itController.getAuditLog);

// Task routes
router.get('/:id', itController.getTaskById);
router.post('/', itController.createTask);
router.post('/:id/comments', itController.addTaskComment);
router.post('/:id/approve', itController.approveTask);
router.post('/:id/workflow', itController.updateWorkflow);
router.post('/:id/reassign', itController.reassignTask);
router.post('/:id/reminders', itController.addReminder);
router.patch('/:id/reminders/:reminderId', itController.updateReminder);
router.put('/:id', itController.updateTask);
router.delete('/:id', itController.deleteTask);

module.exports = router;
