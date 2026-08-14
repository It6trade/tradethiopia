import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../../store/user';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../../../services/notificationService';
import { io } from 'socket.io-client';
import { 
  Box,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useBreakpointValue,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  VStack,
  Divider,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react';
import { 
  FiMenu, 
  FiBell, 
  FiChevronDown, 
  FiSearch, 
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiLogOut,
  FiHelpCircle,
  FiSun,
  FiMoon,
  FiChevronRight,
  FiChevronLeft,
  FiCheck
} from 'react-icons/fi';
import ChatLauncher from '../../../../components/chat/ChatLauncher';

const SalesManagerNavbar = ({ onMenuClick, onToggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
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
  
  // Modern gradient with realistic fade to the right
  const navbarGradient = useColorModeValue(
    // Light mode: Smooth fade from deep ocean blue to transparent white
    'linear-gradient(90deg,rgb(120, 186, 225) 50%, rgb(255, 255, 255) 90%, rgba(255,255,255,0.8) 100%)',
    // Dark mode: Deep blue to dark with subtle fade
    'linear-gradient(90deg, #001233 0%, #001d3d 20%, #003566 50%, #1a202c 90%, #1a202c 100%)'
  );
  
  const bgColor = 'transparent';
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)');
  const textColor = useColorModeValue('gray.800', 'rgba(255, 255, 255, 0.9)');
  const hoverBg = useColorModeValue('rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)');
  const activeColor = useColorModeValue('blue.700', 'blue.300');
  const iconColor = useColorModeValue('rgba(0, 0, 0, 0.7)', 'rgba(255, 255, 255, 0.8)');
  const iconHoverColor = useColorModeValue('rgba(0, 0, 0, 0.9)', 'white');
  
  // Get user data from Zustand store
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch initial notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoadingNotifications(true);
        const data = await getNotifications();
        
        // Transform notifications to match our format
        const formattedNotifications = data.map(notif => ({
          id: notif._id,
          message: notif.message,
          read: notif.read,
          time: getTimeAgo(notif.createdAt),
          taskId: notif.taskId
        }));
        
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    if (currentUser?._id) {
      fetchNotifications();
    }
  }, [currentUser?._id]);

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
        taskId: notification.taskId
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

  // Import useEffect at the top of the file
  // Add this near the other imports: import { useEffect, useState } from 'react';

  return (
    <Box
      as="nav"
      position="fixed"
      top="0"
      left={isMobile ? 0 : (isSidebarCollapsed ? "70px" : "260px")}
      right="0"
      bg={navbarGradient}
      backgroundSize="cover"
      backgroundPosition="center right"
      borderBottom="1px"
      borderColor={borderColor}
      zIndex="sticky"
      height="60px"
      transition="all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      boxShadow="sm"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(255,255,255,0.1) 100%)',
        pointerEvents: 'none',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1px',
        bg: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
      }}
    >
      <Flex
        h="100%"
        alignItems="center"
        justifyContent="space-between"
        px={4}
      >
        {/* Left side - Menu and Breadcrumb */}
        <HStack spacing={3} flex="1">
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onMenuClick}
            icon={<FiMenu />}
            variant="ghost"
            aria-label="Open menu"
            color={iconColor}
          />

          {/* Desktop sidebar toggle */}
          <IconButton
            display={{ base: 'none', md: 'flex' }}
            icon={isSidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            onClick={onToggleSidebar}
            variant="ghost"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            color={iconColor}
          />

          {/* Page Title */}
          {/* <Text 
            fontSize="xl" 
            fontWeight="semibold" 
            color={textColor}
            display={{ base: 'none', md: 'block' }}
          >
            Sales Manager Dashboard
          </Text> */}
        </HStack>

        {/* Right side - Actions */}
        <HStack spacing={{ base: 2, md: 4 }}>
          {/* Theme Toggle */}
          <Tooltip 
            label={colorMode === 'light' ? 'Dark mode' : 'Light mode'}
            placement="bottom"
            hasArrow
            bg={useColorModeValue('gray.800', 'white')}
            color={useColorModeValue('white', 'gray.800')}
            fontSize="xs"
          >
            <IconButton
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle color mode"
              color={iconColor}
              _hover={{ 
                bg: 'rgba(255, 255, 255, 0.15)',
                color: iconHoverColor,
                transform: 'translateY(-1px)'
              }}
              _active={{
                transform: 'translateY(0)'
              }}
              transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
            />
          </Tooltip>

          <ChatLauncher
            icon={<FiMessageSquare size="20px" />}
            iconButtonProps={{
              variant: 'ghost',
              color: iconColor,
              _hover: {
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s'
            }}
          />

          {/* Notifications */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={
                <Box position="relative">
                  <FiBell size="20px" />
                  {unreadCount > 0 && (
                    <Badge
                      colorScheme="red"
                      borderRadius="full"
                      position="absolute"
                      top="-2px"
                      right="-2px"
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
              variant="ghost"
              aria-label="Notifications"
              color={iconColor}
              _hover={{ 
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              }}
              transition="all 0.2s"
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
                <Button 
                  size="xs" 
                  variant="ghost" 
                  colorScheme="blue"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await markAllAsRead();
                  }}
                >
                  Mark all as read
                </Button>
              </Box>
              <VStack
                spacing={0}
                divider={<Divider m={0} />}
                align="stretch"
                maxH="300px"
                overflowY="auto"
              >
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      py={3}
                      _hover={{ bg: hoverBg }}
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
              </VStack>
            </MenuList>
          </Menu>

          {/* User Profile */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              px={2}
              _hover={{ 
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)'
              }}
              _active={{ 
                bg: 'rgba(255, 255, 255, 0.15)'
              }}
              rightIcon={
                <Box
                  as="span"
                  display="inline-flex"
                  transition="all 0.2s"
                  color={iconColor}
                  _groupHover={{ 
                    transform: "rotate(180deg)",
                    color: 'white'
                  }}
                >
                  <FiChevronDown />
                </Box>
              }
              _groupHover={{ 
                bg: 'rgba(255, 255, 255, 0.1)',
                '& .chakra-text': {
                  color: 'white'
                }
              }}
              color={textColor}
              transition="all 0.2s"
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name="Sales Manager"
                  bg={activeColor}
                  color="white"
                />
                {!isMobile && (
                  <Box textAlign="left">
                    <Text fontSize="sm" fontWeight="medium">
                      Sales Manager
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Admin
                    </Text>
                  </Box>
                )}
              </HStack>
            </MenuButton>
            <MenuList zIndex="popover" minW="200px">
              <MenuItem icon={<FiUser size={16} />}>
                My Profile
              </MenuItem>
              <MenuItem icon={<FiSettings size={16} />}>
                Settings
              </MenuItem>
              <MenuItem icon={<FiHelpCircle size={16} />}>
                Help & Support
              </MenuItem>
              <Divider my={1} />
              <MenuItem 
                icon={<FiLogOut size={16} />}
                color="red.500"
                _hover={{ bg: 'red.50' }}
                onClick={() => {
                  // Clear user and redirect to login
                  const clearUser = useUserStore.getState().clearUser;
                  if (typeof clearUser === 'function') clearUser();
                  navigate('/login');
                }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default SalesManagerNavbar;
