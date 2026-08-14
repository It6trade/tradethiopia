import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    useToast,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    Divider,
    Flex,
    SimpleGrid,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    VStack,
    Select,
    Link,
    ModalCloseButton,
    useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import DocumentUploadForm from './EmployeeDocumentUploadForm';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchDocuments();
        fetchCategories();
    }, []);

    useEffect(() => {
        const filtered = documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (selectedCategory ? doc.category._id === selectedCategory : true) &&
            (selectedDepartment ? doc.department === selectedDepartment : true)
        );
        setFilteredDocuments(filtered);
    }, [searchQuery, documents, selectedCategory, selectedDepartment]);

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents`, {
                params: { section: 'employees' }, // Add section as query parameter
            });
            setDocuments(res.data);
        } catch (error) {
            toast({
                title: 'Error fetching documents.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const filteredCategories = res.data.data.filter(category => category.section === 'employees'); // Filter here
            setCategories(filteredCategories); // Set the filtered categories
        } catch (error) {
            toast({
                title: 'Error fetching categories.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleDelete = async (documentId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/documents/${documentId}`);
                setDocuments(documents.filter((doc) => doc._id !== documentId));
                toast({
                    title: 'Document deleted.',
                    description: 'The document has been deleted successfully.',
                    status: 'success',
                    duration: 3000,
                });
            } catch (error) {
                toast({
                    title: 'Error deleting document.',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                });
            }
        }
    };

    const handleEditClick = (doc) => {
        setEditDocument(doc);
        setTitle(doc.title);
        setCategoryId(doc.category?._id || '');
        setDepartment(doc.department || '');
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            const payload = {};
            if (title !== editDocument.title) payload.title = title;
            if (categoryId !== editDocument.category?._id) payload.category = categoryId;
            if (department !== editDocument.department) payload.department = department;

            await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${editDocument._id}`, payload);
            fetchDocuments();
            setIsEditOpen(false);
            toast({
                title: 'Document updated.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error updating document.',
                description: error.response?.data?.error || 'An error occurred.',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const createCategory = async () => {
        if (!newCategoryName) {
            toast({
                title: 'Missing fields',
                description: 'Please provide a category name.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return;
        }
    
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, {
                name: newCategoryName,
                section: 'employees', // Ensure this is included
            });
    
            setCategories([...categories, res.data]);
            setNewCategoryName('');
            setIsDrawerOpen(false);
            toast({
                title: 'Category Created.',
                description: 'The category has been created successfully.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error creating category.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleCategoryEdit = (category) => {
        setEditCategoryId(category._id);
        setNewCategoryName(category.name);
        setIsEditingCategory(true);
    };

    const handleSaveCategoryEdit = async () => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${editCategoryId}`, {
                name: newCategoryName,
            });

            setCategories(categories.map(cat => cat._id === editCategoryId ? res.data : cat));
            setNewCategoryName('');
            setIsEditingCategory(false);
            toast({
                title: 'Category updated.',
                description: 'The category has been updated successfully.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error updating category.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`);
                setCategories(categories.filter((cat) => cat._id !== categoryId));
                toast({
                    title: 'Category deleted.',
                    description: 'The category has been deleted successfully.',
                    status: 'success',
                    duration: 3000,
                });
            } catch (error) {
                toast({
                    title: 'Error deleting category.',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                });
            }
        }
    };

    const departments = [...new Set(documents.map(doc => doc.department))];

    return (
        <Box p={{ base: '2', md: '4' }} maxW="1200px" mx="auto" mt={{ base: '0', sm: '-16', md: '-35', lg: '-75' }}>
            <Heading as="h2" size="lg" mb="4" textAlign="center" color="teal.600">
                Employee Document Management
            </Heading>

            {/* Document Upload Form */}
            <DocumentUploadForm mb={4} fetchDocuments={fetchDocuments} />

            <Flex direction={{ base: 'column', md: 'row' }} mt={4}>
                {/* Sidebar for Categories */}
                <Box
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderRadius="md"
                    boxShadow="lg"
                    p="4"
                    width={{ base: '100%', md: '30%' }}
                    mb={{ base: 4, md: 0 }}
                >
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md" color="teal.600">Categories</Heading>
                        <IconButton
                            icon={<AddIcon />}
                            colorScheme="teal"
                            onClick={() => {
                                setIsDrawerOpen(true);
                                setIsEditingCategory(false);
                                setNewCategoryName('');
                            }}
                            aria-label="Add Category"
                            size="sm"
                        />
                    </Flex>

                    {/* Placeholder for clearing selected category */}
                    <Button
                        variant="outline"
                        colorScheme="gray"
                        onClick={() => setSelectedCategory('')}
                        display={selectedCategory ? 'block' : 'none'}
                        mb={4}
                    >
                        Clear Selected Category
                    </Button>

                    <Divider borderColor="teal.500" mb="6" />
                    <VStack align="start" spacing={2} width="100%">
                        {categories.map((category) => (
                            <Button
                                key={category._id}
                                variant="outline"
                                colorScheme={selectedCategory === category._id ? 'teal' : 'gray'}
                                onClick={() => setSelectedCategory(category._id)}
                                width="100%"
                                justifyContent="flex-start"
                            >
                                {category.name}
                            </Button>
                        ))}
                    </VStack>
                </Box>

                {/* Vertical Divider */}
                <Divider orientation="vertical" borderColor="teal.500" display={{ base: 'none', md: 'block' }} mx={4} />

                {/* Document List Area */}
                <Box flex="1">
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" mb="4">
                        {/* Search Input */}
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title"
                            width="auto"
                            maxWidth="550px"
                            focusBorderColor="teal.500"
                            mb={{ base: '4', md: '0' }}
                            mr={{ md: '4' }}
                        />

                        {/* Department Dropdown */}
                        <Select
                            placeholder="Select Department"
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            width="auto"
                            maxWidth="400px"
                            focusBorderColor="teal.500"
                        >
                            {departments.map(department => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </Select>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="4">
                        {filteredDocuments.map((doc) => (
                            <Box
                                key={doc._id}
                                p="4"
                                borderWidth="1px"
                                borderRadius="md"
                                boxShadow="lg"
                                transition="all 0.3s ease"
                                _hover={{ boxShadow: 'xl' }}
                            >
                                <Heading as="h3" size="sm" mb="2" isTruncated>
                                    {doc.title}
                                </Heading>
                                <Divider borderColor="teal.500" mb="2" />
                                <Text mb="2" color="gray.600" fontSize="sm">
                                    <strong>Category:</strong> {doc.category?.name || 'N/A'}
                                </Text>
                                <Text mb="2" color="gray.600" fontSize="sm">
                                    <strong>Department:</strong> {doc.department || 'N/A'}
                                </Text>
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button colorScheme="teal" variant="outline" width="auto">
                                        View
                                    </Button>
                                </a>
                                <Flex justify="space-between" align="center" mt="4">
                                    <Button size="sm" colorScheme="teal" onClick={() => handleEditClick(doc)}>
                                        <EditIcon mr="2" /> Edit
                                    </Button>

                                    <IconButton
                                        icon={<DeleteIcon />}
                                        colorScheme="red"
                                        onClick={() => handleDelete(doc._id)}
                                        aria-label="Delete"
                                        size="sm"
                                    />
                                </Flex>
                            </Box>
                        ))}
                    </SimpleGrid>

                    {/* Drawer for Categories */}
                    <Drawer
                        isOpen={isDrawerOpen}
                        placement="right"
                        onClose={() => setIsDrawerOpen(false)}
                    >
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader>
                                <Heading size="lg" textAlign="center">Categories</Heading>
                            </DrawerHeader>
                            <DrawerBody>
                                <FormControl id="new-category" mb={4}>
                                    <FormLabel>Category Name</FormLabel>
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Enter category name"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>

                                <Divider mb={6} />

                                <Heading as="h3" size="sm" mt={4} mb={2}>
                                    Available Categories
                                </Heading>
                                {categories.map((category) => (
                                    <Flex
                                        key={category._id}
                                        align="center"
                                        justify="space-between"
                                        mb={2}
                                        p={2}
                                        borderWidth="1px"
                                        borderRadius="md"
                                        boxShadow="sm"
                                        _hover={{ boxShadow: 'md', bg: 'gray.50' }}
                                        transition="all 0.2s"
                                    >
                                        <Text fontSize="sm" fontWeight="medium">{category.name}</Text>
                                        <Flex>
                                            <IconButton
                                                icon={<EditIcon />}
                                                aria-label="Edit Category"
                                                size="sm"
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={() => handleCategoryEdit(category)}
                                                mr={2}
                                                _hover={{ bg: 'blue.100' }}
                                            />
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                aria-label="Delete Category"
                                                size="sm"
                                                colorScheme="red"
                                                variant="outline"
                                                onClick={() => handleDeleteCategory(category._id)}
                                                _hover={{ bg: 'red.100' }}
                                            />
                                        </Flex>
                                    </Flex>
                                ))}
                            </DrawerBody>
                            <DrawerFooter>
                                <Button variant="outline" mr={3} onClick={() => setIsDrawerOpen(false)}>
                                    Cancel
                                </Button>
                                {isEditingCategory ? (
                                    <Button colorScheme="teal" onClick={handleSaveCategoryEdit}>
                                        Save Category
                                    </Button>
                                ) : (
                                    <Button colorScheme="teal" onClick={createCategory}>
                                        Create Category
                                    </Button>
                                )}
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>

                    {/* Modal for Editing Documents */}
                    <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Edit Document</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <FormControl id="edit-title" mb={4}>
                                    <FormLabel>Title</FormLabel>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter title"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>
                                <FormControl id="edit-category" mb={4}>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl id="edit-department" mb={4}>
                                    <FormLabel>Department</FormLabel>
                                    <Input
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="Enter department"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>
                                <Button colorScheme="teal" onClick={handleEditSave}>
                                    Save
                                </Button>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Box>
            </Flex>
        </Box>
    );
};

export default DocumentList;