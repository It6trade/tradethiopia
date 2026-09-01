import { useState, useRef, useEffect } from "react";
import {
  Avatar,
  Badge,
  Box,
  Collapse,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
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
  FiClipboard,
  FiGlobe,
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiSettings,
  FiTool,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
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
  const isRequestsActive = activeSection === "requests" || (
    isActive("/Cdashboard") && new URLSearchParams(location.search).get("section") === "requests"
  );
  const isItRequestsActive = activeSection === "it-requests";

  // HR Color tokens (#1a2e22 dark forest green theme)
  const sidebarBg = "#1a2e22";
  const textColor = "rgba(255, 255, 255, 0.65)";
  const headingColor = "#ffffff";
  const subtextColor = "rgba(255, 255, 255, 0.40)";
  const iconColor = "rgba(255, 255, 255, 0.65)";
  const sidebarBorderColor = "rgba(255, 255, 255, 0.08)";
  // Active item styles (HR Emerald #2d6a4f)
  const activeBg = "#2d6a4f";
  const activeTextColor = "#ffffff";
  const activeIconColor = "#ffffff";

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
      boxShadow="4px 0 20px rgba(0, 0, 0, 0.2)"
    >
      {/* 1. Brand Header */}
      <Flex
        justify={isCollapsed ? "center" : "space-between"}
        align="center"
        px={isCollapsed ? 2 : 4}
        py={3.5}
        flexShrink={0}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.06)"
      >
        <HStack spacing={3} align="center">
          {/* Circular HR Emerald Brand Logo */}
          <Flex
            boxSize={isCollapsed ? "38px" : "36px"}
            borderRadius="full"
            bg="#2d6a4f"
            border="2px solid"
            borderColor="#52b788"
            color="#ffffff"
            align="center"
            justify="center"
            fontWeight="800"
            fontSize="lg"
            position="relative"
            boxShadow="0 0 12px rgba(45, 106, 79, 0.35)"
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
              bg="#52b788"
              boxShadow="0 0 6px #52b788"
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
            color="rgba(255, 255, 255, 0.5)"
            _hover={{ color: "#ffffff", bg: "rgba(255, 255, 255, 0.08)" }}
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
              color="rgba(255, 255, 255, 0.5)"
              _hover={{ color: "#ffffff", bg: "rgba(255, 255, 255, 0.08)" }}
              aria-label="Expand sidebar"
              onClick={toggleCollapse}
              borderRadius="md"
            />
          </Tooltip>
        )}
      </Flex>

      {/* 2. Scrollable Navigation List */}
      <Box
        ref={scrollBoxRef}
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        px={isCollapsed ? 1.5 : 2.5}
        py={3}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px" },
        }}
      >
        <VStack spacing={3} align="stretch">
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
              label="Overview"
              active={isDashboardActive}
              iconColor={iconColor}
              activeIconColor={activeIconColor}
              textColor={textColor}
              activeTextColor={activeTextColor}
              activeBg={activeBg}
              onClick={(e) => {
                if (typeof onSelectSection === "function") {
                  e.preventDefault();
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
                  navigate("/Cdashboard?section=notice-board");
                } else {
                  navigate("/customer/messages");
                }
                fetchUnreadCount();
              }}
            />
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/Cdashboard?section=requests"
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
                  navigate("/Cdashboard?section=requests");
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
                navigate("/Cdashboard?section=it-requests");
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
            <SidebarLink
              isCollapsed={isCollapsed}
              to="/customer/student-registration"
              icon={<FiUserPlus size={17} />}
              label="Student Registration"
              active={isActive("/customer/student-registration")}
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
                to="/customer/manager-tasks"
                icon={<FiClipboard size={17} />}
                label="Task Oversight"
                active={isActive("/customer/manager-tasks")}
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

      {/* 3. Bottom User Profile Section with Clear Logout Option */}
      <Box p={3} flexShrink={0} borderTop="1px solid" borderColor={sidebarBorderColor}>
        {isCollapsed ? (
          <VStack spacing={2} align="center">
            <Menu placement="right-end">
              <MenuButton
                as={Avatar}
                size="sm"
                src={userAvatarSrc}
                name={userDisplayName}
                bg="#2d6a4f"
                color="white"
                cursor="pointer"
                border="2px solid #52b788"
              />
              <Portal>
                <MenuList
                  zIndex="1600"
                  shadow="2xl"
                  borderRadius="xl"
                  bg="#142319"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color="#ffffff"
                >
                  <Box px={3.5} py={2}>
                    <Text fontWeight="700" fontSize="xs">{userDisplayName}</Text>
                    <Badge fontSize="9px" px={2} py={0.5} borderRadius="full" bg="rgba(45, 106, 79, 0.45)" color="#95d5b2" border="1px solid rgba(82, 183, 136, 0.3)">
                      {userRoleDisplay}
                    </Badge>
                    <Text fontSize="2xs" color="rgba(255, 255, 255, 0.5)" mt={1}>{userEmailDisplay}</Text>
                  </Box>
                  <Divider my={1} borderColor="rgba(255, 255, 255, 0.08)" />
                  <MenuItem as={RouterLink} to="/employee-info" icon={<FiUser />} bg="transparent" _hover={{ bg: "rgba(255,255,255,0.08)", color: "#95d5b2" }}>Profile</MenuItem>
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
                color="rgba(255, 255, 255, 0.6)"
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
            bg="#142319"
            _hover={{ borderColor: "rgba(82, 183, 136, 0.35)", bg: "#172b1e" }}
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
                bg="#2d6a4f"
                color="white"
                fontWeight="bold"
                border="2px solid #52b788"
                boxSize="36px"
                flexShrink={0}
              />
              <Box overflow="hidden" flex={1} textAlign="left">
                <HStack spacing={1.5} align="center">
                  <Text fontSize="12px" fontWeight="700" color="#ffffff" noOfLines={1} lineHeight="1.2">
                    {userDisplayName}
                  </Text>
                  <Badge
                    fontSize="9px"
                    px={2}
                    py={0.2}
                    borderRadius="full"
                    bg="rgba(45, 106, 79, 0.45)"
                    color="#95d5b2"
                    fontWeight="700"
                    border="1px solid rgba(82, 183, 136, 0.3)"
                    textTransform="none"
                  >
                    {userRoleDisplay}
                  </Badge>
                </HStack>
                <Text fontSize="10px" color="rgba(255, 255, 255, 0.45)" noOfLines={1} mt={0.5}>
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
                color="rgba(255, 255, 255, 0.55)"
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
        color="rgba(255, 255, 255, 0.35)"
        fontSize="10px"
        fontWeight="800"
        textTransform="uppercase"
        letterSpacing="0.8px"
        _hover={{ color: "rgba(255, 255, 255, 0.65)" }}
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
        border={active ? "1px solid rgba(82, 183, 136, 0.3)" : "1px solid transparent"}
        boxShadow={active ? "0 2px 8px rgba(45, 106, 79, 0.3)" : "none"}
        _hover={{
          bg: active ? activeBg : "rgba(255, 255, 255, 0.08)",
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
