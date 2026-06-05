const SocialAccountCredential = require('../models/SocialAccountCredential');

exports.listSocialAccountCredentials = async (_req, res) => {
  try {
    const docs = await SocialAccountCredential.find({}).sort({ platform: 1, active: -1, accountName: 1 }).lean();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch social account credentials', error: error.message });
  }
};

exports.createSocialAccountCredential = async (req, res) => {
  try {
    const payload = {
      platform: (req.body.platform || '').trim(),
      employeeFullName: (req.body.employeeFullName || '').trim(),
      accountName: (req.body.accountName || '').trim(),
      email: (req.body.email || '').trim(),
      phoneNumber: (req.body.phoneNumber || '').trim(),
      password: (req.body.password || '').trim(),
      notes: (req.body.notes || '').trim(),
      active: req.body.active !== false,
    };

    if (!payload.platform || !payload.accountName) {
      return res.status(400).json({ message: 'Platform and account name are required' });
    }

    const doc = await SocialAccountCredential.create(payload);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create social account credential', error: error.message });
  }
};

exports.updateSocialAccountCredential = async (req, res) => {
  try {
    const payload = {
      platform: (req.body.platform || '').trim(),
      employeeFullName: (req.body.employeeFullName || '').trim(),
      accountName: (req.body.accountName || '').trim(),
      email: (req.body.email || '').trim(),
      phoneNumber: (req.body.phoneNumber || '').trim(),
      password: (req.body.password || '').trim(),
      notes: (req.body.notes || '').trim(),
      active: req.body.active !== false,
    };

    if (!payload.platform || !payload.accountName) {
      return res.status(400).json({ message: 'Platform and account name are required' });
    }

    const doc = await SocialAccountCredential.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ message: 'Social account credential not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update social account credential', error: error.message });
  }
};

exports.deleteSocialAccountCredential = async (req, res) => {
  try {
    const doc = await SocialAccountCredential.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Social account credential not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete social account credential', error: error.message });
  }
};
