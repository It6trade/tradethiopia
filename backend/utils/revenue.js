const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const SalesCustomer = require('../sales/models/SalesCustomer');
const Package = require('../models/Package');

/**
 * Build a lookup from package identifier (number/name) to price.
 */
const buildPackagePriceLookup = async () => {
  const pkgs = await Package.find().lean();
  const lookup = new Map();

  pkgs.forEach(pkg => {
    if (pkg.packageNumber != null) {
      lookup.set(String(pkg.packageNumber), pkg.price);
    }
    if (pkg.packageName) {
      lookup.set(pkg.packageName.trim().toLowerCase(), pkg.price);
    }
  });

  return lookup;
};

const sumPackageRevenue = (entities = [], lookup) => {
  if (!lookup) return 0;

  return entities.reduce((sum, entity) => {
    if (!entity?.packages?.length) return sum;
    const packageSum = entity.packages.reduce((pkgSum, pkg) => {
      if (pkg?.status === 'Cancelled') return pkgSum;
      const typeKey = pkg?.packageType ? pkg.packageType.toString().trim().toLowerCase() : null;
      const nameKey = pkg?.packageName ? pkg.packageName.toString().trim().toLowerCase() : null;
      const price = lookup.get(typeKey) ?? lookup.get(nameKey) ?? 0;
      return pkgSum + (Number.isFinite(price) ? price : 0);
    }, 0);

    return sum + packageSum;
  }, 0);
};

const calculateFollowupRevenue = async () => {
  const pipeline = [
    { $match: { followupStatus: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$coursePrice' } } }
  ];

  const [result] = await SalesCustomer.aggregate(pipeline);
  return Number(result?.total || 0);
};

const calculateDeliveredOrderRevenue = async () => {
  const pipeline = [
    { $match: { status: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ];

  const [result] = await Order.aggregate(pipeline);
  return Number(result?.total || 0);
};

const calculatePackageRevenue = async () => {
  const lookup = await buildPackagePriceLookup();
  const buyers = await Buyer.find({ 'packages.0': { $exists: true } }).lean();
  const sellers = await Seller.find({ 'packages.0': { $exists: true } }).lean();
  const packageRevenue = sumPackageRevenue(buyers, lookup) + sumPackageRevenue(sellers, lookup);
  return packageRevenue;
};

const calculateRevenueSummary = async () => {
  const [followupRevenue, orderRevenue, packageRevenue] = await Promise.all([
    calculateFollowupRevenue(),
    calculateDeliveredOrderRevenue(),
    calculatePackageRevenue()
  ]);

  return {
    followupRevenue,
    orderRevenue,
    packageRevenue,
    totalRevenue: followupRevenue + orderRevenue
  };
};

const buildTimelineForModel = async ({ model, dateField, valueField, match = {}, period, limit = 6 }) => {
  const groupId = period === 'week'
    ? {
        year: { $isoWeekYear: `$${dateField}` },
        periodValue: { $isoWeek: `$${dateField}` }
      }
    : {
        year: { $year: `$${dateField}` },
        periodValue: { $month: `$${dateField}` }
      };

  const pipeline = [
    { $match: { ...match, [dateField]: { $exists: true } } },
    {
      $group: {
        _id: groupId,
        total: { $sum: `$${valueField}` }
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        periodValue: '$_id.periodValue',
        total: 1
      }
    },
    {
      $addFields: {
        paddedPeriod: {
          $cond: [
            { $gte: ['$periodValue', 10] },
            { $toString: '$periodValue' },
            { $concat: ['0', { $toString: '$periodValue' }] }
          ]
        }
      }
    },
    {
      $addFields: {
        label: {
          $concat: [
            { $toString: '$year' },
            period === 'week' ? '-W' : '-',
            '$paddedPeriod'
          ]
        },
        order: {
          $add: [
            { $multiply: ['$year', 100] },
            '$periodValue'
          ]
        }
      }
    },
    { $sort: { order: -1 } },
    { $limit: limit }
  ];

  return pipeline.length ? await model.aggregate(pipeline) : [];
};

const mergeTimelines = (timelines = []) => {
  const map = new Map();
  timelines.flat().forEach(({ label, total, order }) => {
    const current = map.get(label);
    const sum = Number((current?.total || 0) + (total || 0));
    const maxOrder = Math.max(current?.order || 0, order || 0);
    map.set(label, { label, total: Number(sum.toFixed(2)), order: maxOrder });
  });
  return Array.from(map.values())
    .sort((a, b) => b.order - a.order)
    .map(({ label, total }) => ({ label, total }));
};

const buildRevenueTimeline = async (period = 'week', limit = 6) => {
  const [followupTimeline, orderTimeline] = await Promise.all([
    buildTimelineForModel({
      model: SalesCustomer,
      dateField: 'updatedAt',
      valueField: 'coursePrice',
      match: { followupStatus: 'Completed' },
      period,
      limit
    }),
    buildTimelineForModel({
      model: Order,
      dateField: 'createdAt',
      valueField: 'totalAmount',
      match: { status: 'Delivered' },
      period,
      limit
    })
  ]);

  return mergeTimelines([followupTimeline, orderTimeline]);
};

module.exports = {
  calculateFollowupRevenue,
  calculateDeliveredOrderRevenue,
  calculatePackageRevenue,
  calculateRevenueSummary,
  buildRevenueTimeline
};
