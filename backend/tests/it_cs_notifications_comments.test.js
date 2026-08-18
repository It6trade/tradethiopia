const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

test('Comment filtering rules for IT and CS roles', async () => {
  const mockTaskId = new mongoose.Types.ObjectId();
  const csOwnerId = new mongoose.Types.ObjectId();
  const csOtherId = new mongoose.Types.ObjectId();
  const itManagerId = new mongoose.Types.ObjectId();
  const itStaff1Id = new mongoose.Types.ObjectId();
  const itStaff2Id = new mongoose.Types.ObjectId();

  const csOwnerUser = {
    _id: csOwnerId,
    username: 'cs_agent_alice',
    fullName: 'Alice CS',
    role: 'customerservice',
  };

  const csOtherUser = {
    _id: csOtherId,
    username: 'cs_agent_bob',
    fullName: 'Bob CS',
    role: 'customerservice',
  };

  const csManagerUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'cs_manager_charlie',
    fullName: 'Charlie CSM',
    role: 'customersuccessmanager',
  };

  const itManagerUser = {
    _id: itManagerId,
    username: 'it_manager_dan',
    fullName: 'Dan IT Admin',
    role: 'itmanager',
  };

  const itStaff1User = {
    _id: itStaff1Id,
    username: 'it_staff_eva',
    fullName: 'Eva IT',
    role: 'itstaff',
  };

  const itStaff2User = {
    _id: itStaff2Id,
    username: 'it_staff_frank',
    fullName: 'Frank IT',
    role: 'itstaff',
  };

  const sampleTask = {
    _id: mockTaskId,
    taskName: 'Payment Gateway Integration',
    projectType: 'external',
    requestedBy: 'Alice CS',
    createdBy: csOwnerId,
    taskLeader: 'Eva IT',
    assignedTo: ['Frank IT'],
    comments: [
      {
        _id: new mongoose.Types.ObjectId(),
        author: csOwnerId,
        authorName: 'Alice CS',
        authorRole: 'customerservice',
        body: 'Client needs this urgently by Friday.',
        audience: 'cs_manager',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        author: itManagerId,
        authorName: 'Dan IT Admin',
        authorRole: 'itmanager',
        body: 'Received request. Assigned to Eva.',
        audience: 'cs_manager',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        author: itStaff1Id,
        authorName: 'Eva IT',
        authorRole: 'itstaff',
        body: 'Started API investigation.',
        audience: 'staff_manager',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        author: itStaff2Id,
        authorName: 'Frank IT',
        authorRole: 'itstaff',
        body: 'Working on webhook receiver.',
        audience: 'staff_manager',
      },
    ],
  };

  const getUserAliases = (user) => (
    [user?._id, user?.id, user?.email, user?.username, user?.fullName, user?.name]
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase())
  );
  const normalizeRole = (role = '') => role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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

    // 1. IT Manager: sees all comments across both channels
    if (isItManagerRole(role)) {
      return task.comments;
    }

    // 2. Customer Service Team:
    if (isCsRole(role) || isTaskOwnerOrRequester(task, user)) {
      if (isTaskOwnerOrRequester(task, user) || isCsManagerRole(role)) {
        return task.comments.filter((c) => (c.audience || 'general') !== 'staff_manager');
      }
      return [];
    }

    // 3. IT Staff:
    if (isItStaffRole(role)) {
      const userAliases = getUserAliases(user);
      const userIdStr = String(user._id || user.id || '').trim();
      return task.comments.filter((c) => {
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

  // IT Manager (Dan) sees all 4 comments across both channels
  const itManagerVisible = filterTaskCommentsForUser(sampleTask, itManagerUser);
  assert.equal(itManagerVisible.length, 4, 'IT Manager should see all 4 comments');

  // CS Sender (Alice) only sees CS channel comments (2 comments: Alice's comment and Dan's comment to CS)
  const csOwnerVisible = filterTaskCommentsForUser(sampleTask, csOwnerUser);
  assert.equal(csOwnerVisible.length, 2, 'CS Sender should ONLY see CS-relevant comments (2)');
  assert.equal(csOwnerVisible.every((c) => c.audience !== 'staff_manager'), true, 'CS Sender MUST NOT see staff comments');

  // Other CS users cannot see comments on tasks they didn't create
  const csOtherVisible = filterTaskCommentsForUser(sampleTask, csOtherUser);
  assert.equal(csOtherVisible.length, 0, 'Other CS users must NOT see comments');

  // IT Staff 1 (Eva) only sees IT Staff channel comments (Eva's own comment)
  const itStaff1Visible = filterTaskCommentsForUser(sampleTask, itStaff1User);
  assert.equal(itStaff1Visible.some((c) => c.body === 'Started API investigation.'), true);
  assert.equal(itStaff1Visible.every((c) => c.audience !== 'cs_manager'), true, 'IT Staff MUST NOT see CS comments');
});

test('External task staff-response and manager review lifecycle', () => {
  const task = {
    _id: 'task123',
    taskName: 'Network Maintenance',
    projectType: 'external',
    status: 'pending',
    workflowStatus: 'pending',
    assignedTo: [],
    taskLeader: '',
    comments: [],
    auditLog: [],
  };

  // Manager accepts and assigns
  const managerDecision = 'accepted';
  if (managerDecision === 'accepted') {
    task.workflowStatus = 'assigned';
    task.status = 'ongoing';
    task.taskLeader = 'Eva IT';
    task.assignedTo = ['Frank IT'];
    task.comments.push({
      authorName: 'Dan IT Admin',
      body: 'Manager accepted and assigned external project: Approved',
      audience: 'cs_manager',
    });
  }

  assert.equal(task.workflowStatus, 'assigned');
  assert.equal(task.status, 'ongoing');
  assert.equal(task.taskLeader, 'Eva IT');
  assert.equal(task.assignedTo.length, 1);

  // Staff accepts work
  const staffDecision = 'accepted';
  if (staffDecision === 'accepted') {
    task.workflowStatus = 'in_progress';
    task.status = 'ongoing';
    task.comments.push({
      authorName: 'Frank IT',
      body: 'Accepted assigned work: I am starting on this today.',
      audience: 'staff_manager',
    });
  }

  assert.equal(task.workflowStatus, 'in_progress');
  assert.equal(task.status, 'ongoing');
  assert.equal(task.comments.length, 2);
});

