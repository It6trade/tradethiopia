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
    SimpleGrid,
    useColorModeValue,
    Text,
    Flex,
    Icon,
    HStack,
} from '@chakra-ui/react';
import { FiCalendar, FiCheckCircle, FiUploadCloud } from 'react-icons/fi';
import axios from 'axios';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, index) => CURRENT_YEAR + 5 - index);

const DocumentUploadForm = ({ fetchDocuments, categoryOptions }) => {
    const [title, setTitle] = useState('');
    const [documentYear, setDocumentYear] = useState(String(CURRENT_YEAR));
    const [file, setFile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('companys');
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

        if (!title.trim() || !file || !categoryId || !department || department === 'none' || !documentYear) {
            toast({
                title: 'Complete the upload details',
                description: 'Title, category, company brand, document year, and file are required.',
                status: 'warning',
                duration: 3500,
                isClosable: true,
            });
            return;
        }

        const finalSection = section || 'companys';

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('documentYear', documentYear);
        formData.append('documentDate', `${documentYear}-01-01`);
        formData.append('file', file);
        formData.append('categoryId', categoryId);
        formData.append('department', department);
        formData.append('section', finalSection);

        setIsUploading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.status === 201) {
                toast({
                    title: 'Document uploaded successfully.',
                    description: `Recorded for Year: ${documentYear}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Reset form fields
                setTitle('');
                setDocumentYear(String(CURRENT_YEAR));
                setFile(null);
                setCategoryId('');
                setDepartment('');
                setSection('companys');
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
        <Box width="100%" m="0" p="0">
            <Card borderRadius="xl" boxShadow="none" borderWidth="1px" bg={useColorModeValue('gray.50', 'gray.700')}>
                <CardBody p={{ base: 4, md: 5 }}>
                    <form onSubmit={handleSubmit}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                            {/* Title Input */}
                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="xs"
                                    fontWeight="bold"
                                    mb={1.5}
                                    color={useColorModeValue('gray.700', 'gray.200')}
                                >
                                    Document Title
                                </FormLabel>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Commercial Registration"
                                    size="sm"
                                    focusBorderColor="teal.500"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.600')}
                                />
                            </FormControl>

                            {/* Category Input */}
                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="xs"
                                    fontWeight="bold"
                                    mb={1.5}
                                    color={useColorModeValue('gray.700', 'gray.200')}
                                >
                                    Category
                                </FormLabel>
                                <Select
                                    placeholder="Select Category"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    size="sm"
                                    focusBorderColor="teal.500"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.600')}
                                >
                                    {availableCategories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Company / Department Input */}
                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="xs"
                                    fontWeight="bold"
                                    mb={1.5}
                                    color={useColorModeValue('gray.700', 'gray.200')}
                                >
                                    Company / Department
                                </FormLabel>
                                <Select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    size="sm"
                                    focusBorderColor="teal.500"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.600')}
                                >
                                    <option value="none">Select Company Brand</option>
                                    <option value="Tradethiopia B2B">Tradethiopia B2B</option>
                                    <option value="TESBINN">TESBINN</option>
                                    <option value="Ethio-International Expo">Ethio-International Expo</option>
                                    <option value="TETV">TETV</option>
                                    <option value="ENISRA">ENISRA</option>
                                </Select>
                            </FormControl>

                            {/* Document Year (Determined by HR) */}
                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="xs"
                                    fontWeight="bold"
                                    mb={1.5}
                                    color={useColorModeValue('gray.700', 'gray.200')}
                                >
                                    Document Year (Determined by HR)
                                </FormLabel>
                                <Select
                                    value={documentYear}
                                    onChange={(e) => setDocumentYear(e.target.value)}
                                    size="sm"
                                    focusBorderColor="teal.500"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.600')}
                                >
                                    {YEAR_OPTIONS.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* File Upload */}
                            <FormControl isRequired gridColumn={{ base: 'span 1', md: 'span 2' }}>
                                <FormLabel
                                    fontSize="xs"
                                    fontWeight="bold"
                                    mb={1.5}
                                    color={useColorModeValue('gray.700', 'gray.200')}
                                >
                                    Upload File (PDF, Word, Excel, Image)
                                </FormLabel>
                                <Input
                                    key={file?.name || 'empty-file'}
                                    type="file"
                                    onChange={handleFileChange}
                                    size="sm"
                                    pt={1}
                                    focusBorderColor="teal.500"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.600')}
                                />
                                {file && (
                                    <Flex align="center" gap="1.5" mt="1.5" color="teal.600" fontSize="2xs">
                                        <Icon as={FiCheckCircle} />
                                        <Text noOfLines={1} fontWeight="bold">{file.name}</Text>
                                    </Flex>
                                )}
                            </FormControl>
                        </SimpleGrid>

                        <Flex justify="space-between" align="center" mt={5} pt={3} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.600')} gap="3" flexWrap="wrap">
                            <HStack color={useColorModeValue('gray.500', 'gray.400')} fontSize="2xs">
                                <Icon as={FiCalendar} />
                                <Text>Document year enables fast yearly filtering and organized document tracking.</Text>
                            </HStack>

                            <Button
                                type="submit"
                                size="sm"
                                px={6}
                                borderRadius="lg"
                                colorScheme="teal"
                                bg="#004D40"
                                _hover={{ bg: '#00796B' }}
                                color="white"
                                leftIcon={<Icon as={FiUploadCloud} />}
                                isLoading={isUploading}
                                loadingText="Uploading"
                            >
                                Upload Document
                            </Button>
                        </Flex>
                    </form>
                </CardBody>
            </Card>
        </Box>
    );
};

export default DocumentUploadForm;
