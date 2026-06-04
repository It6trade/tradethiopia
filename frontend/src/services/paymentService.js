import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL });

const setAuthToken = (token) => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export const createPayment = async (data) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post('/api/payments', data);
  return res.data;
};

export const listPayments = async () => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/payments');
  return res.data;
};
