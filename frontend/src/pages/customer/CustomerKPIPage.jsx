import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
  Flex,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  SimpleGrid,
  Button,
  Select as ChakraSelect,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Stack,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useToast,
} from "@chakra-ui/react";
import {
  FiRefreshCw,
  FiSearch,
  FiAward,
  FiCheckCircle,
  FiArchive,
  FiTrendingUp,
  FiUserCheck,
  FiCalendar,
} from "react-icons/fi";
import {
  getCustomerServiceUsers,
  getCustomerServiceWorkItems,
  clearKPICache,
} from "../../services/customerKPIService";
import Layout from "../../components/customer/Layout";

// Helper to get ISO week number
const getISOWeek = (dateObj) => {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return normalizeId(value._id || value.id || value.userId || value.agentId);
  return value.toString().trim().toLowerCase();
};

const getWorkOwnerId = (item = {}) =>
  normalizeId(
    item.agentId ||
      item.assignedTo ||
      item.assignedToId ||
      item.userId ||
      item.createdBy ||
      item.ownerId ||
      item.salesAgent?._id ||
      item.agent?._id
  );

const getWorkDateMs = (item = {}) => {
  const dateValue =
    item.completedAt ||
    item.updatedAt ||
    item.registrationDate ||
    item.dueDate ||
    item.nextFollowupDate ||
    item.followupDate ||
    item.createdAt;
  if (!dateValue) return null;
  const time = new Date(dateValue).getTime();
  return Number.isNaN(time) ? null : time;
};

const getPeriodRangeMs = (type, value) => {
  if (type === "week") {
    const [yearText, weekText] = String(value || "").split("-W");
    const year = Number(yearText);
    const week = Number(weekText);
    if (!year || !week) return null;
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const day = simple.getUTCDay();
    const monday = new Date(simple);
    monday.setUTCDate(simple.getUTCDate() - ((day + 6) % 7));
    const startMs = monday.getTime();
    const endMs = startMs + 7 * 86400000;
    return { startMs, endMs };
  }

  if (type === "year") {
    const year = Number(value);
    if (!year) return null;
    return {
      startMs: new Date(Date.UTC(year, 0, 1)).getTime(),
      endMs: new Date(Date.UTC(year + 1, 0, 1)).getTime(),
    };
  }

  const [yearText, monthText] = String(value || "").split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return null;
  return {
    startMs: new Date(Date.UTC(year, month - 1, 1)).getTime(),
    endMs: new Date(Date.UTC(year, month, 1)).getTime(),
  };
};

const isCompletedWork = (item = {}) => {
  if (item.kpiSource === "buyer") return true;
  const status = String(item.status || item.followupStatus || item.progress || item.workflowStatus || "")
    .trim()
    .toLowerCase();
  return ["completed", "complete", "done", "closed", "delivered", "approved"].includes(status);
};

const getInteractionCount = (item = {}) => {
  const numeric =
    Number(item.calls || 0) +
    Number(item.callCount || 0) +
    Number(item.messages || 0) +
    Number(item.messageCount || 0) +
    Number(item.emails || 0) +
    Number(item.emailCount || 0);
  const notes =
    (Array.isArray(item.notes) ? item.notes.length : item.note ? 1 : 0) +
    (Array.isArray(item.messages) ? item.messages.length : 0) +
    (Array.isArray(item.activities) ? item.activities.length : 0);
  return numeric + notes;
};

// Fast pre-indexing of work items by agent ID
const preindexWorkItems = (workItems = []) => {
  const map = new Map();

  for (let i = 0; i < workItems.length; i++) {
    const item = workItems[i];
    const ownerId = getWorkOwnerId(item);
    if (!ownerId) continue;

    const timeMs = getWorkDateMs(item);
    const isCompleted = isCompletedWork(item);
    const dueDateMs = item.dueDate ? new Date(item.dueDate).getTime() : null;
    const interactions = getInteractionCount(item);
    const kpiPoint = Number(item.kpiPoint) || (item.kpiSource === "buyer" ? 1 : 0);

    const processed = {
      timeMs,
      isCompleted,
      dueDateMs: Number.isNaN(dueDateMs) ? null : dueDateMs,
      interactions,
      kpiPoint,
    };

    let list = map.get(ownerId);
    if (!list) {
      list = [];
      map.set(ownerId, list);
    }
    list.push(processed);
  }

  return map;
};

