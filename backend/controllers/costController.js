const Cost = require('../models/Cost');

const buildRegex = (value) => (value && typeof value === 'string' ? new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null);

const calculateDerivedFields = (amount = 0) => {
  const taxRate = 0.15;
  const gstRate = 0.05;
  const tax = Number.isFinite(amount) ? Number((amount * taxRate).toFixed(2)) : 0;
  const gst = Number.isFinite(amount) ? Number((amount * gstRate).toFixed(2)) : 0;
  const netAmount = Number((amount - tax - gst).toFixed(2));
  return { tax, gst, netAmount };
};

exports.listCosts = async (req, res) => {
  try {
    const { category, department, year, month } = req.query;
    const filter = {};

    if (category) filter.category = category.toLowerCase();
    if (department) filter.department = buildRegex(department);
    if (year || month) {
      filter.incurredOn = {};
      if (year) filter.incurredOn.$gte = new Date(Number(year), 0, 1);
      if (year && month) {
        filter.incurredOn.$lt = new Date(Number(year), Number(month), 1);
      }
    }

    const costs = await Cost.find(filter).sort({ incurredOn: -1 }).lean();
    res.json(costs);
  } catch (err) {
    console.error('Error listing costs:', err);
    res.status(500).json({ message: 'Failed to list costs', error: err.message });
  }
};

exports.createCost = async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
      amount,
      currency,
      department,
      description,
      incurredOn,
      receiptUrl
    } = req.body;

    if (!title || !category || !amount) {
      return res.status(400).json({ message: 'Title, category and amount are required' });
    }

    const derived = calculateDerivedFields(amount);

    const cost = new Cost({
      title,
      category: category.toLowerCase(),
      subCategory,
      amount,
      currency: currency || 'ETB',
      department: department || 'General',
      description,
      incurredOn: incurredOn ? new Date(incurredOn) : Date.now(),
      receiptUrl,
      calculatedFields: derived,
      createdBy: req.user?._id
    });

    const saved = await cost.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating cost:', err);
    res.status(500).json({ message: 'Failed to create cost', error: err.message });
  }
};

exports.updateCost = async (req, res) => {
  try {
    const cost = await Cost.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost entry not found' });

    const { title, category, subCategory, amount, currency, department, description, incurredOn, receiptUrl, status } = req.body;
    if (title !== undefined) cost.title = title;
    if (category) cost.category = category.toLowerCase();
    if (subCategory !== undefined) cost.subCategory = subCategory;
    if (amount !== undefined) {
      cost.amount = amount;
      cost.calculatedFields = calculateDerivedFields(amount);
    }
    if (currency !== undefined) cost.currency = currency;
    if (department !== undefined) cost.department = department;
    if (description !== undefined) cost.description = description;
    if (incurredOn) cost.incurredOn = new Date(incurredOn);
    if (receiptUrl !== undefined) cost.receiptUrl = receiptUrl;
    if (status) cost.status = status;

    const updated = await cost.save();
    res.json(updated);
  } catch (err) {
    console.error('Error updating cost:', err);
    res.status(500).json({ message: 'Failed to update cost', error: err.message });
  }
};

exports.deleteCost = async (req, res) => {
  try {
    const cost = await Cost.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost entry not found' });
    await cost.remove();
    res.json({ message: 'Cost deleted' });
  } catch (err) {
    console.error('Error deleting cost:', err);
    res.status(500).json({ message: 'Failed to delete cost', error: err.message });
  }
};

exports.getCostStats = async (req, res) => {
  try {
    const totals = await Cost.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const totalCosts = totals.reduce((acc, item) => acc + item.totalAmount, 0);
    const latest = await Cost.find().sort({ incurredOn: -1 }).limit(5).lean();

    res.json({
      totals: totals.reduce((acc, item) => {
        acc[item._id] = item.totalAmount;
        return acc;
      }, {}),
      totalCosts,
      breakdown: totals,
      latest
    });
  } catch (err) {
    console.error('Error fetching cost stats:', err);
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};
