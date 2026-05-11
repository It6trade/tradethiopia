import React, { useState, useEffect } from 'react';
import {
  Flex,
  Box,
  HStack,
  IconButton,
  Text,
  Tooltip,
  Badge,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import ENISRASidebar from './ENSRASidebar';
import { Outlet } from 'react-router-dom';
import { FiBell, FiClipboard, FiMessageSquare, FiMoon, FiSun } from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { getNotifications } from '../../services/notificationService';
import NotesDrawer from '../notes/NotesDrawer';
import ENSRANotificationsDrawer from './ENSRANotificationsDrawer';
import ChatLauncher from '../chat/ChatLauncher';

const ENISRALayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  const notificationDisclosure = useDisclosure();
  const notesDisclosure = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const toolbarBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const toolbarTextColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const unreadNotificationsCount = notifications.filter((note) => !note.read).length;

  const refreshNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load ENSRA notifications', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchNotesCount = async () => {
    try {
      const response = await axiosInstance.get('/notes');
      setNotesCount(response.data?.length || 0);
    } catch (err) {
      console.error('Failed to fetch ENSRA notes count', err);
    }
  };

  const handleNotesUpdate = (updatedNotes = []) => {
    setNotesCount(updatedNotes.length);
  };

  useEffect(() => {
    refreshNotifications();
    fetchNotesCount();
  }, []);

  useEffect(() => {
    if (notificationDisclosure.isOpen) {
      refreshNotifications();
    }
  }, [notificationDisclosure.isOpen]);

  return (
    <Flex direction="column" minH="100vh" w="100%">
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6 }}
        py={3}
        bg={toolbarBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
        zIndex="10"
      >
        <Text fontSize="lg" fontWeight="bold" color={toolbarTextColor}>
          ENSRA Workspace
        </Text>
        <HStack spacing={3}>
          <Tooltip label="Workspace chat">
            <ChatLauncher
              icon={<FiMessageSquare />}
              ariaLabel="Open ENSRA workspace chat"
              iconButtonProps={{
                variant: 'ghost',
                color: iconColor,
                size: 'md',
                borderRadius: 'full',
              }}
            />
          </Tooltip>

          <Tooltip label="Notifications">
            <Box position="relative">
              <IconButton
                aria-label="View ENSRA notifications"
                icon={<FiBell />}
                variant="ghost"
                color={iconColor}
                size="md"
                borderRadius="full"
                onClick={notificationDisclosure.onOpen}
              />
              {unreadNotificationsCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                px={2}
                color="white"
              >
                {unreadNotificationsCount}
              </Badge>
              )}
            </Box>
          </Tooltip>

          <Tooltip label="Notes">
            <Box position="relative">
              <IconButton
                aria-label="Open ENSRA notes"
                icon={<FiClipboard />}
                variant="ghost"
                color={iconColor}
                size="md"
                borderRadius="full"
                onClick={notesDisclosure.onOpen}
              />
              {notesCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="teal"
                borderRadius="full"
                fontSize="xs"
                px={2}
                color="white"
              >
                  {notesCount}
                </Badge>
              )}
            </Box>
          </Tooltip>

          <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              aria-label="Toggle dark mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              variant="ghost"
              color={iconColor}
              size="md"
              borderRadius="full"
              onClick={toggleColorMode}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Flex flex="1" align="stretch" minH="0">
        <Box
          w={isCollapsed ? '60px' : '220px'}
          minW={isCollapsed ? '60px' : '220px'}
          transition="width 0.2s"
          minH="0"
        >
          <ENISRASidebar onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        </Box>

        <Box flex="1" transition="all 0.2s" p={4} minH="0">
          <Outlet />
        </Box>
      </Flex>
      <ENSRANotificationsDrawer
        isOpen={notificationDisclosure.isOpen}
        onClose={notificationDisclosure.onClose}
        notifications={notifications}
        loading={notificationsLoading}
        onRefresh={refreshNotifications}
      />

      <NotesDrawer
        isOpen={notesDisclosure.isOpen}
        onClose={notesDisclosure.onClose}
        onNotesUpdate={handleNotesUpdate}
      />
    </Flex>
  );
};

export default ENISRALayout;
