const { Schema, model } = require('mongoose');

const tradexFollowupSchema = new Schema(
  {
    clientName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    email: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    services: { type: [String], default: [] },
    status: { type: String, default: 'In Progress' },
    priority: { type: String, default: 'High' },
    notes: { type: String, trim: true },
    deadline: { type: Date },
    createdBy: { type: String, trim: true },
    owner: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('TradexFollowup', tradexFollowupSchema);
