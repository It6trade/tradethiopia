const mongoose = require('mongoose');

const StudentRegistrationSchema = new mongoose.Schema(
  {
    clientLocalId: {
      type: String,
      index: true,
      sparse: true,
    },
    studentId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    learningDepartment: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    program: {
      type: String,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
    },
    examDate: {
      type: Date,
    },
    preferredTimeSlot: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Night', 'Weekend', 'VIP'],
      default: 'Morning',
      index: true,
    },
    readinessStatus: {
      type: String,
      enum: ['Not assessed', 'In preparation', 'Ready', 'Needs support', 'Not ready'],
      default: 'Not assessed',
    },
    paymentOption: {
      type: String,
      enum: ['Full Payment', 'Half Payment'],
      default: 'Full Payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Waiting'],
      default: 'Waiting',
      index: true,
    },
    paymentBank: {
      type: String,
      default: '',
      trim: true,
    },
    fsNumber: {
      type: String,
      default: '',
      trim: true,
    },
    classCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    classCompletionStatus: {
      type: String,
      enum: ['Completed', 'Not Completed', 'Stopped'],
      default: 'Not Completed',
      index: true,
    },
    cocPaymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid'],
      default: 'Unpaid',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Completed', 'Paused'],
      default: 'Active',
    },
    notes: {
      type: String,
      default: '',
    },
    registeredBy: {
      type: String,
      default: 'Unknown CS member',
      trim: true,
    },
    registeredByEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    updatedBy: {
      type: String,
      default: '',
      trim: true,
    },
    updatedByEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentRegistration', StudentRegistrationSchema);
