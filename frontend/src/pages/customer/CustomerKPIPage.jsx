import React, { useEffect, useState, useRef } from "react";
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
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { getCustomerServiceUsers, getCustomerServiceWorkItems } from "../../services/customerKPIService";
import Layout from "../../components/customer/Layout";

// Helper to get ISO week number
const getISOWeek = (dateObj) => {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
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

const getWorkDate = (item = {}) => {
  const dateValue =
    item.completedAt ||
    item.updatedAt ||
    item.registrationDate ||
    item.dueDate ||
    item.nextFollowupDate ||
    item.followupDate ||
    item.createdAt;
  const date = dateValue ? new Date(dateValue) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getPeriodRange = (type, value) => {
  if (type === "week") {
    const [yearText, weekText] = String(value || "").split("-W");
    const year = Number(yearText);
    const week = Number(weekText);
    if (!year || !week) return null;
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const day = simple.getUTCDay();
    const monday = new Date(simple);
    monday.setUTCDate(simple.getUTCDate() - ((day + 6) % 7));
    const end = new Date(monday);
    end.setUTCDate(monday.getUTCDate() + 7);
    return { start: monday, end };
  }

  if (type === "year") {
    const year = Number(value);
    if (!year) return null;
    return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
  }

  const [yearText, monthText] = String(value || "").split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return null;
  return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) };
};

