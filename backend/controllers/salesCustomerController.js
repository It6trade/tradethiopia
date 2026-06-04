const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const { calculateCommission } = require('../utils/commission');

const normalizeRoleValue = (value) => (value || '').toString().trim().toLowerCase();
const PRIVILEGED_ROLES = new Set([
  'admin',
  'customerservice',
  'customer service',
  'customersuccessmanager',
  'customer success manager',
  'customer_success_manager',
  'coo',
  'salesmanager',
  'sales_manager',
  'sales manager',
  'finance',
  'reception'
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findUsersByRoles = async (roles) => {
  if (!roles || !roles.length) return [];
  const filters = roles.map((role) => ({ role: { $regex: `^${escapeRegex(role)}$`, $options: 'i' } }));
  return await User.find({ $or: filters }).select('_id username role');
};

const createNotifications = async ({ userIds = [], roles = [], text, type = 'general' }) => {
  if (!text || (!userIds.length && !roles.length)) return;
  const targetIds = new Set(userIds.map((id) => id?.toString?.()).filter(Boolean));
  if (roles.length) {
    const users = await findUsersByRoles(roles);
    users.forEach((user) => {
      if (user && user._id) {
        targetIds.add(user._id.toString());
      }
    });
  }
  if (!targetIds.size) return;
  const docs = Array.from(targetIds).map((userId) => ({
    user: userId,
    text,
    type
  }));
  await Notification.insertMany(docs);
};

// @desc    Get all customers for logged in agent
// @route   GET /api/sales-customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const normalizedUserRole = normalizeRoleValue(req.user?.role);
  const filter = {};

  const canViewAll = PRIVILEGED_ROLES.has(normalizedUserRole);
  if (!canViewAll) {
    filter.agentId = req.user.id;
  }
  
  // Name filter (searches both customerName and agentName)
  if (req.query.name) {
    const nameRegex = new RegExp(req.query.name, 'i');
    const agentId = await getAgentIdByName(req.query.name);
    
    if (agentId) {
      filter.$or = [
        { customerName: nameRegex },
        { agentId: agentId }
      ];
    } else {
      filter.customerName = nameRegex;
    }
  }
  
  // Phone number filter (supports partial search)
  if (req.query.phone) {
    // Normalize phone number for consistent search
    const normalizedPhone = normalizePhoneNumberForSearch(req.query.phone);
    filter.phone = { $regex: new RegExp(normalizedPhone, 'i') };
  }
  
  // Agent filter
  if (req.query.agent) {
    filter.agentId = req.query.agent;
  }

  if (req.query.productInterest) {
    const escaped = escapeRegex(req.query.productInterest);
    filter.productInterest = { $regex: new RegExp(escaped, 'i') };
  }

  if (req.query.pipelineStatus || req.query.workflowStatus) {
    const statusQuery = req.query.pipelineStatus || req.query.workflowStatus;
    filter.pipelineStatus = { $regex: new RegExp(`^${escapeRegex(statusQuery)}$`, 'i') };
  }

  if (req.query.source) {
    filter.source = { $regex: new RegExp(`^${escapeRegex(req.query.source)}$`, 'i') };
  }
  
  // Customer ID filter
  if (req.query.customerId) {
    filter._id = req.query.customerId;
  }
  
  // Date range filters
  if (req.query.dateFrom || req.query.dateTo) {
    filter.date = {};
    if (req.query.dateFrom) {
      filter.date.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.date.$lte = new Date(req.query.dateTo);
    }
  }
  
  // Optional followupStatus filter (case insensitive exact match)
  if (req.query.followupStatus) {
    filter.followupStatus = { $regex: new RegExp(`^${req.query.followupStatus}$`, 'i') };
  }
  
  const customers = await SalesCustomer.find(filter).lean();

  // Attach agentName by looking up user records
  const agentIds = [...new Set(customers.map((c) => c.agentId).filter(Boolean))];
  const users = agentIds.length
    ? await User.find({ _id: { $in: agentIds } }).select('username name fullName')
    : [];
  const userMap = users.reduce((acc, u) => {
    acc[u._id.toString()] = u.username || u.name || u.fullName || '';
    return acc;
  }, {});

  const withAgentName = customers.map((c) => ({
    ...c,
    agentName: userMap[c.agentId?.toString()] || c.agentId || 'Unknown',
  }));

  res.json(withAgentName);
});

