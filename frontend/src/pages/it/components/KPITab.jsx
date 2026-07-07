import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
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
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import KpiScorecardSection from '../../../components/kpi/KpiScorecardSection';
import { normalizeRole } from '../../../store/user';
import ITCollapsibleSection from './ITCollapsibleSection';
import ITTaskDetailModal from './ITTaskDetailModal';
import { getWorkflowMeta, getTaskTitle } from '../utils/itWorkflow';

const DAY_MS = 24 * 60 * 60 * 1000;

const intervalOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const formatPct = (value) => `${Math.round(value || 0)}%`;

const inRange = (dateValue, start, end) => {
  if (!dateValue) return false;
  const time = new Date(dateValue).getTime();
  return !Number.isNaN(time) && time >= start.getTime() && time <= end.getTime();
};

const getIntervalRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'weekly') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime() + 7 * DAY_MS - 1);
  } else if (type === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

const taskActivityDate = (task) => task.completionDate || task.updatedAt || task.createdAt || task.startDate || task.date;

const calculateMetrics = (tasks, interval) => {
  const { start, end } = getIntervalRange(interval);
  const now = Date.now();
  const intervalTasks = (tasks || []).filter((task) => (
    inRange(taskActivityDate(task), start, end)
    || inRange(task.startDate, start, end)
    || inRange(task.endDate, start, end)
  ));
  const completed = intervalTasks.filter((task) => task.status === 'done' || getWorkflowMeta(task.workflowStatus, task.status).value === 'completed');
  const approved = intervalTasks.filter((task) => task.approvalStatus === 'approved' || task.workflowStatus === 'approved');
  const submitted = intervalTasks.filter((task) => task.workflowStatus === 'submitted' || task.approvalStatus === 'pending_approval');
  const rejected = intervalTasks.filter((task) => task.workflowStatus === 'rejected' || task.approvalStatus === 'rejected');
  const overdue = intervalTasks.filter((task) => task.endDate && new Date(task.endDate).getTime() < now && task.status !== 'done');
  const dueSoon = intervalTasks.filter((task) => {
    if (!task.endDate || task.status === 'done') return false;
    const due = new Date(task.endDate).getTime();
    return due >= now && due - now <= 3 * DAY_MS;
  });
  const onTimeCompleted = completed.filter((task) => {
    if (!task.endDate) return true;
    const finishedAt = new Date(task.updatedAt || task.completionDate || Date.now()).getTime();
    return finishedAt <= new Date(task.endDate).getTime();
  });
  const points = completed.reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
  const cycleDays = completed
    .map((task) => {
      const startAt = new Date(task.startDate || task.createdAt || task.date).getTime();
      const finishAt = new Date(task.updatedAt || task.completionDate || Date.now()).getTime();
      if (Number.isNaN(startAt) || Number.isNaN(finishAt)) return null;
      return Math.max((finishAt - startAt) / DAY_MS, 0);
    })
    .filter((value) => value !== null);

  const total = intervalTasks.length;
  const completionRate = total ? (completed.length / total) * 100 : 0;
  const approvalRate = submitted.length || approved.length ? (approved.length / Math.max(submitted.length + approved.length + rejected.length, 1)) * 100 : 0;
  const onTimeRate = completed.length ? (onTimeCompleted.length / completed.length) * 100 : 0;
  const averageCycleDays = cycleDays.length ? cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length : 0;
  const qualityScore = Math.max(0, Math.min(100, completionRate * 0.35 + approvalRate * 0.25 + onTimeRate * 0.25 + Math.max(0, 100 - overdue.length * 8) * 0.15));

  return {
    interval,
    start,
    end,
    tasks: intervalTasks,
    total,
    completed: completed.length,
    active: intervalTasks.filter((task) => ['ongoing', 'in_progress', 'submitted'].includes(task.status) || ['in_progress', 'submitted'].includes(task.workflowStatus)).length,
    pending: intervalTasks.filter((task) => task.status === 'pending' || task.workflowStatus === 'pending').length,
    approved: approved.length,
    submitted: submitted.length,
    rejected: rejected.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    points,
    completionRate,
    approvalRate,
    onTimeRate,
    averageCycleDays,
    qualityScore,
  };
};

const buildMemberRows = (tasks, members) => {
  const names = new Set([
    ...(members || []).map((member) => member.name),
    ...(tasks || []).flatMap((task) => [task.taskLeader, ...(task.assignedTo || [])]).filter(Boolean),
  ]);

  return Array.from(names).map((name) => {
    const related = (tasks || []).filter((task) => (
      task.taskLeader === name || (task.assignedTo || []).includes(name)
    ));
    const completed = related.filter((task) => task.status === 'done' || task.workflowStatus === 'completed');
    const points = completed.reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
    const overdue = related.filter((task) => task.endDate && new Date(task.endDate).getTime() < Date.now() && task.status !== 'done');
    const submitted = related.filter((task) => task.workflowStatus === 'submitted' || task.approvalStatus === 'pending_approval');
    const completionRate = related.length ? (completed.length / related.length) * 100 : 0;
    const score = Math.max(0, Math.min(100, completionRate * 0.5 + Math.min(points * 8, 30) + Math.max(0, 20 - overdue.length * 5)));

    return {
      name,
      assigned: related.length,
      completed: completed.length,
      submitted: submitted.length,
      overdue: overdue.length,
      points,
      completionRate,
      score,
    };
  }).sort((a, b) => b.score - a.score);
};

const summarizeTaskGroup = (items) => {
  const completed = items.filter((task) => task.status === 'done' || task.workflowStatus === 'completed');
  const overdue = items.filter((task) => task.endDate && new Date(task.endDate).getTime() < Date.now() && task.status !== 'done');
  const points = completed.reduce((sum, task) => sum + (Number(task.featureCount) || 1), 0);
  const score = items.length ? (completed.length / items.length) * 100 : 0;

  return {
    tasks: items.length,
    completed: completed.length,
    overdue: overdue.length,
    points,
    score,
  };
};

const buildGroupedKpiRows = (tasks, interval) => {
  if (interval === 'daily') return [];

  const groups = new Map();
  const addToGroup = (label, task) => {
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(task);
  };

  (tasks || []).forEach((task) => {
    const date = new Date(taskActivityDate(task) || task.endDate || task.startDate || Date.now());
    if (Number.isNaN(date.getTime())) return;

    if (interval === 'weekly') {
      addToGroup(date.toLocaleDateString(undefined, { weekday: 'long' }), task);
    } else if (interval === 'monthly') {
      const weekOfMonth = Math.ceil(date.getDate() / 7);
      addToGroup(`Week ${weekOfMonth}`, task);
    } else {
      addToGroup(date.toLocaleDateString(undefined, { month: 'long' }), task);
    }
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    ...summarizeTaskGroup(items),
  }));
};

