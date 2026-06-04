const express = require('express');
const {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
  getSellersByIndustry,
  addPackageToSeller,
  updateSellerPackage,
  removeSellerPackage
} = require('../controllers/sellerController');

const router = express.Router();

// Create a new seller
router.post('/', createSeller);

// Get all sellers
router.get('/', getAllSellers);

// Get a seller by ID
router.get('/:id', getSellerById);

// Update a seller
router.put('/:id', updateSeller);

// Delete a seller
router.delete('/:id', deleteSeller);

// Get sellers by industry
router.get('/industry/:industry', getSellersByIndustry);

// Add a package to a seller
router.post('/:id/packages', addPackageToSeller);

// Update a package for a seller
router.put('/:id/packages/:packageId', updateSellerPackage);

// Remove a package from a seller
router.delete('/:id/packages/:packageId', removeSellerPackage);

module.exports = router;