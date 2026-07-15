const ITTask = require('../models/ITTask');
const ITReport = require('../models/ITReport');
const Notification = require('../../models/Notification');
const User = require('../../models/user.model');
const { emitToUsers } = require('../../services/chatSocketService');

const getUserDisplayName = (user) => (
  user?.fullName
  || user?.username
  || user?.email
  || 'IT User'
);

const WORKFLOW_STATUS = ['pending', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'];

const normalizeRole = (role = '') => role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const getTaskTitle = (task) => (
  task?.taskName
  || task?.client
  || task?.platform
  || task?.category
  || 'IT task'
);

const getUserAliases = (user) => (
  [
    user?._id,
    user?.id,
    user?.email,
    user?.username,
    user?.fullName,
    user?.name,
  ]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase())
);

const collectTaskParticipantAliases = (task) => (
  [
    task.taskLeader,
    ...(task.assignedTo || []),
  ]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase())
);

const isItManagerRole = (role) => ['admin', 'itmanager', 'itadmin'].includes(normalizeRole(role));
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getTaskLocation = (task) => `${task.projectType || 'IT'} / ${task.platform || task.category || task.client || 'Project Workspace'}`;

const buildTaskAccessFilter = (req, baseFilter = {}) => {
  const role = normalizeRole(req.user?.role);
  if (isItManagerRole(role)) return baseFilter;

  const aliases = getUserAliases(req.user);
  if (!aliases.length) return { ...baseFilter, _id: null };
  const aliasPatterns = aliases.map((alias) => new RegExp(`^${escapeRegex(alias)}$`, 'i'));

  return {
    ...baseFilter,
    $or: [
      { taskLeader: { $in: aliasPatterns } },
      { assignedTo: { $in: aliasPatterns } },
    ],
  };
};

const canAccessTask = (task, req) => {
  const role = normalizeRole(req.user?.role);
  if (isItManagerRole(role)) return true;
  const aliases = getUserAliases(req.user);
  const participants = collectTaskParticipantAliases(task);
  return aliases.some((alias) => participants.includes(alias));
};

const emitNotification = (notification) => {
  emitToUsers([notification.user], 'newNotification', {
    id: notification._id,
    _id: notification._id,
    text: notification.text,
    read: notification.read,
    type: notification.type,
    itTaskId: notification.itTaskId,
    commentId: notification.commentId,
    link: notification.link,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  });
};

const notifyTaskParticipants = async (task, req, options = {}) => {
  try {
    const aliases = collectTaskParticipantAliases(task);
    if (!aliases.length) return [];

    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = new Map();

    allUsers.forEach((user) => {
      const matchesTaskAlias = getUserAliases(user).some((alias) => aliases.includes(alias));
      if (matchesTaskAlias) {
        recipients.set(String(user._id), user);
      }
    });

    const taskTitle = getTaskTitle(task);
    const title = options.title || 'IT task update';
    const actionLabel = options.actionLabel || 'View task';
    const link = options.link || `/it?tab=projects&task=${task._id}`;
    const notificationDocs = [...recipients.values()].map((user) => ({
      user: user._id,
      text: options.text || `${title}: ${taskTitle}.`,
      type: options.type || 'task',
      itTaskId: task._id,
      link,
      metadata: {
        title,
        taskTitle,
        taskLocation: getTaskLocation(task),
        actionLabel,
        actorName: getUserDisplayName(req.user),
        ...(options.metadata || {}),
      },
    }));

    if (!notificationDocs.length) return [];

    const createdNotifications = await Notification.insertMany(notificationDocs);
    createdNotifications.forEach(emitNotification);
    return createdNotifications;
  } catch (error) {
    console.error('notifyTaskParticipants error', error);
    return [];
  }
};

