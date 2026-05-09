const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'income', 'expense'],
    required: true
  },
  parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  normalBalance: { type: String, enum: ['debit', 'credit'], required: true },
  currency: { type: String, default: 'ETB' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  systemAccount: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

accountSchema.index({ type: 1, active: 1 });
accountSchema.index({ parentAccount: 1 });

accountSchema.pre('validate', function setNormalBalance(next) {
  if (!this.normalBalance) {
    this.normalBalance = ['asset', 'expense'].includes(this.type) ? 'debit' : 'credit';
  }
  if (!this.parentAccount && this.parent) this.parentAccount = this.parent;
  if (!this.parent && this.parentAccount) this.parent = this.parentAccount;
  next();
});

module.exports = mongoose.model('Account', accountSchema);
