import { Box, Text, VStack, Button, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useUserStore } from '../store/user'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory

const Esidebar = () => {
    const currentUser = useUserStore((state) => state.currentUser);
    const clearUser = useUserStore((state) => state.clearUser); // Use clearUser for logout
    const navigate = useNavigate(); // Initialize navigate for navigation
    const bgColor = useColorModeValue('gray.100', 'gray.700');
    const textColor = useColorModeValue('black', 'white');

    const handleLogout = () => {
        clearUser(); // Clear the user state
        navigate('/login'); // Redirect to the login page
    };

    return (
        <Box
            width="250px"
            p={4}
            bg={bgColor}
            boxShadow="md"
            borderRadius="md"
            position="sticky"
            top="10"
            height="fit-content"
            mt={16}
        >
            <VStack spacing={4} align="start">
                <Text fontSize="lg" fontWeight="bold" color={textColor}>User Information</Text>
                <Text fontSize="md" color={textColor}>Username: {currentUser?.username || 'N/A'}</Text>
                <Text fontSize="md" color={textColor}>Role: {currentUser?.role || 'N/A'}</Text>
                <Button as={RouterLink} to="/awards" variant="ghost" size="sm">Awards</Button>
                <Button colorScheme="teal" onClick={handleLogout}>
                    Logout
                </Button>
            </VStack>
        </Box>
    );
};

export default Esidebar;