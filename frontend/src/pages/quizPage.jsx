import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Progress,
  Divider,
  Icon,
  useColorMode,
  useColorModeValue,
  IconButton,
  Spacer,
  useToast,
  Badge,
  VStack,
} from '@chakra-ui/react';
import { FaClock, FaSun, FaMoon, FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import axiosInstance from '../services/axiosInstance';
import { useUserStore } from '../store/user';
import { useQuizStore } from '../store/quiz';
import { useNavigate } from 'react-router-dom';

const isAccessGranted = (val) =>
  ['on', 'active', 'approved', 'enabled', 'true'].includes(
    String(val || '').trim().toLowerCase()
  );

const QuizPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [quiz, setQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen: showResults, onOpen: openResults, onClose: closeResults } = useDisclosure();
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [passed, setPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useUserStore((state) => state.currentUser);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const quizData = useQuizStore((state) => state.quizs);
  const navigate = useNavigate();

  // Validate tutorial approval before taking exam
  useEffect(() => {
    const checkTutorialApproval = async () => {
      try {
        const { data } = await axiosInstance.get('/users/me');
        const user = data?.data;
        if (user) {
          setCurrentUser({ ...currentUser, ...user, token: currentUser?.token });
        }
        if (user?.examBypass) {
          navigate('/sdashboard');
          return;
        }
        if (!isAccessGranted(user?.trainingStatus)) {
          toast({
            title: 'Tutorial Approval Required',
            description: 'HR must approve your tutorial completion before you can access the exam.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          navigate('/fourthpage');
        }
      } catch (err) {
        console.error('Error validating access:', err);
      }
    };
    checkTutorialApproval();
  }, []);

  useEffect(() => {
    if (quizData.length === 0) {
      fetchQuiz();
    } else {
      setQuiz(quizData);
      setLoading(false);
    }
  }, [quizData]);

  const fetchQuiz = async () => {
    try {
      const response = await axiosInstance.get('/quiz');
      if (response.data.success && Array.isArray(response.data.data)) {
        setQuiz(response.data.data);
        setLoading(false);
      } else {
        setError('Invalid quiz data format.');
        setLoading(false);
      }
    } catch (error) {
      setError('Error fetching quiz data. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isStarted) {
      handleSubmit();
    }
  }, [isStarted, timeLeft]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(3600); // 1 hour for the quiz
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    calculateScore();
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    const total = quiz.length;

    quiz.forEach((question) => {
      if (userAnswers[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const calculatedPercentage = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    const isPassing = calculatedPercentage >= 70; // 70% passing grade requirement

    setScore(correctAnswers);
    setTotalQuestions(total);
    setPercentage(calculatedPercentage);
    setPassed(isPassing);
    openResults();
  };

  const handleRetakeExam = () => {
    closeResults();
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(3600);
    setIsStarted(true);
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await axiosInstance.get('/users/me');
      const refreshedUser = data?.data;

      const isExamApproved = isAccessGranted(refreshedUser?.examStatus) || Boolean(refreshedUser?.examBypass);

      if (isExamApproved) {
        await axiosInstance.put(`/users/${currentUser._id}`, { status: 'active', examStatus: 'on' });
        closeResults();
        toast({
          title: 'Exam Verified & Approved!',
          description: 'Welcome to your role dashboard.',
          status: 'success',
          duration: 3500,
          isClosable: true,
        });
        navigate('/sdashboard');
        return;
      }

      const empName = refreshedUser?.fullName || currentUser?.fullName || currentUser?.username || 'Employee';

      // Mark exam as completed in user record
      await axiosInstance.put(`/users/${currentUser._id}`, { examStatus: 'completed' });

      // 1. Direct In-App Notification to All Admin & HR Staff with Exam Score
      try {
        await axiosInstance.post('/notifications/notify-hr', {
          title: `Exam Passed (${percentage}%): ${empName}`,
          message: `Employee ${empName} passed their onboarding exam with a score of ${score}/${totalQuestions} (${percentage}%). Passing requirement (70%+) satisfied. Please open Employee Directory and switch Exam Permission ON to unlock their Dashboard.`,
          category: 'onboarding',
          employeeId: currentUser?._id,
          employeeName: empName,
          score: `${score}/${totalQuestions}`,
          percentage: `${percentage}%`,
        });
      } catch (notifErr) {
        console.log('HR exam in-app notification error:', notifErr);
      }

      // 2. Formal HR Approval Request
      try {
        await axiosInstance.post('/requests', {
          department: 'HR',
          title: `Exam Passed (${percentage}%): ${empName}`,
          details: `Employee ${empName} (${refreshedUser?.role || currentUser?.role || 'Employee'}) completed and passed their onboarding exam with a score of ${score}/${totalQuestions} (${percentage}%). HR approval (Exam Permission ON) is required to unlock the main Dashboard.`,
          priority: 'High',
          requestType: 'Approval',
          requestedBy: empName,
          requestedById: currentUser?._id,
          status: 'Pending',
        });
      } catch (notifyErr) {
        console.log('HR exam request error:', notifyErr);
      }

      toast({
        title: 'Exam Passed — Awaiting HR Approval',
        description: `HR has been notified of your score (${percentage}%). Once HR turns Exam Permission ON, you can enter the main Dashboard.`,
        status: 'info',
        duration: 6000,
        isClosable: true,
      });

      closeResults();
      navigate('/waiting-for-approval');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Submission Error',
        description: error.response?.data?.message || 'Failed to submit exam results.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return <Text color="red.500" textAlign="center">{error}</Text>;
  }

  if (!isStarted) {
    return (
      <Modal isOpen={true} onClose={() => setIsStarted(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ready to Start the Exam?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3}>
              Once you start, the timer will begin and you won't be able to go back to previous pages.
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="teal.600" mb={4}>
              Requirement: You must score at least 70% to pass and qualify for HR dashboard approval.
            </Text>
            <Progress value={100} colorScheme="teal" borderRadius="full" />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="purple"
              variant="outline"
              onClick={() => navigate(-1)}
              _hover={{ backgroundColor: "purple.500", color: "white" }}
            >
              Back
            </Button>
            <Spacer />
            <Button colorScheme="teal" onClick={handleStart}>
              Start Exam
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  if (quiz.length === 0) {
    return <Text>No questions available.</Text>;
  }

  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <Box minH="100vh" pt={0} bg={useColorModeValue("gray.100", "gray.900")}>
      <Center h="100vh">
        <Box
          p={6}
          maxW="700px"
          w="full"
          borderWidth={1}
          borderRadius="lg"
          boxShadow="lg"
          bg={useColorModeValue("white", "gray.800")}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box display="flex" alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color={useColorModeValue("teal.600", "teal.300")} mr={2}>
                Time Left: {Math.floor(timeLeft / 60)}:
                {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
              </Text>
              <Icon as={FaClock} boxSize={8} color={useColorModeValue("teal.600", "teal.300")} />
            </Box>
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
              variant="outline"
              colorScheme="teal"
            />
          </Box>
          <Divider mb={4} />
          <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.800", "white")} mb={2}>
            Question {currentQuestionIndex + 1} of {quiz.length}
          </Text>
          <Box
            p={4}
            borderWidth={1}
            borderRadius="md"
            bg={useColorModeValue("gray.100", "gray.700")}
            boxShadow="md"
          >
            <Text fontSize="2xl" mb={4} fontWeight="semibold" color={useColorModeValue("gray.800", "white")}>
              {currentQuestion.question}
            </Text>
          </Box>
          <Box
            p={4}
            mt={4}
            borderWidth={1}
            borderRadius="md"
            bg={useColorModeValue("gray.50", "gray.600")}
            boxShadow="md"
          >
            <RadioGroup
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
              value={userAnswers[currentQuestion._id] || ''}
            >
              <Stack direction="column" spacing={3}>
                {currentQuestion.options &&
                  currentQuestion.options.map((option, index) => (
                    <Radio key={index} value={option} colorScheme="teal">
                      <Text color={useColorModeValue("gray.800", "white")}>{option}</Text>
                    </Radio>
                  ))}
              </Stack>
            </RadioGroup>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={6}>
            <Button onClick={handlePrevious} isDisabled={currentQuestionIndex === 0} colorScheme="teal">
              Previous
            </Button>
            {currentQuestionIndex < quiz.length - 1 ? (
              <Button onClick={handleNext} colorScheme="teal">
                Next
              </Button>
            ) : (
              <Button colorScheme="green" onClick={handleSubmit}>
                Submit Exam
              </Button>
            )}
          </Box>

          {/* Results Modal */}
          <Modal isOpen={showResults} onClose={() => {}} isCentered closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader textAlign="center">
                {passed ? 'Assessment Passed! 🎉' : 'Assessment Result'}
              </ModalHeader>
              <ModalBody>
                <VStack spacing={4} align="center" py={2}>
                  <Icon
                    as={passed ? FaCheckCircle : FaTimesCircle}
                    boxSize={16}
                    color={passed ? 'green.500' : 'red.500'}
                  />
                  <Badge
                    colorScheme={passed ? 'green' : 'red'}
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {passed ? `PASSED — ${percentage}% (Required: 70%+)` : `NOT PASSED — ${percentage}% (Required: 70%)`}
                  </Badge>
                  <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                    You scored {score} out of {totalQuestions} ({percentage}%).
                  </Text>
                  {passed ? (
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Congratulations on passing! HR has been notified with your score. Once HR switches <strong>Exam Permission ON</strong>, your Dashboard will unlock.
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="red.600" textAlign="center">
                      A minimum score of 70% is required to pass. Please click Retake Exam to try again.
                    </Text>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter justifyContent="center">
                {passed ? (
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={handleContinue}
                    isLoading={isSubmitting}
                    loadingText="Submitting..."
                  >
                    Continue to Approval
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    leftIcon={<FaRedo />}
                    onClick={handleRetakeExam}
                  >
                    Retake Exam
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      </Center>
    </Box>
  );
};

export default QuizPage;