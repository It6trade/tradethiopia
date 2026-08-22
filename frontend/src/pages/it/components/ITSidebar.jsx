import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import {
  FiGrid,
  FiFolder,
  FiTool,
  FiBell,
  FiTarget,
  FiActivity,
  FiFileText,
  FiEdit3,
  FiMessageSquare,
  FiUser,
  FiShield,
  FiUsers,
  FiPlus,
  FiMoon,
  FiSun,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiTrendingUp,
  FiCpu,
  FiCode,
  FiZap,
  FiUserCheck,
  FiUploadCloud,
} from 'react-icons/fi';

const SidebarButton = ({ label, icon: IconComponent, isActive, onClick, tooltip, isCollapsed, badge }) => {
  // Vibrant, tailored color tokens
  const activeBg = useColorModeValue(
    'linear-gradient(90deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
    'linear-gradient(90deg, rgba(56, 189, 248, 0.18) 0%, rgba(14, 165, 233, 0.08) 100%)'
  );
  const activeColor = useColorModeValue('blue.600', 'cyan.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('rgba(241, 245, 249, 0.95)', 'rgba(255, 255, 255, 0.06)');
  const iconBgActive = useColorModeValue('blue.500', 'cyan.400');
  const iconColorActive = useColorModeValue('white', 'gray.900');
  const iconBgHover = useColorModeValue('gray.200', 'whiteAlpha.200');

  return (
    <Tooltip label={tooltip || label} placement="right" hasArrow isDisabled={!isCollapsed}>
      <Button
        onClick={onClick}
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        variant="ghost"
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? '750' : '600'}
        fontSize="xs"
        bg={isActive ? activeBg : 'transparent'}
        border="1px solid"
        borderColor={isActive ? useColorModeValue('blue.200', 'cyan.800') : 'transparent'}
        borderRadius="xl"
        h="40px"
        w="100%"
        px={isCollapsed ? 0 : 2.5}
        position="relative"
        boxShadow={isActive ? useColorModeValue('0 2px 10px rgba(37, 99, 235, 0.1)', '0 2px 12px rgba(6, 182, 212, 0.15)') : 'none'}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: activeColor,
          transform: isCollapsed ? 'scale(1.08)' : 'translateX(3px)',
        }}
        _active={{
          transform: 'scale(0.98)',
        }}
      >
        {/* Active Pill Indicator Bar on Left */}
        {isActive && !isCollapsed && (
          <Box
            position="absolute"
            left="0"
            top="20%"
            bottom="20%"
            w="3.5px"
            borderRadius="0 4px 4px 0"
            bgGradient="linear(to-b, blue.500, cyan.400)"
            boxShadow="0 0 8px rgba(6, 182, 212, 0.6)"
          />
        )}

        <HStack spacing={2.5} w="full" justify={isCollapsed ? 'center' : 'flex-start'}>
          {/* Enhanced Icon Container with Soft Glow */}
          <Flex
            boxSize="28px"
            borderRadius="lg"
            align="center"
            justify="center"
            bg={isActive ? iconBgActive : 'transparent'}
            color={isActive ? iconColorActive : inactiveColor}
            boxShadow={isActive ? '0 2px 8px rgba(6, 182, 212, 0.35)' : 'none'}
            position="relative"
            transition="all 0.2s ease"
            _groupHover={{
              bg: isActive ? iconBgActive : iconBgHover,
            }}
          >
            <Icon
              as={IconComponent}
              boxSize={4}
            />
            {Boolean(badge) && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-5px"
                right="-7px"
                minW="16px"
                h="16px"
                px={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="9px"
                fontWeight="extrabold"
                boxShadow="0 0 8px rgba(239, 68, 68, 0.7)"
              >
                {badge}
              </Badge>
            )}
          </Flex>

          {!isCollapsed && (
            <Text isTruncated letterSpacing="0.01em">
              {label}
            </Text>
          )}
        </HStack>
      </Button>
    </Tooltip>
  );
};

