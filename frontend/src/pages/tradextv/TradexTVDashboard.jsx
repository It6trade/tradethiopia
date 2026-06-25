import React, { useState, useEffect, useCallback, Component, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  useColorModeValue,
  useColorMode,
  VStack,
  Link,
  useBreakpointValue,
  IconButton,
  Divider,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiHome,
  FiMenu,
  FiSettings,
  FiBarChart2,
  FiFileText,
  FiUser,
  FiLayers,
  FiHelpCircle,
  FiVideo,
  FiFilm,
  FiYoutube,
  FiCamera,
  FiImage,
  FiAward,
  FiPieChart,
  FiChevronDown,
  FiLogOut,
  FiClipboard,
  FiTarget,
} from 'react-icons/fi';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { normalizeRole, useUserStore } from '../../store/user';
import axios from 'axios';
import { getNotifications } from '../../services/notificationService';
import NotesLauncher from '../../components/notes/NotesLauncher';
import KpiScorecardSection from '../../components/kpi/KpiScorecardSection';
import MessagesPage from '../MessagesPage';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

// Import split tab components
import OverviewTab from './components/OverviewTab';
import ProjectsTab from './components/ProjectsTab';
import TeamTab from './components/TeamTab';
import AnalyticsTab from './components/AnalyticsTab';
import RevenueTab from './components/RevenueTab';
import ReportTab from './components/ReportTab';
import SettingsTab from './components/SettingsTab';
import ProjectModal from './components/ProjectModal';
import NewCustomerModal from './components/NewCustomerModal';

