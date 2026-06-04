const express = require('express');
const {
  saveMatch,
  getSavedMatches,
  getSavedMatchById,
  updateSavedMatch,
  deleteSavedMatch,
  clearAllMatches
} = require('../controllers/savedMatchController');

const router = express.Router();

// Save a match
router.post('/', saveMatch);

// Get all saved matches for a user
router.get('/', getSavedMatches);

// Get a specific saved match
router.get('/:id', getSavedMatchById);

// Update a saved match
router.put('/:id', updateSavedMatch);

// Delete a saved match
router.delete('/:id', deleteSavedMatch);

// Clear all matches (mark as archived)
router.post('/clear', clearAllMatches);

module.exports = router;