import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Stack,
  RadioGroup,
  Radio,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Heading,
  Text,
  Divider,
  HStack,
  VStack,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Switch,
  FormHelperText,
  Icon,
  Tooltip,
  useToast,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import axios from 'axios';
import { useUserStore } from '../../../store/user'; // Adjusted relative path

const AddTaskForm = ({ isOpen, onClose, onDone, onLocalCreate, defaultProjectType }) => {
  const [projectType, setProjectType] = useState(defaultProjectType || 'internal');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState([]);
  const [platform, setPlatform] = useState([]);
  const [actionType, setActionType] = useState(
    (defaultProjectType || 'internal') === 'external' ? 'new' : []
  );
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [urgent, setUrgent] = useState(false);
  const [taskLeader, setTaskLeader] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  
  useEffect(() => {
    setCategory([]);
    setPlatform([]);
    setActionType(projectType === 'external' ? 'new' : []);
    setTaskLeader('');
    setAssignedTo([]);
  }, [projectType]);

  const toast = useToast();
  const { currentUser, users } = useUserStore();
  const token = currentUser?.token;
  const userRole = currentUser?.role;
  const normalizedRole = (userRole || '').toString().toLowerCase();
  const normalizedRoleCompact = normalizedRole.replace(/[^a-z0-9]/g, '');
  const currentUserName = currentUser?.fullName || currentUser?.username || currentUser?.email || '';
  const isTeamLeaderCreator = normalizedRoleCompact === 'itteamleader' || normalizedRole.includes('team leader');

  useEffect(() => {
    if (isTeamLeaderCreator && currentUserName) {
      setTaskLeader(currentUserName);
    }
  }, [currentUserName, isTeamLeaderCreator]);

  const itUsers = useMemo(() => {
    const defaultPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];
    const storeItUsers = (users || [])
      .filter(u => {
        const r = String(u.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const d = String(u.department || '').toLowerCase();
        return r === 'it' || r.startsWith('it') || d === 'it';
      })
      .map(u => u.fullName || u.username || u.email)
      .filter(Boolean);

    return Array.from(new Set([...defaultPool, ...storeItUsers])).sort();
  }, [users]);

  const taskLeaderOptions = useMemo(() => {
    if (isTeamLeaderCreator && currentUserName) {
      return [currentUserName];
    }

    const leadershipUsers = (users || [])
      .filter(u => {
        const r = String(u.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const d = String(u.department || '').toLowerCase();
        const title = String(u.jobTitle || '').toLowerCase();
        const isItUser = r === 'it' || r.startsWith('it') || d === 'it';
        const isLeaderRole = ['manager', 'admin', 'leader', 'lead'].some(keyword => r.includes(keyword) || title.includes(keyword));
        return isItUser && isLeaderRole;
      })
      .map(u => u.fullName || u.username || u.email)
      .filter(Boolean);

    return Array.from(new Set([...leadershipUsers, ...itUsers])).sort((a, b) => {
      const aIsLeader = leadershipUsers.includes(a);
      const bIsLeader = leadershipUsers.includes(b);
      if (aIsLeader && !bIsLeader) return -1;
      if (!aIsLeader && bIsLeader) return 1;
      return a.localeCompare(b);
    });
  }, [currentUserName, isTeamLeaderCreator, itUsers, users]);

  const itStaff = useMemo(() => {
    return itUsers;
  }, [itUsers]);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const modalBg = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('linear-gradient(135deg, #eff6ff, #ecfeff)', 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.92))');
  const sectionBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const muted = useColorModeValue('gray.600', 'gray.400');

  const submit = async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create tasks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const isItOrAdmin = normalizedRoleCompact === 'admin' || normalizedRoleCompact === 'it' || normalizedRoleCompact.startsWith('it');
    if (userRole && !isItOrAdmin) {
      toast({
        title: 'Insufficient permissions',
        description: 'You do not have permission to create tasks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (projectType === 'internal') {
      if (!taskName || !taskName.trim()) {
        toast({
          title: 'Missing field',
          description: 'Task Name is required for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!platform || (Array.isArray(platform) && platform.length === 0)) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Platform for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const hasActionType =
        (Array.isArray(actionType) && actionType.length > 0) ||
        (!Array.isArray(actionType) && String(actionType).trim().length > 0);

      if (!hasActionType) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Action Type for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else {
      if (!client || !client.trim()) {
        toast({
          title: 'Missing field',
          description: 'Client Name is required for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!category || (Array.isArray(category) && category.length === 0)) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Category for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const hasActionType =
        (Array.isArray(actionType) && actionType.length > 0) ||
        (!Array.isArray(actionType) && String(actionType).trim().length > 0);

      if (!hasActionType) {
        toast({
          title: 'Missing field',
          description: 'Please select an Action Type for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    if (!startDate || !endDate) {
      toast({
        title: 'Missing field',
        description: 'Start Date and End Date are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let processedActionType;
    if (projectType === 'internal') {
      if (Array.isArray(actionType)) {
        processedActionType = actionType.join(', ');
      } else {
        processedActionType = actionType;
      }
    } else {
      if (Array.isArray(actionType)) {
        processedActionType = actionType[0] || '';
      } else {
        processedActionType = actionType;
      }
    }
    
    processedActionType = String(processedActionType);
    
    const payloadToSend = {
      taskName: projectType === 'internal' ? taskName : undefined,
      projectType: projectType,
      category: projectType === 'external' ? (Array.isArray(category) ? category.join(', ') : category) : undefined,
      platform: projectType === 'internal' ? (Array.isArray(platform) ? platform.join(', ') : platform) : undefined,
      client: projectType === 'external' ? client : undefined,
      actionType: processedActionType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status,
      urgent: urgent,
      taskLeader: isTeamLeaderCreator ? currentUserName : taskLeader,
      assignedTo: assignedTo,
      workflowStatus: (isTeamLeaderCreator ? currentUserName : taskLeader) || assignedTo.length ? 'assigned' : 'pending',
    };
    
    const apiBase = import.meta.env.VITE_API_URL;
    const candidateEndpoints = [
      `${apiBase}/api/it`,
      `${apiBase}/api/it/tasks`,
    ];

    let created = false;
    let lastError = null;
    for (const url of candidateEndpoints) {
      try {
        await axios.post(url, payloadToSend, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        });
        created = true;
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (created) {
      if (onDone) onDone();
      onClose();
      
      setTaskName('');
      setCategory([]);
      setPlatform([]);
      setActionType(projectType === 'external' ? 'new' : []);
      setClient('');
      setStartDate('');
      setEndDate('');
      setStatus('pending');
      setUrgent(false);
      setTaskLeader('');
      setAssignedTo([]);

      toast({
        title: 'Task created',
        description: 'The task has been successfully created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const canFallback = lastError?.response?.status === 404 || !lastError?.response;
    if (canFallback && onLocalCreate) {
      const localTask = {
        _id: `local-${Date.now()}`,
        id: `local-${Date.now()}`,
        projectType,
        taskName: payloadToSend.taskName || payloadToSend.client || 'Task',
        category: payloadToSend.category || '',
        platform: payloadToSend.platform || '',
        client: payloadToSend.client || '',
        actionType: payloadToSend.actionType,
        startDate: payloadToSend.startDate || new Date().toISOString(),
        endDate: payloadToSend.endDate || new Date().toISOString(),
        status: payloadToSend.status || 'pending',
        urgent: payloadToSend.urgent,
        taskLeader: payloadToSend.taskLeader || '',
        workflowStatus: payloadToSend.workflowStatus || 'pending',
        priority: 'Medium',
        assignedTo: payloadToSend.assignedTo || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onLocalCreate(localTask);
      onClose();
      toast({
        title: 'Saved locally',
        description: 'Backend not reachable; task stored locally for now.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Error creating task',
        description: lastError?.response?.data?.message || 'Failed to create the task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const externalCategoryOptions = [
    'website',
    'company profile',
    'logo',
    'broacher',
    'banner',
    'flayer',
    'roller up',
    'business card',
    'letterheads'
  ];

  const internalPlatformOptions = [
    'Tradeethiopian.com',
    'Tradethiopia.com',
    'Tesbinn.com',
    'Tradextv.com',
    'Trainings',
    'Documentation',
    'Meetings',
    'Maintenance'
  ];

  const getActionTypeOptions = () => {
    if (projectType === 'external') {
      return [
        { value: 'new', label: 'NEW' },
        { value: 'comment', label: 'Comment' },
        { value: 'update', label: 'Update/Renewal' }
      ];
    } else {
      return [
        { value: 'Function', label: 'Function' },
        { value: 'Features', label: 'Features' },
        { value: 'update', label: 'Update' },
        { value: 'troubleshoot', label: 'Troubleshoot' },
        { value: 'renewal', label: 'Renewal' },
        { value: 'AI/ML', label: 'AI/ML' },
        { value: 'New', label: 'New' }
      ];
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(5px)" />
      <ModalContent bg={modalBg} borderRadius="22px" maxW={{ base: '94vw', lg: '980px' }} maxH="92vh" overflow="hidden">
        <ModalHeader pb={4} bg={headerBg} borderBottom="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={1}>
            <Heading size={{ base: 'md', md: 'lg' }} color={useColorModeValue('gray.800', 'white')}>
              Create New Task
            </Heading>
            <Text fontSize="sm" color={muted}>
              Create a scoped IT task with ownership, timeline, and delivery context.
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton 
          borderRadius="full" 
          _focus={{ boxShadow: 'none' }}
        />
        
        <ModalBody py={5}>
          <VStack spacing={4} align="stretch">
            <Card variant="outline" borderRadius="18px" borderColor={borderColor} bg={sectionBg}>
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <FormLabel mb={0} fontWeight="semibold">Project Type</FormLabel>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <RadioGroup onChange={setProjectType} value={projectType}>
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                    <Radio value="internal" colorScheme="blue">Internal</Radio>
                    <Radio value="external" colorScheme="purple">External</Radio>
                  </Stack>
                </RadioGroup>
              </CardBody>
            </Card>

            <Card variant="outline" borderRadius="18px" borderColor={borderColor}>
              <CardHeader pb={2}>
                <FormLabel mb={0} fontWeight="semibold">Task Details</FormLabel>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={4}>
                  {projectType === 'internal' && (
                    <FormControl isRequired>
                      <FormLabel>Task Name</FormLabel>
                      <Input 
                        value={taskName} 
                        onChange={e => setTaskName(e.target.value)} 
                        placeholder="Enter task name"
                        borderRadius="lg"
                      />
                    </FormControl>
                  )}

                  {projectType === 'external' ? (
                    <>
                      <FormControl isRequired>
                        <FormLabel>Client Name</FormLabel>
                        <Input 
                          value={client} 
                          onChange={e => setClient(e.target.value)} 
                          placeholder="Enter client name"
                          borderRadius="lg"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Category</FormLabel>
                        <CheckboxGroup 
                          value={category} 
                          onChange={setCategory}
                        >
                          <Wrap spacing={2}>
                            {externalCategoryOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option} borderRadius="lg" borderColor={borderColor}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>
                    </>
                  ) : (
                    <>
                      <FormControl isRequired>
                        <FormLabel>Platform</FormLabel>
                        <CheckboxGroup 
                          value={platform} 
                          onChange={setPlatform}
                        >
                          <Wrap spacing={2}>
                            {internalPlatformOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option} borderRadius="lg" borderColor={borderColor}>
                                  {option}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>
                    </>
                  )}

                  <FormControl isRequired>
                    <FormLabel>Action Type</FormLabel>
                    {projectType === 'external' ? (
                      <Select 
                        value={Array.isArray(actionType) ? actionType[0] || '' : actionType} 
                        onChange={e => setActionType(e.target.value)}
                        borderRadius="lg"
                      >
                        {getActionTypeOptions().map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    ) : (
                      <CheckboxGroup 
                        value={actionType} 
                        onChange={setActionType}
                      >
                        <Wrap spacing={2}>
                          {getActionTypeOptions().map((option) => (
                            <WrapItem key={option.value}>
                              <Checkbox value={option.value} borderRadius="lg" borderColor={borderColor}>
                                {option.label}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </CheckboxGroup>
                    )}
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            <Card variant="outline" borderRadius="18px" borderColor={borderColor}>
              <CardHeader pb={2}>
                <FormLabel mb={0} fontWeight="semibold">Timeline, Status & Ownership</FormLabel>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Start Date</FormLabel>
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        borderRadius="lg"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>End Date</FormLabel>
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        borderRadius="lg"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        borderRadius="lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="done">Done</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Task Leader</FormLabel>
                      <Select
                        value={taskLeader}
                        onChange={e => setTaskLeader(e.target.value)}
                        placeholder="Select task leader"
                        borderRadius="lg"
                        isDisabled={isTeamLeaderCreator}
                      >
                        {taskLeaderOptions.map((person) => (
                          <option key={person} value={person}>{person}</option>
                        ))}
                      </Select>
                      <FormHelperText>
                        {isTeamLeaderCreator
                          ? 'Team leaders create tasks under their own leadership scope.'
                          : 'Choose the person responsible for leading this task.'}
                      </FormHelperText>
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Assigned To</FormLabel>
                    <CheckboxGroup 
                      value={assignedTo} 
                      onChange={setAssignedTo}
                    >
                      <Wrap spacing={2}>
                        {itStaff.map((person) => (
                          <WrapItem key={person}>
                            <Checkbox value={person} borderRadius="lg" borderColor={borderColor}>
                              {person}
                            </Checkbox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </CheckboxGroup>
                  </FormControl>
                  
                  <HStack justify="space-between">
                    <FormLabel htmlFor="urgent-switch" mb={0}>
                      Mark as Urgent
                    </FormLabel>
                    <Switch 
                      id="urgent-switch" 
                      isChecked={urgent} 
                      onChange={e => setUrgent(e.target.checked)} 
                      colorScheme="red"
                    />
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter pt={4} pb={5} borderTop="1px solid" borderColor={borderColor}>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onClose}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={submit} 
              borderRadius="lg"
              px={8}
            >
              Create Task
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTaskForm;
