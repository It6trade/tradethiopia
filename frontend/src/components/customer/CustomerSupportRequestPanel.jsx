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

  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [managerTickets, setManagerTickets] = useState([]);
  const [feedbackSavingId, setFeedbackSavingId] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [expandedManagerTicketIds, setExpandedManagerTicketIds] = useState({});
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
          userAliases.includes(String(task.requestedBy || "").trim().toLowerCase())
          || userAliases.includes(String(task.createdBy || "").trim().toLowerCase())
          || String(task.requestedDepartment || "").toLowerCase().includes("customer")
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
      toast({
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
      toast({
        title: "Support ticket sent to IT manager",
        description: "The manager can now approve and assign it from the Manager Support Queue.",
        status: "success",
      });
    } catch (error) {
      toast({
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
      toast({ title: "Please select a rating", status: "warning" });
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
      toast({ title: "Ticket feedback saved", status: "success" });
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

  const toggleManagerTicket = (ticketId) => {
    setExpandedManagerTicketIds((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
      <CardBody>
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={4}>
          <Box>
            <HStack mb={1}>
              <Icon as={FiTool} color="teal.500" />
              <Heading size="lg">Customer Service to IT Support</Heading>
            </HStack>
            <Text color={muted}>Use this section only when Customer Service needs IT manager approval and IT staff assignment.</Text>
          </Box>
          <Badge colorScheme="teal" alignSelf={{ base: "flex-start", md: "center" }}>IT Manager Queue</Badge>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
          <Card bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="sm">
            <CardBody>
            <HStack mb={3}>
              <Icon as={FiTool} color="teal.500" />
              <Box>
                <Heading size="md">Contact the IT Support Department</Heading>
                <Text fontSize="sm" color={muted}>Create a new IT ticket for manager approval and staff assignment.</Text>
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
                <FormLabel>Support title</FormLabel>
                <Input
                  value={form.taskName}
                  onChange={(event) => setForm({ ...form, taskName: event.target.value })}
                  placeholder="Example: CRM follow-up page not loading"
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Support type</FormLabel>
                  <Select value={form.ticketCategory} onChange={(event) => setForm({ ...form, ticketCategory: event.target.value })}>
                    {SUPPORT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
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
                  placeholder="Describe the issue, affected customer/workflow, urgency, and what you already tried."
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

              <Button colorScheme="teal" leftIcon={<FiSend />} onClick={submitSupportTicket} isLoading={submitting}>
                Create IT Ticket
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
                  <Heading size="md">Support Request to the Manager</Heading>
                  <Text fontSize="sm" color={muted}>Track submitted tickets, manager approval, assigned staff work, dates, and feedback.</Text>
                </Box>
              </HStack>
              <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" onClick={fetchManagerRequests} isLoading={loadingTickets}>
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
                  <Box key={ticketId} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
                    <Flex justify="space-between" align="center" gap={3}>
                      <HStack minW={0} spacing={3}>
                        <Button
                          aria-label={isExpanded ? "Collapse support request details" : "Expand support request details"}
                          size="xs"
                          variant="ghost"
                          minW="28px"
                          px={0}
                          onClick={() => toggleManagerTicket(ticketId)}
                        >
                          <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
                        </Button>
                        <Box minW={0}>
                          <Badge mb={2} colorScheme="blue" variant="subtle">Support Request to Manager Record</Badge>
                        <Text fontWeight="800">{getTaskTitle(ticket)}</Text>
                      </Box>
                      </HStack>
                      <Badge colorScheme={getStatusColor(ticket.supportStatus)}>
                        {String(ticket.supportStatus || "requested").replace("_", " ")}
                      </Badge>
                    </Flex>

                    {isExpanded && (
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
      </CardBody>
    </Card>
  );
}
