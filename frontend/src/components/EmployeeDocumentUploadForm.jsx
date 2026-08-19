import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Icon,
    Input,
    Select,
    SimpleGrid,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { FiCheckCircle, FiUploadCloud } from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, index) => CURRENT_YEAR + 5 - index);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
];

const DOCUMENT_TYPES = [
    'Employment contract',
    'Employee ID',
    'CV / résumé',
    'Education certificate',
    'Professional certificate',
    'Leave request',
    'Warning letter',
    'Performance record',
    'Promotion letter',
    'Salary adjustment',
    'Resignation letter',
    'Termination document',
    'Other employee document',
];
const LEAVE_SUBCATEGORIES = [
    'Annual Leave',
    'Sick Leave',
    'Paternity Leave',
    'Maternity Leave',
    'Other Leave',
];

const employeeLabel = (employee) =>
    employee.fullName || employee.username || employee.email || 'Unnamed employee';

const employeeDepartment = (employee) =>
    employee.jobTitle || employee.role || 'General';

const DocumentUploadForm = ({ fetchDocuments, onComplete, defaultEmployeeName = '' }) => {
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userId, setUserId] = useState('');
    const [title, setTitle] = useState('');
    const [documentYear, setDocumentYear] = useState(String(CURRENT_YEAR));
    const [categoryId, setCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [department, setDepartment] = useState('');
    const [file, setFile] = useState(null);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState('');
    const fileInputRef = useRef(null);
    const toast = useToast();

    const selectedEmployee = useMemo(
        () => employees.find((employee) => employee._id === userId),
        [employees, userId]
    );
    const selectedCategory = useMemo(
        () => categories.find((category) => category._id === categoryId),
        [categories, categoryId]
    );
    const requiresLeaveType =
        selectedCategory?.name?.trim().toLowerCase() === 'employee leave';

    const loadOptions = async () => {
        setLoadingOptions(true);
        setLoadError('');
        try {
            const [usersResponse, categoriesResponse] = await Promise.all([
                axiosInstance.get('/users'),
                axiosInstance.get('/categories'),
            ]);
            const loadedUsers = Array.isArray(usersResponse.data) ? usersResponse.data : (usersResponse.data?.data || []);
            setEmployees(loadedUsers);

            if (defaultEmployeeName && loadedUsers.length > 0) {
                const match = loadedUsers.find(
                    (u) => (u.fullName && u.fullName.toLowerCase() === defaultEmployeeName.toLowerCase()) ||
                           (u.username && u.username.toLowerCase() === defaultEmployeeName.toLowerCase()) ||
                           u._id === defaultEmployeeName
                );
                if (match) {
                    setUserId(match._id);
                    setDepartment(employeeDepartment(match));
                }
            }

            const rawCategories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : (categoriesResponse.data?.data || []);
            setCategories(
                rawCategories.filter(
                    (category) => category.section === 'employees'
                )
            );
        } catch (error) {
            setLoadError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Employee and category data could not be loaded.'
            );
        } finally {
            setLoadingOptions(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    const handleEmployeeChange = (event) => {
        const nextUserId = event.target.value;
        const employee = employees.find((item) => item._id === nextUserId);
        setUserId(nextUserId);
        setDepartment(employee ? employeeDepartment(employee) : '');
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        if (!selectedFile) {
            setFile(null);
            return;
        }
        if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
            event.target.value = '';
            setFile(null);
            toast({
                title: 'Unsupported file type',
                description: 'Upload a PDF, Word document, JPG, or PNG file.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            event.target.value = '';
            setFile(null);
            toast({
                title: 'File is too large',
                description: 'The maximum permitted file size is 10 MB.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
            return;
        }
        setFile(selectedFile);
    };

    const resetForm = () => {
        setUserId('');
        setTitle('');
        setDocumentYear(String(CURRENT_YEAR));
        setCategoryId('');
        setSubcategory('');
        setDepartment('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (
            !selectedEmployee ||
            !title ||
            !categoryId ||
            !department ||
            !file ||
            (requiresLeaveType && !subcategory)
        ) {
            toast({
                title: 'Complete all required information',
                description: requiresLeaveType
                    ? 'Select an employee, document type, category, leave type, department, and file.'
                    : 'Select an employee, document type, category, department, and file.',
                status: 'warning',
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append('userId', selectedEmployee._id);
        formData.append('title', title);
        formData.append('documentYear', documentYear);
        formData.append('documentDate', `${documentYear}-01-01`);
        formData.append('categoryId', categoryId);
        if (requiresLeaveType) formData.append('subcategory', subcategory);
        formData.append('department', department);
        formData.append('section', 'employees');
        formData.append('file', file);

        setSubmitting(true);
        try {
            await axiosInstance.post('/documents', formData);
            toast({
                title: 'Employee document uploaded',
                description: `${title} was linked to ${employeeLabel(selectedEmployee)} (Year: ${documentYear}).`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
            resetForm();
            if (typeof fetchDocuments === 'function') await fetchDocuments();
            if (typeof onComplete === 'function') onComplete();
        } catch (error) {
            toast({
                title: 'Document upload failed',
                description:
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card borderRadius="xl" borderWidth="1px" bg={useColorModeValue('gray.50', 'gray.750')} boxShadow="none">
            <CardBody p={{ base: 4, md: 5 }}>
                {loadError && (
                    <Alert status="error" borderRadius="lg" mb={4}>
                        <AlertIcon />
                        {loadError}
                    </Alert>
                )}

                {loadingOptions ? (
                    <Flex justify="center" align="center" py={8} gap={3}>
                        <Spinner size="md" color="teal.500" />
                        <Text color="gray.500" fontSize="sm">Loading employee database...</Text>
                    </Flex>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                            {/* Employee Select */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Select Employee
                                </FormLabel>
                                <Select
                                    placeholder="Choose employee..."
                                    value={userId}
                                    onChange={handleEmployeeChange}
                                    size="sm"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                >
                                    {employees.map((employee) => (
                                        <option key={employee._id} value={employee._id}>
                                            {employeeLabel(employee)} ({employeeDepartment(employee)})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Document Type */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Document Type / Title
                                </FormLabel>
                                <Select
                                    placeholder="Select standard type..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    size="sm"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                >
                                    {DOCUMENT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Category */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Category
                                </FormLabel>
                                <Select
                                    placeholder="Select category..."
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    size="sm"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                >
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Document Year (Determined by HR) */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Document Year (Determined by HR)
                                </FormLabel>
                                <Select
                                    value={documentYear}
                                    onChange={(e) => setDocumentYear(e.target.value)}
                                    size="sm"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                >
                                    {YEAR_OPTIONS.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Department (Auto-filled / Editable) */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Department / Job Role
                                </FormLabel>
                                <Input
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Finance, Sales, Human Resources"
                                    size="sm"
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                />
                            </FormControl>

                            {/* Leave Type if required */}
                            {requiresLeaveType && (
                                <FormControl isRequired>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                        Leave Subcategory
                                    </FormLabel>
                                    <Select
                                        placeholder="Select leave type..."
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                        size="sm"
                                        borderRadius="lg"
                                        bg={useColorModeValue('white', 'gray.700')}
                                    >
                                        {LEAVE_SUBCATEGORIES.map((leave) => (
                                            <option key={leave} value={leave}>
                                                {leave}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* File Upload */}
                            <FormControl isRequired gridColumn={{ base: 'span 1', md: 'span 2', lg: 'span 3' }}>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    Upload Document File (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
                                </FormLabel>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    size="sm"
                                    pt={1}
                                    borderRadius="lg"
                                    bg={useColorModeValue('white', 'gray.700')}
                                />
                                {file && (
                                    <Flex align="center" gap="1.5" mt="1.5" color="teal.600" fontSize="2xs">
                                        <Icon as={FiCheckCircle} />
                                        <Text fontWeight="bold" noOfLines={1}>{file.name}</Text>
                                    </Flex>
                                )}
                            </FormControl>
                        </SimpleGrid>

                        <Flex justify="space-between" align="center" mt={5} pt={3} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.600')} wrap="wrap" gap={3}>
                            <Text fontSize="2xs" color="gray.500">
                                Uploaded document will be linked to the employee dossier and categorized automatically.
                            </Text>

                            <Button
                                type="submit"
                                colorScheme="teal"
                                bg="#004D40"
                                _hover={{ bg: '#00796B' }}
                                size="sm"
                                px={6}
                                borderRadius="lg"
                                leftIcon={<Icon as={FiUploadCloud} />}
                                isLoading={submitting}
                                loadingText="Uploading"
                            >
                                Link & Upload Document
                            </Button>
                        </Flex>
                    </form>
                )}
            </CardBody>
        </Card>
    );
};

export default DocumentUploadForm;
