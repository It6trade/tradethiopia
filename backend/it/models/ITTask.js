const mongoose = require('mongoose');

const ITTaskSchema = new mongoose.Schema({
  taskName: { type: String, required: false },
  projectType: { type: String, enum: ['internal', 'external'], required: true },
  // For external tasks: category (should be a string, not array); for internal: platform (should also be a string)
  category: { type: String, default: '' },
  platform: { type: String, default: '' },
  client: { type: String, default: '' },
  actionType: {
    type: String,
    required: true
  },
  description: { type: String, default: '' },
  attachments: [{ type: String }], // Array of file URLs
  status: { type: String, enum: ['pending', 'ongoing', 'done'], default: 'pending' },
  startDate: { type: Date },
  endDate: { type: Date },
  remarks: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  assignedTo: [{ type: String }], // Array of assigned user IDs
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  featureCount: { type: Number, default: 0 } // Number of features added to the task
}, { timestamps: true });

module.exports = mongoose.model('ITTask', ITTaskSchema);
