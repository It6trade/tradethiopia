const SalesCustomer = require('../models/SalesCustomer');
const User = require('../../models/user.model');
const asyncHandler = require('express-async-handler');
const { calculateCommission, resolveSaleCommission } = require('../../utils/commission');
const mongoose = require('mongoose');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeRoleValue = (value) => (value || '').toString().trim().toLowerCase();
const isAllowedManagerRole = (role) => (
  [
    'salesmanager',
    'hr',
    'finance',
    'admin',
    'coo',
    'ceo',
    'customerservice',
    'customer service',
    'customersuccessmanager',
    'customer success manager',
    'customer_success_manager'
  ].includes(normalizeRoleValue(role))
);

const resolveAgentId = async (agentValue) => {
  if (!agentValue) return null;
  const value = String(agentValue).trim();
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  const regex = new RegExp(`^${escapeRegex(value)}$`, 'i');
  const user = await User.findOne({
    role: { $regex: /^sales$/i },
    $or: [
      { username: regex },
      { fullName: regex },
      { name: regex },
      { email: regex }
    ]
  }).select('_id');

  return user?._id?.toString() || null;
};

// @desc    Get all sales for sales manager (all agents)
// @route   GET /api/sales-manager/all-sales
// @access  Private (Sales Manager only)
const getAllSales = asyncHandler(async (req, res) => {
  try {
    console.log('=== GET ALL SALES REQUEST ===');
    console.log('User:', req.user);
    console.log('Query parameters:', req.query);
    
    // Sales leadership and admin roles can access this report.
    if (!isAllowedManagerRole(req.user?.role)) {
      console.log('Access denied - User role:', req.user.role);
      res.status(403);
      throw new Error('Access denied. Sales Manager, COO, CEO, Admin, HR, or Finance only.');
    }

    // Pagination (defaults)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    // Build filter object. By default show ALL sales unless a specific status is requested.
    let filter = {};

    // If frontend requested a specific status, apply it (e.g., ?status=Completed)
    if (req.query.status) {
      // Accept comma-separated statuses as well
      const statuses = String(req.query.status).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        filter.followupStatus = statuses[0];
      } else if (statuses.length > 1) {
        filter.followupStatus = { $in: statuses };
      }
    }

    // Date filtering
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) {
        filter.date.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filter.date.$lte = new Date(req.query.dateTo);
      }
    }

    // Agent filtering
    if (req.query.agentId) {
      filter.agentId = req.query.agentId;
    }
    
    console.log('Applied filter:', filter);

    // Get paginated sales with lean objects for speed
    const [sales, totalCount] = await Promise.all([
      SalesCustomer.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('customerName contactTitle phone callStatus followupStatus packageScope date schedulePreference email note supervisorComment courseName courseId coursePrice productInterest source pipelineStatus agentId assignedAt commission commissionApproved approvedAt createdAt updatedAt')
        .lean(),
      SalesCustomer.countDocuments(filter)
    ]);
    
    console.log(`Found ${sales.length} sales records (page ${page}, limit ${limit}, total ${totalCount})`);

    // If no sales found, return empty array with meta
    if (sales.length === 0) {
      console.log('No sales found with current filter');
      return res.json({
        data: [],
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      });
    }

    // Populate agent information manually since agentId is stored as String
    const agentIds = [...new Set(sales.map(sale => sale.agentId))];
    
    // Filter out any falsy agent IDs
    const validAgentIds = agentIds.filter(id => id);
    if (validAgentIds.length === 0) {
      return res.json({
        data: sales.map((sale) => ({
          ...sale,
          commission: calculateCommission(Number(sale.coursePrice) || 0),
          agentId: null
        })),
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit))
      });
    }
    
    const agents = await User.find({ _id: { $in: validAgentIds } }, 'username fullName email');
    
    const agentMap = agents.reduce((map, agent) => {
      map[agent._id.toString()] = agent;
      return map;
    }, {});

    // Attach agent information to sales
    const salesWithAgents = sales.map(sale => {
      const commissionData = calculateCommission(Number(sale.coursePrice) || 0);

      return {
        ...sale,
        commission: {
          ...(sale.commission || {}),
          grossCommission: commissionData.grossCommission,
          commissionTax: commissionData.commissionTax,
          netCommission: commissionData.netCommission
        },
        agentId: agentMap[sale.agentId] || null
      };
    });

    res.json({
      data: salesWithAgents,
      page,
      limit,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit))
    });
  } catch (error) {
    console.error('Error in getAllSales:', error);
    res.status(500).json({ 
      message: "Error fetching all sales", 
      error: error.message 
    });
  }
});

// @desc    Update supervisor comment for a sale
// @route   PUT /api/sales-manager/sales/:id/supervisor-comment
// @access  Private (Sales Manager, HR, Finance, Admin)
const updateSupervisorComment = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    const { supervisorComment } = req.body;
    const saleId = req.params.id;

    // Update the supervisor comment
    const updatedSale = await SalesCustomer.findByIdAndUpdate(
      saleId,
      { supervisorComment },
      { new: true }
    );

    if (!updatedSale) {
      res.status(404);
      throw new Error('Sale not found');
    }

    res.json(updatedSale);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating supervisor comment", 
      error: error.message 
    });
  }
});

