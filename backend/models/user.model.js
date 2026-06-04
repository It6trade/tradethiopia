const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    points: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    username: {
        type: String,
        required: true, // Required
        index: true, // Add index for faster queries
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'HR', 'Enisra', 'Enisra', 'sales', 'salesmanager', 'tradextv', 'customerservice', 'SocialmediaManager', 'CustomerSuccessManager', 'TETV', 'IT', 'HR', 'supervisor', 'Instructor', 'EventManager', 'COO', 'TradeXTV', 'finance', 'reception'],
        default: 'sales',
        index: true, // Add index for faster queries
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
        index: true, // Add index for faster queries
    },
    fullName: {
        type: String,
        required: false, // Optional
    },
    altEmail: {
        type: String,
        default: '',
    },
    altPhone: {
        type: String,
        default: '',
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male',
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'remote', 'contract', 'intern'],
        required: false, // Optional
    },

    jobTitle: {
        type: String,
        required: false, // Optional
    },
    salary: {
        type: Number,
        required: false,
        default: 0,
    },

    education: {
        type: String,
        required: false, // Optional
    },
    location: {
        type: String,
        required: false, // Optional
    },
    phone: {
        type: String,
        required: false, // Optional
    },
    additionalLanguages: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
    digitalId: {
        type: String, // Assuming this is a string identifier
        required: false, // Optional
    },
    photo: {
        type: mongoose.Schema.Types.Mixed, // Supports various types (e.g., URL, file path)
        required: false, // Optional
    },
    infoStatus: {
        type: String,
        default: 'pending',
        required: false, // Optional
    },
    trainingStatus: {
        type: String,
        required: false, // Optional
    },
    hireDate: {
        type: Date,
        required: false, // Optional
    },
    guarantorFile: {
        type: mongoose.Schema.Types.Mixed, // Supports various types (e.g., URL, file path)
        required: false, // Optional
    },
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
