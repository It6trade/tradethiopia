// src/pages/coo2/NotificationsView.jsx
import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import {
  FiBell,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
  FiX,
  FiClock,
  FiTrash2,
} from 'react-icons/fi';
import { NOTIFICATIONS_DATA } from './cooData';

const NotificationsView = ({ unreadCount, setUnreadCount }) => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (setUnreadCount) setUnreadCount(0);
    toast({
      title: 'All notifications marked as read',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleAction = (notif, actionType) => {
    toast({
      title: `${actionType === 'approve' ? 'Approved' : 'Dismissed'}: ${notif.title}`,
      description: `Action applied successfully for ${notif.department} division.`,
      status: actionType === 'approve' ? 'success' : 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'action') return n.actionRequired;
    return true;
  });

  return (
    <Box maxW="900px">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <HStack spacing={2.5}>
            <Text fontSize="22px" fontWeight="800" color="#0f172a" letterSpacing="-0.02em">
              Operations Alert Center
            </Text>
            {notifications.filter((n) => n.unread).length > 0 && (
              <Badge colorScheme="red" fontSize="11px" borderRadius="full" px={2} py={0.5}>
                {notifications.filter((n) => n.unread).length} Unread
              </Badge>
            )}
          </HStack>
          <Text fontSize="13.5px" color="#64748b">
            Critical operational warnings, inventory triggers, and authorization requests.
          </Text>
        </Box>

        <HStack spacing={2}>
          <Button
            size="sm"
            variant="ghost"
            fontSize="12.5px"
            color="#2563eb"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs
        variant="soft-rounded"
        colorScheme="blue"
        size="sm"
        mb={4}
        onChange={(index) => {
          if (index === 0) setFilter('all');
          if (index === 1) setFilter('unread');
          if (index === 2) setFilter('action');
        }}
      >
        <TabList bg="#ffffff" p={1} borderRadius="12px" border="1px solid #e2e8f0" display="inline-flex">
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            All Alerts ({notifications.length})
          </Tab>
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            Unread ({notifications.filter((n) => n.unread).length})
          </Tab>
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            Pending Actions ({notifications.filter((n) => n.actionRequired).length})
          </Tab>
        </TabList>
      </Tabs>

      {/* Notifications List */}
      <VStack align="stretch" spacing={3}>
        {filtered.length === 0 ? (
          <Box bg="#ffffff" p={8} textAlign="center" borderRadius="16px" border="1px solid #e2e8f0">
            <Icon as={FiCheckCircle} color="#10b981" boxSize="36px" mb={2} />
            <Text fontSize="15px" fontWeight="700" color="#0f172a">
              All Clear!
            </Text>
            <Text fontSize="13px" color="#64748b">
              No pending operational alerts in this view.
            </Text>
          </Box>
        ) : (
          filtered.map((notif) => {
            const isWarning = notif.type === 'warning';
            const isSuccess = notif.type === 'success';

            return (
              <Box
                key={notif.id}
                bg="#ffffff"
                p={4}
                borderRadius="14px"
                border="1px solid #e2e8f0"
                borderLeft={notif.unread ? '4px solid #2563eb' : '1px solid #e2e8f0'}
                boxShadow="0 2px 4px rgba(0,0,0,0.02)"
                transition="all 0.15s ease"
                _hover={{ boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}
              >
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <HStack spacing={3} align="flex-start">
                    <Flex
                      w="34px"
                      h="34px"
                      borderRadius="10px"
                      bg={
                        isWarning
                          ? '#fffbeb'
                          : isSuccess
                          ? '#f0fdf4'
                          : '#eff6ff'
                      }
                      color={
                        isWarning
                          ? '#d97706'
                          : isSuccess
                          ? '#16a34a'
                          : '#2563eb'
                      }
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={
                          isWarning
                            ? FiAlertTriangle
                            : isSuccess
                            ? FiCheckCircle
                            : FiInfo
                        }
                        boxSize="18px"
                      />
                    </Flex>

                    <Box>
                      <HStack spacing={2} mb={0.5}>
                        <Text fontSize="13.5px" fontWeight="700" color="#0f172a">
                          {notif.title}
                        </Text>
                        <Badge colorScheme="blue" fontSize="10px" borderRadius="4px">
                          {notif.department}
                        </Badge>
                        {notif.unread && (
                          <Badge colorScheme="red" fontSize="9px" borderRadius="full">
                            New
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="12.5px" color="#475569" mb={2}>
                        {notif.desc}
                      </Text>
                      <HStack spacing={1.5}>
                        <Icon as={FiClock} color="#94a3b8" boxSize="12px" />
                        <Text fontSize="11px" color="#94a3b8">
                          {notif.time}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>

                  {/* Actions */}
                  {notif.actionRequired ? (
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        borderRadius="8px"
                        leftIcon={<FiCheck size={12} />}
                        onClick={() => handleAction(notif, 'approve')}
                      >
                        {notif.actionText || 'Approve'}
                      </Button>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="#64748b"
                        icon={<FiX size={13} />}
                        aria-label="Dismiss"
                        onClick={() => handleAction(notif, 'dismiss')}
                      />
                    </HStack>
                  ) : (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="#94a3b8"
                      icon={<FiTrash2 size={13} />}
                      aria-label="Delete"
                      onClick={() =>
                        setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
                      }
                    />
                  )}
                </Flex>
              </Box>
            );
          })
        )}
      </VStack>
    </Box>
  );
};

export default NotificationsView;
