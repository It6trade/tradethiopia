const mongoose = require('mongoose');

const billItemEmbeddedSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  total: { type: Number, default: 0 }
}, { _id: true });

const billSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, trim: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  purchaseOrderNumber: { type: String, trim: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  currency: { type: String, default: 'ETB' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'awaiting_approval', 'approved', 'posted', 'partially_paid', 'paid', 'closed', 'overdue', 'cancelled', 'reversed'],
    default: 'draft',
    index: true
  },
  items: [billItemEmbeddedSchema],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversedByEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversedAt: { type: Date },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

billSchema.pre('validate', function calculateTotals(next) {
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

module.exports = mongoose.model('Bill', billSchema);
