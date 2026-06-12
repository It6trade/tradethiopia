import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Select,
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
  Stack,
  IconButton,
  HStack,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaLink, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import {
  createContentTrackerEntry,
  deleteContentTrackerEntry,
  fetchContentTrackerEntries,
  updateContentTrackerEntry,
} from '../../services/contentTrackerService';
import { useUserStore } from '../../store/user';
import {
  REQUIRED_COUNTS,
  SHARE_TARGET,
  BONUS_AMOUNT,
  buildMonthKey,
  formatMonthLabel,
  normalizeAgentKey,
  summarizeEntriesByAgent,
  mapSummariesByKey,
  createEmptyCounts,
} from '../../utils/contentTrackerTargets';

const contentTypeOptions = ['Video', 'Graphics', 'Live Session', 'Testimonial', 'Bulk Email', 'Messages', 'Leads'];
const getEntryId = (entry) => entry?._id ?? entry?.id ?? entry;
const formatAgentName = (entry, currentUser) => {
  const creator = entry?.createdBy;
  if (!creator) {
    return currentUser?.username || 'Unknown agent';
  }

  if (typeof creator === 'string') {
    if (currentUser?._id && creator === currentUser._id) {
      return currentUser?.username || 'Unknown agent';
    }
    return 'Unknown agent';
  }

  const nameParts = [creator.firstName, creator.lastName].filter(Boolean);
  if (nameParts.length) return nameParts.join(' ');
  return creator.fullName || creator.username || creator.email || currentUser?.username || 'Unknown agent';
};

