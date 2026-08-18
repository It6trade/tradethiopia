import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
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
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiAward,
  FiCalendar,
  FiEdit3,
  FiFilter,
  FiPlay,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSliders,
  FiTrendingUp,
  FiUserCheck,
} from 'react-icons/fi';
import AwardsPanel from '../components/AwardsPanel';
import { useUserStore } from '../store/user';
import {
  calculateAwards,
  getMonthlyPerformances,
  updatePerformance,
} from '../services/awardService';

const ADMIN_ROLES = new Set(['admin', 'hr', 'coo']);

const getCurrentMonth = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
};

const AwardsPage = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [awardsPublished, setAwardsPublished] = useState(false);
  const [awardCount, setAwardCount] = useState(0);
  const [calculating, setCalculating] = useState(false);

  // Performance Management Drawer State
  const { isOpen: isManageOpen, onOpen: onManageOpen, onClose: onManageClose } = useDisclosure();
  const [performances, setPerformances] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageSearch, setManageSearch] = useState('');
  const [manageDeptFilter, setManageDeptFilter] = useState('all');

  // Edit Single Performance Modal State
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingPerf, setEditingPerf] = useState(null);
  const [editFormData, setEditFormData] = useState({ target: 10, actual: 0, notes: '' });
  const [editSaving, setEditSaving] = useState(false);

  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);

  const canCalculate = currentUser
    ? ADMIN_ROLES.has((currentUser.role || currentUser.normalizedRole || '').toLowerCase())
    : false;

  useEffect(() => {
    setAwardsPublished(false);
  }, [month]);

  // Load performances for HR configuration drawer
  const loadPerformances = async () => {
    if (!month) return;
    setManageLoading(true);
    try {
      const res = await getMonthlyPerformances(month);
      if (res && res.success) {
        setPerformances(res.data || []);
      } else {
        toast({
          title: 'Failed to load employee metrics',
          description: res?.message || 'Could not fetch monthly performances',
          status: 'error',
          duration: 4000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error loading metrics',
        description: err?.response?.data?.message || err?.message || 'Failed to fetch metrics',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setManageLoading(false);
    }
  };

  const handleOpenManager = () => {
    onManageOpen();
    loadPerformances();
  };

  const handleCalculate = async (recalculate = false) => {
    if (!month || !canCalculate) return;
    const confirmMsg = recalculate
      ? `Recalculate & re-publish awards for ${month}? This will sync latest operational data and update all scores.`
      : `Publish monthly awards for ${month}? This will score employee performance and select winners.`;
    
    if (!window.confirm(confirmMsg)) return;

    setCalculating(true);
    try {
      const res = await calculateAwards(month, recalculate);
      if (res && res.success) {
        toast({
          title: 'Awards Published Successfully',
          description: `Generated ${res.data?.length ?? 0} department & company awards for ${month}.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setRefreshKey((prev) => prev + 1);
        if (isManageOpen) {
          loadPerformances();
        }
      } else {
        toast({
          title: 'Calculation Failed',
          description: res?.message || 'Unable to publish awards',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error Publishing Awards',
        description: err?.response?.data?.message || err?.message || 'Failed to publish awards',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculating(false);
    }
  };

  const openEditModal = (perf) => {
    setEditingPerf(perf);
    setEditFormData({
      target: perf.target || 10,
      actual: perf.actual || 0,
      notes: perf.notes || '',
    });
    onEditOpen();
  };

  const handleSaveEdit = async () => {
    if (!editingPerf) return;
    setEditSaving(true);
    try {
      const res = await updatePerformance(editingPerf._id, editFormData);
      if (res && res.success) {
        toast({
          title: 'Performance Updated',
          description: `Updated metrics for ${editingPerf.employeeId?.fullName || editingPerf.employeeId?.username}`,
          status: 'success',
          duration: 3000,
        });
        onEditClose();
        loadPerformances();
        setRefreshKey((prev) => prev + 1);
      } else {
        toast({
          title: 'Update Failed',
          description: res?.message || 'Could not save performance updates',
          status: 'error',
          duration: 4000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error Saving Update',
        description: err?.response?.data?.message || err?.message || 'Failed to update performance',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleAwardsLoaded = (list) => {
    const hasAwards = Boolean(list && list.length > 0);
    setAwardsPublished(hasAwards);
    setAwardCount(list ? list.length : 0);
  };

  const filteredPerformances = performances.filter((p) => {
    const name = (p.employeeId?.fullName || p.employeeId?.username || '').toLowerCase();
    const dept = (p.department || '').toLowerCase();
    const matchesSearch = name.includes(manageSearch.toLowerCase()) || dept.includes(manageSearch.toLowerCase());
    const matchesDept = manageDeptFilter === 'all' || p.department === manageDeptFilter;
    return matchesSearch && matchesDept;
  });

  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      {/* Header Banner */}
      <Card bg={headerBg} border="1px solid" borderColor={borderColor} shadow="sm" mb={6}>
        <CardBody p={{ base: 4, md: 5 }}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={4}
          >
            <HStack spacing={4}>
              <Flex
                w="48px"
                h="48px"
                bg="yellow.100"
                color="yellow.700"
                borderRadius="xl"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FiAward} boxSize={6} />
              </Flex>
              <Box>
                <Heading size="md" fontWeight="bold" color="gray.900">
                  Employee Performance & Awards
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Live operational KPI tracking, monthly performance evaluations, and department recognition
                </Text>
              </Box>
            </HStack>

            <HStack spacing={3} flexWrap="wrap">
              <HStack spacing={2}>
                <Icon as={FiCalendar} color="gray.500" />
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  max={getCurrentMonth()}
                  w="170px"
                  size="sm"
                  borderRadius="md"
                />
              </HStack>

              {canCalculate && (
                <>
                  <Button
                    leftIcon={<Icon as={FiSliders} />}
                    variant="outline"
                    colorScheme="teal"
                    size="sm"
                    onClick={handleOpenManager}
                  >
                    Configure KPIs
                  </Button>

                  <Button
                    leftIcon={<Icon as={FiPlay} />}
                    colorScheme="teal"
                    size="sm"
                    onClick={() => handleCalculate(awardsPublished)}
                    isLoading={calculating}
                    loadingText="Publishing..."
                  >
                    {awardsPublished ? 'Recalculate & Publish' : `Calculate Awards (${month})`}
                  </Button>
                </>
              )}

              <IconButton
                icon={<Icon as={FiRefreshCw} />}
                variant="outline"
                size="sm"
                aria-label="Refresh awards"
                onClick={() => setRefreshKey((prev) => prev + 1)}
              />
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Status banner if published */}
      {awardsPublished && (
        <Alert status="success" borderRadius="lg" mb={6} variant="left-accent">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="semibold" fontSize="sm">
              Awards for {month} are active and published.
            </Text>
            <Text fontSize="xs" color="gray.600">
              Evaluated across authentic sales, IT tasks, content deliverables, and attendance metrics ({awardCount} awards).
            </Text>
          </Box>
          <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
            Published
          </Badge>
        </Alert>
      )}

      {/* Main Awards & Rankings Panel */}
      <AwardsPanel
        month={month}
        refreshKey={refreshKey}
        onAwardsLoaded={handleAwardsLoaded}
      />

      {/* HR/Employer KPI Management Drawer */}
      <Drawer isOpen={isManageOpen} placement="right" size="xl" onClose={onManageClose}>
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={3}>
              <Icon as={FiSliders} color="teal.500" />
              <Box>
                <Text fontSize="md" fontWeight="bold">Employee Monthly KPI Evaluations</Text>
                <Text fontSize="xs" color="gray.500">Evaluation Period: {month}</Text>
              </Box>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={4}>
            {/* Search & Filter */}
            <Flex gap={3} mb={4} direction={{ base: 'column', sm: 'row' }}>
              <InputGroup size="sm" flex="1">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search employee or department..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  borderRadius="md"
                />
              </InputGroup>

              <Select
                size="sm"
                w={{ base: 'full', sm: '180px' }}
                value={manageDeptFilter}
                onChange={(e) => setManageDeptFilter(e.target.value)}
                borderRadius="md"
              >
                <option value="all">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="IT">IT</option>
                <option value="SocialMedia">Social Media</option>
                <option value="CustomerSuccess">Customer Success</option>
                <option value="TradeXTV">TradeXTV</option>
                <option value="Operations">Operations</option>
              </Select>

              <Button
                size="sm"
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={loadPerformances}
                isLoading={manageLoading}
              >
                Sync Data
              </Button>
            </Flex>

            {manageLoading ? (
              <Flex justify="center" align="center" py={12}>
                <Spinner color="teal.500" size="lg" />
              </Flex>
            ) : filteredPerformances.length === 0 ? (
              <Box p={6} textAlign="center" bg="gray.50" borderRadius="lg">
                <Text fontSize="sm" color="gray.500">No employee records found for this criteria.</Text>
              </Box>
            ) : (
              <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="lg">
                <Table size="sm" variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Employee</Th>
                      <Th>Department</Th>
                      <Th isNumeric>Target</Th>
                      <Th isNumeric>Actual</Th>
                      <Th isNumeric>Attendance</Th>
                      <Th isNumeric>Score</Th>
                      <Th textAlign="center">Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPerformances.map((perf) => (
                      <Tr key={perf._id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <HStack spacing={2.5}>
                            <Avatar size="xs" name={perf.employeeId?.fullName || perf.employeeId?.username} />
                            <Box>
                              <Text fontWeight="semibold" fontSize="xs">
                                {perf.employeeId?.fullName || perf.employeeId?.username || 'Employee'}
                              </Text>
                              <Text fontSize="10px" color="gray.500">
                                {perf.employeeId?.email}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="purple" fontSize="10px" px={2} py={0.5} borderRadius="md">
                            {perf.department}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="medium">{perf.target || 0}</Td>
                        <Td isNumeric fontWeight="bold" color="teal.600">{perf.actual || 0}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={(perf.attendanceScore || 100) >= 90 ? 'green' : 'orange'} fontSize="10px">
                            {perf.attendanceScore || 100}%
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color={perf.score >= 80 ? 'green.600' : 'gray.800'}>
                            {perf.score?.toFixed(1) || '0.0'}%
                          </Text>
                        </Td>
                        <Td textAlign="center">
                          <Button
                            size="xs"
                            leftIcon={<Icon as={FiEdit3} />}
                            colorScheme="teal"
                            variant="ghost"
                            onClick={() => openEditModal(perf)}
                          >
                            Edit
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <HStack spacing={3}>
              <Button variant="outline" size="sm" onClick={onManageClose}>
                Close
              </Button>
              <Button
                colorScheme="teal"
                size="sm"
                leftIcon={<Icon as={FiPlay} />}
                onClick={() => handleCalculate(true)}
                isLoading={calculating}
              >
                Recalculate & Publish Awards
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Performance Record Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="xl">
          <ModalHeader pb={2}>
            <Text fontSize="md" fontWeight="bold">Adjust Employee KPI Metrics</Text>
            <Text fontSize="xs" color="gray.500">
              {editingPerf?.employeeId?.fullName || editingPerf?.employeeId?.username} • {editingPerf?.department}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch" py={2}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="semibold">Monthly Work Target (Quota)</FormLabel>
                <NumberInput
                  min={0}
                  value={editFormData.target}
                  onChange={(_, val) => setEditFormData((prev) => ({ ...prev, target: val || 0 }))}
                >
                  <NumberInputField borderRadius="md" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="semibold">Actual Achievements / Completed Items</FormLabel>
                <NumberInput
                  min={0}
                  value={editFormData.actual}
                  onChange={(_, val) => setEditFormData((prev) => ({ ...prev, actual: val || 0 }))}
                >
                  <NumberInputField borderRadius="md" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="semibold">HR Evaluation / Manager Note</FormLabel>
                <Textarea
                  placeholder="e.g. Exceptional leadership in project deployment or adjusted for verified offline deals"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  borderRadius="md"
                  fontSize="sm"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter pt={2}>
            <Button variant="ghost" mr={3} size="sm" onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              size="sm"
              leftIcon={<Icon as={FiSave} />}
              onClick={handleSaveEdit}
              isLoading={editSaving}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AwardsPage;
