import axiosInstance from './axiosInstance';

export const getHrKpis = async (periodType = 'monthly', periodKey = '') => {
  const response = await axiosInstance.get('/hr-kpi', {
    params: { periodType, periodKey },
  });
  return response.data;
};

export const saveHrKpi = async (kpiData) => {
  const response = await axiosInstance.post('/hr-kpi', kpiData);
  return response.data;
};

export const getHrLiveStats = async () => {
  const response = await axiosInstance.get('/hr-kpi/live-stats');
  return response.data;
};
