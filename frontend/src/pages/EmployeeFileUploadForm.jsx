import React, { useState } from 'react';
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

const normalizeRoleValue = (value = '') =>
    value?.toString().trim().toLowerCase().replace(/\s+/g, '');

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

        const userId = currentUser?._id;

        if (!userId) {
            toast({
                title: "Error",
                description: "User ID is not available.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Set infostatus to 'pending' before uploading
        const updateStatusUrl = `${import.meta.env.VITE_API_URL}/api/users/${userId}`;
        try {
            const updateResponse = await fetch(updateStatusUrl, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ infostatus: 'pending' }), // Set infostatus to pending
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error("Update status error:", errorText);
                toast({
                    title: "Error",
                    description: "Failed to set info status to pending.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return; // Stop further execution if status update fails
            }

            // Proceed with file upload
            formData.append('userId', userId);

            const uploadUrl = `${import.meta.env.VITE_API_URL}/api/upload-info`;

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Response error:", text);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
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

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error("Final update status error:", errorText);
                    toast({
                        title: "Error",
                        description: "Failed to update info status.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                } else {
                    console.log('currentUser.status:', currentUser.status);
                    console.log('currentUser.infoStatus:', currentUser.infoStatus);
                    
                    if (currentUser.status === 'inactive') {
                        navigate('/secondpage');
                    } else {
                        if (currentUser.infoStatus === 'active') {
                            const normalizedRole =
                                currentUser.normalizedRole || normalizeRoleValue(currentUser.role);
                            // Redirect based on normalized user role
                            switch (normalizedRole) {
                                case 'admin':
                                    navigate('/dashboard');
                                    break;
                                case 'sales':
                                    navigate('/sdashboard');
                                    break;
                                case 'salesmanager':
                                    navigate('/salesmanager');
                                    break;
                                case 'customerservice':
                                    navigate('/Cdashboard');
                                    break;
                                case 'hr':
                                    navigate('/hdashboard');
                                    break;
                                case 'socialmediamanager':
                                case 'socialmedia':
                                    navigate('/social-media');
                                    break;
                                default:
                                    navigate('/home'); // Optional: handle unknown roles
                                    break;
                            }
                        } else {
                            navigate('/waitingForApproval');
                        }
                    }
                }
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
                description: "There was an error uploading your files.",
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
                            Upload
                        </Button>
                        <Button
                            colorScheme="gray"
                            variant="outline"
                            size="lg"
                            borderRadius="full"
                            onClick={handleGoBack}
                        >
                            Go Back
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
