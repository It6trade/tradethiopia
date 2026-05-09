import axiosInstance from './axiosInstance';

const api = axiosInstance;

const extractData = (response) => response?.data;

// Metrics API
export const getMetrics = () => api.get('/finance/metrics').then(extractData);
export const getRevenueSummary = () => api.get('/finance/revenue-summary').then(extractData);
export const getRevenueReport = () => api.get('/finance/revenue-report').then(extractData);
export const getExpenseReport = () => api.get('/finance/expense-report').then(extractData);
export const getFinanceSummary = () => api.get('/finance/summary').then(extractData);
export const getFinanceErpDashboard = () => api.get('/finance/erp/dashboard').then(extractData);
export const getFinanceErpReports = () => api.get('/finance/erp/reports').then(extractData);
export const getFinanceErpResource = (resource, params = {}) => api.get(`/finance/erp/${resource}`, { params }).then(extractData);
export const createFinanceErpResource = (resource, payload) => api.post(`/finance/erp/${resource}`, payload).then(extractData);
export const runFinanceWorkflow = (workflow, payload) => api.post(`/finance/erp/workflow/${workflow}`, payload).then(extractData);
export const runFinanceCommand = (path, payload = {}) => api.post(`/finance/erp${path}`, payload).then(extractData);
export const getFinanceAgeingReport = (type) => api.get(`/finance/erp/reports/aging/${type}`).then(extractData);

// Agent Sales Performance API
export const getAgentSalesPerformance = (range) => {
  const params = range ? { range } : undefined;
  return api.get('/finance/agent-sales-performance', { params }).then(extractData);
};

// Purchase Summary API
export const getPurchaseSummary = () => api.get('/finance/purchase-summary').then(extractData);

// Recent Purchases API
export const getRecentPurchases = () => api.get('/finance/recent-purchases').then(extractData);

// Purchase CRUD Operations
export const getPurchases = (filters = {}) => api.get('/purchases', { params: filters }).then(extractData);
export const getPurchase = (id) => api.get(`/purchases/${id}`);
export const createPurchase = (purchaseData) => api.post('/purchases', purchaseData);
export const updatePurchase = (id, purchaseData) => api.put(`/purchases/${id}`, purchaseData);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`);
export const exportPurchases = (filters = {}) => api.get('/purchases/export', { params: filters, responseType: 'blob' });

// Order Management APIs
export const getOrders = (opts = {}) => api.get('/orders', { params: opts });
export const exportOrders = (opts = {}) => api.get('/orders/export', { params: opts, responseType: 'blob' });
export const bulkFulfill = (orderIds = []) => api.post('/orders/bulk-fulfill', { orderIds });
export const fulfillOrder = (followupId, orderId) => api.post(`/followups/${followupId}/orders/${orderId}/fulfill`);

// Demand Management APIs
export const getDemands = () => api.get('/demands').then(extractData);
export const resolveDemand = (id) => api.post(`/demands/${id}/resolve`);

// Export the shared api instance
export default api;
