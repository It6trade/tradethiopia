const mongoose = require('mongoose');

const ContentTrackerEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
    type: String,
    enum: ['Video', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads'],
    default: 'Video',
  },
  link: {
    type: String,
    trim: true,
    default: '',
  },
  imageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  platform: {
    type: String,
    trim: true,
    default: '',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  shares: {
    type: Number,
    default: 0,
    min: 0,
  },
  date: {
    type: Date,
    default: () => new Date(),
  },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('ContentTrackerEntry', ContentTrackerEntrySchema);
