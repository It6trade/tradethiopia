import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiShoppingCart, 
  FiDollarSign, 
  FiTrendingUp, 
  FiPlus, 
  FiUpload, 
  FiX, 
  FiEye, 
  FiUser, 
  FiCalendar, 
  FiAlertCircle, 
  FiPhone, 
  FiMail, 
  FiFileText,
  FiCompass,
  FiBriefcase,
  FiCheck,
  FiTrash2,
  FiActivity,
  FiEdit3,
  FiChevronDown,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiRotateCcw
} from 'react-icons/fi';
import { 
  fetchPackageSalesFollowups, 
  fetchUserProfile, 
  createPackageSale,
  updatePackageSale,
  deletePackageSale,
  fetchPackageSalesActivities,
  logPackageSalesActivity
} from '../../../../services/packageService';
import { useUserStore } from '../../../../store/user';
import { useSearchStore } from '../../../../store/search';

const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.075;
  const price = Number(salesValue) || 0;
  const grossCommission = price * commissionRate;
  const commissionTax = 0; 
  const netCommission = grossCommission; 
  const firstCommission = netCommission / 2;
  const secondCommission = netCommission / 2;
  
  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax: Number(commissionTax.toFixed(2)),
    netCommission: Number(netCommission.toFixed(2)),
    firstCommission: Number(firstCommission.toFixed(2)),
    secondCommission: Number(secondCommission.toFixed(2))
  };
};

