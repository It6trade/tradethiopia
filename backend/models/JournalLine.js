const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  label: { type: String, default: '' },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  partnerType: { type: String, enum: ['customer', 'vendor', 'employee', 'none'], default: 'none' },
  partner: { type: mongoose.Schema.Types.ObjectId, refPath: 'partnerModel' },
  partnerModel: { type: String, enum: ['Customer', 'Vendor', 'User'] }
}, { timestamps: true });

module.exports = mongoose.model('JournalLine', journalLineSchema);
