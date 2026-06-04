const express = require('express');
const { getPackageSales, createPackageSale, getPackageSalesCommissions, getPackageSalesFollowups } = require('../controllers/packageSalesController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPackageSales);
router.post('/', protect, createPackageSale);
router.get('/commissions', getPackageSalesCommissions);
router.get('/followups', getPackageSalesFollowups);

module.exports = router;
