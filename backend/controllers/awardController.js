const awardEngine = require('../services/awardEngine');
const Award = require('../models/Award');
const MonthlyPerformance = require('../models/MonthlyPerformance');

const USER_POPULATE_FIELDS = '_id fullName username email role jobTitle photo digitalId department status';

// POST /api/awards/calculate
exports.calculate = async (req, res) => {
  try {
    const { month, recalculate } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'month (YYYY-MM) is required' });
    }

    const saved = await awardEngine.calculateForMonth(month, { recalculate: Boolean(recalculate) });
    const populated = await Award.find({ month }).populate('employeeId', USER_POPULATE_FIELDS);

    res.json({
      success: true,
      data: populated,
      message: `Awards calculated and published for ${month}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Calculation failed' });
  }
};

// GET /api/awards/performances/:month
// Retrieves or syncs authentic monthly performance records for all active employees
exports.getPerformancesByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month) {
      return res.status(400).json({ success: false, message: 'month (YYYY-MM) is required' });
    }

    // Sync live metrics for active users if not yet created
    await awardEngine.syncMonthlyPerformances(month);

    const list = await MonthlyPerformance.find({ month })
      .populate('employeeId', USER_POPULATE_FIELDS)
      .sort({ score: -1, department: 1 });

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch performances' });
  }
};

// PUT /api/awards/performance/:id
// Allows HR/Employers to manually adjust targets, actual achievements, and performance notes
exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { target, actual, salesTarget, actualSales, taskTarget, completedTasks, contentTarget, actualAchievements, notes } = req.body;

    const perf = await MonthlyPerformance.findById(id);
    if (!perf) {
      return res.status(404).json({ success: false, message: 'MonthlyPerformance record not found' });
    }

    if (target !== undefined) perf.target = Math.max(0, Number(target));
    if (actual !== undefined) perf.actual = Math.max(0, Number(actual));
    if (salesTarget !== undefined) perf.salesTarget = Math.max(0, Number(salesTarget));
    if (actualSales !== undefined) perf.actualSales = Math.max(0, Number(actualSales));
    if (taskTarget !== undefined) perf.taskTarget = Math.max(0, Number(taskTarget));
    if (completedTasks !== undefined) perf.completedTasks = Math.max(0, Number(completedTasks));
    if (contentTarget !== undefined) perf.contentTarget = Math.max(0, Number(contentTarget));
    if (actualAchievements !== undefined) perf.actualAchievements = Math.max(0, Number(actualAchievements));
    if (notes !== undefined) perf.notes = String(notes).trim();

    perf.isManuallyAdjusted = true;
    perf.score = awardEngine.computeScore(perf);
    perf.calculatedAt = new Date();

    await perf.save();
    const updated = await MonthlyPerformance.findById(id).populate('employeeId', USER_POPULATE_FIELDS);

    res.json({ success: true, data: updated, message: 'Performance record updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update performance' });
  }
};

// GET /api/awards/month/:month
exports.getByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    const awards = await Award.find({ month }).populate('employeeId', USER_POPULATE_FIELDS);
    res.json({ success: true, data: awards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/awards/department/:department
exports.getByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const awards = await Award.find({ department }).populate('employeeId', USER_POPULATE_FIELDS);
    res.json({ success: true, data: awards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/awards/details/:month/:employeeId
exports.getPerformanceDetail = async (req, res) => {
  try {
    const { month, employeeId } = req.params;
    if (!month || !employeeId) {
      return res.status(400).json({ success: false, message: 'month and employeeId required' });
    }
    const perf = await MonthlyPerformance.findOne({ month, employeeId }).populate('employeeId', USER_POPULATE_FIELDS);
    if (!perf) {
      return res.status(404).json({ success: false, message: 'MonthlyPerformance not found' });
    }
    res.json({ success: true, data: perf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
