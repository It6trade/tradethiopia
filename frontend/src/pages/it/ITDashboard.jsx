import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiActivity, FiCheckCircle, FiClock, FiMessageSquare, FiPlus, FiUsers } from 'react-icons/fi';
import axios from 'axios';

// Component imports
import ITSidebar from './components/ITSidebar';
import OverviewTab from './components/OverviewTab';
import ITProjectWorkspace from './components/ITProjectWorkspace';
import PerformanceTab from './components/PerformanceTab';
import KPITab from './components/KPITab';
import ReportsTab from './components/ReportsTab';
import AddTaskForm from './components/AddTaskForm';
import ITProfilePanel from './components/ITProfilePanel';
import ITNotesPanel from './components/ITNotesPanel';
import ITAdminPanel from './components/ITAdminPanel';
import ITCollapsibleSection from './components/ITCollapsibleSection';
import ITRemindersPanel from './components/ITRemindersPanel';
import TicketManagementTab from './components/TicketManagementTab';

// Global shared imports
import NoticeBoardPanel from '../../components/NoticeBoardPanel';
import NotesLauncher from '../../components/notes/NotesLauncher';
import ChatLauncher from '../../components/chat/ChatLauncher';
import NotificationBall from '../../components/notifications/NotificationBall';
import { useUserStore } from '../../store/user';
import { filterTasksForPersona, getItPersona } from './utils/itRbac';
import { buildTaskReminders, filterReadReminders } from './utils/itWorkflow';

const TARGET_STORAGE_KEY = 'tradethiopia_weekly_target';
const WEEKLY_TARGET_POINTS = 40;

const isSupportTicketTask = (task = {}) => (
  task.requestSource === 'employee_call'
  || Boolean(task.supportRequestNote)
  || Boolean(task.requestedAt)
  || (task.ticketRecords || []).length > 0
);

