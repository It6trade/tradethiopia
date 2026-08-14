import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Grid, 
  Card, 
  CardHeader, 
  CardBody, 
  Heading, 
  Text, 
  SimpleGrid, 
  Skeleton, 
  Alert, 
  AlertIcon, 
  Button, 
  Select, 
  useColorModeValue,
  useToast,
  IconButton,
  Icon
} from '@chakra-ui/react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import { getTeamPerformance } from '../../../../services/salesManagerService';

const PerformancePage = () => {
  // State hooks first
  const [timeRange, setTimeRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    teamStats: {},
    agentPerformance: [],
    salesTrend: [],
    courseDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Theme hooks next
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.750');
  const tableBorderColor = useColorModeValue('gray.100', 'gray.600');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const formatNumber = (value, options) => {
    const normalized = value != null ? Number(value) : 0;
    if (!Number.isFinite(normalized)) {
      return '0';
    }
    return normalized.toLocaleString(undefined, options);
  };
  const formatCurrency = (value) => `ETB ${formatNumber(value, { maximumFractionDigits: 0 })}`;

  const rankBadges = ['🥇', '🥈', '🥉'];

  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTeamPerformance(timeRange);

      // Process agent performance data for charts
      const processedAgentPerformance = data.agentPerformance.map(agent => ({
        name: agent.fullName || agent.agentName || agent.username || 'Agent',
        sales: Number(agent.completedDeals || 0),
        revenue: Number(agent.totalNetCommission ?? agent.totalGrossCommission ?? agent.totalCommission ?? 0),
        id: agent._id || agent.agentId || `${agent.username}-${Math.random()}`
      })).sort((a, b) => b.sales - a.sales); // Sort by sales descending

      // Ensure we have at least some data for display
      if (processedAgentPerformance.length === 0) {
        // Add a placeholder entry if no data
        processedAgentPerformance.push({
          name: 'No Agents',
          sales: 0,
          revenue: 0,
          id: 'placeholder'
        });
      }

      // Debug: Log raw data
      console.log('Raw performance data:', data);

      // Use actual course distribution data from backend
      const courseDistributionData = data.courseDistribution || [];

      // Use actual sales trend data from backend
      const salesTrendData = data.salesTrend || [];

      // Ensure we have data to display
      if (courseDistributionData.length === 0) {
        // Fallback data for display purposes
        courseDistributionData.push(
          { name: 'No Data Available', value: 1 }
        );
      } else {
        // Ensure all values are numbers
        courseDistributionData.forEach(item => {
          item.value = Number(item.value) || 0;
        });
      }

      // Ensure sales trend data has proper structure
      if (salesTrendData.length === 0) {
        // Sample data for testing
        salesTrendData.push(
          { name: 'Jan', sales: 0, revenue: 0 },
          { name: 'Feb', sales: 0, revenue: 0 },
          { name: 'Mar', sales: 0, revenue: 0 }
        );
      } else {
        // Ensure all values are numbers
        salesTrendData.forEach(item => {
          item.sales = Number(item.sales) || 0;
          item.revenue = Number(item.revenue) || 0;
        });
      }

      // Ensure we have at least some agent data for display
      if (processedAgentPerformance.length === 0) {
        // Add a placeholder entry if no data
        processedAgentPerformance.push({
          name: 'No Agents',
          sales: 0,
          revenue: 0,
          id: 'placeholder'
        });
      }

      // Ensure all values are properly initialized
      const safeData = {
        teamStats: {
          totalAgents: data.teamStats?.totalAgents || 0,
          totalTeamSales: data.teamStats?.totalTeamSales || 0,
          totalTeamCommission: data.teamStats?.totalTeamCommission || 0,
          averageCommissionPerAgent: data.teamStats?.averageCommissionPerAgent || 0,
        },
        agentPerformance: processedAgentPerformance,
        salesTrend: salesTrendData,
        courseDistribution: courseDistributionData
      };

      setPerformanceData(safeData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch performance data: ' + err.message);
      console.error('Error fetching performance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPerformanceData().finally(() => {
      setIsRefreshing(false);
    });
  };

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 3 }}>
        <Flex justify="space-between" align="center" mb={3}>
          <Skeleton height="28px" width="180px" />
          <Skeleton height="28px" width="120px" />
        </Flex>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3} mb={4}>
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} shadow="sm" variant="outline" size="sm">
              <CardBody p={3}>
                <Skeleton height="16px" width="60%" mb={2} />
                <Skeleton height="24px" width="80%" mb={1} />
                <Skeleton height="12px" width="40%" />
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={3} mb={3}>
          <Skeleton height="280px" borderRadius="md" />
          <Skeleton height="280px" borderRadius="md" />
        </Grid>
        <Skeleton height="300px" borderRadius="md" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" variant="left-accent" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error Loading Performance Data</AlertTitle>
            <AlertDescription display="block">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 2, md: 3 }} bg={cardBg} minH="100vh">
      {/* Header and Time Range Selector */}
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="md" color={textColor} fontWeight="semibold">
          Team Performance
        </Heading>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          width="fit-content"
          size="xs"
          variant="outline"
          bg={cardBg}
          borderColor={borderColor}
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'blue.500', boxShadow: 'sm' }}
          fontSize="sm"
          fontWeight="medium"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </Select>
      </Flex>

      {/* Stats Cards - More compact */}
      <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={2} mb={4}>
        {[
          {
            title: 'Total Agents',
            value: formatNumber(performanceData.teamStats.totalAgents),
            icon: 'FiUsers',
            color: 'teal',
            trend: '+5%',
            trendColor: 'green.500',
            compact: true
          },
          {
            title: 'Total Sales',
            value: formatNumber(performanceData.teamStats.totalTeamSales),
            icon: 'FiBarChart2',
            color: 'blue',
            trend: '+12%',
            trendColor: 'green.500',
            compact: true
          },
          {
            title: 'Total Commission',
            value: formatCurrency(performanceData.teamStats.totalTeamCommission),
            icon: 'FiDollarSign',
            color: 'purple',
            trend: '+8%',
            trendColor: 'green.500',
            compact: true
          },
          {
            title: 'Avg. Commission',
            value: formatCurrency(Math.round(performanceData.teamStats.averageCommissionPerAgent || 0)),
            icon: 'FiTrendingUp',
            color: 'orange',
            trend: '+3%',
            trendColor: 'green.500',
            compact: true
          }
        ].map((card, index) => (
          <Card 
            key={index} 
            variant="outline" 
            size="sm"
            _hover={{ bg: hoverBg, shadow: 'sm' }}
            transition="all 0.2s"
          >
            <CardBody p={3}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text 
                    fontSize="xs" 
                    color={mutedText} 
                    fontWeight="medium"
                    lineHeight="shorter"
                    mb={0.5}
                  >
                    {card.title}
                  </Text>
                  <Text 
                    fontSize="lg" 
                    fontWeight="bold" 
                    color={textColor}
                    lineHeight="shorter"
                  >
                    {card.value}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color={card.trendColor} 
                    mt={0.5}
                    fontWeight="medium"
                  >
                    {card.trend}
                  </Text>
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  w={8}
                  h={8}
                  borderRadius="md"
                  bg={`${card.color}.100`}
                  color={`${card.color}.600`}
                  flexShrink={0}
                >
                  <Icon as={card.icon} boxSize={4} />
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={3} mb={4}>
        {/* Sales Trend Chart */}
        <Card variant="outline" size="sm">
          <CardHeader pb={1} px={4} pt={3}>
            <Heading size="sm" color={textColor}>
              Sales Trend
            </Heading>
          </CardHeader>
          <CardBody pt={1} px={4} pb={4}>
            <Box h="280px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={performanceData.salesTrend} 
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    vertical={false} 
                    stroke={useColorModeValue('gray.100', 'gray.700')} 
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: mutedText }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fontSize: 11, fill: mutedText }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: cardBg,
                      borderColor: borderColor,
                      borderRadius: 'md',
                      boxShadow: 'sm',
                      fontSize: '12px',
                      padding: '6px 8px'
                    }}
                    itemStyle={{ padding: 0, fontSize: '12px' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}
                    formatter={(value) => [`$${value}`, 'Sales']}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3182ce" 
                    strokeWidth={2}
                    dot={{ r: 2.5, strokeWidth: 1.5 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>

        {/* Course Distribution */}
        <Card variant="outline" size="sm">
          <CardHeader pb={1} px={4} pt={3}>
            <Heading size="sm" color={textColor}>
              Course Distribution
            </Heading>
          </CardHeader>
          <CardBody pt={1} px={4} pb={4}>
            <Box h="280px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData.courseDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {(performanceData.courseDistribution || []).map((entry, index) => {
                      // Calculate percentage for this segment
                      const total = (performanceData.courseDistribution || []).reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total * 100).toFixed(1) : 0;
                      
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke={cardBg}
                          strokeWidth={1}
                          name={`${entry.name} (${entry.value})`}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const total = (performanceData.courseDistribution || []).reduce((sum, item) => item.value + sum, 0);
                      const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                      return [
                        `${value} sales (${percent}%)`,
                        props.payload.name
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: cardBg,
                      borderColor: borderColor,
                      borderRadius: 'md',
                      boxShadow: 'sm',
                      fontSize: '12px',
                      padding: '6px 8px'
                    }}
                    itemStyle={{ padding: 0, fontSize: '12px' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '11px',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      maxHeight: '60px',
                      overflowY: 'auto',
                      padding: '4px 8px'
                    }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value, entry, index) => {
                      const total = (performanceData.courseDistribution || []).reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.payload.value / total * 100).toFixed(1) : 0;
                      return `${entry.payload.name} (${percent}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      </Grid>

      {/* Agent Performance */}
      <Card variant="outline" size="sm" mb={4}>
        <CardHeader pb={1} px={4} pt={3}>
          <Flex justify="space-between" align="center">
            <Heading size="sm" color={textColor}>
              Agent Performance
            </Heading>
            <Button 
              size="xs" 
              variant="ghost" 
              colorScheme="blue" 
              rightIcon={<FiRefreshCw size={14} />}
              onClick={fetchPerformanceData}
              isLoading={isRefreshing}
            >
              Refresh
            </Button>
          </Flex>
        </CardHeader>
        <CardBody pt={1} px={4} pb={4}>
          <Box h="320px">
            <ResponsiveContainer width="100%" height="100%">
              {performanceData.agentPerformance.length > 0 ? (
                <BarChart
                  data={performanceData.agentPerformance}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barCategoryGap={6}
                >
                  <CartesianGrid 
                    horizontal={true} 
                    vertical={false} 
                    strokeDasharray="2 2" 
                    stroke={useColorModeValue('gray.100', 'gray.700')}
                  />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: mutedText }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 11, fill: textColor }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: cardBg,
                      borderColor: borderColor,
                      borderRadius: 'md',
                      boxShadow: 'sm',
                      fontSize: '12px',
                      padding: '6px 8px'
                    }}
                    itemStyle={{ 
                      padding: 0, 
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}
                    labelStyle={{ 
                      fontSize: '11px', 
                      fontWeight: 500, 
                      marginBottom: '4px' 
                    }}
                    formatter={(value, name) => [
                      name === 'sales' ? formatNumber(value) : formatCurrency(value),
                      name === 'sales' ? 'Sales' : 'Revenue'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    name="Sales" 
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  >
                    {performanceData.agentPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <Flex 
                  justify="center" 
                  align="center" 
                  height="100%" 
                  direction="column" 
                  p={4}
                  textAlign="center"
                >
                  <Text fontSize="md" color={textColor} mb={2} fontWeight="medium">
                    No Agent Performance Data
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={useColorModeValue('gray.600', 'gray.400')} 
                    maxW="280px"
                  >
                    Assign agents and complete sales to see performance metrics
                  </Text>
                </Flex>
              )}
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>

      {/* Agent Ranking Table */}
      <Card 
        variant="outline"
        size="sm"
        borderColor={borderColor}
      >
        <CardHeader pb={1} px={4} pt={3}>
          <Heading size="sm" color={textColor}>
            Agent Performance Ranking
          </Heading>
        </CardHeader>
        <CardBody p={0}>
          <Box overflowX="auto" fontSize="sm">
            {performanceData.agentPerformance && performanceData.agentPerformance.length > 0 ? (
              <Box as="table" w="full">
                <Box as="thead">
                  <Box as="tr" 
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                  >
                    <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>
                      Rank
                    </Box>
                    <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>
                      Agent
                    </Box>
                    <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                      Sales
                    </Box>
                    <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                      Revenue
                    </Box>
                    <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                      Avg. Sale
                    </Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {performanceData.agentPerformance.map((agent, index) => {
                    const avgSale = agent.sales > 0 && Number.isFinite(agent.revenue / agent.sales)
                      ? Math.round(agent.revenue / agent.sales)
                      : 0;
                    const rankLabel = rankBadges[index] || `#${index + 1}`;
                    return (
                      <Box 
                        as="tr" 
                        key={agent.id}
                        _hover={{ bg: hoverBg }}
                        borderBottomWidth="1px"
                        borderColor={tableBorderColor}
                        _last={{ borderBottom: "none" }}
                      >
                        <Box 
                          as="td" 
                          px={3} 
                          py={2.5} 
                          color={textColor} 
                          fontWeight={index < 3 ? 'bold' : 'normal'}
                          whiteSpace="nowrap"
                        >
                          {rankLabel}
                        </Box>
                        <Box 
                          as="td" 
                          px={3} 
                          py={2.5} 
                          color={textColor}
                          whiteSpace="nowrap"
                        >
                          {agent.name}
                        </Box>
                        <Box 
                          as="td" 
                          px={3} 
                          py={2.5} 
                          color={textColor} 
                          textAlign="right"
                          fontFamily="mono"
                          whiteSpace="nowrap"
                        >
                          {formatNumber(agent.sales)}
                        </Box>
                        <Box 
                          as="td" 
                          px={3} 
                          py={2.5} 
                          color={textColor} 
                          textAlign="right"
                          fontFamily="mono"
                          whiteSpace="nowrap"
                        >
                          {formatCurrency(agent.revenue)}
                        </Box>
                        <Box 
                          as="td" 
                          px={3} 
                          py={2.5} 
                          color={textColor} 
                          textAlign="right"
                          fontFamily="mono"
                          whiteSpace="nowrap"
                        >
                          {formatCurrency(avgSale)}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Flex 
                justify="center" 
                align="center" 
                p={6} 
                direction="column"
                textAlign="center"
              >
                <Text fontSize="md" color={textColor} mb={2} fontWeight="medium">
                  No Performance Data Available
                </Text>
                <Text 
                  fontSize="sm" 
                  color={useColorModeValue('gray.600', 'gray.400')} 
                  maxW="300px"
                >
                  Complete sales with your team to see detailed performance rankings
                </Text>
              </Flex>
            )}
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default PerformancePage;
