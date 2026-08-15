// File: src/pages/HomePage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Flex,
  Text,
  Heading,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  Button,
  IconButton,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Avatar,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Divider,
  useColorModeValue,
  useToast,
  Skeleton,
  Stack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  CloseButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  InputRightElement
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiPlus,
  FiDownload,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronRight,
  FiEdit,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiKey,
  FiMail,
  FiUser,
  FiTrash2,
  FiPrinter,
  FiAlertCircle,
  FiActivity,
  FiFile,
  FiMoreVertical,
  FiLock
} from 'react-icons/fi';
import { useUserStore } from '../store/user.js';
import { normalizeRole } from '../store/user.js';
import CreatePage from './CreatePage';
import UserDetailDrawer from '../components/UserDetailDrawer.jsx';

// Helper function to calculate user profile completeness level
const calculateCompleteness = (u) => {
  if (!u) return null;
  const recordCompleteness = Number(u.employeeRecordCompleteness);
  return Number.isFinite(recordCompleteness) && u.employeeRecordCompleteness !== null
    ? recordCompleteness
    : null;
};

const getEmployeeId = (u) =>
  u?.digitalId || `TE-${String(u?._id || '').slice(-6).toUpperCase()}`;

// Helper function to find missing documents for alerts
const getMissingItems = (u) => {
  const missing = [];
  if (!u) return missing;
  if (!u.photo && !u.photoUrl) missing.push("profile photo");
  if (!u.guarantorFile && !u.guarantorFileUrl) missing.push("guarantor document");
  return missing;
};

