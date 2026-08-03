import { useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Avatar, Badge, Box, Button, Container, Divider, Drawer, DrawerBody,
  DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, FormControl,
  FormLabel, Grid, GridItem, Heading, HStack, Icon, Input, Select, SimpleGrid, Spinner,
  Stack, Stat, StatLabel, StatNumber, Tab, TabList, TabPanel, TabPanels, Tabs, Text,
  Textarea, useDisclosure, useToast, VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiClock, FiEye, FiFileText, FiSend, FiShield } from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';
import { useSearchParams } from 'react-router-dom';

const CATEGORY_LABELS = { attendance: 'Attendance', respect_attitude: 'Respect and Attitude', company_related: 'Company Related' };
const LEVEL_LABELS = { first: 'First Warning', second: 'Second Warning', final: 'Final Warning' };
const STATUS_LABELS = { draft: 'Draft', issued: 'Awaiting acknowledgement', acknowledged: 'Acknowledged', employee_responded: 'Employee responded', resolved: 'Resolved', withdrawn: 'Withdrawn' };
const statusScheme = (status) => ({ draft: 'gray', issued: 'orange', acknowledged: 'blue', employee_responded: 'purple', resolved: 'green', withdrawn: 'gray' }[status] || 'gray');
const date = (value) => value ? new Date(value).toLocaleDateString() : 'Not set';
const dateTime = (value) => value ? new Date(value).toLocaleString() : 'Not recorded';
const emptyForm = { employeeId: '', category: '', reason: '', level: 'first', incidentDate: '', incidentTime: '', incidentDescription: '', correctiveAction: '', consequences: '', improvementDeadline: '', responseDeadline: '' };
const REQUIRED_WARNING_FIELDS = [
  ['employeeId', 'Employee'], ['category', 'Category'], ['reason', 'Specific reason'],
  ['incidentDate', 'Incident date'], ['incidentDescription', 'Incident description'],
  ['correctiveAction', 'Expected corrective action'], ['consequences', 'Consequences of repetition'],
  ['responseDeadline', 'Employee response deadline'],
];

const Detail = ({ label, children }) => <Box><Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">{label}</Text><Text mt={1} fontSize="sm" fontWeight="600" whiteSpace="pre-wrap">{children || 'Not provided'}</Text></Box>;

