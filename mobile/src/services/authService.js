import { appConfig } from '../config/appConfig';

export const login = async ({ email, password }) => {
  const response = await fetch(`${appConfig.apiUrl}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to sign in. Please check your credentials.');
  }

  return {
    token: data.token,
    user: data.user,
    signedInAt: new Date().toISOString()
  };
};
