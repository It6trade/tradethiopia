import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
  FiClipboard,
  FiClock,
  FiDownload,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiSend,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';

const CATEGORIES = [
  {
    key: 'leave',
    label: 'Leave & absence',
    subcategories: [
      { key: 'annual_leave', label: 'Annual leave' },
      { key: 'sick_leave', label: 'Sick leave' },
      { key: 'maternity_paternity', label: 'Maternity / paternity' },
      { key: 'compassionate', label: 'Compassionate leave' },
      { key: 'unpaid_leave', label: 'Unpaid leave' },
    ],
  },
  {
    key: 'payroll',
    label: 'Payroll & compensation',
    subcategories: [
      { key: 'advance_salary', label: 'Advance salary' },
      { key: 'expense_reimbursement', label: 'Expense reimbursement' },
      { key: 'bank_account_update', label: 'Bank account update' },
      { key: 'tax_clarification', label: 'Tax clarification' },
    ],
  },
  {
    key: 'credentials',
    label: 'Account & credentials',
    subcategories: [
      { key: 'role_access_change', label: 'Role access change' },
      { key: 'system_account_reset', label: 'System account reset' },
      { key: 'two_factor_reset', label: 'Two-factor reset' },
      { key: 'account_transfer', label: 'Account ownership transfer' },
    ],
  },
  {
    key: 'training',
    label: 'Training & development',
    subcategories: [
      { key: 'external_training', label: 'External course approval' },
      { key: 'certification_fee', label: 'Certification fee support' },
      { key: 'materials_access', label: 'Specialized materials access' },
    ],
  },
  {
    key: 'workplace',
    label: 'Workplace & equipment',
    subcategories: [
      { key: 'hardware_request', label: 'Hardware replacement' },
      { key: 'office_stationery', label: 'Stationery & supplies' },
      { key: 'ergonomic_support', label: 'Ergonomic support' },
      { key: 'remote_work_setup', label: 'Remote work equipment' },
    ],
  },
  {
    key: 'grievance',
    label: 'Grievance & ethics',
    subcategories: [
      { key: 'workplace_concern', label: 'Workplace concern' },
      { key: 'policy_clarification', label: 'Policy clarification' },
      { key: 'confidential_report', label: 'Confidential report' },
    ],
  },
];

const MANAGER_ROLES = new Set([
  'admin', 'coo', 'ceo', 'supervisor', 'salesmanager',
  'customersuccessmanager', 'socialmediamanager', 'itmanager', 'itadmin',
]);
const STATUS = {
  pending_manager: ['Awaiting manager', 'orange'],
  manager_rejected: ['Manager rejected', 'red'],
  pending_hr: ['Awaiting HR', 'blue'],
  hr_approved: ['HR approved', 'green'],
  hr_rejected: ['HR rejected', 'red'],
  cancelled: ['Cancelled', 'gray'],
};
const labelFor = (key) =>
  CATEGORIES.flatMap((category) => category.children).find(([value]) => value === key)?.[1] ||
  String(key || '').replace(/_/g, ' ');
const personName = (person) => person?.fullName || person?.username || person?.email || 'Not assigned';
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'Not recorded';
const initialForm = () => ({
  leaveDuration: 'full_day', startDate: '', endDate: '', totalDays: '',
  halfDayDate: '',
  reason: '', contactDuringLeave: '', handoverTo: '',
  incomingEmployeeId: '', handoverDate: '', witnessEmployeeId: '',
  makeModel: '', serialNumber: '', assetTag: '', physicalCondition: '', functionalIssues: '',
  chargerIncluded: false, mouseKeyboardIncluded: false, otherAccessories: '',
  laptopUsername: '', laptopPassword: '', negligenceAccepted: false,
  lastWorkingDate: '', responsibilities: '', pendingTasks: '', importantContacts: '',
  filesLocations: '', additionalNotes: '', outgoingConfirmed: false, incomingConfirmed: false,
});

const Field = ({ label, helper, required = false, children }) => (
  <FormControl isRequired={required}>
    <FormLabel fontSize="sm" fontWeight="700" color="gray.700">{label}</FormLabel>
    {children}
    {helper && <FormHelperText>{helper}</FormHelperText>}
  </FormControl>
);

