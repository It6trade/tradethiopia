import {
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
    useColorModeValue,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Icon,
    Kbd,
} from "@chakra-ui/react";
import { BsBell, BsChat } from "react-icons/bs";
import { IoMoon } from "react-icons/io5";
import { SunIcon } from "@chakra-ui/icons";
import { FiSearch, FiUser, FiLogOut } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useEffect, useState } from "react";
import ChatLauncher from "./chat/ChatLauncher";
import NotificationBall from "./notifications/NotificationBall";

/* ─── route → breadcrumb name map ─── */
const routeNameMap = {
    "/dashboard": "Overview",
    "/profile": "HR Profile",
    "/users": "Account Management",
    "/assets": "Asset Management",
    "/attendance": "Attendance",
    "/candidate-pool": "Recruitment",
    "/hr-training": "Onboarding",
    "/FollowUpList": "Follow-Up Records",
    "/leave-management": "Leave Management",
    "/awards": "Performance",
    "/payroll": "Payroll",
    "/course": "Training",
    "/chat": "Announcements",
    "/documentlist": "Documents",
    "/EmployeeDocument": "Employee Documents",
    "/employee-requests": "Employee Requests",
    "/quiz": "Quiz Center",
    "/resources": "Resources",
    "/CustomerFollowUpForm": "Customer Follow-Up",
    "/CustomerFollowup": "Customer Follow-Up",
};

const getPageName = (pathname) => {
    // Exact match first
    if (routeNameMap[pathname]) return routeNameMap[pathname];
    // Prefix match
    for (const [route, name] of Object.entries(routeNameMap)) {
        if (pathname.startsWith(route + "/")) return name;
    }
    return "Dashboard";
};

