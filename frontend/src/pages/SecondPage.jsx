import React, { useState } from "react";
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  HStack,
  Divider,
  Collapse,
  useDisclosure,
  Card,
  CardBody,
  IconButton,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SecondPage = () => {
  const { isOpen, onToggle } = useDisclosure();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const bgColor = useColorModeValue("gray.100", "gray.800");
  const cardBgColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

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
        zIndex="9999"  // Ensure it's above all other content
      />

      {/* Main Content Layout */}
      <HStack
        spacing={6}
        align="start"
        flexDirection={{ base: "column", md: "row" }}
        flex="1"
      >
        {/* Video Section */}
        <Box
      flex="1"
      w="full"
      bg={cardBgColor}
      borderRadius="md"
      p={4}
      boxShadow="md"
      mt={4} // Adds margin-top to move it downward
    >
      <Text mb={2} fontSize="lg" fontWeight="bold">
        Tutorial Video:
      </Text>
      <Box
        position="relative"
        pb="56.25%" // This maintains a 16:9 aspect ratio
        height="0"
        overflow="hidden"
      >
        <iframe
          src="https://www.youtube.com/embed/QU0KZx7mOdQ"
          title="Tutorial Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "8px",
            outline: "none",
          }}
        ></iframe>
      </Box>
    </Box>

        {/* Content Section */}
        <VStack flex="1" spacing={4} align="stretch">
          {/* Big Info Card */}
          <Card bg={cardBgColor} boxShadow="lg" mb={4}>
            <CardBody>
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                About Trade Ethiopia
              </Text>
              <Text>
                Trade Ethiopia is an all-in-one online Business-to-Business portal for samll, medium, and large-Scale businesses based in Ethiopia and around the globe with over 1 million registered users.
              </Text>
            </CardBody>
          </Card>

          {/* Collapsible Detail Section */}
          <Box>
            <Button
              onClick={onToggle}
              variant="outline"
              colorScheme="purple"
              w="full"
              mb={2}
              _hover={{
                backgroundColor: "purple.500",
                color: "white",
                transform: "scale(1.05)",
              }}
            >
              {isOpen ? "Hide Details" : "Show Details"}
            </Button>
            <Collapse in={isOpen} animateOpacity>
              <Box
                p={4}
                bg={cardBgColor}
                borderRadius="md"
                boxShadow="md"
              >
                <Text>
                <Heading as="h3" size="md" mb={2} fontWeight="bold">
        What We Do?
      </Heading>
                Trade Ethiopia assists buyers and sellers to connect with each other through our
online portal. we deliver comprehensive business solutions to domestics and
global business Communities through a side array of online services, as well as
facilitate trade promotional events, all of which support manufacturers, suppliers,
wholesalers, exporters, and others to grow their businesses. Moreover, our
participation in intra-African Trade through the African Continental Free Trade Area
(AfCFTA) has boosted trade and broadened economic integration for businesses.
Essentially, businesses receive exposure to current markets and create a local,
regional and international business network through our sage and sercure online
environment

<Heading as="h3" size="md" mb={2} fontWeight="bold">
        Our Online Portal
      </Heading>
Trade Ethiopia B2B online portal provides a single platform to all businesses
for the online promotion of its products an services. Our secured portal is an
ideal forum for buyers and sellers across the globe to interact with each other
and conduct business smoothly, transparently, and effectively. Trade Ethiopia
has witnessed rapid growth in terms of site traffic, including page views,
visitors, searches , and registration. Our portal provides the opportunity for
parties to meet and work together towards accomplishing mutual goals,
maximizing trade and business value, while cultivating a strong brand image for
businesses

                </Text>
                <Box
    mt="auto"
    py={4}
    bg={useColorModeValue("gray.200", "gray.700")}
    color={useColorModeValue("gray.800", "white")}
    textAlign="center"
  >
    <Text fontSize="sm">
      <strong>Contact Us:</strong><br />
      Phone: +2519292243367, +251904944444, +251904004400<br />
      Website: <a href="https://www.tradethiopia.com" target="_blank" rel="noopener noreferrer">www.tradethiopia.com</a><br />
      Email: <a href="mailto:md@tradethiopia.com">md@tradethiopia.com</a><br />
      Location: Bole Medhanealem, Helezer Tower, 8th Floor
    </Text>
  </Box>
                {/* <Heading as="h3" size="md" mb={2} fontWeight="bold">
        Our website WWW.tradethiopia.com
      </Heading> */}
              </Box>
            </Collapse>
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
              Core Values
              </Text>
              <Text>
              Reliability in devlivering high-quality B2B services.<br />
              Supporting clients in building sustainable business operation.<br />
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
               Our Mission
              </Text>
              <Text>
                To connect businesses effectively to maximize opportunities.
              </Text>
            </Box>

          </HStack>
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
               Our Vision
              </Text>
              <Text>
                To become Africa's leading B2B company by 2030.
              </Text>
            </Box>
          </HStack>

        </VStack>
      </HStack>

      {/* Navigation Buttons */}
      <HStack justify="space-between" mt={6} w="full">
        <Button
          colorScheme="purple"
          variant="outline"
          onClick={() => navigate("/employee-file-upload")}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
        >
          ← Back to Documents
        </Button>
        <Button
          colorScheme="purple"
          onClick={() => navigate("/thirdpage")}
          _hover={{ backgroundColor: "purple.600", color: "white" }}
        >
          Next →
        </Button>
      </HStack>
    
    {/* Footer */}
    {/* <Box
    mt="auto"
    py={4}
    bg={useColorModeValue("gray.200", "gray.700")}
    color={useColorModeValue("gray.800", "white")}
    textAlign="center"
  >
    <Text fontSize="sm">
      <strong>Contact Us:</strong><br />
      Phone: +2519292243367, +251904944444, +251904004400<br />
      Website: <a href="https://www.tradethiopia.com" target="_blank" rel="noopener noreferrer">www.tradethiopia.com</a><br />
      Email: <a href="mailto:md@tradethiopia.com">md@tradethiopia.com</a><br />
      Location: Bole Medhanealem, Helezer Tower, 8th Floor
    </Text>
  </Box> */}
</Box>

  );
};

export default SecondPage;
