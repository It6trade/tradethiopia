const SocialAccountCredential = require('../models/SocialAccountCredential');

const normalizeSocialPlatforms = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((platform) => String(platform || '').trim()).filter(Boolean))];
};

const syncEmailSocialAccounts = async (payload) => {
  if (payload.platform !== 'Email' || !payload.socialPlatforms.length) return [];

  const socialPayload = {
    employeeFullName: payload.employeeFullName,
    accountName: payload.accountName,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    password: payload.password,
    notes: payload.notes,
    active: payload.active,
    socialPlatforms: [],
  };

  return Promise.all(
    payload.socialPlatforms
      .filter((platform) => platform && platform !== 'Email')
      .map((platform) =>
        SocialAccountCredential.findOneAndUpdate(
          { platform, accountName: payload.accountName },
          { $set: { ...socialPayload, platform } },
          {
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            upsert: true,
          }
        )
      )
  );
};

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
      socialPlatforms: normalizeSocialPlatforms(req.body.socialPlatforms),
      notes: (req.body.notes || '').trim(),
      active: req.body.active !== false,
    };

    if (!payload.platform || !payload.accountName) {
      return res.status(400).json({ message: 'Platform and account name are required' });
    }

    const doc = await SocialAccountCredential.create(payload);
    const syncedAccounts = await syncEmailSocialAccounts(payload);
    res.status(201).json({ ...doc.toObject(), syncedAccounts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create social account credential', error: error.message });
  }
};

exports.syncEmailSocialAccount = async (req, res) => {
  try {
    const payload = {
      platform: 'Email',
      employeeFullName: (req.body.employeeFullName || '').trim(),
      accountName: (req.body.accountName || '').trim(),
      email: (req.body.email || '').trim(),
      phoneNumber: (req.body.phoneNumber || '').trim(),
      password: (req.body.password || '').trim(),
      socialPlatforms: normalizeSocialPlatforms(req.body.socialPlatforms),
      notes: (req.body.notes || '').trim(),
      active: req.body.active !== false,
    };

    if (!payload.accountName || !payload.socialPlatforms.length) {
      return res.status(400).json({ message: 'Username and at least one social media platform are required' });
    }

    const syncedAccounts = await syncEmailSocialAccounts(payload);
    res.json({ syncedAccounts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync social media account', error: error.message });
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
      socialPlatforms: normalizeSocialPlatforms(req.body.socialPlatforms),
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
    const syncedAccounts = await syncEmailSocialAccounts(payload);
    res.json({ ...doc.toObject(), syncedAccounts });
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
