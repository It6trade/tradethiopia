import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  HStack,
  VStack,
  Icon,
  Tag,
  Progress,
  IconButton,
  Tooltip,
  useToast,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  useDisclosure,
  useColorModeValue,
  Code,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FiGlobe,
  FiZap,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiKey,
  FiCode,
  FiFileText,
  FiSearch,
  FiDownload,
  FiSliders,
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiActivity,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiServer,
  FiFilter,
} from 'react-icons/fi';
import {
  getStoredToken,
  setStoredToken,
  getStoredBaseUrl,
  setStoredBaseUrl,
  checkTsExamHealth,
  fetchTsDashboardSummary,
  fetchTsExamsSummary,
  fetchTsExamsByCourse,
  fetchTsRegistrationsSummary,
  SEEDED_TS_EXAM_DATA,
  DEFAULT_API_TOKEN,
} from '../../services/tsExamService';

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export const TsExamLivePortal = () => {
  const toast = useToast();

  // Color tokens
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const codeBg = useColorModeValue('gray.900', 'gray.950');

  // Configuration state
  const [baseUrl, setBaseUrl] = useState(getStoredBaseUrl());
  const [apiToken, setApiToken] = useState(getStoredToken() || DEFAULT_API_TOKEN);
  const [tokenInput, setTokenInput] = useState(getStoredToken() || DEFAULT_API_TOKEN);
  const [baseUrlInput, setBaseUrlInput] = useState(getStoredBaseUrl());

  // Connection & Health status
  const [healthStatus, setHealthStatus] = useState({
    isOnline: true,
    latency: 18,
    statusText: 'Connected (200 OK)',
    isFallback: false,
    rateLimits: null,
  });

  // Query Filters
  const [period, setPeriod] = useState('monthly');
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-31');
  const [courseFilter, setCourseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states initialized with live dataset
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    total_exams: 42,
    students_taken: 113,
    passed: 96,
    failed: 17,
    pass_rate: 85.0,
    fail_rate: 15.0,
  });
  const [examsByCourse, setExamsByCourse] = useState(SEEDED_TS_EXAM_DATA.examsByCourse);
  const [pagination, setPagination] = useState({ page: 1, per_page: 50, total: 42 });
  const [registrationsData, setRegistrationsData] = useState(SEEDED_TS_EXAM_DATA.registrations);

  // API Console State
  const [consoleEndpoint, setConsoleEndpoint] = useState('/api/v1/exams/summary');
  const [consoleMethod] = useState('GET');
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleResponse, setConsoleResponse] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Disclosures
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isDocsOpen, onOpen: onDocsOpen, onClose: onDocsClose } = useDisclosure();

  // Load all data
  const loadLiveReports = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Health check
      const health = await checkTsExamHealth(baseUrl);
      setHealthStatus({
        isOnline: health.success || !health.isFallback,
        latency: health.latency,
        statusText: health.success ? 'Operational (200 OK)' : 'Using Mock/Fallback Data',
        isFallback: health.isFallback || false,
        rateLimits: health.rateLimits,
      });

      const params = {
        period,
        from_date: fromDate,
        to_date: toDate,
        ...(courseFilter ? { course_id: courseFilter } : {}),
      };

      // 2. Fetch Exams Summary
      const examsRes = await fetchTsExamsSummary(params, { baseUrl, token: apiToken });
      if (examsRes.data) {
        setSummaryData(examsRes.data);
      }

      // 3. Fetch By-Course breakdown
      const byCourseRes = await fetchTsExamsByCourse(params, { baseUrl, token: apiToken });
      if (byCourseRes.data && byCourseRes.data.length > 0) {
        setExamsByCourse(byCourseRes.data);
      }
      if (byCourseRes.pagination) {
        setPagination(byCourseRes.pagination);
      }

      // 4. Fetch Registrations growth
      const regRes = await fetchTsRegistrationsSummary({ course_id: courseFilter }, { baseUrl, token: apiToken });
      if (regRes.data) {
        setRegistrationsData(regRes.data);
      }

    } catch (err) {
      console.error('[TS-Exam Live] Error loading live reports:', err);
      toast({
        title: 'Fetch Notice',
        description: 'Unable to reach remote service directly. Displaying cached reporting metrics.',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiToken, period, fromDate, toDate, courseFilter, toast]);

  useEffect(() => {
    loadLiveReports();
  }, [loadLiveReports]);

  // Handle Token / URL Configuration Save
  const handleSaveConfig = () => {
    setStoredToken(tokenInput);
    setStoredBaseUrl(baseUrlInput);
    setApiToken(tokenInput);
    setBaseUrl(baseUrlInput);
    onConfigClose();
    toast({
      title: 'API Settings Saved',
      description: `Targeting: ${baseUrlInput}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setTimeout(() => {
      loadLiveReports();
    }, 200);
  };

  // Run Developer Console request
  const handleExecuteConsoleRequest = async () => {
    setConsoleLoading(true);
    const start = Date.now();
    try {
      let result;
      const params = { period, from_date: fromDate, to_date: toDate, ...(courseFilter ? { course_id: courseFilter } : {}) };

      if (consoleEndpoint === '/health') {
        result = await checkTsExamHealth(baseUrl);
      } else if (consoleEndpoint === '/api/v1/dashboard/summary') {
        result = await fetchTsDashboardSummary(params, { baseUrl, token: apiToken });
      } else if (consoleEndpoint === '/api/v1/exams/summary') {
        result = await fetchTsExamsSummary(params, { baseUrl, token: apiToken });
      } else if (consoleEndpoint === '/api/v1/exams/by-course') {
        result = await fetchTsExamsByCourse(params, { baseUrl, token: apiToken });
      } else if (consoleEndpoint === '/api/v1/registrations/summary') {
        result = await fetchTsRegistrationsSummary(params, { baseUrl, token: apiToken });
      }

      setConsoleResponse({
        status: result?.status || (result?.success ? 200 : 500),
        statusText: result?.success ? 'OK' : 'Fallback / Error',
        latency: Date.now() - start,
        data: result?.raw || result?.data,
        isFallback: result?.isFallback,
      });
    } catch (err) {
      setConsoleResponse({
        status: 500,
        statusText: 'Internal Error',
        latency: Date.now() - start,
        data: { error: err.message },
      });
    } finally {
      setConsoleLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, type = 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(''), 2000);
    }
    toast({
      title: 'Copied to Clipboard',
      status: 'success',
      duration: 1500,
    });
  };

  // Filtered courses
  const filteredCourses = examsByCourse.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.course_name?.toLowerCase().includes(q) ||
      item.course_code?.toLowerCase().includes(q) ||
      item.course_id?.toLowerCase().includes(q)
    );
  });

  // Chart data for exams by course
  const coursePerformanceChartData = examsByCourse.map((c) => ({
    name: c.course_code || c.course_name?.slice(0, 12) || 'Course',
    Passed: c.passed,
    Failed: c.failed,
    PassRate: c.pass_rate,
    Students: c.students_taken,
  }));

  return (
    <Box>
      {/* ── TOP BANNER & CONNECTION BAR ── */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} mb={6} boxShadow="sm">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
        >
          <HStack spacing={4}>
            <Flex
              w="50px"
              h="50px"
              bgGradient="linear(to-br, #4F46E5, #06B6D4)"
              color="white"
              borderRadius="xl"
              align="center"
              justify="center"
              boxShadow="0 4px 14px rgba(79, 70, 229, 0.4)"
            >
              <Icon as={FiGlobe} boxSize="24px" />
            </Flex>
            <Box>
              <HStack spacing={2.5}>
                <Heading size="md" fontWeight="900" fontSize="18px">
                  TS-Exam Online Examination & Registration Live Reporting
                </Heading>
                <Badge
                  colorScheme={healthStatus.isOnline ? 'green' : 'amber'}
                  fontSize="10px"
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  fontWeight="800"
                >
                  {healthStatus.isFallback ? 'MOCK / CACHED API' : 'LIVE REST API'}
                </Badge>
              </HStack>
              <HStack spacing={3} mt={1} fontSize="12px" color={mutedText}>
                <HStack spacing={1.5}>
                  <Icon as={FiServer} color="#6366F1" boxSize="14px" />
                  <Text fontWeight="600">Base URL:</Text>
                  <Code fontSize="11px" borderRadius="md" px={1.5} py={0.5}>
                    {baseUrl}
                  </Code>
                </HStack>
                <Text color="gray.300">•</Text>
                <HStack spacing={1.5}>
                  <Icon
                    as={healthStatus.isOnline ? FiCheckCircle : FiActivity}
                    color={healthStatus.isOnline ? 'green.500' : 'amber.500'}
                    boxSize="14px"
                  />
                  <Text fontWeight="600">{healthStatus.statusText}</Text>
                  {healthStatus.latency > 0 && (
                    <Badge colorScheme="purple" fontSize="9px" borderRadius="md">
                      {healthStatus.latency}ms
                    </Badge>
                  )}
                </HStack>
              </HStack>
            </Box>
          </HStack>

          <HStack spacing={3} wrap="wrap">
            <Button
              leftIcon={<FiKey />}
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              borderColor={borderColor}
              onClick={onConfigOpen}
            >
              {apiToken ? 'API Token (Configured)' : 'Set API Token'}
            </Button>

            <Button
              leftIcon={<FiFileText />}
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              borderColor={borderColor}
              onClick={onDocsOpen}
            >
              Integration Docs
            </Button>

            <Button
              leftIcon={<FiRefreshCw />}
              bgGradient="linear(to-r, #4F46E5, #06B6D4)"
              color="white"
              _hover={{ bgGradient: 'linear(to-r, #4338CA, #0891B2)' }}
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              isLoading={loading}
              onClick={loadLiveReports}
              boxShadow="0 4px 12px rgba(79, 70, 229, 0.3)"
            >
              Fetch Live
            </Button>
          </HStack>
        </Flex>
      </Card>

      {/* ── FILTER CONTROLS BAR ── */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={4} mb={6}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={4}
        >
          <HStack spacing={3} wrap="wrap">
            <HStack spacing={1.5}>
              <Icon as={FiFilter} color="#6366F1" boxSize="15px" />
              <Text fontSize="12px" fontWeight="800" textTransform="uppercase" color={mutedText}>
                Reporting Period:
              </Text>
            </HStack>

            <Select
              size="sm"
              w="130px"
              borderRadius="xl"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              fontWeight="700"
              fontSize="12px"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>

            <HStack spacing={2}>
              <Text fontSize="12px" fontWeight="700" color={mutedText}>From:</Text>
              <Input
                size="sm"
                w="140px"
                type="date"
                borderRadius="xl"
                fontSize="12px"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </HStack>

            <HStack spacing={2}>
              <Text fontSize="12px" fontWeight="700" color={mutedText}>To:</Text>
              <Input
                size="sm"
                w="140px"
                type="date"
                borderRadius="xl"
                fontSize="12px"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </HStack>
          </HStack>

          <HStack spacing={3}>
            <InputGroup size="sm" w={{ base: '100%', md: '220px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Filter courses..."
                borderRadius="xl"
                fontSize="12px"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </HStack>
        </Flex>
      </Card>

      {/* ── TOP KPI SCORECARD METRICS ── */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={8}>
        {/* KPI 1: Total Exams */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EEF2FF" color="#4F46E5" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                EXAM COUNT
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Total Exams Conducted</Text>
              <Text fontSize="30px" fontWeight="900" color="#4F46E5" mt={1}>
                {summaryData ? summaryData.total_exams : 0}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EEF2FF" borderRadius="full" align="center" justify="center">
              <Icon as={FiAward} boxSize="22px" color="#4F46E5" />
            </Flex>
          </Flex>
          <Text fontSize="11px" color={mutedText} mt={2}>
            Reporting Period: <Text as="span" fontWeight="700" color="#4F46E5">{period.toUpperCase()}</Text>
          </Text>
        </Card>

        {/* KPI 2: Students Taken */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#ECFDF5" color="#059669" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                STUDENT ATTEMPTS
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Students Taken</Text>
              <Text fontSize="30px" fontWeight="900" color="#059669" mt={1}>
                {summaryData ? summaryData.students_taken.toLocaleString() : 0}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#ECFDF5" borderRadius="full" align="center" justify="center">
              <Icon as={FiUsers} boxSize="22px" color="#059669" />
            </Flex>
          </Flex>
          <HStack spacing={3} mt={2} fontSize="11px">
            <Text color="green.600" fontWeight="700">✓ {summaryData ? summaryData.passed : 0} Passed</Text>
            <Text color="red.500" fontWeight="700">✗ {summaryData ? summaryData.failed : 0} Failed</Text>
          </HStack>
        </Card>

        {/* KPI 3: Live Pass Rate */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#F0FDF4" color="#16A34A" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                ACADEMIC EFFICIENCY
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Live Pass Rate</Text>
              <Text fontSize="30px" fontWeight="900" color="#16A34A" mt={1}>
                {summaryData ? summaryData.pass_rate : 0}%
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#DCFCE7" borderRadius="full" align="center" justify="center">
              <Icon as={FiCheckCircle} boxSize="22px" color="#16A34A" />
            </Flex>
          </Flex>
          <Progress
            value={summaryData ? summaryData.pass_rate : 0}
            size="xs"
            colorScheme="green"
            mt={3}
            borderRadius="full"
          />
        </Card>

        {/* KPI 4: Monthly Registrations Growth */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EFF6FF" color="#2563EB" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                STUDENT ENROLLMENT
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Monthly Registrations</Text>
              <Text fontSize="30px" fontWeight="900" color="#2563EB" mt={1}>
                {registrationsData?.monthly ? registrationsData.monthly.current.toLocaleString() : 0}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EFF6FF" borderRadius="full" align="center" justify="center">
              <Icon as={FiTrendingUp} boxSize="22px" color="#2563EB" />
            </Flex>
          </Flex>
          <HStack spacing={1.5} mt={2}>
            <Tag colorScheme="green" size="sm" borderRadius="md" fontWeight="800">
              {registrationsData?.monthly ? (registrationsData.monthly.change_percentage >= 0 ? `+${registrationsData.monthly.change_percentage}%` : `${registrationsData.monthly.change_percentage}%`) : '0%'} Growth
            </Tag>
            <Text fontSize="10px" color={mutedText}>vs. previous month</Text>
          </HStack>
        </Card>
      </SimpleGrid>

      {/* ── MAIN TABS WORKSPACE ── */}
      <Tabs variant="soft-rounded" colorScheme="indigo" isLazy>
        <TabList mb={6} gap={2} bg={useColorModeValue('gray.100', 'gray.900')} p={1.5} borderRadius="xl" maxW="fit-content">
          <Tab fontSize="13px" fontWeight="800" borderRadius="lg" _selected={{ bg: '#4F46E5', color: 'white' }}>
            <HStack spacing={2}>
              <Icon as={FiActivity} />
              <Text>Visual Analytics</Text>
            </HStack>
          </Tab>
          <Tab fontSize="13px" fontWeight="800" borderRadius="lg" _selected={{ bg: '#4F46E5', color: 'white' }}>
            <HStack spacing={2}>
              <Icon as={FiAward} />
              <Text>Exams by Course ({filteredCourses.length})</Text>
            </HStack>
          </Tab>
          <Tab fontSize="13px" fontWeight="800" borderRadius="lg" _selected={{ bg: '#4F46E5', color: 'white' }}>
            <HStack spacing={2}>
              <Icon as={FiTrendingUp} />
              <Text>Registration Growth Delts</Text>
            </HStack>
          </Tab>
          <Tab fontSize="13px" fontWeight="800" borderRadius="lg" _selected={{ bg: '#4F46E5', color: 'white' }}>
            <HStack spacing={2}>
              <Icon as={FiCode} />
              <Text>API Console & Testing</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: VISUAL ANALYTICS & CHARTS */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
              {/* Chart 1: Course Performance Bar Chart */}
              <Card gridColumn={{ lg: 'span 2' }} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={5}>
                  <HStack spacing={3}>
                    <Icon as={FiAward} color="#4F46E5" boxSize="22px" />
                    <Box>
                      <Heading size="md" fontWeight="800" fontSize="16px">Exam Pass vs. Fail Breakdown by Course</Heading>
                      <Text fontSize="11px" color={mutedText}>
                        Comparing student volume, successful completions, and failures per course
                      </Text>
                    </Box>
                  </HStack>
                  <Tag colorScheme="purple" size="sm" fontWeight="700">Course Matrix</Tag>
                </HStack>

                <Box h="300px" w="full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coursePerformanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Passed" fill="#10B981" radius={[6, 6, 0, 0]} name="Passed Count" />
                      <Bar dataKey="Failed" fill="#EF4444" radius={[6, 6, 0, 0]} name="Failed Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>

              {/* Chart 2: Registration Growth Comparison */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                <HStack spacing={3} mb={5}>
                  <Icon as={FiTrendingUp} color="#06B6D4" boxSize="22px" />
                  <Box>
                    <Heading size="md" fontWeight="800" fontSize="16px">Registration Progression</Heading>
                    <Text fontSize="11px" color={mutedText}>Growth rates across cadences</Text>
                  </Box>
                </HStack>

                <VStack spacing={4} align="stretch" mt={4}>
                  {/* Weekly Stat */}
                  <Box p={4} borderRadius="xl" bg={useColorModeValue('purple.50', 'purple.950')} border="1px" borderColor={borderColor}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="11px" fontWeight="700" color="purple.700" _dark={{ color: 'purple.300' }}>
                          WEEKLY ENROLLMENT
                        </Text>
                        <Text fontSize="20px" fontWeight="900" mt={0.5}>
                          {registrationsData?.weekly?.current ?? 185} Students
                        </Text>
                        <Text fontSize="10px" color={mutedText}>Previous: {registrationsData?.weekly?.previous ?? 160}</Text>
                      </Box>
                      <Badge colorScheme="green" fontSize="12px" px={2} py={1} borderRadius="md">
                        +{registrationsData?.weekly?.change_percentage ?? 15.63}%
                      </Badge>
                    </Flex>
                  </Box>

                  {/* Monthly Stat */}
                  <Box p={4} borderRadius="xl" bg={useColorModeValue('blue.50', 'blue.950')} border="1px" borderColor={borderColor}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="11px" fontWeight="700" color="blue.700" _dark={{ color: 'blue.300' }}>
                          MONTHLY ENROLLMENT
                        </Text>
                        <Text fontSize="20px" fontWeight="900" mt={0.5}>
                          {registrationsData?.monthly?.current ?? 720} Students
                        </Text>
                        <Text fontSize="10px" color={mutedText}>Previous: {registrationsData?.monthly?.previous ?? 650}</Text>
                      </Box>
                      <Badge colorScheme="green" fontSize="12px" px={2} py={1} borderRadius="md">
                        +{registrationsData?.monthly?.change_percentage ?? 10.77}%
                      </Badge>
                    </Flex>
                  </Box>

                  {/* Yearly Stat */}
                  <Box p={4} borderRadius="xl" bg={useColorModeValue('teal.50', 'teal.950')} border="1px" borderColor={borderColor}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="11px" fontWeight="700" color="teal.700" _dark={{ color: 'teal.300' }}>
                          YEARLY ENROLLMENT
                        </Text>
                        <Text fontSize="20px" fontWeight="900" mt={0.5}>
                          {(registrationsData?.yearly?.current ?? 6850).toLocaleString()} Students
                        </Text>
                        <Text fontSize="10px" color={mutedText}>Previous: {(registrationsData?.yearly?.previous ?? 5900).toLocaleString()}</Text>
                      </Box>
                      <Badge colorScheme="green" fontSize="12px" px={2} py={1} borderRadius="md">
                        +{registrationsData?.yearly?.change_percentage ?? 16.10}%
                      </Badge>
                    </Flex>
                  </Box>
                </VStack>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: EXAMS BY COURSE TABLE */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" overflow="hidden">
              <CardBody p={0}>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                      <Tr>
                        <Th fontSize="11px" py={4}>Course Code & Title</Th>
                        <Th fontSize="11px">Exam Date</Th>
                        <Th fontSize="11px" isNumeric>Students Taken</Th>
                        <Th fontSize="11px" isNumeric>Passed</Th>
                        <Th fontSize="11px" isNumeric>Failed</Th>
                        <Th fontSize="11px">Pass Rate</Th>
                        <Th fontSize="11px">Performance Grade</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredCourses.length === 0 ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={8} color={mutedText}>
                            No course examination records found matching the filter criteria.
                          </Td>
                        </Tr>
                      ) : (
                        filteredCourses.map((c, idx) => (
                          <Tr key={idx} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                            <Td py={4}>
                              <HStack spacing={3}>
                                <Flex
                                  w="34px"
                                  h="34px"
                                  borderRadius="lg"
                                  bg={useColorModeValue('indigo.50', 'indigo.900')}
                                  color="#4F46E5"
                                  align="center"
                                  justify="center"
                                  fontWeight="900"
                                  fontSize="11px"
                                >
                                  {c.course_code?.slice(0, 4) || 'CRS'}
                                </Flex>
                                <Box>
                                  <Text fontSize="13px" fontWeight="800" color={textColor}>
                                    {c.course_name}
                                  </Text>
                                  <Text fontSize="10px" color={mutedText}>
                                    ID: {c.course_id} | Code: {c.course_code}
                                  </Text>
                                </Box>
                              </HStack>
                            </Td>
                            <Td fontSize="12px" fontWeight="600" color={mutedText}>
                              {c.exam_date || '2026-08-24'}
                            </Td>
                            <Td fontSize="13px" fontWeight="800" isNumeric>
                              {c.students_taken}
                            </Td>
                            <Td fontSize="13px" fontWeight="800" color="green.500" isNumeric>
                              {c.passed}
                            </Td>
                            <Td fontSize="13px" fontWeight="800" color="red.500" isNumeric>
                              {c.failed}
                            </Td>
                            <Td w="180px">
                              <Box>
                                <Flex justify="space-between" fontSize="11px" fontWeight="700" mb={1}>
                                  <Text>{c.pass_rate}%</Text>
                                  <Text color={mutedText}>Fail: {c.fail_rate}%</Text>
                                </Flex>
                                <Progress
                                  value={c.pass_rate}
                                  size="xs"
                                  colorScheme={c.pass_rate >= 80 ? 'green' : c.pass_rate >= 60 ? 'yellow' : 'red'}
                                  borderRadius="full"
                                />
                              </Box>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={c.pass_rate >= 80 ? 'green' : c.pass_rate >= 60 ? 'yellow' : 'red'}
                                fontSize="10px"
                                px={2.5}
                                py={0.5}
                                borderRadius="md"
                                fontWeight="800"
                              >
                                {c.pass_rate >= 80 ? 'EXCELLENT' : c.pass_rate >= 60 ? 'STANDARD' : 'NEEDS FOCUS'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: REGISTRATION GROWTH CADENCES */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {/* Weekly Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={4}>
                  <Text fontSize="13px" fontWeight="800" textTransform="uppercase" color="#6366F1">
                    Weekly Growth Summary
                  </Text>
                  <Icon as={FiTrendingUp} color="#6366F1" />
                </HStack>
                <Stat>
                  <StatLabel fontSize="12px" color={mutedText}>Current Registered Students</StatLabel>
                  <StatNumber fontSize="32px" fontWeight="900" color={textColor}>
                    {registrationsData?.weekly?.current ?? 185}
                  </StatNumber>
                  <StatHelpText mt={2} fontSize="12px">
                    <StatArrow type="increase" />
                    +{registrationsData?.weekly?.change_percentage ?? 15.63}% vs. Previous Week ({registrationsData?.weekly?.previous ?? 160})
                  </StatHelpText>
                </Stat>
              </Card>

              {/* Monthly Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={4}>
                  <Text fontSize="13px" fontWeight="800" textTransform="uppercase" color="#2563EB">
                    Monthly Growth Summary
                  </Text>
                  <Icon as={FiTrendingUp} color="#2563EB" />
                </HStack>
                <Stat>
                  <StatLabel fontSize="12px" color={mutedText}>Current Registered Students</StatLabel>
                  <StatNumber fontSize="32px" fontWeight="900" color={textColor}>
                    {registrationsData?.monthly?.current ?? 720}
                  </StatNumber>
                  <StatHelpText mt={2} fontSize="12px">
                    <StatArrow type="increase" />
                    +{registrationsData?.monthly?.change_percentage ?? 10.77}% vs. Previous Month ({registrationsData?.monthly?.previous ?? 650})
                  </StatHelpText>
                </Stat>
              </Card>

              {/* Yearly Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={4}>
                  <Text fontSize="13px" fontWeight="800" textTransform="uppercase" color="#059669">
                    Yearly Growth Summary
                  </Text>
                  <Icon as={FiTrendingUp} color="#059669" />
                </HStack>
                <Stat>
                  <StatLabel fontSize="12px" color={mutedText}>Current Registered Students</StatLabel>
                  <StatNumber fontSize="32px" fontWeight="900" color={textColor}>
                    {(registrationsData?.yearly?.current ?? 6850).toLocaleString()}
                  </StatNumber>
                  <StatHelpText mt={2} fontSize="12px">
                    <StatArrow type="increase" />
                    +{registrationsData?.yearly?.change_percentage ?? 16.10}% vs. Previous Year ({(registrationsData?.yearly?.previous ?? 5900).toLocaleString()})
                  </StatHelpText>
                </Stat>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 4: API CONSOLE & TESTING */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={6}>
              {/* Left Column: Endpoint Runner */}
              <Box gridColumn={{ lg: 'span 5' }}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                  <Heading size="sm" fontWeight="900" mb={4} fontSize="15px">
                    API Request Inspector & Tester
                  </Heading>

                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700">Target Endpoint</FormLabel>
                      <Select
                        size="sm"
                        borderRadius="xl"
                        fontSize="12px"
                        value={consoleEndpoint}
                        onChange={(e) => setConsoleEndpoint(e.target.value)}
                      >
                        <option value="/health">GET /health</option>
                        <option value="/api/v1/dashboard/summary">GET /api/v1/dashboard/summary</option>
                        <option value="/api/v1/exams/summary">GET /api/v1/exams/summary</option>
                        <option value="/api/v1/exams/by-course">GET /api/v1/exams/by-course</option>
                        <option value="/api/v1/registrations/summary">GET /api/v1/registrations/summary</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700">Authorization Bearer Token</FormLabel>
                      <Input
                        size="sm"
                        borderRadius="xl"
                        fontSize="12px"
                        placeholder="ts_live_..."
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                      />
                      <FormHelperText fontSize="10px">Passed as `Authorization: Bearer &lt;token&gt;`</FormHelperText>
                    </FormControl>

                    <Button
                      leftIcon={<FiZap />}
                      bgGradient="linear(to-r, #4F46E5, #06B6D4)"
                      color="white"
                      _hover={{ bgGradient: 'linear(to-r, #4338CA, #0891B2)' }}
                      size="sm"
                      borderRadius="xl"
                      fontSize="12px"
                      fontWeight="700"
                      isLoading={consoleLoading}
                      onClick={handleExecuteConsoleRequest}
                    >
                      Send Live Request
                    </Button>
                  </VStack>

                  <Divider my={5} />

                  <Heading size="xs" fontWeight="800" mb={3} textTransform="uppercase" color={mutedText}>
                    Quick cURL Snippet
                  </Heading>
                  <Box
                    bg={codeBg}
                    color="gray.100"
                    p={3}
                    borderRadius="xl"
                    fontSize="11px"
                    fontFamily="monospace"
                    position="relative"
                    overflowX="auto"
                  >
                    <Text>
                      curl -X GET "{baseUrl}{consoleEndpoint}" \
                      {apiToken ? `\n  -H "Authorization: Bearer ${apiToken}"` : ''}
                    </Text>
                    <IconButton
                      aria-label="Copy cURL"
                      icon={copiedCode === 'curl' ? <FiCheck /> : <FiCopy />}
                      size="xs"
                      position="absolute"
                      top={2}
                      right={2}
                      onClick={() => copyToClipboard(`curl -X GET "${baseUrl}${consoleEndpoint}" -H "Authorization: Bearer ${apiToken || 'YOUR_TOKEN'}"`, 'curl')}
                    />
                  </Box>
                </Card>
              </Box>

              {/* Right Column: Live Response Viewer */}
              <Box gridColumn={{ lg: 'span 7' }}>
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <HStack spacing={2}>
                      <Heading size="sm" fontWeight="900" fontSize="15px">
                        JSON Response
                      </Heading>
                      {consoleResponse && (
                        <Badge
                          colorScheme={consoleResponse.status === 200 ? 'green' : 'amber'}
                          fontSize="10px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {consoleResponse.status} {consoleResponse.statusText} ({consoleResponse.latency}ms)
                        </Badge>
                      )}
                    </HStack>

                    {consoleResponse?.data && (
                      <Button
                        leftIcon={<FiCopy />}
                        size="xs"
                        variant="outline"
                        borderRadius="lg"
                        onClick={() => copyToClipboard(JSON.stringify(consoleResponse.data, null, 2), 'json')}
                      >
                        Copy JSON
                      </Button>
                    )}
                  </Flex>

                  <Box
                    bg={codeBg}
                    color="#A7F3D0"
                    p={4}
                    borderRadius="xl"
                    fontSize="12px"
                    fontFamily="monospace"
                    minH="320px"
                    maxH="480px"
                    overflowY="auto"
                    overflowX="auto"
                  >
                    <pre>
                      {consoleResponse?.data
                        ? JSON.stringify(consoleResponse.data, null, 2)
                        : `// Click 'Send Live Request' above to test endpoints against ${baseUrl}\n// Supported endpoints:\n// - GET /health\n// - GET /api/v1/dashboard/summary\n// - GET /api/v1/exams/summary\n// - GET /api/v1/exams/by-course\n// - GET /api/v1/registrations/summary`}
                    </pre>
                  </Box>
                </Card>
              </Box>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ── MODAL 1: API CONFIGURATION (TOKEN & BASE URL) ── */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader borderBottom="1px" borderColor={borderColor}>
            <HStack spacing={2}>
              <Icon as={FiKey} color="#4F46E5" />
              <Text fontSize="16px" fontWeight="800">TS-Exam API Configuration</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700">API Base URL</FormLabel>
                <Input
                  size="sm"
                  borderRadius="xl"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="https://tsexam-ashen.vercel.app"
                />
                <FormHelperText fontSize="10px">Default: https://tsexam-ashen.vercel.app</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="700">Partner Bearer Token (`ts_live_...`)</FormLabel>
                <Input
                  size="sm"
                  borderRadius="xl"
                  placeholder="Paste your API token here"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
                <FormHelperText fontSize="10px">
                  Stored securely in your local browser session storage.
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={onConfigClose} size="sm">Cancel</Button>
            <Button
              bg="#4F46E5"
              color="white"
              _hover={{ bg: '#4338CA' }}
              onClick={handleSaveConfig}
              size="sm"
              borderRadius="xl"
            >
              Save & Test Connection
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── MODAL 2: THIRD-PARTY INTEGRATION HANDOUT & DEVELOPER DOCS ── */}
      <Modal isOpen={isDocsOpen} onClose={onDocsClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader borderBottom="1px" borderColor={borderColor}>
            <HStack spacing={2}>
              <Icon as={FiFileText} color="#4F46E5" />
              <Text fontSize="16px" fontWeight="800">Online Exam & Registration Reporting API Handout</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={5} align="stretch">
              <Box p={4} borderRadius="xl" bg={useColorModeValue('purple.50', 'purple.950')} border="1px" borderColor={borderColor}>
                <Text fontSize="12px" fontWeight="800" color="#4F46E5" mb={1}>
                  SERVICE METADATA
                </Text>
                <SimpleGrid columns={2} spacing={2} fontSize="12px">
                  <Text><Text as="span" fontWeight="700">Base URL:</Text> https://tsexam-ashen.vercel.app</Text>
                  <Text><Text as="span" fontWeight="700">Protocol:</Text> HTTPS</Text>
                  <Text><Text as="span" fontWeight="700">Authentication:</Text> Bearer Token (`Authorization` Header)</Text>
                  <Text><Text as="span" fontWeight="700">Rate Limit:</Text> 120 requests/minute</Text>
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="xs" fontWeight="800" textTransform="uppercase" mb={2}>
                  Issue a New Key for a Partner
                </Heading>
                <Box bg={codeBg} color="gray.100" p={3} borderRadius="xl" fontSize="11px" fontFamily="monospace">
                  npm run client:manage -- create "Partner Name" --permissions "read:exams,read:registrations"
                </Box>
              </Box>

              <Box>
                <Heading size="xs" fontWeight="800" textTransform="uppercase" mb={2}>
                  Available Endpoints Table
                </Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th fontSize="10px">Method</Th>
                      <Th fontSize="10px">Endpoint</Th>
                      <Th fontSize="10px">Description</Th>
                    </Tr>
                  </Thead>
                  <Tbody fontSize="11px">
                    <Tr>
                      <Td><Badge colorScheme="blue">GET</Badge></Td>
                      <Td fontWeight="700">/api/v1/exams/summary</Td>
                      <Td>Exam counts, attempts, pass/fail counts, pass rate</Td>
                    </Tr>
                    <Tr>
                      <Td><Badge colorScheme="blue">GET</Badge></Td>
                      <Td fontWeight="700">/api/v1/exams/by-course</Td>
                      <Td>Paginated performance breakdown by course</Td>
                    </Tr>
                    <Tr>
                      <Td><Badge colorScheme="blue">GET</Badge></Td>
                      <Td fontWeight="700">/api/v1/registrations/summary</Td>
                      <Td>Weekly, monthly, yearly registration growth</Td>
                    </Tr>
                    <Tr>
                      <Td><Badge colorScheme="blue">GET</Badge></Td>
                      <Td fontWeight="700">/api/v1/dashboard/summary</Td>
                      <Td>Combined summary (Exams + Registrations + Top Courses)</Td>
                    </Tr>
                    <Tr>
                      <Td><Badge colorScheme="green">GET</Badge></Td>
                      <Td fontWeight="700">/health</Td>
                      <Td>Service status check (public endpoint)</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor={borderColor}>
            <Button bg="#4F46E5" color="white" onClick={onDocsClose} size="sm">Close Documentation</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TsExamLivePortal;
