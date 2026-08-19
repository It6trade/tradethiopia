import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from './Layout';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Skeleton,
  Badge,
  Tooltip,
  HStack,
  VStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Icon,
  Divider
} from "@chakra-ui/react";
import { 
  FiDownload, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBarChart2,
  FiTrendingUp
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000, // 5 second timeout to prevent hanging
  headers: {
    'Content-Type': 'application/json',
  }
});

const CustomerFollowupReport = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });
  const [trainingFollowupsData, setTrainingFollowupsData] = useState([]);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2; // Reduce retries to prevent excessive attempts
    
    const fetchFollowups = async () => {
      try {
        setLoading(true);
        const startTime = performance.now();
        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Log request start
        console.log(`Starting followup data fetch (attempt ${retryCount + 1})`);
        // Request smaller chunks of data to prevent timeouts
        const [response, trainingRes, usersRes] = await Promise.all([
          apiClient.get(`/api/followups?limit=100&page=1`, { headers }),
          apiClient.get(`/api/training-followups?limit=100&page=1`, { headers }).catch(() => ({ data: [] })),
          apiClient.get(`/api/users`, { headers }).catch(() => ({ data: [] }))
        ]);
        
        // Handle the new response format from followups API
        if (response.data && Array.isArray(response.data.data)) {
          setFollowups(response.data.data);
          calculateStats(response.data.data);
        } else if (response.data && Array.isArray(response.data)) {
          // Fallback for old format
          setFollowups(response.data);
          calculateStats(response.data);
        } else {
          setError("Invalid data format received from server");
        }

        // Handle the new response format from training followups API
        if (trainingRes.data && Array.isArray(trainingRes.data.data)) {
          setTrainingFollowupsData(trainingRes.data.data);
        } else if (Array.isArray(trainingRes.data)) {
          // Fallback for old format
          setTrainingFollowupsData(trainingRes.data);
        } else {
          setTrainingFollowupsData([]);
        }

        const userList = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data?.users)
            ? usersRes.data.users
            : [];
        const map = {};
        userList.forEach((u) => {
          const id = (u._id || u.id || '').toString();
          if (id) {
            map[id] = u.username || u.name || u.email || id;
          }
        });
        setUsersMap(map);
        
        // Log request completion time
        const endTime = performance.now();
        console.log(`Followup data fetch completed in ${(endTime - startTime).toFixed(2)}ms`);
      } catch (err) {
        console.error("Error fetching followups:", err);
        
        // Log more detailed error information
        if (err.response) {
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
          console.error("Response headers:", err.response.headers);
        } else if (err.request) {
          console.error("Request data:", err.request);
        }
        
        // Handle timeout errors specifically
        if ((err.code === 'ECONNABORTED' || err.message.includes('timeout')) && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} after timeout`);
          // Adaptive delay - increase with each retry
          const delay = retryCount * 750; // 750ms, 1500ms, etc.
          setTimeout(fetchFollowups, delay);
          return;
        } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          setError("Request timed out after multiple attempts. Please check your connection and try again.");
          toast({
            title: "Timeout Error",
            description: "The request took too long to complete after multiple attempts.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        } else {
          setError("Failed to load follow-up data. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load follow-up data",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFollowups();
  }, []);

  const calculateStats = (data) => {
    const now = new Date();
    const stats = {
      total: data.length,
      active: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    };

    data.forEach(item => {
      if (item.status === 'completed') {
        stats.completed++;
      } else if (item.status === 'pending') {
        stats.pending++;
        
        // Check if the follow-up is overdue
        if (item.dueDate && new Date(item.dueDate) < now) {
          stats.overdue++;
        }
      }
    });

    stats.active = stats.total - stats.completed;
    setStats(stats);
  };

  const handleViewDetails = (followup) => {
    setSelectedFollowup(followup);
    onOpen();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = 'Follow-up Report';
    const headers = [
      'Customer',
      'Type',
      'Status',
      'Due Date',
      'Assigned To',
      'Last Updated'
    ];
    
    const data = filteredFollowups.map(followup => [
      followup.customerName || 'N/A',
      followup.type || 'General',
      followup.status || 'pending',
      followup.dueDate ? new Date(followup.dueDate).toLocaleDateString() : 'N/A',
      getAssignedDisplay(followup),
      followup.updatedAt ? new Date(followup.updatedAt).toLocaleString() : 'N/A'
    ]);

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Add date
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Add table
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle',
        overflow: 'linebreak',
        tableWidth: 'wrap',
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });

    doc.save('followup-report.pdf');
    
    toast({
      title: "Report exported",
      description: "Follow-up report has been exported as PDF",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredFollowups = followups.filter(followup => {
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      (followup.customerName && followup.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (followup.assignedTo && followup.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (followup.type && followup.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || followup.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Training-specific slice for reporting
  const trainingFollowups = [
    ...trainingFollowupsData,
    ...filteredFollowups.filter((f) => {
      const typeMatch = (f.type || '').toLowerCase().includes('training') || (f.trainingType || '').toLowerCase().includes('training');
      const hasCourse = !!(f.course || f.Course || f.trainingCourse || f.trainingType || f.program);
      const hasTrainingDates = !!(f.trainingStartDate || f.trainingEndDate || f.startDate || f.endDate);
      return typeMatch || hasCourse || hasTrainingDates;
    }),
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (followup) => {
    if (followup.status === 'completed') return 'Completed';
    if (followup.status === 'pending') {
      if (followup.dueDate && new Date(followup.dueDate) < new Date()) {
        return 'Overdue';
      }
      return 'Pending';
    }
    return 'Unknown';
  };

  const getValue = (obj, keys, fallback = 'N/A') => {
    for (const k of keys) {
      const parts = k.split('.');
      let val = obj;
      for (const p of parts) {
        val = val ? val[p] : undefined;
      }
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return fallback;
  };

  const normalizeIdentifier = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'object') {
      // Handle ObjectId instances specifically
      if (value._id || value.id) {
        return normalizeIdentifier(value._id || value.id);
      }
      // Handle mongoose ObjectId instances
      if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
        const text = value.toString().trim();
        return text.length > 0 ? text : null;
      }
      return null;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  };

  const getAssignedDisplay = (followup) => {
    // First, try to get the populated agent information
    if (followup.agentId && typeof followup.agentId === 'object' && followup.agentId.username) {
      return followup.agentId.username;
    }
    
    // Also check if agentId has a name field
    if (followup.agentId && typeof followup.agentId === 'object' && followup.agentId.name) {
      return followup.agentId.name;
    }
    
    // Also check if agentId has an email field
    if (followup.agentId && typeof followup.agentId === 'object' && followup.agentId.email) {
      return followup.agentId.email;
    }
    
    // If agentId is populated but doesn't have username/name/email, try to get the _id
    const agentObjectId = followup.agentId && typeof followup.agentId === 'object' && followup.agentId._id 
      ? followup.agentId._id 
      : null;
      
    if (agentObjectId) {
      const userId = normalizeIdentifier(agentObjectId);
      if (userId && usersMap[userId]) {
        return usersMap[userId];
      }
    }
    
    // Try with the raw agentId field
    const agentId = followup.agentId;
    
    // If we have an agentId, try to find the user in our usersMap
    if (agentId) {
      const userId = normalizeIdentifier(agentId);
      if (userId && usersMap[userId]) {
        return usersMap[userId];
      }
    }
    
    // Also try the raw agentId directly as it might be a string already
    if (agentId && usersMap[agentId]) {
      return usersMap[agentId];
    }
    
    // Fallback to the existing logic for backward compatibility
    const raw = followup.assignedTo;
    const tryUserMap = (val) => {
      const normalized = normalizeIdentifier(val);
      return normalized ? usersMap[normalized] || null : null;
    };

    const candidateSources = new Set([
      raw,
      raw?.id,
      raw?._id,
      followup.assignedToId,
      followup.agent?._id,
      followup.agent?.id,
      followup.agent,
      followup.createdBy,
    ]);

    for (const candidate of candidateSources) {
      const mapped = tryUserMap(candidate);
      if (mapped) return mapped;
    }

    if (raw && typeof raw === 'object') {
      if (raw.username) return raw.username;
      if (raw.name) return raw.name;
      if (raw.email) return raw.email;
    }

    if (followup.agentUsername) return followup.agentUsername;
    if (followup.agentName) return followup.agentName;
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    if (typeof followup.agentId === 'string' && followup.agentId.trim().length > 0) return followup.agentId.trim();
    return 'Unassigned';
  };

  if (loading) {
    return (
      <Layout>
        <Box p={6}>
          <Skeleton height="40px" width="300px" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          <Skeleton height="400px" borderRadius="lg" />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Flex direction="column" align="center" justify="center" py={10}>
                <Icon as={FiAlertCircle} boxSize={12} color="red.500" mb={4} />
                <Text fontSize="xl" fontWeight="bold" color="red.500" mb={2}>
                  Error Loading Report
                </Text>
                <Text color={secondaryTextColor} textAlign="center" mb={4}>
                  {error}
                </Text>
                <Button 
                  colorScheme="blue" 
                  onClick={() => {
                    // Reset error and trigger reload
                    setError(null);
                    window.location.reload();
                  }}
                >
                  Retry
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={{ base: 4, md: 5, xl: 6 }} w="100%" maxW="none" mx="0">
        {/* Header Section */}
        <Card
          mb={6}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="blue.100"
          bg="linear-gradient(135deg, #f8fbff 0%, #f0fdfa 100%)"
          boxShadow="lg"
        >
          <CardBody>
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} wrap="wrap" gap={4}>
              <Box>
                <Badge colorScheme="blue" mb={2}>Report center</Badge>
                <Heading as="h1" size="xl" color={headerColor} mb={2}>
                  Customer Follow-up Report
                </Heading>
                <Text color={secondaryTextColor}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </Box>
              <Button
                leftIcon={<FiDownload />}
                onClick={handleExportPDF}
                colorScheme="blue"
                size="md"
                boxShadow="md"
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                transition="all 0.2s"
              >
                Export as PDF
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Stats Overview */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 2, lg: 4 }} 
          spacing={{ base: 4, md: 6 }} 
          mb={{ base: 6, md: 8 }}
        >
          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="blue.100"
                    color="blue.500"
                    mr={3}
                  >
                    <Icon as={FiUser} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Total Follow-ups
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                  {stats.total}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="orange.100"
                    color="orange.500"
                    mr={3}
                  >
                    <Icon as={FiClock} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Active Follow-ups
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="orange.500">
                  {stats.active}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="green.100"
                    color="green.500"
                    mr={3}
                  >
                    <Icon as={FiCheckCircle} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Completed
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
                  {stats.completed}
                </StatNumber>
                <StatHelpText>
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="red.100"
                    color="red.500"
                    mr={3}
                  >
                    <Icon as={FiAlertCircle} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Overdue
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="red.500">
                  {stats.overdue}
                </StatNumber>
                <StatHelpText>
                  {stats.pending > 0 ? Math.round((stats.overdue / stats.pending) * 100) : 0}% of pending
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters and Search */}
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          mb={{ base: 6, md: 8 }}
        >
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center">
              <InputGroup maxW={{ base: "100%", md: "520px" }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by customer, type, or assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={useColorModeValue('white', 'gray.700')}
                />
              </InputGroup>
              
              <HStack spacing={4} flexWrap="wrap">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                maxW="220px"
                  bg={useColorModeValue('white', 'gray.700')}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </Select>
                
                <Text color={secondaryTextColor} fontSize="sm">
                  Showing {filteredFollowups.length} of {followups.length} follow-ups
                </Text>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Follow-up Table */}
        <Card 
          bg={cardBg} 
          boxShadow="md" 
          borderRadius="lg" 
          borderWidth="1px" 
          borderColor={borderColor}
          overflowX="auto"
          p={2}
        >
          <CardHeader py={3}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Follow-up Details</Heading>
              <HStack spacing={3}>
                <Text color={secondaryTextColor} fontSize="sm">
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody p={0}>
            <Table variant="simple" size="sm" minW="980px">
              <Thead bg={useColorModeValue('gray.50', 'gray.700')} fontSize="sm">
                <Tr>
                  <Th>Customer</Th>
                  <Th>Company</Th>
                  <Th>Package</Th>
                  <Th>Service</Th>
                  <Th>Due Date</Th>
                  <Th>Assigned To</Th>
                  <Th>Last Updated</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFollowups.length > 0 ? (
                  filteredFollowups.map((followup, idx) => {
                    const customer = getValue(followup, ['customerName', 'clientName', 'name'], 'N/A');
                    const company = getValue(followup, ['companyName', 'company', 'organization'], 'N/A');
                    const pkg = getValue(followup, ['packageType', 'package', 'packageNumber', 'packageName'], 'N/A');
                    const service = getValue(followup, ['service', 'serviceProvided', 'serviceName'], 'N/A');
                    const dueDate = followup.dueDate ? new Date(followup.dueDate) : null;
                    const assigned = getAssignedDisplay(followup);
                    const updated = followup.updatedAt ? new Date(followup.updatedAt) : null;
                    return (
                      <Tr key={followup._id || idx} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                        <Td>
                          <Text fontWeight="medium">{customer}</Text>
                        </Td>
                        <Td>
                          <Text>{company}</Text>
                        </Td>
                        <Td>
                          <Text>{pkg}</Text>
                        </Td>
                        <Td>
                          <Text>{service}</Text>
                        </Td>
                        <Td>
                          {dueDate ? (
                            <>
                              <Text>{dueDate.toLocaleDateString()}</Text>
                              <Text fontSize="xs" color={secondaryTextColor}>
                                {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </>
                          ) : (
                            'Not set'
                          )}
                        </Td>
                        <Td>
                          <HStack>
                            <Box
                              w={3}
                              h={3}
                              borderRadius="full"
                              bg={assigned !== 'Unassigned' ? 'green.500' : 'gray.300'}
                            />
                            <Text>{assigned}</Text>
                          </HStack>
                        </Td>
                        <Td>
                        {updated ? (
                          <Tooltip label={updated.toLocaleString()}>
                            <Text>
                              {updated.toLocaleDateString()}
                            </Text>
                          </Tooltip>
                        ) : (
                          'N/A'
                        )}
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            leftIcon={<FiEye />}
                            onClick={() => handleViewDetails(followup)}
                            colorScheme="blue"
                            variant="ghost"
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <VStack spacing={2}>
                        <Icon as={FiAlertCircle} boxSize={8} color={secondaryTextColor} />
                        <Text color={secondaryTextColor}>
                          No follow-ups found matching your criteria
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Follow-up Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>Follow-up Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedFollowup ? (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                      Customer
                    </Text>
                    <Heading size="md" mb={2}>
                      {getValue(selectedFollowup, ['customerName', 'clientName', 'name'], 'Unnamed Customer')}
                    </Heading>
                    <HStack spacing={4}>
                      {getValue(selectedFollowup, ['phone', 'phoneNumber'], null) && (
                        <HStack>
                          <Icon as={FiPhone} color={secondaryTextColor} />
                          <Text>{getValue(selectedFollowup, ['phone', 'phoneNumber'], 'N/A')}</Text>
                        </HStack>
                      )}
                      {getValue(selectedFollowup, ['email'], null) && (
                        <HStack>
                          <Icon as={FiMail} color={secondaryTextColor} />
                          <Text>{getValue(selectedFollowup, ['email'], 'N/A')}</Text>
                        </HStack>
                      )}
                    </HStack>
                  </Box>

                  <Divider />

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Assigned To
                      </Text>
                      <Text>{getAssignedDisplay(selectedFollowup)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Priority
                      </Text>
                      <Text>{selectedFollowup.priority || 'Medium'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Company
                      </Text>
                      <Text>{getValue(selectedFollowup, ['companyName', 'company', 'organization'], 'N/A')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Package
                      </Text>
                      <Text>{getValue(selectedFollowup, ['packageType', 'package', 'packageNumber', 'packageName'], 'N/A')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Service
                      </Text>
                      <Text>{getValue(selectedFollowup, ['service', 'serviceProvided', 'serviceName'], 'N/A')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Last Updated
                      </Text>
                      <Text>
                        {selectedFollowup.updatedAt 
                          ? new Date(selectedFollowup.updatedAt).toLocaleString() 
                          : 'N/A'}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* Contact Attempts Section */}
                  <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Heading size="sm" mb={3}>Contact Attempts</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <Box>
                        <Text fontSize="sm" color={secondaryTextColor}>Calls</Text>
                        <Text fontSize="xl" fontWeight="bold">{selectedFollowup.call_count || selectedFollowup.callAttempts || 0}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={secondaryTextColor}>Messages</Text>
                        <Text fontSize="xl" fontWeight="bold">{selectedFollowup.message_count || selectedFollowup.messageAttempts || 0}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={secondaryTextColor}>Emails</Text>
                        <Text fontSize="xl" fontWeight="bold">{selectedFollowup.email_count || selectedFollowup.emailAttempts || 0}</Text>
                      </Box>
                    </SimpleGrid>
                    <Box mt={3}>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>Assigned Agent</Text>
                      <HStack>
                        <Box
                          w={3}
                          h={3}
                          borderRadius="full"
                          bg={getAssignedDisplay(selectedFollowup) !== 'Unassigned' ? 'green.500' : 'gray.300'}
                        />
                        <Text>{getAssignedDisplay(selectedFollowup)}</Text>
                      </HStack>
                    </Box>
                  </Box>

                  {/* Communication Logs Section */}
                  {selectedFollowup.communications && selectedFollowup.communications.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={3}>Communication Logs</Heading>
                      <VStack align="stretch" spacing={3}>
                        {selectedFollowup.communications.map((log, index) => (
                          <Box 
                            key={index} 
                            p={3} 
                            bg={useColorModeValue('white', 'gray.600')} 
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                          >
                            <Flex justify="space-between" mb={2}>
                              <Badge colorScheme="blue">{log.channel || 'N/A'}</Badge>
                              <Text fontSize="sm" color={secondaryTextColor}>
                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                              </Text>
                            </Flex>
                            <Text>{log.note || log.text || 'No details provided'}</Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  <Box>
                    <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                      Description
                    </Text>
                    <Box 
                      p={3} 
                      bg={useColorModeValue('gray.50', 'gray.700')} 
                      borderRadius="md"
                      minH="100px"
                    >
                      {selectedFollowup.description || 'No description provided.'}
                    </Box>
                  </Box>

                  {selectedFollowup.notes && selectedFollowup.notes.length > 0 && (
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                        Notes
                      </Text>
                      <VStack align="stretch" spacing={3}>
                        {selectedFollowup.notes.map((note, index) => (
                          <Box 
                            key={index} 
                            p={3} 
                            bg={useColorModeValue('gray.50', 'gray.700')} 
                            borderRadius="md"
                            borderLeft="4px"
                            borderLeftColor="blue.500"
                          >
                            <Text>{note.content || note.text || 'No content'}</Text>
                            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                              {note.createdBy || note.author || 'Unknown'} • {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Text>Loading follow-up details...</Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Training Follow-Up Details (for reporting) */}
        <Card
          bg={cardBg}
          boxShadow="md"
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          mt={8}
        >
          <CardHeader borderBottomWidth="1px" borderColor={borderColor} py={3}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Heading size="md">Training Follow-Up Details</Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                Showing {trainingFollowups.length} training follow-ups
              </Text>
            </Flex>
          </CardHeader>
          <CardBody p={3}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')} fontSize="sm">
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Course</Th>
                    <Th>Schedule / Shift</Th>
                    <Th>Start Date</Th>
                    <Th>End Date</Th>
                    <Th>Progress</Th>
                    <Th>Package Status</Th>
                    <Th>Material Delivery</Th>
                    <Th>Updated</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {trainingFollowups.length === 0 && (
                    <Tr>
                      <Td colSpan={9} textAlign="center" color={secondaryTextColor}>
                        No training follow-ups available.
                      </Td>
                    </Tr>
                  )}
                  {trainingFollowups.map((item, idx) => {
                    const customer = getValue(item, ['customerName', 'clientName', 'name']);
                    const course = getValue(item, ['course', 'Course', 'trainingCourse', 'trainingType', 'program'], 'N/A');
                    const schedule = getValue(item, ['schedule', 'shift', 'scheduleShift'], 'N/A');
                    const startDate = getValue(item, ['startDate', 'trainingStartDate'], null);
                    const endDate = getValue(item, ['endDate', 'trainingEndDate'], null);
                    const progressVal = getValue(item, ['progress', 'trainingProgress', 'status', 'followupStatus'], 'N/A');
                    const packageStatus = getValue(item, ['packageStatus', 'package_status'], 'N/A');
                    const material = getValue(item, ['materialStatus', 'materialDeliveryStatus'], 'N/A');
                    const updated = item.updatedAt ? new Date(item.updatedAt) : null;
                    const progressLower = (progressVal || '').toString().toLowerCase();
                    const progressColor =
                      progressLower === 'completed' ? 'green' :
                      progressLower === 'in progress' ? 'blue' :
                      progressLower === 'pending' ? 'orange' :
                      'gray';
                    return (
                      <Tr key={item._id || idx}>
                        <Td>{customer}</Td>
                        <Td>{course}</Td>
                        <Td>{schedule}</Td>
                        <Td>{startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</Td>
                        <Td>{endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</Td>
                        <Td>
                          <Badge colorScheme={progressColor} variant="subtle" px={2} py={1} borderRadius="full">
                            {progressVal || 'N/A'}
                          </Badge>
                        </Td>
                        <Td>{packageStatus}</Td>
                        <Td>{material}</Td>
                        <Td>{updated ? updated.toLocaleDateString() : 'N/A'}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            <Box
              mt={6}
              p={4}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="sm" mb={2}>How to update training follow-up</Heading>
              <VStack align="start" spacing={2} color={secondaryTextColor} fontSize="sm">
                <Text>1) Edit schedule/shift, start and end dates in the training follow-up form.</Text>
                <Text>2) Set progress to the latest status (e.g., In Progress, Completed).</Text>
                <Text>3) Update package status and material delivery after each milestone.</Text>
                <Text>4) Log notes/communications for learner interactions to keep an audit trail.</Text>
                <Text>5) Save the record; the table will show the latest “Updated” timestamp.</Text>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default CustomerFollowupReport;
