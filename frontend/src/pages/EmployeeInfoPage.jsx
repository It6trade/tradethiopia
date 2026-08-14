import { Box, Heading, IconButton, useColorMode, Flex } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import EmployeeInfoForm from './EmployeeInfoForm';
import Esidebar from './Esidebar';

const EmployeeInfoPage = () => {
    const { colorMode, toggleColorMode } = useColorMode(); // Hook to get and toggle color mode

    return (
<Box
    maxW={{ base: '100%', sm: '95%', md: '100%', lg: '95%', xl: '85%' }} // Increased widths for a more stretched look
    mx="auto"
    p={6}
    position="relative"
    bg={colorMode === 'light' ? 'gray.50' : 'gray.800'}
    boxShadow="xl"
    mt={"10"}
>

            
            {/* Floating action button for theme toggle */}
            <IconButton
                aria-label="Toggle theme"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                position="absolute"
                top="4"
                right="4"
                onClick={toggleColorMode}
                borderRadius="full"
                boxShadow="lg"
                size="lg"
                colorScheme={colorMode === 'light' ? 'teal' : 'yellow'}
                mb={4}
            />

{/* Main content and sidebar */}
<Flex
    direction={{ base: 'column', lg: 'row' }}
    gap={8}
    align="flex-start"
    justify={{ base: 'flex-start', lg: 'center' }}  // Centering on larger screens
>
    {/* Main content area */}
    <Flex
        flex="3" // Increased the flex value for more space
        direction="column"
        bg={colorMode === 'light' ? 'white' : 'gray.700'}
        p={6}
        borderRadius="lg"
        boxShadow="lg"
    >
        <Heading as="h2" size="lg" textAlign="center" mb={6}>
            Employee Information
        </Heading>
        <EmployeeInfoForm />
    </Flex>

    {/* Sidebar */}
    <Flex
        flex="1" // Minimized the flex value for the sidebar
        justify="center" // Centering horizontally
        align="center" // Centering vertically
        bg={colorMode === 'light' ? 'white' : 'gray.700'}
        p={6}
        borderRadius="lg"
        boxShadow="lg"
    >
        <Esidebar />
    </Flex>
</Flex>
        </Box>
    );
};

export default EmployeeInfoPage;