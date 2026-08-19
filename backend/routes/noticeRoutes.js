const express = require('express');
const {
  getNotices,
  getNoticeStats,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  recordNoticeView,
  togglePinNotice,
} = require('../controllers/noticeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotices);
router.get('/stats', protect, getNoticeStats);
router.get('/:id', protect, getNoticeById);
router.post('/', protect, createNotice);
router.put('/:id', protect, updateNotice);
router.delete('/:id', protect, deleteNotice);
router.post('/:id/view', protect, recordNoticeView);
router.post('/:id/pin', protect, togglePinNotice);

module.exports = router;
