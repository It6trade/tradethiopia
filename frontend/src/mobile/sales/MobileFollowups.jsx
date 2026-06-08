import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiFilter,
  FiMail,
  FiMessageCircle,
  FiMoreVertical,
  FiPhone,
  FiPlus,
  FiSearch,
  FiSliders,
  FiTarget,
  FiUser
} from 'react-icons/fi';
import { getAllCustomers, createCustomer, updateCustomer, sendCustomerEmail, sendCustomerSms } from '../../services/customerService';
import { fetchExternalCourses } from '../../services/api';
import {
  fetchPackageSales,
  createPackageSale,
  fetchPackageSalesActivities,
  logPackageSalesActivity
} from '../../services/packageService';

const TABLE_PREF_KEY = 'salesFollowupCustomerTablePrefs';

const mobileColumns = [
  { key: 'customerName', label: 'Customer Name', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'contactTitle', label: 'Training Title' },
  { key: 'callStatus', label: 'Call Status' },
  { key: 'followupStatus', label: 'Follow-up Status' },
  { key: 'schedulePreference', label: 'Schedule' },
  { key: 'packageScope', label: 'Package Scope' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' }
];

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Callback', value: 'Callback' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Pending', value: 'Pending' }
];

const packageFilterOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Expired', value: 'Expired' }
];

const theme = {
  navy: '#001f4d',
  navyLight: '#062b63',
  gold: '#D99A00',
  goldSoft: '#FFF7DE',
  ink: '#081A34',
  muted: '#6E7890',
  border: '#E8EDF5',
  page: '#FAFBFD'
};

const defaultCourses = [
  { _id: 'external-seed-0', name: 'International Trade Import Export', price: 0 },
  { _id: 'external-seed-1', name: 'Stock Market Trading', price: 0 },
  { _id: 'external-seed-2', name: 'Data Science', price: 0 },
  { _id: 'external-seed-3', name: 'Coffee Cupping', price: 0 },
  { _id: 'external-seed-4', name: 'TradeEthiopia Business TV & Radio', price: 0 },
  { _id: 'external-seed-5', name: 'Digital Marketing for International Trade', price: 0 },
  { _id: 'external-seed-6', name: 'International Trade Brokerage', price: 0 }
];

const emptyTrainingForm = {
  customerName: '',
  contactTitle: '',
  phone: '',
  email: '',
  callStatus: 'Not Called',
  followupStatus: 'Pending',
  schedulePreference: 'Regular',
  packageScope: 'Local',
  note: ''
};

const emptyPackageForm = {
  customerName: '',
  contactPerson: '',
  phoneNumber: '',
  email: '',
  packageName: '',
  packageType: '',
  status: 'Active',
  expiryDate: '',
  notes: ''
};

const emptyEmailForm = {
  subject: '',
  body: ''
};

const emptySmsForm = {
  body: ''
};

const buildCustomerDetailForm = (customer = {}) => ({
  customerName: customer.customerName || '',
  contactTitle: customer.contactTitle || customer.courseName || '',
  phone: customer.phone || '',
  email: customer.email || '',
  callStatus: customer.callStatus || 'Not Called',
  followupStatus: customer.followupStatus || 'Pending',
  schedulePreference: customer.schedulePreference || customer.schedule || 'Regular',
  packageScope: customer.packageScope || 'Local',
  note: customer.note || ''
});

const buildDefaultEmailForm = (customer = {}) => ({
  subject: customer.contactTitle || customer.courseName
    ? `Follow-up about ${customer.contactTitle || customer.courseName}`
    : 'Follow-up from Trade Ethiopia',
  body: `Hello ${customer.customerName || ''},\n\n`
});

const buildDefaultSmsForm = (customer = {}) => ({
  body: `Hello ${customer.customerName || ''}, `
});

const buildPackageContact = (sale = {}) => ({
  customerName: sale.customerName || sale.companyName || sale.contactPerson || 'Package customer',
  phone: sale.phoneNumber || sale.phone || '',
  email: sale.email || '',
  contactTitle: sale.packageName || 'Package sale',
  packageName: sale.packageName || 'Package Sale',
  packageType: sale.packageType || '',
  customerType: sale.customerType || 'Package',
  status: sale.status || 'Active'
});

const statusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'callback':
      return 'purple';
    case 'completed':
    case 'called':
      return 'green';
    case 'pending':
      return 'orange';
    case 'not called':
      return 'gray';
    case 'busy':
    case 'cancelled':
      return 'red';
    default:
      return 'blue';
  }
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'NA';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const getCourseOptions = (courses = [], currentValue = '') => {
  if (!currentValue || courses.some((course) => course.name === currentValue)) return courses;
  return [{ _id: `current-${currentValue}`, name: currentValue, price: 0 }, ...courses];
};

const detailTabs = [
  { key: 'activity', label: 'Activity' },
  { key: 'about', label: 'About' },
  { key: 'associations', label: 'Associations' },
  { key: 'notes', label: 'Notes' }
];

const readVisibleColumns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TABLE_PREF_KEY) || 'null');
    const known = mobileColumns.map((column) => column.key);
    const savedOrder = Array.isArray(saved?.order) ? saved.order.filter((key) => known.includes(key)) : [];
    const hidden = Array.isArray(saved?.hidden) ? saved.hidden : [];
    const order = [...savedOrder, ...known.filter((key) => !savedOrder.includes(key))];

    return order
      .map((key) => mobileColumns.find((column) => column.key === key))
      .filter((column) => column && !hidden.includes(column.key));
  } catch {
    return mobileColumns;
  }
};

const getFieldValue = (customer, key) => {
  switch (key) {
    case 'customerName':
      return customer.customerName || 'Unnamed customer';
    case 'contactTitle':
      return customer.contactTitle || customer.courseName || 'N/A';
    case 'date':
      return formatDate(customer.date || customer.createdAt);
    case 'schedulePreference':
      return customer.schedulePreference || customer.schedule || 'Regular';
    case 'packageScope':
      return customer.packageScope || 'Local';
    default:
      return customer[key] || 'N/A';
  }
};

