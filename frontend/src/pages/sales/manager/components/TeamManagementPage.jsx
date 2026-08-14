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
  NumberInput,
  NumberInputField,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiUser, FiUsers, FiTarget, FiCalendar, FiX } from 'react-icons/fi';
import { getTeamPerformance, getAllAgents } from '../../../../services/salesManagerService';
import { setSalesTarget, getCurrentSalesTargets, deleteSalesTarget } from '../../../../services/salesTargetService';

const TeamManagementPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [targetingAgent, setTargetingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
  });
  
  const [targetData, setTargetData] = useState({
    weeklySalesTarget: 0,
    monthlySalesTarget: 0,
    periodType: 'weekly',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const toast = useToast();
  
  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch team performance data and actual agents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch actual agents from the backend
        const agentData = await getAllAgents();
        console.log('Fetched agents:', agentData);
        
        // Fetch current sales targets
        const targetData = await getCurrentSalesTargets();
        console.log('Fetched targets:', targetData);
        
        // Combine agent data with target data
        const agentsWithTargets = agentData.map(agent => {
          // Find targets for this agent
          const agentTargets = targetData.data?.filter(target => target.agentId === agent._id) || [];
          
          // Get current targets (if any)
          const currentTargets = agentTargets.filter(target => {
            const now = new Date();
            return new Date(target.periodStart) <= now && new Date(target.periodEnd) >= now;
          });
          
          // Get the most recent weekly and monthly targets
          const weeklyTarget = currentTargets.find(t => t.periodType === 'weekly');
          const monthlyTarget = currentTargets.find(t => t.periodType === 'monthly');
          
          return {
            id: agent._id,
            name: agent.fullName || agent.username,
            email: agent.email,
            phone: agent.phone,
            status: agent.status || 'active',
            sales: agent.completedDeals || 0,
            // Add target data if available
            ...(weeklyTarget ? {
              weeklySalesTarget: weeklyTarget.weeklySalesTarget,
              weeklyTargetId: weeklyTarget._id,
              periodStart: weeklyTarget.periodStart,
              periodEnd: weeklyTarget.periodEnd
            } : {}),
            ...(monthlyTarget ? {
              monthlySalesTarget: monthlyTarget.monthlySalesTarget,
              monthlyTargetId: monthlyTarget._id,
              periodStart: monthlyTarget.periodStart,
              periodEnd: monthlyTarget.periodEnd
            } : {})
          };
        });
        
        setAgents(agentsWithTargets);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch team data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleOpenModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenTargetModal = (agent) => {
    setTargetingAgent(agent);
    // Set default target data
    setTargetData({
      weeklySalesTarget: agent.weeklySalesTarget || 0,
      monthlySalesTarget: agent.monthlySalesTarget || 0,
      periodType: 'weekly',
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsTargetModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'active',
    });
  };

  const handleCloseTargetModal = () => {
    setIsTargetModalOpen(false);
    setTargetingAgent(null);
    setTargetData({
      weeklySalesTarget: 0,
      monthlySalesTarget: 0,
      periodType: 'weekly',
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTargetChange = (field, value) => {
    setTargetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would save to the backend here
    if (editingAgent) {
      // Update existing agent
      setAgents(prev => prev.map(agent => 
        agent.id === editingAgent.id ? { ...agent, ...formData } : agent
      ));
      toast({
        title: "Agent updated",
        description: "Agent information has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Add new agent
      const newAgent = {
        id: agents.length + 1,
        ...formData,
        sales: 0
        // Removed revenue field as requested
      };
      setAgents(prev => [...prev, newAgent]);
      toast({
        title: "Agent added",
        description: "New agent has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
    handleCloseModal();
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    try {
      // Prepare the target payload with only sales targets
      const targetPayload = {
        agentId: targetingAgent.id,
        agentName: targetingAgent.name,
        weeklySalesTarget: targetData.weeklySalesTarget,
        monthlySalesTarget: targetData.monthlySalesTarget,
        periodType: targetData.periodType,
        periodStart: targetData.periodStart,
        periodEnd: targetData.periodEnd
      };
      
      // Call the API to save targets
      const response = await setSalesTarget(targetPayload);
      
      // Update the agent in the local state with the new target data
      setAgents(prev => prev.map(agent => {
        if (agent.id === targetingAgent.id) {
          // Add the target ID to the agent data
          if (targetData.periodType === 'weekly') {
            return {
              ...agent,
              weeklySalesTarget: targetData.weeklySalesTarget,
              weeklyTargetId: response.data._id,
              periodStart: targetData.periodStart,
              periodEnd: targetData.periodEnd
            };
          } else {
            return {
              ...agent,
              monthlySalesTarget: targetData.monthlySalesTarget,
              monthlyTargetId: response.data._id,
              periodStart: targetData.periodStart,
              periodEnd: targetData.periodEnd
            };
          }
        }
        return agent;
      }));
      
      toast({
        title: "Targets saved",
        description: "Sales targets have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      handleCloseTargetModal();
    } catch (err) {
      toast({
        title: "Error saving targets",
        description: "Failed to save sales targets: " + (err.response?.data?.message || err.message),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (agentId) => {
    // Delete functionality has been removed as requested
  };

  const handleDeleteTarget = async (agentId, targetType) => {
    if (window.confirm(`Are you sure you want to cancel this ${targetType} target? This action cannot be undone.`)) {
      try {
        // Find the agent
        const agent = agents.find(a => a.id === agentId);
        
        // Get the target ID based on target type
        let targetId;
        if (targetType === 'weekly' && agent.weeklyTargetId) {
          targetId = agent.weeklyTargetId;
        } else if (targetType === 'monthly' && agent.monthlyTargetId) {
          targetId = agent.monthlyTargetId;
        }
        
        if (!targetId) {
          toast({
            title: "Error",
            description: "Target not found.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        
        // Call the API to delete the target
        await deleteSalesTarget(targetId);
        
        // Update the agent in the local state to remove target data
        setAgents(prev => prev.map(agent => {
          if (agent.id === agentId) {
            if (targetType === 'weekly') {
              // Remove weekly target data from the agent
              const { weeklySalesTarget, weeklyTargetId, periodStart, periodEnd, ...rest } = agent;
              return rest;
            } else if (targetType === 'monthly') {
              // Remove monthly target data from the agent
              const { monthlySalesTarget, monthlyTargetId, periodStart, periodEnd, ...rest } = agent;
              return rest;
            }
          }
          return agent;
        }));
        
        toast({
          title: "Target cancelled",
          description: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} target has been cancelled successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Error cancelling target",
          description: "Failed to cancel sales target: " + (err.response?.data?.message || err.message),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Calculate performance percentage
  const calculatePerformance = (actual, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  // Stat cards data
  const statCards = [
    {
      title: 'Total Agents',
      value: agents.length,
      icon: FiUsers,
      color: 'teal'
    },
    {
      title: 'Active Agents',
      value: agents.filter(a => a.status === 'active').length,
      icon: FiUser,
      color: 'green'
    },
    {
      title: 'Inactive Agents',
      value: agents.filter(a => a.status === 'inactive').length,
      icon: FiUser,
      color: 'red'
    },
    {
      title: 'Avg. Sales/Agent',
      value: agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + (agent.sales || 0), 0) / agents.length) : 0,
      icon: FiUser,
      color: 'blue'
    }
  ];

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
        <Text color="red.500" fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 3, md: 4 }} bg={bgColor} minHeight="100vh">
      <Flex justify="space-between" align="center" mb={{ base: 3, md: 4 }}>
        <Heading 
          as="h1" 
          size={{ base: "md", md: "lg" }} 
          color={headerColor}
          textAlign={{ base: "center", md: "left" }}
          fontWeight="semibold"
        >
          Team & Target Management
        </Heading>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="teal" 
          onClick={() => handleOpenModal()}
          size={{ base: "sm", md: "sm" }}
          fontSize="sm"
          px={3}
          py={2}
        >
          Add Agent
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        {statCards.map((card, index) => (
          <Card 
            key={index} 
            bg={cardBg} 
            boxShadow="sm" 
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          >
            <CardBody py={3} px={2}>
              <Flex direction="column" align="center" justify="center">
                <Icon 
                  as={card.icon} 
                  boxSize={6} 
                  color={`${card.color}.500`} 
                  mb={1}
                />
                <Stat textAlign="center">
                  <StatLabel 
                    fontSize="xs" 
                    fontWeight="normal" 
                    color={textColor}
                    mb={0}
                  >
                    {card.title}
                  </StatLabel>
                  <StatNumber 
                    fontSize={{ base: "md", md: "lg" }} 
                    fontWeight="semibold" 
                    color={`${card.color}.500`}
                  >
                    {card.value}
                  </StatNumber>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Agents Table */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody p={{ base: 2, md: 3 }}>
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: "sm", md: "sm" }}>
              <Thead>
                <Tr>
                  <Th fontSize="xs" py={2}>Agent</Th>
                  <Th fontSize="xs" py={2}>Contact</Th>
                  <Th fontSize="xs" py={2}>Status</Th>
                  <Th fontSize="xs" py={2}>Sales</Th>
                  <Th fontSize="xs" py={2}>Weekly Target</Th>
                  <Th fontSize="xs" py={2}>Monthly Target</Th>
                  <Th fontSize="xs" py={2}>Performance</Th>
                  <Th fontSize="xs" py={2}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {agents.map((agent) => (
                  <Tr key={agent.id} fontSize="sm">
                    <Td py={2}>
                      <Text fontSize="sm" fontWeight="medium">{agent.name}</Text>
                    </Td>
                    <Td py={2}>
                      <Text fontSize="xs">{agent.email}</Text>
                      <Text fontSize="xs" color="gray.500">{agent.phone}</Text>
                    </Td>
                    <Td py={2}>
                      <Badge fontSize="xs" colorScheme={agent.status === 'active' ? 'green' : 'red'}>
                        {agent.status}
                      </Badge>
                    </Td>
                    <Td py={2}>
                      <Text fontSize="sm">{agent.sales || 0}</Text>
                    </Td>
                    <Td py={2}>
                      <Flex align="center">
                        <Box flex="1">
                          {agent.weeklySalesTarget > 0 ? (
                            <Box>
                              <Text fontSize="sm">Sales: {agent.weeklySalesTarget}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {agent.periodStart ? new Date(agent.periodStart).toLocaleDateString() : ''} - 
                                {agent.periodEnd ? new Date(agent.periodEnd).toLocaleDateString() : ''}
                              </Text>
                            </Box>
                          ) : (
                            <Text fontSize="sm" color="gray.400">Not set</Text>
                          )}
                        </Box>
                        {agent.weeklySalesTarget > 0 && (
                          <IconButton
                            icon={<FiX />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteTarget(agent.id, 'weekly')}
                            title="Cancel Weekly Target"
                            ml={2}
                          />
                        )}
                      </Flex>
                    </Td>
                    <Td py={2}>
                      <Flex align="center">
                        <Box flex="1">
                          {agent.monthlySalesTarget > 0 ? (
                            <Box>
                              <Text fontSize="sm">Sales: {agent.monthlySalesTarget}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {agent.periodStart ? new Date(agent.periodStart).toLocaleDateString() : ''} - 
                                {agent.periodEnd ? new Date(agent.periodEnd).toLocaleDateString() : ''}
                              </Text>
                            </Box>
                          ) : (
                            <Text fontSize="sm" color="gray.400">Not set</Text>
                          )}
                        </Box>
                        {agent.monthlySalesTarget > 0 && (
                          <IconButton
                            icon={<FiX />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteTarget(agent.id, 'monthly')}
                            title="Cancel Monthly Target"
                            ml={2}
                          />
                        )}
                      </Flex>
                    </Td>
                    <Td py={2}>
                      {agent.weeklySalesTarget > 0 && (
                        <Box mb={1}>
                          <Text fontSize="xs">Weekly Sales</Text>
                          <Progress 
                            value={calculatePerformance(agent.sales, agent.weeklySalesTarget)} 
                            size="sm" 
                            colorScheme={calculatePerformance(agent.sales, agent.weeklySalesTarget) >= 100 ? "green" : "yellow"} 
                            borderRadius="full" 
                            height="6px"
                          />
                          <Text fontSize="xs" textAlign="right">
                            {agent.sales || 0}/{agent.weeklySalesTarget} ({calculatePerformance(agent.sales, agent.weeklySalesTarget)}%)
                          </Text>
                        </Box>
                      )}
                    </Td>
                    <Td py={2}>
                      <Flex>
                        <IconButton
                          icon={<FiTarget />}
                          size="xs"
                          mr={1}
                          onClick={() => handleOpenTargetModal(agent)}
                          title="Set Targets"
                          fontSize="10px"
                          px={2}
                          py={2}
                        />
                        <IconButton
                          icon={<FiEdit2 />}
                          size="xs"
                          mr={1}
                          onClick={() => handleOpenModal(agent)}
                          fontSize="10px"
                          px={2}
                          py={2}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Add/Edit Agent Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">
            {editingAgent ? 'Edit Agent' : 'Add New Agent'}
          </ModalHeader>
          <ModalCloseButton size="sm" />
          <form onSubmit={handleSubmit}>
            <ModalBody py={3}>
              <FormControl mb={3}>
                <FormLabel fontSize="sm">Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter agent name"
                  required
                  size="sm"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  size="sm"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel fontSize="sm">Phone</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  size="sm"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  size="sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
            </ModalBody>
            <ModalFooter py={3}>
              <Button variant="ghost" mr={3} onClick={handleCloseModal} size="sm">
                Cancel
              </Button>
              <Button colorScheme="teal" type="submit" size="sm">
                {editingAgent ? 'Update' : 'Add'} Agent
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Set Targets Modal */}
      <Modal isOpen={isTargetModalOpen} onClose={handleCloseTargetModal} size="md">
        <ModalOverlay />
        <ModalContent maxWidth="500px">
          <ModalHeader fontSize="md">
            Set Sales Targets for {targetingAgent?.name}
          </ModalHeader>
          <ModalCloseButton size="sm" />
          <form onSubmit={handleSaveTarget}>
            <ModalBody py={3}>
              <Tabs variant="enclosed" size="sm">
                <TabList>
                  <Tab fontSize="sm">Weekly Targets</Tab>
                  <Tab fontSize="sm">Monthly Targets</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel py={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Sales Target</FormLabel>
                      <NumberInput 
                        value={targetData.weeklySalesTarget} 
                        onChange={(value) => handleTargetChange('weeklySalesTarget', parseInt(value) || 0)}
                        min={0}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </TabPanel>
                  <TabPanel py={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Sales Target</FormLabel>
                      <NumberInput 
                        value={targetData.monthlySalesTarget} 
                        onChange={(value) => handleTargetChange('monthlySalesTarget', parseInt(value) || 0)}
                        min={0}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </TabPanel>
                </TabPanels>
              </Tabs>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={3} mt={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Period Start</FormLabel>
                  <Input
                    type="date"
                    value={targetData.periodStart}
                    onChange={(e) => handleTargetChange('periodStart', e.target.value)}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Period End</FormLabel>
                  <Input
                    type="date"
                    value={targetData.periodEnd}
                    onChange={(e) => handleTargetChange('periodEnd', e.target.value)}
                    size="sm"
                  />
                </FormControl>
              </Grid>
              
              <FormControl mt={3}>
                <FormLabel fontSize="sm">Period Type</FormLabel>
                <Select
                  value={targetData.periodType}
                  onChange={(e) => handleTargetChange('periodType', e.target.value)}
                  size="sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormControl>
            </ModalBody>
            <ModalFooter py={3}>
              <Button variant="ghost" mr={3} onClick={handleCloseTargetModal} size="sm">
                Cancel
              </Button>
              <Button colorScheme="teal" type="submit" size="sm">
                Save Targets
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TeamManagementPage;