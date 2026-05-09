const mongoose = require('mongoose');

const fiscalPeriodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  periodType: { type: String, enum: ['monthly', 'yearly'], default: 'monthly', index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ['open', 'locked', 'closed'], default: 'open', index: true },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lockedAt: { type: Date },
  reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reopenedAt: { type: Date },
  closeChecklist: {
    reconcileBanks: { type: Boolean, default: false },
    reviewUnpaidInvoices: { type: Boolean, default: false },
    reviewUnpaidBills: { type: Boolean, default: false },
    postAccruals: { type: Boolean, default: false },
    finalizePayroll: { type: Boolean, default: false },
    reviewTax: { type: Boolean, default: false },
    generateStatements: { type: Boolean, default: false }
  }
}, { timestamps: true });

fiscalPeriodSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('FiscalPeriod', fiscalPeriodSchema);
