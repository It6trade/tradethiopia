const mongoose = require('mongoose');
const ITTask = require('../models/ITTask');
const ITReport = require('../models/ITReport');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const { emitToUsers } = require('../services/chatSocketService');

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
const isCsManagerRole = (role) => ['customersuccessmanager', 'csmanager', 'admin'].includes(normalizeRole(role));
const isCsRole = (role) => ['customerservice', 'customersuccessmanager', 'cs', 'csmanager'].includes(normalizeRole(role));
const isItStaffRole = (role) => ['it', 'itstaff', 'itteamleader', 'itleader', 'itofficer'].includes(normalizeRole(role));

const isTaskOwnerOrRequester = (task, user) => {
  if (!user || !task) return false;
  const aliases = getUserAliases(user);
  const taskRequester = String(task.requestedBy || '').trim().toLowerCase();
  const taskCreator = String(task.createdBy?._id || task.createdBy || '').trim().toLowerCase();
  const taskSubmitter = String(task.submittedBy?._id || task.submittedBy || '').trim().toLowerCase();
  const userIdStr = String(user._id || user.id || '').trim().toLowerCase();

  return (
    (taskCreator && (taskCreator === userIdStr || aliases.includes(taskCreator))) ||
    (taskSubmitter && (taskSubmitter === userIdStr || aliases.includes(taskSubmitter))) ||
    (taskRequester && aliases.includes(taskRequester))
  );
};

const filterTaskCommentsForUser = (task, user) => {
  if (!task || !Array.isArray(task.comments)) return [];
  if (!user) return [];

  const role = normalizeRole(user.role);
  const isTicket = isSupportTicketTask(task);

  // 1. IT Managers / General Admins: full visibility of all comments
  if (isItManagerRole(role)) {
    return task.comments;
  }

  // 2. Support tickets: strictly internal between IT Staff & Management
  if (isTicket) {
    if (isItManagerRole(role) || isItStaffRole(role)) {
      // IT staff and managers can view all ticket comments
      return task.comments;
    }
    // Completely invisible to CS
    return [];
  }

  // 3. Customer Service Team (Task Sender or CS Manager for External tasks):
  if (isCsRole(role) || isTaskOwnerOrRequester(task, user)) {
    if (isTaskOwnerOrRequester(task, user) || isCsManagerRole(role)) {
      return task.comments.filter((c) => (c.audience || 'general') !== 'staff_manager');
    }
    return [];
  }

  // 4. IT Staff (External tasks):
  if (isItStaffRole(role)) {
    const userAliases = getUserAliases(user);
    const userIdStr = String(user._id || user.id || '').trim();
    return task.comments.filter((c) => {
      // Hide CS comments from IT staff in external projects
      if (c.audience === 'cs_manager') return false;

      const authorId = String(c.author?._id || c.author || '').trim();
      const authorName = String(c.authorName || '').trim().toLowerCase();
      const isOwnComment = (authorId && authorId === userIdStr) || (authorName && userAliases.includes(authorName));
      const isManagerComment = isItManagerRole(c.authorRole);
      const isStaffAudience = (c.audience || 'general') !== 'cs_manager';
      return isOwnComment || (isManagerComment && isStaffAudience);
    });
  }

  return [];
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getTaskLocation = (task) => `${task.projectType || 'IT'} / ${task.platform || task.category || task.client || 'Project Workspace'}`;

const buildTaskAccessFilter = (req, baseFilter = {}) => {
  if (!req.user) return baseFilter;
  const role = normalizeRole(req.user?.role);
  if (isItManagerRole(role)) return baseFilter;

  const aliases = getUserAliases(req.user);
  if (!aliases.length) return { ...baseFilter, _id: null };
  const aliasPatterns = aliases.map((alias) => new RegExp(`^${escapeRegex(alias)}$`, 'i'));

  const orConditions = [
    { taskLeader: { $in: aliasPatterns } },
    { assignedTo: { $in: aliasPatterns } },
    { requestedBy: { $in: aliasPatterns } },
    { createdBy: req.user?._id || req.user?.id },
    { submittedBy: req.user?._id || req.user?.id },
  ];

  if (isCsRole(role)) {
    orConditions.push(
      { requestedDepartment: { $regex: /customer/i } },
      { category: { $regex: /customer/i } },
      { actionType: { $regex: /external.*cs|cs.*external/i } },
      { projectType: 'external' }
    );
  }

  return {
    ...baseFilter,
    $or: orConditions,
  };
};

const canAccessTask = (task, req) => {
  if (!req.user) return true;
  const role = normalizeRole(req.user?.role);
  if (isItManagerRole(role)) return true;
  const aliases = getUserAliases(req.user);
  const participants = [
    ...collectTaskParticipantAliases(task),
    String(task.requestedBy || '').trim().toLowerCase(),
    String(task.createdBy || '').trim().toLowerCase(),
    String(task.submittedBy || '').trim().toLowerCase(),
  ].filter(Boolean);
  if (aliases.some((alias) => participants.includes(alias))) return true;
  if (isCsRole(role) && (
    String(task.requestedDepartment || '').toLowerCase().includes('customer') ||
    String(task.category || '').toLowerCase().includes('customer') ||
    task.projectType === 'external'
  )) {
    return true;
  }
  return false;
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

const notifyOnTaskCreation = async (task, req) => {
  try {
    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = [];
    const taskTitle = getTaskTitle(task);
    const actorName = getUserDisplayName(req.user);
    const actorRole = normalizeRole(req.user?.role);
    const isExternalOrCs = task.projectType === 'external' || isCsRole(actorRole) || String(task.requestedDepartment || '').toLowerCase().includes('customer');

    // 1. Notify IT Managers
    if (isExternalOrCs) {
      allUsers.forEach((u) => {
        const role = normalizeRole(u.role);
        if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `New external IT task request from ${task.requestedBy || actorName}: ${taskTitle}.`,
            type: 'task',
            itTaskId: task._id,
            link: `/it?tab=projects&task=${task._id}`,
            metadata: {
              title: 'New external task request',
              taskTitle,
              taskLocation: getTaskLocation(task),
              actionLabel: 'Review Request',
              actorName,
            },
          });
        }
      });

      // 2. Notify CS Managers (if created by staff)
      allUsers.forEach((u) => {
        const role = normalizeRole(u.role);
        if (isCsManagerRole(role) && !isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `External IT task submitted: ${taskTitle} by ${task.requestedBy || actorName}.`,
            type: 'task',
            itTaskId: task._id,
            link: `/cdashboard?section=it-requests&task=${task._id}`,
            metadata: {
              title: 'External IT task request',
              taskTitle,
              taskLocation: getTaskLocation(task),
              actionLabel: 'View in CS',
              actorName,
            },
          });
        }
      });
    }

    // 3. If task was created with assignees or taskLeader, notify them
    const participantAliases = collectTaskParticipantAliases(task);
    if (participantAliases.length) {
      allUsers.forEach((u) => {
        const matches = getUserAliases(u).some((alias) => participantAliases.includes(alias));
        if (matches && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `You have been assigned to IT task: ${taskTitle}.`,
            type: 'task',
            itTaskId: task._id,
            link: `/it?tab=projects&task=${task._id}`,
            metadata: {
              title: 'New IT task assigned',
              taskTitle,
              taskLocation: getTaskLocation(task),
              actionLabel: 'View task',
              actorName,
            },
          });
        }
      });
    }

    if (!recipients.length) return [];
    const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
    const createdNotifications = await Notification.insertMany(uniqueRecipients);
    createdNotifications.forEach(emitNotification);
    return createdNotifications;
  } catch (error) {
    console.error('notifyOnTaskCreation error', error);
    return [];
  }
};

