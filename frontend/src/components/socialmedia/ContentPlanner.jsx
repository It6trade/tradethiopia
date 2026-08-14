import { useMemo, useState, useEffect } from "react";
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
  IconButton,
  Tooltip,
  useToast,
  Divider,
  Checkbox,
} from "@chakra-ui/react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { FiCalendar, FiCheckCircle, FiClock, FiAlertTriangle, FiBell, FiPlus, FiGrid, FiList, FiTrello } from "react-icons/fi";
import {
  EmptyStateBlock,
  MetricCard,
  SectionIntro,
  StatusPill,
  SurfaceCard,
  useSocialStyles,
  getPlatformBrand,
} from "./SocialMediaPrimitives";
import axiosInstance from "../../services/axiosInstance";

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
  onUpdatePost,
  onDeletePost,
}) => {
  const toast = useToast();
  const { surfaceBorder, muted, softBg, primaryButton, outlineButton } = useSocialStyles();
  
  // Views: 'month' | 'week' | 'list'
  const [viewMode, setViewMode] = useState("month");
  
  // Month Calendar Navigation State
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate || new Date()));
  
  // Week Calendar Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date(selectedDate || new Date());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Modal State for Create/Edit
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Facebook"]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch sales and social media staff
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await axiosInstance.get("/users");
        const allUsers = response.data?.data || response.data || [];
        const filtered = allUsers.filter((u) => {
          const role = (u.role || "").toLowerCase().replace(/[^a-z]/g, "");
          return (
            role.includes("sales") ||
            role.includes("social") ||
            role.includes("marketing") ||
            role.includes("manager") ||
            role === "admin" ||
            role === "hr"
          );
        });
        setSalesUsers(filtered);
      } catch (err) {
        console.error("Failed to fetch staff list", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handlePlatformCheckboxChange = (platform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev; // At least one checked
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };
  
  const [newPost, setNewPost] = useState({
    title: "",
    topic: "",
    description: "",
    type: "Video",
    platform: "Facebook",
    scheduledDate: toInputDate(new Date()),
    slot: "9:00 AM",
    day: "Mon",
    staff: "",
    approval: "Draft",
    completed: false,
  });

  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const todayDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  // Sync currentMonth and currentWeekStart if selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      const nextDate = new Date(selectedDate);
      setCurrentMonth(nextDate);
      
      const day = nextDate.getDay();
      const diff = nextDate.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(nextDate.setDate(diff));
      start.setHours(0, 0, 0, 0);
      setCurrentWeekStart(start);
    }
  }, [selectedDate]);

  // Request browser push notification permissions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Today's incomplete plans for notifications
  const todayIncompletePlans = useMemo(() => {
    const todayString = new Date().toDateString();
    return posts.filter((p) => {
      if (!p.scheduledDate || p.completed) return false;
      return new Date(p.scheduledDate).toDateString() === todayString;
    });
  }, [posts]);

  // Trigger push notifications
  useEffect(() => {
    if (
      todayIncompletePlans.length > 0 &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      !sessionStorage.getItem("hasNotifiedToday")
    ) {
      const bullets = todayIncompletePlans
        .map((p) => `• [${p.platform.toUpperCase()}] ${p.type}: ${p.title || "Untitled"}`)
        .join("\n");
      new Notification("Action Required: Today's Scheduled Content", {
        body: bullets,
        icon: "/favicon.ico",
        requireInteraction: true,
      });
      sessionStorage.setItem("hasNotifiedToday", "true");
    }
  }, [todayIncompletePlans]);

  // Statistics calculation
  const plannerStats = useMemo(() => {
    const total = posts.length;
    const completed = posts.filter((p) => p.completed).length;
    const pendingReview = posts.filter((p) => p.approval === "Pending Review").length;
    const scheduled = posts.filter((p) => p.approval === "Scheduled").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pendingReview, scheduled, completionRate };
  }, [posts]);

  // Filtered posts for rendering
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterPlatform !== "All" && post.platform !== filterPlatform) return false;
      if (filterStatus !== "All" && post.approval !== filterStatus) return false;
      return true;
    });
  }, [posts, filterPlatform, filterStatus]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Week navigation helpers
  const handlePrevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(next);
  };
  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  // Days in Month generator (42 cells standard grid)
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Sunday is 6

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Trailing days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Leading days from next month to make 42 grids
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  // Days in Week generator
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(currentWeekStart.getDate() + i);
      days.push(dayDate);
    }
    return days;
  }, [currentWeekStart]);

  // Drag and Drop handlers
  const handleDragStart = (e, postId) => {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain");
    if (!postId) return;

    const targetDateObj = new Date(targetDate);
    targetDateObj.setHours(0, 0, 0, 0);
    if (targetDateObj < todayDate) {
      toast({
        title: "Rescheduling Restricted",
        description: "You cannot schedule or move content plans to past dates.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const derivedDay = daysOfWeek[targetDate.getDay()];

    if (onUpdatePost) {
      await onUpdatePost(postId, {
        scheduledDate: targetDate.toISOString(),
        day: derivedDay,
      });
    }
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  // Form submission (create/edit)
  const handleSubmit = async () => {
    const targetDateObj = new Date(newPost.scheduledDate || new Date());
    targetDateObj.setHours(0, 0, 0, 0);
    if (targetDateObj < todayDate && !newPost.completed) {
      toast({
        title: "Invalid Date Selected",
        description: "You cannot schedule content plans for past dates.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dateObj = new Date(newPost.scheduledDate || new Date());
    const derivedDay = daysOfWeek[dateObj.getDay()];

    const basePlanData = {
      ...newPost,
      title: newPost.title || newPost.topic || "Untitled Topic",
      topic: newPost.topic || newPost.title || "Untitled Topic",
      day: derivedDay,
    };

    if (isEditing) {
      if (onUpdatePost) {
        await onUpdatePost(editingPostId, basePlanData);
      }
    } else {
      if (onAddPost) {
        // Multi-platform checkbox creation: add separate plan documents in a loop
        for (const platform of selectedPlatforms) {
          await onAddPost({
            ...basePlanData,
            platform,
          });
        }
      }
    }

    resetForm();
    onClose();
  };

  // Trigger editing from card
  const handleEditClick = (post) => {
    setIsEditing(true);
    setEditingPostId(post._id || post.id);
    setNewPost({
      title: post.title || post.topic || "",
      topic: post.topic || post.title || "",
      description: post.description || "",
      type: post.type || "Video",
      platform: post.platform || "Facebook",
      scheduledDate: toInputDate(post.scheduledDate || new Date()),
      slot: post.slot || "9:00 AM",
      staff: post.staff || "",
      approval: post.approval || "Draft",
      completed: post.completed || false,
    });
    setSelectedPlatforms([post.platform || "Facebook"]);
    onOpen();
  };

  // Delete plan card
  const handleDeleteClick = async (postId) => {
    if (window.confirm("Are you sure you want to delete this content plan?")) {
      if (onDeletePost) {
        await onDeletePost(postId);
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingPostId(null);
    setNewPost({
      title: "",
      topic: "",
      description: "",
      type: "Video",
      platform: "Facebook",
      scheduledDate: toInputDate(new Date()),
      slot: "9:00 AM",
      day: "Mon",
      staff: "",
      approval: "Draft",
      completed: false,
    });
    setSelectedPlatforms(["Facebook"]);
  };

  const openCreateModal = () => {
    resetForm();
    onOpen();
  };

  // Card Overdue check
  const isPostExpired = (post) => {
    if (post.completed) return false;
    if (!post.scheduledDate) return false;
    const postDate = new Date(post.scheduledDate);
    postDate.setHours(0, 0, 0, 0);
    return postDate < todayDate;
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Glow pulse animation injected once */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlowRed {
          0% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); border-color: #EF4444; }
          100% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.85); border-color: #F87171; }
        }
        .overdue-glow-card {
          animation: pulseGlowRed 1.8s infinite alternate !important;
          border: 1.5px solid #F87171 !important;
        }
      `}} />



      {/* ── Stat Cards ── */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3.5}>
        <MetricCard
          label="Planner Completion"
          value={`${plannerStats.completed}/${plannerStats.total}`}
          subtext="Linked & approved in Tracker"
          icon={FiCheckCircle}
          accent="green"
          trend={{ label: `${plannerStats.completionRate}% complete`, positive: plannerStats.completionRate >= 60 }}
          progress={plannerStats.completionRate}
        />
        <MetricCard
          label="Pending Review"
          value={plannerStats.pendingReview}
          subtext="Requires manager approval"
          icon={FiClock}
          accent="orange"
          trend={{ label: plannerStats.pendingReview === 0 ? "Workflow clean" : "Action needed", positive: plannerStats.pendingReview === 0 }}
          progress={plannerStats.total ? Math.max(12, Math.round((plannerStats.pendingReview / plannerStats.total) * 100)) : 0}
        />
        <MetricCard
          label="Total Planned Slots"
          value={plannerStats.scheduled}
          subtext="Lined up across month/week"
          icon={FiCalendar}
          accent="blue"
          trend={{ label: `${plannerStats.total} entries total`, positive: plannerStats.scheduled > 0 }}
          progress={plannerStats.total ? Math.round((plannerStats.scheduled / plannerStats.total) * 100) : 0}
        />
      </SimpleGrid>

      {/* ── Main Planner Calendar Area ── */}
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro
            eyebrow="Content Planner Calendar"
            title="Interactive Schedule Planner"
            description="Drag and drop cards onto any date to reschedule. Completion syncs automatically to the Post Tracker."
            actions={[
              <HStack key="views" spacing={1} bg={softBg} p={1} borderRadius="10px" borderWidth="1px" borderColor={surfaceBorder}>
                <IconButton
                  size="xs"
                  h="28px"
                  borderRadius="8px"
                  icon={<Icon as={FiGrid} />}
                  aria-label="Month View"
                  colorScheme={viewMode === "month" ? "blue" : "gray"}
                  variant={viewMode === "month" ? "solid" : "ghost"}
                  onClick={() => setViewMode("month")}
                />
                <IconButton
                  size="xs"
                  h="28px"
                  borderRadius="8px"
                  icon={<Icon as={FiTrello} />}
                  aria-label="Week View"
                  colorScheme={viewMode === "week" ? "blue" : "gray"}
                  variant={viewMode === "week" ? "solid" : "ghost"}
                  onClick={() => setViewMode("week")}
                />
                <IconButton
                  size="xs"
                  h="28px"
                  borderRadius="8px"
                  icon={<Icon as={FiList} />}
                  aria-label="List View"
                  colorScheme={viewMode === "list" ? "blue" : "gray"}
                  variant={viewMode === "list" ? "solid" : "ghost"}
                  onClick={() => setViewMode("list")}
                />
              </HStack>,
              <Button key="add" size="sm" h="34px" fontSize="xs" leftIcon={<Icon as={FiPlus} />} borderRadius="10px" onClick={openCreateModal} {...primaryButton}>
                New Post Plan
              </Button>,
            ]}
          />

          {/* ── Filters ── */}
          <HStack spacing={2.5} mt={4} mb={4} flexWrap="wrap">
            <Select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              maxW="130px"
              borderRadius="10px"
              borderColor={surfaceBorder}
              size="sm"
              h="32px"
              fontSize="xs"
            >
              <option value="All">All Platforms</option>
              {["Facebook", "Instagram", "LinkedIn", "TikTok", "Twitter (X)", "WhatsApp", "Telegram", "Google", "YouTube"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="140px"
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
              {filteredPosts.length} plan{filteredPosts.length !== 1 ? "s" : ""} active
            </Badge>
          </HStack>

          {/* ── MONTH CALENDAR VIEW ── */}
          {viewMode === "month" && (
            <VStack spacing={3} align="stretch">
              <Flex justify="space-between" align="center" bg={softBg} p={2} borderRadius="10px" border="1px solid" borderColor={surfaceBorder}>
                <IconButton size="sm" icon={<ChevronLeftIcon />} onClick={handlePrevMonth} variant="ghost" aria-label="Previous Month" />
                <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em">
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </Heading>
                <IconButton size="sm" icon={<ChevronRightIcon />} onClick={handleNextMonth} variant="ghost" aria-label="Next Month" />
              </Flex>

              <SimpleGrid columns={7} spacing={2} minH="420px">
                {/* Day Headers */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((h) => (
                  <Box key={h} textAlign="center" py={1.5} bg={softBg} borderRadius="8px" borderWidth="1px" borderColor={surfaceBorder}>
                    <Text fontSize="10px" fontWeight="700" color={muted}>
                      {h}
                    </Text>
                  </Box>
                ))}

                {/* Day Cells */}
                {monthDays.map((cell, idx) => {
                  const isCurrent = cell.isCurrentMonth;
                  const isToday = cell.date.toDateString() === todayDate.toDateString();
                  const cellDateObj = new Date(cell.date);
                  cellDateObj.setHours(0, 0, 0, 0);
                  const isPast = cellDateObj < todayDate;
                  
                  // Filter posts for this cell day
                  const cellPlans = filteredPosts.filter((p) => {
                    if (!p.scheduledDate) return false;
                    return new Date(p.scheduledDate).toDateString() === cell.date.toDateString();
                  });

                  return (
                    <Box
                      key={idx}
                      borderRadius="8px"
                      border="1px solid"
                      borderColor={isToday ? "blue.400" : isPast ? "transparent" : isCurrent ? surfaceBorder : "transparent"}
                      bg={isToday ? "blue.50" : isPast ? useColorModeValue("gray.200", "gray.900") : isCurrent ? "whiteAlpha.200" : "blackAlpha.50"}
                      _dark={{
                        bg: isToday ? "rgba(59, 130, 246, 0.15)" : isPast ? "rgba(2, 6, 23, 0.85)" : isCurrent ? "whiteAlpha.50" : "whiteAlpha.10",
                      }}
                      opacity={isPast ? 0.5 : 1}
                      filter={isPast ? "grayscale(70%) brightness(95%)" : "none"}
                      minH="90px"
                      p={1.5}
                      display="flex"
                      flexDirection="column"
                      transition="background-color 0.2s"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, cell.date)}
                      _hover={isPast ? {} : { bg: "blue.50", _dark: { bg: "rgba(59, 130, 246, 0.1)" } }}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        {isToday && (
                          <Badge size="xs" colorScheme="blue" fontSize="8px" borderRadius="full" px={1.5}>
                            Today
                          </Badge>
                        )}
                        <Text
                          fontSize="9px"
                          fontWeight={isToday ? "bold" : "medium"}
                          color={isPast ? "gray.500" : isCurrent ? undefined : muted}
                          ml="auto"
                        >
                          {cell.date.getDate()}
                        </Text>
                      </Flex>

                      {/* Render Cell Plans */}
                      <VStack
                        align="stretch"
                        spacing={1}
                        flex="1"
                        overflowY="auto"
                        sx={{
                          "&::-webkit-scrollbar": { display: "none" },
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {cellPlans.map((post) => {
                          const expired = isPostExpired(post);
                          const brand = getPlatformBrand(post.platform);
                          return (
                            <Box
                              key={post._id || post.id}
                              draggable={!post.completed}
                              onDragStart={(e) => handleDragStart(e, post._id || post.id)}
                              onClick={() => handleEditClick(post)}
                              p={1.5}
                              borderRadius="6px"
                              bg={post.completed ? useColorModeValue("gray.50", "whiteAlpha.100") : "white"}
                              _dark={{ bg: post.completed ? "whiteAlpha.50" : "slate.800" }}
                              border="1px solid"
                              borderColor={expired ? "red.400" : post.completed ? useColorModeValue("gray.200", "gray.700") : surfaceBorder}
                              className={expired ? "overdue-glow-card" : ""}
                              boxShadow="sm"
                              opacity={post.completed ? 0.65 : 1}
                              cursor={post.completed ? "pointer" : "grab"}
                              _active={{ cursor: post.completed ? "pointer" : "grabbing" }}
                              transition="all 0.15s ease"
                              _hover={{ transform: "scale(1.02)", boxShadow: "md" }}
                            >
                              <Flex align="center" gap={1} mb={0.5}>
                                <Icon as={brand.icon} color={brand.color} boxSize={2.5} />
                                <Badge colorScheme={post.completed ? "green" : expired ? "red" : "blue"} fontSize="7px" py={0} px={1} borderRadius="full">
                                  {post.completed ? "Done" : expired ? "Expired" : post.approval}
                                </Badge>
                              </Flex>
                              <Text fontSize="9px" fontWeight="700" noOfLines={1} textDecoration={post.completed ? "line-through" : "none"} color={post.completed ? "gray.500" : undefined}>
                                {post.type}
                              </Text>
                              <Text fontSize="8px" color={post.completed ? "gray.400" : muted} noOfLines={1} textDecoration={post.completed ? "line-through" : "none"}>
                                {post.title || post.topic || "Untitled"}
                              </Text>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </VStack>
          )}

          {/* ── WEEK CALENDAR VIEW ── */}
          {viewMode === "week" && (
            <VStack spacing={3} align="stretch">
              <Flex justify="space-between" align="center" bg={softBg} p={2} borderRadius="10px" border="1px solid" borderColor={surfaceBorder}>
                <IconButton size="sm" icon={<ChevronLeftIcon />} onClick={handlePrevWeek} variant="ghost" aria-label="Previous Week" />
                <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em">
                  Week of {weekDays[0].toLocaleDateString("default", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                </Heading>
                <IconButton size="sm" icon={<ChevronRightIcon />} onClick={handleNextWeek} variant="ghost" aria-label="Next Week" />
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 7 }} spacing={2.5} minH="400px">
                {weekDays.map((dayDate, idx) => {
                  const isToday = dayDate.toDateString() === todayDate.toDateString();
                  const cellPlans = filteredPosts.filter((p) => {
                    if (!p.scheduledDate) return false;
                    return new Date(p.scheduledDate).toDateString() === dayDate.toDateString();
                  });

                  const cellDateObj = new Date(dayDate);
                  cellDateObj.setHours(0, 0, 0, 0);
                  const isPast = cellDateObj < todayDate;

                  return (
                    <Box
                      key={idx}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={isToday ? "blue.400" : isPast ? "transparent" : surfaceBorder}
                      bg={isToday ? "blue.50" : isPast ? useColorModeValue("gray.200", "gray.900") : softBg}
                      _dark={{
                        bg: isToday ? "rgba(59, 130, 246, 0.12)" : isPast ? "rgba(2, 6, 23, 0.85)" : "whiteAlpha.50",
                      }}
                      opacity={isPast ? 0.5 : 1}
                      filter={isPast ? "grayscale(70%) brightness(95%)" : "none"}
                      p={3}
                      display="flex"
                      flexDirection="column"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dayDate)}
                      minH="350px"
                    >
                      <VStack align="stretch" spacing={1} mb={3} borderBottom="1px solid" borderColor={surfaceBorder} pb={2}>
                        <Text fontSize="10px" fontWeight="800" color={muted} textTransform="uppercase" letterSpacing="0.05em">
                          {dayDate.toLocaleDateString("default", { weekday: "short" })}
                        </Text>
                        <Heading size="xs" fontWeight="800">
                          {dayDate.toLocaleDateString("default", { month: "short", day: "numeric" })}
                        </Heading>
                        {isToday && (
                          <Badge colorScheme="blue" fontSize="8px" alignSelf="start" borderRadius="full">
                            Today
                          </Badge>
                        )}
                      </VStack>

                      <VStack
                        align="stretch"
                        spacing={2.5}
                        flex="1"
                        overflowY="auto"
                        sx={{
                          "&::-webkit-scrollbar": { display: "none" },
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {cellPlans.map((post) => {
                          const expired = isPostExpired(post);
                          const brand = getPlatformBrand(post.platform);
                          return (
                            <Box
                              key={post._id || post.id}
                              draggable={!post.completed}
                              onDragStart={(e) => handleDragStart(e, post._id || post.id)}
                              onClick={() => handleEditClick(post)}
                              p={2.5}
                              borderRadius="10px"
                              bg={post.completed ? useColorModeValue("gray.50", "whiteAlpha.100") : "white"}
                              _dark={{ bg: post.completed ? "whiteAlpha.50" : "slate.800" }}
                              border="1px solid"
                              borderColor={expired ? "red.400" : post.completed ? useColorModeValue("gray.200", "gray.700") : surfaceBorder}
                              className={expired ? "overdue-glow-card" : ""}
                              boxShadow="sm"
                              opacity={post.completed ? 0.65 : 1}
                              cursor={post.completed ? "pointer" : "grab"}
                              _active={{ cursor: post.completed ? "pointer" : "grabbing" }}
                              transition="all 0.15s ease"
                              _hover={{ transform: "scale(1.02)", boxShadow: "md" }}
                            >
                              <Flex justify="space-between" align="flex-start" mb={1.5}>
                                <HStack spacing={1}>
                                  <Icon as={brand.icon} color={brand.color} boxSize={3.5} />
                                  <Text fontSize="10px" fontWeight="700">{post.platform}</Text>
                                </HStack>
                                <Badge colorScheme={post.completed ? "green" : expired ? "red" : "blue"} fontSize="8px" px={2} borderRadius="full">
                                  {post.completed ? "Done" : expired ? "Expired" : post.approval}
                                </Badge>
                              </Flex>

                              <Heading size="xs" fontSize="11px" fontWeight="800" noOfLines={1} mb={0.5} textDecoration={post.completed ? "line-through" : "none"} color={post.completed ? "gray.500" : undefined}>
                                {post.type}
                              </Heading>
                              <Text fontSize="10px" color={post.completed ? "gray.400" : muted} noOfLines={2} mb={2} textDecoration={post.completed ? "line-through" : "none"}>
                                {post.title || post.topic || "Untitled plan"}
                              </Text>

                              <Divider mb={2} borderColor={surfaceBorder} />

                              <Flex justify="space-between" align="center">
                                <Text fontSize="8px" color={muted} fontWeight="600">
                                  🕒 {post.slot}
                                </Text>
                                <HStack spacing={1}>
                                  <IconButton
                                    size="xs"
                                    icon={<EditIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(post);
                                    }}
                                    variant="ghost"
                                    aria-label="Edit"
                                  />
                                  <IconButton
                                    size="xs"
                                    icon={<DeleteIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(post._id || post.id);
                                    }}
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Delete"
                                  />
                                </HStack>
                              </Flex>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </VStack>
          )}

          {/* ── LIST/CARDS VIEW (LEGACY) ── */}
          {viewMode === "list" && (
            <>
              {filteredPosts.length === 0 ? (
                <Box mt={4}>
                  <EmptyStateBlock
                    title="No scheduled posts"
                    description={posts.length === 0 ? "Create the first content slot." : "No posts match the current filters."}
                    action={
                      <Button size="xs" borderRadius="8px" onClick={openCreateModal} {...primaryButton}>Create a post</Button>
                    }
                    badge="Planner Empty"
                  />
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3.5} mt={4}>
                  {filteredPosts.map((slot, originalIndex) => {
                    const statusTone = statusToneMap[slot.approval] || statusToneMap.Draft;
                    const expired = isPostExpired(slot);
                    return (
                      <SurfaceCard
                        key={slot._id || slot.id || originalIndex}
                        borderColor={expired ? "red.400" : slot.completed ? "green.200" : undefined}
                        className={expired ? "overdue-glow-card" : ""}
                      >
                        <Box p={3}>
                          <Flex justify="space-between" align="flex-start" gap={2} mb={3}>
                            <Box minW={0}>
                              <HStack spacing={1.5} mb={2}>
                                <Badge borderRadius="full" px={2} py={0.2} fontSize="9px" colorScheme="blue">
                                  {new Date(slot.scheduledDate || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </Badge>
                                <Badge variant="subtle" borderRadius="full" px={2} py={0.2} fontSize="9px">
                                  {slot.slot}
                                </Badge>
                                {expired && (
                                  <Badge colorScheme="red" variant="solid" borderRadius="full" px={2} py={0.2} fontSize="8px" fontWeight="800">
                                    OVERDUE
                                  </Badge>
                                )}
                              </HStack>
                              <Heading size="xs" fontWeight="700" noOfLines={1}>{slot.type} on {slot.platform}</Heading>
                              <Text mt={1} color={muted} fontSize="xs" noOfLines={1}>
                                {slot.title || slot.topic || "Untitled topic"}
                              </Text>
                            </Box>
                            <Flex
                              w="30px" h="30px" borderRadius="8px" align="center" justify="center"
                              bg={slot.completed ? "green.50" : expired ? "red.50" : "blue.50"}
                              color={slot.completed ? "green.600" : expired ? "red.600" : "blue.600"}
                              _dark={{
                                bg: slot.completed ? "green.500" : expired ? "red.500" : "blue.500",
                                color: "white",
                              }}
                              flexShrink={0}
                            >
                              <Icon as={slot.completed ? FiCheckCircle : expired ? FiAlertTriangle : FiCalendar} boxSize={3.5} />
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
                              <Switch
                                size="sm"
                                isChecked={slot.completed}
                                onChange={() => {
                                  if (onUpdatePost && slot._id) {
                                    onUpdatePost(slot._id, { completed: !slot.completed });
                                  }
                                }}
                                colorScheme="green"
                              />
                            </HStack>

                            <HStack justify="flex-end" spacing={1} mt={1} pt={1} borderTop="1px dashed" borderColor={surfaceBorder}>
                              <IconButton
                                size="xs"
                                icon={<EditIcon />}
                                variant="ghost"
                                onClick={() => handleEditClick(slot)}
                                aria-label="Edit Plan"
                              />
                              <IconButton
                                size="xs"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteClick(slot._id || slot.id)}
                                aria-label="Delete Plan"
                              />
                            </HStack>
                          </VStack>
                        </Box>
                      </SurfaceCard>
                    );
                  })}
                </SimpleGrid>
              )}
            </>
          )}
        </Box>
      </SurfaceCard>

      {/* ── Create / Edit Post Plan Modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px" boxShadow="0 12px 36px rgba(15,23,42,0.2)">
          <ModalHeader fontSize="md" fontWeight="800">
            {isEditing ? "Edit Content Plan" : "Create New Post Plan"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={2}>
            <VStack spacing={3}>
              <FormControl size="sm" isRequired>
                <FormLabel fontSize="xs" mb={1}>Scheduled Date</FormLabel>
                <Input
                  size="sm"
                  type="date"
                  name="scheduledDate"
                  value={newPost.scheduledDate}
                  onChange={handleInputChange}
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                />
              </FormControl>
              <FormControl size="sm" isRequired>
                <FormLabel fontSize="xs" mb={1}>Title / Topic</FormLabel>
                <Input
                  size="sm"
                  name="title"
                  value={newPost.title || newPost.topic}
                  onChange={handleInputChange}
                  placeholder="e.g. Organic Coffee Beans Launch Campaign"
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Time Slot</FormLabel>
                <Input
                  size="sm"
                  name="slot"
                  value={newPost.slot}
                  onChange={handleInputChange}
                  placeholder="e.g., 9:00 AM"
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                />
              </FormControl>
              {!isEditing ? (
                <FormControl size="sm">
                  <FormLabel fontSize="xs" mb={1.5} fontWeight="700">Publish to Platforms</FormLabel>
                  <SimpleGrid columns={3} spacing={2} w="full" p={2} bg={softBg} borderRadius="8px">
                    {["Facebook", "Instagram", "LinkedIn", "TikTok", "Twitter (X)", "WhatsApp", "Telegram", "Google", "YouTube"].map((p) => (
                      <Checkbox
                        key={p}
                        isChecked={selectedPlatforms.includes(p)}
                        onChange={() => handlePlatformCheckboxChange(p)}
                        colorScheme="blue"
                      >
                        <Text fontSize="10px" fontWeight="600">{p}</Text>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </FormControl>
              ) : (
                <FormControl size="sm">
                  <FormLabel fontSize="xs" mb={1}>Social Platform</FormLabel>
                  <Select
                    size="sm"
                    name="platform"
                    value={newPost.platform}
                    onChange={handleInputChange}
                    borderRadius="10px"
                    borderColor={surfaceBorder}
                    fontSize="xs"
                  >
                    {["Facebook", "Instagram", "LinkedIn", "TikTok", "Twitter (X)", "WhatsApp", "Telegram", "Google", "YouTube"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Content Type</FormLabel>
                <Select
                  size="sm"
                  name="type"
                  value={newPost.type}
                  onChange={handleInputChange}
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                >
                  {["Video", "Poster", "Carousel", "Article", "Story", "Live"].map((t) => (
                    <option key={t} value={t}>{t === "Live" ? "Live Stream" : t}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Assigned Staff (Sales/Social Dept)</FormLabel>
                <Select
                  size="sm"
                  name="staff"
                  value={newPost.staff}
                  onChange={handleInputChange}
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                  placeholder="Select Sales Staff"
                >
                  {salesUsers.map((user) => (
                    <option key={user._id || user.username} value={user.fullName || user.username}>
                      {user.fullName || user.username} ({user.role})
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Approval Status</FormLabel>
                <Select
                  size="sm"
                  name="approval"
                  value={newPost.approval}
                  onChange={handleInputChange}
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  fontSize="xs"
                >
                  {["Draft", "Pending Review", "Scheduled", "Posted"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Description / Notes</FormLabel>
                <Textarea
                  size="sm"
                  name="description"
                  value={newPost.description}
                  onChange={handleInputChange}
                  placeholder="Description or draft notes..."
                  borderRadius="10px"
                  borderColor={surfaceBorder}
                  rows={2}
                  fontSize="xs"
                />
              </FormControl>
              {isEditing && (
                <FormControl size="sm" display="flex" alignItems="center">
                  <FormLabel fontSize="xs" mb="0">
                    Mark Completed (Sync to Post Tracker)
                  </FormLabel>
                  <Switch
                    size="sm"
                    name="completed"
                    isChecked={newPost.completed}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        completed: e.target.checked,
                      }))
                    }
                    colorScheme="green"
                    ml="auto"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button size="sm" mr={3} borderRadius="10px" onClick={handleSubmit} {...primaryButton}>
              {isEditing ? "Save Changes" : "Create Plan"}
            </Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ContentPlanner;
