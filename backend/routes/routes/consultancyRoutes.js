const express = require("express");
const {
  createConsultancy,
  getConsultancies,
  updateConsultancy,
  deleteConsultancy,
} = require("../controllers/consultancyController");

const router = express.Router();

router.get("/", getConsultancies);
router.post("/", createConsultancy);
router.put("/:id", updateConsultancy);
router.delete("/:id", deleteConsultancy);

module.exports = router;
