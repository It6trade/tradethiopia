import axiosInstance from './axiosInstance';

export async function calculateAwards(month, recalculate = false) {
  const resp = await axiosInstance.post('/awards/calculate', { month, recalculate });
  return resp.data;
}

export async function getAwardsByMonth(month) {
  const resp = await axiosInstance.get(`/awards/month/${month}`);
  return resp.data;
}

export async function getPerformanceDetail(month, employeeId) {
  const resp = await axiosInstance.get(`/awards/details/${month}/${employeeId}`);
  return resp.data;
}

export async function getMonthlyPerformances(month) {
  const resp = await axiosInstance.get(`/awards/performances/${month}`);
  return resp.data;
}

export async function updatePerformance(id, data) {
  const resp = await axiosInstance.put(`/awards/performance/${id}`, data);
  return resp.data;
}
