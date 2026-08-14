const express = require("express");
const { getVapidPublicKey, subscribe, unsubscribe } = require("../controllers/pushController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public – client needs this to create a subscription
router.get("/vapid-public-key", getVapidPublicKey);

// Authenticated – save / remove subscriptions
router.post("/subscribe",   protect, subscribe);
router.delete("/unsubscribe", protect, unsubscribe);

module.exports = router;
