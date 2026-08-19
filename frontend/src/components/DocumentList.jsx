import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Badge,
    Box,
    Button,
    ButtonGroup,
    Collapse,
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
    InputRightElement,
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
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
    FiAlertCircle,
    FiAlertTriangle,
    FiAward,
    FiBell,
    FiBook,
    FiBookmark,
    FiBriefcase,
    FiCalendar,
    FiCheck,
    FiCheckCircle,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiChevronUp,
    FiClock,
    FiCompass,
    FiCreditCard,
    FiDollarSign,
    FiDownload,
    FiExternalLink,
    FiEye,
    FiFile,
    FiFileText,
    FiFilter,
    FiFolder,
    FiGrid,
    FiLayers,
    FiList,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiSettings,
    FiShield,
    FiUploadCloud,
    FiUsers,
    FiX,
} from 'react-icons/fi';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import DocumentUploadForm from './DocumentUploadForm';

const PAGE_SIZE = 15;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, index) => CURRENT_YEAR + 5 - index);

const ETHIOPIAN_MONTHS = [
    'Meskerem (መስከረም)', 'Tikimt (ጥቅምት)', 'Hidar (ኅዳር)', 'Tahsas (ታኅሣሥ)',
    'Tir (ጥር)', 'Yekatit (የካቲት)', 'Megabit (መጋቢት)', 'Miazia (ሚያዝያ)',
    'Ginbot (ግንቦት)', 'Sene (ሰኔ)', 'Hamle (ሐምሌ)', 'Nehase (ነሐሴ)', 'Pagumen (ጳጉሜን)',
];
const ETHIOPIAN_YEARS = Array.from({ length: 101 }, (_, index) => 2050 - index);
const EMPTY_ETHIOPIAN_DATE = { year: '', month: '', day: '' };

const ETHIOPIAN_EPOCH_JDN = 1723856;
const isEthiopianLeapYear = (year) => Number(year) % 4 === 3;
const getEthiopianMonthDays = (year, month) => {
    const y = Number(year);
    const m = Number(month);
    if (m >= 1 && m <= 12) return 30;
    if (m === 13) return isEthiopianLeapYear(y) ? 6 : 5;
    return 0;
};

const isCompleteEthiopianDate = (value) => {
    const y = Number(value?.year);
    const m = Number(value?.month);
    const d = Number(value?.day);
    if (!Number.isInteger(y) || y < 1 || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    return d >= 1 && d <= getEthiopianMonthDays(y, m);
};

const ethiopianToJdn = (year, month, day) => (
    ETHIOPIAN_EPOCH_JDN + (365 * year) + Math.floor(year / 4) + (30 * month) + day - 31
);

const jdnToGregorianParts = (jdn) => {
    let l = jdn + 68569;
    const n = Math.floor((4 * l) / 146097);
    l -= Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l + 1)) / 1461001);
    l = l - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l) / 2447);
    const day = l - Math.floor((2447 * j) / 80);
    l = Math.floor(j / 11);
    const month = j + 2 - (12 * l);
    const year = 100 * (n - 49) + i + l;
    return { year, month, day };
};

