import React from 'react';
import { Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiCheckCircle, FiDollarSign, FiHome, FiSettings } from 'react-icons/fi';

const navItems = [
  { label: 'Home', icon: FiHome, path: '/salesmanager' },
  { label: 'Sales', icon: FiDollarSign, path: '/salesmanager/all-sales' },
  { label: 'Performance', icon: FiBarChart2, path: '/salesmanager/performance' },
  { label: 'Tasks', icon: FiCheckCircle, path: '/salesmanager/tasks' },
  { label: 'Settings', icon: FiSettings, path: '/salesmanager/settings' },
];

const SalesManagerBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeColor = useColorModeValue('#0f766e', '#99f6e4');
  const inactiveColor = useColorModeValue('#64748b', '#cbd5e1');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={20}
      bg={bgColor}
      borderTop="1px solid"
      borderColor={borderColor}
      px={2}
      pt={2}
      pb="calc(8px + env(safe-area-inset-bottom))"
      boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)"
      display={{ base: 'block', md: 'none' }}
    >
      <Flex justify="space-between" align="center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/salesmanager' && location.pathname === '/salesmanager/');

          return (
            <Box
              key={item.path}
              as="button"
              type="button"
              flex="1"
              minW={0}
              borderRadius="xl"
              py={1}
              onClick={() => navigate(item.path)}
              color={isActive ? activeColor : inactiveColor}
            >
              <Flex direction="column" align="center" gap={1}>
                <Icon as={item.icon} boxSize={5} />
                <Text fontSize="10px" fontWeight={isActive ? '700' : '600'} noOfLines={1}>
                  {item.label}
                </Text>
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
};

export default SalesManagerBottomNav;
