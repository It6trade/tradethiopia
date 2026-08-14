const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradethiopia');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ email: 'socialmedia@gmail.com' });
  console.log('User details:', user ? user.toObject() : 'Not found');
  process.exit(0);
}

run().catch(console.error);
