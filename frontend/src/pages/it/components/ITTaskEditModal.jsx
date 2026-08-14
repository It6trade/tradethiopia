import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import axios from 'axios';
import { useUserStore } from '../../../store/user';
import { WORKFLOW_STEPS } from '../utils/itWorkflow';

const externalCategoryOptions = [
  'website',
  'company profile',
  'logo',
  'broacher',
  'banner',
  'flayer',
  'roller up',
  'business card',
  'letterheads',
];

const internalPlatformOptions = [
  'Tradeethiopian.com',
  'Tradethiopia.com',
  'Tesbinn.com',
  'Tradextv.com',
  'Trainings',
  'Documentation',
  'Meetings',
  'Maintenance',
];

const internalActionOptions = ['Function', 'Features', 'update', 'troubleshoot', 'renewal', 'AI/ML', 'New'];
const externalActionOptions = ['new', 'comment', 'update'];

const splitList = (value) => (
  Array.isArray(value)
    ? value
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
);

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const normalizeUsersResponse = (payload) => {
  const raw =
    (Array.isArray(payload) && payload) ||
    payload?.users ||
    payload?.data ||
    [];
  return Array.isArray(raw) ? raw : [];
};

const normalizeRole = (value = '') => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getPersonName = (user = {}) => user.fullName || user.username || user.email || '';

const isItPerson = (user = {}) => {
  const role = normalizeRole(user.role || user.displayRole || user.normalizedRole);
  const department = String(user.department || '').toLowerCase();
  const jobTitle = String(user.jobTitle || '').toLowerCase();
  return role === 'it' || role.startsWith('it') || department.includes('it') || jobTitle.includes('it');
};

const isItLeader = (user = {}) => {
  const role = normalizeRole(user.role || user.displayRole || user.normalizedRole);
  const jobTitle = String(user.jobTitle || '').toLowerCase();
  return isItPerson(user) && ['manager', 'admin', 'leader', 'lead'].some((keyword) => role.includes(keyword) || jobTitle.includes(keyword));
};

