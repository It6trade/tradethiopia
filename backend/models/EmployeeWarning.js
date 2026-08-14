const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileId: { type: String, required: true, trim: true },
  originalName: { type: String, required: true, trim: true },
  mimeType: { type: String, default: '', trim: true },
  size: { type: Number, default: 0, min: 0 },
}, { _id: false });

const historySchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  status: { type: String, required: true, trim: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, default: '', trim: true },
  note: { type: String, default: '', trim: true },
  occurredAt: { type: Date, default: Date.now },
}, { _id: false });

const employeeWarningSchema = new mongoose.Schema({
  referenceNumber: { type: String, required: true, unique: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  employeeSnapshot: {
    fullName: String, username: String, email: String, digitalId: String,
    jobTitle: String, department: String,
  },
  category: { type: String, enum: ['attendance', 'respect_attitude', 'company_related'], required: true, index: true },
  reason: { type: String, required: true, trim: true },
  level: { type: String, enum: ['first', 'second', 'final'], required: true },
  incidentDate: { type: Date, required: true },
  incidentTime: { type: String, default: '', trim: true },
  incidentDescription: { type: String, required: true, trim: true },
  correctiveAction: { type: String, required: true, trim: true },
  consequences: { type: String, required: true, trim: true },
  improvementDeadline: { type: Date, default: null },
  responseDeadline: { type: Date, required: true },
  attachments: { type: [attachmentSchema], default: [] },
  status: { type: String, enum: ['draft', 'issued', 'acknowledged', 'employee_responded', 'resolved', 'withdrawn'], default: 'draft', index: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  issuedAt: { type: Date, default: null },
  viewedAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  employeeResponse: { text: { type: String, default: '', trim: true }, attachments: { type: [attachmentSchema], default: [] }, submittedAt: Date },
  resolutionNote: { type: String, default: '', trim: true },
  resolvedAt: { type: Date, default: null },
  history: { type: [historySchema], default: [] },
}, { timestamps: true });

employeeWarningSchema.index({ employee: 1, createdAt: -1 });
employeeWarningSchema.index({ status: 1, responseDeadline: 1 });

module.exports = mongoose.model('EmployeeWarning', employeeWarningSchema);
