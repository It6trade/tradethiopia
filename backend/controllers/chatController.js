const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const ITTask = require('../it/models/ITTask');
const { emitToConversation, emitToUsers } = require('../services/chatSocketService');
const { storage } = require('../config/appwriteClient');
const { File } = require('node-fetch-native-with-agent');

const normalizeText = (value) => (value || '').toString().trim();

const normalizeRole = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const ROLE_DEPARTMENT_MAP = {
  admin: 'Admin',
  finance: 'Finance',
  hr: 'HR',
  sales: 'Sales',
  salesmanager: 'Sales',
  salessupervisor: 'Sales',
  customerservice: 'Customer Success',
  customersuccess: 'Customer Success',
  customersuccessmanager: 'Customer Success',
  socialmediamanager: 'Social Media',
  socialmedia: 'Social Media',
  it: 'IT',
  tetv: 'TradexTV',
  tradextv: 'TradexTV',
  tradex: 'TradexTV',
  coo: 'Operations',
  supervisor: 'Operations',
  instructor: 'Training',
  eventmanager: 'Events',
  enisra: 'ENISRA',
  reception: 'Reception',
  itadmin: 'IT',
  itmanager: 'IT',
  itteamleader: 'IT',
  itleader: 'IT',
  itstaff: 'IT',
  itofficer: 'IT',
};

const GROUP_CREATOR_ROLES = new Set([
  'admin',
  'finance',
  'coo',
  'supervisor',
  'salesmanager',
  'hr',
  'it',
]);
const CHANNEL_WATCHER_ROLES = new Set(['admin', 'finance', 'coo', 'supervisor']);
const SALES_TEAM_ROLES = new Set(['sales', 'salesmanager', 'salessupervisor']);
const SALES_LEADERSHIP_ROLES = new Set(['salesmanager', 'admin', 'coo', 'supervisor']);
const appwriteBucketId = process.env.APPWRITE_BUCKET_ID || '';
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID || '';
const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const getDepartmentFromUser = (user) => {
  const department = normalizeText(user?.department);
  if (department) return department;
  return ROLE_DEPARTMENT_MAP[normalizeRole(user?.role)] || '';
};

const getDisplayName = (user) => user?.fullName || user?.username || user?.email || 'A teammate';

const buildUserSnapshot = (user) => ({
  _id: user._id,
  username: user.username,
  fullName: user.fullName || '',
  email: user.email,
  role: user.role,
  normalizedRole: normalizeRole(user.role),
  department: getDepartmentFromUser(user),
  photo: user.photo || null,
});

const buildDirectKey = (userIds = []) =>
  [...userIds].map(String).sort().join(':');

const buildDepartmentKey = (department) =>
  normalizeText(department)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const buildAppwriteViewUrl = (fileId) =>
  `https://cloud.appwrite.io/v1/storage/buckets/${appwriteBucketId}/files/${fileId}/view?project=${appwriteProjectId}`;

const getConversationParticipantIds = (conversation) =>
  (conversation.participants || []).map((item) => item.user?._id || item.user).filter(Boolean);

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

const isItAdminRole = (role) => ['admin', 'itmanager', 'itadmin'].includes(normalizeRole(role));
const isItLeaderRole = (role) => ['itteamleader', 'itleader'].includes(normalizeRole(role));
const isItStaffRole = (role) => ['it', 'itstaff', 'itofficer'].includes(normalizeRole(role));
const isItScopedRole = (role) => isItAdminRole(role) || isItLeaderRole(role) || isItStaffRole(role);

