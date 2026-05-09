const mongoose = require('mongoose');

const postingTemplateLineSchema = new mongoose.Schema({
  accountCode: { type: String, required: true, trim: true },
  side: { type: String, enum: ['debit', 'credit'], required: true },
  amountPath: { type: String, required: true, trim: true },
  label: { type: String, default: '' },
  optional: { type: Boolean, default: false }
}, { _id: false });

const postingTemplateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  sourceType: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  lines: [postingTemplateLineSchema],
  active: { type: Boolean, default: true },
  systemTemplate: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PostingTemplate', postingTemplateSchema);
