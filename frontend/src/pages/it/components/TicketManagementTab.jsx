import React, { useMemo, useState } from 'react';
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
  NumberInput,
  NumberInputField,
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
import { FiAward, FiCheckCircle, FiCpu, FiPhoneCall, FiSend, FiTool, FiTrash2, FiUserCheck, FiXCircle } from 'react-icons/fi';
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

const getRecords = (tasks = []) => tasks.flatMap((task) => (
  (task.ticketRecords || []).map((record) => ({
    ...record,
    taskId: task._id || task.id,
    taskTitle: getTaskTitle(task),
    taskCategory: task.ticketCategory || task.actionType || 'support',
    taskLeader: task.taskLeader,
    supportStatus: task.supportStatus,
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
    completedAt: new Date().toISOString().slice(0, 10),
    durationMinutes: 30,
  });
  const [supportDraft, setSupportDraft] = useState({
    taskName: '',
    ticketCategory: 'support',
    requestedBy: currentUser?.fullName || currentUser?.username || '',
    requestedDepartment: currentUser?.department || '',
    summary: '',
  });
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [managerNotes, setManagerNotes] = useState({});
  const [managerTicketFilter, setManagerTicketFilter] = useState('undone');
  const [expandedRankingKey, setExpandedRankingKey] = useState('');
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
        requestedBy: currentUser?.fullName || currentUser?.username || '',
        requestedDepartment: currentUser?.department || '',
        summary: '',
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

  return (
    <VStack spacing={5} align="stretch">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
        <Box>
          <Heading size="lg">Ticket Management</Heading>
          <Text color={muted}>Contact the IT Support Department for internal systems, sales systems, hardware, network, software, and account support.</Text>
        </Box>
        <Badge alignSelf={{ base: 'flex-start', md: 'center' }} colorScheme="cyan" borderRadius="full" px={3} py={1}>
          IT Support Department
        </Badge>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Active Support Tasks</StatLabel><StatNumber>{activeTicketTasks.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Recorded Work</StatLabel><StatNumber>{records.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Support Calls</StatLabel><StatNumber>{supportRequests.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>Pending Approval</StatLabel><StatNumber>{pendingRecords.length}</StatNumber></Stat></CardBody></Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px"><CardBody><Stat><StatLabel>My Records</StatLabel><StatNumber>{ownRecords.length}</StatNumber></Stat></CardBody></Card>
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
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
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
              </SimpleGrid>
              <FormControl>
                <FormLabel>What assistance is needed?</FormLabel>
                <Textarea minH="100px" value={supportDraft.summary} onChange={(event) => setSupportDraft({ ...supportDraft, summary: event.target.value })} />
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
                return (
                  <Box key={taskId} bg={panelBg} borderRadius="xl" p={4}>
                    <HStack justify="space-between" align="start" mb={3}>
                      <Box>
                        <Text fontWeight="800">{getTaskTitle(task)}</Text>
                        <Text fontSize="sm" color={muted}>{task.supportRequestNote || task.description}</Text>
                      </Box>
                      <Badge colorScheme="orange">{task.supportStatus}</Badge>
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
                ) : sentSupportRequests.slice(0, 8).map((task) => (
                  <Flex key={task._id || task.id} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} bg={panelBg} borderRadius="xl" p={3}>
                    <Box>
                      <Text fontWeight="800">{getTaskTitle(task)}</Text>
                      <Text fontSize="sm" color={muted}>{task.supportRequestNote || task.description}</Text>
                    </Box>
                    <Badge colorScheme={task.supportStatus === 'requested' ? 'orange' : task.supportStatus === 'approved' ? 'green' : 'blue'}>
                      {String(task.supportStatus || 'requested').replace('_', ' ')}
                    </Badge>
                  </Flex>
                ))}
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
                  </Box>
                  <Button colorScheme="green" size="sm" onClick={() => acceptAssignedSupport(task)}>Accept Ticket</Button>
                </Flex>
              ))}
            </VStack>
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
                      <Th>Date</Th>
                      <Th>Assigned Person</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {managerAcceptedTickets.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={7} color={muted}>
                          No accepted tickets in this view.
                        </Td>
                      </Tr>
                    ) : managerAcceptedTickets.map((task) => (
                      <Tr key={task._id || task.id}>
                        <Td>
                          <Text fontWeight="700">{getTaskTitle(task)}</Text>
                          <Text fontSize="xs" color={muted}>{task.supportRequestNote || task.description || '-'}</Text>
                        </Td>
                        <Td>{task.requestedDepartment || '-'}</Td>
                        <Td>{task.requestedAt ? new Date(task.requestedAt).toLocaleDateString() : task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}</Td>
                        <Td>{(task.assignedTo || []).join(', ') || 'Unassigned'}</Td>
                        <Td>
                          <Badge colorScheme={task.isDone ? 'green' : task.hasOutstanding ? 'orange' : 'blue'}>
                            {task.isDone ? 'Done' : task.hasOutstanding ? 'Undone - outstanding' : String(task.supportStatus || 'assigned').replace('_', ' ')}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

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
                  <Th>Staff</Th>
                  <Th>Work</Th>
                  <Th>Support Stage</Th>
                  <Th>Completed</Th>
                  <Th>Status</Th>
                  <Th>Manager Review</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.length === 0 ? (
                  <Tr><Td colSpan={8} textAlign="center" py={8} color={muted}>No ticket work has been recorded yet.</Td></Tr>
                ) : records.map((record) => (
                  <Tr key={record._id}>
                    <Td>
                      <Text fontWeight="700">{record.taskTitle}</Text>
                      <Text fontSize="xs" color={muted}>{record.taskCategory}</Text>
                    </Td>
                    <Td>{record.staffName || 'Unknown'}</Td>
                    <Td>
                      <Badge mb={1}>{record.workType}</Badge>
                      <Text noOfLines={2}>{record.summary}</Text>
                      {record.outstandingTasks && (
                        <Text mt={1} fontSize="xs" color="orange.500" noOfLines={2}>
                          Outstanding: {record.outstandingTasks}
                        </Text>
                      )}
                    </Td>
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
                      {canDeleteRecord(record) ? (
                        <Button size="xs" colorScheme="red" variant="ghost" leftIcon={<FiTrash2 />} onClick={() => deleteRecord(record)}>
                          Delete
                        </Button>
                      ) : (
                        <Text fontSize="xs" color={muted}>Locked</Text>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );
}
