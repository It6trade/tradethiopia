import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  Tabs,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiGrid,
  FiLayers,
  FiList,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiStar,
  FiTrash2,
  FiUserCheck,
} from "react-icons/fi";
import Layout from "./Layout";
import axiosInstance from "../../services/axiosInstance";

const isSupportTicket = (task) => {
  if (!task || typeof task !== "object") return false;
  return Boolean(
    task.requestSource === "employee_call"
    || task.supportRequestNote
    || task.requestedAt
    || (Array.isArray(task.ticketRecords) && task.ticketRecords.length > 0)
    || task.actionType === "Employee Support Request"
  );
};

const isCSExternalProject = (task) => {
  if (!task || typeof task !== "object") return false;
  return Boolean(
    task.projectType === "external"
    || task.actionType === "CS External IT Request"
    || task.actionType === "External CS Task Request"
    || String(task.description || task.supportRequestNote || "").includes("CS External")
  );
};

const getTaskTitle = (task) => {
  if (!task || typeof task !== "object") return "Task Request";
  return task.taskName || task.client || task.platform || task.category || "Task Request";
};

const getStatusColor = (status = "") => {
  const s = String(status || "").toLowerCase();
  if (["approved", "completed", "done", "closed"].includes(s)) return "green";
  if (["in_progress", "submitted", "ongoing", "reported"].includes(s)) return "purple";
  if (["assigned", "staff_accepted"].includes(s)) return "blue";
  if (["rejected", "cancelled"].includes(s)) return "red";
  return "orange";
};

const getPriorityColor = (priority = "") => {
  const p = String(priority || "").toLowerCase();
  if (p === "critical") return "red";
  if (p === "high") return "orange";
  if (p === "low") return "gray";
  return "blue";
};

const getLatestWorkRecord = (task) => {
  if (!task || typeof task !== "object" || !Array.isArray(task.ticketRecords)) return null;
  const records = [...task.ticketRecords].filter(Boolean);
  if (!records.length) return null;
  return records.sort(
    (a, b) => new Date(b?.createdAt || b?.completedAt || 0) - new Date(a?.createdAt || a?.completedAt || 0)
  )[0] || null;
};

