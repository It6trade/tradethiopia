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