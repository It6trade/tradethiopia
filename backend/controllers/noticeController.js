const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const { emitToUsers } = require('../services/chatSocketService');

const getUserDisplayName = (user) => (
  user?.fullName
  || user?.username
  || user?.email
  || 'Manager'
);

const normalizeRole = (role = '') => role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

// 1. Get All Notices with Day/Month/Year + Category + Search filters
const getNotices = async (req, res) => {
  try {
    const { department, category, day, month, year, status = 'active', search } = req.query;
    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date filtering: Day, Month, Year
    if (day) {
      const start = new Date(`${day}T00:00:00.000Z`);
      const end = new Date(`${day}T23:59:59.999Z`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filter.createdAt = { $gte: start, $lte: end };
      }
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      if (y && m) {
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        filter.createdAt = { $gte: start, $lte: end };
      }
    } else if (year) {
      const y = Number(year);
      if (y) {
        const start = new Date(Date.UTC(y, 0, 1));
        const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }, { authorName: searchRegex }];
    }

    const notices = await Notice.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    const currentUserIdStr = String(req.user?._id || req.user?.id || '');

    // Add hasViewed flag for the current user
    const processedNotices = notices.map((notice) => {
      const hasViewed = Array.isArray(notice.views) && notice.views.some((v) => String(v.user) === currentUserIdStr);
      return {
        ...notice,
        hasViewed,
      };
    });

    res.json({ success: true, data: processedNotices });
  } catch (error) {
    console.error('getNotices error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Notice Stats (for dashboard summaries)
const getNoticeStats = async (req, res) => {
  try {
    const { department = 'Customer Service' } = req.query;
    const baseFilter = department !== 'All' ? { department } : {};

    const [totalNotices, activeNotices, totalViewsResult, categoryCounts] = await Promise.all([
      Notice.countDocuments(baseFilter),
      Notice.countDocuments({ ...baseFilter, status: 'active' }),
      Notice.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
      ]),
      Notice.aggregate([
        { $match: { ...baseFilter, status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    const [todayCount, thisMonthCount] = await Promise.all([
      Notice.countDocuments({ ...baseFilter, createdAt: { $gte: todayStart } }),
      Notice.countDocuments({ ...baseFilter, createdAt: { $gte: monthStart } }),
    ]);

    const categories = {
      training: 0,
      price_change: 0,
      update: 0,
      urgent_alert: 0,
      policy: 0,
      general: 0,
    };
    categoryCounts.forEach((c) => {
      if (c._id && categories[c._id] !== undefined) {
        categories[c._id] = c.count;
      }
    });

    res.json({
      success: true,
      stats: {
        totalNotices,
        activeNotices,
        totalViews: totalViewsResult[0]?.totalViews || 0,
        todayCount,
        thisMonthCount,
        categories,
      },
    });
  } catch (error) {
    console.error('getNoticeStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Single Notice with Viewers
const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create Notice (Manager Only or Allowed Roles) + Broadcast Notifications
const createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      category = 'general',
      department = 'Customer Service',
      priority = 'normal',
      isPinned = false,
      effectiveDate,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notice title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Notice content is required' });
    }

    const authorName = getUserDisplayName(req.user);
    const authorRole = req.user?.role || 'Customer Service Manager';

    const notice = new Notice({
      title: title.trim(),
      content: content.trim(),
      category,
      department,
      priority,
      isPinned: Boolean(isPinned),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      author: req.user?._id,
      authorName,
      authorRole,
      views: [
        {
          user: req.user?._id,
          userName: authorName,
          userRole: authorRole,
          userEmail: req.user?.email || '',
          viewedAt: new Date(),
        },
      ],
      viewCount: 1,
    });

    await notice.save();

    // Broadcast notification to all active Customer Service team members
    try {
      const csRoles = ['customerservice', 'customersuccessmanager', 'cs', 'csmanager'];
      const users = await User.find({ status: 'active' }).select('username fullName email role department status');
      
      const targetUsers = users.filter((u) => {
        const r = normalizeRole(u.role);
        const dept = (u.department || '').toLowerCase();
        return csRoles.includes(r) || dept.includes('customer');
      });

      const categoryLabels = {
        training: 'Training Update 🎓',
        price_change: 'Price Change Notice 💰',
        update: 'Important Update 📢',
        urgent_alert: 'Urgent Alert 🚨',
        policy: 'Policy Notice 📜',
        general: 'Notice 💡',
      };
      const catLabel = categoryLabels[notice.category] || 'Notice';

      const notifications = [];
      targetUsers.forEach((u) => {
        if (String(u._id) !== String(req.user?._id)) {
          notifications.push({
            user: u._id,
            text: `[${catLabel}] ${notice.title} - posted by ${authorName}.`,
            type: 'general',
            link: `/cdashboard?tab=notice-board&notice=${notice._id}`,
            metadata: {
              title: `New ${catLabel}`,
              noticeId: notice._id,
              category: notice.category,
              priority: notice.priority,
              authorName,
              actionLabel: 'Read Notice',
            },
          });
        }
      });

      if (notifications.length > 0) {
        const createdNotifications = await Notification.insertMany(notifications);
        createdNotifications.forEach((n) => {
          emitToUsers([n.user], 'notification', n);
        });
      }
    } catch (notifErr) {
      console.error('Notice broadcast notification error:', notifErr);
    }

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    console.error('createNotice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Notice
const updateNotice = async (req, res) => {
  try {
    const { title, content, category, priority, isPinned, status, effectiveDate } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    if (title !== undefined) notice.title = title.trim();
    if (content !== undefined) notice.content = content.trim();
    if (category !== undefined) notice.category = category;
    if (priority !== undefined) notice.priority = priority;
    if (isPinned !== undefined) notice.isPinned = Boolean(isPinned);
    if (status !== undefined) notice.status = status;
    if (effectiveDate !== undefined) notice.effectiveDate = new Date(effectiveDate);

    await notice.save();
    res.json({ success: true, data: notice });
  } catch (error) {
    console.error('updateNotice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete Notice
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('deleteNotice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Record Notice View (Reader Tracker)
const recordNoticeView = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const userIdStr = String(req.user?._id || req.user?.id || '');
    if (!userIdStr) {
      return res.json({ success: true, viewCount: notice.viewCount });
    }

    const existingIndex = notice.views.findIndex((v) => String(v.user) === userIdStr);
    if (existingIndex === -1) {
      notice.views.push({
        user: req.user._id,
        userName: getUserDisplayName(req.user),
        userRole: req.user.role || 'Customer Service',
        userEmail: req.user.email || '',
        viewedAt: new Date(),
      });
      notice.viewCount = notice.views.length;
      await notice.save();
    }

    res.json({
      success: true,
      viewCount: notice.viewCount,
      views: notice.views,
      hasViewed: true,
    });
  } catch (error) {
    console.error('recordNoticeView error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Toggle Pin
const togglePinNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    notice.isPinned = !notice.isPinned;
    await notice.save();
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotices,
  getNoticeStats,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  recordNoticeView,
  togglePinNotice,
};
