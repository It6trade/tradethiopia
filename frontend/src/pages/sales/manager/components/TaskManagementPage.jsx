import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Button,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  HStack,
  VStack,
  Divider,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiUser, 
  FiUsers, 
  FiTarget, 
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiFilter,
  FiChevronDown
} from 'react-icons/fi';
import { getTeamPerformance, getAllAgents } from '../../../../services/salesManagerService';
import { getTasksForManager, createTask, updateTask, deleteTask, getTaskStats } from '../../../../services/taskService';

const TaskManagementPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State for edit modal
  const [editingTask, setEditingTask] = useState(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch agents and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all sales agents
        const agentsResponse = await getAllAgents();
        setAgents(agentsResponse);
        
        // Get tasks assigned by the current sales manager
        const tasksResponse = await getTasksForManager();
        
        // Process tasks to include agent names
        const processedTasks = tasksResponse.map(task => ({
          ...task,
          assignedToName: task.assignedTo?.username || 'Unknown Agent',
          assignedByName: task.assignedBy?.username || 'Unknown Manager'
        }));
        
        setTasks(processedTasks);
        
        // Get task statistics
        const statsResponse = await getTaskStats();
        setTaskStats(statsResponse);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle assign task
  const handleAssignTask = async (taskData) => {
    try {
      // Validate that due date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(taskData.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        toast({
          title: "Invalid Due Date",
          description: "Due date cannot be in the past. Please select a date starting from today.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const newTask = await createTask(taskData);
      
      // Process the new task to include agent names (same as in useEffect)
      const processedNewTask = {
        ...newTask,
        assignedToName: newTask.assignedTo?.username || 'Unknown Agent',
        assignedByName: newTask.assignedBy?.username || 'Unknown Manager'
      };
      
      setTasks(prev => [...prev, processedNewTask]);
      onClose();
      
      toast({
        title: "Task assigned successfully",
        description: "The task has been assigned to the sales representative.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error assigning task",
        description: err.message || "Failed to assign task",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    onEditOpen();
  };

  // Handle update task
  const handleUpdateTask = async (taskData) => {
    try {
      // Validate that due date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(taskData.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        toast({
          title: "Invalid Due Date",
          description: "Due date cannot be in the past. Please select a date starting from today.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const updatedTask = await updateTask(editingTask._id, taskData);
      
      // Process the updated task to include agent names (same as in useEffect)
      const processedUpdatedTask = {
        ...updatedTask,
        assignedToName: updatedTask.assignedTo?.username || 'Unknown Agent',
        assignedByName: updatedTask.assignedBy?.username || 'Unknown Manager'
      };
      
      // Update the task in the tasks list
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === editingTask._id ? processedUpdatedTask : task)
      );
      
      // Update task statistics
      const statsResponse = await getTaskStats();
      setTaskStats(statsResponse);
      
      onEditClose();
      setEditingTask(null);
      
      toast({
        title: "Task updated successfully",
        description: "The task has been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error updating task",
        description: err.message || "Failed to update task",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        
        // Remove the task from the tasks list
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        
        // Update task statistics
        const statsResponse = await getTaskStats();
        setTaskStats(statsResponse);
        
        toast({
          title: 'Task deleted',
          description: 'Task has been successfully deleted',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to delete task',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'green';
      case 'In Progress': return 'blue';
      case 'Pending': return 'yellow';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Skeleton height="36px" width="200px" />
          <Skeleton height="40px" width="120px" />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} height="120px" borderRadius="lg" />
          ))}
        </SimpleGrid>
        <Card>
          <CardBody>
            <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
          </CardBody>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error loading data!</AlertTitle>
            <AlertDescription display="block">{error}</AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Task statistics cards
  const statCards = [
    {
      title: 'Total Tasks',
      value: taskStats.totalTasks,
      icon: FiCheckCircle,
      color: 'blue'
    },
    {
      title: 'Completed',
      value: taskStats.completedTasks,
      icon: FiCheck,
      color: 'green'
    },
    {
      title: 'Pending',
      value: taskStats.pendingTasks,
      icon: FiClock,
      color: 'yellow'
    },
    {
      title: 'Overdue',
      value: taskStats.overdueTasks,
      icon: FiAlertTriangle,
      color: 'red'
    }
  ];

  return (
    <Box p={{ base: 2, md: 6 }} maxW="100%">
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }} 
        mb={{ base: 4, md: 6 }} 
        gap={{ base: 3, md: 4 }}
      >
        <Heading 
          as="h1" 
          size={{ base: 'lg', md: 'xl' }} 
          color={headerColor}
          fontWeight="bold"
        >
          Task Management
        </Heading>
        
        <Button
          leftIcon={<FiPlus />}
          colorScheme="teal"
          onClick={onOpen}
          size="md"
        >
          Assign Task
        </Button>
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        {statCards.map((stat, index) => (
          <Card 
            key={index}
            boxShadow="md" 
            _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }} 
            bg={`${stat.color}.500`} 
            color="white"
            transition="all 0.2s"
          >
            <CardBody textAlign="center">
              <Icon as={stat.icon} w={8} h={8} mb={3} />
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{stat.value}</Text>
              <Text>{stat.title}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
      
      {/* Task List */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8}>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color={textColor}>Assigned Tasks</Heading>
            
            <Menu>
              <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm">
                Filter
              </MenuButton>
              <MenuList>
                <MenuItem>All Tasks</MenuItem>
                <MenuItem>Completed</MenuItem>
                <MenuItem>Pending</MenuItem>
                <MenuItem>Overdue</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
          
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Assigned To</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Due Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tasks.map((task) => (
                  <Tr key={task._id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{task.title}</Text>
                        <Text fontSize="sm" color="gray.500">{task.description}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Icon as={FiUser} />
                        <Text>{task.assignedToName}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text>{formatDate(task.dueDate)}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Edit Task">
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEditTask(task)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete Task">
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteTask(task._id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
      
      {/* Assign Task Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign New Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form id="assign-task-form">
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Task Title</FormLabel>
                  <Input name="title" placeholder="Enter task title" />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input name="description" placeholder="Enter task description" />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Assign To</FormLabel>
                  <Select name="assignedTo" placeholder="Select agent">
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.username}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Priority</FormLabel>
                  <Select name="priority" placeholder="Select priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Due Date</FormLabel>
                  <Input 
                    name="dueDate" 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]} // Set min to today
                  />
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={() => {
              // Get form data and call handleAssignTask
              const form = document.getElementById('assign-task-form');
              const formData = new FormData(form);
              const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                assignedTo: formData.get('assignedTo'),
                priority: formData.get('priority') || 'Medium',
                dueDate: formData.get('dueDate')
              };
              
              handleAssignTask(taskData);
            }}>
              Assign Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Edit Task Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { onEditClose(); setEditingTask(null); }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingTask && (
              <form id="edit-task-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const taskData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  assignedTo: formData.get('assignedTo'),
                  priority: formData.get('priority') || 'Medium',
                  dueDate: formData.get('dueDate')
                };
                handleUpdateTask(taskData);
              }}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Task Title</FormLabel>
                    <Input 
                      name="title" 
                      defaultValue={editingTask.title}
                      placeholder="Enter task title"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input 
                      name="description" 
                      defaultValue={editingTask.description}
                      placeholder="Enter task description"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      name="assignedTo" 
                      placeholder="Select sales representative"
                      defaultValue={editingTask.assignedTo?._id || editingTask.assignedTo}
                    >
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.username}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      name="priority" 
                      defaultValue={editingTask.priority}
                      placeholder="Select priority"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Due Date</FormLabel>
                    <Input 
                      name="dueDate" 
                      type="date" 
                      defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                </VStack>
              </form>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { onEditClose(); setEditingTask(null); }}>
              Cancel
            </Button>
            <Button 
              colorScheme="teal" 
              type="submit" 
              form="edit-task-form"
            >
              Update Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TaskManagementPage;