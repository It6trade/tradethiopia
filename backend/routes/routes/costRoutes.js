const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const costController = require('../controllers/costController');

router.get('/', protect, costController.listCosts);
router.post('/', protect, costController.createCost);
router.put('/:id', protect, costController.updateCost);
router.delete('/:id', protect, costController.deleteCost);
router.get('/stats', protect, costController.getCostStats);

module.exports = router;
