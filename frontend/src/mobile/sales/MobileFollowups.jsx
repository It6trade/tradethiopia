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
  FiEdit3,
  FiFilter,
  FiMail,
  FiMessageCircle,
  FiMoreVertical,
  FiPhone,
  FiPlus,
  FiSearch,
  FiSliders
} from 'react-icons/fi';
import { getAllCustomers, createCustomer, updateCustomer } from '../../services/customerService';
import { fetchExternalCourses } from '../../services/api';
import { fetchPackageSales, createPackageSale } from '../../services/packageService';

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
      boxShadow="0 8px 22px rgba(15, 23, 42, 0.08)"
      borderWidth="1px"
      borderColor="#edf2f7"
      transition="transform 0.18s ease, box-shadow 0.18s ease"
      _active={{ transform: 'scale(0.99)' }}
      onClick={() => onOpenDetail(customer)}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg="#e9f6ff" color="#1086d4" flexShrink={0} fontWeight="900">
            {getInitials(customer.customerName)}
          </Center>
          <Box minW={0}>
            <Text color="#162033" fontSize="15px" fontWeight="900" noOfLines={1}>
              {customer.customerName || 'Unnamed customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color="#283647" fontWeight="700">{formatDate(customer.date || customer.createdAt)}</Text>
          <Text fontSize="10px" color="#283647" fontWeight="700" mt={1}>{formatTime(customer.date || customer.createdAt)}</Text>
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
            <Box key={column.key} bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
              <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
                {column.label}
              </Text>
              <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
                {getFieldValue(customer, column.key)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#e9fbf1" color="#19a56b">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#eaf4ff" color="#3182ce">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="span" w="30px" h="30px" borderRadius="8px" bg="#f2ecff" color="#8956dc">
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <Icon as={FiMoreVertical} color="#253244" />
      </Flex>
    </Box>
  );
};

const MobilePackageCard = ({ sale }) => {
  const packageValue = Number(sale.packageValue || (Number(sale.packageType) || 0) * 1000 || 0);

  return (
    <Box bg="white" borderRadius="14px" p={4} boxShadow="0 8px 22px rgba(15, 23, 42, 0.08)" borderWidth="1px" borderColor="#edf2f7">
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg="#fff7df" color="#d9901f" flexShrink={0} fontWeight="900">
            {getInitials(sale.customerName || sale.companyName || sale.contactPerson)}
          </Center>
          <Box minW={0}>
            <Text color="#162033" fontSize="15px" fontWeight="900" noOfLines={1}>
              {sale.customerName || sale.companyName || 'Package customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.phoneNumber || sale.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color="#283647" fontWeight="700">{formatDate(sale.purchaseDate || sale.createdAt)}</Text>
          <Text fontSize="10px" color="#283647" fontWeight="700" mt={1}>{sale.customerType || 'Package'}</Text>
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
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Package Type
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.packageType ? `#${sale.packageType}` : 'N/A'}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Value
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            ETB {packageValue.toLocaleString()}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Agent
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.agentName || 'N/A'}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Contact
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.contactPerson || 'N/A'}
          </Text>
        </Box>
      </SimpleGrid>

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#e9fbf1" color="#19a56b">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#eaf4ff" color="#3182ce">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#fff7df" color="#d9901f">
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <IconButton aria-label="More actions" icon={<FiMoreVertical />} variant="ghost" color="#253244" size="sm" />
      </Flex>
    </Box>
  );
};

