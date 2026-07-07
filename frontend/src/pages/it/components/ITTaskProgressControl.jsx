import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Progress,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { normalizeRole, useUserStore } from '../../../store/user';

const STEPS = [0, 25, 50, 75, 100];

const progressColor = (value) => {
  if (value >= 100) return 'green';
  if (value >= 75) return 'teal';
  if (value >= 50) return 'blue';
  if (value >= 25) return 'orange';
  return 'gray';
};

export default function ITTaskProgressControl({ task, fetchTasks, onUpdated, minW = '220px', label = 'Staff progress' }) {
  const initial = Number(task.progressPercent ?? (task.status === 'done' ? 100 : 0));
  const [localProgress, setLocalProgress] = useState(initial);
  const [savingStep, setSavingStep] = useState(null);
  const { currentUser } = useUserStore();
  const token = currentUser?.token;
  const normalizedRole = normalizeRole(currentUser?.role || currentUser?.displayRole || '');
  const canEditProgress = normalizedRole === 'it' || normalizedRole === 'itstaff';
  const toast = useToast();
  const trackBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const stepBg = useColorModeValue('white', 'gray.800');
  const activeShadow = useColorModeValue('0 8px 20px rgba(49, 130, 206, 0.25)', '0 8px 20px rgba(34, 211, 238, 0.2)');

  useEffect(() => {
    setLocalProgress(initial);
  }, [initial, task._id, task.id]);

  const updateProgress = async (nextProgress) => {
    if (!canEditProgress) return;

    setLocalProgress(nextProgress);
    setSavingStep(nextProgress);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${task._id || task.id}`, {
        progressPercent: nextProgress,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated?.(response.data?.data);
      await fetchTasks?.();
      toast({
        title: `Progress updated to ${nextProgress}%`,
        status: 'success',
        duration: 1600,
        isClosable: true,
      });
    } catch (error) {
      setLocalProgress(initial);
      toast({
        title: 'Progress update failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setSavingStep(null);
    }
  };

  return (
    <Box minW={minW}>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="800" color={`${progressColor(localProgress)}.500`}>
          {localProgress}% complete
        </Text>
        {canEditProgress ? (
          <Text fontSize="xs" color="gray.500">
            {label}
          </Text>
        ) : (
          <Badge colorScheme="gray" borderRadius="full">
            View only
          </Badge>
        )}
      </HStack>
      <Progress
        value={localProgress}
        colorScheme={progressColor(localProgress)}
        bg={trackBg}
        borderRadius="full"
        size="sm"
        hasStripe={localProgress > 0 && localProgress < 100}
        isAnimated
        transition="all 0.35s ease"
      />
      {canEditProgress && (
        <HStack spacing={1.5} mt={2} wrap="wrap">
          {STEPS.map((step) => {
            const isActive = step === localProgress;
            const isPassed = step <= localProgress;
            return (
              <Tooltip key={step} label={`Set progress to ${step}%`} hasArrow>
                <Button
                  size="xs"
                  minW="38px"
                  h="28px"
                  borderRadius="full"
                  bg={isActive ? `${progressColor(step)}.500` : stepBg}
                  color={isActive ? 'white' : isPassed ? `${progressColor(localProgress)}.600` : 'gray.500'}
                  border="1px solid"
                  borderColor={isPassed ? `${progressColor(localProgress)}.300` : 'gray.200'}
                  boxShadow={isActive ? activeShadow : 'none'}
                  transform={isActive ? 'translateY(-1px)' : 'none'}
                  transition="all 0.18s ease"
                  isLoading={savingStep === step}
                  onClick={() => updateProgress(step)}
                >
                  {step}
                </Button>
              </Tooltip>
            );
          })}
        </HStack>
      )}
    </Box>
  );
}
