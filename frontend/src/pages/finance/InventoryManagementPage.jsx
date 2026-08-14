import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  IconButton,
  Badge,
  Spinner,
  InputGroup,
  InputLeftElement,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Progress,
  Grid,
  GridItem,
  HStack,
  VStack,
  Tooltip,
  Switch,
  Tag,
  TagLabel,
  TagCloseButton,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  DownloadIcon, 
  CalendarIcon, 
  InfoIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import axios from '../../services/axiosInstance';

const InventoryManagementPage = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    bufferStock: '',
    reservedBuffer: '',
    unit: '',
    sku: '',
    supplier: ''
  });
  const [adjustmentData, setAdjustmentData] = useState({
    itemId: '',
    quantity: 0,
    reason: ''
  });
  const [bufferAdjustmentData, setBufferAdjustmentData] = useState({
    itemId: '',
    bufferQuantity: 0,
    reserveQuantity: 0
  });
  const [deliveryData, setDeliveryData] = useState({
    itemId: '',
    quantity: 0,
    fromBuffer: false
  });
  const [isBufferAdjusting, setIsBufferAdjusting] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [selectedItems, setSelectedItems] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAdjustmentOpen, onOpen: onAdjustmentOpen, onClose: onAdjustmentClose } = useDisclosure();
  const { isOpen: isBufferAdjustmentOpen, onOpen: onBufferAdjustmentOpen, onClose: onBufferAdjustmentClose } = useDisclosure();
  const { isOpen: isDeliveryOpen, onOpen: onDeliveryOpen, onClose: onDeliveryClose } = useDisclosure();
  const toast = useToast();

  // Test authentication
  const testAuth = async () => {
    try {
      console.log('Testing authentication...');
      const token = localStorage.getItem('userToken');
      console.log('Token from localStorage:', token);
      
      if (!token) {
        console.log('No token found in localStorage');
        return;
      }
      
      // Test direct fetch
      const response = await fetch('/api/test-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('Auth test response:', data);
    } catch (err) {
      console.error('Auth test error:', err);
    }
  };

  // Fetch stock items on component mount
  useEffect(() => {
    fetchStockItems();
  }, []);

  // Fetch stock items
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching stock items...');
      
      // Check if token exists
      const token = localStorage.getItem('userToken');
      console.log('Token exists:', !!token);
      if (token) {
        console.log('Token length:', token.length);
      }
      
      const response = await axios.get(`/stock`);
      console.log('Stock items fetched successfully:', response.data);
      setStockItems(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      setCategories(uniqueCategories);
      
      // Extract unique suppliers
      const uniqueSuppliers = [...new Set(response.data.map(item => item.supplier).filter(Boolean))];
      setSuppliers(uniqueSuppliers);
    } catch (err) {
      console.error('Error fetching stock items:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      setError('Failed to fetch stock items');
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stock items';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle adjustment form input changes
  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentData({
      ...adjustmentData,
      [name]: value
    });
  };

  // Handle buffer adjustment form input changes
  const handleBufferAdjustmentChange = (e) => {
    const { name, value } = e.target;
    // Convert to number for numeric fields
    const numericFields = ['bufferQuantity', 'reserveQuantity'];
    const processedValue = numericFields.includes(name) ? (value === '' ? '' : Number(value)) : value;
    
    setBufferAdjustmentData({
      ...bufferAdjustmentData,
      [name]: processedValue
    });
  };

  // Handle quantity adjustment
  const handleQuantityAdjustment = async (e) => {
    e.preventDefault();
    
    try {
      // Validate input
      const newQuantity = Number(adjustmentData.quantity);
      if (isNaN(newQuantity) || newQuantity < 0) {
        throw new Error('Invalid quantity. Must be a non-negative number.');
      }
      
      // Update stock quantity
      await axios.put(`/stock/${adjustmentData.itemId}/quantity`, {
        quantity: newQuantity
      });
      
      toast({
        title: 'Success',
        description: 'Stock quantity updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reset form and refresh data
      setAdjustmentData({
        itemId: '',
        quantity: 0,
        reason: ''
      });
      setIsAdjusting(false);
      onAdjustmentClose();
      fetchStockItems();
    } catch (err) {
      console.error('Quantity adjustment error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update stock quantity';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.price || !formData.quantity || !formData.unit || !formData.sku) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate numeric fields
      const price = Number(formData.price);
      const quantity = Number(formData.quantity);
      const bufferStock = formData.bufferStock ? Number(formData.bufferStock) : 0;
      const reservedBuffer = formData.reservedBuffer ? Number(formData.reservedBuffer) : 0;
      
      if (isNaN(price) || isNaN(quantity) || isNaN(bufferStock) || isNaN(reservedBuffer)) {
        throw new Error('Invalid numeric values provided');
      }
      
      if (price < 0 || quantity < 0 || bufferStock < 0 || reservedBuffer < 0) {
        throw new Error('Numeric values must be non-negative');
      }
      
      const stockData = {
        ...formData,
        price,
        quantity,
        bufferStock,
        reservedBuffer
      };
      
      if (isEditing) {
        // Update existing stock item
        await axios.put(`/stock/${currentItemId}`, stockData);
        toast({
          title: 'Success',
          description: 'Stock item updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new stock item
        await axios.post(`/stock`, stockData);
        toast({
          title: 'Success',
          description: 'Stock item created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      
      // Reset form and refresh data
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        bufferStock: '',
        reservedBuffer: '',
        unit: '',
        sku: '',
        supplier: ''
      });
      setIsEditing(false);
      setCurrentItemId(null);
      onClose();
      fetchStockItems();
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save stock item';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle buffer stock update
  const handleUpdateBufferStock = async (itemId, bufferQuantity) => {
    try {
      console.log('Updating buffer stock:', { itemId, bufferQuantity });
      
      // Validate input
      const bufferQty = Number(bufferQuantity);
      if (isNaN(bufferQty) || bufferQty < 0) {
        throw new Error('Invalid buffer stock quantity. Must be a non-negative number.');
      }
      
      const response = await axios.put(`/stock/${itemId}/buffer`, {
        bufferStock: bufferQty
      });
      
      toast({
        title: 'Success',
        description: 'Buffer stock updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchStockItems();
      return response.data;
    } catch (err) {
      console.error('Buffer stock update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update buffer stock';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      throw err;
    }
  };

  // Handle reserve buffer stock
  const handleReserveBufferStock = async (itemId, reserveQuantity) => {
    try {
      // Validate input
      const reserveQty = Number(reserveQuantity);
      if (isNaN(reserveQty) || reserveQty < 0) {
        throw new Error('Invalid reserve quantity. Must be a non-negative number.');
      }
      
      const response = await axios.put(`/stock/${itemId}/reserve-buffer`, {
        quantity: reserveQty
      });
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchStockItems();
    } catch (err) {
      console.error('Reserve buffer stock error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reserve buffer stock';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle deliver stock
  const handleDeliverStock = async (itemId, deliverQuantity, fromBuffer = false) => {
    try {
      // Validate input
      const deliverQty = Number(deliverQuantity);
      if (isNaN(deliverQty) || deliverQty <= 0) {
        throw new Error('Invalid delivery quantity. Must be a positive number.');
      }
      
      const response = await axios.put(`/stock/${itemId}/deliver`, {
        quantity: deliverQty,
        fromBuffer
      });
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchStockItems();
    } catch (err) {
      console.error('Deliver stock error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to deliver stock';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle delivery form input changes
  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeliveryData({
      ...deliveryData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle stock delivery action
  const handleDeliverStockAction = (item) => {
    setDeliveryData({
      itemId: item._id,
      quantity: 1,
      fromBuffer: false
    });
    setIsDelivering(true);
    onDeliveryOpen();
  };

  // Handle release buffer stock
  const handleReleaseBufferStock = async (itemId, releaseQuantity) => {
    try {
      // Validate input
      const releaseQty = Number(releaseQuantity);
      if (isNaN(releaseQty) || releaseQty <= 0) {
        throw new Error('Invalid release quantity. Must be a positive number.');
      }
      
      const response = await axios.put(`/stock/${itemId}/release-buffer`, {
        quantity: releaseQty
      });
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchStockItems();
    } catch (err) {
      console.error('Release buffer stock error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to release buffer stock';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle edit action
  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      bufferStock: item.bufferStock || '', // Add buffer stock field
      reservedBuffer: item.reservedBuffer || '', // Add reserved buffer field
      unit: item.unit,
      sku: item.sku,
      supplier: item.supplier || ''
    });
    setIsEditing(true);
    setCurrentItemId(item._id);
    onOpen();
  };

  // Handle stock adjustment action
  const handleAdjustStock = (item) => {
    setAdjustmentData({
      itemId: item._id,
      quantity: item.quantity,
      reason: ''
    });
    setIsAdjusting(true);
    onAdjustmentOpen();
  };

  // Handle buffer stock adjustment action
  const handleAdjustBufferStock = (item) => {
    setBufferAdjustmentData({
      itemId: item._id,
      bufferQuantity: item.bufferStock || 0,
      reserveQuantity: item.reservedBuffer || 0
    });
    setIsBufferAdjusting(true);
    onBufferAdjustmentOpen();
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        await axios.delete(`/stock/${id}`);
        toast({
          title: 'Success',
          description: 'Stock item deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        fetchStockItems();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete stock item',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Open modal for new item
  const handleAddNewItem = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      quantity: '',
      unit: '',
      sku: '',
      supplier: ''
    });
    setIsEditing(false);
    setCurrentItemId(null);
    onOpen();
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredStockItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredStockItems.map(item => item._id));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      try {
        // Delete all selected items
        await Promise.all(selectedItems.map(id => 
          axios.delete(`/stock/${id}`)
        ));
        
        toast({
          title: 'Success',
          description: `${selectedItems.length} items deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        
        setSelectedItems([]);
        fetchStockItems();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete items',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Sort items
  const sortItems = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort stock items
  const filteredStockItems = stockItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle special cases
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Calculate inventory statistics
  const totalItems = stockItems.length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = stockItems.filter(item => item.quantity < 10).length;
  const outOfStockItems = stockItems.filter(item => item.quantity === 0).length;
  const totalCategories = categories.length;
  const totalSuppliers = suppliers.length;

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box py={2} px={3}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h2" size="md">Stock Inventory</Heading>
        <HStack spacing={2}>
          <Button 
            size="sm"
            leftIcon={<RepeatIcon />} 
            colorScheme="blue" 
            variant="outline"
            onClick={fetchStockItems}
          >
            Refresh
          </Button>
          <Button 
            size="sm"
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={handleAddNewItem}
          >
            Add New Item
          </Button>
        </HStack>
      </Flex>

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={2} mb={4}>
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Total Items</StatLabel>
              <StatNumber fontSize="md">{totalItems}</StatNumber>
              <StatHelpText fontSize="2xs">Stock items</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Total Value</StatLabel>
              <StatNumber fontSize="md">ETB {totalValue.toLocaleString()}</StatNumber>
              <StatHelpText fontSize="2xs">Inventory worth</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Categories</StatLabel>
              <StatNumber fontSize="md">{totalCategories}</StatNumber>
              <StatHelpText fontSize="2xs">Product types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Suppliers</StatLabel>
              <StatNumber fontSize="md">{totalSuppliers}</StatNumber>
              <StatHelpText fontSize="2xs">Partners</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Low Stock</StatLabel>
              <StatNumber fontSize="md" color="orange.500">{lowStockItems}</StatNumber>
              <StatHelpText fontSize="2xs">Under 10 units</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Out of Stock</StatLabel>
              <StatNumber fontSize="md" color="red.500">{outOfStockItems}</StatNumber>
              <StatHelpText fontSize="2xs">No inventory</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Controls */}
      <Card size="sm" mb={4}>
        <CardBody py={2} px={3}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={2} wrap="wrap">
            <InputGroup flex={{ base: '1', md: '2' }} size="sm">
              <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' boxSize={4} />
              </InputLeftElement>
              <Input
                size="sm"
                placeholder="Search by name, SKU, description, or supplier"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              size="sm"
              placeholder="Filter by category" 
              flex="1"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </Select>
            
            <Select 
              size="sm"
              placeholder="Sort by" 
              flex="1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
              <option value="createdAt">Date Added</option>
            </Select>
            
            <Button 
              size="sm"
              leftIcon={sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />} 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
            
            <Button 
              size="sm"
              colorScheme="red" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
            >
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <Card size="sm" mb={3} bg="blue.50" borderColor="blue.200" borderWidth="1px">
          <CardBody py={2} px={3}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="bold" color="blue.800">
                {selectedItems.length} item(s) selected
              </Text>
              <HStack spacing={2}>
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  leftIcon={<DeleteIcon />} 
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Stock Items Table */}
      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading as="h3" size="sm">Stock Inventory</Heading>
            <HStack>
              <Text fontSize="sm" color="gray.500">
                {filteredStockItems.length} items
              </Text>
              <Switch 
                isChecked={viewMode === 'grid'} 
                onChange={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              />
              <Text fontSize="sm">Grid View</Text>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {viewMode === 'table' ? (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th px={2} py={1}>
                      <Checkbox 
                        size="sm"
                        isChecked={selectedItems.length === filteredStockItems.length && filteredStockItems.length > 0}
                        isIndeterminate={selectedItems.length > 0 && selectedItems.length < filteredStockItems.length}
                        onChange={selectAllItems}
                      />
                    </Th>
                    <Th px={2} py={1} fontSize="xs">
                      <Button variant="ghost" size="xs" onClick={() => sortItems('sku')} rightIcon={sortBy === 'sku' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        SKU
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs">
                      <Button variant="ghost" size="xs" onClick={() => sortItems('name')} rightIcon={sortBy === 'name' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Name
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs">
                      <Button variant="ghost" size="xs" onClick={() => sortItems('category')} rightIcon={sortBy === 'category' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Category
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs" isNumeric>
                      <Button variant="ghost" size="xs" onClick={() => sortItems('price')} rightIcon={sortBy === 'price' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Price (ETB)
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs" isNumeric>
                      <Button variant="ghost" size="xs" onClick={() => sortItems('quantity')} rightIcon={sortBy === 'quantity' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Available
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs" isNumeric>
                      <Button variant="ghost" size="xs" onClick={() => sortItems('bufferStock')} rightIcon={sortBy === 'bufferStock' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Buffer
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs" isNumeric>
                      <Button variant="ghost" size="xs" onClick={() => sortItems('reservedBuffer')} rightIcon={sortBy === 'reservedBuffer' ? (sortOrder === 'asc' ? <ChevronUpIcon boxSize={3} /> : <ChevronDownIcon boxSize={3} />) : null}>
                        Reserved
                      </Button>
                    </Th>
                    <Th px={2} py={1} fontSize="xs">Unit</Th>
                    <Th px={2} py={1} fontSize="xs">Supplier</Th>
                    <Th px={2} py={1} fontSize="xs">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStockItems.length > 0 ? (
                    filteredStockItems.map((item) => (
                      <Tr key={item._id}>
                        <Td px={2} py={1}>
                          <Checkbox 
                            size="sm"
                            isChecked={selectedItems.includes(item._id)}
                            onChange={() => toggleItemSelection(item._id)}
                          />
                        </Td>
                        <Td px={2} py={1}>
                          <Text fontSize="xs" fontWeight="bold">{item.sku}</Text>
                        </Td>
                        <Td px={2} py={1}>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="medium">{item.name}</Text>
                            {item.description && (
                              <Tooltip label={item.description} hasArrow>
                                <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                  {item.description}
                                </Text>
                              </Tooltip>
                            )}
                          </VStack>
                        </Td>
                        <Td px={2} py={1}>
                          <Badge fontSize="2xs" colorScheme="teal">{item.category}</Badge>
                        </Td>
                        <Td px={2} py={1} isNumeric>
                          <Text fontSize="xs">{item.price.toLocaleString()}</Text>
                        </Td>
                        <Td px={2} py={1} isNumeric>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold">{item.quantity}</Text>
                            {item.quantity <= 5 && (
                              <Progress 
                                value={item.quantity} 
                                max={20} 
                                size="xs" 
                                colorScheme={item.quantity === 0 ? 'red' : item.quantity < 5 ? 'orange' : 'green'} 
                                width="60px" 
                                borderRadius="full" 
                              />
                            )}
                          </VStack>
                        </Td>
                        <Td px={2} py={1} isNumeric>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold" color={item.bufferStock > 0 ? "blue.500" : "gray.400"}>
                              {item.bufferStock}
                            </Text>
                            {item.bufferStock > 0 && (
                              <Text fontSize="2xs" color="blue.400">
                                On the way
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td px={2} py={1} isNumeric>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold" color={item.reservedBuffer > 0 ? "orange.500" : "gray.400"}>
                              {item.reservedBuffer}
                            </Text>
                            {item.reservedBuffer > 0 && item.bufferStock > 0 && (
                              <Text fontSize="2xs" color="orange.400">
                                {Math.round((item.reservedBuffer / item.bufferStock) * 100)}% reserved
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td px={2} py={1}>
                          <Text fontSize="xs">{item.unit}</Text>
                        </Td>
                        <Td px={2} py={1}>
                          {item.supplier ? (
                            <Tag size="sm" colorScheme="blue">
                              <TagLabel fontSize="2xs">{item.supplier}</TagLabel>
                            </Tag>
                          ) : (
                            <Text fontSize="2xs" color="gray.400">N/A</Text>
                          )}
                        </Td>
                        <Td px={2} py={1}>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Deliver items"
                              icon={<DownloadIcon />}
                              size="xs"
                              colorScheme="green"
                              onClick={() => handleDeliverStockAction(item)}
                            />
                            <IconButton
                              aria-label="Adjust stock"
                              icon={<RepeatIcon />}
                              size="xs"
                              colorScheme="yellow"
                              onClick={() => handleAdjustStock(item)}
                            />
                            <IconButton
                              aria-label="Adjust buffer stock"
                              icon={<DownloadIcon />}
                              size="xs"
                              colorScheme="blue"
                              onClick={() => handleAdjustBufferStock(item)}
                            />
                            <IconButton
                              aria-label="Edit item"
                              icon={<EditIcon />}
                              size="xs"
                              colorScheme="blue"
                              onClick={() => handleEdit(item)}
                            />
                            <IconButton
                              aria-label="Delete item"
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              onClick={() => handleDelete(item._id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={9} textAlign="center">
                        <VStack py={10}>
                          <InfoIcon boxSize={10} color="gray.300" />
                          <Text fontSize="lg" color="gray.500">No stock items found</Text>
                          <Text fontSize="sm" color="gray.400">Try adjusting your search or filter criteria</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            // Grid View
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
              {filteredStockItems.length > 0 ? (
                filteredStockItems.map((item) => (
                  <Card key={item._id} size="sm">
                    <CardBody py={2} px={3}>
                      <VStack align="start" spacing={2}>
                        <Flex justify="space-between" w="100%">
                          <Badge fontSize="2xs" colorScheme="teal">{item.category}</Badge>
                          <Badge fontSize="2xs" colorScheme={item.quantity === 0 ? 'red' : item.quantity < 10 ? 'orange' : 'green'}>
                            {item.quantity} available
                          </Badge>
                        </Flex>
                        <Heading size="xs" noOfLines={2}>{item.name}</Heading>
                        <Text fontSize="2xs" color="gray.500">SKU: {item.sku}</Text>
                        <Text fontSize="xs" fontWeight="bold" color="teal.600">ETB {item.price.toLocaleString()}</Text>
                        
                        {/* Buffer stock information */}
                        {item.bufferStock > 0 && (
                          <Flex justify="space-between" w="100%" bg="blue.50" p={1} borderRadius="md">
                            <Text fontSize="2xs">Buffer:</Text>
                            <Text fontSize="2xs" fontWeight="bold" color="blue.600">
                              {item.bufferStock} items
                            </Text>
                          </Flex>
                        )}
                        
                        {/* Reserved buffer information */}
                        {item.reservedBuffer > 0 && (
                          <Flex justify="space-between" w="100%" bg="orange.50" p={1} borderRadius="md">
                            <Text fontSize="2xs">Reserved:</Text>
                            <Text fontSize="2xs" fontWeight="bold" color="orange.600">
                              {item.reservedBuffer} items
                            </Text>
                          </Flex>
                        )}
                        
                        <Text fontSize="2xs">Unit: {item.unit}</Text>
                        {item.supplier && (
                          <Text fontSize="2xs">Supplier: {item.supplier}</Text>
                        )}
                        <HStack mt={1} spacing={1}>
                          <IconButton
                            aria-label="Deliver items"
                            icon={<DownloadIcon />}
                            size="xs"
                            colorScheme="green"
                            onClick={() => handleDeliverStockAction(item)}
                          />
                          <IconButton
                            aria-label="Adjust stock"
                            icon={<RepeatIcon />}
                            size="xs"
                            colorScheme="yellow"
                            onClick={() => handleAdjustStock(item)}
                          />
                          <IconButton
                            aria-label="Adjust buffer stock"
                            icon={<DownloadIcon />}
                            size="xs"
                            colorScheme="blue"
                            onClick={() => handleAdjustBufferStock(item)}
                          />
                          <IconButton
                            aria-label="Edit item"
                            icon={<EditIcon />}
                            size="xs"
                            colorScheme="blue"
                            onClick={() => handleEdit(item)}
                          />
                          <IconButton
                            aria-label="Delete item"
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleDelete(item._id)}
                          />
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <GridItem colSpan={4}>
                  <VStack py={10}>
                    <InfoIcon boxSize={10} color="gray.300" />
                    <Text fontSize="lg" color="gray.500">No stock items found</Text>
                    <Text fontSize="sm" color="gray.400">Try adjusting your search or filter criteria</Text>
                  </VStack>
                </GridItem>
              )}
            </Grid>
          )}
        </CardBody>
      </Card>

      {/* Delivery Modal */}
      <Modal isOpen={isDeliveryOpen} onClose={onDeliveryClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deliver Stock Items</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={(e) => {
            e.preventDefault();
            handleDeliverStock(deliveryData.itemId, deliveryData.quantity, deliveryData.fromBuffer);
            onDeliveryClose();
          }}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Quantity to Deliver</FormLabel>
                  <Input
                    name="quantity"
                    type="number"
                    min="1"
                    value={deliveryData.quantity}
                    onChange={handleDeliveryChange}
                    placeholder="Enter quantity"
                  />
                </FormControl>
                
                <FormControl>
                  <Checkbox
                    name="fromBuffer"
                    isChecked={deliveryData.fromBuffer}
                    onChange={handleDeliveryChange}
                  >
                    Deliver from Buffer Stock
                  </Checkbox>
                  <FormHelperText>
                    {deliveryData.fromBuffer 
                      ? "Items will be deducted from buffer stock" 
                      : "Items will be deducted from regular stock"}
                  </FormHelperText>
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDeliveryClose}>
                Cancel
              </Button>
              <Button colorScheme="green" type="submit">
                Deliver Items
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Buffer Stock Adjustment Modal */}
      <Modal isOpen={isBufferAdjustmentOpen} onClose={onBufferAdjustmentClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adjust Buffer Stock</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={(e) => {
            e.preventDefault();
            // Handle buffer stock update
            handleUpdateBufferStock(bufferAdjustmentData.itemId, bufferAdjustmentData.bufferQuantity);
            // Handle reserve buffer stock if needed
            if (bufferAdjustmentData.reserveQuantity > 0) {
              handleReserveBufferStock(bufferAdjustmentData.itemId, bufferAdjustmentData.reserveQuantity);
            }
            onBufferAdjustmentClose();
          }}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Buffer Stock Quantity</FormLabel>
                  <Input
                    name="bufferQuantity"
                    type="number"
                    value={bufferAdjustmentData.bufferQuantity}
                    onChange={handleBufferAdjustmentChange}
                    placeholder="Enter buffer stock quantity"
                  />
                  <FormHelperText>Number of items currently on their way being imported</FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Reserved from Buffer Stock</FormLabel>
                  <Input
                    name="reserveQuantity"
                    type="number"
                    value={bufferAdjustmentData.reserveQuantity}
                    onChange={handleBufferAdjustmentChange}
                    placeholder="Enter reserved quantity"
                  />
                  <FormHelperText>Number of items already reserved by customers</FormHelperText>
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onBufferAdjustmentClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit">
                Update Buffer Stock
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Stock Item' : 'Add New Stock Item'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Tabs>
                <TabList>
                  <Tab>Basic Information</Tab>
                  <Tab>Pricing & Inventory</Tab>
                  <Tab>Supplier Details</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Item Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter item name"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter item description"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Category</FormLabel>
                        <Input
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          placeholder="Enter category"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>SKU</FormLabel>
                        <Input
                          name="sku"
                          value={formData.sku}
                          onChange={handleInputChange}
                          placeholder="Enter SKU"
                          isDisabled={isEditing}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                  
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Price (ETB)</FormLabel>
                        <Input
                          name="price"
                          type="number"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Enter price"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Quantity</FormLabel>
                        <Input
                          name="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="Enter quantity"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Buffer Stock (Items on the way)</FormLabel>
                        <Input
                          name="bufferStock"
                          type="number"
                          value={formData.bufferStock || ''}
                          onChange={handleInputChange}
                          placeholder="Enter buffer stock quantity"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Unit</FormLabel>
                        <Input
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          placeholder="Enter unit (e.g., pieces, kg, liters)"
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                  
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Supplier</FormLabel>
                        <Input
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          placeholder="Enter supplier name"
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="teal" 
                type="submit"
                isDisabled={!formData.name || !formData.category || !formData.price || !formData.quantity || !formData.unit || !formData.sku}
              >
                {isEditing ? 'Update Item' : 'Add Item'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustmentOpen} onClose={onAdjustmentClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Adjust Stock Quantity
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleQuantityAdjustment}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>New Quantity</FormLabel>
                  <NumberInput
                    name="quantity"
                    value={adjustmentData.quantity}
                    onChange={(value) => setAdjustmentData({...adjustmentData, quantity: value})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Reason for Adjustment (Optional)</FormLabel>
                  <Input
                    name="reason"
                    value={adjustmentData.reason}
                    onChange={handleAdjustmentChange}
                    placeholder="Enter reason for adjustment"
                  />
                </FormControl>
                
                <Text fontSize="sm" color="gray.500">
                  Use this form to adjust the current stock quantity. This is useful for correcting inventory counts after physical counts or stock adjustments.
                </Text>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAdjustmentClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="yellow" 
                type="submit"
              >
                Update Quantity
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryManagementPage;