const mongoose = require('mongoose');

const tessbinExamRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    session: {
      type: String,
      enum: ['Regular', 'Morning Class', 'Afternoon', 'Night Session'],
      default: 'Regular',
    },
    examType: {
      type: String,
      enum: ['COC Exam', 'Online Final Exam', 'Course Assessment'],
      required: true,
      index: true,
    },
    examMode: {
      type: String,
      enum: ['Online', 'On-Site', 'Hybrid'],
      default: 'Online',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Passed', 'Failed', 'Scheduled', 'In Progress'],
      default: 'Scheduled',
      index: true,
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
    certificateStatus: {
      type: String,
      enum: ['Issued', 'Pending', 'Not Applicable'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const TessbinExamRecord = mongoose.model('TessbinExamRecord', tessbinExamRecordSchema);

module.exports = TessbinExamRecord;
