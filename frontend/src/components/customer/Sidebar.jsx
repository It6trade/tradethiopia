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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronUp,
  FiClipboard,
  FiGlobe,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMessageSquare,
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

  // Realistic deep navy palette
  const sidebarBg = useColorModeValue(
    "linear-gradient(180deg, #0b1728 0%, #07101e 100%)",
    "linear-gradient(180deg, #060e1a 0%, #040810 100%)"
  );
  const textColor = "#94a3b8";
  const headingColor = "#f8fafc";
  const subtextColor = "#64748b";
  const iconColor = "#94a3b8";
  const sidebarBorderColor = "rgba(255, 255, 255, 0.08)";
  const cardBorderColor = "rgba(255, 255, 255, 0.08)";
  const userCardBg = "rgba(255, 255, 255, 0.03)";

  // Active item styles (teal & electric sapphire glow on navy)
  const activeBg = "linear-gradient(90deg, rgba(13, 148, 136, 0.25) 0%, rgba(13, 148, 136, 0.08) 100%)";
  const activeTextColor = "#ffffff";
  const activeIconColor = "#2dd4bf";

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

  // Extract real user details
  const userDisplayName =
    currentUser?.fullName ||
    currentUser?.name ||
    (currentUser?.firstName && currentUser?.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : null) ||
    localStorage.getItem("userName") ||
    "Sara Alemu";

  const rawRole = (currentUser?.displayRole || currentUser?.role || localStorage.getItem("userRole") || "CS Manager")
    .toString()
    .toLowerCase();

  const userRoleDisplay = rawRole.includes("manager") || rawRole.includes("admin")
    ? "CS Manager"
    : rawRole.includes("agent") || rawRole.includes("success") || rawRole.includes("customer")
    ? "CS Specialist"
    : "Customer Success";

  const userEmailDisplay =
    currentUser?.email ||
    localStorage.getItem("userEmail") ||
    "sara.alemu@tradethiopia.com";

  const userAvatarSrc =
    currentUser?.profileImage ||
    currentUser?.avatar ||
    currentUser?.photo ||
    currentUser?.avatarUrl ||
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop";

  return (
    <Box
      as="nav"
      width="100%"
      height="100%"
      minHeight="100vh"
      maxHeight="100vh"
      position="relative"
      bg={sidebarBg}
      color={textColor}
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex="1000"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      borderRight="1px solid"
      borderColor={sidebarBorderColor}
      boxShadow="4px 0 24px rgba(0, 0, 0, 0.25)"
    >
      {/* 1. Brand Header */}
      <Flex
        justify={isCollapsed ? "center" : "space-between"}
        align="center"
        px={isCollapsed ? 2 : 4}
        py={3.5}
        flexShrink={0}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
      >
        <HStack spacing={3} align="center">
          {/* Circular Teal Brand Logo */}
          <Flex
            boxSize={isCollapsed ? "38px" : "36px"}
            borderRadius="full"
            bg="rgba(13, 148, 136, 0.12)"
            border="2px solid"
            borderColor="#14b8a6"
            color="#2dd4bf"
            align="center"
            justify="center"
            fontWeight="800"
            fontSize="lg"
            position="relative"
            boxShadow="0 0 14px rgba(20, 184, 166, 0.25)"
          >
            <Text as="span" fontFamily="system-ui" lineHeight="1" transform="translateY(-1px)">
              C
            </Text>
            <Box
              position="absolute"
              bottom="1px"
              right="1px"
              boxSize="6px"
              borderRadius="full"
              bg="#2dd4bf"
              boxShadow="0 0 6px #2dd4bf"
            />
          </Flex>

          {!isCollapsed && (
            <Box>
              <Text fontWeight="800" fontSize="md" color={headingColor} lineHeight="1.2" letterSpacing="-0.3px">
                Customer Success
              </Text>
              <Text fontSize="2xs" color={subtextColor} fontWeight="500" mt={0.5}>
                Follow-up & Engagement
              </Text>
            </Box>
          )}
        </HStack>

        {!isCollapsed ? (
          <IconButton
            icon={<FiChevronsLeft size={16} />}
            variant="ghost"
            size="xs"
            color="gray.400"
            _hover={{ color: "#2dd4bf", bg: "rgba(255, 255, 255, 0.06)" }}
            aria-label="Collapse sidebar"
            onClick={toggleCollapse}
            borderRadius="md"
          />
        ) : (
          <Tooltip label="Expand sidebar" placement="right" hasArrow>
            <IconButton
              icon={<FiChevronsRight size={16} />}
              variant="ghost"
              size="xs"
              color="gray.400"
              _hover={{ color: "#2dd4bf", bg: "rgba(255, 255, 255, 0.06)" }}
              aria-label="Expand sidebar"
              onClick={toggleCollapse}
              borderRadius="md"
            />
          </Tooltip>
        )}
      </Flex>

      {/* 2. Navigation Scrollable Body */}
      <Box
        flex="1 1 auto"
        overflowY="auto"
        minHeight={0}
        ref={scrollBoxRef}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(148, 163, 184, 0.25)", borderRadius: "4px" },
        }}
        py={1}
        px={2.5}
      >
        <VStack align="stretch" spacing={3}>
          {/* Workspace Group */}
          <SidebarGroup
            title="WORKSPACE"
            isCollapsed={isCollapsed}
            isOpen={openGroups.workspace}
            onToggle={() => toggleGroup("workspace")}
          >
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/Cdashboard"
              icon={<FiHome size={17} />}
              label="Dashboard"
              active={isDashboardActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
              onClick={() => {
                if (typeof onSelectSection === "function") {
                  onSelectSection("dashboard");
                }
              }}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/b2b-dashboard"
              icon={<FiGlobe size={17} />}
              label="B2B Marketplace"
              active={isActive("/b2b-dashboard")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customerfollowup"
              icon={<FiUsers size={17} />}
              label="Customer Follow-up"
              active={isActive("/customerfollowup")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customer/messages"
              icon={<FiMessageSquare size={17} />}
              label="Notice Board"
              active={isNoticeBoardActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
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
              icon={<FiClipboard size={17} />}
              label="Internal Requests"
              active={isRequestsActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
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
              icon={<FiTool size={17} />}
              label="IT Requests"
              active={isItRequestsActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
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
              icon={<FiBookOpen size={17} />}
              label="Training Academy"
              active={isActive("/training")}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
            />
          </SidebarGroup>

          {/* Management Group */}
          {isCSM && (
            <SidebarGroup
              title="MANAGEMENT"
              isCollapsed={isCollapsed}
              isOpen={openGroups.management}
              onToggle={() => toggleGroup("management")}
            >
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customerreport"
                icon={<FiBarChart2 size={17} />}
                label="Executive Report"
                active={isActive("/customerreport")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
                activeBg={activeBg}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer/kpi"
                icon={<FiTrendingUp size={17} />}
                label="KPI Dashboard"
                active={isActive("/customer/kpi")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
                activeBg={activeBg}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/followup-report"
                icon={<FiActivity size={17} />}
                label="Follow-up Report"
                active={isActive("/followup-report")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
                activeBg={activeBg}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer-settings"
                icon={<FiSettings size={17} />}
                label="Service Settings"
                active={isActive("/customer-settings")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
                activeBg={activeBg}
              />
              <SidebarLink
                isCollapsed={isCollapsed}
                to="/customer-user-management"
                icon={<FiUser size={17} />}
                label="User Management"
                active={isActive("/customer-user-management")}
                iconColor={iconColor}
                activeIconColor={activeIconColor}
                textColor={textColor}
                activeTextColor={activeTextColor}
                activeBg={activeBg}
              />
            </SidebarGroup>
          )}
        </VStack>
      </Box>

      {/* 4. Bottom User Profile Section with Clear Logout Option */}
      <Box p={3} flexShrink={0} borderTop="1px solid" borderColor={sidebarBorderColor}>
        {isCollapsed ? (
          <VStack spacing={2} align="center">
            <Menu placement="right-end">
              <MenuButton
                as={Avatar}
                size="sm"
                src={userAvatarSrc}
                name={userDisplayName}
                bg="#0d9488"
                color="white"
                cursor="pointer"
                border="2px solid rgba(45, 212, 191, 0.4)"
              />
              <Portal>
                <MenuList
                  zIndex="1600"
                  shadow="2xl"
                  borderRadius="xl"
                  bg="#0b1728"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="#f8fafc"
                >
                  <Box px={3.5} py={2}>
                    <Text fontWeight="700" fontSize="xs">{userDisplayName}</Text>
                    <Badge fontSize="9px" px={2} py={0.5} borderRadius="full" bg="rgba(13, 148, 136, 0.25)" color="#2dd4bf">
                      {userRoleDisplay}
                    </Badge>
                    <Text fontSize="2xs" color="#94a3b8" mt={1}>{userEmailDisplay}</Text>
                  </Box>
                  <Divider my={1} borderColor="rgba(255, 255, 255, 0.08)" />
                  <MenuItem as={RouterLink} to="/employee-info" icon={<FiUser />} bg="transparent" _hover={{ bg: "rgba(255,255,255,0.06)", color: "#2dd4bf" }}>Profile</MenuItem>
                  <MenuItem onClick={handleLogout} color="#f87171" icon={<FiLogOut />} bg="transparent" _hover={{ bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>Sign out</MenuItem>
                </MenuList>
              </Portal>
            </Menu>
            <Tooltip label="Sign out" placement="right" hasArrow>
              <IconButton
                aria-label="Sign out"
                icon={<FiLogOut size={14} />}
                size="xs"
                variant="ghost"
                color="#94a3b8"
                _hover={{ bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
                onClick={handleLogout}
                borderRadius="md"
              />
            </Tooltip>
          </VStack>
        ) : (
          <Flex
            align="center"
            justify="space-between"
            p={2}
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.08)"
            bg="rgba(255, 255, 255, 0.03)"
            _hover={{ borderColor: "rgba(45, 212, 191, 0.35)", bg: "rgba(255, 255, 255, 0.06)" }}
            transition="all 0.15s ease"
            gap={2}
          >
            {/* User Details Link to Profile */}
            <HStack
              as={RouterLink}
              to="/employee-info"
              spacing={2.5}
              overflow="hidden"
              flex={1}
              _hover={{ textDecoration: "none" }}
            >
              <Avatar
                size="sm"
                src={userAvatarSrc}
                name={userDisplayName}
                bg="#0d9488"
                color="white"
                fontWeight="bold"
                border="2px solid rgba(45, 212, 191, 0.4)"
                boxSize="36px"
                flexShrink={0}
              />
              <Box overflow="hidden" flex={1} textAlign="left">
                <HStack spacing={1.5} align="center">
                  <Text fontSize="12px" fontWeight="700" color="#f8fafc" noOfLines={1} lineHeight="1.2">
                    {userDisplayName}
                  </Text>
                  <Badge
                    fontSize="9px"
                    px={2}
                    py={0.2}
                    borderRadius="full"
                    bg="rgba(13, 148, 136, 0.22)"
                    color="#2dd4bf"
                    fontWeight="700"
                    border="1px solid rgba(45, 212, 191, 0.3)"
                    textTransform="none"
                  >
                    {userRoleDisplay}
                  </Badge>
                </HStack>
                <Text fontSize="10px" color="#94a3b8" noOfLines={1} mt={0.5}>
                  {userEmailDisplay}
                </Text>
              </Box>
            </HStack>

            {/* Clear, Dedicated Quick Logout Button */}
            <Tooltip label="Sign out" hasArrow placement="top">
              <IconButton
                aria-label="Sign out"
                icon={<FiLogOut size={15} />}
                size="sm"
                variant="ghost"
                color="#94a3b8"
                _hover={{ color: "#f87171", bg: "rgba(239, 68, 68, 0.15)" }}
                onClick={handleLogout}
                borderRadius="lg"
                flexShrink={0}
                h="32px"
                w="32px"
              />
            </Tooltip>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

const SidebarGroup = ({ title, isCollapsed, isOpen, onToggle, children }) => (
  <Box w="100%">
    {!isCollapsed && (
      <Flex
        onClick={onToggle}
        align="center"
        justify="space-between"
        px={2.5}
        py={1.5}
        cursor="pointer"
        color="#64748b"
        fontSize="10px"
        fontWeight="800"
        textTransform="uppercase"
        letterSpacing="0.8px"
        _hover={{ color: "#94a3b8" }}
        transition="color 0.15s ease"
      >
        <Text>{title}</Text>
        <Icon as={isOpen ? FiChevronDown : FiChevronRight} boxSize="12px" />
      </Flex>
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
  activeBg,
  unreadCount = 0,
  onClick,
}) => (
  <Tooltip label={label} isDisabled={!isCollapsed} placement="right" hasArrow>
    <Box
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
        px={3}
        py={2}
        w="100%"
        justify={isCollapsed ? "center" : "flex-start"}
        borderRadius="lg"
        bg={active ? activeBg : "transparent"}
        border={active ? "1px solid rgba(45, 212, 191, 0.25)" : "1px solid transparent"}
        boxShadow={active ? "0 0 16px rgba(13, 148, 136, 0.15)" : "none"}
        _hover={{
          bg: active ? activeBg : "rgba(255, 255, 255, 0.05)",
          transform: "translateX(2px)",
        }}
        transition="all 0.15s ease"
        spacing={3}
      >
        <Box color={active ? activeIconColor : iconColor} display="flex" alignItems="center">
          {icon}
        </Box>
        {!isCollapsed && (
          <Flex justify="space-between" align="center" flex={1}>
            <Text
              whiteSpace="nowrap"
              fontSize="xs"
              fontWeight={active ? "700" : "500"}
              color={active ? activeTextColor : textColor}
              letterSpacing="-0.1px"
            >
              {label}
            </Text>
            {unreadCount > 0 && label === "Notice Board" && (
              <Badge
                bg="#ef4444"
                color="white"
                borderRadius="full"
                fontSize="9px"
                px={1.5}
                py={0.2}
              >
                {unreadCount}
              </Badge>
            )}
          </Flex>
        )}
      </HStack>
    </Box>
  </Tooltip>
);

export default SSidebar;

