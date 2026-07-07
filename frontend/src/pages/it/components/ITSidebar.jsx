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
  const activeBg = useColorModeValue('white', 'gray.700');
  const activeBorder = useColorModeValue('blue.400', 'cyan.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('white', 'whiteAlpha.100');
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
        borderLeft="3px solid"
        borderLeftColor={isActive ? activeBorder : 'transparent'}
        borderRadius="10px"
        h="42px"
        w="100%"
        px={isCollapsed ? 0 : 4}
        _hover={{ bg: hoverBg, color: activeBorder }}
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

export default function ITSidebar({ activeSection, setActiveSection, setModalOpen, handleLogout, permissions, reminderCount = 0 }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const sidebarBg = useColorModeValue('rgba(255, 255, 255, 0.92)', 'rgba(17, 24, 39, 0.96)');
  const brandBg = useColorModeValue('gray.900', 'whiteAlpha.100');
  const brandAccent = useColorModeValue('cyan.300', 'cyan.200');

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
    >
      <VStack spacing={5} align="stretch" h="full">
        <Box bg={brandBg} color="white" borderRadius="14px" p={{ base: 3, lg: isCollapsed ? 3 : 4 }} position="relative">
          <HStack spacing={3} justify={isCollapsed ? 'center' : { base: 'center', lg: 'flex-start' }}>
            <Flex boxSize="38px" borderRadius="12px" bg={brandAccent} color="gray.900" align="center" justify="center">
              <Icon as={FiShield} boxSize={5} />
            </Flex>
            <Box display={isCollapsed ? 'none' : { base: 'none', lg: 'block' }}>
              <Heading size="sm">IT Ops</Heading>
              <Text fontSize="xs" color="whiteAlpha.700">
                Command Center
              </Text>
            </Box>
          </HStack>
          <IconButton
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            size="sm"
            borderRadius="full"
            position="absolute"
            right="-16px"
            top="50%"
            transform="translateY(-50%)"
            colorScheme="cyan"
            display={{ base: 'none', lg: 'inline-flex' }}
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.18)"
            onClick={() => setIsCollapsed((value) => !value)}
          />
        </Box>
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
            </>
          )}
        </VStack>
        <Divider />
        <VStack spacing={2}>
          <Button
            leftIcon={<FiPlusCircle />}
            colorScheme="blue"
            w="full"
            borderRadius="10px"
            onClick={() => setModalOpen(true)}
            isDisabled={!permissions?.canCreateTasks}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            px={isCollapsed ? 0 : 4}
          >
            <Text display={isCollapsed ? 'none' : { base: 'none', lg: 'inline' }}>Add Task</Text>
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            borderRadius="10px"
            w="full"
          />
          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="outline"
            w="full"
            borderRadius="10px"
            onClick={handleLogout}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            px={isCollapsed ? 0 : 4}
          >
            <Text display={isCollapsed ? 'none' : { base: 'none', lg: 'inline' }}>Logout</Text>
          </Button>
          
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
        </VStack>
      </VStack>
    </Box>
  );
}
