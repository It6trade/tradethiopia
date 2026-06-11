import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  FaFacebookF,
  FaGoogle,
  FaInstagram,
  FaLinkedinIn,
  FaTelegramPlane,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { FiLayers } from "react-icons/fi";

/* ──────────────────────────────────────────────
   Platform brand map — shared across all social media components
   ────────────────────────────────────────────── */

export const platformBrandMap = {
  Facebook: { icon: FaFacebookF, bg: "rgba(24,119,242,0.08)", color: "#1877F2", accent: "blue" },
  Instagram: { icon: FaInstagram, bg: "rgba(225,48,108,0.08)", color: "#E1306C", accent: "pink" },
  LinkedIn: { icon: FaLinkedinIn, bg: "rgba(10,102,194,0.08)", color: "#0A66C2", accent: "linkedin" },
  TikTok: { icon: FaTiktok, bg: "rgba(15,23,42,0.06)", color: "#010101", accent: "purple" },
  "Twitter (X)": { icon: FaTwitter, bg: "rgba(29,161,242,0.08)", color: "#1DA1F2", accent: "gray" },
  Telegram: { icon: FaTelegramPlane, bg: "rgba(34,158,217,0.08)", color: "#229ED9", accent: "telegram" },
  Google: { icon: FaGoogle, bg: "rgba(234,67,53,0.08)", color: "#EA4335", accent: "red" },
  YouTube: { icon: FaYoutube, bg: "rgba(255,0,0,0.08)", color: "#FF0000", accent: "red" },
};

export const getPlatformBrand = (platform) =>
  platformBrandMap[platform] || { icon: FiLayers, bg: "rgba(37,99,235,0.06)", color: "#2563EB", accent: "blue" };

/* ──────────────────────────────────────────────
   Status helpers
   ────────────────────────────────────────────── */

export const getStatusInfo = (progress) => {
  if (progress === 100) return { status: "COMPLETED", colorScheme: "green" };
  if (progress >= 70) return { status: "ON TRACK", colorScheme: "green" };
  if (progress >= 30) return { status: "IN PROGRESS", colorScheme: "yellow" };
  if (progress >= 1) return { status: "NEEDS ATTENTION", colorScheme: "orange" };
  return { status: "BEHIND", colorScheme: "red" };
};

export const getProgressColor = (progress) => {
  if (progress >= 70) return "green";
  if (progress >= 30) return "yellow";
  return "red";
};

export const formatCompact = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

/* ──────────────────────────────────────────────
   Surface styles — shared glassmorphic base
   ────────────────────────────────────────────── */

const surfaceStyles = (pick) => ({
  bg: pick("rgba(255,255,255,0.85)", "rgba(15,23,42,0.65)"),
  borderWidth: "1px",
  borderColor: pick("rgba(226,232,240,0.8)", "rgba(148,163,184,0.12)"),
  boxShadow: pick("0 8px 30px rgba(15,23,42,0.04)", "0 10px 32px rgba(0,0,0,0.24)"),
  backdropFilter: "blur(16px) saturate(1.2)",
});

/* ──────────────────────────────────────────────
   SurfaceCard — glassmorphic container
   ────────────────────────────────────────────── */

export function SurfaceCard({ children, noPad, ...props }) {
  const styles = surfaceStyles(useColorModeValue);
  const hoverShadow = useColorModeValue(
    "0 12px 36px rgba(15,23,42,0.06)",
    "0 14px 40px rgba(0,0,0,0.3)"
  );

  return (
    <Card
      borderRadius="12px"
      overflow="hidden"
      transition="box-shadow 0.15s ease, border-color 0.15s ease"
      _hover={{ boxShadow: hoverShadow, borderColor: "blue.200" }}
      {...styles}
      {...props}
    >
      {noPad ? children : <CardBody p={0}>{children}</CardBody>}
    </Card>
  );
}

/* ──────────────────────────────────────────────
   SectionIntro — section heading with eyebrow + actions
   ────────────────────────────────────────────── */

