import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Flex,
  IconButton,
  HStack,
  Spacer,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorMode,
  MenuDivider,
  useBreakpointValue,
  Badge,
  Spinner,
  Button
} from '@chakra-ui/react';
import { FaBell, FaUserCircle, FaMoon, FaSun, FaBars, FaCheck, FaComments, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import NotesLauncher from '../notes/NotesLauncher';
import ChatLauncher from '../chat/ChatLauncher';
import { useUserStore } from '../../store/user';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';
import { rememberReturnPath } from '../../utils/authStorage';

const Snavbar = ({ onToggleSidebar }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // State for Socket.IO connection
  const [socket, setSocket] = useState(null);

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  // Get user data from Zustand store
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Establish Socket.IO connection
  useEffect(() => {
    if (!currentUser?._id) return;
    
    // Create Socket.IO connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    
    // Register user with the server
    newSocket.emit('registerUser', currentUser._id);
    
    // Listen for new notifications
    newSocket.on('newNotification', (notification) => {
      // Add the new notification to the list
      const newNotification = {
        id: notification.id,
        message: notification.text,
        read: notification.read,
        time: getTimeAgo(notification.createdAt),
        taskId: notification.taskId,
        targetId: notification.targetId
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [currentUser?._id]);

  const markAsRead = async (id) => {
    try {
      // Call the API to mark notification as read
      await markNotificationAsRead(id);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(unreadCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to automatically mark notification as read when task is viewed
  const markTaskNotificationAsRead = async (taskId) => {
    try {
      // Find notification associated with this task
      const notification = notifications.find(n => n.taskId === taskId && !n.read);
      
      if (notification) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking task notification as read:', error);
    }
  };
  
  // Function to automatically mark notification as read when target is viewed
  const markTargetNotificationAsRead = async (targetId) => {
    try {
      // Find notification associated with this target
      const notification = notifications.find(n => n.targetId === targetId && !n.read);
      
      if (notification) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking target notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Call the API to mark all notifications as read
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    rememberReturnPath(`${location.pathname}${location.search}${location.hash}`, currentUser);
    clearUser();
    navigate('/login', { replace: true });
  };

  const employeeName = currentUser?.fullName || currentUser?.username || 'Employee';
  const employeeEmail = currentUser?.email || 'Email not available';
  const employeeRole = currentUser?.jobTitle || currentUser?.displayRole || currentUser?.role || 'Employee';

  // Gradient background based on color mode
  const gradientBg = colorMode === 'light'
    ? 'linear(to-r, gray.800, blue.800, teal.500)'
    : 'linear(to-r, gray.800, blue.800, teal.600)';

  // Make markTaskNotificationAsRead and markTargetNotificationAsRead available globally
  window.markTaskNotificationAsRead = markTaskNotificationAsRead;
  window.markTargetNotificationAsRead = markTargetNotificationAsRead;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bgGradient={gradientBg}
      px={4}
      py={3}
      shadow="md"
      transition="background 0.2s ease"
    >
      <Flex alignItems="center" justifyContent="space-between">
        {isMobile && (
          <IconButton
            icon={<FaBars />}
            aria-label="Toggle Sidebar"
            variant="ghost"
            color="white"
            onClick={onToggleSidebar}
            mr={2}
          />
        )}
        <Spacer />
        <HStack spacing={4}>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={
                <Box position="relative">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge
                      colorScheme="red"
                      borderRadius="full"
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      fontSize="10px"
                      w="18px"
                      h="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Box>
              }
              aria-label="Notifications"
              variant="ghost"
              color="white"
            />
            <MenuList zIndex="popover" minW="320px" p={0} overflow="hidden">
              <Box
                px={4}
                py={3}
                borderBottom="1px"
                borderColor="inherit"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontWeight="bold">Notifications</Text>
                <IconButton 
                  size="sm" 
                  variant="ghost" 
                  colorScheme="blue"
                  icon={<FaCheck />}
                  aria-label="Mark all as read"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await markAllAsRead();
                  }}
                />
              </Box>
              <Box maxH="300px" overflowY="auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      py={3}
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Flex align="center" w="100%">
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg={!notification.read ? "blue.500" : "transparent"}
                          mr={3}
                          flexShrink={0}
                        />
                        <Box flex="1">
                          <Text fontSize="sm" noOfLines={1}>
                            {notification.message}
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {notification.time}
                          </Text>
                        </Box>
                      </Flex>
                    </MenuItem>
                  ))
                ) : (
                  <Box p={4} textAlign="center">
                    <Text color="gray.500">No new notifications</Text>
                  </Box>
                )}
              </Box>
            </MenuList>
          </Menu>
          <NotesLauncher
            buttonProps={{
              variant: 'ghost',
              color: 'white',
              size: 'md',
              'aria-label': 'Notes',
            }}
            tooltipLabel="Notes"
          />
          <ChatLauncher
            icon={<FaComments />}
            ariaLabel="Open workspace chat"
            preferredView="sales"
            iconButtonProps={{
              variant: 'ghost',
              color: 'white',
              size: 'md',
              _hover: { bg: 'whiteAlpha.200' },
            }}
          />
          <IconButton
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            aria-label="Toggle Theme"
            variant="ghost"
            color="white"
            onClick={toggleColorMode}
          />
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              color="white"
              h="48px"
              px={{ base: 1, lg: 3 }}
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.300' }}
            >
              <HStack spacing={2}>
                <Avatar name={employeeName} size="sm" bg="teal.300" icon={<FaUserCircle fontSize="20px" />} />
                <Box display={{ base: 'none', lg: 'block' }} textAlign="left" maxW="190px">
                  <Text fontSize="sm" fontWeight="700" noOfLines={1}>{employeeName}</Text>
                  <Text fontSize="xs" color="whiteAlpha.800" noOfLines={1}>{employeeEmail}</Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList p={0} minW="320px">
              {/* Simplified Profile Header */}
              <Box 
                px={4} 
                pt={4}
                pb={3}
                bgGradient={colorMode === 'light' ? 'linear(to-br, teal.50, white)' : 'linear(to-br, teal.900, gray.800)'}
              >
                <Flex align="center" gap={3}>
                  <Avatar 
                    name={employeeName}
                    size="md" 
                    bg="teal.500"
                  />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{employeeName}</Text>
                    <HStack spacing={1} color="gray.600" _dark={{ color: 'gray.300' }}>
                      <FaEnvelope fontSize="12px" />
                      <Text fontSize="sm" noOfLines={1}>{employeeEmail}</Text>
                    </HStack>
                    <Badge mt={1} colorScheme="teal" textTransform="capitalize">{employeeRole}</Badge>
                  </Box>
                </Flex>
              </Box>
              
              <MenuDivider mt={0} mb={2} />
              
              <Box px={3} pb={3}>
                <Button 
                  leftIcon={<FaUserCircle />} 
                  colorScheme="teal" 
                  variant="outline" 
                  size="sm" 
                  width="full"
                  onClick={() => navigate('/employee-info')}
                >
                  My personal information
                </Button>
                <Button mt={2} leftIcon={<FaSignOutAlt />} colorScheme="red" variant="ghost" size="sm" width="full" onClick={handleLogout}>
                  Log out
                </Button>
              </Box>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Snavbar;
