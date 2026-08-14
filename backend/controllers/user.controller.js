const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model.js');
const jwt = require('jsonwebtoken');

// Health check endpoint for users
const userHealthCheck = async (req, res) => {
  try {
    console.log('User health check called');
    console.log('Environment:', {
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGO_URI ? 'SET' : 'NOT SET'
    });
    
    // Check if database is connected
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    console.log('Database status:', dbStatus);
    
    res.json({ 
      success: true,
      status: 'OK',
      database: dbStatus,
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('User health check failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'User health check failed',
      error: error.message,
      vercel: !!process.env.VERCEL
    });
  }
};

// User login function
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please provide both email and password" });
    }

    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Generate a token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Successful login, return user's details
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                email: user.email,
                _id: user._id,
                username: user.username,
                role: user.role,
                status: user.status,
                fullName: user.fullName,
                altEmail: user.altEmail,
                altPhone: user.altPhone,
                gender: user.gender,
            jobTitle: user.jobTitle,
            hireDate: user.hireDate,
            employmentType: user.employmentType,
            education: user.education,
            location: user.location,
            phone: user.phone,
            additionalLanguages: user.additionalLanguages,
            salary: user.salary,
            notes: user.notes,
                digitalId: user.digitalId,
                photo: user.photo,
                photoUrl: user.photo ? 
                    `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${user.photo}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
                    null,
                infoStatus: user.infoStatus,
                trainingStatus: user.trainingStatus,
                guarantorFile: user.guarantorFile,
                guarantorFileUrl: user.guarantorFile ? 
                    `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${user.guarantorFile}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
                    null
            }
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create a new user
const createuser = async (req, res) => {
    const { 
        username, email, password, role, status, 
        fullName, altEmail, altPhone, gender, 
        jobTitle, hireDate, employmentType, 
        education, location, phone, additionalLanguages, 
        notes,digitalId,photo,infoStatus,trainingStatus,guarantorFile,
        salary
    } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        // Set default status if not provided
        const userStatus = status || (role === "admin" || role === "HR" ? "active" : "inactive");

        const newUser = new User({ 
            username, 
            email, 
            password, 
            role, 
            status: userStatus,
            fullName,
            altEmail,
            altPhone,
            gender,
            jobTitle,
            hireDate,
            employmentType,
            education,
            location,
            phone,
            additionalLanguages,
            notes,
            digitalId,
            photo,
            infoStatus,
            trainingStatus,
            guarantorFile,
            salary: salary !== undefined && salary !== null ? Number(salary) : undefined
        });
        await newUser.save();
        res.status(201).json({ success: true, data: newUser });

    } catch (error) {
        console.error("Error in creating user:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all users
const getuser = async (req, res) => {
    try {
        console.log('Get users called');
        console.log('Environment:', {
          vercel: !!process.env.VERCEL,
          nodeEnv: process.env.NODE_ENV
        });
        
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            console.log('Database not connected');
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        console.log('Fetching users from database');
        const users = await User.find({});
        
        // Add Appwrite file URLs to each user
        const usersWithUrls = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                photoUrl: userObj.photo ? 
                    `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${userObj.photo}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
                    null,
                guarantorFileUrl: userObj.guarantorFile ? 
                    `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${userObj.guarantorFile}/view?project=${process.env.APPWRITE_PROJECT_ID}` : 
                    null
            };
        });
        
        res.status(200).json({ success: true, data: usersWithUrls });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Update user by ID
const updateuser = async (req, res) => {
    const { id } = req.params;
    const userUpdates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid user ID" });
    }

    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        if (userUpdates.password) {
            const salt = await bcrypt.genSalt(10);
            userUpdates.password = await bcrypt.hash(userUpdates.password, salt);
        }
        // Update user and return the updated user
        const updatedUser = await User.findByIdAndUpdate(id, userUpdates, { new: true });
        res.status(200).json({ success: true, message: "User updated successfully!", data: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ success: false, message: "Failed to update user" });
    }
};

// Delete user by ID
const deleteuser = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid user ID" });
    }

    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted" });
        console.log("User deleted:", id);
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get user counts
const getUserCounts = async (req, res) => {
    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        res.status(200).json({ success: true, data: { totalUsers, activeUsers } });
    } catch (error) {
        console.error("Error fetching user counts:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Update user information based on user input
const updateUserInfo = async (req, res) => {
    const { id } = req.params;
    const userUpdates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid user ID" });
    }

    try {
        // Check if database is connected
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ success: false, message: "Database connection error" });
        }
        
        // Update user based on new information
        const updatedUser = await User.findByIdAndUpdate(id, userUpdates, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User information updated successfully!", data: updatedUser });
    } catch (error) {
        console.error("Error updating user information:", error.message);
        res.status(500).json({ success: false, message: "Failed to update user information" });
    }
};

module.exports = {
    userHealthCheck,
    loginUser,
    createuser,
    getuser,
    updateuser,
    deleteuser,
    getUserCounts,
    updateUserInfo
};