export default function CSManagerTaskMonitor() {
  const toast = useToast();

  // Styling Tokens
  const pageBgGradient = useColorModeValue(
    "linear-gradient(135deg, #f8fbff 0%, #f0f7ff 50%, #f9fbfd 100%)",
    "linear-gradient(135deg, #09111e 0%, #0d1728 50%, #080f1a 100%)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tableRowHoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");

  // Component States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'tickets' | 'projects'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [senderFilter, setSenderFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Inspection Modal & Actions
  const { isOpen: isInspectOpen, onOpen: onInspectOpen, onClose: onInspectClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // Fetch all tasks and support requests
  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/it");
      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      // Filter to all customer-related tasks & support tickets
      const customerRelated = data.filter((task) => {
        if (!task || typeof task !== "object") return false;
        return (
          isSupportTicket(task) ||
          isCSExternalProject(task) ||
          String(task.requestedDepartment || "").toLowerCase().includes("customer") ||
          String(task.category || "").toLowerCase().includes("customer") ||
          task.projectType === "external"
        );
      });

      setTasks(customerRelated);
    } catch (error) {
      console.error("Failed to load manager oversight tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // Derived Senders for filtering
  const uniqueSenders = useMemo(() => {
    const senders = new Set();
    (tasks || []).forEach((t) => {
      if (!t) return;
      if (typeof t.requestedBy === "string" && t.requestedBy.trim()) senders.add(t.requestedBy.trim());
      if (t.createdBy?.fullName) senders.add(String(t.createdBy.fullName).trim());
      if (t.createdBy?.username) senders.add(String(t.createdBy.username).trim());
    });
    return Array.from(senders).filter(Boolean).sort();
  }, [tasks]);

  // KPI Calculations
  const stats = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
    const total = safeTasks.length;
    const tickets = safeTasks.filter(isSupportTicket).length;
    const projects = safeTasks.filter(isCSExternalProject).length;
    const pending = safeTasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["pending", "requested", "not_submitted", "pending_approval"].includes(s);
    }).length;
    const inProgress = safeTasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["in_progress", "assigned", "ongoing", "staff_accepted", "submitted", "reported"].includes(s);
    }).length;
    const completed = safeTasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["approved", "completed", "done", "closed"].includes(s);
    }).length;
    const critical = safeTasks.filter((t) => ["critical", "high"].includes(String(t.priority || "").toLowerCase())).length;

    return { total, tickets, projects, pending, inProgress, completed, critical };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
    return safeTasks.filter((task) => {
      // 1. Tab filter
      if (activeTab === "tickets" && !isSupportTicket(task)) return false;
      if (activeTab === "projects" && !isCSExternalProject(task)) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const searchable = [
          getTaskTitle(task),
          task.category,
          task.platform,
          task.client,
          task.requestedBy,
          task.requestedDepartment,
          task.description,
          task.supportRequestNote,
          task.taskLeader,
          ...(Array.isArray(task.assignedTo) ? task.assignedTo : []),
          task.createdBy?.fullName,
          task.createdBy?.email,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // 3. Status filter
      if (statusFilter !== "all") {
        const currentStatus = String(task.supportStatus || task.workflowStatus || task.status || "").toLowerCase();
        if (statusFilter === "pending" && !["pending", "requested", "not_submitted", "pending_approval"].includes(currentStatus)) return false;
        if (statusFilter === "in_progress" && !["in_progress", "assigned", "ongoing", "staff_accepted", "submitted", "reported"].includes(currentStatus)) return false;
        if (statusFilter === "completed" && !["approved", "completed", "done", "closed"].includes(currentStatus)) return false;
        if (statusFilter === "rejected" && !["rejected", "cancelled"].includes(currentStatus)) return false;
      }

      // 4. Priority filter
      if (priorityFilter !== "all" && String(task.priority || "normal").toLowerCase() !== priorityFilter) {
        return false;
      }

      // 5. Sender filter
      if (senderFilter !== "all") {
        const sender = String(task.requestedBy || task.createdBy?.fullName || task.createdBy?.username || "").toLowerCase();
        if (!sender.includes(senderFilter.toLowerCase())) return false;
      }

      // 6. Assignment filter
      if (assignmentFilter !== "all") {
        const hasAssignment = (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) || Boolean(task.taskLeader);
        if (assignmentFilter === "assigned" && !hasAssignment) return false;
        if (assignmentFilter === "waiting" && hasAssignment) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
      if (sortBy === "priority") {
        const rank = { critical: 4, high: 3, normal: 2, low: 1 };
        const pA = rank[String(a.priority || "").toLowerCase()] || 0;
        const pB = rank[String(b.priority || "").toLowerCase()] || 0;
        return pB - pA;
      }
      return 0;
    });
  }, [tasks, activeTab, searchQuery, statusFilter, priorityFilter, senderFilter, assignmentFilter, sortBy]);

  // Open Inspect Modal
  const handleInspect = (task) => {
    if (!task) return;
    setSelectedTask(task);
    setCommentText("");
    onInspectOpen();
  };

  // Submit Discussion Comment to IT
  const handleSendComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    const taskId = selectedTask._id || selectedTask.id;
    setSubmittingComment(true);
    try {
      const response = await axiosInstance.post(`/it/${taskId}/comments`, {
        body: commentText.trim(),
        audience: "cs_manager",
      });
      const updated = response.data?.data;
      if (updated) {
        setSelectedTask(updated);
        setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      }
      setCommentText("");
      toast({
        title: "Comment posted",
        description: "Your message was sent to the IT management thread.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to post comment",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Request (Sender or Manager only)
  const handleDeleteTask = async (task, e) => {
    if (e) e.stopPropagation();
    if (!task) return;
    const taskId = task._id || task.id;
    const title = getTaskTitle(task);

    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(taskId);
    try {
      await axiosInstance.delete(`/it/${taskId}`);
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
      if (selectedTask && (selectedTask._id === taskId || selectedTask.id === taskId)) {
        onInspectClose();
      }
      toast({
        title: "Request deleted",
        description: `"${title}" has been deleted successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || error.message || "You do not have permission to delete this request.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeletingId("");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTasks.length) {
      toast({ title: "No tasks to export", status: "warning" });
      return;
    }

    const headers = [
      "Task Title",
      "Type",
      "Category",
      "Sender / Requester",
      "Department",
      "Priority",
      "Status",
      "Assigned Staff",
      "Leader",
      "Progress %",
      "Rating",
      "Submitted At",
    ];

    const rows = filteredTasks.map((t) => [
      `"${(getTaskTitle(t) || "").replace(/"/g, '""')}"`,
      isSupportTicket(t) ? "Support Ticket" : "External Project",
      `"${(t.category || t.platform || t.ticketCategory || "").replace(/"/g, '""')}"`,
      `"${(t.requestedBy || t.createdBy?.fullName || t.createdBy?.username || "").replace(/"/g, '""')}"`,
      `"${(t.requestedDepartment || "Customer Service").replace(/"/g, '""')}"`,
      t.priority || "normal",
      t.supportStatus || t.workflowStatus || t.status || "pending",
      `"${(Array.isArray(t.assignedTo) ? t.assignedTo : []).join(", ").replace(/"/g, '""')}"`,
      `"${(t.taskLeader || "").replace(/"/g, '""')}"`,
      t.progressPercent || 0,
      t.requesterFeedback?.rating || "N/A",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CS_Manager_Task_Oversight_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export completed",
      description: `Exported ${filteredTasks.length} tasks to CSV.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSenderFilter("all");
    setAssignmentFilter("all");
    setSortBy("newest");
  };

  return (
    <Layout activeSection="manager-tasks">
      <Box minH="100%" bgGradient={pageBgGradient} p={{ base: 3, md: 5 }} borderRadius="2xl">
        {/* Header Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={3}
          mb={4}
        >
          <Box>
            <HStack spacing={2.5} mb={1}>
              <Icon as={FiLayers} boxSize={6} color="blue.500" />
              <Heading size="md" color={textColor} fontWeight="extrabold">
                Manager Task Oversight & Support Monitor
              </Heading>
              <Badge colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                CS Manager
              </Badge>
            </HStack>
            <Text fontSize="xs" color={muted}>
              Executive visibility across Support Requests to Manager and Assigned External Projects.
            </Text>
          </Box>

          <HStack spacing={2.5} wrap="wrap">
            <ButtonGroup size="sm" isAttached variant="outline">
              <IconButton
                aria-label="Grid View"
                icon={<FiGrid />}
                colorScheme={viewMode === "grid" ? "blue" : "gray"}
                variant={viewMode === "grid" ? "solid" : "outline"}
                onClick={() => setViewMode("grid")}
              />
              <IconButton
                aria-label="Table View"
                icon={<FiList />}
                colorScheme={viewMode === "table" ? "blue" : "gray"}
                variant={viewMode === "table" ? "solid" : "outline"}
                onClick={() => setViewMode("table")}
              />
            </ButtonGroup>
            <Button
              size="sm"
              leftIcon={<FiDownload />}
              variant="outline"
              colorScheme="blue"
              onClick={handleExportCSV}
              isDisabled={!filteredTasks.length}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              leftIcon={<FiRefreshCw />}
              colorScheme="blue"
              onClick={fetchAllTasks}
              isLoading={loading}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Executive KPI Stats Cards */}
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, xl: 7 }} spacing={2.5} mb={4}>
          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Total Managed
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="blue.600">
                  {stats.total}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  All Submissions
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Support Tickets
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="teal.600">
                  {stats.tickets}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  Manager Requests
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  External Projects
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="purple.600">
                  {stats.projects}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  External IT Tasks
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Pending Review
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="orange.500">
                  {stats.pending}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  Awaiting Action
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  In Progress
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="blue.500">
                  {stats.inProgress}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  Active IT Work
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Completed / Done
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="green.500">
                  {stats.completed}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  Finished Tasks
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Critical / High
                </StatLabel>
                <StatNumber fontSize="md" fontWeight="extrabold" color="red.500">
                  {stats.critical}
                </StatNumber>
                <StatHelpText fontSize="2xs" mb={0} color={muted}>
                  Urgent Priority
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* View Tabs & Multi-Filter Controls */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" mb={4} boxShadow="sm">
          <CardBody p={3.5}>
            <Tabs
              variant="soft-rounded"
              colorScheme="blue"
              size="sm"
              value={activeTab}
              onChange={(index) => {
                const tabs = ["all", "tickets", "projects"];
                setActiveTab(tabs[index]);
              }}
              mb={3}
            >
              <TabList gap={1.5} wrap="wrap">
                <Tab fontSize="xs" fontWeight="bold">
                  All Requests ({stats.total})
                </Tab>
                <Tab fontSize="xs" fontWeight="bold">
                  🛡️ Support Requests ({stats.tickets})
                </Tab>
                <Tab fontSize="xs" fontWeight="bold">
                  🚀 External Projects ({stats.projects})
                </Tab>
              </TabList>
            </Tabs>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={2.5}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search task, sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="lg"
                />
              </InputGroup>

              <Select
                size="sm"
                borderRadius="lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed / Approved</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Select
                size="sm"
                borderRadius="lg"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </Select>

              <Select
                size="sm"
                borderRadius="lg"
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
              >
                <option value="all">All Senders</option>
                {uniqueSenders.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>

              <Select
                size="sm"
                borderRadius="lg"
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
              >
                <option value="all">All Assignments</option>
                <option value="assigned">Assigned / In Hand</option>
                <option value="waiting">Waiting Assignment</option>
              </Select>

              <HStack spacing={1.5}>
                <Select
                  size="sm"
                  borderRadius="lg"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority First</option>
                </Select>
                <Button size="sm" variant="ghost" onClick={clearAllFilters} minW="55px" fontSize="xs">
                  Clear
                </Button>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Task List / Content Stream */}
        {loading ? (
          <Flex justify="center" align="center" minH="240px" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color={muted} fontSize="sm">Loading Customer Service tasks...</Text>
            </VStack>
          </Flex>
        ) : filteredTasks.length === 0 ? (
          <Box bg={cardBg} borderRadius="xl" p={8} textAlign="center" border="1px solid" borderColor={cardBorder}>
            <Icon as={FiAlertCircle} boxSize={8} color="orange.400" mb={2} />
            <Heading size="sm" mb={1}>No Requests Found</Heading>
            <Text color={muted} fontSize="xs" maxW="400px" mx="auto" mb={3}>
              No tasks or support tickets match the current filters.
            </Text>
            <Button size="xs" colorScheme="blue" variant="outline" onClick={clearAllFilters}>
              Reset Filters
            </Button>
          </Box>
        ) : viewMode === "grid" ? (
          /* Multi-Column Responsive Grid */
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3.5}>
            {filteredTasks.map((task) => {
              if (!task) return null;
              const taskId = task._id || task.id;
              const isTicket = isSupportTicket(task);
              const status = task.supportStatus || task.workflowStatus || task.status || "pending";
              const progress = task.progressPercent || (status === "approved" || status === "completed" ? 100 : 0);
              const senderName = String(task.requestedBy || task.createdBy?.fullName || task.createdBy?.username || "CS Officer");
              const dateStr = task.createdAt || task.requestedAt || task.date;

              return (
                <Card
                  key={taskId}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="xl"
                  boxShadow="sm"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: "blue.400",
                    boxShadow: "md",
                    transform: "translateY(-2px)",
                  }}
                  cursor="pointer"
                  onClick={() => handleInspect(task)}
                >
                  <CardBody p={3.5} display="flex" flexDirection="column" gap={2.5}>
                    {/* Header: Badges & Actions */}
                    <Flex justify="space-between" align="center" gap={2}>
                      <HStack spacing={1.5} wrap="wrap">
                        <Badge
                          colorScheme={isTicket ? "blue" : "purple"}
                          fontSize="2xs"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontWeight="extrabold"
                        >
                          {isTicket ? "🛡️ Support" : "🚀 External"}
                        </Badge>
                        <Badge colorScheme={getPriorityColor(task.priority)} fontSize="2xs" px={1.5} py={0.5} borderRadius="full">
                          {task.priority || "normal"}
                        </Badge>
                      </HStack>

                      <HStack spacing={1}>
                        <Badge colorScheme={getStatusColor(status)} fontSize="2xs" px={2} py={0.5} borderRadius="full" fontWeight="extrabold">
                          {String(status).replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          icon={<FiEye />}
                          aria-label="Inspect"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(task);
                          }}
                        />
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<FiTrash2 />}
                          aria-label="Delete"
                          isLoading={deletingId === taskId}
                          onClick={(e) => handleDeleteTask(task, e)}
                        />
                      </HStack>
                    </Flex>

                    {/* Title & Description */}
                    <Box>
                      <Heading size="xs" color={textColor} mb={1} noOfLines={1}>
                        {getTaskTitle(task)}
                      </Heading>
                      <Text fontSize="xs" color={muted} noOfLines={2}>
                        {task.supportRequestNote || task.description || "No specific instructions."}
                      </Text>
                    </Box>

                    {/* Sender Profile Box */}
                    <HStack spacing={2} p={2} bg={panelBg} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                      <Avatar size="xs" name={senderName} bg="blue.500" color="white" />
                      <Box minW={0} flex={1}>
                        <Text fontSize="xs" fontWeight="bold" color={textColor} isTruncated>
                          {senderName}
                        </Text>
                        <Text fontSize="2xs" color={muted} isTruncated>
                          {task.requestedDepartment || "Customer Service"}
                        </Text>
                      </Box>
                    </HStack>

                    {/* IT Progress */}
                    <Box>
                      <Flex justify="space-between" align="center" mb={1} fontSize="2xs">
                        <HStack spacing={1} color={muted}>
                          <Icon as={FiUserCheck} color="teal.500" />
                          <Text isTruncated maxW="150px">
                            {(Array.isArray(task.assignedTo) ? task.assignedTo : []).join(", ") || "Waiting IT assignment"}
                          </Text>
                        </HStack>
                        <Text fontWeight="bold" color="teal.600">
                          {progress}%
                        </Text>
                      </Flex>
                      <Progress value={progress} size="xs" colorScheme="teal" borderRadius="full" />
                    </Box>

                    {/* Footer Meta */}
                    <Flex justify="space-between" align="center" pt={1} borderTop="1px solid" borderColor={cardBorder} fontSize="2xs" color={muted}>
                      <HStack spacing={1}>
                        <Icon as={FiClock} />
                        <Text>{dateStr ? new Date(dateStr).toLocaleDateString() : "Recent"}</Text>
                      </HStack>

                      <HStack spacing={2}>
                        {task.requesterFeedback && Number(task.requesterFeedback.rating) > 0 && (
                          <HStack spacing={0.5} color="yellow.600">
                            <Icon as={FiStar} />
                            <Text>{task.requesterFeedback.rating}★</Text>
                          </HStack>
                        )}
                        {Array.isArray(task.comments) && task.comments.length > 0 && (
                          <HStack spacing={0.5} color="purple.500">
                            <Icon as={FiMessageSquare} />
                            <Text>{task.comments.length}</Text>
                          </HStack>
                        )}
                        <Text color="blue.500" fontWeight="bold">Details →</Text>
                      </HStack>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          /* Structured Table View */
          <Box bg={cardBg} borderRadius="xl" border="1px solid" borderColor={cardBorder} overflow="hidden" boxShadow="sm">
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead bg={panelBg}>
                  <Tr>
                    <Th fontSize="2xs">Type</Th>
                    <Th fontSize="2xs">Task Title</Th>
                    <Th fontSize="2xs">Sender (Officer)</Th>
                    <Th fontSize="2xs">Assigned IT</Th>
                    <Th fontSize="2xs">Progress</Th>
                    <Th fontSize="2xs">Priority</Th>
                    <Th fontSize="2xs">Status</Th>
                    <Th fontSize="2xs">Submitted</Th>
                    <Th fontSize="2xs" textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTasks.map((task) => {
                    if (!task) return null;
                    const taskId = task._id || task.id;
                    const isTicket = isSupportTicket(task);
                    const status = task.supportStatus || task.workflowStatus || task.status || "pending";
                    const progress = task.progressPercent || (status === "approved" || status === "completed" ? 100 : 0);
                    const senderName = String(task.requestedBy || task.createdBy?.fullName || task.createdBy?.username || "CS Officer");
                    const dateStr = task.createdAt || task.requestedAt || task.date;

                    return (
                      <Tr
                        key={taskId}
                        _hover={{ bg: tableRowHoverBg }}
                        cursor="pointer"
                        onClick={() => handleInspect(task)}
                      >
                        <Td>
                          <Badge colorScheme={isTicket ? "blue" : "purple"} fontSize="2xs" borderRadius="full">
                            {isTicket ? "Support" : "External"}
                          </Badge>
                        </Td>
                        <Td fontWeight="bold" fontSize="xs" maxW="200px" isTruncated>
                          {getTaskTitle(task)}
                        </Td>
                        <Td fontSize="xs">
                          <HStack spacing={1.5}>
                            <Avatar size="xs" name={senderName} bg="blue.500" color="white" />
                            <Text isTruncated maxW="120px">{senderName}</Text>
                          </HStack>
                        </Td>
                        <Td fontSize="xs" color={muted} maxW="140px" isTruncated>
                          {(Array.isArray(task.assignedTo) ? task.assignedTo : []).join(", ") || "Waiting assignment"}
                        </Td>
                        <Td minW="90px">
                          <HStack spacing={1.5}>
                            <Progress value={progress} size="xs" colorScheme="teal" borderRadius="full" flex={1} />
                            <Text fontSize="2xs" fontWeight="bold">{progress}%</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getPriorityColor(task.priority)} fontSize="2xs">
                            {task.priority || "normal"}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(status)} fontSize="2xs" borderRadius="full">
                            {String(status).replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </Td>
                        <Td fontSize="xs" color={muted}>
                          {dateStr ? new Date(dateStr).toLocaleDateString() : "-"}
                        </Td>
                        <Td textAlign="right">
                          <HStack spacing={1} justify="flex-end" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              icon={<FiEye />}
                              aria-label="Inspect"
                              onClick={() => handleInspect(task)}
                            />
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              icon={<FiTrash2 />}
                              aria-label="Delete"
                              isLoading={deletingId === taskId}
                              onClick={(e) => handleDeleteTask(task, e)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Detailed Inspection & Management Modal */}
        <Modal isOpen={isInspectOpen} onClose={onInspectClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={cardBorder}>
              <HStack spacing={2.5}>
                <Badge
                  colorScheme={isSupportTicket(selectedTask) ? "blue" : "purple"}
                  fontSize="xs"
                  px={2.5}
                  py={0.8}
                  borderRadius="full"
                >
                  {isSupportTicket(selectedTask) ? "🛡️ Support Ticket" : "🚀 External Project"}
                </Badge>
                <Heading size="md" noOfLines={1}>
                  {getTaskTitle(selectedTask)}
                </Heading>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={4}>
              {selectedTask && (
                <VStack align="stretch" spacing={4}>
                  {/* Sender Profile Header */}
                  <Card bg={panelBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
                    <CardBody p={3.5}>
                      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                        <HStack spacing={3}>
                          <Box bg="blue.500" color="white" borderRadius="full" p={2} boxSize="38px" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">
                            {String(selectedTask.requestedBy || selectedTask.createdBy?.fullName || selectedTask.createdBy?.username || "CS")[0] || "C"}
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="extrabold" color={textColor}>
                              {String(selectedTask.requestedBy || selectedTask.createdBy?.fullName || "Customer Service Officer")}
                            </Text>
                            <Text fontSize="xs" color={muted}>
                              Department: {selectedTask.requestedDepartment || "Customer Service"} | Sender Email: {selectedTask.createdBy?.email || "customer.service@tradethiopia.com"}
                            </Text>
                          </Box>
                        </HStack>

                        <HStack spacing={2}>
                          <Badge colorScheme={getPriorityColor(selectedTask.priority)} fontSize="xs" px={2.5} py={0.8} borderRadius="full">
                            {selectedTask.priority || "normal"} priority
                          </Badge>
                          <Badge colorScheme={getStatusColor(selectedTask.supportStatus || selectedTask.workflowStatus || selectedTask.status)} fontSize="xs" px={2.5} py={0.8} borderRadius="full">
                            {String(selectedTask.supportStatus || selectedTask.workflowStatus || selectedTask.status || "pending").replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>

                  {/* Task Description / Request Note */}
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={1}>
                      Request Description & Details
                    </Text>
                    <Box p={3} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
                      <Text fontSize="xs" whiteSpace="pre-wrap" color={textColor}>
                        {selectedTask.supportRequestNote || selectedTask.description || "No description provided."}
                      </Text>
                    </Box>
                  </Box>

                  {/* IT Workflow & Assignments */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Box p={3} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={1.5}>
                        IT Staff Assignment
                      </Text>
                      <VStack align="stretch" spacing={1} fontSize="xs">
                        <HStack justify="space-between">
                          <Text color={muted}>Assigned IT Staff:</Text>
                          <Text fontWeight="bold">{(Array.isArray(selectedTask.assignedTo) ? selectedTask.assignedTo : []).join(", ") || "Waiting assignment"}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted}>IT Team Leader:</Text>
                          <Text fontWeight="bold">{selectedTask.taskLeader || "Not assigned"}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted}>Manager Accepted:</Text>
                          <Text fontWeight="bold">{selectedTask.managerAcceptedAt ? new Date(selectedTask.managerAcceptedAt).toLocaleString() : "Pending review"}</Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Box p={3} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={1.5}>
                        Submission & Timeline
                      </Text>
                      <VStack align="stretch" spacing={1} fontSize="xs">
                        <HStack justify="space-between">
                          <Text color={muted}>Submitted At:</Text>
                          <Text fontWeight="bold">{selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString() : "Recently"}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted}>Category / Area:</Text>
                          <Text fontWeight="bold">{selectedTask.category || selectedTask.platform || selectedTask.ticketCategory || "Support"}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted}>Action Type:</Text>
                          <Text fontWeight="bold">{selectedTask.actionType || "Staff Request"}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </SimpleGrid>

                  {/* Latest Work Report by IT Staff */}
                  {getLatestWorkRecord(selectedTask) && (
                    <Box p={3} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase">
                          Latest IT Work Report
                        </Text>
                        <Badge colorScheme={getLatestWorkRecord(selectedTask).approvalStatus === "approved" ? "green" : "orange"}>
                          {getLatestWorkRecord(selectedTask).approvalStatus || "Submitted"}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
                        Work done by {getLatestWorkRecord(selectedTask).staffName || "IT Staff"}
                      </Text>
                      <Text fontSize="xs" color={textColor} mb={1.5}>
                        {getLatestWorkRecord(selectedTask).summary}
                      </Text>
                      <Text fontSize="2xs" color={muted}>
                        Completed: {getLatestWorkRecord(selectedTask).completedAt ? new Date(getLatestWorkRecord(selectedTask).completedAt).toLocaleString() : "No date"}
                      </Text>
                    </Box>
                  )}

                  {/* Sender Feedback */}
                  {selectedTask.requesterFeedback?.submittedAt && (
                    <Box p={3} bg="yellow.50" _dark={{ bg: "yellow.900" }} borderRadius="xl" border="1px solid" borderColor="yellow.200">
                      <HStack justify="space-between" mb={1}>
                        <HStack>
                          <Icon as={FiStar} color="yellow.500" />
                          <Text fontSize="xs" fontWeight="bold" color="yellow.800" _dark={{ color: "yellow.200" }}>
                            Customer Service Sender Feedback
                          </Text>
                        </HStack>
                        <Badge colorScheme="yellow" size="sm">
                          {selectedTask.requesterFeedback.rating} / 5 Stars
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="yellow.900" _dark={{ color: "yellow.100" }}>
                        &quot;{selectedTask.requesterFeedback.comment || "No comment provided."}&quot;
                      </Text>
                      <Text fontSize="2xs" color="yellow.700" _dark={{ color: "yellow.300" }} mt={1}>
                        Submitted {new Date(selectedTask.requesterFeedback.submittedAt).toLocaleString()} by {selectedTask.requesterFeedback.submittedBy || selectedTask.requestedBy}
                      </Text>
                    </Box>
                  )}

                  {/* Manager & IT Communication Thread */}
                  <Box>
                    <HStack justify="space-between" mb={1.5}>
                      <HStack>
                        <Icon as={FiMessageSquare} color="purple.500" />
                        <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase">
                          Manager & IT Discussion Thread
                        </Text>
                      </HStack>
                      <Badge colorScheme="purple" fontSize="2xs">
                        Sender & Manager Private
                      </Badge>
                    </HStack>

                    <VStack align="stretch" spacing={1.5} maxH="200px" overflowY="auto" mb={2.5} p={2} bg={panelBg} borderRadius="xl">
                      {(!Array.isArray(selectedTask.comments) || selectedTask.comments.length === 0) ? (
                        <Text fontSize="xs" color={muted} p={2}>No comments or manager notes posted yet.</Text>
                      ) : (
                        selectedTask.comments.map((c, idx) => (
                          <Box key={c._id || idx} p={2} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                            <HStack justify="space-between" mb={0.5}>
                              <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="bold">{c.authorName || "Manager / Staff"}</Text>
                                <Badge fontSize="2xs" colorScheme="purple">{c.authorRole || "CS Manager"}</Badge>
                              </HStack>
                              <Text fontSize="2xs" color={muted}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</Text>
                            </HStack>
                            <Text fontSize="xs">{c.body}</Text>
                          </Box>
                        ))
                      )}
                    </VStack>

                    <HStack spacing={2}>
                      <Input
                        size="sm"
                        placeholder="Add a manager note or reply to the IT team..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        borderRadius="lg"
                      />
                      <Button
                        size="sm"
                        colorScheme="purple"
                        leftIcon={<FiSend />}
                        onClick={handleSendComment}
                        isLoading={submittingComment}
                        isDisabled={!commentText.trim()}
                      >
                        Send
                      </Button>
                    </HStack>
                  </Box>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter borderTop="1px solid" borderColor={cardBorder} justify="space-between">
              {selectedTask && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  leftIcon={<FiTrash2 />}
                  isLoading={deletingId === (selectedTask._id || selectedTask.id)}
                  onClick={() => handleDeleteTask(selectedTask)}
                >
                  Delete Request
                </Button>
              )}
              <Button size="sm" onClick={onInspectClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
}
