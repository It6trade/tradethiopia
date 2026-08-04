const express = require('express');
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document.js');
const Category = require('../models/Category.js');
const User = require('../models/user.model.js');
const fs = require('fs');
const { storage } = require('../config/appwriteClient.js'); // Import Appwrite storage
const { File } = require('node-fetch-native-with-agent'); // Import File class

const router = express.Router();
const leaveSubcategories = new Set([
    'Annual Leave',
    'Sick Leave',
    'Paternity Leave',
    'Maternity Leave',
    'Other Leave',
]);
const isEmployeeLeaveCategory = (category) =>
    String(category?.name || '').trim().toLowerCase() === 'employee leave';
const isLicenseCategory = (category) =>
    ['license', 'licenses', 'licensing'].includes(String(category?.name || '').trim().toLowerCase());

// Configure multer to store files in memory for Appwrite upload
const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return callback(new Error('Unsupported file type. Upload PDF, DOC, DOCX, JPG, or PNG.'));
        }
        callback(null, true);
    },
});
const uploadEmployeeDocument = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
        if (!error) return next();
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'File is too large. The maximum permitted size is 10 MB.'
            : error.message;
        return res.status(400).json({ error: message });
    });
};

// Upload a document to Appwrite Storage
router.post('/', uploadEmployeeDocument, async (req, res) => {
    try {
        const {
            title,
            userId,
            categoryId,
            subcategory,
            employeeName: suppliedEmployeeName,
            department: suppliedDepartment,
            section: suppliedSection,
        } = req.body;
        const isEmployeeDocument = suppliedSection === 'employees';

        // Validate required fields
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        // Validate category
        if (!categoryId) {
            return res.status(400).json({ error: 'Category is required' });
        }
        if (!title || !String(title).trim()) {
            return res.status(400).json({ error: 'Document type is required' });
        }
        if (isEmployeeDocument && !userId) {
            return res.status(400).json({ error: 'An employee must be selected from the database' });
        }

        const category = await Category.findById(categoryId);
        if (!category || (isEmployeeDocument && category.section !== 'employees')) {
            return res.status(400).json({
                error: isEmployeeDocument
                    ? 'Select a valid employee-document category'
                    : 'Invalid category'
            });
        }
        if (isEmployeeLeaveCategory(category) && !leaveSubcategories.has(subcategory)) {
            return res.status(400).json({
                error: 'Select Annual, Sick, Paternity, Maternity, or Other Leave'
            });
        }

        let employeeName = suppliedEmployeeName || '';
        let department = suppliedDepartment || 'none';
        if (isEmployeeDocument) {
            const employee = await User.findById(userId).select(
                '_id fullName username email jobTitle role'
            ).lean();
            if (!employee) {
                return res.status(400).json({ error: 'The selected employee record no longer exists' });
            }
            employeeName = employee.fullName || employee.username || employee.email;
            department = employee.jobTitle || employee.role || 'General';
        }

        // Upload file to Appwrite Storage
        const fileBuffer = req.file.buffer;
        const fileName = `${Date.now()}-${req.file.originalname}`;
        
        // Create a File object from the buffer
        const file = new File([fileBuffer], fileName, { type: req.file.mimetype });
        
        // Upload file to Appwrite bucket with correct parameters
        const appwriteFile = await storage.createFile({
            bucketId: process.env.APPWRITE_BUCKET_ID,
            fileId: 'unique()', // Let Appwrite generate unique ID
            file: file
        });

        // Create new document with Appwrite file ID
        const newDocument = new Document({
            userId: isEmployeeDocument ? userId : null,
            title: String(title).trim(),
            employeeName,
            file: appwriteFile.$id, // Store Appwrite file ID instead of file path
            category: categoryId,
            subcategory: isEmployeeLeaveCategory(category) ? subcategory : '',
            department,
            section: suppliedSection || category.section,
        });

        const savedDocument = await newDocument.save();

        res.status(201).json({
            ...savedDocument.toObject(),
            fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${appwriteFile.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}` // Include file URL for frontend with project ID
        });
    } catch (err) {
        console.error('Error uploading document:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all documents
router.get('/', async (req, res) => {
    try {
        // Filter by section if provided
        const filter = req.query.section ? { section: req.query.section } : {};
        const documents = await Document.find(filter).populate('category');
        // Add file URLs to each document for frontend access
        const documentsWithUrls = documents.map(doc => ({
            ...doc.toObject(),
            fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${doc.file}/view?project=${process.env.APPWRITE_PROJECT_ID}`
        }));
        res.status(200).json(documentsWithUrls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a document by ID
router.get('/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('category');
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Add file URL for frontend access
        const documentWithUrl = {
            ...document.toObject(),
            fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${document.file}/view?project=${process.env.APPWRITE_PROJECT_ID}`
        };
        
        res.status(200).json(documentWithUrl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a document (without changing the file)
router.put('/:id', async (req, res) => {
    try {
        const { title, categoryId, category, subcategory, department, section } = req.body;

        // Validate category if provided
        const nextCategoryId = categoryId || category;

        let nextCategory;
        if (nextCategoryId) {
            nextCategory = await Category.findById(nextCategoryId);
            if (!nextCategory) {
                return res.status(400).json({ error: 'Invalid category' });
            }
        }
        if (isEmployeeLeaveCategory(nextCategory) && !leaveSubcategories.has(subcategory)) {
            return res.status(400).json({ error: 'A valid leave type is required' });
        }

        const updatedDocument = await Document.findByIdAndUpdate(
            req.params.id,
            {
                title,
                category: nextCategoryId,
                subcategory: isEmployeeLeaveCategory(nextCategory) ? subcategory : '',
                department,
                section
            },
            { new: true }
        ).populate('category');

        if (!updatedDocument) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Add file URL for frontend access
        const documentWithUrl = {
            ...updatedDocument.toObject(),
            fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${updatedDocument.file}/view?project=${process.env.APPWRITE_PROJECT_ID}`
        };

        res.status(200).json(documentWithUrl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Partially update a document (without changing the file)
router.patch('/:id', async (req, res) => {
    try {
        const { title, categoryId, category, subcategory, department, section, licenseSchedule } = req.body;
        const nextCategoryId = categoryId || category;
        const update = {};

        const currentDocument = await Document.findById(req.params.id).populate('category');
        if (!currentDocument) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (title !== undefined) update.title = title;
        if (department !== undefined) update.department = department;
        if (section !== undefined) update.section = section;
        if (subcategory !== undefined) {
            if (subcategory && !leaveSubcategories.has(subcategory)) {
                return res.status(400).json({ error: 'Invalid leave type' });
            }
            update.subcategory = subcategory;
        }

        if (nextCategoryId !== undefined) {
            const categoryDoc = await Category.findById(nextCategoryId);
            if (!categoryDoc) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            update.category = nextCategoryId;
            if (!isEmployeeLeaveCategory(categoryDoc)) update.subcategory = '';
        }

        if (licenseSchedule !== undefined) {
            const effectiveCategory = nextCategoryId
                ? await Category.findById(nextCategoryId)
                : currentDocument.category;
            if (!isLicenseCategory(effectiveCategory)) {
                return res.status(400).json({ error: 'Renewal schedules can only be assigned to License documents' });
            }

            const renewalDate = new Date(licenseSchedule.renewalDate);
            const reminderDaysBefore = Number(licenseSchedule.reminderDaysBefore);
            if (!licenseSchedule.renewalDate || Number.isNaN(renewalDate.getTime())) {
                return res.status(400).json({ error: 'Select a valid license renewal date' });
            }
            if (!Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0 || reminderDaysBefore > 365) {
                return res.status(400).json({ error: 'Reminder interval must be a whole number from 0 to 365 days' });
            }
            update.licenseSchedule = { renewalDate, reminderDaysBefore, updatedAt: new Date() };
        }

        const updatedDocument = await Document.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).populate('category');

        res.status(200).json({
            ...updatedDocument.toObject(),
            fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${updatedDocument.file}/view?project=${process.env.APPWRITE_PROJECT_ID}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a document and its file from Appwrite Storage
router.delete('/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete the file from Appwrite Storage
        try {
            await storage.deleteFile({
                bucketId: process.env.APPWRITE_BUCKET_ID,
                fileId: document.file
            });
        } catch (appwriteError) {
            console.error('Error deleting file from Appwrite:', appwriteError);
            // Continue with document deletion even if file deletion fails
        }

        // Delete the document from the database
        await Document.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
