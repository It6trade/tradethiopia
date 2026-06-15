import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
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
  SkeletonCircle
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaUserCheck, 
  FaHandshake,
  FaGraduationCap,
  FaDollarSign
} from 'react-icons/fa';
import { 
  Doughnut 
} from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend
} from 'chart.js';
import { Link } from 'react-router-dom';
import CustomerMessagesPage from '../../pages/CustomerMessagesPage';
import CompletedSalesTable from '../salesmanager/CompletedSalesTable';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Title, 
  ChartTooltip, 
  Legend
);

const CDashboard = ({ initialTab = 'dashboard' }) => {
  const [customerData, setCustomerData] = useState({
    total: 0,
    new: 0,
    active: 0,
    buyers: 0,
    sellers: 0,
    incompleteTraining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    packageDistribution: [],
    industryData: [],
    weeklyTrainings: [],
    packageAnalytics: {
      totalRevenue: 0,
      popularPackages: []
    }
  });
  const [activeTab, setActiveTab] = useState(initialTab);

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardMinHeight = useBreakpointValue({ base: '120px', md: '140px' });
  const chartHeight = useBreakpointValue({ base: "200px", md: "250px" });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const chartTextColor = useColorModeValue('gray.700', 'gray.200');

  // Fetch customer data from the backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats data
        const statsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/stats`);
        
        // Fetch analytics data (fallback to empty data if not available)
        let analyticsData = {
          packageDistribution: [],
          industryData: [],
          weeklyTrainings: [],
          packageAnalytics: {
            totalRevenue: 0,
            popularPackages: []
          }
        };
        
        try {
          const analyticsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/analytics`);
          analyticsData = {
            ...analyticsData,
            ...analyticsResponse.data
          };
        } catch (analyticsError) {
          console.warn('Analytics endpoint not available, using default data');
          // Provide sample data for demonstration with packages 1-8
          analyticsData = {
            ...analyticsData,
            packageDistribution: [
              { package: '1', count: 30 },
              { package: '2', count: 25 },
              { package: '3', count: 20 },
              { package: '4', count: 15 },
              { package: '5', count: 18 },
              { package: '6', count: 12 },
              { package: '7', count: 10 },
              { package: '8', count: 8 }
            ],
            industryData: [
              { industry: 'Technology', count: 45 },
              { industry: 'Healthcare', count: 32 },
              { industry: 'Finance', count: 28 },
              { industry: 'Manufacturing', count: 22 },
              { industry: 'Retail', count: 18 }
            ],
            weeklyTrainings: []
          };
        }
        
        // Fetch package analytics
        try {
          const packageAnalyticsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/packages/analytics`);
          console.log('Package analytics data:', packageAnalyticsResponse.data);
          analyticsData.packageAnalytics = packageAnalyticsResponse.data;
        } catch (packageError) {
          console.warn('Package analytics not available');
        }
        
        // Fetch B2B data (buyers and sellers)
        let b2bData = {
          buyers: 0,
          sellers: 0
        };
        
        try {
          const buyersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/buyers`);
          const sellersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/sellers`);
          b2bData.buyers = Array.isArray(buyersResponse.data) ? buyersResponse.data.length : 0;
          b2bData.sellers = Array.isArray(sellersResponse.data) ? sellersResponse.data.length : 0;
        } catch (b2bError) {
          console.warn('B2B data not available');
        }
        
        // Fetch incomplete training count
        let incompleteTrainingCount = 0;
        try {
          const trainingResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/training-followups/incomplete-count`);
          incompleteTrainingCount = trainingResponse.data.count || 0;
        } catch (trainingError) {
          console.warn('Training data not available');
        }
        
        // Fetch weekly popular training programs
        let weeklyTrainings = [];
        try {
          const weeklyResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/training-followups/weekly-popular`);
          weeklyTrainings = Array.isArray(weeklyResponse.data) ? weeklyResponse.data : [];
        } catch (weeklyError) {
          console.warn('Weekly training data not available');
        }
        
        // Process stats data
        if (statsResponse.data && typeof statsResponse.data === 'object') {
          setCustomerData({
            total: statsResponse.data.total || 0,
            new: statsResponse.data.new || 0,
            active: statsResponse.data.active || 0,
            buyers: b2bData.buyers,
            sellers: b2bData.sellers,
            incompleteTraining: incompleteTrainingCount
          });
        }
        
        // Process analytics data with validation
        setAnalyticsData({
          packageDistribution: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution : [],
          industryData: Array.isArray(analyticsData.industryData) ? analyticsData.industryData : [],
          weeklyTrainings: Array.isArray(weeklyTrainings) ? weeklyTrainings : [],
          packageAnalytics: analyticsData.packageAnalytics || {
            totalRevenue: 0,
            popularPackages: []
          }
        });
        
        console.log('Final analytics data:', {
          packageDistribution: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution : [],
          industryData: Array.isArray(analyticsData.industryData) ? analyticsData.industryData : [],
          weeklyTrainings: Array.isArray(weeklyTrainings) ? weeklyTrainings : [],
          packageAnalytics: analyticsData.packageAnalytics || {
            totalRevenue: 0,
            popularPackages: []
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err.response ? err.response.data : err.message);
        setError('Failed to fetch dashboard data: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Package distribution data with validation (packages 1-8)
  const packageChartData = {
    labels: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution.map(item => item?.package || '') : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
          '#F44336', '#00BCD4', '#8BC34A', '#795548'
        ],
        borderWidth: 0
      }
    ]
  };

  // Industry distribution data with validation
  const industryChartData = {
    labels: Array.isArray(analyticsData.industryData) ? analyticsData.industryData.map(item => item?.industry || '') : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.industryData) ? analyticsData.industryData.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'
        ],
        borderWidth: 0
      }
    ]
  };

  // Weekly popular training programs data
  const weeklyTrainingsChartData = {
    labels: Array.isArray(analyticsData.weeklyTrainings) ? analyticsData.weeklyTrainings.map(item => item?.trainingProgram || '') : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.weeklyTrainings) ? analyticsData.weeklyTrainings.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#FF5722', '#FF9800', '#FFC107', '#8BC34A', '#2196F3'
        ],
        borderWidth: 0
      }
    ]
  };

  // Popular packages data
  const popularPackagesChartData = {
    labels: Array.isArray(analyticsData.packageAnalytics.popularPackages) ? 
      analyticsData.packageAnalytics.popularPackages.map(item => `Package ${item?.package || ''}`) : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.packageAnalytics.popularPackages) ? 
          analyticsData.packageAnalytics.popularPackages.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'
        ],
        borderWidth: 0
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartTextColor,
          font: {
            size: isMobile ? 10 : 12
          },
          padding: isMobile ? 8 : 12
        }
      }
    }
  };

  // Stat cards data
  const statCards = [
    {
      title: 'Total Customers',
      value: customerData.total,
      icon: FaUsers,
      color: 'teal'
    },
    {
      title: 'New Customers',
      value: customerData.new,
      icon: FaUserPlus,
      color: 'blue'
    },
    {
      title: 'Active Customers',
      value: customerData.active,
      icon: FaUserCheck,
      color: 'green'
    },
    {
      title: 'B2B Marketplace',
      value: `${customerData.buyers + customerData.sellers}`,
      icon: FaHandshake,
      color: 'purple'
    },
    {
      title: 'Incomplete Training',
      value: customerData.incompleteTraining,
      icon: FaGraduationCap,
      color: 'orange'
    }
  ];

  // Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
      console.warn('Invalid amount for formatting:', amount);
      return '$0';
    }
    return `$${amount.toLocaleString()}`;
  };

  const layoutProps = {
    activeSection: activeTab,
    onSelectSection: setActiveTab,
  };

  if (loading && activeTab !== 'notice-board') {
    return (
      <Layout {...layoutProps}>
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <Skeleton height="40px" width="300px" mb={6} />
          
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={6}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Card key={item} bg={cardBg} boxShadow="md" borderRadius="xl">
                <CardBody>
                  <Flex direction="column" align="center" justify="center">
                    <SkeletonCircle size="8" mb={2} />
                    <Skeleton height="20px" width="60%" mb={1} />
                    <Skeleton height="24px" width="80%" />
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
            <Card bg={cardBg} boxShadow="md" borderRadius="xl" p={4}>
              <Skeleton height={chartHeight} borderRadius="md" />
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="xl" p={4}>
              <Skeleton height={chartHeight} borderRadius="md" />
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="xl" p={4}>
              <Skeleton height={chartHeight} borderRadius="md" />
            </Card>
          </Grid>
        </Box>
      </Layout>
    );
  }

  if (error && activeTab !== 'notice-board') {
    return (
      <Layout {...layoutProps}>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading Dashboard
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error}
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
      {activeTab === 'notice-board' ? (
        <CustomerMessagesPage embedded />
      ) : (
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={6}>
            <Heading 
              as="h1" 
              size={{ base: "lg", md: "xl" }} 
              color={headerColor}
              textAlign={{ base: "center", md: "left" }}
              fontWeight="bold"
            >
              Customer Dashboard
            </Heading>
          </Flex>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={6}>
            {statCards.map((card, index) => (
              <Card 
                key={index} 
                bg={cardBg} 
                boxShadow="md" 
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }}
              >
                <CardBody>
                  <Flex direction="column" align="center" justify="center">
                    <Icon 
                      as={card.icon} 
                      boxSize={8} 
                      color={`${card.color}.500`} 
                      mb={2}
                    />
                    <Stat textAlign="center">
                      <StatLabel 
                        fontSize="sm" 
                        fontWeight="medium" 
                        color={textColor}
                        mb={1}
                      >
                        {card.title}
                      </StatLabel>
                      <StatNumber 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
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

          {/* Revenue Summary Card */}
          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="xl"
            mb={6}
            p={4}
          >
            <CardBody>
              <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between">
                <Flex align="center">
                  <Icon as={FaDollarSign} boxSize={8} color="green.500" mr={4} />
                  <Stat>
                    <StatLabel fontSize="lg" fontWeight="bold" color={textColor}>
                      Total Revenue from Packages
                    </StatLabel>
                    <StatNumber fontSize="3xl" fontWeight="bold" color="green.500">
                      {formatCurrency(analyticsData.packageAnalytics.totalRevenue)}
                    </StatNumber>
                  </Stat>
                </Flex>
                <Text fontSize="sm" color="gray.500" textAlign="right">
                  Based on {analyticsData.packageAnalytics.popularPackages.reduce((total, pkg) => total + (pkg.count || 0), 0)} package purchases
                </Text>
              </Flex>
            </CardBody>
          </Card>

          {/* Charts */}
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
            <Card 
              bg={cardBg} 
              boxShadow="md" 
              borderRadius="xl"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
            >
              <CardBody p={4}>
                <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                  Package Distribution (1-8)
                </Text>
                <Box height={chartHeight}>
                  <Doughnut data={packageChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg} 
              boxShadow="md" 
              borderRadius="xl"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
            >
              <CardBody p={4}>
                <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                  Top Industries
                </Text>
                <Box height={chartHeight}>
                  <Doughnut data={industryChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg} 
              boxShadow="md" 
              borderRadius="xl"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
            >
              <CardBody p={4}>
                <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                  Popular Training Programs This Week
                </Text>
                <Box height={chartHeight}>
                  <Doughnut data={weeklyTrainingsChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg} 
              boxShadow="md" 
              borderRadius="xl"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
            >
              <CardBody p={4}>
                <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                  Popular Packages
                </Text>
                <Box height={chartHeight}>
                  <Doughnut data={popularPackagesChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>
          </Grid>

          <Box mt={6}>
            <CompletedSalesTable title="Completed Sales Follow-ups" />
          </Box>
        </Box>
      )}
    </Layout>
  );
};

export default CDashboard;
