// File: src/pages/Dashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  useToast,
  Heading,
  useColorModeValue,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  Skeleton,
  Stack,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  IconButton,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserCheck,
  FiPlusCircle,
  FiChevronRight,
  FiSearch,
  FiMoreHorizontal,
  FiEye,
  FiUmbrella,
  FiBriefcase,
  FiCalendar,
  FiDownload,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import axiosInstance from '../services/axiosInstance';
import { useUserStore } from '../store/user';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Mini Sparkline component for Stats Cards
const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  return (
    <Box w="70px" h="30px">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

const StatCard = ({ icon, label, value, subtext, trend, color, sparklineData, loading }) => {
  const cardBg = useColorModeValue("white", "gray.850");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const subtextColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      p={4}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      boxShadow="sm"
    >
      {loading ? (
        <Stack spacing={2}>
          <Skeleton h="14px" w="100px" />
          <Skeleton h="28px" w="60px" />
          <Skeleton h="12px" w="140px" />
        </Stack>
      ) : (
        <Flex align="center" justify="space-between">
          <HStack spacing={4} align="center">
            <Flex
              w="48px" h="48px"
              align="center" justify="center"
              borderRadius="full"
              bg={`${color}.50`}
              color={`${color}.500`}
              _dark={{ bg: `${color}.950`, color: `${color}.300` }}
            >
              <Icon as={icon} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="xs" fontWeight="600" color={subtextColor}>
                {label}
              </Text>
              <HStack spacing={2} align="baseline">
                <Text fontSize="2xl" fontWeight="800" color={textColor}>
                  {value}
                </Text>
                {trend && (
                  <Text fontSize="10px" fontWeight="700" color="green.500">
                    {trend}
                  </Text>
                )}
              </HStack>
              {subtext && (
                <Text fontSize="10px" color={subtextColor}>
                  {subtext}
                </Text>
              )}
            </VStack>
          </HStack>
          <Sparkline data={sparklineData} color={color === 'teal' ? '#0d9488' : color === 'blue' ? '#2563eb' : color === 'orange' ? '#ea580c' : '#7c3aed'} />
        </Flex>
      )}
    </Box>
  );
};

