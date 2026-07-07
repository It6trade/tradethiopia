import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';

const makeStorageKey = (user) => `it-personal-notes-${user?._id || user?.email || 'local'}`;

export default function ITNotesPanel({ user }) {
  const storageKey = makeStorageKey(user);
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState({ name: '', projectName: '', date: new Date().toISOString().slice(0, 10), body: '' });
  const [sortBy, setSortBy] = useState('date');
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const saveNotes = (nextNotes) => {
    setNotes(nextNotes);
    localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  };

  const addNote = () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: 'Name and note are required', status: 'error' });
      return;
    }
    saveNotes([{ id: Date.now(), ...form, createdAt: new Date().toISOString() }, ...notes]);
    setForm({ name: '', projectName: '', date: new Date().toISOString().slice(0, 10), body: '' });
    toast({ title: 'Note saved', status: 'success' });
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')));
  }, [notes, sortBy]);

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Personal Notes</Heading>
        <Text color="gray.500">Organize your work planning by name, date, and project name.</Text>
      </Box>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormControl>
            <FormControl>
              <FormLabel>Date</FormLabel>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </FormControl>
            <FormControl>
              <FormLabel>Project Name</FormLabel>
              <Input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
            </FormControl>
          </SimpleGrid>
          <FormControl>
            <FormLabel>Note</FormLabel>
            <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </FormControl>
          <HStack justify="space-between" mt={4}>
            <Select maxW="220px" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="projectName">Sort by Project Name</option>
            </Select>
            <Button colorScheme="blue" onClick={addNote}>Save Note</Button>
          </HStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        {sortedNotes.map((note) => (
          <Card key={note.id} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
            <CardBody>
              <HStack justify="space-between" mb={2}>
                <Heading size="sm">{note.name}</Heading>
                <Text fontSize="sm" color="gray.500">{note.date}</Text>
              </HStack>
              <Text fontSize="sm" color="blue.500" fontWeight="semibold">{note.projectName || 'General'}</Text>
              <Text mt={3} whiteSpace="pre-wrap">{note.body}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
