import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
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
} from '@chakra-ui/react';
import { FiAward, FiCheckCircle, FiClock } from 'react-icons/fi';
import { getUserTaskAliases, isTaskAssignedToUser } from '../utils/itRbac';
import { getTaskTitle } from '../utils/itWorkflow';

export default function ITProfilePanel({ user, persona, tasks = [] }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const assigned = tasks.filter((task) => isTaskAssignedToUser(task, user));
  const completed = assigned.filter((task) => task.status === 'done');
  const points = completed.reduce((sum, task) => sum + (task.featureCount || 1), 0);
  const aliases = getUserTaskAliases(user);
  const ticketRecords = tasks.flatMap((task) => (
    (task.ticketRecords || [])
      .filter((record) => (
        aliases.includes(String(record.staff || '').toLowerCase())
        || aliases.includes(String(record.staffName || '').toLowerCase())
      ))
      .map((record) => ({ ...record, taskTitle: getTaskTitle(task) }))
  ));
  const approvedTicketRecords = ticketRecords.filter((record) => (
    record.approvalStatus === 'approved'
    && !String(record.outstandingTasks || '').trim()
  ));
  const pendingTicketRecords = ticketRecords.filter((record) => record.approvalStatus === 'pending_approval');
  const ticketPoints = approvedTicketRecords.reduce((sum, record) => sum + (Number(record.points) || 0), 0);

  return (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
        <CardBody>
          <HStack spacing={5} align="center">
            <Avatar size="xl" name={user?.username || user?.email} />
            <Box>
              <Heading size="lg">{user?.username || 'IT User'}</Heading>
              <Text color="gray.500">{user?.email}</Text>
              <HStack mt={3}>
                <Badge colorScheme="blue">{persona.label}</Badge>
                <Badge colorScheme="purple">Ticket Rank Ready</Badge>
                <Badge colorScheme={user?.status === 'active' ? 'green' : 'yellow'}>{user?.status || 'unknown'}</Badge>
                <Badge colorScheme={user?.infoStatus === 'active' ? 'green' : 'orange'}>{user?.infoStatus || 'profile pending'}</Badge>
              </HStack>
            </Box>
          </HStack>
          <Divider my={6} />
          <Text color="gray.600">{persona.description}</Text>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Assigned Tasks</StatLabel><StatNumber>{assigned.length}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Completed</StatLabel><StatNumber>{completed.length}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Performance Points</StatLabel><StatNumber>{points}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel><HStack><FiAward /><Text>Ticket Points</Text></HStack></StatLabel><StatNumber>{ticketPoints}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel><HStack><FiClock /><Text>Pending Review</Text></HStack></StatLabel><StatNumber>{pendingTicketRecords.length}</StatNumber></Stat></CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
        <CardBody>
          <HStack mb={4}>
            <FiCheckCircle />
            <Heading size="md">My Ticket Work Record</Heading>
          </HStack>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Task</Th>
                  <Th>Work</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Points</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ticketRecords.length === 0 ? (
                  <Tr><Td colSpan={5} textAlign="center" py={6} color="gray.500">No ticket work recorded yet.</Td></Tr>
                ) : ticketRecords.slice(0, 12).map((record) => (
                  <Tr key={record._id || `${record.taskTitle}-${record.createdAt}`}>
                    <Td>{record.taskTitle}</Td>
                    <Td>
                      <Badge mr={2}>{record.workType}</Badge>
                      <Text noOfLines={1}>{record.summary}</Text>
                    </Td>
                    <Td>{record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '-'}</Td>
                    <Td>
                      <Badge colorScheme={record.approvalStatus === 'approved' ? 'green' : record.approvalStatus === 'rejected' ? 'red' : 'orange'}>
                        {String(record.approvalStatus || 'pending_approval').replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td>{record.approvalStatus === 'approved' ? record.points || 0 : '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );
}
