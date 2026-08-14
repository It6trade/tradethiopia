const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:notifications@tradethiopia.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * GET /api/push/vapid-public-key
 * Returns the public VAPID key so the client can subscribe
 */
const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

/**
 * POST /api/push/subscribe
 * Save a push subscription for the authenticated user
 */
const subscribe = async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: "Missing push subscription" });
    }

    // Upsert – update if endpoint exists, insert otherwise
    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id, "subscription.endpoint": subscription.endpoint },
      { userId: req.user._id, subscription, userAgent: userAgent || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("[Push] Subscribe error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/push/unsubscribe
 * Remove a push subscription
 */
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: "Missing endpoint" });

    await PushSubscription.deleteOne({
      userId: req.user._id,
      "subscription.endpoint": endpoint,
    });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Send a push notification to all subscriptions of a given userId.
 * Used internally (not exposed as route).
 */
const sendPushToUser = async (userId, payload) => {
  try {
    const subs = await PushSubscription.find({ userId });
    if (!subs.length) return;

    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);

    const results = await Promise.allSettled(
      subs.map((doc) =>
        webpush
          .sendNotification(doc.subscription, payloadStr)
          .then(() => {
            doc.lastSentAt = new Date();
            return doc.save();
          })
          .catch(async (err) => {
            // 410 Gone = subscription expired; remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await PushSubscription.deleteOne({ _id: doc._id });
              console.log("[Push] Removed expired subscription for user", userId);
            } else {
              console.error("[Push] Send error:", err.message);
            }
          })
      )
    );
    return results;
  } catch (err) {
    console.error("[Push] sendPushToUser error:", err);
  }
};

module.exports = { getVapidPublicKey, subscribe, unsubscribe, sendPushToUser };
