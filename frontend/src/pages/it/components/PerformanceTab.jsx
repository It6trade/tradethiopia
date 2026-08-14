import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Progress,
  Select,
  SimpleGrid,
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
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiActivity, FiAward, FiBarChart2, FiCheckCircle, FiClock, FiTarget, FiUsers } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IT_ROLE_KEYS, getUserTaskAliases } from '../utils/itRbac';

const WEEKLY_TARGET_POINTS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

const isCompleted = (task) => task.status === 'done' || task.workflowStatus === 'completed';
const isActive = (task) => task.status === 'ongoing' || ['assigned', 'in_progress', 'submitted'].includes(task.workflowStatus);
const taskPoints = (task) => (isCompleted(task) ? Number(task.featureCount) || 1 : 0);
const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));

const getTaskDate = (task) => task.updatedAt || task.completionDate || task.createdAt || task.startDate || task.date;

const inCurrentWindow = (dateValue, days) => {
  if (!dateValue) return false;
  const time = new Date(dateValue).getTime();
  return !Number.isNaN(time) && Date.now() - time <= days * DAY_MS;
};

const displayNameForUser = (user = {}) => (
  user.fullName
  || user.name
  || user.username
  || user.email
  || user._id
  || user.id
  || ''
);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const buildUserLookup = (users = []) => {
  const lookup = new Map();
  users.forEach((user) => {
    const display = displayNameForUser(user);
    [user._id, user.id, user.email, user.username, user.fullName, user.name]
      .filter(Boolean)
      .forEach((alias) => lookup.set(normalizeKey(alias), display));
  });
  return lookup;
};

const resolveDisplayName = (value, lookup) => lookup.get(normalizeKey(value)) || String(value || '').trim();
const getTaskTitle = (task = {}) => (
  task.taskName
  || task.client
  || task.platform
  || task.category
  || task.actionType
  || 'IT task'
);

const getScopeCopy = (persona) => {
  if (persona?.key === IT_ROLE_KEYS.MANAGER) {
    return {
      label: 'Admin scope',
      description: 'Viewing performance across every IT task, staff member, and leader.',
      color: 'purple',
    };
  }
  if (persona?.key === IT_ROLE_KEYS.TEAM_LEADER) {
    return {
      label: 'Leader scope',
      description: 'Viewing only tasks and staff performance assigned to your leadership scope.',
      color: 'blue',
    };
  }
  return {
    label: 'Personal scope',
    description: 'Viewing only your own assigned task performance metrics.',
    color: 'green',
  };
};

const buildPerformanceRows = ({ tasks = [], users = [], persona, currentUser }) => {
  const lookup = buildUserLookup(users);
  const currentAliases = getUserTaskAliases(currentUser || {});
  const currentDisplay = displayNameForUser(currentUser || {});
  const memberMap = new Map();

  const ensureMember = (rawName) => {
    const display = resolveDisplayName(rawName, lookup) || rawName || 'Unassigned';
    const key = normalizeKey(display);
    if (!key) return null;
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        key,
        name: display,
        assignedTasks: [],
        ledTasks: [],
      });
    }
    return memberMap.get(key);
  };

  (tasks || []).forEach((task) => {
    (task.assignedTo || []).forEach((assignee) => {
      const member = ensureMember(assignee);
      if (member) member.assignedTasks.push(task);
    });

    if (task.taskLeader) {
      const leader = ensureMember(task.taskLeader);
      if (leader) leader.ledTasks.push(task);
    }
  });

  if (persona?.key === IT_ROLE_KEYS.STAFF && currentDisplay) {
    const member = ensureMember(currentDisplay);
    if (member && member.assignedTasks.length === 0) {
      member.assignedTasks = (tasks || []).filter((task) => (
        (task.assignedTo || []).some((assignee) => currentAliases.includes(normalizeKey(assignee)))
        || currentAliases.includes(normalizeKey(task.taskLeader))
      ));
    }
  }

  return Array.from(memberMap.values()).map((member) => {
    const related = [...new Map([...member.assignedTasks, ...member.ledTasks].map((task) => [task._id || task.id || task.taskName, task])).values()];
    const completed = related.filter(isCompleted);
    const active = related.filter(isActive);
    const overdue = related.filter((task) => task.endDate && new Date(task.endDate).getTime() < Date.now() && !isCompleted(task));
    const internalPoints = completed
      .filter((task) => task.projectType === 'internal')
      .reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
    const externalPoints = completed
      .filter((task) => task.projectType === 'external')
      .reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
    const points = internalPoints + externalPoints;
    const completionRate = related.length ? (completed.length / related.length) * 100 : 0;
    const progressAverage = related.length
      ? related.reduce((sum, task) => sum + Number(task.progressPercent || (isCompleted(task) ? 100 : 0)), 0) / related.length
      : 0;
    const recentPoints = completed
      .filter((task) => inCurrentWindow(getTaskDate(task), 7))
      .reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
    const performanceScore = clampPercent(
      completionRate * 0.45
      + Math.min((points / WEEKLY_TARGET_POINTS) * 100, 100) * 0.25
      + progressAverage * 0.2
      + Math.max(0, 100 - overdue.length * 15) * 0.1
    );

    return {
      ...member,
      assigned: related.length,
      led: member.ledTasks.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      internalPoints,
      externalPoints,
      points,
      recentPoints,
      completionRate,
      progressAverage,
      performanceScore,
    };
  })
    .filter((row) => row.assigned > 0 || row.led > 0 || persona?.key === IT_ROLE_KEYS.STAFF)
    .sort((a, b) => b.performanceScore - a.performanceScore || b.points - a.points)
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