// @desc    Get all sales agents with performance data
// @route   GET /api/sales-manager/agents
// @access  Private (Sales Manager, HR, Finance, Admin)
const getAllAgents = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Get all sales agents with basic info
    const agents = await User.find({ role: 'sales' }, 'username fullName email phone status');

    // Enhance agents with performance data
    const agentsWithPerformance = await Promise.all(agents.map(async (agent) => {
      // Calculate completed deals for this agent
      const completedDeals = await SalesCustomer.countDocuments({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Calculate total commission for this agent
      const salesWithCommission = await SalesCustomer.find({
        agentId: agent._id,
        followupStatus: 'Completed',
        'commission.netCommission': { $exists: true }
      });

      const totalCommission = salesWithCommission.reduce((sum, sale) => {
        return sum + (sale.commission?.netCommission || 0);
      }, 0);

      return {
        _id: agent._id,
        username: agent.username,
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
        completedDeals,
        totalCommission
      };
    }));

    res.json(agentsWithPerformance);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching agents", 
      error: error.message 
    });
  }
});

// @desc    Get team performance stats for sales manager
// @route   GET /api/sales-manager/team-performance
// @access  Private (Sales Manager, HR, Finance, Admin)
const getTeamPerformance = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Build date filter based on time range
    const dateFilter = {};
    const now = new Date();
    
    switch(req.query.timeRange) {
      case 'daily':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        break;
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case 'quarter':
        // Calculate start of quarter
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), quarterStartMonth, 1) };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
        break;
      default:
        // No date filter for 'all' or unspecified
        break;
    }

    // Get all sales agents
    const agents = await User.find({ role: 'sales' });

    // Calculate performance metrics for each agent
    const agentPerformance = await Promise.all(agents.map(async (agent) => {
      // Apply date filter to agent calculations as well
      const agentFilter = {
        agentId: agent._id,
        followupStatus: 'Completed'
      };
      
      // Add date filter if specified
      if (Object.keys(dateFilter).length > 0) {
        agentFilter.createdAt = dateFilter.createdAt;
      }
      
      const completedDeals = await SalesCustomer.countDocuments(agentFilter);

      // Get all completed sales for this agent with date filter
      const sales = await SalesCustomer.find(agentFilter);

      let totalGrossCommission = 0;
      let totalNetCommission = 0;
      let totalSales = 0;
      
      sales.forEach((sale) => {
        const commissionData = resolveSaleCommission(sale);
        totalGrossCommission += commissionData.grossCommission;
        totalNetCommission += commissionData.netCommission;
        totalSales += sale.coursePrice || 0;
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

    // Get all completed sales with date filter
    const allCompletedSales = await SalesCustomer.find({
      followupStatus: 'Completed',
      ...dateFilter
    });

    // Calculate sales trend data (monthly)
    const salesTrend = {};
    const months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      months.push(monthKey);
      salesTrend[monthKey] = { sales: 0, revenue: 0 };
    }
    
    // Count sales and revenue by month
    allCompletedSales.forEach(sale => {
      const saleDate = sale.createdAt || sale.date || new Date();
      const d = new Date(saleDate);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      
      if (salesTrend[monthKey]) {
        salesTrend[monthKey].sales += 1;
        // Use simulated net commission for revenue calculation
        const commissionData = resolveSaleCommission(sale);
        salesTrend[monthKey].revenue += commissionData.netCommission;
      }
    });
    
    // Convert to array format
    const salesTrendArray = months.map(monthKey => {
      const [year, monthIndex] = monthKey.split('-');
      const date = new Date(year, monthIndex, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      return {
        name: monthName,
        sales: salesTrend[monthKey].sales,
        revenue: Math.round(salesTrend[monthKey].revenue)
      };
    });

    // Group sales by training title
    const courseDistribution = {};
    allCompletedSales.forEach(sale => {
      const courseName = sale.courseName || sale.contactTitle || 'Unknown Course';
      if (!courseDistribution[courseName]) {
        courseDistribution[courseName] = 0;
      }
      courseDistribution[courseName]++;
    });

    // Convert to array format for the frontend
    const courseDistributionArray = Object.entries(courseDistribution).map(([name, value]) => ({
      name,
      value
    }));

    // Get all sales with date filter for detailed stats
    const allSalesWithFilter = await SalesCustomer.find({
      ...dateFilter
    });

    // Calculate status distribution
    const statusDistribution = {};
    allSalesWithFilter.forEach(sale => {
      const status = sale.followupStatus || 'Unknown';
      if (!statusDistribution[status]) {
        statusDistribution[status] = 0;
      }
      statusDistribution[status]++;
    });

    // Convert to array format for the frontend
    const statusDistributionArray = Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value
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
        averageGrossCommissionPerAgent: averageGrossCommission
      },
      agentPerformance,
      salesTrend: salesTrendArray,
      courseDistribution: courseDistributionArray,
      statusDistribution: statusDistributionArray
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching team performance", 
      error: error.message 
    });
  }
});

