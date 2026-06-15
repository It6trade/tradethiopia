import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Input,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Button,
  Checkbox,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stack,
  HStack,
  VStack,
  Badge,
  Progress,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  useToast,
  Spinner,
  StackDivider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiMoreVertical,
  FiDownload,
  FiShare2,
  FiPrinter,
  FiClock,
  FiAlertTriangle,
  FiCheck
} from 'react-icons/fi';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { getDashboardStats, getSalesForecast, getTeamPerformance, getAllAgents } from '../../services/salesManagerService';
import { getPendingReceptionCustomers, assignCustomerToAgent } from '../../services/salesWorkflowService';
import { getTasksForManager, getTaskStats } from '../../services/taskService';
import { useUserStore } from '../../store/user';
import { fetchContentTrackerEntries } from '../../services/contentTrackerService';
import CompletedSalesTable from './CompletedSalesTable';
import {
  buildMonthKey,
  getMonthRange,
  normalizeTrackerResponse,
  normalizeAgentKey,
  summarizeEntriesByAgent,
  mapSummariesByKey,
  BONUS_AMOUNT,
} from '../../utils/contentTrackerTargets';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Get priority color
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'orange';
    case 'Low': return 'green';
    default: return 'gray';
  }
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'green';
    case 'In Progress': return 'blue';
    case 'Pending': return 'yellow';
    case 'Cancelled': return 'red';
    default: return 'gray';
  }
};

// Generate mock forecast data if API fails
const generateMockForecast = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const forecastMonths = months.slice(0, 12);
  
  const actualData = Array(12).fill(0).map((_, i) => 
    Math.floor(Math.random() * 100000) + 50000
  );
  
  const forecastData = actualData.map((val, i) => 
    i <= currentMonth ? val : Math.floor(val * (0.9 + Math.random() * 0.3))
  );
  
  return {
    labels: forecastMonths,
    actual: actualData,
    forecast: forecastData,
    confidence: forecastData.map(() => Math.floor(Math.random() * 30) + 70)
  };
};

