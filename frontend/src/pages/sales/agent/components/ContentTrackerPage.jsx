import React, { useState, useEffect, useMemo } from 'react';
import {
  Avatar,
  Box,
  Divider,
  Heading,
  Icon,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  IconButton,
  HStack,
  VStack,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  SimpleGrid,
  useColorModeValue,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaLink, FaEdit, FaTrash, FaEye, FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube, FaWhatsapp, FaTelegramPlane, FaTwitter, FaGoogle, FaCheck } from 'react-icons/fa';
import { FiGlobe, FiSearch, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
  createContentTrackerEntry,
  deleteContentTrackerEntry,
  fetchContentTrackerEntries,
  updateContentTrackerEntry,
} from '../../../../services/contentTrackerService';
import { publishToFacebook } from '../../../../services/facebookService';
import { publishToInstagram } from '../../../../services/instagramService';
import { publishToLinkedIn } from '../../../../services/linkedinService';
import { useUserStore } from '../../../../store/user';
import {
  REQUIRED_COUNTS,
  SHARE_TARGET,
  BONUS_AMOUNT,
  buildMonthKey,
  formatMonthLabel,
  normalizeAgentKey,
  summarizeEntriesByAgent,
  mapSummariesByKey,
  createEmptyCounts,
} from '../../../../utils/contentTrackerTargets';

const MOCK_POST_TEMPLATES = [
  {
    title: "Premium Organic Yirgacheffe Coffee Special",
    description: "Explore the floral aroma, sweet flavor, and bright citrus acidity of authentic Yirgacheffe coffee beans. Sourced directly from our smallholder farmers in southern Ethiopia. Buy bulk raw beans at tradeethiopia.com today!",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600",
    link: "https://tradeethiopia.com/category/coffee",
    shares: 42,
  },
  {
    title: "Ethiopian White Teff Flour Bulk Campaign",
    description: "Gluten-free, nutrient-dense, and highly versatile. Our export-grade white teff flour is perfect for global health food brands and wholesale bakeries. Place your custom quote today at tradeethiopia.com.",
    imageUrl: "https://images.unsplash.com/photo-1574325131876-a799967913cb?q=80&w=600",
    link: "https://tradeethiopia.com/category/teff",
    shares: 15,
  },
  {
    title: "Join B2B Trade & Export Fair Addis Ababa 2026",
    description: "Meet directly with pre-verified exporters of sesame seeds, pulses, spices, and fresh cut flowers. Secure your buyers credentials online. Registration is free at tradeethiopia.com/events.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600",
    link: "https://tradeethiopia.com/events/export-fair-2026",
    shares: 88,
  }
];

