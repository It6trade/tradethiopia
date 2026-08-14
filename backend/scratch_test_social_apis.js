// Using native global fetch in Node.js v20
async function run() {
  const loginUrl = 'http://127.0.0.1:5000/api/users/login';
  const loginBody = JSON.stringify({ email: 'socialmedia@gmail.com', password: 'password123' });
  console.log('1. Logging in...');
  
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: loginBody
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      console.error('Login failed:', loginData);
      return;
    }
    const token = loginData.token;
    console.log('Login succeeded! Token:', token.substring(0, 15) + '...');

    const actualsUrl = 'http://127.0.0.1:5000/api/social-actuals';
    console.log('2. Fetching /api/social-actuals...');
    const actualsRes = await fetch(actualsUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Actuals response status:', actualsRes.status);
    const actualsData = await actualsRes.json();
    console.log('Actuals data length:', Array.isArray(actualsData) ? actualsData.length : 'not an array');

    const kpisUrl = 'http://127.0.0.1:5000/api/social-weekly-kpis';
    console.log('3. Fetching /api/social-weekly-kpis...');
    const kpisRes = await fetch(kpisUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('KPIs response status:', kpisRes.status);
    const kpisData = await kpisRes.json();
    console.log('KPIs data length:', Array.isArray(kpisData) ? kpisData.length : 'not an array');

  } catch (error) {
    console.error('Error occurred:', error);
  }
}
run();
