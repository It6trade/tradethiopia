const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const { getConversationRoom, getUserRoom, setSocketServer } = require('./services/chatSocketService');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB, disconnectDB } = require('./config/db.js');
const userRoutes = require('./routes/user.route.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const messageRoutes = require('./routes/messageRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const quizRoutes = require('./routes/quiz.route.js');
const customerFollowUpRoutes = require('./routes/customerFollowRoutes.js');
const noteRoutes = require('./routes/noteRoutes.js');
const ResourceRoute = require('./routes/ResourceRoutes.js');
const FollowUpRoutes = require('./routes/followupRoutes.js');
const CategoryRoutes = require('./routes/categoryRoutes.js');
const documentRoutes = require('./routes/documentRoutes.js');
const assetCategoryRoutes = require('./routes/assetCategory.js');
const assetRoutes = require('./routes/asset.js');
const infouploadRoutes = require('./routes/infoupload.route.js');
const buyerRoutes = require('./routes/buyerRoutes.js');
const sellerRoutes = require('./routes/sellerRoutes.js');
const b2bMatchingRoutes = require('./routes/b2bMatchingRoutes.js');
const savedMatchRoutes = require('./routes/savedMatchRoutes.js');
const trainingFollowupRoutes = require('./routes/trainingFollowupRoutes.js');
const ensraFollowupRoutes = require('./routes/ensraFollowupRoutes.js');
const salesCustomerRoutes = require('./routes/salesCustomerRoutes.js');
const packageRoutes = require('./routes/packageRoutes.js');
const packageSalesRoutes = require('./routes/packageSalesRoutes.js');
const serviceTypeRoutes = require('./routes/serviceTypeRoutes.js');
const metricRoutes = require('./routes/metricRoutes.js');
const tradexFollowupRoutes = require('./routes/tradexFollowupRoutes.js');
const stockRoutes = require('./routes/stockRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const orderCustomerRoutes = require('./routes/orderCustomerRoutes.js');
const salesManagerRoutes = require('./routes/salesManagerRoutes.js');
const salesTargetRoutes = require('./routes/salesTargetRoutes.js');
const taskRoutes = require('./routes/taskRoutes.js');
const calendarRoutes = require('./routes/calendarRoutes.js');
const courseRoutes = require('./routes/courseRoutes.js');
const productFollowupRoutes = require('./routes/productFollowupRoutes.js');
const itRoutes = require('./routes/itRoutes.js');
const inventoryRoutes = require('./routes/inventoryRoutes.js');
const demandRoutes = require('./routes/demandRoutes.js');
const payrollRoutes = require('./routes/payrollRoutes.js'); // Add this line
const paymentRoutes = require('./routes/paymentRoutes.js');
const awardRoutes = require('./routes/awardRoutes.js');
const contentTrackerRoutes = require('./routes/contentTrackerRoutes');

const consultancyRoutes = require('./routes/consultancyRoutes.js');

const costRoutes = require('./routes/costRoutes.js');
const requestRoutes = require('./routes/requestRoutes.js');
const actionItemRoutes = require('./routes/actionItemRoutes.js');
const commissionApprovalRoutes = require('./routes/commissionApprovalRoutes.js');
const salesOnboardingCourseRoutes = require('./routes/salesOnboardingCourseRoutes.js');
const socialAccountCredentialRoutes = require('./routes/socialAccountCredentialRoutes.js');
// Load environment variables

// Initialize Express app
const app = express();

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
setSocketServer(io);

// Store connected users
const connectedUsers = new Map();
const onlineUsers = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Register user with their ID
  socket.on('registerUser', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(getUserRoom(userId));
    onlineUsers.add(String(userId));
    io.emit('chat:presence', { userId: String(userId), isOnline: true });
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('joinConversation', (conversationId) => {
    if (!conversationId) return;
    socket.join(getConversationRoom(conversationId));
  });

  socket.on('leaveConversation', (conversationId) => {
    if (!conversationId) return;
    socket.leave(getConversationRoom(conversationId));
  });

  socket.on('chat:typing', ({ conversationId, userId, isTyping }) => {
    if (!conversationId || !userId) return;
    socket.to(getConversationRoom(conversationId)).emit('chat:typing', {
      conversationId: String(conversationId),
      userId: String(userId),
      isTyping: !!isTyping,
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from connected users map
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        onlineUsers.delete(String(userId));
        io.emit('chat:presence', { userId: String(userId), isOnline: false });
        break;
      }
    }
  });
});

// Make io available to other modules
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.tradeethiopian.com',
  'https://tradeethiopian.com',
  'https://main.d21vr1wgzmn1c2.amplifyapp.com',
  'https://tradethiopia-pied.vercel.app',
  'https://tradethiopia.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    console.log('CORS check - Origin:', origin);
    console.log('Allowed origins:', allowedOrigins);

    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  credentials: true
};


// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
// Removed static uploads directory since we're using Appwrite for file storage
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check middleware
app.use('/api/health', async (req, res) => {
  try {
    // Check if database is connected
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      success: true,
      status: 'OK',
      database: dbStatus,
      vercel: !!process.env.VERCEL,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Add a middleware to check database connection
app.use(async (req, res, next) => {
  try {
    // Ensure database is connected
    if (!mongoose.connection.readyState) {
      console.log('Attempting to connect to database...');
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection error', 
      error: error.message,
      vercel: !!process.env.VERCEL
    });
  }
});

// Define API routes
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend server is running successfully!', 
    status: 'OK',
    timestamp: new Date(),
    service: 'Employee Portal Backend API',
    version: '1.0.0',
    vercel: !!process.env.VERCEL
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date(), 
    service: 'Employee Portal Backend',
    version: '1.0.0',
    vercel: !!process.env.VERCEL
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is working correctly!', 
    status: 'OK',
    timestamp: new Date(),
    vercel: !!process.env.VERCEL
  });
});

app.get('/api/test-completed-sales', async (req, res) => {
  try {
    const SalesCustomer = require('./models/SalesCustomer');
    const completedCount = await SalesCustomer.countDocuments({ followupStatus: 'Completed' });
    const totalCount = await SalesCustomer.countDocuments();
    
    res.json({ 
      success: true,
      completedCount,
      totalCount,
      message: `Found ${completedCount} completed sales out of ${totalCount} total sales`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Test failed',
      error: error.message 
    });
  }
});

// API Routes

app.use("/api/users", userRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/followup', customerFollowUpRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/resources', ResourceRoute);
app.use("/api/followups", FollowUpRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assetcategories', assetCategoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/categories', CategoryRoutes);
app.use('/api', infouploadRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/b2b', b2bMatchingRoutes);
app.use('/api/saved-matches', savedMatchRoutes);
app.use('/api/training-followups', trainingFollowupRoutes);
app.use('/api/ensra-followups', ensraFollowupRoutes);
app.use('/api/consultancies', consultancyRoutes);
app.use('/api/salescustomers', salesCustomerRoutes);
app.use('/api/sales-customers', salesCustomerRoutes);
app.use('/api/packages/sales', packageSalesRoutes);
app.use('/api/package-sales', packageSalesRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/service-types', serviceTypeRoutes);
app.use('/api', metricRoutes);
app.use('/api/tradex-followups', tradexFollowupRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-customers', orderCustomerRoutes);
app.use('/api/sales-manager', salesManagerRoutes);
app.use('/api/sales-targets', salesTargetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/external-courses', require('./routes/externalCourseRoutes'));
app.use('/api/internal-courses', require('./routes/internalCourseRoutes'));
app.use('/api/product-followups', productFollowupRoutes);
app.use('/api/it', itRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/finance-erp', require('./routes/financeErpRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/costs', costRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/payroll', payrollRoutes); // Add this line
app.use('/api/payments', paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/social-requests', requestRoutes);
app.use('/api/social-account-credentials', socialAccountCredentialRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/content-tracker', contentTrackerRoutes);
// Awards
app.use('/api/awards', awardRoutes);

// Commission Approval
app.use('/api/commissions', commissionApprovalRoutes);
app.use('/api/sales-onboarding-course', salesOnboardingCourseRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    vercel: !!process.env.VERCEL
  });
});

// For Vercel serverless functions, export the app directly
module.exports = app;

// Connect to MongoDB and start the server only when running locally
if (require.main === module) {
    const PORT = Number(process.env.PORT) || 5000;
    const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces by default
    
    // Connect to database and start server
    connectDB()
      .then(() => {
        const server = app.listen(PORT, HOST, () => {
          console.log(`Server running on http://${HOST}:${PORT}`);
        });
        
        // Initialize Socket.IO with the HTTP server
        const io = app.get('io');
        io.attach(server, {
          cors: {
            origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
            credentials: true
          }
        });
        
        // Handle EADDRINUSE error gracefully
        server.on('error', (e) => {
          if (e.code === 'EADDRINUSE') {
            const fallbackPort = PORT + 1;
            console.log(`Port ${PORT} is busy, trying ${fallbackPort}`);
            setTimeout(() => {
              server.close();
              const fallbackServer = app.listen(fallbackPort, HOST, () => {
                console.log(`Server running on http://${HOST}:${fallbackPort}`);
              });
              fallbackServer.on('error', (fallbackError) => {
                console.error(`Failed to start fallback server on ${fallbackPort}:`, fallbackError);
              });
            }, 1000);
          }
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
          console.log('Shutting down gracefully...');
          await disconnectDB();
          process.exit(0);
        });
      })
      .catch((error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
      });
}
