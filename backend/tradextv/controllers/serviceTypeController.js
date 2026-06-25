const ServiceType = require('../models/ServiceType');

exports.createServiceType = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const existing = await ServiceType.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(409).json({ message: 'Service type already exists' });
    }
    const created = await ServiceType.create({ name });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create service type', error: err.message });
  }
};

exports.listServiceTypes = async (_req, res) => {
  try {
    const items = await ServiceType.find({ active: true }).sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list service types', error: err.message });
  }
};

exports.deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ServiceType.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    if (!deleted) {
      return res.status(404).json({ message: 'Service type not found' });
    }
    res.json({ message: 'Service type removed', id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove service type', error: err.message });
  }
};
