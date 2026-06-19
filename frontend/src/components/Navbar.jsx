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
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useEffect, useState } from "react";
import ChatLauncher from "./chat/ChatLauncher";
import axiosInstance from "../services/axiosInstance";

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
    const [todayPlans, setTodayPlans] = useState([]);

    const clearUser = useUserStore((state) => state.clearUser);

    const handleLogout = () => {
        // Use the Zustand store to clear user state (also clears localStorage)
        if (typeof clearUser === 'function') clearUser();
        // Navigate to login
        navigate('/login');
    };

    // User info status notifications
    useEffect(() => {
        const pendingNotifications = users.filter(user => user.infoStatus === 'pending');
        setNotifications(pendingNotifications);
    }, [users]);

    // Request browser notification permissions on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    // Fetch incomplete content plans scheduled for today
    useEffect(() => {
        if (!currentUser) return;
        const fetchTodayPlans = async () => {
            try {
                const res = await axiosInstance.get("/api/content-plans");
                const plans = res.data?.data || res.data || [];
                const todayString = new Date().toDateString();
                const todayIncomplete = plans.filter((p) => {
                    if (!p.scheduledDate || p.completed) return false;
                    return new Date(p.scheduledDate).toDateString() === todayString;
                });
                setTodayPlans(todayIncomplete);
            } catch (error) {
                console.error("Failed to fetch today's content plans for navbar", error);
            }
        };
        fetchTodayPlans();

        // Listen for internal content plan updates to immediately sync navbar counts
        window.addEventListener("contentPlansUpdated", fetchTodayPlans);

        const interval = setInterval(fetchTodayPlans, 60000);
        return () => {
            window.removeEventListener("contentPlansUpdated", fetchTodayPlans);
            clearInterval(interval);
        };
    }, [currentUser]);

    // Trigger push notification for today's incomplete plans (once per day session)
    useEffect(() => {
        if (
            todayPlans.length > 0 &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            !sessionStorage.getItem("hasNotifiedToday")
        ) {
            const bullets = todayPlans
                .map((p) => `• [${p.platform.toUpperCase()}] ${p.type}: ${p.title || "Untitled"}`)
                .join("\n");
            new Notification("Action Required: Today's Scheduled Content", {
                body: bullets,
                icon: "/favicon.ico",
                requireInteraction: true,
            });
            sessionStorage.setItem("hasNotifiedToday", "true");
        }
    }, [todayPlans]);

    const navigateToUser = (userId) => {
        navigate("/users");
    };

    const combinedNotificationsCount = notifications.length + todayPlans.length;
    const planBg = useColorModeValue("red.50", "rgba(239, 68, 68, 0.15)");
    const planBorderColor = useColorModeValue("red.200", "rgba(239, 68, 68, 0.3)");
    const planHoverBg = useColorModeValue("red.100", "rgba(239, 68, 68, 0.25)");
    const planTextColor = useColorModeValue("red.800", "red.200");

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
                        <MenuButton as={Button} variant="ghost" _hover={{ bg: "whiteAlpha.200" }} _active={{ bg: "whiteAlpha.300" }}>
                            <BsBell color="white" size={18} />
                            {combinedNotificationsCount > 0 && (
                                <Badge ml={1} colorScheme="red" borderRadius="full" px={2} py={0.5}>
                                    {combinedNotificationsCount}
                                </Badge>
                            )}
                        </MenuButton>
                        <MenuList p={3} minW="300px" maxH="400px" overflowY="auto" boxShadow="lg" zIndex="9999">
                            <Text fontWeight="bold" mb={2} fontSize="sm">Notifications</Text>
                            <Divider mb={2} />
                            {combinedNotificationsCount === 0 ? (
                                <Text mt={2} textAlign="center" fontSize="xs" color="gray.500">No new notifications</Text>
                            ) : (
                                <VStack spacing={2} align="stretch">
                                    {/* User Approval Notifications */}
                                    {notifications.map(user => (
                                        <Box
                                            key={user._id}
                                            p={2.5}
                                            borderRadius="md"
                                            bg={useColorModeValue("gray.100", "gray.800")}
                                            borderWidth="1px"
                                            borderColor={useColorModeValue("gray.200", "gray.700")}
                                            cursor="pointer"
                                            _hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
                                            onClick={() => navigateToUser(user._id)}
                                        >
                                            <HStack spacing={2}>
                                                <Avatar size="sm" name={user.username} src={user.photoURL} />
                                                <Box minW="0" flex="1">
                                                    <Text fontWeight="bold" fontSize="xs" isTruncated>{user.username}</Text>
                                                    <Text fontSize="10px" color="gray.500" isTruncated>
                                                        HR Verification Pending Approval
                                                    </Text>
                                                </Box>
                                            </HStack>
                                        </Box>
                                    ))}

                                    {/* Today's Scheduled Content Notifications */}
                                    {todayPlans.map(plan => (
                                        <Box
                                            key={plan._id}
                                            p={2.5}
                                            borderRadius="md"
                                            bg={planBg}
                                            borderWidth="1px"
                                            borderColor={planBorderColor}
                                            cursor="pointer"
                                            _hover={{ bg: planHoverBg }}
                                            onClick={() => {
                                                navigate("/social-media?tab=planner");
                                            }}
                                        >
                                            <HStack spacing={2} align="center">
                                                <Avatar size="xs" name={plan.platform} bg="red.500" color="white" icon={<BsBell />} />
                                                <Box flex="1" minW="0">
                                                    <Text fontWeight="bold" fontSize="xs" isTruncated color={planTextColor}>
                                                        [{plan.platform.toUpperCase()}] {plan.type}
                                                    </Text>
                                                    <Text fontSize="xs" isTruncated color={useColorModeValue("gray.700", "gray.300")}>
                                                        {plan.title || plan.topic || "Untitled Post"}
                                                    </Text>
                                                    <Text fontSize="10px" color="gray.500">
                                                        Today • {plan.slot || "Scheduled"}
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
                        icon={<BsChat color="white" size={18} />}
                        iconButtonProps={{ variant: "ghost", color: "white" }}
                    />

                    {/* User Profile Dropdown */}
                    <Menu>
                        <MenuButton as={Avatar} size="sm" name={currentUser?.username} src={currentUser?.photoURL} cursor="pointer" />
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
