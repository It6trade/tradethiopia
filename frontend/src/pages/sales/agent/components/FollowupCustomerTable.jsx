import React, { useEffect, useState, useRef } from 'react';
import { 
  FiTrash2, 
  FiEye, 
  FiSettings, 
  FiChevronDown, 
  FiPlus, 
  FiCheck, 
  FiX, 
  FiGrid, 
  FiList,
  FiPhone,
  FiCalendar,
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { calculateCommission } from '../../../../utils/commission';

const TABLE_PREF_KEY = 'salesFollowupCustomerTablePrefs';
const TABLE_PREF_VERSION = 3;
const VIEW_PREF_KEY = 'salesFollowupCustomerViewMode';
const DEFAULT_COLUMNS = [
  { key: 'customerName', label: 'Customer Name', width: 140, required: true },
  { key: 'contactTitle', label: 'Training Title', width: 160 },
  { key: 'leadSource', label: 'Lead Source', width: 110 },
  { key: 'phone', label: 'Phone', width: 130 },
  { key: 'callStatus', label: 'Call Status', width: 115 },
  { key: 'followupStatus', label: 'Follow-up Status', width: 130 },
  { key: 'scheduledDate', label: 'Scheduled Date', width: 120 },
  { key: 'schedulePreference', label: 'Schedule Type', width: 115 },
  { key: 'date', label: 'Date Added', width: 110 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'actions', label: 'Actions', width: 110, required: true }
];

const getDefaultColumnPrefs = () => ({
  version: TABLE_PREF_VERSION,
  order: DEFAULT_COLUMNS.map(column => column.key),
  hidden: [],
  widths: DEFAULT_COLUMNS.reduce((acc, column) => ({ ...acc, [column.key]: column.width }), {})
});

const readColumnPrefs = () => {
  const defaults = getDefaultColumnPrefs();
  try {
    const saved = JSON.parse(localStorage.getItem(TABLE_PREF_KEY) || 'null');
    if (!saved) return defaults;
    if (saved.version !== TABLE_PREF_VERSION) return defaults;

    const knownKeys = DEFAULT_COLUMNS.map(column => column.key);
    const savedOrder = Array.isArray(saved.order) ? saved.order.filter(key => knownKeys.includes(key)) : [];
    const order = [...savedOrder, ...knownKeys.filter(key => !savedOrder.includes(key))];
    const hidden = Array.isArray(saved.hidden)
      ? saved.hidden.filter(key => knownKeys.includes(key) && !DEFAULT_COLUMNS.find(column => column.key === key)?.required)
      : [];

    return {
      order,
      hidden,
      version: TABLE_PREF_VERSION,
      widths: { ...defaults.widths, ...(saved.widths || {}) }
    };
  } catch {
    return defaults;
  }
};

const FollowupCustomerTable = ({ customers, courses, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  
  // Pagination & Rows per page states matching screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Roster quick edit values
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    leadSource: 'Cold Call',
    phone: '',
    callStatus: 'Not Called',
    followupStatus: 'Pending',
    scheduledDate: '',
    email: '',
    note: '',
    supervisorComment: '',
    packageScope: 'Local'
  });
  
  const [updatedCustomers, setUpdatedCustomers] = useState(new Set());
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [columnPrefs, setColumnPrefs] = useState(readColumnPrefs);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_PREF_KEY) || 'list');
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  // States to toggle absolute custom menus for callStatus / followupStatus inside cells
  const [activeCallStatusMenu, setActiveCallStatusMenu] = useState(null);
  const [activeFollowupStatusMenu, setActiveFollowupStatusMenu] = useState(null);

  const resizeRef = useRef(null);
  const prefsDropdownRef = useRef(null);

  const userRole = localStorage.getItem('userRole') || 'agent';

  useEffect(() => {
    localStorage.setItem(TABLE_PREF_KEY, JSON.stringify(columnPrefs));
  }, [columnPrefs]);

  useEffect(() => {
    localStorage.setItem(VIEW_PREF_KEY, viewMode);
  }, [viewMode]);

  // Click outside to close custom popups
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (prefsDropdownRef.current && !prefsDropdownRef.current.contains(e.target)) {
        setIsPrefsOpen(false);
      }
      if (activeCallStatusMenu || activeFollowupStatusMenu) {
        setTimeout(() => {
          setActiveCallStatusMenu(null);
          setActiveFollowupStatusMenu(null);
        }, 150);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeCallStatusMenu, activeFollowupStatusMenu]);

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const canUserEditField = (field, role) => {
    if (role === 'agent' || role === 'sales') return field !== 'supervisorComment';
    if (role === 'supervisor' || role === 'admin') return true;
    return false;
  };

  const getCourseDetails = (courseName, courseId) => {
    if (!Array.isArray(courses)) return null;
    let course = null;
    if (courseId) {
      course = courses.find(c => c._id === courseId);
    }
    if (!course && courseName) {
      course = courses.find(c => c.name === courseName);
    }
    return course ? { id: course._id, name: course.name, price: Number(course.price) || 0 } : null;
  };

  const getCustomerCoursePrice = (customer) => {
    const courseDetails = getCourseDetails(customer?.contactTitle, customer?.courseId);
    const price = customer?.coursePrice ?? courseDetails?.price;
    const numericPrice = Number(price);
    return Number.isFinite(numericPrice) ? numericPrice : null;
  };

  const formatPrice = (price) => (
    price === null || price === undefined
      ? 'Price not set'
      : `ETB ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  const getStatusBadgeVariant = (status, type) => {
    if (type === 'call') {
      switch (status) {
        case 'Called': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20';
        case 'Not Called': return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40';
        case 'Busy': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20';
        case 'No Answer': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20';
        case 'Callback': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20';
        case '2x Called': return 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
    } else {
      switch (status) {
        case 'Prospect': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20';
        case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20';
        case 'Pending': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20';
        case 'Scheduled': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20';
        case 'Cancelled': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
    }
  };

  const getScopeBadgeVariant = (scope) => {
    return scope === 'International'
      ? 'bg-purple-100 text-purple-700 border-purple-200/50 dark:bg-purple-950/30'
      : 'bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-950/30';
  };

  const getLeadSourceBadge = (source) => {
    switch (source) {
      case 'Cold Call':  return { cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20', dot: 'bg-orange-400', label: 'Cold Call' };
      case 'Warm Lead':  return { cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20',   dot: 'bg-green-400',  label: 'Warm Lead' };
      case 'Referral':   return { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20',       dot: 'bg-blue-400',   label: 'Referral' };
      case 'Walk-in':    return { cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20', dot: 'bg-violet-400', label: 'Walk-in' };
      default:           return { cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30',   dot: 'bg-slate-400',  label: source || 'Other' };
    }
  };

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const isScheduledToday = (scheduledDate) => {
    if (!scheduledDate) return false;
    return scheduledDate.slice(0, 10) === todayStr();
  };

  const isScheduledOverdue = (scheduledDate, followupStatus) => {
    if (!scheduledDate) return false;
    if (followupStatus === 'Completed') return false;
    return scheduledDate.slice(0, 10) < todayStr();
  };

  const formatScheduledDate = (scheduledDate) => {
    if (!scheduledDate) return null;
    const dateStr = scheduledDate.slice(0, 10);
    const today = todayStr();
    const d = new Date(dateStr + 'T00:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dateStr === today) return { text: `Today · ${formatted}`, urgent: true };
    const nextDay = new Date(); nextDay.setDate(nextDay.getDate() + 1);
    const nextStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth()+1).padStart(2,'0')}-${String(nextDay.getDate()).padStart(2,'0')}`;
    if (dateStr === nextStr) return { text: `Tomorrow · ${formatted}`, soon: true };
    if (dateStr < today) return { text: `${weekday}, ${formatted}`, overdue: true };
    return { text: `${weekday}, ${formatted}` };
  };


  const handleDoubleClick = (customer, field) => {
    if (!canUserEditField(field, userRole)) return;
    setEditingCell({ id: customer._id, field });
    setEditValue(customer[field] || '');
  };

  const handleCellBlur = (customer) => {
    if (editingCell) {
      let value = editValue;
      if (editingCell.field === 'phone') {
        value = String(editValue).replace(/[^\d+]/g, '');
      }

      if (customer[editingCell.field] === value) {
        setEditingCell(null);
        return;
      }

      const updated = { ...customer, [editingCell.field]: value };

      if (editingCell.field === 'contactTitle') {
        const courseDetails = getCourseDetails(editValue);
        if (courseDetails) {
          updated.courseId = courseDetails.id;
          updated.coursePrice = courseDetails.price;
          if (updated.followupStatus === 'Completed') {
            updated.commission = calculateCommission(courseDetails.price);
          }
        }
      }

      if (editingCell.field === 'followupStatus' && value === 'Completed') {
        const courseDetails = getCourseDetails(customer.contactTitle, customer.courseId);
        if (courseDetails) {
          const commission = calculateCommission(courseDetails.price);
          updated.commission = commission;
          updated.coursePrice = courseDetails.price;
          updated.courseId = courseDetails.id;
        }
      }

      onUpdate(customer._id, updated);
      setUpdatedCustomers(prev => new Set(prev).add(customer._id));
      setTimeout(() => {
        setUpdatedCustomers(prev => {
          const newSet = new Set(prev);
          newSet.delete(customer._id);
          return newSet;
        });
      }, 2000);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleAddNewCustomer = () => {
    let customerToAdd = { ...newCustomer };
    if (newCustomer.contactTitle) {
      const courseDetails = getCourseDetails(newCustomer.contactTitle);
      if (courseDetails) {
        customerToAdd.coursePrice = courseDetails.price;
        customerToAdd.courseId = courseDetails.id;
        if (newCustomer.followupStatus === 'Completed') {
          const commission = calculateCommission(courseDetails.price);
          customerToAdd.commission = commission;
        }
      }
    }
    onAdd(customerToAdd);
    setAddingRow(false);
    setNewCustomer({
      customerName: '',
      contactTitle: '',
      phone: '',
      callStatus: 'Not Called',
      followupStatus: 'Pending',
      email: '',
      note: '',
      supervisorComment: '',
      packageScope: 'Local',
      leadSource: 'Cold Call',
      scheduledDate: ''
    });
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      const { customer, status } = pendingStatusChange;
      const courseDetails = getCourseDetails(customer.contactTitle, customer.courseId);
      const updated = { ...customer, followupStatus: status };
      if (courseDetails) {
        updated.commission = calculateCommission(courseDetails.price);
        updated.coursePrice = courseDetails.price;
        updated.courseId = courseDetails.id;
      }
      onUpdate(customer._id, updated);
      setPendingStatusChange(null);
    }
    setIsStatusWarningOpen(false);
  };

  // Drag and drop sorting headers
  const handleDragStart = (e, key) => {
    setDraggedColumn(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, key) => {
    e.preventDefault();
    if (key !== draggedColumn) {
      setDragOverColumn(key);
    }
  };

  const handleDrop = (e, key) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== key) {
      const order = [...columnPrefs.order];
      const draggedIdx = order.indexOf(draggedColumn);
      const targetIdx = order.indexOf(key);
      order.splice(draggedIdx, 1);
      order.splice(targetIdx, 0, draggedColumn);
      setColumnPrefs(prev => ({ ...prev, order }));
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleResizeStart = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnPrefs.widths[key] || 100;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const width = Math.max(60, startWidth + deltaX);
      setColumnPrefs(prev => ({
        ...prev,
        widths: { ...prev.widths, [key]: width }
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleColumnVisibility = (key) => {
    const hidden = [...columnPrefs.hidden];
    const idx = hidden.indexOf(key);
    if (idx > -1) {
      hidden.splice(idx, 1);
    } else {
      hidden.push(key);
    }
    setColumnPrefs(prev => ({ ...prev, hidden }));
  };

  const visibleColumns = columnPrefs.order.filter(key => !columnPrefs.hidden.includes(key));
  const mappedColumns = visibleColumns.map(key => DEFAULT_COLUMNS.find(c => c.key === key)).filter(Boolean);

  // Pagination bounds
  const totalResultsCount = customers.length;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = customers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPagesCount = Math.ceil(totalResultsCount / rowsPerPage) || 1;

  // Drawer Commission Variables
  const resolvedCourseDetails = drawerCustomer ? getCourseDetails(drawerCustomer.contactTitle, drawerCustomer.courseId) : null;
  const resolvedCoursePrice = drawerCustomer
    ? (drawerCustomer.coursePrice ?? resolvedCourseDetails?.price ?? null)
    : null;
  const resolvedCommission = drawerCustomer
    ? drawerCustomer.commission || (resolvedCoursePrice != null
        ? calculateCommission(resolvedCoursePrice)
        : null)
    : null;

  return (
    <div className="w-full">
      
      {/* Controls row matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-4 bg-white dark:bg-slate-800 border-b border-slate-200/60 dark:border-slate-700/50">
        
        {/* Table/Grid view switches */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'list' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <FiList className="text-sm" />
            <span>List Table</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'grid' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <FiGrid className="text-sm" />
            <span>Grid Cards</span>
          </button>
        </div>

        {/* Column config and addition controls */}
        <div className="flex items-center gap-2.5">
          {/* Table Config Dropdown */}
          <div className="relative" ref={prefsDropdownRef}>
            <button
              onClick={() => setIsPrefsOpen(!isPrefsOpen)}
              className="px-4 py-2 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-350 transition-all flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-800 shadow-2xs"
            >
              <FiSettings className="text-sm" />
              <span>Config Columns</span>
            </button>

            {isPrefsOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-56 p-3.5 z-50 text-slate-700 dark:text-slate-200">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  Configure Table Headers
                </span>
                <div className="max-h-56 overflow-y-auto space-y-1.5">
                  {DEFAULT_COLUMNS.map(col => {
                    const isHidden = columnPrefs.hidden.includes(col.key);
                    return (
                      <label key={col.key} className="flex items-center gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-950 p-1.5 rounded-md cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={!isHidden} 
                          disabled={col.required}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 disabled:opacity-50"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setAddingRow(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus className="text-sm" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Grid Mode Viewport */}
      {viewMode === 'grid' ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.length > 0 ? (
            customers.map((c) => (
              <div 
                key={c._id}
                className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3 relative overflow-hidden"
              >
                {updatedCustomers.has(c._id) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-3 animate-ping" />
                )}
                
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
                      {c.customerName || 'No Name'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      {c.contactTitle || 'No training catalog assigned'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadgeVariant(c.followupStatus, 'followup')}`}>
                    {c.followupStatus}
                  </span>
                </div>

                <div className="h-px bg-slate-150 dark:bg-slate-700"></div>

                <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Phone Number:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{c.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Call Status:</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadgeVariant(c.callStatus, 'call')}`}>{c.callStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule Type:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{c.schedulePreference || 'Regular'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catalog Cost:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(getCustomerCoursePrice(c))}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setDrawerCustomer(c)}
                    className="p-1.5 border border-slate-150 hover:border-teal-400 text-slate-500 hover:text-teal-600 rounded-lg text-xs transition-all"
                    title="View details & commissions"
                  >
                    <FiEye />
                  </button>
                  <button
                    onClick={() => onDelete(c._id)}
                    className="p-1.5 border border-slate-150 hover:border-red-400 text-slate-500 hover:text-red-600 rounded-lg text-xs transition-all"
                    title="Delete lead"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No customers found. Click Add Customer to get started.
            </div>
          )}
        </div>
      ) : (
        /* List Mode Table Viewport matching screenshot precisely */
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse table-fixed text-xs text-slate-600 dark:text-slate-350 min-w-[1000px] bg-white dark:bg-slate-800">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-700 select-none text-[10px] text-slate-500 font-extrabold">
                {mappedColumns.map((col) => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.key)}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    style={{ width: `${columnPrefs.widths[col.key] || col.width}px` }}
                    className={`p-3 uppercase tracking-wider relative cursor-move hover:bg-slate-100/50 dark:hover:bg-slate-850/80 transition-all ${
                      dragOverColumn === col.key ? 'bg-teal-50/50 border-r border-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate select-none">
                      <span className="truncate">{col.label}</span>
                      {col.key !== 'actions' && (
                        <span className="flex flex-col text-[8px] text-slate-400 leading-none">
                          <span>▲</span>
                          <span>▼</span>
                        </span>
                      )}
                    </div>
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-teal-500/50"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* Quick Inline Row Addition */}
              {addingRow && (
                <tr className="bg-teal-50/20 dark:bg-teal-950/10">
                  {visibleColumns.map((key) => {
                    if (key === 'actions') {
                      return (
                        <td key="actions" className="p-2 flex gap-1.5 justify-end">
                          <button 
                            onClick={handleAddNewCustomer}
                            className="p-1 bg-teal-500 hover:bg-teal-600 text-white rounded text-xs"
                            title="Confirm"
                          >
                            <FiCheck />
                          </button>
                          <button 
                            onClick={() => setAddingRow(false)}
                            className="p-1 bg-slate-350 hover:bg-slate-400 text-slate-700 rounded text-xs"
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </td>
                      );
                    }
                    if (key === 'callStatus') {
                      return (
                        <td key="callStatus" className="p-2">
                          <select 
                            value={newCustomer.callStatus} 
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, callStatus: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="Not Called">Not Called</option>
                            <option value="Called">Called</option>
                            <option value="Busy">Busy</option>
                            <option value="No Answer">No Answer</option>
                            <option value="Callback">Callback</option>
                            <option value="2x Called">2x Called</option>
                          </select>
                        </td>
                      );
                    }
                    if (key === 'followupStatus') {
                      return (
                        <td key="followupStatus" className="p-2">
                          <select 
                            value={newCustomer.followupStatus} 
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, followupStatus: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      );
                    }
                    if (key === 'schedulePreference') {
                      return (
                        <td key="schedulePreference" className="p-2">
                          <select 
                            value={newCustomer.schedulePreference} 
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, schedulePreference: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="Regular">Regular</option>
                            <option value="Weekend">Weekend</option>
                            <option value="Night">Night</option>
                            <option value="Online">Online</option>
                          </select>
                        </td>
                      );
                    }
                    if (key === 'packageScope') {
                      return (
                        <td key="packageScope" className="p-2">
                          <select 
                            value={newCustomer.packageScope} 
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, packageScope: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="Local">Local</option>
                            <option value="International">International</option>
                          </select>
                        </td>
                      );
                    }
                    if (key === 'contactTitle') {
                      return (
                        <td key="contactTitle" className="p-2">
                          <select 
                            value={newCustomer.contactTitle} 
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, contactTitle: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="">Select course</option>
                            {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (key === 'leadSource') {
                      return (
                        <td key="leadSource" className="p-2">
                          <select
                            value={newCustomer.leadSource || 'Cold Call'}
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, leadSource: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          >
                            <option value="Cold Call">Cold Call</option>
                            <option value="Warm Lead">Warm Lead</option>
                            <option value="Referral">Referral</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                      );
                    }
                    if (key === 'scheduledDate') {
                      return (
                        <td key="scheduledDate" className="p-2">
                          <input
                            type="date"
                            value={newCustomer.scheduledDate || ''}
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="w-full border rounded p-1 text-xs bg-white text-slate-800 outline-none"
                          />
                        </td>
                      );
                    }
                    if (key === 'date') {
                      return <td key="date" className="p-2 text-slate-405">Auto</td>;
                    }
                    return (
                      <td key={key} className="p-2">
                        <input 
                          type="text" 
                          placeholder={DEFAULT_COLUMNS.find(c => c.key === key)?.label}
                          value={newCustomer[key] || ''}
                          onChange={(e) => setNewCustomer(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full border rounded p-1 text-xs bg-white text-slate-850 outline-none focus:border-teal-500"
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Data Rows */}
              {currentRows.length > 0 ? (
                currentRows.map((customer) => {
                  const scheduledToday = isScheduledToday(customer.scheduledDate);
                  const scheduledOverdue = isScheduledOverdue(customer.scheduledDate, customer.followupStatus);
                  const rowHighlight = scheduledToday
                    ? 'bg-amber-50/60 dark:bg-amber-950/10 border-l-2 border-amber-400'
                    : scheduledOverdue
                    ? 'bg-red-50/40 dark:bg-red-950/10 border-l-2 border-red-400'
                    : '';
                  return (
                  <tr
                    key={customer._id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150 text-slate-750 dark:text-slate-300 font-medium ${rowHighlight}`}
                  >
                    {visibleColumns.map((key) => {
                      const value = customer[key];
                      const isEditing = editingCell?.id === customer._id && editingCell?.field === key;
                      
                      if (key === 'customerName') {
                        return (
                          <td 
                            key="customerName" 
                            onDoubleClick={() => handleDoubleClick(customer, 'customerName')}
                            className="p-3 font-extrabold text-slate-850 dark:text-slate-100 truncate cursor-pointer"
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellBlur(customer)}
                                className="border border-teal-500 rounded px-1.5 py-0.5 text-xs bg-white outline-none w-full"
                              />
                            ) : (
                              <span>{customer.customerName || 'No Name'}</span>
                            )}
                          </td>
                        );
                      }

                      if (key === 'actions') {
                        return (
                          <td key="actions" className="p-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setDrawerCustomer(customer)}
                                className="w-6.5 h-6.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-600 hover:border-teal-500 flex items-center justify-center transition-all bg-white dark:bg-slate-800"
                                title="View details"
                              >
                                <FiEye className="text-[10px]" />
                              </button>
                              <button
                                onClick={() => handleDoubleClick(customer, 'customerName')}
                                className="w-6.5 h-6.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-500 flex items-center justify-center transition-all bg-white dark:bg-slate-800"
                                title="Edit prospect"
                              >
                                <FiEdit3 className="text-[10px]" />
                              </button>
                              <button
                                onClick={() => onDelete(customer._id)}
                                className="w-6.5 h-6.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-655 hover:border-red-500 flex items-center justify-center transition-all bg-white dark:bg-slate-800"
                                title="Delete prospect"
                              >
                                <FiTrash2 className="text-[10px]" />
                              </button>
                            </div>
                          </td>
                        );
                      }

                      if (key === 'leadSource') {
                        const badge = getLeadSourceBadge(customer.leadSource);
                        const isLSMenuOpen = activeCallStatusMenu === `ls_${customer._id}`;
                        return (
                          <td key="leadSource" className="p-2 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCallStatusMenu(isLSMenuOpen ? null : `ls_${customer._id}`);
                              }}
                              className={`w-fit inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold border select-none transition-all ${badge.cls}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                              <span>{badge.label}</span>
                              <FiChevronDown className="text-[9px]" />
                            </button>
                            {isLSMenuOpen && (
                              <div className="absolute left-2 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-50 divide-y divide-slate-100 dark:divide-slate-700">
                                {['Cold Call','Warm Lead','Referral','Walk-in','Other'].map((src) => {
                                  const srcBadge = getLeadSourceBadge(src);
                                  return (
                                    <button
                                      key={src}
                                      onClick={() => {
                                        onUpdate(customer._id, { ...customer, leadSource: src });
                                        setActiveCallStatusMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold"
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${srcBadge.dot}`} />
                                      {src}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (key === 'scheduledDate') {
                        const sdFormatted = formatScheduledDate(customer.scheduledDate);
                        const isSDEditing = editingCell?.id === customer._id && editingCell?.field === 'scheduledDate';
                        return (
                          <td key="scheduledDate" className="p-3 cursor-pointer" onDoubleClick={() => handleDoubleClick(customer, 'scheduledDate')}>
                            {isSDEditing ? (
                              <input
                                autoFocus
                                type="date"
                                value={editValue || ''}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellBlur(customer)}
                                className="border border-teal-500 rounded px-1.5 py-0.5 text-xs bg-white outline-none w-full"
                              />
                            ) : sdFormatted ? (
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                sdFormatted.urgent ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20' :
                                sdFormatted.soon ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20' :
                                sdFormatted.overdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20' :
                                'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30'
                              }`}>
                                <FiCalendar className="text-[9px] flex-shrink-0" />
                                {sdFormatted.text}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-[10px] italic">Not scheduled</span>
                            )}
                          </td>
                        );
                      }

                      if (key === 'phone') {
                        return (
                          <td key="phone" className="p-3 cursor-pointer" onDoubleClick={() => handleDoubleClick(customer, 'phone')}>
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellBlur(customer)}
                                className="border border-teal-500 rounded px-1.5 py-0.5 text-xs bg-white outline-none w-full"
                              />
                            ) : (
                              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <FiPhone className="text-slate-400 flex-shrink-0" />
                                <span>{customer.phone || 'N/A'}</span>
                              </span>
                            )}
                          </td>
                        );
                      }

                      if (key === 'callStatus') {
                        const canEdit = canUserEditField('callStatus', userRole);
                        if (!canEdit) {
                          return (
                            <td key="callStatus" className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getStatusBadgeVariant(customer.callStatus, 'call')}`}>
                                {customer.callStatus}
                              </span>
                            </td>
                          );
                        }
                        const isMenuOpen = activeCallStatusMenu === customer._id;
                        return (
                          <td key="callStatus" className="p-2 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCallStatusMenu(isMenuOpen ? null : customer._id);
                              }}
                              className={`w-fit inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border select-none transition-all ${getStatusBadgeVariant(customer.callStatus, 'call')}`}
                            >
                              <span>{customer.callStatus}</span>
                              <FiChevronDown className="text-[9px]" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute left-2 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-50 divide-y divide-slate-100 dark:divide-slate-700">
                                {['Not Called', 'Called', 'Busy', 'No Answer', 'Callback', '2x Called'].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      const updated = { ...customer, callStatus: st };
                                      onUpdate(customer._id, updated);
                                      setActiveCallStatusMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold"
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (key === 'followupStatus') {
                        const canEdit = canUserEditField('followupStatus', userRole);
                        if (!canEdit) {
                          return (
                            <td key="followupStatus" className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getStatusBadgeVariant(customer.followupStatus, 'followup')}`}>
                                {customer.followupStatus}
                              </span>
                            </td>
                          );
                        }
                        const isMenuOpen = activeFollowupStatusMenu === customer._id;
                        const isCompleted = customer.followupStatus === 'Completed';
                        return (
                          <td key="followupStatus" className="p-2 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFollowupStatusMenu(isMenuOpen ? null : customer._id);
                              }}
                              className={`w-fit inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border select-none transition-all ${getStatusBadgeVariant(customer.followupStatus, 'followup')}`}
                            >
                              {isCompleted ? <span className="text-[8px]">✓</span> : <span className="text-[8px]">🕒</span>}
                              <span>{customer.followupStatus}</span>
                              <FiChevronDown className="text-[9px]" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute left-2 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-50 divide-y divide-slate-100 dark:divide-slate-700">
                                {['Prospect', 'Pending', 'Completed', 'Scheduled', 'Cancelled'].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      if (st === 'Completed') {
                                        setPendingStatusChange({ customer, status: st });
                                        setIsStatusWarningOpen(true);
                                      } else {
                                        const updated = { ...customer, followupStatus: st };
                                        onUpdate(customer._id, updated);
                                      }
                                      setActiveFollowupStatusMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold"
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (key === 'schedulePreference') {
                        const isNight = customer.schedulePreference === 'Night';
                        return (
                          <td key="schedulePreference" className="p-3">
                            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              {isNight ? <FiMoon className="text-slate-400" /> : <FiSun className="text-slate-400" />}
                              <span>{customer.schedulePreference || 'Regular'}</span>
                            </span>
                          </td>
                        );
                      }

                      if (key === 'date') {
                        return (
                          <td key="date" className="p-3">
                            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <FiCalendar className="text-slate-400" />
                              <span>{customer.date ? formatDate(customer.date) : 'N/A'}</span>
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td 
                          key={key}
                          onDoubleClick={() => handleDoubleClick(customer, key)}
                          className={`p-3 truncate cursor-pointer transition-all ${
                            isEditing ? 'bg-teal-50/10' : 'hover:bg-slate-100/50'
                          }`}
                        >
                          {isEditing ? (
                            key === 'contactTitle' ? (
                              <select
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellBlur(customer)}
                                className="w-full border border-teal-500 rounded p-0.5 text-xs bg-white text-slate-800 outline-none"
                              >
                                <option value="">Select course</option>
                                {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                              </select>
                            ) : (
                              <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellBlur(customer)}
                                className="w-full border border-teal-500 rounded px-1.5 py-0.5 text-xs bg-white text-slate-850 outline-none focus:ring-1 focus:ring-teal-500/20"
                              />
                            )
                          ) : (
                            <span className="truncate block select-none">
                              {value || (key === 'contactTitle' ? 'Select course' : '')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-16 text-center text-slate-400 text-sm">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination control footer matching screenshot */}
      {viewMode === 'list' && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500">
          
          {/* Showing metrics info */}
          <span className="text-[11px] font-bold text-slate-450">
            Showing <span className="text-slate-700 dark:text-slate-300">{indexOfFirstRow + 1}</span> to <span className="text-slate-700 dark:text-slate-300">{Math.min(indexOfLastRow, totalResultsCount)}</span> of <span className="text-slate-700 dark:text-slate-300">{totalResultsCount}</span> results
          </span>

          {/* Page Selector numbers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition-all text-xs"
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: totalPagesCount }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6.5 h-6.5 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                    isActive 
                      ? 'bg-teal-600 text-white' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))}
              disabled={currentPage === totalPagesCount}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition-all text-xs"
            >
              <FiChevronRight />
            </button>
          </div>

          {/* Rows per page dropdown picker */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-450">
            <span>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

        </div>
      )}

      {/* Slide-out Drawer Panel */}
      {drawerCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setDrawerCustomer(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />
          {/* Slide-out Panel */}
          <div className="relative w-full sm:w-[500px] bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300 text-slate-700 dark:text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">Customer Dossier</h3>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">ID: {drawerCustomer._id}</span>
              </div>
              <button 
                onClick={() => setDrawerCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Scrollable details Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Profile details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-lg uppercase shadow-sm">
                    {drawerCustomer.customerName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-150">{drawerCustomer.customerName || 'No Name'}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{drawerCustomer.email || 'No email registered'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Phone Contact</span>
                    <span className="font-semibold">{drawerCustomer.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Registered Date</span>
                    <span className="font-semibold">{drawerCustomer.date ? formatDate(drawerCustomer.date) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Course Catalog & Commission Breakdown */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Course Catalog & Commissions
                </span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    <span>Assigned Training:</span>
                    <span className="font-extrabold text-slate-805 dark:text-slate-202 truncate max-w-[240px]">
                      {drawerCustomer.contactTitle || 'Standard catalog'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    <span>Catalog Cost:</span>
                    <span className="font-bold text-teal-600">{formatPrice(resolvedCoursePrice)}</span>
                  </div>
                </div>

                {resolvedCommission ? (
                  <div className="p-4 border border-teal-205 dark:border-teal-900/50 bg-teal-50/20 dark:bg-teal-950/10 rounded-2xl space-y-3">
                    <div className="flex justify-between text-xs font-bold border-b border-teal-100 dark:border-teal-900 pb-1.5">
                      <span>Ledger Commission Earnings</span>
                      <span className="text-teal-600">{formatPrice(resolvedCommission.netCommission)}</span>
                    </div>
                    <div className="space-y-1.5 text-[10px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Rate / Percentage:</span>
                        <span>7.50% of Catalog Cost</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gross Commission:</span>
                        <span>{formatPrice(resolvedCommission.grossCommission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withheld Social Tax:</span>
                        <span>{formatPrice(resolvedCommission.commissionTax)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    No commission breakdown available (deals incomplete).
                  </div>
                )}
              </div>

              {/* Notes & Comments */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Followup Interactions & Comments
                </span>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Agent Followup Note:</span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl min-h-[60px] text-slate-600 dark:text-slate-350">
                      {drawerCustomer.note || 'No followup logs recorded.'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Supervisor Audit Comments:</span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl min-h-[60px] text-slate-600 dark:text-slate-350">
                      {drawerCustomer.supervisorComment || 'No comments registered.'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button 
                onClick={() => setDrawerCustomer(null)}
                className="px-4 py-2 border border-slate-202 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Dialogue */}
      {isStatusWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200">
            <h3 className="text-sm font-black text-red-600 mb-2">Mark Lead Completed?</h3>
            <p className="text-xs text-slate-400 leading-normal mb-4">
              Marking this deal complete calculates final progressive sales commissions and syncs them to monthly payroll reports. Make sure price catalog and phone listings are correct.
            </p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => {
                  setPendingStatusChange(null);
                  setIsStatusWarningOpen(false);
                }}
                className="px-3.5 py-1.5 border border-slate-202 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmStatusChange}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-650 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FollowupCustomerTable;
