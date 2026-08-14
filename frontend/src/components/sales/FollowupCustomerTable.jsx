import React, { useEffect, useState, useRef } from 'react';
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
  Heading,
  useColorModeValue,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon, InfoIcon, SettingsIcon, DragHandleIcon } from '@chakra-ui/icons';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';

const TABLE_PREF_KEY = 'salesFollowupCustomerTablePrefs';
const TABLE_PREF_VERSION = 2;
const VIEW_PREF_KEY = 'salesFollowupCustomerViewMode';
const DEFAULT_COLUMNS = [
  { key: 'customerName', label: 'Customer Name', width: 150, required: true },
  { key: 'contactTitle', label: 'Training Title', width: 180 },
  { key: 'phone', label: 'Phone', width: 130 },
  { key: 'callStatus', label: 'Call Status', width: 112 },
  { key: 'followupStatus', label: 'Follow-up Status', width: 138 },
  { key: 'schedulePreference', label: 'Schedule', width: 108 },
  { key: 'packageScope', label: 'Package Scope', width: 126 },
  { key: 'date', label: 'Date', width: 120 },
  { key: 'email', label: 'Email', width: 190 },
  { key: 'note', label: 'Notes', width: 220 },
  { key: 'actions', label: 'Actions', width: 110, required: true }
];

const getDefaultColumnPrefs = () => ({
  version: TABLE_PREF_VERSION,
  order: DEFAULT_COLUMNS.map(column => column.key),
  hidden: [],
  widths: DEFAULT_COLUMNS.reduce((acc, column) => ({ ...acc, [column.key]: column.width }), {})
});

const createEmptyCustomer = () => ({
  customerName: '',
  contactTitle: '',
  phone: '',
  callStatus: 'Not Called',
  followupStatus: 'Pending',
  schedulePreference: 'Regular',
  email: '',
  note: '',
  supervisorComment: '',
  packageScope: 'Local'
});

const readColumnPrefs = () => {
  const defaults = getDefaultColumnPrefs();

  try {
    const saved = JSON.parse(localStorage.getItem(TABLE_PREF_KEY) || 'null');
    if (!saved) return defaults;
    if (saved.version !== TABLE_PREF_VERSION) return defaults;

    const knownKeys = DEFAULT_COLUMNS.map(column => column.key);
    const savedOrder = Array.isArray(saved.order) ? saved.order.filter(key => knownKeys.includes(key)) : [];
    const order = [...savedOrder, ...knownKeys.filter(key => !savedOrder.includes(key))];
    const hidden = Array.isArray(saved.hidden)
      ? saved.hidden.filter(key => knownKeys.includes(key) && !DEFAULT_COLUMNS.find(column => column.key === key)?.required)
      : [];

    return {
      order,
      hidden,
      version: TABLE_PREF_VERSION,
      widths: { ...defaults.widths, ...(saved.widths || {}) }
    };
  } catch {
    return defaults;
  }
};

