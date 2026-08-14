const User = require("../models/user.model.js");
const Followup = require("../models/Followup.js");
const Order = require("../models/Order");
const OrderCustomer = require("../models/OrderCustomer");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// @desc    Get analytics data for dashboard
// @route   GET /api/followups/analytics
// @access  Public
const LOCAL_COUNTRY = "ethiopia";
const parseScopeLabel = (scope = "") => {
  const cleanedScope = (scope || "").toString().trim().toLowerCase();
  if (!cleanedScope) return "";
  if (cleanedScope.includes("local")) return "Local";
  if (cleanedScope.includes("international") || cleanedScope.includes("intl")) return "International";
  return "";
};
const normalizeScope = (scope = "", country = "") => {
  const normalizedFromScope = parseScopeLabel(scope);
  if (normalizedFromScope) return normalizedFromScope;
  const countryValue = (country || "").toString().trim().toLowerCase();
  if (countryValue === LOCAL_COUNTRY || countryValue.includes("ethiopia")) return "Local";
  return "International";
};

const getFollowupAnalytics = async (req, res) => {
  try {
    // Get package distribution data
    const packageDistribution = await Followup.aggregate([
      {
        $group: {
          _id: "$packageType",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          _id: 0,
          package: "$_id",
          count: 1
        }
      }
    ]);

    // Get industry distribution data
    const industryData = await Followup.aggregate([
      {
        $group: {
          _id: "$industry",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10 // Limit to top 10 industries
      },
      {
        $project: {
          _id: 0,
          industry: "$_id",
          count: 1
        }
      }
    ]);

    res.json({
      packageDistribution,
      industryData
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating analytics", error: error.message });
  }
};

// @desc    Get report for customer service users
// @route   GET /api/followups/report
// @access  Public
const getCustomerReport = async (req, res) => {
  try {
    // Get all followups, not just recent ones
    const followups = await Followup.find().lean();

    // Get all users (creators)
    const users = await User.find().lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    // Supervisor view: get all customer service users and show their points and rating from user model
    const creatorPerformance = users
      .filter(u => u.role === "customerservice")
      .map(u => ({
        username: u.username,
        points: typeof u.points === "number" ? u.points : 0,
        rating: typeof u.rating === "number" ? u.rating : 0,
      }))
      .sort((a, b) => b.points - a.points);

    // Process all followups to create the report
    const report = followups.map(fu => {
      let creator = null;
      let agentInfo = null;
      const creatorId = fu.createdBy ? fu.createdBy.toString() : null;
      if (creatorId && userMap[creatorId]) {
        const u = userMap[creatorId];
        if (u.role === "customerservice") {
          creator = {
            username: u.username,
            points: typeof u.points === "number" ? u.points : 0,
            rating: typeof u.rating === "number" ? u.rating : 0,
          };
        }
      } else if (creatorId) {
        const u = users.find(u => u.username === creatorId && u.role === "customerservice");
        if (u) {
          creator = {
            username: u.username,
            points: typeof u.points === "number" ? u.points : 0,
            rating: typeof u.rating === "number" ? u.rating : 0,
          };
        }
      }
      // Resolve agent by agentId if present
      if (fu.agentId && userMap[fu.agentId?.toString?.()]) {
        const a = userMap[fu.agentId.toString()];
        agentInfo = {
          username: a.username,
          agentId: a._id?.toString?.(),
          rating: typeof a.rating === "number" ? a.rating : 0,
        };
      }
      
      let dailyProgress = 0;
      if (fu.lastCalled) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        if (fu.lastCalled >= oneWeekAgo) {
          dailyProgress = Math.floor(Math.random() * 10 + 1);
        }
      }
      
      return {
        clientName: fu.clientName,
        companyName: fu.companyName || fu.company || "",
        phoneNumber: fu.phoneNumber || fu.phone || "",
        email: fu.email || "",
        packageType: fu.packageType || fu.package || fu.packageNumber || "",
        service: fu.service || fu.serviceProvided || "",
        notes: fu.notes && fu.notes.length > 0 ? fu.notes : [],
        lastCalled: fu.lastCalled ? fu.lastCalled : null,
        creator,
        agentName: agentInfo?.username || fu.agentName || fu.assignedTo || null,
        agentId: agentInfo?.agentId || fu.agentId || null,
        call_count: fu.call_count || fu.callAttempts || 0,
        message_count: fu.message_count || fu.messageAttempts || 0,
        email_count: fu.email_count || fu.emailAttempts || 0,
        followupAttempts: fu.followupAttempts || 0,
        updateAttempts: fu.updateAttempts || 0,
        trainingImported: fu.trainingImported || false,
        b2bImported: fu.b2bImported || false,
        materialStatusUpdated: fu.materialStatusUpdated || false,
        progressUpdated: fu.progressUpdated || false,
        serviceUpdated: fu.serviceUpdated || false,
        packageStatusUpdated: fu.packageStatusUpdated || false,
        dailyProgress: dailyProgress,
        performanceRating: creator && creator.rating ? creator.rating : 0
      };
    });

    res.json({ report, creatorPerformance });
  } catch (error) {
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
};

const getFollowupById = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowups = async (req, res) => {
  try {
    // Populate the agentId field with user information
    const followups = await Followup.find().populate('agentId', 'username name email');
    res.status(200).json(followups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFollowup = async (req, res) => {
  try {
    const followup = new Followup(req.body);
    const savedFollowup = await followup.save();
    res.status(201).json(savedFollowup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFollowup = async (req, res) => {
  try {
    const followup = await Followup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFollowup = async (req, res) => {
  try {
    const followup = await Followup.findByIdAndDelete(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendBulkEmail = async (req, res) => {
  try {
    const { ids = [], subject, body, sender = "System", senderEmail } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No follow-up ids provided" });
    }
    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    const followups = await Followup.find({ _id: { $in: ids } });

    const emails = followups.map((f) => f.email).filter(Boolean);
    if (emails.length === 0) {
      return res.status(400).json({ message: "No valid email addresses found" });
    }

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    });

    const info = await transporter.sendMail({
      from: senderEmail || process.env.SMTP_USER || 'no-reply@example.com',
      to: emails.join(","),
      subject: subject,
      text: body,
      html: `<p>${body}</p>`
    });

    res.json({ success: true, message: "Bulk email sent", messageId: info.messageId });
  } catch (error) {
    console.error("Bulk email error:", error);
    res.status(500).json({ message: "Failed to send bulk email", error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json(followup.messages || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, sender } = req.body;
    const followup = await Followup.findById(id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    const newMessage = {
      sender: sender || "Agent",
      body: text,
      createdAt: new Date(),
    };
    followup.messages = followup.messages || [];
    followup.messages.push(newMessage);
    await followup.save();
    res.json(followup.messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    const newNote = {
      text: req.body.text,
      createdAt: new Date(),
    };
    followup.notes = followup.notes || [];
    followup.notes.push(newNote);
    await followup.save();
    res.status(200).json(followup.notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const incrementAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const followup = await Followup.findById(id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });

    if (type === 'call') followup.call_count = (followup.call_count || 0) + 1;
    if (type === 'message') followup.message_count = (followup.message_count || 0) + 1;
    if (type === 'email') followup.email_count = (followup.email_count || 0) + 1;

    await followup.save();
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCommunicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, note } = req.body;
    const followup = await Followup.findById(id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });

    followup.communicationLogs = followup.communicationLogs || [];
    followup.communicationLogs.push({
      channel,
      note,
      createdAt: new Date(),
    });

    await followup.save();
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const followup = await Followup.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLastCalled = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    followup.lastCalled = new Date();
    await followup.save();
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateServices = async (req, res) => {
  try {
    const { serviceProvided, serviceNotProvided } = req.body;
    const followup = await Followup.findByIdAndUpdate(
      req.params.id,
      { serviceProvided, serviceNotProvided },
      { new: true }
    );
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processOrder = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });

    const { items = [], paymentType, paymentAmount, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided for order" });
    }

    // Ensure we have an OrderCustomer record
    let orderCustomerId = followup.customerId || null;
    if (!orderCustomerId) {
      const email = followup.email || '';
      const phone = followup.phoneNumber || followup.phone || '';
      let oc = null;
      if (email) oc = await OrderCustomer.findOne({ email });
      if (!oc && phone) oc = await OrderCustomer.findOne({ phone });
      if (!oc) {
        oc = await OrderCustomer.create({
          name: followup.clientName || followup.companyName || 'Follow-up Customer',
          email,
          phone,
        });
      }
      orderCustomerId = oc._id;
    }

    // Build order items and total
    let totalAmount = 0;
    const orderItems = items.map((i) => {
      const stockItemId = i.stockItemId || i._id || i.id;
      const unitPrice = Number(i.unitPrice || i.price || 0);
      const qty = Number(i.quantity || i.qty || 0);
      if (!stockItemId || qty <= 0) {
        throw new Error('Each item must include stockItemId/_id and positive quantity');
      }
      const lineTotal = unitPrice * qty;
      totalAmount += lineTotal;
      return {
        stockItemId,
        name: i.name || i.productName || "Item",
        sku: i.sku || "",
        quantity: qty,
        unitPrice,
        totalPrice: lineTotal,
      };
    });

    const order = await Order.create({
      customerId: orderCustomerId,
      customerName: followup.clientName || followup.companyName || "Follow-up Customer",
      customerEmail: followup.email || "",
      customerPhone: followup.phoneNumber || followup.phone || "",
      followupId: followup._id,
      items: orderItems,
      totalAmount,
      paymentType: paymentType || "Unspecified",
      paymentAmount: paymentAmount || 0,
      notes: notes || followup.notes || "",
      salesAgent: {
        id: req.user?.id || null,
        name: req.user?.username || req.user?.name || "",
        email: req.user?.email || "",
      },
      createdBy: req.user?.id || null,
      status: "Confirmed",
      confirmedAt: new Date(),
    });

    res.json({ success: true, message: "Order processed for follow-up", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editCustomer = async (req, res) => {
  try {
    const followup = await Followup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const importB2BCustomers = async (req, res) => {
  try {
    const { customerType, customerId, agentId: incomingAgentId } = req.body;
    
    const model = customerType === 'buyer' 
      ? require('../models/Buyer') 
      : require('../models/Seller');
    
    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    // Find the B2B customer (buyer or seller)
    const customerData = await model.findById(customerId);
    
    if (!customerData) {
      return res.status(404).json({ message: "B2B customer not found" });
    }
    
    // Check if customer already exists in follow-up system
    const existingFollowup = await Followup.findOne({ email: customerData.email });
    
    if (existingFollowup) {
      return res.status(400).json({ 
        message: "Customer already exists in follow-up system",
        followupId: existingFollowup._id
      });
    }
    
    const resolvedAgentId = incomingAgentId || customerData.agentId;

    if (!resolvedAgentId) {
      return res.status(400).json({ message: "agentId is required to import this customer" });
    }

    // Create follow-up record from B2B customer data
    const followupData = {
      clientName: customerData.contactPerson,
      companyName: customerData.companyName,
      phoneNumber: customerData.phoneNumber,
      email: customerData.email,
      packageType: customerData.packageType || "Not specified",
      country: customerData.country || "",
      packageScope: normalizeScope(customerData.packageScope, customerData.country),
      customerType: customerType === 'buyer' ? 'buyer' : 'seller',
      service: `${customerType === 'buyer' ? 'Buying' : 'Selling'} ${customerData.industry} products`,
      serviceProvided: "Initial contact made",
      serviceNotProvided: "Ongoing relationship management",
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      createdBy: req.body.createdBy || null,
      agentId: resolvedAgentId,
    };
    
    const followup = new Followup(followupData);
    const savedFollowup = await followup.save();
    
    res.status(201).json({
      message: "B2B customer imported successfully",
      followup: savedFollowup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get follow-up stats summary
// @route   GET /api/followups/stats
// @access  Public
const getFollowupStats = async (req, res) => {
  try {
    const followups = await Followup.find();
    const now = new Date();
    const stats = {
      total: followups.length,
      completed: 0,
      pending: 0,
      active: 0,
      overdue: 0,
      callAttempts: 0,
      messageAttempts: 0,
      emailAttempts: 0,
    };

    followups.forEach((f) => {
      const status = (f.status || "").toLowerCase();
      if (status === "completed") {
        stats.completed += 1;
      } else if (status === "pending") {
        stats.pending += 1;
        if (f.dueDate && new Date(f.dueDate) < now) {
          stats.overdue += 1;
        }
      }
      stats.callAttempts += f.call_count || f.callAttempts || 0;
      stats.messageAttempts += f.message_count || f.messageAttempts || 0;
      stats.emailAttempts += f.email_count || f.emailAttempts || 0;
    });

    stats.active = stats.total - stats.completed;
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching follow-up stats", error: error.message });
  }
};

// @desc    Get all B2B customers that are not yet in follow-up system
// @route   GET /api/followups/b2b-pending
// @access  Public
const getPendingB2BCustomers = async (req, res) => {
  try {
    // Import required models
    const buyerModel = require('../models/Buyer');
    const sellerModel = require('../models/Seller');
    
    // Get all follow-up customers' emails
    const followupCustomers = await Followup.find({}, 'email');
    const followupEmails = followupCustomers.map(customer => customer.email);
    
    // Get buyers and sellers not in follow-up system
    const buyers = await buyerModel.find({ 
      email: { $nin: followupEmails } 
    });
    
    const sellers = await sellerModel.find({ 
      email: { $nin: followupEmails } 
    });
    
    // Format the data for the frontend
    const pendingCustomers = [
      ...buyers.map(buyer => ({
        _id: buyer._id,
        clientName: buyer.contactPerson,
        companyName: buyer.companyName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        type: 'buyer',
        industry: buyer.industry,
        country: buyer.country,
        packageType: buyer.packageType || "Not specified",
        packageScope: normalizeScope(buyer.packageScope, buyer.country)
      })),
      ...sellers.map(seller => ({
        _id: seller._id,
        clientName: seller.contactPerson,
        companyName: seller.companyName,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        type: 'seller',
        industry: seller.industry,
        country: seller.country,
        packageType: seller.packageType || "Not specified",
        packageScope: normalizeScope(seller.packageScope, seller.country)
      }))
    ];
    
    res.status(200).json(pendingCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFollowupAnalytics,
  getCustomerReport,
  createFollowup,
  getFollowups,
  getFollowupById,
  updateFollowup,
  deleteFollowup,
  sendBulkEmail,
  getMessages,
  addMessage,
  addNote,
  incrementAttempts,
  addCommunicationLog,
  updatePriority,
  updateLastCalled,
  updateServices,
  processOrder,
  editCustomer,
  importB2BCustomers,
  getPendingB2BCustomers,
  getFollowupStats
};
