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

  const pageBg = useColorModeValue("#f8fafc", "#090d1a");
  const sidebarWidth = isSidebarCollapsed ? "78px" : "250px";

  useEffect(() => {
    try {
      localStorage.setItem("customerSidebarCollapsed", String(isSidebarCollapsed));
    } catch (error) {
      // Ignore storage errors
    }
  }, [isSidebarCollapsed]);

  return (
    <Box height="100vh" width="100vw" overflow="hidden" display="flex" bg={pageBg}>
      {/* 1. DESKTOP FULL-HEIGHT SIDEBAR */}
      {!hideSidebar && (
        <Box
          width={sidebarWidth}
          minWidth={sidebarWidth}
          height="100vh"
          transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          display={{ base: "none", md: "block" }}
          zIndex="1000"
          flexShrink={0}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            activeSection={activeSection}
            onSelectSection={onSelectSection}
          />
        </Box>
      )}

      {/* 2. MOBILE DRAWER SIDEBAR */}
      {!hideSidebar && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent p={0}>
            <Sidebar
              isCollapsed={false}
              toggleCollapse={onClose}
              activeSection={activeSection}
              onSelectSection={(section) => {
                if (typeof onSelectSection === "function") {
                  onSelectSection(section);
                }
                onClose();
              }}
            />
          </DrawerContent>
        </Drawer>
      )}

      {/* 3. RIGHT COLUMN: TOP NAVBAR + SCROLLABLE MAIN CONTENT */}
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        height="100vh"
        minWidth={0}
        overflow="hidden"
      >
        {/* Top Navbar */}
        <Cnavbar
          onToggleSidebar={onOpen}
          activeSectionTitle={activeSection}
        />

        {/* Scrollable Content View */}
        <Box
          flex="1"
          overflowY="auto"
          bg={pageBg}
          css={{
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { background: "rgba(148, 163, 184, 0.25)", borderRadius: "4px" },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

