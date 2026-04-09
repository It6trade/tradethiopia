import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Image,
  IconButton,
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
  Text,
  VStack
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { fetchCourses } from "../services/api";

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const fallbackCourse = {
  id: "hr-fallback",
  title: "HR Training",
  overview: "No published HR training course found yet.",
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

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
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

    loadCourses();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  const course = selectedCourse || fallbackCourse;
  const heroCourse = selectedCourse || fallbackCourse;
  const slides = course.slides || [];
  const quizQuestions = course.quizQuestions || [];
  const currentSlide = slides[currentSlideIndex] || null;
  const currentSlideImages = currentSlide?.imageUrls?.filter(Boolean) || [];
  const selectedPreviewImage = currentSlideImages[selectedImageIndex] || "";
  const currentQuestion = quizQuestions[currentQuestionIndex] || null;
  const selectedForCurrentQuestion = selectedAnswers[currentQuestionIndex];

  useEffect(() => {
    if (selectedCourseId && !courses.some((courseItem) => courseItem.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (slides.length > 0) {
      setCurrentSlideIndex(0);
      setVisitedSlides(new Set([0]));
    } else {
      setCurrentSlideIndex(0);
      setVisitedSlides(new Set());
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(quizQuestions.length).fill(null));
    setIsQuizComplete(false);
    setIsImagePreviewOpen(false);
    setSelectedImageIndex(0);
  }, [course.id, slides.length, quizQuestions.length]);

  const answeredCount = selectedAnswers.filter((value) => value !== null).length;
  const completedSlides = Math.min(visitedSlides.size, slides.length);
  const totalSteps = slides.length + quizQuestions.length;
  const completedSteps = completedSlides + answeredCount;
  const overallCompletion =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

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
    if (slides.length === 0) return;
    const nextIndex = clamp(index, 0, slides.length - 1);
    setCurrentSlideIndex(nextIndex);
    setVisitedSlides((prev) => {
      const next = new Set(prev);
      next.add(nextIndex);
      return next;
    });
    setIsImagePreviewOpen(false);
    setSelectedImageIndex(0);
  };

  const submitAnswer = (optionIndex) => {
    if (!currentQuestion) return;
    if (selectedForCurrentQuestion !== null) return;

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

  const openImagePreview = (imageIndex) => {
    if (!currentSlideImages.length) return;
    setSelectedImageIndex(clamp(imageIndex, 0, currentSlideImages.length - 1));
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
  };

  const goToPreviewImage = (direction) => {
    if (currentSlideImages.length <= 1) return;

    setSelectedImageIndex((prev) => {
      const nextIndex = prev + direction;
      if (nextIndex < 0) return currentSlideImages.length - 1;
      if (nextIndex >= currentSlideImages.length) return 0;
      return nextIndex;
    });
  };

  return (
    <Box bg="gray.50" minH="100vh" py={4} px={{ base: 2, md: 4 }}>
      <Container maxW="container.xl">
        <Box
          bgGradient="linear(to-r, teal.500, blue.500)"
          color="white"
          borderRadius="xl"
          p={{ base: 5, md: 7 }}
          mb={6}
          boxShadow="lg"
        >
          <Flex
            justify="space-between"
            align={{ base: "flex-start", lg: "center" }}
            gap={5}
            direction={{ base: "column", lg: "row" }}
          >
            <Box maxW="780px">
              <Heading size="lg" mb={2}>
                {heroCourse.title}
              </Heading>
              <Text fontSize="sm" opacity={0.95}>
                {heroCourse.overview}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                <Box bg="whiteAlpha.250" borderRadius="md" p={3}>
                  <Text fontWeight="semibold">Chapters</Text>
                  <Text fontSize="sm">
                    Published HR course chapters with guided reading, navigation, and expandable images.
                  </Text>
                </Box>
                <Box bg="whiteAlpha.250" borderRadius="md" p={3}>
                  <Text fontWeight="semibold">Quiz</Text>
                  <Text fontSize="sm">
                    Interactive quiz with instant feedback and a pass mark of {course.passPercentage}%.
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            <VStack
              bg="white"
              color="gray.800"
              p={4}
              borderRadius="lg"
              minW={{ base: "100%", lg: "220px" }}
              spacing={1}
              align="center"
            >
              <CircularProgress value={overallCompletion} color="teal.400" size="115px" thickness="10px">
                <CircularProgressLabel fontWeight="bold">{overallCompletion}%</CircularProgressLabel>
              </CircularProgress>
              <Text fontWeight="semibold">Overall Completion</Text>
              <Text fontSize="sm" color="gray.600">
                {completedSteps} / {totalSteps} steps
              </Text>
            </VStack>
          </Flex>
        </Box>

        <Box bg="white" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 6 }} mb={6}>
          <Heading size="sm" mb={3}>
            Interactive HR Training
          </Heading>
          {loading ? (
            <HStack spacing={2}>
              <Spinner size="sm" color="teal.500" />
              <Text fontSize="sm" color="gray.600">
                Loading published HR training...
              </Text>
            </HStack>
          ) : error ? (
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          ) : courses.length === 0 ? (
            <Text fontSize="sm" color="gray.600">
              No published interactive HR training courses found.
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              <Badge colorScheme="green" alignSelf="start">
                Published By HR
              </Badge>
              <Select
                value={selectedCourse.id}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.map((courseItem) => (
                  <option key={courseItem.id} value={courseItem.id}>
                    {courseItem.title}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color="gray.600">
                {courses.length} published HR course{courses.length === 1 ? "" : "s"} available.
              </Text>
            </VStack>
          )}
        </Box>

        {!loading && !error && courses.length > 0 && (
          <Tabs colorScheme="teal" variant="enclosed">
            <TabList>
              <Tab>Chapters ({slides.length})</Tab>
              <Tab>Quiz ({quizQuestions.length})</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={4}>
                <Box bg="white" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 6 }}>
                  {slides.length === 0 || !currentSlide ? (
                    <Text color="gray.600">No chapters published yet.</Text>
                  ) : (
                    <>
                      <Flex
                        justify="space-between"
                        align={{ base: "start", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                        mb={4}
                      >
                        <Heading size="md">{currentSlide.title}</Heading>
                        <Badge colorScheme="blue" px={2} py={1} borderRadius="md">
                          Chapter {currentSlideIndex + 1} / {slides.length}
                        </Badge>
                      </Flex>

                      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                        <Box>
                          <Box
                            borderWidth="2px"
                            borderStyle="dashed"
                            borderColor="gray.300"
                            borderRadius="lg"
                            minH="230px"
                            p={4}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="gray.50"
                          >
                            {currentSlideImages.length ? (
                              <SimpleGrid
                                columns={{ base: 1, md: currentSlideImages.length > 1 ? 2 : 1 }}
                                spacing={3}
                                w="full"
                              >
                                {currentSlideImages.map((imageUrl, imageIndex) => (
                                  <Box
                                    key={`${currentSlide.id || currentSlideIndex}-image-${imageIndex}`}
                                    borderRadius="md"
                                    overflow="hidden"
                                    bg="white"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    cursor="zoom-in"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openImagePreview(imageIndex)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openImagePreview(imageIndex);
                                      }
                                    }}
                                  >
                                    <Image
                                      src={imageUrl}
                                      alt={`${currentSlide.title} visual ${imageIndex + 1}`}
                                      w="full"
                                      maxH="210px"
                                      objectFit="contain"
                                      bg="gray.100"
                                    />
                                  </Box>
                                ))}
                              </SimpleGrid>
                            ) : (
                              <Text color="gray.600">No image attached.</Text>
                            )}
                          </Box>
                          {currentSlideImages.length > 0 && (
                            <Text mt={2} fontSize="xs" color="gray.500">
                              Click any image to open it in full size.
                            </Text>
                          )}

                          {currentSlide.materialUrl && (
                            <Link href={currentSlide.materialUrl} isExternal>
                              <Button mt={3} size="sm" colorScheme="teal" variant="outline">
                                Open Chapter Material
                              </Button>
                            </Link>
                          )}
                        </Box>

                        <VStack align="stretch" spacing={3}>
                          <Text fontSize="xs" color="gray.500">
                            Chapter content
                          </Text>
                          <Box bg="teal.50" borderRadius="md" p={3}>
                            <Text fontSize="sm" color="teal.800">
                              {currentSlide.body || "No content provided."}
                            </Text>
                          </Box>
                        </VStack>
                      </SimpleGrid>

                      <Divider my={5} />

                      <HStack spacing={2} mb={4} flexWrap="wrap">
                        {slides.map((slide, index) => (
                          <Button
                            key={slide.id || `hr-slide-${index}`}
                            size="sm"
                            variant={index === currentSlideIndex ? "solid" : "outline"}
                            colorScheme={visitedSlides.has(index) ? "teal" : "gray"}
                            onClick={() => goToSlide(index)}
                          >
                            {index + 1}. {slide.title || "Untitled"}
                          </Button>
                        ))}
                      </HStack>

                      <HStack justify="space-between">
                        <Button onClick={() => goToSlide(currentSlideIndex - 1)} isDisabled={currentSlideIndex === 0}>
                          Previous Chapter
                        </Button>
                        <Button
                          colorScheme="teal"
                          onClick={() => goToSlide(currentSlideIndex + 1)}
                          isDisabled={currentSlideIndex === slides.length - 1}
                        >
                          Next Chapter
                        </Button>
                      </HStack>
                    </>
                  )}
                </Box>
              </TabPanel>

              <TabPanel px={0} pt={4}>
                <Box bg="white" borderRadius="xl" boxShadow="sm" p={{ base: 4, md: 6 }}>
                  {quizQuestions.length === 0 || !currentQuestion ? (
                    <Text color="gray.600">No quiz published yet.</Text>
                  ) : (
                    <>
                      <Flex
                        justify="space-between"
                        align={{ base: "start", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                        mb={3}
                      >
                        <Heading size="md">Knowledge Check Quiz</Heading>
                        <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                          {answeredCount} / {quizQuestions.length} answered
                        </Badge>
                      </Flex>

                      <Progress
                        value={(answeredCount / quizQuestions.length) * 100}
                        borderRadius="full"
                        mb={5}
                        colorScheme="teal"
                      />

                      {isQuizComplete ? (
                        <VStack align="stretch" spacing={4}>
                          <Box bg={didPass ? "green.50" : "red.50"} borderRadius="lg" p={5}>
                            <Heading size="md" color={didPass ? "green.700" : "red.700"} mb={2}>
                              Final Score: {quizScore} / {quizQuestions.length}
                            </Heading>
                            <Text color={didPass ? "green.800" : "red.800"}>
                              Pass mark: {requiredScore} / {quizQuestions.length} ({course.passPercentage}%)
                            </Text>
                            <Text color={didPass ? "green.800" : "red.800"} mt={1}>
                              {didPass
                                ? "Pass: You completed the HR training quiz successfully."
                                : "Fail: Review the chapters and retake the quiz."}
                            </Text>
                          </Box>
                          <Button alignSelf="start" colorScheme="teal" onClick={resetQuiz}>
                            Retake Quiz
                          </Button>
                        </VStack>
                      ) : (
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <Text fontWeight="semibold" mb={3}>
                              Q{currentQuestionIndex + 1}. {currentQuestion.question}
                            </Text>

                            <VStack align="stretch" spacing={2}>
                              {currentQuestion.options.map((option, optionIndex) => {
                                const isAnswered = selectedForCurrentQuestion !== null;
                                const isCorrectOption = optionIndex === currentQuestion.correctAnswer;
                                const isChosenOption = optionIndex === selectedForCurrentQuestion;

                                let colorScheme = "gray";
                                let variant = "outline";

                                if (isAnswered) {
                                  if (isCorrectOption) {
                                    colorScheme = "green";
                                    variant = "solid";
                                  } else if (isChosenOption) {
                                    colorScheme = "red";
                                    variant = "solid";
                                  }
                                }

                                return (
                                  <Button
                                    key={`hr-option-${optionIndex}`}
                                    justifyContent="start"
                                    onClick={() => submitAnswer(optionIndex)}
                                    isDisabled={isAnswered}
                                    colorScheme={colorScheme}
                                    variant={variant}
                                    whiteSpace="normal"
                                    height="auto"
                                    py={3}
                                  >
                                    {option}
                                  </Button>
                                );
                              })}
                            </VStack>

                            {selectedForCurrentQuestion !== null && (
                              <Text
                                mt={3}
                                fontWeight="medium"
                                color={
                                  selectedForCurrentQuestion === currentQuestion.correctAnswer
                                    ? "green.600"
                                    : "red.600"
                                }
                              >
                                {selectedForCurrentQuestion === currentQuestion.correctAnswer
                                  ? "Correct answer."
                                  : "Wrong answer."}
                              </Text>
                            )}

                            {selectedForCurrentQuestion !== null && currentQuestion.explanation && (
                              <Text mt={2} fontSize="sm" color="gray.600">
                                {currentQuestion.explanation}
                              </Text>
                            )}
                          </Box>

                          <HStack justify="space-between">
                            <Button
                              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                              isDisabled={currentQuestionIndex === 0}
                            >
                              Previous Question
                            </Button>
                            <Button
                              colorScheme="teal"
                              onClick={() =>
                                setCurrentQuestionIndex(
                                  Math.min(quizQuestions.length - 1, currentQuestionIndex + 1)
                                )
                              }
                              isDisabled={currentQuestionIndex === quizQuestions.length - 1}
                            >
                              Next Question
                            </Button>
                          </HStack>
                        </VStack>
                      )}
                    </>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        <Modal isOpen={isImagePreviewOpen} onClose={closeImagePreview} size="6xl" isCentered>
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent bg="gray.900" color="white">
            <ModalCloseButton />
            <ModalBody p={{ base: 3, md: 5 }}>
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center" gap={3} pr={10}>
                  <Text fontWeight="semibold">
                    {currentSlide?.title || "Chapter image"}
                  </Text>
                  {currentSlideImages.length > 1 && (
                    <Badge colorScheme="teal">
                      Image {selectedImageIndex + 1} / {currentSlideImages.length}
                    </Badge>
                  )}
                </Flex>

                <Box
                  minH={{ base: "280px", md: "70vh" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="blackAlpha.400"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  {selectedPreviewImage ? (
                    <Image
                      src={selectedPreviewImage}
                      alt={`${currentSlide?.title || "Chapter"} full preview`}
                      maxH="70vh"
                      maxW="100%"
                      objectFit="contain"
                    />
                  ) : (
                    <Text color="gray.300">Image unavailable.</Text>
                  )}
                </Box>

                {currentSlideImages.length > 1 && (
                  <HStack justify="space-between">
                    <IconButton
                      aria-label="Previous image"
                      icon={<ChevronLeftIcon boxSize={6} />}
                      onClick={() => goToPreviewImage(-1)}
                    />
                    <IconButton
                      aria-label="Next image"
                      icon={<ChevronRightIcon boxSize={6} />}
                      onClick={() => goToPreviewImage(1)}
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
