const express = require('express');
const { protect } = require('../middleware/auth');
const { getActionItems } = require('../controllers/actionItemController');

const router = express.Router();

router.get('/', protect, getActionItems);

module.exports = router;
