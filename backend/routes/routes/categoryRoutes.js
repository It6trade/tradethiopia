const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory, checkCategoryUsage } = require('../controllers/categoryController.js');

const router = express.Router();

// GET request to fetch all categories
router.get('/', getCategories);

// POST request to create a new category
router.post('/', createCategory);

// PUT request to update a category
router.put('/:id', updateCategory);

// DELETE request to delete a category
router.delete('/:id', deleteCategory);

// New route to check category usage
router.get('/check-usage/:id', checkCategoryUsage);

module.exports = router;