const taskConnectsUsers = (task, leftUser, rightUser) => {
  const leftAliases = getUserAliases(leftUser);
  const rightAliases = getUserAliases(rightUser);
  const leader = String(task.taskLeader || '').trim().toLowerCase();
  const assignees = (task.assignedTo || []).map((item) => String(item).trim().toLowerCase());
  const allTaskAssignees = [
    leader,
    ...assignees,
    task.submittedBy,
    task.createdBy,
    task.approvedBy,
  ]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase());

  const leftIsLeader = leader && leftAliases.includes(leader);
  const rightIsLeader = leader && rightAliases.includes(leader);
  const leftIsAssignee = assignees.some((item) => leftAliases.includes(item));
  const rightIsAssignee = assignees.some((item) => rightAliases.includes(item));
  const leftTouchesTask = allTaskAssignees.some((item) => leftAliases.includes(item));
  const rightTouchesTask = allTaskAssignees.some((item) => rightAliases.includes(item));

  return (leftIsLeader && rightIsAssignee) || (rightIsLeader && leftIsAssignee) || (leftTouchesTask && rightTouchesTask);
};

const canDirectChat = async (currentUser, otherUser) => {
  const currentRole = normalizeRole(currentUser?.role);
  const otherRole = normalizeRole(otherUser?.role);

  if (!isItScopedRole(currentRole) && !isItScopedRole(otherRole)) return true;
  if (isItAdminRole(currentRole)) return isItScopedRole(otherRole);
  if (isItAdminRole(otherRole)) return isItScopedRole(currentRole);

  if (
    (isItLeaderRole(currentRole) && isItStaffRole(otherRole)) ||
    (isItStaffRole(currentRole) && isItLeaderRole(otherRole))
  ) {
    const aliases = [...getUserAliases(currentUser), ...getUserAliases(otherUser)];
    const tasks = await ITTask.find({
      $or: [
        { taskLeader: { $in: aliases } },
        { assignedTo: { $in: aliases } },
      ],
    }).select('taskLeader assignedTo');

    return tasks.some((task) => taskConnectsUsers(task, currentUser, otherUser));
  }

  return false;
};

const conversationLabelForUser = (conversation, currentUserId) => {
  if (conversation.kind !== 'direct') {
    return conversation.title || 'Group chat';
  }
  const other = (conversation.participants || []).find(
    (participant) => String(participant.user?._id || participant.user) !== String(currentUserId)
  );
  if (!other) return 'Direct chat';
  const otherUser = other.user;
  return (
    otherUser?.fullName ||
    otherUser?.username ||
    conversation.title ||
    'Direct chat'
  );
};

const formatConversation = async (conversation, currentUserId) => {
  const participant = (conversation.participants || []).find(
    (item) => String(item.user?._id || item.user) === String(currentUserId)
  );
  const lastReadAt = participant?.lastReadAt || null;
  const unreadCount = await ChatMessage.countDocuments({
    conversation: conversation._id,
    sender: { $ne: currentUserId },
    ...(lastReadAt ? { createdAt: { $gt: lastReadAt } } : {}),
  });

  return {
    _id: conversation._id,
    kind: conversation.kind,
    title: conversationLabelForUser(conversation, currentUserId),
    rawTitle: conversation.title || '',
    description: conversation.description || '',
    avatarColor: conversation.avatarColor,
    createdBy: conversation.createdBy,
    managedKey: conversation.managedKey || '',
    departmentKey: conversation.departmentKey || '',
    lastMessage: conversation.lastMessage || null,
    lastActivityAt: conversation.lastActivityAt,
    unreadCount,
    participants: (conversation.participants || []).map((item) => ({
      user: item.user && typeof item.user === 'object' ? buildUserSnapshot(item.user) : { _id: item.user },
      role: item.role || '',
      department: item.department || '',
      muted: !!item.muted,
      archived: !!item.archived,
      joinedAt: item.joinedAt,
      lastReadAt: item.lastReadAt,
    })),
  };
};

