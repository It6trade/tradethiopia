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
  Progress,
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
  Flex,
  Spinner,
  TableContainer,
  Stack,
  VStack,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue
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
  const cardBg = useColorModeValue('white', 'gray.800');
  const controlBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const pageText = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const insetBg = useColorModeValue('#f8f9fa', 'gray.700');
  const odooPurple = useColorModeValue('#714B67', 'purple.300');
  const odooPurpleHover = useColorModeValue('#5f3f57', 'purple.400');
  const tableHeadBg = useColorModeValue('#f2f2f2', 'gray.700');
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

  const categoryTotals = useMemo(() => (
    categories.reduce((acc, category) => {
      acc[category.key] = costs
        .filter((cost) => (cost.category || 'other') === category.key)
        .reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);
      return acc;
    }, {})
  ), [costs]);

  const fixedCosts = (categoryTotals.rental || 0) + (categoryTotals.utility || 0);
  const variableCosts = (categoryTotals.training || 0) + (categoryTotals.other || 0);
  const largestCategoryTotal = Math.max(...Object.values(categoryTotals), 1);

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
  const activeCategory = categories.find((category) => category.key === activeTab) || categories[0];

  return (
    <Box py={0} px={0}>
      <Flex
        justify="space-between"
        mb={0}
        px={{ base: 3, md: 4 }}
        py={3}
        bg={controlBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        align={{ base: 'start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Box>
          <Heading size="md" color={pageText}>Cost Management</Heading>
          <Text color={mutedText} fontSize="xs">
            Costs / Dashboard
          </Text>
        </Box>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={2} w={{ base: 'full', md: 'auto' }}>
          <Button
            size="sm"
            bg={odooPurple}
            color="white"
            _hover={{ bg: odooPurpleHover }}
            onClick={() => handleCreateCost(activeTab)}
            isLoading={submittingCost}
          >
            Create
          </Button>
          <Button
            leftIcon={<FaFileExport />}
            size="sm"
            variant="outline"
            borderColor={borderColor}
            onClick={exportCosts}
          >
            Export
          </Button>
        </Stack>
      </Flex>

      <Flex
        bg={controlBg}
        px={{ base: 3, md: 4 }}
        py={2}
        borderBottom="1px solid"
        borderColor={borderColor}
        align={{ base: 'start', md: 'center' }}
        justify="space-between"
        mb={0}
        direction={{ base: 'column', md: 'row' }}
        gap={2}
      >
        <Input
          size="sm"
          maxW={{ base: 'full', md: '360px' }}
          placeholder="Search costs..."
          bg={insetBg}
          borderColor={borderColor}
        />
        <Stack direction="row" spacing={2} wrap="wrap">
          <Badge colorScheme="purple" variant="subtle" px={2} py={1}>{totalEntries} records</Badge>
          <Badge colorScheme="gray" variant="subtle" px={2} py={1}>Active: {activeCategory.label}</Badge>
        </Stack>
      </Flex>

      <Box p={{ base: 3, md: 4 }} bg={insetBg}>
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={0} mb={4} border="1px solid" borderColor={borderColor} bg={cardBg}>
        <Stat p={4} minW="0" borderRight={{ base: '0', sm: '1px solid' }} borderBottom={{ base: '1px solid', xl: '0' }} borderColor={borderColor}>
          <StatLabel color={mutedText}>Total Costs Recorded</StatLabel>
          <StatNumber fontSize="xl" color={odooPurple}>
            {loadingStats ? <Spinner size="sm" /> : `ETB ${stats?.totalCosts?.toLocaleString() || '0'}`}
          </StatNumber>
          <StatLabel fontSize="xs" color={mutedText}>{totalEntries} entries</StatLabel>
        </Stat>
        {categories.slice(0, 3).map((category) => (
          <Stat key={category.key} p={4} minW="0" borderRight={{ base: '0', xl: '1px solid' }} borderBottom={{ base: '1px solid', xl: '0' }} borderColor={borderColor}>
            <StatLabel color={mutedText}>{category.label}</StatLabel>
            <StatNumber fontSize="xl" color={pageText}>
              ETB {(stats?.totals?.[category.key] || 0).toLocaleString()}
            </StatNumber>
          </Stat>
        ))}
      </SimpleGrid>

      <Card bg={cardBg} boxShadow="none" border="1px solid" borderColor={borderColor} borderRadius="sm" mb={4} size="sm">
        <CardHeader py={3} px={4}>
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2}>
            <Box>
              <Heading size="sm">Cost control overview</Heading>
              <Text fontSize="sm" color={mutedText}>
                Category distribution and current bucket.
              </Text>
            </Box>
            <Stack direction="row" spacing={2} wrap="wrap">
              <Badge colorScheme="purple" variant="subtle">Fixed ETB {fixedCosts.toLocaleString()}</Badge>
              <Badge colorScheme="gray" variant="subtle">Variable ETB {variableCosts.toLocaleString()}</Badge>
            </Stack>
          </Flex>
        </CardHeader>
        <CardBody py={3} px={4}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <VStack align="stretch" spacing={3}>
              {categories.map((category) => {
                const value = categoryTotals[category.key] || 0;
                return (
                  <Box key={category.key}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontSize="sm" color={pageText}>{category.label}</Text>
                      <Text fontSize="sm" fontWeight="semibold">ETB {value.toLocaleString()}</Text>
                    </Flex>
                    <Progress
                      value={(value / largestCategoryTotal) * 100}
                      size="xs"
                      colorScheme={category.key === activeTab ? 'teal' : 'blue'}
                      borderRadius="md"
                    />
                  </Box>
                );
              })}
            </VStack>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={mutedText}>Active entries</Text>
                <Heading size="md">{activeCosts.length}</Heading>
                <Text fontSize="xs" color={mutedText}>{activeCategory.description}</Text>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={mutedText}>Active total</Text>
                <Heading size="md">ETB {(categoryTotals[activeTab] || 0).toLocaleString()}</Heading>
                <Text fontSize="xs" color={mutedText}>Updates when changing tabs.</Text>
              </Box>
            </SimpleGrid>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Tabs
        variant="enclosed"
        colorScheme="purple"
        onChange={(index) => {
          const nextCategory = categories[index] || categories[0];
          setActiveTab(nextCategory.key);
          setCostForm((prev) => ({
            ...prev,
            category: nextCategory.key,
            subCategory: nextCategory.subTypes[0] || ''
          }));
        }}
      >
        <TabList overflowX="auto" overflowY="hidden" bg={cardBg} border="1px solid" borderColor={borderColor} borderBottom="0">
          {categories.map((category) => (
            <Tab
              key={category.key}
              flexShrink={0}
              _selected={{ color: odooPurple, borderColor: borderColor, borderTopColor: odooPurple, bg: cardBg }}
            >
              {category.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels bg={cardBg} border="1px solid" borderColor={borderColor}>
          {categories.map((category) => (
            <TabPanel key={category.key} px={4} py={4}>
              <SimpleGrid columns={{ base: 1, lg: '360px 1fr' }} gap={4} mb={4}>
                <Box bg={cardBg} p={0}>
                  <Heading size="sm" mb={2}>{category.label}</Heading>
                  <Text fontSize="sm" color={mutedText} mb={3}>{category.description}</Text>
                  <VStack spacing={3} align="stretch">
                    <Input
                      placeholder="Title"
                      value={costForm.title}
                      onChange={(e) => handleCostInput('title', e.target.value)}
                    />
                    <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
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
                    </Stack>
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
                      bg={odooPurple}
                      color="white"
                      _hover={{ bg: odooPurpleHover }}
                      onClick={() => handleCreateCost(category.key)}
                      isLoading={submittingCost}
                    >
                      Save {category.label}
                    </Button>
                  </VStack>
                </Box>

                <Box bg={cardBg}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold">Recent {category.label}</Text>
                    <Badge variant="outline">{(filteredCosts[category.key] || []).length}</Badge>
                  </Flex>
                  {loadingCosts ? (
                    <Flex justify="center">
                      <Spinner />
                    </Flex>
                  ) : (
                    <TableContainer maxHeight="320px" overflowY="auto">
                      <Table size="sm" variant="simple">
                        <Thead bg={tableHeadBg}>
                          <Tr>
                            <Th>Title</Th>
                            <Th>Department</Th>
                            <Th isNumeric>Amount</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {(filteredCosts[category.key] || []).slice(0, 5).map((item) => (
                            <Tr key={item._id}>
                              <Td>{item.title}</Td>
                              <Td>{item.department || '-'}</Td>
                              <Td isNumeric>ETB {item.amount?.toLocaleString()}</Td>
                              <Td>
                                <Badge colorScheme={item.status === 'paid' ? 'green' : item.status === 'pending' ? 'orange' : 'gray'} variant="subtle">
                                  {item.status}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                          {(!filteredCosts[category.key] || !filteredCosts[category.key].length) && (
                            <Tr>
                              <Td colSpan={4}>
                                <Text fontSize="sm" color={mutedText}>No records yet.</Text>
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
    </Box>
  );
};

export default CostManagementPage;
