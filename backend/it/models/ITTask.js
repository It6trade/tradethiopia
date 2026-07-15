const mongoose = require('mongoose');

const ITTaskSchema = new mongoose.Schema({
  taskName: { type: String, required: false },
  projectType: { type: String, enum: ['internal', 'external'], required: true },
  // For external tasks: category (should be a string, not array); for internal: platform (should also be a string)
  category: { type: String, default: '' },
  platform: { type: String, default: '' },
  client: { type: String, default: '' },
  actionType: {
    type: String,
    required: true
  },
  ticketCategory: {
    type: String,
    enum: ['network', 'hardware', 'software', 'account', 'security', 'maintenance', 'support', 'other'],
    default: 'support'
  },
  requestSource: {
    type: String,
    enum: ['manager', 'leader', 'staff_request', 'employee_call', 'system', 'other'],
    default: 'manager'
  },
  supportStatus: {
    type: String,
    enum: ['requested', 'manager_accepted', 'assigned', 'staff_accepted', 'in_progress', 'reported', 'approved', 'rejected', 'closed'],
    default: 'assigned'
  },
  supportRequestNote: { type: String, default: '' },
  requestedBy: { type: String, default: '' },
  requestedDepartment: { type: String, default: '' },
  requestedAt: { type: Date },
  managerAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  managerAcceptedByName: { type: String, default: '' },
  managerAcceptedAt: { type: Date },
  staffAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  staffAcceptedByName: { type: String, default: '' },
  staffAcceptedAt: { type: Date },
  description: { type: String, default: '' },
  attachments: [{ type: String }], // Array of file URLs
  status: { type: String, enum: ['pending', 'ongoing', 'done'], default: 'pending' },
  workflowStatus: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  progressNote: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  submittedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  rejectedAt: { type: Date },
  approvalStatus: { type: String, enum: ['not_submitted', 'pending_approval', 'approved', 'rejected'], default: 'not_submitted' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  approvedAt: { type: Date },
  approvalNote: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  remarks: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  taskLeader: { type: String, default: '' },
  assignedTo: [{ type: String }], // Array of assigned user IDs
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  featureCount: { type: Number, default: 0 }, // Number of features added to the task
  ticketRecords: [{
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    staffName: { type: String, default: '' },
    staffRole: { type: String, default: '' },
    workType: {
      type: String,
      enum: ['network', 'hardware', 'software', 'account', 'security', 'maintenance', 'support', 'other'],
      default: 'support'
    },
    summary: { type: String, required: true },
    outstandingTasks: { type: String, default: '' },
    completedAt: { type: Date, default: Date.now },
    durationMinutes: { type: Number, min: 0, default: 0 },
    points: { type: Number, min: 0, default: 1 },
    approvalStatus: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    approvedByName: { type: String, default: '' },
    approvedAt: { type: Date },
    managerNote: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: '' },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reminders: [{
    title: { type: String, required: true },
    note: { type: String, default: '' },
    type: { type: String, enum: ['task', 'action', 'deadline', 'review'], default: 'task' },
    dueAt: { type: Date },
    isDone: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    createdAt: { type: Date, default: Date.now }
  }],
  auditLog: [{
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true },
    from: { type: mongoose.Schema.Types.Mixed },
    to: { type: mongoose.Schema.Types.Mixed },
    note: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ITTask', ITTaskSchema);
