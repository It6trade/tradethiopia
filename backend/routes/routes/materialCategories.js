const express = require('express');
const MaterialCategory = require('../models/MaterialCategory.js'); // Adjust the path as necessary

const router = express.Router();

// Fetch all material categories
router.get('/material-categories', async (req, res) => {
    try {
        const categories = await MaterialCategory.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: "Server error." });
    }
});

// Create a new material category
router.post('/material-categories', async (req, res) => {
    const { name, parent } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Category name is required." });
    }

    try {
        const newCategory = new MaterialCategory({ name, parent });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;