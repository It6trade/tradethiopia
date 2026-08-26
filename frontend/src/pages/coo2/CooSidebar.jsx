// src/pages/coo2/CooSidebar.jsx
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Avatar,
  Image,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPieChart,
  FiFileText,
  FiBell,
  FiCpu,
  FiChevronDown,
  FiLogOut,
} from 'react-icons/fi';
import { RiBuilding4Line } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from './cooData';

const CooSidebar = ({
  activeTab,
  setActiveTab,
  unreadNotifsCount = 3,
  currentUser,
  collapsed = false,
  selectedDept = 'all',
  setSelectedDept,
  departmentsMenuOpen = false,
}) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'departments', label: 'Departments', icon: RiBuilding4Line, badge: '10 Depts' },
    { id: 'analytics', label: 'Analytics', icon: FiPieChart },
    { id: 'reports', label: 'Reports', icon: FiFileText },
    { id: 'notifications', label: 'Notifications', icon: FiBell, badgeCount: unreadNotifsCount },
    { id: 'agents', label: 'Agents', icon: FiCpu, isAi: true },
  ];

  return (
    <Box
      w={collapsed ? '68px' : '218px'}
      minW={collapsed ? '68px' : '218px'}
      h="100%"
      minH={0}
      bg="#0b132b"
      color="#94a3b8"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={3}
      transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      borderRight="1px solid rgba(255, 255, 255, 0.06)"
      zIndex={20}
      position="relative"
      overflow="hidden"
      flexShrink={0}
    >
      {/* Top Branding */}
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        overflowX="hidden"
        pr={0.5}
        sx={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #0b132b',
          '&::-webkit-scrollbar': { width: '7px', background: '#0b132b' },
          '&::-webkit-scrollbar-track': {
            background: '#0b132b',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#475569',
            border: '1px solid #0b132b',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': { background: '#64748b' },
          '&::-webkit-scrollbar-button': {
            display: 'none',
            width: 0,
            height: 0,
            background: '#0b132b',
          },
          '&::-webkit-scrollbar-corner': { background: '#0b132b' },
        }}
      >
        <Flex
          align="center"
          gap={3}
          px={2}
          py={3}
          mb={6}
          cursor="pointer"
          onClick={() => setActiveTab('departments')}
          borderRadius="12px"
          _hover={{ bg: 'rgba(255, 255, 255, 0.04)' }}
        >
          <Flex
            w="44px"
            h="44px"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Image
              src="/brand/trade-ethiopia-logo.png"
              alt="Trade Ethiopia logo"
              w="44px"
              h="44px"
              objectFit="contain"
            />
          </Flex>

          {!collapsed && (
            <Box overflow="hidden">
              <Text
                fontSize="16px"
                fontWeight="700"
                color="#ffffff"
                letterSpacing="-0.02em"
                whiteSpace="nowrap"
              >
                2 COO
              </Text>
            </Box>
          )}
        </Flex>

        {/* Main Navigation */}
        <VStack align="stretch" spacing={1.5} mb={6}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Box key={item.id}>
                <Tooltip
                  label={collapsed ? item.label : ''}
                  placement="right"
                  hasArrow
                  isDisabled={!collapsed}
                >
                  <Flex
                    align="center"
                    justify={collapsed ? 'center' : 'space-between'}
                    px={3.5}
                    py={2.5}
                    borderRadius="10px"
                    cursor="pointer"
                    bg={isActive ? '#2563eb' : 'transparent'}
                    color={isActive ? '#ffffff' : '#94a3b8'}
                    fontWeight={isActive ? '600' : '500'}
                    fontSize="13.5px"
                    transition="all 0.18s ease"
                    _hover={{
                      bg: isActive ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      transform: 'translateX(2px)',
                    }}
                    onClick={() => setActiveTab(item.id)}
                    position="relative"
                  >
                    <HStack spacing={3}>
                      <Icon
                        as={item.icon}
                        boxSize="18px"
                        color={isActive ? '#ffffff' : item.isAi ? '#a855f7' : '#94a3b8'}
                      />
                      {!collapsed && <Text whiteSpace="nowrap">{item.label}</Text>}
                    </HStack>

                    {!collapsed && (
                      <HStack spacing={1.5}>
                        {item.badge && (
                          <Badge
                            fontSize="10px"
                            bg={isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}
                            color={isActive ? 'white' : '#94a3b8'}
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {item.badgeCount && (
                          <Badge
                            fontSize="10px"
                            bg="#ef4444"
                            color="white"
                            px={1.5}
                            py={0.5}
                            borderRadius="full"
                            boxShadow="0 2px 6px rgba(239, 68, 68, 0.4)"
                          >
                            {item.badgeCount}
                          </Badge>
                        )}
                        {item.id === 'departments' && <Icon as={FiChevronDown} boxSize="14px" />}
                      </HStack>
                    )}
                  </Flex>
                </Tooltip>

                {item.id === 'departments' && isActive && departmentsMenuOpen && !collapsed && (
                  <VStack
                    align="stretch"
                    spacing={0.5}
                    mt={1.5}
                    ml={4}
                    pl={2}
                    borderLeft="1px solid rgba(148, 163, 184, 0.22)"
                  >
                    {DEPARTMENTS.map((department) => {
                      const isSelected = selectedDept === department.id;
                      return (
                        <Flex
                          key={department.id}
                          align="center"
                          gap={2}
                          px={2.5}
                          py={1.7}
                          borderRadius="7px"
                          cursor="pointer"
                          bg={isSelected ? 'rgba(59, 130, 246, 0.18)' : 'transparent'}
                          color={isSelected ? '#ffffff' : '#94a3b8'}
                          fontWeight={isSelected ? '700' : '500'}
                          _hover={{ bg: 'rgba(255, 255, 255, 0.06)', color: '#ffffff' }}
                          onClick={() => setSelectedDept?.(department.id)}
                        >
                          <Box w="7px" h="7px" borderRadius="full" bg={department.color} flexShrink={0} />
                          <Text fontSize="11.5px" isTruncated>{department.name}</Text>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>

      </Box>

      {/* Bottom User Profile */}
      <Box pt={4} borderTop="1px solid rgba(255, 255, 255, 0.06)" flexShrink={0}>
        <Flex
          align="center"
          justify={collapsed ? 'center' : 'space-between'}
          p={collapsed ? 1 : 2.5}
          bg="rgba(255, 255, 255, 0.03)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.05)"
        >
          <HStack spacing={2.5} overflow="hidden">
            <Avatar
              size="sm"
              name="Trade Ethiopia"
              src="/brand/trade-ethiopia-logo.png"
              bg="transparent"
              border="2px solid #c9992a"
            />
            {!collapsed && (
              <Box overflow="hidden">
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color="#ffffff"
                  isTruncated
                >
                  {currentUser?.fullName || 'Executive COO'}
                </Text>
                <Text fontSize="11px" color="#64748b" isTruncated>
                  Operations Director
                </Text>
              </Box>
            )}
          </HStack>

          {!collapsed && (
            <Tooltip label="Switch View / Logout" placement="top">
              <IconButton
                size="xs"
                variant="ghost"
                color="#64748b"
                _hover={{ color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }}
                icon={<FiLogOut />}
                aria-label="Logout"
                onClick={() => navigate('/coo-dashboard')}
              />
            </Tooltip>
          )}
        </Flex>

      </Box>
    </Box>
  );
};

export default CooSidebar;
