const mongoose = require('mongoose');
const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const Payroll = require('../models/Payroll');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const PackageSale = require('../models/PackageSale');
const asyncHandler = require('express-async-handler');

const buildPackageSaleRows = (sales = [], agentLookup = {}) => sales.map((sale) => {
  const agentId = sale.agentId ? sale.agentId.toString() : null;
  return {
    id: sale._id.toString(),
    customerId: sale._id,
    customerName: sale.customerName || sale.contactPerson || 'Unknown',
    contactPerson: sale.contactPerson || '',
    email: sale.email || '',
    phone: sale.phoneNumber || '',
    agent: agentLookup[agentId] || sale.agentName || 'Unassigned',
    agentId,
    customerType: sale.customerType || 'PackageSale',
    packageId: sale._id,
    packageName: sale.packageName || 'Unknown Package',
    packageType: sale.packageType || 'Not specified',
    country: sale.country || 'Not specified',
    industry: sale.industry || 'Not specified',
    purchaseDate: sale.purchaseDate || sale.createdAt,
    expiryDate: sale.expiryDate || null,
    status: sale.status || 'Active',
    firstCommissionApproved: sale.firstCommissionApproved || false,
    secondCommissionApproved: sale.secondCommissionApproved || false,
    commissionApproved: sale.commissionApproved || false,
    approvedAt: sale.approvedAt,
    approvedBy: sale.approvedBy,
    source: 'PackageSale'
  };
});

const addCommissionTotalsToPayroll = (payrollRecord, part, firstCommission, secondCommission) => {
  payrollRecord.firstCommissionTotal = Number(payrollRecord.firstCommissionTotal || 0);
  payrollRecord.secondCommissionTotal = Number(payrollRecord.secondCommissionTotal || 0);
  payrollRecord.financeAllowances = Number(payrollRecord.financeAllowances || 0);

  let allowanceFromCommission = 0;
  if (!part || part === 'first') {
    payrollRecord.firstCommissionTotal += Number(firstCommission || 0);
    allowanceFromCommission += Number(firstCommission || 0);
  }
  if (!part || part === 'second') {
    payrollRecord.secondCommissionTotal += Number(secondCommission || 0);
    allowanceFromCommission += Number(secondCommission || 0);
  }

  payrollRecord.financeAllowances += allowanceFromCommission;
};

