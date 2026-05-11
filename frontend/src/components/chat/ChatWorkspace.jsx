import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Tab,
  TabList,
  Tabs,
  Text,
  Textarea,
  Tooltip,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ArrowForwardIcon, ChatIcon, SearchIcon } from '@chakra-ui/icons';
import { FaPaperclip, FaThumbtack, FaVolumeMute } from 'react-icons/fa';
import {
  listChatUsers,
  listConversationMessages,
  listConversations,
  createDirectConversation,
  createGroupConversation,
  deleteConversationMessage,
  markConversationRead,
  sendConversationMessage,
  updateConversationMessage,
  uploadConversationAttachments,
} from '../../services/chatService';
import { useChat } from '../../hooks/useChat';
import { useUserStore } from '../../store/user';

const groupCreatorRoles = new Set(['admin', 'finance', 'coo', 'supervisor', 'salesmanager', 'hr', 'it']);

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDisplayName = (user) => user?.fullName || user?.username || 'Unknown user';

const CHAT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'groups', label: 'Groups' },
  { key: 'channels', label: 'Channels' },
];

const findDepartmentConversation = (conversations, departmentLabel) =>
  conversations.find((conversation) => {
    if (conversation.kind !== 'department') return false;
    return String(conversation.title || '').toLowerCase().includes(departmentLabel.toLowerCase());
  });

const findManagedConversation = (conversations, managedKey) =>
  conversations.find((conversation) => conversation.kind === 'group' && conversation.managedKey === managedKey);

const formatConversationDay = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return formatTime(value);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getConversationKindLabel = (conversation) => {
  if (conversation.managedKey === 'sales-team') return 'Team';
  if (conversation.managedKey === 'sales-leadership') return 'Lead';
  if (conversation.kind === 'department') return 'Channel';
  if (conversation.kind === 'group') return 'Group';
  return 'Direct';
};

const getConversationStatusGlyph = (conversation) => {
  if (Number(conversation.unreadCount || 0) > 0) return '●';
  return '✓✓';
};

const isPinnedConversation = (conversation) =>
  ['sales-team', 'sales-leadership'].includes(conversation.managedKey) || conversation.kind === 'department';
const MESSAGE_PAGE_SIZE = 30;

const mergeConversation = (current, incoming) => {
  const next = incoming?.conversation || incoming;
  if (!next?._id) return current;
  const withoutCurrent = current.filter((item) => item._id !== next._id);
  return [next, ...withoutCurrent].sort(
    (left, right) => new Date(right.lastActivityAt || 0) - new Date(left.lastActivityAt || 0)
  );
};

