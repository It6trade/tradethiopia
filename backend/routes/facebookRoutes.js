const express = require('express');
const router = express.Router();
const facebookController = require('../controllers/facebookController');
const { protect } = require('../middleware/auth');

router.post('/verify-connection', protect, facebookController.verifyConnection);
router.post('/publish', protect, facebookController.publishPost);
router.get('/login', facebookController.login);
router.get('/callback', facebookController.oauthCallback);

module.exports = router;
