const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockItemsByCategory,
  updateStockQuantity,
  updateBufferStock,
  reserveBufferStock,
  releaseBufferStock,
  deliverStock
} = require('../controllers/stockController');

// All routes are protected
router.route('/')
  .get(protect, getStockItems)
  .post(protect, createStockItem);

router.route('/category/:category')
  .get(protect, getStockItemsByCategory);

router.route('/:id')
  .get(protect, getStockItemById)
  .put(protect, updateStockItem)
  .delete(protect, deleteStockItem);

router.route('/:id/quantity')
  .put(protect, updateStockQuantity);

// Buffer stock routes
router.route('/:id/buffer')
  .put(protect, updateBufferStock);

router.route('/:id/reserve-buffer')
  .put(protect, reserveBufferStock);

router.route('/:id/release-buffer')
  .put(protect, releaseBufferStock);

// Delivery route
router.route('/:id/deliver')
  .put(protect, deliverStock);

module.exports = router;