const notifyTaskCommentParticipants = async (task, comment, req) => {
  try {
    const aliases = collectTaskParticipantAliases(task);
    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = new Map();
    const addRecipient = (user) => {
      if (!user?._id) return;
      recipients.set(String(user._id), user);
    };

    allUsers.forEach((user) => {
      const role = normalizeRole(user.role);
      const matchesTaskAlias = getUserAliases(user).some((alias) => aliases.includes(alias));
      if (matchesTaskAlias || isItManagerRole(role)) {
        addRecipient(user);
      }
    });

    [task.createdBy, task.submittedBy, task.approvedBy, task.rejectedBy].filter(Boolean).forEach((id) => {
      const found = allUsers.find((user) => String(user._id) === String(id));
      if (found) addRecipient(found);
    });

    const taskId = task._id;
    const commentId = comment._id;
    const taskTitle = getTaskTitle(task);
    const actorName = getUserDisplayName(req.user);
    const link = `/it?tab=projects&task=${taskId}&comment=${commentId}`;
    const taskLocation = getTaskLocation(task);
    const commentPreview = String(comment.body || '').slice(0, 160);
    const notificationDocs = [...recipients.values()].map((user) => ({
      user: user._id,
      text: `New IT task comment: ${taskTitle}. Click to view the comment.`,
      type: 'comment',
      itTaskId: taskId,
      commentId,
      link,
      metadata: {
        title: 'New task comment',
        taskTitle,
        taskLocation,
        commentPreview,
        authorName: actorName,
        actionLabel: 'View comment',
      },
    }));

    if (!notificationDocs.length) return [];

    const createdNotifications = await Notification.insertMany(notificationDocs);
    createdNotifications.forEach(emitNotification);

    return createdNotifications;
  } catch (error) {
    console.error('notifyTaskCommentParticipants error', error);
    return [];
  }
};

const appendAudit = (task, req, action, details = {}) => {
  task.auditLog.push({
    actor: req.user?._id,
    actorName: getUserDisplayName(req.user),
    actorRole: req.user?.role || '',
    action,
    from: details.from,
    to: details.to,
    note: details.note || '',
    metadata: details.metadata,
  });
};

const deriveWorkflowStatus = (data = {}) => {
  if (data.workflowStatus && WORKFLOW_STATUS.includes(data.workflowStatus)) {
    return data.workflowStatus;
  }
  if (data.status === 'done') return 'completed';
  if (data.assignedTo?.length || data.taskLeader) return 'assigned';
  return 'pending';
};

const createCompletionReportForTask = async (task) => {
  const existing = await ITReport.findOne({ taskRef: task._id });
  if (existing) return existing;

  const isInternal = task.projectType === 'internal';
  const logicalTaskName = isInternal ? (task.taskName || '') : (task.client || '');
  const logicalTaskDetails = isInternal ? (task.platform || '') : (task.category || '');
  const projectName = logicalTaskName || task.projectName || task.client || task.platform || task.category || '';

  const report = new ITReport({
    projectName,
    projectType: task.projectType,
    actionType: task.actionType,
    taskName: logicalTaskName,
    taskDetails: logicalTaskDetails,
    description: task.description,
    attachments: task.attachments,
    startDate: task.startDate,
    endDate: task.endDate,
    status: task.status,
    completionDate: new Date(),
    taskLeader: task.taskLeader || '',
    personnelName: task.assignedTo,
    taskRef: task._id,
    points: task.featureCount || 1
  });
  await report.save();
  return report;
};

