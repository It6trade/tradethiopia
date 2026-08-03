import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Avatar, Badge, Box, Button, Card, CardBody, Divider, Drawer,
  DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex,
  FormControl, FormLabel, Grid, Heading, HStack, Input, Select, SimpleGrid, Spinner,
  Stack, Stat, StatLabel, StatNumber, Table, Tbody, Td, Text, Textarea, Th, Thead,
  Tr, useToast, VStack,
} from '@chakra-ui/react';
import { FiCheck, FiClock, FiFilter, FiRefreshCw, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';

const TYPES = {
  annual_leave: 'Annual Leave', sick_leave: 'Sick Leave', paternity_leave: 'Paternity Leave',
  maternity_leave: 'Maternity Leave', marriage_leave: 'Marriage Leave', unpaid_leave: 'Unpaid Leave',
  other_leave: 'Other Leave',
};
const STATUSES = {
  pending_manager: ['Awaiting manager', 'orange'], manager_rejected: ['Manager rejected', 'red'],
  pending_hr: ['Awaiting HR', 'blue'], hr_approved: ['HR approved', 'green'],
  hr_rejected: ['HR rejected', 'red'], cancelled: ['Cancelled', 'gray'],
};
const nameOf = (person) => person?.fullName || person?.username || person?.email || 'Not assigned';
const dateOf = (value) => value ? new Date(value).toLocaleDateString() : 'Not recorded';
const dateTimeOf = (value) => value ? new Date(value).toLocaleString() : 'Not recorded';
const displayKey = (value) => String(value).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
const displayValue = (value) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
};

function Metric({ label, value, helper, color = 'teal', icon: Icon }) {
  return <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody><Flex justify="space-between"><Stat><StatLabel color="gray.600">{label}</StatLabel><StatNumber>{value}</StatNumber><Text fontSize="sm" color="gray.500">{helper}</Text></Stat><Box p={3} h="fit-content" borderRadius="xl" bg={`${color}.50`} color={`${color}.600`}><Icon size={22} /></Box></Flex></CardBody></Card>;
}

