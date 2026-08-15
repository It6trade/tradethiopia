import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
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
  Skeleton,
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
  FiClock,
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
  FiUsers
} from "react-icons/fi";
import UploadTrainingMaterial from "../components/customer/UploadTrainingMaterial";
import AdminTrainingMaterialList from "../components/customer/AdminTrainingMaterialList";
import {
  createCourse,
  fetchCourses,
  updateCourse,
  uploadCourseSlideImage
} from "../services/api";

const createSlide = (index = 0) => ({
  title: `Chapter ${index + 1}`,
  body: "",
  imageUrl: "",
  imageUrls: [],
  materialUrl: ""
});

const createQuestion = (index = 0) => ({
  question: `Question ${index + 1}`,
  options: ["Option 1", "Option 2"],
  correctAnswer: 0,
  explanation: ""
});

const defaultCourse = {
  name: "",
  overview: "",
  passPercentage: 75,
  slides: [createSlide(0)],
  quizQuestions: [createQuestion(0)],
  status: "draft",
  publishedAt: null
};

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");
const asArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const asText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const hrKeywordPattern = /\bhr\b|human resources|handbook/i;

const hasHrKeyword = (...values) =>
  hrKeywordPattern.test(
    values
      .map((value) => asText(value, ""))
      .filter(Boolean)
      .join(" ")
  );

const hasHrTag = (tags = []) =>
  (Array.isArray(tags) ? tags : []).some((tag) => hrKeywordPattern.test(asText(tag, "")));

const isHrOwnedCourse = (course = {}) =>
  hasHrKeyword(course?.name, course?.title, course?.overview, course?.description, course?.category) ||
  hasHrTag(course?.tags);

const normalizeSlideImageUrls = (slide = {}) => {
  const values = [asText(slide?.imageUrl, ""), ...asArray(slide?.imageUrls, [])]
    .map((value) => asText(value, ""))
    .filter(Boolean);

  return values.filter((value, index) => values.indexOf(value) === index);
};

const sanitizeImageUrls = (imageUrls = []) => {
  const values = asArray(imageUrls, [])
    .map((value) => asText(value, ""))
    .filter(Boolean);

  return values.filter((value, index) => values.indexOf(value) === index);
};

const getPrimaryImageUrl = (imageUrls = [], fallback = "") =>
  sanitizeImageUrls(imageUrls)[0] || asText(fallback, "");

