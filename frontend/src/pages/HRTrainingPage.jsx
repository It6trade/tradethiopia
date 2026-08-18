import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  Tooltip,
  VStack
} from "@chakra-ui/react";
import {
  FiAward,
  FiBook,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCompass,
  FiExternalLink,
  FiFileText,
  FiHelpCircle,
  FiLayers,
  FiList,
  FiMaximize2,
  FiPlay,
  FiRefreshCw,
  FiStar,
  FiTarget,
  FiZoomIn
} from "react-icons/fi";
import { fetchCourses } from "../services/api";

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const fallbackCourse = {
  id: "hr-fallback",
  title: "Human Resources Handbook",
  overview: "Welcome to the TradeEthiopia central employee development repository. Explore guided chapters, verify company guidelines, and master essential workflows.",
  passPercentage: 75,
  slides: [],
  quizQuestions: []
};

const asText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeImageUrls = (slide = {}) => {
  const values = [
    asText(slide?.imageUrl, ""),
    ...(Array.isArray(slide?.imageUrls) ? slide.imageUrls : [])
  ]
    .map((value) => asText(value, ""))
    .filter(Boolean);

  return values.filter((value, index) => values.indexOf(value) === index);
};

const normalizeSlides = (slides = []) => {
  if (!Array.isArray(slides)) return [];

  return slides
    .map((slide, index) => {
      const title = asText(slide?.title, `Chapter ${index + 1}`);
      const body = asText(slide?.body, "");
      const imageUrls = normalizeImageUrls(slide);
      const imageUrl = imageUrls[0] || "";
      const materialUrl = asText(slide?.materialUrl, "");
      const id = asText(slide?._id || slide?.id, `hr-slide-${index + 1}`);
      const slideNumber = Number(slide?.slideNumber) || index + 1;

      if (!title && !body && !imageUrl && !materialUrl && imageUrls.length === 0) {
        return null;
      }

      return {
        id,
        slideNumber,
        title,
        body,
        imageUrl,
        imageUrls,
        materialUrl
      };
    })
    .filter(Boolean);
};

const normalizeQuizQuestions = (quizQuestions = []) => {
  if (!Array.isArray(quizQuestions)) return [];

  return quizQuestions
    .map((quiz, index) => {
      const question = asText(quiz?.question, `Question ${index + 1}`);
      const options = Array.isArray(quiz?.options)
        ? quiz.options.map((option) => asText(option, "")).filter(Boolean)
        : [];

      if (!question || options.length < 2) return null;

      const answerInput = Number(quiz?.correctAnswer);
      const correctAnswer = Number.isFinite(answerInput)
        ? clamp(Math.trunc(answerInput), 0, options.length - 1)
        : 0;

      return {
        id: asText(quiz?._id, `hr-question-${index + 1}`),
        questionNumber: Number(quiz?.questionNumber) || index + 1,
        question,
        options,
        correctAnswer,
        explanation: asText(quiz?.explanation, "")
      };
    })
    .filter(Boolean);
};

const normalizeCourse = (course = {}) => {
  const title = asText(course?.name || course?.title, fallbackCourse.title);
  const overview = asText(course?.overview || course?.description, fallbackCourse.overview);
  const passInput = Number(course?.passPercentage);

  return {
    id: asText(course?._id, fallbackCourse.id),
    title,
    overview,
    passPercentage: Number.isFinite(passInput) ? clamp(passInput, 0, 100) : fallbackCourse.passPercentage,
    slides: normalizeSlides(course?.slides),
    quizQuestions: normalizeQuizQuestions(course?.quizQuestions)
  };
};

const isVisiblePublishedCourse = (course = {}) => {
  const slides = Array.isArray(course?.slides) ? course.slides : [];
  const quizQuestions = Array.isArray(course?.quizQuestions) ? course.quizQuestions : [];

  return course?.status === "published" || (!course?.status && (slides.length > 0 || quizQuestions.length > 0));
};

const HRTrainingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState(new Set([0]));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const readerRef = useRef(null);

  const loadCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCourses();
      const published = (Array.isArray(data) ? data : [])
        .filter(isPersistedCourse)
        .filter(isVisiblePublishedCourse)
        .map(normalizeCourse);

      setCourses(published);
      setSelectedCourseId((prev) => prev || published[0]?.id || "");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load HR training.");
      setCourses([]);
      setSelectedCourseId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  const course = selectedCourse || fallbackCourse;
  const slides = course.slides || [];
  const quizQuestions = course.quizQuestions || [];
  const currentSlide = slides[currentSlideIndex] || null;
  const currentSlideImages = currentSlide?.imageUrls?.filter(Boolean) || [];
  const activeSlideImage = currentSlideImages[activePageIndex] || currentSlideImages[0] || "";
  const currentQuestion = quizQuestions[currentQuestionIndex] || null;
  const selectedForCurrentQuestion = selectedAnswers[currentQuestionIndex];

  // Primary cover image for 3D Book view
  const coverImage = slides[0]?.imageUrls?.[0] || slides[0]?.imageUrl || "";

  useEffect(() => {
    if (selectedCourseId && !courses.some((courseItem) => courseItem.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (slides.length > 0) {
      setCurrentSlideIndex(0);
      setActivePageIndex(0);
      setVisitedSlides(new Set([0]));
    } else {
      setCurrentSlideIndex(0);
      setActivePageIndex(0);
      setVisitedSlides(new Set());
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(quizQuestions.length).fill(null));
    setIsQuizComplete(false);
    setIsImagePreviewOpen(false);
  }, [course.id, slides.length, quizQuestions.length]);

  // Reset page index when switching chapter
  useEffect(() => {
    setActivePageIndex(0);
  }, [currentSlideIndex]);

  const answeredCount = selectedAnswers.filter((value) => value !== null).length;
  const completedSlides = Math.min(visitedSlides.size, slides.length);
  const totalSteps = slides.length + quizQuestions.length;
  const completedSteps = completedSlides + answeredCount;
  const overallCompletion = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const quizScore = useMemo(
    () =>
      selectedAnswers.reduce((total, selected, index) => {
        if (selected === null) return total;
        return selected === quizQuestions[index]?.correctAnswer ? total + 1 : total;
      }, 0),
    [quizQuestions, selectedAnswers]
  );

  useEffect(() => {
    setIsQuizComplete(quizQuestions.length > 0 && answeredCount === quizQuestions.length);
  }, [answeredCount, quizQuestions.length]);

  const requiredScore =
    quizQuestions.length > 0
      ? Math.ceil((clamp(course.passPercentage, 0, 100) / 100) * quizQuestions.length)
      : 0;
  const didPass = quizScore >= requiredScore;

  const goToSlide = (index) => {
    if (index < 0 || index >= slides.length) return;
    setCurrentSlideIndex(index);
    setActivePageIndex(0);
    setVisitedSlides((prev) => new Set([...prev, index]));
    if (readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPage = (pageIdx) => {
    if (pageIdx >= 0 && pageIdx < currentSlideImages.length) {
      setActivePageIndex(pageIdx);
    }
  };

  const submitAnswer = (optionIndex) => {
    if (selectedAnswers[currentQuestionIndex] !== null && selectedAnswers[currentQuestionIndex] !== undefined) {
      return;
    }
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = optionIndex;
      return next;
    });
  };

  const resetQuiz = () => {
    setSelectedAnswers(Array(quizQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setIsQuizComplete(false);
  };

  const openFullscreenPreview = (index = activePageIndex) => {
    setPreviewImageIndex(clamp(index, 0, Math.max(0, currentSlideImages.length - 1)));
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
  };

  const goToPreviewImage = (direction) => {
    if (currentSlideImages.length <= 1) return;
    setPreviewImageIndex((prev) => {
      const nextIndex = prev + direction;
      if (nextIndex < 0) return currentSlideImages.length - 1;
      if (nextIndex >= currentSlideImages.length) return 0;
      return nextIndex;
    });
  };

  const scrollToReader = (tabIdx = 0) => {
    setActiveTabIndex(tabIdx);
    setTimeout(() => {
      if (readerRef.current) {
        readerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <Box bg="#F8FAFC" minH="100vh" py={{ base: 4, md: 8 }}>
      <Container maxW="7xl" px={{ base: 3, md: 6 }}>
        {/* Top Header / Switcher */}
        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={6}
        >
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontSize="xs" fontWeight="bold" color="teal.600" textTransform="uppercase" letterSpacing="wider">
                HR Workspace
              </Text>
              <Text fontSize="xs" color="gray.400">/</Text>
              <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                Onboarding & Training
              </Text>
            </HStack>
            <Heading size="lg" color="gray.800" fontWeight="extrabold">
              Interactive Employee Training
            </Heading>
          </VStack>

          {/* Course Selector Dropdown & Refresh */}
          <HStack spacing={3} w={{ base: "full", md: "auto" }}>
            <Select
              bg="white"
              size="md"
              borderRadius="lg"
              boxShadow="sm"
              borderColor="gray.200"
              fontWeight="medium"
              value={selectedCourse?.id || ""}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              isDisabled={loading || courses.length === 0}
              maxW={{ base: "full", md: "320px" }}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Tooltip label="Refresh training materials">
              <IconButton
                aria-label="Refresh"
                icon={<FiRefreshCw />}
                onClick={loadCourses}
                isLoading={loading}
                colorScheme="teal"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
        </Flex>

        {loading ? (
          <Card bg="white" borderRadius="2xl" p={12} boxShadow="sm" textAlign="center">
            <VStack spacing={4}>
              <Spinner size="xl" color="teal.500" thickness="4px" />
              <Text fontWeight="semibold" color="gray.600">
                Loading official HR training materials...
              </Text>
            </VStack>
          </Card>
        ) : error ? (
          <Card bg="red.50" borderColor="red.200" borderWidth="1px" borderRadius="2xl" p={8}>
            <VStack align="start" spacing={3}>
              <Heading size="md" color="red.700">Unable to load HR training</Heading>
              <Text color="red.600">{error}</Text>
              <Button colorScheme="red" size="sm" onClick={loadCourses}>Retry</Button>
            </VStack>
          </Card>
        ) : courses.length === 0 ? (
          <Card bg="white" borderRadius="2xl" p={12} textAlign="center" boxShadow="sm">
            <VStack spacing={3}>
              <Icon as={FiBook} boxSize={12} color="gray.400" />
              <Heading size="md" color="gray.700">No Published Training Available</Heading>
              <Text color="gray.500" maxW="md">
                No published training courses found. An HR administrator can create and publish courses in the Course Studio.
              </Text>
            </VStack>
          </Card>
        ) : (
          <VStack spacing={8} align="stretch">
            {/* HERO SHOWCASE CARD (Matching Reference UI) */}
            <Card
              overflow="hidden"
              borderRadius="2xl"
              boxShadow="0 20px 40px -15px rgba(0, 77, 64, 0.15)"
              borderWidth="1px"
              borderColor="gray.100"
              bg="white"
            >
              <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} minH="440px">
                {/* Left Side: 3D Book Cover Showcase */}
                <Box
                  position="relative"
                  bgGradient="linear(to-br, #0B2530, #004D40 70%, #00251A)"
                  p={{ base: 6, md: 8 }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="center"
                  color="white"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top="-20%"
                    left="-20%"
                    w="250px"
                    h="250px"
                    bg="teal.400"
                    opacity="0.15"
                    filter="blur(50px)"
                    borderRadius="full"
                    pointerEvents="none"
                  />
                  <Box
                    position="absolute"
                    bottom="-10%"
                    right="-10%"
                    w="200px"
                    h="200px"
                    bg="cyan.400"
                    opacity="0.12"
                    filter="blur(40px)"
                    borderRadius="full"
                    pointerEvents="none"
                  />

                  <Flex w="full" justify="space-between" align="center" zIndex={2} mb={4}>
                    <HStack spacing={1}>
                      <Icon as={FiCompass} boxSize={3.5} color="teal.300" />
                      <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" color="teal.200" textTransform="uppercase">
                        HR Edition
                      </Text>
                    </HStack>
                    <Badge colorScheme="teal" variant="solid" px={2} py={0.5} borderRadius="full" fontSize="2xs">
                      PUBLISHED
                    </Badge>
                  </Flex>

                  {/* 3D Elevated Book Container */}
                  <Box
                    position="relative"
                    my="auto"
                    w={{ base: "200px", sm: "220px" }}
                    h={{ base: "280px", sm: "300px" }}
                    borderRadius="lg"
                    boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7), -10px 10px 25px rgba(0, 77, 64, 0.4)"
                    overflow="hidden"
                    borderWidth="2px"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    transition="transform 0.3s ease"
                    _hover={{ transform: "translateY(-6px) scale(1.02)" }}
                    bg="gray.900"
                    cursor="pointer"
                    onClick={() => scrollToReader(0)}
                  >
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={course.title}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex
                        w="full"
                        h="full"
                        bgGradient="linear(to-b, #0F3443, #34E89E)"
                        p={6}
                        direction="column"
                        justify="space-between"
                        color="white"
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontSize="2xs" fontWeight="extrabold" letterSpacing="widest" opacity={0.8} textTransform="uppercase">
                            Official Handbook
                          </Text>
                          <Heading size="sm" lineHeight="shorter">
                            {course.title}
                          </Heading>
                        </VStack>
                        <Box>
                          <Divider my={2} borderColor="whiteAlpha.400" />
                          <Text fontSize="2xs" fontWeight="semibold" opacity={0.9}>
                            TradeEthiopia Group
                          </Text>
                        </Box>
                      </Flex>
                    )}

                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      bottom={0}
                      w="18px"
                      bgGradient="linear(to-r, rgba(0,0,0,0.5), rgba(0,0,0,0.1), transparent)"
                      pointerEvents="none"
                    />

                    <Flex
                      position="absolute"
                      bottom={2}
                      right={2}
                      bg="blackAlpha.700"
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      align="center"
                      gap={1}
                      fontSize="2xs"
                    >
                      <Icon as={FiMaximize2} />
                      <Text>Preview</Text>
                    </Flex>
                  </Box>

                  <HStack spacing={3} mt={4} zIndex={2} w="full" justify="center">
                    <Button
                      size="sm"
                      bg="whiteAlpha.200"
                      _hover={{ bg: "whiteAlpha.300" }}
                      color="white"
                      borderRadius="full"
                      leftIcon={<FiBookOpen />}
                      onClick={() => scrollToReader(0)}
                      fontSize="xs"
                    >
                      {slides.length} Chapters
                    </Button>
                    <Button
                      size="sm"
                      bg="teal.400"
                      _hover={{ bg: "teal.300" }}
                      color="gray.900"
                      fontWeight="bold"
                      borderRadius="full"
                      leftIcon={<FiAward />}
                      onClick={() => scrollToReader(1)}
                      fontSize="xs"
                    >
                      {quizQuestions.length} Q Quiz
                    </Button>
                  </HStack>
                </Box>

                {/* Right Side: Rich Course Metadata & Actions */}
                <Box p={{ base: 6, md: 8, lg: 10 }} display="flex" flexDirection="column" justifyContent="space-between">
                  <VStack align="start" spacing={4} w="full">
                    <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={2}>
                      <HStack spacing={2}>
                        <Tag size="md" colorScheme="teal" borderRadius="full" fontWeight="bold">
                          HR & COMPLIANCE
                        </Tag>
                        <Tag size="md" variant="subtle" colorScheme="gray" borderRadius="full">
                          2026 EDITION
                        </Tag>
                      </HStack>

                      <HStack spacing={3} bg="teal.50" px={3} py={1.5} borderRadius="full">
                        <CircularProgress value={overallCompletion} color="teal.500" size="28px" thickness="12px">
                          <CircularProgressLabel fontSize="2xs" fontWeight="bold">
                            {overallCompletion}%
                          </CircularProgressLabel>
                        </CircularProgress>
                        <Text fontSize="xs" fontWeight="bold" color="teal.900">
                          {completedSteps} of {totalSteps} completed
                        </Text>
                      </HStack>
                    </Flex>

                    <Box>
                      <Heading size="xl" color="gray.900" fontWeight="extrabold" mb={1}>
                        {course.title}
                      </Heading>
                      <Text fontSize="md" color="teal.700" fontWeight="semibold">
                        TradeEthiopia Human Resources Department
                      </Text>
                    </Box>

                    <HStack spacing={4} wrap="wrap">
                      <HStack spacing={1} color="amber.400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon key={star} as={FiStar} fill="#ECC94B" color="#ECC94B" boxSize={4} />
                        ))}
                        <Text fontSize="sm" fontWeight="bold" color="gray.700" ml={1}>
                          5.0
                        </Text>
                      </HStack>

                      <Divider orientation="vertical" h="16px" />

                      <HStack spacing={1}>
                        <Icon as={FiLayers} color="teal.600" />
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          <strong>{slides.length}</strong> Modules
                        </Text>
                      </HStack>

                      <Divider orientation="vertical" h="16px" />

                      <HStack spacing={1}>
                        <Icon as={FiTarget} color="teal.600" />
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          Pass Mark: <strong>{course.passPercentage}%</strong>
                        </Text>
                      </HStack>
                    </HStack>

                    <Text fontSize="sm" color="gray.600" lineHeight="tall" noOfLines={4}>
                      {course.overview ||
                        "This interactive handbook covers complete operational guidelines, employee responsibilities, compliance workflows, and institutional standards for TradeEthiopia team members."}
                    </Text>

                    <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3} w="full" pt={2}>
                      <Box p={3} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                        <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                          Format
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="gray.800">
                          Digital Slides & PDF
                        </Text>
                      </Box>
                      <Box p={3} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                        <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                          Assessment
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="gray.800">
                          {quizQuestions.length} Questions Test
                        </Text>
                      </Box>
                      <Box p={3} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                        <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                          Outcome
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="teal.700">
                          Verified Certification
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>

                  <HStack spacing={4} mt={6} wrap="wrap">
                    <Button
                      size="lg"
                      colorScheme="teal"
                      bg="#004D40"
                      _hover={{ bg: "#00796B" }}
                      leftIcon={<FiPlay />}
                      onClick={() => scrollToReader(0)}
                      px={8}
                      boxShadow="0 10px 20px -5px rgba(0, 77, 64, 0.4)"
                    >
                      Start Reading
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="teal"
                      borderColor="teal.600"
                      leftIcon={<FiAward />}
                      onClick={() => scrollToReader(1)}
                    >
                      Take Quiz ({quizQuestions.length})
                    </Button>
                  </HStack>
                </Box>
              </Grid>
            </Card>

            {/* INTERACTIVE WORKSPACE TABS */}
            <Box ref={readerRef} pt={4}>
              <Tabs
                index={activeTabIndex}
                onChange={(idx) => setActiveTabIndex(idx)}
                variant="soft-rounded"
                colorScheme="teal"
              >
                <Flex
                  justify="space-between"
                  align={{ base: "start", sm: "center" }}
                  direction={{ base: "column", sm: "row" }}
                  gap={4}
                  mb={6}
                  pb={3}
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                >
                  <TabList bg="white" p={1.5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100">
                    <Tab fontWeight="bold" fontSize="sm" px={5} py={2.5}>
                      <HStack spacing={2}>
                        <Icon as={FiBookOpen} />
                        <Text>Course Chapters ({slides.length})</Text>
                      </HStack>
                    </Tab>
                    <Tab fontWeight="bold" fontSize="sm" px={5} py={2.5}>
                      <HStack spacing={2}>
                        <Icon as={FiAward} />
                        <Text>Quiz & Assessment ({quizQuestions.length})</Text>
                      </HStack>
                    </Tab>
                  </TabList>

                  <HStack spacing={3}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                      Reading Progress:
                    </Text>
                    <Badge colorScheme={visitedSlides.size >= slides.length ? "green" : "teal"} px={3} py={1} borderRadius="full">
                      {completedSlides} of {slides.length} Chapters Read
                    </Badge>
                  </HStack>
                </Flex>

                <TabPanels>
                  {/* TAB 1: PROFESSIONAL SINGLE-COLUMN DOCUMENT READER */}
                  <TabPanel p={0}>
                    {slides.length === 0 || !currentSlide ? (
                      <Card p={8} bg="white" borderRadius="xl" textAlign="center">
                        <Text color="gray.500">No chapters published yet.</Text>
                      </Card>
                    ) : (
                      <VStack spacing={6} align="stretch">
                        {/* 1. HORIZONTAL CHAPTER SELECTOR RIBBON (Spacious & Clean) */}
                        <Card bg="white" borderRadius="xl" p={3} boxShadow="sm" borderWidth="1px" borderColor="gray.100">
                          <Flex align="center" gap={2} overflowX="auto" py={1} px={1} css={{ "&::-webkit-scrollbar": { height: "4px" } }}>
                            <HStack spacing={2} flexShrink={0} mr={2}>
                              <Icon as={FiList} color="teal.600" />
                              <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
                                Chapters:
                              </Text>
                            </HStack>
                            {slides.map((slide, index) => {
                              const isCurrent = index === currentSlideIndex;
                              const isVisited = visitedSlides.has(index);
                              return (
                                <Button
                                  key={`chapter-nav-${index}`}
                                  size="sm"
                                  variant={isCurrent ? "solid" : isVisited ? "subtle" : "ghost"}
                                  colorScheme={isCurrent ? "teal" : isVisited ? "green" : "gray"}
                                  onClick={() => goToSlide(index)}
                                  borderRadius="full"
                                  px={4}
                                  py={2}
                                  flexShrink={0}
                                  fontSize="xs"
                                  fontWeight={isCurrent ? "bold" : "medium"}
                                  leftIcon={
                                    isVisited && !isCurrent ? (
                                      <FiCheck />
                                    ) : (
                                      <Flex
                                        w="16px"
                                        h="16px"
                                        borderRadius="full"
                                        bg={isCurrent ? "white" : "gray.200"}
                                        color={isCurrent ? "teal.800" : "gray.700"}
                                        fontSize="2xs"
                                        align="center"
                                        justify="center"
                                        fontWeight="bold"
                                      >
                                        {index + 1}
                                      </Flex>
                                    )
                                  }
                                >
                                  {slide.title}
                                </Button>
                              );
                            })}
                          </Flex>
                        </Card>

                        {/* 2. THE MAIN FULL-WIDTH DOCUMENT VIEWER CANVAS */}
                        <Card
                          bg="white"
                          borderRadius="2xl"
                          p={{ base: 4, md: 6 }}
                          boxShadow="0 10px 30px -10px rgba(0, 0, 0, 0.08)"
                          borderWidth="1px"
                          borderColor="gray.100"
                        >
                          {/* Viewer Header Bar */}
                          <Flex
                            justify="space-between"
                            align={{ base: "start", sm: "center" }}
                            direction={{ base: "column", sm: "row" }}
                            gap={3}
                            pb={4}
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            mb={4}
                          >
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Badge colorScheme="teal" borderRadius="md" px={2.5} py={0.5} fontSize="xs" fontWeight="bold">
                                  CHAPTER {currentSlideIndex + 1} OF {slides.length}
                                </Badge>
                                {visitedSlides.has(currentSlideIndex) && (
                                  <Badge colorScheme="green" variant="subtle" fontSize="xs">
                                    ✓ Completed
                                  </Badge>
                                )}
                              </HStack>
                              <Heading size="md" color="gray.800">
                                {currentSlide.title}
                              </Heading>
                            </VStack>

                            {/* Page Stepper & Fullscreen Controls */}
                            <HStack spacing={3} wrap="wrap">
                              {currentSlideImages.length > 1 && (
                                <HStack spacing={1} bg="gray.100" p={1} borderRadius="lg">
                                  <IconButton
                                    aria-label="Previous page"
                                    icon={<FiChevronLeft />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => goToPage(activePageIndex - 1)}
                                    isDisabled={activePageIndex === 0}
                                  />
                                  <Text fontSize="xs" fontWeight="bold" color="gray.700" px={2}>
                                    Page {activePageIndex + 1} of {currentSlideImages.length}
                                  </Text>
                                  <IconButton
                                    aria-label="Next page"
                                    icon={<FiChevronRight />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => goToPage(activePageIndex + 1)}
                                    isDisabled={activePageIndex === currentSlideImages.length - 1}
                                  />
                                </HStack>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="teal"
                                leftIcon={<FiZoomIn />}
                                onClick={() => openFullscreenPreview(activePageIndex)}
                              >
                                Zoom / Fullscreen
                              </Button>

                              {currentSlide.materialUrl && (
                                <Link href={currentSlide.materialUrl} isExternal>
                                  <Button size="sm" colorScheme="teal" variant="ghost" leftIcon={<FiExternalLink />}>
                                    Resource
                                  </Button>
                                </Link>
                              )}
                            </HStack>
                          </Flex>

                          {/* Large, Readable Single Document Canvas */}
                          <Box
                            bg="#0F172A"
                            borderRadius="xl"
                            p={{ base: 3, md: 8 }}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            minH={{ base: "360px", md: "680px" }}
                            position="relative"
                            overflow="hidden"
                          >
                            {activeSlideImage ? (
                              <Box
                                position="relative"
                                maxW="880px"
                                w="full"
                                bg="white"
                                borderRadius="lg"
                                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                                overflow="hidden"
                                cursor="zoom-in"
                                onClick={() => openFullscreenPreview(activePageIndex)}
                                transition="transform 0.2s"
                                _hover={{ transform: "scale(1.005)" }}
                              >
                                <Image
                                  src={activeSlideImage}
                                  alt={`${currentSlide.title} Page ${activePageIndex + 1}`}
                                  w="full"
                                  maxH="820px"
                                  objectFit="contain"
                                  bg="white"
                                />
                                <Flex
                                  position="absolute"
                                  bottom={3}
                                  right={3}
                                  bg="blackAlpha.750"
                                  color="white"
                                  px={3}
                                  py={1.5}
                                  borderRadius="md"
                                  fontSize="xs"
                                  align="center"
                                  gap={1.5}
                                >
                                  <Icon as={FiMaximize2} />
                                  <Text fontWeight="semibold">Click to expand</Text>
                                </Flex>
                              </Box>
                            ) : (
                              <VStack spacing={3} color="gray.400" py={16}>
                                <Icon as={FiFileText} boxSize={12} />
                                <Text fontSize="md" fontWeight="medium">
                                  No slide image attached for this chapter.
                                </Text>
                              </VStack>
                            )}

                            {/* Overlay Side Arrows for fast document flipping */}
                            {currentSlideImages.length > 1 && (
                              <>
                                <IconButton
                                  aria-label="Previous Page"
                                  icon={<FiChevronLeft boxSize={6} />}
                                  position="absolute"
                                  left={{ base: 2, md: 4 }}
                                  top="50%"
                                  transform="translateY(-50%)"
                                  colorScheme="teal"
                                  variant="solid"
                                  borderRadius="full"
                                  size="md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToPage(activePageIndex - 1);
                                  }}
                                  isDisabled={activePageIndex === 0}
                                  boxShadow="lg"
                                />
                                <IconButton
                                  aria-label="Next Page"
                                  icon={<FiChevronRight boxSize={6} />}
                                  position="absolute"
                                  right={{ base: 2, md: 4 }}
                                  top="50%"
                                  transform="translateY(-50%)"
                                  colorScheme="teal"
                                  variant="solid"
                                  borderRadius="full"
                                  size="md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToPage(activePageIndex + 1);
                                  }}
                                  isDisabled={activePageIndex === currentSlideImages.length - 1}
                                  boxShadow="lg"
                                />
                              </>
                            )}
                          </Box>

                          {/* 3. THUMBNAIL PAGE STRIP (When a chapter has multiple pages) */}
                          {currentSlideImages.length > 1 && (
                            <Box pt={4}>
                              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">
                                Chapter Pages ({currentSlideImages.length})
                              </Text>
                              <Flex gap={3} overflowX="auto" pb={2} css={{ "&::-webkit-scrollbar": { height: "6px" } }}>
                                {currentSlideImages.map((img, idx) => {
                                  const isActive = idx === activePageIndex;
                                  return (
                                    <Box
                                      key={`thumb-${idx}`}
                                      w="110px"
                                      h="140px"
                                      borderRadius="md"
                                      overflow="hidden"
                                      borderWidth="2px"
                                      borderColor={isActive ? "teal.500" : "gray.200"}
                                      boxShadow={isActive ? "md" : "none"}
                                      cursor="pointer"
                                      flexShrink={0}
                                      onClick={() => goToPage(idx)}
                                      bg="gray.100"
                                      position="relative"
                                      transition="all 0.2s"
                                      _hover={{ borderColor: "teal.400", transform: "translateY(-2px)" }}
                                    >
                                      <Image src={img} alt={`Thumb ${idx + 1}`} w="full" h="full" objectFit="cover" />
                                      <Flex
                                        position="absolute"
                                        bottom={0}
                                        left={0}
                                        right={0}
                                        bg={isActive ? "teal.600" : "blackAlpha.700"}
                                        color="white"
                                        justify="center"
                                        py={0.5}
                                        fontSize="2xs"
                                        fontWeight="bold"
                                      >
                                        Page {idx + 1}
                                      </Flex>
                                    </Box>
                                  );
                                })}
                              </Flex>
                            </Box>
                          )}

                          {/* 4. CHAPTER INSTRUCTIONS & NOTES (Clean full-width box below the reader) */}
                          {currentSlide.body && (
                            <Box mt={6} p={5} bg="teal.50" borderRadius="xl" borderWidth="1px" borderColor="teal.100">
                              <HStack spacing={2} mb={2}>
                                <Icon as={FiFileText} color="teal.700" />
                                <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
                                  Chapter Instructions & Notes
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="teal.900" lineHeight="tall" whiteSpace="pre-wrap">
                                {currentSlide.body}
                              </Text>
                            </Box>
                          )}

                          {/* Chapter Bottom Navigation Footer */}
                          <Divider my={6} />
                          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                            <Button
                              onClick={() => goToSlide(currentSlideIndex - 1)}
                              isDisabled={currentSlideIndex === 0}
                              leftIcon={<FiChevronLeft />}
                              variant="outline"
                              size="md"
                            >
                              Previous Chapter
                            </Button>

                            <HStack spacing={2}>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">
                                Chapter {currentSlideIndex + 1} of {slides.length}
                              </Text>
                            </HStack>

                            {currentSlideIndex < slides.length - 1 ? (
                              <Button
                                colorScheme="teal"
                                onClick={() => goToSlide(currentSlideIndex + 1)}
                                rightIcon={<FiChevronRight />}
                                size="md"
                              >
                                Next Chapter
                              </Button>
                            ) : (
                              <Button
                                colorScheme="teal"
                                bg="#004D40"
                                _hover={{ bg: "#00796B" }}
                                onClick={() => scrollToReader(1)}
                                rightIcon={<FiAward />}
                                size="md"
                              >
                                Proceed to Quiz & Assessment
                              </Button>
                            )}
                          </Flex>
                        </Card>
                      </VStack>
                    )}
                  </TabPanel>

                  {/* TAB 2: KNOWLEDGE QUIZ & ASSESSMENT */}
                  <TabPanel p={0}>
                    <Card bg="white" borderRadius="2xl" p={{ base: 4, md: 8 }} boxShadow="sm" borderWidth="1px" borderColor="gray.100">
                      {quizQuestions.length === 0 || !currentQuestion ? (
                        <VStack spacing={3} py={8} textAlign="center">
                          <Icon as={FiHelpCircle} boxSize={10} color="gray.400" />
                          <Heading size="sm" color="gray.700">No Assessment Published</Heading>
                          <Text fontSize="sm" color="gray.500">
                            There are currently no quiz questions published for this course.
                          </Text>
                        </VStack>
                      ) : (
                        <VStack align="stretch" spacing={6}>
                          <Flex
                            justify="space-between"
                            align={{ base: "start", sm: "center" }}
                            direction={{ base: "column", sm: "row" }}
                            gap={3}
                            pb={4}
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                          >
                            <Box>
                              <Heading size="md" color="gray.800" mb={1}>
                                Knowledge Verification Quiz
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                Pass Requirement: {requiredScore} of {quizQuestions.length} correct ({course.passPercentage}%)
                              </Text>
                            </Box>

                            <Badge colorScheme="purple" px={3} py={1} borderRadius="full" fontSize="xs">
                              {answeredCount} / {quizQuestions.length} Answered
                            </Badge>
                          </Flex>

                          <Progress
                            value={(answeredCount / quizQuestions.length) * 100}
                            borderRadius="full"
                            colorScheme="teal"
                            size="sm"
                          />

                          {isQuizComplete ? (
                            <VStack
                              align="center"
                              spacing={4}
                              p={8}
                              borderRadius="2xl"
                              bg={didPass ? "green.50" : "red.50"}
                              borderWidth="1px"
                              borderColor={didPass ? "green.200" : "red.200"}
                              textAlign="center"
                            >
                              <Icon
                                as={didPass ? FiAward : FiHelpCircle}
                                boxSize={14}
                                color={didPass ? "green.500" : "red.500"}
                              />
                              <Heading size="lg" color={didPass ? "green.800" : "red.800"}>
                                {didPass ? "Congratulations! You Passed" : "Assessment Incomplete"}
                              </Heading>
                              <Text fontSize="md" fontWeight="bold" color={didPass ? "green.700" : "red.700"}>
                                Final Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                              </Text>
                              <Text fontSize="sm" color={didPass ? "green.800" : "red.800"} maxW="md">
                                {didPass
                                  ? "You have successfully demonstrated comprehension of TradeEthiopia HR policies and onboarding guidelines."
                                  : `You scored below the ${course.passPercentage}% requirement. Please review the handbook chapters and try again.`}
                              </Text>
                              <HStack spacing={4} pt={2}>
                                <Button colorScheme="teal" onClick={resetQuiz} leftIcon={<FiRefreshCw />}>
                                  Retake Assessment
                                </Button>
                                <Button variant="outline" colorScheme="teal" onClick={() => scrollToReader(0)}>
                                  Review Chapters
                                </Button>
                              </HStack>
                            </VStack>
                          ) : (
                            <VStack align="stretch" spacing={5}>
                              <Box bg="gray.50" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                                <HStack spacing={2} mb={2}>
                                  <Badge colorScheme="teal" fontSize="2xs">
                                    QUESTION {currentQuestionIndex + 1} OF {quizQuestions.length}
                                  </Badge>
                                </HStack>
                                <Text fontSize="md" fontWeight="bold" color="gray.800">
                                  {currentQuestion.question}
                                </Text>
                              </Box>

                              <VStack align="stretch" spacing={3}>
                                {currentQuestion.options.map((option, optIdx) => {
                                  const isAnswered = selectedForCurrentQuestion !== null && selectedForCurrentQuestion !== undefined;
                                  const isCorrect = optIdx === currentQuestion.correctAnswer;
                                  const isChosen = optIdx === selectedForCurrentQuestion;

                                  let bg = "white";
                                  let borderColor = "gray.200";
                                  let color = "gray.800";

                                  if (isAnswered) {
                                    if (isCorrect) {
                                      bg = "green.50";
                                      borderColor = "green.500";
                                      color = "green.900";
                                    } else if (isChosen) {
                                      bg = "red.50";
                                      borderColor = "red.500";
                                      color = "red.900";
                                    }
                                  }

                                  return (
                                    <Button
                                      key={`option-${optIdx}`}
                                      onClick={() => submitAnswer(optIdx)}
                                      isDisabled={isAnswered}
                                      bg={bg}
                                      borderWidth="2px"
                                      borderColor={borderColor}
                                      color={color}
                                      _hover={!isAnswered ? { borderColor: "teal.400", bg: "teal.50" } : {}}
                                      justifyContent="start"
                                      py={4}
                                      px={5}
                                      height="auto"
                                      whiteSpace="normal"
                                      textAlign="left"
                                      borderRadius="xl"
                                      transition="all 0.2s"
                                    >
                                      <HStack spacing={3} align="start" w="full">
                                        <Flex
                                          w="24px"
                                          h="24px"
                                          borderRadius="full"
                                          bg={isAnswered && isCorrect ? "green.500" : isAnswered && isChosen ? "red.500" : "gray.100"}
                                          color={isAnswered && (isCorrect || isChosen) ? "white" : "gray.700"}
                                          fontSize="xs"
                                          fontWeight="bold"
                                          align="center"
                                          justify="center"
                                          flexShrink={0}
                                        >
                                          {String.fromCharCode(65 + optIdx)}
                                        </Flex>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {option}
                                        </Text>
                                      </HStack>
                                    </Button>
                                  );
                                })}
                              </VStack>

                              {selectedForCurrentQuestion !== null && selectedForCurrentQuestion !== undefined && (
                                <Box
                                  p={4}
                                  borderRadius="lg"
                                  bg={selectedForCurrentQuestion === currentQuestion.correctAnswer ? "green.50" : "red.50"}
                                  borderWidth="1px"
                                  borderColor={selectedForCurrentQuestion === currentQuestion.correctAnswer ? "green.200" : "red.200"}
                                >
                                  <Text
                                    fontWeight="bold"
                                    fontSize="sm"
                                    color={selectedForCurrentQuestion === currentQuestion.correctAnswer ? "green.700" : "red.700"}
                                  >
                                    {selectedForCurrentQuestion === currentQuestion.correctAnswer
                                      ? "✓ Correct Answer!"
                                      : "✗ Incorrect Answer"}
                                  </Text>
                                  {currentQuestion.explanation && (
                                    <Text mt={1} fontSize="xs" color="gray.600">
                                      {currentQuestion.explanation}
                                    </Text>
                                  )}
                                </Box>
                              )}

                              <Flex justify="space-between" align="center" pt={4}>
                                <Button
                                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                  isDisabled={currentQuestionIndex === 0}
                                  leftIcon={<FiChevronLeft />}
                                  variant="outline"
                                >
                                  Previous
                                </Button>
                                <Button
                                  colorScheme="teal"
                                  onClick={() =>
                                    setCurrentQuestionIndex(Math.min(quizQuestions.length - 1, currentQuestionIndex + 1))
                                  }
                                  isDisabled={currentQuestionIndex === quizQuestions.length - 1}
                                  rightIcon={<FiChevronRight />}
                                >
                                  Next Question
                                </Button>
                              </Flex>
                            </VStack>
                          )}
                        </VStack>
                      )}
                    </Card>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </VStack>
        )}

        {/* FULLSCREEN IMAGE / SLIDE MODAL VIEWER */}
        <Modal isOpen={isImagePreviewOpen} onClose={closeImagePreview} size="6xl" isCentered>
          <ModalOverlay bg="blackAlpha.850" backdropFilter="blur(6px)" />
          <ModalContent bg="gray.900" color="white" borderRadius="2xl" overflow="hidden">
            <ModalCloseButton color="white" zIndex={10} />
            <ModalBody p={{ base: 4, md: 6 }}>
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center" pr={10}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="teal.300" textTransform="uppercase" fontWeight="bold">
                      {course.title} • Chapter {currentSlideIndex + 1}
                    </Text>
                    <Heading size="sm" color="white">
                      {currentSlide?.title || "Slide Preview"}
                    </Heading>
                  </VStack>
                  {currentSlideImages.length > 1 && (
                    <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
                      Page {previewImageIndex + 1} of {currentSlideImages.length}
                    </Badge>
                  )}
                </Flex>

                <Box
                  minH={{ base: "300px", md: "75vh" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="blackAlpha.600"
                  borderRadius="xl"
                  overflow="hidden"
                  p={2}
                >
                  {currentSlideImages[previewImageIndex] ? (
                    <Image
                      src={currentSlideImages[previewImageIndex]}
                      alt="Full Slide Preview"
                      maxH="75vh"
                      maxW="100%"
                      objectFit="contain"
                    />
                  ) : (
                    <Text color="gray.400">Slide visual unavailable.</Text>
                  )}
                </Box>

                {currentSlideImages.length > 1 && (
                  <HStack justify="space-between">
                    <IconButton
                      aria-label="Previous slide image"
                      icon={<FiChevronLeft boxSize={6} />}
                      onClick={() => goToPreviewImage(-1)}
                      colorScheme="teal"
                      variant="solid"
                    />
                    <IconButton
                      aria-label="Next slide image"
                      icon={<FiChevronRight boxSize={6} />}
                      onClick={() => goToPreviewImage(1)}
                      colorScheme="teal"
                      variant="solid"
                    />
                  </HStack>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default HRTrainingPage;
