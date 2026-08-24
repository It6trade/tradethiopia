import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Progress,
  HStack,
  VStack,
  Icon,
  Tabs,
  TabList,
  Tab,
  Card,
  CardBody,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiClock,
  FiMail,
  FiUserPlus,
  FiUserMinus,
  FiAward,
  FiRefreshCw,
  FiEdit2,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiFilter,
  FiSearch,
} from 'react-icons/fi';
import { getHrKpis, saveHrKpi, getHrLiveStats } from '../services/hrKpiService';

const PRIMARY_GREEN = '#1a2e22';
const ACCENT_GREEN = '#2d6a4f';
const LIGHT_GREEN_BG = '#f4f9f5';
const BORDER_COLOR = '#e2e8f0';

// Config metadata for the 10 HR KPIs
const KPI_CONFIG = [
  {
    key: 'postVacancies',
    label: 'Post Vacancies',
    description: 'Post job vacancies across portals & social channels',
    icon: FiBriefcase,
    color: 'teal',
    unit: 'vacancies',
  },
  {
    key: 'screenCvs',
    label: 'Screen CVs',
    description: 'Review & screen candidate resumes & applications',
    icon: FiFileText,
    color: 'blue',
    unit: 'CVs',
  },
  {
    key: 'conductInterviews',
    label: 'Conduct Interviews',
    description: 'Interview sessions conducted for candidate selection',
    icon: FiUsers,
    color: 'purple',
    unit: 'interviews',
  },
  {
    key: 'facilitateInternalTrainings',
    label: 'Facilitate Internal Trainings',
    description: 'Internal workshops & employee development sessions',
    icon: FiAward,
    color: 'green',
    unit: 'sessions',
  },
  {
    key: 'attendancePunctuality',
    label: 'Maintain Employee Attendance & Punctuality',
    description: 'Overall staff attendance rate & punctuality compliance',
    icon: FiClock,
    color: 'emerald',
    unit: '%',
  },
  {
    key: 'checkingJobEnisra',
    label: 'Checking hr@tradethiopia.com',
    description: 'Monitoring & processing hr@tradethiopia.com application inbox',
    icon: FiMail,
    color: 'cyan',
    unit: 'checks',
  },
  {
    key: 'newHires',
    label: 'Number of New Hires',
    description: 'New employees hired & onboarded in period',
    icon: FiUserPlus,
    color: 'whatsapp',
    unit: 'hires',
  },
  {
    key: 'resignations',
    label: 'Number of Resignations',
    description: 'Employee departures & resignations tracked',
    icon: FiUserMinus,
    color: 'red',
    unit: 'resignations',
  },
  {
    key: 'candidatesPool',
    label: 'Number of Candidates Pool',
    description: 'Total active & backup candidate talent pipeline',
    icon: FiUsers,
    color: 'orange',
    unit: 'candidates',
  },
  {
    key: 'staffTrainingParticipants',
    label: 'Staff Participating in Trainings',
    description: 'Employees actively attending training programs',
    icon: FiAward,
    color: 'indigo',
    unit: 'participants',
  },
];

