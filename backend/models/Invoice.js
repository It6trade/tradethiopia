const mongoose = require('mongoose');

const invoiceItemEmbeddedSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  total: { type: Number, default: 0 }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, trim: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesOrderNumber: { type: String, trim: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  currency: { type: String, default: 'ETB' },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled', 'reversed', 'sent'],
    default: 'draft',
    index: true
  },
  items: [invoiceItemEmbeddedSchema],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversedByEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversedAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.pre('validate', function calculateTotals(next) {
  let subtotal = 0;
  let taxTotal = 0;
  this.items = (this.items || []).map((item) => {
    const lineSubtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    const lineTax = lineSubtotal * (Number(item.taxRate || 0) / 100);
    item.total = Number((lineSubtotal + lineTax).toFixed(2));
    subtotal += lineSubtotal;
    taxTotal += lineTax;
    return item;
  });
  this.subtotal = Number(subtotal.toFixed(2));
  this.taxTotal = Number(taxTotal.toFixed(2));
  this.total = Number((subtotal + taxTotal).toFixed(2));
  this.balance = Number((this.total - Number(this.paidAmount || 0)).toFixed(2));
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
