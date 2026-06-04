const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceTypeController');

// List all active service types
router.get('/', serviceTypeController.listServiceTypes);

// Create a new service type
router.post('/', serviceTypeController.createServiceType);

// Soft-delete a service type
router.delete('/:id', serviceTypeController.deleteServiceType);

module.exports = router;

