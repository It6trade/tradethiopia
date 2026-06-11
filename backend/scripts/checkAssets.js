require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db.js');
const Asset = require('../models/Asset.js');

async function checkAssets() {
  try {
    await connectDB();
    console.log('Fetching unique asset categories and groups...');
    
    const categories = await Asset.distinct('category');
    console.log('Categories:', categories);
    
    const assets = await Asset.find({}).limit(10);
    console.log('Sample Assets:');
    assets.forEach(a => {
      console.log(`  - NameTag: ${a.nameTag}, Name: ${a.name}, Category: ${a.category}, Group/Assets: ${a.assets}`);
    });

    await disconnectDB();
  } catch (err) {
    console.error('Error checking assets:', err);
    try { await disconnectDB(); } catch(e){}
  }
}

checkAssets();
