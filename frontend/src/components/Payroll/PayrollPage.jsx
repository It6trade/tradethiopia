import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon, ViewIcon, LockIcon, CheckIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { fetchPayrollData, calculatePayroll, submitHrAdjustment, submitFinanceAdjustment, approvePayroll, lockPayroll, fetchCommissionData, submitCommission, deleteCommission, fetchSalesDataForCommission, finalizePayroll, fetchPayrollHistory } from '../../services/payrollService';
import { fetchContentTrackerEntries } from '../../services/contentTrackerService';
import {
  getMonthRange,
  normalizeTrackerResponse,
  normalizeAgentKey,
  summarizeEntriesByAgent,
  mapSummariesByKey,
} from '../../utils/contentTrackerTargets';

const PayrollPage = ({ wrapLayout = true }) => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hrFormData, setHrFormData] = useState({
    userId: '',
    daytimeOvertimeHours: 0,
    nightOvertimeHours: 0,
    restDayOvertimeHours: 0,
    holidayOvertimeHours: 0,
    lateDays: 0,
    absenceDays: 0,
    hrAllowances: 0
  });
  const [financeFormData, setFinanceFormData] = useState({
    userId: '',
    financeAllowances: 0,
    financeDeductions: 0,
    hrAllowances: 0
  });
  const [commissionFormData, setCommissionFormData] = useState({
    userId: '',
    numberOfSales: 0,
    grossCommission: 0,
    commissionTax: 0,
    totalCommission: 0,
    commissionDetails: []
  });
  const [contentSummaries, setContentSummaries] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [commissionDateRange, setCommissionDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [useDateRange, setUseDateRange] = useState(false);
  const [hasStoredCommission, setHasStoredCommission] = useState(false);
  const [clearingCommission, setClearingCommission] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyFilters, setHistoryFilters] = useState({
    username: '',
    month: '',
    department: ''
  });

  const createEmptyCommissionForm = (userId = '') => ({
    userId,
    numberOfSales: 0,
    grossCommission: 0,
    commissionTax: 0,
    totalCommission: 0,
    commissionDetails: []
  });
  
  const toast = useToast();
  const navigate = useNavigate();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerBg = useColorModeValue('teal.600', 'teal.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  const loadPayrollContentSummaries = useCallback(async () => {
    setContentLoading(true);
    setContentError('');
    try {
      const range = getMonthRange(selectedMonth);
      if (!range) {
        setContentSummaries([]);
        return [];
      }
      const response = await fetchContentTrackerEntries({
        approved: true,
        dateFrom: range.start.toISOString(),
        dateTo: range.end.toISOString(),
      });
      const entries = normalizeTrackerResponse(response);
      const summaries = summarizeEntriesByAgent(entries, selectedMonth);
      setContentSummaries(summaries);
      return summaries;
    } catch (err) {
      console.error('Failed to load content tracker summaries for payroll:', err);
      setContentError('Unable to load the content tracker bonus data.');
      setContentSummaries([]);
      return [];
    } finally {
      setContentLoading(false);
    }
  }, [selectedMonth]);

  const applyContentBonuses = (data, summaries) => {
    const summaryMap = mapSummariesByKey(summaries);
    return data.map((employee) => {
      const agentKey = normalizeAgentKey(employee.userId);
      const summary = agentKey ? summaryMap[agentKey] : null;
      const baseSalary = employee.grossSalary ?? employee.basicSalary ?? 0;
      const bonus = summary?.bonusAmount || 0;
      return {
        ...employee,
        contentBonus: bonus,
        grossSalaryWithBonus: baseSalary + bonus,
      };
    });
  };

  // Fetch payroll data
