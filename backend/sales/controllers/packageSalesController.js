const Buyer = require('../../models/Buyer');
const Seller = require('../../models/Seller');
const User = require('../../models/user.model.js');
const PackageSale = require('../models/PackageSale');
const PackageSalesActivity = require('../models/PackageSalesActivity');

const PRIVILEGED_ROLES = new Set([
  'admin',
  'customerservice',
  'customer service',
  'customersuccessmanager',
  'customer success manager',
  'customer_success_manager',
  'coo',
  'salesmanager',
  'sales_manager',
  'sales manager',
  'finance',
  'reception'
]);

const buildPackageRows = (customers, customerType, agentLookup = {}) => {
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
      callStatus: pkg?.callStatus || customer.callStatus || 'Not Called',
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

const buildPackageSaleRows = (sales = [], agentLookup = {}) => sales.map((sale) => {
  const resolvedAgentId = sale.agentId ? sale.agentId.toString() : null;
  return {
    id: `manual-${sale._id}`,
    customerId: sale._id,
    customerName: sale.customerName || sale.contactPerson || 'Unknown',
    contactPerson: sale.contactPerson || '',
    email: sale.email || '',
    phone: sale.phoneNumber || '',
    agent: agentLookup[resolvedAgentId] || sale.agentName || 'Unassigned',
    agentId: resolvedAgentId,
    customerType: sale.customerType || 'PackageSales',
    packageId: sale._id,
    packageName: sale.packageName || 'Not specified',
    packageType: sale.packageType || 'Not specified',
    country: sale.country || 'Not specified',
    industry: sale.industry || 'Not specified',
    purchaseDate: sale.purchaseDate || sale.createdAt,
    expiryDate: sale.expiryDate || null,
    status: sale.status || 'Active',
    callStatus: sale.callStatus || 'Not Called',
  };
});

const loadPackageRows = async () => {
  try {
    const [buyers, sellers, packageSales] = await Promise.all([
      Buyer.find()
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId'),
      Seller.find()
        .select('companyName contactPerson email phoneNumber packages packageType createdAt country industry agentId'),
      PackageSale.find()
        .select('customerName contactPerson email phoneNumber packageName packageType purchaseDate expiryDate status callStatus agentId agentName customerType')
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

    const packageRows = [
      ...buildPackageRows(buyers, 'Buyer', agentLookup),
      ...buildPackageRows(sellers, 'Seller', agentLookup),
      ...buildPackageSaleRows(packageSales, agentLookup)
    ];

    const sortedRows = packageRows.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
      const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
      return dateB - dateA;
    });

    return sortedRows;
  } catch (err) {
    console.error('Failed to load package sales:', err);
    throw err;
  }
};

const getPackageSales = async (req, res) => {
  try {
    const rows = await loadPackageRows();
    const user = req.user || {};
    const normalizedUserRole = (user.role || '').toString().trim().toLowerCase();
    const canViewAll = PRIVILEGED_ROLES.has(normalizedUserRole);
    const filteredRows = canViewAll 
      ? rows 
      : rows.filter(row => row.agentId && (row.agentId.toString() === (user._id || user.id)?.toString()));
    res.json(filteredRows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPackageSale = async (req, res) => {
  try {
    console.log('Creating package sale', req.body);
    const {
      customerName,
      contactPerson,
      email,
      phoneNumber,
      packageName,
      packageType,
      purchaseDate,
      expiryDate,
      status,
      callStatus,
      agentId,
      agentName,
      notes
    } = req.body;

    if (!customerName) {
      return res.status(400).json({ message: 'customerName is required' });
    }

    const currentAgent = req.user || {};
    const resolvedAgentId = agentId || currentAgent._id?.toString?.() || currentAgent.id;
    const resolvedAgentName = agentName || currentAgent.fullName || currentAgent.username || currentAgent.name || 'Package Sales';

    const sale = new PackageSale({
      customerName,
      contactPerson,
      email,
      phoneNumber,
      packageName,
      packageType,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      status,
      callStatus: callStatus || 'Not Called',
      agentId: resolvedAgentId,
      agentName: resolvedAgentName,
      notes
    });

    const savedSale = await sale.save();
    console.log('Package sale saved', savedSale._id);
    res.status(201).json(savedSale);
  } catch (err) {
    console.error('Error creating package sale', err);
    res.status(500).json({ message: err.message });
  }
};

const logPackageSalesActivity = async (req, res) => {
  try {
    const {
      activityType,
      customerId,
      packageId,
      customerType,
      customerName,
      phone,
      email,
      packageName,
      packageType,
      subject,
      body,
      status
    } = req.body || {};

    if (!activityType) {
      return res.status(400).json({ message: 'activityType is required' });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Activity message is required' });
    }

    const user = req.user || {};
    const activity = await PackageSalesActivity.create({
      activityType,
      customerId,
      packageId,
      customerType,
      customerName,
      phone,
      email,
      packageName,
      packageType,
      subject,
      body: body.trim(),
      status: status || 'logged',
      createdBy: user._id,
      createdByName: user.fullName || user.username || user.name || ''
    });

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPackageSalesActivities = async (req, res) => {
  try {
    const { customerId, packageId } = req.query || {};
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (packageId) filter.packageId = packageId;

    const activities = await PackageSalesActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const COMMISSION_RATE = 0.075;
const toNumber = (value) => Number(value) || 0;

const calculateCommissions = (packageValue) => {
  const grossCommission = packageValue * COMMISSION_RATE;
  const commissionTax = 0;
  const netCommission = grossCommission - commissionTax;
  const firstCommission = Number((netCommission / 2).toFixed(2));
  const secondCommission = Number((netCommission / 2).toFixed(2));

  return {
    packageValue,
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax,
    netCommission: Number(netCommission.toFixed(2)),
    firstCommission,
    secondCommission,
  };
};

const getPackageSalesCommissions = async (req, res) => {
  try {
    const rows = await loadPackageRows();
    const user = req.user || {};
    const normalizedUserRole = (user.role || '').toString().trim().toLowerCase();
    const canViewAll = PRIVILEGED_ROLES.has(normalizedUserRole);
    const filteredRows = canViewAll 
      ? rows 
      : rows.filter(row => row.agentId && (row.agentId.toString() === (user._id || user.id)?.toString()));

    const commissionEntries = filteredRows.map((row) => {
      const packageValue = row.packageValue ? toNumber(row.packageValue) : toNumber(row.packageType) * 1000;
      const commission = calculateCommissions(packageValue);
      return {
        ...row,
        ...commission,
        firstStatus: row.firstStatus || 'pending',
        secondStatus: row.secondStatus || 'pending',
        firstApproved: false,
        secondApproved: false,
        approved: false,
        status: row.status || 'pending'
      };
    });

    res.json(commissionEntries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const deriveFollowupStatus = (status, expiryDate, now) => {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'cancelled') return 'Cancelled';
  if (expiryDate && now) {
    if (expiryDate < now) return 'Overdue';
  }
  return 'Pending';
};

const resolveNextFollowupDate = (expiryDate, now) => {
  if (expiryDate && expiryDate > now) {
    return expiryDate;
  }
  return new Date(now.getTime() + 7 * MS_PER_DAY);
};

const getPackageSalesFollowups = async (req, res) => {
  try {
    const rows = await loadPackageRows();
    const user = req.user || {};
    const normalizedUserRole = (user.role || '').toString().trim().toLowerCase();
    const canViewAll = PRIVILEGED_ROLES.has(normalizedUserRole);
    const filteredRows = canViewAll 
      ? rows 
      : rows.filter(row => row.agentId && (row.agentId.toString() === (user._id || user.id)?.toString()));

    const now = new Date();
    const followupEntries = filteredRows.map((row) => {
      const expiryDate = row.expiryDate ? new Date(row.expiryDate) : null;
      const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : null;
      const followUpStatus = deriveFollowupStatus(row.status, expiryDate, now);
      const nextFollowUpDate = resolveNextFollowupDate(expiryDate, now);
      const daysUntilNextFollowUp = Math.max(
        0,
        Math.ceil((nextFollowUpDate - now) / MS_PER_DAY)
      );

      return {
        ...row,
        followUpStatus,
        nextFollowUpDate: nextFollowUpDate.toISOString(),
        daysUntilNextFollowUp,
        lastInteractionDate: purchaseDate ? purchaseDate.toISOString() : null,
        urgency: followUpStatus === 'Overdue' ? 'High' : 'Normal',
        callStatus: row.callStatus || 'Not Called',
        followUpSource: 'Package Sales'
      };
    });

    res.json(followupEntries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePackageSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    let resolvedId = id;
    if (id.startsWith('manual-')) {
      resolvedId = id.replace('manual-', '');
    } else if (id.includes('-')) {
      const [custId, pkgId] = id.split('-');
      
      const buyer = await Buyer.findById(custId);
      if (buyer) {
        if (updateData.callStatus) buyer.callStatus = updateData.callStatus;
        if (updateData.status && pkgId && pkgId !== 'default' && Array.isArray(buyer.packages)) {
          const pkg = buyer.packages.id(pkgId);
          if (pkg) pkg.status = updateData.status;
        }
        await buyer.save();
        return res.json({ success: true, message: 'Buyer package updated' });
      }
      
      const seller = await Seller.findById(custId);
      if (seller) {
        if (updateData.callStatus) seller.callStatus = updateData.callStatus;
        if (updateData.status && pkgId && pkgId !== 'default' && Array.isArray(seller.packages)) {
          const pkg = seller.packages.id(pkgId);
          if (pkg) pkg.status = updateData.status;
        }
        await seller.save();
        return res.json({ success: true, message: 'Seller package updated' });
      }
      
      return res.status(404).json({ message: 'Associated Buyer or Seller not found' });
    }

    const updated = await PackageSale.findByIdAndUpdate(
      resolvedId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Package sale not found' });
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePackageSale = async (req, res) => {
  try {
    const { id } = req.params;
    let resolvedId = id;
    if (id.startsWith('manual-')) {
      resolvedId = id.replace('manual-', '');
    }
    const deleted = await PackageSale.findByIdAndDelete(resolvedId);
    if (!deleted) {
      return res.status(404).json({ message: 'Package sale not found' });
    }
    res.json({ message: 'Package sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPackageSales,
  createPackageSale,
  getPackageSalesCommissions,
  getPackageSalesFollowups,
  logPackageSalesActivity,
  getPackageSalesActivities,
  updatePackageSale,
  deletePackageSale
};
