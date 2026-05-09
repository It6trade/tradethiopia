const mongoose = require('mongoose');

const financeEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['InvoicePosted', 'PaymentReceived', 'BillApproved', 'ExpenseApproved', 'PayrollFinalized', 'JournalReversed', 'BankReconciled', 'PeriodClosed'],
    required: true,
    index: true
  },
  entityType: { type: String, required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  payload: { type: mongoose.Schema.Types.Mixed },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FinanceEvent', financeEventSchema);
