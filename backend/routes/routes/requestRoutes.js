const express = require("express");
const multer = require("multer");
const requestController = require("../controllers/requestController");
const { protect } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per attachment
});

router.get("/", protect, requestController.listRequests);
router.post("/", protect, upload.single("attachment"), requestController.createRequest);
router.patch("/:id/status", protect, requestController.updateStatus);

module.exports = router;
