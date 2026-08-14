import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertDescription, AlertIcon, AlertTitle, Badge, Box, Button, Card, CardBody,
  Flex, FormControl, FormLabel, Grid, Heading, Input, Select, SimpleGrid, Spinner,
  Stat, StatLabel, StatNumber, Table, Tbody, Td, Text, Th, Thead, Tr, useToast,
} from '@chakra-ui/react';
import { FiActivity, FiClock, FiLink2, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';

const formatDateTime = (value) => value
  ? new window.Intl.DateTimeFormat('en-ET', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Addis_Ababa' }).format(new Date(value))
  : 'Not available';

const formatTime = (value) => value
  ? new window.Intl.DateTimeFormat('en-ET', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Addis_Ababa' }).format(new Date(value))
  : '—';

const statusScheme = (value = '') => {
  const normalized = value.toLowerCase();
  if (normalized.includes('early comer') || normalized.includes('complete')) return 'green';
  if (normalized.includes('late') || normalized.includes('missing') || normalized.includes('not punched')) return 'orange';
  return 'gray';
};

function SummaryCard({ label, value, helper, icon: Icon }) {
  return (
    <Card border="1px solid" borderColor="gray.200" boxShadow="sm">
      <CardBody>
        <Flex justify="space-between" align="start">
          <Stat><StatLabel color="gray.600">{label}</StatLabel><StatNumber color="gray.800">{value}</StatNumber><Text fontSize="sm" color="gray.500">{helper}</Text></Stat>
          <Box p={3} borderRadius="xl" bg="teal.50" color="teal.700"><Icon size={22} /></Box>
        </Flex>
      </CardBody>
    </Card>
  );
}

export default function AttendancePage() {
  const toast = useToast();
  const [tab, setTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({});
  const [employees, setEmployees] = useState([]);
  const [mappingSummary, setMappingSummary] = useState({});
  const [terminalEmployees, setTerminalEmployees] = useState([]);
  const [directoryAvailable, setDirectoryAvailable] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [punchId, setPunchId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    const [attendanceResult, statusResult, mappingsResult] = await Promise.allSettled([
      axiosInstance.get('/attendance-integration/today'),
      axiosInstance.get('/attendance-integration/connector-status'),
      axiosInstance.get('/attendance-integration/mappings'),
    ]);

    if (attendanceResult.status === 'fulfilled') {
      setAttendance(attendanceResult.value.data.attendance || []);
      setSummary(attendanceResult.value.data.summary || {});
    } else {
      toast({ title: 'Attendance could not be loaded', description: attendanceResult.reason.response?.data?.message || 'Check the Puncher API configuration.', status: 'error', duration: 6000 });
    }
    if (statusResult.status === 'fulfilled') setStatus(statusResult.value.data);
    else setStatus({ online: false, error: statusResult.reason.response?.data?.message || 'Connector status is unavailable.' });
    if (mappingsResult.status === 'fulfilled') {
      setEmployees(mappingsResult.value.data.employees || []);
      setMappingSummary(mappingsResult.value.data.summary || {});
      setTerminalEmployees(mappingsResult.value.data.terminalEmployees || []);
      setDirectoryAvailable(mappingsResult.value.data.directoryAvailable !== false);
    } else {
      toast({ title: 'Employee mappings could not be loaded', status: 'error', duration: 5000 });
    }
    setLoading(false);
    setRefreshing(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filteredAttendance = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return attendance;
    return attendance.filter((row) => [row.employee?.name, row.employee?.email, row.employeeId, row.employeeName]
      .some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [attendance, search]);

  const selected = employees.find((employee) => employee._id === selectedEmployee);

  const selectEmployee = (id) => {
    setSelectedEmployee(id);
    setPunchId(employees.find((employee) => employee._id === id)?.punchId || '');
  };

  const saveMapping = async () => {
    if (!selectedEmployee) return toast({ title: 'Select an employee first', status: 'warning' });
    setSaving(true);
    try {
      const { data } = await axiosInstance.patch(`/attendance-integration/mappings/${selectedEmployee}`, { punchId: punchId.trim() });
      toast({ title: 'Punch ID updated', description: data.message, status: 'success' });
      await load(true);
    } catch (error) {
      toast({ title: 'Punch ID could not be saved', description: error.response?.data?.message || error.message, status: 'error', duration: 6000 });
    } finally { setSaving(false); }
  };

  return (
    <Box maxW="1600px" mx="auto" px={{ base: 4, xl: 8 }} py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={5} mb={7}>
        <Box>
          <Text color="teal.700" fontWeight="800" letterSpacing="wide" fontSize="sm">HR WORKSPACE / ATTENDANCE</Text>
          <Heading size="xl" color="gray.900">Employee Attendance</Heading>
          <Text color="gray.600" mt={2}>Live attendance is matched to TradeEthiopia employees through the Punch ID assigned by HR.</Text>
        </Box>
        <Button leftIcon={<FiRefreshCw />} variant="outline" colorScheme="teal" isLoading={refreshing} onClick={() => load(true)}>Refresh data</Button>
      </Flex>

      {status && !status.online && (
        <Alert status="warning" borderRadius="xl" mb={6} alignItems="start">
          <AlertIcon mt={1} /><Box><AlertTitle>Office attendance connector is offline</AlertTitle>
            <AlertDescription>{status.error || `Previously synchronized data remains available. Last successful synchronization: ${formatDateTime(status.latestSuccessfulSyncAt)}.`}</AlertDescription></Box>
        </Alert>
      )}
      {status?.online && (
        <Alert status="success" variant="subtle" borderRadius="xl" mb={6}><AlertIcon /><AlertTitle>Office connector online</AlertTitle><AlertDescription ml={2}>Last synchronized {formatDateTime(status.latestSuccessfulSyncAt)}</AlertDescription></Alert>
      )}

      <Flex gap={2} mb={6} borderBottom="1px solid" borderColor="gray.200">
        <Button borderRadius="lg" colorScheme="teal" variant={tab === 'attendance' ? 'solid' : 'ghost'} onClick={() => setTab('attendance')}>Today&apos;s attendance</Button>
        <Button borderRadius="lg" colorScheme="teal" variant={tab === 'mappings' ? 'solid' : 'ghost'} onClick={() => setTab('mappings')}>Punch ID assignments</Button>
      </Flex>

      {loading ? <Flex minH="360px" align="center" justify="center"><Spinner size="xl" color="teal.500" /></Flex> : tab === 'attendance' ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} mb={6}>
            <SummaryCard label="Attendance records" value={summary.employees || attendance.length} helper="Employees recorded today" icon={FiUsers} />
            <SummaryCard label="Checked out" value={summary.checkedOut || 0} helper="Completed workday punches" icon={FiClock} />
            <SummaryCard label="Late arrivals" value={summary.lateComers || 0} helper="Based on Puncher work policy" icon={FiActivity} />
            <SummaryCard label="Unmatched Punch IDs" value={summary.unmatched || 0} helper="Require HR assignment" icon={FiLink2} />
          </SimpleGrid>

          <Card border="1px solid" borderColor="gray.200" boxShadow="sm">
            <CardBody p={0}>
              <Flex p={5} gap={4} align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} justify="space-between">
                <Box><Heading size="md">Today&apos;s employee records</Heading><Text color="gray.500" fontSize="sm">Only mapped records are payroll-ready; unmatched records remain visible for correction.</Text></Box>
                <Box position="relative" minW={{ md: '340px' }}><Box position="absolute" left={3} top={3} color="gray.400"><FiSearch /></Box><Input pl={10} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or Punch ID" /></Box>
              </Flex>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg="gray.50"><Tr><Th>Employee</Th><Th>Punch ID</Th><Th>Check in</Th><Th>Arrival</Th><Th>Lunch</Th><Th>Check out</Th><Th>Departure</Th><Th isNumeric>Worked</Th></Tr></Thead>
                  <Tbody>
                    {filteredAttendance.map((row) => (
                      <Tr key={`${row.employeeId}-${row.checkIn}`} bg={row.identityMismatch ? 'red.50' : !row.matched ? 'orange.50' : 'white'}>
                        <Td><Text fontWeight="700">{row.employee?.name || row.employeeName}</Text><Text fontSize="xs" color={row.identityMismatch ? 'red.600' : 'gray.500'}>{row.identityMismatch ? `ID mismatch — Puncher identifies this as ${row.employeeName}` : row.employee?.email || 'Not matched to TradeEthiopia'}</Text></Td>
                        <Td><Badge colorScheme={row.matched ? 'teal' : 'orange'}>{row.employeeId}</Badge></Td>
                        <Td whiteSpace="nowrap">{formatTime(row.checkIn)}</Td>
                        <Td><Badge colorScheme={statusScheme(row.arrivalStatus)}>{row.arrivalStatus}</Badge></Td>
                        <Td whiteSpace="nowrap">{formatTime(row.lunchOut)} – {formatTime(row.lunchIn)}</Td>
                        <Td whiteSpace="nowrap">{formatTime(row.checkOut)}</Td>
                        <Td><Badge colorScheme={statusScheme(row.departureStatus)}>{row.departureStatus}</Badge></Td>
                        <Td isNumeric>{row.workedHours == null ? '—' : `${Number(row.workedHours).toFixed(2)} h`}</Td>
                      </Tr>
                    ))}
                    {!filteredAttendance.length && <Tr><Td colSpan={8} textAlign="center" py={12} color="gray.500">No attendance records match the current search.</Td></Tr>}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </>
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'minmax(320px, 430px) 1fr' }} gap={6}>
          <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody>
            <Heading size="md">Assign Punch ID</Heading>
            <Text color="gray.600" mt={2} mb={6}>Select an employee and enter the exact identifier shown by the Puncher terminal.</Text>
            <FormControl mb={4}><FormLabel>TradeEthiopia employee</FormLabel><Select value={selectedEmployee} onChange={(event) => selectEmployee(event.target.value)} placeholder="Select employee">
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.displayName} — {employee.email}</option>)}
            </Select></FormControl>
            <FormControl><FormLabel>Puncher employee</FormLabel><Select value={punchId} onChange={(event) => setPunchId(event.target.value)} placeholder={directoryAvailable ? 'Select name and ID from Puncher' : 'Puncher directory is currently unavailable'} isDisabled={!directoryAvailable}>
              {terminalEmployees.map((employee) => <option key={employee.punchId} value={employee.punchId}>{employee.name} — ID {employee.punchId}</option>)}
            </Select><Text fontSize="sm" color="gray.500" mt={2}>Assignments are restricted to identities returned by the Puncher directory.</Text></FormControl>
            {selected && <Box mt={5} p={4} bg="gray.50" borderRadius="lg"><Text fontWeight="700">TradeEthiopia account</Text><Text mt={1}>{selected.displayName}</Text><Text fontSize="sm" color="gray.600">{selected.email}</Text><Text fontSize="sm" mt={3}>Confirmed Puncher identity: <b>{selected.punchEmployeeName ? `${selected.punchEmployeeName} — ID ${selected.punchId}` : 'Not assigned'}</b></Text></Box>}
            <Button mt={6} w="full" colorScheme="teal" isLoading={saving} onClick={saveMapping}>Save Punch ID</Button>
          </CardBody></Card>

          <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody p={0}>
            <Box p={5}><Heading size="md">Employee mapping register</Heading><Text color="gray.500" fontSize="sm">{mappingSummary.mapped || 0} mapped · {mappingSummary.unmapped || 0} awaiting assignment</Text></Box>
            <Box overflowX="auto"><Table><Thead bg="gray.50"><Tr><Th>Employee</Th><Th>Department / role</Th><Th>Punch ID</Th><Th>Status</Th></Tr></Thead><Tbody>
              {employees.map((employee) => <Tr key={employee._id} cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => selectEmployee(employee._id)}><Td><Text fontWeight="700">{employee.displayName}</Text><Text fontSize="xs" color="gray.500">{employee.email}</Text></Td><Td>{employee.jobTitle || employee.role}</Td><Td><Badge colorScheme={employee.punchId ? 'teal' : 'orange'}>{employee.punchId || 'Not assigned'}</Badge>{employee.punchEmployeeName && <Text fontSize="xs" color="gray.500" mt={1}>{employee.punchEmployeeName}</Text>}</Td><Td><Badge colorScheme={employee.status === 'active' ? 'green' : 'gray'}>{employee.status}</Badge></Td></Tr>)}
            </Tbody></Table></Box>
          </CardBody></Card>
        </Grid>
      )}
    </Box>
  );
}