const HomePage = () => {
  const { fetchUsers, users, loading, error, updateUser, deleteUser, currentUser } = useUserStore();
  const isHrUser = normalizeRole(currentUser?.role || currentUser?.displayRole) === 'hr';
  
  // Selection & Selection state
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Tab control in Details Panel
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Filters & Page options
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail panel editable input fields state
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('full-time');
  const [editSalary, setEditSalary] = useState(0);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editEducation, setEditEducation] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  // Toggle Switches state
  const [accountAccess, setAccountAccess] = useState(true);
  const [trainingAccess, setTrainingAccess] = useState(true);
  const [examBypass, setExamBypass] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Modals / Drawers controllers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  
  // Edit Account Modal State
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editAccountForm, setEditAccountForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'employee',
    status: 'active',
  });

  const toast = useToast();

  const handleOpenEditAccountModal = (u) => {
    setUserToEdit(u);
    setEditAccountForm({
      username: u?.username || '',
      email: u?.email || '',
      password: '',
      fullName: u?.fullName || '',
      role: u?.role || 'employee',
      status: u?.status || 'active',
    });
    setShowEditPassword(false);
    setIsEditAccountOpen(true);
  };

  const handleSaveAccountEdit = async () => {
    if (!userToEdit) return;
    setIsSavingAccount(true);
    try {
      const payload = {
        username: editAccountForm.username,
        email: editAccountForm.email,
        fullName: editAccountForm.fullName,
        role: editAccountForm.role,
        status: editAccountForm.status,
      };
      if (editAccountForm.password && editAccountForm.password.trim() !== '') {
        payload.password = editAccountForm.password;
      }
      const res = await updateUser(userToEdit._id, payload);
      if (res.success) {
        toast({
          title: "Account Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsEditAccountOpen(false);
        setUserToEdit(null);
        if (selectedUser?._id === userToEdit._id) {
          setSelectedUser((prev) => ({ ...prev, ...(res.data || payload) }));
        }
        fetchUsers(true);
      } else {
        toast({
          title: "Failed to Update Account",
          description: res.message || "Could not update account credentials",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Failed to Update Account",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const openEmployeeDetails = useCallback((employee, tab = 0) => {
    if (!isHrUser) {
      toast({
        title: 'HR access required',
        description: 'Complete employee details are restricted to HR personnel.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    setActiveTabIdx(tab);
    setSelectedUser(employee);
  }, [isHrUser, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load selected user parameters into details panel input states
  useEffect(() => {
    if (selectedUser) {
      setEditJobTitle(selectedUser.jobTitle || '');
      setEditEmploymentType(selectedUser.employmentType || 'full-time');
      setEditSalary(selectedUser.salary || 0);
      setEditPhone(selectedUser.phone || '');
      setEditAddress(selectedUser.address || '');
      setEditGender(selectedUser.gender || 'Male');
      setEditEducation(selectedUser.education || '');
      setEditLanguages(selectedUser.languages || 'English, Amharic');
      setEditRole(selectedUser.role || '');
      setEditStatus(selectedUser.status || 'active');
      setAccountAccess(selectedUser.status === 'active');
      const normalizedTrainingStatus = String(selectedUser.trainingStatus || '').trim().toLowerCase();
      setTrainingAccess(['on', 'active', 'approved', 'enabled', 'true'].includes(normalizedTrainingStatus));
      setExamBypass(Boolean(selectedUser.examBypass));
      setTwoFactorAuth(selectedUser.twoFactorAuth === true);
    }
  }, [selectedUser]);

  // Bulk selectors
  const handleSelectToggle = (userId, e) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllToggle = (e) => {
    if (e.target.checked) {
      const allIds = filteredUsers.map(u => u._id);
      setSelectedUserIds(new Set(allIds));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedUserIds.size === 0) return;
    const targetStatus = actionType === 'activate' ? 'active' : 'inactive';
    try {
      const promises = Array.from(selectedUserIds).map(uid => {
        const found = users.find(u => u._id === uid);
        return updateUser(uid, { ...found, status: targetStatus });
      });
      await Promise.all(promises);
      toast({
        title: "Bulk Action Success",
        description: `Updated status for ${selectedUserIds.size} accounts.`,
        status: "success",
        duration: 4000
      });
      setSelectedUserIds(new Set());
      fetchUsers(true);
    } catch (err) {
      toast({
        title: "Bulk Action Failed",
        description: err.message,
        status: "error"
      });
    }
  };

  // Filtered accounts calculations
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (user.username === "." || user.username === "..") return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (user.fullName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.username || '').toLowerCase().includes(term) ||
        (user.digitalId || '').toLowerCase().includes(term) ||
        (user._id || '').toLowerCase().includes(term);
      
      const matchesDept = deptFilter === 'All' || user.jobTitle === deptFilter;
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        matchesStatus = user.status === statusFilter;
      }
      
      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, deptFilter, roleFilter, statusFilter]);

  // Unique select options
  const departments = useMemo(() => {
    const list = new Set(users.map(u => u.jobTitle).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [users]);

  const roles = useMemo(() => {
    const list = new Set(users.map(u => u.role).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [users]);

  // Stats summaries
  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const active = filteredUsers.filter(u => u.status === 'active').length;
    const incomplete = filteredUsers.filter(u => {
      const completeness = calculateCompleteness(u);
      return completeness === null || completeness < 80;
    }).length;
    const suspended = filteredUsers.filter(u => u.status === 'inactive').length;
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
    const suspendedPercent = total > 0 ? Math.round((suspended / total) * 100) : 0;

    return { total, active, incomplete, suspended, activePercent, suspendedPercent };
  }, [filteredUsers]);

  // Paginated user accounts
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;

  // Handle Save User Details updates
  const handleSaveUserDetails = async () => {
    if (!selectedUser) return;
    setIsSavingDetails(true);
    try {
      const payload = {
        ...selectedUser,
        jobTitle: editJobTitle,
        employmentType: editEmploymentType,
        salary: Number(editSalary),
        phone: editPhone,
        address: editAddress,
        gender: editGender,
        education: editEducation,
        languages: editLanguages,
        role: editRole,
        status: accountAccess ? 'active' : 'inactive',
        trainingStatus: trainingAccess ? 'on' : 'off',
        examBypass: Boolean(examBypass),
        twoFactorAuth
      };
      
      const res = await updateUser(selectedUser._id, payload);
      if (res.success) {
        toast({
          title: "Profile Saved",
          description: "Employee details updated successfully.",
          status: "success",
          duration: 3000
        });
        setSelectedUser(payload);
        fetchUsers(true);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      toast({
        title: "Failed to update profile",
        description: err.message,
        status: "error"
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleDeactivateToggle = async () => {
    if (!selectedUser) return;
    const nextStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    try {
      const payload = { ...selectedUser, status: nextStatus };
      const res = await updateUser(selectedUser._id, payload);
      if (res.success) {
        toast({
          title: nextStatus === 'active' ? "Account Activated" : "Account Suspended",
          status: "info"
        });
        setAccountAccess(nextStatus === 'active');
        setSelectedUser(payload);
        fetchUsers(true);
      }
    } catch (err) {
      toast({
        title: "Toggle Action Failed",
        description: err.message,
        status: "error"
      });
    }
  };

  const handleDeleteEmployee = async (uid) => {
    if (window.confirm("Are you sure you want to delete this employee account?")) {
      const res = await deleteUser(uid);
      if (res.success) {
        toast({ title: "Account deleted", status: "success" });
        if (selectedUser?._id === uid) setSelectedUser(null);
        fetchUsers(true);
      }
    }
  };

  return (
    <Box pt={2} px={{ base: 2, md: 4 }} bg={useColorModeValue("gray.50", "gray.900")} minH="100vh">
      
      {/* Top Breadcrumbs & Header Panel */}
      <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="xs" fontWeight="700" color="teal.500" mb={1} textTransform="uppercase">
            HR Workspace / Account Management
          </Text>
          <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.900", "white")} mb={1}>
            Account Management
          </Heading>
          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
            Manage employee profiles, roles, permissions and employment status.
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            variant="outline"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            color={useColorModeValue("gray.700", "gray.300")}
            leftIcon={<FiDownload />}
            borderRadius="xl"
            fontSize="xs"
            fontWeight="700"
            onClick={() => window.print()}
          >
            Export
          </Button>
          <Button
            colorScheme="teal"
            bg="teal.500"
            _hover={{ bg: "teal.600" }}
            borderRadius="xl"
            fontSize="xs"
            fontWeight="700"
            leftIcon={<FiPlus />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create account
          </Button>
        </HStack>
      </Flex>

      {/* Aggregate Counts Statistics Panel */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Box p={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm">
          <HStack spacing={4}>
            <Flex w="44px" h="44px" align="center" justify="center" bg="teal.50" color="teal.500" borderRadius="full">
              <Icon as={FiUsers} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="800" color="gray.800">{stats.total}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="600">Total Accounts</Text>
            </VStack>
          </HStack>
        </Box>

        <Box p={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm">
          <HStack spacing={4}>
            <Flex w="44px" h="44px" align="center" justify="center" bg="green.50" color="green.500" borderRadius="full">
              <Icon as={FiUserCheck} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="800" color="gray.800">{stats.active}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="600">Active ({stats.activePercent}%)</Text>
            </VStack>
          </HStack>
        </Box>

        <Box p={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm">
          <HStack spacing={4}>
            <Flex w="44px" h="44px" align="center" justify="center" bg="orange.50" color="orange.500" borderRadius="full">
              <Icon as={FiAlertCircle} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="800" color="gray.800">{stats.incomplete}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="600">Incomplete Profiles</Text>
            </VStack>
          </HStack>
        </Box>

        <Box p={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm">
          <HStack spacing={4}>
            <Flex w="44px" h="44px" align="center" justify="center" bg="red.50" color="red.500" borderRadius="full">
              <Icon as={FiAlertCircle} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="800" color="gray.800">{stats.suspended}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="600">Suspended ({stats.suspendedPercent}%)</Text>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* Main Content Pane Split (Directory list table on Left / Profile Drawer details on Right) */}
      <Flex gap={6} align="start" flexDir={{ base: "column", lg: "row" }} w="full">
        
        {/* Left Side: Directory Table with Filters */}
        <Box 
          flex={1}
          w="full"
          bg="white" 
          border="1px solid" 
          borderColor="gray.100" 
          borderRadius="2xl" 
          p={5} 
          shadow="sm"
        >
          {/* Filtering Tools Panel */}
          <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
            <HStack spacing={3} flexWrap="wrap" flex={1}>
              <InputGroup size="sm" maxW="280px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search name, email or employee ID..." 
                  borderRadius="xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select 
                placeholder="Department" 
                size="sm" 
                maxW="140px" 
                borderRadius="xl"
                value={deptFilter === 'All' ? '' : deptFilter}
                onChange={(e) => setDeptFilter(e.target.value || 'All')}
              >
                {departments.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>

              <Select 
                placeholder="Role" 
                size="sm" 
                maxW="130px" 
                borderRadius="xl"
                value={roleFilter === 'All' ? '' : roleFilter}
                onChange={(e) => setRoleFilter(e.target.value || 'All')}
              >
                {roles.filter(r => r !== 'All').map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>

              <Select 
                placeholder="Status" 
                size="sm" 
                maxW="120px" 
                borderRadius="xl"
                value={statusFilter === 'All' ? '' : statusFilter}
                onChange={(e) => setStatusFilter(e.target.value || 'All')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </HStack>

            {/* Layout Toggles & Counts Display */}
            <HStack spacing={3}>
              {selectedUserIds.size > 0 && (
                <Select
                  placeholder="Bulk actions"
                  size="sm"
                  w="130px"
                  borderRadius="xl"
                  bg="orange.50"
                  borderColor="orange.200"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAction(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                </Select>
              )}
              <Text fontSize="xs" fontWeight="700" color="gray.400">
                {filteredUsers.length} accounts
              </Text>
              <HStack spacing={1}>
                <IconButton
                  icon={<FiList />}
                  size="sm"
                  variant={viewMode === 'list' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'list' ? 'teal' : 'gray'}
                  borderRadius="xl"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                />
                <IconButton
                  icon={<FiGrid />}
                  size="sm"
                  variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'grid' ? 'teal' : 'gray'}
                  borderRadius="xl"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                />
              </HStack>
            </HStack>
          </Flex>

          {/* Directory Accounts Layout */}
          {loading ? (
            <Stack spacing={3}>
              <Skeleton h="40px" borderRadius="xl" />
              <Skeleton h="40px" borderRadius="xl" />
              <Skeleton h="40px" borderRadius="xl" />
            </Stack>
          ) : filteredUsers.length === 0 ? (
            <Flex align="center" justify="center" py={12} direction="column" gap={2}>
              <Icon as={FiUsers} boxSize={10} color="gray.350" />
              <Text fontWeight="700" color="gray.500">No accounts found.</Text>
            </Flex>
          ) : viewMode === 'list' ? (
            
            // Table view list
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="40px">
                      <Checkbox 
                        isChecked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                        isIndeterminate={selectedUserIds.size > 0 && selectedUserIds.size < filteredUsers.length}
                        onChange={handleSelectAllToggle}
                      />
                    </Th>
                    <Th color="gray.400" fontSize="10px">Employee</Th>
                    <Th color="gray.400" fontSize="10px">Employee ID</Th>
                    <Th color="gray.400" fontSize="10px">Department</Th>
                    <Th color="gray.400" fontSize="10px">Role</Th>
                    <Th color="gray.400" fontSize="10px">Record completeness</Th>
                    <Th color="gray.400" fontSize="10px">Status</Th>
                    <Th color="gray.400" fontSize="10px">Last Active</Th>
                    <Th color="gray.400" fontSize="10px" textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedUsers.map((user, idx) => {
                    const completeness = calculateCompleteness(user);
                    const isSelected = selectedUser?._id === user._id;
                    const initials = (user.fullName || user.username || 'EE').slice(0, 2).toUpperCase();
                    
                    return (
                      <Tr 
                        key={user._id} 
                        onClick={() => openEmployeeDetails(user, 0)}
                        cursor="pointer"
                        bg={isSelected ? "teal.50" : "transparent"}
                        _hover={{ bg: isSelected ? "teal.50" : "gray.50" }}
                        transition="background 0.2s"
                      >
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            isChecked={selectedUserIds.has(user._id)}
                            onChange={(e) => handleSelectToggle(user._id, e)}
                          />
                        </Td>
                        <Td py={3.5}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={user.fullName || user.username} src={user.photoUrl} bg="teal.600" color="white" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" fontWeight="800" color="gray.800">{user.fullName || user.username}</Text>
                              <Text fontSize="10px" color="gray.450">{user.email}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontWeight="700" color="gray.500">{getEmployeeId(user)}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontWeight="700" color="gray.700">{user.jobTitle || 'General'}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="teal" px={2} borderRadius="md" textTransform="none" fontSize="10px" fontWeight="700">
                            {user.role || 'Employee'}
                          </Badge>
                        </Td>
                        <Td w="100px">
                          <HStack spacing={2}>
                            <Text
                              fontSize="10px"
                              fontWeight="700"
                              color={completeness === null ? 'orange.600' : 'gray.600'}
                              title={completeness === null ? 'Refresh required to load record completeness' : undefined}
                            >
                              {completeness === null ? '—' : `${completeness}%`}
                            </Text>
                            <Progress value={completeness ?? 0} size="xs" colorScheme="teal" borderRadius="full" flex={1} />
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={1.5}>
                            <Box w={2} h={2} borderRadius="full" bg={user.status === 'active' ? 'green.400' : 'gray.400'} />
                            <Text fontSize="xs" fontWeight="700" color="gray.700">
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="gray.450" fontWeight="600">Today, 09:15</Text>
                        </Td>
                        <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                          <Menu size="sm">
                            <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" />
                            <MenuList borderRadius="xl" shadow="md">
                              <MenuItem icon={<FiEdit3 />} onClick={() => handleOpenEditAccountModal(user)} fontSize="xs" fontWeight="600">Edit Account</MenuItem>
                              <MenuItem icon={<FiEdit />} onClick={() => openEmployeeDetails(user, 0)} fontSize="xs" fontWeight="600">View Details</MenuItem>
                              <MenuItem icon={<FiLock />} onClick={() => openEmployeeDetails(user, 3)} fontSize="xs" fontWeight="600">Access Details</MenuItem>
                              <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteEmployee(user._id)} fontSize="xs" fontWeight="600">Delete Account</MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          ) : (
            // Grid cards view layout alternative
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {paginatedUsers.map((user, idx) => {
                const completeness = calculateCompleteness(user);
                const isSelected = selectedUser?._id === user._id;
                return (
                  <Box
                    key={user._id}
                    p={4}
                    bg={isSelected ? "teal.50" : "white"}
                    border="1px solid"
                    borderColor={isSelected ? "teal.200" : "gray.200"}
                    borderRadius="2xl"
                    shadow="sm"
                    cursor="pointer"
                    onClick={() => openEmployeeDetails(user, 0)}
                    _hover={{ borderColor: "teal.400" }}
                    position="relative"
                  >
                    <Checkbox
                      position="absolute"
                      top="12px"
                      left="12px"
                      isChecked={selectedUserIds.has(user._id)}
                      onChange={(e) => handleSelectToggle(user._id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Box position="absolute" top="12px" right="12px" onClick={(e) => e.stopPropagation()}>
                      <Menu size="sm">
                        <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" />
                        <MenuList borderRadius="xl" shadow="md">
                          <MenuItem icon={<FiEdit3 />} onClick={() => handleOpenEditAccountModal(user)} fontSize="xs" fontWeight="600">Edit Account</MenuItem>
                          <MenuItem icon={<FiEdit />} onClick={() => openEmployeeDetails(user, 0)} fontSize="xs" fontWeight="600">View Details</MenuItem>
                          <MenuItem icon={<FiLock />} onClick={() => openEmployeeDetails(user, 3)} fontSize="xs" fontWeight="600">Access Details</MenuItem>
                          <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteEmployee(user._id)} fontSize="xs" fontWeight="600">Delete Account</MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                    <VStack spacing={3} align="center" pt={2}>
                      <Avatar size="md" name={user.fullName || user.username} src={user.photoUrl} bg="teal.600" />
                      <VStack align="center" spacing={0.5}>
                        <Text fontSize="sm" fontWeight="800" color="gray.800" textAlign="center">{user.fullName || user.username}</Text>
                        <Text fontSize="10px" color="gray.400" textAlign="center">{user.email}</Text>
                      </VStack>
                      <Badge colorScheme="teal" px={2.5} borderRadius="full" fontSize="10px">
                        {user.role || 'Employee'}
                      </Badge>
                      <HStack w="full" px={2} justify="space-between" fontSize="xs">
                        <Text color="gray.450" fontWeight="600">Record completeness</Text>
                        <Text
                          fontWeight="850"
                          color={completeness === null ? 'orange.600' : 'gray.700'}
                          title={completeness === null ? 'Refresh required to load record completeness' : undefined}
                        >
                          {completeness === null ? '—' : `${completeness}%`}
                        </Text>
                      </HStack>
                      <Progress value={completeness ?? 0} size="xs" colorScheme="teal" w="full" borderRadius="full" />
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}

          {/* Table pagination controller footer */}
          <Divider my={5} borderColor="gray.100" />
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <HStack spacing={2} fontSize="xs" fontWeight="700" color="gray.500">
              <Text>Rows per page</Text>
              <Select 
                size="xs" 
                w="65px" 
                borderRadius="lg"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </Select>
            </HStack>

            <HStack spacing={1}>
              <Button
                size="xs"
                variant="outline"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                borderRadius="lg"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="xs"
                  variant={currentPage === i + 1 ? 'solid' : 'outline'}
                  colorScheme={currentPage === i + 1 ? 'teal' : 'gray'}
                  onClick={() => setCurrentPage(i + 1)}
                  borderRadius="lg"
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                size="xs"
                variant="outline"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                borderRadius="lg"
              >
                Next
              </Button>
            </HStack>
          </Flex>

        </Box>

        {/* Right Side: Account Details Panel Card */}
        {false && (selectedUser ? (
          <Box 
            w={{ base: "full", lg: "380px" }}
            bg="white" 
            border="1px solid" 
            borderColor="gray.150" 
            borderRadius="2xl" 
            shadow="md"
            position="sticky"
            top="80px"
          >
            {/* Detail Panel Header */}
            <Flex justify="space-between" align="center" p={4} bg="teal.800" borderTopRadius="2xl" color="white">
              <VStack align="start" spacing={0}>
                <Text fontSize="md" fontWeight="800">Account details</Text>
                <Text fontSize="10px" color="teal.200">Employee ID: TE-{(users.indexOf(selectedUser) !== -1 ? 1000 + users.indexOf(selectedUser) : 1000)}</Text>
              </VStack>
              <CloseButton size="sm" onClick={() => setSelectedUser(null)} color="white" />
            </Flex>

            {/* Profile summary header */}
            <Box p={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={3}>
                  <Avatar size="md" name={selectedUser.fullName || selectedUser.username} src={selectedUser.photoUrl} bg="teal.600" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="800" color="gray.800">
                      {selectedUser.fullName || selectedUser.username}
                    </Text>
                    <Text fontSize="10px" color="gray.450" maxW="160px" isTruncated>
                      {selectedUser.email}
                    </Text>
                    <Text fontSize="10px" color="gray.500" fontWeight="700">
                      {selectedUser.jobTitle || 'General'}
                    </Text>
                    <Badge colorScheme="green" size="sm" borderRadius="md" px={1.5} py={0.2} mt={1} fontSize="9px">
                      ● Active
                    </Badge>
                  </VStack>
                </HStack>
                
                {/* Circular completeness progress */}
                <CircularProgress 
                  value={calculateCompleteness(selectedUser)} 
                  color="teal.400" 
                  size="60px" 
                  thickness="8px"
                >
                  <CircularProgressLabel fontSize="xs" fontWeight="700">
                    {calculateCompleteness(selectedUser)}%
                  </CircularProgressLabel>
                </CircularProgress>
              </Flex>

              {/* Alert items warning block */}
              {getMissingItems(selectedUser).length > 0 && (
                <Flex 
                  p={2.5} 
                  bg="orange.50" 
                  border="1px solid" 
                  borderColor="orange.100" 
                  borderRadius="xl" 
                  align="center" 
                  gap={2.5}
                  mb={4}
                >
                  <Icon as={FiAlertCircle} color="orange.500" boxSize={4} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="10px" fontWeight="800" color="orange.850">
                      {getMissingItems(selectedUser).length} required items missing
                    </Text>
                    <Text fontSize="9px" color="orange.700">
                      Missing: {getMissingItems(selectedUser).join(' and ')}
                    </Text>
                  </VStack>
                </Flex>
              )}

              {/* Tab options navigation */}
              <Tabs index={activeTabIdx} onChange={(idx) => setActiveTabIdx(idx)} colorScheme="teal" variant="line" isFitted>
                <TabList mb={4}>
                  <Tab fontSize="xs" fontWeight="700">Overview</Tab>
                  <Tab fontSize="xs" fontWeight="700">Access</Tab>
                  <Tab fontSize="xs" fontWeight="700">Docs</Tab>
                  <Tab fontSize="xs" fontWeight="700">Activity</Tab>
                </TabList>
                
                <TabPanels maxH="380px" overflowY="auto" px={1}>
                  
                  {/* Overview tab panel */}
                  <TabPanel p={0}>
                    <VStack align="stretch" spacing={4}>
                      
                      {/* Employment Section */}
                      <Box>
                        <Text fontSize="10px" fontWeight="800" color="teal.600" mb={2.5} textTransform="uppercase">
                          Employment Details
                        </Text>
                        <SimpleGrid columns={2} spacing={3} fontSize="xs">
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Job Title</Text>
                            <Input 
                              size="xs" 
                              value={editJobTitle} 
                              onChange={(e) => setEditJobTitle(e.target.value)} 
                              borderRadius="md"
                            />
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Hire Date</Text>
                            <Text fontWeight="700" color="gray.700" pt={1}>
                              {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Employment Type</Text>
                            <Select 
                              size="xs" 
                              borderRadius="md"
                              value={editEmploymentType}
                              onChange={(e) => setEditEmploymentType(e.target.value)}
                            >
                              <option value="full-time">Full-time</option>
                              <option value="part-time">Part-time</option>
                              <option value="contract">Contract</option>
                              <option value="internship">Internship</option>
                            </Select>
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Salary</Text>
                            <Input 
                              size="xs" 
                              type="number"
                              value={editSalary} 
                              onChange={(e) => setEditSalary(e.target.value)} 
                              borderRadius="md"
                            />
                          </VStack>
                        </SimpleGrid>
                      </Box>
                      
                      <Divider borderColor="gray.100" />

                      {/* Personal Section */}
                      <Box>
                        <Text fontSize="10px" fontWeight="800" color="teal.600" mb={2.5} textTransform="uppercase">
                          Personal & Contact
                        </Text>
                        <SimpleGrid columns={2} spacing={3} fontSize="xs">
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Phone</Text>
                            <Input 
                              size="xs" 
                              value={editPhone} 
                              onChange={(e) => setEditPhone(e.target.value)} 
                              borderRadius="md"
                            />
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Address</Text>
                            <Input 
                              size="xs" 
                              value={editAddress} 
                              onChange={(e) => setEditAddress(e.target.value)} 
                              borderRadius="md"
                            />
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Gender</Text>
                            <Select 
                              size="xs" 
                              borderRadius="md"
                              value={editGender}
                              onChange={(e) => setEditGender(e.target.value)}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </Select>
                          </VStack>
                          <VStack align="start" spacing={0.5}>
                            <Text color="gray.450" fontWeight="600">Education</Text>
                            <Input 
                              size="xs" 
                              value={editEducation} 
                              onChange={(e) => setEditEducation(e.target.value)} 
                              placeholder="Not provided"
                              borderRadius="md"
                            />
                          </VStack>
                        </SimpleGrid>
                      </Box>

                      <Divider borderColor="gray.100" />

                      {/* System Access section toggles */}
                      <Box>
                        <Text fontSize="10px" fontWeight="800" color="teal.600" mb={2.5} textTransform="uppercase">
                          System Access
                        </Text>
                        <VStack align="stretch" spacing={2.5} fontSize="xs">
                          <Flex justify="space-between" align="center">
                            <Text color="gray.500" fontWeight="600">Account access</Text>
                            <Switch size="sm" isChecked={accountAccess} onChange={handleDeactivateToggle} colorScheme="teal" />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text color="gray.500" fontWeight="600">Training access</Text>
                            <Switch size="sm" isChecked={trainingAccess} onChange={(e) => setTrainingAccess(e.target.checked)} colorScheme="teal" />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text color="gray.500" fontWeight="600">Pass Exam & Tutorial</Text>
                              <Text fontSize="9px" color="gray.400">Permit direct dashboard access</Text>
                            </Box>
                            <Switch size="sm" isChecked={examBypass} onChange={(e) => setExamBypass(e.target.checked)} colorScheme="purple" />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text color="gray.500" fontWeight="600">Two-factor authentication</Text>
                            <Switch size="sm" isChecked={twoFactorAuth} onChange={(e) => setTwoFactorAuth(e.target.checked)} colorScheme="teal" />
                          </Flex>
                        </VStack>
                        <Button
                          size="xs"
                          mt={3}
                          colorScheme="teal"
                          variant="outline"
                          w="full"
                          leftIcon={<Icon as={FiEdit3} />}
                          onClick={() => handleOpenEditAccountModal(selectedUser)}
                          borderRadius="lg"
                        >
                          Edit Credentials & Username
                        </Button>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Access tab panel */}
                  <TabPanel p={0}>
                    <VStack align="stretch" spacing={4} fontSize="xs">
                      <Box>
                        <Text color="gray.450" fontWeight="600" mb={1.5}>Security Role</Text>
                        <Select 
                          size="sm" 
                          borderRadius="xl"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                        >
                          <option value="employee">Employee</option>
                          <option value="hr">HR Manager</option>
                          <option value="sales">Sales</option>
                          <option value="it">IT Staff</option>
                          <option value="finance">Finance</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="IT">IT</option>
                          <option value="HR">HR</option>
                        </Select>
                        <Text fontSize="10px" color="gray.400" mt={1}>
                          Roles restrict or allow user credentials access levels across platform dashboards.
                        </Text>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Docs tab panel */}
                  <TabPanel p={0}>
                    <VStack align="stretch" spacing={3} fontSize="xs">
                      <Text fontWeight="800" color="gray.700" mb={1}>Attached Files</Text>
                      
                      {selectedUser.photoUrl ? (
                        <Flex p={2.5} bg="gray.50" borderRadius="xl" justify="space-between" align="center">
                          <HStack spacing={2.5}>
                            <Icon as={FiFile} color="teal.500" boxSize={4} />
                            <Text fontWeight="700">Profile Photo</Text>
                          </HStack>
                          <Button size="xs" colorScheme="teal" variant="ghost" as="a" href={selectedUser.photoUrl} target="_blank">
                            View
                          </Button>
                        </Flex>
                      ) : (
                        <Text fontSize="10px" color="gray.400">No profile photo uploaded.</Text>
                      )}

                      {selectedUser.guarantorFileUrl ? (
                        <Flex p={2.5} bg="gray.50" borderRadius="xl" justify="space-between" align="center">
                          <HStack spacing={2.5}>
                            <Icon as={FiFile} color="teal.500" boxSize={4} />
                            <Text fontWeight="700">Guarantor Document</Text>
                          </HStack>
                          <Button size="xs" colorScheme="teal" variant="ghost" as="a" href={selectedUser.guarantorFileUrl} target="_blank">
                            View
                          </Button>
                        </Flex>
                      ) : (
                        <Text fontSize="10px" color="gray.400">No guarantor file uploaded.</Text>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Activity Log tab panel */}
                  <TabPanel p={0}>
                    <VStack align="stretch" spacing={3} fontSize="xs">
                      <Text fontWeight="800" color="gray.700" mb={1}>Activity Log</Text>
                      <Flex gap={3} align="start">
                        <Icon as={FiActivity} color="teal.500" boxSize={3.5} mt={0.5} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="700">Account updated</Text>
                          <Text fontSize="10px" color="gray.450">Today, 09:15</Text>
                        </VStack>
                      </Flex>
                      <Flex gap={3} align="start">
                        <Icon as={FiLock} color="gray.400" boxSize={3.5} mt={0.5} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="700">User logged in</Text>
                          <Text fontSize="10px" color="gray.450">Today, 08:42</Text>
                        </VStack>
                      </Flex>
                    </VStack>
                  </TabPanel>

                </TabPanels>
              </Tabs>
            </Box>

            {/* Details panel sticky footer actions */}
            <Box p={4} borderTop="1px solid" borderColor="gray.100" bg="gray.50" borderBottomRadius="2xl">
              <HStack spacing={2} justify="end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  leftIcon={<FiPrinter />} 
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="700"
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  colorScheme={selectedUser.status === 'active' ? 'red' : 'green'} 
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="700"
                  onClick={handleDeactivateToggle}
                >
                  {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  size="sm" 
                  colorScheme="teal" 
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="700"
                  isLoading={isSavingDetails}
                  onClick={handleSaveUserDetails}
                >
                  Save changes
                </Button>
              </HStack>
            </Box>
          </Box>
        ) : (
          // Drawer placeholder prompt card on Right
          <Box 
            w={{ base: "full", lg: "380px" }}
            bg="white" 
            border="1px solid" 
            borderColor="gray.100" 
            borderRadius="2xl" 
            p={8}
            shadow="sm"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={3}
            textAlign="center"
            minH="350px"
          >
            <Avatar size="lg" bg="teal.50" color="teal.500" icon={<FiUsers fontSize="28px" />} />
            <VStack spacing={1}>
              <Text fontWeight="800" color="gray.700">No Employee Selected</Text>
              <Text fontSize="xs" color="gray.400">Click any row in the directory list table to view and manage their detailed profile info.</Text>
            </VStack>
          </Box>
        ))}

      </Flex>

      <UserDetailDrawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        initialTab={activeTabIdx}
        onUserUpdated={() => fetchUsers(true)}
      />

      {/* Add Employee Drawer Modal */}
      <Drawer isOpen={isCreateOpen} placement="right" onClose={() => setIsCreateOpen(false)}>
        <DrawerOverlay />
        <DrawerContent maxW="500px">
          <DrawerCloseButton />
          <DrawerHeader fontWeight="800" borderBottomWidth="1px" borderColor="gray.100">
            Create New Employee Account
          </DrawerHeader>
          <DrawerBody>
            <CreatePage onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); fetchUsers(); }} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Edit Account Credentials Modal */}
      <Modal isOpen={isEditAccountOpen} onClose={() => setIsEditAccountOpen(false)} isCentered size="md">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" shadow="2xl">
          <ModalHeader borderBottom="1px solid" borderColor="gray.100" pb={3}>
            <HStack spacing={3}>
              <Flex w="38px" h="38px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiKey} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="gray.800">Edit Account Credentials</Heading>
                <Text fontSize="xs" color="gray.500">Update username, login email, password, role & status</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody py={5}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Full Name</FormLabel>
                <Input
                  borderRadius="xl"
                  size="sm"
                  placeholder="Enter full name"
                  value={editAccountForm.fullName}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, fullName: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Username</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiUser} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    borderRadius="xl"
                    placeholder="Enter username"
                    value={editAccountForm.username}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, username: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Login Email</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiMail} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    borderRadius="xl"
                    placeholder="Enter login email address"
                    value={editAccountForm.email}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, email: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                  New Password <Text as="span" color="gray.400" fontWeight="normal">(Leave blank to keep unchanged)</Text>
                </FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showEditPassword ? 'text' : 'password'}
                    borderRadius="xl"
                    placeholder="Type new password"
                    value={editAccountForm.password}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, password: e.target.value })}
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<Icon as={showEditPassword ? FiEyeOff : FiEye} />}
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      aria-label="Toggle password visibility"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Security Role</FormLabel>
                  <Select
                    size="sm"
                    borderRadius="xl"
                    value={editAccountForm.role}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Manager</option>
                    <option value="sales">Sales</option>
                    <option value="it">IT Staff</option>
                    <option value="finance">Finance</option>
                    <option value="supervisor">Supervisor</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">Account Status</FormLabel>
                  <Select
                    size="sm"
                    borderRadius="xl"
                    value={editAccountForm.status}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Stack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100" pt={3}>
            <HStack spacing={3}>
              <Button size="sm" variant="ghost" onClick={() => setIsEditAccountOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                isLoading={isSavingAccount}
                loadingText="Saving"
                onClick={handleSaveAccountEdit}
              >
                Save Account Changes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default HomePage;
