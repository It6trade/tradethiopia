import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Badge,
    Box,
    Button,
    ButtonGroup,
    Divider,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Icon,
    IconButton,
    Image,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Skeleton,
    Stack,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
    FiBriefcase,
    FiCalendar,
    FiClock,
    FiChevronLeft,
    FiChevronRight,
    FiExternalLink,
    FiFile,
    FiFileText,
    FiFilter,
    FiFolder,
    FiGrid,
    FiList,
    FiRefreshCw,
    FiSearch,
    FiUsers,
    FiX,
} from 'react-icons/fi';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import DocumentUploadForm from './DocumentUploadForm';

const PAGE_SIZE = 9;

const COMPANY_BRANDS = [
    { name: 'Tradethiopia B2B', logo: '/company-logos/tradethiopia-b2b.png', aliases: ['tradethiopia b2b', 'trade ethiopia b2b', 'tradethiopia marketplace', 'tradeethiopia marketplace', 'b2b'] },
    { name: 'TESBINN', logo: '/company-logos/tesbinn.png', aliases: ['tesbinn', 'tesbin', 'trade ethiopia school of business and innovation'] },
    { name: 'Ethio-International Expo', logo: '/company-logos/ethio-international-expo.jpg', aliases: ['ethio international expo', 'ethio-international expo', 'ethio international', 'eie'] },
    { name: 'TETV', logo: '/company-logos/tetv.png', aliases: ['tetv', 'tradex tv', 'trade x tv', 'trade-x tv'] },
    { name: 'ENISRA', logo: '/company-logos/enisra.png', aliases: ['enisra', 'enisra.com', 'enesra'] },
];

const normalize = (value = '') => String(value).trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const getDocumentBrand = (document) => {
    const candidates = [document?.department, document?.company, document?.organization, document?.businessUnit]
        .map(normalize)
        .filter(Boolean);

    return COMPANY_BRANDS.find((brand) => {
        const aliases = [brand.name, ...brand.aliases].map(normalize);
        return candidates.some((candidate) => aliases.some((alias) => candidate === alias || candidate.includes(alias)));
    });
};

const getFileType = (document) => {
    const source = `${document?.fileUrl || ''} ${document?.file || ''} ${document?.title || ''}`.toLowerCase();
    if (/\.pdf(?:\?|$)|\bpdf\b/.test(source)) return 'PDF';
    if (/\.(doc|docx)(?:\?|$)|\bword\b/.test(source)) return 'Word';
    if (/\.(xls|xlsx)(?:\?|$)|\bexcel\b/.test(source)) return 'Spreadsheet';
    if (/\.(png|jpe?g|webp)(?:\?|$)/.test(source)) return 'Image';
    return 'Other';
};

const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : new window.Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    }).format(date);
};

const isLicenseDocument = (document) => ['license', 'licenses', 'licensing'].includes(normalize(document?.category?.name));

const getLicenseStatus = (document) => {
    const renewalValue = document?.licenseSchedule?.renewalDate;
    if (!renewalValue) return { label: 'Set renewal date', detail: 'No schedule', color: 'gray', days: null };

    const renewalDate = new Date(renewalValue);
    const today = new Date();
    renewalDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((renewalDate.getTime() - today.getTime()) / 86400000);
    const reminderDays = Number(document.licenseSchedule?.reminderDaysBefore ?? 30);

    if (days < 0) return { label: 'Update overdue', detail: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, color: 'red', days };
    if (days === 0) return { label: 'Update due today', detail: 'Due today', color: 'red', days };
    if (days <= reminderDays) return { label: 'Update approaching', detail: `${days} day${days === 1 ? '' : 's'} remaining`, color: 'orange', days };
    return { label: 'License current', detail: `${days} days remaining`, color: 'green', days };
};

