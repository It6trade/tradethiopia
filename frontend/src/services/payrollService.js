import axiosInstance from './axiosInstance';

// Fetch payroll data for a specific month
export const fetchPayrollData = async (month, params = {}) => {
  const response = await axiosInstance.get(`/payroll/${month}`, { params });
  return response.data;
};

// Calculate payroll for all employees
export const calculatePayroll = async (data) => {
  const response = await axiosInstance.post('/payroll/calculate', data);
  return response.data;
};

// Submit HR adjustment
export const submitHrAdjustment = async (data) => {
  // Log the user's role for debugging
  const userRole = localStorage.getItem('userRole');
  const userRoleRaw = localStorage.getItem('userRoleRaw');
  const userName = localStorage.getItem('userName');
  console.log('Current user role (normalized):', userRole);
  console.log('Current user role (raw):', userRoleRaw);
  console.log('Current user name:', userName);
  
  const response = await axiosInstance.post('/payroll/hr-adjust', data);
  return response.data;
};

// Submit Finance adjustment
export const submitFinanceAdjustment = async (data) => {
  // Log the user's role for debugging
  const userRole = localStorage.getItem('userRole');
  const userRoleRaw = localStorage.getItem('userRoleRaw');
  const userName = localStorage.getItem('userName');
  console.log('Current user role (normalized):', userRole);
  console.log('Current user role (raw):', userRoleRaw);
  console.log('Current user name:', userName);
  
  const response = await axiosInstance.post('/payroll/finance-adjust', data);
  return response.data;
};

// Get detailed payroll view for an employee
export const getPayrollDetails = async (userId, params) => {
  const response = await axiosInstance.get(`/payroll/${userId}/details`, { params });
  return response.data;
};

// Approve payroll
export const approvePayroll = async (payrollId) => {
  const response = await axiosInstance.put(`/payroll/${payrollId}/approve`);
  return response.data;
};

// Lock payroll
export const lockPayroll = async (payrollId) => {
  const response = await axiosInstance.put(`/payroll/${payrollId}/lock`);
  return response.data;
};

// Fetch commission data for a specific user and period
export const fetchCommissionData = async (userId, month, year) => {
  try {
    const response = await axiosInstance.get(`/payroll/commission/${userId}`, {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    // If it's a 404 error (commission record not found), return null instead of throwing
    if (error.response && error.response.status === 404) {
      return null;
    }
    // For other errors, re-throw
    throw error;
  }
};

// Finalize payroll and capture history (Finance-only)
export const finalizePayroll = async (payrollId) => {
  const response = await axiosInstance.post(`/payroll/${payrollId}/finalize`);
  return response.data;
};

// Fetch finalized payroll history
export const fetchPayrollHistory = async (params = {}) => {
  const response = await axiosInstance.get('/payroll/history', { params });
  return response.data;
};

// Submit commission data for a user
export const submitCommission = async (data) => {
  const response = await axiosInstance.post('/payroll/commission', data);
  return response.data;
};

export const deleteCommission = async (data) => {
  const response = await axiosInstance.delete('/payroll/commission', { data });
  return response.data;
};

// Delete a payroll record
export const deletePayrollRecord = async (payrollId) => {
  const response = await axiosInstance.delete(`/payroll/${payrollId}`);
  return response.data;
};

// Fetch aggregate first/second commission totals for payroll
export const fetchCommissionTotals = async (params) => {
  const response = await axiosInstance.get('/commissions/totals', { params });
  return response.data;
};

// Calculate commission using the exact same formula as the backend
const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.075;
  
  const price = Number(salesValue) || 0;
  
  // Adjust SocialTaxRate based on price (matches backend)
  const SocialTaxRate = price < 15000 ? 300 : 900;
  const Commission = price - SocialTaxRate;
  const grossCommission = Commission * commissionRate;
  const commissionTax = SocialTaxRate;
  const netCommission = grossCommission;

  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax: Number(commissionTax.toFixed(2)),
    netCommission: Number(netCommission.toFixed(2)),
  };
};

