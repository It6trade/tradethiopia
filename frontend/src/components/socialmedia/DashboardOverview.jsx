import { useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { CalendarIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiLayers,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CountUp from "react-countup";
import {
  ChartCard,
  formatCompact,
  MetricCard,
  MiniStatCard,
  PlatformBadge,
  SectionIntro,
  SkeletonCard,
  StatusPill,
  SurfaceCard,
  useSocialStyles,
} from "./SocialMediaPrimitives";

const PIE_COLORS = ["#2563EB", "#E2E8F0"];
const PIE_COLORS_DARK = ["#3B82F6", "rgba(255,255,255,0.08)"];
const BAR_COLORS = {
  posted: "#2563EB",
  target: "rgba(226,232,240,0.7)",
  postedDark: "#60A5FA",
  targetDark: "rgba(255,255,255,0.12)",
};

const statusBadgeColors = {
  Draft: "gray",
  "Pending Review": "orange",
  Scheduled: "blue",
  Posted: "green",
};

const DashboardOverview = ({
  calculatedTargets = [],
  dashboardSummary = {},
  plannerStats = {},
  currentWeeklyKpis = [],
  posts = [],
  weekRange = {},
  selectedDate,
  onNewPost,
  loading = false,
}) => {
  const { surfaceBorder, muted, softBg, cardHighlight, primaryButton, outlineButton } = useSocialStyles();
  const progressTrack = useColorModeValue("rgba(226,232,240,0.8)", "whiteAlpha.100");
  const isDark = useColorModeValue(false, true);

  /* ── bar chart data ── */
  const barData = useMemo(() => {
    return calculatedTargets.map((row) => ({
      name: row.platform.replace("Twitter (X)", "X").replace("Telegram", "TG"),
      posted: row.posted,
      target: row.weeklyTarget,
    }));
  }, [calculatedTargets]);

  /* ── pie chart data ── */
  const pieData = useMemo(() => {
    const completed = dashboardSummary.completionRate || 0;
    return [
      { name: "Completed", value: completed },
      { name: "Remaining", value: 100 - completed },
    ];
  }, [dashboardSummary.completionRate]);

  /* ── top KPI performing platforms ── */
  const topPlatforms = useMemo(() => {
    return [...currentWeeklyKpis].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  }, [currentWeeklyKpis]);

  /* ── recent posts ── */
  const recentPosts = useMemo(() => posts.slice(-5).reverse(), [posts]);

  /* ── metric cards config ── */
  const kpiCards = [
    {
      label: "Output vs Target",
      value: `${dashboardSummary.totalPosted || 0} / ${dashboardSummary.totalTarget || 0}`,
      subtext: `${dashboardSummary.completedPlatforms || 0} platforms completed`,
      icon: FiLayers,
      accent: "blue",
      trend: {
        label: `${dashboardSummary.completionRate || 0}% done`,
        positive: (dashboardSummary.completionRate || 0) >= 70,
      },
      progress: dashboardSummary.completionRate || 0,
    },
    {
      label: "Planner Health",
      value: `${plannerStats.pendingReview || 0} pending`,
      subtext: `${plannerStats.scheduled || 0} scheduled · ${plannerStats.completed || 0} done`,
      icon: FiCalendar,
      accent: "orange",
      trend: {
        label: (plannerStats.pendingReview || 0) > 0 ? "Needs review" : "Queue healthy",
        positive: (plannerStats.pendingReview || 0) === 0,
      },
      progress: plannerStats.completionRate || 0,
    },
    {
      label: "Engagement Rate",
      value: "5.6%",
      subtext: "Likes, comments, shares, saves",
      icon: FiTrendingUp,
      accent: "green",
      trend: { label: "+0.8% vs last week", positive: true },
      progress: 72,
    },
    {
      label: "Lead Generation",
      value: String(dashboardSummary.totalActual || 142),
      subtext: "Organic + paid conversions",
      icon: FiUsers,
      accent: "purple",
      trend: { label: "18.4% conversion", positive: true },
      progress: 54,
    },
  ];

  if (loading) {
    return (
      <VStack align="stretch" spacing={4}>
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
        </SimpleGrid>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* ── Hero Banner ── */}
      <SurfaceCard bgImage={cardHighlight}>
        <Box p={4}>
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap={3}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <HStack spacing={2} mb={1}>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2} py={0.2} fontSize="9px">
                  This Week
                </Badge>
                <Text fontSize="xs" color={muted} fontWeight="600">
                  {weekRange.start
                    ? `${new Date(weekRange.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekRange.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Current Week"}
                </Text>
              </HStack>
              <Heading size="sm" letterSpacing="-0.01em">
                Social Media Command Center
              </Heading>
              <Text color={muted} mt={0.5} fontSize="xs">
                Track targets, schedule content, and monitor performance across all channels.
              </Text>
            </Box>
            <HStack spacing={2} flexShrink={0}>
              <Button
                leftIcon={<DownloadIcon />}
                variant="outline"
                borderRadius="10px"
                size="sm"
                h="34px"
                fontSize="xs"
                {...outlineButton}
              >
                Export
              </Button>
              <Button
                leftIcon={<CalendarIcon />}
                borderRadius="10px"
                size="sm"
                h="34px"
                fontSize="xs"
                onClick={onNewPost}
                {...primaryButton}
              >
                New Post
              </Button>
            </HStack>
          </Flex>

          {/* ── Quick Stats (desktop) ── */}
          <SimpleGrid columns={3} spacing={3} mt={4} display={{ base: "none", md: "grid" }}>
            <Box borderRadius="10px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={3}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700">
                Weekly Velocity
              </Text>
              <Heading size="xs" mt={1}>
                <CountUp end={dashboardSummary.completionRate || 0} duration={1.2} suffix="%" />
              </Heading>
              <Progress
                mt={2}
                value={dashboardSummary.completionRate || 0}
                colorScheme="blue"
                size="xs"
                borderRadius="full"
                bg={progressTrack}
              />
            </Box>
            <Box borderRadius="10px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={3}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700">
                Posts Delivered
              </Text>
              <Heading size="xs" mt={1}>
                <CountUp end={dashboardSummary.totalPosted || 0} duration={1} /> of{" "}
                {dashboardSummary.totalTarget || 0}
              </Heading>
              <Text mt={1} fontSize="10px" color={muted}>
                Across {calculatedTargets.length} active platforms
              </Text>
            </Box>
            <Box borderRadius="10px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={3}>
              <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700">
                Delta
              </Text>
              <Heading
                size="xs"
                mt={1}
                color={(dashboardSummary.delta || 0) >= 0 ? "green.500" : "orange.500"}
              >
                {(dashboardSummary.delta || 0).toFixed(1)}%
              </Heading>
              <Text mt={1} fontSize="10px" color={muted}>
                Actual vs target across all platforms
              </Text>
            </Box>
          </SimpleGrid>

          {/* ── Quick Stats (mobile — horizontal scroll) ── */}
          <HStack
            spacing={2.5}
            mt={3}
            display={{ base: "flex", md: "none" }}
            overflowX="auto"
            pb={1.5}
            css={{ "&::-webkit-scrollbar": { display: "none" } }}
          >
            <MiniStatCard
              label="Velocity"
              value={`${dashboardSummary.completionRate || 0}%`}
              icon={FiActivity}
              accent="blue"
            />
            <MiniStatCard
              label="Delivered"
              value={`${dashboardSummary.totalPosted || 0}/${dashboardSummary.totalTarget || 0}`}
              icon={FiCheckCircle}
              accent="green"
            />
            <MiniStatCard
              label="Delta"
              value={`${(dashboardSummary.delta || 0).toFixed(1)}%`}
              icon={FiBarChart2}
              accent={(dashboardSummary.delta || 0) >= 0 ? "green" : "orange"}
            />
          </HStack>
        </Box>
      </SurfaceCard>

      {/* ── KPI Metric Cards ── */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3.5}>
        {kpiCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </SimpleGrid>

      {/* ── Charts Row ── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3.5}>
        {/* Bar Chart — Posts vs Target by Platform */}
        <ChartCard title="Posts vs Target" subtitle="Output by platform this week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
              <XAxis dataKey="name" fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
              <YAxis fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: `1px solid ${surfaceBorder}`,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  background: isDark ? "#1E293B" : "#FFF",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="target" fill={isDark ? BAR_COLORS.targetDark : BAR_COLORS.target} radius={[4, 4, 0, 0]} name="Target" />
              <Bar dataKey="posted" fill={isDark ? BAR_COLORS.postedDark : BAR_COLORS.posted} radius={[4, 4, 0, 0]} name="Posted" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart — Overall Completion + Top Platforms */}
        <ChartCard title="Weekly Completion" subtitle="Overall progress and top platforms">
          <Flex
            direction={{ base: "column", sm: "row" }}
            align="center"
            justify="center"
            gap={4}
            minH="220px"
          >
            <Box w="130px" h="130px" flexShrink={0}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={(isDark ? PIE_COLORS_DARK : PIE_COLORS)[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Text textAlign="center" mt={-20} fontSize="lg" fontWeight="800">
                <CountUp end={dashboardSummary.completionRate || 0} duration={1.5} suffix="%" />
              </Text>
              <Text textAlign="center" fontSize="10px" color={muted} mt={0.5}>
                completed
              </Text>
            </Box>
            <VStack align="stretch" spacing={2} flex="1" minW={0}>
              <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color={muted}>
                Top Performing
              </Text>
              {topPlatforms.map((p) => (
                <HStack key={p.platform} spacing={2} p={2.5} borderRadius="10px" bg={softBg}>
                  <PlatformBadge platform={p.platform} size="sm" />
                  <Box flex="1" minW={0}>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color={muted}>
                        Views
                      </Text>
                      <Text fontSize="xs" fontWeight="700">
                        {formatCompact(p.views || 0)}
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
              ))}
              {topPlatforms.length === 0 ? (
                <Text fontSize="xs" color={muted}>
                  No KPI data for this week yet.
                </Text>
              ) : null}
            </VStack>
          </Flex>
        </ChartCard>
      </SimpleGrid>

      {/* ── Recent Content Activity ── */}
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro eyebrow="Activity" title="Recent content" />
          {recentPosts.length === 0 ? (
            <Text mt={3} fontSize="xs" color={muted}>
              No content scheduled yet. Create your first post to see activity here.
            </Text>
          ) : (
            <VStack align="stretch" spacing={2.5} mt={3}>
              {recentPosts.map((post, idx) => (
                <Flex
                  key={`${post.day}-${post.slot}-${idx}`}
                  align="center"
                  gap={2.5}
                  p={2}
                  borderRadius="10px"
                  bg={softBg}
                  _hover={{ bg: useColorModeValue("rgba(239,246,255,0.7)", "whiteAlpha.100") }}
                  transition="background 0.15s ease"
                >
                  <Flex
                    w="30px"
                    h="30px"
                    align="center"
                    justify="center"
                    borderRadius="8px"
                    bg={post.completed ? "green.50" : "blue.50"}
                    color={post.completed ? "green.600" : "blue.600"}
                    _dark={{
                      bg: post.completed ? "green.500" : "blue.500",
                      color: "white",
                    }}
                    flexShrink={0}
                  >
                    <Icon as={post.completed ? FiCheckCircle : FiCalendar} boxSize={3.5} />
                  </Flex>
                  <Box flex="1" minW={0}>
                    <Text fontSize="xs" fontWeight="700" noOfLines={1}>
                      {post.type} — {post.topic || "Untitled"}
                    </Text>
                    <Text fontSize="10px" color={muted}>
                      {post.day} {post.slot} · {post.staff || "Unassigned"}
                    </Text>
                  </Box>
                  <StatusPill
                    status={post.approval}
                    colorScheme={statusBadgeColors[post.approval] || "gray"}
                  />
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </SurfaceCard>
    </VStack>
  );
};

export default DashboardOverview;
