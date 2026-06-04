const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrderCustomers,
  getOrderCustomerById,
  createOrderCustomer,
  updateOrderCustomer,
  deleteOrderCustomer
} = require('../controllers/orderCustomerController');

// All routes are protected
router.route('/')
  .get(protect, getOrderCustomers)
  .post(protect, createOrderCustomer);

router.route('/:id')
  .get(protect, getOrderCustomerById)
  .put(protect, updateOrderCustomer)
  .delete(protect, deleteOrderCustomer);

module.exports = router;