export default function KPITab({ users, usersLoading, tasks = [], fetchTasks }) {
  const [selectedInterval, setSelectedInterval] = useState('weekly');
  const [viewingTask, setViewingTask] = useState(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const defaultStaffPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];

  const itUsers = useMemo(
    () => (users || []).filter((user) => {
      const role = normalizeRole(user.role || user.userRole);
      const department = String(user.department || '').toLowerCase();
      return role === 'it' || role.startsWith('it') || department === 'it';
    }),
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
    return defaultStaffPool.map((name) => ({ id: name, name }));
  }, [itUsers]);

  const intervalMetrics = useMemo(() => (
    intervalOptions.map((option) => calculateMetrics(tasks, option.value))
  ), [tasks]);
  const selectedMetrics = intervalMetrics.find((metric) => metric.interval === selectedInterval) || intervalMetrics[0];
  const memberRows = useMemo(() => buildMemberRows(selectedMetrics.tasks, itKpiMembers), [itKpiMembers, selectedMetrics.tasks]);
  const recentTasks = [...selectedMetrics.tasks]
    .sort((a, b) => new Date(taskActivityDate(b) || 0) - new Date(taskActivityDate(a) || 0))
    .slice(0, 8);
  const dailyDetailRows = [...selectedMetrics.tasks]
    .sort((a, b) => new Date(a.endDate || a.updatedAt || 0) - new Date(b.endDate || b.updatedAt || 0));
  const groupedDetailRows = buildGroupedKpiRows(selectedMetrics.tasks, selectedInterval);

  const metricCards = [
    { label: 'Task Volume', value: selectedMetrics.total, help: `${selectedMetrics.active} active, ${selectedMetrics.pending} pending`, color: 'blue' },
    { label: 'Completion Rate', value: formatPct(selectedMetrics.completionRate), help: `${selectedMetrics.completed} completed`, color: 'green' },
    { label: 'Approval Health', value: formatPct(selectedMetrics.approvalRate), help: `${selectedMetrics.approved} approved, ${selectedMetrics.rejected} rejected`, color: 'purple' },
    { label: 'On-Time Delivery', value: formatPct(selectedMetrics.onTimeRate), help: `${selectedMetrics.overdue} overdue, ${selectedMetrics.dueSoon} due soon`, color: 'orange' },
    { label: 'KPI Points', value: selectedMetrics.points, help: 'Completed task points', color: 'cyan' },
    { label: 'Avg Cycle Time', value: `${selectedMetrics.averageCycleDays.toFixed(1)}d`, help: 'Start to completion', color: 'teal' },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <ITCollapsibleSection
        title="Advanced KPI Intelligence"
        subtitle="Automatic IT performance tracking across daily, weekly, monthly, and yearly intervals."
        defaultOpen
      >
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
            {intervalMetrics.map((metric) => (
              <Card
                key={metric.interval}
                bg={cardBg}
                borderColor={selectedInterval === metric.interval ? 'blue.400' : borderColor}
                borderWidth="1px"
                borderRadius="14px"
                cursor="pointer"
                onClick={() => setSelectedInterval(metric.interval)}
              >
                <CardBody>
                  <HStack justify="space-between" mb={3}>
                    <Badge colorScheme={selectedInterval === metric.interval ? 'blue' : 'gray'}>
                      {intervalOptions.find((item) => item.value === metric.interval)?.label}
                    </Badge>
                    <Text fontSize="xs" color={muted}>
                      {metric.start.toLocaleDateString()} - {metric.end.toLocaleDateString()}
                    </Text>
                  </HStack>
                  <Heading size="lg">{formatPct(metric.qualityScore)}</Heading>
                  <Text color={muted} fontSize="sm">Overall KPI score</Text>
                  <Progress mt={3} value={metric.qualityScore} colorScheme={metric.qualityScore >= 80 ? 'green' : metric.qualityScore >= 60 ? 'orange' : 'red'} borderRadius="full" />
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
            <Box>
              <Heading size="md">Selected KPI Window</Heading>
              <Text color={muted}>Review operational score, delivery quality, approvals, and staff performance.</Text>
            </Box>
            <Select maxW={{ base: '100%', md: '220px' }} value={selectedInterval} onChange={(event) => setSelectedInterval(event.target.value)}>
              {intervalOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {metricCards.map((card) => (
              <Card key={card.label} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
                <CardBody>
                  <Stat>
                    <StatLabel color={muted}>{card.label}</StatLabel>
                    <StatNumber color={`${card.color}.500`}>{card.value}</StatNumber>
                    <StatHelpText>{card.help}</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
            <CardBody>
              <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
                <Box>
                  <Heading size="sm">
                    {intervalOptions.find((item) => item.value === selectedInterval)?.label} KPI Detail
                  </Heading>
                  <Text color={muted} fontSize="sm">
                    {selectedInterval === 'daily'
                      ? 'Detailed daily KPI tasks for the selected day.'
                      : `Grouped ${selectedInterval} KPI performance with task totals, completions, points, overdue work, and score.`}
                  </Text>
                </Box>
                <HStack>
                  <Badge colorScheme="blue">{selectedMetrics.total} tasks</Badge>
                  <Badge colorScheme="green">{selectedMetrics.completed} completed</Badge>
                  <Badge colorScheme="orange">{selectedMetrics.points} points</Badge>
                </HStack>
              </Flex>
              {selectedInterval === 'daily' ? (
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Task</Th>
                        <Th>Owner</Th>
                        <Th>Workflow</Th>
                        <Th>Due</Th>
                        <Th isNumeric>Points</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dailyDetailRows.length === 0 ? (
                        <Tr>
                          <Td colSpan={5} textAlign="center" color={muted} py={8}>
                            No daily KPI task activity found.
                          </Td>
                        </Tr>
                      ) : dailyDetailRows.map((task) => {
                        const workflow = getWorkflowMeta(task.workflowStatus, task.status);
                        return (
                          <Tr key={task._id || task.id || getTaskTitle(task)} _hover={{ bg: subtleBg }}>
                            <Td>
                              <Button variant="link" colorScheme="blue" fontWeight="800" onClick={() => setViewingTask(task)}>
                                {getTaskTitle(task)}
                              </Button>
                              <Text fontSize="xs" color={muted}>{task.projectType || 'IT'} | {task.platform || task.category || 'No category'}</Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{task.taskLeader || 'No leader'}</Text>
                              <Text fontSize="xs" color={muted}>{(task.assignedTo || []).join(', ') || 'Unassigned'}</Text>
                            </Td>
                            <Td><Badge colorScheme={workflow.color}>{workflow.label}</Badge></Td>
                            <Td>{task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</Td>
                            <Td isNumeric>{task.status === 'done' || task.workflowStatus === 'completed' ? Number(task.featureCount) || 1 : 0}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>{selectedInterval === 'monthly' ? 'Week' : selectedInterval === 'yearly' ? 'Month' : 'Day'}</Th>
                        <Th isNumeric>Tasks</Th>
                        <Th isNumeric>Completed</Th>
                        <Th isNumeric>Overdue</Th>
                        <Th isNumeric>Points</Th>
                        <Th isNumeric>Score</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {groupedDetailRows.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" color={muted} py={8}>
                            No grouped KPI performance found.
                          </Td>
                        </Tr>
                      ) : groupedDetailRows.map((row) => (
                        <Tr key={row.label} _hover={{ bg: subtleBg }}>
                          <Td fontWeight="800">{row.label}</Td>
                          <Td isNumeric>{row.tasks}</Td>
                          <Td isNumeric>{row.completed}</Td>
                          <Td isNumeric>{row.overdue}</Td>
                          <Td isNumeric>{row.points}</Td>
                          <Td isNumeric>
                            <Badge colorScheme={row.score >= 80 ? 'green' : row.score >= 60 ? 'orange' : 'red'}>
                              {formatPct(row.score)}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
              <CardBody>
                <Heading size="sm" mb={4}>Team Performance Ranking</Heading>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Member</Th>
                        <Th isNumeric>Tasks</Th>
                        <Th isNumeric>Done</Th>
                        <Th isNumeric>Points</Th>
                        <Th isNumeric>Score</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {memberRows.length === 0 ? (
                        <Tr><Td colSpan={5} textAlign="center" color={muted}>No KPI activity in this window.</Td></Tr>
                      ) : memberRows.map((row) => (
                        <Tr key={row.name}>
                          <Td>
                            <Text fontWeight="700">{row.name}</Text>
                            <Text fontSize="xs" color={muted}>{row.submitted} submitted, {row.overdue} overdue</Text>
                          </Td>
                          <Td isNumeric>{row.assigned}</Td>
                          <Td isNumeric>{row.completed}</Td>
                          <Td isNumeric>{row.points}</Td>
                          <Td isNumeric>
                            <Badge colorScheme={row.score >= 80 ? 'green' : row.score >= 60 ? 'orange' : 'red'}>
                              {formatPct(row.score)}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
              <CardBody>
                <Heading size="sm" mb={4}>Recent KPI Activity</Heading>
                <VStack spacing={3} align="stretch">
                  {recentTasks.length === 0 ? (
                    <Box bg={subtleBg} borderRadius="12px" p={5} textAlign="center">
                      <Text color={muted}>No task activity in this KPI window.</Text>
                    </Box>
                  ) : recentTasks.map((task) => {
                    const workflow = getWorkflowMeta(task.workflowStatus, task.status);
                    return (
                      <Box
                        key={task._id || task.id}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="12px"
                        p={3}
                        cursor="pointer"
                        onClick={() => setViewingTask(task)}
                        _hover={{ bg: subtleBg }}
                      >
                        <HStack justify="space-between" align="flex-start">
                          <Box>
                            <Text fontWeight="800">{getTaskTitle(task)}</Text>
                            <Text color={muted} fontSize="sm">
                              {task.taskLeader ? `Leader: ${task.taskLeader}` : 'No leader'} | {(task.assignedTo || []).join(', ') || 'Unassigned'}
                            </Text>
                          </Box>
                          <Badge colorScheme={workflow.color}>{workflow.label}</Badge>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </ITCollapsibleSection>

      <ITCollapsibleSection
        title="Manual KPI Scorecard"
        subtitle="Keep manual KPI snapshots for daily, weekly, monthly, and yearly review."
        defaultOpen={false}
      >
        <KpiScorecardSection
          title="IT KPI Scorecard"
          description="Enter each team member's target, achieved amount, core output, and absences to calculate the KPI result."
          storageKey="kpi-it-scores-v1"
          members={itKpiMembers}
          isLoading={usersLoading && itUsers.length === 0}
          nameLabel="IT Staff"
          emptyLabel="No IT staff found."
        />
      </ITCollapsibleSection>
      <ITTaskDetailModal
        isOpen={Boolean(viewingTask)}
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onDone={fetchTasks}
      />
    </VStack>
  );
}
