const express = require('express');
const Asset = require('../models/Asset.js');

const router = express.Router();

// Create a new asset
router.post('/', async (req, res) => {
  const { nameTag, assets, location, assignedTo, status, amount, category, dateAcquired } = req.body;

  // Validate fields
  if (!nameTag || !location || !assets || !assignedTo || !status || !amount || !category || !dateAcquired) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const asset = new Asset(req.body);
  try {
    const savedAsset = await asset.save();
    res.status(201).json({ success: true, data: savedAsset });
  } catch (error) {
    console.error("Error saving asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all assets
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.find();
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk transfer assets from one user to another
router.post('/transfer', async (req, res) => {
  const { fromUser, toUser } = req.body;
  if (!fromUser || !toUser) {
    return res.status(400).json({ success: false, message: "fromUser and toUser are required." });
  }

  try {
    const result = await Asset.updateMany(
      { assignedTo: fromUser },
      { $set: { assignedTo: toUser } }
    );
    res.status(200).json({ 
      success: true, 
      message: `Successfully transferred assets from ${fromUser} to ${toUser}.`,
      data: {
        matchedCount: result.matchedCount || 0,
        modifiedCount: result.modifiedCount || 0
      }
    });
  } catch (error) {
    console.error("Error transferring assets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk update/rename categories for assets
router.post('/migrate-category', async (req, res) => {
  const { fromCategory, toCategory } = req.body;
  if (!fromCategory || !toCategory) {
    return res.status(400).json({ success: false, message: "fromCategory and toCategory are required." });
  }

  try {
    const result = await Asset.updateMany(
      { category: fromCategory },
      { $set: { category: toCategory } }
    );
    res.status(200).json({
      success: true,
      message: `Successfully migrated categories from '${fromCategory}' to '${toCategory}'.`,
      data: {
        matchedCount: result.matchedCount || 0,
        modifiedCount: result.modifiedCount || 0
      }
    });
  } catch (error) {
    console.error("Error migrating category assets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific asset by ID
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update an asset by ID
router.put('/:id', async (req, res) => {
  try {
    const existing = await Asset.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    // Check if assignment changed
    if (req.body.assignedTo !== undefined && req.body.assignedTo !== existing.assignedTo) {
      const history = existing.assignmentHistory || [];
      const lastAssignmentDate = history.length > 0 
        ? history[history.length - 1].dateTo 
        : existing.dateAcquired;
        
      const historyLog = {
        assignedTo: existing.assignedTo || "Unassigned",
        location: existing.location || "Unknown",
        dateFrom: lastAssignmentDate || existing.createdAt || new Date(),
        dateTo: new Date(),
        condition: existing.condition || "Good"
      };
      
      history.push(historyLog);
      req.body.assignmentHistory = history;
    }

    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an asset by ID
router.delete('/:id', async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }
    res.status(200).json({ success: true, message: "Asset deleted successfully." });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;