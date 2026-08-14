const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db.js');
const ContentTrackerEntry = require('./models/ContentTrackerEntry');

async function run() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Database connected. Finding content tracker entries...');
    const totalCount = await ContentTrackerEntry.countDocuments({});
    console.log(`Total entries in database: ${totalCount}`);

    const pendingCount = await ContentTrackerEntry.countDocuments({ approved: false });
    console.log(`Pending entries to approve: ${pendingCount}`);

    const result = await ContentTrackerEntry.updateMany(
      { approved: false },
      { $set: { approved: true } }
    );
    
    console.log('Update result:', result);
    console.log('All legacy content tracker entries have been successfully approved.');
    
    await mongoose.disconnect();
    console.log('Database disconnected. Script finished successfully.');
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

run();
