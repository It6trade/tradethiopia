import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  Stack,
  Select,
  Textarea,
  IconButton,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaLink, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import {
  fetchContentTrackerEntries,
  updateContentTrackerEntry,
  deleteContentTrackerEntry,
} from '../../../../services/contentTrackerService';
import {
  REQUIRED_COUNTS,
  SHARE_TARGET,
  BONUS_AMOUNT,
  buildMonthKey,
  formatMonthLabel,
  summarizeEntriesByAgent,
} from '../../../../utils/contentTrackerTargets';

const contentTypeOptions = ['Video', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads'];
const getWeekDateRange = (weekValue) => {
  if (!weekValue) return null;
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const [, yearPart, weekPart] = match;
  const year = Number(yearPart);
  const week = Number(weekPart);
  const simple = new Date(Date.UTC(year, 0, 4 + (week - 1) * 7));
  const day = simple.getUTCDay();
  const isoWeekStart = new Date(simple);
  isoWeekStart.setUTCDate(simple.getUTCDate() - ((day + 6) % 7));
  const isoWeekEnd = new Date(isoWeekStart);
  isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6);
  const formatDate = (date) => date.toISOString().split('T')[0];
  return { start: formatDate(isoWeekStart), end: formatDate(isoWeekEnd) };
};

const getEntryId = (entry) => entry?._id ?? entry?.id ?? entry;

const normalizePayload = (payload) => payload?.data ?? payload;

const formatAgentName = (entry) => {
  const creator = entry?.createdBy;
  if (!creator) return 'Unknown agent';
  const nameParts = [creator.firstName, creator.lastName].filter(Boolean);
  if (nameParts.length) {
    return nameParts.join(' ');
  }
  return creator.fullName || creator.username || creator.email || 'Unknown agent';
};

