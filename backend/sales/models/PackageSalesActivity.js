const mongoose = require('mongoose');

const packageSalesActivitySchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: ['sms', 'email', 'call', 'note', 'task'],
    required: true,
    index: true
  },
  customerId: {
    type: String,
    default: '',
    index: true
  },
  packageId: {
    type: String,
    default: '',
    index: true
  },
  customerType: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
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
  subject: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'logged',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PackageSalesActivity', packageSalesActivitySchema);