// Get sales data for commission calculation (through sales manager system)
export const fetchSalesDataForCommission = async (agentId, month, year, startDate, endDate) => {
  try {
    console.log('=== FETCHING SALES DATA FOR COMMISSION ===');
    console.log('Parameters received:', { agentId, month, year, startDate, endDate });
    
    // Build filter parameters for the sales manager endpoint
    const params = {
      agentId: agentId
    };
    
    // If date range is provided, use startDate/endDate
    if (startDate && endDate) {
      params.dateFrom = startDate;
      params.dateTo = endDate;
      console.log('Using date range:', { dateFrom: startDate, dateTo: endDate });
    } 
    // Otherwise, if month/year provided, convert to date range
    else if (month && year) {
      // Convert month/year to date range
      const [yearStr, monthStr] = month.split('-');
      const startDateOfMonth = `${yearStr}-${monthStr}-01`;
      const endDateOfMonth = new Date(yearStr, parseInt(monthStr), 0).toISOString().split('T')[0]; // Last day of month
      
      params.dateFrom = startDateOfMonth;
      params.dateTo = endDateOfMonth;
      console.log('Converted month/year to date range:', { dateFrom: startDateOfMonth, dateTo: endDateOfMonth });
    }
    
    console.log('Fetching sales data from sales manager with params:', params);
    
    // Use the sales manager endpoint to get sales data (authoritative source)
    const response = await axiosInstance.get(`/sales-manager/all-sales`, {
      params
    });
    
    console.log('Sales data response from sales manager:', response.data);
    
    // Process the response to match the expected format
    const sales = response.data || [];
    const numberOfSales = sales.length;
    
    console.log(`Found ${numberOfSales} sales records`);
    
    // Log detailed information about each sale record
    sales.forEach((sale, index) => {
      console.log(`Sale ${index + 1}:`, {
        id: sale._id,
        customerName: sale.customerName,
        coursePrice: sale.coursePrice,
        commission: sale.commission,
        hasCommission: !!sale.commission,
        commissionType: typeof sale.commission,
        commissionKeys: sale.commission ? Object.keys(sale.commission) : null
      });
    });
    
    // Process sales data - use existing commission or calculate if missing
    let totalGrossCommission = 0;
    let totalCommissionTax = 0;
    let totalNetCommission = 0;
    
    const commissionDetails = sales.map((sale, index) => {
      // Log the commission data for debugging
      console.log(`Processing sale ${index + 1} commission data:`, sale.commission);
      
      // Check if commission data exists and has the expected structure
      let grossCommission = 0;
      let commissionTax = 0;
      let netCommission = 0;
      
      if (sale.commission && typeof sale.commission === 'object' && sale.commission.netCommission !== undefined) {
        // Use existing commission data
        grossCommission = Number(sale.commission.grossCommission) || 0;
        commissionTax = Number(sale.commission.commissionTax) || 0;
        netCommission = Number(sale.commission.netCommission) || 0;
        console.log(`Sale ${index + 1}: Using existing commission data`);
      } else {
        // Calculate commission if not available
        const calculatedCommission = calculateCommission(sale.coursePrice || 0);
        grossCommission = calculatedCommission.grossCommission;
        commissionTax = calculatedCommission.commissionTax;
        netCommission = calculatedCommission.netCommission;
        console.log(`Sale ${index + 1}: Calculated commission data`, calculatedCommission);
      }
      
      console.log(`Sale ${index + 1} commission values:`, { grossCommission, commissionTax, netCommission });
      
      totalGrossCommission += grossCommission;
      totalCommissionTax += commissionTax;
      totalNetCommission += netCommission;
      
      console.log(`Sale ${index + 1}: Amount=${sale.coursePrice || 0}, Gross=${grossCommission}, Tax=${commissionTax}, Net=${netCommission}`);
      
      return {
        customerId: sale._id,
        customerName: sale.customerName,
        saleAmount: sale.coursePrice || 0,
        commissionRate: 0.07, // 7% commission rate
        grossCommission: grossCommission,
        commissionTax: commissionTax,
        netCommission: netCommission,
        date: sale.date
      };
    });
    
    const result = {
      agentId,
      sales,
      grossCommission: Math.round(totalGrossCommission),
      commissionTax: Math.round(totalCommissionTax),
      totalCommission: Math.round(totalNetCommission), // Using net commission as the total
      numberOfSales,
      commissionDetails
    };
    
    console.log('Final result:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching sales data from sales manager:', error);
    console.error('Error response:', error.response?.data);
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};