const FollowupCustomerTable = ({ customers, courses, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const newCustomerRef = useRef(createEmptyCustomer());
  const [updatedCustomers, setUpdatedCustomers] = useState(new Set());
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [columnPrefs, setColumnPrefs] = useState(readColumnPrefs);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_PREF_KEY) || 'list');
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const warningCancelRef = useRef(null);
  const resizeRef = useRef(null);

  const userToken = localStorage.getItem('userToken');
  const userRole = localStorage.getItem('userRole') || 'agent';
  const headerColor = useColorModeValue('teal.800', 'teal.200');

  useEffect(() => {
    localStorage.setItem(TABLE_PREF_KEY, JSON.stringify(columnPrefs));
  }, [columnPrefs]);

  useEffect(() => {
    localStorage.setItem(VIEW_PREF_KEY, viewMode);
  }, [viewMode]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const canUserEditField = (field, role) => {
    // Agents/Sales can edit all fields except supervisorComment
    if (role === 'agent' || role === 'sales') return field !== 'supervisorComment';
    
    // Supervisors and admins can edit all fields
    if (role === 'supervisor' || role === 'admin') return true;
    
    // Default: no editing permissions
    return false;
  };

  // Commission calculation function
  const calculateCommission = (courseName, coursePrice) => {
    // Commission rate: 7%
    const commissionRate = 0.07;
    // Commission tax: 0.075% of commission
    const commissionTaxRate = 0.00075;
    
    // Calculate gross commission
    const price = Number(coursePrice) || 0;
    const grossCommission = price * commissionRate;
    // Calculate commission tax
    const commissionTax = grossCommission * commissionTaxRate;
    // Calculate net commission
    const netCommission = grossCommission - commissionTax;
    
    return {
      grossCommission: parseFloat(grossCommission.toFixed(2)),
      commissionTax: parseFloat(commissionTax.toFixed(2)),
      netCommission: parseFloat(netCommission.toFixed(2))
    };
  };

  // Find course by name and get its price
  const getCourseDetails = (courseName, courseId) => {
    if (!Array.isArray(courses)) return null;
    let course = null;
    if (courseId) {
      course = courses.find(c => c._id === courseId);
    }
    if (!course && courseName) {
      course = courses.find(c => c.name === courseName);
    }
    return course ? { id: course._id, name: course.name, price: Number(course.price) || 0 } : null;
  };

  const getCustomerCoursePrice = (customer) => {
    const courseDetails = getCourseDetails(customer?.contactTitle, customer?.courseId);
    const price = customer?.coursePrice ?? courseDetails?.price;
    const numericPrice = Number(price);

    return Number.isFinite(numericPrice) ? numericPrice : null;
  };

  const formatPrice = (price) => (
    price === null || price === undefined
      ? 'Price not set'
      : `ETB ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  const compactBadgeProps = {
    fontSize: '2xs',
    lineHeight: '1',
    px: 1.5,
    py: 1,
    borderRadius: 'sm',
    maxW: '100%',
    whiteSpace: 'nowrap'
  };

  const compactSelectProps = {
    size: 'xs',
    fontSize: 'xs',
    h: '26px',
    minH: '26px',
    px: 1
  };

  const columns = DEFAULT_COLUMNS.map(column => ({
    ...column,
    width: columnPrefs.widths[column.key] || column.width,
    isVisible: !columnPrefs.hidden.includes(column.key)
  }));
  const visibleColumns = columnPrefs.order
    .map(key => columns.find(column => column.key === key))
    .filter(column => column && column.isVisible);

  const toggleColumnVisibility = (key) => {
    const column = DEFAULT_COLUMNS.find(item => item.key === key);
    if (column?.required) return;

    setColumnPrefs(prev => {
      const isHidden = prev.hidden.includes(key);
      return {
        ...prev,
        hidden: isHidden ? prev.hidden.filter(item => item !== key) : [...prev.hidden, key]
      };
    });
  };

  const resetColumnLayout = () => {
    setColumnPrefs(getDefaultColumnPrefs());
  };

  const moveColumn = (fromKey, toKey) => {
    if (!fromKey || fromKey === toKey) return;

    setColumnPrefs(prev => {
      const order = [...prev.order];
      const fromIndex = order.indexOf(fromKey);
      const toIndex = order.indexOf(toKey);
      if (fromIndex === -1 || toIndex === -1) return prev;

      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, fromKey);
      return { ...prev, order };
    });
  };

  const startColumnResize = (event, key) => {
    event.preventDefault();
    event.stopPropagation();

    resizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnPrefs.widths[key] || DEFAULT_COLUMNS.find(column => column.key === key)?.width || 140
    };

    const handleMouseMove = (moveEvent) => {
      const activeResize = resizeRef.current;
      if (!activeResize) return;
      const nextWidth = Math.max(80, activeResize.startWidth + moveEvent.clientX - activeResize.startX);

      setColumnPrefs(prev => ({
        ...prev,
        widths: { ...prev.widths, [activeResize.key]: nextWidth }
      }));
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => () => {
    resizeRef.current = null;
  }, []);

  const handleCellClick = (customer, field) => {
    if (customer._saving) return;
    if (field === 'followupStatus' && (customer.followupStatus || '').toLowerCase() === 'completed') {
      return;
    }
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return;
    setEditingCell({ id: customer._id, field });
    setEditValue(customer[field] || '');
  };

  const handleSave = (customer, forcedValue = null) => {
    if (editingCell) {
      const value = forcedValue !== null ? forcedValue : editValue;

      if (editingCell.field === 'followupStatus' && value === 'Completed' && forcedValue === null) {
        setPendingStatusChange({ customer, value });
        setIsStatusWarningOpen(true);
        return;
      }

      const updated = { ...customer, [editingCell.field]: value };

      // If course selection changed, sync courseId/price
      if (editingCell.field === 'contactTitle') {
        const courseDetails = getCourseDetails(editValue);
        if (courseDetails) {
          updated.courseId = courseDetails.id;
          updated.coursePrice = courseDetails.price;
          // If already completed, refresh commission using current price
          if (updated.followupStatus === 'Completed') {
            updated.commission = calculateCommission(courseDetails.name, courseDetails.price);
          }
        }
      }

      // If we're updating the followupStatus to "Completed", calculate commission
      if (editingCell.field === 'followupStatus' && value === 'Completed') {
        const courseDetails = getCourseDetails(customer.contactTitle, customer.courseId);
        if (courseDetails) {
          const commission = calculateCommission(courseDetails.name, courseDetails.price);
          updated.commission = commission;
          updated.coursePrice = courseDetails.price;
          updated.courseId = courseDetails.id;
        }
      }

      onUpdate(customer._id, updated);
      // Track updated customer
      setUpdatedCustomers(prev => new Set(prev).add(customer._id));
      // Clear the indicator after 2 seconds
      setTimeout(() => {
        setUpdatedCustomers(prev => {
          const newSet = new Set(prev);
          newSet.delete(customer._id);
          return newSet;
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

  const cancelStatusWarning = () => {
    setIsStatusWarningOpen(false);
    setPendingStatusChange(null);
    setEditingCell(null);
    setEditValue('');
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      handleSave(pendingStatusChange.customer, pendingStatusChange.value);
    }
    setPendingStatusChange(null);
    setIsStatusWarningOpen(false);
  };

  const handleInputChange = (e) => setEditValue(e.target.value);

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    newCustomerRef.current[name] = value;
  };

  const closeNewCustomerRow = () => {
    newCustomerRef.current = createEmptyCustomer();
    setAddingRow(false);
  };

  const openNewCustomerRow = () => {
    newCustomerRef.current = createEmptyCustomer();
    setViewMode('list');
    setAddingRow(true);
  };

  const handleKeyDown = (e, customer) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(customer);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNewCustomerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewCustomer();
    } else if (e.key === 'Escape') {
      closeNewCustomerRow();
    }
  };

  const handleAddNewCustomer = () => {
    const newCustomer = newCustomerRef.current;
    // If the new customer has a "Completed" status, calculate commission
    let customerToAdd = { ...newCustomer };
    
    if (newCustomer.contactTitle) {
      const courseDetails = getCourseDetails(newCustomer.contactTitle);
      if (courseDetails) {
        customerToAdd.coursePrice = courseDetails.price;
        customerToAdd.courseId = courseDetails.id;
        if (newCustomer.followupStatus === 'Completed') {
          const commission = calculateCommission(courseDetails.name, courseDetails.price);
          customerToAdd.commission = commission;
        }
      }
    }
    
    onAdd(customerToAdd);
    closeNewCustomerRow();
  };

  const renderEditableCell = (customer, field, value, type = 'text') => {
    // Check if user can edit this field
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) {
      // If user cannot edit, just display the value
      return (
        <Td key={field}>
          {value}
        </Td>
      );
    }

    const handleBlur = () => {
      handleSave(customer);
    };

    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          {field === 'contactTitle' ? (
            <Select
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, customer)}
              autoFocus
              onBlur={handleBlur}
              {...compactSelectProps}
            >
              <option value="">Select a course</option>
              {(Array.isArray(courses) ? courses : []).map(course => (
                <option key={course._id} value={course.name}>
                  {course.name} - {formatPrice(Number(course.price) || 0)}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, customer)}
              autoFocus
              onBlur={handleBlur}
              {...compactSelectProps}
            >
              {field === 'callStatus' ? (
                <>
                  <option value="Called">Called</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
                  <option value="2x Called">2x Called</option>
                </>
              ) : field === 'schedulePreference' ? (
                <>
                  <option value="Regular">Regular</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night">Night</option>
                  <option value="Online">Online</option>
                </>
              ) : field === 'packageScope' ? (
                <>
                  <option value="Local">Local</option>
                  <option value="International">International</option>
                </>
              ) : (
                <>
                  <option value="Prospect">Prospect</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  {/* <option value="Imported">Imported</option> */}
                </>
              )}
            </Select>
          )}
        </Td>
      );
    }
    
    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, customer)}
            size="xs"
            rows={2}
            autoFocus
            onBlur={handleBlur}
            fontSize="sm"
            p={1}
          />
        </Td>
      );
    }
    
    return (
      <Td key={field} p={1}>
        <Input
          type={type}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, customer)}
          size="xs"
          autoFocus
          onBlur={handleBlur}
          fontSize="sm"
          p={1}
        />
      </Td>
    );
  };

  const renderNewCustomerCell = (field, value, type = 'text') => {
    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          {field === 'contactTitle' ? (
            <Select
              name={field}
              defaultValue={value}
              onChange={handleNewCustomerChange}
              onKeyDown={handleNewCustomerKeyDown}
              {...compactSelectProps}
            >
              <option value="">Select a course</option>
              {(Array.isArray(courses) ? courses : []).map(course => (
                <option key={course._id} value={course.name}>
                  {course.name} - {formatPrice(Number(course.price) || 0)}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              name={field}
              defaultValue={value}
              onChange={handleNewCustomerChange}
              onKeyDown={handleNewCustomerKeyDown}
              {...compactSelectProps}
            >
              {field === 'callStatus' ? (
                <>
                  <option value="Called">Called</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
                  <option value="2x Called">2x Called</option>
                </>
              ) : field === 'schedulePreference' ? (
                <>
                  <option value="Regular">Regular</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night">Night</option>
                  <option value="Online">Online</option>
                </>
              ) : field === 'packageScope' ? (
                <>
                  <option value="Local">Local</option>
                  <option value="International">International</option>
                </>
              ) : (
                <>
                  <option value="Prospect">Prospect</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Imported">Imported</option>
                </>
              )}
            </Select>
          )}
        </Td>
      );
    }
    
    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea
            name={field}
            defaultValue={value}
            onChange={handleNewCustomerChange}
            onKeyDown={handleNewCustomerKeyDown}
            size="xs"
            rows={2}
            fontSize="sm"
            p={1}
          />
        </Td>
      );
    }
    
    return (
      <Td key={field} p={1}>
        <Input
          type={type}
          name={field}
          defaultValue={value}
          onChange={handleNewCustomerChange}
          onKeyDown={handleNewCustomerKeyDown}
          size="xs"
          fontSize="sm"
          p={1}
        />
      </Td>
    );
  };

  const getStatusBadgeVariant = (status, type) => {
    if (type === 'call') {
      switch (status) {
        case 'Called': return 'green';
        case 'Not Called': return 'gray';
        case 'Busy': return 'red';
        case 'No Answer': return 'orange';
        case 'Callback': return 'purple';
        case '2x Called': return 'teal';
        default: return 'gray';
      }
    } else {
      switch (status) {
        case 'Prospect': return 'blue';
        case 'Completed': return 'green';
        case 'Pending': return 'yellow';
        case 'Scheduled': return 'purple';
        case 'Cancelled': return 'red';
        case 'Imported': return 'cyan';
        default: return 'gray';
      }
    }
  };

  const getScopeBadgeVariant = (scope) => {
    switch (scope) {
      case 'Local':
        return 'green';
      case 'International':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getCellBaseProps = (key) => ({
    p: 1.5,
    fontSize: 'xs',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  });

  const renderNewCustomerColumnCell = (column) => {
    const newCustomer = newCustomerRef.current;
    switch (column.key) {
      case 'customerName':
        return renderNewCustomerCell('customerName', newCustomer.customerName);
      case 'contactTitle':
        return renderNewCustomerCell('contactTitle', newCustomer.contactTitle, 'select');
      case 'phone':
        return renderNewCustomerCell('phone', newCustomer.phone);
      case 'callStatus':
        return renderNewCustomerCell('callStatus', newCustomer.callStatus, 'select');
      case 'followupStatus':
        return renderNewCustomerCell('followupStatus', newCustomer.followupStatus, 'select');
      case 'schedulePreference':
        return renderNewCustomerCell('schedulePreference', newCustomer.schedulePreference || 'Regular', 'select');
      case 'packageScope':
        return renderNewCustomerCell('packageScope', newCustomer.packageScope || 'Local', 'select');
      case 'date':
        return <Td key="date" {...getCellBaseProps('date')}>{formatDate(new Date().toISOString())}</Td>;
      case 'email':
        return renderNewCustomerCell('email', newCustomer.email);
      case 'note':
        return renderNewCustomerCell('note', newCustomer.note, 'textarea');
      case 'actions':
        return (
          <Td key="actions" p={1.5}>
            <IconButton
              icon={<CheckIcon />}
              colorScheme="green"
              size="xs"
              mr={1}
              onClick={handleAddNewCustomer}
              aria-label="Save customer"
            />
            <IconButton
              icon={<CloseIcon />}
              colorScheme="red"
              size="xs"
              onClick={closeNewCustomerRow}
              aria-label="Cancel"
            />
          </Td>
        );
      default:
        return null;
    }
  };

  const renderDisplayCell = (customer, field, children, extraProps = {}) => (
    <Td
      key={field}
      onClick={() => handleCellClick(customer, field)}
      _hover={{ cursor: 'pointer', bg: 'teal.50' }}
      {...getCellBaseProps(field)}
      {...extraProps}
    >
      {children}
    </Td>
  );

  const renderCustomerColumnCell = (customer, column) => {
    const { key } = column;

    if (editingCell && editingCell.id === customer._id && editingCell.field === key) {
      if (key === 'contactTitle' || key === 'callStatus' || key === 'followupStatus' || key === 'schedulePreference' || key === 'packageScope') {
        return renderEditableCell(customer, key, customer[key], 'select');
      }
      if (key === 'note') {
        return renderEditableCell(customer, 'note', customer.note, 'textarea');
      }
      return renderEditableCell(customer, key, customer[key]);
    }

    switch (key) {
      case 'customerName':
        return renderDisplayCell(customer, 'customerName', customer.customerName);
      case 'contactTitle':
        return renderDisplayCell(
          customer,
          'contactTitle',
          <Tooltip
            label={`${customer.contactTitle || 'No course selected'} - ${formatPrice(getCustomerCoursePrice(customer))}`}
            hasArrow
            placement="top"
            openDelay={250}
          >
            <Text as="span">{customer.contactTitle || 'Select course'}</Text>
          </Tooltip>
        );
      case 'phone':
        return renderDisplayCell(customer, 'phone', customer.phone);
      case 'callStatus':
        return renderDisplayCell(
          customer,
          'callStatus',
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} {...compactBadgeProps}>
            {customer.callStatus}
          </Badge>
        );
      case 'followupStatus':
        return renderDisplayCell(
          customer,
          'followupStatus',
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} {...compactBadgeProps}>
            {customer.followupStatus}
          </Badge>
        );
      case 'schedulePreference':
        return renderDisplayCell(customer, 'schedulePreference', customer.schedulePreference || 'Regular');
      case 'packageScope':
        return renderDisplayCell(
          customer,
          'packageScope',
          <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} {...compactBadgeProps}>
            {customer.packageScope || 'Local'}
          </Badge>
        );
      case 'date':
        return <Td key="date" {...getCellBaseProps('date')}>{customer.date ? formatDate(customer.date) : 'N/A'}</Td>;
      case 'email':
        return renderDisplayCell(customer, 'email', customer.email);
      case 'note':
        return renderDisplayCell(customer, 'note', customer.note);
      case 'actions':
        if (customer._saving) {
          return (
            <Td key="actions" p={1.5}>
              <Badge colorScheme="teal" variant="subtle" fontSize="2xs">Saving…</Badge>
            </Td>
          );
        }
        return (
          <Td key="actions" p={1.5} position="relative">
            {updatedCustomers.has(customer._id) && (
              <Box
                position="absolute"
                top="-2px"
                left="-2px"
                w="8px"
                h="8px"
                bg="green.500"
                borderRadius="50%"
                zIndex="1"
              />
            )}
            <HStack spacing={1} justify="flex-end">
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                size="xs"
                onClick={() => onDelete(customer._id)}
                aria-label="Delete customer"
                variant="outline"
              />
              <IconButton
                icon={<InfoIcon />}
                colorScheme="blue"
                size="xs"
                onClick={() => {
                  setDrawerCustomer(customer);
                  onOpen();
                }}
                aria-label="View details"
                variant="outline"
              />
            </HStack>
          </Td>
        );
      default:
        return null;
    }
  };

  const renderGridValue = (customer, column) => {
    switch (column.key) {
      case 'customerName':
        return customer.customerName || 'N/A';
      case 'contactTitle':
        return (
          <Tooltip
            label={`${customer.contactTitle || 'No course selected'} - ${formatPrice(getCustomerCoursePrice(customer))}`}
            hasArrow
            placement="top"
            openDelay={250}
          >
            <Text as="span" noOfLines={1}>{customer.contactTitle || 'Select course'}</Text>
          </Tooltip>
        );
      case 'phone':
        return customer.phone || 'N/A';
      case 'callStatus':
        return (
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} {...compactBadgeProps}>
            {customer.callStatus || 'N/A'}
          </Badge>
        );
      case 'followupStatus':
        return (
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} {...compactBadgeProps}>
            {customer.followupStatus || 'N/A'}
          </Badge>
        );
      case 'schedulePreference':
        return customer.schedulePreference || 'Regular';
      case 'packageScope':
        return (
          <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} {...compactBadgeProps}>
            {customer.packageScope || 'Local'}
          </Badge>
        );
      case 'date':
        return customer.date ? formatDate(customer.date) : 'N/A';
      case 'email':
        return customer.email || 'N/A';
      case 'note':
        return customer.note || 'N/A';
      default:
        return null;
    }
  };

  const renderGridCard = (customer) => {
    const fields = visibleColumns.filter(column => column.key !== 'actions');

    return (
      <Box
        key={customer._id}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        bg="white"
        p={3}
        boxShadow="xs"
        transition="border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease"
        _hover={{ borderColor: 'teal.300', boxShadow: 'sm', transform: 'translateY(-1px)' }}
        position="relative"
      >
        {updatedCustomers.has(customer._id) && (
          <Box position="absolute" top={2} right={2} w="8px" h="8px" bg="green.500" borderRadius="50%" />
        )}
        <Flex align="flex-start" gap={2} mb={2}>
          <Box minW={0} flex="1">
            <Text fontWeight="semibold" fontSize="sm" color={headerColor} noOfLines={1}>
              {customer.customerName || 'Unnamed customer'}
            </Text>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {customer.phone || customer.email || 'No contact info'}
            </Text>
          </Box>
          <HStack spacing={1}>
            <IconButton
              icon={<InfoIcon />}
              colorScheme="blue"
              size="xs"
              onClick={() => {
                setDrawerCustomer(customer);
                onOpen();
              }}
              aria-label="View details"
              variant="outline"
            />
            <IconButton
              icon={<DeleteIcon />}
              colorScheme="red"
              size="xs"
              onClick={() => onDelete(customer._id)}
              aria-label="Delete customer"
              variant="outline"
            />
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
          {fields.map(column => (
            <Box
              key={column.key}
              minW={0}
              p={2}
              borderRadius="md"
              bg="gray.50"
            >
              <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={0.5} noOfLines={1}>
                {column.label}
              </Text>
              <Text fontSize="xs" color="gray.800" noOfLines={column.key === 'note' ? 2 : 1}>
                {renderGridValue(customer, column)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  if ((!customers || customers.length === 0) && !addingRow) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>No customers found</Text>
        <Text mb={6}>Get started by adding a new customer.</Text>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openNewCustomerRow}>
          Add New Customer
        </Button>
      </Box>
    );
  }

  // Resolved course/commission values for drawer (display) fall back to catalog price
  const resolvedCourseDetails = drawerCustomer ? getCourseDetails(drawerCustomer.contactTitle, drawerCustomer.courseId) : null;
  const resolvedCoursePrice = drawerCustomer
    ? (drawerCustomer.coursePrice ?? resolvedCourseDetails?.price ?? null)
    : null;
  const resolvedCommission = drawerCustomer
    ? drawerCustomer.commission || (resolvedCoursePrice != null
        ? calculateCommission(drawerCustomer.contactTitle, resolvedCoursePrice)
        : null)
    : null;

  return (
    <Box w="100%">
      <Flex
        mb={3}
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={2}
        flexWrap="wrap"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        px={{ base: 2, md: 3 }}
        py={2}
        boxShadow="xs"
      >
        <Button 
          leftIcon={<AddIcon />}
          colorScheme="teal" 
          size="sm"
          minW={{ base: '100%', sm: 'auto' }}
          onClick={openNewCustomerRow}
          disabled={addingRow}
        >
          Add New Customer Row
        </Button>
        <HStack spacing={2} justify={{ base: 'space-between', sm: 'flex-end' }} w={{ base: '100%', sm: 'auto' }}>
          <HStack spacing={1} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={0.5} bg="gray.50">
            <Button
              size="xs"
              h="28px"
              minW="52px"
              colorScheme={viewMode === 'list' ? 'teal' : 'gray'}
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              size="xs"
              h="28px"
              minW="52px"
              colorScheme={viewMode === 'grid' ? 'teal' : 'gray'}
              variant={viewMode === 'grid' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('grid')}
              disabled={addingRow}
            >
              Grid
            </Button>
          </HStack>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} leftIcon={<SettingsIcon />} size="sm" variant="outline" minW="118px">
              Columns
            </MenuButton>
            <MenuList minW="240px" maxH="340px" overflowY="auto" zIndex="popover">
              {columns.map(column => (
                <MenuItem key={column.key} as="div" closeOnSelect={false}>
                  <Checkbox
                    isChecked={!columnPrefs.hidden.includes(column.key)}
                    isDisabled={column.required}
                    onChange={() => toggleColumnVisibility(column.key)}
                  >
                    {column.label}
                  </Checkbox>
                </MenuItem>
              ))}
              <MenuItem onClick={resetColumnLayout} fontWeight="semibold">
                Reset layout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      {viewMode === 'list' ? (
      <Box overflowX="auto" borderRadius="md" boxShadow="sm">
      <Table variant="simple" size="sm" minW={`${visibleColumns.reduce((sum, column) => sum + column.width, 0)}px`} sx={{ tableLayout: 'fixed' }}>
        <colgroup>
          {visibleColumns.map(column => (
            <col key={column.key} style={{ width: `${column.width}px` }} />
          ))}
        </colgroup>
        <Thead>
          <Tr bg="teal.500">
            {visibleColumns.map(column => (
              <Th
                key={column.key}
                color="white"
                fontWeight="bold"
                textTransform="uppercase"
                fontSize="xs"
                letterSpacing="wider"
                py={2}
                px={1.5}
                position="relative"
                userSelect="none"
                draggable
                opacity={draggedColumn === column.key ? 0.75 : 1}
                cursor={draggedColumn === column.key ? 'grabbing' : 'grab'}
                bg={dragOverColumn === column.key && draggedColumn !== column.key ? 'teal.600' : undefined}
                boxShadow={dragOverColumn === column.key && draggedColumn !== column.key ? 'inset 3px 0 0 rgba(255,255,255,0.95)' : 'none'}
                transform={draggedColumn === column.key ? 'translateY(-2px)' : 'translateY(0)'}
                transition="background 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, transform 0.18s ease"
                onDragStart={(event) => {
                  setDraggedColumn(column.key);
                  setDragOverColumn(column.key);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverColumn(column.key);
                }}
                onDragEnter={() => setDragOverColumn(column.key)}
                onDrop={() => {
                  moveColumn(draggedColumn, column.key);
                  setDraggedColumn(null);
                  setDragOverColumn(null);
                }}
                onDragLeave={() => {
                  if (dragOverColumn === column.key) {
                    setDragOverColumn(null);
                  }
                }}
                onDragEnd={() => {
                  setDraggedColumn(null);
                  setDragOverColumn(null);
                }}
              >
                <HStack spacing={1.5} minW={0} pointerEvents="none">
                  <DragHandleIcon boxSize={2.5} opacity={0.85} flexShrink={0} />
                  <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {column.label}
                  </Text>
                </HStack>
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  w="8px"
                  h="100%"
                  cursor="col-resize"
                  _hover={{ bg: 'whiteAlpha.400' }}
                  onMouseDown={(event) => startColumnResize(event, column.key)}
                />
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {addingRow && (
            <Tr bg="gray.100">
              {visibleColumns.map(renderNewCustomerColumnCell)}
            </Tr>
          )}

          {customers && customers.map(customer => (
            <Tr 
              key={customer._id} 
              _hover={{ bg: 'gray.50' }}
              transition="background 0.2s"
              fontSize="sm"
              borderBottom="1px"
              borderColor="gray.200"
            >
              {visibleColumns.map(column => renderCustomerColumnCell(customer, column))}
              {false && <>
              {editingCell && editingCell.id === customer._id && editingCell.field === 'contactTitle' 
                ? renderEditableCell(customer, 'contactTitle', customer.contactTitle, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'contactTitle')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    <Tooltip
                      label={`${customer.contactTitle || 'No course selected'} • ${formatPrice(getCustomerCoursePrice(customer))}`}
                      hasArrow
                      placement="top"
                      openDelay={250}
                    >
                      <Text as="span">{customer.contactTitle || 'Select course'}</Text>
                    </Tooltip>
                  </Td>
                )}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'phone' 
                ? renderEditableCell(customer, 'phone', customer.phone)
                : <Td onClick={() => handleCellClick(customer, 'phone')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{customer.phone}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'callStatus' 
                ? renderEditableCell(customer, 'callStatus', customer.callStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'callStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} fontSize="xs" px={2} py={1}>
                      {customer.callStatus}
                    </Badge>
                  </Td>
                )}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'followupStatus' 
                ? renderEditableCell(customer, 'followupStatus', customer.followupStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'followupStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} fontSize="xs" px={2} py={1}>
                      {customer.followupStatus}
                    </Badge>
                  </Td>
                )}

              {editingCell && editingCell.id === customer._id && editingCell.field === 'schedulePreference' 
                ? renderEditableCell(customer, 'schedulePreference', customer.schedulePreference || 'Regular', 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'schedulePreference')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    {customer.schedulePreference || 'Regular'}
                  </Td>
                )}
              {editingCell && editingCell.id === customer._id && editingCell.field === 'packageScope'
                ? renderEditableCell(customer, 'packageScope', customer.packageScope || 'Local', 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'packageScope')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} fontSize="xs" px={2} py={1}>
                      {customer.packageScope || 'Local'}
                    </Badge>
                  </Td>
                )}
              
              <Td p={2} fontSize="xs">{customer.date ? formatDate(customer.date) : 'N/A'}</Td>
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'email' 
                ? renderEditableCell(customer, 'email', customer.email)
                : <Td onClick={() => handleCellClick(customer, 'email')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.email}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'note' 
                ? renderEditableCell(customer, 'note', customer.note, 'textarea')
                : <Td onClick={() => handleCellClick(customer, 'note')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.note}</Td>}
              
              <Td p={2} position="relative">
                {updatedCustomers.has(customer._id) && (
                  <Box 
                    position="absolute" 
                    top="-2px" 
                    left="-2px" 
                    w="8px" 
                    h="8px" 
                    bg="green.500" 
                    borderRadius="50%" 
                    zIndex="1"
                  />
                )}
                <HStack spacing={1} justify="flex-end">
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="xs"
                    onClick={() => onDelete(customer._id)}
                    aria-label="Delete customer"
                    variant="outline"
                  />
                  <IconButton
                    icon={<InfoIcon />}
                    colorScheme="blue"
                    size="xs"
                    onClick={() => {
                      setDrawerCustomer(customer);
                      onOpen();
                    }}
                    aria-label="View details"
                    variant="outline"
                  />
                </HStack>
              </Td>
              </>}
            </Tr>
          ))}
        </Tbody>
      </Table>
      </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
          {customers && customers.map(renderGridCard)}
        </SimpleGrid>
      )}

      <AlertDialog
        isOpen={isStatusWarningOpen}
        leastDestructiveRef={warningCancelRef}
        onClose={cancelStatusWarning}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Status Change
            </AlertDialogHeader>
            <AlertDialogBody>
              Marking this follow-up as <strong>Completed</strong> will finalize the sale.
              Please ensure all notes and payments are recorded before proceeding.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={warningCancelRef} onClick={cancelStatusWarning}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmStatusChange} ml={3}>
                Confirm Completed
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Customer Details Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader bg="teal.500" color="white">
            Customer Details
          </DrawerHeader>
          <DrawerBody p={0}>
            {drawerCustomer && (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {/* Basic Information Section */}
                <Box p={6}>
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                    Basic Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Customer Name</Text>
                      <Text fontSize="md">{drawerCustomer.customerName || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Training Title</Text>
                      <Text fontSize="md">{drawerCustomer.contactTitle || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Course Price</Text>
                      <Text fontSize="md">
                        {resolvedCoursePrice != null ? `ETB ${Number(resolvedCoursePrice).toLocaleString()}` : 'Add price in catalog'}
                      </Text>
                      {resolvedCoursePrice == null && (
                        <Text fontSize="xs" color="orange.600">Set a course price in Finance to enable commission.</Text>
                      )}
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Phone</Text>
                      <Text fontSize="md">{drawerCustomer.phone || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Email</Text>
                      <Text fontSize="md">{drawerCustomer.email || 'N/A'}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Status Information Section */}
                <Box p={6} bg="gray.50">
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.300">
                    Status Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Call Status</Text>
                      <Badge variant="solid" colorScheme={getStatusBadgeVariant(drawerCustomer.callStatus, 'call')} fontSize="md">
                        {drawerCustomer.callStatus || 'N/A'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Follow-up Status</Text>
                      <Badge variant="solid" colorScheme={getStatusBadgeVariant(drawerCustomer.followupStatus, 'followup')} fontSize="md">
                        {drawerCustomer.followupStatus || 'N/A'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Schedule Preference</Text>
                      <Text fontSize="md">{drawerCustomer.schedulePreference || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Date</Text>
                      <Text fontSize="md">{drawerCustomer.date ? formatDate(drawerCustomer.date) : 'N/A'}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Commission Information Section - Only show if customer has completed status */}
                {drawerCustomer.followupStatus === 'Completed' && (
                  <Box p={6}>
                    <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                      Commission Details
                    </Heading>
                    <VStack align="stretch" spacing={4}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                          <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Course Price</Text>
                          <Text fontSize="xl" fontWeight="bold" color="blue.600">
                            {resolvedCoursePrice != null ? `ETB ${Number(resolvedCoursePrice).toFixed(2)}` : 'Add price in catalog'}
                          </Text>
                        </Box>
                        <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.100">
                          <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Gross Commission (7%)</Text>
                          <Text fontSize="xl" fontWeight="bold" color="green.600">
                            ETB {resolvedCommission?.grossCommission ? resolvedCommission.grossCommission.toFixed(2) : '0.00'}
                          </Text>
                        </Box>
                      </SimpleGrid>
                      
                      {resolvedCommission ? (
                        <>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box p={4} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.100">
                              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Commission Tax (0.075%)</Text>
                              <Text fontSize="xl" fontWeight="bold" color="orange.600">
                                ETB {resolvedCommission?.commissionTax ? resolvedCommission.commissionTax.toFixed(2) : '0.00'}
                              </Text>
                            </Box>
                            <Box p={4} bg="teal.50" borderRadius="md" border="1px" borderColor="teal.100">
                              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Net Commission</Text>
                              <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                                ETB {resolvedCommission?.netCommission ? resolvedCommission.netCommission.toFixed(2) : '0.00'}
                              </Text>
                            </Box>
                          </SimpleGrid>
                        </>
                      ) : (
                        <Text fontSize="sm" color="gray.500">Commission data not available</Text>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Notes Section */}
                <Box p={6}>
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                    Notes
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>Customer Notes</Text>
                      <Box p={3} bg="gray.50" borderRadius="md" minH="60px">
                        <Text whiteSpace="pre-wrap" fontSize="sm">
                          {drawerCustomer.note || 'No notes available'}
                        </Text>
                      </Box>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>Supervisor Comment</Text>
                      <Box p={3} bg="gray.50" borderRadius="md" minH="60px">
                        <Text whiteSpace="pre-wrap" fontSize="sm">
                          {drawerCustomer.supervisorComment || 'No comments available'}
                        </Text>
                      </Box>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter bg="gray.50">
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default FollowupCustomerTable;