const defaultServiceOptions = ['Promotional video', 'Motion graphics', 'Graphics design', 'Brand promo video'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const defaultRevenueRows = [
  { metric: 'MTD revenue', target: 1200000, actual: 1240000 },
  { metric: 'New bookings', target: 550000, actual: 520000 },
  { metric: 'Renewals & upsell', target: 320000, actual: 345000 },
];
const defaultMonthlyRevenue = [
  { month: 'Jan', target: 900000, actual: 880000 },
  { month: 'Feb', target: 950000, actual: 990000 },
  { month: 'Mar', target: 1000000, actual: 1025000 },
  { month: 'Apr', target: 1050000, actual: 1010000 },
  { month: 'May', target: 1100000, actual: 1120000 },
  { month: 'Jun', target: 1150000, actual: 1175000 },
  { month: 'Jul', target: 1200000, actual: 1180000 },
  { month: 'Aug', target: 1250000, actual: 1265000 },
  { month: 'Sep', target: 1300000, actual: 1280000 },
  { month: 'Oct', target: 1350000, actual: 1370000 },
  { month: 'Nov', target: 1400000, actual: 1415000 },
  { month: 'Dec', target: 1500000, actual: 1520000 },
];
const defaultSocialTargets = [
  { platform: 'YouTube', target: 833, actual: 720 },
  { platform: 'TikTok', target: 1666, actual: 1810 },
  { platform: 'Facebook', target: 4166, actual: 3920 },
  { platform: 'LinkedIn', target: 416, actual: 402 },
  { platform: 'WhatsApp', target: 833, actual: 0 },
  { platform: 'Telegram', target: 833, actual: 910 },
  { platform: 'Instagram', target: 1666, actual: 0 },
  { platform: 'Twitter', target: 1666, actual: 0 },
  { platform: 'Google', target: 1666, actual: 0 },
];

const TradexTVDashboard = () => {
  // Tab state
  const [tabIndex, setTabIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const tabKeys = ['overview', 'projects', 'team', 'analytics', 'kpi', 'revenue', 'report', 'notice-board', 'settings'];
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabsChange = (index) => {
    setTabIndex(index);
    const params = new URLSearchParams(location.search);
    const key = tabKeys[index] || 'overview';
    if (key === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', key);
    }
    navigate(`/tradextv-dashboard${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const usersLoading = useUserStore((state) => state.loading);
  const usersError = useUserStore((state) => state.error);
  
  const [stats, setStats] = useState([
    { id: 1, label: 'Active Projects', value: '12', change: 2.5, isUp: true, icon: 'FiVideo' },
    { id: 2, label: 'Team Members', value: '8', change: 0, isUp: true, icon: 'FiUsers' },
    { id: 3, label: 'Completed Today', value: '5', change: 1.2, isUp: true, icon: 'FiCheckCircle' },
    { id: 4, label: 'Satisfaction', value: '96%', change: 0.8, isUp: true, icon: 'FiAward' },
  ]);
  const [serviceOptions, setServiceOptions] = useState(defaultServiceOptions);
  
  const { isOpen: isProjectModalOpen, onOpen: onOpenProjectModal, onClose: onCloseProjectModal } = useDisclosure();
  const { isOpen: isNewCustomerOpen, onOpen: onOpenNewCustomer, onClose: onCloseNewCustomer } = useDisclosure();
  
  const [newCustomerForm, setNewCustomerForm] = useState({
    customer: '',
    subject: '',
    services: [],
    status: 'In Progress',
    priority: 'High',
    date: '',
    notes: ''
  });
  const [newServiceName, setNewServiceName] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);
  const toast = useToast();

  // Map icon names to actual icon components
  const iconMap = {
    FiHome,
    FiMessageSquare,
    FiUsers,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiSettings,
    FiBarChart2,
    FiFileText,
    FiUser,
    FiLayers,
    FiHelpCircle,
    FiVideo,
    FiFilm,
    FiYoutube,
    FiCamera,
    FiImage,
    FiAward,
    FiPieChart
  };

  // Safe icon getter
  const getIcon = (iconName) => {
    return iconMap[iconName] || FiAlertCircle;
  };

  const { colorMode, toggleColorMode } = useColorMode();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarActiveBg = useColorModeValue('purple.50', 'purple.900');
  const sidebarHoverBg = useColorModeValue('gray.100', 'gray.700');
  const placeholderBg = useColorModeValue('gray.100', 'gray.700');
  const sidebarLinkColor = useColorModeValue('gray.700', 'gray.100');
  const sidebarActiveColor = useColorModeValue('purple.600', 'purple.200');
  const cardTextColor = useColorModeValue('gray.900', 'whiteAlpha.900');
  const sectionHeadingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const sectionTextColor = useColorModeValue('gray.600', 'gray.300');
  const serviceInputTextColor = useColorModeValue('gray.900', 'gray.100');
  const serviceInputPlaceholderColor = useColorModeValue('gray.500', 'gray.400');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const bodyTextColor = useColorModeValue('gray.700', 'gray.200');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const accentIconColor = useColorModeValue('purple.500', 'purple.200');
  const positiveTextColor = useColorModeValue('green.600', 'green.300');
  const warningTextColor = useColorModeValue('orange.500', 'orange.300');
  const negativeTextColor = useColorModeValue('red.600', 'red.300');
  const toggleLabel = colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isSidebarCollapsed ? '70px' : '250px';
  
  const [revenueReportRows, setRevenueReportRows] = useState(defaultRevenueRows);
  const today = useMemo(() => new Date(), []);
  const [monthFilter, setMonthFilter] = useState(monthNames[today.getMonth()]);
  const [yearFilter, setYearFilter] = useState(String(today.getFullYear()));
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();
  const [monthlyRevenue, setMonthlyRevenue] = useState(defaultMonthlyRevenue);

  const [socialTargets, setSocialTargets] = useState(defaultSocialTargets);

  const fetchServiceTypes = useCallback(async () => {
    try {
      setIsLoadingServices(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-types`);
      if (Array.isArray(res.data)) {
        setServiceOptions(res.data.filter((s) => s.active !== false).map((s) => s.name));
      }
    } catch (err) {
      console.error('Failed to load service types', err);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const fetchRevenueAndSocial = useCallback(async () => {
    try {
      setIsLoadingMetrics(true);
      const [revRes, socRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/social-actuals`),
      ]);

      if (revRes.status === 'fulfilled' && Array.isArray(revRes.value.data)) {
        const entries = revRes.value.data;
        setRevenueReportRows(
          defaultRevenueRows.map((row) => {
            const match = entries.find(
              (e) =>
                e.metric === row.metric &&
                (e.month ? e.month === currentMonth : true) &&
                (e.year ? Number(e.year) === currentYear : true)
            );
            return match
              ? { ...row, target: match.target ?? row.target, actual: match.actual ?? row.actual }
              : row;
          })
        );

        setMonthlyRevenue(
          defaultMonthlyRevenue.map((m) => {
            const match = entries.find(
              (e) =>
                e.metric === 'MTD revenue' &&
                e.month === m.month &&
                (e.year ? Number(e.year) === currentYear : true)
            );
            return match ? { ...m, target: match.target ?? m.target, actual: match.actual ?? m.actual } : m;
          })
        );
      }

      if (socRes.status === 'fulfilled' && Array.isArray(socRes.value.data)) {
        const entries = socRes.value.data;
        setSocialTargets(
          defaultSocialTargets.map((item) => {
            const match = entries.find(
              (e) =>
                e.platform === item.platform &&
                (e.month ? e.month === currentMonth : true) &&
                (e.year ? Number(e.year) === currentYear : true)
            );
            return match
              ? { ...item, target: match.target ?? item.target, actual: match.actual ?? item.actual }
              : item;
          })
        );
      }
    } catch (err) {
      console.error('Failed to load revenue/social metrics', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [currentMonth, currentYear]);

  const [departmentKpis, setDepartmentKpis] = useState([
    { department: 'Video Production', revenueTarget: 450000, revenueActual: 420000, followersActual: 1810, followersTarget: 1666 },
    { department: 'Content Creation', revenueTarget: 280000, revenueActual: 305000, followersActual: 3920, followersTarget: 4166 },
    { department: 'Customer Support', revenueTarget: 180000, revenueActual: 175000, followersActual: 402, followersTarget: 416 },
    { department: 'Growth & Social', revenueTarget: 320000, revenueActual: 345000, followersActual: 910, followersTarget: 833 },
  ]);

  const [projects, setProjects] = useState([
    { id: 1, name: 'Product promo reel', owner: 'Sara', status: 'In Progress', dueDate: '2025-12-05', description: '30s promo cut + subtitles' },
    { id: 2, name: 'Motion graphics pack', owner: 'Lidya', status: 'Review', dueDate: '2025-12-12', description: '5 animated lower-thirds' },
  ]);

  const [projectForm, setProjectForm] = useState({
    name: '',
    owner: '',
    dueDate: '',
    status: 'In Progress',
    description: '',
  });
  const [projectFilters, setProjectFilters] = useState({
    search: '',
    status: 'all',
    sort: 'dueAsc',
  });

  const [actualForm, setActualForm] = useState({
    metric: 'MTD revenue',
    actual: '',
    target: '',
  });

  const [socialForm, setSocialForm] = useState({
    platform: 'YouTube',
    actual: '',
    target: '',
  });

  const tradextvUsers = useMemo(
    () => (users || []).filter((user) => normalizeRole(user.role || user.userRole) === 'tradextv'),
    [users]
  );

  const tradexMembers = useMemo(() => {
    if (tradextvUsers.length) {
      return tradextvUsers.map((user) => {
        const id = user._id || user.id || user.email || user.username || user.fullName || user.name;
        const name = user.fullName || user.username || user.name || user.email || 'Team Member';
        return { id: String(id || name), name };
      });
    }
    const fallbackOwners = [...new Set(projects.map((project) => project.owner).filter(Boolean))];
    return fallbackOwners.map((name) => ({ id: name, name }));
  }, [tradextvUsers, projects]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const [revenueSummaryCards, setRevenueSummaryCards] = useState([
    { label: 'MTD revenue', value: 1240000, change: '+4.3% MoM', isCurrency: true },
    { label: 'Forecast', value: 1820000, change: '+6.1% vs plan', isCurrency: true },
    { label: 'Avg deal size', value: 8200, change: '+2.1% QoQ', isCurrency: true },
  ]);

  const filteredProjects = useMemo(() => {
    const search = projectFilters.search.trim().toLowerCase();
    const status = projectFilters.status;
    const filtered = projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        p.owner.toLowerCase().includes(search);
      const matchesStatus = status === 'all' ? true : p.status.toLowerCase() === status.toLowerCase();
      return matchesSearch && matchesStatus;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (projectFilters.sort === 'dueAsc') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (projectFilters.sort === 'dueDesc') {
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [projects, projectFilters]);

  const projectMetrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const inProgress = projects.filter((p) => p.status === 'In Progress').length;
    const review = projects.filter((p) => p.status === 'Review').length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, review, completionRate };
  }, [projects]);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    fetchServiceTypes();
    fetchRevenueAndSocial();
  }, [fetchServiceTypes, fetchRevenueAndSocial]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const idx = tabParam ? tabKeys.indexOf(tabParam) : 0;
    setTabIndex(idx >= 0 ? idx : 0);
  }, [location.search]);

  useEffect(() => {
    if (users.length === 0 && !usersLoading && !usersError) {
      fetchUsers();
    }
  }, [users.length, usersLoading, usersError, fetchUsers]);

  useEffect(() => {
    // Fetch users when opening the Team tab if not already loaded
    if (tabIndex === 2 && users.length === 0 && !usersLoading) {
      fetchUsers();
    }
  }, [tabIndex, users.length, usersLoading, fetchUsers]);

  // Fetch notifications to count unread messages
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      // Filter for general notifications (broadcast messages) and count unread
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to periodically refresh the count
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  const handleAddProject = () => {
    if (!projectForm.name.trim() || !projectForm.owner.trim() || !projectForm.dueDate) return;
    const nextId = (projects[projects.length - 1]?.id || 0) + 1;
    setProjects((prev) => [
      ...prev,
      {
        id: nextId,
        name: projectForm.name.trim(),
        owner: projectForm.owner.trim(),
        status: projectForm.status,
        dueDate: projectForm.dueDate,
        description: projectForm.description.trim(),
      },
    ]);
    setProjectForm({ name: '', owner: '', dueDate: '', status: 'In Progress', description: '' });
    onCloseProjectModal();
  };

  const handleProjectModalClose = () => {
    setProjectForm({ name: '', owner: '', dueDate: '', status: 'In Progress', description: '' });
    onCloseProjectModal();
  };

  const resetNewCustomerForm = () =>
    setNewCustomerForm({
      customer: '',
      subject: '',
      services: [],
      status: 'In Progress',
      priority: 'High',
      date: '',
      notes: ''
    });

  const handleCloseNewCustomer = () => {
    resetNewCustomerForm();
    onCloseNewCustomer();
  };

  const handleAddServiceType = async () => {
    const name = newServiceName.trim();
    if (!name) return;
    const exists = serviceOptions.some((service) => service.toLowerCase() === name.toLowerCase());
    if (exists) {
      setNewServiceName('');
      return;
    }
    try {
      setIsLoadingServices(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/service-types`, { name });
      await fetchServiceTypes();
      setNewServiceName('');
    } catch (err) {
      console.error('Failed to add service', err);
      setIsLoadingServices(false);
    }
  };

  const handleRemoveServiceType = async (name) => {
    try {
      setIsLoadingServices(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-types`);
      const match = Array.isArray(res.data) ? res.data.find((s) => s.name === name) : null;
      if (match?._id) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/service-types/${match._id}`);
      }
      setServiceOptions((prev) => prev.filter((s) => s !== name));
      setNewCustomerForm((p) => ({
        ...p,
        services: (p.services || []).filter((s) => s !== name)
      }));
    } catch (err) {
      console.error('Failed to remove service', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleNewCustomerSubmit = () => {
    const trimmedName = newCustomerForm.customer.trim();
    if (!trimmedName) return;
    const dateValue = newCustomerForm.date || new Date().toISOString().split('T')[0];

    const selectedServices =
      newCustomerForm.services && newCustomerForm.services.length
        ? newCustomerForm.services
        : [serviceOptions[0]];

    const payload = {
      clientName: trimmedName,
      companyName: trimmedName,
      phoneNumber: 'none',
      email: 'none',
      services: selectedServices,
      packageType: newCustomerForm.subject || 'Service request',
      service: selectedServices[0] || 'Service request',
      serviceProvided: selectedServices.join(', '), 
      serviceNotProvided: newCustomerForm.notes || 'N/A',
      notes: newCustomerForm.notes || '',
      deadline: dateValue,
      createdBy: currentUser?._id || currentUser?.username || currentUser?.name || 'tradextv',
    };

    setIsSavingFollowup(true);
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/tradex-followups`, payload)
      .catch((err) => {
        console.error('Failed to create follow-up', err);
      })
      .finally(() => {
        setIsSavingFollowup(false);
        handleCloseNewCustomer();
      });
  };

  const handleProjectStatusChange = (id, status) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handleUpdateActual = async () => {
    const val = Number(actualForm.actual);
    const targetVal =
      actualForm.target !== ''
        ? Number(actualForm.target)
        : revenueReportRows.find((row) => row.metric === actualForm.metric)?.target || 0;
    if (!actualForm.metric || Number.isNaN(val)) return;
    try {
      setIsLoadingMetrics(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`, {
        metric: actualForm.metric,
        actual: val,
        target: targetVal,
        month: currentMonth,
        year: currentYear,
      });
      await fetchRevenueAndSocial();
      setActualForm((p) => ({ ...p, actual: '', target: '' }));
    } catch (err) {
      console.error('Failed to save revenue actual', err);
      setIsLoadingMetrics(false);
    }
  };

  const handleUpdateSocial = async () => {
    const val = Number(socialForm.actual);
    const targetVal =
      socialForm.target !== ''
        ? Number(socialForm.target)
        : socialTargets.find((item) => item.platform === socialForm.platform)?.target || 0;
    if (!socialForm.platform || Number.isNaN(val)) return;
    try {
      setIsLoadingMetrics(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/social-actuals`, {
        platform: socialForm.platform,
        actual: val,
        target: targetVal,
        month: currentMonth,
        year: currentYear,
      });
      await fetchRevenueAndSocial();
      setSocialForm((p) => ({ ...p, actual: '', target: '' }));
    } catch (err) {
      console.error('Failed to save social actual', err);
      setIsLoadingMetrics(false);
    }
  };

  const fetchTradexRollActuals = useCallback(async () => {
    if (!currentUser) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser.token) headers.Authorization = `Bearer ${currentUser.token}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tradextv/roll`, { headers });
      if (!res.ok) throw new Error('Failed to load tradex roll metrics');
      const json = await res.json();
      const payload = json.data || json;
      if (Array.isArray(payload.revenueRows)) setRevenueReportRows(payload.revenueRows);
      if (Array.isArray(payload.socialTargets)) setSocialTargets(payload.socialTargets);
      if (Array.isArray(payload.departmentKpis)) setDepartmentKpis(payload.departmentKpis);
      if (Array.isArray(payload.summaryCards)) setRevenueSummaryCards(payload.summaryCards);
    } catch (err) {
      console.warn('Using fallback metrics; tradex roll fetch failed or not configured.', err);
    }
  }, [currentUser, setRevenueReportRows, setSocialTargets, setDepartmentKpis, setRevenueSummaryCards]);

  useEffect(() => {
    fetchTradexRollActuals();
  }, [fetchTradexRollActuals]);

  const menuItems = [
    { 
      section: 'Main',
      items: [
        { icon: FiHome, label: 'Overview', path: '/tradextv-dashboard' },
        { icon: FiMessageSquare, label: 'Projects', path: '/tradextv-dashboard?tab=projects' },
        { icon: FiUsers, label: 'Team', path: '/tradextv-dashboard?tab=team' },
        { icon: FiPieChart, label: 'Analytics', path: '/tradextv-dashboard?tab=analytics' },
        { icon: FiTarget, label: 'KPI', path: '/tradextv-dashboard?tab=kpi' },
        { icon: FiBarChart2, label: 'Revenue', path: '/tradextv-dashboard?tab=revenue' },
        { icon: FiFileText, label: 'Report', path: '/tradextv-dashboard?tab=report' },
        { icon: FiClipboard, label: 'Requests', path: '/requests' },
        { icon: FiMessageSquare, label: 'Notice Board', path: '/tradextv-dashboard?tab=notice-board', unreadCount: unreadCount },
        { icon: FiSettings, label: 'Settings', path: '/tradextv-dashboard?tab=settings' },
      ]
    },
  ];

  return (
    <Box minH="100vh" bg={pageBg} color={bodyTextColor}>
      {isLoading && (
        <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.5)" display="flex" alignItems="center" justifyContent="center" zIndex={9999}>
          <Box bg={cardBg} p={8} borderRadius="lg" boxShadow="lg" color={cardTextColor}>
            <Text>Loading dashboard...</Text>
          </Box>
        </Box>
      )}
      
      {error && (
        <Box position="fixed" top={4} right={4} bg="red.500" color="white" p={4} borderRadius="md" zIndex={9999}>
          <Text>{error}</Text>
          <Button size="sm" mt={2} onClick={() => setError(null)}>Dismiss</Button>
        </Box>
      )}
      <Flex>
        {/* Sidebar */}
        <Box
          as="nav"
          width={sidebarWidth}
          position="fixed"
          left={0}
          top={0}
          h="100vh"
          bg={sidebarBg}
          boxShadow="sm"
          transition="width 0.3s ease"
          zIndex="sticky"
        >
          {/* Sidebar Header */}
          <Flex 
            h="70px" 
            alignItems="center" 
            px={4} 
            borderBottomWidth="1px"
            borderBottomColor={sidebarBorderColor}
            justifyContent={isSidebarCollapsed ? 'center' : 'space-between'}
          >
            {!isSidebarCollapsed && (
              <Heading size="md" color={accentIconColor}>TradeXTV</Heading>
            )}
            <IconButton
              icon={<FiMenu />}
              variant="ghost"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            />
          </Flex>

          {/* Sidebar Menu */}
          <Box overflowY="auto" h="calc(100vh - 180px)" p={4}>
            {menuItems.map((section, index) => (
              <Box key={index} mb={6}>
                {!isSidebarCollapsed && section.section && (
                  <Text 
                    px={4} 
                    py={2} 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {section.section}
                  </Text>
                )}
                <VStack spacing={1} align="stretch">
                  {section.items.map((item) => {
                    const currentPath = location.pathname + location.search;
                    const isActive = currentPath === item.path;
                    return (
                      <Link
                        key={item.path}
                        as={RouterLink}
                        to={item.path}
                        display="flex"
                        alignItems="center"
                        p={3}
                        mx={2}
                        borderRadius="md"
                        bg={isActive ? sidebarActiveBg : 'transparent'}
                        color={isActive ? sidebarActiveColor : sidebarLinkColor}
                        _hover={{
                          textDecoration: 'none',
                          bg: isActive ? sidebarActiveBg : sidebarHoverBg,
                        }}
                        fontWeight={isActive ? 'semibold' : 'normal'}
                        position="relative"
                        onClick={() => {
                          if (item.label === 'Notice Board') {
                            setTimeout(fetchUnreadCount, 500);
                          }
                        }}
                      >
                        <Icon as={item.icon} mr={isSidebarCollapsed ? 0 : 3} />
                        {!isSidebarCollapsed && (
                          <>
                            {item.label}
                            {item.unreadCount > 0 && item.label === 'Notice Board' && (
                              <Badge
                                colorScheme="red"
                                borderRadius="full"
                                position="absolute"
                                top="5px"
                                right="5px"
                                fontSize="10px"
                                w="18px"
                                h="18px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                {item.unreadCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </VStack>
                {index < menuItems.length - 1 && !isSidebarCollapsed && (
                  <Divider my={2} mx={4} borderColor={sidebarBorderColor} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
        {/* Main Content */}
        <Box 
          flex="1" 
          ml={isSidebarCollapsed ? '70px' : '250px'}
          p={6}
          transition="margin-left 0.3s ease"
        >
          <Flex justify="flex-end" align="center" mb={4} gap={3}>
            <HStack spacing={2}>
              <IconButton
                aria-label={toggleLabel}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
              />
              <NotesLauncher
                buttonProps={{
                  variant: 'ghost',
                  size: 'sm',
                  colorScheme: 'purple',
                  'aria-label': 'Notes',
                }}
                tooltipLabel="Notes"
              />
              <Menu placement="bottom-end" isLazy>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  rightIcon={<FiChevronDown />}
                  leftIcon={<Avatar size="sm" name={currentUser?.username || currentUser?.name || 'User'} />}
                >
                  <Flex direction="column" align="flex-start" gap={0} textAlign="left">
                    <Text fontWeight="semibold" lineHeight="short">{currentUser?.username || currentUser?.name || 'User'}</Text>
                    <Text fontSize="xs" color={mutedTextColor}>{currentUser?.role || 'Role'}</Text>
                  </Flex>
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FiUser />}>{currentUser?.email || 'profile@tradex.tv'}</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FiSettings />}>Profile</MenuItem>
                  <MenuItem
                    icon={<FiLogOut />}
                    color="red.500"
                    onClick={() => {
                      clearUser();
                      navigate('/login');
                    }}
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          <Tabs index={tabIndex} onChange={handleTabsChange} variant="enclosed" colorScheme="purple" width="100%">
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Projects</Tab>
              <Tab>Team</Tab>
              <Tab>Analytics</Tab>
              <Tab>KPI</Tab>
              <Tab>Revenue</Tab>
              <Tab>Report</Tab>
              <Tab>Notice Board</Tab>
              <Tab>Settings</Tab>
            </TabList>

            <TabPanels mt={4}>
              {/* Overview Tab */}
              <TabPanel p={0}>
                <OverviewTab
                  stats={stats}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  accentIconColor={accentIconColor}
                  mutedTextColor={mutedTextColor}
                  warningTextColor={warningTextColor}
                  placeholderBg={placeholderBg}
                  cardTextColor={cardTextColor}
                  onOpenNewCustomer={onOpenNewCustomer}
                  getIcon={getIcon}
                />
              </TabPanel>

              {/* Projects Tab */}
              <TabPanel p={0}>
                <ProjectsTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  mutedTextColor={mutedTextColor}
                  projectFilters={projectFilters}
                  setProjectFilters={setProjectFilters}
                  filteredProjects={filteredProjects}
                  handleProjectStatusChange={handleProjectStatusChange}
                  onOpenProjectModal={onOpenProjectModal}
                />
              </TabPanel>

              {/* Team Tab */}
              <TabPanel p={0}>
                <TeamTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  mutedTextColor={mutedTextColor}
                  usersLoading={usersLoading}
                  usersError={usersError}
                  tradextvUsers={tradextvUsers}
                  negativeTextColor={negativeTextColor}
                />
              </TabPanel>

              {/* Analytics Tab */}
              <TabPanel p={0}>
                <AnalyticsTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  cardTextColor={cardTextColor}
                  sectionTextColor={sectionTextColor}
                  projectMetrics={projectMetrics}
                  positiveTextColor={positiveTextColor}
                  accentIconColor={accentIconColor}
                  warningTextColor={warningTextColor}
                  placeholderBg={placeholderBg}
                  mutedTextColor={mutedTextColor}
                />
              </TabPanel>

              {/* KPI Tab */}
              <TabPanel p={0}>
                <Box 
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  borderWidth="1px"
                  borderColor={borderColor}
                  mb={8}
                >
                  <KpiScorecardSection
                    title="TradeXTV KPI Scorecard"
                    description="Enter each team member's target, achieved amount, core output, and absences to calculate the KPI result."
                    storageKey="kpi-tradextv-scores-v1"
                    members={tradexMembers}
                    isLoading={usersLoading && tradextvUsers.length === 0}
                    nameLabel="Team Member"
                    emptyLabel="No TradeXTV team members found."
                  />
                </Box>
              </TabPanel>

              {/* Revenue Tab */}
              <TabPanel p={0}>
                <RevenueTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  sectionTextColor={sectionTextColor}
                  revenueReportRows={revenueReportRows}
                  currencyFormatter={currencyFormatter}
                  revenueSummaryCards={revenueSummaryCards}
                  cardTextColor={cardTextColor}
                  negativeTextColor={negativeTextColor}
                  positiveTextColor={positiveTextColor}
                  warningTextColor={warningTextColor}
                  accentIconColor={accentIconColor}
                  actualForm={actualForm}
                  setActualForm={setActualForm}
                  handleUpdateActual={handleUpdateActual}
                  departmentKpis={departmentKpis}
                  mutedTextColor={mutedTextColor}
                />
              </TabPanel>

              {/* Report Tab */}
              <TabPanel p={0}>
                <ReportTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  sectionTextColor={sectionTextColor}
                  revenueReportRows={revenueReportRows}
                  currencyFormatter={currencyFormatter}
                  socialTargets={socialTargets}
                  cardTextColor={cardTextColor}
                  positiveTextColor={positiveTextColor}
                  warningTextColor={warningTextColor}
                  socialForm={socialForm}
                  setSocialForm={setSocialForm}
                  handleUpdateSocial={handleUpdateSocial}
                  monthFilter={monthFilter}
                  setMonthFilter={setMonthFilter}
                  yearFilter={yearFilter}
                  setYearFilter={setYearFilter}
                  monthNames={monthNames}
                  today={today}
                  mutedTextColor={mutedTextColor}
                />
              </TabPanel>

              {/* Notice Board Tab */}
              <TabPanel p={0}>
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  borderWidth="1px"
                  borderColor={borderColor}
                  mb={8}
                >
                  <MessagesPage embedded />
                </Box>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel p={0}>
                <SettingsTab
                  cardBg={cardBg}
                  borderColor={borderColor}
                  sectionHeadingColor={sectionHeadingColor}
                  sectionTextColor={sectionTextColor}
                  newServiceName={newServiceName}
                  setNewServiceName={setNewServiceName}
                  handleAddServiceType={handleAddServiceType}
                  handleRemoveServiceType={handleRemoveServiceType}
                  isLoadingServices={isLoadingServices}
                  serviceOptions={serviceOptions}
                  serviceInputTextColor={serviceInputTextColor}
                  serviceInputPlaceholderColor={serviceInputPlaceholderColor}
                  mutedTextColor={mutedTextColor}
                  cardTextColor={cardTextColor}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleProjectModalClose}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        handleAddProject={handleAddProject}
      />

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={handleCloseNewCustomer}
        newCustomerForm={newCustomerForm}
        setNewCustomerForm={setNewCustomerForm}
        serviceOptions={serviceOptions}
        isSavingFollowup={isSavingFollowup}
        handleNewCustomerSubmit={handleNewCustomerSubmit}
      />
    </Box>
  );
};

const ErrorStateContent = ({ message, onReset }) => {
  const errorBg = useColorModeValue('red.50', 'red.900');
  const headingColor = useColorModeValue('red.600', 'red.300');
  const textColor = useColorModeValue('red.700', 'red.200');

  return (
    <Box p={6} bg={errorBg} borderRadius="md" m={4}>
      <Heading size="md" color={headingColor}>Something went wrong</Heading>
      <Text mt={2} color={textColor}>{message}</Text>
      <Button mt={4} colorScheme="red" onClick={onReset}>
        Try again
      </Button>
    </Box>
  );
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorStateContent
          message={this.state.error?.message || 'An unknown error occurred'}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default function TradexTVDashboardWrapper() {
  return (
    <ErrorBoundary>
      <TradexTVDashboard />
    </ErrorBoundary>
  );
}
