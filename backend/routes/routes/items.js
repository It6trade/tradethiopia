const express = require('express');
const Item = require('../models/Item.js');
const mongoose = require('mongoose');

const router = express.Router();

// Fetch all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Fetch a specific item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 'error', message: 'Invalid ID format' });
  }

  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;