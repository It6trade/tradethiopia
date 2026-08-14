const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    imageUrls: [{ type: String }],
    materialUrl: { type: String, default: '' },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    options: [{ type: String }],
    correctAnswer: { type: Number, default: 0, min: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const salesOnboardingCourseSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'sales-onboarding', unique: true, index: true },
    title: { type: String, default: 'Sales Onboarding Course' },
    overview: { type: String, default: '' },
    slides: { type: [slideSchema], default: [] },
    quizQuestions: { type: [quizQuestionSchema], default: [] },
    passPercentage: { type: Number, default: 75, min: 0, max: 100 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesOnboardingCourse', salesOnboardingCourseSchema);
