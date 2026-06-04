import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL });

const setAuthToken = (token) => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export const getAllInventory = async () => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/inventory');
  return res.data;
};

export const createInventoryItem = async (data) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post('/api/inventory', data);
  return res.data;
};

export const updateInventoryItem = async (id, data) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.put(`/api/inventory/${id}`, data);
  return res.data;
};

export const deleteInventoryItem = async (id) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.delete(`/api/inventory/${id}`);
  return res.data;
};

export const deliverStock = async (id, amount) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/inventory/${id}/deliver`, { amount });
  return res.data;
};

export const addBufferStock = async (id, amount) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/inventory/${id}/add-buffer`, { amount });
  return res.data;
};

export const transferBufferToStock = async (id, amount) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/inventory/${id}/transfer-buffer`, { amount });
  return res.data;
};

export const getMovements = async (id) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get(`/api/inventory/${id}/movements`);
  return res.data;
};
