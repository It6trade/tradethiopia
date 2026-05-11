import React, { useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  HStack,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  MenuDivider,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
  useDisclosure,
  Link,
  Tooltip,
  useColorMode,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiBookOpen,
  FiBell,
  FiUser,
  FiFileText,
  FiGlobe,
  FiMessageSquare,
  FiClipboard,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import NotesLauncher from "../notes/NotesLauncher";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import ChatLauncher from "../chat/ChatLauncher";

const Cnavbar = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For Drawer
  const { colorMode, toggleColorMode } = useColorMode();
  const navbarBg = useColorModeValue(
    "linear-gradient(90deg, #e9f2ff, #dfe9ff, #d6e1ff)",
    "linear-gradient(90deg, #0b1224, #0f1e3a, #0b284a)"
  );
  const accentBar = useColorModeValue("linear(to-b, blue.400, purple.400)", "linear(to-b, teal.300, cyan.400)");
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "teal.100");
  const actionHoverColor = useColorModeValue("blue.600", "teal.200");
  const actionActiveBg = useColorModeValue("rgba(0,0,0,0.04)", "rgba(255,255,255,0.08)");

  const actionButtonProps = {
    size: "md",
    variant: "ghost",
    color: textPrimary,
    _hover: { color: actionHoverColor, bg: actionActiveBg },
    _active: { bg: actionActiveBg },
  };

  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

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
      const roles = Array.isArray(roleField) ? roleField : [roleField, localStorage.getItem("userRole")];
      return roles.some((role) => (role || "").toString().trim().toLowerCase() === "customersuccessmanager");
    } catch (err) {
      return false;
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

  
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <>
      <Box
        bgGradient={navbarBg}
        px={5}
        py={3}
        shadow="xl"
        borderBottom="1px solid"
        borderColor={useColorModeValue("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)")}
        zIndex="1000"
        position="relative"
      >
        <Flex alignItems="center" gap={3}>
          {/* Menu button for mobile view */}
          <IconButton
            icon={<FiMenu />}
            aria-label="Open Menu"
            variant="ghost"
            color={useColorModeValue("blue.500", "teal.200")}
            display={{ base: "block", md: "none" }} // Show only on small screens
            onClick={onOpen}
          />

          {/* Title */}
          <Flex align="center" gap={3}>
            <Box
              w="12px"
              h="36px"
              bgGradient={accentBar}
              borderRadius="full"
            />
            <Box>
              <Text fontWeight="bold" fontSize="lg" color={textPrimary}>
                Customer Success
              </Text>
              <Text fontSize="xs" color={textSecondary} letterSpacing="0.5px">
                Follow-up & Engagement
              </Text>
            </Box>
          </Flex>

          <Spacer />

           {/* Icons and Profile */}
          <HStack spacing={4} align="center">
            <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                color={useColorModeValue("blue.600", "yellow.300")}
                size="md"
                _hover={{ bg: "transparent" }}
              />
            </Tooltip>
            <HStack spacing={3} align="center">
              <ChatLauncher
                icon={<FiMessageSquare size={20} />}
                iconButtonProps={actionButtonProps}
              />
              {/* Notifications Dropdown */}
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiBell size={20} />}
                  aria-label="Notifications"
                  {...actionButtonProps}
                />
                <MenuList>
                  {notifications.length > 0 ? (
                    <>
                      {notifications.map((notification) => (
                        <MenuItem key={notification.id}>
                          <Box>
                            <Text fontWeight="bold">{notification.message}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {notification.timestamp}
                            </Text>
                          </Box>
                        </MenuItem>
                      ))}
                      <MenuDivider />
                      <MenuItem onClick={clearNotifications}>Clear All</MenuItem>
                    </>
                  ) : (
                    <MenuItem>
                      <Text>No new notifications</Text>
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>

              {/* Notes Launcher */}
              <NotesLauncher
                buttonProps={{
                  ...actionButtonProps,
                  icon: <FiFileText size={20} />,
                  "aria-label": "Notes",
                }}
                tooltipLabel="Notes"
              />

              {/* Profile Dropdown */}
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiUser size={20} />}
                  aria-label="User Profile"
                  {...actionButtonProps}
                />
                <MenuList>
                  <Box p={4}>
                    <Text fontWeight="bold" fontSize="lg">
                      {currentUser?.username || "User"}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {currentUser?.role || "Role not available"}
                    </Text>
                  </Box>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </HStack>
        </Flex>
      </Box>

      {/* Drawer for Mobile Menu (Only Navigation Links) */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack align="start" spacing={4} mt={8}>
              {[
                { to: "/Cdashboard", icon: <FiHome />, label: "Dashboard" },
                { to: "/b2b-dashboard", icon: <FiGlobe />, label: "B2B Marketplace" },
                { to: "/customerfollowup", icon: <FiUsers />, label: "Customer Followup" },
                {
                  to: "/customer/messages",
                  icon: <FiMessageSquare />,
                  label: "Notice Board",
                  badgeCount: unreadCount,
                },
                { to: "/requests", icon: <FiClipboard />, label: "Requests" },
                { to: "/training", icon: <FiBookOpen />, label: "Training" },
                ...(isCSM
                  ? [
                      { to: "/customerreport", icon: <FiBarChart2 />, label: "Reports" },
                      { to: "/followup-report", icon: <FiFileText />, label: "Follow Up Report" },
                      { to: "/customer-settings", icon: <FiSettings />, label: "Settings" },
                    ]
                  : []),
              ].map(({ to, icon, label, badgeCount }) => (
                <NavItem
                  key={label}
                  to={to}
                  icon={icon}
                  label={label}
                  badgeCount={badgeCount}
                  onClose={onClose}
                />
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Individual Nav Item Component
const NavItem = ({ to, icon, label, onClose, badgeCount = 0 }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: "none", color: "blue.500" }}
      onClick={onClose}
      style={{ width: "100%" }}
    >
      <Flex
        align="center"
        p={2}
        borderRadius="md"
        _hover={{ bg: "gray.100" }}
        position="relative"
      >
        {icon}
        <Text ml={3} whiteSpace="nowrap" fontSize="16px">
          {label}
        </Text>
        {badgeCount > 0 && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="6px"
            right="8px"
            fontSize="10px"
            w="18px"
            h="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {badgeCount}
          </Badge>
        )}
      </Flex>
    </Link>
  </Tooltip>
);

export default Cnavbar;