export function SectionIntro({ eyebrow, title, description, actions }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("#0F172A", "white");

  return (
    <Flex
      justify="space-between"
      align={{ base: "stretch", lg: "center" }}
      gap={3}
      direction={{ base: "column", lg: "row" }}
    >
      <VStack align="start" spacing={0.5} maxW="3xl">
        {eyebrow ? (
          <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700">
            {eyebrow}
          </Text>
        ) : null}
        {title ? (
          <Heading size="md" letterSpacing="-0.01em" color={titleColor}>
            {title}
          </Heading>
        ) : null}
        {description ? (
          <Text color={muted} fontSize="xs" maxW="2xl" mt={0.5}>
            {description}
          </Text>
        ) : null}
      </VStack>
      {actions ? (
        <HStack spacing={2} alignSelf={{ base: "stretch", lg: "center" }} flexWrap="wrap">
          {actions}
        </HStack>
      ) : null}
    </Flex>
  );
}

/* ──────────────────────────────────────────────
   MetricCard — full-size stat card with progress
   ────────────────────────────────────────────── */

export function MetricCard({ label, value, subtext, icon, accent = "blue", trend, progress = 0 }) {
  const iconBg = useColorModeValue(`${accent}.50`, `rgba(255,255,255,0.08)`);
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.200`);
  const muted = useColorModeValue("gray.500", "gray.400");
  const trackBg = useColorModeValue("rgba(226,232,240,0.8)", "whiteAlpha.100");
  const panelBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.7))"
  );

  return (
    <SurfaceCard bgImage={panelBg}>
      <Box p={3.5}>
        <Flex justify="space-between" align="flex-start" gap={3}>
          <Stat>
            <StatLabel fontSize="xs" color={muted} mb={1}>
              {label}
            </StatLabel>
            <StatNumber fontSize={{ base: "lg", md: "xl" }} fontWeight="800" letterSpacing="-0.01em">
              {value}
            </StatNumber>
            {subtext ? (
              <StatHelpText mb={0} mt={1} fontSize="10px" color={muted}>
                {subtext}
              </StatHelpText>
            ) : null}
          </Stat>
          {icon ? (
            <Flex
              w="32px"
              h="32px"
              align="center"
              justify="center"
              borderRadius="8px"
              bg={iconBg}
              color={iconColor}
              flexShrink={0}
              boxShadow="inset 0 1px 0 rgba(255,255,255,0.2)"
            >
              <Icon as={icon} boxSize={4} />
            </Flex>
          ) : null}
        </Flex>
        <HStack justify="space-between" mt={3} mb={1.5}>
          <Badge
            colorScheme={trend?.positive ? "green" : "orange"}
            variant="subtle"
            borderRadius="full"
            px={2}
            py={0.2}
            fontSize="9px"
          >
            {trend?.label || "Stable"}
          </Badge>
          <Text fontSize="10px" fontWeight="600" color={muted}>
            {progress}%
          </Text>
        </HStack>
        <Progress value={progress} colorScheme={accent} size="xs" borderRadius="full" bg={trackBg} />
      </Box>
    </SurfaceCard>
  );
}

/* ──────────────────────────────────────────────
   MiniStatCard — compact stat for mobile / dashboard grid
   ────────────────────────────────────────────── */

export function MiniStatCard({ label, value, icon, accent = "blue", trend }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue(`${accent}.50`, `rgba(255,255,255,0.08)`);
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.200`);
  const borderColor = useColorModeValue("rgba(226,232,240,0.8)", "rgba(148,163,184,0.1)");

  return (
    <Box
      borderRadius="10px"
      borderWidth="1px"
      borderColor={borderColor}
      bg={useColorModeValue("rgba(255,255,255,0.9)", "rgba(15,23,42,0.6)")}
      p={2.5}
      transition="all 0.15s ease"
      _hover={{ boxShadow: "0 4px 12px rgba(15,23,42,0.04)" }}
    >
      <HStack spacing={2.5}>
        {icon ? (
          <Flex
            w="30px"
            h="30px"
            align="center"
            justify="center"
            borderRadius="8px"
            bg={iconBg}
            color={iconColor}
            flexShrink={0}
          >
            <Icon as={icon} boxSize={3.5} />
          </Flex>
        ) : null}
        <Box flex="1" minW={0}>
          <Text fontSize="10px" color={muted} fontWeight="600" noOfLines={1}>
            {label}
          </Text>
          <Text fontSize="md" fontWeight="800" letterSpacing="-0.01em" noOfLines={1}>
            {value}
          </Text>
        </Box>
        {trend ? (
          <Badge
            colorScheme={trend.positive ? "green" : "orange"}
            variant="subtle"
            borderRadius="full"
            px={1.5}
            py={0.2}
            fontSize="9px"
            flexShrink={0}
          >
            {trend.label}
          </Badge>
        ) : null}
      </HStack>
    </Box>
  );
}

