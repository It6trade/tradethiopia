const mongoose = require('mongoose');

const PackageSaleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  packageName: {
    type: String,
    default: ''
  },
  packageType: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  callStatus: {
    type: String,
    enum: ['Not Called', 'Called', 'Busy', 'No Answer', 'Callback', '2x Called'],
    default: 'Not Called'
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agentName: {
    type: String,
    default: ''
  },
  customerType: {
    type: String,
    default: 'PackageSales'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

PackageSaleSchema.add({
  firstCommissionApproved: {
    type: Boolean,
    default: false
  },
  secondCommissionApproved: {
    type: Boolean,
    default: false
  },
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
});

module.exports = mongoose.model('PackageSale', PackageSaleSchema);
