import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue
} from '@chakra-ui/react';
import { FaChartBar, FaDollarSign, FaSync, FaTrophy, FaUsers } from 'react-icons/fa';
import MonthlyReport from '../../components/finance/MonthlyReport';
import { getFinanceSummary } from '../../services/financeService';

const formatCurrency = (value) => `ETB ${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const normalizeTrend = (items = []) => {
  return [...items]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => ({
      label: item.label || item.month || item.period || 'Period',
      total: Number(item.total || item.revenue || 0)
    }));
};

const calculateChange = (items = []) => {
  if (items.length < 2) return null;
  const previous = Number(items[items.length - 2]?.total || 0);
  const current = Number(items[items.length - 1]?.total || 0);
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const RevenuePage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const summaryData = await getFinanceSummary();
      setSummary(summaryData || {});
    } catch (err) {
      setSummary({});
      setError(err.response?.data?.message || err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const monthlyRevenue = useMemo(() => normalizeTrend(summary?.monthlyRevenue), [summary]);
  const monthlyChange = calculateChange(monthlyRevenue);
  const revenueSources = useMemo(() => {
    const sources = [
      { source: 'Follow-up Revenue', amount: Number(summary?.followupRevenue || 0) },
      { source: 'Order Revenue', amount: Number(summary?.orderRevenue || 0) },
      { source: 'Package Revenue', amount: Number(summary?.packageRevenue || 0) }
    ];
    const total = sources.reduce((sum, row) => sum + row.amount, 0);
    return sources.map((row) => ({
      ...row,
      percentage: total ? (row.amount / total) * 100 : 0
    }));
  }, [summary]);

  const metrics = [
    { title: 'Total Revenue', value: summary?.revenue, icon: FaDollarSign, color: 'green', change: monthlyChange },
    { title: 'Total Expenses', value: summary?.expenses, icon: FaChartBar, color: 'red' },
    { title: 'Profit', value: summary?.profit, icon: FaChartBar, color: Number(summary?.profit || 0) >= 0 ? 'green' : 'red' },
    { title: 'Payroll Cost', value: summary?.payrollCost, icon: FaUsers, color: 'purple' }
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="xl" color={headerColor}>
          Revenue Management
        </Heading>
        <Button leftIcon={<FaSync />} colorScheme="teal" onClick={loadReports} isLoading={loading}>
          Refresh
        </Button>
      </HStack>

      {error && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" />
        </Flex>
      ) : (
        <Tabs variant="enclosed" colorScheme="teal">
          <TabList mb="1em">
            <Tab>Revenue Overview</Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FaUsers} />
                <Text>Agent Sales Report</Text>
              </HStack>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                {metrics.map((metric) => (
                  <Card key={metric.title} bg={cardBg} boxShadow="md">
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Box as={metric.icon} fontSize="24px" color={`${metric.color}.500`} />
                        {metric.change !== undefined && metric.change !== null && (
                          <Badge colorScheme={metric.change >= 0 ? 'green' : 'red'}>
                            {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                          </Badge>
                        )}
                      </Flex>
                      <Stat>
                        <StatLabel fontSize="sm" mb={1}>{metric.title}</StatLabel>
                        <StatNumber fontSize="lg" fontWeight="bold">{formatCurrency(metric.value)}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              <Card bg={cardBg} boxShadow="md" mb={8}>
                <CardHeader pb={0}>
                  <Heading as="h2" size="md">Revenue Sources</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Source</Th>
                        <Th isNumeric>Amount</Th>
                        <Th isNumeric>Share</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {revenueSources.map((source) => (
                        <Tr key={source.source} _hover={{ bg: rowHoverBg }}>
                          <Td fontWeight="medium">{source.source}</Td>
                          <Td isNumeric fontWeight="bold">{formatCurrency(source.amount)}</Td>
                          <Td isNumeric>{source.percentage.toFixed(1)}%</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              <Card bg={cardBg} boxShadow="md">
                <CardHeader pb={0}>
                  <Heading as="h2" size="md">Monthly Revenue Breakdown</Heading>
                </CardHeader>
                <CardBody>
                  {monthlyRevenue.length ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Period</Th>
                          <Th isNumeric>Revenue</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {monthlyRevenue.map((item) => (
                          <Tr key={item.label} _hover={{ bg: rowHoverBg }}>
                            <Td fontWeight="medium">{item.label}</Td>
                            <Td isNumeric fontWeight="bold">{formatCurrency(item.total)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No revenue records available.</Text>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardHeader pb={0}>
                  <HStack justify="space-between">
                    <Heading as="h2" size="lg" color={headerColor}>
                      <HStack spacing={3}>
                        <Icon as={FaTrophy} color="orange.500" />
                        <Text>Agent Sales Performance Report</Text>
                      </HStack>
                    </Heading>
                    <Badge colorScheme="teal" fontSize="md">Live Data</Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <MonthlyReport />
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default RevenuePage;