const contentTypeOptions = ['Video', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads'];
const getEntryId = (entry) => entry?._id ?? entry?.id ?? entry;
const formatAgentName = (entry, currentUser) => {
  const creator = entry?.createdBy;
  if (!creator) {
    return currentUser?.username || 'Unknown agent';
  }

  if (typeof creator === 'string') {
    if (currentUser?._id && creator === currentUser._id) {
      return currentUser?.username || 'Unknown agent';
    }
    return 'Unknown agent';
  }

  const nameParts = [creator.firstName, creator.lastName].filter(Boolean);
  if (nameParts.length) return nameParts.join(' ');
  return creator.fullName || creator.username || creator.email || currentUser?.username || 'Unknown agent';
};

const ContentTrackerPage = ({ title = 'Content Tracker', addButtonLabel = 'Add', platformOptions = [] }) => {
  const [contentRows, setContentRows] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState(contentTypeOptions[0]);
  const [modalPlatform, setModalPlatform] = useState('');
  const [modalShares, setModalShares] = useState(0);
  const [modalLink, setModalLink] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareEdits, setShareEdits] = useState({});
  const currentUser = useUserStore((state) => state.currentUser);
  const [selectedMonth, setSelectedMonth] = useState(buildMonthKey());
  const isSalesManager = useMemo(() => {
    if (!currentUser) return false;
    const normalized = (currentUser.normalizedRole || currentUser.role || '').toString().toLowerCase();
    return normalized.includes('salesmanager');
  }, [currentUser]);
  const hasManagerAccess = useMemo(() => {
    if (!currentUser) return false;
    const normalized = (currentUser.normalizedRole || currentUser.role || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const managerRoles = new Set(['salesmanager', 'socialmediamanager', 'socialmedia', 'admin', 'finance', 'hr', 'coo']);
    return managerRoles.has(normalized);
  }, [currentUser]);
  const toast = useToast();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewEntry, setViewEntry] = useState(null);
  const hasPlatformTracking = platformOptions.length > 0;
  const defaultPlatform = platformOptions[0] || '';

  // --- Facebook Publish State ---
  const [publishEntry, setPublishEntry] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const {
    isOpen: isPublishOpen,
    onOpen: onPublishOpen,
    onClose: onPublishClose,
  } = useDisclosure();

  const openPublishPreview = (row) => {
    setPublishEntry(row);
    onPublishOpen();
  };

  // --- Instagram Publish State ---
  const [publishInstagramEntry, setPublishInstagramEntry] = useState(null);
  const [isPublishingInstagram, setIsPublishingInstagram] = useState(false);
  const {
    isOpen: isPublishInstagramOpen,
    onOpen: onPublishInstagramOpen,
    onClose: onPublishInstagramClose,
  } = useDisclosure();

  const openPublishInstagramPreview = (row) => {
    setPublishInstagramEntry(row);
    onPublishInstagramOpen();
  };

  const handlePublishToInstagram = async () => {
    if (!publishInstagramEntry) return;

    const imgUrl = publishInstagramEntry.imageUrl || publishInstagramEntry.link;
    if (!imgUrl || !imgUrl.startsWith('http')) {
      toast({
        title: 'Image URL Required',
        description: 'Instagram publishing requires a valid, public featured image URL.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsPublishingInstagram(true);
    try {
      const res = await publishToInstagram({ entryId: getEntryId(publishInstagramEntry) });
      if (res.success) {
        toast({
          title: 'Published to Instagram!',
          description: `Post is now live: ${res.postUrl}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        updateRowInState({ ...publishInstagramEntry, link: res.postUrl, approved: true });
        onPublishInstagramClose();
        setPublishInstagramEntry(null);
      } else {
        throw new Error(res.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Instagram publish failed', err);
      toast({
        title: 'Publish Failed',
        description: err.response?.data?.message || err.message || 'Could not publish to Instagram.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishingInstagram(false);
    }
  };

  // --- LinkedIn Publish State ---
  const [publishLinkedinEntry, setPublishLinkedinEntry] = useState(null);
  const [isPublishingLinkedin, setIsPublishingLinkedin] = useState(false);
  const {
    isOpen: isPublishLinkedinOpen,
    onOpen: onPublishLinkedinOpen,
    onClose: onPublishLinkedinClose,
  } = useDisclosure();

  const openPublishLinkedinPreview = (row) => {
    setPublishLinkedinEntry(row);
    onPublishLinkedinOpen();
  };

  const handlePublishToLinkedIn = async () => {
    if (!publishLinkedinEntry) return;

    setIsPublishingLinkedin(true);
    try {
      const res = await publishToLinkedIn({ entryId: getEntryId(publishLinkedinEntry) });
      if (res.success) {
        toast({
          title: 'Published to LinkedIn!',
          description: `Post is now live: ${res.postUrl}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        updateRowInState({ ...publishLinkedinEntry, link: res.postUrl, approved: true });
        onPublishLinkedinClose();
        setPublishLinkedinEntry(null);
      } else {
        throw new Error(res.message || 'Unknown error');
      }
    } catch (err) {
      console.error('LinkedIn publish failed', err);
      toast({
        title: 'Publish Failed',
        description: err.response?.data?.message || err.message || 'Could not publish to LinkedIn.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishingLinkedin(false);
    }
  };

  const handlePublishToFacebook = async () => {
    if (!publishEntry) return;
    setIsPublishing(true);
    try {
      const res = await publishToFacebook({ entryId: getEntryId(publishEntry) });
      if (res.success) {
        toast({
          title: 'Published to Facebook!',
          description: `Post is now live: ${res.postUrl}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Update local state with new link & approval
        updateRowInState({ ...publishEntry, link: res.postUrl, approved: true });
        onPublishClose();
        setPublishEntry(null);
      } else {
        throw new Error(res.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Facebook publish failed', err);
      toast({
        title: 'Publish Failed',
        description: err.response?.data?.message || err.message || 'Could not publish to Facebook.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishing(false);
    }
  };
  const platformRows = useMemo(() => {
    if (!hasPlatformTracking) return contentRows;
    return contentRows.filter((row) => platformOptions.includes(row.platform));
  }, [contentRows, hasPlatformTracking, platformOptions]);

  const normalizeResponsePayload = (payload) => payload?.data ?? payload;

  const userKey = useMemo(() => normalizeAgentKey(currentUser), [currentUser]);
  const agentSummaries = useMemo(() => summarizeEntriesByAgent(platformRows, selectedMonth), [platformRows, selectedMonth]);
  const summaryMap = useMemo(() => mapSummariesByKey(agentSummaries), [agentSummaries]);
  const monthlyStats = useMemo(() => {
    const summary = userKey ? summaryMap[userKey] : null;
    if (summary) {
      return {
        counts: summary.counts,
        shares: summary.shares,
        totalPosts: summary.totalPosts,
        isComplete: summary.isComplete,
      };
    }
    return {
      counts: createEmptyCounts(),
      shares: 0,
      totalPosts: 0,
      isComplete: false,
    };
  }, [summaryMap, userKey]);

  const loadEntries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchContentTrackerEntries();
      const entries = Array.isArray(normalizeResponsePayload(response))
        ? normalizeResponsePayload(response)
        : normalizeResponsePayload(response)?.data ?? [];
      setContentRows(entries);
    } catch (err) {
      console.error('Failed to load content tracker entries', err);
      setError('Unable to load content tracker entries right now.');
      toast({
        title: 'Unable to load tracker',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();

    const autoAddPlatform = localStorage.getItem("sm_auto_add_post_platform");
    if (autoAddPlatform) {
      localStorage.removeItem("sm_auto_add_post_platform");
      setSelectedItem(null);
      setCurrentAction('Create');
      setModalTitle('');
      setModalType(contentTypeOptions[0]);
      setModalPlatform(autoAddPlatform);
      setModalShares(0);
      setModalLink('');
      setModalDescription('');
      onOpen();
    }
  }, []);

  const updateRowInState = (updatedEntry) => {
    if (!updatedEntry) return;
    setContentRows((prev) =>
      prev.map((row) =>
        getEntryId(row) === getEntryId(updatedEntry) ? updatedEntry : row,
      ),
    );

    if (selectedItem && getEntryId(selectedItem) === getEntryId(updatedEntry)) {
      setSelectedItem(updatedEntry);
    }
  };

  const removeRowFromState = (entryId) => {
    setContentRows((prev) =>
      prev.filter((row) => getEntryId(row) !== entryId),
    );
    if (selectedItem && getEntryId(selectedItem) === entryId) {
      setSelectedItem(null);
    }
  };

  const handleTypeChange = async (entryId, nextType) => {
    try {
      const response = await updateContentTrackerEntry(entryId, { type: nextType });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
    } catch (err) {
      console.error('Unable to update type', err);
      toast({
        title: 'Update failed',
        description: 'Could not save the new type.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const clearShareEdit = (entryId) => {
    setShareEdits((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, entryId)) return prev;
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  };

  const handleShareChange = async (entryId, nextShares) => {
    try {
      const parsedShares = Number(nextShares);
      const safeShares = Number.isFinite(parsedShares) ? Math.max(0, parsedShares) : 0;
      const response = await updateContentTrackerEntry(entryId, { shares: safeShares });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
      clearShareEdit(entryId);
    } catch (err) {
      console.error('Unable to update share count', err);
      toast({
        title: 'Update failed',
        description: 'Could not save the new share count.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleApprove = async (entry) => {
    try {
      const response = await updateContentTrackerEntry(getEntryId(entry), { approved: true });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
      toast({
        title: 'Post Approved',
        description: `"${updated.title}" has been successfully approved.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to approve entry', err);
      toast({
        title: 'Approval failed',
        description: 'Unable to approve this entry right now.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openActionModal = (action, row) => {
    setSelectedItem(row);
    setCurrentAction(action);
    setModalTitle(row?.title || '');
    setModalType(row?.type ?? contentTypeOptions[0]);
    setModalPlatform(row?.platform || defaultPlatform);
    setModalShares(row?.shares ?? 0);
    setModalLink(row?.link ?? '');
    setModalDescription(row?.description ?? '');
    setModalImageUrl(row?.imageUrl ?? '');
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setCurrentAction(null);
    setModalTitle('');
    setModalDescription('');
    setModalLink('');
    setModalType(contentTypeOptions[0]);
    setModalPlatform(defaultPlatform);
    setModalShares(0);
    setModalImageUrl('');
    onClose();
  };

  const handleCloseView = () => {
    setViewEntry(null);
    onViewClose();
  };

  const handleModalConfirm = async () => {
    if (currentAction !== 'Create' && !selectedItem) {
      handleCloseModal();
      return;
    }

    try {
      if (currentAction === 'Delete') {
        const entryId = getEntryId(selectedItem);
        await deleteContentTrackerEntry(entryId);
        removeRowFromState(entryId);
      } else if (currentAction === 'Create') {
        const trimmedTitle = modalTitle.trim();
        if (!trimmedTitle) {
          toast({
            title: 'Title is required',
            description: 'Add a post title before saving.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const payload = {
          title: trimmedTitle,
          type: modalType,
          link: modalLink,
          description: modalDescription,
          imageUrl: modalImageUrl,
          approved: hasManagerAccess,
          date: new Date().toISOString(),
          shares: modalShares,
        };
        if (hasPlatformTracking) {
          payload.platform = modalPlatform || defaultPlatform;
        }
        const response = await createContentTrackerEntry(payload);
        const created = normalizeResponsePayload(response);
        setContentRows((prev) => [created, ...prev]);
      } else if (currentAction === 'Edit') {
        const entryId = getEntryId(selectedItem);
        const trimmedTitle = modalTitle.trim();
        if (!trimmedTitle) {
          toast({
            title: 'Title is required',
            description: 'Add a post title before saving.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const payload = {
          title: trimmedTitle,
          type: modalType,
          link: modalLink,
          description: modalDescription,
          imageUrl: modalImageUrl,
          shares: modalShares,
        };
        if (hasPlatformTracking) {
          payload.platform = modalPlatform;
        }
        const response = await updateContentTrackerEntry(entryId, payload);
        const updated = normalizeResponsePayload(response);
        updateRowInState(updated);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Modal action failed', err);
      toast({
        title: 'Action failed',
        description: 'Unable to process your request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleAddEntry = async () => {
    setSelectedItem(null);
    setCurrentAction('Create');
    setModalTitle('');
    setModalType(contentTypeOptions[0]);
    setModalPlatform(filterPlatform !== 'All' ? filterPlatform : defaultPlatform);
    setModalShares(0);
    setModalLink('');
    setModalDescription('');
    onOpen();
  };

  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(today.setDate(diff));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const isDateInCurrentWeek = (dateVal) => {
    if (!dateVal) return false;
    const postDate = new Date(dateVal);
    const { start, end } = getWeekRange();
    return postDate >= start && postDate <= end;
  };

  const isDateInSelectedMonth = (dateVal) => {
    if (!dateVal || !selectedMonth) return false;
    const postDate = new Date(dateVal);
    const [year, month] = selectedMonth.split('-').map(Number);
    return postDate.getFullYear() === year && (postDate.getMonth() + 1) === month;
  };

  const visibleRows = platformRows.filter((row) => {
    if (filterDate) {
      if (!row?.date) return false;
      const rowDateString = new Date(row.date).toISOString().split('T')[0];
      if (rowDateString !== filterDate) return false;
    } else {
      if (filterPeriod === 'week') {
        if (!isDateInCurrentWeek(row.date)) return false;
      } else if (filterPeriod === 'month') {
        if (!isDateInSelectedMonth(row.date)) return false;
      }
    }

    if (hasPlatformTracking && filterPlatform !== 'All') {
      if ((row.platform || '') !== filterPlatform) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const titleMatch = (row.title || '').toLowerCase().includes(term);
      const descMatch = (row.description || '').toLowerCase().includes(term);
      const notesMatch = (row.notes || '').toLowerCase().includes(term);
      if (!titleMatch && !descMatch && !notesMatch) return false;
    }

    return true;
  });

  const sortedVisibleRows = useMemo(() => {
    return [...visibleRows].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
  }, [visibleRows]);

  const actionLabelMap = {
    Create: hasPlatformTracking ? 'Add Post' : 'Add Content Entry',
    Edit: 'Edit Content Details',
    Delete: 'Delete Content Entry',
  };

  const renderTableSection = () => {
    if (isLoading) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Flex align="center" gap={3}>
            <Spinner size="lg" />
            <Text fontWeight="medium">Loading content tracker data...</Text>
          </Flex>
        </Box>
      );
    }

    if (error) {
      const MotionBox = motion(Box);
      const MotionFlex = motion(Flex);
      const iconColor = 'red.400';
      const headingColor = useColorModeValue('gray.800', 'white');
      const textColor = useColorModeValue('gray.600', 'gray.400');
      const containerBg = useColorModeValue('red.50', 'rgba(229, 62, 62, 0.1)');
      const containerBorder = useColorModeValue('red.100', 'rgba(229, 62, 62, 0.2)');

      return (
        <MotionBox
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          bg={useColorModeValue('white', 'gray.800')}
          rounded="2xl"
          shadow="lg"
          borderWidth="1px"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          overflow="hidden"
          p={{ base: 6, md: 10 }}
          textAlign="center"
        >
          <VStack spacing={6} py={4}>
            {/* Animated Icon Container */}
            <MotionFlex
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                repeatType: 'reverse', 
                ease: 'easeInOut' 
              }}
              w="80px"
              h="80px"
              borderRadius="2xl"
              bg={containerBg}
              borderWidth="1px"
              borderColor={containerBorder}
              align="center"
              justify="center"
              color={iconColor}
              shadow="md"
            >
              <Icon as={FiAlertTriangle} boxSize={9} />
            </MotionFlex>

            {/* Error Message Details */}
            <VStack spacing={2} maxW="460px">
              <Heading size="md" color={headingColor} letterSpacing="-0.01em">
                Content Sync Error
              </Heading>
              <Text fontSize="sm" color={textColor} lineHeight="1.6">
                {error || 'We encountered a connection issue while fetching the content tracker entries.'}
              </Text>
            </VStack>

            {/* Action Buttons */}
            <HStack spacing={3} mt={2}>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="red"
                size="sm"
                borderRadius="xl"
                h="40px"
                px={6}
                boxShadow="0 4px 14px rgba(229, 62, 62, 0.4)"
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(229, 62, 62, 0.5)',
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
                onClick={loadEntries}
              >
                Try Again
              </Button>
            </HStack>
          </VStack>
        </MotionBox>
      );
    }

    if (!sortedVisibleRows.length) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Text color="gray.500" textAlign="center">
            No tracker entries match the filters. Click “Add” to create one.
          </Text>
        </Box>
      );
    }

    return (
      <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflowX="auto">
        <Table variant="simple" minW={hasPlatformTracking ? "980px" : "860px"}>
          <Thead bg="gray.50">
            <Tr>
              <Th>Date</Th>
              <Th>Content</Th>
              <Th>Agent Name</Th>
              {hasPlatformTracking && <Th>Platform</Th>}
              <Th>Type</Th>
              <Th>Shares</Th>
              <Th>Link</Th>
              <Th>Approved</Th>
              <Th textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedVisibleRows.map((row) => {
              const rowId = getEntryId(row);
              return (
                <Tr key={rowId}>
                  <Td whiteSpace="nowrap" fontSize="xs" color="gray.600">
                    {row?.date ? new Date(row.date).toISOString().split('T')[0] : '—'}
                  </Td>
                  <Td>
                    <HStack spacing={3} align="center">
                      {row.imageUrl ? (
                        <Box
                          w="42px"
                          h="42px"
                          minW="42px"
                          borderRadius="8px"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <img
                            src={row.imageUrl}
                            alt={row.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      ) : (
                        <Flex
                          w="42px"
                          h="42px"
                          minW="42px"
                          borderRadius="8px"
                          bg="gray.100"
                          align="center"
                          justify="center"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <Icon as={FiGlobe} color="gray.400" boxSize={5} />
                        </Flex>
                      )}
                      <Box>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.800">{row.title}</Text>
                        <Text fontSize="10px" color="gray.500" noOfLines={1} maxW="260px">
                          {row.description || 'Add a short description when editing this entry.'}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="xs" color="gray.600" fontWeight="medium">
                      {formatAgentName(row, currentUser)}
                    </Text>
                  </Td>
                  {hasPlatformTracking && (
                    <Td>
                      {row.platform ? (
                        <HStack spacing={2}>
                          <Flex
                            w="22px"
                            h="22px"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            bg={
                              row.platform === 'Facebook' ? '#1877F2' :
                                row.platform === 'Instagram' ? '#E4405F' :
                                  row.platform === 'TikTok' ? '#1A1A1A' :
                                    row.platform === 'YouTube' ? '#FF0000' :
                                      row.platform === 'LinkedIn' ? '#0A66C2' :
                                        row.platform === 'WhatsApp' ? '#25D366' :
                                          row.platform === 'Telegram' ? '#24A1DE' :
                                            row.platform === 'Twitter (X)' ? '#1DA1F2' :
                                              row.platform === 'Google' ? '#4285F4' :
                                                'teal.500'
                            }
                            color="white"
                          >
                            <Icon
                              as={
                                row.platform === 'Facebook' ? FaFacebookF :
                                  row.platform === 'Instagram' ? FaInstagram :
                                    row.platform === 'TikTok' ? FaTiktok :
                                      row.platform === 'YouTube' ? FaYoutube :
                                        row.platform === 'LinkedIn' ? FaLinkedinIn :
                                          row.platform === 'WhatsApp' ? FaWhatsapp :
                                            row.platform === 'Telegram' ? FaTelegramPlane :
                                              row.platform === 'Twitter (X)' ? FaTwitter :
                                                row.platform === 'Google' ? FaGoogle :
                                                  FiGlobe
                              }
                              boxSize={2.5}
                            />
                          </Flex>
                          <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                            {row.platform}
                          </Text>
                        </HStack>
                      ) : (
                        <Badge colorScheme="gray" borderRadius="md" px={2} fontSize="9px">
                          Unassigned
                        </Badge>
                      )}
                    </Td>
                  )}
                  <Td>
                    <Select
                      value={row.type}
                      onChange={(event) => handleTypeChange(rowId, event.target.value)}
                      size="xs"
                      borderRadius="md"
                      maxW="110px"
                      fontSize="xs"
                    >
                      {contentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <Input
                      type="number"
                      size="xs"
                      min={0}
                      step={1}
                      maxW="50px"
                      variant="unstyled"
                      textAlign="center"
                      fontWeight="bold"
                      fontSize="xs"
                      py={0.5}
                      px={1}
                      borderRadius="md"
                      _hover={{ bg: "gray.50" }}
                      _focus={{ bg: "white", borderWidth: "1px", borderColor: "teal.400" }}
                      value={shareEdits[rowId] ?? (row.shares ?? 0)}
                      onChange={(event) => {
                        const { value } = event.target;
                        setShareEdits((prev) => ({
                          ...prev,
                          [rowId]: value,
                        }));
                      }}
                      onBlur={(event) => {
                        const draft = shareEdits[rowId];
                        if (draft === undefined) return;
                        const parsed = Number(draft);
                        if (!Number.isFinite(parsed)) {
                          clearShareEdit(rowId);
                          return;
                        }
                        const normalized = Math.max(0, parsed);
                        if (normalized === (row.shares ?? 0)) {
                          clearShareEdit(rowId);
                          return;
                        }
                        handleShareChange(rowId, normalized);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur();
                        }
                      }}
                    />
                  </Td>
                  <Td>
                    {row.link ? (
                      <Button
                        as="a"
                        href={row.link}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        colorScheme="teal"
                        variant="outline"
                        leftIcon={<Icon as={FaLink} />}
                        borderRadius="md"
                        fontSize="10px"
                        h="22px"
                        px={2.5}
                        _hover={{ transform: 'scale(1.02)' }}
                      >
                        View Post
                      </Button>
                    ) : (
                      <Badge colorScheme="gray" variant="subtle" borderRadius="md" px={2} py={0.5} fontSize="9px">
                        No Link
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={1.5} align="center">
                      <Box
                        w="7px"
                        h="7px"
                        borderRadius="full"
                        bg={row.approved ? 'green.400' : 'orange.400'}
                        boxShadow={row.approved ? '0 0 6px #48BB78' : '0 0 6px #ED8936'}
                      />
                      <Text fontSize="xs" fontWeight="bold" color={row.approved ? 'green.600' : 'orange.600'}>
                        {row.approved ? 'Approved' : 'Pending'}
                      </Text>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={1.5} justify="center">
                      {hasPlatformTracking && row.platform === 'Facebook' && (
                        <Tooltip label="Publish to Facebook" placement="top">
                          <IconButton
                            aria-label="Publish to Facebook"
                            icon={<FaFacebookF />}
                            size="xs"
                            colorScheme="facebook"
                            variant="solid"
                            borderRadius="md"
                            h="24px"
                            w="24px"
                            onClick={() => openPublishPreview(row)}
                          />
                        </Tooltip>
                      )}
                      {hasPlatformTracking && row.platform === 'Instagram' && (
                        <Tooltip label="Publish to Instagram" placement="top">
                          <IconButton
                            aria-label="Publish to Instagram"
                            icon={<FaInstagram />}
                            size="xs"
                            colorScheme="pink"
                            variant="solid"
                            borderRadius="md"
                            h="24px"
                            w="24px"
                            onClick={() => openPublishInstagramPreview(row)}
                          />
                        </Tooltip>
                      )}
                      {hasPlatformTracking && row.platform === 'LinkedIn' && (
                        <Tooltip label="Publish to LinkedIn" placement="top">
                          <IconButton
                            aria-label="Publish to LinkedIn"
                            icon={<FaLinkedinIn />}
                            size="xs"
                            colorScheme="linkedin"
                            variant="solid"
                            borderRadius="md"
                            h="24px"
                            w="24px"
                            onClick={() => openPublishLinkedinPreview(row)}
                          />
                        </Tooltip>
                      )}
                      {hasManagerAccess && !row.approved && (
                        <Tooltip label="Approve Post" placement="top">
                          <IconButton
                            aria-label="Approve"
                            icon={<FaCheck />}
                            size="xs"
                            variant="ghost"
                            color="green.500"
                            borderRadius="md"
                            h="24px"
                            w="24px"
                            _hover={{ bg: 'green.50', color: 'green.600' }}
                            onClick={() => handleApprove(row)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip label="View Details" placement="top">
                        <IconButton
                          aria-label="View"
                          icon={<FaEye />}
                          size="xs"
                          variant="ghost"
                          color="gray.500"
                          borderRadius="md"
                          h="24px"
                          w="24px"
                          _hover={{ bg: 'gray.100', color: 'teal.600' }}
                          onClick={() => {
                            setViewEntry(row);
                            onViewOpen();
                          }}
                        />
                      </Tooltip>
                      <Tooltip label="Edit Details" placement="top">
                        <IconButton
                          aria-label="Edit"
                          icon={<FaEdit />}
                          size="xs"
                          variant="ghost"
                          color="gray.500"
                          borderRadius="md"
                          h="24px"
                          w="24px"
                          _hover={{ bg: 'gray.100', color: 'blue.600' }}
                          onClick={() => openActionModal('Edit', row)}
                        />
                      </Tooltip>
                      <Tooltip label="Delete Entry" placement="top">
                        <IconButton
                          aria-label="Delete"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          color="gray.500"
                          borderRadius="md"
                          h="24px"
                          w="24px"
                          _hover={{ bg: 'red.50', color: 'red.600' }}
                          onClick={() => openActionModal('Delete', row)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    );
  };

  return (
    <Box w="100%" minW={0}>
      {title && (
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">{title}</Heading>
        </Flex>
      )}

      <Box
        bg="white"
        p={4}
        borderWidth="1px"
        borderColor="gray.100"
        borderRadius="12px"
        shadow="sm"
        mb={6}
      >
        <VStack align="stretch" spacing={4}>
          <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between" align="end">
            {/* Search Posts */}
            <Box flex={{ base: "none", md: "2" }} w="100%">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1.5} textTransform="uppercase" letterSpacing="0.05em">
                Search Posts
              </Text>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by title, description..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  borderRadius="8px"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px #319795" }}
                />
              </InputGroup>
            </Box>

            {/* Filter by Time Period */}
            <Box flex={{ base: "none", md: "1" }} w="100%">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1.5} textTransform="uppercase" letterSpacing="0.05em">
                Time Period
              </Text>
              <Select
                size="sm"
                h="32px"
                value={filterPeriod}
                onChange={(event) => setFilterPeriod(event.target.value)}
                borderRadius="8px"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px #319795" }}
              >
                <option value="week">Current Week</option>
                <option value="month">Selected Month</option>
                <option value="all">All Time</option>
              </Select>
            </Box>

            {/* Filter by Date */}
            <Box flex={{ base: "none", md: "1" }} w="100%">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1.5} textTransform="uppercase" letterSpacing="0.05em">
                Filter by Date
              </Text>
              <Input
                type="date"
                size="sm"
                h="32px"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                max="2026-12-31"
                borderRadius="8px"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px #319795" }}
              />
            </Box>

            {/* Add Post Button */}
            <Box w={{ base: "100%", md: "auto" }} flexShrink={0}>
              <Button
                size="sm"
                colorScheme="teal"
                onClick={handleAddEntry}
                h="32px"
                w={{ base: "100%", md: "auto" }}
                px={6}
                borderRadius="8px"
              >
                {addButtonLabel}
              </Button>
            </Box>
          </Flex>

          {/* Filter by Platform */}
          {hasPlatformTracking && (
            <Box borderTopWidth="1px" borderColor="gray.100" pt={3}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1.5} textTransform="uppercase" letterSpacing="0.05em">
                Filter by Platform
              </Text>
              <HStack spacing={2} overflowX="auto" py={1.5} px={1} css={{
                '&::-webkit-scrollbar': { height: '5px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: '4px' },
              }}>
                {['All', ...platformOptions].map((platform) => {
                  const isActive = filterPlatform === platform;
                  return (
                    <Button
                      key={platform}
                      size="sm"
                      h="30px"
                      flexShrink={0}
                      variant={isActive ? "solid" : "outline"}
                      colorScheme={isActive ? "teal" : "gray"}
                      borderColor={isActive ? "transparent" : "gray.200"}
                      leftIcon={
                        platform === 'All' ? <Icon as={FiGlobe} /> :
                          platform === 'Facebook' ? <Icon as={FaFacebookF} /> :
                            platform === 'Instagram' ? <Icon as={FaInstagram} /> :
                              platform === 'TikTok' ? <Icon as={FaTiktok} /> :
                                platform === 'YouTube' ? <Icon as={FaYoutube} /> :
                                  platform === 'LinkedIn' ? <Icon as={FaLinkedinIn} /> :
                                    platform === 'WhatsApp' ? <Icon as={FaWhatsapp} /> :
                                      platform === 'Telegram' ? <Icon as={FaTelegramPlane} /> :
                                        platform === 'Twitter (X)' ? <Icon as={FaTwitter} /> :
                                          platform === 'Google' ? <Icon as={FaGoogle} /> :
                                            undefined
                      }
                      onClick={() => setFilterPlatform(platform)}
                      borderRadius="full"
                      px={3.5}
                      fontSize="xs"
                      fontWeight="bold"
                      _hover={{ transform: 'scale(1.02)', bg: isActive ? 'teal.600' : 'gray.50' }}
                      transition="all 0.15s"
                    >
                      {platform}
                    </Button>
                  );
                })}
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {!isSalesManager && (
        <Box
          bg="white"
          borderWidth="1px"
          borderRadius="12px"
          borderColor="gray.200"
          shadow="sm"
          p={5}
          mb={6}
        >
          {/* Header row with inline Month selector */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} mb={3}>
            <HStack spacing={3} align="center">
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                {formatMonthLabel(selectedMonth)} Target Counter
              </Text>
              <Badge colorScheme={monthlyStats.isComplete ? 'green' : 'red'} borderRadius="full" px={2.5} py={0.5} fontSize="10px">
                {monthlyStats.isComplete ? 'Target Ready' : 'In Progress'}
              </Badge>
            </HStack>

            <HStack spacing={2} align="center">
              <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Select Month:
              </Text>
              <Input
                type="month"
                size="sm"
                h="32px"
                w="140px"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                max={buildMonthKey()}
                borderRadius="8px"
                borderColor="gray.200"
                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px #319795" }}
              />
            </HStack>
          </Flex>



          {/* Metric cards list */}
          <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={3}>
            {Object.entries(REQUIRED_COUNTS).map(([type, target]) => (
              <Box
                key={type}
                py={2.5}
                px={3.5}
                bg="gray.50"
                borderRadius="10px"
                borderWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: "gray.100", transform: "scale(1.02)" }}
                transition="all 0.15s"
              >
                <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                  {type}
                </Text>
                <Text fontSize="md" fontWeight="extrabold" color="gray.800" mt={0.5}>
                  {monthlyStats.counts[type]} <span style={{ color: '#A0AEC0', fontWeight: 'normal', fontSize: '11px' }}>/ {target}</span>
                </Text>
              </Box>
            ))}

            <Box
              py={2.5}
              px={3.5}
              bg="gray.50"
              borderRadius="10px"
              borderWidth="1px"
              borderColor="gray.100"
              _hover={{ bg: "gray.100", transform: "scale(1.02)" }}
              transition="all 0.15s"
            >
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                Shares
              </Text>
              <Text fontSize="md" fontWeight="extrabold" color="gray.800" mt={0.5}>
                {monthlyStats.shares} <span style={{ color: '#A0AEC0', fontWeight: 'normal', fontSize: '11px' }}>/ {SHARE_TARGET}</span>
              </Text>
            </Box>

            <Box
              py={2.5}
              px={3.5}
              bg="gray.50"
              borderRadius="10px"
              borderWidth="1px"
              borderColor="gray.100"
              _hover={{ bg: "gray.100", transform: "scale(1.02)" }}
              transition="all 0.15s"
            >
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                Approved Posts
              </Text>
              <Text fontSize="md" fontWeight="extrabold" color="gray.800" mt={0.5}>
                {monthlyStats.totalPosts}
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {renderTableSection()}

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="16px" overflow="hidden">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100" py={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="800" color="gray.800">
                {actionLabelMap[currentAction] ?? 'Action'}
              </Text>
              {currentAction === 'Create' && (
                <Button
                  size="xs"
                  colorScheme="teal"
                  variant="outline"
                  borderRadius="8px"
                  mr={8}
                  onClick={() => {
                    const template = MOCK_POST_TEMPLATES[Math.floor(Math.random() * MOCK_POST_TEMPLATES.length)];
                    setModalTitle(template.title);
                    setModalDescription(template.description);
                    setModalImageUrl(template.imageUrl);
                    setModalLink(template.link);
                    setModalShares(template.shares);
                    if (hasPlatformTracking) {
                      const randPlat = platformOptions[Math.floor(Math.random() * platformOptions.length)];
                      setModalPlatform(randPlat || defaultPlatform);
                    }
                  }}
                >
                  🪄 Auto-Fill Demo Post
                </Button>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton onClick={handleCloseModal} />
          <ModalBody py={5}>
            {(currentAction === 'Create' || (selectedItem && currentAction === 'Edit')) && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Column 1: Creative Content */}
                <VStack spacing={4} align="stretch">
                  <Text fontSize="xs" fontWeight="bold" color="teal.500" textTransform="uppercase" letterSpacing="0.05em">
                    1. Creative Content
                  </Text>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Title
                    </FormLabel>
                    <Input
                      value={modalTitle}
                      onChange={(event) => setModalTitle(event.target.value)}
                      placeholder={hasPlatformTracking ? 'e.g. Organic Coffee Special' : 'Content title'}
                      borderRadius="8px"
                      fontSize="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Description
                    </FormLabel>
                    <Textarea
                      value={modalDescription}
                      onChange={(event) => setModalDescription(event.target.value)}
                      placeholder="Describe what this content covers."
                      rows={5}
                      borderRadius="8px"
                      fontSize="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Featured Image URL {modalPlatform === 'Instagram' && <Text as="span" color="red.500">* Direct Link</Text>}
                    </FormLabel>
                    <Input
                      value={modalImageUrl}
                      onChange={(event) => setModalImageUrl(event.target.value)}
                      placeholder="https://example.com/image.jpg"
                      borderRadius="8px"
                      fontSize="sm"
                    />
                    {modalPlatform === 'Instagram' && (
                      <Text fontSize="10px" color="gray.500" mt={1}>
                        Instagram requires a direct link to an image file.
                      </Text>
                    )}
                  </FormControl>
                </VStack>

                {/* Column 2: Publishing Details */}
                <VStack spacing={4} align="stretch">
                  <Text fontSize="xs" fontWeight="bold" color="teal.500" textTransform="uppercase" letterSpacing="0.05em">
                    2. Publishing & Metrics
                  </Text>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Content Type
                    </FormLabel>
                    <Select
                      value={modalType}
                      onChange={(event) => setModalType(event.target.value)}
                      borderRadius="8px"
                      fontSize="sm"
                    >
                      {contentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {hasPlatformTracking && (
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                        Platform
                      </FormLabel>
                      <Select
                        value={modalPlatform}
                        onChange={(event) => setModalPlatform(event.target.value)}
                        borderRadius="8px"
                        fontSize="sm"
                      >
                        {platformOptions.map((platform) => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Live URL Link
                    </FormLabel>
                    <Input
                      value={modalLink}
                      onChange={(event) => setModalLink(event.target.value)}
                      placeholder="https://"
                      borderRadius="8px"
                      fontSize="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="0.05em">
                      Share Count
                    </FormLabel>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={modalShares}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setModalShares(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
                      }}
                      borderRadius="8px"
                      fontSize="sm"
                    />
                  </FormControl>
                </VStack>
              </SimpleGrid>
            )}
            {selectedItem && currentAction === 'Delete' && (
              <Text fontSize="sm" color="gray.700">
                Are you sure you want to delete <strong>{selectedItem.title}</strong> from the tracker? This action cannot be undone.
              </Text>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={3.5}>
            <Button variant="ghost" size="sm" mr={3} borderRadius="8px" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" size="sm" borderRadius="8px" onClick={handleModalConfirm}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isViewOpen} onClose={handleCloseView} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Entry Detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewEntry ? (
              <Box borderWidth="1px" borderRadius="lg" shadow="md" p={5} bg="white">
                <Flex justify="space-between" align="center" mb={3} gap={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Date
                    </Text>
                    <Text fontWeight="bold">
                      {viewEntry.date ? new Date(viewEntry.date).toISOString().split('T')[0] : '—'}
                    </Text>
                  </Box>
                  <Badge colorScheme={viewEntry.approved ? 'green' : 'yellow'}>
                    {viewEntry.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </Flex>
                <Heading size="md" mb={2}>
                  {viewEntry.title}
                </Heading>
                <Text mb={2} color="gray.600">
                  {viewEntry.description || 'No description has been provided yet.'}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Type
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {viewEntry.type || '—'}
                </Text>
                {hasPlatformTracking && (
                  <>
                    <Text fontSize="sm" mb={1} color="gray.500">
                      Platform
                    </Text>
                    <Text fontWeight="semibold" mb={2}>
                      {viewEntry.platform || 'Unassigned'}
                    </Text>
                  </>
                )}
                <Text fontSize="sm" mb={1} color="gray.500">
                  Agent Name
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {formatAgentName(viewEntry, currentUser)}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Link
                </Text>
                <Text
                  as="a"
                  href={viewEntry.link || '#'}
                  color="teal.500"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'block', marginBottom: '10px' }}
                >
                  {viewEntry.link ? viewEntry.link : 'No link provided'}
                </Text>
                {viewEntry.imageUrl && (
                  <>
                    <Text fontSize="sm" mb={1} color="gray.500">
                      Featured Image Preview
                    </Text>
                    <Box maxW="280px" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="gray.200">
                      <img src={viewEntry.imageUrl} alt="Featured" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Text>No entry selected.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCloseView}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Facebook Publish Preview Modal ── */}
      <Modal isOpen={isPublishOpen} onClose={() => { onPublishClose(); setPublishEntry(null); }} size="lg">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent borderRadius="20px" overflow="hidden" boxShadow="0 32px 80px rgba(0,0,0,0.22)">
          <ModalHeader bg="#1877F2" color="white" py={3.5}>
            <HStack spacing={2.5}>
              <Icon as={FaFacebookF} boxSize={5} />
              <Text fontWeight="800" fontSize="md">Publish to Facebook</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5}>
            {publishEntry && (
              <VStack align="stretch" spacing={5}>
                {/* Live Post Preview */}
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="12px"
                  overflow="hidden"
                  bg="white"
                  boxShadow="0 2px 12px rgba(0,0,0,0.06)"
                >
                  {/* Post Header */}
                  <HStack spacing={3} p={4} pb={2}>
                    <Avatar size="sm" bg="#1877F2" icon={<Icon as={FaFacebookF} color="white" boxSize={4} />} />
                    <Box>
                      <Text fontSize="sm" fontWeight="700">Your Facebook Page</Text>
                      <Text fontSize="10px" color="gray.400">Just now · 🌍 Public</Text>
                    </Box>
                  </HStack>

                  {/* Post Body */}
                  <Box px={4} pb={3}>
                    <Text fontSize="sm" fontWeight="600" mb={1}>{publishEntry.title}</Text>
                    {publishEntry.description && (
                      <Text fontSize="xs" color="gray.600" mb={2} whiteSpace="pre-wrap">
                        {publishEntry.description}
                      </Text>
                    )}
                  </Box>

                  {/* Link Card Preview */}
                  {publishEntry.link && (
                    <Box mx={4} mb={3} p={3} bg="gray.50" borderRadius="8px" borderWidth="1px" borderColor="gray.200">
                      <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="700" mb={1}>Link Preview</Text>
                      <Text fontSize="xs" color="blue.600" noOfLines={1} wordBreak="break-all">
                        {publishEntry.link}
                      </Text>
                    </Box>
                  )}

                  {/* Fake Reactions Bar */}
                  <Divider />
                  <HStack px={4} py={2.5} justify="space-around" color="gray.500" fontSize="xs" fontWeight="600">
                    <Text>👍 Like</Text>
                    <Text>💬 Comment</Text>
                    <Text>↗ Share</Text>
                  </HStack>
                </Box>

                {/* Meta Info */}
                <Box p={3} bg="blue.50" borderRadius="10px" fontSize="xs">
                  <HStack spacing={2} mb={1.5}>
                    <Badge colorScheme="blue" borderRadius="full" px={2}>Platform</Badge>
                    <Text fontWeight="600">{publishEntry.platform || 'Facebook'}</Text>
                  </HStack>
                  <HStack spacing={2} mb={1.5}>
                    <Badge colorScheme="purple" borderRadius="full" px={2}>Type</Badge>
                    <Text fontWeight="600">{publishEntry.type || '—'}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge colorScheme="green" borderRadius="full" px={2}>Agent</Badge>
                    <Text fontWeight="600">{formatAgentName(publishEntry, currentUser)}</Text>
                  </HStack>
                </Box>

                <Alert status="info" borderRadius="10px" fontSize="xs">
                  <AlertIcon boxSize={4} />
                  This will post the content directly to your linked Facebook Page via the Meta Graph API.
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" py={3}>
            <Button variant="ghost" mr={3} onClick={() => { onPublishClose(); setPublishEntry(null); }} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="facebook"
              leftIcon={<Icon as={FaFacebookF} />}
              onClick={handlePublishToFacebook}
              isLoading={isPublishing}
              loadingText="Publishing..."
              size="sm"
              borderRadius="10px"
            >
              Publish Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Instagram Publish Preview Modal (Live Feed Simulator) ── */}
      <Modal isOpen={isPublishInstagramOpen} onClose={() => { onPublishInstagramClose(); setPublishInstagramEntry(null); }} size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent borderRadius="20px" overflow="hidden" boxShadow="0 32px 80px rgba(0,0,0,0.3)">
          <ModalHeader bg="linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" color="white" py={3.5}>
            <HStack spacing={2.5}>
              <Icon as={FaInstagram} boxSize={5} />
              <Text fontWeight="800" fontSize="md">Instagram Live Simulator</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5} px={4} bg={useColorModeValue("gray.50", "gray.900")}>
            {publishInstagramEntry && (
              <VStack align="stretch" spacing={5}>
                {/* Live Post Simulator */}
                <Box
                  borderWidth="1px"
                  borderColor={useColorModeValue("gray.200", "gray.700")}
                  borderRadius="16px"
                  overflow="hidden"
                  bg={useColorModeValue("white", "gray.800")}
                  boxShadow="0 8px 30px rgba(0,0,0,0.08)"
                >
                  {/* Instagram Header */}
                  <Flex px={3.5} py={3} justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar size="sm" name={formatAgentName(publishInstagramEntry, currentUser)} bg="linear-gradient(45deg, #f09433, #dc2743, #cc2366)" p="2px" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" fontWeight="700" lineHeight="1.2">
                          {formatAgentName(publishInstagramEntry, currentUser).replace(/\s+/g, '_').toLowerCase()}
                        </Text>
                        <Text fontSize="10px" color="gray.500" lineHeight="1.2">Addis Ababa, Ethiopia</Text>
                      </VStack>
                    </HStack>
                    <Text fontWeight="bold" fontSize="lg" color="gray.500" cursor="pointer" mt="-10px">•••</Text>
                  </Flex>

                  {/* Instagram Image */}
                  <Box bg="gray.100" position="relative" ratio={1}>
                    {(publishInstagramEntry.imageUrl || publishInstagramEntry.link)?.startsWith('http') ? (
                      <img
                        src={publishInstagramEntry.imageUrl || publishInstagramEntry.link}
                        alt="Instagram content"
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <Flex h="240px" direction="column" justify="center" align="center" p={6} bg="red.50" _dark={{ bg: "red.900Alpha.10" }}>
                        <Icon as={FaInstagram} boxSize={8} color="red.400" mb={2} />
                        <Text fontSize="xs" color="red.600" fontWeight="700" textAlign="center">
                          No Featured Image URL Provided
                        </Text>
                        <Text fontSize="10px" color="red.500" mt={1} textAlign="center">
                          Go back and edit this post to supply a valid image link before publishing.
                        </Text>
                      </Flex>
                    )}
                  </Box>

                  {/* Actions Bar */}
                  <Flex justify="space-between" px={3.5} py={3}>
                    <HStack spacing={4}>
                      <Text fontSize="md" cursor="pointer" _hover={{ transform: "scale(1.1)" }} transition="0.1s">❤️</Text>
                      <Text fontSize="md" cursor="pointer" _hover={{ transform: "scale(1.1)" }} transition="0.1s">💬</Text>
                      <Text fontSize="md" cursor="pointer" _hover={{ transform: "scale(1.1)" }} transition="0.1s">✈️</Text>
                    </HStack>
                    <Text fontSize="md" cursor="pointer">🔖</Text>
                  </Flex>

                  {/* Likes Info */}
                  <Box px={3.5} pb={1.5}>
                    <Text fontSize="11px" fontWeight="700">Liked by 12 others</Text>
                  </Box>

                  {/* Caption */}
                  <Box px={3.5} pb={4}>
                    <Text fontSize="xs" lineHeight="tall">
                      <strong style={{ marginRight: '6px' }}>
                        {formatAgentName(publishInstagramEntry, currentUser).replace(/\s+/g, '_').toLowerCase()}
                      </strong>
                      <span style={{ fontWeight: '600' }}>{publishInstagramEntry.title}</span>
                      {publishInstagramEntry.description && ` — ${publishInstagramEntry.description}`}
                    </Text>
                    <Text fontSize="9px" color="gray.400" mt={2} textTransform="uppercase">Just now</Text>
                  </Box>
                </Box>

                {/* Warnings / Alerts */}
                {(!publishInstagramEntry.imageUrl && !publishInstagramEntry.link?.startsWith('http')) && (
                  <Alert status="error" borderRadius="12px" py={3.5}>
                    <AlertIcon />
                    <Box fontSize="xs">
                      <Text fontWeight="800">Publishing Blocked</Text>
                      <Text mt={0.5}>Instagram publishing requires a public image URL. Please edit this content row to supply an image link first.</Text>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg={useColorModeValue("gray.50", "gray.800")} py={3}>
            <Button variant="ghost" mr={3} onClick={() => { onPublishInstagramClose(); setPublishInstagramEntry(null); }} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="pink"
              leftIcon={<Icon as={FaInstagram} />}
              onClick={handlePublishToInstagram}
              isLoading={isPublishingInstagram}
              isDisabled={!publishInstagramEntry?.imageUrl && !publishInstagramEntry?.link?.startsWith('http')}
              loadingText="Publishing..."
              size="sm"
              borderRadius="10px"
            >
              Publish Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── LinkedIn Publish Preview Modal (Live Feed Simulator) ── */}
      <Modal isOpen={isPublishLinkedinOpen} onClose={() => { onPublishLinkedinClose(); setPublishLinkedinEntry(null); }} size="lg">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent borderRadius="20px" overflow="hidden" boxShadow="0 32px 80px rgba(0,0,0,0.22)">
          <ModalHeader bg="#0A66C2" color="white" py={3.5}>
            <HStack spacing={2.5}>
              <Icon as={FaLinkedinIn} boxSize={5} />
              <Text fontWeight="800" fontSize="md">LinkedIn Live Simulator</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5} px={4} bg={useColorModeValue("gray.50", "gray.900")}>
            {publishLinkedinEntry && (
              <VStack align="stretch" spacing={5}>
                {/* Live Post Simulator */}
                <Box
                  borderWidth="1px"
                  borderColor={useColorModeValue("gray.200", "gray.700")}
                  borderRadius="12px"
                  overflow="hidden"
                  bg={useColorModeValue("white", "gray.800")}
                  boxShadow="0 4px 16px rgba(0,0,0,0.06)"
                >
                  {/* LinkedIn Header */}
                  <Flex px={4} py={3.5} justify="space-between" align="start">
                    <HStack spacing={3} align="start">
                      <Avatar size="sm" name={formatAgentName(publishLinkedinEntry, currentUser)} bg="#0A66C2" color="white" />
                      <Box>
                        <HStack spacing={1} align="center">
                          <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.800", "white")}>
                            {formatAgentName(publishLinkedinEntry, currentUser)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">· 1st</Text>
                        </HStack>
                        <Text fontSize="10px" color="gray.500" noOfLines={1}>
                          Social Media Manager at TradeEthiopia
                        </Text>
                        <HStack spacing={1} align="center" mt={0.5}>
                          <Text fontSize="9px" color="gray.400">1h ·</Text>
                          <Text fontSize="9px" color="gray.400">🌐</Text>
                        </HStack>
                      </Box>
                    </HStack>
                    <Button size="xs" variant="ghost" colorScheme="linkedin" leftIcon={<Text fontSize="xs">+</Text>} borderRadius="full">
                      Follow
                    </Button>
                  </Flex>

                  {/* LinkedIn Body Text */}
                  <Box px={4} pb={3}>
                    <Text fontSize="xs" fontWeight="600" mb={1} color={useColorModeValue("gray.800", "white")}>
                      {publishLinkedinEntry.title}
                    </Text>
                    {publishLinkedinEntry.description && (
                      <Text fontSize="xs" color={useColorModeValue("gray.600", "gray.300")} whiteSpace="pre-wrap">
                        {publishLinkedinEntry.description}
                      </Text>
                    )}
                  </Box>

                  {/* Optional Image Body */}
                  {(publishLinkedinEntry.imageUrl || publishLinkedinEntry.link?.startsWith('http')) && (
                    <Box borderTopWidth="1px" borderColor={useColorModeValue("gray.100", "gray.700")}>
                      <img
                        src={publishLinkedinEntry.imageUrl || publishLinkedinEntry.link}
                        alt="LinkedIn Attachment"
                        style={{ width: '100%', height: 'auto', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                  )}

                  {/* Simulated Interactions */}
                  <Flex px={4} py={2} justify="space-between" borderBottomWidth="1px" borderColor={useColorModeValue("gray.100", "gray.700")} fontSize="10px" color="gray.500">
                    <HStack spacing={1}>
                      <Text>👍❤️💡 14</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Text>2 comments</Text>
                      <Text>•</Text>
                      <Text>1 repost</Text>
                    </HStack>
                  </Flex>

                  {/* Actions Bar */}
                  <HStack px={4} py={2.5} justify="space-around" color={useColorModeValue("gray.600", "gray.300")} fontSize="xs" fontWeight="600">
                    <Text cursor="pointer">👍 Like</Text>
                    <Text cursor="pointer">💬 Comment</Text>
                    <Text cursor="pointer">🔁 Repost</Text>
                    <Text cursor="pointer">✈️ Send</Text>
                  </HStack>
                </Box>

                {/* Info alert */}
                <Alert status="info" borderRadius="10px" fontSize="xs">
                  <AlertIcon boxSize={4} />
                  This will publish a professional post directly to your connected LinkedIn profile or company page.
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg={useColorModeValue("gray.50", "gray.850")} py={3}>
            <Button variant="ghost" mr={3} onClick={() => { onPublishLinkedinClose(); setPublishLinkedinEntry(null); }} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="linkedin"
              leftIcon={<Icon as={FaLinkedinIn} />}
              onClick={handlePublishToLinkedIn}
              isLoading={isPublishingLinkedin}
              loadingText="Publishing..."
              size="sm"
              borderRadius="10px"
            >
              Publish Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ContentTrackerPage;
