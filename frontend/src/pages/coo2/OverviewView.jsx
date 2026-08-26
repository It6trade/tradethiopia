// src/pages/coo2/OverviewView.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Box,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { getHrKpis } from '../../services/hrKpiService';
import {
  CUSTOMER_SUCCESS_KPI_DETAILS,
  DEPARTMENT_KPI_SUMMARY,
  FINANCE_KPI_DETAILS,
  HR_KPI_DETAILS,
  IT_KPI_DETAILS,
  SALES_KPI_DETAILS,
  SOCIAL_MEDIA_KPI_DETAILS,
  TRADEX_TV_KPI_DETAILS,
} from './cooData';

const STATUS_STYLES = {
  'On Track': { background: '#d9ead3', color: '#166534' },
  'At Risk': { background: '#ffe599', color: '#854d0e' },
  Behind: { background: '#f9cb9c', color: '#9a3412' },
  'Not Reported': { background: '#ffffff', color: '#475569' },
  Completed: { background: '#dcfce7', color: '#166534' },
  Exceeded: { background: '#bbf7d0', color: '#14532d' },
  'Behind Target': { background: '#fed7aa', color: '#9a3412' },
  Pending: { background: '#f1f5f9', color: '#475569' },
};

const HR_DASHBOARD_KPIS = [
  { key: 'postVacancies', label: 'Post Vacancies', unit: 'vacancies' },
  { key: 'screenCvs', label: 'Screen CVs', unit: 'CVs' },
  { key: 'conductInterviews', label: 'Conduct Interviews', unit: 'interviews' },
  { key: 'facilitateInternalTrainings', label: 'Facilitate Internal Trainings', unit: 'sessions' },
  { key: 'attendancePunctuality', label: 'Employee Attendance & Punctuality', unit: '%' },
  { key: 'checkingJobEnisra', label: 'Checking hr@tradethiopia.com', unit: 'checks' },
  { key: 'newHires', label: 'Number of New Hires', unit: 'hires' },
  { key: 'resignations', label: 'Number of Resignations', unit: 'resignations' },
  { key: 'candidatesPool', label: 'Number of Candidates Pool', unit: 'candidates' },
  { key: 'staffTrainingParticipants', label: 'Staff Participating in Trainings', unit: 'participants' },
];

const formatNumber = (value) => value === null || value === undefined ? '—' : Number(value).toLocaleString();

const AchievementLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#111827" fontSize="13" fontWeight="600">
    {value}%
  </text>
);

const CountLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#111827" fontSize="12">
    {value}
  </text>
);

const AmountLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#111827" fontSize="12">
    {formatNumber(value)}
  </text>
);

