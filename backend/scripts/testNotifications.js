const axios = require('axios');

async function testNotifications() {
  try {
    // First, login to get the token
    const loginRes = await axios.post('http://localhost:5000/api/users/login', {
      email: 'socialmedia@gmail.com',
      password: 'Password123!'
    });
    const token = loginRes.data.token;
    console.log('Login successful. Token acquired.');

    // Now, query notifications with the token
    const notificationRes = await axios.get('http://localhost:5000/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Notifications Response status:', notificationRes.status);
    console.log('Notifications Response data:', notificationRes.data);
  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
  }
}

testNotifications();
