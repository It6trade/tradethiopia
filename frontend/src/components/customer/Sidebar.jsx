import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiClipboard,
  FiGlobe,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMessageSquare,
  FiPackage,
  FiSettings,
  FiTool,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { getNotifications } from "../../services/notificationService";
import { useUserStore } from "../../store/user";

const normalizeRoleValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isManagerOrAdminRole = (role) => {
  const norm = normalizeRoleValue(role);
  return (
    norm === "customersuccessmanager" ||
    norm === "admin" ||
    norm === "leader" ||
    norm === "supervisor" ||
    norm === "ceo" ||
    norm === "coo" ||
    norm.includes("manager")
  );
};

const SSidebar = ({ isCollapsed: collapsedProp, toggleCollapse: toggleProp, activeSection, onSelectSection }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openGroups, setOpenGroups] = useState({
    workspace: true,
    management: true,
  });
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

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      const broadcastMessages = (Array.isArray(data) ? data : []).filter((msg) => msg.type === "general");
      const unread = broadcastMessages.filter((msg) => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();
  const isDashboardActive =
    activeSection === "dashboard" ||
    (location.pathname === "/Cdashboard" && !["notice-board", "requests", "it-requests"].includes(activeSection));
  const isNoticeBoardActive = activeSection === "notice-board" || isActive("/customer/messages");
  const isRequestsActive = activeSection === "requests" || isActive("/requests");
  const isItRequestsActive = activeSection === "it-requests";

  const sidebarBg = useColorModeValue(
    "linear-gradient(180deg, #f8fbff 0%, #edf3fe 100%)",
    "linear-gradient(180deg, #090f1d 0%, #0d162b 100%)"
  );
  const textColor = useColorModeValue("gray.750", "gray.200");
  const iconColor = useColorModeValue("gray.500", "gray.400");
  const activeIconColor = useColorModeValue("blue.600", "blue.300");
  const activeTextColor = useColorModeValue("blue.700", "white");
  const sidebarBorderColor = useColorModeValue("blue.100", "whiteAlpha.100");
  const userCardBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
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
      const roleFromCurrentUser = currentUser?.role || currentUser?.displayRole || currentUser?.normalizedRole;
      const roles = Array.isArray(roleFieldFromUser)
        ? [...roleFieldFromUser, roleFromStore, roleFromCurrentUser]
        : [roleFieldFromUser, roleFromStore, roleFromCurrentUser];
      return roles.filter(Boolean).some(isManagerOrAdminRole);
    } catch (e) {
      return false;
    }
  })();

  return (
    <Box
      as="nav"
      width="100%"
      height="100%"
      minHeight="100%"
      maxHeight="100%"
      position="relative"
      bgGradient={sidebarBg}
      color={textColor}
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex="1000"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      borderRight="1px solid"
      borderColor={sidebarBorderColor}
      boxShadow="sm"
    >
      {/* Brand Header */}
      <Flex
        justify={isCollapsed ? "center" : "space-between"}
        align="center"
        px={isCollapsed ? 2 : 4}
        py={4}
        flexShrink={0}
      >
        <Flex align="center" gap={3}>
          <Flex
            boxSize={isCollapsed ? "40px" : "36px"}
            borderRadius="xl"
            bgGradient="linear(to-br, blue.500, blue.600)"
            color="white"
            align="center"
            justify="center"
            fontWeight="900"
            fontSize="sm"
            boxShadow="0 6px 14px rgba(37, 99, 235, 0.3)"
          >
            CS
          </Flex>
          {!isCollapsed && (
            <Box>
              <Text fontWeight="800" fontSize="sm" color={textColor} letterSpacing="-0.2px">
                Customer Service
              </Text>
              <Text fontSize="2xs" color={userMetaColor} fontWeight="medium">
                Operations Hub
              </Text>
            </Box>
          )}
        </Flex>

        {!isCollapsed && (
          <IconButton
            icon={<FiChevronsLeft />}
            variant="ghost"
            size="xs"
            colorScheme="blue"
            aria-label="Collapse sidebar"
            onClick={toggleCollapse}
            borderRadius="lg"
          />
        )}
      </Flex>

      {isCollapsed && (
        <Flex justify="center" pb={2}>
          <IconButton
            icon={<FiChevronsRight />}
            variant="ghost"
            size="xs"
            colorScheme="blue"
            aria-label="Expand sidebar"
            onClick={toggleCollapse}
            borderRadius="lg"
          />
        </Flex>
      )}

      <Divider borderColor={sidebarBorderColor} opacity={0.6} />

      {/* Navigation Scrollable Body */}
      <Box
        flex="1 1 auto"
        overflowY="auto"
        minHeight={0}
        ref={scrollBoxRef}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: "4px" },
        }}
        py={3}
      >
        <VStack align="stretch" spacing={3} px={2}>
          {/* Workspace Group */}
          <SidebarGroup
            title="Workspace"
            isCollapsed={isCollapsed}
            isOpen={openGroups.workspace}
            onToggle={() => toggleGroup("workspace")}
          >
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
                if (typeof onSelectSection === "function") {
                  onSelectSection("dashboard");
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
              label="Customer Follow-up"
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
                if (typeof onSelectSection === "function") {
                  onSelectSection("notice-board");
                } else {
                  navigate("/customer/messages");
                }
                fetchUnreadCount();
              }}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/requests"
              icon={<FiClipboard />}
              label="Internal Requests"
              active={isRequestsActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              onClick={(e) => {
                if (typeof onSelectSection === "function") {
                  e.preventDefault();
                  onSelectSection("requests");
                }
              }}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/Cdashboard"
              icon={<FiTool />}
              label="IT Requests"
              active={isItRequestsActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              onClick={(e) => {
                e.preventDefault();
                if (typeof onSelectSection === "function") {
                  onSelectSection("it-requests");
                }
              }}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/training"
              icon={<FiBookOpen />}
              label="Training Academy"
              active={isActive("/training")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
            />
          </SidebarGroup>

          {/* Management & Analytics Group */}
          {/* Management & Analytics Group (Accessible & Visible to Managers Only) */}
          {isCSM && (
            <SidebarGroup
              title="Management"
              isCollapsed={isCollapsed}
              isOpen={openGroups.management}
              onToggle={() => toggleGroup("management")}
            >
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customerreport"
                icon={<FiBarChart2 />}
                label="Executive Report"
                active={isActive("/customerreport")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer/kpi"
                icon={<FiTrendingUp />}
                label="KPI Dashboard"
                active={isActive("/customer/kpi")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/followup-report"
                icon={<FiActivity />}
                label="Follow-up Report"
                active={isActive("/followup-report")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer-settings"
                icon={<FiSettings />}
                label="Service Settings"
                active={isActive("/customer-settings")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer/manager-tasks"
                icon={<FiLayers />}
                label="Task Oversight"
                active={isActive("/customer/manager-tasks") || isActive("/customer-manager-tasks")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer-user-management"
                icon={<FiUser />}
                label="User Management"
                active={isActive("/customer-user-management")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
              />
            </SidebarGroup>
          )}
        </VStack>
      </Box>

      {/* Maximized & Tall User Footer Profile Area - Elevated */}
      <Box
        p={4.5}
        mx={3}
        mb={{ base: 14, md: 16 }}
        mt={3}
        border="1px solid"
        borderColor={sidebarBorderColor}
        borderRadius="2xl"
        bg={userCardBg}
        boxShadow="lg"
        flexShrink={0}
        transition="all 0.2s ease"
        _hover={{
          transform: "translateY(-3px)",
          boxShadow: "xl",
        }}
      >
        {isCollapsed ? (
          <VStack spacing={3} align="center" py={1}>
            <Tooltip label={currentUser?.fullName || currentUser?.username || "My Profile"} placement="right" hasArrow>
              <Avatar
                as={RouterLink}
                to="/employee-info"
                size="md"
                name={currentUser?.fullName || currentUser?.username || "CS"}
                bg="blue.500"
                color="white"
                cursor="pointer"
              />
            </Tooltip>
            <Tooltip label="Sign Out" placement="right" hasArrow>
              <IconButton
                size="sm"
                variant="ghost"
                colorScheme="red"
                icon={<FiLogOut size={18} />}
                aria-label="Logout"
                onClick={handleLogout}
              />
            </Tooltip>
          </VStack>
        ) : (
          <VStack spacing={3.5} align="stretch">
            <Flex align="center" gap={3}>
              <Avatar
                size="md"
                name={currentUser?.fullName || currentUser?.username || "CS"}
                bg="blue.500"
                color="white"
              />
              <Box overflow="hidden" flex={1}>
                <Text fontSize="sm" fontWeight="extrabold" noOfLines={1} color={textColor}>
                  {currentUser?.fullName || currentUser?.username || "Customer Service"}
                </Text>
                <HStack spacing={1.5} mt={1}>
                  <Badge colorScheme="blue" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                    {currentUser?.displayRole || currentUser?.jobTitle || "CS Officer"}
                  </Badge>
                  <Text fontSize="2xs" color="green.500" fontWeight="bold">
                    🟢 Online
                  </Text>
                </HStack>
              </Box>
            </Flex>

            <Text fontSize="xs" color={userMetaColor} noOfLines={1} px={0.5}>
              {currentUser?.email || "customer.service@tradethiopia.com"}
            </Text>

            <VStack spacing={2} pt={1}>
              <Button
                as={RouterLink}
                to="/employee-info"
                size="sm"
                variant="outline"
                colorScheme="blue"
                w="100%"
                h="36px"
                leftIcon={<FiUser />}
                borderRadius="xl"
                fontSize="xs"
                fontWeight="bold"
              >
                My Profile
              </Button>
              <Button
                size="sm"
                variant="solid"
                colorScheme="red"
                w="100%"
                h="36px"
                leftIcon={<FiLogOut />}
                onClick={handleLogout}
                borderRadius="xl"
                fontSize="xs"
                fontWeight="bold"
              >
                Sign Out
              </Button>
            </VStack>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

const SidebarGroup = ({ title, isCollapsed, isOpen, onToggle, children }) => (
  <Box w="100%">
    {!isCollapsed && (
      <Button
        onClick={onToggle}
        variant="ghost"
        size="xs"
        w="100%"
        justifyContent="space-between"
        px={2.5}
        py={1.5}
        color="gray.400"
        fontSize="2xs"
        fontWeight="800"
        textTransform="uppercase"
        letterSpacing="0.8px"
        _hover={{ bg: "transparent", color: "blue.500" }}
        rightIcon={isOpen ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
      >
        {title}
      </Button>
    )}
    <Collapse in={isCollapsed || isOpen} animateOpacity>
      <VStack align="stretch" spacing={1} pt={isCollapsed ? 0 : 0.5}>
        {children}
      </VStack>
    </Collapse>
  </Box>
);

const SidebarLink = ({
  isCollapsed,
  to,
  icon,
  label,
  active,
  iconColor,
  activeIconColor,
  textColor,
  activeTextColor,
  unreadCount = 0,
  onClick,
}) => (
  <Tooltip label={label} isDisabled={!isCollapsed} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: "none" }}
      aria-label={label}
      onClick={onClick}
      w="100%"
      display="block"
    >
      <HStack
        align="center"
        px={2.5}
        py={2}
        w="100%"
        justify={isCollapsed ? "center" : "flex-start"}
        borderRadius="lg"
        bg={active ? "blue.50" : "transparent"}
        border="1px solid"
        borderColor={active ? "blue.200" : "transparent"}
        _dark={{
          bg: active ? "rgba(59, 130, 246, 0.15)" : "transparent",
          borderColor: active ? "rgba(59, 130, 246, 0.3)" : "transparent",
        }}
        _hover={{
          bg: active ? "blue.50" : "rgba(37, 99, 235, 0.05)",
          transform: "translateX(2px)",
        }}
        transition="all 0.15s ease"
        position="relative"
        spacing={2.5}
      >
        <Box color={active ? activeIconColor : iconColor} fontSize="16px">
          {icon}
        </Box>
        {!isCollapsed && (
          <Flex justify="space-between" align="center" flex={1}>
            <Text
              whiteSpace="nowrap"
              fontSize="xs"
              fontWeight={active ? "bold" : "medium"}
              color={active ? activeTextColor : textColor}
            >
              {label}
            </Text>
            {unreadCount > 0 && label === "Notice Board" && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                fontSize="2xs"
                px={1.5}
                py={0.5}
              >
                {unreadCount}
              </Badge>
            )}
          </Flex>
        )}
      </HStack>
    </Link>
  </Tooltip>
);

export default SSidebar;
