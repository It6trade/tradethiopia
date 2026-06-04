const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByCustomerId,
  getOrderStats
} = require('../controllers/orderController');

// All routes are protected
router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.route('/stats')
  .get(protect, getOrderStats);

router.route('/customer/:customerId')
  .get(protect, getOrdersByCustomerId);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

module.exports = router;