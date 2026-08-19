import axiosInstance from './axiosInstance';

export const getNotices = async (params = {}) => {
  const response = await axiosInstance.get('/notices', { params });
  return response.data?.data || [];
};

export const getNoticeStats = async (params = {}) => {
  const response = await axiosInstance.get('/notices/stats', { params });
  return response.data?.stats || null;
};

export const getNoticeById = async (id) => {
  const response = await axiosInstance.get(`/notices/${id}`);
  return response.data?.data || null;
};

export const createNotice = async (data) => {
  const response = await axiosInstance.post('/notices', data);
  return response.data?.data || null;
};

export const updateNotice = async (id, data) => {
  const response = await axiosInstance.put(`/notices/${id}`, data);
  return response.data?.data || null;
};

export const deleteNotice = async (id) => {
  const response = await axiosInstance.delete(`/notices/${id}`);
  return response.data;
};

export const recordNoticeView = async (id) => {
  const response = await axiosInstance.post(`/notices/${id}/view`);
  return response.data;
};

export const togglePinNotice = async (id) => {
  const response = await axiosInstance.post(`/notices/${id}/pin`);
  return response.data?.data || null;
};