// @desc    Get all commissions pending approval
// @route   GET /api/commissions/pending
// @access  Private (Finance only)
const getPendingCommissions = asyncHandler(async (req, res) => {
  try {
    // Get package sales commissions from buyers, sellers, and manual package sales
    const [buyers, sellers, packageSales] = await Promise.all([
      Buyer.find()
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId'),
      Seller.find()
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId'),
      PackageSale.find()
        .select('customerName contactPerson email phoneNumber packageName packageType purchaseDate expiryDate status agentId agentName customerType firstCommissionApproved secondCommissionApproved commissionApproved approvedAt approvedBy createdAt')
    ]);

    const agentIds = [
      ...new Set(
        [...buyers, ...sellers, ...packageSales]
          .map(customer => customer.agentId)
          .filter(Boolean)
          .map(id => id.toString())
      )
    ];

    const agents = await User.find({ _id: { $in: agentIds } }).select('fullName username');
    const agentLookup = agents.reduce((acc, agent) => {
      acc[agent._id.toString()] = agent.fullName || agent.username || 'Agent';
      return acc;
    }, {});

    // Process package sales to calculate commissions
    const buildPackageRows = (customers, customerType) => {
      const rows = [];
      
      const createRow = (customer, pkg, fallbackLabel = 'Package') => {
        const packageType = pkg?.packageType || customer.packageType || 'Not specified';
        const packageName = pkg?.packageName
          || (pkg?.packageType ? `${fallbackLabel} ${pkg.packageType}` : null)
          || (customer.packageType ? `${fallbackLabel} ${customer.packageType}` : `${fallbackLabel}`);

        return {
          id: `${customer._id}-${pkg?._id || 'default'}`,
          customerId: customer._id,
          customerName: customer.companyName || customer.contactPerson || 'Unknown',
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phone: customer.phoneNumber || '',
          agent: agentLookup[customer.agentId?.toString?.()] || 'Unassigned',
          agentId: customer.agentId ? customer.agentId.toString() : null,
          customerType,
          packageId: pkg?._id || null,
          packageName,
          packageType,
          country: customer.country || 'Not specified',
          industry: customer.industry || 'Not specified',
          purchaseDate: pkg?.purchaseDate || customer.createdAt,
          expiryDate: pkg?.expiryDate || null,
          status: pkg?.status || 'Active',
        };
      };

      customers.forEach((customer) => {
        const packages = Array.isArray(customer.packages) ? customer.packages : [];
        if (packages.length === 0) {
          if (customer.packageType) {
            rows.push(createRow(customer, null));
          }
          return;
        }

        packages.forEach((pkg) => {
          rows.push(createRow(customer, pkg));
        });
      });

      return rows;
    };

    const packageRows = [
      ...buildPackageRows(buyers, 'Buyer', agentLookup),
      ...buildPackageRows(sellers, 'Seller', agentLookup),
      ...buildPackageSaleRows(packageSales, agentLookup),
    ];

    const sortedRows = packageRows.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
      const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
      return dateB - dateA;
    });

    // Calculate commission splits for each package sale
    const commissionRate = 0.075;
    const pendingCommissions = sortedRows.map(row => {
      const packageValue = row.packageType ? parseInt(row.packageType) * 1000 : 0;
      const grossCommission = packageValue * commissionRate;
      const commissionTax = 0;
      const netCommission = grossCommission - commissionTax;
      const firstCommission = Number((netCommission / 2).toFixed(2));
      const secondCommission = Number((netCommission / 2).toFixed(2));
      
      // Determine status based on existing approval status in the database
      const firstApproved = row.firstCommissionApproved || false;
      const secondApproved = row.secondCommissionApproved || false;
      const allApproved = row.commissionApproved || (firstApproved && secondApproved);
      
      const status = allApproved ? 'approved' 
        : (firstApproved || secondApproved) ? 'partial' 
        : 'pending';
      
      return {
        id: row.id,
        customerId: row.customerId,
        customerName: row.customerName,
        agentId: row.agentId,
        agentName: row.agent,
        agentRole: 'Sales',
        packageName: row.packageName,
        packageType: row.packageType,
        packageValue: packageValue,
        grossCommission: Number(grossCommission.toFixed(2)),
        commissionTax: commissionTax,
        netCommission: Number(netCommission.toFixed(2)),
        firstCommission: firstCommission,
        secondCommission: secondCommission,
        date: row.purchaseDate,
        status: status,
        firstStatus: firstApproved ? 'approved' : 'pending',
        secondStatus: secondApproved ? 'approved' : 'pending',
        firstApproved: firstApproved,
        secondApproved: secondApproved,
        approved: allApproved,
        customerType: row.customerType
      };
    });

    res.json(pendingCommissions);
  } catch (error) {
    console.error('Error fetching pending commissions:', error);
    res.status(500).json({ 
      message: 'Error fetching pending commissions', 
      error: error.message 
    });
  }
});

