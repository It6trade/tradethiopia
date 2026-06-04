const Stock = require('../models/Stock');
const asyncHandler = require('express-async-handler');

// @desc    Get all stock items
// @route   GET /api/stock
// @access  Private
const getStockItems = asyncHandler(async (req, res) => {
  try {
    const stockItems = await Stock.find({}).sort({ createdAt: -1 });
    res.json(stockItems);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching stock items", 
      error: error.message 
    });
  }
});

// @desc    Get stock item by ID
// @route   GET /api/stock/:id
// @access  Private
const getStockItemById = asyncHandler(async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id);
    
    if (stockItem) {
      res.json(stockItem);
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching stock item", 
      error: error.message 
    });
  }
});

// @desc    Create new stock item
// @route   POST /api/stock
// @access  Private
const createStockItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, cost, quantity, unit, sku, supplier } = req.body;

  try {
    // Check if SKU already exists
    const existingStock = await Stock.findOne({ sku });
    if (existingStock) {
      return res.status(400).json({ message: 'Stock item with this SKU already exists' });
    }

    const stockItem = new Stock({
      name,
      description,
      category,
      price,
      cost: cost || 0, // Default to 0 if not provided
      quantity,
      unit,
      sku,
      supplier
    });

    const createdStockItem = await stockItem.save();
    res.status(201).json(createdStockItem);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creating stock item", 
      error: error.message 
    });
  }
});

// @desc    Update stock item
// @route   PUT /api/stock/:id
// @access  Private
const updateStockItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, cost, quantity, unit, sku, supplier } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      // Check if SKU is being changed and if it already exists
      if (sku && sku !== stockItem.sku) {
        const existingStock = await Stock.findOne({ sku });
        if (existingStock) {
          return res.status(400).json({ message: 'Stock item with this SKU already exists' });
        }
      }

      stockItem.name = name || stockItem.name;
      stockItem.description = description || stockItem.description;
      stockItem.category = category || stockItem.category;
      stockItem.price = price !== undefined ? price : stockItem.price;
      stockItem.cost = cost !== undefined ? cost : stockItem.cost;
      stockItem.quantity = quantity !== undefined ? quantity : stockItem.quantity;
      stockItem.unit = unit || stockItem.unit;
      stockItem.sku = sku || stockItem.sku;
      stockItem.supplier = supplier || stockItem.supplier;

      const updatedStockItem = await stockItem.save();
      res.json(updatedStockItem);
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating stock item", 
      error: error.message 
    });
  }
});

// @desc    Delete stock item
// @route   DELETE /api/stock/:id
// @access  Private
const deleteStockItem = asyncHandler(async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      await stockItem.remove();
      res.json({ message: 'Stock item removed' });
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting stock item", 
      error: error.message 
    });
  }
});

// @desc    Get stock items by category
// @route   GET /api/stock/category/:category
// @access  Private
const getStockItemsByCategory = asyncHandler(async (req, res) => {
  try {
    const stockItems = await Stock.find({ category: req.params.category });
    res.json(stockItems);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching stock items by category", 
      error: error.message 
    });
  }
});

// @desc    Update stock quantity
// @route   PUT /api/stock/:id/quantity
// @access  Private
const updateStockQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      stockItem.quantity = quantity !== undefined ? quantity : stockItem.quantity;
      const updatedStockItem = await stockItem.save();
      res.json(updatedStockItem);
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating stock quantity", 
      error: error.message 
    });
  }
});