const formatMessage = (message) => ({
  _id: message._id,
  conversation: message.conversation,
  sender: message.sender && typeof message.sender === 'object' ? buildUserSnapshot(message.sender) : { _id: message.sender },
  body: message.body,
  attachments: message.attachments || [],
  replyTo:
    message.replyTo && typeof message.replyTo === 'object'
      ? {
          _id: message.replyTo._id,
          body: message.replyTo.body,
          sender:
            message.replyTo.sender && typeof message.replyTo.sender === 'object'
              ? buildUserSnapshot(message.replyTo.sender)
              : { _id: message.replyTo.sender },
        }
      : null,
  readBy: (message.readBy || []).map((item) => ({
    user: item.user && typeof item.user === 'object' ? buildUserSnapshot(item.user) : { _id: item.user },
    readAt: item.readAt,
  })),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  editedAt: message.editedAt,
  deletedAt: message.deletedAt,
  deletedBy: message.deletedBy,
});

const refreshConversationAfterMessageMutation = async (conversationId, currentUserId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'username fullName email role photo department')
    .populate('createdBy', 'username fullName email role photo department');

  if (!conversation) return null;

  const latestMessage = await ChatMessage.findOne({ conversation: conversation._id })
    .sort({ createdAt: -1, _id: -1 })
    .select('body attachments sender createdAt');

  if (latestMessage) {
    conversation.lastMessage = {
      body: latestMessage.body || `${latestMessage.attachments?.length || 0} attachment${latestMessage.attachments?.length === 1 ? '' : 's'}`,
      sender: latestMessage.sender,
      createdAt: latestMessage.createdAt,
    };
    conversation.lastActivityAt = latestMessage.createdAt;
  } else {
    conversation.lastMessage = { body: '', sender: null, createdAt: null };
    conversation.lastActivityAt = conversation.updatedAt || conversation.createdAt || new Date();
  }

  await conversation.save();
  const formattedConversation = await formatConversation(conversation, currentUserId);
  return { conversation, formattedConversation };
};

const ensureParticipant = (conversation, userId) =>
  (conversation.participants || []).some((item) => String(item.user?._id || item.user) === String(userId));

const upsertManagedConversation = async ({
  kind,
  managedKey,
  title,
  description,
  avatarColor,
  createdBy,
  users,
}) => {
  const uniqueUsers = [];
  const seen = new Set();

  users.forEach((candidate) => {
    if (!candidate?._id) return;
    const id = String(candidate._id);
    if (!seen.has(id)) {
      seen.add(id);
      uniqueUsers.push(candidate);
    }
  });

  if (uniqueUsers.length < 2) return null;

  const participants = uniqueUsers.map((candidate) => ({
    user: candidate._id,
    role: candidate.role || '',
    department: getDepartmentFromUser(candidate),
  }));

  let conversation = await Conversation.findOne({ managedKey });
  if (!conversation) {
    conversation = await Conversation.create({
      kind,
      managedKey,
      title,
      description,
      avatarColor,
      createdBy,
      participants,
    });
    return conversation;
  }

  const existingIds = new Set((conversation.participants || []).map((item) => String(item.user)));
  const nextIds = new Set(participants.map((item) => String(item.user)));
  const participantChanged =
    existingIds.size !== nextIds.size || [...existingIds].some((id) => !nextIds.has(id));
  const metadataChanged =
    conversation.title !== title ||
    conversation.description !== description ||
    conversation.avatarColor !== avatarColor ||
    conversation.kind !== kind;

  if (participantChanged || metadataChanged) {
    conversation.kind = kind;
    conversation.title = title;
    conversation.description = description;
    conversation.avatarColor = avatarColor;
    conversation.participants = participants;
    await conversation.save();
  }

  return conversation;
};

