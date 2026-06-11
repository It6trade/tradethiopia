import { useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Progress,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Td,
  Text,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { FiActivity, FiFileText, FiLayers, FiTrendingUp } from "react-icons/fi";
import {
  EmptyStateBlock,
  formatCompact,
  getProgressColor,
  PlatformBadge,
  ResponsiveDataView,
  SectionIntro,
  SkeletonCard,
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

const WeeklyKpiSection = ({
  currentWeeklyKpis = [],
  kpiHistoryRows = [],
  selectedDate,
  weekLabel = "",
  onDateChange,
  onKpiEditOpen,
  savingKpiPlatform = "",
  kpiLoading = false,
}) => {
  const { surfaceBorder, muted, softBg, outlineButton, progressTrack } = useSocialStyles();
  const tabBg = useColorModeValue("rgba(255,255,255,0.84)", "rgba(15,23,42,0.68)");

  if (kpiLoading) {
    return (
      <VStack align="stretch" spacing={4}>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {[1, 2, 3].map((i) => (<SkeletonCard key={i} lines={4} />))}
        </SimpleGrid>
      </VStack>
    );
  }

  const historyColumns = ["Platform", "Active Week", "Videos", "Graphics", "Views", "Likes", "Shares", "Progress"];

  const renderHistoryCard = (entry) => {
    const colorScheme = getProgressColor(entry.progress || 0);
    return (
      <SurfaceCard key={`${entry.platform}-${entry.weekStart}`}>
        <Box p={3}>
          <Flex justify="space-between" align="center" mb={2}>
            <PlatformBadge platform={entry.platform} size="sm" />
            <Badge colorScheme={colorScheme} borderRadius="full" px={2} py={0.5} fontSize="9px">{entry.progress}%</Badge>
          </Flex>
          <Text fontSize="10px" color={muted} mb={2.5}>
            {formatDate(entry.weekStart)} – {formatDate(entry.weekEnd)}
          </Text>
          <SimpleGrid columns={2} spacing={2}>
            {[
              { label: "Videos", value: entry.videos },
              { label: "Graphics", value: entry.graphics },
              { label: "Views", value: formatCompact(entry.views || 0) },
              { label: "Likes", value: formatCompact(entry.likes || 0) },
            ].map((stat) => (
              <Box key={stat.label} p={1.5} borderRadius="8px" bg={softBg}>
                <Text fontSize="9px" color={muted} fontWeight="700" textTransform="uppercase">{stat.label}</Text>
                <Text fontWeight="800" fontSize="sm">{stat.value}</Text>
              </Box>
            ))}
          </SimpleGrid>
          <HStack justify="space-between" mt={2.5}>
            <Text fontSize="10px" color={muted}>{formatCompact(entry.shares || 0)} shares</Text>
            <Progress flex="1" ml={2.5} value={entry.progress} colorScheme={colorScheme} size="xs" borderRadius="full" bg={progressTrack} />
          </HStack>
        </Box>
      </SurfaceCard>
    );
  };

  const renderHistoryRow = (entry, _index, { rowProps, cellProps }) => {
    const colorScheme = getProgressColor(entry.progress || 0);
    return (
      <Tr key={`${entry.platform}-${entry.weekStart}`} {...rowProps}>
        <Td {...cellProps} fontWeight="800"><PlatformBadge platform={entry.platform} size="sm" /></Td>
        <Td {...cellProps} color={muted} whiteSpace="nowrap">{`${formatDate(entry.weekStart)} – ${formatDate(entry.weekEnd)}`}</Td>
        <Td {...cellProps} fontWeight="700">{entry.videos}</Td>
        <Td {...cellProps} fontWeight="700">{entry.graphics}</Td>
        <Td {...cellProps} fontWeight="700">{formatCompact(entry.views || 0)}</Td>
        <Td {...cellProps} fontWeight="700">{formatCompact(entry.likes || 0)}</Td>
        <Td {...cellProps} fontWeight="700">{formatCompact(entry.shares || 0)}</Td>
        <Td {...cellProps} minW="130px">
          <HStack spacing={2}>
            <Progress flex="1" value={entry.progress} colorScheme={colorScheme} size="xs" borderRadius="full" bg={progressTrack} />
            <Badge colorScheme={colorScheme} borderRadius="full" px={2} py={0.2} fontSize="9px">{entry.progress}%</Badge>
          </HStack>
        </Td>
      </Tr>
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <SurfaceCard>
        <Box p={4}>
          <SectionIntro
            eyebrow="Performance"
            title="Weekly KPI tracker"
            description="Monitor video output, reach, and engagement by platform for each week."
            actions={[
              <FormControl key="week" maxW={{ base: "100%", md: "180px" }}>
                <Input type="date" size="sm" h="34px" value={toInputDate(selectedDate)} onChange={onDateChange} borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
              </FormControl>,
            ]}
          />

          <Tabs variant="unstyled" mt={4}>
            <TabList
              p="4px"
              borderRadius="12px"
              borderWidth="1px"
              borderColor={surfaceBorder}
              bg={tabBg}
              overflowX="auto"
              gap={1}
            >
              {["This Week KPI", "History"].map((label) => (
                <Tab
                  key={label}
                  minW={{ base: "110px", md: "140px" }}
                  h="32px"
                  borderRadius="8px"
                  fontWeight="700"
                  color="gray.500"
                  fontSize="xs"
                  transition="all 0.15s ease"
                  _hover={{ bg: "rgba(255,255,255,0.72)", color: "#0F172A" }}
                  _selected={{
                    bg: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                    color: "#0F172A",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                  _dark={{
                    color: "gray.300",
                    _selected: { bg: "whiteAlpha.200", color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.22)" },
                    _hover: { bg: "whiteAlpha.100", color: "white" },
                  }}
                >
                  {label}
                </Tab>
              ))}
            </TabList>

            <TabPanels mt={4}>
              {/* ── This Week KPI ── */}
              <TabPanel px={0} py={0}>
                <Text fontSize="xs" color={muted} mb={3}>
                  Showing KPI cards for <strong>{weekLabel}</strong>
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3.5}>
                  {currentWeeklyKpis.map((item) => {
                    const colorScheme = getProgressColor(item.progress || 0);
                    return (
                      <SurfaceCard key={`${item.platform}-${item.weekStart}`} cursor="pointer" onClick={() => onKpiEditOpen(item)}>
                        <Box p={3.5}>
                          <Flex justify="space-between" align="flex-start" gap={3}>
                            <PlatformBadge platform={item.platform} size="sm" />
                            <VStack spacing={1.5} align="end">
                              <Badge colorScheme={colorScheme} borderRadius="full" px={2} py={0.2} fontSize="9px">{item.progress}%</Badge>
                              <Button
                                size="xs" variant="outline" h="22px" leftIcon={<EditIcon fontSize="9px" />} borderRadius="8px"
                                onClick={(e) => { e.stopPropagation(); onKpiEditOpen(item); }}
                                isLoading={savingKpiPlatform === item.platform}
                                {...outlineButton}
                                fontSize="10px"
                              >
                                Edit
                              </Button>
                            </VStack>
                          </Flex>

                          <SimpleGrid columns={2} spacing={2} mt={4}>
                            {[
                              { label: "Views", icon: FiActivity, value: formatCompact(item.views || 0) },
                              { label: "Likes", icon: FiTrendingUp, value: formatCompact(item.likes || 0) },
                              { label: "Videos", icon: FiFileText, value: item.videos || 0 },
                              { label: "Graphics", icon: FiLayers, value: item.graphics || 0 },
                            ].map((stat) => (
                              <Box key={stat.label} borderRadius="10px" bg={softBg} p={2.5}>
                                <HStack spacing={1.5} color={muted}>
                                  <Icon as={stat.icon} boxSize={3} />
                                  <Text fontSize="9px" fontWeight="700" textTransform="uppercase">{stat.label}</Text>
                                </HStack>
                                <Text mt={0.5} fontSize="md" fontWeight="800">{stat.value}</Text>
                              </Box>
                            ))}
                          </SimpleGrid>

                          <HStack justify="space-between" mt={4} mb={1.5}>
                            <Text fontSize="xs" color={muted}>Weekly progress</Text>
                            <Text fontSize="xs" fontWeight="800">{formatCompact(item.shares || 0)} shares</Text>
                          </HStack>
                          <Progress value={item.progress || 0} colorScheme={colorScheme} size="xs" borderRadius="full" bg={progressTrack} />
                        </Box>
                      </SurfaceCard>
                    );
                  })}
                </SimpleGrid>
              </TabPanel>

              {/* ── History ── */}
              <TabPanel px={0} py={0}>
                <SectionIntro eyebrow="History" title="Weekly KPI history" description="Review saved KPI records by platform and week." />
                <Box mt={4}>
                  <ResponsiveDataView
                    columns={historyColumns}
                    data={kpiHistoryRows}
                    renderCard={renderHistoryCard}
                    renderRow={renderHistoryRow}
                    emptyState={
                      <EmptyStateBlock title="No backend history yet" description="Edit and save a weekly KPI card to create the first record." badge="No History" />
                    }
                  />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </SurfaceCard>
    </VStack>
  );
};

export default WeeklyKpiSection;
