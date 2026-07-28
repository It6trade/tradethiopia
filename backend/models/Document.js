const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    title: { type: String, required: true },
    employeeName: { type: String, trim: true, default: '' },
    file: { type: String, required: true }, // Stores Appwrite file ID
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: {
        type: String,
        enum: ['', 'Annual Leave', 'Sick Leave', 'Paternity Leave', 'Maternity Leave', 'Other Leave'],
        default: '',
        trim: true,
    },
    department: { type: String, required: true, default: 'none' },
    section: { type: String, required: true },
}, {
    timestamps: true // Add createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Document', documentSchema);