const CompanyLogo = ({ document, compact = false }) => {
    const brand = getDocumentBrand(document);
    return brand ? (
        <Image src={brand.logo} alt={`${brand.name} logo`} maxH={compact ? '38px' : '70px'} maxW={compact ? '86px' : '90%'} objectFit="contain" />
    ) : (
        <Flex boxSize={compact ? '40px' : '58px'} borderRadius="xl" align="center" justify="center" bg="teal.50" color="teal.600">
            <Icon as={FiFileText} boxSize={compact ? '5' : '7'} />
        </Flex>
    );
};

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [deleteDocument, setDeleteDocument] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [licenseDocument, setLicenseDocument] = useState(null);
    const [licenseRenewalDate, setLicenseRenewalDate] = useState('');
    const [licenseReminderDays, setLicenseReminderDays] = useState('30');
    const [isSavingLicense, setIsSavingLicense] = useState(false);
    const toast = useToast();
    const location = useLocation();

    const panelBg = useColorModeValue('white', 'gray.800');
    const pageBg = useColorModeValue('gray.50', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const muted = useColorModeValue('gray.600', 'gray.300');
    const softBg = useColorModeValue('gray.50', 'gray.700');

    const fetchDocuments = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents`, { params: { section: 'companys' } });
            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            const message = requestError.response?.data?.error || requestError.message || 'Unable to load company documents.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const allCategories = Array.isArray(response.data?.data) ? response.data.data : [];
            setCategories(allCategories.filter((category) => category.section === 'companys'));
        } catch (requestError) {
            toast({ title: 'Categories could not be loaded', description: requestError.message, status: 'error', duration: 3500, isClosable: true });
        }
    }, [toast]);

    useEffect(() => {
        fetchDocuments();
        fetchCategories();
    }, [fetchCategories, fetchDocuments]);

    const departments = useMemo(() => [...new Set(documents.map((doc) => doc.department).filter((value) => value && value !== 'none'))].sort(), [documents]);
    const fileTypes = useMemo(() => [...new Set(documents.map(getFileType))].sort(), [documents]);
    const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
    const visibleCategories = useMemo(() => sortedCategories.filter((category) => normalize(category.name).includes(normalize(categorySearch))), [categorySearch, sortedCategories]);

    const filteredDocuments = useMemo(() => {
        const now = Date.now();
        const dateDays = Number(selectedDateRange);
        return documents.filter((doc) => {
            const searchTarget = normalize(`${doc.title} ${doc.category?.name || ''} ${doc.department || ''}`);
            const matchesSearch = searchTarget.includes(normalize(searchQuery));
            const matchesCategory = !selectedCategory || doc.category?._id === selectedCategory;
            const matchesDepartment = !selectedDepartment || doc.department === selectedDepartment;
            const matchesFileType = !selectedFileType || getFileType(doc) === selectedFileType;
            const createdTime = doc.createdAt ? new Date(doc.createdAt).getTime() : NaN;
            const matchesDate = !dateDays || (!Number.isNaN(createdTime) && now - createdTime <= dateDays * 86400000);
            return matchesSearch && matchesCategory && matchesDepartment && matchesFileType && matchesDate;
        });
    }, [documents, searchQuery, selectedCategory, selectedDepartment, selectedFileType, selectedDateRange]);

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
    const paginatedDocuments = filteredDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const activeFilterCount = [selectedCategory, selectedDepartment, selectedFileType, selectedDateRange].filter(Boolean).length;
    const assignedDocuments = documents.filter((doc) => getDocumentBrand(doc)).length;
    const recentDocuments = documents.filter((doc) => doc.createdAt && Date.now() - new Date(doc.createdAt).getTime() <= 30 * 86400000).length;

    useEffect(() => setPage(1), [searchQuery, selectedCategory, selectedDepartment, selectedFileType, selectedDateRange, viewMode]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedDepartment('');
        setSelectedFileType('');
        setSelectedDateRange('');
    };

    const handleEditClick = (doc) => {
        setEditDocument(doc);
        setTitle(doc.title || '');
        setCategoryId(doc.category?._id || '');
        setDepartment(doc.department || '');
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${editDocument._id}`, { title: title.trim(), category: categoryId, department });
            await fetchDocuments({ silent: true });
            setIsEditOpen(false);
            toast({ title: 'Document updated', description: 'The document information is now current.', status: 'success', duration: 3000, isClosable: true });
        } catch (requestError) {
            toast({ title: 'Document could not be updated', description: requestError.response?.data?.error || requestError.message, status: 'error', duration: 4000, isClosable: true });
        }
    };

    const confirmDeleteDocument = async () => {
        if (!deleteDocument) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/documents/${deleteDocument._id}`);
            setDocuments((current) => current.filter((doc) => doc._id !== deleteDocument._id));
            if (previewDocument?._id === deleteDocument._id) setPreviewDocument(null);
            toast({ title: 'Document deleted', description: `${deleteDocument.title} was permanently removed.`, status: 'success', duration: 3000, isClosable: true });
            setDeleteDocument(null);
        } catch (requestError) {
            toast({ title: 'Document could not be deleted', description: requestError.response?.data?.error || requestError.message, status: 'error', duration: 4000, isClosable: true });
        } finally {
            setIsDeleting(false);
        }
    };

    const saveCategory = async () => {
        const categoryName = newCategoryName.trim();
        if (!categoryName) return;
        setIsSavingCategory(true);
        try {
            if (isEditingCategory) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${editCategoryId}`, { name: categoryName });
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, { name: categoryName, section: 'companys' });
            }
            await fetchCategories();
            setNewCategoryName('');
            setIsEditingCategory(false);
            setEditCategoryId('');
            toast({ title: isEditingCategory ? 'Category updated' : 'Category created', status: 'success', duration: 2500, isClosable: true });
        } catch (requestError) {
            toast({ title: 'Category could not be saved', description: requestError.response?.data?.error || requestError.message, status: 'error', duration: 4000, isClosable: true });
        } finally {
            setIsSavingCategory(false);
        }
    };

    const deleteCategory = async (category) => {
        if (!window.confirm(`Delete the “${category.name}” category? Documents using it may be affected.`)) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${category._id}`);
            setCategories((current) => current.filter((item) => item._id !== category._id));
            if (selectedCategory === category._id) setSelectedCategory('');
        } catch (requestError) {
            toast({ title: 'Category could not be deleted', description: requestError.response?.data?.error || requestError.message, status: 'error', duration: 4000, isClosable: true });
        }
    };

    const openEditCategory = (category) => {
        setNewCategoryName(category.name);
        setEditCategoryId(category._id);
        setIsEditingCategory(true);
    };

    const openLicenseSchedule = (document) => {
        setLicenseDocument(document);
        setLicenseRenewalDate(document.licenseSchedule?.renewalDate?.slice(0, 10) || '');
        setLicenseReminderDays(String(document.licenseSchedule?.reminderDaysBefore ?? 30));
    };

    const saveLicenseSchedule = async () => {
        const reminderDaysBefore = Number(licenseReminderDays);
        if (!licenseRenewalDate || !Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0 || reminderDaysBefore > 365) {
            toast({ title: 'Check the renewal schedule', description: 'Select a date and enter a whole-number reminder interval from 0 to 365 days.', status: 'warning', duration: 4000, isClosable: true });
            return;
        }

        setIsSavingLicense(true);
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${licenseDocument._id}`, {
                licenseSchedule: { renewalDate: licenseRenewalDate, reminderDaysBefore },
            });
            setDocuments((current) => current.map((doc) => doc._id === response.data._id ? response.data : doc));
            if (previewDocument?._id === response.data._id) setPreviewDocument(response.data);
            setLicenseDocument(null);
            toast({ title: 'License schedule saved', description: 'HR can now see the remaining days and reminder window on this document.', status: 'success', duration: 3500, isClosable: true });
        } catch (requestError) {
            toast({ title: 'License schedule could not be saved', description: requestError.response?.data?.error || requestError.message, status: 'error', duration: 4500, isClosable: true });
        } finally {
            setIsSavingLicense(false);
        }
    };

    return (
        <Box bg={pageBg} minH="100vh" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
            <Box maxW="1500px" mx="auto">
                <Flex justify="space-between" align={{ base: 'start', lg: 'center' }} direction={{ base: 'column', lg: 'row' }} gap="5" mb="7">
                    <Box>
                        <Text color="teal.600" fontSize="sm" fontWeight="800" letterSpacing="wide" textTransform="uppercase">HR workspace / Documents</Text>
                        <Heading size={{ base: 'xl', md: '2xl' }} mt="1">Company Document Library</Heading>
                        <Text color={muted} mt="2" maxW="760px">Organize policies, company profiles, training materials, agreements, and operational files in one searchable workspace.</Text>
                    </Box>
                    <HStack spacing="3" flexWrap="wrap">
                        <Button leftIcon={<Icon as={FiRefreshCw} />} variant="outline" colorScheme="teal" onClick={() => fetchDocuments()} isLoading={loading}>Refresh</Button>
                        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => { setIsCategoryDrawerOpen(true); setIsEditingCategory(false); setNewCategoryName(''); }}>Manage categories</Button>
                    </HStack>
                </Flex>

                <Flex mb="6" gap="2" bg={panelBg} p="2" borderRadius="xl" borderWidth="1px" borderColor={borderColor} width="fit-content">
                    <Button as={RouterLink} to="/documentlist" size="sm" colorScheme="teal" variant={location.pathname === '/documentlist' ? 'solid' : 'ghost'} leftIcon={<Icon as={FiBriefcase} />}>Company Documents</Button>
                    <Button as={RouterLink} to="/EmployeeDocument" size="sm" colorScheme="teal" variant="ghost" leftIcon={<Icon as={FiUsers} />}>Employee Documents</Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing="4" mb="6">
                    {[
                        { label: 'Total documents', value: documents.length, help: 'Company records available', icon: FiFileText },
                        { label: 'Categories', value: categories.length, help: 'Organized document groups', icon: FiFolder },
                        { label: 'Company assigned', value: assignedDocuments, help: 'Records with brand identity', icon: FiBriefcase },
                        { label: 'Added recently', value: recentDocuments, help: 'Uploaded in the last 30 days', icon: FiCalendar },
                    ].map((item) => (
                        <Flex key={item.label} bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p="5" align="center" gap="4" boxShadow="sm">
                            <Flex boxSize="48px" borderRadius="xl" align="center" justify="center" bg="teal.50" color="teal.600"><Icon as={item.icon} boxSize="6" /></Flex>
                            <Stat><StatLabel color={muted}>{item.label}</StatLabel><StatNumber fontSize="2xl">{item.value}</StatNumber><StatHelpText mb="0" color={muted}>{item.help}</StatHelpText></Stat>
                        </Flex>
                    ))}
                </SimpleGrid>

                <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={{ base: 4, md: 6 }} mb="6" boxShadow="sm">
                    <HStack mb="4" spacing="3"><Flex boxSize="40px" borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center"><Icon as={FiFile} /></Flex><Box><Heading size="md">Upload a company document</Heading><Text color={muted} fontSize="sm">Add a title, classification, company, and source file.</Text></Box></HStack>
                    <DocumentUploadForm categoryOptions={categories} fetchDocuments={() => fetchDocuments({ silent: true })} />
                </Box>

                <Flex align="start" gap="5" direction={{ base: 'column', lg: 'row' }}>
                    <Box position={{ lg: 'sticky' }} top={{ lg: '18px' }} width={{ base: '100%', lg: '270px' }} flexShrink="0" bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p="4" maxH={{ lg: 'calc(100vh - 36px)' }} overflowY="auto">
                        <Flex justify="space-between" align="center" mb="3"><Box><Heading size="md">Categories</Heading><Text color={muted} fontSize="sm">Browse the library</Text></Box><IconButton aria-label="Add category" icon={<AddIcon />} size="sm" colorScheme="teal" onClick={() => setIsCategoryDrawerOpen(true)} /></Flex>
                        <InputGroup size="sm" mb="3"><InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement><Input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Find category" /></InputGroup>
                        <VStack align="stretch" spacing="1">
                            <Button size="sm" justifyContent="space-between" variant={!selectedCategory ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setSelectedCategory('')}><Text>All categories</Text><Badge>{documents.length}</Badge></Button>
                            {visibleCategories.map((category) => (
                                <Button key={category._id} size="sm" justifyContent="space-between" variant={selectedCategory === category._id ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setSelectedCategory(category._id)} whiteSpace="normal" h="auto" minH="36px" py="2" textAlign="left">
                                    <Text noOfLines={2}>{category.name}</Text><Badge ml="2">{documents.filter((doc) => doc.category?._id === category._id).length}</Badge>
                                </Button>
                            ))}
                            {!visibleCategories.length && <Text color={muted} fontSize="sm" textAlign="center" py="6">No matching categories.</Text>}
                        </VStack>
                    </Box>

                    <Box flex="1" minW="0">
                        <Box position="sticky" top="0" zIndex="10" bg={pageBg} pb="4">
                            <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p="4" boxShadow="sm">
                                <Flex gap="3" direction={{ base: 'column', xl: 'row' }} align={{ xl: 'center' }}>
                                    <InputGroup flex="1"><InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, category, or company" /></InputGroup>
                                    <HStack spacing="2" flexWrap="wrap">
                                        <Select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)} maxW="220px"><option value="">All companies</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
                                        <Select value={selectedFileType} onChange={(event) => setSelectedFileType(event.target.value)} maxW="160px"><option value="">All file types</option>{fileTypes.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
                                        <Select value={selectedDateRange} onChange={(event) => setSelectedDateRange(event.target.value)} maxW="175px"><option value="">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="365">Last year</option></Select>
                                    </HStack>
                                </Flex>
                                <Flex justify="space-between" align="center" mt="3" gap="3" flexWrap="wrap">
                                    <HStack color={muted} fontSize="sm"><Icon as={FiFilter} /><Text>{filteredDocuments.length} result{filteredDocuments.length === 1 ? '' : 's'}</Text>{activeFilterCount > 0 && <Badge colorScheme="teal">{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</Badge>}</HStack>
                                    <HStack><Button size="sm" variant="ghost" leftIcon={<Icon as={FiX} />} onClick={clearFilters} isDisabled={!searchQuery && !activeFilterCount}>Clear</Button><ButtonGroup size="sm" isAttached variant="outline"><IconButton aria-label="Grid view" icon={<Icon as={FiGrid} />} colorScheme={viewMode === 'grid' ? 'teal' : 'gray'} variant={viewMode === 'grid' ? 'solid' : 'outline'} onClick={() => setViewMode('grid')} /><IconButton aria-label="List view" icon={<Icon as={FiList} />} colorScheme={viewMode === 'list' ? 'teal' : 'gray'} variant={viewMode === 'list' ? 'solid' : 'outline'} onClick={() => setViewMode('list')} /></ButtonGroup></HStack>
                                </Flex>
                            </Box>
                        </Box>

                        {error && <Alert status="error" borderRadius="xl" mb="4"><AlertIcon /><Box flex="1"><AlertTitle>Company documents could not be loaded</AlertTitle><AlertDescription>{error}</AlertDescription></Box><Button size="sm" onClick={() => fetchDocuments()}>Try again</Button></Alert>}

                        {loading ? (
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} height="340px" borderRadius="xl" />)}</SimpleGrid>
                        ) : !error && paginatedDocuments.length === 0 ? (
                            <Flex bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" minH="330px" align="center" justify="center" direction="column" textAlign="center" p="8"><Flex boxSize="64px" borderRadius="2xl" bg="teal.50" color="teal.600" align="center" justify="center" mb="4"><Icon as={FiFolder} boxSize="8" /></Flex><Heading size="md">No company documents found</Heading><Text color={muted} mt="2" maxW="430px">Adjust the filters or upload a document to begin organizing this section.</Text><Button mt="5" variant="outline" colorScheme="teal" onClick={clearFilters}>Reset filters</Button></Flex>
                        ) : !error && viewMode === 'grid' ? (
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="5">
                                {paginatedDocuments.map((doc) => {
                                    const brand = getDocumentBrand(doc);
                                    const licenseStatus = isLicenseDocument(doc) ? getLicenseStatus(doc) : null;
                                    return <Box key={doc._id} bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflow="hidden" boxShadow="sm" transition="all .2s ease" _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg', borderColor: 'teal.300' }} display="flex" flexDirection="column" minH="350px" cursor="pointer" onClick={() => isLicenseDocument(doc) ? openLicenseSchedule(doc) : setPreviewDocument(doc)}>
                                        <Flex h="112px" px="5" py="4" bg={softBg} align="center" justify="center" borderBottomWidth="1px" borderColor={borderColor}><CompanyLogo document={doc} /></Flex>
                                        <Box p="5" display="flex" flexDirection="column" flex="1">
                                            <HStack justify="space-between" align="start" mb="3"><Badge colorScheme={brand ? 'teal' : 'gray'}>{brand?.name || 'Unassigned'}</Badge><Badge variant="outline">{getFileType(doc)}</Badge></HStack>
                                            <Heading size="sm" lineHeight="1.45" noOfLines={2}>{doc.title}</Heading>
                                            <VStack align="stretch" spacing="2" mt="4" color={muted} fontSize="sm"><HStack><Icon as={FiFolder} /><Text noOfLines={1}>{doc.category?.name || 'Not categorized'}</Text></HStack><HStack><Icon as={FiCalendar} /><Text>{formatDate(doc.createdAt)}</Text></HStack>{licenseStatus && <Flex bg={`${licenseStatus.color}.50`} borderWidth="1px" borderColor={`${licenseStatus.color}.200`} borderRadius="lg" p="2.5" justify="space-between" align="center"><HStack color={`${licenseStatus.color}.700`}><Icon as={FiClock} /><Box><Text fontSize="xs" fontWeight="800">{licenseStatus.label}</Text><Text fontSize="xs">{licenseStatus.detail}</Text></Box></HStack>{doc.licenseSchedule?.renewalDate && <Text fontSize="xs" fontWeight="700">{formatDate(doc.licenseSchedule.renewalDate)}</Text>}</Flex>}</VStack>
                                            <Flex justify="space-between" align="center" mt="auto" pt="5"><Button size="sm" colorScheme="teal" leftIcon={<Icon as={isLicenseDocument(doc) ? FiClock : FiFileText} />} onClick={(event) => { event.stopPropagation(); isLicenseDocument(doc) ? openLicenseSchedule(doc) : setPreviewDocument(doc); }}>{isLicenseDocument(doc) ? (doc.licenseSchedule?.renewalDate ? 'Update schedule' : 'Set schedule') : 'Preview'}</Button><HStack><IconButton aria-label={`Edit ${doc.title}`} icon={<EditIcon />} size="sm" variant="outline" colorScheme="teal" onClick={(event) => { event.stopPropagation(); handleEditClick(doc); }} /><IconButton aria-label={`Delete ${doc.title}`} icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={(event) => { event.stopPropagation(); setDeleteDocument(doc); }} /></HStack></Flex>
                                        </Box>
                                    </Box>;
                                })}
                            </SimpleGrid>
                        ) : !error ? (
                            <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflowX="auto">
                                <Table variant="simple">
                                    <Thead bg={softBg}><Tr><Th>Document</Th><Th>Category</Th><Th>Company</Th><Th>Type</Th><Th>Renewal</Th><Th>Added</Th><Th textAlign="right">Actions</Th></Tr></Thead>
                                    <Tbody>{paginatedDocuments.map((doc) => {
                                        const brand = getDocumentBrand(doc);
                                        const licenseStatus = isLicenseDocument(doc) ? getLicenseStatus(doc) : null;
                                        return <Tr key={doc._id}>
                                            <Td><HStack minW="230px"><Flex w="90px" justify="center"><CompanyLogo document={doc} compact /></Flex><Box><Text fontWeight="700" noOfLines={2}>{doc.title}</Text><Text color={muted} fontSize="xs">Company document</Text></Box></HStack></Td>
                                            <Td>{doc.category?.name || 'Not categorized'}</Td>
                                            <Td><Badge colorScheme={brand ? 'teal' : 'gray'}>{brand?.name || doc.department || 'Unassigned'}</Badge></Td>
                                            <Td>{getFileType(doc)}</Td>
                                            <Td>{licenseStatus ? <Button size="xs" variant="outline" colorScheme={licenseStatus.color} leftIcon={<Icon as={FiClock} />} onClick={() => openLicenseSchedule(doc)}>{licenseStatus.detail}</Button> : <Text color={muted}>—</Text>}</Td>
                                            <Td whiteSpace="nowrap">{formatDate(doc.createdAt)}</Td>
                                            <Td><HStack justify="flex-end"><IconButton aria-label="Preview" icon={<Icon as={FiFileText} />} size="sm" colorScheme="teal" onClick={() => setPreviewDocument(doc)} /><IconButton aria-label="Edit" icon={<EditIcon />} size="sm" variant="outline" onClick={() => handleEditClick(doc)} /><IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => setDeleteDocument(doc)} /></HStack></Td>
                                        </Tr>;
                                    })}</Tbody>
                                </Table>
                            </Box>
                        ) : null}

                        {!loading && !error && filteredDocuments.length > 0 && <Flex justify="space-between" align="center" mt="5" bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" px="4" py="3" gap="3"><Text color={muted} fontSize="sm">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length}</Text><HStack><IconButton aria-label="Previous page" icon={<Icon as={FiChevronLeft} />} size="sm" variant="outline" isDisabled={page === 1} onClick={() => setPage((value) => value - 1)} /><Text fontSize="sm" fontWeight="700">Page {page} of {totalPages}</Text><IconButton aria-label="Next page" icon={<Icon as={FiChevronRight} />} size="sm" variant="outline" isDisabled={page === totalPages} onClick={() => setPage((value) => value + 1)} /></HStack></Flex>}
                    </Box>
                </Flex>
            </Box>

            <Drawer isOpen={Boolean(previewDocument)} placement="right" size="xl" onClose={() => setPreviewDocument(null)}>
                <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px"><Text color="teal.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Document preview</Text><Heading size="md" mt="1" pr="8">{previewDocument?.title}</Heading></DrawerHeader><DrawerBody py="6">{previewDocument && <Stack spacing="5"><Flex bg={softBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" minH="120px" align="center" justify="center" p="5"><CompanyLogo document={previewDocument} /></Flex><SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">{[['Company', getDocumentBrand(previewDocument)?.name || previewDocument.department || 'Unassigned'], ['Category', previewDocument.category?.name || 'Not categorized'], ['File type', getFileType(previewDocument)], ['Uploaded', formatDate(previewDocument.createdAt)]].map(([label, value]) => <Box key={label} bg={softBg} borderRadius="lg" p="4"><Text color={muted} fontSize="xs" fontWeight="700" textTransform="uppercase">{label}</Text><Text fontWeight="700" mt="1">{value}</Text></Box>)}</SimpleGrid><Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" h="430px" bg="gray.100"><Box as="iframe" title={previewDocument.title} src={previewDocument.fileUrl} width="100%" height="100%" border="0" /></Box><Text color={muted} fontSize="sm">If this file cannot be displayed by your browser, use “Open document” below.</Text></Stack>}</DrawerBody><DrawerFooter borderTopWidth="1px"><Button variant="outline" mr="3" onClick={() => setPreviewDocument(null)}>Close</Button><Button as="a" href={previewDocument?.fileUrl} target="_blank" rel="noopener noreferrer" colorScheme="teal" leftIcon={<Icon as={FiExternalLink} />}>Open document</Button></DrawerFooter></DrawerContent>
            </Drawer>

            <Drawer isOpen={isCategoryDrawerOpen} placement="right" onClose={() => setIsCategoryDrawerOpen(false)} size="md"><DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px"><Heading size="md">Manage categories</Heading><Text color={muted} fontSize="sm" fontWeight="400" mt="1">Maintain a consistent classification system for HR documents.</Text></DrawerHeader><DrawerBody py="5"><FormControl><FormLabel>{isEditingCategory ? 'Update category name' : 'New category name'}</FormLabel><HStack><Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Enter a clear category name" /><Button colorScheme="teal" onClick={saveCategory} isLoading={isSavingCategory} isDisabled={!newCategoryName.trim()}>{isEditingCategory ? 'Save' : 'Add'}</Button>{isEditingCategory && <IconButton aria-label="Cancel editing" icon={<Icon as={FiX} />} onClick={() => { setIsEditingCategory(false); setNewCategoryName(''); }} />}</HStack></FormControl><Divider my="5" /><VStack align="stretch" spacing="2">{sortedCategories.map((category) => <Flex key={category._id} align="center" justify="space-between" borderWidth="1px" borderColor={borderColor} borderRadius="lg" p="3"><Box><Text fontWeight="700">{category.name}</Text><Text color={muted} fontSize="xs">{documents.filter((doc) => doc.category?._id === category._id).length} document(s)</Text></Box><HStack><IconButton aria-label={`Edit ${category.name}`} icon={<EditIcon />} size="sm" variant="outline" onClick={() => openEditCategory(category)} /><IconButton aria-label={`Delete ${category.name}`} icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => deleteCategory(category)} /></HStack></Flex>)}</VStack></DrawerBody><DrawerFooter borderTopWidth="1px"><Button variant="outline" onClick={() => setIsCategoryDrawerOpen(false)}>Done</Button></DrawerFooter></DrawerContent></Drawer>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} isCentered><ModalOverlay /><ModalContent><ModalHeader>Edit document details</ModalHeader><ModalCloseButton /><ModalBody><VStack spacing="4"><FormControl isRequired><FormLabel>Title</FormLabel><Input value={title} onChange={(event) => setTitle(event.target.value)} /></FormControl><FormControl isRequired><FormLabel>Category</FormLabel><Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{sortedCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</Select></FormControl><FormControl isRequired><FormLabel>Company</FormLabel><Select value={department} onChange={(event) => setDepartment(event.target.value)}>{COMPANY_BRANDS.map((brand) => <option key={brand.name} value={brand.name}>{brand.name}</option>)}</Select></FormControl></VStack></ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button colorScheme="teal" onClick={handleEditSave} isDisabled={!title.trim() || !categoryId || !department}>Save changes</Button></ModalFooter></ModalContent></Modal>

            <Modal isOpen={Boolean(licenseDocument)} onClose={() => !isSavingLicense && setLicenseDocument(null)} isCentered size="lg">
                <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader borderBottomWidth="1px"><Text color="teal.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">License renewal schedule</Text><Heading size="md" mt="1" pr="8">{licenseDocument?.title}</Heading><Text color={muted} fontSize="sm" fontWeight="400" mt="1">Set when this license must be updated and how early HR should begin follow-up.</Text></ModalHeader>
                    <ModalCloseButton isDisabled={isSavingLicense} />
                    <ModalBody py="6"><Stack spacing="5">
                        {licenseDocument?.licenseSchedule?.renewalDate && <Alert status={getLicenseStatus(licenseDocument).color === 'green' ? 'success' : getLicenseStatus(licenseDocument).color === 'orange' ? 'warning' : 'error'} borderRadius="xl"><AlertIcon /><Box><AlertTitle>{getLicenseStatus(licenseDocument).label}</AlertTitle><AlertDescription>{getLicenseStatus(licenseDocument).detail}; scheduled for {formatDate(licenseDocument.licenseSchedule.renewalDate)}.</AlertDescription></Box></Alert>}
                        <FormControl isRequired><FormLabel>Next license update date</FormLabel><Input type="date" value={licenseRenewalDate} onChange={(event) => setLicenseRenewalDate(event.target.value)} /><Text color={muted} fontSize="sm" mt="2">The date by which HR must renew or replace this license document.</Text></FormControl>
                        <FormControl isRequired><FormLabel>Reminder interval</FormLabel><Input type="number" min="0" max="365" step="1" value={licenseReminderDays} onChange={(event) => setLicenseReminderDays(event.target.value)} /><Text color={muted} fontSize="sm" mt="2">The future notification phase will alert HR this many days before the update date.</Text><HStack mt="3" spacing="2" flexWrap="wrap">{[7, 14, 30, 60, 90].map((days) => <Button key={days} size="xs" variant={licenseReminderDays === String(days) ? 'solid' : 'outline'} colorScheme="teal" onClick={() => setLicenseReminderDays(String(days))}>{days} days</Button>)}</HStack></FormControl>
                        {licenseRenewalDate && <Flex bg="teal.50" borderWidth="1px" borderColor="teal.200" borderRadius="xl" p="4" gap="3" align="start"><Icon as={FiClock} color="teal.600" mt="1" /><Box><Text fontWeight="800" color="teal.800">Schedule summary</Text><Text color="teal.700" fontSize="sm">Update date: {formatDate(licenseRenewalDate)}. HR reminder window begins {licenseReminderDays || 0} day(s) before this date.</Text></Box></Flex>}
                    </Stack></ModalBody>
                    <ModalFooter borderTopWidth="1px"><Button variant="ghost" mr="3" onClick={() => setLicenseDocument(null)} isDisabled={isSavingLicense}>Cancel</Button><Button colorScheme="teal" leftIcon={<Icon as={FiCalendar} />} onClick={saveLicenseSchedule} isLoading={isSavingLicense} loadingText="Saving">Save schedule</Button></ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={Boolean(deleteDocument)} onClose={() => !isDeleting && setDeleteDocument(null)} isCentered><ModalOverlay /><ModalContent><ModalHeader>Delete company document?</ModalHeader><ModalCloseButton isDisabled={isDeleting} /><ModalBody><Alert status="error" variant="subtle" borderRadius="lg"><AlertIcon /><Box><AlertTitle>This action cannot be undone.</AlertTitle><AlertDescription>“{deleteDocument?.title}” and its stored file will be permanently removed.</AlertDescription></Box></Alert></ModalBody><ModalFooter><Button variant="ghost" mr="3" onClick={() => setDeleteDocument(null)} isDisabled={isDeleting}>Cancel</Button><Button colorScheme="red" onClick={confirmDeleteDocument} isLoading={isDeleting}>Delete document</Button></ModalFooter></ModalContent></Modal>
        </Box>
    );
};

export default DocumentList;
