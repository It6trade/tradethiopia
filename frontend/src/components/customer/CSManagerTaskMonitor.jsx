import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
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
  Tag,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronRight,
  FiClock,
  FiCornerDownRight,
  FiDownload,
  FiEye,
  FiFilter,
  FiLayers,
  FiMessageSquare,
  FiPaperclip,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiStar,
  FiTag,
  FiTool,
  FiTrash2,
  FiTrendingUp,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import Layout from "./Layout";
import axiosInstance from "../../services/axiosInstance";
import { useUserStore, normalizeRole } from "../../store/user";
import { getUserTaskAliases } from "../../pages/it/utils/itRbac";

const isManagerUser = (user = {}) => {
  const role = normalizeRole(user?.role || user?.userRole || user?.displayRole || "");
  return (
    role === "customersuccessmanager" ||
    role === "itmanager" ||
    role === "admin" ||
    role === "leader" ||
    role === "supervisor" ||
    role === "ceo" ||
    role === "coo" ||
    role === "salesmanager" ||
    role.includes("manager")
  );
};

const isSupportTicket = (task = {}) => (
  task.requestSource === "employee_call"
  || Boolean(task.supportRequestNote)
  || Boolean(task.requestedAt)
  || (task.ticketRecords || []).length > 0
  || task.actionType === "Employee Support Request"
);

const isCSExternalProject = (task = {}) => (
  task.projectType === "external"
  || task.actionType === "CS External IT Request"
  || task.actionType === "External CS Task Request"
  || String(task.description || task.supportRequestNote || "").includes("CS External")
);

const getTaskTitle = (task = {}) => task.taskName || task.client || task.platform || task.category || "Task Request";

const getStatusColor = (status = "") => {
  const s = String(status).toLowerCase();
  if (["approved", "completed", "done", "closed"].includes(s)) return "green";
  if (["in_progress", "submitted", "ongoing", "reported"].includes(s)) return "purple";
  if (["assigned", "staff_accepted"].includes(s)) return "blue";
  if (["rejected", "cancelled"].includes(s)) return "red";
  return "orange";
};

const getPriorityColor = (priority = "") => {
  const p = String(priority).toLowerCase();
  if (p === "critical") return "red";
  if (p === "high") return "orange";
  if (p === "low") return "gray";
  return "blue";
};

const getLatestWorkRecord = (task = {}) => (
  [...(task.ticketRecords || [])].sort(
    (a, b) => new Date(b.createdAt || b.completedAt || 0) - new Date(a.createdAt || a.completedAt || 0)
  )[0]
);

