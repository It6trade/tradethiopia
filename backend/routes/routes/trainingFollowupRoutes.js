const express = require("express");
const {
  createTrainingFollowup,
  getTrainingFollowups,
  getIncompleteTrainingCount,
  getWeeklyPopularTrainings,
  updateTrainingFollowup,
  deleteTrainingFollowup,
} = require("../controllers/trainingFollowupController");

const router = express.Router();

router.get("/", getTrainingFollowups);
router.get("/incomplete-count", getIncompleteTrainingCount);
router.get("/weekly-popular", getWeeklyPopularTrainings);
router.post("/", createTrainingFollowup);
router.put("/:id", updateTrainingFollowup);
router.delete("/:id", deleteTrainingFollowup);

module.exports = router;