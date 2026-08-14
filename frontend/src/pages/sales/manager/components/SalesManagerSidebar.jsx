import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  Icon,
  useColorModeValue,
  Tooltip,
  useColorMode,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart2, 
  FiSettings, 
  FiUser, 
  FiChevronRight, 
  FiChevronLeft,
  FiLogOut, 
  FiMessageSquare, 
  FiDollarSign, 
  FiTrendingUp, 
  FiCalendar, 
  FiPieChart, 
  FiHelpCircle, 
  FiCheckCircle,
  FiClipboard,
  FiBookOpen
} from 'react-icons/fi';

const SalesManagerSidebar = ({ isCollapsed = false, onToggleSidebar }) => {
  const { colorMode } = useColorMode();
  const location = useLocation();
  
  // Color scheme with oceanic gradient
  const bgGradient = useColorModeValue(
    'linear(to-b, #006994, #0077b6, #0096c7, #00b4d8, #48cae4)', // Light mode gradient
    'linear(to-b, #001233, #001845, #002855, #023e7d, #0353a4)'  // Dark mode gradient
  );
  const bgColor = 'transparent';
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)');
  const activeBg = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)');
  const activeColor = useColorModeValue('white', 'white');
  const hoverBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)');
  const textColor = useColorModeValue('white', 'white');
  const logoColor = 'white';
  const dividerColor = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)');

  const LinkItems = [
    { name: 'Dashboard', icon: FiHome, path: '/salesmanager' },
    { name: 'Course', icon: FiBookOpen, path: '/salesmanager/course' },
    { name: 'All Sales', icon: FiDollarSign, path: '/salesmanager/all-sales' },
    { name: 'Performance', icon: FiTrendingUp, path: '/salesmanager/performance' },
    { name: 'KPI', icon: FiBarChart2, path: '/salesmanager/kpi' },
    { name: 'Team Management', icon: FiUsers, path: '/salesmanager/team' },
    { name: 'Task Management', icon: FiCheckCircle, path: '/salesmanager/tasks' },
    { name: 'Reports', icon: FiPieChart, path: '/salesmanager/reports' },
    { name: 'Content Tracker Report', icon: FiClipboard, path: '/salesmanager/content-tracker-report' },
    { name: 'Calendar', icon: FiCalendar, path: '/salesmanager/calendar' },
    { name: 'Notice Board', icon: FiMessageSquare, path: '/salesmanager/messages' },
    { name: 'Settings', icon: FiSettings, path: '/salesmanager/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Box
      h="100vh"
      bgGradient={bgGradient}
      bgSize="100% 100%"
      bgRepeat="no-repeat"
      borderRight="1px"
      borderColor={borderColor}
      zIndex="sticky"
      position="fixed"
      left={0}
      top={0}
      width={isCollapsed ? "70px" : "260px"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      boxShadow="lg"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)',
        zIndex: -1,
      }}
    >
      {/* Logo and Toggle */}
      <Flex 
        h="60px" 
        align="center" 
        justify="space-between" 
        px={4}
        borderBottom="1px"
        borderColor={dividerColor}
      >
        {!isCollapsed && (
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={logoColor}
            whiteSpace="nowrap"
            overflow="hidden"
          >
            Sales Manager
          </Text>
        )}
        <IconButton
          aria-label="Toggle Sidebar"
          icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          _hover={{ bg: hoverBg }}
        />
      </Flex>

      {/* Navigation Links */}
      <VStack 
        spacing={1} 
        p={2} 
        mt={2}
        overflowY="auto"
        h="calc(100% - 140px)"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: colorMode === 'dark' ? '#4a5568' : '#cbd5e0',
            borderRadius: '4px',
          },
        }}
      >
        {LinkItems.map((link) => (
          <NavItem
            key={link.name}
            icon={link.icon}
            path={link.path}
            isActive={isActive(link.path)}
            isCollapsed={isCollapsed}
            activeBg={activeBg}
            activeColor={activeColor}
            hoverBg={hoverBg}
            textColor={textColor}
          >
            {link.name}
          </NavItem>
        ))}
      </VStack>

      {/* User Profile & Actions */}
      <Box 
        p={3} 
        borderTop="1px" 
        borderColor={dividerColor}
        position="absolute"
        bottom="0"
        width="100%"
        bg={bgColor}
      >
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="100%"
            h="auto"
            p={2}
            _hover={{ bg: hoverBg }}
            _active={{ bg: hoverBg }}
          >
            <Flex align="center">
              <Avatar 
                size="sm" 
                name="Sales Manager"
                bg={activeBg}
                color={activeColor}
              />
              {!isCollapsed && (
                <Box ml={3} textAlign="left" flex="1" overflow="hidden">
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium" 
                    color={textColor}
                    isTruncated
                  >
                    Sales Manager
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color="gray.500"
                    isTruncated
                  >
                    Admin
                  </Text>
                </Box>
              )}
            </Flex>
          </MenuButton>
          <MenuList zIndex="popover">
            <MenuItem icon={<FiUser size={16} />}>
              Profile
            </MenuItem>
            <MenuItem icon={<FiSettings size={16} />}>
              Settings
            </MenuItem>
            <MenuItem icon={<FiHelpCircle size={16} />}>
              Help & Support
            </MenuItem>
            <Divider my={1} />
            <MenuItem 
              icon={<FiLogOut size={16} />} 
              color="red.500"
              _hover={{ bg: 'red.50' }}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
};

const NavItem = ({ 
  icon, 
  children, 
  path, 
  isActive, 
  isCollapsed, 
  activeBg, 
  activeColor, 
  hoverBg, 
  textColor,
  ...rest 
}) => {
  return (
    <NavLink to={path} style={{ width: '100%' }}>
      <Tooltip 
        label={children} 
        placement="right" 
        hasArrow 
        isDisabled={!isCollapsed}
        bg="rgba(0, 0, 0, 0.8)"
        color="white"
      >
        <Flex
          align="center"
          p={3}
          mx={2}
          borderRadius="lg"
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : 'rgba(255, 255, 255, 0.9)'}
          _hover={{
            bg: isActive ? activeBg : hoverBg,
            color: 'white',
            transform: 'translateX(4px)',
          }}
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          position="relative"
          {...rest}
        >
          <Icon as={icon} fontSize="lg" />
          {!isCollapsed && (
            <Text 
              ml={4} 
              fontSize="sm" 
              fontWeight={isActive ? "600" : "normal"}
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {children}
            </Text>
          )}
          {isActive && (
            <Box
              position="absolute"
              left="0"
              top="50%"
              transform="translateY(-50%)"
              w="4px"
              h="60%"
              bg={activeColor}
              borderRadius="full"
            />
          )}
        </Flex>
      </Tooltip>
    </NavLink>
  );
};

export default SalesManagerSidebar;
