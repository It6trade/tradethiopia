import React, { useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,  
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
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
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
  Image
} from "@chakra-ui/react";

import { FaMoon, FaSun } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FourthPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

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
    { title: "PACKAGE  1(ETB 2700.00)", description: "1job match-making per year. 3 months’product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. " },
    { title: "PACKAGE  2(ETB 7500.00)", description: "5 jobs a match-making per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting." },
    { title: "PACKAGE  3(ETB 12,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events." },
    { title: "PACKAGE  4(ETB 17,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation." },
    { title: "PACKAGE  5(ETB 21,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support." },
    { title: "PACKAGE  6(ETB  27,500.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees." },
    { title: "PACKAGE  7(ETB 50,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees. Business Documentary. Quick job matching for accidental/ outsourcing job." },
{ title: "PACKAGE  8(ETB 75,000.00)", description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra’s all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events. Facilitating quarter or annual meeting. 1 professional advertisement brochure. Business profile development. Email marketing consultation. Annual or quarter revenue consultation. Developing Pro-forma. End – to - End documentation support. Consultation on insurance and banking plan for employment life development. Business Training. Facilitating transportation service for employees. Facilitating Uniforms for employees. Business Documentary. Quick job matching for accidental/ outsourcing job. Consulting for removal of unused properties. Facilitating time stamp machine applicability and training on how it operates. Facilitation for hotel service and transportation during field jobs. Staff training and consultation. Before and after employment support/ HR consultancy about employment and job matching. Facilitating participation in one expo." },
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
    {/* Logo Section */}
    <Image
      src="/enisra.jpg"  // Replace with your logo file path
      alt="Enisra Logo"
      boxSize="50px"  // Adjust the size of the logo
    />

    {/* Text Section */}
    <Text fontSize="4xl" fontWeight="bold" textAlign="left">
      Enisra.com
    </Text>
  </HStack>
  
  {/* Divider with glowing border effect */}
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
    <iframe width="560" height="315" src="https://www.youtube.com/embed/gByzPVarqTc?si=IQyRBl_6ZkwIYOFb" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

    {/* "Page Summary" Button under the Video */}
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
    transform: "scale(1.1)", // Adds a scaling effect
    boxShadow: "0 0 10px 0 0 10px rgba(0, 181, 181, 0.8), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)", // Adds a glowing effect
    transition: "all 0.3s ease", // Smooth transition for all properties
  }}
  _active={{
    transform: "scale(1.05)", // Slightly scale down when clicked
    boxShadow: "0 0 15px 0 0 10px rgba(0, 181, 181, 0.8), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)", // Intensify glow on click
  }}
  width="auto"
  p={4} // Padding to make the button look better
  onClick={onOpenDrawer} // Add this line to trigger the drawer opening
>
  Package & Services 
</Button>


    </Box>
  </Box>

  {/* Packages Section */}
  <Box flex="1" w="full" bg={cardBgColor} borderRadius="md" p={4} boxShadow="md">
  <Box flex="1" w="full">
  {/* Packages Section */}
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
  <hr style={{ border: '1px solidrgb(129, 129, 129)', marginTop: '20px', marginBottom: '20px' }} />
</Box>

<Text textAlign="justify">
  For more information, visit our website: <Text as="span" fontWeight="bold" color="blue.500"><a href="http://www.enisra.com" target="_blank" rel="noopener noreferrer">www.enisra.com</a></Text> 
  or contact us via email: <Text as="span" fontWeight="bold" color="blue.500"><a href="mailto:job@enrisra.com">job@enrisra.com</a></Text>
</Text>

 </Box>

 <Divider my={4} />

</Box>
           {/* Cards with Content */}
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
               
 To match Job with Job 
seekers easily<br />
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
               To become the leading Job 
matching company in Ethiopia  
by 2030.

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
    {/* <DrawerHeader></DrawerHeader> */}
    <DrawerBody>
    <Box flex="1" w="full">
    {/* Packages Section */}
    <Box flex="1" w="full" textAlign="center">
  <Text fontSize="2xl" fontWeight="bold" mb={4}>
    Our Packages
  </Text>

  {/* Wave Animation */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1440 320"
    className="wave-animation"
    style={{ width: '100%', height: '50px', marginTop: '-27px' }}
  >
    <path
      fill="purple"
      fillOpacity="0.5"
      d="M0,288L1440,192L1440,320L0,320Z"
      className="wave-path"
    />
  </svg>

  <style jsx>{`
    .wave-animation {
      animation: wave-animation 4s ease-in-out infinite;
    }

    @keyframes wave-animation {
      0% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(30px);
      }
      100% {
        transform: translateX(0);
      }
    }
  `}</style>


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
  borderImage="linear-gradient(to right, #00B5B5, #8A2BE2) 1"
  _hover={{
    borderImage: "linear-gradient(to right, #00B5B5, #8A2BE2) 1", // Darker cyan and purple gradient on hover
    boxShadow: "0 0 10px rgba(0, 181, 181, 0.3), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)",  // Glowing neon cyan and purple effect
    transform: "scale(1.05)", // Slight scaling on hover
    transition: "all 0.3s ease", // Smooth transition for hover effect
  }}
  _focus={{
    borderImage: "linear-gradient(to right, #00B5B5, #8A2BE2) 1", // Focus on the same darker neon gradient
    boxShadow: "0 0 10px rgba(0, 181, 181, 0.3), 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(0, 181, 181, 0.4)", // Glow effect on focus
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
               Office Address: Bole medanialem helezer tower 8 th floor office number 802,803, and 
809
 Phone: +251929243367 +251904004400
 Email:job@enisra.com
 Website: www.enisra.com
 Facebook: facebook/enisra.com
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
          onClick={() => navigate("/exam")}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
        >
          Finish
        </Button>
      </HStack>
    </Box>
  );
};

export default FourthPage;
