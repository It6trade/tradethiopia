import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import { FiCalendar, FiCheckCircle, FiClock } from "react-icons/fi";
import {
  EmptyStateBlock,
  MetricCard,
  SectionIntro,
  StatusPill,
  SurfaceCard,
  useSocialStyles,
} from "./SocialMediaPrimitives";

const statusToneMap = {
  Draft: { bg: "gray.100", color: "gray.700", colorScheme: "gray" },
  "Pending Review": { bg: "orange.100", color: "orange.700", colorScheme: "orange" },
  Scheduled: { bg: "blue.100", color: "blue.700", colorScheme: "blue" },
  Posted: { bg: "green.100", color: "green.700", colorScheme: "green" },
};

const toInputDate = (date) => {
  try { return new Date(date).toISOString().split("T")[0]; } catch { return ""; }
};

const ContentPlanner = ({
  posts = [],
  selectedDate,
  onDateChange,
  onAddPost,
  onToggleCompletion,
}) => {
  const { surfaceBorder, muted, softBg, primaryButton, outlineButton } = useSocialStyles();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filterDay, setFilterDay] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [newPost, setNewPost] = useState({
    day: "Mon", slot: "9:00 AM", type: "Video", staff: "", approval: "Draft", topic: "", completed: false,
  });

  const plannerStats = useMemo(() => {
    const total = posts.length;
    const completed = posts.filter((p) => p.completed).length;
    const pendingReview = posts.filter((p) => p.approval === "Pending Review").length;
    const scheduled = posts.filter((p) => p.approval === "Scheduled").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pendingReview, scheduled, completionRate };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterDay !== "All" && post.day !== filterDay) return false;
      if (filterStatus !== "All" && post.approval !== filterStatus) return false;
      return true;
    });
  }, [posts, filterDay, filterStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAddPost(newPost);
    setNewPost({ day: "Mon", slot: "9:00 AM", type: "Video", staff: "", approval: "Draft", topic: "", completed: false });
    onClose();
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* ── Stat cards ── */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3.5}>
        <MetricCard
          label="Planner completion"
          value={`${plannerStats.completed}/${plannerStats.total}`}
          subtext="Cards marked complete"
          icon={FiCheckCircle}
          accent="green"
          trend={{ label: `${plannerStats.completionRate}% complete`, positive: plannerStats.completionRate >= 60 }}
          progress={plannerStats.completionRate}
        />
        <MetricCard
          label="Pending approvals"
          value={plannerStats.pendingReview}
          subtext="Posts waiting on review"
          icon={FiClock}
          accent="orange"
          trend={{ label: plannerStats.pendingReview === 0 ? "No blockers" : "Action needed", positive: plannerStats.pendingReview === 0 }}
          progress={plannerStats.total ? Math.max(12, Math.round((plannerStats.pendingReview / plannerStats.total) * 100)) : 0}
        />
        <MetricCard
          label="Scheduled content"
          value={plannerStats.scheduled}
          subtext="Posts already lined up"
          icon={FiCalendar}
          accent="blue"
          trend={{ label: `${plannerStats.total} total slots`, positive: plannerStats.scheduled > 0 }}
          progress={plannerStats.total ? Math.round((plannerStats.scheduled / plannerStats.total) * 100) : 0}
        />
      </SimpleGrid>

      {/* ── Planner section ── */}
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro
            eyebrow="Planning"
            title="Content planner"
            description="Weekly scheduling, ownership, approvals, and completion tracking."
            actions={[
              <FormControl key="week" maxW={{ base: "100%", md: "160px" }}>
                <Input type="date" size="sm" h="34px" value={toInputDate(selectedDate)} onChange={onDateChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
              </FormControl>,
              <Button key="add" size="sm" h="34px" fontSize="xs" leftIcon={<CalendarIcon />} borderRadius="10px" onClick={onOpen} {...primaryButton}>
                New Post
              </Button>,
            ]}
          />

          {/* ── Filters ── */}
          <HStack spacing={2.5} mt={4} flexWrap="wrap">
            <Select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              maxW="120px"
              borderRadius="10px"
              borderColor={surfaceBorder}
              size="sm"
              h="32px"
              fontSize="xs"
            >
              <option value="All">All Days</option>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="150px"
              borderRadius="10px"
              borderColor={surfaceBorder}
              size="sm"
              h="32px"
              fontSize="xs"
            >
              <option value="All">All Statuses</option>
              {["Draft", "Pending Review", "Scheduled", "Posted"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Badge variant="subtle" colorScheme="blue" borderRadius="full" px={2.5} py={0.5} fontSize="10px">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
            </Badge>
          </HStack>

          {/* ── Post Cards ── */}
          {filteredPosts.length === 0 ? (
            <Box mt={4}>
              <EmptyStateBlock
                title="No scheduled posts"
                description={posts.length === 0 ? "Create the first content slot." : "No posts match the current filters."}
                action={
                  <Button size="xs" borderRadius="8px" onClick={onOpen} {...primaryButton}>Create a post</Button>
                }
                badge="Planner Empty"
              />
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3.5} mt={4}>
              {filteredPosts.map((slot, index) => {
                const statusTone = statusToneMap[slot.approval] || statusToneMap.Draft;
                const originalIndex = posts.indexOf(slot);
                return (
                  <SurfaceCard key={`${slot.day}-${slot.slot}-${index}`}>
                    <Box p={3}>
                      <Flex justify="space-between" align="flex-start" gap={2} mb={3}>
                        <Box minW={0}>
                          <HStack spacing={1.5} mb={2}>
                            <Badge borderRadius="full" px={2} py={0.2} fontSize="9px" colorScheme="blue">{slot.day}</Badge>
                            <Badge variant="subtle" borderRadius="full" px={2} py={0.2} fontSize="9px">{slot.slot}</Badge>
                          </HStack>
                          <Heading size="xs" fontWeight="700" noOfLines={1}>{slot.type}</Heading>
                          <Text mt={1} color={muted} fontSize="xs" noOfLines={1}>
                            {slot.topic || "Untitled topic"}
                          </Text>
                        </Box>
                        <Flex
                          w="30px" h="30px" borderRadius="8px" align="center" justify="center"
                          bg={slot.completed ? "green.50" : "blue.50"}
                          color={slot.completed ? "green.600" : "blue.600"}
                          _dark={{ bg: slot.completed ? "green.500" : "blue.500", color: "white" }}
                          flexShrink={0}
                        >
                          <Icon as={slot.completed ? FiCheckCircle : FiCalendar} boxSize={3.5} />
                        </Flex>
                      </Flex>

                      <VStack align="stretch" spacing={2} pt={1} borderTop="1px solid" borderColor={surfaceBorder}>
                        <HStack justify="space-between">
                          <Text color={muted} fontSize="xs">Owner</Text>
                          <Text fontWeight="600" fontSize="xs">{slot.staff || "Unassigned"}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted} fontSize="xs">Approval</Text>
                          <StatusPill status={slot.approval} colorScheme={statusTone.colorScheme} />
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={muted} fontSize="xs">Completed</Text>
                          <Switch size="sm" isChecked={slot.completed} onChange={() => onToggleCompletion(originalIndex)} colorScheme="green" />
                        </HStack>
                      </VStack>
                    </Box>
                  </SurfaceCard>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      </SurfaceCard>

      {/* ── New Post Modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px" boxShadow="0 12px 36px rgba(15,23,42,0.2)">
          <ModalHeader fontSize="md" fontWeight="800">Create New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={2}>
            <VStack spacing={3}>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Day</FormLabel>
                <Select size="sm" name="day" value={newPost.day} onChange={handleInputChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs">
                  {[["Mon","Monday"],["Tue","Tuesday"],["Wed","Wednesday"],["Thu","Thursday"],["Fri","Friday"],["Sat","Saturday"],["Sun","Sunday"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Time Slot</FormLabel>
                <Input size="sm" name="slot" value={newPost.slot} onChange={handleInputChange} placeholder="e.g., 9:00 AM" borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Content Type</FormLabel>
                <Select size="sm" name="type" value={newPost.type} onChange={handleInputChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs">
                  {["Video", "Poster", "Carousel", "Article", "Story", "Live"].map((t) => (
                    <option key={t} value={t}>{t === "Live" ? "Live Stream" : t}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Assigned Staff</FormLabel>
                <Input size="sm" name="staff" value={newPost.staff} onChange={handleInputChange} placeholder="Staff member name" borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Approval Status</FormLabel>
                <Select size="sm" name="approval" value={newPost.approval} onChange={handleInputChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs">
                  {["Draft", "Pending Review", "Scheduled", "Posted"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Topic/Theme</FormLabel>
                <Textarea size="sm" name="topic" value={newPost.topic} onChange={handleInputChange} placeholder="Content topic or theme" borderRadius="10px" borderColor={surfaceBorder} rows={3} fontSize="xs" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button size="sm" mr={3} borderRadius="10px" onClick={handleSubmit} {...primaryButton}>Create Post</Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ContentPlanner;
