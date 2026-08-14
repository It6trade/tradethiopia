const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/contentPlanController');

router.route('/')
  .get(protect, getPlans)
  .post(protect, createPlan);

router.route('/:id')
  .put(protect, updatePlan)
  .delete(protect, deletePlan);

module.exports = router;
