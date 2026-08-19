import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
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
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiClock,
  FiCode,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFile,
  FiFileText,
  FiImage,
  FiPaperclip,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import { useLocation } from 'react-router-dom';
import {
  createNotice,
  deleteNotice,
  getNotices,
  getNoticeStats,
  recordNoticeView,
  togglePinNotice,
  updateNotice,
} from '../services/noticeService';
import { useUserStore } from '../store/user';
import { getAuthItem } from '../utils/authStorage';
import RichVisualEditor from './common/RichVisualEditor';

const IT_CATEGORIES = [
  { value: 'all', label: 'All Notices', color: 'gray' },
  { value: 'deployment', label: '🚀 Release / Deployment', color: 'blue' },
  { value: 'maintenance', label: '⚙️ Maintenance', color: 'orange' },
  { value: 'security', label: '🔒 Security Alert', color: 'red' },
  { value: 'bug_fix', label: '🐛 Bug Fix / Patch', color: 'teal' },
  { value: 'update', label: '📢 System Update', color: 'purple' },
  { value: 'urgent_alert', label: '🚨 Urgent Alert', color: 'pink' },
  { value: 'policy', label: '📜 IT Guidelines / SOP', color: 'cyan' },
  { value: 'training', label: '🎓 Technical Training', color: 'green' },
  { value: 'general', label: '💡 General', color: 'gray' },
];

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important ⚠️' },
  { value: 'urgent', label: 'Urgent 🚨' },
];

const safeGetAuthRole = (user = {}) => {
  try {
    const directRole = getAuthItem('userRole') || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
    const rawRole = String(user?.role || user?.userRole || user?.displayRole || directRole || '').trim();
    return rawRole.toLowerCase().replace(/[^a-z0-9]/g, '');
  } catch {
    return '';
  }
};

const canUserCreateNotice = (user = {}) => {
  try {
    const role = safeGetAuthRole(user);
    const displayRole = String(user?.displayRole || user?.role || getAuthItem('userRoleRaw') || '').toLowerCase();
    const jobTitle = String(user?.jobTitle || getAuthItem('userJobTitle') || '').toLowerCase();
    const username = String(user?.username || getAuthItem('userName') || '').toLowerCase();

    return (
      ['admin', 'itadmin', 'itmanager', 'itteamleader', 'itleader', 'teamleader', 'leader', 'customersuccessmanager', 'csmanager', 'hr', 'coo', 'ceo', 'manager'].some((r) => role.includes(r)) ||
      displayRole.includes('leader') ||
      displayRole.includes('lead') ||
      displayRole.includes('manager') ||
      displayRole.includes('admin') ||
      jobTitle.includes('leader') ||
      jobTitle.includes('lead') ||
      jobTitle.includes('manager') ||
      jobTitle.includes('admin') ||
      username.includes('admin') ||
      username.includes('it4') ||
      Boolean(user?.canManageNotices || user?.permissions?.canManageUsers)
    );
  } catch {
    return false;
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  } catch {
    return '';
  }
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  } catch {
    return '';
  }
};