const ensureDepartmentConversation = async (user) => {
  const userDepartment = getDepartmentFromUser(user);
  if (!userDepartment) return;

  const departmentKey = buildDepartmentKey(userDepartment);
  if (!departmentKey) return;

  const candidates = (
    await User.find({ status: 'active' })
      .select('username fullName email role photo department status')
      .limit(500)
  ).filter(
    (candidate) =>
      String(candidate._id) === String(user._id) ||
      getDepartmentFromUser(candidate) === userDepartment ||
      CHANNEL_WATCHER_ROLES.has(normalizeRole(candidate.role))
  );

  const uniqueUsers = [];
  const seen = new Set();
  candidates.forEach((candidate) => {
    const id = String(candidate._id);
    if (!seen.has(id)) {
      seen.add(id);
      uniqueUsers.push(candidate);
    }
  });

  if (uniqueUsers.length < 2) return;

  const participants = uniqueUsers.map((candidate) => ({
    user: candidate._id,
    role: candidate.role || '',
    department: getDepartmentFromUser(candidate),
  }));

  let conversation = await Conversation.findOne({ departmentKey });
  if (!conversation) {
    await Conversation.create({
      kind: 'department',
      title: `${userDepartment} Channel`,
      description: `${userDepartment} team updates and collaboration`,
      avatarColor: '#2563eb',
      createdBy: user._id,
      departmentKey,
      participants,
    });
    return;
  }

  const existingIds = new Set((conversation.participants || []).map((item) => String(item.user)));
  const nextIds = new Set(participants.map((item) => String(item.user)));
  const changed =
    existingIds.size !== nextIds.size ||
    [...existingIds].some((id) => !nextIds.has(id));

  if (changed) {
    conversation.participants = participants;
    await conversation.save();
  }
};

const ensureSalesConversations = async (user) => {
  const normalizedUserRole = normalizeRole(user?.role);
  const userDepartment = getDepartmentFromUser(user);
  const isSalesUser =
    SALES_TEAM_ROLES.has(normalizedUserRole) ||
    normalizeText(userDepartment).toLowerCase() === 'sales';

  if (!isSalesUser) return;

  const salesCandidates = await User.find({
    status: 'active',
    role: { $in: Array.from(SALES_TEAM_ROLES) },
  }).select('username fullName email role photo department status');

  await upsertManagedConversation({
    kind: 'group',
    managedKey: 'sales-team',
    title: 'Sales Team',
    description: 'Shared space for sales reps, pipeline updates, and coordination.',
    avatarColor: '#0f766e',
    createdBy: user._id,
    users: salesCandidates,
  });

  const leadershipCandidates = await User.find({
    status: 'active',
    role: { $in: Array.from(SALES_LEADERSHIP_ROLES) },
  }).select('username fullName email role photo department status');

  await upsertManagedConversation({
    kind: 'group',
    managedKey: 'sales-leadership',
    title: 'Sales Leadership',
    description: 'Escalations, approvals, and direction between sales leadership and operations.',
    avatarColor: '#7c3aed',
    createdBy: user._id,
    users: leadershipCandidates,
  });
};

const getConversationOrThrow = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error('Invalid conversation identifier');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('participants.user', 'username fullName email role photo department')
    .populate('createdBy', 'username fullName email role photo department');

  if (!conversation || !conversation.isActive) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  if (!ensureParticipant(conversation, userId)) {
    const error = new Error('You are not a participant in this conversation');
    error.statusCode = 403;
    throw error;
  }

  return conversation;
};

const listUsers = async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const currentRole = normalizeRole(req.user?.role);
    const query = {
      _id: { $ne: req.user._id },
      status: 'active',
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    let users = await User.find(query)
      .select('username fullName email role photo department status')
      .sort({ fullName: 1, username: 1 })
      .limit(isItScopedRole(currentRole) ? 500 : 50);

    if (isItScopedRole(currentRole)) {
      const lowerSearch = search.toLowerCase();
      users = users.filter((candidate) => {
        if (!isItScopedRole(candidate.role)) return false;
        if (!search) return true;
        return [candidate.username, candidate.fullName, candidate.email, candidate.role, candidate.department]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lowerSearch));
      });

      const checked = await Promise.all(
        users.map(async (candidate) => ((await canDirectChat(req.user, candidate)) ? candidate : null))
      );
      users = checked.filter(Boolean);
    }

    res.json({
      success: true,
      data: users.map(buildUserSnapshot),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to list chat users' });
  }
};

