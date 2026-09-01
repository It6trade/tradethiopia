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

const SUPPORT_TYPES = [
  { value: "software", label: "Software / System Issue" },
  { value: "account", label: "Account / Login Support" },
  { value: "network", label: "Network / Connectivity" },
  { value: "hardware", label: "Hardware / Device" },
  { value: "security", label: "Security Concern" },
  { value: "support", label: "General Support" },
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

const getTaskTitle = (task = {}) => task.taskName || task.client || task.platform || task.category || "Support ticket";

const isSupportTicket = (task = {}) => (
  task.requestSource === "employee_call"
  || Boolean(task.supportRequestNote)
  || Boolean(task.requestedAt)
  || (task.ticketRecords || []).length > 0
);

const appendSelectedFileNames = (currentValue = "", fileList = []) => {
  const names = Array.from(fileList || []).map((file) => file.name).filter(Boolean);
  if (!names.length) return currentValue;
  return [currentValue, names.join("\n")].filter(Boolean).join("\n");
};

const getStatusColor = (status = "") => {
  if (["approved", "closed"].includes(status)) return "green";
  if (["reported", "in_progress"].includes(status)) return "purple";
  if (["assigned", "staff_accepted"].includes(status)) return "blue";
  if (status === "rejected") return "red";
  return "orange";
};

const getLatestWorkRecord = (ticket = {}) => (
  [...(ticket.ticketRecords || [])].sort((a, b) => new Date(b.createdAt || b.completedAt || 0) - new Date(a.createdAt || a.completedAt || 0))[0]
);

const canCurrentUserGiveFeedback = (ticket = {}, aliases = []) => (
  aliases.includes(String(ticket.requestedBy || "").trim().toLowerCase())
  || aliases.includes(String(ticket.createdBy || "").trim().toLowerCase())
);

const isFeedbackOpen = (ticket = {}) => (
  ["approved", "closed"].includes(ticket.supportStatus)
  || (ticket.ticketRecords || []).some((record) => record.approvalStatus === "approved")
);

export default function CustomerSupportRequestPanel() {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");
  const shellBg = useColorModeValue(
    "linear-gradient(135deg, #f8fafc 0%, #eff6ff 45%, #ecfeff 100%)",
    "linear-gradient(135deg, #111827 0%, #0f172a 52%, #164e63 100%)"
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
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [managerTickets, setManagerTickets] = useState([]);
  const [feedbackSavingId, setFeedbackSavingId] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [expandedManagerTicketIds] = useState({});
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [ticketPendingDelete, setTicketPendingDelete] = useState(null);
  const [form, setForm] = useState({
    taskName: "",
    ticketCategory: "software",
    priority: "normal",
    requestedBy: getDisplayName(currentUser),
    requestedDepartment: currentUser?.department || "Customer Service",
    summary: "",
    attachments: "",
  });

  const userAliases = useMemo(() => getUserTaskAliases(currentUser || {}), [currentUser]);
  const selectedTicket = useMemo(() => (
    selectedTicketId
      ? managerTickets.find((ticket) => String(ticket._id || ticket.id) === String(selectedTicketId))
      : null
  ), [managerTickets, selectedTicketId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      requestedBy: prev.requestedBy || getDisplayName(currentUser),
      requestedDepartment: prev.requestedDepartment || currentUser?.department || "Customer Service",
    }));
  }, [currentUser]);

  const fetchManagerRequests = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const response = await axiosInstance.get("/it");
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const tickets = data
        .filter(isSupportTicket)
        .filter((task) => (
          task.projectType !== "external"
          && (
            userAliases.includes(String(task.requestedBy || "").trim().toLowerCase())
            || userAliases.includes(String(task.createdBy || "").trim().toLowerCase())
            || String(task.requestedDepartment || "").toLowerCase().includes("customer")
          )
        ))
        .slice(0, 12);
      setManagerTickets(tickets);
    } catch (error) {
      console.error("Unable to load IT manager support requests", error);
      setManagerTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [userAliases]);

  useEffect(() => {
    fetchManagerRequests();
  }, [fetchManagerRequests]);

  const submitSupportTicket = async () => {
    if (!form.taskName.trim() || !form.summary.trim()) {
      showRequestToast({
        title: "Ticket title and details are required",
        status: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/it/support-requests", {
        taskName: form.taskName.trim(),
        ticketCategory: form.ticketCategory,
        priority: form.priority,
        requestedBy: form.requestedBy || getDisplayName(currentUser),
        requestedDepartment: form.requestedDepartment || "Customer Service",
        summary: `[Contact the IT Support Department] ${form.summary.trim()}`,
        attachments: form.attachments,
      });
      const created = response.data?.data;
      if (created) {
        setManagerTickets((prev) => [created, ...prev].slice(0, 12));
      }
      setForm((prev) => ({
        ...prev,
        taskName: "",
        ticketCategory: "software",
        priority: "normal",
        summary: "",
        attachments: "",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      showRequestToast({
        title: "Support ticket sent to IT manager",
        description: "The manager can now approve and assign it from the Manager Support Queue.",
        status: "success",
      });
    } catch (error) {
      showRequestToast({
        title: "Support request failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitTicketFeedback = async (ticket) => {
    const ticketId = ticket._id || ticket.id;
    const draft = feedbackDrafts[ticketId] || {};
    const rating = Number(draft.rating || ticket.requesterFeedback?.rating || 0);
    if (!rating) {
      showRequestToast({ title: "Please select a rating", status: "warning" });
      return;
    }

    setFeedbackSavingId(ticketId);
    try {
      const response = await axiosInstance.post(`/it/${ticketId}/feedback`, {
        rating,
        comment: draft.comment ?? ticket.requesterFeedback?.comment ?? "",
        submittedBy: getDisplayName(currentUser),
      });
      const updated = response.data?.data;
      if (updated) {
        setManagerTickets((prev) => prev.map((item) => (
          String(item._id || item.id) === String(ticketId) ? updated : item
        )));
      }
      showRequestToast({ title: "Ticket feedback saved", status: "success" });
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

  const [deletingTicketId, setDeletingTicketId] = useState("");

  const isManagerUser = useCallback((user = {}) => {
    const role = String(user?.role || user?.userRole || user?.displayRole || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
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
  }, []);

  const canUserDeleteSupportTicket = useCallback((ticket = {}) => {
    if (isManagerUser(currentUser)) return true;
    const reqBy = String(ticket.requestedBy || "").trim().toLowerCase();
    const createdBy = String(ticket.createdBy?._id || ticket.createdBy || "").trim().toLowerCase();
    const submitter = String(ticket.submittedBy?._id || ticket.submittedBy || "").trim().toLowerCase();
    const userId = String(currentUser?._id || currentUser?.id || "").trim().toLowerCase();
    return (
      userAliases.includes(reqBy) ||
      userAliases.includes(createdBy) ||
      userAliases.includes(submitter) ||
      (userId && (userId === createdBy || userId === submitter))
    );
  }, [currentUser, isManagerUser, userAliases]);

  const handleDeleteSupportTicket = async (ticket) => {
    const ticketId = ticket._id || ticket.id;
    setDeletingTicketId(ticketId);
    try {
      await axiosInstance.delete(`/it/${ticketId}`);
      setManagerTickets((prev) => prev.filter((t) => (t._id || t.id) !== ticketId));
      setTicketPendingDelete(null);
      showRequestToast({
        title: "Support request deleted",
        description: `${getTaskTitle(ticket)} was removed successfully.`,
        status: "success",
      });
    } catch (error) {
      showRequestToast({
        title: "Failed to delete support request",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    } finally {
      setDeletingTicketId("");
    }
  };

  return (
    <Card bg={shellBg} borderColor="whiteAlpha.700" borderWidth="1px" borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.12)" overflow="hidden">
      <CardBody p={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={5}>
          <HStack align="center" spacing={4}>
            <Flex boxSize="52px" borderRadius="2xl" bg="blue.400" color="white" align="center" justify="center" boxShadow="0 16px 34px rgba(59, 130, 246, 0.28)">
              <Icon as={FiShield} boxSize={6} />
            </Flex>
            <Box>
              <HStack mb={1} wrap="wrap">
                <Badge colorScheme="blue" borderRadius="full" px={3}>Support Desk</Badge>
                <Badge colorScheme="teal" borderRadius="full" px={3}>Manager Queue</Badge>
              </HStack>
              <Heading size="lg" color={headingColor}>Customer Service to IT Support</Heading>
              <Text color={muted} maxW="760px">Use this section only when Customer Service needs IT manager approval and IT staff assignment.</Text>
            </Box>
          </HStack>
          <Badge colorScheme="blue" alignSelf={{ base: "flex-start", md: "center" }} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="full" px={4} py={2} boxShadow="sm">IT Manager Queue</Badge>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
          <Card bg={formPanelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)" backdropFilter="blur(12px)">
            <CardBody p={{ base: 4, md: 5 }}>
              <HStack mb={4} spacing={3} align="start">
                <Flex boxSize="40px" borderRadius="xl" bg="teal.50" color="teal.500" align="center" justify="center" flexShrink={0}>
                  <Icon as={FiTool} />
                </Flex>
                <Box>
                  <Heading size="md">Contact the IT Support Department</Heading>
                  <Text fontSize="sm" color={muted}>Create a new IT ticket for manager approval and staff assignment.</Text>
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
                  <FormLabel>Support title</FormLabel>
                  <Input
                    value={form.taskName}
                    onChange={(event) => setForm({ ...form, taskName: event.target.value })}
                    placeholder="Example: CRM follow-up page not loading"
                    bg={cardBg}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Support type</FormLabel>
                    <Select bg={cardBg} value={form.ticketCategory} onChange={(event) => setForm({ ...form, ticketCategory: event.target.value })}>
                      {SUPPORT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
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
                    placeholder="Describe the issue, affected customer/workflow, urgency, and what you already tried."
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

                <Button colorScheme="teal" leftIcon={<FiSend />} onClick={submitSupportTicket} isLoading={submitting} h="46px" borderRadius="xl" boxShadow="0 14px 28px rgba(20, 184, 166, 0.24)">
                  Create IT Ticket
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
                    <Heading size="md">Support Request to the Manager</Heading>
                    <Text fontSize="sm" color={muted}>Track submitted tickets, manager approval, assigned staff work, dates, and feedback.</Text>
                  </Box>
                </HStack>
                <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" colorScheme="blue" borderRadius="xl" onClick={fetchManagerRequests} isLoading={loadingTickets}>
                  Refresh
                </Button>
              </Flex>

              <VStack align="stretch" spacing={3} maxH="760px" overflowY="auto" pr={1}>
                {loadingTickets ? (
                  <Box bg={cardBg} borderRadius="xl" p={4} color={muted}>Loading manager support requests...</Box>
                ) : managerTickets.length === 0 ? (
                  <Box bg={cardBg} borderRadius="xl" p={4} color={muted}>No IT support tickets have been sent yet.</Box>
                ) : managerTickets.map((ticket) => {
                  const latestRecord = getLatestWorkRecord(ticket);
                  const ticketId = ticket._id || ticket.id;
                  const canGiveFeedback = canCurrentUserGiveFeedback(ticket, userAliases);
                  const feedbackOpen = isFeedbackOpen(ticket);
                  const isExpanded = Boolean(expandedManagerTicketIds[ticketId]);
                  return (
                    <Box
                      key={ticketId}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="xl"
                      p={4}
                      boxShadow="0 10px 30px rgba(15, 23, 42, 0.06)"
                      transition="box-shadow 0.2s ease, transform 0.2s ease"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.1)" }}
                    >
                      <Flex justify="space-between" align="center" gap={3}>
                        <HStack minW={0} spacing={3}>
                          <Box minW={0}>
                            <Badge mb={2} colorScheme="blue" variant="subtle">Support Request to Manager Record</Badge>
                            <Text fontWeight="800">{getTaskTitle(ticket)}</Text>
                            <Text fontSize="xs" color={muted}>{ticket.requestedDepartment || "Customer Service"}</Text>
                          </Box>
                        </HStack>
                        <HStack spacing={2}>
                          <Badge colorScheme={getStatusColor(ticket.supportStatus)}>
                            {String(ticket.supportStatus || "requested").replace("_", " ")}
                          </Badge>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            leftIcon={<FiEye />}
                            onClick={() => setSelectedTicketId(ticketId)}
                          >
                            Detail
                          </Button>
                          {canUserDeleteSupportTicket(ticket) && (
                            <Tooltip label="Delete Support Request (Sender & Manager only)" hasArrow>
                              <IconButton
                                aria-label="Delete support request"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                isLoading={deletingTicketId === ticketId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTicketPendingDelete(ticket);
                                }}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Flex>

                      {isExpanded && Boolean(selectedTicketId === "__inline_disabled__") && (
                        <Box mt={3}>
                          <Text fontSize="sm" color={muted}>{ticket.supportRequestNote || ticket.description}</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mt={3} fontSize="sm">
                            <HStack><Icon as={FiClock} color="blue.500" /><Text>Sent: {ticket.requestedAt ? new Date(ticket.requestedAt).toLocaleString() : "Recently"}</Text></HStack>
                            <HStack><Icon as={FiUserCheck} color="teal.500" /><Text>Assigned: {(ticket.assignedTo || []).join(", ") || "Waiting manager assignment"}</Text></HStack>
                            <Text color={muted}>Manager accepted: {ticket.managerAcceptedAt ? new Date(ticket.managerAcceptedAt).toLocaleString() : "Pending"}</Text>
                            <Text color={muted}>Priority: {ticket.priority || "normal"}</Text>
                          </SimpleGrid>

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
                            <Text mt={3} fontSize="sm" color={muted}>No staff work report has been submitted yet.</Text>
                          )}

                          <Box mt={3} p={3} borderRadius="lg" bg={panelBg}>
                            <HStack mb={2}>
                              <Icon as={FiStar} color="yellow.500" />
                              <Text fontWeight="700">Customer Service Sender Feedback</Text>
                            </HStack>
                            {ticket.requesterFeedback?.submittedAt && (
                              <Box mb={3}>
                                <Badge colorScheme="yellow">{ticket.requesterFeedback.rating} / 5 rating</Badge>
                                <Text mt={2} fontSize="sm">{ticket.requesterFeedback.comment || "No feedback comment."}</Text>
                                <Text fontSize="xs" color={muted}>Submitted {new Date(ticket.requesterFeedback.submittedAt).toLocaleString()} by {ticket.requesterFeedback.submittedBy || "requester"}</Text>
                              </Box>
                            )}

                            {canGiveFeedback && feedbackOpen ? (
                              <VStack align="stretch" spacing={2}>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                  <Select
                                    size="sm"
                                    placeholder="Rating"
                                    value={feedbackDrafts[ticketId]?.rating ?? ticket.requesterFeedback?.rating ?? ""}
                                    onChange={(event) => setFeedbackDrafts({
                                      ...feedbackDrafts,
                                      [ticketId]: {
                                        ...(feedbackDrafts[ticketId] || {}),
                                        rating: event.target.value,
                                      },
                                    })}
                                  >
                                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                                  </Select>
                                  <Button size="sm" colorScheme="yellow" onClick={() => submitTicketFeedback(ticket)} isLoading={feedbackSavingId === ticketId}>
                                    {ticket.requesterFeedback?.submittedAt ? "Update Feedback" : "Send Feedback"}
                                  </Button>
                                </SimpleGrid>
                                <Textarea
                                  size="sm"
                                  placeholder="Feedback for the completed support work"
                                  value={feedbackDrafts[ticketId]?.comment ?? ticket.requesterFeedback?.comment ?? ""}
                                  onChange={(event) => setFeedbackDrafts({
                                    ...feedbackDrafts,
                                    [ticketId]: {
                                      ...(feedbackDrafts[ticketId] || {}),
                                      comment: event.target.value,
                                    },
                                  })}
                                />
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color={muted}>
                                {feedbackOpen ? "Only the original sender/request owner can provide feedback." : "Feedback opens after manager approval or approved IT work."}
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

        {ticketPendingDelete && (
          <Flex position="fixed" inset={0} zIndex={3200} align="center" justify="center" p={4}>
            <Box position="absolute" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" onClick={() => setTicketPendingDelete(null)} />
            <Box position="relative" bg={cardBg} border="1px solid" borderColor="red.200" borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.28)" p={5} w={{ base: "100%", sm: "430px" }}>
              <HStack align="start" spacing={3}>
                <Flex boxSize="42px" borderRadius="xl" bg="red.50" color="red.500" align="center" justify="center" flexShrink={0}>
                  <Icon as={FiAlertTriangle} boxSize={5} />
                </Flex>
                <Box flex="1">
                  <Heading size="sm">Delete support request?</Heading>
                  <Text fontSize="sm" color={muted} mt={1}>
                    {getTaskTitle(ticketPendingDelete)} will be removed from the support requests sent to the manager.
                  </Text>
                  <HStack justify="flex-end" mt={5} spacing={3}>
                    <Button size="sm" variant="ghost" onClick={() => setTicketPendingDelete(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" colorScheme="red" leftIcon={<FiTrash2 />} isLoading={deletingTicketId === (ticketPendingDelete._id || ticketPendingDelete.id)} onClick={() => handleDeleteSupportTicket(ticketPendingDelete)}>
                      Delete
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            </Box>
          </Flex>
        )}

        <Drawer isOpen={Boolean(selectedTicket)} placement="right" onClose={() => setSelectedTicketId("")} size="md">
          <DrawerOverlay backdropFilter="blur(3px)" />
          <DrawerContent maxW={{ base: "100vw", md: "540px" }} bg={cardBg}>
            <DrawerCloseButton />
            <DrawerHeader borderBottom="1px solid" borderColor={borderColor} px={4} py={3}>
              <VStack align="stretch" spacing={2} pr={8}>
                <HStack spacing={2} wrap="wrap">
                  <Badge colorScheme="blue" fontSize="2xs" borderRadius="full">Support Request</Badge>
                  <Badge colorScheme={getStatusColor(selectedTicket?.supportStatus)} fontSize="2xs" borderRadius="full">
                    {String(selectedTicket?.supportStatus || "requested").replace("_", " ")}
                  </Badge>
                </HStack>
                <Heading size="sm" noOfLines={2}>{getTaskTitle(selectedTicket || {})}</Heading>
                <Text fontSize="xs" color={muted}>
                  {selectedTicket?.requestedDepartment || "Customer Service"}
                </Text>
              </VStack>
            </DrawerHeader>

            <DrawerBody px={4} py={3}>
              {selectedTicket && (() => {
                const ticketId = selectedTicket._id || selectedTicket.id;
                const latestRecord = getLatestWorkRecord(selectedTicket);
                const canGiveFeedback = canCurrentUserGiveFeedback(selectedTicket, userAliases);
                const feedbackOpen = isFeedbackOpen(selectedTicket);
                return (
                  <VStack align="stretch" spacing={3}>
                    <Box p={3} borderRadius="lg" bg={panelBg} border="1px solid" borderColor={borderColor}>
                      <Text fontSize="xs" fontWeight="800" color={muted} mb={1}>REQUEST DETAILS</Text>
                      <Text fontSize="sm" color={muted} whiteSpace="pre-wrap">
                        {selectedTicket.supportRequestNote || selectedTicket.description || "No request detail provided."}
                      </Text>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>SENT</Text>
                        <Text fontSize="xs">{selectedTicket.requestedAt ? new Date(selectedTicket.requestedAt).toLocaleString() : "Recently"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>ASSIGNED IT</Text>
                        <Text fontSize="xs">{(selectedTicket.assignedTo || []).join(", ") || "Waiting manager assignment"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>MANAGER ACCEPTED</Text>
                        <Text fontSize="xs">{selectedTicket.managerAcceptedAt ? new Date(selectedTicket.managerAcceptedAt).toLocaleString() : "Pending"}</Text>
                      </Box>
                      <Box p={3} borderRadius="lg" bg={panelBg}>
                        <Text fontSize="2xs" fontWeight="800" color={muted}>PRIORITY</Text>
                        <Badge colorScheme={selectedTicket.priority === "critical" ? "red" : selectedTicket.priority === "high" ? "orange" : "blue"} size="sm">
                          {selectedTicket.priority || "normal"}
                        </Badge>
                      </Box>
                    </SimpleGrid>

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
                      <Text fontSize="sm" color={muted}>No staff work report has been submitted yet.</Text>
                    )}

                    <Box p={3} borderRadius="lg" bg={panelBg}>
                      <HStack mb={2}>
                        <Icon as={FiStar} color="yellow.500" />
                        <Text fontSize="sm" fontWeight="800">Customer Service Sender Feedback</Text>
                      </HStack>
                      {selectedTicket.requesterFeedback?.submittedAt && (
                        <Box mb={3}>
                          <Badge colorScheme="yellow">{selectedTicket.requesterFeedback.rating} / 5 rating</Badge>
                          <Text mt={2} fontSize="sm">{selectedTicket.requesterFeedback.comment || "No feedback comment."}</Text>
                          <Text fontSize="2xs" color={muted}>Submitted {new Date(selectedTicket.requesterFeedback.submittedAt).toLocaleString()} by {selectedTicket.requesterFeedback.submittedBy || "requester"}</Text>
                        </Box>
                      )}

                      {canGiveFeedback && feedbackOpen ? (
                        <VStack align="stretch" spacing={2}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            <Select size="sm" placeholder="Rating" value={feedbackDrafts[ticketId]?.rating ?? selectedTicket.requesterFeedback?.rating ?? ""} onChange={(event) => setFeedbackDrafts({ ...feedbackDrafts, [ticketId]: { ...(feedbackDrafts[ticketId] || {}), rating: event.target.value } })}>
                              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                            </Select>
                            <Button size="sm" colorScheme="yellow" onClick={() => submitTicketFeedback(selectedTicket)} isLoading={feedbackSavingId === ticketId}>
                              {selectedTicket.requesterFeedback?.submittedAt ? "Update Feedback" : "Send Feedback"}
                            </Button>
                          </SimpleGrid>
                          <Textarea size="sm" placeholder="Feedback for the completed support work" value={feedbackDrafts[ticketId]?.comment ?? selectedTicket.requesterFeedback?.comment ?? ""} onChange={(event) => setFeedbackDrafts({ ...feedbackDrafts, [ticketId]: { ...(feedbackDrafts[ticketId] || {}), comment: event.target.value } })} />
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color={muted}>
                          {feedbackOpen ? "Only the original sender/request owner can provide feedback." : "Feedback opens after manager approval or approved IT work."}
                        </Text>
                      )}
                    </Box>
                  </VStack>
                );
              })()}
            </DrawerBody>

            <DrawerFooter borderTop="1px solid" borderColor={borderColor} px={4} py={3}>
              <Button size="sm" onClick={() => setSelectedTicketId("")}>Close</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </CardBody>
    </Card>
  );
}
