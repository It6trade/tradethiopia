// src/components/Navbar.jsx
import { useState } from "react";
import {
  Container,
  Flex,
  Text,
  HStack,
  Button,
  useColorMode,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  Box,
} from "@chakra-ui/react";
import { PlusSquareIcon } from "@chakra-ui/icons";
import { IoMoon } from "react-icons/io5";
import { SunIcon } from "react-icons/sun";
import { BsBell, BsChat } from "react-icons/bs";
import { useNavigate, Link } from "react-router-dom";
import { useUserStore } from '../store/user'; // Adjust the path as necessary
import ChatLauncher from '../chat/ChatLauncher';

const NavbarPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken'); // Adjust if you use a different storage strategy
    navigate('/login');
  };

  const [notifications] = useState([
    "New comment on your post",
    "Your product is shipped",
    "New friend request",
  ]);

  const [messages] = useState([
    "Hey, how are you?",
    "Can we schedule a meeting?",
    "Reminder: Your task deadline is tomorrow",
  ]);

  return (
    <Container maxW="100%" px={4} bg="gray.900" color="white" zIndex="10" position="fixed" top="0">
      <Flex
        h={"50px"}
        alignItems={"center"}
        justifyContent={"space-between"}
        padding={"20px"}
        flexDir={{
          base: "column",
          sm: "row",
        }}
      >
        <Text
          fontSize={{ base: "20", sm: "24" }}
          fontWeight="bold"
          textTransform="uppercase"
          textAlign="center"
          bgGradient="linear(to-l, #36d1dc, #5b86e5)"
          bgClip="text"
        >
          <Link to="/">Dashboard 🖥️</Link>
        </Text>

        <HStack spacing={4} alignItems="center">
          {/* Notifications Dropdown */}
          <Menu>
            <MenuButton as={IconButton} icon={<BsBell />} variant="ghost" color="white" />
            <MenuList>
              {notifications.length === 0 ? (
                <MenuItem>No new notifications</MenuItem>
              ) : (
                notifications.map((notification, index) => (
                  <MenuItem key={index}>{notification}</MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* Messages Dropdown */}
          <ChatLauncher
            icon={<BsChat />}
            iconButtonProps={{ variant: "ghost", color: "white" }}
          />

          {/* Profile Dropdown */}
          <Menu>
            <MenuButton as={Avatar} size="sm" name={currentUser?.username || "User"} src="https://bit.ly/dan-abramov" />
            <MenuList>
              <Box p={4} bg="gray.800" borderRadius="md" boxShadow="lg">
                <Text fontWeight="bold" fontSize="lg">{currentUser?.username || "User"}</Text>
                <Text fontSize="sm" color="gray.400">{currentUser?.role || "Role not available"}</Text>
                <Text fontSize="sm" color="gray.400">{currentUser?.status || "Status not available"}</Text>
                <MenuDivider />
                <Button width="full" variant="link" onClick={() => navigate('/profile')}>View Profile</Button>
                <Button width="full" variant="link" color="red.400" onClick={handleLogout}>Logout</Button>
              </Box>
            </MenuList>
          </Menu>

          {/* Create Button */}
          <Button onClick={() => navigate("/create")} variant="ghost">
            <PlusSquareIcon fontSize={20} />
          </Button>

          {/* Dark/Light Mode Toggle */}
          <Button onClick={toggleColorMode} variant="ghost">
            {colorMode === "light" ? <IoMoon /> : <SunIcon />}
          </Button>
        </HStack>
      </Flex>
    </Container>
  );
};

export default NavbarPage;
