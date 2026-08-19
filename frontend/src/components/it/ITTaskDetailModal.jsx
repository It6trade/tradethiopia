import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Select,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiUser, FiUsers, FiClock, FiShield } from 'react-icons/fi';
import axios from 'axios';
import { normalizeRole, useUserStore } from '../../store/user';
import { getTaskTitle, getWorkflowMeta } from './utils/itWorkflow';
import ITTaskProgressControl from './ITTaskProgressControl';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export default function ITTaskDetailModal({ isOpen, task, onClose, onDone, focusedCommentId = '' }) {
  const [currentTask, setCurrentTask] = useState(task);
  const [comment, setComment] = useState('');
  const [commentAudience, setCommentAudience] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const focusedCommentRef = useRef(null);
  const { currentUser } = useUserStore();
  const token = currentUser?.token;
  const normalizedRole = normalizeRole(currentUser?.role || currentUser?.displayRole || '');
  const canEditProgress = normalizedRole === 'it' || normalizedRole === 'itstaff';
  const isManager = ['admin', 'itmanager', 'itadmin'].includes(normalizedRole);
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const focusedCommentBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const modalBg = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('linear-gradient(135deg, #eff6ff, #ecfeff)', 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(20,184,166,0.12))');

  useEffect(() => {
    setCurrentTask(task);
    setComment('');
    setCommentAudience('general');
  }, [task]);

  const workflow = getWorkflowMeta(currentTask?.workflowStatus, currentTask?.status);
  const comments = useMemo(() => currentTask?.comments || [], [currentTask]);

  const isExternalSender = useMemo(() => {
    if (!currentTask || currentTask.projectType !== 'external') return false;
    const aliases = [
      currentUser?._id,
      currentUser?.id,
      currentUser?.username,
      currentUser?.fullName,
      currentUser?.email,
    ].filter(Boolean).map((a) => String(a).trim().toLowerCase());
    const req = String(currentTask.requestedBy || '').trim().toLowerCase();
    const created = String(currentTask.createdBy?._id || currentTask.createdBy || '').trim().toLowerCase();
    const submit = String(currentTask.submittedBy?._id || currentTask.submittedBy || '').trim().toLowerCase();
    return Boolean(
      (req && aliases.includes(req)) ||
      (created && aliases.includes(created)) ||
      (submit && aliases.includes(submit))
    );
  }, [currentTask, currentUser]);

  const visibleComments = useMemo(() => {
    if (isManager) return comments;
    if (isExternalSender) {
      return comments.filter((c) => (c.audience || 'general') !== 'staff_manager');
    }
    const currentUserId = String(currentUser?._id || currentUser?.id || '').trim();
    const currentName = String(currentUser?.fullName || currentUser?.username || '').trim().toLowerCase();
    return comments.filter((c) => {
      // Strictly exclude CS comments from IT staff
      if (c.audience === 'cs_manager') return false;

      const authorId = String(c.author?._id || c.author || '').trim();
      const authorName = String(c.authorName || '').trim().toLowerCase();
      const isOwnComment = (authorId && authorId === currentUserId) || (authorName && authorName === currentName);
      const isManagerComment = ['admin', 'itmanager', 'itadmin', 'manager'].includes(
        String(c.authorRole || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      const isStaffAudience = (c.audience || 'general') !== 'cs_manager';
      return isOwnComment || (isManagerComment && isStaffAudience) || c.audience === 'staff_manager';
    });
  }, [comments, isExternalSender, isManager, currentUser]);

  useEffect(() => {
    if (!isOpen || !focusedCommentId) return;
    const timer = setTimeout(() => {
      focusedCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
    return () => clearTimeout(timer);
  }, [focusedCommentId, isOpen, comments.length]);

  const renderCommentList = (items, emptyText) => (
    <VStack align="stretch" spacing={3} mb={4}>
      {items.length === 0 ? (
        <Box bg={subtleBg} borderRadius="12px" p={4}>
          <Text color={muted}>{emptyText}</Text>
        </Box>
      ) : items.map((item) => {
        const isFocusedComment = focusedCommentId && String(item._id) === String(focusedCommentId);
        return (
          <Box
            key={item._id || item.createdAt || item.body}
            ref={isFocusedComment ? focusedCommentRef : null}
            border="1px solid"
            borderColor={isFocusedComment ? 'blue.300' : borderColor}
            borderRadius="12px"
            p={3}
            bg={isFocusedComment ? focusedCommentBg : 'transparent'}
            boxShadow={isFocusedComment ? '0 0 0 3px rgba(59,130,246,0.18)' : 'none'}
          >
            <HStack justify="space-between" align="flex-start">
              <Box>
                <HStack spacing={2} wrap="wrap">
                  <Text fontWeight="800">{item.authorName || 'IT User'}</Text>
                  <Badge size="xs" colorScheme="purple">{item.authorRole || 'Contributor'}</Badge>
                </HStack>
              </Box>
              <Text color={muted} fontSize="xs">{formatDate(item.createdAt)}</Text>
            </HStack>
            <Text mt={2}>{item.body}</Text>
          </Box>
        );
      })}
    </VStack>
  );

  const csComments = useMemo(() => comments.filter((item) => (item.audience || 'general') === 'cs_manager'), [comments]);
  const staffComments = useMemo(() => comments.filter((item) => (item.audience || 'general') !== 'cs_manager'), [comments]);

  const submitComment = async () => {
    if (!currentTask || !comment.trim()) return;
    setIsSaving(true);
    try {
      const selectedAudience = isManager ? commentAudience : (isExternalSender ? 'cs_manager' : 'staff_manager');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/it/${currentTask._id || currentTask.id}/comments`,
        { body: comment.trim(), audience: selectedAudience },
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

  const canPostComment = Boolean(currentTask);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="22px" bg={modalBg} maxW={{ base: '94vw', lg: '1040px' }} maxH="92vh" overflow="hidden">
        <ModalHeader bg={headerBg} borderBottom="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme={currentTask.projectType === 'external' ? 'purple' : 'blue'}>
                {currentTask.projectType || 'IT'}
              </Badge>
              <Badge colorScheme={workflow.color}>{workflow.label}</Badge>
              {currentTask.urgent && <Badge colorScheme="red">Urgent</Badge>}
            </HStack>
            <Heading size={{ base: 'md', md: 'lg' }}>{getTaskTitle(currentTask)}</Heading>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={5}>
          <VStack align="stretch" spacing={4}>
            <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px" boxShadow="sm">
              <CardBody>
                <HStack justify="space-between" align="flex-start" mb={3} wrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight="800">Task Progress</Text>
                  </Box>
                </HStack>
                <ITTaskProgressControl
                  task={currentTask}
                  fetchTasks={onDone}
                  onUpdated={(updatedTask) => {
                    if (updatedTask) setCurrentTask(updatedTask);
                  }}
                />
              </CardBody>
            </Card>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px">
                <CardBody>
                  <Text color={muted} fontSize="sm">Assigned Lead</Text>
                  <HStack mt={1}>
                    <Icon as={FiUser} color="blue.500" />
                    <Text fontWeight="800">{currentTask.taskLeader || 'Not assigned'}</Text>
                  </HStack>
                </CardBody>
              </Card>

              <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px">
                <CardBody>
                  <Text color={muted} fontSize="sm">Assigned Staff</Text>
                  <HStack mt={1}>
                    <Icon as={FiUsers} color="teal.500" />
                    <Text fontWeight="800">
                      {(currentTask.assignedTo || []).join(', ') || 'No staff assigned'}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>

              <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px">
                <CardBody>
                  <Text color={muted} fontSize="sm">Requested By</Text>
                  <HStack mt={1}>
                    <Icon as={FiClock} color="purple.500" />
                    <Text fontWeight="800">
                      {currentTask.requestedBy || currentTask.requestedDepartment || 'N/A'}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px">
              <CardBody>
                <Heading size="sm" mb={3}>Task Metadata</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
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
              </CardBody>
            </Card>

            {currentTask.progressNote && (
              <Box>
                <Text color={muted} fontSize="sm">Progress Note</Text>
                <Text>{currentTask.progressNote}</Text>
              </Box>
            )}

            <Divider />

            <Card borderColor={borderColor} borderWidth="1px" borderRadius="18px">
              <CardBody>
              <Heading size="sm" mb={3}>Comments & Updates</Heading>
              {isManager && currentTask.projectType === 'external' ? (
                <VStack align="stretch" spacing={4} mb={4}>
                  <Box>
                    <HStack mb={2}>
                      <Badge colorScheme="purple">Customer Service Channel</Badge>
                      <Text fontWeight="700" fontSize="sm">Discussion with CS Sender ({currentTask.requestedBy || 'Sender'})</Text>
                    </HStack>
                    {renderCommentList(csComments, 'No Customer Service messages yet.')}
                  </Box>

                  <Divider />

                  <Box>
                    <HStack mb={2}>
                      <Badge colorScheme="blue">IT Staff Channel</Badge>
                      <Text fontWeight="700" fontSize="sm">Internal IT Team Discussion</Text>
                    </HStack>
                    {renderCommentList(staffComments, 'No internal staff updates yet.')}
                  </Box>
                </VStack>
              ) : (
                renderCommentList(visibleComments, 'No comments or discussion yet on this task.')
              )}

              {canPostComment && (
                <FormControl mt={3}>
                  <FormLabel fontSize="sm" fontWeight="700">Add Comment</FormLabel>
                  {isManager && (
                    <Box mb={2}>
                      <Text fontSize="xs" color={muted} mb={1}>Send comment to:</Text>
                      <Select
                        size="sm"
                        value={commentAudience}
                        onChange={(event) => setCommentAudience(event.target.value)}
                        borderRadius="md"
                      >
                        <option value="cs_manager">Customer Service (Send to CS Sender)</option>
                        <option value="staff_manager">Staff and Manager (Internal IT Staff)</option>
                      </Select>
                    </Box>
                  )}
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={
                      isManager
                        ? (commentAudience === 'cs_manager' ? "Write message to Customer Service sender..." : "Write update to internal IT staff...")
                        : "Share feedback, progress, blockers, or updates..."
                    }
                    minH="90px"
                  />
                </FormControl>
              )}
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>Close</Button>
          {canPostComment && (
            <Button colorScheme="blue" onClick={submitComment} isLoading={isSaving} isDisabled={!comment.trim()}>
              Add Comment
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