const MONTHS = [
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

const YEARS = [2024, 2025, 2026, 2027, 2028];

const QUARTERS = [
  { value: 'Q1', label: 'Q1 (Jan - Mar)' },
  { value: 'Q2', label: 'Q2 (Apr - Jun)' },
  { value: 'Q3', label: 'Q3 (Jul - Sep)' },
  { value: 'Q4', label: 'Q4 (Oct - Dec)' },
];

const HrKpiPage = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
  
  const startOfYear = new Date(currentYear, 0, 1);
  const pastDaysOfYear = (now - startOfYear) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  const currentWeek = `W${weekNum < 10 ? '0' + weekNum : weekNum}`;

  const [periodType, setPeriodType] = useState('monthly'); // 'weekly', 'monthly', 'quarterly'
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('All');

  const [selectedMetric, setSelectedMetric] = useState(null);
  const [editFormData, setEditFormData] = useState({ target: 0, actual: 0, status: 'Pending', notes: '' });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Compute active periodKey based on filters
  const activePeriodKey = useMemo(() => {
    if (periodType === 'weekly') {
      return `${selectedYear}-${selectedWeek}`;
    }
    if (periodType === 'quarterly') {
      return `${selectedYear}-${selectedQuarter}`;
    }
    return `${selectedYear}-${selectedMonth}`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter]);

  const loadKpis = useCallback(async (type, key) => {
    setLoading(true);
    try {
      const res = await getHrKpis(type, key);
      if (res.success) {
        setKpiData(res.data);
      }
    } catch (err) {
      toast({
        title: 'Error loading KPI data',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKpis(periodType, activePeriodKey);
  }, [periodType, activePeriodKey, loadKpis]);

  const handleTabChange = (index) => {
    const types = ['weekly', 'monthly', 'quarterly'];
    setPeriodType(types[index]);
  };

  const handleSyncLiveData = async () => {
    setSyncing(true);
    try {
      const liveRes = await getHrLiveStats();
      if (liveRes.success && kpiData) {
        const { candidateCount, newHiresCount } = liveRes.data;
        const updatedMetrics = {
          candidatesPool: { ...kpiData.candidatesPool, actual: candidateCount },
          newHires: { ...kpiData.newHires, actual: newHiresCount },
        };
        const saveRes = await saveHrKpi({
          periodType,
          periodKey: activePeriodKey,
          year: parseInt(selectedYear),
          metrics: updatedMetrics,
        });
        if (saveRes.success) {
          setKpiData(saveRes.data);
          toast({
            title: 'Live Data Synced',
            description: `Updated Candidates Pool (${candidateCount}) & New Hires (${newHiresCount})`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (cfg) => {
    setSelectedMetric(cfg);
    const m = kpiData?.[cfg.key] || { target: 0, actual: 0, status: 'Pending', notes: '' };
    setEditFormData({
      target: m.target,
      actual: m.actual,
      status: m.status || 'Pending',
      notes: m.notes || '',
    });
    onOpen();
  };

  const handleSaveMetric = async () => {
    if (!selectedMetric || !kpiData) return;
    try {
      const updatedMetrics = {
        [selectedMetric.key]: {
          target: Number(editFormData.target),
          actual: Number(editFormData.actual),
          status: editFormData.status,
          notes: editFormData.notes,
        },
      };

      const res = await saveHrKpi({
        periodType,
        periodKey: activePeriodKey,
        year: parseInt(selectedYear),
        metrics: updatedMetrics,
      });

      if (res.success) {
        setKpiData(res.data);
        toast({
          title: 'Metric Updated',
          description: `${selectedMetric.label} KPI updated successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    } catch (err) {
      toast({
        title: 'Error saving KPI',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportCsv = () => {
    if (!kpiData) return;
    let csvContent = 'data:text/csv;charset=utf-8,KPI Name,Frequency,Period,Target,Actual,Completion %,Status,Notes\n';
    KPI_CONFIG.forEach((cfg) => {
      const m = kpiData[cfg.key] || { target: 0, actual: 0, status: 'Pending', notes: '' };
      const pct = m.target > 0 ? ((m.actual / m.target) * 100).toFixed(1) : '100.0';
      csvContent += `"${cfg.label}","${periodType.toUpperCase()}","${activePeriodKey}","${m.target}","${m.actual}","${pct}%","${m.status}","${m.notes.replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_KPI_${periodType}_${activePeriodKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered metrics for Summary Table
  const filteredKpiConfig = useMemo(() => {
    return KPI_CONFIG.filter((cfg) => {
      const m = kpiData?.[cfg.key] || { target: 0, actual: 0, status: 'Pending' };
      const matchesSearch =
        cfg.label.toLowerCase().includes(tableSearch.toLowerCase()) ||
        cfg.description.toLowerCase().includes(tableSearch.toLowerCase());

      let currentStatus = m.status || 'Pending';
      if (m.target > 0 && m.actual >= m.target) currentStatus = 'Completed';
      else if (m.target > 0 && m.actual / m.target >= 0.8) currentStatus = 'On Track';
      else if (m.target > 0 && m.actual / m.target < 0.8) currentStatus = 'Behind Target';

      const matchesStatus =
        tableStatusFilter === 'All' || currentStatus === tableStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [kpiData, tableSearch, tableStatusFilter]);

  // Overall Stats calculation
  let totalTargetSum = 0;
  let totalActualSum = 0;
  let completedCount = 0;
  let onTrackCount = 0;

  KPI_CONFIG.forEach((cfg) => {
    const m = kpiData?.[cfg.key] || { target: 0, actual: 0, status: 'Pending' };
    totalTargetSum += m.target;
    totalActualSum += m.actual;
    if (m.status === 'Completed' || (m.target > 0 && m.actual >= m.target)) {
      completedCount++;
    } else if (m.status === 'On Track' || (m.target > 0 && m.actual / m.target >= 0.8)) {
      onTrackCount++;
    }
  });

  const overallCompletionRate = totalTargetSum > 0 ? Math.min(100, Math.round((totalActualSum / totalTargetSum) * 100)) : 100;

  const getStatusBadge = (status, actual, target) => {
    let colorScheme = 'gray';
    let text = status || 'Pending';

    if (target > 0 && actual >= target) {
      colorScheme = 'green';
      text = 'Completed';
    } else if (status === 'On Track' || (target > 0 && actual / target >= 0.8)) {
      colorScheme = 'teal';
      text = 'On Track';
    } else if (status === 'Behind Target' || (target > 0 && actual / target < 0.8)) {
      colorScheme = 'orange';
      text = 'Behind Target';
    }

    return (
      <Badge colorScheme={colorScheme} px={2.5} py={1} borderRadius="full" fontSize="11px" textTransform="uppercase" fontWeight="700">
        {text}
      </Badge>
    );
  };

  // Helper text for month display
  const activeMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || 'Month';

  return (
    <Box p={{ base: 4, md: 6 }} bg={LIGHT_GREEN_BG} minH="100vh">
      {/* Header Banner */}
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} justify="space-between" mb={6} gap={4}>
        <Box>
          <HStack spacing={3} mb={1}>
            <Icon as={FiTrendingUp} boxSize={7} color={ACCENT_GREEN} />
            <Heading size="lg" color={PRIMARY_GREEN} fontWeight="800">
              HR KPI Dashboard
            </Heading>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            Filter weekly, monthly, and quarterly HR KPI metrics by Year and Month.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            isLoading={syncing}
            onClick={handleSyncLiveData}
            size="sm"
            colorScheme="whatsapp"
            variant="outline"
            bg="white"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: 'green.50' }}
          >
            Sync Live Data
          </Button>

          <Button
            leftIcon={<Icon as={FiDownload} />}
            onClick={handleExportCsv}
            size="sm"
            bg={ACCENT_GREEN}
            color="white"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: PRIMARY_GREEN }}
          >
            Export CSV
          </Button>
        </HStack>
      </Flex>

      {/* Main Filter Bar Card (Frequency + Year & Month Dropdowns) */}
      <Card bg="white" borderRadius="xl" border="1px solid" borderColor={BORDER_COLOR} mb={6} shadow="sm">
        <CardBody p={5}>
          <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'stretch', lg: 'center' }} gap={5}>
            {/* Frequency Tabs */}
            <Tabs variant="soft-rounded" colorScheme="green" index={['weekly', 'monthly', 'quarterly'].indexOf(periodType)} onChange={handleTabChange}>
              <TabList bg="gray.100" p={1} borderRadius="xl">
                <Tab fontSize="13px" fontWeight="700" px={5}>Weekly</Tab>
                <Tab fontSize="13px" fontWeight="700" px={5}>Monthly</Tab>
                <Tab fontSize="13px" fontWeight="700" px={5}>Quarterly</Tab>
              </TabList>
            </Tabs>

            {/* Filter Dropdowns (Year & Month/Week/Quarter) */}
            <Flex wrap="wrap" align="center" gap={3}>
              <HStack spacing={2}>
                <Icon as={FiFilter} color={ACCENT_GREEN} />
                <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                  Filter By:
                </Text>
              </HStack>

              {/* Year Selector */}
              <Select
                size="sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                w="110px"
                borderRadius="lg"
                fontWeight="700"
                bg="white"
                borderColor="gray.300"
                _focus={{ borderColor: ACCENT_GREEN }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>

              {/* Month / Week / Quarter Selector depending on periodType */}
              {periodType === 'monthly' && (
                <Select
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  w="140px"
                  borderRadius="lg"
                  fontWeight="700"
                  bg="white"
                  borderColor="gray.300"
                  _focus={{ borderColor: ACCENT_GREEN }}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              )}

              {periodType === 'weekly' && (
                <Select
                  size="sm"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  w="130px"
                  borderRadius="lg"
                  fontWeight="700"
                  bg="white"
                  borderColor="gray.300"
                  _focus={{ borderColor: ACCENT_GREEN }}
                >
                  {Array.from({ length: 52 }, (_, i) => {
                    const wVal = `W${i + 1 < 10 ? '0' + (i + 1) : i + 1}`;
                    return <option key={wVal} value={wVal}>Week {i + 1}</option>;
                  })}
                </Select>
              )}

              {periodType === 'quarterly' && (
                <Select
                  size="sm"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  w="150px"
                  borderRadius="lg"
                  fontWeight="700"
                  bg="white"
                  borderColor="gray.300"
                  _focus={{ borderColor: ACCENT_GREEN }}
                >
                  {QUARTERS.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </Select>
              )}

              {/* Active Period Badge */}
              <Badge colorScheme="green" fontSize="13px" px={3.5} py={1.5} borderRadius="lg" ml={{ base: 0, sm: 2 }}>
                {periodType === 'monthly' ? `${activeMonthLabel} ${selectedYear}` : `${periodType.toUpperCase()} (${activePeriodKey})`}
              </Badge>
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      {/* Overview Stat Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
        <Card bg="white" borderRadius="xl" border="1px solid" borderColor={BORDER_COLOR} shadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                  Overall Completion Rate
                </Text>
                <Heading size="xl" color={PRIMARY_GREEN} mt={2} fontWeight="900">
                  {overallCompletionRate}%
                </Heading>
              </Box>
              <Flex w="52px" h="52px" align="center" justify="center" bg="green.50" borderRadius="xl">
                <Icon as={FiTrendingUp} boxSize={6} color={ACCENT_GREEN} />
              </Flex>
            </Flex>
            <Progress value={overallCompletionRate} colorScheme="green" size="sm" borderRadius="full" mt={4} />
          </CardBody>
        </Card>

        <Card bg="white" borderRadius="xl" border="1px solid" borderColor={BORDER_COLOR} shadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                  KPIs Completed / On Track
                </Text>
                <Heading size="xl" color={ACCENT_GREEN} mt={2} fontWeight="900">
                  {completedCount + onTrackCount} <Text as="span" fontSize="lg" color="gray.400">/ 10</Text>
                </Heading>
              </Box>
              <Flex w="52px" h="52px" align="center" justify="center" bg="teal.50" borderRadius="xl">
                <Icon as={FiCheckCircle} boxSize={6} color="teal.500" />
              </Flex>
            </Flex>
            <Text fontSize="xs" color="gray.500" mt={4}>
              {completedCount} Fully Completed &bull; {onTrackCount} On Track
            </Text>
          </CardBody>
        </Card>

        <Card bg="white" borderRadius="xl" border="1px solid" borderColor={BORDER_COLOR} shadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                  Attention Needed
                </Text>
                <Heading size="xl" color="orange.500" mt={2} fontWeight="900">
                  {10 - (completedCount + onTrackCount)}
                </Heading>
              </Box>
              <Flex w="52px" h="52px" align="center" justify="center" bg="orange.50" borderRadius="xl">
                <Icon as={FiAlertCircle} boxSize={6} color="orange.500" />
              </Flex>
            </Flex>
            <Text fontSize="xs" color="gray.500" mt={4}>
              Metrics currently below 80% target threshold
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Detailed KPI Cards Grid */}
      <Heading size="md" color={PRIMARY_GREEN} mb={4} fontWeight="800">
        HR KPI Performance Indicators ({periodType === 'monthly' ? `${activeMonthLabel} ${selectedYear}` : activePeriodKey})
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={5} mb={8}>
        {KPI_CONFIG.map((cfg) => {
          const metric = kpiData?.[cfg.key] || { target: 0, actual: 0, status: 'Pending', notes: '' };
          const pct = metric.target > 0 ? Math.min(100, Math.round((metric.actual / metric.target) * 100)) : 100;

          return (
            <Card
              key={cfg.key}
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor={BORDER_COLOR}
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: 'md', borderColor: ACCENT_GREEN }}
            >
              <CardBody p={5}>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <HStack spacing={3}>
                    <Flex w="42px" h="42px" align="center" justify="center" bg={`${cfg.color}.50`} borderRadius="lg">
                      <Icon as={cfg.icon} boxSize={5} color={`${cfg.color}.600`} />
                    </Flex>
                    <Box>
                      <Text fontWeight="800" fontSize="md" color={PRIMARY_GREEN}>
                        {cfg.label}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {cfg.description}
                      </Text>
                    </Box>
                  </HStack>

                  <IconButton
                    icon={<Icon as={FiEdit2} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                    onClick={() => handleOpenEdit(cfg)}
                    aria-label="Edit KPI"
                  />
                </Flex>

                <Divider my={3} />

                <Flex justify="space-between" align="center" mb={2}>
                  <HStack spacing={4}>
                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="700">
                        Actual
                      </Text>
                      <Text fontSize="lg" fontWeight="900" color={PRIMARY_GREEN}>
                        {metric.actual} <Text as="span" fontSize="xs" color="gray.500">{cfg.unit}</Text>
                      </Text>
                    </Box>

                    <Text fontSize="lg" color="gray.300" fontWeight="300">/</Text>

                    <Box>
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="700">
                        Target
                      </Text>
                      <Text fontSize="lg" fontWeight="800" color="gray.600">
                        {metric.target} <Text as="span" fontSize="xs" color="gray.500">{cfg.unit}</Text>
                      </Text>
                    </Box>
                  </HStack>

                  <VStack align="flex-end" spacing={1}>
                    {getStatusBadge(metric.status, metric.actual, metric.target)}
                    <Text fontSize="xs" fontWeight="800" color={pct >= 100 ? 'green.600' : pct >= 80 ? 'teal.600' : 'orange.500'}>
                      {pct}% Achieved
                    </Text>
                  </VStack>
                </Flex>

                <Progress value={pct} colorScheme={pct >= 100 ? 'green' : pct >= 80 ? 'teal' : 'orange'} size="xs" borderRadius="full" mt={2} />

                {metric.notes && (
                  <Text fontSize="xs" color="gray.500" italic mt={2.5} bg="gray.50" p={2} borderRadius="md">
                    Note: {metric.notes}
                  </Text>
                )}
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Summary Table Card with Year/Month & Status Filters */}
      <Card bg="white" borderRadius="xl" border="1px solid" borderColor={BORDER_COLOR} shadow="sm" mb={6}>
        <CardBody p={5}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={4} gap={4}>
            <Box>
              <Heading size="sm" color={PRIMARY_GREEN} fontWeight="800">
                HR KPI Summary Table ({periodType === 'monthly' ? `${activeMonthLabel} ${selectedYear}` : activePeriodKey})
              </Heading>
              <Text fontSize="xs" color="gray.500">
                Showing {filteredKpiConfig.length} of {KPI_CONFIG.length} metrics
              </Text>
            </Box>

            {/* Table Filters */}
            <HStack spacing={3}>
              <InputGroup size="sm" maxW="200px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search metric..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  borderRadius="lg"
                  bg="white"
                />
              </InputGroup>

              <Select
                size="sm"
                value={tableStatusFilter}
                onChange={(e) => setTableStatusFilter(e.target.value)}
                w="140px"
                borderRadius="lg"
                bg="white"
                fontWeight="600"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="On Track">On Track</option>
                <option value="Behind Target">Behind Target</option>
                <option value="Pending">Pending</option>
              </Select>
            </HStack>
          </Flex>

          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={3}>KPI Name</Th>
                  <Th py={3}>Target</Th>
                  <Th py={3}>Actual</Th>
                  <Th py={3}>Completion %</Th>
                  <Th py={3}>Status</Th>
                  <Th py={3} textAlign="right">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredKpiConfig.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={6} color="gray.500">
                      No matching KPI metrics found for current filter.
                    </Td>
                  </Tr>
                ) : (
                  filteredKpiConfig.map((cfg) => {
                    const m = kpiData?.[cfg.key] || { target: 0, actual: 0, status: 'Pending' };
                    const pct = m.target > 0 ? Math.min(100, Math.round((m.actual / m.target) * 100)) : 100;
                    return (
                      <Tr key={cfg.key} _hover={{ bg: 'green.50' }}>
                        <Td fontWeight="700" color={PRIMARY_GREEN}>
                          <HStack spacing={2}>
                            <Icon as={cfg.icon} color={`${cfg.color}.600`} />
                            <Text>{cfg.label}</Text>
                          </HStack>
                        </Td>
                        <Td fontWeight="600">{m.target} {cfg.unit}</Td>
                        <Td fontWeight="800" color={ACCENT_GREEN}>{m.actual} {cfg.unit}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Progress value={pct} colorScheme={pct >= 100 ? 'green' : pct >= 80 ? 'teal' : 'orange'} size="xs" w="60px" borderRadius="full" />
                            <Text fontSize="xs" fontWeight="700">{pct}%</Text>
                          </HStack>
                        </Td>
                        <Td>{getStatusBadge(m.status, m.actual, m.target)}</Td>
                        <Td textAlign="right">
                          <Button size="xs" colorScheme="green" variant="ghost" onClick={() => handleOpenEdit(cfg)}>
                            Edit
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Modal for editing metric */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader color={PRIMARY_GREEN} fontWeight="800" borderBottom="1px solid" borderColor={BORDER_COLOR}>
            Update {selectedMetric?.label} ({activePeriodKey})
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Target Value ({selectedMetric?.unit})</FormLabel>
                <Input
                  type="number"
                  value={editFormData.target}
                  onChange={(e) => setEditFormData({ ...editFormData, target: e.target.value })}
                  borderRadius="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Actual Value ({selectedMetric?.unit})</FormLabel>
                <Input
                  type="number"
                  value={editFormData.actual}
                  onChange={(e) => setEditFormData({ ...editFormData, actual: e.target.value })}
                  borderRadius="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700">Status</FormLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  borderRadius="lg"
                >
                  <option value="On Track">On Track</option>
                  <option value="Behind Target">Behind Target</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700">Notes & Comments</FormLabel>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Add details, blockers, or progress context..."
                  borderRadius="lg"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={BORDER_COLOR}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancel
            </Button>
            <Button bg={ACCENT_GREEN} color="white" onClick={handleSaveMetric} borderRadius="lg" _hover={{ bg: PRIMARY_GREEN }}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HrKpiPage;
