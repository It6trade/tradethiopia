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
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiFilter, 
  FiCalendar, 
  FiUser, 
  FiDollarSign, 
  FiBarChart2, 
  FiTrendingUp,
  FiChevronDown
} from 'react-icons/fi';
import { getTeamPerformance, getAllAgents } from '../../../../services/salesManagerService';

const ReportsPage = () => {
  // State hooks first
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportData, setReportData] = useState({
    teamStats: {},
    agentPerformance: [],
    salesTrend: [],
    courseDistribution: [],
    individualAgentData: null
  });
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch all agents for the agent selector
  const fetchAgents = useCallback(async () => {
    try {
      const agentsData = await getAllAgents();
      setAgents(agentsData);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTeamPerformance(timeRange);
      
      // Process agent performance data for charts
      const processedAgentPerformance = data.agentPerformance.map(agent => ({
        name: agent.fullName || agent.username,
        sales: agent.completedDeals,
        revenue: agent.totalNetCommission,
        id: agent._id
      })).sort((a, b) => b.sales - a.sales);

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
          totalTeamCommission: data.teamStats?.totalTeamNetCommission || 0,
          averageCommissionPerAgent: data.teamStats?.averageGrossCommissionPerAgent || 0,
        },
        agentPerformance: processedAgentPerformance,
        salesTrend: salesTrendData,
        courseDistribution: courseDistributionData,
        statusDistribution: data.statusDistribution || [],
        individualAgentData: null
      };

      setReportData(safeData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch report data: ' + err.message);
      console.error('Error fetching report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    fetchReportData();
    fetchAgents();
  }, [fetchReportData, fetchAgents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReportData().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your report is being prepared for download.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    // In a real implementation, this would trigger a CSV/PDF export
  };

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId);
    // In a real implementation, this would fetch individual agent data
  };

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 3 }}>
        <Flex justify="space-between" align="center" mb={3}>
          <Skeleton height="28px" width="180px" />
          <Flex gap={2}>
            <Skeleton height="28px" width="120px" />
            <Skeleton height="28px" width="100px" />
          </Flex>
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
            <AlertTitle>Error Loading Report Data</AlertTitle>
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
      {/* Header and Controls */}
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Heading size="md" color={textColor} fontWeight="semibold">
          Reports
        </Heading>
        <Flex gap={2} wrap="wrap">
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
            <option value="daily">Daily</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </Select>
          
          <Select
            value={selectedAgent}
            onChange={(e) => handleAgentChange(e.target.value)}
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
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent._id} value={agent._id}>
                {agent.fullName || agent.username}
              </option>
            ))}
          </Select>
          
          <IconButton
            aria-label="Refresh"
            icon={<FiRefreshCw />}
            size="xs"
            variant="outline"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
          
          <IconButton
            aria-label="Export"
            icon={<FiDownload />}
            size="xs"
            variant="outline"
            onClick={handleExport}
          />
        </Flex>
      </Flex>

      {/* Tabs for different report views */}
      <Tabs variant="soft-rounded" colorScheme="blue" mb={4}>
        <TabList mb={2} overflowX="auto" pb={1}>
          <Tab fontSize="sm">Overview</Tab>
          <Tab fontSize="sm">Sales Trends</Tab>
          <Tab fontSize="sm">Agent Performance</Tab>
          <Tab fontSize="sm">Course Distribution</Tab>
          <Tab fontSize="sm">Status Distribution</Tab>
          <Tab fontSize="sm">Detailed Analysis</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mb={4}>
              {[
                {
                  title: 'Total Agents',
                  value: reportData.teamStats.totalAgents,
                  icon: FiUser,
                  color: 'teal',
                  change: '+5%',
                  changeColor: 'green.500'
                },
                {
                  title: 'Total Sales',
                  value: reportData.teamStats.totalTeamSales,
                  icon: FiBarChart2,
                  color: 'blue',
                  change: '+12%',
                  changeColor: 'green.500'
                },
                {
                  title: 'Total Revenue',
                  value: `ETB ${(reportData.teamStats.totalTeamCommission || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  icon: FiDollarSign,
                  color: 'purple',
                  change: '+8%',
                  changeColor: 'green.500'
                },
                {
                  title: 'Avg. Revenue/Agent',
                  value: `ETB ${Math.round(reportData.teamStats.averageCommissionPerAgent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  icon: FiTrendingUp,
                  color: 'orange',
                  change: '+3%',
                  changeColor: 'green.500'
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
                          color={card.changeColor} 
                          mt={0.5}
                          fontWeight="medium"
                        >
                          {card.change}
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
                      <AreaChart 
                        data={reportData.salesTrend} 
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
                          tickFormatter={(value) => `ETB ${value.toLocaleString()}`}
                          tick={{ fontSize: 11, fill: mutedText }}
                          axisLine={false}
                          tickLine={false}
                          width={60}
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
                          formatter={(value, name) => [
                            name === 'sales' ? value : `ETB ${value.toLocaleString()}`,
                            name === 'sales' ? 'Sales' : 'Revenue'
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: '12px',
                            paddingTop: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue"
                          stroke="#3182ce" 
                          fill="#3182ce" 
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          name="Sales"
                          stroke="#38a169" 
                          fill="#38a169" 
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
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
                          data={reportData.courseDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(reportData.courseDistribution || []).map((entry, index) => {
                            // Calculate percentage for this segment
                            const total = (reportData.courseDistribution || []).reduce((sum, item) => sum + item.value, 0);
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
                            const total = (reportData.courseDistribution || []).reduce((sum, item) => item.value + sum, 0);
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
                            const total = (reportData.courseDistribution || []).reduce((sum, item) => sum + item.value, 0);
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

            <Card variant="outline" size="sm" mb={4}>
              <CardHeader pb={1} px={4} pt={3}>
                <Heading size="sm" color={textColor}>
                  Top Sales Agents
                </Heading>
              </CardHeader>
              <CardBody p={0}>
                <Box overflowX="auto" fontSize="sm">
                  <Box as="table" w="full">
                    <Box as="thead">
                      <Box as="tr" bg={useColorModeValue('gray.50', 'gray.700')} borderBottomWidth="1px" borderColor={borderColor}>
                        <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>Rank</Box>
                        <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>Agent</Box>
                        <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>Sales</Box>
                        <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>Revenue</Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {reportData.agentPerformance.slice(0, 6).map((agent, index) => (
                        <Box as="tr" key={agent.id || `${agent.name}-${index}`} _hover={{ bg: hoverBg }} borderBottomWidth="1px" borderColor={tableBorderColor} _last={{ borderBottom: 'none' }}>
                          <Box as="td" px={3} py={2.5} color={textColor} whiteSpace="nowrap">#{index + 1}</Box>
                          <Box as="td" px={3} py={2.5} color={textColor} whiteSpace="nowrap">{agent.name}</Box>
                          <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono" whiteSpace="nowrap">{agent.sales.toLocaleString()}</Box>
                          <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono" whiteSpace="nowrap">ETB {agent.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Sales Trends Tab */}
          <TabPanel px={0}>
            <Card variant="outline" size="sm" mb={4}>
              <CardHeader pb={1} px={4} pt={3}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Sales Trends Over Time
                  </Heading>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    colorScheme="blue" 
                    rightIcon={<FiRefreshCw size={14} />}
                    onClick={fetchReportData}
                    isLoading={isRefreshing}
                  >
                    Refresh
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={1} px={4} pb={4}>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.salesTrend}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke={useColorModeValue('gray.100', 'gray.700')}
                      />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: mutedText }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 12, fill: mutedText }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: mutedText }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `ETB ${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: cardBg,
                          borderColor: borderColor,
                          borderRadius: 'md',
                          boxShadow: 'sm',
                          fontSize: '12px',
                          padding: '8px 10px'
                        }}
                        itemStyle={{ padding: 0, fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}
                        formatter={(value, name) => [
                          name === 'sales' ? value : `ETB ${value.toLocaleString()}`,
                          name === 'sales' ? 'Sales' : 'Revenue'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontSize: '12px',
                          paddingTop: '10px'
                        }}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="sales" 
                        name="Sales" 
                        fill="#3182ce" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="revenue" 
                        name="Revenue" 
                        fill="#38a169" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Agent Performance Tab */}
          <TabPanel px={0}>
            <Card variant="outline" size="sm" mb={4}>
              <CardHeader pb={1} px={4} pt={3}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Agent Performance Comparison
                  </Heading>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    colorScheme="blue" 
                    rightIcon={<FiRefreshCw size={14} />}
                    onClick={fetchReportData}
                    isLoading={isRefreshing}
                  >
                    Refresh
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={1} px={4} pb={4}>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    {reportData.agentPerformance.length > 0 ? (
                      <BarChart
                        data={reportData.agentPerformance}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid 
                          horizontal={true} 
                          vertical={false} 
                          strokeDasharray="3 3" 
                          stroke={useColorModeValue('gray.100', 'gray.700')}
                        />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12, fill: mutedText }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90}
                          tick={{ fontSize: 12, fill: textColor }}
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
                            padding: '8px 10px'
                          }}
                          itemStyle={{ 
                            padding: 0, 
                            fontSize: '12px',
                            textTransform: 'capitalize'
                          }}
                          labelStyle={{ 
                            fontSize: '12px', 
                            fontWeight: 500, 
                            marginBottom: '4px' 
                          }}
                          formatter={(value, name) => [
                            name === 'sales' ? value : `ETB ${value.toLocaleString()}`,
                            name === 'sales' ? 'Sales' : 'Revenue'
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: '12px',
                            paddingTop: '10px'
                          }}
                        />
                        <Bar 
                          dataKey="sales" 
                          name="Sales" 
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        >
                          {reportData.agentPerformance.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                        <Bar 
                          dataKey="revenue" 
                          name="Revenue" 
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        >
                          {reportData.agentPerformance.map((entry, index) => (
                            <Cell 
                              key={`cell-revenue-${index}`} 
                              fill={COLORS[(index + 2) % COLORS.length]}
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
                  {reportData.agentPerformance && reportData.agentPerformance.length > 0 ? (
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
                        {reportData.agentPerformance.map((agent, index) => (
                          <Box 
                            as="tr" 
                            key={agent.id}
                            _hover={{ bg: hoverBg }}
                            borderBottomWidth="1px"
                            borderColor={tableBorderColor}
                            _last={{ borderBottom: 'none' }}
                          >
                            <Box 
                              as="td" 
                              px={3} 
                              py={2.5} 
                              color={textColor} 
                              fontWeight={index < 3 ? 'bold' : 'normal'}
                              whiteSpace="nowrap"
                            >
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
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
                              {agent.sales.toLocaleString()}
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
                              ETB {agent.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                              ETB {agent.sales > 0 ? Math.round(agent.revenue / agent.sales).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                            </Box>
                          </Box>
                        ))}
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
          </TabPanel>
          
          {/* Status Distribution Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
              <Card variant="outline" size="sm">
                <CardHeader pb={1} px={4} pt={3}>
                  <Heading size="sm" color={textColor}>
                    Status Distribution
                  </Heading>
                </CardHeader>
                <CardBody pt={1} px={4} pb={4}>
                  <Box h="350px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.statusDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(reportData.statusDistribution || []).map((entry, index) => {
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke={cardBg}
                                strokeWidth={1}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const total = (reportData.statusDistribution || []).reduce((sum, item) => sum + item.value, 0);
                            const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                            return [
                              `${value} customers (${percent}%)`,
                              props.payload.name
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: cardBg,
                            borderColor: borderColor,
                            borderRadius: 'md',
                            boxShadow: 'sm',
                            fontSize: '12px',
                            padding: '8px 10px'
                          }}
                          itemStyle={{ padding: 0, fontSize: '12px' }}
                          labelStyle={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: '12px',
                            paddingTop: '10px',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            maxHeight: '80px',
                            overflowY: 'auto',
                            padding: '4px 8px'
                          }}
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
              
              <Card variant="outline" size="sm">
                <CardHeader pb={1} px={4} pt={3}>
                  <Heading size="sm" color={textColor}>
                    Status Metrics
                  </Heading>
                </CardHeader>
                <CardBody pt={1} px={4} pb={4}>
                  <Box overflowX="auto">
                    <Box as="table" w="full" fontSize="sm">
                      <Box as="thead">
                        <Box as="tr" 
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>
                            Status
                          </Box>
                          <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                            Count
                          </Box>
                          <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                            %
                          </Box>
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {reportData.statusDistribution && reportData.statusDistribution.length > 0 ? (
                          reportData.statusDistribution
                            .sort((a, b) => b.value - a.value)
                            .map((status, index) => {
                              const total = reportData.statusDistribution.reduce((sum, item) => sum + item.value, 0);
                              const percentage = total > 0 ? (status.value / total * 100).toFixed(1) : 0;
                              
                              return (
                                <Box 
                                  as="tr" 
                                  key={index}
                                  _hover={{ bg: hoverBg }}
                                  borderBottomWidth="1px"
                                  borderColor={tableBorderColor}
                                  _last={{ borderBottom: 'none' }}
                                >
                                  <Box 
                                    as="td" 
                                    px={3} 
                                    py={2.5} 
                                    color={textColor}
                                    whiteSpace="nowrap"
                                  >
                                    {status.name}
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
                                    {status.value}
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
                                    {percentage}%
                                  </Box>
                                </Box>
                              );
                            })
                        ) : (
                          <Box as="tr">
                            <Box as="td" colSpan={3} px={3} py={4} textAlign="center" color={textColor}>
                              No status data available
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Course Distribution Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
              <Card variant="outline" size="sm">
                <CardHeader pb={1} px={4} pt={3}>
                  <Heading size="sm" color={textColor}>
                    Course Distribution by Sales
                  </Heading>
                </CardHeader>
                <CardBody pt={1} px={4} pb={4}>
                  <Box h="350px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.courseDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(reportData.courseDistribution || []).map((entry, index) => {
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke={cardBg}
                                strokeWidth={1}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const total = (reportData.courseDistribution || []).reduce((sum, item) => item.value + sum, 0);
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
                            padding: '8px 10px'
                          }}
                          itemStyle={{ padding: 0, fontSize: '12px' }}
                          labelStyle={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: '12px',
                            paddingTop: '10px',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            maxHeight: '80px',
                            overflowY: 'auto',
                            padding: '4px 8px'
                          }}
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
              
              <Card variant="outline" size="sm">
                <CardHeader pb={1} px={4} pt={3}>
                  <Heading size="sm" color={textColor}>
                    Course Performance Metrics
                  </Heading>
                </CardHeader>
                <CardBody pt={1} px={4} pb={4}>
                  <Box overflowX="auto">
                    <Box as="table" w="full" fontSize="sm">
                      <Box as="thead">
                        <Box as="tr" 
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>
                            Course
                          </Box>
                          <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                            Sales
                          </Box>
                          <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>
                            %
                          </Box>
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {reportData.courseDistribution && reportData.courseDistribution.length > 0 ? (
                          reportData.courseDistribution
                            .sort((a, b) => b.value - a.value)
                            .map((course, index) => {
                              const total = reportData.courseDistribution.reduce((sum, item) => sum + item.value, 0);
                              const percentage = total > 0 ? (course.value / total * 100).toFixed(1) : 0;
                              
                              return (
                                <Box 
                                  as="tr" 
                                  key={index}
                                  _hover={{ bg: hoverBg }}
                                  borderBottomWidth="1px"
                                  borderColor={tableBorderColor}
                                  _last={{ borderBottom: 'none' }}
                                >
                                  <Box 
                                    as="td" 
                                    px={3} 
                                    py={2.5} 
                                    color={textColor}
                                    whiteSpace="nowrap"
                                  >
                                    {course.name}
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
                                    {course.value}
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
                                    {percentage}%
                                  </Box>
                                </Box>
                              );
                            })
                        ) : (
                          <Box as="tr">
                            <Box as="td" colSpan={3} px={3} py={4} textAlign="center" color={textColor}>
                              No course data available
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Detailed Analysis Tab */}
          <TabPanel px={0}>
            <Card variant="outline" size="sm" mb={4}>
              <CardHeader pb={1} px={4} pt={3}>
                <Heading size="sm" color={textColor}>
                  Detailed Performance Analysis
                </Heading>
              </CardHeader>
              <CardBody pt={1} px={4} pb={4}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
                  <Card variant="outline">
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          Top Performer
                        </Text>
                        <Badge colorScheme="green">Leader</Badge>
                      </Flex>
                      {reportData.agentPerformance.length > 0 && (
                        <>
                          <Text fontSize="xl" fontWeight="bold" color={textColor} mb={1}>
                            {reportData.agentPerformance[0]?.name}
                          </Text>
                          <Text fontSize="sm" color={mutedText}>
                            {reportData.agentPerformance[0]?.sales} sales • ETB {reportData.agentPerformance[0]?.revenue.toLocaleString()}
                          </Text>
                        </>
                      )}
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline">
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          Best Performing Course
                        </Text>
                        <Badge colorScheme="blue">Popular</Badge>
                      </Flex>
                      {reportData.courseDistribution.length > 0 && (
                        <>
                          <Text fontSize="xl" fontWeight="bold" color={textColor} mb={1}>
                            {reportData.courseDistribution[0]?.name}
                          </Text>
                          <Text fontSize="sm" color={mutedText}>
                            {reportData.courseDistribution[0]?.value} sales
                          </Text>
                        </>
                      )}
                    </CardBody>
                  </Card>
                </Grid>
                
                <Card variant="outline">
                  <CardBody>
                    <Heading size="sm" color={textColor} mb={3}>
                      Sales Summary Table
                    </Heading>
                    <Box overflowX="auto" fontSize="sm" mb={4}>
                      <Box as="table" w="full">
                        <Box as="thead">
                          <Box as="tr" bg={useColorModeValue('gray.50', 'gray.700')} borderBottomWidth="1px" borderColor={borderColor}>
                            <Box as="th" px={3} py={2} textAlign="left" fontWeight="600" color={textColor}>Metric</Box>
                            <Box as="th" px={3} py={2} textAlign="right" fontWeight="600" color={textColor}>Value</Box>
                          </Box>
                        </Box>
                        <Box as="tbody">
                          <Box as="tr" borderBottomWidth="1px" borderColor={tableBorderColor}>
                            <Box as="td" px={3} py={2.5} color={textColor}>Total Sales</Box>
                            <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono">{reportData.teamStats.totalTeamSales}</Box>
                          </Box>
                          <Box as="tr" borderBottomWidth="1px" borderColor={tableBorderColor}>
                            <Box as="td" px={3} py={2.5} color={textColor}>Total Revenue</Box>
                            <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono">ETB {reportData.teamStats.totalTeamCommission?.toLocaleString()}</Box>
                          </Box>
                          <Box as="tr" borderBottomWidth="1px" borderColor={tableBorderColor}>
                            <Box as="td" px={3} py={2.5} color={textColor}>Avg. Revenue / Agent</Box>
                            <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono">ETB {Math.round(reportData.teamStats.averageCommissionPerAgent || 0).toLocaleString()}</Box>
                          </Box>
                          <Box as="tr">
                            <Box as="td" px={3} py={2.5} color={textColor}>Active Agents</Box>
                            <Box as="td" px={3} py={2.5} color={textColor} textAlign="right" fontFamily="mono">{reportData.teamStats.totalAgents}</Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Heading size="sm" color={textColor} mb={3}>
                      Performance Insights
                    </Heading>
                    <Box as="ul" pl={5} fontSize="sm">
                      <Box as="li" mb={2} color={textColor}>
                        Your team has completed <strong>{reportData.teamStats.totalTeamSales}</strong> sales this period
                      </Box>
                      <Box as="li" mb={2} color={textColor}>
                        Total revenue generated: <strong>ETB {reportData.teamStats.totalTeamCommission?.toLocaleString()}</strong>
                      </Box>
                      <Box as="li" mb={2} color={textColor}>
                        Average revenue per agent: <strong>ETB {Math.round(reportData.teamStats.averageCommissionPerAgent || 0)?.toLocaleString()}</strong>
                      </Box>
                      <Box as="li" color={textColor}>
                        You have <strong>{reportData.teamStats.totalAgents}</strong> active sales agents
                      </Box>
                    </Box>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ReportsPage;