const MobileFollowups = () => {
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
  const toast = useToast();
  const addDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const visibleColumns = useMemo(readVisibleColumns, []);

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
    detailDisclosure.onOpen();
  };

  const handleDetailClose = () => {
    if (savingDetail) return;
    detailDisclosure.onClose();
    setSelectedCustomer(null);
    setDetailEditMode(false);
    setDetailTab('activity');
  };

  const handleAddClose = () => {
    if (saving) return;
    addDisclosure.onClose();
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

  return (
    <Box position="relative">
      <InputGroup mb={3}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="#8b98a8" />
        </InputLeftElement>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          bg="white"
          borderColor="#e2e8f0"
          borderRadius="10px"
          placeholder={section === 'packages' ? 'Search packages...' : 'Search contacts...'}
          fontSize="14px"
          h="42px"
        />
      </InputGroup>

      <Flex align="center" justify="space-between" mb={3} gap={2}>
        <HStack spacing={1} borderWidth="1px" borderColor="#dce7ef" borderRadius="10px" p={0.5} bg="white">
          <Button
            size="sm"
            borderRadius="8px"
            colorScheme={section === 'trainings' ? 'teal' : 'gray'}
            variant={section === 'trainings' ? 'solid' : 'ghost'}
            onClick={() => {
              setSection('trainings');
              setStatusFilter('');
            }}
          >
            Trainings
          </Button>
          <Button
            size="sm"
            borderRadius="8px"
            colorScheme={section === 'packages' ? 'teal' : 'gray'}
            variant={section === 'packages' ? 'solid' : 'ghost'}
            onClick={() => {
              setSection('packages');
              setStatusFilter('');
            }}
          >
            Packages
          </Button>
        </HStack>
        <HStack spacing={1}>
          <IconButton aria-label="Search" icon={<FiSearch />} variant="ghost" color="#253244" size="sm" />
          <IconButton aria-label="Filters" icon={<FiFilter />} variant="ghost" color="#253244" size="sm" />
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
              borderRadius="9px"
              colorScheme={active ? 'teal' : 'gray'}
              variant={active ? 'solid' : 'outline'}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
        <IconButton aria-label="Customize fields" icon={<FiSliders />} size="sm" variant="outline" flexShrink={0} />
      </HStack>

      {isLoading ? (
        <Center py={12}>
          <Spinner color="teal.500" />
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="13px" color="#253244" fontWeight="900">
            {visibleItems.length} results
          </Text>
          {section === 'packages'
            ? filteredPackages.map((sale) => (
              <MobilePackageCard key={sale.id || sale._id || `${sale.customerName}-${sale.packageName}`} sale={sale} />
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
        bg="#13a6a3"
        color="white"
        boxShadow="0 12px 28px rgba(19, 166, 163, 0.35)"
        _hover={{ bg: '#0f8f8c' }}
        onClick={addDisclosure.onOpen}
      />

      <Modal isOpen={detailDisclosure.isOpen} onClose={handleDetailClose} size="full" motionPreset="slideInRight">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUpdateDetail} bg="#f8fafc" minH="100dvh" borderRadius={0}>
          <Box bg="linear-gradient(135deg, #0f766e 0%, #0b5f63 58%, #12343b 100%)" color="white" px={4} pt={4} pb={5} boxShadow="0 12px 28px rgba(15, 23, 42, 0.18)">
            <Flex align="center" justify="space-between" gap={3}>
              <IconButton
                aria-label="Back to follow-ups"
                icon={<FiArrowLeft />}
                variant="ghost"
                color="#16b9c6"
                fontSize="24px"
                onClick={handleDetailClose}
                isDisabled={savingDetail}
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
                boxShadow="0 8px 18px rgba(15, 23, 42, 0.18)"
              >
                {getInitials(selectedCustomer?.customerName)}
              </Center>
              <Box minW={0} flex="1">
                <Text fontSize="12px" color="#9fb3c8" fontWeight="900">Contact</Text>
                <Text fontSize="22px" fontWeight="900" noOfLines={1}>
                  {selectedCustomer?.customerName || 'Customer detail'}
                </Text>
                <Text fontSize="12px" color="#c8d4e1" fontWeight="700" noOfLines={1}>
                  {selectedCustomer?.contactTitle || selectedCustomer?.courseName || 'Training follow-up'}
                </Text>
              </Box>
              <IconButton
                aria-label="More customer actions"
                icon={<FiMoreVertical />}
                variant="ghost"
                color="#16b9c6"
                fontSize="22px"
              />
            </Flex>

            <SimpleGrid columns={4} spacing={3} mt={5}>
              <VStack spacing={2}>
                <Center
                  as="a"
                  href={detailForm.phone ? `tel:${detailForm.phone}` : undefined}
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="#15b8c8"
                  color="#15b8c8"
                >
                  <Icon as={FiPhone} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">Call</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="a"
                  href={detailForm.email ? `mailto:${detailForm.email}` : undefined}
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="#15b8c8"
                  color="#15b8c8"
                >
                  <Icon as={FiMail} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">Email</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="a"
                  href={detailForm.phone ? `sms:${detailForm.phone}` : undefined}
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor={detailForm.phone ? '#15b8c8' : '#466174'}
                  color={detailForm.phone ? '#15b8c8' : '#8ea4b8'}
                >
                  <Icon as={FiMessageCircle} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">SMS</Text>
              </VStack>
              <VStack spacing={2}>
                <Center
                  as="button"
                  type="button"
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor={detailEditMode ? '#13a6a3' : '#15b8c8'}
                  bg={detailEditMode ? 'rgba(19, 166, 163, 0.16)' : 'transparent'}
                  color="#15b8c8"
                  onClick={() => setDetailEditMode((value) => !value)}
                >
                  <Icon as={FiEdit3} boxSize={5} />
                </Center>
                <Text fontSize="12px" fontWeight="900">{detailEditMode ? 'Editing' : 'Edit'}</Text>
              </VStack>
            </SimpleGrid>

            <SimpleGrid columns={3} spacing={2} mt={5}>
              <Box bg="rgba(255,255,255,0.08)" borderRadius="12px" p={3} minW={0}>
                <Text fontSize="9px" color="#9fb3c8" fontWeight="900" textTransform="uppercase">Call</Text>
                <Text fontSize="12px" color="white" fontWeight="900" noOfLines={1}>{detailForm.callStatus}</Text>
              </Box>
              <Box bg="rgba(255,255,255,0.08)" borderRadius="12px" p={3} minW={0}>
                <Text fontSize="9px" color="#9fb3c8" fontWeight="900" textTransform="uppercase">Follow-up</Text>
                <Text fontSize="12px" color="white" fontWeight="900" noOfLines={1}>{detailForm.followupStatus}</Text>
              </Box>
              <Box bg="rgba(255,255,255,0.08)" borderRadius="12px" p={3} minW={0}>
                <Text fontSize="9px" color="#9fb3c8" fontWeight="900" textTransform="uppercase">Scope</Text>
                <Text fontSize="12px" color="white" fontWeight="900" noOfLines={1}>{detailForm.packageScope || 'Local'}</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <ModalBody px={4} py={4} overflowY="auto">
            <HStack spacing={2} borderBottomWidth="1px" borderBottomColor="#d9e2ea" mb={4} overflowX="auto">
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
                    borderBottomColor={active ? '#13a6a3' : 'transparent'}
                    color={active ? '#0f766e' : '#64748b'}
                    fontWeight="900"
                    _hover={{ bg: 'transparent', color: '#0f766e' }}
                    onClick={() => setDetailTab(tab.key)}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </HStack>

            {detailTab === 'activity' && (
              <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor="#e5edf3" boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
                <Flex align="center" justify="space-between" mb={4}>
                  <Box>
                    <Text fontSize="16px" color="#172033" fontWeight="900">Activity center</Text>
                    <Text fontSize="11px" color="#64748b" fontWeight="700">Quick actions and the current follow-up state.</Text>
                  </Box>
                  <Badge colorScheme={statusColor(detailForm.callStatus)} borderRadius="md" px={2} py={1}>
                    {detailForm.callStatus}
                  </Badge>
                </Flex>

                <SimpleGrid columns={3} spacing={3}>
                  <VStack spacing={2} align="center">
                    <Center as="a" href={detailForm.phone ? `tel:${detailForm.phone}` : undefined} w="48px" h="48px" borderRadius="full" bg="#e8fbf7" color="#13a6a3">
                      <Icon as={FiPhone} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Call</Text>
                  </VStack>
                  <VStack spacing={2} align="center">
                    <Center as="a" href={detailForm.email ? `mailto:${detailForm.email}` : undefined} w="48px" h="48px" borderRadius="full" bg="#eef5ff" color="#3182ce">
                      <Icon as={FiMail} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Email</Text>
                  </VStack>
                  <VStack spacing={2} align="center">
                    <Center as="button" type="button" w="48px" h="48px" borderRadius="full" bg="#fff7df" color="#d9901f" onClick={() => setDetailTab('notes')}>
                      <Icon as={FiEdit3} boxSize={5} />
                    </Center>
                    <Text fontSize="11px" color="#334155" fontWeight="900" textAlign="center">Note</Text>
                  </VStack>
                </SimpleGrid>

                <Box bg="#f8fafc" borderRadius="12px" p={3} mt={4}>
                  <Text fontSize="13px" color="#172033" fontWeight="900" noOfLines={2}>
                    Follow-up for {detailForm.contactTitle || 'training'}
                  </Text>
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                    <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                    <Badge colorScheme="teal">{detailForm.schedulePreference}</Badge>
                  </HStack>
                  <Text mt={2} fontSize="12px" color="#64748b" fontWeight="700">
                    Last activity: {formatDate(selectedCustomer?.date || selectedCustomer?.createdAt)}
                  </Text>
                </Box>
              </Box>
            )}

            {detailTab === 'about' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor="#e5edf3" boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={4}>
                <Box>
                  <Text fontSize="16px" color="#172033" fontWeight="900">Customer details</Text>
                  <Text fontSize="11px" color="#64748b" fontWeight="700">Update the values for this follow-up record.</Text>
                </Box>
                <Badge colorScheme={statusColor(detailForm.followupStatus)} borderRadius="md" px={2} py={1}>
                  {detailForm.followupStatus}
                </Badge>
              </Flex>

              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Customer name</FormLabel>
                  <Input name="customerName" value={detailForm.customerName} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg="#f8fafc" h="46px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Training</FormLabel>
                  <Select name="contactTitle" value={detailForm.contactTitle} onChange={handleDetailChange} isDisabled={!detailEditMode} bg="#f8fafc" h="46px" borderRadius="12px" placeholder="Select training">
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
                    <Input name="phone" value={detailForm.phone} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Email</FormLabel>
                    <Input name="email" type="email" value={detailForm.email} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px" />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Call status</FormLabel>
                    <Select name="callStatus" value={detailForm.callStatus} onChange={handleDetailChange} isDisabled={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px">
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
                    <Select name="followupStatus" value={detailForm.followupStatus} onChange={handleDetailChange} isDisabled={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px">
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
                    <Select name="schedulePreference" value={detailForm.schedulePreference} onChange={handleDetailChange} isDisabled={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px">
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="12px" color="#334155" fontWeight="800">Scope</FormLabel>
                    <Select name="packageScope" value={detailForm.packageScope} onChange={handleDetailChange} isDisabled={!detailEditMode} bg="#f8fafc" h="44px" borderRadius="12px">
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="800">Note</FormLabel>
                  <Textarea name="note" value={detailForm.note} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg="#f8fafc" borderRadius="12px" rows={4} />
                </FormControl>
              </VStack>
            </Box>
            )}

            {detailTab === 'associations' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor="#e5edf3" boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Text fontSize="16px" color="#172033" fontWeight="900" mb={1}>Associations</Text>
              <Text fontSize="11px" color="#64748b" fontWeight="700" mb={4}>Related training and sales context for this contact.</Text>
              <SimpleGrid columns={1} spacing={3}>
                <Box bg="#f8fafc" borderRadius="12px" p={3} borderWidth="1px" borderColor="#e5edf3">
                  <Text fontSize="10px" color="#64748b" fontWeight="900" textTransform="uppercase">Training</Text>
                  <Text fontSize="14px" color="#172033" fontWeight="900" mt={1}>{detailForm.contactTitle || 'No training selected'}</Text>
                  <Text fontSize="12px" color="#64748b" fontWeight="700" mt={1}>Course price: ETB {Number(selectedCustomer?.coursePrice || 0).toLocaleString()}</Text>
                </Box>
                <Box bg="#f8fafc" borderRadius="12px" p={3} borderWidth="1px" borderColor="#e5edf3">
                  <Text fontSize="10px" color="#64748b" fontWeight="900" textTransform="uppercase">Sales status</Text>
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                    <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                    <Badge colorScheme="teal">{detailForm.packageScope || 'Local'}</Badge>
                  </HStack>
                </Box>
                <Box bg="#f8fafc" borderRadius="12px" p={3} borderWidth="1px" borderColor="#e5edf3">
                  <Text fontSize="10px" color="#64748b" fontWeight="900" textTransform="uppercase">Ownership</Text>
                  <Text fontSize="14px" color="#172033" fontWeight="900" mt={1}>{selectedCustomer?.agentName || 'Assigned sales account'}</Text>
                  <Text fontSize="12px" color="#64748b" fontWeight="700" mt={1}>Created {formatDate(selectedCustomer?.createdAt || selectedCustomer?.date)}</Text>
                </Box>
              </SimpleGrid>
            </Box>
            )}

            {detailTab === 'notes' && (
            <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor="#e5edf3" boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
              <Flex align="center" justify="space-between" mb={3}>
                <Box>
                  <Text fontSize="16px" color="#172033" fontWeight="900">Notes</Text>
                  <Text fontSize="11px" color="#64748b" fontWeight="700">View notes, then tap Edit to update them.</Text>
                </Box>
                <Button type="button" size="sm" borderRadius="10px" colorScheme="teal" variant={detailEditMode ? 'solid' : 'outline'} onClick={() => setDetailEditMode((value) => !value)}>
                  {detailEditMode ? 'Editing' : 'Edit'}
                </Button>
              </Flex>
              <Textarea name="note" value={detailForm.note} onChange={handleDetailChange} isReadOnly={!detailEditMode} bg="#f8fafc" borderRadius="12px" rows={8} placeholder="No notes added yet." />
            </Box>
            )}

            {detailTab === 'activity' && (
            <>
            <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor="#e5edf3">
              <Text fontSize="16px" color="#172033" fontWeight="900" mb={3}>Quick actions</Text>
              <SimpleGrid columns={3} spacing={3}>
                <VStack spacing={2} align="center">
                  <Center w="48px" h="48px" borderRadius="full" bg="#e8fbf7" color="#13a6a3">
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

            <Box bg="white" borderRadius="16px" p={4} mt={4} mb="86px" borderWidth="1px" borderColor="#e5edf3">
              <Text fontSize="16px" color="#172033" fontWeight="900" mb={3}>Upcoming</Text>
              <Box bg="#f8fafc" borderRadius="12px" p={3}>
                <Text fontSize="13px" color="#172033" fontWeight="900" noOfLines={2}>
                  Follow-up for {detailForm.contactTitle || 'training'}
                </Text>
                <HStack mt={2} spacing={2}>
                  <Badge colorScheme={statusColor(detailForm.callStatus)}>{detailForm.callStatus}</Badge>
                  <Badge colorScheme={statusColor(detailForm.followupStatus)}>{detailForm.followupStatus}</Badge>
                </HStack>
                <Text mt={2} fontSize="12px" color="#64748b" fontWeight="700">
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
                <Button flex={1} h="46px" borderRadius="12px" bg="#13a6a3" color="white" _hover={{ bg: '#0f8f8c' }} type="submit" isLoading={savingDetail}>
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button flex={1} h="46px" borderRadius="12px" variant="ghost" onClick={handleDetailClose}>
                  Done
                </Button>
                <Button flex={1} h="46px" borderRadius="12px" bg="#13a6a3" color="white" _hover={{ bg: '#0f8f8c' }} type="button" onClick={() => setDetailEditMode(true)}>
                  Edit details
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
          bg="#f8fafc"
        >
          <ModalHeader px={5} pt={5} pb={2}>
            <Text fontSize="20px" color="#111827" fontWeight="900">{modalTitle}</Text>
            <Text fontSize="12px" color="#64748b" fontWeight="700" mt={1}>
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
            <Button flex={1} h="46px" borderRadius="12px" bg="#13a6a3" color="white" _hover={{ bg: '#0f8f8c' }} type="submit" isLoading={saving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileFollowups;
