const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEntries,
  createEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
} = require('../controllers/contentTrackerController');

router.route('/')
  .get(protect, getEntries)
  .post(protect, createEntry);

router.route('/:id')
  .get(protect, getEntryById)
  .put(protect, updateEntry)
  .delete(protect, deleteEntry);

module.exports = router;
