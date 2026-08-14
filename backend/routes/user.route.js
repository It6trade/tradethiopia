const express = require('express');
const { 
    userHealthCheck,
    createuser, 
    deleteuser, 
    getuser, 
    updateuser, 
    loginUser, 
    getUserCounts, 
    updateUserInfo // Import the new function
} = require('../controllers/user.controller.js');

const router = express.Router();

// Health check route
router.get("/health", userHealthCheck);

// User login route
router.post("/login", loginUser);

// Create user route
router.post("/", createuser);

// Get all users route
router.get("/", getuser);

// Get user counts route
router.get("/count", getUserCounts);

// Update user by ID route
router.put("/:id", updateuser);

// Update user information route
router.put("/info/:id", updateUserInfo); // New route for updating user info

// Delete user by ID route
router.delete("/:id", deleteuser);

module.exports = router;