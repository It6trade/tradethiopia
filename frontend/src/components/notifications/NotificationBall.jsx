import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { BsBell } from 'react-icons/bs';
import {
  FiCheck,
  FiCheckCircle,
  FiExternalLink,
  FiFileText,
  FiInbox,
  FiLayers,
  FiUserCheck,
  FiClock,
  FiRefreshCw,
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/notificationService';
import { useUserStore } from '../../store/user';

const socketBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: FiLayers },
  { id: 'onboarding', label: 'Onboarding', icon: FiUserCheck },
  { id: 'documents', label: 'Documents', icon: FiFileText },
  { id: 'requests', label: 'Requests', icon: FiInbox },
  { id: 'tasks', label: 'Tasks & IT', icon: FiCheckCircle },
  { id: 'general', label: 'General', icon: FiClock },
];

const formatTimeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const normalizeCategory = (item) => {
  const cat = String(item.category || '').toLowerCase();
  const type = String(item.type || '').toLowerCase();
  const text = String(item.text || item.title || '').toLowerCase();
  const meta = item.metadata || {};

  if (
    cat === 'risk document' ||
    type === 'risk document' ||
    meta.isRiskDocument ||
    meta.isHazard ||
    cat === 'document' ||
    cat === 'compliance' ||
    text.includes('license') ||
    text.includes('risk document')
  ) {
    return 'documents';
  }

  if (
    cat === 'onboarding' ||
    type === 'onboarding' ||
    cat === 'verification' ||
    text.includes('verification') ||
    text.includes('onboarding') ||
    text.includes('personal info') ||
    text.includes('personal information') ||
    meta.employeeId ||
    meta.employeeName
  ) {
    return 'onboarding';
  }

  if (
    cat === 'leave' ||
    cat === 'request' ||
    type === 'request' ||
    text.includes('leave') ||
    text.includes('request') ||
    text.includes('approval')
  ) {
    return 'requests';
  }

  if (
    cat === 'task' ||
    cat === 'project' ||
    type === 'task' ||
    type === 'comment' ||
    type === 'reminder' ||
    item.itTaskId ||
    item.taskId
  ) {
    return 'tasks';
  }

  return 'general';
};

const getCategoryBadgeConfig = (item) => {
  const normCat = normalizeCategory(item);
  const rawCat = (item.category || item.type || 'general').toLowerCase();

  if (
    item.type === 'risk document' ||
    item.category === 'risk document' ||
    item.metadata?.isRiskDocument ||
    item.metadata?.isHazard
  ) {
    return {
      label: 'RISK DOCUMENT',
      colorScheme: 'red',
      bg: 'red.500',
      color: 'white',
      border: 'none',
      boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)',
    };
  }

  switch (normCat) {
    case 'onboarding':
      return {
        label: 'ONBOARDING',
        colorScheme: 'teal',
        bg: 'teal.50',
        color: 'teal.700',
        border: '1px solid',
        borderColor: 'teal.200',
      };
    case 'documents':
      return {
        label: 'DOCUMENT',
        colorScheme: 'cyan',
        bg: 'cyan.50',
        color: 'cyan.700',
        border: '1px solid',
        borderColor: 'cyan.200',
      };
    case 'requests':
      return {
        label: rawCat === 'leave' ? 'LEAVE REQUEST' : 'REQUEST',
        colorScheme: 'orange',
        bg: 'orange.50',
        color: 'orange.700',
        border: '1px solid',
        borderColor: 'orange.200',
      };
    case 'tasks':
      return {
        label: item.type === 'comment' ? 'COMMENT' : item.type === 'reminder' ? 'REMINDER' : 'TASK',
        colorScheme: 'blue',
        bg: 'blue.50',
        color: 'blue.700',
        border: '1px solid',
        borderColor: 'blue.200',
      };
    default:
      return {
        label: (item.category || item.type || 'GENERAL').toUpperCase(),
        colorScheme: 'gray',
        bg: 'gray.100',
        color: 'gray.700',
        border: '1px solid',
        borderColor: 'gray.200',
      };
  }
};

