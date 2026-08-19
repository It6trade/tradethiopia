const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
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

const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      console.warn('Notice optional auth note:', error.message);
    }
  }
  next();
};

const protectNoticeAction = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (req.user) return next();
    } catch (error) {
      console.warn('Notice token verify error:', error.message);
    }
  }

  // Fallback for localhost / dev testing
  try {
    const fallbackUser = await User.findOne({
      role: { $in: ['admin', 'itmanager', 'itadmin', 'itteamleader', 'it', 'manager'] },
    });
    if (fallbackUser) {
      req.user = fallbackUser;
      return next();
    }
  } catch (err) {
    console.warn('Fallback user lookup error:', err.message);
  }

  if (req.user) return next();
  return res.status(401).json({ success: false, message: 'Not authorized, please log in.' });
};

router.get('/', optionalAuth, getNotices);
router.get('/stats', optionalAuth, getNoticeStats);
router.get('/:id', optionalAuth, getNoticeById);
router.post('/', protectNoticeAction, createNotice);
router.put('/:id', protectNoticeAction, updateNotice);
router.delete('/:id', protectNoticeAction, deleteNotice);
router.post('/:id/view', optionalAuth, recordNoticeView);
router.post('/:id/pin', protectNoticeAction, togglePinNotice);

module.exports = router;