const Dashboard = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters for employee list
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const toast = useToast();
  const navigate = useNavigate();

  const greetingTime = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const userGreetingName = currentUser?.username?.split(' ')[0] || currentUser?.fullName?.split(' ')[0] || "HR Manager";

  const fetchStatsAndUsers = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get('/users/hr-stats'),
        axiosInstance.get('/users')
      ]);

      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data && usersRes.data.success) {
        setEmployees(usersRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: 'Error loading dashboard',
        description: 'Could not fetch workforce statistics or user list.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndUsers();
  }, []);

  // Filtered employee list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        (emp.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = deptFilter === 'All' || emp.jobTitle === deptFilter;
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, deptFilter, statusFilter]);

  // Unique list of departments/job titles for filter dropdown
  const departmentsList = useMemo(() => {
    const depts = new Set(employees.map(e => e.jobTitle).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [employees]);

  // Radial / Attendance Gauge values
  const attendancePercentage = stats?.counts?.presentToday && stats?.counts?.totalUsers ? 
    Math.round((stats.counts.presentToday / stats.counts.totalUsers) * 100) : 88;

  const attendanceChartData = [
    { name: 'Present', value: attendancePercentage, fill: '#10b981' },
    { name: 'Remaining', value: 100 - attendancePercentage, fill: '#f1f5f9' }
  ];

  // Theme Colors
  const deptChartColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const overviewChartColors = {
    total: '#0ea5e9',
    newHires: '#3b82f6',
    grid: useColorModeValue('#f1f5f9', '#334155'),
    tooltipBg: useColorModeValue('white', '#1e293b'),
    tooltipBorder: useColorModeValue('#e2e8f0', '#475569')
  };

  return (
    <Box pt={2} px={{ base: 2, md: 4 }} bg={useColorModeValue("gray.50", "gray.900")} minH="100vh">
      
      {/* Top Header Row */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.900", "white")} mb={1}>
            {greetingTime}, {userGreetingName}
          </Heading>
          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
            Here's what's happening with your workforce today
          </Text>
        </Box>
        <HStack spacing={3}>
          <HStack px={3} py={2} bg={useColorModeValue("white", "gray.850")} border="1px solid" borderColor={useColorModeValue("gray.100", "gray.700")} borderRadius="xl" spacing={2}>
            <Icon as={FiCalendar} color="gray.400" />
            <Text fontSize="xs" fontWeight="700" color={useColorModeValue("gray.700", "gray.300")}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </HStack>
          <Button
            as={RouterLink}
            to="/create"
            colorScheme="teal"
            bg="teal.500"
            _hover={{ bg: "teal.600" }}
            size="sm"
            leftIcon={<FiPlusCircle />}
            borderRadius="xl"
            fontSize="xs"
            fontWeight="700"
          >
            Add employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            color={useColorModeValue("gray.700", "gray.300")}
            leftIcon={<FiDownload />}
            borderRadius="xl"
            fontSize="xs"
            fontWeight="700"
            onClick={() => window.print()}
          >
            Export report
          </Button>
        </HStack>
      </Flex>

      {/* Top Stats Cards Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <StatCard
          icon={FiUsers}
          label="Total Employees"
          value={stats?.counts?.totalUsers || 247}
          trend="↑ 8 this month"
          color="teal"
          sparklineData={stats?.sparklines?.totalEmployees}
          loading={loading}
        />
        <StatCard
          icon={FiUserCheck}
          label="Present Today"
          value={stats?.counts?.presentToday || 218}
          subtext={`${attendancePercentage}% of total`}
          color="blue"
          sparklineData={stats?.sparklines?.presentToday}
          loading={loading}
        />
        <StatCard
          icon={FiUmbrella}
          label="On Leave"
          value={stats?.counts?.onLeave || 18}
          subtext={`${Math.round((stats?.counts?.onLeave || 18) / (stats?.counts?.totalUsers || 247) * 100)}% of total`}
          color="orange"
          sparklineData={stats?.sparklines?.onLeave}
          loading={loading}
        />
        <StatCard
          icon={FiBriefcase}
          label="Open Positions"
          value={stats?.counts?.openPositions || 12}
          trend="↓ 2 vs last month"
          color="purple"
          sparklineData={stats?.sparklines?.openPositions}
          loading={loading}
        />
      </SimpleGrid>

      {/* Middle Grid: Workforce Overview + Department Distribution */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
        
        {/* Workforce Overview Chart */}
        <Box
          gridColumn={{ lg: "span 2" }}
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="400px"
        >
          <Flex justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={1}>
              <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.900", "white")}>
                Workforce Overview
              </Text>
              <HStack spacing={4}>
                <HStack spacing={1.5}>
                  <Box w={2} h={2} borderRadius="full" bg={overviewChartColors.total} />
                  <Text fontSize="xs" fontWeight="600" color="gray.400">Total Employees</Text>
                </HStack>
                <HStack spacing={1.5}>
                  <Box w={2} h={2} borderRadius="full" bg={overviewChartColors.newHires} />
                  <Text fontSize="xs" fontWeight="600" color="gray.400">New Hires</Text>
                </HStack>
              </HStack>
            </VStack>
            <Select size="sm" maxW="140px" borderRadius="xl" bg={useColorModeValue("white", "gray.800")}>
              <option>Last 6 months</option>
              <option>Last year</option>
            </Select>
          </Flex>

          {loading ? (
            <Flex align="center" justify="center" h="280px">
              <Spinner size="md" />
            </Flex>
          ) : (
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={stats?.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={overviewChartColors.total} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={overviewChartColors.total} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={overviewChartColors.grid} vertical={false} />
                <XAxis dataKey="name" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: overviewChartColors.tooltipBg, 
                    borderColor: overviewChartColors.tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="total" stroke={overviewChartColors.total} strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="newHires" stroke={overviewChartColors.newHires} strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Department Distribution Donut Chart */}
        <Box
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="400px"
        >
          <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.900", "white")} mb={6}>
            Department Distribution
          </Text>

          {loading ? (
            <Flex align="center" justify="center" h="280px">
              <Spinner size="md" />
            </Flex>
          ) : (
            <Flex align="center" justify="center" h="280px">
              <Box position="relative" w="180px" h="180px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.deptStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats?.deptStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={deptChartColors[index % deptChartColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Total Count in Center of Donut */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  textAlign="center"
                >
                  <Text fontSize="24px" fontWeight="800" color={useColorModeValue("gray.800", "white")} lh="1">
                    {stats?.counts?.totalUsers || 247}
                  </Text>
                  <Text fontSize="10px" color="gray.400" fontWeight="700" textTransform="uppercase">
                    Total
                  </Text>
                </Box>
              </Box>

              {/* Sidebar Legend list */}
              <VStack align="stretch" spacing={2.5} flex={1} pl={4}>
                {stats?.deptStats?.map((entry, index) => {
                  const percent = Math.round((entry.value / (stats?.counts?.totalUsers || 247)) * 100);
                  return (
                    <Flex key={entry.name} align="center" justify="space-between" fontSize="xs">
                      <HStack spacing={2}>
                        <Box w={2} h={2} borderRadius="full" bg={deptChartColors[index % deptChartColors.length]} />
                        <Text fontWeight="700" color={useColorModeValue("gray.700", "gray.300")}>{entry.name}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Text fontWeight="800" color={useColorModeValue("gray.800", "white")}>{entry.value}</Text>
                        <Text fontSize="10px" color="gray.400">({percent}%)</Text>
                      </HStack>
                    </Flex>
                  );
                })}
              </VStack>
            </Flex>
          )}
        </Box>
      </SimpleGrid>

      {/* Third Grid: Attendance Today + Upcoming Events + Quick Actions + Pending Approvals */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        
        {/* Attendance Today Circular Progress */}
        <Box
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="340px"
        >
          <Text fontWeight="800" fontSize="sm" color={useColorModeValue("gray.900", "white")} mb={4}>
            Attendance Today
          </Text>
          <Flex align="center" justify="center" direction="column">
            <Box position="relative" w="130px" h="130px" mb={4}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={60}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#0d9488" />
                    <Cell fill={useColorModeValue("#f1f5f9", "#334155")} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                textAlign="center"
              >
                <Text fontSize="20px" fontWeight="800" color={useColorModeValue("gray.800", "white")}>
                  {attendancePercentage}%
                </Text>
                <Text fontSize="8px" color="gray.400" fontWeight="700" textTransform="uppercase">
                  Attendance Rate
                </Text>
              </Box>
            </Box>

            {/* Attendance Legend table */}
            <VStack align="stretch" w="full" spacing={2.5}>
              <Flex justify="space-between" fontSize="xs">
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="teal.500" borderRadius="full" />
                  <Text fontWeight="600" color="gray.500">Present</Text>
                </HStack>
                <Text fontWeight="800" color={useColorModeValue("gray.800", "white")}>{stats?.counts?.presentToday || 218}</Text>
              </Flex>
              <Flex justify="space-between" fontSize="xs">
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="orange.400" borderRadius="full" />
                  <Text fontWeight="600" color="gray.500">Late</Text>
                </HStack>
                <Text fontWeight="800" color={useColorModeValue("gray.800", "white")}>{stats?.counts?.lateToday || 11}</Text>
              </Flex>
              <Flex justify="space-between" fontSize="xs">
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="red.400" borderRadius="full" />
                  <Text fontWeight="600" color="gray.500">Absent</Text>
                </HStack>
                <Text fontWeight="800" color={useColorModeValue("gray.800", "white")}>{stats?.counts?.absentToday || 18}</Text>
              </Flex>
              <Divider borderColor={useColorModeValue("gray.100", "gray.850")} />
              <Flex justify="space-between" fontSize="xs" fontWeight="700">
                <Text color="gray.400">Total Employees</Text>
                <Text color={useColorModeValue("gray.800", "white")}>{stats?.counts?.totalUsers || 247}</Text>
              </Flex>
            </VStack>
          </Flex>
        </Box>

        {/* Upcoming Events List */}
        <Box
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="340px"
        >
          <Text fontWeight="800" fontSize="sm" color={useColorModeValue("gray.900", "white")} mb={4}>
            Upcoming Events
          </Text>
          <VStack align="stretch" spacing={4} overflowY="auto" maxH="240px">
            {stats?.upcomingEvents?.map((event) => {
              const startDt = new Date(event.start);
              return (
                <Flex key={event._id} align="center" justify="space-between" fontSize="xs">
                  <HStack spacing={3}>
                    <Flex
                      w="36px" h="36px"
                      align="center" justify="center"
                      borderRadius="lg"
                      bg={event.type === 'meeting' ? "blue.50" : event.type === 'deadline' ? "teal.50" : "purple.50"}
                      color={event.type === 'meeting' ? "blue.500" : event.type === 'deadline' ? "teal.500" : "purple.500"}
                      _dark={{
                        bg: event.type === 'meeting' ? "blue.950" : event.type === 'deadline' ? "teal.950" : "purple.950"
                      }}
                    >
                      <Icon as={FiCalendar} />
                    </Flex>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="800" color={useColorModeValue("gray.800", "white")}>
                        {event.title}
                      </Text>
                      <Text fontSize="10px" color="gray.400">
                        {event.description}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" spacing={0} fontSize="10px" color="gray.500" fontWeight="600">
                    <Text>{startDt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                    <Text color="gray.400">{startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </VStack>
                </Flex>
              );
            })}
          </VStack>
        </Box>

        {/* Quick Actions clickable cards */}
        <Box
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="340px"
        >
          <Text fontWeight="800" fontSize="sm" color={useColorModeValue("gray.900", "white")} mb={4}>
            Quick Actions
          </Text>
          <VStack align="stretch" spacing={2.5}>
            {[
              { label: 'Review leave requests', to: '/FollowUpList' },
              { label: 'Run payroll', to: '/payroll' },
              { label: 'Post a job', to: '/candidate-pool' },
              { label: 'Create announcement', to: '/chat' }
            ].map((action) => (
              <Flex
                key={action.label}
                as={RouterLink}
                to={action.to}
                align="center"
                justify="space-between"
                p={3}
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="xl"
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                _hover={{ borderColor: "teal.400", bg: useColorModeValue("teal.50", "rgba(13,148,136,0.05)") }}
                transition="all 0.2s"
                cursor="pointer"
              >
                <Text fontSize="xs" fontWeight="700" color={useColorModeValue("gray.700", "gray.300")}>
                  {action.label}
                </Text>
                <Icon as={FiChevronRight} color="gray.400" />
              </Flex>
            ))}
          </VStack>
        </Box>

        {/* Pending Approvals counts list */}
        <Box
          bg={useColorModeValue("white", "gray.850")}
          border="1px solid"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          borderRadius="2xl"
          p={5}
          boxShadow="sm"
          h="340px"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Text fontWeight="800" fontSize="sm" color={useColorModeValue("gray.900", "white")} mb={4}>
              Pending Approvals
            </Text>
            <VStack align="stretch" spacing={4}>
              {[
                { label: 'Leave Requests', count: stats?.approvals?.leaves || 6, color: 'red', to: '/EmployeeDocument' },
                { label: 'Expense Claims', count: stats?.approvals?.expenses || 3, color: 'orange', to: '/payroll' },
                { label: 'Profile Updates', count: stats?.approvals?.profiles || 2, color: 'blue', to: '/users' }
              ].map((item) => (
                <Flex
                  key={item.label}
                  as={RouterLink}
                  to={item.to}
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  _hover={{ opacity: 0.8 }}
                >
                  <HStack spacing={3}>
                    <Flex
                      w="8px" h="8px"
                      borderRadius="full"
                      bg={`${item.color}.500`}
                    />
                    <Text fontSize="xs" fontWeight="700" color={useColorModeValue("gray.700", "gray.300")}>
                      {item.label}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge colorScheme={item.color} borderRadius="full" px={2} fontSize="10px" fontWeight="800">
                      {item.count}
                    </Badge>
                    <Icon as={FiChevronRight} color="gray.400" boxSize={3.5} />
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Button
            variant="link"
            size="xs"
            color="teal.500"
            fontWeight="700"
            alignSelf="center"
            rightIcon={<FiChevronRight />}
            onClick={() => navigate('/EmployeeDocument')}
          >
            View all approvals
          </Button>
        </Box>
      </SimpleGrid>

      {/* Bottom Section: Employee Directory Table */}
      <Box
        bg={useColorModeValue("white", "gray.850")}
        border="1px solid"
        borderColor={useColorModeValue("gray.100", "gray.700")}
        borderRadius="2xl"
        p={5}
        boxShadow="sm"
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
          <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.900", "white")}>
            Employee Directory
          </Text>
          <HStack spacing={3} flexWrap="wrap" flex={1} justify="end" maxW={{ base: "full", md: "80%" }}>
            <InputGroup size="sm" maxW="240px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input 
                placeholder="Search employees..." 
                borderRadius="xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              placeholder="All Departments" 
              size="sm" 
              maxW="160px" 
              borderRadius="xl"
              value={deptFilter === 'All' ? '' : deptFilter}
              onChange={(e) => setDeptFilter(e.target.value || 'All')}
            >
              {departmentsList.filter(d => d !== 'All').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>

            <Select 
              placeholder="All Statuses" 
              size="sm" 
              maxW="140px" 
              borderRadius="xl"
              value={statusFilter === 'All' ? '' : statusFilter}
              onChange={(e) => setStatusFilter(e.target.value || 'All')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            
            <Button
              variant="link"
              color="teal.500"
              fontSize="xs"
              fontWeight="700"
              onClick={() => navigate('/users')}
            >
              View all employees &gt;
            </Button>
          </HStack>
        </Flex>

        {loading ? (
          <Stack spacing={3}>
            <Skeleton h="40px" borderRadius="xl" />
            <Skeleton h="40px" borderRadius="xl" />
            <Skeleton h="40px" borderRadius="xl" />
          </Stack>
        ) : filteredEmployees.length === 0 ? (
          <Flex align="center" justify="center" py={8} direction="column" gap={2}>
            <Icon as={FiUsers} boxSize={8} color="gray.400" />
            <Text fontSize="sm" color="gray.500" fontWeight="600">No employees match filters.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.400">Employee</Th>
                  <Th color="gray.400">Department</Th>
                  <Th color="gray.400">Role</Th>
                  <Th color="gray.400">Status</Th>
                  <Th color="gray.400">Join Date</Th>
                  <Th color="gray.400" textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEmployees.slice(0, 5).map((emp) => {
                  const joinDateStr = emp.createdAt ? 
                    new Date(emp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                    'N/A';
                  return (
                    <Tr key={emp._id} _hover={{ bg: useColorModeValue("gray.50", "rgba(255,255,255,0.01)") }} transition="background 0.15s ease">
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Avatar size="sm" name={emp.fullName || emp.username} src={emp.photoUrl} />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.800", "white")}>
                              {emp.fullName || emp.username}
                            </Text>
                            <Text fontSize="11px" color="gray.500">
                              {emp.email}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="xs" fontWeight="700" color={useColorModeValue("gray.700", "gray.300")}>
                          {emp.jobTitle || 'General'}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="xs" fontWeight="600" color="gray.500">
                          {emp.role || 'Employee'}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge 
                          colorScheme={emp.status === 'active' ? 'green' : 'gray'} 
                          variant="subtle" 
                          borderRadius="md"
                          px={2}
                          py={0.5}
                          fontSize="10px"
                          fontWeight="700"
                        >
                          {emp.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="xs" color="gray.500" fontWeight="600">
                          {joinDateStr}
                        </Text>
                      </Td>
                      <Td py={3} textAlign="right">
                        <HStack spacing={2} justify="end">
                          <IconButton
                            icon={<FiEye />}
                            size="xs"
                            variant="ghost"
                            color="gray.500"
                            aria-label="View Details"
                            onClick={() => navigate('/users')}
                          />
                          <Menu size="xs">
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreHorizontal />}
                              size="xs"
                              variant="ghost"
                              color="gray.500"
                              aria-label="More options"
                            />
                            <MenuList borderRadius="xl" shadow="md">
                              <MenuItem fontSize="xs" fontWeight="600" onClick={() => navigate('/payroll')}>Adjust Payroll</MenuItem>
                              <MenuItem fontSize="xs" fontWeight="600" onClick={() => navigate('/EmployeeDocument')}>Verify Documents</MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

    </Box>
  );
};

export default Dashboard;
