import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Text,
  Badge,
  useColorModeValue,
  Flex,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Spinner,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiSearch, FiDollarSign, FiEdit2, FiCalendar, FiFilter, FiChevronDown, FiDownload, FiUserCheck, FiUpload } from 'react-icons/fi';
import { getAllSales, getAllAgents, updateSupervisorComment, importSales } from '../../../../services/salesManagerService';
import { assignCustomerToAgent } from '../../../../services/salesWorkflowService';
import * as XLSX from 'xlsx';

const AllSalesPage = () => {
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [supervisorComment, setSupervisorComment] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentModalSale, setAgentModalSale] = useState(null);
  const [agentSelection, setAgentSelection] = useState('');
  const [agentAssigning, setAgentAssigning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    agent: '',
    dateRange: '',
    dateFrom: '',
    dateTo: ''
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRangeType, setDateRangeType] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [queryParams, setQueryParams] = useState({});
  const fileInputRef = useRef(null);

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch all sales and agents
  useEffect(() => {
    // Add a small delay to ensure auth is properly set up
    const timer = setTimeout(() => {
      fetchData(queryParams);
      fetchAgents();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [page, pageSize, queryParams]);

  const fetchData = async (filterParams = queryParams) => {
    setLoading(true);
    try {
      // Prepare filters for API call
      const apiFilters = {
        page,
        limit: pageSize,
        ...filterParams
      };
      // If statusFilter is set and not 'All', pass it to backend
      if (filterParams.status !== undefined) {
        // already provided explicitly
      } else if (statusFilter && statusFilter !== 'All') {
        apiFilters.status = statusFilter;
      }
      
      const data = await getAllSales(apiFilters);
      // Support both new (paginated object) and legacy array responses
      const rows = Array.isArray(data) ? data : data?.data || [];
      setCustomers(rows);
      setFilteredCustomers(rows);
      if (!Array.isArray(data)) {
        setTotal(data?.total || rows.length);
        setTotalPages(Math.max(1, data?.totalPages || 1));
      } else {
        setTotal(rows.length);
        setTotalPages(1);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await getAllAgents();
      setAgents(data);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast({
        title: "Error fetching agents",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resolveAgentId = (sale) => {
    if (!sale) return '';
    if (typeof sale.agentId === 'object' && sale.agentId?._id) {
      return sale.agentId._id;
    }
    return sale.agentId || '';
  };

  const openAgentModal = (sale) => {
    setAgentModalSale(sale);
    setAgentSelection(resolveAgentId(sale));
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!agentModalSale) return;
    if (!agentSelection) {
      toast({
        title: 'Agent required',
        description: 'Please select an agent before saving.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setAgentAssigning(true);
    try {
      await assignCustomerToAgent(agentModalSale._id, agentSelection);
      toast({
        title: 'Agent updated',
        description: 'Customer assignment has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchData();
      setIsAgentModalOpen(false);
      setAgentModalSale(null);
      setAgentSelection('');
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Unable to change the agent.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setAgentAssigning(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    // Build server-side filters
    const serverFilters = {};

    if (filters.agent) {
      serverFilters.agentId = filters.agent;
    }

    if (statusFilter && statusFilter !== 'All') {
      serverFilters.status = statusFilter;
    }

    // Date range handling
    if (dateRangeType !== 'all') {
      if (dateRangeType === 'custom') {
        if (filters.dateFrom) serverFilters.dateFrom = filters.dateFrom;
        if (filters.dateTo) serverFilters.dateTo = filters.dateTo;
      } else {
        const now = new Date();
        let fromDate = new Date();
        switch (dateRangeType) {
          case 'today':
            fromDate.setHours(0, 0, 0, 0);
            break;
          case 'yesterday':
            fromDate.setDate(now.getDate() - 1);
            fromDate.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 1);
            now.setHours(23, 59, 59, 999);
            break;
          case 'week':
            fromDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            fromDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            fromDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
        serverFilters.dateFrom = fromDate.toISOString();
        serverFilters.dateTo = now.toISOString();
      }
    }

    // Persist filters for pagination and fetch fresh data (page reset)
    setQueryParams(serverFilters);
    setPage(1);

    // Client-side search applied on current page data after fetch
    setTimeout(() => {
      let result = [...customers];
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter(customer => 
          (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm)) ||
          (customer.phone && customer.phone.toLowerCase().includes(searchTerm))
        );
      }
      setFilteredCustomers(result);
    }, 0);
  };

  // Re-apply client-side search when data or search term changes
  useEffect(() => {
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const result = customers.filter(customer =>
        (customer.customerName && customer.customerName.toLowerCase().includes(term)) ||
        (customer.phone && customer.phone.toLowerCase().includes(term))
      );
      setFilteredCustomers(result);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, filters.search]);

  // Keep current page within bounds when total pages change
  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [totalPages]);

  const handleDateRangeChange = (rangeType) => {
    setDateRangeType(rangeType);
    if (rangeType !== 'custom') {
      setFilters(prev => ({
        ...prev,
        dateFrom: '',
        dateTo: ''
      }));
    }
  };

  const applyCustomDateFilter = () => {
    applyFilters();
  };

  // Apply filters when they change (server filters + search)
  useEffect(() => {
    applyFilters();
  }, [filters, statusFilter, dateRangeType]);

  const openEditModal = (sale) => {
    setCurrentSale(sale);
    setSupervisorComment(sale.supervisorComment || '');
    setIsEditModalOpen(true);
  };

  const handleSaveComment = async () => {
    try {
      await updateSupervisorComment(currentSale._id, supervisorComment);
      // Update the local state
      setCustomers(prev => 
        prev.map(customer => 
          customer._id === currentSale._id 
            ? { ...customer, supervisorComment } 
            : customer
        )
      );
      setFilteredCustomers(prev => 
        prev.map(customer => 
          customer._id === currentSale._id 
            ? { ...customer, supervisorComment } 
            : customer
        )
      );
      setIsEditModalOpen(false);
      toast({
        title: "Comment updated",
        description: "Supervisor comment has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error updating comment",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredCustomers.map(customer => ({
        'Customer Name': customer.customerName || 'N/A',
        'Phone': customer.phone || 'N/A',
        'Training/Contact Title': customer.contactTitle || customer.note || '—',
        'Agent': (customer.agentId && typeof customer.agentId === 'object' && (customer.agentId.fullName || customer.agentId.username)) || (typeof customer.agentId === 'string' && customer.agentId) || 'N/A',
        'Date': formatDate(customer.date),
        'Course Price': formatCurrency(customer.coursePrice),
        'Commission': formatCurrency(customer.commission?.netCommission),
        'Status': customer.followupStatus || 'N/A',
        'Supervisor Comment': customer.supervisorComment || ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Adjust column widths
      const colWidths = [
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Training/Contact Title
        { wch: 20 }, // Agent
        { wch: 15 }, // Date
        { wch: 15 }, // Course Price
        { wch: 15 }, // Commission
        { wch: 15 }, // Status
        { wch: 30 }  // Supervisor Comment
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'All Sales');

      // Export file
      XLSX.writeFile(wb, 'sales_report.xlsx');

      toast({
        title: "Export successful",
        description: "Sales data has been exported to Excel",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export sales data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const parseImportedDate = (value) => {
    if (!value) {
      return new Date().toISOString();
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return new Date(parsed.y, parsed.m - 1, parsed.d).toISOString();
      }
    }
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString();
    }
    return new Date().toISOString();
  };

  const parseImportedCurrency = (value) => {
    if (typeof value === 'number') {
      return value;
    }
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const normalizeImportedRow = (row) => ({
    customerName: row['Customer Name'] || row.Customer || row.customerName || '',
    phone: row.Phone || row.phone || '',
    contactTitle: row['Training/Contact Title'] || row.Training || row.contactTitle || row.note || '',
    agentId: row.Agent || row.agentId || '',
    date: parseImportedDate(row.Date || row.date),
    coursePrice: parseImportedCurrency(row['Course Price'] || row.coursePrice),
    followupStatus: row.Status || row.followupStatus || 'Imported',
    supervisorComment: row['Supervisor Comment'] || row.supervisorComment || ''
  });

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error('No sheet found in the file.');
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      if (!rows.length) {
        toast({
          title: 'No rows found',
          description: 'The selected file does not contain any rows to import.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      setIsImporting(true);
      const imported = rows.map((row) => normalizeImportedRow(row));
      const response = await importSales(imported);
      await fetchData();
      toast({
        title: 'Import complete',
        description: `Imported ${response?.importedCount ?? imported.length} row(s).`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Unable to import the selected file.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };
  if (loading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" />
        <Text ml={4}>Loading sales data...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Text color="red.500">Error: {error}</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }} 
        mb={{ base: 4, md: 6 }} 
        gap={{ base: 3, md: 4 }}
      >
        <Heading as="h1" size={{ base: 'md', md: 'lg' }} color={headerColor}>
          All Sales
        </Heading>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FiUpload />}
            onClick={() => fileInputRef.current?.click()}
            colorScheme="blue"
            size="sm"
            variant="outline"
            isLoading={isImporting}
            isDisabled={isImporting}
          >
            Import
          </Button>
          <Button
            leftIcon={<FiDownload />}
            onClick={exportToExcel}
            colorScheme="teal"
            size="sm"
            variant="solid"
          >
            Export to Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </HStack>
      </Flex>
      
      {/* Status Tabs */}
      <Tabs variant="soft-rounded" colorScheme="teal" mb={4} size="sm" index={['All','Completed','Pending','Prospect','Scheduled','Cancelled'].indexOf(statusFilter)} onChange={(i) => setStatusFilter(['All','Completed','Pending','Prospect','Scheduled','Cancelled'][i])}>
        <TabList>
          <Tab px={3} py={1}>All</Tab>
          <Tab px={3} py={1}>Completed</Tab>
          <Tab px={3} py={1}>Pending</Tab>
          <Tab px={3} py={1}>Prospect</Tab>
          <Tab px={3} py={1}>Scheduled</Tab>
          <Tab px={3} py={1}>Cancelled</Tab>
        </TabList>
      </Tabs>
      
      {/* Filters */}
      <Card mb={{ base: 4, md: 6 }} bg={cardBg} borderWidth="1px" borderColor={borderColor} p={{ base: 3, md: 4 }} boxShadow="sm">
        <CardBody p={0}>
          <VStack spacing={{ base: 2, md: 3 }} align="stretch">
            <Flex wrap="wrap" gap={{ base: 2, md: 3 }}>
              {/* Search */}
              <InputGroup width={{ base: "100%", md: "250px" }} size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.300" boxSize="4" />
                </InputLeftElement>
                <Input
                  placeholder="Search customers..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  size="sm"
                />
              </InputGroup>
              
              {/* Agent Filter */}
              <Select
                placeholder="All Agents"
                width={{ base: "100%", md: "180px" }}
                value={filters.agent}
                onChange={(e) => handleFilterChange('agent', e.target.value)}
                size="sm"
              >
                {agents.map(agent => (
                  <option key={agent._id} value={agent._id}>
                    {agent.fullName || agent.username}
                  </option>
                ))}
              </Select>
              
              {/* Date Range Filter */}
              <Menu>
                <MenuButton as={Button} rightIcon={<FiChevronDown />} width={{ base: "100%", md: "180px" }} size="sm" variant="outline">
                  {dateRangeType === 'today' && 'Today'}
                  {dateRangeType === 'week' && 'This Week'}
                  {dateRangeType === 'month' && 'This Month'}
                  {dateRangeType === 'year' && 'This Year'}
                  {dateRangeType === 'custom' && 'Custom Range'}
                  {dateRangeType === 'all' && 'All Time'}
                </MenuButton>
                <MenuList fontSize="sm">
                  <MenuItem onClick={() => handleDateRangeChange('all')}>All Time</MenuItem>
                  <MenuItem onClick={() => handleDateRangeChange('today')}>Today</MenuItem>
                  <MenuItem onClick={() => handleDateRangeChange('week')}>This Week</MenuItem>
                  <MenuItem onClick={() => handleDateRangeChange('month')}>This Month</MenuItem>
                  <MenuItem onClick={() => handleDateRangeChange('year')}>This Year</MenuItem>
                  <MenuItem onClick={() => handleDateRangeChange('custom')}>Custom Range</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
            
            {/* Custom Date Range */}
            {dateRangeType === 'custom' && (
              <Flex wrap="wrap" gap={{ base: 2, md: 3 }}>
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  width={{ base: "100%", md: "130px" }}
                  size="sm"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  width={{ base: "100%", md: "130px" }}
                  size="sm"
                />
                <Button onClick={applyCustomDateFilter} colorScheme="teal" size="sm">
                  Apply
                </Button>
              </Flex>
            )}
          </VStack>
        </CardBody>
      </Card>
      
      {/* Results Count */}
      <Text mb={{ base: 3, md: 4 }} fontSize="sm" color="gray.500">
        Showing {filteredCustomers.length} of {customers.length} sales
      </Text>
      
      {/* Sales Table */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
        <CardBody p={{ base: 2, md: 3 }}>
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: "sm", md: "sm" }}>
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Phone</Th>
                  <Th>Training</Th>
                  <Th>Agent</Th>
                  <Th>Date</Th>
                  <Th isNumeric>Course Price</Th>
                  <Th isNumeric>Commission</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
              {filteredCustomers.length === 0 ? (
                <Tr>
                  <Td colSpan={9} textAlign="center">
                    No sales found matching your criteria
                  </Td>
                </Tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <Tr key={customer._id} _hover={{ bg: rowHoverBg }}>
                    <Td>
                      <Text fontWeight="semibold" fontSize="sm">{customer.customerName}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{customer.phone || 'N/A'}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" maxW="150px" isTruncated title={customer.contactTitle || customer.note || '—'}>{customer.contactTitle || customer.note || '—'}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" maxW="120px" isTruncated title={(customer.agentId && typeof customer.agentId === 'object' && (customer.agentId.fullName || customer.agentId.username)) || (typeof customer.agentId === 'string' && customer.agentId) || 'N/A'}>{(customer.agentId && typeof customer.agentId === 'object' && (customer.agentId.fullName || customer.agentId.username)) || (typeof customer.agentId === 'string' && customer.agentId) || 'N/A'}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{formatDate(customer.date)}</Text>
                    </Td>
                    <Td isNumeric>
                      <Text fontSize="sm" fontWeight="medium">{formatCurrency(customer.coursePrice)}</Text>
                    </Td>
                    <Td isNumeric>
                      <Text fontSize="sm" fontWeight="medium">{formatCurrency(customer.commission?.netCommission)}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={customer.followupStatus === 'Completed' ? 'green' : customer.followupStatus === 'Pending' ? 'yellow' : customer.followupStatus === 'Cancelled' ? 'red' : 'blue'} fontSize="xs" px={2} py={1}>
                        {customer.followupStatus}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Edit Supervisor Comment">
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            onClick={() => openEditModal(customer)}
                            variant="ghost"
                            colorScheme="teal"
                          />
                        </Tooltip>
                        <Tooltip label="Change assigned agent">
                          <IconButton
                            icon={<FiUserCheck />}
                            size="sm"
                            onClick={() => openAgentModal(customer)}
                            variant="ghost"
                            colorScheme="blue"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Pagination */}
      <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={3}>
        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.600">
            Page {page} of {totalPages} • {total} records
          </Text>
          <Select
            size="sm"
            width="120px"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[20, 50, 100, 200].map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </Select>
        </HStack>
        <HStack spacing={2}>
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            isDisabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            isDisabled={page >= totalPages}
          >
            Next
          </Button>
        </HStack>
      </Flex>
      
      {/* Edit Supervisor Comment Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Supervisor Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Customer: {currentSale?.customerName}</FormLabel>
              <FormLabel>Agent: {(currentSale?.agentId && typeof currentSale?.agentId === 'object' && (currentSale?.agentId.fullName || currentSale?.agentId.username)) || (typeof currentSale?.agentId === 'string' && currentSale?.agentId) || 'N/A'}</FormLabel>
              <FormLabel mt={4}>Supervisor Comment</FormLabel>
              <Textarea
                value={supervisorComment}
                onChange={(e) => setSupervisorComment(e.target.value)}
                placeholder="Enter supervisor comment..."
                rows={5}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveComment}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isAgentModalOpen} onClose={() => { setIsAgentModalOpen(false); setAgentModalSale(null); setAgentSelection(''); }} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Assigned Agent</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Customer</FormLabel>
              <Text fontWeight="bold" mb={3}>
                {agentModalSale?.customerName || 'Unknown customer'}
              </Text>
              <FormLabel>Agent</FormLabel>
              <Select
                placeholder="Select agent"
                value={agentSelection}
                onChange={(e) => setAgentSelection(e.target.value)}
              >
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.fullName || agent.username || agent._id}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsAgentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveAgent}
              isLoading={agentAssigning}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AllSalesPage;
