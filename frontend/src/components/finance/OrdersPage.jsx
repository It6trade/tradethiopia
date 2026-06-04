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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  Switch,
  HStack,
  VStack
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  CheckIcon, 
  CloseIcon,
  ChevronDownIcon,
  DownloadIcon,
  EmailIcon,
  ChevronUpIcon
} from '@chakra-ui/icons';
import axios from '../../services/axiosInstance';
import OrderDetailsDrawer from './OrderDetailsDrawer';

const OrdersPage = () => {
  // Financial Configuration
  const FINANCIAL_CONFIG = {
    VAT_RATE: 0.15, // 15% VAT
    WITHHOLDING_THRESHOLD: 10000, // 10,000 ETB threshold
    WITHHOLDING_RATE: 0.03, // 3% withholding tax
    PROFIT_MARGIN: 0.20 // 20% profit margin
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    paymentType: '',
    paymentAmount: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();

  // Fetch orders
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await axios.get(`/orders`);
      setOrders(ordersResponse.data);
    } catch (err) {
      setError('Failed to fetch orders');
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch order statistics
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalProfit: 0
  });

  const fetchOrderStats = async () => {
    try {
      const response = await axios.get(`/orders/stats`);
      setOrderStats(response.data);
    } catch (err) {
      console.error('Failed to fetch order stats');
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update order
        await axios.put(`/orders/${currentOrderId}`, {
          status: formData.status,
          notes: formData.notes,
          paymentType: formData.paymentType,
          paymentAmount: formData.paymentAmount
        });
        toast({
          title: 'Success',
          description: 'Order updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      
      // Reset form and refresh data
      setFormData({
        status: '',
        notes: '',
        paymentType: '',
        paymentAmount: ''
      });
      setIsEditing(false);
      setCurrentOrderId(null);
      onClose();
      fetchData();
      fetchOrderStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save order',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle edit action
  const handleEdit = (order) => {
    setFormData({
      status: order.status,
      notes: order.notes || '',
      paymentType: order.paymentType || '',
      paymentAmount: order.paymentAmount || ''
    });
    setIsEditing(true);
    setCurrentOrderId(order._id);
    onOpen();
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setCurrentOrderId(order._id);
    onViewOpen();
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/orders/${id}`);
        toast({
          title: 'Success',
          description: 'Order deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        fetchData();
        fetchOrderStats();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete order',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, status) => {
    try {
      // Find the order to check payment details
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        toast({
          title: 'Error',
          description: 'Order not found',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      // If trying to deliver the order, check if payment is complete
      if (status === 'Delivered') {
        const orderTotal = order.totalAmount || 0;
        const paymentAmount = order.paymentAmount || 0;
        
        // For any payment type, full payment must be made before delivery
        if (paymentAmount < orderTotal) {
          toast({
            title: 'Full Payment Required',
            description: `Full payment of ETB ${orderTotal.toLocaleString()} is required before delivery. Current payment: ETB ${paymentAmount.toLocaleString()}. Balance due: ETB ${(orderTotal - paymentAmount).toLocaleString()}`,
            status: 'warning',
            duration: 5000,
            isClosable: true
          });
          return;
        }
      }
      
      await axios.put(`/orders/${orderId}`, {
        status
      });
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchData();
      fetchOrderStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    const matchesPaymentStatus = selectedPaymentStatus ? 
      (selectedPaymentStatus === 'Paid' && order.paymentAmount >= order.totalAmount) ||
      (selectedPaymentStatus === 'Partial' && order.paymentAmount > 0 && order.paymentAmount < order.totalAmount) ||
      (selectedPaymentStatus === 'Unpaid' && (!order.paymentAmount || order.paymentAmount === 0)) : true;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Separate orders into processing (pending) and delivered
  const processingOrders = orders.filter(order => 
    order.status !== 'Delivered' && 
    order.status !== 'Cancelled'
  );

  const deliveredOrders = orders.filter(order => 
    order.status === 'Delivered'
  );

  // Apply filters to each group
  const filteredProcessingOrders = processingOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    const matchesPaymentStatus = selectedPaymentStatus ? 
      (selectedPaymentStatus === 'Paid' && order.paymentAmount >= order.totalAmount) ||
      (selectedPaymentStatus === 'Partial' && order.paymentAmount > 0 && order.paymentAmount < order.totalAmount) ||
      (selectedPaymentStatus === 'Unpaid' && (!order.paymentAmount || order.paymentAmount === 0)) : true;
    return matchesSearch && matchesStatus && matchesPaymentStatus && order.status !== 'Delivered' && order.status !== 'Cancelled';
  });

  const filteredDeliveredOrders = deliveredOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    const matchesPaymentStatus = selectedPaymentStatus ? 
      (selectedPaymentStatus === 'Paid' && order.paymentAmount >= order.totalAmount) ||
      (selectedPaymentStatus === 'Partial' && order.paymentAmount > 0 && order.paymentAmount < order.totalAmount) ||
      (selectedPaymentStatus === 'Unpaid' && (!order.paymentAmount || order.paymentAmount === 0)) : true;
    return matchesSearch && matchesStatus && matchesPaymentStatus && order.status === 'Delivered';
  });

  // Calculate order profit (now using actual payment amount)
  const calculateOrderProfit = (order) => {
    // Gross profit is the actual payment received from the customer
    return order.paymentAmount || 0;
  };

  // Calculate VAT with configurable rate
  const calculateVAT = (amount) => {
    return amount * FINANCIAL_CONFIG.VAT_RATE;
  };

  // Calculate Withholding Tax with threshold and variable rates
  const calculateWithholdingTax = (amount) => {
    // Ethiopian withholding tax rules:
    // 3% for amounts >= 10,000 ETB
    // 0% for amounts < 10,000 ETB
    if (amount >= FINANCIAL_CONFIG.WITHHOLDING_THRESHOLD) {
      return amount * FINANCIAL_CONFIG.WITHHOLDING_RATE;
    }
    return 0;
  };

  // Calculate Net Profit (what the business actually earns)
  const calculateNetProfit = (order) => {
    const grossProfit = calculateOrderProfit(order);
    const vat = calculateVAT(order.totalAmount);
    const withholdingTax = calculateWithholdingTax(order.totalAmount);
    return grossProfit - vat - withholdingTax;
  };

  // Calculate Revenue After Tax (what the business actually receives)
  const calculateRevenueAfterTax = (order) => {
    const vat = calculateVAT(order.totalAmount);
    const withholdingTax = calculateWithholdingTax(order.totalAmount);
    return order.totalAmount - vat - withholdingTax;
  };

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
        <Heading as="h2" size="md">Order Management</Heading>
        <HStack spacing={2}>
          <Button 
            size="sm"
            leftIcon={<DownloadIcon />} 
            colorScheme="teal" 
            variant="outline"
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards - Compact Version */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Total Orders</StatLabel>
              <StatNumber fontSize="sm">{orderStats.totalOrders}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Pending</StatLabel>
              <StatNumber fontSize="sm" color="orange.500">{orderStats.pendingOrders}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Delivered</StatLabel>
              <StatNumber fontSize="sm" color="green.500">{orderStats.deliveredOrders}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="2xs">Revenue</StatLabel>
              <StatNumber fontSize="sm">ETB {orderStats.totalRevenue.toLocaleString()}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Financial Summary - Compact Version */}
      <Card size="sm" mb={4}>
        <CardHeader py={2} px={3}>
          <Heading as="h3" size="sm">Financial Summary</Heading>
        </CardHeader>
        <CardBody py={2} px={3}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            <Stat>
              <StatLabel fontSize="2xs">Total Revenue</StatLabel>
              <StatNumber fontSize="xs">ETB {orderStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="2xs">VAT ({(FINANCIAL_CONFIG.VAT_RATE * 100).toFixed(0)}%)</StatLabel>
              <StatNumber fontSize="xs">ETB {(orderStats.totalRevenue * FINANCIAL_CONFIG.VAT_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="2xs">Withholding Tax</StatLabel>
              <StatNumber fontSize="xs">ETB {calculateWithholdingTax(orderStats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="2xs">Net Revenue</StatLabel>
              <StatNumber fontSize="xs" color="green.500">ETB {(orderStats.totalRevenue - (orderStats.totalRevenue * FINANCIAL_CONFIG.VAT_RATE) - calculateWithholdingTax(orderStats.totalRevenue)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
              <Text fontSize="2xs" color="gray.500">
                (Total Revenue - VAT - Withholding)
              </Text>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Search and Filter Controls - Compact Version */}
      <Card size="sm" mb={4}>
        <CardBody py={2} px={3}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={2} wrap="wrap">
            <InputGroup size="sm" flex={{ base: '1', md: '2' }}>
              <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' boxSize={3} />
              </InputLeftElement>
              <Input
                size="sm"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              size="sm"
              placeholder="Status" 
              flex="1"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            
            <Select 
              size="sm"
              placeholder="Payment" 
              flex="1"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </Select>
            
            <Button 
              size="sm"
              colorScheme="red" 
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedPaymentStatus('');
              }}
            >
              Clear
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Tabbed Orders View - Compact Version */}
      <Tabs variant="enclosed" size="sm" mb={4}>
        <TabList>
          <Tab px={3} py={2}>Processing Orders ({filteredProcessingOrders.length})</Tab>
          <Tab px={3} py={2}>Delivered Orders ({filteredDeliveredOrders.length})</Tab>
        </TabList>
        <TabPanels>
          {/* Processing Orders Tab */}
          <TabPanel px={0} py={3}>
            <Card size="sm">
              <CardHeader py={2} px={3}>
                <Flex justify="space-between" align="center">
                  <Heading as="h3" size="sm">Processing Orders</Heading>
                  <Text fontSize="2xs" color="gray.500">
                    {filteredProcessingOrders.length} orders
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody py={2} px={2}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th px={2} py={1} fontSize="xs">ID</Th>
                        <Th px={2} py={1} fontSize="xs">Customer</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Revenue</Th>
                        <Th px={2} py={1} fontSize="xs">Payment</Th>
                        <Th px={2} py={1} fontSize="xs">Status</Th>
                        <Th px={2} py={1} fontSize="xs">Agent</Th>
                        <Th px={2} py={1} fontSize="xs">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredProcessingOrders.length > 0 ? (
                        filteredProcessingOrders.map((order) => (
                          <Tr key={order._id} fontSize="sm">
                            <Td px={2} py={1}>
                              <Text fontWeight="bold" fontSize="sm">#{order._id.substring(0, 6)}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">{order.customerName}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {order.customerPhone}
                                </Text>
                              </VStack>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{order.totalAmount.toLocaleString()}</Text>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{(order.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Badge 
                                fontSize="xs"
                                colorScheme={
                                  order.paymentType === 'Advance' ? 'purple' :
                                  order.paymentType === 'Half' ? 'yellow' : 'green'
                                }
                              >
                                {order.paymentType}
                              </Badge>
                              {order.paymentAmount > 0 && (
                                <Text fontSize="xs" mt={1}>
                                  Paid: ETB {order.paymentAmount.toLocaleString()}
                                </Text>
                              )}
                              {order.totalAmount > 0 && (
                                <Text fontSize="xs" color={order.paymentAmount >= order.totalAmount ? "green.500" : "red.500"}>
                                  Bal: ETB {(order.totalAmount - (order.paymentAmount || 0)).toLocaleString()}
                                </Text>
                              )}
                            </Td>
                            <Td px={2} py={1}>
                              <Badge 
                                fontSize="xs"
                                colorScheme={
                                  order.status === 'Pending' ? 'orange' :
                                  order.status === 'Confirmed' ? 'blue' :
                                  order.status === 'Processing' ? 'yellow' :
                                  order.status === 'Shipped' ? 'purple' :
                                  order.status === 'Delivered' ? 'green' : 'red'
                                }
                              >
                                {order.status}
                              </Badge>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="sm" fontWeight="medium">
                                {order.salesAgent?.name}
                              </Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Flex direction="column" gap={1}>
                                <HStack spacing={1}>
                                  <Button 
                                    size="xs" 
                                    colorScheme="teal" 
                                    onClick={() => handleViewOrder(order)}
                                    py={1}
                                    px={2}
                                    fontSize="xs"
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    colorScheme="blue" 
                                    onClick={() => handleEdit(order)}
                                    py={1}
                                    px={2}
                                    fontSize="xs"
                                  >
                                    Edit
                                  </Button>
                                </HStack>
                                
                                {/* Status Update Buttons - Compact */}
                                <HStack spacing={1} wrap="wrap">
                                  {order.status !== 'Delivered' && (
                                    <Button 
                                      size="xs" 
                                      colorScheme="green" 
                                      onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                                      py={0.5}
                                      px={1}
                                      fontSize="xs"
                                      height="auto"
                                      minHeight="16px"
                                    >
                                      Deliver
                                    </Button>
                                  )}
                                  {order.status !== 'Cancelled' && (
                                    <Button 
                                      size="xs" 
                                      colorScheme="red" 
                                      onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                                      py={0.5}
                                      px={1}
                                      fontSize="xs"
                                      height="auto"
                                      minHeight="16px"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </HStack>
                              </Flex>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={4}>
                            <Text fontSize="sm">No processing orders found</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Delivered Orders Tab */}
          <TabPanel px={0} py={3}>
            <Card size="sm">
              <CardHeader py={2} px={3}>
                <Flex justify="space-between" align="center">
                  <Heading as="h3" size="sm">Delivered Orders</Heading>
                  <Text fontSize="2xs" color="gray.500">
                    {filteredDeliveredOrders.length} orders
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody py={2} px={2}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th px={2} py={1} fontSize="xs">ID</Th>
                        <Th px={2} py={1} fontSize="xs">Customer</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Revenue</Th>
                        <Th px={2} py={1} fontSize="xs">Payment</Th>
                        <Th px={2} py={1} fontSize="xs">Delivered Date</Th>
                        <Th px={2} py={1} fontSize="xs">Agent</Th>
                        <Th px={2} py={1} fontSize="xs">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredDeliveredOrders.length > 0 ? (
                        filteredDeliveredOrders.map((order) => (
                          <Tr key={order._id} fontSize="sm">
                            <Td px={2} py={1}>
                              <Text fontWeight="bold" fontSize="sm">#{order._id.substring(0, 6)}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">{order.customerName}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {order.customerPhone}
                                </Text>
                              </VStack>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{order.totalAmount.toLocaleString()}</Text>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{calculateOrderProfit(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Badge 
                                fontSize="xs"
                                colorScheme={
                                  order.paymentType === 'Advance' ? 'purple' :
                                  order.paymentType === 'Half' ? 'yellow' : 'green'
                                }
                              >
                                {order.paymentType}
                              </Badge>
                              {order.paymentAmount > 0 && (
                                <Text fontSize="xs" mt={1}>
                                  Paid: ETB {order.paymentAmount.toLocaleString()}
                                </Text>
                              )}
                              {order.totalAmount > 0 && (
                                <Text fontSize="xs" color={order.paymentAmount >= order.totalAmount ? "green.500" : "red.500"}>
                                  Bal: ETB {(order.totalAmount - (order.paymentAmount || 0)).toLocaleString()}
                                </Text>
                              )}
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{(order.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="xs">
                                {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-'}
                              </Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="sm" fontWeight="medium">
                                {order.salesAgent?.name}
                              </Text>
                            </Td>
                            <Td px={2} py={1}>
                              <HStack spacing={1}>
                                <Button 
                                  size="xs" 
                                  colorScheme="teal" 
                                  onClick={() => handleViewOrder(order)}
                                  py={1}
                                  px={2}
                                  fontSize="xs"
                                >
                                  View
                                </Button>
                                <Button 
                                  size="xs" 
                                  colorScheme="blue" 
                                  onClick={() => handleEdit(order)}
                                  py={1}
                                  px={2}
                                  fontSize="xs"
                                >
                                  Edit
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={4}>
                            <Text fontSize="sm">No delivered orders found</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Order Modal - Compact Version */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent maxW="600px">
          <ModalHeader fontSize="sm">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </ModalHeader>
          <ModalCloseButton size="sm" />
          <form onSubmit={handleSubmit}>
            <ModalBody py={2} px={3}>
              <Tabs size="sm">
                <TabList>
                  <Tab fontSize="xs">Status & Notes</Tab>
                  <Tab fontSize="xs">Payment</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel py={2} px={0}>
                    <Flex direction="column" gap={3}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs">Status</FormLabel>
                        <Select
                          size="sm"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="xs">Notes</FormLabel>
                        <Input
                          size="sm"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Enter notes"
                        />
                      </FormControl>
                    </Flex>
                  </TabPanel>
                  
                  <TabPanel py={2} px={0}>
                    <Flex direction="column" gap={3}>
                      <FormControl>
                        <FormLabel fontSize="xs">Payment Type</FormLabel>
                        <Select
                          size="sm"
                          name="paymentType"
                          value={formData.paymentType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select type</option>
                          <option value="Full">Full Payment</option>
                          <option value="Half">Half Payment</option>
                          <option value="Advance">Advance Payment</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel fontSize="xs">Amount (ETB)</FormLabel>
                        <NumberInput
                          size="sm"
                          min={0}
                          value={formData.paymentAmount}
                          onChange={(valueAsString, valueAsNumber) => {
                            setFormData({
                              ...formData,
                              paymentAmount: valueAsNumber
                            });
                          }}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            
            <ModalFooter py={2} px={3}>
              <Button size="sm" variant="ghost" mr={2} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                size="sm"
                colorScheme="teal" 
                type="submit"
              >
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Order Details Drawer */}
      <OrderDetailsDrawer 
        isOpen={isViewOpen} 
        onClose={onViewClose} 
        orderId={currentOrderId}
        onStatusUpdate={handleStatusUpdate}
      />
    </Box>
  );
};

export default OrdersPage;