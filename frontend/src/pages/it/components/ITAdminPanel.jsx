import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiActivity, FiGrid, FiLock, FiPower, FiShield, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import axiosInstance from '../../../services/axiosInstance';
import { normalizeRole } from '../../../store/user';

const buildTicketRankings = (tasks = []) => {
  const rankings = new Map();
  tasks.forEach((task) => {
    (task.ticketRecords || []).forEach((record) => {
      const key = String(record.staff || record.staffName || 'unknown');
      const item = rankings.get(key) || {
        staffName: record.staffName || 'Unknown staff',
        approvedPoints: 0,
        approvedRecords: 0,
        pendingRecords: 0,
      };
      const isAccomplished = !String(record.outstandingTasks || '').trim();
      if (record.approvalStatus === 'approved' && isAccomplished) {
        item.approvedPoints += Number(record.points) || 0;
        item.approvedRecords += 1;
      } else if (record.approvalStatus !== 'rejected') {
        item.pendingRecords += 1;
      }
      rankings.set(key, item);
    });
  });

  return [...rankings.values()]
    .sort((a, b) => b.approvedPoints - a.approvedPoints || b.approvedRecords - a.approvedRecords)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

export default function ITAdminPanel({ tasks = [], users = [], refreshUsers, initialPanel = 'overview' }) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [auditLog, setAuditLog] = useState([]);
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'IT Staff',
    status: 'active',
    infoStatus: 'active',
  });
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel]);

  useEffect(() => {
    const fetchAuditLog = async () => {
      if (activePanel !== 'audit') return;
      try {
        const response = await axiosInstance.get('/it/audit/all');
        setAuditLog(response.data.data || []);
      } catch (error) {
        toast({ title: 'Audit log unavailable', description: error.response?.data?.message || error.message, status: 'error' });
      }
    };

    fetchAuditLog();
  }, [activePanel, toast]);

  const stats = useMemo(() => ({
    totalTasks: tasks.length,
    activeUsers: users.filter((user) => user.status === 'active').length,
    itUsers: users.filter((user) => normalizeRole(user.role) === 'it' || normalizeRole(user.role).startsWith('it')).length,
    pendingApprovals: tasks.filter((task) => task.approvalStatus === 'pending_approval').length,
  }), [tasks, users]);
  const ticketRankings = useMemo(() => buildTicketRankings(tasks), [tasks]);
  const pendingTicketApprovals = useMemo(() => tasks.reduce((sum, task) => (
    sum + (task.ticketRecords || []).filter((record) => record.approvalStatus === 'pending_approval').length
  ), 0), [tasks]);

  const updateUser = async (user, updates) => {
    try {
      await axiosInstance.put(`/users/${user._id}`, updates);
      await refreshUsers?.();
      toast({ title: 'User updated', status: 'success' });
    } catch (error) {
      toast({ title: 'User update failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.email}?`)) return;
    try {
      await axiosInstance.delete(`/users/${user._id}`);
      await refreshUsers?.();
      toast({ title: 'User deleted', status: 'success' });
    } catch (error) {
      toast({ title: 'Delete failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({ title: 'Username, email, and password are required', status: 'error' });
      return;
    }
    try {
      await axiosInstance.post('/users', newUser);
      setNewUser({ username: '', email: '', password: '', role: 'IT Staff', status: 'active', infoStatus: 'active' });
      await refreshUsers?.();
      toast({ title: 'User created', status: 'success' });
    } catch (error) {
      toast({ title: 'Create user failed', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const adminMenu = [
    { id: 'overview', label: 'Executive Overview', icon: FiGrid },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'audit', label: 'Audit Log', icon: FiActivity },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">IT Manager Control Center</Heading>
        <Text color="gray.500">Executive overview, project management signals, and account controls.</Text>
      </Box>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
        <CardBody>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch">
            <Box
              w={{ base: '100%', lg: '260px' }}
              bg={sidebarBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="xl"
              p={3}
              flexShrink={0}
            >
              <VStack align="stretch" spacing={2}>
                <Text px={3} py={2} fontSize="xs" fontWeight="800" color={mutedColor} textTransform="uppercase">
                  Manager Tools
                </Text>
                {adminMenu.map((item) => (
                  <Button
                    key={item.id}
                    leftIcon={<Icon as={item.icon} />}
                    justifyContent="flex-start"
                    variant="ghost"
                    borderRadius="lg"
                    bg={activePanel === item.id ? activeBg : 'transparent'}
                    colorScheme={activePanel === item.id ? 'blue' : 'gray'}
                    onClick={() => setActivePanel(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </VStack>
            </Box>

            <Box flex="1" minW={0}>
              {activePanel === 'overview' ? (
                <VStack spacing={5} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl"><CardBody><Stat><StatLabel>All Tasks</StatLabel><StatNumber>{stats.totalTasks}</StatNumber></Stat></CardBody></Card>
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl"><CardBody><Stat><StatLabel>Active Users</StatLabel><StatNumber>{stats.activeUsers}</StatNumber></Stat></CardBody></Card>
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl"><CardBody><Stat><StatLabel>IT Users</StatLabel><StatNumber>{stats.itUsers}</StatNumber></Stat></CardBody></Card>
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl"><CardBody><Stat><StatLabel>Pending Approvals</StatLabel><StatNumber>{stats.pendingApprovals}</StatNumber></Stat></CardBody></Card>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                    <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between" mb={3}>
                          <Heading size="md">Ticket Ranking</Heading>
                          <Badge colorScheme="green">{pendingTicketApprovals} pending review</Badge>
                        </HStack>
                        <VStack align="stretch" spacing={2}>
                          {ticketRankings.length === 0 ? (
                            <Text color={mutedColor}>No ticket work has been approved yet.</Text>
                          ) : ticketRankings.slice(0, 5).map((item) => (
                            <Flex key={item.staffName} justify="space-between" align="center" bg={cardBg} borderRadius="lg" p={3}>
                              <HStack>
                                <Badge colorScheme={item.rank === 1 ? 'yellow' : 'blue'} borderRadius="full">#{item.rank}</Badge>
                                <Box>
                                  <Text fontWeight="semibold">{item.staffName}</Text>
                                  <Text fontSize="xs" color={mutedColor}>{item.approvedRecords} approved, {item.pendingRecords} pending</Text>
                                </Box>
                              </HStack>
                              <Badge colorScheme="green">{item.approvedPoints} pts</Badge>
                            </Flex>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                    <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <Heading size="md" mb={2}>Ticket Oversight</Heading>
                        <Text color={mutedColor}>
                          Staff can record completed internal work such as network fixes, hardware maintenance, and software updates. Manager approval turns those records into ranking points.
                        </Text>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                  <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody>
                      <Heading size="md" mb={2}>Administrative Scope</Heading>
                      <Text color={mutedColor}>
                        Use User Management to create accounts, reset credentials, and activate or deactivate access.
                      </Text>
                    </CardBody>
                  </Card>
                </VStack>
              ) : activePanel === 'audit' ? (
                <VStack align="stretch" spacing={5}>
                  <Box>
                    <HStack spacing={3} mb={1}>
                      <Icon as={FiActivity} color="blue.500" />
                      <Heading size="md">Task Audit Log</Heading>
                    </HStack>
                    <Text color={mutedColor}>
                      Tracks task creation, updates, comments, workflow changes, reassignment, reminders, and approvals.
                    </Text>
                  </Box>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Time</Th>
                              <Th>Task</Th>
                              <Th>Action</Th>
                              <Th>Actor</Th>
                              <Th>Note</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {auditLog.length === 0 ? (
                              <Tr>
                                <Td colSpan={5} textAlign="center" py={8} color={mutedColor}>
                                  No audit entries yet.
                                </Td>
                              </Tr>
                            ) : auditLog.slice(0, 100).map((entry) => (
                              <Tr key={entry._id || `${entry.taskId}-${entry.createdAt}-${entry.action}`}>
                                <Td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}</Td>
                                <Td>
                                  <Text fontWeight="semibold">{entry.taskName}</Text>
                                  <Text fontSize="xs" color="gray.500">{entry.projectType}</Text>
                                </Td>
                                <Td>{String(entry.action || '').replaceAll('_', ' ')}</Td>
                                <Td>
                                  <Text>{entry.actorName || 'System'}</Text>
                                  <Text fontSize="xs" color="gray.500">{entry.actorRole}</Text>
                                </Td>
                                <Td>{entry.note || '-'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </VStack>
              ) : (
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <HStack spacing={3} mb={1}>
                      <Icon as={FiShield} color="blue.500" />
                      <Heading size="md">User Management (Account Control)</Heading>
                    </HStack>
                    <Text color={mutedColor}>
                      Complete control over credentials, activation status, roles, account creation, and permanent deletion.
                    </Text>
                  </Box>

                  <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody>
                      <HStack mb={4}>
                        <Icon as={FiUserPlus} color="blue.500" />
                        <Heading size="sm">Create User Account</Heading>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 5 }} spacing={3}>
                        <Input placeholder="Username" value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} />
                        <Input placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
                        <Input placeholder="Password" type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} />
                        <Select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
                          <option value="IT Staff">IT Staff</option>
                          <option value="IT Team Leader">IT Team Leader</option>
                          <option value="IT Manager">IT Manager</option>
                          <option value="admin">Admin</option>
                        </Select>
                        <Button colorScheme="blue" onClick={createUser}>Create</Button>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardBody>
                      <Heading size="sm" mb={4}>All User Accounts</Heading>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>User</Th>
                              <Th>Role</Th>
                              <Th><HStack><Icon as={FiPower} /><Text>Status</Text></HStack></Th>
                              <Th><HStack><Icon as={FiLock} /><Text>Reset Credentials</Text></HStack></Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {users.map((user) => (
                              <Tr key={user._id || user.email}>
                                <Td>
                                  <Text fontWeight="semibold">{user.fullName || user.username}</Text>
                                  <Text fontSize="xs" color="gray.500">{user.email}</Text>
                                </Td>
                                <Td>
                                  <Select size="sm" value={user.role || 'IT Staff'} onChange={(event) => updateUser(user, { role: event.target.value })}>
                                    <option value="IT Staff">IT Staff</option>
                                    <option value="IT Team Leader">IT Team Leader</option>
                                    <option value="IT Manager">IT Manager</option>
                                    <option value="IT">IT</option>
                                    <option value="admin">admin</option>
                                    <option value={user.role}>{user.role}</option>
                                  </Select>
                                </Td>
                                <Td>
                                  <Select size="sm" value={user.status || 'inactive'} onChange={(event) => updateUser(user, { status: event.target.value })}>
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                  </Select>
                                </Td>
                                <Td>
                                  <Input
                                    size="sm"
                                    type="password"
                                    placeholder="New password"
                                    value={passwordDrafts[user._id] || ''}
                                    onChange={(event) => setPasswordDrafts({ ...passwordDrafts, [user._id]: event.target.value })}
                                  />
                                </Td>
                                <Td>
                                  <HStack>
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      leftIcon={<FiLock />}
                                      onClick={() => updateUser(user, { password: passwordDrafts[user._id] })}
                                      isDisabled={!passwordDrafts[user._id]}
                                    >
                                      Reset
                                    </Button>
                                    <Button size="sm" colorScheme="red" variant="outline" leftIcon={<FiTrash2 />} onClick={() => deleteUser(user)}>
                                      Delete
                                    </Button>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </VStack>
              )}
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </VStack>
  );
}
