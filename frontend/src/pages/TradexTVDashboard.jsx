import React, { useState, useEffect, useCallback, Component, useMemo } from 'react';
import {
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Grid, 
  GridItem, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  StatArrow,
  Badge,
  Table,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Thead,
  Tbody,
  Tr, 
  Th, 
  Td, 
  Icon, 
  useColorModeValue, 
  useColorMode,
  VStack, 
  Link, 
  useBreakpointValue, 
  IconButton, 
  Divider,
  HStack,
  Progress,
  Tag,
  Input,
  FormControl,
  FormLabel,
  Select,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Checkbox,
  CheckboxGroup,
  Stack,
  Textarea
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
import { normalizeRole, useUserStore } from '../store/user';
import axios from 'axios';
import { getNotifications } from '../services/notificationService';
import NotificationsPanel from '../components/NotificationsPanel';
import NotesLauncher from '../components/notes/NotesLauncher';
import KpiScorecardSection from '../components/kpi/KpiScorecardSection';
import MessagesPage from './MessagesPage';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
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

// Mock data
const stats = [
  { id: 1, label: 'Total Tickets', value: '1,234', change: 12.5, isUp: true, icon: FiMessageSquare },
  { id: 2, label: 'Active Tickets', value: '189', change: -2.3, isUp: false, icon: FiClock },
  { id: 3, label: 'Resolved Today', value: '42', change: 8.2, isUp: true, icon: FiCheckCircle },
  { id: 4, label: 'Satisfaction', value: '94%', change: 1.2, isUp: true, icon: FiUsers },
];

const getPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'gray';
  }
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'open': return 'blue';
    case 'in progress': return 'yellow';
    case 'pending': return 'orange';
    case 'resolved': return 'green';
    default: return 'gray';
  }
};

