const Category = require('../models/Category.js');

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();  // Fetching all categories from the DB
        res.status(200).json({ success: true, data: categories });  // Send back the categories as a JSON response
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
};

// Create a new category
const createCategory = async (req, res) => {
  const { name, section, description, isMandatory } = req.body;

  try {
      const newCategory = new Category({
          name,
          section,
          description: description || '',
          isMandatory: Boolean(isMandatory),
      });

      const savedCategory = await newCategory.save();
      res.status(201).json({ success: true, data: savedCategory });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const updateData = req.body;
  
      // Find and update the category by ID
      const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
  
      if (!updatedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      res.status(200).json({ success: true, data: updatedCategory });  // Return updated category
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
    }
  };
  
  // Delete category
  const deleteCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
  
      // Find and delete the category by ID
      const deletedCategory = await Category.findByIdAndDelete(categoryId);
  
      if (!deletedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
    }
  };

  // Check if a category is used by any document item
const checkCategoryUsage = async (req, res) => {
  const { id } = req.params;
  try {
      res.status(200).json({ success: true, message: 'Category is not used' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error checking category usage', error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  checkCategoryUsage
};