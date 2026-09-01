import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEdit3, FiEye, FiFileText, FiSearch, FiTrash2 } from 'react-icons/fi';

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const formatDate = (value) => {
  if (!value) return 'No date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No date';
  return parsed.toLocaleString();
};

const NotesContainer = ({
  notes = [],
  handleEdit,
  onRequestDelete,
  onViewNote,
  activeNoteId,
  deletingNoteId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const cardBg = useColorModeValue('white', 'gray.800');
  const panelBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.600', 'gray.400');

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => (
      String(note.title || '').toLowerCase().includes(query)
      || stripHtml(note.content || '').toLowerCase().includes(query)
    ));
  }, [notes, searchQuery]);

  return (
    <Box>
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3} mb={3}>
        <Box>
          <HStack spacing={2}>
            <Icon as={FiFileText} color="teal.500" />
            <Text fontWeight="900">Saved Notes</Text>
            <Badge colorScheme="teal" borderRadius="full">{notes.length}</Badge>
          </HStack>
          <Text fontSize="sm" color={muted}>Search, open, edit, or delete your scratchpad notes.</Text>
        </Box>
        <HStack
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          px={3}
          w={{ base: '100%', sm: '260px' }}
        >
          <Icon as={FiSearch} color={muted} />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search notes"
            variant="unstyled"
            size="sm"
          />
        </HStack>
      </Flex>

      {filteredNotes.length === 0 ? (
        <Box bg={panelBg} border="1px dashed" borderColor={borderColor} borderRadius="2xl" p={5} textAlign="center">
          <Icon as={FiFileText} color={muted} boxSize={6} mb={2} />
          <Text fontWeight="800">No notes found</Text>
          <Text fontSize="sm" color={muted}>Create a new note or adjust your search.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {filteredNotes.map((note) => {
            const noteId = note._id || note.id;
            const isActive = String(activeNoteId || '') === String(noteId || '');
            return (
              <Box
                key={noteId}
                bg={cardBg}
                border="1px solid"
                borderColor={isActive ? 'teal.300' : borderColor}
                borderRadius="2xl"
                p={4}
                boxShadow={isActive ? '0 0 0 3px rgba(20, 184, 166, 0.16)' : '0 10px 28px rgba(15, 23, 42, 0.06)'}
                transition="box-shadow 0.2s ease, transform 0.2s ease"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.1)' }}
              >
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <HStack justify="space-between" align="start" gap={2}>
                      <Text fontWeight="900" noOfLines={1}>{note.title || 'Untitled note'}</Text>
                      {isActive && <Badge colorScheme="teal">Editing</Badge>}
                    </HStack>
                    <Text fontSize="xs" color={muted}>{formatDate(note.updatedAt || note.createdAt)}</Text>
                  </Box>
                  <Text fontSize="sm" color={muted} noOfLines={3}>
                    {stripHtml(note.content || '') || 'No note content.'}
                  </Text>
                  <Flex justify="space-between" align="center" gap={2}>
                    <Button size="xs" variant="outline" colorScheme="blue" leftIcon={<FiEye />} onClick={() => onViewNote?.(note)}>
                      Detail
                    </Button>
                    <HStack spacing={1}>
                      <Tooltip label="Edit note" hasArrow>
                        <IconButton
                          aria-label="Edit note"
                          size="xs"
                          colorScheme="yellow"
                          variant="ghost"
                          icon={<FiEdit3 />}
                          onClick={() => handleEdit?.(noteId)}
                        />
                      </Tooltip>
                      <Tooltip label="Delete note" hasArrow>
                        <IconButton
                          aria-label="Delete note"
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          icon={<FiTrash2 />}
                          isLoading={String(deletingNoteId || '') === String(noteId || '')}
                          onClick={() => onRequestDelete?.(note)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default NotesContainer;
