
import React from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  Center,
  Spinner,
  SimpleGrid,
  Tabs,
  TabList,
  Tab,
  TabIndicator,
  TabPanels,
  TabPanel,
  Grid,
  Container,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  Stack,
  useColorMode,
  useColorModeValue,
  useBreakpointValue,
  HStack,
  IconButton,
  Select,
  Button,
  Flex,
  Input,
  Wrap,
  WrapItem,
  Skeleton,
  SkeletonText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Tag,
  Avatar,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
  Textarea,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, HamburgerIcon, SunIcon, MoonIcon, InfoIcon, BellIcon } from '@chakra-ui/icons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiDollarSign, FiFileText, FiGrid, FiMoreHorizontal, FiMoon, FiShield, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user';

const MotionBox = chakra(motion.div);
import KpiCards from '../components/kpiCards';
import NotificationsPanel from '../components/NotificationsPanel';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import apiClient from '../utils/apiClient';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
} from '@chakra-ui/react';

const buildPolyline = (data, key, width = 260, height = 120) => {
  if (!Array.isArray(data) || !data.length) return '';
  const maxY = Math.max(...data.map((d) => Number(d[key]) || 0), 1);
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  return data
    .map((point, idx) => {
      const x = idx * step;
      const y = height - (Math.max(Number(point[key]) || 0, 0) / maxY) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const calcBarHeights = (data, key, maxHeight = 140) => {
  if (!Array.isArray(data) || !data.length) return [];
  const maxVal = Math.max(...data.map((d) => Number(d[key]) || 0), 1);
  return data.map((d) => ({
    ...d,
    height: Math.max(((Number(d[key]) || 0) / maxVal) * maxHeight, 6),
  }));
};

const buildPieSegments = (data, key = 'value', radius = 42) => {
  if (!Array.isArray(data) || !data.length) return [];
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) || 1;
  let cumulative = 0;
  return data.map((item) => {
    const value = Number(item[key]) || 0;
    const pct = value / total;
    const dash = circumference * pct;
    const dashOffset = circumference * 0.25 - cumulative * circumference; // start at top, go clockwise
    cumulative += pct;
    return { ...item, pct: Math.round(pct * 100), dash, dashOffset, radius, circumference };
  });
};

const getInitials = (value = '') => {
  const tokens = value
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 'NA';
  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('');
};

const fallbackExecutiveActionItems = [
  {
    id: 'fallback-1',
    priority: 'high',
    title: 'Social media approval',
    department: 'Marketing',
    assignee: 'AM',
    dueDate: null,
    status: 'completed',
  },
  {
    id: 'fallback-2',
    priority: 'high',
    title: 'Chat response delay',
    department: 'IT',
    assignee: 'DK',
    dueDate: null,
    status: 'completed',
  },
  {
    id: 'fallback-3',
    priority: 'medium',
    title: 'Vendor contract renewal',
    department: 'Procurement',
    assignee: 'NA',
    dueDate: '2025-05-30',
    status: 'in-progress',
  },
];

const baseTradexSummary = [
  { label: 'Active follow-ups', value: '-', sublabel: '' },
  { label: 'MTD revenue', value: '-', sublabel: '' },
  { label: 'Top platform', value: '-', sublabel: '' },
  { label: 'Avg services/fu', value: '-', sublabel: '' },
];

const fallbackRiskDistributionData = [
  { name: 'High', value: 12, color: '#EF4444' },
  { name: 'Medium', value: 24, color: '#F59E0B' },
  { name: 'Low', value: 36, color: '#10B981' },
];

const fallbackProductPerformance = [
  { name: 'TradexTV', revenue: 1800000, margin: 32 },
  { name: 'Training', revenue: 1250000, margin: 28 },
  { name: 'B2B', revenue: 980000, margin: 24 },
  { name: 'CX Services', revenue: 720000, margin: 22 },
];

const fallbackSocialReport = [
  { platform: 'Facebook', weeklyTarget: 5, posted: 0, actual: 0, completed: false },
  { platform: 'Instagram', weeklyTarget: 5, posted: 0, actual: 0, completed: false },
  { platform: 'LinkedIn', weeklyTarget: 3, posted: 0, actual: 0, completed: false },
  { platform: 'TikTok', weeklyTarget: 4, posted: 0, actual: 0, completed: false },
  { platform: 'Twitter (X)', weeklyTarget: 4, posted: 0, actual: 0, completed: false },
  { platform: 'Telegram', weeklyTarget: 5, posted: 0, actual: 0, completed: false },
  { platform: 'Google', weeklyTarget: 3, posted: 0, actual: 0, completed: false },
  { platform: 'YouTube', weeklyTarget: 2, posted: 0, actual: 0, completed: false },
];

const tradexSocialReport = [
  { platform: 'YouTube', target: 833, actual: 720 },
  { platform: 'TikTok', target: 1666, actual: 1810 },
  { platform: 'Facebook', target: 4166, actual: 3920 },
  { platform: 'LinkedIn', target: 416, actual: 402 },
];

const fallbackFinanceTimeline = [
  { month: 'Jan 2025', revenue: 820000, expenses: 630000, profit: 190000, order: 202501 },
  { month: 'Feb 2025', revenue: 880000, expenses: 660000, profit: 220000, order: 202502 },
  { month: 'Mar 2025', revenue: 950000, expenses: 710000, profit: 240000, order: 202503 },
  { month: 'Apr 2025', revenue: 1010000, expenses: 760000, profit: 250000, order: 202504 },
  { month: 'May 2025', revenue: 1090000, expenses: 800000, profit: 290000, order: 202505 },
  { month: 'Jun 2025', revenue: 1200000, expenses: 820000, profit: 380000, order: 202506 },
];

const buildFinanceTimeline = (monthlyRevenue = [], monthlyExpenses = []) => {
  const timelineMap = new Map();

  const accumulate = (list, targetProp) => {
    (Array.isArray(list) ? list : []).forEach((entry) => {
      if (!entry) return;
      const label =
        entry.label ||
        entry.month ||
        `${entry.year || ''}-${String(entry.periodValue || entry.monthValue || '').padStart(2, '0')}`
          .replace(/^-+|-+$/g, '')
          .trim() ||
        'Unknown';
      const total = Number(entry.total ?? entry.value ?? entry.amount ?? 0);
      const order = Number(entry.order ?? entry.year ?? entry.periodValue ?? 0);
      const existing = timelineMap.get(label) || { label, revenue: 0, expenses: 0, order: 0 };
      existing.order = Math.max(existing.order || 0, order || 0);
      existing[targetProp] += total;
      timelineMap.set(label, existing);
    });
  };

  accumulate(monthlyRevenue, 'revenue');
  accumulate(monthlyExpenses, 'expenses');

  if (!timelineMap.size) return [];

  return Array.from(timelineMap.values())
    .map((item) => ({
      ...item,
      profit: (item.revenue || 0) - (item.expenses || 0),
    }))
    .sort((a, b) => (b.order || 0) - (a.order || 0));
};

const SOCIAL_TARGETS_STORAGE_KEY = 'weeklyTargets';

const readStoredSocialTargets = () => {
  if (typeof window === 'undefined') {
    return fallbackSocialReport;
  }
  try {
    const payload = window.localStorage.getItem(SOCIAL_TARGETS_STORAGE_KEY);
    if (!payload) return fallbackSocialReport;
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed)) {
      return fallbackSocialReport;
    }
    return parsed.map((item) => ({
      platform: item.platform || 'Platform',
      weeklyTarget: Number(item.weeklyTarget) || 0,
      posted: Number(item.posted) || 0,
      actual: Number(item.actual) || Number(item.posted) || 0,
      completed: Boolean(item.completed),
    }));
  } catch (err) {
    console.warn('Failed to parse social targets from storage', err);
    return fallbackSocialReport;
  }
};

const getSocialStatus = (progress) => {
  if (progress === 100) return { status: 'COMPLETED', colorScheme: 'green' };
  if (progress >= 70) return { status: 'ON TRACK', colorScheme: 'green' };
  if (progress >= 30) return { status: 'IN PROGRESS', colorScheme: 'yellow' };
  if (progress >= 1) return { status: 'NEEDS ATTENTION', colorScheme: 'orange' };
  return { status: 'BEHIND', colorScheme: 'red' };
};

const IT_TASK_STORAGE_KEY = 'tradethiopia_it_tasks';

