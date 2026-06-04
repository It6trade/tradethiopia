const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');

// create payment (authorized roles: sales, finance, admin)
router.post('/', protect, authorizeRoles('sales','sales_manager','finance','admin'), paymentController.createPayment);
// list payments (finance/admin)
router.get('/', protect, authorizeRoles('finance','admin'), paymentController.listPayments);

module.exports = router;
