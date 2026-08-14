const mongoose = require('mongoose');

const MonthlyPerformanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true, index: true }, // Format: 'YYYY-MM'
  department: { type: String, default: 'Operations', trim: true },
  target: { type: Number, default: 10 },
  actual: { type: Number, default: 0 },
  taskTarget: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  contentTarget: { type: Number, default: 0 },
  actualAchievements: { type: Number, default: 0 },
  salesTarget: { type: Number, default: 0 },
  actualSales: { type: Number, default: 0 },
  targetServiceTime: { type: Number, default: 0 },
  actualServiceTime: { type: Number, default: 0 },
  attendanceScore: { type: Number, default: 100 },
  lateDays: { type: Number, default: 0 },
  absenceDays: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  isManuallyAdjusted: { type: Boolean, default: false },
  notes: { type: String, default: '', trim: true },
  calculatedAt: { type: Date, default: null },
}, { timestamps: true });

MonthlyPerformanceSchema.index({ employeeId: 1, month: 1 }, { unique: true });
MonthlyPerformanceSchema.index({ month: 1, department: 1 });

module.exports = mongoose.model('MonthlyPerformance', MonthlyPerformanceSchema);
