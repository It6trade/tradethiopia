import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeRole, useUserStore } from '../../store/user';
import {
  Avatar,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
  useColorModeValue,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiBarChart2,
  FiChevronRight,
  FiFileText,
  FiHome,
  FiLayers,
  FiList,
  FiLogOut,
  FiMoon,
  FiPlus,
  FiPlusCircle,
  FiPieChart,
  FiSearch,
  FiSun,
  FiTarget,
  FiMessageSquare,
} from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import KpiScorecardSection from '../kpi/KpiScorecardSection';
import ChatLauncher from '../chat/ChatLauncher';

const INTERNAL_PROJECTS = [
  'Tradeethiopian.com',
  'Tradethiopia.com',
  'TESBINN',
  'TRADEXTV.com',
  'Trainings',
  'Documentation',
  'Meetings',
  'Maintenance',
];
const INTERNAL_SUBTASKS = [
  'Functionality',
  'Features',
  'Update',
  'Troubleshoot',
  'Renewal',
  'AI/ML',
];
const EXTERNAL_DELIVERABLES = [
  'Website',
  'Logo',
  'Company Profile',
  'Banner',
  'Brochure',
  'Roll-up',
  'Flyers',
  'Business Cards',
  'Letterheads',
];
const EXTERNAL_SUBTASKS = ['New', 'Update', 'Comment', 'Renewal'];
const WEEKLY_TARGET_POINTS = 40;
const TASK_STORAGE_KEY = 'tradethiopia_it_tasks';
const TARGET_STORAGE_KEY = 'tradethiopia_weekly_target';
import NoticeBoardPanel from '../NoticeBoardPanel';
import NotesLauncher from '../notes/NotesLauncher';

const STATUS_PROGRESS = {
  pending: 25,
  ongoing: 65,
  done: 100,
};

const INITIAL_TASKS = [
  {
    id: 'int-1',
    type: 'internal',
    target: 'Tradeethiopian.com',
    category: 'Functionality',
    title: 'Finalize checkout reconciliation audit',
    assignee: 'Selam Desta',
    status: 'done',
    points: 8,
    progress: 100,
    dueDate: '2025-12-05',
    notes: 'Validated payment gateway and refund logic.',
  },
  {
    id: 'int-2',
    type: 'internal',
    target: 'Tradethiopia.com',
    category: 'AI/ML',
    title: 'Prototype intent-driven chatbot',
    assignee: 'Amanuel Bekele',
    status: 'ongoing',
    points: 5,
    progress: 70,
    dueDate: '2025-12-10',
    notes: 'Currently tuning dialog states.',
  },
  {
    id: 'int-3',
    type: 'internal',
    target: 'TESBINN',
    category: 'Troubleshoot',
    title: 'Investigate streaming latency',
    assignee: 'Lemlem Gashaw',
    status: 'pending',
    points: 4,
    progress: 20,
    dueDate: '2025-12-14',
    notes: 'Needs edge cache review.',
  },
  {
    id: 'ext-1',
    type: 'external',
    target: 'Logo',
    category: 'New',
    title: 'Create brand mark for Tradethiopia TV',
    assignee: 'Martha Tadesse',
    status: 'done',
    points: 3,
    progress: 100,
    dueDate: '2025-12-04',
    notes: 'Delivered vector asset and style sheet.',
  },
  {
    id: 'ext-2',
    type: 'external',
    target: 'Website',
    category: 'Update',
    title: 'Refresh Tradeethiopian.com hero assets',
    assignee: 'Kebede Dagnachew',
    status: 'ongoing',
    points: 6,
    progress: 55,
    dueDate: '2025-12-08',
    notes: 'Awaiting graphics sign-off.',
  },
  {
    id: 'ext-3',
    type: 'external',
    target: 'Brochure',
    category: 'Renewal',
    title: 'Deliver updated hit-rate brochure',
    assignee: 'Selam Desta',
    status: 'ongoing',
    points: 4,
    progress: 45,
    dueDate: '2025-12-12',
    notes: 'Working with content team.',
  },
];

