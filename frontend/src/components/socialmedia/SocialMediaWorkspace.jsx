import { useState } from "react";
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
  FiClipboard,
  FiEdit3,
  FiGrid,
  FiLogOut,
  FiMail,
  FiPackage,
  FiPower,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import AssetList from "../AssetList";
import NotesLauncher from "../notes/NotesLauncher";
import RequestPage from "../../pages/RequestPage";
import ContentTrackerPage from "../sales/ContentTrackerPage";
import SocialMediaManager from "./SocialMediaManager";
import SocialMediaAccountsManager from "./SocialMediaAccountsManager";
import SocialMediaActivationsManager from "./SocialMediaActivationsManager";
import SocialMediaAccountSummary from "./SocialMediaAccountSummary";
import { EmptyStateBlock, SectionIntro, SurfaceCard } from "./SocialMediaPrimitives";

const navGroups = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: FiBarChart2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "postTracker", label: "Post Tracker", icon: FiEdit3 },
      { key: "assets", label: "Asset Library", icon: FiPackage },
      { key: "accounts", label: "Social Media", icon: FiShield },
      { key: "email", label: "Email", icon: FiMail },
      { key: "accountSummary", label: "Account", icon: FiUsers },
      { key: "activations", label: "Activations", icon: FiPower },
    ],
  },
  {
    label: "Collaboration",
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
  assets: {
    eyebrow: "Operations",
    title: "Asset library",
  },
  postTracker: {
    eyebrow: "Operations",
    title: "Post tracker",
  },
  accounts: {
    eyebrow: "Operations",
    title: "Social media accounts",
  },
  email: {
    eyebrow: "Operations",
    title: "Email accounts",
  },
  accountSummary: {
    eyebrow: "Operations",
    title: "Account",
  },
  activations: {
    eyebrow: "Operations",
    title: "Account activations",
  },
  requests: {
    eyebrow: "Collaboration",
    title: "Request center",
  },
};

