import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiFileText,
  FiFolder,
  FiInfo,
  FiPlus,
  FiShield,
  FiStar,
  FiTrash2,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { useUserStore } from '../store/user';
import { isUserPermittedForDashboard } from '../utils/dashboardAccess';

const SUGGESTED_TITLES = [
  'Curriculum Vitae (CV) / Resume',
  'University / College Degree Certificate',
  'National ID / Passport Copy',
  'Signed Employment Contract / Offer Letter',
  'Medical Certificate / Fitness Report',
  'Certificate of Good Conduct / Police Clearance',
  'Professional Certifications & Awards',
  'Guarantor Document / Agreement',
  'Bank Account Confirmation Letter',
];

const getFileIcon = (title = '', url = '') => {
  const str = `${title} ${url}`.toLowerCase();
  if (str.includes('.pdf') || str.includes('pdf')) return FiFileText;
  if (str.includes('.doc') || str.includes('doc')) return FiFile;
  if (str.includes('.jpg') || str.includes('.png') || str.includes('image')) return FiFile;
  return FiFileText;
};

const EmployeeFileUploadForm = ({ embedded = false }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const toast = useToast();
  const navigate = useNavigate();

  // Color modes & styles
  const bg = useColorModeValue('#f4f7f9', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const navyBrand = '#294f73';

  // State
  const [categories, setCategories] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch official employee categories matching HR Document Repository
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data } = await axiosInstance.get('/categories');
      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : data?.categories || [];
      // Filter for employee categories (section: 'employees' or 'Employee Documents' or all non-company)
      const empCategories = rawList.filter(
        (c) => c.section === 'employees' || c.section === 'Employee Documents' || !c.section
      );
      const finalCategories = empCategories.length > 0 ? empCategories : rawList;
      setCategories(finalCategories);
      if (finalCategories.length > 0) {
        setSelectedCategory((prev) => prev || finalCategories[0]._id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch already uploaded documents for this employee
  const fetchMyDocuments = useCallback(async () => {
    if (!currentUser?._id) return;
    setLoadingDocs(true);
    try {
      const { data } = await axiosInstance.get('/documents', {
        params: { userId: currentUser._id, section: 'employees' },
      });
      setMyDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employee documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    fetchCategories();
    fetchMyDocuments();
  }, [fetchCategories, fetchMyDocuments]);

  // Mandatory Categories vs Optional Categories calculation
  const mandatoryCategories = useMemo(() => {
    return categories.filter((c) => Boolean(c.isMandatory));
  }, [categories]);

  const optionalCategories = useMemo(() => {
    return categories.filter((c) => !c.isMandatory);
  }, [categories]);

  // Determine missing mandatory categories
  const missingMandatoryCategories = useMemo(() => {
    if (mandatoryCategories.length === 0) return [];
    return mandatoryCategories.filter((mandCat) => {
      const hasUploaded = myDocuments.some((doc) => {
        const docCatId = typeof doc.category === 'object' ? doc.category?._id : doc.category;
        return String(docCatId) === String(mandCat._id);
      });
      return !hasUploaded;
    });
  }, [mandatoryCategories, myDocuments]);

  const isAllMandatoryUploaded = missingMandatoryCategories.length === 0;

  const handleSelectSuggestedTitle = (title) => {
    setDocumentTitle(title);
    setFormErrors((prev) => ({ ...prev, title: null }));

    const lower = title.toLowerCase();
    const matched = categories.find((cat) => {
      const catLower = (cat.name || '').toLowerCase();
      if (lower.includes('degree') || lower.includes('educational') || lower.includes('university')) {
        return catLower.includes('educational') || catLower.includes('education');
      }
      if (lower.includes('certificat') || lower.includes('award')) {
        return catLower.includes('certificat') || catLower.includes('award');
      }
      if (lower.includes('contract') || lower.includes('offer')) {
        return catLower.includes('contract');
      }
      if (lower.includes('guarantor')) {
        return catLower.includes('guarantor');
      }
      if (lower.includes('passport') || lower.includes('national id') || lower.includes('identification')) {
        return catLower.includes('passport') || catLower.includes('identification') || catLower.includes('id');
      }
      if (lower.includes('medical') || lower.includes('fitness')) {
        return catLower.includes('medical') || catLower.includes('fitness');
      }
      if (lower.includes('police') || lower.includes('conduct')) {
        return catLower.includes('police') || catLower.includes('clearance') || catLower.includes('conduct');
      }
      return false;
    });

    if (matched) {
      setSelectedCategory(matched._id);
      setFormErrors((prev) => ({ ...prev, category: null }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum permitted file size is 10 MB.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
    setFormErrors((prev) => ({ ...prev, file: null }));

    // If title is empty, suggest file name without extension
    if (!documentTitle) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setDocumentTitle(baseName);
      setFormErrors((prev) => ({ ...prev, title: null }));
    }
  };

  // Upload Document
  const handleUploadDocument = async (e) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!selectedCategory) errors.category = 'Please select a document category.';
    if (!documentTitle.trim()) errors.title = 'Please enter a document title.';
    if (!selectedFile) errors.file = 'Please select a file to upload.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setUploading(true);
    setFormErrors({});

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('categoryId', selectedCategory);
    formData.append('title', documentTitle.trim());
    formData.append('userId', currentUser?._id || '');
    formData.append('employeeName', currentUser?.fullName || currentUser?.username || 'Employee');
    formData.append('department', currentUser?.jobTitle || currentUser?.role || 'General');
    formData.append('section', 'employees');
    formData.append('documentDate', new Date().toISOString());

    try {
      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Document Uploaded',
        description: `"${documentTitle}" has been filed into your employee dossier.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      // Reset form
      setDocumentTitle('');
      setSelectedFile(null);
      const fileInput = document.getElementById('employee-doc-file-input');
      if (fileInput) fileInput.value = '';

      // Refresh document list
      fetchMyDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: 'Upload Failed',
        description: err.response?.data?.error || err.response?.data?.message || err.message || 'Could not upload document.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${docTitle}"?`)) return;

    setDeletingId(docId);
    try {
      await axiosInstance.delete(`/documents/${docId}`);
      toast({
        title: 'Document Removed',
        description: `"${docTitle}" has been removed.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      fetchMyDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to remove document.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleProceedToTutorials = () => {
    if (!isAllMandatoryUploaded) {
      toast({
        title: 'Mandatory Documents Required',
        description: `Please upload all mandatory documents (${missingMandatoryCategories.map((c) => c.name).join(', ')}) before proceeding.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    navigate('/secondpage');
  };

  const isAlreadyActiveOrHr = embedded || currentUser?.status === 'active' || isUserPermittedForDashboard(currentUser);

  return (
    <Box
      minH={embedded ? 'auto' : '100vh'}
      bg={embedded ? 'transparent' : bg}
      py={embedded ? 0 : { base: 6, md: 10 }}
      px={embedded ? 0 : { base: 4, md: 8 }}
    >
      <Container maxW={embedded ? 'full' : '6xl'} px={embedded ? 0 : undefined}>
        {/* Top Header Card */}
        {isAlreadyActiveOrHr ? (
          <Box mb={6} p={5} bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex boxSize="44px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                  <Icon as={FiFolder} boxSize={6} />
                </Flex>
                <Box>
                  <Heading size="md" color={navyBrand}>
                    My Document Management
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    Upload and manage non-mandatory credentials, certifications, and updated documents for your HR dossier.
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme="teal" bg="teal.50" color="teal.700" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="800">
                {myDocuments.length} DOCUMENT(S) ON FILE
              </Badge>
            </Flex>
          </Box>
        ) : (
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: 5, md: 8 }}
            boxShadow="sm"
            mb={6}
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              gap={4}
            >
              <HStack spacing={4}>
                <Image
                  src="/brand/tradethiopia-logo.png"
                  alt="Trade Ethiopia Group"
                  h="60px"
                  objectFit="contain"
                  fallback={<Heading size="md" color={navyBrand}>TradeEthiopia Group</Heading>}
                />
                <Box>
                  <HStack spacing={2} wrap="wrap">
                    <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5} fontSize="xs">
                      Step 2 of 4: Document Submission
                    </Badge>
                    <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="xs">
                      <HStack spacing={1}>
                        <Icon as={FiCheck} />
                        <Text>Personal Info Form Approved</Text>
                      </HStack>
                    </Badge>
                    {mandatoryCategories.length > 0 && (
                      <Badge
                        colorScheme={isAllMandatoryUploaded ? 'green' : 'purple'}
                        variant="solid"
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                        fontSize="xs"
                      >
                        {isAllMandatoryUploaded
                          ? 'All Mandatory Documents Uploaded ✓'
                          : `${missingMandatoryCategories.length} Mandatory Document(s) Required`}
                      </Badge>
                    )}
                  </HStack>
                  <Heading mt={1} size="md" color={navyBrand} letterSpacing="0.02em">
                    Employee Document Submission
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    Upload your credentials. Mandatory documents are required to access tutorials. Optional documents can also be uploaded from your dashboard sidebar later.
                  </Text>
                </Box>
              </HStack>

              <Tooltip
                label={
                  !isAllMandatoryUploaded
                    ? `Upload missing mandatory documents (${missingMandatoryCategories.map((c) => c.name).join(', ')}) to unlock tutorials`
                    : 'Proceed to company tutorials'
                }
                hasArrow
              >
                <Button
                  colorScheme="teal"
                  size="md"
                  rightIcon={<Icon as={FiArrowRight} />}
                  onClick={handleProceedToTutorials}
                  isDisabled={!isAllMandatoryUploaded}
                  boxShadow="sm"
                >
                  Continue to Tutorials
                </Button>
              </Tooltip>
            </Flex>

            {/* Stepper Bar */}
            <Divider my={4} borderColor={borderColor} />
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} fontSize="xs">
              <HStack spacing={2} color="green.600" fontWeight="700">
                <Icon as={FiCheckCircle} />
                <Text>1. Personal Form (Approved)</Text>
              </HStack>
              <HStack spacing={2} color="teal.600" fontWeight="800">
                <Box w={2} h={2} borderRadius="full" bg="teal.500" />
                <Text>2. Upload Documents</Text>
              </HStack>
              <HStack spacing={2} color="gray.400">
                <Icon as={FiClock} />
                <Text>3. Training Tutorials</Text>
              </HStack>
              <HStack spacing={2} color="gray.400">
                <Icon as={FiAward} />
                <Text>4. Exam & Portal Access</Text>
              </HStack>
            </SimpleGrid>
          </Box>
        )}

        {/* Mandatory Categories Alert / Requirement Banner */}
        {!isAlreadyActiveOrHr && mandatoryCategories.length > 0 && !isAllMandatoryUploaded && (
          <Alert
            status="warning"
            borderRadius="xl"
            mb={6}
            bg="purple.50"
            border="1.5px solid"
            borderColor="purple.300"
            color="purple.900"
          >
            <AlertIcon color="purple.600" />
            <Box flex="1">
              <HStack spacing={2}>
                <AlertTitle fontSize="sm" fontWeight="800">
                  Mandatory Documents Required
                </AlertTitle>
                <Badge colorScheme="purple" variant="solid" fontSize="10px" borderRadius="full">
                  Action Required
                </Badge>
              </HStack>
              <AlertDescription fontSize="xs" color="purple.800" mt={1} display="block">
                HR has set mandatory document requirements for your onboarding. You must upload at least one document for each mandatory category below before tutorial access is unlocked:
              </AlertDescription>

              <HStack mt={3} spacing={2} wrap="wrap">
                {missingMandatoryCategories.map((mandCat) => (
                  <Button
                    key={mandCat._id}
                    size="xs"
                    colorScheme="purple"
                    variant="outline"
                    bg="white"
                    leftIcon={<Icon as={FiStar} />}
                    onClick={() => {
                      setSelectedCategory(mandCat._id);
                      setDocumentTitle(mandCat.name);
                    }}
                  >
                    Upload {mandCat.name}
                  </Button>
                ))}
              </HStack>
            </Box>
          </Alert>
        )}

        {/* Optional Guidance Alert */}
        {!embedded && isAllMandatoryUploaded && (
          <Alert
            status="success"
            borderRadius="xl"
            mb={6}
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            color="green.900"
          >
            <AlertIcon color="green.600" />
            <Box flex="1">
              <Text fontSize="sm" fontWeight="700">
                All mandatory documents have been uploaded!
              </Text>
              <Text fontSize="xs" color="green.800" mt={0.5}>
                You can upload any additional optional credentials now, or proceed directly to the training tutorials. You can also upload non-mandatory documents later from your employee dashboard sidebar.
              </Text>
            </Box>
            <Button
              size="xs"
              colorScheme="green"
              onClick={handleProceedToTutorials}
              rightIcon={<Icon as={FiArrowRight} />}
              flexShrink={0}
            >
              Proceed to Tutorials
            </Button>
          </Alert>
        )}

        {/* Main 2-Column Grid: Left Upload Form, Right Document Dossier */}
        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={6} alignItems="flex-start">
          {/* ══════════════ LEFT: Upload Document Card (5 Cols) ══════════════ */}
          <Box
            gridColumn={{ base: 'span 1', lg: 'span 5' }}
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p={6}
            boxShadow="sm"
          >
            <HStack spacing={2} mb={4}>
              <Flex w={8} h={8} borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiUploadCloud} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color={navyBrand}>
                  Upload New Document
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Select an HR category (★ = Mandatory)
                </Text>
              </Box>
            </HStack>

            <VStack as="form" spacing={4} onSubmit={handleUploadDocument} align="stretch">
              {/* Category Selector */}
              <FormControl isRequired isInvalid={Boolean(formErrors.category)}>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                  Document Category (HR Classification)
                </FormLabel>
                {loadingCategories ? (
                  <Skeleton h="38px" borderRadius="md" />
                ) : (
                  <Select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setFormErrors((prev) => ({ ...prev, category: null }));
                    }}
                    placeholder={categories.length === 0 ? 'Loading categories...' : 'Select category'}
                    borderRadius="lg"
                    fontSize="sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {cat.isMandatory ? '★ (MANDATORY)' : ''}
                      </option>
                    ))}
                  </Select>
                )}
                {formErrors.category && <FormErrorMessage fontSize="xs">{formErrors.category}</FormErrorMessage>}
              </FormControl>

              {/* Document Title */}
              <FormControl isRequired isInvalid={Boolean(formErrors.title)}>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                  Document Title / Description
                </FormLabel>
                <Input
                  value={documentTitle}
                  onChange={(e) => {
                    setDocumentTitle(e.target.value);
                    setFormErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="e.g. Signed Employment Contract, Degree Certificate"
                  borderRadius="lg"
                  fontSize="sm"
                />
                {formErrors.title && <FormErrorMessage fontSize="xs">{formErrors.title}</FormErrorMessage>}
              </FormControl>

              {/* Quick Suggestion Chips */}
              <Box>
                <Text fontSize="10px" fontWeight="700" color="gray.500" mb={1.5} textTransform="uppercase">
                  Suggested Titles:
                </Text>
                <Flex wrap="wrap" gap={1.5}>
                  {SUGGESTED_TITLES.map((title) => (
                    <Badge
                      key={title}
                      cursor="pointer"
                      onClick={() => handleSelectSuggestedTitle(title)}
                      colorScheme={documentTitle === title ? 'teal' : 'gray'}
                      variant={documentTitle === title ? 'solid' : 'subtle'}
                      fontSize="9px"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      _hover={{ bg: 'teal.100', color: 'teal.800' }}
                    >
                      {title}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* File Dropzone / Picker */}
              <FormControl isRequired isInvalid={Boolean(formErrors.file)}>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                  Select File (PDF, DOC, DOCX, JPG, PNG up to 10MB)
                </FormLabel>
                <Box
                  position="relative"
                  border="2px dashed"
                  borderColor={selectedFile ? 'teal.400' : 'gray.300'}
                  bg={selectedFile ? 'teal.50' : 'gray.50'}
                  borderRadius="xl"
                  p={4}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ borderColor: 'teal.500', bg: 'teal.50' }}
                >
                  <input
                    type="file"
                    id="employee-doc-file-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  <Icon as={FiUploadCloud} boxSize={8} color={selectedFile ? 'teal.600' : 'gray.400'} mb={1} />
                  {selectedFile ? (
                    <Box>
                      <Text fontSize="xs" fontWeight="700" color="teal.800">
                        {selectedFile.name}
                      </Text>
                      <Text fontSize="10px" color="teal.600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                      </Text>
                    </Box>
                  ) : (
                    <Box>
                      <Text fontSize="xs" fontWeight="600" color="gray.600">
                        Click or drag file here to upload
                      </Text>
                      <Text fontSize="10px" color="gray.400">
                        Supports PDF, Word Documents, and Images
                      </Text>
                    </Box>
                  )}
                </Box>
                {formErrors.file && <FormErrorMessage fontSize="xs">{formErrors.file}</FormErrorMessage>}
              </FormControl>

              {/* Submit Upload Button */}
              <Button
                type="submit"
                colorScheme="teal"
                w="100%"
                isLoading={uploading}
                loadingText="Uploading to HR Dossier..."
                leftIcon={<Icon as={FiUploadCloud} />}
                borderRadius="lg"
                mt={2}
              >
                Upload to HR Dossier
              </Button>
            </VStack>
          </Box>

          {/* ══════════════ RIGHT: Uploaded Documents Dossier (7 Cols) ══════════════ */}
          <Box
            gridColumn={{ base: 'span 1', lg: 'span 7' }}
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            p={6}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Flex w={8} h={8} borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center">
                  <Icon as={FiFolder} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="sm" color={navyBrand}>
                    My Uploaded Dossier Documents
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    {myDocuments.length} document{myDocuments.length === 1 ? '' : 's'} registered in HR system
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme="green" bg="green.50" color="green.700" borderRadius="full" px={2.5} py={0.5} fontSize="xs" fontWeight="800">
                {myDocuments.length} UPLOADED
              </Badge>
            </Flex>

            {loadingDocs ? (
              <VStack spacing={3} py={8}>
                <Spinner color="teal.500" />
                <Text fontSize="xs" color="gray.500">Loading your dossier documents...</Text>
              </VStack>
            ) : myDocuments.length === 0 ? (
              <Box
                py={12}
                px={6}
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="xl"
                textAlign="center"
                bg="gray.50"
              >
                <Icon as={FiFileText} boxSize={10} color="gray.400" mb={2} />
                <Heading size="xs" color="gray.600" mb={1}>
                  No Documents Uploaded Yet
                </Heading>
                <Text fontSize="xs" color="gray.400" maxW="400px" mx="auto" mb={4}>
                  {mandatoryCategories.length > 0
                    ? `Please upload the required mandatory documents (${mandatoryCategories.map((c) => c.name).join(', ')}) using the form on the left.`
                    : 'You have not uploaded any documents yet.'}
                </Text>
                {!isAlreadyActiveOrHr && isAllMandatoryUploaded && (
                  <Button
                    size="sm"
                    colorScheme="teal"
                    rightIcon={<Icon as={FiArrowRight} />}
                    onClick={handleProceedToTutorials}
                  >
                    Proceed to Tutorials
                  </Button>
                )}
              </Box>
            ) : (
              <Stack spacing={3}>
                {myDocuments.map((doc) => {
                  const IconComponent = getFileIcon(doc.title, doc.fileUrl);
                  const categoryObj = typeof doc.category === 'object' ? doc.category : categories.find((c) => c._id === doc.category);
                  const categoryName = categoryObj?.name || 'Employee Document';
                  const isCatMandatory = Boolean(categoryObj?.isMandatory);

                  return (
                    <Flex
                      key={doc._id}
                      p={3.5}
                      border="1px solid"
                      borderColor={isCatMandatory ? 'purple.200' : 'teal.200'}
                      borderRadius="2xl"
                      bg={isCatMandatory ? '#faf5ff' : '#f0fdfa'}
                      align="center"
                      justify="space-between"
                      gap={3}
                      transition="all 0.2s"
                      _hover={{ borderColor: isCatMandatory ? 'purple.400' : 'teal.400', bg: 'white', boxShadow: 'xs' }}
                    >
                      <HStack spacing={3} minW={0}>
                        <Flex
                          w="42px"
                          h="42px"
                          borderRadius="xl"
                          bg={isCatMandatory ? 'purple.100' : 'teal.100'}
                          color={isCatMandatory ? 'purple.700' : 'teal.700'}
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <Icon as={IconComponent} boxSize={5} />
                        </Flex>
                        <Box minW={0}>
                          <Text fontWeight="800" fontSize="sm" color="gray.900" isTruncated>
                            {doc.title}
                          </Text>
                          <HStack spacing={2} mt={0.5} flexWrap="wrap">
                            <Badge
                              colorScheme={isCatMandatory ? 'purple' : 'teal'}
                              variant="subtle"
                              fontSize="9px"
                              fontWeight="800"
                              borderRadius="full"
                              px={2}
                              py={0.5}
                              textTransform="uppercase"
                            >
                              {categoryName} {isCatMandatory ? '★' : ''}
                            </Badge>
                            <Text fontSize="10px" color="gray.500">
                              {new Date(doc.createdAt || doc.documentDate || Date.now()).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>

                      <HStack spacing={1} flexShrink={0}>
                        {doc.fileUrl && (
                          <IconButton
                            as="a"
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<Icon as={FiExternalLink} />}
                            aria-label="View Document"
                            size="sm"
                            variant="ghost"
                            colorScheme="teal"
                          />
                        )}
                        <IconButton
                          icon={<Icon as={FiTrash2} />}
                          aria-label="Delete Document"
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          isLoading={deletingId === doc._id}
                          onClick={() => handleDeleteDocument(doc._id, doc.title)}
                        />
                      </HStack>
                    </Flex>
                  );
                })}

                {!embedded && (
                  <Flex justify="space-between" align="center" pt={4} w="full" wrap="wrap" gap={3}>
                    <Button
                      variant="outline"
                      colorScheme="teal"
                      size="sm"
                      onClick={() => navigate('/employee-info')}
                    >
                      ← Back to Personal Form
                    </Button>
                    <Tooltip
                      label={
                        !isAllMandatoryUploaded
                          ? `Upload missing mandatory documents (${missingMandatoryCategories.map((c) => c.name).join(', ')}) to unlock tutorials`
                          : 'Proceed to company tutorials'
                      }
                      hasArrow
                    >
                      <Button
                        colorScheme="teal"
                        size="md"
                        rightIcon={<Icon as={FiArrowRight} />}
                        isDisabled={!isAllMandatoryUploaded}
                        onClick={handleProceedToTutorials}
                      >
                        Proceed to Company Tutorials
                      </Button>
                    </Tooltip>
                  </Flex>
                )}
              </Stack>
            )}
          </Box>
        </SimpleGrid>

        {/* Bottom Page Navigation Bar (Hidden when embedded) */}
        {!embedded && (
          <Flex
            mt={8}
            p={4}
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={3}
            boxShadow="sm"
          >
            <Button
              variant="outline"
              colorScheme="gray"
              size="sm"
              onClick={() => navigate('/employee-info')}
            >
              ← Back to Personal Information Form
            </Button>

            <HStack spacing={3}>
              {isAllMandatoryUploaded && (
                <Button
                  variant="ghost"
                  colorScheme="teal"
                  size="sm"
                  onClick={handleProceedToTutorials}
                >
                  Skip & Continue
                </Button>
              )}
              <Tooltip
                label={
                  !isAllMandatoryUploaded
                    ? `Upload missing mandatory documents (${missingMandatoryCategories.map((c) => c.name).join(', ')}) to proceed`
                    : 'Proceed to tutorials'
                }
                hasArrow
              >
                <Button
                  colorScheme="teal"
                  size="sm"
                  rightIcon={<Icon as={FiArrowRight} />}
                  isDisabled={!isAllMandatoryUploaded}
                  onClick={handleProceedToTutorials}
                >
                  Proceed to Tutorials →
                </Button>
              </Tooltip>
            </HStack>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default EmployeeFileUploadForm;
