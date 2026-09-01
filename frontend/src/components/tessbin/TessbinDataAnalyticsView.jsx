import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  HStack,
  VStack,
  Icon,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  useColorModeValue,
  Tag,
  IconButton,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
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
} from 'recharts';
import {
  FiAward,
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiGrid,
  FiCalendar,
  FiRotateCcw,
} from 'react-icons/fi';
import { fetchExternalDataAnalytics } from '../../services/tsExamService';

// Chart Color Theme
const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#3B82F6', '#14B8A6'];
const STATUS_COLORS = {
  passed: '#10B981',
  failed: '#EF4444',
  disqualified: '#F59E0B',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

// Month definitions for clean dropdown selection
const MONTHS_LIST = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// Years range for clean dropdown selection
const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export const TessbinDataAnalyticsView = () => {
  const toast = useToast();

  // Theme Tokens
  const cardBg = useColorModeValue('white', '#111827');
  const cardHeaderBg = useColorModeValue('gray.50', '#1F2937');
  const borderColor = useColorModeValue('gray.100', 'gray.750');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const tableHeaderBg = useColorModeValue('gray.50', '#1F2937');
  const hoverRowBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  // Filter & Navigation State
  const [periodMode, setPeriodMode] = useState('all'); // 'all', 'yearly', 'monthly', 'weekly', 'daily'
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('08'); // August default
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('ALL'); // Selected course directly from real data
  const [outcomeFilter, setOutcomeFilter] = useState('ALL'); // 'ALL', 'PASSED_ONLY', 'FAILED_ONLY'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState(0); // 0: Overview, 1: Exams, 2: Registrations

  // Data State
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Compute the anchor date sent to the API based on the selected dropdowns
  const computedAnchor = useMemo(() => {
    if (periodMode === 'all') return '';
    if (periodMode === 'yearly') {
      return `${selectedYear}-01-01`;
    }
    if (periodMode === 'monthly') {
      return `${selectedYear}-${selectedMonth}-01`;
    }
    if (periodMode === 'daily' && selectedDate) {
      return selectedDate;
    }
    return '';
  }, [periodMode, selectedYear, selectedMonth, selectedDate]);

  // Fetch from Service
  const loadData = useCallback(async (mode = periodMode, anchorVal = computedAnchor) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        period: mode || 'all',
      };
      if (anchorVal && anchorVal.trim()) {
        params.anchor = anchorVal.trim();
      }

      const res = await fetchExternalDataAnalytics(params);
      if (res.success && res.data) {
        setApiData(res.data);
        setLastFetched(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setError(res.error || 'Unable to synchronize latest analytics.');
      }
    } catch (err) {
      console.error('Error fetching Data Analytics:', err);
      setError('Unable to load analytics data right now. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [periodMode, computedAnchor]);

  useEffect(() => {
    loadData(periodMode, computedAnchor);
  }, [periodMode, computedAnchor, loadData]);

  // Extract totals safely from real API data
  const totals = apiData?.totals || {
    applications: 0,
    uniqueExamTakers: 0,
    completedResults: 0,
    passed: 0,
    failed: 0,
    disqualified: 0,
    passRate: 0,
  };

  // Real Results by Course directly from API Data
  const resultsByCourse = useMemo(() => {
    const raw = Array.isArray(apiData?.resultsByCourse) ? apiData.resultsByCourse : [];
    return raw.map((c) => {
      const name = c.courseName || c.course_name || (c.courseCode ? `Course (${c.courseCode})` : 'General Exam Sessions');
      const failRate = c.results > 0 ? Math.round(((c.failed || 0) / c.results) * 100) : 0;
      return {
        ...c,
        courseName: name,
        failRate,
      };
    });
  }, [apiData]);

  // Real Applications by Program directly from API Data
  const applicationsByProgram = useMemo(() => {
    const raw = Array.isArray(apiData?.applicationsByProgram) ? apiData.applicationsByProgram : [];
    return raw.map((p) => {
      const name = p.programName || p.program_name || (p.courseCode ? `Program (${p.courseCode})` : 'General Program Applications');
      return {
        ...p,
        programName: name,
      };
    });
  }, [apiData]);

  // Dynamic Course List from real live data
  const dynamicCoursesList = useMemo(() => {
    const names = new Set();
    resultsByCourse.forEach((c) => {
      if (c.courseName) names.add(c.courseName);
    });
    applicationsByProgram.forEach((p) => {
      if (p.programName) names.add(p.programName);
    });
    return ['ALL', ...Array.from(names)];
  }, [resultsByCourse, applicationsByProgram]);

  // Aggregated Application Totals from real live data
  const applicationMetrics = useMemo(() => {
    const totalApps = totals.applications || 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    applicationsByProgram.forEach((p) => {
      pending += p.pending || 0;
      approved += p.approved || 0;
      rejected += p.rejected || 0;
    });

    const approvalRate = totalApps > 0 ? Math.round((approved / totalApps) * 100) : 0;

    return {
      total: totalApps,
      pending,
      approved,
      rejected,
      approvalRate,
    };
  }, [totals, applicationsByProgram]);

  // Filtered Course Results by Search, Course Name, and Pass/Fail Outcome
  const filteredCourses = useMemo(() => {
    return resultsByCourse.filter((c) => {
      // 1. Specific Course Name Filter
      if (selectedCourseName !== 'ALL' && c.courseName !== selectedCourseName) {
        return false;
      }

      // 2. Exam Outcome (Pass / Fail) Filter
      if (outcomeFilter === 'PASSED_ONLY' && (c.passed === 0 || (c.passRate < 50 && c.results > 0))) {
        return false;
      }
      if (outcomeFilter === 'FAILED_ONLY' && (c.failed === 0 || c.passRate >= 90)) {
        return false;
      }

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.courseName.toLowerCase().includes(q) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(q))
      );
    });
  }, [resultsByCourse, searchQuery, selectedCourseName, outcomeFilter]);

  // Filtered Program Applications by Search & Course Name
  const filteredApplications = useMemo(() => {
    return applicationsByProgram.filter((p) => {
      // 1. Specific Course / Program Name Filter
      if (selectedCourseName !== 'ALL' && p.programName !== selectedCourseName) {
        return false;
      }

      // 2. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.programName.toLowerCase().includes(q) ||
        (p.courseCode && p.courseCode.toLowerCase().includes(q))
      );
    });
  }, [applicationsByProgram, searchQuery, selectedCourseName]);

  // Chart Data: Results by Course (Real Names & Real Counts)
  const courseResultsChartData = useMemo(() => {
    return filteredCourses.map((c) => ({
      name: c.courseName,
      fullName: c.courseName,
      Passed: c.passed || 0,
      Failed: c.failed || 0,
      Disqualified: c.disqualified || 0,
      Total: c.results || 0,
      passRate: c.passRate || 0,
      failRate: c.failRate || 0,
    }));
  }, [filteredCourses]);

  // Chart Data: Applications Status by Program (Real Names & Real Counts)
  const appStatusByProgramChartData = useMemo(() => {
    return filteredApplications.map((p) => ({
      name: p.programName,
      fullName: p.programName,
      Approved: p.approved || 0,
      Pending: p.pending || 0,
      Rejected: p.rejected || 0,
      Total: p.applications || 0,
    }));
  }, [filteredApplications]);

  // Chart Data: Applications Share Donut
  const appProgramDonutData = useMemo(() => {
    return filteredApplications
      .filter((p) => (p.applications || 0) > 0)
      .map((p) => ({
        name: p.programName,
        value: p.applications || 0,
        pending: p.pending || 0,
        approved: p.approved || 0,
        rejected: p.rejected || 0,
      }));
  }, [filteredApplications]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setPeriodMode('all');
    setSelectedYear('2026');
    setSelectedMonth('08');
    setSelectedDate('');
    setSelectedCourseName('ALL');
    setOutcomeFilter('ALL');
    setSearchQuery('');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!apiData) return;
    let csv = `TESSBINN ACADEMY - REAL DATA ANALYSIS & PERFORMANCE REPORT\n`;
    csv += `Generated Date,${new Date().toLocaleDateString()}\n`;
    csv += `Timeframe Mode,${periodMode.toUpperCase()}\n`;
    csv += `Period,${periodMode === 'yearly' ? selectedYear : periodMode === 'monthly' ? `${MONTHS_LIST.find((m) => m.value === selectedMonth)?.label} ${selectedYear}` : 'All Time'}\n\n`;

    csv += `EXAMINATION SUMMARY\n`;
    csv += `Metric,Value\n`;
    csv += `Completed Results,${totals.completedResults}\n`;
    csv += `Passed Results,${totals.passed}\n`;
    csv += `Failed Results,${totals.failed}\n`;
    csv += `Unique Candidates,${totals.uniqueExamTakers}\n`;
    csv += `Overall Pass Rate (%),${totals.passRate}%\n\n`;

    csv += `EXAMINATION RESULTS BY REAL COURSE\n`;
    csv += `Course Name,Course Code,Unique Students,Completed Exams,Passed,Failed,Disqualified,Pass Rate (%),Fail Rate (%)\n`;
    filteredCourses.forEach((c) => {
      csv += `"${c.courseName}","${c.courseCode || ''}",${c.uniqueStudents || 0},${c.results || 0},${c.passed || 0},${c.failed || 0},${c.disqualified || 0},${c.passRate || 0}%,${c.failRate || 0}%\n`;
    });
    csv += `\n`;

    csv += `STUDENT REGISTRATIONS & APPLICATIONS SUMMARY\n`;
    csv += `Total Applications,${applicationMetrics.total}\n`;
    csv += `Approved,${applicationMetrics.approved}\n`;
    csv += `Pending,${applicationMetrics.pending}\n`;
    csv += `Rejected,${applicationMetrics.rejected}\n`;
    csv += `Approval Rate (%),${applicationMetrics.approvalRate}%\n\n`;

    csv += `TRAINING PROGRAM APPLICATIONS\n`;
    csv += `Program Name,Course Code,Total Applications,Pending,Approved,Rejected\n`;
    filteredApplications.forEach((p) => {
      csv += `"${p.programName}","${p.courseCode || ''}",${p.applications || 0},${p.pending || 0},${p.approved || 0},${p.rejected || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tessbin_Live_Analytics_${periodMode}_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Report Exported',
      description: 'The real performance report has been downloaded successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ADVANCED DROPDOWN FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <Card
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        mb={6}
        boxShadow="sm"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="4px"
          bgGradient="linear(to-r, #6366F1, #8B5CF6, #EC4899, #10B981)"
        />

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'start', lg: 'center' }}
          gap={4}
        >
          <VStack align="start" spacing={1.5}>
            <HStack spacing={2} wrap="wrap">
              <Badge
                bg="green.50"
                color="green.700"
                borderWidth="1px"
                borderColor="green.200"
                fontSize="10px"
                fontWeight="800"
                px={2.5}
                py={0.5}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Box w="6px" h="6px" borderRadius="full" bg="green.500" />
                LIVE SYNCHRONIZED
              </Badge>

              <Tag size="sm" colorScheme="purple" borderRadius="full" fontSize="10px" fontWeight="700">
                {periodMode === 'all'
                  ? 'All-Time Analytics'
                  : periodMode === 'yearly'
                  ? `Year ${selectedYear}`
                  : periodMode === 'monthly'
                  ? `${MONTHS_LIST.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
                  : periodMode.toUpperCase()}
              </Tag>

              {selectedCourseName !== 'ALL' && (
                <Tag size="sm" colorScheme="teal" borderRadius="full" fontSize="10px" fontWeight="700">
                  {selectedCourseName}
                </Tag>
              )}

              {outcomeFilter !== 'ALL' && (
                <Tag size="sm" colorScheme={outcomeFilter === 'PASSED_ONLY' ? 'green' : 'red'} borderRadius="full" fontSize="10px" fontWeight="700">
                  {outcomeFilter === 'PASSED_ONLY' ? 'Passed Only' : 'Failed Only'}
                </Tag>
              )}
            </HStack>

            <Heading size="md" fontWeight="900" color={textColor} letterSpacing="tight">
              Academic & Online Examination Data Analysis
            </Heading>
            <Text fontSize="12px" color={mutedText}>
              Live performance metrics, examination pass/fail rates, and student registrations.
            </Text>
          </VStack>

          {/* Export Action */}
          <HStack spacing={3} wrap="wrap">
            {lastFetched && (
              <Text fontSize="11px" color={mutedText}>
                Updated at <Text as="span" fontWeight="700" color={textColor}>{lastFetched}</Text>
              </Text>
            )}

            <Button
              leftIcon={<FiDownload />}
              size="sm"
              bgGradient="linear(to-r, #6366F1, #8B5CF6)"
              color="white"
              _hover={{ bgGradient: 'linear(to-r, #4F46E5, #7C3AED)' }}
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              onClick={handleExportCSV}
            >
              Export CSV Report
            </Button>
          </HStack>
        </Flex>

        {/* ── DROPDOWN FILTERS ROW (100% DATA-DRIVEN) ── */}
        <Divider my={4} borderColor={borderColor} />

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={3} alignItems="end">
          {/* Dropdown 1: Timeframe Period Mode */}
          <Box>
            <Text fontSize="11px" fontWeight="800" color={mutedText} mb={1}>
              <Icon as={FiCalendar} mr={1} color="#6366F1" />
              TIMEFRAME MODE
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value)}
            >
              <option value="all">All-Time (Lifetime)</option>
              <option value="monthly">Monthly (Select Month & Year)</option>
              <option value="yearly">Yearly (Select Year)</option>
              <option value="weekly">Weekly (Recent Weeks)</option>
              <option value="daily">Daily (Specific Date)</option>
            </Select>
          </Box>

          {/* Dropdown 2: Year Selection (e.g. 2026, 2027, 2028, 2029) */}
          <Box>
            <Text fontSize="11px" fontWeight="800" color={mutedText} mb={1}>
              YEAR
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              isDisabled={periodMode === 'all' || periodMode === 'daily'}
            >
              {YEARS_LIST.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </Select>
          </Box>

          {/* Dropdown 3: Month Selection (January to December) */}
          <Box>
            <Text fontSize="11px" fontWeight="800" color={mutedText} mb={1}>
              MONTH
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              isDisabled={periodMode !== 'monthly'}
            >
              {MONTHS_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Box>

          {/* Dropdown 4: Course List (Built directly from Live Data) */}
          <Box>
            <Text fontSize="11px" fontWeight="800" color={mutedText} mb={1}>
              <Icon as={FiAward} mr={1} color="#6366F1" />
              COURSE PROGRAM
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              value={selectedCourseName}
              onChange={(e) => setSelectedCourseName(e.target.value)}
            >
              {dynamicCoursesList.map((cName) => (
                <option key={cName} value={cName}>
                  {cName === 'ALL' ? 'All Courses' : cName}
                </option>
              ))}
            </Select>
          </Box>

          {/* Dropdown 5: Exam Outcome (Passed vs Failed) */}
          <Box>
            <Text fontSize="11px" fontWeight="800" color={mutedText} mb={1}>
              <Icon as={FiCheckCircle} mr={1} color="#10B981" />
              EXAM OUTCOME
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="700"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
            >
              <option value="ALL">All (Passed & Failed)</option>
              <option value="PASSED_ONLY">Passed Exams Only</option>
              <option value="FAILED_ONLY">Failed Exams Only</option>
            </Select>
          </Box>
        </SimpleGrid>

        {/* Secondary Search & Reset Bar */}
        <Flex mt={3} justify="space-between" align="center" wrap="wrap" gap={2}>
          <InputGroup size="sm" maxW={{ base: '100%', md: '280px' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search real course name..."
              borderRadius="xl"
              fontSize="12px"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <HStack spacing={2}>
            <Button
              leftIcon={<Icon as={FiRotateCcw} />}
              size="sm"
              borderRadius="xl"
              variant="outline"
              fontSize="11px"
              fontWeight="700"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>

            <IconButton
              aria-label="Refresh Data"
              icon={<Icon as={FiRefreshCw} />}
              size="sm"
              borderRadius="xl"
              colorScheme="indigo"
              bg="#6366F1"
              color="white"
              isLoading={loading}
              onClick={() => loadData(periodMode, computedAnchor)}
            />
          </HStack>
        </Flex>

        {/* Section Navigation Tabs */}
        <HStack spacing={2} mt={5} pt={4} borderTop="1px" borderColor={borderColor} wrap="wrap">
          {[
            { label: 'All Analytics Overview', icon: FiGrid, badge: null },
            { label: 'Online Exams (Pass & Fail)', icon: FiAward, badge: `${filteredCourses.length} Courses` },
            { label: 'Student Registrations', icon: FiBookOpen, badge: `${filteredApplications.length} Programs` },
          ].map((sec, idx) => {
            const isSecActive = activeSectionTab === idx;
            return (
              <Button
                key={idx}
                size="sm"
                px={4}
                py={2}
                borderRadius="xl"
                fontSize="12px"
                fontWeight="800"
                leftIcon={<Icon as={sec.icon} />}
                bg={isSecActive ? '#6366F1' : useColorModeValue('gray.100', 'gray.800')}
                color={isSecActive ? 'white' : textColor}
                _hover={{
                  bg: isSecActive ? '#4F46E5' : useColorModeValue('gray.200', 'gray.700'),
                }}
                onClick={() => setActiveSectionTab(idx)}
              >
                <HStack spacing={2}>
                  <Text>{sec.label}</Text>
                  {sec.badge && (
                    <Badge
                      bg={isSecActive ? 'whiteAlpha.300' : 'gray.200'}
                      color={isSecActive ? 'white' : 'gray.700'}
                      fontSize="10px"
                      px={1.5}
                      borderRadius="md"
                    >
                      {sec.badge}
                    </Badge>
                  )}
                </HStack>
              </Button>
            );
          })}
        </HStack>
      </Card>

      {/* Notice Alert if error */}
      {error && (
        <Alert status="warning" borderRadius="xl" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="13px" fontWeight="800">Connection Notice</AlertTitle>
            <AlertDescription fontSize="12px">{error}</AlertDescription>
          </Box>
          <Button size="xs" colorScheme="yellow" onClick={() => loadData(periodMode, computedAnchor)}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && !apiData && (
        <Flex justify="center" align="center" direction="column" minH="240px" gap={3}>
          <Spinner size="xl" color="#6366F1" thickness="3px" />
          <Text fontSize="13px" color={mutedText} fontWeight="600">
            Updating real performance analytics...
          </Text>
        </Flex>
      )}

      {apiData && (
        <>
          {/* ========================================================================= */}
          {/* VIEW 0: ALL ANALYTICS OVERVIEW */}
          {/* ========================================================================= */}
          {activeSectionTab === 0 && (
            <Box>
              {/* Top 4 Summary Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={6}>
                {/* Completed Exams */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                        Total Online Exams
                      </Text>
                      <Heading size="xl" fontWeight="900" mt={1} color={textColor}>
                        {totals.completedResults?.toLocaleString() || 0}
                      </Heading>
                      <HStack spacing={1.5} mt={2}>
                        <Badge bg="green.50" color="green.700" fontSize="10px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                          {totals.passed} Passed
                        </Badge>
                        <Badge bg="red.50" color="red.700" fontSize="10px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                          {totals.failed} Failed
                        </Badge>
                      </HStack>
                    </Box>
                    <Flex w="44px" h="44px" borderRadius="xl" bg="#EEF2FF" color="#6366F1" align="center" justify="center">
                      <Icon as={FiAward} boxSize="22px" />
                    </Flex>
                  </Flex>
                </Card>

                {/* Exam Candidates */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                        Unique Candidates
                      </Text>
                      <Heading size="xl" fontWeight="900" mt={1} color={textColor}>
                        {totals.uniqueExamTakers?.toLocaleString() || 0}
                      </Heading>
                      <Text fontSize="11px" color={mutedText} mt={2}>
                        Individual exam takers
                      </Text>
                    </Box>
                    <Flex w="44px" h="44px" borderRadius="xl" bg="blue.50" color="blue.600" align="center" justify="center">
                      <Icon as={FiUsers} boxSize="22px" />
                    </Flex>
                  </Flex>
                </Card>

                {/* Program Registrations */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                        Program Registrations
                      </Text>
                      <Heading size="xl" fontWeight="900" mt={1} color={textColor}>
                        {totals.applications?.toLocaleString() || 0}
                      </Heading>
                      <HStack spacing={1.5} mt={2}>
                        <Badge bg="yellow.50" color="yellow.800" fontSize="10px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                          {applicationMetrics.pending} Pending
                        </Badge>
                        <Badge bg="green.50" color="green.700" fontSize="10px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                          {applicationMetrics.approved} Approved
                        </Badge>
                      </HStack>
                    </Box>
                    <Flex w="44px" h="44px" borderRadius="xl" bg="purple.50" color="purple.600" align="center" justify="center">
                      <Icon as={FiBookOpen} boxSize="22px" />
                    </Flex>
                  </Flex>
                </Card>

                {/* Overall Pass Rate */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                        Overall Pass Rate
                      </Text>
                      <Heading size="xl" fontWeight="900" color="#10B981" mt={1}>
                        {totals.passRate ?? 0}%
                      </Heading>
                      <Progress
                        value={totals.passRate || 0}
                        size="xs"
                        colorScheme="green"
                        borderRadius="full"
                        mt={3}
                      />
                    </Box>
                    <Flex w="44px" h="44px" borderRadius="xl" bg="green.50" color="green.600" align="center" justify="center">
                      <Icon as={FiTrendingUp} boxSize="22px" />
                    </Flex>
                  </Flex>
                </Card>
              </SimpleGrid>

              {/* Side-by-Side Overview Charts */}
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
                {/* Course Results Chart */}
                <Card gridColumn={{ base: 'span 1', lg: 'span 2' }} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Box>
                      <Heading size="sm" fontWeight="800" color={textColor}>
                        Online Exam Pass vs Fail by Course Name
                      </Heading>
                      <Text fontSize="11px" color={mutedText} mt={0.5}>
                        Real Passed (Green) vs Failed (Red) student examination counts
                      </Text>
                    </Box>
                    <Button size="xs" variant="ghost" colorScheme="indigo" onClick={() => setActiveSectionTab(1)}>
                      View Full Details →
                    </Button>
                  </Flex>

                  <Box h="310px" w="100%">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseResultsChartData} margin={{ top: 10, right: 20, left: -10, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                        <XAxis
                          dataKey="name"
                          stroke={mutedText}
                          fontSize="11px"
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis stroke={mutedText} fontSize="11px" tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <Box bg="gray.900" color="white" p={3} borderRadius="xl" fontSize="12px" border="1px solid rgba(255,255,255,0.1)">
                                  <Text fontWeight="800" color="white" mb={2}>{d.fullName}</Text>
                                  <Text color="#10B981">✓ Passed: <b>{d.Passed} ({d.passRate}%)</b></Text>
                                  <Text color="#EF4444">✕ Failed: <b>{d.Failed} ({d.failRate}%)</b></Text>
                                  {d.Disqualified > 0 && <Text color="#F59E0B">⚠ Disqualified: <b>{d.Disqualified}</b></Text>}
                                  <Text color="gray.300" mt={1}>Total Takes: <b>{d.Total}</b></Text>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="Passed" fill={STATUS_COLORS.passed} radius={[4, 4, 0, 0]} maxBarSize={36} name="Passed Exams" />
                        <Bar dataKey="Failed" fill={STATUS_COLORS.failed} radius={[4, 4, 0, 0]} maxBarSize={36} name="Failed Exams" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                {/* Applications Donut */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="sm">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Box>
                      <Heading size="sm" fontWeight="800" color={textColor}>
                        Program Registrations Share
                      </Heading>
                      <Text fontSize="11px" color={mutedText} mt={0.5}>
                        Real distribution of applications by program
                      </Text>
                    </Box>
                    <Button size="xs" variant="ghost" colorScheme="purple" onClick={() => setActiveSectionTab(2)}>
                      View Details →
                    </Button>
                  </Flex>

                  <Box h="210px" w="100%">
                    {appProgramDonutData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={appProgramDonutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                          >
                            {appProgramDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Flex h="100%" align="center" justify="center">
                        <Text fontSize="12px" color={mutedText}>No application records.</Text>
                      </Flex>
                    )}
                  </Box>

                  <VStack align="stretch" spacing={1.5} mt={2} maxH="80px" overflowY="auto">
                    {appProgramDonutData.slice(0, 4).map((p, idx) => (
                      <Flex key={idx} justify="space-between" align="center" fontSize="11px">
                        <HStack spacing={2}>
                          <Box w="8px" h="8px" borderRadius="full" bg={CHART_COLORS[idx % CHART_COLORS.length]} />
                          <Text color={textColor} fontWeight="600" noOfLines={1} maxW="150px">
                            {p.name}
                          </Text>
                        </HStack>
                        <Text fontWeight="700" color={textColor}>
                          {p.value}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Card>
              </SimpleGrid>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: DEDICATED ONLINE EXAMS (REAL DATA TABLE & REAL CHARTS) */}
          {/* ========================================================================= */}
          {activeSectionTab === 1 && (
            <Box>
              {/* Exam Specific Metric Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4} mb={6}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color={mutedText}>TOTAL EXAMS</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color={textColor}>
                    {totals.completedResults}
                  </Heading>
                  <Text fontSize="11px" color={mutedText} mt={1}>Completed evaluations</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="green.600">PASSED EXAMS</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="green.600">
                    {totals.passed}
                  </Heading>
                  <Text fontSize="11px" color="green.600" fontWeight="700" mt={1}>
                    {totals.completedResults > 0 ? Math.round((totals.passed / totals.completedResults) * 100) : 0}% of all takes
                  </Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="red.500">FAILED EXAMS</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="red.500">
                    {totals.failed}
                  </Heading>
                  <Text fontSize="11px" color="red.500" fontWeight="700" mt={1}>
                    {totals.completedResults > 0 ? Math.round((totals.failed / totals.completedResults) * 100) : 0}% of all takes
                  </Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="yellow.600">DISQUALIFIED</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="yellow.600">
                    {totals.disqualified}
                  </Heading>
                  <Text fontSize="11px" color="yellow.600" fontWeight="700" mt={1}>Non-compliant takes</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="#6366F1">OVERALL PASS RATE</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="#6366F1">
                    {totals.passRate}%
                  </Heading>
                  <Progress value={totals.passRate || 0} size="xs" colorScheme="purple" borderRadius="full" mt={2} />
                </Card>
              </SimpleGrid>

              {/* Dedicated Online Exams Table with Real Data */}
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflow="hidden" boxShadow="sm" mb={6}>
                <Flex bg={cardHeaderBg} px={6} py={4} justify="space-between" align="center" borderBottom="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiAward} color="#6366F1" boxSize="20px" />
                    <Box>
                      <Heading size="sm" fontWeight="800" color={textColor}>
                        Real Online Examination Performance Table
                      </Heading>
                      <Text fontSize="11px" color={mutedText}>
                        Showing {filteredCourses.length} courses with individual candidate counts, passed, failed, and pass rates
                      </Text>
                    </Box>
                  </HStack>
                </Flex>

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Course Name</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Course Code</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText} isNumeric>Candidates</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText} isNumeric>Total Takes</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="green.600" isNumeric>Passed</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="red.500" isNumeric>Failed</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="yellow.600" isNumeric>DQ</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Pass / Fail Ratio</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((c, idx) => {
                          const pRate = c.passRate ?? 0;
                          const fRate = c.failRate ?? 0;

                          return (
                            <Tr key={c.courseId || idx} _hover={{ bg: hoverRowBg }} transition="all 0.15s">
                              {/* Course Name */}
                              <Td py={3.5}>
                                <HStack spacing={3}>
                                  <Flex w="32px" h="32px" borderRadius="lg" bg="#EEF2FF" color="#6366F1" align="center" justify="center">
                                    <Icon as={FiAward} boxSize="16px" />
                                  </Flex>
                                  <Box>
                                    <Text fontWeight="800" fontSize="13px" color={textColor}>
                                      {c.courseName}
                                    </Text>
                                  </Box>
                                </HStack>
                              </Td>

                              {/* Course Code */}
                              <Td>
                                <Badge bg="gray.100" color="gray.700" fontSize="11px" px={2} py={0.5} borderRadius="md" fontWeight="700">
                                  {c.courseCode || 'N/A'}
                                </Badge>
                              </Td>

                              {/* Candidates */}
                              <Td isNumeric fontWeight="700" color={textColor}>{c.uniqueStudents ?? 0}</Td>

                              {/* Total Takes */}
                              <Td isNumeric fontWeight="800" color={textColor}>{c.results ?? 0}</Td>

                              {/* Passed */}
                              <Td isNumeric>
                                <Badge bg="green.50" color="green.700" fontSize="11px" fontWeight="900" px={2} py={0.5} borderRadius="md">
                                  {c.passed ?? 0} ({pRate}%)
                                </Badge>
                              </Td>

                              {/* Failed */}
                              <Td isNumeric>
                                <Badge bg="red.50" color="red.700" fontSize="11px" fontWeight="900" px={2} py={0.5} borderRadius="md">
                                  {c.failed ?? 0} ({fRate}%)
                                </Badge>
                              </Td>

                              {/* Disqualified */}
                              <Td isNumeric fontWeight="700" color="yellow.600">
                                {c.disqualified ?? 0}
                              </Td>

                              {/* Pass / Fail Visual Progress */}
                              <Td minW="140px">
                                <VStack align="stretch" spacing={1}>
                                  <HStack justify="space-between" fontSize="10px" fontWeight="700">
                                    <Text color="green.600">{pRate}% Pass</Text>
                                    <Text color="red.500">{fRate}% Fail</Text>
                                  </HStack>
                                  <Progress
                                    value={pRate}
                                    size="xs"
                                    colorScheme={pRate >= 75 ? 'green' : pRate >= 50 ? 'yellow' : 'red'}
                                    borderRadius="full"
                                  />
                                </VStack>
                              </Td>

                              {/* Rating */}
                              <Td>
                                {c.results === 0 ? (
                                  <Badge bg="gray.100" color="gray.600" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                                    NO TAKES
                                  </Badge>
                                ) : pRate >= 80 ? (
                                  <Badge bg="green.50" color="green.700" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                                    EXCELLENT
                                  </Badge>
                                ) : pRate >= 50 ? (
                                  <Badge bg="yellow.50" color="yellow.800" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                                    GOOD
                                  </Badge>
                                ) : (
                                  <Badge bg="red.50" color="red.700" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                                    NEEDS FOCUS
                                  </Badge>
                                )}
                              </Td>
                            </Tr>
                          );
                        })
                      ) : (
                        <Tr>
                          <Td colSpan={9} py={8} textAlign="center" color={mutedText}>
                            No matching course results found for current filters.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Card>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: DEDICATED STUDENT REGISTRATIONS (REAL DATA TABLE & REAL CHARTS) */}
          {/* ========================================================================= */}
          {activeSectionTab === 2 && (
            <Box>
              {/* Registration Specific Metric Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4} mb={6}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color={mutedText}>TOTAL REGISTRATIONS</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color={textColor}>
                    {applicationMetrics.total}
                  </Heading>
                  <Text fontSize="11px" color={mutedText} mt={1}>All submitted requests</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="yellow.600">PENDING REVIEW</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="yellow.600">
                    {applicationMetrics.pending}
                  </Heading>
                  <Text fontSize="11px" color="yellow.600" fontWeight="700" mt={1}>Awaiting decision</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="green.600">APPROVED</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="green.600">
                    {applicationMetrics.approved}
                  </Heading>
                  <Text fontSize="11px" color="green.600" fontWeight="700" mt={1}>Enrolled candidates</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="red.500">REJECTED</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="red.500">
                    {applicationMetrics.rejected}
                  </Heading>
                  <Text fontSize="11px" color="red.500" fontWeight="700" mt={1}>Declined applications</Text>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4}>
                  <Text fontSize="11px" fontWeight="800" color="#8B5CF6">APPROVAL RATE</Text>
                  <Heading size="lg" fontWeight="900" mt={1} color="#8B5CF6">
                    {applicationMetrics.approvalRate}%
                  </Heading>
                  <Progress value={applicationMetrics.approvalRate || 0} size="xs" colorScheme="purple" borderRadius="full" mt={2} />
                </Card>
              </SimpleGrid>

              {/* Dedicated Registrations Table with Real Data */}
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflow="hidden" boxShadow="sm">
                <Flex bg={cardHeaderBg} px={6} py={4} justify="space-between" align="center" borderBottom="1px" borderColor={borderColor}>
                  <HStack spacing={3}>
                    <Icon as={FiBookOpen} color="purple.500" boxSize="20px" />
                    <Box>
                      <Heading size="sm" fontWeight="800" color={textColor}>
                        Real Training Program Registrations Table
                      </Heading>
                      <Text fontSize="11px" color={mutedText}>
                        Showing {filteredApplications.length} programs with candidate registration requests and live statuses
                      </Text>
                    </Box>
                  </HStack>
                </Flex>

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Program Name</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Course Code</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText} isNumeric>Total Requests</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="yellow.600" isNumeric>Pending</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="green.600" isNumeric>Approved</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color="red.500" isNumeric>Rejected</Th>
                        <Th py={3.5} fontSize="11px" textTransform="uppercase" color={mutedText}>Status Overview</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredApplications.length > 0 ? (
                        filteredApplications.map((p, idx) => {
                          const total = p.applications || 0;
                          const approved = p.approved || 0;
                          const pending = p.pending || 0;
                          const rejected = p.rejected || 0;
                          const approvalRatio = total > 0 ? Math.round((approved / total) * 100) : 0;

                          return (
                            <Tr key={p.courseId || idx} _hover={{ bg: hoverRowBg }} transition="all 0.15s">
                              {/* Program Name */}
                              <Td py={3.5}>
                                <HStack spacing={3}>
                                  <Flex w="32px" h="32px" borderRadius="lg" bg="purple.50" color="purple.600" align="center" justify="center">
                                    <Icon as={FiBookOpen} boxSize="16px" />
                                  </Flex>
                                  <Box>
                                    <Text fontWeight="800" fontSize="13px" color={textColor}>
                                      {p.programName}
                                    </Text>
                                  </Box>
                                </HStack>
                              </Td>

                              {/* Code */}
                              <Td fontWeight="700" color={textColor}>
                                <Badge bg="gray.100" color="gray.700" fontSize="10px" px={2} py={0.5} borderRadius="md">
                                  {p.courseCode || 'N/A'}
                                </Badge>
                              </Td>

                              {/* Total Requests */}
                              <Td isNumeric fontWeight="900" fontSize="14px" color={textColor}>{total}</Td>

                              {/* Pending */}
                              <Td isNumeric fontWeight="700" color="yellow.600">
                                <Badge bg="yellow.50" color="yellow.800" fontSize="10px" px={2} py={0.5} borderRadius="md">
                                  {pending} Pending
                                </Badge>
                              </Td>

                              {/* Approved */}
                              <Td isNumeric fontWeight="700" color="green.600">
                                <Badge bg="green.50" color="green.700" fontSize="10px" px={2} py={0.5} borderRadius="md">
                                  {approved} Approved
                                </Badge>
                              </Td>

                              {/* Rejected */}
                              <Td isNumeric fontWeight="700" color="red.500">
                                <Badge bg="red.50" color="red.700" fontSize="10px" px={2} py={0.5} borderRadius="md">
                                  {rejected} Rejected
                                </Badge>
                              </Td>

                              {/* Status Overview */}
                              <Td minW="130px">
                                {total === 0 ? (
                                  <Text fontSize="11px" color={mutedText}>No applications</Text>
                                ) : (
                                  <VStack align="stretch" spacing={1}>
                                    <Text fontSize="11px" fontWeight="700" color={mutedText}>
                                      {pending} awaiting review
                                    </Text>
                                    <Progress
                                      value={approvalRatio > 0 ? approvalRatio : 100}
                                      size="xs"
                                      colorScheme={approvalRatio > 0 ? 'green' : 'yellow'}
                                      borderRadius="full"
                                    />
                                  </VStack>
                                )}
                              </Td>
                            </Tr>
                          );
                        })
                      ) : (
                        <Tr>
                          <Td colSpan={7} py={8} textAlign="center" color={mutedText}>
                            No matching program registrations found for current filters.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Card>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TessbinDataAnalyticsView;
