const crypto = require('crypto');
const { File } = require('node-fetch-native-with-agent');
const EmployeeRequest = require('../models/EmployeeRequest');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const { storage } = require('../config/appwriteClient');

const CATEGORY_SUBCATEGORIES = {
  leave: new Set([
    'annual_leave',
    'sick_leave',
    'paternity_leave',
    'maternity_leave',
    'marriage_leave',
    'unpaid_leave',
    'other_leave',
  ]),
  handover: new Set(['material_handover', 'task_handover']),
};

const MANAGER_ROLES = new Set([
  'admin', 'coo', 'ceo', 'supervisor', 'salesmanager',
  'customersuccessmanager', 'socialmediamanager', 'itmanager', 'itadmin',
]);
const HR_ROLES = new Set(['hr', 'admin']);
const normalizeRole = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const isManagerAccount = (user = {}) => {
  const role = normalizeRole(user.role);
  const title = normalizeRole(user.jobTitle);
  return MANAGER_ROLES.has(role) ||
    role.endsWith('manager') ||
    title.includes('manager') ||
    title.includes('supervisor') ||
    title.includes('teamlead');
};

const roleDepartment = (role = '') => {
  const normalized = normalizeRole(role);
  if (normalized.includes('sales')) return 'Sales';
  if (normalized.includes('customer')) return 'Customer Success';
  if (normalized.includes('social')) return 'Social Media';
  if (normalized.includes('it')) return 'IT';
  if (normalized.includes('tradex') || normalized === 'tetv') return 'TradexTV';
  if (normalized.includes('hr')) return 'HR';
  if (normalized.includes('finance')) return 'Finance';
  if (normalized.includes('instructor')) return 'Training';
  return '';
};

const userDepartment = (user) =>
  user?.department || roleDepartment(user?.role) || user?.jobTitle || 'General';

const resolveManager = async (requester) => {
  if (requester.managerId) {
    const assigned = await User.findById(requester.managerId)
      .select('_id fullName username email role jobTitle status');
    if (assigned && assigned.status === 'active') return assigned;
  }
  const department = userDepartment(requester);
  const users = await User.find({ status: 'active', _id: { $ne: requester._id } })
    .select('_id fullName username email role jobTitle status');
  return users.find((candidate) => {
    return isManagerAccount(candidate) && userDepartment(candidate).toLowerCase() === department.toLowerCase();
  }) || users.find((candidate) => ['admin', 'coo', 'supervisor'].includes(normalizeRole(candidate.role))) || null;
};

const required = (data, fields) => fields.filter((field) => !hasValue(data[field]));
const addisAbabaSubmission = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );
  const minutesAfterMidnight = (Number(parts.hour) * 60) + Number(parts.minute);
  return {
    submittedAt: date.toISOString(),
    submittedLocalDate: `${parts.year}-${parts.month}-${parts.day}`,
    submittedLocalTime: new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Addis_Ababa',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date),
    submissionTimezone: 'Africa/Addis_Ababa',
    halfDaySession: minutesAfterMidnight < 750 ? 'morning' : 'afternoon',
    sessionCutoff: '12:30 PM',
  };
};

const validateForm = (category, subcategory, data = {}) => {
  if (!CATEGORY_SUBCATEGORIES[category]?.has(subcategory)) return ['valid category and subcategory'];
  if (category === 'leave') {
    const commonFields = ['reason', 'contactDuringLeave', 'handoverTo'];
    if (subcategory === 'annual_leave' && data.leaveDuration === 'half_day') {
      const missing = required(data, ['halfDayDate', ...commonFields]);
      if (missing.length) return missing;
      Object.assign(data, addisAbabaSubmission());
      delete data.startDate;
      delete data.endDate;
      delete data.totalDays;
      delete data.startTime;
      delete data.endTime;
      delete data.totalHours;
      delete data.halfDayPeriod;
      return [];
    }
    data.leaveDuration = 'full_day';
    delete data.halfDayDate;
    delete data.startTime;
    delete data.endTime;
    delete data.totalHours;
    return required(data, ['startDate', 'endDate', ...commonFields]);
  }
  if (subcategory === 'material_handover') {
    return required(data, [
      'incomingEmployeeId', 'handoverDate', 'makeModel', 'serialNumber',
      'assetTag', 'physicalCondition', 'functionalIssues', 'laptopUsername',
    ]);
  }
  return required(data, [
    'incomingEmployeeId', 'handoverDate', 'lastWorkingDate',
    'responsibilities', 'pendingTasks', 'importantContacts',
  ]);
};

