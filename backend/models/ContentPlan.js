const mongoose = require('mongoose');

const ContentPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: '',
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['Video', 'Poster', 'Carousel', 'Article', 'Story', 'Live', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads'],
      default: 'Video',
    },
    platform: {
      type: String,
      trim: true,
      default: '',
    },
    scheduledDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    slot: {
      type: String,
      trim: true,
      default: '9:00 AM',
    },
    day: {
      type: String,
      trim: true,
      default: 'Mon',
    },
    staff: {
      type: String,
      trim: true,
      default: '',
    },
    approval: {
      type: String,
      enum: ['Draft', 'Pending Review', 'Scheduled', 'Posted'],
      default: 'Draft',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    trackerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentTrackerEntry',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ContentPlan', ContentPlanSchema);
