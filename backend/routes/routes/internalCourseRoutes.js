const express = require('express');
const router = express.Router();
const {
  getInternalCourses,
  createInternalCourse,
  updateInternalCourse,
  deleteInternalCourse
} = require('../controllers/internalCourseController');

router.get('/', getInternalCourses);
router.post('/', createInternalCourse);
router.put('/:id', updateInternalCourse);
router.delete('/:id', deleteInternalCourse);

module.exports = router;
