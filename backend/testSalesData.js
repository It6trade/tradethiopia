const mongoose = require('mongoose');
require('dotenv').config();

// Import the SalesCustomer model
const SalesCustomer = require('./sales/models/SalesCustomer');

// Connect to database
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test function to check sales data
const checkSalesData = async () => {
  try {
    await connectDB();
    
    // Get all sales records
    const allSales = await SalesCustomer.find({}).limit(10);
    console.log(`Found ${allSales.length} sales records:`);
    console.log(JSON.stringify(allSales, null, 2));
    
    // Get sales records with different followupStatus values
    const statusCounts = await SalesCustomer.aggregate([
      {
        $group: {
          _id: "$followupStatus",
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\nSales records by followupStatus:');
    console.log(statusCounts);
    
    // Get sales records for a specific agent (if any exist)
    if (allSales.length > 0) {
      const agentId = allSales[0].agentId;
      console.log(`\nChecking sales for agentId: ${agentId}`);
      
      const agentSales = await SalesCustomer.find({ agentId: agentId });
      console.log(`Found ${agentSales.length} sales records for this agent`);
      
      const agentStatusCounts = await SalesCustomer.aggregate([
        { $match: { agentId: agentId } },
        {
          $group: {
            _id: "$followupStatus",
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('Agent sales records by followupStatus:');
      console.log(agentStatusCounts);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSalesData();