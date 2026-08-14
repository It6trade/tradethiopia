import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  useToast, 
  Spinner, 
  Flex, 
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { 
  FiUser, 
  FiPhone, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiDollarSign,
  FiClock,
  FiDownload,
  FiUpload
} from 'react-icons/fi';
import FollowupCustomerTable from './FollowupCustomerTable';
import PackageSalesTable from './PackageSalesTable';
import PackageSalesTab from './PackageSalesTab';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/customerService';
import { fetchExternalCourses as fetchCoursesApi } from '../../services/api';
import axios from '../../services/axiosInstance';

const defaultCourses = [
  { _id: 'external-seed-0', name: 'International Trade Import Export', price: 0 },
  { _id: 'external-seed-1', name: 'Stock Market Trading', price: 0 },
  { _id: 'external-seed-2', name: 'Data Science', price: 0 },
  { _id: 'external-seed-3', name: 'Coffee Cupping', price: 0 },
  { _id: 'external-seed-4', name: 'TradeEthiopia Business TV & Radio', price: 0 },
  { _id: 'external-seed-5', name: 'Digital Marketing for International Trade', price: 0 },
  { _id: 'external-seed-6', name: 'International Trade Brokerage', price: 0 },
];

const FollowupPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    active: 0,
    completedDeals: 0,
    calledCustomers: 0,
    totalCommission: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    callStatus: '',
    followupStatus: '',
    sortBy: 'date'
  });
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [exportColumns, setExportColumns] = useState({
    'Customer Name': true,
    'Contact Title': true,
    'Phone': true,
    'Call Status': true,
    'Follow-up Status': true,
    'Schedule': true,
    'Date': true,
    'Email': true,
    'Note': true,
    'Supervisor Comment': true
  });
  const toast = useToast();

  // Date filter states
  const [dateFilterType, setDateFilterType] = useState('All'); // All | DateRange | Week | Year
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekValue, setWeekValue] = useState(''); // yyyy-Www
  const [yearValue, setYearValue] = useState('');
  const [courses, setCourses] = useState(defaultCourses);
  const [isImportingCustomers, setIsImportingCustomers] = useState(false);
  const customerImportRef = useRef(null);

  const headerColor = useColorModeValue('gray.700', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    // Load customers first so client-side prospect count is computed correctly,
    // then fetch server stats to merge, avoiding overwriting with stale local state.
    const init = async () => {
      await Promise.all([fetchCustomers(), fetchStats(), loadCourses()]);
    };
    init();
  }, []);

  useEffect(() => {
    const total = computeTotalCommission(customers);
    setStats(prev => ({ ...prev, totalCommission: total }));
  }, [customers]);

  // active tab: customers only (product followups removed)
  const [activeTab, setActiveTab] = useState('customers');

  const loadCourses = async () => {
    try {
      const data = await fetchCoursesApi();
      const normalized = (Array.isArray(data) ? data : []).map(course => {
        const name = course?.name || course?.title || course?.courseName;
        if (!name) return null;
        const priceRaw = course?.price ?? course?.amount ?? course?.cost ?? 0;
        const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw) || 0;
        return {
          _id: course?._id || course?.id || name.toLowerCase().replace(/\s+/g, '-'),
          name,
          price
        };
      }).filter(Boolean);
      setCourses(normalized.length ? normalized : defaultCourses);
    } catch (err) {
      console.error('Error fetching courses for training dropdown:', err);
      setCourses(defaultCourses);
    }
  };

  const computeTotalCommission = (items = []) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, customer) => {
      if (!customer || customer.followupStatus !== 'Completed') return sum;
      const netCommission = Number(customer?.commission?.netCommission ?? 0);
      return sum + (Number.isFinite(netCommission) ? netCommission : 0);
    }, 0);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/sales-customers/stats');
      // Merge server stats while keeping any client-derived values (like totalCommission)
      setStats(prev => ({ ...prev, ...response.data }));
      try {
          const prospectCount = (customers || []).filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
          setStats(prev => ({ ...prev, new: prospectCount }));
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      // Map the data to match the expected structure in the table
      const mappedData = data.map(customer => ({
        ...customer,
        contactTitle: customer.contactTitle || customer.courseName || '',
        _id: customer._id,
        id: customer._id,
        date: customer.date || customer.createdAt || new Date().toISOString(),
        schedulePreference: customer.schedulePreference || customer.schedule || 'Regular'
      }));
      setCustomers(mappedData);
      // compute active prospects locally (followupStatus === 'Prospect')
      try {
            const prospectCount = mappedData.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
            setStats(prev => ({ ...prev, new: prospectCount }));
      } catch (err) {
        // ignore
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers: ' + err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (customerData) => {
    const payload = { ...customerData };
    if (!payload.customerName || !payload.customerName.trim()) {
      payload.customerName = payload.contactTitle || 'New Customer';
    }
    payload.callStatus = payload.callStatus || 'Not Called';
    payload.followupStatus = payload.followupStatus || 'Pending';
    payload.schedulePreference = payload.schedulePreference || 'Regular';
    // Backend expects commission to be an ObjectId; drop client-calculated object to avoid cast errors
    if (payload.commission && typeof payload.commission !== 'string') {
      delete payload.commission;
    }

    const temporaryId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingCustomer = {
      ...payload,
      _id: temporaryId,
      id: temporaryId,
      date: new Date().toISOString(),
      _saving: true,
    };
    setCustomers((previous) => [...previous, pendingCustomer]);

    try {
      const newCustomer = await createCustomer(payload);
      // Map the new customer to match the expected structure
      const mappedCustomer = {
        ...newCustomer,
        _id: newCustomer._id,
        id: newCustomer._id,
        date: newCustomer.date || newCustomer.createdAt || new Date().toISOString(),
        schedulePreference: newCustomer.schedulePreference || newCustomer.schedule || 'Regular'
      };
      setCustomers(prev => {
        const next = prev.map((customer) => customer.id === temporaryId ? mappedCustomer : customer);
        // update active prospects count
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        return next;
      });
      // Refresh stats
      fetchStats();
      // No success toast - handled with visual indicator in table
    } catch (err) {
      setCustomers((previous) => previous.filter((customer) => customer.id !== temporaryId));
      toast({
        title: "Error adding customer",
        description: err.message || "Failed to add customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddProduct = async (data) => {
    try {
      const newItem = await createProductFollowup(data);
      const mapped = { ...newItem, _id: newItem._id, id: newItem._id, date: newItem.date || newItem.createdAt || new Date().toISOString(), schedulePreference: newItem.schedulePreference || 'Regular' };
      setProductFollowups(prev => [...prev, mapped]);
    } catch (err) {
      toast({ title: 'Error adding product followup', description: err.message || 'Failed to add', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleUpdate = async (id, customerData) => {
    // Optimistic update: apply change locally immediately
    let previousCustomers;
    try {
      setCustomers(prev => {
        previousCustomers = prev;
        const next = prev.map(cust => cust.id === id ? { ...cust, ...customerData } : cust);
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        return next;
      });

      // Fire the API update in background
      const updatedCustomer = await updateCustomer(id, customerData);
      // Reconcile with server response (ensure ids and dates are normalized)
      const mappedCustomer = {
        ...updatedCustomer,
        _id: updatedCustomer._id,
        id: updatedCustomer._id,
        date: updatedCustomer.date || updatedCustomer.createdAt || new Date().toISOString(),
        schedulePreference: updatedCustomer.schedulePreference || updatedCustomer.schedule || 'Regular'
      };
      setCustomers(prev => prev.map(cust => cust.id === id ? mappedCustomer : cust));
      // Refresh stats after successful save
      fetchStats();
    } catch (err) {
      // Revert optimistic update on error
      if (previousCustomers) setCustomers(previousCustomers);
      toast({
        title: "Error updating customer",
        description: err.message || "Failed to update customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => {
        const next = prev.filter(cust => cust.id !== id);
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        return next;
      });
      // Refresh stats
      fetchStats();
      // No success toast - handled with visual indicator in table
    } catch (err) {
      toast({
        title: "Error deleting customer",
        description: err.message || "Failed to delete customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProductFollowup(id);
      setProductFollowups(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast({ title: 'Error deleting product followup', description: err.message || 'Failed to delete', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleUpdateProduct = async (id, data) => {
    let previous;
    try {
      setProductFollowups(prev => {
        previous = prev;
        return prev.map(p => p._id === id ? { ...p, ...data } : p);
      });
      const updated = await updateProductFollowup(id, data);
      const mapped = { ...updated, _id: updated._id, id: updated._id, date: updated.date || updated.createdAt || new Date().toISOString(), schedulePreference: updated.schedulePreference || 'Regular' };
      setProductFollowups(prev => prev.map(p => p._id === id ? mapped : p));
    } catch (err) {
      if (previous) setProductFollowups(previous);
      toast({ title: 'Error updating product followup', description: err.message || 'Failed to update', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Filter customers based on filters
  const normalizeStatus = (value) => {
    if (value == null) return '';
    return value.toString().trim().toLowerCase();
  };

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm)) ||
        (customer.contactTitle && customer.contactTitle.toLowerCase().includes(searchTerm)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm));
      if (!matchesSearch) return false;
    }
    const followupStatusNormalized = normalizeStatus(customer.followupStatus);
    if (followupStatusNormalized === 'imported') {
      return false;
    }

    // Call status filter
    if (filters.callStatus && customer.callStatus !== filters.callStatus) {
      return false;
    }
    
    // Follow-up status filter
    if (filters.followupStatus) {
      const filterStatusNormalized = normalizeStatus(filters.followupStatus);
      if (filterStatusNormalized === 'not imported') {
        if (followupStatusNormalized === 'imported') {
          return false;
        }
      } else if (followupStatusNormalized !== filterStatusNormalized) {
        return false;
      }
    }
    // Schedule filter
    if (scheduleFilter && (customer.schedulePreference || '') !== scheduleFilter) {
      return false;
    }
    
    return true;
  });

  // Apply optional date-based filtering on top of the current filters
  const normalizeDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const weekToRange = (weekStr) => {
    if (!weekStr) return [null, null];
    // weekStr is like 2025-W48 or 2025-W48
    const parts = weekStr.split('-W');
    if (parts.length !== 2) return [null, null];
    const year = parseInt(parts[0], 10);
    const week = parseInt(parts[1], 10);
    if (!year || !week) return [null, null];
    // Calculate ISO week start (Monday)
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay();
    const diff = (dow <= 4 ? dow - 1 : dow - 8);
    const weekStart = new Date(simple);
    weekStart.setUTCDate(simple.getUTCDate() - diff);
    const start = new Date(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  };

  const applyDateFilter = (items) => {
    if (!items) return [];
    if (dateFilterType === 'All') return items;
    return items.filter(item => {
      const itemDate = normalizeDate(item.date || item.createdAt || item.updatedAt);
      if (!itemDate) return false;
      if (dateFilterType === 'DateRange') {
        const s = normalizeDate(startDate);
        const e = normalizeDate(endDate);
        if (!s || !e) return true; // if incomplete inputs, don't block
        return itemDate >= s && itemDate <= e;
      }
      if (dateFilterType === 'Day') {
        const d = normalizeDate(startDate);
        if (!d) return true;
        return itemDate.getTime() === d.getTime();
      }
      if (dateFilterType === 'Week') {
        const [s, e] = weekToRange(weekValue);
        if (!s || !e) return true;
        return itemDate >= s && itemDate <= e;
      }
      if (dateFilterType === 'Year') {
        const y = parseInt(yearValue, 10);
        if (!y) return true;
        return itemDate.getFullYear() === y;
      }
      return true;
    });
  };

  const dateFilteredCustomers = applyDateFilter(filteredCustomers);

  // Sort customers
  const sortedCustomers = [...dateFilteredCustomers].sort((a, b) => {
    if (filters.sortBy === 'name') {
      return a.customerName.localeCompare(b.customerName);
    } else if (filters.sortBy === 'callStatus') {
      return a.callStatus.localeCompare(b.callStatus);
    } else if (filters.sortBy === 'followupStatus') {
      return a.followupStatus.localeCompare(b.followupStatus);
    } else {
      // Default sort by date (newest first)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    }
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const normalizeEnumValue = (value, allowed) => {
    if (value === null || value === undefined || value === '') return undefined;
    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) return undefined;
    return allowed.find(option => option.toLowerCase() === normalized);
  };

  const parseImportedNumber = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const getImportValue = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return '';
  };

  const buildImportedCustomer = (row) => {
    const customerNameRaw = getImportValue(row, ['Customer Name', 'customerName', 'Customer', 'Name', 'Client Name', 'Company', 'Company Name']);
    const contactTitleRaw = getImportValue(row, ['Contact Title', 'contactTitle', 'Training', 'Course', 'Course Name', 'Product', 'Interest']);
    const emailRaw = getImportValue(row, ['Email', 'email']);
    const phoneRaw = getImportValue(row, ['Phone', 'phone', 'Phone Number', 'Mobile', 'Contact Phone']);
    const noteRaw = getImportValue(row, ['Note', 'Notes', 'note']);
    const supervisorCommentRaw = getImportValue(row, ['Supervisor Comment', 'supervisorComment']);
    const callStatusRaw = getImportValue(row, ['Call Status', 'callStatus']);
    const followupStatusRaw = getImportValue(row, ['Follow-up Status', 'Followup Status', 'Status', 'followupStatus']);
    const scheduleRaw = getImportValue(row, ['Schedule', 'Schedule Preference', 'schedulePreference']);
    const packageScopeRaw = getImportValue(row, ['Package Scope', 'packageScope', 'Scope']);
    const pipelineStatusRaw = getImportValue(row, ['Pipeline Status', 'pipelineStatus', 'Workflow Status']);
    const sourceRaw = getImportValue(row, ['Source', 'source']);
    const courseNameRaw = getImportValue(row, ['Course Name', 'Course', 'Training', 'contactTitle']);
    const coursePriceRaw = getImportValue(row, ['Course Price', 'coursePrice', 'Price', 'Amount', 'Fee']);
    const productInterestRaw = getImportValue(row, ['Product Interest', 'productInterest', 'Interest']);

    const fallbackName = customerNameRaw || contactTitleRaw || courseNameRaw || emailRaw || phoneRaw;
    if (!fallbackName) return null;

    const customerName = fallbackName.toString().trim();
    if (!customerName) return null;

    const payload = {
      customerName,
      contactTitle: contactTitleRaw ? contactTitleRaw.toString().trim() : undefined,
      email: emailRaw ? emailRaw.toString().trim().toLowerCase() : undefined,
      phone: phoneRaw ? phoneRaw.toString().trim() : undefined,
      note: noteRaw ? noteRaw.toString().trim() : undefined,
      supervisorComment: supervisorCommentRaw ? supervisorCommentRaw.toString().trim() : undefined,
      callStatus: normalizeEnumValue(callStatusRaw, ['Called', 'Not Called', 'Busy', 'No Answer', 'Callback', '2x Called']),
      followupStatus: normalizeEnumValue(followupStatusRaw, ['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled']),
      schedulePreference: normalizeEnumValue(scheduleRaw, ['Regular', 'Weekend', 'Night', 'Online']),
      packageScope: normalizeEnumValue(packageScopeRaw, ['Local', 'International']),
      pipelineStatus: normalizeEnumValue(pipelineStatusRaw, ['New', 'Pending Assignment', 'Assigned', 'In Progress', 'Closed']),
      source: normalizeEnumValue(sourceRaw, ['Reception', 'Sales', 'Followup', 'Other']),
      courseName: courseNameRaw ? courseNameRaw.toString().trim() : undefined,
      coursePrice: parseImportedNumber(coursePriceRaw),
      productInterest: productInterestRaw ? productInterestRaw.toString().trim() : undefined
    };

    return Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== undefined && value !== ''));
  };

  const runBatch = async (items, batchSize, worker) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const settled = await Promise.allSettled(batch.map(worker));
      results.push(...settled);
    }
    return results;
  };

  const handleImportCustomers = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingCustomers(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error('No worksheet found in the selected file.');
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      if (!rows.length) {
        toast({
          title: 'No rows found',
          description: 'The selected file does not contain any rows to import.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      const payloads = rows.map(buildImportedCustomer).filter(Boolean);
      if (!payloads.length) {
        toast({
          title: 'Nothing to import',
          description: 'No valid customer rows were found. Please check your column headers.',
          status: 'warning',
          duration: 3500,
          isClosable: true
        });
        return;
      }

      const results = await runBatch(payloads, 10, (payload) => createCustomer(payload));
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      const skippedCount = rows.length - payloads.length;

      await Promise.all([fetchCustomers(), fetchStats()]);

      toast({
        title: 'Import complete',
        description: `Imported ${successCount} row(s). ${skippedCount ? `Skipped ${skippedCount}. ` : ''}${failureCount ? `Failed ${failureCount}.` : ''}`.trim(),
        status: failureCount ? 'warning' : 'success',
        duration: 4000,
        isClosable: true
      });
    } catch (err) {
      console.error('Customer import failed', err);
      toast({
        title: 'Import failed',
        description: err.message || 'Unable to import the selected file.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsImportingCustomers(false);
      event.target.value = '';
    }
  };

  // Export currently visible rows to XLSX (try sheetjs, fallback to CSV)
  const exportVisible = async () => {
    const allRows = sortedCustomers.map(c => ({
      'Customer Name': c.customerName || '',
      'Contact Title': c.contactTitle || '',
      Phone: c.phone || '',
      'Call Status': c.callStatus || '',
      'Follow-up Status': c.followupStatus || '',
      Schedule: c.schedulePreference || '',
      Date: c.date ? new Date(c.date).toLocaleString() : '',
      Email: c.email || '',
      Note: c.note || '',
      'Supervisor Comment': c.supervisorComment || ''
    }));

    const rows = allRows.map(r => {
      const filtered = {};
      Object.keys(exportColumns).forEach(col => {
        if (exportColumns[col]) filtered[col] = r[col];
      });
      return filtered;
    });

    // Try to use xlsx if it's installed
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Followups');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `followups_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export ready', description: 'Downloaded Excel file.', status: 'success', duration: 3000, isClosable: true });
      return;
    } catch (err) {
      // fall back to CSV
      try {
        const csvRows = [];
        const headers = Object.keys(rows[0] || {});
        csvRows.push(headers.join(','));
        for (const r of rows) {
          const line = headers.map(h => {
            const val = (r[h] ?? '').toString().replace(/"/g, '""');
            return `"${val}"`;
          }).join(',');
          csvRows.push(line);
        }
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `followups_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast({ title: 'Export ready', description: 'Downloaded CSV file (Excel-compatible).', status: 'info', duration: 3000, isClosable: true });
        return;
      } catch (err2) {
        console.error('Export failed', err2);
        toast({ title: 'Export failed', description: 'Could not export data.', status: 'error', duration: 4000, isClosable: true });
      }
    }
  };

  return (
    <Box pt={4}>
      {/* <Heading 
        as="h1" 
        size={{ base: "lg", md: "xl" }} 
        color={headerColor}
        textAlign={{ base: "center", md: "left" }}
        fontWeight="bold"
        mb={6}
      >
        Sales Dashboard
      </Heading> */}
      
      {/* Stats Overview */}
      <SimpleGrid 
        columns={{ base: 1, sm: 2, md: 2, lg: 5 }} 
        spacing={{ base: 4, md: 6 }} 
        mb={{ base: 6, md: 8 }}
      >
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="blue.100"
                  color="blue.500"
                  mr={3}
                >
                  <Icon as={FiUser} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Total Customers
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="blue.500" mt={0}>
                    {stats.total}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.100"
                  color="green.500"
                  mr={3}
                >
                  <Icon as={FiCheckCircle} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Completed Deals
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="green.500" mt={0}>
                    {stats.completedDeals}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="yellow.100"
                  color="yellow.600"
                  mr={3}
                >
                  <Icon as={FiDollarSign} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Total Commission
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="yellow.600" mt={0}>
                    ETB {typeof stats.totalCommission === 'number' ? stats.totalCommission.toFixed(2) : '0.00'}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color={secondaryTextColor}>from all sales</StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="purple.100"
                  color="purple.500"
                  mr={3}
                >
                  <Icon as={FiPhone} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Called Customers
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="purple.500" mt={0}>
                    {stats.calledCustomers}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="teal.100"
                  color="teal.500"
                  mr={3}
                >
                  <Icon as={FiTrendingUp} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    New Prospects
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="teal.500" mt={0}>
                    {stats.new}
                  </StatNumber>
                  <StatHelpText mt={1} fontSize="xs">
                    <StatArrow type='increase' />
                    {stats.total > 0 ? Math.round((stats.new / stats.total) * 100) : 0}% this month
                  </StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters and Search */}
      <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" mb={6}>
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          wrap="wrap" 
          gap={4} 
          align="center"
        >
          <InputGroup width={{ base: '100%', md: '250px' }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search prospects..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputGroup>
          
          <Select 
            width={{ base: '100%', md: '150px' }} 
            placeholder="Call Status"
            value={filters.callStatus}
            onChange={(e) => handleFilterChange('callStatus', e.target.value)}
          >
            <option value="Called">Called</option>
            <option value="Not Called">Not Called</option>
            <option value="Busy">Busy</option>
            <option value="No Answer">No Answer</option>
            <option value="Callback">Callback</option>
            <option value="2x Called">2x Called</option>
          </Select>
          
          <Select 
            width={{ base: '100%', md: '150px' }} 
            placeholder="Follow-up Status"
            value={filters.followupStatus}
            onChange={(e) => handleFilterChange('followupStatus', e.target.value)}
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Not Imported">Not Imported</option>
          </Select>
          
          <Select 
            width={{ base: '100%', md: '150px' }} 
            placeholder="Sort By"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="callStatus">Call Status</option>
            <option value="followupStatus">Follow-up Status</option>
          </Select>

          <Select width={{ base: '100%', md: '150px' }} placeholder="Schedule" value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}>
            <option value="">All Schedules</option>
            <option value="Regular">Regular</option>
            <option value="Weekend">Weekend</option>
            <option value="Night">Night</option>
            <option value="Online">Online</option>
          </Select>

          {/* Date filters: All, Date Range, Week, Year */}
          <Select width={{ base: '100%', md: '150px' }} value={dateFilterType} onChange={(e) => setDateFilterType(e.target.value)}>
            <option value="All">All Dates</option>
            <option value="DateRange">Date Range</option>
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Year">Year</option>
          </Select>

          {dateFilterType === 'DateRange' && (
            <>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} width={{ base: '100%', md: '150px' }} />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} width={{ base: '100%', md: '150px' }} />
            </>
          )}

          {dateFilterType === 'Day' && (
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }} width={{ base: '100%', md: '150px' }} />
          )}

          {dateFilterType === 'Week' && (
            <Input type="week" value={weekValue} onChange={(e) => setWeekValue(e.target.value)} width={{ base: '100%', md: '150px' }} />
          )}

          {dateFilterType === 'Year' && (
            <Input type="number" placeholder="Year" value={yearValue} onChange={(e) => setYearValue(e.target.value)} width={{ base: '100%', md: '120px' }} />
          )}

          <Menu>
            <MenuButton as={Button} colorScheme="teal" leftIcon={<Icon as={FiDownload} />} type="button">
              Export
            </MenuButton>
            <MenuList minW="220px">
              {Object.keys(exportColumns).map(col => (
                <MenuItem key={col} minH="40px" closeOnSelect={false}>
                  <Checkbox isChecked={exportColumns[col]} onChange={(e) => setExportColumns(prev => ({ ...prev, [col]: e.target.checked }))}>
                    {col}
                  </Checkbox>
                </MenuItem>
              ))}
              <MenuItem closeOnSelect={false}>
                <Box display="flex" gap={2}>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setExportColumns(Object.keys(exportColumns).reduce((acc, c) => (acc[c]=true, acc), {}))}>Select All</Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setExportColumns(Object.keys(exportColumns).reduce((acc, c) => (acc[c]=false, acc), {}))}>Clear</Button>
                </Box>
              </MenuItem>
              <MenuItem closeOnSelect={false}>
                <Button colorScheme="teal" size="sm" type="button" onClick={exportVisible}>Download</Button>
              </MenuItem>
            </MenuList>
          </Menu>

          <Button
            leftIcon={<Icon as={FiUpload} />}
            colorScheme="blue"
            variant="outline"
            type="button"
            onClick={() => customerImportRef.current?.click()}
            isLoading={isImportingCustomers}
            isDisabled={isImportingCustomers}
          >
            Import Excel
          </Button>
          <input
            ref={customerImportRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportCustomers}
            style={{ display: 'none' }}
          />

          <Button onClick={() => { setDateFilterType('All'); setStartDate(''); setEndDate(''); setWeekValue(''); setYearValue(''); }} variant="ghost">Clear Date</Button>
        </Flex>
      </Box>

      <Box bg="white" p={0} borderRadius="lg" boxShadow="md" w="100%" maxW="100%">
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Customer Followups</Tab>
            <Tab>Package Sales</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" color="teal.500" thickness="4px" />
                </Flex>
              ) : error ? (
                <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
                  <Text color="red.500" fontWeight="medium">{error}</Text>
                </Box>
              ) : (
                <FollowupCustomerTable
                  customers={sortedCustomers}
                  courses={courses}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onAdd={handleAdd}
                />
              )}
            </TabPanel>
            <TabPanel p={4}>
              <PackageSalesTab />
            </TabPanel>
          </TabPanels>        </Tabs>
      </Box>
    </Box>
  );
};

export default FollowupPage;
