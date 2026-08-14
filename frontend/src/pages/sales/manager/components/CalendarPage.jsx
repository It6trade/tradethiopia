import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
  IconButton,
  Select,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
  useToast,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Divider,
  Tooltip,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  VStack
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiMapPin,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getAgents } from '../../../../services/calendarService';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEventOpen, onOpen: onEventOpen, onClose: onEventClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    type: 'meeting',
    agent: '',
    agentId: '',
    location: ''
  });
  
  const toast = useToast();
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.750');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const todayBg = useColorModeValue('blue.100', 'blue.800');
  
  // Event type colors
  const eventTypeColors = {
    meeting: 'blue',
    call: 'green',
    training: 'purple',
    deadline: 'red',
    other: 'gray'
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => 
      isSameDay(event.start, date)
    );
  };

  // Fetch events and agents from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsData = await getCalendarEvents();
        // Convert date strings to Date objects
        const parsedEvents = eventsData.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(parsedEvents);
        setFilteredEvents(parsedEvents);
        
        // Fetch agents
        const agentsData = await getAgents();
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error fetching data',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = events;
    
    // Apply date filter
    if (view === 'day') {
      filtered = filtered.filter(event => isSameDay(event.start, selectedDate));
    } else if (view === 'week') {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      filtered = filtered.filter(event => 
        event.start >= weekStart && event.start <= weekEnd
      );
    }
    
    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventTypeFilter);
    }
    
    // Apply agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.agent === agentFilter || event.agent === 'All Agents'
      );
    }
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.agent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, selectedDate, view, eventTypeFilter, agentFilter, searchTerm]);

  // Navigation functions
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Calendar rendering functions
  const renderHeader = () => {
    return (
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Flex align="center" gap={2}>
          <IconButton
            icon={<FiChevronLeft />}
            onClick={prevMonth}
            size="sm"
            variant="outline"
          />
          <Heading size="md" color={textColor}>
            {format(currentDate, 'MMMM yyyy')}
          </Heading>
          <IconButton
            icon={<FiChevronRight />}
            onClick={nextMonth}
            size="sm"
            variant="outline"
          />
          <Button size="sm" onClick={goToToday} variant="ghost">
            Today
          </Button>
        </Flex>
        
        <Flex align="center" gap={2} wrap="wrap">
          <Select 
            value={view} 
            onChange={(e) => setView(e.target.value)}
            size="sm"
            width="fit-content"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </Select>
          
          <Select 
            value={eventTypeFilter} 
            onChange={(e) => setEventTypeFilter(e.target.value)}
            size="sm"
            width="fit-content"
          >
            <option value="all">All Types</option>
            <option value="meeting">Meetings</option>
            <option value="call">Calls</option>
            <option value="training">Training</option>
            <option value="deadline">Deadlines</option>
            <option value="other">Other</option>
          </Select>
          
          <Select 
            value={agentFilter} 
            onChange={(e) => setAgentFilter(e.target.value)}
            size="sm"
            width="fit-content"
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent._id} value={agent.fullName || agent.username}>
                {agent.fullName || agent.username}
              </option>
            ))}
          </Select>
          
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
            width="200px"
            leftElement={<FiSearch />}
          />
          
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            size="sm"
            onClick={() => {
              setNewEvent({
                title: '',
                start: '',
                end: '',
                description: '',
                type: 'meeting',
                agent: '',
                agentId: '',
                location: ''
              });
              onOpen();
            }}
          >
            Add Event
          </Button>
        </Flex>
      </Flex>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = 'EEE';
    const startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <Box 
          key={i} 
          textAlign="center" 
          fontWeight="bold" 
          color={textColor}
          py={2}
          borderBottom={`1px solid ${borderColor}`}
        >
          {format(addDays(startDate, i), dateFormat)}
        </Box>
      );
    }

    return (
      <SimpleGrid columns={7} spacing={0} mb={2}>
        {days}
      </SimpleGrid>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        
        days.push(
          <Box
            key={day.toString()}
            minH="100px"
            border={`1px solid ${borderColor}`}
            bg={isSameDay(day, selectedDate) ? selectedBg : 'transparent'}
            _hover={{ bg: hoverBg }}
            cursor="pointer"
            onClick={() => setSelectedDate(day)}
            p={1}
            position="relative"
          >
            <Text 
              fontSize="sm" 
              fontWeight={isSameDay(day, new Date()) ? 'bold' : 'normal'}
              color={isSameDay(day, new Date()) ? 'blue.500' : textColor}
              bg={isSameDay(day, new Date()) ? todayBg : 'transparent'}
              borderRadius="full"
              display="inline-block"
              px={2}
              py={1}
              mb={1}
            >
              {formattedDate}
            </Text>
            
            <VStack align="stretch" spacing={1} maxH="60px" overflowY="auto">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <Tooltip 
                  key={event._id} 
                  label={`${event.title} - ${format(event.start, 'h:mm a')}`}
                  placement="top"
                >
                  <Badge 
                    colorScheme={eventTypeColors[event.type] || 'gray'}
                    fontSize="xs"
                    py={0.5}
                    px={1}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      onEventOpen();
                    }}
                  >
                    {event.title}
                  </Badge>
                </Tooltip>
              ))}
              {dayEvents.length > 2 && (
                <Text fontSize="xs" color={textColor} opacity={0.7}>
                  +{dayEvents.length - 2} more
                </Text>
              )}
            </VStack>
          </Box>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <SimpleGrid key={day.toString()} columns={7} spacing={0}>
          {days}
        </SimpleGrid>
      );
      days = [];
    }
    
    return <Box>{rows}</Box>;
  };

  const renderEventModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <Modal isOpen={isEventOpen} onClose={onEventClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex justify="space-between" align="center">
              <Text>{selectedEvent.title}</Text>
              <Badge colorScheme={eventTypeColors[selectedEvent.type]}>
                {selectedEvent.type}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Flex align="center" gap={2}>
                <FiCalendar />
                <Text>
                  {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                </Text>
              </Flex>
              
              <Flex align="center" gap={2}>
                <FiClock />
                <Text>
                  {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                </Text>
              </Flex>
              
              {selectedEvent.location && (
                <Flex align="center" gap={2}>
                  <FiMapPin />
                  <Text>{selectedEvent.location}</Text>
                </Flex>
              )}
              
              {selectedEvent.agent && (
                <Flex align="center" gap={2}>
                  <FiUser />
                  <Text>{selectedEvent.agent}</Text>
                </Flex>
              )}
              
              {selectedEvent.description && (
                <>
                  <Divider />
                  <Text>{selectedEvent.description}</Text>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              leftIcon={<FiEdit />} 
              mr={3}
              onClick={() => {
                setNewEvent({
                  title: selectedEvent.title,
                  start: format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
                  end: format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm"),
                  description: selectedEvent.description,
                  type: selectedEvent.type,
                  agent: selectedEvent.agent,
                  agentId: selectedEvent.agentId || '',
                  location: selectedEvent.location
                });
                onEventClose();
                onOpen();
              }}
            >
              Edit
            </Button>
            <Button 
              leftIcon={<FiTrash2 />} 
              colorScheme="red"
              variant="outline"
              onClick={async () => {
                try {
                  await deleteCalendarEvent(selectedEvent._id);
                  setEvents(events.filter(event => event._id !== selectedEvent._id));
                  setFilteredEvents(filteredEvents.filter(event => event._id !== selectedEvent._id));
                  onEventClose();
                  toast({
                    title: 'Event deleted',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                } catch (error) {
                  console.error('Error deleting event:', error);
                  toast({
                    title: 'Error deleting event',
                    description: error.message,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                }
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderAddEventModal = () => {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {newEvent.title ? 'Edit Event' : 'Add New Event'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Event title"
                />
              </FormControl>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Start Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>End Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                  />
                </FormControl>
              </SimpleGrid>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="training">Training</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Agent</FormLabel>
                  <Select
                    value={newEvent.agent}
                    onChange={(e) => {
                      const selectedAgent = e.target.selectedOptions[0];
                      const agentId = selectedAgent.getAttribute('data-agent-id');
                      setNewEvent({
                        ...newEvent, 
                        agent: e.target.value,
                        agentId: agentId || ''
                      });
                    }}
                    placeholder="Select agent"
                  >
                    <option value="All Agents" data-agent-id="">All Agents</option>
                    {agents.map(agent => (
                      <option 
                        key={agent._id} 
                        value={agent.fullName || agent.username} 
                        data-agent-id={agent._id}
                      >
                        {agent.fullName || agent.username}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Location</FormLabel>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Event location"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Event description"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose}
              leftIcon={<FiX />}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue"
              onClick={async () => {
                if (!newEvent.title || !newEvent.start || !newEvent.end) {
                  toast({
                    title: 'Please fill in all required fields',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                
                try {
                  if (selectedEvent) {
                    // Update existing event
                    const eventData = {
                      ...newEvent,
                      start: new Date(newEvent.start),
                      end: new Date(newEvent.end)
                    };
                    
                    // Include agentId if it exists
                    if (newEvent.agentId) {
                      eventData.agentId = newEvent.agentId;
                    }
                    
                    const updatedEvent = await updateCalendarEvent(selectedEvent._id, eventData);
                    
                    // Update state with the updated event
                    const updatedEventData = { ...updatedEvent, start: new Date(updatedEvent.start), end: new Date(updatedEvent.end) };
                    setEvents(events.map(event => 
                      event._id === selectedEvent._id ? updatedEventData : event
                    ));
                    setFilteredEvents(filteredEvents.map(event => 
                      event._id === selectedEvent._id ? updatedEventData : event
                    ));
                    
                    toast({
                      title: 'Event updated',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  } else {
                    // Create new event
                    const eventData = {
                      ...newEvent,
                      start: new Date(newEvent.start),
                      end: new Date(newEvent.end)
                    };
                    
                    // Include agentId if it exists
                    if (newEvent.agentId) {
                      eventData.agentId = newEvent.agentId;
                    }
                    
                    const createdEvent = await createCalendarEvent(eventData);
                    
                    // Add the new event to state
                    const newEventData = { 
                      ...createdEvent, 
                      start: new Date(createdEvent.start), 
                      end: new Date(createdEvent.end) 
                    };
                    setEvents([...events, newEventData]);
                    setFilteredEvents([...filteredEvents, newEventData]);
                    
                    toast({
                      title: 'Event created',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                } catch (error) {
                  console.error('Error saving event:', error);
                  toast({
                    title: 'Error saving event',
                    description: error.message,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                }
                
                onClose();
              }}
              leftIcon={<FiCheck />}
            >
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderAgendaView = () => {
    return (
      <Card variant="outline" mt={4}>
        <CardHeader pb={1}>
          <Heading size="sm" color={textColor}>
            Upcoming Events
          </Heading>
        </CardHeader>
        <CardBody>
          {filteredEvents.length === 0 ? (
            <Text textAlign="center" py={4} color={textColor}>
              No events found
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto">
              {filteredEvents.map(event => (
                <Box 
                  key={event._id} 
                  p={3} 
                  borderRadius="md" 
                  border={`1px solid ${borderColor}`}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    onEventOpen();
                  }}
                >
                  <Flex justify="space-between" align="start">
                    <VStack align="stretch" spacing={1} flex={1}>
                      <Flex align="center" gap={2}>
                        <Badge colorScheme={eventTypeColors[event.type]}>
                          {event.type}
                        </Badge>
                        <Text fontWeight="medium" color={textColor}>
                          {event.title}
                        </Text>
                      </Flex>
                      
                      <Flex align="center" gap={2} fontSize="sm">
                        <FiCalendar />
                        <Text color={textColor} opacity={0.8}>
                          {format(event.start, 'MMM d, yyyy')}
                        </Text>
                      </Flex>
                      
                      <Flex align="center" gap={2} fontSize="sm">
                        <FiClock />
                        <Text color={textColor} opacity={0.8}>
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </Text>
                      </Flex>
                      
                      {event.agent && (
                        <Flex align="center" gap={2} fontSize="sm">
                          <FiUser />
                          <Text color={textColor} opacity={0.8}>
                            {event.agent}
                          </Text>
                        </Flex>
                      )}
                    </VStack>
                    
                    <Avatar 
                      name={event.agent} 
                      size="sm" 
                      bg={`${eventTypeColors[event.type]}.500`}
                      color="white"
                      fontSize="xs"
                    />
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <Box p={{ base: 2, md: 4 }} bg={cardBg} minH="100vh">
      {renderHeader()}
      
      <Card variant="outline">
        <CardBody p={0}>
          {renderDays()}
          {renderCells()}
        </CardBody>
      </Card>
      
      {renderAgendaView()}
      
      {renderEventModal()}
      {renderAddEventModal()}
    </Box>
  );
};

export default CalendarPage;