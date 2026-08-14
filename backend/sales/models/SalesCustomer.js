const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  grossCommission: { type: Number, default: 0 },
  commissionTax: { type: Number, default: 0 },
  netCommission: { type: Number, default: 0 }
}, { _id: false });

const WORKFLOW_STATUSES = ['New', 'Pending Assignment', 'Assigned', 'In Progress', 'Closed'];

const salesCustomerSchema = new mongoose.Schema({
  agentId: {
    type: String,
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['Reception', 'Sales', 'Followup', 'Other'],
    default: 'Sales',
    index: true
  },
  productInterest: {
    type: String,
    default: ''
  },
  pipelineStatus: {
    type: String,
    enum: WORKFLOW_STATUSES,
    default: 'New',
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  customerName: {
    type: String,
    required: true
  },
  contactTitle: {
    type: String
  },
  phone: {
    type: String
  },
  callStatus: {
    type: String,
    enum: ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback', '2x Called'],
    default: 'Not Called'
  },
  followupStatus: {
    type: String,
    enum: ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled', 'Imported'],
    default: 'Pending'
  },
  packageScope: {
    type: String,
    enum: ['Local', 'International', ''],
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  schedulePreference: {
    type: String,
    enum: ['Regular', 'Weekend', 'Night', 'Online'],
    default: 'Regular'
  },
  // Lead source: how this customer was acquired (for sales pipeline classification)
  leadSource: {
    type: String,
    enum: ['Cold Call', 'Warm Lead', 'Referral', 'Walk-in', 'Other'],
    default: 'Cold Call',
    index: true
  },
  // Scheduled follow-up date: agent pins a date to contact this customer
  scheduledDate: {
    type: Date,
    default: null,
    index: true
  },
  email: {
    type: String
  },
  note: {
    type: String
  },
  supervisorComment: {
    type: String
  },
  courseName: {
    type: String
  },
  courseId: {
    type: String
  },
  // Commission fields
  coursePrice: {
    type: Number,
    default: 0
  },
  commission: {
    type: commissionSchema,
    default: undefined
  },
  
  // Commission approval tracking
  commissionApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesCustomer', salesCustomerSchema);
