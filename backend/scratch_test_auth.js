async function run() {
  const loginUrl = 'http://127.0.0.1:5000/api/users/login';
  const loginBody = JSON.stringify({ email: 'socialmedia@gmail.com', password: 'password123' });
  console.log('1. Attempting login...');
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: loginBody
    });
    console.log('Login response status:', loginRes.status);
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('Login succeeded! Token retrieved:', token.substring(0, 15) + '...');

    const trackerUrl = 'http://127.0.0.1:5000/api/content-tracker';
    console.log('2. Requesting protected route /api/content-tracker...');
    const trackerRes = await fetch(trackerUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Tracker response status:', trackerRes.status);
    const trackerData = await trackerRes.json();
    console.log('Tracker response data:', JSON.stringify(trackerData, null, 2));

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run();
