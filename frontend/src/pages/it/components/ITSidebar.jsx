import React, { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Icon,
  Text,
  VStack,
  Tooltip,
  useColorMode,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import {
  FiHome,
  FiBarChart2,
  FiTarget,
  FiFileText,
  FiPlusCircle,
  FiMoon,
  FiSun,
  FiLogOut,
  FiMessageSquare,
  FiFolder,
  FiUser,
  FiEdit3,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiUserCheck,
  FiBell,
} from 'react-icons/fi';

const SidebarButton = ({ label, icon: Icon, isActive, onClick, tooltip, isCollapsed, badge }) => {
<<<<<<< Updated upstream
  const activeBg = useColorModeValue('linear-gradient(135deg, #eff6ff, #ecfeff)', 'linear-gradient(135deg, rgba(14,165,233,0.22), rgba(20,184,166,0.16))');
  const activeBorder = useColorModeValue('blue.500', 'cyan.300');
  const inactiveColor = useColorModeValue('gray.700', 'gray.300');
  const hoverBg = useColorModeValue('rgba(255,255,255,0.78)', 'whiteAlpha.100');
  const activeShadow = useColorModeValue('0 12px 26px rgba(37, 99, 235, 0.13)', '0 12px 26px rgba(14, 165, 233, 0.15)');
  const activeBorderColor = useColorModeValue('blue.100', 'whiteAlpha.200');
=======
  const activeBg = useColorModeValue('white', 'gray.700');
  const activeBorder = useColorModeValue('blue.400', 'cyan.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('white', 'whiteAlpha.100');
>>>>>>> Stashed changes
  const color = isActive ? activeBorder : inactiveColor;
  return (
    <Tooltip label={tooltip || label} placement="right" hasArrow>
      <Button
        onClick={onClick}
        leftIcon={<Icon />}
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        variant="ghost"
        color={color}
        fontWeight={isActive ? '800' : '600'}
        bg={isActive ? activeBg : 'transparent'}
<<<<<<< Updated upstream
        border="1px solid"
        borderColor={isActive ? activeBorderColor : 'transparent'}
        borderLeft="4px solid"
        borderLeftColor={isActive ? activeBorder : 'transparent'}
        borderRadius="14px"
        h="44px"
        w="100%"
        px={isCollapsed ? 0 : 4}
        boxShadow={isActive ? activeShadow : 'none'}
        transition="transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease"
        _hover={{ bg: hoverBg, color: activeBorder, transform: 'translateX(2px)' }}
=======
        borderLeft="3px solid"
        borderLeftColor={isActive ? activeBorder : 'transparent'}
        borderRadius="10px"
        h="42px"
        w="100%"
        px={isCollapsed ? 0 : 4}
        _hover={{ bg: hoverBg, color: activeBorder }}
>>>>>>> Stashed changes
      >
        <HStack display={isCollapsed ? 'none' : { base: 'none', lg: 'flex' }} spacing={2}>
          <Text>{label}</Text>
          {Boolean(badge) && (
            <Badge colorScheme="red" borderRadius="full">
              {badge}
            </Badge>
          )}
        </HStack>
      </Button>
    </Tooltip>
  );
};

<<<<<<< Updated upstream
const SidebarSection = ({ title, children, isCollapsed }) => {
  const labelColor = useColorModeValue('gray.500', 'gray.500');
  const dividerColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  return (
    <Box>
      <HStack spacing={3} mb={2} px={isCollapsed ? 0 : 2} justify={isCollapsed ? 'center' : 'flex-start'}>
        <Divider borderColor={dividerColor} display={isCollapsed ? 'block' : 'none'} />
        <Text
          display={isCollapsed ? 'none' : { base: 'none', lg: 'block' }}
          fontSize="10px"
          fontWeight="900"
          color={labelColor}
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {title}
        </Text>
      </HStack>
      <VStack spacing={1.5} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

=======
>>>>>>> Stashed changes
export default function ITSidebar({ activeSection, setActiveSection, setModalOpen, handleLogout, permissions, reminderCount = 0 }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue('gray.200', 'gray.800');
<<<<<<< Updated upstream
  const sidebarBg = useColorModeValue('rgba(255, 255, 255, 0.78)', 'rgba(10, 18, 32, 0.92)');
  const brandBg = useColorModeValue('linear-gradient(135deg, #0f172a, #0e7490)', 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.92))');
  const brandAccent = useColorModeValue('cyan.300', 'cyan.200');
  const panelShadow = useColorModeValue('18px 0 50px rgba(15, 23, 42, 0.08)', '18px 0 50px rgba(0, 0, 0, 0.28)');
=======
  const sidebarBg = useColorModeValue('rgba(255, 255, 255, 0.92)', 'rgba(17, 24, 39, 0.96)');
  const brandBg = useColorModeValue('gray.900', 'whiteAlpha.100');
  const brandAccent = useColorModeValue('cyan.300', 'cyan.200');
>>>>>>> Stashed changes

  return (
    <Box
      as="aside"
      w={{ base: '82px', lg: isCollapsed ? '92px' : '282px' }}
      minW={{ base: '82px', lg: isCollapsed ? '92px' : '282px' }}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={borderColor}
      p={{ base: 3, lg: 5 }}
      position="sticky"
      top={0}
      h="100vh"
      backdropFilter="blur(16px)"
      transition="width 0.22s ease, min-width 0.22s ease"
<<<<<<< Updated upstream
      boxShadow={panelShadow}
      flexShrink={0}
      alignSelf="flex-start"
      overflow="hidden"
    >
      <VStack spacing={5} align="stretch" h="full">
        <Box
          bg={brandBg}
          color="white"
          borderRadius="20px"
          p={{ base: 3, lg: isCollapsed ? 3 : 4 }}
          position="relative"
          overflow="hidden"
          boxShadow="0 18px 34px rgba(15, 23, 42, 0.22)"
        >
          <Box
            position="absolute"
            inset={0}
            opacity={0.24}
            bgImage="linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)"
            bgSize="28px 28px"
          />
          <Box position="relative">
          <HStack spacing={3} justify={isCollapsed ? 'center' : { base: 'center', lg: 'flex-start' }}>
            <Flex boxSize="42px" borderRadius="15px" bg={brandAccent} color="gray.900" align="center" justify="center" boxShadow="0 12px 28px rgba(103, 232, 249, 0.24)">
=======
    >
      <VStack spacing={5} align="stretch" h="full">
        <Box bg={brandBg} color="white" borderRadius="14px" p={{ base: 3, lg: isCollapsed ? 3 : 4 }} position="relative">
          <HStack spacing={3} justify={isCollapsed ? 'center' : { base: 'center', lg: 'flex-start' }}>
            <Flex boxSize="38px" borderRadius="12px" bg={brandAccent} color="gray.900" align="center" justify="center">
>>>>>>> Stashed changes
              <Icon as={FiShield} boxSize={5} />
            </Flex>
            <Box display={isCollapsed ? 'none' : { base: 'none', lg: 'block' }}>
              <Heading size="sm">IT Ops</Heading>
              <Text fontSize="xs" color="whiteAlpha.700">
                Command Center
              </Text>
            </Box>
          </HStack>
<<<<<<< Updated upstream
          </Box>
=======
>>>>>>> Stashed changes
          <IconButton
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            size="sm"
            borderRadius="full"
            position="absolute"
<<<<<<< Updated upstream
            right="-8px"
=======
            right="-16px"
>>>>>>> Stashed changes
            top="50%"
            transform="translateY(-50%)"
            colorScheme="cyan"
            display={{ base: 'none', lg: 'inline-flex' }}
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.18)"
            onClick={() => setIsCollapsed((value) => !value)}
          />
        </Box>
<<<<<<< Updated upstream
        <VStack spacing={4} align="stretch" overflowY="auto" pr={1} flex="1" minH={0}>
          <SidebarSection title="Command" isCollapsed={isCollapsed}>
            <SidebarButton
              label="Overview"
              icon={FiHome}
              isActive={activeSection === 'dashboard'}
              onClick={() => setActiveSection('dashboard')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Projects"
              icon={FiFolder}
              isActive={activeSection === 'projects'}
              onClick={() => setActiveSection('projects')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Reminders"
              icon={FiBell}
              isActive={activeSection === 'reminders'}
              onClick={() => setActiveSection('reminders')}
              isCollapsed={isCollapsed}
              badge={reminderCount}
            />
          </SidebarSection>

          <SidebarSection title="Insights" isCollapsed={isCollapsed}>
            <SidebarButton
              label="KPI"
              icon={FiTarget}
              isActive={activeSection === 'kpi'}
              onClick={() => setActiveSection('kpi')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Performance"
              icon={FiBarChart2}
              isActive={activeSection === 'performance'}
              onClick={() => setActiveSection('performance')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Reports"
              icon={FiFileText}
              isActive={activeSection === 'reports'}
              onClick={() => setActiveSection('reports')}
              isCollapsed={isCollapsed}
            />
          </SidebarSection>

          <SidebarSection title="Workspace" isCollapsed={isCollapsed}>
            <SidebarButton
              label="Notes"
              icon={FiEdit3}
              isActive={activeSection === 'notes'}
              onClick={() => setActiveSection('notes')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Notice Board"
              icon={FiMessageSquare}
              isActive={activeSection === 'notice-board'}
              onClick={() => setActiveSection('notice-board')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Profile"
              icon={FiUser}
              isActive={activeSection === 'profile'}
              onClick={() => setActiveSection('profile')}
              isCollapsed={isCollapsed}
            />
          </SidebarSection>

          {permissions?.canManageUsers && (
            <SidebarSection title="Administration" isCollapsed={isCollapsed}>
=======
        <VStack spacing={1.5} align="stretch">
          <SidebarButton
            label="Overview"
            icon={FiHome}
            isActive={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="Projects"
            icon={FiFolder}
            isActive={activeSection === 'projects'}
            onClick={() => setActiveSection('projects')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="Performance"
            icon={FiBarChart2}
            isActive={activeSection === 'performance'}
            onClick={() => setActiveSection('performance')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="KPI"
            icon={FiTarget}
            isActive={activeSection === 'kpi'}
            onClick={() => setActiveSection('kpi')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="Reports"
            icon={FiFileText}
            isActive={activeSection === 'reports'}
            onClick={() => setActiveSection('reports')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="Notes"
            icon={FiEdit3}
            isActive={activeSection === 'notes'}
            onClick={() => setActiveSection('notes')}
            isCollapsed={isCollapsed}
          />
          <SidebarButton
            label="Reminders"
            icon={FiBell}
            isActive={activeSection === 'reminders'}
            onClick={() => setActiveSection('reminders')}
            isCollapsed={isCollapsed}
            badge={reminderCount}
          />
          <SidebarButton
            label="Profile"
            icon={FiUser}
            isActive={activeSection === 'profile'}
            onClick={() => setActiveSection('profile')}
            isCollapsed={isCollapsed}
          />
          {permissions?.canManageUsers && (
            <>
>>>>>>> Stashed changes
              <SidebarButton
                label="Admin"
                icon={FiShield}
                isActive={activeSection === 'admin'}
                onClick={() => setActiveSection('admin')}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                label="User Management"
                icon={FiUserCheck}
                isActive={activeSection === 'admin-users'}
                onClick={() => setActiveSection('admin-users')}
                isCollapsed={isCollapsed}
              />
<<<<<<< Updated upstream
            </SidebarSection>
=======
            </>
>>>>>>> Stashed changes
          )}
        </VStack>
        <Divider />
        <VStack spacing={2}>
          <Button
            leftIcon={<FiPlusCircle />}
            colorScheme="blue"
            w="full"
<<<<<<< Updated upstream
            borderRadius="14px"
=======
            borderRadius="10px"
>>>>>>> Stashed changes
            onClick={() => setModalOpen(true)}
            isDisabled={!permissions?.canCreateTasks}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            px={isCollapsed ? 0 : 4}
<<<<<<< Updated upstream
            boxShadow="0 14px 28px rgba(37, 99, 235, 0.18)"
=======
>>>>>>> Stashed changes
          >
            <Text display={isCollapsed ? 'none' : { base: 'none', lg: 'inline' }}>Add Task</Text>
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
<<<<<<< Updated upstream
            borderRadius="14px"
=======
            borderRadius="10px"
>>>>>>> Stashed changes
            w="full"
          />
          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="outline"
            w="full"
<<<<<<< Updated upstream
            borderRadius="14px"
=======
            borderRadius="10px"
>>>>>>> Stashed changes
            onClick={handleLogout}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            px={isCollapsed ? 0 : 4}
          >
            <Text display={isCollapsed ? 'none' : { base: 'none', lg: 'inline' }}>Logout</Text>
          </Button>
<<<<<<< Updated upstream
=======
          
          <Tooltip label="Notice Board" placement="right" hasArrow>
            <Button
              leftIcon={<FiMessageSquare />}
              justifyContent={isCollapsed ? 'center' : { base: 'center', lg: 'flex-start' }}
              variant={activeSection === 'notice-board' ? 'solid' : 'ghost'}
              colorScheme={activeSection === 'notice-board' ? 'teal' : 'gray'}
              onClick={() => setActiveSection('notice-board')}
              w="full"
              size="md"
              borderRadius="10px"
              px={isCollapsed ? 0 : 4}
            >
              <Text display={isCollapsed ? 'none' : { base: 'none', lg: 'block' }}>Notice Board</Text>
            </Button>
          </Tooltip>
>>>>>>> Stashed changes
        </VStack>
      </VStack>
    </Box>
  );
}
