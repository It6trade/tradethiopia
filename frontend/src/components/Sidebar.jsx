import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Link,
  Text,
  Icon,
  useBreakpointValue,
  IconButton,
  Avatar,
  Button,
} from "@chakra-ui/react";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiClock,
  FiUserPlus,
  FiBookOpen,
  FiCalendar,
  FiBarChart2,
  FiDollarSign,
  FiHeart,
  FiBookmark,
  FiMessageSquare,
  FiFileText,
  FiMenu,
  FiChevronLeft,
  FiHeadphones,
  FiAward,
  FiLayers,
  FiSearch,
  FiMessageCircle,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { Link as RouterLink, useLocation } from "react-router-dom";

/* ─── colour tokens ─── */
const SIDEBAR_BG       = "#1a2e22";
const SIDEBAR_DARK     = "#142319";
const ACTIVE_BG        = "#2d6a4f";
const ACTIVE_TEXT       = "#ffffff";
const SECTION_LABEL     = "rgba(255,255,255,0.35)";
const NAV_TEXT          = "rgba(255,255,255,0.65)";
const NAV_HOVER_BG     = "rgba(255,255,255,0.08)";
const SUPPORT_BG       = "#142319";
const SUPPORT_BTN      = "#2d6a4f";
const LOGO_BADGE_BG    = "#2d6a4f";

/* ─── sidebar item ─── */
const SidebarItem = ({ to, icon, label, isCollapsed, isActive }) => (
  <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }} w="full">
    <Flex
      align="center"
      px={isCollapsed ? 0 : 3}
      py={2}
      mx={isCollapsed ? 1 : 2}
      borderRadius="lg"
      bg={isActive ? ACTIVE_BG : "transparent"}
      color={isActive ? ACTIVE_TEXT : NAV_TEXT}
      fontWeight={isActive ? "700" : "500"}
      fontSize="13px"
      transition="all 0.15s ease"
      _hover={{ bg: isActive ? ACTIVE_BG : NAV_HOVER_BG, color: ACTIVE_TEXT }}
      justify={isCollapsed ? "center" : "flex-start"}
    >
      <Icon as={icon} boxSize="17px" flexShrink={0} />
      {!isCollapsed && <Text ml={3} noOfLines={1}>{label}</Text>}
    </Flex>
  </Link>
);

/* ─── sidebar sub-item ─── */
const SidebarSubItem = ({ to, label, isCollapsed, isActive }) => (
  <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }} w="full">
    <Flex
      align="center"
      pl={isCollapsed ? 0 : 7}
      pr={isCollapsed ? 0 : 3}
      py={1.5}
      mx={isCollapsed ? 1 : 2}
      borderRadius="md"
      bg={isActive ? ACTIVE_BG : "transparent"}
      color={isActive ? ACTIVE_TEXT : NAV_TEXT}
      fontWeight={isActive ? "700" : "500"}
      fontSize="12px"
      transition="all 0.15s ease"
      _hover={{ bg: isActive ? ACTIVE_BG : NAV_HOVER_BG, color: ACTIVE_TEXT }}
      justify={isCollapsed ? "center" : "flex-start"}
    >
      <Box
        w="6px"
        h="6px"
        borderRadius="full"
        bg={isActive ? "#ffffff" : "rgba(255,255,255,0.4)"}
        mr={isCollapsed ? 0 : 2.5}
        flexShrink={0}
      />
      {!isCollapsed && <Text noOfLines={1}>{label}</Text>}
    </Flex>
  </Link>
);

/* ─── sidebar expandable parent item ─── */
const SidebarExpandableItem = ({ icon, label, isCollapsed, isParentActive, isOpen, onToggle, children }) => (
  <Box w="full">
    <Flex
      align="center"
      px={isCollapsed ? 0 : 3}
      py={2}
      mx={isCollapsed ? 1 : 2}
      borderRadius="lg"
      bg={isParentActive && !isOpen ? ACTIVE_BG : isParentActive ? "rgba(45,106,79,0.3)" : "transparent"}
      color={isParentActive ? ACTIVE_TEXT : NAV_TEXT}
      fontWeight={isParentActive ? "700" : "500"}
      fontSize="13px"
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{ bg: isParentActive ? ACTIVE_BG : NAV_HOVER_BG, color: ACTIVE_TEXT }}
      justify={isCollapsed ? "center" : "space-between"}
      onClick={onToggle}
    >
      <HStack spacing={3} minW={0}>
        <Icon as={icon} boxSize="17px" flexShrink={0} />
        {!isCollapsed && <Text noOfLines={1}>{label}</Text>}
      </HStack>
      {!isCollapsed && (
        <Icon as={isOpen ? FiChevronDown : FiChevronRight} boxSize="14px" opacity={0.7} />
      )}
    </Flex>
    {isOpen && (
      <VStack align="stretch" spacing={0.5} mt={0.5}>
        {children}
      </VStack>
    )}
  </Box>
);

