import axios from 'axios';
import { getAuthItem, removeAuthItem } from '../utils/authStorage';

const defaultApiHost = import.meta.env.VITE_API_URL;

const normalizeApiBase = (url) => {
  if (!url) return '';
  const trimmedUrl = url.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`;
};

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: normalizeApiBase(defaultApiHost),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // The browser must generate the multipart boundary for file uploads.
    // A forced JSON content type makes Multer receive no file.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    const token = getAuthItem('userToken');
    // Authentication requests must never inherit a token from a previous user.
    // Some deployments reject a login carrying an expired/foreign bearer token.
    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.skipAuth && config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Axios response error:', {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      // Token expired or invalid
      removeAuthItem('userToken');
      removeAuthItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