const isSupportTicketTask = (task = {}) => (
  Boolean(task.supportRequestNote)
  || task.requestSource === 'employee_call'
  || Boolean(task.requestedAt)
  || (Array.isArray(task.ticketRecords) && task.ticketRecords.length > 0)
  || task.actionType === 'Support Request'
  || task.actionType === 'Support Ticket'
  || task.category === 'Support Ticket'
);

const notifyOnTaskAssignment = async (task, req, previous = {}) => {
  try {
    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = [];
    const taskTitle = getTaskTitle(task);
    const actorName = getUserDisplayName(req.user);
    const staffNames = [task.taskLeader, ...(task.assignedTo || [])].filter(Boolean).join(', ') || 'IT staff';
    const isTicket = isSupportTicketTask(task);

    // 1. Notify newly assigned staff / leader
    const participantAliases = collectTaskParticipantAliases(task);
    allUsers.forEach((u) => {
      const matches = getUserAliases(u).some((alias) => participantAliases.includes(alias));
      if (matches && String(u._id) !== String(req.user?._id)) {
        recipients.push({
          user: u._id,
          text: isTicket
            ? `You have been assigned to IT support ticket: ${taskTitle}. Please accept the ticket to begin work.`
            : `You have been assigned to IT task: ${taskTitle}.`,
          type: 'task',
          itTaskId: task._id,
          link: isTicket ? `/it?tab=tickets&task=${task._id}` : `/it?tab=projects&task=${task._id}`,
          metadata: {
            isTicket,
            title: isTicket ? 'Support Ticket Assigned' : 'Task assignment',
            taskTitle,
            taskLocation: isTicket ? 'IT Support Department' : getTaskLocation(task),
            actionLabel: isTicket ? 'Accept Ticket' : 'View task',
            actorName,
          },
        });
      }
    });

    // 2. Notify Customer Service (Requester / Creator & CS Managers)
    const requesterAliases = [
      String(task.requestedBy || '').trim().toLowerCase(),
      String(task.createdBy?._id || task.createdBy || '').trim().toLowerCase(),
      String(task.submittedBy?._id || task.submittedBy || '').trim().toLowerCase(),
    ].filter(Boolean);

    allUsers.forEach((u) => {
      const role = normalizeRole(u.role);
      const isRequester = getUserAliases(u).some((alias) => requesterAliases.includes(alias));
      const isCsMgr = isCsManagerRole(role);
      // For tickets, only notify the actual ticket sender/requester, not all CS reps
      const shouldNotifyCs = isTicket ? isRequester : (isRequester || isCsMgr);

      if (shouldNotifyCs && String(u._id) !== String(req.user?._id)) {
        recipients.push({
          user: u._id,
          text: isTicket
            ? `IT support ticket assigned: ${taskTitle} has been assigned to ${staffNames}.`
            : `IT task assigned: ${taskTitle} has been assigned to ${staffNames}.`,
          type: 'task',
          itTaskId: task._id,
          link: `/cdashboard?section=it-requests&task=${task._id}`,
          metadata: {
            isTicket,
            title: isTicket ? 'IT support ticket assigned to staff' : 'IT task assigned to staff',
            taskTitle,
            assignedTo: staffNames,
            taskLocation: isTicket ? 'IT Support Department' : getTaskLocation(task),
            actionLabel: 'View in CS',
            actorName,
          },
        });
      }
    });

    if (!recipients.length) return [];
    const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
    const createdNotifications = await Notification.insertMany(uniqueRecipients);
    createdNotifications.forEach(emitNotification);
    return createdNotifications;
  } catch (error) {
    console.error('notifyOnTaskAssignment error', error);
    return [];
  }
};

