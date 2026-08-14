const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    index: true
  },
  agentName: {
    type: String,
    required: true
  },
  // Weekly targets
  weeklySalesTarget: {
    type: Number,
    default: 0
  },
  // Monthly targets
  monthlySalesTarget: {
    type: Number,
    default: 0
  },
  // Period information
  periodType: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // Created and updated timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
salesTargetSchema.index({ agentId: 1, periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);