// Helper function to normalize phone numbers for search
const normalizePhoneNumberForSearch = (phone) => {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // For search, we want to match various formats
  // Return the digits only for regex matching
  return normalized.replace(/^\+?251|^0?/, '');
};

// Helper function to get agent ID by name
const getAgentIdByName = async (name) => {
  try {
    const user = await User.findOne({
      $or: [
        { username: new RegExp(name, 'i') },
        { name: new RegExp(name, 'i') },
        { fullName: new RegExp(name, 'i') }
      ]
    }).select('_id');
    
    return user ? user._id : null;
  } catch (error) {
    return null;
  }
};

// @desc    Get customer by ID
// @route   GET /api/sales-customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id).lean();
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const normalizedUserRole = normalizeRoleValue(req.user.role);
  const ownsRecord = customer.agentId && customer.agentId.toString() === req.user.id.toString();
  const isPrivileged = PRIVILEGED_ROLES.has(normalizedUserRole);
  if (!ownsRecord && !isPrivileged) {
    res.status(403);
    throw new Error('You do not have permission to view this customer');
  }

  let agentName = customer.agentId;
  if (customer.agentId) {
    const u = await User.findById(customer.agentId).select('username name fullName');
    agentName = u ? (u.username || u.name || u.fullName || customer.agentId) : customer.agentId;
  }
  res.json({ ...customer, agentName });
});

// @desc    Create new customer
// @route   POST /api/sales-customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const {
    customerName,
    contactTitle,
    phone,
    callStatus,
    followupStatus,
    schedulePreference,
    email,
    note,
    supervisorComment,
    courseName,
    courseId,
    coursePrice,
    productInterest,
    source,
    pipelineStatus,
    packageScope
  } = req.body;
  const resolvedCallStatus = callStatus || 'Not Called';
  const resolvedFollowupStatus = followupStatus || 'Pending';

  const normalizedRole = normalizeRoleValue(req.user.role);
  const isReception = normalizedRole === 'reception';
  const assignedAgentId = isReception ? null : req.user.id;
  const assignedBy = isReception ? undefined : req.user._id;
  const assignedAt = isReception ? undefined : new Date();
  const normalizedPrice = Number(coursePrice) || 0;
  const resolvedPipelineStatus = isReception ? 'Pending Assignment' : (pipelineStatus || 'Assigned');
  const resolvedSource = isReception ? 'Reception' : (source || 'Sales');

  const customer = new SalesCustomer({
    agentId: assignedAgentId,
    createdBy: req.user._id,
    source: resolvedSource,
    productInterest: productInterest || contactTitle || courseName || '',
    pipelineStatus: resolvedPipelineStatus,
    assignedBy,
    assignedAt,
    customerName,
    contactTitle,
    phone,
    callStatus: resolvedCallStatus,
    followupStatus: resolvedFollowupStatus,
    packageScope: packageScope || '',
    schedulePreference,
    email,
    note,
    supervisorComment,
    courseName: courseName || contactTitle,
    courseId,
    coursePrice: normalizedPrice,
    commission: calculateCommission(normalizedPrice)
  });

  const createdCustomer = await customer.save();

  if (isReception) {
    await createNotifications({
      roles: ['salesmanager'],
      text: `🆕 New customer added by Reception: ${customer.customerName}. Assign a sales agent.`,
      type: 'task'
    });
  }

  res.status(201).json(createdCustomer);
});

