const express = require('express');
const router = express.Router();
const tessbinController = require('../controllers/tessbinController');

// GET dashboard statistics & KPI summary
router.get('/dashboard-stats', tessbinController.getDashboardStats);

// GET all exam records with search and filter
router.get('/exams', tessbinController.getExamRecords);

// POST create a new student exam record
router.post('/exams', tessbinController.createExamRecord);

// PUT update an exam record
router.put('/exams/:id', tessbinController.updateExamRecord);

// DELETE remove an exam record
router.delete('/exams/:id', tessbinController.deleteExamRecord);

// KPI Targets CRUD
router.get('/kpis', tessbinController.getKpiTargets);
router.post('/kpis', tessbinController.createKpiTarget);
router.put('/kpis/:id', tessbinController.updateKpiTarget);
router.delete('/kpis/:id', tessbinController.deleteKpiTarget);

// ==========================================
// TS-EXAM REAL LIVE DATA & REPORTING ROUTES
// ==========================================
router.get('/ts-exam-live/health', tessbinController.getTsExamLiveHealth);
router.get('/ts-exam-live/dashboard', tessbinController.getTsExamLiveDashboard);
router.get('/ts-exam-live/summary', tessbinController.getTsExamLiveSummary);
router.get('/ts-exam-live/by-course', tessbinController.getTsExamLiveByCourse);
router.get('/ts-exam-live/registrations', tessbinController.getTsExamLiveRegistrations);

// READ-ONLY DATA ANALYTICS EXTERNAL API ROUTE
router.get('/external/data-analytics', tessbinController.getExternalDataAnalytics);

module.exports = router;

