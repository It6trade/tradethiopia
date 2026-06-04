const Order = require('../models/Order');
const Stock = require('../models/Stock');
const OrderCustomer = require('../models/OrderCustomer');
const asyncHandler = require('express-async-handler');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  try {
    // Build query filter
    const filter = {};
    
    // If salesAgentId query param is provided, filter by that sales agent
    if (req.query.salesAgentId) {
      filter['salesAgent.id'] = req.query.salesAgentId;
      console.log('Filtering orders by sales agent ID:', req.query.salesAgentId);
    }
    
    console.log('Order filter:', filter);
    
    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
      
    console.log('Found orders:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: "Error fetching orders", 
      error: error.message 
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone');
    
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order", 
      error: error.message 
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { 
    customerId, 
    customerName, 
    customerEmail, 
    customerPhone, 
    items, 
    notes, 
    paymentType,
    paymentAmount,
    salesAgent // Accept salesAgent from frontend
  } = req.body;

  try {
    // Validate customer exists
    const customer = await OrderCustomer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate stock items and calculate totals
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const stockItem = await Stock.findById(item.stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: `Stock item with ID ${item.stockItemId} not found` });
      }
      
      // Check if sufficient quantity is available (considering both regular and buffer stock)
      const totalAvailable = stockItem.quantity + stockItem.bufferStock;
      if (totalAvailable < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${stockItem.name}. Available: ${totalAvailable}, Requested: ${item.quantity}` 
        });
      }
      
      const orderItem = {
        stockItemId: stockItem._id,
        name: stockItem.name,
        sku: stockItem.sku,
        quantity: item.quantity,
        unitPrice: stockItem.price,
        totalPrice: stockItem.price * item.quantity
      };
      
      orderItems.push(orderItem);
      totalAmount += orderItem.totalPrice;
    }

    // Use salesAgent information from frontend or fallback to fetching from database
    let agentInfo = salesAgent;
    if (!agentInfo || !agentInfo.id) {
      // Fallback to fetching user information from database if not provided
      const User = require('../models/user.model'); // Correct path to User model
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      agentInfo = {
        id: user._id,
        name: user.username || user.name || user.fullName,
        email: user.email || user.altEmail
      };
    }

    const order = new Order({
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      items: orderItems,
      totalAmount,
      paymentType,
      paymentAmount: paymentAmount || 0,
      notes,
      salesAgent: agentInfo, // Use sales agent information
      createdBy: req.user.id
    });

    const createdOrder = await order.save();
    
    // Populate the customer details before sending response
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('customerId', 'name email phone');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: "Error creating order", 
      error: error.message 
    });
  }
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
  const { status, notes, confirmedBy, paymentType, paymentAmount } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const oldStatus = order.status;
      
      // Only allow updating status, notes, confirmation details, and payment info
      if (status) order.status = status;
      if (notes !== undefined) order.notes = notes;
      if (paymentType) order.paymentType = paymentType;
      if (paymentAmount !== undefined) order.paymentAmount = paymentAmount;
      if (confirmedBy) {
        order.confirmedBy = confirmedBy;
        order.confirmedAt = Date.now();
      }
      
      // If status is being updated to Delivered, check if payment is complete
      if (status === 'Delivered' && oldStatus !== 'Delivered') {
        // Validate that full payment has been made before delivery
        const orderTotal = order.totalAmount || 0;
        const paymentMade = order.paymentAmount || 0;
        
        if (paymentMade < orderTotal) {
          return res.status(400).json({ 
            message: `Full payment of ETB ${orderTotal.toLocaleString()} is required before delivery. Current payment: ETB ${paymentMade.toLocaleString()}. Balance due: ETB ${(orderTotal - paymentMade).toLocaleString()}`
          });
        }
        
        order.deliveredAt = Date.now();
        
        // Deduct stock for each item in the order
        for (const item of order.items) {
          const stockItem = await Stock.findById(item.stockItemId);
          if (stockItem) {
            // First try to deduct from regular stock
            if (stockItem.quantity >= item.quantity) {
              stockItem.quantity -= item.quantity;
            } else {
              // Deduct from regular stock first
              const remainingQuantity = item.quantity - stockItem.quantity;
              stockItem.quantity = 0;
              
              // Then deduct from buffer stock if available
              if (stockItem.bufferStock >= remainingQuantity) {
                stockItem.bufferStock -= remainingQuantity;
                // Also reduce reserved buffer if needed
                if (stockItem.reservedBuffer >= remainingQuantity) {
                  stockItem.reservedBuffer -= remainingQuantity;
                }
              } else {
                // Not enough stock in buffer either
                return res.status(400).json({ 
                  message: `Not enough stock for ${stockItem.name}. Available: ${stockItem.quantity + stockItem.bufferStock}, Required: ${item.quantity}` 
                });
              }
            }
            await stockItem.save();
          } else {
            return res.status(404).json({ 
              message: `Stock item with ID ${item.stockItemId} not found` 
            });
          }
        }
      }
      
      // If status is being changed from Delivered to another status, restock items
      if (oldStatus === 'Delivered' && status !== 'Delivered') {
        // Restock items when order is no longer delivered
        for (const item of order.items) {
          const stockItem = await Stock.findById(item.stockItemId);
          if (stockItem) {
            // Add back to regular stock
            stockItem.quantity += item.quantity;
            await stockItem.save();
          }
        }
      }

      const updatedOrder = await order.save();
      
      // Populate the customer details before sending response
      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customerId', 'name email phone');
      
      res.json(populatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating order", 
      error: error.message 
    });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      await order.remove();
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting order", 
      error: error.message 
    });
  }
});

// @desc    Get orders by customer ID
// @route   GET /api/orders/customer/:customerId
// @access  Private
const getOrdersByCustomerId = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching customer orders", 
      error: error.message 
    });
  }
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = asyncHandler(async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    // For profit calculation, we would ideally join with stock items to get cost
    // For now, we'll use a simplified approach with a 20% profit margin
    const totalProfit = totalRevenue * 0.2;
    
    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      totalProfit
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order stats", 
      error: error.message 
    });
  }
});

// Reserve stock for a followup (allocate from on-hand, then buffer and mark reservedBuffer)
const reserveForFollowup = asyncHandler(async (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided to reserve' });
  }

  const reservations = [];
  let totalAmount = 0;

  for (const item of items) {
    const stockItemId = item?.stockItemId || item?._id || item?.id;
    const quantity = Number(item?.quantity || item?.qty || 0);
    if (!stockItemId || quantity <= 0) {
      return res.status(400).json({ message: 'Each item needs stockItemId (or _id) and positive quantity' });
    }

    const stockItem = await Stock.findById(stockItemId);
    if (!stockItem) {
      // Allow virtual item: reserve without stock deduction but include in response
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const lineTotal = unitPrice * quantity;
      totalAmount += lineTotal;
      reservations.push({
        stockItemId,
        name: item.name || item.productName || 'Item',
        sku: item.sku || '',
        quantityReserved: quantity,
        fromRegular: 0,
        fromBuffer: 0,
        unitPrice,
        lineTotal,
        stockFound: false,
      });
      continue;
    }

    const availableBuffer = Math.max((stockItem.bufferStock || 0) - (stockItem.reservedBuffer || 0), 0);
    const totalAvailable = (stockItem.quantity || 0) + availableBuffer;
    if (totalAvailable < quantity) {
      return res.status(400).json({
        message: `Insufficient quantity for ${stockItem.name}. Available: ${totalAvailable}, Requested: ${quantity}`
      });
    }

    // Allocate from regular stock first, then buffer (and mark reservedBuffer)
    const fromRegular = Math.min(stockItem.quantity, quantity);
    stockItem.quantity -= fromRegular;
    let remaining = quantity - fromRegular;
    let fromBuffer = 0;
    if (remaining > 0) {
      fromBuffer = remaining;
      stockItem.bufferStock = Math.max(stockItem.bufferStock - remaining, 0);
      stockItem.reservedBuffer = (stockItem.reservedBuffer || 0) + remaining;
      remaining = 0;
    }

    await stockItem.save();

    const lineTotal = (stockItem.price || 0) * quantity;
    totalAmount += lineTotal;
    reservations.push({
      stockItemId: stockItem._id,
      name: stockItem.name,
      sku: stockItem.sku,
      quantityReserved: quantity,
      fromRegular,
      fromBuffer,
      unitPrice: stockItem.price || 0,
      lineTotal,
    });
  }

  res.json({
    success: true,
    message: 'Stock reserved for followup',
    totalAmount,
    reservations,
  });
});

// Simulate reservation without DB changes
const simulateReserveForFollowup = asyncHandler(async (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided to reserve' });
  }
  const preview = [];
  let totalAmount = 0;

  for (const item of items) {
    const stockItemId = item?.stockItemId || item?._id || item?.id;
    const quantity = Number(item?.quantity || item?.qty || 0);
    if (!stockItemId || quantity <= 0) {
      return res.status(400).json({ message: 'Each item needs stockItemId (or _id) and positive quantity' });
    }
    const stockItem = await Stock.findById(stockItemId);
    if (!stockItem) {
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const lineTotal = unitPrice * quantity;
      totalAmount += lineTotal;
      preview.push({
        stockItemId,
        name: item.name || item.productName || 'Item',
        sku: item.sku || '',
        quantityRequested: quantity,
        fromRegular: 0,
        fromBuffer: 0,
        unitPrice,
        lineTotal,
        stockFound: false,
      });
      continue;
    }
    const availableBuffer = Math.max((stockItem.bufferStock || 0) - (stockItem.reservedBuffer || 0), 0);
    const totalAvailable = (stockItem.quantity || 0) + availableBuffer;
    if (totalAvailable < quantity) {
      return res.status(400).json({
        message: `Insufficient quantity for ${stockItem.name}. Available: ${totalAvailable}, Requested: ${quantity}`
      });
    }
    const fromRegular = Math.min(stockItem.quantity, quantity);
    const fromBuffer = Math.max(quantity - fromRegular, 0);
    const lineTotal = (stockItem.price || 0) * quantity;
    totalAmount += lineTotal;
    preview.push({
      stockItemId: stockItem._id,
      name: stockItem.name,
      sku: stockItem.sku,
      quantityRequested: quantity,
      fromRegular,
      fromBuffer,
      unitPrice: stockItem.price || 0,
      lineTotal,
    });
  }

  res.json({
    success: true,
    message: 'Reservation preview',
    totalAmount,
    reservations: preview,
  });
});

// Fulfill an order associated with a followup (placeholder)
const fulfillOrder = asyncHandler(async (_req, res) => {
  res.status(501).json({ message: 'fulfillOrder not implemented' });
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByCustomerId,
  getOrderStats,
  reserveForFollowup,
  simulateReserveForFollowup,
  fulfillOrder
};
