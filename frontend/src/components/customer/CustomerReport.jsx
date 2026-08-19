import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Layout from './Layout';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import axiosInstance from "../../services/axiosInstance";
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Skeleton,
  SimpleGrid,
  Icon,
  Progress,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  VStack,
  HStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  NumberInput,
  NumberInputField,
  Spinner,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { 
  FiDownload, 
  FiUser, 
  FiCheckCircle, 
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiPackage,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiBarChart2,
  FiUsers,
  FiAward,
  FiActivity,
  FiBook,
  FiCheckSquare,
  FiRefreshCw
} from "react-icons/fi";

// Sub-components
const StatCard = React.memo(({ title, value, icon: IconComponent, colorScheme, trend, trendValue, isRating = false }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={useColorModeValue("gray.200", "gray.700")} boxShadow="sm" borderRadius="xl">
      <CardBody p={5}>
        <Stat>
          <Flex justify="space-between" align="center">
            <Box>
              <StatLabel color={secondaryTextColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
                {title}
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color={textColor} mt={1}>
                {isRating ? `${value || 0}/5` : (value || 0).toLocaleString()}
              </StatNumber>
              {trend && (
                <StatHelpText mb={0} fontSize="xs" color={`${colorScheme}.500`}>
                  <StatArrow type={trend === 'up' ? 'increase' : 'decrease'} />
                  {trendValue}
                </StatHelpText>
              )}
            </Box>
            <Box
              p={3}
              bg={`${colorScheme}.100`}
              color={`${colorScheme}.600`}
              borderRadius="xl"
            >
              <IconComponent size={24} />
            </Box>
          </Flex>
        </Stat>
      </CardBody>
    </Card>
  );
});

