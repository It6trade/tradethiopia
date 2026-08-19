import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Avatar,
    Badge,
    Box,
    Button,
    ButtonGroup,
    Card,
    CardBody,
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
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Progress,
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
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ChevronDownIcon } from '@chakra-ui/icons';
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
    FiDownload,
    FiExternalLink,
    FiEye,
    FiFile,
    FiFileText,
    FiFilter,
    FiFolder,
    FiGrid,
    FiInfo,
    FiLayers,
    FiList,
    FiMail,
    FiPhone,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiSettings,
    FiShield,
    FiUploadCloud,
    FiUser,
    FiUserCheck,
    FiUsers,
    FiX,
} from 'react-icons/fi';
import { Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../services/axiosInstance';
import DocumentUploadForm from './EmployeeDocumentUploadForm';

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

const normalize = (value = '') => String(value || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

// Unified Light Green & White Theme
const LIGHT_GREEN_THEME = {
    bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bgLight: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    shadow: 'rgba(16, 185, 129, 0.35)',
    accent: '#059669'
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

const REQUIRED_EMPLOYEE_DOCUMENT_TYPES = [
    { label: 'Employment Contract', keywords: ['employment contract', 'contract'] },
    { label: 'Employee Leave', keywords: ['employee leave', 'leave request', 'leave'] },
    { label: 'Warning Letters', keywords: ['warning letter', 'warning letters', 'warning'] },
    { label: 'Certifications', keywords: ['certification', 'certifications', 'certificate'] },
    { label: 'Supportive Letters', keywords: ['supportive letter', 'supportive letters', 'support letter'] },
    { label: 'Recommendations', keywords: ['recommendation', 'recommendations', 'recommendation letter'] },
    { label: 'Guarantor Files', keywords: ['guarantor', 'guarantor file', 'guarantor files'] },
    { label: 'Educational Background', keywords: ['educational background', 'education', 'educational', 'degree', 'diploma', 'transcript'] },
    { label: 'Handover File', keywords: ['handover', 'hand over'] },
    { label: 'Medical Certificate', keywords: ['medical certificate', 'medical', 'health certificate'] },
    { label: 'Part-Time Contract', keywords: ['part time', 'part-time'] },
    { label: 'Experience Letter', keywords: ['job experience', 'experience letter', 'work experience'] },
    { label: 'Termination / Exit', keywords: ['termination', 'resignation', 'leaving', 'exit'] },
];

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

const EmployeeDocument = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Multi-Faceted Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(searchParams.get('employee') || searchParams.get('userId') || '');
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [complianceFilter, setComplianceFilter] = useState(''); // all, complete, incomplete, empty
    const [onlyUrgentSchedules, setOnlyUrgentSchedules] = useState(false);
    
    // UI State
    const [isAlertBannerOpen, setIsAlertBannerOpen] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [deleteDocument, setDeleteDocument] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedEmployeeDossier, setSelectedEmployeeDossier] = useState(null);
    const [isDossierDrawerOpen, setIsDossierDrawerOpen] = useState(false);
    
    // Edit & Upload Modals
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [title, setTitle] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [department, setDepartment] = useState('');
    const [editDocYear, setEditDocYear] = useState(String(CURRENT_YEAR));
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadPreselectedUser, setUploadPreselectedUser] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    
    // Renewal Schedule Modal
    const [scheduleDocument, setScheduleDocument] = useState(null);
    const [scheduleStartDate, setScheduleStartDate] = useState(EMPTY_ETHIOPIAN_DATE);
    const [scheduleEndDate, setScheduleEndDate] = useState(EMPTY_ETHIOPIAN_DATE);
    const [scheduleReminderDays, setScheduleReminderDays] = useState('30');
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    
    const toast = useToast();
    const location = useLocation();
    const categoryRibbonRef = useRef(null);
    const employeeRibbonRef = useRef(null);

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

    const scrollEmployeeRibbon = (direction) => {
        if (employeeRibbonRef.current) {
            employeeRibbonRef.current.scrollBy({
                left: direction === 'left' ? -280 : 280,
                behavior: 'smooth'
            });
        }
    };

    const fetchDocuments = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents`, { params: { section: 'employees' } });
            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            const message = requestError.response?.data?.error || requestError.message || 'Unable to load employee documents.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const allCategories = Array.isArray(response.data?.data) ? response.data.data : [];
            setCategories(allCategories.filter((category) => category.section === 'employees'));
        } catch (requestError) {
            toast({ title: 'Categories could not be loaded', description: requestError.message, status: 'error', duration: 3500, isClosable: true });
        }
    }, [toast]);

    const fetchSystemUsers = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/users');
            if (Array.isArray(response.data)) {
                setSystemUsers(response.data);
            } else if (Array.isArray(response.data?.data)) {
                setSystemUsers(response.data.data);
            }
        } catch (err) {
            console.log('System users fallback to document records');
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
        fetchCategories();
        fetchSystemUsers();
    }, [fetchCategories, fetchDocuments, fetchSystemUsers]);

    const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
    const fileTypes = useMemo(() => [...new Set(documents.map(getFileType))].sort(), [documents]);
    const departments = useMemo(() => {
        const set = new Set();
        systemUsers.forEach((u) => {
            if (u.jobTitle) set.add(u.jobTitle);
            if (u.role && u.role !== 'sales') set.add(u.role);
        });
        documents.forEach((d) => {
            if (d.department && d.department !== 'none') set.add(d.department);
        });
        return Array.from(set).sort();
    }, [documents, systemUsers]);

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

    const getDocEmployeeName = useCallback((doc) => {
        if (doc?.employeeName && doc.employeeName.trim()) return doc.employeeName.trim();
        if (typeof doc?.userId === 'object' && doc.userId?.fullName) return doc.userId.fullName.trim();
        if (typeof doc?.userId === 'object' && doc.userId?.username) return doc.userId.username.trim();
        return 'Unnamed Employee';
    }, []);

    const getEmployeeKey = useCallback((doc) => {
        if (doc?.userId) {
            return `user:${typeof doc.userId === 'object' ? doc.userId._id : doc.userId}`;
        }
        return `legacy:${getDocEmployeeName(doc).toLowerCase()}`;
    }, [getDocEmployeeName]);

    // Aggregate all employee dossiers (merges registered system staff & uploaded documents)
    const employeeGroups = useMemo(() => {
        const map = {};

        // 1. Seed with all registered system users
        systemUsers.forEach((user) => {
            const name = (user.fullName || user.username || user.email || 'Unnamed Employee').trim();
            const key = `user:${user._id}`;
            map[key] = {
                key,
                userId: user._id,
                userObj: user,
                employeeName: name,
                email: user.email || '',
                phone: user.phone || user.altPhone || '',
                department: user.jobTitle || user.role || 'General',
                status: user.status || 'active',
                documents: [],
            };
        });

        // 2. Populate documents
        documents.forEach((doc) => {
            const key = getEmployeeKey(doc);
            const name = getDocEmployeeName(doc);
            const dept = doc.department || (typeof doc.userId === 'object' ? doc.userId?.jobTitle || doc.userId?.role : '') || 'General';

            if (!map[key]) {
                map[key] = {
                    key,
                    userId: typeof doc.userId === 'object' ? doc.userId?._id : doc.userId,
                    userObj: typeof doc.userId === 'object' ? doc.userId : null,
                    employeeName: name,
                    email: typeof doc.userId === 'object' ? doc.userId?.email || '' : '',
                    phone: '',
                    department: dept,
                    status: 'active',
                    documents: [],
                };
            }
            map[key].documents.push(doc);
        });

        return Object.values(map)
            .map((group) => {
                const matchedChecklistCount = REQUIRED_EMPLOYEE_DOCUMENT_TYPES.filter((type) =>
                    group.documents.some((doc) => {
                        const str = `${doc.title} ${doc.category?.name || ''} ${doc.subcategory || ''}`.toLowerCase();
                        return type.keywords.some((kw) => str.includes(kw));
                    })
                ).length;

                const completionPercentage = Math.round((matchedChecklistCount / REQUIRED_EMPLOYEE_DOCUMENT_TYPES.length) * 100);

                // Category distribution for this specific employee
                const categoryCounts = {};
                group.documents.forEach((doc) => {
                    const catName = doc.category?.name || 'General';
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
                });

                const urgentCount = group.documents.filter((d) => getDocumentScheduleStatus(d).isUrgent).length;

                return {
                    ...group,
                    matchedCount: matchedChecklistCount,
                    totalRequired: REQUIRED_EMPLOYEE_DOCUMENT_TYPES.length,
                    completionPercentage,
                    categoryCounts,
                    urgentCount,
                };
            })
            .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    }, [documents, systemUsers, getEmployeeKey, getDocEmployeeName]);

    // Fast lookup for active selected individual employee
    const activeSelectedEmployeeGroup = useMemo(() => {
        if (!selectedEmployeeName) return null;
        const norm = normalize(selectedEmployeeName);
        return employeeGroups.find((g) =>
            normalize(g.employeeName) === norm ||
            normalize(g.key) === norm ||
            (g.userId && String(g.userId) === selectedEmployeeName)
        ) || null;
    }, [selectedEmployeeName, employeeGroups]);

    // Filtered Employee Quick-Access List
    const displayedEmployeeCards = useMemo(() => {
        return employeeGroups.filter((emp) => {
            if (complianceFilter === 'complete' && emp.completionPercentage < 80) return false;
            if (complianceFilter === 'incomplete' && (emp.completionPercentage >= 80 || emp.documents.length === 0)) return false;
            if (complianceFilter === 'empty' && emp.documents.length > 0) return false;

            if (selectedDepartment) {
                const targetDept = normalize(selectedDepartment);
                const empDept = normalize(emp.department);
                if (empDept !== targetDept && !empDept.includes(targetDept)) return false;
            }

            if (searchQuery.trim() && !selectedEmployeeName) {
                const q = normalize(searchQuery);
                const nameMatch = normalize(emp.employeeName).includes(q);
                const emailMatch = normalize(emp.email).includes(q);
                const deptMatch = normalize(emp.department).includes(q);
                const docMatch = emp.documents.some((d) => normalize(d.title).includes(q) || normalize(d.category?.name).includes(q));
                if (!nameMatch && !emailMatch && !deptMatch && !docMatch) return false;
            }

            return true;
        });
    }, [employeeGroups, complianceFilter, selectedDepartment, searchQuery, selectedEmployeeName]);

    const urgentSchedules = useMemo(() => {
        return documents
            .map((doc) => ({
                doc,
                status: getDocumentScheduleStatus(doc),
                employeeName: getDocEmployeeName(doc)
            }))
            .filter((item) => item.status.isUrgent);
    }, [documents, getDocEmployeeName]);

    // MAIN COMPREHENSIVE FILTER ENGINE (Locates specific employee & all their digital documents)
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            if (onlyUrgentSchedules) {
                const status = getDocumentScheduleStatus(doc);
                if (!status.isUrgent) return false;
            }

            // 1. FILTER BY SPECIFIC INDIVIDUAL EMPLOYEE (By Name, Key, or UserId)
            if (selectedEmployeeName) {
                const targetNorm = normalize(selectedEmployeeName);
                const docEmpName = normalize(getDocEmployeeName(doc));
                const docEmpKey = normalize(getEmployeeKey(doc));
                const docUserId = doc.userId ? (typeof doc.userId === 'object' ? String(doc.userId._id) : String(doc.userId)) : '';

                const matchesEmployee =
                    docEmpName === targetNorm ||
                    docEmpKey === targetNorm ||
                    docUserId === selectedEmployeeName ||
                    (docEmpName && docEmpName.includes(targetNorm));

                if (!matchesEmployee) return false;
            }

            // 2. GLOBAL SEARCH QUERY (Searches Title, Employee Name, Category, Role, Subcategory)
            if (searchQuery.trim()) {
                const query = normalize(searchQuery);
                const titleNorm = normalize(doc.title);
                const nameNorm = normalize(getDocEmployeeName(doc));
                const catNorm = normalize(doc.category?.name);
                const deptNorm = normalize(doc.department);
                const subNorm = normalize(doc.subcategory);

                const matchesSearch =
                    titleNorm.includes(query) ||
                    nameNorm.includes(query) ||
                    catNorm.includes(query) ||
                    deptNorm.includes(query) ||
                    subNorm.includes(query);

                if (!matchesSearch) return false;
            }

            // 3. FILTER BY CATEGORY
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

            // 4. FILTER BY DEPARTMENT
            if (selectedDepartment) {
                const target = normalize(selectedDepartment);
                const docDept = normalize(doc.department);
                if (docDept !== target && !docDept.includes(target)) return false;
            }

            // 5. FILTER BY FILE FORMAT
            if (selectedFileType) {
                if (getFileType(doc) !== selectedFileType) return false;
            }

            // 6. FILTER BY DOCUMENT YEAR
            if (selectedYear) {
                const docYear = getDocumentYear(doc);
                if (docYear !== String(selectedYear)) return false;
            }

            return true;
        });
    }, [documents, searchQuery, selectedEmployeeName, selectedCategory, selectedDepartment, selectedFileType, selectedYear, onlyUrgentSchedules, categories, getDocEmployeeName, getEmployeeKey]);

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
    const paginatedDocuments = filteredDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const activeFilterCount = [selectedCategory, selectedEmployeeName, selectedDepartment, selectedFileType, selectedYear, complianceFilter, onlyUrgentSchedules ? 'urgent' : ''].filter(Boolean).length;

    useEffect(() => setPage(1), [searchQuery, selectedCategory, selectedEmployeeName, selectedDepartment, selectedFileType, selectedYear, complianceFilter, onlyUrgentSchedules, viewMode]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedEmployeeName('');
        setSelectedDepartment('');
        setSelectedFileType('');
        setSelectedYear('');
        setComplianceFilter('');
        setCategoryFilterSearch('');
        setOnlyUrgentSchedules(false);
    };

    const handleSelectEmployee = (emp) => {
        if (!emp) {
            setSelectedEmployeeName('');
            return;
        }
        setSelectedEmployeeName(emp.employeeName);
    };

    const handleOpenDossier = (employeeGroup) => {
        const allEmpDocs = documents.filter((doc) => getDocEmployeeName(doc) === employeeGroup.employeeName || getEmployeeKey(doc) === employeeGroup.key);
        setSelectedEmployeeDossier({
            ...employeeGroup,
            documents: allEmpDocs,
        });
        setIsDossierDrawerOpen(true);
    };

    const handleEditClick = (doc) => {
        setEditDocument(doc);
        setTitle(doc.title || '');
        setEmployeeName(getDocEmployeeName(doc));
        setCategoryId(doc.category?._id || '');
        setSubcategory(doc.subcategory || '');
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
                subcategory,
                department,
                documentYear: yr,
                documentDate: `${yr}-01-01`
            });
            await fetchDocuments({ silent: true });
            setIsEditOpen(false);
            toast({
                title: 'Employee document updated',
                description: `Document details and year (${yr}) have been updated.`,
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
                await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, { name: categoryName, section: 'employees' });
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
        if (!window.confirm(`Delete the "${category.name}" category? Employee records using it may be affected.`)) return;
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
                title: 'Renewal / Review Schedule Active!',
                description: `HR will receive alerts ${reminderDaysBefore} days before ${formatEthiopianDate(scheduleEndDate)}.`,
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
                {/* 1. TOP HEADER & QUICK MULTI-FACETED CONTROLS */}
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
                                Employee Records & Digital Files
                            </Text>
                        </HStack>
                        <Heading size={{ base: 'md', md: 'lg' }} color="gray.800" fontWeight="extrabold">
                            Employee Document Repository
                        </Heading>
                    </Box>

                    {/* Universal Top Controls */}
                    <HStack spacing="2.5" flexWrap="wrap" w={{ base: '100%', lg: 'auto' }}>
                        {/* EMPLOYEE SEARCH & AUTOCOMPLETE SELECTOR */}
                        <Select
                            size="sm"
                            borderRadius="full"
                            placeholder="👤 Locate Individual Employee..."
                            maxW={{ base: '100%', md: '260px' }}
                            value={selectedEmployeeName}
                            onChange={(e) => setSelectedEmployeeName(e.target.value)}
                            bg={panelBg}
                            borderColor={selectedEmployeeName ? 'teal.500' : borderColor}
                            boxShadow="sm"
                            focusBorderColor="teal.500"
                            fontWeight="semibold"
                        >
                            {employeeGroups.map((emp) => (
                                <option key={emp.key} value={emp.employeeName}>
                                    {emp.employeeName} ({emp.documents.length} doc{emp.documents.length === 1 ? '' : 's'} · {emp.department})
                                </option>
                            ))}
                        </Select>

                        {/* GLOBAL SEARCH INPUT */}
                        <InputGroup size="sm" maxW={{ base: '100%', md: '240px' }}>
                            <InputLeftElement pointerEvents="none">
                                <Icon as={FiSearch} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                bg={panelBg}
                                borderRadius="full"
                                placeholder="Search all fields..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                borderColor={borderColor}
                                boxShadow="sm"
                                focusBorderColor="teal.500"
                            />
                            {searchQuery && (
                                <InputRightElement>
                                    <Icon as={FiX} color="gray.400" cursor="pointer" onClick={() => setSearchQuery('')} />
                                </InputRightElement>
                            )}
                        </InputGroup>

                        <Button
                            size="sm"
                            leftIcon={<FiUploadCloud />}
                            colorScheme="teal"
                            bg="#004D40"
                            _hover={{ bg: "#00796B" }}
                            borderRadius="full"
                            boxShadow="0 4px 12px rgba(0, 77, 64, 0.25)"
                            onClick={() => {
                                setUploadPreselectedUser(selectedEmployeeName);
                                setIsUploadModalOpen(true);
                            }}
                        >
                            Upload Employee Doc
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
                            aria-label="Refresh records"
                            icon={<Icon as={FiRefreshCw} />}
                            variant="ghost"
                            colorScheme="teal"
                            borderRadius="full"
                            onClick={() => fetchDocuments()}
                            isLoading={loading}
                        />
                    </HStack>
                </Flex>

                {/* 2. HR RENEWAL & INTERVAL NOTIFICATION BANNER */}
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
                                            Employee Document Expiry & Interval Alerts ({urgentSchedules.length})
                                        </Heading>
                                        <Badge colorScheme="red" fontSize="2xs" borderRadius="full" px={2}>
                                            ACTION REQUIRED
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="2xs" color="orange.800" mt={0.5}>
                                        The following employee contracts, medicals, or certificates require renewal/review based on their Ethiopian calendar schedule:
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
                                {urgentSchedules.map(({ doc, status, employeeName }) => (
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
                                                    <Text fontWeight="semibold" color="teal.600">{employeeName}</Text>
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

                {/* WORKSPACE MODE PILL */}
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
                        variant={location.pathname === '/EmployeeDocument' ? 'solid' : 'ghost'}
                        leftIcon={<Icon as={FiUsers} />}
                    >
                        Employee Documents
                    </Button>
                </Flex>

                {/* 3. INDIVIDUAL EMPLOYEE EXECUTIVE SPOTLIGHT & DOSSIER HUB */}
                {activeSelectedEmployeeGroup ? (
                    <Box
                        mb="4"
                        bg={panelBg}
                        borderWidth="2px"
                        borderColor="teal.400"
                        borderRadius="2xl"
                        p="4"
                        boxShadow="0 10px 30px -8px rgba(16, 185, 129, 0.25)"
                        position="relative"
                        overflow="hidden"
                    >
                        {/* Subtle background glow */}
                        <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" bg="teal.50" borderRadius="full" zIndex={0} pointerEvents="none" opacity={0.6} />

                        <Flex justify="space-between" align={{ base: 'start', lg: 'center' }} direction={{ base: 'column', lg: 'row' }} gap="4" position="relative" zIndex={1}>
                            {/* Profile Info */}
                            <HStack spacing={4} align="center">
                                <Avatar
                                    size="lg"
                                    name={activeSelectedEmployeeGroup.employeeName}
                                    bg="teal.600"
                                    color="white"
                                    border="3px solid"
                                    borderColor="teal.200"
                                    boxShadow="md"
                                />
                                <Box>
                                    <HStack spacing={2} wrap="wrap">
                                        <Heading size="md" color="gray.800" fontWeight="extrabold">
                                            {activeSelectedEmployeeGroup.employeeName}
                                        </Heading>
                                        <Badge colorScheme="teal" variant="solid" borderRadius="full" px={2.5} fontSize="2xs" fontWeight="bold">
                                            INDIVIDUAL DOSSIER ACTIVE
                                        </Badge>
                                        <Badge colorScheme={activeSelectedEmployeeGroup.status === 'active' ? 'green' : 'gray'} borderRadius="full" fontSize="2xs">
                                            {activeSelectedEmployeeGroup.status.toUpperCase()}
                                        </Badge>
                                    </HStack>

                                    <HStack spacing={3} mt={1} fontSize="xs" color="gray.600" wrap="wrap">
                                        <Text fontWeight="bold" color="teal.800">💼 {activeSelectedEmployeeGroup.department}</Text>
                                        {activeSelectedEmployeeGroup.email && (
                                            <HStack spacing={1}>
                                                <Icon as={FiMail} color="gray.400" />
                                                <Text>{activeSelectedEmployeeGroup.email}</Text>
                                            </HStack>
                                        )}
                                        {activeSelectedEmployeeGroup.phone && (
                                            <HStack spacing={1}>
                                                <Icon as={FiPhone} color="gray.400" />
                                                <Text>{activeSelectedEmployeeGroup.phone}</Text>
                                            </HStack>
                                        )}
                                    </HStack>

                                    {/* Compliance Progress Bar */}
                                    <Box mt="2.5" maxW="320px">
                                        <Flex justify="space-between" fontSize="2xs" fontWeight="bold" color="teal.900" mb="1">
                                            <Text>Dossier Checklist Compliance</Text>
                                            <Text>{activeSelectedEmployeeGroup.completionPercentage}% ({activeSelectedEmployeeGroup.matchedCount}/{activeSelectedEmployeeGroup.totalRequired} items)</Text>
                                        </Flex>
                                        <Progress
                                            value={activeSelectedEmployeeGroup.completionPercentage}
                                            size="sm"
                                            borderRadius="full"
                                            colorScheme={activeSelectedEmployeeGroup.completionPercentage >= 80 ? 'green' : activeSelectedEmployeeGroup.completionPercentage >= 40 ? 'orange' : 'teal'}
                                            bg="gray.100"
                                        />
                                    </Box>
                                </Box>
                            </HStack>

                            {/* Action Buttons */}
                            <HStack spacing={2.5} wrap="wrap">
                                <Button
                                    size="sm"
                                    colorScheme="teal"
                                    bg="#004D40"
                                    _hover={{ bg: "#00796B" }}
                                    leftIcon={<Icon as={FiFolder} />}
                                    borderRadius="full"
                                    boxShadow="md"
                                    onClick={() => handleOpenDossier(activeSelectedEmployeeGroup)}
                                >
                                    Full Dossier Checklist
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme="teal"
                                    variant="outline"
                                    leftIcon={<Icon as={FiUploadCloud} />}
                                    borderRadius="full"
                                    onClick={() => {
                                        setUploadPreselectedUser(activeSelectedEmployeeGroup.employeeName);
                                        setIsUploadModalOpen(true);
                                    }}
                                >
                                    Upload File
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    leftIcon={<Icon as={FiX} />}
                                    borderRadius="full"
                                    onClick={() => setSelectedEmployeeName('')}
                                >
                                    View All Staff
                                </Button>
                            </HStack>
                        </Flex>

                        {/* Category Quick Filter Pills for this specific employee */}
                        <Box mt="3.5" pt="3" borderTop="1px dashed" borderColor="teal.200">
                            <Text fontSize="2xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb="2">
                                Filter {activeSelectedEmployeeGroup.employeeName}'s Files by Category:
                            </Text>
                            <Wrap spacing="2">
                                <WrapItem>
                                    <Button
                                        size="xs"
                                        borderRadius="full"
                                        colorScheme="teal"
                                        variant={!selectedCategory ? 'solid' : 'outline'}
                                        onClick={() => setSelectedCategory('')}
                                    >
                                        All Digital Files ({filteredDocuments.length})
                                    </Button>
                                </WrapItem>
                                {Object.entries(activeSelectedEmployeeGroup.categoryCounts).map(([catName, count]) => {
                                    const catObj = categories.find((c) => c.name === catName);
                                    const isSel = selectedCategory === catObj?._id || selectedCategory === catName;

                                    return (
                                        <WrapItem key={catName}>
                                            <Button
                                                size="xs"
                                                borderRadius="full"
                                                colorScheme="teal"
                                                variant={isSel ? 'solid' : 'ghost'}
                                                bg={isSel ? 'teal.600' : 'teal.50'}
                                                color={isSel ? 'white' : 'teal.800'}
                                                onClick={() => setSelectedCategory(isSel ? '' : (catObj?._id || catName))}
                                            >
                                                {catName} ({count})
                                            </Button>
                                        </WrapItem>
                                    );
                                })}
                            </Wrap>
                        </Box>
                    </Box>
                ) : null}

                {/* 4. CATEGORIES RIBBON (FOR ALL EMPLOYEES) */}
                <Box mb="4" bg={panelBg} p="3" borderRadius="2xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <Flex justify="space-between" align="center" mb="2.5" wrap="wrap" gap="2.5">
                        <HStack spacing={2}>
                            <Icon as={FiLayers} color="teal.600" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.700">
                                Employee Categories ({categories.length})
                            </Heading>
                            {selectedCategory && (
                                <Badge colorScheme="teal" borderRadius="full" px={2} fontSize="2xs">
                                    1 ACTIVE
                                </Badge>
                            )}
                        </HStack>

                        <HStack spacing="2" wrap="wrap">
                            <InputGroup size="xs" maxW="190px">
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FiSearch} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Filter categories..."
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
                                maxW="180px"
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
                    </Flex>
                </Box>

                {/* 5. INTERACTIVE EMPLOYEE DIRECTORY & QUICK-SELECT RIBBON */}
                <Box mb="4">
                    <Flex justify="space-between" align="center" mb="2" wrap="wrap" gap={2}>
                        <HStack spacing={2}>
                            <Icon as={FiUsers} color="teal.600" />
                            <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.700">
                                Employee Dossiers ({displayedEmployeeCards.length})
                            </Heading>
                        </HStack>

                        <HStack spacing={2} wrap="wrap">
                            {/* Compliance Filter Selector */}
                            <Select
                                size="xs"
                                borderRadius="lg"
                                value={complianceFilter}
                                onChange={(e) => setComplianceFilter(e.target.value)}
                                maxW="160px"
                                bg={panelBg}
                            >
                                <option value="">All Dossier Status</option>
                                <option value="complete">Complete (80%+)</option>
                                <option value="incomplete">Incomplete (&lt;80%)</option>
                                <option value="empty">No Files Filed (0%)</option>
                            </Select>

                            {selectedEmployeeName && (
                                <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => setSelectedEmployeeName('')}>
                                    Reset Employee Filter
                                </Button>
                            )}

                            <ButtonGroup size="xs" isAttached variant="outline">
                                <IconButton aria-label="Scroll left" icon={<Icon as={FiChevronLeft} />} onClick={() => scrollEmployeeRibbon('left')} />
                                <IconButton aria-label="Scroll right" icon={<Icon as={FiChevronRight} />} onClick={() => scrollEmployeeRibbon('right')} />
                            </ButtonGroup>
                        </HStack>
                    </Flex>

                    {/* Employee Quick Access 3D Folder Cards (Light Green & White) */}
                    <Flex
                        ref={employeeRibbonRef}
                        gap="3.5"
                        overflowX="auto"
                        py="2"
                        px="0.5"
                        css={{
                            "&::-webkit-scrollbar": { height: "5px" },
                            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "10px" }
                        }}
                    >
                        {displayedEmployeeCards.map((emp) => {
                            const isFiltered = selectedEmployeeName === emp.employeeName || selectedEmployeeName === emp.key;

                            return (
                                <Box
                                    key={emp.key}
                                    borderRadius="26px"
                                    overflow="hidden"
                                    bgGradient={LIGHT_GREEN_THEME.bg}
                                    minW={{ base: '220px', md: '250px' }}
                                    maxW="260px"
                                    h="205px"
                                    boxShadow={isFiltered ? `0 18px 36px -4px ${LIGHT_GREEN_THEME.shadow}` : `0 14px 28px -6px ${LIGHT_GREEN_THEME.shadow}, 0 4px 10px -2px rgba(0,0,0,0.06)`}
                                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                    _hover={{ transform: 'translateY(-5px) scale(1.02)', boxShadow: `0 18px 36px -6px ${LIGHT_GREEN_THEME.shadow}` }}
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="space-between"
                                    flexShrink={0}
                                    position="relative"
                                    border={isFiltered ? "2.5px solid white" : "none"}
                                    cursor="pointer"
                                    onClick={() => handleSelectEmployee(emp)}
                                >
                                    {/* Top Peeking Paper Sheets with Prominent Avatar */}
                                    <Box position="relative" h="72px" w="100%" overflow="hidden" pt="2" px="3">
                                        <Box position="absolute" top="10px" right="16px" w="60%" h="52px" bg="whiteAlpha.700" borderRadius="10px" transform="rotate(6deg)" />
                                        <Box position="absolute" top="7px" right="24px" w="64%" h="54px" bg="whiteAlpha.900" borderRadius="10px" transform="rotate(2deg)" />
                                        <Box
                                            position="absolute"
                                            top="4px"
                                            left="16px"
                                            right="28px"
                                            h="56px"
                                            bg="white"
                                            borderRadius="10px"
                                            p="2"
                                            boxShadow="0 2px 8px rgba(0,0,0,0.12)"
                                            transform="rotate(-2deg)"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <HStack spacing={2}>
                                                <Avatar size="sm" name={emp.employeeName} bg="teal.600" color="white" boxShadow="sm" />
                                                <VStack align="start" spacing={0.5}>
                                                    <Box h="3px" w="45px" bg="gray.200" borderRadius="full" />
                                                    <Box h="3px" w="30px" bg="gray.200" borderRadius="full" />
                                                </VStack>
                                            </HStack>
                                            <Badge bg="emerald.50" color="emerald.800" borderRadius="full" fontSize="2xs" px={2} fontWeight="bold">
                                                {emp.documents.length} files
                                            </Badge>
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
                                        <Text fontSize="xs" fontWeight="800" color="white" noOfLines={1} textShadow="0 1px 2px rgba(0,0,0,0.25)">
                                            {emp.employeeName}
                                        </Text>
                                        <Text fontSize="2xs" color="whiteAlpha.900" noOfLines={1} fontWeight="medium">
                                            {emp.department}
                                        </Text>

                                        {/* Dossier Progress */}
                                        <Box my="1.5">
                                            <Flex justify="space-between" align="center" fontSize="2xs" color="white" mb="0.5" fontWeight="bold">
                                                <Text>Dossier Checklist</Text>
                                                <Text>{emp.completionPercentage}%</Text>
                                            </Flex>
                                            <Progress
                                                value={emp.completionPercentage}
                                                size="xs"
                                                borderRadius="full"
                                                colorScheme="green"
                                                bg="whiteAlpha.400"
                                            />
                                        </Box>

                                        <HStack justify="space-between" pt="1">
                                            <Button
                                                size="2xs"
                                                bg="white"
                                                color="emerald.900"
                                                _hover={{ bg: "gray.100" }}
                                                borderRadius="full"
                                                leftIcon={<Icon as={FiFolder} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDossier(emp);
                                                }}
                                                fontWeight="bold"
                                                px={2.5}
                                            >
                                                Dossier
                                            </Button>

                                            <Button
                                                size="2xs"
                                                bg={isFiltered ? "white" : "whiteAlpha.300"}
                                                color={isFiltered ? "emerald.900" : "white"}
                                                _hover={{ bg: "whiteAlpha.500" }}
                                                borderRadius="full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEmployeeName(isFiltered ? '' : emp.employeeName);
                                                }}
                                                fontWeight="bold"
                                            >
                                                {isFiltered ? 'Active ✓' : 'Filter by Name'}
                                            </Button>
                                        </HStack>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Flex>
                </Box>

                {/* 6. DOCUMENT EXPLORER SECTION: 3D FOLDER CARDS WITH MULTI-FACETED FILTERS */}
                <Box>
                    {/* Explorer Filter Bar */}
                    <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p="3" mb="3.5" boxShadow="sm">
                        <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                            <HStack spacing="2" wrap="wrap">
                                <HStack color={muted} fontSize="xs">
                                    <Icon as={FiFilter} />
                                    <Text fontWeight="bold">{filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}</Text>
                                </HStack>

                                {selectedEmployeeName && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5} fontSize="2xs" display="flex" alignItems="center" fontWeight="bold">
                                        Employer: {selectedEmployeeName}
                                        <Icon as={FiX} ml={1.5} cursor="pointer" onClick={() => setSelectedEmployeeName('')} />
                                    </Badge>
                                )}

                                {selectedCategory && (
                                    <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Category: {categories.find((c) => c._id === selectedCategory)?.name || selectedCategory}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedCategory('')} />
                                    </Badge>
                                )}

                                {selectedDepartment && (
                                    <Badge colorScheme="purple" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Department: {selectedDepartment}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setSelectedDepartment('')} />
                                    </Badge>
                                )}

                                {selectedFileType && (
                                    <Badge colorScheme="orange" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
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

                                {complianceFilter && (
                                    <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Compliance: {complianceFilter}
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setComplianceFilter('')} />
                                    </Badge>
                                )}

                                {onlyUrgentSchedules && (
                                    <Badge colorScheme="red" borderRadius="full" px={2} py={0.5} fontSize="2xs" display="flex" alignItems="center">
                                        Expiring Items Only
                                        <Icon as={FiX} ml={1} cursor="pointer" onClick={() => setOnlyUrgentSchedules(false)} />
                                    </Badge>
                                )}
                            </HStack>

                            <HStack spacing="2" wrap="wrap">
                                {/* DEDICATED EMPLOYEE FILTER DROPDOWN */}
                                <Select
                                    size="xs"
                                    borderRadius="lg"
                                    placeholder="Filter by Employee Name..."
                                    value={selectedEmployeeName}
                                    onChange={(e) => setSelectedEmployeeName(e.target.value)}
                                    maxW="180px"
                                    bg={panelBg}
                                    fontWeight="medium"
                                >
                                    {employeeGroups.map((emp) => (
                                        <option key={emp.key} value={emp.employeeName}>{emp.employeeName}</option>
                                    ))}
                                </Select>

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
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </Select>

                                <Select
                                    size="xs"
                                    borderRadius="lg"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    maxW="130px"
                                    bg={panelBg}
                                >
                                    <option value="">All Depts</option>
                                    {departments.map((d) => (
                                        <option key={d} value={d}>{d}</option>
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
                                <AlertTitle>Employee documents could not be loaded</AlertTitle>
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
                            <Heading size="sm">
                                {selectedEmployeeName ? `No documents found for "${selectedEmployeeName}"` : 'No employee documents match the filter criteria'}
                            </Heading>
                            <Text color={muted} mt="1" maxW="420px" fontSize="xs">
                                {selectedEmployeeName
                                    ? `There are currently no document files matching "${selectedEmployeeName}" under the selected category or year. You can upload digital records for this employee directly below.`
                                    : 'Try selecting a different employee, category, year, or clearing the search bar.'}
                            </Text>
                            <HStack mt="3" spacing="2">
                                {selectedEmployeeName && (
                                    <Button
                                        colorScheme="teal"
                                        size="xs"
                                        bg="#004D40"
                                        _hover={{ bg: "#00796B" }}
                                        leftIcon={<FiUploadCloud />}
                                        onClick={() => {
                                            setUploadPreselectedUser(selectedEmployeeName);
                                            setIsUploadModalOpen(true);
                                        }}
                                    >
                                        Upload File for {selectedEmployeeName}
                                    </Button>
                                )}
                                <Button variant="outline" colorScheme="teal" size="xs" onClick={clearFilters}>
                                    Reset Filters
                                </Button>
                            </HStack>
                        </Flex>
                    ) : !error && viewMode === 'grid' ? (
                        /* 5 LIGHT GREEN & WHITE 3D FOLDER-POCKET CARDS PER ROW */
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="3.5">
                            {paginatedDocuments.map((doc) => {
                                const scheduleStatus = getDocumentScheduleStatus(doc);
                                const docYear = getDocumentYear(doc);
                                const empName = getDocEmployeeName(doc);

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
                                        {/* TOP AREA: PEEKING PAPER SHEETS WITH PROMINENT AVATAR */}
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
                                            {/* Paper Sheet 1 (Front main paper with prominent Avatar) */}
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
                                                    <HStack
                                                        spacing={1.5}
                                                        as="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedEmployeeName(empName);
                                                        }}
                                                    >
                                                        <Avatar size="xs" name={empName} bg="teal.600" color="white" boxShadow="xs" />
                                                        <Text fontSize="2xs" fontWeight="bold" color="gray.800" noOfLines={1} maxW="70px">
                                                            {empName}
                                                        </Text>
                                                    </HStack>
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
                                                        {empName}
                                                    </Badge>
                                                    <Text fontSize="2xs" color="white" fontWeight="extrabold" opacity={0.95}>
                                                        📅 {docYear}
                                                    </Text>
                                                </Flex>

                                                <Heading size="xs" color="white" fontWeight="800" noOfLines={2} textShadow="0 1px 2px rgba(0,0,0,0.25)" lineHeight="1.3">
                                                    {doc.title}
                                                </Heading>

                                                <Text fontSize="2xs" color="whiteAlpha.950" mt="0.5" noOfLines={1} fontWeight="semibold">
                                                    {doc.category?.name || 'Employee Document'}
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
                                    <Tr>
                                        <Th>Document</Th>
                                        <Th>Employee</Th>
                                        <Th>Category</Th>
                                        <Th>Department</Th>
                                        <Th>Format</Th>
                                        <Th>Year</Th>
                                        <Th>Renewal Schedule (EC)</Th>
                                        <Th textAlign="right">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {paginatedDocuments.map((doc) => {
                                        const scheduleStatus = getDocumentScheduleStatus(doc);
                                        const docYear = getDocumentYear(doc);
                                        const empName = getDocEmployeeName(doc);

                                        return (
                                            <Tr key={doc._id}>
                                                <Td>
                                                    <HStack spacing={2.5}>
                                                        <Flex boxSize="30px" borderRadius="md" bg="teal.50" color="teal.600" align="center" justify="center">
                                                            <Icon as={FiFileText} />
                                                        </Flex>
                                                        <Box>
                                                            <Text fontWeight="700" fontSize="xs" noOfLines={1}>{doc.title}</Text>
                                                            {doc.subcategory && <Text color="blue.600" fontSize="2xs">{doc.subcategory}</Text>}
                                                        </Box>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <HStack
                                                        spacing={2}
                                                        as="button"
                                                        onClick={() => setSelectedEmployeeName(empName)}
                                                    >
                                                        <Avatar size="2xs" name={empName} bg="teal.600" color="white" />
                                                        <Text fontSize="xs" fontWeight="semibold" _hover={{ color: "teal.600", textDecoration: "underline" }}>
                                                            {empName}
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td fontSize="xs">{doc.category?.name || 'Uncategorized'}</Td>
                                                <Td><Badge colorScheme="purple" borderRadius="md" fontSize="2xs">{doc.department || 'General'}</Badge></Td>
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
                                                        <IconButton aria-label="Preview" icon={<Icon as={FiEye} />} size="xs" colorScheme="teal" onClick={() => setPreviewDocument(doc)} />
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

            {/* QUICK UPLOAD MODAL */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} isCentered size="3xl">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl" p={2}>
                    <ModalHeader borderBottomWidth="1px" pb={3}>
                        <HStack spacing={3}>
                            <Flex boxSize="36px" borderRadius="lg" bg="teal.50" color="teal.600" align="center" justify="center">
                                <Icon as={FiUploadCloud} boxSize={5} />
                            </Flex>
                            <Box>
                                <Heading size="md" color="gray.800">Upload Employee Document</Heading>
                                <Text color={muted} fontSize="xs" fontWeight="normal">Link contracts, IDs, leaves, or certifications to an employee record.</Text>
                            </Box>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        <DocumentUploadForm
                            fetchDocuments={() => {
                                fetchDocuments({ silent: true });
                                setIsUploadModalOpen(false);
                            }}
                            onComplete={() => setIsUploadModalOpen(false)}
                            defaultEmployeeName={uploadPreselectedUser}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* COMPREHENSIVE EMPLOYEE DOSSIER DRAWER */}
            <Drawer isOpen={isDossierDrawerOpen} placement="right" size="xl" onClose={() => setIsDossierDrawerOpen(false)}>
                <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        {selectedEmployeeDossier && (
                            <Flex align="center" gap={3}>
                                <Avatar size="md" name={selectedEmployeeDossier.employeeName} bg="teal.600" color="white" />
                                <Box>
                                    <Heading size="md" color="gray.800">{selectedEmployeeDossier.employeeName}</Heading>
                                    <HStack spacing={2} mt={0.5}>
                                        <Badge colorScheme="teal" borderRadius="md" fontSize="2xs">{selectedEmployeeDossier.department}</Badge>
                                        <Text fontSize="2xs" color="gray.500">{selectedEmployeeDossier.documents.length} filed records</Text>
                                    </HStack>
                                </Box>
                            </Flex>
                        )}
                    </DrawerHeader>
                    <DrawerBody py="6">
                        {selectedEmployeeDossier && (
                            <Stack spacing="6">
                                <Card borderRadius="xl" borderWidth="1px" borderColor={borderColor} bg={softBg} boxShadow="sm">
                                    <CardBody p="4">
                                        <Flex justify="space-between" align="center" mb="2">
                                            <HStack spacing={2}>
                                                <Icon as={FiShield} color="teal.600" boxSize={5} />
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="bold" color="gray.800">Compliance & File Checklist Coverage</Text>
                                                    <Text fontSize="2xs" color="gray.500">Standard employee documentation required by HR policy.</Text>
                                                </Box>
                                            </HStack>
                                            <Badge
                                                colorScheme={selectedEmployeeDossier.completionPercentage >= 80 ? 'green' : selectedEmployeeDossier.completionPercentage >= 40 ? 'orange' : 'red'}
                                                fontSize="xs"
                                                borderRadius="full"
                                                px={2.5}
                                                py={0.5}
                                            >
                                                {selectedEmployeeDossier.completionPercentage}% COMPLETE
                                            </Badge>
                                        </Flex>
                                        <Progress
                                            value={selectedEmployeeDossier.completionPercentage}
                                            borderRadius="full"
                                            size="sm"
                                            colorScheme={selectedEmployeeDossier.completionPercentage >= 80 ? 'green' : selectedEmployeeDossier.completionPercentage >= 40 ? 'orange' : 'teal'}
                                        />
                                    </CardBody>
                                </Card>

                                <Box>
                                    <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.600" mb="3">
                                        Checklist Status & Filed Records
                                    </Heading>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="3">
                                        {REQUIRED_EMPLOYEE_DOCUMENT_TYPES.map((type) => {
                                            const matchedDocs = selectedEmployeeDossier.documents.filter((doc) => {
                                                const str = `${doc.title} ${doc.category?.name || ''} ${doc.subcategory || ''}`.toLowerCase();
                                                return type.keywords.some((kw) => str.includes(kw));
                                            });
                                            const isComplete = matchedDocs.length > 0;

                                            return (
                                                <Box
                                                    key={type.label}
                                                    p="3"
                                                    borderRadius="xl"
                                                    borderWidth="1px"
                                                    borderColor={isComplete ? 'teal.200' : 'gray.200'}
                                                    bg={isComplete ? 'teal.50' : panelBg}
                                                >
                                                    <Flex justify="space-between" align="start" mb={isComplete ? '2' : '0'}>
                                                        <HStack spacing={2}>
                                                            <Icon
                                                                as={isComplete ? FiCheckCircle : FiAlertCircle}
                                                                color={isComplete ? 'teal.600' : 'gray.400'}
                                                                boxSize={4}
                                                            />
                                                            <Text fontSize="xs" fontWeight="bold" color={isComplete ? 'teal.900' : 'gray.700'}>
                                                                {type.label}
                                                            </Text>
                                                        </HStack>
                                                        <Badge colorScheme={isComplete ? 'teal' : 'gray'} fontSize="2xs" borderRadius="md">
                                                            {isComplete ? `${matchedDocs.length} filed` : 'Missing'}
                                                        </Badge>
                                                    </Flex>

                                                    {isComplete && (
                                                        <VStack align="stretch" spacing={1} mt={1}>
                                                            {matchedDocs.map((doc) => (
                                                                <Flex key={doc._id} justify="space-between" align="center" bg={panelBg} p="1.5" px="2" borderRadius="md" borderWidth="1px">
                                                                    <Text fontSize="2xs" fontWeight="semibold" noOfLines={1}>{doc.title}</Text>
                                                                    <HStack spacing={1}>
                                                                        <Button size="2xs" variant="ghost" colorScheme="teal" onClick={() => setPreviewDocument(doc)}>
                                                                            View
                                                                        </Button>
                                                                        <IconButton as="a" href={doc.fileUrl} target="_blank" aria-label="Open" icon={<FiExternalLink />} size="2xs" variant="ghost" />
                                                                    </HStack>
                                                                </Flex>
                                                            ))}
                                                        </VStack>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </SimpleGrid>
                                </Box>
                            </Stack>
                        )}
                    </DrawerBody>
                    <DrawerFooter borderTopWidth="1px">
                        <Button variant="outline" mr="3" onClick={() => setIsDossierDrawerOpen(false)}>Done</Button>
                        <Button
                            colorScheme="teal"
                            leftIcon={<FiUploadCloud />}
                            onClick={() => {
                                setIsDossierDrawerOpen(false);
                                setIsUploadModalOpen(true);
                            }}
                        >
                            Upload File for Employee
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* PREVIEW DRAWER */}
            <Drawer isOpen={Boolean(previewDocument)} placement="right" size="xl" onClose={() => setPreviewDocument(null)}>
                <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(3px)" />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        <Text color="teal.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Employee Document Preview</Text>
                        <Heading size="md" mt="1" pr="8">{previewDocument?.title}</Heading>
                    </DrawerHeader>
                    <DrawerBody py="6">
                        {previewDocument && (
                            <Stack spacing="5">
                                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">
                                    {[
                                        ['Employee', getDocEmployeeName(previewDocument)],
                                        ['Department', previewDocument.department || 'General'],
                                        ['Category', previewDocument.category?.name || 'Not categorized'],
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
                                                    Renewal & Review Schedule (EC)
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
                        <Heading size="md">Manage Employee Categories</Heading>
                        <Text color={muted} fontSize="xs" fontWeight="400" mt="1">Maintain classification categories for employee dossiers.</Text>
                    </DrawerHeader>
                    <DrawerBody py="5">
                        <FormControl>
                            <FormLabel fontSize="xs" fontWeight="bold">{isEditingCategory ? 'Update Category Name' : 'New Category Name'}</FormLabel>
                            <HStack>
                                <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="e.g. Health & Safety Certificates" />
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
                    <ModalHeader>Edit Employee Document Details</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="4">
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Title / Type</FormLabel>
                                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Category</FormLabel>
                                <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                                    {sortedCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Department / Role</FormLabel>
                                <Input value={department} onChange={(event) => setDepartment(event.target.value)} />
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
                                        <option key={year} value={year}>{year}</option>
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
                                <Heading size="sm" color="gray.800">Renewal & Interval Schedule (EC)</Heading>
                                <Text color={muted} fontSize="xs" fontWeight="normal" noOfLines={1}>
                                    {scheduleDocument?.title} · {scheduleDocument?.employeeName}
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
                                        Establish the employee document's start and renewal/review dates in Ethiopian Calendar. The system automatically sends reminder notifications.
                                    </AlertDescription>
                                </Box>
                            </Alert>

                            {/* 1. Start / Effective Date (EC) */}
                            <EthiopianDateField
                                label="1. Effective / Start Date (EC)"
                                value={scheduleStartDate}
                                onChange={setScheduleStartDate}
                                description="Enter the Ethiopian start or issue date."
                            />

                            {/* 2. End / Expiry Date (EC) */}
                            <EthiopianDateField
                                label="2. Expiry / Renewal / Review Date (EC)"
                                value={scheduleEndDate}
                                onChange={setScheduleEndDate}
                                description="Enter the Ethiopian expiration or next review date."
                            />

                            {/* 3. Notification Interval */}
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
                    <ModalHeader>Delete Employee Document?</ModalHeader>
                    <ModalCloseButton isDisabled={isDeleting} />
                    <ModalBody>
                        <Alert status="error" variant="subtle" borderRadius="lg">
                            <AlertIcon />
                            <Box>
                                <AlertTitle fontSize="sm">This action is permanent.</AlertTitle>
                                <AlertDescription fontSize="xs">"{deleteDocument?.title}" will be permanently removed from the employee record.</AlertDescription>
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

export default EmployeeDocument;
