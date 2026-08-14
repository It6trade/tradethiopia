const express = require('express');
const router = express.Router();
const linkedinController = require('../controllers/linkedinController');
const { protect } = require('../middleware/auth');

router.get('/login', linkedinController.login);
router.get('/callback', linkedinController.oauthCallback);
router.post('/verify-connection', protect, linkedinController.verifyConnection);
router.post('/publish', protect, linkedinController.publishPost);

module.exports = router;
