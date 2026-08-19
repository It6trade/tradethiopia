import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, DownloadIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons';
import axiosInstance from '../services/axiosInstance';

const emptyForm = {
  department: 'HR',
  candidateType: 'active',
  fullName: '',
  positionAppliedFor: '',
  availabilityToStart: '',
  totalExperience: '',
  currentAddress: '',
  source: '',
  applicationDate: '',
  currentStage: '',
  interviewer: '',
  phone: '',
  accountEmail: '',
  accountRole: '',
  hiredStatus: 'pending',
  position: '',
  backupCandidate: '',
  internalExternal: '',
  readiness: '',
  keyStrengths: '',
  developmentNeeded: '',
  contact: '',
  notes: '',
};

const departmentSheets = new Set([
  'Finance',
  'Sales',
  'Customer Success',
  'IT Department',
  'Instructor',
  'HR',
  'Tradex',
  'Academic Administrative',
]);

const departments = [
  'Finance',
  'Sales',
  'Customer Success',
  'IT Department',
  'Instructor',
  'HR',
  'Tradex',
  'Academic Administrative',
];

const roleOptions = [
  'sales',
  'HR',
  'customerservice',
  'CustomerSuccessManager',
  'IT',
  'finance',
  'Instructor',
  'SocialmediaManager',
  'tradextv',
  'EventManager',
  'salesmanager',
  'supervisor',
  'reception',
  'COO',
  'CEO',
  'tessbinadmin',
];

const departmentRoleMap = {
  Finance: 'finance',
  Sales: 'sales',
  'Customer Success': 'CustomerSuccessManager',
  'IT Department': 'IT',
  Instructor: 'Instructor',
  HR: 'HR',
  Tradex: 'tradextv',
  'Academic Administrative': 'HR',
  Tessbin: 'tessbinadmin',
};

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const readyStageWords = ['pass', 'passed', 'complete', 'completed', 'hired', 'selected', 'accepted'];
const isReadyForAccount = (record) => record.candidateType === 'active'
  && record.hiredStatus !== 'hired'
  && record.hiredStatus !== 'rejected'
  && readyStageWords.some((word) => normalize(record.currentStage).includes(word));

const generatePassword = () => {
  const part = Math.random().toString(36).slice(2, 8);
  return `Hire@${part}${Math.floor(10 + Math.random() * 90)}`;
};
const loadXlsx = () => new Promise((resolve, reject) => {
  if (window.XLSX) {
    resolve(window.XLSX);
    return;
  }

  const existingScript = document.querySelector('script[data-xlsx-loader="true"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.XLSX));
    existingScript.addEventListener('error', reject);
    return;
  }

  const script = document.createElement('script');
  script.src = '/vendor/xlsx.full.min.js';
  script.async = true;
  script.dataset.xlsxLoader = 'true';
  script.onload = () => resolve(window.XLSX);
  script.onerror = () => reject(new Error('Failed to load Excel parser'));
  document.body.appendChild(script);
});
const compact = (value) => String(value ?? '').trim();

const isEmptyRow = (row) => row.every((cell) => compact(cell) === '');

const findHeaderIndex = (rows, label) => rows.findIndex((row) => row.some((cell) => normalize(cell) === normalize(label)));

const findBackupHeaderIndex = (rows, startIndex) => rows.findIndex((row, index) => (
  index > startIndex && row.some((cell) => normalize(cell) === 'backupcandidate')
));

const valueByHeaders = (row, headers, labels) => {
  const wanted = labels.map(normalize);
  const index = headers.findIndex((header) => wanted.includes(normalize(header)));
  return index >= 0 ? compact(row[index]) : '';
};

