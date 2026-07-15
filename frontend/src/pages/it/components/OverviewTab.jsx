import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Progress,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import {
  FiChevronRight,
  FiSearch,
  FiList,
  FiTarget,
  FiLayers,
  FiPieChart,
} from 'react-icons/fi';
import axios from 'axios';
import { useUserStore } from '../../../store/user';
import ITCollapsibleSection from './ITCollapsibleSection';
import ITTaskEditModal from './ITTaskEditModal';
import ITTaskDetailModal from './ITTaskDetailModal';
import { getWorkflowActionForPersona, getWorkflowMeta } from '../utils/itWorkflow';

const INTERNAL_SUBTASKS = [
  'Functionality',
  'Features',
  'Update',
  'Troubleshoot',
  'Renewal',
  'AI/ML',
];
const EXTERNAL_SUBTASKS = ['New', 'Update', 'Comment', 'Renewal'];

const TaskTable = ({
  tasks,
  onToggleStatus,
  onWorkflowAction,
  onRejectTask,
  onUpdatePoints,
  onAddComment,
  onAddReminder,
  onReassignTask,
  onEditTask,
  onViewTask,
  permissions = {},
  emptyMessage,
  isCompact
}) => {
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
          {!tasks || tasks.length === 0 ? (
            <Tr>
              <Td colSpan={8} textAlign="center" py={10}>
                <Text color="gray.500">{emptyMessage}</Text>
              </Td>
            </Tr>
          ) : (
            tasks.map((task) => (
              <Tr key={task._id || task.id}>
                <Td>
                  <Button variant="link" colorScheme="blue" fontWeight="semibold" onClick={() => onViewTask(task)}>
                    {task.taskName || task.client || 'N/A'}
                  </Button>
                  <Text fontSize="xs" color="gray.500">
                    {task.platform || task.category || ''}
                  </Text>
                </Td>
                <Td>
                  <Tag size="sm" colorScheme={task.projectType === 'internal' ? 'blue' : 'purple'}>
                    {task.projectType === 'internal' ? 'Internal' : 'External'}
                  </Tag>
                </Td>
                <Td>{task.category || task.platform || 'N/A'}</Td>
                <Td>
                  {editingTaskId === (task._id || task.id) && task.status === 'done' ? (
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
                      <Button size="xs" colorScheme="green" onClick={() => savePoints(task._id || task.id)}>
                        Save
                      </Button>
                      <Button size="xs" variant="ghost" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <>
                      <Text fontWeight="bold">{task.featureCount || (task.status === 'done' ? 1 : 0)}</Text>
                      {task.status === 'done' && onUpdatePoints && (
                        <Button
                          size="xs"
                          variant="link"
                          colorScheme="blue"
                          mt={1}
                          onClick={() => startEditing(task._id || task.id, task.featureCount || 1)}
                        >
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </Td>
                <Td>
                  <VStack align="flex-start" spacing={1}>
                    <Badge colorScheme={statusColor(task.status)}>{task.status}</Badge>
                    <Badge colorScheme={getWorkflowMeta(task.workflowStatus, task.status).color} variant="subtle">
                      {getWorkflowMeta(task.workflowStatus, task.status).label}
                    </Badge>
                  </VStack>
                </Td>
                <Td>
                  <VStack align="flex-start" spacing={1}>
                    {task.taskLeader && (
                      <Badge colorScheme="cyan" borderRadius="full">
                        Leader: {task.taskLeader}
                      </Badge>
                    )}
                    <HStack spacing={2}>
                      <Avatar size="xs" name={(task.assignedTo && task.assignedTo[0]) || task.taskLeader || 'Staff'} />
                      <Text fontSize="sm">{(task.assignedTo && task.assignedTo.join(', ')) || 'Unassigned'}</Text>
                    </HStack>
                  </VStack>
                </Td>
                <Td>{task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</Td>
                <Td textAlign="right">
                  <HStack justify="flex-end" spacing={2}>
                    <Button size="sm" variant="outline" onClick={() => onViewTask(task)}>
                      Details
                    </Button>
                    {permissions.canComment && (
                      <Button size="sm" variant="outline" onClick={() => onAddComment(task._id || task.id)}>
                        Comment
                      </Button>
                    )}
                    {permissions.canComment && (
                      <Button size="sm" variant="outline" onClick={() => onAddReminder(task._id || task.id)}>
                        Remind
                      </Button>
                    )}
                    {permissions.canApproveTasks && (
                      <Button size="sm" variant="outline" onClick={() => onReassignTask(task)}>
                        Reassign
                      </Button>
                    )}
                    {permissions.canManageUsers && (
                      <Button size="sm" colorScheme="blue" variant="outline" onClick={() => onEditTask(task)}>
                        Edit
                      </Button>
                    )}
                    {permissions.canApproveTasks && getWorkflowMeta(task.workflowStatus, task.status).value === 'submitted' && (
                      <Button size="sm" colorScheme="red" variant="outline" onClick={() => onRejectTask(task._id || task.id)}>
                        Reject
                      </Button>
                    )}
                    {getWorkflowActionForPersona(task, permissions) && (
                      <Button
                        size="sm"
                        colorScheme={getWorkflowActionForPersona(task, permissions).color}
                        rightIcon={<FiChevronRight />}
                        onClick={() => onWorkflowAction(task, getWorkflowActionForPersona(task, permissions))}
                      >
                        {getWorkflowActionForPersona(task, permissions).label}
                      </Button>
                    )}
                    {permissions.canApproveTasks && (
                      <Button
                        size="sm"
                        colorScheme={task.status === 'done' ? 'gray' : 'green'}
                        variant="outline"
                        onClick={() => onToggleStatus(task._id || task.id, task.status)}
                      >
                        {task.status === 'done' ? 'Reopen' : 'Mark Done'}
                      </Button>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default function OverviewTab({ tasks, weeklyTarget, setWeeklyTarget, fetchTasks, permissions = {} }) {
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    progress: 'all',
    query: '',
  });
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [taskPage, setTaskPage] = useState(1);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  
  const { currentUser, users } = useUserStore();
  const token = currentUser?.token;
  const currentUserName = currentUser?.fullName || currentUser?.username || currentUser?.email || '';
  const itPeople = useMemo(() => (
    (users || [])
      .filter((user) => {
        const role = String(user.role || '').toLowerCase();
        const department = String(user.department || '').toLowerCase();
        return role.includes('it') || department === 'it';
      })
      .map((user) => user.fullName || user.username || user.email)
      .filter(Boolean)
  ), [users]);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const filterInputBg = useColorModeValue('gray.50', 'gray.700');
  const subtleBg = useColorModeValue('blue.50', 'whiteAlpha.50');
  const tableHeadBg = useColorModeValue('linear-gradient(135deg, #eff6ff, #f8fafc)', 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(15,23,42,0.92))');
  const cardShadow = useColorModeValue('0 18px 38px rgba(15, 23, 42, 0.09)', '0 18px 38px rgba(0, 0, 0, 0.28)');
  const cardGradient = useColorModeValue('linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))', 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.72))');
  const targetBg = useColorModeValue('linear-gradient(135deg, #f8fafc, #ecfeff)', 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(12,74,110,0.18))');

  const handleToggleStatus = async (taskId, currentStatus) => {
    const isDone = currentStatus === 'done';
    const nextStatus = isDone ? 'ongoing' : 'done';
    let featureCount = 1;

    if (!isDone) {
      const input = prompt('Enter the number of features/points for this task:', '1');
      if (input === null) return;
      const parsed = parseInt(input);
      if (!isNaN(parsed) && parsed >= 1) {
        featureCount = parsed;
      }
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${taskId}`, {
        status: nextStatus,
        featureCount,
        workflowStatus: nextStatus === 'done' ? 'completed' : 'in_progress',
        auditNote: nextStatus === 'done' ? 'Marked complete from overview' : 'Reopened from overview',
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  const handleUpdatePoints = async (taskId, newPoints) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${taskId}`, {
        featureCount: newPoints
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error('Update points error', err);
    }
  };

  const handleAddComment = async (taskId) => {
    const body = prompt('Add a task comment:');
    if (!body || !body.trim()) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${taskId}/comments`, { body }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Add comment error', err);
    }
  };

  const handleApproveTask = async (taskId) => {
    const note = prompt('Approval note (optional):', 'Approved by IT leadership');
    if (note === null) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${taskId}/approve`, {
        approvalStatus: 'approved',
        approvalNote: note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Approve task error', err);
    }
  };

  const handleWorkflowAction = async (task, action) => {
    const taskId = task._id || task.id;
    let note = '';
    let featureCount;

    if (action.next === 'submitted') {
      note = prompt('Submission note (optional):', task.progressNote || 'Ready for review') || '';
    } else if (action.next === 'completed') {
      const points = prompt('Final feature/point count:', String(task.featureCount || 1));
      if (points === null) return;
      featureCount = parseInt(points);
      if (Number.isNaN(featureCount) || featureCount < 1) featureCount = 1;
      note = 'Completed after approval';
    } else {
      note = prompt('Progress note (optional):', '') || '';
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${taskId}/workflow`, {
        workflowStatus: action.next,
        note,
        progressNote: note,
        featureCount,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Workflow action error', err);
    }
  };

  const handleRejectTask = async (taskId) => {
    const note = prompt('Rejection note / required changes:', 'Please revise and resubmit.');
    if (note === null) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${taskId}/approve`, {
        approvalStatus: 'rejected',
        approvalNote: note,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Reject task error', err);
    }
  };

  const handleAddReminder = async (taskId) => {
    const title = prompt('Reminder title:', 'Follow up on this task');
    if (!title || !title.trim()) return;
    const dueAt = prompt('Reminder date (YYYY-MM-DD, optional):', '');
    const note = prompt('Reminder note (optional):', '') || '';
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${taskId}/reminders`, {
        title,
        dueAt: dueAt || undefined,
        note,
        type: 'action',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Add reminder error', err);
    }
  };

  const handleReassignTask = async (task) => {
    const available = itPeople.length ? itPeople.join(', ') : 'Type names separated by comma';
    let taskLeader = currentUserName || task.taskLeader || '';
    if (permissions.canManageUsers) {
      taskLeader = prompt(`Task leader:\nAvailable: ${available}`, task.taskLeader || '');
      if (taskLeader === null) return;
    }
    const assigned = prompt('Assigned staff, comma separated:', (task.assignedTo || []).join(', '));
    if (assigned === null) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it/${task._id || task.id}/reassign`, {
        taskLeader,
        assignedTo: assigned.split(',').map((item) => item.trim()).filter(Boolean),
        note: 'Reassigned from IT overview',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Reassign task error', err);
    }
  };

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      const matchesType = filters.type === 'all' || task.projectType === filters.type;
      
      const categoryText = task.category || task.platform || '';
      const matchesCategory = filters.category === 'all' || categoryText.includes(filters.category);
      
      let matchesProgress = true;
      if (filters.progress === 'low') {
        matchesProgress = task.status === 'pending';
      } else if (filters.progress === 'mid') {
        matchesProgress = task.status === 'ongoing';
      } else if (filters.progress === 'complete') {
        matchesProgress = task.status === 'done';
      }

      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        (task.taskName && task.taskName.toLowerCase().includes(query)) ||
        (task.client && task.client.toLowerCase().includes(query)) ||
        (task.platform && task.platform.toLowerCase().includes(query)) ||
        (task.category && task.category.toLowerCase().includes(query)) ||
        (task.taskLeader && task.taskLeader.toLowerCase().includes(query)) ||
        (task.assignedTo && task.assignedTo.some(a => a.toLowerCase().includes(query)));
        
      return matchesType && matchesCategory && matchesProgress && matchesQuery;
    });
  }, [filters, tasks]);

  useEffect(() => {
    setTaskPage(1);
  }, [filters, taskPageSize]);

  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / taskPageSize));
  const safeTaskPage = Math.min(taskPage, totalTaskPages);
  const pagedTasks = filteredTasks.slice(
    (safeTaskPage - 1) * taskPageSize,
    safeTaskPage * taskPageSize
  );

  const doneTasks = (tasks || []).filter((task) => task.status === 'done');
  const internalPoints = doneTasks
    .filter((task) => task.projectType === 'internal')
    .reduce((sum, task) => sum + (task.featureCount || 1), 0);
  const externalPoints = doneTasks
    .filter((task) => task.projectType === 'external')
    .reduce((sum, task) => sum + (task.featureCount || 1), 0);
  const totalPoints = internalPoints + externalPoints;
  const safeTarget = Math.max(weeklyTarget, 1);
  const progressPercent = Math.min((totalPoints / safeTarget) * 100, 100);
  const targetAchieved = totalPoints >= weeklyTarget;
  const remainingGap = Math.max(weeklyTarget - totalPoints, 0);

  const summaryCards = [
    {
      label: 'Active Tasks',
      value: (tasks || []).length,
      helper: `${doneTasks.length} completed`,
      icon: FiList,
      color: 'blue',
    },
    {
      label: 'Weekly Points',
      value: `${totalPoints}/${weeklyTarget}`,
      helper: targetAchieved ? 'Target achieved' : `${remainingGap} points to go`,
      icon: FiTarget,
      color: 'green',
    },
    {
      label: 'Internal Focus',
      value: internalPoints,
      helper: 'Internal contributions',
      icon: FiLayers,
      color: 'purple',
    },
    {
      label: 'External Focus',
      value: externalPoints,
      helper: 'External deliveries',
      icon: FiPieChart,
      color: 'orange',
    },
  ];

  return (
    <VStack spacing={8} align="stretch">
      <ITCollapsibleSection
        title="Summary Cards"
        subtitle="High-level IT workload and scoring indicators."
        defaultOpen
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          {summaryCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={card.label}
                borderRadius="20px"
                boxShadow={cardShadow}
                bg={cardGradient}
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
                transition="transform 0.18s ease, box-shadow 0.18s ease"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <CardBody>
                  <HStack justify="space-between">
                    <VStack align="start">
                      <Text fontSize="sm" color="gray.500" fontWeight="700">
                        {card.label}
                      </Text>
                      <Heading size="lg" lineHeight="1">{card.value}</Heading>
                      <Text fontSize="xs" color="gray.500">
                        {card.helper}
                      </Text>
                    </VStack>
                    <IconButton
                      aria-label={card.label}
                      icon={<IconComponent />}
                      variant="solid"
                      size="md"
                      isRound
                      bg={`${card.color}.50`}
                      color={`${card.color}.500`}
                      boxShadow="inset 0 0 0 1px rgba(255,255,255,0.72)"
                      _hover={{ bg: `${card.color}.100` }}
                    />
                  </HStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      </ITCollapsibleSection>

      <ITCollapsibleSection
        title="Weekly Target"
        subtitle="Expand to adjust targets and review progress."
        defaultOpen
      >
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={5} bg={targetBg} border="1px solid" borderColor={borderColor} borderRadius="18px" p={5}>
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
              borderRadius="full"
              size="lg"
              w={{ base: '100%', md: '40%' }}
              hasStripe={!targetAchieved}
              bg={subtleBg}
              boxShadow="inset 0 1px 3px rgba(15, 23, 42, 0.12)"
            />
          </Flex>
      </ITCollapsibleSection>

      <ITCollapsibleSection
        title="Task System"
        subtitle="Filter, comment, approve, and manage current work."
        defaultOpen
      >
          <Flex direction={{ base: 'column', xl: 'row' }} align={{ base: 'stretch', xl: 'center' }} justify="space-between" gap={4}>
            <Box minW={0}>
              <Text fontSize="sm" color="gray.500">
                Filter and manage open requests with auto-calculated scores.
              </Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', xl: 'flex-end' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiSearch color="gray" />} />
                <Input
                  placeholder="Search tasks"
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  bg={filterInputBg}
                  borderRadius="14px"
                />
              </InputGroup>
              <Select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                variant="filled"
                w="150px"
                borderRadius="14px"
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
                borderRadius="14px"
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
                borderRadius="14px"
              >
                <option value="all">All Progress</option>
                <option value="low">Pending</option>
                <option value="mid">In Progress</option>
                <option value="complete">Completed</option>
              </Select>
              <Select
                value={taskPageSize}
                onChange={(e) => setTaskPageSize(Number(e.target.value))}
                variant="filled"
                w="150px"
                borderRadius="14px"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </Select>
            </HStack>
          </Flex>
          <Box mt={5}>
          <Box
            border="1px solid"
            borderColor={borderColor}
            borderRadius="18px"
            overflow="hidden"
            boxShadow={cardShadow}
            sx={{
              'thead tr': { background: tableHeadBg },
              'tbody tr': { transition: 'background 0.16s ease' },
              'tbody tr:hover': { background: subtleBg },
              'th': { borderColor, fontSize: '0.72rem', letterSpacing: '0.02em' },
              'td': { borderColor },
            }}
          >
          <TaskTable
            tasks={pagedTasks}
            onToggleStatus={handleToggleStatus}
            onWorkflowAction={handleWorkflowAction}
            onRejectTask={handleRejectTask}
            onUpdatePoints={handleUpdatePoints}
            onAddComment={handleAddComment}
            onAddReminder={handleAddReminder}
            onReassignTask={handleReassignTask}
            onEditTask={setEditingTask}
            onViewTask={setViewingTask}
            permissions={permissions}
            emptyMessage="No tasks match the filters"
          />
          {filteredTasks.length > 0 && (
            <Flex
              justify="space-between"
              align={{ base: 'stretch', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap={3}
              px={4}
              py={3}
              borderTop="1px solid"
              borderColor={borderColor}
              bg={filterInputBg}
            >
              <Text fontSize="sm" color="gray.500">
                Showing {(safeTaskPage - 1) * taskPageSize + 1}-{Math.min(safeTaskPage * taskPageSize, filteredTasks.length)} of {filteredTasks.length}
              </Text>
              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskPage((page) => Math.max(1, page - 1))}
                  isDisabled={safeTaskPage <= 1}
                >
                  Previous
                </Button>
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  Page {safeTaskPage} / {totalTaskPages}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskPage((page) => Math.min(totalTaskPages, page + 1))}
                  isDisabled={safeTaskPage >= totalTaskPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
          </Box>
          </Box>
      </ITCollapsibleSection>
      <ITTaskEditModal
        isOpen={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onDone={fetchTasks}
      />
      <ITTaskDetailModal
        isOpen={Boolean(viewingTask)}
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onDone={fetchTasks}
      />
    </VStack>
  );
}
