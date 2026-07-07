import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Heading, Text, Stack, Icon, useBreakpointValue, useToast } from '@chakra-ui/react';
import { FaInstagram, FaTwitter, FaFacebookF } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { normalizeRole, useUserStore } from '../store/user';

const ComingSoonPage = () => {
  const [timeLeft, setTimeLeft] = useState({});
  const targetDate = new Date('2025-02-28T00:00:00'); // Set your target launch date here
  const toast = useToast();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    const role = normalizeRole(currentUser?.displayRole || currentUser?.role || localStorage.getItem('userRoleRaw') || localStorage.getItem('userRole'));
    if (['it', 'itmanager', 'itteamleader', 'itstaff'].includes(role)) {
      navigate('/it', { replace: true });
    }
  }, [currentUser, navigate]);

  // Countdown Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleLogout = () => {
    // Perform logout logic here, for example clearing tokens or calling an API.
    // For now, it will just show a toast notification.
    toast({
      title: 'Logged Out',
      description: 'You have successfully logged out.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate('/login');
  };

  return (
    <Box 
      w="100%" 
      h="100vh" 
      bgGradient="linear(to-r, teal.400, purple.500)" 
      color="white"
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      position="relative"
    >
      {/* Logout Button */}
      <Button 
        position="absolute" 
        top={4} 
        right={4} 
        colorScheme="red" 
        size="lg"
        fontSize="lg"
        borderRadius="full"
        _hover={{ bg: 'red.600' }}
        onClick={() => navigate("/login")}
      >
        Logout
      </Button>

      <Container centerContent>
        <Box textAlign="center" maxW="lg">
          <Heading as="h1" fontSize={['4xl', '5xl']} mb={4}>
            We're launching soon!
          </Heading>
          <Text fontSize={['lg', 'xl']} mb={6}>
            Our system is under development. Stay tuned for something amazing.
          </Text>

          <Box display="flex" justifyContent="center" mb={6}>
            <Stack direction="row" spacing={6}>
              <Text fontSize="lg" fontWeight="bold">Time left:</Text>
              <Text fontSize="lg" fontWeight="bold">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </Text>
            </Stack>
          </Box>

          <Box mb={6}>
            <Text fontSize="lg">Follow us on social media</Text>
            <Stack direction="row" spacing={6} justify="center" mt={4}>
              <Icon as={FaInstagram} boxSize={8} cursor="pointer" />
              <Icon as={FaTwitter} boxSize={8} cursor="pointer" />
              <Icon as={FaFacebookF} boxSize={8} cursor="pointer" />
            </Stack>
          </Box>

          <Text fontSize="sm" color="gray.400">
            &copy; {new Date().getFullYear()} Tradethiopia. All Rights Reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default ComingSoonPage;
