import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaFileExport } from 'react-icons/fa';
import {
  getCosts,
  createCost,
  getCostStats
} from '../../services/costService';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Heading,
  Button,
  Input,
  Select,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Flex,
  Spinner,
  TableContainer,
  Stack,
  HStack,
  VStack
} from '@chakra-ui/react';

const categories = [
  {
    key: 'training',
    label: 'Training Cost',
    description: 'Capture stationary and refreshment expenses for training programs.',
    subTypes: ['Stationary', 'Refreshment']
  },
  {
    key: 'rental',
    label: 'Rental Cost',
    description: 'Facility or equipment rental fees.',
    subTypes: []
  },
  {
    key: 'utility',
    label: 'Utility Cost',
    description: 'Telecom, electricity, or fuel expenses.',
    subTypes: ['Telecom', 'Electricity', 'Fuel']
  },
  {
    key: 'other',
    label: 'Other Cost',
    description: 'Miscellaneous spend that does not fall into the other buckets.',
    subTypes: []
  }
];

const defaultCostForm = {
  title: '',
  category: 'training',
  subCategory: 'Stationary',
  amount: '',
  department: '',
  description: ''
};

const CostManagementPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('training');
  const [costForm, setCostForm] = useState(defaultCostForm);
  const [costs, setCosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [submittingCost, setSubmittingCost] = useState(false);

  const loadCosts = useCallback(async () => {
    setLoadingCosts(true);
    try {
      const data = await getCosts();
      setCosts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Failed to load costs',
        description: error?.response?.data?.message || error?.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingCosts(false);
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getCostStats();
      setStats(data);
    } catch (error) {
      console.error('Stats error', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    loadCosts();
    loadStats();
  }, [loadCosts, loadStats]);
  
  const totalAllCosts = useMemo(() => (
    costs.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
  ), [costs]);
  const totalEntries = costs.length;

  const exportCosts = () => {
    if (!totalEntries) {
      toast({
        title: 'Nothing to export',
        description: 'Add some cost entries before exporting.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const headers = ['Title', 'Category', 'SubCategory', 'Department', 'Amount', 'Status', 'Date', 'Description'];
    const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = costs.map((cost) => [
      cost.title,
      cost.category,
      cost.subCategory,
      cost.department,
      cost.amount,
      cost.status,
      cost.incurredOn ? new Date(cost.incurredOn).toISOString() : '',
      cost.description
    ].map(escapeValue).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `costs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCostInput = (field, value) => {
    setCostForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCost = async (selectedCategoryKey = costForm.category) => {
    if (!costForm.title || !costForm.amount) {
      toast({
        title: 'Missing information',
        description: 'Provide at least a title and amount before saving.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setSubmittingCost(true);
    try {
      await createCost({
        ...costForm,
        category: selectedCategoryKey,
        amount: Number(costForm.amount)
      });
      toast({
        title: 'Cost saved',
        description: 'Your cost entry is now listed below.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      const categoryConfig = categories.find((c) => c.key === selectedCategoryKey);
      setCostForm({
        ...defaultCostForm,
        category: selectedCategoryKey,
        subCategory: categoryConfig?.subTypes?.[0] || ''
      });
      loadAll();
    } catch (error) {
      toast({
        title: 'Failed to save cost',
        description: error?.response?.data?.message || error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setSubmittingCost(false);
    }
  };

  const filteredCosts = useMemo(() => {
    return costs.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [costs]);

  const activeCosts = filteredCosts[activeTab] || [];

  return (
    <Box>
        <Flex justify="space-between" mb={4} align="center">
          <Heading size="lg">Cost Management</Heading>
          <Stack direction="row" spacing={3}>
            <Text color="gray.500" fontSize="sm">
              Smart, categorized cost capture with statistics.
            </Text>
          </Stack>
        </Flex>

        <Flex
          bg="white"
          p={3}
          borderRadius="md"
          boxShadow="sm"
          align="center"
          justify="space-between"
          mb={4}
          wrap="wrap"
          gap={3}
        >
          <HStack spacing={4} flex="1" minW="200px">
            <Badge colorScheme="teal" fontSize="0.8rem">All Costs</Badge>
            <Text fontWeight="semibold">Entries: {totalEntries}</Text>
            <Text fontWeight="semibold">Total ETB {totalAllCosts.toLocaleString()}</Text>
          </HStack>
          <Button
            leftIcon={<FaFileExport />}
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={exportCosts}
          >
            Export CSV
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={1} mb={4}>
          <Stat bg="white" boxShadow="sm" p={2} borderRadius="md" minW="150px">
            <StatLabel>Total Costs Recorded</StatLabel>
            <StatNumber fontSize="md">
              {loadingStats ? <Spinner size="sm" /> : `ETB ${stats?.totalCosts?.toLocaleString() || '0'}`}
            </StatNumber>
            <StatLabel fontSize="xs" color="gray.500">Across all categories</StatLabel>
          </Stat>
          {categories.slice(0, 2).map((category) => (
            <Stat key={category.key} bg="white" boxShadow="sm" p={2} borderRadius="md" minW="120px">
              <StatLabel>{category.label}</StatLabel>
              <StatNumber fontSize="md">
                ETB {(stats?.totals?.[category.key] || 0).toLocaleString()}
              </StatNumber>
            </Stat>
          ))}
          <Stat bg="white" boxShadow="sm" p={2} borderRadius="md" minW="120px">
            <StatLabel>Utility + Other</StatLabel>
            <StatNumber fontSize="md">
              ETB {((stats?.totals?.utility || 0) + (stats?.totals?.other || 0)).toLocaleString()}
            </StatNumber>
          </Stat>
        </SimpleGrid>

        <Tabs variant="enclosed" onChange={(index) => setActiveTab(categories[index]?.key || 'training')}>
          <TabList>
            {categories.map((category) => (
              <Tab key={category.key}>{category.label}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {categories.map((category) => (
              <TabPanel key={category.key}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
                  <Box bg="white" p={4} borderRadius="md" boxShadow="md">
                    <Heading size="sm" mb={2}>{category.label}</Heading>
                    <Text fontSize="sm" color="gray.600" mb={3}>{category.description}</Text>
                    <VStack spacing={3} align="stretch">
                      <Input
                        placeholder="Title"
                        value={costForm.title}
                        onChange={(e) => handleCostInput('title', e.target.value)}
                      />
                      <HStack spacing={3}>
                        {category.subTypes.length > 0 && (
                          <Select
                            value={costForm.subCategory}
                            onChange={(e) => handleCostInput('subCategory', e.target.value)}
                          >
                            {category.subTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                        )}
                        <Input
                          placeholder="Amount"
                          type="number"
                          value={costForm.amount}
                          onChange={(e) => handleCostInput('amount', e.target.value)}
                        />
                      </HStack>
                      <Input
                        placeholder="Department"
                        value={costForm.department}
                        onChange={(e) => handleCostInput('department', e.target.value)}
                      />
                      <Textarea
                        placeholder="Add a note or description"
                        value={costForm.description}
                        onChange={(e) => handleCostInput('description', e.target.value)}
                      />
                      <Button
                        colorScheme="teal"
                        onClick={() => handleCreateCost(category.key)}
                        isLoading={submittingCost}
                      >
                        Save {category.label}
                      </Button>
                    </VStack>
                  </Box>

                  <Box bg="white" borderRadius="md" boxShadow="md" p={4}>
                    <Text fontSize="sm" color="gray.600" mb={2}>Recent {category.label}</Text>
                    {loadingCosts ? (
                      <Flex justify="center">
                        <Spinner />
                      </Flex>
                    ) : (
                      <TableContainer maxHeight="320px" overflowY="auto">
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Title</Th>
                              <Th isNumeric>Amount</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {(filteredCosts[category.key] || []).slice(0, 5).map((item) => (
                              <Tr key={item._id}>
                                <Td>{item.title}</Td>
                                <Td isNumeric>ETB {item.amount?.toLocaleString()}</Td>
                                <Td>
                                  <Badge colorScheme={item.status === 'paid' ? 'green' : item.status === 'pending' ? 'orange' : 'blue'}>
                                    {item.status}
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                            {(!filteredCosts[category.key] || !filteredCosts[category.key].length) && (
                              <Tr>
                                <Td colSpan={3}>
                                  <Text fontSize="sm" color="gray.500">No records yet.</Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </SimpleGrid>
              </TabPanel>
            ))}

          </TabPanels>
        </Tabs>
      </Box>
  );
};

export default CostManagementPage;
