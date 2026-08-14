import React, { useState } from "react";
import {
  Container,
  Flex,
  Box,
  Heading,
  Divider,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  Button,
  useDisclosure,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { RepeatIcon, AddIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";
import AssetForm from "../components/AssetForm"; // Assuming you have this component
import AssetList from "../components/AssetList"; // Assuming you have this component

const AssetManagementPage = () => {
  const [refreshKey, setRefreshKey] = useState(0); // Used to refresh the asset list
  const [filter, setFilter] = useState(""); // For filtering the asset list
  const { isOpen, onOpen, onClose } = useDisclosure(); // For drawer
  const { colorMode, toggleColorMode } = useColorMode(); // Hook for color mode

  // Trigger refresh by updating the refreshKey
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container maxW="7xl" py={10} mt={-75}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        gap={10}
      >
        {/* Right Side: Asset List Section */}
        <Box
          flex="1"
          borderWidth="1px"
          borderRadius="lg"
          padding={6}
          shadow="md"
          bg={useColorModeValue("white", "gray.700")} // Dynamic background color
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>

            <Heading as="h2" size="md"
            fontSize={"30"}
            fontWeight={"bold"}
            color={"teal.600"}
            textAlign={"center"}>
              Asset List Assets 📦
            </Heading>
            {/* Action Buttons: Refresh, Add, and Toggle Theme */}
            <Flex gap={2}>
              <IconButton
                aria-label="Refresh Asset List"
                icon={<RepeatIcon />}
                onClick={handleRefresh}
                colorScheme="teal"
              />
              <IconButton
                aria-label="Add Asset"
                icon={<AddIcon />}
                onClick={onOpen}
                colorScheme="teal"
              />
            </Flex>
          </Flex>
                 
          <Divider mb={4} />
          <AssetList key={refreshKey} filter={filter} onRefresh={handleRefresh} />
        </Box>
      </Flex>

      {/* Drawer for Asset Form */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Add Asset</DrawerHeader>
          <Divider my={2} />
          <DrawerBody>
            <AssetForm onSuccess={() => { handleRefresh(); onClose(); }} />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Container>
  );
};

export default AssetManagementPage;