export default function CSManagerTaskMonitor() {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const userAliases = useMemo(() => getUserTaskAliases(currentUser || {}), [currentUser]);
  const isManager = useMemo(() => isManagerUser(currentUser), [currentUser]);

  // Styling Tokens
  const pageBgGradient = useColorModeValue(
    "linear-gradient(135deg, #f8fbff 0%, #f0f7ff 50%, #f9fbfd 100%)",
    "linear-gradient(135deg, #09111e 0%, #0d1728 50%, #080f1a 100%)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accentGradient = useColorModeValue(
    "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%)",
    "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #1d4ed8 100%)"
  );

  // Component States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'tickets' | 'projects'
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
      const customerRelated = data.filter((task) => (
        isSupportTicket(task) ||
        isCSExternalProject(task) ||
        String(task.requestedDepartment || "").toLowerCase().includes("customer") ||
        String(task.category || "").toLowerCase().includes("customer") ||
        task.projectType === "external"
      ));

      setTasks(customerRelated);
    } catch (error) {
      console.error("Failed to load manager oversight tasks:", error);
      toast({
        title: "Could not fetch tasks",
        description: error.response?.data?.message || error.message || "Failed to load tasks from backend.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // Derived Senders for filtering
  const uniqueSenders = useMemo(() => {
    const senders = new Set();
    tasks.forEach((t) => {
      if (t.requestedBy) senders.add(t.requestedBy.trim());
      if (t.createdBy?.fullName) senders.add(t.createdBy.fullName.trim());
      if (t.createdBy?.username) senders.add(t.createdBy.username.trim());
    });
    return Array.from(senders).filter(Boolean).sort();
  }, [tasks]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const tickets = tasks.filter(isSupportTicket).length;
    const projects = tasks.filter(isCSExternalProject).length;
    const pending = tasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["pending", "requested", "not_submitted", "pending_approval"].includes(s);
    }).length;
    const inProgress = tasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["in_progress", "assigned", "ongoing", "staff_accepted", "submitted", "reported"].includes(s);
    }).length;
    const completed = tasks.filter((t) => {
      const s = String(t.supportStatus || t.workflowStatus || t.status || "").toLowerCase();
      return ["approved", "completed", "done", "closed"].includes(s);
    }).length;
    const critical = tasks.filter((t) => ["critical", "high"].includes(String(t.priority).toLowerCase())).length;

    return { total, tickets, projects, pending, inProgress, completed, critical };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
          ...(task.assignedTo || []),
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
        const hasAssignment = (task.assignedTo || []).length > 0 || Boolean(task.taskLeader);
        if (assignmentFilter === "assigned" && !hasAssignment) return false;
        if (assignmentFilter === "waiting" && hasAssignment) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
      if (sortBy === "priority") {
        const rank = { critical: 4, high: 3, normal: 2, low: 1 };
        const pA = rank[String(a.priority).toLowerCase()] || 0;
        const pB = rank[String(b.priority).toLowerCase()] || 0;
        return pB - pA;
      }
      return 0;
    });
  }, [tasks, activeTab, searchQuery, statusFilter, priorityFilter, senderFilter, assignmentFilter, sortBy]);

  // Open Inspect Modal
  const handleInspect = (task) => {
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
      `"${(t.assignedTo || []).join(", ").replace(/"/g, '""')}"`,
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
      <Box minH="100%" bgGradient={pageBgGradient} p={{ base: 4, md: 6 }} borderRadius="2xl">
        {/* Header Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={4}
          mb={6}
        >
          <Box>
            <HStack spacing={3} mb={1}>
              <Icon as={FiLayers} boxSize={7} color="blue.500" />
              <Heading size="lg" color={textColor} fontWeight="extrabold">
                Manager Task Oversight & Support Monitor
              </Heading>
              <Badge colorScheme="purple" fontSize="xs" px={2.5} py={0.5} borderRadius="full">
                CS Manager Access
              </Badge>
            </HStack>
            <Text fontSize="sm" color={muted}>
              Executive visibility across all Support Requests to the Manager and Assigned External Projects submitted by Customer Service team members.
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
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
              Refresh Data
            </Button>
          </HStack>
        </Flex>

        {/* Executive KPI Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4, xl: 7 }} spacing={3} mb={6}>
          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Total Managed
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="blue.600">
                  {stats.total}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  All CS submissions
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Support Tickets
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="teal.600">
                  {stats.tickets}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  Manager requests
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  External Projects
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="purple.600">
                  {stats.projects}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  External IT tasks
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Pending Review
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="orange.500">
                  {stats.pending}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  Awaiting action
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  In Progress
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="blue.500">
                  {stats.inProgress}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  Active IT work
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Completed / Done
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="green.500">
                  {stats.completed}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  Finished requests
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm">
            <CardBody p={3.5}>
              <Stat>
                <StatLabel fontSize="2xs" color={muted} fontWeight="bold" textTransform="uppercase">
                  Critical / High
                </StatLabel>
                <StatNumber fontSize="xl" fontWeight="extrabold" color="red.500">
                  {stats.critical}
                </StatNumber>
                <StatHelpText fontSize="3xs" mb={0} color={muted}>
                  High priority
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* View Tabs & Multi-Filter Controls */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="2xl" mb={6} boxShadow="sm">
          <CardBody p={4}>
            <Tabs
              variant="soft-rounded"
              colorScheme="blue"
              value={activeTab}
              onChange={(index) => {
                const tabs = ["all", "tickets", "projects"];
                setActiveTab(tabs[index]);
              }}
              mb={4}
            >
              <TabList gap={2} wrap="wrap">
                <Tab fontSize="xs" fontWeight="bold">
                  All Requests ({stats.total})
                </Tab>
                <Tab fontSize="xs" fontWeight="bold">
                  🛡️ Support Requests to Manager ({stats.tickets})
                </Tab>
                <Tab fontSize="xs" fontWeight="bold">
                  🚀 Assigned External Projects ({stats.projects})
                </Tab>
              </TabList>
            </Tabs>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={3}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search task, client, sender..."
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
                <option value="all">All IT Assignments</option>
                <option value="assigned">Assigned / In Hand</option>
                <option value="waiting">Waiting IT Assignment</option>
              </Select>

              <HStack spacing={2}>
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
                <Button size="sm" variant="ghost" onClick={clearAllFilters} minW="60px" fontSize="xs">
                  Clear
                </Button>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Task List / Content Stream */}
        {loading ? (
          <Flex justify="center" align="center" minH="300px" bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder}>
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color={muted} fontSize="sm">Loading Customer Service tasks and support requests...</Text>
            </VStack>
          </Flex>
        ) : filteredTasks.length === 0 ? (
          <Box bg={cardBg} borderRadius="2xl" p={10} textAlign="center" border="1px solid" borderColor={cardBorder}>
            <Icon as={FiAlertCircle} boxSize={10} color="orange.400" mb={3} />
            <Heading size="md" mb={2}>No Requests Found</Heading>
            <Text color={muted} fontSize="sm" maxW="450px" mx="auto" mb={4}>
              No support tickets or external project requests match the current tab, search query, or filters.
            </Text>
            <Button size="sm" colorScheme="blue" variant="outline" onClick={clearAllFilters}>
              Reset All Filters
            </Button>
          </Box>
        ) : (
          <VStack align="stretch" spacing={3.5}>
            {filteredTasks.map((task) => {
              const taskId = task._id || task.id;
              const isTicket = isSupportTicket(task);
              const status = task.supportStatus || task.workflowStatus || task.status || "pending";
              const latestRecord = getLatestWorkRecord(task);
              const progress = task.progressPercent || (status === "approved" || status === "completed" ? 100 : 0);
              const senderName = task.requestedBy || task.createdBy?.fullName || task.createdBy?.username || "CS Officer";
              const senderEmail = task.createdBy?.email || "customer.service@tradethiopia.com";
              const dateStr = task.createdAt || task.requestedAt || task.date;

              return (
                <Box
                  key={taskId}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="2xl"
                  p={4.5}
                  boxShadow="sm"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: "blue.300",
                    boxShadow: "md",
                    transform: "translateY(-1px)",
                  }}
                  cursor="pointer"
                  onClick={() => handleInspect(task)}
                >
                  <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={3}>
                    {/* Left: Task Identity & Sender Badges */}
                    <HStack spacing={3} wrap="wrap" flex={1}>
                      <Badge
                        colorScheme={isTicket ? "blue" : "purple"}
                        fontSize="2xs"
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        textTransform="uppercase"
                        fontWeight="extrabold"
                      >
                        {isTicket ? "🛡️ Support Request" : "🚀 External Project"}
                      </Badge>

                      <Badge colorScheme={getPriorityColor(task.priority)} fontSize="2xs" px={2} py={0.5} borderRadius="full">
                        {task.priority || "normal"} priority
                      </Badge>

                      <HStack spacing={1.5} bg={panelBg} px={2.5} py={0.8} borderRadius="full" border="1px solid" borderColor={cardBorder}>
                        <Icon as={FiUser} boxSize={3.5} color="blue.500" />
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          Sender: {senderName}
                        </Text>
                        <Text fontSize="2xs" color={muted}>
                          ({task.requestedDepartment || "Customer Service"})
                        </Text>
                      </HStack>
                    </HStack>

                    {/* Right: Status Badge & Quick Actions */}
                    <HStack spacing={2} alignSelf={{ base: "flex-end", md: "center" }}>
                      <Badge colorScheme={getStatusColor(status)} fontSize="xs" px={3} py={1} borderRadius="full" fontWeight="extrabold">
                        {String(status).replace(/_/g, " ").toUpperCase()}
                      </Badge>

                      <Tooltip label="Inspect Request Details" hasArrow>
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
                      </Tooltip>

                      <Tooltip label="Delete Request (Manager only)" hasArrow>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<FiTrash2 />}
                          aria-label="Delete"
                          isLoading={deletingId === taskId}
                          onClick={(e) => handleDeleteTask(task, e)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>

                  {/* Title & Description Preview */}
                  <Box mb={3}>
                    <Heading size="sm" color={textColor} mb={1}>
                      {getTaskTitle(task)}
                    </Heading>
                    <Text fontSize="xs" color={muted} noOfLines={2}>
                      {task.supportRequestNote || task.description || "No specific instructions provided."}
                    </Text>
                  </Box>

                  {/* Progress & Workflow Status */}
                  <Box bg={panelBg} p={3} borderRadius="xl" mb={3}>
                    <Flex justify="space-between" align="center" mb={1.5}>
                      <HStack spacing={2}>
                        <Icon as={FiTrendingUp} boxSize={3.5} color="teal.500" />
                        <Text fontSize="2xs" fontWeight="bold" color={muted}>
                          IT Execution Progress
                        </Text>
                      </HStack>
                      <Text fontSize="xs" fontWeight="extrabold" color="teal.600">
                        {progress}%
                      </Text>
                    </Flex>
                    <Progress value={progress} size="xs" colorScheme="teal" borderRadius="full" />
                  </Box>

                  {/* Footer Meta: Dates, Assigned Staff, Feedback */}
                  <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={2} fontSize="2xs" color={muted}>
                    <HStack spacing={3} wrap="wrap">
                      <HStack spacing={1}>
                        <Icon as={FiClock} />
                        <Text>Submitted: {dateStr ? new Date(dateStr).toLocaleString() : "Recently"}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiUserCheck} color="teal.500" />
                        <Text>Assigned IT: {(task.assignedTo || []).join(", ") || "Waiting assignment"}</Text>
                      </HStack>
                      {task.taskLeader && (
                        <Text>Leader: <strong>{task.taskLeader}</strong></Text>
                      )}
                    </HStack>

                    <HStack spacing={3}>
                      {task.requesterFeedback?.rating > 0 && (
                        <Tag size="sm" colorScheme="yellow" borderRadius="full">
                          <Icon as={FiStar} mr={1} />
                          {task.requesterFeedback.rating}/5 rating
                        </Tag>
                      )}

                      {(task.comments || []).length > 0 && (
                        <HStack spacing={1}>
                          <Icon as={FiMessageSquare} color="purple.500" />
                          <Text>{(task.comments || []).length} note(s)</Text>
                        </HStack>
                      )}

                      <Button size="xs" variant="link" colorScheme="blue" rightIcon={<FiChevronRight />}>
                        View Details
                      </Button>
                    </HStack>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        )}

        {/* Detailed Inspection & Management Modal */}
        <Modal isOpen={isInspectOpen} onClose={onInspectClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={cardBorder}>
              <HStack spacing={2.5}>
                <Badge
                  colorScheme={isSupportTicket(selectedTask || {}) ? "blue" : "purple"}
                  fontSize="xs"
                  px={2.5}
                  py={0.8}
                  borderRadius="full"
                >
                  {isSupportTicket(selectedTask || {}) ? "🛡️ Support Ticket" : "🚀 External Project"}
                </Badge>
                <Heading size="md" noOfLines={1}>
                  {getTaskTitle(selectedTask || {})}
                </Heading>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={5}>
              {selectedTask && (
                <VStack align="stretch" spacing={5}>
                  {/* Sender Profile Header */}
                  <Card bg={panelBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
                    <CardBody p={4}>
                      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                        <HStack spacing={3}>
                          <Box bg="blue.500" color="white" borderRadius="full" p={2.5} boxSize="42px" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">
                            {(selectedTask.requestedBy || selectedTask.createdBy?.fullName || "CS")[0]}
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="extrabold" color={textColor}>
                              {selectedTask.requestedBy || selectedTask.createdBy?.fullName || "Customer Service Officer"}
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
                    <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={1.5}>
                      Request Description & Details
                    </Text>
                    <Box p={3.5} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
                      <Text fontSize="sm" whiteSpace="pre-wrap" color={textColor}>
                        {selectedTask.supportRequestNote || selectedTask.description || "No description provided."}
                      </Text>
                    </Box>
                  </Box>

                  {/* IT Workflow & Assignments */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Box p={3.5} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={2}>
                        IT Staff Assignment
                      </Text>
                      <VStack align="stretch" spacing={1.5} fontSize="xs">
                        <HStack justify="space-between">
                          <Text color={muted}>Assigned IT Staff:</Text>
                          <Text fontWeight="bold">{(selectedTask.assignedTo || []).join(", ") || "Waiting assignment"}</Text>
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

                    <Box p={3.5} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" mb={2}>
                        Submission & Timeline
                      </Text>
                      <VStack align="stretch" spacing={1.5} fontSize="xs">
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
                    <Box p={3.5} bg={panelBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <HStack justify="space-between" mb={1.5}>
                        <Text fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase">
                          Latest IT Work Report
                        </Text>
                        <Badge colorScheme={getLatestWorkRecord(selectedTask).approvalStatus === "approved" ? "green" : "orange"}>
                          {getLatestWorkRecord(selectedTask).approvalStatus || "Submitted"}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                        Work done by {getLatestWorkRecord(selectedTask).staffName || "IT Staff"}
                      </Text>
                      <Text fontSize="xs" color={textColor} mb={2}>
                        {getLatestWorkRecord(selectedTask).summary}
                      </Text>
                      <Text fontSize="2xs" color={muted}>
                        Completed: {getLatestWorkRecord(selectedTask).completedAt ? new Date(getLatestWorkRecord(selectedTask).completedAt).toLocaleString() : "No date"}
                      </Text>
                    </Box>
                  )}

                  {/* Sender Feedback */}
                  {selectedTask.requesterFeedback?.submittedAt && (
                    <Box p={3.5} bg="yellow.50" _dark={{ bg: "yellow.900" }} borderRadius="xl" border="1px solid" borderColor="yellow.200">
                      <HStack justify="space-between" mb={1.5}>
                        <HStack>
                          <Icon as={FiStar} color="yellow.500" />
                          <Text fontSize="xs" fontWeight="bold" color="yellow.800" _dark={{ color: "yellow.200" }}>
                            Customer Service Sender Feedback
                          </Text>
                        </HStack>
                        <Tag colorScheme="yellow" size="sm">
                          {selectedTask.requesterFeedback.rating} / 5 Stars
                        </Tag>
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
                    <HStack justify="space-between" mb={2}>
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

                    <VStack align="stretch" spacing={2} maxH="220px" overflowY="auto" mb={3} p={2} bg={panelBg} borderRadius="xl">
                      {(selectedTask.comments || []).length === 0 ? (
                        <Text fontSize="xs" color={muted} p={2}>No comments or manager notes posted yet.</Text>
                      ) : (
                        (selectedTask.comments || []).map((c, idx) => (
                          <Box key={c._id || idx} p={2.5} bg={cardBg} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                            <HStack justify="space-between" mb={1}>
                              <HStack spacing={1.5}>
                                <Text fontSize="xs" fontWeight="bold">{c.authorName || "Manager / Staff"}</Text>
                                <Badge fontSize="3xs" colorScheme="purple">{c.authorRole || "CS Manager"}</Badge>
                              </HStack>
                              <Text fontSize="3xs" color={muted}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</Text>
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
