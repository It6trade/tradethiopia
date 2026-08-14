import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  HStack,
  VStack,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { 
  FaShoppingCart, 
  FaTruck, 
  FaUsers, 
  FaBoxes,
  FaDollarSign,
  FaReceipt,
} from 'react-icons/fa';
import { useTeamRequests } from '../../hooks/useTeamRequests';
import FinanceDashboard from '../../components/finance/FinanceDashboard';
import MonthlyReport from '../../components/finance/MonthlyReport';
import FinanceMessagesPage from '../FinanceMessagesPage';
import { getFinanceSummary } from '../../services/financeService';

const FinanceDashboardPage = () => {
  const [financeSummary, setFinanceSummary] = useState(null);
  const [financeSummaryLoading, setFinanceSummaryLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const cardTextColor = useColorModeValue('gray.900', 'gray.100');
  const helperTextColor = useColorModeValue('gray.500', 'gray.300');
  const detailTextColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const insetBg = useColorModeValue('gray.50', 'gray.600');

  const {
    requests: teamRequests,
    loading: teamRequestsLoading,
    requestSummary,
    fetchRequests: refreshTeamRequests,
  } = useTeamRequests();

  useEffect(() => {
    let mounted = true;

    const loadFinanceSummary = async () => {
      try {
        const data = await getFinanceSummary();
        if (mounted) setFinanceSummary(data);
      } catch (error) {
        console.error('Failed to load finance summary', error);
      } finally {
        if (mounted) setFinanceSummaryLoading(false);
      }
    };

    loadFinanceSummary();

    return () => {
      mounted = false;
    };
  }, []);

  const formatEtb = (value) => {
    const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `ETB ${amount.toLocaleString()}`;
  };

  const financialMetrics = useMemo(() => [
    { title: 'Total Revenue', value: formatEtb(financeSummary?.revenue), icon: FaDollarSign, color: 'green' },
    { title: 'Total Expenses', value: formatEtb(financeSummary?.expenses), icon: FaReceipt, color: 'red' },
    { title: 'Net Profit', value: formatEtb(financeSummary?.profit), icon: FaBoxes, color: (financeSummary?.profit || 0) >= 0 ? 'green' : 'red' },
    { title: 'Invoices', value: Number(financeSummary?.invoices || 0).toLocaleString(), icon: FaShoppingCart, color: 'orange' },
    { title: 'Payroll Cost', value: formatEtb(financeSummary?.payrollCost), icon: FaTruck, color: 'teal' },
    { title: 'Package Revenue', value: formatEtb(financeSummary?.packageRevenue), icon: FaUsers, color: 'pink' }
  ], [financeSummary]);

  const revenueSources = useMemo(() => [
    { label: 'Follow-up revenue', value: financeSummary?.followupRevenue },
    { label: 'Order revenue', value: financeSummary?.orderRevenue },
    { label: 'Package revenue', value: financeSummary?.packageRevenue }
  ], [financeSummary]);

  const recentFinanceItems = Array.isArray(financeSummary?.recentExpenses)
    ? financeSummary.recentExpenses
    : [];

  const formatRequestDate = (value) => {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch ((status || 'Pending').toLowerCase()) {
      case 'approved':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'orange';
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || 'Medium').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
      <Box py={1} px={2}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h1" size="md" color={headerColor}>
            Enterprise Finance Dashboard
          </Heading>
        <HStack spacing={1}>
          <Button size="xs" colorScheme="teal" height="24px" minH="unset">Generate Report</Button>
          <Button size="xs" colorScheme="blue" height="24px" minH="unset">Export Data</Button>
        </HStack>
      </Flex>

      <Box mb={3}>
        <Card bg={cardBg} boxShadow="xs" size="sm">
          <CardBody py={2} px={3}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
              <Box>
                <Heading size="xs">Payroll</Heading>
                <Text color="gray.500" fontSize="xs">
                  View submitted payroll data, adjustments, and approvals without leaving the finance dashboard.
                </Text>
              </Box>
              <Button
                as={Link}
                to="/finance-dashboard/payroll"
                colorScheme="purple"
                variant="outline"
                size="xs"
                height="24px" minH="unset"
              >
                Open Payroll
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Box>

      {/* Financial Overview Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={2} mb={3}>
        {financialMetrics.map((metric, index) => (
            <Card key={index} bg={cardBg} boxShadow="xs" size="sm">
              <CardBody py={2} px={3}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Icon as={metric.icon} boxSize={5} color={`${metric.color}.500`} />
                  <Badge fontSize="xs" colorScheme={financeSummaryLoading ? 'gray' : 'green'} px={1} py={0.5}>
                    {financeSummaryLoading ? 'Loading' : 'Live'}
                  </Badge>
                </Flex>
                <Stat>
                  <StatLabel fontSize="xs" mb={0.5}>{metric.title}</StatLabel>
                  <StatNumber fontSize="sm" fontWeight="bold">{metric.value}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        <Tabs variant="enclosed" colorScheme="teal" mb={3} size="sm">
          <TabList>
            <Tab px={3} py={2}>Financial Overview</Tab>
            <Tab px={3} py={2}>Monthly Report</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} py={2}>
              {/* Financial Charts and Reports */}
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={3} mb={4}>
                <Card bg={cardBg} boxShadow="xs" size="sm">
                  <CardHeader py={2} px={3}>
                    <Heading as="h2" size="xs">Revenue Overview</Heading>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                  <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={helperTextColor} fontSize="xs">Revenue chart visualization would appear here</Text>
                  </Box>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} boxShadow="xs" size="sm">
                  <CardHeader py={2} px={3}>
                    <Heading as="h2" size="xs">Revenue Sources</Heading>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                    <VStack align="stretch" spacing={2}>
                      {revenueSources.map((item) => (
                        <Flex key={item.label} justify="space-between" align="center">
                      <Text fontSize="sm" color={cardTextColor}>{item.label}</Text>
                      <Text fontWeight="bold" color={cardTextColor} fontSize="sm">
                        {formatEtb(item.value)}
                      </Text>
                    </Flex>
                  ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>
            <TabPanel px={0} py={2}>
              <MonthlyReport />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Box 
          bg={cardBg} 
          boxShadow="xs" 
          borderRadius="md" 
          mb={4} 
          p={{ base: 1, md: 2 }} 
          maxH="300px" 
          overflow="hidden"
        >
          <FinanceMessagesPage embedded />
        </Box>

        {/* Inventory Management Section */}
        <Card bg={cardBg} boxShadow="xs" mb={4} size="sm">
          <CardHeader py={2} px={3}>
            <Heading as="h2" size="xs">Inventory Management</Heading>
          </CardHeader>
          <CardBody py={2} px={3}>
            <FinanceDashboard />
          </CardBody>
        </Card>

        {/* Recent Finance Activity */}
        <Card bg={cardBg} boxShadow="xs" mb={4} size="sm">
          <CardHeader py={2} px={3}>
            <Heading as="h2" size="xs">Recent Finance Activity</Heading>
          </CardHeader>
          <CardBody py={2} px={3}>
            <VStack align="stretch" spacing={2}>
              {recentFinanceItems.length ? (
                recentFinanceItems.slice(0, 5).map((item) => (
                  <Flex
                    key={item._id || item.createdAt || item.title}
                    justify="space-between"
                    align="center"
                    p={2}
                    borderRadius="md"
                    _hover={{ bg: insetBg }}
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color={cardTextColor} fontSize="sm">
                        {item.title || item.category || 'Expense'}
                      </Text>
                      <Text fontSize="xs" color={helperTextColor}>
                        {item.incurredOn ? new Date(item.incurredOn).toLocaleDateString() : 'Date unknown'}
                      </Text>
                    </VStack>
                    <Text fontWeight="bold" color="red.500" fontSize="sm">{formatEtb(item.amount)}</Text>
                    <Badge fontSize="xs" colorScheme="orange">{item.status || 'Recorded'}</Badge>
                  </Flex>
                ))
              ) : (
                <Text textAlign="center" color={helperTextColor} fontSize="xs">
                  No recent finance activity yet.
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="xs" size="sm">
          <CardHeader py={2} px={3}>
            <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between" gap={2}>
              <Box>
                <Heading size="xs">Team requests</Heading>
                <Text fontSize="xs" color={helperTextColor}>
                  A quick summary of the most recent department requests.
                </Text>
              </Box>
              <HStack spacing={1}>
                <Button size="xs" variant="outline" onClick={refreshTeamRequests} isLoading={teamRequestsLoading} height="24px" minH="unset">
                  Refresh
                </Button>
                <Button size="xs" colorScheme="teal" as={Link} to="/finance/team-requests" height="24px" minH="unset">
                  Manage requests
                </Button>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody py={2} px={3}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={2} mb={2}>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Total requests
                </Text>
                <Heading size="xs">{requestSummary.total}</Heading>
              </Box>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Open
                </Text>
                <Heading size="xs">{requestSummary.open}</Heading>
              </Box>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  High priority
                </Text>
                <Heading size="xs">{requestSummary.highPriority}</Heading>
              </Box>
            </SimpleGrid>
            <VStack align="stretch" spacing={2}>
              {teamRequestsLoading ? (
                <Text textAlign="center" color={helperTextColor} fontSize="xs">Loading requests...</Text>
              ) : teamRequests.length === 0 ? (
                <Text textAlign="center" color={helperTextColor} fontSize="xs">No team requests yet.</Text>
              ) : (
                teamRequests.slice(0, 3).map((request) => {
                  const label = request.title || `${request.department || "Team"} request`;
                  return (
                    <Box
                      key={request._id || request.createdAt || label}
                      p={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={insetBg}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="semibold" fontSize="xs" isTruncated maxW="70%">
                          {label}
                        </Text>
                        <Badge colorScheme={getPriorityColor(request.priority)} fontSize="xs" px={1} py={0.5}>
                          {request.priority || "Medium"}
                        </Badge>
                      </Flex>
                      <HStack spacing={1} fontSize="xs" color="gray.500" mb={1}>
                        <Text>{request.department || "Department"}</Text>
                        <Text>-</Text>
                        <Badge colorScheme={getStatusColor(request.status)} fontSize="xx-small">
                          {request.status || "Pending"}
                        </Badge>
                        <Text>-</Text>
                        <Text>{formatRequestDate(request.createdAt || request.date)}</Text>
                      </HStack>
                      {request.details && (
                        <Text fontSize="xs" color={detailTextColor} noOfLines={2}>
                          {request.details}
                        </Text>
                      )}
                    </Box>
                  );
                })
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
  );
};

export default FinanceDashboardPage;
