const express = require('express');
const {
  getPackageSales,
  createPackageSale,
  getPackageSalesCommissions,
  getPackageSalesFollowups,
  logPackageSalesActivity,
  getPackageSalesActivities,
  updatePackageSale,
  deletePackageSale
} = require('../controllers/packageSalesController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

router.get('/', protect, getPackageSales);
router.post('/', protect, createPackageSale);
router.get('/activities', protect, getPackageSalesActivities);
router.post('/activities', protect, logPackageSalesActivity);
router.get('/commissions', protect, getPackageSalesCommissions);
router.get('/followups', protect, getPackageSalesFollowups);
router.put('/:id', protect, updatePackageSale);
router.delete('/:id', protect, deletePackageSale);

module.exports = router;
