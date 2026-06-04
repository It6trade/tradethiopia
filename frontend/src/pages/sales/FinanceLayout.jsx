import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaBoxes, 
  FaBell, 
  FaStickyNote, 
  FaMoon, 
  FaSun, 
  FaUserCircle, 
  FaBars,
  FaHome,
  FaChartBar,
  FaShoppingCart,
  FaDollarSign,
  FaTruck,
  FaUsers,
  FaClipboardList,
  FaMoneyBillWave,
  FaCogs,
  FaArrowRight,
  FaCommentDots,
  FaChartLine
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import NotesLauncher from '../../components/notes/NotesLauncher';
import { keyframes } from '@emotion/react';
import apiClient from '../../utils/apiClient';
import { getLatestRequestTimestamp, getRequestCreatedAt, markTeamRequestsAsRead, getTeamRequestsLastSeenAt } from '../../utils/teamRequestHelpers';
import { getNotifications } from '../../services/notificationService';

const bellPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.6);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 6px rgba(56, 178, 172, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(56, 178, 172, 0);
  }
`;

const FinanceLayout = ({ children }) => {
  const { isOpen: isSidebarOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // State variables
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  
  // Get user data from Zustand store
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  // Color mode values
  const sidebarBg = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');
  const pageBg = useColorModeValue("#f5f8ff", "#0b1224");
  const [teamRequests, setTeamRequests] = useState([]);
  const [teamRequestsLoading, setTeamRequestsLoading] = useState(false);
  const [lastTeamRequestSeen, setLastTeamRequestSeen] = useState(() => getTeamRequestsLastSeenAt() || new Date(0));
  const [isBellPulsing, setIsBellPulsing] = useState(false);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const unreadCountRef = useRef(0);

  // Navigation items
  const navItems = [
    { label: 'Dashboard', icon: FaHome, path: '/finance-dashboard' },
    { label: 'Financial Reports', icon: FaChartBar, path: '/finance-dashboard/reports' },
    { label: 'Inventory', icon: FaBoxes, path: '/finance-dashboard/inventory' },
    { label: 'Orders', icon: FaShoppingCart, path: '/finance-dashboard/orders' },
    { label: 'Pricing', icon: FaDollarSign, path: '/finance-dashboard/pricing' },
    { label: 'Create Course', icon: FaDollarSign, path: '/finance-dashboard/create-course' },
    { label: 'Revenue', icon: FaDollarSign, path: '/finance-dashboard/revenue' },
    { label: 'Imported Items', icon: FaUsers, path: '/finance-dashboard/purchase' },
    { label: 'Costs', icon: FaMoneyBillWave, path: '/finance-dashboard/costs' },
    { label: 'Payroll', icon: FaDollarSign, path: '/finance-dashboard/payroll' },
    { label: 'Commission Approved', icon: FaChartLine, path: '/finance-dashboard/commission-approval' },
    { label: 'Requests', icon: FaStickyNote, path: '/finance/requests' },
    { label: 'Team Requests', icon: FaClipboardList, path: '/finance/team-requests' },
    { label: 'Notice Board', icon: FaCommentDots, path: '/finance/messages' },
    { label: 'Settings', icon: FaCogs, path: '/finance-dashboard/settings' },
  ];
  
  // Set active item based on current location - Fixed to avoid infinite loops
  useEffect(() => {
    const currentItem = navItems.find(item => location.pathname === item.path);
    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname]); // Dependency array is correct
  
    const handleNavigation = (path) => {
      navigate(path);
      onClose();
    };

    const fetchTeamRequestsForNotifications = useCallback(async () => {
      setTeamRequestsLoading(true);
      try {
        const response = await apiClient.get('/requests');
        const payload = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        setTeamRequests(payload.slice(0, 5));
      } catch (error) {
        console.error('Failed to load team requests for notifications', error);
      } finally {
        setTeamRequestsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchTeamRequestsForNotifications();
      const interval = setInterval(fetchTeamRequestsForNotifications, 30000);
      return () => clearInterval(interval);
    }, [fetchTeamRequestsForNotifications]);

    const fetchUnreadNoticeCount = useCallback(async () => {
      try {
        const data = await getNotifications();
        const broadcastMessages = data.filter(msg => msg.type === 'general');
        const unread = broadcastMessages.filter(msg => !msg.read).length;
        setUnreadNoticeCount(unread);
      } catch (err) {
        console.error('Error fetching notice count:', err);
      }
    }, []);

    useEffect(() => {
      fetchUnreadNoticeCount();
      const interval = setInterval(fetchUnreadNoticeCount, 30000);
      return () => clearInterval(interval);
    }, [fetchUnreadNoticeCount]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const normalizedTeamRequestSeen = lastTeamRequestSeen || new Date(0);
  const unreadTeamRequestCount = useMemo(() => {
    return teamRequests.filter((request) => {
      const createdAt = getRequestCreatedAt(request);
      return createdAt && createdAt > normalizedTeamRequestSeen;
    }).length;
  }, [teamRequests, normalizedTeamRequestSeen]);

  const teamRequestsBadgeLabel = unreadTeamRequestCount > 0
    ? unreadTeamRequestCount > 99
      ? '99+'
      : `${unreadTeamRequestCount}`
    : null;

  useEffect(() => {
    if (unreadTeamRequestCount > unreadCountRef.current) {
      setIsBellPulsing(true);
      const animationReset = setTimeout(() => setIsBellPulsing(false), 1200);
      unreadCountRef.current = unreadTeamRequestCount;
      return () => clearTimeout(animationReset);
    }
    unreadCountRef.current = unreadTeamRequestCount;
  }, [unreadTeamRequestCount]);

  useEffect(() => {
    if (location.pathname !== '/finance/team-requests') return;
    const latest = getLatestRequestTimestamp(teamRequests) || new Date();
    markTeamRequestsAsRead(latest);
    setLastTeamRequestSeen(latest);
  }, [location.pathname, teamRequests]);

  const handleNotificationClick = (request) => {
    const timestamp = getRequestCreatedAt(request) || new Date();
    markTeamRequestsAsRead(timestamp);
    setLastTeamRequestSeen(timestamp);
    navigate('/finance/team-requests');
  };

  const handleViewAllRequests = () => {
    const reference = getLatestRequestTimestamp(teamRequests) || new Date();
    markTeamRequestsAsRead(reference);
    setLastTeamRequestSeen(reference);
    navigate('/finance/team-requests');
  };

  const formatNotificationDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString();
  };

  const getNotificationStatusColor = (status) => {
    switch ((status || 'Pending').toLowerCase()) {
      case 'approved':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'orange';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch ((priority || 'medium').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Removed duplicate useEffect for active item

  const SidebarItem = ({ icon, label, path, isActive, onClick, badgeLabel }) => {
    return (
      <Tooltip label={isSidebarCollapsed ? label : ''} placement="right" hasArrow>
          <HStack
            as="button"
            spacing={isSidebarCollapsed ? 0 : 2}
            p={isSidebarCollapsed ? 1 : 2}
            w="100%"
            bg={isActive ? 'teal.600' : 'gray.700'}
            _hover={{ bg: isActive ? 'teal.500' : 'gray.600', transform: 'translateX(1px)', transition: 'all 0.2s ease' }}
            borderRadius="md"
            justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
            transition="all 0.3s ease"
            onClick={onClick}
            boxShadow={isActive ? 'sm' : 'xs'}
            cursor="pointer"
            position="relative"
            minHeight="36px"
          >
            <Box as={icon} fontSize={isSidebarCollapsed ? "16px" : "18px"} />
            {!isSidebarCollapsed && (
              <>
                <Text fontSize="xs" fontWeight="medium">{label}</Text>
                {badgeLabel && (
                  <Badge
                    colorScheme="red"
                    borderRadius="full"
                    fontSize="9px"
                    px={1.5}
                    py={0.5}
                  >
                    {badgeLabel}
                  </Badge>
                )}
              </>
            )}
            {isSidebarCollapsed && badgeLabel && (
              <Badge
                position="absolute"
                top="4px"
                right="4px"
                colorScheme="red"
                borderRadius="full"
                fontSize="8px"
                px={1}
                py={0}
              >
                {badgeLabel}
              </Badge>
            )}
        </HStack>
      </Tooltip>
    );
  };

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      height="100vh" 
      bg={pageBg}
      color={useColorModeValue("gray.800", "whiteAlpha.900")}
    >
      {/* Main Container */}
      <Box display="flex" flex="1">
        {/* Sidebar for Larger Screens */}
        <Box
          position="fixed"
          top={0}
          left={0}
          width={isSidebarCollapsed ? "50px" : "200px"}
          height="100vh"
          transition="width 0.3s"
          display={{ base: "none", md: "block" }}
          zIndex="900"
          bg={sidebarBg}
          color={textColor}
        >
          <Flex direction="column" h="100%">
            <HStack justifyContent="space-between" alignItems="center" mb={2} mt={1} px={2}>
              {!isSidebarCollapsed && (
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.300">
                  Finance Portal
                </Text>
              )}
              <IconButton
                icon={isSidebarCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
                aria-label="Toggle Sidebar"
                variant="ghost"
                color="white"
                onClick={toggleSidebar}
                size="xs"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </HStack>
            <Divider mb={3} borderColor={borderColor} />
                <VStack align="stretch" spacing={0.5} px={1.5} flex="1">
                  {navItems.map((item) => (
                    <SidebarItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      path={item.path}
                      isActive={activeItem === item.label}
                      badgeLabel={item.label === 'Team Requests' ? teamRequestsBadgeLabel : item.label === 'Notice Board' ? (unreadNoticeCount > 0 ? (unreadNoticeCount > 99 ? '99+' : `${unreadNoticeCount}`) : undefined) : undefined}
                      onClick={() => {
                        setActiveItem(item.label);
                        handleNavigation(item.path);
                      }}
                    />
                  ))}
                </VStack>
          </Flex>
        </Box>

        {/* Drawer for Mobile Screens */}
        <Drawer isOpen={isSidebarOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Flex direction="column" h="100%" bg={sidebarBg} color={textColor}>
              <HStack justifyContent="space-between" alignItems="center" mb={2} mt={1} px={2}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.300">
                  Finance Portal
                </Text>
                <IconButton
                  icon={<FaArrowLeft />}
                  aria-label="Close Sidebar"
                  variant="ghost"
                  color="white"
                  onClick={onClose}
                  size="xs"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </HStack>
              <Divider mb={2} borderColor={borderColor} />
              <VStack align="stretch" spacing={0.5} px={1.5} flex="1">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    isActive={activeItem === item.label}
                    badgeLabel={item.label === 'Team Requests' ? teamRequestsBadgeLabel : item.label === 'Notice Board' ? (unreadNoticeCount > 0 ? (unreadNoticeCount > 99 ? '99+' : `${unreadNoticeCount}`) : undefined) : undefined}
                    onClick={() => {
                      setActiveItem(item.label);
                      handleNavigation(item.path);
                    }}
                  />
                ))}
              </VStack>
            </Flex>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          ml={{
            base: 0,
            md: isSidebarCollapsed ? "50px" : "200px",
          }}
          transition="margin-left 0.3s"
          flex="1"
          width="100%"
          display="flex"
          flexDirection="column"
        >
          {/* Navbar */}
          <Box
            position="sticky"
            top={0}
            zIndex="100"
            bg={useColorModeValue("white", "gray.800")}
            boxShadow="sm"
            px={4}
            py={3}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("teal.600", "teal.200")}>
                  Finance Dashboard
                </Text>
              </HStack>
              <HStack spacing={2}>
                  <IconButton
                    display={{ base: "flex", md: "none" }}
                    icon={<FaBoxes />}
                    aria-label="Open Sidebar"
                    size="sm"
                    onClick={onOpen}
                  />
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="sm"
                      px={2}
                      py={1}
                      borderRadius="full"
                      aria-label="Team request notifications"
                      position="relative"
                      animation={isBellPulsing ? `${bellPulse} 1.2s ease` : undefined}
                    >
                      <Box position="relative">
                        <FaBell />
                        {teamRequestsBadgeLabel && (
                          <Badge
                            position="absolute"
                            top="-1"
                            right="-1"
                            fontSize="xs"
                            colorScheme="red"
                            borderRadius="full"
                            minW="20px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {teamRequestsBadgeLabel}
                          </Badge>
                        )}
                      </Box>
                    </MenuButton>
                    <MenuList minW="320px" maxW="360px" py={0}>
                      <Box px={4} py={3}>
                        <Text fontWeight="bold" fontSize="sm">Team Requests</Text>
                        <Text fontSize="xs" color="gray.500">
                          {unreadTeamRequestCount} unread request{unreadTeamRequestCount === 1 ? '' : 's'}
                        </Text>
                      </Box>
                      <Divider />
                      {teamRequestsLoading ? (
                        <MenuItem isDisabled>
                          <Text fontSize="sm" color="gray.500">Loading requests...</Text>
                        </MenuItem>
                      ) : teamRequests.length === 0 ? (
                        <MenuItem isDisabled>
                          <Text fontSize="sm" color="gray.500">No recent requests.</Text>
                        </MenuItem>
                      ) : (
                        teamRequests.map((request) => {
                          const label = request.title || `${request.department || 'Team'} request`;
                          return (
                            <MenuItem
                              key={request._id || request.createdAt || label}
                              onClick={() => handleNotificationClick(request)}
                              flexDirection="column"
                              alignItems="flex-start"
                              py={3}
                            >
                              <Flex width="100%" justify="space-between" align="center">
                                <Text fontSize="sm" fontWeight="semibold" isTruncated maxW="190px">
                                  {label}
                                </Text>
                                <Badge colorScheme={getPriorityBadgeColor(request.priority)} fontSize="xx-small">
                                  {request.priority || 'Medium'}
                                </Badge>
                              </Flex>
                              <HStack spacing={2} fontSize="xs" color="gray.500">
                                <Text>{request.department || 'Department'}</Text>
                                <Text>-</Text>
                                <Badge colorScheme={getNotificationStatusColor(request.status)} fontSize="xx-small">
                                  {request.status || 'Pending'}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                {formatNotificationDate(request.createdAt || request.date)}
                              </Text>
                            </MenuItem>
                          );
                        })
                      )}
                      <MenuDivider />
                      <MenuItem onClick={handleViewAllRequests}>
                        <Text fontSize="sm">View all requests</Text>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                <NotesLauncher
                  buttonProps={{
                    variant: 'ghost',
                    size: 'sm',
                    'aria-label': 'Notes',
                  }}
                  tooltipLabel="Notes"
                />
                <IconButton
                  icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                  aria-label="Toggle Theme"
                  variant="ghost"
                  size="sm"
                  onClick={toggleColorMode}
                />
                <Menu>
                  <MenuButton>
                    <Avatar
                      name={currentUser?.username || "User"}
                      size="sm"
                      bg="teal.300"
                      icon={<FaUserCircle fontSize="18px" />}
                    />
                  </MenuButton>
                  <MenuList>
                    <Box p={3}>
                      <Text fontWeight="bold" fontSize="md">{currentUser?.username || "User"}</Text>
                      <Text fontSize="xs" color="gray.500">{currentUser?.role || "Role not available"}</Text>
                    </Box>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </Box>

          {/* Page Content */}
          <Box 
            flex="1"
            p={{ base: 2, md: 4 }} 
            pt={{ base: 4, md: 4 }}
            overflowY="auto"
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FinanceLayout;
