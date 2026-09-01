import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Button,
  HStack,
  IconButton,
  SimpleGrid,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  FormControl,
  FormLabel,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
  useToast,
  useColorModeValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiBookOpen,
  FiBell,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import { BsPinAngleFill, BsPinAngle } from 'react-icons/bs';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/user';
import { getAuthItem } from '../utils/authStorage';
import Layout from '../components/customer/Layout';
import {
  getNotices,
  getNoticeStats,
  createNotice,
  updateNotice,
  deleteNotice,
  recordNoticeView,
  togglePinNotice,
} from '../services/noticeService';

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: FiFilter, color: 'gray' },
  { value: 'training', label: 'Training 🎓', icon: FiBookOpen, color: 'purple' },
  { value: 'price_change', label: 'Price Changes 💰', icon: FiDollarSign, color: 'green' },
  { value: 'update', label: 'Important Updates 📢', icon: FiBell, color: 'blue' },
  { value: 'urgent_alert', label: 'Urgent Alerts 🚨', icon: FiAlertTriangle, color: 'red' },
  { value: 'policy', label: 'Policy & Guidelines 📜', icon: FiFileText, color: 'teal' },
  { value: 'general', label: 'General 💡', icon: FiCheckCircle, color: 'gray' },
];

const normalizeRole = (role = '') =>
  role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const isManagerUser = (user) => {
  const role = normalizeRole(
    user?.role ||
    user?.userRole ||
    user?.displayRole ||
    user?.normalizedRole ||
    getAuthItem('userRole') ||
    getAuthItem('userRoleRaw') ||
    ''
  );
  const managerRoles = [
    'admin',
    'administrator',
    'superadmin',
    'coo',
    'ceo',
    'customersuccessmanager',
    'csmanager',
    'manager',
    'itmanager',
    'salesmanager',
    'generalmanager',
  ];
  return (
    managerRoles.includes(role) ||
    role.includes('admin') ||
    role.includes('manager') ||
    Boolean(user?.canManageNotices || user?.permissions?.canManageUsers)
  );
};

const CustomerMessagesPage = ({ embedded = false }) => {
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'day', 'month', 'year'
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer States
  const [noticeDrawerMode, setNoticeDrawerMode] = useState(null);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    department: 'Customer Service',
    isPinned: false,
    effectiveDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // View Readers Modal State
  const [isReadersOpen, setIsReadersOpen] = useState(false);
  const [activeReadersNotice, setActiveReadersNotice] = useState(null);

  // Delete Alert State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const cancelRef = useRef();

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { currentUser: authUser } = useUserStore();

  const currentUser = useMemo(() => {
    if (authUser && (authUser._id || authUser.id || authUser.username || authUser.role)) {
      return authUser;
    }
    const token = getAuthItem('userToken');
    const role = getAuthItem('userRole') || getAuthItem('userRoleRaw');
    const username = getAuthItem('userName');
    const fullName = getAuthItem('userFullName');
    const userId = getAuthItem('userId');
    const email = getAuthItem('userEmail');
    if (token || role || username) {
      return {
        _id: userId,
        username,
        fullName,
        role,
        email,
      };
    }
    try {
      return JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, [authUser]);

  const isManager = useMemo(() => isManagerUser(currentUser), [currentUser]);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerColor = useColorModeValue('teal.700', 'teal.200');
  const panelBg = useColorModeValue('gray.50', 'gray.900');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('teal.50', 'rgba(49, 151, 149, 0.12)');
  const noticeTitleColor = useColorModeValue('gray.800', 'white');
  const noticeContentColor = useColorModeValue('gray.700', 'gray.200');
  const isCreateOpen = noticeDrawerMode === 'create';
  const isNoticeDrawerOpen = Boolean(noticeDrawerMode);

  const closeNoticeDrawer = () => {
    setNoticeDrawerMode(null);
    setEditingNotice(null);
  };

  // Fetch Notices and Stats
  const fetchNoticeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { department: 'Customer Service' };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (dateFilterType === 'day' && filterDay) params.day = filterDay;
      if (dateFilterType === 'month' && filterMonth) params.month = filterMonth;
      if (dateFilterType === 'year' && filterYear) params.year = filterYear;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [noticeListRes, statsDataRes] = await Promise.allSettled([
        getNotices(params),
        getNoticeStats({ department: 'Customer Service' }),
      ]);

      let hasSuccess = false;

      if (noticeListRes.status === 'fulfilled') {
        setNotices(Array.isArray(noticeListRes.value) ? noticeListRes.value : []);
        hasSuccess = true;
      } else {
        console.error('Error fetching notice list:', noticeListRes.reason);
      }

      if (statsDataRes.status === 'fulfilled') {
        setStats(statsDataRes.value || null);
        hasSuccess = true;
      } else {
        console.error('Error fetching notice stats:', statsDataRes.reason);
      }

      if (!hasSuccess) {
        setError('Failed to load notices. Please try again.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, dateFilterType, filterDay, filterMonth, filterYear, searchQuery]);

  useEffect(() => {
    fetchNoticeData();
  }, [fetchNoticeData]);

  // Focus notice if ID provided in query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const noticeId = params.get('notice');
    if (noticeId && notices.length > 0) {
      const el = document.getElementById(`notice-${noticeId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Automatically record view
        recordNoticeView(noticeId);
      }
    }
  }, [location.search, notices]);

  // Handle Mark as Read / Record View
  const handleNoticeClick = async (notice) => {
    if (!notice.hasViewed) {
      try {
        const res = await recordNoticeView(notice._id);
        if (res?.success) {
          setNotices((prev) =>
            prev.map((n) =>
              n._id === notice._id
                ? { ...n, hasViewed: true, viewCount: res.viewCount, views: res.views }
                : n
            )
          );
        }
      } catch (err) {
        console.error('Error recording view:', err);
      }
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      department: 'Customer Service',
      isPinned: false,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setNoticeDrawerMode('create');
  };

  // Open Edit Modal
  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      category: notice.category || 'general',
      priority: notice.priority || 'normal',
      department: notice.department || 'Customer Service',
      isPinned: Boolean(notice.isPinned),
      effectiveDate: notice.effectiveDate ? new Date(notice.effectiveDate).toISOString().split('T')[0] : '',
    });
    setNoticeDrawerMode('edit');
  };

  // Submit Create Notice
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: 'Title and content are required', status: 'warning' });
      return;
    }
    try {
      setSubmitting(true);
      await createNotice(formData);
      closeNoticeDrawer();
      await fetchNoticeData();
      toast({
        title: 'Notice posted successfully',
        description: 'All Customer Service staff members have been notified.',
        status: 'success',
      });
    } catch (err) {
      toast({
        title: 'Failed to create notice',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Notice
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingNotice?._id) return;
    try {
      setSubmitting(true);
      await updateNotice(editingNotice._id, formData);
      closeNoticeDrawer();
      await fetchNoticeData();
      toast({ title: 'Notice updated successfully', status: 'success' });
    } catch (err) {
      toast({
        title: 'Failed to update notice',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Pin Toggle
  const handleTogglePin = async (notice) => {
    try {
      await togglePinNotice(notice._id);
      setNotices((prev) =>
        prev.map((n) => (n._id === notice._id ? { ...n, isPinned: !n.isPinned } : n))
      );
      toast({
        title: notice.isPinned ? 'Notice unpinned' : 'Notice pinned to top',
        status: 'info',
        duration: 2000,
      });
    } catch (err) {
      toast({ title: 'Could not pin notice', status: 'error' });
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteNotice(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
      await fetchNoticeData();
      toast({ title: 'Notice deleted successfully', status: 'success' });
    } catch (err) {
      toast({
        title: 'Failed to delete notice',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    }
  };

  // Open Readers Modal
  const openReadersModal = (notice) => {
    setActiveReadersNotice(notice);
    setIsReadersOpen(true);
  };

  const getCategoryBadge = (category) => {
    const cat = CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
    return (
      <Badge colorScheme={cat.color} fontSize="xs" px={2} py={0.5} borderRadius="md">
        {cat.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') return <Badge colorScheme="red" variant="solid">Urgent 🚨</Badge>;
    if (priority === 'important') return <Badge colorScheme="orange">Important ⚠️</Badge>;
    return null;
  };

  const unreadCount = useMemo(() => notices.filter((n) => !n.hasViewed).length, [notices]);

  const pageContent = (
    <Box p={embedded ? 0 : { base: 4, md: 6 }} bg={embedded ? 'transparent' : panelBg} minH={embedded ? 'auto' : '100vh'}>
      {/* Header Bar */}
      <Card mb={5} borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="sm">
        <CardBody p={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} flexWrap="wrap">
            <Box>
              <HStack spacing={3} mb={1}>
                {!embedded && (
                  <IconButton
                    aria-label="Go back"
                    icon={<ArrowBackIcon />}
                    size="sm"
                    onClick={() => navigate(-1)}
                    colorScheme="teal"
                    variant="outline"
                  />
                )}
                <Heading size="lg" color={headerColor}>
                  Customer Service Notice Board
                </Heading>
              </HStack>
              <Text color={mutedText} fontSize="sm">
                Official announcements, training schedules, price updates, and operational guidelines.
              </Text>
            </Box>

            <HStack spacing={3} flexWrap="wrap">
              {unreadCount > 0 && (
                <Badge colorScheme="red" fontSize="sm" px={3} py={1} borderRadius="full">
                  {unreadCount} Unread Notice{unreadCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <IconButton
                aria-label="Refresh notices"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={fetchNoticeData}
                isLoading={loading}
              />
              {isManager && (
                <Button type="button" colorScheme="teal" leftIcon={<FiPlus />} size="sm" onClick={openCreateModal}>
                  Create Customer Service Notice
                </Button>
              )}
            </HStack>
          </Flex>

          {/* Quick Metrics Bar */}
          {stats && (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={3} mt={5} pt={4} borderTop="1px solid" borderColor={borderColor}>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">Total Notices</Text>
                <Text fontSize="xl" fontWeight="800">{stats.totalNotices || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">Total Reads</Text>
                <Text fontSize="xl" fontWeight="800" color="teal.500">{stats.totalViews || 0} 👁️</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">🎓 Training</Text>
                <Text fontSize="xl" fontWeight="800" color="purple.500">{stats.categories?.training || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">💰 Price Changes</Text>
                <Text fontSize="xl" fontWeight="800" color="green.500">{stats.categories?.price_change || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">📢 Updates</Text>
                <Text fontSize="xl" fontWeight="800" color="blue.500">{stats.categories?.update || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">🚨 Urgent</Text>
                <Text fontSize="xl" fontWeight="800" color="red.500">{stats.categories?.urgent_alert || 0}</Text>
              </Box>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Date & Category Management Controls */}
      <Card mb={5} borderRadius="xl" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="sm">
        <CardBody py={4} px={4}>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={4} justify="space-between" align={{ base: 'stretch', lg: 'center' }}>
            {/* Category Filter Chips */}
            <Wrap spacing={2} rowGap={2} maxW={{ base: '100%', lg: '62%' }} align="center">
              {CATEGORIES.map((cat) => (
                <WrapItem key={cat.value}>
                <Button
                  size="xs"
                  variant={selectedCategory === cat.value ? 'solid' : 'outline'}
                  colorScheme={cat.color}
                  onClick={() => setSelectedCategory(cat.value)}
                  whiteSpace="normal"
                  h="auto"
                  minH="30px"
                  px={2.5}
                  py={1}
                  lineHeight="1.15"
                  textAlign="left"
                  maxW={{ base: '100%', sm: '220px' }}
                >
                  {cat.label}
                </Button>
                </WrapItem>
              ))}
            </Wrap>

            {/* Date Filters & Search */}
            <HStack spacing={3} flexWrap="wrap" justify={{ base: 'flex-start', lg: 'flex-end' }}>
              <HStack spacing={1}>
                <Select
                  size="sm"
                  w="110px"
                  value={dateFilterType}
                  onChange={(e) => {
                    setDateFilterType(e.target.value);
                    if (e.target.value === 'all') {
                      setFilterDay('');
                      setFilterMonth('');
                      setFilterYear('');
                    }
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="day">By Day</option>
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </Select>

                {dateFilterType === 'day' && (
                  <Input
                    size="sm"
                    type="date"
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                    w="140px"
                  />
                )}
                {dateFilterType === 'month' && (
                  <Input
                    size="sm"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    w="140px"
                  />
                )}
                {dateFilterType === 'year' && (
                  <Select
                    size="sm"
                    w="100px"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                )}
              </HStack>

              <InputGroup size="sm" maxW="200px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Notices Feed */}
      {loading ? (
        <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
          <Spinner size="xl" color="teal.500" thickness="4px" />
          <Text color="gray.500" fontSize="sm">Loading notices...</Text>
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          {error}
        </Alert>
      ) : notices.length === 0 ? (
        <Card borderRadius="2xl" border="1px dashed" borderColor={borderColor} p={8} textAlign="center">
          <CardBody>
            <Box mb={3} fontSize="4xl">📋</Box>
            <Heading size="md" mb={2}>No notices found</Heading>
            <Text color={mutedText} fontSize="sm" maxW="450px" mx="auto" mb={4}>
              There are currently no announcements matching your filters.
              {isManager && ' Use the button above to post the first update for your team.'}
            </Text>
            {isManager && (
              <Button type="button" colorScheme="teal" size="sm" leftIcon={<FiPlus />} onClick={openCreateModal}>
                Create Customer Service Notice
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {notices.map((notice) => {
            const isPinned = Boolean(notice.isPinned);
            const isUnread = !notice.hasViewed;

            return (
              <Card
                key={notice._id}
                id={`notice-${notice._id}`}
                borderRadius="xl"
                borderWidth={isPinned ? '2px' : '1px'}
                borderColor={isPinned ? 'teal.400' : isUnread ? 'blue.300' : borderColor}
                bg={isPinned ? highlightBg : cardBg}
                boxShadow={isPinned ? 'md' : 'sm'}
                transition="all 0.2s"
                _hover={{ borderColor: 'teal.400', boxShadow: 'md' }}
                onClick={() => handleNoticeClick(notice)}
              >
                <CardHeader pb={2} pt={4} px={{ base: 4, md: 5 }}>
                  <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} flexWrap="wrap">
                    <HStack spacing={2} flexWrap="wrap">
                      {isPinned && (
                        <Badge colorScheme="teal" variant="solid" display="flex" alignItems="center" gap={1}>
                          <BsPinAngleFill /> PINNED
                        </Badge>
                      )}
                      {getCategoryBadge(notice.category)}
                      {getPriorityBadge(notice.priority)}
                      {isUnread && (
                        <Badge colorScheme="blue" variant="solid" borderRadius="full">
                          NEW / UNREAD
                        </Badge>
                      )}
                    </HStack>

                    {/* Manager & Info Actions */}
                    <HStack spacing={2}>
                      <Tooltip label="Total staff views">
                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<FiEye />}
                          colorScheme="teal"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReadersModal(notice);
                          }}
                        >
                          {notice.viewCount || 0} Readers
                        </Button>
                      </Tooltip>

                      {isManager && (
                        <HStack spacing={1}>
                          <Tooltip label={isPinned ? 'Unpin from top' : 'Pin to top'}>
                            <IconButton
                              aria-label="Pin Notice"
                              icon={isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
                              size="xs"
                              variant="ghost"
                              colorScheme={isPinned ? 'teal' : 'gray'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(notice);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Edit Notice">
                            <IconButton
                              type="button"
                              aria-label="Edit Notice"
                              icon={<FiEdit2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(notice);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Notice">
                            <IconButton
                              aria-label="Delete Notice"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(notice._id);
                                setIsDeleteOpen(true);
                              }}
                            />
                          </Tooltip>
                        </HStack>
                      )}
                    </HStack>
                  </Flex>

                  <Heading size="md" mt={2} color={noticeTitleColor}>
                    {notice.title}
                  </Heading>
                  <HStack spacing={3} mt={1} fontSize="xs" color={mutedText}>
                    <Text>
                      Posted by <strong>{notice.authorName || 'Manager'}</strong> ({notice.authorRole || 'CS Manager'})
                    </Text>
                    <Text>•</Text>
                    <Text>{new Date(notice.createdAt).toLocaleString()}</Text>
                    {notice.effectiveDate && (
                      <>
                        <Text>•</Text>
                        <Text>Effective: {new Date(notice.effectiveDate).toLocaleDateString()}</Text>
                      </>
                    )}
                  </HStack>
                </CardHeader>

                <Divider borderColor={borderColor} />

                <CardBody pt={3} pb={4} px={{ base: 4, md: 5 }}>
                  <Text whiteSpace="pre-wrap" fontSize="sm" lineHeight="1.7" color={noticeContentColor}>
                    {notice.content}
                  </Text>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Create / Edit Notice Right Drawer */}
      {isNoticeDrawerOpen && (
        <Box position="fixed" inset={0} zIndex={3000}>
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(3px)"
            onClick={closeNoticeDrawer}
          />
          <Box
            as="form"
            onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
            position="absolute"
            top={0}
            right={0}
            h="100vh"
            w={{ base: '100vw', md: '720px' }}
            maxW="100vw"
            bg={cardBg}
            boxShadow="2xl"
            display="flex"
            flexDirection="column"
            onClick={(e) => e.stopPropagation()}
          >
          <Flex px={{ base: 4, md: 6 }} py={4} align="center" justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
            <Heading size="md" color={headerColor}>
              {isCreateOpen ? 'Create Customer Service Notice' : 'Edit Notice'}
            </Heading>
          <IconButton
            type="button"
            aria-label="Close notice drawer"
            variant="ghost"
            size="sm"
            icon={<Text fontSize="xl">x</Text>}
            onClick={closeNoticeDrawer}
          />
          </Flex>
          <Box flex="1" overflowY="auto" px={{ base: 4, md: 6 }} py={5}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Notice Title</FormLabel>
                <Input
                  placeholder="E.g., Updated B2B Package Pricing for August 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="700">Category</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">💡 General Notice</option>
                    <option value="training">🎓 Training & Coaching</option>
                    <option value="price_change">💰 Price & Package Changes</option>
                    <option value="update">📢 Important Operational Update</option>
                    <option value="urgent_alert">🚨 Urgent Alert</option>
                    <option value="policy">📜 Policy & Service Standard</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700">Priority Level</FormLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="important">Important (Highlighted)</option>
                    <option value="urgent">Urgent (Immediate Attention)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Notice Details & Content</FormLabel>
                <Textarea
                  placeholder="Provide all essential details, bullet points, price changes, or guidelines..."
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700">Effective Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" pt={8}>
                  <Switch
                    id="pin-notice"
                    colorScheme="teal"
                    isChecked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    mr={3}
                  />
                  <FormLabel htmlFor="pin-notice" mb={0} fontSize="sm" fontWeight="700">
                    Pin notice to top of board
                  </FormLabel>
                </FormControl>
              </SimpleGrid>

              {isCreateOpen && (
                <Alert status="info" borderRadius="md" py={2} fontSize="xs">
                  <AlertIcon />
                  All active Customer Service staff will automatically receive a notification upon posting.
                </Alert>
              )}
            </VStack>
          </Box>

          <Flex justify="flex-end" gap={3} px={{ base: 4, md: 6 }} py={4} borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
            <Button type="button" variant="ghost" onClick={closeNoticeDrawer}>
              Cancel
            </Button>
            <Button colorScheme="teal" type="submit" isLoading={submitting}>
              {isCreateOpen ? 'Publish Notice' : 'Save Changes'}
            </Button>
          </Flex>
          </Box>
        </Box>
      )}

      {/* Reader Tracking Modal (Manager & Stats) */}
      <Modal isOpen={isReadersOpen} onClose={() => setIsReadersOpen(false)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiEye color="teal" />
              <Text>Readership Tracking ({activeReadersNotice?.viewCount || 0} Views)</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={1}>
              {activeReadersNotice?.title}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {(!activeReadersNotice?.views || activeReadersNotice.views.length === 0) ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No readers recorded yet.
              </Text>
            ) : (
              <TableContainer maxH="350px" overflowY="auto">
                <Table size="sm" variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Staff Member</Th>
                      <Th>Role</Th>
                      <Th>Read At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeReadersNotice.views.map((viewer, idx) => (
                      <Tr key={viewer._id || idx}>
                        <Td fontWeight="600">{viewer.userName || viewer.userEmail || 'Staff'}</Td>
                        <Td>
                          <Badge fontSize="2xs" colorScheme="blue">{viewer.userRole || 'CS'}</Badge>
                        </Td>
                        <Td fontSize="xs" color="gray.500">
                          {viewer.viewedAt ? new Date(viewer.viewedAt).toLocaleString() : 'N/A'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={() => setIsDeleteOpen(false)}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Notice
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this notice? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete Notice
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );

  if (embedded) {
    return pageContent;
  }

  return <Layout>{pageContent}</Layout>;
};

export default CustomerMessagesPage;