const SidebarSection = ({ title, icon: SectionIcon, children, isCollapsed }) => {
  const labelColor = useColorModeValue('gray.400', 'gray.500');
  const dividerColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  return (
    <Box mb={1}>
      <HStack spacing={2} mb={1.5} px={isCollapsed ? 0 : 2.5} justify={isCollapsed ? 'center' : 'flex-start'}>
        <Divider borderColor={dividerColor} display={isCollapsed ? 'block' : 'none'} />
        {!isCollapsed && (
          <HStack spacing={1.5}>
            {SectionIcon && (
              <Icon as={SectionIcon} boxSize={3} color={useColorModeValue('blue.500', 'cyan.400')} />
            )}
            <Text
              fontSize="10px"
              fontWeight="800"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              {title}
            </Text>
          </HStack>
        )}
      </HStack>
      <VStack spacing={1} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

export default function ITSidebar({
  activeSection,
  setActiveSection,
  setModalOpen,
  handleLogout,
  permissions,
  reminderCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}) {
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue('rgba(226, 232, 240, 0.8)', 'rgba(30, 41, 59, 0.8)');
  const sidebarBg = useColorModeValue(
    'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.96) 100%)',
    'linear-gradient(180deg, rgba(11, 19, 38, 0.96) 0%, rgba(8, 14, 28, 0.98) 100%)'
  );
  const brandBg = useColorModeValue(
    'linear-gradient(135deg, #091e42 0%, #0c356a 50%, #026aa7 100%)',
    'linear-gradient(135deg, #06182c 0%, #0d2847 50%, #0b3d68 100%)'
  );
  const panelShadow = useColorModeValue(
    '4px 0 24px rgba(15, 23, 42, 0.05)',
    '4px 0 30px rgba(0, 0, 0, 0.4)'
  );

  return (
    <Box
      as="aside"
      w={{ base: '76px', lg: isCollapsed ? '78px' : '240px' }}
      minW={{ base: '76px', lg: isCollapsed ? '78px' : '240px' }}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={borderColor}
      p={{ base: 2.5, lg: isCollapsed ? 2.5 : 3.5 }}
      position="fixed"
      top={0}
      left={0}
      bottom={0}
      h="100dvh"
      zIndex={25}
      backdropFilter="blur(20px)"
      transition="width 0.24s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.24s cubic-bezier(0.4, 0, 0.2, 1)"
      boxShadow={panelShadow}
      flexShrink={0}
      alignSelf="flex-start"
      overflow="hidden"
    >
      <VStack spacing={3.5} align="stretch" h="full">
        {/* Brand Command Header with Cyber Shield */}
        <Box
          bg={brandBg}
          color="white"
          borderRadius="2xl"
          p={{ base: 2, lg: isCollapsed ? 2.5 : 3 }}
          position="relative"
          overflow="hidden"
          boxShadow="0 10px 24px rgba(9, 30, 66, 0.3)"
          border="1px solid"
          borderColor="whiteAlpha.150"
        >
          {/* Subtle Grid Accent Pattern */}
          <Box
            position="absolute"
            inset={0}
            opacity={0.15}
            bgImage="radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)"
            bgSize="12px 12px"
            pointerEvents="none"
          />

          <Flex align="center" justify={isCollapsed ? 'center' : 'space-between'} position="relative">
            <HStack spacing={2.5}>
              <Flex
                boxSize="36px"
                borderRadius="xl"
                bgGradient="linear(to-br, cyan.400, blue.600)"
                color="white"
                align="center"
                justify="center"
                boxShadow="0 0 16px rgba(6, 182, 212, 0.5)"
              >
                <Icon as={FiCode} boxSize={5} />
              </Flex>
              {!isCollapsed && (
                <Box>
                  <HStack spacing={1.5}>
                    <Heading size="xs" fontWeight="800" letterSpacing="0.02em">
                      IT Ops
                    </Heading>
                    <Badge colorScheme="cyan" fontSize="9px" px={1.5} py={0} borderRadius="full">
                      v2.0
                    </Badge>
                  </HStack>
                  <Text fontSize="10px" color="whiteAlpha.700" fontWeight="medium">
                    Engine Active 🟢
                  </Text>
                </Box>
              )}
            </HStack>

            {!isCollapsed && (
              <IconButton
                aria-label="Collapse sidebar"
                icon={<FiChevronLeft />}
                size="xs"
                variant="ghost"
                color="whiteAlpha.800"
                _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                borderRadius="lg"
                display={{ base: 'none', lg: 'inline-flex' }}
                onClick={() => setIsCollapsed?.((v) => !v)}
              />
            )}
          </Flex>

          {isCollapsed && (
            <IconButton
              aria-label="Expand sidebar"
              icon={<FiChevronRight />}
              size="2xs"
              variant="ghost"
              color="whiteAlpha.800"
              _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
              borderRadius="full"
              position="absolute"
              bottom="2px"
              right="2px"
              display={{ base: 'none', lg: 'inline-flex' }}
              onClick={() => setIsCollapsed?.((v) => !v)}
            />
          )}
        </Box>

        {/* Scrollable Navigation Groups */}
        <VStack
          spacing={3}
          align="stretch"
          overflowY="auto"
          pr={0.5}
          flex="1"
          minH={0}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(160, 174, 192, 0.3)', borderRadius: '4px' },
          }}
        >
          <SidebarSection title="Command" icon={FiLayers} isCollapsed={isCollapsed}>
            <SidebarButton
              label="Overview"
              icon={FiGrid}
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
              label="Tickets"
              icon={FiTool}
              isActive={activeSection === 'tickets'}
              onClick={() => setActiveSection('tickets')}
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

          <SidebarSection title="Insights" icon={FiActivity} isCollapsed={isCollapsed}>
            <SidebarButton
              label="KPI"
              icon={FiTarget}
              isActive={activeSection === 'kpi'}
              onClick={() => setActiveSection('kpi')}
              isCollapsed={isCollapsed}
            />
            <SidebarButton
              label="Performance"
              icon={FiTrendingUp}
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

          <SidebarSection title="Workspace" icon={FiZap} isCollapsed={isCollapsed}>
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
            <SidebarButton
              label="Upload Documents"
              icon={FiUploadCloud}
              isActive={activeSection === 'upload-documents'}
              onClick={() => setActiveSection('upload-documents')}
              isCollapsed={isCollapsed}
            />
          </SidebarSection>

          {permissions?.canManageUsers && (
            <SidebarSection title="Administration" icon={FiShield} isCollapsed={isCollapsed}>
              <SidebarButton
                label="Admin"
                icon={FiShield}
                isActive={activeSection === 'admin'}
                onClick={() => setActiveSection('admin')}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                label="User Management"
                icon={FiUsers}
                isActive={activeSection === 'admin-users'}
                onClick={() => setActiveSection('admin-users')}
                isCollapsed={isCollapsed}
              />
            </SidebarSection>
          )}
        </VStack>

        <Divider borderColor={borderColor} />

        {/* Action Controls & Footer */}
        <VStack spacing={2} pt={0.5}>
          <Button
            leftIcon={<FiPlus />}
            bgGradient="linear(to-r, blue.500, cyan.400)"
            color="white"
            _hover={{
              bgGradient: 'linear(to-r, blue.600, cyan.500)',
              boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)',
              transform: 'translateY(-1px)',
            }}
            _active={{ transform: 'scale(0.98)' }}
            w="full"
            borderRadius="xl"
            size="sm"
            fontWeight="bold"
            fontSize="xs"
            onClick={() => setModalOpen(true)}
            isDisabled={!permissions?.canCreateTasks}
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            px={isCollapsed ? 0 : 3.5}
            boxShadow="0 4px 14px rgba(37, 99, 235, 0.25)"
            transition="all 0.2s ease"
          >
            {!isCollapsed && <Text>New Task</Text>}
          </Button>

          <HStack spacing={2} w="full">
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="outline"
              borderColor={borderColor}
              _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
              borderRadius="xl"
              size="sm"
              flex={1}
            />

            <Button
              leftIcon={<FiLogOut />}
              colorScheme="red"
              variant="ghost"
              size="sm"
              borderRadius="xl"
              onClick={handleLogout}
              flex={isCollapsed ? 'none' : 2}
              w={isCollapsed ? 'full' : 'auto'}
              justifyContent="center"
              fontSize="xs"
              _hover={{ bg: useColorModeValue('red.50', 'rgba(239, 68, 68, 0.15)') }}
            >
              {!isCollapsed && <Text>Logout</Text>}
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}

