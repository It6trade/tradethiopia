import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Skeleton,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaDownload,
  FaExclamationTriangle,
  FaFileInvoice,
  FaMoneyBillWave,
  FaPrint,
  FaReceipt,
  FaRedo
} from 'react-icons/fa';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getExpenseReport, getFinanceSummary, getRevenueReport } from '../../services/financeService';

const chartColors = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#7c3aed', '#0891b2'];

const normalizeAmount = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatEtb = (value) => {
  const amount = normalizeAmount(value);
  return `ETB ${amount.toLocaleString()}`;
};

const titleCase = (value) => String(value || 'Uncategorized')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const mergePeriodData = (revenue = [], expenses = []) => {
  const buckets = new Map();

  revenue.forEach((item) => {
    const label = item.label || 'Unknown';
    buckets.set(label, {
      label,
      revenue: normalizeAmount(item.total),
      expenses: buckets.get(label)?.expenses || 0
    });
  });

  expenses.forEach((item) => {
    const label = item.label || 'Unknown';
    buckets.set(label, {
      label,
      revenue: buckets.get(label)?.revenue || 0,
      expenses: normalizeAmount(item.total)
    });
  });

  return Array.from(buckets.values()).reverse();
};

const exportCsv = (filename, rows) => {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
};

const FinanceReportsPage = () => {
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const softBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.300');
  const strongColor = useColorModeValue('gray.900', 'gray.50');

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const [revenueData, expenseData, summaryData] = await Promise.all([
        getRevenueReport(),
        getExpenseReport(),
        getFinanceSummary().catch(() => null)
      ]);

      setRevenueSummary(revenueData);
      setExpenseSummary(expenseData);
      setFinanceSummary(summaryData);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to load finance reports.';
      setError(message);
      toast({ title: 'Finance reports unavailable', description: message, status: 'error', duration: 3500 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expenseBreakdown = expenseSummary?.expenseBreakdown || expenseSummary?.breakdown || financeSummary?.expenseBreakdown || {};
  const expenseBreakdownEntries = Object.entries(expenseBreakdown)
    .map(([name, value]) => ({ name: titleCase(name), value: normalizeAmount(value) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalRevenue = normalizeAmount(financeSummary?.revenue ?? revenueSummary?.totalRevenue);
  const totalExpenses = normalizeAmount(financeSummary?.expenses ?? expenseSummary?.totalExpenses);
  const totalCostsRecorded = normalizeAmount(financeSummary?.totalCostsRecorded ?? expenseSummary?.totalCostsRecorded ?? totalExpenses);
  const payrollCost = normalizeAmount(financeSummary?.payrollCost ?? expenseSummary?.payrollCost);
  const profitValue = normalizeAmount(financeSummary?.profit ?? (totalRevenue - totalExpenses));
  const profitMargin = totalRevenue > 0 ? Number(((profitValue / totalRevenue) * 100).toFixed(1)) : 0;

  const weeklyRevenue = useMemo(() => {
    const data = financeSummary?.weeklyRevenue || revenueSummary?.weeklyRevenue;
    return Array.isArray(data) ? data : [];
  }, [financeSummary?.weeklyRevenue, revenueSummary?.weeklyRevenue]);

  const monthlyRevenue = useMemo(() => {
    const data = financeSummary?.monthlyRevenue || revenueSummary?.monthlyRevenue;
    return Array.isArray(data) ? data : [];
  }, [financeSummary?.monthlyRevenue, revenueSummary?.monthlyRevenue]);

  const weeklyExpenses = useMemo(() => {
    const data = financeSummary?.weeklyExpenses || expenseSummary?.weeklyExpenses || expenseSummary?.weeklyTrend;
    return Array.isArray(data) ? data : [];
  }, [expenseSummary?.weeklyExpenses, expenseSummary?.weeklyTrend, financeSummary?.weeklyExpenses]);

  const monthlyExpenses = useMemo(() => {
    const data = financeSummary?.monthlyExpenses || expenseSummary?.monthlyExpenses || expenseSummary?.monthlyTrend;
    return Array.isArray(data) ? data : [];
  }, [expenseSummary?.monthlyExpenses, expenseSummary?.monthlyTrend, financeSummary?.monthlyExpenses]);
  const recentExpenses = Array.isArray(financeSummary?.recentExpenses || expenseSummary?.recentExpenses || expenseSummary?.recent)
    ? (financeSummary?.recentExpenses || expenseSummary?.recentExpenses || expenseSummary?.recent)
    : [];

  const weeklyTrend = useMemo(() => mergePeriodData(weeklyRevenue, weeklyExpenses), [weeklyRevenue, weeklyExpenses]);
  const monthlyTrend = useMemo(() => mergePeriodData(monthlyRevenue, monthlyExpenses), [monthlyRevenue, monthlyExpenses]);

  const revenueSourceData = [
    { name: 'Follow-ups', value: normalizeAmount(financeSummary?.followupRevenue ?? revenueSummary?.followupRevenue) },
    { name: 'Orders', value: normalizeAmount(financeSummary?.orderRevenue ?? revenueSummary?.orderRevenue) },
    { name: 'Packages', value: normalizeAmount(financeSummary?.packageRevenue ?? revenueSummary?.packageRevenue) }
  ].filter((item) => item.value > 0);

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: formatEtb(totalRevenue),
      help: 'Confirmed income streams',
      icon: FaMoneyBillWave,
      color: 'green'
    },
    {
      label: 'Total Expenses',
      value: formatEtb(totalExpenses),
      help: `${formatEtb(totalCostsRecorded)} costs recorded`,
      icon: FaReceipt,
      color: 'red'
    },
    {
      label: 'Net Profit',
      value: formatEtb(profitValue),
      help: `${profitMargin}% margin`,
      icon: FaChartLine,
      color: profitValue >= 0 ? 'green' : 'red'
    },
    {
      label: 'Payroll Cost',
      value: formatEtb(payrollCost),
      help: 'Included in expense totals',
      icon: FaFileInvoice,
      color: 'blue'
    }
  ];

  const exportRows = [
    { metric: 'Total Revenue', value: totalRevenue },
    { metric: 'Total Expenses', value: totalExpenses },
    { metric: 'Net Profit', value: profitValue },
    { metric: 'Profit Margin', value: `${profitMargin}%` },
    { metric: 'Payroll Cost', value: payrollCost },
    ...expenseBreakdownEntries.map((item) => ({ metric: `${item.name} Expense`, value: item.value }))
  ];

  const handleExport = () => {
    const exported = exportCsv('finance-reports', exportRows);
    toast({
      title: exported ? 'Report exported' : 'Nothing to export',
      status: exported ? 'success' : 'info',
      duration: 2500
    });
  };

  return (
    <Box bg={pageBg} minH="100%" px={{ base: 2, md: 4 }} py={{ base: 2, md: 4 }}>
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        mb={4}
      >
        <Box>
          <HStack spacing={2} mb={1}>
            <Heading as="h1" size="md" color={strongColor}>Financial Reports</Heading>
            <Badge colorScheme={error ? 'red' : 'green'}>{error ? 'Issue' : 'Live'}</Badge>
          </HStack>
          <Text color={mutedColor} fontSize="sm">
            Revenue, expenses, profit, category spend, and recent finance activity.
          </Text>
        </Box>
        <HStack spacing={2} flexWrap="wrap">
          <Button size="sm" leftIcon={<FaRedo />} variant="outline" onClick={loadReports} isLoading={loading}>
            Refresh
          </Button>
          <Button size="sm" leftIcon={<FaPrint />} variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <Button size="sm" leftIcon={<FaDownload />} colorScheme="teal" onClick={handleExport}>
            Export
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Card bg={cardBg} border="1px solid" borderColor="red.200" mb={4} boxShadow="sm">
          <CardBody py={3}>
            <HStack color="red.600" align="start">
              <Icon as={FaExclamationTriangle} mt={1} />
              <Box>
                <Text fontWeight="semibold">Unable to load the latest report data</Text>
                <Text fontSize="sm">{error}</Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      )}

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3} mb={4}>
        {summaryCards.map((item) => (
          <ReportMetricCard key={item.label} item={item} loading={loading} cardBg={cardBg} borderColor={borderColor} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4} mb={4}>
        <SectionCard title="Monthly Revenue And Expenses" cardBg={cardBg} borderColor={borderColor} span={2}>
          {loading ? (
            <Skeleton h="260px" borderRadius="md" />
          ) : monthlyTrend.length ? (
            <Box h={{ base: '260px', md: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatEtb(value)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyState text="No monthly trend data available yet." />
          )}
        </SectionCard>

        <SectionCard title="Revenue Mix" cardBg={cardBg} borderColor={borderColor}>
          {loading ? (
            <Skeleton h="260px" borderRadius="md" />
          ) : revenueSourceData.length ? (
            <VStack align="stretch" spacing={3}>
              <Box h="220px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenueSourceData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={80} paddingAngle={3}>
                      {revenueSourceData.map((item, index) => (
                        <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatEtb(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <VStack align="stretch" spacing={2}>
                {revenueSourceData.map((item, index) => (
                  <ReportLine key={item.name} label={item.name} value={formatEtb(item.value)} color={chartColors[index % chartColors.length]} />
                ))}
              </VStack>
            </VStack>
          ) : (
            <EmptyState text="No revenue source data available yet." />
          )}
        </SectionCard>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={4}>
        <SectionCard title="Expense Breakdown" cardBg={cardBg} borderColor={borderColor}>
          {loading ? (
            <VStack align="stretch" spacing={3}>
              <Skeleton h="48px" />
              <Skeleton h="48px" />
              <Skeleton h="48px" />
            </VStack>
          ) : expenseBreakdownEntries.length ? (
            <VStack align="stretch" spacing={3}>
              {expenseBreakdownEntries.slice(0, 6).map((item, index) => {
                const percent = totalExpenses > 0 ? Math.min((item.value / totalExpenses) * 100, 100) : 0;
                return (
                  <Box key={item.name}>
                    <Flex justify="space-between" gap={3} mb={1}>
                      <HStack minW={0}>
                        <Box boxSize="9px" borderRadius="full" bg={chartColors[index % chartColors.length]} />
                        <Text fontSize="sm" fontWeight="semibold" isTruncated>{item.name}</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="semibold">{formatEtb(item.value)}</Text>
                    </Flex>
                    <Box bg={softBg} h="8px" borderRadius="full" overflow="hidden">
                      <Box h="100%" w={`${percent}%`} bg={chartColors[index % chartColors.length]} borderRadius="full" />
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <EmptyState text="No expense categories available yet." />
          )}
        </SectionCard>

        <SectionCard title="Weekly Snapshot" cardBg={cardBg} borderColor={borderColor}>
          {loading ? (
            <Skeleton h="240px" borderRadius="md" />
          ) : weeklyTrend.length ? (
            <Box h="260px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatEtb(value)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ca8a04" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <EmptyState text="No weekly trend data available yet." />
          )}
        </SectionCard>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4}>
        <SectionCard title="Profit And Cost Detail" cardBg={cardBg} borderColor={borderColor}>
          <VStack align="stretch" spacing={3}>
            <ReportLine label="Revenue" value={formatEtb(totalRevenue)} color="#16a34a" />
            <ReportLine label="Expenses" value={formatEtb(totalExpenses)} color="#dc2626" />
            <ReportLine label="Net Profit" value={formatEtb(profitValue)} color={profitValue >= 0 ? '#16a34a' : '#dc2626'} />
            <ReportLine label="Payroll" value={formatEtb(payrollCost)} color="#2563eb" />
          </VStack>
        </SectionCard>

        <SectionCard title="Recent Expenses" cardBg={cardBg} borderColor={borderColor} span={2}>
          {loading ? (
            <VStack align="stretch" spacing={2}>
              <Skeleton h="54px" />
              <Skeleton h="54px" />
              <Skeleton h="54px" />
            </VStack>
          ) : recentExpenses.length ? (
            <VStack align="stretch" spacing={2}>
              {recentExpenses.slice(0, 5).map((expense) => (
                <Flex
                  key={expense._id || expense.createdAt || expense.title}
                  align={{ base: 'stretch', md: 'center' }}
                  justify="space-between"
                  direction={{ base: 'column', md: 'row' }}
                  gap={2}
                  p={3}
                  bg={softBg}
                  borderRadius="md"
                >
                  <Box minW={0}>
                    <Text fontWeight="semibold" color={strongColor} isTruncated>
                      {expense.title || expense.category || 'Expense'}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {expense.incurredOn ? new Date(expense.incurredOn).toLocaleDateString() : 'Date unknown'}
                    </Text>
                  </Box>
                  <HStack justify={{ base: 'space-between', md: 'flex-end' }}>
                    <Text fontWeight="bold">{formatEtb(expense.amount)}</Text>
                    <Badge colorScheme="orange">{expense.status || 'Recorded'}</Badge>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          ) : (
            <EmptyState text="No recent expenses recorded." />
          )}
        </SectionCard>
      </SimpleGrid>
    </Box>
  );
};

const ReportMetricCard = ({ item, loading, cardBg, borderColor }) => (
  <Card bg={cardBg} border="1px solid" borderColor={borderColor} boxShadow="sm" borderRadius="lg">
    <CardBody p={4}>
      <Flex justify="space-between" align="start" gap={3}>
        <Box minW={0}>
          <Stat>
            <StatLabel fontSize="xs" color="gray.500">{item.label}</StatLabel>
            <Skeleton isLoaded={!loading} borderRadius="md">
              <StatNumber fontSize={{ base: 'lg', md: 'xl' }} noOfLines={1}>{item.value}</StatNumber>
            </Skeleton>
            <StatHelpText mb={0} fontSize="xs">{item.help}</StatHelpText>
          </Stat>
        </Box>
        <Flex boxSize="36px" align="center" justify="center" borderRadius="md" bg={`${item.color}.50`} color={`${item.color}.600`}>
          <Icon as={item.icon} />
        </Flex>
      </Flex>
    </CardBody>
  </Card>
);

const SectionCard = ({ title, children, cardBg, borderColor, span }) => (
  <Card
    bg={cardBg}
    border="1px solid"
    borderColor={borderColor}
    boxShadow="sm"
    borderRadius="lg"
    gridColumn={{ base: 'auto', xl: span ? `span ${span}` : 'auto' }}
  >
    <CardHeader px={4} py={3}>
      <Heading as="h2" size="sm">{title}</Heading>
    </CardHeader>
    <CardBody px={4} pt={0} pb={4}>
      {children}
    </CardBody>
  </Card>
);

const ReportLine = ({ label, value, color }) => (
  <Flex align="center" justify="space-between" gap={3}>
    <HStack minW={0}>
      <Box boxSize="9px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="sm" color="gray.600" isTruncated>{label}</Text>
    </HStack>
    <Text fontSize="sm" fontWeight="semibold">{value}</Text>
  </Flex>
);

const EmptyState = ({ text }) => (
  <Flex minH="180px" align="center" justify="center" textAlign="center" px={4}>
    <Text fontSize="sm" color="gray.500">{text}</Text>
  </Flex>
);

export default FinanceReportsPage;
