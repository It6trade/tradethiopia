const AuditLog = require('../models/AuditLog');
const FinanceEvent = require('../models/FinanceEvent');
const Notification = require('../models/Notification');

const requestMeta = (req) => ({
  ip: req?.ip || '',
  device: req?.headers?.['user-agent'] || '',
  userAgent: req?.headers?.['user-agent'] || ''
});

const audit = async ({ req, actor, action, entityType, entityId, oldValue, newValue, reason = '', session }) => {
  const meta = requestMeta(req);
  const [entry] = await AuditLog.create([{
    actor: actor || req?.user?._id,
    action,
    entityType,
    entityId,
    before: oldValue,
    after: newValue,
    oldValue,
    newValue,
    reason,
    ...meta
  }], { session });
  return entry;
};

const emit = async ({ eventType, entityType, entityId, payload = {}, req, actor, session, notifyUsers = [] }) => {
  const userId = actor || req?.user?._id;
  const [event] = await FinanceEvent.create([{
    eventType,
    entityType,
    entityId,
    payload,
    actor: userId
  }], { session });

  await audit({
    req,
    actor: userId,
    action: eventType,
    entityType,
    entityId,
    newValue: payload,
    session
  });

  if (notifyUsers.length > 0) {
    await Notification.insertMany(notifyUsers.map((user) => ({
      user,
      text: `Finance event: ${eventType}`,
      type: 'general'
    })), { session });
  }

  return event;
};

module.exports = {
  audit,
  emit
};
