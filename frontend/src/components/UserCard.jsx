import { Box, Heading, HStack, Divider, IconButton, Text, useColorModeValue, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, VStack, Input, Select, Avatar, Badge, Flex, Checkbox } from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useUserStore } from '../store/user';
import { useState, useEffect, memo } from 'react';
import UserDetailDrawer from './UserDetailDrawer'; // Import the new drawer component

const UserCard = ({ user, isSelectionMode = false, isSelected = false, onSelectToggle }) => {
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
        await fetchUsers(true);
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
            await fetchUsers(true);
        }
    };

    const toggleUserStatus = async (event) => {
        event?.stopPropagation();
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
            await fetchUsers(true);
        }
    };

    return (
        <Box
            border="1px solid"
            borderColor={isSelected ? "blue.400" : useColorModeValue("gray.150", "gray.700")}
            borderRadius="xl"
            overflow="hidden"
            w="100%"
            transition="all 0.2s ease"
            _hover={{ 
                borderColor: isSelected ? "blue.500" : useColorModeValue("gray.300", "gray.600"),
                shadow: "md",
            }}
            bg={isSelected ? useColorModeValue("blue.50", "rgba(59, 130, 246, 0.08)") : bg}
            p={4}
            cursor="pointer"
            onClick={isSelectionMode ? onSelectToggle : () => setDrawerOpen(true)}
        >
            <VStack spacing={4} align="stretch">
                {/* Profile Header */}
                <Flex w="full" align="center" gap={3} borderBottom="1px solid" borderColor={useColorModeValue("gray.100", "gray.750")} pb={3}>
                    {isSelectionMode && (
                        <Checkbox 
                            isChecked={isSelected} 
                            onChange={(e) => { e.stopPropagation(); onSelectToggle(); }}
                            mr={1}
                            colorScheme="blue"
                            size="md"
                        />
                    )}
                    <Avatar size="md" name={user.username} src={user.photoUrl} bg="blue.500" color="white" />
                    <Box overflow="hidden" flex="1">
                        <Heading as="h4" size="sm" fontWeight="bold" noOfLines={1} color={useColorModeValue("gray.800", "white")}>
                            {user.username || "No Username Available"}
                        </Heading>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {user.email || "No Email Available"}
                        </Text>
                    </Box>
                </Flex>

                {/* Details Section */}
                <VStack spacing={2} align="stretch" w="full">
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xs" fontWeight="bold" color="gray.450">ROLE</Text>
                        <Badge px={2.5} py={0.5} borderRadius="full" fontSize="10px" fontWeight="bold" colorScheme="blue" variant="subtle">
                            {user.role || "No Role Assigned"}
                        </Badge>
                    </Flex>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xs" fontWeight="bold" color="gray.450">SALARY</Text>
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                            {salaryLabel}
                        </Text>
                    </Flex>
                </VStack>

                {/* Hire Date Editing Input */}
                <HStack
                    spacing={2}
                    alignItems="center"
                    width="full"
                    py={1.5}
                    px={2.5}
                    bg={useColorModeValue("slate.50", "rgba(30, 41, 59, 0.35)")}
                    border="1px solid"
                    borderColor={useColorModeValue("gray.100", "gray.750")}
                    rounded="xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <Text fontSize="xs" fontWeight="bold" color="gray.450" whiteSpace="nowrap">
                        Hire Date:
                    </Text>
                    <Input
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                        size="xs"
                        variant="unstyled"
                        fontSize="xs"
                        color={textColor}
                        px={1}
                    />
                    <Button
                        onClick={handleUpdateUser}
                        size="xs"
                        colorScheme="blue"
                        borderRadius="md"
                        px={2.5}
                        boxShadow="xs"
                        fontSize="10px"
                    >
                        Save
                    </Button>
                </HStack>

                <Divider borderColor={useColorModeValue("gray.100", "gray.750")} />

                {/* Status Toggle & Action Buttons */}
                <HStack
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    width="full"
                    onClick={(event) => event.stopPropagation()}
                >
                    <Flex align="center">
                        <Box 
                            w={2} 
                            h={2} 
                            borderRadius="full" 
                            bg={user.status === 'active' ? "green.400" : "red.400"} 
                            mr={2} 
                            boxShadow={user.status === 'active' ? "0 0 8px #48bb78" : "0 0 8px #f56565"} 
                        />
                        <Text fontSize="xs" fontWeight="bold" color={user.status === 'active' ? "green.500" : "red.500"}>
                            {user.status === 'active' ? 'Active' : 'Deactivated'}
                        </Text>
                    </Flex>
                    <HStack spacing={1.5}>
                        <Button
                            size="xs"
                            colorScheme={user.status === 'active' ? 'red' : 'green'}
                            variant="ghost"
                            borderRadius="md"
                            onClick={toggleUserStatus}
                            fontSize="10px"
                        >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <IconButton 
                            icon={<EditIcon />} 
                            onClick={onEditOpen} 
                            colorScheme="blue" 
                            variant="outline"
                            aria-label="Edit user" 
                            size="xs" 
                            borderRadius="md"
                        />
                        <IconButton 
                            icon={<DeleteIcon />} 
                            onClick={onDeleteOpen} 
                            colorScheme="red" 
                            variant="outline"
                            aria-label="Delete user" 
                            size="xs" 
                            borderRadius="md"
                        />
                    </HStack>
                </HStack>
            </VStack>

            <UserDetailDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setDrawerOpen(false)} 
                user={user} 
                onUserUpdated={() => fetchUsers(true)}
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
                                <option value="customerservice">Customer Service</option>
                                <option value="sales">Sales</option>
                                <option value="salesmanager">Sales Manager</option>
                            <option value="tradextv">tradextv</option>
                            <option value="CustomerSuccessManager">Customer Success Manager</option>
                            <option value="IT">IT</option>
                            <option value="Enisra">Enisra</option>
                            <option value="HR">HR</option>
                            <option value="COO">COO</option>
                            <option value="COO2">COO 2</option>
                            <option value="reception">Reception</option>
                            <option value="tessbinadmin">Tessbin Admin</option>
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

export default memo(UserCard);
