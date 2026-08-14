import { Box, Flex } from "@chakra-ui/react";
import NavbarPage from "./Navbar";
import Sidebar from "./Sidebar";
import { useState } from "react";

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? "50px" : "200px";
  const contentWidth = `calc(100% - ${sidebarWidth})`;

  return (
      <Flex direction="column" minHeight="100vh">
      <NavbarPage sidebarWidth={sidebarWidth} />
      
      <Flex flex="1" mt="52px">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          topOffset="52px"
        />
        
        <Box 
          flex="1" 
          ml={sidebarWidth}
          width={contentWidth}
          minWidth={0}
          transition="margin-left 0.3s"
          p={4}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;
