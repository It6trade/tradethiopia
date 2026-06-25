// frontend/src/components/tradextv/TradexTvTabPage.jsx
import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  HStack,
  VStack,
  Select,
  useColorModeValue,
  IconButton
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ArrowBackIcon } from '@chakra-ui/icons';

const TradexTvTabPage = ({ cardBg, headerBg, borderColor }) => {
  const [videos, setVideos] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: '',
    duration: '',
    uploadDate: ''
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Success',
      description: 'Video added successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
    // Reset form
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      category: '',
      duration: '',
      uploadDate: ''
    });
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="xl" fontWeight="bold">TradeXTV Management</Text>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={onOpen}
        >
          Add New Video
        </Button>
      </Box>

      <Box
        border="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Duration</Th>
              <Th>Upload Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {videos.length > 0 ? (
              videos.map((video) => (
                <Tr key={video._id}>
                  <Td>{video.title}</Td>
                  <Td>{video.category}</Td>
                  <Td>{video.duration}</Td>
                  <Td>{video.uploadDate}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        aria-label="Edit"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        aria-label="Delete"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={4}>
                  No videos found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Add/Edit Video Form Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <HStack>
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={onClose}
                variant="ghost"
                aria-label="Back"
                mr={2}
              />
              <Text>Add New Video</Text>
            </HStack>
          </DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} py={4}>
                <FormControl isRequired>
                  <FormLabel>Video Title</FormLabel>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter video title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter video description"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Video URL</FormLabel>
                  <Input
                    name="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder="Enter video URL"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Select category"
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="webinar">Webinar</option>
                    <option value="interview">Interview</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <Input
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="Enter duration in minutes"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Upload Date</FormLabel>
                  <Input
                    name="uploadDate"
                    type="date"
                    value={formData.uploadDate}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  mt={4}
                >
                  Save Video
                </Button>
              </VStack>
            </form>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TradexTvTabPage;
