require('dotenv').config({ path: 'backend/.env' });
const { connectDB, disconnectDB } = require('./backend/config/db.js');
const User = require('./backend/models/user.model.js');

async function inspectUser() {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'socialmedia@gmail.com' });
    console.log('--- USER IN DB ---');
    console.log(JSON.stringify(user, null, 2));
    await disconnectDB();
  } catch (err) {
    console.error('Inspection failed:', err);
    try { await disconnectDB(); } catch(e){}
  }
}

inspectUser();
