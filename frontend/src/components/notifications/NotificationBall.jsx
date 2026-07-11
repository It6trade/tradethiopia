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

const buildNotificationLink = (item) => (
  item.link ||
  (item.itTaskId ? `/it?tab=projects&task=${item.itTaskId}${item.commentId ? `&comment=${item.commentId}` : ''}` : '')
);

const getNotificationTitle = (item) => {
  if (['comment', 'task', 'reminder'].includes(item.type)) {
    return item.metadata?.title || (item.type === 'reminder' ? 'Task reminder' : item.type === 'task' ? 'IT task update' : 'New task comment');
  }
  return item.text || item.message || item.title || 'Notification';
};

const getNotificationDetail = (item) => {
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
          itTaskId: notification.itTaskId,
          commentId: notification.commentId,
          link: notification.link,
          metadata: notification.metadata,
          createdAt: notification.createdAt || new Date().toISOString(),
        },
        ...current,
      ]);
    });
    return () => socket.close();
  }, [currentUser?._id]);

  const combined = useMemo(
    () => [
      ...extraNotifications.map((item) => ({ ...item, read: item.read ?? false, local: true })),
      ...notifications,
    ].filter((item) => !item.read || shouldKeepVisible(item)),
    [extraNotifications, notifications]
  );

  const unreadCount = combined.filter((item) => !item.read).length;

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
    const link = buildNotificationLink(item);
    if (link) {
      navigate(link);
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
                bg={unreadCount > 0 ? 'blue.400' : 'transparent'}
                opacity={unreadCount > 0 ? 0.18 : 0}
                animation={unreadCount > 0 ? 'notificationPulse 1.7s infinite' : 'none'}
              />
              <BsBell color={iconColor} size={20} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-12px"
                  right="-14px"
                  colorScheme="red"
                  borderRadius="full"
                  minW="20px"
                  px={1.5}
                  boxShadow="0 0 0 3px white"
                  animation="notificationPulse 1.7s infinite"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Box>
          }
          variant="ghost"
          aria-label="Notifications"
          border="1px solid"
          borderColor={buttonBorder}
          bg={buttonBg}
          boxShadow={unreadCount > 0 ? buttonShadow : 'none'}
          borderRadius="full"
          sx={{
            '@keyframes notificationPulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '70%': { transform: 'scale(1.18)', opacity: 0.35 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
          _hover={{ bg: unreadBg, transform: 'translateY(-1px)' }}
        />
      </Tooltip>
      <Portal>
        <MenuList p={0} w="380px" maxW="calc(100vw - 24px)" overflow="hidden" zIndex="9999" bg={menuBg} boxShadow="0 24px 70px rgba(15, 23, 42, 0.20)">
        <HStack justify="space-between" px={4} py={3} bg={menuBg}>
          <Box>
            <Text fontWeight="900">Notifications</Text>
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
                const link = buildNotificationLink(item);
                const canOpen = Boolean(link);
                const title = getNotificationTitle(item);
                const detail = getNotificationDetail(item);
                const preview = getCommentPreview(item);
                return (
                <Box
                  key={item._id || item.id || `${item.text}-${index}`}
                  px={4}
                  py={2.5}
                  bg={!item.read ? unreadBg : itemBg}
                  borderBottom="1px solid"
                  borderColor={itemBorder}
                  cursor={canOpen ? 'pointer' : item.local ? 'default' : 'pointer'}
                  onClick={() => (canOpen || !item.local ? openNotification(item) : undefined)}
                  _hover={{ bg: unreadBg }}
                >
                  <HStack align="start" spacing={3}>
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={!item.read ? 'blue.400' : 'gray.300'}
                      mt={1.5}
                      flexShrink={0}
                    />
                    <Box flex="1" minW={0} lineHeight="1.35">
                      <Text fontSize="sm" fontWeight={!item.read ? '800' : '700'} noOfLines={2}>
                        {title}
                      </Text>
                      {detail && (
                        <Text fontSize="xs" color={muted} mt={0.5} noOfLines={2}>
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
                          "{preview}"
                        </Text>
                      )}
                      <HStack mt={2} spacing={2} align="center" flexWrap="wrap">
                        <Badge size="sm" colorScheme={getTypeColor(item.type)}>
                          {item.type || 'general'}
                        </Badge>
                        <Text fontSize="xs" color={muted}>{formatTimeAgo(item.createdAt)}</Text>
                        {shouldKeepVisible(item) && item.read && (
                          <Badge size="sm" colorScheme="purple" variant="outline">
                            reminder on
                          </Badge>
                        )}
                        {canOpen && (
                          <Badge size="sm" colorScheme={getTypeColor(item.type)} variant="subtle">
                            {item.metadata?.actionLabel || 'Open'}
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