const requestNumber = () =>
  `ER-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const createNotification = async (req, userId, text, targetId, actionLabel) => {
  if (!userId) return;
  const notification = await Notification.create({
    user: userId,
    text,
    type: 'request',
    targetId,
    link: '/employee-requests',
    metadata: { title: 'Employee request update', actionLabel },
  });
  const io = req.app.get('io');
  const socketId = req.app.get('connectedUsers')?.get?.(String(userId));
  if (io && socketId) io.to(socketId).emit('newNotification', notification.toObject());
};

const sendNotificationsSafely = async (notifications, context) => {
  const results = await Promise.allSettled(notifications);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(`${context} notification failed:`, result.reason);
    }
  });
};

const uploadAttachments = async (files = []) => {
  const uploaded = [];
  for (const file of files) {
    const appwriteFile = await storage.createFile({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId: 'unique()',
      file: new File([file.buffer], `${Date.now()}-${file.originalname}`, { type: file.mimetype }),
    });
    uploaded.push({
      fileId: appwriteFile.$id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }
  return uploaded;
};

const attachmentUrl = (fileId) =>
  `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

const present = (request) => {
  const item = request.toObject ? request.toObject() : request;
  return {
    ...item,
    attachments: (item.attachments || []).map((attachment) => ({
      ...attachment,
      url: attachmentUrl(attachment.fileId),
    })),
  };
};

exports.create = async (req, res) => {
  try {
    const category = String(req.body.category || '').trim();
    const subcategory = String(req.body.subcategory || '').trim();
    let formData;
    try {
      formData = typeof req.body.formData === 'string' ? JSON.parse(req.body.formData) : req.body.formData;
    } catch {
      return res.status(400).json({ message: 'Invalid form data.' });
    }
    const missing = validateForm(category, subcategory, formData || {});
    if (missing.length) return res.status(400).json({ message: `Required fields missing: ${missing.join(', ')}` });

    const manager = await resolveManager(req.user);
    if (!manager) {
      return res.status(400).json({ message: 'No active manager is assigned to this employee. Contact HR.' });
    }
    const attachments = await uploadAttachments(req.files || []);
    const laptopPassword = String(formData.laptopPassword || '');
    delete formData.laptopPassword;
    formData.credentialsTransferred = Boolean(laptopPassword);

    const item = await EmployeeRequest.create({
      requestNumber: requestNumber(),
      requester: req.user._id,
      manager: manager._id,
      department: userDepartment(req.user),
      category,
      subcategory,
      title: subcategory === 'annual_leave' && formData.leaveDuration === 'half_day'
        ? `${formData.halfDaySession === 'afternoon' ? 'Afternoon' : 'Morning'} Half-Day Annual Leave Request`
        : String(req.body.title || '').trim() || `${subcategory.replace(/_/g, ' ')} request`,
      formData,
      attachments,
      history: [{
        action: 'submitted',
        status: 'pending_manager',
        actor: req.user._id,
        actorRole: req.user.role,
        note: 'Request submitted for manager review.',
      }],
    });
    await createNotification(req, manager._id, `${req.user.fullName || req.user.username} submitted ${item.title}.`, item._id, 'Review request');
    const populated = await EmployeeRequest.findById(item._id)
      .populate('requester', 'fullName username email digitalId jobTitle role')
      .populate('manager', 'fullName username email digitalId jobTitle role');
    res.status(201).json({ success: true, data: present(populated) });
  } catch (error) {
    console.error('Create employee request failed:', error);
    res.status(500).json({ message: error.message || 'Unable to create request.' });
  }
};

