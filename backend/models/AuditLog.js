const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, default: '' },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function preventAuditDeletion(next) {
  if (this.getOptions?.().allowAuditDelete === true) return next();
  next(new Error('Finance audit logs are append-only and cannot be deleted through normal APIs'));
});

auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function preventAuditUpdate(next) {
  if (this.getOptions?.().allowAuditUpdate === true) return next();
  next(new Error('Finance audit logs are append-only and cannot be updated through normal APIs'));
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
