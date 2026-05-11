
import {
    Container,
    Flex,
    Text,
    HStack,
    Button,
    useColorMode,
    Avatar,
    Box,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Divider,
    Badge,
    VStack,
    useColorModeValue
} from "@chakra-ui/react";
import { BsBell, BsChat } from "react-icons/bs";
import { IoMoon } from "react-icons/io5";
import { SunIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useEffect, useState } from "react";
import ChatLauncher from "./chat/ChatLauncher";

const NavbarPage = ({ sidebarWidth = "0px" }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const gradient = useColorModeValue(
        "linear(to-r,rgb(11, 11, 25),rgb(47, 24, 174))",
        "linear(to-r, #0f172a, #111827)"
    );
    const textColor = useColorModeValue("gray.900", "gray.100");
    const borderColor = useColorModeValue("rgba(15,23,42,0.8)", "rgba(255,255,255,0.2)");
    const toggleLabel = colorMode === "light" ? "Switch to dark theme" : "Switch to light theme";
    const navigate = useNavigate();
    const currentUser = useUserStore((state) => state.currentUser);
    const users = useUserStore((state) => state.users);
    const [notifications, setNotifications] = useState([]);

    const clearUser = useUserStore((state) => state.clearUser);

    const handleLogout = () => {
        // Use the Zustand store to clear user state (also clears localStorage)
        if (typeof clearUser === 'function') clearUser();
        // Navigate to login
        navigate('/login');
    };

    useEffect(() => {
        const pendingNotifications = users.filter(user => user.infoStatus === 'pending');
        setNotifications(pendingNotifications);
    }, [users]);

    const navigateToUser = (userId) => {
        navigate("/users");
    };

    return (
        <Container
            maxW="100%"
            px={4}
            py={2}
            bgGradient={gradient}
            color={textColor}
            zIndex="20"
            position="fixed"
            top="0"
            left={sidebarWidth}
            width={`calc(100% - ${sidebarWidth})`}
            boxShadow="lg"
            transition="background 0.3s ease"
            borderBottomWidth="1px"
            borderBottomColor={borderColor}
        >
            <Flex
                h="52px"
                alignItems="center"
                justifyContent="space-between"
                px={3}
                flexDir={{ base: "column", sm: "row" }}
            >
                {/* Dashboard Title */}
                <Flex direction="row" alignItems="center">
                    <Text
                        fontSize="24px"
                        fontWeight="bold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="white"
                        textShadow="0 2px 8px rgba(241, 233, 233, 0.35)"
                    >
                        Dashboard
                    </Text>
                </Flex>
{/* Navigation Icons */}
                <HStack spacing={4} alignItems="center">
                    {/* Notifications Dropdown */}
                    <Menu>
                        <MenuButton as={Button} variant="ghost">
                            <BsBell color="inherit" />
                            {notifications.length > 0 && (
                                <Badge ml={1} colorScheme="red">
                                    {notifications.length}
                                </Badge>
                            )}
                        </MenuButton>
                        <MenuList p={3} minW="250px" boxShadow="lg">
                            <Text fontWeight="bold" mb={2}>Notifications</Text>
                            <Divider />
                            {notifications.length === 0 ? (
                                <Text mt={2} textAlign="center">No new notifications</Text>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    {notifications.map(user => (
                                        <Box
                                            key={user._id}
                                            p={2}
                                            borderRadius="md"
                                            bg="gray.100"
                                            cursor="pointer"
                                            _hover={{ bg: "gray.200" }}
                                            onClick={() => navigateToUser(user._id)}
                                        >
                                            <HStack>
                                                <Avatar size="sm" name={user.username} src={user.photoURL} />
                                                <Box>
                                                    <Text fontWeight="bold">{user.username}</Text>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {user.infoStatus}
                                                    </Text>
                                                </Box>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </MenuList>
                    </Menu>

                    {/* Messages Dropdown */}
                    <ChatLauncher
                        icon={<BsChat color="inherit" />}
                        iconButtonProps={{ variant: "ghost", color: "white" }}
                    />

                    {/* User Profile Dropdown */}
                    <Menu>
                        <MenuButton as={Avatar} size="sm" name={currentUser?.username} src={currentUser?.photoURL} />
                        <MenuList>
                            <Box p={3} textAlign="center">
                                <Avatar size="lg" name={currentUser?.username} src={currentUser?.photoURL} mb={2} />
                                <Text fontSize="lg" fontWeight="bold">{currentUser?.username}</Text>
                                <Text fontSize="md">Role: {currentUser?.role}</Text>
                            </Box>
                            <Divider />
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </MenuList>
                    </Menu>


{/* Dark Mode Toggle */}
                    <IconButton
                        icon={colorMode === "light" ? <IoMoon /> : <SunIcon />}
                        onClick={toggleColorMode}
                        variant="solid"
                        colorScheme={colorMode === "light" ? "purple" : "yellow"}
                        aria-label={toggleLabel}
                        rounded="full"
                        boxShadow="md"
                        size="md"
                    />
                </HStack>
            </Flex>
        </Container>
    );
};

export default NavbarPage;