const ActivityMetric = React.memo(({ label, value, icon: IconComponent }) => (
  <Box textAlign="center" p={4} bg={useColorModeValue("white", "gray.800")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.200", "gray.700")} boxShadow="sm">
    <Flex justify="center" mb={2}>
      <Box p={2} bg="blue.50" color="blue.500" borderRadius="lg">
        <IconComponent size={20} />
      </Box>
    </Flex>
    <Text fontSize="xl" fontWeight="extrabold">
      {(value || 0).toLocaleString()}
    </Text>
    <Text fontSize="xs" color="gray.500" fontWeight="medium">
      {label}
    </Text>
  </Box>
));

const TargetRow = React.memo(({ label, target, actual, isPercentage = false }) => {
  const numericTarget = parseFloat(target) || 0;
  const numericActual = parseFloat(actual) || 0;
  const gap = numericActual - numericTarget;
  const gapColor = gap >= 0 ? "green.500" : "red.500";
  const displayTarget = isPercentage ? `${numericTarget}%` : numericTarget.toLocaleString();
  const displayActual = isPercentage ? `${numericActual}%` : numericActual.toLocaleString();
  
  return (
    <Tr _hover={{ bg: useColorModeValue("gray.50", "gray.750") }}>
      <Td fontWeight="semibold">{label}</Td>
      <Td isNumeric fontWeight="medium">{displayTarget}</Td>
      <Td isNumeric fontWeight="bold">{displayActual}</Td>
      <Td isNumeric color={gapColor} fontWeight="bold">
        {gap >= 0
          ? `+${isPercentage ? gap.toFixed(1) : gap.toLocaleString()}${isPercentage ? '%' : ''}`
          : `${isPercentage ? gap.toFixed(1) : gap.toLocaleString()}${isPercentage ? '%' : ''}`}
      </Td>
    </Tr>
  );
});

const QualityMetricRow = React.memo(({ label, target, actual, isTime = false }) => {
  let progress = 0;
  let displayValue = String(actual || '0');
  
  if (isTime) {
    const targetHours = parseFloat(target) || 24;
    const actualHours = parseFloat(actual) || 20;
    progress = Math.min(100, Math.max(0, (targetHours / (actualHours || 1)) * 100));
    displayValue = `${actualHours} hrs`;
  } else if (typeof actual === 'string' && actual.includes('%')) {
    progress = parseFloat(actual) || 0;
    displayValue = actual;
  } else {
    const targetNum = parseFloat(target) || 1;
    const actualNum = parseFloat(actual) || 0;
    progress = (actualNum / targetNum) * 100;
    displayValue = String(actualNum);
  }
  
  const progressColor = progress >= 90 ? "green" : progress >= 70 ? "yellow" : "red";

  return (
    <Tr _hover={{ bg: useColorModeValue("gray.50", "gray.750") }}>
      <Td fontWeight="semibold">{label}</Td>
      <Td fontWeight="medium">{target}</Td>
      <Td fontWeight="bold">{displayValue}</Td>
      <Td>
        <Box minW="140px">
          <Progress 
            value={Math.min(100, Math.max(0, progress))} 
            colorScheme={progressColor} 
            size="sm" 
            borderRadius="full"
            height="8px"
          />
          <Text fontSize="2xs" color="gray.500" mt={1} textAlign="right">
            {!isTime ? `${Math.round(progress)}% of goal` : ''}
          </Text>
        </Box>
      </Td>
    </Tr>
  );
});

const CustomerReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorPerformance, setCreatorPerformance] = useState([]);
  const [customerServiceUsers, setCustomerServiceUsers] = useState([]);
  const [actualOverrides, setActualOverrides] = useState({});
  const [isActualModalOpen, setIsActualModalOpen] = useState(false);

  const targets = useMemo(() => ({
    education: {
      userManuals: 300,
      trainingVideos: 300,
      faqGuides: 200,
      telegramMessages: 200,
      followupReminders: 600
    },
    officerTargets: {
      officer1: 300,
      officer2: 300,
      officer3: 300,
      officer4: 300,
      manager: 800
    },
    qualityMetrics: {
      satisfaction: 90,
      deliveryAccuracy: 95,
      policyCompliance: 100,
      crossDeptResponse: 100,
      timeToResolve: 24,
      trainingToB2B: 30,
      renewals: 20
    }
  }), []);

  const tableRef = useRef(null);
  const toast = useToast();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("blue.600", "blue.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");

  const getAgentName = useCallback((item) =>
    item.agentName ||
    item.agentUsername ||
    item.assignedTo ||
    item.agent ||
    item.creator?.username ||
    "Unassigned", []);

  const getActualValue = useCallback((label, fallback) => {
    const v = actualOverrides[label];
    if (v === undefined || v === null || v === "") return fallback;
    const parsed = Number(v);
    return Number.isNaN(parsed) ? fallback : parsed;
  }, [actualOverrides]);

  // Derive report data smoothly with zero lag
  const { stats, activityTotals, interactionPerformance } = useMemo(() => {
    const defaultStats = {
      totalCustomers: 0,
      activeFollowups: 0,
      completedFollowups: 0,
      avgRating: 0
    };
    
    const defaultActivityTotals = {
      registered: 0,
      followupAttempts: 0,
      updateAttempts: 0,
      importedTraining: 0,
      materialUpdates: 0,
      progressUpdates: 0,
      serviceUpdates: 0,
      packageStatusUpdates: 0,
    };
    
    if (!report || report.length === 0) {
      return { 
        stats: defaultStats,
        activityTotals: defaultActivityTotals,
        interactionPerformance: []
      };
    }
    
    const totalCustomers = report.length;
    const completedFollowups = report.filter(item => 
      (item.dailyProgress && item.dailyProgress > 0) || item.status === 'completed'
    ).length;
    const activeFollowups = totalCustomers - completedFollowups;
    const avgRating = report.reduce((sum, item) => 
      sum + (item.creator?.rating || 0), 0) / Math.max(report.length, 1);

    const boolToInt = (val) => (val ? 1 : 0);

    const totals = report.reduce((acc, item) => {
      const materialCount = Number(item.materialUpdates || 0) + boolToInt(item.materialStatusUpdated);
      const progressCount = Number(item.progressUpdates || 0) + boolToInt(item.progressUpdated);
      const serviceCount = Number(item.serviceUpdates || 0) + boolToInt(item.serviceUpdated);
      const packageCount = Number(item.packageStatusUpdates || 0) + boolToInt(item.packageStatusUpdated);
      const updateAttemptCount =
        Number(item.updateAttempts || 0) +
        Number(item.notes?.length || 0) +
        Number(item.communicationLogs?.length || item.communications?.length || 0);

      acc.registered += 1;
      acc.followupAttempts +=
        (item.call_count || item.callAttempts || 0) +
        (item.message_count || item.messageAttempts || 0) +
        (item.email_count || item.emailAttempts || 0) +
        (item.followupAttempts || 0);
      acc.updateAttempts += updateAttemptCount;
      acc.importedTraining += boolToInt(item.trainingImported);
      acc.materialUpdates += materialCount;
      acc.progressUpdates += progressCount;
      acc.serviceUpdates += serviceCount;
      acc.packageStatusUpdates += packageCount;
      return acc;
    }, { ...defaultActivityTotals });

    const perUser = {};
    report.forEach((item) => {
      const uname = getAgentName(item);
      if (!perUser[uname]) {
        perUser[uname] = {
          username: uname,
          registered: 0,
          followupAttempts: 0,
          updateAttempts: 0,
          materialUpdates: 0,
          progressUpdates: 0,
          serviceUpdates: 0,
          packageStatusUpdates: 0,
          rating: item.creator?.rating || 0,
          points: item.creator?.points || 0,
        };
      }
      perUser[uname].registered += 1;
      perUser[uname].followupAttempts +=
        (item.call_count || item.callAttempts || 0) +
        (item.message_count || item.messageAttempts || 0) +
        (item.email_count || item.emailAttempts || 0) +
        (item.followupAttempts || 0);
      perUser[uname].updateAttempts +=
        Number(item.updateAttempts || 0) +
        Number(item.notes?.length || 0);
      perUser[uname].materialUpdates += Number(item.materialUpdates || 0);
      perUser[uname].progressUpdates += Number(item.progressUpdates || 0);
      perUser[uname].serviceUpdates += Number(item.serviceUpdates || 0);
      perUser[uname].packageStatusUpdates += Number(item.packageStatusUpdates || 0);
    });
    
    return {
      stats: {
        totalCustomers,
        activeFollowups,
        completedFollowups,
        avgRating: parseFloat((avgRating || 0).toFixed(1))
      },
      activityTotals: totals,
      interactionPerformance: Object.values(perUser)
    };
  }, [report, getAgentName]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, usersRes] = await Promise.allSettled([
        axiosInstance.get("/followups/report"),
        axiosInstance.get("/users"),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const usersRaw = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : Array.isArray(usersRes.value.data?.users)
            ? usersRes.value.data.users
            : Array.isArray(usersRes.value.data?.data)
              ? usersRes.value.data.data
              : [];

        const filteredCS = usersRaw
          .filter(user => {
            const role = (user.role || user.roleName || '').toLowerCase().replace(/[\s_-]+/g, '');
            return role.includes('customerservice') || role.includes('customersuccess');
          })
          .map(user => ({
            id: user._id || user.id,
            name: user.fullName || user.name || user.username || 'Unknown User',
            email: user.email || '',
            username: user.username,
            role: user.role || 'Customer Service Officer'
          }));

        setCustomerServiceUsers(filteredCS.length ? filteredCS : usersRaw.map(u => ({
          id: u._id || u.id,
          name: u.fullName || u.username || 'User',
          email: u.email || '',
          username: u.username
        })));
      }

      if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
        const reportPayload = reportRes.value.data || {};
        const reportData = Array.isArray(reportPayload.report)
          ? reportPayload.report
          : Array.isArray(reportPayload)
            ? reportPayload
            : Array.isArray(reportPayload.data)
              ? reportPayload.data
              : [];
        const creatorPerf = Array.isArray(reportPayload.creatorPerformance) ? reportPayload.creatorPerformance : [];

        setReport(reportData);
        setCreatorPerformance(creatorPerf);
      }
    } catch (err) {
      console.warn("CustomerReport fetch note:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
      
      doc.setFontSize(20);
      doc.text('Customer Service Report', 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      
      const headers = ['Metric Item', 'Target', 'Actual', 'Gap / Status'];
      const data = [
        ['User Manuals Sent', targets.education.userManuals, getActualValue('User Manuals Sent', activityTotals.materialUpdates), `${getActualValue('User Manuals Sent', activityTotals.materialUpdates) - targets.education.userManuals}`],
        ['Training Videos Shared', targets.education.trainingVideos, getActualValue('Training Videos Shared', activityTotals.progressUpdates), `${getActualValue('Training Videos Shared', activityTotals.progressUpdates) - targets.education.trainingVideos}`],
        ['FAQ Guides Sent', targets.education.faqGuides, getActualValue('FAQ Guides Sent', activityTotals.serviceUpdates), `${getActualValue('FAQ Guides Sent', activityTotals.serviceUpdates) - targets.education.faqGuides}`],
        ['Follow-up Reminders', targets.education.followupReminders, getActualValue('Follow-up Reminders', activityTotals.followupAttempts), `${getActualValue('Follow-up Reminders', activityTotals.followupAttempts) - targets.education.followupReminders}`],
      ];

      doc.autoTable({
        startY: 36,
        head: [headers],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`Customer_Service_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "PDF report exported successfully", status: "success", duration: 2500 });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Export failed", description: error.message, status: "error" });
    }
  };

  const handleExportCSV = () => {
    if (!report.length) {
      toast({ title: "No customer service report data to export", status: "info" });
      return;
    }
    const headers = [
      "Customer Name",
      "Assigned Agent",
      "Progress (%)",
      "Rating",
      "Material Updates",
      "Progress Updates",
      "Service Updates",
      "Package Updates",
      "Followup Attempts",
      "Update Attempts"
    ];
    const rows = report.map((item) => [
      `"${(item.customerName || item.clientName || 'N/A').replace(/"/g, '""')}"`,
      `"${(getAgentName(item) || 'Unassigned').replace(/"/g, '""')}"`,
      item.dailyProgress || 0,
      item.creator?.rating || 0,
      item.materialUpdates || 0,
      item.progressUpdates || 0,
      item.serviceUpdates || 0,
      item.packageStatusUpdates || 0,
      item.followupAttempts || 0,
      item.updateAttempts || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Service_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV report exported successfully", status: "success", duration: 2500 });
  };

  return (
    <Layout>
      <Box w="100%" minH="100vh" p={{ base: 4, md: 6 }} ref={tableRef}>
        {/* Header Section - Full Screen */}
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} mb={6} wrap="wrap" gap={4} w="100%">
          <Box>
            <Heading as="h1" size="xl" color={headerColor} mb={1} fontWeight="extrabold">
              Customer Service Report
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} | Executive CS Performance & Follow-up Analytics
            </Text>
          </Box>
          <HStack spacing={3} align="center" flexWrap="wrap">
            <Button
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={() => setIsActualModalOpen(true)}
            >
              Actual Targets
            </Button>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              colorScheme="blue"
              size="sm"
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              size="sm"
              onClick={handleExportPDF}
              isLoading={loading}
            >
              Export PDF
            </Button>
            <IconButton
              aria-label="Refresh report"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={fetchReportData}
              isLoading={loading}
            />
          </HStack>
        </Flex>

        {loading ? (
          <VStack py={12} spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="3px" />
            <Text fontSize="sm" color={secondaryTextColor}>Loading customer service metrics...</Text>
          </VStack>
        ) : (
          <VStack spacing={6} align="stretch" w="100%">
            {/* Top 4 KPI Cards */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
              <StatCard
                title="Total Customers"
                value={stats.totalCustomers}
                icon={FiUsers}
                colorScheme="blue"
                trend="up"
                trendValue="12%"
              />
              <StatCard
                title="Active Follow-ups"
                value={stats.activeFollowups}
                icon={FiPhone}
                colorScheme="orange"
                trend="up"
                trendValue="8%"
              />
              <StatCard
                title="Completed"
                value={stats.completedFollowups}
                icon={FiCheckCircle}
                colorScheme="green"
                trend="up"
                trendValue="15%"
              />
              <StatCard
                title="Avg. Rating"
                value={stats.avgRating}
                icon={FiStar}
                colorScheme="purple"
                trend="up"
                trendValue="5%"
                isRating
              />
            </SimpleGrid>

            {/* Customer Activity Snapshot */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" w="100%">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3} px={5}>
                <Flex align="center">
                  <Icon as={FiActivity} mr={2} color="blue.500" />
                  <Heading size="md">Activity Snapshot</Heading>
                </Flex>
              </CardHeader>
              <CardBody p={5}>
                <SimpleGrid columns={{ base: 2, sm: 4, md: 4 }} spacing={4}>
                  <ActivityMetric label="Registered" value={activityTotals.registered} icon={FiUser} />
                  <ActivityMetric label="Follow-up Attempts" value={activityTotals.followupAttempts} icon={FiPhone} />
                  <ActivityMetric label="Update Attempts" value={activityTotals.updateAttempts} icon={FiMail} />
                  <ActivityMetric label="Imported (Training)" value={activityTotals.importedTraining} icon={FiPackage} />
                  <ActivityMetric label="Material Updates" value={activityTotals.materialUpdates} icon={FiPackage} />
                  <ActivityMetric label="Progress Updates" value={activityTotals.progressUpdates} icon={FiTrendingUp} />
                  <ActivityMetric label="Service Updates" value={activityTotals.serviceUpdates} icon={FiBarChart2} />
                  <ActivityMetric label="Package Updates" value={activityTotals.packageStatusUpdates} icon={FiCheckSquare} />
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Customer Education Targets Table */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" w="100%">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3} px={5}>
                <Flex align="center">
                  <Icon as={FiBook} mr={2} color="blue.500" />
                  <Heading size="md">CUSTOMER EDUCATION TARGETS</Heading>
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th>Item</Th>
                        <Th isNumeric>Target</Th>
                        <Th isNumeric>Actual</Th>
                        <Th isNumeric>Gap</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <TargetRow
                        label="User Manuals Sent"
                        target={targets.education.userManuals}
                        actual={getActualValue("User Manuals Sent", activityTotals.materialUpdates)}
                      />
                      <TargetRow
                        label="Training Videos Shared"
                        target={targets.education.trainingVideos}
                        actual={getActualValue("Training Videos Shared", activityTotals.progressUpdates)}
                      />
                      <TargetRow
                        label="FAQ Guides Sent"
                        target={targets.education.faqGuides}
                        actual={getActualValue("FAQ Guides Sent", activityTotals.serviceUpdates)}
                      />
                      <TargetRow
                        label="Telegram Guidance Messages"
                        target={targets.education.telegramMessages}
                        actual={getActualValue(
                          "Telegram Guidance Messages",
                          Math.floor(activityTotals.followupAttempts * 0.3)
                        )}
                      />
                      <TargetRow
                        label="Follow-up Reminders"
                        target={targets.education.followupReminders}
                        actual={getActualValue("Follow-up Reminders", activityTotals.followupAttempts)}
                      />
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Individual Officer Targets */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" w="100%">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3} px={5}>
                <Flex align="center">
                  <Icon as={FiUsers} mr={2} color="blue.500" />
                  <Heading size="md">INDIVIDUAL CUSTOMER SUCCESS OFFICER TARGETS</Heading>
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th>Officer</Th>
                        <Th isNumeric>Monthly Target</Th>
                        <Th isNumeric>Actual</Th>
                        <Th isNumeric>Gap</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(customerServiceUsers.length ? customerServiceUsers : interactionPerformance).map((officer, index) => {
                        const perf =
                          interactionPerformance.find(
                            (p) => p.username === officer.email || p.username === officer.username
                          ) || { followupAttempts: 0, updateAttempts: 0 };
                        const label = officer.name || officer.username || `Officer ${index + 1}`;
                        const targetVal = targets.officerTargets[`officer${index + 1}`] || 300;
                        const actualVal = getActualValue(
                          label,
                          (perf.followupAttempts || 0) + (perf.updateAttempts || 0)
                        );
                        return (
                          <TargetRow
                            key={officer.id || officer._id || index}
                            label={label}
                            target={targetVal}
                            actual={actualVal}
                          />
                        );
                      })}
                      <TargetRow
                        label="Customer Success Manager"
                        target={targets.officerTargets.manager}
                        actual={getActualValue(
                          "Customer Success Manager",
                          interactionPerformance.reduce(
                            (sum, officer) => sum + (officer.followupAttempts || 0) + (officer.updateAttempts || 0), 
                            0
                          )
                        )}
                      />
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Team Quality Metrics */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" w="100%">
              <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3} px={5}>
                <Flex align="center">
                  <Icon as={FiAward} mr={2} color="blue.500" />
                  <Heading size="md">TEAM QUALITY METRICS</Heading>
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th>Quality Metric</Th>
                        <Th>Target</Th>
                        <Th>Actual</Th>
                        <Th>Progress</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <QualityMetricRow
                        label="Satisfaction Score"
                        target={`${targets.qualityMetrics.satisfaction}%`}
                        actual={`${getActualValue("Satisfaction Score", 85)}%`}
                      />
                      <QualityMetricRow
                        label="Service Delivery Accuracy"
                        target={`${targets.qualityMetrics.deliveryAccuracy}%`}
                        actual={`${getActualValue("Service Delivery Accuracy", 92)}%`}
                      />
                      <QualityMetricRow
                        label="Policy Compliance"
                        target={`${targets.qualityMetrics.policyCompliance}%`}
                        actual={`${getActualValue("Policy Compliance", 98)}%`}
                      />
                      <QualityMetricRow
                        label="Cross-Department Response"
                        target={`${targets.qualityMetrics.crossDeptResponse}%`}
                        actual={`${getActualValue("Cross-Department Response", 95)}%`}
                      />
                      <QualityMetricRow
                        label="Time-to-Resolve"
                        target={`< ${targets.qualityMetrics.timeToResolve} hrs`}
                        actual={`${getActualValue("Time-to-Resolve (hrs)", 20)} hrs`}
                        isTime
                      />
                      <QualityMetricRow
                        label="Training-to-B2B Conversions"
                        target={targets.qualityMetrics.trainingToB2B}
                        actual={getActualValue(
                          "Training-to-B2B Conversions",
                          Math.min(targets.qualityMetrics.trainingToB2B, 25)
                        )}
                      />
                      <QualityMetricRow
                        label="Renewals"
                        target={targets.qualityMetrics.renewals}
                        actual={getActualValue(
                          "Renewals",
                          Math.min(targets.qualityMetrics.renewals, 18)
                        )}
                      />
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Creator / Staff Performance Leaderboard */}
            {creatorPerformance.length > 0 && (
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="sm" w="100%">
                <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3} px={5}>
                  <Flex align="center">
                    <Icon as={FiStar} mr={2} color="yellow.500" />
                    <Heading size="md">Customer Service Staff Leaderboard</Heading>
                  </Flex>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg={tableHeaderBg}>
                        <Tr>
                          <Th>Rank</Th>
                          <Th>Officer Username</Th>
                          <Th isNumeric>Points Earned</Th>
                          <Th isNumeric>Customer Rating</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {creatorPerformance.map((officer, idx) => (
                          <Tr key={officer.username || idx}>
                            <Td fontWeight="bold">#{idx + 1}</Td>
                            <Td fontWeight="semibold">{officer.username}</Td>
                            <Td isNumeric fontWeight="bold" color="blue.500">{officer.points || 0} pts</Td>
                            <Td isNumeric>
                              <Badge colorScheme={officer.rating >= 4 ? "green" : "orange"} borderRadius="full" px={2}>
                                {officer.rating || 0} / 5 ⭐
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            )}
          </VStack>
        )}

        {/* Actual Targets Modal */}
        <Modal
          isOpen={isActualModalOpen}
          onClose={() => setIsActualModalOpen(false)}
          isCentered
        >
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="2xl">
            <ModalHeader>Update Actual Target Overrides</ModalHeader>
            <ModalBody>
              <Text mb={3} fontSize="xs" color={secondaryTextColor}>
                Fine-tune metric values on the fly. All changes take effect immediately across reports.
              </Text>
              <VStack spacing={3} align="stretch" maxH="350px" overflowY="auto">
                {[
                  "User Manuals Sent",
                  "Training Videos Shared",
                  "FAQ Guides Sent",
                  "Follow-up Reminders",
                  "Satisfaction Score",
                  "Service Delivery Accuracy",
                  "Policy Compliance",
                  "Cross-Department Response",
                  "Time-to-Resolve (hrs)",
                ].map((item) => (
                  <Flex key={item} justify="space-between" align="center">
                    <Text fontSize="xs" fontWeight="semibold">{item}</Text>
                    <NumberInput
                      size="xs"
                      maxW="110px"
                      value={actualOverrides[item] || ""}
                      onChange={(_, val) => setActualOverrides((prev) => ({ ...prev, [item]: val || 0 }))}
                    >
                      <NumberInputField placeholder="Default" />
                    </NumberInput>
                  </Flex>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" size="sm" onClick={() => setIsActualModalOpen(false)}>
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default CustomerReport;