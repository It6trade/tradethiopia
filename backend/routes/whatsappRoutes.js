const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { protect } = require('../middleware/auth');

router.post('/verify-connection', protect, whatsappController.verifyConnection);
router.post('/send', protect, whatsappController.sendMessage);

module.exports = router;