/* ─── section heading ─── */
const SectionLabel = ({ label, isCollapsed }) => {
  if (isCollapsed) return <Box my={2} mx={2} h="1px" bg="rgba(255,255,255,0.08)" />;
  return (
    <Text
      px={4}
      pt={5}
      pb={1.5}
      fontSize="10px"
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing="0.12em"
      color={SECTION_LABEL}
    >
      {label}
    </Text>
  );
};

/* ─── main component ─── */
const Sidebar = ({ isCollapsed: controlledIsCollapsed, onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const breakpointValue = useBreakpointValue({ base: true, md: false });
  const location = useLocation();

  const isDocPath = location.pathname.startsWith("/documentlist") || location.pathname.startsWith("/EmployeeDocument") || location.pathname.startsWith("/resources") || location.pathname.startsWith("/Addresource") || location.pathname.startsWith("/category") || location.pathname.startsWith("/documentupload");
  const isStaffPath = location.pathname.startsWith("/users") || location.pathname.startsWith("/attendance") || location.pathname.startsWith("/leave-management") || location.pathname.startsWith("/employee-requests") || location.pathname.startsWith("/warnings");
  const isTrainingPath = location.pathname.startsWith("/candidate-pool") || location.pathname.startsWith("/hr-training") || location.pathname.startsWith("/course") || location.pathname.startsWith("/quiz") || location.pathname.startsWith("/awards");
  const isAssetPath = location.pathname.startsWith("/assets") || location.pathname.startsWith("/assetcategory");

  // Subcategories are collapsed initially (false) unless the user is on a route in that section
  const [isDocOpen, setIsDocOpen] = useState(isDocPath);
  const [isStaffOpen, setIsStaffOpen] = useState(isStaffPath);
  const [isTrainingOpen, setIsTrainingOpen] = useState(isTrainingPath);
  const [isAssetOpen, setIsAssetOpen] = useState(isAssetPath);

  const effectiveIsCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : isCollapsed;

  useEffect(() => {
    if (controlledIsCollapsed === undefined) {
      setIsCollapsed(breakpointValue);
    }
  }, [breakpointValue, controlledIsCollapsed]);

  // Expand category automatically if user navigates to a route within it
  useEffect(() => {
    if (isDocPath) setIsDocOpen(true);
    if (isStaffPath) setIsStaffOpen(true);
    if (isTrainingPath) setIsTrainingOpen(true);
    if (isAssetPath) setIsAssetOpen(true);
  }, [isDocPath, isStaffPath, isTrainingPath, isAssetPath]);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Box
      as="nav"
      width={effectiveIsCollapsed ? "60px" : "220px"}
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bg={SIDEBAR_BG}
      transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex="10"
      overflowY="auto"
      overflowX="hidden"
      display="flex"
      flexDirection="column"
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
      }}
    >
      {/* ─── Logo Block & Collapse Toggle ─── */}
      <Flex
        align="center"
        justify={effectiveIsCollapsed ? "center" : "space-between"}
        px={effectiveIsCollapsed ? 2 : 4}
        py={4}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        gap={2}
      >
        <HStack spacing={3} minW={0}>
          <Flex
            w="36px" h="36px"
            align="center" justify="center"
            bg={LOGO_BADGE_BG}
            borderRadius="lg"
            flexShrink={0}
          >
            <Text fontSize="sm" fontWeight="900" color="white">TE</Text>
          </Flex>
          {!effectiveIsCollapsed && (
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="800" color="white" lineHeight="short" noOfLines={1}>Trade Ethiopia</Text>
              <Text fontSize="10px" color={SECTION_LABEL} fontWeight="600" noOfLines={1}>HR Workspace</Text>
            </Box>
          )}
        </HStack>

        <IconButton
          icon={<Icon as={effectiveIsCollapsed ? FiMenu : FiChevronLeft} boxSize={4} />}
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          aria-label="Toggle Sidebar"
          borderRadius="lg"
          color={NAV_TEXT}
          _hover={{ bg: NAV_HOVER_BG }}
          display={effectiveIsCollapsed ? "none" : "inline-flex"}
          flexShrink={0}
        />
      </Flex>

      {/* ─── Collapsed Toggle Icon (Only visible when collapsed) ─── */}
      {effectiveIsCollapsed && (
        <Flex justify="center" py={2} borderBottom="1px solid rgba(255,255,255,0.04)">
          <IconButton
            icon={<Icon as={FiMenu} boxSize={4} />}
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            aria-label="Toggle Sidebar"
            borderRadius="lg"
            color={NAV_TEXT}
            _hover={{ bg: NAV_HOVER_BG }}
            flexShrink={0}
          />
        </Flex>
      )}

      {/* ─── Navigation Links ─── */}
      <VStack align="stretch" spacing={0.5} flex="1">
        <SectionLabel label="Overview" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/dashboard" icon={FiHome} label="Dashboard" isCollapsed={effectiveIsCollapsed} isActive={isActive("/dashboard")} />
        
        {/* Document Management Category */}
        <SidebarExpandableItem
          icon={FiFileText}
          label="Documents"
          isCollapsed={effectiveIsCollapsed}
          isParentActive={isDocPath}
          isOpen={isDocOpen}
          onToggle={() => setIsDocOpen((prev) => !prev)}
        >
          <SidebarSubItem
            to="/documentlist"
            label="Company Documents"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/documentlist")}
          />
          <SidebarSubItem
            to="/EmployeeDocument"
            label="Employee Documents"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/EmployeeDocument")}
          />
          <SidebarSubItem
            to="/resources"
            label="Resources & Guides"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/resources")}
          />
          <SidebarSubItem
            to="/Addresource"
            label="Add Resource"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/Addresource")}
          />
          <SidebarSubItem
            to="/category"
            label="Categories"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/category")}
          />
        </SidebarExpandableItem>

        {/* Workforce & Staff Category */}
        <SidebarExpandableItem
          icon={FiUsers}
          label="Workforce & Staff"
          isCollapsed={effectiveIsCollapsed}
          isParentActive={isStaffPath}
          isOpen={isStaffOpen}
          onToggle={() => setIsStaffOpen((prev) => !prev)}
        >
          <SidebarSubItem
            to="/users"
            label="Employee Directory"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/users")}
          />
          <SidebarSubItem
            to="/attendance"
            label="Attendance"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/attendance")}
          />
          <SidebarSubItem
            to="/leave-management"
            label="Leave Management"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/leave-management")}
          />
          <SidebarSubItem
            to="/employee-requests"
            label="Employee Requests"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/employee-requests")}
          />
          <SidebarSubItem
            to="/warnings"
            label="Warning Management"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/warnings")}
          />
        </SidebarExpandableItem>

        {/* Recruitment & Training Category */}
        <SidebarExpandableItem
          icon={FiBookOpen}
          label="Recruitment & Training"
          isCollapsed={effectiveIsCollapsed}
          isParentActive={isTrainingPath}
          isOpen={isTrainingOpen}
          onToggle={() => setIsTrainingOpen((prev) => !prev)}
        >
          <SidebarSubItem
            to="/candidate-pool"
            label="Recruitment Pool"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/candidate-pool")}
          />
          <SidebarSubItem
            to="/course"
            label="Onboarding"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/course") || isActive("/courses") || isActive("/hr-training") || isActive("/quiz")}
          />
          <SidebarSubItem
            to="/awards"
            label="Performance & Awards"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/awards")}
          />
        </SidebarExpandableItem>

        {/* Asset Management Category */}
        <SidebarExpandableItem
          icon={FiBriefcase}
          label="Asset Management"
          isCollapsed={effectiveIsCollapsed}
          isParentActive={isAssetPath}
          isOpen={isAssetOpen}
          onToggle={() => setIsAssetOpen((prev) => !prev)}
        >
          <SidebarSubItem
            to="/assets"
            label="Company Assets"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/assets")}
          />
          <SidebarSubItem
            to="/assetcategory"
            label="Asset Categories"
            isCollapsed={effectiveIsCollapsed}
            isActive={isActive("/assetcategory")}
          />
        </SidebarExpandableItem>

        <SectionLabel label="Finance" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/payroll" icon={FiDollarSign} label="Payroll" isCollapsed={effectiveIsCollapsed} isActive={isActive("/payroll")} />

        <SectionLabel label="Communication" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/chat" icon={FiMessageSquare} label="Announcements" isCollapsed={effectiveIsCollapsed} isActive={isActive("/chat")} />
      </VStack>

      {/* ─── Bottom Support Card ─── */}
      {!effectiveIsCollapsed && (
        <Box mx={3} mb={4} p={3.5} bg={SUPPORT_BG} borderRadius="xl" border="1px solid rgba(255,255,255,0.06)">
          <Flex align="center" gap={2.5} mb={2.5}>
            <Flex w="32px" h="32px" align="center" justify="center" bg={ACTIVE_BG} borderRadius="full">
              <Icon as={FiHeadphones} color="white" boxSize={3.5} />
            </Flex>
            <Box>
              <Text fontSize="xs" fontWeight="800" color="white">HR Support</Text>
              <Text fontSize="9px" color={SECTION_LABEL}>We're here to help</Text>
            </Box>
          </Flex>
          <Button
            w="full"
            size="sm"
            bg={SUPPORT_BTN}
            color="white"
            borderRadius="lg"
            fontSize="xs"
            fontWeight="700"
            _hover={{ bg: "#3a7d5c" }}
          >
            Contact Support
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
