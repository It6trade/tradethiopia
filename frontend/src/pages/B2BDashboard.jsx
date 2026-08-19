import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Flex,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Badge,
  IconButton,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, RepeatIcon, ViewIcon, EditIcon, DeleteIcon, StarIcon, CloseIcon } from '@chakra-ui/icons';
import axiosInstance from '../services/axiosInstance';
import Layout from '../components/customer/Layout';
import BuyerForm from '../components/BuyerForm';
import SellerForm from '../components/SellerForm';
import MatchDetails from '../components/MatchDetails';
import CustomerDetails from '../components/CustomerDetails';
import NotesLauncher from '../components/notes/NotesLauncher';

const LEAD_INTERNATIONAL_COLUMNS = [
  'Months',
  'OFFICE',
  'REGDATE',
  'ASSDATE',
  'LEAD_TYPE',
  'ROLE',
  'EXPTRADER',
  'BUYER',
  'PRODUCT',
  'EMAIL',
  'PHONE',
  'WEBSITE',
  'HS',
  'HSDSC',
  'CAT_COD',
  'COMERCIALDSC',
  'GWEIGHT',
  'NWEIGHT',
  'FOB_VALUE_IN_USD',
  'FOB_VALUE_IN_BIRR',
  'QTY',
  'UNIT_',
  'CDESTINATION',
];

const LEAD_INTERNATIONAL_SAMPLE_ROWS = [
  {
    Months: 'Hamile',
    OFFICE: 'AAK06',
    REGDATE: '7/13/2024',
    ASSDATE: '7/13/2024',
    LEAD_TYPE: 'International',
    ROLE: 'Buyer',
    EXPTRADER: 'ADAM MOHAMMED',
    BUYER: 'AL NAJLA TRADING EST',
    PRODUCT: 'PEPPER POWDER',
    EMAIL: '',
    PHONE: '+251-911-123456',
    WEBSITE: '',
    HS: '04021000',
    HSDSC: '- In powder, granules',
    CAT_COD: 'Animal Products',
    COMERCIALDSC: 'PEPPER POWDER',
    GWEIGHT: '7,000.00',
    NWEIGHT: '7,000.00',
    FOB_VALUE_IN_USD: '33,110.00',
    FOB_VALUE_IN_BIRR: '1,919,248.00',
    QTY: '',
    UNIT_: '',
    CDESTINATION: 'Saudi Arabia',
  },
  {
    Months: 'Hamile',
    OFFICE: 'IJJ00',
    REGDATE: '8/2/2024',
    ASSDATE: '8/2/2024',
    LEAD_TYPE: 'International',
    ROLE: 'Seller',
    EXPTRADER: 'HABIBA ADEN ISMAIEL',
    BUYER: 'HABIBA ADEN',
    PRODUCT: 'SECOND GRADE FRESH MILK',
    EMAIL: '',
    PHONE: '+251-912-234567',
    WEBSITE: '',
    HS: '04029100',
    HSDSC: '- Not containing added sugar',
    CAT_COD: 'Animal Products',
    COMERCIALDSC: 'SECOND GRADE FRESH MILK',
    GWEIGHT: '61,728.00',
    NWEIGHT: '61,728.00',
    FOB_VALUE_IN_USD: '5,000.00',
    FOB_VALUE_IN_BIRR: '406,383.00',
    QTY: '',
    UNIT_: '',
    CDESTINATION: 'Somalia',
  },
  {
    Months: 'Hamile',
    OFFICE: 'AAA00',
    REGDATE: '7/25/2024',
    ASSDATE: '7/25/2024',
    LEAD_TYPE: 'International',
    ROLE: 'Buyer',
    EXPTRADER: 'SHEWIT G/AMANUEL AAFEWERKI',
    BUYER: 'GEGRIHET',
    PRODUCT: 'SAMPLE OF BUTTER',
    EMAIL: '',
    PHONE: '+251-913-345678',
    WEBSITE: '',
    HS: '04051000',
    HSDSC: '- Butter',
    CAT_COD: 'Animal Products',
    COMERCIALDSC: 'SAMPLE OF BUTTER',
    GWEIGHT: '3.00',
    NWEIGHT: '2.00',
    FOB_VALUE_IN_USD: '3.00',
    FOB_VALUE_IN_BIRR: '174.00',
    QTY: '',
    UNIT_: '',
    CDESTINATION: 'Canada',
  },
];

const LEAD_INTERNATIONAL_HEADER_ALIASES = {
  MONTH: 'Months',
  MONTHS: 'Months',
  OFFICE: 'OFFICE',
  REGDATE: 'REGDATE',
  ASSDATE: 'ASSDATE',
  LEADTYPE: 'LEAD_TYPE',
  TYPE: 'LEAD_TYPE',
  LEADSCOPE: 'LEAD_TYPE',
  ROLE: 'ROLE',
  BYER: 'ROLE',
  EXPTRADER: 'EXPTRADER',
  EXPORTER: 'EXPTRADER',
  BUYER: 'BUYER',
  PRODUCT: 'PRODUCT',
  PRODUCTNAME: 'PRODUCT',
  ITEM: 'PRODUCT',
  EMAIL: 'EMAIL',
  MAIL: 'EMAIL',
  BUYEREMAIL: 'EMAIL',
  PHONE: 'PHONE',
  TELEPHONE: 'PHONE',
  TEL: 'PHONE',
  CONTACTPHONE: 'PHONE',
  WEBSITE: 'WEBSITE',
  WEB: 'WEBSITE',
  URL: 'WEBSITE',
  SITE: 'WEBSITE',
  HS: 'HS',
  HSDSC: 'HSDSC',
  HSDESC: 'HSDSC',
  CATCOD: 'CAT_COD',
  CATEGORYCODE: 'CAT_COD',
  CATEGORY: 'CAT_COD',
  COMERCIALDSC: 'COMERCIALDSC',
  COMMERCIALDSC: 'COMERCIALDSC',
  GWEIGHT: 'GWEIGHT',
  GROSSWEIGHT: 'GWEIGHT',
  NWEIGHT: 'NWEIGHT',
  NETWEIGHT: 'NWEIGHT',
  FOBVALUEINUSD: 'FOB_VALUE_IN_USD',
  FOBVALUEUSD: 'FOB_VALUE_IN_USD',
  FOBVALUEINBIRR: 'FOB_VALUE_IN_BIRR',
  FOBVALUEBIRR: 'FOB_VALUE_IN_BIRR',
  QTY: 'QTY',
  QUANTITY: 'QTY',
  UNIT: 'UNIT_',
  CDESTINATION: 'CDESTINATION',
  DESTINATION: 'CDESTINATION',
};

const LEAD_INTERNATIONAL_DATE_COLUMNS = new Set(['REGDATE', 'ASSDATE']);
const LEAD_INTERNATIONAL_NUMBER_COLUMNS = new Set([
  'GWEIGHT',
  'NWEIGHT',
  'FOB_VALUE_IN_USD',
  'FOB_VALUE_IN_BIRR',
]);

