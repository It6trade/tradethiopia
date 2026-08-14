const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');
const { protect } = require('../middleware/auth');

router.post('/publish', protect, instagramController.publishPost);

module.exports = router;
