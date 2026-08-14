import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Grid,
    GridItem,
    Heading,
    Icon,
    Input,
    Select,
    Spinner,
    Text,
    useToast,
} from '@chakra-ui/react';
import { FiCheckCircle, FiFile, FiRefreshCw, FiUploadCloud, FiUser } from 'react-icons/fi';
import axiosInstance from '../services/axiosInstance';

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

const DocumentUploadForm = ({ fetchDocuments }) => {
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userId, setUserId] = useState('');
    const [title, setTitle] = useState('');
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
            setEmployees(usersResponse.data?.data || []);
            setCategories(
                (categoriesResponse.data?.data || []).filter(
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
                description: `${title} was linked to ${employeeLabel(selectedEmployee)}.`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
            resetForm();
            await fetchDocuments?.();
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
        <Card maxW="7xl" mx="auto" mt={6} borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="sm">
            <CardBody p={{ base: 5, md: 7 }}>
                <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} mb={6} direction={{ base: 'column', md: 'row' }}>
                    <Box>
                        <Heading size="md" color="gray.800">Add employee document</Heading>
                        <Text mt={1} fontSize="sm" color="gray.500">
                            Link a validated HR file directly to an employee record.
                        </Text>
                    </Box>
                    <Button
                        leftIcon={<FiRefreshCw />}
                        variant="outline"
                        colorScheme="teal"
                        size="sm"
                        onClick={loadOptions}
                        isLoading={loadingOptions}
                    >
                        Refresh records
                    </Button>
                </Flex>

                {loadError && (
                    <Alert status="error" borderRadius="xl" mb={5}>
                        <AlertIcon />
                        {loadError}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={5}>
                        <GridItem>
                            <FormControl isRequired isDisabled={loadingOptions}>
                                <FormLabel fontSize="sm" fontWeight="700">Employee</FormLabel>
                                <Select
                                    value={userId}
                                    onChange={handleEmployeeChange}
                                    placeholder={loadingOptions ? 'Loading employees…' : 'Select employee from database'}
                                    focusBorderColor="teal.500"
                                    bg="white"
                                >
                                    {employees.map((employee) => (
                                        <option key={employee._id} value={employee._id}>
                                            {employeeLabel(employee)} — {employee.digitalId || employee.email}
                                        </option>
                                    ))}
                                </Select>
                                <FormHelperText>The employee name is read from the selected database record.</FormHelperText>
                            </FormControl>
                        </GridItem>

                        <GridItem>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="700">Document type</FormLabel>
                                <Select value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Select document type" focusBorderColor="teal.500">
                                    {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                </Select>
                                <FormHelperText>Use a standard type so HR records remain consistent.</FormHelperText>
                            </FormControl>
                        </GridItem>

                        <GridItem>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="700">Category</FormLabel>
                                <Select
                                    value={categoryId}
                                    onChange={(event) => {
                                        setCategoryId(event.target.value);
                                        setSubcategory('');
                                    }}
                                    placeholder="Select employee-document category"
                                    focusBorderColor="teal.500"
                                >
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>{category.name}</option>
                                    ))}
                                </Select>
                                <FormHelperText>Categories are loaded from the Employee Documents category list.</FormHelperText>
                            </FormControl>
                        </GridItem>

                        {requiresLeaveType && (
                            <GridItem>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="700">Leave type</FormLabel>
                                    <Select
                                        value={subcategory}
                                        onChange={(event) => setSubcategory(event.target.value)}
                                        placeholder="Select leave type"
                                        focusBorderColor="teal.500"
                                    >
                                        {LEAVE_SUBCATEGORIES.map((leaveType) => (
                                            <option key={leaveType} value={leaveType}>{leaveType}</option>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        This leave classification will be visible in the employee’s document record.
                                    </FormHelperText>
                                </FormControl>
                            </GridItem>
                        )}

                        <GridItem>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="700">Department</FormLabel>
                                <Input value={department} readOnly bg="gray.50" placeholder="Selected automatically with employee" />
                                <FormHelperText>Derived from the employee’s current database job assignment.</FormHelperText>
                            </FormControl>
                        </GridItem>

                        <GridItem colSpan={{ base: 1, lg: 2 }}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="700">Document file</FormLabel>
                                <Box border="1px dashed" borderColor={file ? 'teal.400' : 'gray.300'} borderRadius="xl" p={5} bg={file ? 'teal.50' : 'gray.50'}>
                                    <Flex align="center" justify="space-between" gap={4} wrap="wrap">
                                        <Flex align="center" gap={3}>
                                            <Icon as={file ? FiCheckCircle : FiUploadCloud} boxSize={6} color={file ? 'teal.600' : 'gray.500'} />
                                            <Box>
                                                <Text fontSize="sm" fontWeight="700">{file ? file.name : 'Choose an employee document'}</Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOC, DOCX, JPG or PNG — maximum 10 MB'}
                                                </Text>
                                            </Box>
                                        </Flex>
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            maxW={{ base: '100%', md: '320px' }}
                                            bg="white"
                                            p={1}
                                        />
                                    </Flex>
                                </Box>
                            </FormControl>
                        </GridItem>
                    </Grid>

                    {selectedEmployee && (
                        <Flex mt={5} p={4} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.200" align="center" gap={3} wrap="wrap">
                            <Icon as={FiUser} color="teal.600" />
                            <Text fontWeight="700">{employeeLabel(selectedEmployee)}</Text>
                            <Badge colorScheme="teal">{selectedEmployee.digitalId || 'No employee ID'}</Badge>
                            <Badge colorScheme={selectedEmployee.status === 'active' ? 'green' : 'gray'}>{selectedEmployee.status || 'Unknown status'}</Badge>
                            <Text fontSize="sm" color="gray.600">{department}</Text>
                        </Flex>
                    )}

                    <Flex justify="flex-end" gap={3} mt={6}>
                        <Button variant="ghost" onClick={resetForm} isDisabled={submitting}>Clear</Button>
                        <Button
                            type="submit"
                            colorScheme="teal"
                            leftIcon={submitting ? <Spinner size="sm" /> : <FiFile />}
                            isLoading={submitting}
                            loadingText="Uploading"
                            isDisabled={loadingOptions || Boolean(loadError)}
                        >
                            Upload document
                        </Button>
                    </Flex>
                </form>
            </CardBody>
        </Card>
    );
};

export default DocumentUploadForm;
