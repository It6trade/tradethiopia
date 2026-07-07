import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { normalizeRole, useUserStore } from '../../../store/user';
import { getTaskTitle, getWorkflowMeta } from '../utils/itWorkflow';
import ITTaskProgressControl from './ITTaskProgressControl';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export default function ITTaskDetailModal({ isOpen, task, onClose, onDone }) {
  const [currentTask, setCurrentTask] = useState(task);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useUserStore();
  const token = currentUser?.token;
  const normalizedRole = normalizeRole(currentUser?.role || currentUser?.displayRole || '');
  const canEditProgress = normalizedRole === 'it' || normalizedRole === 'itstaff';
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  useEffect(() => {
    setCurrentTask(task);
    setComment('');
  }, [task]);

  const workflow = getWorkflowMeta(currentTask?.workflowStatus, currentTask?.status);
  const comments = useMemo(() => currentTask?.comments || [], [currentTask]);

  const submitComment = async () => {
    if (!currentTask || !comment.trim()) return;
    setIsSaving(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/it/${currentTask._id || currentTask.id}/comments`,
        { body: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentTask(response.data.data || currentTask);
      setComment('');
      await onDone?.();
      toast({ title: 'Comment added', status: 'success' });
    } catch (error) {
      toast({
        title: 'Comment failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTask) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="16px">
        <ModalHeader>
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme={currentTask.projectType === 'external' ? 'purple' : 'blue'}>
                {currentTask.projectType || 'IT'}
              </Badge>
              <Badge colorScheme={workflow.color}>{workflow.label}</Badge>
              {currentTask.urgent && <Badge colorScheme="red">Urgent</Badge>}
            </HStack>
            <Heading size="md">{getTaskTitle(currentTask)}</Heading>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack align="stretch" spacing={5}>
            <Card borderColor={borderColor} borderWidth="1px" borderRadius="14px">
              <CardBody>
                <HStack justify="space-between" align="flex-start" mb={3} wrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight="800">Task Progress</Text>
                    <Text color={muted} fontSize="sm">
                      Update your work in clear 25% milestones.
                    </Text>
                  </Box>
                  <Badge colorScheme={canEditProgress ? 'blue' : 'gray'} borderRadius="full" px={3} py={1}>
                    {canEditProgress ? 'Editable by IT Staff' : 'View only'}
                  </Badge>
                </HStack>
                <ITTaskProgressControl
                  task={currentTask}
                  fetchTasks={onDone}
                  onUpdated={(updatedTask) => {
                    if (updatedTask) setCurrentTask(updatedTask);
                  }}
                  minW="100%"
                  label="Tap a milestone"
                />
                <Text color={muted} fontSize="sm" mt={2}>
                  Current workflow: {workflow.label}
                </Text>
              </CardBody>
            </Card>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box bg={subtleBg} borderRadius="12px" p={4}>
                <Text color={muted} fontSize="sm">Status</Text>
                <Text fontWeight="800">{currentTask.status || 'pending'}</Text>
              </Box>
              <Box bg={subtleBg} borderRadius="12px" p={4}>
                <Text color={muted} fontSize="sm">Points</Text>
                <Text fontWeight="800">{currentTask.featureCount || (currentTask.status === 'done' ? 1 : 0)}</Text>
              </Box>
              <Box bg={subtleBg} borderRadius="12px" p={4}>
                <Text color={muted} fontSize="sm">Approval</Text>
                <Text fontWeight="800">{currentTask.approvalStatus || 'not_submitted'}</Text>
              </Box>
            </SimpleGrid>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <Text color={muted} fontSize="sm">Task Leader</Text>
                <Text fontWeight="700">{currentTask.taskLeader || 'No leader assigned'}</Text>
              </GridItem>
              <GridItem>
                <Text color={muted} fontSize="sm">Assigned To</Text>
                <Text fontWeight="700">{(currentTask.assignedTo || []).join(', ') || 'Unassigned'}</Text>
              </GridItem>
              <GridItem>
                <Text color={muted} fontSize="sm">Start Date</Text>
                <Text fontWeight="700">{formatDate(currentTask.startDate)}</Text>
              </GridItem>
              <GridItem>
                <Text color={muted} fontSize="sm">End Date</Text>
                <Text fontWeight="700">{formatDate(currentTask.endDate)}</Text>
              </GridItem>
              <GridItem>
                <Text color={muted} fontSize="sm">{currentTask.projectType === 'external' ? 'Category' : 'Platform'}</Text>
                <Text fontWeight="700">{currentTask.category || currentTask.platform || 'N/A'}</Text>
              </GridItem>
              <GridItem>
                <Text color={muted} fontSize="sm">Action Type</Text>
                <Text fontWeight="700">{currentTask.actionType || 'N/A'}</Text>
              </GridItem>
            </Grid>

            {currentTask.progressNote && (
              <Box>
                <Text color={muted} fontSize="sm">Progress Note</Text>
                <Text>{currentTask.progressNote}</Text>
              </Box>
            )}

            <Divider />

            <Box>
              <Heading size="sm" mb={3}>Comments & Updates</Heading>
              <VStack align="stretch" spacing={3} mb={4}>
                {comments.length === 0 ? (
                  <Box bg={subtleBg} borderRadius="12px" p={4}>
                    <Text color={muted}>No comments yet.</Text>
                  </Box>
                ) : comments.map((item) => (
                  <Box key={item._id || item.createdAt || item.body} border="1px solid" borderColor={borderColor} borderRadius="12px" p={3}>
                    <HStack justify="space-between" align="flex-start">
                      <Box>
                        <Text fontWeight="800">{item.authorName || 'IT User'}</Text>
                        <Text color={muted} fontSize="xs">{item.authorRole || 'Contributor'}</Text>
                      </Box>
                      <Text color={muted} fontSize="xs">{formatDate(item.createdAt)}</Text>
                    </HStack>
                    <Text mt={2}>{item.body}</Text>
                  </Box>
                ))}
              </VStack>

              <FormControl>
                <FormLabel>Add Comment</FormLabel>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share feedback, progress, blockers, or updates..."
                  minH="100px"
                />
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Close</Button>
          <Button colorScheme="blue" onClick={submitComment} isLoading={isSaving} isDisabled={!comment.trim()}>
            Add Comment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
