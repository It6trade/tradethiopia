const express = require('express');
const { 
    userHealthCheck,
    createuser, 
    deleteuser, 
    getuser, 
    updateuser, 
    loginUser, 
    getUserCounts, 
    updateUserInfo,
    getHRDashboardStats,
    getEmployeeDetails
} = require('../controllers/user.controller.js');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const router = express.Router();

// Health check route
router.get("/health", userHealthCheck);

// User login route
router.post("/login", loginUser);

// Create user route
router.post("/", createuser);

// Get HR dashboard statistics
router.get("/hr-stats", getHRDashboardStats);

// Get all users route
router.get("/", getuser);

// Get user counts route
router.get("/count", getUserCounts);

// Complete profile and documents are restricted to HR.
router.get("/:id/details", protect, authorize('HR', 'hr'), getEmployeeDetails);

// Update user by ID route
router.put("/:id", updateuser);

// Update user information route
router.put("/info/:id", updateUserInfo); // New route for updating user info

// Delete user by ID route
router.delete("/:id", deleteuser);

module.exports = router;
