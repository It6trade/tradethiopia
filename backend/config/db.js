const mongoose = require('mongoose');
const Package = require('../models/Package');
const Conversation = require('../models/Conversation');

let isConnected = false; // Track connection status

const dropLegacyPackageIndex = async () => {
  if (!mongoose.connection.readyState) return;
  try {
    const collection = mongoose.connection.collection('packages');
    const exists = await collection.indexExists('packageNumber_1');
    if (exists) {
      await collection.dropIndex('packageNumber_1');
      console.log('Dropped legacy packages packageNumber_1 index');
    }
  } catch (error) {
    if (error.codeName && error.codeName !== 'IndexNotFound') {
      console.error('Failed to drop legacy package index:', error);
    }
  }
};

const ensurePackageIndexSetup = async () => {
  try {
    await dropLegacyPackageIndex();
    await Package.init(); // ensure mongoose has created declared indexes
  } catch (error) {
    console.error('Package index setup error:', error);
  }
};

const repairConversationIndexes = async () => {
  if (!mongoose.connection.readyState) return;

  try {
    const collection = mongoose.connection.collection('conversations');

    await collection.updateMany(
      {
        $or: [
          { directKey: null },
          { departmentKey: null },
          { managedKey: null },
        ],
      },
      {
        $unset: {
          directKey: '',
          departmentKey: '',
          managedKey: '',
        },
      }
    );

    const indexNames = await collection.indexes().then((indexes) => indexes.map((index) => index.name));
    for (const legacyIndex of ['directKey_1', 'departmentKey_1', 'managedKey_1']) {
      if (indexNames.includes(legacyIndex)) {
        await collection.dropIndex(legacyIndex);
        console.log(`Dropped legacy conversations ${legacyIndex} index`);
      }
    }

    await Conversation.syncIndexes();
  } catch (error) {
    console.error('Conversation index repair error:', error);
  }
};

const connectDB = async () => {
    console.log('Attempting to connect to database...');
    console.log('Environment:', {
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGO_URI
    });
    
    // If already connected, return immediately
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }
    
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
        const error = new Error('MONGO_URI is not defined in environment variables');
        console.error('Database connection error:', error.message);
        throw error;
    }
    
    try {
        // Check if we're in a Vercel environment
        const isVercel = !!process.env.VERCEL;
        
        if (isVercel) {
            console.log('Running in Vercel environment');
        }
        
        console.log('Connecting to MongoDB...');
        // Connection options to handle network issues
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 to avoid DNS issues
            maxPoolSize: 10 // Maintain up to 10 socket connections
        });
        isConnected = true;
        await ensurePackageIndexSetup();
        await repairConversationIndexes();
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error){
        console.log(`Database failed to connect: ${error.message}`);
        console.error('Connection error details:', error);
        // Don't exit in serverless environment
        throw error;
    }
}

// Add a function to disconnect from database (useful for Vercel)
const disconnectDB = async () => {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected');
    }
}

module.exports = { connectDB, disconnectDB };