const formatFileSize = (bytes = 0) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  try {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'B'}`;
  } catch {
    return '0 B';
  }
};

const getFileIcon = (fileType = '', fileName = '') => {
  const type = String(fileType || '').toLowerCase();
  const name = String(fileName || '').toLowerCase();
  if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return <FiImage />;
  if (type.includes('pdf') || name.endsWith('.pdf')) return <FiFileText color="#E53E3E" />;
  if (name.match(/\.(doc|docx|txt|rtf)$/)) return <FiFileText color="#3182CE" />;
  if (name.match(/\.(js|jsx|ts|tsx|json|html|css|py|java|cpp|sql)$/)) return <FiCode color="#805AD5" />;
  return <FiFile color="#718096" />;
};

const NoticeBoardPanel = ({
  title = 'IT Notice Board',
  subtitle = 'Internal technical announcements, deployment notes, system maintenance alerts, and operational policies.',
  department = 'IT',
  embedded = false,
}) => {
  const location = useLocation();
  const storeUser = useUserStore((state) => state.currentUser || state.user || {});

  const currentUser = useMemo(() => {
    let base = {};
    if (storeUser && typeof storeUser === 'object' && Object.keys(storeUser).length > 0) {
      base = { ...storeUser };
    } else {
      try {
        const raw = localStorage.getItem('userInfo') || localStorage.getItem('user');
        if (raw && raw.startsWith('{')) {
          base = JSON.parse(raw);
        }
      } catch {
        base = {};
      }
    }
    if (!base.role) {
      base.role = getAuthItem('userRole') || localStorage.getItem('userRole') || '';
    }
    return base;
  }, [storeUser]);

  const isManager = useMemo(() => canUserCreateNotice(currentUser), [currentUser]);

  // Notice list and stats
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'update',
    priority: 'normal',
    department: department || 'IT',
    isPinned: false,
    effectiveDate: new Date().toISOString().split('T')[0],
    attachments: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingNotice, setEditingNotice] = useState(null);

  // Delete Alert State
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingNotice, setDeletingNotice] = useState(null);
  const cancelDeleteRef = useRef();

  // Readers Modal State
  const { isOpen: isReadersOpen, onOpen: onReadersOpen, onClose: onReadersClose } = useDisclosure();
  const [activeReadersNotice, setActiveReadersNotice] = useState(null);

  // File Input Refs
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const toast = useToast();

  // Theme Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerColor = useColorModeValue('blue.700', 'blue.200');
  const panelBg = useColorModeValue('gray.50', 'gray.900');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.12)');
  const pinnedBorder = useColorModeValue('blue.400', 'blue.300');
  const toolbarBg = useColorModeValue('gray.50', 'gray.700');

  // Handle File Selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            url: reader.result,
            fileType: file.type || 'application/octet-stream',
            size: file.size || 0,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((results) => {
      const validFiles = results.filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...validFiles],
      }));
      toast({
        title: `${validFiles.length} file(s) attached`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    });

    e.target.value = '';
  };

  const removeAttachment = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Fetch notices & statistics
  const fetchNoticeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { department: department || 'IT' };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (dateFilterType === 'day' && filterDay) params.day = filterDay;
      if (dateFilterType === 'month' && filterMonth) params.month = filterMonth;
      if (dateFilterType === 'year' && filterYear) params.year = filterYear;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [noticeListRes, statsDataRes] = await Promise.allSettled([
        getNotices(params),
        getNoticeStats({ department: department || 'IT' }),
      ]);

      let hasSuccess = false;

      if (noticeListRes.status === 'fulfilled') {
        setNotices(Array.isArray(noticeListRes.value) ? noticeListRes.value : []);
        hasSuccess = true;
      } else {
        console.error('Error fetching notices:', noticeListRes.reason);
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
      console.error('Error in fetchNoticeData:', err);
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [department, selectedCategory, dateFilterType, filterDay, filterMonth, filterYear, searchQuery]);

  useEffect(() => {
    fetchNoticeData();
  }, [fetchNoticeData]);

  // Deep linking to a notice via ?notice=ID
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const noticeId = params.get('notice');
      if (noticeId && notices.length > 0) {
        const el = document.getElementById(`notice-${noticeId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          recordNoticeView(noticeId);
        }
      }
    } catch (err) {
      console.warn('Deep linking scroll warning:', err);
    }
  }, [location.search, notices]);

  // Mark notice as read on card click
  const handleNoticeClick = async (notice) => {
    if (!notice || notice.hasViewed) return;
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
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      category: 'update',
      priority: 'normal',
      department: department || 'IT',
      isPinned: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      attachments: [],
    });
    onCreateOpen();
  };

  // Open Edit Modal
  const openEditModal = (notice) => {
    if (!notice) return;
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      category: notice.category || 'update',
      priority: notice.priority || 'normal',
      department: notice.department || department || 'IT',
      isPinned: Boolean(notice.isPinned),
      effectiveDate: notice.effectiveDate ? new Date(notice.effectiveDate).toISOString().split('T')[0] : '',
      attachments: Array.isArray(notice.attachments) ? notice.attachments : [],
    });
    onEditOpen();
  };

  // Submit Create Notice
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content || !formData.content.trim()) {
      toast({ title: 'Title and notice content are required', status: 'warning', duration: 3000 });
      return;
    }
    try {
      setSubmitting(true);
      await createNotice(formData);
      onCreateClose();
      await fetchNoticeData();
      toast({
        title: 'Notice posted successfully',
        description: `All ${department} team members have been notified.`,
        status: 'success',
        duration: 3500,
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
      onEditClose();
      setEditingNotice(null);
      await fetchNoticeData();
      toast({ title: 'Notice updated successfully', status: 'success', duration: 3000 });
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

  // Toggle Pin
  const handleTogglePin = async (notice) => {
    if (!notice?._id) return;
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

  // Open Delete Confirmation
  const openDeleteDialog = (notice) => {
    setDeletingNotice(notice);
    onDeleteOpen();
  };

  // Confirm Delete Notice
  const confirmDelete = async () => {
    if (!deletingNotice?._id) return;
    try {
      await deleteNotice(deletingNotice._id);
      setNotices((prev) => prev.filter((n) => n._id !== deletingNotice._id));
      onDeleteClose();
      setDeletingNotice(null);
      toast({ title: 'Notice deleted', status: 'info', duration: 2500 });
      fetchNoticeData();
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
    onReadersOpen();
  };

  const getCategoryBadge = (category) => {
    const cat = IT_CATEGORIES.find((c) => c.value === category) || { label: category || 'General', color: 'gray' };
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

  return (
    <Box p={embedded ? 0 : { base: 4, md: 6 }} bg={embedded ? 'transparent' : panelBg} minH={embedded ? 'auto' : '100vh'} w="100%">
      {/* Header Bar */}
      <Card mb={5} borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="sm">
        <CardBody p={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} flexWrap="wrap">
            <Box>
              <HStack spacing={3} mb={1}>
                <Heading size="lg" color={headerColor}>
                  {title}
                </Heading>
              </HStack>
              <Text color={mutedText} fontSize="sm">
                {subtitle}
              </Text>
            </Box>

            <HStack spacing={3} flexWrap="wrap">
              {unreadCount > 0 && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
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
                <Button colorScheme="blue" leftIcon={<FiPlus />} size="sm" onClick={openCreateModal}>
                  Post New Notice
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
                <Text fontSize="xl" fontWeight="800" color="blue.500">{stats.totalViews || 0} 👁️</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">🚀 Releases / Deploy</Text>
                <Text fontSize="xl" fontWeight="800" color="teal.500">{(stats.categories?.deployment || 0) + (stats.categories?.update || 0)}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">⚙️ Maintenance</Text>
                <Text fontSize="xl" fontWeight="800" color="orange.500">{stats.categories?.maintenance || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">🔒 Security</Text>
                <Text fontSize="xl" fontWeight="800" color="purple.500">{stats.categories?.security || 0}</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color="gray.500" fontWeight="700" textTransform="uppercase">🚨 Urgent Alerts</Text>
                <Text fontSize="xl" fontWeight="800" color="red.500">{stats.categories?.urgent_alert || 0}</Text>
              </Box>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Date & Category Filters */}
      <Card mb={5} borderRadius="xl" border="1px solid" borderColor={borderColor} bg={cardBg} boxShadow="sm">
        <CardBody py={4} px={4}>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={4} justify="space-between" align={{ base: 'stretch', lg: 'center' }}>
            {/* Category Filter Chips */}
            <HStack spacing={2} overflowX="auto" pb={{ base: 2, lg: 0 }} maxW={{ base: '100%', lg: '60%' }}>
              {IT_CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  size="xs"
                  variant={selectedCategory === cat.value ? 'solid' : 'outline'}
                  colorScheme={cat.color}
                  onClick={() => setSelectedCategory(cat.value)}
                  whiteSpace="nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </HStack>

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

              <InputGroup size="sm" maxW="220px">
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

      {/* Notices List Feed */}
      {loading ? (
        <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500" fontSize="sm">Loading notices...</Text>
        </Flex>
      ) : error ? (
        <Box p={4} bg="red.50" color="red.700" borderRadius="xl" border="1px solid" borderColor="red.200">
          <Text fontWeight="semibold">{error}</Text>
        </Box>
      ) : notices.length === 0 ? (
        <Card borderRadius="2xl" border="1px dashed" borderColor={borderColor} p={8} textAlign="center">
          <CardBody>
            <Box mb={3} fontSize="4xl">📋</Box>
            <Heading size="md" mb={2}>No IT notices found</Heading>
            <Text color={mutedText} fontSize="sm" maxW="450px" mx="auto" mb={4}>
              There are currently no announcements matching your filters.
              {isManager && ' Use the button above to post the first update for your team.'}
            </Text>
            {isManager && (
              <Button colorScheme="blue" size="sm" leftIcon={<FiPlus />} onClick={openCreateModal}>
                Post Notice
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {notices.map((notice) => {
            const isPinned = Boolean(notice.isPinned);
            const isUnread = !notice.hasViewed;
            const attachments = Array.isArray(notice.attachments) ? notice.attachments : [];

            return (
              <Card
                key={notice._id}
                id={`notice-${notice._id}`}
                borderRadius="xl"
                borderWidth={isPinned ? '2px' : '1px'}
                borderColor={isPinned ? pinnedBorder : isUnread ? 'blue.300' : borderColor}
                bg={isPinned ? highlightBg : cardBg}
                boxShadow={isPinned ? 'md' : 'sm'}
                transition="all 0.2s"
                _hover={{ borderColor: 'blue.400', boxShadow: 'md' }}
                onClick={() => handleNoticeClick(notice)}
              >
                <CardHeader pb={2} pt={4} px={{ base: 4, md: 5 }}>
                  <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} flexWrap="wrap">
                    <HStack spacing={2} flexWrap="wrap">
                      {isPinned && (
                        <Badge colorScheme="blue" variant="solid" display="flex" alignItems="center" gap={1}>
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

                    {/* Actions */}
                    <HStack spacing={2}>
                      <Tooltip label="Total staff views">
                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<FiEye />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openReadersModal(notice);
                          }}
                        >
                          {notice.viewCount || 0} Readers
                        </Button>
                      </Tooltip>

                      {isManager && (
                        <>
                          <Tooltip label={isPinned ? 'Unpin from top' : 'Pin to top'}>
                            <IconButton
                              aria-label="Pin"
                              icon={isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
                              size="xs"
                              variant={isPinned ? 'solid' : 'ghost'}
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(notice);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Edit Notice">
                            <IconButton
                              aria-label="Edit"
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
                              aria-label="Delete"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(notice);
                              }}
                            />
                          </Tooltip>
                        </>
                      )}
                    </HStack>
                  </Flex>

                  <Heading size="md" mt={2} color={isPinned ? 'blue.700' : headerColor}>
                    {notice.title}
                  </Heading>
                  <HStack spacing={4} mt={1} color="gray.500" fontSize="xs" flexWrap="wrap">
                    <HStack spacing={1}>
                      <FiUser />
                      <Text fontWeight="medium">{notice.authorName || 'Manager'}</Text>
                      <Text color="gray.400">({notice.authorRole || 'IT Manager'})</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <FiCalendar />
                      <Text>Posted: {formatDate(notice.createdAt)}</Text>
                    </HStack>
                    {notice.effectiveDate && (
                      <HStack spacing={1}>
                        <FiClock />
                        <Text>Effective: {formatDate(notice.effectiveDate)}</Text>
                      </HStack>
                    )}
                  </HStack>
                </CardHeader>

                <CardBody pt={2} pb={attachments.length > 0 ? 2 : 4} px={{ base: 4, md: 5 }}>
                  <Box
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    color={useColorModeValue('gray.800', 'gray.100')}
                    dangerouslySetInnerHTML={{ __html: typeof notice.content === 'string' ? notice.content : String(notice.content || '') }}
                  />
                </CardBody>

                {/* Attachments Section */}
                {attachments.length > 0 && (
                  <CardFooter pt={0} pb={3} px={{ base: 4, md: 5 }}>
                    <VStack align="flex-start" spacing={2} w="100%" pt={2} borderTop="1px dashed" borderColor={borderColor}>
                      <HStack spacing={1} color="gray.500" fontSize="xs" fontWeight="semibold">
                        <FiPaperclip />
                        <Text>Attached Files ({attachments.length}):</Text>
                      </HStack>
                      <Wrap spacing={2}>
                        {attachments.map((file, fIdx) => (
                          <WrapItem key={fIdx}>
                            <Tag
                              size="md"
                              borderRadius="full"
                              variant="subtle"
                              colorScheme="blue"
                              p={2}
                              as="a"
                              href={file.url}
                              download={file.name || `notice-attachment-${fIdx}`}
                              target="_blank"
                              rel="noreferrer"
                              _hover={{ textDecoration: 'none', bg: 'blue.100', transform: 'scale(1.02)' }}
                              transition="all 0.15s"
                              cursor="pointer"
                            >
                              <HStack spacing={1.5}>
                                {getFileIcon(file.fileType, file.name)}
                                <Text fontSize="xs" fontWeight="medium" maxW="200px" isTruncated>
                                  {file.name}
                                </Text>
                                {file.size > 0 && (
                                  <Text fontSize="2xs" color="gray.500">
                                    ({formatFileSize(file.size)})
                                  </Text>
                                )}
                                <FiDownload size={12} />
                              </HStack>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </VStack>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Post Notice Modal (Create) */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl">
          <form onSubmit={handleCreateSubmit}>
            <ModalHeader>
              <HStack spacing={2}>
                <FiPlus color="#3182CE" />
                <Text>Post Notice to {department} Team</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Notice Title</FormLabel>
                  <Input
                    placeholder="e.g., Scheduled Server Maintenance & Patch Release"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {IT_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Priority</FormLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Effective Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" pt={7}>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Pin to top?</FormLabel>
                    <Switch
                      colorScheme="blue"
                      isChecked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Visual WYSIWYG Editor */}
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
                    Notice Content & Details
                  </FormLabel>
                  <RichVisualEditor
                    value={formData.content}
                    onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                    placeholder="Type notice details here. Click Bold, Italic, Underline, or pick colors directly as you type..."
                  />
                </FormControl>

                {/* File Attachments Section */}
                <FormControl>
                  <Flex justify="space-between" align="center" mb={2}>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>
                      Attach Files / Documents
                    </FormLabel>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Button
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<FiPaperclip />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </Flex>

                  {formData.attachments && formData.attachments.length > 0 ? (
                    <Wrap spacing={2} p={2} bg={toolbarBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                      {formData.attachments.map((file, idx) => (
                        <WrapItem key={idx}>
                          <Tag size="md" borderRadius="full" variant="solid" colorScheme="blue">
                            <HStack spacing={1.5} pr={1}>
                              {getFileIcon(file.fileType, file.name)}
                              <TagLabel maxW="180px" isTruncated>{file.name}</TagLabel>
                              <Text fontSize="2xs" opacity={0.8}>({formatFileSize(file.size)})</Text>
                            </HStack>
                            <TagCloseButton onClick={() => removeAttachment(idx)} />
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      Optional: Attach logs, PDFs, screenshots, documents, or release notes.
                    </Text>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={onCreateClose}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={submitting}>Post Notice</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl">
          <form onSubmit={handleEditSubmit}>
            <ModalHeader>
              <HStack spacing={2}>
                <FiEdit2 color="#3182CE" />
                <Text>Edit Notice</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Notice Title</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {IT_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Priority</FormLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Effective Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" pt={7}>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Pin to top?</FormLabel>
                    <Switch
                      colorScheme="blue"
                      isChecked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Visual WYSIWYG Editor */}
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
                    Notice Content & Details
                  </FormLabel>
                  <RichVisualEditor
                    value={formData.content}
                    onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                    placeholder="Type notice details here..."
                  />
                </FormControl>

                {/* File Attachments Section */}
                <FormControl>
                  <Flex justify="space-between" align="center" mb={2}>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>
                      Attach Files / Documents
                    </FormLabel>
                    <input
                      type="file"
                      ref={editFileInputRef}
                      style={{ display: 'none' }}
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Button
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<FiPaperclip />}
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </Flex>

                  {formData.attachments && formData.attachments.length > 0 ? (
                    <Wrap spacing={2} p={2} bg={toolbarBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                      {formData.attachments.map((file, idx) => (
                        <WrapItem key={idx}>
                          <Tag size="md" borderRadius="full" variant="solid" colorScheme="blue">
                            <HStack spacing={1.5} pr={1}>
                              {getFileIcon(file.fileType, file.name)}
                              <TagLabel maxW="180px" isTruncated>{file.name}</TagLabel>
                              <Text fontSize="2xs" opacity={0.8}>({formatFileSize(file.size)})</Text>
                            </HStack>
                            <TagCloseButton onClick={() => removeAttachment(idx)} />
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  ) : (
                    <Text fontSize="xs" color="gray.500">
                      No files attached.
                    </Text>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={submitting}>Update Notice</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Notice</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete notice <strong>"{deletingNotice?.title}"</strong>? This will remove it for all team members.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={confirmDelete}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Readers Modal */}
      <Modal isOpen={isReadersOpen} onClose={onReadersClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={2}>
              <FiEye color="#3182CE" />
              <Text>Staff Readers ({activeReadersNotice?.views?.length || 0})</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="400px" overflowY="auto">
            {!activeReadersNotice?.views || activeReadersNotice.views.length === 0 ? (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>No views recorded yet.</Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {activeReadersNotice.views.map((v, idx) => (
                  <Flex key={idx} justify="space-between" align="center" p={2} borderRadius="lg" bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Box>
                      <Text fontWeight="semibold" fontSize="sm">{v.userName || 'Staff Member'}</Text>
                      <Text fontSize="xs" color="gray.400">{v.userRole || 'Team Member'}</Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500">
                      {formatDateTime(v.viewedAt)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" onClick={onReadersClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NoticeBoardPanel;
