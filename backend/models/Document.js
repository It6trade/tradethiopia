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
    documentDate: { type: Date, default: Date.now },
    documentYear: { type: Number, default: () => new Date().getFullYear() },
    licenseSchedule: {
        startDateEthiopian: {
            year: { type: Number, default: null },
            month: { type: Number, default: null },
            day: { type: Number, default: null },
        },
        endDateEthiopian: {
            year: { type: Number, default: null },
            month: { type: Number, default: null },
            day: { type: Number, default: null },
        },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        renewalDate: { type: Date, default: null },
        reminderDaysBefore: { type: Number, min: 0, max: 365, default: 30 },
        updatedAt: { type: Date, default: null },
    },
}, {
    timestamps: true // Add createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Document', documentSchema);
