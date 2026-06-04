const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTask,
  getTasksForManager,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');

// All routes are protected
router.route('/')
  .post(protect, createTask)
  .get(protect, getTasksForManager);

// Get tasks assigned to the logged-in user (sales rep)
router.route('/my-tasks')
  .get(protect, getMyTasks);

// Get task statistics for dashboard
router.route('/stats')
  .get(protect, getTaskStats);

// Routes for specific tasks
router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;