const parseCandidateWorkbook = async (file) => {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const records = [];

  workbook.SheetNames.filter((sheetName) => departmentSheets.has(sheetName)).forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    const activeHeaderIndex = findHeaderIndex(rows, 'Full Name');
    if (activeHeaderIndex === -1) return;

    const backupHeaderIndex = findBackupHeaderIndex(rows, activeHeaderIndex);
    const activeHeaders = rows[activeHeaderIndex].map(compact);
    const activeEndIndex = backupHeaderIndex === -1 ? rows.length : backupHeaderIndex;

    rows.slice(activeHeaderIndex + 1, activeEndIndex).forEach((row) => {
      if (isEmptyRow(row)) return;
      const fullName = valueByHeaders(row, activeHeaders, ['Full Name']);
      if (!fullName) return;
      records.push({
        ...emptyForm,
        department: sheetName,
        candidateType: 'active',
        fullName,
        availabilityToStart: valueByHeaders(row, activeHeaders, ['Availability to Start']),
        totalExperience: valueByHeaders(row, activeHeaders, ['Total Experience', 'Total year Experience']),
        currentAddress: valueByHeaders(row, activeHeaders, ['Current Adress', 'Current Address']),
        positionAppliedFor: valueByHeaders(row, activeHeaders, ['Position Applied For']),
        source: valueByHeaders(row, activeHeaders, ['Source']),
        applicationDate: valueByHeaders(row, activeHeaders, ['Application Date', 'Interviewed Date']),
        currentStage: valueByHeaders(row, activeHeaders, ['Current Stage']),
        interviewer: valueByHeaders(row, activeHeaders, ['Interviewer']),
        phone: valueByHeaders(row, activeHeaders, ['Phone']),
        notes: valueByHeaders(row, activeHeaders, ['Notes']),
      });
    });

    if (backupHeaderIndex !== -1) {
      const backupHeaders = rows[backupHeaderIndex].map(compact);
      rows.slice(backupHeaderIndex + 1).forEach((row) => {
        if (isEmptyRow(row)) return;
        const backupCandidate = valueByHeaders(row, backupHeaders, ['Backup Candidate']);
        const position = valueByHeaders(row, backupHeaders, ['Position']);
        if (!backupCandidate && !position) return;
        records.push({
          ...emptyForm,
          department: sheetName,
          candidateType: 'backup',
          position,
          backupCandidate,
          internalExternal: valueByHeaders(row, backupHeaders, ['Internal/External']),
          readiness: valueByHeaders(row, backupHeaders, ['Readiness']),
          keyStrengths: valueByHeaders(row, backupHeaders, ['Key Strengths']),
          developmentNeeded: valueByHeaders(row, backupHeaders, ['Development Needed']),
          contact: valueByHeaders(row, backupHeaders, ['Contact']),
          notes: valueByHeaders(row, backupHeaders, ['Notes']),
        });
      });
    }
  });

  return records;
};

const CandidatePoolPage = () => {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [hireCandidate, setHireCandidate] = useState(null);
  const [hireForm, setHireForm] = useState({ email: '', password: '', role: 'sales' });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const toast = useToast();
  const panelBg = useColorModeValue('white', 'gray.800');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/candidate-pool');
      setRecords(data.data || []);
    } catch (error) {
      toast({ title: 'Failed to load candidate pool', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const visibleRecords = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [
        record.fullName,
        record.backupCandidate,
        record.positionAppliedFor,
        record.position,
        record.phone,
        record.contact,
        record.currentStage,
        record.notes,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      return matchesSearch
        && (!departmentFilter || record.department === departmentFilter)
        && (!typeFilter || record.candidateType === typeFilter);
    });
  }, [records, search, departmentFilter, typeFilter]);

  const summary = useMemo(() => ({
    active: records.filter((record) => record.candidateType === 'active').length,
    backup: records.filter((record) => record.candidateType === 'backup').length,
    departments: new Set(records.map((record) => record.department)).size,
  }), [records]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/candidate-pool/${editingId}`, form);
        toast({ title: 'Candidate updated', status: 'success' });
      } else {
        await axiosInstance.post('/candidate-pool', form);
        toast({ title: 'Candidate added', status: 'success' });
      }
      resetForm();
      fetchRecords();
    } catch (error) {
      toast({ title: 'Save failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setForm({ ...emptyForm, ...record });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Delete this candidate record?')) return;
    try {
      await axiosInstance.delete(`/candidate-pool/${record._id}`);
      toast({ title: 'Candidate deleted', status: 'success' });
      fetchRecords();
    } catch (error) {
      toast({ title: 'Delete failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };



  const handleRejectCandidate = async (record) => {
    if (!window.confirm('Reject this candidate?')) return;
    try {
      await axiosInstance.put(`/candidate-pool/${record._id}`, {
        ...record,
        hiredStatus: 'rejected',
        currentStage: 'Rejected',
      });
      toast({ title: 'Candidate rejected', status: 'success' });
      fetchRecords();
    } catch (error) {
      toast({ title: 'Reject failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };
  const openHireModal = (record) => {
    setHireCandidate(record);
    setHireForm({
      email: record.accountEmail || '',
      password: generatePassword(),
      role: record.accountRole || departmentRoleMap[record.department] || 'sales',
    });
  };

  const closeHireModal = () => {
    if (creatingAccount) return;
    setHireCandidate(null);
  };

  const handleCreateAccount = async () => {
    if (!hireCandidate) return;
    const username = (hireCandidate.fullName || '').trim();
    if (!username || !hireForm.email || !hireForm.password || !hireForm.role) {
      toast({ title: 'Name, email, password and role are required', status: 'warning' });
      return;
    }

    setCreatingAccount(true);
    try {
      const userPayload = {
        username,
        fullName: username,
        email: hireForm.email.trim().toLowerCase(),
        password: hireForm.password,
        role: hireForm.role,
        status: 'active',
        jobTitle: hireCandidate.positionAppliedFor,
        phone: hireCandidate.phone,
        location: hireCandidate.currentAddress,
        hireDate: new Date().toISOString(),
        notes: `Hired from candidate pool. Stage: ${hireCandidate.currentStage || 'Completed'}`,
      };

      await axiosInstance.post('/users', userPayload);
      await axiosInstance.put(`/candidate-pool/${hireCandidate._id}`, {
        ...hireCandidate,
        accountEmail: userPayload.email,
        accountRole: userPayload.role,
        hiredStatus: 'hired',
        currentStage: 'Hired',
      });
      toast({ title: 'Account created and candidate marked hired', status: 'success' });
      setHireCandidate(null);
      fetchRecords();
    } catch (error) {
      toast({ title: 'Account creation failed', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setCreatingAccount(false);
    }
  };
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const parsedRecords = await parseCandidateWorkbook(file);
      if (!parsedRecords.length) {
        toast({ title: 'No candidate rows found in workbook', status: 'warning' });
        return;
      }
      const { data } = await axiosInstance.post('/candidate-pool/import', {
        records: parsedRecords,
        replaceExisting,
      });
      toast({ title: 'Excel imported', description: `${data.importedCount || parsedRecords.length} records imported`, status: 'success' });
      fetchRecords();
    } catch (error) {
      toast({ title: 'Import failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const handleExport = async () => {
    const rows = visibleRecords.map((record) => ({
      Department: record.department,
      Type: record.candidateType === 'backup' ? 'Backup Candidate' : 'Active Pool',
      'Full Name': record.fullName,
      'Position Applied For': record.positionAppliedFor,
      'Availability to Start': record.availabilityToStart,
      'Total Experience': record.totalExperience,
      'Current Address': record.currentAddress,
      Source: record.source,
      'Application / Interview Date': record.applicationDate,
      'Current Stage': record.currentStage,
      Interviewer: record.interviewer,
      Phone: record.phone,
      'Account Email': record.accountEmail,
      'Account Role': record.accountRole,
      'Hire / Reject Status': record.hiredStatus,
      Position: record.position,
      'Backup Candidate': record.backupCandidate,
      'Internal/External': record.internalExternal,
      Readiness: record.readiness,
      'Key Strengths': record.keyStrengths,
      'Development Needed': record.developmentNeeded,
      Contact: record.contact,
      Notes: record.notes,
    }));
    const XLSX = await loadXlsx();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Pool');
    XLSX.writeFile(workbook, 'candidate-pool-system-export.xlsx');
  };

  const isBackup = form.candidateType === 'backup';

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={5}>
        <Box>
          <Heading size="lg" color="teal.600">Candidate Pool</Heading>
          <Text color="gray.500">Active candidate pool and backup succession candidates by department.</Text>
        </Box>
        <HStack>
          <Button leftIcon={<RepeatIcon />} variant="outline" onClick={fetchRecords}>Refresh</Button>
          <Button leftIcon={<DownloadIcon />} colorScheme="teal" variant="outline" onClick={handleExport}>Export Excel</Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={5}>
        <Box bg={panelBg} p={4} borderWidth="1px" borderRadius="md"><Text color="gray.500">Active Pool</Text><Heading size="md">{summary.active}</Heading></Box>
        <Box bg={panelBg} p={4} borderWidth="1px" borderRadius="md"><Text color="gray.500">Backup Candidates</Text><Heading size="md">{summary.backup}</Heading></Box>
        <Box bg={panelBg} p={4} borderWidth="1px" borderRadius="md"><Text color="gray.500">Departments</Text><Heading size="md">{summary.departments}</Heading></Box>
      </Grid>

      <Box as="form" onSubmit={handleSubmit} bg={panelBg} p={4} borderWidth="1px" borderRadius="md" mb={5}>
        <Flex justify="space-between" align="center" gap={3} wrap="wrap" mb={4}>
          <Heading size="md">{editingId ? 'Edit Candidate' : 'Add Candidate'}</Heading>
          <HStack>
            <Checkbox isChecked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)}>Replace departments on import</Checkbox>
            <Button as="label" colorScheme="purple" variant="outline" cursor="pointer">
              Import Excel
              <Input type="file" accept=".xlsx,.xls" display="none" onChange={handleImport} />
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={3}>
          <FormControl isRequired>
            <FormLabel>Department</FormLabel>
            <Select value={form.department} onChange={(e) => updateForm('department', e.target.value)}>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Type</FormLabel>
            <Select value={form.candidateType} onChange={(e) => updateForm('candidateType', e.target.value)}>
              <option value="active">Active Pool</option>
              <option value="backup">Backup Candidate</option>
            </Select>
          </FormControl>
          {!isBackup ? (
            <>
              <FormControl isRequired><FormLabel>Full Name</FormLabel><Input value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Position Applied For</FormLabel><Input value={form.positionAppliedFor} onChange={(e) => updateForm('positionAppliedFor', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Availability</FormLabel><Input value={form.availabilityToStart} onChange={(e) => updateForm('availabilityToStart', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Total Experience</FormLabel><Input value={form.totalExperience} onChange={(e) => updateForm('totalExperience', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Current Address</FormLabel><Input value={form.currentAddress} onChange={(e) => updateForm('currentAddress', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Source</FormLabel><Input value={form.source} onChange={(e) => updateForm('source', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Application Date</FormLabel><Input value={form.applicationDate} onChange={(e) => updateForm('applicationDate', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Current Stage</FormLabel><Input value={form.currentStage} onChange={(e) => updateForm('currentStage', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Interviewer</FormLabel><Input value={form.interviewer} onChange={(e) => updateForm('interviewer', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Phone</FormLabel><Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} /></FormControl>
            </>
          ) : (
            <>
              <FormControl isRequired><FormLabel>Position</FormLabel><Input value={form.position} onChange={(e) => updateForm('position', e.target.value)} /></FormControl>
              <FormControl isRequired><FormLabel>Backup Candidate</FormLabel><Input value={form.backupCandidate} onChange={(e) => updateForm('backupCandidate', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Internal/External</FormLabel><Input value={form.internalExternal} onChange={(e) => updateForm('internalExternal', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Readiness</FormLabel><Input value={form.readiness} onChange={(e) => updateForm('readiness', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Key Strengths</FormLabel><Input value={form.keyStrengths} onChange={(e) => updateForm('keyStrengths', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Development Needed</FormLabel><Input value={form.developmentNeeded} onChange={(e) => updateForm('developmentNeeded', e.target.value)} /></FormControl>
              <FormControl><FormLabel>Contact</FormLabel><Input value={form.contact} onChange={(e) => updateForm('contact', e.target.value)} /></FormControl>
            </>
          )}
          <FormControl gridColumn={{ base: 'auto', md: 'span 2' }}><FormLabel>Notes</FormLabel><Input value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} /></FormControl>
        </Grid>
        <HStack mt={4} justify="flex-end">
          <Button variant="outline" onClick={resetForm}>Clear</Button>
          <Button type="submit" colorScheme="teal" leftIcon={<AddIcon />}>{editingId ? 'Save Changes' : 'Add to Pool'}</Button>
        </HStack>
      </Box>

      <Box bg={panelBg} p={4} borderWidth="1px" borderRadius="md">
        <Flex gap={3} wrap="wrap" mb={4}>
          <Input placeholder="Search candidates" value={search} onChange={(e) => setSearch(e.target.value)} maxW="280px" />
          <Select placeholder="All departments" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} maxW="240px">
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </Select>
          <Select placeholder="All types" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} maxW="180px">
            <option value="active">Active Pool</option>
            <option value="backup">Backup Candidate</option>
          </Select>
        </Flex>

        {loading ? <Spinner /> : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Department</Th>
                  <Th>Type</Th>
                  <Th>Candidate</Th>
                  <Th>Position</Th>
                  <Th>Stage / Readiness</Th>
                  <Th>Phone / Contact</Th>
                  <Th>Notes</Th>
                  <Th>Hire / Reject</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visibleRecords.map((record) => (
                  <Tr key={record._id}>
                    <Td>{record.department}</Td>
                    <Td><Badge colorScheme={record.candidateType === 'backup' ? 'purple' : 'green'}>{record.candidateType === 'backup' ? 'Backup' : 'Active'}</Badge></Td>
                    <Td fontWeight="semibold">{record.candidateType === 'backup' ? record.backupCandidate : record.fullName}</Td>
                    <Td>{record.candidateType === 'backup' ? record.position : record.positionAppliedFor}</Td>
                    <Td>
                      <HStack spacing={2} wrap="wrap">
                        <Text>{record.candidateType === 'backup' ? record.readiness : record.currentStage}</Text>
                        {record.hiredStatus === 'hired' && <Badge colorScheme="blue">Hired</Badge>}
                      </HStack>
                    </Td>
                    <Td>{record.candidateType === 'backup' ? record.contact : record.phone}</Td>
                    <Td maxW="260px" whiteSpace="normal">{record.notes}</Td>
                    <Td>
                      {record.candidateType === 'backup' ? (
                        <Text color="gray.500" fontSize="sm">Backup</Text>
                      ) : record.hiredStatus === 'hired' ? (
                        <Badge colorScheme="green">Hired account</Badge>
                      ) : record.hiredStatus === 'rejected' ? (
                        <Badge colorScheme="red">Rejected</Badge>
                      ) : (
                        <HStack>
                          <Button size="sm" colorScheme="green" onClick={() => openHireModal(record)}>Hired</Button>
                          <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleRejectCandidate(record)}>Reject</Button>
                        </HStack>
                      )}
                    </Td>
                    <Td>
                      <HStack>
                        <IconButton icon={<EditIcon />} aria-label="Edit" size="sm" colorScheme="blue" onClick={() => handleEdit(record)} />
                        <IconButton icon={<DeleteIcon />} aria-label="Delete" size="sm" colorScheme="red" onClick={() => handleDelete(record)} />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {!visibleRecords.length && (
                  <Tr><Td colSpan={9}><Text textAlign="center" color="gray.500" py={6}>No candidates found.</Text></Td></Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
      <Modal isOpen={Boolean(hireCandidate)} onClose={closeHireModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Active Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontWeight="semibold">{hireCandidate?.fullName}</Text>
                <Text fontSize="sm" color="gray.500">{hireCandidate?.positionAppliedFor || 'No position'} - {hireCandidate?.currentStage || 'Completed'}</Text>
              </Box>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={hireForm.email} onChange={(e) => setHireForm((current) => ({ ...current, email: e.target.value }))} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <HStack>
                  <Input value={hireForm.password} onChange={(e) => setHireForm((current) => ({ ...current, password: e.target.value }))} />
                  <Button variant="outline" onClick={() => setHireForm((current) => ({ ...current, password: generatePassword() }))}>Generate</Button>
                </HStack>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select value={hireForm.role} onChange={(e) => setHireForm((current) => ({ ...current, role: e.target.value }))}>
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeHireModal} isDisabled={creatingAccount}>Cancel</Button>
            <Button colorScheme="green" onClick={handleCreateAccount} isLoading={creatingAccount}>Create Active Account</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CandidatePoolPage;


