const COODashboard = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [departments, setDepartments] = useState(['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales Manager', 'IT']);
  const [selectedDept, setSelectedDept] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState({ followups: true, assets: true, resources: true });
  const tabListRef = React.useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTradexModalOpen, onOpen: onOpenTradexModal, onClose: onCloseTradexModal } = useDisclosure();
  const { isOpen: isReportsOpen, onOpen: onOpenReports, onClose: onCloseReports } = useDisclosure();
  // department report modal removed
  const { isOpen: isSidePanelOpen, onOpen: onOpenSidePanel, onClose: onCloseSidePanel } = useDisclosure();
  const { isOpen: isDeptDrawerOpen, onOpen: onOpenDeptDrawer, onClose: onCloseDeptDrawer } = useDisclosure();
  const { isOpen: isBroadcastOpen, onOpen: onOpenBroadcast, onClose: onCloseBroadcast } = useDisclosure();
  const { isOpen: isActionDetailOpen, onOpen: onOpenActionDetail, onClose: onCloseActionDetail } = useDisclosure();
  
  // KPI Expandable States
  const [expandedKpi, setExpandedKpi] = useState(null);
  
  const toggleKpiExpansion = (kpiName) => {
    setExpandedKpi(expandedKpi === kpiName ? null : kpiName);
  };
  
  // Action Items State
  const [isActionItemsOpen, setIsActionItemsOpen] = useState(true);
  const [actionItemsFilter, setActionItemsFilter] = useState('all'); // all, high, medium, low
  const [selectedActionItem, setSelectedActionItem] = useState(null);
  
  // Mobile Navigation State
  const [currentMobileTab, setCurrentMobileTab] = useState('overview');
  const [activeSidebarSection, setActiveSidebarSection] = useState('expenses');
  const overviewRef = useRef(null);
  const financeRef = useRef(null);
  const operationsRef = useRef(null);
  const alertsRef = useRef(null);
  const sidebarSections = [
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Total spend, department breakdowns, and the latest month pulse.',
    },
    {
      id: 'costs',
      title: 'Costs',
      description: 'Fixed vs variable costs plus efficiency context.',
    },
    {
      id: 'requests',
      title: 'Requests',
      description: 'Pending work, priority mix, and approval status snapshot.',
    },
    {
      id: 'payroll',
      title: 'Payroll',
      description: 'Aggregated payroll totals, payment status, and department splits.',
    },
    {
      id: 'profit',
      title: 'Profit',
      description: 'Margin view, gross vs net clarity, and current trend.',
    },
  ];
  
  const [actionItems, setActionItems] = useState([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [actionItemsError, setActionItemsError] = useState(null);

  const fetchActionItems = useCallback(async () => {
    setActionItemsLoading(true);
    setActionItemsError(null);
    try {
      const response = await apiClient.get('/action-items');
      const payload = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setActionItems(payload);
    } catch (error) {
      console.error('Failed to load action items', error);
      setActionItems([]);
      setActionItemsError(error.message || 'Unable to load action items');
    } finally {
      setActionItemsLoading(false);
    }
  }, []);
  
  // Priority configuration
  const priorityConfig = {
    critical: { 
      label: 'Critical', 
      colorScheme: 'red', 
      sortOrder: 1,
      urgency: 'Immediate attention required'
    },
    high: { 
      label: 'High', 
      colorScheme: 'orange', 
      sortOrder: 2,
      urgency: 'High priority'
    },
    medium: { 
      label: 'Medium', 
      colorScheme: 'yellow', 
      sortOrder: 3,
      urgency: 'Medium priority'
    },
    low: { 
      label: 'Low', 
      colorScheme: 'green', 
      sortOrder: 4,
      urgency: 'Low priority'
    }
  };
  
  // Status configuration
  const statusConfig = {
    'open': { label: 'Open', color: 'red.500' },
    'in-progress': { label: 'In Progress', color: 'blue.500' },
    'review': { label: 'Review', color: 'yellow.500' },
    'pending': { label: 'Pending', color: 'gray.500' },
    'completed': { label: 'Completed', color: 'green.500' }
  };
  
  // Sort action items by priority
  const sortedActionItems = useMemo(() => {
    return [...actionItems].sort((a, b) => {
      return priorityConfig[a.priority].sortOrder - priorityConfig[b.priority].sortOrder;
    });
  }, [actionItems]);
  
  // Filter action items based on priority
  const filteredActionItems = useMemo(() => {
    if (actionItemsFilter === 'all') return sortedActionItems;
    return sortedActionItems.filter(item => item.priority === actionItemsFilter);
  }, [sortedActionItems, actionItemsFilter]);
  
  // Handle opening action detail drawer
  const openActionDetail = (actionItem) => {
    setSelectedActionItem(actionItem);
    onOpenActionDetail();
  };
  
  // Count action items by priority
  const actionItemCount = useMemo(() => {
    return {
      all: actionItems.length,
      critical: actionItems.filter(item => item.priority === 'critical').length,
      high: actionItems.filter(item => item.priority === 'high').length,
      medium: actionItems.filter(item => item.priority === 'medium').length,
      low: actionItems.filter(item => item.priority === 'low').length
    };
  }, [actionItems]);
  
  // Sample data for Storyline section
  const timelineData = useMemo(() => [
    { date: '2025-10-15', event: 'Q3 Results Published', value: 85, color: 'green.500' },
    { date: '2025-11-01', event: 'New Product Launch', value: 70, color: 'blue.500' },
    { date: '2025-11-15', event: 'Infrastructure Upgrade', value: 90, color: 'purple.500' },
    { date: '2025-12-01', event: 'Holiday Season Prep', value: 65, color: 'orange.500' },
    { date: '2025-12-15', event: 'Q4 Performance Review', value: 75, color: 'red.500' },
  ], []);
  
  const heatmapData = useMemo(() => {
    const departments = ['Sales', 'Finance', 'IT', 'Customer Success', 'Marketing'];
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    return departments.map(dept => ({
      department: dept,
      weeks: weeks.map(week => ({
        week,
        value: Math.floor(Math.random() * 100), // Random values for demo
      }))
    }));
  }, []);
  
  const progressBarData = useMemo(() => [
    { label: 'Q4 Revenue Target', current: 12500000, target: 15000000, color: 'blue.500' },
    { label: 'Customer Satisfaction', current: 87, target: 90, color: 'green.500', unit: '%' },
    { label: 'Employee Engagement', current: 78, target: 85, color: 'purple.500', unit: '%' },
    { label: 'Operational Efficiency', current: 92, target: 95, color: 'orange.500', unit: '%' },
  ], []);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [excludedDepartments, setExcludedDepartments] = useState(['Host', 'Sales Forces']);
  const [itSummary, setItSummary] = useState({ total: 0, completed: 0, open: 0, points: 0 });
  const [loadingIt, setLoadingIt] = useState(false);
  const [salesStats, setSalesStats] = useState({
    total: 0,
    completedDeals: 0,
    calledCustomers: 0,
    newProspects: 0,
    totalCommission: 0,
    grossCommission: 0,
    commissionTax: 0,
  });
  const [loadingSales, setLoadingSales] = useState(false);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [followupSummary, setFollowupSummary] = useState({ total: 0, active: 0, agents: 0, packages: 0 });
  const [loadingRevenueOps, setLoadingRevenueOps] = useState(false);
  const [csStats, setCsStats] = useState({ total: 0, active: 0, completed: 0, newCustomers: 0, returningCustomers: 0 });
  const [followupStats, setFollowupStats] = useState({ overdue: 0, pending: 0, completed: 0 });
  const [loadingCsStats, setLoadingCsStats] = useState(false);
  const [financeStats, setFinanceStats] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    invoices: 0,
    totalCostsRecorded: 0,
    monthlyRevenue: [],
    monthlyExpenses: [],
    weeklyRevenue: [],
    weeklyExpenses: [],
  });
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeReports, setFinanceReports] = useState([]);
  const [loadingFinanceReports, setLoadingFinanceReports] = useState(false);
  const [revenueActuals, setRevenueActuals] = useState([]);
  const [socialTargets, setSocialTargets] = useState(() => readStoredSocialTargets());
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => {
      setSocialTargets(readStoredSocialTargets());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const refMap = {
      overview: overviewRef,
      finance: financeRef,
      operations: operationsRef,
      alerts: alertsRef,
    };
    const target = refMap[currentMobileTab]?.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentMobileTab]);

  useEffect(() => {
    if (isActionItemsOpen) {
      fetchActionItems();
    }
  }, [isActionItemsOpen, fetchActionItems]);
  const monthOrder = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

  const fallbackRevenueChartData = [
    { month: 'Jan 2025', revenue: 4000000, target: 4500000 },
    { month: 'Feb 2025', revenue: 3000000, target: 3500000 },
    { month: 'Mar 2025', revenue: 2000000, target: 3000000 },
    { month: 'Apr 2025', revenue: 2780000, target: 3200000 },
    { month: 'May 2025', revenue: 1890000, target: 2800000 },
    { month: 'Jun 2025', revenue: 2390000, target: 3000000 },
    { month: 'Jul 2025', revenue: 3490000, target: 3800000 },
    { month: 'Aug 2025', revenue: 2800000, target: 3200000 },
    { month: 'Sep 2025', revenue: 3100000, target: 3500000 },
    { month: 'Oct 2025', revenue: 3700000, target: 4000000 },
    { month: 'Nov 2025', revenue: 4200000, target: 4500000 },
    { month: 'Dec 2025', revenue: 4500000, target: 5000000 },
  ];

  const fallbackDepartmentPerformanceData = [
    { department: 'Sales', score: 85, color: '#6366F1' },
    { department: 'Finance', score: 78, color: '#0EA5E9' },
    { department: 'IT', score: 92, color: '#22C55E' },
    { department: 'Customer Success', score: 88, color: '#F97316' },
    { department: 'Marketing', score: 75, color: '#A855F7' },
  ];

  const revenueChartData = useMemo(() => {
    if (!Array.isArray(revenueActuals) || revenueActuals.length === 0) {
      return fallbackRevenueChartData;
    }
    const aggregated = revenueActuals.reduce((acc, row) => {
      const rawMonth = (row.month || '').toString().trim();
      const normalized = rawMonth.slice(0, 3).toLowerCase();
      const year = Number(row.year) || new Date().getFullYear();
      const key = `${normalized}-${year}`;
      if (!acc[key]) {
        acc[key] = {
          month: rawMonth || 'Month',
          year,
          revenue: 0,
          target: 0,
          monthIndex: monthOrder.indexOf(normalized) >= 0 ? monthOrder.indexOf(normalized) : 12,
        };
      }
      acc[key].revenue += Number(row.actual) || 0;
      acc[key].target += Number(row.target) || 0;
      return acc;
    }, {});

    const sorted = Object.values(aggregated).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.monthIndex || 12) - (b.monthIndex || 12);
    });

    if (!sorted.length) {
      return fallbackRevenueChartData;
    }

    return sorted
      .slice(-12)
      .map((row) => ({
        month: `${row.month} ${row.year}`.trim(),
        revenue: row.revenue,
        target: row.target,
      }));
  }, [revenueActuals]);

  const departmentPerformanceData = useMemo(() => {
    const rawMetrics = [
      { department: 'Sales', value: salesStats.completedDeals || 0, color: '#6366F1' },
      { department: 'Finance', value: financeStats.profit || 0, color: '#0EA5E9' },
      { department: 'IT', value: itSummary.points || 0, color: '#22C55E' },
      { department: 'Customer Success', value: csStats.completed || 0, color: '#F97316' },
      { department: 'Operations', value: followupSummary.active || 0, color: '#A855F7' },
    ];
    const maxValue = Math.max(
      ...rawMetrics.map((item) => Math.max(item.value, 0)),
      1
    );
    const normalized = rawMetrics.map((item) => ({
      department: item.department,
      score: Math.min(100, Math.round((item.value / maxValue) * 100)),
      color: item.color,
      hasRealValue: item.value > 0,
    }));
    const hasLiveValue = normalized.some((item) => item.hasRealValue);
    return hasLiveValue ? normalized : fallbackDepartmentPerformanceData;
  }, [salesStats, financeStats, itSummary, csStats, followupSummary]);

  const riskDistributionData = useMemo(() => {
    const high = followupStats.overdue || 0;
    const medium = followupStats.pending || 0;
    const low = followupStats.completed || 0;
    const total = high + medium + low;
    if (total === 0) {
      return fallbackRiskDistributionData;
    }
    return [
      { name: 'High', value: high, color: '#EF4444' },
      { name: 'Medium', value: medium, color: '#F59E0B' },
      { name: 'Low', value: low, color: '#10B981' },
    ];
  }, [followupStats]);

  const requestStatusBuckets = useMemo(() => {
    const buckets = ['open', 'in-progress', 'review', 'pending', 'completed'];
    return buckets.map((status) => ({
      status,
      count: actionItems.filter((item) => item.status === status).length,
    }));
  }, [actionItems]);

  const expenseBreakdown = useMemo(() => {
    const baseExpense = Math.max(financeStats.expenses || 0, 100000);
    const visibleDepts = departments.filter((dept) => dept !== 'All').slice(0, 3);
    let assigned = 0;
    const portions = visibleDepts.map((dept, index) => {
      const amount = Math.round(baseExpense * Math.max(0.28 - index * 0.05, 0.08));
      assigned += amount;
      const requests = actionItems.filter(
        (item) => (item.department || '').toLowerCase() === dept.toLowerCase()
      ).length;
      return {
        department: dept,
        amount,
        requests,
      };
    });
    const remainder = Math.max(baseExpense - assigned, 0);
    if (remainder > 0) {
      const accountedRequests = portions.reduce((sum, section) => sum + section.requests, 0);
      portions.push({
        department: 'Other departments',
        amount: remainder,
        requests: Math.max(actionItems.length - accountedRequests, 0),
      });
    }
    return portions;
  }, [actionItems, departments, financeStats.expenses]);

  const renderSidebarSectionContent = () => {
    const totalExpensesValue = Math.max(financeStats.expenses || 0, 0);
    const totalCostsValue = Math.max(financeStats.totalCostsRecorded || financeStats.expenses || 0, 0);
    const spendRatio = totalCostsValue
      ? Math.min(
          100,
          Math.round(
            (totalExpensesValue / Math.max(totalCostsValue, 1)) * 100
          )
        )
      : 0;
    const fixedCostsValue = Math.round(totalCostsValue * 0.58);
    const variableCostsValue = Math.max(totalCostsValue - fixedCostsValue, 0);
    const efficiencyScore = financeStats.revenue
      ? Math.max(
          0,
          Math.min(
            110,
            Math.round(
              ((financeStats.revenue - totalCostsValue) / Math.max(financeStats.revenue, 1)) * 100
            )
          )
        )
      : 0;
    const costTrendSample = departmentPerformanceData.slice(0, 3);
    const pendingRequestsCount = actionItems.filter((item) => item.status !== 'completed').length;
    const priorityDistribution = Object.entries(priorityConfig).map(
      ([key, config]) => ({
        id: key,
        label: config.label,
        count: actionItems.filter((item) => item.priority === key).length,
        color: config.colorScheme,
      })
    );
    const approvalStatusSummary = ['open', 'review', 'completed'].map((status) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      count: requestStatusBuckets.find((bucket) => bucket.status === status)?.count ?? 0,
    }));
    const payrollTotal = Math.round(totalExpensesValue * 0.32);
    const payrollPaid = Math.round(payrollTotal * 0.82);
    const payrollUnpaid = Math.max(payrollTotal - payrollPaid, 0);
    const payrollDistribution = ['Operations', 'Finance', 'Customer Success', 'IT'].map(
      (dept, idx) => {
        const sharePercents = [0.34, 0.26, 0.22, 0.18];
        const amount = Math.round(payrollTotal * sharePercents[idx]);
        return {
          department: dept,
          amount,
          pct: payrollTotal ? Math.round((amount / payrollTotal) * 100) : 0,
        };
      }
    );
    switch (activeSidebarSection) {
      case 'expenses':
        return (
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="semibold">
                Total expenses
              </Text>
              <Heading size="md">
                {currencyFormatter.format(totalExpensesValue)}
              </Heading>
            </Flex>
            <Text fontSize="xs" color={sidebarSectionTextColor}>
              Read-only, COO-level summary.
            </Text>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={2}>
                Department breakdown
              </Text>
              <VStack align="stretch" spacing={2}>
                {expenseBreakdown.map((section) => (
                  <Box key={section.department} borderRadius="md" bg={sidebarSectionBg} p={3}>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm">{section.department}</Text>
                      <Text fontWeight="semibold">{currencyFormatter.format(section.amount)}</Text>
                    </Flex>
                    <Text fontSize="xs" color={sidebarSectionTextColor}>
                      {section.requests} expense request{section.requests === 1 ? '' : 's'}
                    </Text>
                    <Progress
                      value={Math.min(
                        Math.round((section.amount / Math.max(totalExpensesValue, 1)) * 100),
                        100
                      )}
                      size="xs"
                      colorScheme="orange"
                      mt={2}
                      borderRadius="md"
                    />
                  </Box>
                ))}
              </VStack>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={1}>
                Current month insight
              </Text>
              <Text fontSize="sm" color={sidebarSectionTextColor}>
                {currentMonthName} spend is {spendRatio}% of recorded costs, tracking steady against plan.
              </Text>
            </Box>
          </VStack>
        );
      case 'costs':
        return (
          <VStack align="stretch" spacing={3}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <Box borderRadius="md" borderWidth="1px" borderColor={borderColor} p={3}>
                <Text fontSize="xs" fontWeight="semibold" mb={1}>
                  Fixed costs
                </Text>
                <Heading size="md">{currencyFormatter.format(fixedCostsValue)}</Heading>
              </Box>
              <Box borderRadius="md" borderWidth="1px" borderColor={borderColor} p={3}>
                <Text fontSize="xs" fontWeight="semibold" mb={1}>
                  Variable costs
                </Text>
                <Heading size="md">{currencyFormatter.format(variableCostsValue)}</Heading>
              </Box>
            </SimpleGrid>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={2}>
                Department cost trend
              </Text>
              <VStack align="stretch" spacing={2}>
                {costTrendSample.map((dept) => (
                  <Flex key={dept.department} justify="space-between" align="center">
                    <Text fontSize="sm">{dept.department}</Text>
                    <Badge
                      colorScheme={dept.score > 80 ? 'green' : 'yellow'}
                      variant="subtle"
                    >
                      {dept.score}% control
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={1}>
                Efficiency insight only
              </Text>
              <Text fontSize="sm" color={sidebarSectionTextColor}>
                Revenue-to-cost efficiency is {efficiencyScore}%.
              </Text>
            </Box>
          </VStack>
        );
      case 'requests':
        return (
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontSize="sm" fontWeight="semibold">
                Pending requests
              </Text>
              <Heading size="lg">{pendingRequestsCount}</Heading>
              <Text fontSize="xs" color={sidebarSectionTextColor}>
                Awaiting COO review.
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={2}>
                Priority distribution
              </Text>
              <Wrap spacing={2}>
                {priorityDistribution.map((item) => (
                  <Badge
                    key={item.id}
                    colorScheme={item.count ? item.color : 'gray'}
                    variant="subtle"
                  >
                    {item.label}: {item.count}
                  </Badge>
                ))}
              </Wrap>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={2}>
                Approval status summary
              </Text>
              <SimpleGrid columns={3} spacing={2}>
                {approvalStatusSummary.map((status) => (
                  <Box key={status.label} borderRadius="md" bg={sidebarSectionBg} p={2}>
                    <Text fontSize="xs" color={sidebarSectionTextColor}>
                      {status.label}
                    </Text>
                    <Heading size="sm">{status.count}</Heading>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        );
      case 'payroll':
        return (
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="semibold">
                Total payroll
              </Text>
              <Heading size="md">{currencyFormatter.format(payrollTotal)}</Heading>
            </Flex>
            <Text fontSize="xs" color={sidebarSectionTextColor}>
              No individual salaries are exposed.
            </Text>
            <SimpleGrid columns={2} spacing={2}>
              <Box borderRadius="md" borderWidth="1px" borderColor={borderColor} p={2}>
                <Text fontSize="xs" fontWeight="semibold">
                  Paid
                </Text>
                <Heading size="md">{currencyFormatter.format(payrollPaid)}</Heading>
              </Box>
              <Box borderRadius="md" borderWidth="1px" borderColor={borderColor} p={2}>
                <Text fontSize="xs" fontWeight="semibold">
                  Unpaid
                </Text>
                <Heading size="md">{currencyFormatter.format(payrollUnpaid)}</Heading>
              </Box>
            </SimpleGrid>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={2}>
                Department distribution
              </Text>
              <VStack align="stretch" spacing={2}>
                {payrollDistribution.map((dept) => (
                  <Flex key={dept.department} justify="space-between" align="center">
                    <Text fontSize="sm">{dept.department}</Text>
                    <Text fontWeight="semibold">{dept.pct}%</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </VStack>
        );
      case 'profit':
        return (
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={1}>
                Margin summary
              </Text>
              <Heading size="xl">{profitMargin}%</Heading>
              <Text fontSize="sm" color={sidebarSectionTextColor}>
                Net {currencyFormatter.format(netProfitValue)} vs gross {currencyFormatter.format(grossRevenueValue)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" mb={1}>
                Current period trend
              </Text>
              <Text fontSize="sm" color={sidebarSectionTextColor}>
                {profitTrendLabel}
              </Text>
              <SimpleGrid columns={3} spacing={2} mt={2}>
                {recentProfitPoints.map((point) => (
                  <Box key={point.month} borderRadius="md" bg={sidebarSectionBg} p={2}>
                    <Text fontSize="xx-small" color={sidebarSectionTextColor}>
                      {point.month}
                    </Text>
                    <Text fontWeight="semibold">
                      {currencyFormatter.format(point.profit)}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        );
      default:
        return null;
    }
  };
  
  // Sample data for KPI sparklines
  const revenueTrendData = useMemo(() => [
    { month: 'Jan', value: 8500000 },
    { month: 'Feb', value: 9200000 },
    { month: 'Mar', value: 7800000 },
    { month: 'Apr', value: 10500000 },
    { month: 'May', value: 9800000 },
    { month: 'Jun', value: 11200000 },
  ], []);
  
  const cashFlowTrendData = useMemo(() => [
    { month: 'Jan', value: 2100000 },
    { month: 'Feb', value: 2400000 },
    { month: 'Mar', value: 1900000 },
    { month: 'Apr', value: 2800000 },
    { month: 'May', value: 2600000 },
    { month: 'Jun', value: 3100000 },
  ], []);
  
  const uptimeTrendData = useMemo(() => [
    { week: 'W1', value: 99.2 },
    { week: 'W2', value: 98.5 },
    { week: 'W3', value: 99.7 },
    { week: 'W4', value: 98.9 },
    { week: 'W5', value: 99.3 },
    { week: 'W6', value: 98.7 },
  ], []);
  
  const riskTrendData = useMemo(() => [
    { month: 'Jan', value: 12 },
    { month: 'Feb', value: 8 },
    { month: 'Mar', value: 15 },
    { month: 'Apr', value: 6 },
    { month: 'May', value: 9 },
    { month: 'Jun', value: 7 },
  ], []);
  const executiveSummaryItems = useMemo(
    () => [
      { label: 'Operational Health', value: 'Stable' },
      { label: 'Revenue Momentum', value: '+4.3%' },
      { label: 'Open Decisions', value: '15' },
      { label: 'High Risks', value: '2' },
    ],
    []
  );
  const executiveKpiCards = useMemo(
    () => [
      {
        id: 'revenue',
        label: 'Revenue',
        value: 'ETB 1,783,654',
        trend: '+4.3% MoM',
        footer: 'Recognized this period',
        accent: '#2563EB',
        surface: '#EFF6FF',
        icon: FiDollarSign,
        sparkline: revenueTrendData,
        sparkKey: 'value',
      },
      {
        id: 'cash-flow',
        label: 'Cash Flow',
        value: 'ETB 867,553',
        trend: 'Net',
        footer: 'Available operating cash',
        accent: '#059669',
        surface: '#ECFDF5',
        icon: FiTrendingUp,
        sparkline: cashFlowTrendData,
        sparkKey: 'value',
      },
      {
        id: 'uptime',
        label: 'Uptime',
        value: '98.7%',
        trend: 'Last 30 days',
        footer: 'Core systems availability',
        accent: '#6D28D9',
        surface: '#F3E8FF',
        icon: FiActivity,
        sparkline: uptimeTrendData,
        sparkKey: 'value',
      },
      {
        id: 'risk-flags',
        label: 'Risk Flags',
        value: '25',
        trend: 'Across departments',
        footer: 'Monitored in current cycle',
        accent: '#EA580C',
        surface: '#FFF7ED',
        icon: FiAlertTriangle,
        sparkline: riskTrendData,
        sparkKey: 'value',
      },
    ],
    [cashFlowTrendData, revenueTrendData, riskTrendData, uptimeTrendData]
  );
  const actionQueueItems = useMemo(() => {
    const source = actionItems.length ? actionItems : fallbackExecutiveActionItems;
    return source.map((item) => {
      const dueDateValue = item.dueDate ? new Date(item.dueDate) : null;
      const dueDateLabel =
        dueDateValue && !Number.isNaN(dueDateValue.getTime())
          ? dueDateValue.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'No due date';
      return {
        ...item,
        owner: item.assignee && item.assignee.length <= 3 ? item.assignee.toUpperCase() : getInitials(item.assignee || 'NA'),
        dueDateLabel,
      };
    });
  }, [actionItems]);
  const actionQueueCounts = useMemo(() => {
    if (actionItems.length) {
      return actionItemCount;
    }
    return { all: 15, critical: 0, high: 2, medium: 12, low: 1 };
  }, [actionItemCount, actionItems.length]);
  const queueFilteredItems = useMemo(() => {
    if (actionItemsFilter === 'all') return actionQueueItems;
    return actionQueueItems.filter((item) => item.priority === actionItemsFilter);
  }, [actionItemsFilter, actionQueueItems]);
  const performanceStorylineData = useMemo(
    () => [
      { month: 'Jan', current: 1210000, previous: 1120000 },
      { month: 'Feb', current: 1285000, previous: 1190000 },
      { month: 'Mar', current: 1368000, previous: 1260000 },
      { month: 'Apr', current: 1452000, previous: 1340000 },
      { month: 'May', current: 1594000, previous: 1468000 },
      { month: 'Jun', current: 1783654, previous: 1654000 },
    ],
    []
  );
  const performanceSummaryItems = useMemo(
    () => [
      { label: 'Total Revenue', value: 'ETB 1,783,654' },
      { label: 'Avg. Daily Revenue', value: 'ETB 59,455' },
      { label: 'Best Performing Dept.', value: 'Sales' },
      { label: 'Revenue Forecast', value: 'ETB 1.92M' },
    ],
    []
  );
  const profitLossReport = useMemo(() => {
    const match = financeReports.find((r) => {
      const title = (r?.title || r?.name || '').toLowerCase();
      return title.includes('profit') || title.includes('loss') || title.includes('p&l');
    });
    return match || null;
  }, [financeReports]);

  const revenueTrend = useMemo(() => {
    if (Array.isArray(revenueActuals) && revenueActuals.length) {
      const normalized = revenueActuals.map((row) => {
        const m = (row.month || '').toString().toLowerCase();
        const idx = monthOrder.indexOf(m);
        return {
          label: `${row.month || 'Mo'} ${row.year || ''}`.trim(),
          value: Number(row.actual) || 0,
          order: idx >= 0 ? idx : 99,
          year: Number(row.year) || 0,
        };
      });
      const sorted = normalized.sort((a, b) => (a.year === b.year ? a.order - b.order : a.year - b.year));
      return sorted.slice(-6);
    }
    return [
      { label: 'Jan', value: 1200000 },
      { label: 'Feb', value: 1350000 },
      { label: 'Mar', value: 1420000 },
      { label: 'Apr', value: 1500000 },
      { label: 'May', value: 1580000 },
      { label: 'Jun', value: 1620000 },
    ];
  }, [revenueActuals]);

    const deptMix = useMemo(() => {
      const metrics = [
        { label: 'Sales', value: salesStats.completedDeals || salesStats.total || 0, color: 'blue.500' },
        { label: 'Finance', value: financeStats.revenue || 0, color: 'purple.500' },
        { label: 'Customer Success', value: csStats.active || 0, color: 'green.500' },
        { label: 'IT', value: itSummary.points || 0, color: 'orange.400' },
        { label: 'Ops', value: followupSummary.active || 0, color: 'pink.400' },
      ];
      const total = metrics.reduce((sum, item) => sum + Math.max(item.value, 0), 0) || 1;
      return metrics.map((item) => ({
        label: item.label,
        value: Math.min(100, Math.round((item.value / total) * 100)),
        color: item.color,
      }));
    }, [salesStats, financeStats, csStats, itSummary, followupSummary]);
    const socialSummary = useMemo(() => {
      const totalTarget = socialTargets.reduce((sum, row) => sum + (row.weeklyTarget || 0), 0);
      const totalActual = socialTargets.reduce((sum, row) => sum + (row.actual || 0), 0);
      const deltaPct = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
      return {
        totalTarget,
        totalActual,
        deltaPct: Math.round(deltaPct * 10) / 10,
      };
    }, [socialTargets]);
    const socialReportRows = useMemo(
      () =>
        socialTargets.map((row) => {
          const actual = Number(row.actual) || 0;
          const target = Number(row.weeklyTarget) || 0;
          const deltaPercent = target ? Math.round(((actual - target) / target) * 1000) / 10 : 0;
          const progress = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
          const statusInfo = getSocialStatus(progress);
          return {
            ...row,
            actual,
            target,
            deltaPercent,
            progress,
            status: row.completed ? 'COMPLETED' : statusInfo.status,
            colorScheme: row.completed ? 'green' : statusInfo.colorScheme,
          };
        }),
      [socialTargets]
    );

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  // Department drawer removed
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const toast = useToast();
  const isCoo = (currentUser?.role || '').toLowerCase() === 'coo';
  const cardBg = '#FFFFFF';
  const borderColor = '#E5E7EB';
  const controlTextColor = '#0F172A';
  const sidebarSectionBg = '#F8FAFC';
  const sidebarSectionActiveBg = '#F3E8FF';
  const sidebarSectionHover = '#F1F5F9';
  const sidebarSectionTextColor = '#64748B';
  const appBg = '#F6F8FB';
  const shellBg = '#FFFFFF';
  const shellBorder = '#E5E7EB';
  const shellMuted = '#64748B';
  const sidebarSurface = '#FFFFFF';
  const heroGradient = 'linear(135deg, #1E3A8A 0%, #2563EB 45%, #0D9488 100%)';
  const currentMonthName = useMemo(
    () =>
      new Date().toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      }),
    []
  );
  const accentGradients = [
    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
    'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #F472B6 0%, #6366F1 100%)',
  ];
  const activeDeptCount = Math.max(departments.filter(d => !excludedDepartments.includes(d)).length - 1, 0); // minus "All"
  const timeRangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '365d': 'Last 12 months'
  };
  const desktopNavItems = [
    { id: 'overview', label: 'Overview', ref: overviewRef, icon: InfoIcon },
    { id: 'finance', label: 'Finance', ref: financeRef, icon: BellIcon },
    { id: 'operations', label: 'Operations', ref: operationsRef, icon: HamburgerIcon },
    { id: 'alerts', label: 'Alerts', ref: alertsRef, icon: ExternalLinkIcon },
  ];
  const controlStackTargetMap = {
    expenses: financeRef,
    costs: financeRef,
    requests: alertsRef,
    payroll: financeRef,
    profit: operationsRef,
  };
  const revenueSummary = { total: '$12.4M', change: '+4.3% MoM' }; // placeholder aggregate for display
  const showSocialRequestsSection = false;
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );
  const etbFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0,
      }),
    []
  );
  const revenueHighlights = useMemo(
    () => [
      {
        label: 'Revenue',
        value: etbFormatter.format(financeStats.revenue || 0),
        color: 'blue.600',
        tag: revenueSummary.change,
        subtitle: 'MTD total',
      },
      {
        label: 'Expenses',
        value: etbFormatter.format(financeStats.expenses || 0),
        color: 'red.500',
        tag: 'Actuals',
        subtitle: 'Operational spend',
      },
      {
        label: 'Profit',
        value: etbFormatter.format(financeStats.profit || 0),
        color: 'green.500',
        tag: 'Net',
        subtitle: 'Revenue minus costs',
      },
      {
        label: 'Invoices',
        value: `${financeStats.invoices || 0}`,
        color: 'purple.500',
        tag: 'Open',
        subtitle: 'Outstanding bills',
      },
    ],
    [financeStats, etbFormatter, revenueSummary.change]
  );
  const tabBorderColor = useColorModeValue('gray.200', 'gray.700');
  const tabBg = useColorModeValue('white', 'gray.800');
  const deptCardBg = useColorModeValue('gray.50', 'gray.700');
  const purchaseOrders = useMemo(
    () => [
      { id: 'PO-1124', department: 'Finance', vendor: 'Dembel Traders', amount: 1250000, status: 'Approved', eta: 'Arrives in 2 days' },
      { id: 'PO-1131', department: 'IT', vendor: 'Sena Technologies', amount: 820000, status: 'Pending', eta: 'Review by tomorrow' },
      { id: 'PO-1140', department: 'Operations', vendor: 'Blue Nile Supplies', amount: 430000, status: 'Approved', eta: 'Dispatching' },
      { id: 'PO-1155', department: 'Customer Succes', vendor: 'Awash Hardware', amount: 215000, status: 'Draft', eta: 'Finalize requisition' },
    ],
    []
  );
  const purchaseStatusColors = {
    Approved: 'green',
    Pending: 'orange',
    Draft: 'purple',
    Cancelled: 'red',
  };

  const fixedDepartments = ['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales Manager', 'IT'];
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);

  const scrollTabs = (delta) => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const displayedDepartments = departments.filter(d => {
    if (d === 'All') return true;
    if (excludedDepartments.includes(d)) return false;
    if (!searchTerm.trim()) return true;
    return d.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const secondRowSet = React.useMemo(
    () => new Set(['customer service', 'host', 'sales officer']),
    []
  );
  const orderedDepartments = React.useMemo(() => {
    const first = [];
    const second = [];
    displayedDepartments.forEach((d) => {
      if (secondRowSet.has(d.toLowerCase())) {
        second.push(d);
      } else {
        first.push(d);
      }
    });
    return [...first, ...second];
  }, [displayedDepartments, secondRowSet]);

  const effectiveDept = useMemo(() => {
    const label = selectedDept || '';
    return label.toLowerCase().includes('tradex') ? 'tradextv' : label;
  }, [selectedDept]);
  const deptRouteMap = useMemo(() => ({
    tradextv: '/tradextv-dashboard',
    'sales manager': '/salesmanager',
    finance: '/finance-dashboard',
    it: '/it',
    'customer succes': '/cdashboard',
  }), []);
  const fallbackTradexRevenueRows = [
    { metric: 'MTD revenue', target: 1200000, actual: 1290000 },
    { metric: 'New bookings', target: 550000, actual: 590000 },
    { metric: 'Renewals & upsell', target: 320000, actual: 345000 },
  ];
  const formatSla = (completed, total) => {
    if (!total) return 'N/A';
    return `${Math.min(100, Math.round((Math.max(completed, 0) / total) * 100))}%`;
  };

  const computeStatusByRatio = (open, total) => {
    if (!total) return 'Watch';
    const ratio = open / total;
    if (ratio <= 0.2) return 'On track';
    if (ratio <= 0.5) return 'Watch';
    return 'Attention';
  };

  // Lightweight department report snapshots for the popup
  const departmentReports = useMemo(() => {
    const tradexTasks = followupSummary.total || 0;
    const tradexOpen = Math.max(tradexTasks - (followupSummary.completed || 0), 0);
    const tradexRisks = followupStats.overdue || 0;
    const tradexSla = formatSla(followupSummary.active, tradexTasks);

    const csTasks = csStats.total || 0;
    const csOpen = Math.max(csTasks - (csStats.completed || 0), 0);
    const csRisks = Math.max(csOpen, 0);
    const csSla = formatSla(csStats.completed, csTasks);

    const financeTasks = financeStats.invoices || 0;
    const financeOpen = financeTasks;
    const financeRisks = Math.max(Math.round((financeStats.expenses || 0) / 500000), 0);
    const financeSla = formatSla(financeStats.profit, Math.max((financeStats.revenue || 0) + (financeStats.expenses || 0), 1));

    const salesTasks = salesStats.total || 0;
    const salesCompleted = salesStats.completedDeals || 0;
    const salesOpen = Math.max(salesTasks - salesCompleted, 0);
    const salesRisks = Math.max(salesOpen - (salesStats.calledCustomers || 0), 0);
    const salesSla = formatSla(salesCompleted, Math.max(salesTasks, 1));

    const itTasks = itSummary.total || 0;
    const itOpen = itSummary.open || 0;
    const itRisks = Math.max(itOpen - (itSummary.completed || 0), 0);
    const itSla = formatSla(itSummary.completed, Math.max(itTasks, 1));

    return [
      {
        department: 'Customer Succes',
        status: computeStatusByRatio(csOpen, csTasks),
        color: 'yellow',
        risks: csRisks,
        tasks: csTasks,
        sla: csSla,
      },
    ];
  }, [departments, excludedDepartments, followupSummary, followupStats, csStats, financeStats, salesStats, itSummary]);

  const currentDeptReport = useMemo(() => {
    const fallback = { department: selectedDept, status: 'N/A', color: 'gray', risks: 0, tasks: 0, sla: '—' };
    const found = departmentReports.find((d) => d.department === selectedDept);
    return found || fallback;
  }, [departmentReports, selectedDept]);

    const computeItSummaryFromTasks = useCallback((tasks = []) => {
      if (!Array.isArray(tasks)) {
        return { total: 0, completed: 0, open: 0, points: 0 };
      }
      const normalized = tasks.map((task) => ({
        status: (task.status || '').toString().toLowerCase(),
        points: Number(task.points) || Number(task.featureCount) || 0,
      }));
      const total = normalized.length;
      const isDoneStatus = (status) => ['done', 'completed'].includes(status);
      const completedItems = normalized.filter((item) => isDoneStatus(item.status));
      const completed = completedItems.length;
      const open = Math.max(total - completed, 0);
      const points = completedItems.reduce((acc, item) => acc + item.points, 0);
      return {
        total,
        completed,
        open,
        points,
      };
    }, []);
  const loadItSummaryFromStorage = useCallback(() => {
    setLoadingIt(true);
    if (typeof window === 'undefined') {
      setItSummary({ total: 0, completed: 0, open: 0, points: 0 });
      setLoadingIt(false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(IT_TASK_STORAGE_KEY);
      const tasks = stored ? JSON.parse(stored) : [];
      setItSummary(computeItSummaryFromTasks(tasks));
    } catch (err) {
      console.warn('Failed to load IT tasks summary', err);
      setItSummary({ total: 0, completed: 0, open: 0, points: 0 });
    } finally {
      setLoadingIt(false);
    }
  }, [computeItSummaryFromTasks]);

  useEffect(() => {
    loadItSummaryFromStorage();
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleStorage = (event) => {
      if (event.key === IT_TASK_STORAGE_KEY) {
        loadItSummaryFromStorage();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadItSummaryFromStorage]);

  const salesRangeMap = useMemo(
    () => ({
      '7d': 'week',
      '30d': 'month',
      '90d': 'quarter',
      '365d': 'year',
    }),
    []
  );

  const fetchSalesStats = useCallback(
    async (range = timeRange) => {
      setLoadingSales(true);
      try {
        const mappedRange = salesRangeMap[range] || 'all';
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-manager/team-performance`, {
          params: { timeRange: mappedRange },
          headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
        });
        const data = res.data || {};
        const teamStats = data.teamStats || {};
        const statusDistribution = Array.isArray(data.statusDistribution) ? data.statusDistribution : [];
        const salesCount = statusDistribution.reduce((sum, bucket) => sum + (Number(bucket.value) || 0), 0);
        const grossCommission = teamStats.totalTeamGrossCommission || 0;
        const totalCommission = teamStats.totalTeamNetCommission || 0;
        const commissionTax = Math.max(grossCommission - totalCommission, 0);
        setSalesStats({
          total: teamStats.totalTeamSales || 0,
          completedDeals: teamStats.totalTeamSales || 0,
          calledCustomers: salesCount,
          newProspects: Array.isArray(data.agentPerformance) ? data.agentPerformance.length : 0,
          totalCommission,
          grossCommission,
          commissionTax,
        });
      } catch (err) {
        console.warn('Failed to load sales stats', err);
        setSalesStats({
          total: 0,
          completedDeals: 0,
          calledCustomers: 0,
          newProspects: 0,
          totalCommission: 0,
          grossCommission: 0,
          commissionTax: 0,
        });
      } finally {
        setLoadingSales(false);
      }
    },
    [currentUser?.token, salesRangeMap, timeRange]
  );

  const fetchCsStats = useCallback(async () => {
    setLoadingCsStats(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/stats`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const data = res.data || {};
      const totalFollowups = data.total ?? data.totalFollowups ?? 0;
      const activeFollowups = data.active ?? data.activeFollowups ?? 0;
      const completedFollowups = data.completed ?? data.completedFollowups ?? 0;
      setCsStats({
        total: totalFollowups,
        active: activeFollowups,
        completed: completedFollowups,
        newCustomers: data.newCustomers ?? 0,
        returningCustomers: data.returningCustomers ?? 0
      });
      setFollowupStats({
        overdue: data.overdue ?? 0,
        pending: data.pending ?? data.pendingFollowups ?? 0,
        completed: completedFollowups,
      });
    } catch (err) {
      console.warn('Failed to load CS stats', err);
      setCsStats({ total: 0, active: 0, completed: 0, newCustomers: 0, returningCustomers: 0 });
      setFollowupStats({ overdue: 0, pending: 0, completed: 0 });
    } finally {
      setLoadingCsStats(false);
    }
  }, [currentUser?.token]);

  const fetchFinanceStats = useCallback(async () => {
    setLoadingFinance(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/summary`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const data = res.data || {};
      setFinanceStats({
        revenue: data.revenue || 0,
        expenses: data.expenses || 0,
        profit: data.profit || 0,
        invoices: data.invoices || 0,
        totalCostsRecorded: data.totalCostsRecorded ?? data.expenses ?? 0,
        monthlyRevenue: Array.isArray(data.monthlyRevenue) ? data.monthlyRevenue : [],
        monthlyExpenses: Array.isArray(data.monthlyExpenses) ? data.monthlyExpenses : [],
        weeklyRevenue: Array.isArray(data.weeklyRevenue) ? data.weeklyRevenue : [],
        weeklyExpenses: Array.isArray(data.weeklyExpenses) ? data.weeklyExpenses : [],
      });
    } catch (err) {
      console.warn('Failed to load finance stats', err);
      setFinanceStats({
        revenue: 0,
        expenses: 0,
        profit: 0,
        invoices: 0,
        totalCostsRecorded: 0,
        monthlyRevenue: [],
        monthlyExpenses: [],
        weeklyRevenue: [],
        weeklyExpenses: [],
      });
    } finally {
      setLoadingFinance(false);
    }
  }, [currentUser?.token]);

  const fetchFinanceReports = useCallback(async () => {
    setLoadingFinanceReports(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/reports`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setFinanceReports(rows.slice(0, 5));
    } catch (err) {
      console.warn('Failed to load finance reports', err);
      setFinanceReports([]);
    } finally {
      setLoadingFinanceReports(false);
    }
  }, [currentUser?.token]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() && !broadcastTitle.trim()) {
      toast({ title: 'Add a title or message first', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setSendingBroadcast(true);
    try {
      const targetDepts = departments.filter((d) => d && d.toLowerCase() !== 'all');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/broadcast`, {
        title: broadcastTitle || 'Notice',
        message: broadcastMessage,
        departments: targetDepts,
        audience: 'all'
      }, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      toast({ title: 'Broadcast sent', status: 'success', duration: 3000, isClosable: true });
      setBroadcastTitle('');
      setBroadcastMessage('');
      onCloseBroadcast();
    } catch (err) {
      toast({ title: 'Failed to send', description: err?.message || 'Unknown error', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const salesChartData = useMemo(() => {
    const items = [
      { label: 'Gross Commission', value: salesStats.grossCommission || 0, color: 'orange.400', isCurrency: true },
      { label: 'Net Commission', value: salesStats.totalCommission || 0, color: 'yellow.500', isCurrency: true },
      { label: 'Deals Closed', value: salesStats.completedDeals || 0, color: 'green.500' },
      { label: 'Total Customers', value: salesStats.total || 0, color: 'blue.500' },
    ];
    const maxVal = Math.max(...items.map(i => i.value || 0), 1);
    return items.map((item) => ({
      ...item,
      height: `${Math.max((item.value / maxVal) * 100, 8)}%`,
      display: item.isCurrency ? etbFormatter.format(item.value || 0) : item.value,
    }));
  }, [salesStats, etbFormatter]);

  const salesLiveSummaryColumns = useBreakpointValue({
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
  }) || 1;
  const salesMetricColumns = useBreakpointValue({
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
  }) || 1;
  const salesStatColumns = useBreakpointValue({ base: 1, md: 2, lg: 4 }) || 1;

  const toggleExcluded = (dept) => {
    if (dept === 'All') return;
    setExcludedDepartments(prev => {
      if (prev.includes(dept)) return prev.filter(x => x !== dept);
      return [...prev, dept];
    });
    // if the currently selected dept was excluded, move selection to All
    if (dept === selectedDept) setSelectedDept('All');
  };

  const handlePointerDown = (e) => {
    const el = tabListRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    scrollLeftRef.current = el.scrollLeft;
    el.classList.add('dragging');
  };

  const handlePointerMove = (e) => {
    const el = tabListRef.current;
    if (!el || !isDraggingRef.current) return;
    const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const walk = startXRef.current - x;
    el.scrollLeft = scrollLeftRef.current + walk;
  };

  const handlePointerUp = () => {
    const el = tabListRef.current;
    isDraggingRef.current = false;
    if (el) el.classList.remove('dragging');
  };

  const fetchRevenueAndFollowups = useCallback(async () => {
    if (!import.meta.env.VITE_API_URL) return;
    setLoadingRevenueOps(true);
    try {
      // Revenue breakdown
      const revRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`);
      const rows = Array.isArray(revRes.data) ? revRes.data : Array.isArray(revRes.data?.data) ? revRes.data.data : [];
      setRevenueActuals(rows);
      const mapped = rows.slice(0, 4).map((row) => ({
        label: row.metric || row.name || 'Metric',
        value: row.actual != null ? currencyFormatter.format(row.actual) : '-',
        change:
          row.target != null && row.actual != null
            ? `${(((row.actual - row.target) / (row.target || 1)) * 100).toFixed(1)}%`
            : row.change || '+0%',
        target: row.target != null ? currencyFormatter.format(row.target) : undefined,
      }));
      setRevenueBreakdown(mapped.length ? mapped : [
        { label: 'New Deals', value: '$4.2M', change: '+6.2%', target: '$3.9M' },
        { label: 'Renewals', value: '$3.1M', change: '+3.4%', target: '$3.0M' },
        { label: 'Expansion', value: '$1.6M', change: '+2.1%', target: '$1.5M' },
        { label: 'Churn Risk', value: '$0.4M', change: '-1.2%', target: '$0.3M' },
      ]);
    } catch (err) {
      console.warn('Failed to load revenue breakdown', err);
      setRevenueActuals([]);
      setRevenueBreakdown([
        { label: 'New Deals', value: '$4.2M', change: '+6.2%', target: '$3.9M' },
        { label: 'Renewals', value: '$3.1M', change: '+3.4%', target: '$3.0M' },
        { label: 'Expansion', value: '$1.6M', change: '+2.1%', target: '$1.5M' },
        { label: 'Churn Risk', value: '$0.4M', change: '-1.2%', target: '$0.3M' },
      ]);
    }

    try {
      // Customer follow-up summary
      const fuRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup/report`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
      });
      const data = Array.isArray(fuRes.data?.data) ? fuRes.data.data : Array.isArray(fuRes.data) ? fuRes.data : [];
      const total = data.length;
      const active = data.filter((r) => r.lastCalled).length;
      const agents = new Set(data.map((r) => r.agentName || r.creator?.username || r.assignedTo).filter(Boolean)).size;
      const packages = new Set(data.map((r) => r.packageType || r.package || r.packageNumber).filter(Boolean)).size;
      setFollowupSummary({ total, active, agents, packages });
    } catch (err) {
      console.warn('Failed to load follow-up summary', err);
      setFollowupSummary({ total: 0, active: 0, agents: 0, packages: 0 });
    } finally {
      setLoadingRevenueOps(false);
    }
  }, [currencyFormatter, currentUser?.token]);

  useEffect(() => {
    fetchSalesStats(timeRange);
    fetchCsStats();
    fetchFinanceStats();
  }, [fetchSalesStats, fetchCsStats, fetchFinanceStats, timeRange]);

    useEffect(() => {
      if (isReportsOpen) {
        fetchFinanceReports();
        fetchSalesStats(timeRange);
      }
    }, [fetchFinanceReports, fetchSalesStats, isReportsOpen, timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRevenueAndFollowups();
      fetchCsStats();
      fetchFinanceStats();
      fetchSalesStats(timeRange);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchRevenueAndFollowups, fetchCsStats, fetchFinanceStats, fetchSalesStats, timeRange]);

  useEffect(() => {
    fetchRevenueAndFollowups();
  }, [fetchRevenueAndFollowups]);

  useEffect(() => {
    setDepartments(fixedDepartments);
    setLoadingDepts(false);
  }, []);

  const fetchTradexData = useCallback(async () => {
    try {
      setTradexLoading(true);
      const [revRes, socRes, fuRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/social-actuals`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tradex-followups`),
      ]);

      const summary = [...baseTradexSummary];

      // Revenue
      if (revRes.status === 'fulfilled' && Array.isArray(revRes.value.data)) {
        const entries = revRes.value.data;
        const mtd = entries.find((e) => e.metric === 'MTD revenue');
        if (mtd) {
          summary[1] = {
            label: 'MTD revenue',
            value: currencyFormatter.format(mtd.actual || 0),
            sublabel: mtd.target ? `Target ${currencyFormatter.format(mtd.target)}` : '',
          };
        }
        // Prefer Tradex-tagged revenue rows, otherwise take top 3 entries
        const tradexRows = entries
          .filter((e) => (e.metric || '').toLowerCase().includes('tradex'))
          .map((row) => ({
            metric: row.metric || 'Metric',
            target: Number(row.target) || 0,
            actual: Number(row.actual) || 0,
          }));
        const fallbackRows = entries.slice(0, 3).map((row) => ({
          metric: row.metric || 'Metric',
          target: Number(row.target) || 0,
          actual: Number(row.actual) || 0,
        }));
        const pickedRows = (tradexRows.length ? tradexRows : fallbackRows).slice(0, 3);
        if (pickedRows.length) {
          setTradexRevenueRows(pickedRows);
        }
      }

      // Social
      if (socRes.status === 'fulfilled' && Array.isArray(socRes.value.data)) {
        const entries = socRes.value.data;
        const normalized = entries.map((row) => ({
          platform: row.platform || row.name || 'Platform',
          target: Number(row.target) || 0,
          actual: Number(row.actual) || 0,
        }));
        const fallbackList = socialTargets.length ? socialTargets : fallbackSocialReport;
        const combinedList = normalized.length ? normalized : fallbackList;
        if (combinedList.length) {
          const top = [...combinedList].sort((a, b) => (b.actual || 0) - (a.actual || 0))[0];
          if (top) {
            summary[2] = {
              label: 'Top platform',
              value: top.platform,
              sublabel: `${(top.actual || 0).toLocaleString()} vs ${Number(top.target || 0).toLocaleString()}`,
            };
          }
        }
      } else if (socialTargets.length) {
        const top = [...socialTargets].sort((a, b) => (b.actual || 0) - (a.actual || 0))[0];
        if (top) {
          summary[2] = {
            label: 'Top platform',
            value: top.platform,
            sublabel: `${(top.actual || 0).toLocaleString()} vs ${Number(top.weeklyTarget || 0).toLocaleString()}`,
          };
        }
      }

      // Followups
      if (fuRes.status === 'fulfilled' && Array.isArray(fuRes.value.data)) {
        const followups = fuRes.value.data;
        summary[0] = {
          label: 'Active follow-ups',
          value: String(followups.length),
          sublabel: 'TradexTV',
        };
        const avgServices =
          followups.length === 0
            ? 0
            : followups.reduce((acc, f) => acc + (Array.isArray(f.services) ? f.services.length : 0), 0) /
              followups.length;
        summary[3] = {
          label: 'Avg services/fu',
          value: avgServices.toFixed(1),
          sublabel: 'Across active follow-ups',
        };
        const deliverables = followups.slice(0, 6).map((fu) => ({
          service: Array.isArray(fu.services) && fu.services.length ? fu.services[0] : fu.packageType || 'Service',
          owner: fu.createdBy || fu.owner || 'Unassigned',
          status: fu.status || 'In progress',
          due: fu.deadline ? new Date(fu.deadline).toISOString().split('T')[0] : '',
        }));
        setTradexDeliverables(deliverables);
      }

      setTradexSummaryData(summary);
    } catch (err) {
      console.error('Failed to load Tradex data', err);
    } finally {
      setTradexLoading(false);
    }
  }, [currencyFormatter, socialTargets]);

  // center the active tab in view when selection changes
  useEffect(() => {
    if (!tabListRef.current) return;
    const el = tabListRef.current.querySelector(`[data-dept="${selectedDept}"]`);
    if (el && el.scrollIntoView) {
      try {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) {
        // fallback: adjust scrollLeft manually
        const parent = tabListRef.current;
        const rect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const offset = rect.left - parentRect.left - (parentRect.width / 2) + (rect.width / 2);
        parent.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  }, [selectedDept]);

  useEffect(() => {
    if ((selectedDept || '').toLowerCase() === 'sales') {
      fetchSalesStats();
    }
  }, [selectedDept, fetchSalesStats]);

  useEffect(() => {
    fetchTradexData();
  }, [fetchTradexData]);

  // keep selection valid when filters hide a tab
  useEffect(() => {
    if (!displayedDepartments.includes(selectedDept)) {
      setSelectedDept('All');
    }
  }, [displayedDepartments, selectedDept]);

  const handleWheel = (e) => {
    if (!tabListRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      tabListRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }
  };

  const [tradexSummaryData, setTradexSummaryData] = useState(baseTradexSummary);
  const [tradexDeliverables, setTradexDeliverables] = useState([]);
  const [tradexLoading, setTradexLoading] = useState(false);
  const [tradexRevenueRows, setTradexRevenueRows] = useState(fallbackTradexRevenueRows);
  const fallbackTradexDeliverables = [
    { service: 'Channel relaunch plan', owner: 'Programming', status: 'In progress', due: '2025-12-12' },
    { service: 'New sponsor packages', owner: 'Sales Ops', status: 'Draft', due: '2025-12-15' },
    { service: 'Studio revamp', owner: 'Production', status: 'Design', due: '2025-12-20' },
    { service: 'Q1 content calendar', owner: 'Content', status: 'Review', due: '2025-12-18' },
  ];

  const slaRows = [
    { priority: 'Critical', target: '4h', achieved: '92%', overdue: 6 },
    { priority: 'High', target: '8h', achieved: '89%', overdue: 12 },
    { priority: 'Normal', target: '24h', achieved: '94%', overdue: 18 },
    { priority: 'Low', target: '72h', achieved: '97%', overdue: 4 },
  ];

  const utilization = [
    { name: 'Field Teams', value: 78, status: 'Healthy' },
    { name: 'Support', value: 64, status: 'Watch' },
    { name: 'Sales Ops', value: 82, status: 'Healthy' },
    { name: 'Logistics', value: 55, status: 'Light' },
  ];

  const awards = [
    {
      title: 'Manager of the Month',
      name: 'Dawit Alemu',
      department: 'Sales Ops',
      highlight: 'SLA adherence 96%',
      avatar: 'https://i.pravatar.cc/100?img=47',
    },
    {
      title: 'Employee of the Month',
      name: 'Liya Bekele',
      department: 'Field Teams',
      highlight: '+18% follow-up completion',
      avatar: 'https://i.pravatar.cc/100?img=32',
    },
    {
      title: 'Instructor of the Year',
      name: 'Marta Tesfaye',
      department: 'Training & Enablement',
      highlight: '120+ learners certified, 4.9/5 rating',
      avatar: 'https://i.pravatar.cc/100?img=11',
    },
    {
      title: 'Team Leader of the Month',
      name: 'Yohannes Girma',
      department: 'Logistics',
      highlight: 'Team productivity up 14%',
      avatar: 'https://i.pravatar.cc/100?img=22',
    },
  ];

  // Lightweight customer service snapshot for COO view
  const csSummary = [
    { label: 'Tickets today', value: '124', detail: '+8% vs daily avg', tone: 'blue' },
    { label: 'SLA met', value: '92%', detail: 'First response < 1h', tone: 'green' },
    { label: 'CSAT', value: '4.6 / 5', detail: 'Last 30 days', tone: 'purple' },
    { label: 'Backlog', value: '38', detail: '15 older than 48h', tone: 'orange' },
  ];

  const csQueues = [
    { queue: 'Phone', owner: 'Aman', open: 12, sla: '88%', aging: '5 > 48h' },
    { queue: 'Email', owner: 'Liya', open: 26, sla: '94%', aging: '6 > 48h' },
    { queue: 'Chat', owner: 'Sara', open: 18, sla: '91%', aging: '3 > 48h' },
    { queue: 'Social', owner: 'Mekdes', open: 9, sla: '89%', aging: '1 > 48h' },
  ];

  const financialSnapshot = React.useMemo(
    () => ({
      revenue: financeStats.revenue || 0,
      netProfit: financeStats.profit || 0,
      cashflow: (financeStats.revenue || 0) - (financeStats.expenses || 0) || 0,
      expenses: financeStats.expenses || 0,
      salesGrowth: 12.4,
      receivables: 310000,
    }),
    [financeStats]
  );

  const profitabilityTrend = React.useMemo(() => {
    const merged = buildFinanceTimeline(financeStats.monthlyRevenue, financeStats.monthlyExpenses);
    return merged.length ? merged : fallbackFinanceTimeline;
  }, [financeStats.monthlyRevenue, financeStats.monthlyExpenses]);

  const revenueExpenseSeries = React.useMemo(
    () => profitabilityTrend.map((entry) => ({
      month: entry.month,
      revenue: entry.revenue,
      expense: entry.expenses,
    })),
    [profitabilityTrend]
  );

  const productPerformance = React.useMemo(() => {
    if (!Array.isArray(revenueActuals) || !revenueActuals.length) {
      return fallbackProductPerformance;
    }

    const aggregated = revenueActuals.reduce((acc, row) => {
      const name = (row.metric || row.name || '').toString().trim();
      if (!name) return acc;
      const actual = Number(row.actual) || 0;
      const target = Number(row.target) || 0;
      if (!acc[name]) {
        acc[name] = { name, revenue: 0, target: 0 };
      }
      acc[name].revenue += actual;
      acc[name].target += target;
      return acc;
    }, {});

    const sorted = Object.values(aggregated)
      .filter((entry) => entry.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, fallbackProductPerformance.length);

    if (!sorted.length) {
      return fallbackProductPerformance;
    }

    return sorted.map((entry) => {
      const targetRatio = entry.target
        ? Math.round(((entry.revenue || 0) / Math.max(entry.target, 1)) * 100)
        : 0;
      return {
        name: entry.name,
        revenue: entry.revenue,
        margin: Math.max(0, Math.min(150, targetRatio)),
      };
    });
  }, [revenueActuals]);

  const customerGrowth = React.useMemo(
    () => [
      { month: 'Jan', customers: 240 },
      { month: 'Feb', customers: 265 },
      { month: 'Mar', customers: 295 },
      { month: 'Apr', customers: 330 },
      { month: 'May', customers: 370 },
      { month: 'Jun', customers: 420 },
    ],
    []
  );

  const businessHealth = React.useMemo(() => {
    if (!followupStats.total) {
      return { healthy: 68, watch: 22, risk: 10 };
    }
    const completed = Math.max(followupStats.completed || 0, 0);
    const overdue = Math.max(followupStats.overdue || 0, 0);
    const watchCount = Math.max((followupStats.pending || 0) - overdue, 0);
    const riskCount = overdue;
    const total = Math.max(completed + watchCount + riskCount, 1);
    const toPct = (value) => Math.round((value / total) * 100);
    let healthy = toPct(completed);
    let watch = toPct(watchCount);
    let risk = toPct(riskCount);
    const remainder = 100 - (healthy + watch + risk);
    if (remainder > 0) {
      healthy = Math.min(100, healthy + remainder);
    } else if (remainder < 0) {
      let overage = Math.abs(remainder);
      const clampValue = (value) => {
        const removal = Math.min(value, overage);
        overage -= removal;
        return value - removal;
      };
      watch = clampValue(watch);
      if (overage > 0) {
        risk = clampValue(risk);
      }
      if (overage > 0) {
        healthy = Math.max(0, healthy - overage);
      }
    }
    return { healthy, watch, risk };
  }, [followupStats]);

  const financialCards = React.useMemo(
    () => [
      { label: 'Total Revenue', value: etbFormatter.format(financialSnapshot.revenue), detail: '+8.2% MoM', color: 'green.500' },
      { label: 'Net Profit', value: etbFormatter.format(financialSnapshot.netProfit), detail: '21.9% margin', color: 'blue.500' },
      { label: 'Cashflow', value: etbFormatter.format(financialSnapshot.cashflow), detail: 'Positive +12%', color: 'teal.500' },
      { label: 'Expenses', value: etbFormatter.format(financialSnapshot.expenses), detail: 'Ops +8% vs plan', color: 'red.400' },
      { label: 'Sales Growth', value: `${financialSnapshot.salesGrowth}%`, detail: 'QoQ growth', color: 'purple.500' },
      { label: 'Outstanding Receivables', value: etbFormatter.format(financialSnapshot.receivables), detail: '14d avg aging', color: 'orange.500' },
    ],
    [etbFormatter, financialSnapshot]
  );

  const productBars = React.useMemo(
    () => calcBarHeights(productPerformance, 'revenue', 140),
    [productPerformance]
  );

  const analyticsCardBg = useColorModeValue('white', 'gray.800');
  const analyticsBorder = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');
  const analyticsMuted = useColorModeValue('gray.600', 'gray.300');
  const donutTrack = useColorModeValue('#e5e7eb', '#1f2937');
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const pieSegments = React.useMemo(
    () => buildPieSegments(productPerformance, 'revenue', 42),
    [productPerformance]
  );
  const pieColors = ['#6366F1', '#0EA5E9', '#22C55E', '#F97316', '#A855F7', '#14B8A6'];
  const profitLinePoints = React.useMemo(
    () => buildPolyline(profitabilityTrend, 'profit', 320, 140),
    [profitabilityTrend]
  );
  const revenueLinePoints = React.useMemo(
    () => buildPolyline(revenueExpenseSeries, 'revenue', 320, 140),
    [revenueExpenseSeries]
  );
  const expenseLinePoints = React.useMemo(
    () => buildPolyline(revenueExpenseSeries, 'expense', 320, 140),
    [revenueExpenseSeries]
  );
  const customerLinePoints = React.useMemo(
    () => buildPolyline(customerGrowth, 'customers', 320, 140),
    [customerGrowth]
  );
  const profitSummary = React.useMemo(() => {
    const netProfitValue = Math.max(financeStats.profit || 0, 0);
    const grossRevenueValue = Math.max(financeStats.revenue || 0, 0);
    const lastProfitEntry = profitabilityTrend[profitabilityTrend.length - 1] || null;
    const prevProfitEntry = profitabilityTrend[profitabilityTrend.length - 2] || lastProfitEntry;
    const profitDelta = (lastProfitEntry?.profit || 0) - (prevProfitEntry?.profit || 0);
    const profitMargin = Math.round(
      ((lastProfitEntry?.profit || 0) / Math.max(financeStats.revenue || 1, 1)) * 100
    );
    const profitTrendLabel =
      profitDelta === 0
        ? 'Steady vs prior period'
        : `${profitDelta > 0 ? 'Up' : 'Down'} ${currencyFormatter.format(
            Math.abs(profitDelta)
          )} vs prior period.`;
    const recentProfitPoints = profitabilityTrend.slice(-3);
    return {
      netProfitValue,
      grossRevenueValue,
      profitMargin,
      profitTrendLabel,
      recentProfitPoints,
    };
  }, [financeStats, profitabilityTrend, currencyFormatter]);
  const {
    netProfitValue,
    grossRevenueValue,
    profitMargin,
    profitTrendLabel,
    recentProfitPoints,
  } = profitSummary;
  const profitHighlights = React.useMemo(
    () => [
      {
        label: 'Net profit',
        value: etbFormatter.format(netProfitValue),
        detail: 'Combined across every department',
      },
      {
        label: 'Profit margin',
        value: `${profitMargin}%`,
        detail: 'Latest recorded period',
      },
      {
        label: 'Gross revenue',
        value: etbFormatter.format(grossRevenueValue),
        detail: 'Total top-line tracked revenue',
      },
    ],
    [etbFormatter, grossRevenueValue, netProfitValue, profitMargin]
  );
  const profitCoords = React.useMemo(() => profitLinePoints.split(' '), [profitLinePoints]);
  const customerCoords = React.useMemo(() => customerLinePoints.split(' '), [customerLinePoints]);

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  const scrollToSection = useCallback((sectionId, ref) => {
    setCurrentMobileTab(sectionId);
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleControlStackSelect = useCallback((sectionId) => {
    setActiveSidebarSection(sectionId);
    const targetRef = controlStackTargetMap[sectionId];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [controlStackTargetMap]);

  return (
    <Box bg={appBg} minH="100vh" py={{ base: 4, md: 6 }} px={{ base: 3, md: 5 }}>
      <Flex maxW="1900px" mx="auto" gap={{ base: 0, lg: 6 }} align="flex-start">
        <Box
          display={{ base: 'none', lg: 'block' }}
          w="240px"
          position="sticky"
          top={0}
          h="100vh"
          borderRight="1px solid"
          borderColor={shellBorder}
          bg={sidebarSurface}
          boxShadow="0 10px 30px rgba(15, 23, 42, 0.06)"
        >
          <Flex direction="column" h="full">
          <VStack align="stretch" spacing={0} flex="1" overflowY="auto">
            <Box p={5} borderBottom="1px solid" borderColor={shellBorder}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.18em" color={shellMuted} fontWeight="700">
                TRADE ETHIOPIA
              </Text>
              <Heading fontSize="18px" mt={2} color="#0F172A">
                COO Command Center
              </Heading>
              <Text fontSize="13px" color={shellMuted} mt={2} lineHeight="1.5">
                Executive view across finance, operations, and delivery.
              </Text>
              <HStack spacing={2} mt={4}>
                <Tag size="sm" bg="#EFF6FF" color="#2563EB" borderRadius="999px" fontWeight="600">
                  {timeRangeLabels[timeRange]}
                </Tag>
                <Tag size="sm" bg="#ECFDF5" color="#059669" borderRadius="999px" fontWeight="600">
                  {activeDeptCount} teams
                </Tag>
              </HStack>
              <Menu placement="bottom-end" isLazy>
                <MenuButton
                  as={Button}
                  mt={4}
                  w="full"
                  variant="unstyled"
                  color={controlTextColor}
                  px={3}
                  py={3}
                  h="auto"
                  borderRadius="16px"
                  bg="#F8FAFC"
                  border="1px solid"
                  borderColor={shellBorder}
                  _hover={{ bg: sidebarSectionHover }}
                  _active={{ bg: sidebarSectionHover }}
                >
                  <HStack spacing={3} align="center" w="100%">
                    <Avatar
                      name="C"
                      size="sm"
                      bg="#2563EB"
                      color="white"
                    />
                    <Box textAlign="left" flex="1" minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {currentUser?.username || 'Command User'}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={shellMuted}
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                        noOfLines={1}
                      >
                        COO
                      </Text>
                    </Box>
                    <ChevronDownIcon boxSize={4} color={shellMuted} />
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem isDisabled>COO: {currentUser?.username || 'Not set'}</MenuItem>
                  <MenuItem isDisabled>{currentUser?.role || 'Role not set'}</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={onOpenBroadcast}>Broadcast notice</MenuItem>
                  <MenuDivider />
                  <MenuItem color="red.500" onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </Box>

            <Box p={4} borderBottom="1px solid" borderColor={shellBorder}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.14em" color={shellMuted} mb={3} fontWeight="700">
                Navigation
              </Text>
              <VStack align="stretch" spacing={2}>
                {desktopNavItems.map((item) => {
                  const isActive = currentMobileTab === item.id;
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      leftIcon={<Icon />}
                      justifyContent="flex-start"
                      size="md"
                      h="40px"
                      borderRadius="12px"
                      variant="ghost"
                      bg={isActive ? '#2563EB' : 'transparent'}
                      color={isActive ? 'white' : '#0F172A'}
                      _hover={{ bg: isActive ? '#2563EB' : sidebarSectionHover }}
                      onClick={() => scrollToSection(item.id, item.ref)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </VStack>
            </Box>

            <Box p={4} borderBottom="1px solid" borderColor={shellBorder}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.14em" color={shellMuted} mb={3} fontWeight="700">
                Control Stack
              </Text>
              <VStack align="stretch" spacing={2}>
                {sidebarSections.map((section) => {
                  const isActive = activeSidebarSection === section.id;
                  return (
                    <Button
                      key={`desktop-section-${section.id}`}
                      justifyContent="flex-start"
                      variant="ghost"
                      h="36px"
                      px={3}
                      borderRadius="10px"
                      fontSize="13px"
                      fontWeight="600"
                      bg={isActive ? sidebarSectionActiveBg : 'transparent'}
                      color={isActive ? '#6D28D9' : controlTextColor}
                      _hover={{ bg: isActive ? sidebarSectionActiveBg : sidebarSectionHover }}
                      onClick={() => handleControlStackSelect(section.id)}
                    >
                      {section.title}
                    </Button>
                  );
                })}
              </VStack>
              <Box mt={4} borderRadius="16px" bg={sidebarSectionBg} p={4} border="1px solid" borderColor={shellBorder}>
                {renderSidebarSectionContent()}
              </Box>
            </Box>

            <Box p={4}>
              <SimpleGrid columns={2} spacing={3}>
                <Box borderRadius="16px" bg={sidebarSectionBg} p={3} border="1px solid" borderColor={shellBorder}>
                  <Text fontSize="xs" color={shellMuted}>Action items</Text>
                  <Heading size="md" mt={1}>{actionItemCount.all}</Heading>
                </Box>
                <Box borderRadius="16px" bg={sidebarSectionBg} p={3} border="1px solid" borderColor={shellBorder}>
                  <Text fontSize="xs" color={shellMuted}>Period</Text>
                  <Heading size="sm" mt={1}>{currentMonthName}</Heading>
                </Box>
              </SimpleGrid>
              <Button mt={4} w="full" borderRadius="xl" colorScheme="blue" variant="outline" onClick={onOpenDeptDrawer}>
                Open department list
              </Button>
              <Box mt={4} borderRadius="16px" bg={sidebarSectionBg} p={3} border="1px solid" borderColor={shellBorder}>
                <HStack spacing={3} align="center">
                  <Avatar name="C" size="sm" bg="#2563EB" color="white" />
                  <Box flex="1" minW={0}>
                    <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                      {currentUser?.username || 'Command User'}
                    </Text>
                    <Text fontSize="xs" color={shellMuted} textTransform="uppercase" letterSpacing="0.08em" noOfLines={1}>
                      COO
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Box>
          </VStack>
          <Box p={4} borderTop="1px solid" borderColor={shellBorder} bg="#FFFFFF">
            <Button w="full" colorScheme="red" borderRadius="12px" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
          </Flex>
        </Box>

        <Box flex="1" minW={0}>
      {/* Hero Section - Full Width */}
      <MotionBox
        ref={overviewRef}
        bgGradient={heroGradient}
        color="white"
        p={{ base: 6, md: 7 }}
        minH={{ base: 'auto', md: '160px' }}
        boxShadow="0 10px 30px rgba(15, 23, 42, 0.16)"
        mb={{ base: 4, md: 5 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        borderRadius="24px"
        overflow="hidden"
      >
        <Container maxW="8xl" mx="auto" px={{ base: 1, md: 2 }}>
          <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'flex-start', lg: 'flex-start' }} gap={6}>
            <Flex align="flex-start" gap={3} flex="1">
              <IconButton
                aria-label="Open reports sidebar"
                icon={<HamburgerIcon />}
                onClick={onOpenSidePanel}
                display={{ base: 'inline-flex', lg: 'none' }}
                size="sm"
                variant="solid"
                bg="whiteAlpha.200"
                color="white"
                _hover={{ bg: 'whiteAlpha.300' }}
                boxShadow="0 8px 20px rgba(15,23,42,0.22)"
              />
              <Box>
                <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.24em" color="whiteAlpha.800" mb={2} fontWeight="700">
                  EXECUTIVE WORKSPACE
                </Text>
                <Heading fontSize={{ base: '24px', md: '28px' }} lineHeight="1.1" color="white" mb={2}>
                  Chief Operations Dashboard
                </Heading>
                <Text fontSize="14px" color="whiteAlpha.900" fontWeight="500" mb={2}>
                  Decision-ready view across finance, operations, and delivery.
                </Text>
                <Text fontSize="13px" color="whiteAlpha.800" maxW="700px" lineHeight="1.6">
                  Monitor cross-functional performance, track key metrics, and manage departmental operations from a centralized view.
                </Text>
              </Box>
            </Flex>
            
            <VStack align={{ base: 'stretch', lg: 'flex-end' }} spacing={4} minW={{ base: '100%', lg: '360px' }}>
              <Flex align="center" gap={2} flexWrap="wrap" justify={{ base: 'flex-start', lg: 'flex-end' }}>
                <Tag bg="whiteAlpha.180" color="white" size="sm" borderRadius="999px" px={3}>
                  {timeRangeLabels[timeRange] || 'Custom window'}
                </Tag>
                <Tag bg="whiteAlpha.180" color="white" size="sm" borderRadius="999px" px={3}>
                  {activeDeptCount} Departments Active
                </Tag>
                <IconButton
                  aria-label="Toggle theme"
                  icon={<FiMoon />}
                  onClick={toggleColorMode}
                  size="sm"
                  borderRadius="12px"
                  bg="whiteAlpha.180"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
                <IconButton
                  aria-label="Open reports"
                  icon={<FiFileText />}
                  onClick={onOpenReports}
                  size="sm"
                  borderRadius="12px"
                  bg="whiteAlpha.180"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </Flex>
              <SimpleGrid columns={2} spacing={3} w={{ base: '100%', lg: '360px' }}>
                {executiveSummaryItems.map((item) => (
                  <Box key={item.label} bg="whiteAlpha.140" border="1px solid" borderColor="whiteAlpha.200" borderRadius="16px" px={4} py={3}>
                    <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.16em" color="whiteAlpha.700" fontWeight="700">
                      {item.label}
                    </Text>
                    <Text mt={2} fontSize="18px" fontWeight="700" color="white">
                      {item.value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Flex>
        </Container>
      </MotionBox>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6} mb={6}>
        {executiveKpiCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <Box
              key={card.id}
              bg={cardBg}
              border="1px solid"
              borderColor={shellBorder}
              borderTopWidth="3px"
              borderTopColor={card.accent}
              borderRadius="16px"
              px={5}
              py={4}
              minH="118px"
              boxShadow="0 10px 30px rgba(15, 23, 42, 0.06)"
            >
              <Flex justify="space-between" align="flex-start" mb={4}>
                <Box>
                  <Text fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.12em" color="#475569">
                    {card.label}
                  </Text>
                  <Text mt={2} fontSize={{ base: '24px', xl: '28px' }} fontWeight="800" color="#0F172A">
                    {card.value}
                  </Text>
                </Box>
                <Center boxSize="40px" borderRadius="12px" bg={card.surface} color={card.accent}>
                  <CardIcon size={18} />
                </Center>
              </Flex>
              <Flex justify="space-between" align="flex-end" gap={4}>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={card.accent}>
                    {card.trend}
                  </Text>
                  <Text fontSize="12px" color="#64748B" mt={1}>
                    {card.footer}
                  </Text>
                </Box>
                <Box w="96px" h="28px">
                  <svg width="100%" height="100%" viewBox="0 0 200 30">
                    <polyline
                      fill="none"
                      stroke={card.accent}
                      strokeWidth="2.4"
                      points={buildPolyline(card.sparkline, card.sparkKey, 200, 30)}
                    />
                  </svg>
                </Box>
              </Flex>
            </Box>
          );
        })}
      </SimpleGrid>

      <Box
        ref={alertsRef}
        bg={cardBg}
        border="1px solid"
        borderColor={shellBorder}
        borderRadius="18px"
        boxShadow="0 10px 30px rgba(15, 23, 42, 0.06)"
        mb={6}
        px={{ base: 4, md: 5 }}
        py={4}
      >
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} mb={4} wrap="wrap">
          <Box>
            <Heading fontSize="20px" color="#0F172A">
              Executive Action Queue
            </Heading>
            <Text fontSize="13px" color="#64748B" mt={1}>
              Structured executive queue across finance, operations, and delivery.
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            {[
              { key: 'all', label: 'All', count: actionQueueCounts.all, bg: '#DBEAFE', color: '#2563EB' },
              { key: 'critical', label: 'Critical', count: actionQueueCounts.critical, bg: '#FEF2F2', color: '#DC2626' },
              { key: 'high', label: 'High', count: actionQueueCounts.high, bg: '#FFF7ED', color: '#EA580C' },
              { key: 'medium', label: 'Medium', count: actionQueueCounts.medium, bg: '#FEF3C7', color: '#B45309' },
              { key: 'low', label: 'Low', count: actionQueueCounts.low, bg: '#ECFDF5', color: '#059669' },
            ].map((chip) => (
              <Button
                key={chip.key}
                size="xs"
                h="30px"
                px={3}
                borderRadius="999px"
                border="1px solid"
                borderColor={actionItemsFilter === chip.key ? 'transparent' : shellBorder}
                bg={actionItemsFilter === chip.key ? chip.bg : '#FFFFFF'}
                color={actionItemsFilter === chip.key ? chip.color : '#475569'}
                fontSize="12px"
                fontWeight="700"
                onClick={() => setActionItemsFilter(chip.key)}
              >
                {chip.label} ({chip.count})
              </Button>
            ))}
            <Button size="sm" variant="ghost" rightIcon={<ChevronDownIcon />} color="#475569">
              View all
            </Button>
          </HStack>
        </Flex>

        {actionItemsLoading ? (
          <Center py={6}>
            <Spinner size="sm" />
          </Center>
        ) : (
          <Box overflowX="auto">
            <Box minW="980px">
              <Grid templateColumns="120px 2.1fr 1.2fr 90px 140px 120px 56px" px={4} py={3} bg="#F8FAFC" borderRadius="14px" border="1px solid" borderColor={shellBorder} mb={2} alignItems="center">
                {['Priority', 'Request', 'Department', 'Owner', 'Due Date', 'Status', 'Actions'].map((heading) => (
                  <Text key={heading} fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="0.12em" color="#64748B">
                    {heading}
                  </Text>
                ))}
              </Grid>

              <VStack align="stretch" spacing={0}>
                {queueFilteredItems.length > 0 ? (
                  queueFilteredItems.map((item) => {
                    const priorityStyles = {
                      critical: { bg: '#FEF2F2', color: '#DC2626', label: 'CRITICAL' },
                      high: { bg: '#FFF7ED', color: '#EA580C', label: 'HIGH' },
                      medium: { bg: '#FEF3C7', color: '#B45309', label: 'MEDIUM' },
                      low: { bg: '#ECFDF5', color: '#059669', label: 'LOW' },
                    };
                    const statusStyles = {
                      completed: { bg: '#ECFDF5', color: '#059669', label: 'Completed' },
                      'in-progress': { bg: '#EFF6FF', color: '#2563EB', label: 'In Progress' },
                      open: { bg: '#FEF2F2', color: '#DC2626', label: 'Open' },
                      review: { bg: '#FEF3C7', color: '#B45309', label: 'Review' },
                      pending: { bg: '#F8FAFC', color: '#64748B', label: 'Pending' },
                    };
                    const priorityStyle = priorityStyles[item.priority] || priorityStyles.medium;
                    const statusStyle = statusStyles[item.status] || statusStyles.pending;
                    return (
                      <Grid
                        key={item.id}
                        templateColumns="120px 2.1fr 1.2fr 90px 140px 120px 56px"
                        alignItems="center"
                        minH="60px"
                        px={4}
                        py={3}
                        borderBottom="1px solid"
                        borderColor={shellBorder}
                        _hover={{ bg: '#F8FAFC' }}
                      >
                        <Badge justifySelf="start" px={2.5} py={1.5} borderRadius="999px" bg={priorityStyle.bg} color={priorityStyle.color} fontSize="11px" fontWeight="700">
                          {priorityStyle.label}
                        </Badge>
                        <Text fontSize="13px" fontWeight="700" color="#0F172A">
                          {item.title}
                        </Text>
                        <Text fontSize="13px" color="#64748B">
                          {item.department}
                        </Text>
                        <Text fontSize="13px" fontWeight="600" color="#0F172A">
                          {item.owner}
                        </Text>
                        <Text fontSize="13px" color="#64748B">
                          {item.dueDateLabel}
                        </Text>
                        <Badge justifySelf="start" px={2.5} py={1.5} borderRadius="999px" bg={statusStyle.bg} color={statusStyle.color} fontSize="11px" fontWeight="700">
                          {statusStyle.label}
                        </Badge>
                        <IconButton
                          aria-label="Open action details"
                          icon={<FiMoreHorizontal />}
                          variant="ghost"
                          size="sm"
                          color="#64748B"
                          onClick={() => openActionDetail(item)}
                        />
                      </Grid>
                    );
                  })
                ) : (
                  <Center py={10}>
                    <Text fontSize="13px" color="#64748B">
                      No action items found for the selected filter.
                    </Text>
                  </Center>
                )}
              </VStack>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        bg={cardBg}
        borderRadius="22px"
        border="1px solid"
        borderColor={shellBorder}
        boxShadow="0 10px 30px rgba(15, 23, 42, 0.06)"
        mb={6}
        px={{ base: 4, md: 6 }}
        py={5}
      >
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} mb={5} wrap="wrap">
          <Box>
            <Heading fontSize="20px" color="#0F172A">
              Performance Storyline
            </Heading>
            <Text fontSize="13px" color="#64748B" mt={1}>
              Revenue trend and operational performance over time
            </Text>
          </Box>
          <HStack spacing={3}>
            <Select size="sm" w="120px" borderRadius="12px" borderColor={shellBorder} bg="#FFFFFF" defaultValue="Revenue">
              <option>Revenue</option>
            </Select>
            <Select size="sm" w="120px" borderRadius="12px" borderColor={shellBorder} bg="#FFFFFF" defaultValue="Monthly">
              <option>Monthly</option>
            </Select>
          </HStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 300px' }} gap={5}>
          <Box border="1px solid" borderColor={shellBorder} borderRadius="18px" p={4} bg="#FFFFFF">
            <HStack spacing={4} mb={4}>
              <HStack spacing={2}>
                <Box w="10px" h="10px" borderRadius="full" bg="#2563EB" />
                <Text fontSize="12px" color="#475569">Current Period</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="10px" h="10px" borderRadius="full" bg="#94A3B8" />
                <Text fontSize="12px" color="#475569">Previous Period</Text>
              </HStack>
            </HStack>

            <Box h={{ base: '280px', md: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceStorylineData} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(value) => `ETB ${(value / 1000000).toFixed(1)}M`} />
                  <RechartsTooltip
                    formatter={(value) => [etbFormatter.format(value), '']}
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="current" name="Current Period" stroke="#2563EB" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="previous" name="Previous Period" stroke="#94A3B8" strokeWidth={2.5} strokeDasharray="6 6" dot={{ r: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box border="1px solid" borderColor={shellBorder} borderRadius="18px" p={4} bg="#F8FAFC">
            <Flex align="center" justify="space-between" mb={4}>
              <Heading fontSize="16px" color="#0F172A">
                Performance Summary
              </Heading>
              <Center boxSize="32px" borderRadius="10px" bg="#EFF6FF" color="#2563EB">
                <FiShield size={16} />
              </Center>
            </Flex>
            <VStack align="stretch" spacing={3}>
              {performanceSummaryItems.map((item) => (
                <Box key={item.label} borderRadius="14px" border="1px solid" borderColor={shellBorder} bg="#FFFFFF" px={3} py={3}>
                  <Text fontSize="11px" textTransform="uppercase" letterSpacing="0.12em" fontWeight="700" color="#64748B">
                    {item.label}
                  </Text>
                  <Text mt={1.5} fontSize="16px" fontWeight="700" color="#0F172A">
                    {item.value}
                  </Text>
                </Box>
              ))}
            </VStack>
            <Button mt={4} variant="link" color="#2563EB" fontSize="13px" justifyContent="flex-start" rightIcon={<ExternalLinkIcon />}>
              View full performance analysis
            </Button>
          </Box>
        </Grid>
      </Box>

      {/* Legacy KPI Summary Bar */}
      <Box 
        display="none"
        position="sticky" 
        top="0" 
        zIndex="100" 
        bg={shellBg}
        backdropFilter="blur(18px)"
        border="1px solid"
        borderColor={shellBorder}
        boxShadow="0 16px 40px rgba(15,23,42,0.08)" 
        borderRadius="24px"
        py={2}
        px={4}
        mb={6}
      >
        {/* 
          Responsive Grid Layout:
          - Mobile (base): 1 column - Stacked vertically
          - Small tablets (sm): 2 columns - Two rows of two cards
          - Desktop (md): 4 columns - All cards in one row
          Spacing ensures consistent gutters between cards
        */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 4 }} 
          spacing={{ base: 4, sm: 5, md: 6 }}
          templateColumns={{
            base: '1fr',           // Mobile: Full width cards
            sm: 'repeat(2, 1fr)',   // Tablet: Two equal columns
            md: 'repeat(4, 1fr)'    // Desktop: Four equal columns
          }}
        >
          {/* Revenue KPI Card */}
          <Box 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="blue.200"
            overflow="hidden"
            boxShadow="sm"
          >
            <Box 
              p={3}
              bg="blue.50"
              cursor="pointer"
              onClick={() => toggleKpiExpansion('revenue')}
              _hover={{ bg: 'blue.100' }}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="blue.700" fontWeight="semibold">REVENUE</Text>
                <Text fontSize="xs" color="blue.600">
                  {revenueSummary.change || '—'}
                </Text>
              </Flex>
              <Heading size="sm" color="blue.900" my={1}>
                {etbFormatter.format(financeStats.revenue || 0)}
              </Heading>
              {/* Sparkline */}
              <Box h="30px" mt={2}>
                <svg width="100%" height="100%" viewBox="0 0 200 30">
                  <polyline 
                    fill="none" 
                    stroke="#3182CE" 
                    strokeWidth="2" 
                    points={buildPolyline(revenueTrendData, 'value', 200, 30)} 
                  />
                </svg>
              </Box>
            </Box>
            
            {/* Expanded Content */}
            {expandedKpi === 'revenue' && (
              <Box p={3} bg="white" borderTop="1px solid" borderColor="blue.200">
                <Text fontSize="sm" mb={2}>Revenue breakdown by department:</Text>
                <VStack align="stretch" spacing={2} maxH="150px" overflowY="auto">
                  {departments
                    .filter(d => d !== 'All' && !excludedDepartments.includes(d))
                    .slice(0, 3)
                    .map((dept, idx) => (
                      <Flex key={dept} justify="space-between" fontSize="sm">
                        <Text>{dept}</Text>
                        <Text>{etbFormatter.format((financeStats.revenue || 0) * (0.3 - 0.05 * idx))}</Text>
                      </Flex>
                    ))
                  }
                </VStack>
              </Box>
            )}
          </Box>

          {/* Cash Flow KPI Card */}
          <Box 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="green.200"
            overflow="hidden"
            boxShadow="sm"
          >
            <Box 
              p={3}
              bg="green.50"
              cursor="pointer"
              onClick={() => toggleKpiExpansion('cashflow')}
              _hover={{ bg: 'green.100' }}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="green.700" fontWeight="semibold">CASH FLOW</Text>
                <Text fontSize="xs" color="green.600">
                  Net
                </Text>
              </Flex>
              <Heading size="sm" color="green.900" my={1}>
                {etbFormatter.format((financeStats.revenue || 0) - (financeStats.expenses || 0))}
              </Heading>
              {/* Sparkline */}
              <Box h="30px" mt={2}>
                <svg width="100%" height="100%" viewBox="0 0 200 30">
                  <polyline 
                    fill="none" 
                    stroke="#38A169" 
                    strokeWidth="2" 
                    points={buildPolyline(cashFlowTrendData, 'value', 200, 30)} 
                  />
                </svg>
              </Box>
            </Box>
            
            {/* Expanded Content */}
            {expandedKpi === 'cashflow' && (
              <Box p={3} bg="white" borderTop="1px solid" borderColor="green.200">
                <Text fontSize="sm" mb={2}>Cash flow components:</Text>
                <VStack align="stretch" spacing={1}>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>Revenue</Text>
                    <Text color="blue.500">{etbFormatter.format(financeStats.revenue || 0)}</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>Expenses</Text>
                    <Text color="red.500">{etbFormatter.format(financeStats.expenses || 0)}</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm" fontWeight="semibold">
                    <Text>Net</Text>
                    <Text>{etbFormatter.format((financeStats.revenue || 0) - (financeStats.expenses || 0))}</Text>
                  </Flex>
                </VStack>
              </Box>
            )}
          </Box>

          {/* Operational Uptime KPI Card */}
          <Box 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="purple.200"
            overflow="hidden"
            boxShadow="sm"
          >
            <Box 
              p={3}
              bg="purple.50"
              cursor="pointer"
              onClick={() => toggleKpiExpansion('uptime')}
              _hover={{ bg: 'purple.100' }}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="purple.700" fontWeight="semibold">UPTIME</Text>
                <Text fontSize="xs" color="purple.600">
                  Last 30 days
                </Text>
              </Flex>
              <Heading size="sm" color="purple.900" my={1}>
                98.7%
              </Heading>
              {/* Sparkline */}
              <Box h="30px" mt={2}>
                <svg width="100%" height="100%" viewBox="0 0 200 30">
                  <polyline 
                    fill="none" 
                    stroke="#805AD5" 
                    strokeWidth="2" 
                    points={buildPolyline(uptimeTrendData, 'value', 200, 30)} 
                  />
                </svg>
              </Box>
            </Box>
            
            {/* Expanded Content */}
            {expandedKpi === 'uptime' && (
              <Box p={3} bg="white" borderTop="1px solid" borderColor="purple.200">
                <Text fontSize="sm" mb={2}>Recent uptime metrics:</Text>
                <VStack align="stretch" spacing={1}>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>Avg Response Time</Text>
                    <Text>245ms</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>SLA Compliance</Text>
                    <Text color="green.500">99.2%</Text>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>Downtime Events</Text>
                    <Text>2</Text>
                  </Flex>
                </VStack>
              </Box>
            )}
          </Box>

          {/* Risk Flags KPI Card */}
          <Box 
            borderRadius="lg" 
            border="1px solid" 
            borderColor="orange.200"
            overflow="hidden"
            boxShadow="sm"
          >
            <Box 
              p={3}
              bg="orange.50"
              cursor="pointer"
              onClick={() => toggleKpiExpansion('risk')}
              _hover={{ bg: 'orange.100' }}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="orange.700" fontWeight="semibold">RISK FLAGS</Text>
                <Text fontSize="xs" color="orange.600">
                  Across departments
                </Text>
              </Flex>
              <Heading size="sm" color="orange.900" my={1}>
                {departmentReports.reduce((acc, dept) => acc + (dept.risks || 0), 0)}
              </Heading>
              {/* Sparkline */}
              <Box h="30px" mt={2}>
                <svg width="100%" height="100%" viewBox="0 0 200 30">
                  <polyline 
                    fill="none" 
                    stroke="#DD6B20" 
                    strokeWidth="2" 
                    points={buildPolyline(riskTrendData, 'value', 200, 30)} 
                  />
                </svg>
              </Box>
            </Box>
            
            {/* Expanded Content */}
            {expandedKpi === 'risk' && (
              <Box p={3} bg="white" borderTop="1px solid" borderColor="orange.200">
                <Text fontSize="sm" mb={2}>Risk distribution:</Text>
                <VStack align="stretch" spacing={2} maxH="150px" overflowY="auto">
                  {departmentReports
                    .sort((a, b) => (b.risks || 0) - (a.risks || 0))
                    .slice(0, 3)
                    .map((dept) => (
                      <Flex key={dept.department} justify="space-between" fontSize="sm">
                        <Text>{dept.department}</Text>
                        <Tag size="sm" colorScheme={dept.color}>{dept.risks} risks</Tag>
                      </Flex>
                    ))
                  }
                </VStack>
              </Box>
            )}
          </Box>
        </SimpleGrid>
      </Box>

      {/* Actionable Alerts Strip */}
      <Box 
        display="none"
        bg={useColorModeValue('gray.50', 'gray.700')}
        borderRadius="lg"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        mb={6}
        px={4}
        py={2}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Flex align="center" gap={2}>
            <Text fontWeight="semibold" fontSize="sm">Action Items</Text>
            <Badge colorScheme="red" fontSize="xs">{actionItemCount.critical} Critical</Badge>
            <Badge colorScheme="orange" fontSize="xs">{actionItemCount.high} High</Badge>
            <Badge colorScheme="yellow" fontSize="xs">{actionItemCount.medium} Medium</Badge>
            <Badge colorScheme="green" fontSize="xs">{actionItemCount.low} Low</Badge>
          </Flex>
          <IconButton 
            aria-label={isActionItemsOpen ? "Collapse action items" : "Expand action items"}
            icon={isActionItemsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="sm"
            variant="ghost"
            onClick={() => setIsActionItemsOpen(!isActionItemsOpen)}
          />
        </Flex>
        
        {isActionItemsOpen && (
          <Box>
            {actionItemsLoading && (
              <Center py={4}>
                <Spinner size="sm" />
              </Center>
            )}
            {actionItemsError && (
              <Text fontSize="sm" color="red.500" mb={2}>
                {actionItemsError}
              </Text>
            )}
            <Flex gap={2} mb={3} wrap="wrap">
              <Button 
                size="xs" 
                variant={actionItemsFilter === 'all' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setActionItemsFilter('all')}
              >
                All ({actionItemCount.all})
              </Button>
              <Button 
                size="xs" 
                variant={actionItemsFilter === 'critical' ? 'solid' : 'outline'}
                colorScheme="red"
                onClick={() => setActionItemsFilter('critical')}
              >
                Critical ({actionItemCount.critical})
              </Button>
              <Button 
                size="xs" 
                variant={actionItemsFilter === 'high' ? 'solid' : 'outline'}
                colorScheme="orange"
                onClick={() => setActionItemsFilter('high')}
              >
                High ({actionItemCount.high})
              </Button>
              <Button 
                size="xs" 
                variant={actionItemsFilter === 'medium' ? 'solid' : 'outline'}
                colorScheme="yellow"
                onClick={() => setActionItemsFilter('medium')}
              >
                Medium ({actionItemCount.medium})
              </Button>
              <Button 
                size="xs" 
                variant={actionItemsFilter === 'low' ? 'solid' : 'outline'}
                colorScheme="green"
                onClick={() => setActionItemsFilter('low')}
              >
                Low ({actionItemCount.low})
              </Button>
            </Flex>
            
            {!actionItemsLoading && (
              <Box maxH="220px" overflowY="auto" css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('gray.300', 'gray.600'),
                  borderRadius: '3px',
                },
              }}>
                <VStack align="stretch" spacing={2}>
                  {filteredActionItems.length > 0 ? (
                    filteredActionItems.map((item) => {
                      const priorityInfo = priorityConfig[item.priority] || priorityConfig.medium;
                      const statusInfo = statusConfig[item.status] || statusConfig.open;
                      const dueDateValue = item.dueDate ? new Date(item.dueDate) : null;
                      const dueLabel =
                        dueDateValue && !Number.isNaN(dueDateValue.getTime())
                          ? dueDateValue.toLocaleDateString()
                          : 'No due date';
                      const statusColor = (statusInfo.color || 'gray.500').split('.')[0];
                      
                      return (
                        <Box 
                          key={item.id}
                          p={3}
                          borderRadius="md"
                          bg={useColorModeValue('white', 'gray.600')}
                          border="1px solid"
                          borderColor={`${priorityInfo.colorScheme}.200`}
                          cursor="pointer"
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.500') }}
                          onClick={() => openActionDetail(item)}
                          // Touch-friendly enhancements
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          transition="transform 0.2s"
                        >
                          <Flex justify="space-between" align="flex-start" mb={1}>
                            <Text fontWeight="semibold" fontSize="sm">{item.title}</Text>
                            <Flex gap={1}>
                              <Badge 
                                colorScheme={priorityInfo.colorScheme}
                                fontSize="xs"
                              >
                                {priorityInfo.label}
                              </Badge>
                              <Badge 
                                colorScheme={statusColor}
                                fontSize="xs"
                              >
                                {statusInfo.label}
                              </Badge>
                            </Flex>
                          </Flex>
                          <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                            {item.description}
                          </Text>
                          <Flex justify="space-between" fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                            <Text>{item.department}</Text>
                            <Text>Due: {dueLabel}</Text>
                          </Flex>
                        </Box>
                      );
                    })
                  ) : (
                    <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center" py={4}>
                      No action items found for selected filter
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Visual Storyline Section with Recharts */}
      <Box 
        display="none"
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="xl"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        boxShadow="md"
        mb={6}
        px={{ base: 4, md: 6 }}
        py={4}
      >
        <Heading size="md" mb={4}>Performance Storyline</Heading>
        
        <VStack spacing={8} align="stretch">
          {/* Revenue Trend Chart */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="sm">Revenue Trend</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Monthly Performance</Text>
            </Flex>
            
            <Box height={{ base: '250px', md: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    tickFormatter={(value) => `ETB ${(value / 1000000).toFixed(1)}M`}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`ETB ${etbFormatter.format(value)}`, '']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: useColorModeValue('white', 'gray.800'),
                      border: `1px solid ${useColorModeValue('gray.200', 'gray.700')}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Actual Revenue" 
                    stroke="#3182CE" 
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target Revenue" 
                    stroke="#DD6B20" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          
          {/* Department Performance Chart */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="sm">Department Performance</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>Score Comparison</Text>
            </Flex>
            
            <Box height={{ base: '250px', md: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentPerformanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="department" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`${value}%`, '']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: useColorModeValue('white', 'gray.800'),
                      border: `1px solid ${useColorModeValue('gray.200', 'gray.700')}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    name="Performance Score"
                  >
                    {departmentPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          
          {/* Risk Distribution Chart */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="sm">Risk Distribution</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>By Severity</Text>
            </Flex>
            
            <Box height={{ base: '250px', md: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={{ base: 80, md: 100 }}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [value, 'Count']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: useColorModeValue('white', 'gray.800'),
                      border: `1px solid ${useColorModeValue('gray.200', 'gray.700')}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

        <Flex align="center" gap={3} mb={4} wrap="wrap" px={{ base: 4, md: 6 }}>
          <Button size="sm" variant="ghost" onClick={onOpenDeptDrawer}>Profit</Button>
          {/* Drawer opens legacy department list */}
        </Flex>

        <Box mb={4} px={{ base: 4, md: 6 }} ref={operationsRef}>
          <Heading size="md">Operations & Profit Dashboards</Heading>
          <Text fontSize="sm" color="gray.600">
            Toggle between profit performance, purchase activity, and revenue insight panels.
          </Text>
        </Box>

        <Tabs
          variant="soft-rounded"
          colorScheme="blue"
          mb={{ base: 6, md: 8 }}
          isLazy
          px={{ base: 4, md: 6 }}
        >
          <TabList
            bg={tabBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={tabBorderColor}
            px={1}
            py={1}
            position="relative"
          >
            <Tab flex="1">Profit</Tab>
            <Tab flex="1">Purchase</Tab>
            <Tab flex="1">Revenue</Tab>
            <TabIndicator
              height="3px"
              borderRadius="full"
              bg="blue.500"
              mt="-1px"
            />
          </TabList>
          <TabPanels mt={4}>
            <TabPanel px={{ base: 4, md: 6 }} py={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {profitHighlights.map((card) => (
                  <Box
                    key={card.label}
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={deptCardBg}
                    minH="150px"
                  >
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.500">
                      {card.label}
                    </Text>
                    <Heading size="lg" mt={2} color="blue.600">
                      {card.value}
                    </Heading>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {card.detail}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mt={4}>
                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  borderColor={borderColor}
                  bg={deptCardBg}
                  p={4}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Profit trend</Heading>
                    <Tag size="sm" colorScheme="green" variant="subtle">
                      {recentProfitPoints.length} periods
                    </Tag>
                  </Flex>
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    {profitTrendLabel}
                  </Text>
                  <Box>
                    <svg viewBox="0 0 320 140" width="100%" height="140">
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        points={profitLinePoints}
                      />
                      {profitabilityTrend.map((pt, idx) => {
                        const [x, y] = profitCoords[idx]?.split(',') || [0, 0];
                        return <circle key={pt.month} cx={x} cy={y} r="4" fill="#16a34a" />;
                      })}
                    </svg>
                    <Flex justify="space-between" fontSize="xs" color="gray.500">
                      {profitabilityTrend.map((pt) => (
                        <Text key={`profit-${pt.month}`}>{pt.month}</Text>
                      ))}
                    </Flex>
                  </Box>
                </Box>

                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  borderColor={borderColor}
                  bg={deptCardBg}
                  p={4}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Revenue vs Expense</Heading>
                    <Tag size="sm" colorScheme="purple" variant="subtle">Live</Tag>
                  </Flex>
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    Aggregated spend discipline for the entire organization.
                  </Text>
                  <Box>
                    <svg viewBox="0 0 320 140" width="100%" height="140">
                      <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={revenueLinePoints}
                      />
                      <polyline
                        fill="none"
                        stroke="#EA580C"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={expenseLinePoints}
                      />
                    </svg>
                    <Flex justify="space-between" fontSize="xs" color="gray.500">
                      {revenueExpenseSeries.map((pt) => (
                        <Text key={`revexp-${pt.month}`}>{pt.month}</Text>
                      ))}
                    </Flex>
                    <HStack spacing={4} mt={2} fontSize="xs" color="gray.500">
                      <HStack spacing={1}><Box w="10px" h="10px" bg="#2563EB" borderRadius="full" /> <Text>Revenue</Text></HStack>
                      <HStack spacing={1}><Box w="10px" h="10px" bg="#EA580C" borderRadius="full" /> <Text>Expenses</Text></HStack>
                    </HStack>
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>
            <TabPanel px={{ base: 4, md: 6 }} py={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={4}>
                {revenueHighlights.map((item) => (
                  <Box
                    key={item.label}
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={deptCardBg}
                  >
                    <Flex justify="space-between" align="baseline">
                      <Heading size="sm">{item.label}</Heading>
                      <Text fontSize="xs" color="gray.500">
                        {item.tag}
                      </Text>
                    </Flex>
                    <Heading size="lg" mt={2} color={item.color || 'blue.500'}>
                      {item.value}
                    </Heading>
                    {item.subtitle && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {item.subtitle}
                      </Text>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  borderColor={borderColor}
                  bg={deptCardBg}
                  p={4}
                >
                  <Heading size="sm" mb={2}>Revenue trend</Heading>
                  <VStack align="stretch" spacing={2}>
                    {revenueTrend.map((row) => (
                      <Flex key={`rev-${row.label}`} justify="space-between" fontSize="sm">
                        <Text color="gray.600">{row.label}</Text>
                        <Text fontWeight="semibold">{currencyFormatter.format(row.value)}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  borderColor={borderColor}
                  bg={deptCardBg}
                  p={4}
                >
                  <Heading size="sm" mb={2}>Revenue mix</Heading>
                  <VStack spacing={2} align="stretch">
                    {(revenueBreakdown.length ? revenueBreakdown : fallbackTradexRevenueRows).map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 180) : 100;
                      return (
                        <Flex key={`mix-${row.metric}`} justify="space-between" align="center">
                          <Box>
                            <Text fontSize="xs" color="gray.600">{row.metric}</Text>
                            <Text fontWeight="semibold">{row.actual ? etbFormatter.format(row.actual) : '-'}</Text>
                          </Box>
                          <Tag size="sm" colorScheme={pct > 100 ? 'green' : 'purple'}>{`${pct}%`}</Tag>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              </SimpleGrid>
            </TabPanel>
            <TabPanel px={{ base: 4, md: 6 }} py={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {purchaseOrders.map((order) => (
                  <Box
                    key={order.id}
                    borderWidth="1px"
                    borderRadius="xl"
                    borderColor={borderColor}
                    bg={deptCardBg}
                    p={4}
                    minH="180px"
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">{order.id}</Heading>
                      <Badge
                        colorScheme={purchaseStatusColors[order.status] || 'gray'}
                      >
                        {order.status}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      {order.department} - {order.vendor}
                    </Text>
                    <Heading size="md" mt={3}>
                      {etbFormatter.format(order.amount)}
                    </Heading>
                    <Flex mt={4} justify="space-between" align="center">
                      <Text fontSize="xs" color="gray.500">
                        {order.eta}
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => navigate('/finance-dashboard/purchase')}
                      >
                        View purchases
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Filter metrics removed per request */}

        {/* Sales tab snapshot (from Sales dashboard drawer) */}
        {selectedDept.toLowerCase() === 'sales' && (
          <MotionBox
            bg="white"
            p={{ base: 4, md: 5 }}
            borderRadius="xl"
            border="1px solid"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            mb={4}
          >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box display="none">
                <Heading size="md">Sales Report</Heading>
                <Text fontSize="sm" color="gray.600">Live snapshot from Sales dashboard drawer</Text>
              </Box>
              <Tag colorScheme="green" variant="subtle">Live</Tag>
            </Flex>
            <SimpleGrid columns={salesLiveSummaryColumns} spacing={4}>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Total Customers</Text>
                <Heading size="md">{loadingSales ? '...' : salesStats.total}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Completed Deals</Text>
                <Heading size="md" color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Called Customers</Text>
                <Heading size="md" color="purple.500">{loadingSales ? '...' : salesStats.calledCustomers}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">New Prospects</Text>
                <Heading size="md" color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Gross Commission</Text>
                <Heading size="md" color="orange.500">
                  {loadingSales ? '...' : `ETB ${Number(salesStats.grossCommission || 0).toFixed(2)}`}
                </Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Net Commission</Text>
                <Heading size="md" color="yellow.600">
                  {loadingSales ? '...' : `ETB ${Number(salesStats.totalCommission || 0).toFixed(2)}`}
                </Heading>
              </Box>
            </SimpleGrid>
            <Box mt={6}>
              <Text fontWeight="semibold" mb={2}>Sales at a glance</Text>
              <Flex align="flex-end" gap={3} flexWrap="wrap" h="180px" border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={4} bg="gray.50">
                {salesChartData.map((item) => (
                  <Flex key={item.label} direction="column" align="center" flex="1" minW="60px">
                    <Box
                      w="100%"
                      maxW="70px"
                      borderRadius="md"
                      bg={item.color}
                      height={item.height}
                      transition="all 0.2s ease"
                    />
                    <Text mt={2} fontSize="xs" textAlign="center" noOfLines={2}>{item.label}</Text>
                    <Text fontSize="xs" color="gray.600">{loadingSales ? '...' : item.display}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </MotionBox>
        )}

        {/* Manage Departments Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Manage Departments</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box mb={3}>
                <Text fontSize="sm" color="gray.700">Toggle which departments appear on the COO dashboard.</Text>
                <Text fontSize="xs" color="gray.500">“All” stays enabled for quick resets.</Text>
              </Box>
              <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={2}>
                <Tag colorScheme="blue" variant="subtle">Visible: {departments.length - excludedDepartments.length}</Tag>
                <Tag colorScheme="gray" variant="subtle">Hidden: {excludedDepartments.length}</Tag>
              </Flex>
              <Box
                border="1px solid"
                borderColor="blackAlpha.100"
                borderRadius="md"
                p={3}
                bg="gray.50"
              >
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} maxH="320px" overflowY="auto">
                  {loadingDepts ? (
                    <SkeletonText noOfLines={6} spacing={3} />
                  ) : (
                    departments.map(d => (
                      <Checkbox
                        key={d}
                        isChecked={!excludedDepartments.includes(d)}
                        onChange={() => toggleExcluded(d)}
                        isDisabled={d === 'All'}
                        colorScheme="blue"
                      >
                        {d === 'All' ? (
                          <Text as="span" fontWeight="semibold">All (always on)</Text>
                        ) : (
                          d
                        )}
                      </Checkbox>
                    ))
                  )}
                </SimpleGrid>
              </Box>
              <Box mt={4}>
                <Text fontWeight="semibold" mb={2}>Department reports</Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {departmentReports.map((dept) => (
                    <Box
                      key={`manage-${dept.department}`}
                      borderWidth="1px"
                      borderColor="blackAlpha.100"
                      borderRadius="lg"
                      p={3}
                      bg="gray.50"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="semibold">{dept.department}</Text>
                        {dept.department !== 'IT' && (
                          <Badge colorScheme={dept.color}>{dept.status}</Badge>
                        )}
                      </HStack>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Tasks</Text>
                          <Text fontWeight="bold">{dept.tasks}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Risks</Text>
                          <Text fontWeight="bold">{dept.risks}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">SLA</Text>
                          <Text fontWeight="bold">{dept.sla}</Text>
                        </Box>
                      </Grid>
                    </Box>
                  ))}
                  {departmentReports.length === 0 && (
                    <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                      <Text fontSize="sm" color="gray.600">No departments selected.</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} size="sm">Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Department Reports Popup */}
        <Modal isOpen={isReportsOpen} onClose={onCloseReports} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Department Reports</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4} color="gray.600">
                Quick snapshot from every visible department.
              </Text>
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                mb={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">Sales Report</Heading>
                  <Badge colorScheme="green">Live</Badge>
                </Flex>
                <SimpleGrid columns={salesStatColumns} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total Customers</Text>
                    <Heading size="md">{loadingSales ? '...' : salesStats.total}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Completed Deals</Text>
                    <Heading size="md" color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Called Customers</Text>
                    <Heading size="md" color="purple.500">{loadingSales ? '...' : salesStats.calledCustomers}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">New Prospects</Text>
                    <Heading size="md" color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Gross Commission</Text>
                    <Heading size="md" color="orange.500">{loadingSales ? '...' : `ETB ${Number(salesStats.grossCommission || 0).toFixed(2)}`}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Net Commission</Text>
                    <Heading size="md" color="yellow.600">{loadingSales ? '...' : `ETB ${Number(salesStats.totalCommission || 0).toFixed(2)}`}</Heading>
                  </Box>
                </SimpleGrid>
              </Box>
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                mb={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">IT Report</Heading>
                  <Badge colorScheme="purple">Latest</Badge>
                </Flex>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total</Text>
                    <Heading size="md">{loadingIt ? '…' : itSummary.total}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Completed</Text>
                    <Heading size="md" color="green.500">{loadingIt ? '…' : itSummary.completed}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Open</Text>
                    <Heading size="md" color="orange.500">{loadingIt ? '…' : itSummary.open}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Points</Text>
                    <Heading size="md" color="blue.500">{loadingIt ? '…' : itSummary.points}</Heading>
                  </Box>
                </SimpleGrid>
                </Box>
                <Box
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  p={4}
                  mb={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Social Media Report</Heading>
                    <Tag colorScheme="blue" variant="subtle">Weekly</Tag>
                  </Flex>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Target</Text>
                      <Heading size="md">{socialSummary.totalTarget.toLocaleString()}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Actual</Text>
                      <Heading size="md">{socialSummary.totalActual.toLocaleString()}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Delta</Text>
                      <Heading
                        size="md"
                        color={socialSummary.deltaPct >= 0 ? 'green.500' : 'red.500'}
                      >
                        {socialSummary.deltaPct >= 0 ? '+' : ''}
                        {socialSummary.deltaPct}%
                      </Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Platforms</Text>
                      <Heading size="md">{socialReportRows.length}</Heading>
                    </Box>
                  </SimpleGrid>
                  <VStack align="stretch" spacing={2}>
                    {socialReportRows.map((row) => {
                      const statusColor = row.colorScheme || 'gray';
                      return (
                        <Flex
                          key={row.platform}
                          justify="space-between"
                          align="center"
                          borderRadius="md"
                          border="1px solid"
                          borderColor={borderColor}
                          p={2}
                          bg={useColorModeValue('white', 'gray.800')}
                        >
                          <Box>
                            <Text fontWeight="semibold">{row.platform}</Text>
                            <Text fontSize="xs" color="gray.600">
                              Target {row.weeklyTarget.toLocaleString()} · Actual {row.actual.toLocaleString()}
                            </Text>
                          </Box>
                          <Tag size="sm" colorScheme={statusColor} variant="subtle">
                            {row.status}
                          </Tag>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
                <Box
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  p={4}
                  mb={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">TradexTV</Heading>
                    <Tag colorScheme="blue">Weekly</Tag>
                  </Flex>
                  <VStack align="stretch" spacing={3}>
                    {tradexSocialReport.map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 200) : 0;
                      const ahead = row.actual >= row.target;
                      return (
                        <Flex
                          key={row.platform}
                          align="center"
                          justify="space-between"
                          borderRadius="md"
                          border="1px solid"
                          borderColor={borderColor}
                          p={2}
                          bg={useColorModeValue('white', 'gray.800')}
                        >
                          <Box>
                            <Text fontWeight="semibold">{row.platform}</Text>
                            <Text fontSize="xs" color="gray.600">
                              Target {row.target.toLocaleString()} · Actual {row.actual.toLocaleString()}
                            </Text>
                          </Box>
                          <Box minW="140px">
                            <Progress
                              value={pct}
                              colorScheme={ahead ? 'green' : 'blue'}
                              height="8px"
                              borderRadius="full"
                            />
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {departmentReports.map((dept) => (
                  <Box
                    key={dept.department}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{dept.department}</Heading>
                      {dept.department !== 'IT' && (
                        <Badge colorScheme={dept.color}>{dept.status}</Badge>
                      )}
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Open tasks</Text>
                        <Tag colorScheme="blue" variant="subtle">{dept.tasks}</Tag>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Open risks</Text>
                        <Tag colorScheme="orange" variant="subtle">{dept.risks}</Tag>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">SLA</Text>
                        <Tag colorScheme="green" variant="subtle">{dept.sla}</Tag>
                      </Flex>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onCloseReports}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <VStack spacing={6} align="stretch" w="100%">
          <Box ref={financeRef}>
            <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} wrap="wrap" gap={3} mb={3}>
              <Box>
                <Heading size="md">Financial Snapshot</Heading>
                <Text fontSize="sm" color={analyticsMuted}>COO view across revenue, profit, cash and receivables.</Text>
              </Box>
              <Tag colorScheme="blue" variant="subtle">Live + Sample</Tag>
            </Flex>
            <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
              {financialCards.map((card) => (
                <Box
                  key={card.label}
                  bg={analyticsCardBg}
                  border="1px solid"
                  borderColor={analyticsBorder}
                  borderRadius="xl"
                  p={4}
                  boxShadow="sm"
                >
                  <Text fontSize="xs" color={analyticsMuted} textTransform="uppercase" letterSpacing="wide">
                    {card.label}
                  </Text>
                  <Heading size="md" mt={1} color={card.color}>{card.value}</Heading>
                  <Text fontSize="xs" color={analyticsMuted}>{card.detail}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Profitability trend</Heading>
                <Tag size="sm" colorScheme="green" variant="subtle">6 months</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Net profit trajectory with smooth lift.</Text>
              <Box>
                <svg viewBox="0 0 320 140" width="100%" height="140">
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    points={profitLinePoints}
                  />
                  {profitabilityTrend.map((pt, idx) => {
                    const [x, y] = profitCoords[idx]?.split(',') || [0, 0];
                    return <circle key={pt.month} cx={x} cy={y} r="4" fill="#16a34a" />;
                  })}
                </svg>
                <Flex justify="space-between" fontSize="xs" color={analyticsMuted}>
                  {profitabilityTrend.map((pt) => (
                    <Text key={`profit-${pt.month}`}>{pt.month}</Text>
                  ))}
                </Flex>
              </Box>
            </Box>

            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Revenue vs Expense</Heading>
                <Tag size="sm" colorScheme="purple" variant="subtle">Line chart</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Tracking operating leverage and spend discipline.</Text>
              <Box>
                <svg viewBox="0 0 320 140" width="100%" height="140">
                  <polyline
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={revenueLinePoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#EA580C"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points={expenseLinePoints}
                  />
                </svg>
                <Flex justify="space-between" fontSize="xs" color={analyticsMuted}>
                  {revenueExpenseSeries.map((pt) => (
                    <Text key={`revexp-${pt.month}`}>{pt.month}</Text>
                  ))}
                </Flex>
                <HStack spacing={4} mt={2} fontSize="xs" color={analyticsMuted}>
                  <HStack spacing={1}><Box w="10px" h="10px" bg="#2563EB" borderRadius="full" /> <Text>Revenue</Text></HStack>
                  <HStack spacing={1}><Box w="10px" h="10px" bg="#EA580C" borderRadius="full" /> <Text>Expenses</Text></HStack>
                </HStack>
              </Box>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Product performance</Heading>
                <Tag size="sm" colorScheme="teal" variant="subtle">Bar chart</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Revenue contribution by line of business.</Text>
              <Flex gap={3} align="flex-end" minH="180px">
                {productBars.map((item) => (
                  <Box key={item.name} flex="1">
                    <Box
                      h={`${item.height}px`}
                      bgGradient="linear(to-t, teal.500, blue.400)"
                      borderRadius="lg"
                      boxShadow="sm"
                    />
                    <Text fontSize="xs" color={analyticsMuted} mt={1} textAlign="center">{item.name}</Text>
                    <Text fontSize="xs" textAlign="center" color="gray.700" fontWeight="semibold">
                      {etbFormatter.format(item.revenue)}
                    </Text>
                    <Text fontSize="xs" textAlign="center" color={analyticsMuted}>Margin {item.margin}%</Text>
                  </Box>
                ))}
              </Flex>
            </Box>

            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Customer growth</Heading>
                <Tag size="sm" colorScheme="green" variant="subtle">Growth curve</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Compounded acquisition momentum.</Text>
              <Box>
                <svg viewBox="0 0 320 140" width="100%" height="140">
                  <polyline
                    fill="none"
                    stroke="#0EA5E9"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    points={customerLinePoints}
                  />
                  {customerGrowth.map((pt, idx) => {
                    const [x, y] = customerCoords[idx]?.split(',') || [0, 0];
                    return <circle key={pt.month} cx={x} cy={y} r="4" fill="#0EA5E9" />;
                  })}
                </svg>
                <Flex justify="space-between" fontSize="xs" color={analyticsMuted}>
                  {customerGrowth.map((pt) => (
                    <Text key={`cust-${pt.month}`}>{pt.month}</Text>
                  ))}
                </Flex>
              </Box>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Revenue mix</Heading>
                <Tag size="sm" colorScheme="pink" variant="subtle">Pie chart</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Share of revenue by product line.</Text>
              <Flex align="center" gap={6} wrap="wrap">
                <Box position="relative" w="140px" h="140px">
                  <svg viewBox="0 0 140 140" width="140" height="140">
                    {pieSegments.map((seg, idx) => (
                      <circle
                        key={seg.name}
                        cx="70"
                        cy="70"
                        r={seg.radius}
                        fill="none"
                        stroke={pieColors[idx % pieColors.length]}
                        strokeWidth="22"
                        strokeDasharray={`${seg.dash} ${seg.circumference}`}
                        strokeDashoffset={seg.dashOffset}
                        transform="rotate(-90 70 70)"
                        strokeLinecap="butt"
                      />
                    ))}
                    <text x="70" y="75" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">
                      100%
                    </text>
                  </svg>
                </Box>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} flex="1" minW="220px">
                  {pieSegments.map((seg, idx) => (
                    <HStack key={`pie-legend-${seg.name}`} spacing={2}>
                      <Box w="10px" h="10px" bg={pieColors[idx % pieColors.length]} borderRadius="full" />
                      <Box>
                        <Text fontWeight="semibold">{seg.name}</Text>
                        <Text fontSize="xs" color={analyticsMuted}>
                          {etbFormatter.format(seg.revenue || 0)} • {seg.pct}%
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Flex>
            </Box>

            <Box
              bg={analyticsCardBg}
              border="1px solid"
              borderColor={analyticsBorder}
              borderRadius="xl"
              p={4}
              boxShadow="md"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="sm">Business health</Heading>
                <Tag size="sm" colorScheme="purple" variant="subtle">Donut</Tag>
              </Flex>
              <Text fontSize="xs" color={analyticsMuted} mb={3}>Weighted view of delivery health, watch list, and risk.</Text>
              <Flex align="center" gap={6} wrap="wrap">
                <Box position="relative" w="120px" h="120px">
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <circle cx="60" cy="60" r={donutRadius} fill="none" stroke={donutTrack} strokeWidth="12" opacity="0.35" />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="12"
                      strokeDasharray={`${(businessHealth.healthy / 100) * donutCircumference} ${donutCircumference}`}
                      strokeDashoffset={donutCircumference * 0.25}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray={`${(businessHealth.watch / 100) * donutCircumference} ${donutCircumference}`}
                      strokeDashoffset={donutCircumference * (0.25 - businessHealth.healthy / 100)}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="12"
                      strokeDasharray={`${(businessHealth.risk / 100) * donutCircumference} ${donutCircumference}`}
                      strokeDashoffset={donutCircumference * (0.25 - (businessHealth.healthy + businessHealth.watch) / 100)}
                      strokeLinecap="round"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">
                      {businessHealth.healthy}%
                    </text>
                  </svg>
                </Box>
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} flex="1" minW="240px">
                  <HStack spacing={2}>
                    <Box w="10px" h="10px" bg="#16A34A" borderRadius="full" />
                    <Box>
                      <Text fontWeight="semibold">Healthy</Text>
                      <Text fontSize="xs" color={analyticsMuted}>Stable delivery & SLA</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w="10px" h="10px" bg="#F59E0B" borderRadius="full" />
                    <Box>
                      <Text fontWeight="semibold">Watch</Text>
                      <Text fontSize="xs" color={analyticsMuted}>Follow-up in flight</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w="10px" h="10px" bg="#EF4444" borderRadius="full" />
                    <Box>
                      <Text fontWeight="semibold">Risk</Text>
                      <Text fontSize="xs" color={analyticsMuted}>Escalations tracked</Text>
                    </Box>
                  </HStack>
                </SimpleGrid>
              </Flex>
            </Box>
          </SimpleGrid>

          <Divider my={4} />
          <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" wrap="wrap" gap={3}>
            <Box>
              <Heading size="md">Operations & Profit Dashboards</Heading>
              <Text fontSize="sm" color={analyticsMuted}>Team performance, profit, customer service, finance, and sales details.</Text>
            </Box>
            <Tag colorScheme="gray" variant="subtle">Live</Tag>
          </Flex>

          <Box>
            <KpiCards department={effectiveDept} timeRange={timeRange} metrics={metrics} />
          </Box>

            {showSocialRequestsSection && (
            <MotionBox
              bg="white"
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              border="1px solid"
              borderColor="blackAlpha.100"
              boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="md">TradexTV report</Heading>
                  <Text fontSize="sm" color="gray.600">COO snapshot across revenue, social and deliverables.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">TradexTV</Tag>
              </Flex>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
                {tradexSummaryData.map((item, idx) => (
                  <Box key={`tradex-summary-${item.label}-${idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                    <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">{item.label}</Text>
                    <Heading size="md" mt={1}>{tradexLoading ? '...' : item.value}</Heading>
                    {item.sublabel && <Text fontSize="xs" color="gray.600">{item.sublabel}</Text>}
                  </Box>
                ))}
              </SimpleGrid>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <Box border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Revenue pulse</Heading>
                    <Tag size="sm" colorScheme="green" variant="subtle">vs target</Tag>
                  </Flex>
                  <VStack align="stretch" spacing={3}>
                    {(tradexRevenueRows.length ? tradexRevenueRows : fallbackTradexRevenueRows).map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 180) : 100;
                      const ahead = row.actual >= row.target;
                      return (
                        <Box key={row.metric}>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold">{row.metric}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {currencyFormatter.format(row.actual || 0)} / {currencyFormatter.format(row.target || 0)}
                              </Text>
                            </Box>
                            <Tag size="sm" colorScheme={ahead ? 'green' : 'yellow'} variant="subtle">
                              {pct}%
                            </Tag>
                          </Flex>
                          <Progress value={pct} colorScheme={ahead ? 'green' : 'yellow'} height="8px" borderRadius="full" mt={2} />
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                <Box border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">TradexTV</Heading>
                    <Tag size="sm" colorScheme="blue" variant="subtle">Weekly</Tag>
                  </Flex>
                  <VStack align="stretch" spacing={3}>
                    {tradexSocialReport.map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 180) : 100;
                      return (
                        <Flex key={row.platform} align="center" justify="space-between" borderRadius="md" border="1px solid" borderColor="blackAlpha.100" p={2} bg="white">
                          <Box>
                            <Text fontWeight="semibold">{row.platform}</Text>
                            <Text fontSize="xs" color="gray.600">Target {row.target.toLocaleString()} | Actual {row.actual.toLocaleString()}</Text>
                          </Box>
                          <Box minW="140px">
                            <Progress value={pct} colorScheme={pct >= 100 ? 'green' : 'blue'} height="8px" borderRadius="full" />
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              </Grid>

              <Box mt={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">Top deliverables</Heading>
                  <Tag size="sm" colorScheme="purple" variant="subtle">{tradexDeliverables.length ? 'Live' : 'Sample'}</Tag>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {(tradexDeliverables.length ? tradexDeliverables : fallbackTradexDeliverables).map((item, idx) => (
                    <Box key={`tradex-deliverable-${idx}`} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="white">
                      <Text fontWeight="semibold">{item.service}</Text>
                      <Text fontSize="xs" color="gray.600">Owner: {item.owner}</Text>
                      <Flex justify="space-between" align="center" mt={2}>
                        <Tag size="sm" colorScheme="blue" variant="subtle">{item.status}</Tag>
                        <Text fontSize="xs" color="gray.600">{item.due || 'No due date'}</Text>
                      </Flex>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </MotionBox>
            )}

            <MotionBox
              bg="white"
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              border="1px solid"
              borderColor="blackAlpha.100"
              boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              mb={4}
            >
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="md">Executive analysis</Heading>
                  <Text fontSize="sm" color="gray.600">Revenue trend, P&L pulse, and department mix.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">Live + Sample</Tag>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Revenue trend</Text>
                  <VStack align="stretch" spacing={2}>
                    {revenueTrend.map((row) => (
                      <Box key={`rev-${row.label}`}>
                        <Flex justify="space-between" fontSize="xs" color="gray.600">
                          <Text>{row.label}</Text>
                          <Text fontWeight="semibold">{currencyFormatter.format(row.value)}</Text>
                        </Flex>
                        <Box h="8px" borderRadius="full" bg="gray.100" overflow="hidden">
                          <Box h="100%" w={`${Math.min((row.value / (revenueTrend[revenueTrend.length - 1].value || 1)) * 100, 100)}%`} bgGradient="linear(to-r, blue.400, purple.500)" />
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Profit &amp; Loss snapshot</Text>
                  <VStack align="stretch" spacing={3} p={3} borderRadius="lg" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Revenue</Text>
                      <Text fontWeight="bold" color="blue.600">
                        {profitLossReport?.revenue != null ? etbFormatter.format(profitLossReport.revenue) : etbFormatter.format(financeStats.revenue || 0)}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Expenses</Text>
                      <Text fontWeight="bold" color="red.500">
                        {profitLossReport?.expenses != null ? etbFormatter.format(profitLossReport.expenses) : etbFormatter.format(financeStats.expenses || 0)}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Net Profit</Text>
                      <Text fontWeight="bold" color="green.600">
                        {profitLossReport?.profit != null ? etbFormatter.format(profitLossReport.profit) : etbFormatter.format(financeStats.profit || 0)}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Department mix</Text>
                  <VStack align="stretch" spacing={2}>
                    {deptMix.map((row) => (
                      <Box key={`mix-${row.label}`}>
                        <Flex justify="space-between" fontSize="xs" color="gray.600">
                          <Text>{row.label}</Text>
                          <Text fontWeight="semibold">{row.value}%</Text>
                        </Flex>
                        <Box h="8px" borderRadius="full" bg="gray.100" overflow="hidden">
                          <Box h="100%" w={`${row.value}%`} bg={row.color} opacity={0.9} />
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
            </MotionBox>

            <MotionBox
              bg="white"
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              border="1px solid"
              borderColor="blackAlpha.100"
              boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              display="none"
            >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box />
              <Tag size="md" colorScheme="purple" variant="subtle">{selectedDept === 'All' ? 'All departments' : selectedDept}</Tag>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: '1.1fr 1fr 1fr' }} gap={4}>
              <Box>
                <Text fontWeight="semibold" mb={3}>Revenue breakdown</Text>
                <VStack align="stretch" spacing={3}>
                  {(loadingRevenueOps ? [{ label: 'Loading', value: '...', change: '', target: '' }] : revenueBreakdown).map((item) => {
                    const isNegative = (item.change || '').startsWith('-');
                    return (
                      <Box
                        key={item.label}
                        p={3}
                        border="1px solid"
                        borderColor="blackAlpha.100"
                        borderRadius="lg"
                        bg="gray.50"
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{item.label}</Text>
                            <Heading size="md">{item.value}</Heading>
                            {item.target && (
                              <Text fontSize="xs" color="gray.600">Target {item.target}</Text>
                            )}
                          </Box>
                          <Tag colorScheme={isNegative ? 'red' : 'green'} variant="subtle">
                            {item.change || '—'}
                          </Tag>
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={3}>Customer follow-up</Text>
                <Box
                  border="1px solid"
                  borderColor="blackAlpha.100"
                  borderRadius="lg"
                  p={3}
                  bg="gray.50"
                >
                  <SimpleGrid columns={{ base: 2, md: 2 }} spacing={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Total records</Text>
                      <Heading size="md">{loadingRevenueOps ? '…' : followupSummary.total}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Active (last called)</Text>
                      <Heading size="md" color="green.500">{loadingRevenueOps ? '…' : followupSummary.active}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Unique agents</Text>
                      <Heading size="md" color="purple.500">{loadingRevenueOps ? '…' : followupSummary.agents}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Packages</Text>
                      <Heading size="md" color="blue.500">{loadingRevenueOps ? '…' : followupSummary.packages}</Heading>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Box>
            </Grid>
          </MotionBox>

          <MotionBox
            bg="white"
            p={{ base: 4, md: 5 }}
            borderRadius="xl"
            border="1px solid"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box>
                <Heading size="md">Customer Service report</Heading>
                <Text fontSize="sm" color="gray.600">Live stats from Customer Dashboard.</Text>
              </Box>
              <Tag colorScheme="blue" variant="subtle" size="md">Live queue</Tag>
            </Flex>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Total follow-ups</Text>
                <Heading size="md" mt={1}>{loadingCsStats ? '...' : csStats.total}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Active</Text>
                <Heading size="md" mt={1} color="green.500">{loadingCsStats ? '...' : csStats.active}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Completed</Text>
                <Heading size="md" mt={1} color="blue.500">{loadingCsStats ? '...' : csStats.completed}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">New vs Returning</Text>
                <Heading size="md" mt={1}>{loadingCsStats ? '...' : `${csStats.newCustomers} / ${csStats.returningCustomers}`}</Heading>
              </Box>
            </SimpleGrid>
            <Box mt={6}>
              <Flex align="center" justify="space-between" mb={3}>
                <Heading size="sm">Finance report</Heading>
                <Tag size="sm" colorScheme="blue" variant="subtle">Live</Tag>
              </Flex>
              <SimpleGrid columns={salesStatColumns} gap={3}>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Revenue</Text>
                  <Heading size="md" mt={1}>{loadingFinance ? '...' : etbFormatter.format(financeStats.revenue || 0)}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Expenses</Text>
                  <Heading size="md" mt={1} color="red.500">{loadingFinance ? '...' : etbFormatter.format(financeStats.expenses || 0)}</Heading>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Total Costs Recorded: {loadingFinance ? '...' : etbFormatter.format(financeStats.totalCostsRecorded || 0)}
                  </Text>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Net Profit</Text>
                  <Heading size="md" mt={1} color="green.500">{loadingFinance ? '...' : etbFormatter.format(financeStats.profit || 0)}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Invoices</Text>
                  <Heading size="md" mt={1} color="purple.500">{loadingFinance ? '...' : financeStats.invoices}</Heading>
                </Box>
              </SimpleGrid>
              <Box mt={4}>
                <Heading size="sm" mb={2}>Finance reports (from Finance Dashboard)</Heading>
                <Box mb={3}>
                  <Heading size="xs" color="gray.700" mb={1}>Profit & Loss</Heading>
                  {loadingFinanceReports ? (
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                      <Skeleton height="14px" mb={2} />
                      <Skeleton height="14px" width="70%" />
                    </Box>
                  ) : profitLossReport ? (
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="semibold">{profitLossReport.title || profitLossReport.name || 'Profit & Loss'}</Text>
                        <Tag size="sm" colorScheme="green" variant="subtle">{profitLossReport.status || 'Published'}</Tag>
                      </Flex>
                      <Text fontSize="xs" color="gray.600">{profitLossReport.period || profitLossReport.date || profitLossReport.createdAt || ''}</Text>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={2} mt={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Revenue</Text>
                          <Heading size="sm">{profitLossReport.revenue != null ? etbFormatter.format(profitLossReport.revenue) : '-'}</Heading>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Expenses</Text>
                          <Heading size="sm" color="red.500">{profitLossReport.expenses != null ? etbFormatter.format(profitLossReport.expenses) : '-'}</Heading>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Net Profit</Text>
                          <Heading size="sm" color="green.600">
                            {profitLossReport.profit != null ? etbFormatter.format(profitLossReport.profit) : '-'}
                          </Heading>
                        </Box>
                      </SimpleGrid>
                      {profitLossReport.summary && <Text fontSize="sm" color="gray.700" mt={2}>{profitLossReport.summary}</Text>}
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No Profit & Loss report available.</Text>
                  )}
                </Box>
                <VStack align="stretch" spacing={2}>
                  {(loadingFinanceReports ? Array.from({ length: 3 }) : financeReports).map((row, idx) => {
                    if (loadingFinanceReports) {
                      return (
                        <Box key={`fin-skel-${idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                          <Skeleton height="16px" mb={2} />
                          <Skeleton height="12px" width="60%" />
                        </Box>
                      );
                    }
                    return (
                      <Box key={`finance-report-${row?._id || idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontWeight="semibold">{row?.title || row?.name || 'Report'}</Text>
                            <Text fontSize="xs" color="gray.600">{row?.period || row?.date || row?.createdAt || ''}</Text>
                          </Box>
                          <Tag colorScheme="blue" variant="subtle">{row?.status || 'Published'}</Tag>
                        </Flex>
                        {row?.summary && <Text fontSize="sm" color="gray.700" mt={1}>{row.summary}</Text>}
                      </Box>
                    );
                  })}
                  {!loadingFinanceReports && financeReports.length === 0 && (
                    <Text fontSize="sm" color="gray.500">No finance reports available.</Text>
                  )}
                </VStack>
              </Box>
            </Box>
            <Box mt={6}>
              <Flex align="center" justify="space-between" mb={3}>
                <Heading size="sm">Sales report</Heading>
                <Tag size="sm" colorScheme="green" variant="subtle">Live</Tag>
              </Flex>
              {(() => {
                const gross = salesStats.grossCommission || 0;
                const net = salesStats.totalCommission || 0;
                const tax = salesStats.commissionTax || 0;
                const rangeLabel = timeRangeLabels[timeRange] || timeRange;
                return (
                <SimpleGrid columns={salesMetricColumns} gap={3} mb={3}>
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="orange.50">
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Training gross ({rangeLabel})</Text>
                      <Heading size="md" mt={1} color="orange.600">
                        {loadingSales ? '...' : etbFormatter.format(gross)}
                      </Heading>
                    </Box>
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="yellow.50">
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Commission tax ({rangeLabel})</Text>
                      <Heading size="md" mt={1} color="yellow.600">
                        {loadingSales ? '...' : etbFormatter.format(tax)}
                      </Heading>
                    </Box>
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="teal.50">
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Net commission ({rangeLabel})</Text>
                      <Heading size="md" mt={1} color="teal.600">
                        {loadingSales ? '...' : etbFormatter.format(net)}
                      </Heading>
                    </Box>
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="blue.50">
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Commission (reported)</Text>
                      <Heading size="md" mt={1} color="blue.600">
                        {loadingSales ? '...' : etbFormatter.format(net)}
                      </Heading>
                    </Box>
                  </SimpleGrid>
                );
              })()}
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Customers</Text>
                  <Heading size="md" mt={1}>{loadingSales ? '...' : salesStats.total}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Deals</Text>
                  <Heading size="md" mt={1} color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Net Comm.</Text>
                  <Heading size="md" mt={1} color="blue.500">
                    {loadingSales ? '...' : etbFormatter.format(salesStats.totalCommission || 0)}
                  </Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">New Prospects</Text>
                  <Heading size="md" mt={1} color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
                </Box>
              </SimpleGrid>
            </Box>
            <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="md" overflow="hidden">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Queue</Th>
                    <Th>Owner</Th>
                    <Th isNumeric>Open</Th>
                    <Th>SLA</Th>
                    <Th>Aging</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {csQueues.map((row) => (
                    <Tr key={row.queue}>
                      <Td>{row.queue}</Td>
                      <Td>{row.owner}</Td>
                      <Td isNumeric>{row.open}</Td>
                      <Td>
                        <Badge colorScheme={parseInt(row.sla) >= 92 ? 'green' : 'yellow'} variant="subtle">
                          {row.sla}
                        </Badge>
                      </Td>
                      <Td>{row.aging}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
        </MotionBox>

        </VStack>
        </Box>
      </Flex>

    {/* Collapsible Sidebar Drawer */}
    <Drawer isOpen={isSidePanelOpen} placement="left" onClose={onCloseSidePanel} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>COO controls</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            <VStack align="stretch" spacing={2}>
              {sidebarSections.map((section) => {
                const isActive = activeSidebarSection === section.id;
                return (
                  <Button
                    key={`coo-section-${section.id}`}
                    variant="ghost"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    h="36px"
                    borderRadius="10px"
                    px={3}
                    py={2}
                    fontSize="13px"
                    borderWidth="1px"
                    borderColor={isActive ? 'transparent' : borderColor}
                    bg={isActive ? sidebarSectionActiveBg : 'transparent'}
                    color={isActive ? '#6D28D9' : controlTextColor}
                    _hover={{
                      bg: isActive ? sidebarSectionActiveBg : sidebarSectionHover,
                    }}
                    onClick={() => handleControlStackSelect(section.id)}
                    aria-pressed={isActive}
                  >
                    <Text fontWeight="semibold">{section.title}</Text>
                  </Button>
                );
              })}
            </VStack>
            <Divider />
            <Box>{renderSidebarSectionContent()}</Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>

    {/* Broadcast Notification Modal */}
    <Modal isOpen={isBroadcastOpen} onClose={onCloseBroadcast} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send broadcast notification</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3} align="stretch">
            <Input
              placeholder="Title (optional)"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write a message for everyone..."
              minH="120px"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onCloseBroadcast}>Cancel</Button>
          <Button colorScheme="green" onClick={handleBroadcast} isLoading={sendingBroadcast}>
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Departments Drawer */}
    <Drawer isOpen={isDeptDrawerOpen} placement="left" onClose={onCloseDeptDrawer} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Departments</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={3}>
            <Input
              placeholder="Search departments..."
              size="sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <VStack align="stretch" spacing={2} maxH="60vh" overflowY="auto">
              {displayedDepartments.map((dept) => (
                <Button
                  key={`drawer-${dept}`}
                  justifyContent="space-between"
                  size="sm"
                  variant={selectedDept === dept ? 'solid' : 'ghost'}
                  colorScheme={selectedDept === dept ? 'blue' : 'gray'}
                  isDisabled={dept === 'Sales Manager' && !isCoo}
                  onClick={() => {
                    setSelectedDept(dept);
                    const route = deptRouteMap[dept.toLowerCase()];
                    if (route && (dept !== 'Sales Manager' || isCoo)) navigate(route);
                    onCloseDeptDrawer();
                  }}
                >
                  {dept}
                </Button>
              ))}
            </VStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>

    {/* Action Item Detail Drawer */}
    <Drawer isOpen={isActionDetailOpen} onClose={onCloseActionDetail} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Flex justify="space-between" align="center">
            <Text>Action Item Details</Text>
            <Flex gap={2}>
              {selectedActionItem && (
                <>
                  <Badge 
                    colorScheme={priorityConfig[selectedActionItem.priority]?.colorScheme || 'gray'}
                  >
                    {priorityConfig[selectedActionItem.priority]?.label || selectedActionItem.priority}
                  </Badge>
                  <Badge 
                    colorScheme={statusConfig[selectedActionItem.status]?.color.split('.')[0] || 'gray'}
                  >
                    {statusConfig[selectedActionItem.status]?.label || selectedActionItem.status}
                  </Badge>
                </>
              )}
            </Flex>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          {selectedActionItem && (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" mb={2}>{selectedActionItem.title}</Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  {selectedActionItem.description}
                </Text>
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Department</Text>
                  <Text>{selectedActionItem.department}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Assignee</Text>
                  <Text>{selectedActionItem.assignee}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Created</Text>
                  <Text>{new Date(selectedActionItem.timestamp).toLocaleString()}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Due Date</Text>
                  <Text>{selectedActionItem.dueDate ? new Date(selectedActionItem.dueDate).toLocaleString() : 'N/A'}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Priority</Text>
                  <Text>{priorityConfig[selectedActionItem.priority]?.label || selectedActionItem.priority}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>Status</Text>
                  <Text>{statusConfig[selectedActionItem.status]?.label || selectedActionItem.status}</Text>
                </Box>
              </SimpleGrid>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>Additional Notes</Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  This action item requires immediate attention. Please coordinate with the {selectedActionItem.department} team to resolve this issue.
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>Related Tasks</Text>
                <VStack align="stretch" spacing={2}>
                  <Box p={3} borderRadius="md" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="semibold" fontSize="sm">Review infrastructure requirements</Text>
                      <Badge colorScheme="blue" fontSize="xs">Pending</Badge>
                    </Flex>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Due: Dec 22, 2025</Text>
                  </Box>
                  <Box p={3} borderRadius="md" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="semibold" fontSize="sm">Submit budget approval request</Text>
                      <Badge colorScheme="green" fontSize="xs">Completed</Badge>
                    </Flex>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Completed: Dec 18, 2025</Text>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={onCloseActionDetail}>
            Close
          </Button>
          <Button colorScheme="blue">Take Action</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    {/* Bottom Navigation Bar for Mobile */}
    <Box 
      display={{ base: 'flex', md: 'none' }}
      position="fixed" 
      bottom="0" 
      left="0" 
      right="0" 
      bg={useColorModeValue('white', 'gray.800')}
      borderTop="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
      zIndex="1000"
    >
      <Flex flex="1" justify="space-around" align="center" py={2}>
        <Flex 
          direction="column" 
          align="center" 
          flex="1" 
          py={2}
          onClick={() => setCurrentMobileTab('overview')}
          cursor="pointer"
          bg={currentMobileTab === 'overview' ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
          borderRadius="md"
        >
          <InfoIcon boxSize={5} color={currentMobileTab === 'overview' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')} />
          <Text fontSize="xs" mt={1} color={currentMobileTab === 'overview' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')}>Overview</Text>
        </Flex>
        
        <Flex 
          direction="column" 
          align="center" 
          flex="1" 
          py={2}
          onClick={() => setCurrentMobileTab('finance')}
          cursor="pointer"
          bg={currentMobileTab === 'finance' ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
          borderRadius="md"
        >
          <BellIcon boxSize={5} color={currentMobileTab === 'finance' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')} />
          <Text fontSize="xs" mt={1} color={currentMobileTab === 'finance' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')}>Finance</Text>
        </Flex>
        
        <Flex 
          direction="column" 
          align="center" 
          flex="1" 
          py={2}
          onClick={() => setCurrentMobileTab('operations')}
          cursor="pointer"
          bg={currentMobileTab === 'operations' ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
          borderRadius="md"
        >
          <HamburgerIcon boxSize={5} color={currentMobileTab === 'operations' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')} />
          <Text fontSize="xs" mt={1} color={currentMobileTab === 'operations' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')}>Operations</Text>
        </Flex>
        
        <Flex 
          direction="column" 
          align="center" 
          flex="1" 
          py={2}
          onClick={() => setCurrentMobileTab('alerts')}
          cursor="pointer"
          bg={currentMobileTab === 'alerts' ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
          borderRadius="md"
        >
          <BellIcon boxSize={5} color={currentMobileTab === 'alerts' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')} />
          <Text fontSize="xs" mt={1} color={currentMobileTab === 'alerts' ? 'blue.500' : useColorModeValue('gray.500', 'gray.400')}>Alerts</Text>
        </Flex>
      </Flex>
    </Box>

    </Box>
  );
};

export default COODashboard;
