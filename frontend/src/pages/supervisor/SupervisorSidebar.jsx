import React from 'react';
import {
  Box,
  Divider,
  Flex,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
  FiArchive,
  FiBarChart2,
  FiHome,
  FiMail,
  FiMessageSquare,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';

const navItems = [
  { label: 'Dashboard', icon: FiHome, path: '/supervisor' },
  { label: 'Requests', icon: FiMail, path: '/supervisor/requests' },
  { label: 'Notice Board', icon: FiMessageSquare, path: '/supervisor/notice-board' },
  { label: 'Revenue & Expense', icon: FiBarChart2, path: '/supervisor/revenue-expense' },
  { label: 'Reports', icon: FiBarChart2, path: '/supervisor/reports' },
  { label: 'Teams', icon: FiUsers, path: '/supervisor/teams' },
  { label: 'Archive', icon: FiArchive, path: '/supervisor/archive' },
  { label: 'Settings', icon: FiSettings, path: '/supervisor/settings' },
];

const SupervisorSidebar = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('teal.50', 'teal.900');

  return (
    <Box
      as="nav"
      w="220px"
      px={3}
      py={6}
      borderRight="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      bg={bg}
      minH="100vh"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3}>
        Finance Supervisor
      </Text>
      <Divider mb={4} />
      <Stack spacing={1}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: isActive ? activeBg : 'transparent',
            })}
          >
            <Box as={item.icon} fontSize="18px" />
            <Text fontSize="sm">{item.label}</Text>
          </NavLink>
        ))}
      </Stack>
    </Box>
  );
};

export default SupervisorSidebar;
