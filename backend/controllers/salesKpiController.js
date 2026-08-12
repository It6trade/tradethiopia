const mongoose = require('mongoose');
const SalesKpiSnapshot = require('../models/SalesKpiSnapshot');
const User = require('../models/user.model');

const SALES_ROLES = ['sales'];
const validPeriod = (type, value) => (
  (type === 'month' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value))
  || (type === 'week' && /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(value))
);
const number = (value) => Math.max(0, Number(value) || 0);

exports.list = async (req, res) => {
  try {
    const query = {};
    if (req.query.periodType) query.periodType = req.query.periodType;
    if (req.query.periodValue) query.periodValue = req.query.periodValue;
    if (req.query.agentId) {
      if (!mongoose.isValidObjectId(req.query.agentId)) return res.status(400).json({ message: 'Invalid agent ID' });
      query.agentId = req.query.agentId;
    }
    const [records, agents] = await Promise.all([
      SalesKpiSnapshot.find(query).populate('agentId', 'fullName username email role status').sort({ periodValue: -1 }).lean(),
      User.find({ role: { $in: SALES_ROLES } }).select('fullName username email role status').sort({ fullName: 1, username: 1 }).lean(),
    ]);
    res.json({ records, agents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sales KPIs', error: error.message });
  }
};

exports.saveBulk = async (req, res) => {
  try {
    const { periodType, periodValue, rows } = req.body;
    if (!validPeriod(periodType, periodValue)) return res.status(400).json({ message: 'Invalid KPI period' });
    if (!Array.isArray(rows)) return res.status(400).json({ message: 'KPI rows are required' });

    const agentIds = [...new Set(rows.map((row) => String(row.agentId || '')))];
    if (!agentIds.length || agentIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Every KPI row must have a valid agent' });
    }
    const agents = await User.find({ _id: { $in: agentIds }, role: { $in: SALES_ROLES } }).select('_id').lean();
    if (agents.length !== agentIds.length) return res.status(400).json({ message: 'One or more sales agents were not found' });

    await SalesKpiSnapshot.bulkWrite(rows.map((row) => ({
      updateOne: {
        filter: { agentId: row.agentId, periodType, periodValue },
        update: {
          $set: {
            target: number(row.target),
            achieved: number(row.achieved),
            coreOutput: number(row.coreOutput),
            absents: number(row.absents),
            submittedBy: req.user._id,
          },
        },
        upsert: true,
      },
    })));
    const records = await SalesKpiSnapshot.find({ periodType, periodValue })
      .populate('agentId', 'fullName username email role status').lean();
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save sales KPIs', error: error.message });
  }
};
