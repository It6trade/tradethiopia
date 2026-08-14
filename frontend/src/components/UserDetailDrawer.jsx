import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCopy,
  FiDatabase,
  FiDollarSign,
  FiDownload,
  FiEdit,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiFile,
  FiFileText,
  FiHash,
  FiKey,
  FiLink,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';
import { buildEmployeeExportData, exportEmployeePdf, exportEmployeeWord } from '../utils/employeeExport';

const EMPTY_VALUE = 'Not provided';

const formatDate = (value, includeTime = false) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new globalThis.Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

const formatSalary = (value) => {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) {
    return EMPTY_VALUE;
  }
  return new globalThis.Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatTenure = (hireDate) => {
  if (!hireDate) return EMPTY_VALUE;
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime()) || start > new Date()) return EMPTY_VALUE;

  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months += now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0 && remainingMonths === 0) return 'Less than one month';
  return [
    years ? `${years} year${years === 1 ? '' : 's'}` : '',
    remainingMonths ? `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(', ');
};

const DetailField = ({ label, value, icon }) => (
  <Box
    minH="86px"
    p={4}
    border="1px solid"
    borderColor="gray.200"
    borderRadius="xl"
    bg="white"
  >
    <HStack spacing={2} mb={2}>
      {icon && <Icon as={icon} color="teal.600" boxSize={4} />}
      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
    </HStack>
    <Text fontSize="sm" fontWeight="650" color={value && value !== EMPTY_VALUE ? 'gray.800' : 'gray.400'} wordBreak="break-word">
      {value || EMPTY_VALUE}
    </Text>
  </Box>
);

const CopyButton = ({ value, label, onCopied }) => (
  <Tooltip label={`Copy ${label}`} hasArrow>
    <IconButton
      aria-label={`Copy ${label}`}
      icon={<FiCopy />}
      size="xs"
      variant="ghost"
      colorScheme="teal"
      isDisabled={!value}
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(String(value));
        onCopied(label);
      }}
    />
  </Tooltip>
);

const InteractiveField = ({ label, value, icon, href, actionLabel, onCopied }) => {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <Box
      minH="104px"
      p={4}
      border="1px solid"
      borderColor={hasValue ? 'gray.200' : 'orange.200'}
      borderRadius="xl"
      bg={hasValue ? 'white' : 'orange.50'}
      transition="all 0.2s ease"
      _hover={hasValue ? { borderColor: 'teal.300', shadow: 'sm', transform: 'translateY(-1px)' } : {}}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <HStack spacing={2}>
          <Icon as={icon} color={hasValue ? 'teal.600' : 'orange.500'} boxSize={4} />
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide">
            {label}
          </Text>
        </HStack>
        {hasValue && <CopyButton value={value} label={label} onCopied={onCopied} />}
      </Flex>
      <Text mt={3} fontSize="sm" fontWeight="650" color={hasValue ? 'gray.800' : 'orange.700'} wordBreak="break-word">
        {hasValue ? value : EMPTY_VALUE}
      </Text>
      {hasValue && href && (
        <Button
          as="a"
          href={href}
          mt={3}
          size="xs"
          variant="link"
          colorScheme="teal"
          leftIcon={<Icon as={icon} />}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

const Section = ({ title, description, children }) => (
  <Box>
    <Box mb={4}>
      <Heading as="h3" size="sm" color="gray.800">{title}</Heading>
      {description && <Text mt={1} fontSize="xs" color="gray.500">{description}</Text>}
    </Box>
    {children}
  </Box>
);

const FileCard = ({ title, subtitle, href, icon = FiFileText, association, category, date }) => (
  <Flex
    p={4}
    border="1px solid"
    borderColor="gray.200"
    borderRadius="xl"
    bg="white"
    align={{ base: 'flex-start', sm: 'center' }}
    justify="space-between"
    gap={4}
    direction={{ base: 'column', sm: 'row' }}
    transition="all 0.2s ease"
    _hover={{ borderColor: 'teal.300', shadow: 'sm', transform: 'translateY(-1px)' }}
  >
    <HStack spacing={3} minW={0}>
      <Flex flexShrink={0} w="42px" h="42px" align="center" justify="center" borderRadius="lg" bg="teal.50">
        <Icon as={icon} color="teal.600" boxSize={5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="sm" fontWeight="700" color="gray.800" noOfLines={1}>{title}</Text>
        <Text mt={1} fontSize="xs" color="gray.500" noOfLines={2}>{subtitle || 'Employee file'}</Text>
        <HStack mt={2} spacing={2} flexWrap="wrap">
          {category && <Badge colorScheme="teal" variant="subtle" borderRadius="full">{category}</Badge>}
          {date && <Badge colorScheme="gray" variant="subtle" borderRadius="full">{date}</Badge>}
          {association && (
            <Badge
              colorScheme={association === 'direct' ? 'green' : 'orange'}
              variant="subtle"
              borderRadius="full"
            >
              {association === 'direct' ? 'Directly linked' : 'Legacy name match'}
            </Badge>
          )}
        </HStack>
      </Box>
    </HStack>
    <Button
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
      variant="outline"
      colorScheme="teal"
      leftIcon={<FiDownload />}
      isDisabled={!href}
      flexShrink={0}
    >
      View file
    </Button>
  </Flex>
);

const LoadingDrawer = () => (
  <Stack spacing={5} p={2}>
    <HStack spacing={4}>
      <Skeleton borderRadius="full" boxSize="72px" />
      <Stack flex="1">
        <Skeleton h="20px" />
        <Skeleton h="14px" />
        <Skeleton h="14px" w="60%" />
      </Stack>
    </HStack>
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} h="86px" borderRadius="xl" />)}
    </SimpleGrid>
  </Stack>
);

const UserDetailDrawer = ({ isOpen, onClose, user: summaryUser, initialTab = 0, onUserUpdated }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const isHr = normalizeRole(currentUser?.role || currentUser?.displayRole) === 'hr';
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentCategory, setDocumentCategory] = useState('all');
  const [exporting, setExporting] = useState('');
  const toast = useToast();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const bodyBg = useColorModeValue('gray.50', 'gray.900');

  // Edit Account Credentials State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'employee',
    status: 'active',
  });

  const handleOpenEditModal = () => {
    const currentEmp = profile || summaryUser || {};
    setEditForm({
      username: currentEmp.username || '',
      email: currentEmp.email || '',
      password: '',
      fullName: currentEmp.fullName || '',
      role: currentEmp.role || 'employee',
      status: currentEmp.status || 'active',
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleSaveAccountEdit = async () => {
    const currentEmp = profile || summaryUser || {};
    if (!currentEmp._id) return;
    setSavingEdit(true);
    try {
      const payload = {
        username: editForm.username,
        email: editForm.email,
        fullName: editForm.fullName,
        role: editForm.role,
        status: editForm.status,
      };
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }
      const response = await axiosInstance.put(`/users/${currentEmp._id}`, payload);
      const updatedUser = response.data?.data || payload;
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      toast({ title: 'Account credentials updated successfully!', status: 'success' });
      setIsEditModalOpen(false);
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (err) {
      toast({
        title: 'Failed to update account',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDirectStatusChange = async (newStatus) => {
    const currentEmp = profile || summaryUser || {};
    if (!currentEmp._id) return;
    try {
      const response = await axiosInstance.put(`/users/${currentEmp._id}`, { status: newStatus });
      const updatedUser = response.data?.data || { ...currentEmp, status: newStatus };
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      toast({
        title: newStatus === 'active' ? 'Account Activated' : 'Account Deactivated',
        status: newStatus === 'active' ? 'success' : 'info',
      });
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (err) {
      toast({
        title: 'Failed to change status',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    }
  };

  useEffect(() => {
    setTabIndex(initialTab);
    setDocumentSearch('');
    setDocumentCategory('all');
  }, [initialTab, summaryUser?._id]);

  useEffect(() => {
    if (!isOpen || !summaryUser?._id || !isHr) return;

    let active = true;
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`/users/${summaryUser._id}/details`);
        if (!active) return;
        setProfile(response.data?.data?.user || null);
        setDocuments(response.data?.data?.documents || []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Unable to load employee details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      active = false;
    };
  }, [isOpen, summaryUser?._id, isHr]);

  const employee = useMemo(() => profile || summaryUser || {}, [profile, summaryUser]);
  const profileFiles = useMemo(() => [
    employee.photoUrl && {
      key: 'profile-photo',
      title: 'Profile photo',
      subtitle: 'Employee identity image',
      href: employee.photoUrl,
      icon: FiUser,
    },
    employee.guarantorFileUrl && {
      key: 'guarantor-file',
      title: 'Guarantor document',
      subtitle: 'Employment guarantor file',
      href: employee.guarantorFileUrl,
      icon: FiShield,
    },
  ].filter(Boolean), [employee.photoUrl, employee.guarantorFileUrl]);
  const documentCategories = useMemo(() => (
    Array.from(new Set(
      documents
        .map((document) => document.category?.name || 'Uncategorized')
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b))
  ), [documents]);
  const filteredDocuments = useMemo(() => {
    const search = documentSearch.trim().toLowerCase();
    return documents.filter((document) => {
      const category = document.category?.name || 'Uncategorized';
      const matchesCategory = documentCategory === 'all' || category === documentCategory;
      const searchable = [
        document.title,
        category,
        document.department,
        document.section,
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesCategory && (!search || searchable.includes(search));
    });
  }, [documents, documentSearch, documentCategory]);
  const directlyLinkedDocuments = documents.filter((document) => document.association === 'direct');
  const legacyMatchedDocuments = documents.filter((document) => document.association === 'legacy-name-match');
  const missingProfileFiles = [
    !employee.photoUrl && 'Profile photo',
    !employee.guarantorFileUrl && 'Guarantor document',
  ].filter(Boolean);

  const employeeName = employee.fullName || employee.username || 'Employee';
  const employeeId = employee.digitalId || `TE-${String(employee._id || '').slice(-6).toUpperCase()}`;
  const profileFields = useMemo(() => [
    { key: 'fullName', label: 'Full name', value: employee.fullName },
    { key: 'username', label: 'Username', value: employee.username },
    { key: 'email', label: 'Work email', value: employee.email },
    { key: 'phone', label: 'Primary phone', value: employee.phone },
    { key: 'gender', label: 'Gender', value: employee.gender },
    { key: 'education', label: 'Education', value: employee.education },
    { key: 'location', label: 'Location', value: employee.location },
    { key: 'digitalId', label: 'Digital employee ID', value: employee.digitalId },
    { key: 'photo', label: 'Profile photo', value: employee.photo },
  ], [employee]);
  const completedProfileFields = profileFields.filter((field) =>
    field.value !== undefined && field.value !== null && String(field.value).trim() !== ''
  );
  const missingProfileFields = profileFields.filter((field) =>
    field.value === undefined || field.value === null || String(field.value).trim() === ''
  );
  const profileCompletion = Math.round((completedProfileFields.length / profileFields.length) * 100);
  const employmentFields = useMemo(() => [
    { key: 'jobTitle', label: 'Job title', value: employee.jobTitle },
    { key: 'employmentType', label: 'Employment type', value: employee.employmentType },
    { key: 'hireDate', label: 'Hire date', value: employee.hireDate },
    { key: 'salary', label: 'Salary', value: employee.salary },
    { key: 'role', label: 'System role', value: employee.role },
    { key: 'status', label: 'Account status', value: employee.status },
  ], [employee]);
  const completedEmploymentFields = employmentFields.filter((field) =>
    field.value !== undefined && field.value !== null && String(field.value).trim() !== ''
  );
  const missingEmploymentFields = employmentFields.filter((field) =>
    field.value === undefined || field.value === null || String(field.value).trim() === ''
  );
  const employmentCompletion = Math.round(
    (completedEmploymentFields.length / employmentFields.length) * 100
  );
  const tenure = formatTenure(employee.hireDate);
  const accessFields = useMemo(() => [
    { key: 'username', label: 'Username', value: employee.username },
    { key: 'email', label: 'Login email', value: employee.email },
    { key: 'role', label: 'Security role', value: employee.role },
    { key: 'status', label: 'Account status', value: employee.status },
  ], [employee]);
  const completedAccessFields = accessFields.filter((field) =>
    field.value !== undefined && field.value !== null && String(field.value).trim() !== ''
  );
  const missingAccessFields = accessFields.filter((field) =>
    field.value === undefined || field.value === null || String(field.value).trim() === ''
  );
  const accessCompletion = Math.round((completedAccessFields.length / accessFields.length) * 100);
  const hasAccountAccess = String(employee.status || '').toLowerCase() === 'active';
  const recordFields = useMemo(() => [
    { key: '_id', label: 'Database record ID', value: employee._id },
    { key: 'createdAt', label: 'Created timestamp', value: employee.createdAt },
    { key: 'updatedAt', label: 'Updated timestamp', value: employee.updatedAt },
    { key: 'digitalId', label: 'Digital employee ID', value: employee.digitalId },
  ], [employee]);
  const completedRecordFields = recordFields.filter((field) =>
    field.value !== undefined && field.value !== null && String(field.value).trim() !== ''
  );
  const missingRecordFields = recordFields.filter((field) =>
    field.value === undefined || field.value === null || String(field.value).trim() === ''
  );
  const recordCompletion = Math.round((completedRecordFields.length / recordFields.length) * 100);
  const recordTimeline = [
    employee.createdAt && {
      key: 'created',
      title: 'Employee account created',
      description: 'Date the employee account was first created',
      value: employee.createdAt,
      color: 'blue',
    },
    employee.hireDate && {
      key: 'hired',
      title: 'Employment start date',
      description: 'Hire date stored on the employee profile',
      value: employee.hireDate,
      color: 'teal',
    },
    employee.updatedAt && {
      key: 'updated',
      title: 'Employee record last updated',
      description: 'Most recent recorded update to the employee account',
      value: employee.updatedAt,
      color: 'green',
    },
  ].filter(Boolean).sort((a, b) => new Date(a.value) - new Date(b.value));
  const fileCoverage = Math.round(
    ((profileFiles.length + (documents.length > 0 ? 1 : 0)) / 3) * 100
  );
  const sectionCoverage = [
    { label: 'Profile', value: profileCompletion, detail: `${completedProfileFields.length}/${profileFields.length} key fields` },
    { label: 'Employment', value: employmentCompletion, detail: `${completedEmploymentFields.length}/${employmentFields.length} key fields` },
    { label: 'Access', value: accessCompletion, detail: `${completedAccessFields.length}/${accessFields.length} key fields` },
    { label: 'Files & documents', value: fileCoverage, detail: `${profileFiles.length + documents.length} files available` },
    { label: 'Record', value: recordCompletion, detail: `${completedRecordFields.length}/${recordFields.length} key fields` },
  ];
  const employeeRecordCompletion = Math.round(
    sectionCoverage.reduce((total, section) => total + section.value, 0) / sectionCoverage.length
  );
  const totalMissingCoreFields =
    missingProfileFields.length +
    missingEmploymentFields.length +
    missingAccessFields.length +
    missingRecordFields.length;

  const handleCopied = (label) => {
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(''), 1800);
  };

  const handleExport = async (format) => {
    if (!employee?._id || exporting) return;
    setExporting(format);
    try {
      const { data } = await axiosInstance.get(`/users/${employee._id}/personal-information`);
      const exportData = buildEmployeeExportData(employee, data.data || {});
      if (format === 'pdf') await exportEmployeePdf(exportData);
      else await exportEmployeeWord(exportData);
      toast({ title: `${format === 'pdf' ? 'PDF' : 'Word'} employee record exported`, status: 'success' });
    } catch (exportError) {
      toast({
        title: 'Employee record could not be exported',
        description: exportError.response?.data?.message || exportError.message,
        status: 'error',
      });
    } finally {
      setExporting('');
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <DrawerContent maxW={{ base: '100%', md: '760px', xl: '860px' }} bg={bodyBg}>
        <DrawerCloseButton top={5} right={5} color="white" size="lg" />
        <DrawerHeader p={0}>
          <Box bgGradient="linear(to-r, teal.800, teal.600)" color="white" px={{ base: 5, md: 8 }} py={{ base: 6, md: 8 }}>
            <Text fontSize="xs" fontWeight="700" color="teal.100" letterSpacing="widest" textTransform="uppercase">
              HR confidential profile
            </Text>
            <Heading mt={1} size="lg">Employee details</Heading>
            <Text mt={2} fontSize="sm" color="teal.100">
              Complete employment record, access information, and related documents
            </Text>
          </Box>
        </DrawerHeader>

        <DrawerBody px={{ base: 4, md: 8 }} py={{ base: 5, md: 7 }}>
          {!isHr ? (
            <Alert status="error" borderRadius="xl">
              <AlertIcon />
              Complete employee records are restricted to HR personnel.
            </Alert>
          ) : loading ? (
            <LoadingDrawer />
          ) : error ? (
            <Alert status="error" borderRadius="xl">
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <Stack spacing={7}>
              <Flex
                p={{ base: 4, md: 5 }}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="2xl"
                align={{ base: 'flex-start', sm: 'center' }}
                justify="space-between"
                direction={{ base: 'column', sm: 'row' }}
                gap={5}
                shadow="sm"
              >
                <HStack spacing={4}>
                  <Avatar size="xl" name={employeeName} src={employee.photoUrl} bg="teal.600" color="white" />
                  <Box>
                    <Heading size="md" color="gray.900">{employeeName}</Heading>
                    <Text mt={1} fontSize="sm" color="gray.600">{employee.jobTitle || 'Job title not provided'}</Text>
                    <HStack mt={2} spacing={2} flexWrap="wrap">
                      <Badge colorScheme={employee.status === 'active' ? 'green' : 'red'} borderRadius="full" px={2.5} py={0.5}>
                        {employee.status || 'unknown'}
                      </Badge>
                      <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5}>{employee.role || 'No role'}</Badge>
                    </HStack>
                  </Box>
                </HStack>
                <VStack align={{ base: 'flex-start', sm: 'flex-end' }} spacing={2}>
                  <Box textAlign={{ base: 'left', sm: 'right' }}>
                    <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">Employee ID</Text>
                    <Text mt={0.5} fontSize="sm" fontWeight="800" color="teal.700">{employeeId}</Text>
                  </Box>
                  <HStack spacing={2}>
                    <Select
                      size="xs"
                      w="115px"
                      borderRadius="md"
                      fontWeight="700"
                      bg={employee.status === 'active' ? 'green.50' : 'red.50'}
                      color={employee.status === 'active' ? 'green.700' : 'red.700'}
                      borderColor={employee.status === 'active' ? 'green.300' : 'red.300'}
                      value={employee.status === 'active' ? 'active' : 'inactive'}
                      onChange={(e) => handleDirectStatusChange(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                    <Button
                      size="xs"
                      colorScheme="teal"
                      leftIcon={<Icon as={FiEdit3} />}
                      onClick={handleOpenEditModal}
                      borderRadius="md"
                    >
                      Edit Account
                    </Button>
                  </HStack>
                </VStack>
              </Flex>

              <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="teal" variant="soft-rounded" isLazy>
                <TabList overflowX="auto" gap={2} pb={2}>
                  <Tab flexShrink={0}>Employee Overview</Tab>
                  <Tab flexShrink={0}>Profile</Tab>
                  <Tab flexShrink={0}>Employment</Tab>
                  <Tab flexShrink={0}>Access</Tab>
                  <Tab flexShrink={0}>Files & documents</Tab>
                  <Tab flexShrink={0}>Record</Tab>
                </TabList>

                <TabPanels mt={5}>
                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      <Box
                        p={{ base: 5, md: 6 }}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: 'flex-start', md: 'center' }}
                          direction={{ base: 'column', md: 'row' }}
                          gap={6}
                        >
                          <Box maxW="520px">
                            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="widest">
                              Employee record completeness
                            </Text>
                            <Heading mt={2} size="md" color="gray.900">
                              {employeeRecordCompletion === 100
                                ? 'Employee record is fully complete'
                                : employeeRecordCompletion >= 70
                                  ? 'Employee record is mostly complete'
                                  : 'Employee record requires HR attention'}
                            </Heading>
                            <Text mt={3} fontSize="sm" lineHeight="tall" color="gray.600">
                              This score combines profile, employment, access, required files and documents, and record history. It reaches 100% only when every required section is complete.
                            </Text>
                            <Text mt={2} fontSize="xs" lineHeight="tall" color="gray.500">
                              The section results below show exactly which information is reducing the employee’s overall record completeness.
                            </Text>
                          </Box>
                          <CircularProgress
                            value={employeeRecordCompletion}
                            size="128px"
                            thickness="8px"
                            color="teal.600"
                            trackColor="gray.200"
                          >
                            <CircularProgressLabel>
                              <Text fontSize="2xl" fontWeight="800" color="gray.800">{employeeRecordCompletion}%</Text>
                              <Text fontSize="10px" fontWeight="700" color="gray.500">RECORD</Text>
                            </CircularProgressLabel>
                          </CircularProgress>
                        </Flex>
                      </Box>

                      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                        {[
                          ['Employment status', employee.status || EMPTY_VALUE],
                          ['Length of service', tenure],
                          ['Employment type', employee.employmentType || EMPTY_VALUE],
                          ['Available files', profileFiles.length + documents.length],
                        ].map(([label, value]) => (
                          <Box
                            key={label}
                            p={4}
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="xl"
                          >
                            <Text fontSize="xs" fontWeight="700" color="gray.500">{label}</Text>
                            <Text mt={2} fontSize="md" fontWeight="800" color="gray.800" noOfLines={2}>
                              {value}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>

                      <Section
                        title="Information coverage"
                        description="A section-by-section view of the information currently available to HR."
                      >
                        <Stack spacing={4}>
                          {sectionCoverage.map((section) => (
                            <Box
                              key={section.label}
                              p={4}
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="xl"
                            >
                              <Flex justify="space-between" align="center" gap={4}>
                                <Box>
                                  <Text fontSize="sm" fontWeight="700" color="gray.800">{section.label}</Text>
                                  <Text mt={0.5} fontSize="xs" color="gray.500">{section.detail}</Text>
                                </Box>
                                <Text fontSize="sm" fontWeight="800" color="gray.700">{section.value}%</Text>
                              </Flex>
                              <Progress
                                mt={3}
                                value={section.value}
                                size="sm"
                                colorScheme="teal"
                                bg="gray.200"
                                borderRadius="full"
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Section>

                      <Divider />

                      <Section
                        title="HR attention summary"
                        description="The most important information gaps and document checks requiring HR follow-up."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box p={5} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl">
                            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                              Missing core information
                            </Text>
                            <Text mt={2} fontSize="2xl" fontWeight="800" color="gray.800">
                              {totalMissingCoreFields}
                            </Text>
                            <Text mt={2} fontSize="xs" color="gray.600">
                              {totalMissingCoreFields
                                ? 'Review the detailed sections to identify and complete the missing employee information.'
                                : 'All core information reviewed in this overview is available.'}
                            </Text>
                          </Box>
                          <Box p={5} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl">
                            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                              Document verification
                            </Text>
                            <Text mt={2} fontSize="2xl" fontWeight="800" color="gray.800">
                              {legacyMatchedDocuments.length}
                            </Text>
                            <Text mt={2} fontSize="xs" color="gray.600">
                              {legacyMatchedDocuments.length
                                ? 'Older documents are associated by employee name and should be verified by HR.'
                                : 'No legacy name-matched documents require verification.'}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Employee snapshot"
                        description="A concise summary of the employee’s current HR record."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <DetailField label="Employee" value={employeeName} icon={FiUser} />
                          <DetailField label="Job title" value={employee.jobTitle} icon={FiBriefcase} />
                          <DetailField label="Hire date" value={formatDate(employee.hireDate)} icon={FiCalendar} />
                          <DetailField label="System role" value={employee.role} icon={FiLock} />
                          <DetailField label="Profile status" value={employee.infoStatus} icon={FiActivity} />
                          <DetailField label="Training status" value={employee.trainingStatus} icon={FiActivity} />
                        </SimpleGrid>
                      </Section>
                    </Stack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      {copiedLabel && (
                        <Alert status="success" borderRadius="xl" py={2}>
                          <AlertIcon />
                          <Text fontSize="sm">{copiedLabel} copied to clipboard.</Text>
                        </Alert>
                      )}
                      <Box
                        p={{ base: 4, md: 5 }}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={4} direction={{ base: 'column', sm: 'row' }}>
                          <Box>
                            <HStack spacing={2}>
                              <Heading size="sm" color="gray.800">Profile completeness</Heading>
                              <Badge colorScheme={profileCompletion === 100 ? 'green' : profileCompletion >= 70 ? 'teal' : 'orange'} borderRadius="full">
                                {profileCompletion}%
                              </Badge>
                            </HStack>
                            <Text mt={1} fontSize="xs" color="gray.500">
                              {completedProfileFields.length} of {profileFields.length} required profile fields are recorded.
                            </Text>
                          </Box>
                          <HStack color={profileCompletion === 100 ? 'green.600' : 'orange.600'} spacing={2}>
                            <Icon as={profileCompletion === 100 ? FiCheck : FiActivity} />
                            <Text fontSize="xs" fontWeight="700">
                              {profileCompletion === 100 ? 'Profile complete' : `${missingProfileFields.length} fields need attention`}
                            </Text>
                          </HStack>
                        </Flex>
                        <Progress
                          mt={4}
                          value={profileCompletion}
                          size="sm"
                          colorScheme={profileCompletion === 100 ? 'green' : 'teal'}
                          borderRadius="full"
                        />
                        {missingProfileFields.length > 0 && (
                          <Flex mt={4} gap={2} flexWrap="wrap">
                            {missingProfileFields.map((field) => (
                              <Badge key={field.key} colorScheme="orange" variant="subtle" borderRadius="full" px={2.5} py={1}>
                                Missing: {field.label}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>

                      <Section title="Identity information" description="The employee’s primary identification details for HR review and verification.">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <InteractiveField label="Full name" value={employee.fullName} icon={FiUser} onCopied={handleCopied} />
                          <InteractiveField label="Username" value={employee.username} icon={FiUser} onCopied={handleCopied} />
                          <InteractiveField label="Digital employee ID" value={employee.digitalId} icon={FiShield} onCopied={handleCopied} />
                          <InteractiveField label="Gender" value={employee.gender} icon={FiUser} onCopied={handleCopied} />
                          <InteractiveField label="Education" value={employee.education} icon={FiFileText} onCopied={handleCopied} />
                          <InteractiveField label="Additional languages" value={employee.additionalLanguages} icon={FiActivity} onCopied={handleCopied} />
                        </SimpleGrid>
                      </Section>
                      <Divider />
                      <Section title="Contact information" description="Verified work and alternative contact values stored for this employee.">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <InteractiveField
                            label="Work email"
                            value={employee.email}
                            icon={FiMail}
                            href={employee.email ? `mailto:${employee.email}` : undefined}
                            actionLabel="Send email"
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Alternative email"
                            value={employee.altEmail}
                            icon={FiMail}
                            href={employee.altEmail ? `mailto:${employee.altEmail}` : undefined}
                            actionLabel="Send email"
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Primary phone"
                            value={employee.phone}
                            icon={FiPhone}
                            href={employee.phone ? `tel:${employee.phone}` : undefined}
                            actionLabel="Call number"
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Alternative / emergency phone"
                            value={employee.altPhone}
                            icon={FiPhone}
                            href={employee.altPhone ? `tel:${employee.altPhone}` : undefined}
                            actionLabel="Call number"
                            onCopied={handleCopied}
                          />
                          <GridItem colSpan={{ base: 1, md: 2 }}>
                            <InteractiveField label="Location / address" value={employee.location} icon={FiMapPin} onCopied={handleCopied} />
                          </GridItem>
                        </SimpleGrid>
                      </Section>
                      <Divider />
                      <Section title="Profile status" description="HR workflow states associated with profile completion and training.">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <DetailField label="Information status" value={employee.infoStatus} icon={FiActivity} />
                          <DetailField label="Training status" value={employee.trainingStatus} icon={FiActivity} />
                        </SimpleGrid>
                      </Section>
                      <Divider />
                      <Section title="HR notes" description="Internal observations and follow-up information available to HR.">
                        <Box p={5} minH="110px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl">
                          <Text fontSize="sm" color={employee.notes ? 'gray.700' : 'gray.400'} whiteSpace="pre-wrap">
                            {employee.notes || 'No HR notes have been recorded.'}
                          </Text>
                        </Box>
                      </Section>
                    </Stack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      {copiedLabel && (
                        <Alert status="success" borderRadius="xl" py={2}>
                          <AlertIcon />
                          <Text fontSize="sm">{copiedLabel} copied to clipboard.</Text>
                        </Alert>
                      )}
                      <Box
                        p={{ base: 4, md: 5 }}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: 'flex-start', sm: 'center' }}
                          direction={{ base: 'column', sm: 'row' }}
                          gap={4}
                        >
                          <Box>
                            <HStack spacing={2}>
                              <Heading size="sm" color="gray.800">Employment record readiness</Heading>
                              <Badge
                                colorScheme={employmentCompletion === 100 ? 'green' : employmentCompletion >= 70 ? 'teal' : 'orange'}
                                borderRadius="full"
                              >
                                {employmentCompletion}%
                              </Badge>
                            </HStack>
                            <Text mt={1} fontSize="xs" color="gray.500">
                              {completedEmploymentFields.length} of {employmentFields.length} core employment fields are recorded.
                            </Text>
                          </Box>
                          <HStack color={employmentCompletion === 100 ? 'green.600' : 'orange.600'} spacing={2}>
                            <Icon as={employmentCompletion === 100 ? FiCheck : FiActivity} />
                            <Text fontSize="xs" fontWeight="700">
                              {employmentCompletion === 100
                                ? 'Core record complete'
                                : `${missingEmploymentFields.length} fields need attention`}
                            </Text>
                          </HStack>
                        </Flex>
                        <Progress
                          mt={4}
                          value={employmentCompletion}
                          size="sm"
                          colorScheme={employmentCompletion === 100 ? 'green' : 'teal'}
                          borderRadius="full"
                        />
                        {missingEmploymentFields.length > 0 && (
                          <Flex mt={4} gap={2} flexWrap="wrap">
                            {missingEmploymentFields.map((field) => (
                              <Badge key={field.key} colorScheme="orange" variant="subtle" borderRadius="full" px={2.5} py={1}>
                                Missing: {field.label}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>

                      <Section
                        title="Position and contract"
                        description="The employee’s position, contract arrangement, and length of service."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <InteractiveField
                            label="Job title"
                            value={employee.jobTitle}
                            icon={FiBriefcase}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Employment type"
                            value={employee.employmentType}
                            icon={FiBriefcase}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Hire date"
                            value={formatDate(employee.hireDate)}
                            icon={FiCalendar}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Length of service"
                            value={tenure}
                            icon={FiClock}
                            onCopied={handleCopied}
                          />
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Compensation"
                        description="Confidential salary information. Values are displayed in Ethiopian birr."
                      >
                        <Box
                          p={{ base: 4, md: 5 }}
                          bgGradient="linear(to-r, teal.700, teal.600)"
                          color="white"
                          borderRadius="2xl"
                          shadow="sm"
                        >
                          <Flex
                            justify="space-between"
                            align={{ base: 'flex-start', sm: 'center' }}
                            direction={{ base: 'column', sm: 'row' }}
                            gap={4}
                          >
                            <HStack spacing={3}>
                              <Flex w="44px" h="44px" borderRadius="xl" bg="whiteAlpha.200" align="center" justify="center">
                                <Icon as={FiDollarSign} boxSize={5} />
                              </Flex>
                              <Box>
                                <Text fontSize="xs" color="teal.100" fontWeight="700" textTransform="uppercase">
                                  Recorded salary
                                </Text>
                                <Text mt={1} fontSize="xl" fontWeight="800">
                                  {formatSalary(employee.salary)}
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme="orange" variant="solid" borderRadius="full" px={3} py={1}>
                              HR confidential
                            </Badge>
                          </Flex>
                          <Text mt={4} fontSize="xs" color="teal.100">
                            This is the exact salary value stored on the employee profile. No deductions, allowances, or payroll calculations are applied here.
                          </Text>
                        </Box>
                      </Section>

                      <Divider />

                      <Section
                        title="Employment and workflow status"
                        description="Account access and HR processing states are shown separately to avoid ambiguity."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <DetailField label="Account status" value={employee.status} icon={FiShield} />
                          <DetailField label="System role" value={employee.role} icon={FiLock} />
                          <DetailField label="Profile information status" value={employee.infoStatus} icon={FiActivity} />
                          <DetailField label="Training status" value={employee.trainingStatus} icon={FiActivity} />
                          <DetailField label="Digital employee ID" value={employee.digitalId} icon={FiShield} />
                          <DetailField label="Account created" value={formatDate(employee.createdAt)} icon={FiCalendar} />
                        </SimpleGrid>
                      </Section>

                      <Alert status="info" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">
                          A dedicated department value is not available in this employee record. HR should use the recorded job title and role for the current organizational context until a department is formally assigned.
                        </Text>
                      </Alert>
                    </Stack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      {copiedLabel && (
                        <Alert status="success" borderRadius="xl" py={2}>
                          <AlertIcon />
                          <Text fontSize="sm">{copiedLabel} copied to clipboard.</Text>
                        </Alert>
                      )}

                      <Box
                        p={{ base: 4, md: 5 }}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: 'flex-start', sm: 'center' }}
                          direction={{ base: 'column', sm: 'row' }}
                          gap={4}
                        >
                          <Box>
                            <HStack spacing={2}>
                              <Heading size="sm" color="gray.800">Access record readiness</Heading>
                              <Badge
                                colorScheme={accessCompletion === 100 ? 'green' : 'orange'}
                                borderRadius="full"
                              >
                                {accessCompletion}%
                              </Badge>
                            </HStack>
                            <Text mt={1} fontSize="xs" color="gray.500">
                              {completedAccessFields.length} of {accessFields.length} core access fields are recorded.
                            </Text>
                          </Box>
                          <HStack color={accessCompletion === 100 ? 'green.600' : 'orange.600'} spacing={2}>
                            <Icon as={accessCompletion === 100 ? FiCheck : FiActivity} />
                            <Text fontSize="xs" fontWeight="700">
                              {accessCompletion === 100
                                ? 'Core access record complete'
                                : `${missingAccessFields.length} fields need attention`}
                            </Text>
                          </HStack>
                        </Flex>
                        <Progress
                          mt={4}
                          value={accessCompletion}
                          size="sm"
                          colorScheme={accessCompletion === 100 ? 'green' : 'orange'}
                          borderRadius="full"
                        />
                        {missingAccessFields.length > 0 && (
                          <Flex mt={4} gap={2} flexWrap="wrap">
                            {missingAccessFields.map((field) => (
                              <Badge key={field.key} colorScheme="orange" variant="subtle" borderRadius="full" px={2.5} py={1}>
                                Missing: {field.label}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>

                      <Box
                        p={{ base: 4, md: 5 }}
                        bgGradient={hasAccountAccess
                          ? 'linear(to-r, green.700, teal.600)'
                          : 'linear(to-r, red.700, red.500)'}
                        color="white"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: 'flex-start', sm: 'center' }}
                          direction={{ base: 'column', sm: 'row' }}
                          gap={4}
                        >
                          <HStack spacing={3}>
                            <Flex w="46px" h="46px" borderRadius="xl" bg="whiteAlpha.200" align="center" justify="center">
                              <Icon as={hasAccountAccess ? FiShield : FiLock} boxSize={5} />
                            </Flex>
                            <Box>
                              <Text fontSize="xs" fontWeight="700" color="whiteAlpha.800" textTransform="uppercase">
                                Stored account status
                              </Text>
                              <Text mt={1} fontSize="xl" fontWeight="800">
                                {hasAccountAccess ? 'Active account' : 'Inactive account'}
                              </Text>
                            </Box>
                          </HStack>
                          <HStack spacing={2}>
                            <Select
                              size="xs"
                              w="110px"
                              bg="white"
                              color="gray.900"
                              fontWeight="700"
                              borderRadius="md"
                              value={employee.status === 'active' ? 'active' : 'inactive'}
                              onChange={(e) => handleDirectStatusChange(e.target.value)}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </Select>
                            <Button
                              size="xs"
                              colorScheme="teal"
                              variant="solid"
                              leftIcon={<Icon as={FiEdit3} />}
                              onClick={handleOpenEditModal}
                              borderRadius="md"
                            >
                              Edit Account
                            </Button>
                          </HStack>
                        </Flex>
                        <Text mt={4} fontSize="xs" color="whiteAlpha.800">
                          This is the employee’s recorded account status. An inactive label is not currently a confirmed login restriction, so HR should coordinate with the system administrator when access must be fully blocked.
                        </Text>
                      </Box>

                      <Section
                        title="Authentication identity"
                        description="Identifiers used to associate login credentials with this employee account."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <InteractiveField
                            label="Username"
                            value={employee.username}
                            icon={FiUser}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Login email"
                            value={employee.email}
                            icon={FiMail}
                            href={employee.email ? `mailto:${employee.email}` : undefined}
                            actionLabel="Send email"
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Digital employee ID"
                            value={employee.digitalId}
                            icon={FiShield}
                            onCopied={handleCopied}
                          />
                          <DetailField label="Account record ID" value={employee._id} icon={FiKey} />
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Authorization and workflow state"
                        description="The stored role controls dashboard routing; workflow statuses are displayed separately."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <DetailField label="Security role" value={employee.role} icon={FiLock} />
                          <DetailField label="Account status" value={employee.status} icon={FiShield} />
                          <DetailField label="Profile information status" value={employee.infoStatus} icon={FiActivity} />
                          <DetailField label="Training status" value={employee.trainingStatus} icon={FiActivity} />
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Security coverage"
                        description="Security information currently available to HR for this employee account."
                      >
                        <Stack spacing={3}>
                          {[
                            ['Password', 'Stored as a one-way hash and intentionally never returned to HR screens.', 'Protected'],
                            ['Two-factor authentication', 'Two-factor authentication status is not available in the employee record.', 'Not available'],
                            ['Last successful login', 'The employee’s most recent successful login is not available to HR.', 'Not available'],
                            ['Failed login attempts', 'Failed sign-in attempts are not included in this employee record.', 'Not available'],
                            ['Password changed date', 'The date of the employee’s most recent password change is not available.', 'Not available'],
                          ].map(([label, description, status]) => (
                            <Flex
                              key={label}
                              p={4}
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="xl"
                              justify="space-between"
                              align={{ base: 'flex-start', sm: 'center' }}
                              direction={{ base: 'column', sm: 'row' }}
                              gap={3}
                            >
                              <HStack spacing={3} align="flex-start">
                                <Flex w="38px" h="38px" borderRadius="lg" bg={status === 'Protected' ? 'green.50' : 'gray.100'} align="center" justify="center" flexShrink={0}>
                                  <Icon as={status === 'Protected' ? FiShield : FiActivity} color={status === 'Protected' ? 'green.600' : 'gray.500'} />
                                </Flex>
                                <Box>
                                  <Text fontSize="sm" fontWeight="700" color="gray.800">{label}</Text>
                                  <Text mt={1} fontSize="xs" color="gray.500">{description}</Text>
                                </Box>
                              </HStack>
                              <Badge colorScheme={status === 'Protected' ? 'green' : 'gray'} borderRadius="full" px={2.5} py={1} flexShrink={0}>
                                {status}
                              </Badge>
                            </Flex>
                          ))}
                        </Stack>
                      </Section>

                      <Alert status="info" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">
                          This section summarizes the employee’s current access information. Any role or access-status change should follow the approved HR account-management process.
                        </Text>
                      </Alert>
                    </Stack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                        {[
                          ['All files', profileFiles.length + documents.length, 'teal'],
                          ['Profile files', profileFiles.length, 'blue'],
                          ['Direct links', directlyLinkedDocuments.length, 'green'],
                          ['Legacy matches', legacyMatchedDocuments.length, 'orange'],
                        ].map(([label, value, scheme]) => (
                          <Box
                            key={label}
                            p={4}
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="xl"
                            shadow="sm"
                          >
                            <Text fontSize="xs" fontWeight="700" color="gray.500">{label}</Text>
                            <HStack mt={2} justify="space-between">
                              <Text fontSize="2xl" fontWeight="800" color="gray.800">{value}</Text>
                              <Flex w="34px" h="34px" borderRadius="lg" bg={`${scheme}.50`} align="center" justify="center">
                                <Icon as={FiFileText} color={`${scheme}.600`} />
                              </Flex>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>

                      {missingProfileFiles.length > 0 ? (
                        <Alert status="warning" borderRadius="xl">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm" fontWeight="700">Profile file attention required</Text>
                            <Text mt={1} fontSize="xs">
                              Missing: {missingProfileFiles.join(' and ')}.
                            </Text>
                          </Box>
                        </Alert>
                      ) : (
                        <Alert status="success" borderRadius="xl">
                          <AlertIcon />
                          <Text fontSize="sm">The employee profile photo and guarantor document are both available.</Text>
                        </Alert>
                      )}

                      <Section
                        title="Profile files"
                        description="Primary identity and guarantor files attached to the employee’s HR profile."
                      >
                        <Stack spacing={3}>
                          {profileFiles.length ? profileFiles.map((file) => (
                            <FileCard
                              key={file.key}
                              {...file}
                              association="direct"
                              category="Profile file"
                            />
                          )) : (
                            <Alert status="info" borderRadius="xl">
                              <AlertIcon />
                              No profile files have been uploaded.
                            </Alert>
                          )}
                        </Stack>
                      </Section>

                      <Divider />

                      <Section
                        title={`Employee documents (${documents.length})`}
                        description="Employment documents associated with this employee in the HR document repository."
                      >
                        <Stack spacing={4}>
                          <Flex
                            gap={3}
                            direction={{ base: 'column', md: 'row' }}
                            align={{ base: 'stretch', md: 'center' }}
                          >
                            <InputGroup size="sm" flex="1">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiSearch} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                value={documentSearch}
                                onChange={(event) => setDocumentSearch(event.target.value)}
                                placeholder="Search title, category, department..."
                                bg="white"
                                borderRadius="xl"
                              />
                            </InputGroup>
                            <Select
                              size="sm"
                              maxW={{ base: 'full', md: '220px' }}
                              value={documentCategory}
                              onChange={(event) => setDocumentCategory(event.target.value)}
                              bg="white"
                              borderRadius="xl"
                            >
                              <option value="all">All categories</option>
                              {documentCategories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </Select>
                          </Flex>

                          {legacyMatchedDocuments.length > 0 && (
                            <Alert status="warning" borderRadius="xl">
                              <AlertIcon />
                              <Box>
                                <Text fontSize="sm" fontWeight="700">Legacy document associations</Text>
                                <Text mt={1} fontSize="xs">
                                  {legacyMatchedDocuments.length} older document{legacyMatchedDocuments.length === 1 ? '' : 's'} matched the employee’s exact name rather than a unique employee link. HR should verify ownership before relying on these files.
                                </Text>
                              </Box>
                            </Alert>
                          )}

                          <Text fontSize="xs" color="gray.500" fontWeight="600">
                            Showing {filteredDocuments.length} of {documents.length} repository documents
                          </Text>

                          {filteredDocuments.length ? filteredDocuments.map((document) => (
                            <FileCard
                              key={document._id}
                              title={document.title || 'Employee document'}
                              subtitle={[
                                document.department && `Department: ${document.department}`,
                                document.section && `Section: ${document.section}`,
                              ].filter(Boolean).join(' • ') || 'HR repository document'}
                              href={document.fileUrl}
                              category={document.category?.name || 'Uncategorized'}
                              date={formatDate(document.createdAt)}
                              association={document.association}
                            />
                          )) : (
                            <Alert status="info" borderRadius="xl">
                              <AlertIcon />
                              {documents.length
                                ? 'No documents match the current search and category filters.'
                                : 'No related employee documents were found.'}
                            </Alert>
                          )}
                        </Stack>
                      </Section>

                      <Divider />

                      <Section
                        title="Document association standard"
                        description="How the system determines whether a repository document belongs to this employee."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Flex p={4} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="xl" gap={3}>
                            <Icon as={FiLink} color="green.600" boxSize={5} mt={0.5} />
                            <Box>
                              <Text fontSize="sm" fontWeight="700" color="green.800">Directly linked</Text>
                              <Text mt={1} fontSize="xs" color="green.700">
                                The document is connected to this employee’s unique account record. This is the strongest available association.
                              </Text>
                            </Box>
                          </Flex>
                          <Flex p={4} bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl" gap={3}>
                            <Icon as={FiSearch} color="orange.600" boxSize={5} mt={0.5} />
                            <Box>
                              <Text fontSize="sm" fontWeight="700" color="orange.800">Legacy name match</Text>
                              <Text mt={1} fontSize="xs" color="orange.700">
                                The document has no user ID and was matched to the employee’s exact full name or username.
                              </Text>
                            </Box>
                          </Flex>
                        </SimpleGrid>
                      </Section>
                    </Stack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <Stack spacing={7}>
                      {copiedLabel && (
                        <Alert status="success" borderRadius="xl" py={2}>
                          <AlertIcon />
                          <Text fontSize="sm">{copiedLabel} copied to clipboard.</Text>
                        </Alert>
                      )}

                      <Box
                        p={{ base: 4, md: 5 }}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2xl"
                        shadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: 'flex-start', sm: 'center' }}
                          direction={{ base: 'column', sm: 'row' }}
                          gap={4}
                        >
                          <Box>
                            <HStack spacing={2}>
                              <Heading size="sm" color="gray.800">Record integrity</Heading>
                              <Badge
                                colorScheme={recordCompletion === 100 ? 'green' : 'orange'}
                                borderRadius="full"
                              >
                                {recordCompletion}%
                              </Badge>
                            </HStack>
                            <Text mt={1} fontSize="xs" color="gray.500">
                              {completedRecordFields.length} of {recordFields.length} core record identifiers and timestamps are available.
                            </Text>
                          </Box>
                          <HStack color={recordCompletion === 100 ? 'green.600' : 'orange.600'} spacing={2}>
                            <Icon as={recordCompletion === 100 ? FiCheck : FiActivity} />
                            <Text fontSize="xs" fontWeight="700">
                              {recordCompletion === 100
                                ? 'Core record complete'
                                : `${missingRecordFields.length} fields need attention`}
                            </Text>
                          </HStack>
                        </Flex>
                        <Progress
                          mt={4}
                          value={recordCompletion}
                          size="sm"
                          colorScheme={recordCompletion === 100 ? 'green' : 'orange'}
                          borderRadius="full"
                        />
                        {missingRecordFields.length > 0 && (
                          <Flex mt={4} gap={2} flexWrap="wrap">
                            {missingRecordFields.map((field) => (
                              <Badge key={field.key} colorScheme="orange" variant="subtle" borderRadius="full" px={2.5} py={1}>
                                Missing: {field.label}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>

                      <Section
                        title="Record identifiers"
                        description="Unique references HR can use to identify this employee record accurately."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <InteractiveField
                            label="Internal record ID"
                            value={employee._id}
                            icon={FiDatabase}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Digital employee ID"
                            value={employee.digitalId}
                            icon={FiHash}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Username"
                            value={employee.username}
                            icon={FiUser}
                            onCopied={handleCopied}
                          />
                          <InteractiveField
                            label="Primary email"
                            value={employee.email}
                            icon={FiMail}
                            onCopied={handleCopied}
                          />
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Record lifecycle"
                        description="Important dates showing when the employee account was created, employment began, and the record was last updated."
                      >
                        {recordTimeline.length ? (
                          <Stack spacing={0}>
                            {recordTimeline.map((event, index) => (
                              <Grid
                                key={event.key}
                                templateColumns="32px 1fr"
                                columnGap={3}
                                minH="94px"
                              >
                                <GridItem position="relative">
                                  <Flex
                                    w="28px"
                                    h="28px"
                                    borderRadius="full"
                                    bg={`${event.color}.100`}
                                    color={`${event.color}.700`}
                                    align="center"
                                    justify="center"
                                    position="relative"
                                    zIndex={1}
                                  >
                                    <Icon as={event.key === 'updated' ? FiActivity : FiCalendar} boxSize={3.5} />
                                  </Flex>
                                  {index < recordTimeline.length - 1 && (
                                    <Box
                                      position="absolute"
                                      top="28px"
                                      bottom="0"
                                      left="13px"
                                      w="2px"
                                      bg="gray.200"
                                    />
                                  )}
                                </GridItem>
                                <GridItem pb={6}>
                                  <Box p={4} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl">
                                    <Flex
                                      justify="space-between"
                                      align={{ base: 'flex-start', sm: 'center' }}
                                      direction={{ base: 'column', sm: 'row' }}
                                      gap={2}
                                    >
                                      <Box>
                                        <Text fontSize="sm" fontWeight="700" color="gray.800">{event.title}</Text>
                                        <Text mt={1} fontSize="xs" color="gray.500">{event.description}</Text>
                                      </Box>
                                      <Badge colorScheme={event.color} variant="subtle" borderRadius="full" px={2.5} py={1}>
                                        {formatDate(event.value, event.key !== 'hired')}
                                      </Badge>
                                    </Flex>
                                  </Box>
                                </GridItem>
                              </Grid>
                            ))}
                          </Stack>
                        ) : (
                          <Alert status="info" borderRadius="xl">
                            <AlertIcon />
                            No lifecycle dates are available on this employee record.
                          </Alert>
                        )}
                      </Section>

                      <Divider />

                      <Section
                        title="Stored record state"
                        description="Current state values captured with this profile response."
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <DetailField label="Account created" value={formatDate(employee.createdAt, true)} icon={FiCalendar} />
                          <DetailField label="Last recorded update" value={formatDate(employee.updatedAt, true)} icon={FiActivity} />
                          <DetailField label="Employment start date" value={formatDate(employee.hireDate)} icon={FiBriefcase} />
                          <DetailField label="Account status" value={employee.status} icon={FiShield} />
                          <DetailField label="Information status" value={employee.infoStatus} icon={FiActivity} />
                          <DetailField label="Training status" value={employee.trainingStatus} icon={FiActivity} />
                        </SimpleGrid>
                      </Section>

                      <Divider />

                      <Section
                        title="Audit coverage"
                        description="The level of historical accountability currently available to HR for this employee record."
                      >
                        <Stack spacing={3}>
                          {[
                            ['Account creation date', employee.createdAt ? 'Available' : 'Missing', 'Shows when the employee account was first created.'],
                            ['Last record update', employee.updatedAt ? 'Available' : 'Missing', 'Shows the most recent date and time the employee account was updated.'],
                            ['Person responsible for change', 'Not available', 'The person who made the most recent profile change is not recorded.'],
                            ['Detailed change history', 'Not available', 'Previous values and field-by-field changes are not available.'],
                            ['Employee login history', 'Not available', 'Sign-in activity is not included in the employee’s HR record.'],
                          ].map(([label, status, description]) => {
                            const available = status === 'Available';
                            return (
                              <Flex
                                key={label}
                                p={4}
                                bg="white"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="xl"
                                justify="space-between"
                                align={{ base: 'flex-start', sm: 'center' }}
                                direction={{ base: 'column', sm: 'row' }}
                                gap={3}
                              >
                                <HStack align="flex-start" spacing={3}>
                                  <Flex
                                    w="38px"
                                    h="38px"
                                    borderRadius="lg"
                                    bg={available ? 'green.50' : 'gray.100'}
                                    align="center"
                                    justify="center"
                                    flexShrink={0}
                                  >
                                    <Icon as={available ? FiCheck : FiActivity} color={available ? 'green.600' : 'gray.500'} />
                                  </Flex>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="700" color="gray.800">{label}</Text>
                                    <Text mt={1} fontSize="xs" color="gray.500">{description}</Text>
                                  </Box>
                                </HStack>
                                <Badge
                                  colorScheme={available ? 'green' : status === 'Missing' ? 'orange' : 'gray'}
                                  borderRadius="full"
                                  px={2.5}
                                  py={1}
                                  flexShrink={0}
                                >
                                  {status}
                                </Badge>
                              </Flex>
                            );
                          })}
                        </Stack>
                      </Section>

                      <Alert status="info" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">
                          This section shows verified record dates and identifiers only. Where historical information is unavailable, it is clearly identified for HR.
                        </Text>
                      </Alert>
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Stack>
          )}
        </DrawerBody>

        <DrawerFooter px={{ base: 4, md: 8 }} py={4} borderTop="1px solid" borderColor="gray.200" bg="white">
          <HStack w="full" justify="space-between">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <HStack>
              <Button
                as="a"
                href={employee?._id ? `/employee-info?employeeId=${employee._id}` : undefined}
                leftIcon={<FiFileText />}
                colorScheme="teal"
                isDisabled={!employee?._id}
              >
                Personal information form
              </Button>
              <Menu placement="top-end">
                <MenuButton
                  as={Button}
                  leftIcon={<FiDownload />}
                  colorScheme="teal"
                  variant="outline"
                  isLoading={Boolean(exporting)}
                  loadingText="Exporting"
                  isDisabled={!profile}
                >
                  Export profile
                </MenuButton>
                <MenuList minW="190px">
                  <MenuItem icon={<FiFileText />} onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                  <MenuItem icon={<FiFile />} onClick={() => handleExport('word')}>Export as Word</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
      {/* Edit Account Credentials Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} isCentered size="md">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" shadow="2xl">
          <ModalHeader borderBottom="1px solid" borderColor="gray.100" pb={3}>
            <HStack spacing={3}>
              <Flex w="38px" h="38px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiKey} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="gray.800">Edit Account Credentials</Heading>
                <Text fontSize="xs" color="gray.500">Update username, login email, password, role & status</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={5}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Full Name</FormLabel>
                <Input
                  borderRadius="xl"
                  size="sm"
                  placeholder="Enter full name"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Username</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiUser} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    borderRadius="xl"
                    placeholder="Enter username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Login Email</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiMail} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    borderRadius="xl"
                    placeholder="Enter login email address"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                  New Password <Text as="span" color="gray.400" fontWeight="normal">(Leave blank to keep unchanged)</Text>
                </FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    borderRadius="xl"
                    placeholder="Type new password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<Icon as={showPassword ? FiEyeOff : FiEye} />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Security Role</FormLabel>
                  <Select
                    size="sm"
                    borderRadius="xl"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Manager</option>
                    <option value="sales">Sales</option>
                    <option value="it">IT Staff</option>
                    <option value="finance">Finance</option>
                    <option value="supervisor">Supervisor</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Account Status</FormLabel>
                  <Select
                    size="sm"
                    borderRadius="xl"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Stack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100" pt={3}>
            <HStack spacing={3}>
              <Button size="sm" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                isLoading={savingEdit}
                loadingText="Saving"
                onClick={handleSaveAccountEdit}
              >
                Save Account Changes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Drawer>
  );
};

export default UserDetailDrawer;