export default function ITTaskEditModal({ isOpen, task, onClose, onDone }) {
  const { currentUser, users, loading: usersLoading, error: usersError, fetchUsers } = useUserStore();
  const token = currentUser?.token;
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [localUsers, setLocalUsers] = useState([]);
  const [loadingLocalUsers, setLoadingLocalUsers] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const modalBg = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('linear-gradient(135deg, #eef6ff, #f0fdfa)', 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(20,184,166,0.12))');
  const sectionBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const muted = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    if (isOpen && users.length === 0 && !usersLoading && !usersError) {
      fetchUsers();
    }
  }, [fetchUsers, isOpen, users.length, usersError, usersLoading]);

  useEffect(() => {
    if (!isOpen || !token) return;

    let cancelled = false;
    const loadAssignmentUsers = async () => {
      setLoadingLocalUsers(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setLocalUsers(normalizeUsersResponse(response.data));
        }
      } catch (error) {
        console.warn('Unable to load assignment users for edit task', error);
      } finally {
        if (!cancelled) setLoadingLocalUsers(false);
      }
    };

    loadAssignmentUsers();
    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const itPeople = useMemo(() => {
    const defaultPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];
    const assignmentUsers = [...(users || []), ...(localUsers || [])];
    const storePeople = assignmentUsers
      .filter(isItPerson)
      .map(getPersonName)
      .filter(Boolean);

    const taskPeople = [
      task?.taskLeader,
      ...(task?.assignedTo || []),
    ].filter(Boolean);

    return Array.from(new Set([...defaultPool, ...storePeople, ...taskPeople])).sort();
  }, [localUsers, task, users]);

  const taskLeaderOptions = useMemo(() => {
    const assignmentUsers = [...(users || []), ...(localUsers || [])];
    const leaders = assignmentUsers
      .filter(isItLeader)
      .map(getPersonName)
      .filter(Boolean);
    return Array.from(new Set([...leaders, ...itPeople])).sort((a, b) => {
      const aIsLeader = leaders.includes(a);
      const bIsLeader = leaders.includes(b);
      if (aIsLeader && !bIsLeader) return -1;
      if (!aIsLeader && bIsLeader) return 1;
      return a.localeCompare(b);
    });
  }, [itPeople, localUsers, users]);

  useEffect(() => {
    if (!task) return;
    setForm({
      projectType: task.projectType || 'internal',
      taskName: task.taskName || '',
      client: task.client || '',
      category: splitList(task.category),
      platform: splitList(task.platform),
      actionType: splitList(task.actionType),
      startDate: toDateInput(task.startDate),
      endDate: toDateInput(task.endDate),
      status: task.status || 'pending',
      workflowStatus: task.workflowStatus || (task.status === 'done' ? 'completed' : task.status === 'ongoing' ? 'in_progress' : 'pending'),
      taskLeader: task.taskLeader || '',
      assignedTo: task.assignedTo || [],
      urgent: Boolean(task.urgent),
      featureCount: task.featureCount || 0,
      progressNote: task.progressNote || '',
    });
  }, [task]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!task || !form) return;

    const payload = {
      projectType: form.projectType,
      taskName: form.projectType === 'internal' ? form.taskName : undefined,
      client: form.projectType === 'external' ? form.client : undefined,
      platform: form.projectType === 'internal' ? form.platform.join(', ') : '',
      category: form.projectType === 'external' ? form.category.join(', ') : '',
      actionType: form.projectType === 'external' ? (form.actionType[0] || '') : form.actionType.join(', '),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      workflowStatus: form.workflowStatus,
      taskLeader: form.taskLeader,
      assignedTo: form.assignedTo,
      urgent: form.urgent,
      featureCount: Number(form.featureCount) || 0,
      progressNote: form.progressNote,
      auditNote: 'Task edited by IT Manager/Admin',
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${task._id || task.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Task updated', status: 'success' });
      onDone?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Task update failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  if (!form) return null;

  const isExternal = form.projectType === 'external';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="22px" bg={modalBg} maxW={{ base: '94vw', lg: '980px' }} maxH="92vh" overflow="hidden">
        <ModalHeader bg={headerBg} borderBottom="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme={isExternal ? 'purple' : 'blue'}>{isExternal ? 'External' : 'Internal'}</Badge>
              <Badge colorScheme={form.urgent ? 'red' : 'gray'}>{form.urgent ? 'Urgent' : 'Standard'}</Badge>
            </HStack>
            <Box>
              <Heading size={{ base: 'md', md: 'lg' }}>Edit Task</Heading>
              <Text fontSize="sm" color={muted}>Update task ownership, timeline, workflow, and delivery details.</Text>
            </Box>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <Stack spacing={4}>
            <Card borderRadius="18px" border="1px solid" borderColor={borderColor} bg={sectionBg}>
              <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Project Type</FormLabel>
                <Select value={form.projectType} onChange={(event) => updateField('projectType', event.target.value)}>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{isExternal ? 'Client Name' : 'Task Name'}</FormLabel>
                <Input
                  value={isExternal ? form.client : form.taskName}
                  onChange={(event) => updateField(isExternal ? 'client' : 'taskName', event.target.value)}
                />
              </FormControl>
            </SimpleGrid>
              </CardBody>
            </Card>

            <Card borderRadius="18px" border="1px solid" borderColor={borderColor}>
              <CardBody>
            <FormControl>
              <FormLabel>{isExternal ? 'Category' : 'Platform'}</FormLabel>
              <CheckboxGroup
                value={isExternal ? form.category : form.platform}
                onChange={(value) => updateField(isExternal ? 'category' : 'platform', value)}
              >
                <Wrap spacing={2}>
                  {(isExternal ? externalCategoryOptions : internalPlatformOptions).map((option) => (
                    <WrapItem key={option}>
                      <Checkbox value={option}>{option}</Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Action Type</FormLabel>
              {isExternal ? (
                <Select value={form.actionType[0] || ''} onChange={(event) => updateField('actionType', [event.target.value])}>
                  {externalActionOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              ) : (
                <CheckboxGroup value={form.actionType} onChange={(value) => updateField('actionType', value)}>
                  <Wrap spacing={2}>
                    {internalActionOptions.map((option) => (
                      <WrapItem key={option}>
                        <Checkbox value={option}>{option}</Checkbox>
                      </WrapItem>
                    ))}
                  </Wrap>
                </CheckboxGroup>
              )}
            </FormControl>
              </CardBody>
            </Card>

            <Card borderRadius="18px" border="1px solid" borderColor={borderColor}>
              <CardBody>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <Input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="done">Done</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Workflow</FormLabel>
                <Select value={form.workflowStatus} onChange={(event) => updateField('workflowStatus', event.target.value)}>
                  {WORKFLOW_STEPS.map((step) => (
                    <option key={step.value} value={step.value}>{step.label}</option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>
              </CardBody>
            </Card>

            <Card borderRadius="18px" border="1px solid" borderColor={borderColor}>
              <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Task Leader</FormLabel>
                <Select value={form.taskLeader} onChange={(event) => updateField('taskLeader', event.target.value)} placeholder="Select leader">
                  {taskLeaderOptions.map((person) => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </Select>
                <FormHelperText>
                  {loadingLocalUsers ? 'Loading IT leaders...' : `${taskLeaderOptions.length} leader options available.`}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel>Feature / Point Count</FormLabel>
                <Input type="number" min="0" value={form.featureCount} onChange={(event) => updateField('featureCount', event.target.value)} />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Assigned Staff</FormLabel>
              <CheckboxGroup value={form.assignedTo} onChange={(value) => updateField('assignedTo', value)}>
                <Wrap spacing={2}>
                  {itPeople.map((person) => (
                    <WrapItem key={person}>
                      <Checkbox value={person}>{person}</Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
              <FormHelperText>
                {loadingLocalUsers ? 'Loading IT staff...' : `${itPeople.length} staff options available.`}
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Progress Note</FormLabel>
              <Textarea value={form.progressNote} onChange={(event) => updateField('progressNote', event.target.value)} />
            </FormControl>

            <HStack justify="space-between">
              <FormLabel htmlFor="edit-urgent-switch" mb={0}>Mark as Urgent</FormLabel>
              <Switch id="edit-urgent-switch" isChecked={form.urgent} onChange={(event) => updateField('urgent', event.target.checked)} colorScheme="red" />
            </HStack>
              </CardBody>
            </Card>
          </Stack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={submit}>Update Task</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
