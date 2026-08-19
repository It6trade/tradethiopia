import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Icon,
  VStack,
  HStack,
  Divider,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  useBreakpointValue,
  Image,
  Link,
  Wrap,
  WrapItem,
  Tag,
  TagLeftIcon,
  TagLabel,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  Avatar,
  AvatarGroup,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@chakra-ui/react";
import {
  FaGraduationCap,
  FaBook,
  FaVideo,
  FaFilePdf,
  FaChartLine,
  FaTrophy,
  FaCalendarAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMedal,
  FaCheckCircle,
  FaPlayCircle,
  FaHistory,
  FaClock,
  FaStar,
  FaBookmark,
  FaShare,
  FaDownload,
  FaSearch,
  FaFilter,
  FaSort,
  FaChevronRight,
  FaRegClock,
  FaUsers,
  FaCertificate,
  FaAward,
  FaRegStar,
  FaStarHalfAlt,
  FaFile,
  FaFileExcel,
  FaFilePowerpoint,
  FaEye
} from "react-icons/fa";

const ModernTrainingPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrainings: 42,
    completedTrainings: 28,
    avgCompletionRate: 76,
    activeUsers: 15
  });
  const [activeTab, setActiveTab] = useState(0);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [bookmarkedModules, setBookmarkedModules] = useState(new Set());
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const { isOpen: isResourceModalOpen, onOpen: onResourceModalOpen, onClose: onResourceModalClose } = useDisclosure();
  const toast = useToast();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("blue.600", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const isMobile = useBreakpointValue({ base: true, md: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/resources');
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setResources(data);
    } catch (error) {
      console.warn("Training resources fetch note:", error.message);
      // Keep existing resources or default training curriculum
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mock data for training modules
  const trainingModules = [
    { 
      id: 1, 
      title: "Customer Service Excellence", 
      progress: 85, 
      category: "Customer Relations", 
      duration: "2h 30m", 
      status: "in-progress",
      level: "Intermediate",
      instructor: "Sarah Johnson",
      rating: 4.8,
      enrolled: 1240,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    { 
      id: 2, 
      title: "Sales Techniques Masterclass", 
      progress: 72, 
      category: "Sales", 
      duration: "3h 15m", 
      status: "in-progress",
      level: "Advanced",
      instructor: "Michael Chen",
      rating: 4.9,
      enrolled: 980,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    { 
      id: 3, 
      title: "Product Knowledge Advanced", 
      progress: 90, 
      category: "Product", 
      duration: "1h 45m", 
      status: "in-progress",
      level: "Expert",
      instructor: "David Wilson",
      rating: 4.7,
      enrolled: 1560,
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    { 
      id: 4, 
      title: "Communication Skills", 
      progress: 65, 
      category: "Soft Skills", 
      duration: "2h 10m", 
      status: "in-progress",
      level: "Beginner",
      instructor: "Emma Rodriguez",
      rating: 4.6,
      enrolled: 2100,
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    { 
      id: 5, 
      title: "Leadership Development", 
      progress: 0, 
      category: "Management", 
      duration: "4h 20m", 
      status: "not-started",
      level: "Advanced",
      instructor: "Robert Thompson",
      rating: 4.9,
      enrolled: 870,
      image: "https://images.unsplash.com/photo-1506634343535-98ced0f5d5f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    { 
      id: 6, 
      title: "Digital Marketing Fundamentals", 
      progress: 100, 
      category: "Marketing", 
      duration: "3h 45m", 
      status: "completed",
      level: "Intermediate",
      instructor: "Jennifer Park",
      rating: 4.8,
      enrolled: 3200,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
  ];

  // Mock data for certificates
  const certificates = [
    { id: 1, title: "Customer Service Excellence", date: "2025-09-15", status: "Completed", image: "https://images.unsplash.com/photo-1584697964429-666f4325bd5d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
    { id: 2, title: "Sales Techniques", date: "2025-08-22", status: "Completed", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
    { id: 3, title: "Leadership Training", date: "2025-07-30", status: "Completed", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
    { id: 4, title: "Communication Skills", date: "2025-06-18", status: "Completed", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
  ];

  // Mock data for recent activity
  const recentActivity = [
    { id: 1, title: "Completed 'Customer Service Excellence'", time: "2 hours ago", type: "completion", user: "You" },
    { id: 2, title: "Started 'Leadership Development'", time: "1 day ago", type: "start", user: "You" },
    { id: 3, title: "Downloaded 'Sales Techniques' materials", time: "2 days ago", type: "download", user: "You" },
    { id: 4, title: "Achieved 80% in 'Product Knowledge'", time: "3 days ago", type: "progress", user: "You" },
  ];

  // Mock data for popular courses
  const popularCourses = [
    { id: 1, title: "Data Analysis Fundamentals", students: 3420, rating: 4.9, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
    { id: 2, title: "Project Management Essentials", students: 2890, rating: 4.8, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
    { id: 3, title: "UX/UI Design Principles", students: 2560, rating: 4.7, image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" },
  ];

  // Filter resources by type
  const videoResources = resources.filter(r => r.type === "video");
  const pdfResources = resources.filter(r => r.type === "pdf");
  const documentResources = resources.filter(r => ["document", "excel", "powerpoint"].includes(r.type));

  // Function to determine if a file can be viewed in browser
  const canViewInBrowser = (type) => {
    return ['pdf', 'document', 'excel', 'powerpoint'].includes(type);
  };

  // Function to determine button text based on file type
  const getButtonText = (type) => {
    if (type === 'video') return 'Watch';
    if (canViewInBrowser(type)) return 'View';
    return 'Download';
  };

  // Function to determine appropriate icon based on file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'video':
        return <Icon as={FaVideo} color="red.500" />;
      case 'pdf':
        return <Icon as={FaFilePdf} color="red.500" />;
      case 'excel':
        return <Icon as={FaFileExcel} color="green.500" />;
      case 'powerpoint':
        return <Icon as={FaFilePowerpoint} color="orange.500" />;
      case 'document':
        return <Icon as={FaFile} color="blue.500" />;
      default:
        return <Icon as={FaFile} color="gray.500" />;
    }
  };

  // Function to get file type label
  const getFileTypeLabel = (type) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'pdf':
        return 'PDF';
      case 'excel':
        return 'Excel';
      case 'powerpoint':
        return 'PowerPoint';
      case 'document':
        return 'Document';
      default:
        return 'File';
    }
  };

  // Function to handle opening a resource
  const handleOpenResource = (resource) => {
    if (resource.type === 'video') {
      // For videos, open in modal
      setSelectedResource(resource);
      onResourceModalOpen();
    } else {
      // For other files, open in new tab or download
      const fileUrl = resource.fileUrl || `${import.meta.env.VITE_API_URL}${resource.content}`;
      if (canViewInBrowser(resource.type)) {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const toggleBookmark = (moduleId) => {
    const newBookmarks = new Set(bookmarkedModules);
    if (newBookmarks.has(moduleId)) {
      newBookmarks.delete(moduleId);
    } else {
      newBookmarks.add(moduleId);
    }
    setBookmarkedModules(newBookmarks);
    
    toast({
      title: bookmarkedModules.has(moduleId) ? "Removed from bookmarks" : "Added to bookmarks",
      status: bookmarkedModules.has(moduleId) ? "info" : "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const startTraining = (module) => {
    setSelectedModule(module);
    setIsAlertOpen(true);
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
    setSelectedModule(null);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon key={`full-${i}`} as={FaStar} color="yellow.400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Icon key="half" as={FaStarHalfAlt} color="yellow.400" />);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Icon key={`empty-${i}`} as={FaRegStar} color="gray.300" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <Box py={6}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="60px" width="400px" />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="140px" borderRadius="xl" />
            ))}
          </SimpleGrid>
          <Skeleton height="500px" borderRadius="xl" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box py={6} px={{ base: 4, md: 6 }}>
      {/* Header Section */}
      <Box textAlign="center" mb={{ base: 6, md: 10 }}>
        <HStack justify="center" mb={4} spacing={4}>
          <Box
            p={3}
            borderRadius="full"
            bgGradient="linear(to-r, blue.500, teal.500)"
            color="white"
            boxShadow="lg"
          >
            <Icon as={FaGraduationCap} boxSize={{ base: 8, md: 10 }} />
          </Box>
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }} color={headingColor}>
            Professional Learning Center
          </Heading>
        </HStack>
        <Text fontSize={{ base: "md", md: "lg" }} color={secondaryTextColor} maxW="2xl" mx="auto" mb={6}>
          Enhance your skills with our comprehensive training programs designed to advance your career and boost your professional growth
        </Text>
        
        <HStack justify="center" spacing={4} wrap="wrap">
          <Button 
            leftIcon={<FaPlayCircle />} 
            colorScheme="blue" 
            size="lg" 
            px={8}
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            transition="all 0.2s"
          >
            Start Learning
          </Button>
          <Button 
            leftIcon={<FaBookmark />} 
            variant="outline" 
            colorScheme="gray" 
            size="lg" 
            px={8}
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            transition="all 0.2s"
          >
            My Bookmarks
          </Button>
        </HStack>
      </Box>

      {/* Stats Overview */}
      <SimpleGrid 
        columns={{ base: 1, sm: 2, md: 2, lg: 4 }} 
        spacing={{ base: 4, md: 6 }} 
        mb={{ base: 6, md: 10 }}
      >
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
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
                  <Icon as={FaBook} boxSize={6} />
                </Box>
                <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                  Total Trainings
                </StatLabel>
              </Flex>
              <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                {stats.totalTrainings}
              </StatNumber>
              <StatHelpText mt={1}>
                <StatArrow type='increase' />
                12% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
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
                  <Icon as={FaChartLine} boxSize={6} />
                </Box>
                <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                  Completion Rate
                </StatLabel>
              </Flex>
              <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
                {stats.avgCompletionRate}%
              </StatNumber>
              <StatHelpText mt={1}>
                <StatArrow type='increase' />
                5% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
        >
          <CardBody>
            <Stat>
              <Flex alignItems="center" mb={3}>
                <Box
                  p={3}
                  borderRadius="lg"
                  bg="purple.100"
                  color="purple.500"
                  mr={3}
                >
                  <Icon as={FaUsers} boxSize={6} />
                </Box>
                <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                  Active Learners
                </StatLabel>
              </Flex>
              <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="purple.500">
                {stats.activeUsers}K+
              </StatNumber>
              <StatHelpText mt={1}>
                <StatArrow type='increase' />
                8% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
        >
          <CardBody>
            <Stat>
              <Flex alignItems="center" mb={3}>
                <Box
                  p={3}
                  borderRadius="lg"
                  bg="yellow.100"
                  color="yellow.500"
                  mr={3}
                >
                  <Icon as={FaCertificate} boxSize={6} />
                </Box>
                <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                  Certificates
                </StatLabel>
              </Flex>
              <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="yellow.500">
                {stats.completedTrainings}
              </StatNumber>
              <StatHelpText mt={1}>
                <StatArrow type='increase' />
                15% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Training Resources Section */}
      <Box mb={{ base: 8, md: 12 }}>
        <HStack justify="space-between" mb={6}>
          <Heading as="h2" size="lg" color={headingColor}>
            Training Resources
          </Heading>
        </HStack>
        
        <Tabs variant="soft-rounded" colorScheme="blue" mb={8}>
          <TabList mb={4}>
            <Tab>All Resources</Tab>
            <Tab>Videos ({videoResources.length})</Tab>
            <Tab>Documents ({documentResources.length})</Tab>
            <Tab>PDFs ({pdfResources.length})</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {resources.map(resource => (
                  <Card 
                    key={resource._id} 
                    bg={cardBg} 
                    boxShadow="lg" 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
                  >
                    <CardBody>
                      <Flex align="center" mb={3}>
                        {getFileIcon(resource.type)}
                        <Box ml={3}>
                          <Heading as="h3" size="sm" color={textColor}>
                            {resource.title}
                          </Heading>
                          <Tag size="sm" colorScheme={
                            resource.type === "video" ? "red" : 
                            resource.type === "pdf" ? "red" : 
                            resource.type === "excel" ? "green" : 
                            resource.type === "powerpoint" ? "orange" : "blue"
                          }>
                            {getFileTypeLabel(resource.type)}
                          </Tag>
                        </Box>
                      </Flex>
                      <Text fontSize="sm" color={secondaryTextColor} mb={4} noOfLines={2}>
                        {resource.description}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme={canViewInBrowser(resource.type) ? "blue" : "gray"}
                        rightIcon={<FaChevronRight />}
                        onClick={() => handleOpenResource(resource)}
                        width="full"
                      >
                        {getButtonText(resource.type)}
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {videoResources.map(resource => (
                  <Card 
                    key={resource._id} 
                    bg={cardBg} 
                    boxShadow="lg" 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
                  >
                    <CardBody>
                      <Box mb={3} position="relative" borderRadius="md" overflow="hidden">
                        <Box 
                          bg="gray.200" 
                          height="120px" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                        >
                          <Icon as={FaVideo} boxSize={8} color="red.500" />
                        </Box>
                        <Box 
                          position="absolute" 
                          top="4px" 
                          right="4px" 
                          bg="red.500" 
                          color="white" 
                          borderRadius="full" 
                          p={1}
                        >
                          <Icon as={FaVideo} boxSize={3} />
                        </Box>
                      </Box>
                      <Heading as="h3" size="sm" color={textColor} mb={2}>
                        {resource.title}
                      </Heading>
                      <Text fontSize="sm" color={secondaryTextColor} mb={4} noOfLines={2}>
                        {resource.description}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="red"
                        rightIcon={<FaPlayCircle />}
                        onClick={() => handleOpenResource(resource)}
                        width="full"
                      >
                        Watch Video
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {documentResources.map(resource => (
                  <Card 
                    key={resource._id} 
                    bg={cardBg} 
                    boxShadow="lg" 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
                  >
                    <CardBody>
                      <Flex align="center" mb={3}>
                        {getFileIcon(resource.type)}
                        <Box ml={3}>
                          <Heading as="h3" size="sm" color={textColor}>
                            {resource.title}
                          </Heading>
                          <Tag size="sm" colorScheme={
                            resource.type === "excel" ? "green" : 
                            resource.type === "powerpoint" ? "orange" : "blue"
                          }>
                            {getFileTypeLabel(resource.type)}
                          </Tag>
                        </Box>
                      </Flex>
                      <Text fontSize="sm" color={secondaryTextColor} mb={4} noOfLines={2}>
                        {resource.description}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="blue"
                        rightIcon={<FaEye />}
                        onClick={() => handleOpenResource(resource)}
                        width="full"
                      >
                        View Document
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {pdfResources.map(resource => (
                  <Card 
                    key={resource._id} 
                    bg={cardBg} 
                    boxShadow="lg" 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
                  >
                    <CardBody>
                      <Flex align="center" mb={3}>
                        <Icon as={FaFilePdf} boxSize={6} color="red.500" />
                        <Box ml={3}>
                          <Heading as="h3" size="sm" color={textColor}>
                            {resource.title}
                          </Heading>
                          <Tag size="sm" colorScheme="red">
                            PDF
                          </Tag>
                        </Box>
                      </Flex>
                      <Text fontSize="sm" color={secondaryTextColor} mb={4} noOfLines={2}>
                        {resource.description}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="red"
                        rightIcon={<FaEye />}
                        onClick={() => handleOpenResource(resource)}
                        width="full"
                      >
                        View PDF
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Featured Courses Section */}
      <Box mb={{ base: 8, md: 12 }}>
        <HStack justify="space-between" mb={6}>
          <Heading as="h2" size="lg" color={headingColor}>
            Popular Courses
          </Heading>
          <Link color="blue.500" fontWeight="medium">
            View All <Icon as={FaChevronRight} ml={1} />
          </Link>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {popularCourses.map(course => (
            <Card 
              key={course.id} 
              bg={cardBg} 
              boxShadow="lg" 
              borderRadius="xl" 
              borderWidth="1px" 
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
            >
              <Box position="relative">
                <Image 
                  src={course.image} 
                  alt={course.title} 
                  h="180px" 
                  w="100%" 
                  objectFit="cover" 
                />
                <Box 
                  position="absolute" 
                  top={4} 
                  right={4} 
                  bg="white" 
                  borderRadius="full" 
                  p={2}
                  boxShadow="md"
                >
                  <Icon 
                    as={bookmarkedModules.has(course.id) ? FaBookmark : FaRegStar} 
                    color={bookmarkedModules.has(course.id) ? "yellow.500" : "gray.500"} 
                    cursor="pointer"
                    onClick={() => toggleBookmark(course.id)}
                  />
                </Box>
              </Box>
              <CardBody>
                <Heading as="h3" size="md" mb={2} color={textColor}>
                  {course.title}
                </Heading>
                <HStack spacing={1} mb={3}>
                  {renderStars(course.rating)}
                  <Text fontSize="sm" color={secondaryTextColor}>({course.rating})</Text>
                </HStack>
                <Flex justify="space-between" align="center">
                  <HStack spacing={1}>
                    <Icon as={FaUsers} color={secondaryTextColor} />
                    <Text fontSize="sm" color={secondaryTextColor}>
                      {course.students.toLocaleString()} students
                    </Text>
                  </HStack>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    rightIcon={<FaChevronRight />}
                    onClick={() => startTraining(course)}
                  >
                    Start
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Main Content */}
      <Grid 
        templateColumns={{ base: "1fr", lg: "2fr 1fr" }} 
        gap={{ base: 6, md: 8 }}
      >
        {/* Left Column - Training Modules and Certificates */}
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Training Modules Section */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack justify="space-between" flexWrap="wrap" gap={4}>
                <HStack spacing={3}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg="blue.100"
                    color="blue.500"
                  >
                    <Icon as={FaBook} boxSize={5} />
                  </Box>
                  <Heading as="h2" size="lg" color={headingColor}>
                    My Learning Path
                  </Heading>
                </HStack>
                <HStack>
                  <Tooltip label="Search modules">
                    <Button variant="ghost" size="sm">
                      <Icon as={FaSearch} />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Filter">
                    <Button variant="ghost" size="sm">
                      <Icon as={FaFilter} />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Sort">
                    <Button variant="ghost" size="sm">
                      <Icon as={FaSort} />
                    </Button>
                  </Tooltip>
                </HStack>
              </HStack>
              <Text color={secondaryTextColor} fontSize="sm" mt={2}>
                Continue your learning journey with personalized modules
              </Text>
            </CardHeader>
            <CardBody>
              <Tabs 
                variant="soft-rounded" 
                colorScheme="blue" 
                index={activeTab} 
                onChange={setActiveTab}
                isFitted
              >
                <TabList mb={4}>
                  <Tab>All Modules</Tab>
                  <Tab>In Progress</Tab>
                  <Tab>Completed</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <VStack spacing={4} divider={<Divider borderColor={borderColor} />}>
                      {trainingModules.map((module) => (
                        <Card 
                          key={module.id} 
                          w="100%" 
                          borderWidth="1px" 
                          borderRadius="lg" 
                          borderColor={borderColor}
                          transition="all 0.2s"
                          _hover={{ boxShadow: "md" }}
                        >
                          <CardBody>
                            <Flex direction={{ base: "column", md: "row" }} gap={4}>
                              <Box 
                                minW={{ base: "100%", md: "200px" }} 
                                h={{ base: "150px", md: "120px" }}
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                <Image 
                                  src={module.image} 
                                  alt={module.title} 
                                  w="100%" 
                                  h="100%" 
                                  objectFit="cover" 
                                />
                              </Box>
                              <Flex flex={1} direction="column" justify="space-between">
                                <Box>
                                  <Flex justify="space-between" mb={2} wrap="wrap" gap={2}>
                                    <HStack spacing={2}>
                                      <Icon 
                                        as={module.status === "completed" ? FaCheckCircle : module.status === "in-progress" ? FaPlayCircle : FaBook} 
                                        color={module.status === "completed" ? "green.500" : module.status === "in-progress" ? "blue.500" : "gray.400"} 
                                      />
                                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                                        {module.title}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                      <Tag size="sm" colorScheme={
                                        module.level === "Beginner" ? "green" : 
                                        module.level === "Intermediate" ? "blue" : 
                                        module.level === "Advanced" ? "orange" : "purple"
                                      }>
                                        {module.level}
                                      </Tag>
                                      <Icon 
                                        as={bookmarkedModules.has(module.id) ? FaBookmark : FaRegStar} 
                                        color={bookmarkedModules.has(module.id) ? "yellow.500" : "gray.400"} 
                                        cursor="pointer"
                                        onClick={() => toggleBookmark(module.id)}
                                      />
                                    </HStack>
                                  </Flex>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    {module.category} • {module.duration}
                                  </Text>
                                  <HStack spacing={1} mb={2}>
                                    {renderStars(module.rating)}
                                    <Text fontSize="sm" color={secondaryTextColor}>
                                      {module.rating} ({module.enrolled.toLocaleString()} learners)
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    Instructor: {module.instructor}
                                  </Text>
                                </Box>
                                <Flex align="center" justify="space-between">
                                  <Progress 
                                    value={module.progress} 
                                    size="sm" 
                                    colorScheme={module.progress > 80 ? "green" : module.progress > 50 ? "blue" : "yellow"} 
                                    borderRadius="full" 
                                    flex={1}
                                    mr={3}
                                  />
                                  <Text fontSize="sm" fontWeight="bold" color="blue.500" minW="40px">
                                    {module.progress}%
                                  </Text>
                                </Flex>
                              </Flex>
                            </Flex>
                            <Flex justify="flex-end" mt={4} gap={2}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                colorScheme="gray"
                                leftIcon={<FaShare />}
                              >
                                Share
                              </Button>
                              <Button 
                                size="sm" 
                                colorScheme={module.status === "completed" ? "green" : "blue"}
                                leftIcon={module.status === "completed" ? <FaCertificate /> : <FaPlayCircle />}
                                onClick={() => startTraining(module)}
                              >
                                {module.status === "completed" ? "Review" : module.status === "in-progress" ? "Continue" : "Start"}
                              </Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </TabPanel>
                  <TabPanel px={0}>
                    <VStack spacing={4} divider={<Divider borderColor={borderColor} />}>
                      {trainingModules.filter(m => m.status === "in-progress").map((module) => (
                        <Card 
                          key={module.id} 
                          w="100%" 
                          borderWidth="1px" 
                          borderRadius="lg" 
                          borderColor={borderColor}
                          transition="all 0.2s"
                          _hover={{ boxShadow: "md" }}
                        >
                          <CardBody>
                            <Flex direction={{ base: "column", md: "row" }} gap={4}>
                              <Box 
                                minW={{ base: "100%", md: "200px" }} 
                                h={{ base: "150px", md: "120px" }}
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                <Image 
                                  src={module.image} 
                                  alt={module.title} 
                                  w="100%" 
                                  h="100%" 
                                  objectFit="cover" 
                                />
                              </Box>
                              <Flex flex={1} direction="column" justify="space-between">
                                <Box>
                                  <Flex justify="space-between" mb={2} wrap="wrap" gap={2}>
                                    <HStack spacing={2}>
                                      <Icon as={FaPlayCircle} color="blue.500" />
                                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                                        {module.title}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                      <Tag size="sm" colorScheme={
                                        module.level === "Beginner" ? "green" : 
                                        module.level === "Intermediate" ? "blue" : 
                                        module.level === "Advanced" ? "orange" : "purple"
                                      }>
                                        {module.level}
                                      </Tag>
                                      <Icon 
                                        as={bookmarkedModules.has(module.id) ? FaBookmark : FaRegStar} 
                                        color={bookmarkedModules.has(module.id) ? "yellow.500" : "gray.400"} 
                                        cursor="pointer"
                                        onClick={() => toggleBookmark(module.id)}
                                      />
                                    </HStack>
                                  </Flex>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    {module.category} • {module.duration}
                                  </Text>
                                  <HStack spacing={1} mb={2}>
                                    {renderStars(module.rating)}
                                    <Text fontSize="sm" color={secondaryTextColor}>
                                      {module.rating} ({module.enrolled.toLocaleString()} learners)
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    Instructor: {module.instructor}
                                  </Text>
                                </Box>
                                <Flex align="center" justify="space-between">
                                  <Progress 
                                    value={module.progress} 
                                    size="sm" 
                                    colorScheme={module.progress > 80 ? "green" : module.progress > 50 ? "blue" : "yellow"} 
                                    borderRadius="full" 
                                    flex={1}
                                    mr={3}
                                  />
                                  <Text fontSize="sm" fontWeight="bold" color="blue.500" minW="40px">
                                    {module.progress}%
                                  </Text>
                                </Flex>
                              </Flex>
                            </Flex>
                            <Flex justify="flex-end" mt={4} gap={2}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                colorScheme="gray"
                                leftIcon={<FaShare />}
                              >
                                Share
                              </Button>
                              <Button 
                                size="sm" 
                                colorScheme="blue"
                                leftIcon={<FaPlayCircle />}
                                onClick={() => startTraining(module)}
                              >
                                Continue
                              </Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </TabPanel>
                  <TabPanel px={0}>
                    <VStack spacing={4} divider={<Divider borderColor={borderColor} />}>
                      {trainingModules.filter(m => m.status === "completed").map((module) => (
                        <Card 
                          key={module.id} 
                          w="100%" 
                          borderWidth="1px" 
                          borderRadius="lg" 
                          borderColor={borderColor}
                          transition="all 0.2s"
                          _hover={{ boxShadow: "md" }}
                        >
                          <CardBody>
                            <Flex direction={{ base: "column", md: "row" }} gap={4}>
                              <Box 
                                minW={{ base: "100%", md: "200px" }} 
                                h={{ base: "150px", md: "120px" }}
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                <Image 
                                  src={module.image} 
                                  alt={module.title} 
                                  w="100%" 
                                  h="100%" 
                                  objectFit="cover" 
                                />
                              </Box>
                              <Flex flex={1} direction="column" justify="space-between">
                                <Box>
                                  <Flex justify="space-between" mb={2} wrap="wrap" gap={2}>
                                    <HStack spacing={2}>
                                      <Icon as={FaCheckCircle} color="green.500" />
                                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                                        {module.title}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                      <Tag size="sm" colorScheme="green">
                                        Completed
                                      </Tag>
                                      <Icon 
                                        as={bookmarkedModules.has(module.id) ? FaBookmark : FaRegStar} 
                                        color={bookmarkedModules.has(module.id) ? "yellow.500" : "gray.400"} 
                                        cursor="pointer"
                                        onClick={() => toggleBookmark(module.id)}
                                      />
                                    </HStack>
                                  </Flex>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    {module.category} • {module.duration}
                                  </Text>
                                  <HStack spacing={1} mb={2}>
                                    {renderStars(module.rating)}
                                    <Text fontSize="sm" color={secondaryTextColor}>
                                      {module.rating} ({module.enrolled.toLocaleString()} learners)
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                                    Instructor: {module.instructor}
                                  </Text>
                                </Box>
                                <Flex align="center">
                                  <Progress 
                                    value={100} 
                                    size="sm" 
                                    colorScheme="green" 
                                    borderRadius="full" 
                                    flex={1}
                                    mr={3}
                                  />
                                  <Text fontSize="sm" fontWeight="bold" color="green.500" minW="40px">
                                    100%
                                  </Text>
                                </Flex>
                              </Flex>
                            </Flex>
                            <Flex justify="flex-end" mt={4} gap={2}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                colorScheme="gray"
                                leftIcon={<FaShare />}
                              >
                                Share
                              </Button>
                              <Button 
                                size="sm" 
                                colorScheme="green"
                                leftIcon={<FaCertificate />}
                                onClick={() => startTraining(module)}
                              >
                                Review
                              </Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
            <Flex justify="center" p={4}>
              <Button 
                variant="outline" 
                colorScheme="blue" 
                size="lg" 
                px={8}
                rightIcon={<FaChevronRight />}
              >
                Browse All Courses
              </Button>
            </Flex>
          </Card>

          {/* Certificates Section */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="yellow.100"
                  color="yellow.500"
                >
                  <Icon as={FaAward} boxSize={5} />
                </Box>
                <Heading as="h2" size="lg" color={headingColor}>
                  Achievements & Certificates
                </Heading>
              </HStack>
              <Text color={secondaryTextColor} fontSize="sm" mt={2}>
                Showcase your accomplishments and earned certificates
              </Text>
            </CardHeader>
            <CardBody>
              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <AccordionButton py={3}>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      My Certificates
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {certificates.map((cert) => (
                        <Card 
                          key={cert.id} 
                          borderWidth="1px" 
                          borderRadius="lg" 
                          borderColor={borderColor}
                          overflow="hidden"
                        >
                          <Image 
                            src={cert.image} 
                            alt={cert.title} 
                            h="120px" 
                            w="100%" 
                            objectFit="cover" 
                          />
                          <CardBody>
                            <Heading as="h3" size="sm" mb={2} color={textColor}>
                              {cert.title}
                            </Heading>
                            <Flex justify="space-between" align="center">
                              <Text fontSize="sm" color={secondaryTextColor}>
                                Issued: {cert.date}
                              </Text>
                              <Badge colorScheme="green" fontSize="xs">
                                {cert.status}
                              </Badge>
                            </Flex>
                            <Flex justify="flex-end" mt={3} gap={2}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                colorScheme="gray"
                                leftIcon={<FaShare />}
                              >
                                Share
                              </Button>
                              <Button 
                                size="sm" 
                                colorScheme="yellow"
                                leftIcon={<FaDownload />}
                              >
                                Download
                              </Button>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem border="none">
                  <AccordionButton py={3}>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      Badges & Awards
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Card 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        borderColor={borderColor}
                        textAlign="center"
                        p={4}
                      >
                        <Box
                          mx="auto"
                          mb={2}
                          p={3}
                          borderRadius="full"
                          bg="blue.100"
                          color="blue.500"
                          w="60px"
                          h="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaTrophy} boxSize={6} />
                        </Box>
                        <Text fontWeight="semibold" fontSize="sm">Fast Learner</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>Completed 5 courses</Text>
                      </Card>
                      
                      <Card 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        borderColor={borderColor}
                        textAlign="center"
                        p={4}
                      >
                        <Box
                          mx="auto"
                          mb={2}
                          p={3}
                          borderRadius="full"
                          bg="green.100"
                          color="green.500"
                          w="60px"
                          h="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaStar} boxSize={6} />
                        </Box>
                        <Text fontWeight="semibold" fontSize="sm">Top Performer</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>90%+ average score</Text>
                      </Card>
                      
                      <Card 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        borderColor={borderColor}
                        textAlign="center"
                        p={4}
                      >
                        <Box
                          mx="auto"
                          mb={2}
                          p={3}
                          borderRadius="full"
                          bg="purple.100"
                          color="purple.500"
                          w="60px"
                          h="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaMedal} boxSize={6} />
                        </Box>
                        <Text fontWeight="semibold" fontSize="sm">Consistent</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>7 days streak</Text>
                      </Card>
                      
                      <Card 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        borderColor={borderColor}
                        textAlign="center"
                        p={4}
                      >
                        <Box
                          mx="auto"
                          mb={2}
                          p={3}
                          borderRadius="full"
                          bg="orange.100"
                          color="orange.500"
                          w="60px"
                          h="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaCertificate} boxSize={6} />
                        </Box>
                        <Text fontWeight="semibold" fontSize="sm">Certified Pro</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>10+ certificates</Text>
                      </Card>
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </VStack>

        {/* Right Column - Quick Actions & Progress */}
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Quick Actions */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="purple.100"
                  color="purple.500"
                >
                  <Icon as={FaUserGraduate} boxSize={5} />
                </Box>
                <Heading as="h2" size="md" color={headingColor}>
                  Quick Access
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Button 
                  leftIcon={<FaPlayCircle />} 
                  colorScheme="blue" 
                  w="full" 
                  justifyContent="flex-start"
                  size="lg"
                  py={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="semibold">Continue Learning</Text>
                    <Text fontSize="sm" opacity={0.8}>Resume your last course</Text>
                  </VStack>
                </Button>
                
                <Button 
                  leftIcon={<FaFilePdf />} 
                  colorScheme="red" 
                  variant="outline" 
                  w="full" 
                  justifyContent="flex-start"
                  size="lg"
                  py={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="semibold">Download Materials</Text>
                    <Text fontSize="sm" opacity={0.8}>Access course resources</Text>
                  </VStack>
                </Button>
                
                <Button 
                  leftIcon={<FaTrophy />} 
                  colorScheme="yellow" 
                  variant="outline" 
                  w="full" 
                  justifyContent="flex-start"
                  size="lg"
                  py={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="semibold">My Certificates</Text>
                    <Text fontSize="sm" opacity={0.8}>View earned credentials</Text>
                  </VStack>
                </Button>
                
                <Button 
                  leftIcon={<FaCalendarAlt />} 
                  colorScheme="teal" 
                  variant="outline" 
                  w="full" 
                  justifyContent="flex-start"
                  size="lg"
                  py={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="semibold">Learning Schedule</Text>
                    <Text fontSize="sm" opacity={0.8}>Plan your study time</Text>
                  </VStack>
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="orange.100"
                  color="orange.500"
                >
                  <Icon as={FaHistory} boxSize={5} />
                </Box>
                <Heading as="h2" size="md" color={headingColor}>
                  Recent Activity
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} divider={<Divider borderColor={borderColor} />}>
                {recentActivity.map((activity) => (
                  <Flex key={activity.id} justify="space-between" w="100%" align="center" p={2}>
                    <HStack spacing={3}>
                      <Box
                        p={2}
                        borderRadius="full"
                        bg={
                          activity.type === "completion" ? "green.100" : 
                          activity.type === "start" ? "blue.100" : 
                          activity.type === "download" ? "red.100" : "orange.100"
                        }
                        color={
                          activity.type === "completion" ? "green.500" : 
                          activity.type === "start" ? "blue.500" : 
                          activity.type === "download" ? "red.500" : "orange.500"
                        }
                      >
                        <Icon 
                          as={
                            activity.type === "completion" ? FaCheckCircle : 
                            activity.type === "start" ? FaPlayCircle : 
                            activity.type === "download" ? FaDownload : FaChartLine
                          } 
                        />
                      </Box>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">{activity.title}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>{activity.time}</Text>
                      </Box>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Overall Progress */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.100"
                  color="green.500"
                >
                  <Icon as={FaChartLine} boxSize={5} />
                </Box>
                <Heading as="h2" size="md" color={headingColor}>
                  Learning Progress
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={6}>
                <Box textAlign="center">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Overall Completion</Text>
                  <Box position="relative" display="inline-block" mb={2}>
                    <Progress 
                      value={stats.avgCompletionRate} 
                      size="lg" 
                      colorScheme="blue" 
                      borderRadius="full" 
                      width={{ base: "140px", md: "160px" }}
                      height={{ base: "140px", md: "160px" }}
                      sx={{
                        '& > div': {
                          borderRadius: 'full',
                        }
                      }}
                    />
                    <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                      <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                        {stats.avgCompletionRate}%
                      </Text>
                      <Text fontSize="xs" color={secondaryTextColor}>Completed</Text>
                    </Box>
                  </Box>
                  <Text fontSize="sm" color={secondaryTextColor} mt={2}>
                    You're doing great! Keep up the excellent work.
                  </Text>
                </Box>
                
                <Divider />
                
                <Box w="100%">
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">Learning Goals</Text>
                    <Text fontSize="sm" color={secondaryTextColor}>3/5</Text>
                  </Flex>
                  <Progress value={60} size="sm" colorScheme="green" borderRadius="full" mb={4} />
                  
                  <FormControl display="flex" alignItems="center" justify="space-between">
                    <FormLabel htmlFor="notifications" mb="0" fontSize="sm">
                      Daily Reminders
                    </FormLabel>
                    <Switch id="notifications" colorScheme="blue" defaultChecked />
                  </FormControl>
                </Box>
              </VStack>
            </CardBody>
          </Card>
          
          {/* Upcoming Events */}
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="red.100"
                  color="red.500"
                >
                  <Icon as={FaCalendarAlt} boxSize={5} />
                </Box>
                <Heading as="h2" size="md" color={headingColor}>
                  Upcoming Deadlines
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box p={3} bg="orange.50" borderRadius="lg" borderWidth="1px" borderColor="orange.200">
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" fontSize="sm">Sales Techniques Final</Text>
                    <Text fontSize="xs" color="orange.600">Due Tomorrow</Text>
                  </Flex>
                  <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                    Complete final assessment to earn certificate
                  </Text>
                </Box>
                
                <Box p={3} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
                  <Flex justify="space-between">
                    <Text fontWeight="semibold" fontSize="sm">Leadership Workshop</Text>
                    <Text fontSize="xs" color="blue.600">In 3 Days</Text>
                  </Flex>
                  <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                    Live session with industry experts
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Grid>
      
      {/* Resource Modal for Videos */}
      <Modal isOpen={isResourceModalOpen} onClose={onResourceModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedResource?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedResource?.type === "video" ? (
              selectedResource?.content && (selectedResource.content.includes("youtube.com") || selectedResource.content.includes("youtu.be")) ? (
                (() => {
                  const match = selectedResource.content.match(/(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const youtubeId = match ? match[1] : "";
                  return youtubeId ? (
                    <Box position="relative" pb="56.25%" height="0">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "8px" }}
                      ></iframe>
                    </Box>
                  ) : <Text>Invalid YouTube link.</Text>;
                })()
              ) : (
                <video 
                  controls 
                  style={{ width: "100%" }} 
                  src={selectedResource.fileUrl || `${import.meta.env.VITE_API_URL}${selectedResource.content}`} 
                />
              )
            ) : null}
            <Text mt={4}>{selectedResource?.description}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onResourceModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Start Training Alert Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={undefined}
        onClose={closeAlert}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {selectedModule ? selectedModule.title : "Start Training"}
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedModule ? (
                <VStack align="stretch" spacing={4}>
                  <Text>
                    Ready to continue with "{selectedModule.title}"?
                  </Text>
                  <HStack>
                    <Icon as={FaRegClock} color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      Duration: {selectedModule.duration}
                    </Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaUsers} color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      {selectedModule.enrolled?.toLocaleString() || "N/A"} learners
                    </Text>
                  </HStack>
                </VStack>
              ) : (
                "Are you sure you want to start this training?"
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={closeAlert}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={closeAlert} 
                ml={3}
              >
                Start Now
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ModernTrainingPage;