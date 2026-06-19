const ContentTrackerEntry = require('../models/ContentTrackerEntry');

const ALLOWED_TYPES = new Set(['Video', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads']);
const GLOBAL_CONTENT_ACCESS_ROLES = new Set(['salesmanager', 'socialmediamanager', 'socialmedia', 'admin', 'finance', 'hr', 'coo']);

const normalizeRole = (role = '') => role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const hasGlobalContentAccess = (user) => GLOBAL_CONTENT_ACCESS_ROLES.has(normalizeRole(user?.role));

const getEntryOwnerId = (entry) => {
  if (!entry?.createdBy) return null;
  if (typeof entry.createdBy === 'object' && entry.createdBy._id) {
    return entry.createdBy._id.toString();
  }
  return entry.createdBy.toString();
};

const isEntryOwner = (entry, user) => {
  const ownerId = getEntryOwnerId(entry);
  const userId = user?._id ? user._id.toString() : null;
  if (!ownerId || !userId) return false;
  return ownerId === userId;
};

const canAccessEntry = (entry, user) => hasGlobalContentAccess(user) || isEntryOwner(entry, user);

exports.getEntries = async (req, res) => {
  try {
    const query = {};
    if (req.query.type && ALLOWED_TYPES.has(req.query.type)) {
      query.type = req.query.type;
    }

    if (req.query.platform) {
      query.platform = req.query.platform.toString().trim();
    }

    if (req.query.approved === 'true' || req.query.approved === 'false') {
      query.approved = req.query.approved === 'true';
    }

    const buildDayBoundary = (value, isStart) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      if (isStart) {
        parsed.setHours(0, 0, 0, 0);
      } else {
        parsed.setHours(23, 59, 59, 999);
      }
      return parsed;
    };

    const dateRangeFilters = {};
    if (req.query.dateFrom) {
      const startDate = buildDayBoundary(req.query.dateFrom, true);
      if (startDate) {
        dateRangeFilters.$gte = startDate;
      }
    }
    if (req.query.dateTo) {
      const endDate = buildDayBoundary(req.query.dateTo, false);
      if (endDate) {
        dateRangeFilters.$lte = endDate;
      }
    }

    if (Object.keys(dateRangeFilters).length > 0) {
      query.date = dateRangeFilters;
    } else if (req.query.date) {
      const parsedDate = new Date(req.query.date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const hasGlobalAccess = hasGlobalContentAccess(req.user);
    if (!hasGlobalAccess && req.user?._id) {
      query.createdBy = req.user._id;
    }

    const entries = await ContentTrackerEntry.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'fullName username email');

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('ContentTrackerController.getEntries', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEntryById = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id).populate('createdBy', 'fullName username email');
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }
    if (!canAccessEntry(entry, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this content entry' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.getEntryById', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const parsePositiveNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

exports.createEntry = async (req, res) => {
  try {
    const { title, description = '', type = 'Video', link = '', imageUrl = '', platform = '', approved = false, date, shares = 0 } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (type && !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: `Type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}` });
    }

    const normalizedApproved = hasGlobalContentAccess(req.user) ? approved === true : false;

    const entry = await ContentTrackerEntry.create({
      title,
      description,
      type,
      link,
      imageUrl,
      platform: platform.toString().trim(),
      approved: normalizedApproved,
      date: date ? new Date(date) : undefined,
      shares: parsePositiveNumber(shares),
      createdBy: req.user ? req.user._id : undefined,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.createEntry', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }
    if (!canAccessEntry(entry, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this content entry' });
    }
    if (
      Object.prototype.hasOwnProperty.call(req.body, 'approved') &&
      !hasGlobalContentAccess(req.user)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve content entries' });
    }

    const updatableFields = ['title', 'description', 'type', 'link', 'imageUrl', 'platform', 'approved', 'date', 'shares'];
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'type' && req.body.type && !ALLOWED_TYPES.has(req.body.type)) {
          throw new Error(`Type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}`);
        }
        if (field === 'shares') {
          entry.shares = parsePositiveNumber(req.body.shares);
          return;
        }
        if (field === 'platform') {
          entry.platform = (req.body.platform || '').toString().trim();
          return;
        }
        entry[field] = req.body[field];
      }
    });

    await entry.save();

    // Two-way sync: Find and update the linked ContentPlan
    try {
      const ContentPlan = require('../models/ContentPlan');
      const linkedPlan = await ContentPlan.findOne({ trackerEntryId: entry._id });
      if (linkedPlan) {
        if (req.body.approved !== undefined) {
          linkedPlan.completed = req.body.approved;
          if (req.body.approved) {
            linkedPlan.approval = 'Posted';
          } else {
            linkedPlan.approval = 'Scheduled';
          }
        }
        if (req.body.date !== undefined) {
          linkedPlan.scheduledDate = new Date(req.body.date);
          const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          linkedPlan.day = daysOfWeek[linkedPlan.scheduledDate.getDay()];
        }
        if (req.body.title !== undefined) {
          linkedPlan.title = req.body.title;
          linkedPlan.topic = req.body.title;
        }
        if (req.body.description !== undefined) {
          linkedPlan.description = req.body.description;
        }
        if (req.body.platform !== undefined) {
          linkedPlan.platform = req.body.platform;
        }
        if (req.body.type !== undefined) {
          linkedPlan.type = req.body.type;
        }
        await linkedPlan.save();
      }
    } catch (syncError) {
      console.error('Failed to sync updated tracker entry back to content plan', syncError);
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.updateEntry', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update entry' });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }
    if (!canAccessEntry(entry, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this content entry' });
    }

    // Two-way sync: Find and update the linked ContentPlan
    try {
      const ContentPlan = require('../models/ContentPlan');
      const linkedPlan = await ContentPlan.findOne({ trackerEntryId: entry._id });
      if (linkedPlan) {
        linkedPlan.completed = false;
        linkedPlan.approval = 'Draft';
        linkedPlan.trackerEntryId = null;
        await linkedPlan.save();
      }
    } catch (syncError) {
      console.error('Failed to sync deleted tracker entry back to content plan', syncError);
    }

    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('ContentTrackerController.deleteEntry', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
