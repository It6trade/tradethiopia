import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
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
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/notificationService';
import { useUserStore } from '../../store/user';

const socketBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatTimeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const buildNotificationLink = (item, currentUser = null) => {
  if (item.type === 'risk document' || item.category === 'risk document' || item.metadata?.isRiskDocument) {
    return item.link || '/documentlist';
  }

  const role = String(currentUser?.role || currentUser?.displayRole || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isCS = ['customerservice', 'customersuccessmanager', 'cs', 'csmanager'].includes(role);
  const isIT = ['admin', 'itmanager', 'itadmin', 'it', 'itstaff', 'itteamleader', 'itleader', 'itofficer'].includes(role);
  const isTicket = item.metadata?.isTicket || item.type === 'ticket' || item.link?.includes('tab=tickets');

  // If notification has an itTaskId, route according to viewing user's active portal
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

  // If notification link points to /cdashboard but current user is IT manager/staff, convert to /it
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

  // If notification link points to /it but current user is CS, convert to /cdashboard
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

  // If notification contains employeeId in metadata or link, route to /users with specific user drawer
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
  return item.text || item.message || item.title || 'Notification';
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
  return '';
};

const getCommentPreview = (item) =>
  String(item.metadata?.commentPreview || '')
    .replace(/\s+/g, ' ')
    .trim();

const shouldKeepVisible = (item) => item.type === 'reminder' && item.metadata?.keepVisible;
const getTypeColor = (type) => {
  if (type === 'risk document' || type === 'risk') return 'red';
  if (type === 'task') return 'orange';
  if (type === 'chat') return 'green';
  if (type === 'comment') return 'blue';
  if (type === 'reminder') return 'purple';
  return 'gray';
};

export default function NotificationBall({ extraNotifications = [], iconColor = 'white' }) {
  const currentUser = useUserStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const unreadBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const itemBorder = useColorModeValue('gray.100', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const buttonBg = useColorModeValue('white', 'whiteAlpha.100');
  const buttonBorder = useColorModeValue('blue.100', 'whiteAlpha.200');
  const buttonShadow = useColorModeValue('0 10px 28px rgba(37, 99, 235, 0.16)', '0 10px 28px rgba(14, 165, 233, 0.18)');
  const menuBg = useColorModeValue('white', 'gray.900');
  const itemBg = useColorModeValue('white', 'gray.900');

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
    const interval = setInterval(loadNotifications, 30000);
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
          category: notification.category,
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
    socket.on('notification:resolved', ({ documentId, type }) => {
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

  const unreadCount = combined.filter((item) => !item.read).length;
  const hasUnreadRisk = combined.some(
    (item) =>
      !item.read &&
      (item.type === 'risk document' ||
        item.category === 'risk document' ||
        item.metadata?.isRiskDocument ||
        item.metadata?.isHazard)
  );

  const markOneRead = async (item) => {
    if (item.local || item.read) return item;
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
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current
          .map((item) => ({ ...item, read: true }))
          .filter(shouldKeepVisible)
      );
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
                bg={hasUnreadRisk ? 'red.500' : unreadCount > 0 ? 'blue.400' : 'transparent'}
                opacity={hasUnreadRisk ? 0.35 : unreadCount > 0 ? 0.18 : 0}
                animation={hasUnreadRisk ? 'hazardPulse 1.3s infinite' : unreadCount > 0 ? 'notificationPulse 1.7s infinite' : 'none'}
              />
              <BsBell color={hasUnreadRisk ? '#EF4444' : iconColor} size={20} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-12px"
                  right="-14px"
                  colorScheme={hasUnreadRisk ? 'red' : 'red'}
                  bg={hasUnreadRisk ? 'red.600' : undefined}
                  color={hasUnreadRisk ? 'white' : undefined}
                  borderRadius="full"
                  minW="20px"
                  px={1.5}
                  boxShadow={hasUnreadRisk ? '0 0 8px rgba(239, 68, 68, 0.9), 0 0 0 2px white' : '0 0 0 3px white'}
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
          _hover={{ bg: unreadBg, transform: 'translateY(-1px)' }}
        />
      </Tooltip>
      <Portal>
        <MenuList p={0} w="390px" maxW="calc(100vw - 24px)" overflow="hidden" zIndex="9999" bg={menuBg} boxShadow="0 24px 70px rgba(15, 23, 42, 0.20)">
        <HStack justify="space-between" px={4} py={3} bg={menuBg}>
          <Box>
            <HStack spacing={2}>
              <Text fontWeight="900">Notifications</Text>
              {hasUnreadRisk && (
                <Badge colorScheme="red" bg="red.500" color="white" fontSize="2xs" borderRadius="full" px={2}>
                  HAZARD ALERT
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={muted}>{unreadCount} unread updates</Text>
          </Box>
          <HStack>
            <Button size="xs" variant="ghost" onClick={loadNotifications} leftIcon={loading ? <Spinner size="xs" /> : undefined}>
              Refresh
            </Button>
            <Button size="xs" colorScheme="blue" variant="outline" onClick={markAllRead} isDisabled={!unreadCount}>
              Mark all read
            </Button>
          </HStack>
        </HStack>
        <Divider />
        <Box maxH="420px" overflowY="auto" bg={menuBg}>
          {combined.length === 0 ? (
            <Box py={8} textAlign="center">
              <Text fontWeight="700">No notifications yet</Text>
              <Text fontSize="sm" color={muted}>Tasks, reminders, comments, reports, and chats will appear here.</Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={0}>
              {combined.map((item, index) => {
                const link = buildNotificationLink(item, currentUser);
                const canOpen = Boolean(link);
                const title = getNotificationTitle(item);
                const detail = getNotificationDetail(item);
                const preview = getCommentPreview(item);
                const isRiskDoc = item.type === 'risk document' || item.category === 'risk document' || item.metadata?.isRiskDocument || item.metadata?.isHazard;

                return (
                <Box
                  key={item._id || item.id || `${item.text}-${index}`}
                  px={4}
                  py={3}
                  bg={!item.read ? (isRiskDoc ? useColorModeValue('red.50', 'rgba(239, 68, 68, 0.12)') : unreadBg) : itemBg}
                  borderBottom="1px solid"
                  borderColor={isRiskDoc && !item.read ? 'red.200' : itemBorder}
                  borderLeft={isRiskDoc && !item.read ? '4px solid #EF4444' : undefined}
                  cursor={canOpen ? 'pointer' : item.local ? 'default' : 'pointer'}
                  onClick={() => (canOpen || !item.local ? openNotification(item) : undefined)}
                  _hover={{ bg: isRiskDoc ? useColorModeValue('red.100', 'rgba(239, 68, 68, 0.2)') : unreadBg }}
                >
                  <HStack align="start" spacing={3}>
                    {/* HAZARD RED POPUP DOT FOR RISK DOCUMENT */}
                    <Box
                      w="11px"
                      h="11px"
                      borderRadius="full"
                      bg={isRiskDoc ? 'red.500' : (!item.read ? 'blue.400' : 'gray.300')}
                      boxShadow={isRiskDoc ? '0 0 10px #ef4444, 0 0 4px #dc2626' : (!item.read ? '0 0 6px rgba(59, 130, 246, 0.5)' : 'none')}
                      animation={isRiskDoc && !item.read ? 'hazardDotPulse 1.3s infinite' : 'none'}
                      mt={1.5}
                      flexShrink={0}
                    />
                    <Box flex="1" minW={0} lineHeight="1.35">
                      <HStack justify="space-between" align="start">
                        <Text fontSize="sm" fontWeight={!item.read ? '800' : '700'} color={isRiskDoc ? (useColorModeValue('red.900', 'red.200')) : undefined} noOfLines={2}>
                          {title}
                        </Text>
                      </HStack>
                      {detail && (
                        <Text fontSize="xs" color={isRiskDoc ? (useColorModeValue('red.700', 'red.300')) : muted} mt={0.5} noOfLines={3}>
                          {detail}
                        </Text>
                      )}
                      {item.metadata?.taskLocation && (
                        <Text fontSize="xs" color={muted} mt={1} noOfLines={2}>
                          {item.metadata.taskLocation}
                        </Text>
                      )}
                      {item.type === 'comment' && preview && (
                        <Text fontSize="xs" color={muted} mt={1} noOfLines={2}>
                          &quot;{preview}&quot;
                        </Text>
                      )}
                      <HStack mt={2} spacing={2} align="center" flexWrap="wrap">
                        {/* NOTIFICATION CATEGORY: "risk document" in hazard red badge */}
                        {isRiskDoc ? (
                          <Badge
                            size="sm"
                            colorScheme="red"
                            bg="red.500"
                            color="white"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            fontWeight="extrabold"
                            textTransform="lowercase"
                            boxShadow="0 0 6px rgba(239, 68, 68, 0.35)"
                          >
                            risk document
                          </Badge>
                        ) : (
                          <Badge size="sm" colorScheme={getTypeColor(item.type)}>
                            {item.category || item.type || 'general'}
                          </Badge>
                        )}
                        <Text fontSize="xs" color={muted}>{formatTimeAgo(item.createdAt)}</Text>
                        {shouldKeepVisible(item) && item.read && (
                          <Badge size="sm" colorScheme="purple" variant="outline">
                            reminder on
                          </Badge>
                        )}
                        {canOpen && (
                          <Badge size="sm" colorScheme={isRiskDoc ? 'red' : getTypeColor(item.type)} variant={isRiskDoc ? 'solid' : 'subtle'}>
                            {item.metadata?.actionLabel || (isRiskDoc ? 'View Document Library' : 'Open')}
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
