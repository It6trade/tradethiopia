const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Commission Details
  numberOfSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  // Add new fields for detailed commission breakdown
  grossCommission: {
    type: Number,
    default: 0
  },
  commissionTax: {
    type: Number,
    default: 0
  },
  commissionDetails: [
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesCustomer'
      },
      customerName: String,
      saleAmount: Number,
      commissionRate: Number,
      commissionAmount: Number,
      grossCommission: Number,
      commissionTax: Number,
      netCommission: Number,
      date: Date
    }
  ],
  // Status and Metadata
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
commissionSchema.index({ userId: 1, month: 1, year: 1 });
commissionSchema.index({ department: 1 });

module.exports = mongoose.model('Commission', commissionSchema);