const ChatWorkspace = ({ embedded = false, initialConversationId = '', preferredView = 'default' }) => {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [composer, setComposer] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [directory, setDirectory] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [activeMessageMatchIndex, setActiveMessageMatchIndex] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [creatingDirectId, setCreatingDirectId] = useState('');
  const [hasAppliedPreference, setHasAppliedPreference] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const createGroupModal = useDisclosure();
  const attachmentInputRef = useRef(null);

  const deferredUserSearch = useDeferredValue(userSearch);
  const bg = useColorModeValue('gray.50', 'gray.900');
  const panelBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const salesListBg = useColorModeValue('#f4faf5', 'teal.900');
  const salesDividerColor = useColorModeValue('#e6edf3', 'whiteAlpha.200');
  const hoverConversationBg = useColorModeValue('#f7fafc', 'whiteAlpha.50');
  const selectedBg = useColorModeValue('#eef8f6', 'teal.900');
  const ownBubbleBg = useColorModeValue('#dff6e7', 'teal.500');
  const otherBubbleBg = useColorModeValue('white', 'whiteAlpha.100');
  const sidebarBg = useColorModeValue('#ffffff', 'gray.800');
  const searchBg = useColorModeValue('white', 'whiteAlpha.100');
  const composerBg = useColorModeValue('white', 'gray.900');
  const ownMetaColor = useColorModeValue('teal.700', 'teal.100');
  const messageAreaBg = useColorModeValue(
    'radial-gradient(circle at 18% 14%, rgba(34,197,94,0.07), transparent 22%), radial-gradient(circle at 82% 8%, rgba(59,130,246,0.08), transparent 18%), linear-gradient(180deg, #eef8f0, #e8f3eb)',
    'radial-gradient(circle at 18% 14%, rgba(34,197,94,0.08), transparent 22%), radial-gradient(circle at 82% 8%, rgba(59,130,246,0.07), transparent 18%), linear-gradient(180deg, #10231d, #0b1720)'
  );
  const simpleMessageBg = useColorModeValue('#eaf1f8', '#1f2937');
  const canCreateGroups = groupCreatorRoles.has(currentUser?.normalizedRole || currentUser?.role);
  const shellMinHeight = embedded ? 'calc(100vh - 120px)' : 'calc(100vh - 82px)';
  const leftRailHeight = preferredView === 'sales' ? (embedded ? 'calc(100vh - 150px)' : '72vh') : (embedded ? 'calc(100vh - 220px)' : '60vh');
  const isSalesLayout = preferredView === 'sales';

  const selectedConversation = useMemo(
    () => conversations.find((item) => item._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );
  const normalizedMessageSearch = messageSearch.trim().toLowerCase();

  const tabCounts = useMemo(
    () => ({
      all: conversations.length,
      contacts: conversations.filter((item) => item.kind === 'direct').length,
      groups: conversations.filter((item) => item.kind === 'group').length,
      channels: conversations.filter((item) => item.kind === 'department').length,
    }),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    if (activeTab === 'contacts') return conversations.filter((item) => item.kind === 'direct');
    if (activeTab === 'groups') return conversations.filter((item) => item.kind === 'group');
    if (activeTab === 'channels') return conversations.filter((item) => item.kind === 'department');
    return conversations;
  }, [activeTab, conversations]);

  const unreadConversationCount = useMemo(
    () => conversations.filter((item) => Number(item.unreadCount || 0) > 0).length,
    [conversations]
  );

  const salesChannelConversation = useMemo(
    () => findDepartmentConversation(conversations, 'sales'),
    [conversations]
  );
  const salesTeamConversation = useMemo(
    () => findManagedConversation(conversations, 'sales-team'),
    [conversations]
  );

  const salesManagerUsers = useMemo(
    () =>
      directory.filter((user) => {
        const role = String(user.normalizedRole || user.role || '').toLowerCase();
        return role === 'salesmanager';
      }),
    [directory]
  );

  const salesDirectory = useMemo(() => {
    if (preferredView !== 'sales') return directory;

    const rankUser = (user) => {
      const role = String(user.normalizedRole || user.role || '').toLowerCase();
      const department = String(user.department || '').toLowerCase();
      if (role === 'salesmanager') return 0;
      if (role === 'sales' || department === 'sales') return 1;
      if (role === 'finance' || department === 'finance') return 2;
      return 3;
    };

    return [...directory].sort((left, right) => {
      const rankDiff = rankUser(left) - rankUser(right);
      if (rankDiff !== 0) return rankDiff;
      return getDisplayName(left).localeCompare(getDisplayName(right));
    });
  }, [directory, preferredView]);

  const salesListUsers = useMemo(() => {
    return salesDirectory.filter((user) => {
      const existingDirect = conversations.find(
        (conversation) =>
          conversation.kind === 'direct' &&
          conversation.participants?.some((participant) => participant.user?._id === user._id)
      );

      if (showUnreadOnly && Number(existingDirect?.unreadCount || 0) <= 0) {
        return false;
      }

      if (!userSearch.trim()) return true;
      const search = userSearch.toLowerCase();
      return [getDisplayName(user), user.department, user.role, user.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [salesDirectory, userSearch, conversations, showUnreadOnly]);

  const visibleConversations = useMemo(() => {
    if (!showUnreadOnly) return filteredConversations;
    return filteredConversations.filter((item) => Number(item.unreadCount || 0) > 0);
  }, [filteredConversations, showUnreadOnly]);
  const matchedMessageIds = useMemo(() => {
    if (!normalizedMessageSearch) return [];
    return messages
      .filter((message) => {
        const body = String(message.body || '').toLowerCase();
        const attachmentNames = (message.attachments || []).map((item) => String(item.name || '').toLowerCase());
        return body.includes(normalizedMessageSearch) || attachmentNames.some((name) => name.includes(normalizedMessageSearch));
      })
      .map((message) => message._id);
  }, [messages, normalizedMessageSearch]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await listConversations();
      const data = response.data || [];
      setConversations(data);
      if ((!selectedConversationId || !data.some((item) => item._id === selectedConversationId)) && data.length) {
        setSelectedConversationId(data[0]._id);
      }
    } catch (error) {
      toast({
        title: 'Unable to load conversations',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadDirectory = async (search = '') => {
    try {
      const response = await listChatUsers(search);
      setDirectory(response.data || []);
    } catch (error) {
      toast({
        title: 'Unable to load user directory',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    }
  };

  const loadMessages = async (conversationId, options = {}) => {
    if (!conversationId) return;
    const { before = '', append = false } = options;
    try {
      if (append) {
        setLoadingOlderMessages(true);
      } else {
        setLoadingMessages(true);
      }
      const response = await listConversationMessages(conversationId, before, MESSAGE_PAGE_SIZE);
      const data = response.data || [];
      setHasOlderMessages(data.length === MESSAGE_PAGE_SIZE);
      setMessages((current) => (append ? [...data, ...current] : data));
      const visibleChunk = append ? [] : data;
      const lastIncoming = [...visibleChunk].reverse().find((message) => message.sender?._id !== currentUser?._id);
      if (lastIncoming?._id && !append) {
        await markConversationRead(conversationId, lastIncoming._id);
      }
    } catch (error) {
      toast({
        title: 'Unable to load messages',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    } finally {
      if (append) {
        setLoadingOlderMessages(false);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    loadConversations();
    loadDirectory();
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    loadDirectory(deferredUserSearch);
  }, [deferredUserSearch]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    setPendingAttachments([]);
    setReplyTarget(null);
    setEditingMessageId('');
    setMessageSearch('');
    setActiveMessageMatchIndex(0);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!matchedMessageIds.length) {
      setActiveMessageMatchIndex(0);
      return;
    }
    setActiveMessageMatchIndex((current) => Math.min(current, matchedMessageIds.length - 1));
  }, [matchedMessageIds]);

  useEffect(() => {
    if (hasAppliedPreference || !conversations.length) return;

    if (preferredView === 'sales') {
      const existingManagerConversation = salesManagerUsers[0]?._id
        ? conversations.find(
            (item) =>
              item.kind === 'direct' &&
              item.participants?.some((participant) => participant.user?._id === salesManagerUsers[0]._id)
          )
        : null;
      const preferredConversation = existingManagerConversation || salesTeamConversation || salesChannelConversation;
      if (preferredConversation) {
        setSelectedConversationId((current) => current || preferredConversation._id);
        setActiveTab(
          preferredConversation.kind === 'direct'
            ? 'contacts'
            : preferredConversation.kind === 'group'
              ? 'groups'
              : 'channels'
        );
        setHasAppliedPreference(true);
        return;
      }
    }

    setHasAppliedPreference(true);
  }, [
    preferredView,
    conversations,
    hasAppliedPreference,
    salesTeamConversation,
    salesChannelConversation,
    salesManagerUsers,
  ]);

  const { emitTyping } = useChat(selectedConversationId, {
    onMessageCreated: async (payload) => {
      if (payload?.conversationId !== selectedConversationId) return;
      setMessages((current) => {
        if (current.some((item) => item._id === payload.message?._id)) return current;
        return [...current, payload.message];
      });
      if (payload.message?.sender?._id !== currentUser?._id) {
        await markConversationRead(payload.conversationId, payload.message._id);
      }
    },
    onConversationUpdated: (payload) => {
      setConversations((current) => mergeConversation(current, payload));
    },
    onMessageRead: ({ conversationId, messageId, userId, readAt }) => {
      if (conversationId !== selectedConversationId) return;
      setMessages((current) =>
        current.map((message) =>
          message._id !== messageId
            ? message
            : {
                ...message,
                readBy: message.readBy?.some((item) => item.user?._id === userId)
                  ? message.readBy
                  : [...(message.readBy || []), { user: { _id: userId }, readAt }],
              }
        )
      );
    },
    onMessageUpdated: ({ conversationId, message }) => {
      if (conversationId !== selectedConversationId || !message?._id) return;
      setMessages((current) => current.map((item) => (item._id === message._id ? message : item)));
    },
    onMessageDeleted: ({ conversationId, messageId }) => {
      if (conversationId !== selectedConversationId || !messageId) return;
      setMessages((current) => current.filter((item) => item._id !== messageId));
    },
    onTyping: ({ conversationId, userId, isTyping }) => {
      if (conversationId !== selectedConversationId || !userId || userId === currentUser?._id) return;
      setTypingUsers((current) => ({
        ...current,
        [userId]: !!isTyping,
      }));
    },
    onPresence: ({ userId, isOnline }) => {
      if (!userId) return;
      setOnlineUsers((current) => ({
        ...current,
        [userId]: !!isOnline,
      }));
    },
  });

  useEffect(() => {
    if (!selectedConversationId || !currentUser?._id || !emitTyping) return undefined;

    const timeout = setTimeout(() => {
      emitTyping({
        conversationId: selectedConversationId,
        userId: currentUser._id,
        isTyping: !!composer.trim(),
      });
    }, 180);

    return () => clearTimeout(timeout);
  }, [composer, selectedConversationId, currentUser?._id, emitTyping]);

  const startDirectChat = async (participantId) => {
    try {
      setCreatingDirectId(participantId);
      const response = await createDirectConversation(participantId);
      const conversation = response.data;
      setConversations((current) => mergeConversation(current, conversation));
      setSelectedConversationId(conversation._id);
      setUserSearch('');
    } catch (error) {
      toast({
        title: 'Unable to start chat',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    } finally {
      setCreatingDirectId('');
    }
  };

  const removePendingAttachment = (indexToRemove) => {
    setPendingAttachments((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const startReplyToMessage = (message) => {
    if (!message?._id) return;
    setReplyTarget({
      _id: message._id,
      body: message.body || '',
      sender: message.sender || null,
    });
    setEditingMessageId('');
  };

  const startEditingMessage = (message) => {
    if (!message?._id) return;
    setEditingMessageId(message._id);
    setReplyTarget(null);
    setComposer(message.body || '');
  };

  const removeMessageForSelf = async (message) => {
    if (!selectedConversationId || !message?._id) return;
    try {
      await deleteConversationMessage(selectedConversationId, message._id);
      setMessages((current) => current.filter((item) => item._id !== message._id));
      if (editingMessageId === message._id) {
        setEditingMessageId('');
        setComposer('');
      }
      if (replyTarget?._id === message._id) {
        setReplyTarget(null);
      }
    } catch (error) {
      toast({
        title: 'Unable to delete message',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    }
  };

  const handleAttachmentSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selectedConversationId || !files.length) return;

    try {
      setUploadingAttachments(true);
      const response = await uploadConversationAttachments(selectedConversationId, files);
      const attachments = response.data || [];
      setPendingAttachments((current) => [...current, ...attachments].slice(0, 5));
    } catch (error) {
      toast({
        title: 'Unable to upload attachments',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleSend = async () => {
    if (!selectedConversationId || (!composer.trim() && !pendingAttachments.length)) return;
    try {
      setSending(true);
      let response;
      if (editingMessageId) {
        response = await updateConversationMessage(selectedConversationId, editingMessageId, {
          body: composer.trim(),
        });
        setMessages((current) =>
          current.map((item) => (item._id === response.data?._id ? response.data : item))
        );
      } else {
        response = await sendConversationMessage(selectedConversationId, {
          body: composer.trim(),
          attachments: pendingAttachments,
          replyTo: replyTarget?._id || '',
        });
        setMessages((current) => [...current, response.data]);
      }
      setComposer('');
      setPendingAttachments([]);
      setReplyTarget(null);
      setEditingMessageId('');
    } catch (error) {
      toast({
        title: 'Unable to send message',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    } finally {
      setSending(false);
    }
  };

  const submitGroup = async () => {
    try {
      const response = await createGroupConversation({
        title: groupTitle,
        description: groupDescription,
        participantIds: selectedGroupUsers,
      });
      const conversation = response.data;
      setConversations((current) => mergeConversation(current, conversation));
      setSelectedConversationId(conversation._id);
      setGroupTitle('');
      setGroupDescription('');
      setSelectedGroupUsers([]);
      createGroupModal.onClose();
    } catch (error) {
      toast({
        title: 'Unable to create group',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 2500,
      });
    }
  };

  const toggleGroupUser = (userId) => {
    setSelectedGroupUsers((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]
    );
  };

  const openConversationById = (conversationId, tab = 'all') => {
    setActiveTab(tab);
    setSelectedConversationId(conversationId);
  };

  const loadOlderMessages = async () => {
    const oldestMessageId = messages[0]?._id;
    if (!selectedConversationId || !oldestMessageId || loadingOlderMessages) return;
    await loadMessages(selectedConversationId, { before: oldestMessageId, append: true });
  };

  const jumpToFirstUnread = async () => {
    const unreadConversation = conversations.find((item) => Number(item.unreadCount || 0) > 0);
    if (!unreadConversation) return;

    if (isSalesLayout && unreadConversation.kind === 'direct') {
      setSelectedConversationId(unreadConversation._id);
      return;
    }

    openConversationById(
      unreadConversation._id,
      unreadConversation.kind === 'department'
        ? 'channels'
        : unreadConversation.kind === 'group'
          ? 'groups'
          : 'contacts'
    );
  };

  const openUserChat = async (user) => {
    const existingDirect = conversations.find(
      (conversation) =>
        conversation.kind === 'direct' &&
        conversation.participants?.some((participant) => participant.user?._id === user._id)
    );

    if (existingDirect) {
      openConversationById(existingDirect._id, 'contacts');
      return;
    }

    await startDirectChat(user._id);
    setActiveTab('contacts');
  };

  const getSalesWorkspaceBadge = () => {
    if (!selectedConversation) return '';
    if (selectedConversation.kind === 'department') return 'Sales channel';
    if (selectedConversation.managedKey === 'sales-team') return 'Sales team';
    if (selectedConversation.managedKey === 'sales-leadership') return 'Sales leadership';
    return '';
  };

  const selectedPeer = useMemo(() => {
    if (!selectedConversation || !currentUser?._id) return null;
    return selectedConversation.participants?.find(
      (participant) => participant.user?._id && participant.user._id !== currentUser._id
    )?.user || null;
  }, [selectedConversation, currentUser?._id]);
  const selectedPeerIsOnline = selectedPeer?._id ? !!onlineUsers[selectedPeer._id] : false;
  const selectedPeerIsTyping = selectedPeer?._id ? !!typingUsers[selectedPeer._id] : false;

  return (
    <Box bg={embedded ? 'transparent' : bg} minH={shellMinHeight}>
      <Grid
        templateColumns={{ base: '1fr', lg: embedded ? '320px minmax(0, 1fr)' : '320px minmax(0, 1fr) 280px' }}
        gap={isSalesLayout ? 2 : 4}
        h="100%"
      >
        <GridItem>
          <Box
            bg={sidebarBg}
            border="1px solid"
            borderColor={isSalesLayout ? salesDividerColor : borderColor}
            borderRadius={isSalesLayout ? '14px' : '28px'}
            overflow="hidden"
            h="100%"
            boxShadow="sm"
          >
            {!isSalesLayout && (
              <Flex align="center" justify="space-between" px={4} pt={4} pb={2}>
                <Box>
                  <Text fontSize="lg" fontWeight="bold">
                    Workspace Chat
                  </Text>
                  <Text fontSize="sm" color={mutedText}>
                    Search, direct chat, groups
                  </Text>
                </Box>
                {canCreateGroups && (
                  <Tooltip label="Create group">
                    <IconButton
                      icon={<AddIcon />}
                      size="sm"
                      colorScheme="teal"
                      borderRadius="full"
                      onClick={createGroupModal.onOpen}
                      aria-label="Create group"
                    />
                  </Tooltip>
                )}
              </Flex>
            )}
            <Box px={isSalesLayout ? 2 : 4} pb={isSalesLayout ? 1 : 3} pt={isSalesLayout ? 2 : 0}>
              <InputGroup size="md">
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder={isSalesLayout ? 'Search' : 'Search'}
                  bg={searchBg}
                  borderRadius="full"
                  borderColor="transparent"
                  _focusVisible={{ borderColor: 'blue.300', boxShadow: '0 0 0 1px var(--chakra-colors-blue-300)' }}
                />
                <InputRightElement><SearchIcon color={mutedText} /></InputRightElement>
              </InputGroup>
            </Box>
            <Box px={isSalesLayout ? 2 : 4} pb={isSalesLayout ? 1 : 2}>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant={showUnreadOnly ? 'outline' : 'solid'}
                  colorScheme={isSalesLayout ? 'green' : 'blue'}
                  borderRadius="full"
                  onClick={() => setShowUnreadOnly(false)}
                >
                  All
                </Button>
                <Button
                  size="xs"
                  variant={showUnreadOnly ? 'solid' : 'outline'}
                  colorScheme={isSalesLayout ? 'green' : 'blue'}
                  borderRadius="full"
                  onClick={() => setShowUnreadOnly(true)}
                >
                  Unread
                  {!!unreadConversationCount && (
                    <Badge ml={1.5} borderRadius="full" colorScheme={showUnreadOnly ? 'blackAlpha' : 'green'}>
                      {unreadConversationCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  onClick={jumpToFirstUnread}
                  isDisabled={!unreadConversationCount}
                >
                  Jump
                </Button>
              </HStack>
            </Box>
            {!isSalesLayout && (
              <Box px={4} pb={3}>
                <Tabs
                  variant="unstyled"
                  index={Math.max(CHAT_TABS.findIndex((item) => item.key === activeTab), 0)}
                  onChange={(index) => setActiveTab(CHAT_TABS[index]?.key || 'all')}
                >
                  <TabList gap={4} overflowX="auto" minW="max-content" px={1}>
                    {CHAT_TABS.map((tab) => (
                      <Tab
                        key={tab.key}
                        px={0}
                        py={1}
                        fontSize="sm"
                        fontWeight={activeTab === tab.key ? 'semibold' : 'medium'}
                        color={activeTab === tab.key ? 'blue.500' : mutedText}
                        borderBottom="2px solid"
                        borderColor={activeTab === tab.key ? 'blue.500' : 'transparent'}
                        minW="fit-content"
                        _selected={{ color: 'blue.500', borderColor: 'blue.500' }}
                      >
                        <HStack spacing={1.5}>
                          <Text>{tab.label}</Text>
                          <Badge
                            colorScheme={activeTab === tab.key ? 'blue' : 'gray'}
                            borderRadius="full"
                            fontSize="10px"
                            px={1.5}
                          >
                            {tabCounts[tab.key]}
                          </Badge>
                        </HStack>
                      </Tab>
                    ))}
                  </TabList>
                </Tabs>
              </Box>
            )}
            <Divider borderColor={isSalesLayout ? salesDividerColor : borderColor} />
            <Box maxH={leftRailHeight} overflowY="auto" px={0} pb={0}>
              {(loadingConversations && !isSalesLayout) ? (
                <Flex align="center" justify="center" py={10}><Spinner color="teal.400" /></Flex>
              ) : (
                <VStack align="stretch" spacing={0} pt={0}>
                  {(isSalesLayout ? salesListUsers : visibleConversations).map((entry) => {
                    if (isSalesLayout) {
                      const user = entry;
                      const existingDirect = conversations.find(
                        (conversation) =>
                          conversation.kind === 'direct' &&
                          conversation.participants?.some((participant) => participant.user?._id === user._id)
                      );
                      const isSelected = existingDirect?._id === selectedConversationId;
                      const unreadCount = Number(existingDirect?.unreadCount || 0);
                      const preview = existingDirect?.lastMessage?.body || user.department || user.role || 'Start a conversation';

                      return (
                        <Box
                          key={user._id}
                          position="relative"
                          px={isSalesLayout ? 2 : 3}
                          py={isSalesLayout ? 1.5 : 2.5}
                          bg={isSelected ? salesListBg : 'transparent'}
                          borderBottom="1px solid"
                          borderColor={isSalesLayout ? salesDividerColor : borderColor}
                          cursor="pointer"
                          onClick={() => openUserChat(user)}
                          _hover={{ bg: isSelected ? salesListBg : hoverConversationBg }}
                        >
                          <HStack align="start" spacing={2.5}>
                            <Avatar size="sm" bg="teal.500" name={getDisplayName(user)} src={user.photo || undefined} />
                            <Box flex="1" minW={0}>
                              <Flex justify="space-between" gap={2}>
                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                  {getDisplayName(user)}
                                </Text>
                                <Text fontSize="xs" color={mutedText} whiteSpace="nowrap">
                                  {existingDirect ? formatConversationDay(existingDirect.lastActivityAt) : ''}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" fontWeight="medium" color={isSelected ? 'gray.800' : mutedText} noOfLines={1}>
                                {preview}
                              </Text>
                              <Flex align="center" justify="space-between" mt={0.25}>
                                <Text fontSize="xs" color={mutedText} noOfLines={1}>
                                  {user.department || user.role || 'User'}
                                </Text>
                                {!!unreadCount && (
                                  <Badge colorScheme="green" borderRadius="full" minW="18px" textAlign="center" fontSize="10px">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </Flex>
                            </Box>
                          </HStack>
                        </Box>
                      );
                    }

                    const conversation = entry;
                    const preview = conversation.lastMessage?.body || 'No messages yet';
                    return (
                      <Box
                        key={conversation._id}
                        position="relative"
                          px={2}
                          py={2}
                          bg={selectedConversationId === conversation._id ? selectedBg : 'transparent'}
                          borderRadius={isSalesLayout ? '0' : '18px'}
                          cursor="pointer"
                          onClick={() => setSelectedConversationId(conversation._id)}
                          _hover={{ bg: selectedConversationId === conversation._id ? selectedBg : hoverConversationBg }}
                      >
                        {selectedConversationId === conversation._id && (
                          <Box
                            position="absolute"
                            left="0"
                            top="12px"
                            bottom="12px"
                            w="3px"
                            borderRadius="full"
                            bg="blue.400"
                          />
                        )}
                          <HStack align="start" spacing={3} pl={selectedConversationId === conversation._id ? 2 : 0}>
                          <Avatar size="md" bg={conversation.avatarColor || 'teal.500'} name={conversation.title} />
                          <Box flex="1" minW={0}>
                            <Flex justify="space-between" gap={2}>
                              <Text fontWeight="semibold" fontSize="md" noOfLines={1}>
                                {conversation.title}
                              </Text>
                              <Text fontSize="xs" color={mutedText} whiteSpace="nowrap">
                                {formatConversationDay(conversation.lastActivityAt)}
                              </Text>
                            </Flex>
                            <Flex align="center" justify="space-between" gap={2} mt={0.5}>
                              <Text fontSize="sm" color={mutedText} noOfLines={1} flex="1">
                                {preview}
                              </Text>
                              <HStack spacing={1} flexShrink={0}>
                                <Text fontSize="sm" color={Number(conversation.unreadCount || 0) > 0 ? 'green.400' : 'gray.400'}>
                                  {getConversationStatusGlyph(conversation)}
                                </Text>
                                {!!conversation.unreadCount && (
                                  <Badge colorScheme="blue" borderRadius="full" minW="20px" textAlign="center">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </HStack>
                            </Flex>
                            <HStack mt={1} spacing={2}>
                              <Badge
                                colorScheme={conversation.kind === 'group' ? 'purple' : 'teal'}
                                borderRadius="full"
                                textTransform="none"
                                fontSize="10px"
                              >
                                {getConversationKindLabel(conversation)}
                              </Badge>
                              {isPinnedConversation(conversation) && (
                                <HStack spacing={1} color="gray.400">
                                  <FaThumbtack size={10} />
                                  <Text fontSize="10px">Pinned</Text>
                                </HStack>
                              )}
                              {conversation.participants?.some((item) => item.muted) && (
                                <FaVolumeMute size={10} color="#a0aec0" />
                              )}
                            </HStack>
                          </Box>
                        </HStack>
                      </Box>
                    );
                  })}
                  {!(isSalesLayout ? salesListUsers.length : visibleConversations.length) && (
                    <Flex align="center" justify="center" py={10} direction="column" gap={2}>
                      <Text fontWeight="semibold">{isSalesLayout ? 'No users found' : 'No conversations'}</Text>
                      <Text fontSize="sm" color={mutedText}>
                        {showUnreadOnly
                          ? 'No unread conversations right now.'
                          : isSalesLayout
                          ? 'Search for a user account to start chatting.'
                          : activeTab === 'channels'
                          ? 'Your department channel will appear here when available.'
                          : 'Start a new direct chat from the directory.'}
                      </Text>
                    </Flex>
                  )}
                </VStack>
              )}
            </Box>
          </Box>
        </GridItem>

        <GridItem minW={0}>
          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={isSalesLayout ? salesDividerColor : borderColor}
            borderRadius={isSalesLayout ? '14px' : '28px'}
            h="100%"
            minH={embedded ? 'calc(100vh - 170px)' : '72vh'}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            {selectedConversation ? (
              <>
                <Flex
                  px={isSalesLayout ? 3 : 5}
                  py={isSalesLayout ? 2 : 3.5}
                  borderBottom="1px solid"
                  borderColor={isSalesLayout ? salesDividerColor : borderColor}
                  align="center"
                  justify="space-between"
                  bg={useColorModeValue('#ffffff', 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(15,23,42,0.95))')}
                >
                  <HStack spacing={3}>
                    <Avatar
                      size={isSalesLayout ? 'sm' : 'md'}
                      name={isSalesLayout ? getDisplayName(selectedPeer) || selectedConversation.title : selectedConversation.title}
                      bg={selectedConversation.avatarColor || 'teal.500'}
                      src={isSalesLayout ? selectedPeer?.photo || undefined : undefined}
                    />
                    <Box>
                      <Text fontWeight="bold" fontSize={isSalesLayout ? 'md' : 'inherit'}>
                        {isSalesLayout ? getDisplayName(selectedPeer) || selectedConversation.title : selectedConversation.title}
                      </Text>
                      <Text fontSize={isSalesLayout ? 'xs' : 'sm'} color={mutedText}>
                        {isSalesLayout
                          ? selectedPeerIsTyping
                            ? 'typing...'
                            : selectedPeerIsOnline
                              ? 'Online'
                              : selectedPeer?.department || selectedPeer?.role || 'Direct message'
                          : `${selectedConversation.participants.length} participants`}
                      </Text>
                    </Box>
                  </HStack>
                  {!isSalesLayout && (
                    <Badge colorScheme="green" borderRadius="full" px={2.5}>
                      Live
                    </Badge>
                  )}
                </Flex>
                <Box px={isSalesLayout ? 2 : 4} py={2} borderBottom="1px solid" borderColor={isSalesLayout ? salesDividerColor : borderColor}>
                  <HStack spacing={2}>
                    <InputGroup size="sm">
                      <Input
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Search in this chat"
                        borderRadius="full"
                      />
                      <InputRightElement>
                        <SearchIcon color={mutedText} />
                      </InputRightElement>
                    </InputGroup>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="full"
                      onClick={() =>
                        setActiveMessageMatchIndex((current) =>
                          matchedMessageIds.length ? (current - 1 + matchedMessageIds.length) % matchedMessageIds.length : 0
                        )
                      }
                      isDisabled={!matchedMessageIds.length}
                    >
                      Prev
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="full"
                      onClick={() =>
                        setActiveMessageMatchIndex((current) =>
                          matchedMessageIds.length ? (current + 1) % matchedMessageIds.length : 0
                        )
                      }
                      isDisabled={!matchedMessageIds.length}
                    >
                      Next
                    </Button>
                    <Text fontSize="xs" color={mutedText} minW="52px" textAlign="right">
                      {matchedMessageIds.length ? `${activeMessageMatchIndex + 1}/${matchedMessageIds.length}` : '0/0'}
                    </Text>
                  </HStack>
                </Box>
                <Box
                  flex="1"
                  overflowY="auto"
                  px={isSalesLayout ? 1.5 : 5}
                  py={isSalesLayout ? 2 : 4}
                  bg={isSalesLayout ? simpleMessageBg : undefined}
                  bgImage={isSalesLayout ? 'none' : messageAreaBg}
                >
                  {loadingMessages ? (
                    <Flex align="center" justify="center" h="100%"><Spinner color="teal.400" /></Flex>
                  ) : (
                    <VStack align="stretch" spacing={isSalesLayout ? 2.5 : 3}>
                      {hasOlderMessages && (
                        <Flex justify="center">
                          <Button
                            size="xs"
                            variant="outline"
                            borderRadius="full"
                            onClick={loadOlderMessages}
                            isLoading={loadingOlderMessages}
                          >
                            Load older messages
                          </Button>
                        </Flex>
                      )}
                      {messages.map((message, index) => {
                        const isOwn = message.sender?._id === currentUser?._id;
                        const previous = messages[index - 1];
                        const showDate = !previous || formatDateLabel(previous.createdAt) !== formatDateLabel(message.createdAt);
                        const isMatchedMessage = matchedMessageIds.includes(message._id);
                        const isActiveMatchedMessage = matchedMessageIds[activeMessageMatchIndex] === message._id;
                        return (
                          <Box
                            key={message._id}
                            bg={isActiveMatchedMessage ? useColorModeValue('yellow.50', 'whiteAlpha.100') : 'transparent'}
                            borderRadius="12px"
                            px={isActiveMatchedMessage ? 1 : 0}
                            py={isActiveMatchedMessage ? 1 : 0}
                          >
                            {showDate && (
                              <Flex justify="center" mb={isSalesLayout ? 2 : 3}>
                                <Badge colorScheme="green" variant="subtle" borderRadius="full" px={isSalesLayout ? 2.5 : 3} py={0.5}>
                                  {formatDateLabel(message.createdAt)}
                                </Badge>
                              </Flex>
                            )}
                            <Flex justify={isOwn ? 'flex-end' : 'flex-start'}>
                              <Box maxW={{ base: '90%', md: isSalesLayout ? '72%' : '76%' }}>
                                {!isOwn && (
                                  <Text fontSize="xs" color={mutedText} mb={0.5} px={1}>
                                    {getDisplayName(message.sender)}
                                  </Text>
                                )}
                                <Box
                                  px={isSalesLayout ? 3 : 4}
                                  py={isSalesLayout ? 1.75 : 2.5}
                                  bg={isOwn ? ownBubbleBg : otherBubbleBg}
                                  color={isOwn ? ownMetaColor : undefined}
                                  borderRadius={isSalesLayout ? (isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px') : (isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px')}
                                  boxShadow={isSalesLayout ? 'none' : 'sm'}
                                  border="1px solid"
                                  borderColor={
                                    isActiveMatchedMessage
                                      ? 'yellow.300'
                                      : isSalesLayout
                                        ? (isOwn ? 'green.200' : salesDividerColor)
                                        : (isOwn ? 'green.100' : 'blackAlpha.100')
                                  }
                                >
                                  {message.replyTo && (
                                    <Box
                                      mb={message.body || message.attachments?.length ? 2 : 0}
                                      px={2.5}
                                      py={1.5}
                                      bg={isOwn ? 'whiteAlpha.400' : 'blackAlpha.50'}
                                      borderLeft="3px solid"
                                      borderColor={isOwn ? 'green.300' : 'blue.300'}
                                      borderRadius="10px"
                                    >
                                      <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
                                        {getDisplayName(message.replyTo.sender)}
                                      </Text>
                                      <Text fontSize="xs" color={mutedText} noOfLines={2}>
                                        {message.replyTo.body || 'Attachment'}
                                      </Text>
                                    </Box>
                                  )}
                                  <Text
                                    whiteSpace="pre-wrap"
                                    color={isOwn ? 'green.900' : undefined}
                                    fontSize={isSalesLayout ? 'sm' : 'md'}
                                    fontWeight={isMatchedMessage ? 'medium' : 'normal'}
                                  >
                                    {message.body}
                                  </Text>
                                  {!!message.attachments?.length && (
                                    <VStack align="stretch" spacing={1.5} mt={message.body ? 2 : 0}>
                                      {message.attachments.map((attachment, attachmentIndex) => (
                                        <Button
                                          key={`${message._id}-attachment-${attachmentIndex}`}
                                          as="a"
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          size="sm"
                                          variant="outline"
                                          justifyContent="flex-start"
                                          borderRadius="12px"
                                          whiteSpace="normal"
                                          h="auto"
                                          py={1.5}
                                        >
                                          <Text noOfLines={1}>
                                            {attachment.name || 'Attachment'}
                                          </Text>
                                        </Button>
                                      ))}
                                    </VStack>
                                  )}
                                </Box>
                                <HStack justify={isOwn ? 'flex-end' : 'flex-start'} mt={0.5} px={1} spacing={1.5}>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    minW="unset"
                                    h="20px"
                                    px={1}
                                    onClick={() => startReplyToMessage(message)}
                                  >
                                    Reply
                                  </Button>
                                  {isOwn && (
                                    <>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        minW="unset"
                                        h="20px"
                                        px={1}
                                        onClick={() => startEditingMessage(message)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        minW="unset"
                                        h="20px"
                                        px={1}
                                        onClick={() => removeMessageForSelf(message)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                  <Text fontSize="xs" color={mutedText}>{formatTime(message.createdAt)}</Text>
                                  {isOwn && (
                                    <Text fontSize="xs" color={mutedText}>
                                      {message.editedAt ? 'Edited' : Math.max((message.readBy || []).length - 1, 0) > 0 ? 'Read' : 'Sent'}
                                    </Text>
                                  )}
                                </HStack>
                              </Box>
                            </Flex>
                          </Box>
                        );
                      })}
                      {selectedPeerIsTyping && (
                        <Flex justify="flex-start">
                          <Box
                            px={3}
                            py={1.5}
                            bg={otherBubbleBg}
                            borderRadius="14px 14px 14px 4px"
                            border="1px solid"
                            borderColor={isSalesLayout ? salesDividerColor : 'blackAlpha.100'}
                          >
                            <Text fontSize="xs" color={mutedText}>typing...</Text>
                          </Box>
                        </Flex>
                      )}
                    </VStack>
                  )}
                </Box>
                <Divider borderColor={isSalesLayout ? salesDividerColor : borderColor} />
                <Box p={isSalesLayout ? 2 : 4} bg={composerBg}>
                  {editingMessageId && (
                    <Flex
                      mb={2}
                      px={3}
                      py={2}
                      borderRadius="12px"
                      bg={useColorModeValue('orange.50', 'whiteAlpha.100')}
                      borderLeft="3px solid"
                      borderColor="orange.300"
                      align="start"
                      justify="space-between"
                      gap={3}
                    >
                      <Box minW={0}>
                        <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
                          Editing message
                        </Text>
                        <Text fontSize="xs" color={mutedText} noOfLines={2}>
                          Update your message and send to save changes.
                        </Text>
                      </Box>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingMessageId('');
                          setComposer('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Flex>
                  )}
                  {replyTarget && (
                    <Flex
                      mb={2}
                      px={3}
                      py={2}
                      borderRadius="12px"
                      bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                      borderLeft="3px solid"
                      borderColor="blue.300"
                      align="start"
                      justify="space-between"
                      gap={3}
                    >
                      <Box minW={0}>
                        <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
                          Replying to {getDisplayName(replyTarget.sender)}
                        </Text>
                        <Text fontSize="xs" color={mutedText} noOfLines={2}>
                          {replyTarget.body || 'Attachment'}
                        </Text>
                      </Box>
                      <Button size="xs" variant="ghost" onClick={() => setReplyTarget(null)}>
                        Clear
                      </Button>
                    </Flex>
                  )}
                  {!!pendingAttachments.length && (
                    <HStack spacing={2} mb={2} wrap="wrap">
                      {pendingAttachments.map((attachment, index) => (
                        <Button
                          key={`${attachment.name}-${index}`}
                          size="xs"
                          variant="outline"
                          borderRadius="full"
                          onClick={() => removePendingAttachment(index)}
                        >
                          {attachment.name}
                        </Button>
                      ))}
                    </HStack>
                  )}
                  <HStack align="end" spacing={isSalesLayout ? 2 : 3}>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={handleAttachmentSelection}
                    />
                    <IconButton
                      icon={uploadingAttachments ? <Spinner size="sm" /> : <FaPaperclip />}
                      variant="ghost"
                      borderRadius="full"
                      aria-label="Attach files"
                      onClick={() => attachmentInputRef.current?.click()}
                      isDisabled={!selectedConversationId || uploadingAttachments || pendingAttachments.length >= 5}
                    />
                    <Textarea
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      placeholder="Type a message"
                      resize="none"
                      rows={2}
                      borderRadius={isSalesLayout ? '14px' : '24px'}
                      bg={useColorModeValue('#ffffff', 'whiteAlpha.100')}
                      borderColor={isSalesLayout ? salesDividerColor : useColorModeValue('gray.200', 'whiteAlpha.200')}
                      px={isSalesLayout ? 3.5 : 4}
                      py={isSalesLayout ? 2.5 : 3}
                      fontSize={isSalesLayout ? 'sm' : 'md'}
                      _focusVisible={{ borderColor: 'teal.300', boxShadow: '0 0 0 1px var(--chakra-colors-teal-300)' }}
                    />
                    <IconButton
                      icon={sending ? <Spinner size="sm" /> : <ArrowForwardIcon />}
                      colorScheme={isSalesLayout ? 'blue' : 'teal'}
                      borderRadius="full"
                      w={isSalesLayout ? '42px' : '48px'}
                      h={isSalesLayout ? '42px' : '48px'}
                      aria-label="Send message"
                      onClick={handleSend}
                      isDisabled={(!composer.trim() && !pendingAttachments.length) || sending || uploadingAttachments}
                    />
                  </HStack>
                </Box>
              </>
            ) : (
              <Flex h="100%" minH={embedded ? 'calc(100vh - 170px)' : '72vh'} align="center" justify="center" direction="column" gap={3}>
                <ChatIcon boxSize={10} color={mutedText} />
                <Text fontSize="lg" fontWeight="semibold">Select a conversation</Text>
                <Text color={mutedText}>Choose an existing thread or start one from the directory.</Text>
              </Flex>
            )}
          </Box>
        </GridItem>

        {!embedded && (
          <GridItem display={{ base: 'none', lg: 'block' }}>
            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="28px" overflow="hidden" h="100%">
              <Box px={4} py={4}>
                <Text fontWeight="bold">User Directory</Text>
                <Text fontSize="sm" color={mutedText}>Start direct chats across departments</Text>
              </Box>
              <Divider />
              <Box maxH="72vh" overflowY="auto">
                <Stack spacing={0}>
                  {directory.map((user) => (
                    <Flex key={user._id} px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
                      <HStack spacing={3} minW={0}>
                        <Avatar size="sm" name={getDisplayName(user)} bg="blue.500" />
                        <Box minW={0}>
                          <Text fontWeight="medium" noOfLines={1}>{getDisplayName(user)}</Text>
                          <Text fontSize="sm" color={mutedText} noOfLines={1}>
                            {user.department || user.role}
                          </Text>
                        </Box>
                      </HStack>
                      <Button
                        size="xs"
                        colorScheme="teal"
                        variant="outline"
                        onClick={() => startDirectChat(user._id)}
                        isLoading={creatingDirectId === user._id}
                      >
                        Chat
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              </Box>
            </Box>
          </GridItem>
        )}
      </Grid>

      <Modal isOpen={createGroupModal.isOpen} onClose={createGroupModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Group Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="Finance Leadership" />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Optional group description" />
              </FormControl>
              <Box border="1px solid" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                <Box px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
                  <Text fontWeight="semibold">Participants</Text>
                </Box>
                <Box maxH="280px" overflowY="auto">
                  <VStack align="stretch" spacing={0}>
                    {directory.map((user) => (
                      <Flex key={user._id} px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
                        <HStack spacing={3}>
                          <Avatar size="sm" name={getDisplayName(user)} bg="purple.500" />
                          <Box>
                            <Text>{getDisplayName(user)}</Text>
                            <Text fontSize="sm" color={mutedText}>{user.department || user.role}</Text>
                          </Box>
                        </HStack>
                        <Checkbox isChecked={selectedGroupUsers.includes(user._id)} onChange={() => toggleGroupUser(user._id)}>
                          Add
                        </Checkbox>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createGroupModal.onClose}>Cancel</Button>
            <Button colorScheme="teal" onClick={submitGroup} isDisabled={!groupTitle.trim() || selectedGroupUsers.length === 0}>
              Create group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ChatWorkspace;