const fetchPayrollDataHandler = async () => {
  try {
      setLoading(true);
      const data = await fetchPayrollData(selectedMonth, {
        year: selectedYear,
        department: selectedDepartment,
        role: selectedRole
      });
      const summaries = await loadPayrollContentSummaries();
      const baseSummaries = Array.isArray(summaries) && summaries.length ? summaries : contentSummaries;
      setPayrollData(applyContentBonuses(data, baseSummaries));
      setError('');
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('Failed to fetch payroll data');
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
    setLoading(false);
  }
};

  const fetchPayrollHistoryHandler = useCallback(async (filters = {}) => {
    try {
      setHistoryLoading(true);
      // If no specific filters provided, fetch all history
      const params = Object.keys(filters).length > 0 ? filters : {};
      const history = await fetchPayrollHistory(params);
      setPayrollHistory(Array.isArray(history) ? history : []);
      setHistoryError('');
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setHistoryError('Failed to load payroll history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleHistoryFilterChange = (field, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredPayrollHistory = payrollHistory.filter((entry) => {
    console.log('Processing history entry:', entry);
    const userFilter = historyFilters.username.toLowerCase().trim();
    const monthFilter = historyFilters.month;
    const departmentFilter = historyFilters.department.toLowerCase().trim();

    const entryUser = (entry.employeeName || '').toLowerCase();
    if (userFilter && !entryUser.includes(userFilter)) {
      return false;
    }

    if (monthFilter && entry.month !== monthFilter) {
      return false;
    }

    if (departmentFilter && entry.department?.toLowerCase().indexOf(departmentFilter) === -1) {
      return false;
    }

    return true;
  });
  
  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // This would typically come from an API endpoint
      setDepartments(['sales', 'HR', 'finance', 'IT', 'admin']);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };
  
  // Calculate payroll for all employees
  const calculatePayrollHandler = async () => {
    try {
      setLoading(true);
      const data = await calculatePayroll({
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error calculating payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to calculate payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle HR form change
  const handleHrFormChange = (e) => {
    const { name, value } = e.target;
    setHrFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Submit HR adjustment
  const submitHrAdjustmentHandler = async () => {
    try {
      const data = await submitHrAdjustment({
        ...hrFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsHrModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting HR adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit HR adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Submit Finance adjustment
  const submitFinanceAdjustmentHandler = async () => {
    try {
      const data = await submitFinanceAdjustment({
        ...financeFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsFinanceModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting Finance adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit Finance adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Approve payroll
  const approvePayrollHandler = async (payrollId) => {
    try {
      const data = await approvePayroll(payrollId);
      
      // Clear commission data when payroll is approved
      const employee = payrollData.find(p => p._id === payrollId);
      if (employee && employee.userId) {
        await clearCommissionData(employee.userId._id || employee.userId);
      }
      
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error approving payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const finalizePayrollHandler = async (payrollId) => {
    try {
      const data = await finalizePayroll(payrollId);
      
      // Clear commission data when payroll is finalized
      const employee = payrollData.find(p => p._id === payrollId);
      if (employee && employee.userId) {
        await clearCommissionData(employee.userId._id || employee.userId);
      }
      
      toast({
        title: 'Payroll Finalized',
        description: data.message,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      fetchPayrollDataHandler();
      
      if (data?.history) {
        setPayrollHistory((prev) => [data.history, ...prev]);
      }
      
      setHistoryFilters({ username: '', month: '', department: '' });
      fetchPayrollHistoryHandler({});
    } catch (err) {
      console.error('Error finalizing payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to finalize payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Clear commission data for a specific user and period
  const clearCommissionData = async (userId) => {
    try {
      await deleteCommission({
        userId,
        month: selectedMonth,
        year: selectedYear
      });
      
      // Reset commission form data
      setCommissionFormData({
        userId: '',
        numberOfSales: 0,
        grossCommission: 0,
        commissionTax: 0,
        totalCommission: 0,
        commissionDetails: []
      });
      
      setHasStoredCommission(false);
      setSalesData([]);
      
    } catch (error) {
      console.error('Error clearing commission data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear commission data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

// Lock payroll
  const lockPayrollHandler = async (payrollId) => {
    try {
      const data = await lockPayroll(payrollId);
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error locking payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to lock payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // View employee details
  const viewEmployeeDetails = (employee) => {
    // Navigate to the employee's payroll details page
    navigate(`/my-payroll?userId=${employee.userId._id || employee.userId}&month=${selectedMonth}&year=${selectedYear}`);
  };

  const viewHistoryDetails = (historyEntry) => {
    const userId = historyEntry.payrollData?.userId?._id || historyEntry.payrollData?.userId;
    if (!userId) return;
    navigate(`/my-payroll?userId=${userId}&month=${historyEntry.month}&year=${historyEntry.year}`);
  };

  // Get current user role
  const getCurrentUserRole = () => {
    const role = localStorage.getItem('userRole');
    return role ? role.toLowerCase() : '';
  };

  // Check if user has HR permissions
  const isHrUser = () => {
    const role = getCurrentUserRole();
    return role === 'hr' || role === 'admin';
  };

  // Check if user has Finance permissions
  const isFinanceUser = () => {
    const role = getCurrentUserRole();
    return role === 'finance' || role === 'admin';
  };

  // Check if user is exactly Finance (not admin)
  const isFinanceRoleUser = () => {
    const role = getCurrentUserRole();
    return role === 'finance';
  };

  // Check if user has Admin permissions
  const isAdminUser = () => {
    const role = getCurrentUserRole();
    return  role === 'hr'|| role === 'admin';
  };

  // Finance or Admin can finalize payroll
  const canFinalizePayroll = () => {
    const role = getCurrentUserRole();
    return role === 'finance' || role === 'admin';
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = [
        'Employee Name',
        'Department',
        'Basic Salary',
        'Gross Salary',
        'Income Tax',
        'Pension',
        'Overtime Pay',
        'Sales Commission',
        'HR Allowances',
        'Finance Allowances',
        'Late Deductions',
        'Absence Deductions',
        'Finance Deductions',
        'Net Salary',
        'Status'
      ];
      
      const csvContent = [
        headers.join(','),
        ...payrollData.map(employee => [
          `"${employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown Employee'}"`,
          employee.department,
          employee.basicSalary || 0,
          getDisplayGrossSalary(employee),
          employee.incomeTax || 0,
          employee.pension || 0,
          employee.overtimePay || 0,
          employee.salesCommission || 0,
          employee.hrAllowances || 0,
          employee.financeAllowances || 0,
          employee.lateDeduction || 0,
          employee.absenceDeduction || 0,
          employee.financeDeductions || 0,
          employee.netSalary || employee.finalSalary || 0,
          employee.status
        ].join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Payroll data exported to CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll data to CSV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Export to PDF
  const exportToPDF = () => {
    try {
      // For now, we'll create a simple text-based PDF export
      // In a real application, you might want to use a library like jsPDF
      
      // Create a simple text representation
      let pdfContent = `Payroll Report\n`;
      pdfContent += `Period: ${selectedMonth} ${selectedYear}\n\n`;
      
      payrollData.forEach(employee => {
        pdfContent += `${employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown Employee'}\n`;
        pdfContent += `  Department: ${employee.department}\n`;
        pdfContent += `  Basic Salary: ${formatCurrency(employee.basicSalary || 0)}\n`;
        pdfContent += `  Gross Salary: ${formatCurrency(getDisplayGrossSalary(employee))}\n`;
        pdfContent += `  Income Tax: ${formatCurrency(employee.incomeTax || 0)}\n`;
        pdfContent += `  Pension: ${formatCurrency(employee.pension || 0)}\n`;
        pdfContent += `  Overtime Pay: ${formatCurrency(employee.overtimePay || 0)}\n`;
        pdfContent += `  Sales Commission: ${formatCurrency(employee.salesCommission || 0)}\n`;
        pdfContent += `  HR Allowances: ${formatCurrency(employee.hrAllowances || 0)}\n`;
        pdfContent += `  Finance Allowances: ${formatCurrency(employee.financeAllowances || 0)}\n`;
        pdfContent += `  Late Deductions: ${formatCurrency(employee.lateDeduction || 0)}\n`;
        pdfContent += `  Absence Deductions: ${formatCurrency(employee.absenceDeduction || 0)}\n`;
        pdfContent += `  Finance Deductions: ${formatCurrency(employee.financeDeductions || 0)}\n`;
        pdfContent += `  Net Salary: ${formatCurrency(employee.netSalary || employee.finalSalary || 0)}\n`;
        pdfContent += `  Status: ${employee.status}\n\n`;
      });
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Payroll data exported to PDF',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll data to PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Open HR modal
  const openHrModal = (employee) => {
    setSelectedEmployee(employee);
    setHrFormData({
      userId: employee.userId._id || employee.userId,
      daytimeOvertimeHours: 0,
      nightOvertimeHours: 0,
      restDayOvertimeHours: 0,
      holidayOvertimeHours: 0,
      lateDays: 0,
      absenceDays: 0,
      hrAllowances: 0
    });
    setIsHrModalOpen(true);
  };
  
  // Open Finance modal
  const openFinanceModal = (employee) => {
    setSelectedEmployee(employee);
    setFinanceFormData({
      userId: employee.userId._id || employee.userId,
      financeAllowances: employee.financeAllowances || 0,
      financeDeductions: employee.financeDeductions || 0,
      hrAllowances: employee.hrAllowances || 0
    });
    setIsFinanceModalOpen(true);
  };
  
  // Handle Finance form change
  const handleFinanceFormChange = (e) => {
    const { name, value } = e.target;
    setFinanceFormData({
      ...financeFormData,
      [name]: parseFloat(value) || 0
    });
  };
  
  // Open Commission modal
  const openCommissionModal = async (employee) => {
    console.log('=== OPENING COMMISSION MODAL ===');
    console.log('Selected employee:', employee);
    console.log('Current filters:', { selectedMonth, selectedYear });
    
    setSelectedEmployee(employee);
    setHasStoredCommission(false);
    setClearingCommission(false);
    setIsCommissionModalOpen(true);
    
    // Reset date range options
    setUseDateRange(false);
    setCommissionDateRange({
      startDate: '',
      endDate: ''
    });
    
    try {
      // Fetch existing commission data if available
      console.log('Fetching existing commission data...');
      const commissionData = await fetchCommissionData(
        employee.userId._id || employee.userId,
        selectedMonth,
        selectedYear
      );
      console.log('Existing commission data:', commissionData);
      
      if (commissionData) {
        setHasStoredCommission(true);
        setCommissionFormData({
          userId: employee.userId._id || employee.userId,
          numberOfSales: commissionData.numberOfSales || 0,
          grossCommission: commissionData.grossCommission || 0,
          commissionTax: commissionData.commissionTax || 0,
          totalCommission: commissionData.totalCommission || 0,
          commissionDetails: commissionData.commissionDetails || []
        });
      } else {
        setHasStoredCommission(false);
        setCommissionFormData(createEmptyCommissionForm(employee.userId._id || employee.userId));
      }
      
      // Fetch sales data for this employee (initially using month/year)
      if (employee.department === 'sales') {
        console.log('Fetching sales data for commission calculation...');
        setLoadingSales(true);
        const salesDataResult = await fetchSalesDataForCommission(
          employee.userId._id || employee.userId,
          selectedMonth,
          selectedYear
        );
        console.log('Sales data received:', salesDataResult);
        
        // The salesDataResult contains the sales data directly, not in a .sales property
        const salesArray = extractSalesArray(salesDataResult);
        setSalesData(salesArray);
        
        // Auto-calculate commission from sales data
        if (salesArray.length > 0) {
          // Calculate totals from sales data
          let totalGross = 0;
          let totalTax = 0;
          let totalNet = 0;
          
          salesArray.forEach(sale => {
            totalGross += sale.grossCommission || 0;
            totalTax += sale.commissionTax || 0;
            totalNet += sale.netCommission || 0;
          });
          
          // Update commission form data with calculated values
          const updatedCommissionDetails = salesArray.map(sale => ({
            customerId: sale.customerId,
            customerName: sale.customerName,
            saleAmount: sale.saleAmount || 0,
            commissionRate: 0.07,
            grossCommission: sale.grossCommission || 0,
            commissionTax: sale.commissionTax || 0,
            netCommission: sale.netCommission || 0,
            date: sale.date
          }));
          
          setCommissionFormData(prev => ({
            ...prev,
            numberOfSales: salesArray.length,
            grossCommission: Math.round(totalGross),
            commissionTax: Math.round(totalTax),
            totalCommission: Math.round(totalNet), // Using net commission as the total
            commissionDetails: updatedCommissionDetails
          }));
        }
        
        setLoadingSales(false);
      }
    } catch (err) {
      console.error('Error fetching commission data:', err);
      console.error('Error details:', err.response?.data);
      toast({
        title: 'Error',
        description: 'Failed to fetch commission data: ' + (err.response?.data?.message || err.message),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoadingSales(false);
    }
  };
  
  // Handle Commission form change
  const handleCommissionFormChange = (e) => {
    const { name, value } = e.target;
    setCommissionFormData({
      ...commissionFormData,
      [name]: parseFloat(value) || 0
    });
  };

  const normalizeSaleRecord = (sale) => {
    if (!sale) return null;
    const commissionSource = sale.grossCommission !== undefined
      ? sale
      : sale.commission || {};
    return {
      customerId: sale.customerId || sale._id,
      customerName: sale.customerName || '',
      saleAmount: sale.saleAmount ?? sale.coursePrice ?? sale.commission?.saleAmount ?? 0,
      grossCommission: Number(commissionSource.grossCommission) || 0,
      commissionTax: Number(commissionSource.commissionTax) || 0,
      netCommission: Number(commissionSource.netCommission) || 0,
      date: sale.date
    };
  };

  const extractSalesArray = (payload) => {
    const raw = Array.isArray(payload)
      ? payload
      : payload?.commissionDetails || payload?.sales || [];
    return raw.map(normalizeSaleRecord).filter(Boolean);
  };

  // Auto-calculate commission based on sales data
  const calculateCommissionFromSales = () => {
    if (salesData && salesData.length > 0) {
      // Calculate totals from sales data
      let totalGross = 0;
      let totalTax = 0;
      let totalNet = 0;
      
      salesData.forEach(sale => {
        totalGross += sale.grossCommission || 0;
        totalTax += sale.commissionTax || 0;
        totalNet += sale.netCommission || 0;
      });
      
      // Update commission form data with calculated values
      const updatedCommissionDetails = salesData.map(sale => ({
        customerId: sale.customerId,
        customerName: sale.customerName,
        saleAmount: sale.saleAmount || 0,
        commissionRate: 0.07,
        grossCommission: sale.grossCommission || 0,
        commissionTax: sale.commissionTax || 0,
        netCommission: sale.netCommission || 0,
        date: sale.date
      }));
      
      setCommissionFormData({
        ...commissionFormData,
        numberOfSales: salesData.length,
        grossCommission: Math.round(totalGross),
        commissionTax: Math.round(totalTax),
        totalCommission: Math.round(totalNet), // Using net commission as the total
        commissionDetails: updatedCommissionDetails
      });
    }
  };

  // Submit Commission
  const submitCommissionHandler = async () => {
    try {
      const data = await submitCommission({
        ...commissionFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasStoredCommission(true);
      setIsCommissionModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting commission:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit commission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch sales data with date range option
  const fetchSalesDataWithDateRange = async () => {
    console.log('=== FETCHING SALES DATA WITH DATE RANGE ===');
    console.log('Selected employee:', selectedEmployee);
    console.log('Use date range:', useDateRange);
    console.log('Commission date range:', commissionDateRange);
    
    if (!selectedEmployee) return;
    
    try {
      setLoadingSales(true);
      
      let params = {};
      
      if (useDateRange && commissionDateRange.startDate && commissionDateRange.endDate) {
        // Use date range
        params = {
          startDate: commissionDateRange.startDate,
          endDate: commissionDateRange.endDate
        };
        console.log('Using date range parameters:', params);
      } else {
        // Use month/year from the main filters
        params = {
          month: selectedMonth, // Full "YYYY-MM" format
          year: selectedYear.toString() // Convert to string to match expected format
        };
        console.log('Using month/year parameters:', params);
      }
      
      console.log('Calling fetchSalesDataForCommission with:', {
        agentId: selectedEmployee.userId._id || selectedEmployee.userId,
        ...params
      });
      
      const salesDataResult = await fetchSalesDataForCommission(
        selectedEmployee.userId._id || selectedEmployee.userId,
        params.month || undefined,
        params.year || undefined,
        params.startDate || undefined,
        params.endDate || undefined
      );
      
      console.log('Received sales data result:', salesDataResult);
      console.log('Sales data result type:', typeof salesDataResult);
      console.log('Sales data result sales property:', salesDataResult?.sales);
      console.log('Sales data result sales length:', salesDataResult?.sales?.length);
      
      // The salesDataResult is the actual data, not in a .sales property
      const salesArray = extractSalesArray(salesDataResult);
      console.log('Setting sales data state with:', salesArray);
      setSalesData(salesArray);
      console.log('Sales data state after setting:', salesArray);
      
      // Auto-calculate commission from sales data
      if (salesArray.length > 0) {
        // Calculate totals from sales data
        let totalGross = 0;
        let totalTax = 0;
        let totalNet = 0;
        
        salesArray.forEach(sale => {
          totalGross += sale.grossCommission || 0;
          totalTax += sale.commissionTax || 0;
          totalNet += sale.netCommission || 0;
        });
        
        // Update commission form data with calculated values
        const updatedCommissionDetails = salesArray.map(sale => ({
          customerId: sale.customerId,
          customerName: sale.customerName,
          saleAmount: sale.saleAmount || 0,
          commissionRate: 0.07,
          grossCommission: sale.grossCommission || 0,
          commissionTax: sale.commissionTax || 0,
          netCommission: sale.netCommission || 0,
          date: sale.date
        }));
        
        setCommissionFormData(prev => ({
          ...prev,
          numberOfSales: salesArray.length,
          grossCommission: Math.round(totalGross),
          commissionTax: Math.round(totalTax),
          totalCommission: Math.round(totalNet), // Using net commission as the total
          commissionDetails: updatedCommissionDetails
        }));
      }
      
      setLoadingSales(false);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      console.error('Error response:', err.response?.data);
      toast({
        title: 'Error',
        description: 'Failed to fetch sales data: ' + (err.response?.data?.message || err.message),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoadingSales(false);
    }
  };

  const clearCommissionHandler = async () => {
    if (!selectedEmployee) return;
    try {
      setClearingCommission(true);
      await deleteCommission({
        userId: selectedEmployee.userId._id || selectedEmployee.userId,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: 'Commission record cleared for this period',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasStoredCommission(false);
      setCommissionFormData(createEmptyCommissionForm(selectedEmployee.userId._id || selectedEmployee.userId));
      setSalesData([]);
      await fetchSalesDataWithDateRange();
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error clearing commission:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to clear saved commission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setClearingCommission(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setCommissionDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle between month/year and date range
  const toggleDateSelection = () => {
    setUseDateRange(!useDateRange);
    // Clear date range when switching back to month/year
    if (useDateRange) {
      setCommissionDateRange({
        startDate: '',
        endDate: ''
      });
    }
  };

  // Effect to fetch sales data when date range changes or when commission modal opens
  useEffect(() => {
    if (isCommissionModalOpen && selectedEmployee && selectedEmployee.department === 'sales') {
      fetchSalesDataWithDateRange();
    }
  }, [useDateRange, commissionDateRange, isCommissionModalOpen, selectedEmployee]);

  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchPayrollDataHandler();
    fetchDepartments();
    // Fetch all history initially
    fetchPayrollHistoryHandler({});
  }, [selectedMonth, selectedYear, selectedDepartment, selectedRole, fetchPayrollHistoryHandler]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };
  
  const getDisplayGrossSalary = (employee) => {
    return employee.grossSalaryWithBonus ?? employee.grossSalary ?? employee.basicSalary ?? 0;
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'yellow';
      case 'hr_submitted': return 'blue';
      case 'finance_reviewed': return 'purple';
      case 'approved': return 'green';
      case 'locked': return 'red';
      default: return 'gray';
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Flex justify="center" align="center" height="100%">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading Payroll Data
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error}
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }
  
  const pageContent = (
    <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
        <Flex 
          direction={{ base: 'column', sm: 'row' }} 
          justify="space-between" 
          align={{ base: 'start', sm: 'center' }} 
          mb={6}
          gap={4}
        >
          <Heading 
            as="h1" 
            size={{ base: 'lg', md: 'xl' }} 
            color={headerColor}
            pb={2}
            borderBottom="2px solid"
            borderBottomColor={headerColor}
            display="inline-block"
          >
            Payroll Management
          </Heading>
          
          <Flex 
            direction={{ base: 'column', sm: 'row' }} 
            gap={2}
          >
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="teal"
              size={{ base: 'sm', md: 'md' }}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="blue"
              size={{ base: 'sm', md: 'md' }}
              onClick={exportToPDF}
            >
              Export PDF
            </Button>
          </Flex>
        </Flex>

        {/* Filters */}
        <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody py={4} px={5}>
            <Grid 
              templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} 
              gap={4}
            >
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Month</Text>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  size="sm"
                  borderRadius="md"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const month = date.toISOString().slice(0, 7);
                    return (
                      <option key={month} value={month}>
                        {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </option>
                    );
                  })}

                </Select>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Year</Text>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  size="sm"
                  borderRadius="md"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Select>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Department</Text>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  placeholder="All Departments"
                  size="sm"
                  borderRadius="md"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Role</Text>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder="All Roles"
                  size="sm"
                  borderRadius="md"
                >
                  <option value="admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="finance">Finance</option>
                  <option value="sales">Sales</option>
                  <option value="IT">IT</option>
                </Select>
              </Box>
            </Grid>
            
            {(contentLoading || contentError) && (
              <Alert
                status={contentError ? 'warning' : 'info'}
                mt={4}
                mb={4}
                borderRadius="md"
              >
                <AlertIcon />
                {contentLoading
                  ? 'Loading content bonus data...'
                  : contentError}
              </Alert>
            )}
            
            <Flex 
              justify="flex-end" 
              mt={4}
            >
              {isAdminUser() && (
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={calculatePayrollHandler}
                  leftIcon={<AddIcon />}
                >
                  Calculate Payroll
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>

        {/* Stats Cards */}
        <Grid 
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(6, 1fr)" }} 
          gap={6} 
          mb={6}
        >
          <StatCard 
            title="Total Employees" 
            value={payrollData.length} 
            color="blue.500" 
          />
          <StatCard 
            title="Total Gross Salary" 
            value={formatCurrency(payrollData.reduce((sum, emp) => sum + getDisplayGrossSalary(emp), 0))} 
            color="green.500" 
          />
          <StatCard 
            title="Total Deductions" 
            value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.incomeTax || 0) + (emp.pension || 0) + (emp.lateDeduction || 0) + (emp.absenceDeduction || 0) + (emp.financeDeductions || 0), 0))} 
            color="orange.500" 
          />
          <StatCard 
            title="Total Net Salary" 
            value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0))} 
            color="teal.500" 
          />
          <StatCard 
            title="Total Pension (7%)" 
            value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.pension || 0), 0))} 
            color="purple.500" 
          />
          <StatCard 
            title="Total Pension (11%)" 
            value={formatCurrency(payrollData.reduce((sum, emp) => sum + (getDisplayGrossSalary(emp) * 0.11), 0))} 
            color="pink.500" 
          />
        </Grid>

        {/* Payroll Table */}
        <Card bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody py={2} px={2}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Employee
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Department
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Gross Salary
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Tax
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Pension
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Pension (11%)
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Overtime
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Commission
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Fin. Allowances
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Fin. Deductions
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Net Salary
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Status
                    </Th>
                    <Th 
                      py={1}
                      px={2}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      boxShadow="sm"
                      borderColor={borderColor}
                    >
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {payrollData
                    .filter(employee => {
                      // Filter out employees with username "." or ".."
                      const username = employee.userId?.username;
                      return username !== "." && username !== "..";
                    })
                    .map((employee) => (
                    <Tr 
                      key={employee._id}
                      _hover={{ bg: rowHoverBg }}
                      transition="background-color 0.2s"
                    >
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">
                          {employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown Employee'}
                        </Text>
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        <Badge colorScheme="blue" fontSize="2xs" px={1} py={0.5} borderRadius="full">
                          {employee.department}
                        </Badge>
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(getDisplayGrossSalary(employee))}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.incomeTax || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.pension || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(getDisplayGrossSalary(employee) * 0.11)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.overtimePay || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.salesCommission || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.financeAllowances || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        {formatCurrency(employee.financeDeductions || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor} fontWeight="bold" color="teal.500">
                        {formatCurrency(employee.netSalary || employee.finalSalary || 0)}
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        <Badge colorScheme={getStatusColor(employee.status)} fontSize="2xs" px={1} py={0.5} borderRadius="full">
                          {employee.status?.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td py={1} px={2} fontSize="xs" borderBottom="1px solid" borderColor={borderColor}>
                        <Flex gap={0.5}>
                          <Tooltip label="View Details">
                            <IconButton
                              icon={<ViewIcon />}
                              size="xs"
                              colorScheme="blue"
                              onClick={() => viewEmployeeDetails(employee)}
                              sx={{
                                minHeight: '20px',
                                height: '20px',
                                minWidth: '20px',
                                width: '20px',
                                fontSize: '2xs'
                              }}
                            />
                          </Tooltip>
                          
                          {/* Debug: Show department info */}
                          {/* <Text fontSize="2xs">
                            Dept: {employee.department || 'No dept'} 
                            ({employee.department === 'sales' ? 'SALES' : 'NOT SALES'})
                            {employee.userId?.department && ` | UserDept: ${employee.userId.department}`}
                          </Text> */}
                          
                          {(employee.department === 'sales' || employee.userId?.department === 'sales') && (
                            <Tooltip label="Manage Commission">
                              <IconButton
                                icon={<AddIcon />}
                                size="xs"
                                colorScheme="green"
                                onClick={() => openCommissionModal(employee)}
                                sx={{
                                  minHeight: '20px',
                                  height: '20px',
                                  minWidth: '20px',
                                  width: '20px',
                                  fontSize: '2xs'
                                }}
                              />
                            </Tooltip>
                          )}
                          
                          {employee.status !== 'locked' && (
                            <>
                              {isHrUser() && (
                                <Tooltip label="HR Adjustment">
                                  <IconButton
                                    icon={<AddIcon />}
                                    size="xs"
                                    colorScheme="orange"
                                    onClick={() => openHrModal(employee)}
                                    sx={{
                                      minHeight: '20px',
                                      height: '20px',
                                      minWidth: '20px',
                                      width: '20px',
                                      fontSize: '2xs'
                                    }}
                                  />
                                </Tooltip>
                              )}
                              
                          {isFinanceUser() && (
                            <Tooltip label="Finance Adjustment">
                              <IconButton
                                icon={<AddIcon />}
                                size="xs"
                                colorScheme="purple"
                                onClick={() => openFinanceModal(employee)}
                                sx={{
                                  minHeight: '20px',
                                  height: '20px',
                                  minWidth: '20px',
                                  width: '20px',
                                  fontSize: '2xs'
                                }}
                              />
                            </Tooltip>
                          )}
                          
                          {canFinalizePayroll() && employee.status !== 'approved' && employee.status !== 'locked' && !String(employee._id).startsWith('placeholder-') && (
                            <Tooltip label="Finalize Payroll">
                              <IconButton
                                icon={<CheckIcon />}
                                size="xs"
                                colorScheme="teal"
                                onClick={() => finalizePayrollHandler(employee._id)}
                                sx={{
                                  minHeight: '20px',
                                  height: '20px',
                                  minWidth: '20px',
                                  width: '20px',
                                  fontSize: '2xs'
                                }}
                              />
                            </Tooltip>
                          )}
                          
                          {isAdminUser() && employee.status === 'finance_reviewed' && (
                                <Tooltip label="Approve">
                                  <IconButton
                                    icon={<CheckIcon />}
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => approvePayrollHandler(employee._id)}
                                    sx={{
                                      minHeight: '20px',
                                      height: '20px',
                                      minWidth: '20px',
                                      width: '20px',
                                      fontSize: '2xs'
                                    }}
                                  />
                                </Tooltip>
                              )}
                              
                              {isAdminUser() && employee.status === 'approved' && (
                                <Tooltip label="Lock">
                                  <IconButton
                                    icon={<LockIcon />}
                                    size="xs"
                                    colorScheme="red"
                                    onClick={() => lockPayrollHandler(employee._id)}
                                    sx={{
                                      minHeight: '20px',
                                      height: '20px',
                                      minWidth: '20px',
                                      width: '20px',
                                      fontSize: '2xs'
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                  
                  {/* Total Row */}
                  <Tr bg={headerBg} fontWeight="bold" color="white">
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      Total
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {payrollData.length} Employees
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + getDisplayGrossSalary(emp), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.incomeTax || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.pension || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (getDisplayGrossSalary(emp) * 0.11), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.overtimePay || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.salesCommission || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.financeAllowances || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.financeDeductions || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}>
                      {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0))}
                    </Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}></Td>
                    <Td py={1} px={2} fontSize="xs" borderTop="2px solid" borderColor={borderColor}></Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
            
            {payrollData.length === 0 && (
              <Flex justify="center" align="center" py={5}>
                <Text color="gray.500" fontSize="sm">No payroll data found for the selected filters</Text>
              </Flex>
            )}
          </CardBody>
        </Card>
        
        {/* HR Adjustment Modal */}
        <Modal isOpen={isHrModalOpen} onClose={() => setIsHrModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent maxW={{ base: "95%", md: "800px" }}>
            <ModalHeader fontSize="lg" fontWeight="bold" bg={headerBg} color="white" borderTopRadius="lg">
              HR Attendance Adjustment
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              {selectedEmployee && (
                <Box mb={4}>
                  <Text fontSize="sm"><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                  <Text fontSize="sm"><strong>Department:</strong> {selectedEmployee.department}</Text>
                </Box>
              )}
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} mb={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Daytime Overtime Hours (6am–10pm)</FormLabel>
                  <Input
                    type="number"
                    name="daytimeOvertimeHours"
                    value={hrFormData.daytimeOvertimeHours}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                    step="0.5"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Night Overtime Hours (10pm–6am)</FormLabel>
                  <Input
                    type="number"
                    name="nightOvertimeHours"
                    value={hrFormData.nightOvertimeHours}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                    step="0.5"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Rest Day Overtime Hours</FormLabel>
                  <Input
                    type="number"
                    name="restDayOvertimeHours"
                    value={hrFormData.restDayOvertimeHours}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                    step="0.5"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Public Holiday Overtime Hours</FormLabel>
                  <Input
                    type="number"
                    name="holidayOvertimeHours"
                    value={hrFormData.holidayOvertimeHours}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                    step="0.5"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Late Days</FormLabel>
                  <Input
                    type="number"
                    name="lateDays"
                    value={hrFormData.lateDays}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Absence Days</FormLabel>
                  <Input
                    type="number"
                    name="absenceDays"
                    value={hrFormData.absenceDays}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">HR Allowances</FormLabel>
                  <Input
                    type="number"
                    name="hrAllowances"
                    value={hrFormData.hrAllowances}
                    onChange={handleHrFormChange}
                    size="sm"
                    borderRadius="md"
                    min="0"
                  />
                </FormControl>
              </Grid>
            </ModalBody>
            
            <ModalFooter bg={cardBg} borderBottomRadius="lg">
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={submitHrAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit Adjustment
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsHrModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Finance Adjustment Modal */}
        <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="lg" fontWeight="bold" bg={headerBg} color="white" borderTopRadius="lg">
              Finance Adjustment
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              {selectedEmployee && (
                <Box mb={4}>
                  <Text fontSize="sm"><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                  <Text fontSize="sm"><strong>Department:</strong> {selectedEmployee.department}</Text>
                </Box>
              )}
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Finance Allowances</FormLabel>
                <Input
                  type="number"
                  name="financeAllowances"
                  value={financeFormData.financeAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Finance Deductions</FormLabel>
                <Input
                  type="number"
                  name="financeDeductions"
                  value={financeFormData.financeDeductions}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">HR Allowances</FormLabel>
                <Input
                  type="number"
                  name="hrAllowances"
                  value={financeFormData.hrAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
            </ModalBody>
            
            <ModalFooter bg={cardBg} borderBottomRadius="lg">
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={submitFinanceAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsFinanceModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        <Card mt={6} bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="lg" fontWeight="bold" color={headerColor}>Payroll History</Text>
              <Button size="sm" variant="ghost" onClick={fetchPayrollHistoryHandler} isLoading={historyLoading}>Refresh History</Button>
            </Flex>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={3} mb={4}>
              <FormControl>
                <FormLabel fontSize="xs">Username</FormLabel>
                <Input
                  value={historyFilters.username}
                  onChange={(e) => handleHistoryFilterChange('username', e.target.value)}
                  size="sm"
                  placeholder="Filter by name"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Month</FormLabel>
                <Input
                  type="month"
                  value={historyFilters.month}
                  onChange={(e) => handleHistoryFilterChange('month', e.target.value)}
                  size="sm"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Department</FormLabel>
                <Select
                  size="sm"
                  value={historyFilters.department}
                  onChange={(e) => handleHistoryFilterChange('department', e.target.value)}
                  placeholder="All departments"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                  ))}
                </Select>
              </FormControl>
              <Box display="flex" alignItems="flex-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHistoryFilters({ username: '', month: '', department: '' })}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>

            {historyError && (
              <Text fontSize="sm" color="red.500" mb={3}>{historyError}</Text>
            )}
            {historyLoading ? (
              <Flex justify="center" py={6}>
                <Spinner size="sm" color="teal.500" />
              </Flex>
            ) : filteredPayrollHistory.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th fontSize="xs" px={2} py={1}>Period</Th>
                      <Th fontSize="xs" px={2} py={1}>Employee</Th>
                      <Th fontSize="xs" px={2} py={1} isNumeric>Gross Salary</Th>
                      <Th fontSize="xs" px={2} py={1} isNumeric>Net Salary</Th>
                      <Th fontSize="xs" px={2} py={1} isNumeric>Gross Comm.</Th>
                      <Th fontSize="xs" px={2} py={1} isNumeric>Comm. Tax</Th>
                      <Th fontSize="xs" px={2} py={1} isNumeric>Net Comm.</Th>
                      <Th fontSize="xs" px={2} py={1}>Finalized By</Th>
                      <Th fontSize="xs" px={2} py={1}>Finalized At</Th>
                      <Th fontSize="xs" px={2} py={1}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPayrollHistory
                      .filter(entry => {
                        // Filter out entries with employeeName "." or ".."
                        return entry.employeeName !== "." && entry.employeeName !== "..";
                      })
                      .map((entry) => (
                      <Tr key={entry._id}>
                        <Td px={2} py={1} fontSize="xs">{entry.month} {entry.year}</Td>
                        <Td px={2} py={1} fontSize="xs">{entry.employeeName}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(entry.payrollData?.grossSalary || entry.payrollData?.basicSalary || entry.grossSalary || entry.basicSalary || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(entry.payrollData?.netSalary || entry.netSalary || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(entry.commissionData?.grossCommission || entry.grossCommission || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(entry.commissionData?.commissionTax || entry.commissionTax || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(entry.commissionData?.netCommission || entry.netCommission || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs">{entry.finalizedByName || entry.finalizedBy || 'Finance'}</Td>
                        <Td px={2} py={1} fontSize="xs">{entry.finalizedAt ? new Date(entry.finalizedAt).toLocaleDateString() : '?'}</Td>
                        <Td px={2} py={1} fontSize="xs">
                          <Tooltip label="View History Details">
                            <IconButton
                              size="xs"
                              icon={<ViewIcon />}
                              onClick={() => viewHistoryDetails(entry)}
                              colorScheme="teal"
                              aria-label="View history details"
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500">No payroll history records found. Finalize payroll records to see them in history.</Text>
            )}
          </CardBody>
        </Card>

        {/* Commission Modal */}
        <Modal isOpen={isCommissionModalOpen} onClose={() => setIsCommissionModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent maxW={{ base: "95%", md: "800px" }}>
            <ModalHeader fontSize="lg" fontWeight="bold" bg={headerBg} color="white" borderTopRadius="lg">
              Commission Management
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              {selectedEmployee && (
                <Box mb={4}>
                  <Text fontSize="sm"><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                  <Text fontSize="sm"><strong>Department:</strong> {selectedEmployee.department}</Text>
                  <Text fontSize="sm">
                    <strong>Period:</strong> 
                    {useDateRange && commissionDateRange.startDate && commissionDateRange.endDate
                      ? ` ${commissionDateRange.startDate} to ${commissionDateRange.endDate}`
                      : ` ${selectedMonth} ${selectedYear}`}
                  </Text>
                </Box>
              )}
              
              {selectedEmployee?.department === 'sales' && (
                <Box mb={4}>
                  {/* Date Selection Toggle */}
                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontSize="sm" fontWeight="bold">Date Selection</Text>
                    <Button 
                      size="xs" 
                      colorScheme={useDateRange ? "blue" : "gray"}
                      onClick={toggleDateSelection}
                    >
                      {useDateRange ? "Use Month/Year" : "Use Date Range"}
                    </Button>
                  </Flex>
                  
                  {useDateRange ? (
                    <Grid templateColumns="1fr 1fr" gap={3} mb={4}>
                      <FormControl>
                        <FormLabel fontSize="xs">Start Date</FormLabel>
                        <Input
                          type="date"
                          name="startDate"
                          value={commissionDateRange.startDate}
                          onChange={handleDateRangeChange}
                          size="sm"
                          borderRadius="md"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="xs">End Date</FormLabel>
                        <Input
                          type="date"
                          name="endDate"
                          value={commissionDateRange.endDate}
                          onChange={handleDateRangeChange}
                          size="sm"
                          borderRadius="md"
                          min={commissionDateRange.startDate}
                        />
                      </FormControl>
                    </Grid>
                  ) : (
                    <Text fontSize="sm" mb={4} color="gray.500">
                      Using month/year: {selectedMonth} {selectedYear}
                    </Text>
                  )}
                  
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" fontWeight="bold">Sales Data</Text>
                    <Button 
                      size="xs" 
                      colorScheme="teal" 
                      onClick={fetchSalesDataWithDateRange}
                      isLoading={loadingSales}
                    >
                      Refresh Sales Data
                    </Button>
                  </Flex>
                  
                  {loadingSales ? (
                    <Flex justify="center" py={4}>
                      <Spinner size="sm" />
                    </Flex>
                  ) : (
                    <div>
                      {/* Debug information */}
                      <div style={{ display: 'none' }}>
                        {console.log('=== COMMISSION MODAL RENDER DEBUG ===')}
                        {console.log('salesData state:', salesData)}
                        {console.log('salesData length:', salesData?.length)}
                        {console.log('salesData type:', typeof salesData)}
                        {salesData && salesData.forEach((sale, index) => {
                          console.log(`Sale ${index + 1} in salesData:`, {
                            customerName: sale.customerName,
                            coursePrice: sale.coursePrice,
                            grossCommission: sale.grossCommission,
                            commissionTax: sale.commissionTax,
                            netCommission: sale.netCommission,
                            commission: sale.commission
                          });
                        })}
                      </div>
                      
                      {salesData && salesData.length > 0 ? (
                        <Box maxHeight="200px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={2}>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th px={2} py={1} fontSize="xs">Customer</Th>
                                <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                                <Th px={2} py={1} fontSize="xs" isNumeric>Gross</Th>
                                <Th px={2} py={1} fontSize="xs" isNumeric>Social Media Boost</Th>
                                <Th px={2} py={1} fontSize="xs" isNumeric>Net</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {salesData.map((sale, index) => (
                                <Tr key={index}>
                                  <Td px={2} py={1} fontSize="xs">{sale.customerName}</Td>
                                  <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.saleAmount ?? sale.coursePrice ?? 0)}</Td>
                                  <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.grossCommission || 0)}</Td>
                                  <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.commissionTax || 0)}</Td>
                                  <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.netCommission || 0)}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text fontSize="sm" color="gray.500">No sales data found for this period</Text>
                      )}
                    </div>
                  )}

                </Box>
              )}
              
              <Grid templateColumns="1fr 1fr 1fr" gap={4} mb={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Number of Sales</FormLabel>
                  <Input
                    type="number"
                    name="numberOfSales"
                    value={commissionFormData.numberOfSales}
                    onChange={handleCommissionFormChange}
                    size="sm"
                    borderRadius="md"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Gross Commission</FormLabel>
                  <Input
                    type="number"
                    name="grossCommission"
                    value={commissionFormData.grossCommission || 0}
                    onChange={handleCommissionFormChange}
                    size="sm"
                    borderRadius="md"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Net Commission</FormLabel>
                  <Input
                    type="number"
                    name="totalCommission"
                    value={commissionFormData.totalCommission}
                    onChange={handleCommissionFormChange}
                    size="sm"
                    borderRadius="md"
                  />
                </FormControl>
              </Grid>
              
              <Text fontSize="sm" fontWeight="bold" mb={2}>Commission Details</Text>
              {commissionFormData.commissionDetails && commissionFormData.commissionDetails.length > 0 ? (
                <Box maxHeight="150px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={2} mb={4}>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th px={2} py={1} fontSize="xs">Customer</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Gross</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Social Media Boost</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Net</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {commissionFormData.commissionDetails.map((detail, index) => (
                        <Tr key={index}>
                          <Td px={2} py={1} fontSize="xs">{detail.customerName}</Td>
                          <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.saleAmount || 0)}</Td>
                          <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.grossCommission || 0)}</Td>
                          <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.commissionTax || 0)}</Td>
                          <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.netCommission || 0)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500" mb={4}>No commission details added</Text>
              )}
            </ModalBody>
            
            <ModalFooter bg={cardBg} borderBottomRadius="lg">
              {hasStoredCommission && (
                <Button
                  variant="outline"
                  colorScheme="red"
                  size="sm"
                  mr="auto"
                  onClick={clearCommissionHandler}
                  isLoading={clearingCommission}
                >
                  Clear Saved Commission
                </Button>
              )}
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={submitCommissionHandler}
                size="sm"
                px={6}
              >
                Save Commission
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsCommissionModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
  );

  return wrapLayout ? <Layout>{pageContent}</Layout> : pageContent;
};

// Stat Card Component
const StatCard = ({ title, value, color, isBold = false }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg" border="1px solid" borderColor={borderColor}>
      <CardBody py={4} px={5}>
        <Stat>
          <StatLabel fontSize={{ base: "xs", md: "sm" }} color="gray.500" mb={1}>
            {title}
          </StatLabel>
          <StatNumber 
            fontSize={{ base: "md", md: "lg" }} 
            color={color} 
            fontWeight={isBold ? "bold" : "normal"}
          >
            {value}
          </StatNumber>
        </Stat>
      </CardBody>
    </Card>
  );
};

export default PayrollPage;