const isInRange = (date, range) => {
  if (!date || !range) return false;
  return date >= range.start && date < range.end;
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

const calculateAutoMetrics = (agent, workItems, range, periodType) => {
  const agentId = normalizeId(agent._id || agent.id);
  const owned = workItems.filter((item) => getWorkOwnerId(item) === agentId);
  const inPeriod = owned.filter((item) => isInRange(getWorkDate(item), range));
  const completed = inPeriod.filter(isCompletedWork);
  const now = new Date();
  const overdue = inPeriod.filter((item) => {
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    return dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < now && !isCompletedWork(item);
  });
  const interactions = inPeriod.reduce((sum, item) => sum + getInteractionCount(item), 0);
  const points = inPeriod.reduce(
    (sum, item) => sum + (Number(item.kpiPoint) || (item.kpiSource === "buyer" ? 1 : 0)),
    0
  );
  const workloadTarget = { week: 5, month: 20, year: 240 }[periodType] || 20;
  const assigned = inPeriod.length;
  const achieved = completed.length;
  const target = Math.max(workloadTarget, assigned);
  const completionRate = assigned > 0 ? (achieved / assigned) * 100 : 0;
  const activityRate = assigned > 0 ? Math.min(100, (interactions / Math.max(assigned, 1)) * 20) : 0;
  const timelinessRate = assigned > 0 ? Math.max(0, 100 - (overdue.length / assigned) * 100) : 100;
  const coreOutput = Math.max(0, Math.min(100, completionRate * 0.55 + activityRate * 0.25 + timelinessRate * 0.2));

  return {
    target,
    achieved,
    coreOutput: Number(coreOutput.toFixed(1)),
    absents: 0,
    assigned,
    active: Math.max(assigned - achieved, 0),
    overdue: overdue.length,
    interactions,
    points,
    completedWork: completed,
    workItems: inPeriod,
  };
};

const CustomerKPIPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workLoading, setWorkLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState("month"); // week, month, or year
  const [periodValue, setPeriodValue] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const toast = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const cancelRef = useRef();

  // helpers for local persistence
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

  const loadSavedRows = (type, value) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const entry = parsed[periodKey(type, value)];
      if (!entry) return {};
      return entry.rows || entry;
    } catch (e) {
      console.warn("loadSaved failed", e);
      return {};
    }
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

  const saveCurrent = () => {
    const payload = customerServiceAgents.reduce((acc, row) => {
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
      setError(null);
      setSavedItems(loadSavedList());
      toast({
        title: "KPIs saved",
        description: `Saved ${Object.keys(payload).length} automated rep snapshots for ${periodType} ${periodValue}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      console.warn("saveCurrent failed", e);
      setError("Failed to save KPIs locally");
      toast({
        title: "Save failed",
        description: "Unable to save KPI data locally.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const buildRows = (users, workItems = []) => {
      const range = getPeriodRange(periodType, periodValue);
      return (users || []).map((user) => ({
        id: user._id || user.id,
        name: user.fullName || user.username || "Customer Service",
        role: user.role || user.userRole || "customerservice",
        ...calculateAutoMetrics(user, workItems, range, periodType),
      }));
    };

    const loadAgents = async () => {
      try {
        setLoading(true);
        const data = await getCustomerServiceUsers();
        if (!isMounted) return;
        setAgents(buildRows(data));
        setError(null);
        setLoading(false);
        setWorkLoading(true);

        getCustomerServiceWorkItems()
          .then((workItems) => {
            if (!isMounted) return;
            setAgents(buildRows(data, workItems));
          })
          .catch((err) => {
            if (!isMounted) return;
            console.warn("Customer KPI work metrics loaded partially or timed out", err);
            setError("KPI page opened, but some automatic work metrics could not load quickly. Try refreshing if counts look incomplete.");
          })
          .finally(() => {
            if (isMounted) setWorkLoading(false);
          });
      } catch (err) {
        console.error("Error loading CS agents for KPI table", err);
        // Fallback: try using saved rows if available
        const saved = loadSavedRows(periodType, periodValue);
        const savedRows = Object.entries(saved).map(([id, row]) => ({
          id,
          name: `Saved User ${id.slice(0, 6)}`,
          role: "customerservice",
          target: row?.target || 0,
          achieved: row?.achieved || 0,
          coreOutput: row?.coreOutput || 0,
          absents: row?.absents || 0,
          points: row?.points || 0,
        }));
        if (savedRows.length) {
          if (isMounted) {
            setAgents(savedRows);
            setError("Live list unavailable; showing last saved KPI entries.");
          }
        } else {
          if (isMounted) {
            setAgents([]);
            setError("Failed to load customer service users");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setSavedItems(loadSavedList());
    loadAgents();

    return () => {
      isMounted = false;
    };
  }, [periodType, periodValue]);

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
    const final = Math.max(0, Math.min(100, weightedScore));
    return { achievementPct, coreOutputPct, pointScore, attendancePenalty, final };
  };

  const normalizeRole = (value = "") =>
    value
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getScoreBand = (score) => {
    if (score >= 90) return { label: "Excellent", color: "green", guidance: "Consistently exceeding the expected service standard." };
    if (score >= 75) return { label: "Strong", color: "teal", guidance: "Healthy performance with room for targeted improvement." };
    if (score >= 60) return { label: "Watch", color: "orange", guidance: "Requires closer follow-up on completion, output, or overdue work." };
    return { label: "At Risk", color: "red", guidance: "Needs immediate support and performance review." };
  };

  const buildAgentMetrics = (row) => {
    const score = calcScore(row);
    const band = getScoreBand(score.final);
    return {
      ...row,
      ...score,
      band,
      workScore: score.final,
      target: Number(row.target) || 0,
      achieved: Number(row.achieved) || 0,
      points: Number(row.points) || 0,
      coreOutput: Number(row.coreOutput) || 0,
      absents: Number(row.absents) || 0,
    };
  };

  const customerServiceAgents = agents.filter((row) => normalizeRole(row.role || "customerservice") === "customerservice");
  const rankedAgents = customerServiceAgents
    .map(buildAgentMetrics)
    .sort((a, b) => b.workScore - a.workScore || b.points - a.points || b.achieved - a.achieved || b.coreOutput - a.coreOutput);

  const currentSummary = customerServiceAgents.reduce(
    (acc, row) => {
      const score = calcScore(row);
      acc.target += Number(row.target) || 0;
      acc.achieved += Number(row.achieved) || 0;
      acc.coreOutput += Number(row.coreOutput) || 0;
      acc.absents += Number(row.absents) || 0;
      acc.score += score.final;
      acc.reps += 1;
      return acc;
    },
    { target: 0, achieved: 0, coreOutput: 0, absents: 0, score: 0, reps: 0 }
  );
  const averageScore = currentSummary.reps > 0 ? currentSummary.score / currentSummary.reps : 0;
  const achievementRate =
    currentSummary.target > 0 ? Math.min(100, (currentSummary.achieved / currentSummary.target) * 100) : 0;
  const selectedAgent = rankedAgents.find((row) => row.id === selectedAgentId) || null;
  const topPerformer = rankedAgents[0];
  const needsAttention = rankedAgents.filter((row) => row.final < 60).length;
  const strongPerformers = rankedAgents.filter((row) => row.final >= 75).length;
  const averageCoreOutput = currentSummary.reps > 0 ? currentSummary.coreOutput / currentSummary.reps : 0;
  const totalActive = customerServiceAgents.reduce((sum, row) => sum + (Number(row.active) || 0), 0);
  const totalOverdue = customerServiceAgents.reduce((sum, row) => sum + (Number(row.overdue) || 0), 0);
  const totalPoints = customerServiceAgents.reduce((sum, row) => sum + (Number(row.points) || 0), 0);
  const timelinessHealth =
    currentSummary.target > 0 ? Math.max(0, 100 - (totalOverdue / Math.max(currentSummary.target, 1)) * 100) : 100;
  const savedPeriodCount = savedItems.filter((item) => item.type === periodType).length;
  const periodLabel = {
    week: "Weekly",
    month: "Monthly",
    year: "Yearly",
  }[periodType];
  const periodScopeText = {
    week: "Weekly view is best for immediate coaching, missed follow-ups, and short-cycle productivity.",
    month: "Monthly view is best for team ranking, target achievement, and operational reporting.",
    year: "Yearly view is best for long-term contribution, promotion readiness, and strategic planning.",
  }[periodType];

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Layout>
      <Box p={{ base: 4, md: 5, xl: 6 }} w="100%" maxW="none" mx="0">
      <Card
        mb={5}
        borderRadius="xl"
        border="1px solid"
        borderColor="blue.100"
        bg="linear-gradient(135deg, #f8fbff 0%, #eefaf7 100%)"
        boxShadow="lg"
      >
        <CardBody>
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} flexWrap="wrap">
            <Box>
              <Badge colorScheme="teal" mb={2}>Performance command</Badge>
              <Heading size="lg" mb={2}>
                Customer Service KPI Scorecard
              </Heading>
              <Text color="gray.600" maxW="760px">
                Automatic weekly, monthly, and yearly visibility for customer service team work only. Existing saved data remains untouched.
              </Text>
              <Text color="gray.500" fontSize="sm" mt={2} maxW="760px">
                {periodScopeText}
              </Text>
            </Box>
            <Box minW={{ base: "100%", md: "260px" }}>
              <Text fontSize="sm" color="gray.600" mb={2} fontWeight="semibold">
                {periodLabel} automatic score
              </Text>
              <Progress value={averageScore} colorScheme={averageScore >= 80 ? "green" : "teal"} borderRadius="full" size="lg" />
              <Text mt={2} fontWeight="bold" fontSize="2xl">
                {averageScore.toFixed(1)}%
              </Text>
              <Badge colorScheme={getScoreBand(averageScore).color}>
                {getScoreBand(averageScore).label}
              </Badge>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      <Card mb={5} boxShadow="lg">
        <CardBody>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} alignItems="flex-end">
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                Period Type
              </Text>
              <ChakraSelect
                value={periodType}
                onChange={(e) => {
                  const next = e.target.value;
                  setPeriodType(next);
                  setPeriodValue(getDefaultPeriodValue(next));
                }}
                size="sm"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </ChakraSelect>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                Period
              </Text>
              {periodType === "month" ? (
                <input
                  type="month"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              ) : periodType === "week" ? (
                <input
                  type="week"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              ) : (
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              )}
            </Box>

            <HStack spacing={3} justify={{ base: "flex-start", md: "flex-end" }}>
              <Button colorScheme="teal" size="sm" onClick={() => setIsConfirmOpen(true)}>
                Save Auto Snapshot
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsDrawerOpen(true)}>
                Saved Snapshots
              </Button>
            </HStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {workLoading && (
        <Alert status="info" mb={4} borderRadius="lg">
          <AlertIcon />
          Automatic KPI metrics are loading in the background. The page is ready, and counts will update shortly.
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} mb={5}>
        {[
          ["Target", currentSummary.target, "Planned workload", "blue"],
          ["Achieved", currentSummary.achieved, `${achievementRate.toFixed(1)}% of target`, "green"],
          ["Core Output", currentSummary.coreOutput.toFixed(1), `${averageCoreOutput.toFixed(1)} average per rep`, "purple"],
          ["Active Work", totalActive, `${totalOverdue} overdue item${totalOverdue === 1 ? "" : "s"}`, "orange"],
          ["KPI Points", totalPoints, "Earned from buyer creation and work records", "teal"],
        ].map(([label, value, help, color]) => (
          <Card key={label} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
            <CardBody>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">{periodLabel} {label}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">{value}</Text>
              <Text fontSize="xs" color="gray.500">{help}</Text>
              <Progress
                mt={3}
                value={label === "Active Work" ? timelinessHealth : label === "Achieved" ? achievementRate : Math.min(100, Number(value) || 0)}
                colorScheme={color}
                borderRadius="full"
                size="sm"
              />
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4} mb={5}>
        <Card borderRadius="lg" border="1px solid" borderColor="green.100" bg="green.50">
          <CardBody>
            <Text fontSize="sm" color="green.700" fontWeight="bold">Top Performer</Text>
            <Heading size="md" mt={1}>{topPerformer?.name || "No data yet"}</Heading>
            <Text fontSize="sm" color="green.700" mt={1}>
              {topPerformer
                ? `${topPerformer.workScore.toFixed(1)}% rank score with ${topPerformer.points || 0} KPI point${topPerformer.points === 1 ? "" : "s"} for ${periodValue}`
                : "No customer service work found for this period."}
            </Text>
          </CardBody>
        </Card>
        <Card borderRadius="lg" border="1px solid" borderColor="teal.100" bg="teal.50">
          <CardBody>
            <Text fontSize="sm" color="teal.700" fontWeight="bold">Strong Performers</Text>
            <Heading size="md" mt={1}>{strongPerformers}</Heading>
            <Text fontSize="sm" color="teal.700" mt={1}>Representatives at 75% or above.</Text>
          </CardBody>
        </Card>
        <Card borderRadius="lg" border="1px solid" borderColor={needsAttention ? "red.100" : "blue.100"} bg={needsAttention ? "red.50" : "blue.50"}>
          <CardBody>
            <Text fontSize="sm" color={needsAttention ? "red.700" : "blue.700"} fontWeight="bold">Needs Attention</Text>
            <Heading size="md" mt={1}>{needsAttention}</Heading>
            <Text fontSize="sm" color={needsAttention ? "red.700" : "blue.700"} mt={1}>
              {savedPeriodCount} saved {periodType} snapshot{savedPeriodCount === 1 ? "" : "s"} available for review.
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card mb={5} borderRadius="lg" border="1px solid" borderColor="gray.200">
        <CardHeader pb={2}>
          <Heading size="md">KPI Framework Model</Heading>
          <Text color="gray.600" fontSize="sm">
            Score = 45% completion achievement + 45% core output + 10% KPI points, automatically calculated from customer service work.
          </Text>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
            {[
              ["Target Achievement", "45%", "Measures completed work against planned service goals.", achievementRate, "blue"],
              ["Core Output Quality", "45%", "Measures completion, interaction activity, and timeliness.", averageCoreOutput, "purple"],
              ["Buyer & Work Points", "10%", "Credits employee points when they add new buyers or earn work-record points.", Math.min(100, totalPoints * 10), "teal"],
              ["Timeliness Control", "Auto", "Tracks active and overdue workload without manual scoring.", timelinessHealth, "orange"],
            ].map(([title, weight, detail, value, color]) => (
              <Box key={title} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold">{title}</Text>
                  <Badge colorScheme={color}>{weight}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" minH="42px">{detail}</Text>
                <Progress mt={3} value={Math.min(100, Number(value) || 0)} colorScheme={color} borderRadius="full" />
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Automated Customer Service KPI Ranking</Heading>
          <Text color="gray.600" fontSize="sm">
            Performance is calculated automatically from customer service work records and buyer creation points. No manual KPI entry is required.
          </Text>
        </CardHeader>
        <CardBody>
          {rankedAgents.length === 0 ? (
            <Text color="gray.500">No customer service work records found for this period.</Text>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Rank</Th>
                    <Th>Customer Service Rep</Th>
                    <Th>Assigned</Th>
                    <Th>Completed</Th>
                    <Th>Active</Th>
                    <Th>Overdue</Th>
                    <Th>Interactions</Th>
                    <Th>Points</Th>
                    <Th>Core Output</Th>
                    <Th>Result</Th>
                    <Th>Work Score</Th>
                    <Th>Band</Th>
                    <Th>Details</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rankedAgents.map((row, index) => {
                    const { achievementPct, coreOutputPct, pointScore, final, workScore, band } = row;
                    return (
                      <Tr key={row.id}>
                        <Td fontWeight="bold">#{index + 1}</Td>
                        <Td fontWeight="medium">{row.name}</Td>
                        <Td>
                          <Badge colorScheme="blue">{row.assigned}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="green">{row.achieved}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={row.active > 0 ? "orange" : "gray"}>{row.active}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={row.overdue > 0 ? "red" : "green"}>{row.overdue}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="purple">{row.interactions}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="teal">{row.points || 0}</Badge>
                        </Td>
                        <Td>
                          <Text fontWeight="semibold">{row.coreOutput.toFixed(1)}%</Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Badge colorScheme={band.color}>
                              {final.toFixed(1)}%
                            </Badge>
                            <Tooltip
                              label={`Achievement: ${achievementPct.toFixed(1)}% | Core output: ${coreOutputPct.toFixed(
                                1
                              )}% | Point score: ${pointScore.toFixed(1)}%`}
                            >
                              <Text fontSize="xs" color="gray.600">
                                net score
                              </Text>
                            </Tooltip>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={workScore >= 90 ? "green" : workScore >= 75 ? "teal" : workScore >= 60 ? "orange" : "red"}>
                            {workScore.toFixed(1)}%
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={band.color} variant="subtle">
                            {band.label}
                          </Badge>
                        </Td>
                        <Td>
                          <Button size="xs" variant="outline" colorScheme="teal" onClick={() => setSelectedAgentId(row.id)}>
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

      <Drawer isOpen={!!selectedAgent} placement="right" onClose={() => setSelectedAgentId(null)} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            KPI Detail - {selectedAgent?.name}
          </DrawerHeader>
          <DrawerBody>
            {selectedAgent && (
              <Stack spacing={4}>
                <Card borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Selected Period</Text>
                        <Heading size="md">{periodLabel} - {periodValue}</Heading>
                      </Box>
                      <Badge colorScheme={selectedAgent.band.color}>{selectedAgent.band.label}</Badge>
                    </Flex>
                    <Progress value={selectedAgent.final} colorScheme={selectedAgent.band.color} borderRadius="full" size="lg" />
                    <Text mt={3} fontSize="sm" color="gray.600">{selectedAgent.band.guidance}</Text>
                  </CardBody>
                </Card>

                {[
                  ["Completion Achievement", selectedAgent.achievementPct, `${selectedAgent.achieved} completed from ${selectedAgent.assigned} assigned work item${selectedAgent.assigned === 1 ? "" : "s"}`, "blue"],
                  ["Core Output", selectedAgent.coreOutputPct, `${selectedAgent.coreOutput} output score from activity and timeliness`, "purple"],
                  ["Workload Health", 100 - Math.min(100, (selectedAgent.overdue / Math.max(selectedAgent.assigned, 1)) * 100), `${selectedAgent.active} active, ${selectedAgent.overdue} overdue, ${selectedAgent.interactions} interaction${selectedAgent.interactions === 1 ? "" : "s"}`, "orange"],
                  ["KPI Points", Math.min(100, (selectedAgent.points || 0) * 10), `${selectedAgent.points || 0} point${selectedAgent.points === 1 ? "" : "s"} earned in this period`, "teal"],
                  ["Final Score", selectedAgent.final, "Weighted score from completion, core output, and KPI points", selectedAgent.band.color],
                ].map(([label, value, help, color]) => (
                  <Box key={label} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg">
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="bold">{label}</Text>
                      <Text fontWeight="bold">{Number(value).toFixed(1)}%</Text>
                    </Flex>
                    <Progress value={Number(value)} colorScheme={color} borderRadius="full" />
                    <Text fontSize="sm" color="gray.500" mt={2}>{help}</Text>
                  </Box>
                ))}

                <Alert status={selectedAgent.final >= 75 ? "success" : selectedAgent.final >= 60 ? "warning" : "error"} borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Management note</Text>
                    <Text fontSize="sm">
                      {selectedAgent.final >= 75
                        ? "Performance is on track. Continue monitoring completed work and customer handling quality."
                        : selectedAgent.final >= 60
                          ? "Performance needs coaching. Review active workload, overdue work, and output quality."
                          : "Performance is at risk. Prioritize a manager follow-up and support plan for unfinished work."}
                    </Text>
                  </Box>
                </Alert>
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Saved KPI Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => setIsDrawerOpen(false)} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Saved KPI Periods</DrawerHeader>
          <DrawerBody>
            <Stack spacing={3}>
              <HStack spacing={2} align="center">
                <ChakraSelect size="sm" width="140px" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All types</option>
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                  <option value="year">Yearly</option>
                </ChakraSelect>
                <input
                  placeholder="Filter by period (e.g. 2026-01)"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              </HStack>

              {savedItems.length === 0 ? (
                <Text color="gray.500">No saved KPI entries yet.</Text>
              ) : (
                <Stack spacing={2} maxH="70vh" overflowY="auto" pr={2}>
                  {savedItems
                    .filter((item) => (filterType === "all" ? true : item.type === filterType))
                    .filter((item) => item.value.toLowerCase().includes(filterText.toLowerCase()))
                    .map((item) => (
                      <Card
                        key={item.key}
                        variant="outline"
                        borderColor="gray.200"
                        _hover={{ borderColor: "teal.400", boxShadow: "md" }}
                        py={2}
                        px={2}
                      >
                        <CardBody p={2}>
                          <Flex justify="space-between" align="center" mb={1}>
                            <HStack spacing={2} align="center">
                              <Badge colorScheme="teal" textTransform="capitalize">
                                {item.type}
                              </Badge>
                              <Text fontWeight="semibold">{item.value}</Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {item.savedAt ? new Date(item.savedAt).toLocaleString() : "No date"}
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center" mb={2}>
                            <HStack spacing={2}>
                              <Badge colorScheme="purple" variant="subtle">
                                {Object.keys(item.rows || {}).length} reps
                              </Badge>
                            </HStack>
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

      {/* Preview modal-like drawer for a saved set */}
      {previewItem && (
        <Drawer isOpen={isPreviewOpen} placement="left" onClose={() => setIsPreviewOpen(false)} size="xl">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              Saved KPIs – {previewItem.type} {previewItem.value}
            </DrawerHeader>
            <DrawerBody>
              <Text fontSize="sm" color="gray.500" mb={3}>
                Saved at {previewItem.savedAt ? new Date(previewItem.savedAt).toLocaleString() : "Unknown"}
              </Text>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Customer Service Rep</Th>
                      <Th isNumeric>Assigned</Th>
                      <Th isNumeric>Completed</Th>
                      <Th isNumeric>Active</Th>
                      <Th isNumeric>Overdue</Th>
                      <Th isNumeric>Interactions</Th>
                      <Th isNumeric>Points</Th>
                      <Th isNumeric>Core Output</Th>
                      <Th isNumeric>Result</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(previewItem.rows || {}).map(([agentId, row]) => {
                      const displayName = agents.find((a) => a.id === agentId)?.name || agentId;
                      const { final } = calcScore({
                        target: row.target,
                        achieved: row.achieved,
                        coreOutput: row.coreOutput,
                        absents: row.absents,
                        points: row.points,
                      });
                      return (
                        <Tr key={agentId}>
                          <Td>{displayName}</Td>
                          <Td isNumeric>{row.assigned ?? row.target ?? 0}</Td>
                          <Td isNumeric>{row.achieved}</Td>
                          <Td isNumeric>{row.active ?? 0}</Td>
                          <Td isNumeric>{row.overdue ?? 0}</Td>
                          <Td isNumeric>{row.interactions ?? 0}</Td>
                          <Td isNumeric>{row.points ?? 0}</Td>
                          <Td isNumeric>{row.coreOutput ?? 0}</Td>
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
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Submit KPI Period
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={2}>Please review the automatically calculated KPI snapshot before saving it for this period.</Text>
              <Text fontWeight="semibold">Period:</Text>
              <Text mb={1}>
                {periodType.toUpperCase()} — {periodValue}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Tip: Updated work metrics will automatically recalculate the ranking before the next snapshot is saved.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="teal"
                ml={3}
                onClick={() => {
                  setIsConfirmOpen(false);
                  saveCurrent();
                }}
              >
                Save Auto Snapshot
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