const notifyOnTaskUpgrade = async (task, req, options = {}) => {
  try {
    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = [];
    const taskTitle = getTaskTitle(task);
    const actorName = getUserDisplayName(req.user);
    const statusLabel = String(task.workflowStatus || task.status || 'updated').replace('_', ' ');

    const isTicket = isSupportTicketTask(task);
    const itLink = isTicket ? `/it?tab=tickets&task=${task._id}` : `/it?tab=projects&task=${task._id}`;

    // 1. Notify IT Participants (Leader & Assigned Staff) and IT Managers
    const participantAliases = collectTaskParticipantAliases(task);
    allUsers.forEach((u) => {
      const role = normalizeRole(u.role);
      const isItMgr = isItManagerRole(role);
      const isParticipant = getUserAliases(u).some((alias) => participantAliases.includes(alias));
      if ((isItMgr || isParticipant) && String(u._id) !== String(req.user?._id)) {
        recipients.push({
          user: u._id,
          text: options.text || `IT task updated: ${taskTitle} is now ${statusLabel}.`,
          type: 'task',
          itTaskId: task._id,
          link: itLink,
          metadata: {
            isTicket,
            title: options.title || 'IT task update',
            taskTitle,
            workflowStatus: task.workflowStatus,
            status: task.status,
            progressPercent: task.progressPercent,
            taskLocation: isTicket ? 'IT Support Department' : getTaskLocation(task),
            actionLabel: 'View task',
            actorName,
            ...(options.metadata || {}),
          },
        });
      }
    });

    // 2. Notify CS (Requester / Creator & CS Managers)
    const requesterAliases = [
      String(task.requestedBy || '').trim().toLowerCase(),
      String(task.createdBy?._id || task.createdBy || '').trim().toLowerCase(),
      String(task.submittedBy?._id || task.submittedBy || '').trim().toLowerCase(),
    ].filter(Boolean);

    allUsers.forEach((u) => {
      const role = normalizeRole(u.role);
      const isRequester = getUserAliases(u).some((alias) => requesterAliases.includes(alias));
      const isCsMgr = isCsManagerRole(role);
      // For tickets, only notify the actual ticket sender/requester, not all CS reps
      const shouldNotifyCs = isTicket ? isRequester : (isRequester || isCsMgr);

      if (shouldNotifyCs && String(u._id) !== String(req.user?._id)) {
        recipients.push({
          user: u._id,
          text: `IT task update: ${taskTitle} is now ${statusLabel}${task.progressPercent ? ` (${task.progressPercent}%)` : ''}.`,
          type: 'task',
          itTaskId: task._id,
          link: `/cdashboard?section=it-requests&task=${task._id}`,
          metadata: {
            title: options.title || 'IT task status update',
            taskTitle,
            workflowStatus: task.workflowStatus,
            status: task.status,
            progressPercent: task.progressPercent,
            taskLocation: isTicket ? 'IT Support Department' : getTaskLocation(task),
            actionLabel: 'View in CS',
            actorName,
            ...(options.metadata || {}),
          },
        });
      }
    });

    if (!recipients.length) return [];
    const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
    const createdNotifications = await Notification.insertMany(uniqueRecipients);
    createdNotifications.forEach(emitNotification);
    return createdNotifications;
  } catch (error) {
    console.error('notifyOnTaskUpgrade error', error);
    return [];
  }
};

const notifyTaskParticipants = async (task, req, options = {}) => {
  return notifyOnTaskUpgrade(task, req, options);
};

