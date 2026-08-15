import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";

import Sidebar from "./Sidebar";
import Cnavbar from "./customNavbar";

const Layout = ({ children, hideSidebar = false, activeSection, onSelectSection }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("customerSidebarCollapsed") === "true";
    } catch (error) {
      return false;
    }
  });

  const pageBg = useColorModeValue("#f2f6ff", "#0b1224");

  const sidebarWidth = isSidebarCollapsed ? "78px" : "260px";

  useEffect(() => {
    try {
      localStorage.setItem("customerSidebarCollapsed", String(isSidebarCollapsed));
    } catch (error) {
      // Ignore storage errors; the sidebar still works during the session.
    }
  }, [isSidebarCollapsed]);

  return (
    <Box height="100vh" overflow="hidden">

      {/* NAVBAR */}
      <Box position="fixed" top={0} left={0} w="100%" zIndex="1100">
        <Cnavbar onToggleSidebar={onOpen} />
      </Box>

      <Box pt="64px" height="100%">
        {/* DESKTOP SIDEBAR */}
        {!hideSidebar && (
          <Box
            position="fixed"
            top="64px"
            left={0}
            height="calc(100vh - 64px)"
            width={sidebarWidth}
            transition="width .25s ease"
            display={{ base: "none", md: "block" }}
            zIndex="1000"
            overflow="visible"
          >
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              toggleCollapse={() =>
                setSidebarCollapsed((prev) => !prev)
              }
              activeSection={activeSection}
              onSelectSection={onSelectSection}
            />
          </Box>
        )}

        {/* MOBILE DRAWER SIDEBAR */}
        {!hideSidebar && (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <Sidebar
                isCollapsed={false} // mobile always expanded
                toggleCollapse={() => {}}
                activeSection={activeSection}
                onSelectSection={onSelectSection}
              />
            </DrawerContent>
          </Drawer>
        )}

               {/* MAIN CONTENT */}
            <Box
              ml={{
                base: 0,
                md: hideSidebar
                  ? 0
                  : isSidebarCollapsed
                  ? "78px"        // SIDEBAR COLLAPSED WIDTH
                  : "260px",      // SIDEBAR FULL WIDTH
              }}
              transition="all .25s ease"
              bg={pageBg}
              height="calc(100vh - 64px)"
              overflowY="auto"
              p={5}
            >
              {children}
            </Box>

      </Box>
    </Box>
  );
};

export default Layout;
