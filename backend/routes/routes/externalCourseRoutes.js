const express = require('express');
const router = express.Router();
const {
  getExternalCourses,
  createExternalCourse,
  updateExternalCourse,
  deleteExternalCourse
} = require('../controllers/externalCourseController');

router.get('/', getExternalCourses);
router.post('/', createExternalCourse);
router.put('/:id', updateExternalCourse);
router.delete('/:id', deleteExternalCourse);

module.exports = router;
