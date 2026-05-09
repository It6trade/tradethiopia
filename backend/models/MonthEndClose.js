const mongoose = require('mongoose');

const monthEndCloseSchema = new mongoose.Schema({
  fiscalPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalPeriod', required: true, unique: true },
  status: { type: String, enum: ['open', 'checklist_review', 'statements_generated', 'ready_to_lock', 'locked'], default: 'open', index: true },
  checklist: {
    reconcileBanks: { type: Boolean, default: false },
    reviewUnpaidInvoices: { type: Boolean, default: false },
    reviewUnpaidBills: { type: Boolean, default: false },
    postAccruals: { type: Boolean, default: false },
    finalizePayroll: { type: Boolean, default: false },
    reviewTax: { type: Boolean, default: false },
    generateStatements: { type: Boolean, default: false },
    lockFiscalPeriod: { type: Boolean, default: false }
  },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('MonthEndClose', monthEndCloseSchema);