/* ──────────────────────────────────────────────
   ChartCard — wrapper for Recharts content
   ────────────────────────────────────────────── */

export function ChartCard({ title, subtitle, actions, children, minH = "220px", ...props }) {
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <SurfaceCard {...props}>
      <Box p={4}>
        <Flex justify="space-between" align="center" mb={3} gap={3} direction={{ base: "column", sm: "row" }}>
          <Box>
            {title ? (
              <Heading size="xs" fontWeight="700" letterSpacing="-0.01em">
                {title}
              </Heading>
            ) : null}
            {subtitle ? (
              <Text fontSize="xs" color={muted} mt={0.5}>
                {subtitle}
              </Text>
            ) : null}
          </Box>
          {actions ? <HStack spacing={1.5}>{actions}</HStack> : null}
        </Flex>
        <Box minH={minH}>{children}</Box>
      </Box>
    </SurfaceCard>
  );
}

/* ──────────────────────────────────────────────
   PlatformBadge — branded platform identity chip
   ────────────────────────────────────────────── */

export function PlatformBadge({ platform, size = "md", showLabel = true }) {
  const brand = getPlatformBrand(platform);
  const sizes = {
    sm: { box: "22px", icon: 2.5, text: "xs", radius: "6px" },
    md: { box: "30px", icon: 3.5, text: "xs", radius: "8px" },
    lg: { box: "38px", icon: 4, text: "sm", radius: "12px" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <HStack spacing={size === "sm" ? 1.5 : 2.5}>
      <Flex
        w={s.box}
        h={s.box}
        align="center"
        justify="center"
        borderRadius={s.radius}
        bg={brand.bg}
        color={brand.color}
        flexShrink={0}
        _dark={{ bg: "whiteAlpha.100", color: brand.color }}
      >
        <Icon as={brand.icon} boxSize={s.icon} />
      </Flex>
      {showLabel ? (
        <Text fontWeight="700" fontSize={s.text}>
          {platform}
        </Text>
      ) : null}
    </HStack>
  );
}

/* ──────────────────────────────────────────────
   StatusPill — consistent status indicator
   ────────────────────────────────────────────── */

export function StatusPill({ status, colorScheme = "gray" }) {
  return (
    <Badge colorScheme={colorScheme} borderRadius="full" px={2} py={0.5} fontSize="10px" fontWeight="700">
      {status}
    </Badge>
  );
}

/* ──────────────────────────────────────────────
   ResponsiveDataView — table on desktop, cards on mobile
   ────────────────────────────────────────────── */

export function ResponsiveDataView({ columns, data, renderRow, renderCard, emptyState }) {
  const borderColor = useColorModeValue("rgba(226,232,240,0.8)", "rgba(148,163,184,0.1)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const headerBg = useColorModeValue("rgba(241,245,249,0.65)", "whiteAlpha.50");
  const rowHoverBg = useColorModeValue("rgba(248,250,252,0.85)", "rgba(255,255,255,0.02)");

  if (!data || data.length === 0) {
    return emptyState || null;
  }

  return (
    <>
      {/* Mobile card view */}
      <VStack display={{ base: "flex", md: "none" }} align="stretch" spacing={3}>
        {data.map((item, index) => renderCard(item, index))}
      </VStack>

      {/* Desktop table view */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowX="auto"
        borderRadius="12px"
        borderWidth="1px"
        borderColor={borderColor}
        bg={useColorModeValue("rgba(255,255,255,0.45)", "whiteAlpha.20")}
      >
        <Table variant="unstyled" sx={{ borderCollapse: "collapse", width: "100%" }}>
          <Thead borderBottom="1px solid" borderColor={borderColor}>
            <Tr bg={headerBg}>
              {columns.map((col) => (
                <Th
                  key={col}
                  px={3}
                  py={2.5}
                  fontSize="10px"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  color={muted}
                  borderColor={borderColor}
                >
                  {col}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, index) =>
              renderRow(item, index, {
                rowProps: {
                  transition: "all 0.15s ease",
                  borderBottom: "1px solid",
                  borderColor: borderColor,
                  _hover: { bg: rowHoverBg },
                },
                cellProps: {
                  px: 3,
                  py: 2,
                  fontSize: "xs",
                  borderColor: borderColor,
                },
              })
            )}
          </Tbody>
        </Table>
      </Box>
    </>
  );
}

/* ──────────────────────────────────────────────
   SkeletonCard — loading state placeholder
   ────────────────────────────────────────────── */

export function SkeletonCard({ lines = 3 }) {
  return (
    <SurfaceCard>
      <Box p={4}>
        <HStack spacing={3} mb={3}>
          <SkeletonCircle size="8" />
          <Box flex="1">
            <Skeleton height="12px" width="60%" mb={1.5} borderRadius="6px" />
            <Skeleton height="8px" width="40%" borderRadius="4px" />
          </Box>
        </HStack>
        <SkeletonText noOfLines={lines} spacing="2" skeletonHeight="8px" borderRadius="4px" />
      </Box>
    </SurfaceCard>
  );
}

/* ──────────────────────────────────────────────
   EmptyStateBlock — dashed border empty state
   ────────────────────────────────────────────── */

export function EmptyStateBlock({ title, description, action, badge = "Empty state" }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const bg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");

  return (
    <Box borderRadius="12px" borderWidth="1px" borderStyle="dashed" borderColor={border} bg={bg} p={6}>
      <VStack spacing={2.5} align="start">
        <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="9px">
          {badge}
        </Badge>
        <Heading size="xs">{title}</Heading>
        <Text color={muted} fontSize="xs" maxW="lg">
          {description}
        </Text>
        {action || null}
      </VStack>
    </Box>
  );
}

/* ──────────────────────────────────────────────
   Shared style tokens — used by all sub-components
   ────────────────────────────────────────────── */

export const useSocialStyles = () => {
  const surfaceBorder = useColorModeValue("rgba(226,232,240,0.8)", "rgba(148,163,184,0.1)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const softBg = useColorModeValue("rgba(248,250,252,0.72)", "whiteAlpha.50");
  const tableHover = useColorModeValue("rgba(248,250,252,0.85)", "rgba(255,255,255,0.02)");
  const progressTrack = useColorModeValue("rgba(226,232,240,0.8)", "whiteAlpha.100");
  const cardHighlight = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.2))"
  );
  const primaryButton = {
    bg: "#2563EB",
    color: "white",
    boxShadow: "0 4px 12px rgba(37,99,235,0.15)",
    _hover: { bg: "#1D4ED8", boxShadow: "0 6px 16px rgba(37,99,235,0.22)" },
    _active: { bg: "#1E40AF" },
    _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.3)" },
  };
  const outlineButton = {
    borderColor: surfaceBorder,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
    _hover: { bg: softBg, borderColor: "rgba(37,99,235,0.2)" },
    _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.2)" },
  };

  return { surfaceBorder, muted, softBg, tableHover, progressTrack, cardHighlight, primaryButton, outlineButton };
};
