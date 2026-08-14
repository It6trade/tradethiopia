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

// Test function to check commission data
const checkCommissionData = async () => {
  try {
    await connectDB();
    
    // Get all sales records with commission data
    const salesWithCommission = await SalesCustomer.find({
      'commission.netCommission': { $exists: true }
    }).limit(10);
    
    console.log(`Found ${salesWithCommission.length} sales records with commission data:`);
    
    salesWithCommission.forEach((sale, index) => {
      console.log(`\nSale ${index + 1}:`);
      console.log(`  ID: ${sale._id}`);
      console.log(`  Customer: ${sale.customerName}`);
      console.log(`  Course Price: ${sale.coursePrice}`);
      console.log(`  Commission:`, sale.commission);
      console.log(`  Commission Type:`, typeof sale.commission);
      if (sale.commission && typeof sale.commission === 'object') {
        console.log(`  Gross Commission: ${sale.commission.grossCommission}`);
        console.log(`  Commission Tax: ${sale.commission.commissionTax}`);
        console.log(`  Net Commission: ${sale.commission.netCommission}`);
      }
    });
    
    // Get sales records without commission data
    const salesWithoutCommission = await SalesCustomer.find({
      $or: [
        { commission: { $exists: false } },
        { commission: null },
        { 'commission.netCommission': { $exists: false } }
      ]
    }).limit(5);
    
    console.log(`\nFound ${salesWithoutCommission.length} sales records WITHOUT commission data:`);
    
    salesWithoutCommission.forEach((sale, index) => {
      console.log(`\nSale ${index + 1}:`);
      console.log(`  ID: ${sale._id}`);
      console.log(`  Customer: ${sale.customerName}`);
      console.log(`  Course Price: ${sale.coursePrice}`);
      console.log(`  Commission:`, sale.commission);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCommissionData();