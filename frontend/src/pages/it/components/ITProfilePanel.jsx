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
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { isTaskAssignedToUser } from '../utils/itRbac';

export default function ITProfilePanel({ user, persona, tasks = [] }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const assigned = tasks.filter((task) => isTaskAssignedToUser(task, user));
  const completed = assigned.filter((task) => task.status === 'done');
  const points = completed.reduce((sum, task) => sum + (task.featureCount || 1), 0);

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
                <Badge colorScheme={user?.status === 'active' ? 'green' : 'yellow'}>{user?.status || 'unknown'}</Badge>
                <Badge colorScheme={user?.infoStatus === 'active' ? 'green' : 'orange'}>{user?.infoStatus || 'profile pending'}</Badge>
              </HStack>
            </Box>
          </HStack>
          <Divider my={6} />
          <Text color="gray.600">{persona.description}</Text>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Assigned Tasks</StatLabel><StatNumber>{assigned.length}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Completed</StatLabel><StatNumber>{completed.length}</StatNumber></Stat></CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl">
          <CardBody><Stat><StatLabel>Performance Points</StatLabel><StatNumber>{points}</StatNumber></Stat></CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
}
