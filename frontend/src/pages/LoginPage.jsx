import { useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    HStack,
    IconButton,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    useToast
} from '@chakra-ui/react';
import Particles from 'react-tsparticles';
import { useNavigate } from 'react-router-dom';
import { FaMicrosoft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserStore, normalizeRole } from '../store/user'; // Update the path if necessary
import axiosInstance from '../services/axiosInstance';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const setCurrentUser = useUserStore((state) => state.setCurrentUser);

const handleLogin = async (event) => {
    event?.preventDefault();
    if (isLoggingIn) return;

    try {
        setIsLoggingIn(true);
        const response = await axiosInstance.post('/users/login', { email, password });

        console.log('Login response:', response.data); // Debugging line

        if (response.data.success) {
            // Extract user data and token correctly
            const { user, token } = response.data;
            const { _id, role, status, infoStatus, username, email } = user;

            // Save token and user information in local storage
            setCurrentUser({ username, role, status, infoStatus, token, _id, email });

            // Check user and info statuses
            if (status === 'inactive' && infoStatus === 'active') {
                // If user status is inactive, redirect to /secondpage
                navigate('/secondpage');
            } else if ((status === 'inactive' || status === 'active') && infoStatus !== 'active')  {
                // If info status is inactive, redirect to /employee-info
                navigate('/employee-info');
            } else {
                const normalizedRole = normalizeRole(role);
                // If both are active, redirect based on user role
                switch (normalizedRole) {
                   
                    case 'admin':
                    case 'hr':
                        navigate('/dashboard');
                        break;
                    case 'finance':
                        navigate('/finance-dashboard');
                        break;
                    case 'sales':
                        navigate('/sdashboard');
                        break;
                    case 'salesmanager':
                        navigate('/salesmanager');
                        break;
                    case 'customerservice':
                    case 'customer_service':
                    case 'customersuccessmanager':
                    case 'customer_success_manager':
                        navigate('/Cdashboard');
                        break;
                    case 'coo':
                        navigate('/coo-dashboard');
                        break;
                    case 'reception':
                        navigate('/reception-dashboard');
                        break;
                    case 'tradextv':
                    case 'tetv':
                        navigate('/tradextv-dashboard');
                        break;
                    case 'it':
                        navigate('/it');
                        break;
                    case 'socialmediamanager':
                    case 'socialmedia':
                        navigate('/social-media'); // Add social media role navigation
                        break;
                    case 'supervisor':
                        navigate('/supervisor');
                        break;
                    case 'enisra':
                        navigate('/enisra/dashboard');
                        break;
                    case 'instructor':
                        navigate('/instructor');
                        break;
                    default:
                        navigate('/ComingSoonPage'); // Optional: handle unknown roles
                        break;
                }
            }

            toast({
                title: "Login successful.",
                description: " ",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Login failed.",
                description: response.data.message || "An error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        toast({
            title: "Error.",
            description: error.response?.data?.message || "An error occurred during login.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
    } finally {
        setIsLoggingIn(false);
    }
};

    const particlesOptions = {
        particles: {
            number: { value: 38, density: { enable: true, value_area: 800 } },
            shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
            opacity: { value: 0.32, random: true, anim: { enable: true, speed: 0.45, opacity_min: 0.08, sync: false } },
            size: { value: 2.4, random: true, anim: { enable: true, speed: 3, size_min: 0.1, sync: false } },
            line_linked: { enable: true, distance: 145, color: "#46b8ff", opacity: 0.18, width: 1 },
            move: { enable: true, speed: 0.65, direction: "none", random: true, straight: false, out_mode: "out", bounce: false },
        },
        interactivity: {
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
            },
        },
        retina_detect: true,
    };

    return (
        <Box position="relative" minH="100dvh" bg="#001f4d" overflow="hidden">
            <Particles
                id="particles"
                options={particlesOptions}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '42%' }}
            />
            <Box position="absolute" inset={0} bg="radial-gradient(circle at 52% 13%, rgba(18, 114, 178, 0.35), transparent 26%), linear-gradient(180deg, rgba(0,50,102,0.18) 0%, rgba(0,31,77,0.72) 36%, #001f4d 100%)" />
            <Flex position="relative" zIndex={1} minH="100vh" align="center" justify="center" px={{ base: 0, md: 6 }} py={{ base: 0, md: 8 }}>
            <Flex
                direction="column"
                maxW={{ base: '100%', md: '390px' }}
                w="full"
                minH={{ base: '100dvh', md: '760px' }}
                px={{ base: 5, md: 6 }}
                py={{ base: 0, md: 0 }}
                borderRadius={{ base: 0, md: '26px' }}
                bg="linear-gradient(180deg, rgba(0,39,88,0.58) 0%, rgba(0,31,77,0.94) 44%, #001f4d 100%)"
                boxShadow={{ base: 'none', md: '0 26px 80px rgba(0, 0, 0, 0.34)' }}
                overflow="hidden"
            >
                <Box textAlign="center" pt={{ base: '118px', md: '108px' }} pb={{ base: '86px', md: '82px' }} color="white">
                    <HStack justify="center" spacing={2.5} align="center">
                        <Image src="/logo.png" alt="TradeEthiopia Group" boxSize="58px" objectFit="contain" fallback={<Box />} />
                        <Box textAlign="left">
                            <Text color="white" fontFamily="Georgia, serif" fontSize="28px" fontWeight="900" lineHeight="0.88" letterSpacing="0">
                                TradeEthiopia
                            </Text>
                            <Text color="white" fontFamily="Georgia, serif" fontSize="20px" fontWeight="900" lineHeight="1" letterSpacing="0">
                                GROUP
                            </Text>
                            <Box h="1px" bg="#D99A00" mt="3px" />
                        </Box>
                    </HStack>
                    <Text fontSize="11px" color="#D99A00" fontWeight="800" mt={2}>
                        Connecting Markets, Empowering Business
                    </Text>
                </Box>

                <Box textAlign="center" mb={5}>
                    <Text color="white" fontSize="22px" fontWeight="900" lineHeight="1">Welcome Back!</Text>
                    <Text color="rgba(255,255,255,0.78)" fontSize="12px" fontWeight="700" mt={3}>Sign in to continue to your dashboard</Text>
                </Box>
                <form onSubmit={handleLogin}>
                <FormControl mb={3}>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email or Phone"
                        focusBorderColor="#D99A00"
                        bg="rgba(0, 44, 96, 0.52)"
                        borderColor="rgba(255,255,255,0.24)"
                        _placeholder={{ color: 'rgba(255,255,255,0.72)' }}
                        _hover={{ borderColor: "rgba(255,255,255,0.42)" }}
                        _focus={{ borderColor: "#D99A00", boxShadow: "0 0 0 1px #D99A00" }}
                        color="white"
                        fontSize="12px"
                        fontWeight="700"
                        h="47px"
                        borderRadius="8px"
                        px={4}
                        autoComplete="email"
                    />
                </FormControl>
                <FormControl mb={3}>
                    <InputGroup>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            focusBorderColor="#D99A00"
                            bg="rgba(0, 44, 96, 0.52)"
                            borderColor="rgba(255,255,255,0.24)"
                            _placeholder={{ color: 'rgba(255,255,255,0.72)' }}
                            _hover={{ borderColor: "rgba(255,255,255,0.42)" }}
                            _focus={{ borderColor: "#D99A00", boxShadow: "0 0 0 1px #D99A00" }}
                            color="white"
                            fontSize="12px"
                            fontWeight="700"
                            h="47px"
                            borderRadius="8px"
                            px={4}
                            autoComplete="current-password"
                        />
                        <InputRightElement h="47px">
                            <IconButton
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                icon={showPassword ? <FiEyeOff /> : <FiEye />}
                                variant="ghost"
                                size="sm"
                                color="rgba(255,255,255,0.78)"
                                onClick={() => setShowPassword((value) => !value)}
                            />
                        </InputRightElement>
                    </InputGroup>
                </FormControl>
                <Flex align="center" justify="space-between" mb={6}>
                    <Checkbox size="sm" colorScheme="yellow" borderColor="rgba(255,255,255,0.65)">
                        <Text fontSize="11px" color="rgba(255,255,255,0.78)" fontWeight="700">Remember me</Text>
                    </Checkbox>
                    <Button variant="link" size="xs" color="#D99A00" fontWeight="900">Forgot Password?</Button>
                </Flex>
                <Button
                    type="submit"
                    w="full"
                    bg="#D99A00"
                    color="white"
                    h="50px"
                    borderRadius="8px"
                    fontSize="13px"
                    fontWeight="900"
                    _hover={{ bg: '#C98D00', transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(217,154,0,0.28)' }}
                    isLoading={isLoggingIn}
                    isDisabled={!email.trim() || !password}
                >
                    Sign In
                </Button>
                </form>
                <HStack my={6}>
                    <Divider borderColor="rgba(255,255,255,0.18)" />
                    <Text color="rgba(255,255,255,0.72)" fontSize="12px" fontWeight="700" whiteSpace="nowrap">or continue with</Text>
                    <Divider borderColor="rgba(255,255,255,0.18)" />
                </HStack>
                <HStack justify="center" spacing={6}>
                    <Button w="52px" h="52px" minW="52px" p={0} borderRadius="full" bg="white" borderWidth="1px" borderColor="rgba(255,255,255,0.35)" boxShadow="0 10px 24px rgba(0,0,0,0.18)" fontSize="25px">
                        <FcGoogle />
                    </Button>
                    <Button w="52px" h="52px" minW="52px" p={0} borderRadius="full" bg="white" borderWidth="1px" borderColor="rgba(255,255,255,0.35)" boxShadow="0 10px 24px rgba(0,0,0,0.18)" fontSize="20px">
                        <FaMicrosoft color="#00A4EF" />
                    </Button>
                </HStack>
                <Text textAlign="center" mt="auto" pb={{ base: 8, md: 7 }} pt={16} fontSize="12px" color="rgba(255,255,255,0.78)" fontWeight="700">
                    Don't have an account? <Box as="span" color="#D99A00" fontWeight="900">Sign Up</Box>
                </Text>
            </Flex>
            </Flex>
        </Box>
    );
};

export default LoginPage;
