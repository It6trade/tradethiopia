const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getPublishedCourse,
  getManagerCourse,
  saveManagerCourse,
  publishManagerCourse,
  uploadSlideImage,
} = require('../controllers/salesOnboardingCourseController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const managerRoles = ['salesmanager', 'sales_manager', 'sales manager', 'admin', 'Admin'];

router.get('/published', getPublishedCourse);
router.get('/manage', protect, authorize(...managerRoles), getManagerCourse);
router.put('/manage', protect, authorize(...managerRoles), saveManagerCourse);
router.post('/manage/publish', protect, authorize(...managerRoles), publishManagerCourse);
router.post(
  '/manage/upload-image',
  protect,
  authorize(...managerRoles),
  upload.single('file'),
  uploadSlideImage
);

module.exports = router;