const MobileFollowupCard = ({ customer, visibleColumns, onOpenDetail }) => {
  const extraColumns = visibleColumns.filter(
    (column) => !['customerName', 'phone', 'email', 'callStatus', 'followupStatus', 'date'].includes(column.key)
  );

  return (
    <Box
      as="button"
      type="button"
      textAlign="left"
      w="100%"
      bg="white"
      borderRadius="14px"
      p={4}
      boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)"
      borderWidth="1px"
      borderColor={theme.border}
      transition="transform 0.18s ease, box-shadow 0.18s ease"
      _active={{ transform: 'scale(0.99)' }}
      onClick={() => onOpenDetail(customer)}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg={theme.goldSoft} color={theme.gold} flexShrink={0} fontWeight="900">
            {getInitials(customer.customerName)}
          </Center>
          <Box minW={0}>
            <Text color={theme.ink} fontSize="15px" fontWeight="900" noOfLines={1}>
              {customer.customerName || 'Unnamed customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color={theme.muted}>
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color={theme.muted}>
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color={theme.ink} fontWeight="700">{formatDate(customer.date || customer.createdAt)}</Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="700" mt={1}>{formatTime(customer.date || customer.createdAt)}</Text>
        </Box>
      </Flex>

      <HStack spacing={2} mt={4} flexWrap="wrap">
        {customer.callStatus && (
          <Badge colorScheme={statusColor(customer.callStatus)} fontSize="9px" px={2} py={1} borderRadius="md">
            {customer.callStatus}
          </Badge>
        )}
        {customer.followupStatus && (
          <Badge colorScheme={statusColor(customer.followupStatus)} fontSize="9px" px={2} py={1} borderRadius="md">
            {customer.followupStatus}
          </Badge>
        )}
      </HStack>

      {extraColumns.length > 0 && (
        <SimpleGrid columns={2} spacing={2} mt={4}>
          {extraColumns.slice(0, 4).map((column) => (
            <Box key={column.key} bg={theme.page} borderRadius="10px" p={2} minW={0} borderWidth="1px" borderColor={theme.border}>
              <Text fontSize="8px" color={theme.muted} fontWeight="900" textTransform="uppercase" noOfLines={1}>
                {column.label}
              </Text>
              <Text fontSize="10px" color={theme.ink} fontWeight="800" noOfLines={1}>
                {getFieldValue(customer, column.key)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="span" w="30px" h="30px" borderRadius="9px" bg="#EAF8F0" color="#128650">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="9px" bg="#EAF2FF" color="#1C62C9">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="9px" bg={theme.goldSoft} color={theme.gold}>
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <Icon as={FiMoreVertical} color={theme.ink} />
      </Flex>
    </Box>
  );
};

const MobilePackageCard = ({ sale, onOpenDetail }) => {
  const packageValue = Number(sale.packageValue || (Number(sale.packageType) || 0) * 1000 || 0);

  return (
    <Box
      as="button"
      type="button"
      textAlign="left"
      w="100%"
      bg="white"
      borderRadius="14px"
      p={4}
      boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)"
      borderWidth="1px"
      borderColor={theme.border}
      transition="transform 0.18s ease, box-shadow 0.18s ease"
      _active={{ transform: 'scale(0.99)' }}
      onClick={() => onOpenDetail(sale)}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg={theme.goldSoft} color={theme.gold} flexShrink={0} fontWeight="900">
            {getInitials(sale.customerName || sale.companyName || sale.contactPerson)}
          </Center>
          <Box minW={0}>
            <Text color={theme.ink} fontSize="15px" fontWeight="900" noOfLines={1}>
              {sale.customerName || sale.companyName || 'Package customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color={theme.muted}>
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.phoneNumber || sale.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color={theme.muted}>
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color={theme.ink} fontWeight="700">{formatDate(sale.purchaseDate || sale.createdAt)}</Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="700" mt={1}>{sale.customerType || 'Package'}</Text>
        </Box>
      </Flex>

      <HStack spacing={2} mt={4} flexWrap="wrap">
        <Badge colorScheme="orange" fontSize="9px" px={2} py={1} borderRadius="md">
          {sale.packageName || 'Package Sale'}
        </Badge>
        <Badge colorScheme={statusColor(sale.status)} fontSize="9px" px={2} py={1} borderRadius="md">
          {sale.status || 'Active'}
        </Badge>
      </HStack>

      <SimpleGrid columns={2} spacing={2} mt={4}>
        <Box bg={theme.page} borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Package Type
          </Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="800" noOfLines={1}>
            {sale.packageType ? `#${sale.packageType}` : 'N/A'}
          </Text>
        </Box>
        <Box bg={theme.page} borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Value
          </Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="800" noOfLines={1}>
            ETB {packageValue.toLocaleString()}
          </Text>
        </Box>
        <Box bg={theme.page} borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Agent
          </Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="800" noOfLines={1}>
            {sale.agentName || 'N/A'}
          </Text>
        </Box>
        <Box bg={theme.page} borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Contact
          </Text>
          <Text fontSize="10px" color={theme.ink} fontWeight="800" noOfLines={1}>
            {sale.contactPerson || 'N/A'}
          </Text>
        </Box>
      </SimpleGrid>

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#e9fbf1" color="#19a56b">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#eaf4ff" color="#3182ce">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#fff7df" color="#d9901f">
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <Icon as={FiMoreVertical} color={theme.ink} />
      </Flex>
    </Box>
  );
};

const MobileFollowups = ({ openAddSignal = 0 }) => {
  const [customers, setCustomers] = useState([]);
  const [packageSales, setPackageSales] = useState([]);
  const [courses, setCourses] = useState(defaultCourses);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [section, setSection] = useState('trainings');
  const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailForm, setDetailForm] = useState(emptyTrainingForm);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailTab, setDetailTab] = useState('activity');
  const [emailForm, setEmailForm] = useState(emptyEmailForm);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentEmails, setSentEmails] = useState([]);
  const [smsForm, setSmsForm] = useState(emptySmsForm);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStep, setSmsStep] = useState('compose');
  const [sentSmsMessages, setSentSmsMessages] = useState([]);
  const [selectedPackageSale, setSelectedPackageSale] = useState(null);
  const [packageActivities, setPackageActivities] = useState([]);
  const [packageSmsForm, setPackageSmsForm] = useState(emptySmsForm);
  const [packageSmsStep, setPackageSmsStep] = useState('compose');
  const [loggingPackageSms, setLoggingPackageSms] = useState(false);
  const toast = useToast();
  const addDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const emailDisclosure = useDisclosure();
  const smsDisclosure = useDisclosure();
  const packageDetailDisclosure = useDisclosure();
  const packageSmsDisclosure = useDisclosure();
  const visibleColumns = useMemo(readVisibleColumns, []);

  useEffect(() => {
    if (openAddSignal > 0) {
      addDisclosure.onOpen();
    }
  }, [openAddSignal, addDisclosure]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load mobile follow-ups', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const data = await fetchPackageSales();
      setPackageSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load mobile package sales', error);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchExternalCourses();
        const normalized = (Array.isArray(data) ? data : []).map((course) => {
          const name = course?.name || course?.title || course?.courseName;
          if (!name) return null;
          const priceRaw = course?.price ?? course?.amount ?? course?.cost ?? 0;
          return {
            _id: course?._id || course?.id || name.toLowerCase().replace(/\s+/g, '-'),
            name,
            price: typeof priceRaw === 'number' ? priceRaw : Number(priceRaw) || 0
          };
        }).filter(Boolean);
        setCourses(normalized.length ? normalized : defaultCourses);
      } catch (error) {
        console.error('Failed to load mobile training courses', error);
        setCourses(defaultCourses);
      }
    };

    loadCourses();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !query || [
        customer.customerName,
        customer.phone,
        customer.email,
        customer.contactTitle,
        customer.courseName
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesStatus = !statusFilter
        || customer.callStatus === statusFilter
        || customer.followupStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packageSales.filter((sale) => {
      const matchesSearch = !query || [
        sale.customerName,
        sale.companyName,
        sale.contactPerson,
        sale.phoneNumber,
        sale.phone,
        sale.email,
        sale.packageName,
        sale.packageType
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesStatus = !statusFilter || sale.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [packageSales, search, statusFilter]);

  const activeFilters = section === 'packages' ? packageFilterOptions : filterOptions;
  const isLoading = section === 'packages' ? packagesLoading : loading;
  const visibleItems = section === 'packages' ? filteredPackages : filteredCustomers;
  const modalTitle = section === 'packages' ? 'Add Package Sale' : 'Add Training Follow-up';
  const detailCourseOptions = getCourseOptions(courses, detailForm.contactTitle);
  const trainingCourseOptions = getCourseOptions(courses, trainingForm.contactTitle);
  const selectedPackageContact = buildPackageContact(selectedPackageSale || {});

  const handleTrainingChange = (event) => {
    const { name, value } = event.target;
    setTrainingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackageChange = (event) => {
    const { name, value } = event.target;
    setPackageForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;
    setDetailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenDetail = (customer) => {
    setSelectedCustomer(customer);
    setDetailForm(buildCustomerDetailForm(customer));
    setDetailEditMode(false);
    setDetailTab('activity');
    setEmailForm(buildDefaultEmailForm(customer));
    setSmsForm(buildDefaultSmsForm(customer));
    setSentEmails([]);
    setSentSmsMessages([]);
    detailDisclosure.onOpen();
  };

  const handleDetailClose = () => {
    if (savingDetail) return;
    detailDisclosure.onClose();
    setSelectedCustomer(null);
    setDetailEditMode(false);
    setDetailTab('activity');
    emailDisclosure.onClose();
    smsDisclosure.onClose();
  };

  const handleAddClose = () => {
    if (saving) return;
    addDisclosure.onClose();
  };

  const handleOpenEmailComposer = () => {
    setEmailForm(buildDefaultEmailForm({ ...selectedCustomer, ...detailForm }));
    emailDisclosure.onOpen();
  };

  const handleOpenSmsComposer = () => {
    setSmsForm(buildDefaultSmsForm({ ...selectedCustomer, ...detailForm }));
    setSmsStep('compose');
    smsDisclosure.onOpen();
  };

  const handleEmailChange = (event) => {
    const { name, value } = event.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSmsChange = (event) => {
    const { name, value } = event.target;
    setSmsForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadPackageActivities = useCallback(async (sale) => {
    if (!sale) return;
    try {
      const activities = await fetchPackageSalesActivities({
        customerId: sale.customerId || sale._id || sale.id,
        packageId: sale.packageId || sale._id || sale.id
      });
      setPackageActivities(Array.isArray(activities) ? activities : []);
    } catch (error) {
      console.error('Failed to load package activities', error);
      setPackageActivities([]);
    }
  }, []);

  const handleOpenPackageDetail = (sale) => {
    setSelectedPackageSale(sale);
    setPackageSmsForm(buildDefaultSmsForm(buildPackageContact(sale)));
    setPackageSmsStep('compose');
    setPackageActivities([]);
    packageDetailDisclosure.onOpen();
    loadPackageActivities(sale);
  };

  const handlePackageDetailClose = () => {
    packageDetailDisclosure.onClose();
    packageSmsDisclosure.onClose();
    setSelectedPackageSale(null);
    setPackageActivities([]);
    setPackageSmsStep('compose');
  };

  const handlePackageSmsChange = (event) => {
    const { name, value } = event.target;
    setPackageSmsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenPackageSmsComposer = () => {
    if (!selectedPackageSale) return;
    setPackageSmsForm(buildDefaultSmsForm(buildPackageContact(selectedPackageSale)));
    setPackageSmsStep('compose');
    packageSmsDisclosure.onOpen();
  };

  const handleOpenNativePackageSms = (event) => {
    event.preventDefault();
    const contact = buildPackageContact(selectedPackageSale);

    if (!contact.phone) {
      toast({ title: 'No customer phone number', status: 'warning', duration: 2500 });
      return;
    }

    if (!packageSmsForm.body.trim()) {
      toast({ title: 'SMS message is required', status: 'warning', duration: 2500 });
      return;
    }

    const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
    window.location.href = `sms:${contact.phone}${separator}body=${encodeURIComponent(packageSmsForm.body.trim())}`;
    setPackageSmsStep('confirm');
  };

  const handleLogPackageSms = async () => {
    if (!selectedPackageSale) return;
    const contact = buildPackageContact(selectedPackageSale);

    setLoggingPackageSms(true);
    try {
      const activity = await logPackageSalesActivity({
        activityType: 'sms',
        customerId: selectedPackageSale.customerId || selectedPackageSale._id || selectedPackageSale.id,
        packageId: selectedPackageSale.packageId || selectedPackageSale._id || selectedPackageSale.id,
        customerType: contact.customerType,
        customerName: contact.customerName,
        phone: contact.phone,
        email: contact.email,
        packageName: contact.packageName,
        packageType: contact.packageType,
        body: packageSmsForm.body,
        status: 'marked_sent'
      });
      setPackageActivities((prev) => [activity, ...prev]);
      packageSmsDisclosure.onClose();
      setPackageSmsStep('compose');
      toast({ title: 'Package SMS activity logged', status: 'success', duration: 2600 });
    } catch (error) {
      toast({
        title: 'Could not log SMS',
        description: error.response?.data?.message || error.message || 'Please try again.',
        status: 'error',
        duration: 3200
      });
    } finally {
      setLoggingPackageSms(false);
    }
  };

  const handleCreateTraining = async () => {
    const selectedCourse = courses.find((course) => course.name === trainingForm.contactTitle);
    const payload = {
      ...trainingForm,
      customerName: trainingForm.customerName.trim() || trainingForm.contactTitle || 'New Customer',
      contactTitle: trainingForm.contactTitle,
      courseName: trainingForm.contactTitle,
      courseId: selectedCourse?._id,
      coursePrice: Number(selectedCourse?.price) || 0,
      phone: trainingForm.phone.trim(),
      email: trainingForm.email.trim().toLowerCase(),
      note: trainingForm.note.trim(),
      source: 'Sales',
      pipelineStatus: 'Assigned'
    };

    const created = await createCustomer(payload);
    const mapped = {
      ...created,
      _id: created._id,
      id: created._id,
      date: created.date || created.createdAt || new Date().toISOString(),
      schedulePreference: created.schedulePreference || created.schedule || 'Regular'
    };
    setCustomers((prev) => [mapped, ...prev]);
    setTrainingForm(emptyTrainingForm);
  };

  const handleCreatePackage = async () => {
    const payload = {
      customerName: packageForm.customerName.trim(),
      contactPerson: packageForm.contactPerson.trim(),
      phoneNumber: packageForm.phoneNumber.trim(),
      email: packageForm.email.trim().toLowerCase(),
      packageName: packageForm.packageName.trim(),
      packageType: packageForm.packageType,
      status: packageForm.status,
      purchaseDate: new Date().toISOString(),
      expiryDate: packageForm.expiryDate || undefined,
      notes: packageForm.notes.trim()
    };

    if (!payload.customerName) {
      throw new Error('Customer name is required');
    }

    await createPackageSale(payload);
    await loadPackages();
    setPackageForm(emptyPackageForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (section === 'packages') {
        await handleCreatePackage();
      } else {
        await handleCreateTraining();
      }
      toast({
        title: section === 'packages' ? 'Package sale added' : 'Training follow-up added',
        status: 'success',
        duration: 2200
      });
      addDisclosure.onClose();
    } catch (error) {
      toast({
        title: 'Could not save',
        description: error.response?.data?.message || error.message || 'Please check the form and try again.',
        status: 'error',
        duration: 3200
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDetail = async (event) => {
    event.preventDefault();
    if (!selectedCustomer?._id && !selectedCustomer?.id) return;
    if (!detailEditMode) return;

    const customerId = selectedCustomer._id || selectedCustomer.id;
    const selectedCourse = courses.find((course) => course.name === detailForm.contactTitle);
    const payload = {
      ...detailForm,
      customerName: detailForm.customerName.trim() || detailForm.contactTitle || 'New Customer',
      contactTitle: detailForm.contactTitle,
      courseName: detailForm.contactTitle,
      courseId: selectedCourse?._id || selectedCustomer.courseId,
      coursePrice: selectedCourse ? Number(selectedCourse.price) || 0 : selectedCustomer.coursePrice,
      phone: detailForm.phone.trim(),
      email: detailForm.email.trim().toLowerCase(),
      note: detailForm.note.trim()
    };

    setSavingDetail(true);
    try {
      const updated = await updateCustomer(customerId, payload);
      const mapped = {
        ...selectedCustomer,
        ...updated,
        _id: updated._id || customerId,
        id: updated._id || customerId,
        date: updated.date || updated.createdAt || selectedCustomer.date || new Date().toISOString(),
        schedulePreference: updated.schedulePreference || updated.schedule || payload.schedulePreference || 'Regular'
      };
      setCustomers((prev) => prev.map((customer) => {
        const id = customer._id || customer.id;
        return id === customerId ? mapped : customer;
      }));
      setSelectedCustomer(mapped);
      setDetailEditMode(false);
      toast({ title: 'Customer updated', status: 'success', duration: 2200 });
      detailDisclosure.onClose();
    } catch (error) {
      toast({
        title: 'Could not update customer',
        description: error.response?.data?.message || error.message || 'Please check the fields and try again.',
        status: 'error',
        duration: 3200
      });
    } finally {
      setSavingDetail(false);
    }
  };

  const handleSendEmail = async (event) => {
    event.preventDefault();
    const customerId = selectedCustomer?._id || selectedCustomer?.id;
    if (!customerId) return;

    if (!detailForm.email) {
      toast({ title: 'No customer email', status: 'warning', duration: 2500 });
      return;
    }

    setSendingEmail(true);
    try {
      const result = await sendCustomerEmail(customerId, {
        subject: emailForm.subject,
        body: emailForm.body
      });
      const sentRecord = {
        id: result.messageId || `${customerId}-${Date.now()}`,
        subject: result.subject || emailForm.subject,
        body: emailForm.body,
        to: result.to || detailForm.email,
        sentAt: result.sentAt || new Date().toISOString()
      };
      setSentEmails((prev) => [sentRecord, ...prev]);
      setDetailTab('activity');
      emailDisclosure.onClose();
      toast({ title: 'Email sent', status: 'success', duration: 2400 });
      await loadCustomers();
    } catch (error) {
      toast({
        title: 'Email failed',
        description: error.response?.data?.message || error.message || 'Please check SMTP settings and try again.',
        status: 'error',
        duration: 3600
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenNativeSms = (event) => {
    event.preventDefault();

    if (!detailForm.phone) {
      toast({ title: 'No customer phone number', status: 'warning', duration: 2500 });
      return;
    }

    if (!smsForm.body.trim()) {
      toast({ title: 'SMS message is required', status: 'warning', duration: 2500 });
      return;
    }

    const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
    window.location.href = `sms:${detailForm.phone}${separator}body=${encodeURIComponent(smsForm.body.trim())}`;
    setSmsStep('confirm');
  };

  const handleLogSms = async () => {
    const customerId = selectedCustomer?._id || selectedCustomer?.id;
    if (!customerId) return;

    setSendingSms(true);
    try {
      const result = await sendCustomerSms(customerId, {
        body: smsForm.body
      });
      const smsRecord = {
        id: result.messageId || `${customerId}-sms-${Date.now()}`,
        body: result.body || smsForm.body,
        to: result.to || detailForm.phone,
        sentAt: result.sentAt || new Date().toISOString(),
        deliveryStatus: result.deliveryStatus || 'logged',
        providerConfigured: Boolean(result.providerConfigured)
      };
      setSentSmsMessages((prev) => [smsRecord, ...prev]);
      setDetailTab('activity');
      smsDisclosure.onClose();
      setSmsStep('compose');
      toast({
        title: 'SMS activity logged',
        description: 'The SMS action is now saved on this customer.',
        status: 'success',
        duration: 3000
      });
      await loadCustomers();
    } catch (error) {
      toast({
        title: 'SMS failed',
        description: error.response?.data?.message || error.message || 'Please check SMS settings and try again.',
        status: 'error',
        duration: 3600
      });
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <Box position="relative" bg={theme.page} minH="calc(100vh - 158px)">
      <InputGroup mb={3}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="#9AA4B5" />
        </InputLeftElement>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          bg="white"
          borderColor={theme.border}
          borderRadius="12px"
          placeholder={section === 'packages' ? 'Search packages...' : 'Search contacts...'}
          _placeholder={{ color: '#9AA4B5', fontWeight: 700 }}
          fontSize="14px"
          h="44px"
          color={theme.ink}
          fontWeight="800"
          boxShadow="0 8px 22px rgba(8, 26, 52, 0.04)"
        />
      </InputGroup>

      <Flex align="center" justify="space-between" mb={3} gap={2}>
        <HStack spacing={1} borderWidth="1px" borderColor={theme.border} borderRadius="12px" p={0.5} bg="white" boxShadow="0 8px 22px rgba(8, 26, 52, 0.04)">
          <Button
            size="sm"
            borderRadius="10px"
            bg={section === 'trainings' ? theme.navy : 'transparent'}
            color={section === 'trainings' ? 'white' : theme.muted}
            _hover={{ bg: section === 'trainings' ? theme.navy : theme.goldSoft }}
            onClick={() => {
              setSection('trainings');
              setStatusFilter('');
            }}
          >
            Trainings
          </Button>
          <Button
            size="sm"
            borderRadius="10px"
            bg={section === 'packages' ? theme.navy : 'transparent'}
            color={section === 'packages' ? 'white' : theme.muted}
            _hover={{ bg: section === 'packages' ? theme.navy : theme.goldSoft }}
            onClick={() => {
              setSection('packages');
              setStatusFilter('');
            }}
          >
            Packages
          </Button>
        </HStack>
        <HStack spacing={1}>
          <IconButton aria-label="Search" icon={<FiSearch />} variant="ghost" color={theme.ink} size="sm" />
          <IconButton aria-label="Filters" icon={<FiFilter />} variant="ghost" color={theme.ink} size="sm" />
        </HStack>
      </Flex>

      <HStack spacing={2} overflowX="auto" pb={2} mb={3}>
        {activeFilters.map((option) => {
          const active = statusFilter === option.value;
          return (
            <Button
              key={option.label}
              size="sm"
              flexShrink={0}
              borderRadius="10px"
              bg={active ? theme.gold : 'white'}
              color={active ? 'white' : theme.ink}
              borderWidth="1px"
              borderColor={active ? theme.gold : theme.border}
              _hover={{ bg: active ? '#C98D00' : theme.goldSoft }}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
        <IconButton aria-label="Customize fields" icon={<FiSliders />} size="sm" variant="outline" color={theme.ink} borderColor={theme.border} flexShrink={0} />
      </HStack>

      {isLoading ? (
        <Center py={12}>
          <Spinner color={theme.gold} />
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="13px" color={theme.ink} fontWeight="900">
            {visibleItems.length} results
          </Text>
          {section === 'packages'
            ? filteredPackages.map((sale) => (
              <MobilePackageCard
                key={sale.id || sale._id || `${sale.customerName}-${sale.packageName}`}
                sale={sale}
                onOpenDetail={handleOpenPackageDetail}
              />
            ))
            : filteredCustomers.map((customer) => (
              <MobileFollowupCard
                key={customer._id || customer.id}
                customer={customer}
                visibleColumns={visibleColumns}
                onOpenDetail={handleOpenDetail}
              />
            ))}
        </VStack>
      )}

      <IconButton
        aria-label={section === 'packages' ? 'Add package sale' : 'Add training follow-up'}
        icon={<FiPlus />}
        position="fixed"
        right={5}
        bottom="86px"
        size="lg"
        borderRadius="full"
        bg={theme.gold}
        color="white"
        boxShadow="0 14px 30px rgba(217, 154, 0, 0.38)"
        _hover={{ bg: '#C98D00' }}
        onClick={addDisclosure.onOpen}
      />

      <Modal isOpen={detailDisclosure.isOpen} onClose={handleDetailClose} size="full" motionPreset="slideInRight">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUpdateDetail} bg={theme.page} minH="100dvh" borderRadius={0}>
          <Box bg={`linear-gradient(180deg, ${theme.navy} 0%, ${theme.navyLight} 100%)`} color="white" px={3} pt={3} pb={3} boxShadow="0 14px 32px rgba(0, 31, 77, 0.18)">
            <Flex align="flex-start" justify="space-between" gap={2}>
              <IconButton
                aria-label="Back to follow-ups"
                icon={<FiArrowLeft />}
                variant="ghost"
                color="white"
                fontSize="20px"
                size="sm"
                minW="32px"
                h="32px"
                onClick={handleDetailClose}
                isDisabled={savingDetail}
                _hover={{ bg: 'whiteAlpha.200' }}
              />
              <HStack flex="1" minW={0} spacing={2.5} align="flex-start">
                <Center
                  w="48px"
                  h="48px"
                  borderRadius="12px"
                  bg="white"
                  color={theme.navy}
                  fontWeight="900"
                  fontSize="15px"
                  flexShrink={0}
                  boxShadow="0 8px 18px rgba(0, 0, 0, 0.18)"
                >
                  {getInitials(selectedCustomer?.customerName)}
                </Center>
                <Box minW={0} flex="1" pt="1px">
                  <Text fontSize="9px" color={theme.gold} fontWeight="900" lineHeight="1">Lead Details</Text>
                  <Text fontSize="18px" fontWeight="900" lineHeight="1.15" noOfLines={1}>
                    {selectedCustomer?.customerName || 'Customer detail'}
                  </Text>
                  <HStack spacing={1} mt="2px" color="rgba(255,255,255,0.82)">
                    <Text fontSize="10px" fontWeight="700" noOfLines={1}>
                      {selectedCustomer?.contactTitle || selectedCustomer?.courseName || 'Training follow-up'}
                    </Text>
                    <Icon as={FiCheckCircle} color="#2F80FF" boxSize={3} flexShrink={0} />
                  </HStack>
                </Box>
              </HStack>
              <IconButton
                aria-label="More customer actions"
                icon={<FiMoreVertical />}
                variant="ghost"
                color="white"
                fontSize="20px"
                size="sm"
                minW="32px"
                h="32px"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Flex>

            <SimpleGrid columns={4} spacing={4} mt={4} px={5}>
              <VStack spacing={2}>
                <Center
                  as="a"
                  href={detailForm.phone ? `tel:${detailForm.phone}` : undefined}
                  w="45px"
                  h="45px"
                  borderRadius="full"
                  bg="white"
                  color="#16A36F"
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                >
                  <Icon as={FiPhone} boxSize={4.5} />
                </Center>
                <Text fontSize="10px" fontWeight="900">Call</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="button"
                  type="button"
                  w="45px"
                  h="45px"
                  borderRadius="full"
                  bg="white"
                  color={detailForm.email ? '#2F6FED' : '#94a3b8'}
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                  onClick={handleOpenEmailComposer}
                  isDisabled={!detailForm.email}
                >
                  <Icon as={FiMail} boxSize={4.5} />
                </Center>
                <Text fontSize="10px" fontWeight="900">Email</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="button"
                  type="button"
                  w="45px"
                  h="45px"
                  borderRadius="full"
                  bg="white"
                  color={detailForm.phone ? '#7C3AED' : '#94a3b8'}
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                  onClick={handleOpenSmsComposer}
                  isDisabled={!detailForm.phone}
                >
                  <Icon as={FiMessageCircle} boxSize={4.5} />
                </Center>
                <Text fontSize="10px" fontWeight="900">SMS</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="button"
                  type="button"
                  w="45px"
                  h="45px"
                  borderRadius="full"
                  bg="white"
                  color={detailEditMode ? theme.gold : theme.navy}
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                  onClick={() => setDetailEditMode((value) => !value)}
                >
                  <Icon as={FiEdit3} boxSize={4.5} />
                </Center>
                <Text fontSize="10px" fontWeight="900">{detailEditMode ? 'Editing' : 'Edit'}</Text>
              </VStack>
            </SimpleGrid>

            <SimpleGrid columns={3} spacing={2} mt={4}>
              <Flex bg="rgba(255,255,255,0.10)" borderRadius="8px" p={2.5} minW={0} align="center" gap={2}>
                <Icon as={FiPhone} boxSize={4} color="rgba(255,255,255,0.82)" />
                <Box minW={0}>
                  <Text fontSize="8px" color="rgba(255,255,255,0.72)" fontWeight="900" textTransform="uppercase">Call</Text>
                  <Text fontSize="11px" color="white" fontWeight="900" noOfLines={1}>{detailForm.callStatus}</Text>
                </Box>
              </Flex>
              <Flex bg="rgba(255,255,255,0.10)" borderRadius="8px" p={2.5} minW={0} align="center" gap={2}>
                <Icon as={FiUser} boxSize={4} color="rgba(255,255,255,0.82)" />
                <Box minW={0}>
                  <Text fontSize="8px" color="rgba(255,255,255,0.72)" fontWeight="900" textTransform="uppercase">Follow-up</Text>
                  <Text fontSize="11px" color="white" fontWeight="900" noOfLines={1}>{detailForm.followupStatus}</Text>
                </Box>
              </Flex>
              <Flex bg="rgba(255,255,255,0.10)" borderRadius="8px" p={2.5} minW={0} align="center" gap={2}>
                <Icon as={FiTarget} boxSize={4} color="rgba(255,255,255,0.82)" />
                <Box minW={0}>
                  <Text fontSize="8px" color="rgba(255,255,255,0.72)" fontWeight="900" textTransform="uppercase">Scope</Text>
                  <Text fontSize="11px" color="white" fontWeight="900" noOfLines={1}>{detailForm.packageScope || 'Local'}</Text>
                </Box>
              </Flex>
            </SimpleGrid>
          </Box>

          <ModalBody px={4} py={4} overflowY="auto">
            <HStack spacing={4} borderBottomWidth="1px" borderBottomColor={theme.border} mb={4} overflowX="auto">
              {detailTabs.map((tab) => {
                const active = detailTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    type="button"
                    flexShrink={0}
                    variant="ghost"
                    size="sm"
                    px={2}
                    pb={2}
                    borderRadius={0}
                    borderBottomWidth="3px"
                    borderBottomColor={active ? theme.gold : 'transparent'}
                    color={active ? theme.navy : theme.muted}
                    fontWeight="900"
                    _hover={{ bg: 'transparent', color: theme.navy }}
                    onClick={() => setDetailTab(tab.key)}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </HStack>

            {detailTab === 'activity' && (
              <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
                <Flex align="center" justify="space-between" mb={4}>
                  <Box>
                    <Text fontSize="16px" color={theme.ink} fontWeight="900">Activity center</Text>
                    <Text fontSize="11px" color={theme.muted} fontWeight="700">Quick actions and the current follow-up state.</Text>
                  </Box>
                  <Badge colorScheme={statusColor(detailForm.callStatus)} borderRadius="md" px={2} py={1}>
                    {detailForm.callStatus}
                  </Badge>
                </Flex>

                <SimpleGrid columns={4} spacing={3}>
                  <VStack spacing={2} align="center">
                    <Center as="a" href={detailForm.phone ? `tel:${detailForm.phone}` : undefined} w="48px" h="48px" borderRadius="full" bg={theme.goldSoft} color={theme.gold}>
                      <Icon as={FiPhone} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Call</Text>
                  </VStack>
                  <VStack spacing={2} align="center">
                    <Center as="button" type="button" w="48px" h="48px" borderRadius="full" bg="#eef5ff" color={detailForm.email ? '#3182ce' : '#94a3b8'} onClick={handleOpenEmailComposer} isDisabled={!detailForm.email}>
                      <Icon as={FiMail} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Email</Text>
                  </VStack>
                  <VStack spacing={2} align="center">
                    <Center as="button" type="button" w="48px" h="48px" borderRadius="full" bg="#f2ecff" color={detailForm.phone ? '#7c3aed' : '#94a3b8'} onClick={handleOpenSmsComposer} isDisabled={!detailForm.phone}>
                      <Icon as={FiMessageCircle} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">SMS</Text>
                  </VStack>
                  <VStack spacing={2} align="center">
                    <Center as="button" type="button" w="48px" h="48px" borderRadius="full" bg="#fff7df" color="#d9901f" onClick={() => setDetailTab('notes')}>
                      <Icon as={FiEdit3} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Note</Text>
                  </VStack>
                </SimpleGrid>

                <Box bg={theme.page} borderRadius="12px" p={3} mt={4}>
                  <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={2}>
                    Follow-up for {detailForm.contactTitle || 'training'}
                  </Text>
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                    <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                    <Badge colorScheme="teal">{detailForm.schedulePreference}</Badge>
                  </HStack>
                  <Text mt={2} fontSize="12px" color={theme.muted} fontWeight="700">
                    Last activity: {formatDate(selectedCustomer?.date || selectedCustomer?.createdAt)}
                  </Text>
                </Box>
                {sentEmails.length > 0 && (
                  <VStack align="stretch" spacing={3} mt={4}>
                    {sentEmails.map((email) => (
                      <Box key={email.id} bg="#ecfeff" borderRadius="12px" p={3} borderWidth="1px" borderColor="#b2f5ea">
                        <HStack justify="space-between" align="flex-start">
                          <Box minW={0}>
                            <Text fontSize="10px" color={theme.navy} fontWeight="900" textTransform="uppercase">Logged Email</Text>
                            <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{email.subject}</Text>
                          </Box>
                          <Text fontSize="10px" color={theme.muted} fontWeight="800" flexShrink={0}>{formatTime(email.sentAt)}</Text>
                        </HStack>
                        <Text mt={2} fontSize="12px" color="#334155" fontWeight="700" noOfLines={3} whiteSpace="pre-line">
                          {email.body}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                )}
                {sentSmsMessages.length > 0 && (
                  <VStack align="stretch" spacing={3} mt={4}>
                    {sentSmsMessages.map((sms) => (
                      <Box key={sms.id} bg="#f5f3ff" borderRadius="12px" p={3} borderWidth="1px" borderColor="#ddd6fe">
                        <HStack justify="space-between" align="flex-start">
                          <Box minW={0}>
                            <Text fontSize="10px" color="#6d28d9" fontWeight="900" textTransform="uppercase">
                              {sms.providerConfigured ? 'Sent SMS' : 'Logged SMS'}
                            </Text>
                            <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>
                              To {sms.to}
                            </Text>
                          </Box>
                          <Text fontSize="10px" color={theme.muted} fontWeight="800" flexShrink={0}>{formatTime(sms.sentAt)}</Text>
                        </HStack>
                        <Text mt={2} fontSize="12px" color="#334155" fontWeight="700" noOfLines={3} whiteSpace="pre-line">
                          {sms.body}
                        </Text>
                        <Badge mt={2} colorScheme={sms.providerConfigured ? 'green' : 'purple'} borderRadius="md">
                          {sms.deliveryStatus}
                        </Badge>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            )}

            {detailTab === 'about' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={4}>
                <Box>
                  <Text fontSize="16px" color={theme.ink} fontWeight="900">Customer details</Text>
                  <Text fontSize="11px" color={theme.muted} fontWeight="700">Update the values for this follow-up record.</Text>
                </Box>
                <Badge colorScheme={statusColor(detailForm.followupStatus)} borderRadius="md" px={2} py={1}>
                  {detailForm.followupStatus}
                </Badge>
              </Flex>

              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Customer name</FormLabel>
                  <Input name="customerName" value={detailForm.customerName} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg={theme.page} h="46px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Training</FormLabel>
                  <Select name="contactTitle" value={detailForm.contactTitle} onChange={handleDetailChange} isDisabled={!detailEditMode} bg={theme.page} h="46px" borderRadius="12px" placeholder="Select training">
                    {detailCourseOptions.map((course) => (
                      <option key={course._id} value={course.name}>
                        {course.name}{Number(course.price) ? ` - ETB ${Number(course.price).toLocaleString()}` : ''}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Phone</FormLabel>
                    <Input name="phone" value={detailForm.phone} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Email</FormLabel>
                    <Input name="email" type="email" value={detailForm.email} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px" />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Call status</FormLabel>
                    <Select name="callStatus" value={detailForm.callStatus} onChange={handleDetailChange} isDisabled={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px">
                      <option value="Not Called">Not Called</option>
                      <option value="Called">Called</option>
                      <option value="Busy">Busy</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Callback">Callback</option>
                      <option value="2x Called">2x Called</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Follow-up</FormLabel>
                    <Select name="followupStatus" value={detailForm.followupStatus} onChange={handleDetailChange} isDisabled={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px">
                      <option value="Prospect">Prospect</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Imported">Imported</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Schedule</FormLabel>
                    <Select name="schedulePreference" value={detailForm.schedulePreference} onChange={handleDetailChange} isDisabled={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px">
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Scope</FormLabel>
                    <Select name="packageScope" value={detailForm.packageScope} onChange={handleDetailChange} isDisabled={!detailEditMode} bg={theme.page} h="44px" borderRadius="12px">
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Note</FormLabel>
                  <Textarea name="note" value={detailForm.note} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg={theme.page} borderRadius="12px" rows={4} />
                </FormControl>
              </VStack>
            </Box>
            )}

            {detailTab === 'associations' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Text fontSize="16px" color={theme.ink} fontWeight="900" mb={1}>Associations</Text>
              <Text fontSize="11px" color={theme.muted} fontWeight="700" mb={4}>Related training and sales context for this contact.</Text>
              <SimpleGrid columns={1} spacing={3}>
                <Box bg={theme.page} borderRadius="12px" p={3} borderWidth="1px" borderColor={theme.border}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Training</Text>
                  <Text fontSize="14px" color={theme.ink} fontWeight="900" mt={1}>{detailForm.contactTitle || 'No training selected'}</Text>
                  <Text fontSize="12px" color={theme.muted} fontWeight="700" mt={1}>Course price: ETB {Number(selectedCustomer?.coursePrice || 0).toLocaleString()}</Text>
                </Box>
                <Box bg={theme.page} borderRadius="12px" p={3} borderWidth="1px" borderColor={theme.border}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Sales status</Text>
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                    <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                    <Badge colorScheme="teal">{detailForm.packageScope || 'Local'}</Badge>
                  </HStack>
                </Box>
                <Box bg={theme.page} borderRadius="12px" p={3} borderWidth="1px" borderColor={theme.border}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Ownership</Text>
                  <Text fontSize="14px" color={theme.ink} fontWeight="900" mt={1}>{selectedCustomer?.agentName || 'Assigned sales account'}</Text>
                  <Text fontSize="12px" color={theme.muted} fontWeight="700" mt={1}>Created {formatDate(selectedCustomer?.createdAt || selectedCustomer?.date)}</Text>
                </Box>
              </SimpleGrid>
            </Box>
            )}

            {detailTab === 'notes' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={3}>
                <Box>
                  <Text fontSize="16px" color={theme.ink} fontWeight="900">Notes</Text>
                  <Text fontSize="11px" color={theme.muted} fontWeight="700">View notes, then tap Edit to update them.</Text>
                </Box>
                <Button type="button" size="sm" borderRadius="10px" colorScheme="teal" variant={detailEditMode ? 'solid' : 'outline'} onClick={() => setDetailEditMode((value) => !value)}>
                  {detailEditMode ? 'Editing' : 'Edit'}
                </Button>
              </Flex>
              <Textarea name="note" value={detailForm.note} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg={theme.page} borderRadius="12px" rows={8} placeholder="No notes added yet." />
            </Box>
            )}

            {detailTab === 'activity' && (
            <>
            <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor={theme.border}>
              <Text fontSize="16px" color={theme.ink} fontWeight="900" mb={3}>Quick actions</Text>
              <SimpleGrid columns={3} spacing={3}>
                <VStack spacing={2} align="center">
                  <Center w="48px" h="48px" borderRadius="full" bg={theme.goldSoft} color={theme.gold}>
                    <Icon as={FiEdit3} boxSize={5} />
                  </Center>
                  <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Add note</Text>
                </VStack>
                <VStack spacing={2} align="center">
                  <Center w="48px" h="48px" borderRadius="full" bg="#eef5ff" color="#3182ce">
                    <Icon as={FiCalendar} boxSize={5} />
                  </Center>
                  <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Task</Text>
                </VStack>
                <VStack spacing={2} align="center">
                  <Center w="48px" h="48px" borderRadius="full" bg="#fff7df" color="#d9901f">
                    <Icon as={FiPlus} boxSize={5} />
                  </Center>
                  <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Activity</Text>
                </VStack>
              </SimpleGrid>
            </Box>

            <Box bg="white" borderRadius="16px" p={4} mt={4} mb="86px" borderWidth="1px" borderColor={theme.border}>
              <Text fontSize="16px" color={theme.ink} fontWeight="900" mb={3}>Upcoming</Text>
              <Box bg={theme.page} borderRadius="12px" p={3}>
                <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={2}>
                  Follow-up for {detailForm.contactTitle || 'training'}
                </Text>
                <HStack mt={2} spacing={2}>
                  <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                  <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                </HStack>
                <Text mt={2} fontSize="12px" color={theme.muted} fontWeight="700">
                  Last activity: {formatDate(selectedCustomer?.date || selectedCustomer?.createdAt)}
                </Text>
              </Box>
            </Box>
            </>
            )}
          </ModalBody>

          <ModalFooter
            position="fixed"
            left={0}
            right={0}
            bottom={0}
            px={4}
            py={3}
            bg="white"
            borderTopWidth="1px"
            borderTopColor="#d9e2ea"
            gap={3}
          >
            {detailEditMode ? (
              <>
                <Button
                  flex={1}
                  h="46px"
                  borderRadius="12px"
                  variant="ghost"
                  onClick={() => {
                    setDetailForm(buildCustomerDetailForm(selectedCustomer));
                    setDetailEditMode(false);
                  }}
                  isDisabled={savingDetail}
                >
                  Cancel
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit" isLoading={savingDetail}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button w="100%" h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="button" onClick={handleDetailClose}>
                Done
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={packageDetailDisclosure.isOpen} onClose={handlePackageDetailClose} size="full" motionPreset="slideInRight">
        <ModalOverlay />
        <ModalContent bg={theme.page} minH="100dvh" borderRadius={0}>
          <Box bg="linear-gradient(135deg, #0f766e 0%, #0b5f63 58%, #12343b 100%)" color="white" px={4} pt={4} pb={5} boxShadow="0 12px 28px rgba(15, 23, 42, 0.18)">
            <Flex align="center" justify="space-between" gap={3}>
              <IconButton
                aria-label="Back to packages"
                icon={<FiArrowLeft />}
                variant="ghost"
                color="#16b9c6"
                fontSize="24px"
                onClick={handlePackageDetailClose}
              />
              <Center
                w="52px"
                h="52px"
                borderRadius="16px"
                bg="rgba(255, 255, 255, 0.16)"
                color="white"
                fontWeight="900"
                fontSize="18px"
                flexShrink={0}
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.3)"
              >
                {getInitials(selectedPackageContact.customerName)}
              </Center>
              <Box minW={0} flex="1">
                <Text fontSize="12px" color="#9fb3c8" fontWeight="900">Package</Text>
                <Text fontSize="22px" fontWeight="900" noOfLines={1}>
                  {selectedPackageContact.customerName}
                </Text>
                <Text fontSize="12px" color="#c8d4e1" fontWeight="700" noOfLines={1}>
                  {selectedPackageContact.packageName}
                </Text>
              </Box>
              <IconButton aria-label="More package actions" icon={<FiMoreVertical />} variant="ghost" color="#16b9c6" fontSize="22px" />
            </Flex>

            <SimpleGrid columns={3} spacing={3} mt={5}>
              <VStack spacing={2}>
                <Center
                  as="a"
                  href={selectedPackageContact.phone ? `tel:${selectedPackageContact.phone}` : undefined}
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.78)"
                  bg="rgba(255, 255, 255, 0.96)"
                  color={selectedPackageContact.phone ? theme.navy : '#94a3b8'}
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                >
                  <Icon as={FiPhone} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">Call</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="button"
                  type="button"
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.78)"
                  bg="rgba(255, 255, 255, 0.96)"
                  color={selectedPackageContact.phone ? theme.navy : '#94a3b8'}
                  boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)"
                  onClick={handleOpenPackageSmsComposer}
                  isDisabled={!selectedPackageContact.phone}
                >
                  <Icon as={FiMessageCircle} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">SMS</Text>
              </VStack>
              <VStack spacing={2}>
                <Center w="54px" h="54px" borderRadius="full" borderWidth="1px" borderColor="rgba(255, 255, 255, 0.78)" bg="rgba(255, 255, 255, 0.96)" color={theme.navy} boxShadow="0 8px 18px rgba(15, 23, 42, 0.16)">
                  <Icon as={FiCalendar} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">Follow-up</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <ModalBody px={4} py={4} overflowY="auto" pb="88px">
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={4}>
                <Box>
                  <Text fontSize="16px" color={theme.ink} fontWeight="900">Package details</Text>
                  <Text fontSize="11px" color={theme.muted} fontWeight="700">Customer and package context for this sale.</Text>
                </Box>
                <Badge colorScheme={statusColor(selectedPackageContact.status)} borderRadius="md" px={2} py={1}>
                  {selectedPackageContact.status}
                </Badge>
              </Flex>

              <SimpleGrid columns={2} spacing={3}>
                <Box bg={theme.page} borderRadius="12px" p={3}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Phone</Text>
                  <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{selectedPackageContact.phone || 'No phone'}</Text>
                </Box>
                <Box bg={theme.page} borderRadius="12px" p={3}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Email</Text>
                  <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{selectedPackageContact.email || 'No email'}</Text>
                </Box>
                <Box bg={theme.page} borderRadius="12px" p={3}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Package type</Text>
                  <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{selectedPackageContact.packageType || 'N/A'}</Text>
                </Box>
                <Box bg={theme.page} borderRadius="12px" p={3}>
                  <Text fontSize="10px" color={theme.muted} fontWeight="900" textTransform="uppercase">Customer type</Text>
                  <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{selectedPackageContact.customerType}</Text>
                </Box>
              </SimpleGrid>
            </Box>

            <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={3}>
                <Box>
                  <Text fontSize="16px" color={theme.ink} fontWeight="900">Activity</Text>
                  <Text fontSize="11px" color={theme.muted} fontWeight="700">Tracked actions for this package customer.</Text>
                </Box>
                <Button size="sm" borderRadius="10px" colorScheme="teal" onClick={handleOpenPackageSmsComposer} isDisabled={!selectedPackageContact.phone}>
                  SMS
                </Button>
              </Flex>

              {packageActivities.length === 0 ? (
                <Box bg={theme.page} borderRadius="12px" p={4}>
                  <Text fontSize="13px" color={theme.muted} fontWeight="800">No package activities logged yet.</Text>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {packageActivities.map((activity) => (
                    <Box key={activity._id || activity.id} bg={activity.activityType === 'sms' ? '#f5f3ff' : '#ecfeff'} borderRadius="12px" p={3} borderWidth="1px" borderColor={activity.activityType === 'sms' ? '#ddd6fe' : '#b2f5ea'}>
                      <HStack justify="space-between" align="flex-start">
                        <Box minW={0}>
                          <Text fontSize="10px" color={activity.activityType === 'sms' ? '#6d28d9' : theme.navy} fontWeight="900" textTransform="uppercase">
                            {activity.activityType === 'sms' ? 'Logged SMS' : 'Activity'}
                          </Text>
                          <Text fontSize="13px" color={theme.ink} fontWeight="900" noOfLines={1}>{activity.packageName || selectedPackageContact.packageName}</Text>
                        </Box>
                        <Text fontSize="10px" color={theme.muted} fontWeight="800" flexShrink={0}>{formatTime(activity.createdAt)}</Text>
                      </HStack>
                      <Text mt={2} fontSize="12px" color="#334155" fontWeight="700" noOfLines={3} whiteSpace="pre-line">
                        {activity.body}
                      </Text>
                      <Badge mt={2} colorScheme="purple" borderRadius="md">{activity.status || 'logged'}</Badge>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </ModalBody>

          <ModalFooter position="fixed" left={0} right={0} bottom={0} px={4} py={3} bg="white" borderTopWidth="1px" borderTopColor="#d9e2ea">
            <Button w="100%" h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="button" onClick={handlePackageDetailClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={emailDisclosure.isOpen} onClose={() => !sendingEmail && emailDisclosure.onClose()} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.54)" />
        <ModalContent
          as="form"
          onSubmit={handleSendEmail}
          mt="auto"
          mb={0}
          mx={0}
          minH="auto"
          maxH="88vh"
          borderTopRadius="26px"
          borderBottomRadius={0}
          overflow="hidden"
          bg="#13212b"
          color={theme.border}
        >
          <Box w="54px" h="5px" bg="#526574" borderRadius="full" mx="auto" mt={3} />
          <ModalHeader px={5} pt={5} pb={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <HStack spacing={3} minW={0}>
                <IconButton
                  aria-label="Close email composer"
                  icon={<FiArrowLeft />}
                  variant="ghost"
                  color="#16b9c6"
                  fontSize="24px"
                  onClick={() => emailDisclosure.onClose()}
                  isDisabled={sendingEmail}
                />
                <Box minW={0}>
                  <Text fontSize="20px" fontWeight="900">Logged Email</Text>
                  <Text fontSize="12px" color="#9fb3c8" fontWeight="700" noOfLines={1}>
                    To: {detailForm.email || 'No email'}
                  </Text>
                </Box>
              </HStack>
              <Button type="submit" size="sm" borderRadius="10px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} isLoading={sendingEmail}>
                Send
              </Button>
            </Flex>
          </ModalHeader>
          <ModalBody px={5} py={4} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="11px" color="#9fb3c8" fontWeight="900" mb={2}>Date</Text>
                <Badge colorScheme="teal" fontSize="12px" px={3} py={1} borderRadius="md">
                  {new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </Box>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#c8d4e1" fontWeight="900">Subject</FormLabel>
                <Input
                  name="subject"
                  value={emailForm.subject}
                  onChange={handleEmailChange}
                  bg="#1d2c36"
                  borderColor="#334858"
                  color={theme.border}
                  h="46px"
                  borderRadius="12px"
                  _placeholder={{ color: '#718096' }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#c8d4e1" fontWeight="900">Message</FormLabel>
                <Textarea
                  name="body"
                  value={emailForm.body}
                  onChange={handleEmailChange}
                  bg="#1d2c36"
                  borderColor="#334858"
                  color={theme.border}
                  borderRadius="12px"
                  rows={12}
                  resize="vertical"
                  placeholder="Write the email message..."
                  _placeholder={{ color: '#718096' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter px={5} py={4} gap={3} bg="#13212b" borderTopWidth="1px" borderTopColor="#243946">
            <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color="#c8d4e1" onClick={() => emailDisclosure.onClose()} isDisabled={sendingEmail}>
              Cancel
            </Button>
            <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit" isLoading={sendingEmail}>
              Send Email
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={smsDisclosure.isOpen} onClose={() => !sendingSms && smsDisclosure.onClose()} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.54)" />
        <ModalContent
          as="form"
          onSubmit={handleOpenNativeSms}
          mt="auto"
          mb={0}
          mx={0}
          minH="auto"
          maxH="82vh"
          borderTopRadius="26px"
          borderBottomRadius={0}
          overflow="hidden"
          bg="#13212b"
          color={theme.border}
        >
          <Box w="54px" h="5px" bg="#526574" borderRadius="full" mx="auto" mt={3} />
          <ModalHeader px={5} pt={5} pb={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <HStack spacing={3} minW={0}>
                <IconButton
                  aria-label="Close SMS composer"
                  icon={<FiArrowLeft />}
                  variant="ghost"
                  color="#16b9c6"
                  fontSize="24px"
                  onClick={() => smsDisclosure.onClose()}
                  isDisabled={sendingSms}
                />
                <Box minW={0}>
                  <Text fontSize="20px" fontWeight="900">{smsStep === 'confirm' ? 'Confirm SMS' : 'Compose SMS'}</Text>
                  <Text fontSize="12px" color="#9fb3c8" fontWeight="700" noOfLines={1}>
                    To: {detailForm.phone || 'No phone'}
                  </Text>
                </Box>
              </HStack>
              {smsStep === 'compose' ? (
                <Button type="submit" size="sm" borderRadius="10px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }}>
                  Open
                </Button>
              ) : (
                <Button type="button" size="sm" borderRadius="10px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} isLoading={sendingSms} onClick={handleLogSms}>
                  Log
                </Button>
              )}
            </Flex>
          </ModalHeader>
          <ModalBody px={5} py={4} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="11px" color="#9fb3c8" fontWeight="900" mb={2}>Date</Text>
                <Badge colorScheme="teal" fontSize="12px" px={3} py={1} borderRadius="md">
                  {new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </Box>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#c8d4e1" fontWeight="900">Message</FormLabel>
                <Textarea
                  name="body"
                  value={smsForm.body}
                  onChange={handleSmsChange}
                  isReadOnly={smsStep === 'confirm'}
                  bg="#1d2c36"
                  borderColor="#334858"
                  color={theme.border}
                  borderRadius="12px"
                  rows={7}
                  maxLength={480}
                  resize="vertical"
                  placeholder="Write the SMS message..."
                  _placeholder={{ color: '#718096' }}
                />
                <Text mt={2} fontSize="11px" color="#9fb3c8" fontWeight="700" textAlign="right">
                  {smsForm.body.length}/480
                </Text>
              </FormControl>
              <Box bg="rgba(19, 166, 163, 0.12)" borderWidth="1px" borderColor="rgba(19, 166, 163, 0.28)" borderRadius="12px" p={3}>
                <Text fontSize="12px" color="#c8d4e1" fontWeight="700">
                  {smsStep === 'confirm'
                    ? 'After sending from your phone SMS app, mark it as sent here to save it on this customer activity.'
                    : 'The portal will open your phone SMS app with this message prefilled. After sending, return here to log the activity.'}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter px={5} py={4} gap={3} bg="#13212b" borderTopWidth="1px" borderTopColor="#243946">
            {smsStep === 'compose' ? (
              <>
                <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color="#c8d4e1" onClick={() => smsDisclosure.onClose()}>
                  Cancel
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit">
                  Open SMS App
                </Button>
              </>
            ) : (
              <>
                <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color="#c8d4e1" onClick={() => smsDisclosure.onClose()} isDisabled={sendingSms}>
                  Skip
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="button" isLoading={sendingSms} onClick={handleLogSms}>
                  Mark as Sent
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={packageSmsDisclosure.isOpen} onClose={() => !loggingPackageSms && packageSmsDisclosure.onClose()} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.54)" />
        <ModalContent
          as="form"
          onSubmit={handleOpenNativePackageSms}
          mt="auto"
          mb={0}
          mx={0}
          minH="auto"
          maxH="82vh"
          borderTopRadius="26px"
          borderBottomRadius={0}
          overflow="hidden"
          bg="#13212b"
          color={theme.border}
        >
          <Box w="54px" h="5px" bg="#526574" borderRadius="full" mx="auto" mt={3} />
          <ModalHeader px={5} pt={5} pb={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <HStack spacing={3} minW={0}>
                <IconButton
                  aria-label="Close package SMS composer"
                  icon={<FiArrowLeft />}
                  variant="ghost"
                  color="#16b9c6"
                  fontSize="24px"
                  onClick={() => packageSmsDisclosure.onClose()}
                  isDisabled={loggingPackageSms}
                />
                <Box minW={0}>
                  <Text fontSize="20px" fontWeight="900">{packageSmsStep === 'confirm' ? 'Confirm SMS' : 'Compose SMS'}</Text>
                  <Text fontSize="12px" color="#9fb3c8" fontWeight="700" noOfLines={1}>
                    To: {selectedPackageContact.phone || 'No phone'}
                  </Text>
                </Box>
              </HStack>
              {packageSmsStep === 'compose' ? (
                <Button type="submit" size="sm" borderRadius="10px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }}>
                  Open
                </Button>
              ) : (
                <Button type="button" size="sm" borderRadius="10px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} isLoading={loggingPackageSms} onClick={handleLogPackageSms}>
                  Log
                </Button>
              )}
            </Flex>
          </ModalHeader>
          <ModalBody px={5} py={4} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="11px" color="#9fb3c8" fontWeight="900" mb={2}>Date</Text>
                <Badge colorScheme="teal" fontSize="12px" px={3} py={1} borderRadius="md">
                  {new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </Box>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#c8d4e1" fontWeight="900">Message</FormLabel>
                <Textarea
                  name="body"
                  value={packageSmsForm.body}
                  onChange={handlePackageSmsChange}
                  isReadOnly={packageSmsStep === 'confirm'}
                  bg="#1d2c36"
                  borderColor="#334858"
                  color={theme.border}
                  borderRadius="12px"
                  rows={7}
                  maxLength={480}
                  resize="vertical"
                  placeholder="Write the SMS message..."
                  _placeholder={{ color: '#718096' }}
                />
                <Text mt={2} fontSize="11px" color="#9fb3c8" fontWeight="700" textAlign="right">
                  {packageSmsForm.body.length}/480
                </Text>
              </FormControl>
              <Box bg="rgba(19, 166, 163, 0.12)" borderWidth="1px" borderColor="rgba(19, 166, 163, 0.28)" borderRadius="12px" p={3}>
                <Text fontSize="12px" color="#c8d4e1" fontWeight="700">
                  {packageSmsStep === 'confirm'
                    ? 'After sending from your phone SMS app, mark it as sent here to save it on this package activity.'
                    : 'The portal will open your phone SMS app with this message prefilled. After sending, return here to log the package activity.'}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter px={5} py={4} gap={3} bg="#13212b" borderTopWidth="1px" borderTopColor="#243946">
            {packageSmsStep === 'compose' ? (
              <>
                <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color="#c8d4e1" onClick={() => packageSmsDisclosure.onClose()}>
                  Cancel
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit">
                  Open SMS App
                </Button>
              </>
            ) : (
              <>
                <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color="#c8d4e1" onClick={() => packageSmsDisclosure.onClose()} isDisabled={loggingPackageSms}>
                  Skip
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="button" isLoading={loggingPackageSms} onClick={handleLogPackageSms}>
                  Mark as Sent
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={addDisclosure.isOpen} onClose={handleAddClose} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.34)" />
        <ModalContent
          as="form"
          onSubmit={handleSubmit}
          mt="auto"
          mb={0}
          mx={0}
          minH="auto"
          maxH="88vh"
          borderTopRadius="26px"
          borderBottomRadius={0}
          overflow="hidden"
          bg={theme.page}
        >
          <ModalHeader px={5} pt={5} pb={2}>
            <Text fontSize="20px" color="#111827" fontWeight="900">{modalTitle}</Text>
            <Text fontSize="12px" color={theme.muted} fontWeight="700" mt={1}>
              {section === 'packages'
                ? 'Create a package sales record for this sales account.'
                : 'Create a customer follow-up from mobile with the same training data as desktop.'}
            </Text>
          </ModalHeader>
          <ModalCloseButton top={5} right={4} borderRadius="full" bg="white" />
          <ModalBody px={5} py={3} overflowY="auto">
            {section === 'packages' ? (
              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Customer name</FormLabel>
                  <Input name="customerName" value={packageForm.customerName} onChange={handlePackageChange} bg="white" h="46px" borderRadius="12px" />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Contact</FormLabel>
                    <Input name="contactPerson" value={packageForm.contactPerson} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Phone</FormLabel>
                    <Input name="phoneNumber" value={packageForm.phoneNumber} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Email</FormLabel>
                  <Input name="email" type="email" value={packageForm.email} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Package name</FormLabel>
                    <Input name="packageName" value={packageForm.packageName} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Package type</FormLabel>
                    <Select name="packageType" value={packageForm.packageType} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" placeholder="Select">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((type) => (
                        <option key={type} value={type}>Package {type}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Status</FormLabel>
                    <Select name="status" value={packageForm.status} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px">
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Expiry date</FormLabel>
                    <Input name="expiryDate" type="date" value={packageForm.expiryDate} onChange={handlePackageChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Notes</FormLabel>
                  <Textarea name="notes" value={packageForm.notes} onChange={handlePackageChange} bg="white" borderRadius="12px" rows={3} />
                </FormControl>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Customer name</FormLabel>
                  <Input name="customerName" value={trainingForm.customerName} onChange={handleTrainingChange} bg="white" h="46px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Training</FormLabel>
                  <Select name="contactTitle" value={trainingForm.contactTitle} onChange={handleTrainingChange} bg="white" h="46px" borderRadius="12px" placeholder="Select training">
                    {trainingCourseOptions.map((course) => (
                      <option key={course._id} value={course.name}>
                        {course.name}{Number(course.price) ? ` - ETB ${Number(course.price).toLocaleString()}` : ''}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Phone</FormLabel>
                    <Input name="phone" value={trainingForm.phone} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Email</FormLabel>
                    <Input name="email" type="email" value={trainingForm.email} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px" />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Call status</FormLabel>
                    <Select name="callStatus" value={trainingForm.callStatus} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px">
                      <option value="Not Called">Not Called</option>
                      <option value="Called">Called</option>
                      <option value="Busy">Busy</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Callback">Callback</option>
                      <option value="2x Called">2x Called</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Follow-up</FormLabel>
                    <Select name="followupStatus" value={trainingForm.followupStatus} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px">
                      <option value="Prospect">Prospect</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Imported">Imported</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Schedule</FormLabel>
                    <Select name="schedulePreference" value={trainingForm.schedulePreference} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px">
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Scope</FormLabel>
                    <Select name="packageScope" value={trainingForm.packageScope} onChange={handleTrainingChange} bg="white" h="44px" borderRadius="12px">
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Note</FormLabel>
                  <Textarea name="note" value={trainingForm.note} onChange={handleTrainingChange} bg="white" borderRadius="12px" rows={3} />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter px={5} py={4} gap={3} bg="white" borderTopWidth="1px" borderTopColor="#e2e8f0">
            <Button flex={1} h="46px" borderRadius="12px" variant="ghost" onClick={handleAddClose} isDisabled={saving}>
              Cancel
            </Button>
            <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit" isLoading={saving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileFollowups;


