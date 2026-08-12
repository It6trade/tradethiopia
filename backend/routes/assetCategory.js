const express = require('express');
const AssetCategory = require('../models/AssetCategory.js');

const router = express.Router();

// Create Asset Category
router.post('/', async (req, res) => {
  const { name, parent } = req.body;
  const assetCategory = new AssetCategory({ name, parent });
  await assetCategory.save();
  res.status(201).json(assetCategory);
});

// Bulk Create Categories
router.post('/bulk', async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Categories array is required." });
    }
    const docs = categories.map(name => ({ name }));
    const inserted = await AssetCategory.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, data: inserted });
  } catch (error) {
    if (error.code === 11000) {
      // Ignore duplicate key errors on bulk insert
      res.status(201).json({ success: true, message: "Inserted with some duplicates skipped." });
    } else {
      res.status(500).json({ message: "Error in bulk creation." });
    }
  }
});

// Get Asset Categories
router.get('/', async (req, res) => {
  try {
    const categories = await AssetCategory.find().populate('parent');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories." });
  }
});

// Update Asset Category
router.put('/:id', async (req, res) => {
  const { name, parent } = req.body;
  try {
    const updatedCategory = await AssetCategory.findByIdAndUpdate(
      req.params.id,
      { name, parent },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating category." });
  }
});

// Delete Asset Category
router.delete('/:id', async (req, res) => {
  try {
    const deletedCategory = await AssetCategory.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category." });
  }
});

module.exports = router;