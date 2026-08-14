const express = require('express');
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document.js');
const Category = require('../models/Category.js');
const fs = require('fs');
const { storage } = require('../config/appwriteClient.js'); // Import Appwrite storage
const { File } = require('node-fetch-native-with-agent'); // Import File class

const router = express.Router();

// Configure multer to store files in memory for Appwrite upload
const upload = multer({ storage: multer.memoryStorage() });

// Upload a document to Appwrite Storage
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { title, categoryId, department, section } = req.body;

        // Log to check the received values
        console.log('Received data:', { title, categoryId, department, section });
        console.log('Received file:', req.file);

        // Validate required fields
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        // Validate category
        if (!categoryId) {
            return res.status(400).json({ error: 'Category is required' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({ error: 'Invalid category' });
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
            title,
            file: appwriteFile.$id, // Store Appwrite file ID instead of file path
            category: categoryId,
            department,
            section,
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
        const { title, categoryId, department, section } = req.body;

        // Validate category if provided
        if (categoryId) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(400).json({ error: 'Invalid category' });
            }
        }

        const updatedDocument = await Document.findByIdAndUpdate(
            req.params.id,
            { title, category: categoryId, department, section },
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