import { Box, Heading, HStack, IconButton, Text, useColorModeValue, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, VStack, Input } from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useQuizStore } from '../../../../store/quiz';
import { useState, useEffect } from 'react';

const QuizCard = ({ quiz }) => {
    const [updatedQuiz, setUpdatedQuiz] = useState(quiz); // Initialize with the user prop
    const [showPassword, setShowPassword] = useState(false);
    const textColor = useColorModeValue("gray.600", "gray.200");
    const bg = useColorModeValue("white", "gray.800");

    const { deleteQuiz, updateQuiz, fetchQuizs } = useQuizStore(); // Ensure fetchUsers is available to refresh data
    const toast = useToast();

    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    // Update `updatedUser` when the edit modal opens
    useEffect(() => {
        if (isEditOpen) {
            setUpdatedQuiz(quiz);
        }
    }, [isEditOpen, quiz]);

    const handleDeleteQuiz = async (qid) => {
        const { success, message } = await deleteQuiz(qid);
        toast({
            title: success ? 'Success' : 'Error',
            description: message,
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });
        if (success) onDeleteClose();
        // Refresh user data after deletion
        await fetchQuizs();
    };

    const handleUpdateQuiz = async () => {
        const { success } = await updateQuiz(quiz._id, updatedQuiz);
        toast({
            title: success ? 'success' : 'Error',
            description: "Quiz updated successfully",
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });

        if (success) onEditClose();
        // Refresh user data after update
        await fetchQuizs();

    };

    return (
        <Box
            shadow="lg"
            rounded="lg"
            overflow="hidden"
            w="100%"
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", shadow: "xl" }}
            bg={bg}
        >
            <Box p={4}>
                <Heading as="h3" size="md" mb={2}>
                    {quiz.question || "No Exam Available"}
                </Heading>
                <Text fontWeight="bold" fontSize="xl" color={textColor} mb={4}>
                    {quiz.options || "No options are Available"}
                </Text>
                <HStack spacing={2}>
                    <IconButton icon={<EditIcon />} onClick={onEditOpen} colorScheme="blue" aria-label="Edit quiz" />
                    <IconButton icon={<DeleteIcon />} onClick={onDeleteOpen} colorScheme="red" aria-label="Delete quiz" />
                </HStack>
            </Box>

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Update Exam</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="Question"
                                name="question"
                                value={updatedQuiz.question || ''} // Display the current username
                                onChange={(e) => setUpdatedQuiz({ ...updatedQuiz, question: e.target.value })}
                            />
                            <Input
                                placeholder="Options"
                                name="email"
                                value={updatedQuiz.options || ''}
                                onChange={(e) => setUpdatedQuiz({ ...updatedQuiz, options: e.target.value })}
                            />
                            <Box position="relative" width="100%">
                                <Input
                                    placeholder="correctAnswer"
                                    name="correctAnswer"
                                    type={showPassword ? "text" : "correctAnswer"}
                                    value={updatedQuiz.correctAnswer || ''}
                                    onChange={(e) => setUpdatedQuiz({ ...updatedQuiz, correctAnswer: e.target.value })}
                                />
                                <IconButton
                                    aria-label="Toggle password visibility"
                                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                    onClick={() => setShowPassword(!showPassword)}
                                    position="absolute"
                                    right="10px"
                                    top="50%"
                                    transform="translateY(-50%)"
                                />
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleUpdateQuiz}>
                            Save
                        </Button>
                        <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm Deletion</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Are you sure you want to delete the exam {quiz.question}?</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="red" onClick={() => handleDeleteQuiz(quiz._id)}>
                            Yes, Delete
                        </Button>
                        <Button variant="ghost" onClick={onDeleteClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default QuizCard;
