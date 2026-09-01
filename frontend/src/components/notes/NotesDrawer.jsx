import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
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
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiAlertTriangle, FiCheckCircle, FiEdit3, FiFileText, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import NotesContainer from './NotesContainer';

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const NotesDrawer = ({ isOpen, onClose, onNotesUpdate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedDetailNote, setSelectedDetailNote] = useState(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState('');
  const toast = useToast();

  const bodyBg = useColorModeValue('white', 'gray.800');
  const shellBg = useColorModeValue(
    'linear-gradient(135deg, #f8fafc 0%, #ecfeff 48%, #eef2ff 100%)',
    'linear-gradient(135deg, #111827 0%, #0f172a 52%, #164e63 100%)'
  );
  const panelBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(17,24,39,0.88)');
  const fieldBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  const showNoteToast = useCallback(({ title: toastTitle, description, status = 'info' }) => {
    const tone = {
      success: { color: 'green.500', bg: 'green.50', icon: FiCheckCircle },
      error: { color: 'red.500', bg: 'red.50', icon: FiAlertTriangle },
      warning: { color: 'orange.500', bg: 'orange.50', icon: FiAlertTriangle },
      info: { color: 'blue.500', bg: 'blue.50', icon: FiFileText },
    }[status] || { color: 'blue.500', bg: 'blue.50', icon: FiFileText };

    toast({
      position: 'top',
      duration: status === 'error' ? 5000 : 3200,
      isClosable: true,
      render: ({ onClose: closeToast }) => (
        <Box
          bg={bodyBg}
          border="1px solid"
          borderColor={tone.color}
          borderLeftWidth="5px"
          borderRadius="xl"
          boxShadow="0 18px 45px rgba(15, 23, 42, 0.18)"
          p={3}
          w={{ base: 'calc(100vw - 32px)', sm: '420px' }}
          mx="auto"
        >
          <HStack align="start" spacing={3}>
            <Flex boxSize="34px" borderRadius="lg" bg={tone.bg} color={tone.color} align="center" justify="center" flexShrink={0}>
              <Icon as={tone.icon} />
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="900">{toastTitle}</Text>
              {description && <Text fontSize="xs" color={muted} mt={0.5}>{description}</Text>}
            </Box>
            <IconButton type="button" aria-label="Close alert" size="xs" variant="ghost" icon={<FiX />} onClick={closeToast} />
          </HStack>
        </Box>
      ),
    });
  }, [bodyBg, muted, toast]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedNoteId(null);
  };

  const fetchNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notes`);
      const nextNotes = Array.isArray(response.data) ? response.data : [];
      setNotes(nextNotes);
      onNotesUpdate?.(nextNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      showNoteToast({
        title: 'Unable to load notes',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [onNotesUpdate, showNoteToast]);

  useEffect(() => {
    if (isOpen) fetchNotes();
  }, [fetchNotes, isOpen]);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !stripHtml(cleanContent)) {
      showNoteToast({
        title: 'Title and note content are required',
        status: 'warning',
      });
      return;
    }

    setIsSavingNote(true);
    try {
      const noteData = { title: cleanTitle, content: cleanContent };
      if (selectedNoteId) {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/notes/${selectedNoteId}`, noteData);
        const updatedNotes = notes.map((note) => (
          String(note._id || note.id) === String(selectedNoteId) ? response.data : note
        ));
        setNotes(updatedNotes);
        onNotesUpdate?.(updatedNotes);
        showNoteToast({ title: 'Note updated', description: cleanTitle, status: 'success' });
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/notes`, noteData);
        const nextNotes = [response.data, ...notes];
        setNotes(nextNotes);
        onNotesUpdate?.(nextNotes);
        showNoteToast({ title: 'Note created', description: cleanTitle, status: 'success' });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
      showNoteToast({
        title: selectedNoteId ? 'Note update failed' : 'Note creation failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleEdit = (noteId) => {
    const note = notes.find((item) => String(item._id || item.id) === String(noteId));
    if (!note) return;
    setTitle(note.title || '');
    setContent(note.content || '');
    setSelectedNoteId(noteId);
    setSelectedDetailNote(null);
  };

  const handleDelete = async (note) => {
    const noteId = note?._id || note?.id;
    if (!noteId) return;
    setDeletingNoteId(noteId);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/notes/${noteId}`);
      const updatedNotes = notes.filter((item) => String(item._id || item.id) !== String(noteId));
      setNotes(updatedNotes);
      onNotesUpdate?.(updatedNotes);
      if (String(selectedNoteId || '') === String(noteId)) resetForm();
      if (String(selectedDetailNote?._id || selectedDetailNote?.id || '') === String(noteId)) setSelectedDetailNote(null);
      setPendingDeleteNote(null);
      showNoteToast({
        title: 'Note deleted',
        description: note.title || 'Scratchpad note removed.',
        status: 'success',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      showNoteToast({
        title: 'Note delete failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setDeletingNoteId('');
    }
  };

  const drawerTitle = selectedNoteId ? 'Edit Scratchpad Note' : 'Create Scratchpad Note';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="xl" placement="right">
      <DrawerOverlay backdropFilter="blur(3px)" />
      <DrawerContent maxW={{ base: '100vw', md: '780px' }} bg={shellBg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor={borderColor} px={{ base: 4, md: 6 }} py={4}>
          <HStack spacing={4} pr={8}>
            <Flex boxSize="46px" borderRadius="2xl" bg="teal.400" color="white" align="center" justify="center" boxShadow="0 14px 30px rgba(20, 184, 166, 0.25)">
              <Icon as={FiFileText} boxSize={5} />
            </Flex>
            <Box>
              <HStack mb={1} wrap="wrap">
                <Badge colorScheme="teal" borderRadius="full" px={3}>CS Workspace</Badge>
                <Badge colorScheme={selectedNoteId ? 'yellow' : 'blue'} borderRadius="full" px={3}>
                  {selectedNoteId ? 'Editing' : 'New Note'}
                </Badge>
              </HStack>
              <Heading size="md" color={textColor}>Scratchpad & Notes</Heading>
              <Text fontSize="sm" color={muted}>Create, edit, delete, and review working notes without leaving the dashboard.</Text>
            </Box>
          </HStack>
        </DrawerHeader>

        <DrawerBody px={{ base: 4, md: 6 }} py={5} color={textColor} overflowY="auto">
          <VStack spacing={5} align="stretch">
            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
              <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3} mb={4}>
                <HStack>
                  <Icon as={selectedNoteId ? FiEdit3 : FiPlus} color="teal.500" />
                  <Heading size="sm">{drawerTitle}</Heading>
                </HStack>
                <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<FiPlus />} onClick={resetForm}>
                  New Note
                </Button>
              </Flex>

              <VStack spacing={4} align="stretch">
                <FormControl id="title" isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter note title"
                    size="md"
                    bg={fieldBg}
                  />
                </FormControl>

                <FormControl id="content" isRequired>
                  <FormLabel>Content</FormLabel>
                  <Box
                    bg={fieldBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="xl"
                    overflow="hidden"
                    sx={{
                      '.ql-toolbar': { border: '0', borderBottom: '1px solid', borderColor },
                      '.ql-container': { border: '0', minHeight: '190px', fontSize: '14px' },
                      '.ql-editor': { minHeight: '190px' },
                    }}
                  >
                    <ReactQuill
                      value={content}
                      onChange={setContent}
                      placeholder="Write your note here..."
                      theme="snow"
                      modules={{
                        toolbar: [
                          [{ header: '1' }, { header: '2' }],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          ['bold', 'italic', 'underline'],
                          ['link'],
                          [{ color: [] }, { background: [] }],
                          ['clean'],
                        ],
                      }}
                    />
                  </Box>
                </FormControl>

                <Flex justify="flex-end" gap={3} wrap="wrap">
                  <Button variant="ghost" onClick={resetForm} isDisabled={!title && !content && !selectedNoteId}>
                    Clear
                  </Button>
                  <Button colorScheme="teal" leftIcon={selectedNoteId ? <FiEdit3 /> : <FiPlus />} onClick={handleSave} isLoading={isSavingNote}>
                    {selectedNoteId ? 'Update Note' : 'Create Note'}
                  </Button>
                </Flex>
              </VStack>
            </Box>

            <Box bg={panelBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
              {isLoadingNotes ? (
                <Box bg={bodyBg} borderRadius="xl" p={5} color={muted}>Loading notes...</Box>
              ) : (
                <NotesContainer
                  notes={notes}
                  handleEdit={handleEdit}
                  onRequestDelete={setPendingDeleteNote}
                  onViewNote={setSelectedDetailNote}
                  activeNoteId={selectedNoteId}
                  deletingNoteId={deletingNoteId}
                />
              )}
            </Box>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTop="1px solid" borderColor={borderColor} px={{ base: 4, md: 6 }} py={3} bg={bodyBg}>
          <Button onClick={onClose}>Close</Button>
        </DrawerFooter>

        {selectedDetailNote && (
          <Flex position="fixed" inset={0} zIndex={3200} align="center" justify="center" p={4}>
            <Box position="absolute" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" onClick={() => setSelectedDetailNote(null)} />
            <Box position="relative" bg={bodyBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.28)" p={5} w={{ base: '100%', md: '560px' }} maxH="82vh" overflowY="auto">
              <Flex justify="space-between" align="start" gap={3} mb={3}>
                <Box>
                  <Badge colorScheme="blue" borderRadius="full" mb={2}>Note Detail</Badge>
                  <Heading size="sm">{selectedDetailNote.title || 'Untitled note'}</Heading>
                  <Text fontSize="xs" color={muted}>
                    Updated {selectedDetailNote.updatedAt ? new Date(selectedDetailNote.updatedAt).toLocaleString() : 'recently'}
                  </Text>
                </Box>
                <IconButton aria-label="Close note detail" size="sm" variant="ghost" icon={<FiX />} onClick={() => setSelectedDetailNote(null)} />
              </Flex>
              <Divider mb={4} />
              <Box fontSize="sm" sx={{ 'p': { marginBottom: 2 }, 'ul,ol': { paddingLeft: 5 } }} dangerouslySetInnerHTML={{ __html: selectedDetailNote.content || '<p>No note content.</p>' }} />
              <HStack justify="flex-end" mt={5}>
                <Button size="sm" colorScheme="yellow" leftIcon={<FiEdit3 />} onClick={() => handleEdit(selectedDetailNote._id || selectedDetailNote.id)}>
                  Edit
                </Button>
              </HStack>
            </Box>
          </Flex>
        )}

        {pendingDeleteNote && (
          <Flex position="fixed" inset={0} zIndex={3300} align="center" justify="center" p={4}>
            <Box position="absolute" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" onClick={() => setPendingDeleteNote(null)} />
            <Box position="relative" bg={bodyBg} border="1px solid" borderColor="red.200" borderRadius="2xl" boxShadow="0 24px 70px rgba(15, 23, 42, 0.28)" p={5} w={{ base: '100%', sm: '430px' }}>
              <HStack align="start" spacing={3}>
                <Flex boxSize="42px" borderRadius="xl" bg="red.50" color="red.500" align="center" justify="center" flexShrink={0}>
                  <Icon as={FiTrash2} boxSize={5} />
                </Flex>
                <Box flex="1">
                  <Heading size="sm">Delete note?</Heading>
                  <Text fontSize="sm" color={muted} mt={1}>
                    {pendingDeleteNote.title || 'This note'} will be permanently removed.
                  </Text>
                  <HStack justify="flex-end" mt={5} spacing={3}>
                    <Button size="sm" variant="ghost" onClick={() => setPendingDeleteNote(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" colorScheme="red" leftIcon={<FiTrash2 />} isLoading={deletingNoteId === (pendingDeleteNote._id || pendingDeleteNote.id)} onClick={() => handleDelete(pendingDeleteNote)}>
                      Delete
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            </Box>
          </Flex>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default NotesDrawer;
