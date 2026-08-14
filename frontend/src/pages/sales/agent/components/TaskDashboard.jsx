import React, { useState, useEffect, useRef } from 'react';
import { getMyTasks, updateTask, getTaskStats } from '../../../../services/taskService';
import { getSalesTargets, getAgentSalesStats } from '../../../../services/salesTargetService';
import { useUserStore } from '../../../../store/user';
import axios from '../../../../services/axiosInstance';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  useDisclosure,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Link,
  Collapse,
  useClipboard
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
  FiChevronDown,
  FiBell,
  FiBellOff,
  FiTrendingUp,
  FiBarChart2,
  FiBook,
  FiStar,
  FiAward,
  FiActivity,
  FiEye,
  FiCopy,
  FiExternalLink,
  FiInfo
} from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNotifications } from '../../../../hooks/useNotifications';

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const pushNotification = useNotifications([], tasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  
  const { currentUser } = useUserStore();
  
  // Sales targets and stats
  const [targets, setTargets] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState(null);
  
  // Notes
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI states
  const [activeTab, setActiveTab] = useState(0);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const toast = useToast();
  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure();
  const { isOpen: isNoteDetailOpen, onOpen: onNoteDetailOpen, onClose: onNoteDetailClose } = useDisclosure();
  const { isOpen: isAddNoteOpen, onOpen: onAddNoteOpen, onClose: onAddNoteClose } = useDisclosure();
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Refs for scrolling to specific tasks
  const taskRefs = useRef({});
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const progressColor = useColorModeValue('teal.500', 'teal.300');
  const highlightBg = useColorModeValue('teal.50', 'teal.900');
  const subtleBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch tasks and sales targets for the sales representative
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setTargetsLoading(true);
        setNotesLoading(true);
        
        // Get tasks assigned to the current sales representative
        const tasksResponse = await getMyTasks();
        setTasks(tasksResponse);
        
        // Automatically mark task notifications as read
        tasksResponse.forEach(task => {
          if (window.markTaskNotificationAsRead) {
            window.markTaskNotificationAsRead(task._id);
          }
        });
        
        // Get task statistics
        const statsResponse = await getTaskStats();
        setTaskStats(statsResponse);
        
        // Get sales targets and stats
        try {
          const targetsResponse = await getSalesTargets(currentUser?._id);
          const statsResponse = await getAgentSalesStats();
          
          setTargets(targetsResponse.data || []);
          setSalesStats(statsResponse);
          setTargetsError(null);
          
          // Automatically mark target notifications as read
          if (window.markTargetNotificationAsRead && targetsResponse.data) {
            targetsResponse.data.forEach(target => {
              if (window.markTargetNotificationAsRead) {
                window.markTargetNotificationAsRead(target._id);
              }
            });
          }
        } catch (targetsErr) {
          console.error('Error fetching targets:', targetsErr);
          setTargetsError(targetsErr.message || 'Failed to fetch sales targets');
        }
        
        // Fetch notes
        try {
          const response = await axios.get('/notes');
          setNotes(response.data);
        } catch (notesErr) {
          console.error('Error fetching notes:', notesErr);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch tasks');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch tasks',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        setTargetsLoading(false);
        setNotesLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchData();
    }
  }, [currentUser]);

  // Listen for focus events to scroll to specific tasks
  useEffect(() => {
    const handleFocusOnItem = (event) => {
      const { itemId } = event.detail;
      if (taskRefs.current[itemId]) {
        taskRefs.current[itemId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        taskRefs.current[itemId].style.backgroundColor = '#e6fffa';
        taskRefs.current[itemId].style.transition = 'background-color 0.5s';
        setTimeout(() => {
          if (taskRefs.current[itemId]) {
            taskRefs.current[itemId].style.backgroundColor = '';
          }
        }, 2000);
      }
    };

    window.addEventListener('focusOnItem', handleFocusOnItem);
    
    return () => {
      window.removeEventListener('focusOnItem', handleFocusOnItem);
    };
  }, []);

  // Handle update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskData = { status: newStatus };
      const updatedTask = await updateTask(taskId, taskData);
      
      // Update the task in the tasks list
      setTasks(prevTasks => 
        prevTasks.map(task => task._id === taskId ? updatedTask : task)
      );
      
      // Update task statistics
      const statsResponse = await getTaskStats();
      setTaskStats(statsResponse);
      
      toast({
        title: 'Task updated',
        description: `Task status has been updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update task status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Format date with time
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
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

  // Calculate performance percentage
  const calculatePerformance = (actual, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  // Check if task is overdue
  const isTaskOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    // Compare dates without time portion to avoid marking tasks due today as overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Get current targets (active ones)
  const currentTargets = targets.filter(target => {
    const now = new Date();
    return new Date(target.periodStart) <= now && new Date(target.periodEnd) >= now;
  });

  // Get upcoming tasks (due in next 7 days)
  const upcomingTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today && dueDate <= nextWeek && task.status !== 'Completed';
  });

  // Get overdue tasks
  const overdueTasks = tasks.filter(task => 
    isTaskOverdue(task.dueDate, task.status)
  );

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle save note
  const handleSaveNote = async () => {
    try {
      const noteData = { title: noteTitle, content: noteContent };
      
      if (selectedNoteId) {
        // Edit existing note
        const response = await axios.put(`/notes/${selectedNoteId}`, noteData);
        setNotes(notes.map(note => note._id === selectedNoteId ? response.data : note));
        toast({
          title: "Note updated.",
          description: "Your note was updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new note
        const response = await axios.post('/notes', noteData);
        setNotes([...notes, response.data]);
        toast({
          title: "Note saved.",
          description: "Your note was saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setSelectedNoteId(null);
      onAddNoteClose();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle edit note
  const handleEditNote = (note) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setSelectedNoteId(note._id);
    onAddNoteOpen();
  };

  // Handle delete note
  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/notes/${noteId}`);
      setNotes(notes.filter(note => note._id !== noteId));
      toast({
        title: "Note deleted.",
        description: "Your note was deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle view note detail
  const handleViewNoteDetail = (note) => {
    setSelectedNote(note);
    onNoteDetailOpen();
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // Render skeleton loader
  if (loading || targetsLoading || notesLoading) {
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
            <AlertTitle>Error loading tasks!</AlertTitle>
            <AlertDescription display="block">{error}</AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Performance score calculation
  const calculatePerformanceScore = () => {
    if (!salesStats || !currentTargets.length) return 0;
    
    const completedRatio = taskStats.totalTasks > 0 
      ? taskStats.completedTasks / taskStats.totalTasks 
      : 0;
    
    const targetProgress = currentTargets.reduce((acc, target) => {
      const actualValue = salesStats.completedDeals || 0;
      const targetValue = target.periodType === 'weekly' 
        ? target.weeklySalesTarget 
        : target.monthlySalesTarget;
      return acc + calculatePerformance(actualValue, targetValue) / 100;
    }, 0) / currentTargets.length;
    
    // Weighted average: 40% task completion, 60% target progress
    return Math.round((completedRatio * 0.4 + targetProgress * 0.6) * 100);
  };

  const performanceScore = calculatePerformanceScore();

  return (
    <Box p={{ base: 2, md: 6 }} maxW="100%">
      {/* Header */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }} 
        mb={{ base: 4, md: 6 }} 
        gap={{ base: 3, md: 4 }}
      >
        <VStack align="start" spacing={1}>
          <Heading 
            as="h1" 
            size={{ base: 'lg', md: 'xl' }} 
            color={headerColor}
            fontWeight="bold"
          >
            Sales Performance Dashboard
          </Heading>
          <Text fontSize="sm" color={textColor}>
            Welcome back, {currentUser?.username || 'Sales Representative'}
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FiBook />}
            colorScheme="teal"
            variant="outline"
            size="md"
            onClick={onNotesOpen}
          >
            My Notes
          </Button>
        </HStack>
      </Flex>
      
      {/* Performance Overview */}
      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} mb={6}>
        {/* Main Performance Card */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color={textColor}>
                <HStack>
                  <Icon as={FiActivity} />
                  <Text>Performance Overview</Text>
                </HStack>
              </Heading>
              <Badge colorScheme={performanceScore >= 80 ? 'green' : performanceScore >= 60 ? 'yellow' : 'red'} fontSize="lg">
                {performanceScore}% Score
              </Badge>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={4}>
              <Stat>
                <StatLabel fontSize="sm">Tasks Completed</StatLabel>
                <StatNumber fontSize="2xl">{taskStats.completedTasks}</StatNumber>
                <StatHelpText fontSize="xs">
                  of {taskStats.totalTasks} total
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel fontSize="sm">Sales Targets</StatLabel>
                <StatNumber fontSize="2xl">{currentTargets.length}</StatNumber>
                <StatHelpText fontSize="xs">
                  active targets
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel fontSize="sm">Deals Closed</StatLabel>
                <StatNumber fontSize="2xl">{salesStats?.completedDeals || 0}</StatNumber>
                <StatHelpText fontSize="xs">
                  this period
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel fontSize="sm">Active Customers</StatLabel>
                <StatNumber fontSize="2xl">{salesStats?.active || 0}</StatNumber>
                <StatHelpText fontSize="xs">
                  engaged accounts
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Box mt={4}>
              <Text fontSize="sm" mb={2}>Overall Performance</Text>
              <Progress 
                value={performanceScore} 
                colorScheme={performanceScore >= 80 ? 'green' : performanceScore >= 60 ? 'yellow' : 'red'} 
                size="md" 
                borderRadius="full" 
              />
            </Box>
          </CardBody>
        </Card>
        
        {/* Quick Stats */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" color={textColor} mb={4}>
              <HStack>
                <Icon as={FiTrendingUp} />
                <Text>Quick Stats</Text>
              </HStack>
            </Heading>
            
            <VStack align="stretch" spacing={3}>
              <Box p={3} bg={subtleBg} borderRadius="md">
                <Flex justify="space-between">
                  <Text fontSize="sm">Overdue Tasks</Text>
                  <Badge colorScheme="red">{overdueTasks.length}</Badge>
                </Flex>
              </Box>
              
              <Box p={3} bg={subtleBg} borderRadius="md">
                <Flex justify="space-between">
                  <Text fontSize="sm">Upcoming Tasks</Text>
                  <Badge colorScheme="yellow">{upcomingTasks.length}</Badge>
                </Flex>
              </Box>
              
              <Box p={3} bg={subtleBg} borderRadius="md">
                <Flex justify="space-between">
                  <Text fontSize="sm">Notes</Text>
                  <Badge colorScheme="blue">{notes.length}</Badge>
                </Flex>
              </Box>
              
              <Box p={3} bg={subtleBg} borderRadius="md">
                <Flex justify="space-between">
                  <Text fontSize="sm">Active Targets</Text>
                  <Badge colorScheme="green">{currentTargets.length}</Badge>
                </Flex>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
      
      {/* Targets and Progress Section */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color={textColor}>
              <HStack>
                <Icon as={FiTarget} />
                <Text>Sales Targets & Progress</Text>
              </HStack>
            </Heading>
            <Popover>
              <PopoverTrigger>
                <IconButton icon={<FiInfo />} size="sm" variant="ghost" />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>Target Information</PopoverHeader>
                <PopoverBody>
                  Track your progress towards sales targets. Each target shows your current performance 
                  against the assigned goal for the period.
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        </CardHeader>
        <CardBody>
          {targetsError ? (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Unable to load targets</AlertTitle>
                <AlertDescription display="block">{targetsError}</AlertDescription>
              </Box>
            </Alert>
          ) : currentTargets.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>No Active Targets</AlertTitle>
                <AlertDescription display="block">
                  You don't have any active sales targets at the moment. Contact your manager to set targets.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {currentTargets.map((target) => {
                // Calculate progress based on target type
                const actualValue = salesStats?.completedDeals || 0;
                const targetValue = target.periodType === 'weekly' 
                  ? target.weeklySalesTarget 
                  : target.monthlySalesTarget;
                
                const progressPercentage = calculatePerformance(actualValue, targetValue);
                
                return (
                  <Card key={target._id} p={4} borderWidth="1px" borderColor={borderColor} bg={progressPercentage >= 100 ? highlightBg : 'inherit'}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between" align="center">
                        <HStack>
                          <Icon as={FiAward} color={progressPercentage >= 100 ? 'green.500' : 'gray.500'} />
                          <Text fontWeight="bold" fontSize="lg">
                            {target.periodType.charAt(0).toUpperCase() + target.periodType.slice(1)} Target
                          </Text>
                        </HStack>
                        <Badge colorScheme={progressPercentage >= 100 ? 'green' : 'yellow'}>
                          {progressPercentage >= 100 ? 'Achieved' : 'In Progress'}
                        </Badge>
                      </Flex>
                      
                      <Text fontSize="sm" color={textColor}>
                        Period: {formatDate(target.periodStart)} - {formatDate(target.periodEnd)}
                      </Text>
                      
                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="sm">Progress</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {actualValue} / {targetValue} ({progressPercentage}%)
                          </Text>
                        </Flex>
                        <Progress 
                          value={progressPercentage} 
                          colorScheme={progressPercentage >= 100 ? 'green' : 'blue'} 
                          size="md" 
                          borderRadius="full" 
                        />
                      </Box>
                      
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mt={2}>
                        <Box p={3} bg={subtleBg} borderRadius="md">
                          <Text fontSize="sm" color={textColor}>Target</Text>
                          <Text fontWeight="bold" fontSize="xl">{targetValue}</Text>
                        </Box>
                        <Box p={3} bg={subtleBg} borderRadius="md">
                          <Text fontSize="sm" color={textColor}>Achieved</Text>
                          <Text fontWeight="bold" fontSize="xl">{actualValue}</Text>
                        </Box>
                        <Box p={3} bg={subtleBg} borderRadius="md">
                          <Text fontSize="sm" color={textColor}>Remaining</Text>
                          <Text fontWeight="bold" fontSize="xl">{Math.max(0, targetValue - actualValue)}</Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </Card>
                );
              })}
            </VStack>
          )}
        </CardBody>
      </Card>
      
      {/* Upcoming Tasks & Overdue Alerts */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} mb={6}>
        {/* Upcoming Tasks */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="md" color={textColor}>
              <HStack>
                <Icon as={FiCalendar} />
                <Text>Upcoming Tasks</Text>
                <Badge colorScheme="yellow">{upcomingTasks.length}</Badge>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            {upcomingTasks.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {upcomingTasks.slice(0, 5).map((task) => (
                  <Card 
                    key={task._id} 
                    p={3} 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    _hover={{ bg: subtleBg }}
                    cursor="pointer"
                    onClick={() => toggleTaskExpansion(task._id)}
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{task.title}</Text>
                        <HStack spacing={2}>
                          <Badge colorScheme={getPriorityColor(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                          <Badge colorScheme={getStatusColor(task.status)} size="sm">
                            {task.status}
                          </Badge>
                        </HStack>
                      </VStack>
                      <Text fontSize="sm" color="gray.500">
                        Due {formatDate(task.dueDate)}
                      </Text>
                    </Flex>
                    
                    <Collapse in={expandedTaskId === task._id} animateOpacity>
                      <Box mt={3} pt={3} borderTop="1px" borderColor={borderColor}>
                        <Text fontSize="sm" mb={2}>{task.description}</Text>
                        <HStack spacing={2}>
                          <Button 
                            size="sm" 
                            colorScheme="green" 
                            leftIcon={<FiCheck />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTaskStatus(task._id, 'Completed');
                            }}
                          >
                            Mark Complete
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            leftIcon={<FiEye />}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to full task view
                              window.dispatchEvent(new CustomEvent('navigateToSection', { 
                                detail: { section: 'Tasks', itemId: task._id } 
                              }));
                            }}
                          >
                            View Details
                          </Button>
                        </HStack>
                      </Box>
                    </Collapse>
                  </Card>
                ))}
              </VStack>
            ) : (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>No Upcoming Tasks</AlertTitle>
                  <AlertDescription display="block">
                    You don't have any tasks due in the next 7 days.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </CardBody>
        </Card>
        
        {/* Overdue Alerts */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="md" color={textColor}>
              <HStack>
                <Icon as={FiAlertTriangle} color="red.500" />
                <Text>Overdue Alerts</Text>
                <Badge colorScheme="red">{overdueTasks.length}</Badge>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            {overdueTasks.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {overdueTasks.slice(0, 3).map((task) => (
                  <Card 
                    key={task._id} 
                    p={3} 
                    borderWidth="1px" 
                    borderColor="red.200"
                    bg="red.50"
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{task.title}</Text>
                        <Badge colorScheme="red" size="sm">
                          {Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                        </Badge>
                      </VStack>
                      <IconButton 
                        icon={<FiX />} 
                        size="sm" 
                        colorScheme="red"
                        onClick={() => handleUpdateTaskStatus(task._id, 'Cancelled')}
                      />
                    </Flex>
                  </Card>
                ))}
              </VStack>
            ) : (
              <Alert status="success" borderRadius="lg">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>All Caught Up!</AlertTitle>
                  <AlertDescription display="block">
                    You don't have any overdue tasks. Great job!
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </CardBody>
        </Card>
      </Grid>
      
      {/* Notes Quick View */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color={textColor}>
              <HStack>
                <Icon as={FiBook} />
                <Text>Recent Notes</Text>
                <Badge colorScheme="blue">{notes.length}</Badge>
              </HStack>
            </Heading>
            <HStack>
              <Button size="sm" onClick={onNotesOpen}>
                View All
              </Button>
              <Button size="sm" leftIcon={<FiPlus />} onClick={onAddNoteOpen}>
                Add Note
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {notes.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              {notes.slice(0, 3).map((note) => (
                <Card 
                  key={note._id} 
                  p={3} 
                  borderWidth="1px" 
                  borderColor={borderColor}
                  _hover={{ bg: subtleBg }}
                  cursor="pointer"
                  onClick={() => handleViewNoteDetail(note)}
                >
                  <Flex justify="space-between" align="flex-start">
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontWeight="bold" noOfLines={1}>{note.title}</Text>
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDateTime(note.updatedAt)}
                      </Text>
                    </VStack>
                    <HStack>
                      <IconButton 
                        icon={<FiEdit2 />} 
                        size="xs" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                      />
                      <IconButton 
                        icon={<FiTrash2 />} 
                        size="xs" 
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                      />
                    </HStack>
                  </Flex>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>No Notes Yet</AlertTitle>
                <AlertDescription display="block">
                  You haven't created any notes. Start by adding your first note to keep track of important information.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </CardBody>
      </Card>
      
      {/* Task List */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color={textColor}>
              <HStack>
                <Icon as={FiCheckCircle} />
                <Text>All Assigned Tasks</Text>
                <Badge colorScheme="blue">{tasks.length}</Badge>
              </HStack>
            </Heading>
            
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
        </CardHeader>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Assigned By</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Due Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tasks.map((task) => (
                  <Tr 
                    key={task._id} 
                    ref={(el) => taskRefs.current[task._id] = el}
                    onClick={() => {
                      // Mark the notification as read when task is viewed
                      if (window.markTaskNotificationAsRead) {
                        window.markTaskNotificationAsRead(task._id);
                      }
                    }} 
                    style={{ cursor: 'pointer' }}
                    bg={isTaskOverdue(task.dueDate, task.status) ? 'red.50' : 'inherit'}
                  >
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{task.title}</Text>
                        <Text fontSize="sm" color="gray.500">{task.description}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Icon as={FiUser} />
                        <Text>{task.assignedBy?.username || 'Unknown Manager'}</Text>
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
                      <Text color={isTaskOverdue(task.dueDate, task.status) ? 'red.500' : 'inherit'}>
                        {formatDate(task.dueDate)}
                        {isTaskOverdue(task.dueDate, task.status) && (
                          <Text fontSize="xs" color="red.500">(Overdue)</Text>
                        )}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {task.status !== 'Completed' && (
                          <Tooltip label="Mark as Completed">
                            <IconButton
                              icon={<FiCheck />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                            />
                          </Tooltip>
                        )}
                        {task.status === 'Completed' && (
                          <Tooltip label="Reopen Task">
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="yellow"
                              onClick={() => handleUpdateTaskStatus(task._id, 'Pending')}
                            />
                          </Tooltip>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
      
      {/* Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW={{ base: "95%", md: "800px" }}>
          <ModalHeader>
            <HStack>
              <Icon as={FiBook} />
              <Text>My Notes</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  size="md"
                />
                <Button leftIcon={<FiPlus />} onClick={onAddNoteOpen}>
                  Add Note
                </Button>
              </HStack>
              
              {filteredNotes.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {filteredNotes.map((note) => (
                    <Card 
                      key={note._id} 
                      p={4} 
                      borderWidth="1px" 
                      borderColor={borderColor}
                      _hover={{ bg: subtleBg }}
                      cursor="pointer"
                      onClick={() => handleViewNoteDetail(note)}
                    >
                      <Flex justify="space-between" align="flex-start">
                        <VStack align="start" spacing={2} flex={1}>
                          <Text fontWeight="bold" noOfLines={1}>{note.title}</Text>
                          <Text fontSize="sm" color={textColor} noOfLines={3}>
                            {note.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Updated: {formatDateTime(note.updatedAt)}
                          </Text>
                        </VStack>
                        <HStack>
                          <IconButton 
                            icon={<FiEdit2 />} 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNote(note);
                            }}
                          />
                          <IconButton 
                            icon={<FiTrash2 />} 
                            size="sm" 
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note._id);
                            }}
                          />
                        </HStack>
                      </Flex>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle>No Notes Found</AlertTitle>
                    <AlertDescription display="block">
                      {searchQuery ? 'No notes match your search.' : 'You haven\'t created any notes yet.'}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onNotesClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Note Detail Modal */}
      <Modal isOpen={isNoteDetailOpen} onClose={onNoteDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW={{ base: "95%", md: "800px" }}>
          <ModalHeader>
            <HStack justify="space-between" w="100%">
              <HStack>
                <Icon as={FiBook} />
                <Text>{selectedNote?.title}</Text>
              </HStack>
              <HStack>
                <IconButton 
                  icon={<FiEdit2 />} 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    onNoteDetailClose();
                    handleEditNote(selectedNote);
                  }}
                />
                <IconButton 
                  icon={<FiTrash2 />} 
                  size="sm" 
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => {
                    handleDeleteNote(selectedNote._id);
                    onNoteDetailClose();
                  }}
                />
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.500">
                Last updated: {selectedNote && formatDateTime(selectedNote.updatedAt)}
              </Text>
            </Box>
            <Box 
              dangerouslySetInnerHTML={{ __html: selectedNote?.content }} 
              p={4} 
              bg={subtleBg} 
              borderRadius="md"
              minHeight="200px"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onNoteDetailClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Add/Edit Note Modal */}
      <Modal isOpen={isAddNoteOpen} onClose={onAddNoteClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW={{ base: "95%", md: "800px" }}>
          <ModalHeader>
            <HStack>
              <Icon as={FiBook} />
              <Text>{selectedNoteId ? 'Edit Note' : 'Add New Note'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Content</FormLabel>
                <ReactQuill
                  value={noteContent}
                  onChange={setNoteContent}
                  placeholder="Enter note content..."
                  theme="snow"
                  style={{ minHeight: '200px' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddNoteClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="teal" 
              onClick={handleSaveNote}
              isDisabled={!noteTitle.trim() || !noteContent.trim()}
            >
              Save Note
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TaskDashboard;