const normalizeForEditor = (course = {}) => {
  const slides = asArray(course.slides, []).map((slide, index) => ({
    title: slide?.title || `Chapter ${index + 1}`,
    body: slide?.body || "",
    imageUrl: getPrimaryImageUrl(normalizeSlideImageUrls(slide), ""),
    imageUrls: normalizeSlideImageUrls(slide),
    materialUrl: slide?.materialUrl || ""
  }));

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
  const [activeMainTab, setActiveMainTab] = useState(0);

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

  const handleCreateNewCourse = () => {
    setSelectedCourseId("");
    setCourse(defaultCourse);
    setActiveMainTab(1);
  };

  const updateCourseField = (field, value) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const updateSlideField = (slideIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, [field]: value } : slide
      )
    }));
  };

  const updateSlideImages = (slideIndex, updater) => {
    setCourse((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, index) => {
        if (index !== slideIndex) return slide;

        const nextImageUrls =
          typeof updater === "function" ? updater(asArray(slide.imageUrls, [])) : updater;

        return {
          ...slide,
          imageUrls: asArray(nextImageUrls, []),
          imageUrl: getPrimaryImageUrl(asArray(nextImageUrls, []), "")
        };
      })
    }));
  };

  const addSlideImageUrlField = (slideIndex) => {
    updateSlideImages(slideIndex, (imageUrls) => [...imageUrls, ""]);
  };

  const updateSlideImageUrl = (slideIndex, imageIndex, value) => {
    updateSlideImages(slideIndex, (imageUrls) =>
      imageUrls.map((imageUrl, index) => (index === imageIndex ? value : imageUrl))
    );
  };

  const removeSlideImage = (slideIndex, imageIndex) => {
    updateSlideImages(slideIndex, (imageUrls) =>
      imageUrls.filter((_, index) => index !== imageIndex)
    );
  };

  const handleSlideImageUpload = async (slideIndex, files) => {
    const uploads = Array.from(files || []).filter(Boolean);
    if (!uploads.length) return;

    setUploadingSlideIndex(slideIndex);
    try {
      const uploadResponses = [];

      for (const file of uploads) {
        const formData = new FormData();
        formData.append("image", file);
        const response = await uploadCourseSlideImage(formData);
        const fileUrl = response?.imageUrl || "";

        if (!fileUrl) {
          throw new Error("Upload succeeded but no image URL was returned.");
        }

        uploadResponses.push(fileUrl);
      }

      updateSlideImages(slideIndex, (imageUrls) => [...imageUrls, ...uploadResponses]);
      toast({
        title: uploads.length > 1 ? "Images uploaded" : "Image uploaded",
        description: "Chapter images uploaded and linked.",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 4500,
        isClosable: true
      });
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const addSlide = () => {
    setCourse((prev) => ({
      ...prev,
      slides: [...prev.slides, createSlide(prev.slides.length)]
    }));
  };

  const removeSlide = (slideIndex) => {
    setCourse((prev) => {
      if (prev.slides.length <= 1) return prev;
      return {
        ...prev,
        slides: prev.slides.filter((_, index) => index !== slideIndex)
      };
    });
  };

  const updateQuestionField = (questionIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question
      )
    }));
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, idx) => (idx === optionIndex ? value : option))
        };
      })
    }));
  };

  const addQuestion = () => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: [...prev.quizQuestions, createQuestion(prev.quizQuestions.length)]
    }));
  };

  const removeQuestion = (questionIndex) => {
    setCourse((prev) => {
      if (prev.quizQuestions.length <= 1) return prev;
      return {
        ...prev,
        quizQuestions: prev.quizQuestions.filter((_, index) => index !== questionIndex)
      };
    });
  };

  const addOption = (questionIndex) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: [...question.options, `Option ${question.options.length + 1}`]
            }
          : question
      )
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) => {
        if (index !== questionIndex) return question;
        if (question.options.length <= 2) return question;

        const nextOptions = question.options.filter((_, idx) => idx !== optionIndex);
        let nextCorrect = question.correctAnswer;
        if (optionIndex === question.correctAnswer) {
          nextCorrect = 0;
        } else if (optionIndex < question.correctAnswer) {
          nextCorrect -= 1;
        }

        return {
          ...question,
          options: nextOptions,
          correctAnswer: Math.max(0, Math.min(nextOptions.length - 1, nextCorrect))
        };
      })
    }));
  };

  const createPayload = (status) => ({
    name: asText(course.name, "HR Employee Handbook & Course"),
    description: asText(course.overview, ""),
    overview: asText(course.overview, ""),
    category: "Human Resources",
    level: "Internal",
    tags: ["hr", "human-resources", "internal", "handbook"],
    passPercentage: Number.isFinite(Number(course.passPercentage))
      ? Number(course.passPercentage)
      : 75,
    status,
    draftSavedAt: status === "draft" ? new Date().toISOString() : undefined,
    publishedAt: status === "published" ? new Date().toISOString() : undefined,
    isActive: true,
    slides: course.slides.map((slide, index) => {
      const imageUrls = sanitizeImageUrls(slide.imageUrls);

      return {
        title: asText(slide.title, `Chapter ${index + 1}`),
        body: asText(slide.body, ""),
        imageUrl: imageUrls[0] || "",
        imageUrls,
        materialUrl: asText(slide.materialUrl, "")
      };
    }),
    quizQuestions: course.quizQuestions.map((question, index) => {
      const options = asArray(question.options, [])
        .map((option) => asText(option, ""))
        .filter(Boolean);
      const safeOptions = options.length >= 2 ? options : ["Option 1", "Option 2"];

      return {
        question: asText(question.question, `Question ${index + 1}`),
        options: safeOptions,
        correctAnswer: Number.isFinite(Number(question.correctAnswer))
          ? Math.max(0, Math.min(safeOptions.length - 1, Number(question.correctAnswer)))
          : 0,
        explanation: asText(question.explanation, "")
      };
    })
  });

  const saveSelectedCourse = async (status) => {
    if (!course.name.trim()) {
      toast({
        title: "Course title is required",
        description: "Please enter a course or handbook title before saving.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      throw new Error("Course title is required");
    }

    const payload = createPayload(status);

    if (selectedCourseId) {
      const response = await updateCourse(selectedCourseId, payload);
      const updatedCourse = response?.data || response;
      await loadCourses(selectedCourseId || updatedCourse?._id);
      return updatedCourse;
    }

    const response = await createCourse(payload);
    const createdCourse = response?.data || response;
    await loadCourses(createdCourse?._id);
    return createdCourse;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveSelectedCourse("draft");
      toast({
        title: "Course draft saved",
        description: "Your course chapters and questions were safely updated.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Save failed",
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
      await saveSelectedCourse("published");
      toast({
        title: "Course published",
        description: "HR training is now live for all employees to read.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Publish failed",
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

  return (
    <Box maxW="1500px" mx="auto" pb={12}>
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
              Organize company books, onboarding chapters, and multimedia training materials.
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
              Happy reading, <br />
              <Text as="span" color="teal.600">
                Team Member
              </Text>
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={6} lineHeight="1.6">
              Welcome to the central employee development repository. Explore guided chapters, verify company guidelines, and master essential workflows.
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
                Start reading ↗
              </Button>
              <Button
                size="md"
                variant="outline"
                borderRadius="xl"
                onClick={() => setActiveMainTab(1)}
              >
                Edit Chapters
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
              transform="perspective(1000px) rotateX(4deg)"
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
                    {course.slides?.[0]?.title || "Company Mission & Culture"}
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
                    PUBLISHED BOOK
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
                      {course.name || "Employee Handbook"}
                    </Text>
                    <Text fontSize="9px" opacity={0.8}>
                      Passing Score: {course.passPercentage}%
                    </Text>
                  </Box>
                </Box>
                <HStack justify="space-between" fontSize="9px" color="gray.400" pt={2} borderTop="1px solid rgba(0,0,0,0.06)">
                  <Text>Page 02</Text>
                  <Text>{course.status === "published" ? "Live Edition" : "Draft Edition"}</Text>
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

      <Tabs
        index={activeMainTab}
        onChange={(idx) => setActiveMainTab(idx)}
        colorScheme="teal"
        variant="soft-rounded"
        mb={6}
      >
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={4}
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

          <TabPanel px={0} pt={2}>
            <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} mb={6} boxShadow="sm">
              <CardBody p={6}>
                <Heading size="xs" fontWeight="800" textTransform="uppercase" color="teal.600" letterSpacing="wider" mb={4}>
                  Course Book Overview & Settings
                </Heading>
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
                    rows={3}
                    focusBorderColor="teal.500"
                  />
                </FormControl>
              </CardBody>
            </Card>

            <VStack align="stretch" spacing={5}>
              {course.slides.map((slide, slideIndex) => (
                <Card
                  key={`slide-${slideIndex}`}
                  bg={cardBg}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={borderColor}
                  boxShadow="sm"
                  transition="all 0.2s"
                >
                  <CardBody p={6}>
                    <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={borderColor}>
                      <HStack spacing={3}>
                        <Flex
                          w="32px"
                          h="32px"
                          borderRadius="lg"
                          bg="teal.50"
                          color="teal.700"
                          align="center"
                          justify="center"
                          fontWeight="800"
                          fontSize="xs"
                        >
                          {slideIndex + 1}
                        </Flex>
                        <Heading size="sm" color="gray.800">
                          Chapter {slideIndex + 1}: {slide.title || "Untitled Chapter"}
                        </Heading>
                      </HStack>

                      <IconButton
                        aria-label={`Remove chapter ${slideIndex + 1}`}
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        borderRadius="lg"
                        onClick={() => removeSlide(slideIndex)}
                      />
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700">
                          Chapter Title
                        </FormLabel>
                        <Input
                          value={slide.title}
                          onChange={(event) => updateSlideField(slideIndex, "title", event.target.value)}
                          placeholder="e.g. Workplace Ethics & Values"
                          borderRadius="xl"
                          fontSize="sm"
                          focusBorderColor="teal.500"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="700">
                          Upload Chapter Illustrations & Slides
                        </FormLabel>
                        <HStack mt={1}>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            p={1}
                            borderRadius="xl"
                            fontSize="xs"
                            onChange={(event) => {
                              handleSlideImageUpload(slideIndex, event.target.files);
                              event.target.value = "";
                            }}
                          />
                          {uploadingSlideIndex === slideIndex && <Spinner size="sm" color="teal.500" />}
                        </HStack>
                        <Text fontSize="10px" color="gray.400" mt={1}>
                          Upload graphics, infographics, or slide screenshots.
                        </Text>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl mb={4}>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Chapter Reading Content & Guidelines
                      </FormLabel>
                      <Textarea
                        value={slide.body}
                        minH="130px"
                        onChange={(event) => updateSlideField(slideIndex, "body", event.target.value)}
                        placeholder="Write detailed reading material for this chapter..."
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    <Box mt={3} p={4} bg={useColorModeValue("gray.50", "gray.900")} borderRadius="xl">
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" fontWeight="700" color="gray.600">
                          Associated Chapter Images ({slide.imageUrls.length})
                        </Text>
                        <Button
                          size="xs"
                          leftIcon={<Icon as={FiPlus} />}
                          variant="outline"
                          colorScheme="teal"
                          borderRadius="lg"
                          onClick={() => addSlideImageUrlField(slideIndex)}
                        >
                          Add Image URL
                        </Button>
                      </Flex>

                      <VStack align="stretch" spacing={2} mb={3}>
                        {slide.imageUrls.map((imageUrl, imageIndex) => (
                          <HStack key={`slide-${slideIndex}-image-${imageIndex}`} align="center">
                            <Input
                              size="sm"
                              borderRadius="lg"
                              value={imageUrl}
                              placeholder={`Image URL ${imageIndex + 1}`}
                              onChange={(event) => updateSlideImageUrl(slideIndex, imageIndex, event.target.value)}
                            />
                            <IconButton
                              aria-label={`Remove image ${imageIndex + 1}`}
                              icon={<FiTrash2 />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => removeSlideImage(slideIndex, imageIndex)}
                            />
                          </HStack>
                        ))}
                      </VStack>

                      {slide.imageUrls.some((url) => asText(url, "")) && (
                        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3} mt={2}>
                          {slide.imageUrls
                            .filter((url) => asText(url, ""))
                            .map((url, imgIdx) => (
                              <Box
                                key={`img-prev-${imgIdx}`}
                                borderRadius="lg"
                                overflow="hidden"
                                border="1px solid"
                                borderColor={borderColor}
                                h="110px"
                                bg="gray.200"
                              >
                                <Image src={url} alt={`Slide image ${imgIdx + 1}`} w="full" h="full" objectFit="cover" />
                              </Box>
                            ))}
                        </SimpleGrid>
                      )}
                    </Box>

                    <FormControl mt={4}>
                      <FormLabel fontSize="xs" fontWeight="700">
                        External Reference / Video URL (Optional)
                      </FormLabel>
                      <Input
                        value={slide.materialUrl}
                        onChange={(event) => updateSlideField(slideIndex, "materialUrl", event.target.value)}
                        placeholder="https://..."
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>
                  </CardBody>
                </Card>
              ))}

              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="teal"
                variant="outline"
                size="md"
                borderRadius="xl"
                py={6}
                borderStyle="dashed"
                borderWidth="2px"
                onClick={addSlide}
                _hover={{ bg: "teal.50" }}
              >
                Add New Chapter
              </Button>
            </VStack>
          </TabPanel>

          <TabPanel px={0} pt={2}>
            <VStack align="stretch" spacing={5}>
              {course.quizQuestions.map((quiz, questionIndex) => (
                <Card
                  key={`quiz-${questionIndex}`}
                  bg={cardBg}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={borderColor}
                  boxShadow="sm"
                >
                  <CardBody p={6}>
                    <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={borderColor}>
                      <HStack spacing={3}>
                        <Flex
                          w="32px"
                          h="32px"
                          borderRadius="lg"
                          bg="blue.50"
                          color="blue.700"
                          align="center"
                          justify="center"
                          fontWeight="800"
                          fontSize="xs"
                        >
                          Q{questionIndex + 1}
                        </Flex>
                        <Heading size="sm" color="gray.800">
                          Question {questionIndex + 1}
                        </Heading>
                      </HStack>
                      <IconButton
                        aria-label={`Remove question ${questionIndex + 1}`}
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeQuestion(questionIndex)}
                      />
                    </Flex>

                    <FormControl mb={4} isRequired>
                      <FormLabel fontSize="xs" fontWeight="700">
                        Question Statement
                      </FormLabel>
                      <Input
                        value={quiz.question}
                        onChange={(event) => updateQuestionField(questionIndex, "question", event.target.value)}
                        placeholder="e.g. What is the standard protocol for handling confidential client records?"
                        borderRadius="xl"
                        fontSize="sm"
                        focusBorderColor="teal.500"
                      />
                    </FormControl>

                    <Text fontSize="xs" fontWeight="700" color="gray.600" mb={2}>
                      Multiple Choice Options
                    </Text>
                    <VStack align="stretch" spacing={2.5} mb={3}>
                      {quiz.options.map((option, optionIndex) => (
                        <HStack key={`question-${questionIndex}-option-${optionIndex}`}>
                          <Badge
                            colorScheme={quiz.correctAnswer === optionIndex ? "green" : "gray"}
                            borderRadius="lg"
                            px={2}
                            py={1}
                            fontSize="xs"
                            minW="32px"
                            textAlign="center"
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </Badge>
                          <Input
                            size="sm"
                            borderRadius="xl"
                            value={option}
                            onChange={(event) => updateQuestionOption(questionIndex, optionIndex, event.target.value)}
                          />
                          <IconButton
                            aria-label={`Remove option ${optionIndex + 1}`}
                            icon={<FiTrash2 />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                          />
                        </HStack>
                      ))}
                    </VStack>

                    <Button
                      size="xs"
                      leftIcon={<Icon as={FiPlus} />}
                      variant="outline"
                      colorScheme="teal"
                      borderRadius="lg"
                      mb={4}
                      onClick={() => addOption(questionIndex)}
                    >
                      Add Option
                    </Button>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} p={4} bg={useColorModeValue("gray.50", "gray.900")} borderRadius="xl">
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700">
                          Correct Answer
                        </FormLabel>
                        <Select
                          size="sm"
                          borderRadius="lg"
                          value={String(quiz.correctAnswer)}
                          onChange={(event) => updateQuestionField(questionIndex, "correctAnswer", Number(event.target.value))}
                        >
                          {quiz.options.map((_, optionIndex) => (
                            <option key={`correct-option-${optionIndex}`} value={optionIndex}>
                              Option {String.fromCharCode(65 + optionIndex)} ({quiz.options[optionIndex] || `Option ${optionIndex + 1}`})
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="700">
                          Explanation (Shown after answering)
                        </FormLabel>
                        <Input
                          size="sm"
                          borderRadius="lg"
                          value={quiz.explanation}
                          onChange={(event) => updateQuestionField(questionIndex, "explanation", event.target.value)}
                          placeholder="Why this answer is correct..."
                        />
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              ))}

              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="teal"
                variant="outline"
                size="md"
                borderRadius="xl"
                py={6}
                borderStyle="dashed"
                borderWidth="2px"
                onClick={addQuestion}
                _hover={{ bg: "teal.50" }}
              >
                Add New Question
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminTrainingUpload;
