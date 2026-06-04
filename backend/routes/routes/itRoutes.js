const express = require('express');
const router = express.Router();
const itController = require('../controllers/it.controller');
// NOTE: Auth checks removed for now to allow IT UI to function without tokens during local use.
router.get('/', itController.getTasks);

// Reports
router.get('/reports/all', itController.getReports);
router.get('/reports/:id', itController.getReportById);
router.put('/reports/:id', itController.updateReport);
router.post('/reports', itController.createReport);

// Task routes
router.get('/:id', itController.getTaskById);
router.post('/', itController.createTask);
router.put('/:id', itController.updateTask);
router.delete('/:id', itController.deleteTask);

module.exports = router;
