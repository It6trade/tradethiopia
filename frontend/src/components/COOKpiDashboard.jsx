import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CompletedSalesTable from './salesmanager/CompletedSalesTable';
import axiosInstance from '../services/axiosInstance';

const PRIMARY = '#185FA5';
const TARGET_GRAY = '#8A94A6';
const SCORE_COLORS = {
  4: '#639922',
  3: '#185FA5',
  2: '#BA7517',
  1: '#E24B4A',
};
const SCORE_LABELS = {
  4: 'Exceeds',
  3: 'Meets',
  2: 'Near Miss',
  1: 'Below',
};
const DEPARTMENTS = ['All', 'Sales', 'Customer Success', 'IT', 'Tradex TV', 'Operations'];
const PILLARS = ['All Pillars', 'Process Efficiency', 'Service Delivery', 'Sales', 'Customer Success', 'IT', 'Tradex TV', 'Operations', 'HR', 'Finance'];
const buildCompleteMonthList = (periods = []) => {
  const years = periods
    .map((key) => Number(String(key).slice(0, 4)))
    .filter(Number.isFinite);
  const currentYear = new Date().getFullYear();
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;

  return Array.from({ length: (lastYear - firstYear + 1) * 12 }, (_, index) => {
    const year = firstYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const date = new Date(year, month - 1, 1);
    return {
      key,
      label: date.toLocaleString('en', { month: 'short', year: 'numeric' }),
      short: date.toLocaleString('en', { month: 'short' }),
    };
  });
};
const formatValue = (value, kpi) => {
  if (kpi.format === 'currency') return `ETB ${Math.round(value).toLocaleString()}`;
  if (kpi.format === 'compact') return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  if (kpi.format === 'percent') return `${Number(value).toFixed(value < 10 ? 1 : 0)}%`;
  if (kpi.format === 'decimal') return `${Number(value).toFixed(1)}${kpi.unit ? ` ${kpi.unit}` : ''}`;
  return `${Math.round(value).toLocaleString()}${kpi.unit ? ` ${kpi.unit}` : ''}`;
};

const achievementFor = (kpi, actual, target = kpi.target) => {
  if (target === 0) return actual <= 0 ? 120 : actual <= 1 ? 80 : 50;
  return kpi.lowerIsBetter ? (target / Math.max(actual, 0.001)) * 100 : (actual / target) * 100;
};

const scoreFor = (achievement) => {
  if (achievement >= 110) return 4;
  if (achievement >= 90) return 3;
  if (achievement >= 70) return 2;
  return 1;
};

const getActualForRange = (kpi, rows) => {
  const total = rows.reduce((sum, row) => sum + row.actual, 0);
  return kpi.aggregate === 'sum' ? total : total / Math.max(rows.length, 1);
};

const aggregateRows = (kpi, rows, timeRange) => {
  if (timeRange !== 'Quarterly') {
    return rows.map((row) => ({ ...row, period: timeRange === 'Weekly' ? (row.period || row.key) : row.key }));
  }
  const grouped = new Map();
  rows.forEach((row) => {
    const [year, month] = row.key.split('-').map(Number);
    const period = `Q${Math.ceil(month / 3)} ${year}`;
    if (!grouped.has(period)) grouped.set(period, []);
    grouped.get(period).push(row);
  });
  const groups = [...grouped.entries()].map(([period, groupRows]) => ({ period, groupRows }));
  return groups.map((group, groupIndex) => {
    const groupRows = group.groupRows;
    const actual = getActualForRange(kpi, groupRows);
    const target = kpi.aggregate === 'sum'
      ? groupRows.reduce((sum, row) => sum + row.target, 0)
      : groupRows.reduce((sum, row) => sum + row.target, 0) / Math.max(groupRows.length, 1);
    const achievement = achievementFor(kpi, actual, target);
    const score = scoreFor(achievement);
    const previousActual = groupIndex > 0 ? getActualForRange(kpi, groups[groupIndex - 1].groupRows) : undefined;
    return { period: group.period, actual, target, achievement, score, scoreLabel: SCORE_LABELS[score], previousActual };
  });
};

