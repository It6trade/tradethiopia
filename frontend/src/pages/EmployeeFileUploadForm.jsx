import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Text,
    VStack,
    useToast,
    useColorMode,
    useColorModeValue,
    Switch,
} from '@chakra-ui/react';
import { useUserStore } from '../store/user';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const EmployeeFileUploadForm = () => {
    const currentUser = useUserStore((status) => status.currentUser);
    const toast = useToast();
    const navigate = useNavigate();
    const { toggleColorMode } = useColorMode();
    const bgGradient = useColorModeValue(
        'linear(to-r, teal.500, green.500)',
        'linear(to-r, gray.700, gray.900)'
    );
    const cardBg = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('teal.600', 'teal.300');

    const [photo, setPhoto] = useState(null);
    const [guarantorFile, setGuarantorFile] = useState(null);

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'photo') {
            setPhoto(files[0]);
        } else if (name === 'guarantorFile') {
            setGuarantorFile(files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        if (photo) formData.append('photo', photo);
        if (guarantorFile) formData.append('guarantorFile', guarantorFile);

        if (!currentUser?._id) {
            toast({
                title: "Error",
                description: "User ID is not available.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            const { data: result } = await axiosInstance.post('/upload-info', formData);
            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message || "Files uploaded successfully!",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });

                // Update the current user with the new file URLs
                if (result.user) {
                    useUserStore.getState().setCurrentUser({
                        ...currentUser,
                        photo: result.user.photo,
                        photoUrl: result.user.photoUrl,
                        guarantorFile: result.user.guarantorFile,
                        guarantorFileUrl: result.user.guarantorFileUrl,
                        infoStatus: result.user.infoStatus
                    });
                }
                navigate('/employee-info?documentsUploaded=1', { replace: true });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "An error occurred during the upload.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error during file upload:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "There was an error uploading your files.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleGoBack = () => {
        navigate('/employee-info');
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            bgGradient={bgGradient}
        >
            <Box
                p={6}
                bg={cardBg}
                borderRadius="2xl"
                boxShadow="lg"
                width={{ base: "90%", sm: "400px" }}
                textAlign="center"
                position="relative"
            >
                <Text fontSize="2xl" fontWeight="extrabold" color={textColor} mb={4}>
                    Upload Employee Files
                </Text>
                <Text fontSize="sm" color="gray.500" mb={5}>
                    After uploading, you will return to the personal information form to complete and submit it for HR approval.
                </Text>
                <form onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                        <FormControl>
                            <FormLabel htmlFor="photo">Photo</FormLabel>
                            <Input
                                type="file"
                                id="photo"
                                name="photo"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                bg="gray.100"
                                border="none"
                                borderRadius="md"
                                _hover={{ bg: "gray.200" }}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="guarantorFile">Guarantor File</FormLabel>
                            <Input
                                type="file"
                                id="guarantorFile"
                                name="guarantorFile"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                required
                                bg="gray.100"
                                border="none"
                                borderRadius="md"
                                _hover={{ bg: "gray.200" }}
                            />
                        </FormControl>
                        <Button
                            colorScheme="teal"
                            type="submit"
                            size="lg"
                            borderRadius="full"
                        >
                            Upload and return to form
                        </Button>
                        <Button
                            colorScheme="gray"
                            variant="outline"
                            size="lg"
                            borderRadius="full"
                            onClick={handleGoBack}
                        >
                            Return to form
                        </Button>
                        <FormControl display="flex" alignItems="center" justifyContent="center" mt={4}>
                            <FormLabel htmlFor="theme-toggle" mb={0} color={textColor}>
                                color Theme
                            </FormLabel>
                            <Switch
                                id="theme-toggle"
                                onChange={toggleColorMode}
                                colorScheme="teal"
                            />
                        </FormControl>
                    </VStack>
                </form>
            </Box>
        </Box>
    );
};

export default EmployeeFileUploadForm;
