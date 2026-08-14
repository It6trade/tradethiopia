import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { useUserStore } from '../../../store/user';
import { buildTaskReminders, filterReadReminders, markReminderRead } from '../utils/itWorkflow';

const urgencyScheme = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

const FlexReminderIcon = ({ colorScheme = 'blue' }) => (
  <Flex
    boxSize="34px"
    borderRadius="full"
    align="center"
    justify="center"
    bg={`${colorScheme}.50`}
    color={`${colorScheme}.600`}
    flexShrink={0}
  >
    <Icon as={FiBell} boxSize={4} />
  </Flex>
);

export default function ITRemindersPanel({ tasks = [], fetchTasks, onReminderRead }) {
  const { currentUser } = useUserStore();
  const token = currentUser?.token;
  const [readVersion, setReadVersion] = useState(0);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const reminders = useMemo(
    () => filterReadReminders(buildTaskReminders(tasks), currentUser),
    [currentUser, readVersion, tasks]
  );

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

  const markGeneratedReminderRead = (reminder) => {
    markReminderRead(currentUser, reminder.id);
    setReadVersion((value) => value + 1);
    onReminderRead?.();
    toast({ title: 'Reminder marked as read', status: 'success' });
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
              {reminders.map((reminder, index) => (
                <Box
                  key={reminder.id}
                  border="1px solid"
                  borderColor={borderColor}
                  borderLeft="5px solid"
                  borderLeftColor={`${urgencyScheme[reminder.urgency] || 'blue'}.400`}
                  borderRadius="12px"
                  p={4}
                >
                  <HStack justify="space-between" align="flex-start" spacing={4}>
                    <HStack align="flex-start" spacing={3}>
                      <VStack spacing={1} flexShrink={0}>
                        <Badge colorScheme={urgencyScheme[reminder.urgency] || 'blue'} borderRadius="full" px={2}>
                          #{index + 1}
                        </Badge>
                        <FlexReminderIcon colorScheme={urgencyScheme[reminder.urgency] || 'blue'} />
                      </VStack>
                      <Box>
                      <HStack spacing={2} mb={1} wrap="wrap">
                        <Badge colorScheme={urgencyScheme[reminder.urgency] || 'blue'} variant="solid">
                          Reminder
                        </Badge>
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
                    </HStack>
                    {reminder.custom ? (
                      <Button size="sm" variant="outline" onClick={() => completeReminder(reminder)}>
                        Done
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" colorScheme="blue" onClick={() => markGeneratedReminderRead(reminder)}>
                        Mark read
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
