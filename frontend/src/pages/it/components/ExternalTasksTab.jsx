import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Text,
  Badge,
  HStack,
  Select,
  useToast,
  Card,
  CardBody,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  useColorModeValue,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import axios from 'axios';
import AddTaskForm from './AddTaskForm';
import ITTaskProgressControl from './ITTaskProgressControl';
import ITTaskEditModal from './ITTaskEditModal';
import ITTaskDetailModal from './ITTaskDetailModal';
import { useUserStore } from '../../../store/user'; // Adjusted relative path
import { getWorkflowMeta } from '../utils/itWorkflow';

const statusColor = (s) => {
  switch (s) {
    case 'done': return 'green';
    case 'ongoing': return 'blue';
    case 'pending': return 'yellow';
    default: return 'gray';
  }
};

const ExternalTasksTab = ({ search, tasks, loading, fetchTasks, permissions = {}, focusedTaskId = '', focusedCommentId = '' }) => {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingPoints, setEditingPoints] = useState(1);
  const [showCompleted, setShowCompleted] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const toast = useToast();
  const { currentUser } = useUserStore();
  const token = currentUser?.token;

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subheadingColor = useColorModeValue('gray.600', 'gray.400');
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    if (!focusedTaskId || loading) return;
    const focusedTask = (tasks || []).find(
      (task) => String(task._id || task.id) === String(focusedTaskId) && task.projectType === 'external'
    );
    if (focusedTask) {
      setViewingTask(focusedTask);
    }
  }, [focusedTaskId, loading, tasks]);

  const markComplete = async (id) => {
    const featureCount = prompt('Enter the number of features/points for this task:', '1');
    if (featureCount === null) return;

    const points = parseInt(featureCount);
    if (isNaN(points) || points < 1) {
      toast({ title: 'Invalid input', description: 'Please enter a valid number of points (minimum 1)', status: 'error' });
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${id}`, {
        status: 'done',
        featureCount: points
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        fetchTasks();
        toast({ title: 'Task marked completed', status: 'success' });
      } else {
        toast({ title: 'Update failed', description: response.data.message || 'Failed to update task', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Update failed', description: err.response?.data?.message || err.message || 'Failed to update task', status: 'error' });
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/it/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          fetchTasks();
          toast({ title: 'Task deleted', status: 'success' });
        } else {
          toast({ title: 'Delete failed', description: response.data.message || 'Failed to delete task', status: 'error' });
        }
      } catch (err) {
        toast({ title: 'Delete failed', description: err.response?.data?.message || err.message || 'Failed to delete task', status: 'error' });
      }
    }
  };

  const startEditingPoints = (taskId, currentPoints) => {
    setEditingTaskId(taskId);
    setEditingPoints(currentPoints || 1);
  };

  const savePoints = async (taskId) => {
    try {
      const points = parseInt(editingPoints);
      if (isNaN(points) || points < 1) {
        toast({ title: 'Invalid input', description: 'Please enter a valid number of points (minimum 1)', status: 'error' });
        return;
      }

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${taskId}`, {
        featureCount: points
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        fetchTasks();
        setEditingTaskId(null);
        setEditingPoints(1);
        toast({ title: 'Points updated successfully', status: 'success' });
      } else {
        toast({ title: 'Update failed', description: response.data.message || 'Failed to update points', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Update failed', description: err.response?.data?.message || err.message || 'Failed to update points', status: 'error' });
    }
  };

  const cancelEditingPoints = () => {
    setEditingTaskId(null);
    setEditingPoints(1);
  };

  const filtered = (tasks || [])
    .filter(t => t.projectType === 'external')
    .filter(t => showCompleted || t.status !== 'done')
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => !searchTerm ||
      [t.client, ...(t.category ? t.category.split(', ') : [])]
        .join(' ')
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase())
    )
    .sort((a, b) => sort === 'newest' ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.startDate) - new Date(b.startDate));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedTasks = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, sort, showCompleted, searchTerm, pageSize]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Spinner size="xl" />
    </Box>
  );

  return (
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color={headingColor}>
            External Projects
          </Heading>
          <Text color={subheadingColor}>
            Manage client projects and external tasks
          </Text>
        </Box>

        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => setShowAdd(true)}
          isDisabled={!permissions.canCreateTasks}
        >
          Add External Task
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={subheadingColor}>
                Total Tasks
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1}>
                {(tasks || []).filter(t => t.projectType === 'external').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={subheadingColor}>
                In Progress
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="blue.500">
                {(tasks || []).filter(t => t.projectType === 'external' && t.status === 'ongoing').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={subheadingColor}>
                Completed
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="green.500">
                {(tasks || []).filter(t => t.projectType === 'external' && t.status === 'done').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={subheadingColor}>
                High Priority
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="red.500">
                {(tasks || []).filter(t => t.projectType === 'external' && t.priority === 'High').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="lg"
              />
            </InputGroup>

            <Select
              maxW="200px"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              borderRadius="lg"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ongoing">In Progress</option>
              <option value="done">Completed</option>
            </Select>

            <Button
              size="sm"
              colorScheme={showCompleted ? 'blue' : 'gray'}
              variant={showCompleted ? 'solid' : 'outline'}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </Button>

            <Select
              maxW="200px"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              borderRadius="lg"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </Select>

            <Select
              maxW="150px"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              borderRadius="lg"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </Select>

            <Button
              leftIcon={<FiFilter />}
              variant="outline"
              onClick={fetchTasks}
            >
              Refresh
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {filtered.length > 0 ? (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Client</Th>
                  <Th>Category</Th>
                  <Th>Timeline</Th>
                  <Th>Status</Th>
                  <Th>Progress</Th>
                  <Th>Priority</Th>
                  <Th>Points</Th>
                  <Th>Assignee</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pagedTasks.map((task) => (
                  <Tr key={task._id || task.id}>
                    <Td>
                      <Button variant="link" colorScheme="blue" fontWeight="medium" onClick={() => setViewingTask(task)}>
                        {task.client || 'N/A'}
                      </Button>
                    </Td>
                    <Td>
                      <Wrap spacing={2}>
                        {task.category ? (
                          task.category.split(', ').map((cat, idx) => (
                            <WrapItem key={idx}>
                              <Badge colorScheme="purple" variant="subtle">
                                {cat}
                              </Badge>
                            </WrapItem>
                          ))
                        ) : (
                          <Badge colorScheme="purple" variant="subtle">
                            N/A
                          </Badge>
                        )}
                      </Wrap>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Icon as={FiCalendar} color={iconColor} boxSize={4} />
                        <Text fontSize="sm">
                          {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={1}>
                        <Badge colorScheme={statusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge colorScheme={getWorkflowMeta(task.workflowStatus, task.status).color} variant="subtle">
                          {getWorkflowMeta(task.workflowStatus, task.status).label}
                        </Badge>
                      </VStack>
                    </Td>
                    <Td>
                      <ITTaskProgressControl task={task} fetchTasks={fetchTasks} />
                    </Td>
                    <Td>
                      <Badge colorScheme={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'green'}>
                        {task.priority}
                      </Badge>
                    </Td>
                    <Td>
                      {editingTaskId === (task._id || task.id) ? (
                        <HStack spacing={2}>
                          <Input
                            type="number"
                            min="1"
                            value={editingPoints}
                            onChange={(e) => setEditingPoints(e.target.value)}
                            width="80px"
                            size="sm"
                          />
                          <Button size="sm" colorScheme="green" onClick={() => savePoints(task._id || task.id)}>
                            Save
                          </Button>
                          <Button size="sm" onClick={cancelEditingPoints}>
                            Cancel
                          </Button>
                        </HStack>
                      ) : (
                        <HStack spacing={2}>
                          <Badge colorScheme={task.status === 'done' ? 'green' : 'gray'}>
                            {task.featureCount || (task.status === 'done' ? 1 : 0)} pts
                          </Badge>
                          {task.status === 'done' && (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => startEditingPoints(task._id || task.id, task.featureCount || 1)}
                            >
                              Edit
                            </Button>
                          )}
                        </HStack>
                      )}
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={2}>
                        {task.taskLeader && (
                          <Badge colorScheme="cyan" borderRadius="full" px={2}>
                            Leader: {task.taskLeader}
                          </Badge>
                        )}
                        <Wrap spacing={2}>
                          {task.assignedTo && task.assignedTo.map((person, idx) => (
                            <WrapItem key={idx}>
                              <HStack spacing={1}>
                                <Icon as={FiUser} color={iconColor} boxSize={4} />
                                <Text fontSize="sm">{person}</Text>
                              </HStack>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingTask(task)}
                        >
                          Details
                        </Button>
                        {task.status !== 'done' && permissions.canApproveTasks && (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => markComplete(task._id || task.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                        {permissions.canManageUsers && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => setEditingTask(task)}
                          >
                            Edit
                          </Button>
                        )}
                        {permissions.canDeleteTasks && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => deleteTask(task._id || task.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mt={4}>
              <Text fontSize="sm" color={mutedColor}>
                Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
              </Text>
              <HStack>
                <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} isDisabled={safePage <= 1}>
                  Previous
                </Button>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  Page {safePage} / {totalPages}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} isDisabled={safePage >= totalPages}>
                  Next
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Box textAlign="center" py={12} color={mutedColor}>
              <Icon as={FiSearch} boxSize={12} mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                No external tasks found
              </Text>
              <Text>
                Try adjusting your search or filter criteria
              </Text>
            </Box>
          </CardBody>
        </Card>
      )}

      <AddTaskForm
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onDone={fetchTasks}
        defaultProjectType="external"
      />
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
        focusedCommentId={focusedCommentId}
      />
    </VStack>
  );
};

export default ExternalTasksTab;