// @desc    Approve a commission and add to payroll
// @route   POST /api/commissions/approve/:id
// @access  Private (Finance only)
const approveCommission = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    let customerId = id;
    if (id.startsWith('manual-')) {
      customerId = id.substring('manual-'.length);
    } else if (id.includes('-')) {
      customerId = id.split('-')[0];
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid commission identifier' });
    }

    let customer = await Buyer.findById(customerId);
    let customerType = 'Buyer';
    let sourceModel = Buyer;

    if (!customer) {
      customer = await Seller.findById(customerId);
      customerType = 'Seller';
      sourceModel = Seller;
    }

    if (!customer) {
      customer = await PackageSale.findById(customerId);
      customerType = 'PackageSale';
      sourceModel = PackageSale;
    }

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let agentUser = null;
    const hasValidAgentId = customer.agentId && mongoose.Types.ObjectId.isValid(customer.agentId);
    if (hasValidAgentId) {
      agentUser = await User.findById(customer.agentId).select('fullName username');
    }

    // Calculate commission based on package type
    const packageValue = customer.packageType ? parseInt(customer.packageType) * 1000 : 0;
    const commissionRate = 0.075;
    const grossCommission = packageValue * commissionRate;
    const commissionTax = 0;
    const netCommission = grossCommission - commissionTax;
    const firstCommission = Number((netCommission / 2).toFixed(2));
    const secondCommission = Number((netCommission / 2).toFixed(2));
    
    // Handle partial approval based on the request body
    const { part } = req.body || {};
    let commissionToAdd = netCommission;
    
    if (part === 'first') {
      // Only approve first commission
      commissionToAdd = firstCommission;
      // Set first commission as approved but keep overall status as partial
      customer.firstCommissionApproved = true;
    } else if (part === 'second') {
      // Only approve second commission
      commissionToAdd = secondCommission;
      // Set second commission as approved but keep overall status as partial
      customer.secondCommissionApproved = true;
    } else {
      // Approve both commissions
      customer.commissionApproved = true;
    }
    
    customer.approvedAt = new Date();
    customer.approvedBy = req.user._id;

    await customer.save();
    
    // The customer record has already been saved with the updated approval status

    // Add the commissions to the payroll system for the agent (if assigned)
    if (hasValidAgentId) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const currentYear = new Date().getFullYear();

      let payrollRecord = await Payroll.findOne({
        userId: customer.agentId,
        month: currentMonth,
        year: currentYear
      });

      const agentDisplayName = agentUser?.fullName || agentUser?.username || customer.agentName || 'Sales Agent';

      if (!payrollRecord) {
        payrollRecord = new Payroll({
          userId: customer.agentId,
          employeeName: agentDisplayName,
          department: 'Sales',
          month: currentMonth,
          year: currentYear,
          basicSalary: 0,
          grossSalary: 0,
          salesCommission: 0,
          totalCommission: 0,
          incomeTax: 0,
          pension: 0,
          financeDeductions: 0,
          finalSalary: 0,
          firstCommissionTotal: 0,
          secondCommissionTotal: 0
        });
      }

      payrollRecord.salesCommission = (payrollRecord.salesCommission || 0) + commissionToAdd;
      payrollRecord.totalCommission = (payrollRecord.totalCommission || 0) + commissionToAdd;
      addCommissionTotalsToPayroll(payrollRecord, part, firstCommission, secondCommission);
      const financeAllowances = Number(payrollRecord.financeAllowances || 0);
      payrollRecord.netSalary = payrollRecord.grossSalary +
                                payrollRecord.salesCommission +
                                financeAllowances -
                                payrollRecord.incomeTax -
                                payrollRecord.pension -
                                payrollRecord.financeDeductions;

      await payrollRecord.save();
    }

    // Return success response
    res.json({
      success: true,
      message: 'Commission approved and added to payroll',
      commissionId: id,
      agentId: customer.agentId,
      firstCommission: firstCommission,
      secondCommission: secondCommission,
      netCommission: netCommission
    });
  } catch (error) {
    console.error('Error approving commission:', error);
    res.status(500).json({ 
      message: 'Error approving commission', 
      error: error.message 
    });
  }
});

