const SalesTarget = require('../models/SalesTarget');
const User = require('../models/user.model');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Set or update sales targets for an agent
// @route   POST /api/sales-targets
// @access  Private (Sales Manager only)
const setSalesTarget = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    const {
      agentId,
      agentName,
      weeklySalesTarget,
      monthlySalesTarget,
      periodType,
      periodStart,
      periodEnd
    } = req.body;

    // Validate required fields
    if (!agentId || !periodType || !periodStart || !periodEnd) {
      res.status(400);
      throw new Error('Agent ID, period type, start date, and end date are required.');
    }

    // Check if agent exists - handle both numeric IDs and MongoDB ObjectIds
    let agent = null;
    
    // If agentId looks like a MongoDB ObjectId, use findById
    if (mongoose.Types.ObjectId.isValid(agentId)) {
      try {
        agent = await User.findById(agentId);
      } catch (findError) {
        console.error('Error finding agent by ObjectId:', findError);
      }
    }
    
    // If we didn't find the agent or agentId is not an ObjectId, try other methods
    if (!agent) {
      // Try finding by _id field (in case it's stored differently)
      agent = await User.findOne({ _id: agentId });
    }
    
    // If still not found, and agentId is numeric, this might be a mock scenario
    // In a real implementation, we would require a valid user
    if (!agent && typeof agentId === 'number') {
      // For mock purposes, we'll allow this but log a warning
      console.warn('Using mock agent ID - in production this should be a valid MongoDB ObjectId');
      agent = {
        _id: agentId.toString(),
        fullName: agentName || 'Mock Agent',
        username: agentName || 'mock_agent'
      };
    }

    // If still no agent found, return error
    if (!agent) {
      res.status(404);
      throw new Error('Agent not found.');
    }

    // Validate dates
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
    }

    // Check if a target already exists for this agent and period
    let salesTarget = await SalesTarget.findOne({
      agentId,
      periodStart: startDate,
      periodEnd: endDate
    });

    if (salesTarget) {
      // Update existing target
      salesTarget.weeklySalesTarget = weeklySalesTarget || 0;
      salesTarget.monthlySalesTarget = monthlySalesTarget || 0;
      salesTarget.periodType = periodType;
      salesTarget.updatedAt = Date.now();

      await salesTarget.save();
    } else {
      // Create new target
      salesTarget = new SalesTarget({
        agentId,
        agentName: agentName || agent.fullName || agent.username,
        weeklySalesTarget: weeklySalesTarget || 0,
        monthlySalesTarget: monthlySalesTarget || 0,
        periodType,
        periodStart: startDate,
        periodEnd: endDate
      });

      await salesTarget.save();
      
      // Create notification for the agent
      const periodText = periodType === 'weekly' ? 'week' : 'month';
      const targetValue = periodType === 'weekly' ? weeklySalesTarget : monthlySalesTarget;
      
      const notification = new Notification({
        user: agentId,
        text: `New sales target set: ${targetValue} sales for this ${periodText}`,
        type: 'target',
        targetId: salesTarget._id
      });
      
      await notification.save();
      
      // Emit real-time notification to the assigned user
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const userSocketId = connectedUsers.get(agentId);
      
      if (userSocketId) {
        // Send notification to the specific user
        io.to(userSocketId).emit('newNotification', {
          id: notification._id,
          text: notification.text,
          read: notification.read,
          type: notification.type,
          targetId: notification.targetId,
          createdAt: notification.createdAt
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sales target set successfully',
      data: salesTarget
    });
  } catch (error) {
    console.error('Error in setSalesTarget:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting sales target',
      error: error.message
    });
  }
});

// @desc    Get sales targets for an agent
// @route   GET /api/sales-targets/:agentId
// @access  Private (Sales Manager or the agent themselves)
const getSalesTargets = asyncHandler(async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Log for debugging
    console.log('User ID:', req.user._id.toString());
    console.log('Agent ID from params:', agentId);
    console.log('User role:', req.user.role);
    
    // Check if user is a sales manager or if they're requesting their own targets
    const isSalesManager = req.user.role === 'salesmanager';
    
    // Convert both IDs to strings for comparison
    const userIdStr = req.user._id.toString();
    const agentIdStr = agentId.toString();
    const isOwnTargets = userIdStr === agentIdStr;
    
    console.log('Is sales manager:', isSalesManager);
    console.log('Is own targets:', isOwnTargets);
    console.log('User ID String:', userIdStr);
    console.log('Agent ID String:', agentIdStr);
    
    // Allow access if user is a sales manager OR if they're requesting their own targets
    if (!isSalesManager && !isOwnTargets) {
      res.status(403);
      throw new Error('Access denied. You can only view your own targets or you must be a sales manager.');
    }

    const { periodType, startDate, endDate } = req.query;

    // Build query
    const query = { agentId };

    if (periodType) {
      query.periodType = periodType;
    }

    if (startDate || endDate) {
      query.periodStart = {};
      query.periodEnd = {};

      if (startDate) {
        query.periodStart.$gte = new Date(startDate);
      }

      if (endDate) {
        query.periodEnd.$lte = new Date(endDate);
      }
    }

    const salesTargets = await SalesTarget.find(query).sort({ periodStart: -1 });

    res.json({
      success: true,
      count: salesTargets.length,
      data: salesTargets
    });
  } catch (error) {
    console.error('Error in getSalesTargets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales targets',
      error: error.message
    });
  }
});

// @desc    Get current sales targets for all agents
// @route   GET /api/sales-targets
// @access  Private (Sales Manager only)
const getCurrentSalesTargets = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    // Get current date
    const currentDate = new Date();

    // Find targets that are currently active
    const salesTargets = await SalesTarget.find({
      periodStart: { $lte: currentDate },
      periodEnd: { $gte: currentDate }
    }).sort({ agentId: 1, periodType: 1 });

    res.json({
      success: true,
      count: salesTargets.length,
      data: salesTargets
    });
  } catch (error) {
    console.error('Error in getCurrentSalesTargets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current sales targets',
      error: error.message
    });
  }
});

// @desc    Delete a sales target
// @route   DELETE /api/sales-targets/:id
// @access  Private (Sales Manager only)
const deleteSalesTarget = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    const { id } = req.params;

    // Find and delete the target
    const salesTarget = await SalesTarget.findByIdAndDelete(id);

    if (!salesTarget) {
      res.status(404);
      throw new Error('Sales target not found.');
    }

    // Also delete any notifications related to this target
    await Notification.deleteMany({ targetId: id });

    res.json({
      success: true,
      message: 'Sales target deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteSalesTarget:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sales target',
      error: error.message
    });
  }
});

module.exports = {
  setSalesTarget,
  getSalesTargets,
  getCurrentSalesTargets,
  deleteSalesTarget
};