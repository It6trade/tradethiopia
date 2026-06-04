const Task = require('../models/Task');
const User = require('../models/user.model');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Sales Manager only)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, dueDate, priority } = req.body;

  // Validate required fields
  if (!title || !description || !assignedTo || !dueDate) {
    res.status(400);
    throw new Error('Please provide all required fields: title, description, assignedTo, dueDate');
  }

  // Validate that due date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  if (due < today) {
    res.status(400);
    throw new Error('Due date cannot be in the past. Please select a date starting from today.');
  }

  // Validate assignedTo is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    res.status(400);
    throw new Error('Invalid assignedTo user ID');
  }

  // Check if assignedTo user exists and is a sales representative
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    res.status(404);
    throw new Error('Assigned user not found');
  }

  if (assignedUser.role !== 'sales') {
    res.status(400);
    throw new Error('Tasks can only be assigned to sales representatives');
  }

  // Create task
  const task = new Task({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id, // From auth middleware
    dueDate,
    priority: priority || 'Medium'
  });

  const createdTask = await task.save();

  // Populate assignedTo and assignedBy fields
  await createdTask.populate('assignedTo', 'username email');
  await createdTask.populate('assignedBy', 'username email');

  // Create notification for the assigned user
  const notification = new Notification({
    user: assignedTo, // Associate notification with the assigned user
    text: `You have been assigned a new task: ${title}`,
    type: 'task',
    taskId: createdTask._id
  });
  
  await notification.save();

  // Emit real-time notification to the assigned user
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const userSocketId = connectedUsers.get(assignedTo);
  
  if (userSocketId) {
    // Send notification to the specific user
    io.to(userSocketId).emit('newNotification', {
      id: notification._id,
      text: notification.text,
      read: notification.read,
      type: notification.type,
      taskId: notification.taskId,
      createdAt: notification.createdAt
    });
  }

  res.status(201).json(createdTask);
});

// @desc    Get all tasks for a sales manager (tasks they assigned)
// @route   GET /api/tasks
// @access  Private (Sales Manager only)
const getTasksForManager = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedBy: req.user._id })
    .populate('assignedTo', 'username email')
    .populate('assignedBy', 'username email')
    .sort({ createdAt: -1 });

  res.json(tasks);
});

// @desc    Get all tasks assigned to a sales representative
// @route   GET /api/tasks/my-tasks
// @access  Private (Sales Representative only)
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('assignedTo', 'username email')
    .populate('assignedBy', 'username email')
    .sort({ dueDate: 1, priority: -1 });

  res.json(tasks);
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (Assigned user or assigning manager)
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'username email')
    .populate('assignedBy', 'username email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is authorized to view this task
  if (task.assignedTo._id.toString() !== req.user._id.toString() && 
      task.assignedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this task');
  }

  res.json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Assigned user or assigning manager)
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is authorized to update this task
  if (task.assignedTo.toString() !== req.user._id.toString() && 
      task.assignedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const { title, description, status, priority, dueDate } = req.body;

  // Validate that due date is not in the past if it's being updated
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (due < today) {
      res.status(400);
      throw new Error('Due date cannot be in the past. Please select a date starting from today.');
    }
  }

  if (title) task.title = title;
  if (description) task.description = description;
  if (status) {
    task.status = status;
    if (status === 'Completed') {
      task.completedAt = Date.now();
    }
  }
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = dueDate;

  const updatedTask = await task.save();

  // Populate assignedTo and assignedBy fields
  await updatedTask.populate('assignedTo', 'username email');
  await updatedTask.populate('assignedBy', 'username email');

  res.json(updatedTask);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Assigned user or assigning manager)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is authorized to delete this task
  if (task.assignedTo.toString() !== req.user._id.toString() && 
      task.assignedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({ message: 'Task removed successfully' });
});

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let stats = {};

  // Create a date object for today at midnight for consistent date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (userRole === 'salesmanager') {
    // For sales managers, get stats for tasks they assigned
    const totalTasks = await Task.countDocuments({ assignedBy: userId });
    const completedTasks = await Task.countDocuments({ 
      assignedBy: userId, 
      status: 'Completed' 
    });
    const pendingTasks = await Task.countDocuments({ 
      assignedBy: userId, 
      status: { $in: ['Pending', 'In Progress'] } 
    });
    const overdueTasks = await Task.countDocuments({ 
      assignedBy: userId, 
      dueDate: { $lt: today },
      status: { $ne: 'Completed' }
    });

    stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks
    };
  } else if (userRole === 'sales') {
    // For sales representatives, get stats for tasks assigned to them
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({ 
      assignedTo: userId, 
      status: 'Completed' 
    });
    const pendingTasks = await Task.countDocuments({ 
      assignedTo: userId, 
      status: { $in: ['Pending', 'In Progress'] } 
    });
    const overdueTasks = await Task.countDocuments({ 
      assignedTo: userId, 
      dueDate: { $lt: today },
      status: { $ne: 'Completed' }
    });

    stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks
    };
  } else {
    res.status(403);
    throw new Error('Not authorized to access task statistics');
  }

  res.json(stats);
});

module.exports = {
  createTask,
  getTasksForManager,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
};