const buildTaskBreakdownRows = ({ tasks = [], users = [] }) => {
  const lookup = buildUserLookup(users);

  return (tasks || []).map((task) => {
    const assignees = (task.assignedTo || []).map((name) => resolveDisplayName(name, lookup)).filter(Boolean);
    const leader = task.taskLeader ? resolveDisplayName(task.taskLeader, lookup) : '';
    const participantCount = new Set([leader, ...assignees].filter(Boolean).map(normalizeKey)).size;
    const progress = clampPercent(Number(task.progressPercent || (isCompleted(task) ? 100 : 0)));
    const overdue = task.endDate && new Date(task.endDate).getTime() < Date.now() && !isCompleted(task);
    const score = clampPercent(
      (isCompleted(task) ? 45 : 0)
      + progress * 0.4
      + (overdue ? 0 : 15)
    );

    return {
      key: task._id || task.id || `${getTaskTitle(task)}-${task.createdAt || task.date || ''}`,
      title: getTaskTitle(task),
      location: task.projectType === 'internal'
        ? [task.platform, task.actionType].filter(Boolean).join(' / ')
        : [task.client, task.category, task.actionType].filter(Boolean).join(' / '),
      leader,
      assignees,
      participantCount,
      status: task.status || 'pending',
      workflowStatus: task.workflowStatus || '',
      progress,
      points: taskPoints(task),
      score,
      overdue,
    };
  }).sort((a, b) => b.score - a.score || b.progress - a.progress);
};

