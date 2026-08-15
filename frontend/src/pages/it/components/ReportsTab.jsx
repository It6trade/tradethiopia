import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  HStack,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Badge,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  useColorModeValue,
  Wrap,
  WrapItem,
  Progress,
  useToast
} from '@chakra-ui/react';
import { FiSearch, FiDownload, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import { useUserStore } from '../../../store/user'; // Adjusted relative path

const ReportsTab = ({ reports, loading, fetchReports }) => {
  const [dateRange, setDateRange] = useState('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingPoints, setEditingPoints] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const toast = useToast();
  const { currentUser } = useUserStore();
  const token = currentUser?.token;

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const INTERNAL_PLATFORMS = [
    'Tradeethiopian.com',
    'Tradethiopia.com',
    'Tesbinn.com',
    'Enisra.com',
    'Tradextv.com',
    'Trainings',
    'Documentation',
    'Meetings',
    'Maintenance'
  ];

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const startEditing = (reportId, currentPoints) => {
    setEditingTaskId(reportId);
    setEditingPoints(currentPoints);
  };

  const savePoints = async (reportId) => {
    try {
      const points = parseInt(editingPoints);
      if (isNaN(points) || points < 1) {
        toast({ title: 'Invalid input', description: 'Please enter a valid number of points (minimum 1)', status: 'error' });
        return;
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/reports/${reportId}`, {
        points: points
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchReports();
      setEditingTaskId(null);
      setEditingPoints(1);
      
      toast({ title: 'Points updated', status: 'success' });
    } catch (err) {
      toast({
        title: 'Failed to update points',
        description: err.response?.data?.message || 'Failed to update points',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingPoints(1);
  };

  const calculateTaskPoints = (task) => {
    if (task.status === 'done') {
      return task.points || task.featureCount || 1;
    }
    return 0;
  };

  const filterTasksByDate = (tasks, range) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (now.getDay() + 6) % 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      default:
        return tasks;
    }
    
    return (tasks || []).filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt || task.date || now);
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  const calculateStats = () => {
    const filteredTasks = filterTasksByDate(reports, dateRange);
    const finalFilteredTasks = filteredTasks.filter(t => t.status === 'done');
    
    const tasksByPerson = {};
    finalFilteredTasks.forEach(task => {
      if (task.personnelName && task.personnelName.length > 0) {
        task.personnelName.forEach(person => {
          if (!tasksByPerson[person]) {
            tasksByPerson[person] = [];
          }
          tasksByPerson[person].push(task);
        });
      } else {
        if (!tasksByPerson['Unassigned']) {
          tasksByPerson['Unassigned'] = [];
        }
        tasksByPerson['Unassigned'].push(task);
      }
    });
    
    const personStats = {};
    let totalPoints = 0;
    
    Object.keys(tasksByPerson).forEach(person => {
      let personPoints = 0;
      
      tasksByPerson[person]
        .filter(task => task.status === 'done')
        .forEach(task => {
          const taskPoints = calculateTaskPoints(task);
          personPoints += taskPoints;
        });
      
      personStats[person] = {
        totalPoints: personPoints,
        completedTasks: tasksByPerson[person].filter(task => task.status === 'done').length,
        totalTasks: tasksByPerson[person].length,
        target: dateRange === 'weekly' ? 40 : 
                dateRange === 'monthly' ? 160 : 
                dateRange === 'yearly' ? 2080 : 40,
        delta: personPoints - (dateRange === 'weekly' ? 40 : 
                               dateRange === 'monthly' ? 160 : 
                               dateRange === 'yearly' ? 2080 : 40),
        percentage: (dateRange === 'weekly' ? 40 : 
                     dateRange === 'monthly' ? 160 : 
                     dateRange === 'yearly' ? 2080 : 40) > 0 ? 
                     Math.min(100, Math.round((personPoints / (dateRange === 'weekly' ? 40 : 
                                                                dateRange === 'monthly' ? 160 : 
                                                                dateRange === 'yearly' ? 2080 : 40)) * 100)) : 0
      };
      
      personStats[person].statusIndicator = 'red';
      if (personStats[person].percentage >= 100) {
        personStats[person].statusIndicator = 'green';
      } else if (personStats[person].percentage >= 70) {
        personStats[person].statusIndicator = 'yellow';
      }
      
      totalPoints += personPoints;
    });
    
    const totalTarget = Object.keys(personStats).length * (dateRange === 'weekly' ? 40 : 
                                                           dateRange === 'monthly' ? 160 : 
                                                           dateRange === 'yearly' ? 2080 : 40) || 40;
    
    const overallStats = {
      totalPoints,
      completedTasks: finalFilteredTasks.filter(t => t.status === 'done').length,
      totalTasks: finalFilteredTasks.length,
      delta: totalPoints - totalTarget,
      percentage: totalTarget > 0 ? Math.min(100, Math.round((totalPoints / totalTarget) * 100)) : 0,
      statusIndicator: 'red',
      target: totalTarget,
      personStats
    };
    
    if (overallStats.percentage >= 100) {
      overallStats.statusIndicator = 'green';
    } else if (overallStats.percentage >= 70) {
      overallStats.statusIndicator = 'yellow';
    }
    
    return overallStats;
  };

  const formatTaskDate = (task) => {
    const rawDate = task.date || task.startDate || task.createdAt || task.updatedAt;
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getTaskItems = (task) => {
    const isInternal = (task.projectType || '').toLowerCase() === 'internal';
    let raw = task.taskDetails;

    if (!raw) {
      if (isInternal) {
        raw = task.platform || (task.taskRef && task.taskRef.platform) || '';
      } else {
        raw = task.category || (task.taskRef && (task.taskRef.category || task.taskRef.taskDetails)) || '';
      }
    }

    if (isInternal) {
      const allowed = INTERNAL_PLATFORMS;
      const normalize = (value) => {
        if (!value) return null;
        const trimmed = String(value).trim();
        if (!trimmed) return null;
        return trimmed;
      };

      let candidates = [];
      if (Array.isArray(raw)) {
        candidates = raw.map(normalize).filter(Boolean);
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed) {
          const parts = trimmed.split(',').map((v) => normalize(v)).filter(Boolean);
          candidates = parts.length ? parts : [trimmed];
        }
      }

      let items = candidates.filter((v) => allowed.includes(v));
      if (!items.length && task.projectName) {
        const fromProjectName = String(task.projectName)
          .split(',')
          .map((v) => normalize(v))
          .filter((v) => v && allowed.includes(v));
        if (fromProjectName.length) {
          items = fromProjectName;
        }
      }
      return items;
    }

    const values = [];
    const pushValue = (value) => {
      if (!value) return;
      const trimmed = String(value).trim();
      if (!trimmed) return;
      values.push(trimmed);
    };

    if (Array.isArray(raw)) {
      raw.forEach(pushValue);
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if (trimmed.includes(',')) {
        trimmed.split(',').forEach(pushValue);
      } else {
        pushValue(trimmed);
      }
    } else {
      return [];
    }

    const seen = new Set();
    return values.filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  };

  const countTaskTargets = (task) => {
    return getTaskItems(task).length || 0;
  };

  const getDisplayTaskName = (task) => {
    const isInternal = (task.projectType || '').toLowerCase() === 'internal';
    if (isInternal) {
      return task.taskName || '';
    }
    return task.taskName || task.client || task.projectName || '';
  };

  const filteredTasks = filterTasksByDate(reports, dateRange).filter(task => {
    if (task.status !== 'done') return false;
    
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      task.taskName?.toLowerCase().includes(search) ||
      task.projectName?.toLowerCase().includes(search) ||
      task.client?.toLowerCase().includes(search);
    
    const matchesPerson = selectedPerson === 'all' || 
      (task.personnelName && task.personnelName.includes(selectedPerson)) ||
      (selectedPerson === 'Unassigned' && (!task.personnelName || task.personnelName.length === 0));

    let matchesDateRange = true;
    if (fromDate || toDate) {
      const taskDateRaw = task.completionDate || task.endDate || task.date || task.createdAt || task.updatedAt;
      if (taskDateRaw) {
        const d = new Date(taskDateRaw);
        if (!Number.isNaN(d.getTime())) {
          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (d < from) matchesDateRange = false;
          }
          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (d > to) matchesDateRange = false;
          }
        }
      }
    }
    
    return matchesSearch && matchesPerson && matchesDateRange;
  });

  const assignees = [...new Set((reports || []).flatMap(task => 
    task.personnelName && task.personnelName.length > 0 ? task.personnelName : ['Unassigned']
  ))].sort();

  const stats = calculateStats();
  const personStatsArray = stats.personStats ? 
    Object.keys(stats.personStats).map(person => ({
      name: person,
      ...stats.personStats[person]
    })) : [];

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Spinner size="xl" />
    </Box>
  );

  return (
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
            IT Performance Reports
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            {dateRange === 'weekly' ? 'Weekly' : dateRange === 'monthly' ? 'Monthly' : 'Yearly'} completed task performance tracking
          </Text>
        </Box>
        
        <HStack spacing={3}>
          <Button 
            leftIcon={<FiDownload />} 
            colorScheme="blue" 
            variant="outline"
          >
            Export {dateRange === 'weekly' ? 'Weekly' : dateRange === 'monthly' ? 'Monthly' : 'Yearly'} Report
          </Button>
        </HStack>
      </HStack>

      <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Text fontWeight="medium" color={useColorModeValue('gray.800', 'white')}>
              View by:
            </Text>
            <Button 
              size="sm"
              colorScheme={dateRange === 'weekly' ? 'blue' : 'gray'}
              variant={dateRange === 'weekly' ? 'solid' : 'outline'}
              onClick={() => setDateRange('weekly')}
            >
              Weekly
            </Button>
            <Button 
              size="sm"
              colorScheme={dateRange === 'monthly' ? 'blue' : 'gray'}
              variant={dateRange === 'monthly' ? 'solid' : 'outline'}
              onClick={() => setDateRange('monthly')}
            >
              Monthly
            </Button>
            <Button 
              size="sm"
              colorScheme={dateRange === 'yearly' ? 'blue' : 'gray'}
              variant={dateRange === 'yearly' ? 'solid' : 'outline'}
              onClick={() => setDateRange('yearly')}
            >
              Yearly
            </Button>
            <Button 
              size="sm"
              leftIcon={<FiRefreshCw />}
              variant="outline"
              onClick={fetchReports}
            >
              Refresh Data
            </Button>

            <HStack spacing={2}>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                From:
              </Text>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                maxW="180px"
              />
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                To:
              </Text>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                maxW="180px"
              />
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Total Points
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1}>
                {stats.totalPoints}
              </StatNumber>
              <HStack mt={2}>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                  Target: {stats.target}
                </Text>
                <Badge colorScheme={stats.statusIndicator}>
                  {stats.delta >= 0 ? '+' : ''}{stats.delta}
                </Badge>
              </HStack>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Total Tasks
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="green.500">
                {stats.completedTasks}
              </StatNumber>
              <Text mt={2} fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                Completed tasks
              </Text>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Completion Rate
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="green.500">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </StatNumber>
              <HStack mt={2} spacing={2}>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                  {stats.completedTasks}/{stats.totalTasks} tasks
                </Text>
              </HStack>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                  Target Progress
                </Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  {stats.totalPoints} of {stats.target} points
                </Text>
              </Box>
              
              <Badge 
                fontSize="sm" 
                px={2} 
                py={1} 
                colorScheme={stats.statusIndicator}
                borderRadius="full"
              >
                {stats.statusIndicator === 'green' ? 'On Track' : 
                 stats.statusIndicator === 'yellow' ? 'Needs Attention' : 'Behind'}
              </Badge>
            </HStack>
            
            <Progress 
              value={stats.percentage} 
              colorScheme={stats.statusIndicator} 
              size="sm" 
              borderRadius="full" 
              mt={3}
            />
          </CardBody>
        </Card>
      </SimpleGrid>

      {personStatsArray.length > 0 && (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
              Individual Performance
            </Heading>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Each person has a {dateRange === 'weekly' ? '40' : dateRange === 'monthly' ? '160' : '2080'} point target
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: personStatsArray.length > 4 ? 4 : personStatsArray.length }} spacing={4}>
              {personStatsArray.map((person, index) => (
                <Card key={index} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" p={4}>
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold" fontSize="md" isTruncated>
                      {person.name}
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Points:</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {person.totalPoints} / {person.target}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Tasks:</Text>
                      <Text fontSize="sm">
                        {person.completedTasks} completed
                      </Text>
                    </HStack>
                    <Progress 
                      value={person.percentage} 
                      colorScheme={person.statusIndicator} 
                      size="sm" 
                      borderRadius="full" 
                    />
                    <HStack justify="space-between">
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                        {person.percentage}%
                      </Text>
                      <Badge fontSize="xs" colorScheme={person.statusIndicator}>
                        {person.statusIndicator === 'green' ? 'On Track' : 
                         person.statusIndicator === 'yellow' ? 'Needs Attention' : 'Behind'}
                      </Badge>
                    </HStack>
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

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
              value={selectedPerson} 
              onChange={(e) => setSelectedPerson(e.target.value)}
              borderRadius="lg"
            >
              <option value="all">All People</option>
              {assignees.map((person, index) => (
                <option key={index} value={person}>{person}</option>
              ))}
            </Select>
            
            <Button 
              leftIcon={<FiRefreshCw />} 
              variant="outline"
              onClick={fetchReports}
            >
              Refresh
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {filteredTasks.length > 0 ? (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Task Name</Th>
                  <Th>Type</Th>
                  <Th>Task</Th>
                  <Th>Target</Th>
                  <Th>Actual</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredTasks.map((task) => {
                  const points = calculateTaskPoints(task);
                  const isInternal = (task.projectType || '').toLowerCase() === 'internal';
                  const taskItems = getTaskItems(task);
                  const targetCount = countTaskTargets(task);
                  const displayTaskName = getDisplayTaskName(task);

                  return (
                    <Tr key={task._id}>
                      <Td>
                        {formatTaskDate(task)}
                      </Td>
                      <Td fontWeight="medium">
                        {displayTaskName}
                      </Td>
                      <Td>
                        <Badge colorScheme={isInternal ? 'blue' : 'purple'}>
                          {task.projectType}
                        </Badge>
                      </Td>
                      <Td>
                        <Text>
                          {taskItems.join(', ')}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={targetCount > 0 ? 'blue' : 'gray'}>
                          {targetCount}
                        </Badge>
                      </Td>
                      <Td>
                        {editingTaskId === task._id ? (
                          <HStack>
                            <Input 
                              type="number" 
                              min="1"
                              value={editingPoints}
                              onChange={(e) => setEditingPoints(e.target.value)}
                              width="80px"
                            />
                            <Button size="sm" colorScheme="green" onClick={() => savePoints(task._id)}>
                              Save
                            </Button>
                            <Button size="sm" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </HStack>
                        ) : (
                          <HStack>
                            <Badge colorScheme={points > 0 ? 'green' : 'gray'}>
                              {points} pts
                            </Badge>
                            <Button size="sm" onClick={() => startEditing(task._id, points)}>
                              Edit
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Box textAlign="center" py={12} color={useColorModeValue('gray.500', 'gray.400')}>
              <Icon as={FiSearch} boxSize={12} mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                No tasks found
              </Text>
              <Text mb={4}>
                Try adjusting your search or filter criteria
              </Text>
              <Button 
                leftIcon={<FiRefreshCw />} 
                colorScheme="blue" 
                onClick={fetchReports}
              >
                Refresh Tasks
              </Button>
            </Box>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default ReportsTab;
