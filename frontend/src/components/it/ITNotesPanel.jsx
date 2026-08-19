import React, { useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
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
  Select,
  SimpleGrid,
  Spacer,
  Tag,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiBookmark,
  FiCalendar,
  FiCheck,
  FiEdit2,
  FiFolder,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';

const makeStorageKey = (user) => `it-personal-notes-${user?._id || user?.email || 'local'}`;

const DEFAULT_FORM = {
  name: '',
  projectName: '',
  date: new Date().toISOString().slice(0, 10),
  priority: 'normal',
  category: 'General',
  body: '',
  isPinned: false,
};

const CATEGORIES = ['General', 'Development', 'Bug Fix', 'Server / DevOps', 'Client Support', 'Planning', 'Meeting Note'];
const PRIORITIES = [
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'important', label: 'Important', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
];

export default function ITNotesPanel({ user }) {
  const storageKey = makeStorageKey(user);
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(DEFAULT_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');

  // Edit Modal State
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);

  // Delete Alert Dialog State
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingNote, setDeletingNote] = useState(null);
  const cancelDeleteRef = useRef();

  const toast = useToast();

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerColor = useColorModeValue('blue.700', 'blue.200');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const panelBg = useColorModeValue('gray.50', 'gray.900');
  const pinnedCardBg = useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.12)');
  const pinnedBorder = useColorModeValue('blue.400', 'blue.300');

  // Save to state & LocalStorage
  const saveNotes = (nextNotes) => {
    setNotes(nextNotes);
    localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  };

  // Add new note
  const addNote = () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Note title/name and content are required.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveNotes([newNote, ...notes]);
    setForm({
      ...DEFAULT_FORM,
      date: new Date().toISOString().slice(0, 10),
    });

    toast({
      title: 'Note Created',
      description: 'Your personal note has been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Open Edit Modal
  const openEditModal = (note) => {
    setEditingNote(note);
    setEditForm({
      name: note.name || '',
      projectName: note.projectName || '',
      date: note.date || new Date().toISOString().slice(0, 10),
      priority: note.priority || 'normal',
      category: note.category || 'General',
      body: note.body || '',
      isPinned: Boolean(note.isPinned),
    });
    onEditOpen();
  };

  // Submit Note Edit/Update
  const handleUpdateNote = () => {
    if (!editForm.name.trim() || !editForm.body.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Note title/name and content cannot be empty.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedNotes = notes.map((item) =>
      item.id === editingNote.id
        ? {
            ...item,
            ...editForm,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    saveNotes(updatedNotes);
    onEditClose();
    setEditingNote(null);

    toast({
      title: 'Note Updated',
      description: 'Your note changes have been saved.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Open Delete Confirmation
  const openDeleteDialog = (note) => {
    setDeletingNote(note);
    onDeleteOpen();
  };

  // Confirm Delete Note
  const confirmDeleteNote = () => {
    if (!deletingNote) return;

    const filtered = notes.filter((item) => item.id !== deletingNote.id);
    saveNotes(filtered);
    onDeleteClose();
    setDeletingNote(null);

    toast({
      title: 'Note Deleted',
      description: 'The note was successfully removed.',
      status: 'info',
      duration: 2500,
      isClosable: true,
    });
  };

  // Toggle Pin Status
  const togglePinNote = (noteId) => {
    const nextNotes = notes.map((item) =>
      item.id === noteId ? { ...item, isPinned: !item.isPinned } : item
    );
    saveNotes(nextNotes);
  };

  // Filtered and Sorted Notes
  const processedNotes = useMemo(() => {
    let result = [...notes];

    // Filter by category
    if (filterCategory !== 'All') {
      result = result.filter((n) => (n.category || 'General') === filterCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          (n.name && n.name.toLowerCase().includes(q)) ||
          (n.projectName && n.projectName.toLowerCase().includes(q)) ||
          (n.body && n.body.toLowerCase().includes(q)) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Pinned notes always stay on top
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (sortBy === 'date-desc') {
        return String(b.date || '').localeCompare(String(a.date || ''));
      }
      if (sortBy === 'date-asc') {
        return String(a.date || '').localeCompare(String(b.date || ''));
      }
      if (sortBy === 'name-asc') {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }
      if (sortBy === 'projectName-asc') {
        return String(a.projectName || '').localeCompare(String(b.projectName || ''));
      }
      return 0;
    });

    return result;
  }, [notes, filterCategory, searchQuery, sortBy]);

  const getPriorityBadge = (priority) => {
    const item = PRIORITIES.find((p) => p.value === priority) || PRIORITIES[0];
    return (
      <Badge colorScheme={item.color} variant="subtle" fontSize="xs" borderRadius="md" px={2}>
        {item.label}
      </Badge>
    );
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header */}
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
        <Box>
          <Heading size="lg" color={headerColor}>
            IT Personal Notes & Work Planner
          </Heading>
          <Text color={mutedText} fontSize="sm">
            Draft, organize, edit, and track personal work notes, technical snippets, and project checklists.
          </Text>
        </Box>
        <HStack>
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
            {notes.length} Total Note{notes.length !== 1 ? 's' : ''}
          </Badge>
        </HStack>
      </Flex>

      {/* Note Creation Form */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
        <CardHeader pb={2}>
          <HStack spacing={2}>
            <FiEdit2 color="#3182CE" />
            <Heading size="md">Create New Note</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={2}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold">Note Title / Name</FormLabel>
              <Input
                placeholder="e.g., API Route Refactor Tasks"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Project / Platform Name</FormLabel>
              <Input
                placeholder="e.g., TradeEthiopia Core, Customer Portal"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Target Date</FormLabel>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Category</FormLabel>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Priority</FormLabel>
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired mb={4}>
            <FormLabel fontSize="sm" fontWeight="semibold">Note Details / Content</FormLabel>
            <Textarea
              rows={4}
              placeholder="Write your personal task details, code notes, reminders, or checklist..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </FormControl>

          <Flex justify="flex-end">
            <Button
              colorScheme="blue"
              leftIcon={<FiPlus />}
              onClick={addNote}
              px={6}
            >
              Save Note
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Search, Filter & Sort Controls */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p={4} boxShadow="sm">
        <Flex direction={{ base: 'column', md: 'row' }} gap={3} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
          <InputGroup maxW={{ base: '100%', md: '350px' }} size="sm">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search notes by title, project, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>

          <HStack spacing={3} flexWrap="wrap">
            <Select
              size="sm"
              w="160px"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              borderRadius="lg"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>

            <Select
              size="sm"
              w="180px"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              borderRadius="lg"
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="name-asc">Title (A to Z)</option>
              <option value="projectName-asc">Project Name</option>
            </Select>
          </HStack>
        </Flex>
      </Card>

      {/* Notes Grid */}
      {processedNotes.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed" borderRadius="2xl" p={10} textAlign="center">
          <CardBody>
            <Box fontSize="3xl" mb={2}>📝</Box>
            <Heading size="md" mb={2}>No Personal Notes Found</Heading>
            <Text color={mutedText} fontSize="sm" maxW="450px" mx="auto">
              {searchQuery.trim() || filterCategory !== 'All'
                ? 'No notes match your current search or category filter. Try clearing filters.'
                : 'You have not created any personal notes yet. Use the form above to add your first note!'}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {processedNotes.map((note) => {
            const isPinned = Boolean(note.isPinned);
            return (
              <Card
                key={note.id}
                bg={isPinned ? pinnedCardBg : cardBg}
                borderColor={isPinned ? pinnedBorder : borderColor}
                borderWidth={isPinned ? '2px' : '1px'}
                borderRadius="2xl"
                boxShadow={isPinned ? 'md' : 'sm'}
                transition="all 0.2s"
                _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)', boxShadow: 'md' }}
                display="flex"
                flexDirection="column"
              >
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="flex-start" gap={2}>
                    <VStack align="flex-start" spacing={1} flex="1">
                      <HStack spacing={2} flexWrap="wrap">
                        {isPinned && (
                          <Badge colorScheme="blue" variant="solid" display="flex" alignItems="center" gap={1}>
                            <BsPinAngleFill /> PINNED
                          </Badge>
                        )}
                        <Tag size="sm" colorScheme="purple" variant="subtle">
                          {note.category || 'General'}
                        </Tag>
                        {getPriorityBadge(note.priority)}
                      </HStack>
                      <Heading size="md" mt={1} color={isPinned ? 'blue.800' : undefined}>
                        {note.name}
                      </Heading>
                    </VStack>

                    <HStack spacing={1}>
                      <Tooltip label={isPinned ? 'Unpin note' : 'Pin note to top'}>
                        <IconButton
                          aria-label="Pin Note"
                          icon={isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
                          size="xs"
                          variant={isPinned ? 'solid' : 'ghost'}
                          colorScheme="blue"
                          onClick={() => togglePinNote(note.id)}
                        />
                      </Tooltip>
                      <Tooltip label="Edit note">
                        <IconButton
                          aria-label="Edit Note"
                          icon={<FiEdit2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="teal"
                          onClick={() => openEditModal(note)}
                        />
                      </Tooltip>
                      <Tooltip label="Delete note">
                        <IconButton
                          aria-label="Delete Note"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => openDeleteDialog(note)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </CardHeader>

                <CardBody py={2} flex="1">
                  <HStack spacing={4} color="gray.500" fontSize="xs" mb={3}>
                    <HStack spacing={1}>
                      <FiFolder />
                      <Text fontWeight="medium" color="blue.500">
                        {note.projectName || 'General'}
                      </Text>
                    </HStack>
                    <HStack spacing={1}>
                      <FiCalendar />
                      <Text>{note.date || 'No Date'}</Text>
                    </HStack>
                  </HStack>

                  <Text
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    color={useColorModeValue('gray.700', 'gray.200')}
                  >
                    {note.body}
                  </Text>
                </CardBody>

                <CardFooter pt={2} pb={3} borderTop="1px solid" borderColor={borderColor}>
                  <Flex justify="space-between" align="center" w="100%" fontSize="2xs" color="gray.400">
                    <Text>
                      {note.updatedAt ? `Updated: ${new Date(note.updatedAt).toLocaleDateString()}` : 'Saved locally'}
                    </Text>
                    <HStack spacing={2}>
                      <Button size="xs" variant="outline" colorScheme="blue" leftIcon={<FiEdit2 />} onClick={() => openEditModal(note)}>
                        Edit
                      </Button>
                      <Button size="xs" variant="outline" colorScheme="red" leftIcon={<FiTrash2 />} onClick={() => openDeleteDialog(note)}>
                        Delete
                      </Button>
                    </HStack>
                  </Flex>
                </CardFooter>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* Edit Note Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={2}>
              <FiEdit2 color="#3182CE" />
              <Text>Edit Personal Note</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Note Title / Name</FormLabel>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Project / Platform Name</FormLabel>
                  <Input
                    value={editForm.projectName}
                    onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Target Date</FormLabel>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Category</FormLabel>
                  <Select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Priority</FormLabel>
                  <Select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Note Details / Content</FormLabel>
                <Textarea
                  rows={6}
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" leftIcon={<FiCheck />} onClick={handleUpdateNote}>
              Update Note
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Personal Note
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete note <strong>"{deletingNote?.name}"</strong>? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter gap={2}>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" leftIcon={<FiTrash2 />} onClick={confirmDeleteNote}>
                Delete Note
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