export default function PerformanceTab({ tasks = [], users = [], persona, currentUser }) {
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [taskPage, setTaskPage] = useState(1);
  const cardBg = useColorModeValue('white', 'gray.800');
  const panelBg = useColorModeValue('rgba(255,255,255,0.82)', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const axisColor = useColorModeValue('#4A5568', '#A0AEC0');
  const headerBg = useColorModeValue(
    'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(20,184,166,0.10))',
    'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(20,184,166,0.12))'
  );

  const scope = getScopeCopy(persona);
  const staffPerformance = useMemo(
    () => buildPerformanceRows({ tasks, users, persona, currentUser }),
    [tasks, users, persona, currentUser]
  );
  const taskBreakdown = useMemo(
    () => buildTaskBreakdownRows({ tasks, users }),
    [tasks, users]
  );
  const filteredTaskBreakdown = useMemo(() => {
    const query = normalizeKey(taskSearch);
    return taskBreakdown.filter((task) => {
      const matchesSearch = !query || [
        task.title,
        task.location,
        task.leader,
        task.status,
        task.workflowStatus,
        ...task.assignees,
      ].some((value) => normalizeKey(value).includes(query));
      const matchesStatus = taskStatusFilter === 'all'
        || task.status === taskStatusFilter
        || task.workflowStatus === taskStatusFilter
        || (taskStatusFilter === 'overdue' && task.overdue);
      return matchesSearch && matchesStatus;
    });
  }, [taskBreakdown, taskSearch, taskStatusFilter]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearch, taskStatusFilter, taskPageSize]);

  const totalTaskPages = Math.max(1, Math.ceil(filteredTaskBreakdown.length / taskPageSize));
  const safeTaskPage = Math.min(taskPage, totalTaskPages);
  const pagedTaskBreakdown = filteredTaskBreakdown.slice(
    (safeTaskPage - 1) * taskPageSize,
    safeTaskPage * taskPageSize
  );

  const totals = useMemo(() => {
    const completed = (tasks || []).filter(isCompleted);
    const active = (tasks || []).filter(isActive);
    const overdue = (tasks || []).filter((task) => task.endDate && new Date(task.endDate).getTime() < Date.now() && !isCompleted(task));
    const points = completed.reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
    const averageScore = staffPerformance.length
      ? staffPerformance.reduce((sum, row) => sum + row.performanceScore, 0) / staffPerformance.length
      : 0;

    return {
      totalTasks: (tasks || []).length,
      completed: completed.length,
      active: active.length,
      overdue: overdue.length,
      points,
      averageScore: clampPercent(averageScore),
      contributors: staffPerformance.length,
    };
  }, [tasks, staffPerformance]);

  const summaryCards = [
    { label: 'Scoped Tasks', value: totals.totalTasks, helper: `${totals.active} active`, icon: FiActivity, color: 'blue' },
    { label: 'Completed', value: totals.completed, helper: `${totals.points} delivery points`, icon: FiCheckCircle, color: 'green' },
    { label: 'Contributors', value: totals.contributors, helper: scope.label, icon: FiUsers, color: scope.color },
    { label: 'Avg Score', value: `${totals.averageScore}%`, helper: `${totals.overdue} overdue`, icon: FiAward, color: totals.overdue ? 'orange' : 'teal' },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Card borderRadius="24px" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="0 20px 60px rgba(15, 23, 42, 0.10)" overflow="hidden">
        <CardBody bg={headerBg}>
          <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box>
              <HStack spacing={2} mb={2} wrap="wrap">
                <Badge colorScheme={scope.color} borderRadius="full" px={3} py={1}>{scope.label}</Badge>
                <Badge colorScheme="cyan" variant="subtle" borderRadius="full" px={3} py={1}>Role protected</Badge>
              </HStack>
              <Heading size="lg">Performance Intelligence</Heading>
              <Text color={muted} mt={2} maxW="760px">
                {scope.description}
              </Text>
            </Box>
            <Flex boxSize="58px" borderRadius="18px" bg={panelBg} align="center" justify="center" border="1px solid" borderColor={borderColor}>
              <Icon as={FiBarChart2} boxSize={7} color={`${scope.color}.500`} />
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
        {summaryCards.map((item) => (
          <Card key={item.label} borderRadius="20px" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="md">
            <CardBody>
              <HStack justify="space-between" align="flex-start">
                <Stat>
                  <StatLabel color={muted} fontWeight="800">{item.label}</StatLabel>
                  <StatNumber>{item.value}</StatNumber>
                  <StatHelpText mb={0}>{item.helper}</StatHelpText>
                </Stat>
                <Flex boxSize="42px" borderRadius="14px" align="center" justify="center" bg={`${item.color}.50`} color={`${item.color}.500`}>
                  <Icon as={item.icon} />
                </Flex>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Card borderRadius="20px" border="1px solid" borderColor={borderColor} boxShadow="md" bg={cardBg}>
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <Box>
                <Text fontWeight="900">Completion Trend</Text>
                <Text fontSize="sm" color={muted}>Assigned vs completed work in your allowed scope.</Text>
              </Box>
              <Icon as={FiTarget} color="green.500" />
            </HStack>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} />
                <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor }} cursor={{ strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="assigned" stroke="#2563EB" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card borderRadius="20px" border="1px solid" borderColor={borderColor} boxShadow="md" bg={cardBg}>
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <Box>
                <Text fontWeight="900">Achievement Points</Text>
                <Text fontSize="sm" color={muted}>Completed internal and external delivery points.</Text>
              </Box>
              <Icon as={FiAward} color="purple.500" />
            </HStack>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} />
                <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor }} />
                <Bar dataKey="internalPoints" stackId="points" fill="#2563EB" radius={[0, 0, 0, 0]} />
                <Bar dataKey="externalPoints" stackId="points" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="20px" border="1px solid" borderColor={borderColor} boxShadow="md" bg={cardBg}>
        <CardHeader>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
            <Box>
              <Heading size="md">Task Performance Breakdown</Heading>
              <Text fontSize="sm" color={muted}>
                Each task appears once, with its leader and assigned staff shown inside the task row.
              </Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme={scope.color} borderRadius="full" px={3} py={1}>
                {scope.label}
              </Badge>
              <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
                {filteredTaskBreakdown.length} task{filteredTaskBreakdown.length === 1 ? '' : 's'}
              </Badge>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <Flex gap={3} mb={4} wrap="wrap" align="center">
            <Input
              value={taskSearch}
              onChange={(event) => setTaskSearch(event.target.value)}
              placeholder="Search task, leader, staff, status..."
              maxW={{ base: '100%', md: '360px' }}
              borderRadius="12px"
            />
            <Select
              value={taskStatusFilter}
              onChange={(event) => setTaskStatusFilter(event.target.value)}
              maxW={{ base: '100%', md: '180px' }}
              borderRadius="12px"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="done">Done</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="overdue">Overdue</option>
            </Select>
            <Select
              value={taskPageSize}
              onChange={(event) => setTaskPageSize(Number(event.target.value))}
              maxW={{ base: '100%', md: '150px' }}
              borderRadius="12px"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </Select>
          </Flex>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Leader / Staff</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Points</Th>
                  <Th>Progress</Th>
                  <Th>Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pagedTaskBreakdown.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" color={muted} py={8}>
                      No task performance data matches the current filters.
                    </Td>
                  </Tr>
                ) : pagedTaskBreakdown.map((task) => (
                  <Tr key={task.key}>
                    <Td>
                      <Text fontWeight="900">{task.title}</Text>
                      <Text fontSize="xs" color={muted} noOfLines={2}>
                        {task.location || 'No project location'}
                      </Text>
                    </Td>
                    <Td>
                      <VStack align="stretch" spacing={2}>
                        {task.leader && (
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="purple" variant="subtle">Leader</Badge>
                            <Text fontSize="sm" fontWeight="800">{task.leader}</Text>
                          </HStack>
                        )}
                        <HStack spacing={2} flexWrap="wrap">
                          {task.assignees.length ? task.assignees.map((name) => (
                            <Badge key={name} colorScheme="blue" borderRadius="full" px={2} py={1}>
                              {name}
                            </Badge>
                          )) : (
                            <Text fontSize="xs" color={muted}>No staff assigned</Text>
                          )}
                        </HStack>
                        <Text fontSize="xs" color={muted}>
                          {task.participantCount} participant{task.participantCount === 1 ? '' : 's'} in this task
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={task.status === 'done' ? 'green' : task.status === 'ongoing' ? 'blue' : 'yellow'}>
                        {task.status}
                      </Badge>
                      {task.workflowStatus && (
                        <Text fontSize="xs" color={muted} mt={1}>{task.workflowStatus}</Text>
                      )}
                      {task.overdue && (
                        <Text fontSize="xs" color="orange.500" mt={1}>
                          <Icon as={FiClock} mr={1} />
                          Overdue
                        </Text>
                      )}
                    </Td>
                    <Td isNumeric>{task.points}</Td>
                    <Td minW="180px">
                      <Progress value={task.progress} size="sm" borderRadius="full" colorScheme={task.progress >= 75 ? 'green' : task.progress >= 40 ? 'blue' : 'orange'} />
                      <Text fontSize="xs" color={muted} mt={1}>{task.progress}% task progress</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={task.score >= 80 ? 'green' : task.score >= 55 ? 'yellow' : 'red'} borderRadius="full" px={2}>
                        {task.score}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          {filteredTaskBreakdown.length > 0 && (
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mt={4}>
              <Text fontSize="sm" color={muted}>
                Showing {(safeTaskPage - 1) * taskPageSize + 1}-{Math.min(safeTaskPage * taskPageSize, filteredTaskBreakdown.length)} of {filteredTaskBreakdown.length}
              </Text>
              <HStack>
                <Button size="sm" variant="outline" onClick={() => setTaskPage((page) => Math.max(1, page - 1))} isDisabled={safeTaskPage <= 1}>
                  Previous
                </Button>
                <Badge colorScheme={scope.color} borderRadius="full" px={3} py={1}>
                  Page {safeTaskPage} / {totalTaskPages}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setTaskPage((page) => Math.min(totalTaskPages, page + 1))} isDisabled={safeTaskPage >= totalTaskPages}>
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
