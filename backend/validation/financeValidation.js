const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required field${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`
    });
  }

  next();
};

const validatePositiveAmount = (field = 'amount') => (req, res, next) => {
  const value = Number(req.body?.[field]);
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ success: false, message: `${field} must be greater than zero` });
  }
  next();
};

const validateJournalLines = (req, res, next) => {
  const lines = req.body?.lines || [];
  if (!Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({ success: false, message: 'A journal entry needs at least two lines' });
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (!line.account) {
      return res.status(400).json({ success: false, message: `lines[${index}].account is required` });
    }
    if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0) {
      return res.status(400).json({ success: false, message: `lines[${index}] must use non-negative finite debit and credit amounts` });
    }
    if (debit > 0 && credit > 0) {
      return res.status(400).json({ success: false, message: `lines[${index}] cannot contain both debit and credit` });
    }
    if (debit === 0 && credit === 0) {
      return res.status(400).json({ success: false, message: `lines[${index}] must contain a debit or credit amount` });
    }
  }

  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  if (Math.abs(debit - credit) > 0.01) {
    return res.status(400).json({ success: false, message: 'Journal entry debit and credit totals must match' });
  }

  next();
};

module.exports = {
  requireFields,
  validatePositiveAmount,
  validateJournalLines
};
