import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
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
  Select,
  SimpleGrid,
  Tag,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUserCheck,
} from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { useUserStore } from '../../store/user';
import { buildTaskReminders, filterReadReminders, markReminderRead } from '../../pages/it/utils/itWorkflow';

const urgencyScheme = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
  success: 'green',
};

const REMINDER_TYPES = [
  { value: 'all', label: 'All Reminders' },
  { value: 'deadline', label: '🚨 Overdue / Deadlines' },
  { value: 'due-soon', label: '⏰ Due Soon (3 Days)' },
  { value: 'review', label: '🔍 Waiting Review' },
  { value: 'action', label: '⚡ Action Required' },
  { value: 'custom', label: '📝 Custom Reminders' },
];

export default function ITRemindersPanel({ tasks = [], fetchTasks, onReminderRead, onSelectTask }) {
  const currentUser = useUserStore((state) => state.currentUser || state.user || {});
  const [readVersion, setReadVersion] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingReminder, setSubmittingReminder] = useState(false);

  // New Reminder Modal
  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const [newReminderData, setNewReminderData] = useState({
    taskId: '',
    title: '',
    note: '',
    type: 'task',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.750');

  // Build active reminders list
  const allReminders = useMemo(
    () => filterReadReminders(buildTaskReminders(tasks), currentUser),
    [currentUser, readVersion, tasks]
  );

  // Statistics
  const stats = useMemo(() => {
    const total = allReminders.length;
    const critical = allReminders.filter((r) => r.urgency === 'critical' || r.type === 'deadline').length;
    const dueSoon = allReminders.filter((r) => r.id.includes('due-soon')).length;
    const review = allReminders.filter((r) => r.type === 'review').length;
    const custom = allReminders.filter((r) => r.custom).length;
    return { total, critical, dueSoon, review, custom };
  }, [allReminders]);

  // Filtered Reminders List
  const filteredReminders = useMemo(() => {
    return allReminders.filter((reminder) => {
      if (activeTab === 'deadline' && reminder.urgency !== 'critical' && reminder.type !== 'deadline') return false;
      if (activeTab === 'due-soon' && !reminder.id.includes('due-soon')) return false;
      if (activeTab === 'review' && reminder.type !== 'review') return false;
      if (activeTab === 'action' && reminder.type !== 'action') return false;
      if (activeTab === 'custom' && !reminder.custom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = String(reminder.title || '').toLowerCase().includes(q);
        const noteMatch = String(reminder.note || '').toLowerCase().includes(q);
        const typeMatch = String(reminder.type || '').toLowerCase().includes(q);
        if (!titleMatch && !noteMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [allReminders, activeTab, searchQuery]);

  // Mark custom reminder as completed in DB
  const completeReminder = async (reminder) => {
    if (!reminder.custom || !reminder.reminderId || !reminder.taskId) return;
    try {
      await axiosInstance.patch(`/it/${reminder.taskId}/reminders/${reminder.reminderId}`, { isDone: true });
      fetchTasks?.();
      toast({ title: 'Reminder completed', status: 'success', duration: 2500 });
    } catch (error) {
      toast({
        title: 'Unable to complete reminder',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  // Mark generated reminder as read
  const markGeneratedReminderRead = (reminder) => {
    markReminderRead(currentUser, reminder.id);
    setReadVersion((value) => value + 1);
    onReminderRead?.();
    toast({ title: 'Reminder marked as read', status: 'success', duration: 2000 });
  };

  // Mark all generated reminders as read
  const markAllRead = () => {
    allReminders.forEach((r) => {
      if (!r.custom) {
        markReminderRead(currentUser, r.id);
      }
    });
    setReadVersion((v) => v + 1);
    onReminderRead?.();
    toast({ title: 'All task reminders marked as read', status: 'info', duration: 2500 });
  };

  // Snooze reminder
  const snoozeReminder = async (reminder, days = 1) => {
    if (reminder.custom && reminder.reminderId && reminder.taskId) {
      try {
        const newDue = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        await axiosInstance.patch(`/it/${reminder.taskId}/reminders/${reminder.reminderId}`, { dueAt: newDue });
        fetchTasks?.();
        toast({ title: `Reminder snoozed for +${days} day(s)`, status: 'info', duration: 2000 });
      } catch (err) {
        toast({ title: 'Could not snooze reminder', status: 'error' });
      }
    } else {
      markReminderRead(currentUser, reminder.id);
      setReadVersion((v) => v + 1);
      toast({ title: `Reminder snoozed`, status: 'info', duration: 2000 });
    }
  };

  // Submit New Custom Reminder
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newReminderData.title.trim()) {
      toast({ title: 'Reminder title is required', status: 'warning', duration: 2500 });
      return;
    }
    if (!newReminderData.taskId) {
      toast({ title: 'Please select an associated task', status: 'warning', duration: 2500 });
      return;
    }

    try {
      setSubmittingReminder(true);
      await axiosInstance.post(`/it/${newReminderData.taskId}/reminders`, {
        title: newReminderData.title.trim(),
        note: newReminderData.note.trim(),
        type: newReminderData.type,
        dueAt: newReminderData.dueAt ? new Date(newReminderData.dueAt).toISOString() : undefined,
      });
      onNewClose();
      setNewReminderData({
        taskId: '',
        title: '',
        note: '',
        type: 'task',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      fetchTasks?.();
      toast({ title: 'Task reminder created successfully', status: 'success', duration: 3000 });
    } catch (err) {
      toast({
        title: 'Failed to create reminder',
        description: err.response?.data?.message || err.message,
        status: 'error',
      });
    } finally {
      setSubmittingReminder(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header Bar */}
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} flexWrap="wrap">
        <HStack spacing={3}>
          <Box p={2.5} bg="blue.500" color="white" borderRadius="xl" boxShadow="sm">
            <FiBell size={22} />
          </Box>
          <Box>
            <Heading size="lg">Task Reminders & Deadlines</Heading>
            <Text color={muted} fontSize="sm">
              Urgent actions, upcoming deadlines, approval queues, and team follow-ups.
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <IconButton
            aria-label="Refresh reminders"
            icon={<FiRefreshCw />}
            size="sm"
            variant="outline"
            onClick={() => {
              fetchTasks?.();
              toast({ title: 'Reminders refreshed', status: 'info', duration: 1500 });
            }}
          />
          {allReminders.length > 0 && (
            <Button size="sm" variant="outline" colorScheme="blue" onClick={markAllRead}>
              Mark All as Read
            </Button>
          )}
          <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={onNewOpen}>
            Set Reminder
          </Button>
        </HStack>
      </Flex>

      {/* Metrics Summary Bar */}
      <SimpleGrid columns={{ base: 2, sm: 2, md: 5 }} spacing={3}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={3.5}>
            <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">ACTIVE REMINDERS</Text>
            <Heading size="md" mt={1}>{stats.total}</Heading>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={3.5}>
            <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">🚨 CRITICAL / OVERDUE</Text>
            <Heading size="md" mt={1} color="red.500">{stats.critical}</Heading>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={3.5}>
            <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">⏰ DUE IN 3 DAYS</Text>
            <Heading size="md" mt={1} color="orange.500">{stats.dueSoon}</Heading>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={3.5}>
            <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">🔍 WAITING REVIEW</Text>
            <Heading size="md" mt={1} color="purple.500">{stats.review}</Heading>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={3.5}>
            <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">📝 CUSTOM TASKS</Text>
            <Heading size="md" mt={1} color="teal.500">{stats.custom}</Heading>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters & Search Bar */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
        <CardBody py={3} px={4}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={3} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
            {/* Filter Tabs */}
            <HStack spacing={1.5} overflowX="auto" pb={{ base: 2, md: 0 }} maxW={{ base: '100%', md: '65%' }}>
              {REMINDER_TYPES.map((type) => (
                <Button
                  key={type.value}
                  size="xs"
                  variant={activeTab === type.value ? 'solid' : 'ghost'}
                  colorScheme={activeTab === type.value ? 'blue' : 'gray'}
                  onClick={() => setActiveTab(type.value)}
                  whiteSpace="nowrap"
                  borderRadius="md"
                >
                  {type.label}
                </Button>
              ))}
            </HStack>

            {/* Search Input */}
            <InputGroup size="sm" maxW={{ base: '100%', md: '240px' }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Flex>
        </CardBody>
      </Card>

      {/* Reminder Queue List */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
        <CardHeader pb={2} pt={4} px={5}>
          <Flex justify="space-between" align="center">
            <Heading size="md">Reminder Queue</Heading>
            <Badge colorScheme="blue" borderRadius="full" px={2.5} py={0.5}>
              {filteredReminders.length} Active
            </Badge>
          </Flex>
        </CardHeader>

        <CardBody px={5} pt={2} pb={5}>
          {filteredReminders.length === 0 ? (
            <Box py={12} textAlign="center">
              <Icon as={FiCheckCircle} boxSize={10} color="green.400" mb={3} />
              <Heading size="sm" mb={1}>All caught up!</Heading>
              <Text color={muted} fontSize="sm" maxW="400px" mx="auto">
                No active reminders found for your current filter. Use the button above to set a new task reminder.
              </Text>
            </Box>
          ) : (
            <VStack spacing={3.5} align="stretch">
              {filteredReminders.map((reminder, index) => {
                const scheme = urgencyScheme[reminder.urgency] || 'blue';
                const isOverdue = reminder.urgency === 'critical';

                return (
                  <Box
                    key={reminder.id}
                    border="1px solid"
                    borderColor={borderColor}
                    borderLeft="5px solid"
                    borderLeftColor={`${scheme}.400`}
                    borderRadius="xl"
                    p={{ base: 3.5, md: 4 }}
                    bg={isOverdue ? `${scheme}.50` : cardBg}
                    _dark={{ bg: isOverdue ? 'rgba(229, 62, 62, 0.08)' : cardBg }}
                    transition="all 0.2s"
                    _hover={{ borderColor: `${scheme}.400`, boxShadow: 'sm' }}
                  >
                    <Flex
                      justify="space-between"
                      align={{ base: 'flex-start', sm: 'center' }}
                      direction={{ base: 'column', sm: 'row' }}
                      gap={3}
                    >
                      <HStack align="flex-start" spacing={3} flex="1">
                        <Badge colorScheme={scheme} borderRadius="full" px={2} mt={0.5} flexShrink={0}>
                          #{index + 1}
                        </Badge>
                        <Box>
                          <HStack spacing={2} mb={1} wrap="wrap">
                            <Badge colorScheme={scheme} variant="solid" fontSize="2xs" borderRadius="md">
                              {reminder.urgency === 'critical' ? '🚨 URGENT' : 'REMINDER'}
                            </Badge>
                            <Badge colorScheme={scheme} fontSize="2xs">
                              {reminder.type?.toUpperCase()}
                            </Badge>
                            {reminder.dueAt && (
                              <Badge variant="outline" colorScheme={scheme} fontSize="2xs" display="flex" alignItems="center" gap={1}>
                                <FiClock size={10} />
                                {new Date(reminder.dueAt).toLocaleDateString()}
                              </Badge>
                            )}
                            {reminder.custom && (
                              <Badge colorScheme="teal" variant="subtle" fontSize="2xs">
                                Custom Note
                              </Badge>
                            )}
                          </HStack>

                          <Text fontWeight="700" fontSize="sm" color={useColorModeValue('gray.800', 'gray.100')}>
                            {reminder.title}
                          </Text>

                          {reminder.note && (
                            <Text color={muted} fontSize="xs" mt={0.5}>
                              {reminder.note}
                            </Text>
                          )}
                        </Box>
                      </HStack>

                      {/* Reminder Actions */}
                      <HStack spacing={2} alignSelf={{ base: 'flex-end', sm: 'center' }} flexShrink={0}>
                        <Tooltip label="Snooze for +1 day">
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="gray"
                            onClick={() => snoozeReminder(reminder, 1)}
                          >
                            +1d
                          </Button>
                        </Tooltip>

                        {reminder.custom ? (
                          <Button
                            size="xs"
                            colorScheme="green"
                            variant="solid"
                            leftIcon={<FiCheck />}
                            onClick={() => completeReminder(reminder)}
                          >
                            Done
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                            leftIcon={<FiCheck />}
                            onClick={() => markGeneratedReminderRead(reminder)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Create Custom Reminder Modal */}
      <Modal isOpen={isNewOpen} onClose={onNewClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl">
          <form onSubmit={handleCreateReminder}>
            <ModalHeader>
              <HStack spacing={2}>
                <FiBell color="#3182CE" />
                <Text>Set New Task Reminder</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Associated IT Task</FormLabel>
                  <Select
                    placeholder="Select a task..."
                    value={newReminderData.taskId}
                    onChange={(e) => setNewReminderData({ ...newReminderData, taskId: e.target.value })}
                  >
                    {tasks.map((task) => (
                      <option key={task._id || task.id} value={task._id || task.id}>
                        {task.taskName || task.client || 'IT Task'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Reminder Title</FormLabel>
                  <Input
                    placeholder="e.g. Verify deployment health checks & logs"
                    value={newReminderData.title}
                    onChange={(e) => setNewReminderData({ ...newReminderData, title: e.target.value })}
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Reminder Type</FormLabel>
                    <Select
                      value={newReminderData.type}
                      onChange={(e) => setNewReminderData({ ...newReminderData, type: e.target.value })}
                    >
                      <option value="task">Task Action</option>
                      <option value="deadline">Deadline Alert</option>
                      <option value="review">Review Followup</option>
                      <option value="maintenance">Maintenance Check</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Due Date</FormLabel>
                    <Input
                      type="date"
                      value={newReminderData.dueAt}
                      onChange={(e) => setNewReminderData({ ...newReminderData, dueAt: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Notes & Action Items</FormLabel>
                  <Textarea
                    rows={3}
                    placeholder="Provide additional context, checklist, or instructions..."
                    value={newReminderData.note}
                    onChange={(e) => setNewReminderData({ ...newReminderData, note: e.target.value })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={onNewClose}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={submittingReminder}>
                Create Reminder
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
