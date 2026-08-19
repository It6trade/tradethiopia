const Notification = require("../models/Notification.js"); // Use require for CommonJS
const User = require("../models/user.model.js");
const { syncAllApproachingLicenses } = require("../services/documentLicenseReminderService.js");

const HR_ROLES = new Set(['hr', 'HR', 'admin', 'Admin']);

const getNotifications = async (req, res) => {
  try {
    const isHrUser = HR_ROLES.has(String(req.user?.role || ''));
    if (isHrUser) {
      // Silently sync approaching company licenses so HR gets up-to-date alerts
      syncAllApproachingLicenses(req.app).catch((err) =>
        console.error('License reminder sync error in getNotifications:', err)
      );
    }

    const notifications = await Notification.find({
      user: req.user._id,
      $or: [
        { read: false },
        { type: 'reminder', 'metadata.keepVisible': true },
      ],
    }).sort({ createdAt: -1 });
    res.json(notifications.map((notification) => {
      const item = notification.toObject();
      if (['comment', 'task', 'reminder'].includes(item.type) && !item.link && item.itTaskId) {
        item.link = `/it?tab=projects&task=${item.itTaskId}${item.commentId ? `&comment=${item.commentId}` : ''}`;
      }
      if (item.type === 'risk document' || item.category === 'risk document') {
        item.category = 'risk document';
        item.link = item.link || '/documentlist';
        item.metadata = {
          title: 'Risk Document Alert',
          actionLabel: 'View Risk Document',
          category: 'risk document',
          isRiskDocument: true,
          isHazard: true,
          ...(item.metadata || {}),
        };
      }
      if (item.type === 'comment') {
        item.metadata = {
          title: 'New task comment',
          actionLabel: 'View comment',
          ...(item.metadata || {}),
        };
      }
      if (item.type === 'task') {
        item.metadata = {
          title: 'IT task update',
          actionLabel: 'View task',
          ...(item.metadata || {}),
        };
      }
      if (item.type === 'reminder') {
        item.metadata = {
          title: 'Task reminder',
          actionLabel: 'Open reminder',
          keepVisible: true,
          ...(item.metadata || {}),
        };
      }
      return item;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Broadcast notification to all users or filtered departments
const broadcastNotification = async (req, res) => {
  const { title = 'Notice', message = '', departments = [], audience } = req.body || {};
  if (!message.trim() && !title.trim()) {
    return res.status(400).json({ message: 'Title or message is required' });
  }

  // Map department labels to role values on the User model
  try {
    const shouldSendToAll = audience === 'all' || (req.user && req.user.role === 'COO');
    const roleFilter = !shouldSendToAll && Array.isArray(departments) && departments.length
      ? departments.map((d) => (d || '').toString())
      : [];

    let users;

    if (shouldSendToAll) {
      users = await User.find({}).select('_id role');
    } else {
      users = await User.find(
        roleFilter.length ? { role: { $in: roleFilter } } : {}
      ).select('_id role');
    }

    // Fallback: if filtered search returns nothing, send to all users
    if (!users.length) {
      users = await User.find({}).select('_id role');
    }

    const docs = (users || []).map((u) => ({
      user: u._id,
      text: title ? `${title}: ${message}` : message,
      type: 'general',
    }));

    const created = await Notification.insertMany(docs);
    res.json({ message: 'Broadcast sent', count: created.length });
  } catch (err) {
    console.error('Broadcast error', err);
    res.status(500).json({ message: 'Failed to send broadcast' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification
};
