import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiMessageSquare,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiStar,
  FiTool,
  FiTrash2,
  FiUserCheck,
} from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import { useUserStore } from "../../store/user";
import { getUserTaskAliases } from "../../pages/it/utils/itRbac";
import ChatLauncher from "../chat/ChatLauncher";

const EXTERNAL_TYPES = [
  { value: "software", label: "Software / System Work" },
  { value: "account", label: "Account / Access Work" },
  { value: "network", label: "Network / Connectivity" },
  { value: "security", label: "Security Review" },
  { value: "support", label: "General External Support" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
  { value: "low", label: "Low" },
];

const getDisplayName = (user = {}) => (
  user.fullName || user.username || user.email || "Customer Service"
);

const getTaskTitle = (task = {}) => task.taskName || task.client || task.category || "External project";

const appendSelectedFileNames = (currentValue = "", fileList = []) => {
  const names = Array.from(fileList || []).map((file) => file.name).filter(Boolean);
  if (!names.length) return currentValue;
  return [currentValue, names.join("\n")].filter(Boolean).join("\n");
};

const isCSExternalProjectRequest = (task = {}) => (
  task.projectType === "external"
  && (
    task.requestSource === "staff_request"
    || task.actionType === "CS External IT Request"
    || task.actionType === "External CS Task Request"
    || String(task.description || task.supportRequestNote || "").includes("CS External")
  )
);

const getStatusColor = (task = {}) => {
  const status = task.workflowStatus || task.status || "pending";
  if (["approved", "completed", "done"].includes(status)) return "green";
  if (["submitted", "in_progress", "ongoing"].includes(status)) return "purple";
  if (status === "assigned") return "blue";
  if (status === "rejected") return "red";
  return "orange";
};

const getTypeColor = (type = "") => {
  if (type === "comment") return "blue";
  if (type === "reminder") return "purple";
  if (type === "task") return "orange";
  if (type === "report") return "green";
  return "gray";
};

const hasManagerAcceptedProject = (task = {}) => (
  Boolean(task.managerAcceptedAt)
  || Boolean(task.taskLeader)
  || (task.assignedTo || []).length > 0
  || ["assigned", "in_progress", "submitted", "approved", "completed"].includes(task.workflowStatus)
  || ["ongoing", "done"].includes(task.status)
);

const getProgressValue = (task = {}) => {
  if (!hasManagerAcceptedProject(task)) return 0;
  if (Number(task.progressPercent) > 0) return Number(task.progressPercent);
  if (task.workflowStatus === "completed" || task.status === "done") return 100;
  if (task.workflowStatus === "approved") return 100;
  if (task.workflowStatus === "submitted") return 90;
  if (task.workflowStatus === "in_progress" || task.status === "ongoing") return 60;
  return 35;
};

const getLatestWorkRecord = (task = {}) => (
  [...(task.ticketRecords || [])].sort((a, b) => new Date(b.createdAt || b.completedAt || 0) - new Date(a.createdAt || a.completedAt || 0))[0]
);

const canCurrentUserGiveFeedback = (task = {}, aliases = []) => {
  if (!task || !aliases || !Array.isArray(aliases)) return false;
  const req = String(task.requestedBy || "").trim().toLowerCase();
  const created = String(task.createdBy?._id || task.createdBy || "").trim().toLowerCase();
  return Boolean((req && aliases.includes(req)) || (created && aliases.includes(created)));
};

const isFeedbackOpen = (task = {}) => (
  ["approved", "completed"].includes(task.workflowStatus)
  || ["done"].includes(task.status)
  || (task.ticketRecords || []).some((record) => record.approvalStatus === "approved")
);

export default function CSExternalITRequestsPanel({ focusedTaskId = "", focusedCommentId = "", focusedNotification = {} }) {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const projectRefs = useRef({});
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");
  const shellBg = useColorModeValue(
    "linear-gradient(135deg, #f8fafc 0%, #eefdf8 46%, #eef2ff 100%)",
    "linear-gradient(135deg, #111827 0%, #0f172a 52%, #172554 100%)"
  );
  const formPanelBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(17,24,39,0.92)");
  const listPanelBg = useColorModeValue("rgba(255,255,255,0.86)", "rgba(15,23,42,0.86)");

  const showRequestToast = useCallback(({ title, description, status = "info" }) => {
    const tone = {
      success: { color: "green.500", bg: "green.50", icon: FiCheckCircle },
      error: { color: "red.500", bg: "red.50", icon: FiAlertTriangle },
      warning: { color: "orange.500", bg: "orange.50", icon: FiAlertTriangle },
      info: { color: "blue.500", bg: "blue.50", icon: FiShield },
    }[status] || { color: "blue.500", bg: "blue.50", icon: FiShield };

    toast({
      position: "top",
      duration: status === "error" ? 5000 : 3500,
      isClosable: true,
      render: ({ onClose }) => (
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={tone.color}
          borderLeftWidth="5px"
          borderRadius="xl"
          boxShadow="0 18px 45px rgba(15, 23, 42, 0.18)"
          p={3}
          w={{ base: "calc(100vw - 32px)", sm: "420px" }}
          mx="auto"
        >
          <HStack align="start" spacing={3}>
            <Flex boxSize="34px" borderRadius="lg" bg={tone.bg} color={tone.color} align="center" justify="center" flexShrink={0}>
              <Icon as={tone.icon} />
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="900">{title}</Text>
              {description && <Text fontSize="xs" color={muted} mt={0.5}>{description}</Text>}
            </Box>
            <IconButton type="button" aria-label="Close alert" size="xs" variant="ghost" icon={<Text fontSize="md">x</Text>} onClick={onClose} />
          </HStack>
        </Box>
      ),
    });
  }, [cardBg, muted, toast]);

  const [submitting, setSubmitting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projects, setProjects] = useState([]);
  const [feedbackSavingId, setFeedbackSavingId] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentSavingId, setCommentSavingId] = useState("");
  const [expandedProjectIds, setExpandedProjectIds] = useState({});
  const [projectSearch, setProjectSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [quickView, setQuickView] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectPendingDelete, setProjectPendingDelete] = useState(null);
  const [form, setForm] = useState({
    taskName: "",
    ticketCategory: "software",
    priority: "normal",
    client: "",
    category: "Customer Service External Request",
    requestedBy: getDisplayName(currentUser),
    requestedDepartment: currentUser?.department || "Customer Service",
    summary: "",
    attachments: "",
  });

  const userAliases = useMemo(() => getUserTaskAliases(currentUser || {}), [currentUser]);

  const isManager = useMemo(() => {
    const role = String(currentUser?.role || currentUser?.displayRole || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return ["customersuccessmanager", "csmanager", "admin", "itmanager", "itadmin"].includes(role);
  }, [currentUser]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      requestedBy: prev.requestedBy || getDisplayName(currentUser),
      requestedDepartment: prev.requestedDepartment || currentUser?.department || "Customer Service",
    }));
  }, [currentUser]);

  const fetchExternalProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await axiosInstance.get("/it?projectType=external");
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const visibleProjects = data
        .filter(isCSExternalProjectRequest)
        .filter((task) => (
          isManager
          || userAliases.includes(String(task.requestedBy || "").trim().toLowerCase())
          || userAliases.includes(String(task.createdBy || "").trim().toLowerCase())
          || String(task.requestedDepartment || "").toLowerCase().includes("customer")
          || String(task.category || "").toLowerCase().includes("customer")
        ));
      setProjects(visibleProjects);
    } catch (error) {
      console.error("Unable to load CS external IT projects", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [userAliases, isManager]);

  useEffect(() => {
    fetchExternalProjects();
  }, [fetchExternalProjects]);

  useEffect(() => {
    if (!focusedTaskId) return;
    setProjectSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignmentFilter("all");
    setQuickView("all");
    setSelectedProjectId(focusedTaskId);
    setExpandedProjectIds((prev) => ({
      ...prev,
      [focusedTaskId]: true,
    }));
  }, [focusedTaskId, focusedCommentId]);

  const submitExternalProjectRequest = async () => {
    if (!form.taskName.trim() || !form.summary.trim()) {
      showRequestToast({
        title: "External project title and details are required",
        status: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/it", {
        taskName: form.taskName.trim(),
        projectType: "external",
        requestSource: "staff_request",
        actionType: "CS External IT Request",
        client: form.client.trim(),
        category: form.category || "Customer Service External Request",
        ticketCategory: form.ticketCategory,
        priority: form.priority,
        requestedBy: form.requestedBy || getDisplayName(currentUser),
        requestedDepartment: form.requestedDepartment || "Customer Service",
        description: `[CS External IT Request] ${form.summary.trim()}`,
        attachments: form.attachments,
        status: "pending",
        workflowStatus: "pending",
        progressPercent: 0,
      });
      const created = response.data?.data;
      if (created) {
        setProjects((prev) => [created, ...prev].slice(0, 12));
      }
      setForm((prev) => ({
        ...prev,
        taskName: "",
        ticketCategory: "software",
        priority: "normal",
        client: "",
        category: "Customer Service External Request",
        summary: "",
        attachments: "",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      showRequestToast({
        title: "External project request sent to IT manager",
        description: "The manager can review, assign, and track it as an external IT project.",
        status: "success",
      });
    } catch (error) {
      showRequestToast({
        title: "External project request failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitProjectFeedback = async (task) => {
    const taskId = task._id || task.id;
    const draft = feedbackDrafts[taskId] || {};
    const rating = Number(draft.rating || task.requesterFeedback?.rating || 0);
    if (!rating) {
      showRequestToast({ title: "Please select a rating", status: "warning" });
      return;
    }

    setFeedbackSavingId(taskId);
    try {
      const response = await axiosInstance.post(`/it/${taskId}/feedback`, {
        rating,
        comment: draft.comment ?? task.requesterFeedback?.comment ?? "",
        submittedBy: getDisplayName(currentUser),
      });
      const updated = response.data?.data;
      if (updated) {
        setProjects((prev) => prev.map((item) => (
          String(item._id || item.id) === String(taskId) ? updated : item
        )));
      }
      showRequestToast({ title: "External project feedback saved", status: "success" });
    } catch (error) {
      showRequestToast({
        title: "Feedback failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setFeedbackSavingId("");
    }
  };

  const submitProjectComment = async (task) => {
    const taskId = task._id || task.id;
    const body = String(commentDrafts[taskId] || "").trim();
    if (!body) return;

    setCommentSavingId(taskId);
    try {
      const response = await axiosInstance.post(`/it/${taskId}/comments`, { body, audience: "cs_manager" });
      const updated = response.data?.data;
      if (updated) {
        setProjects((prev) => prev.map((item) => (
          String(item._id || item.id) === String(taskId) ? updated : item
        )));
      }
      setCommentDrafts((prev) => ({ ...prev, [taskId]: "" }));
      showRequestToast({ title: "Comment sent to IT", status: "success" });
    } catch (error) {
      showRequestToast({
        title: "Comment failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setCommentSavingId("");
    }
  };

  const [deletingProjectId, setDeletingProjectId] = useState("");

  const canUserDeleteProject = useCallback((task = {}) => {
    if (isManager) return true;
    const reqBy = String(task.requestedBy || "").trim().toLowerCase();
    const createdBy = String(task.createdBy?._id || task.createdBy || "").trim().toLowerCase();
    const submitter = String(task.submittedBy?._id || task.submittedBy || "").trim().toLowerCase();
    const userId = String(currentUser?._id || currentUser?.id || "").trim().toLowerCase();
    return (
      userAliases.includes(reqBy) ||
      userAliases.includes(createdBy) ||
      userAliases.includes(submitter) ||
      (userId && (userId === createdBy || userId === submitter))
    );
  }, [currentUser, isManager, userAliases]);

  const handleDeleteProject = async (task) => {
    const taskId = task._id || task.id;
    setDeletingProjectId(taskId);
    try {
      await axiosInstance.delete(`/it/${taskId}`);
      setProjects((prev) => prev.filter((item) => (item._id || item.id) !== taskId));
      setProjectPendingDelete(null);
      showRequestToast({
        title: "External project deleted",
        description: `${getTaskTitle(task)} was removed successfully.`,
        status: "success",
      });
    } catch (error) {
      showRequestToast({
        title: "Failed to delete project",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setDeletingProjectId("");
    }
  };

  const displayedProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    const priorityRank = { critical: 0, high: 1, normal: 2, low: 3 };
    return projects.filter((task) => {
      const workflow = String(task.workflowStatus || task.status || "pending").toLowerCase();
      const priority = String(task.priority || "normal").toLowerCase();
      const assigned = hasManagerAcceptedProject(task);
      const searchable = [
        getTaskTitle(task),
        task.client,
        task.category,
        task.requestedBy,
        task.requestedDepartment,
        task.taskLeader,
        ...(task.assignedTo || []),
        task.description,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === "all" || workflow === statusFilter;
      const matchesPriority = priorityFilter === "all" || priority === priorityFilter;
      const matchesAssignment = assignmentFilter === "all"
        || (assignmentFilter === "assigned" && assigned)
        || (assignmentFilter === "waiting" && !assigned);
      const matchesQuickView = quickView === "all"
        || (quickView === "priority" && ["critical", "high"].includes(priority))
        || (quickView === "active" && ["assigned", "in_progress", "submitted", "ongoing"].includes(workflow))
        || (quickView === "waiting" && !assigned)
        || (quickView === "closed" && ["approved", "completed", "done", "rejected"].includes(workflow));

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignment && matchesQuickView;
    }).sort((a, b) => {
      if (quickView === "priority") {
        const aPriority = priorityRank[String(a.priority || "normal").toLowerCase()] ?? 4;
        const bPriority = priorityRank[String(b.priority || "normal").toLowerCase()] ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [assignmentFilter, priorityFilter, projectSearch, projects, quickView, statusFilter]);

  const focusedProject = useMemo(() => (
    focusedTaskId
      ? projects.find((task) => String(task._id || task.id) === String(focusedTaskId))
      : null
  ), [focusedTaskId, projects]);

  const selectedProject = useMemo(() => (
    selectedProjectId
      ? projects.find((task) => String(task._id || task.id) === String(selectedProjectId))
      : null
  ), [projects, selectedProjectId]);

  useEffect(() => {
    if (!focusedTaskId || loadingProjects) return undefined;
    const timer = window.setTimeout(() => {
      projectRefs.current[focusedTaskId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [displayedProjects, focusedTaskId, loadingProjects]);

  const clearProjectFilters = () => {
    setProjectSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignmentFilter("all");
    setQuickView("all");
  };

  return (
    <Card bg={shellBg} borderColor="whiteAlpha.700" borderWidth="1px" borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.12)" overflow="hidden">
      <CardBody p={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={5}>
          <HStack align="center" spacing={4}>
            <Flex boxSize="52px" borderRadius="2xl" bg="teal.400" color="white" align="center" justify="center" boxShadow="0 16px 34px rgba(20, 184, 166, 0.28)">
              <Icon as={FiTool} boxSize={6} />
            </Flex>
            <Box>
              <HStack mb={1} wrap="wrap">
                <Badge colorScheme="teal" borderRadius="full" px={3}>CS to IT</Badge>
                <Badge colorScheme="purple" borderRadius="full" px={3}>External Project</Badge>
              </HStack>
              <Heading size="lg" color={headingColor}>CS External IT Requests</Heading>
              <Text color={muted} maxW="760px">Submit external Customer Service task requests to IT, track manager assignment, chat with IT, and send completion feedback.</Text>
            </Box>
          </HStack>
          <HStack alignSelf={{ base: "flex-start", md: "center" }} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={2} boxShadow="sm">
            <Badge colorScheme="purple" borderRadius="full" px={3}>Workflow Live</Badge>
            <ChatLauncher
              icon={<FiMessageSquare size={18} />}
              ariaLabel="Chat with IT manager or assigned IT staff"
              preferredView="it"
              iconButtonProps={{ size: "sm", colorScheme: "blue", variant: "outline" }}
            />
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
          <Card bg={formPanelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)" backdropFilter="blur(12px)">
            <CardBody p={{ base: 4, md: 5 }}>
              <HStack mb={4} spacing={3} align="start">
                <Flex boxSize="40px" borderRadius="xl" bg="teal.50" color="teal.500" align="center" justify="center" flexShrink={0}>
                  <Icon as={FiTool} />
                </Flex>
                <Box>
                  <Heading size="md">Submit External Task Request</Heading>
                  <Text fontSize="sm" color={muted}>Create an external IT project request for manager review and assignment.</Text>
                </Box>
              </HStack>

              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Requester</FormLabel>
                    <Input bg={cardBg} value={form.requestedBy} onChange={(event) => setForm({ ...form, requestedBy: event.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Department</FormLabel>
                    <Input bg={cardBg} value={form.requestedDepartment} onChange={(event) => setForm({ ...form, requestedDepartment: event.target.value })} />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>External task title</FormLabel>
                  <Input
                    value={form.taskName}
                    onChange={(event) => setForm({ ...form, taskName: event.target.value })}
                    placeholder="Example: Customer portal quotation bug"
                    bg={cardBg}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Client / customer</FormLabel>
                    <Input
                      value={form.client}
                      onChange={(event) => setForm({ ...form, client: event.target.value })}
                      placeholder="Customer, company, or external project"
                      bg={cardBg}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>External category</FormLabel>
                    <Input
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                      placeholder="Portal, CRM, sales system, website..."
                      bg={cardBg}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Work type</FormLabel>
                    <Select bg={cardBg} value={form.ticketCategory} onChange={(event) => setForm({ ...form, ticketCategory: event.target.value })}>
                      {EXTERNAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Priority</FormLabel>
                    <Select bg={cardBg} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                      {PRIORITIES.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Request details</FormLabel>
                  <Textarea
                    minH="120px"
                    value={form.summary}
                    onChange={(event) => setForm({ ...form, summary: event.target.value })}
                    placeholder="Describe the external customer need, expected IT work, affected workflow, urgency, and any deadline."
                    bg={cardBg}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Attachments or reference links</FormLabel>
                  <VStack align="stretch" spacing={2}>
                    <Textarea
                      minH="80px"
                      value={form.attachments}
                      onChange={(event) => setForm({ ...form, attachments: event.target.value })}
                      placeholder="Paste links or select files from your folder. Separate each item by comma or new line."
                      bg={cardBg}
                    />
                    <Button as="label" size="sm" variant="outline" colorScheme="teal" leftIcon={<FiPaperclip />} alignSelf="flex-start" cursor="pointer">
                      Select from Folder
                      <Input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        display="none"
                        onChange={(event) => setForm({
                          ...form,
                          attachments: appendSelectedFileNames(form.attachments, event.target.files),
                        })}
                      />
                    </Button>
                  </VStack>
                </FormControl>

                <Button colorScheme="teal" leftIcon={<FiSend />} onClick={submitExternalProjectRequest} isLoading={submitting} h="46px" borderRadius="xl" boxShadow="0 14px 28px rgba(20, 184, 166, 0.24)">
                  Send External Project to IT Manager
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={listPanelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)" backdropFilter="blur(12px)">
            <CardBody p={{ base: 4, md: 5 }}>
              <Flex justify="space-between" align="start" gap={3} mb={3}>
                <HStack align="start">
                  <Flex boxSize="40px" borderRadius="xl" bg="blue.50" color="blue.500" align="center" justify="center" flexShrink={0}>
                    <Icon as={FiShield} />
                  </Flex>
                  <Box>
                    <Heading size="md">Assigned External Projects</Heading>
                    <Text fontSize="sm" color={muted}>Track manager review, responsible IT members, project progress, work reports, and CS feedback.</Text>
                  </Box>
                </HStack>
                <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" colorScheme="blue" borderRadius="xl" onClick={fetchExternalProjects} isLoading={loadingProjects}>
                  Refresh
                </Button>
              </Flex>

              <VStack align="stretch" spacing={3} mb={4}>
                {focusedTaskId && (
                  <Box
                    bg={cardBg}
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="xl"
                    p={4}
                    boxShadow="0 16px 42px rgba(37, 99, 235, 0.12)"
                  >
                    <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                      <Box>
                        <HStack mb={1} wrap="wrap">
                          <Badge colorScheme="blue">Opened Notification</Badge>
                          {focusedNotification.noticeType && (
                            <Badge colorScheme={getTypeColor(focusedNotification.noticeType)} variant="subtle">
                              {focusedNotification.noticeType}
                            </Badge>
                          )}
                          {focusedNotification.noticeTime && (
                            <Text fontSize="xs" color={muted}>
                              {new Date(focusedNotification.noticeTime).toLocaleString()}
                            </Text>
                          )}
                        </HStack>
                        <Text fontWeight="900">
                          {focusedNotification.noticeTitle || "Task update opened from notification"}
                        </Text>
                        {(focusedNotification.noticeText || focusedNotification.noticeDetail) && (
                          <Text fontSize="sm" color={muted} mt={1}>
                            {focusedNotification.noticeText || focusedNotification.noticeDetail}
                          </Text>
                        )}
                        {focusedNotification.noticePreview && (
                          <Text fontSize="sm" color={muted} mt={1}>
                            &quot;{focusedNotification.noticePreview}&quot;
                          </Text>
                        )}
                      </Box>
                      {focusedProject ? (
                        <Box minW={{ base: "100%", md: "260px" }}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color={muted}>Current progress</Text>
                            <Text fontSize="xs" fontWeight="900">{getProgressValue(focusedProject)}%</Text>
                          </HStack>
                          <Box h="9px" bg="gray.200" borderRadius="full" overflow="hidden">
                            <Box h="100%" w={`${getProgressValue(focusedProject)}%`} bg="blue.400" transition="width 0.3s ease" />
                          </Box>
                          <Text fontSize="xs" color={muted} mt={2}>
                            Assigned: {(focusedProject.assignedTo || []).join(", ") || "Waiting manager assignment"}
                          </Text>
                        </Box>
                      ) : (
                        <Text fontSize="sm" color={muted}>Loading the related project details...</Text>
                      )}
                    </Flex>
                  </Box>
                )}

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <Input
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                    placeholder="Search project, customer, leader, staff, or detail..."
                    bg={cardBg}
                  />
                  <HStack spacing={2}>
                    <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} bg={cardBg}>
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                    <Button size="sm" variant="outline" onClick={clearProjectFilters} minW="80px">
                      Clear
                    </Button>
                  </HStack>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} bg={cardBg}>
                    <option value="all">All priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </Select>
                  <Select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} bg={cardBg}>
                    <option value="all">All assignments</option>
                    <option value="assigned">Assigned or accepted</option>
                    <option value="waiting">Waiting assignment</option>
                  </Select>
                </SimpleGrid>
                <Flex
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="xl"
                  p={3}
                  justify="space-between"
                  align={{ base: "stretch", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  gap={3}
                >
                  <Box>
                    <Text fontWeight="800">Quick View</Text>
                    <Text fontSize="sm" color={muted}>Choose the shortest path for the project list.</Text>
                  </Box>
                  <RadioGroup value={quickView} onChange={setQuickView}>
                    <HStack spacing={3} wrap="wrap">
                      <Radio value="all">All</Radio>
                      <Radio value="priority">Priority</Radio>
                      <Radio value="active">Active</Radio>
                      <Radio value="waiting">Waiting</Radio>
                      <Radio value="closed">Closed</Radio>
                    </HStack>
                  </RadioGroup>
                  <Badge colorScheme="purple" alignSelf={{ base: "flex-start", md: "center" }}>
                    {displayedProjects.length} / {projects.length}
                  </Badge>
                </Flex>
              </VStack>

              <VStack align="stretch" spacing={3} maxH="760px" overflowY="auto" pr={1}>
                {loadingProjects ? (
                  <Box bg={cardBg} borderRadius="xl" p={4} color={muted}>Loading external projects...</Box>
                ) : projects.length === 0 ? (
                  <Box bg={cardBg} borderRadius="xl" p={4} color={muted}>No external IT project requests have been sent yet.</Box>
                ) : displayedProjects.length === 0 ? (
                  <Box bg={cardBg} borderRadius="xl" p={4} color={muted}>No projects match the current search, filters, or quick view.</Box>
                ) : displayedProjects.map((task) => {
                  const latestRecord = getLatestWorkRecord(task);
                  const taskId = task._id || task.id;
                  const canGiveFeedback = canCurrentUserGiveFeedback(task, userAliases);
                  const feedbackOpen = isFeedbackOpen(task);
                  const isExpanded = Boolean(expandedProjectIds[taskId]);
                  const isFocused = String(taskId) === String(focusedTaskId);
                  const accepted = hasManagerAcceptedProject(task);
                  const progress = getProgressValue(task);
                  return (
                    <Box
                      key={taskId}
                      ref={(node) => {
                        if (node) projectRefs.current[taskId] = node;
                      }}
                      bg={isFocused ? "blue.50" : cardBg}
                      border="1px solid"
                      borderColor={isFocused ? "blue.300" : borderColor}
                      borderRadius="xl"
                      p={4}
                      boxShadow={isFocused ? "0 0 0 3px rgba(49, 130, 206, 0.18)" : "0 10px 30px rgba(15, 23, 42, 0.06)"}
                      transition="background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)" }}
                    >
                      <Flex justify="space-between" align="center" gap={3}>
                        <HStack minW={0} spacing={3}>
                          <Box minW={0}>
                            <Badge mb={2} colorScheme="purple" variant="subtle">External project request</Badge>
                            <Text fontWeight="800">{getTaskTitle(task)}</Text>
                            <Text fontSize="xs" color={muted}>{task.client || task.category || "External project"}</Text>
                          </Box>
                        </HStack>
                        <HStack spacing={2}>
                          <Badge colorScheme={getStatusColor(task)}>
                            {String(task.workflowStatus || task.status || "pending").replace("_", " ")}
                          </Badge>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            leftIcon={<FiEye />}
                            onClick={() => setSelectedProjectId(taskId)}
                          >
                            Detail
                          </Button>
                          {canUserDeleteProject(task) && (
                            <Tooltip label="Delete External Project (Sender & Manager only)" hasArrow>
                              <IconButton
                                aria-label="Delete external project"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                isLoading={deletingProjectId === taskId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectPendingDelete(task);
                                }}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Flex>

                      {isExpanded && Boolean(selectedProjectId === "__inline_disabled__") && (
                        <Box mt={3}>
                          <Text fontSize="sm" color={muted}>{String(task.description || "").replace("[CS External IT Request]", "").trim()}</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mt={3} fontSize="sm">
                            <HStack><Icon as={FiClock} color="blue.500" /><Text>Submitted: {task.createdAt ? new Date(task.createdAt).toLocaleString() : "Recently"}</Text></HStack>
                            <HStack><Icon as={FiUserCheck} color="teal.500" /><Text>Assigned: {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean)).join(", ") || "Waiting manager assignment"}</Text></HStack>
                            <Text color={muted}>Leader: {task.taskLeader || "Waiting assignment"}</Text>
                            <Text color={muted}>Project type: External</Text>
                            <Text color={muted}>Priority: {task.priority || "normal"}</Text>
                            <Text color={muted}>Category: {task.category || "Customer Service External Request"}</Text>
                          </SimpleGrid>

                          {accepted ? (
                            <Box mt={3}>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="xs" color={muted}>Current IT project progress</Text>
                                <Text fontSize="xs" fontWeight="800">{progress}%</Text>
                              </HStack>
                              <Box h="8px" bg="gray.200" borderRadius="full" overflow="hidden">
                                <Box h="100%" w={`${progress}%`} bg="teal.400" transition="width 0.3s ease" />
                              </Box>
                            </Box>
                          ) : (
                            <Box mt={3} p={3} borderRadius="lg" bg={panelBg}>
                              <Text fontSize="sm" color={muted}>Progress will appear after the IT manager accepts and assigns this external project.</Text>
                            </Box>
                          )}

                          <Box mt={3} p={3} borderRadius="lg" bg={panelBg}>
                            <HStack justify="space-between" mb={2}>
                              <HStack>
                                <Icon as={FiMessageSquare} color="purple.500" />
                                <Text fontWeight="700">Project Discussion</Text>
                              </HStack>
                              <Badge colorScheme="purple" fontSize="xs">
                                Sender Exclusive Channel
                              </Badge>
                            </HStack>
                            {canCurrentUserGiveFeedback(task, userAliases) ? (
                              <>
                                <VStack align="stretch" spacing={2} mb={3} maxH="240px" overflowY="auto">
                                  {(task.comments || []).filter((c) => (c.audience || 'general') !== 'staff_manager').length === 0 ? (
                                    <Text fontSize="sm" color={muted}>No discussion yet. Add notes or comments about this external request.</Text>
                                  ) : (task.comments || []).filter((c) => (c.audience || 'general') !== 'staff_manager').map((comment) => {
                                    const isFocusedComment = String(comment._id || "") === String(focusedCommentId);
                                    const isManagerAuthor = ["admin", "itmanager", "itadmin", "manager"].includes(
                                      String(comment.authorRole || "").toLowerCase().replace(/[^a-z0-9]/g, "")
                                    );
                                    return (
                                    <Box
                                      key={comment._id || comment.createdAt || comment.body}
                                      bg={isFocusedComment ? "yellow.50" : cardBg}
                                      border="1px solid"
                                      borderColor={isFocusedComment ? "yellow.300" : borderColor}
                                      borderRadius="lg"
                                      p={3}
                                    >
                                      <HStack justify="space-between" align="start">
                                        <HStack spacing={2} wrap="wrap">
                                          <Text fontSize="sm" fontWeight="800">{comment.authorName || "User"}</Text>
                                          <Badge size="sm" colorScheme={isManagerAuthor ? "purple" : "blue"} variant="subtle">
                                            {isManagerAuthor ? "IT Manager" : (comment.authorRole || "CS Sender")}
                                          </Badge>
                                        </HStack>
                                        <Text fontSize="xs" color={muted}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</Text>
                                      </HStack>
                                      <Text fontSize="sm" mt={2}>{comment.body}</Text>
                                    </Box>
                                    );
                                  })}
                                </VStack>
                                <Textarea
                                  size="sm"
                                  placeholder="Message the IT Manager about this external project..."
                                  value={commentDrafts[taskId] || ""}
                                  onChange={(event) => setCommentDrafts({ ...commentDrafts, [taskId]: event.target.value })}
                                />
                                <Button
                                  mt={2}
                                  size="sm"
                                  colorScheme="purple"
                                  leftIcon={<FiMessageSquare />}
                                  onClick={() => submitProjectComment(task)}
                                  isLoading={commentSavingId === taskId}
                                  isDisabled={!String(commentDrafts[taskId] || "").trim()}
                                >
                                  Send Comment
                                </Button>
                              </>
                            ) : (
                              <Box p={3} bg={cardBg} borderRadius="md" border="1px dashed" borderColor={borderColor}>
                                <HStack mb={1}>
                                  <Icon as={FiShield} color="purple.400" />
                                  <Text fontSize="sm" fontWeight="700">Sender Private Discussion</Text>
                                </HStack>
                                <Text fontSize="xs" color={muted}>
                                  Comments and discussion on this external project are exclusive to the task sender ({task.requestedBy || "Task Sender"}). Other participants and managers cannot view or post comments.
                                </Text>
                              </Box>
                            )}
                          </Box>

                          {latestRecord ? (
                            <Box mt={3} p={3} borderRadius="lg" bg={panelBg}>
                              <HStack justify="space-between" align="start">
                                <Box>
                                  <Text fontWeight="700">Latest work done by {latestRecord.staffName || "IT staff"}</Text>
                                  <Text fontSize="sm" color={muted}>{latestRecord.summary}</Text>
                                </Box>
                                <Badge colorScheme={latestRecord.approvalStatus === "approved" ? "green" : latestRecord.approvalStatus === "rejected" ? "red" : "orange"}>
                                  {String(latestRecord.approvalStatus || "pending approval").replace("_", " ")}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color={muted} mt={2}>
                                Completed: {latestRecord.completedAt ? new Date(latestRecord.completedAt).toLocaleString() : "No date"} | Manager feedback: {latestRecord.managerNote || latestRecord.approvedByName || "No feedback yet"}
                              </Text>
                              {latestRecord.outstandingTasks && (
                                <Text fontSize="xs" color="orange.500" mt={1}>Outstanding: {latestRecord.outstandingTasks}</Text>
                              )}
                            </Box>
                          ) : (
                            <Text mt={3} fontSize="sm" color={muted}>No IT work report has been submitted yet.</Text>
                          )}

                          <Box mt={3} p={3} borderRadius="lg" bg={panelBg}>
                            <HStack mb={2}>
                              <Icon as={FiStar} color="yellow.500" />
                              <Text fontWeight="700">Customer Service Sender Feedback</Text>
                            </HStack>
                            {task.requesterFeedback?.submittedAt && (
                              <Box mb={3}>
                                <Badge colorScheme="yellow">{task.requesterFeedback.rating} / 5 rating</Badge>
                                <Text mt={2} fontSize="sm">{task.requesterFeedback.comment || "No feedback comment."}</Text>
                                <Text fontSize="xs" color={muted}>Submitted {new Date(task.requesterFeedback.submittedAt).toLocaleString()} by {task.requesterFeedback.submittedBy || "requester"}</Text>
                              </Box>
                            )}

                            {canGiveFeedback && feedbackOpen ? (
                              <VStack align="stretch" spacing={2}>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                  <Select
                                    size="sm"
                                    placeholder="Rating"
                                    value={feedbackDrafts[taskId]?.rating ?? task.requesterFeedback?.rating ?? ""}
                                    onChange={(event) => setFeedbackDrafts({
                                      ...feedbackDrafts,
                                      [taskId]: {
                                        ...(feedbackDrafts[taskId] || {}),
                                        rating: event.target.value,
                                      },
                                    })}
                                  >
                                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                                  </Select>
                                  <Button size="sm" colorScheme="yellow" onClick={() => submitProjectFeedback(task)} isLoading={feedbackSavingId === taskId}>
                                    {task.requesterFeedback?.submittedAt ? "Update Feedback" : "Send Feedback"}
                                  </Button>
                                </SimpleGrid>
                                <Textarea
                                  size="sm"
                                  placeholder="Feedback for the completed external project"
                                  value={feedbackDrafts[taskId]?.comment ?? task.requesterFeedback?.comment ?? ""}
                                  onChange={(event) => setFeedbackDrafts({
                                    ...feedbackDrafts,
                                    [taskId]: {
                                      ...(feedbackDrafts[taskId] || {}),
                                      comment: event.target.value,
                                    },
                                  })}
                                />
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color={muted}>
                                {feedbackOpen ? "Only the original CS sender/request owner can provide feedback." : "Feedback opens after IT completes or approves this external project."}
                              </Text>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {projectPendingDelete && (
          <Flex position="fixed" inset={0} zIndex={3200} align="center" justify="center" p={4}>
            <Box position="absolute" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" onClick={() => setProjectPendingDelete(null)} />
            <Box position="relative" bg={cardBg} border="1px solid" borderColor="red.200" borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.28)" p={5} w={{ base: "100%", sm: "430px" }}>
              <HStack align="start" spacing={3}>
                <Flex boxSize="42px" borderRadius="xl" bg="red.50" color="red.500" align="center" justify="center" flexShrink={0}>
                  <Icon as={FiAlertTriangle} boxSize={5} />
                </Flex>
                <Box flex="1">
                  <Heading size="sm">Delete external project?</Heading>
                  <Text fontSize="sm" color={muted} mt={1}>
                    {getTaskTitle(projectPendingDelete)} will be removed from the CS external IT request list.
                  </Text>
                  <HStack justify="flex-end" mt={5} spacing={3}>
                    <Button size="sm" variant="ghost" onClick={() => setProjectPendingDelete(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" colorScheme="red" leftIcon={<FiTrash2 />} isLoading={deletingProjectId === (projectPendingDelete._id || projectPendingDelete.id)} onClick={() => handleDeleteProject(projectPendingDelete)}>
                      Delete
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            </Box>
          </Flex>
        )}

        <Drawer isOpen={Boolean(selectedProject)} placement="right" onClose={() => setSelectedProjectId("")} size="md">
          <DrawerOverlay backdropFilter="blur(3px)" />
          <DrawerContent maxW={{ base: "100vw", md: "540px" }} bg={cardBg}>
            <DrawerCloseButton />
            <DrawerHeader borderBottom="1px solid" borderColor={borderColor} px={4} py={3}>
              <VStack align="stretch" spacing={2} pr={8}>
                <HStack spacing={2} wrap="wrap">
                  <Badge colorScheme="purple" fontSize="2xs" borderRadius="full">External Project</Badge>
                  <Badge colorScheme={getStatusColor(selectedProject || {})} fontSize="2xs" borderRadius="full">
                    {String(selectedProject?.workflowStatus || selectedProject?.status || "pending").replace("_", " ")}
                  </Badge>
                </HStack>
                <Heading size="sm" noOfLines={2}>{getTaskTitle(selectedProject || {})}</Heading>
                <Text fontSize="xs" color={muted}>
                  {selectedProject?.client || selectedProject?.category || "Customer Service external request"}
                </Text>
              </VStack>
            </DrawerHeader>

            <DrawerBody px={4} py={3}>
              {selectedProject && (() => {
                const taskId = selectedProject._id || selectedProject.id;
                const latestRecord = getLatestWorkRecord(selectedProject);
                const canGiveFeedback = canCurrentUserGiveFeedback(selectedProject, userAliases);
                const feedbackOpen = isFeedbackOpen(selectedProject);
                const accepted = hasManagerAcceptedProject(selectedProject);
                const progress = getProgressValue(selectedProject);
                return (
                  <VStack align="stretch" spacing={3}>
                    <Box p={3} borderRadius="lg" bg={panelBg} border="1px solid" borderColor={borderColor}>
                      <Text fontSize="xs" fontWeight="800" color={muted} mb={1}>REQUEST DETAILS</Text>
                      <Text fontSize="sm" color={muted} whiteSpace="pre-wrap">
                        {String(selectedProject.description || "").replace("[CS External IT Request]", "").trim() || "No request detail provided."}
                      </Text>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>SUBMITTED</Text>
                        <Text fontSize="xs">{selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleString() : "Recently"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>ASSIGNED IT</Text>
                        <Text fontSize="xs">{(Array.isArray(selectedProject.assignedTo) ? selectedProject.assignedTo : [selectedProject.assignedTo].filter(Boolean)).join(", ") || "Waiting manager assignment"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>LEADER</Text>
                        <Text fontSize="xs">{selectedProject.taskLeader || "Waiting assignment"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>PRIORITY</Text>
                        <Badge colorScheme={selectedProject.priority === "critical" ? "red" : selectedProject.priority === "high" ? "orange" : "blue"} size="sm">
                          {selectedProject.priority || "normal"}
                        </Badge>
                      </Box>
                    </SimpleGrid>

                    {accepted ? (
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color={muted}>Current IT project progress</Text>
                          <Text fontSize="xs" fontWeight="800">{progress}%</Text>
                        </HStack>
                        <Box h="8px" bg="gray.200" borderRadius="full" overflow="hidden">
                          <Box h="100%" w={`${progress}%`} bg="teal.400" transition="width 0.3s ease" />
                        </Box>
                      </Box>
                    ) : (
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="sm" color={muted}>Progress appears after the IT manager accepts and assigns this external project.</Text>
                      </Box>
                    )}

                    <Box p={3} borderRadius="lg" bg={panelBg}>
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Icon as={FiMessageSquare} color="purple.500" />
                          <Text fontSize="sm" fontWeight="800">Project Discussion</Text>
                        </HStack>
                        <Badge colorScheme="purple" fontSize="2xs">Sender Channel</Badge>
                      </HStack>
                      {canCurrentUserGiveFeedback(selectedProject, userAliases) ? (
                        <>
                          <VStack align="stretch" spacing={2} mb={3} maxH="180px" overflowY="auto">
                            {(selectedProject.comments || []).filter((c) => (c.audience || "general") !== "staff_manager").length === 0 ? (
                              <Text fontSize="sm" color={muted}>No discussion yet.</Text>
                            ) : (selectedProject.comments || []).filter((c) => (c.audience || "general") !== "staff_manager").map((comment) => (
                              <Box key={comment._id || comment.createdAt || comment.body} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="md" p={2}>
                                <HStack justify="space-between" align="start">
                                  <Text fontSize="xs" fontWeight="800">{comment.authorName || "User"}</Text>
                                  <Text fontSize="2xs" color={muted}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</Text>
                                </HStack>
                                <Text fontSize="xs" mt={1}>{comment.body}</Text>
                              </Box>
                            ))}
                          </VStack>
                          <Textarea
                            size="sm"
                            placeholder="Message the IT Manager about this external project..."
                            value={commentDrafts[taskId] || ""}
                            onChange={(event) => setCommentDrafts({ ...commentDrafts, [taskId]: event.target.value })}
                          />
                          <Button mt={2} size="sm" colorScheme="purple" leftIcon={<FiMessageSquare />} onClick={() => submitProjectComment(selectedProject)} isLoading={commentSavingId === taskId} isDisabled={!String(commentDrafts[taskId] || "").trim()}>
                            Send Comment
                          </Button>
                        </>
                      ) : (
                        <Text fontSize="xs" color={muted}>Only the original CS sender can view or post discussion comments.</Text>
                      )}
                    </Box>

                    {latestRecord ? (
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <HStack justify="space-between" align="start">
                          <Box>
                            <Text fontSize="sm" fontWeight="800">Latest work done by {latestRecord.staffName || "IT staff"}</Text>
                            <Text fontSize="xs" color={muted}>{latestRecord.summary}</Text>
                          </Box>
                          <Badge colorScheme={latestRecord.approvalStatus === "approved" ? "green" : latestRecord.approvalStatus === "rejected" ? "red" : "orange"}>
                            {String(latestRecord.approvalStatus || "pending approval").replace("_", " ")}
                          </Badge>
                        </HStack>
                        <Text fontSize="2xs" color={muted} mt={2}>
                          Completed: {latestRecord.completedAt ? new Date(latestRecord.completedAt).toLocaleString() : "No date"} | Manager feedback: {latestRecord.managerNote || latestRecord.approvedByName || "No feedback yet"}
                        </Text>
                        {latestRecord.outstandingTasks && (
                          <Text fontSize="xs" color="orange.500" mt={1}>Outstanding: {latestRecord.outstandingTasks}</Text>
                        )}
                      </Box>
                    ) : (
                      <Text fontSize="sm" color={muted}>No IT work report has been submitted yet.</Text>
                    )}

                    <Box p={3} borderRadius="lg" bg={panelBg}>
                      <HStack mb={2}>
                        <Icon as={FiStar} color="yellow.500" />
                        <Text fontSize="sm" fontWeight="800">Customer Service Sender Feedback</Text>
                      </HStack>
                      {selectedProject.requesterFeedback?.submittedAt && (
                        <Box mb={3}>
                          <Badge colorScheme="yellow">{selectedProject.requesterFeedback.rating} / 5 rating</Badge>
                          <Text mt={2} fontSize="sm">{selectedProject.requesterFeedback.comment || "No feedback comment."}</Text>
                          <Text fontSize="2xs" color={muted}>Submitted {new Date(selectedProject.requesterFeedback.submittedAt).toLocaleString()} by {selectedProject.requesterFeedback.submittedBy || "requester"}</Text>
                        </Box>
                      )}
                      {canGiveFeedback && feedbackOpen ? (
                        <VStack align="stretch" spacing={2}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            <Select size="sm" placeholder="Rating" value={feedbackDrafts[taskId]?.rating ?? selectedProject.requesterFeedback?.rating ?? ""} onChange={(event) => setFeedbackDrafts({ ...feedbackDrafts, [taskId]: { ...(feedbackDrafts[taskId] || {}), rating: event.target.value } })}>
                              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                            </Select>
                            <Button size="sm" colorScheme="yellow" onClick={() => submitProjectFeedback(selectedProject)} isLoading={feedbackSavingId === taskId}>
                              {selectedProject.requesterFeedback?.submittedAt ? "Update Feedback" : "Send Feedback"}
                            </Button>
                          </SimpleGrid>
                          <Textarea size="sm" placeholder="Feedback for the completed external project" value={feedbackDrafts[taskId]?.comment ?? selectedProject.requesterFeedback?.comment ?? ""} onChange={(event) => setFeedbackDrafts({ ...feedbackDrafts, [taskId]: { ...(feedbackDrafts[taskId] || {}), comment: event.target.value } })} />
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color={muted}>{feedbackOpen ? "Only the original CS sender/request owner can provide feedback." : "Feedback opens after IT completes or approves this external project."}</Text>
                      )}
                    </Box>
                  </VStack>
                );
              })()}
            </DrawerBody>

            <DrawerFooter borderTop="1px solid" borderColor={borderColor} px={4} py={3}>
              <Button size="sm" onClick={() => setSelectedProjectId("")}>Close</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </CardBody>
    </Card>
  );
}