const EmployeeRequestsPage = () => {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const role = normalizeRole(currentUser?.role || currentUser?.displayRole);
  const isManager = MANAGER_ROLES.has(role);
  const cachedIsHr = role === 'hr' || role === 'admin';
  const [accessContext, setAccessContext] = useState(null);
  const isHr = accessContext ? accessContext.isHr : cachedIsHr;
  const [category, setCategory] = useState('leave');
  const [subcategory, setSubcategory] = useState('annual_leave');
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [mine, setMine] = useState([]);
  const [managerInbox, setManagerInbox] = useState([]);
  const [hrInbox, setHrInbox] = useState([]);
  const [managerDirectory, setManagerDirectory] = useState({ employees: [], managers: [] });
  const [assigningUserId, setAssigningUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const managerPendingCount = managerInbox.filter((item) => item.status === 'pending_manager').length;
  const hrPendingCount = hrInbox.filter((item) => item.status === 'pending_hr').length;
  const canReviewAsManager = isManager || managerInbox.length > 0;

  const selectedCategory = CATEGORIES.find((item) => item.key === category);
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        axiosInstance.get('/employee-requests/mine'),
        axiosInstance.get('/users'),
        axiosInstance.get('/employee-requests/manager-inbox'),
        axiosInstance.get('/employee-requests/access-context'),
      ];
      if (isHr) requests.push(axiosInstance.get('/employee-requests/hr-inbox'));
      if (isHr) requests.push(axiosInstance.get('/employee-requests/manager-options'));
      const results = await Promise.all(requests);
      setMine(results[0].data?.data || []);
      setEmployees(results[1].data?.data || []);
      setManagerInbox(results[2].data?.data || []);
      setAccessContext(results[3].data?.data || null);
      let index = 4;
      if (isHr) {
        setHrInbox(results[index++].data?.data || []);
        setManagerDirectory(results[index].data?.data || { employees: [], managers: [] });
      }
    } catch (error) {
      toast({ title: 'Unable to load employee requests', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isHr, toast]);

  useEffect(() => { load(); }, [load]);

  const selectSubcategory = (nextCategory, nextSubcategory) => {
    setCategory(nextCategory);
    setSubcategory(nextSubcategory);
    setForm(initialForm());
    setAttachments([]);
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return '';
    const difference = Math.floor((new Date(end) - new Date(start)) / 86400000) + 1;
    return difference > 0 ? String(difference) : '';
  };

  const handleDate = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      next.totalDays = calculateDays(next.startDate, next.endDate);
      return next;
    });
  };

  const validate = () => {
    const issues = [];
    if (category === 'leave') {
      if (subcategory === 'annual_leave' && form.leaveDuration === 'half_day') {
        if (!form.halfDayDate) issues.push('half-day leave date');
      } else {
        if (!form.startDate) issues.push('leave start date');
        if (!form.endDate) issues.push('leave end date');
      }
      if (!form.contactDuringLeave.trim()) issues.push('contact during leave');
      if (!form.reason.trim()) issues.push('reason for leave');
      if (!form.handoverTo) issues.push('work handover employee');
      return issues;
    }
    if (subcategory === 'material_handover') {
      if (!form.incomingEmployeeId) issues.push('incoming employee');
      if (!form.handoverDate) issues.push('handover date');
      if (!form.makeModel.trim()) issues.push('laptop make and model');
      if (!form.serialNumber.trim()) issues.push('serial number');
      if (!form.assetTag.trim()) issues.push('asset tag');
      if (!form.physicalCondition.trim()) issues.push('physical condition');
      if (!form.functionalIssues.trim()) issues.push('functional issues');
      if (!form.laptopUsername.trim()) issues.push('laptop username');
      if (!form.negligenceAccepted) issues.push('negligence acknowledgement');
      if (!form.outgoingConfirmed) issues.push('outgoing employee confirmation');
      if (!form.incomingConfirmed) issues.push('incoming employee confirmation');
      return issues;
    }
    if (!form.incomingEmployeeId) issues.push('incoming employee');
    if (!form.handoverDate) issues.push('handover date');
    if (!form.lastWorkingDate) issues.push('last working date');
    if (!form.responsibilities.trim()) issues.push('current responsibilities');
    if (!form.pendingTasks.trim()) issues.push('pending tasks');
    if (!form.importantContacts.trim()) issues.push('important contacts');
    if (!form.outgoingConfirmed) issues.push('outgoing employee confirmation');
    if (!form.incomingConfirmed) issues.push('incoming employee confirmation');
    return issues;
  };

  const submit = async () => {
    const validationIssues = validate();
    if (validationIssues.length) {
      toast({
        title: 'Complete the required request information',
        description: `Please provide: ${validationIssues.join(', ')}. Attachments are optional.`,
        status: 'warning',
        duration: 7000,
        isClosable: true,
      });
      return;
    }
    if (form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate)) {
      toast({ title: 'End date cannot be before start date', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('category', category);
      payload.append('subcategory', subcategory);
      payload.append(
        'title',
        subcategory === 'annual_leave' && form.leaveDuration === 'half_day'
          ? 'Half-Day Annual Leave Request'
          : `${labelFor(subcategory)} Request`
      );
      payload.append('formData', JSON.stringify(form));
      attachments.forEach((file) => payload.append('attachments', file));
      const response = await axiosInstance.post('/employee-requests', payload);
      const assignedManager = personName(response.data?.data?.manager);
      toast({
        title: 'Request submitted successfully',
        description: `Assigned to ${assignedManager} for manager review.`,
        status: 'success',
      });
      setForm(initialForm());
      setAttachments([]);
      await load();
    } catch (error) {
      toast({ title: 'Request could not be submitted', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (actor, decision) => {
    if (!selected?._id) return;
    if (decision === 'rejected' && !decisionNote.trim()) {
      toast({ title: 'A rejection reason is required', status: 'warning' });
      return;
    }
    setDeciding(true);
    try {
      await axiosInstance.patch(
        `/employee-requests/${selected._id}/${actor}-decision`,
        { decision, note: decisionNote.trim() }
      );
      toast({ title: decision === 'approved' ? 'Request approved' : 'Request rejected', status: 'success' });
      setSelected(null);
      setDecisionNote('');
      await load();
    } catch (error) {
      toast({ title: 'Decision could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
      if (error.response?.status === 409) {
        setSelected(null);
        setDecisionNote('');
        await load();
      }
    } finally {
      setDeciding(false);
    }
  };

  const cancel = async (item) => {
    try {
      await axiosInstance.patch(`/employee-requests/${item._id}/cancel`, {});
      toast({ title: 'Request cancelled', status: 'success' });
      await load();
    } catch (error) {
      toast({ title: 'Unable to cancel request', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const assignManager = async (userId, managerId) => {
    if (!managerId) return;
    setAssigningUserId(userId);
    try {
      await axiosInstance.patch(`/employee-requests/assign-manager/${userId}`, { managerId });
      toast({ title: 'Manager assignment updated', status: 'success' });
      await load();
    } catch (error) {
      toast({ title: 'Manager could not be assigned', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setAssigningUserId('');
    }
  };

  const reassignRequest = async (managerId) => {
    if (!selected?._id || !managerId) return;
    setReassigning(true);
    try {
      const response = await axiosInstance.patch(
        `/employee-requests/${selected._id}/reassign-manager`,
        { managerId }
      );
      setSelected((previous) => ({ ...previous, ...response.data.data, actor: 'hr' }));
      toast({ title: 'Request reassigned', description: 'The new manager has been notified.', status: 'success' });
      await load();
    } catch (error) {
      toast({ title: 'Request could not be reassigned', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setReassigning(false);
    }
  };

  const renderLeaveForm = () => (
    <Stack spacing={6}>
      <Box>
        <Heading size="md">Leave information</Heading>
        <Text mt={1} fontSize="sm" color="gray.500">Provide the dates, reason, contact details, and work coverage for this leave.</Text>
      </Box>
      {subcategory === 'annual_leave' && (
        <Box p={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="xl">
          <Field label="Annual leave duration" required helper="Choose half-day when the absence is measured by working hours on one date.">
            <HStack spacing={3} mt={1}>
              <Button
                flex="1"
                variant={form.leaveDuration === 'full_day' ? 'solid' : 'outline'}
                colorScheme="teal"
                onClick={() => update('leaveDuration', 'full_day')}
              >
                Full-day leave
              </Button>
              <Button
                flex="1"
                variant={form.leaveDuration === 'half_day' ? 'solid' : 'outline'}
                colorScheme="teal"
                onClick={() => update('leaveDuration', 'half_day')}
              >
                Half-day leave
              </Button>
            </HStack>
          </Field>
        </Box>
      )}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        {subcategory === 'annual_leave' && form.leaveDuration === 'half_day' ? (
          <>
            <Field label="Half-day leave date" required>
              <Input type="date" value={form.halfDayDate} onChange={(event) => update('halfDayDate', event.target.value)} />
            </Field>
            <Box gridColumn={{ md: '1 / -1' }} p={5} bg="teal.50" border="1px solid" borderColor="teal.200" borderRadius="xl">
              <Text fontSize="xs" fontWeight="800" color="teal.700" textTransform="uppercase">Automatic half-day assignment</Text>
              <Heading mt={1} size="sm">The submission time determines the session</Heading>
              <Text mt={2} fontSize="sm" color="gray.600">
                Requests submitted before 12:30 PM are recorded as Morning. Requests submitted at or after 12:30 PM are recorded as Afternoon.
              </Text>
              <Text mt={2} fontSize="sm" fontWeight="700" color="teal.700">
                The exact Addis Ababa submission date and time will be attached automatically.
              </Text>
            </Box>
          </>
        ) : (
          <>
            <Field label="Leave start date" required><Input type="date" value={form.startDate} onChange={(event) => handleDate('startDate', event.target.value)} /></Field>
            <Field label="Leave end date" required><Input type="date" min={form.startDate} value={form.endDate} onChange={(event) => handleDate('endDate', event.target.value)} /></Field>
            <Field label="Total calendar days"><Input value={form.totalDays} isReadOnly bg="gray.50" /></Field>
          </>
        )}
        <Field label="Contact during leave" required><Input value={form.contactDuringLeave} onChange={(event) => update('contactDuringLeave', event.target.value)} placeholder="Phone number or email" /></Field>
        <Box gridColumn={{ md: '1 / -1' }}>
          <Field label="Reason for leave" required><Textarea minH="120px" value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder={`Explain the ${labelFor(subcategory).toLowerCase()} request`} /></Field>
        </Box>
        <Box gridColumn={{ md: '1 / -1' }}>
          <Field label="Work handover employee" required helper="Select the employee who will cover urgent responsibilities during the leave.">
            <Select value={form.handoverTo} onChange={(event) => update('handoverTo', event.target.value)} placeholder="Select employee from database">
              {employees.filter((employee) => employee._id !== currentUser?._id).map((employee) => (
                <option key={employee._id} value={employee._id}>{personName(employee)} — {employee.jobTitle || employee.role}</option>
              ))}
            </Select>
          </Field>
        </Box>
      </SimpleGrid>
    </Stack>
  );

  const renderMaterialForm = () => (
    <Stack spacing={7}>
      <Box>
        <Heading size="lg">Laptop Handover Note</Heading>
        <Text mt={1} fontSize="sm" color="gray.500">Complete the handover record using the same sections as the official company form.</Text>
      </Box>
      <Divider />
      <Box>
        <Heading size="sm" mb={4}>Employee Details</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Field label="Outgoing Employee"><Input value={personName(currentUser)} isReadOnly bg="gray.50" /></Field>
          <Field label="Incoming Employee" required>
            <Select value={form.incomingEmployeeId} onChange={(event) => update('incomingEmployeeId', event.target.value)} placeholder="Select employee from database">
              {employees.filter((employee) => employee._id !== currentUser?._id).map((employee) => <option key={employee._id} value={employee._id}>{personName(employee)}</option>)}
            </Select>
          </Field>
          <Field label="Date of Handover" required><Input type="date" value={form.handoverDate} onChange={(event) => update('handoverDate', event.target.value)} /></Field>
          <Field label="Witness / IT Representative">
            <Select value={form.witnessEmployeeId} onChange={(event) => update('witnessEmployeeId', event.target.value)} placeholder="Select witness or IT representative">
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{personName(employee)} — {employee.jobTitle || employee.role}</option>)}
            </Select>
          </Field>
        </SimpleGrid>
      </Box>
      <Divider />
      <Box>
        <Heading size="sm" mb={4}>Laptop Details</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Field label="Make & Model" required><Input value={form.makeModel} onChange={(event) => update('makeModel', event.target.value)} placeholder="Example: Lenovo Core i5" /></Field>
          <Field label="Serial Number" required><Input value={form.serialNumber} onChange={(event) => update('serialNumber', event.target.value)} /></Field>
          <Field label="Asset Tag / ID" required><Input value={form.assetTag} onChange={(event) => update('assetTag', event.target.value)} /></Field>
          <Box gridColumn={{ md: '1 / -1' }}><Heading size="xs" mb={3}>Condition</Heading></Box>
          <Box gridColumn={{ md: '1 / -1' }}>
            <Field label="Physical Condition" required helper="Record scratches, dents, screen issues, or other visible damage."><Textarea value={form.physicalCondition} onChange={(event) => update('physicalCondition', event.target.value)} /></Field>
          </Box>
          <Box gridColumn={{ md: '1 / -1' }}>
            <Field label="Functional Issues" required helper="Record battery life, keyboard, port, performance, or other functional issues."><Textarea value={form.functionalIssues} onChange={(event) => update('functionalIssues', event.target.value)} /></Field>
          </Box>
        </SimpleGrid>
      </Box>
      <Divider />
      <Box>
        <Heading size="sm" mb={4}>Accessories Included</Heading>
        <HStack spacing={7} flexWrap="wrap">
          <Checkbox isChecked={form.chargerIncluded} onChange={(event) => update('chargerIncluded', event.target.checked)}>Charger</Checkbox>
          <Checkbox isChecked={form.mouseKeyboardIncluded} onChange={(event) => update('mouseKeyboardIncluded', event.target.checked)}>Mouse / Keyboard</Checkbox>
        </HStack>
        <Input mt={4} value={form.otherAccessories} onChange={(event) => update('otherAccessories', event.target.value)} placeholder="Other accessories included" />
      </Box>
      <Divider />
      <Box>
        <Heading size="sm" mb={1}>Access & Credentials</Heading>
        <Text mb={4} fontSize="xs" color="orange.600">Credentials are sensitive. The password is used only to confirm the transfer and is never stored in the request database or included in notifications.</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Field label="Laptop Login — Username" required><Input value={form.laptopUsername} onChange={(event) => update('laptopUsername', event.target.value)} /></Field>
          <Field label="Laptop Login — Password"><Input type="password" autoComplete="new-password" value={form.laptopPassword} onChange={(event) => update('laptopPassword', event.target.value)} placeholder="Enter only when required" /></Field>
        </SimpleGrid>
      </Box>
      <Divider />
      <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl" p={5}>
        <Heading size="sm">Consequences of Negligence</Heading>
        <Stack mt={3} spacing={2} fontSize="sm" color="gray.700">
          <Text>• Repair/replacement costs may be borne by the employee if damage results from misuse.</Text>
          <Text>• Disciplinary action may follow repeated or intentional negligence.</Text>
          <Checkbox mt={2} isChecked={form.negligenceAccepted} onChange={(event) => update('negligenceAccepted', event.target.checked)}>
            I acknowledge and accept these responsibilities.
          </Checkbox>
        </Stack>
      </Box>
      <Box>
        <Heading size="sm" mb={4}>Signatures</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Checkbox isChecked={form.outgoingConfirmed} onChange={(event) => update('outgoingConfirmed', event.target.checked)}>Outgoing employee confirmation</Checkbox>
          <Checkbox isChecked={form.incomingConfirmed} onChange={(event) => update('incomingConfirmed', event.target.checked)}>Incoming employee confirmation received</Checkbox>
        </SimpleGrid>
        <Text mt={3} fontSize="xs" color="gray.500">Manager and HR decisions are recorded as the official approval signatures in the audit timeline.</Text>
      </Box>
    </Stack>
  );

  const renderTaskForm = () => (
    <Stack spacing={6}>
      <Box><Heading size="md">Task Handover</Heading><Text mt={1} fontSize="sm" color="gray.500">Document responsibilities, pending work, contacts, and file locations for a controlled transition.</Text></Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        <Field label="Outgoing Employee"><Input value={personName(currentUser)} isReadOnly bg="gray.50" /></Field>
        <Field label="Incoming Employee" required>
          <Select value={form.incomingEmployeeId} onChange={(event) => update('incomingEmployeeId', event.target.value)} placeholder="Select employee from database">
            {employees.filter((employee) => employee._id !== currentUser?._id).map((employee) => <option key={employee._id} value={employee._id}>{personName(employee)}</option>)}
          </Select>
        </Field>
        <Field label="Handover Date" required><Input type="date" value={form.handoverDate} onChange={(event) => update('handoverDate', event.target.value)} /></Field>
        <Field label="Last Working Date" required><Input type="date" value={form.lastWorkingDate} onChange={(event) => update('lastWorkingDate', event.target.value)} /></Field>
        {[
          ['responsibilities', 'Current Responsibilities', 'List recurring duties and ownership areas'],
          ['pendingTasks', 'Pending Tasks', 'Include status, priority, and expected completion'],
          ['importantContacts', 'Important Contacts', 'Internal and external contacts required for continuity'],
          ['filesLocations', 'Files and System Locations', 'Shared drives, folders, tools, and references'],
          ['additionalNotes', 'Additional Notes', 'Risks, deadlines, and special instructions'],
        ].map(([field, label, placeholder]) => (
          <Box key={field} gridColumn={{ md: '1 / -1' }}>
            <Field label={label} required={['responsibilities', 'pendingTasks', 'importantContacts'].includes(field)}>
              <Textarea minH="110px" value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} />
            </Field>
          </Box>
        ))}
      </SimpleGrid>
      <Box bg="gray.50" borderRadius="xl" p={5}>
        <Heading size="sm" mb={3}>Confirmations</Heading>
        <Stack>
          <Checkbox isChecked={form.outgoingConfirmed} onChange={(event) => update('outgoingConfirmed', event.target.checked)}>Outgoing employee confirms the handover information is complete.</Checkbox>
          <Checkbox isChecked={form.incomingConfirmed} onChange={(event) => update('incomingConfirmed', event.target.checked)}>Incoming employee has reviewed and accepted the handover.</Checkbox>
        </Stack>
      </Box>
    </Stack>
  );

  const RequestCards = ({ items, empty, actor }) => (
    <Stack spacing={4}>
      {!items.length ? (
        <Box p={10} textAlign="center" border="1px dashed" borderColor="gray.300" borderRadius="2xl">
          <Icon as={FiClipboard} boxSize={8} color="gray.400" />
          <Heading mt={3} size="sm">{empty}</Heading>
        </Box>
      ) : items.map((item) => {
        const [statusLabel, statusColor] = STATUS[item.status] || [item.status, 'gray'];
        return (
          <Box key={item._id} p={5} bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" shadow="sm" _hover={{ borderColor: 'teal.300', shadow: 'md' }}>
            <Flex justify="space-between" align="flex-start" gap={4}>
              <Box minW={0}>
                <HStack mb={2} flexWrap="wrap">
                  <Badge colorScheme="teal">{item.requestNumber}</Badge>
                  <Badge colorScheme={statusColor}>{statusLabel}</Badge>
                </HStack>
                <Heading size="sm">{item.title}</Heading>
                <Text mt={1} fontSize="xs" color="gray.500">
                  Assigned manager: {personName(item.manager)}
                  {item.manager?.email ? ` • ${item.manager.email}` : ''}
                </Text>
                <Text mt={1} fontSize="sm" color="gray.500">{item.department} • {personName(item.requester)} • {formatDate(item.createdAt)}</Text>
              </Box>
              <Button size="sm" variant="outline" colorScheme="teal" rightIcon={<FiArrowRight />} onClick={() => { setSelected({ ...item, actor }); setDecisionNote(''); }}>Review</Button>
            </Flex>
            {actor === 'mine' && item.status === 'pending_manager' && (
              <Button mt={4} size="xs" variant="ghost" colorScheme="red" onClick={() => cancel(item)}>Cancel request</Button>
            )}
          </Box>
        );
      })}
    </Stack>
  );

  return (
    <Box maxW="1500px" mx="auto" px={{ base: 4, md: 7 }} py={{ base: 5, md: 8 }}>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} mb={7}>
        <Box>
          <Text fontSize="xs" fontWeight="800" color="teal.600" letterSpacing="widest">EMPLOYEE • MANAGER • HR WORKFLOW</Text>
          <Heading mt={1} size="xl">Employee Request Center</Heading>
          <Text mt={2} color="gray.500">Submit categorized requests and follow every approval decision from manager review to HR permission.</Text>
          {accessContext && (
            <HStack mt={3} spacing={2} flexWrap="wrap">
              <Badge colorScheme={accessContext.isHr ? 'green' : 'gray'}>
                {accessContext.isHr
                  ? 'HR administration access'
                  : `${accessContext.displayRole || accessContext.role} employee access`}
              </Badge>
              <Badge variant="outline" colorScheme="teal">
                {accessContext.username || accessContext.email} • {accessContext.userId}
              </Badge>
              {accessContext.assignedRequestCount > 0 && (
                <Badge colorScheme="orange">
                  {accessContext.assignedRequestCount} manager review pending
                </Badge>
              )}
            </HStack>
          )}
        </Box>
        <Button leftIcon={<FiRefreshCw />} variant="outline" colorScheme="teal" onClick={load} isLoading={loading}>Refresh</Button>
      </Flex>

      <Tabs variant="soft-rounded" colorScheme="teal" isLazy>
        <TabList overflowX="auto" gap={2} pb={2}>
          <Tab flexShrink={0}>New request</Tab>
          <Tab flexShrink={0}>My requests</Tab>
          {canReviewAsManager && <Tab flexShrink={0}>Manager approvals{managerPendingCount ? ` (${managerPendingCount})` : ''}</Tab>}
          {isHr && <Tab flexShrink={0}>HR approvals{hrPendingCount ? ` (${hrPendingCount})` : ''}</Tab>}
          {isHr && <Tab flexShrink={0}>Manager assignments</Tab>}
        </TabList>
        <TabPanels mt={6}>
          <TabPanel p={0}>
            <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '280px minmax(0, 1fr)' }} gap={{ base: 5, lg: 7 }} alignItems="start">
              <GridItem minW={0} bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" p={5} position={{ lg: 'sticky' }} top={{ lg: '104px' }} shadow="sm" zIndex={1}>
                <Heading size="md">Request categories</Heading>
                <Text mt={1} mb={5} fontSize="sm" color="gray.500">Choose the form that matches the employee request.</Text>
                <Stack spacing={4}>
                  {CATEGORIES.map((group) => (
                    <Box
                      key={group.key}
                      p={3}
                      borderRadius="xl"
                      bg={category === group.key ? 'teal.50' : 'gray.50'}
                      border="1px solid"
                      borderColor={category === group.key ? 'teal.200' : 'gray.100'}
                      transition="all 0.2s ease"
                    >
                      <HStack mb={2}>
                        <Flex w="30px" h="30px" align="center" justify="center" borderRadius="lg" bg="white">
                          <Icon as={group.icon} color="teal.600" />
                        </Flex>
                        <Text fontWeight="800" fontSize="sm">{group.label}</Text>
                      </HStack>
                      <Stack spacing={1}>
                        {group.children.map(([key, label]) => (
                          <Button
                            key={key}
                            justifyContent="flex-start"
                            variant={subcategory === key ? 'solid' : 'ghost'}
                            colorScheme="teal"
                            size="sm"
                            w="full"
                            borderRadius="lg"
                            onClick={() => selectSubcategory(group.key, key)}
                          >
                            {label}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </GridItem>
              <GridItem minW={0} bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" p={{ base: 5, md: 8 }} shadow="sm">
                {accessContext?.submissionManager ? (
                  <Flex
                    mb={7}
                    p={5}
                    gap={4}
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    justify="space-between"
                    bg="teal.50"
                    border="1px solid"
                    borderColor="teal.200"
                    borderRadius="2xl"
                  >
                    <HStack spacing={4}>
                      <Avatar
                        size="md"
                        name={personName(accessContext.submissionManager)}
                        bg="teal.600"
                        color="white"
                      />
                      <Box>
                        <Text fontSize="xs" fontWeight="800" color="teal.700" textTransform="uppercase">
                          Sending to your manager
                        </Text>
                        <Heading mt={1} size="sm">{personName(accessContext.submissionManager)}</Heading>
                        <Text mt={1} fontSize="sm" color="gray.600">
                          {accessContext.submissionManager.jobTitle || accessContext.submissionManager.role}
                          {accessContext.submissionManager.email ? ` • ${accessContext.submissionManager.email}` : ''}
                        </Text>
                      </Box>
                    </HStack>
                    <Box textAlign={{ base: 'left', sm: 'right' }}>
                      <Badge colorScheme="teal">First approver</Badge>
                      <Text mt={1} fontSize="xs" color="gray.500" textTransform="capitalize">
                        {accessContext.submissionManager.assignmentSource}
                      </Text>
                    </Box>
                  </Flex>
                ) : accessContext ? (
                  <Alert status="error" borderRadius="xl" mb={7}>
                    <AlertIcon />
                    No active manager is assigned. Contact HR before submitting this request.
                  </Alert>
                ) : null}
                <Flex justify="space-between" align="center" mb={7} gap={3} wrap="wrap">
                  <Box><Badge colorScheme="teal">{selectedCategory?.label}</Badge><Heading mt={2} size="lg">{labelFor(subcategory)}</Heading></Box>
                  <Badge variant="outline" colorScheme="gray">Manager → HR approval</Badge>
                </Flex>
                {category === 'leave' ? renderLeaveForm() : subcategory === 'material_handover' ? renderMaterialForm() : renderTaskForm()}
                <Divider my={7} />
                <Field label="Supporting attachments (optional)" helper="No file is required. If needed, attach up to five PDF, Word, JPG, or PNG files; maximum 10 MB each.">
                  <Input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" p={1} onChange={(event) => setAttachments(Array.from(event.target.files || []))} />
                </Field>
                <Flex justify="flex-end" mt={7}>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    leftIcon={<FiSend />}
                    onClick={submit}
                    isLoading={submitting}
                    isDisabled={Boolean(accessContext && !accessContext.submissionManager)}
                    loadingText="Submitting"
                  >
                    Submit to manager
                  </Button>
                </Flex>
              </GridItem>
            </Grid>
          </TabPanel>
          <TabPanel p={0}><RequestCards items={mine} empty="You have not submitted any requests." actor="mine" /></TabPanel>
          {canReviewAsManager && <TabPanel p={0}><RequestCards items={managerInbox} empty="No requests are assigned to you." actor="manager" /></TabPanel>}
          {isHr && (
            <TabPanel p={0}>
              <Alert status="info" borderRadius="xl" mb={5}>
                <AlertIcon />
                This queue only receives requests approved by the assigned manager. Requests awaiting manager review are not available for HR approval.
              </Alert>
              <RequestCards items={hrInbox} empty="No manager-approved requests are available for HR review." actor="hr" />
            </TabPanel>
          )}
          {isHr && (
            <TabPanel p={0}>
              <Box mb={5}>
                <Heading size="md">Employee manager assignments</Heading>
                <Text mt={1} fontSize="sm" color="gray.500">Assign the accountable line manager used for request routing and approvals.</Text>
              </Box>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                {managerDirectory.employees
                  .filter((employee) => !MANAGER_ROLES.has(normalizeRole(employee.role)))
                  .map((employee) => (
                    <Box key={employee._id} p={5} bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl">
                      <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={4}>
                        <HStack>
                          <Avatar size="sm" name={personName(employee)} />
                          <Box><Text fontWeight="800">{personName(employee)}</Text><Text fontSize="xs" color="gray.500">{employee.jobTitle || employee.role}</Text></Box>
                        </HStack>
                        <Select
                          maxW={{ sm: '280px' }}
                          value={employee.managerId || ''}
                          onChange={(event) => assignManager(employee._id, event.target.value)}
                          isDisabled={assigningUserId === employee._id}
                          placeholder="Select manager"
                        >
                          {managerDirectory.managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {personName(manager)} — {manager.email} — {manager.role}
                            </option>
                          ))}
                        </Select>
                      </Flex>
                    </Box>
                  ))}
              </SimpleGrid>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} placement="right" size="full">
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <DrawerContent ml="auto" maxW={{ base: '100%', md: '780px', xl: '900px' }} bg="gray.50">
          <DrawerCloseButton color="white" top={5} right={5} />
          <DrawerHeader p={0}>
            <Box bgGradient="linear(to-r, teal.800, teal.600)" color="white" px={{ base: 5, md: 8 }} py={7}>
              <Text fontSize="xs" fontWeight="800" color="teal.100">{selected?.requestNumber}</Text>
              <Heading mt={1} size="lg">{selected?.title}</Heading>
              <Text mt={2} fontSize="sm" color="teal.100">{selected && STATUS[selected.status]?.[0]}</Text>
            </Box>
          </DrawerHeader>
          <DrawerBody px={{ base: 4, md: 8 }} py={6}>
            {selected && (
              <Stack spacing={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="xs" color="gray.500">EMPLOYEE</Text>
                        <HStack mt={2}>
                          <Avatar size="sm" name={personName(selected.requester)} />
                          <Box>
                            <Text fontWeight="800">{personName(selected.requester)}</Text>
                            <Text fontSize="xs" color="gray.500">{selected.department}</Text>
                          </Box>
                        </HStack>
                      </Box>
                      {(selected.requester?._id || selected.requestedById) && (
                        <Button
                          size="xs"
                          colorScheme="teal"
                          variant="outline"
                          onClick={() => navigate(`/users?userId=${selected.requester?._id || selected.requestedById}&tab=2`)}
                        >
                          Permissions & Profile
                        </Button>
                      )}
                    </Flex>
                  </Box>
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5}>
                    <Text fontSize="xs" color="gray.500">ASSIGNED MANAGER</Text>
                    <HStack mt={2}><Icon as={FiUserCheck} color="teal.600" /><Text fontWeight="800">{personName(selected.manager)}</Text></HStack>
                  </Box>
                </SimpleGrid>
                {selected.actor === 'hr' && selected.status === 'pending_manager' && (
                  <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={6}>
                    <Heading size="sm">Manager routing</Heading>
                    <Text mt={1} mb={4} fontSize="sm" color="gray.500">
                      This request is waiting for manager review. HR can correct its assignment if it was routed to the wrong reviewer.
                    </Text>
                    <Select
                      value={selected.manager?._id || selected.manager || ''}
                      onChange={(event) => reassignRequest(event.target.value)}
                      isDisabled={reassigning}
                    >
                      {managerDirectory.managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {personName(manager)} — {manager.jobTitle || manager.role}
                        </option>
                      ))}
                    </Select>
                  </Box>
                )}
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={6}>
                  <Heading size="sm" mb={4}>Request information</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {Object.entries(selected.formData || {}).filter(([key, value]) => value !== '' && value !== false && !['laptopPassword'].includes(key)).map(([key, value]) => (
                      <Box key={key} p={3} bg="gray.50" borderRadius="lg">
                        <Text fontSize="xs" color="gray.500" textTransform="uppercase">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Text>
                        <Text mt={1} fontSize="sm" fontWeight="700">{typeof value === 'boolean' ? 'Yes' : String(value)}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
                {selected.attachments?.length > 0 && (
                  <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={6}>
                    <Heading size="sm" mb={4}>Attachments</Heading>
                    <Stack>
                      {selected.attachments.map((attachment) => (
                        <Button key={attachment.fileId} as="a" href={attachment.url} target="_blank" variant="outline" justifyContent="space-between" rightIcon={<FiDownload />}>{attachment.originalName}</Button>
                      ))}
                    </Stack>
                  </Box>
                )}
                <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={6}>
                  <Heading size="sm" mb={4}>Approval history</Heading>
                  <Stack spacing={4}>
                    {(selected.history || []).map((event, index) => (
                      <Flex key={`${event.occurredAt}-${index}`} gap={3}>
                        <Flex w="34px" h="34px" bg="teal.50" borderRadius="full" align="center" justify="center"><Icon as={FiCheck} color="teal.600" /></Flex>
                        <Box><Text fontWeight="800" textTransform="capitalize">{event.action.replace(/_/g, ' ')}</Text><Text fontSize="xs" color="gray.500">{event.note || 'No note'} • {formatDate(event.occurredAt)}</Text></Box>
                      </Flex>
                    ))}
                  </Stack>
                </Box>
                {((selected.actor === 'manager' && selected.status === 'pending_manager') || (selected.actor === 'hr' && selected.status === 'pending_hr')) && (
                  <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={6}>
                    <Heading size="sm">Record your decision</Heading>
                    <Textarea mt={4} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Approval note or required rejection reason" minH="110px" />
                    <HStack mt={4} justify="flex-end">
                      <Button leftIcon={<FiX />} colorScheme="red" variant="outline" isDisabled={deciding} onClick={() => decide(selected.actor, 'rejected')}>Reject</Button>
                      <Button leftIcon={<FiCheck />} colorScheme="teal" isLoading={deciding} isDisabled={deciding} onClick={() => decide(selected.actor, 'approved')}>{selected.actor === 'manager' ? 'Approve & send to HR' : 'Approve request'}</Button>
                    </HStack>
                  </Box>
                )}
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default EmployeeRequestsPage;
