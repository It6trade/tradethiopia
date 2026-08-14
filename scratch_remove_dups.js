const mongoose = require('mongoose');
const AssetCategory = require('./backend/models/AssetCategory');
require('dotenv').config({ path: './backend/.env' });

async function removeDuplicates() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB.");

  const categories = await AssetCategory.find({});
  const seen = new Set();
  const duplicates = [];

  for (const cat of categories) {
    const key = cat.name.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.push(cat._id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${duplicates.length} duplicate categories.`);
  if (duplicates.length > 0) {
    await AssetCategory.deleteMany({ _id: { $in: duplicates } });
    console.log("Deleted duplicates.");
  }
  
  // also verify if any index on name exists and if we should create one.
  mongoose.connection.close();
}

removeDuplicates().catch(console.error);