const notifyTaskCommentParticipants = async (task, comment, req) => {
  try {
    const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
    const recipients = [];
    const taskId = task._id;
    const commentId = comment._id;
    const taskTitle = getTaskTitle(task);
    const actorName = getUserDisplayName(req.user);
    const commentPreview = String(comment.body || '').slice(0, 160);
    const audience = comment.audience || 'general';
    const isTicket = isSupportTicketTask(task);

    const requesterAliases = [
      String(task.requestedBy || '').trim().toLowerCase(),
      String(task.createdBy?._id || task.createdBy || '').trim().toLowerCase(),
      String(task.submittedBy?._id || task.submittedBy || '').trim().toLowerCase(),
    ].filter(Boolean);

    const actorRole = normalizeRole(req.user?.role);
    const isSenderAuthor = isTaskOwnerOrRequester(task, req.user) || isCsRole(actorRole);
    const isManagerAuthor = isItManagerRole(actorRole);
    const participantAliases = collectTaskParticipantAliases(task);

    const itLink = isTicket ? `/it?tab=tickets&task=${taskId}&comment=${commentId}` : `/it?tab=projects&task=${taskId}&comment=${commentId}`;
    const csLink = `/cdashboard?section=it-requests&task=${taskId}&comment=${commentId}`;

    if (isTicket) {
      // Support Ticket Notifications: Strictly internal between IT Staff & Management
      if (isManagerAuthor) {
        // Manager commented -> Notify ONLY assigned IT staff
        allUsers.forEach((u) => {
          const matches = getUserAliases(u).some((alias) => participantAliases.includes(alias));
          if (matches && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New ticket comment from manager ${actorName}: ${taskTitle}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: itLink,
              metadata: {
                isTicket: true,
                title: 'New ticket comment',
                taskTitle,
                taskLocation: 'IT Support Department',
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      } else {
        // IT Staff commented -> Notify ONLY IT Manager(s)
        allUsers.forEach((u) => {
          const role = normalizeRole(u.role);
          if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New ticket comment from ${actorName}: ${taskTitle}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: itLink,
              metadata: {
                isTicket: true,
                title: 'New ticket comment',
                taskTitle,
                taskLocation: 'IT Support Department',
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      }
    } else if (audience === 'cs_manager') {
      // CS Channel: Strictly between CS Sender and IT Manager
      if (isSenderAuthor) {
        // CS Sender commented -> Notify IT Manager(s)
        allUsers.forEach((u) => {
          const role = normalizeRole(u.role);
          if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New external task comment from ${actorName}: ${taskTitle}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: itLink,
              metadata: {
                title: 'New external task comment',
                taskTitle,
                taskLocation: getTaskLocation(task),
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      } else if (isManagerAuthor) {
        // IT Manager commented to CS -> Notify ONLY CS Sender (NOT IT Staff!)
        allUsers.forEach((u) => {
          const isOwner = getUserAliases(u).some((alias) => requesterAliases.includes(alias));
          if (isOwner && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New comment on your external IT request: ${taskTitle} by ${actorName}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: csLink,
              metadata: {
                title: 'New external task comment',
                taskTitle,
                taskLocation: getTaskLocation(task),
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      }
    } else {
      // Staff Channel (audience === 'staff_manager' or 'general'): Strictly between IT Staff and IT Manager
      if (isManagerAuthor) {
        // IT Manager commented to Staff -> Notify ONLY assigned IT Staff (NOT CS!)
        allUsers.forEach((u) => {
          const matches = getUserAliases(u).some((alias) => participantAliases.includes(alias));
          if (matches && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New IT task update from manager: ${taskTitle}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: itLink,
              metadata: {
                title: 'New task comment',
                taskTitle,
                taskLocation: getTaskLocation(task),
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      } else {
        // IT Staff commented -> Notify IT Manager(s) (NOT CS!)
        allUsers.forEach((u) => {
          const role = normalizeRole(u.role);
          if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
            recipients.push({
              user: u._id,
              text: `New IT task comment from ${actorName}: ${taskTitle}.`,
              type: 'comment',
              itTaskId: taskId,
              commentId,
              link: itLink,
              metadata: {
                title: 'New task comment',
                taskTitle,
                taskLocation: getTaskLocation(task),
                commentPreview,
                authorName: actorName,
                actionLabel: 'View comment',
              },
            });
          }
        });
      }
    }

    if (!recipients.length) return [];
    const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
    const createdNotifications = await Notification.insertMany(uniqueRecipients);
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
      if (Array.isArray(data.category)) {
        data.category = data.category.join(', ');
      }
      data.category = String(data.category);
    }
    
    // Handle platform for internal tasks (ensure it's a string)
    if (data.projectType === 'internal' && data.platform) {
      if (Array.isArray(data.platform)) {
        data.platform = data.platform.join(', ');
      }
      data.platform = String(data.platform);
    }
    
    // Handle actionType for both internal and external tasks
    if (data.actionType) {
      if (data.projectType === 'internal') {
        const actionValues = Array.isArray(data.actionType)
          ? data.actionType
          : data.actionType.split(',').map(item => item.trim());
        data.actionType = actionValues.filter(Boolean).join(', ');
      } else {
        if (Array.isArray(data.actionType)) {
          data.actionType = data.actionType[0] || '';
        } else {
          data.actionType = String(data.actionType);
        }
      }
    }
    
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
    await notifyOnTaskCreation(task, req);
    
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.status(201).json({ success: true, data: taskObj });
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
    
    const sanitized = tasks.map((task) => {
      const taskObj = task.toObject ? task.toObject() : task;
      taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
      return taskObj;
    });

    res.json({ success: true, data: sanitized });
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
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('getTaskById error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.featureCount !== undefined) {
      updateData.featureCount = Number(updateData.featureCount);
    }

    if (updateData.progressPercent !== undefined) {
      const role = normalizeRole(req.user?.role);
      if (role !== 'it' && role !== 'itstaff' && !isItManagerRole(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only IT Staff or Managers can update task progress.'
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
      progressPercent: task.progressPercent,
    };

    if (updateData.status === 'done' && !updateData.workflowStatus) {
      updateData.workflowStatus = 'completed';
    } else if (updateData.status === 'ongoing' && !updateData.workflowStatus) {
      updateData.workflowStatus = 'in_progress';
    } else if (updateData.assignedTo && !updateData.workflowStatus && task.workflowStatus === 'pending') {
      updateData.workflowStatus = 'assigned';
    }

    const assignmentChanged = (
      (updateData.taskLeader !== undefined && updateData.taskLeader !== previousSnapshot.taskLeader) ||
      (updateData.assignedTo !== undefined && JSON.stringify(updateData.assignedTo) !== JSON.stringify(previousSnapshot.assignedTo))
    );

    const upgradeChanged = (
      (updateData.workflowStatus && updateData.workflowStatus !== previousSnapshot.workflowStatus) ||
      (updateData.status && updateData.status !== previousSnapshot.status) ||
      (updateData.progressPercent !== undefined && updateData.progressPercent !== previousSnapshot.progressPercent)
    );

    Object.assign(task, updateData);
    appendAudit(task, req, 'task_updated', {
      from: previousSnapshot,
      to: {
        status: task.status,
        workflowStatus: task.workflowStatus,
        taskLeader: task.taskLeader,
        assignedTo: task.assignedTo,
        featureCount: task.featureCount,
        progressPercent: task.progressPercent,
      },
      note: updateData.auditNote || updateData.note || '',
    });
    const updated = await task.save();

    if (assignmentChanged) {
      await notifyOnTaskAssignment(updated, req, previousSnapshot);
    }
    if (upgradeChanged) {
      await notifyOnTaskUpgrade(updated, req, {
        title: 'IT task updated',
        text: `IT task updated: ${getTaskTitle(updated)}.`,
      });
    }

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
        const logicalTaskName = isInternal ? (updated.taskName || '') : (updated.client || '');
        const logicalTaskDetails = isInternal ? (updated.platform || '') : (updated.category || '');
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
          personnelName: updated.assignedTo,
          taskRef: updated._id,
          points: updated.featureCount || 1
        });
        await report.save();
      } catch (err) {
        console.error('report generation failed', err);
      }
    }

    const taskObj = updated.toObject ? updated.toObject() : updated;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
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

    const role = normalizeRole(req.user?.role);
    const isSender = isTaskOwnerOrRequester(task, req.user);
    const isMgr = isItManagerRole(role);
    const isStaff = isItStaffRole(role);
    const isCs = isCsRole(role);

    if (!isMgr && !isSender && !canAccessTask(task, req) && !isStaff && !isCs) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this task.',
      });
    }

    const isTicket = isSupportTicketTask(task);
    let audience = req.body.audience;
    if (!audience) {
      if (isTicket) {
        audience = 'general';
      } else if (isItStaffRole(role) && !isItManagerRole(role)) {
        audience = 'staff_manager';
      } else if (isCsRole(role) && !isItManagerRole(role)) {
        audience = 'cs_manager';
      } else if (isItManagerRole(role)) {
        audience = 'general';
      } else {
        audience = 'general';
      }
    }

    const comment = task.comments.create({
      author: req.user?._id,
      authorName: getUserDisplayName(req.user),
      authorRole: req.user?.role || '',
      body,
      audience,
    });
    task.comments.push(comment);
    appendAudit(task, req, 'comment_added', { note: body, metadata: { audience } });
    await task.save();
    await notifyTaskCommentParticipants(task, comment, req);
    
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.status(201).json({ success: true, data: taskObj });
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
        : `${decision.replace('_', ' ')}${task.approvalNote ? `: ${task.approvalNote}` : ''}`,
      audience: 'general',
    });
    appendAudit(task, req, 'approval_decision', {
      to: decision,
      note: task.approvalNote,
    });

    await task.save();
    await notifyOnTaskUpgrade(task, req, {
      title: decision === 'approved' ? 'Task approved' : 'Task approval update',
      text: `${decision === 'approved' ? 'Task approved' : 'Task approval updated'}: ${getTaskTitle(task)}.`,
      metadata: {
        approvalStatus: decision,
        approvalNote: task.approvalNote,
      },
    });
    if (task.workflowStatus === 'completed') {
      await createCompletionReportForTask(task);
    }
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
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
    await notifyOnTaskUpgrade(task, req, {
      title: 'Task workflow changed',
      text: `Task workflow changed to ${workflowStatus.replace('_', ' ')}: ${getTaskTitle(task)}.`,
      metadata: {
        workflowStatus,
        previousWorkflow,
        previousStatus,
      },
    });
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
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
    await notifyOnTaskAssignment(task, req, previous);
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
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
    const { id } = req.params;
    const task = await ITTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Request or Task not found' });
    }

    if (req.user) {
      const userRole = normalizeRole(req.user.role);
      const isManager =
        isItManagerRole(userRole) ||
        isCsManagerRole(userRole) ||
        ['admin', 'supervisor', 'leader', 'ceo', 'coo', 'manager', 'salesmanager'].includes(userRole) ||
        userRole.includes('manager');

      const isSender = isTaskOwnerOrRequester(task, req.user);

      if (!isManager && !isSender) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: Only the sender and the manager are authorized to delete this request.',
        });
      }
    }

    appendAudit(task, req, 'deleted', { taskName: task.taskName });
    await ITTask.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Deleted successfully',
      data: { id },
    });
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

const submitFeedback = async (req, res) => {
  try {
    const { rating, comment, submittedBy } = req.body;
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.requesterFeedback = {
      rating: Number(rating) || 5,
      comment: comment || '',
      submittedBy: submittedBy || getUserDisplayName(req.user),
      submittedAt: new Date(),
    };

    appendAudit(task, req, 'feedback_submitted', {
      rating,
      note: comment,
    });

    await task.save();

    // Notify assigned IT staff and leader about the feedback & rating
    try {
      const isTicket = isSupportTicketTask(task);
      const participantAliases = collectTaskParticipantAliases(task);
      const taskTitle = getTaskTitle(task);
      const actorName = getUserDisplayName(req.user);
      const feedbackAuthor = task.requesterFeedback.submittedBy || actorName;
      const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
      const recipients = [];

      allUsers.forEach((u) => {
        const matches = getUserAliases(u).some((alias) => participantAliases.includes(alias));
        if (matches && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `Feedback received on ${taskTitle}: ${rating} ★ by ${feedbackAuthor}${comment ? ` - "${comment}"` : ''}.`,
            type: 'task',
            itTaskId: task._id,
            link: isTicket ? `/it?tab=tickets&task=${task._id}` : `/it?tab=projects&task=${task._id}`,
            metadata: {
              isTicket,
              title: 'Ticket Feedback Received',
              taskTitle,
              rating: Number(rating),
              comment: comment || '',
              authorName: feedbackAuthor,
              actionLabel: 'View Feedback',
            },
          });
        }
      });

      if (recipients.length) {
        const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
        const createdNotifications = await Notification.insertMany(uniqueRecipients);
        createdNotifications.forEach(emitNotification);
      }
    } catch (notifErr) {
      console.error('Feedback notification error:', notifErr);
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('submitFeedback error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewExternalProject = async (req, res) => {
  try {
    const { decision, taskLeader, assignedTo, note } = req.body;
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previousSnapshot = {
      status: task.status,
      workflowStatus: task.workflowStatus,
      taskLeader: task.taskLeader,
      assignedTo: task.assignedTo,
    };

    if (decision === 'accepted') {
      task.workflowStatus = 'assigned';
      task.status = 'ongoing';
      task.managerAcceptedAt = new Date();
      if (taskLeader !== undefined) task.taskLeader = String(taskLeader || '').trim();
      if (assignedTo !== undefined) {
        task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo].filter(Boolean);
      }

      task.comments.push({
        author: req.user?._id,
        authorName: getUserDisplayName(req.user),
        authorRole: req.user?.role || '',
        body: `Manager accepted and assigned external project${note ? `: ${note}` : ''}`,
        audience: 'cs_manager',
      });

      appendAudit(task, req, 'manager_review_accepted', {
        from: previousSnapshot,
        to: {
          workflowStatus: task.workflowStatus,
          status: task.status,
          taskLeader: task.taskLeader,
          assignedTo: task.assignedTo,
        },
        note: note || '',
      });

      await task.save();
      await notifyOnTaskAssignment(task, req, previousSnapshot);
      await notifyOnTaskUpgrade(task, req, {
        title: 'External project accepted',
        text: `External project accepted and assigned: ${getTaskTitle(task)}.`,
      });
    } else {
      task.workflowStatus = 'rejected';
      task.comments.push({
        author: req.user?._id,
        authorName: getUserDisplayName(req.user),
        authorRole: req.user?.role || '',
        body: `Manager rejected external project${note ? `: ${note}` : ''}`,
        audience: 'cs_manager',
      });

      appendAudit(task, req, 'manager_review_rejected', {
        from: previousSnapshot,
        to: { workflowStatus: task.workflowStatus },
        note: note || '',
      });

      await task.save();
      await notifyOnTaskUpgrade(task, req, {
        title: 'External project rejected',
        text: `External project request rejected: ${getTaskTitle(task)}.`,
      });
    }

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('reviewExternalProject error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const respondToExternalProject = async (req, res) => {
  try {
    const { decision, note } = req.body;
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previousWorkflow = task.workflowStatus;
    const actorName = getUserDisplayName(req.user);

    if (decision === 'accepted') {
      task.workflowStatus = 'in_progress';
      task.status = 'ongoing';

      task.comments.push({
        author: req.user?._id,
        authorName: actorName,
        authorRole: req.user?.role || '',
        body: `Accepted assigned work${note ? `: ${note}` : ''}`,
        audience: 'staff_manager',
      });

      appendAudit(task, req, 'staff_work_accepted', {
        from: { workflowStatus: previousWorkflow },
        to: { workflowStatus: task.workflowStatus, status: task.status },
        note: note || '',
      });

      await task.save();
      await notifyOnTaskUpgrade(task, req, {
        title: 'IT staff accepted work',
        text: `${actorName} accepted assigned work on ${getTaskTitle(task)}.`,
      });
    } else {
      task.workflowStatus = 'rejected';

      task.comments.push({
        author: req.user?._id,
        authorName: actorName,
        authorRole: req.user?.role || '',
        body: `Declined assigned work${note ? `: ${note}` : ''}`,
        audience: 'staff_manager',
      });

      appendAudit(task, req, 'staff_work_rejected', {
        from: { workflowStatus: previousWorkflow },
        to: { workflowStatus: task.workflowStatus },
        note: note || '',
      });

      await task.save();
      await notifyOnTaskUpgrade(task, req, {
        title: 'IT staff declined work',
        text: `${actorName} declined assigned work on ${getTaskTitle(task)}.`,
      });
    }

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('respondToExternalProject error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Support Request / Ticket
const createSupportRequest = async (req, res) => {
  try {
    const data = req.body || {};
    const taskName = String(data.taskName || '').trim() || String(data.summary || '').slice(0, 60).trim() || 'IT Support Request';
    const rawAttachments = data.attachments;
    const attachments = rawAttachments
      ? (Array.isArray(rawAttachments) ? rawAttachments : String(rawAttachments).split('\n').map((s) => s.trim()).filter(Boolean))
      : [];

    const priority = String(data.priority || 'normal').toLowerCase();
    const now = new Date();
    let responseHours = 4;
    let resolutionHours = 24;
    if (priority === 'critical') {
      responseHours = 0.5;
      resolutionHours = 4;
    } else if (priority === 'high') {
      responseHours = 2;
      resolutionHours = 8;
    } else if (priority === 'low') {
      responseHours = 8;
      resolutionHours = 48;
    }

    const responseDueAt = new Date(now.getTime() + responseHours * 60 * 60 * 1000);
    const resolutionDueAt = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);

    const task = new ITTask({
      taskName,
      projectType: 'internal',
      category: 'Support Ticket',
      platform: 'Internal Support',
      actionType: 'Support Request',
      description: data.summary || data.description || '',
      supportRequestNote: data.summary || data.description || '',
      ticketCategory: data.ticketCategory || 'support',
      priority,
      requestedBy: data.requestedBy || getUserDisplayName(req.user),
      requestedDepartment: data.requestedDepartment || req.user?.department || 'Customer Service',
      requestSource: data.requestSource || 'employee_call',
      requestedAt: now,
      status: 'pending',
      workflowStatus: 'pending',
      supportStatus: 'requested',
      attachments,
      sla: {
        responseDueAt,
        resolutionDueAt,
      },
      createdBy: req.user?._id,
      ticketRecords: [],
    });

    appendAudit(task, req, 'support_request_created', {
      to: {
        taskName: task.taskName,
        requestedBy: task.requestedBy,
        requestedDepartment: task.requestedDepartment,
        priority: task.priority,
      },
      note: task.supportRequestNote,
    });

    await task.save();

    // Send notifications to all active IT managers
    try {
      const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
      const recipients = [];
      const taskTitle = getTaskTitle(task);
      const actorName = getUserDisplayName(req.user);

      allUsers.forEach((u) => {
        const role = normalizeRole(u.role);
        if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `New IT support request from ${task.requestedBy || actorName}: ${taskTitle}.`,
            type: 'task',
            itTaskId: task._id,
            link: `/it?tab=tickets&task=${task._id}`,
            metadata: {
              title: 'New IT Support Request',
              taskTitle,
              taskLocation: getTaskLocation(task),
              actionLabel: 'Review Ticket',
              actorName,
            },
          });
        }
      });

      if (recipients.length) {
        const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
        const createdNotifications = await Notification.insertMany(uniqueRecipients);
        createdNotifications.forEach(emitNotification);
      }
    } catch (notifErr) {
      console.error('Support request notification error:', notifErr);
    }

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.status(201).json({ success: true, data: taskObj });
  } catch (error) {
    console.error('createSupportRequest error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manager Accept & Assign Support Request
const acceptSupportRequest = async (req, res) => {
  try {
    const { taskLeader, assignedTo, note } = req.body;
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const previousSnapshot = {
      taskLeader: task.taskLeader,
      assignedTo: task.assignedTo,
      supportStatus: task.supportStatus,
      workflowStatus: task.workflowStatus,
    };

    task.taskLeader = String(taskLeader || '').trim();
    if (assignedTo !== undefined) {
      task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo].filter(Boolean);
    }
    task.managerAcceptedAt = new Date();
    task.managerAcceptedByName = getUserDisplayName(req.user);
    task.managerAcceptedById = req.user?._id;
    task.supportStatus = 'assigned';
    task.workflowStatus = 'assigned';
    task.status = 'ongoing';

    if (note) {
      task.comments.push({
        author: req.user?._id,
        authorName: getUserDisplayName(req.user),
        authorRole: req.user?.role || '',
        body: `Manager accepted and assigned ticket: ${note}`,
        audience: 'general',
      });
    }

    appendAudit(task, req, 'support_request_accepted_and_assigned', {
      from: previousSnapshot,
      to: {
        taskLeader: task.taskLeader,
        assignedTo: task.assignedTo,
        supportStatus: task.supportStatus,
        workflowStatus: task.workflowStatus,
      },
      note: note || '',
    });

    await task.save();
    await notifyOnTaskAssignment(task, req, previousSnapshot);

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('acceptSupportRequest error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Accept Assigned Support Request
const staffAcceptSupport = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const actorName = getUserDisplayName(req.user);
    task.staffAcceptedAt = new Date();
    task.staffAcceptedByName = actorName;
    task.staffAcceptedById = req.user?._id;
    task.supportStatus = 'in_progress';
    task.workflowStatus = 'in_progress';
    task.status = 'ongoing';

    task.comments.push({
      author: req.user?._id,
      authorName: actorName,
      authorRole: req.user?.role || '',
      body: `Staff accepted ticket and started work.`,
      audience: 'general',
    });

    appendAudit(task, req, 'support_ticket_staff_accepted', {
      to: {
        staffAcceptedByName: actorName,
        supportStatus: task.supportStatus,
        workflowStatus: task.workflowStatus,
      },
      note: req.body.note || '',
    });

    await task.save();
    await notifyOnTaskUpgrade(task, req, {
      title: 'IT support ticket accepted by staff',
      text: `${actorName} accepted support ticket ${getTaskTitle(task)} and started work.`,
    });

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('staffAcceptSupport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Record Work / Report on Ticket
const recordSupportReport = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const data = req.body || {};
    const rawAttachments = data.attachments;
    const attachments = rawAttachments
      ? (Array.isArray(rawAttachments) ? rawAttachments : String(rawAttachments).split('\n').map((s) => s.trim()).filter(Boolean))
      : [];

    const record = {
      _id: new mongoose.Types.ObjectId(),
      taskId: task._id,
      workType: data.workType || 'support',
      summary: String(data.summary || '').trim(),
      outstandingTasks: String(data.outstandingTasks || '').trim(),
      attachments,
      completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
      durationMinutes: Number(data.durationMinutes) || 30,
      staff: req.user?._id,
      staffName: getUserDisplayName(req.user),
      staffRole: req.user?.role || '',
      approvalStatus: 'pending_approval',
      createdAt: new Date(),
    };

    if (!Array.isArray(task.ticketRecords)) {
      task.ticketRecords = [];
    }
    task.ticketRecords.push(record);
    task.markModified('ticketRecords');

    task.supportStatus = 'reported';
    task.workflowStatus = 'submitted';
    task.status = 'ongoing';

    appendAudit(task, req, 'support_ticket_work_reported', {
      note: record.summary,
      metadata: { recordId: record._id, workType: record.workType },
    });

    await task.save();
    await notifyOnTaskUpgrade(task, req, {
      title: 'Support ticket report submitted',
      text: `${record.staffName} submitted a work completion report on ${getTaskTitle(task)}.`,
    });

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.status(201).json({ success: true, data: taskObj, record });
  } catch (error) {
    console.error('recordSupportReport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manager Review / Approve Record
const updateTicketRecordApproval = async (req, res) => {
  try {
    const { approvalStatus, managerNote } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status. Must be approved or rejected.' });
    }

    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!Array.isArray(task.ticketRecords)) {
      task.ticketRecords = [];
    }

    const record = task.ticketRecords.find((r) => String(r._id) === String(req.params.recordId));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Ticket record not found' });
    }

    record.approvalStatus = approvalStatus;
    record.managerNote = managerNote || '';
    record.reviewedAt = new Date();
    record.reviewedBy = req.user?._id;
    record.reviewedByName = getUserDisplayName(req.user);

    if (approvalStatus === 'approved') {
      task.supportStatus = 'approved';
      task.workflowStatus = 'approved';
      task.status = 'done';
      await createCompletionReportForTask(task);
    } else {
      task.supportStatus = 'rejected';
      task.workflowStatus = 'rejected';
    }

    task.markModified('ticketRecords');
    appendAudit(task, req, `support_ticket_record_${approvalStatus}`, {
      note: managerNote || '',
      metadata: { recordId: record._id, approvalStatus },
    });

    await task.save();
    await notifyOnTaskUpgrade(task, req, {
      title: approvalStatus === 'approved' ? 'Ticket record approved' : 'Ticket record rejected',
      text: `Ticket record on ${getTaskTitle(task)} was ${approvalStatus} by ${getUserDisplayName(req.user)}.`,
    });

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('updateTicketRecordApproval error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Ticket Record
const deleteTicketRecord = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (Array.isArray(task.ticketRecords)) {
      task.ticketRecords = task.ticketRecords.filter((r) => String(r._id) !== String(req.params.recordId));
      task.markModified('ticketRecords');
    }

    appendAudit(task, req, 'support_ticket_record_deleted', {
      metadata: { recordId: req.params.recordId },
    });

    await task.save();
    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('deleteTicketRecord error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Reject Assigned Support Request
const staffRejectSupport = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const actorName = getUserDisplayName(req.user);
    const previousStaff = task.assignedTo;
    task.staffRejectedAt = new Date();
    task.staffRejectedByName = actorName;
    task.staffRejectedById = req.user?._id;
    task.staffRejectedReason = reason || '';
    task.assignedTo = [];
    task.supportStatus = 'staff_rejected';
    task.workflowStatus = 'rejected';
    task.status = 'pending';

    task.comments.push({
      author: req.user?._id,
      authorName: actorName,
      authorRole: req.user?.role || '',
      body: `Staff declined assigned ticket${reason ? `: ${reason}` : ''}`,
      audience: 'staff_manager',
    });

    appendAudit(task, req, 'support_ticket_staff_rejected', {
      from: { assignedTo: previousStaff, supportStatus: 'assigned' },
      to: { assignedTo: [], supportStatus: 'staff_rejected', workflowStatus: 'rejected' },
      note: reason || '',
    });

    await task.save();

    // Notify all active IT Managers about the rejection so they can reassign
    try {
      const allUsers = await User.find({ status: 'active' }).select('username fullName email role department status');
      const recipients = [];
      const taskTitle = getTaskTitle(task);

      allUsers.forEach((u) => {
        const role = normalizeRole(u.role);
        if (isItManagerRole(role) && String(u._id) !== String(req.user?._id)) {
          recipients.push({
            user: u._id,
            text: `Staff ${actorName} declined support ticket: ${taskTitle}${reason ? ` (Reason: ${reason})` : ''}. Reassignment needed.`,
            type: 'task',
            itTaskId: task._id,
            link: `/it?tab=tickets&task=${task._id}`,
            metadata: {
              isTicket: true,
              title: 'Support Ticket Declined by Staff',
              taskTitle,
              taskLocation: 'IT Support Department',
              actionLabel: 'Reassign Ticket',
              actorName,
              reason: reason || '',
            },
          });
        }
      });

      if (recipients.length) {
        const uniqueRecipients = Array.from(new Map(recipients.map((r) => [String(r.user), r])).values());
        const createdNotifications = await Notification.insertMany(uniqueRecipients);
        createdNotifications.forEach(emitNotification);
      }
    } catch (notifErr) {
      console.error('Staff reject notification error:', notifErr);
    }

    const taskObj = task.toObject ? task.toObject() : task;
    taskObj.comments = filterTaskCommentsForUser(taskObj, req.user);
    res.json({ success: true, data: taskObj });
  } catch (error) {
    console.error('staffRejectSupport error', error);
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
  createReport,
  submitFeedback,
  reviewExternalProject,
  respondToExternalProject,
  createSupportRequest,
  acceptSupportRequest,
  staffAcceptSupport,
  staffRejectSupport,
  recordSupportReport,
  updateTicketRecordApproval,
  deleteTicketRecord,
};