const NavbarPage = ({ sidebarWidth = "0px" }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const bg = useColorModeValue("white", "rgba(15, 23, 42, 0.95)");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const borderColor = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
    const toggleLabel = colorMode === "light" ? "Switch to dark theme" : "Switch to light theme";
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useUserStore((state) => state.currentUser);
    const users = useUserStore((state) => state.users);
    const [notifications, setNotifications] = useState([]);

    const clearUser = useUserStore((state) => state.clearUser);

    const handleLogout = () => {
        if (typeof clearUser === 'function') clearUser();
        navigate('/login');
    };

    useEffect(() => {
        const pendingNotifications = users.filter(user => user.infoStatus === 'pending');
        setNotifications(pendingNotifications);
    }, [users]);

    const navigateToUser = (userId) => {
        navigate("/users");
    };

    const extraNotifications = [
        ...notifications.map((user) => ({
            id: `user-${user._id}`,
            text: `${user.username} has HR verification pending approval`,
            type: "general",
            read: false,
        })),
    ];

    const pageName = getPageName(location.pathname);

    return (
        <Box
            px={5}
            py={0}
            bg={bg}
            color={textColor}
            zIndex="20"
            position="fixed"
            top="0"
            left={sidebarWidth}
            width={`calc(100% - ${sidebarWidth})`}
            borderBottom="1px solid"
            borderBottomColor={borderColor}
            transition="all 0.25s ease"
        >
            <Flex
                h="56px"
                alignItems="center"
                justifyContent="space-between"
            >
                {/* Left: Breadcrumb */}
                <HStack spacing={2} flexShrink={0}>
                    <Text
                        fontSize="13px"
                        fontWeight="500"
                        color={useColorModeValue("gray.400", "gray.500")}
                    >
                        HR Workspace
                    </Text>
                    <Text fontSize="13px" color={useColorModeValue("gray.300", "gray.600")}>/</Text>
                    <Text
                        fontSize="13px"
                        fontWeight="700"
                        color={useColorModeValue("gray.800", "white")}
                    >
                        {pageName}
                    </Text>
                </HStack>

                {/* Center: Global Search */}
                <InputGroup maxW="420px" size="sm" mx={6} display={{ base: "none", md: "flex" }}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color="gray.400" boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                        placeholder="Search employees, assets, documents..."
                        borderRadius="lg"
                        bg={useColorModeValue("gray.50", "gray.800")}
                        border="1px solid"
                        borderColor={useColorModeValue("gray.200", "gray.700")}
                        fontSize="xs"
                        _placeholder={{ color: "gray.400" }}
                        _focus={{ borderColor: "green.400", boxShadow: "0 0 0 1px #2d6a4f" }}
                    />
                    <InputRightElement width="auto" pr={2}>
                        <HStack spacing={0.5}>
                            <Kbd fontSize="9px" bg={useColorModeValue("gray.100", "gray.700")} borderRadius="md" px={1.5} py={0.5} color="gray.500">⌘</Kbd>
                            <Kbd fontSize="9px" bg={useColorModeValue("gray.100", "gray.700")} borderRadius="md" px={1.5} py={0.5} color="gray.500">K</Kbd>
                        </HStack>
                    </InputRightElement>
                </InputGroup>

                {/* Right: Actions */}
                <HStack spacing={3} alignItems="center" flexShrink={0}>
                    <NotificationBall extraNotifications={extraNotifications} />

                    <ChatLauncher
                        icon={<BsChat size="16" />}
                        iconButtonProps={{ variant: "ghost", color: useColorModeValue("gray.500", "gray.400"), size: "sm" }}
                    />

                    {/* User Profile Dropdown */}
                    <Menu>
                        <MenuButton cursor="pointer">
                            <HStack spacing={2}>
                                <Avatar size="sm" name={currentUser?.fullName || currentUser?.username} src={currentUser?.photoUrl || currentUser?.photo || currentUser?.photoURL} />
                                <Box display={{ base: "none", lg: "block" }}>
                                    <Text fontSize="xs" fontWeight="700" lineHeight="short" color={useColorModeValue("gray.800", "white")}>
                                        {currentUser?.fullName || currentUser?.username}
                                    </Text>
                                    <Badge fontSize="9px" colorScheme="green" variant="subtle" borderRadius="full" px={1.5} textTransform="capitalize">
                                        {currentUser?.role}
                                    </Badge>
                                </Box>
                            </HStack>
                        </MenuButton>
                        <MenuList borderRadius="xl" boxShadow="lg" border="1px solid" borderColor={useColorModeValue("gray.100", "gray.700")} p={2}>
                            <Box p={3} textAlign="center">
                                <Avatar size="lg" name={currentUser?.fullName || currentUser?.username} src={currentUser?.photoUrl || currentUser?.photo || currentUser?.photoURL} mb={2} />
                                <Text fontSize="sm" fontWeight="bold">{currentUser?.fullName || currentUser?.username}</Text>
                                <Text fontSize="xs" color="gray.500">{currentUser?.jobTitle || currentUser?.role}</Text>
                            </Box>
                            <Divider />
                            <MenuItem 
                                icon={<Icon as={FiUser} boxSize={4} />} 
                                borderRadius="lg" 
                                fontSize="sm" 
                                mt={1} 
                                onClick={() => navigate("/profile")}
                            >
                                My Profile
                            </MenuItem>
                            <MenuItem 
                                icon={<Icon as={FiLogOut} boxSize={4} />} 
                                borderRadius="lg" 
                                fontSize="sm" 
                                mt={1} 
                                color="red.500" 
                                _hover={{ bg: useColorModeValue("red.50", "red.900") }}
                                onClick={handleLogout}
                            >
                                Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>

                    {/* Dark Mode Toggle */}
                    <IconButton
                        icon={colorMode === "light" ? <IoMoon size="14" /> : <SunIcon boxSize="3.5" />}
                        onClick={toggleColorMode}
                        variant="ghost"
                        aria-label={toggleLabel}
                        rounded="lg"
                        size="sm"
                        color={useColorModeValue("gray.500", "gray.400")}
                        _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.100") }}
                    />
                </HStack>
            </Flex>
        </Box>
    );
};

export default NavbarPage;
