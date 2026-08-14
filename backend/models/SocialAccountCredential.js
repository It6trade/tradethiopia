const mongoose = require('mongoose');

const SocialAccountCredentialSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    employeeFullName: { type: String, trim: true, default: '' },
    accountName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    password: { type: String, trim: true, default: '' },
    socialPlatforms: [{ type: String, trim: true }],
    notes: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
    pageId: { type: String, trim: true, default: '' },
    accessToken: { type: String, trim: true, default: '' },
    isConnected: { type: Boolean, default: false },
    instagramBusinessAccountId: { type: String, trim: true, default: '' },
    whatsappPhoneNumberId: { type: String, trim: true, default: '' },
    whatsappBusinessAccountId: { type: String, trim: true, default: '' },
    linkedinUrn: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

SocialAccountCredentialSchema.index({ platform: 1, accountName: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccountCredential', SocialAccountCredentialSchema);
