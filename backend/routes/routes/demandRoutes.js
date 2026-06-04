const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');

router.get('/', demandController.listDemands);
router.post('/:id/resolve', demandController.resolveDemand);

module.exports = router;