const getCurrentWeekRange = (referenceDate = new Date()) => {
  const day = referenceDate.getDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(referenceDate);
  start.setDate(referenceDate.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Debug wrapper component (removed)
// const DebugWrapper = ({ children }) => {
//   console.log('DebugWrapper rendered');
//   return children;
// };

const SalesManagerDashboard = () => {
  console.log('SalesManagerDashboard component rendering...');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Get current user from store
  const currentUser = useUserStore((state) => state.currentUser);
  const toast = useToast();
  console.log('Current user in dashboard:', currentUser);
  console.log('User role:', currentUser?.role);
  console.log('LocalStorage userRole:', localStorage.getItem('userRole'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [weeklyView, setWeeklyView] = useState(true);
  const timeRange = weeklyView ? 'week' : 'month';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalDeals: 0,
    closedDeals: 0,
    totalRevenue: 0,
    revenueTarget: 500000,
    monthlyGrowth: 0,
    quarterlyGrowth: 0,
    ytdGrowth: 0
  });
  
  const [forecastData, setForecastData] = useState({
    labels: [],
    actual: [],
    forecast: [],
    confidence: []
  });
  
  const [teamPerformance, setTeamPerformance] = useState({ agentPerformance: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assigningCustomerId, setAssigningCustomerId] = useState(null);
  const [agentRoster, setAgentRoster] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [error, setError] = useState(null);
  const [weeklyContentCounts, setWeeklyContentCounts] = useState({});
  const [weeklyContentLoading, setWeeklyContentLoading] = useState(false);
  const [weeklyContentError, setWeeklyContentError] = useState(null);
  const [contentMonth, setContentMonth] = useState(buildMonthKey());
  const [contentSummaries, setContentSummaries] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const chartRef = useRef(null);
  const navigate = useNavigate();
  const initialContentLoadRef = useRef(true);
  const contentSummaryMap = useMemo(() => mapSummariesByKey(contentSummaries), [contentSummaries]);
  const contentBonusTotal = useMemo(
    () => contentSummaries.reduce((sum, summary) => sum + (summary.bonusAmount || 0), 0),
    [contentSummaries],
  );

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: true, md: true, lg: false });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: useColorModeValue('#4A5568', '#E2E8F0'),
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: useColorModeValue('white', '#2D3748'),
        titleColor: useColorModeValue('#2D3748', '#E2E8F0'),
        bodyColor: useColorModeValue('#4A5568', '#CBD5E0'),
        borderColor: useColorModeValue('#E2E8F0', '#4A5568'),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')
        },
        ticks: {
          color: useColorModeValue('#4A5568', '#A0AEC0')
        }
      },
      y: {
        grid: {
          color: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')
        },
        ticks: {
          color: useColorModeValue('#4A5568', '#A0AEC0'),
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Sales forecast chart data
  const salesChartData = {
    labels: forecastData.labels,
    datasets: [
      {
        label: 'Actual Sales',
        data: forecastData.actual,
        borderColor: primaryColor,
        backgroundColor: useColorModeValue('rgba(66, 153, 225, 0.1)', 'rgba(66, 153, 225, 0.2)'),
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Forecast',
        data: forecastData.forecast,
        borderColor: warningColor,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
      }
    ]
  };

  // Team performance chart data
  const teamPerformanceData = {
    labels: teamPerformance?.agentPerformance?.map(agent => agent.fullName || agent.username) || [],
    datasets: [
      {
        label: 'Deals Closed',
        data: teamPerformance?.agentPerformance?.map(agent => agent.completedDeals) || [],
        backgroundColor: [
          'rgba(66, 153, 225, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(246, 173, 85, 0.8)',
          'rgba(229, 62, 62, 0.8)',
          'rgba(159, 122, 234, 0.8)'
        ],
        borderColor: [
          'rgba(66, 153, 225, 1)',
          'rgba(72, 187, 120, 1)',
          'rgba(246, 173, 85, 1)',
          'rgba(229, 62, 62, 1)',
          'rgba(159, 122, 234, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Debug log when component mounts
  const applyStatsFallback = () => {
    setStats({
      totalAgents: 12,
      activeAgents: 9,
      totalCustomers: 1287,
      newCustomers: 42,
      totalDeals: 356,
      closedDeals: 243,
      totalTeamGrossCommission: 1256800,
      revenueTarget: 1500000,
      monthlyGrowth: 8.5,
      quarterlyGrowth: 22.3,
      ytdGrowth: 45.7
    });
  };

  const fetchAgentRoster = useCallback(async () => {
    try {
      const roster = await getAllAgents();
      setAgentRoster(Array.isArray(roster) ? roster : []);
    } catch (error) {
      console.error('Error loading agent roster:', error);
    }
  }, []);

  const fetchPendingAssignments = useCallback(async () => {
    setAssignmentLoading(true);
    try {
      const data = await getPendingReceptionCustomers();
      setPendingAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
    } finally {
      setAssignmentLoading(false);
    }
  }, []);

  const handleAssigneeChange = (customerId, agentId) => {
    setSelectedAssignees((prev) => ({
      ...prev,
      [customerId]: agentId
    }));
  };

  const handleAssign = async (customerId) => {
    const agentId = selectedAssignees[customerId];
    if (!agentId) {
      toast({
        title: 'Agent required',
        description: 'Please pick an agent before assigning.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setAssigningCustomerId(customerId);
    try {
      await assignCustomerToAgent(customerId, agentId);
      toast({
        title: 'Customer assigned',
        description: 'The sales agent will be notified shortly.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setSelectedAssignees((prev) => ({
        ...prev,
        [customerId]: ''
      }));
      fetchPendingAssignments();
      await fetchDashboardStats();
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: error.response?.data?.message || 'Unable to assign this customer.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setAssigningCustomerId(null);
    }
  };

  const loadWeeklyContentCounts = useCallback(async () => {
    setWeeklyContentLoading(true);
    setWeeklyContentError(null);
    try {
      const { start, end } = getCurrentWeekRange();
      const response = await fetchContentTrackerEntries({
        approved: true,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString()
      });
      const entries = normalizeTrackerResponse(response);
      const counts = entries.reduce((acc, entry) => {
        const creator = entry?.createdBy;
        const key = normalizeAgentKey(creator);
        if (!key) return acc;
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            name: creator?.fullName || creator?.username || 'Unknown'
          };
        }
        acc[key].count += 1;
        return acc;
      }, {});
      setWeeklyContentCounts(counts);
    } catch (err) {
      console.error('Error fetching weekly content counts:', err);
      setWeeklyContentError('Unable to load weekly approved posts.');
    } finally {
      setWeeklyContentLoading(false);
    }
  }, []);

  const loadContentSummaries = useCallback(async () => {
    setContentLoading(true);
    setContentError(null);
    try {
      const range = getMonthRange(contentMonth);
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
      const summaries = summarizeEntriesByAgent(entries, contentMonth);
      setContentSummaries(summaries);
      return summaries;
    } catch (err) {
      console.error('Error fetching monthly content summaries:', err);
      setContentError('Unable to load monthly content completion data.');
      setContentSummaries([]);
      return [];
    } finally {
      setContentLoading(false);
    }
  }, [contentMonth]);

  const fetchAllData = useCallback(async () => {
    console.log('Starting data fetch...');
    console.log('Weekly view:', weeklyView, 'timeRange:', timeRange);
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchDashboardStats(),
        fetchSalesForecast(),
        fetchTeamPerformance(),
        fetchAgentData(),
        fetchRecentActivities(),
        fetchTaskData(),
        loadWeeklyContentCounts(),
        loadContentSummaries(),
        fetchAgentRoster(),
        fetchPendingAssignments()
      ]);
    } catch (err) {
      // soften the failure: use mock data and keep page usable
      const message = err?.response?.status === 404
        ? 'Data not available yet; showing sample data.'
        : 'Failed to load dashboard data. ' + (err.message || '');
      setError(message);
      console.error('Error loading dashboard data:', err);
      applyStatsFallback();
      setForecastData(generateMockForecast());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [weeklyView, fetchAgentRoster, fetchPendingAssignments, loadWeeklyContentCounts, loadContentSummaries]);

  useEffect(() => {
    console.log('SalesManagerDashboard mounted or updated');
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (initialContentLoadRef.current) {
      initialContentLoadRef.current = false;
      return;
    }
    loadContentSummaries();
  }, [contentMonth, loadContentSummaries]);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Fetching dashboard stats...');
      console.log('Token:', localStorage.getItem('userToken')?.substring(0, 20) + '...');
      const data = await getDashboardStats();
      console.log('✅ Dashboard stats received:', data);
      setStats(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      console.error('Error details:', err.response?.data || err.message);
      applyStatsFallback();
      // Propagate only for non-404 to avoid breaking UX when endpoints are missing
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  };

  // Fetch sales forecast data
  const fetchSalesForecast = async () => {
    try {
      const data = await getSalesForecast({ range: timeRange });
      setForecastData(data);
    } catch (err) {
      console.error('Error fetching sales forecast:', err);
      // Fallback to mock data
      setForecastData(generateMockForecast());
    }
  };

  // Fetch team performance data
  const fetchTeamPerformance = async () => {
    try {
      const data = await getTeamPerformance(timeRange);
      setTeamPerformance(data);
    } catch (err) {
      console.error('Error fetching team performance:', err);
      // Mock team performance data
      setTeamPerformance([
        { id: 1, name: 'John D.', dealsClosed: 42, target: 50, revenue: 125000 },
        { id: 2, name: 'Sarah M.', dealsClosed: 38, target: 45, revenue: 118000 },
        { id: 3, name: 'Mike T.', dealsClosed: 35, target: 40, revenue: 98500 },
        { id: 4, name: 'Emma L.', dealsClosed: 31, target: 40, revenue: 87500 },
        { id: 5, name: 'David K.', dealsClosed: 28, target: 35, revenue: 78500 }
      ]);
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  };

  // Fetch agent data with commissions
  const fetchAgentData = async () => {
    try {
      const agentData = await getTeamPerformance(timeRange);
      // Update teamPerformance with agent data if it doesn't already contain it
      setTeamPerformance(prev => ({
        ...prev,
        agentPerformance: agentData.agentPerformance
      }));
    } catch (err) {
      console.error('Error fetching agent data:', err);
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      // This would be an API call in a real app
      // const data = await getRecentActivities();
      // Mock data for now
      const mockActivities = [
        { id: 1, type: 'sale', user: 'John D.', details: 'Closed deal with Acme Corp', amount: 12500, timestamp: '2023-11-15T14:32:00Z' },
        { id: 2, type: 'customer', user: 'Sarah M.', details: 'New lead from website', amount: null, timestamp: '2023-11-15T13:45:00Z' },
        { id: 3, type: 'deal', user: 'Mike T.', details: 'Deal in progress - follow up scheduled', amount: 8500, timestamp: '2023-11-15T11:20:00Z' },
        { id: 4, type: 'sale', user: 'Emma L.', details: 'Renewal contract signed', amount: 3200, timestamp: '2023-11-15T10:15:00Z' },
        { id: 5, type: 'meeting', user: 'David K.', details: 'Product demo with TechStart Inc', amount: null, timestamp: '2023-11-15T09:30:00Z' },
        { id: 6, type: 'task', user: 'System', details: 'Task assigned: Follow up with potential clients', amount: null, timestamp: '2023-11-15T08:45:00Z' },
        { id: 7, type: 'task', user: 'System', details: 'Task deadline approaching: Prepare quarterly report', amount: null, timestamp: '2023-11-15T08:30:00Z' }
      ];
      setRecentActivities(mockActivities);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    }
  };

  // Fetch task data
  const fetchTaskData = async () => {
    try {
      // Fetch tasks assigned by the current sales manager
      const tasksResponse = await getTasksForManager();
      
      // Process tasks to include agent names
      const processedTasks = tasksResponse.map(task => ({
        ...task,
        assignedToName: task.assignedTo?.username || 'Unknown Agent',
        assignedByName: task.assignedBy?.username || 'Unknown Manager'
      }));
      
      setTasks(processedTasks);
      
      // Get task statistics
      const statsResponse = await getTaskStats();
      setTaskStats(statsResponse);
    } catch (err) {
      console.error('Error fetching task data:', err);
      // Set default empty values
      setTasks([]);
      setTaskStats({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0
      });
    }
  };
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
  };

  // Calculate progress percentage
  const progressPercentage = Math.min(Math.round((stats.totalTeamGrossCommission / (stats.revenueTarget || 1)) * 100), 100);

  const getWeeklyPostCount = (agent) => {
    const key = normalizeAgentKey(agent);
    if (!key) return 0;
    return weeklyContentCounts[key]?.count ?? 0;
  };

  console.log('Rendering dashboard with state:', { loading, error, stats });

  if (loading && !isRefreshing) {
    console.log('Loading state: true');
    return (
      <Flex justify="center" align="center" minH="300px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading dashboard data...</Text>
          <Text fontSize="sm" color="gray.500">If this takes too long, please check your connection</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    console.error('Error in SalesManagerDashboard:', error);
    return (
      <Box bg="red.50" p={6} borderRadius="lg" mb={4}>
        <VStack spacing={3} align="stretch">
          <Heading size="md" color="red.600">Error Loading Dashboard</Heading>
          <Text color="red.700">{error}</Text>
          <Button 
            leftIcon={<FiRefreshCw />} 
            colorScheme="red" 
            variant="outline"
            onClick={handleRefresh}
            alignSelf="flex-start"
          >
            Retry
          </Button>
        </VStack>
      </Box>
    );
  }

  // Stat cards data
  const statCards = [
    {
      title: 'Total Agents',
      value: stats.totalAgents,
      icon: FiUsers,
      color: 'teal'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'Completed Deals',
      value: stats.totalCompletedDeals,
      icon: FiUserCheck,
      color: 'green'
    },
    {
      title: 'Total Gross Commission',
      value: `ETB ${(stats.totalTeamGrossCommission || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'purple'
    },
    {
      title: 'Content Bonus Pool',
      value: `ETB ${(contentBonusTotal || 0).toLocaleString()}`,
      icon: FiShare2,
      color: 'orange'
    }
  ];

  return (
      <Box p={{ base: 3, md: 4 }} bg={bgColor} minHeight="100vh">
  <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
    <Heading 
      as="h1" 
      size={{ base: "md", md: "lg" }}
      color={textColor}
      fontWeight="semibold"
    >
      Sales Dashboard
    </Heading>
    <HStack spacing={3} align="flex-end">
      <Input
        type="month"
        size="sm"
        value={contentMonth}
        onChange={(event) => setContentMonth(event.target.value)}
        max={buildMonthKey()}
        w="150px"
      />
      <Button 
        size="sm" 
        colorScheme="blue" 
        variant="ghost" 
        leftIcon={<FiRefreshCw size={16} />}
        onClick={handleRefresh}
        isLoading={isRefreshing}
      >
        Refresh
      </Button>
      {contentLoading && <Spinner size="xs" />}
    </HStack>
  </Flex>
  {contentError && (
    <Text fontSize="sm" color="red.500" mb={4}>
      {contentError}
    </Text>
  )}

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
          {statCards.map((card, index) => (
            <Card 
              key={index} 
              bg={cardBg} 
              boxShadow="sm" 
              borderRadius="lg"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
            >
              <CardBody p={3}>
                <Flex direction="column" align="center" textAlign="center">
                  <Flex
                    align="center"
                    justify="center"
                    w={8}
                    h={8}
                    mb={2}
                    rounded="lg"
                    bg={`${card.color}.100`}
                    color={`${card.color}.600`}
                  >
                    <Icon as={card.icon} boxSize={4} />
                  </Flex>
                  <Text 
                    fontSize="xs"
                    fontWeight="medium" 
                    color="gray.500"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={0.5}
                  >
                    {card.title}
                  </Text>
                  <Text
                    fontSize={{ base: "lg", md: "xl" }} 
                    fontWeight="bold" 
                    color={useColorModeValue('gray.800', 'white')}
                    lineHeight="shorter"
                  >
                    {card.value}
                  </Text>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Task Summary Section */}
        <Card 
          bg={cardBg}
          borderWidth="1px"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          boxShadow="sm"
          borderRadius="lg"
          mb={4}
        >
          <CardHeader pb={2}>
            <Flex justify="space-between" align="center">
              <Heading size="sm" color={textColor}>
                Task Overview
              </Heading>
              <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => navigate('/salesmanager/tasks')}>
                View All Tasks
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
              <Stat>
                <StatLabel fontSize="xs">Total Tasks</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold">{taskStats.totalTasks}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Completed</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="green.500">{taskStats.completedTasks}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Pending</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="yellow.500">{taskStats.pendingTasks}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Overdue</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="red.500">{taskStats.overdueTasks}</StatNumber>
              </Stat>
            </SimpleGrid>
            
            {tasks.length > 0 ? (
              <Box maxH="200px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th px={2} py={1} fontSize="xs">Task</Th>
                      <Th px={2} py={1} fontSize="xs">Assigned To</Th>
                      <Th px={2} py={1} fontSize="xs">Status</Th>
                      <Th px={2} py={1} fontSize="xs">Due Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tasks.slice(0, 5).map((task) => (
                      <Tr key={task._id}>
                        <Td px={2} py={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{task.title}</Text>
                        </Td>
                        <Td px={2} py={1}>
                          <Text fontSize="sm">{task.assignedToName}</Text>
                        </Td>
                        <Td px={2} py={1}>
                          <Badge fontSize="xs" colorScheme={
                            task.status === 'Completed' ? 'green' : 
                            task.status === 'In Progress' ? 'blue' : 
                            task.status === 'Pending' ? 'yellow' : 'red'
                          }>
                            {task.status}
                          </Badge>
                        </Td>
                        <Td px={2} py={1}>
                          <Text fontSize="sm">{new Date(task.dueDate).toLocaleDateString()}</Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No tasks assigned yet
              </Text>
            )}
          </CardBody>
        </Card>

        {/* Main Content Area */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4}>
          {/* Left Column */}
          <Box>
            {/* Sales Overview Chart */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              mb={4}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Sales Overview
                  </Heading>
                  <Checkbox
                    size="sm"
                    colorScheme="teal"
                    isChecked={weeklyView}
                    onChange={(event) => setWeeklyView(event.target.checked)}
                  >
                    Weekly view only
                  </Checkbox>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Box h="300px">
                  <Line data={salesChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            {/* Team Performance */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
            >
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>
                  Team Performance
                </Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Box h="300px">
                  <Bar data={teamPerformanceData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            {/* Sales Report Table */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              mt={4}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Agent Sales Report
                  </Heading>
                  <HStack spacing={2} align="center">
                    <Checkbox
                      size="sm"
                      colorScheme="teal"
                      isChecked={weeklyView}
                      onChange={(event) => setWeeklyView(event.target.checked)}
                    >
                      Weekly view only
                    </Checkbox>
                    {weeklyContentLoading && <Spinner size="xs" />}
                    {weeklyContentError && (
                      <Text fontSize="xs" color="red.500">
                        {weeklyContentError}
                      </Text>
                    )}
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                {teamPerformance?.agentPerformance?.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th px={2} py={1} fontSize="xs">Agent</Th>
                          <Th px={2} py={1} fontSize="xs" isNumeric>Total Sales Value</Th>
                          <Th px={2} py={1} fontSize="xs" isNumeric>Gross Commission</Th>
                          <Th px={2} py={1} fontSize="xs" isNumeric>Net Commission</Th>
                          <Th px={2} py={1} fontSize="xs" isNumeric>Content Bonus</Th>
                          <Th px={2} py={1} fontSize="xs" isNumeric>
                            Weekly Approved Posts
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {teamPerformance.agentPerformance.map((agent, index) => {
                          const weeklyCount = getWeeklyPostCount(agent);
                          const contentBonusKey = normalizeAgentKey(agent);
                          const contentSummary = contentBonusKey ? contentSummaryMap[contentBonusKey] : null;
                          const contentBonus = contentSummary?.bonusAmount || 0;
                          return (
                            <Tr key={agent._id || index}>
                              <Td px={2} py={1}>
                                <Flex align="center">
                                  <Avatar 
                                    size="xs" 
                                    name={agent.fullName || agent.username} 
                                    mr={2} 
                                    bg="teal.500"
                                  />
                                  <Text fontSize="sm" fontWeight="medium">
                                    {agent.fullName || agent.username}
                                  </Text>
                                </Flex>
                              </Td>
                              <Td px={2} py={1} isNumeric>
                                <Text fontSize="sm">ETB {(agent.totalSales || 0).toLocaleString()}</Text>
                              </Td>
                              <Td px={2} py={1} isNumeric>
                                <Text fontSize="sm">
                                  ETB {(agent.totalGrossCommission || 0).toLocaleString()}
                                </Text>
                              </Td>
                              <Td px={2} py={1} isNumeric>
                                <Text fontSize="sm" fontWeight="bold">
                                  ETB {(agent.totalNetCommission || 0).toLocaleString()}
                                </Text>
                              </Td>
                              <Td px={2} py={1} isNumeric>
                                <Text
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color={contentBonus ? 'green.600' : 'gray.500'}
                                >
                                  ETB {contentBonus.toLocaleString()}
                                </Text>
                              </Td>
                              <Td px={2} py={1} isNumeric>
                                <Badge colorScheme={weeklyCount ? 'teal' : 'gray'} fontSize="0.75rem">
                                  {weeklyCount}
                                </Badge>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No agent sales data available
                  </Text>
                )}
              </CardBody>
            </Card>

          </Box>

          {/* Right Column */}
          <Box>
            {/* Pending assignments */}
            <Card
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              mb={4}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Pending Assignments
                  </Heading>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={fetchPendingAssignments}
                    isLoading={assignmentLoading}
                  >
                    Refresh
                  </Button>
                </Flex>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {pendingAssignments.length} new leads in queue
                </Text>
              </CardHeader>
              <CardBody pt={0}>
                {assignmentLoading ? (
                  <Flex justify="center">
                    <Spinner size="sm" />
                  </Flex>
                ) : pendingAssignments.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    No new reception leads at the moment.
                  </Text>
                ) : (
                  <Stack spacing={3}>
                    {pendingAssignments.slice(0, 5).map((customer) => (
                      <Box
                        key={customer._id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor={borderColor}
                      >
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontWeight="semibold" fontSize="sm">
                            {customer.customerName || 'Unnamed lead'}
                          </Text>
                          <Badge colorScheme="orange" fontSize="0.7rem">
                            {customer.pipelineStatus || 'Pending Assignment'}
                          </Badge>
                        </Flex>
                        <Text fontSize="xs" color="gray.500">
                          Phone: {customer.phone || '—'}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mb={2}>
                          Interest: {customer.productInterest || customer.courseName || 'General inquiry'}
                        </Text>
                        <Select
                          size="sm"
                          placeholder={agentRoster.length ? 'Choose agent' : 'No agents available'}
                          value={selectedAssignees[customer._id] || ''}
                          onChange={(e) => handleAssigneeChange(customer._id, e.target.value)}
                        >
                          {agentRoster.map((agent) => (
                            <option key={agent._id} value={agent._id}>
                              {agent.fullName || agent.username || agent._id}
                            </option>
                          ))}
                        </Select>
                        <Button
                          mt={2}
                          size="xs"
                          colorScheme="blue"
                          width="100%"
                          onClick={() => handleAssign(customer._id)}
                          isLoading={assigningCustomerId === customer._id}
                          isDisabled={!selectedAssignees[customer._id]}
                        >
                          Assign to agent
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardBody>
            </Card>

            {/* Recent Activities */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              h="100%"
            >
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>
                  Recent Activities
                </Heading>
              </CardHeader>
              <CardBody p={0}>
                <VStack align="stretch" spacing={0} divider={<StackDivider />}>
                  {recentActivities.map((activity) => (
                    <Box key={activity.id} p={3} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          {activity.user}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {activity.details}
                      </Text>
                      {activity.amount && (
                        <Badge colorScheme="green" mt={1}>
                          {formatCurrency(activity.amount)}
                        </Badge>
                      )}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Grid>

        <Box mt={6}>
          <CompletedSalesTable title="Completed Sales Follow-ups" compact />
        </Box>
      </Box>
  );
};

// Add display name for better debugging
SalesManagerDashboard.displayName = 'SalesManagerDashboard';

// Add missing icon
const FiCheckCircle = (props) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default SalesManagerDashboard;