// Create new IT task
const createTask = async (req, res) => {
  try {
    const data = req.body;
    // Handle multiple assignees
    if (data.assignedTo && typeof data.assignedTo === 'string') {
      data.assignedTo = [data.assignedTo];
    }

    if (data.taskLeader !== undefined) {
      data.taskLeader = String(data.taskLeader || '').trim();
    }
    
    // Ensure status defaults to 'pending' if not provided
    if (!data.status) {
      data.status = 'pending';
    }

    data.workflowStatus = deriveWorkflowStatus(data);
    
    // Handle category for external tasks (ensure it's a string)
    if (data.projectType === 'external' && data.category) {
      // If category is an array, join it into a comma-separated string
      if (Array.isArray(data.category)) {
        data.category = data.category.join(', ');
      }
      // Ensure category is a string
      data.category = String(data.category);
    }
    
    // Handle platform for internal tasks (ensure it's a string)
    if (data.projectType === 'internal' && data.platform) {
      // If platform is an array, join it into a comma-separated string
      if (Array.isArray(data.platform)) {
        data.platform = data.platform.join(', ');
      }
      // Ensure platform is a string
      data.platform = String(data.platform);
    }
    
    // Handle actionType for both internal and external tasks
    if (data.actionType) {
      if (data.projectType === 'internal') {
        // Always store internal action types as a comma separated string
        const actionValues = Array.isArray(data.actionType)
          ? data.actionType
          : data.actionType.split(',').map(item => item.trim());
        data.actionType = actionValues.filter(Boolean).join(', ');
      } else {
        // For external tasks keep only the first selection
        if (Array.isArray(data.actionType)) {
          data.actionType = data.actionType[0] || '';
        } else {
          data.actionType = String(data.actionType);
        }
      }
    }
    
    // Handle featureCount
    if (data.featureCount !== undefined) {
      data.featureCount = Number(data.featureCount);
    }

    if (data.progressPercent !== undefined) {
      data.progressPercent = Math.max(0, Math.min(100, Number(data.progressPercent) || 0));
    }
    
    const task = new ITTask({ ...data, createdBy: req.user && req.user.id });
    appendAudit(task, req, 'task_created', {
      to: {
        workflowStatus: task.workflowStatus,
        taskLeader: task.taskLeader,
        assignedTo: task.assignedTo,
      },
      note: 'Task created',
    });
    await task.save();
    await notifyTaskParticipants(task, req, {
      title: 'New IT task assigned',
      text: `New IT task assigned: ${getTaskTitle(task)}.`,
      actionLabel: 'View task',
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('createTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tasks (optional query: projectType=internal|external)
const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectType) filter.projectType = req.query.projectType;
    const tasks = await ITTask.find(buildTaskAccessFilter(req, filter)).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('getTasks error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!canAccessTask(task, req)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this IT task.' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('getTaskById error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    // Handle featureCount if present in request body
    const updateData = { ...req.body };
    if (updateData.featureCount !== undefined) {
      updateData.featureCount = Number(updateData.featureCount);
    }

    if (updateData.progressPercent !== undefined) {
      const role = normalizeRole(req.user?.role);
      if (role !== 'it' && role !== 'itstaff') {
        return res.status(403).json({
          success: false,
          message: 'Only IT Staff can update task progress.'
        });
      }

      updateData.progressPercent = Math.max(0, Math.min(100, Number(updateData.progressPercent) || 0));
      if (updateData.progressPercent === 0) {
        updateData.status = updateData.status || 'pending';
      } else if (updateData.progressPercent === 100) {
        updateData.status = 'done';
        updateData.featureCount = updateData.featureCount || 1;
      } else {
        updateData.status = updateData.status === 'done' ? 'done' : 'ongoing';
      }
    }

    if (updateData.taskLeader !== undefined) {
      updateData.taskLeader = String(updateData.taskLeader || '').trim();
    }

    if (updateData.actionType !== undefined) {
      if (Array.isArray(updateData.actionType)) {
        if (updateData.projectType === 'external') {
          updateData.actionType = updateData.actionType[0] || '';
        } else {
          updateData.actionType = updateData.actionType.filter(Boolean).join(', ');
        }
      } else if (typeof updateData.actionType === 'string') {
        if (updateData.projectType === 'external') {
          updateData.actionType = updateData.actionType.trim();
        } else {
          updateData.actionType = updateData.actionType
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .join(', ');
        }
      } else {
        updateData.actionType = String(updateData.actionType);
      }
    }
    
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previousSnapshot = {
      status: task.status,
      workflowStatus: task.workflowStatus,
      taskLeader: task.taskLeader,
      assignedTo: task.assignedTo,
      featureCount: task.featureCount,
    };

    if (updateData.status === 'done' && !updateData.workflowStatus) {
      updateData.workflowStatus = 'completed';
    } else if (updateData.status === 'ongoing' && !updateData.workflowStatus) {
      updateData.workflowStatus = 'in_progress';
    } else if (updateData.assignedTo && !updateData.workflowStatus && task.workflowStatus === 'pending') {
      updateData.workflowStatus = 'assigned';
    }

    Object.assign(task, updateData);
    appendAudit(task, req, 'task_updated', {
      from: previousSnapshot,
      to: {
        status: task.status,
        workflowStatus: task.workflowStatus,
        taskLeader: task.taskLeader,
        assignedTo: task.assignedTo,
        featureCount: task.featureCount,
      },
      note: updateData.auditNote || updateData.note || '',
    });
    const updated = await task.save();
    await notifyTaskParticipants(updated, req, {
      title: 'IT task updated',
      text: `IT task updated: ${getTaskTitle(updated)}.`,
      actionLabel: 'Review update',
      metadata: {
        from: previousSnapshot,
        to: {
          status: updated.status,
          workflowStatus: updated.workflowStatus,
          taskLeader: updated.taskLeader,
          assignedTo: updated.assignedTo,
          featureCount: updated.featureCount,
        },
      },
    });

    // If task is already completed and featureCount is being updated, also update the corresponding report
    if (updated.status === 'done' && updateData.featureCount !== undefined) {
      try {
        const report = await ITReport.findOne({ taskRef: updated._id });
        if (report) {
          report.points = updated.featureCount || 1;
          await report.save();
        }
      } catch (err) {
        console.error('Failed to sync report points with task featureCount', err);
      }
    }

    // If status changed to Completed, generate report
    if ((req.body.status && req.body.status === 'done') || updateData.progressPercent === 100) {
      try {
        const isInternal = updated.projectType === 'internal';

        // Task Name: internal → taskName (title), external → client name
        const logicalTaskName = isInternal ? (updated.taskName || '') : (updated.client || '');

        // Task Details: internal → platform(s), external → category(ies)
        const logicalTaskDetails = isInternal ? (updated.platform || '') : (updated.category || '');

        // Fallback projectName for backward compatibility - align with logical task name
        const projectName = logicalTaskName || updated.projectName || updated.client || updated.platform || updated.category || '';

        const report = new ITReport({
          projectName,
          projectType: updated.projectType,
          actionType: updated.actionType,
          taskName: logicalTaskName,
          taskDetails: logicalTaskDetails,
          description: updated.description,
          attachments: updated.attachments,
          startDate: updated.startDate,
          endDate: updated.endDate,
          status: updated.status,
          completionDate: new Date(),
          taskLeader: updated.taskLeader || '',
          personnelName: updated.assignedTo, // Use assignedTo for personnel names
          taskRef: updated._id,
          points: updated.featureCount || 1 // Use featureCount as points, default to 1 if not set
        });
        await report.save();
      } catch (err) {
        console.error('report generation failed', err);
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const body = String(req.body.body || req.body.comment || '').trim();
    if (!body) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = task.comments.create({
      author: req.user?._id,
      authorName: getUserDisplayName(req.user),
      authorRole: req.user?.role || '',
      body
    });
    task.comments.push(comment);
    appendAudit(task, req, 'comment_added', { note: body });
    await task.save();
    await notifyTaskCommentParticipants(task, comment, req);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('addTaskComment error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveTask = async (req, res) => {
  try {
    const decision = req.body.approvalStatus || 'approved';
    if (!['approved', 'rejected', 'pending_approval'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status' });
    }

    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.approvalStatus = decision;
    task.approvalNote = req.body.approvalNote || req.body.note || '';
    if (decision === 'approved') {
      task.approvedBy = req.user?._id;
      task.approvedAt = new Date();
      task.workflowStatus = 'approved';
    } else {
      task.approvedBy = undefined;
      task.approvedAt = undefined;
      task.workflowStatus = decision === 'rejected' ? 'rejected' : 'submitted';
      if (decision === 'rejected') {
        task.rejectedBy = req.user?._id;
        task.rejectedAt = new Date();
      }
    }

    task.comments.push({
      author: req.user?._id,
      authorName: getUserDisplayName(req.user),
      authorRole: req.user?.role || '',
      body: decision === 'approved'
        ? `Approved task${task.approvalNote ? `: ${task.approvalNote}` : ''}`
        : `${decision.replace('_', ' ')}${task.approvalNote ? `: ${task.approvalNote}` : ''}`
    });
    appendAudit(task, req, 'approval_decision', {
      to: decision,
      note: task.approvalNote,
    });

    await task.save();
    await notifyTaskParticipants(task, req, {
      title: decision === 'approved' ? 'Task approved' : 'Task approval update',
      text: `${decision === 'approved' ? 'Task approved' : 'Task approval updated'}: ${getTaskTitle(task)}.`,
      actionLabel: 'View approval',
      metadata: {
        approvalStatus: decision,
        approvalNote: task.approvalNote,
      },
    });
    if (task.workflowStatus === 'completed') {
      await createCompletionReportForTask(task);
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('approveTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const workflowStatus = String(req.body.workflowStatus || '').trim();
    if (!WORKFLOW_STATUS.includes(workflowStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid workflow status' });
    }

    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previousWorkflow = task.workflowStatus || deriveWorkflowStatus(task);
    const previousStatus = task.status;

    task.workflowStatus = workflowStatus;
    task.progressNote = req.body.progressNote || req.body.note || task.progressNote || '';

    if (workflowStatus === 'in_progress') {
      task.status = 'ongoing';
    }
    if (workflowStatus === 'submitted') {
      task.status = 'ongoing';
      task.approvalStatus = 'pending_approval';
      task.submittedBy = req.user?._id;
      task.submittedAt = new Date();
    }
    if (workflowStatus === 'approved') {
      task.approvalStatus = 'approved';
      task.approvedBy = req.user?._id;
      task.approvedAt = new Date();
    }
    if (workflowStatus === 'rejected') {
      task.approvalStatus = 'rejected';
      task.rejectedBy = req.user?._id;
      task.rejectedAt = new Date();
    }
    if (workflowStatus === 'completed') {
      task.status = 'done';
      task.approvalStatus = task.approvalStatus === 'rejected' ? 'pending_approval' : task.approvalStatus;
      if (req.body.featureCount !== undefined) {
        task.featureCount = Number(req.body.featureCount) || task.featureCount || 1;
      }
    }

    appendAudit(task, req, 'workflow_changed', {
      from: { workflowStatus: previousWorkflow, status: previousStatus },
      to: { workflowStatus: task.workflowStatus, status: task.status },
      note: req.body.note || req.body.progressNote || '',
    });

    await task.save();
    await notifyTaskParticipants(task, req, {
      title: 'Task workflow changed',
      text: `Task workflow changed to ${workflowStatus.replace('_', ' ')}: ${getTaskTitle(task)}.`,
      actionLabel: 'View workflow',
      metadata: {
        workflowStatus,
        previousWorkflow,
        previousStatus,
      },
    });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('updateWorkflow error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const reassignTask = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previous = {
      taskLeader: task.taskLeader,
      assignedTo: task.assignedTo,
      workflowStatus: task.workflowStatus,
    };

    if (req.body.taskLeader !== undefined) {
      task.taskLeader = String(req.body.taskLeader || '').trim();
    }
    if (req.body.assignedTo !== undefined) {
      task.assignedTo = Array.isArray(req.body.assignedTo)
        ? req.body.assignedTo
        : [req.body.assignedTo].filter(Boolean);
    }
    if (task.workflowStatus === 'pending' && (task.taskLeader || task.assignedTo.length)) {
      task.workflowStatus = 'assigned';
    }

    appendAudit(task, req, 'task_reassigned', {
      from: previous,
      to: {
        taskLeader: task.taskLeader,
        assignedTo: task.assignedTo,
        workflowStatus: task.workflowStatus,
      },
      note: req.body.note || '',
    });

    await task.save();
    await notifyTaskParticipants(task, req, {
      title: 'Task assignment updated',
      text: `Task assignment updated: ${getTaskTitle(task)}.`,
      actionLabel: 'View assignment',
      metadata: {
        from: previous,
        to: {
          taskLeader: task.taskLeader,
          assignedTo: task.assignedTo,
          workflowStatus: task.workflowStatus,
        },
      },
    });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('reassignTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addReminder = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ success: false, message: 'Reminder title is required' });

    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const reminder = task.reminders.create({
      title,
      note: req.body.note || '',
      type: req.body.type || 'task',
      dueAt: req.body.dueAt || undefined,
      createdBy: req.user?._id,
    });
    task.reminders.push(reminder);
    appendAudit(task, req, 'reminder_added', { note: title });

    await task.save();
    await notifyTaskParticipants(task, req, {
      title: 'Task reminder',
      text: `Task reminder: ${title}.`,
      type: 'reminder',
      actionLabel: 'Open reminder',
      metadata: {
        reminderId: String(reminder._id),
        reminderTitle: title,
        reminderNote: req.body.note || '',
        reminderType: req.body.type || 'task',
        reminderDueAt: req.body.dueAt || '',
        keepVisible: true,
      },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('addReminder error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReminder = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const reminder = task.reminders.id(req.params.reminderId);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    if (req.body.isDone !== undefined) reminder.isDone = Boolean(req.body.isDone);
    if (req.body.title !== undefined) reminder.title = String(req.body.title || reminder.title).trim();
    if (req.body.note !== undefined) reminder.note = req.body.note || '';
    if (req.body.dueAt !== undefined) reminder.dueAt = req.body.dueAt || undefined;

    appendAudit(task, req, 'reminder_updated', {
      to: { reminderId: reminder._id, isDone: reminder.isDone },
      note: reminder.title,
    });

    await task.save();
    if (reminder.isDone) {
      await Notification.updateMany(
        {
          itTaskId: task._id,
          type: 'reminder',
          'metadata.reminderId': String(reminder._id),
        },
        {
          $set: {
            read: true,
            'metadata.keepVisible': false,
          },
        }
      );
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('updateReminder error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const tasks = await ITTask.find({}, 'taskName client projectType auditLog').sort({ updatedAt: -1 });
    const data = tasks.flatMap((task) => (
      (task.auditLog || []).map((entry) => ({
        ...entry.toObject(),
        taskId: task._id,
        taskName: task.taskName || task.client || 'IT Task',
        projectType: task.projectType,
      }))
    )).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data });
  } catch (error) {
    console.error('getAuditLog error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const deleted = await ITTask.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('deleteTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reports
const getReports = async (req, res) => {
  try {
    const q = {};
    if (req.query.projectType) q.projectType = req.query.projectType;
    const reportDocs = await ITReport.find(q)
      .populate('taskRef') // include original task details (platform/category/client, etc.)
      .sort({ createdAt: -1 });

    // Ensure external task categories (and internal platforms) are always available
    const reports = reportDocs.map((doc) => {
      const report = doc.toObject();

      if (report.projectType === 'external') {
        if (!report.taskDetails || !report.taskDetails.trim()) {
          report.taskDetails =
            report.category ||
            (report.taskRef &&
              (report.taskRef.category || report.taskRef.taskDetails)) ||
            '';
        }
      } else {
        if (!report.taskDetails || !report.taskDetails.trim()) {
          report.taskDetails =
            report.platform ||
            (report.taskRef &&
              (report.taskRef.platform || report.taskRef.taskDetails)) ||
            '';
        }
      }

      return report;
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('getReports error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await ITReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('getReportById error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Handle points if present in request body
    if (updateData.points !== undefined) {
      updateData.points = Number(updateData.points);
    }
    
    // Try to find by _id first, then by reportId
    let updated = await ITReport.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      // If not found by _id, try by reportId
      updated = await ITReport.findOneAndUpdate({ reportId: req.params.id }, updateData, { new: true });
    }
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateReport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new IT report
const createReport = async (req, res) => {
  try {
    const data = req.body;
    // Handle personnelName as array if it's a string
    if (data.personnelName && typeof data.personnelName === 'string') {
      data.personnelName = [data.personnelName];
    }
    
    const report = new ITReport(data);
    await report.save();
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('createReport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  addTaskComment,
  approveTask,
  updateWorkflow,
  reassignTask,
  addReminder,
  updateReminder,
  deleteTask,
  getAuditLog,
  getReports,
  getReportById,
  updateReport,
  createReport
};
