import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Kbd,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Spacer,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiChevronDown,
  FiClipboard,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiMoon,
  FiSearch,
  FiSettings,
  FiSun,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/user";
import NotesLauncher from "../notes/NotesLauncher";
import ChatLauncher from "../chat/ChatLauncher";
import NotificationBall from "../notifications/NotificationBall";

const normalizeRoleValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isCustomerSuccessManagerRole = (role) =>
  normalizeRoleValue(role) === "customersuccessmanager";

const Cnavbar = ({ onToggleSidebar, activeSectionTitle = "Overview" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For mobile drawer
  const { colorMode, toggleColorMode } = useColorMode();
  const [dateRange, setDateRange] = useState("This month");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  // Design tokens matching screenshot
  const navbarBg = useColorModeValue("#ffffff", "#0b1329");
  const borderColor = useColorModeValue("#e2e8f0", "#1e293b");
  const textPrimary = useColorModeValue("#0f172a", "#f8fafc");
  const textSecondary = useColorModeValue("#64748b", "#94a3b8");
  const searchBg = useColorModeValue("#f8fafc", "#0f172a");
  const searchBorder = useColorModeValue("#e2e8f0", "#1e293b");

  const isCSM = (() => {
    try {
      const rawUser =
        localStorage.getItem("user") ||
        localStorage.getItem("userInfo") ||
        localStorage.getItem("userData");
      const roleField = rawUser
        ? (() => {
            const parsed = typeof rawUser === "string" ? JSON.parse(rawUser) : rawUser;
            return (
              parsed?.role ||
              parsed?.user?.role ||
              parsed?.userRole ||
              parsed?.user?.userRole ||
              parsed?.roleName
            );
          })()
        : null;
      const roles = Array.isArray(roleField)
        ? [...roleField, localStorage.getItem("userRole"), currentUser?.role, currentUser?.displayRole]
        : [roleField, localStorage.getItem("userRole"), currentUser?.role, currentUser?.displayRole];
      return roles.some(isCustomerSuccessManagerRole);
    } catch (err) {
      return isCustomerSuccessManagerRole(currentUser?.role || currentUser?.displayRole);
    }
  })();

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  // Compute breadcrumb text
  const getBreadcrumbTitle = () => {
    if (activeSectionTitle && activeSectionTitle !== "dashboard") {
      return activeSectionTitle.charAt(0).toUpperCase() + activeSectionTitle.slice(1);
    }
    const path = location.pathname.toLowerCase();
    if (path.includes("b2b")) return "B2B Marketplace";
    if (path.includes("customerfollowup")) return "Customer Follow-up";
    if (path.includes("messages")) return "Notice Board";
    if (path.includes("requests")) return "Requests";
    if (path.includes("training")) return "Training Academy";
    if (path.includes("customerreport")) return "Executive Report";
    if (path.includes("kpi")) return "KPI Dashboard";
    if (path.includes("followup-report")) return "Follow-up Report";
    if (path.includes("customer-settings")) return "Settings";
    if (path.includes("customer-user-management")) return "User Management";
    return "Overview";
  };

  // Real user profile details
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
    <>
      <Box
        bg={navbarBg}
        px={{ base: 3, md: 6 }}
        py={2.5}
        borderBottom="1px solid"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex="900"
        transition="background 0.2s ease"
      >
        <Flex alignItems="center" justify="space-between" gap={3}>
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <HStack spacing={3} align="center" minW={{ base: "auto", md: "260px" }}>
            <IconButton
              icon={<FiMenu size={18} />}
              aria-label="Open Menu"
              variant="ghost"
              size="sm"
              color={textPrimary}
              display={{ base: "inline-flex", md: "none" }}
              onClick={onToggleSidebar || onOpen}
            />

            <HStack spacing={2} fontSize="sm" display={{ base: "none", sm: "flex" }}>
              <Text color={textSecondary} fontWeight="500">
                Customer Success
              </Text>
              <Text color="gray.300">/</Text>
              <Text color={textPrimary} fontWeight="700">
                {getBreadcrumbTitle()}
              </Text>
            </HStack>
          </HStack>

          {/* Center/Right: Universal Search Input */}
          <Box flex="1" maxW={{ base: "100%", md: "420px" }} mx={{ base: 1, md: 4 }}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" boxSize={3.5} />
              </InputLeftElement>
              <Input
                placeholder="Search customers, packages, follow-ups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={searchBg}
                border="1px solid"
                borderColor={searchBorder}
                borderRadius="lg"
                fontSize="xs"
                _placeholder={{ color: "gray.400" }}
                _focus={{
                  borderColor: "teal.400",
                  bg: useColorModeValue("#ffffff", "#1e293b"),
                  boxShadow: "0 0 0 1px #0d9488",
                }}
              />
              <InputRightElement width="32px">
                <Kbd
                  fontSize="10px"
                  bg={useColorModeValue("gray.100", "gray.700")}
                  color="gray.500"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  borderRadius="sm"
                  px={1.5}
                >
                  /
                </Kbd>
              </InputRightElement>
            </InputGroup>
          </Box>

          {/* Right: Date Range Selector + Quick Actions + User Profile */}
          <HStack spacing={{ base: 1.5, md: 3 }} align="center" flexShrink={0}>
            {/* Date Range Selector Dropdown */}
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                borderColor={borderColor}
                borderRadius="lg"
                bg={useColorModeValue("#ffffff", "#0f172a")}
                color={textPrimary}
                fontSize="xs"
                fontWeight="600"
                leftIcon={<Icon as={FiCalendar} color="gray.500" boxSize={3.5} />}
                rightIcon={<Icon as={FiChevronDown} color="gray.400" boxSize={3} />}
                px={3}
                h="32px"
                _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}
                display={{ base: "none", md: "inline-flex" }}
              >
                {dateRange}
              </MenuButton>
              <Portal>
                <MenuList zIndex="1600" shadow="lg" borderRadius="xl" fontSize="xs" minW="160px">
                  {["Today", "This week", "This month", "Last 6 months", "This year"].map((item) => (
                    <MenuItem
                      key={item}
                      onClick={() => setDateRange(item)}
                      fontWeight={dateRange === item ? "bold" : "normal"}
                      color={dateRange === item ? "teal.600" : textPrimary}
                    >
                      {item}
                    </MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>

            {/* Quick Chat Launcher */}
            <ChatLauncher
              icon={<FiMessageSquare size={16} />}
              iconButtonProps={{
                size: "sm",
                variant: "ghost",
                color: textSecondary,
                borderRadius: "lg",
                _hover: { color: "teal.600", bg: "teal.50" },
              }}
            />

            {/* Quick Notes Launcher */}
            <NotesLauncher
              buttonProps={{
                size: "sm",
                variant: "ghost",
                color: textSecondary,
                borderRadius: "lg",
                _hover: { color: "teal.600", bg: "teal.50" },
                icon: <FiFileText size={16} />,
                "aria-label": "Notes",
              }}
              tooltipLabel="Scratchpad & Notes"
            />

            {/* Notification Bell with Badge Count */}
            <Box position="relative">
              <NotificationBall iconColor={textSecondary} />
            </Box>

            {/* Help Button */}
            <Tooltip label="Support & Help Center" hasArrow placement="bottom">
              <IconButton
                aria-label="Help"
                icon={<Icon as={FiHelpCircle} boxSize={4} />}
                size="sm"
                variant="ghost"
                color={textSecondary}
                borderRadius="full"
                _hover={{ color: "teal.600", bg: "teal.50" }}
              />
            </Tooltip>

            {/* Dark / Light Toggle */}
            <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`} hasArrow placement="bottom">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <FiMoon size={15} /> : <FiSun size={15} />}
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
                color={textSecondary}
                borderRadius="full"
                _hover={{ color: "teal.600", bg: "teal.50" }}
              />
            </Tooltip>

            {/* User Circular Avatar */}
            <Menu placement="bottom-end">
              <MenuButton
                as={Flex}
                align="center"
                justify="center"
                cursor="pointer"
                borderRadius="full"
                p={0.5}
                _hover={{ opacity: 0.85 }}
              >
                <Avatar
                  size="sm"
                  src={userAvatarSrc}
                  name={userDisplayName}
                  bg="#0d9488"
                  color="white"
                  fontWeight="bold"
                  boxSize="34px"
                  border="2px solid rgba(13, 148, 136, 0.4)"
                />
              </MenuButton>
              <Portal>
                <MenuList zIndex="1600" shadow="xl" borderRadius="xl" borderColor={borderColor} py={1}>
                  <Box px={3.5} py={2.5}>
                    <HStack spacing={2} align="center" mb={1}>
                      <Text fontWeight="700" fontSize="xs" color={textPrimary}>
                        {userDisplayName}
                      </Text>
                      <Badge
                        fontSize="9px"
                        px={1.5}
                        py={0.2}
                        borderRadius="full"
                        bg="teal.50"
                        color="teal.700"
                        fontWeight="700"
                      >
                        {userRoleDisplay}
                      </Badge>
                    </HStack>
                    <Text fontSize="2xs" color="gray.500">
                      {userEmailDisplay}
                    </Text>
                  </Box>
                  <MenuDivider />
                  <MenuItem as={RouterLink} to="/employee-info" icon={<FiUser size={14} />} fontSize="xs">
                    My Profile
                  </MenuItem>
                  <MenuItem as={RouterLink} to="/customer-settings" icon={<FiSettings size={14} />} fontSize="xs">
                    Account Settings
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color="red.500" icon={<FiLogOut size={14} />} fontSize="xs">
                    Sign out
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={navbarBg}>
          <DrawerCloseButton />
          <DrawerBody p={4} mt={6}>
            <VStack align="stretch" spacing={2}>
              {[
                { to: "/Cdashboard", icon: <FiHome />, label: "Dashboard" },
                { to: "/b2b-dashboard", icon: <FiGlobe />, label: "B2B Marketplace" },
                { to: "/customerfollowup", icon: <FiUsers />, label: "Customer Follow-up" },
                { to: "/customer/messages", icon: <FiMessageSquare />, label: "Notice Board" },
                { to: "/requests", icon: <FiClipboard />, label: "Internal Requests" },
                { to: "/training", icon: <FiBookOpen />, label: "Training Academy" },
                ...(isCSM
                  ? [
                      { to: "/customerreport", icon: <FiFileText />, label: "Executive Report" },
                      { to: "/customer/kpi", icon: <FiFileText />, label: "KPI Dashboard" },
                      { to: "/followup-report", icon: <FiFileText />, label: "Follow-up Report" },
                      { to: "/customer-settings", icon: <FiSettings />, label: "Service Settings" },
                      { to: "/customer-user-management", icon: <FiUsers />, label: "User Management" },
                    ]
                  : []),
              ].map(({ to, icon, label }) => (
                <Button
                  key={label}
                  as={RouterLink}
                  to={to}
                  leftIcon={icon}
                  variant="ghost"
                  justifyContent="flex-start"
                  size="sm"
                  onClick={onClose}
                  borderRadius="lg"
                  fontSize="xs"
                >
                  {label}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Cnavbar;

