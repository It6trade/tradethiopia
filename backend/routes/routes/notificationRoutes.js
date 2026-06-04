const express = require("express");
const { getNotifications, markAsRead, markAllAsRead, broadcastNotification } = require("../controllers/notificationController.js");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleAuth");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/:id", protect, markAsRead);
router.put("/mark-all-read", protect, markAllAsRead);
// Allow admins/COO to send broadcasts
router.post("/broadcast", protect, authorize('admin', 'COO'), broadcastNotification);

module.exports = router;
