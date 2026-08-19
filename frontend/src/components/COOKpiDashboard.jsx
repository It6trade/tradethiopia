import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
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
  useToast,
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
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import CompletedSalesTable from './salesmanager/CompletedSalesTable';
import axiosInstance from '../services/axiosInstance';
import { useUserStore } from '../store/user';

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
const DEPARTMENTS = ['All', 'Sales', 'Customer Success', 'IT', 'Tradex TV', 'Operations', 'HR', 'Finance', 'Supervisor', 'ENISRA', 'Tessbin'];
const buildCompleteMonthList = (periods = []) => {
  return [...new Set(periods)]
    .filter((key) => /^\d{4}-\d{2}$/.test(String(key)))
    .sort()
    .map((key) => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return {
      key,
      label: date.toLocaleString('en', { month: 'short', year: 'numeric' }),
      short: date.toLocaleString('en', { month: 'short' }),
    };
    });
};
const getDefaultMonthRange = (periods = [], currentMonth) => {
  if (!periods.length) return { start: '', end: '' };
  const currentYear = currentMonth.slice(0, 4);
  const currentYearPeriods = periods.filter((month) => month.key.startsWith(`${currentYear}-`));
  const activeYearPeriods = currentYearPeriods.length
    ? currentYearPeriods
    : periods.filter((month) => month.key.startsWith(`${periods[periods.length - 1].key.slice(0, 4)}-`));
  const end = currentYearPeriods.length ? currentMonth : activeYearPeriods[activeYearPeriods.length - 1].key;
  const [endYear, endMonthNumber] = end.split('-').map(Number);
  const previousMonthDate = new Date(Date.UTC(endYear, endMonthNumber - 2, 1));
  const previousMonth = `${previousMonthDate.getUTCFullYear()}-${String(previousMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const earliestMonth = periods[0].key;
  return { start: previousMonth >= earliestMonth ? previousMonth : earliestMonth, end };
};
const formatValue = (value, kpi) => {
  if (kpi.format === 'currency') return `ETB ${Math.round(value).toLocaleString()}`;
  if (kpi.format === 'compact') return window.Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  if (kpi.format === 'percent') return `${Number(value).toFixed(value < 10 ? 1 : 0)}%`;
  if (kpi.format === 'decimal') return `${Number(value).toFixed(1)}${kpi.unit ? ` ${kpi.unit}` : ''}`;
  return `${Math.round(value).toLocaleString()}${kpi.unit ? ` ${kpi.unit}` : ''}`;
};

const achievementFor = (kpi, actual, target = kpi.target) => {
  if (target === null || target === undefined) return null;
  if (target === 0) return actual <= 0 ? 120 : actual <= 1 ? 80 : 50;
  return kpi.lowerIsBetter ? (target / Math.max(actual, 0.001)) * 100 : (actual / target) * 100;
};

const scoreFor = (achievement) => {
  if (achievement === null || achievement === undefined || !Number.isFinite(achievement)) return null;
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
    const targetedRows = groupRows.filter((row) => row.target !== null && row.target !== undefined);
    const target = targetedRows.length === 0 ? null : (kpi.aggregate === 'sum'
      ? targetedRows.reduce((sum, row) => sum + row.target, 0)
      : targetedRows.reduce((sum, row) => sum + row.target, 0) / targetedRows.length);
    const achievement = achievementFor(kpi, actual, target);
    const score = scoreFor(achievement);
    const previousActual = groupIndex > 0 ? getActualForRange(kpi, groups[groupIndex - 1].groupRows) : undefined;
    return { period: group.period, actual, target, achievement, score, scoreLabel: SCORE_LABELS[score], previousActual };
  });
};
const formatTarget = (value, kpi) => value === null || value === undefined ? '—' : formatValue(value, kpi);
const formatAchievement = (value) => Number.isFinite(value) ? `${Math.round(value)}%` : '—';

const sortPeriods = (periods, timeRange) => [...periods].sort((a, b) => {
  if (timeRange !== 'Quarterly') return String(a).localeCompare(String(b));
  const parseQuarter = (value) => {
    const match = String(value).match(/^Q([1-4])\s+(\d{4})$/);
    return match ? (Number(match[2]) * 10) + Number(match[1]) : 0;
  };
  return parseQuarter(a) - parseQuarter(b);
});

const getTrend = (points) => {
  const last = points.filter((point) => Number.isFinite(point.achievement)).slice(-3);
  if (last.length < 3) return { symbol: 'â†’', label: 'Stable' };
  const delta = last[2].achievement - last[0].achievement;
  if (delta > 4) return { symbol: 'â†‘', label: 'Improving' };
  if (delta < -4) return { symbol: 'â†“', label: 'Declining' };
  return { symbol: 'â†’', label: 'Stable' };
};

const buildSparkPoints = (points, width = 132, height = 34) => {
  const validPoints = points.filter((point) => Number.isFinite(point.achievement));
  if (!validPoints.length) return '';
  const values = validPoints.map((point) => point.achievement);
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  return validPoints
    .map((point, index) => {
      const x = validPoints.length === 1 ? 0 : (index / (validPoints.length - 1)) * width;
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
      <Text fontSize="12px">Target: {formatTarget(target, kpi)}</Text>
      <Text fontSize="12px">Achievement: {formatAchievement(achievement)}</Text>
      <Badge mt={2} bg={score ? SCORE_COLORS[score] : '#64748B'} color="white">
        {score ? `${score} - ${scoreLabel}` : 'No target'}
      </Badge>
    </Box>
  );
};

const EditableTargetCell = ({ kpi, point, onSave, border, text, muted }) => {
  const value = point.target ?? '';
  const [draft, setDraft] = useState(value === '' ? '' : String(value));
  const [saving, setSaving] = useState(false);
  const period = point.period || point.key || '';
  const isEditablePeriod = /^\d{4}-(?:\d{2}|W\d{2})$/.test(period);

  useEffect(() => setDraft(value === '' ? '' : String(value)), [value]);

  const commit = async () => {
    if (draft === '' || (value !== '' && Number(draft) === Number(value))) return;
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(value === '' ? '' : String(value));
      return;
    }
    setSaving(true);
    try {
      await onSave(kpi, point, parsed);
    } catch {
      setDraft(value === '' ? '' : String(value));
    } finally {
      setSaving(false);
    }
  };

  if (!isEditablePeriod) return <Text color={muted}>{formatTarget(point.target, kpi)}</Text>;
  return (
    <Input
      type="number"
      min="0"
      step="any"
      size="xs"
      width="112px"
      height="30px"
      value={draft}
      placeholder="Set target"
      aria-label={`Target for ${kpi.department} ${kpi.name} ${period}`}
      borderColor={border}
      color={text}
      _placeholder={{ color: muted }}
      isDisabled={saving}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
    />
  );
};

const COOKpiDashboard = () => {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const toast = useToast();
  const [kpiDefs, setKpiDefs] = useState([]);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [viewMode, setViewMode] = useState('Charts');
  const [timeRange, setTimeRange] = useState('Monthly');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [tableStartMonth, setTableStartMonth] = useState('');
  const [tableEndMonth, setTableEndMonth] = useState('');
  const [comparePrevious, setComparePrevious] = useState(false);
  const [department, setDepartment] = useState('All');
  const [pillar, setPillar] = useState('All Pillars');
  const [selectedKpiId, setSelectedKpiId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedKpiRows, setSelectedKpiRows] = useState([]);
  const [selectedKpiLoading, setSelectedKpiLoading] = useState(false);
  const [selectedKpiError, setSelectedKpiError] = useState('');
  const [detailDepartment, setDetailDepartment] = useState('All');
  const [detailPillar, setDetailPillar] = useState('All');
  const [detailStatus, setDetailStatus] = useState('All');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(25);
  const [detailKpiDefs, setDetailKpiDefs] = useState([]);
  const [detailMonthlyRows, setDetailMonthlyRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState('');
  const [hasInitializedRange, setHasInitializedRange] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const pageBg = useColorModeValue('#F3F6FA', '#080D18');
  const surface = useColorModeValue('#FFFFFF', '#111827');
  const panel = useColorModeValue('#F8FAFC', '#0B1120');
  const border = useColorModeValue('#DDE5EF', '#263241');
  const text = useColorModeValue('#0F172A', '#F8FAFC');
  const muted = useColorModeValue('#64748B', '#A6B3C3');
  const softHover = useColorModeValue('#EFF6FF', '#162033');

  const handleLogout = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const saveKpiTarget = async (kpi, point, target) => {
    const granularity = point.granularity || (String(point.period).includes('-W') ? 'week' : 'month');
    const period = point.period || point.key;
    try {
      await axiosInstance.put('/coo-dashboard/kpi-target', { kpiId: kpi.id, period, granularity, target });
      const applyTarget = (rows) => rows.map((row) => (
        row.kpiId === kpi.id
        && (row.granularity || 'month') === granularity
        && (row.period || row.key) === period
          ? { ...row, target }
          : row
      ));
      setMonthlyRows(applyTarget);
      setDetailMonthlyRows(applyTarget);
      setSelectedKpiRows(applyTarget);
      toast({
        title: 'Target saved',
        description: `${kpi.department} · ${kpi.name}`,
        status: 'success',
        duration: 2200,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Could not save target',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
      throw error;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setEndMonth(currentMonth);
    setTableEndMonth(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    axiosInstance.get('/coo-dashboard/kpis', {
      params: hasInitializedRange ? {
        startMonth,
        endMonth,
        department: department === 'All' ? undefined : department,
      } : undefined,
    }).then(({ data }) => {
      if (!active) return;
      const periodList = buildCompleteMonthList(data.periods);

      setKpiDefs(Array.isArray(data.definitions) ? data.definitions : []);
      setMonthlyRows(Array.isArray(data.rows) ? data.rows : []);
      setMonths(periodList);
      if (!hasInitializedRange && periodList.length) {
        const defaultRange = getDefaultMonthRange(periodList, currentMonth);
        setStartMonth(defaultRange.start);
        setEndMonth(defaultRange.end);
        setTableStartMonth(defaultRange.start);
        setTableEndMonth(defaultRange.end);
        setHasInitializedRange(true);
      }
    }).catch((error) => {
      if (active) {
        setKpiDefs([]);
        setMonthlyRows([]);
        setMonths([]);
        setLoadError(error.response?.data?.message || error.message || 'Backend request failed.');
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [currentMonth, startMonth, endMonth, department, hasInitializedRange]);

  const selectedMonths = useMemo(() => {
    if (!startMonth || !endMonth) return [];
    const first = startMonth <= endMonth ? startMonth : endMonth;
    const last = startMonth <= endMonth ? endMonth : startMonth;
    return months.filter((month) => month.key >= first && month.key <= last);
  }, [startMonth, endMonth, months]);

  const tableSelectedMonths = useMemo(() => {
    if (!tableStartMonth || !tableEndMonth) return [];
    const first = tableStartMonth <= tableEndMonth ? tableStartMonth : tableEndMonth;
    const last = tableStartMonth <= tableEndMonth ? tableEndMonth : tableStartMonth;
    return months.filter((month) => month.key >= first && month.key <= last);
  }, [tableStartMonth, tableEndMonth, months]);

  const salesTableDateRange = useMemo(() => {
    if (!tableStartMonth || !tableEndMonth) return { dateFrom: undefined, dateTo: undefined };
    const firstMonth = tableStartMonth <= tableEndMonth ? tableStartMonth : tableEndMonth;
    const lastMonth = tableStartMonth <= tableEndMonth ? tableEndMonth : tableStartMonth;
    const [endYear, endMonthNumber] = lastMonth.split('-').map(Number);
    return {
      dateFrom: `${firstMonth}-01T00:00:00.000Z`,
      dateTo: new Date(Date.UTC(endYear, endMonthNumber, 0, 23, 59, 59, 999)).toISOString(),
    };
  }, [tableStartMonth, tableEndMonth]);

  useEffect(() => {
    if (!hasInitializedRange || !tableStartMonth || !tableEndMonth) return undefined;
    let active = true;
    setDetailLoading(true);
    setDetailLoadError('');
    axiosInstance.get('/coo-dashboard/kpis', {
      params: {
        startMonth: tableStartMonth,
        endMonth: tableEndMonth,
        department: detailDepartment === 'All' ? undefined : detailDepartment,
        pillar: detailPillar === 'All' ? undefined : detailPillar,
      },
    }).then(({ data }) => {
      if (!active) return;
      setDetailKpiDefs(Array.isArray(data.definitions) ? data.definitions : []);
      setDetailMonthlyRows(Array.isArray(data.rows) ? data.rows : []);
    }).catch((error) => {
      if (!active) return;
      setDetailKpiDefs([]);
      setDetailMonthlyRows([]);
      setDetailLoadError(error.response?.data?.message || error.message || 'Failed to load department KPI records.');
    }).finally(() => {
      if (active) setDetailLoading(false);
    });
    return () => { active = false; };
  }, [hasInitializedRange, tableStartMonth, tableEndMonth, detailDepartment, detailPillar]);

  const availablePillars = useMemo(
    () => ['All Pillars', ...new Set(kpiDefs.map((kpi) => kpi.pillar).filter(Boolean))],
    [kpiDefs]
  );

  const filteredKpis = useMemo(
    () =>
      kpiDefs.filter((kpi) => department === 'All' || kpi.department === department).filter(
        (kpi) => pillar === 'All Pillars' || kpi.pillar === pillar
      ),
    [department, pillar, kpiDefs]
  );

  const effectiveSelectedKpiId = selectedKpiId !== 'all' && filteredKpis.some((kpi) => kpi.id === selectedKpiId) ? selectedKpiId : 'all';

  useEffect(() => {
    if (effectiveSelectedKpiId === 'all' || !startMonth || !endMonth) {
      setSelectedKpiRows([]);
      setSelectedKpiError('');
      setSelectedKpiLoading(false);
      return undefined;
    }

    let active = true;
    setSelectedKpiLoading(true);
    setSelectedKpiError('');
    axiosInstance.get('/coo-dashboard/kpis', {
      params: {
        startMonth,
        endMonth,
        department: department === 'All' ? undefined : department,
        pillar: pillar === 'All Pillars' ? undefined : pillar,
        kpiId: effectiveSelectedKpiId,
      },
    }).then(({ data }) => {
      if (!active) return;
      const backendRows = Array.isArray(data.rows) ? data.rows : [];
      setSelectedKpiRows(backendRows);
      const hasWeeklyRows = backendRows.some((row) => (row.granularity || 'month') === 'week');
      const hasMonthlyRows = backendRows.some((row) => (row.granularity || 'month') === 'month');
      if (timeRange === 'Weekly' && !hasWeeklyRows && hasMonthlyRows) setTimeRange('Monthly');
    }).catch((error) => {
      if (!active) return;
      setSelectedKpiRows([]);
      setSelectedKpiError(error.response?.data?.message || error.message || 'Failed to fetch the selected KPI.');
    }).finally(() => {
      if (active) setSelectedKpiLoading(false);
    });
    return () => { active = false; };
  }, [effectiveSelectedKpiId, startMonth, endMonth, department, pillar, timeRange]);

  const trendCards = useMemo(
    () =>
      filteredKpis.map((kpi) => {
        const requiredGranularity = timeRange === 'Weekly' ? 'week' : 'month';
        const backendRows = effectiveSelectedKpiId !== 'all' && kpi.id === effectiveSelectedKpiId
          ? selectedKpiRows
          : monthlyRows;
        const sourceRows = backendRows
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
    [filteredKpis, selectedMonths, timeRange, monthlyRows, selectedKpiRows, effectiveSelectedKpiId, months]
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
    const averagedData = periods.map((periodLabel, index) => {
      const matchingPoints = trendCards
        .map((card) => card.points.find((point) => point.period === periodLabel))
        .filter((point) => Number.isFinite(point?.achievement));
      if (!matchingPoints.length) return null;
      const achievement = matchingPoints.reduce((sum, point) => sum + point.achievement, 0) / Math.max(matchingPoints.length, 1);
      const previousPeriod = periods[index - 1];
      const previousPoints = previousPeriod
        ? trendCards.map((card) => card.points.find((point) => point.period === previousPeriod)).filter((point) => Number.isFinite(point?.achievement))
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
    }).filter(Boolean);
    if (averagedData.length) return averagedData;

    // Live dashboard KPIs such as Finance and Customer Success may not have a
    // configured target. Show the first matching KPI's real actuals rather than
    // leaving the chart blank or inventing an achievement percentage.
    const fallbackCard = trendCards[0];
    return (fallbackCard?.points || []).map((point) => ({
      period: point.period,
      actual: point.actual,
      target: undefined,
      previous: point.previousActual,
      score: null,
      achievement: null,
      tooltip: { ...point, kpi: fallbackCard.kpi },
    }));
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

  const detailPillars = useMemo(() => [
    'All',
    ...new Set(detailKpiDefs
      .filter((kpi) => detailDepartment === 'All' || kpi.department === detailDepartment)
      .map((kpi) => kpi.pillar)
      .filter(Boolean)),
  ], [detailKpiDefs, detailDepartment]);

  const detailTableRows = useMemo(
    () => detailKpiDefs.flatMap((kpi) => detailMonthlyRows
      .filter((row) => row.kpiId === kpi.id
        && (row.granularity || 'month') === 'month'
        && tableSelectedMonths.some((month) => month.key === row.key))
      .map((row) => {
        const achievement = achievementFor(kpi, row.actual, row.target);
        const score = scoreFor(achievement);
        return {
          kpi,
          point: {
            ...row,
            period: row.period || row.key,
            achievement,
            score,
            scoreLabel: SCORE_LABELS[score],
          },
        };
      }))
      .filter(({ kpi, point }) => (
        (detailDepartment === 'All' || kpi.department === detailDepartment)
        && (detailPillar === 'All' || kpi.pillar === detailPillar)
        && (detailStatus === 'All' || (detailStatus === 'No target' ? point.score === null : point.score === Number(detailStatus)))
        && (!detailSearch || `${kpi.department} ${kpi.pillar} ${kpi.name}`.toLowerCase().includes(detailSearch.trim().toLowerCase()))
      ))
      .sort((a, b) => (
        String(b.point.key).localeCompare(String(a.point.key))
        || a.kpi.department.localeCompare(b.kpi.department)
        || a.kpi.name.localeCompare(b.kpi.name)
      )),
    [detailKpiDefs, detailMonthlyRows, tableSelectedMonths, detailDepartment, detailPillar, detailStatus, detailSearch]
  );

  useEffect(() => setDetailPage(1), [tableStartMonth, tableEndMonth, detailDepartment, detailPillar, detailStatus, detailSearch, detailPageSize]);

  const detailPageCount = Math.max(1, Math.ceil(detailTableRows.length / detailPageSize));
  const visibleDetailRows = detailTableRows.slice((detailPage - 1) * detailPageSize, detailPage * detailPageSize);

  const pieData = useMemo(() => {
    const counts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    trendCards
      .filter((card) => effectiveSelectedKpiId === 'all' || card.kpi.id === effectiveSelectedKpiId)
      .forEach((card) => {
        if (card.current?.score) counts[card.current.score] += 1;
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
    <Box minH="100vh" bg={pageBg} px={{ base: 3, md: 9 }} py={{ base: 4, md: 10 }}>
      <Box
        maxW="none"
        mx="auto"
        bg={surface}
        border="1px solid"
        borderColor={border}
        borderRadius="12px"
        p={{ base: 4, md: 7 }}
        position="relative"
      >
        <Flex justify="space-between" align={{ base: 'stretch', xl: 'flex-start' }} direction={{ base: 'column', xl: 'row' }} gap={5} mb={7}>
          <Box>
            <Text fontSize="13px" textTransform="uppercase" letterSpacing="0.16em" color={PRIMARY} fontWeight="800">
              Tradethiopia Group
            </Text>
            <Text fontSize={{ base: '28px', md: '36px' }} lineHeight="1.2" fontWeight="800" color={text} mt={3}>
              KPI vs Time Viewer
            </Text>
            <Text fontSize={{ base: '13px', md: '15px' }} color={muted} mt={3}>
              KPI actuals over time against targets, with score-band status and previous-period comparison.
            </Text>
          </Box>
          <VStack align={{ base: 'stretch', xl: 'flex-end' }} spacing={2.5} pt={{ base: 10, md: 12 }}>
            <Button
              position="absolute"
              top={{ base: 3, md: 4 }}
              right={{ base: 3, md: 4 }}
              zIndex={2}
              leftIcon={<FiLogOut />}
              h="34px"
              px={3.5}
              fontSize="13px"
              fontWeight="700"
              bg="red.50"
              color="red.600"
              border="1px solid"
              borderColor="red.200"
              borderRadius="7px"
              boxShadow="none"
              _hover={{ bg: 'red.100', borderColor: 'red.300' }}
              _active={{ bg: 'red.200' }}
              _focusVisible={{ boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.22)' }}
              transition="all 0.16s ease"
              onClick={handleLogout}
            >
              Log out
            </Button>
            <HStack spacing={2.5} flexWrap="wrap" justify="flex-end">
              {['Charts', 'Cards', 'Table'].map((item) => (
                <Button
                  key={item}
                  h="44px"
                  px={5}
                  fontSize="15px"
                  borderRadius="8px"
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
            <HStack spacing={2.5} flexWrap="wrap" w="100%" justify="flex-end" alignSelf="flex-end">
              {['Weekly', 'Monthly', 'Quarterly'].map((item) => (
                <Button
                  key={item}
                  h="44px"
                  px={5}
                  fontSize="15px"
                  borderRadius="8px"
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

        <Flex direction={{ base: 'column', xl: 'row' }} align="stretch" gap={3} mb={6}>
          <Box flex={{ xl: '0 1 40%' }} minW={0} overflow="hidden">
            <Text fontSize="12px" fontWeight="800" color={muted} mb={3}>Department</Text>
            <Flex
              gap={1}
              flexWrap="nowrap"
              overflowX="auto"
              pb={2}
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
                  px={{ base: 2.5, '2xl': 3 }}
                  h="30px"
                  fontSize={{ base: '11px', '2xl': '12px' }}
                  bg={department === item ? PRIMARY : surface}
                  color={department === item ? 'white' : text}
                  border="1px solid"
                  borderColor={department === item ? PRIMARY : border}
                  _hover={{ bg: department === item ? PRIMARY : panel }}
                  onClick={() => {
                    setDepartment(item);
                    setPillar('All Pillars');
                    setSelectedKpiId('all');
                    setDetailDepartment(item);
                    setDetailPillar('All');
                    setDetailStatus('All');
                    setDetailSearch('');
                  }}
                >
                  {item}
                </Button>
              ))}
            </Flex>
          </Box>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3} flex={{ xl: '1 1 60%' }} minW={{ xl: '720px' }}>
            <FilterControl label="Start Month" border={border}>
              <MonthYearPicker
                value={startMonth}
                onChange={setStartMonth}
              />
            </FilterControl>
            <FilterControl label="End Month" border={border}>
              <MonthYearPicker
                value={endMonth}
                onChange={setEndMonth}
              />
            </FilterControl>
            <FilterControl label="Pillar" border={border}>
              <Select size="sm" value={pillar} onChange={(event) => {
                setPillar(event.target.value);
                setSelectedKpiId('all');
              }}>
                {availablePillars.map((item) => <option key={item} value={item}>{item}</option>)}
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

        <Flex direction={{ base: 'column', lg: 'row' }} gap={4} mb={6}>
          <FilterControl label="Individual KPI Selector" border={border} flex="1">
            <Select size="sm" value={effectiveSelectedKpiId} onChange={(event) => {
              setSelectedKpiId(event.target.value);
              if (event.target.value !== 'all') setViewMode('Charts');
            }}>
              <option value="all">All matching KPIs - average achievement</option>
              {filteredKpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>{kpi.department} - {kpi.name}</option>
              ))}
            </Select>
          </FilterControl>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} flex={{ lg: '0 0 46%' }}>
            {[
              ['KPIs', trendCards.length],
              ['Periods', chartData.length],
              ['On Track', (() => {
                const scoredCards = trendCards.filter((card) => card.current?.score);
                return scoredCards.length
                  ? `${Math.round((scoredCards.filter((card) => card.current.score >= 3).length / scoredCards.length) * 100)}%`
                  : 'No targets';
              })()],
              ['Selected', effectiveSelectedKpiId === 'all' ? 'Average' : 'Single KPI'],
            ].map(([label, value]) => (
              <Box key={label} border="1px solid" borderColor={border} bg={panel} borderRadius="8px" px={4} py={4} minH="86px">
                <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={muted}>{label}</Text>
                <Text
                  fontSize={{ base: '20px', xl: '21px' }}
                  lineHeight="1.2"
                  mt={2}
                  fontWeight="800"
                  color={text}
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  title={String(value)}
                >
                  {value}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Flex>

        {effectiveSelectedKpiId !== 'all' && selectedKpiLoading && (
          <HStack mb={4} px={3} py={2} border="1px solid" borderColor={border} borderRadius="8px" bg={panel}>
            <Spinner size="xs" color={PRIMARY} />
            <Text fontSize="xs" fontWeight="700" color={muted}>Fetching selected KPI records from the backend…</Text>
          </HStack>
        )}

        {effectiveSelectedKpiId !== 'all' && !selectedKpiLoading && selectedKpiError && (
          <Box mb={4} px={3} py={2} border="1px solid" borderColor="red.300" borderRadius="8px" bg={panel}>
            <Text fontSize="xs" fontWeight="700" color="red.500">{selectedKpiError}</Text>
          </Box>
        )}

        {isLoading && (
          <HStack justify="center" border="1px solid" borderColor={border} borderRadius="8px" p={8} bg={panel}>
            <Spinner size="sm" color={PRIMARY} />
            <Text fontWeight="700" color={text}>Loading KPI data from the backend…</Text>
          </HStack>
        )}

        {!isLoading && loadError && (
          <Box border="1px solid" borderColor="red.300" borderRadius="8px" p={6} textAlign="center" bg={panel}>
            <Text fontWeight="800" color="red.500">Unable to load KPI data</Text>
            <Text fontSize="13px" color={muted} mt={1}>{loadError}</Text>
          </Box>
        )}

        {!isLoading && !loadError && !selectedKpiLoading && !selectedKpiError && trendCards.length === 0 && (
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
                {effectiveSelectedKpiId !== 'all' ? ' | Source: backend' : ''}
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
                  <circle cx={cx} cy={cy} r={4} fill={payload.score ? SCORE_COLORS[payload.score] : PRIMARY} stroke={surface} strokeWidth={2} />
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
                <Badge bg={card.current?.score ? SCORE_COLORS[card.current.score] : '#64748B'} color="white" borderRadius="6px">
                  {card.current?.score || 'No target'}
                </Badge>
              </Flex>
              <svg width="100%" height="42" viewBox="0 0 132 34" preserveAspectRatio="none">
                <polyline fill="none" stroke={card.current?.score ? SCORE_COLORS[card.current.score] : PRIMARY} strokeWidth="2.4" points={card.spark} />
              </svg>
              <Flex justify="space-between" align="flex-end" gap={3} mt={3}>
                <Box>
                  <Text fontSize="11px" color={muted}>Current vs target</Text>
                  <Text fontSize="13px" color={text} fontWeight="800">
                    {formatValue(card.current?.actual || 0, card.kpi)} / {formatTarget(card.current?.target ?? card.kpi.target, card.kpi)}
                  </Text>
                </Box>
                <Text fontSize="18px" color={card.current?.score ? SCORE_COLORS[card.current.score] : muted} fontWeight="900" title={card.trend.label}>
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
                    <Td>
                      <EditableTargetCell kpi={kpi} point={point} onSave={saveKpiTarget} border={border} text={text} muted={muted} />
                    </Td>
                    <Td isNumeric color={text}>{formatAchievement(point.achievement)}</Td>
                    <Td>
                      <Badge bg={point.score ? SCORE_COLORS[point.score] : '#64748B'} color="white" borderRadius="6px">
                        {point.score ? `${point.score} - ${SCORE_LABELS[point.score]}` : 'No target'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box mt={5} mb={3} overflowX="auto" pb={1} sx={{ scrollbarWidth: 'thin' }}>
          <Flex gap={2} minW="1120px" align="stretch">
            <TableFilterControl label="Start Month" border={border} width="180px">
              <MonthYearPicker
                value={tableStartMonth}
                onChange={setTableStartMonth}
                compact
              />
            </TableFilterControl>
            <TableFilterControl label="End Month" border={border} width="180px">
              <MonthYearPicker
                value={tableEndMonth}
                onChange={setTableEndMonth}
                compact
              />
            </TableFilterControl>
          <TableFilterControl label="Department" border={border} width="155px">
            <Select size="xs" h="28px" value={detailDepartment} onChange={(event) => {
              setDetailDepartment(event.target.value);
              setDetailPillar('All');
            }}>
              {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </TableFilterControl>
          <TableFilterControl label="Pillar" border={border} width="145px">
            <Select size="xs" h="28px" value={detailPillar} onChange={(event) => setDetailPillar(event.target.value)}>
              {detailPillars.map((item) => <option key={item} value={item}>{item === 'All' ? 'All Pillars' : item}</option>)}
            </Select>
          </TableFilterControl>
          <TableFilterControl label="Status" border={border} width="135px">
            <Select size="xs" h="28px" value={detailStatus} onChange={(event) => setDetailStatus(event.target.value)}>
              <option value="All">All Statuses</option>
              <option value="4">4 - Exceeds</option>
              <option value="3">3 - Meets</option>
              <option value="2">2 - Near Miss</option>
              <option value="1">1 - Below</option>
              <option value="No target">No target</option>
            </Select>
          </TableFilterControl>
          <TableFilterControl label="Search KPI" border={border} flex="1" minW="220px">
            <Input
              size="xs"
              h="28px"
              value={detailSearch}
              placeholder="Department, pillar, or KPI"
              onChange={(event) => setDetailSearch(event.target.value)}
            />
          </TableFilterControl>
          <TableFilterControl label="Rows" border={border} width="90px">
            <Select size="xs" h="28px" value={detailPageSize} onChange={(event) => setDetailPageSize(Number(event.target.value))}>
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </Select>
          </TableFilterControl>
          </Flex>
        </Box>

        {detailDepartment === 'Sales' ? (
          <CompletedSalesTable
            title="Completed Sales Follow-ups by Agent"
            dateFrom={salesTableDateRange.dateFrom}
            dateTo={salesTableDateRange.dateTo}
          />
        ) : (
          <Box border="1px solid" borderColor={border} borderRadius="8px" overflow="hidden">
            <Box px={4} py={3} bg={panel} borderBottom="1px solid" borderColor={border}>
              <Text fontSize="lg" fontWeight="800" color={text}>
                {detailDepartment === 'All' ? 'All Department KPI Records' : `${detailDepartment} KPI Records`}
              </Text>
              <Text fontSize="sm" color={muted}>
                Backend department performance records for the selected year and month range.
              </Text>
            </Box>
            {detailLoading && (
              <HStack justify="center" py={8} color={muted}>
                <Spinner size="sm" color={PRIMARY} />
                <Text fontSize="sm" fontWeight="700">Fetching filtered KPI records from the backend…</Text>
              </HStack>
            )}
            {!detailLoading && detailLoadError && (
              <Box py={8} px={4} textAlign="center">
                <Text color="red.500" fontWeight="700">{detailLoadError}</Text>
              </Box>
            )}
            {!detailLoading && !detailLoadError && (
            <>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead bg={panel}>
                  <Tr>
                    <Th>Department</Th>
                    <Th>Pillar</Th>
                    <Th>Employee / KPI</Th>
                    <Th>Period</Th>
                    <Th>Actual</Th>
                    <Th>Target</Th>
                    <Th isNumeric>Achievement</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {visibleDetailRows.length ? visibleDetailRows.map(({ kpi, point }) => (
                    <Tr key={`department-record-${kpi.id}-${point.period}`}>
                      <Td fontWeight="700" color={text}>{kpi.department}</Td>
                      <Td color={muted}>{kpi.pillar}</Td>
                      <Td color={text}>{kpi.name}</Td>
                      <Td color={muted}>{point.period}</Td>
                      <Td color={text} fontWeight="700">{formatValue(point.actual, kpi)}</Td>
                      <Td>
                        <EditableTargetCell kpi={kpi} point={point} onSave={saveKpiTarget} border={border} text={text} muted={muted} />
                      </Td>
                      <Td isNumeric color={text}>{formatAchievement(point.achievement)}</Td>
                      <Td>
                        <Badge bg={point.score ? SCORE_COLORS[point.score] : '#64748B'} color="white" borderRadius="6px">
                          {point.score ? `${point.score} - ${SCORE_LABELS[point.score]}` : 'No target'}
                        </Badge>
                      </Td>
                    </Tr>
                  )) : (
                    <Tr>
                      <Td colSpan={8} py={8} textAlign="center" color={muted}>
                        No real KPI records match the selected department and month range.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            <Flex px={4} py={3} borderTop="1px solid" borderColor={border} align="center" justify="space-between" gap={3} flexWrap="wrap">
              <Text fontSize="xs" color={muted}>
                {detailTableRows.length
                  ? `Showing ${(detailPage - 1) * detailPageSize + 1}-${Math.min(detailPage * detailPageSize, detailTableRows.length)} of ${detailTableRows.length} records`
                  : '0 records'}
              </Text>
              <HStack spacing={2}>
                <Button size="xs" variant="outline" isDisabled={detailPage <= 1} onClick={() => setDetailPage((page) => Math.max(1, page - 1))}>
                  Previous
                </Button>
                <Text fontSize="xs" color={text}>Page {Math.min(detailPage, detailPageCount)} of {detailPageCount}</Text>
                <Button size="xs" variant="outline" isDisabled={detailPage >= detailPageCount} onClick={() => setDetailPage((page) => Math.min(detailPageCount, page + 1))}>
                  Next
                </Button>
              </HStack>
            </Flex>
            </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const FilterControl = ({ label, children, border, ...props }) => (
  <Box border="1px solid" borderColor={border} borderRadius="9px" px={3} py={3} minH="84px" {...props}>
    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color="#64748B" mb={2}>{label}</Text>
    {children}
  </Box>
);

const TableFilterControl = ({ label, children, border, ...props }) => (
  <Box flex="0 0 auto" border="1px solid" borderColor={border} borderRadius="7px" bg="transparent" px={2} py={1.5} {...props}>
    <Text fontSize="9px" lineHeight="11px" fontWeight="800" textTransform="uppercase" color="#64748B" mb={1}>
      {label}
    </Text>
    {children}
  </Box>
);

const MONTH_OPTIONS = [
  ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'],
  ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
  ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 21 }, (_, index) => String(CURRENT_YEAR - 10 + index));

const MonthYearPicker = ({ value, onChange, compact = false }) => {
  const [year = '', month = ''] = String(value || '').split('-');
  const commit = (nextYear, nextMonth) => {
    if (/^\d{4}$/.test(nextYear) && /^\d{2}$/.test(nextMonth)) onChange(`${nextYear}-${nextMonth}`);
  };
  const availableYears = year && !YEAR_OPTIONS.includes(year)
    ? [...YEAR_OPTIONS, year].sort((a, b) => Number(a) - Number(b))
    : YEAR_OPTIONS;

  return (
    <HStack spacing={1.5} w="100%" minW={0}>
      <Select
        aria-label="Month"
        flex="1 1 0"
        minW={0}
        size={compact ? 'xs' : 'sm'}
        h={compact ? '28px' : undefined}
        value={month}
        onChange={(event) => commit(year, event.target.value)}
      >
        <option value="" disabled>Month</option>
        {MONTH_OPTIONS.map(([number, label]) => <option key={number} value={number}>{label}</option>)}
      </Select>
      <Select
        aria-label="Year"
        flex="1 1 0"
        minW={0}
        size={compact ? 'xs' : 'sm'}
        h={compact ? '28px' : undefined}
        value={year}
        onChange={(event) => commit(event.target.value, month)}
      >
        <option value="" disabled>Year</option>
        {availableYears.map((optionYear) => <option key={optionYear} value={optionYear}>{optionYear}</option>)}
      </Select>
    </HStack>
  );
};

export default COOKpiDashboard;