// @desc    Update buffer stock quantity
// @route   PUT /api/stock/:id/buffer
// @access  Private
const updateBufferStock = asyncHandler(async (req, res) => {
  const { bufferStock } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      // Validate bufferStock is a number
      if (typeof bufferStock !== 'number' || isNaN(bufferStock) || bufferStock < 0) {
        return res.status(400).json({ 
          message: 'Invalid buffer stock value. Must be a non-negative number.',
          received: bufferStock,
          type: typeof bufferStock
        });
      }
      
      stockItem.bufferStock = bufferStock;
      const updatedStockItem = await stockItem.save();
      res.json(updatedStockItem);
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    console.error('Error updating buffer stock:', error);
    res.status(500).json({ 
      message: "Error updating buffer stock", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Reserve items from buffer stock
// @route   PUT /api/stock/:id/reserve-buffer
// @access  Private
const reserveBufferStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      // Check if there's enough buffer stock to reserve
      if (stockItem.bufferStock >= quantity) {
        stockItem.reservedBuffer += quantity;
        const updatedStockItem = await stockItem.save();
        res.json({
          message: 'Buffer stock reserved successfully',
          reservedQuantity: quantity,
          remainingBuffer: updatedStockItem.bufferStock - updatedStockItem.reservedBuffer,
          updatedStockItem
        });
      } else {
        res.status(400).json({ 
          message: 'Not enough buffer stock available', 
          available: stockItem.bufferStock,
          requested: quantity
        });
      }
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error reserving buffer stock", 
      error: error.message 
    });
  }
});

// @desc    Release reserved buffer stock
// @route   PUT /api/stock/:id/release-buffer
// @access  Private
const releaseBufferStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      // Check if there's enough reserved buffer stock to release
      if (stockItem.reservedBuffer >= quantity) {
        stockItem.reservedBuffer -= quantity;
        const updatedStockItem = await stockItem.save();
        res.json({
          message: 'Buffer stock released successfully',
          releasedQuantity: quantity,
          remainingReserved: updatedStockItem.reservedBuffer,
          updatedStockItem
        });
      } else {
        res.status(400).json({ 
          message: 'Not enough reserved buffer stock to release', 
          reserved: stockItem.reservedBuffer,
          requested: quantity
        });
      }
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error releasing buffer stock", 
      error: error.message 
    });
  }
});

// @desc    Deliver stock items (deduct from regular stock or buffer stock)
// @route   PUT /api/stock/:id/deliver
// @access  Private
const deliverStock = asyncHandler(async (req, res) => {
  const { quantity, fromBuffer = false } = req.body;

  try {
    const stockItem = await Stock.findById(req.params.id);

    if (stockItem) {
      if (fromBuffer) {
        // Deduct from buffer stock
        if (stockItem.bufferStock >= quantity) {
          stockItem.bufferStock -= quantity;
          // Also reduce reserved buffer if needed
          if (stockItem.reservedBuffer >= quantity) {
            stockItem.reservedBuffer -= quantity;
          }
          const updatedStockItem = await stockItem.save();
          res.json({
            message: 'Items delivered from buffer stock',
            deliveredQuantity: quantity,
            remainingBuffer: updatedStockItem.bufferStock,
            remainingReserved: updatedStockItem.reservedBuffer,
            updatedStockItem
          });
        } else {
          res.status(400).json({ 
            message: 'Not enough buffer stock available for delivery', 
            available: stockItem.bufferStock,
            requested: quantity
          });
        }
      } else {
        // Deduct from regular stock
        if (stockItem.quantity >= quantity) {
          stockItem.quantity -= quantity;
          const updatedStockItem = await stockItem.save();
          res.json({
            message: 'Items delivered from regular stock',
            deliveredQuantity: quantity,
            remainingStock: updatedStockItem.quantity,
            updatedStockItem
          });
        } else {
          res.status(400).json({ 
            message: 'Not enough regular stock available for delivery', 
            available: stockItem.quantity,
            requested: quantity
          });
        }
      }
    } else {
      res.status(404).json({ message: 'Stock item not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error delivering stock", 
      error: error.message 
    });
  }
});

module.exports = {
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockItemsByCategory,
  updateStockQuantity,
  updateBufferStock,
  reserveBufferStock,
  releaseBufferStock,
  deliverStock
};