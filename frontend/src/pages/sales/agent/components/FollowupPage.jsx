import React, { useState, useEffect, useRef } from 'react';
import { 
  FiUser, 
  FiPhone, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiDollarSign,
  FiClock,
  FiDownload,
  FiUpload,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiRotateCcw,
  FiUsers,
  FiBriefcase,
  FiBell,
  FiBellOff
} from 'react-icons/fi';
import FollowupCustomerTable from './FollowupCustomerTable';
import PackageSalesTab from './PackageSalesTab';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../../../services/customerService';
import { fetchExternalCourses as fetchCoursesApi } from '../../../../services/api';
import axios from '../../../../services/axiosInstance';
import { useUserStore } from '../../../../store/user';
import { useNotifications } from '../../../../hooks/useNotifications';
import { useSearchStore } from '../../../../store/search';

const defaultCourses = [
  { _id: 'external-seed-0', name: 'International Trade Import Export', price: 0 },
  { _id: 'external-seed-1', name: 'Stock Market Trading', price: 0 },
  { _id: 'external-seed-2', name: 'Data Science', price: 0 },
  { _id: 'external-seed-3', name: 'Coffee Cupping', price: 0 },
  { _id: 'external-seed-4', name: 'TradeEthiopia Business TV & Radio', price: 0 },
  { _id: 'external-seed-5', name: 'Digital Marketing for International Trade', price: 0 },
  { _id: 'external-seed-6', name: 'International Trade Brokerage', price: 0 },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'ETB 0.00';
  return `ETB ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FollowupPage = () => {
  const currentUser = useUserStore(state => state.currentUser);
  const [customers, setCustomers] = useState([]);
  const pushNotification = useNotifications(customers);
  const searchQuery = useSearchStore(state => state.searchQuery);
  const setSearchQuery = useSearchStore(state => state.setSearchQuery);
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
    callStatus: '',
    followupStatus: '',
    sortBy: 'date'
  });
  const [scheduleFilter, setScheduleFilter] = useState('');
  
  // Custom states for Tailwind select column dropdown
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

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

  // Date filter states
  const [dateFilterType, setDateFilterType] = useState('All'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekValue, setWeekValue] = useState(''); 
  const [yearValue, setYearValue] = useState('');
  const [courses, setCourses] = useState(defaultCourses);
  const [isImportingCustomers, setIsImportingCustomers] = useState(false);
  const customerImportRef = useRef(null);
  const [activeTab, setActiveTab] = useState('customers'); // customers | packageSales

  // Smart pipeline tab within the Customers panel
  const [pipelineTab, setPipelineTab] = useState('all'); // all | today | week | coldcall | warm | completed
  const [leadSourceFilter, setLeadSourceFilter] = useState('');
  // Custom Toast notification states
  const [toasts, setToasts] = useState([]);
  const showNotification = (title, description, status = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, status }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const clickOutsideExport = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutsideExport);
    return () => document.removeEventListener("mousedown", clickOutsideExport);
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchCustomers(), fetchStats(), loadCourses()]);
    };
    init();
  }, []);

  useEffect(() => {
    const total = computeTotalCommission(customers);
    setStats(prev => ({ ...prev, totalCommission: total }));
  }, [customers]);

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
      setStats(prev => ({ ...prev, ...response.data }));
      try {
          const prospectCount = (customers || []).filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
          setStats(prev => ({ ...prev, new: prospectCount }));
      } catch (err) {}
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      const mappedData = data.map(customer => ({
        ...customer,
        contactTitle: customer.contactTitle || customer.courseName || '',
        _id: customer._id,
        id: customer._id,
        date: customer.date || customer.createdAt || new Date().toISOString(),
        schedulePreference: customer.schedulePreference || customer.schedule || 'Regular'
      }));
      setCustomers(mappedData);
      try {
            const prospectCount = mappedData.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
            setStats(prev => ({ ...prev, new: prospectCount }));
      } catch (err) {}
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
    if (payload.commission && typeof payload.commission !== 'string') {
      delete payload.commission;
    }

    try {
      const newCustomer = await createCustomer(payload);
      const mappedCustomer = {
        ...newCustomer,
        _id: newCustomer._id,
        id: newCustomer._id,
        date: newCustomer.date || newCustomer.createdAt || new Date().toISOString(),
        schedulePreference: newCustomer.schedulePreference || newCustomer.schedule || 'Regular'
      };
      setCustomers(prev => {
        const next = [...prev, mappedCustomer];
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        return next;
      });
      fetchStats();
    } catch (err) {
      showNotification("Error adding customer", err.message || "Failed to add customer", "error");
    }
  };

  const handleUpdate = async (id, customerData) => {
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

      const updatedCustomer = await updateCustomer(id, customerData);
      const mappedCustomer = {
        ...updatedCustomer,
        _id: updatedCustomer._id,
        id: updatedCustomer._id,
        date: updatedCustomer.date || updatedCustomer.createdAt || new Date().toISOString(),
        schedulePreference: updatedCustomer.schedulePreference || updatedCustomer.schedule || 'Regular'
      };
      setCustomers(prev => prev.map(cust => cust.id === id ? mappedCustomer : cust));
      fetchStats();
    } catch (err) {
      if (previousCustomers) setCustomers(previousCustomers);
      showNotification("Error updating customer", err.message || "Failed to update customer", "error");
    }
  };

  const handleDelete = async (id) => {
    let previousCustomers;
    try {
      setCustomers(prev => {
        previousCustomers = prev;
        const next = prev.filter(cust => cust.id !== id);
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        return next;
      });
      await deleteCustomer(id);
      fetchStats();
    } catch (err) {
      if (previousCustomers) setCustomers(previousCustomers);
      showNotification("Error deleting customer", err.message || "Failed to delete customer", "error");
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const normalizeStatus = (value) => {
    if (value == null) return '';
    return value.toString().trim().toLowerCase();
  };

  const normalizeDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const weekToRange = (weekStr) => {
    if (!weekStr) return [null, null];
    const parts = weekStr.split('-W');
    if (parts.length !== 2) return [null, null];
    const year = parseInt(parts[0], 10);
    const week = parseInt(parts[1], 10);
    if (!year || !week) return [null, null];
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

  // Filter prospects
  const dateFilteredCustomers = React.useMemo(() => {
    const userRoleNormalized = (currentUser?.role || '').toString().trim().toLowerCase();
    const isPrivileged = [
      'admin', 'customerservice', 'customer service', 'customersuccessmanager', 
      'customer success manager', 'customer_success_manager', 'coo', 'salesmanager', 
      'sales_manager', 'sales manager', 'finance', 'reception'
    ].includes(userRoleNormalized);

    const baseCustomers = isPrivileged || !currentUser?._id
      ? customers 
      : customers.filter(c => c.agentId === currentUser._id || c.agentId?.toString() === currentUser._id.toString());

    const items = baseCustomers.filter(customer => {
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
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
      if (filters.callStatus && customer.callStatus !== filters.callStatus) {
        return false;
      }
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
      if (scheduleFilter && (customer.schedulePreference || '') !== scheduleFilter) {
        return false;
      }
      return true;
    });

    if (dateFilterType === 'All') return items;
    return items.filter(item => {
      const itemDate = normalizeDate(item.date || item.createdAt || item.updatedAt);
      if (!itemDate) return false;
      if (dateFilterType === 'DateRange') {
        const s = normalizeDate(startDate);
        const e = normalizeDate(endDate);
        if (!s || !e) return true;
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
  }, [customers, filters, scheduleFilter, searchQuery, dateFilterType, startDate, endDate, weekValue, yearValue]);

  // Sort prospects
  const sortedCustomers = React.useMemo(() => {
    return [...dateFilteredCustomers].sort((a, b) => {
      if (filters.sortBy === 'name') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      } else if (filters.sortBy === 'callStatus') {
        return (a.callStatus || '').localeCompare(b.callStatus || '');
      } else if (filters.sortBy === 'followupStatus') {
        return (a.followupStatus || '').localeCompare(b.followupStatus || '');
      } else {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      }
    });
  }, [dateFilteredCustomers, filters.sortBy]);

  // ── Smart pipeline date helpers ──
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return [mon, sun];
  };

  // Pipeline-filtered customers for smart tabs
  const pipelineFilteredCustomers = React.useMemo(() => {
    let base = sortedCustomers;
    // Apply leadSource filter if set
    if (leadSourceFilter) {
      base = base.filter(c => (c.leadSource || 'Cold Call') === leadSourceFilter);
    }
    const todayStr = getTodayStr();
    const [weekStart, weekEnd] = getWeekRange();
    switch (pipelineTab) {
      case 'completed':
        return base.filter(c => (c.followupStatus || '').toLowerCase() === 'completed');
      case 'today':
        return base.filter(c => {
          if (!c.scheduledDate) return false;
          return c.scheduledDate.slice(0, 10) === todayStr && (c.followupStatus || '').toLowerCase() !== 'completed';
        });
      case 'week':
        return base.filter(c => {
          if (!c.scheduledDate) return false;
          const sd = new Date(c.scheduledDate);
          return sd >= weekStart && sd <= weekEnd && (c.followupStatus || '').toLowerCase() !== 'completed';
        });
      case 'coldcall':
        return base.filter(c => (c.leadSource || 'Cold Call') === 'Cold Call' && (c.followupStatus || '').toLowerCase() !== 'completed');
      case 'warm':
        return base.filter(c => (c.leadSource || 'Cold Call') !== 'Cold Call' && (c.followupStatus || '').toLowerCase() !== 'completed');
      default: // 'all'
        return base.filter(c => (c.followupStatus || '').toLowerCase() !== 'completed');
    }
  }, [sortedCustomers, pipelineTab, leadSourceFilter]);

  // Pipeline tab counts
  const pipelineCounts = React.useMemo(() => {
    const todayStr = getTodayStr();
    const [weekStart, weekEnd] = getWeekRange();
    const active = sortedCustomers.filter(c => (c.followupStatus || '').toLowerCase() !== 'completed');
    return {
      all: active.length,
      today: active.filter(c => c.scheduledDate && c.scheduledDate.slice(0, 10) === todayStr).length,
      week: active.filter(c => { if (!c.scheduledDate) return false; const sd = new Date(c.scheduledDate); return sd >= weekStart && sd <= weekEnd; }).length,
      coldcall: active.filter(c => (c.leadSource || 'Cold Call') === 'Cold Call').length,
      warm: active.filter(c => (c.leadSource || 'Cold Call') !== 'Cold Call').length,
      completed: sortedCustomers.filter(c => (c.followupStatus || '').toLowerCase() === 'completed').length,
    };
  }, [sortedCustomers]);

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
        showNotification('No rows found', 'The selected file does not contain any rows to import.', 'warning');
        return;
      }

      const payloads = rows.map(buildImportedCustomer).filter(Boolean);
      if (!payloads.length) {
        showNotification('Nothing to import', 'No valid customer rows were found. Please check your column headers.', 'warning');
        return;
      }

      const results = await runBatch(payloads, 10, (payload) => createCustomer(payload));
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      const skippedCount = rows.length - payloads.length;

      await Promise.all([fetchCustomers(), fetchStats()]);

      showNotification(
        'Import complete', 
        `Imported ${successCount} row(s). ${skippedCount ? `Skipped ${skippedCount}. ` : ''}${failureCount ? `Failed ${failureCount}.` : ''}`.trim(), 
        failureCount ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Customer import failed', err);
      showNotification('Import failed', err.message || 'Unable to import the selected file.', 'error');
    } finally {
      setIsImportingCustomers(false);
      event.target.value = '';
    }
  };

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
      showNotification('Export complete', 'Downloaded visible prospects table.', 'success');
      return;
    } catch (err) {
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
        showNotification('Export complete', 'Downloaded visible CSV export.', 'success');
      } catch (err2) {
        console.error('Export failed', err2);
        showNotification('Export failed', 'Could not export Visible leads table.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Customers', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: FiUser, sub: 'All time' },
          { label: 'Completed Deals', value: stats.completedDeals, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: FiCheckCircle, sub: '+18% this month', subColor: 'text-emerald-500' },
          { label: 'Total Commission', value: formatCurrency(stats.totalCommission), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: FiDollarSign, sub: '+12% this month', subColor: 'text-emerald-500' },
          { label: 'Called Prospects', value: stats.calledCustomers, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20', icon: FiPhone, sub: '+8% this month', subColor: 'text-emerald-500' },
          { label: 'New Prospects', value: stats.new, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/20', icon: FiTrendingUp, sub: '+0% this month', subColor: 'text-slate-400' }
        ].map((card, i) => (
          <div 
            key={i}
            className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-xl shadow-2xs flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300"
          >
            <div className={`w-9 h-9 rounded-full ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
              <card.icon className="text-base" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-wide block leading-tight">
                {card.label}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight block mt-0.5 leading-none">
                {card.value}
              </span>
              <span className={`text-[8px] font-bold mt-1 block ${card.subColor || 'text-slate-400'} leading-none`}>
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>      {/* Filter and Control Bar */}
      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xs flex flex-wrap items-center gap-2 text-xs">
        
        {/* Reset button */}
        <button 
          onClick={() => {
            setFilters({ callStatus: '', followupStatus: '', sortBy: 'date' });
            setScheduleFilter('');
            setLeadSourceFilter('');
            setPipelineTab('all');
            setDateFilterType('All');
            setStartDate('');
            setEndDate('');
            setWeekValue('');
            setYearValue('');
            setSearchQuery('');
          }}
          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition-all flex items-center gap-1.5 h-8.5"
          title="Reset all filters"
        >
          <FiRotateCcw className="text-[10px]" />
          <span>Reset</span>
        </button>

        {/* Date Filter Dropdown */}
        <select
          value={dateFilterType}
          onChange={(e) => setDateFilterType(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer h-8.5"
        >
          <option value="All">📅 All Dates</option>
          <option value="DateRange">📅 Date Range</option>
          <option value="Day">📅 Specific Day</option>
          <option value="Week">📅 Week Range</option>
          <option value="Year">📅 Year Range</option>
        </select>

        {/* Date Sub-options */}
        {dateFilterType === 'DateRange' && (
          <div className="flex gap-1 items-center">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs h-8.5"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs h-8.5"
            />
          </div>
        )}

        {dateFilterType === 'Day' && (
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }}
            className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs h-8.5"
          />
        )}

        {dateFilterType === 'Week' && (
          <input 
            type="week" 
            value={weekValue} 
            onChange={(e) => setWeekValue(e.target.value)}
            className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs h-8.5"
          />
        )}

        {dateFilterType === 'Year' && (
          <input 
            type="number" 
            placeholder="Year" 
            value={yearValue} 
            onChange={(e) => setYearValue(e.target.value)}
            className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs w-16 h-8.5"
          />
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block" />

        {/* Call Status select */}
        <select
          value={filters.callStatus}
          onChange={(e) => handleFilterChange('callStatus', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
        >
          <option value="">📞 Call Status: All</option>
          <option value="Called">Called</option>
          <option value="Not Called">Not Called</option>
          <option value="Busy">Busy</option>
          <option value="No Answer">No Answer</option>
          <option value="Callback">Callback</option>
          <option value="2x Called">2x Called</option>
        </select>

        {/* Followup Status select */}
        <select
          value={filters.followupStatus}
          onChange={(e) => handleFilterChange('followupStatus', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
        >
          <option value="">🕒 Follow-up: All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Not Imported">Not Imported</option>
        </select>

        {/* Sort By select */}
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
        >
          <option value="date">↕ Sort by: Date</option>
          <option value="name">↕ Sort by: Name</option>
          <option value="callStatus">↕ Sort by: Call Status</option>
          <option value="followupStatus">↕ Sort by: Follow-up Status</option>
        </select>

        {/* Schedule Preference select */}
        <select
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
        >
          <option value="">🌅 Schedule Type: All</option>
          <option value="Regular">Regular</option>
          <option value="Weekend">Weekend</option>
          <option value="Night">Night</option>
          <option value="Online">Online</option>
        </select>

        {/* Lead Source select */}
        <select
          value={leadSourceFilter}
          onChange={(e) => setLeadSourceFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
        >
          <option value="">🟠 Lead Source: All</option>
          <option value="Cold Call">Cold Call</option>
          <option value="Warm Lead">Warm Lead</option>
          <option value="Referral">Referral</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Other">Other</option>
        </select>

        <div className="h-5 w-px bg-slate-250 dark:bg-slate-700 mx-1 hidden md:block" />

        {/* Export Dropdown Popover */}
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="w-8.5 h-8.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
            title="Export prospects to Excel"
          >
            <FiDownload className="text-sm" />
          </button>

          {isExportDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-56 p-3.5 z-50 text-slate-700 dark:text-slate-200">
              <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Select columns to export
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 mb-3">
                {Object.keys(exportColumns).map(col => (
                  <label key={col} className="flex items-center gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 p-1 rounded-md cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={exportColumns[col]} 
                      onChange={(e) => setExportColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                      className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mb-2">
                <button 
                  onClick={() => setExportColumns(Object.keys(exportColumns).reduce((acc, c) => (acc[c]=true, acc), {}))}
                  className="text-[10px] text-teal-650 dark:text-teal-400 font-extrabold hover:underline"
                >
                  Select All
                </button>
                <button 
                  onClick={() => setExportColumns(Object.keys(exportColumns).reduce((acc, c) => (acc[c]=false, acc), {}))}
                  className="text-[10px] text-slate-400 font-extrabold hover:underline"
                >
                  Clear All
                </button>
              </div>
              <button
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  exportVisible();
                }}
                className="w-full py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold text-center block"
              >
                Download Excel
              </button>
            </div>
          )}
        </div>

        {/* Import Excel Trigger */}
        <button
          onClick={() => customerImportRef.current?.click()}
          disabled={isImportingCustomers}
          className="w-8.5 h-8.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
          title={isImportingCustomers ? "Importing prospects..." : "Import prospects from Excel"}
        >
          {isImportingCustomers ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-teal-500 border-t-transparent" />
          ) : (
            <FiUpload className="text-sm" />
          )}
        </button>
        <input
          ref={customerImportRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImportCustomers}
          className="hidden"
        />

      </div>

      {/* Tabs Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Tabs switcher header */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-4 text-center text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 border-r border-slate-100 dark:border-slate-800 ${
              activeTab === 'customers'
                ? 'border-b-2 border-teal-550 text-teal-600 dark:text-teal-400 bg-slate-50/50 dark:bg-slate-900/30'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FiUsers className="text-sm" />
            <span>Customer Followups</span>
          </button>
          <button
            onClick={() => setActiveTab('packageSales')}
            className={`flex-1 py-4 text-center text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 ${
              activeTab === 'packageSales'
                ? 'border-b-2 border-teal-550 text-teal-600 dark:text-teal-400 bg-slate-50/50 dark:bg-slate-900/30'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FiBriefcase className="text-sm" />
            <span>Package Sales</span>
          </button>
        </div>

        {/* Tabs Panels */}
        <div className="p-0">
          {activeTab === 'customers' ? (
            <div>
              {loading ? (
                <div className="flex justify-center items-center min-h-[300px] py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="p-4 m-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-300 rounded-r-lg">
                  <span className="font-bold">Error:</span> {error}
                </div>
              ) : (
                <div>
                  {/* ── Smart Pipeline Tabs ── */}
                  <div className="px-4 pt-4 pb-0 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-px">
                      {[
                        { key: 'all',      label: 'All Active',  count: pipelineCounts.all,       icon: '📋', color: 'teal'   },
                        { key: 'today',    label: 'Today',       count: pipelineCounts.today,     icon: '⚡', color: 'amber'  },
                        { key: 'week',     label: 'This Week',   count: pipelineCounts.week,      icon: '📅', color: 'blue'   },
                        { key: 'coldcall', label: 'Cold Calls',  count: pipelineCounts.coldcall,  icon: '📞', color: 'orange' },
                        { key: 'warm',     label: 'Warm Leads',  count: pipelineCounts.warm,      icon: '🌱', color: 'green'  },
                        { key: 'completed',label: 'Completed',   count: pipelineCounts.completed, icon: '✅', color: 'emerald'},
                      ].map((tab) => {
                        const isActive = pipelineTab === tab.key;
                        const colorMap = {
                          teal:    { active: 'border-teal-500 text-teal-700 dark:text-teal-400',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
                          amber:   { active: 'border-amber-500 text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
                          blue:    { active: 'border-blue-500 text-blue-700 dark:text-blue-400',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
                          orange:  { active: 'border-orange-500 text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
                          green:   { active: 'border-green-500 text-green-700 dark:text-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
                          emerald: { active: 'border-emerald-500 text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
                        };
                        const cm = colorMap[tab.color];
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setPipelineTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-extrabold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                              isActive
                                ? `${cm.active} bg-transparent`
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? cm.badge : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Completed tab notice */}
                  {pipelineTab === 'completed' && (
                    <div className="mx-4 mt-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                      <span>✅</span>
                      <span>Showing archived completed deals only. These customers have been marked as paid/closed.</span>
                    </div>
                  )}
                  {pipelineTab === 'today' && pipelineCounts.today === 0 && (
                    <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
                      <span>⚡</span>
                      <span>No customers scheduled for today. Double-click the Scheduled Date cell on any prospect to pin them to today.</span>
                    </div>
                  )}

                  <FollowupCustomerTable
                    customers={pipelineFilteredCustomers}
                    courses={courses}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    onAdd={handleAdd}
                  />
                </div>
              )}
            </div>

          ) : (
            <div className="p-0">
              <PackageSalesTab />
            </div>
          )}
        </div>

      </div>

      {/* Floating custom Tailwind Toasts container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-3.5 rounded-xl border shadow-xl flex flex-col pointer-events-auto min-w-[280px] max-w-sm animate-in slide-in-from-bottom-5 duration-200 ${
              toast.status === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300' 
                : 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-slate-800 dark:border-teal-900 dark:text-teal-350'
            }`}
          >
            <span className="text-xs font-black">{toast.title}</span>
            <span className="text-[10px] mt-1">{toast.description}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FollowupPage;
