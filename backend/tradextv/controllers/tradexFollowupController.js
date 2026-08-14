const TradexFollowup = require('../models/TradexFollowup');

exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.clientName && !payload.companyName) {
      return res.status(400).json({ message: 'clientName or companyName is required' });
    }
    const created = await TradexFollowup.create({
      clientName: payload.clientName || payload.companyName,
      companyName: payload.companyName || payload.clientName,
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      services: Array.isArray(payload.services) ? payload.services : [],
      status: payload.status || 'In Progress',
      priority: payload.priority || 'High',
      notes: payload.notes || '',
      deadline: payload.deadline ? new Date(payload.deadline) : undefined,
      createdBy: payload.createdBy || '',
      owner: payload.owner || '',
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create Tradex follow-up', error: err.message });
  }
};

exports.list = async (_req, res) => {
  try {
    const list = await TradexFollowup.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch Tradex follow-ups', error: err.message });
  }
};

exports.updateServices = async (req, res) => {
  try {
    const { id } = req.params;
    const services = Array.isArray(req.body.services) ? req.body.services : [];
    const updated = await TradexFollowup.findByIdAndUpdate(
      id,
      { services },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Follow-up not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update services', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await TradexFollowup.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Follow-up not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update follow-up', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TradexFollowup.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Follow-up not found' });
    res.json({ message: 'Deleted', id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete follow-up', error: err.message });
  }
};
