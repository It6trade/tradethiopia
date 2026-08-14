import { Box, Heading, HStack, Divider, IconButton, Text, useColorModeValue, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, VStack, Input, Select, Switch } from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useUserStore } from '../store/user';
import { useState, useEffect } from 'react';
import UserDetailDrawer from './UserDetailDrawer'; // Import the new drawer component

const UserCard = ({ user }) => {
    const [updatedUser, setUpdatedUser] = useState(user);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordDraft, setPasswordDraft] = useState("");
    const [isDrawerOpen, setDrawerOpen] = useState(false); // State for the drawer
    const [hireDate, setHireDate] = useState(user.hireDate ? new Date(user.hireDate).toISOString().split("T")[0] : "");
    const textColor = useColorModeValue("gray.600", "gray.200");
    const bg = useColorModeValue("white", "gray.800");

    const formatSalary = (value) => {
        if (value === undefined || value === null || Number.isNaN(Number(value))) {
            return "N/A";
        }
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(Number(value));
    };

    const salaryLabel = formatSalary(user.salary);

    const { deleteUser, updateUser, fetchUsers } = useUserStore();
    const toast = useToast();

    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    useEffect(() => {
        if (isEditOpen) {
            setUpdatedUser(user);
            setPasswordDraft("");
            setHireDate(user.hireDate ? new Date(user.hireDate).toISOString().split("T")[0] : "");
        }
    }, [isEditOpen, user]);

    const handleDeleteUser = async (uid) => {
        const { success, message } = await deleteUser(uid);
        toast({
            title: success ? 'Success' : 'Error',
            description: message,
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });
        if (success) onDeleteClose();
        await fetchUsers();
    };

    const handleUpdateUser = async () => {
        const payload = { ...updatedUser, hireDate };
        if (passwordDraft) {
            payload.password = passwordDraft;
        } else {
            delete payload.password;
        }
        const { success } = await updateUser(user._id, payload);
        toast({
            title: success ? 'Success' : 'Error',
            description: success ? "User updated successfully" : "Failed to update user",
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });

        if (success) {
            onEditClose();
            await fetchUsers();
        }
    };

    const toggleUserStatus = async () => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const { success } = await updateUser(user._id, { ...updatedUser, status: newStatus });
        toast({
            title: success ? 'Success' : 'Error',
            description: success ? `User status updated to ${newStatus}` : "Failed to update user status",
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });

        if (success) {
            setUpdatedUser({ ...updatedUser, status: newStatus });
            await fetchUsers();
        }
    };

    return (
        <Box
            shadow="md"
            rounded="lg"
            overflow="hidden"
            w="100%"
            maxW="sm"
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", shadow: "lg" }}
            bg={bg}
            p={3}
            onClick={() => setDrawerOpen(true)}
        >
            <VStack spacing={2} align="start">
                <Box borderBottom="2px" borderColor={useColorModeValue("gray.300", "gray.600")} mb={2} width="full">
                    <Heading as="h3" size="md" mb={1}>
                        {user.username || "No Username Available"}
                    </Heading>
                </Box>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                    {user.email || "No Email Available"}
                </Text>
                <Text fontSize="md" color={textColor}>
                    Role: {user.role || "No Role Assigned"}
                </Text>
                <Text fontSize="md" color={textColor}>
                    Salary: {salaryLabel}
                </Text>

                <HStack
                    spacing={3}
                    alignItems="center"
                    width="full"
                    py={2}
                    px={3}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    rounded="md"
                    boxShadow="sm"
                >
                    <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={textColor}
                        minWidth="80px"
                    >
                        Hire Date:
                    </Text>
                    <Input
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                        size="sm"
                        variant="flushed"
                        placeholder="Select a date"
                        borderColor="blue.300"
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{
                            borderColor: "blue.500",
                            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)",
                        }}
                        fontSize="sm"
                        color={textColor}
                        width="60%"
                    />
                    <Button
                        onClick={handleUpdateUser}
                        size="sm"
                        colorScheme="blue"
                        px={4}
                        boxShadow="sm"
                        _hover={{ bg: "blue.600" }}
                        fontSize="sm"
                    >
                        Save
                    </Button>
                </HStack>

                <Divider borderColor="gray.300" />

                <HStack spacing={2} alignItems="center" justifyContent="space-between" width="full">
                    <Switch
                        isChecked={user.status === 'active'}
                        onChange={toggleUserStatus}
                        size="sm"
                        colorScheme="teal"
                    />
                    <Text fontSize="md" color={textColor} display="flex" alignItems="center">
                        {user.status === 'active' ? (
                            <>
                                <CheckCircleIcon color="green.500" boxSize={4} mr={1} />
                                Active
                            </>
                        ) : (
                            <>
                                <WarningIcon color="red.500" boxSize={4} mr={1} />
                                Inactive
                            </>
                        )}
                    </Text>
                </HStack>

                <HStack spacing={2}>
                    <IconButton icon={<EditIcon />} onClick={onEditOpen} colorScheme="blue" aria-label="Edit user" size="sm" />
                    <IconButton icon={<DeleteIcon />} onClick={onDeleteOpen} colorScheme="red" aria-label="Delete user" size="sm" />
                </HStack>
            </VStack>

            <UserDetailDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setDrawerOpen(false)} 
                user={user} 
            />

            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Update User</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="User Name"
                                name="username"
                                value={updatedUser.username || ''}
                                onChange={(e) => setUpdatedUser({ ...updatedUser, username: e.target.value })}
                            />
                            <Input
                                placeholder="User Email"
                                name="email"
                                value={updatedUser.email || ''}
                                onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })}
                            />
                            <Box position="relative" width="100%">
                                <Input
                                    placeholder="User Password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={passwordDraft}
                                    onChange={(e) => setPasswordDraft(e.target.value)}
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
                            <Select
                                placeholder="Select Role"
                                value={updatedUser.role || ''}
                                onChange={(e) => setUpdatedUser({ ...updatedUser, role: e.target.value })}
                            >
                                <option value="admin">Admin</option>
                                <option value="HR">HR</option>
                                <option value="sales">Sales</option>
                                <option value="Enisra">Enisra</option>
                                <option value="customerservice">Customer Service</option>
                                <option value="CustomerSuccessManager">Customer Success Manager</option>
                                <option value="SocialmediaManager">Socialmedia Manager</option>
                                <option value="socialmedia">Social Media</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="tradextv">tradextv</option>
                                <option value="IT">IT</option>
                                <option value="finance">Finance</option>
                                <option value="Instructor">Instructor</option>
                                <option value="EventManager">Event Manager</option>
                                <option value="salesmanager">Sales Manager</option>
                                <option value="reception">Reception</option>
                                <option value="COO">COO</option>
                                <option value="CEO">CEO</option>
                            </Select>
                            <Input
                                placeholder="Salary"
                                name="salary"
                                type="number"
                                value={updatedUser.salary || ''}
                                onChange={(e) => setUpdatedUser({ ...updatedUser, salary: e.target.value })}
                            />
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleUpdateUser}>
                            Save
                        </Button>
                        <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm Deletion</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Are you sure you want to delete the user {user.username}?</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="red" onClick={() => handleDeleteUser(user._id)}>
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

export default UserCard;``
