const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
      index: true,
    },
    department: {
      type: String,
      default: 'Customer Service',
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Manager',
    },
    authorRole: {
      type: String,
      default: 'Customer Service Manager',
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: { type: String, default: '' },
        userRole: { type: String, default: '' },
        userEmail: { type: String, default: '' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    attachments: [
      {
        name: { type: String, default: '' },
        url: { type: String, default: '' },
        fileType: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ department: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
