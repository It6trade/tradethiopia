import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import InternalTasksTab from './InternalTasksTab';
import ExternalTasksTab from './ExternalTasksTab';

export default function ITProjectWorkspace({ tasks, loading, fetchTasks, permissions, focusedTaskId = '', focusedCommentId = '' }) {
  const [projectType, setProjectType] = useState('internal');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const controlBg = useColorModeValue('gray.50', 'gray.900');
  const accentColor = projectType === 'internal' ? 'blue' : 'purple';

  useEffect(() => {
    if (!focusedTaskId) return;
    const focusedTask = (tasks || []).find((task) => String(task._id || task.id) === String(focusedTaskId));
    if (focusedTask?.projectType && focusedTask.projectType !== projectType) {
      setProjectType(focusedTask.projectType);
    }
  }, [focusedTaskId, projectType, tasks]);

  return (
    <Box>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="14px" boxShadow="sm" mb={6}>
        <CardBody>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }}>
            <Box>
              <Heading size="lg">Project Workspace</Heading>
              <Text color="gray.500" mt={1}>
                Internal and external IT work now live in one consolidated system.
              </Text>
            </Box>
            <HStack minW={{ base: '100%', md: '340px' }} bg={controlBg} p={2} borderRadius="12px" border="1px solid" borderColor={borderColor}>
              <Text fontSize="sm" fontWeight="800" whiteSpace="nowrap" color={`${accentColor}.500`}>
                System
              </Text>
              <Select value={projectType} onChange={(event) => setProjectType(event.target.value)} borderRadius="10px" bg={cardBg} fontWeight="700">
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {projectType === 'internal' ? (
        <InternalTasksTab
          tasks={tasks}
          loading={loading}
          fetchTasks={fetchTasks}
          permissions={permissions}
          focusedTaskId={focusedTaskId}
          focusedCommentId={focusedCommentId}
        />
      ) : (
        <ExternalTasksTab
          tasks={tasks}
          loading={loading}
          fetchTasks={fetchTasks}
          permissions={permissions}
          focusedTaskId={focusedTaskId}
          focusedCommentId={focusedCommentId}
        />
      )}
    </Box>
  );
}
