const express = require('express');
const {
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  getBuyersByIndustry,
  addPackageToBuyer,
  updateBuyerPackage,
  removeBuyerPackage
} = require('../controllers/buyerController');

const router = express.Router();

// Create a new buyer
router.post('/', createBuyer);

// Get all buyers
router.get('/', getAllBuyers);

// Get a buyer by ID
router.get('/:id', getBuyerById);

// Update a buyer
router.put('/:id', updateBuyer);

// Delete a buyer
router.delete('/:id', deleteBuyer);

// Get buyers by industry
router.get('/industry/:industry', getBuyersByIndustry);

// Add a package to a buyer
router.post('/:id/packages', addPackageToBuyer);

// Update a package for a buyer
router.put('/:id/packages/:packageId', updateBuyerPackage);

// Remove a package from a buyer
router.delete('/:id/packages/:packageId', removeBuyerPackage);

module.exports = router;