const sortPeriods = (periods, timeRange) => [...periods].sort((a, b) => {
  if (timeRange !== 'Quarterly') return String(a).localeCompare(String(b));
  const parseQuarter = (value) => {
    const match = String(value).match(/^Q([1-4])\s+(\d{4})$/);
    return match ? (Number(match[2]) * 10) + Number(match[1]) : 0;
  };
  return parseQuarter(a) - parseQuarter(b);
});

const getTrend = (points) => {
  const last = points.slice(-3);
  if (last.length < 3) return { symbol: '→', label: 'Stable' };
  const delta = last[2].achievement - last[0].achievement;
  if (delta > 4) return { symbol: '↑', label: 'Improving' };
  if (delta < -4) return { symbol: '↓', label: 'Declining' };
  return { symbol: '→', label: 'Stable' };
};

const buildSparkPoints = (points, width = 132, height = 34) => {
  if (!points.length) return '';
  const values = points.map((point) => point.achievement);
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  return points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - ((point.achievement - min) / Math.max(max - min, 1)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload.find((item) => item.payload?.tooltip)?.payload;
  if (!point?.tooltip) return null;
  const { kpi, actual, target, achievement, scoreLabel, score } = point.tooltip;
  return (
    <Box bg="white" color="#0F172A" border="1px solid #DDE5EF" borderRadius="6px" p={3}>
      <Text fontWeight="800" fontSize="13px">{kpi.name}</Text>
      <Text fontSize="12px">Period: {label}</Text>
      <Text fontSize="12px">Actual: {formatValue(actual, kpi)}</Text>
      <Text fontSize="12px">Target: {formatValue(target, kpi)}</Text>
      <Text fontSize="12px">Achievement: {Math.round(achievement)}%</Text>
      <Badge mt={2} bg={SCORE_COLORS[score]} color="white">{score} - {scoreLabel}</Badge>
    </Box>
  );
};

const COOKpiDashboard = () => {
  const [kpiDefs, setKpiDefs] = useState([]);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [viewMode, setViewMode] = useState('Charts');
  const [timeRange, setTimeRange] = useState('Monthly');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [comparePrevious, setComparePrevious] = useState(false);
  const [department, setDepartment] = useState('All');
  const [pillar, setPillar] = useState('All Pillars');
  const [selectedKpiId, setSelectedKpiId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const pageBg = useColorModeValue('#F3F6FA', '#080D18');
  const surface = useColorModeValue('#FFFFFF', '#111827');
  const panel = useColorModeValue('#F8FAFC', '#0B1120');
  const border = useColorModeValue('#DDE5EF', '#263241');
  const text = useColorModeValue('#0F172A', '#F8FAFC');
  const muted = useColorModeValue('#64748B', '#A6B3C3');
  const softHover = useColorModeValue('#EFF6FF', '#162033');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    axiosInstance.get('/coo-dashboard/kpis', {
      params: {
        department: department === 'All' ? undefined : department,
        pillar: pillar === 'All Pillars' ? undefined : pillar,
      },
    }).then(({ data }) => {
      if (!active) return;
      const periodList = buildCompleteMonthList(data.periods);

      setKpiDefs(Array.isArray(data.definitions) ? data.definitions : []);
      setMonthlyRows(Array.isArray(data.rows) ? data.rows : []);
      setMonths(periodList);
      if (periodList.length) {
        setStartMonth(periodList[0].key);
        setEndMonth(periodList[periodList.length - 1].key);
      } else {
        setStartMonth('');
        setEndMonth('');
      }
    }).catch((error) => {
      if (active) {
        setKpiDefs([]);
        setMonthlyRows([]);
        setMonths([]);
        setStartMonth('');
        setEndMonth('');
        setLoadError(error.response?.data?.message || error.message || 'Backend request failed.');
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [department, pillar]);

  const selectedMonths = useMemo(() => {
    const start = months.findIndex((month) => month.key === startMonth);
    const end = months.findIndex((month) => month.key === endMonth);
    if (start < 0 || end < 0) return [];
    return months.slice(Math.min(start, end), Math.max(start, end) + 1);
  }, [startMonth, endMonth, months]);

  const filteredKpis = useMemo(
    () =>
      kpiDefs.filter((kpi) => department === 'All' || kpi.department === department).filter(
        (kpi) => pillar === 'All Pillars' || kpi.pillar === pillar
      ),
    [department, pillar, kpiDefs]
  );

  const effectiveSelectedKpiId = selectedKpiId !== 'all' && filteredKpis.some((kpi) => kpi.id === selectedKpiId) ? selectedKpiId : 'all';

  const trendCards = useMemo(
    () =>
      filteredKpis.map((kpi) => {
        const requiredGranularity = timeRange === 'Weekly' ? 'week' : 'month';
        const sourceRows = monthlyRows
          .filter((row) => row.kpiId === kpi.id
            && (row.granularity || 'month') === requiredGranularity
            && selectedMonths.some((month) => month.key === row.key))
          .sort((a, b) => String(a.period || a.key).localeCompare(String(b.period || b.key)));
        const hydratedRows = sourceRows.map((row, index) => ({
          ...row,
          short: row.period || months.find((month) => month.key === row.key)?.short || row.key,
          achievement: achievementFor(kpi, row.actual, row.target),
          score: scoreFor(achievementFor(kpi, row.actual, row.target)),
          scoreLabel: SCORE_LABELS[scoreFor(achievementFor(kpi, row.actual, row.target))],
          previousActual: sourceRows[index - 1]?.actual,
        }));
        const points = aggregateRows(kpi, hydratedRows, timeRange);
        const current = points[points.length - 1];
        return {
          kpi,
          points,
          current,
          trend: getTrend(points),
          spark: buildSparkPoints(points),
        };
      }).filter((card) => card.points.length > 0),
    [filteredKpis, selectedMonths, timeRange, monthlyRows, months]
  );

  const chartData = useMemo(() => {
    if (!trendCards.length) return [];
    if (effectiveSelectedKpiId !== 'all') {
      const card = trendCards.find((item) => item.kpi.id === effectiveSelectedKpiId);
      return (card?.points || []).map((point) => ({
        period: point.period,
        actual: point.actual,
        target: point.target,
        previous: point.previousActual,
        score: point.score,
        achievement: point.achievement,
        tooltip: { ...point, kpi: card.kpi },
      }));
    }

    const periods = sortPeriods(
      new Set(trendCards.flatMap((card) => card.points.map((point) => point.period))),
      timeRange
    );
    return periods.map((periodLabel, index) => {
      const matchingPoints = trendCards.map((card) => card.points.find((point) => point.period === periodLabel)).filter(Boolean);
      const achievement = matchingPoints.reduce((sum, point) => sum + point.achievement, 0) / Math.max(matchingPoints.length, 1);
      const previousPeriod = periods[index - 1];
      const previousPoints = previousPeriod
        ? trendCards.map((card) => card.points.find((point) => point.period === previousPeriod)).filter(Boolean)
        : [];
      const previous = previousPoints.length
        ? previousPoints.reduce((sum, point) => sum + point.achievement, 0) / previousPoints.length
        : undefined;
      const score = scoreFor(achievement);
      return {
        period: periodLabel,
        actual: Number(achievement.toFixed(1)),
        target: 100,
        previous: previous === undefined ? undefined : Number(previous.toFixed(1)),
        score,
        achievement,
        tooltip: {
          kpi: { name: 'Filtered KPI Average', format: 'percent', unit: '%', target: 100 },
          actual: achievement,
          target: 100,
          achievement,
          score,
          scoreLabel: SCORE_LABELS[score],
        },
      };
    });
  }, [trendCards, effectiveSelectedKpiId, timeRange]);

  const tableRows = useMemo(
    () =>
      trendCards
        .filter((card) => effectiveSelectedKpiId === 'all' || card.kpi.id === effectiveSelectedKpiId)
        .flatMap((card) =>
          card.points.map((point) => ({
            kpi: card.kpi,
            point,
          }))
        ),
    [trendCards, effectiveSelectedKpiId]
  );

  const pieData = useMemo(() => {
    const counts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    trendCards
      .filter((card) => effectiveSelectedKpiId === 'all' || card.kpi.id === effectiveSelectedKpiId)
      .forEach((card) => {
        counts[card.current?.score || 1] += 1;
      });
    return [4, 3, 2, 1].map((score) => ({
      name: SCORE_LABELS[score],
      score,
      value: counts[score],
    }));
  }, [trendCards, effectiveSelectedKpiId]);

  const selectedCard = trendCards.find((item) => item.kpi.id === effectiveSelectedKpiId);
  const chartColor = SCORE_COLORS[chartData[chartData.length - 1]?.score || 3];
  const chartUnit = selectedCard ? selectedCard.kpi.unit || selectedCard.kpi.format : '% achievement';

  return (
    <Box minH="100vh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
      <Box
        maxW="1700px"
        mx="auto"
        bg={surface}
        border="1px solid"
        borderColor={border}
        borderRadius="8px"
        p={{ base: 4, md: 5 }}
      >
        <Flex justify="space-between" align={{ base: 'stretch', xl: 'flex-start' }} direction={{ base: 'column', xl: 'row' }} gap={4} mb={5}>
          <Box>
            <Text fontSize="11px" textTransform="uppercase" letterSpacing="0.14em" color={PRIMARY} fontWeight="800">
              Tradethiopia Group
            </Text>
            <Text fontSize={{ base: '24px', md: '30px' }} fontWeight="800" color={text} mt={1}>
              KPI vs Time Viewer
            </Text>
            <Text fontSize="13px" color={muted} mt={1}>
              KPI actuals over time against targets, with score-band status and previous-period comparison.
            </Text>
          </Box>
          <VStack align={{ base: 'stretch', xl: 'flex-end' }} spacing={2}>
            <HStack spacing={2} flexWrap="wrap">
              {['Charts', 'Cards', 'Table'].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  borderRadius="6px"
                  bg={viewMode === item ? PRIMARY : panel}
                  color={viewMode === item ? 'white' : text}
                  border="1px solid"
                  borderColor={viewMode === item ? PRIMARY : border}
                  _hover={{ bg: viewMode === item ? PRIMARY : softHover }}
                  onClick={() => setViewMode(item)}
                >
                  {item}
                </Button>
              ))}
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              {['Weekly', 'Monthly', 'Quarterly'].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  borderRadius="6px"
                  bg={timeRange === item ? PRIMARY : panel}
                  color={timeRange === item ? 'white' : text}
                  border="1px solid"
                  borderColor={timeRange === item ? PRIMARY : border}
                  _hover={{ bg: timeRange === item ? PRIMARY : softHover }}
                  onClick={() => setTimeRange(item)}
                >
                  {item}
                </Button>
              ))}
            </HStack>
          </VStack>
        </Flex>

        <Flex direction={{ base: 'column', xl: 'row' }} gap={3} mb={5}>
          <Box flex="1">
            <Text fontSize="11px" fontWeight="800" color={muted} mb={2}>Department</Text>
            <Flex
              gap={2}
              flexWrap={{ base: 'nowrap', md: 'wrap' }}
              overflowX={{ base: 'auto', md: 'visible' }}
              pb={{ base: 2, md: 0 }}
              sx={{
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {DEPARTMENTS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  flex="0 0 auto"
                  borderRadius="999px"
                  px={4}
                  h="32px"
                  bg={department === item ? PRIMARY : surface}
                  color={department === item ? 'white' : text}
                  border="1px solid"
                  borderColor={department === item ? PRIMARY : border}
                  _hover={{ bg: department === item ? PRIMARY : panel }}
                  onClick={() => {
                    setDepartment(item);
                    setPillar('All Pillars');
                    setSelectedKpiId('all');
                  }}
                >
                  {item}
                </Button>
              ))}
            </Flex>
          </Box>
          <SimpleGrid columns={{ base: 2, xl: 4 }} spacing={3} minW={{ xl: '720px' }}>
            <FilterControl label="Start Month" border={border}>
              <Select size="sm" value={startMonth} onChange={(event) => setStartMonth(event.target.value)}>
                {months.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}
              </Select>
            </FilterControl>
            <FilterControl label="End Month" border={border}>
              <Select size="sm" value={endMonth} onChange={(event) => setEndMonth(event.target.value)}>
                {months.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}
              </Select>
            </FilterControl>
            <FilterControl label="Pillar" border={border}>
              <Select size="sm" value={pillar} onChange={(event) => {
                setPillar(event.target.value);
                setSelectedKpiId('all');
              }}>
                {PILLARS.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </FilterControl>
            <FilterControl label="Compare" border={border}>
              <HStack h="32px">
                <Switch isChecked={comparePrevious} onChange={(event) => setComparePrevious(event.target.checked)} colorScheme="blue" />
                <Text fontSize="12px" color={muted}>Previous period</Text>
              </HStack>
            </FilterControl>
          </SimpleGrid>
        </Flex>

        <Flex direction={{ base: 'column', lg: 'row' }} gap={3} mb={5}>
          <FilterControl label="Individual KPI Selector" border={border} flex="1">
            <Select size="sm" value={effectiveSelectedKpiId} onChange={(event) => setSelectedKpiId(event.target.value)}>
              <option value="all">All matching KPIs - average achievement</option>
              {filteredKpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>{kpi.department} - {kpi.name}</option>
              ))}
            </Select>
          </FilterControl>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} flex={{ lg: '0 0 520px' }}>
            {[
              ['KPIs', trendCards.length],
              ['Periods', chartData.length],
              ['On Track', `${Math.round((trendCards.filter((card) => card.current?.score >= 3).length / Math.max(trendCards.length, 1)) * 100)}%`],
              ['Selected', effectiveSelectedKpiId === 'all' ? 'Average' : 'Single KPI'],
            ].map(([label, value]) => (
              <Box key={label} border="1px solid" borderColor={border} bg={panel} borderRadius="8px" p={3}>
                <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={muted}>{label}</Text>
                <Text fontSize="20px" fontWeight="800" color={text}>{value}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Flex>

        {isLoading && (
          <HStack justify="center" border="1px solid" borderColor={border} borderRadius="8px" p={8} bg={panel}>
            <Spinner size="sm" color={PRIMARY} />
            <Text fontWeight="700" color={text}>Loading KPI data from the backend�</Text>
          </HStack>
        )}

        {!isLoading && loadError && (
          <Box border="1px solid" borderColor="red.300" borderRadius="8px" p={6} textAlign="center" bg={panel}>
            <Text fontWeight="800" color="red.500">Unable to load KPI data</Text>
            <Text fontSize="13px" color={muted} mt={1}>{loadError}</Text>
          </Box>
        )}

        {!isLoading && !loadError && trendCards.length === 0 && (
          <Box border="1px solid" borderColor={border} borderRadius="8px" p={8} textAlign="center" bg={panel}>
            <Text fontWeight="800" color={text}>No KPI data for the selected filters</Text>
            <Text fontSize="13px" color={muted} mt={1}>Choose another period, department, pillar, or time range.</Text>
          </Box>
        )}

        {!isLoading && !loadError && viewMode === 'Charts' && chartData.length > 0 && (
        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4} mb={5}>
        <Box border="1px solid" borderColor={border} borderRadius="8px" p={{ base: 3, md: 4 }} gridColumn={{ xl: 'span 2' }}>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2} mb={4}>
            <Box>
              <Text fontWeight="800" color={text}>
                {effectiveSelectedKpiId === 'all' ? 'Filtered KPI Average Achievement' : selectedCard?.kpi.name}
              </Text>
              <Text fontSize="12px" color={muted}>
                {timeRange} | {selectedMonths[0]?.label || 'No data'} - {selectedMonths[selectedMonths.length - 1]?.label || 'No data'} | Unit: {chartUnit}
              </Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap">
              {Object.entries(SCORE_LABELS).reverse().map(([score, label]) => (
                <Badge key={score} bg={SCORE_COLORS[score]} color="white" borderRadius="6px">{score} {label}</Badge>
              ))}
            </HStack>
          </Flex>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={TARGET_GRAY}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
              />
              {comparePrevious && (
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Previous period"
                  stroke={chartColor}
                  strokeWidth={2}
                  strokeOpacity={0.35}
                  dot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={chartColor}
                strokeWidth={3}
                dot={({ cx, cy, payload }) => (
                  <circle cx={cx} cy={cy} r={4} fill={SCORE_COLORS[payload.score]} stroke={surface} strokeWidth={2} />
                )}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Box border="1px solid" borderColor={border} borderRadius="8px" p={{ base: 3, md: 4 }}>
          <Text fontWeight="800" color={text}>Score Distribution</Text>
          <Text fontSize="12px" color={muted} mb={4}>
            Current period status for the selected filter
          </Text>
          <ResponsiveContainer width="100%" height={330}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={98} paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.score} fill={SCORE_COLORS[entry.score]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        </SimpleGrid>
        )}

        {!isLoading && !loadError && viewMode === 'Cards' && trendCards.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
          {trendCards.map((card) => (
            <Box key={card.kpi.id} border="1px solid" borderColor={border} borderRadius="8px" p={4} bg={surface}>
              <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
                <Box minW={0}>
                  <Text fontSize="14px" fontWeight="800" color={text} noOfLines={1}>{card.kpi.name}</Text>
                  <Text fontSize="12px" color={muted}>{card.kpi.department}</Text>
                </Box>
                <Badge bg={SCORE_COLORS[card.current?.score || 3]} color="white" borderRadius="6px">
                  {card.current?.score || 3}
                </Badge>
              </Flex>
              <svg width="100%" height="42" viewBox="0 0 132 34" preserveAspectRatio="none">
                <polyline fill="none" stroke={SCORE_COLORS[card.current?.score || 3]} strokeWidth="2.4" points={card.spark} />
              </svg>
              <Flex justify="space-between" align="flex-end" gap={3} mt={3}>
                <Box>
                  <Text fontSize="11px" color={muted}>Current vs target</Text>
                  <Text fontSize="13px" color={text} fontWeight="800">
                    {formatValue(card.current?.actual || 0, card.kpi)} / {formatValue(card.current?.target || card.kpi.target, card.kpi)}
                  </Text>
                </Box>
                <Text fontSize="18px" color={SCORE_COLORS[card.current?.score || 3]} fontWeight="900" title={card.trend.label}>
                  {card.trend.symbol}
                </Text>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
        )}

        {!isLoading && !loadError && viewMode === 'Table' && tableRows.length > 0 && (
          <Box overflowX="auto" border="1px solid" borderColor={border} borderRadius="8px">
            <Table size="sm">
              <Thead bg={panel}>
                <Tr>
                  <Th>Department</Th>
                  <Th>Pillar</Th>
                  <Th>KPI</Th>
                  <Th>Period</Th>
                  <Th>Actual</Th>
                  <Th>Target</Th>
                  <Th isNumeric>Achievement</Th>
                  <Th>Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tableRows.map(({ kpi, point }) => (
                  <Tr key={`${kpi.id}-${point.period}`}>
                    <Td fontWeight="700" color={text}>{kpi.department}</Td>
                    <Td color={muted}>{kpi.pillar}</Td>
                    <Td color={text}>{kpi.name}</Td>
                    <Td color={muted}>{point.period}</Td>
                    <Td color={text} fontWeight="700">{formatValue(point.actual, kpi)}</Td>
                    <Td color={muted}>{formatValue(point.target, kpi)}</Td>
                    <Td isNumeric color={text}>{Math.round(point.achievement)}%</Td>
                    <Td>
                      <Badge bg={SCORE_COLORS[point.score]} color="white" borderRadius="6px">
                        {point.score} - {SCORE_LABELS[point.score]}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box mt={5}>
          <CompletedSalesTable title="Completed Sales Follow-ups" />
        </Box>
      </Box>
    </Box>
  );
};

const FilterControl = ({ label, children, border, ...props }) => (
  <Box border="1px solid" borderColor={border} borderRadius="8px" p={2} {...props}>
    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color="#64748B" mb={1}>{label}</Text>
    {children}
  </Box>
);

export default COOKpiDashboard;
