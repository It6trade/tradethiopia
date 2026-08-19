import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { FiChevronDown, FiChevronRight, FiKey, FiLock, FiPower, FiRefreshCw, FiSearch, FiShield, FiUserCheck, FiUserPlus, FiUsers, FiX } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import Layout from "./Layout";

const normalizeRoleValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isCustomerSuccessAccount = (role) => {
  const normalized = normalizeRoleValue(role);
  return normalized === "customerservice" || normalized === "customersuccessmanager" || normalized.includes("customer");
};

const getCustomerRoleLabel = (role) =>
  normalizeRoleValue(role) === "customersuccessmanager"
    ? "Customer Success Manager"
    : "Customer Service";

const getStoredUserId = () => {
  const candidates = ["user", "currentUser", "userInfo", "authUser"];
  for (const key of candidates) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      const user = parsed?.user || parsed;
      if (user?._id || user?.id) return user._id || user.id;
    } catch (error) {
      // Ignore malformed legacy auth records.
    }
  }
  return localStorage.getItem("userId") || "";
};

const CustomerUserManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [accountSearch, setAccountSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(true);
  const formCardRef = useRef(null);

  // Delete User Dialog
  const [deletingUser, setDeletingUser] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelDeleteRef = useRef();

  const [userForm, setUserForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "customerservice",
    status: "active",
  });

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const tableHoverBg = useColorModeValue("gray.50", "gray.750");

  const currentUserId = getStoredUserId();

  const filteredUsers = useMemo(() => {
    const query = (accountSearch || "").trim().toLowerCase();
    return users.filter((user) => {
      const normalizedRole = normalizeRoleValue(user.role || user.roleName);
      const normalizedStatus = (user.status || "inactive").toLowerCase();
      const searchable = [
        user.fullName,
        user.username,
        user.email,
        user.department,
        user.jobTitle,
        getCustomerRoleLabel(user.role),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "csm" && normalizedRole === "customersuccessmanager") ||
        (roleFilter === "cs" && normalizedRole === "customerservice");
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accountSearch, roleFilter, statusFilter, users]);

  const normalizeUsersResponse = (payload) => {
    const raw =
      (Array.isArray(payload) && payload) ||
      payload?.users ||
      payload?.data ||
      [];
    return Array.isArray(raw) ? raw : [];
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users");
      const customerUsers = normalizeUsersResponse(res.data)
        .filter((u) => isCustomerSuccessAccount(u.role || u.roleName))
        .sort((a, b) =>
          (a.fullName || a.username || a.email || "").localeCompare(
            b.fullName || b.username || b.email || ""
          )
        );
      setUsers(customerUsers);
    } catch (err) {
      toast({
        title: "Failed to load customer users",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetUserForm = () => {
    setUserForm({
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "customerservice",
      status: "active",
    });
    setEditingUserId(null);
  };

  const startUserEdit = (user) => {
    setEditingUserId(user._id);
    setIsFormOpen(true);
    setUserForm({
      username: user.username || "",
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      role:
        normalizeRoleValue(user.role) === "customersuccessmanager"
          ? "CustomerSuccessManager"
          : "customerservice",
      status: user.status || "active",
    });
    window.setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    toast({
      title: "Edit mode opened",
      description: `Updating ${user.fullName || user.username || user.email}.`,
      status: "info",
      duration: 2000,
    });
  };

  const saveCustomerUser = async (e) => {
    e?.preventDefault?.();
    if (!userForm.username.trim() || !userForm.email.trim() || (!editingUserId && !userForm.password.trim())) {
      toast({
        title: "Missing account details",
        description: "Username, email, and password are required for new users.",
        status: "warning",
      });
      return;
    }

    setSavingUser(true);
    const role = userForm.role;
    const payload = {
      username: userForm.username.trim(),
      fullName: userForm.fullName.trim() || userForm.username.trim(),
      email: userForm.email.trim().toLowerCase(),
      role,
      status: userForm.status,
      department: "Customer Success",
      infoStatus: userForm.status,
    };

    if (userForm.password && userForm.password.trim()) {
      payload.password = userForm.password.trim();
    }

    try {
      if (editingUserId) {
        await axiosInstance.put(`/users/${editingUserId}`, payload);
        toast({
          title: "User updated",
          description: "Customer service account updated successfully.",
          status: "success",
        });
      } else {
        await axiosInstance.post("/users", payload);
        toast({
          title: "User created",
          description: "New customer service account registered successfully.",
          status: "success",
        });
      }
      resetUserForm();
      await fetchUsers();
    } catch (err) {
      toast({
        title: editingUserId ? "Update failed" : "Creation failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSavingUser(false);
    }
  };

  const updateUserInline = async (user, updates) => {
    try {
      await axiosInstance.put(`/users/${user._id}`, updates);
      await fetchUsers();
      toast({ title: "Account updated", status: "success", duration: 2000 });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = passwordDrafts[user._id];
    if (!newPassword || newPassword.trim().length < 4) {
      toast({ title: "Password must be at least 4 characters", status: "warning", duration: 2500 });
      return;
    }
    try {
      await axiosInstance.put(`/users/${user._id}`, { password: newPassword });
      setPasswordDrafts((prev) => ({ ...prev, [user._id]: "" }));
      toast({
        title: "Password updated",
        description: `New password set for ${user.username || user.email}`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error.response?.data?.message || error.message,
        status: "error",
      });
    }
  };

  const openDeleteDialog = (user) => {
    if (String(user._id) === String(currentUserId)) {
      toast({
        title: "Action restricted",
        description: "You cannot delete your own signed-in account.",
        status: "warning",
      });
      return;
    }
    setDeletingUser(user);
    onDeleteOpen();
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser?._id) return;
    try {
      await axiosInstance.delete(`/users/${deletingUser._id}`);
      onDeleteClose();
      setDeletingUser(null);
      await fetchUsers();
      toast({ title: "User removed successfully", status: "info", duration: 2500 });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  return (
    <Layout>
      <Box w="100%" minH="100vh" p={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch" w="100%">
          {/* Header Banner - Full Screen */}
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} flexWrap="wrap" w="100%">
            <HStack spacing={3}>
              <Box p={2.5} bg="blue.500" color="white" borderRadius="xl" boxShadow="sm">
                <FiUsers size={24} />
              </Box>
              <Box>
                <Heading size="lg">Customer User Management</Heading>
                <Text color={mutedColor} fontSize="sm">
                  Create, configure roles, reset credentials, and govern Customer Service & CSM staff accounts.
                </Text>
              </Box>
            </HStack>

            <HStack spacing={3}>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                {users.length} Active CS Accounts
              </Badge>
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<FiUserPlus />}
                onClick={() => {
                  resetUserForm();
                  setIsFormOpen(true);
                  window.setTimeout(() => {
                    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
              >
                New Account
              </Button>
              <IconButton
                aria-label="Refresh user list"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={fetchUsers}
                isLoading={loading}
              />
            </HStack>
          </Flex>

          {/* Account Creation / Edit Form */}
          <Card ref={formCardRef} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm" w="100%">
            <CardHeader pb={2} pt={4} px={5}>
              <Flex justify="space-between" align="center">
                <HStack spacing={2}>
                  <Icon as={editingUserId ? EditIcon : FiUserPlus} color="blue.500" />
                  <Heading size="md">
                    {editingUserId ? "Edit Customer Service Account" : "Register Customer Service Account"}
                  </Heading>
                </HStack>
                <HStack spacing={2}>
                  {editingUserId && (
                    <Button size="xs" variant="ghost" onClick={resetUserForm} leftIcon={<CloseIcon />}>
                      Cancel Edit
                    </Button>
                  )}
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={isFormOpen ? <FiChevronDown /> : <FiChevronRight />}
                    aria-label="Toggle form"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                  />
                </HStack>
              </Flex>
            </CardHeader>
            <Collapse in={isFormOpen} animateOpacity>
              <CardBody px={5} pt={2} pb={5}>
                <form onSubmit={saveCustomerUser} autoComplete="off">
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={3}>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>USERNAME *</Text>
                      <Input
                        size="sm"
                        placeholder="Username"
                        name="cs_new_username_input"
                        autoComplete="off"
                        value={userForm.username}
                        onChange={(e) => handleUserFormChange("username", e.target.value)}
                        required
                      />
                    </Box>

                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>FULL NAME</Text>
                      <Input
                        size="sm"
                        placeholder="Full Name"
                        name="cs_new_fullname_input"
                        autoComplete="off"
                        value={userForm.fullName}
                        onChange={(e) => handleUserFormChange("fullName", e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>EMAIL *</Text>
                      <Input
                        size="sm"
                        type="email"
                        placeholder="Email address"
                        name="cs_new_email_input"
                        autoComplete="off"
                        value={userForm.email}
                        onChange={(e) => handleUserFormChange("email", e.target.value)}
                        required
                      />
                    </Box>

                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>
                        {editingUserId ? "PASSWORD (OPTIONAL)" : "PASSWORD *"}
                      </Text>
                      <Input
                        size="sm"
                        type="password"
                        placeholder={editingUserId ? "Leave blank to keep" : "Temporary password"}
                        name="cs_new_password_input"
                        autoComplete="new-password"
                        value={userForm.password}
                        onChange={(e) => handleUserFormChange("password", e.target.value)}
                        required={!editingUserId}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>ROLE</Text>
                      <Select
                        size="sm"
                        value={userForm.role}
                        onChange={(e) => handleUserFormChange("role", e.target.value)}
                      >
                        <option value="customerservice">Customer Service</option>
                        <option value="CustomerSuccessManager">Customer Success Manager</option>
                      </Select>
                    </Box>

                    <Box display="flex" alignItems="flex-end">
                      <Button
                        size="sm"
                        colorScheme="blue"
                        type="submit"
                        w="100%"
                        isLoading={savingUser}
                        leftIcon={editingUserId ? <CheckIcon /> : <AddIcon />}
                      >
                        {editingUserId ? "Update User" : "Add Account"}
                      </Button>
                    </Box>
                  </SimpleGrid>
                </form>
              </CardBody>
            </Collapse>
          </Card>

          {/* Directory & Management Table - Full Screen */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm" w="100%">
            <CardHeader pb={3} pt={4} px={5}>
              <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} gap={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Heading size="md">Customer Service Staff Directory</Heading>
                  <Badge colorScheme="blue" borderRadius="full" px={2.5}>
                    {filteredUsers.length} Users
                  </Badge>
                </HStack>

                <HStack spacing={2} flexWrap="wrap">
                  <Select
                    size="sm"
                    w="150px"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All CS Roles</option>
                    <option value="cs">Customer Service</option>
                    <option value="csm">Success Managers</option>
                  </Select>

                  <Select
                    size="sm"
                    w="120px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>

                  {/* Clean Non-Autofilled Search Input */}
                  <InputGroup size="sm" maxW="240px">
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search accounts..."
                      name="cs_account_search_unique_field"
                      id="cs_account_search_unique_field"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                    />
                    {accountSearch && (
                      <InputRightElement>
                        <IconButton
                          aria-label="Clear search"
                          icon={<FiX />}
                          size="xs"
                          variant="ghost"
                          onClick={() => setAccountSearch("")}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                </HStack>
              </Flex>
            </CardHeader>

            <CardBody p={0}>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead bg={sidebarBg}>
                    <Tr>
                      <Th>Staff Member</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                      <Th>Reset Password</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loading ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={8}>
                          <Spinner size="md" color="blue.500" />
                          <Text fontSize="xs" color={mutedColor} mt={2}>Loading customer service accounts...</Text>
                        </Td>
                      </Tr>
                    ) : filteredUsers.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={8} color={mutedColor}>
                          No accounts found matching your search.
                        </Td>
                      </Tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <Tr key={user._id || user.email} _hover={{ bg: tableHoverBg }}>
                          <Td>
                            <Text fontWeight="semibold" fontSize="xs">
                              {user.fullName || user.username}
                            </Text>
                            <Text fontSize="2xs" color="gray.500">{user.email}</Text>
                          </Td>

                          <Td>
                            <Select
                              size="xs"
                              w="180px"
                              value={
                                normalizeRoleValue(user.role || user.roleName) === "customersuccessmanager"
                                  ? "CustomerSuccessManager"
                                  : "customerservice"
                              }
                              onChange={(e) => updateUserInline(user, { role: e.target.value })}
                            >
                              <option value="customerservice">Customer Service</option>
                              <option value="CustomerSuccessManager">Customer Success Manager</option>
                            </Select>
                          </Td>

                          <Td>
                            <Select
                              size="xs"
                              w="110px"
                              value={user.status || "active"}
                              colorScheme={user.status === "active" ? "green" : "red"}
                              onChange={(e) => updateUserInline(user, { status: e.target.value })}
                            >
                              <option value="active">🟢 Active</option>
                              <option value="inactive">🔴 Inactive</option>
                            </Select>
                          </Td>

                          <Td>
                            <HStack spacing={1.5} maxW="200px">
                              <Input
                                size="xs"
                                type="password"
                                placeholder="New pass..."
                                autoComplete="new-password"
                                value={passwordDrafts[user._id] || ""}
                                onChange={(e) => setPasswordDrafts({ ...passwordDrafts, [user._id]: e.target.value })}
                              />
                              <Button
                                size="xs"
                                colorScheme="blue"
                                onClick={() => handleResetPassword(user)}
                                isDisabled={!passwordDrafts[user._id]}
                              >
                                Set
                              </Button>
                            </HStack>
                          </Td>

                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <Tooltip label="Edit Details">
                                <IconButton
                                  aria-label="Edit user"
                                  icon={<EditIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => startUserEdit(user)}
                                />
                              </Tooltip>

                              <Tooltip label="Delete Account">
                                <IconButton
                                  aria-label="Delete user"
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => openDeleteDialog(user)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Permanently Delete Account
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete customer service account <strong>"{deletingUser?.fullName || deletingUser?.username || deletingUser?.email}"</strong>? This will revoke all system access.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={confirmDeleteUser}>Delete Account</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

export default CustomerUserManagement;
