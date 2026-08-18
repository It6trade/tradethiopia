import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  NumberInput,
  NumberInputField,
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
  Textarea,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiUsers,
  FiZoomIn
} from "react-icons/fi";
import UploadTrainingMaterial from "../components/customer/UploadTrainingMaterial";
import AdminTrainingMaterialList from "../components/customer/AdminTrainingMaterialList";
import {
  createCourse,
  fetchCourses,
  updateCourse,
  uploadCourseSlideImage
} from "../services/api";

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const isHrOwnedCourse = (course = {}) => {
  const department = String(course?.department || "").trim().toLowerCase();
  const category = String(course?.category || "").trim().toLowerCase();
  const name = String(course?.name || course?.title || "").trim().toLowerCase();

  return (
    department === "human resources" ||
    department === "hr" ||
    category === "human resources" ||
    category === "hr" ||
    name.includes("human resources") ||
    name.includes("hr ") ||
    name.includes("onboarding") ||
    name.includes("handbook")
  );
};

const defaultCourse = {
  name: "Human Resources Handbook",
  overview: "Welcome to the TradeEthiopia central employee development repository. Explore guided chapters, verify company guidelines, and master essential workflows.",
  passPercentage: 75,
  slides: [
    {
      title: "Organization Overview",
      body: "Overview of company history, vision, executive leadership, and workplace standards.",
      imageUrl: "",
      imageUrls: [],
      materialUrl: "",
      slideNumber: 1
    }
  ],
  quizQuestions: [
    {
      question: "What is the primary requirement for all HR onboarding candidates?",
      options: [
        "Complete all 13 chapters and score at least 75%",
        "Skip straight to production",
        "Only read Chapter 1",
        "Submit without review"
      ],
      correctAnswer: 0,
      explanation: "All employees must complete every chapter and pass the quiz with at least 75%."
    }
  ],
  status: "published"
};

const asText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const asArray = (value, fallback = []) => {
  return Array.isArray(value) ? value : fallback;
};

const createSlide = (index = 0) => ({
  title: `Chapter ${index + 1}`,
  body: "",
  imageUrl: "",
  imageUrls: [],
  materialUrl: "",
  slideNumber: index + 1
});

const createQuestion = (index = 0) => ({
  question: `Question ${index + 1}`,
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswer: 0,
  explanation: ""
});

const normalizeForEditor = (course = {}) => {
  const slides = asArray(course.slides, []).map((slide, index) => {
    const rawList = [slide?.imageUrl, ...asArray(slide?.imageUrls, [])];
    const cleanList = rawList
      .map((item) => asText(item, ""))
      .filter(Boolean)
      .filter((val, i, self) => self.indexOf(val) === i);

    return {
      title: slide?.title || `Chapter ${index + 1}`,
      body: slide?.body || "",
      imageUrl: cleanList[0] || "",
      imageUrls: cleanList,
      materialUrl: slide?.materialUrl || "",
      slideNumber: Number(slide?.slideNumber) || index + 1
    };
  });

  const quizQuestions = asArray(course.quizQuestions, []).map((question, index) => {
    const options = asArray(question?.options, []).filter(Boolean);
    const safeOptions = options.length >= 2 ? options : ["Option 1", "Option 2"];
    const safeCorrect = Number.isFinite(Number(question?.correctAnswer))
      ? Math.max(0, Math.min(safeOptions.length - 1, Number(question.correctAnswer)))
      : 0;

    return {
      question: question?.question || `Question ${index + 1}`,
      options: safeOptions,
      correctAnswer: safeCorrect,
      explanation: question?.explanation || ""
    };
  });

  return {
    name: course?.name || defaultCourse.name,
    overview: course?.overview || course?.description || defaultCourse.overview,
    passPercentage:
      Number.isFinite(Number(course?.passPercentage)) && Number(course?.passPercentage) >= 0
        ? Math.min(100, Number(course.passPercentage))
        : defaultCourse.passPercentage,
    slides: slides.length ? slides : [createSlide(0)],
    quizQuestions: quizQuestions.length ? quizQuestions : [createQuestion(0)],
    status: course?.status || "draft",
    publishedAt: course?.publishedAt || null
  };
};

