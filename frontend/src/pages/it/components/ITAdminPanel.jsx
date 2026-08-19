import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiAlertCircle,
  FiAward,
  FiCheckCircle,
  FiClipboard,
  FiDownload,
  FiEdit,
  FiEye,
  FiFilter,
  FiGrid,
  FiKey,
  FiLayers,
  FiLock,
  FiPower,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTag,
  FiTrash2,
  FiTrendingUp,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import axiosInstance from '../../../services/axiosInstance';
import { normalizeRole } from '../../../store/user';

const DAY_MS = 24 * 60 * 60 * 1000;

const auditIntervals = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'all', label: 'All Time' },
];

const getAuditRange = (interval) => {
  const start = new Date();
  const end = new Date();

  if (interval === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (interval === 'weekly') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime() + 7 * DAY_MS - 1);
  } else if (interval === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (interval === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  } else {
    // all time
    start.setFullYear(2020, 0, 1);
    end.setFullYear(2035, 11, 31);
  }

  return { start, end };
};

const buildTicketRankings = (tasks = []) => {
  const rankings = new Map();
  tasks.forEach((task) => {
    (task.ticketRecords || []).forEach((record) => {
      const key = String(record.staff || record.staffName || 'unknown');
      const item = rankings.get(key) || {
        staffName: record.staffName || 'Unknown staff',
        approvedPoints: 0,
        approvedRecords: 0,
        pendingRecords: 0,
      };
      const isAccomplished = !String(record.outstandingTasks || '').trim();
      if (record.approvalStatus === 'approved' && isAccomplished) {
        item.approvedPoints += Number(record.points) || 0;
        item.approvedRecords += 1;
      } else if (record.approvalStatus !== 'rejected') {
        item.pendingRecords += 1;
      }
      rankings.set(key, item);
    });
  });

  return [...rankings.values()]
    .sort((a, b) => b.approvedPoints - a.approvedPoints || b.approvedRecords - a.approvedRecords)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

export default function ITAdminPanel({ tasks = [], users = [], refreshUsers, initialPanel = 'overview' }) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditInterval, setAuditInterval] = useState('daily');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [showAuditDetail, setShowAuditDetail] = useState(false);
  
  // User Management filters & state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [submittingUser, setSubmittingUser] = useState(false);
  
  // Delete user alert dialog state
  const [deletingUser, setDeletingUser] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelDeleteRef = useRef();

  // Create User State
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'IT Staff',
    department: 'IT',
    status: 'active',
    infoStatus: 'active',
  });

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const tableHoverBg = useColorModeValue('gray.50', 'gray.750');

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel]);

  const fetchAuditLog = async () => {
    try {
      setLoadingAudit(true);
      const response = await axiosInstance.get('/it/audit/all');
      setAuditLog(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.warn('Audit log load warning:', error);
      toast({
        title: 'Audit log unavailable',
        description: error.response?.data?.message || error.message,
        status: 'warning',
        duration: 3000,
      });
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activePanel === 'audit') {
      fetchAuditLog();
    }
  }, [activePanel]);

  // Executive Overview Stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.workflowStatus === 'completed' || t.isCompleted).length;
    const inProgressTasks = tasks.filter((t) => t.workflowStatus === 'in_progress').length;
    const pendingApprovals = tasks.filter((t) => t.approvalStatus === 'pending_approval').length;
    const externalTasks = tasks.filter((t) => t.projectType === 'external').length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const itUsers = users.filter((u) => {
      const r = normalizeRole(u.role);
      return r === 'it' || r.includes('it');
    }).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingApprovals,
      externalTasks,
      activeUsers,
      itUsers,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks, users]);

  const ticketRankings = useMemo(() => buildTicketRankings(tasks), [tasks]);
  
  const pendingTicketApprovals = useMemo(() => tasks.reduce((sum, task) => (
    sum + (task.ticketRecords || []).filter((record) => record.approvalStatus === 'pending_approval').length
  ), 0), [tasks]);

  const selectedAuditRange = useMemo(() => getAuditRange(auditInterval), [auditInterval]);

  // Filtered Audit Log
  const filteredAuditLog = useMemo(() => {
    return auditLog.filter((entry) => {
      const time = new Date(entry.createdAt || 0).getTime();
      const inTimeRange = auditInterval === 'all' || (
        !Number.isNaN(time)
        && time >= selectedAuditRange.start.getTime()
        && time <= selectedAuditRange.end.getTime()
      );
      if (!inTimeRange) return false;

      if (auditActionFilter !== 'all') {
        const actionStr = String(entry.action || '').toLowerCase();
        if (!actionStr.includes(auditActionFilter.toLowerCase())) return false;
      }

      if (auditSearch.trim()) {
        const query = auditSearch.toLowerCase();
        const taskMatch = String(entry.taskName || '').toLowerCase().includes(query);
        const actorMatch = String(entry.actorName || '').toLowerCase().includes(query);
        const actionMatch = String(entry.action || '').toLowerCase().includes(query);
        const noteMatch = String(entry.note || '').toLowerCase().includes(query);
        if (!taskMatch && !actorMatch && !actionMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [auditLog, selectedAuditRange, auditInterval, auditActionFilter, auditSearch]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (userRoleFilter !== 'all') {
        const role = String(user.role || '').toLowerCase();
        if (userRoleFilter === 'admin' && !role.includes('admin')) return false;
        if (userRoleFilter === 'itmanager' && !role.includes('manager')) return false;
        if (userRoleFilter === 'itteamleader' && !role.includes('leader')) return false;
        if (userRoleFilter === 'itstaff' && (role.includes('leader') || role.includes('manager') || role.includes('admin'))) return false;
      }

      if (userStatusFilter !== 'all') {
        if (user.status !== userStatusFilter) return false;
      }

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const nameMatch = String(user.fullName || user.username || '').toLowerCase().includes(q);
        const emailMatch = String(user.email || '').toLowerCase().includes(q);
        const roleMatch = String(user.role || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !roleMatch) return false;
      }

      return true;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const handleAuditIntervalChange = (event) => {
    setAuditInterval(event.target.value);
    setShowAuditDetail(false);
  };

  const updateUser = async (user, updates) => {
    try {
      await axiosInstance.put(`/users/${user._id}`, updates);
      await refreshUsers?.();
      toast({ title: 'User account updated', status: 'success', duration: 2500 });
    } catch (error) {
      toast({
        title: 'User update failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = passwordDrafts[user._id];
    if (!newPassword || newPassword.trim().length < 4) {
      toast({ title: 'Password must be at least 4 characters', status: 'warning', duration: 3000 });
      return;
    }
    try {
      await axiosInstance.put(`/users/${user._id}`, { password: newPassword });
      setPasswordDrafts((prev) => ({ ...prev, [user._id]: '' }));
      toast({ title: `Password reset successfully for ${user.username || user.email}`, status: 'success', duration: 3000 });
    } catch (error) {
      toast({
        title: 'Password reset failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  const openDeleteModal = (user) => {
    setDeletingUser(user);
    onDeleteOpen();
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser?._id) return;
    try {
      await axiosInstance.delete(`/users/${deletingUser._id}`);
      await refreshUsers?.();
      onDeleteClose();
      setDeletingUser(null);
      toast({ title: 'User permanently deleted', status: 'info', duration: 2500 });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  const createUser = async (e) => {
    e?.preventDefault?.();
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast({ title: 'Username, email, and password are required', status: 'warning', duration: 3000 });
      return;
    }
    try {
      setSubmittingUser(true);
      await axiosInstance.post('/users', newUser);
      setNewUser({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'IT Staff',
        department: 'IT',
        status: 'active',
        infoStatus: 'active',
      });
      await refreshUsers?.();
      toast({ title: 'User created successfully', status: 'success', duration: 3000 });
    } catch (error) {
      toast({
        title: 'Create user failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setSubmittingUser(false);
    }
  };

  const exportAuditCSV = () => {
    if (!filteredAuditLog.length) {
      toast({ title: 'No audit records to export', status: 'info' });
      return;
    }
    const headers = ['Timestamp', 'Task Name', 'Project Type', 'Action', 'Actor Name', 'Actor Role', 'Note'];
    const rows = filteredAuditLog.map((e) => [
      e.createdAt ? new Date(e.createdAt).toISOString() : '',
      `"${(e.taskName || '').replace(/"/g, '""')}"`,
      `"${(e.projectType || '').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      `"${(e.actorRole || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IT_Audit_Log_${auditInterval}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const adminMenu = [
    { id: 'overview', label: 'Executive Overview', icon: FiGrid },
    { id: 'users', label: 'User Management & RBAC', icon: FiUsers },
    { id: 'audit', label: 'Activity & Audit Log', icon: FiClipboard },
  ];

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header Banner */}
      <Box>
        <HStack spacing={3} mb={1}>
          <Box p={2} bg="blue.500" color="white" borderRadius="xl">
            <FiShield size={22} />
          </Box>
          <Box>
            <Heading size="lg">IT Manager Control Center</Heading>
            <Text color={mutedColor} fontSize="sm">
              Executive overview, team ranking signals, operational governance, and credential controls.
            </Text>
          </Box>
        </HStack>
      </Box>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
        <CardBody p={{ base: 4, md: 6 }}>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch">
            {/* Sidebar Navigation */}
            <Box
              w={{ base: '100%', lg: '260px' }}
              bg={sidebarBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="xl"
              p={3}
              flexShrink={0}
            >
              <VStack align="stretch" spacing={2}>
                <Text px={3} py={2} fontSize="xs" fontWeight="800" color={mutedColor} textTransform="uppercase" letterSpacing="wider">
                  Manager Controls
                </Text>
                {adminMenu.map((item) => (
                  <Button
                    key={item.id}
                    leftIcon={item.icon ? <Icon as={item.icon} /> : undefined}
                    justifyContent="flex-start"
                    variant="ghost"
                    borderRadius="lg"
                    bg={activePanel === item.id ? activeBg : 'transparent'}
                    colorScheme={activePanel === item.id ? 'blue' : 'gray'}
                    fontWeight={activePanel === item.id ? 'bold' : 'medium'}
                    onClick={() => setActivePanel(item.id)}
                    py={5}
                  >
                    {item.label}
                  </Button>
                ))}
              </VStack>
            </Box>

            {/* Main Panel Content */}
            <Box flex="1" minW={0}>
              {activePanel === 'overview' ? (
                <VStack spacing={6} align="stretch">
                  {/* Executive Metric Cards */}
                  <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={4}>
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
                      <CardBody p={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">TOTAL WORK TASKS</StatLabel>
                          <StatNumber fontSize="2xl" fontWeight="extrabold">{stats.totalTasks}</StatNumber>
                          <StatHelpText mb={0} color="blue.500" fontSize="xs">
                            {stats.inProgressTasks} In Progress
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
                      <CardBody p={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">ACTIVE STAFF</StatLabel>
                          <StatNumber fontSize="2xl" fontWeight="extrabold" color="green.500">{stats.activeUsers}</StatNumber>
                          <StatHelpText mb={0} color="gray.500" fontSize="xs">
                            {stats.itUsers} IT Specialists
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
                      <CardBody p={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">PENDING APPROVALS</StatLabel>
                          <StatNumber fontSize="2xl" fontWeight="extrabold" color="orange.500">{stats.pendingApprovals}</StatNumber>
                          <StatHelpText mb={0} color="orange.600" fontSize="xs">
                            Requires Manager Review
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
                      <CardBody p={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">COMPLETED PROJECTS</StatLabel>
                          <StatNumber fontSize="2xl" fontWeight="extrabold" color="purple.500">{stats.completedTasks}</StatNumber>
                          <StatHelpText mb={0} color="purple.600" fontSize="xs">
                            {stats.completionRate}% Completion Rate
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Leaderboard & Ticket Oversight */}
                  <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
                    {/* Ticket Rankings */}
                    <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between" mb={4}>
                          <HStack>
                            <Icon as={FiAward} color="yellow.500" boxSize={5} />
                            <Heading size="md">Staff Ticket Ranking</Heading>
                          </HStack>
                          {pendingTicketApprovals > 0 && (
                            <Badge colorScheme="orange" variant="solid" borderRadius="full" px={2}>
                              {pendingTicketApprovals} Pending Review
                            </Badge>
                          )}
                        </HStack>

                        <VStack align="stretch" spacing={2.5}>
                          {ticketRankings.length === 0 ? (
                            <Box p={6} textAlign="center" color={mutedColor}>
                              <Text fontSize="sm">No internal ticket points recorded yet.</Text>
                            </Box>
                          ) : (
                            ticketRankings.slice(0, 6).map((item) => (
                              <Flex
                                key={item.staffName}
                                justify="space-between"
                                align="center"
                                bg={cardBg}
                                borderRadius="lg"
                                p={3}
                                border="1px solid"
                                borderColor={borderColor}
                              >
                                <HStack spacing={3}>
                                  <Badge
                                    colorScheme={item.rank === 1 ? 'yellow' : item.rank === 2 ? 'gray' : item.rank === 3 ? 'orange' : 'blue'}
                                    variant="solid"
                                    borderRadius="full"
                                    px={2.5}
                                    py={0.5}
                                  >
                                    #{item.rank}
                                  </Badge>
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm">{item.staffName}</Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                      {item.approvedRecords} tickets approved • {item.pendingRecords} pending
                                    </Text>
                                  </Box>
                                </HStack>
                                <Badge colorScheme="green" fontSize="sm" px={2.5} py={1} borderRadius="md">
                                  {item.approvedPoints} pts
                                </Badge>
                              </Flex>
                            ))
                          )}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Operational Governance Scope */}
                    <VStack align="stretch" spacing={4}>
                      <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                        <CardBody>
                          <HStack spacing={2} mb={2}>
                            <Icon as={FiLayers} color="blue.500" />
                            <Heading size="sm">Project Operations Oversight</Heading>
                          </HStack>
                          <Text color={mutedColor} fontSize="sm" mb={3}>
                            Oversee internal sprints, maintenance tickets, and Customer Service external requests. Manager approval grants point credits towards team leaderboard evaluations.
                          </Text>
                          <HStack spacing={2}>
                            <Badge colorScheme="blue">Internal: {tasks.filter(t => t.projectType !== 'external').length}</Badge>
                            <Badge colorScheme="purple">External CS: {stats.externalTasks}</Badge>
                            <Badge colorScheme="green">Completed: {stats.completedTasks}</Badge>
                          </HStack>
                        </CardBody>
                      </Card>

                      <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                        <CardBody>
                          <HStack spacing={2} mb={2}>
                            <Icon as={FiShield} color="teal.500" />
                            <Heading size="sm">Administrative Control Hub</Heading>
                          </HStack>
                          <Text color={mutedColor} fontSize="sm" mb={3}>
                            Manage team RBAC permissions, create accounts, rotate access credentials, and monitor audit traces across all IT systems.
                          </Text>
                          <HStack spacing={2}>
                            <Button size="xs" colorScheme="blue" onClick={() => setActivePanel('users')}>
                              Manage Accounts
                            </Button>
                            <Button size="xs" variant="outline" colorScheme="blue" onClick={() => setActivePanel('audit')}>
                              View Audit Traces
                            </Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              ) : activePanel === 'audit' ? (
                /* Activity & Audit Log Panel */
                <VStack align="stretch" spacing={5}>
                  <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} flexWrap="wrap">
                    <HStack spacing={3}>
                      <Box p={2} bg="blue.50" color="blue.500" borderRadius="lg">
                        <Icon as={FiClipboard} boxSize={5} />
                      </Box>
                      <Box>
                        <Heading size="md">IT System & Task Audit Log</Heading>
                        <Text color={mutedColor} fontSize="xs">
                          Chronological audit traces of task workflows, approvals, reassignments, and administrative actions.
                        </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={2} flexWrap="wrap">
                      <IconButton
                        aria-label="Refresh audit"
                        icon={<FiRefreshCw />}
                        size="sm"
                        variant="outline"
                        onClick={fetchAuditLog}
                        isLoading={loadingAudit}
                      />
                      <Button
                        size="sm"
                        leftIcon={<FiDownload />}
                        variant="outline"
                        colorScheme="blue"
                        onClick={exportAuditCSV}
                        isDisabled={filteredAuditLog.length === 0}
                      >
                        Export CSV
                      </Button>
                    </HStack>
                  </Flex>

                  {/* Audit Filters Bar */}
                  <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody p={3}>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                        <Select size="sm" value={auditInterval} onChange={handleAuditIntervalChange}>
                          {auditIntervals.map((option) => (
                            <option key={option.value} value={option.value}>{option.label} Interval</option>
                          ))}
                        </Select>

                        <Select size="sm" value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                          <option value="all">All Actions</option>
                          <option value="create">Task Creation</option>
                          <option value="status">Status & Workflow Changes</option>
                          <option value="approve">Approvals</option>
                          <option value="comment">Comments</option>
                          <option value="reassign">Reassignments</option>
                          <option value="reminder">Reminders</option>
                        </Select>

                        <InputGroup size="sm">
                          <InputLeftElement pointerEvents="none">
                            <FiSearch color="gray" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search tasks, actors..."
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                          />
                        </InputGroup>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Audit Records Table */}
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody p={0}>
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead bg={sidebarBg}>
                            <Tr>
                              <Th>Timestamp</Th>
                              <Th>Task / Entity</Th>
                              <Th>Action</Th>
                              <Th>Actor</Th>
                              <Th>Details / Notes</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {loadingAudit ? (
                              <Tr>
                                <Td colSpan={5} textAlign="center" py={8}>
                                  <Spinner size="md" color="blue.500" />
                                  <Text fontSize="xs" color={mutedColor} mt={2}>Loading audit logs...</Text>
                                </Td>
                              </Tr>
                            ) : filteredAuditLog.length === 0 ? (
                              <Tr>
                                <Td colSpan={5} textAlign="center" py={8} color={mutedColor}>
                                  No audit entries matching selected interval and filters.
                                </Td>
                              </Tr>
                            ) : (
                              filteredAuditLog.slice(0, 100).map((entry, idx) => (
                                <Tr key={entry._id || idx} _hover={{ bg: tableHoverBg }}>
                                  <Td whiteSpace="nowrap" fontSize="xs" color="gray.500">
                                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
                                  </Td>
                                  <Td>
                                    <Text fontWeight="semibold" fontSize="xs">{entry.taskName || 'Internal Entity'}</Text>
                                    {entry.projectType && (
                                      <Badge size="xs" colorScheme="purple" fontSize="2xs">{entry.projectType}</Badge>
                                    )}
                                  </Td>
                                  <Td>
                                    <Badge
                                      colorScheme={
                                        String(entry.action).includes('approve') ? 'green' :
                                        String(entry.action).includes('create') ? 'blue' :
                                        String(entry.action).includes('delete') ? 'red' : 'gray'
                                      }
                                      fontSize="2xs"
                                    >
                                      {String(entry.action || '').replaceAll('_', ' ')}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Text fontSize="xs" fontWeight="medium">{entry.actorName || 'System'}</Text>
                                    <Text fontSize="2xs" color="gray.400">{entry.actorRole || 'Service'}</Text>
                                  </Td>
                                  <Td maxW="300px" isTruncated fontSize="xs" color="gray.600">
                                    {entry.note || '-'}
                                  </Td>
                                </Tr>
                              ))
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </VStack>
              ) : (
                /* User Management & RBAC Panel */
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <HStack spacing={3} mb={1}>
                      <Box p={2} bg="blue.50" color="blue.500" borderRadius="lg">
                        <Icon as={FiShield} boxSize={5} />
                      </Box>
                      <Box>
                        <Heading size="md">User Management & Account Control</Heading>
                        <Text color={mutedColor} fontSize="xs">
                          Complete control over staff credentials, activation status, role assignments, and permanent removals.
                        </Text>
                      </Box>
                    </HStack>
                  </Box>

                  {/* Create New User Section */}
                  <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody>
                      <HStack mb={3} spacing={2}>
                        <Icon as={FiUserPlus} color="blue.500" />
                        <Heading size="sm">Create New Account</Heading>
                      </HStack>
                      <form onSubmit={createUser}>
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={3}>
                          <Input
                            placeholder="Username"
                            size="sm"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            required
                          />
                          <Input
                            placeholder="Full Name"
                            size="sm"
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                          />
                          <Input
                            placeholder="Email"
                            size="sm"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                          />
                          <Input
                            placeholder="Password"
                            size="sm"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                          />
                          <Select
                            size="sm"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          >
                            <option value="IT Staff">IT Staff</option>
                            <option value="IT Team Leader">IT Team Leader</option>
                            <option value="IT Manager">IT Manager</option>
                            <option value="IT Officer">IT Officer</option>
                            <option value="admin">Admin</option>
                          </Select>
                          <Button size="sm" colorScheme="blue" type="submit" isLoading={submittingUser}>
                            Create Account
                          </Button>
                        </SimpleGrid>
                      </form>
                    </CardBody>
                  </Card>

                  {/* User Search & Filters */}
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardHeader pb={2} pt={4} px={4}>
                      <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={3} flexWrap="wrap">
                        <HStack spacing={2}>
                          <Heading size="sm">All User Directory</Heading>
                          <Badge colorScheme="blue" borderRadius="full">{filteredUsers.length} Users</Badge>
                        </HStack>

                        <HStack spacing={2} flexWrap="wrap">
                          <Select
                            size="xs"
                            w="130px"
                            value={userRoleFilter}
                            onChange={(e) => setUserRoleFilter(e.target.value)}
                          >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="itmanager">IT Managers</option>
                            <option value="itteamleader">Team Leaders</option>
                            <option value="itstaff">IT Staff</option>
                          </Select>

                          <Select
                            size="xs"
                            w="110px"
                            value={userStatusFilter}
                            onChange={(e) => setUserStatusFilter(e.target.value)}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </Select>

                          <InputGroup size="xs" maxW="180px">
                            <InputLeftElement pointerEvents="none">
                              <FiSearch color="gray" />
                            </InputLeftElement>
                            <Input
                              placeholder="Search users..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                            />
                          </InputGroup>
                        </HStack>
                      </Flex>
                    </CardHeader>

                    <CardBody p={0}>
                      <TableContainer>
                        <Table size="sm">
                          <Thead bg={sidebarBg}>
                            <Tr>
                              <Th>Staff Member</Th>
                              <Th>Role</Th>
                              <Th>Status</Th>
                              <Th>Reset Password</Th>
                              <Th textAlign="right">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredUsers.length === 0 ? (
                              <Tr>
                                <Td colSpan={5} textAlign="center" py={6} color={mutedColor}>
                                  No users found matching filters.
                                </Td>
                              </Tr>
                            ) : (
                              filteredUsers.map((user) => (
                                <Tr key={user._id || user.email} _hover={{ bg: tableHoverBg }}>
                                  <Td>
                                    <Text fontWeight="semibold" fontSize="xs">
                                      {user.fullName || user.username}
                                    </Text>
                                    <Text fontSize="2xs" color="gray.500">{user.email}</Text>
                                  </Td>
                                  <Td>
                                    <Select
                                      size="xs"
                                      w="130px"
                                      value={user.role || 'IT Staff'}
                                      onChange={(e) => updateUser(user, { role: e.target.value })}
                                    >
                                      <option value="IT Staff">IT Staff</option>
                                      <option value="IT Team Leader">IT Team Leader</option>
                                      <option value="IT Manager">IT Manager</option>
                                      <option value="IT Officer">IT Officer</option>
                                      <option value="admin">admin</option>
                                      <option value={user.role}>{user.role}</option>
                                    </Select>
                                  </Td>
                                  <Td>
                                    <Select
                                      size="xs"
                                      w="100px"
                                      value={user.status || 'active'}
                                      colorScheme={user.status === 'active' ? 'green' : 'red'}
                                      onChange={(e) => updateUser(user, { status: e.target.value })}
                                    >
                                      <option value="active">🟢 active</option>
                                      <option value="inactive">🔴 inactive</option>
                                    </Select>
                                  </Td>
                                  <Td>
                                    <HStack spacing={1.5} maxW="200px">
                                      <Input
                                        size="xs"
                                        type="password"
                                        placeholder="New pass..."
                                        value={passwordDrafts[user._id] || ''}
                                        onChange={(e) => setPasswordDrafts({ ...passwordDrafts, [user._id]: e.target.value })}
                                      />
                                      <Button
                                        size="xs"
                                        colorScheme="blue"
                                        onClick={() => handleResetPassword(user)}
                                        isDisabled={!passwordDrafts[user._id]}
                                      >
                                        Set
                                      </Button>
                                    </HStack>
                                  </Td>
                                  <Td textAlign="right">
                                    <Tooltip label="Permanently Delete User">
                                      <IconButton
                                        aria-label="Delete user"
                                        icon={<FiTrash2 />}
                                        size="xs"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => openDeleteModal(user)}
                                      />
                                    </Tooltip>
                                  </Td>
                                </Tr>
                              ))
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </VStack>
              )}
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Permanently Delete Account
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to permanently delete account <strong>"{deletingUser?.email || deletingUser?.username}"</strong>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={confirmDeleteUser}>Delete Account</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