export default function EmployeeWarningsPage({ mode }) {
  const currentUser = useUserStore((s) => s.currentUser);
  const [searchParams] = useSearchParams();
  const isHr = mode === 'hr' || ['hr', 'admin'].includes(normalizeRole(currentUser?.role));
  const toast = useToast();
  const detailDrawer = useDisclosure();
  const [warnings, setWarnings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState({});
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [response, setResponse] = useState('');
  const [responseFiles, setResponseFiles] = useState([]);
  const [closeNote, setCloseNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const calls = [axiosInstance.get('/employee-warnings/categories'), axiosInstance.get(isHr ? '/employee-warnings/hr' : '/employee-warnings/mine')];
      if (isHr) calls.push(axiosInstance.get('/employee-warnings/employees'));
      const [categoryResponse, warningResponse, employeeResponse] = await Promise.all(calls);
      setCategories(categoryResponse.data.data || {}); setWarnings(warningResponse.data.data || []); setEmployees(employeeResponse?.data?.data || []);
      const warningId = searchParams.get('warning');
      if (warningId && warningResponse.data.data?.some((item) => item._id === warningId)) {
        const { data } = await axiosInstance.get(`/employee-warnings/${warningId}`);
        setSelected(data.data); setResponse(data.data.employeeResponse?.text || ''); detailDrawer.onOpen();
      }
    } catch (error) { toast({ title: 'Unable to load warnings', description: error.response?.data?.message || error.message, status: 'error' }); }
    finally { setLoading(false); }
  };
  // Reload when the page switches between the HR and employee views.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [isHr]);

  const stats = useMemo(() => ({
    total: warnings.length,
    open: warnings.filter((item) => ['issued', 'acknowledged', 'employee_responded'].includes(item.status)).length,
    awaiting: warnings.filter((item) => item.status === 'issued').length,
    resolved: warnings.filter((item) => item.status === 'resolved').length,
  }), [warnings]);

  const selectedEmployee = employees.find((employee) => employee._id === form.employeeId);
  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value, ...(field === 'category' ? { reason: '' } : {}) }));
    setValidationErrors((previous) => {
      const next = { ...previous }; delete next[field];
      if (field === 'category') delete next.reason;
      return next;
    });
  };
  const openDetail = async (item) => {
    try { const { data } = await axiosInstance.get(`/employee-warnings/${item._id}`); setSelected(data.data); setResponse(data.data.employeeResponse?.text || ''); detailDrawer.onOpen(); await load(); }
    catch (error) { toast({ title: 'Unable to open warning', description: error.response?.data?.message, status: 'error' }); }
  };
  const createWarning = async (issueNow = false) => {
    const errors = Object.fromEntries(REQUIRED_WARNING_FIELDS
      .filter(([field]) => !String(form[field] || '').trim())
      .map(([field, label]) => [field, `${label} is required.`]));
    if (form.incidentDate && form.responseDeadline && new Date(form.responseDeadline) < new Date(form.incidentDate)) {
      errors.responseDeadline = 'The response deadline cannot be before the incident date.';
    }
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      const firstField = Object.keys(errors)[0];
      document.getElementById(`warning-${firstField}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast({
        title: 'Complete the required warning information',
        description: Object.values(errors).join(' '),
        status: 'warning',
      });
      return;
    }
    setWorking(true);
    try {
      const data = new FormData(); data.append('payload', JSON.stringify({ ...form, issueNow })); files.forEach((file) => data.append('attachments', file));
      await axiosInstance.post('/employee-warnings', data);
      toast({
        title: issueNow ? 'Warning issued to employee' : 'Warning draft saved',
        description: issueNow ? 'The warning is now visible in the employee’s My Warnings page.' : 'This draft remains private to HR until it is issued.',
        status: 'success',
      });
      setForm(emptyForm); setFiles([]); setValidationErrors({}); await load();
    } catch (error) { toast({ title: issueNow ? 'Warning could not be issued' : 'Draft could not be saved', description: error.response?.data?.message || error.message, status: 'error' }); }
    finally { setWorking(false); }
  };
  const action = async (path, body, success) => {
    setWorking(true); try { const { data } = await axiosInstance.post(path, body); setSelected(data.data); toast({ title: success, status: 'success' }); await load(); }
    catch (error) { toast({ title: 'Action could not be completed', description: error.response?.data?.message || error.message, status: 'error' }); }
    finally { setWorking(false); }
  };
  const submitResponse = async () => {
    const data = new FormData(); data.append('response', response); responseFiles.forEach((file) => data.append('attachments', file));
    await action(`/employee-warnings/${selected._id}/respond`, data, 'Response submitted to HR');
  };

  return (
    <Box minH="100vh" bg="#f5f8fa" py={{ base: 6, md: 9 }}>
      <Container maxW="7xl">
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} mb={7}>
          <Box><Text color="teal.600" fontSize="xs" fontWeight="800" letterSpacing="widest">CONFIDENTIAL EMPLOYEE RECORDS</Text><Heading mt={1} size="xl">{isHr ? 'Warning Management' : 'My Warnings'}</Heading><Text mt={2} color="gray.600">{isHr ? 'Prepare, issue, and follow up employee warnings with a complete record.' : 'Review confidential HR warnings, acknowledge receipt, and submit your response.'}</Text></Box>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </Flex>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={7}>{[['Total records', stats.total], ['Open follow-up', stats.open], ['Awaiting acknowledgement', stats.awaiting], ['Resolved', stats.resolved]].map(([label, value]) => <Stat key={label} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}><StatLabel color="gray.500" fontSize="xs">{label}</StatLabel><StatNumber>{value}</StatNumber></Stat>)}</SimpleGrid>
        {loading ? <Flex justify="center" py={20}><Spinner size="xl" color="teal.500" /></Flex> : isHr ? (
          <Tabs colorScheme="teal" variant="soft-rounded">
            <TabList><Tab>Create warning</Tab><Tab>Warning records</Tab></TabList>
            <TabPanels mt={4}>
              <TabPanel p={0}>
                <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" p={{ base: 5, md: 7 }}>
                  <Heading size="md">Prepare warning letter</Heading><Text mt={2} color="gray.600" fontSize="sm">The employee identity is read from the database. Complete every required HR field, then save privately as a draft or issue the warning directly to the employee.</Text>
                  <Divider my={6} />
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5}>
                    <FormControl isRequired isInvalid={Boolean(validationErrors.employeeId)}><FormLabel>Employee</FormLabel><Select id="warning-employeeId" value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)} placeholder="Select employee from database">{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.fullName || employee.username} — {employee.email}</option>)}</Select></FormControl>
                    <FormControl><FormLabel>Employee record</FormLabel><Box minH="40px" border="1px solid" borderColor="gray.200" borderRadius="md" px={3} py={2} bg="gray.50"><Text fontSize="sm">{selectedEmployee ? `${selectedEmployee.digitalId || 'No employee ID'} • ${selectedEmployee.jobTitle || selectedEmployee.role}` : 'Select an employee to verify their record'}</Text></Box></FormControl>
                    <FormControl isRequired isInvalid={Boolean(validationErrors.category)}><FormLabel>Category</FormLabel><Select id="warning-category" value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Select category">{Object.keys(categories).map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}</Select></FormControl>
                    <FormControl isRequired isInvalid={Boolean(validationErrors.reason)}><FormLabel>Specific reason</FormLabel><Select id="warning-reason" value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Select reason" isDisabled={!form.category}>{(categories[form.category] || []).map((reason) => <option key={reason}>{reason}</option>)}</Select></FormControl>
                    <FormControl isRequired><FormLabel>Warning level</FormLabel><Select value={form.level} onChange={(e) => update('level', e.target.value)}>{Object.entries(LEVEL_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl>
                    <HStack align="start"><FormControl isRequired isInvalid={Boolean(validationErrors.incidentDate)}><FormLabel>Incident date</FormLabel><Input id="warning-incidentDate" type="date" value={form.incidentDate} onChange={(e) => update('incidentDate', e.target.value)} /></FormControl><FormControl><FormLabel>Time</FormLabel><Input type="time" value={form.incidentTime} onChange={(e) => update('incidentTime', e.target.value)} /></FormControl></HStack>
                    <GridItem colSpan={{ md: 2 }}><FormControl isRequired isInvalid={Boolean(validationErrors.incidentDescription)}><FormLabel>Incident description</FormLabel><Textarea id="warning-incidentDescription" rows={4} value={form.incidentDescription} onChange={(e) => update('incidentDescription', e.target.value)} placeholder="Provide objective facts, dates, and relevant context." /></FormControl></GridItem>
                    <GridItem colSpan={{ md: 2 }}><FormControl isRequired isInvalid={Boolean(validationErrors.correctiveAction)}><FormLabel>Expected corrective action</FormLabel><Textarea id="warning-correctiveAction" value={form.correctiveAction} onChange={(e) => update('correctiveAction', e.target.value)} placeholder="Describe the behavior or performance expected from the employee." /></FormControl></GridItem>
                    <GridItem colSpan={{ md: 2 }}><FormControl isRequired isInvalid={Boolean(validationErrors.consequences)}><FormLabel>Consequences of repetition</FormLabel><Textarea id="warning-consequences" value={form.consequences} onChange={(e) => update('consequences', e.target.value)} placeholder="Explain the potential next disciplinary step clearly." /></FormControl></GridItem>
                    <FormControl><FormLabel>Improvement deadline</FormLabel><Input type="date" value={form.improvementDeadline} onChange={(e) => update('improvementDeadline', e.target.value)} /></FormControl>
                    <FormControl isRequired isInvalid={Boolean(validationErrors.responseDeadline)}><FormLabel>Employee response deadline</FormLabel><Input id="warning-responseDeadline" type="date" value={form.responseDeadline} onChange={(e) => update('responseDeadline', e.target.value)} /></FormControl>
                    <GridItem colSpan={{ md: 2 }}><FormControl><FormLabel>Supporting evidence (optional)</FormLabel><Input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" p={1} onChange={(e) => setFiles(Array.from(e.target.files || []))} /><Text mt={1} fontSize="xs" color="gray.500">Up to five PDF, Word, JPG, or PNG files; maximum 10 MB each.</Text></FormControl></GridItem>
                  </Grid>
                  {Object.keys(validationErrors).length > 0 && (
                    <Alert status="warning" mt={6} borderRadius="xl" alignItems="flex-start">
                      <AlertIcon mt={0.5} />
                      <Box>
                        <Text fontWeight="800">Complete the highlighted required information</Text>
                        <Text mt={1} fontSize="sm">{Object.values(validationErrors).join(' ')}</Text>
                      </Box>
                    </Alert>
                  )}
                  <Flex justify="end" gap={3} mt={7} flexWrap="wrap">
                    <Button leftIcon={<FiFileText />} variant="outline" colorScheme="teal" isLoading={working} onClick={() => createWarning(false)}>Save draft</Button>
                    <Button leftIcon={<FiSend />} colorScheme="teal" isLoading={working} onClick={() => createWarning(true)}>Issue to employee</Button>
                  </Flex>
                </Box>
              </TabPanel>
              <TabPanel p={0}><WarningList warnings={warnings} openDetail={openDetail} /></TabPanel>
            </TabPanels>
          </Tabs>
        ) : <WarningList warnings={warnings} openDetail={openDetail} employee />}
      </Container>

      <Drawer isOpen={detailDrawer.isOpen} onClose={detailDrawer.onClose} placement="right" size="xl"><DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" /><DrawerContent><DrawerCloseButton color="white" mt={2} /><DrawerHeader bg="linear-gradient(120deg, #173d3d, #287d7b)" color="white" py={6}><Text fontSize="xs" color="teal.100">{selected?.referenceNumber}</Text><Heading size="lg">{selected ? LEVEL_LABELS[selected.level] : 'Warning details'}</Heading><Badge mt={2} colorScheme={statusScheme(selected?.status)}>{STATUS_LABELS[selected?.status]}</Badge></DrawerHeader><DrawerBody bg="#f7fafc" py={6}>
        {selected && <Stack spacing={5}>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><HStack><Avatar name={selected.employeeSnapshot?.fullName || selected.employeeSnapshot?.username} /><Box><Heading size="sm">{selected.employeeSnapshot?.fullName || selected.employeeSnapshot?.username}</Heading><Text color="gray.600" fontSize="sm">{selected.employeeSnapshot?.email}</Text><Text color="gray.500" fontSize="xs">{selected.employeeSnapshot?.digitalId || 'No employee ID'} • {selected.employeeSnapshot?.jobTitle || selected.employeeSnapshot?.department}</Text></Box></HStack></Box>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}><Detail label="Category">{CATEGORY_LABELS[selected.category]}</Detail><Detail label="Reason">{selected.reason}</Detail><Detail label="Incident date">{date(selected.incidentDate)} {selected.incidentTime}</Detail><Detail label="Response deadline">{date(selected.responseDeadline)}</Detail></SimpleGrid><Divider my={5} /><Stack spacing={4}><Detail label="Incident description">{selected.incidentDescription}</Detail><Detail label="Expected corrective action">{selected.correctiveAction}</Detail><Detail label="Consequences of repetition">{selected.consequences}</Detail></Stack></Box>
          {selected.attachments?.length > 0 && <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><Heading size="sm" mb={3}>Supporting evidence</Heading>{selected.attachments.map((file) => <Button key={file.fileId} as="a" href={file.url} target="_blank" variant="outline" size="sm" mr={2} mb={2}>{file.originalName}</Button>)}</Box>}
          {!isHr && selected.status === 'issued' && <Alert status="info" borderRadius="xl"><AlertIcon /><Box><Text fontWeight="700">Acknowledgement confirms receipt only</Text><Text fontSize="sm">It does not indicate agreement with the warning.</Text><Button mt={3} colorScheme="teal" size="sm" isLoading={working} onClick={() => action(`/employee-warnings/${selected._id}/acknowledge`, {}, 'Warning receipt acknowledged')}>Acknowledge receipt</Button></Box></Alert>}
          {!isHr && ['issued', 'acknowledged'].includes(selected.status) && <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><Heading size="sm">Submit a response to HR</Heading><Textarea mt={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Provide your explanation or response." /><Input mt={3} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" p={1} onChange={(e) => setResponseFiles(Array.from(e.target.files || []))} /><Button mt={3} leftIcon={<FiSend />} colorScheme="teal" isLoading={working} onClick={submitResponse}>Submit response</Button></Box>}
          {selected.employeeResponse?.text && <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><Heading size="sm">Employee response</Heading><Text mt={3} whiteSpace="pre-wrap">{selected.employeeResponse.text}</Text><Text mt={2} fontSize="xs" color="gray.500">Submitted {dateTime(selected.employeeResponse.submittedAt)}</Text></Box>}
          {isHr && ['issued', 'acknowledged', 'employee_responded'].includes(selected.status) && <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><Heading size="sm">HR follow-up decision</Heading><Textarea mt={3} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="Record the reason for resolving or withdrawing this warning." /><HStack mt={3}><Button colorScheme="green" isLoading={working} onClick={() => action(`/employee-warnings/${selected._id}/close`, { status: 'resolved', note: closeNote }, 'Warning resolved')}>Resolve</Button><Button variant="outline" isLoading={working} onClick={() => action(`/employee-warnings/${selected._id}/close`, { status: 'withdrawn', note: closeNote }, 'Warning withdrawn')}>Withdraw</Button></HStack></Box>}
          {isHr && selected.status === 'draft' && <Button colorScheme="orange" leftIcon={<FiSend />} isLoading={working} onClick={() => action(`/employee-warnings/${selected._id}/issue`, {}, 'Warning issued to employee')}>Issue warning to employee</Button>}
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}><Heading size="sm" mb={4}>Activity history</Heading><VStack align="stretch" spacing={3}>{[...(selected.history || [])].reverse().map((event, index) => <Flex key={`${event.action}-${index}`} gap={3}><Icon as={FiClock} mt={1} color="teal.500" /><Box><Text fontWeight="700" fontSize="sm">{event.action.replace(/_/g, ' ')}</Text><Text fontSize="xs" color="gray.500">{dateTime(event.occurredAt)} • {event.actor?.fullName || event.actor?.username || event.actorRole}</Text>{event.note && <Text mt={1} fontSize="sm">{event.note}</Text>}</Box></Flex>)}</VStack></Box>
        </Stack>}
      </DrawerBody></DrawerContent></Drawer>
    </Box>
  );
}

const WarningList = ({ warnings, openDetail, employee = false }) => warnings.length ? <Stack spacing={4}>{warnings.map((item) => <Flex key={item._id} bg="white" border="1px solid" borderColor={item.status === 'issued' ? 'orange.200' : 'gray.200'} borderRadius="xl" p={5} justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}><HStack align="start"><Flex w="42px" h="42px" borderRadius="xl" bg="orange.50" color="orange.600" align="center" justify="center"><Icon as={FiAlertTriangle} /></Flex><Box><HStack flexWrap="wrap"><Heading size="sm">{LEVEL_LABELS[item.level]}</Heading><Badge colorScheme={statusScheme(item.status)}>{STATUS_LABELS[item.status]}</Badge></HStack><Text mt={1} fontSize="sm" color="gray.600">{CATEGORY_LABELS[item.category]} • {item.reason}</Text><Text mt={1} fontSize="xs" color="gray.500">{employee ? item.referenceNumber : `${item.employeeSnapshot?.fullName || item.employeeSnapshot?.username} • ${item.referenceNumber}`} • Issued {date(item.issuedAt)}</Text></Box></HStack><Button leftIcon={<FiEye />} variant="outline" colorScheme="teal" onClick={() => openDetail(item)}>Review</Button></Flex>)}</Stack> : <Box bg="white" border="1px dashed" borderColor="gray.300" borderRadius="2xl" py={16} textAlign="center"><Icon as={FiShield} boxSize={9} color="gray.400" /><Heading mt={3} size="sm">No warning records found</Heading><Text mt={2} color="gray.500" fontSize="sm">{employee ? 'You do not currently have any issued HR warnings.' : 'Create a warning draft when formal HR follow-up is required.'}</Text></Box>;
