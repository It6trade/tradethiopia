const InventoryItem = require('../models/InventoryItem');
const SalesCustomer = require('../sales/models/SalesCustomer');
const User = require('../models/user.model');
const Purchase = require('../models/Purchase');
const Cost = require('../models/Cost');
const { calculateRevenueSummary, buildRevenueTimeline } = require('../utils/revenue');
const { calculatePayrollCost, calculateCategoryBreakdown } = require('../utils/expence');
const { calculateCommission } = require('../utils/commission');

const buildExpenseSummary = async () => {
  const buildTimeline = async (period) => {
    const groupId = period === 'week'
      ? {
          year: { $isoWeekYear: '$incurredOn' },
          periodValue: { $isoWeek: '$incurredOn' }
        }
      : {
          year: { $year: '$incurredOn' },
          periodValue: { $month: '$incurredOn' }
        };

    const pipeline = [
      { $match: { incurredOn: { $exists: true } } },
      {
        $group: {
          _id: groupId,
          total: { $sum: '$amount' }
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
      { $limit: 6 }
    ];

    return Cost.aggregate(pipeline);
  };

  const buildSources = async (limit = 5) => {
    return Cost.aggregate([
      {
        $group: {
          _id: {
            category: { $ifNull: ['$category', 'uncategorized'] },
            department: { $ifNull: ['$department', 'General'] }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          department: '$_id.department',
          total: 1
        }
      },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
  };

  const [breakdown, recentExpenses, weeklyTotals, monthlyTotals, payrollCostData, expenseSources] = await Promise.all([
    calculateCategoryBreakdown(),
    Cost.find().sort({ incurredOn: -1 }).limit(5).lean(),
    buildTimeline('week'),
    buildTimeline('month'),
    calculatePayrollCost(),
    buildSources()
  ]);

  const payrollCost = Number((payrollCostData?.total || 0).toFixed(2));
  const payrollTypes = payrollCostData?.types || {};
  const totalCostOnly = Number(Object.values(breakdown).reduce((sum, value) => sum + (value || 0), 0).toFixed(2));
  const totalExpenses = Number((totalCostOnly + payrollCost).toFixed(2));

  const transformTrend = (timeline = []) => timeline.map((bucket) => ({
    label: bucket.label,
    total: Number((bucket.total || 0).toFixed(2)),
    order: bucket.order
  }));

  return {
    totalExpenses,
    totalCostsRecorded: totalExpenses,
    totalCost: totalCostOnly,
    breakdown,
    monthlyTrend: transformTrend(monthlyTotals),
    weeklyTrend: transformTrend(weeklyTotals),
    recent: recentExpenses,
    payrollCost,
    payrollTypes,
    expenseSources
  };
};

exports.getMetrics = async (req, res) => {
  try {
    // Compute stock value: sum(price * quantity)
    const items = await InventoryItem.find({});
    const stockValue = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);
    const totalProducts = items.length;
    const totalStockItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    // For now, revenue and outstanding invoices are placeholders until a payments/invoices model exists
    const totalRevenue = 0;
    const outstandingInvoices = 0;

    res.json({
      totalRevenue,
      outstandingInvoices,
      stockValue,
      totalProducts,
      totalStockItems
    });
  } catch (err) {
    console.error('Error fetching finance metrics:', err);
    res.status(500).json({ message: 'Failed to fetch finance metrics' });
  }
};

exports.getRevenueSummary = async (_req, res) => {
  try {
    const data = await calculateRevenueSummary();
    res.json(data);
  } catch (err) {
    console.error('Error fetching revenue summary:', err);
    res.status(500).json({ message: 'Failed to fetch revenue summary' });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const data = await calculateRevenueSummary();
    res.json(data);
  } catch (err) {
    console.error('Error fetching revenue report:', err);
    res.status(500).json({ message: 'Failed to fetch revenue report', error: err.message });
  }
};

exports.getFinanceSummary = async (req, res) => {
  try {
    const [revenueData, expenseData, weeklyRevenue, monthlyRevenue] = await Promise.all([
      calculateRevenueSummary(),
      buildExpenseSummary(),
      buildRevenueTimeline('week'),
      buildRevenueTimeline('month')
    ]);

    const totalRevenue = revenueData?.totalRevenue || 0;
    const totalExpenses = expenseData.totalExpenses || 0;
    const profit = Number((totalRevenue - totalExpenses).toFixed(2));

    res.json({
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      invoices: 0,
      totalCostsRecorded: expenseData.totalCostsRecorded || totalExpenses,
      payrollCost: expenseData.payrollCost || 0,
      payrollTypes: expenseData.payrollTypes || {},
      followupRevenue: revenueData.followupRevenue || 0,
      orderRevenue: revenueData.orderRevenue || 0,
      packageRevenue: revenueData.packageRevenue || 0,
      expenseBreakdown: expenseData.breakdown,
      monthlyExpenses: expenseData.monthlyTrend,
      weeklyExpenses: expenseData.weeklyTrend,
      weeklyRevenue,
      monthlyRevenue,
      recentExpenses: expenseData.recent
    });
  } catch (err) {
    console.error('Error fetching finance summary:', err);
    res.status(500).json({ message: 'Failed to fetch finance summary', error: err.message });
  }
};

exports.getExpenseReport = async (_req, res) => {
  try {
    const data = await buildExpenseSummary();
    res.json(data);
  } catch (err) {
    console.error('Error fetching expense report:', err);
    res.status(500).json({ message: 'Failed to fetch expense report', error: err.message });
  }
};

// New function to get agent sales performance data for finance dashboard
exports.getAgentSalesPerformance = async (req, res) => {
  try {
    // Get all sales agents
    const agents = await User.find({ role: 'sales' });

    // Calculate performance metrics for each agent
    const agentPerformance = await Promise.all(agents.map(async (agent) => {
      // Get all completed sales for this agent
      const completedDeals = await SalesCustomer.countDocuments({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Get all completed sales for this agent
      const sales = await SalesCustomer.find({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Calculate gross and net commission for this agent
      let totalGrossCommission = 0;
      let totalNetCommission = 0;
      let totalSales = 0;
      
      sales.forEach(sale => {
        const coursePrice = sale.coursePrice || 0;
        
        // Calculate commission using standardized function
        const commissionData = calculateCommission(coursePrice);
        
        totalGrossCommission += commissionData.grossCommission;
        totalNetCommission += commissionData.netCommission;
        totalSales += coursePrice;
      });

      return {
        _id: agent._id,
        fullName: agent.fullName || agent.username,
        username: agent.username,
        email: agent.email,
        completedDeals,
        totalGrossCommission: Math.round(totalGrossCommission),
        totalNetCommission: Math.round(totalNetCommission),
        totalSales: Math.round(totalSales)
      };
    }));

    // Calculate overall team stats
    const totalTeamSales = agentPerformance.reduce((sum, agent) => sum + agent.completedDeals, 0);
    const totalTeamGrossCommission = agentPerformance.reduce((sum, agent) => sum + agent.totalGrossCommission, 0);
    const totalTeamNetCommission = agentPerformance.reduce((sum, agent) => sum + agent.totalNetCommission, 0);
    const averageGrossCommission = agentPerformance.length > 0 ? totalTeamGrossCommission / agentPerformance.length : 0;

    res.json({
      teamStats: {
        totalAgents: agents.length,
        totalTeamSales,
        totalTeamGrossCommission,
        totalTeamNetCommission,
        averageGrossCommissionPerAgent: Math.round(averageGrossCommission)
      },
      agentPerformance
    });
  } catch (err) {
    console.error('Error fetching agent sales performance:', err);
    res.status(500).json({ message: 'Failed to fetch agent sales performance' });
  }
};

// New function to get purchase data for finance dashboard
exports.getPurchaseSummary = async (req, res) => {
  try {
    const totalPurchases = await Purchase.countDocuments();
    
    const stats = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalDeclarationValue: { $sum: '$totals.totalDeclarationValue' },
          totalOtherCost: { $sum: '$totals.totalOtherCost' },
          totalProfitMargin: { $sum: '$totals.totalProfitMargin' },
          totalSellingPrice: { $sum: '$totals.totalSellingPrice' },
          avgItemsPerPurchase: { $avg: '$totals.totalItems' }
        }
      }
    ]);
    
    const purchaseStats = stats.length > 0 ? stats[0] : {
      totalDeclarationValue: 0,
      totalOtherCost: 0,
      totalProfitMargin: 0,
      totalSellingPrice: 0,
      avgItemsPerPurchase: 0
    };

    res.json({
      totalPurchases,
      ...purchaseStats
    });
  } catch (err) {
    console.error('Error fetching purchase summary:', err);
    res.status(500).json({ message: 'Failed to fetch purchase summary' });
  }
};

// New function to get recent purchases for finance dashboard
exports.getRecentPurchases = async (req, res) => {
  try {
    const recentPurchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('referenceNumber supplier totals createdAt');

    res.json(recentPurchases);
  } catch (err) {
    console.error('Error fetching recent purchases:', err);
    res.status(500).json({ message: 'Failed to fetch recent purchases' });
  }
};