const list = async (filter, res) => {
  const items = await EmployeeRequest.find(filter)
    .populate('requester', 'fullName username email digitalId jobTitle role')
    .populate('manager', 'fullName username email digitalId jobTitle role')
    .populate('managerDecision.decidedBy', 'fullName username role')
    .populate('hrDecision.decidedBy', 'fullName username role')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: items.map(present) });
};

exports.mine = async (req, res) => {
  try { await list({ requester: req.user._id }, res); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.accessContext = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const submissionManager = await resolveManager(req.user);
    const managedEmployees = await User.find({ managerId: req.user._id }).distinct('_id');
    const unassignedEmployees = await User.find({ managerId: null }).distinct('_id');
    const department = userDepartment(req.user);
    const departmentManagerFilter = isManagerAccount(req.user) && department !== 'General'
      ? [{ department, status: 'pending_manager' }]
      : [];
    const assignedRequestCount = await EmployeeRequest.countDocuments({
      status: 'pending_manager',
      $or: [
        { requester: { $in: managedEmployees } },
        { manager: req.user._id, requester: { $in: unassignedEmployees } },
        ...departmentManagerFilter,
      ],
    });
    res.json({
      success: true,
      data: {
        userId: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        email: req.user.email,
        role,
        displayRole: req.user.role,
        department,
        submissionManager: submissionManager ? {
          _id: submissionManager._id,
          fullName: submissionManager.fullName,
          username: submissionManager.username,
          email: submissionManager.email,
          role: submissionManager.role,
          jobTitle: submissionManager.jobTitle,
          assignmentSource: String(req.user.managerId || '') === String(submissionManager._id)
            ? 'employee assignment'
            : 'department routing',
        } : null,
        isHr: HR_ROLES.has(role),
        hasManagerQueue: assignedRequestCount > 0,
        assignedRequestCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.managerInbox = async (req, res) => {
  try {
    // Assignment is the source of authority. A line manager may retain a
    // departmental login role, so role-name checks must not hide their queue.
    // Pending requests also follow the employee's current manager assignment,
    // which repairs requests submitted before HR corrected managerId.
    const managedEmployees = await User.find({ managerId: req.user._id }).distinct('_id');
    const unassignedEmployees = await User.find({ managerId: null }).distinct('_id');
    const department = userDepartment(req.user);
    const departmentManagerFilter = isManagerAccount(req.user) && department !== 'General'
      ? [{ department, status: 'pending_manager' }]
      : [];
    await list({
      $or: [
        { manager: req.user._id, status: { $ne: 'pending_manager' } },
        { requester: { $in: managedEmployees }, status: 'pending_manager' },
        {
          manager: req.user._id,
          requester: { $in: unassignedEmployees },
          status: 'pending_manager',
        },
        ...departmentManagerFilter,
      ],
    }, res);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.hrInbox = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) return res.status(403).json({ message: 'HR access required.' });
    // HR receives a request only after the assigned manager approves it.
    // Completed HR decisions remain visible as HR records, while requests that
    // are still with (or were rejected by) the manager never enter this queue.
    await list({
      status: { $in: ['pending_hr', 'hr_approved', 'hr_rejected'] },
    }, res);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// HR leave register includes every workflow stage for reporting and follow-up.
// Decision permissions remain unchanged: HR can act only on pending_hr items.
exports.hrLeaveDashboard = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'HR access required.' });
    }
    await list({ category: 'leave' }, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.details = async (req, res) => {
  try {
    const item = await EmployeeRequest.findById(req.params.id)
      .populate('requester', 'fullName username email digitalId jobTitle role')
      .populate('manager', 'fullName username email digitalId jobTitle role')
      .populate('history.actor', 'fullName username role');
    if (!item) return res.status(404).json({ message: 'Request not found.' });
    const role = normalizeRole(req.user.role);
    const allowed = String(item.requester._id) === String(req.user._id) ||
      String(item.manager._id) === String(req.user._id) || HR_ROLES.has(role);
    if (!allowed) return res.status(403).json({ message: 'You cannot view this request.' });
    res.json({ success: true, data: present(item) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.managerDecision = async (req, res) => {
  try {
    const decision = String(req.body.decision || '').toLowerCase();
    const note = String(req.body.note || '').trim();
    if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'Invalid decision.' });
    if (decision === 'rejected' && !note) return res.status(400).json({ message: 'A rejection reason is required.' });
    const item = await EmployeeRequest.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Assigned request not found.' });
    if (item.status !== 'pending_manager') return res.status(409).json({ message: 'This request is no longer awaiting manager review.' });
    const requester = await User.findById(item.requester).select('managerId');
    const isRecordedManager = String(item.manager) === String(req.user._id);
    const isCurrentManager = String(requester?.managerId || '') === String(req.user._id);
    const isDepartmentManager = isManagerAccount(req.user) &&
      userDepartment(req.user).toLowerCase() === String(item.department || '').toLowerCase();
    if (!isRecordedManager && !isCurrentManager && !isDepartmentManager) {
      return res.status(403).json({ message: 'This request is assigned to another manager.' });
    }
    if (!isRecordedManager && (isCurrentManager || isDepartmentManager)) {
      item.manager = req.user._id;
      item.history.push({
        action: 'manager_assignment_synchronized',
        status: item.status,
        actor: req.user._id,
        actorRole: req.user.role,
        note: 'Pending request synchronized with the employee’s active departmental manager.',
      });
    }
    item.status = decision === 'approved' ? 'pending_hr' : 'manager_rejected';
    item.managerDecision = { decidedBy: req.user._id, decision, note, decidedAt: new Date() };
    item.history.push({ action: `manager_${decision}`, status: item.status, actor: req.user._id, actorRole: req.user.role, note });
    await item.save();
    const notifications = [
      createNotification(req, item.requester, `Your ${item.title} was ${decision} by your manager.`, item._id, 'View request'),
    ];
    if (decision === 'approved') {
      const hrUsers = await User.find({ role: { $in: ['HR', 'hr', 'admin'] }, status: 'active' }).select('_id');
      notifications.push(
        ...hrUsers.map((user) => createNotification(req, user._id, `${item.title} is ready for HR review.`, item._id, 'Review request'))
      );
    }
    await sendNotificationsSafely(notifications, 'Manager decision');
    res.json({ success: true, data: present(item) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.hrDecision = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) return res.status(403).json({ message: 'HR access required.' });
    const decision = String(req.body.decision || '').toLowerCase();
    const note = String(req.body.note || '').trim();
    if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ message: 'Invalid decision.' });
    if (decision === 'rejected' && !note) return res.status(400).json({ message: 'A rejection reason is required.' });
    const nextStatus = decision === 'approved' ? 'hr_approved' : 'hr_rejected';
    const decidedAt = new Date();
    const item = await EmployeeRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending_hr' },
      {
        $set: {
          status: nextStatus,
          hrDecision: { decidedBy: req.user._id, decision, note, decidedAt },
        },
        $push: {
          history: {
            action: `hr_${decision}`,
            status: nextStatus,
            actor: req.user._id,
            actorRole: req.user.role,
            note,
            occurredAt: decidedAt,
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate('requester', 'fullName username email digitalId jobTitle role')
      .populate('manager', 'fullName username email digitalId jobTitle role')
      .populate('hrDecision.decidedBy', 'fullName username role');
    if (!item) {
      const existing = await EmployeeRequest.findById(req.params.id).select('status');
      if (!existing) return res.status(404).json({ message: 'Request not found.' });
      return res.status(409).json({
        message: `This request is no longer awaiting HR review. Current status: ${existing.status.replace(/_/g, ' ')}.`,
      });
    }
    const message = `HR ${decision} ${item.title}.`;
    await sendNotificationsSafely([
      createNotification(req, item.requester?._id || item.requester, message, item._id, 'View final decision'),
      createNotification(req, item.manager?._id || item.manager, message, item._id, 'View final decision'),
    ], 'HR decision');
    res.json({ success: true, data: present(item) });
  } catch (error) {
    console.error('HR employee-request decision failed:', error);
    res.status(500).json({ message: error.message || 'Unable to save the HR decision.' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const item = await EmployeeRequest.findOne({ _id: req.params.id, requester: req.user._id });
    if (!item) return res.status(404).json({ message: 'Request not found.' });
    if (item.status !== 'pending_manager') return res.status(409).json({ message: 'Only requests awaiting manager review can be cancelled.' });
    item.status = 'cancelled';
    item.history.push({ action: 'cancelled', status: 'cancelled', actor: req.user._id, actorRole: req.user.role, note: String(req.body.note || '') });
    await item.save();
    await createNotification(req, item.manager, `${item.title} was cancelled by the employee.`, item._id, 'View request');
    res.json({ success: true, data: present(item) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.managerOptions = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'HR access required.' });
    }
    const users = await User.find({ status: 'active' })
      .select('_id fullName username email role jobTitle managerId')
      .sort({ fullName: 1, username: 1 })
      .lean();
    const managers = users.filter(isManagerAccount);
    res.json({ success: true, data: { employees: users, managers } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignManager = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'HR access required.' });
    }
    const employee = await User.findById(req.params.userId);
    const manager = await User.findById(req.body.managerId).select('_id role jobTitle status');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (!manager || manager.status !== 'active' || !isManagerAccount(manager)) {
      return res.status(400).json({ message: 'Select an active manager account.' });
    }
    if (String(employee._id) === String(manager._id)) {
      return res.status(400).json({ message: 'An employee cannot be their own manager.' });
    }
    employee.managerId = manager._id;
    await employee.save();
    res.json({ success: true, data: { userId: employee._id, managerId: manager._id } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reassignRequest = async (req, res) => {
  try {
    if (!HR_ROLES.has(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: 'HR access required.' });
    }
    const item = await EmployeeRequest.findById(req.params.id);
    const manager = await User.findById(req.body.managerId).select('_id fullName username role jobTitle status');
    if (!item) return res.status(404).json({ message: 'Request not found.' });
    if (item.status !== 'pending_manager') {
      return res.status(409).json({ message: 'Only requests awaiting manager review can be reassigned.' });
    }
    if (!manager || manager.status !== 'active' || !isManagerAccount(manager)) {
      return res.status(400).json({ message: 'Select an active manager account.' });
    }
    const previousManager = item.manager;
    item.manager = manager._id;
    item.history.push({
      action: 'manager_reassigned',
      status: item.status,
      actor: req.user._id,
      actorRole: req.user.role,
      note: `HR reassigned this request to ${manager.fullName || manager.username}.`,
    });
    await item.save();
    await Promise.all([
      createNotification(req, manager._id, `${item.title} was assigned to you for review.`, item._id, 'Review request'),
      createNotification(req, item.requester, `${item.title} was reassigned to ${manager.fullName || manager.username}.`, item._id, 'View request'),
      String(previousManager) === String(manager._id)
        ? Promise.resolve()
        : createNotification(req, previousManager, `${item.title} was reassigned by HR.`, item._id, 'View request'),
    ]);
    const populated = await EmployeeRequest.findById(item._id)
      .populate('requester', 'fullName username email digitalId jobTitle role')
      .populate('manager', 'fullName username email digitalId jobTitle role');
    res.json({ success: true, data: present(populated) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
