const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load backend-local configuration even when this service is required by a
// test runner or a process started from the repository root. Existing
// deployment environment variables keep priority because override is false.
dotenv.config({
  path: [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
  ],
  override: false,
});

const apiUrl = String(process.env.PUNCHER_API_URL || '').replace(/\/+$/, '');
const timeout = Math.max(1000, Number(process.env.PUNCHER_REQUEST_TIMEOUT_MS) || 15000);

const client = axios.create({ baseURL: apiUrl, timeout });
let cachedToken = '';

const configurationStatus = () => ({
  configured: Boolean(apiUrl && process.env.PUNCHER_API_EMAIL && process.env.PUNCHER_API_PASSWORD),
  apiUrl: apiUrl || null,
});

async function authenticate() {
  if (!configurationStatus().configured) {
    const error = new Error('Puncher API integration is not configured on the server.');
    error.code = 'PUNCHER_NOT_CONFIGURED';
    throw error;
  }

  const { data } = await client.post('/api/auth/login', {
    email: process.env.PUNCHER_API_EMAIL,
    password: process.env.PUNCHER_API_PASSWORD,
  });
  cachedToken = data?.token || '';
  if (!cachedToken) throw new Error('Puncher API login did not return an access token.');
  return cachedToken;
}

async function request(path, options = {}) {
  const execute = async (token) => client.request({
    url: path,
    method: options.method || 'get',
    params: options.params,
    data: options.data,
    headers: { Authorization: `Bearer ${token}` },
  });

  try {
    const response = await execute(cachedToken || await authenticate());
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      cachedToken = '';
      const response = await execute(await authenticate());
      return response.data;
    }
    throw error;
  }
}

function publicError(error) {
  if (error.code === 'PUNCHER_NOT_CONFIGURED') {
    return { status: 503, code: error.code, message: error.message };
  }
  if (error.code === 'ECONNABORTED') {
    return { status: 504, code: 'PUNCHER_TIMEOUT', message: 'The Puncher service did not respond in time.' };
  }
  if (!error.response) {
    return { status: 503, code: 'PUNCHER_UNREACHABLE', message: 'The Puncher service is currently unavailable.' };
  }
  return {
    status: error.response.status >= 500 ? 502 : error.response.status,
    code: 'PUNCHER_API_ERROR',
    message: error.response.data?.message || 'The Puncher service could not complete the request.',
  };
}

module.exports = { configurationStatus, request, publicError };
