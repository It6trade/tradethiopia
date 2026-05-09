const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const purchaseController = require('../controllers/purchaseController');

// All routes are protected
router.use(protect);

// @desc    Get all purchases
// @route   GET /
// @access  Private
router.get('/', purchaseController.listPurchases);

// @desc    Get purchase statistics
// @route   GET /stats
// @access  Private
router.get('/stats', purchaseController.getPurchaseStats);

// @desc    Export purchases to CSV
// @route   GET /export
// @access  Private
router.get('/export', purchaseController.exportPurchasesToCSV);

// @desc    Create new purchase
// @route   POST /
// @access  Private
router.post('/', purchaseController.createPurchase);

// @desc    Get single purchase by ID
// @route   GET /:id
// @access  Private
router.get('/:id', purchaseController.getPurchaseById);

// @desc    Update purchase
// @route   PUT /:id
// @access  Private
router.put('/:id', purchaseController.updatePurchase);

// @desc    Delete purchase
// @route   DELETE /:id
// @access  Private
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;
