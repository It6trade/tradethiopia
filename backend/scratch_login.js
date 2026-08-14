async function run() {
  const url = 'http://127.0.0.1:5000/api/users/login';
  const body = JSON.stringify({ email: 'socialmedia@gmail.com', password: 'password123' });
  console.log('Sending login request to:', url);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run();