const ethiopianToGregorian = (value) => {
    if (!isCompleteEthiopianDate(value)) return null;
    const parts = jdnToGregorianParts(ethiopianToJdn(Number(value.year), Number(value.month), Number(value.day)));
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

const ethiopianDateOrder = (value) => (Number(value.year) * 400) + (Number(value.month) * 30) + Number(value.day);
const formatEthiopianDate = (value) => isCompleteEthiopianDate(value) ? `${ETHIOPIAN_MONTHS[Number(value.month) - 1].split(' (')[0]} ${value.day}, ${value.year} EC` : 'Not set';

// The 5 Big Departments / Company Brands (Light Green & White Styling)
const BIG_FIVE_DEPARTMENTS = [
    {
        name: 'Tradethiopia B2B',
        shortName: 'Trade B2B',
        logo: '/company-logos/tradethiopia-b2b.png',
        tagline: 'Marketplace & B2B Trade',
        aliases: ['tradethiopia b2b', 'trade ethiopia b2b', 'tradethiopia marketplace', 'tradeethiopia marketplace', 'b2b', 'tradethiopia']
    },
    {
        name: 'TESBINN',
        shortName: 'TESBINN',
        logo: '/company-logos/tesbinn.png',
        tagline: 'Business & Innovation',
        aliases: ['tesbinn', 'tesbin', 'trade ethiopia school of business and innovation', 'tesbinn2025']
    },
    {
        name: 'Ethio-International Expo',
        shortName: 'Expo & Events',
        logo: '/company-logos/ethio-international-expo.jpg',
        tagline: 'International Exhibitions',
        aliases: ['ethio international expo', 'ethio-international expo', 'ethio international', 'eie', 'expo', 'ethio expo']
    },
    {
        name: 'TETV',
        shortName: 'TETV Media',
        logo: '/company-logos/tetv.png',
        tagline: 'Broadcast & Media',
        aliases: ['tetv', 'tradex tv', 'trade x tv', 'trade-x tv', 'tetv2025', 'tradex']
    },
    {
        name: 'ENISRA',
        shortName: 'ENISRA',
        logo: '/company-logos/enisra.png',
        tagline: 'Enterprise Digital Services',
        aliases: ['enisra', 'enisra.com', 'enesra', 'enisra2025']
    },
];

// Unified Elegant Light Green & White Theme
const LIGHT_GREEN_THEME = {
    bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bgLight: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    shadow: 'rgba(16, 185, 129, 0.35)',
    accent: '#059669'
};

const normalize = (value = '') => String(value || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const getDocumentBrand = (document) => {
    const candidates = [
        document?.department,
        document?.company,
        document?.organization,
        document?.businessUnit,
        document?.title
    ].map(normalize).filter(Boolean);

    return BIG_FIVE_DEPARTMENTS.find((brand) => {
        const aliases = [brand.name, brand.shortName, ...brand.aliases].map(normalize);
        return candidates.some((candidate) =>
            aliases.some((alias) =>
                candidate === alias || candidate.includes(alias) || (alias.length >= 4 && alias.includes(candidate))
            )
        );
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

const getDocumentYear = (document) => {
    if (document?.documentYear) return String(document.documentYear);
    if (document?.documentDate) {
        const d = new Date(document.documentDate);
        if (!Number.isNaN(d.getFullYear())) return String(d.getFullYear());
    }
    if (document?.createdAt) {
        const d = new Date(document.createdAt);
        if (!Number.isNaN(d.getFullYear())) return String(d.getFullYear());
    }
    return String(CURRENT_YEAR);
};

const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : new window.Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    }).format(date);
};

const getDocumentScheduleStatus = (document) => {
    const renewalValue = document?.licenseSchedule?.endDate || document?.licenseSchedule?.renewalDate;
    if (!renewalValue) return { label: 'Set Schedule', detail: 'No reminder set', color: 'gray', days: null, isScheduled: false };

    const renewalDate = new Date(renewalValue);
    const today = new Date();
    renewalDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((renewalDate.getTime() - today.getTime()) / 86400000);
    const reminderDays = Number(document.licenseSchedule?.reminderDaysBefore ?? 30);

    if (days < 0) {
        return {
            label: 'Renewal Overdue',
            detail: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`,
            color: 'red',
            days,
            isScheduled: true,
            isOverdue: true,
            isUrgent: true
        };
    }
    if (days === 0) {
        return {
            label: 'Due Today',
            detail: 'Renewal due today',
            color: 'red',
            days,
            isScheduled: true,
            isDueToday: true,
            isUrgent: true
        };
    }
    if (days <= reminderDays) {
        return {
            label: 'Renewal Approaching',
            detail: `${days} day${days === 1 ? '' : 's'} remaining`,
            color: 'orange',
            days,
            isScheduled: true,
            isApproaching: true,
            isUrgent: true
        };
    }
    return {
        label: 'Schedule Active',
        detail: `${days} days remaining`,
        color: 'green',
        days,
        isScheduled: true,
        isCurrent: true,
        isUrgent: false
    };
};

const CompanyLogo = ({ document, compact = false }) => {
    const brand = getDocumentBrand(document);
    return brand ? (
        <Image
            src={brand.logo}
            alt={`${brand.name} logo`}
            maxH={compact ? '42px' : '52px'}
            maxW={compact ? '85px' : '90%'}
            objectFit="contain"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
        />
    ) : (
        <Flex boxSize={compact ? '36px' : '44px'} borderRadius="xl" align="center" justify="center" bg="teal.50" color="teal.700" boxShadow="xs">
            <Icon as={FiFileText} boxSize={compact ? '5' : '6'} />
        </Flex>
    );
};

const EthiopianDateField = ({ label, value, onChange, description }) => {
    const maxDays = getEthiopianMonthDays(value.year, value.month);
    const updatePart = (part, nextValue) => {
        const next = { ...value, [part]: nextValue };
        const nextMaxDays = getEthiopianMonthDays(next.year, next.month);
        if (next.day && nextMaxDays && Number(next.day) > nextMaxDays) next.day = '';
        onChange(next);
    };

    return (
        <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">{label}</FormLabel>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing="2">
                <Select
                    size="sm"
                    borderRadius="lg"
                    aria-label={`${label} year`}
                    placeholder="Year (EC)"
                    value={value.year}
                    onChange={(e) => updatePart('year', e.target.value)}
                >
                    {ETHIOPIAN_YEARS.map((year) => <option key={year} value={year}>{year} EC</option>)}
                </Select>
                <Select
                    size="sm"
                    borderRadius="lg"
                    aria-label={`${label} month`}
                    placeholder="Month"
                    value={value.month}
                    onChange={(e) => updatePart('month', e.target.value)}
                >
                    {ETHIOPIAN_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                </Select>
                <Select
                    size="sm"
                    borderRadius="lg"
                    aria-label={`${label} day`}
                    placeholder="Day"
                    value={value.day}
                    isDisabled={!maxDays}
                    onChange={(e) => updatePart('day', e.target.value)}
                >
                    {Array.from({ length: maxDays }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                </Select>
            </SimpleGrid>
            <Text color="gray.500" fontSize="2xs" mt="1">{description}</Text>
        </FormControl>
    );
};

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [onlyUrgentSchedules, setOnlyUrgentSchedules] = useState(false);
    const [isAlertBannerOpen, setIsAlertBannerOpen] = useState(true);
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
    const [editDocYear, setEditDocYear] = useState(String(CURRENT_YEAR));
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [scheduleDocument, setScheduleDocument] = useState(null);
    const [scheduleStartDate, setScheduleStartDate] = useState(EMPTY_ETHIOPIAN_DATE);
    const [scheduleEndDate, setScheduleEndDate] = useState(EMPTY_ETHIOPIAN_DATE);
    const [scheduleReminderDays, setScheduleReminderDays] = useState('30');
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const toast = useToast();
    const location = useLocation();
    const categoryRibbonRef = useRef(null);

    const panelBg = useColorModeValue('white', 'gray.800');
    const pageBg = useColorModeValue('#F8FAFC', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const muted = useColorModeValue('gray.600', 'gray.400');
    const softBg = useColorModeValue('gray.50', 'gray.750');

    const scrollCategoryRibbon = (direction) => {
        if (categoryRibbonRef.current) {
            categoryRibbonRef.current.scrollBy({
                left: direction === 'left' ? -280 : 280,
                behavior: 'smooth'
            });
        }
    };

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

    const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
    const fileTypes = useMemo(() => [...new Set(documents.map(getFileType))].sort(), [documents]);

    const availableDocumentYears = useMemo(() => {
        const set = new Set();
        documents.forEach((doc) => {
            const yr = getDocumentYear(doc);
            if (yr && yr !== 'Year unavailable') set.add(yr);
        });
        YEAR_OPTIONS.slice(0, 10).forEach((yr) => set.add(String(yr)));
        return Array.from(set).sort((a, b) => Number(b) - Number(a));
    }, [documents]);

    const visibleRibbonCategories = useMemo(() => {
        if (!categoryFilterSearch.trim()) return sortedCategories;
        const q = normalize(categoryFilterSearch);
        return sortedCategories.filter((c) => normalize(c.name).includes(q));
    }, [sortedCategories, categoryFilterSearch]);

    const urgentSchedules = useMemo(() => {
        return documents
            .map((doc) => ({
                doc,
                status: getDocumentScheduleStatus(doc),
                brand: getDocumentBrand(doc)
            }))
            .filter((item) => item.status.isUrgent);
    }, [documents]);

    // FLAWLESS FILTER ENGINE
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            if (onlyUrgentSchedules) {
                const status = getDocumentScheduleStatus(doc);
                if (!status.isUrgent) return false;
            }

            if (searchQuery.trim()) {
                const query = normalize(searchQuery);
                const titleNorm = normalize(doc.title);
                const catNorm = normalize(doc.category?.name);
                const deptNorm = normalize(doc.department);
                const compNorm = normalize(doc.company);
                const brand = getDocumentBrand(doc);
                const brandNorm = normalize(brand?.name);

                const matchesSearch =
                    titleNorm.includes(query) ||
                    catNorm.includes(query) ||
                    deptNorm.includes(query) ||
                    compNorm.includes(query) ||
                    brandNorm.includes(query);

                if (!matchesSearch) return false;
            }

            if (selectedCategory) {
                const targetCat = categories.find((c) => c._id === selectedCategory || c.name === selectedCategory);
                const targetId = targetCat?._id || selectedCategory;
                const targetName = normalize(targetCat?.name || selectedCategory);

                const docCatId = doc.category?._id || (typeof doc.category === 'string' ? doc.category : '');
                const docCatName = normalize(doc.category?.name || (typeof doc.category === 'string' ? doc.category : ''));

                const matchesCategory =
                    docCatId === targetId ||
                    docCatName === targetName ||
                    (targetName && docCatName.includes(targetName));

                if (!matchesCategory) return false;
            }

            if (selectedDepartment) {
                const brand = getDocumentBrand(doc);
                const target = normalize(selectedDepartment);
                const docDept = normalize(doc.department);
                const docComp = normalize(doc.company);
                const brandName = normalize(brand?.name);
                const brandShort = normalize(brand?.shortName);
                const brandAliases = brand?.aliases?.map(normalize) || [];

                const matchesDepartment =
                    docDept === target ||
                    docComp === target ||
                    brandName === target ||
                    brandShort === target ||
                    brandAliases.includes(target) ||
                    (docDept && docDept.includes(target)) ||
                    (docComp && docComp.includes(target)) ||
                    (doc.title && normalize(doc.title).includes(target));

                if (!matchesDepartment) return false;
            }

            if (selectedFileType) {
                if (getFileType(doc) !== selectedFileType) return false;
            }

            if (selectedYear) {
                const docYear = getDocumentYear(doc);
                if (docYear !== String(selectedYear)) return false;
            }

            return true;
        });
    }, [documents, searchQuery, selectedCategory, selectedDepartment, selectedFileType, selectedYear, onlyUrgentSchedules, categories]);

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
    const paginatedDocuments = filteredDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const activeFilterCount = [selectedCategory, selectedDepartment, selectedFileType, selectedYear, onlyUrgentSchedules ? 'urgent' : ''].filter(Boolean).length;

    useEffect(() => setPage(1), [searchQuery, selectedCategory, selectedDepartment, selectedFileType, selectedYear, onlyUrgentSchedules, viewMode]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedDepartment('');
        setSelectedFileType('');
        setSelectedYear('');
        setCategoryFilterSearch('');
        setOnlyUrgentSchedules(false);
    };

    const handleEditClick = (doc) => {
        setEditDocument(doc);
        setTitle(doc.title || '');
        setCategoryId(doc.category?._id || '');
        setDepartment(doc.department || '');
        const initialYear = getDocumentYear(doc);
        setEditDocYear(initialYear);
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            const yr = Number(editDocYear);
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${editDocument._id}`, {
                title: title.trim(),
                category: categoryId,
                department,
                documentYear: yr,
                documentDate: `${yr}-01-01`
            });
            await fetchDocuments({ silent: true });
            setIsEditOpen(false);
            toast({
                title: 'Document updated',
                description: `Document details and year (${yr}) have been saved.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (requestError) {
            toast({
                title: 'Document could not be updated',
                description: requestError.response?.data?.error || requestError.message,
                status: 'error',
                duration: 4000,
                isClosable: true
            });
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
        if (!window.confirm(`Delete the "${category.name}" category? Documents using it may be affected.`)) return;
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

    const openScheduleModal = (document) => {
        setScheduleDocument(document);
        setScheduleStartDate(document.licenseSchedule?.startDateEthiopian
            ? { ...document.licenseSchedule.startDateEthiopian }
            : { ...EMPTY_ETHIOPIAN_DATE });
        setScheduleEndDate(document.licenseSchedule?.endDateEthiopian
            ? { ...document.licenseSchedule.endDateEthiopian }
            : { ...EMPTY_ETHIOPIAN_DATE });
        setScheduleReminderDays(String(document.licenseSchedule?.reminderDaysBefore ?? 30));
    };

    const scheduleIntervalCalculation = useMemo(() => {
        if (!isCompleteEthiopianDate(scheduleStartDate) || !isCompleteEthiopianDate(scheduleEndDate)) {
            return null;
        }

        const startGregorian = ethiopianToGregorian(scheduleStartDate);
        const endGregorian = ethiopianToGregorian(scheduleEndDate);

        if (!startGregorian || !endGregorian) return null;

        const totalDays = Math.ceil((endGregorian.getTime() - startGregorian.getTime()) / 86400000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((endGregorian.getTime() - today.getTime()) / 86400000);
        const reminderDays = Number(scheduleReminderDays) || 30;

        const isOverdue = daysRemaining < 0;
        const isApproaching = daysRemaining >= 0 && daysRemaining <= reminderDays;

        return {
            totalDays,
            daysRemaining,
            isOverdue,
            isApproaching,
            startFormatted: formatEthiopianDate(scheduleStartDate),
            endFormatted: formatEthiopianDate(scheduleEndDate),
            isValidRange: totalDays >= 0
        };
    }, [scheduleStartDate, scheduleEndDate, scheduleReminderDays]);

    const saveSchedule = async () => {
        const reminderDaysBefore = Number(scheduleReminderDays);
        if (!isCompleteEthiopianDate(scheduleStartDate) || !isCompleteEthiopianDate(scheduleEndDate) || ethiopianDateOrder(scheduleEndDate) < ethiopianDateOrder(scheduleStartDate) || !Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0 || reminderDaysBefore > 365) {
            toast({
                title: 'Check the Ethiopian calendar schedule dates',
                description: 'Please complete both Ethiopian dates, ensure the expiry/review date is after the start date, and set reminder interval (0-365 days).',
                status: 'warning',
                duration: 4500,
                isClosable: true
            });
            return;
        }

        setIsSavingSchedule(true);
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${scheduleDocument._id}`, {
                licenseSchedule: {
                    startDateEthiopian: scheduleStartDate,
                    endDateEthiopian: scheduleEndDate,
                    reminderDaysBefore
                },
            });
            setDocuments((current) => current.map((doc) => doc._id === response.data._id ? response.data : doc));
            if (previewDocument?._id === response.data._id) setPreviewDocument(response.data);
            setScheduleDocument(null);
            toast({
                title: 'License Renewal Schedule Active!',
                description: `HR will receive "Risk Document" hazard notifications ${reminderDaysBefore} days before ${formatEthiopianDate(scheduleEndDate)}.`,
                status: 'success',
                duration: 4500,
                isClosable: true
            });
        } catch (requestError) {
            toast({
                title: 'Schedule could not be saved',
                description: requestError.response?.data?.error || requestError.message,
                status: 'error',
                duration: 4500,
                isClosable: true
            });
        } finally {
            setIsSavingSchedule(false);
        }
    };

    return (
        <Box bg={pageBg} minH="100vh" px={{ base: 3, md: 5 }} py={{ base: 3, md: 5 }}>
            <Box maxW="1550px" mx="auto">
                {/* 1. TOP HEADER & QUICK SEARCH BAR */}
                <Flex
                    justify="space-between"
                    align={{ base: 'start', lg: 'center' }}
                    direction={{ base: 'column', lg: 'row' }}
                    gap="3"
                    mb="3"
                >
                    <Box>
                        <HStack spacing={2} mb={0.5}>
                            <Text color="teal.600" fontSize="xs" fontWeight="800" letterSpacing="wider" textTransform="uppercase">
                                HR Workspace
                            </Text>
                            <Text color="gray.400" fontSize="xs">/</Text>
                            <Text color="gray.600" fontSize="xs" fontWeight="semibold">
                                Documents
                            </Text>
                        </HStack>
                        <Heading size={{ base: 'md', md: 'lg' }} color="gray.800" fontWeight="extrabold">
                            Company Document Library
                        </Heading>
                    </Box>

                    {/* Quick Search & Actions */}
                    <HStack spacing="2.5" flexWrap="wrap" w={{ base: '100%', lg: 'auto' }}>
                        <InputGroup size="sm" maxW={{ base: '100%', md: '260px' }}>
                            <InputLeftElement pointerEvents="none">
                                <Icon as={FiSearch} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                bg={panelBg}
                                borderRadius="full"
                                placeholder="Search title, category, brand..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                borderColor={borderColor}
                                boxShadow="sm"
                                focusBorderColor="teal.500"
                            />
                        </InputGroup>

                        <Button
                            size="sm"
                            leftIcon={<FiUploadCloud />}
                            colorScheme="teal"
                            bg="#004D40"
                            _hover={{ bg: "#00796B" }}
                            borderRadius="full"
                            boxShadow="0 4px 12px rgba(0, 77, 64, 0.25)"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            Upload Document
                        </Button>

                        <Button
                            size="sm"
                            leftIcon={<AddIcon />}
                            variant="outline"
                            colorScheme="teal"
                            borderRadius="full"
                            onClick={() => { setIsCategoryDrawerOpen(true); setIsEditingCategory(false); setNewCategoryName(''); }}
                        >
                            Categories
                        </Button>

                        <IconButton
                            size="sm"
                            aria-label="Refresh"
                            icon={<Icon as={FiRefreshCw} />}
                            variant="ghost"
                            colorScheme="teal"
                            borderRadius="full"
                            onClick={() => fetchDocuments()}
                            isLoading={loading}
                        />
                    </HStack>
                </Flex>

                {/* 2. DEDICATED HR RENEWAL & REVIEW NOTIFICATION BANNER */}
                {urgentSchedules.length > 0 && (
                    <Box
                        bg={useColorModeValue('orange.50', 'orange.950')}
                        border="1px solid"
                        borderColor={useColorModeValue('orange.300', 'orange.700')}
                        borderRadius="xl"
                        p="3.5"
                        mb="4"
                        boxShadow="sm"
                    >
                        <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                            <HStack spacing={3}>
                                <Flex boxSize="32px" borderRadius="lg" bg="orange.500" color="white" align="center" justify="center">
                                    <Icon as={FiBell} boxSize={4} />
                                </Flex>
                                <Box>
                                    <HStack spacing={2}>
                                        <Heading size="xs" color="orange.900" fontWeight="bold">
                                            Document Renewal & Interval Alerts ({urgentSchedules.length})
                                        </Heading>
                                        <Badge colorScheme="red" fontSize="2xs" borderRadius="full" px={2}>
                                            ACTION REQUIRED
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="2xs" color="orange.800" mt={0.5}>
                                        The following company documents, licenses, or agreements require renewal/review based on their Ethiopian calendar schedule:
                                    </Text>
                                </Box>
                            </HStack>

                            <HStack spacing={2}>
                                <Button
                                    size="xs"
                                    colorScheme={onlyUrgentSchedules ? 'orange' : 'teal'}
                                    variant={onlyUrgentSchedules ? 'solid' : 'outline'}
                                    borderRadius="lg"
                                    onClick={() => setOnlyUrgentSchedules((prev) => !prev)}
                                >
                                    {onlyUrgentSchedules ? 'Show All Documents' : 'Filter Expiring Items'}
                                </Button>
                                <IconButton
                                    aria-label="Toggle alert banner"
                                    icon={<Icon as={isAlertBannerOpen ? FiChevronUp : FiChevronDown} />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => setIsAlertBannerOpen((prev) => !prev)}
                                />
                            </HStack>
                        </Flex>

                        <Collapse in={isAlertBannerOpen} animateOpacity>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="2.5" mt="3" pt="2" borderTop="1px dashed" borderColor="orange.200">
                                {urgentSchedules.map(({ doc, status, brand }) => (
                                    <Flex
                                        key={`alert-${doc._id}`}
                                        p="2.5"
                                        bg={panelBg}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={status.color === 'red' ? 'red.300' : 'orange.300'}
                                        justify="space-between"
                                        align="center"
                                        boxShadow="xs"
                                    >
                                        <HStack spacing={2} overflow="hidden">
                                            <Icon as={FiClock} color={`${status.color}.500`} boxSize={4} flexShrink={0} />
                                            <Box overflow="hidden">
                                                <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="gray.800">
                                                    {doc.title}
                                                </Text>
                                                <HStack spacing={1.5} fontSize="2xs" color="gray.500">
                                                    <Text fontWeight="semibold" color="teal.600">{brand?.shortName || doc.department}</Text>
                                                    <Text>·</Text>
                                                    <Text color={status.color === 'red' ? 'red.600' : 'orange.600'} fontWeight="bold">
                                                        {status.detail}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                        </HStack>

                                        <Button
                                            size="2xs"
                                            colorScheme="teal"
                                            variant="solid"
                                            borderRadius="md"
                                            onClick={() => openScheduleModal(doc)}
                                        >
                                            Update Interval
                                        </Button>
                                    </Flex>
                                ))}
                            </SimpleGrid>
                        </Collapse>
                    </Box>
                )}

                {/* WORKSPACE MODE PILL: Company vs Employee Documents */}
                <Flex mb="3.5" gap="2" bg={panelBg} p="1" borderRadius="full" borderWidth="1px" borderColor={borderColor} width="fit-content" boxShadow="sm">
                    <Button
                        as={RouterLink}
                        to="/documentlist"
                        size="xs"
                        borderRadius="full"
                        colorScheme="teal"
                        variant={location.pathname === '/documentlist' ? 'solid' : 'ghost'}
                        leftIcon={<Icon as={FiBriefcase} />}
                    >
                        Company Documents
                    </Button>
                    <Button
                        as={RouterLink}
                        to="/EmployeeDocument"
                        size="xs"
                        borderRadius="full"
                        colorScheme="teal"
                        variant="ghost"
                        leftIcon={<Icon as={FiUsers} />}
                    >
                        Employee Documents
                    </Button>
                </Flex>

                {/* 3. CATEGORIES SECTION: SEARCHABLE, FILTERABLE, JUMP-SELECT & SCROLLABLE */}
                <Box mb="4" bg={panelBg} p="3" borderRadius="2xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <Flex justify="space-between" align="center" mb="2.5" wrap="wrap" gap="2.5">
                        <HStack spacing={2}>
                            <Icon as={FiLayers} color="teal.600" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.700">
                                Categories ({categories.length})
                            </Heading>
                            {selectedCategory && (
                                <Badge colorScheme="teal" borderRadius="full" px={2} fontSize="2xs">
                                    1 ACTIVE
                                </Badge>
                            )}
                        </HStack>

                        <HStack spacing="2" wrap="wrap">
                            <InputGroup size="xs" maxW="200px">
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FiSearch} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Filter 37 categories..."
                                    borderRadius="lg"
                                    value={categoryFilterSearch}
                                    onChange={(e) => setCategoryFilterSearch(e.target.value)}
                                    focusBorderColor="teal.500"
                                />
                                {categoryFilterSearch && (
                                    <InputRightElement>
                                        <Icon as={FiX} color="gray.400" cursor="pointer" onClick={() => setCategoryFilterSearch('')} />
                                    </InputRightElement>
                                )}
                            </InputGroup>

                            <Select
                                size="xs"
                                borderRadius="lg"
                                placeholder="Jump to Category..."
                                maxW="190px"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                focusBorderColor="teal.500"
                            >
                                {sortedCategories.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} ({documents.filter((d) => d.category?._id === c._id).length})
                                    </option>
                                ))}
                            </Select>

                            <ButtonGroup size="xs" isAttached variant="outline">
                                <IconButton
                                    aria-label="Scroll left"
                                    icon={<Icon as={FiChevronLeft} />}
                                    onClick={() => scrollCategoryRibbon('left')}
                                />
                                <IconButton
                                    aria-label="Scroll right"
                                    icon={<Icon as={FiChevronRight} />}
                                    onClick={() => scrollCategoryRibbon('right')}
                                />
                            </ButtonGroup>

                            {selectedCategory && (
                                <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => setSelectedCategory('')}>
                                    Reset
                                </Button>
                            )}
                        </HStack>
                    </Flex>

                    {/* Category Ribbon */}
                    <Flex
                        ref={categoryRibbonRef}
                        gap="2"
                        overflowX="auto"
                        py="1"
                        px="0.5"
                        css={{
                            "&::-webkit-scrollbar": { height: "5px" },
                            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" }
                        }}
                    >
                        <Box
                          as="button"
                          onClick={() => setSelectedCategory('')}
                          p="2"
                          px="3"
                          borderRadius="xl"
                          bg={!selectedCategory ? 'teal.600' : softBg}
                          color={!selectedCategory ? 'white' : 'gray.700'}
                          borderWidth="1px"
                          borderColor={!selectedCategory ? 'teal.600' : borderColor}
                          boxShadow={!selectedCategory ? 'md' : 'none'}
                          display="flex"
                          alignItems="center"
                          gap="2"
                          flexShrink={0}
                          transition="all 0.2s"
                          _hover={{ transform: 'translateY(-1px)', bg: !selectedCategory ? 'teal.700' : 'teal.50' }}
                        >
                            <Flex
                                boxSize="22px"
                                borderRadius="lg"
                                bg={!selectedCategory ? 'whiteAlpha.300' : 'teal.100'}
                                color={!selectedCategory ? 'white' : 'teal.700'}
                                align="center"
                                justify="center"
                            >
                                <Icon as={FiGrid} boxSize={3} />
                            </Flex>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontWeight="bold">All Categories</Text>
                                <Text fontSize="2xs" opacity={0.8}>{documents.length} docs</Text>
                            </VStack>
                        </Box>

                        {visibleRibbonCategories.map((category) => {
                            const isSelected = selectedCategory === category._id;
                            const count = documents.filter((d) => d.category?._id === category._id).length;

                            return (
                                <Box
                                  key={category._id}
                                  as="button"
                                  onClick={() => setSelectedCategory(isSelected ? '' : category._id)}
                                  p="2"
                                  px="3"
                                  borderRadius="xl"
                                  bg={isSelected ? 'teal.600' : softBg}
                                  color={isSelected ? 'white' : 'gray.800'}
                                  borderWidth="1px"
                                  borderColor={isSelected ? 'teal.600' : borderColor}
                                  boxShadow={isSelected ? 'md' : 'none'}
                                  display="flex"
                                  alignItems="center"
                                  gap="2"
                                  flexShrink={0}
                                  transition="all 0.2s"
                                  _hover={{ transform: 'translateY(-1px)', bg: isSelected ? 'teal.700' : 'teal.50' }}
                                >
                                    <Flex
                                        boxSize="22px"
                                        borderRadius="lg"
                                        bg={isSelected ? 'whiteAlpha.300' : 'teal.50'}
                                        color={isSelected ? 'white' : 'teal.700'}
                                        align="center"
                                        justify="center"
                                    >
                                        <Icon as={FiFolder} boxSize={3} />
                                    </Flex>
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{category.name}</Text>
                                        <Text fontSize="2xs" opacity={0.8}>{count} docs</Text>
                                    </VStack>
                                </Box>
                            );
                        })}

                        {visibleRibbonCategories.length === 0 && (
                            <Flex align="center" gap="2" p="2" px="4" borderRadius="xl" bg="gray.100" color="gray.600" flexShrink={0}>
                                <Text fontSize="xs">No categories match "{categoryFilterSearch}"</Text>
                                <Button size="2xs" colorScheme="teal" variant="link" onClick={() => setCategoryFilterSearch('')}>
                                    Clear search
                                </Button>
                            </Flex>
                        )}
                    </Flex>
                </Box>

                {/* 4. THE NEXT FIVE DEPARTMENTS (THE BIG 5 LIGHT GREEN & WHITE 3D FOLDER CARDS) */}
                <Box mb="4">
                    <Flex justify="space-between" align="center" mb="1.5">
                        <HStack spacing={2}>
                            <Icon as={FiBriefcase} color="teal.600" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.600">
                                Major Company Departments ({BIG_FIVE_DEPARTMENTS.length})
                            </Heading>
                        </HStack>
                        {selectedDepartment && (
                            <Button size="2xs" variant="ghost" colorScheme="teal" onClick={() => setSelectedDepartment('')}>
                                Reset Company Filter
                            </Button>
                        )}
                    </Flex>

                    {/* 5 Big 3D Folder Cards Showcase (Light Green & White) */}
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="3.5">
                        {BIG_FIVE_DEPARTMENTS.map((dept) => {
                            const isSelected = selectedDepartment === dept.name;
                            const count = documents.filter((doc) => {
                                const brand = getDocumentBrand(doc);
                                return brand?.name === dept.name || doc.department === dept.name || normalize(doc.title).includes(normalize(dept.shortName));
                            }).length;

                            return (
                                <Box
                                  key={dept.name}
                                  as="button"
                                  onClick={() => setSelectedDepartment(isSelected ? '' : dept.name)}
                                  borderRadius="26px"
                                  overflow="hidden"
                                  bgGradient={LIGHT_GREEN_THEME.bg}
                                  boxShadow={isSelected ? `0 16px 32px -4px ${LIGHT_GREEN_THEME.shadow}` : `0 10px 22px -4px ${LIGHT_GREEN_THEME.shadow}`}
                                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                  _hover={{ transform: 'translateY(-5px) scale(1.02)', boxShadow: `0 18px 36px -6px ${LIGHT_GREEN_THEME.shadow}` }}
                                  display="flex"
                                  flexDirection="column"
                                  textAlign="left"
                                  h="150px"
                                  position="relative"
                                  justifyContent="space-between"
                                >
                                    {/* Top Peeking Document Sheets with Enhanced Logo Visibility */}
                                    <Box position="relative" h="58px" w="100%" overflow="hidden" pt="2" px="3">
                                        <Box position="absolute" top="10px" right="16px" w="60%" h="42px" bg="whiteAlpha.700" borderRadius="10px" transform="rotate(5deg)" />
                                        <Box position="absolute" top="7px" right="24px" w="64%" h="45px" bg="whiteAlpha.900" borderRadius="10px" transform="rotate(2deg)" />
                                        <Box
                                            position="absolute"
                                            top="4px"
                                            left="16px"
                                            right="26px"
                                            h="48px"
                                            bg="white"
                                            borderRadius="10px"
                                            p="2"
                                            boxShadow="0 2px 8px rgba(0,0,0,0.12)"
                                            transform="rotate(-2deg)"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Image
                                                src={dept.logo}
                                                alt={dept.name}
                                                maxH="32px"
                                                maxW="90%"
                                                objectFit="contain"
                                                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.12))"
                                            />
                                        </Box>
                                    </Box>

                                    {/* Front Frosted Folder Pocket */}
                                    <Box
                                        position="relative"
                                        zIndex={2}
                                        bg="linear-gradient(180deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.25) 100%)"
                                        backdropFilter="blur(16px)"
                                        borderTop="1.5px solid rgba(255, 255, 255, 0.8)"
                                        borderRadius="20px 20px 26px 26px"
                                        p="3"
                                        boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.5)"
                                    >
                                        <Flex justify="space-between" align="start">
                                            <Box overflow="hidden">
                                                <Text fontSize="xs" fontWeight="800" color="white" noOfLines={1} textShadow="0 1px 2px rgba(0,0,0,0.25)">
                                                    {dept.shortName}
                                                </Text>
                                                <Text fontSize="2xs" color="whiteAlpha.900" noOfLines={1} fontWeight="medium">
                                                    {dept.tagline}
                                                </Text>
                                            </Box>
                                            {isSelected && (
                                                <Badge bg="white" color="emerald.800" variant="solid" borderRadius="full" fontSize="2xs" px={1.5} fontWeight="bold">
                                                    ACTIVE ✓
                                                </Badge>
                                            )}
                                        </Flex>
                                        <HStack justify="space-between" align="center" mt="1.5">
                                            <Badge bg="whiteAlpha.400" color="white" borderRadius="full" fontSize="2xs" px={2}>
                                                {count} records
                                            </Badge>
                                            <Icon as={FiSettings} color="whiteAlpha.900" boxSize={3.5} />
                                        </HStack>
                                    </Box>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                </Box>

                {/* 5. DOCUMENT EXPLORER SECTION: LIGHT GREEN & WHITE 3D FOLDER-POCKET CARDS */}
                <Box>
                    {/* Explorer Filter Bar */}
                    <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p="3" mb="3.5" boxShadow="sm">
                        <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                            <HStack spacing="2" wrap="wrap">
                                <HStack color={muted} fontSize="xs">
                                    <Icon as={FiFilter} />
                                    <Text fontWeight="bold">{filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}</Text>
                                </HStack>

                                {selectedCategory && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Category: {categories.find((c) => c._id === selectedCategory)?.name || selectedCategory}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedCategory('')} />
                                    </Badge>
                                )}

                                {selectedDepartment && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Brand: {selectedDepartment}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedDepartment('')} />
                                    </Badge>
                                )}

                                {selectedFileType && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Format: {selectedFileType}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedFileType('')} />
                                    </Badge>
                                )}

                                {selectedYear && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Year: {selectedYear}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedYear('')} />
                                    </Badge>
                                )}

                                {onlyUrgentSchedules && (
                                    <Badge colorScheme="red" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Expiring Schedules Only
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setOnlyUrgentSchedules(false)} />
                                    </Badge>
                                )}
                            </HStack>

                            <HStack spacing="2" wrap="wrap">
                                <Select
                                    size="xs"
                                    borderRadius="lg"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    maxW="110px"
                                    bg={panelBg}
                                >
                                    <option value="">All Years</option>
                                    {availableDocumentYears.map((yr) => (
                                        <option key={yr} value={yr}>
                                            {yr}
                                        </option>
                                    ))}
                                </Select>

                                <Select
                                    size="xs"
                                    borderRadius="lg"
                                    value={selectedFileType}
                                    onChange={(e) => setSelectedFileType(e.target.value)}
                                    maxW="120px"
                                    bg={panelBg}
                                >
                                    <option value="">All Formats</option>
                                    {fileTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </Select>

                                {(searchQuery || activeFilterCount > 0) && (
                                    <Button size="xs" variant="ghost" colorScheme="red" leftIcon={<FiX />} onClick={clearFilters}>
                                        Clear All
                                    </Button>
                                )}

                                <ButtonGroup size="xs" isAttached variant="outline">
                                    <IconButton
                                        aria-label="Grid view"
                                        icon={<Icon as={FiGrid} />}
                                        colorScheme={viewMode === 'grid' ? 'teal' : 'gray'}
                                        variant={viewMode === 'grid' ? 'solid' : 'outline'}
                                        onClick={() => setViewMode('grid')}
                                    />
                                    <IconButton
                                        aria-label="List view"
                                        icon={<Icon as={FiList} />}
                                        colorScheme={viewMode === 'list' ? 'teal' : 'gray'}
                                        variant={viewMode === 'list' ? 'solid' : 'outline'}
                                        onClick={() => setViewMode('list')}
                                    />
                                </ButtonGroup>
                            </HStack>
                        </Flex>
                    </Box>

                    {error && (
                        <Alert status="error" borderRadius="xl" mb="4">
                            <AlertIcon />
                            <Box flex="1">
                                <AlertTitle>Company documents could not be loaded</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Box>
                            <Button size="sm" onClick={() => fetchDocuments()}>Try again</Button>
                        </Alert>
                    )}

                    {loading ? (
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="3.5">
                            {Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} height="255px" borderRadius="26px" />)}
                        </SimpleGrid>
                    ) : !error && paginatedDocuments.length === 0 ? (
                        <Flex bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" minH="260px" align="center" justify="center" direction="column" textAlign="center" p="6">
                            <Flex boxSize="50px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center" mb="2">
                                <Icon as={FiFolder} boxSize={6} />
                            </Flex>
                            <Heading size="sm">No documents match the filter criteria</Heading>
                            <Text color={muted} mt="1" maxW="380px" fontSize="xs">
                                Try resetting your category, year, company brand, or clearing the search query.
                            </Text>
                            <Button mt="3" variant="outline" colorScheme="teal" size="xs" onClick={clearFilters}>
                                Reset Filters
                            </Button>
                        </Flex>
                    ) : !error && viewMode === 'grid' ? (
                        /* 5 3D FOLDER-POCKET CARDS PER ROW (LIGHT GREEN & WHITE) */
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="3.5">
                            {paginatedDocuments.map((doc) => {
                                const brand = getDocumentBrand(doc);
                                const scheduleStatus = getDocumentScheduleStatus(doc);
                                const docYear = getDocumentYear(doc);

                                return (
                                    <Box
                                        key={doc._id}
                                        position="relative"
                                        borderRadius="26px"
                                        overflow="hidden"
                                        h="255px"
                                        bgGradient={LIGHT_GREEN_THEME.bg}
                                        boxShadow={`0 14px 28px -6px ${LIGHT_GREEN_THEME.shadow}, 0 4px 10px -2px rgba(0,0,0,0.06)`}
                                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{
                                            transform: 'translateY(-6px) scale(1.02)',
                                            boxShadow: `0 20px 38px -8px ${LIGHT_GREEN_THEME.shadow}`
                                        }}
                                        cursor="pointer"
                                        onClick={() => setPreviewDocument(doc)}
                                        display="flex"
                                        flexDirection="column"
                                        justifyContent="space-between"
                                    >
                                        {/* TOP AREA: PEEKING PAPER SHEETS WITH HIGH-VISIBILITY LOGO */}
                                        <Box position="relative" h="95px" w="100%" overflow="hidden" pt="2.5" px="3">
                                            {/* Paper Sheet 3 (Back) */}
                                            <Box
                                                position="absolute"
                                                top="12px"
                                                right="18px"
                                                w="65%"
                                                h="70px"
                                                bg="whiteAlpha.700"
                                                borderRadius="10px"
                                                transform="rotate(6deg)"
                                                boxShadow="sm"
                                            />
                                            {/* Paper Sheet 2 (Middle) */}
                                            <Box
                                                position="absolute"
                                                top="9px"
                                                right="28px"
                                                w="68%"
                                                h="72px"
                                                bg="whiteAlpha.900"
                                                borderRadius="10px"
                                                transform="rotate(2deg)"
                                                boxShadow="md"
                                            />
                                            {/* Paper Sheet 1 (Front main paper with prominent logo/icon) */}
                                            <Box
                                                position="absolute"
                                                top="6px"
                                                left="20px"
                                                right="32px"
                                                h="78px"
                                                bg="white"
                                                borderRadius="10px"
                                                p="2"
                                                boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                                                transform="rotate(-2deg)"
                                                display="flex"
                                                flexDirection="column"
                                                justifyContent="space-between"
                                            >
                                                <Flex justify="space-between" align="center">
                                                    {brand?.logo ? (
                                                        <Image
                                                            src={brand.logo}
                                                            maxH="28px"
                                                            maxW="75px"
                                                            objectFit="contain"
                                                            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                                                        />
                                                    ) : (
                                                        <Flex boxSize="28px" borderRadius="md" bg="emerald.50" color="emerald.700" align="center" justify="center">
                                                            <Icon as={FiFileText} boxSize={4} />
                                                        </Flex>
                                                    )}
                                                    <Badge size="xs" fontSize="2xs" bg="emerald.50" color="emerald.800" borderRadius="full" px="2" fontWeight="bold">
                                                        {getFileType(doc)}
                                                    </Badge>
                                                </Flex>
                                                <VStack align="start" spacing="1" px="0.5">
                                                    <Box h="2.5px" w="85%" bg="gray.200" borderRadius="full" />
                                                    <Box h="2.5px" w="60%" bg="gray.200" borderRadius="full" />
                                                </VStack>
                                            </Box>
                                        </Box>

                                        {/* FRONT FROSTED POCKET WITH FOLDER CUT & BLUR */}
                                        <Box
                                            position="relative"
                                            zIndex={2}
                                            bg="linear-gradient(180deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.25) 100%)"
                                            backdropFilter="blur(16px)"
                                            borderTop="1.5px solid rgba(255, 255, 255, 0.8)"
                                            borderRadius="22px 22px 26px 26px"
                                            p="3"
                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="space-between"
                                            boxShadow="inset 0 1px 3px rgba(255, 255, 255, 0.5)"
                                            h="160px"
                                        >
                                            {/* Details */}
                                            <Box>
                                                <Flex justify="space-between" align="center" mb="1">
                                                    <Badge bg="whiteAlpha.400" color="white" backdropFilter="blur(8px)" borderRadius="full" px="2" py="0.5" fontSize="2xs" fontWeight="bold" maxW="110px" isTruncated>
                                                        {brand?.shortName || doc.department || 'General'}
                                                    </Badge>
                                                    <Text fontSize="2xs" color="white" fontWeight="extrabold" opacity={0.95}>
                                                        📅 {docYear}
                                                    </Text>
                                                </Flex>

                                                <Heading size="xs" color="white" fontWeight="800" noOfLines={2} textShadow="0 1px 2px rgba(0,0,0,0.25)" lineHeight="1.3">
                                                    {doc.title}
                                                </Heading>

                                                <Text fontSize="2xs" color="whiteAlpha.950" mt="0.5" noOfLines={1} fontWeight="semibold">
                                                    {doc.category?.name || 'Company Document'}
                                                </Text>
                                            </Box>

                                            {/* Schedule & Action Row */}
                                            <Box pt="1">
                                                {scheduleStatus.isScheduled && (
                                                    <Flex
                                                        bg="whiteAlpha.400"
                                                        backdropFilter="blur(6px)"
                                                        borderRadius="lg"
                                                        px="2"
                                                        py="0.5"
                                                        mb="2"
                                                        align="center"
                                                        justify="space-between"
                                                        color="white"
                                                        fontSize="2xs"
                                                        fontWeight="bold"
                                                    >
                                                        <HStack spacing={1}>
                                                            <Icon as={FiClock} />
                                                            <Text noOfLines={1}>{scheduleStatus.detail}</Text>
                                                        </HStack>
                                                        <Text fontSize="2xs">EC ⚙</Text>
                                                    </Flex>
                                                )}

                                                <Flex justify="space-between" align="center">
                                                    <Button
                                                        size="2xs"
                                                        bg="white"
                                                        color="emerald.900"
                                                        _hover={{ bg: "gray.100" }}
                                                        borderRadius="full"
                                                        leftIcon={<Icon as={FiEye} />}
                                                        onClick={(e) => { e.stopPropagation(); setPreviewDocument(doc); }}
                                                        px="2.5"
                                                        boxShadow="sm"
                                                        fontWeight="bold"
                                                    >
                                                        Preview
                                                    </Button>

                                                    <HStack spacing="1">
                                                        <IconButton
                                                            aria-label="Renewal Schedule"
                                                            icon={<FiClock />}
                                                            size="2xs"
                                                            bg="whiteAlpha.300"
                                                            color="white"
                                                            _hover={{ bg: "whiteAlpha.500" }}
                                                            borderRadius="full"
                                                            onClick={(e) => { e.stopPropagation(); openScheduleModal(doc); }}
                                                        />
                                                        <IconButton
                                                            aria-label="Edit"
                                                            icon={<EditIcon />}
                                                            size="2xs"
                                                            bg="whiteAlpha.300"
                                                            color="white"
                                                            _hover={{ bg: "whiteAlpha.500" }}
                                                            borderRadius="full"
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(doc); }}
                                                        />
                                                        <IconButton
                                                            aria-label="Delete"
                                                            icon={<DeleteIcon />}
                                                            size="2xs"
                                                            bg="whiteAlpha.300"
                                                            color="white"
                                                            _hover={{ bg: "red.500", color: "white" }}
                                                            borderRadius="full"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDocument(doc); }}
                                                        />
                                                    </HStack>
                                                </Flex>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </SimpleGrid>
                    ) : !error ? (
                        <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflowX="auto" boxShadow="sm">
                            <Table variant="simple" size="sm">
                                <Thead bg={softBg}>
                                    <Tr><Th>Document</Th><Th>Category</Th><Th>Company</Th><Th>Type</Th><Th>Document Year</Th><Th>Renewal Schedule (EC)</Th><Th textAlign="right">Actions</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {paginatedDocuments.map((doc) => {
                                        const brand = getDocumentBrand(doc);
                                        const scheduleStatus = getDocumentScheduleStatus(doc);
                                        const docYear = getDocumentYear(doc);

                                        return (
                                            <Tr key={doc._id}>
                                                <Td>
                                                    <HStack minW="200px">
                                                        <Flex w="60px" justify="center"><CompanyLogo document={doc} compact /></Flex>
                                                        <Box><Text fontWeight="700" fontSize="xs" noOfLines={2}>{doc.title}</Text><Text color={muted} fontSize="2xs">Company document</Text></Box>
                                                    </HStack>
                                                </Td>
                                                <Td fontSize="xs">{doc.category?.name || 'Not categorized'}</Td>
                                                <Td><Badge colorScheme="teal" borderRadius="md" fontSize="2xs">{brand?.shortName || brand?.name || doc.department || 'Unassigned'}</Badge></Td>
                                                <Td fontSize="xs">{getFileType(doc)}</Td>
                                                <Td whiteSpace="nowrap" fontSize="xs" fontWeight="bold" color="teal.700">
                                                    {docYear}
                                                </Td>
                                                <Td>
                                                    <Button
                                                        size="2xs"
                                                        variant={scheduleStatus.isScheduled ? "solid" : "outline"}
                                                        colorScheme={scheduleStatus.isScheduled ? scheduleStatus.color : "teal"}
                                                        leftIcon={<Icon as={FiClock} />}
                                                        onClick={() => openScheduleModal(doc)}
                                                    >
                                                        {scheduleStatus.isScheduled ? scheduleStatus.detail : "Set Interval"}
                                                    </Button>
                                                </Td>
                                                <Td>
                                                    <HStack justify="flex-end">
                                                        <IconButton aria-label="Preview" icon={<Icon as={FiFileText} />} size="xs" colorScheme="teal" onClick={() => setPreviewDocument(doc)} />
                                                        <IconButton aria-label="Edit" icon={<EditIcon />} size="xs" variant="outline" onClick={() => handleEditClick(doc)} />
                                                        <IconButton aria-label="Delete" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => setDeleteDocument(doc)} />
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </Box>
                    ) : null}

                    {/* Pagination */}
                    {!loading && !error && filteredDocuments.length > 0 && (
                        <Flex justify="space-between" align="center" mt="4" bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" px="4" py="2.5">
                            <Text color={muted} fontSize="xs">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length}
                            </Text>
                            <HStack>
                                <IconButton aria-label="Previous page" icon={<Icon as={FiChevronLeft} />} size="xs" variant="outline" isDisabled={page === 1} onClick={() => setPage((v) => v - 1)} />
                                <Text fontSize="xs" fontWeight="bold">Page {page} of {totalPages}</Text>
                                <IconButton aria-label="Next page" icon={<Icon as={FiChevronRight} />} size="xs" variant="outline" isDisabled={page === totalPages} onClick={() => setPage((v) => v + 1)} />
                            </HStack>
                        </Flex>
                    )}
                </Box>
            </Box>

            {/* QUICK UPLOAD DOCUMENT MODAL */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} isCentered size="2xl">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl" p={2}>
                    <ModalHeader borderBottomWidth="1px" pb={3}>
                        <HStack spacing={3}>
                            <Flex boxSize="36px" borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center">
                                <Icon as={FiUploadCloud} boxSize={5} />
                            </Flex>
                            <Box>
                                <Heading size="md" color="gray.800">Upload Company Document</Heading>
                                <Text color={muted} fontSize="xs" fontWeight="normal">Add official files, policies, or contracts for any TradeEthiopia brand.</Text>
                            </Box>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        <DocumentUploadForm
                            categoryOptions={categories}
                            fetchDocuments={() => {
                                fetchDocuments({ silent: true });
                                setIsUploadModalOpen(false);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* PREVIEW DRAWER */}
            <Drawer isOpen={Boolean(previewDocument)} placement="right" size="xl" onClose={() => setPreviewDocument(null)}>
                <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        <Text color="teal.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Document Preview</Text>
                        <Heading size="md" mt="1" pr="8">{previewDocument?.title}</Heading>
                    </DrawerHeader>
                    <DrawerBody py="6">
                        {previewDocument && (
                            <Stack spacing="5">
                                <Flex bg={softBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" minH="110px" align="center" justify="center" p="4">
                                    <CompanyLogo document={previewDocument} />
                                </Flex>
                                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">
                                    {[
                                        ['Company', getDocumentBrand(previewDocument)?.name || previewDocument.department || 'Unassigned'],
                                        ['Category', previewDocument.category?.name || 'Not categorized'],
                                        ['File type', getFileType(previewDocument)],
                                        ['Document Year', getDocumentYear(previewDocument)]
                                    ].map(([lbl, val]) => (
                                        <Box key={lbl} bg={softBg} borderRadius="lg" p="3">
                                            <Text color={muted} fontSize="2xs" fontWeight="700" textTransform="uppercase">{lbl}</Text>
                                            <Text fontWeight="700" mt="0.5" fontSize="sm">{val}</Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>

                                <Box p="4" bg="teal.50" borderWidth="1px" borderColor="teal.200" borderRadius="xl">
                                    <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                                        <HStack spacing={2}>
                                            <Icon as={FiClock} color="teal.700" />
                                            <Box>
                                                <Text fontSize="xs" fontWeight="bold" color="teal.900">
                                                    Ethiopian Renewal & Review Schedule
                                                </Text>
                                                <Text fontSize="2xs" color="teal.700">
                                                    {getDocumentScheduleStatus(previewDocument).detail}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Button
                                            size="xs"
                                            colorScheme="teal"
                                            onClick={() => openScheduleModal(previewDocument)}
                                        >
                                            {getDocumentScheduleStatus(previewDocument).isScheduled ? "Edit Schedule" : "Set Interval"}
                                        </Button>
                                    </Flex>
                                </Box>

                                <Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" h="430px" bg="gray.100">
                                    <Box as="iframe" title={previewDocument.title} src={previewDocument.fileUrl} width="100%" height="100%" border="0" />
                                </Box>
                                <Text color={muted} fontSize="xs">If the preview is not supported directly in the browser, click "Open Document" below.</Text>
                            </Stack>
                        )}
                    </DrawerBody>
                    <DrawerFooter borderTopWidth="1px">
                        <Button variant="outline" mr="3" onClick={() => setPreviewDocument(null)}>Close</Button>
                        <Button as="a" href={previewDocument?.fileUrl} target="_blank" rel="noopener noreferrer" colorScheme="teal" leftIcon={<Icon as={FiExternalLink} />}>
                            Open Document
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* CATEGORY MANAGER DRAWER */}
            <Drawer isOpen={isCategoryDrawerOpen} placement="right" onClose={() => setIsCategoryDrawerOpen(false)} size="md">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        <Heading size="md">Manage Categories</Heading>
                        <Text color={muted} fontSize="xs" fontWeight="400" mt="1">Maintain classification categories for company records.</Text>
                    </DrawerHeader>
                    <DrawerBody py="5">
                        <FormControl>
                            <FormLabel fontSize="xs" fontWeight="bold">{isEditingCategory ? 'Update Category Name' : 'New Category Name'}</FormLabel>
                            <HStack>
                                <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="e.g. Legal Agreements & MOUs" />
                                <Button colorScheme="teal" onClick={saveCategory} isLoading={isSavingCategory} isDisabled={!newCategoryName.trim()}>
                                    {isEditingCategory ? 'Save' : 'Add'}
                                </Button>
                                {isEditingCategory && (
                                    <IconButton aria-label="Cancel" icon={<Icon as={FiX} />} onClick={() => { setIsEditingCategory(false); setNewCategoryName(''); }} />
                                )}
                            </HStack>
                        </FormControl>
                        <Divider my="5" />
                        <VStack align="stretch" spacing="2">
                            {sortedCategories.map((category) => (
                                <Flex key={category._id} align="center" justify="space-between" borderWidth="1px" borderColor={borderColor} borderRadius="lg" p="3">
                                    <Box>
                                        <Text fontWeight="700" fontSize="sm">{category.name}</Text>
                                        <Text color={muted} fontSize="xs">{documents.filter((doc) => doc.category?._id === category._id).length} document(s)</Text>
                                    </Box>
                                    <HStack>
                                        <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" variant="outline" onClick={() => openEditCategory(category)} />
                                        <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => deleteCategory(category)} />
                                    </HStack>
                                </Flex>
                            ))}
                        </VStack>
                    </DrawerBody>
                    <DrawerFooter borderTopWidth="1px">
                        <Button variant="outline" onClick={() => setIsCategoryDrawerOpen(false)}>Done</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* EDIT DOCUMENT MODAL */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Edit Document Details</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="4">
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Title</FormLabel>
                                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Category</FormLabel>
                                <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                                    {sortedCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Company / Department</FormLabel>
                                <Select value={department} onChange={(event) => setDepartment(event.target.value)}>
                                    {BIG_FIVE_DEPARTMENTS.map((brand) => <option key={brand.name} value={brand.name}>{brand.name}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Document Year (Determined by HR)</FormLabel>
                                <Select
                                    value={editDocYear}
                                    onChange={(event) => setEditDocYear(event.target.value)}
                                    size="sm"
                                    borderRadius="lg"
                                >
                                    {YEAR_OPTIONS.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr="3" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button colorScheme="teal" onClick={handleEditSave} isDisabled={!title.trim() || !categoryId || !department}>Save Changes</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* RENEWAL & INTERVAL SCHEDULE MODAL */}
            <Modal isOpen={Boolean(scheduleDocument)} onClose={() => !isSavingSchedule && setScheduleDocument(null)} isCentered size="lg">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader borderBottomWidth="1px" pb={3}>
                        <HStack spacing={2.5}>
                            <Flex boxSize="36px" borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center">
                                <Icon as={FiClock} boxSize={5} />
                            </Flex>
                            <Box>
                                <Heading size="sm" color="gray.800">Document Renewal & Review Schedule</Heading>
                                <Text color={muted} fontSize="xs" fontWeight="normal" noOfLines={1}>
                                    {scheduleDocument?.title}
                                </Text>
                            </Box>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton isDisabled={isSavingSchedule} />
                    <ModalBody py="5">
                        <Stack spacing="4">
                            {(scheduleDocument?.licenseSchedule?.endDate || scheduleDocument?.licenseSchedule?.renewalDate) && (
                                <Alert
                                    status={getDocumentScheduleStatus(scheduleDocument).color === 'green' ? 'success' : getDocumentScheduleStatus(scheduleDocument).color === 'orange' ? 'warning' : 'error'}
                                    borderRadius="xl"
                                    py="2.5"
                                >
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle fontSize="xs" fontWeight="bold">{getDocumentScheduleStatus(scheduleDocument).label}</AlertTitle>
                                        <AlertDescription fontSize="2xs">
                                            {getDocumentScheduleStatus(scheduleDocument).detail}; Expiry/Review date:{' '}
                                            {scheduleDocument.licenseSchedule?.endDateEthiopian?.year
                                                ? formatEthiopianDate(scheduleDocument.licenseSchedule.endDateEthiopian)
                                                : formatDate(scheduleDocument.licenseSchedule.endDate || scheduleDocument.licenseSchedule.renewalDate)}
                                        </AlertDescription>
                                    </Box>
                                </Alert>
                            )}

                            <Alert status="info" variant="left-accent" borderRadius="lg" py="2">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle fontSize="xs" fontWeight="bold">Ethiopian Calendar (EC) Schedule & Intervals</AlertTitle>
                                    <AlertDescription fontSize="2xs">
                                        Establish the document's official effective start date and expiration/review date in Ethiopian Calendar. The system tracks notification intervals automatically for any company document.
                                    </AlertDescription>
                                </Box>
                            </Alert>

                            {/* 1. Start / Effective Date (EC) */}
                            <EthiopianDateField
                                label="1. Effective / Start Date (EC)"
                                value={scheduleStartDate}
                                onChange={setScheduleStartDate}
                                description="Enter the Ethiopian start or issue date as stated on the document."
                            />

                            {/* 2. End / Expiry Date (EC) */}
                            <EthiopianDateField
                                label="2. Expiry / Renewal / Review Date (EC)"
                                value={scheduleEndDate}
                                onChange={setScheduleEndDate}
                                description="Enter the Ethiopian expiration or next review date."
                            />

                            {/* 3. Notification Interval Selector */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                                    3. Notification Interval (Days before expiry)
                                </FormLabel>
                                <Input
                                    size="sm"
                                    borderRadius="lg"
                                    type="number"
                                    min="0"
                                    max="365"
                                    step="1"
                                    value={scheduleReminderDays}
                                    onChange={(event) => setScheduleReminderDays(event.target.value)}
                                />
                                <HStack mt="2" spacing="2" flexWrap="wrap">
                                    {[7, 14, 30, 60, 90].map((days) => (
                                        <Button
                                            key={days}
                                            size="2xs"
                                            variant={scheduleReminderDays === String(days) ? 'solid' : 'outline'}
                                            colorScheme="teal"
                                            borderRadius="md"
                                            onClick={() => setScheduleReminderDays(String(days))}
                                        >
                                            {days} days before
                                        </Button>
                                    ))}
                                </HStack>
                            </FormControl>

                            {/* Timeline Preview */}
                            {scheduleIntervalCalculation && (
                                <Box
                                    p="3.5"
                                    bg={scheduleIntervalCalculation.isOverdue ? 'red.50' : scheduleIntervalCalculation.isApproaching ? 'orange.50' : 'teal.50'}
                                    borderWidth="1px"
                                    borderColor={scheduleIntervalCalculation.isOverdue ? 'red.200' : scheduleIntervalCalculation.isApproaching ? 'orange.200' : 'teal.200'}
                                    borderRadius="xl"
                                >
                                    <HStack spacing={2} align="flex-start">
                                        <Icon as={FiClock} color={scheduleIntervalCalculation.isOverdue ? 'red.600' : 'teal.600'} mt={0.5} />
                                        <Box>
                                            <Text fontSize="xs" fontWeight="bold" color={scheduleIntervalCalculation.isOverdue ? 'red.800' : 'teal.900'}>
                                                Interval & Validity Summary
                                            </Text>
                                            <Text fontSize="2xs" color="gray.700" mt={0.5} lineHeight="1.4">
                                                Valid from <b>{scheduleIntervalCalculation.startFormatted}</b> to <b>{scheduleIntervalCalculation.endFormatted}</b> ({scheduleIntervalCalculation.totalDays} total days).
                                            </Text>
                                            <Text fontSize="2xs" color={scheduleIntervalCalculation.isOverdue ? 'red.700' : 'teal.700'} fontWeight="bold" mt={1}>
                                                {scheduleIntervalCalculation.isOverdue
                                                    ? `⚠ Schedule is ${Math.abs(scheduleIntervalCalculation.daysRemaining)} days overdue!`
                                                    : `✓ ${scheduleIntervalCalculation.daysRemaining} days remaining until renewal/review.`}
                                                {' '}HR alerts will trigger {scheduleReminderDays || 30} days prior to expiration.
                                            </Text>
                                        </Box>
                                    </HStack>
                                </Box>
                            )}
                        </Stack>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" py={3}>
                        <Button variant="ghost" size="sm" mr="3" onClick={() => setScheduleDocument(null)} isDisabled={isSavingSchedule}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="teal"
                            bg="#004D40"
                            _hover={{ bg: "#00796B" }}
                            size="sm"
                            borderRadius="lg"
                            leftIcon={<Icon as={FiCalendar} />}
                            onClick={saveSchedule}
                            isLoading={isSavingSchedule}
                            loadingText="Saving"
                        >
                            Save Schedule
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* DELETE MODAL */}
            <Modal isOpen={Boolean(deleteDocument)} onClose={() => !isDeleting && setDeleteDocument(null)} isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Delete Company Document?</ModalHeader>
                    <ModalCloseButton isDisabled={isDeleting} />
                    <ModalBody>
                        <Alert status="error" variant="subtle" borderRadius="lg">
                            <AlertIcon />
                            <Box>
                                <AlertTitle fontSize="sm">This action is permanent.</AlertTitle>
                                <AlertDescription fontSize="xs">"{deleteDocument?.title}" will be permanently removed from company records.</AlertDescription>
                            </Box>
                        </Alert>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr="3" onClick={() => setDeleteDocument(null)} isDisabled={isDeleting}>Cancel</Button>
                        <Button colorScheme="red" onClick={confirmDeleteDocument} isLoading={isDeleting}>Delete Document</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default DocumentList;
