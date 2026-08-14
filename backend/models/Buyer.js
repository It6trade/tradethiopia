const mongoose = require('mongoose');

const BuyerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  contactPerson: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  products: [{
    type: String,
  }],
  requirements: {
    type: String,
    required: false,
  },
  // Simple package type field like in customer follow-up page
  packageType: {
    type: String,
    required: false,
  },
  packageScope: {
    type: String,
    enum: ["Local", "International", ""],
    default: "",
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  kpiPoint: {
    type: Number,
    default: 1,
    min: 0,
  },
  // Add packages field for tracking purchased packages
  packages: [{
    packageName: String,
    packageType: String,
    purchaseDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled'],
      default: 'Active'
    }
  }],
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  
  // Commission approval tracking
  commissionApproved: {
    type: Boolean,
    default: false
  },
  firstCommissionApproved: {
    type: Boolean,
    default: false
  },
  secondCommissionApproved: {
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
  timestamps: true,
});

module.exports = mongoose.model('Buyer', BuyerSchema);