const TradexTVDashboard = () => {
  // Tab state
  const [tabIndex, setTabIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const tabKeys = ['overview', 'projects', 'team', 'analytics', 'kpi', 'revenue', 'report', 'notice-board', 'settings'];
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
  const isTradexRole = ((currentUser?.role || '').toLowerCase() || '').includes('tradex');
  const [stats, setStats] = useState([
    { id: 1, label: 'Active Projects', value: '12', change: 2.5, isUp: true, icon: 'FiVideo' },
    { id: 2, label: 'Team Members', value: '8', change: 0, isUp: true, icon: 'FiUsers' },
    { id: 3, label: 'Completed Today', value: '5', change: 1.2, isUp: true, icon: 'FiCheckCircle' },
    { id: 4, label: 'Satisfaction', value: '96%', change: 0.8, isUp: true, icon: 'FiAward' },
  ]);
  const [serviceOptions, setServiceOptions] = useState(defaultServiceOptions);
  
  const { isOpen: isProjectModalOpen, onOpen: onOpenProjectModal, onClose: onCloseProjectModal } = useDisclosure();
  const { isOpen: isNewCustomerOpen, onOpen: onOpenNewCustomer, onClose: onCloseNewCustomer } = useDisclosure();
  const { isOpen: isBroadcastOpen, onOpen: onOpenBroadcast, onClose: onCloseBroadcast } = useDisclosure();
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
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
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
  const navigate = useNavigate();
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
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = isSidebarCollapsed ? '70px' : '250px';
  const mainContentMargin = isSidebarCollapsed ? '70px' : '250px';
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
      // fetch current list to find id; since we only store names locally, refetch and locate
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-types`);
      const match = Array.isArray(res.data) ? res.data.find((s) => s.name === name) : null;
      if (match?._id) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/service-types/${match._id}`);
      }
      // also remove locally
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
      serviceProvided: selectedServices.join(', '), // kept for compatibility
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

  // Broadcast sending disabled for TradexTV per request

  const handleUpdateActual = async () => {
    const val = Number(actualForm.actual);
    const targetVal =
      actualForm.target !== ''
        ? Number(actualForm.target)
        : revenueReportRows.find((row) => row.metric === actualForm.metric)?.target || 0;
    if (!actualForm.metric || Number.isNaN(val)) return;
    try {
      setIsLoadingMetrics(true);
      // send target so backend can store both
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

  // Use routes that actually exist in the router (base is /tradextv-dashboard)
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
                            // Refresh the count when navigating to the Notice Board
                            setTimeout(fetchUnreadCount, 500);
                          }
                        }}
                      >                        <Icon as={item.icon} mr={isSidebarCollapsed ? 0 : 3} />
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
                      </Link>                    );
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
            <Flex justify="space-between" align="center" mb={8}>
              <Box>
                <Heading size="lg" mb={1}>TradexTV Dashboard</Heading>
                <Text color={mutedTextColor}>Welcome back! Here's what's happening with your customer support.</Text>
              </Box>
          <HStack spacing={3}>
            <NotificationsPanel
              buttonProps={{
                colorScheme: 'purple',
                variant: 'outline',
                size: 'sm',
              }}
              buttonLabel="Notifications"
            />
              <Button colorScheme="purple" onClick={onOpenNewCustomer}>
                New customer
              </Button>
          </HStack>
            </Flex>

      {/* Stats Grid */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        {stats.map((stat) => (
          <GridItem key={stat.id}>
            <Box 
              bg={cardBg}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Flex align="center" mb={3}>
                <Icon as={getIcon(stat.icon)} w={6} h={6} color={accentIconColor} mr={3} />
                <Text fontSize="sm" color={mutedTextColor}>{stat.label}</Text>
              </Flex>
              <Flex align="flex-end" justify="space-between">
                <Stat>
                  <StatNumber fontSize="2xl" fontWeight="bold">{stat.value}</StatNumber>
                  <StatHelpText mb={0}>
                    <StatArrow type={stat.isUp ? 'increase' : 'decrease'} />
                    {stat.change}% from last week
                  </StatHelpText>
                </Stat>
              </Flex>
            </Box>
          </GridItem>
        ))}
      </Grid>

      {/* Recent Tickets removed */}

          {/* Quick Actions */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
            <Box 
              bg={cardBg}
              p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="sm" mb={4} display="flex" alignItems="center">
          <Icon as={FiAlertCircle} mr={2} color={warningTextColor} />
            Quick Actions
          </Heading>
          <Button colorScheme="blue" size="sm" w="full" mb={2}>
            Create Knowledge Base Article
          </Button>
          <Button colorScheme="green" size="sm" w="full" mb={2}>
            Generate Report
          </Button>
          <Button colorScheme="purple" size="sm" w="full">
            View Analytics
          </Button>
        </Box>
        
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            h="100%"
            color={cardTextColor}
          >
            <Heading size="sm" mb={4}>Performance Overview</Heading>
            <Text color={mutedTextColor} mb={4}>
              Track your team's performance and response times to improve customer satisfaction.
            </Text>
            <Box bg={placeholderBg} h="200px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
              <Text color={mutedTextColor}>Performance metrics chart will be displayed here</Text>
            </Box>
          </Box>
        </GridItem>
        </Grid>

        </TabPanel>

          {/* Tickets Tab */}
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
              <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="lg">Projects</Heading>
                  <Text color={mutedTextColor}>Track current work, update status, and add new projects quickly.</Text>
                </Box>
                <Button colorScheme="purple" size="sm" onClick={onOpenProjectModal}>
                  Add project
                </Button>
              </Flex>
              <Flex gap={3} wrap="wrap" mb={4}>
                <FormControl maxW="240px">
                  <FormLabel fontSize="sm">Search</FormLabel>
                  <Input
                    size="sm"
                    placeholder="Search name or owner"
                    value={projectFilters.search}
                    onChange={(e) => setProjectFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </FormControl>
                <FormControl maxW="180px">
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select
                    size="sm"
                    value={projectFilters.status}
                    onChange={(e) => setProjectFilters((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="all">All</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </FormControl>
                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Sort</FormLabel>
                  <Select
                    size="sm"
                    value={projectFilters.sort}
                    onChange={(e) => setProjectFilters((p) => ({ ...p, sort: e.target.value }))}
                  >
                    <option value="dueAsc">Due date (soonest)</option>
                    <option value="dueDesc">Due date (latest)</option>
                    <option value="name">Name</option>
                  </Select>
                </FormControl>
              </Flex>
              <Box>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Owner</Th>
                      <Th>Status</Th>
                      <Th>Due</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredProjects.length === 0 ? (
                      <Tr>
                        <Td colSpan={4}>
                          <Text color={mutedTextColor}>No projects match your filters.</Text>
                        </Td>
                      </Tr>
                    ) : filteredProjects.map((proj) => (
                      <Tr key={proj.id}>
                        <Td fontWeight="semibold">{proj.name}</Td>
                        <Td>{proj.owner}</Td>
                        <Td>
                          <Select
                            size="sm"
                            value={proj.status}
                            onChange={(e) => handleProjectStatusChange(proj.id, e.target.value)}
                          >
                            <option>In Progress</option>
                            <option>Review</option>
                            <option>Completed</option>
                          </Select>
                        </Td>
                        <Td>{proj.dueDate}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>

          {/* Team Tab */}
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
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="lg" mb={1}>Team</Heading>
                  <Text color={mutedTextColor}>Accounts with the TradeXTV role.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">Role: tradextv</Tag>
              </Flex>
              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Username</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {usersLoading ? (
                      <Tr>
                        <Td colSpan={5}>
                          <Text color={mutedTextColor}>Loading team...</Text>
                        </Td>
                      </Tr>
                    ) : usersError ? (
                      <Tr>
                        <Td colSpan={5}>
                          <Text color={negativeTextColor}>Failed to load users.</Text>
                        </Td>
                      </Tr>
                    ) : tradextvUsers.length === 0 ? (
                      <Tr>
                        <Td colSpan={5}>
                          <Text color={mutedTextColor}>No TradeXTV accounts found.</Text>
                        </Td>
                      </Tr>
                    ) : (
                      tradextvUsers.map((u) => (
                        <Tr key={u._id || u.username}>
                          <Td fontWeight="semibold">{u.name || u.username || '???'}</Td>
                          <Td>{u.username || '???'}</Td>
                          <Td>{u.email || '???'}</Td>
                          <Td>
                            <Badge colorScheme="purple" variant="subtle">
                              {u.role || '???'}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={(u.status || '').toLowerCase() === 'active' ? 'green' : 'gray'}
                              variant="subtle"
                            >
                              {u.status || 'unknown'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>

          {/* Analytics Tab */}
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
              <Heading size="lg" mb={6}>Analytics Dashboard</Heading>
              <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
                <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
                  <Stat>
                    <StatLabel color={sectionTextColor}>Projects (Total)</StatLabel>
                    <StatNumber>{projectMetrics.total}</StatNumber>
                  </Stat>
                </Box>
                <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
                  <Stat>
                    <StatLabel color={sectionTextColor}>Completed</StatLabel>
                    <StatNumber color={positiveTextColor}>{projectMetrics.completed}</StatNumber>
                    <StatHelpText>{projectMetrics.completionRate}% done</StatHelpText>
                  </Stat>
                </Box>
                <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
                  <Stat>
                    <StatLabel color={sectionTextColor}>In Progress</StatLabel>
                    <StatNumber color={accentIconColor}>{projectMetrics.inProgress}</StatNumber>
                  </Stat>
                </Box>
                <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
                  <Stat>
                    <StatLabel color={sectionTextColor}>In Review</StatLabel>
                    <StatNumber color={warningTextColor}>{projectMetrics.review}</StatNumber>
                  </Stat>
                </Box>
              </Grid>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box 
                  bg={cardBg}
                  p={6}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  color={cardTextColor}
                >
                  <Text fontWeight="medium" mb={4}>Ticket Volume</Text>
                  <Box bg={placeholderBg} h="300px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
                    <Text color={mutedTextColor}>Ticket volume chart will be displayed here</Text>
                  </Box>
                </Box>
                <Box 
                  bg={cardBg}
                  p={6}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  color={cardTextColor}
                >
                  <Text fontWeight="medium" mb={4}>Response Times</Text>
                  <Box bg={placeholderBg} h="300px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
                    <Text color={mutedTextColor}>Response time metrics will be displayed here</Text>
                  </Box>
                </Box>
              </Grid>
            </Box>
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
            <Box 
              bg={cardBg}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
              mb={8}
            >
              <Heading size="lg" mb={2}>Revenue</Heading>
              <Text color={sectionTextColor} mb={6}>
                Targets and actuals at a glance, including current-month pacing.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={6}>
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4}>
                  <Text fontWeight="semibold" mb={3}>Revenue vs target</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Metric</Th>
                        <Th>Target</Th>
                        <Th>Actual</Th>
                        <Th>Delta</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {revenueReportRows.map((row) => {
                        const diff = row.actual - row.target;
                        const pct = row.target ? (diff / row.target) * 100 : 0;
                        const isPositive = diff >= 0;
                        return (
                          <Tr key={row.metric}>
                            <Td>{row.metric}</Td>
                            <Td>{currencyFormatter.format(row.target)}</Td>
                            <Td>{currencyFormatter.format(row.actual)}</Td>
                            <Td>
                              <Tag colorScheme={isPositive ? 'green' : 'orange'} variant="subtle">
                                {`${isPositive ? '+' : ''}${pct.toFixed(1)}%`}
                              </Tag>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
                    {revenueSummaryCards.map((item) => (
                        <Box
                          key={item.label}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          bg={cardBg}
                          p={4}
                          boxShadow="sm"
                          color={cardTextColor}
                        >
                        <Stat>
                          <StatLabel color={sectionTextColor}>{item.label}</StatLabel>
                          <StatNumber fontSize="2xl">
                            {item.isCurrency ? currencyFormatter.format(item.value) : item.value}
                          </StatNumber>
                          <StatHelpText color={item.change.startsWith('-') ? negativeTextColor : positiveTextColor}>
                            {item.change}
                          </StatHelpText>
                        </Stat>
                      </Box>
                    ))}
                  </Grid>
                  <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={4} color={cardTextColor}>
                    <Text fontWeight="semibold" mb={2}>Pacing to target</Text>
                    <Text fontSize="sm" color={sectionTextColor} mb={2}>MTD revenue vs monthly plan</Text>
                    {(() => {
                      const target = revenueReportRows[0].target;
                      const actual = revenueReportRows[0].actual;
                      const progress = target ? (actual / target) * 100 : 0;
                      const deltaPct = target ? ((actual - target) / target) * 100 : 0;
                      const hit = actual >= target;
                      return (
                        <>
                          <Progress
                            value={Math.min(progress, 160)}
                            size="sm"
                            colorScheme={hit ? 'green' : 'purple'}
                            borderRadius="full"
                            mb={1.5}
                          />
                          <Flex justify="space-between" fontSize="sm" color={sectionTextColor}>
                            <Text>{currencyFormatter.format(actual)} actual</Text>
                            <Text>{currencyFormatter.format(target)} target</Text>
                          </Flex>
                          <Text fontSize="xs" color={deltaPct >= 0 ? positiveTextColor : warningTextColor} mt={1}>
                            {deltaPct >= 0 ? '+' : ''}
                            {deltaPct.toFixed(1)}% vs target
                          </Text>
                        </>
                      );
                    })()}
                  </Box>
                  <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={4} color={cardTextColor}>
                    <Text fontWeight="semibold" mb={3}>Update actuals</Text>
                    <VStack spacing={3} align="stretch">
                    <FormControl size="sm">
                      <FormLabel fontSize="sm">Metric</FormLabel>
                      <Select
                        size="sm"
                        value={actualForm.metric}
                        onChange={(e) => {
                          const metric = e.target.value;
                          const currentTarget =
                            revenueReportRows.find((row) => row.metric === metric)?.target || '';
                          setActualForm((p) => ({ ...p, metric, target: currentTarget }));
                        }}
                      >
                        {revenueReportRows.map((row) => (
                          <option key={row.metric} value={row.metric}>{row.metric}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="sm">
                      <FormLabel fontSize="sm">Target amount</FormLabel>
                      <Input
                        size="sm"
                        type="number"
                        value={actualForm.target}
                        onChange={(e) => setActualForm((p) => ({ ...p, target: e.target.value }))}
                        placeholder="Enter target"
                      />
                    </FormControl>
                    <FormControl size="sm">
                      <FormLabel fontSize="sm">Actual amount</FormLabel>
                      <Input
                        size="sm"
                        type="number"
                        value={actualForm.actual}
                        onChange={(e) => setActualForm((p) => ({ ...p, actual: e.target.value }))}
                        placeholder="Enter actual"
                      />
                    </FormControl>
                      <Button colorScheme="purple" size="sm" onClick={handleUpdateActual} isDisabled={!actualForm.actual}>
                        Save actual
                      </Button>
                      <Text fontSize="xs" color={mutedTextColor}>
                        Updates the dashboard locally; connect to your API to persist.
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </Grid>
              <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4} mt={6}>
                <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={3}>
                  <Heading size="md">Department KPIs</Heading>
                  <Tag colorScheme="purple" variant="subtle">Monthly view</Tag>
                </Flex>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Department</Th>
                      <Th>Revenue</Th>
                      <Th>Attainment</Th>
                      <Th>Followers</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {departmentKpis.map((dept) => {
                      const revenueDiff = dept.revenueActual - dept.revenueTarget;
                      const revenuePct = dept.revenueTarget ? (revenueDiff / dept.revenueTarget) * 100 : 0;
                      const followerDiff = dept.followersActual - dept.followersTarget;
                      const followerPct = dept.followersTarget ? (followerDiff / dept.followersTarget) * 100 : 0;
                      return (
                        <Tr key={dept.department}>
                          <Td fontWeight="semibold">{dept.department}</Td>
                          <Td>
                            <Flex direction="column" gap={0.5}>
                              <Text>{currencyFormatter.format(dept.revenueActual)}</Text>
                              <Text fontSize="xs" color={mutedTextColor}>Target {currencyFormatter.format(dept.revenueTarget)}</Text>
                            </Flex>
                          </Td>
                          <Td>
                            <Tag colorScheme={revenuePct >= 0 ? 'green' : 'orange'} variant="subtle">
                              {`${revenuePct >= 0 ? '+' : ''}${revenuePct.toFixed(1)}%`}
                            </Tag>
                          </Td>
                          <Td>
                            <VStack spacing={1} align="stretch">
                              <Flex justify="space-between" fontSize="sm">
                                <Text>{dept.followersActual.toLocaleString()}</Text>
                                <Text color={mutedTextColor}>/ {dept.followersTarget.toLocaleString()}</Text>
                              </Flex>
                              <Progress
                                value={Math.min((dept.followersActual / Math.max(dept.followersTarget, 1)) * 100, 160)}
                                size="xs"
                                colorScheme={dept.followersActual >= dept.followersTarget ? 'green' : 'purple'}
                                borderRadius="full"
                              />
                              <Text fontSize="xs" color={followerPct >= 0 ? positiveTextColor : warningTextColor}>
                                {followerPct >= 0 ? '+' : ''}
                                {followerPct.toFixed(1)}% vs target
                              </Text>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>

            </Box>
          </TabPanel>

          {/* Report Tab */}
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
              <Heading size="lg" mb={6}>Report</Heading>
              <Text color={sectionTextColor} mb={6}>
                Revenue snapshot plus social media follower tracking against monthly targets.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4}>
                  <Text fontWeight="semibold" mb={3}>Revenue vs target</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Metric</Th>
                        <Th>Target</Th>
                        <Th>Actual</Th>
                        <Th>Delta</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {revenueReportRows.map((row) => {
                        const diff = row.actual - row.target;
                        const pct = row.target ? (diff / row.target) * 100 : 0;
                        const isPositive = diff >= 0;
                        return (
                          <Tr key={row.metric}>
                            <Td>{row.metric}</Td>
                            <Td>{currencyFormatter.format(row.target)}</Td>
                            <Td>{currencyFormatter.format(row.actual)}</Td>
                            <Td>
                              <Tag colorScheme={isPositive ? 'green' : 'orange'} variant="subtle">
                                {`${isPositive ? '+' : ''}${pct.toFixed(1)}%`}
                              </Tag>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4}>
                  <Text fontWeight="semibold" mb={3}>Social media followers</Text>
                  <VStack spacing={3} align="stretch">
                    {socialTargets.map((item) => {
                      const progress = item.target ? (item.actual / item.target) * 100 : 0;
                      const deltaPct = item.target ? ((item.actual - item.target) / item.target) * 100 : 0;
                      const hit = item.actual >= item.target;
                      return (
                        <Box key={item.platform} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3} bg={cardBg} color={cardTextColor}>
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="semibold">{item.platform}</Text>
                            <Tag size="sm" colorScheme={hit ? 'green' : 'orange'} variant="subtle">
                              {hit ? 'On track' : 'Behind target'}
                            </Tag>
                          </Flex>
                          <Flex justify="space-between" fontSize="sm" color={sectionTextColor} mb={1}>
                            <Text>Actual: {item.actual.toLocaleString()}/mo</Text>
                            <Text>Target: {item.target.toLocaleString()}/mo</Text>
                          </Flex>
                          <Progress
                            value={Math.min(progress, 140)}
                            size="sm"
                            colorScheme={hit ? 'green' : 'blue'}
                            borderRadius="full"
                          />
                          <Text fontSize="xs" color={deltaPct >= 0 ? positiveTextColor : warningTextColor} mt={1}>
                            {deltaPct >= 0 ? '+' : ''}
                            {deltaPct.toFixed(1)}% vs target
                          </Text>
                        </Box>
                      );
                    })}
                  </VStack>
                  <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3} mt={4} color={cardTextColor}>
                    <Text fontWeight="semibold" mb={2}>Update social actuals</Text>
                    <VStack spacing={2.5} align="stretch">
                      <FormControl size="sm">
                        <FormLabel fontSize="sm">Platform</FormLabel>
                        <Select
                          size="sm"
                          value={socialForm.platform}
                          onChange={(e) => {
                            const platform = e.target.value;
                            const currentTarget =
                              socialTargets.find((item) => item.platform === platform)?.target || '';
                            setSocialForm((p) => ({ ...p, platform, target: currentTarget }));
                          }}
                        >
                          {socialTargets.map((item) => (
                            <option key={item.platform} value={item.platform}>{item.platform}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="sm">
                        <FormLabel fontSize="sm">Target followers / mo</FormLabel>
                        <Input
                          size="sm"
                          type="number"
                          value={socialForm.target}
                          onChange={(e) => setSocialForm((p) => ({ ...p, target: e.target.value }))}
                          placeholder="Enter target"
                        />
                      </FormControl>
                      <FormControl size="sm">
                        <FormLabel fontSize="sm">Actual followers / mo</FormLabel>
                        <Input
                          size="sm"
                          type="number"
                          value={socialForm.actual}
                          onChange={(e) => setSocialForm((p) => ({ ...p, actual: e.target.value }))}
                          placeholder="Enter actual"
                        />
                      </FormControl>
                      <Button colorScheme="purple" size="sm" onClick={handleUpdateSocial} isDisabled={!socialForm.actual}>
                        Save social actual
                      </Button>
                      <Text fontSize="xs" color={mutedTextColor}>
                        Updates the dashboard locally; connect to your API to persist.
                      </Text>
                    </VStack>
                  </Box>
                </Box>
              </Grid>
              <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4} mt={6}>
                <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={3}>
                  <Box>
                    <Heading size="md">Monthly social media</Heading>
                    <Text fontSize="sm" color={sectionTextColor}>Filter by month and year; defaults to today.</Text>
                  </Box>
                  <Tag colorScheme="purple" variant="subtle">
                    {monthFilter === 'All' ? 'All months' : monthFilter} {yearFilter}
                  </Tag>
                </Flex>
                <Flex gap={3} wrap="wrap" mb={3}>
                  <FormControl maxW="200px" size="sm">
                    <FormLabel fontSize="sm">Month</FormLabel>
                    <Select
                      size="sm"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      {monthNames.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl maxW="160px" size="sm">
                    <FormLabel fontSize="sm">Year</FormLabel>
                    <Select
                      size="sm"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    >
                      {[today.getFullYear(), today.getFullYear() + 1].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Select>
                  </FormControl>
                </Flex>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Month</Th>
                      <Th>Year</Th>
                      <Th>Platform</Th>
                      <Th>Target</Th>
                      <Th>Actual</Th>
                      <Th>Delta</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {socialTargets.flatMap((platform) => {
                      const monthsToShow = monthFilter === 'All' ? monthNames : [monthFilter];
                      return monthsToShow.map((month) => {
                        const base = platform.target;
                        const actual = platform.actual; // placeholder; ideally per-month
                        const pct = base ? ((actual - base) / base) * 100 : 0;
                        const positive = actual >= base;
                        return (
                          <Tr key={`${platform.platform}-${month}-${yearFilter}`}>
                            <Td fontWeight="semibold">{month}</Td>
                            <Td>{yearFilter}</Td>
                            <Td>{platform.platform}</Td>
                            <Td>{base.toLocaleString()}</Td>
                            <Td>{actual.toLocaleString()}</Td>
                            <Td>
                              <Tag colorScheme={positive ? 'green' : 'orange'} variant="subtle">
                                {`${positive ? '+' : ''}${pct.toFixed(1)}%`}
                              </Tag>
                            </Td>
                          </Tr>
                        );
                      });
                    })}
                  </Tbody>
                </Table>
              </Box>
            </Box>
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
            <Box 
              bg={cardBg}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="lg" mb={6} color={sectionHeadingColor}>
                Settings
              </Heading>
              <Text mb={4} color={sectionTextColor}>
                Configure your dashboard preferences and notification settings.
              </Text>
              <Box 
                bg={cardBg} 
                p={6} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor={borderColor}
                mt={6}
                color={cardTextColor}
              >
                <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight="medium">Service types</Text>
                    <Text fontSize="sm" color={sectionTextColor}>Add or manage the deliverables your team offers.</Text>
                  </Box>
                  <Flex gap={2} wrap="wrap" align="center">
                    <Input
                      size="sm"
                    placeholder="Add a new service"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    maxW="260px"
                    color={serviceInputTextColor}
                    _placeholder={{ color: serviceInputPlaceholderColor }}
                    />
                    <Button size="sm" colorScheme="purple" onClick={handleAddServiceType} isDisabled={!newServiceName.trim() || isLoadingServices} isLoading={isLoadingServices}>
                      Add service
                    </Button>
                    {isLoadingServices && (
                      <Tag size="sm" colorScheme="purple" variant="subtle">Updating...</Tag>
                    )}
                  </Flex>
                </Flex>
                <Flex gap={2} flexWrap="wrap">
                  {serviceOptions.map((service) => (
                    <Tag
                      key={service}
                      size="md"
                      colorScheme="purple"
                      variant="subtle"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Text>{service}</Text>
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveServiceType(service)}>
                        Remove
                      </Button>
                    </Tag>
                  ))}
                  {serviceOptions.length === 0 && (
                    <Text color={mutedTextColor} fontSize="sm">No services yet. Add your first one above.</Text>
                  )}
                </Flex>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
        </Box>
      </Flex>

      <Modal isOpen={isProjectModalOpen} onClose={handleProjectModalClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Project name</FormLabel>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Launch video sprint"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Owner</FormLabel>
                <Input
                  value={projectForm.owner}
                  onChange={(e) => setProjectForm((p) => ({ ...p, owner: e.target.value }))}
                  placeholder="Who owns it?"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Scope, deliverables, or notes for the team"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Due date</FormLabel>
                <Input
                  type="date"
                  value={projectForm.dueDate}
                  onChange={(e) => setProjectForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleProjectModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleAddProject}
              isDisabled={!projectForm.name.trim() || !projectForm.owner.trim() || !projectForm.dueDate}
            >
              Save project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isNewCustomerOpen} onClose={handleCloseNewCustomer} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New customer follow-up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Customer name</FormLabel>
                <Input
                  value={newCustomerForm.customer}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, customer: e.target.value }))}
                  placeholder="e.g., New marketplace seller"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Request / brief</FormLabel>
                <Input
                  value={newCustomerForm.subject}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="What is the customer asking for?"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Services needed</FormLabel>
                <CheckboxGroup
                  value={newCustomerForm.services}
                  onChange={(values) => setNewCustomerForm((p) => ({ ...p, services: values }))}
                >
                  <Stack spacing={2} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
                    {serviceOptions.map((service) => (
                      <Checkbox key={service} value={service}>
                        {service}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={newCustomerForm.status}
                    onChange={(e) => setNewCustomerForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={newCustomerForm.priority}
                    onChange={(e) => setNewCustomerForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Follow-up date</FormLabel>
                  <Input
                    type="date"
                    value={newCustomerForm.date}
                    onChange={(e) => setNewCustomerForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Context for the creative team (links, goals, etc.)"
                />
              </FormControl>
            </VStack>
          </ModalBody>

      <ModalFooter>
        <Button variant="ghost" mr={3} onClick={handleCloseNewCustomer}>
          Cancel
        </Button>
        <Button
          colorScheme="purple"
          onClick={handleNewCustomerSubmit}
          isDisabled={!newCustomerForm.customer.trim() || isSavingFollowup}
          isLoading={isSavingFollowup}
        >
          Add customer
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>

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

// Custom Error Boundary
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

// Wrapper Component with Error Boundary
export default function TradexTVDashboardWrapper() {
  return (
    <ErrorBoundary>
      <TradexTVDashboard />
    </ErrorBoundary>
  );
}

