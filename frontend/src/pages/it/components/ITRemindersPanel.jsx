import React, { useMemo } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useUserStore } from '../../../store/user';
import { buildTaskReminders } from '../utils/itWorkflow';

const urgencyScheme = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

export default function ITRemindersPanel({ tasks = [], fetchTasks }) {
  const { currentUser } = useUserStore();
  const token = currentUser?.token;
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const reminders = useMemo(() => buildTaskReminders(tasks), [tasks]);

  const completeReminder = async (reminder) => {
    if (!reminder.custom || !reminder.reminderId) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/it/${reminder.taskId}/reminders/${reminder.reminderId}`,
        { isDone: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      toast({ title: 'Reminder completed', status: 'success' });
    } catch (error) {
      toast({
        title: 'Unable to update reminder',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Task Reminders</Heading>
        <Text color={muted} mt={1}>
          Actions, deadlines, reviews, and follow-ups that need attention.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
          <CardBody>
            <Text color={muted} fontSize="sm">Total reminders</Text>
            <Heading size="lg">{reminders.length}</Heading>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
          <CardBody>
            <Text color={muted} fontSize="sm">Urgent</Text>
            <Heading size="lg" color="red.500">{reminders.filter((item) => item.urgency === 'critical').length}</Heading>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
          <CardBody>
            <Text color={muted} fontSize="sm">Waiting review</Text>
            <Heading size="lg" color="purple.500">{reminders.filter((item) => item.type === 'review').length}</Heading>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px">
        <CardHeader>
          <Heading size="md">Reminder Queue</Heading>
        </CardHeader>
        <CardBody pt={0}>
          {reminders.length === 0 ? (
            <Box py={10} textAlign="center">
              <Text color={muted}>No active reminders for your visible IT tasks.</Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {reminders.map((reminder) => (
                <Box
                  key={reminder.id}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="12px"
                  p={4}
                >
                  <HStack justify="space-between" align="flex-start" spacing={4}>
                    <Box>
                      <HStack spacing={2} mb={1} wrap="wrap">
                        <Badge colorScheme={urgencyScheme[reminder.urgency] || 'blue'}>{reminder.type}</Badge>
                        {reminder.dueAt && (
                          <Badge variant="subtle">
                            {new Date(reminder.dueAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontWeight="800">{reminder.title}</Text>
                      {reminder.note && <Text color={muted} fontSize="sm">{reminder.note}</Text>}
                    </Box>
                    {reminder.custom && (
                      <Button size="sm" variant="outline" onClick={() => completeReminder(reminder)}>
                        Done
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
