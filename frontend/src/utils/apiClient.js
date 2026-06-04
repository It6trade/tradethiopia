import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Return successful responses
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.status, error.response.data);
      return Promise.reject({
        ...error,
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API No Response:', error.request);
      return Promise.reject({
        ...error,
        message: 'No response from server. Please check your connection.'
      });
    } else {
      // Something else happened
      console.error('API Error:', error.message);
      return Promise.reject({
        ...error,
        message: error.message || 'An error occurred'
      });
    }
  }
);

export default apiClient;