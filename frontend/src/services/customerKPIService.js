import axiosInstance from './axiosInstance';

// Fetch users and filter for customer service roles
export const getCustomerServiceUsers = async () => {
  const response = await axiosInstance.get('/users');
  // Normalize common response shapes
  const payload = response?.data;
  const usersArray =
    Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.users) ? payload.users
    : [];

  return usersArray.filter((u) => {
    const role = (u.role || u.userRole || '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return role === 'customerservice';
  });
};

const normalizeList = (payload) =>
  Array.isArray(payload) ? payload
  : Array.isArray(payload?.data) ? payload.data
  : Array.isArray(payload?.items) ? payload.items
  : Array.isArray(payload?.customers) ? payload.customers
  : Array.isArray(payload?.followups) ? payload.followups
  : [];

export const getCustomerServiceWorkItems = async () => {
  const requestConfig = {
    timeout: 6000,
    params: {
      limit: 300,
      page: 1,
    },
  };

  const requests = await Promise.allSettled([
    axiosInstance.get('/followups', requestConfig),
    axiosInstance.get('/training-followups', requestConfig),
    axiosInstance.get('/sales-customers', requestConfig),
    axiosInstance.get('/buyers', requestConfig),
  ]);

  return requests.flatMap((result, index) => {
    if (result.status !== 'fulfilled') return [];
    const source = ['followup', 'training', 'sales', 'buyer'][index];
    return normalizeList(result.value?.data).map((item) => ({
      ...item,
      kpiSource: source,
    }));
  });
};
