const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// List all orders
router.get('/', orderController.listOrders);

module.exports = router;