const ContentTrackerPage = ({ title = 'Content Tracker', addButtonLabel = 'Add', platformOptions = [] }) => {
  const [contentRows, setContentRows] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState(contentTypeOptions[0]);
  const [modalPlatform, setModalPlatform] = useState('');
  const [modalShares, setModalShares] = useState(0);
  const [modalLink, setModalLink] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareEdits, setShareEdits] = useState({});
  const currentUser = useUserStore((state) => state.currentUser);
  const [selectedMonth, setSelectedMonth] = useState(buildMonthKey());
  const isSalesManager = useMemo(() => {
    if (!currentUser) return false;
    const normalized = (currentUser.normalizedRole || currentUser.role || '').toString().toLowerCase();
    return normalized.includes('salesmanager');
  }, [currentUser]);
  const toast = useToast();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewEntry, setViewEntry] = useState(null);
  const hasPlatformTracking = platformOptions.length > 0;
  const defaultPlatform = platformOptions[0] || '';
  const platformRows = useMemo(() => {
    if (!hasPlatformTracking) return contentRows;
    return contentRows.filter((row) => platformOptions.includes(row.platform));
  }, [contentRows, hasPlatformTracking, platformOptions]);

  const normalizeResponsePayload = (payload) => payload?.data ?? payload;

  const userKey = useMemo(() => normalizeAgentKey(currentUser), [currentUser]);
  const agentSummaries = useMemo(() => summarizeEntriesByAgent(platformRows, selectedMonth), [platformRows, selectedMonth]);
  const summaryMap = useMemo(() => mapSummariesByKey(agentSummaries), [agentSummaries]);
  const monthlyStats = useMemo(() => {
    const summary = userKey ? summaryMap[userKey] : null;
    if (summary) {
      return {
        counts: summary.counts,
        shares: summary.shares,
        totalPosts: summary.totalPosts,
        isComplete: summary.isComplete,
      };
    }
    return {
      counts: createEmptyCounts(),
      shares: 0,
      totalPosts: 0,
      isComplete: false,
    };
  }, [summaryMap, userKey]);

  const loadEntries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchContentTrackerEntries();
      const entries = Array.isArray(normalizeResponsePayload(response))
        ? normalizeResponsePayload(response)
        : normalizeResponsePayload(response)?.data ?? [];
      setContentRows(entries);
    } catch (err) {
      console.error('Failed to load content tracker entries', err);
      setError('Unable to load content tracker entries right now.');
      toast({
        title: 'Unable to load tracker',
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

  const updateRowInState = (updatedEntry) => {
    if (!updatedEntry) return;
    setContentRows((prev) =>
      prev.map((row) =>
        getEntryId(row) === getEntryId(updatedEntry) ? updatedEntry : row,
      ),
    );

    if (selectedItem && getEntryId(selectedItem) === getEntryId(updatedEntry)) {
      setSelectedItem(updatedEntry);
    }
  };

  const removeRowFromState = (entryId) => {
    setContentRows((prev) =>
      prev.filter((row) => getEntryId(row) !== entryId),
    );
    if (selectedItem && getEntryId(selectedItem) === entryId) {
      setSelectedItem(null);
    }
  };

  const handleTypeChange = async (entryId, nextType) => {
    try {
      const response = await updateContentTrackerEntry(entryId, { type: nextType });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
    } catch (err) {
      console.error('Unable to update type', err);
      toast({
        title: 'Update failed',
        description: 'Could not save the new type.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const clearShareEdit = (entryId) => {
    setShareEdits((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, entryId)) return prev;
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  };

  const handleShareChange = async (entryId, nextShares) => {
    try {
      const parsedShares = Number(nextShares);
      const safeShares = Number.isFinite(parsedShares) ? Math.max(0, parsedShares) : 0;
      const response = await updateContentTrackerEntry(entryId, { shares: safeShares });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
      clearShareEdit(entryId);
    } catch (err) {
      console.error('Unable to update share count', err);
      toast({
        title: 'Update failed',
        description: 'Could not save the new share count.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openActionModal = (action, row) => {
    setSelectedItem(row);
    setCurrentAction(action);
    setModalTitle(row?.title || '');
    setModalType(row?.type ?? contentTypeOptions[0]);
    setModalPlatform(row?.platform || defaultPlatform);
    setModalShares(row?.shares ?? 0);
    setModalLink(row?.link ?? '');
    setModalDescription(row?.description ?? '');
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setCurrentAction(null);
    setModalTitle('');
    setModalDescription('');
    setModalLink('');
    setModalType(contentTypeOptions[0]);
    setModalPlatform(defaultPlatform);
    setModalShares(0);
    onClose();
  };

  const handleCloseView = () => {
    setViewEntry(null);
    onViewClose();
  };

  const handleModalConfirm = async () => {
    if (currentAction !== 'Create' && !selectedItem) {
      handleCloseModal();
      return;
    }

    try {
      if (currentAction === 'Delete') {
        const entryId = getEntryId(selectedItem);
        await deleteContentTrackerEntry(entryId);
        removeRowFromState(entryId);
      } else if (currentAction === 'Create') {
        const trimmedTitle = modalTitle.trim();
        if (!trimmedTitle) {
          toast({
            title: 'Title is required',
            description: 'Add a post title before saving.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const payload = {
          title: trimmedTitle,
          type: modalType,
          link: modalLink,
          description: modalDescription,
          approved: false,
          date: new Date().toISOString(),
          shares: modalShares,
        };
        if (hasPlatformTracking) {
          payload.platform = modalPlatform || defaultPlatform;
        }
        const response = await createContentTrackerEntry(payload);
        const created = normalizeResponsePayload(response);
        setContentRows((prev) => [created, ...prev]);
      } else if (currentAction === 'Edit') {
        const entryId = getEntryId(selectedItem);
        const trimmedTitle = modalTitle.trim();
        if (!trimmedTitle) {
          toast({
            title: 'Title is required',
            description: 'Add a post title before saving.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const payload = {
          title: trimmedTitle,
          type: modalType,
          link: modalLink,
          description: modalDescription,
          shares: modalShares,
        };
        if (hasPlatformTracking) {
          payload.platform = modalPlatform;
        }
        const response = await updateContentTrackerEntry(entryId, payload);
        const updated = normalizeResponsePayload(response);
        updateRowInState(updated);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Modal action failed', err);
      toast({
        title: 'Action failed',
        description: 'Unable to process your request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleAddEntry = async () => {
    setSelectedItem(null);
    setCurrentAction('Create');
    setModalTitle('');
    setModalType(contentTypeOptions[0]);
    setModalPlatform(filterPlatform !== 'All' ? filterPlatform : defaultPlatform);
    setModalShares(0);
    setModalLink('');
    setModalDescription('');
    onOpen();
  };

  const visibleRows = platformRows.filter((row) => {
    if (filterDate) {
      if (!row?.date) return false;
      const rowDateString = new Date(row.date).toISOString().split('T')[0];
      if (rowDateString !== filterDate) return false;
    }

    if (hasPlatformTracking && filterPlatform !== 'All') {
      return (row.platform || '') === filterPlatform;
    }

    return true;
  });

  const actionLabelMap = {
    Create: hasPlatformTracking ? 'Add Post' : 'Add Content Entry',
    Edit: 'Edit Content Details',
    Delete: 'Delete Content Entry',
  };

  const renderTableSection = () => {
    if (isLoading) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Flex align="center" gap={3}>
            <Spinner size="lg" />
            <Text fontWeight="medium">Loading content tracker data...</Text>
          </Flex>
        </Box>
      );
    }

    if (error) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      );
    }

    if (!visibleRows.length) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Text color="gray.500" textAlign="center">
            No tracker entries yet. Click “Add” to create one.
          </Text>
        </Box>
      );
    }

    return (
      <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflowX="auto">
        <Table variant="simple" minW={hasPlatformTracking ? "980px" : "860px"}>
          <Thead bg="gray.50">
            <Tr>
              <Th>Date</Th>
              <Th>Content</Th>
              <Th>Agent Name</Th>
              {hasPlatformTracking && <Th>Platform</Th>}
              <Th>Type</Th>
              <Th>Shares</Th>
              <Th>Link</Th>
              <Th>Approved</Th>
              <Th textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {visibleRows.map((row) => {
              const rowId = getEntryId(row);
              return (
                <Tr key={rowId}>
                  <Td whiteSpace="nowrap">
                    {row?.date ? new Date(row.date).toISOString().split('T')[0] : '—'}
                  </Td>
                  <Td>
                    <Text fontWeight="semibold">{row.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {row.description || 'Add a short description when editing this entry.'}
                    </Text>
                  </Td>
                <Td>
                  <Text fontSize="sm" color="gray.600">
                    {formatAgentName(row, currentUser)}
                  </Text>
                </Td>
                {hasPlatformTracking && (
                  <Td>
                    <Badge colorScheme={row.platform ? 'green' : 'gray'} borderRadius="full">
                      {row.platform || 'Unassigned'}
                    </Badge>
                  </Td>
                )}
                <Td>
                  <Select
                    value={row.type}
                    onChange={(event) => handleTypeChange(rowId, event.target.value)}
                    size="sm"
                  >
                      {contentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                </Td>
                <Td>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    step={1}
                    value={shareEdits[rowId] ?? (row.shares ?? 0)}
                    onChange={(event) => {
                      const { value } = event.target;
                      setShareEdits((prev) => ({
                        ...prev,
                        [rowId]: value,
                      }));
                    }}
                    onBlur={(event) => {
                      const draft = shareEdits[rowId];
                      if (draft === undefined) return;
                      const parsed = Number(draft);
                      if (!Number.isFinite(parsed)) {
                        clearShareEdit(rowId);
                        return;
                      }
                      const normalized = Math.max(0, parsed);
                      if (normalized === (row.shares ?? 0)) {
                        clearShareEdit(rowId);
                        return;
                      }
                      handleShareChange(rowId, normalized);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <FaLink />
                      <Box
                        as="a"
                        href={row.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        color="teal.500"
                      >
                        {row.link ? 'View post' : 'No link yet'}
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={row.approved ? 'green' : 'yellow'}>
                      {row.approved ? 'Yes' : 'No'}
                    </Badge>
                  </Td>
                  <Td>
                    <Stack direction="row" spacing={2} justify="center">
                      <IconButton
                        aria-label="Edit"
                        icon={<FaEdit />}
                        size="sm"
                        onClick={() => openActionModal('Edit', row)}
                      />
                      <IconButton
                        aria-label="View"
                        icon={<FaEye />}
                        size="sm"
                        onClick={() => {
                          setViewEntry(row);
                          onViewOpen();
                        }}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FaTrash />}
                        size="sm"
                        onClick={() => openActionModal('Delete', row)}
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

  return (
    <Box w="100%" minW={0}>
      <Flex justify="space-between" align={{ base: "stretch", sm: "center" }} mb={4} gap={3} direction={{ base: "column", sm: "row" }}>
        <Heading size="lg">{title}</Heading>
        <Button size="sm" colorScheme="teal" onClick={handleAddEntry} alignSelf={{ base: "stretch", sm: "center" }}>
          {addButtonLabel}
        </Button>
      </Flex>

      <Flex mb={6} direction={{ base: 'column', md: 'row' }} gap={4} flexWrap="wrap">
        <Box flex={{ base: '1 1 100%', md: '1 1 180px' }}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Filter by date
          </Text>
          <Input
            type="date"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            max="2026-12-31"
          />
        </Box>
        {hasPlatformTracking && (
          <Box flex={{ base: '1 1 100%', md: '1 1 220px' }}>
            <Text fontSize="sm" color="gray.500" mb={1}>
              Filter by platform
            </Text>
            <Select value={filterPlatform} onChange={(event) => setFilterPlatform(event.target.value)}>
              <option value="All">All platforms</option>
              {platformOptions.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </Select>
          </Box>
        )}
        <Box flex={{ base: '1 1 100%', md: '2 1 260px' }}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Content column description
          </Text>
          <Input
            placeholder="Search by title or notes"
            onChange={() => {}}
            isDisabled
          />
        </Box>
      </Flex>

      {!isSalesManager && (
        <Stack spacing={4} mb={6}>
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              Month for the post counter
            </Text>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              max={buildMonthKey()}
            />
          </Box>
          <Box
            bg="white"
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
            p={5}
          >
            <Flex justify="space-between" align="baseline" flexWrap="wrap" gap={3}>
              <Text fontSize="lg" fontWeight="semibold">
                {formatMonthLabel(selectedMonth)} post counter
              </Text>
              <Badge colorScheme={monthlyStats.isComplete ? 'green' : 'red'}>
                {monthlyStats.isComplete ? 'Target ready' : 'In progress'}
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Approved posts contribute toward the 3,000 birr bonus once the full mix is delivered alongside {SHARE_TARGET} shares.
            </Text>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={3} mt={4}>
              {Object.entries(REQUIRED_COUNTS).map(([type, target]) => (
                <Box key={type} py={2} px={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="xs" color="gray.500">
                    {type}
                  </Text>
                  <Text fontWeight="bold">
                    {monthlyStats.counts[type]}/{target}
                  </Text>
                </Box>
              ))}
              <Box py={2} px={3} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" color="gray.500">
                  Shares
                </Text>
                <Text fontWeight="bold">
                  {monthlyStats.shares}/{SHARE_TARGET}
                </Text>
              </Box>
              <Box py={2} px={3} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" color="gray.500">
                  Approved posts
                </Text>
                <Text fontWeight="bold">{monthlyStats.totalPosts}</Text>
              </Box>
            </SimpleGrid>
          </Box>
        </Stack>
      )}

      {renderTableSection()}

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{actionLabelMap[currentAction] ?? 'Action'}</ModalHeader>
          <ModalCloseButton onClick={handleCloseModal} />
          <ModalBody>
            {(currentAction === 'Create' || (selectedItem && currentAction === 'Edit')) && (
              <Stack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Title
                  </Text>
                  <Input
                    value={modalTitle}
                    onChange={(event) => setModalTitle(event.target.value)}
                    placeholder={hasPlatformTracking ? 'Post title' : 'Content title'}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Change type
                  </Text>
                  <Select
                    value={modalType}
                    onChange={(event) => setModalType(event.target.value)}
                  >
                    {contentTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Box>
                {hasPlatformTracking && (
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Social media platform
                    </Text>
                    <Select
                      value={modalPlatform}
                      onChange={(event) => setModalPlatform(event.target.value)}
                    >
                      {platformOptions.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </Select>
                  </Box>
                )}
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Update link
                  </Text>
                  <Input
                    value={modalLink}
                    onChange={(event) => setModalLink(event.target.value)}
                    placeholder="https://"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Description
                  </Text>
                  <Textarea
                    value={modalDescription}
                    onChange={(event) => setModalDescription(event.target.value)}
                    placeholder="Describe what this content covers."
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
                    value={modalShares}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setModalShares(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
                    }}
                  />
                </Box>
              </Stack>
            )}
            {selectedItem && currentAction === 'Delete' && (
              <Text>
                Delete <strong>{selectedItem.title}</strong> from the tracker. This
                action cannot be undone.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleModalConfirm}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isViewOpen} onClose={handleCloseView} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Entry Detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewEntry ? (
              <Box borderWidth="1px" borderRadius="lg" shadow="md" p={5} bg="white">
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
                {hasPlatformTracking && (
                  <>
                    <Text fontSize="sm" mb={1} color="gray.500">
                      Platform
                    </Text>
                    <Text fontWeight="semibold" mb={2}>
                      {viewEntry.platform || 'Unassigned'}
                    </Text>
                  </>
                )}
                <Text fontSize="sm" mb={1} color="gray.500">
                  Agent Name
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {formatAgentName(viewEntry, currentUser)}
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
              </Box>
            ) : (
              <Text>No entry selected.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCloseView}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ContentTrackerPage;
