import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon, CloseIcon, DeleteIcon } from "@chakra-ui/icons";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import axios from "axios";
import Layout from "./Layout";

const normalizeRoleValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isCustomerSuccessAccount = (role) => {
  const normalized = normalizeRoleValue(role);
  return normalized === "customerservice" || normalized === "customersuccessmanager";
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
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const formCardRef = useRef(null);
  const [userForm, setUserForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "customerservice",
    status: "active",
  });
  const currentUserId = getStoredUserId();
  const filteredUsers = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
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
      const matchesRole = roleFilter === "all" || normalizedRole === roleFilter;
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accountSearch, roleFilter, statusFilter, users]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: getAuthHeaders(),
      });
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
    }, 0);
    toast({
      title: "Edit mode opened",
      description: `Updating ${user.fullName || user.username || user.email}.`,
      status: "info",
      duration: 2000,
    });
  };

  const saveCustomerUser = async () => {
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
      fullName: userForm.fullName.trim(),
      email: userForm.email.trim(),
      role,
      status: userForm.status,
      department: "Customer Success",
      jobTitle:
        normalizeRoleValue(role) === "customersuccessmanager"
          ? "Customer Success Manager"
          : "Customer Service Representative",
    };
    if (userForm.password.trim()) payload.password = userForm.password.trim();

    try {
      if (editingUserId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${editingUserId}`, payload, {
          headers: getAuthHeaders(),
        });
        toast({ title: "Customer user updated", status: "success" });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, payload, {
          headers: getAuthHeaders(),
        });
        toast({ title: "Customer user created", status: "success" });
      }
      resetUserForm();
      await fetchUsers();
    } catch (err) {
      toast({
        title: editingUserId ? "Failed to update user" : "Failed to create user",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSavingUser(false);
    }
  };

  const toggleCustomerUserStatus = async (user) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${user._id}`,
        { status: nextStatus },
        { headers: getAuthHeaders() }
      );
      toast({ title: `User ${nextStatus === "active" ? "activated" : "deactivated"}`, status: "success" });
      await fetchUsers();
    } catch (err) {
      toast({
        title: "Failed to update status",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const resetCustomerUserPassword = async (user) => {
    const password = (passwordDrafts[user._id] || "").trim();
    if (!password) {
      toast({ title: "Enter a new password first", status: "warning" });
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${user._id}`,
        { password },
        { headers: getAuthHeaders() }
      );
      setPasswordDrafts((prev) => ({ ...prev, [user._id]: "" }));
      toast({ title: "Password reset", status: "success" });
    } catch (err) {
      toast({
        title: "Failed to reset password",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const deleteCustomerUser = async (user) => {
    if (user._id === currentUserId) {
      toast({ title: "You cannot delete your own account here", status: "warning" });
      return;
    }
    const confirmed = window.confirm(`Delete ${user.fullName || user.username || user.email}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
        headers: getAuthHeaders(),
      });
      toast({ title: "Customer user deleted", status: "info" });
      await fetchUsers();
    } catch (err) {
      toast({
        title: "Failed to delete user",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  return (
    <Layout>
      <Box bgGradient="linear(to-b, gray.50, white)" minH="100vh" p={{ base: 4, md: 8 }}>
        <Flex align="center" justify="space-between" gap={4} wrap="wrap" mb={6}>
          <Box>
            <Heading size="lg">Customer User Management</Heading>
            <Text color="gray.500" fontSize="sm">
              Manage Customer Service and Customer Success Manager accounts separately from settings.
            </Text>
          </Box>
          <Badge colorScheme="blue" rounded="full" px={3} py={1}>
            {loading ? "Loading..." : `${users.length} accounts`}
          </Badge>
        </Flex>

        <Card ref={formCardRef} border="1px solid" borderColor="gray.200" rounded="2xl" boxShadow="xl" mb={6}>
          <CardHeader pb={2}>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Box>
                <Heading size="md">{editingUserId ? "Edit User" : "Create User"}</Heading>
                <Text color="gray.500" fontSize="sm">
                  Create accounts, reset credentials, and control access status.
                </Text>
              </Box>
              {editingUserId && (
                <Badge colorScheme="orange" rounded="full" px={3} py={1}>
                  Editing {userForm.fullName || userForm.username || userForm.email}
                </Badge>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Stack direction={{ base: "column", xl: "row" }} spacing={3} align="stretch">
                <Input
                  placeholder="Username"
                  name="customer_user_management_username"
                  autoComplete="off"
                  value={userForm.username}
                  onChange={(e) => handleUserFormChange("username", e.target.value)}
                />
                <Input
                  placeholder="Full name"
                  name="customer_user_management_full_name"
                  autoComplete="off"
                  value={userForm.fullName}
                  onChange={(e) => handleUserFormChange("fullName", e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  name="customer_user_management_email"
                  autoComplete="off"
                  value={userForm.email}
                  onChange={(e) => handleUserFormChange("email", e.target.value)}
                />
              </Stack>
              <Stack direction={{ base: "column", lg: "row" }} spacing={3} align="stretch">
                <Input
                  placeholder={editingUserId ? "New password (optional)" : "Password"}
                  type="password"
                  name="customer_user_management_new_password"
                  autoComplete="new-password"
                  value={userForm.password}
                  onChange={(e) => handleUserFormChange("password", e.target.value)}
                />
                <Select value={userForm.role} onChange={(e) => handleUserFormChange("role", e.target.value)}>
                  <option value="customerservice">Customer Service</option>
                  <option value="CustomerSuccessManager">Customer Success Manager</option>
                </Select>
                <Select value={userForm.status} onChange={(e) => handleUserFormChange("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Button
                  colorScheme="blue"
                  leftIcon={editingUserId ? <CheckIcon /> : <AddIcon />}
                  onClick={saveCustomerUser}
                  isLoading={savingUser}
                  minW="150px"
                >
                  {editingUserId ? "Update User" : "Create User"}
                </Button>
                {editingUserId && (
                  <Button variant="ghost" leftIcon={<CloseIcon />} onClick={resetUserForm}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardBody>
        </Card>

        <Card border="1px solid" borderColor="gray.200" rounded="2xl" boxShadow="xl">
          <CardHeader pb={accountsOpen ? 2 : 4}>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Button
                variant="ghost"
                leftIcon={accountsOpen ? <FiChevronDown /> : <FiChevronRight />}
                onClick={() => setAccountsOpen((prev) => !prev)}
                justifyContent="flex-start"
                px={0}
                _hover={{ bg: "transparent", color: "blue.600" }}
              >
                <Box textAlign="left">
                  <Heading size="md">Customer Accounts</Heading>
                  <Text color="gray.500" fontSize="sm" fontWeight="normal">
                    Collapse or expand the full account control table.
                  </Text>
                </Box>
              </Button>
              <HStack spacing={2}>
                <Badge colorScheme="blue" rounded="full" px={3} py={1}>
                  {filteredUsers.length}/{users.length} shown
                </Badge>
                <Badge colorScheme="green" rounded="full" px={3} py={1}>
                  {users.filter((user) => user.status === "active").length} active
                </Badge>
              </HStack>
            </Flex>
          </CardHeader>
          <Collapse in={accountsOpen} animateOpacity>
            <CardBody pt={0}>
              <Stack direction={{ base: "column", lg: "row" }} spacing={3} mb={4}>
                <Input
                  placeholder="Search by name, username, email, department, or role"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  bg="white"
                />
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} maxW={{ base: "100%", lg: "220px" }}>
                  <option value="all">All roles</option>
                  <option value="customerservice">Customer Service</option>
                  <option value="customersuccessmanager">Customer Success Manager</option>
                </Select>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} maxW={{ base: "100%", lg: "180px" }}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAccountSearch("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear
                </Button>
              </Stack>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>User</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                      <Th>Password reset</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={6}>
                          <Text color="gray.500">
                            {users.length === 0
                              ? "No customer service accounts found."
                              : "No accounts match the current search or filters."}
                          </Text>
                        </Td>
                      </Tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <Tr key={user._id} _hover={{ bg: "gray.50" }}>
                          <Td>
                            <Text fontWeight="semibold">{user.fullName || user.username || "Unnamed user"}</Text>
                            <Text color="gray.500" fontSize="xs">
                              {user.email || user.username}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={normalizeRoleValue(user.role) === "customersuccessmanager" ? "purple" : "teal"}>
                              {getCustomerRoleLabel(user.role)}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={user.status === "active" ? "green" : "red"} variant="subtle">
                              {user.status || "inactive"}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Input
                                size="sm"
                                type="password"
                                placeholder="New password"
                                name={`customer_user_management_reset_${user._id}`}
                                autoComplete="new-password"
                                value={passwordDrafts[user._id] || ""}
                                onChange={(e) =>
                                  setPasswordDrafts((prev) => ({ ...prev, [user._id]: e.target.value }))
                                }
                                maxW="180px"
                              />
                              <Button size="sm" variant="outline" onClick={() => resetCustomerUserPassword(user)}>
                                Reset
                              </Button>
                            </HStack>
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={2}>
                              <Button size="sm" variant="outline" onClick={() => startUserEdit(user)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                colorScheme={user.status === "active" ? "orange" : "green"}
                                variant="outline"
                                onClick={() => toggleCustomerUserStatus(user)}
                              >
                                {user.status === "active" ? "Deactivate" : "Activate"}
                              </Button>
                              <IconButton
                                aria-label="Delete customer user"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                isDisabled={user._id === currentUserId}
                                onClick={() => deleteCustomerUser(user)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Collapse>
        </Card>
      </Box>
    </Layout>
  );
};

export default CustomerUserManagement;
