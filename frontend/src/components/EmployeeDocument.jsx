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
    HStack,
    Stack,
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
    Badge,
    Avatar,
    Progress,
    Icon,
    ModalCloseButton,
    useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiAlertCircle, FiBriefcase, FiCheckCircle, FiDownload, FiFileText, FiFolder, FiUsers } from 'react-icons/fi';
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
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState('');
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
        const filtered = documents.filter(doc => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [doc.title, doc.employeeName, doc.department, doc.category?.name, doc.subcategory]
                .filter(Boolean)
                .some(value => value.toLowerCase().includes(query));
            return matchesSearch &&
                (selectedCategory ? doc.category?._id === selectedCategory : true) &&
                (selectedDepartment ? doc.department === selectedDepartment : true);
        });
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
        setEmployeeName(doc.employeeName || '');
        setCategoryId(doc.category?._id || '');
        setSubcategory(doc.subcategory || '');
        setDepartment(doc.department || '');
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            const payload = {};
            if (title !== editDocument.title) payload.title = title;
            if (categoryId !== editDocument.category?._id) payload.category = categoryId;
            if (subcategory !== (editDocument.subcategory || '')) payload.subcategory = subcategory;
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

    const getEmployeeKey = (doc) =>
        doc.userId
            ? `user:${typeof doc.userId === 'object' ? doc.userId._id : doc.userId}`
            : `legacy:${(doc.employeeName || doc.title || 'Unknown Employee').trim().toLowerCase()}`;

    const employeeGroups = Object.values(filteredDocuments.reduce((groups, doc) => {
        const key = getEmployeeKey(doc);
        if (!groups[key]) {
            groups[key] = {
                key,
                employeeName: doc.employeeName || doc.title || 'Unknown Employee',
                documents: [],
            };
        }
        groups[key].documents.push(doc);
        return groups;
    }, {})).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    const handleEmployeeOpen = (employeeGroup) => {
        const allEmployeeDocuments = documents.filter(doc => getEmployeeKey(doc) === employeeGroup.key);
        setSelectedEmployee({
            ...employeeGroup,
            documents: allEmployeeDocuments,
        });
        setIsEmployeeDrawerOpen(true);
    };

    const requiredEmployeeDocumentTypes = [
        {
            label: 'Employee Leave',
            keywords: ['employee leave', 'leave'],
        },
        {
            label: 'Employment Contract',
            keywords: ['employment contract', 'contract'],
        },
        {
            label: 'Warning letters',
            keywords: ['warning letter', 'warning letters', 'warning'],
        },
        {
            label: 'Certifications',
            keywords: ['certification', 'certifications', 'certificate'],
        },
        {
            label: 'Supportive letters',
            keywords: ['supportive letter', 'supportive letters', 'support letter'],
        },
        {
            label: 'Recommendations',
            keywords: ['recommendation', 'recommendations', 'recommendation letter'],
        },
        {
            label: 'Guarantor Files',
            keywords: ['guarantor', 'guarantor file', 'guarantor files'],
        },
        {
            label: 'Employee Educational Background',
            keywords: ['educational background', 'education', 'educational', 'degree', 'diploma', 'transcript'],
        },
        {
            label: 'Handover',
            keywords: ['handover', 'hand over'],
        },
        {
            label: 'Medical Certificate',
            keywords: ['medical certificate', 'medical', 'health certificate'],
        },
        {
            label: 'Part Time Employment Contract',
            keywords: ['part time employment contract', 'part-time employment contract', 'part time contract', 'part-time contract'],
        },
        {
            label: 'Employee Leave Request',
            keywords: ['employee leave request', 'leave request'],
        },
        {
            label: 'Job Experience Letter',
            keywords: ['job experience letter', 'experience letter', 'work experience'],
        },
        {
            label: 'Termination of Employment',
            keywords: ['termination of employment', 'termination', 'resignation', 'leaving', 'exit'],
        },
    ];
    const documentSearchText = (doc) => [doc.title, doc.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const getDocumentsForType = (employeeDocuments, documentType) => employeeDocuments.filter((doc) => {
        const searchText = documentSearchText(doc);
        return documentType.keywords.some((keyword) => searchText.includes(keyword));
    });

    const getOtherDocuments = (employeeDocuments) => employeeDocuments.filter((doc) => {
        const searchText = documentSearchText(doc);
        return !requiredEmployeeDocumentTypes.some((documentType) =>
            documentType.keywords.some((keyword) => searchText.includes(keyword))
        );
    });

    const location = useLocation();
    const departments = [...new Set(documents.map(doc => doc.department).filter(Boolean))];
    const selectedDocumentGroups = selectedEmployee
        ? requiredEmployeeDocumentTypes
            .map((type) => ({
                ...type,
                documents: getDocumentsForType(selectedEmployee.documents, type),
            }))
            .filter((group) => group.documents.length > 0)
        : [];
    const selectedMissingTypes = selectedEmployee
        ? requiredEmployeeDocumentTypes.filter(
            (type) => getDocumentsForType(selectedEmployee.documents, type).length === 0
        )
        : [];
    const selectedOtherDocuments = selectedEmployee
        ? getOtherDocuments(selectedEmployee.documents)
        : [];
    const documentCoverage = selectedEmployee
        ? Math.round(
            (selectedDocumentGroups.length / requiredEmployeeDocumentTypes.length) * 100
        )
        : 0;

    return (
        <Box p={{ base: '2', md: '4' }} maxW="1200px" mx="auto" mt={{ base: '0', sm: '-16', md: '-35', lg: '-75' }}>
            {/* Top Navigation Tabs */}
            <Flex justify="center" mb={5} gap={3} bg={useColorModeValue('white', 'gray.800')} p={2.5} borderRadius="xl" boxShadow="sm" borderWidth="1px">
                <Button
                    as={RouterLink}
                    to="/documentlist"
                    size="sm"
                    variant={location.pathname === '/documentlist' ? 'solid' : 'ghost'}
                    colorScheme="teal"
                    borderRadius="lg"
                    px={5}
                    fontWeight="700"
                    leftIcon={<Icon as={FiBriefcase} />}
                >
                    Company Documents
                </Button>
                <Button
                    as={RouterLink}
                    to="/EmployeeDocument"
                    size="sm"
                    variant={location.pathname === '/EmployeeDocument' ? 'solid' : 'ghost'}
                    colorScheme="teal"
                    borderRadius="lg"
                    px={5}
                    fontWeight="700"
                    leftIcon={<Icon as={FiUsers} />}
                >
                    Employee Documents
                </Button>
            </Flex>

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
                            placeholder="Search by employee, document, category, or department"
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
                        {employeeGroups.map((employeeGroup) => {
                            const departmentsForEmployee = [...new Set(employeeGroup.documents.map(doc => doc.department).filter(Boolean))];
                            const categoriesForEmployee = [...new Set(employeeGroup.documents.map(doc => doc.category?.name).filter(Boolean))];
                            return (
                                <Box
                                    key={employeeGroup.key}
                                    p="4"
                                    borderWidth="1px"
                                    borderRadius="md"
                                    boxShadow="lg"
                                    transition="all 0.3s ease"
                                    cursor="pointer"
                                    _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
                                    onClick={() => handleEmployeeOpen(employeeGroup)}
                                >
                                    <Heading as="h3" size="sm" mb="2" isTruncated>
                                        {employeeGroup.employeeName}
                                    </Heading>
                                    <Divider borderColor="teal.500" mb="2" />
                                    <Text mb="2" color="gray.600" fontSize="sm">
                                        <strong>Department:</strong> {departmentsForEmployee.join(', ') || 'N/A'}
                                    </Text>
                                    <Text mb="2" color="gray.600" fontSize="sm">
                                        <strong>Total Files:</strong> {employeeGroup.documents.length}
                                    </Text>
                                    <Flex gap={2} wrap="wrap" mb="3">
                                        {categoriesForEmployee.slice(0, 4).map(category => (
                                            <Badge key={category} colorScheme="teal">{category}</Badge>
                                        ))}
                                        {categoriesForEmployee.length > 4 && <Badge>+{categoriesForEmployee.length - 4}</Badge>}
                                    </Flex>
                                    <Button colorScheme="teal" variant="outline" size="sm">
                                        View All Employee Files
                                    </Button>
                                </Box>
                            );
                        })}
                    </SimpleGrid>


                    <Drawer
                        isOpen={isEmployeeDrawerOpen}
                        placement="right"
                        size="full"
                        onClose={() => setIsEmployeeDrawerOpen(false)}
                    >
                        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                        <DrawerContent
                            ml="auto"
                            maxW={{ base: '100%', md: '820px', xl: '980px' }}
                            bg="gray.50"
                        >
                            <DrawerCloseButton top={5} right={5} color="white" size="lg" />
                            <DrawerHeader p={0}>
                                <Box
                                    bgGradient="linear(to-r, teal.800, teal.600)"
                                    color="white"
                                    px={{ base: 5, md: 8 }}
                                    py={{ base: 7, md: 9 }}
                                >
                                    <Text
                                        fontSize="xs"
                                        fontWeight="800"
                                        color="teal.100"
                                        letterSpacing="widest"
                                        textTransform="uppercase"
                                    >
                                        HR employee document workspace
                                    </Text>
                                    <Heading mt={2} size="lg">
                                        {selectedEmployee?.employeeName || 'Employee documents'}
                                    </Heading>
                                    <Text mt={2} fontSize="sm" color="teal.100">
                                        Review available records, document coverage, and items requiring HR follow-up.
                                    </Text>
                                </Box>
                            </DrawerHeader>
                            <DrawerBody px={{ base: 4, md: 8 }} py={{ base: 5, md: 7 }}>
                                {selectedEmployee && (
                                    <Stack spacing={7}>
                                        <Flex
                                            bg="white"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="2xl"
                                            shadow="sm"
                                            p={{ base: 5, md: 6 }}
                                            justify="space-between"
                                            align={{ base: 'flex-start', md: 'center' }}
                                            direction={{ base: 'column', md: 'row' }}
                                            gap={5}
                                        >
                                            <HStack spacing={4}>
                                                <Avatar
                                                    size="lg"
                                                    name={selectedEmployee.employeeName}
                                                    bg="teal.700"
                                                    color="white"
                                                />
                                                <Box>
                                                    <Heading size="md" color="gray.900">
                                                        {selectedEmployee.employeeName}
                                                    </Heading>
                                                    <Text mt={1} fontSize="sm" color="gray.600">
                                                        {[...new Set(selectedEmployee.documents.map(doc => doc.department).filter(Boolean))].join(', ') || 'Department not recorded'}
                                                    </Text>
                                                    <Badge mt={2} colorScheme="teal" borderRadius="full" px={2.5}>
                                                        {selectedEmployee.documents.length} uploaded {selectedEmployee.documents.length === 1 ? 'file' : 'files'}
                                                    </Badge>
                                                </Box>
                                            </HStack>
                                            <Box minW={{ md: '220px' }}>
                                                <Flex justify="space-between" mb={2}>
                                                    <Text fontSize="xs" fontWeight="700" color="gray.500">Required category coverage</Text>
                                                    <Text fontSize="xs" fontWeight="800" color="teal.700">{documentCoverage}%</Text>
                                                </Flex>
                                                <Progress value={documentCoverage} size="sm" colorScheme="teal" borderRadius="full" />
                                                <Text mt={2} fontSize="xs" color="gray.500">
                                                    {selectedDocumentGroups.length} of {requiredEmployeeDocumentTypes.length} expected categories available
                                                </Text>
                                            </Box>
                                        </Flex>

                                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                                            {[
                                                ['Total files', selectedEmployee.documents.length, FiFileText],
                                                ['Available categories', selectedDocumentGroups.length + (selectedOtherDocuments.length ? 1 : 0), FiFolder],
                                                ['Needs attention', selectedMissingTypes.length, FiAlertCircle],
                                            ].map(([label, value, metricIcon]) => (
                                                <Box key={label} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
                                                    <HStack>
                                                        <Flex w="38px" h="38px" borderRadius="lg" bg="teal.50" align="center" justify="center">
                                                            <Icon as={metricIcon} color="teal.700" />
                                                        </Flex>
                                                        <Box>
                                                            <Text fontSize="xl" fontWeight="800" color="gray.900">{value}</Text>
                                                            <Text fontSize="xs" color="gray.500">{label}</Text>
                                                        </Box>
                                                    </HStack>
                                                </Box>
                                            ))}
                                        </SimpleGrid>

                                        <Box>
                                            <Heading size="md" color="gray.900">Available employee documents</Heading>
                                            <Text mt={1} fontSize="sm" color="gray.500">
                                                Files are grouped by HR purpose for faster review and action.
                                            </Text>
                                        </Box>

                                        {selectedDocumentGroups.length || selectedOtherDocuments.length ? (
                                            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                                                {[
                                                    ...selectedDocumentGroups,
                                                    ...(selectedOtherDocuments.length
                                                        ? [{ label: 'Other documents', documents: selectedOtherDocuments }]
                                                        : []),
                                                ].map((group) => (
                                                    <Box
                                                        key={group.label}
                                                        bg="white"
                                                        border="1px solid"
                                                        borderColor="gray.200"
                                                        borderRadius="2xl"
                                                        overflow="hidden"
                                                        shadow="sm"
                                                        transition="all 0.2s"
                                                        _hover={{ borderColor: 'teal.300', shadow: 'md', transform: 'translateY(-2px)' }}
                                                    >
                                                        <Flex px={5} py={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.200" justify="space-between" align="center">
                                                            <HStack>
                                                                <Icon as={FiFolder} color="teal.700" />
                                                                <Heading size="sm" color="gray.800">{group.label}</Heading>
                                                            </HStack>
                                                            <Badge colorScheme="green" borderRadius="full">{group.documents.length} available</Badge>
                                                        </Flex>
                                                        <Stack spacing={0} divider={<Divider />} px={5}>
                                                            {group.documents.map((doc) => (
                                                                <Box key={doc._id} py={5}>
                                                                    <Flex justify="space-between" align="flex-start" gap={4}>
                                                                        <Box minW={0}>
                                                                            <HStack mb={2}>
                                                                                <Icon as={FiCheckCircle} color="green.500" />
                                                                                <Text fontWeight="800" color="gray.900" noOfLines={1}>{doc.title}</Text>
                                                                            </HStack>
                                                                            <Stack spacing={1}>
                                                                                <Text fontSize="xs" color="gray.600"><strong>Category:</strong> {doc.category?.name || 'Not recorded'}</Text>
                                                                                {doc.subcategory && <Text fontSize="xs" color="gray.600"><strong>Leave type:</strong> {doc.subcategory}</Text>}
                                                                                <Text fontSize="xs" color="gray.600"><strong>Department:</strong> {doc.department || 'Not recorded'}</Text>
                                                                                <Text fontSize="xs" color="gray.600"><strong>Uploaded:</strong> {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Date unavailable'}</Text>
                                                                            </Stack>
                                                                        </Box>
                                                                        <HStack spacing={1} flexShrink={0}>
                                                                            <IconButton
                                                                                as="a"
                                                                                href={doc.fileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                icon={<FiDownload />}
                                                                                aria-label="Open document"
                                                                                colorScheme="teal"
                                                                                size="sm"
                                                                            />
                                                                            <IconButton icon={<EditIcon />} aria-label="Edit document" variant="ghost" colorScheme="blue" size="sm" onClick={() => handleEditClick(doc)} />
                                                                            <IconButton icon={<DeleteIcon />} aria-label="Delete document" variant="ghost" colorScheme="red" size="sm" onClick={() => handleDelete(doc._id)} />
                                                                        </HStack>
                                                                    </Flex>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </SimpleGrid>
                                        ) : (
                                            <Box bg="white" border="1px dashed" borderColor="gray.300" borderRadius="2xl" p={8} textAlign="center">
                                                <Icon as={FiFileText} boxSize={8} color="gray.400" />
                                                <Heading mt={3} size="sm">No employee documents available</Heading>
                                                <Text mt={2} fontSize="sm" color="gray.500">Upload the employee’s first verified HR document to begin the record.</Text>
                                            </Box>
                                        )}

                                        {selectedMissingTypes.length > 0 && (
                                            <Box bg="white" border="1px solid" borderColor="orange.200" borderRadius="2xl" p={{ base: 5, md: 6 }}>
                                                <HStack align="flex-start" spacing={3}>
                                                    <Flex w="40px" h="40px" borderRadius="lg" bg="orange.50" align="center" justify="center" flexShrink={0}>
                                                        <Icon as={FiAlertCircle} color="orange.600" />
                                                    </Flex>
                                                    <Box>
                                                        <Heading size="sm" color="gray.900">HR attention required</Heading>
                                                        <Text mt={1} fontSize="sm" color="gray.600">
                                                            The following expected document categories have no uploaded record.
                                                        </Text>
                                                    </Box>
                                                </HStack>
                                                <Flex mt={4} gap={2} wrap="wrap">
                                                    {selectedMissingTypes.map((type) => (
                                                        <Badge key={type.label} colorScheme="orange" variant="subtle" borderRadius="full" px={3} py={1}>
                                                            {type.label}
                                                        </Badge>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        )}
                                    </Stack>
                                )}
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>

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
                                <FormControl id="edit-employee-name" mb={4}>
                                    <FormLabel>Employee Name</FormLabel>
                                    <Input
                                        value={employeeName}
                                        isReadOnly
                                        bg="gray.50"
                                        placeholder="Employee linked from database"
                                        size="md"
                                    />
                                    <Text mt={1} fontSize="xs" color="gray.500">
                                        Employee identity is controlled by the linked database record and cannot be typed manually.
                                    </Text>
                                </FormControl>
                                <FormControl id="edit-title" mb={4}>
                                    <FormLabel>Document Type</FormLabel>
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
                                        onChange={(e) => {
                                            setCategoryId(e.target.value);
                                            setSubcategory('');
                                        }}
                                    >
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                {categories.find((category) => category._id === categoryId)?.name?.trim().toLowerCase() === 'employee leave' && (
                                    <FormControl id="edit-leave-type" mb={4} isRequired>
                                        <FormLabel>Leave Type</FormLabel>
                                        <Select
                                            value={subcategory}
                                            onChange={(e) => setSubcategory(e.target.value)}
                                            placeholder="Select leave type"
                                        >
                                            {['Annual Leave', 'Sick Leave', 'Paternity Leave', 'Maternity Leave', 'Other Leave'].map((leaveType) => (
                                                <option key={leaveType} value={leaveType}>{leaveType}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
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


