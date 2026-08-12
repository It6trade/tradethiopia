const mongoose = require('mongoose');

const MonthlyPerformanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  department: { type: String, default: 'Operations' },
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  taskTarget: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  contentTarget: { type: Number, default: 0 },
  actualAchievements: { type: Number, default: 0 },
  salesTarget: { type: Number, default: 0 },
  actualSales: { type: Number, default: 0 },
  targetServiceTime: { type: Number, default: 0 },
  actualServiceTime: { type: Number, default: 0 },
}, { timestamps: true });

MonthlyPerformanceSchema.index({ employeeId: 1, month: 1 }, { unique: true });
module.exports = mongoose.model('MonthlyPerformance', MonthlyPerformanceSchema);
