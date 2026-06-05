import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiPlus,
  FiSearch,
  FiTrash2
} from 'react-icons/fi';
import { createTask, deleteTask, getMyTasks, getTaskStats, updateTask } from '../../services/taskService';

const emptyTaskForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
  status: 'Pending'
};

const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

const theme = {
  navy: '#001f4d',
  navyLight: '#062b63',
  gold: '#D99A00',
  goldSoft: '#FFF7DE',
  ink: '#081A34',
  muted: '#6E7890',
  border: '#E8EDF5',
  page: '#FAFBFD'
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const dateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const getTaskId = (task) => task?._id || task?.id;

const getStatusStyle = (status = '') => {
  switch (status) {
    case 'Completed':
      return { bg: '#E7F8EF', color: '#0B8A4A' };
    case 'In Progress':
      return { bg: '#EAF2FF', color: '#1C62C9' };
    case 'Cancelled':
      return { bg: '#FEECEC', color: '#CC2C2C' };
    default:
      return { bg: theme.goldSoft, color: theme.gold };
  }
};

const getPriorityStyle = (priority = '') => {
  switch (priority) {
    case 'Urgent':
      return { bg: '#FEECEC', color: '#CC2C2C' };
    case 'High':
      return { bg: '#FFF0F7', color: '#C12C7A' };
    case 'Low':
      return { bg: '#EAF8F0', color: '#128650' };
    default:
      return { bg: theme.goldSoft, color: theme.gold };
  }
};

const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'Completed') return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const isDueToday = (task) => {
  if (!task?.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
};

const normalizeTaskForm = (task = {}) => ({
  title: task.title || '',
  description: task.description || '',
  dueDate: dateInputValue(task.dueDate),
  priority: task.priority || 'Medium',
  status: task.status || 'Pending'
});

const TaskProgressCard = ({ stats }) => {
  const total = Number(stats.totalTasks || 0);
  const completed = Number(stats.completedTasks || 0);
  const pending = Number(stats.pendingTasks || 0);
  const overdue = Number(stats.overdueTasks || 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Box
      bg={`linear-gradient(135deg, ${theme.navy} 0%, ${theme.navyLight} 100%)`}
      borderRadius="16px"
      p={4}
      color="white"
      boxShadow="0 14px 32px rgba(0, 31, 77, 0.18)"
      overflow="hidden"
      position="relative"
    >
      <Box position="absolute" right="-26px" top="-36px" w="126px" h="126px" borderRadius="full" bg="rgba(217, 154, 0, 0.18)" />
      <Flex align="center" justify="space-between" gap={3} position="relative">
        <Box>
          <Text fontSize="13px" fontWeight="900">Tasks Progress</Text>
          <Text fontSize="22px" fontWeight="900" mt={2}>{completed} / {total} Completed</Text>
          <Text fontSize="11px" color="rgba(255,255,255,0.72)" fontWeight="700" mt={1}>
            {pending} pending {overdue > 0 ? `- ${overdue} overdue` : '- no overdue tasks'}
          </Text>
        </Box>
        <CircularProgress value={progress} color={theme.gold} trackColor="rgba(255,255,255,0.16)" size="72px" thickness="12px">
          <CircularProgressLabel fontSize="13px" fontWeight="900">{progress}%</CircularProgressLabel>
        </CircularProgress>
      </Flex>
    </Box>
  );
};

const MobileTaskCard = ({ task, onOpen, onStatus }) => {
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);
  const completed = task.status === 'Completed';
  const statusStyle = getStatusStyle(task.status);

  return (
    <Box bg="white" borderRadius="14px" borderWidth="1px" borderColor={overdue ? '#FFD6D6' : theme.border} boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)">
      <Flex align="flex-start" gap={3} p={4}>
        <IconButton
          aria-label={completed ? 'Task completed' : 'Mark completed'}
          icon={<FiCheckCircle />}
          size="sm"
          minW="30px"
          h="30px"
          borderRadius="9px"
          color={completed ? 'white' : theme.navy}
          bg={completed ? theme.navy : 'white'}
          borderWidth="1px"
          borderColor={completed ? theme.navy : '#C8D1DF'}
          _hover={{ bg: completed ? theme.navy : theme.goldSoft }}
          onClick={() => !completed && onStatus(task, 'Completed')}
          isDisabled={completed}
        />
        <Box minW={0} flex="1" as="button" type="button" textAlign="left" onClick={() => onOpen(task)}>
          <Text fontSize="15px" color={theme.ink} fontWeight="900" noOfLines={2}>{task.title}</Text>
          <HStack spacing={1.5} color={theme.muted} mt={1}>
            <Icon as={FiCalendar} boxSize={3} />
            <Text fontSize="11px" fontWeight="800">{formatDate(task.dueDate)}</Text>
          </HStack>
          {task.description && (
            <Text fontSize="12px" color={theme.muted} fontWeight="700" mt={2} noOfLines={2}>{task.description}</Text>
          )}
        </Box>
        <Badge {...getPriorityStyle(task.priority)} borderRadius="8px" px={2} py={1} flexShrink={0} textTransform="none" fontSize="10px">
          {task.priority}
        </Badge>
      </Flex>

      <Flex align="center" justify="space-between" px={4} py={3} borderTopWidth="1px" borderTopColor={theme.border}>
        <HStack spacing={2} flexWrap="wrap">
          <Badge {...statusStyle} borderRadius="8px" px={2} py={1} textTransform="none" fontSize="10px">{task.status}</Badge>
          {overdue && <Badge bg="#FEECEC" color="#CC2C2C" borderRadius="8px" px={2} py={1} textTransform="none" fontSize="10px">Overdue</Badge>}
          {dueToday && !overdue && <Badge bg={theme.goldSoft} color={theme.gold} borderRadius="8px" px={2} py={1} textTransform="none" fontSize="10px">Today</Badge>}
        </HStack>
        <HStack spacing={2}>
          <IconButton
            aria-label="Edit task"
            icon={<FiEdit3 />}
            size="sm"
            minW="32px"
            h="32px"
            borderRadius="9px"
            variant="outline"
            color={theme.navy}
            borderColor={theme.border}
            onClick={() => onOpen(task, true)}
          />
        </HStack>
      </Flex>
    </Box>
  );
};

const MobileTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const taskDisclosure = useDisclosure();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [taskData, statData] = await Promise.all([
        getMyTasks(),
        getTaskStats()
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setStats(statData || {});
    } catch (error) {
      toast({
        title: 'Could not load tasks',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || [task.title, task.description, task.priority, task.status]
        .some((value) => String(value || '').toLowerCase().includes(query));

      const matchesFilter = (() => {
        if (filter === 'all') return true;
        if (filter === 'today') return isDueToday(task);
        if (filter === 'overdue') return isOverdue(task);
        if (filter === 'completed') return task.status === 'Completed';
        return task.status !== 'Completed' && task.status !== 'Cancelled';
      })();

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const openTask = (task = null, edit = false) => {
    setSelectedTask(task);
    setTaskForm(task ? normalizeTaskForm(task) : { ...emptyTaskForm, dueDate: todayInputValue() });
    taskDisclosure.onOpen();
    if (edit) {
      setTimeout(() => {
        const input = document.querySelector('[name="title"]');
        input?.focus?.();
      }, 100);
    }
  };

  const closeTask = () => {
    if (saving || deleting) return;
    taskDisclosure.onClose();
    setSelectedTask(null);
    setTaskForm(emptyTaskForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateLocalTask = (updatedTask) => {
    setTasks((prev) => prev.map((task) => getTaskId(task) === getTaskId(updatedTask) ? updatedTask : task));
  };

  const refreshStats = async () => {
    try {
      const statData = await getTaskStats();
      setStats(statData || {});
    } catch {
      // Non-blocking; task list already changed.
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const updated = await updateTask(getTaskId(task), { status });
      updateLocalTask(updated);
      await refreshStats();
      toast({ title: 'Task updated', status: 'success', duration: 2200 });
    } catch (error) {
      toast({
        title: 'Could not update task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem('userId');
    setSaving(true);
    try {
      if (selectedTask) {
        const updated = await updateTask(getTaskId(selectedTask), taskForm);
        updateLocalTask(updated);
        toast({ title: 'Task saved', status: 'success', duration: 2200 });
      } else {
        if (!userId) throw new Error('Could not determine current user');
        const created = await createTask({
          ...taskForm,
          assignedTo: userId
        });
        setTasks((prev) => [created, ...prev]);
        toast({ title: 'Task created', status: 'success', duration: 2200 });
      }
      await refreshStats();
      closeTask();
    } catch (error) {
      toast({
        title: selectedTask ? 'Could not save task' : 'Could not create task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3600
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setDeleting(true);
    try {
      await deleteTask(getTaskId(selectedTask));
      setTasks((prev) => prev.filter((task) => getTaskId(task) !== getTaskId(selectedTask)));
      await refreshStats();
      toast({ title: 'Task deleted', status: 'success', duration: 2200 });
      closeTask();
    } catch (error) {
      toast({
        title: 'Could not delete task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box position="relative" bg={theme.page} minH="calc(100vh - 158px)">
      <TaskProgressCard stats={stats} />

      <InputGroup mt={4} mb={3}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="#9AA4B5" />
        </InputLeftElement>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          bg="white"
          borderColor={theme.border}
          borderRadius="12px"
          placeholder="Search tasks..."
          _placeholder={{ color: '#9AA4B5', fontWeight: 700 }}
          fontSize="14px"
          h="44px"
          color={theme.ink}
          fontWeight="800"
          boxShadow="0 8px 22px rgba(8, 26, 52, 0.04)"
        />
      </InputGroup>

      <HStack spacing={6} overflowX="auto" pb={2} mb={3} borderBottomWidth="1px" borderBottomColor={theme.border}>
        {[
          ['today', 'Today'],
          ['active', 'Upcoming'],
          ['completed', 'Completed'],
          ['overdue', 'Overdue'],
          ['all', 'All']
        ].map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            flexShrink={0}
            borderRadius={0}
            px={0}
            pb={3}
            h="34px"
            bg="transparent"
            color={filter === value ? theme.navy : theme.muted}
            borderBottomWidth="2px"
            borderBottomColor={filter === value ? theme.gold : 'transparent'}
            fontSize="12px"
            fontWeight="900"
            _hover={{ bg: 'transparent', color: theme.navy }}
            _active={{ bg: 'transparent' }}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </HStack>

      {loading ? (
        <Center py={16}>
          <Spinner color={theme.gold} />
        </Center>
      ) : (
        <VStack align="stretch" spacing={3} pt={1}>
          <Flex align="center" justify="space-between" px={1}>
            <Text fontSize="13px" color={theme.ink} fontWeight="900">
              {filteredTasks.length} tasks
            </Text>
            <Button
              size="sm"
              leftIcon={<FiPlus />}
              borderRadius="10px"
              bg={theme.gold}
              color="white"
              _hover={{ bg: '#C98D00' }}
              onClick={() => openTask()}
            >
              New
            </Button>
          </Flex>

          {filteredTasks.length === 0 ? (
            <Box bg="white" borderRadius="16px" p={6} borderWidth="1px" borderColor={theme.border} textAlign="center" boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)">
              <Center w="52px" h="52px" bg={theme.goldSoft} color={theme.gold} borderRadius="full" mx="auto" mb={3}>
                <Icon as={FiCheckCircle} boxSize={6} />
              </Center>
              <Text color={theme.ink} fontSize="16px" fontWeight="900">No tasks here</Text>
              <Text color={theme.muted} fontSize="12px" fontWeight="700" mt={1}>
                Try another filter or create a new task.
              </Text>
            </Box>
          ) : (
            filteredTasks.map((task) => (
              <MobileTaskCard
                key={getTaskId(task)}
                task={task}
                onOpen={openTask}
                onStatus={handleStatusChange}
              />
            ))
          )}
        </VStack>
      )}

      <IconButton
        aria-label="Create task"
        icon={<FiPlus />}
        position="fixed"
        right={5}
        bottom="86px"
        size="lg"
        borderRadius="full"
        bg={theme.gold}
        color="white"
        boxShadow="0 14px 30px rgba(217, 154, 0, 0.38)"
        _hover={{ bg: '#C98D00' }}
        onClick={() => openTask()}
      />

      <Modal isOpen={taskDisclosure.isOpen} onClose={closeTask} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.42)" />
        <ModalContent as="form" onSubmit={handleSaveTask} mt="auto" mb={0} mx={0} maxH="90vh" borderTopRadius="24px" borderBottomRadius={0} bg={theme.page} overflow="hidden">
          <ModalHeader px={5} pt={5} pb={4} bg={theme.navy} color="white">
            <Flex align="center" justify="space-between" gap={3}>
              <HStack minW={0} spacing={3}>
                <IconButton aria-label="Close task" icon={<FiArrowLeft />} variant="ghost" color="white" fontSize="22px" onClick={closeTask} _hover={{ bg: 'whiteAlpha.200' }} />
                <Box minW={0}>
                  <Text fontSize="20px" color="white" fontWeight="900">{selectedTask ? 'Task Details' : 'New Task'}</Text>
                  <Text fontSize="12px" color="rgba(255,255,255,0.72)" fontWeight="700" noOfLines={1}>
                    {selectedTask ? `Due ${formatDate(selectedTask.dueDate)}` : 'Create a task for your sales work.'}
                  </Text>
                </Box>
              </HStack>
              {selectedTask && (
                <IconButton
                  aria-label="Delete task"
                  icon={<FiTrash2 />}
                  variant="ghost"
                  color="#FFB4B4"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  isLoading={deleting}
                  onClick={handleDeleteTask}
                />
              )}
            </Flex>
          </ModalHeader>

          <ModalBody px={5} py={4} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Title</FormLabel>
                <Input name="title" value={taskForm.title} onChange={handleFormChange} bg="white" h="46px" borderRadius="12px" borderColor={theme.border} color={theme.ink} fontWeight="800" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Description</FormLabel>
                <Textarea name="description" value={taskForm.description} onChange={handleFormChange} bg="white" borderRadius="12px" borderColor={theme.border} color={theme.ink} fontWeight="700" rows={5} />
              </FormControl>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Due date</FormLabel>
                  <Input name="dueDate" type="date" min={todayInputValue()} value={taskForm.dueDate} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px" borderColor={theme.border} color={theme.ink} fontWeight="800" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Priority</FormLabel>
                  <Select name="priority" value={taskForm.priority} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px" borderColor={theme.border} color={theme.ink} fontWeight="800">
                    {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Status</FormLabel>
                <Select name="status" value={taskForm.status} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px" borderColor={theme.border} color={theme.ink} fontWeight="800">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={5} py={4} gap={3} bg="white" borderTopWidth="1px" borderTopColor={theme.border}>
            <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color={theme.muted} onClick={closeTask} isDisabled={saving}>
              Cancel
            </Button>
            <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit" isLoading={saving}>
              {selectedTask ? 'Save' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileTasks;