const calcScore = (row) => {
  const target = Number(row.target) || 0;
  const achieved = Number(row.achieved) || 0;
  const coreOutput = Number(row.coreOutput) || 0;
  const points = Number(row.points) || 0;
  const absents = Number(row.absents) || 0;
  const achievementPct = target > 0 ? (achieved / target) * 100 : 0;
  const coreOutputPct = Math.max(0, Math.min(100, coreOutput));
  const pointScore = Math.min(100, points * 10);
  const weightedScore = achievementPct * 0.45 + coreOutputPct * 0.45 + pointScore * 0.1;
  const attendancePenalty = absents * 1;
  const final = Math.max(0, Math.min(100, weightedScore - attendancePenalty));
  return { achievementPct, coreOutputPct, pointScore, attendancePenalty, final };
};

const getScoreBand = (score) => {
  if (score >= 90) return { label: "Excellent", color: "green", guidance: "Consistently exceeding the expected service standard." };
  if (score >= 75) return { label: "Strong", color: "teal", guidance: "Healthy performance with room for targeted improvement." };
  if (score >= 60) return { label: "Watch", color: "orange", guidance: "Requires closer follow-up on completion, output, or overdue work." };
  return { label: "At Risk", color: "red", guidance: "Needs immediate support and performance review." };
};

const normalizeRole = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const storageKey = "csm-kpi-scores-v1";
const periodKey = (type, value) => `${type}:${value}`;

