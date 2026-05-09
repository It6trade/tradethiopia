const FiscalPeriod = require('../models/FiscalPeriod');

class FiscalPeriodError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FiscalPeriodError';
    this.statusCode = 423;
  }
}

const findPeriodForDate = (date, session) => {
  const postingDate = date ? new Date(date) : new Date();
  return FiscalPeriod.findOne({
    startDate: { $lte: postingDate },
    endDate: { $gte: postingDate }
  }).session(session || null);
};

const assertPeriodOpen = async (date, session) => {
  const period = await findPeriodForDate(date, session);
  if (period && ['locked', 'closed'].includes(period.status)) {
    throw new FiscalPeriodError(`Fiscal period ${period.name} is ${period.status}; posting, editing, and reversing are blocked`);
  }
  return period;
};

const closePeriod = async ({ periodId, userId, session }) => {
  const period = await FiscalPeriod.findById(periodId).session(session || null);
  if (!period) throw new FiscalPeriodError('Fiscal period not found');
  period.status = 'locked';
  period.lockedBy = userId;
  period.lockedAt = new Date();
  await period.save({ session });
  return period;
};

const reopenPeriod = async ({ periodId, userId, session }) => {
  const period = await FiscalPeriod.findById(periodId).session(session || null);
  if (!period) throw new FiscalPeriodError('Fiscal period not found');
  period.status = 'open';
  period.reopenedBy = userId;
  period.reopenedAt = new Date();
  await period.save({ session });
  return period;
};

module.exports = {
  assertPeriodOpen,
  closePeriod,
  reopenPeriod,
  FiscalPeriodError
};
