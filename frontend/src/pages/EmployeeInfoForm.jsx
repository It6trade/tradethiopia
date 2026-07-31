import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, Divider, Flex, FormControl,
  FormLabel, Grid, Heading, HStack, Icon, IconButton, Image, Input, Select,
  SimpleGrid, Skeleton, Stack, Text, Textarea, Tooltip, useToast,
} from '@chakra-ui/react';
import { FiCheck, FiChevronLeft, FiFileText, FiPlus, FiPrinter, FiSave, FiSend, FiShield, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';

const emptyRecord = () => ({
  dateOfBirth: '',
  nationality: '',
  maritalStatus: '',
  nationalIdOrPassport: '',
  placeOfBirth: { city: '', region: '', kebele: '' },
  presentAddress: { region: '', cityOrTown: '', subCityOrWoreda: '', kebele: '', houseNumber: '' },
  tinNumber: '',
  salaryBankAccountNumber: '',
  educationRecords: [{ level: '', institution: '', fieldOfStudy: '', graduationYear: '' }],
  emergencyContact: { fullName: '', relationship: '', phone: '', alternativePhone: '', address: '' },
  documentChecklist: {
    nationalId: false, cv: false, medicalCertificate: false, employmentContract: false,
    educationalCredentials: false, passportPhoto: false, policeClearance: false, bankAccountDetails: false,
  },
  declarationAccepted: false,
  status: 'draft',
  submittedAt: null,
  hrDecision: { decision: '', note: '', decidedAt: null, decidedBy: null },
  history: [],
});

const CHECKLIST = [
  ['nationalId', 'Copy of National ID / Passport'],
  ['educationalCredentials', 'Educational Certificates / Credentials'],
  ['cv', 'Curriculum Vitae (CV) / Resume'],
  ['passportPhoto', 'Recent Passport-Size Photograph'],
  ['medicalCertificate', 'Medical Certificate / Fitness Report'],
  ['policeClearance', 'Certificate of Good Conduct / Police Clearance'],
  ['employmentContract', 'Signed Employment Contract / Offer Letter'],
  ['bankAccountDetails', 'Bank Account Details'],
];

const statusColor = { draft: 'gray', submitted: 'orange', approved: 'green', returned: 'red' };
const dateValue = (value) => value ? String(value).slice(0, 10) : '';
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Not recorded';

const SectionHeading = ({ code, title }) => (
  <Flex className="paper-section-heading" align="center" gap={2}>
    <Text fontSize="xs" fontWeight="800" letterSpacing="0.12em">SECTION {code} — {title}</Text>
  </Flex>
);

const Field = ({ label, required, helper, owner = 'employee', children }) => {
  const value = children?.props?.value;
  const text = String(value ?? '').trim().toLowerCase();
  const completed = text !== '' && text !== 'not provided' && text !== 'assigned by hr';
  return (
  <FormControl isRequired={required}>
    <Flex align="center" justify="space-between" gap={2} mb={1.5}>
      <FormLabel fontSize="sm" fontWeight="700" color="gray.700" mb={0}>{label}</FormLabel>
      <HStack spacing={1}>
        <Badge className="field-status-badge" colorScheme={completed ? 'green' : 'orange'} variant="subtle" borderRadius="full" fontSize="9px">
          {completed ? 'Completed' : 'Missing'}
        </Badge>
        <Badge
          className="field-owner-badge"
          colorScheme={owner === 'hr' ? 'blue' : 'teal'}
          variant="subtle"
          borderRadius="full"
          fontSize="9px"
        >
          {owner === 'hr' ? 'Set by HR' : 'Employee'}
        </Badge>
      </HStack>
    </Flex>
    {children}
    {helper && <Text mt={1.5} fontSize="xs" color="gray.500">{helper}</Text>}
  </FormControl>
  );
};

const EmployeeInfoForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const currentUser = useUserStore((state) => state.currentUser);
  const isHr = ['hr', 'admin'].includes(normalizeRole(currentUser?.role));
  const employeeId = params.get('employeeId');
  const hrView = isHr && Boolean(employeeId) && employeeId !== currentUser?._id;
  const endpoint = hrView ? `/users/${employeeId}/personal-information` : '/users/personal-information/me';
  const [record, setRecord] = useState(emptyRecord);
  const [employee, setEmployee] = useState({});
  const [profile, setProfile] = useState({
    fullName: '', phone: '', altEmail: '', gender: '', location: '', education: '',
  });
  const [linkedChecklist, setLinkedChecklist] = useState({});
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  // HR reviews a read-only employee record. For the employee, only final HR
  // approval locks the form; submitted and returned records remain editable.
  const locked = hrView || record.status === 'approved';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(endpoint);
      const incoming = data.data?.record || {};
      setEmployee(data.data?.user || {});
      setProfile({
        fullName: data.data?.user?.fullName || '',
        phone: data.data?.user?.phone || '',
        altEmail: data.data?.user?.altEmail || '',
        gender: data.data?.user?.gender || '',
        location: data.data?.user?.location || '',
        education: data.data?.user?.education || '',
      });
      setLinkedChecklist(data.data?.linkedChecklist || {});
      setDocuments(data.data?.documents || []);
      setRecord({
        ...emptyRecord(),
        ...incoming,
        dateOfBirth: dateValue(incoming.dateOfBirth),
        placeOfBirth: { ...emptyRecord().placeOfBirth, ...(incoming.placeOfBirth || {}) },
        presentAddress: { ...emptyRecord().presentAddress, ...(incoming.presentAddress || {}) },
        emergencyContact: { ...emptyRecord().emergencyContact, ...(incoming.emergencyContact || {}) },
        documentChecklist: { ...emptyRecord().documentChecklist, ...(incoming.documentChecklist || {}) },
        educationRecords: incoming.educationRecords?.length ? incoming.educationRecords : emptyRecord().educationRecords,
      });
      setDecisionNote(incoming.hrDecision?.note || '');
    } catch (error) {
      toast({ title: 'Employee form could not be loaded', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [endpoint, toast]);

  useEffect(() => { load(); }, [load]);

  const setValue = (key, value) => setRecord((previous) => ({ ...previous, [key]: value }));
  const setNested = (group, key, value) => setRecord((previous) => ({
    ...previous, [group]: { ...previous[group], [key]: value },
  }));
  const setEducation = (index, key, value) => setRecord((previous) => ({
    ...previous,
    educationRecords: previous.educationRecords.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
  }));

  const payload = useMemo(() => ({
    profile,
    dateOfBirth: record.dateOfBirth || null,
    nationality: record.nationality,
    maritalStatus: record.maritalStatus,
    nationalIdOrPassport: record.nationalIdOrPassport,
    placeOfBirth: record.placeOfBirth,
    presentAddress: record.presentAddress,
    tinNumber: record.tinNumber,
    salaryBankAccountNumber: record.salaryBankAccountNumber,
    educationRecords: record.educationRecords,
    emergencyContact: record.emergencyContact,
    documentChecklist: record.documentChecklist,
    declarationAccepted: record.declarationAccepted,
  }), [profile, record]);

  const save = async (submit = false) => {
    setWorking(true);
    try {
      const url = submit ? '/users/personal-information/me/submit' : '/users/personal-information/me';
      const method = submit ? 'post' : 'patch';
      const { data } = await axiosInstance[method](url, payload);
      toast({ title: data.message, status: 'success' });
      await load();
    } catch (error) {
      toast({ title: submit ? 'Form could not be submitted' : 'Draft could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setWorking(false);
    }
  };

  const SectionAction = ({ section, description }) => !locked && (
    <Flex className="screen-only section-action" mt={5} justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3}>
      <Box>
        <Text fontSize="sm" fontWeight="700">{section}</Text>
        <Text fontSize="xs" color="gray.500">{description}</Text>
      </Box>
      <Button leftIcon={<FiSave />} colorScheme="teal" variant="outline" isLoading={working} onClick={() => save(false)}>
        Save {section}
      </Button>
    </Flex>
  );

  const decide = async (decision) => {
    setWorking(true);
    try {
      const { data } = await axiosInstance.patch(`/users/${employeeId}/personal-information/decision`, { decision, note: decisionNote.trim() });
      toast({ title: data.message, status: 'success' });
      await load();
    } catch (error) {
      toast({ title: 'HR decision could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <Stack maxW="1180px" mx="auto" spacing={5}><Skeleton h="130px" /><Skeleton h="700px" /></Stack>;
  }

  return (
    <Box maxW="1180px" mx="auto">
      <Flex className="screen-toolbar" mb={4} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
        <HStack>
          <Tooltip label="Go back"><IconButton aria-label="Go back" icon={<FiChevronLeft />} variant="ghost" onClick={() => navigate(-1)} /></Tooltip>
          <Box>
            <Heading size="md">New Employee Personal Information</Heading>
            <Text fontSize="sm" color="gray.500">A confidential employee record reviewed by Human Resources.</Text>
          </Box>
        </HStack>
        <HStack flexWrap="wrap">
          <Badge colorScheme={statusColor[record.status] || 'gray'} px={3} py={1.5} borderRadius="full" textTransform="capitalize">{record.status}</Badge>
          <Button leftIcon={<FiPrinter />} variant="outline" onClick={() => window.print()}>Print form</Button>
          {!locked && <Button leftIcon={<FiSave />} variant="outline" colorScheme="teal" isLoading={working} onClick={() => save(false)}>Save draft</Button>}
          {!locked && <Button leftIcon={<FiSend />} colorScheme="teal" isLoading={working} onClick={() => save(true)}>Submit to HR</Button>}
        </HStack>
      </Flex>

      {record.status === 'returned' && (
        <Alert status="warning" mb={4} borderRadius="xl" className="screen-only">
          <AlertIcon /><Box><Text fontWeight="700">HR requires corrections</Text><Text fontSize="sm">{record.hrDecision?.note || 'Review the information and submit it again.'}</Text></Box>
        </Alert>
      )}
      {record.status === 'draft' && record.hrDecision?.decision === 'returned' && (
        <Alert status="warning" mb={4} borderRadius="xl" className="screen-only">
          <AlertIcon /><Box><Text fontWeight="700">Corrections are in progress</Text><Text fontSize="sm">HR requested: {record.hrDecision?.note}. Complete the changes, then use <b>Submit to HR</b> to return the corrected form for approval.</Text></Box>
        </Alert>
      )}
      {record.status === 'submitted' && (
        <Alert status="info" mb={4} borderRadius="xl" className="screen-only">
          <AlertIcon /><Box><Text fontWeight="700">Submitted for HR verification</Text><Text fontSize="sm">The form remains editable until HR approves it. Save and resubmit any changes; you will receive a notification when HR approves it or requests corrections.</Text></Box>
        </Alert>
      )}
      {record.status === 'approved' && (
        <Alert status="success" mb={4} borderRadius="xl" className="screen-only">
          <AlertIcon />
          <Flex flex="1" justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
            <Box><Text fontWeight="700">Verified and approved by HR</Text><Text fontSize="sm">Approved by {record.hrDecision?.decidedBy?.fullName || record.hrDecision?.decidedBy?.username || 'HR'} on {formatDate(record.hrDecision?.decidedAt)}. The approved form is now locked.</Text></Box>
            {!hrView && employee.status === 'inactive' && (
              <Button colorScheme="green" size="sm" flexShrink={0} onClick={() => navigate('/secondpage')}>Continue onboarding</Button>
            )}
          </Flex>
        </Alert>
      )}

      <Box className="employee-paper">
        <Box className="paper-page paper-page-one">
          <Flex className="paper-header" direction="column" align="center">
            <Image
              src="/brand/tradethiopia-logo.png"
              alt="Trade Ethiopia Group"
              className="company-logo"
              fallback={<Box h="55px"><Heading size="md" color="#294f73">TradeEthiopia Group</Heading></Box>}
            />
            <Heading mt={2} size="md" textAlign="center" letterSpacing="0.04em">NEW EMPLOYEE PERSONAL INFORMATION FORM</Heading>
            <Text mt={1} fontSize="xs" color="gray.500">To be completed by the new employee and verified by the HR Department upon hire.</Text>
          </Flex>

          <SectionHeading code="A" title="PERSONAL INFORMATION" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} className="paper-grid">
            <Field label="Full Name" required><Input value={profile.fullName} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, fullName: e.target.value }))} /></Field>
            <Field label="Date of Birth" required><Input type="date" value={record.dateOfBirth} isReadOnly={locked} onChange={(e) => setValue('dateOfBirth', e.target.value)} /></Field>
            <Field label="Gender">
              <Select value={profile.gender} isDisabled={locked} onChange={(e) => setProfile((previous) => ({ ...previous, gender: e.target.value }))} placeholder="Select gender">
                <option value="female">Female</option><option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Nationality" required><Input value={record.nationality} isReadOnly={locked} onChange={(e) => setValue('nationality', e.target.value)} /></Field>
            <Field label="National ID / Passport No." required><Input value={record.nationalIdOrPassport} isReadOnly={locked} onChange={(e) => setValue('nationalIdOrPassport', e.target.value)} /></Field>
            <Field label="Marital Status" required>
              <Select value={record.maritalStatus} isDisabled={locked} onChange={(e) => setValue('maritalStatus', e.target.value)} placeholder="Select status">
                <option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option>
              </Select>
            </Field>
            <Field label="Phone Number" required><Input value={profile.phone} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, phone: e.target.value }))} /></Field>
            <Field label="Personal Email Address"><Input type="email" value={profile.altEmail} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, altEmail: e.target.value }))} /></Field>
            <Field label="Employee ID" owner="hr" helper="The unique employee number is assigned and maintained by HR."><Input value={employee.digitalId || 'Assigned by HR'} isReadOnly /></Field>
          </SimpleGrid>

          <Text className="paper-subheading">PLACE OF BIRTH</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Place / City"><Input value={record.placeOfBirth.city} isReadOnly={locked} onChange={(e) => setNested('placeOfBirth', 'city', e.target.value)} /></Field>
            <Field label="Region"><Input value={record.placeOfBirth.region} isReadOnly={locked} onChange={(e) => setNested('placeOfBirth', 'region', e.target.value)} /></Field>
            <Field label="Kebele"><Input value={record.placeOfBirth.kebele} isReadOnly={locked} onChange={(e) => setNested('placeOfBirth', 'kebele', e.target.value)} /></Field>
          </SimpleGrid>

          <Text className="paper-subheading">PRESENT ADDRESS</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Region"><Input value={record.presentAddress.region} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'region', e.target.value)} /></Field>
            <Field label="City / Town"><Input value={record.presentAddress.cityOrTown} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'cityOrTown', e.target.value)} /></Field>
            <Field label="Sub-City / Woreda"><Input value={record.presentAddress.subCityOrWoreda} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'subCityOrWoreda', e.target.value)} /></Field>
            <Field label="Kebele"><Input value={record.presentAddress.kebele} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'kebele', e.target.value)} /></Field>
            <Field label="House Number"><Input value={record.presentAddress.houseNumber} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'houseNumber', e.target.value)} /></Field>
            <Field label="Address Summary"><Input value={profile.location} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, location: e.target.value }))} /></Field>
          </SimpleGrid>
          <SectionAction section="Section A" description="Save personal, birthplace, and present-address information as a draft." />

          <SectionHeading code="B" title="EMPLOYMENT DETAILS" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Job Title / Position" owner="hr"><Input value={employee.jobTitle || 'Not provided'} isReadOnly /></Field>
            <Field label="Department" owner="hr"><Input value={employee.role || 'Not provided'} isReadOnly /></Field>
            <Field label="Hiring Date" owner="hr"><Input value={dateValue(employee.hireDate)} type="date" isReadOnly /></Field>
            <Field label="Employment Type" owner="hr"><Input value={employee.employmentType || 'Not provided'} isReadOnly /></Field>
            <Field label="Basic Pay (Birr)" owner="hr"><Input value={employee.salary ?? 'Not provided'} isReadOnly /></Field>
            <Field label="TIN Number" helper="Provide the TIN registered for payroll processing."><Input value={record.tinNumber} isReadOnly={locked} onChange={(e) => setValue('tinNumber', e.target.value)} /></Field>
            <Field label="Salary Bank Account Number" helper="Provide the account designated to receive salary payments."><Input value={record.salaryBankAccountNumber} isReadOnly={locked} onChange={(e) => setValue('salaryBankAccountNumber', e.target.value)} /></Field>
          </SimpleGrid>
          <SectionAction section="Section B" description="Save employee-provided payroll identifiers. HR employment fields remain protected." />

          <SectionHeading code="C" title="EDUCATIONAL BACKGROUND" />
          <Box mb={4}>
            <Field label="Education Summary" helper="This updates the employee’s existing profile summary while the detailed rows below remain part of this form.">
              <Input value={profile.education} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, education: e.target.value }))} placeholder="Example: BA Degree in Marketing" />
            </Field>
          </Box>
          <Stack spacing={3}>
            {record.educationRecords.map((item, index) => (
              <Grid key={index} templateColumns={{ base: '1fr', md: '1fr 1.4fr 1.3fr 0.7fr auto' }} gap={3} alignItems="end">
                <Field label="Level of Education"><Input value={item.level} isReadOnly={locked} onChange={(e) => setEducation(index, 'level', e.target.value)} /></Field>
                <Field label="Institution Name"><Input value={item.institution} isReadOnly={locked} onChange={(e) => setEducation(index, 'institution', e.target.value)} /></Field>
                <Field label="Field of Study"><Input value={item.fieldOfStudy} isReadOnly={locked} onChange={(e) => setEducation(index, 'fieldOfStudy', e.target.value)} /></Field>
                <Field label="Year"><Input value={item.graduationYear} isReadOnly={locked} onChange={(e) => setEducation(index, 'graduationYear', e.target.value)} /></Field>
                {!locked && record.educationRecords.length > 1 && <IconButton mb="1px" aria-label="Remove education" icon={<FiTrash2 />} colorScheme="red" variant="ghost" onClick={() => setValue('educationRecords', record.educationRecords.filter((_, i) => i !== index))} />}
              </Grid>
            ))}
            {!locked && <Button className="screen-only" alignSelf="flex-start" size="sm" variant="outline" leftIcon={<FiPlus />} onClick={() => setValue('educationRecords', [...record.educationRecords, { level: '', institution: '', fieldOfStudy: '', graduationYear: '' }])}>Add education</Button>}
          </Stack>
          <SectionAction section="Section C" description="Save the education summary and detailed qualification records." />
          <Text className="paper-footer">Confidential — For Internal HR Use Only <span>Page 1</span></Text>
        </Box>

        <Box className="paper-page paper-page-two">
          <Flex className="paper-header compact" direction="column" align="center">
            <Image src="/brand/tradethiopia-logo.png" alt="Trade Ethiopia Group" className="company-logo" fallback={<Heading size="sm" color="#294f73">TradeEthiopia Group</Heading>} />
          </Flex>
          <SectionHeading code="D" title="EMERGENCY CONTACT INFORMATION" />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Field label="Full Name" required><Input value={record.emergencyContact.fullName} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'fullName', e.target.value)} /></Field>
            <Field label="Relationship to Employee"><Input value={record.emergencyContact.relationship} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'relationship', e.target.value)} /></Field>
            <Field label="Phone Number" required><Input value={record.emergencyContact.phone} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'phone', e.target.value)} /></Field>
            <Field label="Alternative Phone Number"><Input value={record.emergencyContact.alternativePhone} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'alternativePhone', e.target.value)} /></Field>
            <Box gridColumn={{ md: '1 / -1' }}><Field label="Address"><Textarea value={record.emergencyContact.address} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'address', e.target.value)} /></Field></Box>
          </SimpleGrid>
          <SectionAction section="Section D" description="Save the employee’s emergency contact information." />

          <SectionHeading code="E" title="ATTACHED DOCUMENTS CHECKLIST" />
          <Text fontSize="sm" color="gray.600" mb={4}>Checked items may be employee-confirmed or automatically verified from the existing Employee Documents repository.</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {CHECKLIST.map(([key, label]) => {
              const linked = Boolean(linkedChecklist[key]);
              const checked = linked || Boolean(record.documentChecklist[key]);
              return (
                <Flex key={key} p={3} border="1px solid" borderColor={linked ? 'teal.200' : 'gray.200'} borderRadius="lg" justify="space-between" align="center">
                  <Checkbox isChecked={checked} isDisabled={locked || linked} onChange={(e) => setNested('documentChecklist', key, e.target.checked)}>{label}</Checkbox>
                  {linked
                    ? <Badge colorScheme="teal">Repository verified</Badge>
                    : checked && <Badge colorScheme="green">Employee confirmed</Badge>}
                </Flex>
              );
            })}
          </SimpleGrid>
          {documents.length > 0 && (
            <Alert status="info" mt={4} borderRadius="lg" className="screen-only">
              <AlertIcon /><Text fontSize="sm">{documents.length} related employee document{documents.length === 1 ? '' : 's'} found in the repository.</Text>
            </Alert>
          )}
          {!locked && (
            <Flex className="screen-only" mt={4} gap={3} justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }}>
              <Text fontSize="xs" color="gray.500">Select documents already provided. Repository-linked documents are verified automatically and cannot be unchecked.</Text>
              <HStack>
                <Button variant="ghost" colorScheme="teal" onClick={() => navigate('/employee-file-upload')}>Upload documents</Button>
                <Button leftIcon={<FiSave />} colorScheme="teal" variant="outline" isLoading={working} onClick={() => save(false)}>Save Section E</Button>
              </HStack>
            </Flex>
          )}

          <SectionHeading code="" title="DECLARATION" />
          <Box p={5} border="1px solid" borderColor="gray.200" borderRadius="xl" bg="gray.50">
            <Text fontSize="sm" lineHeight="1.8">
              I confirm that the information provided in this form is true, complete, and accurate to the best of my knowledge.
              I understand that false or misleading information may result in disciplinary action, up to and including termination
              of employment, in accordance with TradeEthiopia’s policies.
            </Text>
            <Checkbox mt={4} isChecked={record.declarationAccepted} isDisabled={locked} onChange={(e) => setValue('declarationAccepted', e.target.checked)}>
              I have reviewed this record and accept the declaration.
            </Checkbox>
          </Box>
          <SectionAction section="Declaration" description="Save the declaration confirmation before submitting the complete form to HR." />

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={10}>
            <Box className="signature-line">
              <Text fontWeight="700">{profile.fullName || employee.username || 'Employee'}</Text>
              <Text fontSize="xs" color="gray.500">Employee confirmation • {formatDate(record.submittedAt)}</Text>
            </Box>
            <Box className="signature-line">
              <Text fontWeight="700">{record.hrDecision?.decidedBy?.fullName || record.hrDecision?.decidedBy?.username || 'Awaiting HR verification'}</Text>
              <Text fontSize="xs" color="gray.500">HR Officer verification • {formatDate(record.hrDecision?.decidedAt)}</Text>
            </Box>
          </SimpleGrid>

          {hrView && ['submitted', 'returned'].includes(record.status) && (
            <Box mt={8} p={5} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="xl" className="screen-only">
              <HStack mb={3}><Icon as={FiShield} color="blue.600" /><Heading size="sm">HR verification decision</Heading></HStack>
              {record.status === 'returned' && (
                <Alert status="warning" mb={4} borderRadius="lg">
                  <AlertIcon /><Text fontSize="sm">The form is currently with the employee for correction. HR may send updated correction instructions, but approval requires a new employee submission.</Text>
                </Alert>
              )}
              <Textarea bg="white" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Optional approval note or required correction instructions" />
              <HStack mt={4} justify="flex-end">
                <Button variant="outline" colorScheme="red" isLoading={working} onClick={() => decide('returned')}>
                  {record.status === 'returned' ? 'Send updated correction request' : 'Return for correction'}
                </Button>
                {record.status === 'submitted' && (
                  <Button leftIcon={<FiCheck />} colorScheme="teal" isLoading={working} onClick={() => decide('approved')}>Approve employee record</Button>
                )}
              </HStack>
            </Box>
          )}

          <Divider my={6} />
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <HStack><Icon as={FiFileText} color="teal.600" /><Text fontSize="sm">Record status: <b>{record.status}</b></Text></HStack>
            {record.hrDecision?.note && <Text fontSize="sm" color="gray.600">HR note: {record.hrDecision.note}</Text>}
          </Flex>
          <Text className="paper-footer">Confidential — For Internal HR Use Only <span>Page 2</span></Text>
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeInfoForm;
