import React, { useEffect, useState } from "react";
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  Divider,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { getAllAgents } from "../../services/salesManagerService";

// Helper to get ISO week number
const getISOWeek = (dateObj) => {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  // Thursday in current week decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

const KPIScorecardPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState("month"); // month or week
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
  const cancelRef = React.useRef();

  // helpers for local persistence
  const storageKey = "kpi-agent-scores-v1";
  const periodKey = (type, value) => `${type}:${value}`;

  const loadSavedRows = (type, value) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const entry = parsed[periodKey(type, value)];
      if (!entry) return {};
      // Support legacy structure (plain rows object)
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
      return Object.entries(parsed).map(([key, value]) => {
        const [type, val] = key.split(":");
        const savedAt = value.savedAt || null;
        const rows = value.rows || value; // legacy
        return { key, type, value: val, savedAt, rows };
      }).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
    } catch (e) {
      console.warn("loadSavedList failed", e);
      return [];
    }
  };

  const saveCurrent = () => {
    const payload = agents.reduce((acc, row) => {
      acc[row.id] = {
        target: row.target,
        achieved: row.achieved,
        coreOutput: row.coreOutput,
        absents: row.absents
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
        periodValue
      };
      localStorage.setItem(storageKey, JSON.stringify(parsed));
      setError(null);
      setSavedItems(loadSavedList());
      toast({
        title: "KPIs saved",
        description: `Saved ${Object.keys(payload).length} agents for ${periodType} ${periodValue}.`,
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
    const loadAgents = async () => {
      try {
        setLoading(true);
        const data = await getAllAgents();
        const saved = loadSavedRows(periodType, periodValue);
        const rows = (data || []).map((agent) => ({
          id: agent._id,
          name: agent.fullName || agent.username || "Unnamed Agent",
          target: saved[agent._id]?.target || 0,
          achieved: saved[agent._id]?.achieved || 0,
          coreOutput: saved[agent._id]?.coreOutput || 0,
          absents: saved[agent._id]?.absents || 0
        }));
        setAgents(rows);
        setError(null);
      } catch (err) {
        console.error("Error loading agents for KPI table", err);
        setError("Failed to load agents");
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    setSavedItems(loadSavedList());
    loadAgents();
  }, [periodType, periodValue]);

  const handleChange = (id, field, value) => {
    const numeric = Number(value);
    setAgents((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, [field]: Number.isNaN(numeric) ? 0 : numeric } : row
      )
    );
  };

  const calcScore = (row) => {
    const target = Number(row.target) || 0;
    const achieved = Number(row.achieved) || 0;
    const coreOutput = Number(row.coreOutput) || 0;
    const absents = Number(row.absents) || 0;
    const achievementPct = target > 0 ? (achieved / target) * 100 : 0;
    const coreOutputPct = Math.max(0, Math.min(100, coreOutput));
    const weightedScore = achievementPct * 0.5 + coreOutputPct * 0.5;
    // Each absent day reduces score by 1%
    const attendancePenalty = absents * 1;
    const final = Math.max(0, Math.min(100, weightedScore - attendancePenalty));
    return { achievementPct, coreOutputPct, attendancePenalty, final };
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>KPI Scorecard</Heading>
      <Text color="gray.600" mb={4}>
        Enter each agent's target, achieved amount, core output, and absences to see their KPI result. Save per period (month/week) for later review.
      </Text>

      <Card mb={5} boxShadow="lg">
        <CardBody>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} alignItems="flex-end">
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>Period Type</Text>
              <ChakraSelect
                value={periodType}
                onChange={(e) => {
                  const next = e.target.value;
                  setPeriodType(next);
                  const now = new Date();
                  if (next === "month") {
                    setPeriodValue(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                  } else {
                    const week = getISOWeek(now);
                    setPeriodValue(`${now.getFullYear()}-W${String(week).padStart(2, "0")}`);
                  }
                }}
                size="sm"
              >
                <option value="month">Monthly</option>
                <option value="week">Weekly</option>
              </ChakraSelect>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>Period</Text>
              {periodType === "month" ? (
                <input
                  type="month"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              ) : (
                <input
                  type="week"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                />
              )}
            </Box>

              <HStack spacing={3} justify={{ base: "flex-start", md: "flex-end" }}>
              <Button colorScheme="teal" size="sm" onClick={() => setIsConfirmOpen(true)}>
                Save KPIs
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDrawerOpen(true)}
              >
                Load Saved
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

      <Card>
        <CardHeader pb={2}>
          <Heading size="md">Agent KPI Targets & Attendance</Heading>
          <Text color="gray.600" fontSize="sm">
            Result = 50% achievement + 50% core output, minus 1% per absence.
          </Text>
        </CardHeader>
        <CardBody>
          {agents.length === 0 ? (
            <Text color="gray.500">No agents found.</Text>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Agent</Th>
                    <Th>Target</Th>
                    <Th>Achieved</Th>
                    <Th>Core Output</Th>
                    <Th>Absents</Th>
                    <Th>Result</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {agents.map((row) => {
                    const { achievementPct, coreOutputPct, attendancePenalty, final } = calcScore(row);
                    return (
                      <Tr key={row.id}>
                        <Td fontWeight="medium">{row.name}</Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={0}
                            value={row.target}
                            onChange={(_, num) => handleChange(row.id, "target", num)}
                            maxW="120px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={0}
                            value={row.achieved}
                            onChange={(_, num) => handleChange(row.id, "achieved", num)}
                            maxW="120px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={0}
                            value={row.coreOutput}
                            onChange={(_, num) => handleChange(row.id, "coreOutput", num)}
                            maxW="120px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={0}
                            value={row.absents}
                            onChange={(_, num) => handleChange(row.id, "absents", num)}
                            maxW="100px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Badge colorScheme={final >= 90 ? "green" : final >= 70 ? "teal" : "orange"}>
                              {final.toFixed(1)}%
                            </Badge>
                            <Tooltip
                              label={`Achievement: ${achievementPct.toFixed(1)}% | Core output: ${coreOutputPct.toFixed(
                                1
                              )}% | Penalty: -${attendancePenalty.toFixed(1)}`}
                            >
                              <Text fontSize="xs" color="gray.600">
                                net score
                              </Text>
                            </Tooltip>
                          </HStack>
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

      {/* Saved KPI Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => setIsDrawerOpen(false)} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Saved KPI Periods</DrawerHeader>
          <DrawerBody>
            <Stack spacing={3}>
              <HStack spacing={2} align="center">
                <ChakraSelect
                  size="sm"
                  width="140px"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
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
                              <Badge colorScheme="teal" textTransform="capitalize">{item.type}</Badge>
                              <Text fontWeight="semibold">{item.value}</Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {item.savedAt ? new Date(item.savedAt).toLocaleString() : "No date"}
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center" mb={2}>
                            <HStack spacing={2}>
                              <Badge colorScheme="purple" variant="subtle">
                                {Object.keys(item.rows || {}).length} agents
                              </Badge>
                            </HStack>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                colorScheme="teal"
                                onClick={() => {
                                  setPeriodType(item.type);
                                  setPeriodValue(item.value);
                                  const rows = item.rows || {};
                                  setAgents((prev) =>
                                    prev.map((row) => ({
                                      ...row,
                                      target: rows[row.id]?.target || 0,
                                      achieved: rows[row.id]?.achieved || 0,
                                      coreOutput: rows[row.id]?.coreOutput || 0,
                                      absents: rows[row.id]?.absents || 0
                                    }))
                                  );
                                  setIsDrawerOpen(false);
                                  toast({
                                    title: "KPIs loaded",
                                    description: `Loaded saved KPIs for ${item.type} ${item.value}`,
                                    status: "info",
                                    duration: 2500,
                                    isClosable: true,
                                  });
                                }}
                              >
                                Load
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setPreviewItem(item);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                View
                              </Button>
                            </HStack>
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
                      <Th>Agent</Th>
                      <Th isNumeric>Target</Th>
                      <Th isNumeric>Achieved</Th>
                      <Th isNumeric>Core Output</Th>
                      <Th isNumeric>Absents</Th>
                      <Th isNumeric>Result</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(previewItem.rows || {}).map(([agentId, row]) => {
                      const displayName =
                        agents.find((a) => a.id === agentId)?.name || agentId;
                      const { achievementPct, attendancePenalty, final } = calcScore({
                        target: row.target,
                        achieved: row.achieved,
                        coreOutput: row.coreOutput,
                        absents: row.absents
                      });
                      return (
                        <Tr key={agentId}>
                          <Td>{displayName}</Td>
                          <Td isNumeric>{row.target}</Td>
                          <Td isNumeric>{row.achieved}</Td>
                          <Td isNumeric>{row.coreOutput ?? 0}</Td>
                          <Td isNumeric>{row.absents}</Td>
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
              <Text mb={2}>Please double-check values. Once submitted, this KPI snapshot cannot be edited.</Text>
              <Text fontWeight="semibold">Period:</Text>
              <Text mb={1}>{periodType.toUpperCase()} — {periodValue}</Text>
              <Text fontSize="sm" color="gray.600">Tip: If you need changes later, save a new snapshot for the same period.</Text>
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
                Submit & Save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default KPIScorecardPage;
