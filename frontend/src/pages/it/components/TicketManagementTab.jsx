import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  NumberInput,
  NumberInputField,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiAward,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiDownload,
  FiMessageSquare,
  FiPaperclip,
  FiPhoneCall,
  FiSend,
  FiStar,
  FiTool,
  FiTrash2,
  FiUserCheck,
  FiXCircle,
} from 'react-icons/fi';
import axiosInstance from '../../../services/axiosInstance';
import { getTaskTitle } from '../utils/itWorkflow';
import { getUserTaskAliases } from '../utils/itRbac';

const WORK_TYPES = [
  { value: 'network', label: 'Network Fix' },
  { value: 'hardware', label: 'Hardware Maintenance' },
  { value: 'software', label: 'Software Update' },
  { value: 'account', label: 'Account Support' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'support', label: 'General Support' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

const getPriorityColor = (priority = 'normal') => (
  PRIORITY_OPTIONS.find((item) => item.value === String(priority).toLowerCase())?.color || 'blue'
);

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getSlaState = (task = {}) => {
  const now = Date.now();
  const responseDue = task.sla?.responseDueAt ? new Date(task.sla.responseDueAt).getTime() : null;
  const resolutionDue = task.sla?.resolutionDueAt ? new Date(task.sla.resolutionDueAt).getTime() : null;
  const isClosed = ['approved', 'closed'].includes(task.supportStatus);
  const responseOpen = ['requested', 'manager_accepted', 'assigned'].includes(task.supportStatus);
  const breachedResolution = !isClosed && resolutionDue && now > resolutionDue;
  const breachedResponse = !isClosed && responseOpen && responseDue && now > responseDue;
  const escalated = Boolean(task.sla?.escalatedAt || breachedResolution || breachedResponse);
  return {
    escalated,
    label: isClosed ? 'SLA met/closed' : escalated ? (breachedResolution ? 'Resolution overdue' : 'Response overdue') : 'SLA active',
    color: isClosed ? 'green' : escalated ? 'red' : 'cyan',
    responseDueAt: task.sla?.responseDueAt,
    resolutionDueAt: task.sla?.resolutionDueAt,
    escalationReason: task.sla?.escalationReason,
  };
};

const buildTicketTimeline = (task = {}) => ([
  {
    type: 'request',
    title: 'Support request created',
    note: task.supportRequestNote || task.description || '',
    actorName: task.requestedBy || 'Requester',
    createdAt: task.requestedAt || task.createdAt,
  },
  task.managerAcceptedAt && {
    type: 'assignment',
    title: 'Accepted and assigned',
    note: (task.assignedTo || []).join(', ') || 'Unassigned',
    actorName: task.managerAcceptedByName || 'Manager',
    createdAt: task.managerAcceptedAt,
  },
  task.staffAcceptedAt && {
    type: 'work',
    title: 'Staff accepted ticket',
    note: `${task.staffAcceptedByName || 'Assigned staff'} started work.`,
    actorName: task.staffAcceptedByName || 'Assigned staff',
    createdAt: task.staffAcceptedAt,
  },
  task.sla?.escalatedAt && {
    type: 'escalation',
    title: 'Ticket escalated',
    note: task.sla.escalationReason || 'SLA breached',
    actorName: 'System',
    createdAt: task.sla.escalatedAt,
  },
  ...((task.ticketRecords || []).map((record) => ({
    type: 'record',
    title: `Work record ${String(record.approvalStatus || '').replace('_', ' ')}`,
    note: record.summary,
    actorName: record.staffName || 'IT staff',
    createdAt: record.createdAt || record.completedAt,
  }))),
  ...((task.comments || []).map((comment) => ({
    type: 'comment',
    title: 'Comment added',
    note: comment.body,
    actorName: comment.authorName || 'IT user',
    createdAt: comment.createdAt,
  }))),
  task.requesterFeedback?.submittedAt && {
    type: 'feedback',
    title: 'Requester feedback submitted',
    note: task.requesterFeedback.comment || `${task.requesterFeedback.rating || '-'} star rating`,
    actorName: task.requesterFeedback.submittedBy || task.requestedBy || 'Requester',
    createdAt: task.requesterFeedback.submittedAt,
  },
])
  .filter(Boolean)
  .filter((entry) => entry.createdAt)
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const getStaffWorkload = (tasks = [], users = []) => {
  const staffMap = new Map();
  users.forEach((user) => {
    const role = String(user.role || '').toLowerCase();
    if (role.includes('it') && !role.includes('manager')) {
      const label = user.fullName || user.username || user.email || 'IT staff';
      const aliases = getUserTaskAliases(user);
      staffMap.set(label, { label, aliases, assigned: 0, inProgress: 0, pendingApproval: 0, approved: 0 });
    }
  });

  tasks.forEach((task) => {
    staffMap.forEach((item) => {
      const matches = (task.assignedTo || []).some((assignee) => item.aliases.includes(String(assignee).trim().toLowerCase()));
      if (!matches) return;
      if (!['approved', 'closed'].includes(task.supportStatus)) item.assigned += 1;
      if (['in_progress', 'reported'].includes(task.supportStatus)) item.inProgress += 1;
      if ((task.ticketRecords || []).some((record) => record.approvalStatus === 'pending_approval')) item.pendingApproval += 1;
      if (task.supportStatus === 'approved') item.approved += 1;
    });
  });

  return [...staffMap.values()].sort((a, b) => b.assigned - a.assigned || a.label.localeCompare(b.label));
};

const toCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const appendSelectedFileNames = (currentValue = '', fileList = []) => {
  const names = Array.from(fileList || []).map((file) => file.name).filter(Boolean);
  if (!names.length) return currentValue;
  return [currentValue, names.join('\n')].filter(Boolean).join('\n');
};

const getRecords = (tasks = []) => tasks.flatMap((task) => (
  (task.ticketRecords || []).map((record) => ({
    ...record,
    taskId: task._id || task.id,
    taskTitle: getTaskTitle(task),
    taskCategory: task.ticketCategory || task.actionType || 'support',
    taskLeader: task.taskLeader,
    supportStatus: task.supportStatus,
    priority: task.priority || 'normal',
    requestedDepartment: task.requestedDepartment,
    requestedAt: task.requestedAt,
    sla: task.sla,
  }))
));

const isSupportTicketTask = (task = {}) => (
  task.requestSource === 'employee_call'
  || Boolean(task.supportRequestNote)
  || Boolean(task.requestedAt)
  || (task.ticketRecords || []).length > 0
);

const isAssignedStaff = (task = {}, user = {}) => {
  const aliases = getUserTaskAliases(user);
  return (task.assignedTo || []).some((assignee) => aliases.includes(String(assignee).trim().toLowerCase()));
};

const isAssignedLeader = (task = {}, user = {}) => {
  const aliases = getUserTaskAliases(user);
  return aliases.includes(String(task.taskLeader || '').trim().toLowerCase());
};

const hasSubmittedReport = (task = {}) => (
  (task.ticketRecords || []).some((record) => ['pending_approval', 'approved'].includes(record.approvalStatus))
);

const buildRankings = (records = []) => {
  const map = new Map();
  records.forEach((record) => {
    const key = String(record.staff || record.staffName || 'unknown');
    const item = map.get(key) || {
      key,
      staffName: record.staffName || 'Unknown staff',
      approvedPoints: 0,
      approvedRecords: 0,
      pendingRecords: 0,
      totalRecords: 0,
      accomplishedRecords: [],
    };
    item.totalRecords += 1;
    const isAccomplished = !String(record.outstandingTasks || '').trim();
    if (record.approvalStatus === 'approved' && isAccomplished) {
      item.approvedRecords += 1;
      item.approvedPoints += Number(record.points) || 0;
      item.accomplishedRecords.push(record);
    } else if (record.approvalStatus !== 'rejected') {
      item.pendingRecords += 1;
    }
    map.set(key, item);
  });

  return [...map.values()]
    .sort((a, b) => b.approvedPoints - a.approvedPoints || b.approvedRecords - a.approvedRecords)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

export default function TicketManagementTab({ tasks = [], users = [], currentUser, persona, fetchTasks }) {
  const toast = useToast();
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [recordDraft, setRecordDraft] = useState({
    workType: 'support',
    summary: '',
    outstandingTasks: '',
    attachments: '',
    completedAt: new Date().toISOString().slice(0, 10),
    durationMinutes: 30,
  });
  const [supportDraft, setSupportDraft] = useState({
    taskName: '',
    ticketCategory: 'support',
    priority: 'normal',
    requestedBy: currentUser?.fullName || currentUser?.username || '',
    requestedDepartment: currentUser?.department || '',
    summary: '',
    attachments: '',
  });
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [managerNotes, setManagerNotes] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [managerTicketFilter, setManagerTicketFilter] = useState('undone');
  const [expandedRankingKey, setExpandedRankingKey] = useState('');
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState('');
  const [isTicketManagementExpanded, setIsTicketManagementExpanded] = useState(true);
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);
  const [expandedSentSupportIds, setExpandedSentSupportIds] = useState({});
  const [saving, setSaving] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.800');
  const panelBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.600', 'gray.400');

  const visibleTicketTasks = useMemo(() => tasks.filter(isSupportTicketTask), [tasks]);
  const activeTicketTasks = useMemo(() => visibleTicketTasks.filter((task) => (
    task.supportStatus !== 'approved'
    || (task.ticketRecords || []).some((record) => String(record.outstandingTasks || '').trim())
  )), [visibleTicketTasks]);

  const reportableSupport = visibleTicketTasks.filter((task) => (
    ['in_progress', 'rejected'].includes(task.supportStatus)
    && isAssignedStaff(task, currentUser)
    && !hasSubmittedReport(task)
  ));
  const selectedTask = reportableSupport.find((task) => String(task._id || task.id) === String(selectedTaskId)) || reportableSupport[0];
  const records = useMemo(() => getRecords(visibleTicketTasks), [visibleTicketTasks]);
  const escalatedTickets = useMemo(() => visibleTicketTasks.filter((task) => getSlaState(task).escalated), [visibleTicketTasks]);
  const staffWorkload = useMemo(() => getStaffWorkload(visibleTicketTasks, users), [visibleTicketTasks, users]);
  const aliases = useMemo(() => getUserTaskAliases(currentUser || {}), [currentUser]);
  const ownRecords = records.filter((record) => (
    aliases.includes(String(record.staff || '').toLowerCase())
    || aliases.includes(String(record.staffName || '').toLowerCase())
  ));
  const rankings = useMemo(() => buildRankings(records), [records]);
  const canApprove = persona?.canApproveTasks;
  const canRecord = !canApprove && isAssignedStaff(selectedTask, currentUser);
  const pendingRecords = records.filter((record) => record.approvalStatus === 'pending_approval');
  const supportRequests = visibleTicketTasks.filter((task) => ['requested', 'manager_accepted'].includes(task.supportStatus));
  const managerAcceptedTickets = useMemo(() => visibleTicketTasks
    .filter((task) => !['requested', 'manager_accepted'].includes(task.supportStatus))
    .map((task) => {
      const hasOutstanding = (task.ticketRecords || []).some((record) => String(record.outstandingTasks || '').trim());
      const isDone = ['approved', 'closed'].includes(task.supportStatus) && !hasOutstanding;
      return { ...task, isDone, hasOutstanding };
    })
    .filter((task) => {
      if (managerTicketFilter === 'done') return task.isDone;
      if (managerTicketFilter === 'undone') return !task.isDone;
      return true;
    }), [managerTicketFilter, visibleTicketTasks]);
  const sentSupportRequests = visibleTicketTasks.filter((task) => (
    aliases.includes(String(task.requestedBy || '').trim().toLowerCase())
    || aliases.includes(String(task.createdBy || '').trim().toLowerCase())
  ));
  const assignedSupport = visibleTicketTasks.filter((task) => ['assigned', 'staff_accepted'].includes(task.supportStatus) && isAssignedStaff(task, currentUser));
  const selectedDetailTask = visibleTicketTasks.find((task) => String(task._id || task.id) === String(selectedDetailTaskId))
    || managerAcceptedTickets[0]
    || sentSupportRequests[0]
    || visibleTicketTasks[0];
  const selectedTimeline = useMemo(() => buildTicketTimeline(selectedDetailTask), [selectedDetailTask]);
  const canEditRequesterFeedback = selectedDetailTask && (canApprove || isAssignedLeader(selectedDetailTask, currentUser));
  const itStaffOptions = users.filter((user) => {
    const role = String(user.role || '').toLowerCase();
    return role.includes('it') && !role.includes('manager');
  });
  const leaderOptions = users.filter((user) => {
    const role = String(user.role || '').toLowerCase();
    return role.includes('leader') || role.includes('manager') || role.includes('admin');
  });
  const canDeleteRecord = (record) => (
    canApprove
    || (
      record.approvalStatus !== 'approved'
      && (
        aliases.includes(String(record.staff || '').toLowerCase())
        || aliases.includes(String(record.staffName || '').toLowerCase())
      )
    )
  );

  const createSupportRequest = async () => {
    if (!supportDraft.summary.trim()) {
      toast({ title: 'Please describe the support needed', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post('/it/support-requests', supportDraft);
      setSupportDraft({
        taskName: '',
        ticketCategory: 'support',
        priority: 'normal',
        requestedBy: currentUser?.fullName || currentUser?.username || '',
        requestedDepartment: currentUser?.department || '',
        summary: '',
        attachments: '',
      });
      await fetchTasks?.();
      toast({ title: 'Support request sent to the manager', status: 'success' });
    } catch (error) {
      toast({ title: 'Support request failed', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const acceptSupportRequest = async (task) => {
    const draft = assignmentDrafts[task._id || task.id] || {};
    if (!draft.assignedTo) {
      toast({ title: 'Please select IT staff to assign', status: 'warning' });
      return;
    }
    try {
      await axiosInstance.post(`/it/${task._id || task.id}/support/accept`, {
        taskLeader: draft.taskLeader || currentUser?.username || currentUser?.email || '',
        assignedTo: [draft.assignedTo],
        note: draft.note || '',
      });
      await fetchTasks?.();
      toast({ title: 'Support request accepted and assigned', status: 'success' });
    } catch (error) {
      toast({ title: 'Assignment failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const acceptAssignedSupport = async (task) => {
    try {
      await axiosInstance.post(`/it/${task._id || task.id}/support/staff-accept`, {});
      await fetchTasks?.();
      toast({ title: 'Support ticket accepted. You can now report progress.', status: 'success' });
    } catch (error) {
      toast({ title: 'Could not accept support ticket', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const saveRecord = async () => {
    if (!selectedTask?._id && !selectedTask?.id) return;
    if (!recordDraft.summary.trim()) {
      toast({ title: 'Please describe what was completed', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(`/it/${selectedTask._id || selectedTask.id}/support/report`, recordDraft);
      setRecordDraft({
        workType: 'support',
        summary: '',
        outstandingTasks: '',
        attachments: '',
        completedAt: new Date().toISOString().slice(0, 10),
        durationMinutes: 30,
      });
      setSelectedTaskId('');
      await fetchTasks?.();
      toast({ title: 'Support report submitted for manager approval', status: 'success' });
    } catch (error) {
      toast({ title: 'Could not record ticket work', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const approveRecord = async (record, approvalStatus) => {
    try {
      await axiosInstance.patch(`/it/${record.taskId}/ticket-records/${record._id}/approval`, {
        approvalStatus,
        managerNote: managerNotes[record._id] || '',
      });
      await fetchTasks?.();
      toast({ title: approvalStatus === 'approved' ? 'Ticket work approved' : 'Ticket work rejected', status: 'success' });
    } catch (error) {
      toast({ title: 'Review failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm('Delete this ticket work record?')) return;
    try {
      await axiosInstance.delete(`/it/${record.taskId}/ticket-records/${record._id}`);
      await fetchTasks?.();
      toast({ title: 'Ticket work record deleted', status: 'success' });
    } catch (error) {
      toast({ title: 'Delete failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const addTicketComment = async (task) => {
    const taskId = task?._id || task?.id;
    const body = String(commentDrafts[taskId] || '').trim();
    if (!taskId || !body) {
      toast({ title: 'Write a comment first', status: 'warning' });
      return;
    }
    try {
      await axiosInstance.post(`/it/${taskId}/comments`, { body });
      setCommentDrafts({ ...commentDrafts, [taskId]: '' });
      await fetchTasks?.();
      toast({ title: 'Comment added to ticket', status: 'success' });
    } catch (error) {
      toast({ title: 'Comment failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const submitFeedback = async (task) => {
    const taskId = task?._id || task?.id;
    const draft = feedbackDrafts[taskId] || {};
    const rating = Number(draft.rating || task?.requesterFeedback?.rating || 0);
    if (!taskId || !rating) {
      toast({ title: 'Select a feedback rating', status: 'warning' });
      return;
    }
    try {
      await axiosInstance.post(`/it/${taskId}/feedback`, {
        rating,
        comment: draft.comment ?? task?.requesterFeedback?.comment ?? '',
        submittedBy: currentUser?.fullName || currentUser?.username || task.requestedBy || '',
      });
      await fetchTasks?.();
      toast({ title: 'Requester feedback saved', status: 'success' });
    } catch (error) {
      toast({ title: 'Feedback failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const exportTicketReport = () => {
    const rows = records.map((record) => {
      const slaState = getSlaState(record);
      return [
        record.taskTitle,
        record.requestedDepartment || '',
        record.priority || 'normal',
        record.staffName || '',
        record.workType || '',
        record.supportStatus || '',
        record.approvalStatus || '',
        record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '',
        record.points || 0,
        slaState.label,
        record.summary || '',
        record.outstandingTasks || '',
        (record.attachments || []).join(' | '),
      ];
    });
    const header = ['Ticket', 'Department', 'Priority', 'Staff', 'Work type', 'Support stage', 'Approval', 'Completed', 'Points', 'SLA', 'Summary', 'Outstanding', 'Attachments'];
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `it-ticket-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSentSupport = (taskId) => {
    setExpandedSentSupportIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  return (
    <VStack spacing={5} align="stretch">
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
        <CardBody>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
            <HStack align="start" spacing={3}>
              <Button
                aria-label={isTicketManagementExpanded ? 'Collapse Ticket Management' : 'Expand Ticket Management'}
                size="sm"
                variant="ghost"
                minW="36px"
                px={0}
                onClick={() => setIsTicketManagementExpanded(!isTicketManagementExpanded)}
              >
                <Icon as={isTicketManagementExpanded ? FiChevronDown : FiChevronRight} />
              </Button>
              <Box>
                <Heading size="lg">Ticket Management</Heading>
                <Text color={muted}>Contact the IT Support Department for internal systems, sales systems, hardware, network, software, and account support.</Text>
              </Box>
            </HStack>
            <HStack alignSelf={{ base: 'flex-start', md: 'center' }}>
              <Badge colorScheme="cyan" borderRadius="full" px={3} py={1}>
                IT Support Department
              </Badge>
              <Button size="sm" leftIcon={<FiDownload />} variant="outline" onClick={exportTicketReport} isDisabled={records.length === 0}>
                Export CSV
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      <Collapse in={isTicketManagementExpanded} animateOpacity style={{ width: '100%' }}>
        <VStack spacing={5} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 3, xl: 6 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Active Support Tasks</StatLabel><StatNumber>{activeTicketTasks.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Recorded Work</StatLabel><StatNumber>{records.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Support Calls</StatLabel><StatNumber>{supportRequests.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Pending Approval</StatLabel><StatNumber>{pendingRecords.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>My Records</StatLabel><StatNumber>{ownRecords.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>SLA Escalations</StatLabel><StatNumber>{escalatedTickets.length}</StatNumber></Stat></CardBody></Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: canApprove ? 1 : 2 }} spacing={5}>
        {!canApprove && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FiPhoneCall} color="teal.500" />
              <Heading size="md">Contact the IT Support Department</Heading>
            </HStack>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Requester</FormLabel>
                  <Input value={supportDraft.requestedBy} onChange={(event) => setSupportDraft({ ...supportDraft, requestedBy: event.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Input value={supportDraft.requestedDepartment} onChange={(event) => setSupportDraft({ ...supportDraft, requestedDepartment: event.target.value })} />
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl>
                  <FormLabel>Support title</FormLabel>
                  <Input placeholder="Printer issue, Wi-Fi down..." value={supportDraft.taskName} onChange={(event) => setSupportDraft({ ...supportDraft, taskName: event.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Support type</FormLabel>
                  <Select value={supportDraft.ticketCategory} onChange={(event) => setSupportDraft({ ...supportDraft, ticketCategory: event.target.value })}>
                    {WORK_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select value={supportDraft.priority} onChange={(event) => setSupportDraft({ ...supportDraft, priority: event.target.value })}>
                    {PRIORITY_OPTIONS.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>What assistance is needed?</FormLabel>
                <Textarea minH="100px" value={supportDraft.summary} onChange={(event) => setSupportDraft({ ...supportDraft, summary: event.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Attachments or reference links</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Textarea
                    minH="70px"
                    value={supportDraft.attachments}
                    onChange={(event) => setSupportDraft({ ...supportDraft, attachments: event.target.value })}
                    placeholder="Paste file links, screenshots, drive links, or reference URLs. Separate each by comma or new line."
                  />
                  <Button as="label" size="sm" variant="outline" leftIcon={<FiPaperclip />} alignSelf="flex-start" cursor="pointer">
                    Select from Folder
                    <Input
                      type="file"
                      multiple
                      display="none"
                      onChange={(event) => setSupportDraft({
                        ...supportDraft,
                        attachments: appendSelectedFileNames(supportDraft.attachments, event.target.files),
                      })}
                    />
                  </Button>
                  {supportDraft.attachments && (
                    <HStack color="purple.600" fontSize="sm">
                      <Icon as={FiPaperclip} />
                      <Text>Attachment references added</Text>
                    </HStack>
                  )}
                </VStack>
              </FormControl>
              <Button colorScheme="teal" leftIcon={<FiSend />} onClick={createSupportRequest} isLoading={saving}>
                Send Alert to Manager
              </Button>
            </VStack>
          </CardBody>
        </Card>
        )}

        {canApprove ? (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
            <CardBody>
              <HStack mb={4}>
                <Icon as={FiUserCheck} color="purple.500" />
                <Heading size="md">Manager Support Queue</Heading>
              </HStack>
              <VStack align="stretch" spacing={3}>
                {supportRequests.length === 0 ? (
                <Box bg={panelBg} p={4} borderRadius="xl" color={muted}>No new support calls waiting for assignment.</Box>
              ) : supportRequests.map((task) => {
                const taskId = task._id || task.id;
                const draft = assignmentDrafts[taskId] || {};
                const slaState = getSlaState(task);
                return (
                  <Box key={taskId} bg={panelBg} borderRadius="xl" p={4}>
                    <HStack justify="space-between" align="start" mb={3}>
                      <Box>
                        <Text fontWeight="800">{getTaskTitle(task)}</Text>
                        <Text fontSize="sm" color={muted}>{task.supportRequestNote || task.description}</Text>
                        <HStack spacing={2} mt={2} flexWrap="wrap">
                          <Badge colorScheme={getPriorityColor(task.priority)}>{task.priority || 'normal'} priority</Badge>
                          <Badge colorScheme={slaState.color}>{slaState.label}</Badge>
                          {task.attachments?.length > 0 && <Badge colorScheme="purple">{task.attachments.length} attachments</Badge>}
                        </HStack>
                      </Box>
                      <VStack align="end" spacing={2}>
                        <Badge colorScheme="orange">{task.supportStatus}</Badge>
                        <Button size="xs" variant="outline" onClick={() => setSelectedDetailTaskId(taskId)}>Details</Button>
                      </VStack>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                      <Select size="sm" placeholder="Leader" value={draft.taskLeader || ''} onChange={(event) => setAssignmentDrafts({ ...assignmentDrafts, [taskId]: { ...draft, taskLeader: event.target.value } })}>
                        {leaderOptions.map((user) => <option key={user._id || user.email} value={user.email || user.username}>{user.fullName || user.username || user.email}</option>)}
                      </Select>
                      <Select size="sm" placeholder="Assign staff" value={draft.assignedTo || ''} onChange={(event) => setAssignmentDrafts({ ...assignmentDrafts, [taskId]: { ...draft, assignedTo: event.target.value } })}>
                        {itStaffOptions.map((user) => <option key={user._id || user.email} value={user.email || user.username}>{user.fullName || user.username || user.email}</option>)}
                      </Select>
                      <Button size="sm" colorScheme="blue" onClick={() => acceptSupportRequest(task)}>Accept & Assign</Button>
                    </SimpleGrid>
                  </Box>
                );
              })}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
            <CardBody>
              <HStack mb={4}>
                <Icon as={FiSend} color="blue.500" />
                <Heading size="md">Support requests sent to the manager</Heading>
              </HStack>
              <VStack align="stretch" spacing={3}>
                {sentSupportRequests.length === 0 ? (
                  <Box bg={panelBg} p={4} borderRadius="xl" color={muted}>No support requests sent yet.</Box>
                ) : sentSupportRequests.slice(0, 8).map((task) => {
                  const slaState = getSlaState(task);
                  const taskId = task._id || task.id;
                  const isExpanded = Boolean(expandedSentSupportIds[taskId]);
                  return (
                    <Box key={taskId} bg={panelBg} borderRadius="xl" p={3}>
                      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                        <HStack minW={0} spacing={3}>
                          <Button
                            aria-label={isExpanded ? 'Collapse support request details' : 'Expand support request details'}
                            size="xs"
                            variant="ghost"
                            minW="28px"
                            px={0}
                            onClick={() => toggleSentSupport(taskId)}
                          >
                            <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
                          </Button>
                          <Text fontWeight="800" noOfLines={1}>{getTaskTitle(task)}</Text>
                        </HStack>
                        <HStack justify={{ base: 'space-between', md: 'flex-end' }}>
                          <Badge colorScheme={task.supportStatus === 'requested' ? 'orange' : task.supportStatus === 'approved' ? 'green' : 'blue'}>
                            {String(task.supportStatus || 'requested').replace('_', ' ')}
                          </Badge>
                          <Button size="xs" variant="outline" onClick={() => setSelectedDetailTaskId(taskId)}>View Details</Button>
                        </HStack>
                      </Flex>
                      {isExpanded && (
                        <Box mt={3} pl={{ base: 0, md: 10 }}>
                          <Text fontSize="sm" color={muted}>{task.supportRequestNote || task.description}</Text>
                          <HStack spacing={2} mt={2} flexWrap="wrap">
                            <Badge colorScheme={getPriorityColor(task.priority)}>{task.priority || 'normal'} priority</Badge>
                            <Badge colorScheme={slaState.color}>{slaState.label}</Badge>
                            <Badge>{task.requestedAt ? new Date(task.requestedAt).toLocaleString() : 'recently sent'}</Badge>
                            {(task.assignedTo || []).length > 0 && <Badge colorScheme="purple">Assigned: {(task.assignedTo || []).join(', ')}</Badge>}
                          </HStack>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      {!canApprove && assignedSupport.length > 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <Heading size="md" mb={4}>Assigned Support Waiting for Staff Acceptance</Heading>
            <VStack align="stretch" spacing={3}>
              {assignedSupport.map((task) => (
                <Flex key={task._id || task.id} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} bg={panelBg} borderRadius="xl" p={3}>
                  <Box>
                    <Text fontWeight="800">{getTaskTitle(task)}</Text>
                    <Text fontSize="sm" color={muted}>{task.description}</Text>
                    <Badge mt={2} colorScheme={getPriorityColor(task.priority)}>{task.priority || 'normal'} priority</Badge>
                  </Box>
                  <HStack>
                    <Button size="sm" variant="outline" onClick={() => setSelectedDetailTaskId(task._id || task.id)}>Details</Button>
                    <Button colorScheme="green" size="sm" onClick={() => acceptAssignedSupport(task)}>Accept Ticket</Button>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {canApprove && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FiTool} color="teal.500" />
              <Heading size="md">Staff Workload View</Heading>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
              {staffWorkload.length === 0 ? (
                <Box bg={panelBg} p={4} borderRadius="xl" color={muted}>No IT staff workload data is available yet.</Box>
              ) : staffWorkload.map((staff) => (
                <Box key={staff.label} bg={panelBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                  <Text fontWeight="800">{staff.label}</Text>
                  <HStack mt={3} spacing={2} flexWrap="wrap">
                    <Badge colorScheme="blue">{staff.assigned} active</Badge>
                    <Badge colorScheme="purple">{staff.inProgress} working</Badge>
                    <Badge colorScheme="orange">{staff.pendingApproval} approval</Badge>
                    <Badge colorScheme="green">{staff.approved} done</Badge>
                  </HStack>
                  <Progress mt={3} value={Math.min(100, staff.assigned * 20 + staff.pendingApproval * 10)} colorScheme={staff.assigned > 4 ? 'red' : staff.assigned > 2 ? 'orange' : 'green'} borderRadius="full" />
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="stretch">
        {!canApprove && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FiTool} color="blue.500" />
              <Heading size="md">Support Work Completion Report</Heading>
            </HStack>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Ticket task</FormLabel>
                <Select value={selectedTaskId || selectedTask?._id || ''} onChange={(event) => setSelectedTaskId(event.target.value)}>
                  {reportableSupport.length === 0 && (
                    <option value="">No reportable ticket tasks</option>
                  )}
                  {reportableSupport.map((task) => (
                    <option key={task._id || task.id} value={task._id || task.id}>
                      {getTaskTitle(task)} - {task.supportStatus || task.ticketCategory || 'ticket'}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Work type</FormLabel>
                  <Select value={recordDraft.workType} onChange={(event) => setRecordDraft({ ...recordDraft, workType: event.target.value })}>
                    {WORK_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Completed date</FormLabel>
                  <Input type="date" value={recordDraft.completedAt} onChange={(event) => setRecordDraft({ ...recordDraft, completedAt: event.target.value })} />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Time spent in minutes</FormLabel>
                <NumberInput min={0} value={recordDraft.durationMinutes} onChange={(_, value) => setRecordDraft({ ...recordDraft, durationMinutes: value || 0 })}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>What was accomplished?</FormLabel>
                <Textarea
                  minH="120px"
                  value={recordDraft.summary}
                  onChange={(event) => setRecordDraft({ ...recordDraft, summary: event.target.value })}
                  placeholder="Example: Replaced damaged router cable, tested connectivity, and restored finance office network access."
                />
              </FormControl>
              <FormControl>
                <FormLabel>Outstanding tasks, if any</FormLabel>
                <Textarea
                  minH="80px"
                  value={recordDraft.outstandingTasks}
                  onChange={(event) => setRecordDraft({ ...recordDraft, outstandingTasks: event.target.value })}
                  placeholder="Example: Need replacement switch approval, follow-up test tomorrow, or no outstanding work."
                />
              </FormControl>
              <FormControl>
                <FormLabel>Report attachments or file references</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Textarea
                    minH="70px"
                    value={recordDraft.attachments}
                    onChange={(event) => setRecordDraft({ ...recordDraft, attachments: event.target.value })}
                    placeholder="Paste report file links or select files from your folder."
                  />
                  <Button as="label" size="sm" variant="outline" leftIcon={<FiPaperclip />} alignSelf="flex-start" cursor="pointer">
                    Select Report Files
                    <Input
                      type="file"
                      multiple
                      display="none"
                      onChange={(event) => setRecordDraft({
                        ...recordDraft,
                        attachments: appendSelectedFileNames(recordDraft.attachments, event.target.files),
                      })}
                    />
                  </Button>
                  {recordDraft.attachments && (
                    <HStack color="purple.600" fontSize="sm">
                      <Icon as={FiPaperclip} />
                      <Text>Report attachment references added</Text>
                    </HStack>
                  )}
                </VStack>
              </FormControl>
              <Button colorScheme="blue" leftIcon={<FiCheckCircle />} onClick={saveRecord} isLoading={saving} isDisabled={!canRecord || !selectedTask}>
                Submit Report for Manager Approval
              </Button>
              {reportableSupport.length === 0 ? (
                <Text fontSize="sm" color={muted}>No ticket task is ready for a new report.</Text>
              ) : !canRecord && (
                <Text fontSize="sm" color="orange.500">Only the assigned staff member can report this ticket.</Text>
              )}
            </VStack>
          </CardBody>
        </Card>
        )}

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FiAward} color="purple.500" />
              <Heading size="md">Staff Ranking</Heading>
            </HStack>
            <VStack align="stretch" spacing={3}>
              {rankings.length === 0 ? (
                <Box bg={panelBg} borderRadius="xl" p={5} color={muted}>No approved and fully accomplished support work is available for ranking yet.</Box>
              ) : rankings.slice(0, 8).map((item) => (
                <Box key={item.key || item.staffName} bg={panelBg} borderRadius="xl" p={3}>
                  <Flex align={{ base: 'stretch', md: 'center' }} justify="space-between" gap={3} direction={{ base: 'column', md: 'row' }}>
                    <HStack>
                      <Flex boxSize="34px" borderRadius="full" bg={item.rank === 1 ? 'yellow.100' : 'blue.50'} color={item.rank === 1 ? 'yellow.700' : 'blue.600'} align="center" justify="center" fontWeight="800">
                        {item.rank}
                      </Flex>
                      <Box>
                        <Text fontWeight="700">{item.staffName}</Text>
                        <Text fontSize="xs" color={muted}>{item.approvedRecords} approved accomplished / {item.pendingRecords} pending</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Badge colorScheme="green" borderRadius="full" px={3}>{item.approvedPoints} pts</Badge>
                      {canApprove && (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="purple"
                          onClick={() => setExpandedRankingKey(expandedRankingKey === item.key ? '' : item.key)}
                        >
                          {expandedRankingKey === item.key ? 'Hide tasks' : 'View tasks'}
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                  {canApprove && expandedRankingKey === item.key && (
                    <VStack align="stretch" spacing={2} mt={3}>
                      {item.accomplishedRecords.length === 0 ? (
                        <Text fontSize="sm" color={muted}>No approved accomplished tasks for this staff member.</Text>
                      ) : item.accomplishedRecords.map((record) => (
                        <Box key={record._id || `${record.taskId}-${record.completedAt}`} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={3}>
                          <HStack justify="space-between" align="start">
                            <Box>
                              <Text fontWeight="700">{record.taskTitle}</Text>
                              <Text fontSize="sm" color={muted}>{record.summary}</Text>
                            </Box>
                            <Badge colorScheme="green">{record.points || 0} pts</Badge>
                          </HStack>
                          <Text fontSize="xs" color={muted} mt={1}>
                            {record.completedAt ? new Date(record.completedAt).toLocaleDateString() : 'No date'} • {record.workType || 'support'}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {canApprove && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
            <CardBody>
              <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} mb={4}>
                <Box>
                  <Heading size="md">Accepted Ticket Register</Heading>
                  <Text color={muted}>Manager record of accepted and assigned support tickets.</Text>
                </Box>
                <RadioGroup value={managerTicketFilter} onChange={setManagerTicketFilter}>
                  <HStack spacing={4}>
                    <Radio value="undone">Undone</Radio>
                    <Radio value="done">Done</Radio>
                    <Radio value="all">All</Radio>
                  </HStack>
                </RadioGroup>
              </Flex>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Ticket</Th>
                      <Th>Department</Th>
                      <Th>Priority</Th>
                      <Th>Date</Th>
                      <Th>Assigned Person</Th>
                      <Th>SLA</Th>
                      <Th>Status</Th>
                      <Th>Details</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {managerAcceptedTickets.length === 0 ? (
                      <Tr>
                        <Td colSpan={8} textAlign="center" py={7} color={muted}>
                          No accepted tickets in this view.
                        </Td>
                      </Tr>
                    ) : managerAcceptedTickets.map((task) => {
                      const slaState = getSlaState(task);
                      return (
                        <Tr key={task._id || task.id}>
                          <Td>
                            <Text fontWeight="700">{getTaskTitle(task)}</Text>
                            <Text fontSize="xs" color={muted}>{task.supportRequestNote || task.description || '-'}</Text>
                          </Td>
                          <Td>{task.requestedDepartment || '-'}</Td>
                          <Td><Badge colorScheme={getPriorityColor(task.priority)}>{task.priority || 'normal'}</Badge></Td>
                          <Td>{task.requestedAt ? new Date(task.requestedAt).toLocaleDateString() : task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}</Td>
                          <Td>{(task.assignedTo || []).join(', ') || 'Unassigned'}</Td>
                          <Td><Badge colorScheme={slaState.color}>{slaState.label}</Badge></Td>
                          <Td>
                            <Badge colorScheme={task.isDone ? 'green' : task.hasOutstanding ? 'orange' : 'blue'}>
                              {task.isDone ? 'Done' : task.hasOutstanding ? 'Undone - outstanding' : String(task.supportStatus || 'assigned').replace('_', ' ')}
                            </Badge>
                          </Td>
                          <Td><Button size="xs" variant="outline" onClick={() => setSelectedDetailTaskId(task._id || task.id)}>Open</Button></Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      {selectedDetailTask && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <Flex justify="space-between" align={{ base: 'stretch', md: 'start' }} gap={4} direction={{ base: 'column', md: 'row' }} mb={4}>
              <Box>
                <HStack spacing={2} flexWrap="wrap" mb={2}>
                  <Icon as={FiClock} color="cyan.500" />
                  <Heading size="md">Ticket Detail, Timeline & Comments</Heading>
                </HStack>
                <Text fontWeight="800">{getTaskTitle(selectedDetailTask)}</Text>
                <Text color={muted}>{selectedDetailTask.supportRequestNote || selectedDetailTask.description || 'No ticket description.'}</Text>
              </Box>
              <Flex align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                <Select
                  maxW={{ base: '100%', md: '360px' }}
                  value={selectedDetailTask._id || selectedDetailTask.id}
                  onChange={(event) => setSelectedDetailTaskId(event.target.value)}
                >
                  {visibleTicketTasks.map((task) => (
                    <option key={task._id || task.id} value={task._id || task.id}>{getTaskTitle(task)}</option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  leftIcon={isDetailExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                >
                  {isDetailExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </Flex>
            </Flex>

            <Collapse in={isDetailExpanded} animateOpacity>
            <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4}>
              <Box bg={panelBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                <HStack mb={3}>
                  <Icon as={FiAlertTriangle} color={`${getSlaState(selectedDetailTask).color}.500`} />
                  <Heading size="sm">SLA & Escalation</Heading>
                </HStack>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between"><Text color={muted}>Priority</Text><Badge colorScheme={getPriorityColor(selectedDetailTask.priority)}>{selectedDetailTask.priority || 'normal'}</Badge></HStack>
                  <HStack justify="space-between"><Text color={muted}>Response due</Text><Text fontWeight="700">{formatDateTime(selectedDetailTask.sla?.responseDueAt)}</Text></HStack>
                  <HStack justify="space-between"><Text color={muted}>Resolution due</Text><Text fontWeight="700">{formatDateTime(selectedDetailTask.sla?.resolutionDueAt)}</Text></HStack>
                  <HStack justify="space-between"><Text color={muted}>Status</Text><Badge colorScheme={getSlaState(selectedDetailTask).color}>{getSlaState(selectedDetailTask).label}</Badge></HStack>
                  {getSlaState(selectedDetailTask).escalated && (
                    <Box bg="red.50" border="1px solid" borderColor="red.100" color="red.700" borderRadius="lg" p={3}>
                      {getSlaState(selectedDetailTask).escalationReason || 'This ticket has crossed its SLA target and needs escalation.'}
                    </Box>
                  )}
                </VStack>
              </Box>

              <Box bg={panelBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                <HStack mb={3}>
                  <Icon as={FiPaperclip} color="purple.500" />
                  <Heading size="sm">Attachments</Heading>
                </HStack>
                <VStack align="stretch" spacing={2}>
                  {(selectedDetailTask.attachments || []).length === 0 ? (
                    <Text color={muted}>No attachments or reference links were added.</Text>
                  ) : selectedDetailTask.attachments.map((attachment, index) => (
                    <Button
                      key={`${attachment}-${index}`}
                      as="a"
                      href={attachment}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="outline"
                      justifyContent="flex-start"
                      leftIcon={<FiPaperclip />}
                    >
                      {attachment}
                    </Button>
                  ))}
                </VStack>
              </Box>

              <Box bg={panelBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                <HStack mb={3}>
                  <Icon as={FiStar} color="yellow.500" />
                  <Heading size="sm">Requester Feedback</Heading>
                </HStack>
                {canEditRequesterFeedback && ['approved', 'closed'].includes(selectedDetailTask.supportStatus) ? (
                  <VStack align="stretch" spacing={3}>
                    {selectedDetailTask.requesterFeedback?.submittedAt && (
                      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={3}>
                        <Badge colorScheme="yellow" alignSelf="flex-start">{selectedDetailTask.requesterFeedback.rating} / 5 current rating</Badge>
                        <Text mt={2}>{selectedDetailTask.requesterFeedback.comment || 'No feedback comment.'}</Text>
                        <Text fontSize="xs" color={muted}>{formatDateTime(selectedDetailTask.requesterFeedback.submittedAt)}</Text>
                      </Box>
                    )}
                    <Select
                      placeholder="Rating"
                      value={feedbackDrafts[selectedDetailTask._id || selectedDetailTask.id]?.rating ?? selectedDetailTask.requesterFeedback?.rating ?? ''}
                      onChange={(event) => setFeedbackDrafts({
                        ...feedbackDrafts,
                        [selectedDetailTask._id || selectedDetailTask.id]: {
                          ...(feedbackDrafts[selectedDetailTask._id || selectedDetailTask.id] || {}),
                          rating: event.target.value,
                        },
                      })}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                    </Select>
                    <Textarea
                      placeholder="Requester feedback comment"
                      value={feedbackDrafts[selectedDetailTask._id || selectedDetailTask.id]?.comment ?? selectedDetailTask.requesterFeedback?.comment ?? ''}
                      onChange={(event) => setFeedbackDrafts({
                        ...feedbackDrafts,
                        [selectedDetailTask._id || selectedDetailTask.id]: {
                          ...(feedbackDrafts[selectedDetailTask._id || selectedDetailTask.id] || {}),
                          comment: event.target.value,
                        },
                      })}
                    />
                    <Button size="sm" colorScheme="yellow" onClick={() => submitFeedback(selectedDetailTask)}>
                      {selectedDetailTask.requesterFeedback?.submittedAt ? 'Update Feedback' : 'Save Feedback'}
                    </Button>
                    <Text fontSize="xs" color={muted}>Editable only by IT admin/manager or the assigned team leader.</Text>
                  </VStack>
                ) : selectedDetailTask.requesterFeedback?.submittedAt ? (
                  <VStack align="stretch" spacing={2}>
                    <Badge colorScheme="yellow" alignSelf="flex-start">{selectedDetailTask.requesterFeedback.rating} / 5 rating</Badge>
                    <Text>{selectedDetailTask.requesterFeedback.comment || 'No feedback comment.'}</Text>
                    <Text fontSize="xs" color={muted}>{formatDateTime(selectedDetailTask.requesterFeedback.submittedAt)}</Text>
                  </VStack>
                ) : ['approved', 'closed'].includes(selectedDetailTask.supportStatus) ? (
                  <Text color={muted}>Feedback is not available for editing with your role.</Text>
                ) : (
                  <Text color={muted}>Feedback opens after the ticket is approved or closed.</Text>
                )}
              </Box>
            </SimpleGrid>

            <Divider my={5} />

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
              <Box>
                <HStack mb={3}>
                  <Icon as={FiClock} color="blue.500" />
                  <Heading size="sm">Ticket Timeline</Heading>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {selectedTimeline.length === 0 ? (
                    <Box bg={panelBg} p={4} borderRadius="xl" color={muted}>No timeline activity yet.</Box>
                  ) : selectedTimeline.map((entry, index) => (
                    <Box key={`${entry.type}-${entry.createdAt}-${index}`} borderLeft="3px solid" borderColor={entry.type === 'escalation' ? 'red.400' : 'blue.300'} pl={3} py={1}>
                      <HStack justify="space-between" align="start">
                        <Box>
                          <Text fontWeight="800">{entry.title}</Text>
                          <Text fontSize="sm" color={muted}>{entry.note || '-'}</Text>
                        </Box>
                        <Badge>{entry.type}</Badge>
                      </HStack>
                      <Text fontSize="xs" color={muted}>{entry.actorName} - {formatDateTime(entry.createdAt)}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Box>
                <HStack mb={3}>
                  <Icon as={FiMessageSquare} color="green.500" />
                  <Heading size="sm">Comment Thread Per Ticket</Heading>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {(selectedDetailTask.comments || []).length === 0 ? (
                    <Box bg={panelBg} p={4} borderRadius="xl" color={muted}>No comments have been added to this ticket.</Box>
                  ) : selectedDetailTask.comments.map((comment) => (
                    <Box key={comment._id || comment.createdAt} bg={panelBg} p={3} borderRadius="xl">
                      <Text fontWeight="700">{comment.authorName || 'IT user'}</Text>
                      <Text>{comment.body}</Text>
                      <Text fontSize="xs" color={muted}>{formatDateTime(comment.createdAt)}</Text>
                    </Box>
                  ))}
                  <Textarea
                    placeholder="Add a ticket comment, update, or note"
                    value={commentDrafts[selectedDetailTask._id || selectedDetailTask.id] || ''}
                    onChange={(event) => setCommentDrafts({ ...commentDrafts, [selectedDetailTask._id || selectedDetailTask.id]: event.target.value })}
                  />
                  <Button alignSelf="flex-start" colorScheme="green" leftIcon={<FiMessageSquare />} onClick={() => addTicketComment(selectedDetailTask)}>
                    Add Comment
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>
            </Collapse>
          </CardBody>
        </Card>
      )}

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
        <CardBody>
          <HStack mb={4}>
            <Icon as={FiCpu} color="cyan.500" />
            <Heading size="md">Ticket Work Records</Heading>
          </HStack>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Priority</Th>
                  <Th>Staff</Th>
                  <Th>Work</Th>
                  <Th>SLA</Th>
                  <Th>Support Stage</Th>
                  <Th>Completed</Th>
                  <Th>Status</Th>
                  <Th>Manager Review</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.length === 0 ? (
                  <Tr><Td colSpan={10} textAlign="center" py={8} color={muted}>No ticket work has been recorded yet.</Td></Tr>
                ) : records.map((record) => {
                  const slaState = getSlaState(record);
                  return (
                    <Tr key={record._id}>
                      <Td>
                        <Text fontWeight="700">{record.taskTitle}</Text>
                        <Text fontSize="xs" color={muted}>{record.taskCategory}</Text>
                      </Td>
                      <Td><Badge colorScheme={getPriorityColor(record.priority)}>{record.priority || 'normal'}</Badge></Td>
                      <Td>{record.staffName || 'Unknown'}</Td>
                      <Td>
                        <Badge mb={1}>{record.workType}</Badge>
                        <Text noOfLines={2}>{record.summary}</Text>
                        {record.outstandingTasks && (
                          <Text mt={1} fontSize="xs" color="orange.500" noOfLines={2}>
                            Outstanding: {record.outstandingTasks}
                          </Text>
                        )}
                        {(record.attachments || []).length > 0 && (
                          <HStack mt={1} color="purple.600" fontSize="xs">
                            <Icon as={FiPaperclip} />
                            <Text>{record.attachments.length} attachment reference{record.attachments.length > 1 ? 's' : ''}</Text>
                          </HStack>
                        )}
                      </Td>
                      <Td><Badge colorScheme={slaState.color}>{slaState.label}</Badge></Td>
                      <Td>
                        <Badge colorScheme={record.supportStatus === 'approved' ? 'green' : record.supportStatus === 'reported' ? 'purple' : 'blue'}>
                          {String(record.supportStatus || 'assigned').replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>{record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '-'}</Td>
                      <Td>
                        <Badge colorScheme={record.approvalStatus === 'approved' ? 'green' : record.approvalStatus === 'rejected' ? 'red' : 'orange'}>
                          {String(record.approvalStatus || 'pending_approval').replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        {canApprove && record.approvalStatus === 'pending_approval' ? (
                          <VStack align="stretch" spacing={2}>
                            <Input size="sm" placeholder="Manager note" value={managerNotes[record._id] || ''} onChange={(event) => setManagerNotes({ ...managerNotes, [record._id]: event.target.value })} />
                            <HStack>
                              <Button size="xs" colorScheme="green" leftIcon={<FiUserCheck />} onClick={() => approveRecord(record, 'approved')}>Approve</Button>
                              <Button size="xs" colorScheme="red" variant="outline" leftIcon={<FiXCircle />} onClick={() => approveRecord(record, 'rejected')}>Reject</Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color={muted}>{record.managerNote || record.approvedByName || '-'}</Text>
                        )}
                      </Td>
                      <Td>
                        <VStack align="stretch">
                          <Button size="xs" variant="outline" onClick={() => setSelectedDetailTaskId(record.taskId)}>
                            Details
                          </Button>
                          {canDeleteRecord(record) ? (
                            <Button size="xs" colorScheme="red" variant="ghost" leftIcon={<FiTrash2 />} onClick={() => deleteRecord(record)}>
                              Delete
                            </Button>
                          ) : (
                            <Text fontSize="xs" color={muted}>Locked</Text>
                          )}
                        </VStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
        </VStack>
      </Collapse>
    </VStack>
  );
}
