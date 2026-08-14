const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const ITReportSchema = new mongoose.Schema({
  reportId: { type: String, default: () => randomUUID(), unique: true },
  projectName: { type: String, required: true },
  projectType: { type: String, enum: ['internal','external'], required: true },
  actionType: { type: String, required: true },
  // Logical name of the task for display (internal task title or external client name)
  taskName: { type: String, required: false },
  // Logical task details for display (internal platforms or external categories)
  taskDetails: { type: String, required: false },
  description: { type: String },
  attachments: [{ type: String }], // Array of file URLs
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String },
  completionDate: { type: Date, default: Date.now },
  taskLeader: { type: String, default: '' },
  personnelName: [{ type: String }], // Array of assigned personnel names
  taskRef: { type: mongoose.Schema.Types.ObjectId, ref: 'ITTask', required: false },
  points: { type: Number, default: 0 } // Actual points based on features
}, { timestamps: true });

module.exports = mongoose.model('ITReport', ITReportSchema);
