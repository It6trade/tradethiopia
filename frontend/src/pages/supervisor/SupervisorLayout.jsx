import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiBell, FiLogOut, FiMessageSquare, FiMoon, FiSun } from 'react-icons/fi';
import { SUPERVISOR_ROLE } from './supervisorRole';
import SupervisorSidebar from './SupervisorSidebar';
import { useUserStore } from '../../store/user';
import { useNavigate, Outlet } from 'react-router-dom';
import ChatLauncher from '../../components/chat/ChatLauncher';

const SupervisorLayout = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <Flex minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SupervisorSidebar />
      <Box flex="1" px={{ base: 4, md: 6 }} py={5}>
        <Flex
          align="center"
          justify="space-between"
          mb={6}
          p={4}
          borderRadius="lg"
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="sm"
        >
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Supervisor Dashboard
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiLogOut />}
              colorScheme="red"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
            <IconButton
              aria-label="Theme toggle"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              size="sm"
            />
            <Badge colorScheme="green" variant="subtle">
              On Duty
            </Badge>
            <ChatLauncher
              icon={<FiMessageSquare />}
              ariaLabel="Open supervisor workspace chat"
              iconButtonProps={{
                size: 'sm',
                variant: 'ghost',
                borderRadius: 'full',
              }}
            />
            <IconButton
              aria-label="Notifications"
              icon={<FiBell />}
              size="sm"
              variant="ghost"
            />
            <Avatar name="Supervisor Lead" size="sm" />
          </HStack>
        </Flex>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default SupervisorLayout;