const ContentTrackerReport = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('date');
  const [filterValue, setFilterValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(buildMonthKey());
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [viewEntry, setViewEntry] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [editType, setEditType] = useState(contentTypeOptions[0]);
  const [editLink, setEditLink] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editShares, setEditShares] = useState(0);

  const loadEntries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchContentTrackerEntries();
      const payload = normalizePayload(response);
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      setEntries(list);
    } catch (err) {
      console.error('Failed to load content tracker entries', err);
      setError('Unable to load tracker entries right now.');
      toast({
        title: 'Load failed',
        description: 'Could not fetch content tracker data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!filterValue) return entries;
    if (filterMode === 'week') {
      const range = getWeekDateRange(filterValue);
      if (!range) return entries;
      return entries.filter((entry) => {
        if (!entry?.date) return false;
        const rowDate = new Date(entry.date).toISOString().split('T')[0];
        return rowDate >= range.start && rowDate <= range.end;
      });
    }
    return entries.filter((entry) => {
      if (!entry?.date) return false;
      const rowDate = new Date(entry.date).toISOString().split('T')[0];
      return rowDate === filterValue;
    });
  }, [entries, filterMode, filterValue]);

  const agentSummaries = useMemo(() => {
    if (!selectedMonth) return [];
    return summarizeEntriesByAgent(entries, selectedMonth)
      .map((summary) => {
        const name = formatAgentName({ createdBy: summary.agent });
        return {
          ...summary,
          name,
        };
      })
      .sort((a, b) => {
        if (a.isComplete === b.isComplete) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return a.isComplete ? -1 : 1;
      });
  }, [entries, selectedMonth]);

  const openApproveModal = (entry) => {
    setSelectedEntry(entry);
    onOpen();
  };

  const openViewModal = (entry) => {
    setViewEntry(entry);
    onViewOpen();
  };

  const openEditModal = (entry) => {
    setEditEntry(entry);
    setEditType(entry.type || contentTypeOptions[0]);
    setEditShares(entry.shares ?? 0);
    setEditLink(entry.link || '');
    setEditDescription(entry.description || '');
    onEditOpen();
  };

  const openDeleteModal = (entry) => {
    setDeleteEntry(entry);
    onDeleteOpen();
  };

  const closeModal = () => {
    setSelectedEntry(null);
    onClose();
  };

  const closeViewModal = () => {
    setViewEntry(null);
    onViewClose();
  };

  const closeEditModal = () => {
    setEditEntry(null);
    setEditShares(0);
    onEditClose();
  };

  const closeDeleteModal = () => {
    setDeleteEntry(null);
    onDeleteClose();
  };

  const handleApprove = async () => {
    if (!selectedEntry) return;

    try {
      const response = await updateContentTrackerEntry(getEntryId(selectedEntry), {
        approved: true,
      });
      const updated = normalizePayload(response);
      setEntries((prev) =>
        prev.map((entry) =>
          getEntryId(entry) === getEntryId(updated) ? updated : entry,
        ),
      );
      toast({
        title: 'Approved',
        description: `${updated.title} is now approved.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Approval error', err);
      toast({
        title: 'Approval failed',
        description: 'Unable to approve this entry right now.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      closeModal();
    }
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <Box
          bg="white"
          rounded="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          p={6}
        >
          <Flex align="center" gap={3}>
            <Spinner size="lg" />
            <Text fontWeight="medium">Loading tracker data...</Text>
          </Flex>
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          bg="white"
          rounded="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          p={6}
        >
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      );
    }

    if (!filteredEntries.length) {
      return (
        <Box
          bg="white"
          rounded="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          p={6}
        >
          <Text color="gray.500" textAlign="center">
            No entries found for the selected date.
          </Text>
        </Box>
      );
    }

    return (
      <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Date</Th>
              <Th>Content</Th>
              <Th>Agent</Th>
              <Th>Type</Th>
              <Th>Shares</Th>
              <Th>Link</Th>
              <Th>Approved</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredEntries.map((entry) => {
              const id = getEntryId(entry);
              return (
                <Tr key={id}>
                  <Td>{entry?.date ? new Date(entry.date).toISOString().split('T')[0] : '—'}</Td>
                  <Td>
                    <Text fontWeight="semibold">{entry.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {entry.description || 'No description provided.'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {formatAgentName(entry)}
                    </Text>
                  </Td>
                  <Td>{entry.type || '—'}</Td>
                  <Td>{entry.shares ?? 0}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <FaLink />
                      <Box
                        as="a"
                        href={entry.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        color="teal.500"
                      >
                        {entry.link ? 'View post' : 'No link yet'}
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={entry.approved ? 'green' : 'yellow'}>
                      {entry.approved ? 'Yes' : 'No'}
                    </Badge>
                  </Td>
                  <Td>
                    <Stack direction="row" spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="teal"
                        variant="outline"
                        onClick={() => openApproveModal(entry)}
                        isDisabled={entry.approved}
                      >
                        {entry.approved ? 'Approved' : 'Approve'}
                      </Button>
                      <IconButton
                        aria-label="View entry"
                        icon={<FaEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openViewModal(entry)}
                      />
                      <IconButton
                        aria-label="Edit entry"
                        icon={<FaEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(entry)}
                      />
                      <IconButton
                        aria-label="Delete entry"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal(entry)}
                      />
                    </Stack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    );
  };

  const renderEligibilitySummary = () => {
    if (!selectedMonth) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Select a month to see who qualifies for the {BONUS_AMOUNT.toLocaleString()} birr bonus.
        </Alert>
      );
    }

    if (!agentSummaries.length) {
      return (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          No approved content has been recorded for {formatMonthLabel(selectedMonth)} yet.
        </Alert>
      );
    }

    return (
      <Box
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={5}
      >
        <Flex justify="space-between" align="baseline" flexWrap="wrap" gap={4}>
          <Text fontSize="lg" fontWeight="semibold">
            {formatMonthLabel(selectedMonth)} eligibility
          </Text>
          <Badge colorScheme="teal" fontSize="0.85rem">
            {BONUS_AMOUNT.toLocaleString()} birr bonus target
          </Badge>
        </Flex>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Agents turn green once they deliver at least 2 videos, 2 graphics, 1 live
          session, 1 testimonial, and {SHARE_TARGET} shares that have been approved this
          month.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={4}>
          {agentSummaries.map((agent) => (
            <Box
              key={agent.agentId}
              bg={agent.isComplete ? 'green.50' : 'red.50'}
              borderWidth="1px"
              borderColor={agent.isComplete ? 'green.200' : 'red.200'}
              borderRadius="md"
              p={4}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="semibold">{agent.name}</Text>
                <Badge colorScheme={agent.isComplete ? 'green' : 'red'}>
                  {agent.isComplete ? 'Eligible' : 'Pending'}
                </Badge>
              </Flex>
              <Stack spacing={0.5}>
                {Object.entries(REQUIRED_COUNTS).map(([type, target]) => (
                  <Text fontSize="sm" key={`${agent.agentId}-${type}`}>
                    {type}: {agent.counts[type]}/{target}
                  </Text>
                ))}
                <Text fontSize="sm">
                  Shares: {Math.round(agent.shares)}/{SHARE_TARGET}
                </Text>
              </Stack>
              <Text
                fontSize="sm"
                fontWeight="bold"
                mt={2}
                color={agent.isComplete ? 'green.600' : 'red.600'}
              >
                {agent.isComplete
                  ? `✔ ${BONUS_AMOUNT.toLocaleString()} birr ready`
                  : 'Criteria still pending'}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={4}>
        <Heading size="lg">Content Tracker Report</Heading>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Filter entries
          </Text>
          <Flex gap={2} wrap="wrap" align="flex-end">
            <Select
              value={filterMode}
              onChange={(event) => {
                setFilterMode(event.target.value);
                setFilterValue('');
              }}
              minW="130px"
            >
              <option value="date">Day</option>
              <option value="week">Week</option>
            </Select>
            {filterMode === 'week' ? (
              <Input
                type="week"
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                max="2026-W52"
              />
            ) : (
              <Input
                type="date"
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                max="2026-12-31"
              />
            )}
          </Flex>
        </Box>
      </Flex>

      <Stack spacing={4} mb={6}>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Select month to evaluate
          </Text>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            max="2026-12"
          />
        </Box>
        {renderEligibilitySummary()}
      </Stack>

      {renderTable()}

      <Modal isOpen={isOpen} onClose={closeModal} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approve Content</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to approve{' '}
              <Text as="span" fontWeight="semibold">
                {selectedEntry?.title}
              </Text>
              ?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleApprove}>
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Drawer isOpen={isViewOpen} placement="right" onClose={closeViewModal} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Entry Detail</DrawerHeader>
          <DrawerBody>
            {viewEntry ? (
              <Box borderWidth="1px" borderRadius="lg" shadow="md" p={5} bg="white" h="100%">
                <Flex justify="space-between" align="center" mb={3} gap={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Date
                    </Text>
                    <Text fontWeight="bold">
                      {viewEntry.date ? new Date(viewEntry.date).toISOString().split('T')[0] : '—'}
                    </Text>
                  </Box>
                  <Badge colorScheme={viewEntry.approved ? 'green' : 'yellow'}>
                    {viewEntry.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </Flex>
                <Heading size="md" mb={2}>
                  {viewEntry.title}
                </Heading>
                <Text mb={2} color="gray.600">
                  {viewEntry.description || 'No description has been provided yet.'}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Type
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {viewEntry.type || '—'}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Agent
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {formatAgentName(viewEntry)}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Link
                </Text>
                <Text
                  as="a"
                  href={viewEntry.link || '#'}
                  color="teal.500"
                  target="_blank"
                  rel="noreferrer"
                >
                  {viewEntry.link ? viewEntry.link : 'No link provided'}
                </Text>
                <Text fontSize="sm" mt={3} mb={1} color="gray.500">
                  Shares
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {viewEntry.shares ?? 0}
                </Text>
              </Box>
            ) : (
              <Text>No entry selected.</Text>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" onClick={closeViewModal}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Modal isOpen={isEditOpen} onClose={closeEditModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Title
                </Text>
                <Text fontWeight="semibold">
                  {editEntry?.title ?? 'Untitled entry'}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Type
                </Text>
                <Select value={editType} onChange={(event) => setEditType(event.target.value)}>
                  {contentTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Link
                </Text>
                <Input
                  value={editLink}
                  onChange={(event) => setEditLink(event.target.value)}
                  placeholder="https://"
                />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Description
                </Text>
                <Textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Share count
                </Text>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={editShares}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setEditShares(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
                  }}
                />
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeEditModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={async () => {
              if (!editEntry) return;
              try {
                const response = await updateContentTrackerEntry(getEntryId(editEntry), {
                  type: editType,
                  link: editLink,
                  description: editDescription,
                  shares: editShares,
                });
                const updated = normalizePayload(response);
                setEntries((prev) =>
                  prev.map((entry) =>
                    getEntryId(entry) === getEntryId(updated) ? updated : entry,
                  ),
                );
                toast({
                  title: 'Updated',
                  description: 'Entry saved successfully.',
                  status: 'success',
                  duration: 4000,
                  isClosable: true,
                });
                closeEditModal();
              } catch (err) {
                console.error('Edit failed', err);
                toast({
                  title: 'Update failed',
                  description: 'Unable to save changes.',
                  status: 'error',
                  duration: 4000,
                  isClosable: true,
                });
              }
            }}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} size="xs">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete{' '}
              <Text as="span" fontWeight="semibold">
                {deleteEntry?.title}
              </Text>
              ?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={async () => {
                if (!deleteEntry) return;
                try {
                  await deleteContentTrackerEntry(getEntryId(deleteEntry));
                  setEntries((prev) =>
                    prev.filter((entry) => getEntryId(entry) !== getEntryId(deleteEntry)),
                  );
                  toast({
                    title: 'Deleted',
                    description: 'Entry removed successfully.',
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                  });
                } catch (err) {
                  console.error('Delete failed', err);
                  toast({
                    title: 'Delete failed',
                    description: 'Unable to remove entry.',
                    status: 'error',
                    duration: 4000,
                    isClosable: true,
                  });
                } finally {
                  closeDeleteModal();
                }
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ContentTrackerReport;
