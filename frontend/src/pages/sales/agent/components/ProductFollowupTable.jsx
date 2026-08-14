import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  IconButton,
  Flex,
  Text,
  useColorModeValue,
  HStack,
  Checkbox,
  Icon
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons';
import { FiList } from 'react-icons/fi';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { createPayment } from '../../../../services/paymentService';
import axios from '../../../../services/axiosInstance';

const ProductFollowupTable = ({ items, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingRow, setAddingRow] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: '',
    buyerName: '',
    contactPhone: '',
    email: '',
    status: 'Pending',
    note: '',
    supervisorComment: ''
  });
  const [updatedItems, setUpdatedItems] = useState(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
  // drawer for products selection
  const { isOpen: productsOpen, onOpen: onProductsOpen, onClose: onProductsClose } = useDisclosure();
  const [productsList, setProductsList] = useState([]);
  const [productsSelected, setProductsSelected] = useState(new Set());
  const [productsDrawerItem, setProductsDrawerItem] = useState(null);
  const { isOpen: confirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [confirmItems, setConfirmItems] = useState([]);
  const [confirmQuantities, setConfirmQuantities] = useState({});
  const [processingOrder, setProcessingOrder] = useState(false);
  const toast = useToast();
  const [allocationPreview, setAllocationPreview] = useState({});
  const navigate = useNavigate();
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchProducts = async () => {
    // fetch inventory from finance (stock API), fall back to sample list
    try {
      const res = await axios.get('/stock');
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        setProductsList(
          (Array.isArray(data) ? data : []).map((i) => ({
            _id: i._id,
            name: i.name,
            sku: i.sku,
            price: i.price,
            quantity: i.quantity,
            bufferStock: i.bufferStock,
            description: i.description,
          }))
        );
        return;
      }
    } catch (err) {
      // ignore and fall back
    }
    // fallback sample products (with inventory-like fields)
    setProductsList([
      { _id: 'p1', name: 'Basic Package', price: 99, sku: 'BP-001', quantity: 10, bufferStock: 0, description: '' },
      { _id: 'p2', name: 'Advanced Package', price: 199, sku: 'AP-002', quantity: 5, bufferStock: 1, description: '' },
      { _id: 'p3', name: 'Training Session', price: 49, sku: 'TS-003', quantity: 20, bufferStock: 0, description: '' },
    ]);
  };
  const [drawerItem, setDrawerItem] = useState(null);

  const userRole = localStorage.getItem('userRole') || 'agent';
  const headerColor = useColorModeValue('teal.800', 'teal.200');
  const canSetDelivered = ['sales','sales_manager','admin','finance','customerservice'].includes(userRole);

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      return 'N/A';
    }
  };

  const canUserEditField = (field, role) => {
    if (role === 'agent' || role === 'sales') return field !== 'supervisorComment';
    if (role === 'supervisor' || role === 'admin') return true;
    return false;
  };

  const handleCellClick = (item, field) => {
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return;
    setEditingCell({ id: item._id, field });
    setEditValue(item[field] || '');
  };

  const handleSave = (item) => {
    if (editingCell) {
      const updated = { ...item, [editingCell.field]: editValue };
      // update normally; payment flow is now initiated during order confirmation
      onUpdate(item._id, updated);
      setUpdatedItems(prev => new Set(prev).add(item._id));
      setTimeout(() => {
        setUpdatedItems(prev => {
          const n = new Set(prev);
          n.delete(item._id);
          return n;
        });
      }, 2000);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleInputChange = (e) => setEditValue(e.target.value);

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e, item) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(item);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNewItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewItem();
    } else if (e.key === 'Escape') {
      setAddingRow(false);
      setNewItem({ productName: '', buyerName: '', contactPhone: '', email: '', status: 'Pending', note: '', supervisorComment: '' });
    }
  };

  const handleAddNewItem = () => {
    onAdd(newItem);
    setAddingRow(false);
    setNewItem({ productName: '', buyerName: '', contactPhone: '', email: '', status: 'Pending', note: '', supervisorComment: '' });
  };

  const openProductsForItem = async (item) => {
    // load products list if empty
    if (!productsList || productsList.length === 0) await fetchProducts();
    setProductsDrawerItem(item);
    const selected = new Set((item.products || []).map(p => (p._id || p.id || p)));
    setProductsSelected(selected);
    onProductsOpen();
  };

  const toggleProductSelection = (productId) => {
    setProductsSelected(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const saveProductSelection = () => {
    if (!productsDrawerItem) return onProductsClose();
    const selectedArray = Array.from(productsSelected);
    // update the item via onUpdate, saving product ids (backend controller should accept this)
    onUpdate(productsDrawerItem._id, { products: selectedArray });
    setProductsDrawerItem(null);
    onProductsClose();
  };

  const renderEditableCell = (item, field, value, type = 'text') => {
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return <Td key={field}>{value}</Td>;

    const handleBlur = () => handleSave(item);

    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          <Select value={editValue} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, item)} size="xs" autoFocus onBlur={handleBlur} fontSize="sm" p={1}>
            {field === 'status' ? (
              <>
                <option value="Prospect">Prospect</option>
                <option value="Pending">Pending</option>
                {canSetDelivered && <option value="Delivered">Delivered</option>}
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Regular">Regular</option>
                <option value="Weekend">Weekend</option>
                <option value="Night">Night</option>
                <option value="Online">Online</option>
              </>
            )}
          </Select>
        </Td>
      );
    }

    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea value={editValue} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, item)} size="xs" rows={2} autoFocus onBlur={handleBlur} fontSize="sm" p={1} />
        </Td>
      );
    }

    return (
      <Td key={field} p={1}>
        <Input type={type} value={editValue} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, item)} size="xs" autoFocus onBlur={handleBlur} fontSize="sm" p={1} />
      </Td>
    );
  };

  const renderNewItemCell = (field, value, type = 'text') => {
    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          <Select name={field} value={value} onChange={handleNewItemChange} onKeyDown={handleNewItemKeyDown} size="xs" fontSize="sm" p={1}>
            {field === 'status' ? (
              <>
                <option value="Prospect">Prospect</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Regular">Regular</option>
                <option value="Weekend">Weekend</option>
                <option value="Night">Night</option>
                <option value="Online">Online</option>
              </>
            )}
          </Select>
        </Td>
      );
    }

    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea name={field} value={value} onChange={handleNewItemChange} onKeyDown={handleNewItemKeyDown} size="xs" rows={2} fontSize="sm" p={1} />
        </Td>
      );
    }

    return (
      <Td key={field} p={1}>
        <Input type={type} name={field} value={value} onChange={handleNewItemChange} onKeyDown={handleNewItemKeyDown} size="xs" fontSize="sm" p={1} />
      </Td>
    );
  };

  const getStatusBadgeVariant = (status, type) => {
    if (type === 'status') {
      switch (status) {
        case 'Prospect': return 'blue';
        case 'Completed': return 'green';
        case 'Pending': return 'yellow';
        case 'Scheduled': return 'purple';
        case 'Cancelled': return 'red';
        default: return 'gray';
      }
    }
    return 'gray';
  };

  if ((!items || items.length === 0) && !addingRow) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>No product followups found</Text>
        <Text mb={6}>Get started by adding a new product followup.</Text>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => setAddingRow(true)}>Add New Product Followup</Button>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Box mb={4}>
        <Button leftIcon={<AddIcon />} colorScheme="teal" size="sm" onClick={() => setAddingRow(true)} disabled={addingRow}>Add New Product Row</Button>
      </Box>
      <Table variant="simple" size="sm" w="100%">
        <Thead>
          <Tr bg="teal.50">
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Order Name</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Buyer Name</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Contact Phone</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Email</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Status</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Date</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Notes</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2}>Payment</Th>
            <Th color={headerColor} fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={2} px={2} width="120px">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {addingRow && (
            <Tr bg="gray.50">
              {renderNewItemCell('productName', newItem.productName)}
              {renderNewItemCell('buyerName', newItem.buyerName)}
              {renderNewItemCell('contactPhone', newItem.contactPhone)}
              {renderNewItemCell('email', newItem.email)}
              {renderNewItemCell('status', newItem.status, 'select')}
              <Td fontSize="xs" p={2}>{formatDate(new Date().toISOString())}</Td>
              {renderNewItemCell('note', newItem.note, 'textarea')}
              <Td p={2}>
                <IconButton icon={<CheckIcon />} colorScheme="green" size="xs" mr={1} onClick={handleAddNewItem} aria-label="Save" />
                <IconButton icon={<CloseIcon />} colorScheme="red" size="xs" onClick={() => setAddingRow(false)} aria-label="Cancel" />
              </Td>
            </Tr>
          )}

          {items && items.map(item => (
            <Tr key={item._id} _hover={{ bg: 'gray.50' }} transition="background 0.2s" fontSize="sm">
              {editingCell && editingCell.id === item._id && editingCell.field === 'productName'
                ? renderEditableCell(item, 'productName', item.productName)
                : <Td onClick={() => handleCellClick(item, 'productName')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="140px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{item.productName}</Td>}

              {editingCell && editingCell.id === item._id && editingCell.field === 'buyerName'
                ? renderEditableCell(item, 'buyerName', item.buyerName)
                : <Td onClick={() => handleCellClick(item, 'buyerName')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="140px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{item.buyerName}</Td>}

              {editingCell && editingCell.id === item._id && editingCell.field === 'contactPhone'
                ? renderEditableCell(item, 'contactPhone', item.contactPhone)
                : <Td onClick={() => handleCellClick(item, 'contactPhone')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{item.contactPhone}</Td>}

              {editingCell && editingCell.id === item._id && editingCell.field === 'email'
                ? renderEditableCell(item, 'email', item.email)
                : <Td onClick={() => handleCellClick(item, 'email')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{item.email}</Td>}

              {editingCell && editingCell.id === item._id && editingCell.field === 'status'
                ? renderEditableCell(item, 'status', item.status, 'select')
                : (
                  <Td onClick={() => handleCellClick(item, 'status')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(item.status, 'status')} fontSize="xs" px={1.5} py={0.5} maxWidth="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{item.status}</Badge>
                  </Td>
                )}

              <Td p={2} fontSize="xs">{item.date ? formatDate(item.date) : 'N/A'}</Td>

              {editingCell && editingCell.id === item._id && editingCell.field === 'note'
                ? renderEditableCell(item, 'note', item.note, 'textarea')
                : <Td onClick={() => handleCellClick(item, 'note')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{item.note}</Td>}

              <Td p={2} fontSize="sm">
                {/* Payment column: show amount or Set Payment button; clicking allows inline edit */}
                {editingPaymentId === item._id ? (
                  <HStack>
                    <NumberInput size="sm" maxW="120px" min={0} value={editingPaymentAmount} onChange={(val) => setEditingPaymentAmount(val)}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Button size="xs" colorScheme="teal" isLoading={paymentLoading} onClick={async () => {
                      setPaymentLoading(true);
                      try {
                        const payload = { followup: item._id, amount: Number(editingPaymentAmount) };
                        const res = await createPayment(payload);
                        // update parent followup with payment info
                        onUpdate(item._id, { payment: { id: res._id, amount: res.amount, method: res.method } });
                        toast({ title: 'Payment saved', description: 'Payment recorded for followup.', status: 'success', duration: 3000, isClosable: true });
                        setEditingPaymentId(null);
                        setEditingPaymentAmount('');
                      } catch (err) {
                        console.error('Failed to create payment', err);
                        toast({ title: 'Payment failed', description: err?.response?.data?.message || 'Failed to create payment', status: 'error', duration: 4000, isClosable: true });
                      } finally {
                        setPaymentLoading(false);
                      }
                    }}>Save</Button>
                    <Button size="xs" variant="outline" onClick={() => { setEditingPaymentId(null); setEditingPaymentAmount(''); }}>Cancel</Button>
                  </HStack>
                ) : (
                  <HStack>
                    <Text fontSize="sm">{(item.payment && (item.payment.amount ?? item.paymentAmount)) ? `$${item.payment.amount ?? item.paymentAmount}` : '—'}</Text>
                    <Button size="xs" onClick={() => { setEditingPaymentId(item._id); setEditingPaymentAmount(String((item.payment && (item.payment.amount ?? item.paymentAmount)) || '')); }}>Set Payment</Button>
                  </HStack>
                )}
              </Td>

              <Td p={2} position="relative">
                {updatedItems.has(item._id) && (
                  <Box position="absolute" top="-2px" left="-2px" w="8px" h="8px" bg="green.500" borderRadius="50%" zIndex="1" />
                )}
                <HStack spacing={2} justify="flex-end">
                  <IconButton icon={<DeleteIcon />} colorScheme="red" size="xs" onClick={() => onDelete(item._id)} aria-label="Delete" variant="outline" />
                  <IconButton icon={<Icon as={FiList} />} colorScheme="blue" size="xs" aria-label="Products" onClick={() => openProductsForItem(item)} variant="ghost" />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Products Drawer (select products for this followup) */}
      <Drawer isOpen={productsOpen} placement="right" onClose={() => { setProductsDrawerItem(null); onProductsClose(); }} size={{ base: 'full', md: 'lg' }}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{productsDrawerItem ? `Products for: ${productsDrawerItem.productName || productsDrawerItem.buyerName || 'Item'}` : 'Products'}</DrawerHeader>
          <DrawerBody>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={3}>Select products the customer is interested in. Prices are shown next to each product.</Text>
              {productsList.map(p => (
                <HStack key={p._id} justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
                  <HStack align="start">
                    <Checkbox isChecked={productsSelected.has(p._id)} onChange={() => toggleProductSelection(p._id)} />
                    <Box>
                      <Text fontWeight="medium">{p.name} <Text as="span" fontSize="xs" color="gray.500">{p.sku ? ` — ${p.sku}` : ''}</Text></Text>
                      <Text fontSize="sm" color="gray.500">{p.description || ''}</Text>
                      <HStack spacing={2} mt={1}>
                        <Badge colorScheme={p.quantity > 0 ? 'green' : 'red'}>{p.quantity ?? 0} in stock</Badge>
                        <Badge colorScheme={p.bufferStock > 0 ? 'yellow' : 'gray'}>buffer {p.bufferStock ?? 0}</Badge>
                      </HStack>
                    </Box>
                  </HStack>
                  <Text fontWeight="semibold">${p.price}</Text>
                </HStack>
              ))}
            </Box>
          </DrawerBody>
          <DrawerFooter>
            <HStack spacing={3}>
              <Button colorScheme="teal" size="sm" onClick={saveProductSelection}>Save Products</Button>
              <Button colorScheme="orange" size="sm" onClick={async () => {
                if (!productsDrawerItem) return;
                // ensure productsList is loaded
                if (!productsList || productsList.length === 0) await fetchProducts();
                const selected = Array.from(productsSelected).map(id => productsList.find(p => p._id === id) || { _id: id, name: id, price: 0, quantity: 0, bufferStock: 0 });
                // prepare confirm items and default quantities
                const q = {};
                selected.forEach(p => { q[p._id] = 1; });
                setConfirmItems(selected);
                setConfirmQuantities(q);
                // request a preview allocation from server
                try {
                  const { previewReserve } = await import('../../../../services/productFollowupService');
                  const previewRes = await previewReserve(productsDrawerItem._id, selected.map(p => ({ id: p._id, qty: 1 })));
                  // previewRes.preview is an array of allocations by item id
                  const map = {};
                  (previewRes.preview || []).forEach(r => { map[String(r.item)] = r; });
                  setAllocationPreview(map);
                } catch (err) {
                  console.error('Preview failed', err);
                  setAllocationPreview({});
                }
                onConfirmOpen();
              }}>Process Order</Button>
              <Button variant="outline" size="sm" onClick={() => { setProductsDrawerItem(null); onProductsClose(); }}>Close</Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Confirmation Modal for processing order */}
      <Modal isOpen={confirmOpen} onClose={onConfirmClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Order</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3} fontSize="sm" color="gray.600">Review the items, adjust quantities, and confirm the order. Stock levels are shown for reference.</Text>
            <Box>
              {confirmItems.map(item => (
                <HStack key={item._id} justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
                  <Box>
                    <Text fontWeight="medium">{item.name} <Text as="span" fontSize="xs" color="gray.500">{item.sku ? ` — ${item.sku}` : ''}</Text></Text>
                    <Text fontSize="sm" color="gray.500">${item.price} • {item.description || ''}</Text>
                    <HStack spacing={2} mt={1}>
                      <Badge colorScheme={item.quantity > 0 ? 'green' : 'red'}>{item.quantity ?? 0} in stock</Badge>
                      <Badge colorScheme={item.bufferStock > 0 ? 'yellow' : 'gray'}>buffer {item.bufferStock ?? 0}</Badge>
                      {/* show preview allocation if available */}
                      {allocationPreview[item._id] && (
                        <Text fontSize="xs" color="gray.600">Allocated: {allocationPreview[item._id].allocatedQty} ({(allocationPreview[item._id].allocations || []).map(a => `${a.amount}${a.source === 'stock' ? ' stock' : ' buffer'}`).join(', ')}){allocationPreview[item._id].unfulfilled ? ` • Unfulfilled: ${allocationPreview[item._id].unfulfilled}` : ''}</Text>
                      )}
                    </HStack>
                  </Box>
                  <HStack>
                    <NumberInput size="sm" maxW="120px" min={1} value={confirmQuantities[item._id] ?? 1} onChange={(val) => setConfirmQuantities(prev => ({ ...prev, [item._id]: Number(val) }))}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontWeight="semibold">${item.price}</Text>
                  </HStack>
                </HStack>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmClose}>Cancel</Button>
            <Button colorScheme="orange" isLoading={processingOrder} onClick={async () => {
              // call reserveOrder with quantities, then navigate to Payments page so user can record payment
              setProcessingOrder(true);
              try {
                const items = Object.keys(confirmQuantities).map(id => ({ id, qty: confirmQuantities[id] }));
                const { reserveOrder } = await import('../../../../services/productFollowupService');
                const res = await reserveOrder(productsDrawerItem._id, items);
                // update parent state: mark as processed; backend does not return followup payload here
                onUpdate(productsDrawerItem._id, { orderProcessed: true, reserved: res?.reservations || [] });
                setConfirmItems([]);
                setConfirmQuantities({});
                onConfirmClose();
                setProductsDrawerItem(null);
                onProductsClose();
                toast({ title: 'Order processed', description: 'Inventory updated and order recorded. Proceed to payment.', status: 'success', duration: 4000, isClosable: true });
                // Navigate to payments page with followup id as query so user can record payment
                try {
                  navigate(`/finance/payments?followup=${productsDrawerItem._id}`);
                } catch (navErr) {
                  console.warn('Navigation to payments failed', navErr);
                }
              } catch (err) {
                console.error('Order processing failed', err);
                toast({ title: 'Order failed', description: err?.response?.data?.message || 'Order processing failed', status: 'error', duration: 6000, isClosable: true });
              } finally {
                setProcessingOrder(false);
              }
            }}>Confirm and Process</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment modal removed: payment flow now initiated after confirming an order (navigates to Payments page) */}

      <Drawer isOpen={isOpen} placement="right" onClose={() => { setDrawerItem(null); onClose(); }} size={{ base: 'full', md: 'md' }}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{drawerItem ? drawerItem.productName : 'Product Followup'}</DrawerHeader>
          <DrawerBody>
            {drawerItem ? (
              <Box>
                <Text fontWeight="semibold" mb={2}>Supervisor Comment</Text>
                <Textarea value={drawerItem.supervisorComment || ''} onChange={(e) => setDrawerItem(prev => ({ ...prev, supervisorComment: e.target.value }))} placeholder="Enter supervisor comment..." rows={8} isDisabled={!(userRole === 'admin' || userRole === 'sales_manager')} />
                {!(userRole === 'admin' || userRole === 'sales_manager') && (
                  <Text mt={2} fontSize="sm" color="gray.500">Only users with Admin or Sales Manager role can edit this field.</Text>
                )}
              </Box>
            ) : (<Text>No item selected</Text>)}
          </DrawerBody>
          <DrawerFooter>
            <HStack spacing={3}>
              <Button colorScheme="teal" size="sm" onClick={() => {
                if (drawerItem) {
                  onUpdate(drawerItem._id, { supervisorComment: drawerItem.supervisorComment });
                }
                setDrawerItem(null);
                onClose();
              }} isDisabled={!(userRole === 'admin' || userRole === 'sales_manager')}>Save</Button>
              <Button variant="outline" size="sm" onClick={() => { setDrawerItem(null); onClose(); }}>Close</Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ProductFollowupTable;
