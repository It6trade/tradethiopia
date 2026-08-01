import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, Divider, Flex, FormControl,
  FormErrorMessage, FormLabel, Grid, Heading, HStack, Icon, IconButton, Image, Input, Select,
  SimpleGrid, Skeleton, Stack, Text, Textarea, Tooltip, useToast,
} from '@chakra-ui/react';
import { FiCheck, FiChevronLeft, FiFileText, FiPlus, FiPrinter, FiSave, FiSend, FiShield, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';
import { ETHIOPIAN_REGIONS, validateEmployeePersonalInfo } from '../utils/employeePersonalInfoValidation';

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
  hrDecision: { decision: '', note: '', decidedAt: null, decidedBy: null, reviewerName: '', reviewerEmail: '' },
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
const EDUCATION_LEVELS = ['Primary', 'Secondary', 'TVET Certificate', 'Diploma', 'Bachelor’s Degree', 'Master’s Degree', 'Doctorate (PhD)', 'Other'];
const EMERGENCY_RELATIONSHIPS = ['Parent', 'Spouse', 'Sibling', 'Child', 'Relative', 'Friend', 'Guardian', 'Other'];

const statusColor = { draft: 'gray', submitted: 'orange', approved: 'green', returned: 'red' };
const dateValue = (value) => value ? String(value).slice(0, 10) : '';
const formatDate = (value) => value
  ? new globalThis.Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Not recorded';
const reviewerIdentity = (decision = {}) => ({
  name: decision.reviewerName || decision.decidedBy?.username || decision.decidedBy?.fullName || 'HR',
  email: decision.reviewerEmail || decision.decidedBy?.email || '',
});

const SectionHeading = ({ code, title }) => (
  <Flex className="paper-section-heading" align="center" gap={2}>
    <Text fontSize="xs" fontWeight="800" letterSpacing="0.12em">SECTION {code} — {title}</Text>
  </Flex>
);

const Field = ({ label, required, helper, error, owner = 'employee', children }) => {
  const value = children?.props?.value;
  const text = String(value ?? '').trim().toLowerCase();
  const completed = text !== '' && text !== 'not provided' && text !== 'assigned by hr';
  return (
  <FormControl isRequired={required} isInvalid={Boolean(error)} data-validation-error={error ? 'true' : undefined}>
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
    {error && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
    {helper && <Text mt={1.5} fontSize="xs" color="gray.500">{helper}</Text>}
  </FormControl>
  );
};

const RegionSelect = ({ value, disabled, onChange }) => (
  <Select value={value} isDisabled={disabled} onChange={onChange} placeholder="Select region or city administration">
    {value && !ETHIOPIAN_REGIONS.includes(value) && <option value={value}>{value} (saved value)</option>}
    {ETHIOPIAN_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
  </Select>
);

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
  const [validationMode, setValidationMode] = useState(null);
  // HR reviews a read-only employee record. For the employee, only final HR
  // approval locks the form; submitted and returned records remain editable.
  const locked = hrView || record.status === 'approved';
  const reviewer = reviewerIdentity(record.hrDecision);

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
  const validationErrors = useMemo(
    () => validationMode ? validateEmployeePersonalInfo({ profile, record }, validationMode) : {},
    [profile, record, validationMode]
  );

  const focusFirstError = () => {
    window.setTimeout(() => {
      const container = document.querySelector('[data-validation-error="true"]');
      container?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      container?.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
    }, 0);
  };

  const save = async (submit = false, section = null) => {
    const validationOptions = { submit, section };
    const errors = validateEmployeePersonalInfo({ profile, record }, validationOptions);
    setValidationMode(validationOptions);
    if (Object.keys(errors).length) {
      toast({
        title: `Please correct ${Object.keys(errors).length} highlighted field${Object.keys(errors).length === 1 ? '' : 's'}`,
        description: Object.values(errors)[0],
        status: 'error',
      });
      focusFirstError();
      return false;
    }
    setWorking(true);
    try {
      const url = submit ? '/users/personal-information/me/submit' : '/users/personal-information/me';
      const method = submit ? 'post' : 'patch';
      const { data } = await axiosInstance[method](url, submit ? payload : { ...payload, validationSection: section });
      toast({ title: data.message, status: 'success' });
      await load();
      return true;
    } catch (error) {
      toast({ title: submit ? 'Form could not be submitted' : 'Draft could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
      return false;
    } finally {
      setWorking(false);
    }
  };

  const saveBeforeUpload = async () => {
    const saved = await save(false, 'upload');
    if (saved) navigate('/employee-file-upload');
  };

  const SectionAction = ({ section, validationSection, description }) => !locked && (
    <Flex className="screen-only section-action" mt={5} justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3}>
      <Box>
        <Text fontSize="sm" fontWeight="700">{section}</Text>
        <Text fontSize="xs" color="gray.500">{description}</Text>
      </Box>
      <Button leftIcon={<FiSave />} colorScheme="teal" variant="outline" isLoading={working} onClick={() => save(false, validationSection)}>
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
      {params.get('documentsUploaded') === '1' && (
        <Alert status="success" mb={4} borderRadius="xl" className="screen-only">
          <AlertIcon />
          <Box>
            <Text fontWeight="700">Documents uploaded successfully</Text>
            <Text fontSize="sm">Complete all highlighted sections, accept the declaration, then select <b>Submit to HR</b>. Onboarding continues only after HR approves the record.</Text>
          </Box>
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
            <Box><Text fontWeight="700">Verified and approved by HR</Text><Text fontSize="sm">Approved by {reviewer.name} on {formatDate(record.hrDecision?.decidedAt)}. The approved form is now locked.</Text></Box>
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
            <Field label="Full Name" required error={validationErrors['profile.fullName']} helper="Enter at least two names as shown on official identification."><Input value={profile.fullName} isReadOnly={locked} autoComplete="name" onChange={(e) => setProfile((previous) => ({ ...previous, fullName: e.target.value }))} /></Field>
            <Field label="Date of Birth" required error={validationErrors['record.dateOfBirth']} helper="Use the Gregorian date shown on your official record."><Input type="date" max={new Date().toISOString().slice(0, 10)} value={record.dateOfBirth} isReadOnly={locked} onChange={(e) => setValue('dateOfBirth', e.target.value)} /></Field>
            <Field label="Gender">
              <Select value={profile.gender} isDisabled={locked} onChange={(e) => setProfile((previous) => ({ ...previous, gender: e.target.value }))} placeholder="Select gender">
                <option value="female">Female</option><option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Nationality" required error={validationErrors['record.nationality']}><Select value={record.nationality} isDisabled={locked} onChange={(e) => setValue('nationality', e.target.value)} placeholder="Select nationality">{record.nationality && !['Ethiopian', 'Other'].includes(record.nationality) && <option value={record.nationality}>{record.nationality} (saved value)</option>}<option value="Ethiopian">Ethiopian</option><option value="Other">Other / non-Ethiopian</option></Select></Field>
            <Field label="National ID / Passport No." required error={validationErrors['record.nationalIdOrPassport']} helper="Enter 4–30 characters exactly as printed on the document."><Input value={record.nationalIdOrPassport} maxLength={30} isReadOnly={locked} onChange={(e) => setValue('nationalIdOrPassport', e.target.value)} /></Field>
            <Field label="Marital Status" required>
              <Select value={record.maritalStatus} isDisabled={locked} onChange={(e) => setValue('maritalStatus', e.target.value)} placeholder="Select status">
                <option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option>
              </Select>
            </Field>
            <Field label="Phone Number" required error={validationErrors['profile.phone']} helper="Accepted formats: 0911234567 or +251911234567."><Input type="tel" inputMode="tel" autoComplete="tel" value={profile.phone} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, phone: e.target.value }))} /></Field>
            <Field label="Personal Email Address" error={validationErrors['profile.altEmail']}><Input type="email" autoComplete="email" value={profile.altEmail} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, altEmail: e.target.value }))} /></Field>
            <Field label="Employee ID" owner="hr" helper="The unique employee number is assigned and maintained by HR."><Input value={employee.digitalId || 'Assigned by HR'} isReadOnly /></Field>
          </SimpleGrid>

          <Text className="paper-subheading">PLACE OF BIRTH</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Place / City"><Input value={record.placeOfBirth.city} isReadOnly={locked} onChange={(e) => setNested('placeOfBirth', 'city', e.target.value)} /></Field>
            <Field label="Region"><RegionSelect value={record.placeOfBirth.region} disabled={locked} onChange={(e) => setNested('placeOfBirth', 'region', e.target.value)} /></Field>
            <Field label="Kebele"><Input value={record.placeOfBirth.kebele} isReadOnly={locked} onChange={(e) => setNested('placeOfBirth', 'kebele', e.target.value)} /></Field>
          </SimpleGrid>

          <Text className="paper-subheading">PRESENT ADDRESS</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Region" required error={validationErrors['record.presentAddress.region']}><RegionSelect value={record.presentAddress.region} disabled={locked} onChange={(e) => setNested('presentAddress', 'region', e.target.value)} /></Field>
            <Field label="City / Town" required error={validationErrors['record.presentAddress.cityOrTown']}><Input value={record.presentAddress.cityOrTown} isReadOnly={locked} autoComplete="address-level2" onChange={(e) => setNested('presentAddress', 'cityOrTown', e.target.value)} /></Field>
            <Field label="Sub-City / Woreda"><Input value={record.presentAddress.subCityOrWoreda} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'subCityOrWoreda', e.target.value)} /></Field>
            <Field label="Kebele"><Input value={record.presentAddress.kebele} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'kebele', e.target.value)} /></Field>
            <Field label="House Number"><Input value={record.presentAddress.houseNumber} isReadOnly={locked} onChange={(e) => setNested('presentAddress', 'houseNumber', e.target.value)} /></Field>
            <Field label="Address Summary"><Input value={profile.location} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, location: e.target.value }))} /></Field>
          </SimpleGrid>
          <SectionAction section="Section A" validationSection="A" description="Save personal, birthplace, and present-address information as a draft." />

          <SectionHeading code="B" title="EMPLOYMENT DETAILS" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Job Title / Position" owner="hr"><Input value={employee.jobTitle || 'Not provided'} isReadOnly /></Field>
            <Field label="Department" owner="hr"><Input value={employee.role || 'Not provided'} isReadOnly /></Field>
            <Field label="Hiring Date" owner="hr"><Input value={dateValue(employee.hireDate)} type="date" isReadOnly /></Field>
            <Field label="Employment Type" owner="hr"><Input value={employee.employmentType || 'Not provided'} isReadOnly /></Field>
            <Field label="Basic Pay (Birr)" owner="hr"><Input value={employee.salary ?? 'Not provided'} isReadOnly /></Field>
            <Field label="TIN Number" error={validationErrors['record.tinNumber']} helper="Enter the 10-digit taxpayer identification number issued by the tax authority."><Input value={record.tinNumber} inputMode="numeric" maxLength={10} isReadOnly={locked} onChange={(e) => setValue('tinNumber', e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label="Salary Bank Account Number" error={validationErrors['record.salaryBankAccountNumber']} helper="Enter 6–24 digits for the account designated to receive salary payments."><Input value={record.salaryBankAccountNumber} inputMode="numeric" maxLength={24} isReadOnly={locked} onChange={(e) => setValue('salaryBankAccountNumber', e.target.value.replace(/\D/g, ''))} /></Field>
          </SimpleGrid>
          <SectionAction section="Section B" validationSection="B" description="Save employee-provided payroll identifiers. HR employment fields remain protected." />

          <SectionHeading code="C" title="EDUCATIONAL BACKGROUND" />
          <Box mb={4}>
            <Field label="Education Summary" helper="This updates the employee’s existing profile summary while the detailed rows below remain part of this form.">
              <Input value={profile.education} isReadOnly={locked} onChange={(e) => setProfile((previous) => ({ ...previous, education: e.target.value }))} placeholder="Example: BA Degree in Marketing" />
            </Field>
          </Box>
          <Stack spacing={3}>
            {record.educationRecords.map((item, index) => (
              <Grid key={index} templateColumns={{ base: '1fr', md: '1fr 1.4fr 1.3fr 0.7fr auto' }} gap={3} alignItems="end">
                <Field label="Level of Education" error={validationErrors[`record.educationRecords.${index}.level`]}><Select value={item.level} isDisabled={locked} onChange={(e) => setEducation(index, 'level', e.target.value)} placeholder="Select level">{item.level && !EDUCATION_LEVELS.includes(item.level) && <option value={item.level}>{item.level} (saved value)</option>}{EDUCATION_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</Select></Field>
                <Field label="Institution Name" error={validationErrors[`record.educationRecords.${index}.institution`]}><Input value={item.institution} isReadOnly={locked} onChange={(e) => setEducation(index, 'institution', e.target.value)} /></Field>
                <Field label="Field of Study" error={validationErrors[`record.educationRecords.${index}.fieldOfStudy`]}><Input value={item.fieldOfStudy} isReadOnly={locked} onChange={(e) => setEducation(index, 'fieldOfStudy', e.target.value)} /></Field>
                <Field label="Year (Gregorian)" error={validationErrors[`record.educationRecords.${index}.graduationYear`]}><Input value={item.graduationYear} inputMode="numeric" maxLength={4} isReadOnly={locked} onChange={(e) => setEducation(index, 'graduationYear', e.target.value.replace(/\D/g, ''))} /></Field>
                {!locked && record.educationRecords.length > 1 && <IconButton mb="1px" aria-label="Remove education" icon={<FiTrash2 />} colorScheme="red" variant="ghost" onClick={() => setValue('educationRecords', record.educationRecords.filter((_, i) => i !== index))} />}
              </Grid>
            ))}
            {!locked && <Button className="screen-only" alignSelf="flex-start" size="sm" variant="outline" leftIcon={<FiPlus />} onClick={() => setValue('educationRecords', [...record.educationRecords, { level: '', institution: '', fieldOfStudy: '', graduationYear: '' }])}>Add education</Button>}
          </Stack>
          <SectionAction section="Section C" validationSection="C" description="Save the education summary and detailed qualification records." />
          <Text className="paper-footer">Confidential — For Internal HR Use Only <span>Page 1</span></Text>
        </Box>

        <Box className="paper-page paper-page-two">
          <Flex className="paper-header compact" direction="column" align="center">
            <Image src="/brand/tradethiopia-logo.png" alt="Trade Ethiopia Group" className="company-logo" fallback={<Heading size="sm" color="#294f73">TradeEthiopia Group</Heading>} />
          </Flex>
          <SectionHeading code="D" title="EMERGENCY CONTACT INFORMATION" />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Field label="Full Name" required error={validationErrors['record.emergencyContact.fullName']}><Input value={record.emergencyContact.fullName} autoComplete="name" isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'fullName', e.target.value)} /></Field>
            <Field label="Relationship to Employee" required error={validationErrors['record.emergencyContact.relationship']}><Select value={record.emergencyContact.relationship} isDisabled={locked} onChange={(e) => setNested('emergencyContact', 'relationship', e.target.value)} placeholder="Select relationship">{record.emergencyContact.relationship && !EMERGENCY_RELATIONSHIPS.includes(record.emergencyContact.relationship) && <option value={record.emergencyContact.relationship}>{record.emergencyContact.relationship} (saved value)</option>}{EMERGENCY_RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}</Select></Field>
            <Field label="Phone Number" required error={validationErrors['record.emergencyContact.phone']} helper="Accepted formats: 0911234567 or +251911234567."><Input type="tel" inputMode="tel" value={record.emergencyContact.phone} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'phone', e.target.value)} /></Field>
            <Field label="Alternative Phone Number" error={validationErrors['record.emergencyContact.alternativePhone']}><Input type="tel" inputMode="tel" value={record.emergencyContact.alternativePhone} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'alternativePhone', e.target.value)} /></Field>
            <Box gridColumn={{ md: '1 / -1' }}><Field label="Address"><Textarea value={record.emergencyContact.address} isReadOnly={locked} onChange={(e) => setNested('emergencyContact', 'address', e.target.value)} /></Field></Box>
          </SimpleGrid>
          <SectionAction section="Section D" validationSection="D" description="Save the employee’s emergency contact information." />

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
                <Button variant="ghost" colorScheme="teal" isLoading={working} loadingText="Saving draft" onClick={saveBeforeUpload}>Save and upload documents</Button>
                <Button leftIcon={<FiSave />} colorScheme="teal" variant="outline" isLoading={working} onClick={() => save(false, 'E')}>Save Section E</Button>
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
            <Checkbox mt={4} isChecked={record.declarationAccepted} isInvalid={Boolean(validationErrors['record.declarationAccepted'])} isDisabled={locked} onChange={(e) => setValue('declarationAccepted', e.target.checked)}>
              I have reviewed this record and accept the declaration.
            </Checkbox>
            {validationErrors['record.declarationAccepted'] && <Text mt={2} fontSize="xs" color="red.500">{validationErrors['record.declarationAccepted']}</Text>}
          </Box>
          <SectionAction section="Declaration" validationSection="declaration" description="Save the declaration confirmation before submitting the complete form to HR." />

          {!hrView && (
            <Box mt={6} p={5} border="1px solid" borderColor={record.status === 'approved' ? 'green.200' : 'teal.200'} borderRadius="xl" bg={record.status === 'approved' ? 'green.50' : 'teal.50'} className="screen-only">
              {record.status === 'approved' ? (
                <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box>
                    <Text fontWeight="800" color="green.800">HR approval complete</Text>
                    <Text mt={1} fontSize="sm" color="green.700">Your employee record is approved. You may now continue to the company tutorials.</Text>
                  </Box>
                  <Button colorScheme="green" flexShrink={0} onClick={() => navigate('/secondpage')}>Continue to tutorials</Button>
                </Flex>
              ) : record.status === 'submitted' ? (
                <Box>
                  <Text fontWeight="800" color="teal.800">Form submitted to HR</Text>
                  <Text mt={1} fontSize="sm" color="teal.700">HR must review and approve this record before tutorial access becomes available.</Text>
                </Box>
              ) : (
                <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box>
                    <Text fontWeight="800" color="teal.800">Final step: submit for HR approval</Text>
                    <Text mt={1} fontSize="sm" color="teal.700">Complete the form, upload the required documents, and accept the declaration. Saving a draft does not send it to HR.</Text>
                  </Box>
                  <Button leftIcon={<FiSend />} colorScheme="teal" isLoading={working} loadingText="Submitting" flexShrink={0} onClick={() => save(true)}>Submit complete form to HR</Button>
                </Flex>
              )}
            </Box>
          )}

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={10}>
            <Box className="signature-line">
              <Text fontWeight="700">{profile.fullName || employee.username || 'Employee'}</Text>
              <Text fontSize="xs" color="gray.500">Employee confirmation • {formatDate(record.submittedAt)}</Text>
            </Box>
            <Box className="signature-line">
              <Text fontWeight="700">{record.hrDecision?.decidedAt ? reviewer.name : 'Awaiting HR verification'}</Text>
              <Text fontSize="xs" color="gray.500">HR Officer verification • {formatDate(record.hrDecision?.decidedAt)}{reviewer.email ? ` • ${reviewer.email}` : ''}</Text>
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
