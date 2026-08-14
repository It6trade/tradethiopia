const express = require('express');
const { 
    userHealthCheck,
    createuser, 
    deleteuser, 
    getuser, 
    updateuser, 
    loginUser, 
    getCurrentUser,
    getUserCounts, 
    updateUserInfo,
    getHRDashboardStats,
    getEmployeeDetails
} = require('../controllers/user.controller.js');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const personalInfo = require('../controllers/employeePersonalInfoController');

const router = express.Router();

// Health check route
router.get("/health", userHealthCheck);

// User login route
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

// Create user route
router.post("/", createuser);

// Get HR dashboard statistics
router.get("/hr-stats", getHRDashboardStats);

// Get all users route
router.get("/", getuser);

// Get user counts route
router.get("/count", getUserCounts);

// Confidential employee information form. Static routes must precede /:id.
router.get("/personal-information/me", protect, personalInfo.getMine);
router.patch("/personal-information/me", protect, personalInfo.saveMine);
router.post("/personal-information/me/submit", protect, personalInfo.submitMine);
router.get("/:id/personal-information", protect, personalInfo.getForHr);
router.patch("/:id/personal-information/decision", protect, personalInfo.hrDecision);

// Complete profile and documents are restricted to HR.
router.get("/:id/details", protect, authorize('HR', 'hr', 'admin'), getEmployeeDetails);

// Update user by ID route
router.put("/:id", updateuser);

// Update user information route
router.put("/info/:id", updateUserInfo); // New route for updating user info

// Delete user by ID route
router.delete("/:id", deleteuser);

module.exports = router;
