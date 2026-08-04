import { useCallback, useState, useEffect } from 'react';
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
    useColorModeValue,
    Text,
    Flex,
    Icon,
} from '@chakra-ui/react';
import { FiCheckCircle, FiUploadCloud } from 'react-icons/fi';
import axios from 'axios';

const DocumentUploadForm = ({ fetchDocuments, categoryOptions }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('companys'); // Default value set here
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();
    const availableCategories = Array.isArray(categoryOptions) ? categoryOptions : categories;

    const fetchCategories = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const filteredCategories = res.data.data.filter(category => category.section === 'companys');
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
    }, [toast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !file || !categoryId || !department || department === 'none') {
            toast({
                title: 'Complete the upload details',
                description: 'Title, category, company, and file are required.',
                status: 'warning',
                duration: 3500,
                isClosable: true,
            });
            return;
        }
    
        // Ensure section has a default value of 'employees'
        const finalSection = section || 'companys'; // Use 'companys' if section is empty
    
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('file', file);
        formData.append('categoryId', categoryId);
        formData.append('department', department); // Ensure department is included
        formData.append('section', finalSection); // Set section to finalSection
    
        setIsUploading(true);
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
                setSection('companys'); // Reset section to default
                if (typeof fetchDocuments === 'function') await fetchDocuments();
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
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box
            width="100%"
            m="0"
            p="0"
        >
            <Card borderRadius="xl" boxShadow="none" borderWidth="1px" bg={useColorModeValue('gray.50', 'gray.700')}>
                <CardBody p={{ base: 4, md: 5 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: '1.1fr 1fr 1fr 1.4fr' }} gap={4}>
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
                                        {availableCategories.map((category) => (
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
                                        key={file?.name || 'empty-file'}
                                        type="file"
                                        onChange={handleFileChange}
                                        size="md"
                                        focusBorderColor="teal.500"
                                        borderRadius="md"
                                        bg={useColorModeValue('gray.50', 'gray.600')}
                                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                    />
                                    {file && <Flex align="center" gap="1.5" mt="2" color="teal.600" fontSize="xs"><Icon as={FiCheckCircle} /><Text noOfLines={1}>{file.name}</Text></Flex>}
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
            <option value="none">Select Department</option>
            <option value="Tradethiopia B2B">Tradethiopia B2B</option>
            <option value="TESBINN">TESBINN</option>
            <option value="Ethio-International Expo">Ethio-International Expo</option>
            <option value="TETV">TETV</option>
            <option value="ENISRA">ENISRA</option>
        </Select>
    </FormControl>
</GridItem>

                        </Grid>
                        <Flex justify="flex-end" align="center" mt={5} gap="3" flexWrap="wrap">
                            <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">Accepted files are stored securely with the selected company record.</Text>
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
                                leftIcon={<Icon as={FiUploadCloud} />}
                                isLoading={isUploading}
                                loadingText="Uploading"
                            >
                                Upload document
                            </Button>
                        </Flex>
                    </form>
                </CardBody>
            </Card>
        </Box>
    );
};

export default DocumentUploadForm;
