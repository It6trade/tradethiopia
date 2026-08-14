import { 
    Container, 
    Text, 
    VStack, 
    SimpleGrid, 
    Spinner, 
    Alert, 
    AlertIcon, 
    Input, 
    InputGroup, 
    InputLeftElement, 
    Select, 
    HStack, 
    Box, 
    IconButton, 
    Drawer, 
    DrawerBody, 
    DrawerCloseButton, 
    DrawerContent, 
    DrawerHeader, 
    DrawerOverlay, 
    useDisclosure, 
    useColorModeValue 
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useUserStore } from '../store/user.js';
import UserCard from '../components/UserCard';
import { SearchIcon, AddIcon, RepeatIcon, ArrowUpDownIcon } from '@chakra-ui/icons'; 
import CreatePage from './CreatePage';

const HomePage = () => {
    const { fetchUsers, users, loading, error } = useUserStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(user => {
        // Filter out users with username 
        const isValidUser = user.username !== "." && user.username !== "..";
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole ? user.role === selectedRole : true;
        return isValidUser && matchesSearch && matchesRole;
    });

    const sortedUsers = filteredUsers.sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.username.localeCompare(b.username);
        } else {
            return b.username.localeCompare(a.username);
        }
    });

    const handleRefresh = () => {
        fetchUsers();
    };

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <Container maxW='container.xl' py={12} px={4} mt={-16}>
            <VStack spacing={8}>
                <Text
                    fontSize="30"
                    fontWeight="bold"
                    bgGradient="linear(to-r, cyan.400, blue.500)"
                    bgClip="text"
                    textAlign="center"
                >
                    List of User Accounts 📜
                </Text>

                <Box 
                    width="full" 
                    maxW="800px" 
                    bg={useColorModeValue("gray.50", "gray.800")} 
                    p={5} 
                    borderRadius="md" 
                    boxShadow="md"
                >
                    <HStack 
                        spacing={4} 
                        alignItems="flex-start" 
                        justifyContent={{ base: "flex-start", md: "space-between" }} 
                        wrap="wrap"
                    >
                        <InputGroup flex={1} maxW={{ base: "100%", md: "450px" }}>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color={useColorModeValue("gray.500", "gray.300")} />
                            </InputLeftElement>
                            <Input
                                type="text"
                                placeholder="Search by username or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="lg"
                                borderRadius="md"
                                focusBorderColor={useColorModeValue("blue.400", "blue.300")}
                                bg={useColorModeValue("white", "gray.700")}
                                color={useColorModeValue("black", "white")}
                            />
                        </InputGroup>
                        <Select 
                            placeholder="Select role" 
                            onChange={(e) => setSelectedRole(e.target.value)} 
                            maxW={{ base: "100%", md: "200px" }} // Adjust max width for responsiveness
                            bg={useColorModeValue("white", "gray.700")}
                            color={useColorModeValue("black", "white")}
                            borderColor={useColorModeValue("gray.300", "gray.600")}
                        >
                            <option value="admin">Admin</option>
                            <option value="sales">Sales</option>
                            <option value="customerservice">Customer Service</option>
                            <option value="CustomerSuccessManager">Customer Success Manager</option>
                            <option value="SocialmediaManager">Socialmedia Manager</option>
                            <option value="socialmedia">Social Media</option>
                            <option value="salesmanager">Sales Manager</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="tradextv">tradextv</option>
                            <option value="IT">IT</option>
                            <option value="HR">HR</option>
                            <option value="Enisra">Enisra</option>
                            <option value="Instructor">Instructor</option>
                            <option value="EventManager">EventManager</option>          
                                          </Select>

                        <HStack spacing={2}>
                            <IconButton 
                                aria-label="Add User" 
                                icon={<AddIcon />} 
                                colorScheme="teal" 
                                onClick={onOpen}
                                size="lg"
                                variant="outline"
                            />
                            <IconButton 
                                aria-label="Refresh Users" 
                                icon={<RepeatIcon />} 
                                colorScheme="blue" 
                                onClick={handleRefresh}
                                size="lg"
                                variant="outline"
                            />
                            <IconButton 
                                aria-label="Sort Users" 
                                icon={<ArrowUpDownIcon />} 
                                colorScheme="purple" 
                                onClick={toggleSortOrder}
                                size="lg"
                                variant="outline"
                            />
                        </HStack>
                    </HStack>
                </Box>

                <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader> </DrawerHeader>
                        <DrawerBody>
                            <CreatePage onClose={onClose} />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {loading ? (
                    <Spinner size="xl" color="blue.500" />
                ) : error ? (
                    <Alert status="error" variant="left-accent">
                        <AlertIcon />
                        {error}
                    </Alert>
                ) : sortedUsers.length === 0 ? (
                    <Text fontSize="xl" textAlign="center" fontWeight='bold' color="gray.500">
                        No User found! 😢{" "}
                    </Text>
                ) : (
                    <SimpleGrid
                        columns={{
                            base: 1,
                            md: 2,
                            lg: 3
                        }}
                        spacing={10}
                        w="full"
                    >
                        {sortedUsers.map((user) => (
                            <UserCard key={user._id} user={user} />
                        ))}
                    </SimpleGrid>
                )}
            </VStack>
        </Container>
    );
};

export default HomePage;