const PackageSalesTab = () => {
  const currentUser = useUserStore(state => state.currentUser);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom states for Tailwind modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [agentProfile, setAgentProfile] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    phone: '',
    email: '',
    packageName: '',
    packageType: '',
    note: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  
  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [followupsError, setFollowupsError] = useState(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef(null);

  // Inline editing & Activity states
  const [editingCell, setEditingCell] = useState(null); 
  const [editValue, setEditValue] = useState('');
  const [activeCallStatusMenu, setActiveCallStatusMenu] = useState(null);
  const [activeFollowupStatusMenu, setActiveFollowupStatusMenu] = useState(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newActivityMessage, setNewActivityMessage] = useState('');
  const [newActivityType, setNewActivityType] = useState('Call');

  // Smart Pipeline Tab Filtering
  const [pipelineTab, setPipelineTab] = useState('all-active'); // all-active | today | week | overdue | completed | cancelled
  const [dateFilterType, setDateFilterType] = useState('All'); // All | Day | Week | Year | Custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekValue, setWeekValue] = useState('');
  const [yearValue, setYearValue] = useState('');
  const searchQuery = useSearchStore(state => state.searchQuery);

  const [packageFilter, setPackageFilter] = useState('');

  const [filters, setFilters] = useState({
    callStatus: '',
    status: '',
    sortBy: 'date'
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setDateFilterType('All');
    setStartDate('');
    setEndDate('');
    setWeekValue('');
    setYearValue('');
    setPackageFilter('');
    setFilters({
      callStatus: '',
      status: '',
      sortBy: 'date'
    });
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    startOfWeek.setHours(0,0,0,0);
    endOfWeek.setHours(23,59,59,999);
    return d >= startOfWeek && d <= endOfWeek;
  };

  // Floating notifications/toasts list inside package sales view
  const [toasts, setToasts] = useState([]);
  const showToast = (title, description, status = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, status }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const loadActivities = async (customerId, packageId) => {
    setActivitiesLoading(true);
    try {
      const data = await fetchPackageSalesActivities({ customerId, packageId });
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleOpenActivityModal = (followup) => {
    setSelectedFollowup(followup);
    setNewActivityMessage('');
    setNewActivityType('Call');
    setIsActivityModalOpen(true);
    loadActivities(followup.customerId, followup.packageId);
  };

  const handleAddActivity = async () => {
    if (!newActivityMessage.trim()) return;
    try {
      await logPackageSalesActivity({
        activityType: newActivityType,
        customerId: selectedFollowup.customerId,
        packageId: selectedFollowup.packageId,
        customerType: selectedFollowup.customerType,
        customerName: selectedFollowup.customerName,
        phone: selectedFollowup.phone,
        email: selectedFollowup.email,
        packageName: selectedFollowup.packageName,
        packageType: selectedFollowup.packageType,
        body: newActivityMessage.trim()
      });
      setNewActivityMessage('');
      await loadActivities(selectedFollowup.customerId, selectedFollowup.packageId);
      showToast('Interaction logged', 'Interaction logged successfully', 'success');
    } catch (err) {
      showToast('Error logging activity', err.message, 'error');
    }
  };

  const handleInlineUpdate = async (rowId, field, value) => {
    try {
      let payload = {};
      if (field === 'callStatus') {
        payload.callStatus = value;
      } else if (field === 'status') {
        payload.status = value;
      } else if (field === 'nextFollowUpDate') {
        payload.expiryDate = new Date(value).toISOString();
      } else if (field === 'notes') {
        payload.notes = value;
      }

      await updatePackageSale(rowId, payload);
      await loadFollowups();
      showToast('Updated', 'Followup updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update followup:', err);
      showToast('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setEditingCell(null);
    }
  };

  const handleDeleteFollowup = async (rowId) => {
    if (!window.confirm('Are you sure you want to delete this followup?')) return;
    try {
      await deletePackageSale(rowId);
      await loadFollowups();
      showToast('Deleted', 'Followup deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete followup:', err);
      showToast('Error', err.response?.data?.message || err.message, 'error');
    }
  };

  const loadFollowups = useCallback(async () => {
    try {
      setFollowupsLoading(true);
      setLoading(true);
      const data = await fetchPackageSalesFollowups();
      const list = Array.isArray(data) ? data : [];
      setFollowups(list);
      setSales(list);
      setFollowupsError(null);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch package follow-ups';
      setFollowupsError(message);
      setError(message);
      console.error('Error fetching package sales follow-ups:', err);
    } finally {
      setFollowupsLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.customerName.trim()) {
      showToast('Name required', 'Please input customer name', 'warning');
      return;
    }

    setSavingCustomer(true);
    try {
      const salePayload = {
        customerName: newCustomer.customerName.trim(),
        contactPerson: newCustomer.contactTitle?.trim(),
        phoneNumber: newCustomer.phone?.trim(),
        email: newCustomer.email?.trim()?.toLowerCase(),
        packageName: newCustomer.packageName?.trim(),
        packageType: newCustomer.packageType,
        status: 'Active',
        purchaseDate: new Date().toISOString(),
        notes: newCustomer.note?.trim()
      };

      await createPackageSale(salePayload);
      await Promise.all([loadSales(), loadFollowups()]);
      showToast('Customer added', 'Customer added successfully', 'success');
      setNewCustomer({
        customerName: '',
        contactTitle: '',
        phone: '',
        email: '',
        packageName: '',
        packageType: '',
        note: ''
      });
      setIsAddOpen(false);
    } catch (err) {
      console.error('Failed to create customer from package sales', err);
      showToast('Could not add customer', err.response?.data?.message || err.message, 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handlePrefillNewCustomer = (sale) => {
    setNewCustomer({
      customerName: sale.customerName || '',
      contactTitle: sale.contactPerson || '',
      phone: sale.phone || '',
      email: sale.email || '',
      packageName: sale.packageName || '',
      packageType: sale.packageType || '',
      note: `From package sale (${sale.customerType || 'Package Sale'})`
    });
    setIsAddOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status = '') => {
    const norm = status.toString().toLowerCase();
    if (norm === 'active') return 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20';
    if (norm === 'expired') return 'bg-red-50 text-red-750 border border-red-100 dark:bg-red-950/20';
    if (norm === 'cancelled') return 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20';
    return 'bg-slate-50 text-slate-650 border border-slate-200 dark:bg-slate-900/40';
  };

  const getFollowupBadge = (status = '') => {
    const norm = status.toString().toLowerCase();
    if (norm === 'completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20';
    if (norm === 'overdue') return 'bg-red-50 text-red-750 border border-red-100 dark:bg-red-950/20';
    if (norm === 'pending') return 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20';
    return 'bg-slate-50 text-slate-650 border border-slate-200 dark:bg-slate-900/40';
  };

  const handleShowAgentProfile = async (agentId) => {
    if (!agentId) return;
    setProfileLoading(true);
    try {
      const profile = await fetchUserProfile(agentId);
      setAgentProfile(profile);
      setIsProfileOpen(true);
    } catch (err) {
      console.error('Error fetching agent profile:', err);
      showToast('Unable to load profile', err.response?.data?.message || err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleShowCommission = (sale) => {
    setSelectedSale(sale);
    setIsCommissionOpen(true);
  };

  const normalizeEnumValue = (value, allowed) => {
    if (value === null || value === undefined || value === '') return undefined;
    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) return undefined;
    return allowed.find(option => option.toLowerCase() === normalized);
  };

  const parseImportedDate = (value, XLSX) => {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return new Date(parsed.y, parsed.m - 1, parsed.d).toISOString();
      }
    }
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString();
    }
    return undefined;
  };

  const normalizePackageType = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const raw = value.toString().trim();
    if (!raw) return undefined;
    return raw.replace(/package\s*/i, '').trim();
  };

  const getImportValue = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return '';
  };

  const buildImportedSale = (row, XLSX) => {
    const customerNameRaw = getImportValue(row, ['Customer Name', 'customerName', 'Customer', 'Name', 'Company', 'Company Name']);
    const contactPersonRaw = getImportValue(row, ['Contact Person', 'contactPerson', 'Contact', 'Representative']);
    const emailRaw = getImportValue(row, ['Email', 'email']);
    const phoneRaw = getImportValue(row, ['Phone', 'phone', 'Phone Number', 'Mobile']);
    const packageNameRaw = getImportValue(row, ['Package Name', 'packageName']);
    const packageTypeRaw = getImportValue(row, ['Package Type', 'packageType', 'Package']);
    const purchaseDateRaw = getImportValue(row, ['Purchase Date', 'purchaseDate', 'Date']);
    const expiryDateRaw = getImportValue(row, ['Expiry Date', 'expiryDate', 'Expiration']);
    const statusRaw = getImportValue(row, ['Status', 'status']);
    const notesRaw = getImportValue(row, ['Notes', 'Note', 'notes']);

    const fallbackName = customerNameRaw || contactPersonRaw || emailRaw || phoneRaw;
    if (!fallbackName) return null;

    const customerName = fallbackName.toString().trim();
    if (!customerName) return null;

    const normalizedPackageType = normalizePackageType(packageTypeRaw);

    const payload = {
      customerName,
      contactPerson: contactPersonRaw ? contactPersonRaw.toString().trim() : undefined,
      email: emailRaw ? emailRaw.toString().trim().toLowerCase() : undefined,
      phoneNumber: phoneRaw ? phoneRaw.toString().trim() : undefined,
      packageName: packageNameRaw
        ? packageNameRaw.toString().trim()
        : (normalizedPackageType ? `Package ${normalizedPackageType}` : undefined),
      packageType: normalizedPackageType,
      purchaseDate: parseImportedDate(purchaseDateRaw, XLSX),
      expiryDate: parseImportedDate(expiryDateRaw, XLSX),
      status: normalizeEnumValue(statusRaw, ['Active', 'Expired', 'Cancelled']),
      notes: notesRaw ? notesRaw.toString().trim() : undefined
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

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
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
        showToast('No rows found', 'The selected file does not contain any rows to import.', 'warning');
        return;
      }

      const payloads = rows.map((row) => buildImportedSale(row, XLSX)).filter(Boolean);
      if (!payloads.length) {
        showToast('Nothing to import', 'No valid package sales rows were found. Please check your headers.', 'warning');
        return;
      }

      const results = await runBatch(payloads, 10, (payload) => createPackageSale(payload));
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      const skippedCount = rows.length - payloads.length;

      await Promise.all([loadSales(), loadFollowups()]);

      showToast(
        'Import complete', 
        `Imported ${successCount} row(s). ${skippedCount ? `Skipped ${skippedCount}. ` : ''}${failureCount ? `Failed ${failureCount}.` : ''}`.trim(), 
        failureCount ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Package sales import failed', err);
      showToast('Import failed', err.message || 'Unable to import the selected file.', 'error');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-955/20 dark:text-red-300 rounded-r-lg">
        <span className="font-bold">Error:</span> {error}
      </div>
    );
  }

  // Calculate stats
  const totalCommission = sales.reduce((total, sale) => {
    const packageValue = sale.packageType ? sale.packageType * 1000 : 0;
    const commission = calculateCommission(packageValue);
    return total + commission.netCommission;
  }, 0);

  const avgPackageValue = sales.length > 0 
    ? sales.reduce((total, sale) => total + (sale.packageType ? sale.packageType * 1000 : 0), 0) / sales.length
    : 0;

  // Package type distribution for sparkbar
  const pkgTypeCounts = sales.reduce((acc, s) => {
    const t = s.packageType || 'N/A';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const activeCount = sales.filter(s => (s.status || '').toLowerCase() === 'active').length;
  const expiredCount = sales.filter(s => (s.status || '').toLowerCase() === 'expired').length;

  // Calculate list categories
  const allActiveList = followups.filter(f => (f.status || '').toLowerCase() !== 'completed' && (f.status || '').toLowerCase() !== 'cancelled');
  const todayList = followups.filter(f => isToday(f.nextFollowUpDate));
  const weekList = followups.filter(f => isThisWeek(f.nextFollowUpDate));
  const overdueList = followups.filter(f => (f.followUpStatus || '').toLowerCase() === 'overdue');
  const completedList = followups.filter(f => (f.status || '').toLowerCase() === 'completed');
  const cancelledList = followups.filter(f => (f.status || '').toLowerCase() === 'cancelled');

  const filteredFollowups = (() => {
    let result = [...followups];

    // Filter by pipeline tab (All Active, Overdue, Completed, Cancelled)
    if (pipelineTab === 'all-active') {
      result = result.filter(f => (f.status || '').toLowerCase() !== 'completed' && (f.status || '').toLowerCase() !== 'cancelled');
    } else if (pipelineTab === 'overdue') {
      result = result.filter(f => (f.followUpStatus || '').toLowerCase() === 'overdue');
    } else if (pipelineTab === 'completed') {
      result = result.filter(f => (f.status || '').toLowerCase() === 'completed');
    } else if (pipelineTab === 'cancelled') {
      result = result.filter(f => (f.status || '').toLowerCase() === 'cancelled');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        (f.customerName || '').toLowerCase().includes(q) ||
        (f.packageName || '').toLowerCase().includes(q) ||
        (f.phone || '').includes(q) ||
        (f.email || '').toLowerCase().includes(q)
      );
    }

    // Filter by Call Status
    if (filters.callStatus) {
      result = result.filter(f => f.callStatus === filters.callStatus);
    }

    // Filter by Package Type
    if (packageFilter) {
      result = result.filter(f => f.packageType?.toString() === packageFilter);
    }

    // Filter by Date
    if (dateFilterType === 'Today') {
      result = result.filter(f => isToday(f.nextFollowUpDate));
    } else if (dateFilterType === 'Day' && startDate) {
      result = result.filter(f => {
        const dStr = f.nextFollowUpDate || f.purchaseDate;
        return dStr && dStr.startsWith(startDate);
      });
    } else if (dateFilterType === 'Week' && weekValue) {
      result = result.filter(f => {
        const dStr = f.nextFollowUpDate || f.purchaseDate;
        if (!dStr) return false;
        const d = new Date(dStr);
        const year = d.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
        const targetWeek = `${year}-W${String(weekNum).padStart(2, '0')}`;
        return targetWeek === weekValue;
      });
    } else if (dateFilterType === 'Year' && yearValue) {
      result = result.filter(f => {
        const dStr = f.nextFollowUpDate || f.purchaseDate;
        return dStr && new Date(dStr).getFullYear().toString() === yearValue;
      });
    } else if (dateFilterType === 'Custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(f => {
        const dStr = f.nextFollowUpDate || f.purchaseDate;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= start && d <= end;
      });
    }

    // Sort By
    if (filters.sortBy === 'date') {
      result.sort((a, b) => new Date(b.nextFollowUpDate || b.purchaseDate || 0) - new Date(a.nextFollowUpDate || a.purchaseDate || 0));
    } else if (filters.sortBy === 'name') {
      result.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
    } else if (filters.sortBy === 'callStatus') {
      result.sort((a, b) => (a.callStatus || '').localeCompare(b.callStatus || ''));
    } else if (filters.sortBy === 'status') {
      result.sort((a, b) => (a.followUpStatus || '').localeCompare(b.followUpStatus || ''));
    }

    return result;
  })();

  return (
    <div className="space-y-5 p-4 md:p-5">

      {/* Unified Search & Filters Card (Single Row Layout) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xs">
        
        {/* Pipeline Tabs (Today removed) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all-active', label: 'All Active', count: allActiveList.length, color: 'text-teal-655 hover:bg-teal-50 dark:hover:bg-teal-955/20', activeBg: 'bg-teal-50 text-teal-655 border-teal-205 dark:bg-teal-955/20 dark:border-teal-900', icon: FiCompass },
            { id: 'overdue', label: 'Overdue', count: overdueList.length, color: 'text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20', activeBg: 'bg-red-50 text-red-650 border-red-205 dark:bg-red-955/20 dark:border-red-900', icon: FiAlertCircle },
            { id: 'completed', label: 'Completed', count: completedList.length, color: 'text-emerald-605 hover:bg-emerald-50 dark:hover:bg-emerald-955/20', activeBg: 'bg-emerald-50 text-emerald-605 border-emerald-205 dark:bg-emerald-955/20 dark:border-emerald-900', icon: FiCheckCircle },
            { id: 'cancelled', label: 'Cancelled', count: cancelledList.length, color: 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/20', activeBg: 'bg-slate-50 text-slate-655 border-slate-205 dark:bg-slate-900/20 dark:border-slate-800', icon: FiX }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = pipelineTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPipelineTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                  isActive 
                    ? tab.activeBg 
                    : `border-transparent ${tab.color}`
                }`}
              >
                <Icon className="text-sm" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  isActive ? 'bg-white/90 dark:bg-slate-850 border' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />

        {/* Select Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Date Filter Type Select */}
          <select
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-bold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 cursor-pointer h-8.5"
          >
            <option value="All">📅 Date: All</option>
            <option value="Today">Today</option>
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Year">Year</option>
            <option value="Custom">Custom</option>
          </select>

          {/* Date Filters dynamic inputs */}
          {dateFilterType === 'Day' && (
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5"
            />
          )}

          {dateFilterType === 'Week' && (
            <input 
              type="week" 
              value={weekValue} 
              onChange={(e) => setWeekValue(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5"
            />
          )}

          {dateFilterType === 'Year' && (
            <input 
              type="number" 
              placeholder="Year" 
              value={yearValue} 
              onChange={(e) => setYearValue(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 w-20 h-8.5"
            />
          )}

          {dateFilterType === 'Custom' && (
            <div className="flex items-center gap-1.5">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5"
              />
            </div>
          )}

          {/* Call Status select */}
          <select
            value={filters.callStatus}
            onChange={(e) => handleFilterChange('callStatus', e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-bold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
          >
            <option value="">📞 Call Status: All</option>
            <option value="Not Called">Not Called</option>
            <option value="Called">Called</option>
            <option value="Busy">Busy</option>
            <option value="No Answer">No Answer</option>
            <option value="Callback">Callback</option>
            <option value="2x Called">2x Called</option>
          </select>

          {/* Package Filter select */}
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-bold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
          >
            <option value="">📦 Package: All</option>
            <option value="3">#3 Package</option>
            <option value="5">#5 Package</option>
            <option value="10">#10 Package</option>
            <option value="15">#15 Package</option>
            <option value="25">#25 Package</option>
            <option value="50">#50 Package</option>
            <option value="100">#100 Package</option>
            <option value="200">#200 Package</option>
          </select>

          {/* Sort By select */}
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl text-xs font-bold focus:ring-1 focus:ring-teal-500/20 outline-none text-slate-700 dark:text-slate-200 h-8.5 cursor-pointer"
          >
            <option value="date">↕ Sort by: Date</option>
            <option value="name">↕ Sort by: Name</option>
            <option value="callStatus">↕ Sort by: Call Status</option>
            <option value="status">↕ Sort by: Status</option>
          </select>

          {/* Reset Filter Button */}
          <button
            onClick={resetFilters}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-400 rounded-xl transition-all h-8.5 flex items-center justify-center gap-1 text-xs font-black shadow-3xs"
            title="Reset all filters"
          >
            <FiRotateCcw className="text-xs" />
            <span className="hidden sm:inline">Reset</span>
          </button>

        </div>

        {/* Right Side Group: Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
            className="w-8.5 h-8.5 border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all flex items-center justify-center shadow-3xs disabled:opacity-50"
            title="Import Excel"
          >
            <FiUpload className="text-sm" />
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-8.5 h-8.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl transition-all flex items-center justify-center shadow-3xs"
            title="New Customer"
          >
            <FiPlus className="text-sm" />
          </button>
        </div>

      </div>

      {/* Single Table: Package Sales Follow-ups */}
      {followupsLoading ? (
        <div className="flex justify-center items-center min-h-[250px] bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xs">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : followupsError ? (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-955/20 dark:text-red-300 rounded-r-lg shadow-2xs">
          <span className="font-bold">Error:</span> {followupsError}
        </div>
      ) : (
        <div className="overflow-x-auto w-full max-w-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-2xs min-h-[300px]">
          <table className="w-full text-left border-collapse text-xs text-slate-650 dark:text-slate-350 min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-700 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-3 w-[15%]">Customer</th>
                <th className="p-3 w-[12%]">Package</th>
                <th className="p-3 w-[12%]">Follow-up Status</th>
                <th className="p-3 w-[12%]">Next Follow-up</th>
                <th className="p-3 w-[8%]">Days</th>
                <th className="p-3 w-[10%]">Phone</th>
                <th className="p-3 w-[10%]">Call Status</th>
                <th className="p-3 w-[18%]">Notes/Interaction</th>
                <th className="p-3 w-[13%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
              {filteredFollowups.length > 0 ? (
                filteredFollowups.map((followup, idx) => {
                  const isNearBottom = idx >= filteredFollowups.length - 2;
                  return (
                    <tr 
                      key={followup.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all font-medium text-slate-700 dark:text-slate-300"
                    >
                    {/* Customer Name */}
                    <td className="p-3 font-extrabold text-slate-850 dark:text-white truncate max-w-[140px]">
                      {followup.customerName || 'Unknown'}
                    </td>
                    
                    {/* Package Type */}
                    <td className="p-3 truncate max-w-[120px]">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-purple-50 text-purple-750 border-purple-100 dark:bg-purple-950/20">
                        #{followup.packageType || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Followup Status Dropdown Menu */}
                    <td className="p-3 relative">
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setActiveFollowupStatusMenu(activeFollowupStatusMenu === followup.id ? null : followup.id);
                            setActiveCallStatusMenu(null);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 hover:opacity-85 transition-all cursor-pointer select-none ${getFollowupBadge(followup.followUpStatus)}`}
                        >
                          <span>{followup.followUpStatus}</span>
                          <FiChevronDown className="text-[8px]" />
                        </button>
                        {activeFollowupStatusMenu === followup.id && (
                          <div className={`absolute left-0 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-40 p-1 text-[11px] text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
                            {[
                              { value: 'Active', label: 'Pending' },
                              { value: 'Completed', label: 'Completed' },
                              { value: 'Cancelled', label: 'Cancelled' }
                            ].map((status) => (
                              <button
                                key={status.value}
                                onClick={() => {
                                  handleInlineUpdate(followup.id, 'status', status.value);
                                  setActiveFollowupStatusMenu(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all font-semibold block text-slate-750 dark:text-slate-250"
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Next Follow-up Date Input */}
                    <td className="p-3">
                      {editingCell?.id === followup.id && editingCell?.field === 'nextFollowUpDate' ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineUpdate(followup.id, 'nextFollowUpDate', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineUpdate(followup.id, 'nextFollowUpDate', editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none text-slate-700 dark:text-slate-200"
                        />
                      ) : (
                        <div 
                          onDoubleClick={() => {
                            setEditingCell({ id: followup.id, field: 'nextFollowUpDate' });
                            setEditValue(followup.nextFollowUpDate ? followup.nextFollowUpDate.split('T')[0] : '');
                          }}
                          className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400 group cursor-pointer select-none"
                          title="Double-click to edit next followup date"
                        >
                          <FiCalendar className="text-xs text-slate-450" />
                          <span className="font-semibold">{formatDate(followup.nextFollowUpDate)}</span>
                          <FiEdit3 className="text-[10px] text-slate-350 opacity-0 group-hover:opacity-100 transition-all ml-0.5" />
                        </div>
                      )}
                    </td>

                    {/* Days Until Followup */}
                    <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">
                      {followup.daysUntilNextFollowUp ?? 'N/A'}
                    </td>

                    {/* Phone */}
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-slate-550 dark:text-slate-450">
                        <FiPhone className="text-xs text-slate-400" />
                        <span>{followup.phone || '-'}</span>
                      </span>
                    </td>

                    {/* Call Status Dropdown cell */}
                    <td className="p-3 relative">
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setActiveCallStatusMenu(activeCallStatusMenu === followup.id ? null : followup.id);
                            setActiveFollowupStatusMenu(null);
                          }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer select-none"
                        >
                          <span>{followup.callStatus || 'Not Called'}</span>
                          <FiChevronDown className="text-[8px]" />
                        </button>
                        {activeCallStatusMenu === followup.id && (
                          <div className={`absolute left-0 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-40 p-1 text-[11px] text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
                            {['Not Called', 'Called', 'Busy', 'No Answer', 'Callback', '2x Called'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  handleInlineUpdate(followup.id, 'callStatus', status);
                                  setActiveCallStatusMenu(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all font-semibold block text-slate-750 dark:text-slate-250"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Notes Inline Input */}
                    <td className="p-3">
                      {editingCell?.id === followup.id && editingCell?.field === 'notes' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineUpdate(followup.id, 'notes', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineUpdate(followup.id, 'notes', editValue);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none text-slate-700 dark:text-slate-200 w-full max-w-[200px]"
                        />
                      ) : (
                        <div 
                          onDoubleClick={() => {
                            setEditingCell({ id: followup.id, field: 'notes' });
                            setEditValue(followup.notes || '');
                          }}
                          className="text-slate-400 dark:text-slate-500 font-semibold group cursor-pointer select-none truncate max-w-[180px] flex items-center justify-between"
                          title="Double-click to edit notes"
                        >
                          <span>{followup.notes || 'Add notes...'}</span>
                          <FiEdit3 className="text-[10px] text-slate-350 opacity-0 group-hover:opacity-100 transition-all ml-1.5 flex-shrink-0" />
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        {/* Log Interaction */}
                        <button
                          onClick={() => handleOpenActivityModal(followup)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center h-7 w-7"
                          title="Log interaction notes & logs"
                        >
                          <FiActivity className="text-xs" />
                        </button>

                        {/* Commission Breakdown */}
                        <button
                          onClick={() => handleShowCommission(followup)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950 text-[10px] font-black text-teal-650 dark:text-teal-400 rounded-lg border border-teal-105 dark:border-teal-900 transition-all h-7 flex items-center justify-center shadow-xs"
                          title="View commission details"
                        >
                          Com
                        </button>

                        {/* Delete manual package sale */}
                        {followup.id.startsWith('manual-') && (
                          <button
                            onClick={() => handleDeleteFollowup(followup.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-950 text-red-650 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50 transition-all flex items-center justify-center h-7 w-7"
                            title="Delete this followup"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-450 text-sm font-semibold">
                    No package sales follow-ups assigned to you
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal (Tailwind glassmorphic popup) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="font-black text-sm text-slate-850 dark:text-slate-100">Add New Package Customer</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5 space-y-3.5 max-h-[420px] overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={newCustomer.customerName}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Contact Title</label>
                <input
                  type="text"
                  name="contactTitle"
                  value={newCustomer.contactTitle}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Phone Contact</label>
                <input
                  type="text"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Email Address</label>
                <input
                  type="text"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Package Name</label>
                <input
                  type="text"
                  name="packageName"
                  value={newCustomer.packageName}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Package Type</label>
                <select
                  name="packageType"
                  value={newCustomer.packageType}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200"
                >
                  <option value="">Select package type</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={String(num)}>Package {num}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Interaction Notes</label>
                <textarea
                  name="note"
                  value={newCustomer.note}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-750 dark:text-slate-200 min-h-[60px]"
                />
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-2.5">
              <button 
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCustomer}
                disabled={savingCustomer}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {savingCustomer ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-750 dark:text-slate-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="font-black text-sm text-slate-850 dark:text-slate-100">Agent Profile</h3>
              <button 
                onClick={() => {
                  setAgentProfile(null);
                  setIsProfileOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {profileLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-teal-500 border-t-transparent"></div>
                </div>
              ) : agentProfile ? (
                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-lg uppercase shadow-sm">
                      {(agentProfile.fullName || agentProfile.username || 'A').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{agentProfile.fullName || agentProfile.username}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{agentProfile.role || 'Sales Agent'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiMail className="text-slate-400 text-sm flex-shrink-0" />
                      <span className="truncate">{agentProfile.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-slate-400 text-sm flex-shrink-0" />
                      <span>{agentProfile.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCompass className="text-slate-400 text-sm flex-shrink-0" />
                      <span>{agentProfile.location || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiBriefcase className="text-slate-400 text-sm flex-shrink-0" />
                      <span>{agentProfile.employmentType || 'N/A'}</span>
                    </div>
                  </div>
                  {agentProfile.notes && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block mb-1">Interaction Notes:</span>
                      <p className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] leading-normal">{agentProfile.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 py-6">No profile loaded.</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button 
                onClick={() => {
                  setAgentProfile(null);
                  setIsProfileOpen(false);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Details Modal */}
      {isCommissionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="font-black text-sm text-slate-850 dark:text-slate-100 font-black">Commission Breakdown</h3>
              <button 
                onClick={() => setIsCommissionOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selectedSale && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h4 className="font-extrabold text-sm text-slate-805 dark:text-slate-100 leading-tight">
                      {selectedSale.customerName}
                    </h4>
                    <span className="text-[10px] text-teal-605 block mt-1 font-bold">Package: {selectedSale.packageName}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div className="p-3 bg-blue-50/40 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Package Value</span>
                      <span className="text-lg font-black text-blue-750 dark:text-blue-400">
                        ETB {(selectedSale.packageType ? selectedSale.packageType * 1000 : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {(() => {
                      const val = selectedSale.packageType ? selectedSale.packageType * 1000 : 0;
                      const comm = calculateCommission(val);
                      return (
                        <div className="space-y-3.5">
                          
                          <div className="p-3 bg-emerald-50/40 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-xl">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Gross Commission (7.5%)</span>
                            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                              ETB {comm.grossCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-3.5 border border-teal-200 dark:border-teal-900/50 bg-teal-50/20 dark:bg-teal-950/10 rounded-2xl space-y-2.5">
                            <div className="flex justify-between font-bold border-b border-teal-100 dark:border-teal-900 pb-1.5">
                              <span>Net Commission Earnings</span>
                              <span className="text-teal-650 dark:text-teal-400">
                                ETB {comm.netCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                              <div>
                                <span className="block text-slate-400">First Split (50%)</span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">ETB {comm.firstCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400">Second Split (50%)</span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">ETB {comm.secondCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button 
                onClick={() => setIsCommissionOpen(false)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log / Interaction History Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-905/60">
              <div>
                <h3 className="font-black text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  <FiActivity className="text-teal-500 animate-pulse" />
                  <span>Interaction Log & History</span>
                </h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {selectedFollowup?.customerName} &nbsp;·&nbsp; Package #{selectedFollowup?.packageType}
                </span>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
              {/* Form to log new activity */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/80 rounded-xl space-y-2.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Log New Interaction</span>
                <div className="flex gap-2">
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none text-slate-750 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Note">Note</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Describe the interaction details..."
                    value={newActivityMessage}
                    onChange={(e) => setNewActivityMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddActivity();
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 outline-none text-slate-755 dark:text-slate-200"
                  />
                  <button
                    onClick={handleAddActivity}
                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-all shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* History list */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-700/85 pb-1">Past Interactions</span>
                {activitiesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-2.5">
                    {activities.map((activity) => (
                      <div 
                        key={activity._id}
                        className="p-3 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-xl text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-105 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/55 uppercase">
                              {activity.activityType}
                            </span>
                            <span className="font-extrabold text-slate-750 dark:text-slate-200">
                              {activity.createdByName || 'System'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {new Date(activity.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                          {activity.body}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                    No past interactions logged for this customer.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

export default PackageSalesTab;
