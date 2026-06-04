const express = require("express");
const {
  createEnsraFollowup,
  getEnsraFollowups,
  updateEnsraFollowup,
  deleteEnsraFollowup,
} = require("../controllers/ensraFollowupController");

const router = express.Router();

router.get("/", getEnsraFollowups);
router.post("/", createEnsraFollowup);
router.put("/:id", updateEnsraFollowup);
router.delete("/:id", deleteEnsraFollowup);

module.exports = router;
