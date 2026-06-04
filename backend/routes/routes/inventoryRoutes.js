const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllInventory);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
// advanced stock management
router.post('/:id/deliver', inventoryController.deliverStock);
router.post('/:id/add-buffer', inventoryController.addBufferStock);
router.post('/:id/transfer-buffer', inventoryController.transferBufferToStock);
const movementController = require('../controllers/inventoryMovementController');
router.get('/:id/movements', movementController.getMovementsByItem);

module.exports = router;
