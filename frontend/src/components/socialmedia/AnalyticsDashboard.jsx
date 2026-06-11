import {
  Box,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { FiActivity, FiTrendingUp, FiUsers } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ChartCard,
  SectionIntro,
  SurfaceCard,
  useSocialStyles,
} from "./SocialMediaPrimitives";

const engagementMetrics = [
  { label: "Total Impressions", value: "124,831" },
  { label: "Engagement Rate", value: "5.6%" },
  { label: "Post Reach", value: "68,400" },
  { label: "Best Content", value: "Instagram Carousel" },
];

const growthMetrics = [
  { label: "New Followers", value: "+1,420" },
  { label: "Platform Followers", value: "FB 18k · IG 24k · LI 9k · TT 12k" },
  { label: "% vs Last Week", value: "+3.1%" },
];

const leadMetrics = [
  { label: "Leads Collected", value: "142" },
  { label: "Platform Inquiries", value: "FB 60 · IG 45 · LI 20 · TT 17" },
  { label: "Conversion Rate", value: "18.4%" },
];

const detailMetricColumns = [
  { title: "Engagement", items: engagementMetrics, accent: "blue", icon: FiActivity },
  { title: "Growth", items: growthMetrics, accent: "green", icon: FiTrendingUp },
  { title: "Lead Performance", items: leadMetrics, accent: "orange", icon: FiUsers },
];

const reportCharts = [
  { label: "Posts vs Target", actual: 80, target: 100 },
  { label: "Engagement vs Target", actual: 65, target: 80 },
  { label: "Response Time vs Target", actual: 55, target: 70 },
];

const trendData = [
  { week: "W1", impressions: 18400, engagement: 4.2, followers: 280 },
  { week: "W2", impressions: 22100, engagement: 4.8, followers: 340 },
  { week: "W3", impressions: 28500, engagement: 5.1, followers: 410 },
  { week: "W4", impressions: 32800, engagement: 5.6, followers: 390 },
];

const AnalyticsDashboard = () => {
  const { surfaceBorder, muted, softBg } = useSocialStyles();
  const isDark = useColorModeValue(false, true);

  const barChartData = reportCharts.map((c) => ({
    name: c.label.replace(" vs Target", ""),
    target: c.target,
    actual: c.actual,
  }));

  return (
    <VStack align="stretch" spacing={4}>
      {/* ── Detail Metric Columns ── */}
      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={3.5}>
        {detailMetricColumns.map((column) => (
          <SurfaceCard key={column.title}>
            <Box p={3.5}>
              <HStack justify="space-between" mb={3}>
                <Heading size="xs" fontWeight="700">{column.title}</Heading>
                <Box
                  w="30px" h="30px" borderRadius="8px" display="grid" placeItems="center"
                  bg={`${column.accent}.50`} color={`${column.accent}.600`}
                  _dark={{ bg: `${column.accent}.500`, color: "white" }}
                >
                  <Icon as={column.icon} boxSize={3.5} />
                </Box>
              </HStack>
              <VStack align="stretch" spacing={2}>
                {column.items.map((metric) => (
                  <Box
                    key={metric.label}
                    borderRadius="8px"
                    borderWidth="1px"
                    borderColor={surfaceBorder}
                    bg={softBg}
                    p={2.5}
                  >
                    <Text fontSize="xs" color={muted}>{metric.label}</Text>
                    <Text mt={1} fontSize="md" fontWeight="800" letterSpacing="-0.01em">{metric.value}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </SurfaceCard>
        ))}
      </SimpleGrid>

      {/* ── Charts Row ── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3.5}>
        {/* Target vs Actual bar chart */}
        <ChartCard title="Target vs Actual" subtitle="Performance across main operational KPIs">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
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
              <Bar dataKey="target" fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,0.7)"} radius={[4, 4, 0, 0]} name="Target" />
              <Bar dataKey="actual" fill={isDark ? "#60A5FA" : "#2563EB"} radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Engagement Trend line chart */}
        <ChartCard title="Engagement Trend" subtitle="Impressions vs engagement rate">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
              <XAxis dataKey="week" fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
              <YAxis yAxisId="left" fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
              <YAxis yAxisId="right" orientation="right" fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: `1px solid ${surfaceBorder}`,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  background: isDark ? "#1E293B" : "#FFF",
                  fontSize: "11px",
                }}
              />
              <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="Impressions" />
              <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Engagement %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </SimpleGrid>

      {/* ── Follower Growth mini chart ── */}
      <ChartCard title="New Followers" subtitle="Weekly follower acquisition trend" minH="180px">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
            <XAxis dataKey="week" fontSize={9} tick={{ fill: isDark ? "#94A3B8" : "#64748B" }} />
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
            <Bar dataKey="followers" fill={isDark ? "#A78BFA" : "#7C3AED"} radius={[4, 4, 0, 0]} name="New Followers" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </VStack>
  );
};

export default AnalyticsDashboard;
