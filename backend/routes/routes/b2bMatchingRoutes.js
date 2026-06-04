const express = require('express');
const {
  matchBuyersAndSellers,
  getTopMatchesForBuyer,
  getTopMatchesForSeller
} = require('../controllers/b2bMatchingController');
const {
  importLeadInternationalRecords,
  createLeadInternationalRecord,
  updateLeadInternationalRecord,
  deleteLeadInternationalRecord,
  getLeadInternationalRecords
} = require('../controllers/leadInternationalController');

const router = express.Router();

// Get matches for buyers and sellers
router.post('/match', matchBuyersAndSellers);

// Get top matches for a specific buyer
router.get('/match/buyer/:buyerId', getTopMatchesForBuyer);

// Get top matches for a specific seller
router.get('/match/seller/:sellerId', getTopMatchesForSeller);

// Lead International records
router.get('/lead-international', getLeadInternationalRecords);
router.post('/lead-international', createLeadInternationalRecord);
router.put('/lead-international/:id', updateLeadInternationalRecord);
router.delete('/lead-international/:id', deleteLeadInternationalRecord);
router.post('/lead-international/import', importLeadInternationalRecords);

module.exports = router;
