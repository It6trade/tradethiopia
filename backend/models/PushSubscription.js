const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true }
    }
  },
  userAgent: { type: String, default: "" },
  createdAt:  { type: Date, default: Date.now },
  lastSentAt: { type: Date, default: null }
});

pushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
