import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  VStack,
  Box,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Divider,
  IconButton,
  Collapse,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  MdInfo,
  MdLocationOn,
  MdCheckCircle,
  MdAttachMoney,
  MdCategory,
  MdCalendarToday,
  MdExpandMore,
  MdExpandLess,
} from 'react-icons/md';
import axios from 'axios';

const AssetDetailDrawer = ({ isOpen, onClose, selectedAsset, setSelectedAsset, handleUpdateAsset, readOnly = false }) => {
  const [showUpdateFields, setShowUpdateFields] = useState(false);
  const [users, setUsers] = useState([]); // State to store the list of users
  const detailBoxBg = useColorModeValue("gray.50", "gray.800");

  // Fetch users from the API when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
        console.log("API Response:", response.data); // Log the response

        // Ensure the response is an array
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          // If the response is an object with a `data` property
          setUsers(response.data.data);
        } else {
          console.error("Unexpected API response format:", response.data);
          setUsers([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]); // Fallback to an empty array
      }
    };

    fetchUsers();
  }, []);

  // Handle changes to the "Assigned To" dropdown
  const handleAssignedToChange = (e) => {
    const selectedUsername = e.target.value;
    setSelectedAsset({ ...selectedAsset, assignedTo: selectedUsername });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={{ base: "full", md: "lg" }}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader bg="teal.500" color="white">
          <Text fontSize="xl">{selectedAsset ? selectedAsset.nameTag : ''}</Text>
        </DrawerHeader>
        <DrawerBody>
          {selectedAsset && (
            <VStack spacing={4} align="stretch">
              {/* Display Current Asset Details */}
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdInfo />
                  <Text fontWeight="bold">Name:</Text>
                  <Text>{selectedAsset.name}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdInfo />
                  <Text fontWeight="bold">Name Tag:</Text>
                  <Text>{selectedAsset.nameTag}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdInfo />
                  <Text fontWeight="bold">Assigned To:</Text>
                  <Text>{selectedAsset.assignedTo}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdLocationOn />
                  <Text fontWeight="bold">Group:</Text>
                  <Text>{selectedAsset.assets}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdLocationOn />
                  <Text fontWeight="bold">Location:</Text>
                  <Text>{selectedAsset.location}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdCheckCircle />
                  <Text fontWeight="bold">Status:</Text>
                  <Text>{selectedAsset.status}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdAttachMoney />
                  <Text fontWeight="bold">Amount:</Text>
                  <Text>{selectedAsset.amount}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdCategory />
                  <Text fontWeight="bold">Category:</Text>
                  <Text>{selectedAsset.category}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdCalendarToday />
                  <Text fontWeight="bold">Date Acquired:</Text>
                  <Text>{new Date(selectedAsset.dateAcquired).toLocaleDateString()}</Text>
                </HStack>
              </Box>
              <Box p={4} borderWidth={1} borderRadius="md" bg={detailBoxBg}>
                <HStack spacing={2}>
                  <MdInfo />
                  <Text fontWeight="bold">Description:</Text>
                </HStack>
                <Text mt={2} whiteSpace="pre-line">
                  {selectedAsset.description}
                </Text>
              </Box>

              {!readOnly && (
                <>
                  <HStack spacing={2}>
                    <Text fontWeight="bold">Edit Fields</Text>
                    <IconButton
                      icon={showUpdateFields ? <MdExpandLess /> : <MdExpandMore />}
                      onClick={() => setShowUpdateFields(!showUpdateFields)}
                      aria-label="Toggle Update Fields"
                    />
                  </HStack>
                  <Collapse in={showUpdateFields}>
                    <Divider />
                    <FormControl>
                      <FormLabel>Edit Name</FormLabel>
                      <Input
                        value={selectedAsset.name}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, name: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Name Tag</FormLabel>
                      <Input
                        value={selectedAsset.nameTag}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, nameTag: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Assigned To</FormLabel>
                      <Select
                        value={selectedAsset.assignedTo}
                        onChange={handleAssignedToChange}
                        placeholder="Select assigned person"
                      >
                        {Array.isArray(users) &&
                          users.map((user) => (
                            <option key={user._id} value={user.username}>
                              {user.username}
                            </option>
                          ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Group</FormLabel>
                      <Select
                        value={selectedAsset.assets}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, assets: e.target.value })}
                      >
                        <option value="Tangible">Tangible</option>
                        <option value="Intangible">Intangible</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Location</FormLabel>
                      <Input
                        value={selectedAsset.location}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, location: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Status</FormLabel>
                      <Select
                        value={selectedAsset.status}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Amount</FormLabel>
                      <Input
                        type="number"
                        value={selectedAsset.amount}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, amount: parseFloat(e.target.value) })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Category</FormLabel>
                      <Input
                        value={selectedAsset.category}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, category: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Date Acquired</FormLabel>
                      <Input
                        type="date"
                        value={selectedAsset.dateAcquired.split('T')[0]}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, dateAcquired: e.target.value })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Edit Description</FormLabel>
                      <Textarea
                        value={selectedAsset.description}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, description: e.target.value })}
                        placeholder="Enter description here..."
                        size="sm"
                        resize="vertical"
                      />
                    </FormControl>
                  </Collapse>
                  <Button colorScheme="blue" onClick={handleUpdateAsset}>
                    Update Asset
                  </Button>
                </>
              )}
            </VStack>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AssetDetailDrawer;
