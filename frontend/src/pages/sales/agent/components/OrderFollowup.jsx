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
  Icon,
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
  Checkbox,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
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
  CheckIcon, 
  CloseIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import axios from '../../../../services/axiosInstance';

const OrderFollowup = () => {
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    notes: '',
    paymentType: 'Full',
    paymentAmount: ''
  });
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();

  // Fetch orders, stock items, and customers
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user ID from localStorage (stored separately, not as a currentUser object)
      const userId = localStorage.getItem('userId');
      console.log('User ID from localStorage:', userId);
      
      if (!userId) {
        setError('User not logged in');
        toast({
          title: 'Error',
          description: 'User not logged in. Please log in again.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        setLoading(false);
        return;
      }
      
      // Fetch orders for the current sales agent only
      const ordersResponse = await axios.get(`/orders?salesAgentId=${userId}`);
      console.log('Orders response:', ordersResponse.data);
      setOrders(ordersResponse.data);
      
      // Fetch stock items
      const stockResponse = await axios.get(`/stock`);
      setStockItems(stockResponse.data);
      
      // Note: We're not fetching customers anymore since we're entering customer info manually
      // But we still need the customers state for the view/edit functionality
      // So we'll fetch customers only when needed for viewing existing orders
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
      toast({
        title: 'Error',
        description: `Failed to fetch data: ${err.response?.data?.message || err.message}`,
        status: 'error',
        duration: 5000,
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
    totalRevenue: 0
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

  // Add item to order
  const addItemToOrder = () => {
    if (!selectedStockItem || itemQuantity <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please select an item and enter a valid quantity',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    // Check if sufficient quantity is available (considering both regular and buffer stock)
    const totalAvailable = selectedStockItem.quantity + (selectedStockItem.bufferStock || 0);
    if (totalAvailable < itemQuantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${totalAvailable} units available for ${selectedStockItem.name}`,
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    // Check if item already exists in order
    const existingItemIndex = formData.items.findIndex(
      item => item.stockItemId === selectedStockItem._id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...formData.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + itemQuantity;
      
      // Check if new quantity exceeds available stock
      if (totalAvailable < newQuantity) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${totalAvailable} units available for ${selectedStockItem.name}`,
          status: 'warning',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Add new item
      const newItem = {
        stockItemId: selectedStockItem._id,
        name: selectedStockItem.name,
        sku: selectedStockItem.sku,
        quantity: itemQuantity,
        unitPrice: selectedStockItem.price,
        totalPrice: selectedStockItem.price * itemQuantity
      };

      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      });
    }

    // Reset selection
    setSelectedStockItem(null);
    setItemQuantity(1);
  };

  // Remove item from order
  const removeItemFromOrder = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || formData.items.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please enter customer name and add at least one item',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // Validate payment amount based on payment type
    if (formData.paymentType !== 'Full' && (!formData.paymentAmount || formData.paymentAmount <= 0)) {
      toast({
        title: 'Payment Information Required',
        description: 'Please enter payment amount for advance or half payment',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      if (isEditing) {
        // For editing, we'll update the order details
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
      } else {
        // Get sales agent information from the user store
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // First check if a customer with this name already exists
        let customerId;
        try {
          const customerData = {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone
          };
          
          const customerResponse = await axios.post(`/order-customers`, customerData);
          customerId = customerResponse.data._id;
        } catch (customerError) {
          // If customer creation fails, show error
          throw new Error('Failed to create customer: ' + (customerError.response?.data?.message || customerError.message));
        }
        
        // Create new order with the customer ID
        try {
          const orderData = {
            customerId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            items: formData.items,
            notes: formData.notes,
            paymentType: formData.paymentType,
            paymentAmount: formData.paymentAmount,
            // Add sales agent information from the current user
            salesAgent: {
              id: currentUser._id,
              name: currentUser.username, // Using username since that's what we have in the store
              email: '' // We don't have email in the store, but it's optional in the model
            }
          };
          
          await axios.post(`/orders`, orderData);
          toast({
            title: 'Success',
            description: 'Order created successfully',
            status: 'success',
            duration: 3000,
            isClosable: true
          });
        } catch (orderError) {
          // If order creation fails, show error
          throw new Error('Failed to create order: ' + (orderError.response?.data?.message || orderError.message));
        }
      }
      
      // Reset form and refresh data
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        items: [],
        notes: '',
        paymentType: 'Full',
        paymentAmount: ''
      });
      setIsEditing(false);
      setCurrentOrderId(null);
      onClose();
      fetchData();
      fetchOrderStats();
    } catch (err) {
      console.error('Order creation error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save order',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Handle edit action
  const handleEdit = (order) => {
    setFormData({
      customerId: order.customerId._id || order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      items: order.items,
      notes: order.notes || '',
      status: order.status,
      paymentType: order.paymentType || 'Full',
      paymentAmount: order.paymentAmount || ''
    });
    setIsEditing(true);
    setCurrentOrderId(order._id);
    onOpen();
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setFormData({
      customerId: order.customerId._id || order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      items: order.items,
      notes: order.notes || '',
      status: order.status,
      paymentType: order.paymentType || 'Full',
      paymentAmount: order.paymentAmount || ''
    });
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
        const orderTotal = calculateOrderTotal(order.items);
        const paymentAmount = order.paymentAmount || 0;
        
        // For any payment type, full payment must be made before delivery
        if (paymentAmount < orderTotal) {
          toast({
            title: 'Full Payment Required',
            description: `Full payment of ETB ${orderTotal.toLocaleString()} is required before delivery. Current payment: ETB ${paymentAmount.toLocaleString()}. Remaining: ETB ${(orderTotal - paymentAmount).toLocaleString()}`,
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

  // Open modal for new order
  const handleAddNewOrder = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      items: [],
      notes: '',
      paymentType: 'Full',
      paymentAmount: ''
    });
    setIsEditing(false);
    setCurrentOrderId(null);
    onOpen();
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Separate orders into processing (pending) and delivered
  const processingOrders = orders.filter(order => 
    order.status !== 'Delivered' && 
    order.status !== 'Cancelled'
  );

  const deliveredOrders = orders.filter(order => 
    order.status === 'Delivered'
  );

  // Apply search filter to each group
  const filteredProcessingOrders = processingOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus && order.status !== 'Delivered' && order.status !== 'Cancelled';
  });

  const filteredDeliveredOrders = deliveredOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus && order.status === 'Delivered';
  });

  // Calculate order total
  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (valueAsString, valueAsNumber) => {
    setFormData({
      ...formData,
      paymentAmount: valueAsNumber
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="lg" color="teal.600">
          Order Follow-up
        </Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="teal" 
          onClick={handleAddNewOrder}
        >
          Create New Order
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Stat>
          <StatLabel>Total Orders</StatLabel>
          <StatNumber>{orderStats.totalOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Pending Orders</StatLabel>
          <StatNumber color="orange.500">{orderStats.pendingOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Confirmed Orders</StatLabel>
          <StatNumber color="blue.500">{orderStats.confirmedOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Total Revenue</StatLabel>
          <StatNumber>ETB {orderStats.totalRevenue.toLocaleString()}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Search and Filter Controls */}
      <Card mb={6}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <InputGroup flex="1">
              <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
              </InputLeftElement>
              <Input
                placeholder="Search by customer name, email, phone or order ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              placeholder="Filter by status" 
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
            
            <Button 
              colorScheme="red" 
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Tabbed Orders View */}
      <Tabs variant="enclosed" mb={6}>
        <TabList>
          <Tab>Processing Orders ({filteredProcessingOrders.length})</Tab>
          <Tab>Delivered Orders ({filteredDeliveredOrders.length})</Tab>
        </TabList>
        <TabPanels>
          {/* Processing Orders Tab */}
          <TabPanel px={0}>
            <Card>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th px={2} py={1} fontSize="xs">Order ID</Th>
                        <Th px={2} py={1} fontSize="xs">Customer</Th>
                        <Th px={2} py={1} fontSize="xs">Phone</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Total (ETB)</Th>
                        <Th px={2} py={1} fontSize="xs">Payment</Th>
                        <Th px={2} py={1} fontSize="xs">Status</Th>
                        <Th px={2} py={1} fontSize="xs">Date</Th>
                        <Th px={2} py={1} fontSize="xs">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredProcessingOrders.length > 0 ? (
                        filteredProcessingOrders.map((order) => (
                          <Tr key={order._id} fontSize="sm">
                            <Td px={2} py={1}>
                              <Text fontWeight="bold" fontSize="sm">#{order._id.substring(0, 8)}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontWeight="medium" fontSize="sm">{order.customerName}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="sm">{order.customerPhone || '-'}</Text>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{calculateOrderTotal(order.items).toLocaleString()}</Text>
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
                              {order.paymentType !== 'Full' && (
                                <Text fontSize="xs" color="gray.500">
                                  Balance: ETB {(calculateOrderTotal(order.items) - (order.paymentAmount || 0)).toLocaleString()}
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
                              <Text fontSize="sm">{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Flex direction="column" gap={1}>
                                <Flex gap={1}>
                                  <Button 
                                    size="xs" 
                                    colorScheme="teal" 
                                    onClick={() => handleViewOrder(order)}
                                    px={2}
                                    py={1}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    colorScheme="blue" 
                                    onClick={() => handleEdit(order)}
                                    px={2}
                                    py={1}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    colorScheme="red" 
                                    onClick={() => handleDelete(order._id)}
                                    px={2}
                                    py={1}
                                  >
                                    Delete
                                  </Button>
                                </Flex>
                                
                                {/* Status Update Buttons - Only show if order is not delivered */}
                                {order.status !== 'Delivered' && (
                                  <Flex gap={1} wrap="wrap">
                                    {order.status !== 'Processing' && (
                                      <Button 
                                        size="xs" 
                                        colorScheme="yellow" 
                                        onClick={() => handleStatusUpdate(order._id, 'Processing')}
                                        px={2}
                                        py={1}
                                        height="auto"
                                        minHeight="20px"
                                        fontSize="2xs"
                                      >
                                        Process
                                      </Button>
                                    )}
                                    {order.status !== 'Delivered' && (
                                      <Button 
                                        size="xs" 
                                        colorScheme="green" 
                                        onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                                        px={2}
                                        py={1}
                                        height="auto"
                                        minHeight="20px"
                                        fontSize="2xs"
                                      >
                                        Deliver
                                      </Button>
                                    )}
                                    {order.status !== 'Cancelled' && (
                                      <Button 
                                        size="xs" 
                                        colorScheme="red" 
                                        onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                                        px={2}
                                        py={1}
                                        height="auto"
                                        minHeight="20px"
                                        fontSize="2xs"
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </Flex>
                                )}
                              </Flex>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={9} textAlign="center" py={4}>
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
          <TabPanel px={0}>
            <Card>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th px={2} py={1} fontSize="xs">Order ID</Th>
                        <Th px={2} py={1} fontSize="xs">Customer</Th>
                        <Th px={2} py={1} fontSize="xs">Phone</Th>
                        <Th px={2} py={1} fontSize="xs" isNumeric>Total (ETB)</Th>
                        <Th px={2} py={1} fontSize="xs">Payment</Th>
                        <Th px={2} py={1} fontSize="xs">Date Delivered</Th>
                        <Th px={2} py={1} fontSize="xs">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredDeliveredOrders.length > 0 ? (
                        filteredDeliveredOrders.map((order) => (
                          <Tr key={order._id} fontSize="sm">
                            <Td px={2} py={1}>
                              <Text fontWeight="bold" fontSize="sm">#{order._id.substring(0, 8)}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontWeight="medium" fontSize="sm">{order.customerName}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="sm">{order.customerPhone || '-'}</Text>
                            </Td>
                            <Td px={2} py={1} isNumeric>
                              <Text fontSize="sm">{calculateOrderTotal(order.items).toLocaleString()}</Text>
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
                              {order.paymentType !== 'Full' && (
                                <Text fontSize="xs" color="gray.500">
                                  Balance: ETB {(calculateOrderTotal(order.items) - (order.paymentAmount || 0)).toLocaleString()}
                                </Text>
                              )}
                            </Td>
                            <Td px={2} py={1}>
                              <Text fontSize="sm">{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-'}</Text>
                            </Td>
                            <Td px={2} py={1}>
                              <Flex gap={1}>
                                <Button 
                                  size="xs" 
                                  colorScheme="teal" 
                                  onClick={() => handleViewOrder(order)}
                                  px={2}
                                  py={1}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="xs" 
                                  colorScheme="blue" 
                                  onClick={() => handleEdit(order)}
                                  px={2}
                                  py={1}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="xs" 
                                  colorScheme="red" 
                                  onClick={() => handleDelete(order._id)}
                                  px={2}
                                  py={1}
                                >
                                  Delete
                                </Button>
                              </Flex>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={4}>
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

      {/* Create/Edit Order Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Tabs>
                <TabList>
                  <Tab>Customer Details</Tab>
                  <Tab>Items</Tab>
                  <Tab>Payment</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <Flex direction="column" gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Customer Name</FormLabel>
                        <Input
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleInputChange}
                          placeholder="Enter customer name"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Customer Email</FormLabel>
                        <Input
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          placeholder="Enter customer email"
                          type="email"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Customer Phone</FormLabel>
                        <Input
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleInputChange}
                          placeholder="Enter customer phone"
                          type="tel"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Notes</FormLabel>
                        <Input
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Enter any notes for this order"
                        />
                      </FormControl>
                      
                      {isEditing && (
                        <FormControl>
                          <FormLabel>Status</FormLabel>
                          <Select
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
                      )}
                    </Flex>
                  </TabPanel>
                  
                  <TabPanel>
                    <Flex direction="column" gap={4}>
                      {!isEditing && (
                        <>
                          <Flex gap={2} alignItems="flex-end">
                            <FormControl flex="1">
                              <FormLabel>Product</FormLabel>
                              <Select
                                placeholder="Select item"
                                value={selectedStockItem?._id || ''}
                                onChange={(e) => {
                                  const item = stockItems.find(i => i._id === e.target.value);
                                  setSelectedStockItem(item || null);
                                }}
                              >
                                {stockItems.map((item) => (
                                  <option key={item._id} value={item._id}>
                                    {item.name} - ETB {item.price} ({item.sku})
                                    (Avail: {item.quantity}{item.bufferStock ? ` + ${item.bufferStock} (Buffer)` : ''})
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            
                            <FormControl width="120px">
                              <FormLabel>Quantity</FormLabel>
                              <NumberInput
                                min={1}
                                value={itemQuantity}
                                onChange={(valueAsString, valueAsNumber) => setItemQuantity(valueAsNumber)}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            
                            <Button 
                              onClick={addItemToOrder}
                              colorScheme="teal"
                              height="40px"
                            >
                              Add
                            </Button>
                          </Flex>
                          
                          <Divider />
                        </>
                      )}
                      
                      {formData.items.length > 0 ? (
                        <TableContainer>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th>Item</Th>
                                <Th>SKU</Th>
                                <Th isNumeric>Qty</Th>
                                <Th isNumeric>Price</Th>
                                <Th isNumeric>Total</Th>
                                {!isEditing && <Th>Actions</Th>}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {formData.items.map((item, index) => (
                                <Tr key={index}>
                                  <Td>{item.name}</Td>
                                  <Td>{item.sku}</Td>
                                  <Td isNumeric>{item.quantity}</Td>
                                  <Td isNumeric>{item.unitPrice.toLocaleString()}</Td>
                                  <Td isNumeric>{item.totalPrice.toLocaleString()}</Td>
                                  {!isEditing && (
                                    <Td>
                                      <IconButton
                                        aria-label="Remove item"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => removeItemFromOrder(index)}
                                      />
                                    </Td>
                                  )}
                                </Tr>
                              ))}
                              <Tr>
                                <Td colSpan={4} fontWeight="bold">Total</Td>
                                <Td isNumeric fontWeight="bold">
                                  ETB {calculateOrderTotal(formData.items).toLocaleString()}
                                </Td>
                                <Td></Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Text textAlign="center" color="gray.500" py={4}>
                          No items added to this order
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                  
                  <TabPanel>
                    <Flex direction="column" gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Payment Type</FormLabel>
                        <Select
                          name="paymentType"
                          value={formData.paymentType}
                          onChange={handleInputChange}
                        >
                          <option value="Full">Full Payment</option>
                          <option value="Half">Half Payment</option>
                          <option value="Advance">Advance Payment</option>
                        </Select>
                      </FormControl>
                      
                      {(formData.paymentType === 'Advance' || formData.paymentType === 'Half') && (
                        <FormControl isRequired>
                          <FormLabel>Payment Amount (ETB)</FormLabel>
                          <NumberInput
                            min={0}
                            value={formData.paymentAmount}
                            onChange={handlePaymentAmountChange}
                          >
                            <NumberInputField />
                          </NumberInput>
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            Order Total: ETB {calculateOrderTotal(formData.items).toLocaleString()}
                          </Text>
                        </FormControl>
                      )}
                      
                      {formData.paymentType === 'Full' && (
                        <Text fontSize="sm" color="green.500">
                          Full payment of ETB {calculateOrderTotal(formData.items).toLocaleString()} will be collected
                        </Text>
                      )}
                    </Flex>
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
              >
                {isEditing ? 'Update Order' : 'Create Order'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Order Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>Order Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Flex justify="space-between">
                <Box>
                  <Text fontWeight="bold">Order ID:</Text>
                  <Text>#{currentOrderId?.substring(0, 8)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Date:</Text>
                  <Text>{new Date().toLocaleDateString()}</Text>
                </Box>
              </Flex>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold">Customer:</Text>
                <Text>{formData.customerName}</Text>
                {formData.customerEmail && <Text>Email: {formData.customerEmail}</Text>}
                {formData.customerPhone && <Text>Phone: {formData.customerPhone}</Text>}
              </Box>
              
              <Box>
                <Text fontWeight="bold">Sales Agent:</Text>
                <Text>{formData.salesAgent?.name}</Text>
                {formData.salesAgent?.email && <Text>Email: {formData.salesAgent.email}</Text>}
              </Box>
              
              <Box>
                <Text fontWeight="bold">Items:</Text>
                <TableContainer mt={2}>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>SKU</Th>
                        <Th isNumeric>Qty</Th>
                        <Th isNumeric>Price</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {formData.items.map((item, index) => (
                        <Tr key={index}>
                          <Td>{item.name}</Td>
                          <Td>{item.sku}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>{item.unitPrice.toLocaleString()}</Td>
                          <Td isNumeric>{item.totalPrice.toLocaleString()}</Td>
                        </Tr>
                      ))}
                      <Tr>
                        <Td colSpan={4} fontWeight="bold">Total</Td>
                        <Td isNumeric fontWeight="bold">
                          ETB {calculateOrderTotal(formData.items).toLocaleString()}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Payment:</Text>
                <Badge colorScheme={
                  formData.paymentType === 'Advance' ? 'purple' :
                  formData.paymentType === 'Half' ? 'yellow' : 'green'
                }>
                  {formData.paymentType}
                </Badge>
                <Text mt={1}>Total: ETB {calculateOrderTotal(formData.items).toLocaleString()}</Text>
                {formData.paymentAmount > 0 && (
                  <Text mt={1}>Paid: ETB {formData.paymentAmount.toLocaleString()}</Text>
                )}
                {formData.paymentType !== 'Full' && (
                  <Text mt={1} color={calculateOrderTotal(formData.items) - (formData.paymentAmount || 0) > 0 ? "red.500" : "green.500"}>
                    Balance: ETB {(calculateOrderTotal(formData.items) - (formData.paymentAmount || 0)).toLocaleString()}
                  </Text>
                )}
              </Box>
              
              <Box>
                <Text fontWeight="bold">Status:</Text>
                <Badge 
                  colorScheme={
                    formData.status === 'Pending' ? 'orange' :
                    formData.status === 'Confirmed' ? 'blue' :
                    formData.status === 'Processing' ? 'yellow' :
                    formData.status === 'Shipped' ? 'purple' :
                    formData.status === 'Delivered' ? 'green' : 'red'
                  }
                >
                  {formData.status}
                </Badge>
              </Box>
              
              {formData.notes && (
                <Box>
                  <Text fontWeight="bold">Notes:</Text>
                  <Text>{formData.notes}</Text>
                </Box>
              )}
            </Flex>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default OrderFollowup;