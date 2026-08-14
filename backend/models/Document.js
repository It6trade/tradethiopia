const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    file: { type: String, required: true }, // Stores Appwrite file ID
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    department: { type: String, required: true, default: 'none' },
    section: { type: String, required: true },
}, {
    timestamps: true // Add createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Document', documentSchema);