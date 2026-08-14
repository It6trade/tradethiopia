import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  useColorModeValue, 
  useBreakpointValue, 
  Drawer, 
  DrawerContent, 
  DrawerOverlay, 
  useDisclosure,
  useColorMode,
  IconButton
} from '@chakra-ui/react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import SalesManagerSidebar from './components/SalesManagerSidebar';
import SalesManagerNavbar from './components/SalesManagerNavbar';
import SalesManagerBottomNav from './components/SalesManagerBottomNav';

const SalesManagerLayout = () => {
  const { colorMode } = useColorMode();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Background colors based on color mode
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const contentBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    if (isMobile) {
      onClose();
    }
  }, [location.pathname, isMobile, onClose]);

  // Responsive sidebar width
  const getSidebarWidth = () => {
    if (isMobile) return '0';
    return isSidebarCollapsed ? '70px' : '260px';
  };

  // Main content margin left
  const getContentMargin = () => {
    if (isMobile) return '0';
    return isSidebarCollapsed ? '70px' : '260px';
  };

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Drawer isOpen={isOpen} onClose={onClose} placement="left">
          <DrawerOverlay>
            <DrawerContent maxW="260px" w="100%">
              <SalesManagerSidebar 
                isCollapsed={false} 
                onToggleSidebar={onClose}
              />
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          as="aside"
          position="fixed"
          left={0}
          top={0}
          bottom={0}
          w={getSidebarWidth()}
          transition="all 0.3s ease"
          zIndex="sticky"
          boxShadow="sm"
        >
          <SalesManagerSidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggleSidebar={toggleSidebar}
          />
        </Box>
      )}

      {/* Main Content */}
      <Box
        as="main"
        flex="1"
        ml={getContentMargin()}
        transition="all 0.3s ease"
        minH="100vh"
        pt="60px"
      >
        {/* Navbar */}
        <SalesManagerNavbar 
          onMenuClick={onOpen} 
          onToggleSidebar={toggleSidebar} 
          isSidebarCollapsed={isSidebarCollapsed} 
        />

        {/* Page Content */}
        <Box
          p={{ base: 4, md: 6 }}
          pb={{ base: 24, md: 6 }}
          bg={contentBg}
          minH={`calc(100vh - 60px)`}
          borderLeftWidth="1px"
          borderColor={borderColor}
        >
          <Outlet />
        </Box>
        {isMobile && <SalesManagerBottomNav />}
      </Box>
    </Flex>
  );
};

export default SalesManagerLayout;