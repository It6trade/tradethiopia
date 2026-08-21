import { useMemo, useState, useEffect } from 'react';
import Layout from './Layout';
import axiosInstance from '../../services/axiosInstance';
import { 
  Box, 
  Flex, 
  Grid, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  Stat, 
  StatLabel, 
  StatNumber,
  Icon, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  VStack
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
import { useLocation } from 'react-router-dom';
import CustomerMessagesPage from '../../pages/CustomerMessagesPage';
import RequestPage from '../../pages/RequestPage';
import CompletedSalesTable from '../salesmanager/CompletedSalesTable';
import CustomerSupportRequestPanel from './CustomerSupportRequestPanel';
import CSExternalITRequestsPanel from './CSExternalITRequestsPanel';

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
  const location = useLocation();
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
    weeklyTrainings: [],
    packageAnalytics: {
      totalRevenue: 0,
      popularPackages: []
    }
  });
  const [activeTab, setActiveTab] = useState(initialTab);

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const chartHeight = useBreakpointValue({ base: "200px", md: "250px" });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const chartTextColor = useColorModeValue('gray.700', 'gray.200');
  const pageBgGradient = useColorModeValue(
    "linear-gradient(135deg, #eef7ff 0%, #f7fbff 45%, #f0fdf4 100%)",
    "linear-gradient(135deg, #08111f 0%, #0b1224 55%, #10251f 100%)"
  );
  const headerMetricBg = useColorModeValue("teal.50", "whiteAlpha.100");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");

  // Fetch customer data from the backend
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        let stats = { total: 0, new: 0, active: 0 };
        try {
          const statsRes = await axiosInstance.get('/followups/stats');
          if (statsRes.data && typeof statsRes.data === 'object') {
            stats = statsRes.data;
          }
        } catch (e) {
          console.warn('Stats endpoint note:', e.message);
        }

        let b2bBuyers = 0;
        let b2bSellers = 0;
        try {
          const [bRes, sRes] = await Promise.allSettled([
            axiosInstance.get('/buyers'),
            axiosInstance.get('/sellers'),
          ]);
          if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data)) {
            b2bBuyers = bRes.value.data.length;
          }
          if (sRes.status === 'fulfilled' && Array.isArray(sRes.value.data)) {
            b2bSellers = sRes.value.data.length;
          }
        } catch (e) {
          console.warn('B2B endpoint note:', e.message);
        }

        let incompleteTrainingCount = 0;
        try {
          const trainingRes = await axiosInstance.get('/training-followups/incomplete-count');
          incompleteTrainingCount = trainingRes.data?.count || 0;
        } catch (e) {
          console.warn('Training count endpoint note:', e.message);
        }

        let weeklyTrainings = [];
        try {
          const weeklyRes = await axiosInstance.get('/training-followups/weekly-popular');
          weeklyTrainings = Array.isArray(weeklyRes.data) ? weeklyRes.data : [];
        } catch (e) {
          console.warn('Weekly training note:', e.message);
        }

        let pkgDist = [
          { package: '1', count: 30 },
          { package: '2', count: 25 },
          { package: '3', count: 20 },
          { package: '4', count: 15 },
          { package: '5', count: 18 },
          { package: '6', count: 12 },
          { package: '7', count: 10 },
          { package: '8', count: 8 }
        ];
        let indData = [
          { industry: 'Technology', count: 45 },
          { industry: 'Healthcare', count: 32 },
          { industry: 'Finance', count: 28 },
          { industry: 'Manufacturing', count: 22 },
          { industry: 'Retail', count: 18 }
        ];
        let pkgAnalytics = { totalRevenue: 0, popularPackages: [] };

        try {
          const analyticsRes = await axiosInstance.get('/followups/analytics');
          if (analyticsRes.data) {
            if (Array.isArray(analyticsRes.data.packageDistribution) && analyticsRes.data.packageDistribution.length) {
              pkgDist = analyticsRes.data.packageDistribution;
            }
            if (Array.isArray(analyticsRes.data.industryData) && analyticsRes.data.industryData.length) {
              indData = analyticsRes.data.industryData;
            }
          }
        } catch (e) {
          console.warn('Analytics note:', e.message);
        }

        try {
          const pkgRes = await axiosInstance.get('/packages/analytics');
          if (pkgRes.data) {
            pkgAnalytics = pkgRes.data;
          }
        } catch (e) {
          console.warn('Package analytics note:', e.message);
        }

        if (isMounted) {
          setCustomerData({
            total: stats.total || 0,
            new: stats.new || 0,
            active: stats.active || 0,
            buyers: b2bBuyers,
            sellers: b2bSellers,
            incompleteTraining: incompleteTrainingCount
          });

          setAnalyticsData({
            packageDistribution: pkgDist,
            industryData: indData,
            weeklyTrainings,
            packageAnalytics: pkgAnalytics
          });
        }
      } catch (err) {
        console.error('Error in fetchDashboardData:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const urlFocus = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      section: params.get('section') || '',
      taskId: params.get('task') || '',
      commentId: params.get('comment') || '',
      notificationId: params.get('notification') || '',
      noticeType: params.get('noticeType') || '',
      noticeTitle: params.get('noticeTitle') || '',
      noticeText: params.get('noticeText') || '',
      noticeDetail: params.get('noticeDetail') || '',
      noticePreview: params.get('noticePreview') || '',
      noticeTime: params.get('noticeTime') || '',
    };
  }, [location.search]);

  useEffect(() => {
    if (urlFocus.section === 'it-requests') {
      setActiveTab('it-requests');
    }
  }, [urlFocus.section, urlFocus.taskId, urlFocus.commentId]);

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

  const canRenderWithoutDashboardData = ['notice-board', 'requests', 'it-requests'].includes(activeTab);

  if (loading && !canRenderWithoutDashboardData) {
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

  if (error && !canRenderWithoutDashboardData) {
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
      ) : activeTab === 'it-requests' ? (
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <CSExternalITRequestsPanel
            focusedTaskId={urlFocus.taskId}
            focusedCommentId={urlFocus.commentId}
            focusedNotification={urlFocus}
          />
        </Box>
      ) : activeTab === 'requests' ? (
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <VStack spacing={6} align="stretch">
            <RequestPage embedded hideBackButton />
            <CustomerSupportRequestPanel />
          </VStack>
        </Box>
      ) : (
        <Box
          p={{ base: 4, md: 6 }}
          bg={pageBgGradient}
          minHeight="100vh"
        >
          <Card bg={cardBg} borderRadius="2xl" boxShadow="lg" mb={6} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Flex justify="space-between" align={{ base: "stretch", md: "center" }} wrap="wrap" gap={4}>
                <Box>
                  <Text color="teal.500" fontSize="xs" fontWeight="900" textTransform="uppercase" letterSpacing="0.08em">
                    Customer Service Workspace
                  </Text>
                  <Heading
                    as="h1"
                    size={{ base: "lg", md: "xl" }}
                    color={headerColor}
                    textAlign={{ base: "left", md: "left" }}
                    fontWeight="bold"
                  >
                    Customer Service Dashboard
                  </Heading>
                  <Text color={textColor} mt={2} maxW="760px">
                    Monitor customers, follow-ups, B2B activity, training progress, package revenue, and completed sales work from one service console.
                  </Text>
                </Box>
                <Box px={4} py={3} borderRadius="xl" bg={headerMetricBg}>
                  <Text fontSize="xs" color={helperTextColor}>Active Customers</Text>
                  <Text fontSize="2xl" fontWeight="900" color="teal.500">{customerData.active}</Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>

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
            <CompletedSalesTable
              title="Completed Sales Follow-ups"
              compact
              collapsible
              defaultExpanded={false}
              pageSizeOptions={[5, 10]}
              initialPageSize={5}
            />
          </Box>
        </Box>
      )}
    </Layout>
  );
};

export default CDashboard;
