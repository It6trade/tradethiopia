const ContentPlan = require('../models/ContentPlan');
const ContentTrackerEntry = require('../models/ContentTrackerEntry');

const GLOBAL_PLAN_ACCESS_ROLES = new Set(['salesmanager', 'socialmediamanager', 'socialmedia', 'admin', 'finance', 'hr', 'coo']);
const normalizeRole = (role = '') => role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const hasGlobalAccess = (user) => GLOBAL_PLAN_ACCESS_ROLES.has(normalizeRole(user?.role));

// Helper to map ContentPlan types to ContentTrackerEntry types
const mapTypeToTracker = (planType) => {
  const mapping = {
    'Video': 'Video',
    'Poster': 'Graphics',
    'Carousel': 'Graphics',
    'Article': 'Graphics',
    'Story': 'Graphics',
    'Live': 'Live Session',
    'Live Stream': 'Live Session',
    'Graphics': 'Graphics',
    'Live Session': 'Live Session',
    'Testimonial': 'Testimonial',
    'Bulk Email': 'Bulk Email',
    'Messages': 'Messages',
    'Leads': 'Leads'
  };
  return mapping[planType] || 'Video';
};

// Get all plans
exports.getPlans = async (req, res) => {
  try {
    const query = {};
    if (!hasGlobalAccess(req.user) && req.user?._id) {
      query.createdBy = req.user._id;
    }

    const plans = await ContentPlan.find(query)
      .sort({ scheduledDate: 1 })
      .populate('createdBy', 'fullName username email')
      .populate('trackerEntryId');

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('ContentPlanController.getPlans', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new plan
exports.createPlan = async (req, res) => {
  try {
    const {
      title,
      topic = '',
      description = '',
      type = 'Video',
      platform = '',
      scheduledDate,
      slot = '9:00 AM',
      day = 'Mon',
      staff = '',
      approval = 'Draft',
      completed = false
    } = req.body;

    const planTitle = title || topic || 'Untitled Plan';
    const targetScheduledDate = scheduledDate ? new Date(scheduledDate) : new Date();

    let trackerEntryId = null;

    // Sync immediately if marked completed OR approval status is Scheduled or Posted
    if (completed || approval === 'Scheduled' || approval === 'Posted') {
      const trackerType = mapTypeToTracker(type);
      const trackerEntry = await ContentTrackerEntry.create({
        title: planTitle,
        description: description || `Plan for ${type} on ${platform} (${approval})`,
        type: trackerType,
        platform: platform || '',
        approved: completed === true || approval === 'Posted', // Toggled by completed status or 'Posted' approval
        date: targetScheduledDate,
        createdBy: req.user ? req.user._id : undefined
      });
      trackerEntryId = trackerEntry._id;
    }

    const plan = await ContentPlan.create({
      title: planTitle,
      topic: topic || title || 'Untitled Plan',
      description,
      type,
      platform,
      scheduledDate: targetScheduledDate,
      slot,
      day,
      staff,
      approval,
      completed,
      trackerEntryId,
      createdBy: req.user ? req.user._id : undefined
    });

    const populatedPlan = await ContentPlan.findById(plan._id)
      .populate('createdBy', 'fullName username email')
      .populate('trackerEntryId');

    res.status(201).json({ success: true, data: populatedPlan });
  } catch (error) {
    console.error('ContentPlanController.createPlan', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await ContentPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Content plan not found' });
    }

    const wasCompleted = plan.completed;
    const previousApproval = plan.approval;
    const {
      title,
      topic,
      description,
      type,
      platform,
      scheduledDate,
      slot,
      day,
      staff,
      approval,
      completed
    } = req.body;

    // Update fields on the plan
    if (title !== undefined) {
      plan.title = title;
      plan.topic = title;
    }
    if (topic !== undefined) {
      plan.topic = topic;
      if (title === undefined) plan.title = topic;
    }
    if (description !== undefined) plan.description = description;
    if (type !== undefined) plan.type = type;
    if (platform !== undefined) plan.platform = platform;
    if (scheduledDate !== undefined) plan.scheduledDate = new Date(scheduledDate);
    if (slot !== undefined) plan.slot = slot;
    if (day !== undefined) plan.day = day;
    if (staff !== undefined) plan.staff = staff;
    if (approval !== undefined) plan.approval = approval;

    if (completed !== undefined) {
      plan.completed = completed;
      // Auto-transition approval status if completion toggled
      if (completed && plan.approval !== 'Posted') {
        plan.approval = 'Posted';
      } else if (!completed && plan.approval === 'Posted') {
        plan.approval = 'Scheduled';
      }
    }

    const isSyncedState = plan.completed || plan.approval === 'Scheduled' || plan.approval === 'Posted';

    // Sync with ContentTrackerEntry
    if (isSyncedState) {
      if (!plan.trackerEntryId) {
        // Create matching tracker entry if not linked
        const trackerType = mapTypeToTracker(plan.type);
        const trackerEntry = await ContentTrackerEntry.create({
          title: plan.title || plan.topic || 'Untitled Plan',
          description: plan.description || `Plan for ${plan.type} on ${plan.platform} (${plan.approval})`,
          type: trackerType,
          platform: plan.platform || '',
          approved: plan.completed === true || plan.approval === 'Posted',
          date: plan.scheduledDate || new Date(),
          createdBy: req.user ? req.user._id : undefined
        });
        plan.trackerEntryId = trackerEntry._id;
      } else {
        // Update linked entry details
        await ContentTrackerEntry.updateOne(
          { _id: plan.trackerEntryId },
          {
            title: plan.title,
            description: plan.description || `Plan for ${plan.type} on ${plan.platform} (${plan.approval})`,
            type: mapTypeToTracker(plan.type),
            platform: plan.platform || '',
            approved: plan.completed === true || plan.approval === 'Posted',
            date: plan.scheduledDate
          }
        );
      }
    } else {
      // Not in a synced state anymore (e.g. Draft / Incomplete): delete tracker entry
      if (plan.trackerEntryId) {
        await ContentTrackerEntry.deleteOne({ _id: plan.trackerEntryId });
        plan.trackerEntryId = null;
      }
    }

    await plan.save();

    const populatedPlan = await ContentPlan.findById(plan._id)
      .populate('createdBy', 'fullName username email')
      .populate('trackerEntryId');

    res.json({ success: true, data: populatedPlan });
  } catch (error) {
    console.error('ContentPlanController.updatePlan', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await ContentPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Content plan not found' });
    }

    // If there is an associated tracker entry, delete it as well
    if (plan.trackerEntryId) {
      await ContentTrackerEntry.deleteOne({ _id: plan.trackerEntryId });
    }

    await plan.deleteOne();
    res.json({ success: true, message: 'Content plan deleted successfully' });
  } catch (error) {
    console.error('ContentPlanController.deletePlan', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
