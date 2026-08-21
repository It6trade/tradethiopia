import React, { useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Divider,
  Grid,
  GridItem,
  Card,
  CardBody,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerContent,
  DrawerOverlay,
  DrawerCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  Image,
  useToast,
  Heading,
} from "@chakra-ui/react";

import { FaMoon, FaSun } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import { useUserStore } from "../store/user";

const isTrainingEnabled = (value) =>
  ["on", "active", "approved", "enabled", "true"].includes(
    String(value || "").trim().toLowerCase()
  );

const FourthPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [isCheckingTraining, setIsCheckingTraining] = useState(false);

  const handleFinish = async () => {
    if (isCheckingTraining) return;
    setIsCheckingTraining(true);
    try {
      const { data } = await axiosInstance.get('/users/me');
      const refreshedUser = data?.data;
      
      // Update local store with latest user data
      if (refreshedUser) {
        setCurrentUser({ ...currentUser, ...refreshedUser, token: currentUser?.token });
      }

      if (refreshedUser?.examBypass) {
        navigate('/sdashboard');
        return;
      }

      // Check if HR has already approved Training Access
      if (isTrainingEnabled(refreshedUser?.trainingStatus)) {
        navigate('/exam');
        return;
      }

      // If training status is not approved yet, notify HR & mark tutorial as completed
      try {
        if (currentUser?._id) {
          await axiosInstance.put(`/users/${currentUser._id}`, { trainingStatus: 'completed' });
        }
        
        const empName = refreshedUser?.fullName || currentUser?.fullName || currentUser?.username || 'Employee';
        
        // 1. Direct in-app notification to all Admin & HR users
        await axiosInstance.post('/notifications/notify-hr', {
          title: `Tutorial Completed: ${empName}`,
          message: `Employee ${empName} has completed their tutorial video. Please open Employee Directory and switch Tutorial Permission ON to allow them to take the exam.`,
          category: 'onboarding',
          employeeId: currentUser?._id,
          employeeName: empName,
        });

        // 2. Formal HR Approval Request
        await axiosInstance.post('/requests', {
          department: 'HR',
          title: `Tutorial Completion: ${empName}`,
          details: `Employee ${empName} (${refreshedUser?.role || currentUser?.role || 'Employee'}) has completed their onboarding video tutorial on FourthPage and requires HR approval (Tutorial Permission ON) to proceed to the exam.`,
          priority: 'High',
          requestType: 'Approval',
          requestedBy: empName,
          requestedById: currentUser?._id,
          status: 'Pending',
        });
      } catch (notifyErr) {
        console.log('HR Notification request error:', notifyErr);
      }

      // Display warning toast as expected
      toast({
        title: 'Tutorial Completed — Awaiting HR Approval',
        description: 'HR has been notified of your tutorial completion. Once HR switches Tutorial Permission ON, you can proceed to the exam.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'Unable to verify training access',
        description: error.response?.data?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsCheckingTraining(false);
    }
  };

  const {
    isOpen: isDrawerOpen,
    onOpen: onOpenDrawer,
    onClose: onCloseDrawer,
  } = useDisclosure();
  const {
    isOpen: isModalOpen,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();
  const [selectedPackage, setSelectedPackage] = useState(null);

  const bgColor = useColorModeValue("gray.100", "gray.800");
  const cardBgColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

  const packages = [
    { title: "PACKAGE  1(ETB 2700.00)", description: "1 job match-making per year. 3 months product/service listing on enisra's front page. 1-year advertisement on enisra's all social media." },
    { title: "PACKAGE  2(ETB 7500.00)", description: "5 jobs match-making per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting." },
    { title: "PACKAGE  3(ETB 12,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events." },
    { title: "PACKAGE  4(ETB 17,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation." },
    { title: "PACKAGE  5(ETB 21,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support." },
    { title: "PACKAGE  6(ETB  27,500.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees." },
    { title: "PACKAGE  7(ETB 50,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees. Business Documentary. Quick job matching for accidental/ outsourcing job." },
    { title: "PACKAGE  8(ETB 75,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees. Business Documentary. Quick job matching for accidental/ outsourcing job. Consulting for removal of unused properties. Facilitating time stamp machine applicability and training on how it operates. Facilitation for hotel service and transportation during field jobs. Staff training and consultation. Before and after employment support/ HR consultancy about employment and job matching. Facilitating participation in one expo." },
  ];

  const handleOpenModal = (pkg) => {
    setSelectedPackage(pkg);
    onOpenModal();
  };

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      color={textColor}
      p={8}
      display="flex"
      flexDirection="column"
      transition="all 0.3s ease-in-out"
      position="relative"
    >
      {/* Theme Toggle Icon */}
      <IconButton
        icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
        onClick={toggleColorMode}
        position="fixed"
        top="20px"
        right="20px"
        aria-label="Toggle theme"
        bg="transparent"
        color={textColor}
        _hover={{ backgroundColor: "transparent", transform: "scale(1.1)" }}
        _focus={{ outline: "none" }}
        size="lg"
        zIndex="9999"
      />

      {/* Header Section */}
      <VStack spacing={4} align="left" mb={8}>
        <HStack spacing={4} align="center">
          <Image
            src="/enisra.jpg"
            alt="Enisra Logo"
            boxSize="50px"
          />
          <Text fontSize="4xl" fontWeight="bold" textAlign="left">
            Enisra.com
          </Text>
        </HStack>
        <Divider
          borderColor="purple.500"
          borderWidth={2}
          borderStyle="solid"
          borderImage="linear-gradient(to right, #00B5B5, #8A2BE2) 1"
        />
      </VStack>

      {/* Main Content Layout */}
      <HStack spacing={6} align="start" flexDirection={{ base: "column", md: "row" }} flex="1">
        {/* Video Section */}
        <Box flex="1" w="full" bg={cardBgColor} borderRadius="md" p={4} boxShadow="md">
          <Text mb={2} fontSize="lg" fontWeight="bold">
            Learn More About Us
          </Text>
          <Box w="full" h="315px" position="relative" overflow="hidden" borderRadius="md">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/gByzPVarqTc?si=IQyRBl_6ZkwIYOFb"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </Box>

          <Box mt={4} textAlign="center">
            <Button
              colorScheme="purple"
              bg="transparent"
              borderWidth="1px"
              borderColor="purple.500"
              color="purple.500"
              fontWeight="bold"
              _hover={{
                bg: "transparent",
                color: "white",
                borderColor: "purple.700",
                transform: "scale(1.1)",
                boxShadow: "0 0 10px 0 0 10px rgba(0, 181, 181, 0.8), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)",
                transition: "all 0.3s ease",
              }}
              _active={{
                transform: "scale(1.05)",
                boxShadow: "0 0 15px 0 0 10px rgba(0, 181, 181, 0.8), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)",
              }}
              width="auto"
              p={4}
              onClick={onOpenDrawer}
            >
              Package & Services 
            </Button>
          </Box>
        </Box>

        {/* Packages Section */}
        <Box flex="1" w="full" bg={cardBgColor} borderRadius="md" p={4} boxShadow="md">
          <Box flex="1" w="full">
            <Box flex="1" w="full" textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" mb={4}>
                Who is Enisra?
              </Text>
              <Text textAlign="justify">
                Enisra introduces an innovative job matching platform that leverages a website, mobile application, social media, and a call center to deliver efficient job search and matching services using <strong>9295</strong> SMS subscription. 
                Our primary goal is to enhance the living standards of unemployed and low-income youth and women, with a focus on long-term poverty alleviation.
                Enisra Job Matching offers a comprehensive range of services for employers, including job vacancy advertising, employee training, and organizational consulting. We provide both an unlimited package and a premium unlimited package, tailored to meet your specific needs. Partner with Enisra to streamline your processes and save valuable time.
              </Text>

              <Box my={4}>
                <hr style={{ border: '1px solid rgb(129, 129, 129)', marginTop: '20px', marginBottom: '20px' }} />
              </Box>

              <Text textAlign="justify">
                For more information, visit our website: <Text as="span" fontWeight="bold" color="blue.500"><a href="http://www.enisra.com" target="_blank" rel="noopener noreferrer">www.enisra.com</a></Text> 
                or contact us via email: <Text as="span" fontWeight="bold" color="blue.500"><a href="mailto:job@enrisra.com">job@enrisra.com</a></Text>
              </Text>
            </Box>

            <Divider my={4} />
          </Box>

          <HStack spacing={4} justify="space-between" w="full">
            <Box
              flex="1"
              p={4}
              bg={cardBgColor}
              borderRadius="md"
              textAlign="center"
              boxShadow="lg"
              _hover={{
                transform: "scale(1.05)",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Text fontSize="lg" fontWeight="bold">
                Mission
              </Text>
              <Text>
                To match Job with Job seekers easily<br />
              </Text>
            </Box>
            <Box
              flex="1"
              p={4}
              bg={cardBgColor}
              borderRadius="md"
              textAlign="center"
              boxShadow="lg"
              _hover={{
                transform: "scale(1.05)",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Text fontSize="lg" fontWeight="bold">
                Core Value
              </Text>
              <Text>
                Job seekers first!
              </Text>
            </Box>
          </HStack>

          <Divider mt={2} />

          <HStack spacing={4} justify="space-between" w="full">
            <Box
              flex="1"
              p={4}
              bg={cardBgColor}
              borderRadius="md"
              textAlign="center"
              boxShadow="lg"
              _hover={{
                transform: "scale(1.05)",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Text fontSize="lg" fontWeight="bold">
                Vision
              </Text>
              <Text>
                To become the leading Job matching company in Ethiopia by 2030.
              </Text>
            </Box>
          </HStack>
        </Box>
      </HStack>

      {/* Modal for Package Details */}
      <Modal isOpen={isModalOpen} onClose={onCloseModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedPackage?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{selectedPackage?.description}</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onCloseModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Drawer for Page Summary */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={onCloseDrawer} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>
            <Box flex="1" w="full">
              <Box flex="1" w="full" textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" mb={4}>
                  Our Packages
                </Text>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1440 320"
                  style={{ width: '100%', height: '50px', marginTop: '-27px' }}
                >
                  <path
                    fill="purple"
                    fillOpacity="0.5"
                    d="M0,288L1440,192L1440,320L0,320Z"
                  />
                </svg>
              </Box>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                {packages.map((pkg, index) => (
                  <GridItem key={index}>
                    <Card
                      bg={cardBgColor}
                      boxShadow="lg"
                      h="full"
                      borderWidth="1px"
                      borderStyle="solid"
                      borderColor="purple.400"
                      _hover={{
                        borderColor: "teal.400",
                        boxShadow: "0 0 10px rgba(0, 181, 181, 0.3), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)",
                        transform: "scale(1.03)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <CardBody>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          mb={2}
                          cursor="pointer"
                          _hover={{ color: "teal.500" }}
                          onClick={() => handleOpenModal(pkg)}
                        >
                          {pkg.title}
                        </Text>
                        <Text noOfLines={2}>{pkg.description}</Text>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>

              <Divider my={4} />
              <Heading size={{ base: "md", md: "lg" }} color="purple.700" mt={6} mb={4}>Our Services</Heading>
              <VStack align="start" spacing={2} w="full">
                <Text fontSize={{ base: "sm", md: "md" }}><strong>-  Job Listing</strong></Text>
                <Text fontSize={{ base: "sm", md: "md" }}><strong>- Job Matching</strong></Text>
                <Text fontSize={{ base: "sm", md: "md" }}><strong>- Job Alert</strong></Text>
                <Text fontSize={{ base: "sm", md: "md" }}><strong>- Job guidance</strong> </Text>
                <Text fontSize={{ base: "sm", md: "md" }}><strong>- Job advertising service</strong> </Text>
              </VStack>
            </Box>
            <Divider my={4} />
            <Box
              flex="1"
              p={4}
              bg={cardBgColor}
              borderRadius="md"
              textAlign="center"
              boxShadow="lg"
              _hover={{
                transform: "scale(1.05)",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Text fontSize="lg" fontWeight="bold">
                Contact info
              </Text>
              <Text>
                Office Address: Bole medanialem helezer tower 8 th floor office number 802,803, and 809<br />
                Phone: +251929243367 +251904004400<br />
                Email: job@enisra.com<br />
                Website: www.enisra.com<br />
                Facebook: facebook/enisra.com<br />
                Twitter: @enisra.com
              </Text>
            </Box>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onCloseDrawer}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Navigation Buttons */}
      <HStack justify="space-between" mt={6}>
        <Button
          colorScheme="purple"
          variant="outline"
          onClick={() => navigate(-1)}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
        >
          Back
        </Button>
        <Button
          colorScheme="purple"
          bg="purple.500"
          color="white"
          onClick={handleFinish}
          isLoading={isCheckingTraining}
          loadingText="Checking access"
          _hover={{ backgroundColor: "purple.600", color: "white" }}
        >
          Finish
        </Button>
      </HStack>
    </Box>
  );
};

export default FourthPage;
