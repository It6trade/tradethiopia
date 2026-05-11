import React from "react";
import {
  Box,
  Flex,
  IconButton,
  Text,
  VStack,
  HStack,
  useColorMode,
  useColorModeValue,
  Switch,
  Button,
  Avatar,
  useToast,
} from "@chakra-ui/react";
import { FiHome, FiClipboard, FiBell, FiLogOut, FiBook, FiMessageSquare } from "react-icons/fi";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useUserStore } from "../../store/user";
import NotesLauncher from "../notes/NotesLauncher";
import ChatLauncher from "../chat/ChatLauncher";

const navItems = [
  { label: "Dashboard", icon: FiHome, to: "/instructor/dashboard" },
  { label: "Request", icon: FiClipboard, to: "/instructor/request" },
  { label: "Notice Board", icon: FiBell, to: "/instructor/notice-board" },
];

const InstructorLayout = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.100", "gray.900");
  const sidebarBg = useColorModeValue("white", "gray.800");
  const activeBg = useColorModeValue("gray.200", "gray.700");
  const renderedContent = children ?? <Outlet />;

  return (
    <Flex bg={bg} minH="100vh" color={useColorModeValue("gray.800", "white")}>
      <Box
        w={{ base: "full", md: "220px" }}
        bg={sidebarBg}
        minH="100vh"
        borderRightWidth="1px"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        px={4}
        py={6}
      >
        <Flex align="center" justify="space-between" mb={6}>
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold">
              Instructor
            </Text>
            <IconButton
              aria-label="Instructor info"
              icon={<FiBook />}
              size="sm"
              variant="ghost"
              colorScheme="teal"
            />
          </HStack>
        </Flex>

        <VStack align="stretch" spacing={2}>
          {navItems.map((item) => (
            <Link key={item.label} to={item.to}>
              <Flex
                p={3}
                borderRadius="md"
                align="center"
                transition="background 0.2s"
                _hover={{ bg: activeBg }}
              >
                <Box as={item.icon} size="18px" mr={3} />
                <Text fontWeight="medium">{item.label}</Text>
              </Flex>
            </Link>
          ))}
        </VStack>
      </Box>

      <Flex direction="column" flex="1">
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          borderBottomWidth="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
          bg={useColorModeValue("white", "gray.800")}
        >
          <Text fontSize="xl" fontWeight="bold">
            Instructor Dashboard
          </Text>
          <HStack spacing={3}>
            <NotesLauncher
              buttonProps={{
                variant: "ghost",
                "aria-label": "Notes",
                size: "sm",
              }}
              tooltipLabel="Notes"
            />
            <ChatLauncher
              icon={<FiMessageSquare />}
              ariaLabel="Open instructor workspace chat"
              iconButtonProps={{
                variant: "ghost",
                size: "sm",
                borderRadius: "full",
              }}
            />
            <Flex align="center">
              <Text fontSize="sm" mr={2}>
                Dark mode
              </Text>
              <Switch
                isChecked={colorMode === "dark"}
                onChange={toggleColorMode}
                colorScheme="purple"
              />
            </Flex>
            <Button
              size="sm"
              leftIcon={<FiLogOut />}
              variant="outline"
              onClick={() => {
                clearUser();
                navigate("/login");
                toast({ title: "Logged out", status: "info", duration: 2000 });
              }}
            >
              Logout
            </Button>
            <Avatar size="sm" name="Instructor" />
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 6 }} flex="1">
          {renderedContent}
        </Box>
      </Flex>
    </Flex>
  );
};

export default InstructorLayout;
