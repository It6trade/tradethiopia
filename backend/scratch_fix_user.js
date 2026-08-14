async function run() {
  const getUrl = 'http://127.0.0.1:5000/api/users';
  console.log('Fetching users from:', getUrl);
  try {
    const response = await fetch(getUrl);
    console.log('Get users response status:', response.status);
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      console.error('Failed to get users list:', result);
      return;
    }

    const user = result.data.find(u => u.email === 'socialmedia@gmail.com');
    if (!user) {
      console.log('socialmedia@gmail.com user not found in the database list.');
      return;
    }

    console.log('Current user details:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      infoStatus: user.infoStatus
    });

    const updateUrl = `http://127.0.0.1:5000/api/users/${user._id}`;
    console.log('Updating user status to active/active at:', updateUrl);
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'active',
        infoStatus: 'active'
      })
    });
    console.log('Update response status:', updateResponse.status);
    const updateResult = await updateResponse.json();
    console.log('Update response data:', JSON.stringify(updateResult, null, 2));

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run();
