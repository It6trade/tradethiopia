const MonthlyPerformance = require('../models/MonthlyPerformance');
const RevenueActual = require('../models/RevenueActual');
const SocialActual = require('../models/SocialActual');
const SocialWeeklyKpi = require('../models/SocialWeeklyKpi');
const SalesKpiSnapshot = require('../models/SalesKpiSnapshot');
const SalesCustomer = require('../models/SalesCustomer');
const SalesTarget = require('../models/SalesTarget');
const User = require('../models/user.model');

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const periodKey = (month, year) => {
  const value = String(month || '').trim();
  const direct = value.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (direct) return `${direct[1]}-${String(Number(direct[2])).padStart(2, '0')}`;
  const named = value.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  const monthName = named ? named[1] : value;
  const monthYear = named ? Number(named[2]) : Number(year);
  const index = MONTHS.findIndex((name) => monthName.toLowerCase().startsWith(name));
  return index >= 0 && Number(monthYear) ? `${monthYear}-${String(index + 1).padStart(2, '0')}` : null;
};
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const normalizeDepartment = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('sales')) return 'Sales';
  if (normalized.includes('customer')) return 'Customer Success';
  if (normalized === 'it' || normalized.startsWith('it ') || normalized.includes('information technology')) return 'IT';
  if (normalized.includes('tradex') || normalized.includes('trade x') || normalized.includes('socialmedia') || normalized.includes('social media')) return 'Tradex TV';
  if (normalized.includes('financ') || normalized.includes('account')) return 'Finance';
  if (normalized === 'hr' || normalized.includes('human resource')) return 'HR';
  if (normalized.includes('operation')) return 'Operations';
  return 'Operations';
};
const hasValue = (value) => value !== undefined && value !== null && value !== '';
const pickMetricValues = (item, actualField, targetField) => {
  const specificActual = item[actualField];
  const specificTarget = item[targetField];
  const hasSpecificData = numeric(specificActual) !== 0 || numeric(specificTarget) !== 0;
  if (hasSpecificData || (!hasValue(item.actual) && !hasValue(item.target))) {
    return { actual: specificActual, target: specificTarget };
  }
  return { actual: item.actual, target: item.target };
};
const performanceValues = (item, department) => {
  if (department === 'Sales') return pickMetricValues(item, 'actualSales', 'salesTarget');
  if (department === 'IT') return pickMetricValues(item, 'completedTasks', 'taskTarget');
  if (department === 'Tradex TV') return pickMetricValues(item, 'actualAchievements', 'contentTarget');
  if (department === 'Customer Success') {
    return { ...pickMetricValues(item, 'actualServiceTime', 'targetServiceTime'), lowerIsBetter: true };
  }
  return { actual: item.actual, target: item.target };
};
const addMetric = (store, definition, key, actual, target, metadata = {}) => {
  if (!key) return;
  const id = slug(`${definition.department}-${definition.name}`);
  if (!store.definitions.has(id)) store.definitions.set(id, { ...definition, id });
  store.rows.push({ kpiId: id, key, actual: numeric(actual), target: numeric(target), granularity: 'month', ...metadata });
};