const AdminTrainingUpload = () => {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bannerBg = useColorModeValue(
    "linear-gradient(135deg, #f8fafc 0%, #f0fdfa 50%, #e6fffa 100%)",
    "linear-gradient(135deg, #0f172a 0%, #042f2e 50%, #0d3b37 100%)"
  );
  const openBookBg = useColorModeValue("#fffdf9", "#1e293b");

  const [refreshMaterials, setRefreshMaterials] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [course, setCourse] = useState(defaultCourse);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState(1);
  const [selectedEditorChapter, setSelectedEditorChapter] = useState(0);
  const [selectedEditorQuestion, setSelectedEditorQuestion] = useState(0);
  const [newImageUrlInput, setNewImageUrlInput] = useState("");

  const summary = useMemo(
    () => ({
      slides: course.slides.length,
      questions: course.quizQuestions.length,
      status: course.status === "published" ? "Published" : "Draft"
    }),
    [course]
  );

  const publishedCourse = useMemo(
    () => courses.find((savedCourse) => savedCourse.status === "published") || null,
    [courses]
  );

  const loadCourses = async (preferredId = "") => {
    setLoading(true);
    try {
      const response = await fetchCourses();
      const realCourses = (Array.isArray(response) ? response : [])
        .filter(isPersistedCourse)
        .filter(isHrOwnedCourse);
      setCourses(realCourses);

      const fallbackCourse = realCourses[0] || null;
      const nextSelectedId = preferredId || selectedCourseId || fallbackCourse?._id || "";
      setSelectedCourseId(nextSelectedId);

      const selectedCourse =
        realCourses.find((item) => item._id === nextSelectedId) || fallbackCourse;

      setCourse(selectedCourse ? normalizeForEditor(selectedCourse) : defaultCourse);
    } catch (error) {
      toast({
        title: "Unable to load HR courses",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
      setCourses([]);
      setCourse(defaultCourse);
      setSelectedCourseId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const updateCourseField = (field, value) => {
    setCourse((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSlideField = (index, field, value) => {
    setCourse((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides[index] = {
        ...nextSlides[index],
        [field]: value
      };
      return {
        ...prev,
        slides: nextSlides
      };
    });
  };

  const addSlideImageUrl = (slideIndex, urlToAdd) => {
    const cleanUrl = asText(urlToAdd, "");
    if (!cleanUrl) return;

    setCourse((prev) => {
      const nextSlides = [...prev.slides];
      const currentList = asArray(nextSlides[slideIndex]?.imageUrls, []);
      if (!currentList.includes(cleanUrl)) {
        nextSlides[slideIndex] = {
          ...nextSlides[slideIndex],
          imageUrls: [...currentList, cleanUrl],
          imageUrl: nextSlides[slideIndex]?.imageUrl || cleanUrl
        };
      }
      return {
        ...prev,
        slides: nextSlides
      };
    });
    setNewImageUrlInput("");
  };

  const removeSlideImage = (slideIndex, imageIndex) => {
    setCourse((prev) => {
      const nextSlides = [...prev.slides];
      const currentList = asArray(nextSlides[slideIndex]?.imageUrls, []);
      const updatedList = currentList.filter((_, idx) => idx !== imageIndex);

      nextSlides[slideIndex] = {
        ...nextSlides[slideIndex],
        imageUrls: updatedList,
        imageUrl: updatedList[0] || ""
      };

      return {
        ...prev,
        slides: nextSlides
      };
    });
  };

  const addSlide = () => {
    setCourse((prev) => {
      const newSlideIdx = prev.slides.length;
      setSelectedEditorChapter(newSlideIdx);
      return {
        ...prev,
        slides: [...prev.slides, createSlide(newSlideIdx)]
      };
    });
  };

  const removeSlide = (index) => {
    if (course.slides.length <= 1) {
      toast({
        title: "Course must have at least one chapter",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setCourse((prev) => {
      const filtered = prev.slides.filter((_, i) => i !== index);
      const reindexed = filtered.map((slide, i) => ({
        ...slide,
        slideNumber: i + 1
      }));
      return {
        ...prev,
        slides: reindexed
      };
    });
    setSelectedEditorChapter((prev) => Math.max(0, Math.min(prev, course.slides.length - 2)));
  };

  const updateQuestionField = (index, field, value) => {
    setCourse((prev) => {
      const nextQuestions = [...prev.quizQuestions];
      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value
      };
      return {
        ...prev,
        quizQuestions: nextQuestions
      };
    });
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setCourse((prev) => {
      const nextQuestions = [...prev.quizQuestions];
      const nextOptions = [...nextQuestions[questionIndex].options];
      nextOptions[optionIndex] = value;
      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        options: nextOptions
      };
      return {
        ...prev,
        quizQuestions: nextQuestions
      };
    });
  };

  const addOption = (questionIndex) => {
    setCourse((prev) => {
      const nextQuestions = [...prev.quizQuestions];
      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        options: [
          ...nextQuestions[questionIndex].options,
          `Option ${String.fromCharCode(65 + nextQuestions[questionIndex].options.length)}`
        ]
      };
      return {
        ...prev,
        quizQuestions: nextQuestions
      };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setCourse((prev) => {
      const nextQuestions = [...prev.quizQuestions];
      const nextOptions = nextQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
      if (nextOptions.length < 2) return prev;

      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        options: nextOptions,
        correctAnswer: Math.min(nextQuestions[questionIndex].correctAnswer, nextOptions.length - 1)
      };
      return {
        ...prev,
        quizQuestions: nextQuestions
      };
    });
  };

  const addQuestion = () => {
    setCourse((prev) => {
      const nextIndex = prev.quizQuestions.length;
      setSelectedEditorQuestion(nextIndex);
      return {
        ...prev,
        quizQuestions: [...prev.quizQuestions, createQuestion(nextIndex)]
      };
    });
  };

  const removeQuestion = (index) => {
    if (course.quizQuestions.length <= 1) {
      toast({
        title: "Course must have at least one quiz question",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((_, i) => i !== index)
    }));
    setSelectedEditorQuestion((prev) => Math.max(0, Math.min(prev, course.quizQuestions.length - 2)));
  };

  const handleSlideImageUpload = async (slideIndex, files) => {
    if (!files || files.length === 0) return;
    setUploadingSlideIndex(slideIndex);

    try {
      const uploads = Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("image", file);
        return uploadCourseSlideImage(formData);
      });
      const results = await Promise.all(uploads);
      const newUrls = results.map((res) => res?.imageUrl || res?.url).filter(Boolean);

      if (newUrls.length === 0) throw new Error("No image URLs returned from upload.");

      setCourse((prev) => {
        const nextSlides = [...prev.slides];
        const existingUrls = asArray(nextSlides[slideIndex]?.imageUrls, []);
        const combined = [...existingUrls, ...newUrls].filter((v, i, self) => self.indexOf(v) === i);

        nextSlides[slideIndex] = {
          ...nextSlides[slideIndex],
          imageUrls: combined,
          imageUrl: nextSlides[slideIndex]?.imageUrl || combined[0] || ""
        };

        return {
          ...prev,
          slides: nextSlides
        };
      });

      toast({
        title: "Slide images uploaded",
        description: `Added ${newUrls.length} image(s) to Chapter ${slideIndex + 1}.`,
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: "Image upload failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const handleCreateNewCourse = () => {
    setSelectedCourseId("");
    setCourse({
      name: "New Human Resources Course",
      overview: "Enter course overview, target audience, and training outcomes.",
      passPercentage: 75,
      slides: [createSlide(0)],
      quizQuestions: [createQuestion(0)],
      status: "draft"
    });
    setSelectedEditorChapter(0);
    setSelectedEditorQuestion(0);
    setActiveMainTab(1);
    toast({
      title: "New course template ready",
      description: "Customize your chapters and quizzes, then click Publish.",
      status: "info",
      duration: 3000,
      isClosable: true
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        name: course.name,
        overview: course.overview,
        passPercentage: course.passPercentage,
        department: "Human Resources",
        slides: course.slides,
        quizQuestions: course.quizQuestions,
        status: "draft"
      };

      if (selectedCourseId) {
        await updateCourse(selectedCourseId, payload);
        toast({
          title: "Draft saved successfully",
          status: "success",
          duration: 3000,
          isClosable: true
        });
        await loadCourses(selectedCourseId);
      } else {
        const created = await createCourse(payload);
        toast({
          title: "New course draft created",
          status: "success",
          duration: 3000,
          isClosable: true
        });
        await loadCourses(created._id);
      }
    } catch (error) {
      toast({
        title: "Failed to save draft",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const payload = {
        name: course.name,
        overview: course.overview,
        passPercentage: course.passPercentage,
        department: "Human Resources",
        slides: course.slides,
        quizQuestions: course.quizQuestions,
        status: "published"
      };

      if (selectedCourseId) {
        await updateCourse(selectedCourseId, payload);
      } else {
        const created = await createCourse(payload);
        setSelectedCourseId(created._id);
      }

      toast({
        title: "Course Published to Onboarding Portal!",
        description: "Trainees can now view and take exams on this handbook.",
        status: "success",
        duration: 4500,
        isClosable: true
      });

      await loadCourses(selectedCourseId);
    } catch (error) {
      toast({
        title: "Failed to publish course",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 4500,
        isClosable: true
      });
    } finally {
      setPublishing(false);
    }
  };

  const daysOfWeek = [
    { day: "Sun", date: "11", active: false },
    { day: "Mon", date: "12", active: false },
    { day: "Tue", date: "13", active: true },
    { day: "Wed", date: "14", active: false },
    { day: "Thu", date: "15", active: false },
    { day: "Fri", date: "16", active: false },
    { day: "Sat", date: "17", active: false }
  ];

  const currentChapter = course.slides[selectedEditorChapter] || course.slides[0];
  const currentQuestion = course.quizQuestions[selectedEditorQuestion] || course.quizQuestions[0];

  return (
    <Box maxW="1500px" mx="auto" pb={12}>
      {/* TOP HEADER */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", lg: "center" }}
        direction={{ base: "column", lg: "row" }}
        gap={4}
        mb={6}
        pb={4}
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          <Flex
            w="48px"
            h="48px"
            borderRadius="2xl"
            bg="teal.600"
            color="white"
            align="center"
            justify="center"
            boxShadow="0 8px 16px -4px rgba(19, 78, 74, 0.4)"
          >
            <Icon as={FiBookOpen} boxSize={6} />
          </Flex>
          <Box>
            <Heading size="md" color="gray.800" fontWeight="800">
              Training & Publication Studio
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Create, organize, and publish official company onboarding handbooks & exams.
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <Button
            as={RouterLink}
            to="/hr-training"
            variant="outline"
            colorScheme="teal"
            size="sm"
            borderRadius="xl"
            leftIcon={<Icon as={FiExternalLink} />}
            isDisabled={loading || !publishedCourse}
          >
            Open Reader
          </Button>
          <Button
            variant="outline"
            size="sm"
            borderRadius="xl"
            leftIcon={<Icon as={FiRefreshCw} />}
            onClick={() => loadCourses(selectedCourseId)}
            isDisabled={loading || saving || publishing}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            borderRadius="xl"
            leftIcon={<Icon as={FiPlus} />}
            onClick={handleCreateNewCourse}
            isDisabled={loading || saving || publishing}
          >
            New Course Book
          </Button>
          <Button
            colorScheme="blue"
            size="sm"
            borderRadius="xl"
            leftIcon={<Icon as={FiSave} />}
            onClick={handleSaveDraft}
            isLoading={saving}
            isDisabled={loading || publishing}
          >
            Save Draft
          </Button>
          <Button
            colorScheme="teal"
            bg="#004D40"
            _hover={{ bg: "#00796B" }}
            size="sm"
            borderRadius="xl"
            leftIcon={<Icon as={FiCheckCircle} />}
            onClick={handlePublish}
            isLoading={publishing}
            isDisabled={loading || saving}
          >
            Publish Course
          </Button>
        </HStack>
      </Flex>

      {/* TOP HERO BANNER */}
      <Box
        borderRadius="3xl"
        p={{ base: 6, md: 8 }}
        bg={bannerBg}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 20px 40px -15px rgba(0, 0, 0, 0.05)"
        mb={8}
        position="relative"
        overflow="hidden"
      >
        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={8} align="center">
          <Box gridColumn={{ base: "span 1", lg: "span 4" }} textAlign={{ base: "center", lg: "left" }}>
            <Badge
              colorScheme="teal"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="xs"
              fontWeight="800"
              letterSpacing="wider"
              mb={3}
            >
              HR KNOWLEDGE BASE
            </Badge>
            <Heading size="xl" fontWeight="900" color="gray.800" lineHeight="1.2" mb={3}>
              Training Studio & <br />
              <Text as="span" color="teal.600">
                Course Manager
              </Text>
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={6} lineHeight="1.6">
              Organize company training handbooks, manage chapter slide decks, and set pass thresholds for team onboarding.
            </Text>

            <HStack spacing={3} justify={{ base: "center", lg: "flex-start" }} mb={5}>
              <Button
                as={RouterLink}
                to="/hr-training"
                size="md"
                colorScheme="teal"
                borderRadius="xl"
                rightIcon={<Icon as={FiArrowRight} />}
                boxShadow="0 8px 20px -4px rgba(13, 148, 136, 0.4)"
                fontWeight="700"
                isDisabled={!publishedCourse}
              >
                Open Trainee Reader ↗
              </Button>
              <Button
                size="md"
                variant="outline"
                borderRadius="xl"
                onClick={() => setActiveMainTab(1)}
              >
                Edit Chapters ({course.slides.length})
              </Button>
            </HStack>

            <HStack spacing={4} justify={{ base: "center", lg: "flex-start" }} fontSize="xs" color="gray.500">
              <HStack spacing={1.5}>
                <Icon as={FiLayers} color="teal.500" />
                <Text fontWeight="600">{summary.slides} Chapters</Text>
              </HStack>
              <HStack spacing={1.5}>
                <Icon as={FiHelpCircle} color="teal.500" />
                <Text fontWeight="600">{summary.questions} Questions</Text>
              </HStack>
              <HStack spacing={1.5}>
                <Icon as={FiAward} color="teal.500" />
                <Text fontWeight="600">{course.passPercentage}% Pass Mark</Text>
              </HStack>
            </HStack>
          </Box>

          <Box
            gridColumn={{ base: "span 1", lg: "span 5" }}
            display="flex"
            justifyContent="center"
            position="relative"
            py={2}
          >
            <Box
              position="relative"
              w={{ base: "100%", sm: "360px", md: "400px" }}
              h="260px"
              borderRadius="2xl"
              boxShadow="0 25px 50px -12px rgba(15, 23, 42, 0.25)"
              display="flex"
              bg={openBookBg}
              overflow="hidden"
              border="2px solid rgba(0,0,0,0.06)"
              transform="perspective(1000px) rotateX(3deg)"
              transition="transform 0.3s ease"
              _hover={{ transform: "perspective(1000px) rotateX(0deg) scale(1.02)" }}
            >
              <Box
                flex="1"
                p={4}
                borderRight="2px solid rgba(0,0,0,0.1)"
                bgGradient="linear(to-r, rgba(0,0,0,0.02), rgba(0,0,0,0.08))"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Box>
                  <Text fontSize="9px" fontWeight="800" color="teal.700" textTransform="uppercase" letterSpacing="wider">
                    CHAPTER 01 · OVERVIEW
                  </Text>
                  <Text fontSize="xs" fontWeight="800" color="gray.800" mt={1} noOfLines={2}>
                    {course.slides?.[0]?.title || "Organization Overview"}
                  </Text>
                  <Text fontSize="10px" color="gray.600" mt={2} lineHeight="1.4" noOfLines={4}>
                    {course.slides?.[0]?.body ||
                      course.overview ||
                      "Welcome to our organization. This handbook details our core values, operational policies, workplace guidelines, and standards of excellence."}
                  </Text>
                </Box>
                <HStack justify="space-between" fontSize="9px" color="gray.400" pt={2} borderTop="1px solid rgba(0,0,0,0.06)">
                  <Text>Page 01</Text>
                  <Text>Trade Ethiopia HR</Text>
                </HStack>
              </Box>

              <Box
                position="absolute"
                left="50%"
                top="0"
                bottom="0"
                w="12px"
                transform="translateX(-50%)"
                bgGradient="linear(to-r, rgba(0,0,0,0.2), rgba(255,255,255,0.4), rgba(0,0,0,0.2))"
                zIndex="2"
                boxShadow="0 0 8px rgba(0,0,0,0.15)"
              />
              <Box
                position="absolute"
                left="50%"
                top="0"
                w="16px"
                h="70px"
                transform="translateX(-50%)"
                bg="teal.600"
                zIndex="3"
                borderRadius="0 0 4px 4px"
                boxShadow="0 4px 8px rgba(0,0,0,0.2)"
              />

              <Box
                flex="1"
                p={4}
                bgGradient="linear(to-l, rgba(0,0,0,0.02), rgba(0,0,0,0.08))"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                position="relative"
              >
                <Box>
                  <Text fontSize="9px" fontWeight="800" color="teal.700" textTransform="uppercase" letterSpacing="wider">
                    ACTIVE COURSE BOOK
                  </Text>
                  <Box
                    mt={1.5}
                    h="105px"
                    borderRadius="lg"
                    bgGradient="linear(to-br, teal.700, #042f2e)"
                    color="white"
                    p={2.5}
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    textAlign="center"
                    boxShadow="inset 0 0 10px rgba(0,0,0,0.3)"
                  >
                    <Icon as={FiAward} boxSize={5} color="teal.300" mb={1} />
                    <Text fontSize="11px" fontWeight="800" noOfLines={2}>
                      {course.name || "Human Resources Handbook"}
                    </Text>
                    <Text fontSize="9px" opacity={0.8}>
                      Pass Score: {course.passPercentage}%
                    </Text>
                  </Box>
                </Box>
                <HStack justify="space-between" fontSize="9px" color="gray.400" pt={2} borderTop="1px solid rgba(0,0,0,0.06)">
                  <Text>Live Edition</Text>
                  <Text>{course.status === "published" ? "✓ Live" : "Draft"}</Text>
                </HStack>
              </Box>
            </Box>
          </Box>

          <Box gridColumn={{ base: "span 1", lg: "span 3" }}>
            <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
              <CardBody p={5}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" fontWeight="700" color="teal.600" textTransform="uppercase">
                    Active Book
                  </Text>
                  <Badge colorScheme={course.status === "published" ? "green" : "orange"} borderRadius="full" px={2}>
                    {summary.status}
                  </Badge>
                </HStack>
                <Heading size="sm" fontWeight="800" color="gray.800" mb={1} noOfLines={2}>
                  {course.name || "HR Employee Handbook"}
                </Heading>
                <Text fontSize="xs" color="teal.700" fontWeight="600" mb={3}>
                  {summary.slides} Chapters · {summary.questions} Questions
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={3} mb={4}>
                  {course.overview || "General onboarding, code of conduct, and organizational guidelines."}
                </Text>
                <Divider mb={3} />
                <Flex justify="space-between" align="center" fontSize="xs">
                  <Text color="gray.400">Department</Text>
                  <Text fontWeight="700" color="gray.700">
                    Human Resources
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center" fontSize="xs" mt={1}>
                  <Text color="gray.400">Passing Score</Text>
                  <Text fontWeight="700" color="teal.600">
                    {course.passPercentage}%
                  </Text>
                </Flex>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Box>

      {/* MAIN WORKSPACE TABS */}
      <Tabs
        index={activeMainTab}
        onChange={(index) => setActiveMainTab(index)}
        variant="soft-rounded"
        colorScheme="teal"
      >
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={6}
        >
          <TabList bg={useColorModeValue("gray.100", "gray.800")} p={1.5} borderRadius="2xl">
            <Tab borderRadius="xl" fontSize="xs" fontWeight="700" px={4} py={2}>
              <HStack spacing={2}>
                <Icon as={FiBook} />
                <Text>Training Books & Library</Text>
              </HStack>
            </Tab>
            <Tab borderRadius="xl" fontSize="xs" fontWeight="700" px={4} py={2}>
              <HStack spacing={2}>
                <Icon as={FiLayers} />
                <Text>Course Chapters ({course.slides.length})</Text>
              </HStack>
            </Tab>
            <Tab borderRadius="xl" fontSize="xs" fontWeight="700" px={4} py={2}>
              <HStack spacing={2}>
                <Icon as={FiHelpCircle} />
                <Text>Quiz & Assessment ({course.quizQuestions.length})</Text>
              </HStack>
            </Tab>
          </TabList>

          <HStack spacing={2} w={{ base: "100%", md: "auto" }}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" whiteSpace="nowrap">
              Active Course:
            </Text>
            <Select
              size="sm"
              borderRadius="xl"
              maxW={{ base: "100%", md: "260px" }}
              value={selectedCourseId}
              onChange={(e) => loadCourses(e.target.value)}
              isDisabled={loading}
              bg={cardBg}
            >
              {courses.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name || item.title || "Untitled Course"} ({item.status || "draft"})
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        <TabPanels>
          {/* TAB 1: LIBRARY & SCHEDULE */}
          <TabPanel px={0} pt={2}>
            <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={8}>
              <Box gridColumn={{ base: "span 1", xl: "span 8" }}>
                <UploadTrainingMaterial onUpload={() => setRefreshMaterials((prev) => !prev)} />
                <AdminTrainingMaterialList key={String(refreshMaterials)} />
              </Box>

              <Box gridColumn={{ base: "span 1", xl: "span 4" }}>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
                    <CardBody p={5}>
                      <Flex justify="space-between" align="center" mb={4}>
                        <HStack spacing={2}>
                          <Icon as={FiCalendar} color="teal.600" />
                          <Heading size="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider" color="gray.800">
                            Training Schedule
                          </Heading>
                        </HStack>
                        <HStack spacing={1}>
                          <IconButton aria-label="Previous" icon={<FiChevronLeft />} size="xs" variant="ghost" />
                          <IconButton aria-label="Next" icon={<FiChevronRight />} size="xs" variant="ghost" />
                        </HStack>
                      </Flex>

                      <HStack spacing={2} justify="space-between" mb={5}>
                        {daysOfWeek.map((d) => (
                          <VStack
                            key={d.day}
                            spacing={1}
                            p={2}
                            borderRadius="xl"
                            bg={d.active ? "teal.600" : useColorModeValue("gray.50", "gray.700")}
                            color={d.active ? "white" : "gray.600"}
                            flex={1}
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ bg: d.active ? "teal.700" : "teal.50" }}
                          >
                            <Text fontSize="10px" opacity={0.8} fontWeight="600">
                              {d.day}
                            </Text>
                            <Text fontSize="xs" fontWeight="800">
                              {d.date}
                            </Text>
                          </VStack>
                        ))}
                      </HStack>

                      <Box p={3.5} bg={useColorModeValue("teal.50", "teal.900")} borderRadius="xl" border="1px solid" borderColor="teal.200">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" fontWeight="800" color="teal.800">
                            HR Compliance & Code
                          </Text>
                          <Badge colorScheme="teal" fontSize="9px">
                            TODAY
                          </Badge>
                        </HStack>
                        <Text fontSize="11px" color="teal.700" mb={2}>
                          Mandatory reading for all new employees before taking the assessment.
                        </Text>
                        <Progress value={65} size="xs" colorScheme="teal" borderRadius="full" />
                      </Box>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
                    <CardBody p={5}>
                      <Flex justify="space-between" align="center" mb={4}>
                        <HStack spacing={2}>
                          <Icon as={FiUsers} color="teal.600" />
                          <Heading size="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider" color="gray.800">
                            Reader Activity
                          </Heading>
                        </HStack>
                        <Badge colorScheme="purple" borderRadius="full" fontSize="10px">
                          LIVE
                        </Badge>
                      </Flex>

                      <VStack spacing={3.5} align="stretch">
                        <HStack spacing={3} align="flex-start">
                          <Avatar size="sm" name="Roberto Jordan" bg="teal.600" color="white" />
                          <Box flex={1}>
                            <Text fontSize="xs" fontWeight="700" color="gray.800">
                              Roberto Jordan
                            </Text>
                            <Text fontSize="11px" color="gray.500" lineHeight="1.4">
                              Completed "Chapter Five: Workplace Health & Safety Protocols".
                            </Text>
                            <Text fontSize="10px" color="teal.600" fontWeight="600" mt={0.5}>
                              ✓ Passed Quiz with 100% · 2 min ago
                            </Text>
                          </Box>
                        </HStack>

                        <Divider />

                        <HStack spacing={3} align="flex-start">
                          <Avatar size="sm" name="Anna Henry" bg="blue.600" color="white" />
                          <Box flex={1}>
                            <Text fontSize="xs" fontWeight="700" color="gray.800">
                              Anna Henry
                            </Text>
                            <Text fontSize="11px" color="gray.500" lineHeight="1.4">
                              Started reading "Customer Service Communication Masterclass".
                            </Text>
                            <Text fontSize="10px" color="gray.400" mt={0.5}>
                              Chapter 2 in progress · 15 min ago
                            </Text>
                          </Box>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* TAB 2: CLEAN, PROFESSIONAL MASTER-DETAIL CHAPTER STUDIO */}
          <TabPanel px={0} pt={2}>
            <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} mb={6} boxShadow="sm">
              <CardBody p={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="xs" fontWeight="800" textTransform="uppercase" color="teal.600" letterSpacing="wider">
                    Course Book Overview & Settings
                  </Heading>
                  <Badge colorScheme={course.status === "published" ? "green" : "orange"} px={2} py={0.5} borderRadius="full">
                    {course.status.toUpperCase()}
                  </Badge>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700">
                      Course Book Title
                    </FormLabel>
                    <Input
                      value={course.name}
                      onChange={(e) => updateCourseField("name", e.target.value)}
                      placeholder="e.g. Employee Handbook & Code of Conduct"
                      borderRadius="xl"
                      fontSize="sm"
                      focusBorderColor="teal.500"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700">
                      Assessment Pass Percentage (%)
                    </FormLabel>
                    <NumberInput
                      min={0}
                      max={100}
                      value={course.passPercentage}
                      onChange={(_, valueAsNumber) =>
                        updateCourseField("passPercentage", Number.isFinite(valueAsNumber) ? valueAsNumber : 75)
                      }
                      borderRadius="xl"
                      focusBorderColor="teal.500"
                    >
                      <NumberInputField borderRadius="xl" fontSize="sm" />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700">
                    Course Synopsis & Objective
                  </FormLabel>
                  <Textarea
                    value={course.overview}
                    onChange={(e) => updateCourseField("overview", e.target.value)}
                    placeholder="Describe the target audience, purpose, and key takeaways..."
                    borderRadius="xl"
                    fontSize="sm"
                    rows={2}
                    focusBorderColor="teal.500"
                  />
                </FormControl>
              </CardBody>
            </Card>

            {/* MASTER-DETAIL CHAPTER MANAGER */}
            <Grid templateColumns={{ base: "1fr", lg: "340px 1fr" }} gap={6} align="start">
              {/* Left Column: Chapters Navigation List */}
              <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} p={4} boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={borderColor}>
                  <VStack align="start" spacing={0}>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" letterSpacing="wider">
                      Chapters List
                    </Heading>
                    <Text fontSize="2xs" color="teal.600" fontWeight="bold">
                      {course.slides.length} Total Chapters
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    colorScheme="teal"
                    leftIcon={<FiPlus />}
                    borderRadius="lg"
                    onClick={addSlide}
                  >
                    Add Chapter
                  </Button>
                </Flex>

                <VStack spacing={1.5} align="stretch" maxH="680px" overflowY="auto" pr={1}>
                  {course.slides.map((slide, sIdx) => {
                    const isSelected = sIdx === selectedEditorChapter;
                    const imgCount = asArray(slide.imageUrls, []).length;

                    return (
                      <Flex
                        key={`chapter-item-${sIdx}`}
                        p={3}
                        borderRadius="xl"
                        cursor="pointer"
                        bg={isSelected ? "teal.50" : "transparent"}
                        borderWidth="1px"
                        borderColor={isSelected ? "teal.300" : "transparent"}
                        _hover={{ bg: isSelected ? "teal.50" : "gray.50" }}
                        transition="all 0.2s"
                        align="center"
                        justify="space-between"
                        onClick={() => setSelectedEditorChapter(sIdx)}
                      >
                        <HStack spacing={3} overflow="hidden">
                          <Flex
                            w="28px"
                            h="28px"
                            borderRadius="lg"
                            bg={isSelected ? "teal.600" : "gray.100"}
                            color={isSelected ? "white" : "gray.700"}
                            fontSize="xs"
                            fontWeight="bold"
                            align="center"
                            justify="center"
                            flexShrink={0}
                          >
                            {sIdx + 1}
                          </Flex>
                          <VStack align="start" spacing={0} overflow="hidden">
                            <Text
                              fontSize="xs"
                              fontWeight={isSelected ? "bold" : "medium"}
                              color={isSelected ? "teal.900" : "gray.800"}
                              noOfLines={1}
                            >
                              {slide.title || `Chapter ${sIdx + 1}`}
                            </Text>
                            <Text fontSize="2xs" color="gray.400">
                              {imgCount} slide image{imgCount === 1 ? "" : "s"}
                            </Text>
                          </VStack>
                        </HStack>

                        <IconButton
                          aria-label={`Remove chapter ${sIdx + 1}`}
                          icon={<FiTrash2 />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSlide(sIdx);
                          }}
                        />
                      </Flex>
                    );
                  })}
                </VStack>
              </Card>

              {/* Right Column: Active Chapter Editor */}
              {currentChapter && (
                <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} p={6} boxShadow="sm">
                  <Flex justify="space-between" align="center" pb={4} mb={5} borderBottom="1px solid" borderColor={borderColor}>
                    <HStack spacing={3}>
                      <Badge colorScheme="teal" px={2.5} py={1} borderRadius="lg" fontSize="xs" fontWeight="bold">
                        CHAPTER {selectedEditorChapter + 1} OF {course.slides.length}
                      </Badge>
                      <Heading size="sm" color="gray.800">
                        {currentChapter.title || `Chapter ${selectedEditorChapter + 1}`}
                      </Heading>
                    </HStack>

                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Previous chapter"
                        icon={<FiChevronLeft />}
                        size="sm"
                        isDisabled={selectedEditorChapter === 0}
                        onClick={() => setSelectedEditorChapter((p) => p - 1)}
                      />
                      <IconButton
                        aria-label="Next chapter"
                        icon={<FiChevronRight />}
                        size="sm"
                        colorScheme="teal"
                        isDisabled={selectedEditorChapter === course.slides.length - 1}
                        onClick={() => setSelectedEditorChapter((p) => p + 1)}
                      />
                    </HStack>
                  </Flex>

                  <VStack spacing={5} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Chapter Title
                      </FormLabel>
                      <Input
                        value={currentChapter.title}
                        onChange={(e) => updateSlideField(selectedEditorChapter, "title", e.target.value)}
                        placeholder="e.g. Workplace Health & Safety Standards"
                        borderRadius="xl"
                        fontSize="sm"
                        fontWeight="semibold"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    <Box p={5} bg={useColorModeValue("gray.50", "gray.900")} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                        <VStack align="start" spacing={0}>
                          <HStack spacing={2}>
                            <Icon as={FiImage} color="teal.600" />
                            <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase">
                              Chapter Slide Pages ({asArray(currentChapter.imageUrls, []).length})
                            </Text>
                          </HStack>
                          <Text fontSize="2xs" color="gray.400">
                            Upload document pages, slide deck screenshots, or handbook illustrations.
                          </Text>
                        </VStack>

                        <HStack spacing={2}>
                          <Button
                            as="label"
                            htmlFor={`slide-upload-input-${selectedEditorChapter}`}
                            size="xs"
                            colorScheme="teal"
                            leftIcon={<FiUploadCloud />}
                            cursor="pointer"
                            isLoading={uploadingSlideIndex === selectedEditorChapter}
                          >
                            Upload Files
                            <input
                              id={`slide-upload-input-${selectedEditorChapter}`}
                              type="file"
                              accept="image/*"
                              multiple
                              style={{ display: "none" }}
                              onChange={(e) => {
                                handleSlideImageUpload(selectedEditorChapter, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </Button>
                        </HStack>
                      </Flex>

                      {asArray(currentChapter.imageUrls, []).length > 0 ? (
                        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3} mb={4}>
                          {asArray(currentChapter.imageUrls, []).map((url, imgIdx) => (
                            <Box
                              key={`img-card-${imgIdx}`}
                              borderRadius="lg"
                              overflow="hidden"
                              border="1px solid"
                              borderColor="gray.200"
                              bg="white"
                              position="relative"
                              h="140px"
                              boxShadow="sm"
                              _hover={{ shadow: "md" }}
                            >
                              <Image src={url} alt={`Slide ${imgIdx + 1}`} w="full" h="full" objectFit="contain" bg="gray.100" />
                              <Badge
                                position="absolute"
                                top={1.5}
                                left={1.5}
                                bg="blackAlpha.700"
                                color="white"
                                fontSize="2xs"
                                px={1.5}
                                py={0.5}
                                borderRadius="md"
                              >
                                Page {imgIdx + 1}
                              </Badge>

                              <IconButton
                                aria-label={`Delete page ${imgIdx + 1}`}
                                icon={<FiTrash2 />}
                                size="xs"
                                colorScheme="red"
                                variant="solid"
                                position="absolute"
                                top={1.5}
                                right={1.5}
                                onClick={() => removeSlideImage(selectedEditorChapter, imgIdx)}
                              />
                            </Box>
                          ))}
                        </SimpleGrid>
                      ) : (
                        <Box
                          p={6}
                          borderRadius="lg"
                          border="2px dashed"
                          borderColor="gray.300"
                          textAlign="center"
                          mb={4}
                          bg="white"
                        >
                          <Icon as={FiImage} boxSize={8} color="gray.300" mb={2} />
                          <Text fontSize="xs" color="gray.500" fontWeight="medium">
                            No slide images uploaded for this chapter yet.
                          </Text>
                          <Text fontSize="2xs" color="gray.400">
                            Click 'Upload Files' above or add an image URL below.
                          </Text>
                        </Box>
                      )}

                      <HStack spacing={2}>
                        <Input
                          size="sm"
                          bg="white"
                          borderRadius="lg"
                          placeholder="Paste image URL (e.g. https://...)"
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSlideImageUrl(selectedEditorChapter, newImageUrlInput);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="outline"
                          onClick={() => addSlideImageUrl(selectedEditorChapter, newImageUrlInput)}
                          isDisabled={!newImageUrlInput.trim()}
                        >
                          Add URL
                        </Button>
                      </HStack>
                    </Box>

                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Chapter Reading Content & Policy Guidelines
                      </FormLabel>
                      <Textarea
                        value={currentChapter.body}
                        minH="120px"
                        onChange={(e) => updateSlideField(selectedEditorChapter, "body", e.target.value)}
                        placeholder="Write detailed reading material, key instructions, and policies for this chapter..."
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700">
                        External Reference / Resource URL (Optional)
                      </FormLabel>
                      <Input
                        value={currentChapter.materialUrl}
                        onChange={(e) => updateSlideField(selectedEditorChapter, "materialUrl", e.target.value)}
                        placeholder="https://tradethiopia.com/docs/handbook-reference.pdf"
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    <Divider my={2} />
                    <Flex justify="space-between" align="center">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FiChevronLeft />}
                        isDisabled={selectedEditorChapter === 0}
                        onClick={() => setSelectedEditorChapter((p) => p - 1)}
                      >
                        Previous Chapter
                      </Button>

                      {selectedEditorChapter < course.slides.length - 1 ? (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          rightIcon={<FiChevronRight />}
                          onClick={() => setSelectedEditorChapter((p) => p + 1)}
                        >
                          Next Chapter
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          bg="#004D40"
                          _hover={{ bg: "#00796B" }}
                          leftIcon={<FiPlus />}
                          onClick={addSlide}
                        >
                          Add Another Chapter
                        </Button>
                      )}
                    </Flex>
                  </VStack>
                </Card>
              )}
            </Grid>
          </TabPanel>

          {/* TAB 3: CLEAN, PROFESSIONAL MASTER-DETAIL QUIZ & ASSESSMENT STUDIO */}
          <TabPanel px={0} pt={2}>
            <VStack spacing={6} align="stretch">
              {/* Question Navigator Ribbon */}
              <Card bg={cardBg} borderRadius="2xl" p={3} border="1px solid" borderColor={borderColor} boxShadow="sm">
                <Flex align="center" gap={2} overflowX="auto" py={1} px={1} css={{ "&::-webkit-scrollbar": { height: "4px" } }}>
                  <HStack spacing={2} flexShrink={0} mr={2}>
                    <Icon as={FiHelpCircle} color="teal.600" />
                    <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
                      Questions ({course.quizQuestions.length}):
                    </Text>
                  </HStack>
                  {course.quizQuestions.map((quiz, qIdx) => {
                    const isSelected = qIdx === selectedEditorQuestion;
                    const isConfigured = quiz.question && quiz.options.length >= 2;

                    return (
                      <Button
                        key={`q-nav-${qIdx}`}
                        size="sm"
                        variant={isSelected ? "solid" : "outline"}
                        colorScheme={isSelected ? "teal" : isConfigured ? "gray" : "orange"}
                        onClick={() => setSelectedEditorQuestion(qIdx)}
                        borderRadius="full"
                        px={3.5}
                        py={1.5}
                        flexShrink={0}
                        fontSize="xs"
                        fontWeight={isSelected ? "bold" : "medium"}
                      >
                        Q{qIdx + 1}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    colorScheme="teal"
                    variant="ghost"
                    borderRadius="full"
                    leftIcon={<FiPlus />}
                    onClick={addQuestion}
                    flexShrink={0}
                    fontSize="xs"
                  >
                    Add Question
                  </Button>
                </Flex>
              </Card>

              {/* Active Question Editor Card */}
              {currentQuestion && (
                <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} p={6} boxShadow="sm">
                  <Flex justify="space-between" align="center" pb={4} mb={5} borderBottom="1px solid" borderColor={borderColor}>
                    <HStack spacing={3}>
                      <Badge colorScheme="purple" px={3} py={1} borderRadius="lg" fontSize="xs" fontWeight="bold">
                        QUESTION {selectedEditorQuestion + 1} OF {course.quizQuestions.length}
                      </Badge>
                      <Heading size="sm" color="gray.800">
                        Question Configuration & Key
                      </Heading>
                    </HStack>

                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Previous question"
                        icon={<FiChevronLeft />}
                        size="sm"
                        isDisabled={selectedEditorQuestion === 0}
                        onClick={() => setSelectedEditorQuestion((p) => p - 1)}
                      />
                      <IconButton
                        aria-label="Next question"
                        icon={<FiChevronRight />}
                        size="sm"
                        colorScheme="teal"
                        isDisabled={selectedEditorQuestion === course.quizQuestions.length - 1}
                        onClick={() => setSelectedEditorQuestion((p) => p + 1)}
                      />
                      <IconButton
                        aria-label="Delete question"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeQuestion(selectedEditorQuestion)}
                      />
                    </HStack>
                  </Flex>

                  <VStack spacing={5} align="stretch">
                    {/* Question Statement */}
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Question Statement
                      </FormLabel>
                      <Input
                        value={currentQuestion.question}
                        onChange={(e) => updateQuestionField(selectedEditorQuestion, "question", e.target.value)}
                        placeholder="e.g. What is the primary objective of TradeEthiopia Group?"
                        borderRadius="xl"
                        fontSize="sm"
                        fontWeight="semibold"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    {/* Options with direct 1-click correct key selection */}
                    <Box p={5} bg={useColorModeValue("gray.50", "gray.900")} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase">
                            Multiple Choice Options ({currentQuestion.options.length})
                          </Text>
                          <Text fontSize="2xs" color="gray.500">
                            Click 'Correct Key' on any option to designate the correct answer.
                          </Text>
                        </VStack>

                        <Button
                          size="xs"
                          colorScheme="teal"
                          variant="outline"
                          leftIcon={<FiPlus />}
                          onClick={() => addOption(selectedEditorQuestion)}
                        >
                          Add Option
                        </Button>
                      </Flex>

                      <VStack spacing={3} align="stretch">
                        {currentQuestion.options.map((option, optIdx) => {
                          const isCorrect = currentQuestion.correctAnswer === optIdx;

                          return (
                            <Flex
                              key={`q-${selectedEditorQuestion}-opt-${optIdx}`}
                              p={2.5}
                              borderRadius="xl"
                              bg={isCorrect ? "green.50" : "white"}
                              borderWidth="2px"
                              borderColor={isCorrect ? "green.400" : "gray.200"}
                              align="center"
                              gap={3}
                              transition="all 0.2s"
                            >
                              <Tooltip label={isCorrect ? "Currently selected as correct answer" : "Click to mark this option as correct"}>
                                <Button
                                  size="xs"
                                  colorScheme={isCorrect ? "green" : "gray"}
                                  variant={isCorrect ? "solid" : "outline"}
                                  borderRadius="lg"
                                  minW="80px"
                                  onClick={() => updateQuestionField(selectedEditorQuestion, "correctAnswer", optIdx)}
                                  leftIcon={isCorrect ? <FiCheck /> : undefined}
                                >
                                  {isCorrect ? "Correct" : `Key (${String.fromCharCode(65 + optIdx)})`}
                                </Button>
                              </Tooltip>

                              <Input
                                size="sm"
                                borderRadius="lg"
                                bg="transparent"
                                border="none"
                                fontWeight={isCorrect ? "bold" : "normal"}
                                color={isCorrect ? "green.900" : "gray.800"}
                                value={option}
                                onChange={(e) => updateQuestionOption(selectedEditorQuestion, optIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                                _focus={{ bg: "white", border: "1px solid teal" }}
                              />

                              {currentQuestion.options.length > 2 && (
                                <IconButton
                                  aria-label="Remove option"
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => removeOption(selectedEditorQuestion, optIdx)}
                                />
                              )}
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Box>

                    {/* Answer Explanation */}
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Answer Explanation (Displayed to trainee upon completion)
                      </FormLabel>
                      <Input
                        value={currentQuestion.explanation}
                        onChange={(e) => updateQuestionField(selectedEditorQuestion, "explanation", e.target.value)}
                        placeholder="Explain why this answer is correct and provide handbook references..."
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    {/* Bottom Question Controls */}
                    <Divider my={2} />
                    <Flex justify="space-between" align="center">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FiChevronLeft />}
                        isDisabled={selectedEditorQuestion === 0}
                        onClick={() => setSelectedEditorQuestion((p) => p - 1)}
                      >
                        Previous Question
                      </Button>

                      <Text fontSize="xs" fontWeight="bold" color="gray.500">
                        Question {selectedEditorQuestion + 1} of {course.quizQuestions.length}
                      </Text>

                      {selectedEditorQuestion < course.quizQuestions.length - 1 ? (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          rightIcon={<FiChevronRight />}
                          onClick={() => setSelectedEditorQuestion((p) => p + 1)}
                        >
                          Next Question
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          colorScheme="teal"
                          bg="#004D40"
                          _hover={{ bg: "#00796B" }}
                          leftIcon={<FiPlus />}
                          onClick={addQuestion}
                        >
                          Add Another Question
                        </Button>
                      )}
                    </Flex>
                  </VStack>
                </Card>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminTrainingUpload;
