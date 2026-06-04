const express = require('express');
const { createFollowUp, getAllFollowUps, updateFollowUp, deleteFollowUp, getFollowUpCount } = require('../controllers/customerFollowUpController.js');

const router = express.Router();

// Create a new follow-up
router.post('/', createFollowUp);

// Get all follow-ups
router.get('/', getAllFollowUps);

// Get the count of follow-ups
router.get('/count', getFollowUpCount); // New endpoint for count

// Update a follow-up
router.put('/:id', updateFollowUp);

// Delete a follow-up
router.delete('/:id', deleteFollowUp);

module.exports = router;