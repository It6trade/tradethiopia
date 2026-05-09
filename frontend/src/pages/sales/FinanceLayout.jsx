import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaBoxes, 
  FaBell, 
  FaMoon, 
  FaSun, 
  FaUserCircle, 
  FaHome,
  FaChartBar,
  FaDollarSign,
  FaTruck,
  FaUsers,
  FaClipboardList,
  FaMoneyBillWave,
  FaCogs,
  FaArrowRight,
  FaCommentDots,
  FaChevronDown,
  FaChevronRight,
  FaBook,
  FaFileInvoiceDollar
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
  
  // State variables
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    Accounting: true,
    'Sales Finance': true,
    'Purchase Finance': false,
  });
  
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

  const navGroups = [
    { label: 'Dashboard', icon: FaHome, path: '/finance-dashboard/erp' },
    {
      label: 'Accounting',
      icon: FaBook,
      children: [
        { label: 'Chart of Accounts', path: '/finance-dashboard/accounting?tab=accounting' },
        { label: 'Journal Entries', path: '/finance-dashboard/accounting?tab=journalEntries' },
        { label: 'General Ledger', path: '/finance-dashboard/accounting?tab=ledger' },
        { label: 'Trial Balance', path: '/finance-dashboard/accounting?tab=trialBalance' },
        { label: 'Profit & Loss', path: '/finance-dashboard/accounting?tab=profitLoss' },
        { label: 'Balance Sheet', path: '/finance-dashboard/accounting?tab=balanceSheet' },
      ]
    },
    {
      label: 'Sales Finance',
      icon: FaFileInvoiceDollar,
      children: [
        { label: 'Customers', path: '/finance-dashboard/sales-finance?tab=customers' },
        { label: 'Invoices', path: '/finance-dashboard/sales-finance?tab=invoices' },
        { label: 'Payments', path: '/finance-dashboard/sales-finance?tab=salesPayments' },
        { label: 'Receivables', path: '/finance-dashboard/sales-finance?tab=receivables' },
      ]
    },
    {
      label: 'Purchase Finance',
      icon: FaTruck,
      children: [
        { label: 'Vendors', path: '/finance-dashboard/purchase-finance?tab=vendors' },
        { label: 'Bills', path: '/finance-dashboard/purchase-finance?tab=bills' },
        { label: 'Supplier Payments', path: '/finance-dashboard/purchase-finance?tab=supplierPayments' },
        { label: 'Payables', path: '/finance-dashboard/purchase-finance?tab=payables' },
      ]
    },
    { label: 'Banking', icon: FaMoneyBillWave, path: '/finance-dashboard/bank-cash' },
    { label: 'Expenses', icon: FaDollarSign, path: '/finance-dashboard/expenses' },
    { label: 'Payroll', icon: FaUsers, path: '/finance-dashboard/payroll' },
    { label: 'Tax Management', icon: FaClipboardList, path: '/finance-dashboard/tax' },
    { label: 'Reports', icon: FaChartBar, path: '/finance-dashboard/reports' },
    { label: 'Settings', icon: FaCogs, path: '/finance-dashboard/settings' },
    {
      label: 'Collaboration',
      icon: FaCommentDots,
      children: [
        { label: 'Requests', path: '/finance/requests' },
        { label: 'Team Requests', path: '/finance/team-requests' },
        { label: 'Notice Board', path: '/finance/messages' },
      ]
    }
  ];

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

  const SidebarItem = ({ icon, label, isActive, onClick, badgeLabel, depth = 0 }) => {
    return (
      <Tooltip label={isSidebarCollapsed ? label : ''} placement="right" hasArrow>
          <HStack
            as="button"
            spacing={isSidebarCollapsed ? 0 : 2}
            px={isSidebarCollapsed ? 1 : 2}
            py={1}
            w="100%"
            bg={isActive ? 'purple.600' : 'transparent'}
            _hover={{ bg: isActive ? 'purple.500' : 'whiteAlpha.100' }}
            borderRadius="4px"
            justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
            transition="all 0.15s ease"
            onClick={onClick}
            cursor="pointer"
            position="relative"
            minHeight={depth ? '26px' : '30px'}
            pl={isSidebarCollapsed ? 1 : depth ? 7 : 2}
          >
            {icon && <Box as={icon} fontSize={isSidebarCollapsed ? "15px" : "14px"} color={isActive ? 'white' : 'gray.300'} />}
            {!isSidebarCollapsed && (
              <>
                <Text fontSize={depth ? '11px' : '12px'} fontWeight={isActive ? 'semibold' : 'medium'} color={isActive ? 'white' : 'gray.200'}>{label}</Text>
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

  const SidebarGroup = ({ item }) => {
    const isOpen = openGroups[item.label];
    const fullPath = `${location.pathname}${location.search}`;
    const hasActiveChild = item.children?.some((child) => fullPath === child.path || location.pathname === child.path);

    if (!item.children) {
      return (
        <SidebarItem
          icon={item.icon}
          label={isSidebarCollapsed ? '' : item.label}
          isActive={location.pathname === item.path}
          onClick={() => {
            handleNavigation(item.path);
          }}
        />
      );
    }

    return (
      <Box>
        <HStack
          as="button"
          w="100%"
          px={isSidebarCollapsed ? 1 : 2}
          py={1}
          minH="30px"
          borderRadius="4px"
          bg={hasActiveChild ? 'whiteAlpha.100' : 'transparent'}
          _hover={{ bg: 'whiteAlpha.100' }}
          justify={isSidebarCollapsed ? 'center' : 'space-between'}
          onClick={() => setOpenGroups((current) => ({ ...current, [item.label]: !current[item.label] }))}
        >
          <HStack spacing={2}>
            <Box as={item.icon} fontSize="14px" color={hasActiveChild ? 'purple.200' : 'gray.300'} />
            {!isSidebarCollapsed && <Text fontSize="12px" fontWeight="semibold" color="gray.100">{item.label}</Text>}
          </HStack>
          {!isSidebarCollapsed && <Box as={isOpen ? FaChevronDown : FaChevronRight} fontSize="10px" color="gray.400" />}
        </HStack>
        {!isSidebarCollapsed && isOpen && (
          <VStack align="stretch" spacing={0.5} mt={0.5}>
            {item.children.map((child) => {
              const badgeLabel = child.label === 'Team Requests'
                ? teamRequestsBadgeLabel
                : child.label === 'Notice Board' && unreadNoticeCount > 0
                  ? unreadNoticeCount > 99 ? '99+' : `${unreadNoticeCount}`
                  : undefined;
              return (
                <SidebarItem
                  key={child.label}
                  label={child.label}
                  depth={1}
                  isActive={fullPath === child.path}
                  badgeLabel={badgeLabel}
                  onClick={() => {
                    handleNavigation(child.path);
                  }}
                />
              );
            })}
          </VStack>
        )}
      </Box>
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
                <VStack align="stretch" spacing={0.5} px={1.5} flex="1" overflowY="auto">
                  {navGroups.map((item) => (
                    <SidebarGroup key={item.label} item={item} />
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
              <VStack align="stretch" spacing={0.5} px={1.5} flex="1" overflowY="auto">
                {navGroups.map((item) => (
                  <SidebarGroup key={item.label} item={item} />
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
