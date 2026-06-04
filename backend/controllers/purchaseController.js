const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');

// Helper utilities to protect the stock sync logic
const escapeRegex = (value) => {
  const text = (value || '').toString();
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const slugify = (value) => {
  const text = (value || '').toString().trim().toLowerCase();
  if (!text) return 'item';
  return text.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const buildSku = (name) => {
  const base = slugify(name) || 'item';
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `${base}-${uniqueSuffix}`.toUpperCase();
};

const syncPurchaseItemToStock = async (item, supplierName) => {
  if (!item || !item.item) return;

  const normalizedName = item.item.toString().trim();
  if (!normalizedName) return;

  const quantity = Math.max(0, Number(item.quantity) || 0);
  const sellingPrice = Number.isFinite(Number(item.sellingPrice)) ? Number(item.sellingPrice) : Number(item.unitCost);
  const price = Math.max(0, Number.isFinite(sellingPrice) ? sellingPrice : 0);

  const category = (item.category || 'Purchases').toString().trim();
  const unit = (item.unit || 'pieces').toString().trim();
  const supplier = supplierName || 'Purchase';
  const description = item.description || '';

  const existingStock = await Stock.findOne({
    name: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i')
  });

  if (existingStock) {
    existingStock.quantity = Math.max(0, existingStock.quantity + quantity);
    if (price >= 0) {
      existingStock.price = price;
    }
    existingStock.unit = unit || existingStock.unit;
    if (!existingStock.category && category) {
      existingStock.category = category;
    }
    existingStock.supplier = supplier;
    if (description) {
      existingStock.description = description;
    }
    await existingStock.save();
  } else if (quantity > 0) {
    await Stock.create({
      name: normalizedName,
      description,
      category,
      price,
      cost: Number(item.unitCost) || 0,
      quantity,
      unit,
      sku: buildSku(normalizedName),
      supplier,
      bufferStock: 0,
      reservedBuffer: 0
    });
  }
};

const syncPurchaseItemsToStock = async (items = [], supplier) => {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    try {
      await syncPurchaseItemToStock(item, supplier);
    } catch (syncError) {
      console.error('Failed to sync purchase item to inventory:', syncError);
    }
  }
};

const sanitizePurchaseItem = (item = {}, index = 0) => {
  const label = item.item || `Item-${index + 1}`;
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const declarationValue = Math.max(0, Number(item.declarationValue) || 0);
  const totalDeclarationValue = Math.max(0, Number(item.totalDeclarationValue) || declarationValue);
  const customValue = Math.max(0, Number(item.customValue) || 0);
  const otherCost = Math.max(0, Number(item.otherCost) || 0);
  const profitMargin = Math.max(0, Number(item.profitMargin) || 0);
  const sellingPrice = Math.max(0, Number(item.sellingPrice) || 0);
  const unitCost = Math.max(0, Number(item.unitCost) || 0);
  const weightedAverage = Number(item.weightedAverage) || 0;
  const totalCost = Math.max(0, Number(item.totalCost) || (declarationValue + customValue + otherCost));

  return {
    item: label.trim(),
    description: item.description || '',
    category: item.category || 'Purchases',
    quantity,
    unit: item.unit ? item.unit.toString().trim() : 'pieces',
    declarationValue,
    totalDeclarationValue,
    weightedAverage,
    customValue,
    otherCost,
    totalCost,
    unitCost,
    profitMargin,
    sellingPrice,
    stockItem: item.stockItem
  };
};

const calculateTotals = (items = []) => {
  const base = {
    totalItems: items.length,
    totalQuantity: 0,
    totalDeclarationValue: 0,
    totalCustomValue: 0,
    totalOtherCost: 0,
    totalProfitMargin: 0,
    totalSellingPrice: 0,
    totalCost: 0
  };

  return items.reduce((acc, item) => {
    acc.totalQuantity += item.quantity;
    acc.totalDeclarationValue += item.declarationValue;
    acc.totalCustomValue += item.customValue;
    acc.totalOtherCost += item.otherCost;
    acc.totalProfitMargin += item.profitMargin;
    acc.totalSellingPrice += item.sellingPrice;
    acc.totalCost += item.totalCost;
    return acc;
  }, base);
};

exports.listPurchases = async (req, res) => {
  try {
    const { supplier, status, reference, dateFrom, dateTo, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (supplier) {
      filter.supplier = new RegExp(escapeRegex(supplier), 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (reference) {
      filter.referenceNumber = new RegExp(escapeRegex(reference), 'i');
    }

    // Add date filtering
    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom && dateFrom.trim() !== '') {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          filter.purchaseDate.$gte = fromDate;
        }
      }
      if (dateTo && dateTo.trim() !== '') {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          filter.purchaseDate.$lte = toDate;
        }
      }
    }

    const safeLimit = Math.min(Number(limit) || 25, 100);
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const totalCount = await Purchase.countDocuments(filter);
    const purchases = await Purchase.find(filter)
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('createdBy', 'username fullName');

    const payload = req.query.meta === 'true'
      ? {
        data: purchases,
        meta: {
          total: totalCount,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(totalCount / safeLimit) || 1
        }
      }
      : purchases;

    res.json(payload);
  } catch (err) {
    console.error('Error listing purchases:', err);
    res.status(500).json({ message: 'Failed to list purchases', error: err.message });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('createdBy', 'username fullName');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json(purchase);
  } catch (err) {
    console.error('Error fetching purchase:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.status(500).json({ message: 'Failed to fetch purchase', error: err.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const {
      supplier,
      referenceNumber,
      supplierContact,
      purchaseDate,
      status,
      paymentStatus,
      notes,
      currency,
      items
    } = req.body;

    if (!supplier || !referenceNumber) {
      return res.status(400).json({ message: 'Supplier and reference number are required' });
    }

    const referenceExists = await Purchase.findOne({ referenceNumber });
    if (referenceExists) {
      return res.status(400).json({ message: 'Reference number already exists' });
    }

    const sanitizedItems = (Array.isArray(items) ? items : [])
      .map((item, index) => sanitizePurchaseItem(item, index))
      .filter((item) => item.item && item.quantity >= 0);

    if (sanitizedItems.length === 0) {
      return res.status(400).json({ message: 'At least one purchase item is required' });
    }

    const totals = calculateTotals(sanitizedItems);

    const newPurchase = new Purchase({
      supplier,
      referenceNumber,
      supplierContact: supplierContact || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : Date.now(),
      currency: currency || 'ETB',
      status: status || 'submitted',
      paymentStatus: paymentStatus || 'unpaid',
      notes: notes || '',
      totals,
      items: sanitizedItems,
      createdBy: req.user ? req.user._id : undefined
    });

    const createdPurchase = await newPurchase.save();

    await syncPurchaseItemsToStock(sanitizedItems, supplier);

    await createdPurchase.populate('createdBy', 'username fullName');

    res.status(201).json(createdPurchase);
  } catch (err) {
    console.error('Error creating purchase:', err);
    res.status(500).json({ message: 'Failed to create purchase', error: err.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const {
      supplier,
      referenceNumber,
      supplierContact,
      purchaseDate,
      status,
      paymentStatus,
      notes,
      currency,
      items
    } = req.body;

    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (referenceNumber) {
      const duplicate = await Purchase.findOne({
        referenceNumber,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'Reference number is already in use' });
      }
    }

    const sanitizedItems = (Array.isArray(items) ? items : [])
      .map((item, index) => sanitizePurchaseItem(item, index))
      .filter((item) => item.item && item.quantity >= 0);

    if (sanitizedItems.length === 0) {
      return res.status(400).json({ message: 'At least one purchase item is required' });
    }

    const totals = calculateTotals(sanitizedItems);

    purchase.supplier = supplier || purchase.supplier;
    purchase.referenceNumber = referenceNumber || purchase.referenceNumber;
    purchase.supplierContact = supplierContact || purchase.supplierContact;
    purchase.purchaseDate = purchaseDate ? new Date(purchaseDate) : purchase.purchaseDate;
    purchase.currency = currency || purchase.currency;
    purchase.status = status || purchase.status;
    purchase.paymentStatus = paymentStatus || purchase.paymentStatus;
    purchase.notes = notes || purchase.notes;
    purchase.totals = totals;
    purchase.items = sanitizedItems;

    const updatedPurchase = await purchase.save();

    await syncPurchaseItemsToStock(sanitizedItems, purchase.supplier);

    await updatedPurchase.populate('createdBy', 'username fullName');

    res.json(updatedPurchase);
  } catch (err) {
    console.error('Error updating purchase:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.status(500).json({ message: 'Failed to update purchase', error: err.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    await purchase.remove();
    res.json({ message: 'Purchase deleted' });
  } catch (err) {
    console.error('Error deleting purchase:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.status(500).json({ message: 'Failed to delete purchase', error: err.message });
  }
};

exports.getPurchaseStats = async (req, res) => {
  try {
    const stats = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalItems: { $sum: '$totals.totalItems' },
          totalQuantity: { $sum: '$totals.totalQuantity' },
          totalCost: { $sum: '$totals.totalCost' },
          totalSellingValue: { $sum: '$totals.totalSellingPrice' }
        }
      }
    ]);

    const statusBreakdown = await Purchase.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      summary: stats[0] || {
        totalPurchases: 0,
        totalItems: 0,
        totalQuantity: 0,
        totalCost: 0,
        totalSellingValue: 0
      },
      statusBreakdown: statusBreakdown.reduce((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error('Error fetching purchase stats:', err);
    res.status(500).json({ message: 'Failed to fetch purchase statistics', error: err.message });
  }
};

// Export purchases to CSV
exports.exportPurchasesToCSV = async (req, res) => {
  try {
    const { supplier, status, reference, dateFrom, dateTo } = req.query;
    const filter = {};

    if (supplier) {
      filter.supplier = new RegExp(escapeRegex(supplier), 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (reference) {
      filter.referenceNumber = new RegExp(escapeRegex(reference), 'i');
    }

    // Add date filtering
    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom && dateFrom.trim() !== '') {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          filter.purchaseDate.$gte = fromDate;
        }
      }
      if (dateTo && dateTo.trim() !== '') {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          filter.purchaseDate.$lte = toDate;
        }
      }
    }

    const purchases = await Purchase.find(filter)
      .sort({ purchaseDate: -1 })
      .populate('createdBy', 'username fullName');

    // Create CSV content
    let csvContent = 'Reference Number,Supplier,Date,Status,Items,Selling Price\n';
    
    purchases.forEach(purchase => {
      const date = purchase.purchaseDate ? purchase.purchaseDate.toISOString().split('T')[0] : '';
      const items = purchase.totals?.totalItems || purchase.items?.length || 0;
      const sellingPrice = purchase.totals?.totalSellingPrice || 0;
      csvContent += `${purchase.referenceNumber},${purchase.supplier},${date},${purchase.status},${items},${sellingPrice}\n`;
    });

    // Set headers for CSV download
    res.header('Content-Type', 'text/csv');
    res.attachment(`purchases_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting purchases:', err);
    res.status(500).json({ message: 'Failed to export purchases', error: err.message });
  }
};
