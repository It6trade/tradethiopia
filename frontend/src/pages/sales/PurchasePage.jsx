import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  IconButton,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Badge,
  Icon,
  Divider,
  Tooltip,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaShoppingCart, FaChartBar, FaDollarSign, FaSave, FaFileExport } from 'react-icons/fa';
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../../services/financeService';

const PurchasePage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();

  // State for purchase items
  const initialItem = () => ({
    id: 1,
    no: 1,
    item: '',
    quantity: 0,
    unit: 'pieces',
    declarationValue: 0,
    totalDeclarationValue: 0,
    weightedAverage: 0,
    customValue: 0,
    otherCost: 0,
    totalCost: 0,
    unitCost: 0,
    profitMargin: 0,
    sellingPrice: 0,
  });

  const [purchaseItems, setPurchaseItems] = useState([initialItem()]);
  
  const [saving, setSaving] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Date filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Units dropdown options
  const unitOptions = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'kg', label: 'KG' },
    { value: 'liter', label: 'Liter' }
  ];

  // Calculate weighted average by % (declaration value / total declaration value * 100)
  const calculateWeightedAverage = (declarationValue, totalDeclarationValue) => {
    if (totalDeclarationValue === 0) return 0;
    return (parseFloat(declarationValue) / parseFloat(totalDeclarationValue)) * 100;
  };

  // Calculate total cost (declaration value + custom value + other cost)
  const calculateTotalCost = (declarationValue, customValue, otherCost) => {
    return parseFloat(declarationValue || 0) + parseFloat(customValue || 0) + parseFloat(otherCost || 0);
  };

  // Calculate unit cost
  const calculateUnitCost = (totalCost, quantity) => {
    if (quantity === 0) return 0;
    return parseFloat(totalCost) / parseFloat(quantity);
  };

  // Calculate selling price
  const calculateSellingPrice = (totalCost, profitMargin) => {
    return parseFloat(totalCost) + parseFloat(profitMargin || 0);
  };

  const getNumericValue = (value) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const normalizeBackendItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [initialItem()];
    }

    const mappedItems = items.map((item, index) => ({
      id: item.id || item._id || index + 1,
      no: item.no || index + 1,
      item: item.item || '',
      quantity: getNumericValue(item.quantity),
      unit: item.unit || 'pieces',
      declarationValue: getNumericValue(item.declarationValue),
      totalDeclarationValue: getNumericValue(item.totalDeclarationValue),
      weightedAverage: getNumericValue(item.weightedAverage),
      customValue: getNumericValue(item.customValue),
      otherCost: getNumericValue(item.otherCost),
      totalCost: getNumericValue(item.totalCost),
      unitCost: getNumericValue(item.unitCost),
      profitMargin: getNumericValue(item.profitMargin),
      sellingPrice: getNumericValue(item.sellingPrice),
    }));

    return recalculateItems(mappedItems);
  };

  const loadLatestPurchase = async (filters = {}) => {
    setHistoryLoading(true);
    try {
      const purchases = await getPurchases(filters);
      setPurchaseHistory(Array.isArray(purchases) ? purchases : []);

      if (!Array.isArray(purchases) || purchases.length === 0) {
        toast({
          title: 'Nothing to refresh',
          description: 'No purchases were returned from the backend.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        setPurchaseItems([initialItem()]);
        return;
      }

      const latestPurchase = purchases[0];
      const normalizedItems = normalizeBackendItems(latestPurchase.items);
      setPurchaseItems(normalizedItems);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load purchases';
      toast({
        title: 'Unable to refresh',
        description: message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadLatestPurchase({ dateFrom, dateTo });
  }, [dateFrom, dateTo]);

  const prepareItemsForSubmission = () => {
    return purchaseItems.map((item) => ({
      ...item,
      declarationValue: getNumericValue(item.declarationValue),
      totalDeclarationValue: getNumericValue(item.totalDeclarationValue),
      customValue: getNumericValue(item.customValue),
      otherCost: getNumericValue(item.otherCost),
      totalCost: getNumericValue(item.totalCost),
      unitCost: getNumericValue(item.unitCost),
      quantity: getNumericValue(item.quantity),
      profitMargin: getNumericValue(item.profitMargin),
      sellingPrice: getNumericValue(item.sellingPrice),
    }));
  };

  // Recalculate all items when any value changes
  const recalculateItems = (updatedItems) => {
    return updatedItems.map(item => {
      // Calculate weighted average using the item's totalDeclarationValue
      const weightedAverage = calculateWeightedAverage(
        item.declarationValue || 0,
        item.totalDeclarationValue || 0
      );
      
      // Calculate total cost as: declaration value + custom value + other cost
      const totalCost = calculateTotalCost(
        item.declarationValue || 0,
        item.customValue || 0,
        item.otherCost || 0
      );
      
      const unitCost = calculateUnitCost(
        totalCost,
        item.quantity || 0
      );
      
      const sellingPrice = calculateSellingPrice(
        totalCost,
        item.profitMargin || 0
      );
      
      return {
        ...item,
        weightedAverage: parseFloat(weightedAverage.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        unitCost: parseFloat(unitCost.toFixed(2)),
        sellingPrice: parseFloat(sellingPrice.toFixed(2))
      };
    });
  };

  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setPurchaseItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      
      // Recalculate all items
      return recalculateItems(updatedItems);
    });
  };

  // Add new purchase item
  const addNewItem = () => {
    const newItem = {
      id: purchaseItems.length + 1,
      no: purchaseItems.length + 1,
      item: '',
      quantity: 0,
      unit: 'pieces',
      declarationValue: 0,
      totalDeclarationValue: 0,
      weightedAverage: 0,
      customValue: 0,
      otherCost: 0,
      totalCost: 0,
      unitCost: 0,
      profitMargin: 0,
      sellingPrice: 0,
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };

  // Remove purchase item
  const removeItem = (id) => {
    if (purchaseItems.length > 1) {
      const updatedItems = purchaseItems.filter(item => item.id !== id);
      setPurchaseItems(recalculateItems(updatedItems));
    }
  };

  const validatePurchaseData = () => {
    const missingItem = purchaseItems.some(item => !item.item.trim());
    const missingQuantity = purchaseItems.some((item) => {
      const quantity = parseFloat(item.quantity);
      return Number.isNaN(quantity) || quantity <= 0;
    });

    if (missingItem || missingQuantity) {
      toast({
        title: 'Incomplete purchase item',
        description: 'Each row needs a name and a positive quantity before saving.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  // Save purchase
  const savePurchase = async () => {
    if (!validatePurchaseData()) return;
    setSaving(true);
    try {
      // Collect form data for purchase creation
      const submissionItems = prepareItemsForSubmission();
      
      // Calculate totals for the purchase
      const totals = {
        totalItems: submissionItems.length,
        totalQuantity: submissionItems.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0),
        totalDeclarationValue: submissionItems.reduce((sum, item) => sum + parseFloat(item.declarationValue || 0), 0),
        totalCustomValue: submissionItems.reduce((sum, item) => sum + parseFloat(item.customValue || 0), 0),
        totalOtherCost: submissionItems.reduce((sum, item) => sum + parseFloat(item.otherCost || 0), 0),
        totalProfitMargin: submissionItems.reduce((sum, item) => sum + parseFloat(item.profitMargin || 0), 0),
        totalSellingPrice: submissionItems.reduce((sum, item) => sum + parseFloat(item.sellingPrice || 0), 0),
        totalCost: submissionItems.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0)
      };
      
      const purchaseData = {
        referenceNumber: `PUR-${Date.now()}`,
        supplier: 'Sample Supplier',
        items: submissionItems,
        totals: totals,
        notes: 'Sample purchase',
        purchaseDate: new Date().toISOString()
      };
      
      await createPurchase(purchaseData);
      setPurchaseItems(recalculateItems(submissionItems));
      
      toast({
        title: 'Purchase saved',
        description: 'The purchase has been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadLatestPurchase();
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      toast({
        title: 'Error saving purchase',
        description: serverMessage || error.message || 'Failed to save purchase',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Export purchase data to CSV
  const exportToCSV = async () => {
    try {
      const response = await exportPurchases({ dateFrom, dateTo });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `purchase_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Purchase data has been exported to CSV",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export purchase data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Export purchase history to CSV
  const exportHistoryToCSV = async () => {
    try {
      const response = await exportPurchases({ dateFrom, dateTo });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `purchase_history_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Purchase history has been exported to CSV",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export purchase history",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Calculate summary statistics
  const totalItems = purchaseItems.length;
  const totalDeclarationValue = purchaseItems.reduce((sum, item) => sum + parseFloat(item.declarationValue || 0), 0);
  const totalOtherCost = purchaseItems.reduce((sum, item) => sum + parseFloat(item.otherCost || 0), 0);
  const totalProfitMargin = purchaseItems.reduce((sum, item) => sum + parseFloat(item.profitMargin || 0), 0);
  const totalSellingPrice = purchaseItems.reduce((sum, item) => sum + parseFloat(item.sellingPrice || 0), 0);
  const totalCostSum = purchaseItems.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0);

  return (
    <Box py={1} px={2}>
        {/* Compact Header Section */}
        <Flex justify="space-between" align="center" mb={3}>
          <Heading as="h1" size="md" color={headerColor} fontWeight="bold">
            Purchase Management
          </Heading>
            <HStack spacing={2}>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="teal" 
                onClick={addNewItem}
                size="sm"
                px={3}
                py={1}
              >
                Add Item
              </Button>
              <Button 
                leftIcon={<FaFileExport />} 
                colorScheme="blue" 
                onClick={exportToCSV}
                size="sm"
                px={3}
                py={1}
              >
                Export
              </Button>
            </HStack>
        </Flex>

        {/* Compact Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={3}>
          <Card bg={cardBg} boxShadow="sm" p={1}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500">Items</StatLabel>
              <StatNumber fontSize="sm" fontWeight="bold">{totalItems}</StatNumber>
            </Stat>
          </Card>

          <Card bg={cardBg} boxShadow="sm" p={1}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500">Declaration</StatLabel>
              <StatNumber fontSize="sm" fontWeight="bold">ETB {totalDeclarationValue.toLocaleString()}</StatNumber>
            </Stat>
          </Card>

          <Card bg={cardBg} boxShadow="sm" p={1}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500">Total Cost</StatLabel>
              <StatNumber fontSize="sm" fontWeight="bold">ETB {totalCostSum.toLocaleString()}</StatNumber>
            </Stat>
          </Card>

          <Card bg={cardBg} boxShadow="sm" p={1}>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500">Selling Price</StatLabel>
              <StatNumber fontSize="sm" fontWeight="bold">ETB {totalSellingPrice.toLocaleString()}</StatNumber>
            </Stat>
          </Card>
        </SimpleGrid>

        {/* Compact Purchase Items Table */}
        <Card bg={cardBg} boxShadow="sm" mb={3}>
          <CardHeader pb={1} pt={1}>
            <Flex justify="space-between" align="center">
              <Heading as="h2" size="sm" color={headerColor}>
                Purchase Items
              </Heading>
              <Badge colorScheme="teal" fontSize="xs">
                {purchaseItems.length} items
              </Badge>
            </Flex>
          </CardHeader>
          <Divider borderColor={borderColor} />
          <CardBody p={1}>
            <Box overflowX="auto">
              <Table size="xs" variant="simple">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th px={1} py={1} fontSize="xs">#</Th>
                    <Th px={1} py={1} fontSize="xs">Item</Th>
                    <Th px={1} py={1} fontSize="xs">Qty</Th>
                    <Th px={1} py={1} fontSize="xs">Unit</Th>
                    <Th px={1} py={1} fontSize="xs">Decl.</Th>
                    <Th px={1} py={1} fontSize="xs">Total Decl.</Th>
                    <Th px={1} py={1} fontSize="xs">Weight%</Th>
                    <Th px={1} py={1} fontSize="xs">Custom</Th>
                    <Th px={1} py={1} fontSize="xs">Other Cost</Th>
                    <Th px={1} py={1} fontSize="xs">Total</Th>
                    <Th px={1} py={1} fontSize="xs">Unit</Th>
                    <Th px={1} py={1} fontSize="xs">Profit</Th>
                    <Th px={1} py={1} fontSize="xs">Sell</Th>
                    <Th px={1} py={1} fontSize="xs">Act</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {purchaseItems.map((item) => (
                    <Tr key={item.id} _hover={{ bg: tableRowHoverBg }}>
                      <Td px={1} py={1} fontWeight="bold" fontSize="xs">{item.no}</Td>
                      <Td px={1} py={1}>
                        <Input
                          value={item.item}
                          onChange={(e) => handleInputChange(item.id, 'item', e.target.value)}
                          placeholder="Item"
                          size="xs"
                          borderRadius="md"
                          maxWidth="80px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleInputChange(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="50px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Select
                          value={item.unit}
                          onChange={(e) => handleInputChange(item.id, 'unit', e.target.value)}
                          size="xs"
                          borderRadius="md"
                          maxWidth="70px"
                          px={1}
                          py={0}
                        >
                          {unitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.declarationValue}
                          onChange={(e) => handleInputChange(item.id, 'declarationValue', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="60px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.totalDeclarationValue}
                          onChange={(e) => handleInputChange(item.id, 'totalDeclarationValue', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="60px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Badge colorScheme="blue" fontSize="xs">{item.weightedAverage.toFixed(1)}%</Badge>
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.customValue}
                          onChange={(e) => handleInputChange(item.id, 'customValue', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="60px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.otherCost}
                          onChange={(e) => handleInputChange(item.id, 'otherCost', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="60px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Text fontWeight="semibold" color="teal.500" fontSize="xs">
                          {item.totalCost.toFixed(0)}
                        </Text>
                      </Td>
                      <Td px={1} py={1}>
                        <Text fontWeight="semibold" color="orange.500" fontSize="xs">
                          {item.unitCost.toFixed(2)}
                        </Text>
                      </Td>
                      <Td px={1} py={1}>
                        <Input
                          type="number"
                          value={item.profitMargin}
                          onChange={(e) => handleInputChange(item.id, 'profitMargin', e.target.value)}
                          placeholder="0"
                          size="xs"
                          borderRadius="md"
                          maxWidth="60px"
                          px={1}
                          py={0}
                        />
                      </Td>
                      <Td px={1} py={1}>
                        <Text fontWeight="bold" color="green.500" fontSize="xs">
                          {item.sellingPrice.toFixed(0)}
                        </Text>
                      </Td>
                      <Td px={1} py={1}>
                        <Tooltip label="Remove" placement="top">
                          <IconButton
                            icon={<FaTrash />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove"
                            minWidth="auto"
                            width="20px"
                            height="20px"
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Compact Action Buttons */}
        <Flex justify="space-between">
          <Button 
            leftIcon={<FaTrash />} 
            colorScheme="red" 
            variant="outline"
            size="xs"
            px={2}
            py={1}
            onClick={() => setPurchaseItems([{
              id: 1,
              no: 1,
              item: '',
              quantity: 0,
              unit: 'pieces',
              declarationValue: 0,
              totalDeclarationValue: 0,
              weightedAverage: 0,
              customValue: 0,
              otherCost: 0,
              totalCost: 0,
              unitCost: 0,
              profitMargin: 0,
              sellingPrice: 0,
            }])}
          >
            Clear
          </Button>
          <Button 
            leftIcon={saving ? <Spinner size="xs" /> : <FaSave />} 
            colorScheme="teal" 
            size="xs" 
            px={3} 
            py={1}
            onClick={savePurchase}
            isLoading={saving}
          >
            Save Purchase
          </Button>
        </Flex>

        <Card mt={6} bg={cardBg} boxShadow="sm">
          <CardHeader>
            <Flex justify="space-between" align="center" width="100%">
              <Heading as="h2" size="sm" color={headerColor}>
                Recent Purchases
              </Heading>
              <Button 
                leftIcon={<FaFileExport />} 
                colorScheme="blue" 
                onClick={exportHistoryToCSV}
                size="sm"
                px={3}
                py={1}
              >
                Export History
              </Button>
            </Flex>
          </CardHeader>
          <Divider borderColor={borderColor} />
          {/* Date Filters */}
          <Flex p={3} gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="sm" mb={1}>From Date</Text>
              <Input 
                type="date" 
                size="sm" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
                maxW="150px"
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1}>To Date</Text>
              <Input 
                type="date" 
                size="sm" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
                maxW="150px"
              />
            </Box>
            <Button 
              size="sm" 
              colorScheme="teal" 
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              alignSelf="flex-end"
              mb={1}
            >
              Clear Filters
            </Button>
          </Flex>
          <Divider borderColor={borderColor} />
          <CardBody>
            {historyLoading ? (
              <Flex justify="center" py={4}>
                <Spinner />
              </Flex>
            ) : purchaseHistory.length > 0 ? (
              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead bg={tableHeaderBg}>
                    <Tr>
                      <Th>Reference</Th>
                      <Th>Supplier</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Items</Th>
                      <Th isNumeric>Selling</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {purchaseHistory.map((record) => (
                      <Tr key={record._id}>
                        <Td>{record.referenceNumber}</Td>
                        <Td>{record.supplier}</Td>
                        <Td>{record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'No date'}</Td>
                        <Td>
                          <Badge colorScheme={record.status === 'received' ? 'green' : record.status === 'cancelled' ? 'red' : 'orange'}>
                            {record.status}
                          </Badge>
                        </Td>
                        <Td isNumeric>{record.totals?.totalItems || record.items?.length || '-'}</Td>
                        <Td isNumeric>ETB {(record.totals?.totalSellingPrice || 0).toLocaleString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500" py={3}>
                No purchases recorded yet.
              </Text>
            )}
          </CardBody>
        </Card>
      </Box>
  );
};

export default PurchasePage;