// @desc    Update customer
// @route   PUT /api/sales-customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const {
    customerName,
    contactTitle,
    phone,
    callStatus,
    followupStatus,
    schedulePreference,
    email,
    note,
    supervisorComment,
    courseName,
    courseId,
    coursePrice,
    packageScope
  } = req.body;

  const customer = await SalesCustomer.findById(req.params.id);

  const normalizedRole = normalizeRoleValue(req.user.role);
  if (normalizedRole === 'reception') {
    res.status(403);
    throw new Error('Reception cannot modify sales data');
  }

  if (customer && customer.agentId && customer.agentId.toString() === req.user.id.toString()) {
    if (!customer.createdBy) {
      customer.createdBy = req.user._id;
    }
    customer.customerName = customerName || customer.customerName;
    customer.contactTitle = contactTitle || customer.contactTitle;
    customer.phone = phone || customer.phone;
    customer.callStatus = callStatus || customer.callStatus;
    customer.followupStatus = followupStatus || customer.followupStatus;
    customer.schedulePreference = schedulePreference || customer.schedulePreference;
    customer.email = email || customer.email;
    customer.note = note || customer.note;
    customer.supervisorComment = supervisorComment || customer.supervisorComment;
    customer.courseName = courseName || customer.courseName || contactTitle || customer.contactTitle;
    customer.courseId = courseId || customer.courseId;
    const finalCoursePrice = coursePrice !== undefined && coursePrice !== null
      ? Number(coursePrice)
      : customer.coursePrice;
    customer.coursePrice = finalCoursePrice || 0;
    customer.commission = calculateCommission(customer.coursePrice);
    customer.packageScope = packageScope || customer.packageScope || '';

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Assign customer to agent (Sales Manager only)
// @route   PUT /api/sales-customers/:id/assign
// @access  Private (Sales Manager)
const assignCustomer = asyncHandler(async (req, res) => {
  const normalizedRole = normalizeRoleValue(req.user.role);
  const managerRoles = ['salesmanager', 'sales_manager', 'sales manager'];
  if (!managerRoles.includes(normalizedRole)) {
    res.status(403);
    throw new Error('Only sales managers can assign customers');
  }

  const { assignedAgentId } = req.body;
  if (!assignedAgentId) {
    res.status(400);
    throw new Error('assignedAgentId is required');
  }

  if (assignedAgentId === req.user.id) {
    res.status(403);
    throw new Error('Sales Manager cannot assign customer to themselves');
  }

  const agentUser = await User.findById(assignedAgentId);
  if (!agentUser || normalizeRoleValue(agentUser.role) !== 'sales') {
    res.status(403);
    throw new Error('Assigned user must be a sales agent');
  }

  const customer = await SalesCustomer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!customer.createdBy) {
    customer.createdBy = req.user._id;
  }

  customer.agentId = assignedAgentId;
  customer.assignedBy = req.user._id;
  customer.assignedAt = new Date();
  customer.pipelineStatus = 'Assigned';
  const updatedCustomer = await customer.save();

  await createNotifications({
    userIds: [assignedAgentId],
    text: `🆕 You were assigned ${updatedCustomer.customerName} by Sales Manager ${req.user.username || req.user._id}`,
    type: 'task'
  });

  res.json(updatedCustomer);
});

// @desc    Delete customer
// @route   DELETE /api/sales-customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id);

  if (customer && customer.agentId.toString() === req.user.id.toString()) {
    await customer.remove();
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Get sales stats for logged in agent
// @route   GET /api/sales-customers/stats
// @access  Private
const getSalesStats = asyncHandler(async (req, res) => {
  try {
    // Total customers for this agent
    const total = await SalesCustomer.countDocuments({ agentId: req.user.id });
    
    // New customers (created in the last 30 days)
    const newCount = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Active customers (called in the last 30 days)
    const activeCount = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      lastCalled: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Completed deals (followupStatus = 'Completed')
    const completedDeals = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      followupStatus: 'Completed'
    });
    
    // Called customers (callStatus = 'Called')
    const calledCustomers = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      callStatus: 'Called'
    });
    
    res.json({
      total,
      new: newCount,
      active: activeCount,
      completedDeals,
      calledCustomers
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching sales stats", 
      error: error.message 
    });
  }
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  assignCustomer,
  deleteCustomer,
  getSalesStats
};
