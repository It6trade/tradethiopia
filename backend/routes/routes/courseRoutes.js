const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseSlideImage,
  addCourseSlide,
  updateCourseSlide,
  addCourseQuestion,
  updateCourseQuestion,
  deleteCourseQuestion
} = require('../controllers/courseController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', getCourses);
router.post('/', createCourse);
router.post('/slide-image', upload.single('image'), uploadCourseSlideImage);
router.post('/:id/slides', upload.single('image'), addCourseSlide);
router.put('/:id/slides/:slideId', updateCourseSlide);
router.post('/:id/questions', addCourseQuestion);
router.put('/:id/questions/:questionId', updateCourseQuestion);
router.delete('/:id/questions/:questionId', deleteCourseQuestion);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router;
