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

// Global shared imports
import NoticeBoardPanel from '../../components/NoticeBoardPanel';
import NotesLauncher from '../../components/notes/NotesLauncher';
import ChatLauncher from '../../components/chat/ChatLauncher';
import { useUserStore } from '../../store/user';
import { filterTasksForPersona, getItPersona } from './utils/itRbac';
import { buildTaskReminders } from './utils/itWorkflow';

const TARGET_STORAGE_KEY = 'tradethiopia_weekly_target';
const WEEKLY_TARGET_POINTS = 40;

export default function ITDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'dashboard';

  const { currentUser, users, loading: usersLoading, error: usersError, fetchUsers, clearUser } = useUserStore();
  const token = currentUser?.token;
  const persona = getItPersona(currentUser || {});

  const [activeSection, setActiveSection] = useState(activeTabFromUrl);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

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

  const pageBg = useColorModeValue('#f4f7fb', 'gray.950');
  const heroBg = useColorModeValue('white', 'gray.900');
  const heroBorder = useColorModeValue('rgba(15, 23, 42, 0.08)', 'whiteAlpha.200');
  const heroShadow = useColorModeValue('0 20px 60px rgba(15, 23, 42, 0.08)', '0 20px 60px rgba(0, 0, 0, 0.32)');
  const statBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const statBorder = useColorModeValue('gray.100', 'whiteAlpha.200');
  const controlBg = useColorModeValue('gray.50', 'gray.800');
  const contentBg = useColorModeValue('transparent', 'transparent');
  const softText = useColorModeValue('gray.600', 'gray.400');
  const visibleTasks = filterTasksForPersona(tasks, persona, currentUser || {});
  const visibleTaskIds = new Set(visibleTasks.map((task) => String(task._id || task.id)));
  const visibleReports = persona.canViewAllTasks
    ? reports
    : reports.filter((report) => {
      const taskRef = report.taskRef?._id || report.taskRef || report.taskId;
      return taskRef && visibleTaskIds.has(String(taskRef));
    });
  const dueSoonCount = visibleTasks.filter((task) => {
    if (!task.endDate || task.status === 'done') return false;
    const due = new Date(task.endDate).getTime();
    const now = Date.now();
    return due >= now && due - now <= 3 * 24 * 60 * 60 * 1000;
  }).length;
  const reminderCount = buildTaskReminders(visibleTasks).length;
  const dashboardStats = [
    {
      label: 'Visible tasks',
      value: visibleTasks.length,
      helper: `${visibleTasks.filter((task) => task.status === 'ongoing').length} in progress`,
      icon: FiActivity,
      color: 'blue',
    },
    {
      label: 'Completed',
      value: visibleTasks.filter((task) => task.status === 'done').length,
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
            tasks={visibleTasks}
            weeklyTarget={weeklyTarget}
            setWeeklyTarget={setWeeklyTarget}
            fetchTasks={fetchTasks}
            permissions={persona}
          />
        );
      case 'projects':
        return (
          <ITProjectWorkspace
            tasks={visibleTasks}
            loading={loadingTasks}
            fetchTasks={fetchTasks}
            permissions={persona}
          />
        );
      case 'performance':
        return <PerformanceTab tasks={visibleTasks} users={users} />;
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
        return <ITRemindersPanel tasks={visibleTasks} fetchTasks={fetchTasks} />;
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
    <Flex minH="100vh" bg={pageBg} w="100%" overflowX="hidden">
      <ITSidebar
        activeSection={activeSection}
        setActiveSection={handleTabChange}
        setModalOpen={setModalOpen}
        handleLogout={handleLogout}
        permissions={persona}
        reminderCount={reminderCount}
      />

      <Box flex="1" p={{ base: 4, md: 6, xl: 8 }} minW={0}>
        {activeSection === 'notice-board' ? (
          <NoticeBoardPanel title="IT Notice Board" subtitle="Internal announcements and alerts" />
        ) : (
          <>
            <Box
              bg={heroBg}
              border="1px solid"
              borderColor={heroBorder}
              borderRadius="16px"
              boxShadow={heroShadow}
              p={{ base: 4, md: 6 }}
              mb={6}
            >
              <Flex justify="space-between" align={{ base: 'stretch', lg: 'flex-start' }} direction={{ base: 'column', lg: 'row' }} gap={5}>
                <Box maxW="760px">
                  <HStack spacing={3} wrap="wrap" mb={2}>
                    <Badge colorScheme="cyan" borderRadius="full" px={3} py={1}>
                      IT Operations Command
                    </Badge>
                    <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                      {persona.label}
                    </Badge>
                  </HStack>
                  <Heading size={{ base: 'lg', md: 'xl' }} letterSpacing="0">
                    IT Department Dashboard
                  </Heading>
                  <Text color={softText} mt={2} fontSize={{ base: 'sm', md: 'md' }}>
                    {persona.description}
                  </Text>
                </Box>
                <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', lg: 'flex-end' }}>
                  <Select
                    size="sm"
                    value={activeSection}
                    onChange={(event) => handleTabChange(event.target.value)}
                    maxW="190px"
                    borderRadius="10px"
                    bg={controlBg}
                  >
                    <option value="dashboard">Overview</option>
                    <option value="projects">Projects</option>
                    <option value="performance">Performance</option>
                    <option value="kpi">KPI</option>
                    <option value="reports">Reports</option>
                    <option value="notes">Notes</option>
                    <option value="reminders">Reminders</option>
                    <option value="profile">Profile</option>
                    {persona.canManageUsers && <option value="admin">Admin</option>}
                    {persona.canManageUsers && <option value="admin-users">User Management</option>}
                  </Select>
                  <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setModalOpen(true)} isDisabled={!persona.canCreateTasks} borderRadius="10px">
                    New Task
                  </Button>
                  <Button colorScheme="teal" variant="outline" onClick={() => navigate("/requests")} borderRadius="10px">
                    Requests
                  </Button>
                  <ChatLauncher
                    icon={<FiMessageSquare />}
                    ariaLabel="Open IT workspace chat"
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

              <Box mt={6}>
                <ITCollapsibleSection
                  title="Operational Snapshot"
                  subtitle="Collapse or expand the live command metrics."
                  defaultOpen
                  bodyProps={{ pt: 0 }}
                >
                  <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
                    {dashboardStats.map((stat) => (
                      <Box
                        key={stat.label}
                        border="1px solid"
                        borderColor={statBorder}
                        bg={statBg}
                        borderRadius="12px"
                        p={4}
                      >
                        <HStack justify="space-between" align="flex-start">
                          <Stat>
                            <StatLabel color={softText}>{stat.label}</StatLabel>
                            <StatNumber fontSize="2xl">{stat.value}</StatNumber>
                            <Text fontSize="xs" color={softText}>{stat.helper}</Text>
                          </Stat>
                          <Flex
                            boxSize="38px"
                            borderRadius="12px"
                            align="center"
                            justify="center"
                            bg={`${stat.color}.50`}
                            color={`${stat.color}.500`}
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
            {dueSoonCount > 0 && (
              <Alert status="info" borderRadius="12px" mb={6}>
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