// @desc    Get sales manager dashboard stats
// @route   GET /api/sales-manager/dashboard-stats
// @access  Private (Sales Manager, HR, Finance, Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Get all sales agents count
    const totalAgents = await User.countDocuments({ role: 'sales' });

    // Get all customers from all agents
    const totalCustomers = await SalesCustomer.countDocuments();

    // Get all completed deals from all agents
    const totalCompletedDeals = await SalesCustomer.countDocuments({ followupStatus: 'Completed' });

    // Get all completed sales to calculate revenue
    const completedSales = await SalesCustomer.find({ followupStatus: 'Completed' });

    // Calculate total gross and net commission
    let totalGrossCommission = 0;
    let totalNetCommission = 0;
    
    completedSales.forEach((sale) => {
      const commissionData = resolveSaleCommission(sale);
      totalGrossCommission += commissionData.grossCommission;
      totalNetCommission += commissionData.netCommission;
    });

    // Get recent sales (last 30 days)
    const recentSales = await SalesCustomer.countDocuments({
      followupStatus: 'Completed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalAgents,
      totalCustomers,
      totalCompletedDeals,
      totalTeamGrossCommission: Math.round(totalGrossCommission),
      totalTeamNetCommission: Math.round(totalNetCommission),
      recentSales
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching dashboard stats", 
      error: error.message 
    });
  }
});

// @desc    Get sales data for a specific agent
// @route   GET /api/sales-manager/agent-sales/:agentId
// @access  Private (Sales Manager, HR, Finance, Admin)
const getAgentSales = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    const { agentId } = req.params;
    const { month, year } = req.query;

    // Build filter object
    let filter = {
      agentId: agentId,
      followupStatus: 'Completed'
    };

    // Date filtering
    if (month && year) {
      const startDate = new Date(year, month.split('-')[1] - 1, 1);
      const endDate = new Date(year, month.split('-')[1], 0);
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get sales for this agent with filters
    const sales = await SalesCustomer.find(filter)
      .sort({ date: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching agent sales", 
      error: error.message 
    });
  }
});

// @desc    Import sales into SalesCustomer
// @route   POST /api/sales-manager/import-sales
// @access  Private (Sales Manager, HR, Finance, Admin)
const importSales = asyncHandler(async (req, res) => {
  if (!isAllowedManagerRole(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
  }

  const { sales = [] } = req.body || {};
  if (!Array.isArray(sales) || sales.length === 0) {
    res.status(400);
    throw new Error('Sales array is required.');
  }

  const prepared = [];
  const skipped = [];

  for (let i = 0; i < sales.length; i += 1) {
    const row = sales[i] || {};
    const customerName = row.customerName || row.Customer || row['Customer Name'];
    if (!customerName) {
      skipped.push({ index: i, reason: 'Missing customerName' });
      continue;
    }

    const agentValue = row.agentId || row.agent || row.Agent || row.agentName;
    const resolvedAgentId = await resolveAgentId(agentValue);
    const normalizedPrice = Number(row.coursePrice || row['Course Price'] || 0) || 0;
    const followupStatus = row.followupStatus || row.Status || 'Imported';
    const contactTitle = row.contactTitle || row['Training/Contact Title'] || row.Training || row.note || '';
    const dateValue = row.date || row.Date;
    const parsedDate = dateValue ? new Date(dateValue) : new Date();
    const finalDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    prepared.push({
      agentId: resolvedAgentId || null,
      createdBy: req.user._id,
      source: row.source || 'Sales',
      productInterest: row.productInterest || contactTitle || row.courseName || '',
      pipelineStatus: resolvedAgentId ? 'Assigned' : 'Pending Assignment',
      assignedBy: resolvedAgentId ? req.user._id : undefined,
      assignedAt: resolvedAgentId ? new Date() : undefined,
      customerName,
      contactTitle,
      phone: row.phone || row.Phone || '',
      callStatus: row.callStatus || 'Not Called',
      followupStatus,
      packageScope: row.packageScope || '',
      schedulePreference: row.schedulePreference || 'Regular',
      email: row.email || '',
      note: row.note || '',
      supervisorComment: row.supervisorComment || row['Supervisor Comment'] || '',
      courseName: row.courseName || contactTitle || '',
      courseId: row.courseId || '',
      date: finalDate,
      coursePrice: normalizedPrice,
      commission: calculateCommission(normalizedPrice)
    });
  }

  if (!prepared.length) {
    res.status(400);
    throw new Error('No valid sales rows to import.');
  }

  const inserted = await SalesCustomer.insertMany(prepared, { ordered: false });

  res.status(201).json({
    importedCount: inserted.length,
    skippedCount: skipped.length,
    skipped
  });
});

module.exports = {
  getAllSales,
  updateSupervisorComment,
  getAllAgents,
  getTeamPerformance,
  getDashboardStats,
  getAgentSales,
  importSales
};