const SidebarButton = ({ label, icon: Icon, isActive, onClick, tooltip }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const color = isActive ? 'blue.500' : useColorModeValue('gray.600', 'gray.300');
  return (
    <Tooltip label={tooltip || label} placement="right" hasArrow>
      <Button
        onClick={onClick}
        leftIcon={<Icon />}
        justifyContent="flex-start"
        variant="ghost"
        color={color}
        fontWeight={isActive ? 'bold' : 'medium'}
        bg={isActive ? activeBg : 'transparent'}
        borderRadius="xl"
        w="100%"
        _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
      >
        <Text display={{ base: 'none', lg: 'inline' }}>{label}</Text>
      </Button>
    </Tooltip>
  );
};

const TaskTable = ({ tasks, onToggleStatus, onUpdatePoints, emptyMessage, isCompact }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingPoints, setEditingPoints] = useState(1);

  const statusColor = (status) => {
    if (status === 'done') return 'green';
    if (status === 'ongoing') return 'blue';
    return 'yellow';
  };

  const startEditing = (taskId, currentPoints) => {
    setEditingTaskId(taskId);
    setEditingPoints(currentPoints || 1);
  };

  const savePoints = (taskId) => {
    const points = parseInt(editingPoints);
    if (!isNaN(points) && points >= 1 && onUpdatePoints) {
      onUpdatePoints(taskId, points);
      setEditingTaskId(null);
      setEditingPoints(1);
    }
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingPoints(1);
  };

  return (
    <TableContainer>
      <Table variant="simple" size={isCompact ? 'sm' : 'md'}>
        <Thead>
          <Tr>
            <Th>Task</Th>
            <Th>Type</Th>
            <Th>Category</Th>
            <Th>Points</Th>
            <Th>Status</Th>
            <Th>Assignee</Th>
            <Th>Due</Th>
            <Th textAlign="right">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tasks.length === 0 ? (
            <Tr>
              <Td colSpan={8} textAlign="center" py={10}>
                <Text color="gray.500">{emptyMessage}</Text>
              </Td>
            </Tr>
          ) : (
            tasks.map((task) => (
              <Tr key={task.id}>
                <Td>
                  <Text fontWeight="semibold">{task.title}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {task.target}
                  </Text>
                </Td>
                <Td>
                  <Tag size="sm" colorScheme={task.type === 'internal' ? 'blue' : 'purple'}>
                    {task.type === 'internal' ? 'Internal' : 'External'}
                  </Tag>
                </Td>
                <Td>{task.category}</Td>
                <Td>
                  {editingTaskId === task.id && task.status === 'done' ? (
                    <HStack spacing={2}>
                      <NumberInput
                        size="sm"
                        value={editingPoints}
                        min={1}
                        max={100}
                        w="80px"
                        onChange={(_, valueAsNumber) => setEditingPoints(valueAsNumber || 1)}
                      >
                        <NumberInputField />
                      </NumberInput>
                      <Button size="xs" colorScheme="green" onClick={() => savePoints(task.id)}>
                        Save
                      </Button>
                      <Button size="xs" variant="ghost" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <>
                      <Text fontWeight="bold">{task.points}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {task.progress}% done
                      </Text>
                      {task.status === 'done' && onUpdatePoints && (
                        <Button
                          size="xs"
                          variant="link"
                          colorScheme="blue"
                          mt={1}
                          onClick={() => startEditing(task.id, task.points)}
                        >
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={statusColor(task.status)}>{task.status}</Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Avatar size="xs" name={task.assignee} />
                    <Text fontSize="sm">{task.assignee}</Text>
                  </HStack>
                </Td>
                <Td>{task.dueDate}</Td>
                <Td textAlign="right">
                  <Button
                    size="sm"
                    colorScheme={task.status === 'done' ? 'gray' : 'green'}
                    variant="outline"
                    rightIcon={<FiChevronRight />}
                    onClick={() => onToggleStatus(task.id)}
                  >
                    {task.status === 'done' ? 'Reopen' : 'Mark Done'}
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const TaskModal = ({ isOpen, onClose, onSubmit }) => {
  const [formState, setFormState] = useState({
    type: 'internal',
    target: INTERNAL_PROJECTS[0],
    category: INTERNAL_SUBTASKS[0],
    assignee: '',
    points: 1,
    status: 'pending',
    dueDate: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setFormState({
        type: 'internal',
        target: INTERNAL_PROJECTS[0],
        category: INTERNAL_SUBTASKS[0],
        assignee: '',
        points: 1,
        status: 'pending',
        dueDate: '',
      });
    }
  }, [isOpen]);

  const handleTypeChange = (value) => {
    setFormState((prev) => ({
      ...prev,
      type: value,
      target: value === 'internal' ? INTERNAL_PROJECTS[0] : EXTERNAL_DELIVERABLES[0],
      category: value === 'internal' ? INTERNAL_SUBTASKS[0] : EXTERNAL_SUBTASKS[0],
    }));
  };

  const handleSubmit = () => {
    if (!formState.assignee.trim() || !formState.dueDate) {
      return;
    }

    const derivedTitle = `${formState.target} • ${formState.category}`;
    const newTask = {
      id: `task-${Date.now()}`,
      ...formState,
      progress: STATUS_PROGRESS[formState.status] || 30,
      points: Number(formState.points) || 1,
      title: derivedTitle,
    };

    onSubmit(newTask);
    onClose();
  };

  const currentTargets = formState.type === 'internal' ? INTERNAL_PROJECTS : EXTERNAL_DELIVERABLES;
  const categoryOptions = formState.type === 'internal' ? INTERNAL_SUBTASKS : EXTERNAL_SUBTASKS;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" bg={useColorModeValue('white', 'gray.800')}>
        <ModalHeader>
          <Heading size="lg">Add New Task</Heading>
          <Text fontSize="sm" color="gray.500">
            Capture the task focus, responsible owner, and delivery expectations.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Task Type</FormLabel>
              <Select value={formState.type} onChange={(e) => handleTypeChange(e.target.value)}>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{formState.type === 'internal' ? 'Project' : 'Deliverable'}</FormLabel>
              <Select
                value={formState.target}
                onChange={(e) => setFormState((prev) => ({ ...prev, target: e.target.value }))}
              >
                {currentTargets.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Sub-task Category</FormLabel>
              <Select
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Assignee</FormLabel>
              <Input
                value={formState.assignee}
                onChange={(e) => setFormState((prev) => ({ ...prev, assignee: e.target.value }))}
                placeholder="Who will complete this?"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Points (default 1)</FormLabel>
              <NumberInput
                value={formState.points}
                min={1}
                max={20}
                onChange={(_, valueAsNumber) =>
                  setFormState((prev) => ({ ...prev, points: valueAsNumber || 1 }))
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={formState.status}
                onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="done">Done</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Due Date</FormLabel>
              <Input
                type="date"
                value={formState.dueDate}
                onChange={(e) => setFormState((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </FormControl>

          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} leftIcon={<FiPlus />}>
            Save Task
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ITLayout = ({ initialTab = 'dashboard' }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const users = useUserStore((state) => state.users);
  const usersLoading = useUserStore((state) => state.loading);
  const usersError = useUserStore((state) => state.error);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const [activeSection, setActiveSection] = useState(initialTab);
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(TASK_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Failed to parse stored IT tasks', err);
      }
    }
    return INITIAL_TASKS;
  });
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    progress: 'all',
    query: '',
  });
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

  const cardBg = useColorModeValue('white', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const handleAddTask = (payload) => {
    setTasks((prev) => [payload, ...prev]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn('Unable to persist IT tasks', err);
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(weeklyTarget));
    } catch (err) {
      console.warn('Unable to persist weekly target', err);
    }
  }, [weeklyTarget]);

  useEffect(() => {
    if (users.length === 0 && !usersLoading && !usersError) {
      fetchUsers();
    }
  }, [users.length, usersLoading, usersError, fetchUsers]);

  const handleToggleStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const isDone = task.status === 'done';
        const nextStatus = isDone ? 'ongoing' : 'done';
        return {
          ...task,
          status: nextStatus,
          progress: STATUS_PROGRESS[nextStatus],
          points: isDone ? task.points : Math.max(task.points, 1),
        };
      })
    );
  };

  const handleUpdatePoints = (taskId, newPoints) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          points: newPoints,
        };
      })
    );
  };

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesType = filters.type === 'all' || task.type === filters.type;
      const matchesCategory = filters.category === 'all' || task.category === filters.category;
      const matchesProgress =
        filters.progress === 'all' ||
        (filters.progress === 'low' && task.progress < 50) ||
        (filters.progress === 'mid' && task.progress >= 50 && task.progress < 100) ||
        (filters.progress === 'complete' && task.progress === 100);
      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        task.title.toLowerCase().includes(query) ||
        task.target.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query);
      return matchesType && matchesCategory && matchesProgress && matchesQuery;
    });
  }, [filters, tasks]);

  const doneTasks = tasks.filter((task) => task.status === 'done');
  const internalPoints = doneTasks
    .filter((task) => task.type === 'internal')
    .reduce((sum, task) => sum + task.points, 0);
  const externalPoints = doneTasks
    .filter((task) => task.type === 'external')
    .reduce((sum, task) => sum + task.points, 0);
  const totalPoints = internalPoints + externalPoints;
  const safeTarget = Math.max(weeklyTarget, 1);
  const progressPercent = Math.min((totalPoints / safeTarget) * 100, 100);
  const targetAchieved = totalPoints >= weeklyTarget;
  const remainingGap = Math.max(weeklyTarget - totalPoints, 0);

  const summaryCards = [
    {
      label: 'Active Tasks',
      value: tasks.length,
      helper: `${doneTasks.length} completed`,
      icon: FiList,
    },
    {
      label: 'Weekly Points',
      value: `${totalPoints}/${weeklyTarget}`,
      helper: targetAchieved ? 'Target achieved' : `${remainingGap} points to go`,
      icon: FiTarget,
    },
    {
      label: 'Internal Focus',
      value: internalPoints,
      helper: 'Internal contributions',
      icon: FiLayers,
    },
    {
      label: 'External Focus',
      value: externalPoints,
      helper: 'External deliveries',
      icon: FiPieChart,
    },
  ];

  const internalTasks = tasks.filter((task) => task.type === 'internal');
  const externalTasks = tasks.filter((task) => task.type === 'external');

  // Dynamic staff pool: Start with default names, then add any unique assignees from tasks
  const defaultStaffPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];
  const staffPool = useMemo(() => {
    // Extract unique assignee names from all tasks
    const assigneesFromTasks = [...new Set(tasks.map((task) => task.assignee).filter(Boolean))];
    // Combine default pool with assignees from tasks, remove duplicates, and sort
    const combinedPool = [...new Set([...defaultStaffPool, ...assigneesFromTasks])].sort();
    return combinedPool;
  }, [tasks]);

  const itUsers = useMemo(
    () => (users || []).filter((user) => normalizeRole(user.role || user.userRole) === 'it'),
    [users]
  );

  const itKpiMembers = useMemo(() => {
    if (itUsers.length) {
      return itUsers.map((user) => {
        const id = user._id || user.id || user.email || user.username || user.fullName || user.name;
        const name = user.fullName || user.username || user.name || user.email || 'IT Staff';
        return { id: String(id || name), name };
      });
    }
    return staffPool.map((name) => ({ id: name, name }));
  }, [itUsers, staffPool]);

  const staffPerformance = useMemo(() => {
    const stats = staffPool.map((name) => {
      const assigned = tasks.filter((task) => task.assignee === name);
      const completed = assigned.filter((task) => task.status === 'done');
      const internal = completed
        .filter((task) => task.type === 'internal')
        .reduce((sum, t) => sum + t.points, 0);
      const external = completed
        .filter((task) => task.type === 'external')
        .reduce((sum, t) => sum + t.points, 0);
      const points = internal + external;
      const performanceScore = Math.min(Math.round((points / WEEKLY_TARGET_POINTS) * 100), 120);
      const contribution =
        internal + external === 0
          ? '0% / 0%'
          : `${Math.round((internal / Math.max(points, 1)) * 100)}% / ${Math.round(
              (external / Math.max(points, 1)) * 100
            )}%`;
      return {
        name,
        assigned: assigned.length,
        completed: completed.length,
        internal,
        external,
        points,
        performanceScore,
        contribution,
      };
    });
    return stats
      .sort((a, b) => b.points - a.points)
      .map((stat, index) => ({ ...stat, rank: index + 1 }));
  }, [tasks, staffPool]);

  const categoryBreakdown = useMemo(() => {
    const tally = {};
    tasks.forEach((task) => {
      const key = `${task.category} (${task.type === 'internal' ? 'Internal' : 'External'})`;
      tally[key] = (tally[key] || 0) + task.points;
    });
    return Object.entries(tally).map(([name, points]) => ({ name, points }));
  }, [tasks]);

  const weeklySeries = [
    { label: 'Mon', points: 4 },
    { label: 'Tue', points: 6 },
    { label: 'Wed', points: 5 },
    { label: 'Thu', points: 7 },
    { label: 'Fri', points: 8 },
    { label: 'Sat', points: 3 },
    { label: 'Sun', points: totalPoints - 33 > 0 ? totalPoints - 33 : 6 },
  ];

  const pieSeries = [
    { name: 'Internal', value: internalPoints },
    { name: 'External', value: externalPoints },
  ];

  const chartColors = ['#3182ce', '#805ad5', '#48bb78', '#ed8936', '#9f7aea'];

  const renderDashboard = () => (
    <VStack spacing={8} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.label} borderRadius="2xl" boxShadow="md" bg={cardBg}>
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">
                      {card.label}
                    </Text>
                    <Heading size="md">{card.value}</Heading>
                    <Text fontSize="xs" color="gray.500">
                      {card.helper}
                    </Text>
                  </VStack>
                  <IconButton
                    aria-label={card.label}
                    icon={<IconComponent />}
                    variant="ghost"
                    size="md"
                    isRound
                    color="blue.500"
                  />
                </HStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.500">
                Weekly target ({weeklyTarget} points)
              </Text>
              <Heading size="lg">
                {totalPoints}/{weeklyTarget} points
              </Heading>
              <Text fontSize="sm" color={targetAchieved ? 'green.400' : 'orange.400'}>
                Target achieved: {targetAchieved ? 'Yes' : 'No'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Remaining gap: {remainingGap}
              </Text>
              <HStack spacing={2} mt={2}>
                <NumberInput
                  size="sm"
                  w="120px"
                  min={5}
                  max={200}
                  value={weeklyTarget}
                  onChange={(_, value) => setWeeklyTarget(value || 0)}
                  clampValueOnBlur
                  borderRadius="lg"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500">
                  Adjust weekly goal
                </Text>
              </HStack>
            </Box>
            <Progress
              value={progressPercent}
              colorScheme={targetAchieved ? 'green' : 'orange'}
              borderRadius="xl"
              size="lg"
              w={{ base: '100%', md: '40%' }}
              hasStripe={!targetAchieved}
            />
          </Flex>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text color="gray.500" fontSize="sm">
              Internal Achievements
            </Text>
            <Heading size="md">{internalTasks.length} tasks</Heading>
            <Text fontSize="xs" color="gray.500">
              {internalPoints} points captured
            </Text>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text color="gray.500" fontSize="sm">
              External Deliverables
            </Text>
            <Heading size="md">{externalTasks.length} tasks</Heading>
            <Text fontSize="xs" color="gray.500">
              {externalPoints} points captured
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader pb={2} px={6}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={4}>
            <Box>
              <Heading size="md">Task System</Heading>
              <Text fontSize="sm" color="gray.500">
                Filter and manage open requests with auto-calculated scores.
              </Text>
            </Box>
            <HStack spacing={2}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiSearch color="gray" />} />
                <Input
                  placeholder="Search tasks"
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="lg"
                />
              </InputGroup>
              <Select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                variant="filled"
                w="150px"
                borderRadius="lg"
              >
                <option value="all">All Types</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
              <Select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                variant="filled"
                w="180px"
                borderRadius="lg"
              >
                <option value="all">All Categories</option>
                {[...new Set([...INTERNAL_SUBTASKS, ...EXTERNAL_SUBTASKS])].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.progress}
                onChange={(e) => setFilters((prev) => ({ ...prev, progress: e.target.value }))}
                variant="filled"
                w="170px"
                borderRadius="lg"
              >
                <option value="all">All Progress</option>
                <option value="low">&lt; 50% progress</option>
                <option value="mid">50-99% progress</option>
                <option value="complete">100% done</option>
              </Select>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody px={6} pt={0}>
          <TaskTable
            tasks={filteredTasks}
            onToggleStatus={handleToggleStatus}
            onUpdatePoints={handleUpdatePoints}
            emptyMessage="No tasks match the filters"
          />
        </CardBody>
      </Card>

    </VStack>
  );

  const renderInternal = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Internal Tasks</Heading>
      <TaskTable
        tasks={internalTasks}
        onToggleStatus={handleToggleStatus}
        onUpdatePoints={handleUpdatePoints}
        emptyMessage="No internal work yet."
        isCompact
      />
    </VStack>
  );

  const renderExternal = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">External Tasks</Heading>
      <TaskTable
        tasks={externalTasks}
        onToggleStatus={handleToggleStatus}
        onUpdatePoints={handleUpdatePoints}
        emptyMessage="No external work yet."
        isCompact
      />
    </VStack>
  );

  const renderPerformance = () => (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
        <Heading size="lg">Individual Performance</Heading>
        <Button leftIcon={<FiBarChart2 />} colorScheme="green" variant="outline">
          Share Snapshot
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Completion Trend
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#E2E8F0', '#2D3748')} />
                <XAxis dataKey="name" stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <YAxis stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, borderColor: borderColor }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Line type="monotone" dataKey="completed" stroke="#48BB78" strokeWidth={3} />
                <Line type="monotone" dataKey="assigned" stroke="#4299E1" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Achievement Points by Staff
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#E2E8F0', '#2D3748')} />
                <XAxis dataKey="name" stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <YAxis stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, borderColor: borderColor }}
                />
                <Bar dataKey="points" fill="#805ad5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader>
          <Heading size="md">Team Breakdown</Heading>
          <Text fontSize="sm" color="gray.500">
            Ranking, assignment health, and self-driven points.
          </Text>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Rank</Th>
                  <Th>Name</Th>
                  <Th>Assigned</Th>
                  <Th>Completed</Th>
                  <Th>Points</Th>
                  <Th>Internal/External</Th>
                  <Th>Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {staffPerformance.map((member) => (
                  <Tr key={member.name}>
                    <Td>{member.rank}</Td>
                    <Td>{member.name}</Td>
                    <Td>{member.assigned}</Td>
                    <Td>{member.completed}</Td>
                    <Td>{member.points}</Td>
                    <Td>
                      <Text fontSize="xs">{member.contribution}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={member.performanceScore >= 80 ? 'green' : 'yellow'}>
                        {member.performanceScore}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderKpi = () => (
    <VStack spacing={6} align="stretch">
      <KpiScorecardSection
        title="IT KPI Scorecard"
        description="Enter each team member's target, achieved amount, core output, and absences to calculate the KPI result."
        storageKey="kpi-it-scores-v1"
        members={itKpiMembers}
        isLoading={usersLoading && itUsers.length === 0}
        nameLabel="IT Staff"
        emptyLabel="No IT staff found."
      />
    </VStack>
  );

  const renderReports = () => (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Weekly IT Report</Heading>
          <Text color="gray.500">
            Snapshot ready for management review with completion detail and charts.
          </Text>
        </VStack>
        <Button leftIcon={<FiFileText />} colorScheme="blue" variant="outline">
          Export Report
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Completed Tasks
            </Text>
            <Heading size="md">{doneTasks.length}</Heading>
            <Text fontSize="xs" color="gray.500">
              Internal: {internalPoints} pts, External: {externalPoints} pts
            </Text>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Weekly Target Status
            </Text>
            <Heading size="md">{targetAchieved ? 'Yes' : 'No'}</Heading>
            <Text fontSize="xs" color="gray.500">
              {targetAchieved ? 'Target met' : `${remainingGap} points short`}
            </Text>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Performance Gap
            </Text>
            <Heading size="md">{remainingGap}</Heading>
            <Text fontSize="xs" color="gray.500">
              Points still required to hit 40.
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader>
          <Heading size="md">Completed Work</Heading>
          <Text fontSize="sm" color="gray.500">
            Internal & external tasks concluded during the week.
          </Text>
        </CardHeader>
        <CardBody>
          <TaskTable
            tasks={doneTasks}
            onToggleStatus={handleToggleStatus}
            onUpdatePoints={handleUpdatePoints}
            emptyMessage="No completed tasks yet."
          />
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardHeader>
            <Heading size="md">Sub-task Categories</Heading>
          </CardHeader>
          <CardBody>
            {categoryBreakdown.slice(0, 5).map((item) => (
              <Flex key={item.name} justify="space-between" py={2}>
                <Text>{item.name}</Text>
                <Text fontWeight="semibold">{item.points}</Text>
              </Flex>
            ))}
            {categoryBreakdown.length === 0 && <Text color="gray.500">No breakdown yet.</Text>}
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Internal vs External Points
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieSeries} dataKey="value" innerRadius={60} outerRadius={90} label>
                  {pieSeries.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Weekly Progress Line
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#E2E8F0', '#2D3748')} />
                <XAxis dataKey="label" stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <YAxis stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="points" stroke="#38b2ac" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader>
          <Heading size="md">Individual Breakdown</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Completed</Th>
                  <Th>Points</Th>
                  <Th>Internal</Th>
                  <Th>External</Th>
                  <Th>Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {staffPerformance.map((member) => (
                  <Tr key={`report-${member.name}`}>
                    <Td>{member.name}</Td>
                    <Td>{member.completed}</Td>
                    <Td>{member.points}</Td>
                    <Td>{member.internal}</Td>
                    <Td>{member.external}</Td>
                    <Td>
                      <Badge colorScheme="green">{member.performanceScore}%</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );

  const contentMap = {
    dashboard: renderDashboard(),
    internal: renderInternal(),
    external: renderExternal(),
    performance: renderPerformance(),
    kpi: renderKpi(),
    reports: renderReports(),
  };

  return (
    <Flex minH="100vh" bg={pageBg} w="100%" overflowX="hidden">
      <Box
        as="aside"
        w={{ base: '80px', lg: '260px' }}
        bg={useColorModeValue('white', 'gray.800')}
        borderRight="1px solid"
        borderColor={borderColor}
        p={{ base: 3, lg: 6 }}
      >
        <VStack spacing={6} align="stretch" h="full">
          <Box textAlign="center">
            <Heading size="md" color="blue.500">
              IT Ops
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Dashboard
            </Text>
          </Box>
          <VStack spacing={2} align="stretch">
            <SidebarButton
              label="Overview"
              icon={FiHome}
              isActive={activeSection === 'dashboard'}
              onClick={() => setActiveSection('dashboard')}
            />
            <SidebarButton
              label="Internal Tasks"
              icon={FiLayers}
              isActive={activeSection === 'internal'}
              onClick={() => setActiveSection('internal')}
            />
            <SidebarButton
              label="External Tasks"
              icon={FiList}
              isActive={activeSection === 'external'}
              onClick={() => setActiveSection('external')}
            />
            <SidebarButton
              label="Performance"
              icon={FiBarChart2}
              isActive={activeSection === 'performance'}
              onClick={() => setActiveSection('performance')}
            />
            <SidebarButton
              label="KPI"
              icon={FiTarget}
              isActive={activeSection === 'kpi'}
              onClick={() => setActiveSection('kpi')}
            />
            <SidebarButton
              label="Reports"
              icon={FiFileText}
              isActive={activeSection === 'reports'}
              onClick={() => setActiveSection('reports')}
            />
          </VStack>
          <Divider />
          <VStack>
            <Button
              leftIcon={<FiPlusCircle />}
              colorScheme="blue"
              w="full"
              borderRadius="xl"
              onClick={() => setModalOpen(true)}
            >
              Add Task
            </Button>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              borderRadius="xl"
              w="full"
            />
            <Button
              leftIcon={<FiLogOut />}
              colorScheme="red"
              variant="outline"
              w="full"
              borderRadius="xl"
              onClick={handleLogout}
            >
              Logout
            </Button>
            
            <Tooltip label="Notice Board" placement="right" hasArrow>
              <Button
                leftIcon={<FiMessageSquare />}
                justifyContent={{ base: 'center', lg: 'flex-start' }}
                variant={activeSection === 'notice-board' ? 'solid' : 'ghost'}
                colorScheme={activeSection === 'notice-board' ? 'teal' : 'gray'}
                onClick={() => setActiveSection('notice-board')}
                w="full"
                size={{ base: 'md', lg: 'lg' }}
                borderRadius="lg"
              >
                <Text display={{ base: 'none', lg: 'block' }}>Notice Board</Text>
              </Button>
            </Tooltip>
          </VStack>
        </VStack>
      </Box>

      <Box flex="1" p={{ base: 4, lg: 8 }} minW={0}>
        {activeSection === 'notice-board' ? (
          <NoticeBoardPanel title="IT Notice Board" subtitle="Internal announcements and alerts" />
        ) : (
          <>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
              <Heading size="xl">IT Department Dashboard</Heading>
              <HStack spacing={2}>
                <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
                  New Task
                </Button>
                <Button colorScheme="teal" variant="outline" onClick={() => navigate("/requests")}>
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
            <Box
              bg={cardBg}
              borderRadius="2xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
            >
              {contentMap[activeSection]}
            </Box>
          </>
        )}
      </Box>

      <TaskModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddTask} />
    </Flex>
  );
};

export default ITLayout;
