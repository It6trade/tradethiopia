const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/users/login', {
      email: 'socialmedia@gmail.com',
      password: 'Password123!'
    });
    console.log('Login Response:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Login Error:', error.response?.data || error.message);
  }
}

testLogin();
