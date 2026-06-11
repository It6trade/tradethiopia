import { useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { FiBarChart2, FiCheckCircle, FiFileText, FiLayers } from "react-icons/fi";
import {
  EmptyStateBlock,
  MetricCard,
  ResponsiveDataView,
  SectionIntro,
  SurfaceCard,
  useSocialStyles,
} from "./SocialMediaPrimitives";

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "All"];
const yearOptions = () => {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1, "All"];
};

const ReportsSection = ({
  reportEntries = [],
  reportSummary = {},
  reportInsightItems = [],
  automationItems = [],
  reportMonth,
  setReportMonth,
  reportYear,
  setReportYear,
  reportDate,
  setReportDate,
}) => {
  const { surfaceBorder, muted, softBg, outlineButton, progressTrack } = useSocialStyles();
  const bulletStyle = {
    w: "6px",
    h: "6px",
    mt: "5px",
    borderRadius: "full",
    bg: "blue.500",
    flexShrink: 0,
  };

  const columns = ["Month", "Year", "Date", "Platform", "Target", "Actual", "Delta"];

  const renderMobileCard = (report, index) => {
    const rawDate = report.date || report.createdAt || report.updatedAt;
    const entryDate = rawDate ? new Date(rawDate) : new Date();
    const delta = report.weeklyTarget ? ((report.actual - report.weeklyTarget) / report.weeklyTarget) * 100 : 0;

    return (
      <SurfaceCard key={report._id || `${report.platform}-${index}`}>
        <Box p={3}>
          <Flex justify="space-between" align="center" mb={2}>
            <Box>
              <Text fontWeight="800" fontSize="xs">{report.platform}</Text>
              <Text fontSize="10px" color={muted}>{formatDate(entryDate)}</Text>
            </Box>
            <Badge colorScheme={delta >= 0 ? "green" : "orange"} borderRadius="full" px={2} py={0.2} fontSize="9px">
              {delta.toFixed(1)}%
            </Badge>
          </Flex>
          <SimpleGrid columns={2} spacing={2}>
            <Box p={1.5} borderRadius="8px" bg={softBg}>
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">Target</Text>
              <Text fontWeight="800" fontSize="xs">{report.weeklyTarget}</Text>
            </Box>
            <Box p={1.5} borderRadius="8px" bg={softBg}>
              <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">Actual</Text>
              <Text fontWeight="800" fontSize="xs">{report.actual}</Text>
            </Box>
          </SimpleGrid>
        </Box>
      </SurfaceCard>
    );
  };

  const renderDesktopRow = (report, index, { rowProps, cellProps }) => {
    const rawDate = report.date || report.createdAt || report.updatedAt;
    const entryDate = rawDate ? new Date(rawDate) : new Date();
    const entryMonth = entryDate.toLocaleString("en-US", { month: "short" });
    const entryYear = entryDate.getFullYear();
    const delta = report.weeklyTarget ? ((report.actual - report.weeklyTarget) / report.weeklyTarget) * 100 : 0;

    return (
      <Tr key={report._id || `${report.platform}-${index}`} {...rowProps}>
        <Td {...cellProps} fontWeight="700">{entryMonth}</Td>
        <Td {...cellProps}>{entryYear}</Td>
        <Td {...cellProps} whiteSpace="nowrap">{formatDate(entryDate)}</Td>
        <Td {...cellProps} fontWeight="700">{report.platform}</Td>
        <Td {...cellProps}>{report.weeklyTarget}</Td>
        <Td {...cellProps} fontWeight="600">{report.actual}</Td>
        <Td {...cellProps}>
          <Badge colorScheme={delta >= 0 ? "green" : "orange"} borderRadius="full" px={2} py={0.2} fontSize="9px">
            {delta.toFixed(1)}%
          </Badge>
        </Td>
      </Tr>
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro
            eyebrow="Archive"
            title="Weekly reports"
            description="Filter and review saved weekly report snapshots by month, year, or date."
            actions={[
              <Button key="export" size="sm" h="34px" fontSize="xs" leftIcon={<DownloadIcon />} variant="outline" borderRadius="10px" {...outlineButton}>
                Export CSV
              </Button>,
            ]}
          />

          {/* ── Filters ── */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={4}>
            <FormControl size="sm">
              <FormLabel fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} mb={1}>Month</FormLabel>
              <Select size="sm" h="34px" fontSize="xs" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} borderRadius="10px" borderColor={surfaceBorder}>
                {monthOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
              </Select>
            </FormControl>
            <FormControl size="sm">
              <FormLabel fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} mb={1}>Year</FormLabel>
              <Select size="sm" h="34px" fontSize="xs" value={reportYear} onChange={(e) => setReportYear(e.target.value)} borderRadius="10px" borderColor={surfaceBorder}>
                {yearOptions().map((y) => (<option key={y} value={y}>{y}</option>))}
              </Select>
            </FormControl>
            <FormControl size="sm">
              <FormLabel fontSize="10px" textTransform="uppercase" letterSpacing="0.08em" color={muted} mb={1}>Saturday date</FormLabel>
              <Input size="sm" h="34px" fontSize="xs" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} borderRadius="10px" borderColor={surfaceBorder} />
            </FormControl>
            <Box
              borderRadius="10px"
              borderWidth="1px"
              borderColor={surfaceBorder}
              bg={softBg}
              p={2.5}
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              <Text fontSize="9px" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700">Filter Summary</Text>
              <Text mt={0.5} fontWeight="700" fontSize="xs" noOfLines={1}>{reportSummary.periodLabel || "All"}</Text>
              <Text mt={0.5} fontSize="10px" color={muted} noOfLines={1}>
                {reportSummary.dateLabel ? reportSummary.dateLabel : "All dates"}
              </Text>
            </Box>
          </SimpleGrid>

          {/* ── Summary Metrics ── */}
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3.5} mt={4}>
            <MetricCard
              label="Report entries"
              value={reportSummary.totalTasks || 0}
              subtext="Saved weekly snapshots"
              icon={FiFileText}
              accent="blue"
              trend={{ label: (reportSummary.totalTasks || 0) > 0 ? "Archive active" : "No entries yet", positive: (reportSummary.totalTasks || 0) > 0 }}
              progress={Math.min(100, (reportSummary.totalTasks || 0) * 10)}
            />
            <MetricCard
              label="Total target"
              value={reportSummary.totalTarget || 0}
              subtext="Planned output"
              icon={FiLayers}
              accent="green"
              trend={{ label: reportSummary.periodLabel || "—", positive: true }}
              progress={Math.min(100, reportSummary.totalTarget || 0)}
            />
            <MetricCard
              label="Total actual"
              value={reportSummary.totalActual || 0}
              subtext="Delivered output"
              icon={FiCheckCircle}
              accent="purple"
              trend={{ label: `${reportSummary.totalActual || 0} all-time`, positive: (reportSummary.totalActual || 0) >= (reportSummary.totalTarget || 0) }}
              progress={reportSummary.totalTarget ? Math.min(100, Math.round(((reportSummary.totalActual || 0) / reportSummary.totalTarget) * 100)) : 0}
            />
            <MetricCard
              label="Delta"
              value={`${(reportSummary.delta || 0).toFixed(1)}%`}
              subtext="Actual versus target"
              icon={FiBarChart2}
              accent="orange"
              trend={{ label: (reportSummary.delta || 0) >= 0 ? "Ahead of plan" : "Below target", positive: (reportSummary.delta || 0) >= 0 }}
              progress={Math.min(100, Math.abs(Math.round(reportSummary.delta || 0)))}
            />
          </SimpleGrid>

          {/* ── Report Table ── */}
          <Box mt={4}>
            <ResponsiveDataView
              columns={columns}
              data={reportEntries}
              renderCard={renderMobileCard}
              renderRow={renderDesktopRow}
              emptyState={
                <EmptyStateBlock
                  title="No reports for the selected filters"
                  description="Try a different month, year, or reporting Saturday to surface saved weekly report snapshots."
                  badge="No Results"
                />
              }
            />
          </Box>
        </Box>
      </SurfaceCard>

      {/* ── Summary & Automation panels ── */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3.5}>
        <SurfaceCard>
          <Box p={3.5}>
            <Heading size="xs" fontWeight="700" mb={3}>Report Summary</Heading>
            <VStack align="stretch" spacing={2}>
              {reportInsightItems.map((item) => (
                <HStack key={item} align="start" spacing={2.5}>
                  <Box {...bulletStyle} />
                  <Text color={muted} fontSize="xs">{item}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </SurfaceCard>
        <SurfaceCard>
          <Box p={3.5}>
            <Heading size="xs" fontWeight="700" mb={3}>Automation Features</Heading>
            <VStack align="stretch" spacing={2}>
              {automationItems.map((item) => (
                <HStack key={item} align="start" spacing={2.5}>
                  <Box {...bulletStyle} />
                  <Text color={muted} fontSize="xs">{item}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </SurfaceCard>
      </SimpleGrid>
    </VStack>
  );
};

export default ReportsSection;
