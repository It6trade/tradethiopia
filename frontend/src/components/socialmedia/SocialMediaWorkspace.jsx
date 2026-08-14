import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  BellIcon,
  ChevronDownIcon,
  HamburgerIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
} from "@chakra-ui/icons";
import {
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiClipboard,
  FiEdit3,
  FiGrid,
  FiLogOut,
  FiMail,
  FiPackage,
  FiPower,
  FiShield,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiTarget,
  FiTrendingUp,
  FiLayers,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "../../store/user";

import AssetList from "../AssetList";
import NotesLauncher from "../notes/NotesLauncher";
import RequestPage from "../../pages/RequestPage";
import ContentTrackerPage from "../../pages/sales/agent/components/ContentTrackerPage";
import SocialMediaManager from "./SocialMediaManager";
import SocialMediaAccountsManager from "./SocialMediaAccountsManager";
import SocialMediaActivationsManager from "./SocialMediaActivationsManager";
import SocialMediaAccountSummary from "./SocialMediaAccountSummary";
import { EmptyStateBlock, SectionIntro, SurfaceCard } from "./SocialMediaPrimitives";

const navGroups = [
  {
    label: "Overview",
    key: "overview",
    icon: FiGrid,
    isExpandable: false,
    items: [
      { key: "dashboard", label: "Dashboard", icon: FiGrid },
    ],
  },
  {
    label: "Publishing",
    key: "publishing",
    icon: FiLayers,
    isExpandable: true,
    items: [
      { key: "postTracker", label: "Post Tracker", icon: FiEdit3 },
      { key: "planner", label: "Content Planner", icon: FiCalendar },
      { key: "assets", label: "Asset Library", icon: FiPackage },
      { key: "targets", label: "Weekly Targets", icon: FiTarget },
    ],
  },
  {
    label: "Accounts & Sync",
    key: "accountsSync",
    icon: FiShield,
    isExpandable: true,
    items: [
      { key: "accounts", label: "Social Accounts", icon: FiShield },
      { key: "integrations", label: "Integrations", icon: FiLayers },
      { key: "email", label: "Email Accounts", icon: FiMail },
      { key: "accountSummary", label: "Account Summary", icon: FiUsers },
      { key: "activations", label: "Activations", icon: FiPower },
    ],
  },
  {
    label: "Analytics",
    key: "analyticsGroup",
    icon: FiTrendingUp,
    isExpandable: true,
    items: [
      { key: "analytics", label: "Analytics", icon: FiTrendingUp },
      { key: "reports", label: "Reports Archive", icon: FiFileText },
    ],
  },
  {
    label: "Collaboration",
    key: "collaboration",
    icon: FiClipboard,
    isExpandable: false,
    items: [
      { key: "requests", label: "Requests", icon: FiClipboard },
    ],
  },
];

const socialPostPlatforms = ["Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Telegram", "Twitter (X)", "Google"];

const sectionMeta = {
  dashboard: {
    eyebrow: "Overview",
    title: "",
  },
  targets: {
    eyebrow: "Publishing",
    title: "Weekly Targets",
  },
  planner: {
    eyebrow: "Publishing",
    title: "Content Planner",
  },
  assets: {
    eyebrow: "Publishing",
    title: "Asset library",
  },
  postTracker: {
    eyebrow: "Publishing",
    title: "Post tracker",
  },
  integrations: {
    eyebrow: "Accounts & Sync",
    title: "Social Channel Integrations",
  },
  accounts: {
    eyebrow: "Accounts & Sync",
    title: "Social media accounts",
  },
  email: {
    eyebrow: "Accounts & Sync",
    title: "Email accounts",
  },
  accountSummary: {
    eyebrow: "Accounts & Sync",
    title: "Account",
  },
  activations: {
    eyebrow: "Accounts & Sync",
    title: "Account activations",
  },
  analytics: {
    eyebrow: "Analytics",
    title: "Analytics Dashboard",
  },
  reports: {
    eyebrow: "Analytics",
    title: "Reports Archive",
  },
  requests: {
    eyebrow: "Collaboration",
    title: "Request center",
  },
};

const bottomNavItems = [
  { label: "Dashboard", icon: FiGrid, key: "dashboard" },
  { label: "Targets", icon: FiTarget, key: "targets" },
  { label: "Planner", icon: FiCalendar, key: "planner" },
  { label: "Accounts", icon: FiShield, key: "accounts" },
  { label: "More", icon: HamburgerIcon, key: "more" },
];

const utilityButtonProps = {
  variant: "ghost",
  borderRadius: "10px",
  borderWidth: "1px",
  borderColor: "transparent",
  transition: "background 0.15s ease, border-color 0.15s ease",
  _hover: { bg: "rgba(248,250,252,0.95)", borderColor: "rgba(203,213,225,0.75)" },
  _dark: { _hover: { bg: "whiteAlpha.100", borderColor: "whiteAlpha.100" } },
  _focusVisible: { boxShadow: "0 0 0 2px rgba(37,99,235,0.2)" },
};

function SidebarNav({
  activeSection,
  onSelect,
  currentUser,
  collapsed,
  onToggleCollapse,
  onClose,
  colorMode,
  toggleColorMode,
  onLogout,
}) {
  const sidebarBg = "linear-gradient(180deg, #050505 0%, #0A0A0A 54%, #111827 100%)";
  const borderColor = "rgba(255,255,255,0.08)";
  const muted = "rgba(255,255,255,0.56)";
  const titleColor = "white";
  const activeBg = "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.78))";
  const activeText = "white";
  const hoverBg = "rgba(255,255,255,0.08)";
  const collapsedLogoBg = "rgba(37,99,235,0.18)";
  const collapsedLogoColor = "#93C5FD";
  const sidebarButtonProps = {
    variant: "ghost",
    borderRadius: "10px",
    borderWidth: "1px",
    borderColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.82)",
    bg: "rgba(255,255,255,0.04)",
    transition: "background 0.15s ease, border-color 0.15s ease",
    _hover: { bg: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.16)" },
    _focusVisible: { boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" },
  };

  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    navGroups.forEach((group) => {
      if (group.isExpandable && group.items.some((item) => item.key === activeSection)) {
        initial[group.key] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    const targetGroup = navGroups.find(
      (group) => group.isExpandable && group.items.some((item) => item.key === activeSection)
    );
    if (targetGroup) {
      setExpandedGroups((prev) => ({
        ...prev,
        [targetGroup.key]: true,
      }));
    }
  }, [activeSection]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <Flex
      direction="column"
      h="100%"
      bg={sidebarBg}
      backdropFilter="blur(24px) saturate(1.2)"
      borderRightWidth="1px"
      borderColor={borderColor}
      px={collapsed ? 2.5 : 4}
      py={4}
      boxShadow="12px 0 36px rgba(0,0,0,0.2)"
    >
      <VStack align="stretch" spacing={4} flex="1" minH={0} overflow="hidden">
        <HStack justify="space-between">
          {!collapsed ? (
            <Box>
              <Text fontSize="sm" fontWeight="800" letterSpacing="-0.01em" color={titleColor}>
                Social Media Portal
              </Text>
            </Box>
          ) : (
            <Flex w="32px" h="32px" align="center" justify="center" borderRadius="10px" bg={collapsedLogoBg} color={collapsedLogoColor} boxShadow="inset 0 1px 0 rgba(255,255,255,0.08)">
              <Icon as={FiGrid} boxSize={4} />
            </Flex>
          )}

          <HStack spacing={1}>
            {onClose ? (
              <IconButton size="sm" aria-label="Close sidebar" icon={<ChevronDownIcon transform="rotate(90deg)" />} onClick={onClose} {...sidebarButtonProps} />
            ) : null}
            {!onClose ? (
              <IconButton
                size="sm"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                onClick={onToggleCollapse}
                {...sidebarButtonProps}
              />
            ) : null}
          </HStack>
        </HStack>

        <Box
          borderRadius="12px"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.08)"
          bg="rgba(255,255,255,0.05)"
          boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.12)"
        >
          <Box p={collapsed ? 2 : 3}>
            <HStack spacing={2.5} align="center" justify={collapsed ? "center" : "flex-start"}>
              <Avatar size="xs" name={currentUser?.username || currentUser?.email || "Social Media"} bg="#2563EB" color="white" />
              {!collapsed ? (
                <Box minW={0}>
                  <Text fontSize="xs" fontWeight="700" color="white" noOfLines={1}>
                    {currentUser?.username || currentUser?.email || "Manager"}
                  </Text>
                  <Text fontSize="10px" color={muted} noOfLines={1}>
                    {currentUser?.department || "Social"} · {currentUser?.displayRole || "Manager"}
                  </Text>
                </Box>
              ) : null}
            </HStack>
          </Box>
        </Box>

        <VStack
          as="nav"
          aria-label="Social dashboard navigation"
          align="stretch"
          spacing={3}
          flex="1"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' }
          }}
        >
          {navGroups.map((group) => {
            const isAnyChildActive = group.items.some((item) => item.key === activeSection);
            const isExpanded = !!expandedGroups[group.key];

            if (collapsed) {
              if (!group.isExpandable) {
                return (
                  <Box key={group.key}>
                    <VStack align="stretch" spacing={1}>
                      {group.items.map((item) => {
                        const isActive = activeSection === item.key;
                        return (
                          <Tooltip key={item.key} label={item.label} placement="right" hasArrow>
                            <IconButton
                              aria-label={item.label}
                              icon={<Icon as={item.icon} boxSize={4} />}
                              variant="ghost"
                              h="38px"
                              w="38px"
                              borderRadius="10px"
                              bg={isActive ? activeBg : "transparent"}
                              color={isActive ? activeText : "rgba(255,255,255,0.78)"}
                              borderWidth="1px"
                              borderColor={isActive ? "rgba(147,197,253,0.2)" : "transparent"}
                              boxShadow={isActive ? "0 4px 12px rgba(37,99,235,0.18)" : "none"}
                              _hover={{ bg: isActive ? activeBg : hoverBg, color: "white" }}
                              _focusVisible={{ boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" }}
                              transition="all 0.15s ease"
                              onClick={() => onSelect(item.key)}
                            />
                          </Tooltip>
                        );
                      })}
                    </VStack>
                  </Box>
                );
              } else {
                return (
                  <Box key={group.key} align="center">
                    <Tooltip label={group.label} placement="right" hasArrow>
                      <Box>
                        <Menu placement="right-start" offset={[0, 12]}>
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={group.icon} boxSize={4} />}
                            variant="ghost"
                            h="38px"
                            w="38px"
                            borderRadius="10px"
                            bg={isAnyChildActive ? activeBg : "transparent"}
                            color={isAnyChildActive ? activeText : "rgba(255,255,255,0.78)"}
                            borderWidth="1px"
                            borderColor={isAnyChildActive ? "rgba(147,197,253,0.2)" : "transparent"}
                            boxShadow={isAnyChildActive ? "0 4px 12px rgba(37,99,235,0.18)" : "none"}
                            _hover={{ bg: isAnyChildActive ? activeBg : hoverBg, color: "white" }}
                            _focusVisible={{ boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" }}
                            transition="all 0.15s ease"
                            aria-label={group.label}
                          />
                          <Portal>
                            <MenuList
                              bg="#0F172A"
                              borderColor="rgba(255,255,255,0.08)"
                              boxShadow="0 10px 30px rgba(0,0,0,0.5)"
                              py={1.5}
                            >
                              <Text px={3} py={1} fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" fontWeight="800" color="rgba(255,255,255,0.4)">
                                {group.label}
                              </Text>
                              {group.items.map((item) => {
                                const isActive = activeSection === item.key;
                                return (
                                  <MenuItem
                                    key={item.key}
                                    onClick={() => onSelect(item.key)}
                                    bg={isActive ? "rgba(37,99,235,0.15)" : "transparent"}
                                    color={isActive ? "#60A5FA" : "rgba(255,255,255,0.8)"}
                                    _hover={{ bg: "rgba(255,255,255,0.06)", color: "white" }}
                                    fontSize="xs"
                                    fontWeight="600"
                                    icon={<Icon as={item.icon} boxSize={3.5} />}
                                  >
                                    {item.label}
                                  </MenuItem>
                                );
                              })}
                            </MenuList>
                          </Portal>
                        </Menu>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              }
            } else {
              if (!group.isExpandable) {
                return (
                  <Box key={group.key}>
                    <Text px={2} mb={1.5} fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" fontWeight="700" color={muted}>
                      {group.label}
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      {group.items.map((item) => {
                        const isActive = activeSection === item.key;
                        return (
                          <Button
                            key={item.key}
                            justifyContent="space-between"
                            leftIcon={<Icon as={item.icon} boxSize={4} />}
                            variant="ghost"
                            h="38px"
                            px={2.5}
                            borderRadius="10px"
                            bg={isActive ? activeBg : "transparent"}
                            color={isActive ? activeText : "rgba(255,255,255,0.82)"}
                            borderWidth="1px"
                            borderColor={isActive ? "rgba(147,197,253,0.2)" : "transparent"}
                            boxShadow={isActive ? "0 4px 12px rgba(37,99,235,0.18)" : "none"}
                            _hover={{ bg: isActive ? activeBg : hoverBg, color: "white" }}
                            _focusVisible={{ boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" }}
                            transition="all 0.15s ease"
                            onClick={() => onSelect(item.key)}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Flex align="center" flex="1" minW={0}>
                              <Text fontSize="xs" fontWeight="600" noOfLines={1}>
                                {item.label}
                              </Text>
                            </Flex>
                            {item.key === "requests" ? (
                              <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={1.5} fontSize="9px">
                                1
                              </Badge>
                            ) : null}
                          </Button>
                        );
                      })}
                    </VStack>
                  </Box>
                );
              } else {
                return (
                  <Box key={group.key}>
                    <Button
                      justifyContent="space-between"
                      leftIcon={<Icon as={group.icon} boxSize={4} />}
                      rightIcon={<Icon as={isExpanded ? FiChevronDown : FiChevronRight} boxSize={3.5} />}
                      variant="ghost"
                      h="38px"
                      px={2.5}
                      borderRadius="10px"
                      bg="transparent"
                      color={isAnyChildActive ? "white" : "rgba(255,255,255,0.78)"}
                      borderWidth="1px"
                      borderColor={isAnyChildActive ? "rgba(59,130,246,0.2)" : "transparent"}
                      _hover={{ bg: hoverBg, color: "white" }}
                      _focusVisible={{ boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" }}
                      transition="all 0.15s ease"
                      onClick={() => toggleGroup(group.key)}
                      w="100%"
                    >
                      <Flex align="center" flex="1" minW={0}>
                        <Text fontSize="xs" fontWeight="700" noOfLines={1}>
                          {group.label}
                        </Text>
                      </Flex>
                    </Button>
                    {isExpanded && (
                      <VStack
                        align="stretch"
                        spacing={1}
                        mt={1}
                        ml={3.5}
                        pl={3.5}
                        borderLeft="1px solid"
                        borderColor={isAnyChildActive ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}
                        transition="border-color 0.2s ease"
                      >
                        {group.items.map((item) => {
                          const isActive = activeSection === item.key;
                          return (
                            <Button
                              key={item.key}
                              justifyContent="space-between"
                              leftIcon={<Icon as={item.icon} boxSize={3.5} />}
                              variant="ghost"
                              h="34px"
                              px={2.5}
                              borderRadius="8px"
                              bg={isActive ? activeBg : "transparent"}
                              color={isActive ? activeText : "rgba(255,255,255,0.68)"}
                              borderWidth="1px"
                              borderColor={isActive ? "rgba(147,197,253,0.15)" : "transparent"}
                              boxShadow={isActive ? "0 3px 8px rgba(37,99,235,0.14)" : "none"}
                              _hover={{ bg: isActive ? activeBg : hoverBg, color: "white" }}
                              _focusVisible={{ boxShadow: "0 0 0 2px rgba(59,130,246,0.2)" }}
                              transition="all 0.15s ease"
                              onClick={() => onSelect(item.key)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <Flex align="center" flex="1" minW={0}>
                                <Text fontSize="xs" fontWeight="500" noOfLines={1}>
                                  {item.label}
                                </Text>
                              </Flex>
                            </Button>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                );
              }
            }
          })}
        </VStack>
      </VStack>

      <Box pt={3}>
        <Divider mb={3} borderColor={borderColor} />
        <VStack align="stretch" spacing={1.5}>
          <HStack justify={collapsed ? "center" : "flex-start"} spacing={2}>
            <Tooltip label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              <IconButton
                size="sm"
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                {...sidebarButtonProps}
              />
            </Tooltip>
            <NotesLauncher
              buttonProps={{
                ...sidebarButtonProps,
                size: "sm",
                "aria-label": "Open notes",
              }}
              tooltipLabel="Notes"
            />
          </HStack>
          {!collapsed ? (
            <>
              <Button size="sm" leftIcon={<SettingsIcon />} justifyContent="flex-start" borderRadius="10px" {...sidebarButtonProps}>
                Settings
              </Button>
              <Button
                size="sm"
                leftIcon={<Icon as={FiLogOut} />}
                justifyContent="flex-start"
                borderRadius="10px"
                color="red.200"
                bg="rgba(239,68,68,0.08)"
                borderWidth="1px"
                borderColor="rgba(239,68,68,0.14)"
                _hover={{ bg: "rgba(239,68,68,0.12)", borderColor: "rgba(248,113,113,0.2)" }}
                onClick={onLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Tooltip label="Logout" placement="right">
              <IconButton size="sm" aria-label="Logout" icon={<Icon as={FiLogOut} />} color="red.200" bg="rgba(239,68,68,0.08)" borderRadius="10px" onClick={onLogout} />
            </Tooltip>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}

export default function SocialMediaWorkspace() {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("sm_active_section") || "dashboard";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fbSuccess = searchParams.get("fb_success");
    const fbError = searchParams.get("fb_error");
    if (fbSuccess || fbError) {
      setActiveSection("integrations");
    }
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("sm_active_section", activeSection);
  }, [activeSection]);

  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const currentUser = useUserStore((state) => state.currentUser);

  const contentBg = useColorModeValue(
    "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 58%, #EEF2F7 100%)",
    "linear-gradient(180deg, #020617 0%, #0F172A 60%, #111827 100%)"
  );
  const headerBg = useColorModeValue("rgba(248,250,252,0.82)", "rgba(2,6,23,0.76)");
  const borderColor = useColorModeValue("rgba(226,232,240,0.86)", "rgba(148,163,184,0.16)");
  const searchBg = useColorModeValue("rgba(255,255,255,0.92)", "whiteAlpha.100");
  const muted = useColorModeValue("#64748B", "gray.400");
  const assetHeroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.28))"
  );
  const assetBadgeBg = useColorModeValue("rgba(37,99,235,0.08)", "whiteAlpha.100");
  const assetIconBg = useColorModeValue("rgba(37,99,235,0.1)", "rgba(37,99,235,0.26)");

  const activeBottomNavColor = useColorModeValue("#2563EB", "#60A5FA");
  const inactiveBottomNavColor = useColorModeValue("#64748B", "#A1A1AA");
  const bottomNavBg = useColorModeValue("rgba(255, 255, 255, 0.85)", "rgba(15, 23, 42, 0.85)");
  const bottomNavBorderColor = useColorModeValue("rgba(226, 232, 240, 0.8)", "rgba(148, 163, 184, 0.16)");

  const currentMeta = sectionMeta[activeSection] || sectionMeta.dashboard;

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  const renderMainContent = () => {
    if (activeSection === "assets") {
      return (
        <VStack align="stretch" spacing={4}>
          <SurfaceCard>
            <Box p={{ base: 3, md: 4 }}>
              <AssetList readOnly intangibleOnly={true} />
            </Box>
          </SurfaceCard>
        </VStack>
      );
    }

    if (activeSection === "requests") {
      return (
        <VStack align="stretch" spacing={4}>
          <RequestPage
            maxWidth="100%"
            departmentOverride="Social Media"
            backRouteOverride="/social-media"
            backLabelOverride="Social Media"
            hideBackButton
          />
        </VStack>
      );
    }

    if (activeSection === "postTracker") {
      return (
        <VStack align="stretch" spacing={4}>
          <SurfaceCard>
            <Box p={{ base: 4, md: 5 }}>
              <ContentTrackerPage title="" addButtonLabel="Add post" platformOptions={socialPostPlatforms} />
            </Box>
          </SurfaceCard>
        </VStack>
      );
    }

    if (activeSection === "accounts") {
      return (
        <VStack align="stretch" spacing={4}>
          <SocialMediaAccountsManager key="accounts-tab" />
        </VStack>
      );
    }

    if (activeSection === "integrations") {
      return (
        <VStack align="stretch" spacing={4}>
          <SocialMediaAccountsManager key="integrations-tab" showIntegrationsOnly={true} />
        </VStack>
      );
    }

    if (activeSection === "email") {
      return (
        <VStack align="stretch" spacing={4}>
          <SocialMediaAccountsManager
            emailOnly
            onSocialAccountsCreated={(_syncedAccounts, options = {}) => {
              if (!options.stayOnEmail) setActiveSection("accounts");
            }}
          />
        </VStack>
      );
    }

    if (activeSection === "accountSummary") {
      return (
        <VStack align="stretch" spacing={4}>
          <SocialMediaAccountSummary />
        </VStack>
      );
    }

    if (activeSection === "activations") {
      return (
        <VStack align="stretch" spacing={4}>
          <SocialMediaActivationsManager />
        </VStack>
      );
    }

    return (
      <VStack align="stretch" spacing={4}>
        <SocialMediaManager activeSection={activeSection} setActiveSection={setActiveSection} />
      </VStack>
    );
  };

  return (
    <Flex minH="100vh" bg={contentBg}>
      <Box
        position="sticky"
        top="0"
        h="100vh"
        display={{ base: "none", lg: "block" }}
        w={collapsed ? "76px" : "230px"}
        transition="width 0.2s ease"
        flexShrink={0}
      >
        <SidebarNav
          activeSection={activeSection}
          onSelect={setActiveSection}
          currentUser={currentUser}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          colorMode={colorMode}
          toggleColorMode={toggleColorMode}
          onLogout={handleLogout}
        />
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="full">
        <DrawerOverlay />
        <DrawerContent maxW={{ base: "86vw", sm: "320px" }}>
          <DrawerHeader p={0} />
          <DrawerBody p={0}>
            <SidebarNav
              activeSection={activeSection}
              onSelect={(key) => {
                setActiveSection(key);
                onClose();
              }}
              currentUser={currentUser}
              collapsed={false}
              onToggleCollapse={() => {}}
              onClose={onClose}
              colorMode={colorMode}
              toggleColorMode={toggleColorMode}
              onLogout={handleLogout}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box flex="1" minW={0}>
        <Flex
          as="header"
          position="sticky"
          top="0"
          zIndex="10"
          px={{ base: 3, sm: 4, md: 5 }}
          py={{ base: 2, md: 2.5 }}
          align="center"
          justify="space-between"
          bg={headerBg}
          backdropFilter="blur(22px) saturate(1.18)"
          borderBottomWidth="1px"
          borderColor={borderColor}
          boxShadow={useColorModeValue("0 1px 0 rgba(255,255,255,0.85)", "0 1px 0 rgba(255,255,255,0.04)")}
        >
          <HStack spacing={3} minW={0} flex="1" w="100%" align="center">
            <IconButton
              size="sm"
              display={{ base: "inline-flex", lg: "none" }}
              aria-label="Open sidebar"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              {...utilityButtonProps}
            />

            {/* Navbar breadcrumbs page title */}
            <HStack display={{ base: "none", sm: "flex" }} spacing={1.5} mr={4} flexShrink={0} align="center">
              <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase" letterSpacing="0.05em">
                {currentMeta.eyebrow}
              </Text>
              <Text fontSize="xs" color={muted}>
                /
              </Text>
              <Text fontSize="xs" fontWeight="800" color={useColorModeValue("#0F172A", "white")}>
                {currentMeta.title || "Dashboard"}
              </Text>
            </HStack>

            <InputGroup maxW={{ base: "none", md: "320px" }} size="sm" flex="1" minW={0}>
              <InputLeftElement pointerEvents="none" h="100%">
                <SearchIcon color={muted} boxSize={3.5} />
              </InputLeftElement>
              <Input
                placeholder="Search campaigns, metrics, or assets"
                aria-label="Global search"
                borderRadius="10px"
                h="34px"
                fontSize="xs"
                bg={searchBg}
                borderColor={borderColor}
                boxShadow="inset 0 1px 0 rgba(255,255,255,0.55)"
                _hover={{ borderColor: "rgba(37,99,235,0.2)" }}
                _focusVisible={{ boxShadow: "0 0 0 2px rgba(37,99,235,0.2)" }}
              />
            </InputGroup>
          </HStack>

          <HStack spacing={1.5} ml={{ base: 0, md: 4 }} justify={{ base: "space-between", md: "flex-end" }} w={{ base: "100%", md: "auto" }}>
            <IconButton size="sm" aria-label="Notifications" icon={<BellIcon />} {...utilityButtonProps} />
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                borderRadius="10px"
                px={1.5}
                py={0.5}
                size="sm"
                rightIcon={<ChevronDownIcon />}
                _focusVisible={{ boxShadow: "0 0 0 2px rgba(37,99,235,0.2)" }}
              >
                <HStack spacing={2}>
                  <Avatar size="2xs" name={currentUser?.username || currentUser?.email || "User"} bg="#2563EB" color="white" />
                  <Box textAlign="left" display={{ base: "none", md: "block" }}>
                    <Text fontSize="xs" fontWeight="700" noOfLines={1}>
                      {currentUser?.username || "Social Media"}
                    </Text>
                    <Text fontSize="9px" color={muted} noOfLines={1}>
                      {currentUser?.displayRole || "Manager"}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <Portal>
                <MenuList borderRadius="12px" py={1.5} boxShadow="0 8px 30px rgba(15,23,42,0.12)" borderColor={borderColor}>
                  <MenuItem fontSize="xs" icon={<SettingsIcon />}>Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem fontSize="xs" icon={<Icon as={FiLogOut} />} onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Flex>

        <Box px={{ base: 3, md: 5, xl: 6 }} py={{ base: 4, md: 5 }} pb={{ base: "90px", lg: 5 }}>
          {navGroups.some((group) => group.items.some((item) => item.key === activeSection)) ? (
            renderMainContent()
          ) : (
            <EmptyStateBlock
              title="No matching section"
              description="This section is not configured yet. Choose another area from the sidebar."
              badge="Navigation"
            />
          )}
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar */}
      <Box
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        zIndex={20}
        bg={bottomNavBg}
        backdropFilter="blur(16px) saturate(1.2)"
        borderTop="1px solid"
        borderColor={bottomNavBorderColor}
        px={2}
        pt={2}
        pb="calc(8px + env(safe-area-inset-bottom))"
        boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)"
        display={{ base: "block", lg: "none" }}
      >
        <Flex justify="space-between" align="center">
          {bottomNavItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <Box
                key={item.key}
                as="button"
                type="button"
                flex="1"
                minW={0}
                borderRadius="xl"
                py={1}
                onClick={() => {
                  if (item.key === "more") {
                    onOpen();
                  } else {
                    setActiveSection(item.key);
                  }
                }}
                color={isActive ? activeBottomNavColor : inactiveBottomNavColor}
              >
                <Flex direction="column" align="center" gap={1}>
                  <Icon as={item.icon} boxSize={5} />
                  <Text fontSize="10px" fontWeight={isActive ? "700" : "600"} noOfLines={1}>
                    {item.label}
                  </Text>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </Box>
    </Flex>
  );
}