const utilityButtonProps = {
  variant: "ghost",
  borderRadius: "16px",
  borderWidth: "1px",
  borderColor: "transparent",
  transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
  _hover: { bg: "rgba(248,250,252,0.95)", borderColor: "rgba(203,213,225,0.75)", transform: "translateY(-1px)" },
  _dark: { _hover: { bg: "whiteAlpha.100", borderColor: "whiteAlpha.100" } },
  _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" },
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
    borderRadius: "14px",
    borderWidth: "1px",
    borderColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.82)",
    bg: "rgba(255,255,255,0.04)",
    transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
    _hover: { bg: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.16)", transform: "translateY(-1px)" },
    _focusVisible: { boxShadow: "0 0 0 3px rgba(59,130,246,0.34)" },
  };

  return (
    <Flex
      direction="column"
      h="100%"
      bg={sidebarBg}
      backdropFilter="blur(24px) saturate(1.2)"
      borderRightWidth="1px"
      borderColor={borderColor}
      px={collapsed ? 3 : 5}
      py={5}
      boxShadow="18px 0 48px rgba(0,0,0,0.28)"
    >
      <VStack align="stretch" spacing={5} flex="1">
        <HStack justify="space-between">
          {!collapsed ? (
            <Box>
              <Text fontSize="lg" fontWeight="700" letterSpacing="0" color={titleColor}>
                Social Media Manager
              </Text>
            </Box>
          ) : (
            <Flex w="42px" h="42px" align="center" justify="center" borderRadius="16px" bg={collapsedLogoBg} color={collapsedLogoColor} boxShadow="inset 0 1px 0 rgba(255,255,255,0.08)">
              <Icon as={FiGrid} boxSize={5} />
            </Flex>
          )}

          <HStack spacing={1}>
            {onClose ? (
              <IconButton aria-label="Close sidebar" icon={<ChevronDownIcon transform="rotate(90deg)" />} onClick={onClose} {...sidebarButtonProps} />
            ) : null}
            {!onClose ? (
              <IconButton
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                onClick={onToggleCollapse}
                {...sidebarButtonProps}
              />
            ) : null}
          </HStack>
        </HStack>

        <Box
          borderRadius="18px"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.08)"
          bg="rgba(255,255,255,0.055)"
          boxShadow="inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 34px rgba(0,0,0,0.18)"
        >
          <Box p={collapsed ? 3 : 4}>
            <HStack spacing={3} align="center" justify={collapsed ? "center" : "flex-start"}>
              <Avatar size="sm" name={currentUser?.username || currentUser?.email || "Social Media"} bg="#2563EB" color="white" />
              {!collapsed ? (
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="700" color="white" noOfLines={1}>
                    {currentUser?.username || currentUser?.email || "Social Media Manager"}
                  </Text>
                  <Text fontSize="xs" color={muted} noOfLines={1}>
                    {currentUser?.department || "Social Media"} · {currentUser?.displayRole || "Manager"}
                  </Text>
                </Box>
              ) : null}
            </HStack>
          </Box>
        </Box>

        <VStack as="nav" aria-label="Social dashboard navigation" align="stretch" spacing={5} flex="1">
          {navGroups.map((group) => (
            <Box key={group.label}>
              {!collapsed ? (
                <Text px={3} mb={2} fontSize="11px" textTransform="uppercase" letterSpacing="0.12em" fontWeight="700" color={muted}>
                  {group.label}
                </Text>
              ) : null}
              <VStack align="stretch" spacing={1.5}>
                {group.items.map((item) => {
                  const isActive = activeSection === item.key;
                  const navButton = (
                    <Button
                      key={item.key}
                      justifyContent={collapsed ? "center" : "space-between"}
                      leftIcon={collapsed ? undefined : <Icon as={item.icon} boxSize={5} />}
                      variant="ghost"
                      h="46px"
                      px={collapsed ? 0 : 3}
                      borderRadius="15px"
                      bg={isActive ? activeBg : "transparent"}
                      color={isActive ? activeText : "rgba(255,255,255,0.78)"}
                      borderWidth="1px"
                      borderColor={isActive ? "rgba(147,197,253,0.32)" : "transparent"}
                      boxShadow={isActive ? "0 14px 28px rgba(37,99,235,0.26)" : "none"}
                      _hover={{ bg: isActive ? activeBg : hoverBg, color: "white", transform: "translateX(2px)" }}
                      _focusVisible={{ boxShadow: "0 0 0 3px rgba(59,130,246,0.34)" }}
                      transition="all 0.18s ease"
                      onClick={() => onSelect(item.key)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {collapsed ? (
                        <Icon as={item.icon} boxSize={5} />
                      ) : (
                        <>
                          <Flex align="center" flex="1" minW={0}>
                            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                              {item.label}
                            </Text>
                          </Flex>
                          {item.key === "requests" ? (
                            <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                              1
                            </Badge>
                          ) : null}
                        </>
                      )}
                    </Button>
                  );

                  return collapsed ? (
                    <Tooltip key={item.key} label={item.label} placement="right">
                      {navButton}
                    </Tooltip>
                  ) : (
                    navButton
                  );
                })}
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>

      <Box pt={4}>
        <Divider mb={4} borderColor={borderColor} />
        <VStack align="stretch" spacing={2}>
          <HStack justify={collapsed ? "center" : "flex-start"} spacing={2}>
            <Tooltip label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                {...sidebarButtonProps}
              />
            </Tooltip>
            <NotesLauncher
              buttonProps={{
                ...sidebarButtonProps,
                "aria-label": "Open notes",
              }}
              tooltipLabel="Notes"
            />
          </HStack>
          {!collapsed ? (
            <>
              <Button leftIcon={<SettingsIcon />} justifyContent="flex-start" borderRadius="14px" {...sidebarButtonProps}>
                Settings
              </Button>
              <Button
                leftIcon={<Icon as={FiLogOut} />}
                justifyContent="flex-start"
                borderRadius="14px"
                color="red.200"
                bg="rgba(239,68,68,0.08)"
                borderWidth="1px"
                borderColor="rgba(239,68,68,0.14)"
                _hover={{ bg: "rgba(239,68,68,0.16)", borderColor: "rgba(248,113,113,0.3)" }}
                onClick={onLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Tooltip label="Logout" placement="right">
              <IconButton aria-label="Logout" icon={<Icon as={FiLogOut} />} color="red.200" bg="rgba(239,68,68,0.08)" borderRadius="14px" onClick={onLogout} />
            </Tooltip>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}

export default function SocialMediaWorkspace() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
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

  const currentMeta = sectionMeta[activeSection] || sectionMeta.dashboard;

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  const renderMainContent = () => {
    if (activeSection === "assets") {
      return (
        <VStack align="stretch" spacing={6}>
          <SurfaceCard bgImage={assetHeroBg}>
            <Box p={{ base: 5, md: 6 }}>
              <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={5} direction={{ base: "column", md: "row" }}>
                <HStack spacing={4} align="center">
                  <Flex
                    w="56px"
                    h="56px"
                    align="center"
                    justify="center"
                    borderRadius="20px"
                    bg={assetIconBg}
                    color="#2563EB"
                    boxShadow="inset 0 1px 0 rgba(255,255,255,0.55)"
                    flexShrink={0}
                  >
                    <Icon as={FiPackage} boxSize={7} />
                  </Flex>
                  <Box>
                    <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
                  </Box>
                </HStack>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    HR Source
                  </Badge>
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    Read Only
                  </Badge>
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    Export Ready
                  </Badge>
                </HStack>
              </Flex>
            </Box>
          </SurfaceCard>

          <SurfaceCard>
            <Box p={{ base: 3, md: 4 }}>
              <AssetList readOnly />
            </Box>
          </SurfaceCard>
        </VStack>
      );
    }

    if (activeSection === "requests") {
      return (
        <VStack align="stretch" spacing={6}>
          <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
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
        <VStack align="stretch" spacing={6}>
          <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
          <SurfaceCard>
            <Box p={{ base: 4, md: 5 }}>
              <ContentTrackerPage title="Post Tracker" addButtonLabel="Add post" platformOptions={socialPostPlatforms} />
            </Box>
          </SurfaceCard>
        </VStack>
      );
    }

    if (activeSection === "accounts") {
      return (
        <VStack align="stretch" spacing={6}>
          <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
          <SocialMediaAccountsManager />
        </VStack>
      );
    }

    if (activeSection === "email") {
      return (
        <VStack align="stretch" spacing={6}>
          <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
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
        <VStack align="stretch" spacing={6}>
          <SectionIntro
            eyebrow={currentMeta.eyebrow}
            title={currentMeta.title}
            description="Review employee emails and the social media accounts created from the selected media checkboxes."
          />
          <SocialMediaAccountSummary />
        </VStack>
      );
    }

    if (activeSection === "activations") {
      return (
        <VStack align="stretch" spacing={6}>
          <SectionIntro
            eyebrow={currentMeta.eyebrow}
            title={currentMeta.title}
            description="Filter all media and other accounts, then activate or deactivate each account."
          />
          <SocialMediaActivationsManager />
        </VStack>
      );
    }

    return (
      <VStack align="stretch" spacing={6}>
        <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} />
        <SocialMediaManager />
      </VStack>
    );
  };

  return (
    <Flex minH="100vh" bg={contentBg}>
      <Box display={{ base: "none", lg: "block" }} w={collapsed ? "96px" : "300px"} transition="width 0.2s ease">
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
          px={{ base: 3, sm: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
          bg={headerBg}
          backdropFilter="blur(22px) saturate(1.18)"
          borderBottomWidth="1px"
          borderColor={borderColor}
          boxShadow={useColorModeValue("0 1px 0 rgba(255,255,255,0.85)", "0 1px 0 rgba(255,255,255,0.04)")}
        >
          <HStack spacing={2} minW={0} flex="1" w="100%">
            <IconButton
              display={{ base: "inline-flex", lg: "none" }}
              aria-label="Open sidebar"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              {...utilityButtonProps}
            />
            <InputGroup maxW={{ base: "none", md: "380px" }} flex="1" minW={0}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={muted} />
              </InputLeftElement>
              <Input
                placeholder="Search campaigns, metrics, or assets"
                aria-label="Global search"
                borderRadius="18px"
                bg={searchBg}
                borderColor={borderColor}
                boxShadow="inset 0 1px 0 rgba(255,255,255,0.55)"
                _hover={{ borderColor: "rgba(37,99,235,0.28)" }}
                _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
              />
            </InputGroup>
          </HStack>

          <HStack spacing={2} ml={{ base: 0, md: 4 }} justify={{ base: "space-between", md: "flex-end" }} w={{ base: "100%", md: "auto" }}>
            <IconButton aria-label="Notifications" icon={<BellIcon />} {...utilityButtonProps} />
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                borderRadius="18px"
                px={2}
                py={1}
                rightIcon={<ChevronDownIcon />}
                _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={currentUser?.username || currentUser?.email || "User"} bg="#2563EB" color="white" />
                  <Box textAlign="left" display={{ base: "none", md: "block" }}>
                    <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                      {currentUser?.username || "Social Media"}
                    </Text>
                    <Text fontSize="xs" color={muted} noOfLines={1}>
                      {currentUser?.displayRole || "Manager"}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <Portal>
                <MenuList borderRadius="18px" boxShadow="0 18px 46px rgba(15,23,42,0.16)" borderColor={borderColor}>
                  <MenuItem icon={<SettingsIcon />}>Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<Icon as={FiLogOut} />} onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Flex>

        <Box px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 6 }}>
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
    </Flex>
  );
}


