import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Tooltip,
  useColorModeValue,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiMenu,
  FiUsers,
  // FiBook,
  FiBookOpen,
  FiGlobe,
  FiBook,
  FiClipboard,
  FiFileText,
  FiBarChart2,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { MdLibraryBooks } from "react-icons/md";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiMessageSquare } from "react-icons/fi";
import { getNotifications } from "../../services/notificationService";
import { useUserStore } from "../../store/user";

const SSidebar = ({ isCollapsed: collapsedProp, toggleCollapse: toggleProp, activeSection, onSelectSection }) => {
  // Allow the sidebar to be controlled by a parent while preserving a local fallback.
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollBoxRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const isControlled = typeof collapsedProp === "boolean" && typeof toggleProp === "function";
  const isCollapsed = isControlled ? collapsedProp : internalCollapsed;
  const toggleCollapse = () => {
    if (isControlled) {
      toggleProp();
    } else {
      setInternalCollapsed((prevState) => !prevState);
    }
  };

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  // Fetch notifications to count unread messages
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      // Filter for general notifications (broadcast messages) and count unread
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to periodically refresh the count
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Scroll up/down functions
  const scrollUp = () => {
    if (scrollBoxRef.current) {
      scrollBoxRef.current.scrollBy({ top: -100, behavior: "smooth" });
    }
  };
  const scrollDown = () => {
    if (scrollBoxRef.current) {
      scrollBoxRef.current.scrollBy({ top: 100, behavior: "smooth" });
    }
  };

  const isActive = (path) => location.pathname === path;
  const isDashboardActive = activeSection === 'dashboard' || (location.pathname === '/Cdashboard' && !['notice-board', 'requests'].includes(activeSection));
  const isNoticeBoardActive = activeSection === 'notice-board' || isActive("/customer/messages");
  const isRequestsActive = activeSection === 'requests' || isActive("/requests");

  const sidebarBg = useColorModeValue("linear-gradient(180deg, #f9fbff, #f1f5ff)", "linear-gradient(180deg, #0b1224, #0f1e3a)");
  const textColor = useColorModeValue("gray.800", "white");
  const accentColor = useColorModeValue("#2563eb", "teal.200");
  const iconColor = useColorModeValue("gray.600", "white");
  const activeIconColor = useColorModeValue("blue.600", "teal.200");
  const activeTextColor = useColorModeValue("blue.800", "white");
  const sidebarBorderColor = useColorModeValue("blue.100", "whiteAlpha.200");
  const userCardBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.100");
  const userMetaColor = useColorModeValue("gray.500", "gray.400");
    const isCSM = (() => {
    try {
      const rawUser =
        localStorage.getItem("user") ||
        localStorage.getItem("userInfo") ||
        localStorage.getItem("userData");
      const roleFieldFromUser = rawUser
        ? (() => {
            const parsed = typeof rawUser === "string" ? JSON.parse(rawUser) : rawUser;
            return parsed?.role || parsed?.user?.role || parsed?.userRole || parsed?.user?.userRole;
          })()
        : null;

      const roleFromStore = localStorage.getItem("userRole");
      const roles = Array.isArray(roleFieldFromUser) ? roleFieldFromUser : [roleFieldFromUser, roleFromStore];
      return roles.some((r) => (r || "").toString().trim().toLowerCase() === "customersuccessmanager");
    } catch (e) {
      // fallback: hide restricted links if parsing fails
    }
    return false;
  })();


  return (
    <Box
      as="nav"
      width={isCollapsed ? "78px" : "260px"}
      minHeight="100vh"
      maxHeight="100vh"
      position="fixed"
      left={0}
      top={0}
      bgGradient={sidebarBg}
      color={textColor}
      transition="width 0.25s ease"
      zIndex="1000"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      boxShadow="lg"
      pos="relative"
    >
      <Flex
        justify={isCollapsed ? "center" : "space-between"}
        align="center"
        px={isCollapsed ? 0 : 4}
        py={5}
        flexShrink={0}
      >
        {!isCollapsed && (
          <Flex align="center" gap={3} pr={8}>
            <Flex boxSize="38px" borderRadius="xl" bg="teal.400" color="white" align="center" justify="center" fontWeight="900">
              CS
            </Flex>
            <Box>
              <Text fontWeight="900" fontSize="md" color={textColor}>
                Customer Service
              </Text>
              <Text fontSize="xs" color={userMetaColor}>Support Console</Text>
            </Box>
          </Flex>
        )}
      </Flex>
      <IconButton
        icon={isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        variant="solid"
        colorScheme={isCollapsed ? "teal" : "blue"}
        size="sm"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={toggleCollapse}
        position="absolute"
        top="12px"
        right={isCollapsed ? "6px" : "10px"}
        borderRadius="full"
        boxShadow="md"
      />

      

      {/* Sidebar Links with scroll */}
  <Box flex="0 1 auto" overflowY="auto" minHeight={0} maxHeight="calc(100vh - 260px)" ref={scrollBoxRef}>
        <VStack align="start" spacing={3} p={2}>
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/Cdashboard"
            icon={<FiHome />}
            label="Dashboard"
            active={isDashboardActive}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
            onClick={() => {
              if (typeof onSelectSection === 'function') {
                onSelectSection('dashboard');
              }
            }}
          />
                    <SidebarLink
            isCollapsed={isCollapsed}
            to="/b2b-dashboard"
            icon={<FiGlobe />}
            label="B2B Marketplace"
            active={isActive("/b2b-dashboard")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/customerfollowup"
            icon={<FiUsers />}
            label="Customer Followup"
            active={isActive("/customerfollowup")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/customer/messages"
            icon={<FiMessageSquare />}
            label="Notice Board"
            active={isNoticeBoardActive}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
            unreadCount={unreadCount}
            onClick={(e) => {
              e.preventDefault();
              if (typeof onSelectSection === 'function') {
                onSelectSection('notice-board');
              } else {
                navigate('/customer/messages');
              }
              fetchUnreadCount();
            }}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/requests"
            icon={<FiClipboard />}
            label="Requests"
            active={isRequestsActive}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
            onClick={(e) => {
              if (typeof onSelectSection === 'function') {
                e.preventDefault();
                onSelectSection('requests');
              }
            }}
          />
          {isCSM && (
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customerreport"
              icon={<FiBarChart2 />}
              label="Reports"
              active={isActive("/customerreport")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
            />
          )}
          {isCSM && (
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customer/kpi"
              icon={<FiBarChart2 />}
              label="KPI"
              active={isActive("/customer/kpi")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
            />
          )}
          {isCSM && (
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/followup-report"
              icon={<FiBarChart2 />}
              label="Follow Up Report"
              active={isActive("/followup-report")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
            />
          )}
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/training"
            icon={<FiBookOpen />}
            label="Training"
            active={isActive("/training")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          {isCSM && (
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customer-settings"
              icon={<FiSettings />}
              label="Settings"
              active={isActive("/customer-settings")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
            />
          )}
        </VStack>
      </Box>

      <Box
        p={3}
        mt={3}
        mx={2}
        mb={6}
        border="1px solid"
        borderColor={sidebarBorderColor}
        borderRadius="2xl"
        bg={userCardBg}
        boxShadow="md"
        flexShrink={0}
      >
        {!isCollapsed && (
          <Box px={2} py={2} mb={2} borderRadius="xl">
            <Text fontSize="xs" color={userMetaColor}>Signed in as</Text>
            <Text fontSize="sm" fontWeight="800" noOfLines={1}>{currentUser?.fullName || currentUser?.username || "Customer Service"}</Text>
            <Text fontSize="xs" color={userMetaColor} noOfLines={1}>{currentUser?.email || currentUser?.displayRole || "Customer Service"}</Text>
          </Box>
        )}
        <VStack align="stretch" spacing={2}>
          <Tooltip label="Profile" isDisabled={!isCollapsed} placement="right" hasArrow>
            <Button
              as={RouterLink}
              to="/employee-info"
              size="sm"
              justifyContent={isCollapsed ? "center" : "flex-start"}
              leftIcon={isCollapsed ? undefined : <FiUser />}
              variant="ghost"
              colorScheme="blue"
            >
              {isCollapsed ? <FiUser /> : "Profile"}
            </Button>
          </Tooltip>
          <Tooltip label="Logout" isDisabled={!isCollapsed} placement="right" hasArrow>
            <Button
              size="sm"
              justifyContent={isCollapsed ? "center" : "flex-start"}
              leftIcon={isCollapsed ? undefined : <FiLogOut />}
              variant="outline"
              colorScheme="red"
              onClick={handleLogout}
            >
              {isCollapsed ? <FiLogOut /> : "Logout"}
            </Button>
          </Tooltip>
        </VStack>
      </Box>
    </Box>
  );
};

/* Sidebar Link Component */
const SidebarLink = ({ isCollapsed, to, icon, label, active, iconColor, activeIconColor, textColor, activeTextColor, unreadCount = 0, onClick }) => (
  <Tooltip label={label} isDisabled={!isCollapsed} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: "none" }}
      aria-label={label}
      onClick={onClick}
    >
      <HStack
        align="center"
        p={2}
        borderRadius="md"
        bg={active ? "rgba(56, 189, 248, 0.15)" : "transparent"}
        border={active ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent"}
        _hover={{ bg: "rgba(56, 189, 248, 0.08)", borderColor: "rgba(56, 189, 248, 0.3)" }}
        transition="all 0.2s ease"
        position="relative"
        spacing={3}
      >
        <Box color={active ? activeIconColor : iconColor} fontSize="18px">
          {icon}
        </Box>
        {!isCollapsed && (
          <>
            <Text whiteSpace="nowrap" fontSize="14px" color={active ? activeTextColor : textColor}>
              {label}
            </Text>
            {unreadCount > 0 && label === 'Notice Board' && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="8px"
                right="8px"
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
          </>
        )}
      </HStack>
    </Link>
  </Tooltip>
);

export default SSidebar;
