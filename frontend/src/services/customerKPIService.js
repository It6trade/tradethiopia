import axiosInstance from './axiosInstance';

let cachedUsers = null;
let usersCacheTimestamp = 0;
let cachedWorkItems = null;
let workItemsCacheTimestamp = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Fetch users and filter for customer service roles with caching
export const getCustomerServiceUsers = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedUsers && (now - usersCacheTimestamp < CACHE_TTL_MS)) {
    return cachedUsers;
  }

  const response = await axiosInstance.get('/users');
  const payload = response?.data;
  const usersArray =
    Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.users) ? payload.users
    : [];

  const filtered = usersArray.filter((u) => {
    const role = (u.role || u.userRole || '').toString().toLowerCase();
    return role === 'customerservice' || role === 'customersuccessmanager';
  });

  cachedUsers = filtered;
  usersCacheTimestamp = now;
  return filtered;
};

const normalizeList = (payload) =>
  Array.isArray(payload) ? payload
  : Array.isArray(payload?.data) ? payload.data
  : Array.isArray(payload?.items) ? payload.items
  : Array.isArray(payload?.customers) ? payload.customers
  : Array.isArray(payload?.followups) ? payload.followups
  : [];

export const getCustomerServiceWorkItems = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedWorkItems && (now - workItemsCacheTimestamp < CACHE_TTL_MS)) {
    return cachedWorkItems;
  }

  const requestConfig = {
    timeout: 8000,
    params: {
      limit: 250,
      page: 1,
    },
  };

  const requests = await Promise.allSettled([
    axiosInstance.get('/followups', requestConfig),
    axiosInstance.get('/training-followups', requestConfig),
    axiosInstance.get('/sales-customers', requestConfig),
    axiosInstance.get('/buyers', requestConfig),
  ]);

  const items = requests.flatMap((result, index) => {
    if (result.status !== 'fulfilled') return [];
    const source = ['followup', 'training', 'sales', 'buyer'][index];
    return normalizeList(result.value?.data).map((item) => ({
      ...item,
      kpiSource: source,
    }));
  });

  cachedWorkItems = items;
  workItemsCacheTimestamp = now;
  return items;
};

export const clearKPICache = () => {
  cachedUsers = null;
  cachedWorkItems = null;
  usersCacheTimestamp = 0;
  workItemsCacheTimestamp = 0;
};
