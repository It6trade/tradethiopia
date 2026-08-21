import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Image,
  useBreakpointValue,
  Spinner,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { FaClock, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import { useUserStore } from '../store/user';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { getRoleDashboardPath } from '../utils/dashboardAccess';

const isAccessGranted = (val) =>
  ['on', 'active', 'approved', 'enabled', 'true'].includes(
    String(val || '').trim().toLowerCase()
  );

const WaitingForApproval = () => {
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  const textSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const { currentUser, setCurrentUser, clearUser } = useUserStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkApprovalStatus = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      const { data } = await axiosInstance.get('/users/me');
      const refreshedUser = data?.data;
      if (refreshedUser) {
        setCurrentUser({ ...currentUser, ...refreshedUser, token: currentUser?.token });
        const examApproved = isAccessGranted(refreshedUser.examStatus) || Boolean(refreshedUser.examBypass);
        if (examApproved) {
          toast({
            title: "Access Approved!",
            description: "HR has approved your onboarding. Redirecting to your dashboard...",
            status: "success",
            duration: 3500,
            isClosable: true,
          });
          const targetDashboard = getRoleDashboardPath(refreshedUser.role || currentUser?.role);
          navigate(targetDashboard);
          return;
        }
      }
      if (!silent) {
        toast({
          title: "Still Awaiting Approval",
          description: "HR has not approved exam access yet. Please check back shortly.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error checking status",
          description: error.response?.data?.message || "Please try again.",
          status: "error",
          duration: 3000,
        });
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  // Poll status every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkApprovalStatus(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearUser();
    toast({
      title: "Logged Out",
      description: "Your request is recorded and being reviewed by HR.",
      status: "info",
      duration: 4000,
      isClosable: true,
    });
    navigate('/login');
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      bgGradient="linear(to-r, teal.600, green.600)"
      color="white"
      textAlign="center"
      padding={4}
    >
      <Box mb={6}>
        <Image
          src="./clock.png"
          alt="Waiting for Approval"
          boxSize={{ base: '140px', md: '180px' }}
          marginBottom={4}
        />
      </Box>
      <Heading as="h1" size={headingSize} mb={3}>
        Waiting for HR Approval
      </Heading>
      <Text fontSize={textSize} mb={6} maxW="550px">
        Your onboarding exam has been submitted and notification sent to HR. Once HR verifies and turns Exam Access ON, you can enter the main Dashboard.
      </Text>
      <Flex align="center" mb={6}>
        <Spinner size="md" color="yellow.300" mr={2} />
        <Text fontSize="sm" color="whiteAlpha.900">
          Awaiting HR confirmation...
        </Text>
      </Flex>
      <HStack spacing={4}>
        <Button
          colorScheme="yellow"
          size="md"
          leftIcon={<FaSyncAlt />}
          onClick={() => checkApprovalStatus(false)}
          isLoading={checking}
          loadingText="Checking status..."
        >
          Check Approval Status
        </Button>
        <Button
          variant="outline"
          colorScheme="whiteAlpha"
          color="white"
          size="md"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </HStack>
    </Flex>
  );
};

export default WaitingForApproval;