export default function LeaveManagementPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'all', type: 'all', department: 'all', from: '', to: '' });

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await axiosInstance.get('/employee-requests/hr-leave-dashboard');
      setRequests(data.data || []);
    } catch (error) {
      toast({ title: 'Leave records could not be loaded', description: error.response?.data?.message || error.message, status: 'error' });
    } finally { setLoading(false); setRefreshing(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => ({
    total: requests.length,
    manager: requests.filter((item) => item.status === 'pending_manager').length,
    hr: requests.filter((item) => item.status === 'pending_hr').length,
    approved: requests.filter((item) => item.status === 'hr_approved').length,
    rejected: requests.filter((item) => ['manager_rejected', 'hr_rejected'].includes(item.status)).length,
  }), [requests]);

  const departments = useMemo(() => [...new Set(requests.map((item) => item.department).filter(Boolean))].sort(), [requests]);
  const filtered = useMemo(() => requests.filter((item) => {
    const needle = filters.search.trim().toLowerCase();
    const searchable = [item.requestNumber, item.title, nameOf(item.requester), item.requester?.email, item.department].join(' ').toLowerCase();
    const created = new Date(item.createdAt);
    return (!needle || searchable.includes(needle)) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.type === 'all' || item.subcategory === filters.type) &&
      (filters.department === 'all' || item.department === filters.department) &&
      (!filters.from || created >= new Date(`${filters.from}T00:00:00`)) &&
      (!filters.to || created <= new Date(`${filters.to}T23:59:59`));
  }), [filters, requests]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ search: '', status: 'all', type: 'all', department: 'all', from: '', to: '' });

  const decide = async (decision) => {
    if (!selected?._id) return;
    if (decision === 'rejected' && !decisionNote.trim()) {
      toast({ title: 'Provide a clear rejection reason', status: 'warning' });
      return;
    }
    setDeciding(true);
    try {
      await axiosInstance.patch(`/employee-requests/${selected._id}/hr-decision`, { decision, note: decisionNote.trim() });
      toast({ title: decision === 'approved' ? 'Leave request approved' : 'Leave request rejected', status: 'success' });
      setSelected(null); setDecisionNote(''); await load(true);
    } catch (error) {
      toast({ title: 'HR decision could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
    } finally { setDeciding(false); }
  };

  return <Box maxW="1600px" mx="auto" px={{ base: 4, xl: 8 }} py={8}>
    <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={5} mb={7}>
      <Box><Text color="teal.700" fontSize="sm" fontWeight="800" letterSpacing="wide">HR WORKSPACE / LEAVE MANAGEMENT</Text><Heading size="xl">Leave Management</Heading><Text mt={2} color="gray.600" maxW="800px">Monitor every employee leave request from manager review through HR’s final decision. Use the filters to identify pending work, leave patterns, and individual records requiring attention.</Text></Box>
      <Button leftIcon={<FiRefreshCw />} variant="outline" colorScheme="teal" isLoading={refreshing} onClick={() => load(true)}>Refresh records</Button>
    </Flex>

    <SimpleGrid columns={{ base: 1, sm: 2, xl: 5 }} gap={4} mb={6}>
      <Metric label="All leave requests" value={summary.total} helper="Complete leave register" icon={FiUsers} />
      <Metric label="Awaiting manager" value={summary.manager} helper="Not yet sent to HR" color="orange" icon={FiClock} />
      <Metric label="Awaiting HR" value={summary.hr} helper="Ready for final review" color="blue" icon={FiFilter} />
      <Metric label="HR approved" value={summary.approved} helper="Final permission granted" color="green" icon={FiCheck} />
      <Metric label="Rejected" value={summary.rejected} helper="Manager or HR decision" color="red" icon={FiX} />
    </SimpleGrid>

    <Card border="1px solid" borderColor="gray.200" boxShadow="sm" mb={6}><CardBody>
      <Flex align="center" gap={2} mb={4}><FiFilter /><Heading size="md">Filter leave records</Heading></Flex>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: '2fr repeat(5, 1fr)' }} gap={4}>
        <FormControl><FormLabel fontSize="sm">Search</FormLabel><Box position="relative"><Box position="absolute" left={3} top={3} color="gray.400"><FiSearch /></Box><Input pl={10} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Employee, email or request ID" /></Box></FormControl>
        <FormControl><FormLabel fontSize="sm">Workflow status</FormLabel><Select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="all">All statuses</option>{Object.entries(STATUSES).map(([key, value]) => <option key={key} value={key}>{value[0]}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Leave type</FormLabel><Select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}><option value="all">All leave types</option>{Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Department</FormLabel><Select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}><option value="all">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Submitted from</FormLabel><Input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></FormControl>
        <FormControl><FormLabel fontSize="sm">Submitted to</FormLabel><Input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></FormControl>
      </Grid>
      <Flex justify="space-between" align="center" mt={4}><Text fontSize="sm" color="gray.600">Showing <b>{filtered.length}</b> of {requests.length} leave records</Text><Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button></Flex>
    </CardBody></Card>

    <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody p={0}>
      <Box p={5}><Heading size="md">Employee leave register</Heading><Text fontSize="sm" color="gray.500">Select any record to view the complete request, approval path, supporting files, and HR decision controls.</Text></Box>
      {loading ? <Flex minH="300px" justify="center" align="center"><Spinner size="xl" color="teal.500" /></Flex> : <Box overflowX="auto"><Table><Thead bg="gray.50"><Tr><Th>Employee</Th><Th>Leave type</Th><Th>Requested period</Th><Th>Department</Th><Th>Manager</Th><Th>Status</Th><Th>Submitted</Th><Th></Th></Tr></Thead><Tbody>
        {filtered.map((item) => { const status = STATUSES[item.status] || [displayKey(item.status), 'gray']; const form = item.formData || {}; const period = form.leaveDuration === 'half_day' ? `${dateOf(form.halfDayDate)} · Half day` : `${dateOf(form.startDate)} – ${dateOf(form.endDate)}`; return <Tr key={item._id} _hover={{ bg: 'gray.50' }}><Td><HStack><Avatar size="sm" name={nameOf(item.requester)} /><Box><Text fontWeight="700">{nameOf(item.requester)}</Text><Text fontSize="xs" color="gray.500">{item.requestNumber}</Text></Box></HStack></Td><Td><Text fontWeight="600">{TYPES[item.subcategory] || item.title}</Text></Td><Td whiteSpace="nowrap">{period}</Td><Td>{item.department}</Td><Td>{nameOf(item.manager)}</Td><Td><Badge colorScheme={status[1]}>{status[0]}</Badge></Td><Td whiteSpace="nowrap">{dateOf(item.createdAt)}</Td><Td><Button size="sm" colorScheme="teal" variant="outline" onClick={() => { setSelected(item); setDecisionNote(''); }}>View details</Button></Td></Tr>; })}
        {!filtered.length && <Tr><Td colSpan={8} textAlign="center" py={14} color="gray.500">No leave requests match the selected filters.</Td></Tr>}
      </Tbody></Table></Box>}
    </CardBody></Card>

    <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} placement="right" size="full"><DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" /><DrawerContent ml="auto" maxW={{ base: '100%', lg: '860px' }} bg="gray.50"><DrawerCloseButton color="white" top={5} right={5} /><DrawerHeader p={0}><Box px={{ base: 5, md: 8 }} py={7} bg="linear-gradient(120deg, #225b5c, #2f8584)" color="white"><Text fontSize="xs" fontWeight="800">{selected?.requestNumber}</Text><Heading mt={1}>{selected && (TYPES[selected.subcategory] || selected.title)}</Heading><Text mt={2} color="teal.100">Complete employee leave record and approval history</Text></Box></DrawerHeader><DrawerBody px={{ base: 4, md: 8 }} py={6}>
      {selected && <Stack spacing={5}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}><Card><CardBody><Text fontSize="xs" fontWeight="800" color="gray.500">EMPLOYEE</Text><HStack mt={3}><Avatar name={nameOf(selected.requester)} /><Box><Text fontWeight="800">{nameOf(selected.requester)}</Text><Text fontSize="sm" color="gray.500">{selected.requester?.email}</Text></Box></HStack></CardBody></Card><Card><CardBody><Text fontSize="xs" fontWeight="800" color="gray.500">ASSIGNED MANAGER</Text><Text mt={3} fontWeight="800">{nameOf(selected.manager)}</Text><Text fontSize="sm" color="gray.500">{selected.department}</Text></CardBody></Card></SimpleGrid>
        <Card><CardBody><Heading size="md" mb={4}>Leave information</Heading><SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>{Object.entries(selected.formData || {}).filter(([key, value]) => value !== '' && value !== false && !['laptopPassword'].includes(key)).map(([key, value]) => <Box key={key} p={3} bg="gray.50" borderRadius="lg"><Text fontSize="xs" fontWeight="800" color="gray.500">{displayKey(key)}</Text><Text mt={1} fontWeight="600">{displayValue(value)}</Text></Box>)}</SimpleGrid></CardBody></Card>
        {selected.attachments?.length > 0 && <Card><CardBody><Heading size="md" mb={3}>Supporting documents</Heading><Stack>{selected.attachments.map((attachment) => <Button key={attachment.fileId} as="a" href={attachment.url} target="_blank" variant="outline" justifyContent="start">{attachment.originalName}</Button>)}</Stack></CardBody></Card>}
        <Card><CardBody><Heading size="md">Approval timeline</Heading><VStack align="stretch" mt={4} spacing={4}>{(selected.history || []).map((event, index) => <Flex key={`${event.occurredAt}-${index}`} gap={3}><Box mt={1} w="10px" h="10px" borderRadius="full" bg="teal.500" /><Box><Text fontWeight="700">{displayKey(event.action)}</Text><Text fontSize="sm" color="gray.600">{event.note || STATUSES[event.status]?.[0]}</Text><Text fontSize="xs" color="gray.400">{dateTimeOf(event.occurredAt)}</Text></Box></Flex>)}</VStack></CardBody></Card>
        {selected.status === 'pending_manager' && <Alert status="info" borderRadius="xl"><AlertIcon />This request is still with the assigned manager. HR can monitor it but cannot issue the final decision yet.</Alert>}
        {selected.status === 'pending_hr' && <Card border="1px solid" borderColor="blue.200"><CardBody><Heading size="md">HR final decision</Heading><Text mt={1} fontSize="sm" color="gray.600">Confirm the manager-approved request or provide a clear reason for rejection.</Text><Textarea mt={4} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Decision note or rejection reason" /><Divider my={4} /><Flex justify="end" gap={3}><Button leftIcon={<FiX />} colorScheme="red" variant="outline" isDisabled={deciding} onClick={() => decide('rejected')}>Reject</Button><Button leftIcon={<FiCheck />} colorScheme="teal" isLoading={deciding} onClick={() => decide('approved')}>Approve leave</Button></Flex></CardBody></Card>}
      </Stack>}
    </DrawerBody></DrawerContent></Drawer>
  </Box>;
}