const weekMonthKey = (periodValue) => {
  const match = String(periodValue || '').match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() + 6) % 7) + ((week - 1) * 7));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}`;
};

const isoWeekKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

exports.getKpis = async (req, res) => {
  try {
    const [performances, revenue, social, weekly, salesKpis, completedSales, salesTargets, salesAgents] = await Promise.all([
      MonthlyPerformance.find({}).populate('employeeId', 'fullName username').lean(),
      RevenueActual.find({ active: { $ne: false } }).lean(),
      SocialActual.find({ active: { $ne: false } }).lean(),
      SocialWeeklyKpi.find({ active: { $ne: false } }).lean(),
      SalesKpiSnapshot.find({}).populate('agentId', 'fullName username').lean(),
      SalesCustomer.find({ followupStatus: 'Completed', agentId: { $ne: null } }).select('agentId date updatedAt createdAt coursePrice').lean(),
      SalesTarget.find({}).lean(),
      User.find({ role: 'sales' }).select('fullName username').lean(),
    ]);
    const store = { definitions: new Map(), rows: [] };
    revenue.forEach((item) => addMetric(store, {
      department: 'Tradex TV', pillar: 'Finance', name: item.metric,
      unit: 'ETB', format: 'currency', aggregate: 'sum',
    }, periodKey(item.month, item.year), item.actual, item.target));
    social.forEach((item) => addMetric(store, {
      department: 'Tradex TV', pillar: 'Tradex TV', name: `${item.platform} Social Performance`,
      unit: '', format: 'number', aggregate: 'sum',
    }, periodKey(item.month, item.year), item.actual, item.target));

    const weeklyByMonth = new Map();
    weekly.forEach((item) => {
      const key = periodKey(item.month, item.year);
      if (!key) return;
      const mapKey = `${item.platform}|${key}`;
      const current = weeklyByMonth.get(mapKey) || { actual: 0, key, platform: item.platform };
      current.actual += numeric(item.videos) + numeric(item.graphics);
      weeklyByMonth.set(mapKey, current);
    });
    weeklyByMonth.forEach((item) => addMetric(store, {
      department: 'Tradex TV', pillar: 'Tradex TV', name: `${item.platform} Content Output`,
      unit: 'posts/mo', format: 'number', aggregate: 'sum',
    }, item.key, item.actual, 0));
    const agentNames = new Map(salesAgents.map((agent) => [String(agent._id), agent.fullName || agent.username || 'Sales Agent']));
    const targetMap = new Map();
    salesTargets.forEach((target) => {
      const period = target.periodType === 'weekly' ? isoWeekKey(target.periodStart) : periodKey(
        new Date(target.periodStart).toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
        new Date(target.periodStart).getUTCFullYear()
      );
      const granularity = target.periodType === 'weekly' ? 'week' : 'month';
      const value = granularity === 'week' ? target.weeklySalesTarget : target.monthlySalesTarget;
      if (period) targetMap.set(`${target.agentId}|${granularity}|${period}`, numeric(value));
    });

    const liveSalesBuckets = new Map();
    completedSales.forEach((sale) => {
      const date = sale.date || sale.updatedAt || sale.createdAt;
      if (!date || Number.isNaN(new Date(date).getTime())) return;
      const month = `${new Date(date).getUTCFullYear()}-${String(new Date(date).getUTCMonth() + 1).padStart(2, '0')}`;
      const week = isoWeekKey(date);
      [['month', month], ['week', week]].forEach(([granularity, period]) => {
        if (!period) return;
        const bucketKey = `${sale.agentId}|${granularity}|${period}`;
        const bucket = liveSalesBuckets.get(bucketKey) || {
          agentId: String(sale.agentId), granularity, period, achieved: 0, deals: 0,
        };
        bucket.achieved += numeric(sale.coursePrice);
        bucket.deals += 1;
        liveSalesBuckets.set(bucketKey, bucket);
      });
    });

    const snapshotMap = new Map();
    salesKpis.forEach((item) => {
      const agentId = String(item.agentId?._id || item.agentId || '');
      const snapshotKey = `${agentId}|${item.periodType}|${item.periodValue}`;
      snapshotMap.set(snapshotKey, item);
      const agent = item.agentId?.fullName || item.agentId?.username || agentNames.get(agentId) || 'Sales Agent';
      const key = item.periodType === 'week' ? weekMonthKey(item.periodValue) : item.periodValue;
      const metadata = { granularity: item.periodType, period: item.periodValue };
      addMetric(store, {
        department: 'Sales', pillar: 'Sales', name: `${agent} Core Output`,
        unit: '%', format: 'percent', aggregate: 'avg', agentId,
      }, key, item.coreOutput, 100, metadata);
    });

    const achievementKeys = new Set([...snapshotMap.keys(), ...liveSalesBuckets.keys()]);
    achievementKeys.forEach((bucketKey) => {
      const snapshot = snapshotMap.get(bucketKey);
      const live = liveSalesBuckets.get(bucketKey);
      const agentId = live?.agentId || String(snapshot?.agentId?._id || snapshot?.agentId || '');
      const granularity = live?.granularity || snapshot?.periodType;
      const period = live?.period || snapshot?.periodValue;
      const key = granularity === 'week' ? weekMonthKey(period) : period;
      const agent = snapshot?.agentId?.fullName || snapshot?.agentId?.username || agentNames.get(agentId) || 'Sales Agent';
      const savedTarget = numeric(snapshot?.target);
      const configuredTarget = targetMap.get(`${agentId}|${granularity}|${period}`) || 0;
      addMetric(store, {
        department: 'Sales', pillar: 'Sales', name: `${agent} Sales Achievement`,
        unit: 'ETB', format: 'currency', aggregate: 'sum', agentId,
      }, key, live ? live.achieved : snapshot?.achieved, savedTarget || configuredTarget, {
        granularity, period, source: live ? 'completed-sales' : 'saved-kpi', deals: live?.deals || 0,
      });
    });

    liveSalesBuckets.forEach((bucket) => {
      const key = bucket.granularity === 'week' ? weekMonthKey(bucket.period) : bucket.period;
      addMetric(store, {
        department: 'Sales', pillar: 'Sales', name: `${agentNames.get(bucket.agentId) || bucket.agentId} Completed Sales`,
        unit: 'deals', format: 'number', aggregate: 'sum', agentId: bucket.agentId,
      }, key, bucket.deals, targetMap.get(`${bucket.agentId}|${bucket.granularity}|${bucket.period}`) || 0, {
        granularity: bucket.granularity,
        period: bucket.period,
        source: 'completed-sales',
      });
    });
    performances.forEach((item) => {
      const department = normalizeDepartment(item.department);
      const values = performanceValues(item, department);
      const actual = values.actual;
      const target = values.target;
      const employee = item.employeeId?.fullName || item.employeeId?.username || String(item.employeeId || 'Employee');
      addMetric(store, {
        department, pillar: department, name: `${employee} Department Performance`,
        unit: '', format: 'number', aggregate: 'avg',
        lowerIsBetter: Boolean(values.lowerIsBetter),
      }, periodKey(item.month), actual, target);
    });
    const requestedDepartment = String(req.query.department || '').trim().toLowerCase();
    const requestedPillar = String(req.query.pillar || '').trim().toLowerCase();
    const definitions = [...store.definitions.values()].filter((definition) => (
      (!requestedDepartment || definition.department.toLowerCase() === requestedDepartment)
      && (!requestedPillar || definition.pillar.toLowerCase() === requestedPillar)
    ));
    const allowedIds = new Set(definitions.map((definition) => definition.id));
    const rows = store.rows.filter((row) => allowedIds.has(row.kpiId)).sort((a, b) => a.key.localeCompare(b.key));
    const periods = [...new Set(rows.map((row) => row.key).filter(Boolean))].sort();
    res.json({ definitions, rows, periods });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load COO KPI data', error: error.message });
  }
};