export default function ITDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'dashboard';
  const focusedTaskId = searchParams.get('task') || '';
  const focusedCommentId = searchParams.get('comment') || '';

  const { currentUser, users, loading: usersLoading, error: usersError, fetchUsers, clearUser } = useUserStore();
  const token = currentUser?.token;
  const persona = getItPersona(currentUser || {});

  const [activeSection, setActiveSection] = useState(activeTabFromUrl);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reminderReadVersion, setReminderReadVersion] = useState(0);

  const [weeklyTarget, setWeeklyTarget] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(TARGET_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return WEEKLY_TARGET_POINTS;
  });

  const pageBg = useColorModeValue('#eef4fb', '#07111f');
  const pagePattern = useColorModeValue(
    'linear-gradient(135deg, rgba(14,165,233,0.10), transparent 28%), linear-gradient(225deg, rgba(16,185,129,0.10), transparent 30%), linear-gradient(180deg, #f8fafc, #eef4fb)',
    'linear-gradient(135deg, rgba(14,165,233,0.14), transparent 28%), linear-gradient(225deg, rgba(16,185,129,0.10), transparent 30%), linear-gradient(180deg, #07111f, #0f172a)'
  );
  const heroBg = useColorModeValue(
    'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.92) 54%, rgba(240,253,250,0.94))',
    'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92) 54%, rgba(12,74,110,0.30))'
  );
  const heroBorder = useColorModeValue('rgba(37, 99, 235, 0.16)', 'whiteAlpha.200');
  const heroShadow = useColorModeValue('0 24px 70px rgba(15, 23, 42, 0.13)', '0 24px 70px rgba(0, 0, 0, 0.42)');
  const statBg = useColorModeValue('rgba(255,255,255,0.82)', 'whiteAlpha.100');
  const statBorder = useColorModeValue('rgba(37, 99, 235, 0.12)', 'whiteAlpha.200');
  const statShadow = useColorModeValue('0 18px 36px rgba(15, 23, 42, 0.09)', '0 18px 36px rgba(0, 0, 0, 0.28)');
  const controlBg = useColorModeValue('whiteAlpha.900', 'whiteAlpha.100');
  const toolbarBg = useColorModeValue('rgba(255,255,255,0.72)', 'rgba(15,23,42,0.62)');
  const toolbarShadow = useColorModeValue('0 14px 34px rgba(15,23,42,0.08)', '0 14px 34px rgba(0,0,0,0.24)');
  const gridOpacity = useColorModeValue(0.46, 0.22);
  const contentBg = useColorModeValue('transparent', 'transparent');
  const softText = useColorModeValue('gray.600', 'gray.400');
  const toolbarIconColor = useColorModeValue('#1e293b', '#e2e8f0');
  const visibleTasks = filterTasksForPersona(tasks, persona, currentUser || {});
  const nonTicketVisibleTasks = visibleTasks.filter((task) => !isSupportTicketTask(task));
  const visibleTaskIds = new Set(visibleTasks.map((task) => String(task._id || task.id)));
  const visibleReports = persona.canViewAllTasks
    ? reports
    : reports.filter((report) => {
      const taskRef = report.taskRef?._id || report.taskRef || report.taskId;
      return taskRef && visibleTaskIds.has(String(taskRef));
    });
  const dueSoonCount = nonTicketVisibleTasks.filter((task) => {
    if (!task.endDate || task.status === 'done') return false;
    const due = new Date(task.endDate).getTime();
    const now = Date.now();
    return due >= now && due - now <= 3 * 24 * 60 * 60 * 1000;
  }).length;
  const reminderCount = filterReadReminders(buildTaskReminders(visibleTasks), currentUser || {}).length;
  const dashboardStats = [
    {
      label: 'Visible tasks',
      value: nonTicketVisibleTasks.length,
      helper: `${nonTicketVisibleTasks.filter((task) => task.status === 'ongoing').length} in progress`,
      icon: FiActivity,
      color: 'blue',
    },
    {
      label: 'Completed',
      value: nonTicketVisibleTasks.filter((task) => task.status === 'done').length,
      helper: 'approved work stream',
      icon: FiCheckCircle,
      color: 'green',
    },
    {
      label: 'Due soon',
      value: dueSoonCount,
      helper: 'next 3 days',
      icon: FiClock,
      color: 'orange',
    },
    {
      label: 'IT users',
      value: users.filter((user) => String(user.role || '').toLowerCase().includes('it')).length,
      helper: persona.canManageUsers ? 'managed directory' : 'team directory',
      icon: FiUsers,
      color: 'purple',
    },
  ];

  // Sync tab status with URL query parameters
  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    setActiveSection(['internal', 'external'].includes(tab) ? 'projects' : tab);
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    if (newTab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
    setActiveSection(newTab);
  };

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoadingTasks(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/it`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTasks(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [token]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/it/reports/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReports(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchReports();
    }
  }, [token, fetchTasks, fetchReports]);

  useEffect(() => {
    if (users.length === 0 && !usersLoading && !usersError) {
      fetchUsers();
    }
  }, [users.length, usersLoading, usersError, fetchUsers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(weeklyTarget));
    } catch (err) {
      console.warn('Unable to persist weekly target', err);
    }
  }, [weeklyTarget]);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    localStorage.removeItem('infoStatus');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <OverviewTab
            tasks={nonTicketVisibleTasks}
            weeklyTarget={weeklyTarget}
            setWeeklyTarget={setWeeklyTarget}
            fetchTasks={fetchTasks}
            permissions={persona}
          />
        );
      case 'projects':
        return (
          <ITProjectWorkspace
            tasks={nonTicketVisibleTasks}
            loading={loadingTasks}
            fetchTasks={fetchTasks}
            permissions={persona}
            focusedTaskId={focusedTaskId}
            focusedCommentId={focusedCommentId}
          />
        );
      case 'tickets':
        return (
          <TicketManagementTab
            tasks={visibleTasks}
            users={users}
            currentUser={currentUser}
            persona={persona}
            fetchTasks={fetchTasks}
          />
        );
      case 'performance':
        return <PerformanceTab tasks={visibleTasks} users={users} persona={persona} currentUser={currentUser} />;
      case 'kpi':
        return <KPITab users={users} usersLoading={usersLoading} tasks={visibleTasks} fetchTasks={fetchTasks} />;
      case 'reports':
        return (
          <ReportsTab
            reports={visibleReports}
            loading={loadingReports}
            fetchReports={fetchReports}
          />
        );
      case 'notes':
        return <ITNotesPanel user={currentUser} />;
      case 'reminders':
        return (
          <ITRemindersPanel
            tasks={visibleTasks}
            fetchTasks={fetchTasks}
            onReminderRead={() => setReminderReadVersion((value) => value + 1)}
          />
        );
      case 'profile':
        return <ITProfilePanel user={currentUser} persona={persona} tasks={visibleTasks} />;
      case 'admin':
        return persona.canManageUsers ? (
          <ITAdminPanel tasks={tasks} users={users} refreshUsers={fetchUsers} />
        ) : (
          <Alert status="warning" borderRadius="xl">
            <AlertIcon />
            This area is available only to IT Manager/Admin users.
          </Alert>
        );
      case 'admin-users':
        return persona.canManageUsers ? (
          <ITAdminPanel tasks={tasks} users={users} refreshUsers={fetchUsers} initialPanel="users" />
        ) : (
          <Alert status="warning" borderRadius="xl">
            <AlertIcon />
            User Management is available only to IT Manager/Admin users.
          </Alert>
        );
      default:
        return (
          <OverviewTab
            tasks={visibleTasks}
            weeklyTarget={weeklyTarget}
            setWeeklyTarget={setWeeklyTarget}
            fetchTasks={fetchTasks}
            permissions={persona}
          />
        );
    }
  };

  return (
    <Flex
      minH="100vh"
      bg={pageBg}
      bgImage={pagePattern}
      w="100%"
      overflowX="hidden"
      fontSize={{ base: 'sm', xl: '0.94rem' }}
    >
      <ITSidebar
        activeSection={activeSection}
        setActiveSection={handleTabChange}
        setModalOpen={setModalOpen}
        handleLogout={handleLogout}
        permissions={persona}
        reminderCount={reminderCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <Box
        flex="1"
        ml={{ base: '76px', lg: isSidebarCollapsed ? '78px' : '244px' }}
        p={{ base: 3, md: 4, xl: 4 }}
        minW={0}
        w={{ base: 'calc(100% - 76px)', lg: isSidebarCollapsed ? 'calc(100% - 78px)' : 'calc(100% - 244px)' }}
        transition="margin-left 0.22s ease, width 0.22s ease"
      >
        {activeSection === 'notice-board' ? (
          <NoticeBoardPanel title="IT Notice Board" subtitle="Internal announcements and alerts" />
        ) : (
          <>
            <Box
              bg={heroBg}
              border="1px solid"
              borderColor={heroBorder}
              borderRadius={{ base: '18px', md: '22px' }}
              boxShadow={heroShadow}
              backdropFilter="blur(18px)"
              p={{ base: 4, md: 4 }}
              mb={4}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={gridOpacity}
                pointerEvents="none"
                bgImage="linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)"
                bgSize="38px 38px"
              />
              <Box position="relative">
              <Flex justify="space-between" align={{ base: 'stretch', lg: 'flex-start' }} direction={{ base: 'column', lg: 'row' }} gap={3}>
                <Box maxW="680px">
                  <HStack spacing={2} wrap="wrap" mb={2}>
                    <Badge colorScheme="cyan" borderRadius="full" px={2.5} py={0.5} fontSize="10px" boxShadow="0 8px 18px rgba(14, 165, 233, 0.18)">
                      IT Operations Command
                    </Badge>
                    <Badge colorScheme="purple" borderRadius="full" px={2.5} py={0.5} fontSize="10px" boxShadow="0 8px 18px rgba(124, 58, 237, 0.14)">
                      {persona.label}
                    </Badge>
                  </HStack>
                  <Heading size={{ base: 'md', md: 'lg' }} letterSpacing="0" lineHeight="1.12" fontWeight="750">
                    IT Department Dashboard
                  </Heading>
                  <Text color={softText} mt={2} fontSize={{ base: 'sm', xl: '13px' }}>
                    {persona.description}
                  </Text>
                </Box>
                <HStack
                  spacing={2}
                  flexWrap="wrap"
                  justify={{ base: 'flex-start', lg: 'flex-end' }}
                  bg={toolbarBg}
                  border="1px solid"
                  borderColor={heroBorder}
                  borderRadius="16px"
                  p={2}
                  boxShadow={toolbarShadow}
                  backdropFilter="blur(14px)"
                >
                  <Select
                    size="sm"
                    value={activeSection}
                    onChange={(event) => handleTabChange(event.target.value)}
                    maxW="180px"
                    borderRadius="12px"
                    bg={controlBg}
                    borderColor={heroBorder}
                    fontSize="sm"
                  >
                    <option value="dashboard">Overview</option>
                    <option value="projects">Projects</option>
                    <option value="tickets">Tickets</option>
                    <option value="performance">Performance</option>
                    <option value="kpi">KPI</option>
                    <option value="reports">Reports</option>
                    <option value="notes">Notes</option>
                    <option value="reminders">Reminders</option>
                    <option value="profile">Profile</option>
                    {persona.canManageUsers && <option value="admin">Admin</option>}
                    {persona.canManageUsers && <option value="admin-users">User Management</option>}
                  </Select>
                  <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setModalOpen(true)} isDisabled={!persona.canCreateTasks} borderRadius="12px" boxShadow="0 12px 24px rgba(37, 99, 235, 0.20)">
                    New Task
                  </Button>
                  <Button size="sm" colorScheme="teal" variant="outline" onClick={() => navigate("/requests")} borderRadius="12px" bg={controlBg}>
                    Requests
                  </Button>
                  <NotificationBall iconColor={toolbarIconColor} />
                  <ChatLauncher
                    icon={<FiMessageSquare />}
                    ariaLabel="Open IT workspace chat"
                    preferredView="it"
                    iconButtonProps={{
                      size: 'sm',
                      variant: 'ghost',
                      colorScheme: 'blue',
                      borderRadius: 'full',
                    }}
                  />
                  <NotesLauncher
                    buttonProps={{
                      size: 'sm',
                      variant: 'ghost',
                      colorScheme: 'blue',
                      'aria-label': 'Notes',
                    }}
                    tooltipLabel="Notes"
                  />
                </HStack>
              </Flex>

              <Box mt={4}>
                <ITCollapsibleSection
                  title="Operational Snapshot"
                  subtitle="Collapse or expand the live command metrics."
                  defaultOpen
                  bodyProps={{ pt: 0 }}
                >
                  <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3}>
                    {dashboardStats.map((stat) => (
                      <Box
                        key={stat.label}
                        border="1px solid"
                        borderColor={statBorder}
                        bg={statBg}
                        borderRadius="14px"
                        p={3}
                        boxShadow={statShadow}
                        backdropFilter="blur(14px)"
                        transition="transform 0.18s ease, box-shadow 0.18s ease"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: heroShadow }}
                      >
                        <HStack justify="space-between" align="flex-start">
                          <Stat>
                            <StatLabel color={softText} fontWeight="650" fontSize="xs">{stat.label}</StatLabel>
                            <StatNumber fontSize={{ base: '2xl', xl: '2xl' }} lineHeight="1.1" fontWeight="750">{stat.value}</StatNumber>
                            <Text fontSize="xs" color={softText}>{stat.helper}</Text>
                          </Stat>
                          <Flex
                            boxSize="40px"
                            borderRadius="14px"
                            align="center"
                            justify="center"
                            bg={`${stat.color}.50`}
                            color={`${stat.color}.500`}
                            boxShadow="inset 0 0 0 1px rgba(255,255,255,0.72)"
                          >
                            <Icon as={stat.icon} boxSize={5} />
                          </Flex>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </ITCollapsibleSection>
              </Box>
              </Box>
            </Box>
            {dueSoonCount > 0 && (
              <Alert status="info" borderRadius="16px" mb={6} boxShadow={statShadow}>
                <AlertIcon />
                {dueSoonCount} assigned IT task{dueSoonCount === 1 ? '' : 's'} due within the next 3 days.
              </Alert>
            )}
            <Box
              bg={contentBg}
              borderRadius="16px"
            >
              {renderContent()}
            </Box>
          </>
        )}
      </Box>

      <AddTaskForm
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onDone={fetchTasks}
      />
    </Flex>
  );
}