const getDefaultPeriodValue = (type) => {
  const now = new Date();
  if (type === "week") {
    const week = getISOWeek(now);
    return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  if (type === "year") {
    return `${now.getFullYear()}`;
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const loadSavedList = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Object.entries(parsed)
      .map(([key, value]) => {
        const [type, val] = key.split(":");
        const savedAt = value.savedAt || null;
        const rows = value.rows || value;
        return { key, type, value: val, savedAt, rows };
      })
      .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
  } catch (e) {
    console.warn("loadSavedList failed", e);
    return [];
  }
};

const CustomerKPIPage = () => {
  const [rawUsers, setRawUsers] = useState([]);
  const [rawWorkItems, setRawWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workLoading, setWorkLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [periodType, setPeriodType] = useState("month");
  const [periodValue, setPeriodValue] = useState(() => getDefaultPeriodValue("month"));
  const [searchQuery, setSearchQuery] = useState("");

  const toast = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [savedItems, setSavedItems] = useState(() => loadSavedList());
  const [previewItem, setPreviewItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const cancelRef = useRef();

  // Load initial data
  const fetchData = useCallback(async (force = false) => {
    try {
      if (force) {
        clearKPICache();
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const users = await getCustomerServiceUsers(force);
      setRawUsers(users);
      setError(null);
      setLoading(false);
      setWorkLoading(true);

      const workItems = await getCustomerServiceWorkItems(force);
      setRawWorkItems(workItems);
    } catch (err) {
      console.error("Error loading KPI data", err);
      setError("Failed to load customer service users. Showing fallback data if available.");
    } finally {
      setLoading(false);
      setWorkLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Pre-index work items by agent ID whenever raw items change
  const indexedWork = useMemo(() => preindexWorkItems(rawWorkItems), [rawWorkItems]);

  // Calculate period boundaries
  const periodRange = useMemo(() => getPeriodRangeMs(periodType, periodValue), [periodType, periodValue]);

  // Fast metric calculation for all customer service agents
  const rankedAgents = useMemo(() => {
    const csUsers = rawUsers.filter((u) => {
      const r = normalizeRole(u.role || u.userRole || "customerservice");
      return r === "customerservice";
    });

    const nowMs = Date.now();
    const range = periodRange;
    const workloadTarget = { week: 5, month: 20, year: 240 }[periodType] || 20;

    const list = csUsers.map((user) => {
      const agentId = normalizeId(user._id || user.id);
      const items = indexedWork.get(agentId) || [];

      let assigned = 0;
      let achieved = 0;
      let overdueCount = 0;
      let interactions = 0;
      let points = 0;

      if (range) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.timeMs !== null && item.timeMs >= range.startMs && item.timeMs < range.endMs) {
            assigned++;
            if (item.isCompleted) {
              achieved++;
            } else if (item.dueDateMs && item.dueDateMs < nowMs) {
              overdueCount++;
            }
            interactions += item.interactions;
            points += item.kpiPoint;
          }
        }
      }

      const target = Math.max(workloadTarget, assigned);
      const completionRate = assigned > 0 ? (achieved / target) * 100 : 0;
      const activityRate = assigned > 0 ? Math.min(100, (interactions / Math.max(assigned, 1)) * 20) : 0;
      const timelinessRate = assigned > 0 ? Math.max(0, 100 - (overdueCount / Math.max(assigned, 1)) * 100) : 100;
      const coreOutput = Math.max(0, Math.min(100, completionRate * 0.55 + activityRate * 0.25 + timelinessRate * 0.2));

      const row = {
        id: user._id || user.id,
        name: user.fullName || user.username || "Customer Service",
        role: user.role || user.userRole || "customerservice",
        target,
        achieved,
        coreOutput: Number(coreOutput.toFixed(1)),
        absents: 0,
        assigned,
        active: Math.max(assigned - achieved, 0),
        overdue: overdueCount,
        interactions,
        points,
      };

      const score = calcScore(row);
      const band = getScoreBand(score.final);

      return {
        ...row,
        ...score,
        band,
        workScore: score.final,
      };
    });

    return list.sort(
      (a, b) => b.workScore - a.workScore || b.points - a.points || b.achieved - a.achieved || b.coreOutput - a.coreOutput
    );
  }, [rawUsers, indexedWork, periodRange, periodType]);

  // Filtered agents by search box
  const filteredRankedAgents = useMemo(() => {
    if (!searchQuery.trim()) return rankedAgents;
    const q = searchQuery.toLowerCase().trim();
    return rankedAgents.filter((a) => a.name.toLowerCase().includes(q));
  }, [rankedAgents, searchQuery]);

  // High-level summary metrics
  const summary = useMemo(() => {
    const reps = rankedAgents.length;
    if (reps === 0) {
      return {
        target: 0,
        achieved: 0,
        coreOutput: 0,
        score: 0,
        reps: 0,
        averageScore: 0,
        achievementRate: 0,
        averageCoreOutput: 0,
        totalActive: 0,
        totalOverdue: 0,
        totalPoints: 0,
        timelinessHealth: 100,
      };
    }

    let target = 0;
    let achieved = 0;
    let coreOutput = 0;
    let totalScore = 0;
    let totalActive = 0;
    let totalOverdue = 0;
    let totalPoints = 0;

    for (let i = 0; i < reps; i++) {
      const a = rankedAgents[i];
      target += a.target;
      achieved += a.achieved;
      coreOutput += a.coreOutput;
      totalScore += a.final;
      totalActive += a.active;
      totalOverdue += a.overdue;
      totalPoints += a.points;
    }

    const averageScore = totalScore / reps;
    const achievementRate = target > 0 ? Math.min(100, (achieved / target) * 100) : 0;
    const averageCoreOutput = coreOutput / reps;
    const timelinessHealth = target > 0 ? Math.max(0, 100 - (totalOverdue / Math.max(target, 1)) * 100) : 100;

    return {
      target,
      achieved,
      coreOutput,
      reps,
      averageScore,
      achievementRate,
      averageCoreOutput,
      totalActive,
      totalOverdue,
      totalPoints,
      timelinessHealth,
    };
  }, [rankedAgents]);

  const selectedAgent = useMemo(
    () => rankedAgents.find((row) => row.id === selectedAgentId) || null,
    [rankedAgents, selectedAgentId]
  );

  const topPerformer = rankedAgents[0] || null;
  const strongPerformers = useMemo(() => rankedAgents.filter((row) => row.final >= 75).length, [rankedAgents]);
  const needsAttention = useMemo(() => rankedAgents.filter((row) => row.final < 60).length, [rankedAgents]);

  const periodLabel = { week: "Weekly", month: "Monthly", year: "Yearly" }[periodType] || "Monthly";

  const saveCurrent = () => {
    const payload = rankedAgents.reduce((acc, row) => {
      acc[row.id] = {
        target: row.target,
        achieved: row.achieved,
        coreOutput: row.coreOutput,
        absents: row.absents,
        assigned: row.assigned,
        active: row.active,
        overdue: row.overdue,
        interactions: row.interactions,
        points: row.points,
      };
      return acc;
    }, {});

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[periodKey(periodType, periodValue)] = {
        rows: payload,
        savedAt: new Date().toISOString(),
        periodType,
        periodValue,
      };
      localStorage.setItem(storageKey, JSON.stringify(parsed));
      setSavedItems(loadSavedList());
      toast({
        title: "KPI snapshot saved",
        description: `Saved ${Object.keys(payload).length} rep snapshots for ${periodType} ${periodValue}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      console.warn("saveCurrent failed", e);
      toast({
        title: "Save failed",
        description: "Unable to save KPI data locally.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" minH="60vh" direction="column" gap={4}>
          <Spinner size="xl" color="teal.500" thickness="4px" />
          <Text color="gray.500" fontSize="sm">
            Loading Customer Service KPI Scorecard...
          </Text>
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={{ base: 4, md: 5, xl: 6 }} w="100%" maxW="none" mx="0">
        {/* Header Hero Card */}
        <Card
          mb={5}
          borderRadius="2xl"
          border="1px solid"
          borderColor="blue.100"
          bg="linear-gradient(135deg, #f8fbff 0%, #eefaf7 100%)"
          boxShadow="sm"
        >
          <CardBody p={{ base: 4, md: 6 }}>
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} flexWrap="wrap">
              <Box>
                <HStack spacing={2} mb={2}>
                  <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full">
                    Performance Command
                  </Badge>
                  {workLoading && (
                    <Badge colorScheme="blue" variant="subtle">
                      <HStack spacing={1}>
                        <Spinner size="xs" />
                        <Text>Syncing Work Items...</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                <Heading size="lg" mb={1} color="gray.800">
                  Customer Service KPI Scorecard
                </Heading>
                <Text color="gray.600" fontSize="sm" maxW="720px">
                  High-speed automated performance metrics for Customer Service representatives with zero manual scoring.
                </Text>
              </Box>

              <HStack spacing={4} align="center">
                <Box textAlign={{ base: "left", md: "right" }} minW="180px">
                  <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                    {periodLabel} Team Avg Score
                  </Text>
                  <Text fontWeight="800" fontSize="3xl" color="gray.800" lineHeight="1.1">
                    {summary.averageScore.toFixed(1)}%
                  </Text>
                  <Badge colorScheme={getScoreBand(summary.averageScore).color} mt={1}>
                    {getScoreBand(summary.averageScore).label}
                  </Badge>
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Icon as={FiRefreshCw} />}
                  isLoading={refreshing}
                  onClick={() => fetchData(true)}
                  title="Clear cache and reload live metrics"
                >
                  Refresh
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Global Period Controls */}
        <Card mb={5} borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
          <CardBody py={3} px={4}>
            <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
              <HStack spacing={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Icon as={FiCalendar} color="teal.500" />
                  <Text fontSize="sm" fontWeight="700">
                    Period:
                  </Text>
                </HStack>
                <ChakraSelect
                  value={periodType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPeriodType(next);
                    setPeriodValue(getDefaultPeriodValue(next));
                  }}
                  size="sm"
                  w="120px"
                  borderRadius="md"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </ChakraSelect>

                {periodType === "month" ? (
                  <input
                    type="month"
                    value={periodValue}
                    onChange={(e) => setPeriodValue(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E0",
                      fontSize: "14px",
                    }}
                  />
                ) : periodType === "week" ? (
                  <input
                    type="week"
                    value={periodValue}
                    onChange={(e) => setPeriodValue(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E0",
                      fontSize: "14px",
                    }}
                  />
                ) : (
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={periodValue}
                    onChange={(e) => setPeriodValue(e.target.value)}
                    style={{
                      width: "90px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E0",
                      fontSize: "14px",
                    }}
                  />
                )}
              </HStack>

              <HStack spacing={2}>
                <Button colorScheme="teal" size="sm" onClick={() => setIsConfirmOpen(true)}>
                  Save Snapshot
                </Button>
                <Button size="sm" variant="outline" leftIcon={<Icon as={FiArchive} />} onClick={() => setIsDrawerOpen(true)}>
                  Snapshots ({savedItems.length})
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {error && (
          <Alert status="error" mb={4} borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Top Performer Quick Badges */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mb={5}>
          <Card borderRadius="xl" border="1px solid" borderColor="green.200" bg="green.50" boxShadow="xs">
            <CardBody py={3} px={4}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="green.700" fontWeight="bold" textTransform="uppercase">
                    Top Performer
                  </Text>
                  <Heading size="sm" mt={0.5} color="green.900">
                    {topPerformer?.name || "No data yet"}
                  </Heading>
                  <Text fontSize="xs" color="green.700">
                    {topPerformer ? `${topPerformer.workScore.toFixed(1)}% score • ${topPerformer.points || 0} pts` : "No activity"}
                  </Text>
                </Box>
                <Icon as={FiAward} boxSize={8} color="green.500" />
              </HStack>
            </CardBody>
          </Card>

          <Card borderRadius="xl" border="1px solid" borderColor="teal.200" bg="teal.50" boxShadow="xs">
            <CardBody py={3} px={4}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="teal.700" fontWeight="bold" textTransform="uppercase">
                    Strong Performers
                  </Text>
                  <Heading size="sm" mt={0.5} color="teal.900">
                    {strongPerformers} of {summary.reps} Reps
                  </Heading>
                  <Text fontSize="xs" color="teal.700">
                    Score &ge; 75% standard
                  </Text>
                </Box>
                <Icon as={FiCheckCircle} boxSize={8} color="teal.500" />
              </HStack>
            </CardBody>
          </Card>

          <Card
            borderRadius="xl"
            border="1px solid"
            borderColor={needsAttention ? "orange.200" : "blue.200"}
            bg={needsAttention ? "orange.50" : "blue.50"}
            boxShadow="xs"
          >
            <CardBody py={3} px={4}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color={needsAttention ? "orange.800" : "blue.800"} fontWeight="bold" textTransform="uppercase">
                    Coaching Watch
                  </Text>
                  <Heading size="sm" mt={0.5} color={needsAttention ? "orange.900" : "blue.900"}>
                    {needsAttention} Reps
                  </Heading>
                  <Text fontSize="xs" color={needsAttention ? "orange.700" : "blue.700"}>
                    {needsAttention > 0 ? "Score < 60% review needed" : "All reps on track"}
                  </Text>
                </Box>
                <Icon as={FiTrendingUp} boxSize={8} color={needsAttention ? "orange.500" : "blue.500"} />
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabbed Navigation to eliminate lag & organize views */}
        <Tabs variant="enclosed" colorScheme="teal" isLazy>
          <TabList mb={4}>
            <Tab fontWeight="700">
              <HStack spacing={2}>
                <Icon as={FiUserCheck} />
                <Text>Scorecard & Ranking ({filteredRankedAgents.length})</Text>
              </HStack>
            </Tab>
            <Tab fontWeight="700">
              <HStack spacing={2}>
                <Icon as={FiTrendingUp} />
                <Text>Team Metrics & Model</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Leaderboard Table & Quick Search */}
            <TabPanel p={0}>
              <Card borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
                <CardHeader pb={2}>
                  <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
                    <Box>
                      <Heading size="md">Automated Performance Rankings</Heading>
                      <Text color="gray.500" fontSize="xs">
                        Scores calculate automatically from customer follow-ups, training work, sales, and buyer creation.
                      </Text>
                    </Box>
                    <InputGroup maxW={{ base: "100%", md: "280px" }} size="sm">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search representative..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        borderRadius="md"
                      />
                    </InputGroup>
                  </Flex>
                </CardHeader>
                <CardBody pt={2}>
                  {filteredRankedAgents.length === 0 ? (
                    <Box py={8} textAlign="center" color="gray.500">
                      No representatives found matching your criteria.
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Rank</Th>
                            <Th>Customer Service Rep</Th>
                            <Th isNumeric>Assigned</Th>
                            <Th isNumeric>Completed</Th>
                            <Th isNumeric>Active</Th>
                            <Th isNumeric>Overdue</Th>
                            <Th isNumeric>Interactions</Th>
                            <Th isNumeric>Points</Th>
                            <Th isNumeric>Core Output</Th>
                            <Th isNumeric>Work Score</Th>
                            <Th>Band</Th>
                            <Th textAlign="center">Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredRankedAgents.map((row, index) => {
                            const { achievementPct, coreOutputPct, pointScore, workScore, band } = row;
                            return (
                              <Tr key={row.id} _hover={{ bg: "gray.50" }}>
                                <Td fontWeight="bold">#{index + 1}</Td>
                                <Td fontWeight="600">{row.name}</Td>
                                <Td isNumeric>
                                  <Badge colorScheme="blue" variant="subtle">
                                    {row.assigned}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Badge colorScheme="green" variant="subtle">
                                    {row.achieved}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Badge colorScheme={row.active > 0 ? "orange" : "gray"} variant="subtle">
                                    {row.active}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Badge colorScheme={row.overdue > 0 ? "red" : "green"} variant="subtle">
                                    {row.overdue}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Badge colorScheme="purple" variant="subtle">
                                    {row.interactions}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Badge colorScheme="teal" variant="subtle">
                                    {row.points || 0}
                                  </Badge>
                                </Td>
                                <Td isNumeric fontWeight="600">
                                  {row.coreOutput.toFixed(1)}%
                                </Td>
                                <Td isNumeric>
                                  <Tooltip
                                    label={`Achievement: ${achievementPct.toFixed(1)}% | Output: ${coreOutputPct.toFixed(
                                      1
                                    )}% | Points: ${pointScore.toFixed(1)}%`}
                                  >
                                    <Badge
                                      colorScheme={
                                        workScore >= 90
                                          ? "green"
                                          : workScore >= 75
                                          ? "teal"
                                          : workScore >= 60
                                          ? "orange"
                                          : "red"
                                      }
                                      px={2}
                                      py={0.5}
                                      borderRadius="md"
                                      fontSize="xs"
                                    >
                                      {workScore.toFixed(1)}%
                                    </Badge>
                                  </Tooltip>
                                </Td>
                                <Td>
                                  <Badge colorScheme={band.color} variant="subtle">
                                    {band.label}
                                  </Badge>
                                </Td>
                                <Td textAlign="center">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="teal"
                                    onClick={() => setSelectedAgentId(row.id)}
                                  >
                                    View Detail
                                  </Button>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Tab 2: Framework Models & Deep Insights */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} mb={5}>
                {[
                  ["Target", summary.target, "Planned workload", "blue"],
                  ["Achieved", summary.achieved, `${summary.achievementRate.toFixed(1)}% of target`, "green"],
                  ["Core Output", summary.coreOutput.toFixed(1), `${summary.averageCoreOutput.toFixed(1)}% avg per rep`, "purple"],
                  ["Active Work", summary.totalActive, `${summary.totalOverdue} overdue`, "orange"],
                  ["KPI Points", summary.totalPoints, "Buyer creation & records", "teal"],
                ].map(([label, value, help, color]) => (
                  <Card key={label} borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="xs">
                    <CardBody p={4}>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                        {periodLabel} {label}
                      </Text>
                      <Text fontSize="2xl" fontWeight="800" color="gray.800" my={1}>
                        {value}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {help}
                      </Text>
                      <Progress
                        mt={3}
                        value={
                          label === "Active Work"
                            ? summary.timelinessHealth
                            : label === "Achieved"
                            ? summary.achievementRate
                            : Math.min(100, Number(value) || 0)
                        }
                        colorScheme={color}
                        borderRadius="full"
                        size="xs"
                      />
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              <Card mb={5} borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
                <CardHeader pb={2}>
                  <Heading size="md">KPI Framework & Weight Distribution</Heading>
                  <Text color="gray.500" fontSize="xs">
                    Score = 45% completion achievement + 45% core output + 10% KPI points.
                  </Text>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                    {[
                      [
                        "Target Achievement",
                        "45%",
                        "Measures completed work against planned service goals.",
                        summary.achievementRate,
                        "blue",
                      ],
                      [
                        "Core Output Quality",
                        "45%",
                        "Measures completion, interaction activity, and timeliness.",
                        summary.averageCoreOutput,
                        "purple",
                      ],
                      [
                        "Buyer & Work Points",
                        "10%",
                        "Credits employee points when they add new buyers or earn work points.",
                        Math.min(100, summary.totalPoints * 10),
                        "teal",
                      ],
                      [
                        "Timeliness Control",
                        "Auto",
                        "Tracks active and overdue workload without manual scoring.",
                        summary.timelinessHealth,
                        "orange",
                      ],
                    ].map(([title, weight, detail, value, color]) => (
                      <Box key={title} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontWeight="bold" fontSize="sm">
                            {title}
                          </Text>
                          <Badge colorScheme={color}>{weight}</Badge>
                        </Flex>
                        <Text fontSize="xs" color="gray.600" minH="36px">
                          {detail}
                        </Text>
                        <Progress mt={3} value={Math.min(100, Number(value) || 0)} colorScheme={color} borderRadius="full" size="sm" />
                      </Box>
                    ))}
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Selected Rep Detail Drawer */}
        {selectedAgent && (
          <Drawer isOpen={!!selectedAgent} placement="right" onClose={() => setSelectedAgentId(null)} size="md">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>KPI Detail — {selectedAgent.name}</DrawerHeader>
              <DrawerBody>
                <Stack spacing={4}>
                  <Card borderRadius="lg" border="1px solid" borderColor="gray.200" bg="gray.50">
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Box>
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                            Selected Period
                          </Text>
                          <Heading size="sm">
                            {periodLabel} ({periodValue})
                          </Heading>
                        </Box>
                        <Badge colorScheme={selectedAgent.band.color} fontSize="sm" px={2} py={1} borderRadius="md">
                          {selectedAgent.band.label}
                        </Badge>
                      </Flex>
                      <Progress value={selectedAgent.final} colorScheme={selectedAgent.band.color} borderRadius="full" size="md" />
                      <Text mt={2} fontSize="xs" color="gray.600">
                        {selectedAgent.band.guidance}
                      </Text>
                    </CardBody>
                  </Card>

                  {[
                    [
                      "Completion Achievement",
                      selectedAgent.achievementPct,
                      `${selectedAgent.achieved} completed from ${selectedAgent.assigned} assigned items`,
                      "blue",
                    ],
                    [
                      "Core Output Quality",
                      selectedAgent.coreOutputPct,
                      `${selectedAgent.coreOutput}% output score from activity & timeliness`,
                      "purple",
                    ],
                    [
                      "Workload Health",
                      100 - Math.min(100, (selectedAgent.overdue / Math.max(selectedAgent.assigned, 1)) * 100),
                      `${selectedAgent.active} active, ${selectedAgent.overdue} overdue, ${selectedAgent.interactions} interactions`,
                      "orange",
                    ],
                    [
                      "KPI Points",
                      Math.min(100, (selectedAgent.points || 0) * 10),
                      `${selectedAgent.points || 0} pts earned in this period`,
                      "teal",
                    ],
                    [
                      "Final Overall Score",
                      selectedAgent.final,
                      "Weighted composite score (45% + 45% + 10%)",
                      selectedAgent.band.color,
                    ],
                  ].map(([label, value, help, color]) => (
                    <Box key={label} p={3} border="1px solid" borderColor="gray.200" borderRadius="lg">
                      <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="bold" fontSize="sm">
                          {label}
                        </Text>
                        <Text fontWeight="bold" fontSize="sm">
                          {Number(value).toFixed(1)}%
                        </Text>
                      </Flex>
                      <Progress value={Number(value)} colorScheme={color} borderRadius="full" size="xs" />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {help}
                      </Text>
                    </Box>
                  ))}

                  <Alert
                    status={selectedAgent.final >= 75 ? "success" : selectedAgent.final >= 60 ? "warning" : "error"}
                    borderRadius="lg"
                  >
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">
                        Management Guidance
                      </Text>
                      <Text fontSize="xs">
                        {selectedAgent.final >= 75
                          ? "Performance is on track. Maintain high customer satisfaction and followup consistency."
                          : selectedAgent.final >= 60
                          ? "Performance needs targeted coaching. Review overdue items and customer contact frequency."
                          : "Performance requires immediate review. Schedule a support check-in on active workload."}
                      </Text>
                    </Box>
                  </Alert>
                </Stack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}

        {/* Saved Snapshots Drawer */}
        <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => setIsDrawerOpen(false)} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Saved KPI Snapshots</DrawerHeader>
            <DrawerBody>
              <Stack spacing={3}>
                <HStack spacing={2} align="center">
                  <ChakraSelect size="sm" width="130px" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="month">Monthly</option>
                    <option value="week">Weekly</option>
                    <option value="year">Yearly</option>
                  </ChakraSelect>
                  <Input
                    size="sm"
                    placeholder="Search period..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </HStack>

                {savedItems.length === 0 ? (
                  <Text color="gray.500" fontSize="sm" mt={4}>
                    No saved KPI snapshots yet.
                  </Text>
                ) : (
                  <Stack spacing={2} maxH="70vh" overflowY="auto" pr={1}>
                    {savedItems
                      .filter((item) => (filterType === "all" ? true : item.type === filterType))
                      .filter((item) => item.value.toLowerCase().includes(filterText.toLowerCase()))
                      .map((item) => (
                        <Card
                          key={item.key}
                          variant="outline"
                          borderColor="gray.200"
                          _hover={{ borderColor: "teal.400", boxShadow: "xs" }}
                        >
                          <CardBody p={3}>
                            <Flex justify="space-between" align="center" mb={1}>
                              <HStack spacing={2}>
                                <Badge colorScheme="teal" textTransform="capitalize">
                                  {item.type}
                                </Badge>
                                <Text fontWeight="bold" fontSize="sm">
                                  {item.value}
                                </Text>
                              </HStack>
                              <Text fontSize="2xs" color="gray.500">
                                {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : ""}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" align="center" mt={2}>
                              <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                {Object.keys(item.rows || {}).length} reps
                              </Badge>
                              <Button
                                size="xs"
                                variant="outline"
                                colorScheme="teal"
                                onClick={() => {
                                  setPreviewItem(item);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                View Snapshot
                              </Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                  </Stack>
                )}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Snapshot Preview Modal Drawer */}
        {previewItem && (
          <Drawer isOpen={isPreviewOpen} placement="left" onClose={() => setIsPreviewOpen(false)} size="xl">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                Saved Snapshot — {previewItem.type} {previewItem.value}
              </DrawerHeader>
              <DrawerBody>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Saved on {previewItem.savedAt ? new Date(previewItem.savedAt).toLocaleString() : "Unknown"}
                </Text>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Customer Service Rep</Th>
                        <Th isNumeric>Assigned</Th>
                        <Th isNumeric>Completed</Th>
                        <Th isNumeric>Active</Th>
                        <Th isNumeric>Overdue</Th>
                        <Th isNumeric>Interactions</Th>
                        <Th isNumeric>Points</Th>
                        <Th isNumeric>Core Output</Th>
                        <Th isNumeric>Score</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(previewItem.rows || {}).map(([agentId, row]) => {
                        const displayName = rawUsers.find((a) => (a._id || a.id) === agentId)?.fullName || agentId;
                        const { final } = calcScore({
                          target: row.target,
                          achieved: row.achieved,
                          coreOutput: row.coreOutput,
                          absents: row.absents,
                          points: row.points,
                        });
                        return (
                          <Tr key={agentId}>
                            <Td fontWeight="600">{displayName}</Td>
                            <Td isNumeric>{row.assigned ?? row.target ?? 0}</Td>
                            <Td isNumeric>{row.achieved}</Td>
                            <Td isNumeric>{row.active ?? 0}</Td>
                            <Td isNumeric>{row.overdue ?? 0}</Td>
                            <Td isNumeric>{row.interactions ?? 0}</Td>
                            <Td isNumeric>{row.points ?? 0}</Td>
                            <Td isNumeric>{row.coreOutput ?? 0}%</Td>
                            <Td isNumeric>
                              <Badge colorScheme={final >= 90 ? "green" : final >= 70 ? "teal" : "orange"}>
                                {final.toFixed(1)}%
                              </Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}

        {/* Confirm Save Dialog */}
        <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={() => setIsConfirmOpen(false)}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Save KPI Snapshot
              </AlertDialogHeader>
              <AlertDialogBody>
                <Text mb={2}>Save the current automatic KPI snapshot for:</Text>
                <Text fontWeight="bold" color="teal.600">
                  {periodType.toUpperCase()} — {periodValue}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  This will snapshot the current scores into local storage for historical comparison.
                </Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)} size="sm">
                  Cancel
                </Button>
                <Button
                  colorScheme="teal"
                  size="sm"
                  ml={3}
                  onClick={() => {
                    setIsConfirmOpen(false);
                    saveCurrent();
                  }}
                >
                  Confirm & Save
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Layout>
  );
};

export default CustomerKPIPage;