const formatLeadDateValue = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).trim();
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const normalizeLeadHeader = (key) =>
  String(key || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const createEmptyLeadInternationalRow = () =>
  LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
    acc[column] = '';
    return acc;
  }, {});

const B2BDashboard = () => {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchScope, setMatchScope] = useState("All");
  const [lastMatchScope, setLastMatchScope] = useState("All");
  const [savedMatches, setSavedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [detailViewType, setDetailViewType] = useState('match'); // 'match', 'buyer', or 'seller'
  const [savedBy, setSavedBy] = useState('user@example.com'); // In a real app, this would come from auth context
  const [leadInternationalRows, setLeadInternationalRows] = useState(() =>
    LEAD_INTERNATIONAL_SAMPLE_ROWS.map((row, index) => ({
      ...row,
      _rowKey: `sample-${index + 1}`,
    }))
  );
  const [isImportingLeadFile, setIsImportingLeadFile] = useState(false);
  const [newLeadInternationalRow, setNewLeadInternationalRow] = useState(createEmptyLeadInternationalRow);
  const [isSavingLeadInternationalRow, setIsSavingLeadInternationalRow] = useState(false);
  const [editLeadInternationalRow, setEditLeadInternationalRow] = useState(createEmptyLeadInternationalRow);
  const [editingLeadInternationalTarget, setEditingLeadInternationalTarget] = useState(null);
  const [isUpdatingLeadInternationalRow, setIsUpdatingLeadInternationalRow] = useState(false);
  const [deletingLeadInternationalTarget, setDeletingLeadInternationalTarget] = useState(null);
  const [isDeletingLeadInternationalRow, setIsDeletingLeadInternationalRow] = useState(false);
  const [leadColumnVisibility, setLeadColumnVisibility] = useState(() =>
    LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
      acc[column] = true;
      return acc;
    }, {})
  );
  const [leadCategory, setLeadCategory] = useState('All');
  const leadImportRef = useRef(null);
  const toast = useToast();
  const isLeadTabActive = activeTab === 4 || activeTab === 5;
  
  const getScopeBadgeColor = (scope = "All") => {
    if (scope === 'International') return 'purple';
    if (scope === 'Local') return 'green';
    return 'blue';
  };
  
  const { isOpen: isBuyerDrawerOpen, onOpen: onBuyerDrawerOpen, onClose: onBuyerDrawerClose } = useDisclosure();
  const { isOpen: isSellerDrawerOpen, onOpen: onSellerDrawerOpen, onClose: onSellerDrawerClose } = useDisclosure();
  const { isOpen: isMatchModalOpen, onOpen: onMatchModalOpen, onClose: onMatchModalClose } = useDisclosure();
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
  const { isOpen: isLeadAddModalOpen, onOpen: onLeadAddModalOpen, onClose: onLeadAddModalClose } = useDisclosure();
  const { isOpen: isLeadEditModalOpen, onOpen: onLeadEditModalOpen, onClose: onLeadEditModalClose } = useDisclosure();
  const { isOpen: isLeadDeleteModalOpen, onOpen: onLeadDeleteModalOpen, onClose: onLeadDeleteModalClose } = useDisclosure();

  // Fetch buyers and sellers
  const fetchData = async () => {
    setLoading(true);
    try {
      const [buyersRes, sellersRes] = await Promise.allSettled([
        axiosInstance.get('/buyers'),
        axiosInstance.get('/sellers')
      ]);
      
      const rawBuyers = buyersRes.status === 'fulfilled' && Array.isArray(buyersRes.value?.data)
        ? buyersRes.value.data
        : (buyersRes.status === 'fulfilled' && Array.isArray(buyersRes.value?.data?.buyers) ? buyersRes.value.data.buyers : []);
      const rawSellers = sellersRes.status === 'fulfilled' && Array.isArray(sellersRes.value?.data)
        ? sellersRes.value.data
        : (sellersRes.status === 'fulfilled' && Array.isArray(sellersRes.value?.data?.sellers) ? sellersRes.value.data.sellers : []);

      const buyersWithProducts = rawBuyers.map(buyer => ({
        ...buyer,
        products: Array.isArray(buyer.products) ? buyer.products : []
      }));
      
      const sellersWithProducts = rawSellers.map(seller => ({
        ...seller,
        products: Array.isArray(seller.products) ? seller.products : [],
        certifications: Array.isArray(seller.certifications) ? seller.certifications : []
      }));
      
      setBuyers(buyersWithProducts);
      setSellers(sellersWithProducts);
    } catch (error) {
      console.warn('Error fetching B2B marketplace data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Run matching algorithm
  const runMatching = async (scopeOverride) => {
    const scopeToUse = typeof scopeOverride === "string" ? scopeOverride : matchScope;
    setLoading(true);
    try {
      const res = await axiosInstance.post('/b2b/match', {
        scope: scopeToUse,
      });
      const matchesList = Array.isArray(res.data?.matches) ? res.data.matches : (Array.isArray(res.data) ? res.data : []);
      setMatches(matchesList);
      setLastMatchScope(scopeToUse);
      setActiveTab(2); // Switch to matches tab
      toast({
        title: 'Matching completed',
        description: `Found ${matchesList.length} ${scopeToUse !== "All" ? `${scopeToUse} ` : ""}potential matches`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error running matching',
        description: error.response?.data?.error || 'Failed to run matching',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete buyer
  const deleteBuyer = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        await axiosInstance.delete(`/buyers/${id}`);
        toast({
          title: 'Buyer deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (error) {
        toast({
          title: 'Error deleting buyer',
          description: error.response?.data?.error || 'Failed to delete buyer',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Delete seller
  const deleteSeller = async (id) => {
    if (window.confirm('Are you sure you want to delete this seller?')) {
      try {
        await axiosInstance.delete(`/sellers/${id}`);
        toast({
          title: 'Seller deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (error) {
        toast({
          title: 'Error deleting seller',
          description: error.response?.data?.error || 'Failed to delete seller',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Fetch saved matches
  const fetchSavedMatches = async () => {
    try {
      const res = await axiosInstance.get('/saved-matches', {
        params: { savedBy: savedBy }
      });
      setSavedMatches(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.warn('Saved matches fetch note:', error.message);
    }
  };

  // Save a match
  const saveMatch = async (match) => {
    try {
      const matchData = {
        buyerId: match.buyerId,
        sellerId: match.sellerId,
        buyerName: match.buyerName,
        sellerName: match.sellerName,
        matchingProducts: match.matchingProducts,
        matchingCriteria: match.matchingCriteria,
        matchReasons: match.matchReasons,
        score: match.score,
        industryMatch: match.industryMatch,
        countryMatch: match.countryMatch,
        savedBy
      };

      await axiosInstance.post('/saved-matches', matchData);
      
      toast({
        title: 'Match saved',
        description: 'This match has been saved for later',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchSavedMatches(); // Refresh saved matches
    } catch (error) {
      toast({
        title: 'Error saving match',
        description: error.response?.data?.error || 'Failed to save match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Delete a saved match
  const deleteSavedMatch = async (id) => {
    if (window.confirm('Are you sure you want to remove this saved match?')) {
      try {
        await axiosInstance.delete(`/saved-matches/${id}`);
        
        toast({
          title: 'Match removed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchSavedMatches(); // Refresh saved matches
      } catch (error) {
        toast({
          title: 'Error removing saved match',
          description: error.response?.data?.error || 'Failed to remove saved match',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Clear all saved matches
  const clearAllSavedMatches = async () => {
    if (window.confirm('Are you sure you want to clear all saved matches?')) {
      try {
        await axiosInstance.post('/saved-matches/clear', { savedBy });
        
        toast({
          title: 'All matches cleared',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchSavedMatches(); // Refresh saved matches
      } catch (error) {
        toast({
          title: 'Error clearing matches',
          description: error.response?.data?.error || 'Failed to clear matches',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Check if a match is already saved
  const isMatchSaved = (match) => {
    return savedMatches.some(savedMatch => 
      savedMatch.buyerId === match.buyerId && savedMatch.sellerId === match.sellerId
    );
  };

  // Filter data based on search term
  const filteredBuyers = buyers.filter(buyer => {
    // Ensure buyer object and its properties exist
    if (!buyer) return false;
    
    const companyName = buyer.companyName || '';
    const industry = buyer.industry || '';
    const country = buyer.country || '';
    
    return companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredSellers = sellers.filter(seller => {
    // Ensure seller object and its properties exist
    if (!seller) return false;
    
    const companyName = seller.companyName || '';
    const industry = seller.industry || '';
    const country = seller.country || '';
    
    return companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredMatches = matches.filter(match => 
    match.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (match.matchingProducts && match.matchingProducts.some(product => 
      product.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const filteredSavedMatches = savedMatches.filter(match => 
    match.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (match.matchingProducts && match.matchingProducts.some(product => 
      product.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const formatLeadImportedCell = (column, value, XLSX) => {
    if (value === null || value === undefined || value === '') return '';

    if (LEAD_INTERNATIONAL_DATE_COLUMNS.has(column)) {
      if (typeof value === 'number' && XLSX?.SSF?.parse_date_code) {
        const parsedDate = XLSX.SSF.parse_date_code(value);
        if (parsedDate?.y && parsedDate?.m && parsedDate?.d) {
          return `${parsedDate.m}/${parsedDate.d}/${parsedDate.y}`;
        }
      }
      return formatLeadDateValue(value);
    }

    if (LEAD_INTERNATIONAL_NUMBER_COLUMNS.has(column)) {
      const numericValue =
        typeof value === 'number'
          ? value
          : Number(String(value).replace(/,/g, ''));

      if (Number.isFinite(numericValue)) {
        return numericValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return String(value).trim();
    }

    if (column === 'QTY') {
      const numericValue =
        typeof value === 'number'
          ? value
          : Number(String(value).replace(/,/g, ''));

      if (Number.isFinite(numericValue)) {
        if (Number.isInteger(numericValue)) return numericValue.toString();
        return numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
    }

    return String(value).trim();
  };

  const mapLeadInternationalRow = (row, XLSX) => {
    const mappedRow = LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
      acc[column] = '';
      return acc;
    }, {});

    Object.entries(row || {}).forEach(([header, value]) => {
      const normalizedHeader = normalizeLeadHeader(header);
      const targetColumn = LEAD_INTERNATIONAL_HEADER_ALIASES[normalizedHeader];
      if (!targetColumn) return;
      mappedRow[targetColumn] = formatLeadImportedCell(targetColumn, value, XLSX);
    });

    const hasData = LEAD_INTERNATIONAL_COLUMNS.some(
      (column) => String(mappedRow[column] || '').trim() !== ''
    );
    return hasData ? mappedRow : null;
  };

  const normalizeLeadInternationalRowShape = (row, index = 0) => {
    const normalized = LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
      acc[column] = row?.[column] ?? '';
      return acc;
    }, {});

    normalized._id = row?._id || row?.id || '';
    normalized._rowKey =
      row?._rowKey ||
      normalized._id ||
      `lead-local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;

    return normalized;
  };

  const fetchLeadInternationalRecords = async () => {
    try {
      const response = await axiosInstance.get('/b2b/lead-international');
      const records = Array.isArray(response.data?.records)
        ? response.data.records
        : (Array.isArray(response.data) ? response.data : []);

      if (records.length > 0) {
        setLeadInternationalRows(records.map((row, index) => normalizeLeadInternationalRowShape(row, index)));
      } else {
        // Keep sample rows when backend has no records yet.
        setLeadInternationalRows(
          LEAD_INTERNATIONAL_SAMPLE_ROWS.map((row, index) =>
            normalizeLeadInternationalRowShape({ ...row, _rowKey: `sample-${index + 1}` }, index)
          )
        );
      }
    } catch (error) {
      console.warn('Lead International fetch note:', error.message);
      setLeadInternationalRows(
        LEAD_INTERNATIONAL_SAMPLE_ROWS.map((row, index) =>
          normalizeLeadInternationalRowShape({ ...row, _rowKey: `sample-${index + 1}` }, index)
        )
      );
    }
  };

  const handleImportLeadInternationalFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const importLeadType = activeTab === 5 ? 'Local' : 'International';

    setIsImportingLeadFile(true);
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.SheetNames?.[0];

      if (!firstSheet) {
        throw new Error('No worksheet found in the selected file.');
      }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      if (!rows.length) {
        toast({
          title: 'No rows found',
          description: 'The selected file does not contain data to import.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const mappedRows = rows
        .map((row) => mapLeadInternationalRow(row, XLSX))
        .filter(Boolean)
        .map((row) => ({
          ...row,
          LEAD_TYPE: importLeadType,
        }));
      if (!mappedRows.length) {
        toast({
          title: 'Nothing to import',
          description: 'No matching Lead International columns were found in this file.',
          status: 'warning',
          duration: 3500,
          isClosable: true,
        });
        return;
      }

      const importResponse = await axiosInstance.post(
        '/b2b/lead-international/import',
        {
          rows: mappedRows,
          replaceExisting: false,
          replaceScope: 'leadType',
          leadType: importLeadType,
        }
      );

      const savedRows = Array.isArray(importResponse.data?.records)
        ? importResponse.data.records.map((row, index) => normalizeLeadInternationalRowShape(row, index))
        : mappedRows.map((row, index) => normalizeLeadInternationalRowShape(row, index));

      setLeadInternationalRows(savedRows);
      setActiveTab(importLeadType === 'Local' ? 5 : 4);
      toast({
        title: 'Import complete',
        description: `Saved ${savedRows.length} row(s) to backend and loaded Lead ${importLeadType}.`,
        status: 'success',
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to import Lead International file:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Unable to import the selected file.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsImportingLeadFile(false);
      event.target.value = '';
    }
  };

  const filteredLeadInternationalRows = leadInternationalRows.filter((row) => {
    const leadType = String(row.LEAD_TYPE || '').trim().toLowerCase();
    if (leadType && leadType !== 'international') return false;

    const matchesSearch = LEAD_INTERNATIONAL_COLUMNS.some((column) =>
      String(row[column] ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (!matchesSearch) return false;

    const roleValue = String(row.ROLE || '').trim().toLowerCase();
    if (leadCategory === 'Buyer') return roleValue === 'buyer';
    if (leadCategory === 'Seller') return roleValue === 'seller';

    return true;
  });

  const filteredLeadLocalRows = leadInternationalRows.filter((row) => {
    const leadType = String(row.LEAD_TYPE || '').trim().toLowerCase();
    if (leadType !== 'local') return false;

    const matchesSearch = LEAD_INTERNATIONAL_COLUMNS.some((column) =>
      String(row[column] ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (!matchesSearch) return false;

    const roleValue = String(row.ROLE || '').trim().toLowerCase();
    if (leadCategory === 'Buyer') return roleValue === 'buyer';
    if (leadCategory === 'Seller') return roleValue === 'seller';

    return true;
  });

  const leadInternationalCount = leadInternationalRows.filter((row) => {
    const leadType = String(row.LEAD_TYPE || '').trim().toLowerCase();
    return !leadType || leadType === 'international';
  }).length;

  const leadLocalCount = leadInternationalRows.filter(
    (row) => String(row.LEAD_TYPE || '').trim().toLowerCase() === 'local'
  ).length;

  const visibleLeadInternationalColumns = LEAD_INTERNATIONAL_COLUMNS.filter(
    (column) => leadColumnVisibility[column] !== false
  );

  const toggleLeadColumnVisibility = (column) => {
    setLeadColumnVisibility((prev) => {
      const next = {
        ...prev,
        [column]: !prev[column],
      };

      // Keep at least one column visible.
      if (Object.values(next).every((isVisible) => !isVisible)) {
        next[column] = true;
      }

      return next;
    });
  };

  const showAllLeadColumns = () => {
    setLeadColumnVisibility(
      LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
        acc[column] = true;
        return acc;
      }, {})
    );
  };

  const resetNewLeadInternationalRow = () => {
    setNewLeadInternationalRow(createEmptyLeadInternationalRow());
  };

  const handleOpenLeadAddModal = () => {
    resetNewLeadInternationalRow();
    onLeadAddModalOpen();
  };

  const handleCloseLeadAddModal = () => {
    onLeadAddModalClose();
  };

  const handleLeadInternationalFieldChange = (column, value) => {
    setNewLeadInternationalRow((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleAddLeadInternationalRow = async () => {
    const hasAnyValue = LEAD_INTERNATIONAL_COLUMNS.some(
      (column) => String(newLeadInternationalRow[column] || '').trim() !== ''
    );

    if (!hasAnyValue) {
      toast({
        title: 'No data to add',
        description: 'Please fill at least one field before adding.',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setIsSavingLeadInternationalRow(true);
    try {
      const response = await axiosInstance.post('/b2b/lead-international', {
        row: newLeadInternationalRow,
      });

      const createdRow = response.data?.record
        ? normalizeLeadInternationalRowShape(response.data.record)
        : normalizeLeadInternationalRowShape(newLeadInternationalRow);

      setLeadInternationalRows((prev) => [createdRow, ...prev]);
      const createdLeadType = String(createdRow.LEAD_TYPE || '').trim().toLowerCase();
      setActiveTab(createdLeadType === 'local' ? 5 : 4);
      toast({
        title: 'Lead added',
        description: 'The row was saved to backend successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      handleCloseLeadAddModal();
      resetNewLeadInternationalRow();
    } catch (error) {
      console.error('Failed to add lead international row:', error);
      toast({
        title: 'Add failed',
        description: error.response?.data?.error || error.message || 'Unable to save this row.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingLeadInternationalRow(false);
    }
  };

  const handleOpenLeadEditModal = (row) => {
    setEditingLeadInternationalTarget(row);
    setEditLeadInternationalRow(
      LEAD_INTERNATIONAL_COLUMNS.reduce((acc, column) => {
        acc[column] = row?.[column] ?? '';
        return acc;
      }, {})
    );
    onLeadEditModalOpen();
  };

  const handleCloseLeadEditModal = () => {
    setEditingLeadInternationalTarget(null);
    onLeadEditModalClose();
  };

  const handleEditLeadInternationalFieldChange = (column, value) => {
    setEditLeadInternationalRow((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleSaveLeadInternationalEdit = async () => {
    if (!editingLeadInternationalTarget) return;

    const hasAnyValue = LEAD_INTERNATIONAL_COLUMNS.some(
      (column) => String(editLeadInternationalRow[column] || '').trim() !== ''
    );
    if (!hasAnyValue) {
      toast({
        title: 'No data to save',
        description: 'Please fill at least one field before saving.',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingLeadInternationalRow(true);
    try {
      let updatedRow = normalizeLeadInternationalRowShape({
        ...editLeadInternationalRow,
        _id: editingLeadInternationalTarget._id || '',
        _rowKey: editingLeadInternationalTarget._rowKey,
      });

      if (editingLeadInternationalTarget._id) {
        const response = await axiosInstance.put(
          `/b2b/lead-international/${editingLeadInternationalTarget._id}`,
          { row: editLeadInternationalRow }
        );

        updatedRow = response.data?.record
          ? normalizeLeadInternationalRowShape({
              ...response.data.record,
              _rowKey: editingLeadInternationalTarget._rowKey,
            })
          : updatedRow;
      }

      setLeadInternationalRows((prev) =>
        prev.map((row) => {
          if (editingLeadInternationalTarget._id && row._id) {
            return row._id === editingLeadInternationalTarget._id ? updatedRow : row;
          }
          return row._rowKey === editingLeadInternationalTarget._rowKey ? updatedRow : row;
        })
      );

      toast({
        title: 'Lead updated',
        description: editingLeadInternationalTarget._id
          ? 'The row was updated in backend successfully.'
          : 'The local row was updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleCloseLeadEditModal();
    } catch (error) {
      console.error('Failed to update lead international row:', error);
      toast({
        title: 'Update failed',
        description: error.response?.data?.error || error.message || 'Unable to update this row.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingLeadInternationalRow(false);
    }
  };

  const handleOpenLeadDeleteModal = (row) => {
    setDeletingLeadInternationalTarget(row);
    onLeadDeleteModalOpen();
  };

  const handleCloseLeadDeleteModal = () => {
    setDeletingLeadInternationalTarget(null);
    onLeadDeleteModalClose();
  };

  const handleConfirmLeadDelete = async () => {
    if (!deletingLeadInternationalTarget) return;

    setIsDeletingLeadInternationalRow(true);
    try {
      if (deletingLeadInternationalTarget._id) {
        await axiosInstance.delete(
          `/b2b/lead-international/${deletingLeadInternationalTarget._id}`
        );
      }

      setLeadInternationalRows((prev) =>
        prev.filter((row) => {
          if (deletingLeadInternationalTarget._id && row._id) {
            return row._id !== deletingLeadInternationalTarget._id;
          }
          return row._rowKey !== deletingLeadInternationalTarget._rowKey;
        })
      );

      toast({
        title: 'Lead deleted',
        description: deletingLeadInternationalTarget._id
          ? 'The row was deleted from backend successfully.'
          : 'The local row was deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleCloseLeadDeleteModal();
    } catch (error) {
      console.error('Failed to delete lead international row:', error);
      toast({
        title: 'Delete failed',
        description: error.response?.data?.error || error.message || 'Unable to delete this row.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeletingLeadInternationalRow(false);
    }
  };

  // Handle view match details
  const handleViewMatch = (match) => {
    setSelectedItem(match);
    setDetailViewType('match');
    onDetailModalOpen();
  };

  // Handle view customer details
  const handleViewCustomer = async (customer, type) => {
    // Always fetch the full customer details to ensure we have the latest data
    try {
      setLoading(true);
      const endpoint = type === 'buyer' 
        ? `/buyers/${customer._id}`
        : `/sellers/${customer._id}`;
      
      const response = await axiosInstance.get(endpoint);
      
      setSelectedItem(response.data);
      setDetailViewType(type); // 'buyer' or 'seller'
      onDetailModalOpen();
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      toast({
        title: `Error fetching ${type} details`,
        description: error.response?.data?.error || `Failed to fetch ${type} details`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit buyer
  const handleEditBuyer = (buyer) => {
    setSelectedItem(buyer);
    onBuyerDrawerOpen();
  };

  // Handle edit seller
  const handleEditSeller = (seller) => {
    setSelectedItem(seller);
    onSellerDrawerOpen();
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await Promise.allSettled([
          fetchData(),
          fetchSavedMatches(),
          fetchLeadInternationalRecords(),
        ]);
      }
    };
    
    loadData().catch(error => {
      console.warn('B2B dashboard load note:', error);
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Layout>
      <Box w="100%" minH="100vh" p={{ base: 4, md: 6 }}>
        {/* Modern Header Banner */}
        <Flex
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          mb={6}
          w="100%"
        >
          <HStack spacing={3}>
            <Box
              p={3}
              bg="teal.500"
              color="white"
              borderRadius="xl"
              boxShadow="0 8px 20px rgba(49, 151, 149, 0.3)"
            >
              <RepeatIcon boxSize={6} />
            </Box>
            <Box>
              <HStack spacing={2}>
                <Heading as="h1" size="lg" fontWeight="800">
                  B2B International Marketplace
                </Heading>
                <Badge colorScheme="teal" variant="subtle" fontSize="xs" px={2.5} py={0.5} borderRadius="full">
                  Global Trade
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm" mt={0.5}>
                Cross-border trading platform connecting verified exporters, buyers, and international trade leads.
              </Text>
            </Box>
          </HStack>

          <HStack spacing={3} flexWrap="wrap" alignSelf={{ base: 'stretch', md: 'center' }}>
            <Select
              size="sm"
              value={matchScope}
              onChange={(e) => setMatchScope(e.target.value)}
              width="150px"
              borderRadius="lg"
              aria-label="Match scope"
              bg={useColorModeValue('white', 'gray.800')}
            >
              <option value="All">All scopes</option>
              <option value="Local">Local only</option>
              <option value="International">International only</option>
            </Select>
            <Button 
              leftIcon={<RepeatIcon />} 
              colorScheme="teal" 
              onClick={() => runMatching()}
              isLoading={loading}
              size="sm"
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            >
              Run Matching
            </Button>
            <NotesLauncher
              buttonProps={{
                size: 'sm',
                variant: 'ghost',
                colorScheme: 'teal',
                'aria-label': 'Notes',
              }}
              tooltipLabel="Notes"
            />
          </HStack>
        </Flex>

        {/* 4 Metric Cards */}
        <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={4} mb={6}>
          <Card borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} boxShadow="sm">
            <CardBody p={4}>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">REGISTERED BUYERS</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="extrabold" color="blue.500">{buyers.length}</StatNumber>
                <StatHelpText mb={0} fontSize="2xs" color="gray.400">Verified Companies</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} boxShadow="sm">
            <CardBody p={4}>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">VERIFIED SELLERS</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="extrabold" color="green.500">{sellers.length}</StatNumber>
                <StatHelpText mb={0} fontSize="2xs" color="gray.400">Exporters & Traders</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} boxShadow="sm">
            <CardBody p={4}>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">ACTIVE MATCHES</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.500">{matches.length}</StatNumber>
                <StatHelpText mb={0} fontSize="2xs" color="gray.400">Potential Connections</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} boxShadow="sm">
            <CardBody p={4}>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">LEAD INTERNATIONAL</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="extrabold" color="purple.500">{leadInternationalRows.length}</StatNumber>
                <StatHelpText mb={0} fontSize="2xs" color="gray.400">Global Trade Records</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Flex mb={4} gap={3} alignItems="center">
          <Input
            placeholder="Search buyers, sellers, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            width="300px"
          />
          <Tooltip label="Refresh data">
            <IconButton
              icon={<RepeatIcon />}
              onClick={async () => {
                await Promise.all([
                  fetchData(),
                  fetchSavedMatches(),
                  fetchLeadInternationalRecords(),
                ]);
              }}
              isLoading={loading}
              size="sm"
            />
          </Tooltip>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={() => {
              setSelectedItem(null);
              onBuyerDrawerOpen();
            }}
            display={activeTab === 0 ? 'inline-flex' : 'none'}
            size="sm"
          >
            Add Buyer
          </Button>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={() => {
              setSelectedItem(null);
              onSellerDrawerOpen();
            }}
            display={activeTab === 1 ? 'inline-flex' : 'none'}
            size="sm"
          >
            Add Seller
          </Button>

          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              variant="outline"
              size="sm"
              display={activeTab === 4 ? 'inline-flex' : 'none'}
            >
              Column Attributes
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
              {LEAD_INTERNATIONAL_COLUMNS.map((column) => (
                <MenuItem key={`lead-col-top-${column}`} closeOnSelect={false}>
                  <Checkbox
                    isChecked={!!leadColumnVisibility[column]}
                    onChange={() => toggleLeadColumnVisibility(column)}
                  >
                    {column}
                  </Checkbox>
                </MenuItem>
              ))}
              <MenuItem closeOnSelect={false}>
                <Button size="xs" variant="ghost" onClick={showAllLeadColumns}>
                  Select All
                </Button>
              </MenuItem>
            </MenuList>
          </Menu>

          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => leadImportRef.current?.click()}
            display={isLeadTabActive ? 'inline-flex' : 'none'}
            size="sm"
            isLoading={isImportingLeadFile}
            isDisabled={isImportingLeadFile}
          >
            Import Excel
          </Button>

          <Button
            colorScheme="teal"
            variant="solid"
            onClick={handleOpenLeadAddModal}
            display={isLeadTabActive ? 'inline-flex' : 'none'}
            size="sm"
            leftIcon={<AddIcon />}
          >
            Add
          </Button>

          <input
            ref={leadImportRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportLeadInternationalFile}
            style={{ display: 'none' }}
          />
        </Flex>

        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Buyers ({buyers.length})</Tab>
            <Tab>Sellers ({sellers.length})</Tab>
            <Tab>Matches ({matches.length})</Tab>
            <Tab>Saved Matches ({savedMatches.length})</Tab>
            <Tab>Lead International ({leadInternationalCount})</Tab>
            <Tab>Lead Local ({leadLocalCount})</Tab>
          </TabList>

          <TabPanels>
            {/* Buyers Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Company Name</Th>
                        <Th>Contact Person</Th>
                        <Th>Email</Th>
                        <Th>Country</Th>
                        <Th>Industry</Th>
                        <Th>Products</Th>
                        <Th>Status</Th>
                        <Th width="120px">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredBuyers.map((buyer) => (
                        <Tr key={buyer._id}>
                          <Td>{buyer.companyName}</Td>
                          <Td>{buyer.contactPerson}</Td>
                          <Td>{buyer.email}</Td>
                          <Td>{buyer.country}</Td>
                          <Td>{buyer.industry}</Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {buyer.products && Array.isArray(buyer.products) && buyer.products.length > 0 ? (
                                <>
                                  {buyer.products.slice(0, 3).map((product, idx) => (
                                    <Badge key={`${buyer._id}-${idx}`} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {buyer.products.length > 3 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{buyer.products.length - 3}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {buyer.products ? 'No products' : 'Products not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={buyer.status === 'Active' ? 'green' : buyer.status === 'Inactive' ? 'yellow' : 'red'}
                              fontSize="0.8em"
                            >
                              {buyer.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton 
                                aria-label="View" 
                                icon={<ViewIcon />} 
                                size="xs"
                                onClick={() => handleViewCustomer(buyer, 'buyer')}
                              />
                              <IconButton 
                                aria-label="Edit" 
                                icon={<EditIcon />} 
                                size="xs"
                                onClick={() => handleEditBuyer(buyer)}
                              />
                              <IconButton 
                                aria-label="Delete" 
                                icon={<DeleteIcon />} 
                                size="xs"
                                colorScheme="red"
                                onClick={() => deleteBuyer(buyer._id)}
                              />
                            </HStack>
                          </Td>

                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

            {/* Sellers Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Company Name</Th>
                        <Th>Contact Person</Th>
                        <Th>Email</Th>
                        <Th>Country</Th>
                        <Th>Industry</Th>
                        <Th>Products</Th>
                        <Th>Certifications</Th>
                        <Th>Status</Th>
                        <Th width="120px">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredSellers.map((seller) => (
                        <Tr key={seller._id}>
                          <Td>{seller.companyName}</Td>
                          <Td>{seller.contactPerson}</Td>
                          <Td>{seller.email}</Td>
                          <Td>{seller.country}</Td>
                          <Td>{seller.industry}</Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {seller.products && Array.isArray(seller.products) && seller.products.length > 0 ? (
                                <>
                                  {seller.products.slice(0, 3).map((product, idx) => (
                                    <Badge key={`${seller._id}-${idx}`} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {seller.products.length > 3 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{seller.products.length - 3}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {seller.products ? 'No products' : 'Products not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {seller.certifications && Array.isArray(seller.certifications) && seller.certifications.length > 0 ? (
                                <>
                                  {seller.certifications.slice(0, 2).map((cert, idx) => (
                                    <Badge key={`${seller._id}-cert-${idx}`} colorScheme="green" fontSize="0.7em" py="0.5">
                                      {cert}
                                    </Badge>
                                  ))}
                                  {seller.certifications.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{seller.certifications.length - 2}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {seller.certifications ? 'No certifications' : 'Certifications not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>

                          <Td>
                            <Badge 
                              colorScheme={seller.status === 'Active' ? 'green' : seller.status === 'Inactive' ? 'yellow' : 'red'}
                              fontSize="0.8em"
                            >
                              {seller.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton 
                                aria-label="View" 
                                icon={<ViewIcon />} 
                                size="xs"
                                onClick={() => handleViewCustomer(seller, 'seller')}
                              />
                              <IconButton 
                                aria-label="Edit" 
                                icon={<EditIcon />} 
                                size="xs"
                                onClick={() => handleEditSeller(seller)}
                              />
                              <IconButton 
                                aria-label="Delete" 
                                icon={<DeleteIcon />} 
                                size="xs"
                                colorScheme="red"
                                onClick={() => deleteSeller(seller._id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

            {/* Matches Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : matches.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" height="200px" textAlign="center">
                    <Text fontSize="lg" mb={4}>No matches found yet.</Text>
                    <Text mb={4}>Run the matching algorithm to find potential connections between buyers and sellers.</Text>
                    <Button 
                      leftIcon={<RepeatIcon />} 
                      colorScheme="teal" 
                      onClick={runMatching}
                    >
                      Run Matching Now
                    </Button>
                  </Flex>
                ) : (
                  <>
                    <Flex
                      mb={4}
                      justify="space-between"
                      flexWrap="wrap"
                      gap={2}
                    >
                      <Text fontWeight="bold">
                        Showing {matches.length} potential matches
                        {matches.length > 0 && lastMatchScope !== "All" ? ` for ${lastMatchScope}` : ""}
                      </Text>
                      {matches.length > 0 && (
                        <Badge colorScheme={getScopeBadgeColor(lastMatchScope)}>
                          Scope: {lastMatchScope}
                        </Badge>
                      )}
                    </Flex>
                    <Table variant="simple" size="sm">
                      <Thead>
                      <Tr>
                        <Th>Buyer Company</Th>
                        <Th>Seller Company</Th>
                        <Th>Scope</Th>
                        <Th>Match Score</Th>
                        <Th>Why Matched</Th>
                        <Th>Matching Products</Th>
                        <Th width="140px">Actions</Th>
                      </Tr>
                      </Thead>
                      <Tbody>
                        {filteredMatches.map((match, index) => {
                          const matchScopeLabel =
                            match.scope || match.buyerScope || match.sellerScope || "All";
                          return (
                            <Tr key={index}>
                              <Td>{match.buyerName}</Td>
                              <Td>{match.sellerName}</Td>
                              <Td>
                                <Badge colorScheme={getScopeBadgeColor(matchScopeLabel)} fontSize="0.7rem">
                                  {matchScopeLabel}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={match.score > 70 ? 'green' : match.score > 40 ? 'yellow' : 'red'}>
                                  {match.score}%
                                </Badge>
                              </Td>
                            <Td>
                              {match.matchReasons && match.matchReasons.length > 0 ? (
                                <Flex direction="column" fontSize="0.8em">
                                  <Text noOfLines={1}>
                                    • {match.matchReasons[0]}
                                  </Text>
                                  {match.matchReasons.length > 1 && (
                                    <Text color="gray.500" fontSize="0.7em">
                                      +{match.matchReasons.length - 1} more
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No reasons</Text>
                              )}
                            </Td>
                            <Td>
                              {match.matchingProducts && match.matchingProducts.length > 0 ? (
                                <Flex wrap="wrap" gap={1}>
                                  {match.matchingProducts.slice(0, 2).map((product, idx) => (
                                    <Badge key={idx} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {match.matchingProducts.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{match.matchingProducts.length - 2}
                                    </Badge>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No products</Text>
                              )}
                            </Td>
                            <Td>
                            <VStack spacing={1} align="stretch">
                              <Button 
                                size="xs" 
                                leftIcon={<ViewIcon />} 
                                onClick={() => handleViewMatch(match)}
                                width="100%"
                              >
                                Details
                              </Button>
                              <Button
                                size="xs"
                                leftIcon={isMatchSaved(match) ? <StarIcon /> : null}
                                colorScheme={isMatchSaved(match) ? "yellow" : "gray"}
                                onClick={() => saveMatch(match)}
                                isLoading={loading}
                                width="100%"
                              >
                                {isMatchSaved(match) ? "Saved" : "Save"}
                              </Button>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })}
                      </Tbody>
                    </Table>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Saved Matches Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredSavedMatches.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" height="200px" textAlign="center">
                    <Text fontSize="lg" mb={4}>No saved matches found.</Text>
                    <Text mb={4}>Save interesting matches from the Matches tab to view them here.</Text>
                  </Flex>
                ) : (
                  <>
                    <Flex mb={4} justify="space-between">
                      <Text fontWeight="bold">Showing {filteredSavedMatches.length} saved matches</Text>
                    </Flex>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Buyer Company</Th>
                          <Th>Seller Company</Th>
                          <Th>Match Score</Th>
                          <Th>Why Matched</Th>
                          <Th>Matching Products</Th>
                          <Th>Saved Date</Th>
                          <Th width="140px">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredSavedMatches.map((match, index) => (
                          <Tr key={match._id || `saved-${index}`}>
                            <Td>{match.buyerName}</Td>
                            <Td>{match.sellerName}</Td>
                            <Td>
                              <Badge colorScheme={match.score > 70 ? 'green' : match.score > 40 ? 'yellow' : 'red'}>
                                {match.score}%
                              </Badge>
                            </Td>
                            <Td>
                              {match.matchReasons && match.matchReasons.length > 0 ? (
                                <Flex direction="column" fontSize="0.8em">
                                  <Text noOfLines={1}>
                                    • {match.matchReasons[0]}
                                  </Text>
                                  {match.matchReasons.length > 1 && (
                                    <Text color="gray.500" fontSize="0.7em">
                                      +{match.matchReasons.length - 1} more
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No reasons</Text>
                              )}
                            </Td>
                            <Td>
                              {match.matchingProducts && match.matchingProducts.length > 0 ? (
                                <Flex wrap="wrap" gap={1}>
                                  {match.matchingProducts.slice(0, 2).map((product, idx) => (
                                    <Badge key={idx} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {match.matchingProducts.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{match.matchingProducts.length - 2}
                                    </Badge>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No products</Text>
                              )}
                            </Td>
                            <Td>{new Date(match.createdAt).toLocaleDateString()}</Td>
                            <Td>
                              <VStack spacing={1} align="stretch">
                                <Button 
                                  size="xs" 
                                  leftIcon={<ViewIcon />} 
                                  onClick={() => handleViewMatch(match)}
                                  width="100%"
                                >
                                  Details
                                </Button>
                                <Button
                                  size="xs"
                                  leftIcon={<DeleteIcon />}
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => deleteSavedMatch(match._id)}
                                  width="100%"
                                >
                                  Remove
                                </Button>
                              </VStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Lead International Tab */}
            <TabPanel>
              <Box overflowX="auto">
                <Flex
                  mb={4}
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Text fontWeight="bold">
                    Lead International Records ({filteredLeadInternationalRows.length})
                  </Text>
                  <HStack spacing={2}>
                    <Select
                      size="sm"
                      width="130px"
                      value={leadCategory}
                      onChange={(event) => setLeadCategory(event.target.value)}
                      aria-label="Lead international category"
                    >
                      <option value="All">All</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </Select>

                    <Menu closeOnSelect={false}>
                      <MenuButton as={Button} size="sm" variant="outline">
                        Column Attributes
                      </MenuButton>
                      <MenuList maxH="300px" overflowY="auto">
                        {LEAD_INTERNATIONAL_COLUMNS.map((column) => (
                          <MenuItem key={`lead-col-tab-${column}`} closeOnSelect={false}>
                            <Checkbox
                              isChecked={!!leadColumnVisibility[column]}
                              onChange={() => toggleLeadColumnVisibility(column)}
                            >
                              {column}
                            </Checkbox>
                          </MenuItem>
                        ))}
                        <MenuItem closeOnSelect={false}>
                          <Button size="xs" variant="ghost" onClick={showAllLeadColumns}>
                            Select All
                          </Button>
                        </MenuItem>
                      </MenuList>
                    </Menu>

                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => leadImportRef.current?.click()}
                      isLoading={isImportingLeadFile}
                      isDisabled={isImportingLeadFile}
                    >
                      Import Excel
                    </Button>

                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={handleOpenLeadAddModal}
                      leftIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </HStack>
                </Flex>

                {filteredLeadInternationalRows.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    height="200px"
                    textAlign="center"
                  >
                    <Text fontSize="lg" mb={3}>No lead international records found.</Text>
                    <Text color="gray.500">
                      Import an Excel file to load lead international data.
                    </Text>
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th minW="120px">Actions</Th>
                        {visibleLeadInternationalColumns.map((column) => (
                          <Th key={column}>{column}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredLeadInternationalRows.map((row, rowIndex) => (
                        <Tr key={row._id || row._rowKey || `lead-international-${rowIndex}`}>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit lead row"
                                icon={<EditIcon />}
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => handleOpenLeadEditModal(row)}
                              />
                              <IconButton
                                aria-label="Delete lead row"
                                icon={<DeleteIcon />}
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleOpenLeadDeleteModal(row)}
                              />
                            </HStack>
                          </Td>
                          {visibleLeadInternationalColumns.map((column) => (
                            <Td key={`${column}-${rowIndex}`}>{row[column] || '-'}</Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

            {/* Lead Local Tab */}
            <TabPanel>
              <Box overflowX="auto">
                <Flex
                  mb={4}
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Text fontWeight="bold">
                    Lead Local Records ({filteredLeadLocalRows.length})
                  </Text>
                  <HStack spacing={2}>
                    <Select
                      size="sm"
                      width="130px"
                      value={leadCategory}
                      onChange={(event) => setLeadCategory(event.target.value)}
                      aria-label="Lead local category"
                    >
                      <option value="All">All</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </Select>

                    <Menu closeOnSelect={false}>
                      <MenuButton as={Button} size="sm" variant="outline">
                        Column Attributes
                      </MenuButton>
                      <MenuList maxH="300px" overflowY="auto">
                        {LEAD_INTERNATIONAL_COLUMNS.map((column) => (
                          <MenuItem key={`lead-local-col-tab-${column}`} closeOnSelect={false}>
                            <Checkbox
                              isChecked={!!leadColumnVisibility[column]}
                              onChange={() => toggleLeadColumnVisibility(column)}
                            >
                              {column}
                            </Checkbox>
                          </MenuItem>
                        ))}
                        <MenuItem closeOnSelect={false}>
                          <Button size="xs" variant="ghost" onClick={showAllLeadColumns}>
                            Select All
                          </Button>
                        </MenuItem>
                      </MenuList>
                    </Menu>

                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => leadImportRef.current?.click()}
                      isLoading={isImportingLeadFile}
                      isDisabled={isImportingLeadFile}
                    >
                      Import Excel
                    </Button>

                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={handleOpenLeadAddModal}
                      leftIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </HStack>
                </Flex>

                {filteredLeadLocalRows.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    height="200px"
                    textAlign="center"
                  >
                    <Text fontSize="lg" mb={3}>No lead local records found.</Text>
                    <Text color="gray.500">
                      Import an Excel file to load lead local data.
                    </Text>
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th minW="120px">Actions</Th>
                        {visibleLeadInternationalColumns.map((column) => (
                          <Th key={`lead-local-${column}`}>{column}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredLeadLocalRows.map((row, rowIndex) => (
                        <Tr key={row._id || row._rowKey || `lead-local-${rowIndex}`}>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit lead local row"
                                icon={<EditIcon />}
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => handleOpenLeadEditModal(row)}
                              />
                              <IconButton
                                aria-label="Delete lead local row"
                                icon={<DeleteIcon />}
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleOpenLeadDeleteModal(row)}
                              />
                            </HStack>
                          </Td>
                          {visibleLeadInternationalColumns.map((column) => (
                            <Td key={`${column}-lead-local-${rowIndex}`}>{row[column] || '-'}</Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Lead International Add Modal */}
      <Modal isOpen={isLeadAddModalOpen} onClose={handleCloseLeadAddModal} size="5xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Lead International Row</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              display="grid"
              gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={4}
            >
              {LEAD_INTERNATIONAL_COLUMNS.map((column) => (
                <FormControl key={`lead-input-${column}`}>
                  <FormLabel>{column === 'UNIT_' ? 'UNIT' : column.replace(/_/g, ' ')}</FormLabel>
                  {column === 'LEAD_TYPE' ? (
                    <Select
                      placeholder="Select lead type"
                      value={newLeadInternationalRow[column] || ''}
                      onChange={(event) => handleLeadInternationalFieldChange(column, event.target.value)}
                    >
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  ) : column === 'ROLE' ? (
                    <Select
                      placeholder="Select role"
                      value={newLeadInternationalRow[column] || ''}
                      onChange={(event) => handleLeadInternationalFieldChange(column, event.target.value)}
                    >
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </Select>
                  ) : column === 'HSDSC' || column === 'COMERCIALDSC' ? (
                    <Textarea
                      value={newLeadInternationalRow[column] || ''}
                      onChange={(event) => handleLeadInternationalFieldChange(column, event.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={newLeadInternationalRow[column] || ''}
                      onChange={(event) => handleLeadInternationalFieldChange(column, event.target.value)}
                    />
                  )}
                </FormControl>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseLeadAddModal}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleAddLeadInternationalRow}
              isLoading={isSavingLeadInternationalRow}
            >
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lead International Edit Modal */}
      <Modal isOpen={isLeadEditModalOpen} onClose={handleCloseLeadEditModal} size="5xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Lead International Row</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              display="grid"
              gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={4}
            >
              {LEAD_INTERNATIONAL_COLUMNS.map((column) => (
                <FormControl key={`lead-edit-input-${column}`}>
                  <FormLabel>{column === 'UNIT_' ? 'UNIT' : column.replace(/_/g, ' ')}</FormLabel>
                  {column === 'LEAD_TYPE' ? (
                    <Select
                      placeholder="Select lead type"
                      value={editLeadInternationalRow[column] || ''}
                      onChange={(event) => handleEditLeadInternationalFieldChange(column, event.target.value)}
                    >
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  ) : column === 'ROLE' ? (
                    <Select
                      placeholder="Select role"
                      value={editLeadInternationalRow[column] || ''}
                      onChange={(event) => handleEditLeadInternationalFieldChange(column, event.target.value)}
                    >
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </Select>
                  ) : column === 'HSDSC' || column === 'COMERCIALDSC' ? (
                    <Textarea
                      value={editLeadInternationalRow[column] || ''}
                      onChange={(event) => handleEditLeadInternationalFieldChange(column, event.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={editLeadInternationalRow[column] || ''}
                      onChange={(event) => handleEditLeadInternationalFieldChange(column, event.target.value)}
                    />
                  )}
                </FormControl>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseLeadEditModal}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveLeadInternationalEdit}
              isLoading={isUpdatingLeadInternationalRow}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lead International Delete Modal */}
      <Modal isOpen={isLeadDeleteModalOpen} onClose={handleCloseLeadDeleteModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Lead Row</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete this lead row?
            </Text>
            {deletingLeadInternationalTarget?.BUYER ? (
              <Text mt={2} fontSize="sm" color="gray.500">
                Buyer: {deletingLeadInternationalTarget.BUYER}
              </Text>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseLeadDeleteModal}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleConfirmLeadDelete}
              isLoading={isDeletingLeadInternationalRow}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Buyer Form Drawer */}
      <Drawer isOpen={isBuyerDrawerOpen} placement="right" size="md" onClose={onBuyerDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedItem ? 'Edit Buyer' : 'Add New Buyer'}</DrawerHeader>
          <DrawerBody>
            <BuyerForm 
              initialData={selectedItem} 
              onSuccess={() => {
                fetchData();
                onBuyerDrawerClose();
              }} 
            />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onBuyerDrawerClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Seller Form Drawer */}
      <Drawer isOpen={isSellerDrawerOpen} placement="right" size="md" onClose={onSellerDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedItem ? 'Edit Seller' : 'Add New Seller'}</DrawerHeader>
          <DrawerBody>
            <SellerForm 
              initialData={selectedItem} 
              onSuccess={() => {
                fetchData();
                onSellerDrawerClose();
              }} 
            />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onSellerDrawerClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Detail View Modal (for customers and matches) */}
      <Modal isOpen={isDetailModalOpen} onClose={onDetailModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="80%">
          <ModalHeader>
            {detailViewType === 'match' ? 'Match Details' : 
             detailViewType === 'buyer' ? 'Buyer Details' : 'Seller Details'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedItem && detailViewType === 'match' ? (
              <MatchDetails 
                match={selectedItem} 
                onBack={onDetailModalClose} 
                onSaveMatch={saveMatch}
                isMatchSaved={isMatchSaved(selectedItem)}
                savedBy={savedBy}
              />
            ) : selectedItem && (detailViewType === 'buyer' || detailViewType === 'seller') ? (
              <CustomerDetails 
                customer={selectedItem} 
                customerType={detailViewType}
                onBack={onDetailModalClose} 
                onEdit={detailViewType === 'buyer' ? handleEditBuyer : handleEditSeller}
              />
            ) : (
              <Text>No details available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDetailModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default B2BDashboard;

