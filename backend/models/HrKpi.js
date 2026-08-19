const mongoose = require('mongoose');

const hrKpiMetricSchema = new mongoose.Schema({
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  status: { type: String, enum: ['On Track', 'Behind Target', 'Exceeded', 'Completed', 'Pending'], default: 'Pending' },
  notes: { type: String, default: '' },
}, { _id: false });

const hrKpiSchema = new mongoose.Schema({
  periodType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: true,
    index: true,
  },
  periodKey: {
    type: String, // e.g., '2026-W34', '2026-08', '2026-Q3'
    required: true,
    index: true,
  },
  year: {
    type: Number,
    required: true,
  },
  periodLabel: {
    type: String,
    default: '',
  },

  // The 10 explicit HR KPI Metrics requested
  postVacancies: { type: hrKpiMetricSchema, default: () => ({ target: 5, actual: 0 }) },
  screenCvs: { type: hrKpiMetricSchema, default: () => ({ target: 50, actual: 0 }) },
  conductInterviews: { type: hrKpiMetricSchema, default: () => ({ target: 15, actual: 0 }) },
  facilitateInternalTrainings: { type: hrKpiMetricSchema, default: () => ({ target: 2, actual: 0 }) },
  attendancePunctuality: { type: hrKpiMetricSchema, default: () => ({ target: 95, actual: 0 }) }, // percentage
  checkingJobEnisra: { type: hrKpiMetricSchema, default: () => ({ target: 7, actual: 0 }) }, // e.g., days checked / inbox logs
  newHires: { type: hrKpiMetricSchema, default: () => ({ target: 3, actual: 0 }) },
  resignations: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0 }) },
  candidatesPool: { type: hrKpiMetricSchema, default: () => ({ target: 30, actual: 0 }) },
  staffTrainingParticipants: { type: hrKpiMetricSchema, default: () => ({ target: 20, actual: 0 }) },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

hrKpiSchema.index({ periodType: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('HrKpi', hrKpiSchema);
