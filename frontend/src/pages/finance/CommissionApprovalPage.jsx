import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Badge,
  HStack,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Stack,
  Select
} from '@chakra-ui/react';
import { fetchPendingCommissions, approveCommission } from '../../services/packageService';
import { fetchUsers } from '../../services/api';

const CommissionApprovalPage = () => {
  const getDefaultEditValues = () => ({
    packageValue: 0,
    firstCommission: 0,
    secondCommission: 0,
    agentId: '',
    agentName: ''
  });
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingCommission, setApprovingCommission] = useState(null);
  const [selectedPart, setSelectedPart] = useState('first');
  const [editCommission, setEditCommission] = useState(null);
  const [editValues, setEditValues] = useState(getDefaultEditValues());
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [agents, setAgents] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCommission, setSelectedCommission] = useState(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  useEffect(() => {
    const loadCommissions = async () => {
      try {
        setLoading(true);
        const data = await fetchPendingCommissions();
        
        const commissionEntries = (Array.isArray(data) ? data : []).map((entry) => {
          const firstCommission = Number(entry.firstCommission) || 0;
          const secondCommission = Number(entry.secondCommission) || 0;
          const netCommission = Number(entry.netCommission) || (firstCommission + secondCommission);
          const firstApproved = Boolean(entry.firstApproved);
          const secondApproved = Boolean(entry.secondApproved);
          const status = entry.status || (
            firstApproved && secondApproved ? 'approved'
              : firstApproved || secondApproved ? 'partial'
                : 'pending'
          );

          return {
            id: entry.id,
            customerId: entry.customerId,
            customerName: entry.customerName,
            agent: entry.agent || entry.agentName || 'Unassigned',
            agentId: entry.agentId,
            packageType: entry.packageType,
            packageName: entry.packageName,
            packageValue: Number(entry.packageValue) || 0,
            grossCommission: Number(entry.grossCommission) || (netCommission + (Number(entry.commissionTax) || 0)),
            commissionTax: Number(entry.commissionTax) || 0,
            netCommission,
            firstCommission,
            secondCommission,
            date: entry.date || entry.createdAt || new Date(),
            status,
            firstStatus: entry.firstStatus || (firstApproved ? 'approved' : 'pending'),
            secondStatus: entry.secondStatus || (secondApproved ? 'approved' : 'pending'),
            firstApproved,
            secondApproved,
            approved: Boolean(entry.approved) || (firstApproved && secondApproved)
          };
        });
        
        setCommissions(commissionEntries);
        setError(null);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to fetch commissions';
        setError(message);
        console.error('Error fetching commissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCommissions();
  }, []);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const users = await fetchUsers();
        const agentRoles = ['sales', 'salesmanager', 'finance', 'admin'];
        if (Array.isArray(users)) {
          const filtered = users.filter(user => {
            const role = (user.role || '').toLowerCase();
            return agentRoles.includes(role);
          });
          const sorted = filtered.sort((a, b) => {
            const nameA = (a.fullName || a.username || '').toLowerCase();
            const nameB = (b.fullName || b.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setAgents(sorted);
        }
      } catch (err) {
        console.warn('Failed to load agents for commission edits', err);
      }
    };

    loadAgents();
  }, []);

  const handleApproveCommission = (commission, part) => {
    setSelectedCommission(commission);
    setSelectedPart(part);
    onOpen();
  };

  const confirmApproveCommission = async () => {
    if (!selectedCommission) return;
    try {
      const identifier = `${selectedPart}-${selectedCommission.id}`;
      setApprovingCommission(identifier);
      const partField = selectedPart === 'first' ? 'firstCommission' : 'secondCommission';
      const partAmount = selectedCommission?.[partField] || 0;
      
      // Make API call to approve commission and add to payroll
      await approveCommission(selectedCommission.id, {
        agentId: selectedCommission.agentId,
        firstCommission: selectedCommission.firstCommission,
        secondCommission: selectedCommission.secondCommission,
        part: selectedPart,
        amount: partAmount
      });
      
      // Update the commission status in our local state
      setCommissions(prev => prev.map(comm => {
        if (comm.id !== selectedCommission.id) return comm;

        const firstApproved = selectedPart === 'first' ? true : comm.firstApproved;
        const secondApproved = selectedPart === 'second' ? true : comm.secondApproved;
        const status = firstApproved && secondApproved
          ? 'approved'
          : firstApproved || secondApproved
            ? 'partial'
            : 'pending';

        return {
          ...comm,
          firstApproved,
          secondApproved,
          firstStatus: firstApproved ? 'approved' : comm.firstStatus,
          secondStatus: secondApproved ? 'approved' : comm.secondStatus,
          status,
          approved: firstApproved && secondApproved,
        };
      }));
      
      toast({
        title: 'Commission approved',
        description: `Commission for ${selectedCommission.customerName} has been approved and added to payroll.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      onClose();
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err.message || 'Failed to approve commission',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setApprovingCommission(null);
    }
  };

  const handleEditChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  const handleAgentSelection = (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    const displayName = agent ? (agent.fullName || agent.username || 'Agent') : '';
    setEditValues(prev => ({
      ...prev,
      agentId: agentId || '',
      agentName: displayName
    }));
  };

  const handleEditClose = () => {
    onEditClose();
    setEditCommission(null);
    setEditValues(getDefaultEditValues());
  };

  const handleSaveEdit = () => {
    if (!editCommission) return;
    setIsSavingEdit(true);

    const updatedCommissions = commissions.map((comm) => {
      if (comm.id !== editCommission.id) return comm;
      const updatedNet = Number(editValues.firstCommission || 0) + Number(editValues.secondCommission || 0);
      const updatedGross = updatedNet + Number(comm.commissionTax || 0);
      const selectedAgent = agents.find(a => a._id === editValues.agentId);
      const agentDisplayName = editValues.agentName ||
        selectedAgent?.fullName ||
        selectedAgent?.username ||
        'Unassigned';
      const updatedAgentId = editValues.agentId || '';

      return {
        ...comm,
        packageValue: Number(editValues.packageValue || 0),
        firstCommission: Number(editValues.firstCommission || 0),
        secondCommission: Number(editValues.secondCommission || 0),
        netCommission: updatedNet,
        grossCommission: updatedGross,
        agentId: updatedAgentId,
        agent: agentDisplayName
      };
    });

    setCommissions(updatedCommissions);
    toast({
      title: 'Commission edited',
      description: `Updated split for ${editCommission.customerName}.`,
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    setIsSavingEdit(false);
    handleEditClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'partial': return 'purple';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // Calculate totals for summary cards
  const totalPending = commissions.filter(c => c.status !== 'approved').reduce((sum, c) => sum + c.netCommission, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.netCommission, 0);
  const totalCount = commissions.length;
  const selectedPartLabel = selectedPart === 'first' ? 'First Commission' : 'Second Commission';
  const selectedPartAmount = selectedCommission ? selectedCommission[selectedPart === 'first' ? 'firstCommission' : 'secondCommission'] : 0;
  const editNetCommission = Number(editValues.firstCommission || 0) + Number(editValues.secondCommission || 0);
  const editGrossCommission = editNetCommission + Number(editCommission?.commissionTax || 0);
  const filteredCommissions = commissions.filter((comm) => {
    if (filterType === 'first') return !comm.firstApproved;
    if (filterType === 'second') return !comm.secondApproved;
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" color="teal.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Card>
          <CardBody>
            <Text color="red.500" textAlign="center">
              Error: {error}
            </Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Commission Approval</Heading>
      </Flex>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Commissions</StatLabel>
              <StatNumber>{totalCount}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Approval</StatLabel>
              <StatNumber color="yellow.500">ETB {totalPending.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Approved</StatLabel>
              <StatNumber color="green.500">ETB {totalApproved.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardBody>
          <Flex mb={4} justify="flex-end" align="center">
            <FormControl maxW="xs">
              <FormLabel mb={1} fontSize="xs">Filter commissions</FormLabel>
              <Select
                size="sm"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
              >
                <option value="all">All</option>
                <option value="first">Needs first commission</option>
                <option value="second">Needs second commission</option>
              </Select>
            </FormControl>
          </Flex>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr bg="teal.500">
                  <Th color="white">Agent</Th>
                  <Th color="white">Customer</Th>
                  <Th color="white">Package</Th>
                  <Th color="white">Package Value</Th>
                  <Th color="white">First Commission</Th>
                  <Th color="white">Second Commission</Th>
                  <Th color="white">Total Commission</Th>
                  <Th color="white">Date</Th>
                  <Th color="white">Status</Th>
                  <Th color="white">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((commission) => (
                    <Tr key={commission.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontWeight="semibold">{commission.agent}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {commission.agentId}
                        </Text>
                      </Td>
                      <Td>
                        <Text>{commission.customerName}</Text>
                      </Td>
                      <Td>
                        <Text>{commission.packageName}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Type {commission.packageType}
                        </Text>
                      </Td>
                      <Td>ETB {commission.packageValue.toFixed(2)}</Td>
                      <Td>ETB {commission.firstCommission.toFixed(2)}</Td>
                      <Td>ETB {commission.secondCommission.toFixed(2)}</Td>
                      <Td>ETB {commission.netCommission.toFixed(2)}</Td>
                      <Td>
                        {new Date(commission.date).toLocaleDateString()}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="stretch" spacing={2}>
                          {commission.firstApproved ? (
                            <Badge colorScheme="green" textAlign="center">
                              First Approved
                            </Badge>
                          ) : (
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => handleApproveCommission(commission, 'first')}
                              isLoading={approvingCommission === `first-${commission.id}`}
                            >
                              Approve First Commission
                            </Button>
                          )}
                          {commission.secondApproved ? (
                            <Badge colorScheme="green" textAlign="center">
                              Second Approved
                          </Badge>
                        ) : (
                          <Button
                            size="xs"
                            colorScheme="purple"
                            onClick={() => handleApproveCommission(commission, 'second')}
                            isLoading={approvingCommission === `second-${commission.id}`}
                          >
                            Approve Second Commission
                          </Button>
                          )}
                        </VStack>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => {
                            setEditCommission(commission);
                            setEditValues({
                              packageValue: Number(commission.packageValue) || 0,
                              firstCommission: Number(commission.firstCommission) || 0,
                              secondCommission: Number(commission.secondCommission) || 0,
                              agentId: commission.agentId || '',
                              agentName: commission.agent || ''
                            });
                            onEditOpen();
                          }}
                        >
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={10} textAlign="center" py={8}>
                      <Text>No commissions found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Approval Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approve {selectedPartLabel}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCommission && (
              <Box>
                <Text mb={4}>
                  Approve the {selectedPartLabel.toLowerCase()} (ETB {selectedPartAmount?.toFixed(2)}) for{' '}
                  <strong>{selectedCommission.customerName}</strong>?
                </Text>
                
                <Card mb={4}>
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Text>Agent:</Text>
                      <Text fontWeight="semibold">{selectedCommission.agent}</Text>
                    </HStack>
                    <HStack justify="space-between" mb={2}>
                      <Text>Package Value:</Text>
                      <Text fontWeight="semibold">
                        ETB {selectedCommission.packageValue.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" mb={2}>
                      <Text>First Commission (50%):</Text>
                      <Text fontWeight="semibold" color="purple.500">
                        ETB {selectedCommission.firstCommission.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Second Commission (50%):</Text>
                      <Text fontWeight="semibold" color="pink.500">
                        ETB {selectedCommission.secondCommission.toFixed(2)}
                      </Text>
                    </HStack>
                  </CardBody>
                </Card>
                
                <Text>
                  Once approved, this commission split will be directly included in the payroll.
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmApproveCommission}
              isLoading={approvingCommission === `${selectedPart}-${selectedCommission?.id}`}
            >
              Approve {selectedPartLabel}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={handleEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit commission split</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editCommission && (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Agent</FormLabel>
                  <Select
                    value={editValues.agentId || ''}
                    placeholder="Select agent"
                    onChange={(event) => handleAgentSelection(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.fullName || agent.username || agent.name || 'Agent'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Package Value</FormLabel>
                  <NumberInput
                    min={0}
                    value={editValues.packageValue}
                    onChange={(value) => handleEditChange('packageValue', value)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>First Commission</FormLabel>
                  <NumberInput
                    min={0}
                    value={editValues.firstCommission}
                    onChange={(value) => handleEditChange('firstCommission', value)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Second Commission</FormLabel>
                  <NumberInput
                    min={0}
                    value={editValues.secondCommission}
                    onChange={(value) => handleEditChange('secondCommission', value)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Net Commission:&nbsp;
                    <Text as="span" fontWeight="semibold">
                      ETB {editNetCommission.toFixed(2)}
                    </Text>
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Gross Commission estimate:&nbsp;
                    <Text as="span" fontWeight="semibold">
                      ETB {editGrossCommission.toFixed(2)}
                    </Text>
                  </Text>
                </Box>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit} isLoading={isSavingEdit}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CommissionApprovalPage;