const DetailTable = ({
  title,
  rows,
  firstColumnLabel = 'KPI',
  actualLabel = 'Actual',
  statusLabel = 'Status',
}) => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>{title}</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {[firstColumnLabel, 'Target', actualLabel, 'Achievement %', statusLabel].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => {
            const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.Behind;
            return (
              <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.actual)}</Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                  {row.achievement === null || row.achievement === undefined ? 'N/A' : `${row.achievement}%`}
                </Td>
                <Td textAlign="center" fontSize="14px" fontWeight="600" bg={statusStyle.background} color={statusStyle.color} borderColor="#d1d5db">
                  {row.status}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const ComparisonChart = ({ title, rows, actualLabel = 'Actual' }) => {
  const maximum = Math.max(...rows.flatMap((row) => [row.target, row.actual]));
  const upperBound = Math.max(4, Math.ceil((maximum + 1) / 5) * 5);

  return (
    <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
      <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>{title}</Heading>
      <Box h={{ base: '390px', md: '440px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 28, right: 20, left: 10, bottom: 115 }}>
            <CartesianGrid stroke="#9ca3af" vertical={false} />
            <XAxis dataKey="kpi" interval={0} angle={-42} textAnchor="end" height={115} tick={{ fill: '#111827', fontSize: 12 }} />
            <YAxis domain={[0, upperBound]} allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
            <ChartTooltip />
            <Legend verticalAlign="bottom" />
            <Bar dataKey="target" name="Target" fill="#5285bf" maxBarSize={38}>
              <LabelList dataKey="target" content={<CountLabel />} />
            </Bar>
            <Bar dataKey="actual" name={actualLabel} fill="#c65353" maxBarSize={38}>
              <LabelList dataKey="actual" content={<CountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

const CustomerSuccessTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>Customer Success KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Target', 'Actual', 'Note'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {CUSTOMER_SUCCESS_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.actual)}</Td>
              <Td textAlign="center" fontSize="14px" minW="300px" borderColor="#d1d5db">{row.note}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const CustomerSuccessChart = () => (
  <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
    <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>Customer Success Raw Scores</Heading>
    <Box h={{ base: '350px', md: '420px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CUSTOMER_SUCCESS_KPI_DETAILS} margin={{ top: 28, right: 20, left: 10, bottom: 45 }}>
          <CartesianGrid stroke="#9ca3af" vertical={false} />
          <XAxis dataKey="kpi" interval={0} tick={{ fill: '#111827', fontSize: 12 }} />
          <YAxis domain={[0, 80]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80]} label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
          <ChartTooltip />
          <Bar dataKey="actual" name="Score" fill="#5285bf" maxBarSize={120}>
            <LabelList dataKey="actual" content={<CountLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const FinanceTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>Weekly Financials (ETB)</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['Item', 'Amount'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {FINANCE_KPI_DETAILS.map((row, index) => (
            <Tr key={row.item} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.item}</Td>
              <Td textAlign="center" fontSize="14px" fontWeight={row.item === 'Net Position' ? '700' : '400'} borderColor="#d1d5db">
                {typeof row.amount === 'number' ? formatNumber(row.amount) : row.amount ?? '—'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const FinanceChart = () => {
  const chartRows = FINANCE_KPI_DETAILS.filter((row) => typeof row.amount === 'number').slice(0, 3);
  return (
    <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
      <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>
        Revenue vs Expenses vs Net Position (ETB)
      </Heading>
      <Box h={{ base: '350px', md: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 28, right: 20, left: 35, bottom: 35 }}>
            <CartesianGrid stroke="#9ca3af" vertical={false} />
            <XAxis dataKey="item" interval={0} tick={{ fill: '#111827', fontSize: 12 }} />
            <YAxis domain={[0, 600000]} tickFormatter={(value) => formatNumber(value)} label={{ value: 'ETB', angle: -90, position: 'insideLeft', offset: -20, style: { fontWeight: 700 } }} />
            <ChartTooltip formatter={(value) => [formatNumber(value), 'ETB']} />
            <Bar dataKey="amount" fill="#5285bf" maxBarSize={150}>
              <LabelList dataKey="amount" content={<AmountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

const TradexTvTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>Tradex TV KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Value'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {TRADEX_TV_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.value)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const TradexTvChart = () => (
  <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
    <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>
      Tradex TV — All Metrics at Zero
    </Heading>
    <Box h={{ base: '360px', md: '430px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={TRADEX_TV_KPI_DETAILS} margin={{ top: 28, right: 20, left: 10, bottom: 105 }}>
          <CartesianGrid stroke="#9ca3af" vertical={false} />
          <XAxis dataKey="kpi" interval={0} angle={-42} textAnchor="end" height={105} tick={{ fill: '#111827', fontSize: 12 }} />
          <YAxis domain={[0, 1]} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
          <ChartTooltip />
          <Bar dataKey="value" name="Count" fill="#5285bf" minPointSize={1} maxBarSize={110}>
            <LabelList dataKey="value" content={<CountLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const HrTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>HR KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Value'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {HR_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                {typeof row.value === 'number' ? formatNumber(row.value) : row.value}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const HrChart = () => {
  const chartRows = HR_KPI_DETAILS.slice(0, 3);
  return (
    <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
      <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>HR Headcount Movement</Heading>
      <Box h={{ base: '340px', md: '410px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 28, right: 20, left: 10, bottom: 35 }}>
            <CartesianGrid stroke="#9ca3af" vertical={false} />
            <XAxis dataKey="kpi" interval={0} tick={{ fill: '#111827', fontSize: 12 }} />
            <YAxis domain={[0, 35]} ticks={[0, 5, 10, 15, 20, 25, 30, 35]} allowDecimals={false} label={{ value: 'People', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
            <ChartTooltip />
            <Bar dataKey="value" name="People" fill="#5285bf" maxBarSize={120}>
              <LabelList dataKey="value" content={<CountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

const getCurrentHrPeriod = (dateRange) => {
  const now = new Date();
  const year = now.getFullYear();
  const periodType = String(dateRange || 'Monthly').toLowerCase();

  if (periodType === 'weekly') {
    const startOfYear = new Date(year, 0, 1);
    const elapsedDays = (now - startOfYear) / 86400000;
    const week = Math.ceil((elapsedDays + startOfYear.getDay() + 1) / 7);
    return { periodType, periodKey: `${year}-W${String(week).padStart(2, '0')}` };
  }

  if (periodType === 'quarterly') {
    return { periodType, periodKey: `${year}-Q${Math.floor(now.getMonth() / 3) + 1}` };
  }

  return {
    periodType: 'monthly',
    periodKey: `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
};

const HrDashboardKpiTable = ({ rows, periodKey }) => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2} display="flex" alignItems="center" justifyContent="space-between" gap={4}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>HR Dashboard KPIs</Heading>
      <Text fontSize="sm" fontWeight="700" whiteSpace="nowrap">Period: {periodKey}</Text>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Target', 'Actual', 'Achievement %', 'Status', 'Notes'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => {
            const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.Pending;
            const achievement = row.target > 0 ? Math.round((row.actual / row.target) * 100) : null;
            return (
              <Tr key={row.key} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db" minW="250px">{row.label}</Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                  {formatNumber(row.actual)} {row.unit === '%' ? '%' : ''}
                </Td>
                <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                  {achievement === null ? 'N/A' : `${achievement}%`}
                </Td>
                <Td textAlign="center" fontSize="14px" fontWeight="600" bg={statusStyle.background} color={statusStyle.color} borderColor="#d1d5db" whiteSpace="nowrap">
                  {row.status}
                </Td>
                <Td fontSize="14px" borderColor="#d1d5db" minW="220px">{row.notes || '—'}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const HrDepartmentView = ({ dateRange }) => {
  const [kpiRecord, setKpiRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const period = useMemo(() => getCurrentHrPeriod(dateRange), [dateRange]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    getHrKpis(period.periodType, period.periodKey)
      .then((response) => {
        if (active) setKpiRecord(response?.data || null);
      })
      .catch((error) => {
        if (active) setLoadError(error?.response?.data?.message || 'Unable to load the live HR KPI dashboard.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  const liveRows = useMemo(() => HR_DASHBOARD_KPIS.map((item) => {
    const metric = kpiRecord?.[item.key] || {};
    return {
      ...item,
      target: Number(metric.target) || 0,
      actual: Number(metric.actual) || 0,
      status: metric.status || 'Pending',
      notes: metric.notes || '',
      kpi: item.label,
    };
  }), [kpiRecord]);

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">HR &amp; Development</Heading>
        <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
          Workforce headcount and development KPIs
        </Text>
      </Box>

      <Box display="grid" gap={7}>
        <HrTable />
        <HrChart />

        {isLoading && (
          <Box bg="white" border="1px solid #d1d5db" p={8} textAlign="center">
            <Text color="#475569" fontWeight="600">Loading HR dashboard KPIs…</Text>
          </Box>
        )}

        {!isLoading && loadError && (
          <Box bg="#fff7ed" border="1px solid #fdba74" color="#9a3412" p={4} fontWeight="600">
            {loadError}
          </Box>
        )}

        {!isLoading && !loadError && (
          <>
            <HrDashboardKpiTable rows={liveRows} periodKey={period.periodKey} />
            <ComparisonChart title="HR KPI Target vs Actual" rows={liveRows} />
          </>
        )}
      </Box>
    </Box>
  );
};

const OverviewView = ({ departmentId = 'all', dateRange = 'Weekly' }) => {
  const reportPeriod = dateRange || 'Weekly';

  if (departmentId === 'it') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">IT &amp; Technology</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Internal platforms, external collateral, and operations
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <DetailTable title="Internal Deliverables" rows={IT_KPI_DETAILS.internal} />
          <DetailTable title="External Collateral" rows={IT_KPI_DETAILS.external} />
          <ComparisonChart title="Internal Platforms: Target vs Actual" rows={IT_KPI_DETAILS.internal} />
          <ComparisonChart title="External Collateral: Target vs Actual" rows={IT_KPI_DETAILS.external} />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'social_media') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Social Media &amp; Marketing</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Platform performance and content KPIs
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <DetailTable title="Overall Marketing KPIs" rows={SOCIAL_MEDIA_KPI_DETAILS.overall} />
          <DetailTable
            title="Platform Performance"
            rows={SOCIAL_MEDIA_KPI_DETAILS.platforms}
            firstColumnLabel="Platform"
            actualLabel="Achieved"
            statusLabel="Gap/Status"
          />
          <ComparisonChart
            title="Platform Performance: Target vs Achieved"
            rows={SOCIAL_MEDIA_KPI_DETAILS.platforms}
            actualLabel="Achieved"
          />
          <ComparisonChart
            title="Leads & Content: Target vs Actual"
            rows={SOCIAL_MEDIA_KPI_DETAILS.overall.filter((row) => row.target !== null)}
          />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'sales') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Sales &amp; Services</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Service-line conversion performance
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <DetailTable title="Sales Measurements (Not Reported)" rows={SALES_KPI_DETAILS.measurements} />
          <DetailTable
            title="Service Lines"
            rows={SALES_KPI_DETAILS.services}
            firstColumnLabel="Service"
            actualLabel="Achieved"
          />
          <DetailTable
            title="Product KPIs"
            rows={SALES_KPI_DETAILS.products}
            firstColumnLabel="Product"
            actualLabel="Achieved"
          />
          <ComparisonChart
            title="Service Lines: Target vs Achieved"
            rows={SALES_KPI_DETAILS.services}
            actualLabel="Achieved"
          />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'tradex') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Tradex TV — Business</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Content production and audience metrics
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <TradexTvTable />
          <TradexTvChart />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'customer_services') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Customer Success</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            No targets currently set — raw scores only
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <CustomerSuccessTable />
          <CustomerSuccessChart />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'finance') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Finance</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Weekly revenue, expenses, and net position
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <FinanceTable />
          <FinanceChart />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'hr') {
    return <HrDepartmentView dateRange={dateRange} />;
  }

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Heading as="h1" fontSize={{ base: '24px', md: '34px' }} lineHeight="1.2">
          Tradethiopia Group — Department KPI Summary
        </Heading>
        <Text mt={2} fontSize={{ base: '16px', md: '21px' }} fontStyle="italic">
          Operations Division | {reportPeriod} Report
        </Text>
      </Box>

      <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
        <Box bg="#137b7e" color="white" px={7} py={2}>
          <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>
            Department Snapshot
          </Heading>
        </Box>

        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead bg="#213f70">
              <Tr>
                {['Department', 'Key Metric', 'Target', 'Actual', 'Achievement %', 'Status'].map((heading) => (
                  <Th
                    key={heading}
                    color="white"
                    textAlign="center"
                    fontSize={{ base: '12px', md: '15px' }}
                    textTransform="none"
                    letterSpacing="normal"
                    py={3}
                    borderColor="#cbd5e1"
                  >
                    {heading}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {DEPARTMENT_KPI_SUMMARY.map((row, index) => {
                const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.Behind;
                return (
                  <Tr key={row.department} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                    <Td fontWeight="700" fontSize="14px" whiteSpace="nowrap" borderColor="#d1d5db">
                      {row.department}
                    </Td>
                    <Td textAlign="center" fontSize="14px" minW="260px" borderColor="#d1d5db">
                      {row.keyMetric}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {formatNumber(row.target)}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {formatNumber(row.actual)}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {row.achievement}%
                    </Td>
                    <Td
                      textAlign="center"
                      fontSize="14px"
                      fontWeight="600"
                      bg={statusStyle.background}
                      color={statusStyle.color}
                      borderColor="#d1d5db"
                      whiteSpace="nowrap"
                    >
                      {row.status}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box mt={7} bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
        <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '29px' }} mb={3}>
          Department Achievement % (where target is set)
        </Heading>
        <Box h={{ base: '390px', md: '460px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEPARTMENT_KPI_SUMMARY} margin={{ top: 28, right: 20, left: 12, bottom: 125 }}>
              <CartesianGrid stroke="#9ca3af" vertical={false} />
              <XAxis
                dataKey="department"
                interval={0}
                angle={-42}
                textAnchor="end"
                height={125}
                tick={{ fill: '#111827', fontSize: 12 }}
                axisLine={{ stroke: '#6b7280' }}
              />
              <YAxis
                domain={[0, 250]}
                ticks={[0, 50, 100, 150, 200, 250]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#111827', fontSize: 12 }}
                label={{ value: 'Achievement %', angle: -90, position: 'insideLeft', offset: -2, style: { fontWeight: 700 } }}
              />
              <ChartTooltip formatter={(value) => [`${value}%`, 'Achievement']} />
              <Bar dataKey="achievement" fill="#5285bf" maxBarSize={62}>
                <LabelList dataKey="achievement" content={<AchievementLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default OverviewView;
