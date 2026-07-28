import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiMessageSquare,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiStar,
  FiTool,
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

const canCurrentUserGiveFeedback = (task = {}, aliases = []) => (
  aliases.includes(String(task.requestedBy || "").trim().toLowerCase())
  || aliases.includes(String(task.createdBy || "").trim().toLowerCase())
);

const isFeedbackOpen = (task = {}) => (
  ["approved", "completed"].includes(task.workflowStatus)
  || ["done"].includes(task.status)
  || (task.ticketRecords || []).some((record) => record.approvalStatus === "approved")
);

export default function CSExternalITRequestsPanel() {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");

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
          userAliases.includes(String(task.requestedBy || "").trim().toLowerCase())
          || userAliases.includes(String(task.createdBy || "").trim().toLowerCase())
          || String(task.requestedDepartment || "").toLowerCase().includes("customer")
        ))
      setProjects(visibleProjects);
    } catch (error) {
      console.error("Unable to load CS external IT projects", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [userAliases]);

  useEffect(() => {
    fetchExternalProjects();
  }, [fetchExternalProjects]);

  const submitExternalProjectRequest = async () => {
    if (!form.taskName.trim() || !form.summary.trim()) {
      toast({
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
      toast({
        title: "External project request sent to IT manager",
        description: "The manager can review, assign, and track it as an external IT project.",
        status: "success",
      });
    } catch (error) {
      toast({
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
      toast({ title: "Please select a rating", status: "warning" });
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
      toast({ title: "External project feedback saved", status: "success" });
    } catch (error) {
      toast({
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
      toast({ title: "Comment sent to IT", status: "success" });
    } catch (error) {
      toast({
        title: "Comment failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setCommentSavingId("");
    }
  };

  const toggleProject = (taskId) => {
    setExpandedProjectIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
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

  const clearProjectFilters = () => {
    setProjectSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignmentFilter("all");
    setQuickView("all");
  };

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
      <CardBody>
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={4}>
          <Box>
            <HStack mb={1}>
              <Icon as={FiTool} color="teal.500" />
              <Heading size="lg">CS External IT Requests</Heading>
            </HStack>
            <Text color={muted}>Submit external Customer Service task requests to IT, track manager assignment, chat with IT, and send completion feedback.</Text>
          </Box>
          <HStack alignSelf={{ base: "flex-start", md: "center" }}>
            <Badge colorScheme="purple">External Project Workflow</Badge>
            <ChatLauncher
              icon={<FiMessageSquare size={18} />}
              ariaLabel="Chat with IT manager or assigned IT staff"
              preferredView="it"
              iconButtonProps={{ size: "sm", colorScheme: "blue", variant: "outline" }}
            />
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
          <Card bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="sm">
            <CardBody>
              <HStack mb={3}>
                <Icon as={FiTool} color="teal.500" />
                <Box>
                  <Heading size="md">Submit External Task Request</Heading>
                  <Text fontSize="sm" color={muted}>Create an external IT project request for manager review and assignment.</Text>
                </Box>
              </HStack>

              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Requester</FormLabel>
                    <Input value={form.requestedBy} onChange={(event) => setForm({ ...form, requestedBy: event.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Department</FormLabel>
                    <Input value={form.requestedDepartment} onChange={(event) => setForm({ ...form, requestedDepartment: event.target.value })} />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>External task title</FormLabel>
                  <Input
                    value={form.taskName}
                    onChange={(event) => setForm({ ...form, taskName: event.target.value })}
                    placeholder="Example: Customer portal quotation bug"
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Client / customer</FormLabel>
                    <Input
                      value={form.client}
                      onChange={(event) => setForm({ ...form, client: event.target.value })}
                      placeholder="Customer, company, or external project"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>External category</FormLabel>
                    <Input
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                      placeholder="Portal, CRM, sales system, website..."
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Work type</FormLabel>
                    <Select value={form.ticketCategory} onChange={(event) => setForm({ ...form, ticketCategory: event.target.value })}>
                      {EXTERNAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Priority</FormLabel>
                    <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
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
                    />
                    <Button as="label" size="sm" variant="outline" leftIcon={<FiPaperclip />} alignSelf="flex-start" cursor="pointer">
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

                <Button colorScheme="teal" leftIcon={<FiSend />} onClick={submitExternalProjectRequest} isLoading={submitting}>
                  Send External Project to IT Manager
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="sm">
            <CardBody>
              <Flex justify="space-between" align="start" gap={3} mb={3}>
                <HStack align="start">
                  <Icon as={FiShield} color="blue.500" mt={1} />
                  <Box>
                    <Heading size="md">Assigned External Projects</Heading>
                    <Text fontSize="sm" color={muted}>Track manager review, responsible IT members, project progress, work reports, and CS feedback.</Text>
                  </Box>
                </HStack>
                <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" onClick={fetchExternalProjects} isLoading={loadingProjects}>
                  Refresh
                </Button>
              </Flex>

              <VStack align="stretch" spacing={3} mb={4}>
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
                  const accepted = hasManagerAcceptedProject(task);
                  const progress = getProgressValue(task);
                  return (
                    <Box key={taskId} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
                      <Flex justify="space-between" align="center" gap={3}>
                        <HStack minW={0} spacing={3}>
                          <Button
                            aria-label={isExpanded ? "Collapse external project details" : "Expand external project details"}
                            size="xs"
                            variant="ghost"
                            minW="28px"
                            px={0}
                            onClick={() => toggleProject(taskId)}
                          >
                            <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
                          </Button>
                          <Box minW={0}>
                            <Badge mb={2} colorScheme="purple" variant="subtle">External project request</Badge>
                            <Text fontWeight="800">{getTaskTitle(task)}</Text>
                            <Text fontSize="xs" color={muted}>{task.client || task.category || "External project"}</Text>
                          </Box>
                        </HStack>
                        <Badge colorScheme={getStatusColor(task)}>
                          {String(task.workflowStatus || task.status || "pending").replace("_", " ")}
                        </Badge>
                      </Flex>

                      {isExpanded && (
                        <Box mt={3}>
                          <Text fontSize="sm" color={muted}>{String(task.description || "").replace("[CS External IT Request]", "").trim()}</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mt={3} fontSize="sm">
                            <HStack><Icon as={FiClock} color="blue.500" /><Text>Submitted: {task.createdAt ? new Date(task.createdAt).toLocaleString() : "Recently"}</Text></HStack>
                            <HStack><Icon as={FiUserCheck} color="teal.500" /><Text>Assigned: {(task.assignedTo || []).join(", ") || "Waiting manager assignment"}</Text></HStack>
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
                            <HStack mb={2}>
                              <Icon as={FiMessageSquare} color="blue.500" />
                              <Text fontWeight="700">Project Discussion</Text>
                            </HStack>
                            <VStack align="stretch" spacing={2} mb={3} maxH="220px" overflowY="auto">
                              {(task.comments || []).length === 0 ? (
                                <Text fontSize="sm" color={muted}>No discussion yet. Start a conversation with IT about this external request.</Text>
                              ) : (task.comments || []).map((comment) => (
                                <Box key={comment._id || comment.createdAt || comment.body} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={3}>
                                  <HStack justify="space-between" align="start">
                                    <Box>
                                      <Text fontSize="sm" fontWeight="800">{comment.authorName || "Contributor"}</Text>
                                      <Text fontSize="xs" color={muted}>{comment.authorRole || "Project discussion"}</Text>
                                    </Box>
                                    <Text fontSize="xs" color={muted}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</Text>
                                  </HStack>
                                  <Text fontSize="sm" mt={2}>{comment.body}</Text>
                                </Box>
                              ))}
                            </VStack>
                            <Textarea
                              size="sm"
                              placeholder="Message the IT manager or assigned IT staff about this external project..."
                              value={commentDrafts[taskId] || ""}
                              onChange={(event) => setCommentDrafts({ ...commentDrafts, [taskId]: event.target.value })}
                            />
                            <Button
                              mt={2}
                              size="sm"
                              colorScheme="blue"
                              leftIcon={<FiMessageSquare />}
                              onClick={() => submitProjectComment(task)}
                              isLoading={commentSavingId === taskId}
                              isDisabled={!String(commentDrafts[taskId] || "").trim()}
                            >
                              Send Comment
                            </Button>
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
      </CardBody>
    </Card>
  );
}
