require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db.js');
const User = require('../models/user.model.js');

async function seedSocialMedia() {
  try {
    await connectDB();

    console.log('Searching for social media user...');
    let sm = await User.findOne({ email: 'socialmedia@gmail.com' });

    if (sm) {
      console.log('Found existing user socialmedia@gmail.com. Resetting password...');
      sm.password = 'Password123!';
      await sm.save();
      console.log('Password reset successfully to: Password123!');
    } else {
      console.log('User socialmedia@gmail.com not found. Creating a new one...');
      sm = new User({
        username: 'socialmedia',
        email: 'socialmedia@gmail.com',
        password: 'Password123!',
        role: 'SocialmediaManager',
        status: 'active',
        fullName: 'Social Media Manager'
      });
      await sm.save();
      console.log('Created new Social Media Manager:');
      console.log('  email: socialmedia@gmail.com');
      console.log('  password: Password123!');
    }

    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed/find social media user:', err);
    try { await disconnectDB(); } catch(e){}
    process.exit(1);
  }
}

if (require.main === module) {
  seedSocialMedia();
}