const buildNotificationLink = (item, currentUser = null) => {
  if (item.type === 'risk document' || item.category === 'risk document' || item.metadata?.isRiskDocument) {
    return item.link || '/documentlist';
  }

  const role = String(currentUser?.role || currentUser?.displayRole || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isCS = ['customerservice', 'customersuccessmanager', 'cs', 'csmanager'].includes(role);
  const isIT = ['admin', 'itmanager', 'itadmin', 'it', 'itstaff', 'itteamleader', 'itleader', 'itofficer'].includes(role);
  const isTicket = item.metadata?.isTicket || item.type === 'ticket' || item.link?.includes('tab=tickets');

  if (item.itTaskId) {
    if (isCS) {
      return `/cdashboard?section=it-requests&task=${item.itTaskId}${item.commentId ? `&comment=${item.commentId}` : ''}`;
    }
    if (isTicket) {
      return `/it?tab=tickets&task=${item.itTaskId}${item.commentId ? `&comment=${item.commentId}` : ''}`;
    }
    if (item.link && item.link.startsWith('/it')) {
      return item.link;
    }
    return `/it?tab=projects&task=${item.itTaskId}${item.commentId ? `&comment=${item.commentId}` : ''}`;
  }

  if (item.link && item.link.startsWith('/cdashboard') && (isIT || !isCS)) {
    try {
      const parsed = new URL(item.link, window.location.origin);
      const taskId = parsed.searchParams.get('task') || parsed.searchParams.get('taskId');
      const commentId = parsed.searchParams.get('comment') || parsed.searchParams.get('commentId');
      if (taskId) {
        return `/it?tab=${isTicket ? 'tickets' : 'projects'}&task=${taskId}${commentId ? `&comment=${commentId}` : ''}`;
      }
    } catch (_) {}
  }

  if (item.link && item.link.startsWith('/it') && isCS) {
    try {
      const parsed = new URL(item.link, window.location.origin);
      const taskId = parsed.searchParams.get('task') || parsed.searchParams.get('taskId');
      const commentId = parsed.searchParams.get('comment') || parsed.searchParams.get('commentId');
      if (taskId) {
        return `/cdashboard?section=it-requests&task=${taskId}${commentId ? `&comment=${commentId}` : ''}`;
      }
    } catch (_) {}
  }

  if (item.metadata?.employeeId || item.metadata?.userId) {
    const empId = item.metadata.employeeId || item.metadata.userId;
    return `/users?userId=${empId}&tab=2`;
  }

  return item.link || '';
};

const appendNotificationContext = (link, item) => {
  if (!link) return '';
  try {
    const url = new URL(link, window.location.origin);
    const title = getNotificationTitle(item);
    const detail = getNotificationDetail(item);
    const preview = getCommentPreview(item);
    url.searchParams.set('notification', item._id || item.id || '');
    url.searchParams.set('noticeType', item.type || 'notification');
    if (title) url.searchParams.set('noticeTitle', title);
    if (item.text) url.searchParams.set('noticeText', item.text);
    if (detail) url.searchParams.set('noticeDetail', detail);
    if (preview) url.searchParams.set('noticePreview', preview);
    if (item.createdAt) url.searchParams.set('noticeTime', item.createdAt);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (error) {
    return link;
  }
};

const getNotificationTitle = (item) => {
  if (item.type === 'risk document' || item.category === 'risk document' || item.metadata?.isRiskDocument) {
    return item.metadata?.title || 'Risk Document: License Renewal Alert';
  }
  if (['comment', 'task', 'reminder'].includes(item.type)) {
    return item.metadata?.title || (item.type === 'reminder' ? 'Task reminder' : item.type === 'task' ? 'IT task update' : 'New task comment');
  }
  if (item.category === 'onboarding' || item.type === 'onboarding') {
    return item.metadata?.title || item.title || 'Employee Verification Pending';
  }
  return item.title || item.text || item.message || 'Notification';
};

const getNotificationDetail = (item) => {
  if (item.type === 'risk document' || item.category === 'risk document' || item.metadata?.isRiskDocument) {
    return item.text || '';
  }
  if (['comment', 'task', 'reminder'].includes(item.type)) {
    const taskTitle = item.metadata?.taskTitle ? `Task: ${item.metadata.taskTitle}` : '';
    const author = item.metadata?.authorName || item.metadata?.actorName ? `By ${item.metadata.authorName || item.metadata.actorName}` : '';
    const reminder = item.metadata?.reminderTitle ? `Reminder: ${item.metadata.reminderTitle}` : '';
    return [taskTitle, reminder, author].filter(Boolean).join(' - ');
  }
  if (item.title && item.text && item.title !== item.text) {
    return item.text;
  }
  return item.metadata?.message || '';
};

const getCommentPreview = (item) =>
  String(item.metadata?.commentPreview || '')
    .replace(/\s+/g, ' ')
    .trim();

const shouldKeepVisible = (item) => item.type === 'reminder' && item.metadata?.keepVisible;

export default function NotificationBall({ extraNotifications = [], iconColor = 'white' }) {
  const currentUser = useUserStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const toast = useToast();

  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const cardHoverBorder = useColorModeValue('teal.300', 'teal.500');
  const cardBg = useColorModeValue('white', 'gray.850');
  const unreadCardBg = useColorModeValue('#f8fafc', 'whiteAlpha.100');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const buttonBg = useColorModeValue('white', 'whiteAlpha.100');
  const buttonBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const buttonShadow = useColorModeValue('0 6px 20px rgba(0, 0, 0, 0.08)', '0 6px 20px rgba(0, 0, 0, 0.3)');
  const menuBg = useColorModeValue('white', 'gray.900');
  const itemBorder = useColorModeValue('gray.100', 'whiteAlpha.100');

  const loadNotifications = async () => {
    if (!currentUser?.token) return;
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Notifications unavailable',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.token]);

  useEffect(() => {
    if (!currentUser?._id) return undefined;
    const socket = io(socketBaseUrl, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('registerUser', currentUser._id);
    });
    socket.on('newNotification', (notification) => {
      setNotifications((current) => [
        {
          _id: notification.id || notification._id,
          text: notification.text,
          read: notification.read ?? false,
          type: notification.type || 'general',
          category: notification.category || 'general',
          documentId: notification.documentId || notification.metadata?.documentId,
          itTaskId: notification.itTaskId,
          commentId: notification.commentId,
          link: notification.link,
          metadata: notification.metadata,
          createdAt: notification.createdAt || new Date().toISOString(),
        },
        ...current.filter(
          (item) =>
            (notification.documentId && String(item.documentId || item.metadata?.documentId) !== String(notification.documentId)) ||
            (notification._id && String(item._id || item.id) !== String(notification._id))
        ),
      ]);
    });
    socket.on('notification:resolved', ({ documentId }) => {
      setNotifications((current) =>
        current.filter((n) => {
          const itemDocId = n.documentId || n.metadata?.documentId;
          if (documentId && String(itemDocId) === String(documentId)) {
            return false;
          }
          return true;
        })
      );
    });
    return () => socket.close();
  }, [currentUser?._id]);

  const combined = useMemo(() => {
    const map = new Map();
    notifications.forEach((item) => {
      const key = item._id || item.id || (item.documentId ? `doc-${item.documentId}` : null) || item.text;
      if (key) map.set(String(key), item);
    });
    extraNotifications.forEach((item) => {
      const key = item._id || item.id || (item.documentId ? `doc-${item.documentId}` : null) || item.text;
      if (key && !map.has(String(key))) {
        map.set(String(key), { ...item, read: item.read ?? false, local: true });
      }
    });
    return Array.from(map.values()).filter((item) => !item.read || shouldKeepVisible(item));
  }, [extraNotifications, notifications]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: combined.length, onboarding: 0, documents: 0, requests: 0, tasks: 0, general: 0 };
    combined.forEach((item) => {
      const cat = normalizeCategory(item);
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      } else {
        counts.general += 1;
      }
    });
    return counts;
  }, [combined]);

  // Filtered by active tab
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return combined;
    return combined.filter((item) => normalizeCategory(item) === activeCategory);
  }, [combined, activeCategory]);

  const unreadCount = combined.filter((item) => !item.read).length;
  const hasUnreadRisk = combined.some(
    (item) =>
      !item.read &&
      (item.type === 'risk document' ||
        item.category === 'risk document' ||
        item.metadata?.isRiskDocument ||
        item.metadata?.isHazard)
  );

  const markOneRead = async (item, e = null) => {
    if (e) e.stopPropagation();
    if (item.local || item.read) {
      setNotifications((current) => current.filter((n) => (n._id || n.id) !== (item._id || item.id)));
      return item;
    }
    try {
      const updated = await markNotificationAsRead(item._id || item.id);
      setNotifications((current) =>
        shouldKeepVisible(updated)
          ? current.map((notification) => (notification._id === updated._id ? updated : notification))
          : current.filter((notification) => notification._id !== updated._id)
      );
      return updated;
    } catch (error) {
      toast({ title: 'Unable to mark notification read', status: 'error', duration: 1800 });
      return item;
    }
  };

  const openNotification = async (item) => {
    await markOneRead(item);
    const link = buildNotificationLink(item, currentUser);
    if (link) {
      navigate(appendNotificationContext(link, item));
    }
  };

  const markAllRead = async () => {
    try {
      if (activeCategory === 'all') {
        await markAllNotificationsAsRead();
        setNotifications((current) =>
          current
            .map((item) => ({ ...item, read: true }))
            .filter(shouldKeepVisible)
        );
      } else {
        const itemsToMark = filteredNotifications.filter((item) => !item.local && !item.read);
        await Promise.all(itemsToMark.map((item) => markNotificationAsRead(item._id || item.id)));
        setNotifications((current) =>
          current
            .map((item) => {
              if (normalizeCategory(item) === activeCategory) {
                return { ...item, read: true };
              }
              return item;
            })
            .filter(shouldKeepVisible)
        );
      }
      toast({
        title: 'Marked as read',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    } catch (error) {
      toast({ title: 'Unable to mark all read', status: 'error', duration: 1800 });
    }
  };

  return (
    <Menu placement="bottom-end">
      <Tooltip label="Notifications">
        <MenuButton
          as={IconButton}
          icon={
            <Box position="relative">
              <Box
                position="absolute"
                inset="-8px"
                borderRadius="full"
                bg={hasUnreadRisk ? 'red.500' : unreadCount > 0 ? 'teal.400' : 'transparent'}
                opacity={hasUnreadRisk ? 0.35 : unreadCount > 0 ? 0.18 : 0}
                animation={hasUnreadRisk ? 'hazardPulse 1.3s infinite' : unreadCount > 0 ? 'notificationPulse 1.7s infinite' : 'none'}
              />
              <BsBell color={hasUnreadRisk ? '#EF4444' : iconColor} size={19} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-10px"
                  right="-12px"
                  colorScheme={hasUnreadRisk ? 'red' : 'teal'}
                  bg={hasUnreadRisk ? 'red.600' : 'teal.600'}
                  color="white"
                  borderRadius="full"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="10px"
                  fontWeight="800"
                  px={1}
                  boxShadow={hasUnreadRisk ? '0 0 8px rgba(239, 68, 68, 0.9), 0 0 0 2px white' : '0 0 0 2px white'}
                  animation={hasUnreadRisk ? 'hazardPulse 1.3s infinite' : 'notificationPulse 1.7s infinite'}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Box>
          }
          variant="ghost"
          aria-label="Notifications"
          border="1px solid"
          borderColor={hasUnreadRisk ? 'red.300' : buttonBorder}
          bg={buttonBg}
          boxShadow={hasUnreadRisk ? '0 0 14px rgba(239, 68, 68, 0.35)' : unreadCount > 0 ? buttonShadow : 'none'}
          borderRadius="full"
          sx={{
            '@keyframes notificationPulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '70%': { transform: 'scale(1.18)', opacity: 0.35 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
            '@keyframes hazardPulse': {
              '0%': { transform: 'scale(1)', opacity: 0.9 },
              '50%': { transform: 'scale(1.24)', opacity: 0.45 },
              '100%': { transform: 'scale(1)', opacity: 0.9 },
            },
            '@keyframes hazardDotPulse': {
              '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.85)' },
              '60%': { transform: 'scale(1.28)', boxShadow: '0 0 0 7px rgba(239, 68, 68, 0)' },
              '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
            },
          }}
          _hover={{ bg: unreadCardBg, transform: 'translateY(-1px)' }}
        />
      </Tooltip>

      <Portal>
        <MenuList
          p={0}
          w="490px"
          maxW="calc(100vw - 28px)"
          overflow="hidden"
          zIndex="9999"
          bg={menuBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          boxShadow="0 24px 60px -12px rgba(15, 23, 42, 0.22), 0 0 1px rgba(15, 23, 42, 0.15)"
        >
          {/* Header Card */}
          <Box p={4} pb={3} bg={menuBg}>
            <Flex justify="space-between" align="center">
              <Box>
                <HStack spacing={2.5}>
                  <Text fontWeight="800" fontSize="lg" color={useColorModeValue('gray.900', 'white')}>
                    Notifications
                  </Text>
                  {hasUnreadRisk && (
                    <Badge colorScheme="red" bg="red.500" color="white" fontSize="2xs" borderRadius="full" px={2.5} py={0.5} fontWeight="800">
                      HAZARD ALERT
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="xs" color={muted} mt={0.5}>
                  {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}
                </Text>
              </Box>

              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="gray"
                  onClick={loadNotifications}
                  leftIcon={loading ? <Spinner size="xs" /> : <Icon as={FiRefreshCw} />}
                  borderRadius="lg"
                  px={2.5}
                >
                  Refresh
                </Button>
                <Button
                  size="xs"
                  colorScheme="teal"
                  variant="solid"
                  onClick={markAllRead}
                  isDisabled={!filteredNotifications.length}
                  borderRadius="lg"
                  px={3}
                >
                  Mark all read
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Interactive Category Filter Pills Bar */}
          <Box
            px={4}
            pb={3}
            pt={1}
            overflowX="auto"
            whiteSpace="nowrap"
            sx={{
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <HStack spacing={2} minW="max-content">
              {CATEGORY_TABS.map((tab) => {
                const count = categoryCounts[tab.id] || 0;
                const isActive = activeCategory === tab.id;
                const TabIcon = tab.icon;

                return (
                  <Button
                    key={tab.id}
                    size="sm"
                    height="32px"
                    borderRadius="full"
                    variant={isActive ? 'solid' : 'ghost'}
                    colorScheme={isActive ? 'teal' : 'gray'}
                    bg={isActive ? 'teal.600' : useColorModeValue('gray.100', 'gray.800')}
                    color={isActive ? 'white' : useColorModeValue('gray.700', 'gray.300')}
                    px={3.5}
                    fontSize="xs"
                    fontWeight={isActive ? '700' : '600'}
                    onClick={() => setActiveCategory(tab.id)}
                    leftIcon={<Icon as={TabIcon} boxSize={3.5} />}
                    _hover={{
                      bg: isActive ? 'teal.700' : useColorModeValue('gray.200', 'gray.700'),
                    }}
                    transition="all 0.2s"
                  >
                    <Text as="span">{tab.label}</Text>
                    {count > 0 && (
                      <Badge
                        ml={2}
                        borderRadius="full"
                        fontSize="10px"
                        fontWeight="800"
                        px={1.5}
                        py={0.2}
                        colorScheme={isActive ? 'whiteAlpha' : 'teal'}
                        bg={isActive ? 'whiteAlpha.300' : useColorModeValue('teal.100', 'teal.900')}
                        color={isActive ? 'white' : useColorModeValue('teal.800', 'teal.200')}
                      >
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </HStack>
          </Box>

          <Divider borderColor={itemBorder} />

          {/* Notification Items List */}
          <Box maxH="460px" overflowY="auto" p={3} bg={useColorModeValue('gray.50', 'gray.900')}>
            {filteredNotifications.length === 0 ? (
              <Box py={12} px={4} textAlign="center">
                <Flex
                  boxSize="52px"
                  borderRadius="2xl"
                  bg={useColorModeValue('white', 'gray.800')}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.700')}
                  align="center"
                  justify="center"
                  mx="auto"
                  mb={3}
                  boxShadow="xs"
                >
                  <Icon as={FiInbox} boxSize={6} color="teal.500" />
                </Flex>
                <Text fontWeight="800" fontSize="md" color={useColorModeValue('gray.800', 'gray.100')}>
                  No {activeCategory !== 'all' ? activeCategory : ''} notifications
                </Text>
                <Text fontSize="xs" color={muted} mt={1} maxW="300px" mx="auto">
                  You're all caught up! When new updates arrive, they will appear right here.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={2.5}>
                {filteredNotifications.map((item, index) => {
                  const link = buildNotificationLink(item, currentUser);
                  const canOpen = Boolean(link);
                  const title = getNotificationTitle(item);
                  const detail = getNotificationDetail(item);
                  const preview = getCommentPreview(item);
                  const isRiskDoc =
                    item.type === 'risk document' ||
                    item.category === 'risk document' ||
                    item.metadata?.isRiskDocument ||
                    item.metadata?.isHazard;
                  const badgeConfig = getCategoryBadgeConfig(item);

                  return (
                    <Box
                      key={item._id || item.id || `${item.text}-${index}`}
                      p={4}
                      borderRadius="xl"
                      bg={
                        !item.read
                          ? isRiskDoc
                            ? useColorModeValue('red.50', 'rgba(239, 68, 68, 0.12)')
                            : useColorModeValue('white', 'gray.800')
                          : useColorModeValue('white', 'gray.800')
                      }
                      border="1px solid"
                      borderColor={
                        isRiskDoc && !item.read
                          ? 'red.300'
                          : !item.read
                          ? useColorModeValue('teal.200', 'teal.700')
                          : cardBorder
                      }
                      borderLeft={
                        isRiskDoc && !item.read
                          ? '4px solid #EF4444'
                          : !item.read
                          ? '4px solid #319795'
                          : '4px solid transparent'
                      }
                      boxShadow="xs"
                      cursor={canOpen ? 'pointer' : 'default'}
                      onClick={() => (canOpen ? openNotification(item) : undefined)}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'sm',
                        borderColor: isRiskDoc
                          ? 'red.400'
                          : !item.read
                          ? 'teal.400'
                          : cardHoverBorder,
                      }}
                    >
                      <HStack align="start" spacing={3.5}>
                        {/* Status Dot */}
                        <Box
                          w="10px"
                          h="10px"
                          borderRadius="full"
                          bg={isRiskDoc ? 'red.500' : !item.read ? 'teal.500' : 'gray.300'}
                          boxShadow={
                            isRiskDoc
                              ? '0 0 10px #ef4444, 0 0 4px #dc2626'
                              : !item.read
                              ? '0 0 6px rgba(49, 151, 149, 0.5)'
                              : 'none'
                          }
                          animation={isRiskDoc && !item.read ? 'hazardDotPulse 1.3s infinite' : 'none'}
                          mt={1.5}
                          flexShrink={0}
                        />

                        <Box flex="1" minW={0} lineHeight="1.4">
                          {/* Title & Mark Read Checkmark Button */}
                          <HStack justify="space-between" align="start" spacing={2}>
                            <Text
                              fontSize="sm"
                              fontWeight={!item.read ? '800' : '700'}
                              color={
                                isRiskDoc
                                  ? useColorModeValue('red.900', 'red.200')
                                  : useColorModeValue('gray.900', 'white')
                              }
                              noOfLines={2}
                            >
                              {title}
                            </Text>

                            <Tooltip label="Mark as read">
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorScheme="gray"
                                icon={<Icon as={FiCheck} boxSize={3.5} />}
                                aria-label="Mark as read"
                                onClick={(e) => markOneRead(item, e)}
                                flexShrink={0}
                                borderRadius="md"
                                _hover={{ bg: useColorModeValue('gray.100', 'gray.700'), color: 'teal.600' }}
                              />
                            </Tooltip>
                          </HStack>

                          {/* Description Detail */}
                          {detail && (
                            <Text
                              fontSize="xs"
                              color={isRiskDoc ? useColorModeValue('red.700', 'red.300') : muted}
                              mt={1}
                              noOfLines={3}
                            >
                              {detail}
                            </Text>
                          )}

                          {item.metadata?.taskLocation && (
                            <Text fontSize="xs" color={muted} mt={1} noOfLines={2}>
                              {item.metadata.taskLocation}
                            </Text>
                          )}

                          {item.type === 'comment' && preview && (
                            <Text fontSize="xs" color={muted} mt={1} fontStyle="italic" noOfLines={2}>
                              &quot;{preview}&quot;
                            </Text>
                          )}

                          {/* Footer Badges & Actions */}
                          <HStack mt={3} spacing={2} align="center" flexWrap="wrap">
                            <Badge
                              fontSize="9px"
                              fontWeight="800"
                              borderRadius="full"
                              px={2.5}
                              py={0.5}
                              colorScheme={badgeConfig.colorScheme}
                              bg={badgeConfig.bg}
                              color={badgeConfig.color}
                              border={badgeConfig.border}
                              borderColor={badgeConfig.borderColor}
                              boxShadow={badgeConfig.boxShadow}
                              textTransform="uppercase"
                            >
                              {badgeConfig.label}
                            </Badge>

                            <Text fontSize="10px" color={muted} fontWeight="500">
                              {formatTimeAgo(item.createdAt)}
                            </Text>

                            {shouldKeepVisible(item) && item.read && (
                              <Badge size="sm" colorScheme="purple" variant="outline" fontSize="9px" borderRadius="full">
                                reminder on
                              </Badge>
                            )}

                            {canOpen && (
                              <Badge
                                fontSize="9px"
                                fontWeight="700"
                                borderRadius="full"
                                px={2.5}
                                py={0.5}
                                colorScheme={isRiskDoc ? 'red' : 'teal'}
                                variant={isRiskDoc ? 'solid' : 'subtle'}
                                ml="auto"
                              >
                                <HStack spacing={1}>
                                  <Text>{item.metadata?.actionLabel || (isRiskDoc ? 'View Document Library' : 'Open')}</Text>
                                  <Icon as={FiExternalLink} boxSize={2.5} />
                                </HStack>
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </MenuList>
      </Portal>
    </Menu>
  );
}
