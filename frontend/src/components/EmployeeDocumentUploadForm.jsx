import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    useToast,
    Card,
    CardBody,
    Grid,
    GridItem,
    Divider,
    useColorModeValue,
    IconButton,
} from '@chakra-ui/react';
import { MdRefresh } from 'react-icons/md'; // Import the refresh icon
import axios from 'axios';

const DocumentUploadForm = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('employees'); // Default value set here
    const toast = useToast();

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const filteredCategories = res.data.data.filter(category => category.section === 'employees');
            setCategories(filteredCategories);
        } catch (error) {
            toast({
                title: 'Error fetching categories.',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [toast]);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Ensure section has a default value of 'employees'
        const finalSection = section || 'employees'; // Use 'companys' if section is empty
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        formData.append('categoryId', categoryId);
        formData.append('department', department); // Ensure department is included
        formData.append('section', finalSection); // Set section to finalSection
    
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
    
            if (response.status === 201) {
                toast({
                    title: 'Document uploaded successfully.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
    
                // Reset form fields
                setTitle('');
                setFile(null);
                setCategoryId('');
                setDepartment(''); // Reset department to default
                setSection('employees'); // Reset section to default
            } else {
                throw new Error('Unexpected response from the server.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
            toast({
                title: 'Error uploading document.',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <Box
            maxW="6xl"
            mx="auto"
            mt={6}
            p={4}
            bgGradient={useColorModeValue('linear(to-b, gray.50, gray.100)', 'linear(to-b, gray.800, gray.700)')}
            borderRadius="md"
            boxShadow="lg"
        >
            <Card borderRadius="lg" boxShadow="md" bg={useColorModeValue('white', 'gray.700')}>
                <CardBody>
                    <Divider mb={3} />
                    <form onSubmit={handleSubmit}>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                            {/* Title Input */}
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel
                                        fontSize="sm"
                                        fontWeight="bold"
                                        mb={2}
                                        color={useColorModeValue('gray.600', 'gray.300')}
                                    >
                                        Title
                                    </FormLabel>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Document Title"
                                        size="md"
                                        focusBorderColor="teal.500"
                                        borderRadius="md"
                                        bg={useColorModeValue('gray.50', 'gray.600')}
                                        color={useColorModeValue('gray.800', 'gray.200')}
                                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                    />
                                </FormControl>
                            </GridItem>
                            {/* Category Input */}
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel
                                        fontSize="sm"
                                        fontWeight="bold"
                                        mb={2}
                                        color={useColorModeValue('gray.600', 'gray.300')}
                                    >
                                        Category
                                    </FormLabel>
                                    <Select
                                        placeholder="Select Category"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        size="md"
                                        focusBorderColor="teal.500"
                                        borderRadius="md"
                                        bg={useColorModeValue('gray.50', 'gray.600')}
                                        color={useColorModeValue('gray.800', 'gray.200')}
                                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                    >
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </GridItem>
                            {/* File Upload */}
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel
                                        fontSize="sm"
                                        fontWeight="bold"
                                        mb={2}
                                        color={useColorModeValue('gray.600', 'gray.300')}
                                    >
                                        File
                                    </FormLabel>
                                    <Input
                                        type="file"
                                        onChange={handleFileChange}
                                        size="md"
                                        focusBorderColor="teal.500"
                                        borderRadius="md"
                                        bg={useColorModeValue('gray.50', 'gray.600')}
                                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                    />
                                </FormControl>
                            </GridItem>
                            {/* Department Input */}
                                                       <GridItem>
                               <FormControl isRequired>
                                   <FormLabel
                                       fontSize="sm"
                                       fontWeight="bold"
                                       mb={2}
                                       color={useColorModeValue('gray.600', 'gray.300')}
                                   >
                                       Department
                                   </FormLabel>
                                   <Select
                                       value={department}
                                       onChange={(e) => setDepartment(e.target.value)}
                                       size="md"
                                       focusBorderColor="teal.500"
                                       borderRadius="md"
                                       bg={useColorModeValue('gray.50', 'gray.600')}
                                       color={useColorModeValue('gray.800', 'gray.200')}
                                       _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                   >
                                       <option value="">Select Department</option>
                                       <option value="HR">HR</option>
                                       <option value="Sales">Sales</option>
                                       <option value="Customer Service">Customer Service</option>
                                       <option value="Socialmedia Manager">Socialmedia Manager</option>
                                       <option value="Instructor">Instructor</option>
                                        <option value="Supervisor">Supervisor</option>
                                       <option value="Operational Manager">Operational Manager</option>
                                       <option value="IT">IT</option>
                                       <option value="TETV">TETV</option>

                                   </Select>
                               </FormControl>
                           </GridItem>
                        </Grid>
                        <Box textAlign="center" mt={2}>
                            <Button
                                type="submit" // Ensure this is a submit button
                                size="md"
                                px={8}
                                py={3}
                                fontSize="sm"
                                borderRadius="md"
                                bgGradient={useColorModeValue('linear(to-r, teal.400, blue.400)', 'linear(to-r, teal.600, blue.600)')}
                                color="white"
                                _hover={{
                                    bgGradient: useColorModeValue('linear(to-r, teal.500, blue.500)', 'linear(to-r, teal.700, blue.700)'),
                                    boxShadow: 'md',
                                    transform: 'scale(1.02)',
                                }}
                                _active={{
                                    bgGradient: useColorModeValue('linear(to-r, teal.600, blue.600)', 'linear(to-r, teal.800, blue.800)'),
                                    boxShadow: 'inner',
                                }}
                                transition="all 0.2s ease-in-out"
                            >
                                Upload
                            </Button>
                            <IconButton
                                aria-label="Reload"
                                icon={<MdRefresh />}
                                onClick={handleReload}
                                size="md"
                                ml={4}
                                colorScheme="teal"
                                variant="outline"
                                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                            />
                        </Box>
                    </form>
                </CardBody>
            </Card>
        </Box>
    );
};

export default DocumentUploadForm;
