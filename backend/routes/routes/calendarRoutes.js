const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getCalendarEvents,
  getCalendarEventsByRange,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/calendarController');

// All routes are protected
router.route('/events')
  .get(protect, getCalendarEvents)
  .post(protect, createCalendarEvent);

router.route('/events/range')
  .get(protect, getCalendarEventsByRange);

router.route('/events/:id')
  .put(protect, updateCalendarEvent)
  .delete(protect, deleteCalendarEvent);

module.exports = router;