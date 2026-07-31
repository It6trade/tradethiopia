const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  status: { type: String, required: true, trim: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, default: '', trim: true },
  note: { type: String, default: '', trim: true },
  occurredAt: { type: Date, default: Date.now },
}, { _id: false });

const decisionSchema = new mongoose.Schema({
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decision: { type: String, enum: ['', 'approved', 'rejected'], default: '' },
  note: { type: String, default: '', trim: true },
  decidedAt: { type: Date },
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  fileId: { type: String, trim: true },
  originalName: { type: String, trim: true },
  mimeType: { type: String, trim: true },
  size: { type: Number, min: 0 },
}, { _id: false });

const employeeRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, unique: true, index: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['leave', 'handover'],
    required: true,
    index: true,
  },
  subcategory: {
    type: String,
    enum: [
      'annual_leave',
      'sick_leave',
      'paternity_leave',
      'maternity_leave',
      'marriage_leave',
      'unpaid_leave',
      'other_leave',
      'material_handover',
      'task_handover',
    ],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  formData: { type: mongoose.Schema.Types.Mixed, required: true },
  attachments: { type: [attachmentSchema], default: [] },
  status: {
    type: String,
    enum: [
      'pending_manager',
      'manager_rejected',
      'pending_hr',
      'hr_approved',
      'hr_rejected',
      'cancelled',
    ],
    default: 'pending_manager',
    index: true,
  },
  managerDecision: { type: decisionSchema, default: () => ({}) },
  hrDecision: { type: decisionSchema, default: () => ({}) },
  history: { type: [historySchema], default: [] },
}, { timestamps: true });

employeeRequestSchema.index({ requester: 1, createdAt: -1 });
employeeRequestSchema.index({ manager: 1, status: 1, createdAt: -1 });
employeeRequestSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('EmployeeRequest', employeeRequestSchema);
