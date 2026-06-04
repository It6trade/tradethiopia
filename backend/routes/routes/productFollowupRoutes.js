const express = require('express');
const router = express.Router();
const {
  getProductFollowups,
  createProductFollowup,
  updateProductFollowup,
  deleteProductFollowup
} = require('../controllers/productFollowupController');

router.get('/', getProductFollowups);
router.post('/', createProductFollowup);
router.put('/:id', updateProductFollowup);
router.delete('/:id', deleteProductFollowup);

module.exports = router;
