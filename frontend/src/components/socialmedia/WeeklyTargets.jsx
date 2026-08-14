import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  SimpleGrid,
  Td,
  Text,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon, EditIcon, MinusIcon } from "@chakra-ui/icons";
import { FiCheckCircle } from "react-icons/fi";
import { useState } from "react";
import {
  EmptyStateBlock,
  getProgressColor,
  getStatusInfo,
  PlatformBadge,
  ResponsiveDataView,
  SectionIntro,
  SkeletonCard,
  StatusPill,
  SurfaceCard,
  useSocialStyles,
} from "./SocialMediaPrimitives";

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const toInputDate = (date) => {
  try { return new Date(date).toISOString().split("T")[0]; } catch { return ""; }
};

const WeeklyTargets = ({
  calculatedTargets = [],
  weekRange = {},
  selectedDate,
  onDateChange,
  onAdjustTarget,
  onCompleteTask,
  onReopenTask,
  onEditOpen,
  targetsLoading = false,
  savingPlatform = "",
  dashboardSummary = {},
  setActiveSection,
}) => {
  const { surfaceBorder, muted, softBg, primaryButton, outlineButton, progressTrack } = useSocialStyles();

  if (targetsLoading) {
    return (
      <VStack align="stretch" spacing={4}>
        {[1, 2, 3].map((i) => (<SkeletonCard key={i} lines={3} />))}
      </VStack>
    );
  }

  const columns = ["Platform", "Active Week", "Weekly Target", "Posted", "Remaining", "Status", "Progress", "Edit", "Actions"];

  const renderMobileCard = (row) => {
    const progress = row.progress || 0;
    const colorScheme = row.completed ? "green" : getProgressColor(progress);

    return (
      <SurfaceCard key={row.platform}>
        <Box p={3}>
          <Flex justify="space-between" align="center" mb={2.5}>
            <PlatformBadge platform={row.platform} size="sm" />
            <StatusPill status={row.completed ? "COMPLETED" : (getStatusInfo(progress).status)} colorScheme={colorScheme} />
          </Flex>

          <SimpleGrid columns={3} spacing={2} mb={2.5}>
            <Box textAlign="center" p={1.5} borderRadius="8px" bg={softBg}>
              <Text fontSize="9px" color={muted} fontWeight="700">TARGET</Text>
              <Text fontSize="md" fontWeight="800">{row.weeklyTarget}</Text>
            </Box>
            <Box textAlign="center" p={1.5} borderRadius="8px" bg={softBg}>
              <Text fontSize="9px" color={muted} fontWeight="700">POSTED</Text>
              <Text fontSize="md" fontWeight="800">{row.posted}</Text>
            </Box>
            <Box textAlign="center" p={1.5} borderRadius="8px" bg={softBg}>
              <Text fontSize="9px" color={muted} fontWeight="700">LEFT</Text>
              <Text fontSize="md" fontWeight="800">{row.remaining}</Text>
            </Box>
          </SimpleGrid>

          <HStack justify="space-between" mb={1.5}>
            <Text fontSize="xs" color={muted}>Progress</Text>
            <Text fontSize="xs" fontWeight="700">{progress}%</Text>
          </HStack>
          <Progress value={progress} colorScheme={colorScheme} size="xs" borderRadius="full" bg={progressTrack} mb={3} />

          <HStack spacing={1.5} justify="flex-end">
            <HStack spacing={0.5}>
              <IconButton
                aria-label="Decrease"
                icon={<MinusIcon />}
                size="xs"
                variant="ghost"
                borderRadius="6px"
                isDisabled={savingPlatform === row.platform}
                onClick={() => onAdjustTarget(row.platform, -1)}
              />
              <IconButton
                aria-label="Increase"
                icon={<AddIcon />}
                size="xs"
                variant="ghost"
                borderRadius="6px"
                isDisabled={savingPlatform === row.platform}
                onClick={() => onAdjustTarget(row.platform, 1)}
              />
            </HStack>
            <Button
              size="xs"
              variant="outline"
              leftIcon={<EditIcon />}
              borderRadius="8px"
              onClick={() => onEditOpen(row)}
              {...outlineButton}
            >
              Edit
            </Button>
            {row.completed ? (
              <Badge colorScheme="green" variant="subtle" px={2.5} py={1} borderRadius="8px" fontSize="xs" display="flex" alignSelf="center">
                ✓ Achieved
              </Badge>
            ) : (
              <Button
                size="xs"
                colorScheme="teal"
                variant="solid"
                leftIcon={<AddIcon fontSize="9px" />}
                borderRadius="8px"
                onClick={() => {
                  localStorage.setItem("sm_auto_add_post_platform", row.platform);
                  if (setActiveSection) {
                    setActiveSection("postTracker");
                  }
                }}
              >
                Add Post
              </Button>
            )}
          </HStack>
        </Box>
      </SurfaceCard>
    );
  };

  const renderDesktopRow = (row, _index, { rowProps, cellProps }) => {
    const progress = row.progress || 0;
    const colorScheme = row.completed ? "green" : getProgressColor(progress);

    return (
      <Tr key={row.platform} {...rowProps}>
        <Td {...cellProps}>
          <PlatformBadge platform={row.platform} size="sm" />
        </Td>
        <Td {...cellProps} color={muted} whiteSpace="nowrap">
          {weekRange.start ? `${formatDate(weekRange.start)} – ${formatDate(weekRange.end)}` : "—"}
        </Td>
        <Td {...cellProps}>
          <HStack spacing={1.5}>
            <IconButton
              aria-label="Decrease" icon={<MinusIcon />} size="xs" variant="ghost" borderRadius="8px"
              isDisabled={savingPlatform === row.platform} onClick={() => onAdjustTarget(row.platform, -1)}
            />
            <Text fontWeight="700" minW="16px" textAlign="center" fontSize="xs">{row.weeklyTarget}</Text>
            <IconButton
              aria-label="Increase" icon={<AddIcon />} size="xs" variant="ghost" borderRadius="8px"
              isDisabled={savingPlatform === row.platform} onClick={() => onAdjustTarget(row.platform, 1)}
            />
          </HStack>
        </Td>
        <Td {...cellProps}><Text fontWeight="700" fontSize="xs">{row.posted}</Text></Td>
        <Td {...cellProps}><Text color={muted} fontSize="xs">{row.remaining}</Text></Td>
        <Td {...cellProps}><StatusPill status={row.completed ? "COMPLETED" : getStatusInfo(progress).status} colorScheme={colorScheme} /></Td>
        <Td {...cellProps} minW="140px">
          <VStack align="stretch" spacing={1}>
            <HStack justify="space-between">
              <Text fontSize="10px" color={muted}>Progress</Text>
              <Text fontSize="10px" fontWeight="700">{progress}%</Text>
            </HStack>
            <Progress value={progress} colorScheme={colorScheme} size="xs" borderRadius="full" bg={progressTrack} />
          </VStack>
        </Td>
        <Td {...cellProps}>
          <IconButton aria-label="Edit platform target" size="xs" variant="outline" icon={<EditIcon />} borderRadius="8px" onClick={() => onEditOpen(row)} {...outlineButton} />
        </Td>
        <Td {...cellProps}>
          {row.completed ? (
            <Badge colorScheme="green" variant="subtle" px={2.5} py={1} borderRadius="8px" fontSize="xs" display="inline-block">
              ✓ Achieved
            </Badge>
          ) : (
            <Button
              size="xs"
              colorScheme="teal"
              variant="solid"
              h="24px"
              leftIcon={<AddIcon fontSize="9px" />}
              borderRadius="8px"
              onClick={() => {
                localStorage.setItem("sm_auto_add_post_platform", row.platform);
                if (setActiveSection) {
                  setActiveSection("postTracker");
                }
              }}
            >
              Add Post
            </Button>
          )}
        </Td>
      </Tr>
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro
            eyebrow="Operations"
            title="Weekly platform targets"
            description="Track target attainment, remaining capacity, and completion across each channel."
            actions={[
              <FormControl key="week" maxW={{ base: "100%", md: "180px" }} size="sm">
                <Input type="date" size="sm" h="34px" value={toInputDate(selectedDate)} onChange={onDateChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
              </FormControl>,
            ]}
          />

          {/* Summary stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2.5} mt={4}>
            <Box p={2.5} borderRadius="10px" bg={softBg} textAlign="center">
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">TOTAL TARGET</Text>
              <Text fontSize="md" fontWeight="800">{dashboardSummary.totalTarget || 0}</Text>
            </Box>
            <Box p={2.5} borderRadius="10px" bg={softBg} textAlign="center">
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">POSTED</Text>
              <Text fontSize="md" fontWeight="800">{dashboardSummary.totalPosted || 0}</Text>
            </Box>
            <Box p={2.5} borderRadius="10px" bg={softBg} textAlign="center">
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">COMPLETED</Text>
              <Text fontSize="md" fontWeight="800" color="green.500">{dashboardSummary.completedPlatforms || 0}</Text>
            </Box>
            <Box p={2.5} borderRadius="10px" bg={softBg} textAlign="center">
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">RATE</Text>
              <Text fontSize="md" fontWeight="800" color="blue.500">{dashboardSummary.completionRate || 0}%</Text>
            </Box>
          </SimpleGrid>

          <Box mt={4}>
            <ResponsiveDataView
              columns={columns}
              data={calculatedTargets}
              renderCard={renderMobileCard}
              renderRow={renderDesktopRow}
              emptyState={
                <EmptyStateBlock
                  title="No targets configured"
                  description="Platform targets will appear once data is loaded from the backend."
                  badge="No Data"
                />
              }
            />
          </Box>
        </Box>
      </SurfaceCard>
    </VStack>
  );
};

export default WeeklyTargets;