const listConversations = async (req, res) => {
  try {
    await ensureDepartmentConversation(req.user);
    await ensureSalesConversations(req.user);
    const conversations = await Conversation.find({
      isActive: true,
      'participants.user': req.user._id,
      'participants.archived': { $ne: true },
    })
      .populate('participants.user', 'username fullName email role photo department')
      .populate('createdBy', 'username fullName email role photo department')
      .sort({ lastActivityAt: -1 })
      .limit(100);

    const data = await Promise.all(conversations.map((conversation) => formatConversation(conversation, req.user._id)));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to load conversations' });
  }
};

const createDirectConversation = async (req, res) => {
  try {
    const participantId = normalizeText(req.body.participantId);
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ success: false, message: 'A valid participant is required' });
    }

    if (String(participantId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot create a direct chat with yourself' });
    }

    const otherUser = await User.findOne({ _id: participantId, status: 'active' }).select(
      'username fullName email role photo department status'
    );
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'Selected user was not found' });
    }

    if (!(await canDirectChat(req.user, otherUser))) {
      return res.status(403).json({
        success: false,
        message: 'This chat is not available for your IT role permissions.',
      });
    }

    const directKey = buildDirectKey([req.user._id, otherUser._id]);
    let conversation = await Conversation.findOne({ directKey })
      .populate('participants.user', 'username fullName email role photo department')
      .populate('createdBy', 'username fullName email role photo department');

    if (!conversation) {
      conversation = await Conversation.create({
        kind: 'direct',
        createdBy: req.user._id,
        directKey,
        title: '',
        participants: [
          {
            user: req.user._id,
            role: req.user.role || '',
            department: getDepartmentFromUser(req.user),
          },
          {
            user: otherUser._id,
            role: otherUser.role || '',
            department: getDepartmentFromUser(otherUser),
          },
        ],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants.user', 'username fullName email role photo department')
        .populate('createdBy', 'username fullName email role photo department');
    }

    const data = await formatConversation(conversation, req.user._id);
    emitToUsers(
      conversation.participants.map((item) => item.user?._id || item.user),
      'chat:conversation-updated',
      { conversation: data }
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create direct chat' });
  }
};

const createGroupConversation = async (req, res) => {
  try {
    if (!GROUP_CREATOR_ROLES.has(normalizeRole(req.user.role))) {
      return res.status(403).json({ success: false, message: 'Your role cannot create group conversations' });
    }

    const title = normalizeText(req.body.title);
    const description = normalizeText(req.body.description);
    const avatarColor = normalizeText(req.body.avatarColor) || '#0f766e';
    const participantIds = Array.isArray(req.body.participantIds)
      ? req.body.participantIds.map((item) => normalizeText(item)).filter(Boolean)
      : [];

    if (!title) {
      return res.status(400).json({ success: false, message: 'Group title is required' });
    }

    const uniqueIds = [...new Set([String(req.user._id), ...participantIds])].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (uniqueIds.length < 2) {
      return res.status(400).json({ success: false, message: 'A group needs at least two valid participants' });
    }

    const users = await User.find({ _id: { $in: uniqueIds }, status: 'active' }).select(
      'username fullName email role photo department status'
    );

    if (users.length !== uniqueIds.length) {
      return res.status(400).json({ success: false, message: 'One or more participants are invalid or inactive' });
    }

    const conversation = await Conversation.create({
      kind: 'group',
      title,
      description,
      avatarColor,
      createdBy: req.user._id,
      participants: users.map((user) => ({
        user: user._id,
        role: user.role || '',
        department: getDepartmentFromUser(user),
      })),
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'username fullName email role photo department')
      .populate('createdBy', 'username fullName email role photo department');

    const data = await formatConversation(populatedConversation, req.user._id);
    emitToUsers(
      populatedConversation.participants.map((item) => item.user?._id || item.user),
      'chat:conversation-updated',
      { conversation: data }
    );

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create group chat' });
  }
};

const listMessages = async (req, res) => {
  try {
    const conversation = await getConversationOrThrow(req.params.id, req.user._id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const before = normalizeText(req.query.before);
    const query = { conversation: conversation._id };

    if (before && mongoose.Types.ObjectId.isValid(before)) {
      query._id = { $lt: before };
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'username fullName email role photo department')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username fullName email role photo department' },
      })
      .sort({ _id: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: messages.reverse().map(formatMessage),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const conversation = await getConversationOrThrow(req.params.id, req.user._id);
    const body = normalizeText(req.body.body);
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    const replyTo = normalizeText(req.body.replyTo);

    if (!body && !attachments.length) {
      return res.status(400).json({ success: false, message: 'A message body or attachment is required' });
    }

    let replyTarget = null;
    if (replyTo) {
      if (!mongoose.Types.ObjectId.isValid(replyTo)) {
        return res.status(400).json({ success: false, message: 'Invalid reply target' });
      }
      replyTarget = await ChatMessage.findOne({ _id: replyTo, conversation: conversation._id });
      if (!replyTarget) {
        return res.status(404).json({ success: false, message: 'Reply target not found in this conversation' });
      }
    }

    const message = await ChatMessage.create({
      conversation: conversation._id,
      sender: req.user._id,
      body,
      attachments: attachments.slice(0, 5).map((item) => ({
        name: normalizeText(item.name),
        url: normalizeText(item.url),
        mimeType: normalizeText(item.mimeType),
        size: Number(item.size) || 0,
      })),
      replyTo: replyTarget?._id || null,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    conversation.lastMessage = {
      body: body || `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`,
      sender: req.user._id,
      createdAt: message.createdAt,
    };
    conversation.lastActivityAt = message.createdAt;
    conversation.participants = (conversation.participants || []).map((item) => {
      if (String(item.user?._id || item.user) === String(req.user._id)) {
        return {
          ...item.toObject ? item.toObject() : item,
          lastReadMessage: message._id,
          lastReadAt: message.createdAt,
        };
      }
      return item;
    });
    await conversation.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'username fullName email role photo department')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username fullName email role photo department' },
      });

    const formattedMessage = formatMessage(populatedMessage);
    const formattedConversation = await formatConversation(
      await Conversation.findById(conversation._id)
        .populate('participants.user', 'username fullName email role photo department')
        .populate('createdBy', 'username fullName email role photo department'),
      req.user._id
    );

    const participantIds = conversation.participants.map((item) => item.user?._id || item.user);
    const recipientIds = participantIds.filter((id) => String(id) !== String(req.user._id));
    const notificationDocs = recipientIds.map((userId) => ({
      user: userId,
      text: `${getDisplayName(req.user)} sent you a chat message`,
      type: 'chat',
    }));
    if (notificationDocs.length) {
      const createdNotifications = await Notification.insertMany(notificationDocs);
      createdNotifications.forEach((notification) => {
        emitToUsers([notification.user], 'newNotification', {
          id: notification._id,
          text: notification.text,
          read: notification.read,
          type: notification.type,
          createdAt: notification.createdAt,
        });
      });
    }

    emitToConversation(conversation._id, 'chat:message-created', {
      conversationId: String(conversation._id),
      message: formattedMessage,
    });
    emitToUsers(participantIds, 'chat:conversation-updated', {
      conversation: formattedConversation,
    });

    res.status(201).json({ success: true, data: formattedMessage });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to send message' });
  }
};

const uploadConversationAttachments = async (req, res) => {
  try {
    await getConversationOrThrow(req.params.id, req.user._id);

    if (!appwriteBucketId || !appwriteProjectId) {
      return res.status(500).json({ success: false, message: 'Appwrite storage is not configured' });
    }

    const files = Array.isArray(req.files) ? req.files.slice(0, MAX_ATTACHMENT_COUNT) : [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    const uploadedAttachments = [];
    for (const uploadedFile of files) {
      if (!uploadedFile.buffer?.length) continue;
      if (uploadedFile.size > MAX_ATTACHMENT_SIZE) {
        return res.status(400).json({
          success: false,
          message: `${uploadedFile.originalname} exceeds the 10 MB upload limit`,
        });
      }

      const safeName = `${Date.now()}-${uploadedFile.originalname}`;
      const appwriteFile = new File([uploadedFile.buffer], safeName, { type: uploadedFile.mimetype });
      const stored = await storage.createFile({
        bucketId: appwriteBucketId,
        fileId: 'unique()',
        file: appwriteFile,
      });

      uploadedAttachments.push({
        name: uploadedFile.originalname,
        url: buildAppwriteViewUrl(stored.$id),
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size || 0,
      });
    }

    res.status(201).json({ success: true, data: uploadedAttachments });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload attachments',
    });
  }
};

const updateMessage = async (req, res) => {
  try {
    const conversation = await getConversationOrThrow(req.params.id, req.user._id);
    const messageId = normalizeText(req.params.messageId);
    const body = normalizeText(req.body.body);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid message identifier' });
    }

    if (!body) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      conversation: conversation._id,
      sender: req.user._id,
      deletedAt: null,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or cannot be edited' });
    }

    message.body = body;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'username fullName email role photo department')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username fullName email role photo department' },
      });

    const formattedMessage = formatMessage(populatedMessage);
    const refreshed = await refreshConversationAfterMessageMutation(conversation._id, req.user._id);

    emitToConversation(conversation._id, 'chat:message-updated', {
      conversationId: String(conversation._id),
      message: formattedMessage,
    });

    if (refreshed) {
      emitToUsers(getConversationParticipantIds(refreshed.conversation), 'chat:conversation-updated', {
        conversation: refreshed.formattedConversation,
      });
    }

    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update message' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const conversation = await getConversationOrThrow(req.params.id, req.user._id);
    const messageId = normalizeText(req.params.messageId);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid message identifier' });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      conversation: conversation._id,
      sender: req.user._id,
      deletedAt: null,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or cannot be deleted' });
    }

    message.body = 'deleted message';
    message.attachments = [];
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'username fullName email role photo department')
      .populate('deletedBy', 'username fullName email role photo department')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username fullName email role photo department' },
      });

    const refreshed = await refreshConversationAfterMessageMutation(conversation._id, req.user._id);
    const formattedMessage = formatMessage(populatedMessage);

    emitToConversation(conversation._id, 'chat:message-deleted', {
      conversationId: String(conversation._id),
      messageId: String(message._id),
      message: formattedMessage,
    });

    if (refreshed) {
      emitToUsers(getConversationParticipantIds(refreshed.conversation), 'chat:conversation-updated', {
        conversation: refreshed.formattedConversation,
      });
    }

    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to delete message' });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const conversation = await getConversationOrThrow(req.params.id, req.user._id);
    const messageId = normalizeText(req.body.messageId);
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'A valid message identifier is required' });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      conversation: conversation._id,
    });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found in this conversation' });
    }

    await ChatMessage.updateOne(
      { _id: message._id, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    conversation.participants = (conversation.participants || []).map((item) => {
      if (String(item.user?._id || item.user) === String(req.user._id)) {
        return {
          ...item.toObject ? item.toObject() : item,
          lastReadMessage: message._id,
          lastReadAt: new Date(),
        };
      }
      return item;
    });
    await conversation.save();

    emitToConversation(conversation._id, 'chat:message-read', {
      conversationId: String(conversation._id),
      messageId: String(message._id),
      userId: String(req.user._id),
      readAt: new Date().toISOString(),
    });

    res.json({ success: true, data: { conversationId: conversation._id, messageId: message._id } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to mark conversation as read' });
  }
};

module.exports = {
  createDirectConversation,
  createGroupConversation,
  deleteMessage,
  listConversations,
  listMessages,
  listUsers,
  markConversationRead,
  sendMessage,
  updateMessage,
  uploadConversationAttachments,
};