// @desc    Get approved commissions
// @route   GET /api/commissions/approved
// @access  Private (Finance only)
const getApprovedCommissions = asyncHandler(async (req, res) => {
  try {
    // Get approved package sales commissions from buyers and sellers
    const [buyers, sellers, packageSales] = await Promise.all([
      Buyer.find({ commissionApproved: true })
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId commissionApproved approvedAt approvedBy'),
      Seller.find({ commissionApproved: true })
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId commissionApproved approvedAt approvedBy'),
      PackageSale.find({ commissionApproved: true })
        .select('customerName contactPerson email phoneNumber packageName packageType purchaseDate expiryDate status agentId agentName customerType firstCommissionApproved secondCommissionApproved commissionApproved approvedAt approvedBy createdAt')
    ]);

    const agentIds = [
      ...new Set(
        [...buyers, ...sellers, ...packageSales]
          .map(customer => customer.agentId)
          .filter(Boolean)
          .map(id => id.toString())
      )
    ];

    const agents = await User.find({ _id: { $in: agentIds } }).select('fullName username');
    const agentLookup = agents.reduce((acc, agent) => {
      acc[agent._id.toString()] = agent.fullName || agent.username || 'Agent';
      return acc;
    }, {});

    // Process package sales to calculate commissions
    const buildPackageRows = (customers, customerType) => {
      const rows = [];
      
      const createRow = (customer, pkg, fallbackLabel = 'Package') => {
        const packageType = pkg?.packageType || customer.packageType || 'Not specified';
        const packageName = pkg?.packageName
          || (pkg?.packageType ? `${fallbackLabel} ${pkg.packageType}` : null)
          || (customer.packageType ? `${fallbackLabel} ${customer.packageType}` : `${fallbackLabel}`);

        return {
          id: `${customer._id}-${pkg?._id || 'default'}`,
          customerId: customer._id,
          customerName: customer.companyName || customer.contactPerson || 'Unknown',
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phone: customer.phoneNumber || '',
          agent: agentLookup[customer.agentId?.toString?.()] || 'Unassigned',
          agentId: customer.agentId ? customer.agentId.toString() : null,
          customerType,
          packageId: pkg?._id || null,
          packageName,
          packageType,
          country: customer.country || 'Not specified',
          industry: customer.industry || 'Not specified',
          purchaseDate: pkg?.purchaseDate || customer.createdAt,
          expiryDate: pkg?.expiryDate || null,
          status: pkg?.status || 'Active',
          commissionApproved: customer.commissionApproved,
          approvedAt: customer.approvedAt,
          approvedBy: customer.approvedBy,
        };
      };

      customers.forEach((customer) => {
        const packages = Array.isArray(customer.packages) ? customer.packages : [];
        if (packages.length === 0) {
          if (customer.packageType) {
            rows.push(createRow(customer, null));
          }
          return;
        }

        packages.forEach((pkg) => {
          rows.push(createRow(customer, pkg));
        });
      });

      return rows;
    };

    const packageRows = [
      ...buildPackageRows(buyers, 'Buyer', agentLookup),
      ...buildPackageRows(sellers, 'Seller', agentLookup),
      ...buildPackageSaleRows(packageSales, agentLookup),
    ];

    const sortedRows = packageRows.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
      const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
      return dateB - dateA;
    });

    // Calculate commission splits for each approved package sale
    const commissionRate = 0.075;
    const approvedCommissions = sortedRows.map(row => {
      const packageValue = row.packageType ? parseInt(row.packageType) * 1000 : 0;
      const grossCommission = packageValue * commissionRate;
      const commissionTax = 0;
      const netCommission = grossCommission - commissionTax;
      const firstCommission = Number((netCommission / 2).toFixed(2));
      const secondCommission = Number((netCommission / 2).toFixed(2));

      return {
        id: row.id,
        customerId: row.customerId,
        customerName: row.customerName,
        agentId: row.agentId,
        agentName: row.agent,
        agentRole: 'Sales',
        packageName: row.packageName,
        packageType: row.packageType,
        packageValue: packageValue,
        grossCommission: Number(grossCommission.toFixed(2)),
        commissionTax: commissionTax,
        netCommission: Number(netCommission.toFixed(2)),
        firstCommission: firstCommission,
        secondCommission: secondCommission,
        date: row.purchaseDate,
        approvedAt: row.approvedAt,
        approvedBy: row.approvedBy,
        status: 'approved',
        firstStatus: row.firstCommissionApproved ? 'approved' : 'pending',
        secondStatus: row.secondCommissionApproved ? 'approved' : 'pending',
        firstApproved: row.firstCommissionApproved || false,
        secondApproved: row.secondCommissionApproved || false,
        approved: true,
        customerType: row.customerType
      };
    });

    res.json(approvedCommissions);
  } catch (error) {
    console.error('Error fetching approved commissions:', error);
    res.status(500).json({ 
      message: 'Error fetching approved commissions', 
      error: error.message 
    });
  }
});

const getCommissionTotals = asyncHandler(async (req, res) => {
  try {
    const { month, year } = req.query;
    const match = {};
    if (month) match.month = month;
    if (year) match.year = Number(year);

    const aggregation = await Payroll.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          firstCommissionTotal: { $sum: '$firstCommissionTotal' },
          secondCommissionTotal: { $sum: '$secondCommissionTotal' },
          financeAllowancesTotal: { $sum: '$financeAllowances' }
        }
      }
    ]);

    const totals = aggregation[0] || {};
    res.json({
      firstCommissionTotal: Number((totals.firstCommissionTotal || 0).toFixed(2)),
      secondCommissionTotal: Number((totals.secondCommissionTotal || 0).toFixed(2)),
      financeAllowancesTotal: Number((totals.financeAllowancesTotal || 0).toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching commission totals:', error);
    res.status(500).json({
      message: 'Error fetching commission totals',
      error: error.message
    });
  }
});

module.exports = {
  getPendingCommissions,
  approveCommission,
  getApprovedCommissions,
  getCommissionTotals
};
