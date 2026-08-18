const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  month: {
    type: String, // Format: 'YYYY-MM'
    required: true,
    index: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  awardType: {
    type: String,
    enum: ['Department Winner', 'Overall Winner'],
    required: true,
    index: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

awardSchema.index({ month: 1, department: 1, awardType: 1 });

module.exports = mongoose.model('Award', awardSchema);
