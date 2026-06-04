import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Button,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon
} from '@chakra-ui/react';
import { FaChartBar, FaChartPie, FaDollarSign, FaUsers, FaMedal, FaTrophy } from 'react-icons/fa';
import MonthlyReport from '../../components/finance/MonthlyReport';

const RevenuePage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  // Mock data for revenue metrics
  const revenueMetrics = [
    { title: 'Total Revenue', value: 'ETB 1,245,678', change: '+12.5%', icon: FaDollarSign, color: 'green' },
    { title: 'Monthly Revenue', value: 'ETB 124,567', change: '+8.2%', icon: FaChartBar, color: 'blue' },
    { title: 'Quarterly Revenue', value: 'ETB 373,703', change: '+5.7%', icon: FaChartPie, color: 'purple' },
    { title: 'Annual Projection', value: 'ETB 1,494,814', change: '+10.0%', icon: FaDollarSign, color: 'orange' }
  ];

  // Mock data for revenue sources
  const revenueSources = [
    { source: 'Training Courses', amount: 'ETB 780,000', percentage: '62.6%', trend: 'up' },
    { source: 'Consulting Services', amount: 'ETB 320,000', percentage: '25.7%', trend: 'up' },
    { source: 'Software Licenses', amount: 'ETB 95,000', percentage: '7.6%', trend: 'down' },
    { source: 'Support Contracts', amount: 'ETB 45,000', percentage: '3.6%', trend: 'up' },
    { source: 'Other Services', amount: 'ETB 5,678', percentage: '0.5%', trend: 'stable' }
  ];

  // Mock data for monthly revenue
  const monthlyRevenue = [
    { month: 'January', revenue: 'ETB 98,000' },
    { month: 'February', revenue: 'ETB 87,500' },
    { month: 'March', revenue: 'ETB 112,000' },
    { month: 'April', revenue: 'ETB 105,000' },
    { month: 'May', revenue: 'ETB 118,000' },
    { month: 'June', revenue: 'ETB 124,567' }
  ];

  return (
    <Box>
        <HStack justify="space-between" mb={6}>
          <Heading as="h1" size="xl" color={headerColor}>
            Revenue Management
          </Heading>
          <HStack>
            <Button leftIcon={<FaChartBar />} colorScheme="teal">
              Generate Report
            </Button>
            <Button colorScheme="blue">Export Data</Button>
          </HStack>
        </HStack>

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
              {/* Revenue Overview Cards */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                {revenueMetrics.map((metric, index) => (
                  <Card key={index} bg={cardBg} boxShadow="md" _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }} transition="all 0.3s">
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Box as={metric.icon} fontSize="24px" color={`${metric.color}.500`} />
                        <Badge colorScheme={metric.change.startsWith('+') ? 'green' : 'red'}>
                          {metric.change}
                        </Badge>
                      </Flex>
                      <Stat>
                        <StatLabel fontSize="sm" mb={1}>{metric.title}</StatLabel>
                        <StatNumber fontSize="lg" fontWeight="bold">{metric.value}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Revenue Sources */}
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
                        <Th>Percentage</Th>
                        <Th>Trend</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {revenueSources.map((source, index) => (
                        <Tr key={index} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td>
                            <Text fontWeight="medium">{source.source}</Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="bold">{source.amount}</Text>
                          </Td>
                          <Td>
                            <Text>{source.percentage}</Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={
                              source.trend === 'up' ? 'green' : 
                              source.trend === 'down' ? 'red' : 'yellow'
                            }>
                              {source.trend}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Detailed Monthly Revenue */}
              <Card bg={cardBg} boxShadow="md" mb={8}>
                <CardHeader pb={0}>
                  <Heading as="h2" size="md">Monthly Revenue Breakdown</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Month</Th>
                        <Th isNumeric>Revenue</Th>
                        <Th>Growth</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {monthlyRevenue.map((data, index) => (
                        <Tr key={index} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td>
                            <Text fontWeight="medium">{data.month}</Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="bold">{data.revenue}</Text>
                          </Td>
                          <Td>
                            <Badge colorScheme="green">+{Math.floor(Math.random() * 15)}%</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Revenue Insights */}
              <Card bg={cardBg} boxShadow="md">
                <CardHeader pb={0}>
                  <Heading as="h2" size="md">Revenue Insights</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Text>
                      Our revenue has shown consistent growth over the past quarter, with training courses 
                      remaining our primary income source. Consulting services continue to gain traction, 
                      contributing significantly to our overall revenue.
                    </Text>
                    <Text>
                      The projected annual revenue shows a positive trend, indicating strong performance 
                      for the remainder of the fiscal year. We recommend focusing on expanding our consulting 
                      services and software licensing to diversify revenue streams.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel>
              {/* Enhanced Monthly Report Component with attractive styling */}
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
                  <Text color="gray.500" mt={2}>
                    Detailed commission and sales performance metrics for all agents
                  </Text>
                </CardHeader>
                <Divider my={4} />
                <CardBody>
                  <MonthlyReport />
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
  );
};

export default RevenuePage;
