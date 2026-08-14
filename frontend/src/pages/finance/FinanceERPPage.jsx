import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaDownload,
  FaFilter,
  FaMoneyBillWave,
  FaPlus,
  FaSearch,
  FaSyncAlt
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
import {
  createFinanceErpResource,
  getFinanceErpDashboard,
  getFinanceErpReports,
  getFinanceErpResource,
  runFinanceCommand,
  runFinanceWorkflow
} from '../../services/financeService';
import { useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const purple = '#6f42c1';
const border = '#d8dde6';
const pageBg = '#f4f5f7';

const moduleGroups = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    items: [
      { key: 'dashboard', label: 'Overview', resource: null }
    ]
  },
  {
    key: 'accounting',
    title: 'Accounting',
    items: [
      { key: 'accounting', label: 'Chart of Accounts', resource: 'accounts' },
      { key: 'journalEntries', label: 'Journal Entries', resource: 'journalEntries' },
      { key: 'ledger', label: 'General Ledger', resource: null },
      { key: 'trialBalance', label: 'Trial Balance', resource: null },
      { key: 'profitLoss', label: 'Profit & Loss', resource: null },
      { key: 'balanceSheet', label: 'Balance Sheet', resource: null }
    ]
  },
  {
    key: 'sales',
    title: 'Sales Finance',
    items: [
      { key: 'customers', label: 'Customers', resource: 'customers' },
      { key: 'invoices', label: 'Invoices', resource: 'invoices' },
      { key: 'salesPayments', label: 'Payments', resource: 'payments' },
      { key: 'receivables', label: 'Receivables', resource: 'invoices' }
    ]
  },
  {
    key: 'purchase',
    title: 'Purchase Finance',
    items: [
      { key: 'vendors', label: 'Vendors', resource: 'vendors' },
      { key: 'bills', label: 'Bills', resource: 'bills' },
      { key: 'supplierPayments', label: 'Supplier Payments', resource: 'payments' },
      { key: 'payables', label: 'Payables', resource: 'bills' }
    ]
  },
  {
    key: 'tax',
    title: 'Tax Management',
    items: [
      { key: 'taxes', label: 'Sales Taxes', resource: 'taxes' },
      { key: 'purchaseTaxes', label: 'Purchase Taxes', resource: 'taxes' },
      { key: 'vatGroups', label: 'VAT Groups', resource: 'taxes' },
      { key: 'taxAccounts', label: 'Tax Accounts', resource: 'accounts' },
      { key: 'taxMapping', label: 'Tax Mapping', resource: 'taxes' },
      { key: 'taxReports', label: 'Tax Reports', resource: null }
    ]
  },
  {
    key: 'operations',
    title: 'Operations',
    items: [
      { key: 'bankAccounts', label: 'Banking', resource: 'bankAccounts' },
      { key: 'expenses', label: 'Expenses', resource: 'expenses' },
      { key: 'payroll', label: 'Payroll', resource: 'payroll', permission: 'can_view_payroll' },
      { key: 'commissions', label: 'Commission Approval', resource: 'commissions' }
    ]
  },
  {
    key: 'reports',
    title: 'Reports',
    items: [{ key: 'reports', label: 'Financial Reports', resource: null }]
  },
  {
    key: 'settings',
    title: 'Settings',
    items: [{ key: 'settings', label: 'Finance Settings', resource: null }]
  }
];

const sampleRows = {
  accounts: [
    { code: '1000', name: 'Cash and Bank', type: 'asset', currentBalance: 185000, status: 'active' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', currentBalance: 73000, status: 'active' },
    { code: '4000', name: 'Sales Revenue', type: 'income', currentBalance: -258000, status: 'active' }
  ],
  customers: [
    { code: 'CUST-001', name: 'Addis Trading PLC', email: 'finance@addistrading.et', balance: 42000, status: 'active' }
  ],
  vendors: [
    { code: 'VEN-001', name: 'Ethio Supplies', email: 'accounts@supplies.et', balance: 23000, status: 'active' }
  ],
  invoices: [
    { number: 'INV-202605-001', status: 'submitted', total: 56000, paidAmount: 18000, balance: 38000 },
    { number: 'INV-202605-002', status: 'posted', total: 82000, paidAmount: 82000, balance: 0 }
  ],
  bills: [
    { number: 'BILL-202605-001', status: 'approved', total: 31000, paidAmount: 0, balance: 31000 }
  ],
  payments: [
    { paymentNumber: 'PAY-202605-001', direction: 'inbound', method: 'bank', amount: 18000, status: 'posted' }
  ],
  expenses: [
    { number: 'EXP-202605-001', category: 'Office', amount: 4600, status: 'paid' }
  ],
  payroll: [
    { employeeName: 'Finance Staff', department: 'Finance', month: '2026-05', netSalary: 18000, status: 'approved' }
  ],
  commissions: [
    { employeeName: 'Sales Agent', month: '2026-05', totalCommission: 7200, department: 'Sales' }
  ],
  taxes: [
    { code: 'VAT15', name: 'VAT 15%', type: 'vat', rate: 15, active: true }
  ],
  bankAccounts: [
    { name: 'Main Bank Account', bankName: 'Commercial Bank', type: 'bank', balance: 185000, status: 'active' }
  ],
  journalEntries: [
    { number: 'JE-202605-001', sourceType: 'invoice', memo: 'Invoice posting', totalDebit: 56000, totalCredit: 56000, status: 'posted' },
    { number: 'JE-202605-002', sourceType: 'payment', memo: 'Payment registration', totalDebit: 18000, totalCredit: 18000, status: 'posted' }
  ]
};

const fallbackDashboard = {
  metrics: {
    revenue: 0,
    expenses: 0,
    profit: 0,
    receivables: 0,
    payables: 0,
    cashMovement: 0,
    invoices: 0,
    bills: 0
  },
  charts: [
    { name: 'Revenue', value: 0 },
    { name: 'Expenses', value: 0 },
    { name: 'Profit', value: 0 },
    { name: 'Receivable', value: 0 },
    { name: 'Payable', value: 0 }
  ],
  recentTransactions: []
};

const fallbackReports = {
  trialBalance: { totalDebit: 0, totalCredit: 0 },
  profitAndLoss: { profit: 0 },
  cashFlow: { operating: 0 },
  ledger: []
};

const formFields = {
  accounts: ['code', 'name', 'type', 'currency', 'openingBalance'],
  customers: ['code', 'name', 'email', 'phone', 'taxId', 'paymentTerms'],
  vendors: ['code', 'name', 'email', 'phone', 'taxId', 'paymentTerms'],
  bankAccounts: ['name', 'bankName', 'accountNumber', 'currency', 'type', 'balance'],
  taxes: ['code', 'name', 'type', 'rate'],
  expenses: ['category', 'description', 'amount', 'currency'],
  invoices: ['customer', 'salesOrderNumber', 'currency'],
  bills: ['vendor', 'purchaseOrderNumber', 'currency']
};

const formatMoney = (value) => `ETB ${Number(value || 0).toLocaleString()}`;

const statusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['paid', 'posted', 'approved', 'active', 'reconciled'].includes(normalized)) return 'green';
  if (['draft'].includes(normalized)) return 'gray';
  if (['sent', 'submitted', 'awaiting_approval', 'partially_paid'].includes(normalized)) return 'orange';
  if (['rejected', 'cancelled', 'overdue', 'blocked', 'reversed'].includes(normalized)) return 'red';
  return 'gray';
};

const flattenValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value.name || value.number || value._id || '';
  return value;
};

const hasFinancePermission = (user, permission) => {
  const role = String(user?.role || '').toLowerCase();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return ['admin', 'super-admin', 'super_admin'].includes(role)
    || permissions.includes(permission)
    || permissions.includes('finance:*')
    || permissions.includes('*')
    || (!permission.startsWith('can_') && ['finance', 'coo', 'supervisor'].includes(role));
};

const exportCsv = (filename, rows) => {
  const safeRows = rows || [];
  if (!safeRows.length) return false;
  const headers = Object.keys(safeRows[0]).filter((key) => !key.startsWith('_') && typeof safeRows[0][key] !== 'object');
  const csv = [
    headers.join(','),
    ...safeRows.map((row) => headers.map((key) => `"${String(flattenValue(row[key])).replace(/"/g, '""')}"`).join(','))
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

const getColumns = (rows) => {
  const preferred = ['number', 'paymentNumber', 'code', 'name', 'employeeName', 'category', 'type', 'status', 'total', 'amount', 'balance', 'currentBalance', 'totalDebit', 'totalCredit', 'rate', 'createdAt'];
  const keys = Array.from(new Set((rows || []).flatMap((row) => Object.keys(row || {}))));
  return preferred.filter((key) => keys.includes(key)).concat(keys.filter((key) => !preferred.includes(key) && !key.startsWith('_')).slice(0, 4));
};

const MetricCard = ({ label, value, help }) => (
  <Box bg="white" border="1px solid" borderColor={border} borderRadius="6px" p={3} _hover={{ borderColor: '#b8c0cc' }}>
    <Stat>
      <StatLabel fontSize="xs" color="gray.500">{label}</StatLabel>
      <StatNumber fontSize="lg" color="gray.800">{typeof value === 'number' ? formatMoney(value) : value}</StatNumber>
      <StatHelpText fontSize="xs" mb={0}>{help}</StatHelpText>
    </Stat>
  </Box>
);

const workflowSteps = ['Draft', 'Submitted', 'Approved', 'Posted', 'Paid'];

const sectionByActive = (activeKey) => moduleGroups.find((group) => group.items.some((item) => item.key === activeKey)) || moduleGroups[0];

const FinanceERPPage = () => {
  const location = useLocation();
  const toast = useToast();
  const drawer = useDisclosure();
  const user = useUserStore((state) => state.currentUser);
  const [active, setActive] = useState('dashboard');
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [reports, setReports] = useState(fallbackReports);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({});
  const [workflow, setWorkflow] = useState('sales-order');
  const reportKeys = ['reports', 'ledger', 'trialBalance', 'profitLoss', 'balanceSheet', 'taxReports'];

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && moduleGroups.some((group) => group.items.some((item) => item.key === tab))) {
      setActive(tab);
      return;
    }
    const pathMap = {
      '/finance-dashboard/erp': 'dashboard',
      '/finance-dashboard/accounting': 'accounting',
      '/finance-dashboard/sales-finance': 'invoices',
      '/finance-dashboard/purchase-finance': 'bills',
      '/finance-dashboard/bank-cash': 'bankAccounts',
      '/finance-dashboard/expenses': 'expenses',
      '/finance-dashboard/tax': 'taxes',
      '/finance-dashboard/reports': 'reports',
      '/finance-dashboard/settings': 'settings'
    };
    if (pathMap[location.pathname]) setActive(pathMap[location.pathname]);
  }, [location.pathname, location.search]);

  const activeItem = useMemo(() => moduleGroups.flatMap((group) => group.items).find((item) => item.key === active), [active]);
  const activeSection = useMemo(() => sectionByActive(active), [active]);
  const resource = activeItem?.resource;
  const can = (permission) => hasFinancePermission(user, permission);

  const load = async () => {
    if (activeItem?.permission && !can(activeItem.permission)) {
      setRows([]);
      toast({
        title: 'Finance permission required',
        description: `Missing permission: ${activeItem.permission}`,
        status: 'warning',
        duration: 2500
      });
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      if (active === 'dashboard') {
        const response = await getFinanceErpDashboard();
        setDashboard(response.data || fallbackDashboard);
      } else if (reportKeys.includes(active)) {
        const response = await getFinanceErpReports();
        setReports(response.data || fallbackReports);
      } else if (resource) {
        const response = await getFinanceErpResource(resource, { search, status, limit: 50 });
        const data = response.data || [];
        setRows(data);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Connect with a finance role to load ERP records.';
      setLoadError(message);
      if (active === 'dashboard') setDashboard(fallbackDashboard);
      if (reportKeys.includes(active)) setReports(fallbackReports);
      if (resource) setRows(sampleRows[resource] || []);
      toast({
        title: 'Unable to load live finance data',
        description: message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // load depends on view-local state and intentionally runs when the active module changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const currentRows = resource ? rows : [];
  const columns = getColumns(currentRows);
  const metrics = dashboard?.metrics || fallbackDashboard.metrics;
  const chartData = dashboard?.charts || fallbackDashboard.charts;

  const openCreate = () => {
    setForm({});
    drawer.onOpen();
  };

  const getReportRows = () => {
    const ledger = reports?.ledger || [];
    return ledger.map((row) => ({
      code: row.account?.code,
      name: row.account?.name,
      type: row.account?.type,
      debit: row.debit,
      credit: row.credit,
      balance: row.balance
    }));
  };

  const handleExport = () => {
    let exportRows = currentRows;
    if (active === 'dashboard') {
      exportRows = Object.entries(metrics).map(([name, value]) => ({ name, value }));
    } else if (reportKeys.includes(active)) {
      exportRows = getReportRows();
    }

    const exported = exportCsv(active, exportRows);
    toast({
      title: exported ? 'Export ready' : 'Nothing to export',
      description: exported ? `${activeItem?.label || 'Finance data'} exported as CSV.` : 'Load or create records before exporting this view.',
      status: exported ? 'success' : 'info',
      duration: 2500
    });
  };

  const handleWorkflowAction = (action) => {
    const commandAction = currentRows
      .flatMap((row) => getRowActions(row).map((item) => ({ item, row })))
      .find(({ item }) => item.label === action || (action === 'Reverse Entry' && item.label === 'Reverse'));
    if (commandAction) {
      runRowCommand(commandAction.item, commandAction.row);
      return;
    }

    const actionMap = {
      'Register Payment': () => setActive('salesPayments'),
      Reconcile: () => setActive('bankAccounts'),
      'View Ledger': () => setActive('ledger'),
      Print: () => window.print(),
      'Export PDF': () => window.print(),
      Approve: () => toast({ title: 'No approvable record loaded', status: 'warning', duration: 2500 }),
      Post: () => rows.length ? toast({ title: 'No postable record loaded', status: 'warning', duration: 2500 }) : openCreate(),
      'Reverse Entry': () => toast({ title: 'No reversible record loaded', status: 'warning', duration: 2500 })
    };

    actionMap[action]?.();
  };

  const handleTableAction = (action, row) => {
    if (action === 'Ledger') {
      setActive('ledger');
      return;
    }
    const rowAction = getRowActions(row).find((item) => item.label === action);
    if (rowAction?.path) runRowCommand(rowAction, row);
  };

  const runRowCommand = async (rowAction, row) => {
    try {
      const payload = rowAction.payload ? rowAction.payload(row) : {};
      await runFinanceCommand(rowAction.path, payload);
      toast({ title: `${rowAction.label} completed`, status: 'success', duration: 2500 });
      load();
    } catch (error) {
      toast({
        title: `${rowAction.label} failed`,
        description: error.response?.data?.message || 'The finance workflow rejected this action.',
        status: 'error',
        duration: 3500
      });
    }
  };

  const getRowActions = (row) => {
    if (!row?._id) return [];
    const statusValue = String(row.status || '').toLowerCase();
    const actions = [];
    const add = (label, permission, path, enabledStatuses) => {
      if (can(permission) && (!enabledStatuses || enabledStatuses.includes(statusValue))) {
        actions.push({ label, path });
      }
    };

    if (resource === 'invoices') {
      add('Submit', 'can_create_invoice', `/invoices/${row._id}/submit`, ['draft', 'sent']);
      add('Approve', 'can_approve_invoice', `/invoices/${row._id}/approve`, ['pending_approval']);
      add('Post', 'can_post_invoice', `/invoices/${row._id}/post`, ['approved']);
      add('Mark Overdue', 'can_post_invoice', `/invoices/${row._id}/overdue`, ['posted', 'partially_paid']);
      add('Cancel', 'can_reverse_invoice', `/invoices/${row._id}/cancel`, ['draft', 'sent', 'pending_approval', 'approved', 'overdue']);
      add('Reverse', 'can_reverse_invoice', `/invoices/${row._id}/reverse`, ['posted', 'partially_paid', 'paid', 'overdue', 'cancelled']);
    }
    if (resource === 'bills') {
      add('Submit', 'can_create_bill', `/bills/${row._id}/submit`, ['draft']);
      add('Approve', 'can_approve_bill', `/bills/${row._id}/approve`, ['submitted', 'awaiting_approval']);
      add('Post', 'can_post_bill', `/bills/${row._id}/post`, ['approved']);
      add('Pay', 'finance:write', `/bills/${row._id}/pay`, ['posted', 'partially_paid']);
      add('Close', 'can_post_bill', `/bills/${row._id}/close`, ['paid']);
      add('Reverse', 'can_reverse_bill', `/bills/${row._id}/reverse`, ['posted', 'partially_paid', 'paid', 'closed']);
    }
    if (resource === 'journalEntries') {
      add('Post', 'can_post_journal', `/journals/${row._id}/post`, ['draft']);
      add('Reverse', 'can_reverse_journal', `/journals/${row._id}/reverse`, ['posted', 'locked']);
    }
    if (resource === 'payments') {
      add('Post', 'can_post_journal', `/payments/${row._id}/post`, ['draft']);
      add('Reverse', 'can_reverse_journal', `/payments/${row._id}/reverse`, ['posted', 'reconciled']);
    }
    if (resource === 'payroll') {
      add('Post', 'can_edit_payroll', `/payroll/${row._id}/post`, ['approved', 'locked']);
    }
    if (resource === 'commissions') {
      add('Post', 'can_post_journal', `/commissions/${row._id}/post`, ['submitted', 'draft']);
    }
    if (resource === 'expenses') {
      add('Approve', 'can_approve_bill', `/expenses/${row._id}/approve`, ['submitted']);
      add('Post', 'can_post_journal', `/expenses/${row._id}/post`, ['approved']);
      add('Pay', 'finance:write', `/expenses/${row._id}/pay`, ['posted']);
      add('Reverse', 'can_reverse_journal', `/expenses/${row._id}/reverse`, ['approved', 'paid', 'posted', 'reconciled']);
    }
    actions.forEach((action) => {
      if (resource === 'bills' && action.label === 'Pay') {
        action.payload = (item) => ({ amount: Number(item.balance || item.total || 0), method: 'bank' });
      }
    });
    return actions;
  };

  const sortRowsByFirstColumn = () => {
    if (!currentRows.length) {
      toast({ title: 'Nothing to sort', status: 'info', duration: 2000 });
      return;
    }
    const firstColumn = getColumns(currentRows)[0];
    setRows((items) => [...items].sort((a, b) => String(flattenValue(a[firstColumn])).localeCompare(String(flattenValue(b[firstColumn])))));
    toast({ title: 'Rows sorted', description: `Sorted by ${firstColumn}.`, status: 'success', duration: 2000 });
  };

  const handleCreate = async () => {
    try {
      if (workflow) {
        const workflowPayloads = {
          'sales-order': {
            customer: { name: form.customerName || 'New Customer', email: form.email },
            salesOrderNumber: form.reference,
            items: [{ description: form.description || 'Sales order item', quantity: 1, unitPrice: Number(form.amount || 0), taxRate: Number(form.taxRate || 0) }],
            payment: { amount: Number(form.paymentAmount || 0), method: form.method || 'bank' }
          },
          'purchase-order': {
            vendor: { name: form.vendorName || 'New Vendor', email: form.email },
            purchaseOrderNumber: form.reference,
            items: [{ description: form.description || 'Purchase order item', quantity: 1, unitPrice: Number(form.amount || 0), taxRate: Number(form.taxRate || 0) }],
            payment: { amount: Number(form.paymentAmount || 0), method: form.method || 'bank' }
          },
          'expense-request': {
            category: form.category || 'General',
            description: form.description,
            amount: Number(form.amount || 0),
            paymentMethod: form.method || 'cash'
          }
        };
        await runFinanceWorkflow(workflow, workflowPayloads[workflow]);
      } else if (resource) {
        await createFinanceErpResource(resource, form);
      }
      drawer.onClose();
      load();
      toast({ title: 'Finance record posted', status: 'success', duration: 2500 });
    } catch (error) {
      toast({ title: 'Unable to save finance record', description: error.response?.data?.message || error.message, status: 'error' });
    }
  };

  const renderDashboard = () => (
    <VStack align="stretch" spacing={2}>
      <SimpleGrid columns={{ base: 1, md: 3, xl: 6 }} spacing={2}>
        <MetricCard label="Revenue" value={metrics.revenue} help="Posted invoices" />
        <MetricCard label="Expenses" value={metrics.expenses} help="Bills and expenses" />
        <MetricCard label="Profit" value={metrics.profit} help="Revenue less cost" />
        <MetricCard label="Cash Flow" value={metrics.cashMovement || 0} help="Bank movement" />
        <MetricCard label="Receivables" value={metrics.receivables} help="Customer balances" />
        <MetricCard label="Payables" value={metrics.payables} help="Vendor balances" />
      </SimpleGrid>
      <Grid templateColumns={{ base: '1fr', xl: '1.5fr 1fr 1fr' }} gap={2}>
        <GridItem bg="white" border="1px solid" borderColor={border} borderRadius="6px" p={3} h="286px">
          <Text fontWeight="semibold" fontSize="sm" mb={2}>Revenue, Expense and Profit Analytics</Text>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
              <Bar dataKey="value" fill={purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GridItem>
        <GridItem bg="white" border="1px solid" borderColor={border} borderRadius="6px" p={3} h="286px">
          <Text fontWeight="semibold" fontSize="sm" mb={2}>Invoice Statistics</Text>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={chartData.slice(0, 4)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88}>
                {chartData.slice(0, 4).map((_, index) => (
                  <Cell key={index} fill={['#6f42c1', '#64748b', '#16a34a', '#f59e0b'][index % 4]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
            </PieChart>
          </ResponsiveContainer>
        </GridItem>
        <GridItem bg="white" border="1px solid" borderColor={border} borderRadius="6px" p={3} h="286px" overflowY="auto">
          <Text fontWeight="semibold" fontSize="sm" mb={2}>Workflow Summary</Text>
          {[
            ['Invoices awaiting posting', dashboard?.metrics?.invoices || 0, 'orange'],
            ['Bills awaiting approval', dashboard?.metrics?.bills || 0, 'purple'],
            ['Payments to reconcile', dashboard?.charts?.find((item) => item.name === 'Cash In')?.value ? 1 : 0, 'blue'],
            ['Journal entries to review', dashboard?.recentTransactions?.length || 0, 'gray'],
            ['Tax reports due', 0, 'red']
          ].map(([label, count, color]) => (
            <Flex key={label} align="center" justify="space-between" py={2} borderBottom="1px solid" borderColor="#edf0f4">
              <Text fontSize="12px">{label}</Text>
              <Badge colorScheme={color} borderRadius="full">{count}</Badge>
            </Flex>
          ))}
        </GridItem>
      </Grid>
      <Grid templateColumns={{ base: '1fr', xl: '1.4fr 1fr' }} gap={2}>
        <DataTable title="Recent Transactions" rows={dashboard?.recentTransactions || []} columns={getColumns(dashboard?.recentTransactions || [])} />
        <JournalFeed rows={dashboard?.recentTransactions || []} />
      </Grid>
    </VStack>
  );

  const renderReports = () => {
    const reportRows = getReportRows();
    return (
      <VStack align="stretch" spacing={2}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={2}>
          <MetricCard label="Trial Balance Debit" value={reports?.trialBalance?.totalDebit || 0} help="General ledger" />
          <MetricCard label="Trial Balance Credit" value={reports?.trialBalance?.totalCredit || 0} help="General ledger" />
          <MetricCard label="P&L Profit" value={reports?.profitAndLoss?.profit || metrics.profit} help="Financial report" />
          <MetricCard label="Cash Flow" value={reports?.cashFlow?.operating || metrics.profit} help="Operating cash" />
        </SimpleGrid>
        <DataTable title="General Ledger / Trial Balance / Financial Reports" rows={reportRows} columns={getColumns(reportRows)} />
      </VStack>
    );
  };

  return (
    <Box minH="calc(100vh - 82px)" bg={pageBg}>
      <Box flex="1" minW={0}>
        <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2} mb={2}>
          <Box>
            <HStack>
              <Box as={FaChartLine} color={purple} />
              <Text fontSize="lg" fontWeight="bold">{activeItem?.label || 'Finance Dashboard'}</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500">Workflow-driven accounting, approvals, posting, reconciliation, reversals, ledger updates, and reports</Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <HStack bg="white" border="1px solid" borderColor={border} borderRadius="6px" px={2} h="34px">
              <FaSearch color="#94a3b8" size={12} />
              <Input variant="unstyled" size="xs" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </HStack>
            <Select size="sm" bg="white" borderColor={border} w="130px" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="posted">Posted</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
            </Select>
            <IconButton size="sm" icon={<FaFilter />} aria-label="Apply filters" onClick={load} />
            <IconButton size="sm" icon={<FaDownload />} aria-label="Export CSV" isDisabled={!can('can_export_financials')} onClick={handleExport} />
            <IconButton size="sm" icon={<FaSyncAlt />} aria-label="Refresh" onClick={load} />
            <Button size="sm" leftIcon={<FaPlus />} bg={purple} color="white" _hover={{ bg: '#5b35a0' }} isDisabled={!can('finance:write')} onClick={openCreate}>New Workflow</Button>
          </HStack>
        </Flex>

        <Box bg="white" border="1px solid" borderColor={border} borderRadius="6px" mb={2} overflowX="auto">
          <Tabs index={Math.max(activeSection.items.findIndex((item) => item.key === active), 0)} variant="unstyled" size="sm">
            <TabList minW="max-content" px={2} py={1}>
              {activeSection.items.filter((item) => !item.permission || can(item.permission)).map((item) => (
                <Tab
                  key={item.key}
                  h="30px"
                  px={3}
                  fontSize="12px"
                  borderRadius="4px"
                  color={active === item.key ? purple : 'gray.600'}
                  bg={active === item.key ? '#f1ebff' : 'transparent'}
                  _hover={{ bg: '#f8f5ff' }}
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </Box>

        {active !== 'dashboard' && (
          <WorkflowActionBar active={active} rows={currentRows} onAction={handleWorkflowAction} can={can} />
        )}

        {loadError && (
          <Box bg="#fff7ed" border="1px solid" borderColor="#fed7aa" color="#9a3412" borderRadius="6px" px={3} py={2} mb={2}>
            <Text fontSize="12px">Showing available finance data. Live sync failed: {loadError}</Text>
          </Box>
        )}

        {loading && active !== 'dashboard' && !reportKeys.includes(active) && currentRows.length === 0 ? (
          <Flex h="360px" align="center" justify="center" bg="white" border="1px solid" borderColor={border} borderRadius="6px">
            <Spinner color="purple.500" />
          </Flex>
        ) : active === 'dashboard' ? renderDashboard() : reportKeys.includes(active) ? renderReports() : (
          <DataTable title={activeItem?.label} rows={currentRows} columns={columns} showWorkflow onRowAction={handleTableAction} getRowActions={getRowActions} onSort={sortRowsByFirstColumn} onBulkAction={() => toast({ title: `${currentRows.length} records loaded`, description: 'Bulk workflow actions use the buttons above.', status: 'info', duration: 2500 })} />
        )}
      </Box>

      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader fontSize="md" borderBottom="1px solid" borderColor={border}>Create Finance Record</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel fontSize="xs">Workflow</FormLabel>
                <Select size="sm" value={workflow} onChange={(event) => setWorkflow(event.target.value)}>
                  <option value="sales-order">Sales Order to Invoice to Payment to Ledger</option>
                  <option value="purchase-order">Purchase Order to Bill to Approval to Payment</option>
                  <option value="expense-request">Expense Request to Approval to Payment</option>
                  <option value="">Simple master data record</option>
                </Select>
              </FormControl>
              {workflow ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Field label="Customer Name" value={form.customerName} onChange={(value) => setForm({ ...form, customerName: value })} hidden={workflow !== 'sales-order'} />
                    <Field label="Vendor Name" value={form.vendorName} onChange={(value) => setForm({ ...form, vendorName: value })} hidden={workflow !== 'purchase-order'} />
                    <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                    <Field label="Reference" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
                    <Field label="Amount" type="number" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
                    <Field label="Payment Amount" type="number" value={form.paymentAmount} onChange={(value) => setForm({ ...form, paymentAmount: value })} hidden={workflow === 'expense-request'} />
                    <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} hidden={workflow !== 'expense-request'} />
                    <Field label="Tax Rate" type="number" value={form.taxRate} onChange={(value) => setForm({ ...form, taxRate: value })} hidden={workflow === 'expense-request'} />
                  </SimpleGrid>
                  <FormControl>
                    <FormLabel fontSize="xs">Description</FormLabel>
                    <Textarea size="sm" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  </FormControl>
                </>
              ) : (
                (formFields[resource] || ['name']).map((field) => (
                  <Field key={field} label={field.replace(/([A-Z])/g, ' $1')} value={form[field]} onChange={(value) => setForm({ ...form, [field]: value })} />
                ))
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor={border}>
            <Button size="sm" mr={2} onClick={drawer.onClose}>Cancel</Button>
            <Button size="sm" leftIcon={<FaMoneyBillWave />} bg={purple} color="white" _hover={{ bg: '#5b35a0' }} onClick={handleCreate}>Post</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

const Field = ({ label, value, onChange, type = 'text', hidden = false }) => {
  if (hidden) return null;
  return (
    <FormControl>
      <FormLabel fontSize="xs" textTransform="capitalize">{label}</FormLabel>
      <Input size="sm" type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </FormControl>
  );
};

const WorkflowActionBar = ({ active, rows, onAction, can }) => {
  const selectedCount = rows?.length ? 1 : 0;
  const requiredPermission = {
    Approve: active === 'invoices' ? 'can_approve_invoice' : 'can_approve_bill',
    Post: active === 'invoices' ? 'can_post_invoice' : active === 'bills' ? 'can_post_bill' : 'can_post_journal',
    'Reverse Entry': active === 'invoices' ? 'can_reverse_invoice' : active === 'bills' ? 'can_reverse_bill' : 'can_reverse_journal',
    Reconcile: 'can_reconcile_bank',
    'Export PDF': 'can_export_financials'
  };
  return (
    <Flex
      bg="white"
      border="1px solid"
      borderColor={border}
      borderRadius="6px"
      px={3}
      py={2}
      mb={2}
      justify="space-between"
      align={{ base: 'stretch', lg: 'center' }}
      direction={{ base: 'column', lg: 'row' }}
      gap={2}
    >
      <HStack spacing={2} flexWrap="wrap">
        <Badge colorScheme="purple" borderRadius="full">ERP workflow</Badge>
        <Text fontSize="12px" color="gray.600">{selectedCount} selected</Text>
        <Text fontSize="12px" color="gray.400">Posted records are read-only. Use Reverse Entry for corrections.</Text>
      </HStack>
      <HStack spacing={1} flexWrap="wrap">
        {['Approve', 'Post', 'Register Payment', 'Reconcile', 'Reverse Entry', 'View Ledger', 'Print', 'Export PDF'].map((action) => (
          <Button
            key={`${active}-${action}`}
            size="xs"
            h="26px"
            variant={action === 'Post' ? 'solid' : 'outline'}
            bg={action === 'Post' ? purple : 'white'}
            color={action === 'Post' ? 'white' : 'gray.700'}
            borderColor={border}
            _hover={{ bg: action === 'Post' ? '#5b35a0' : '#f8fafc' }}
            isDisabled={requiredPermission[action] ? !can?.(requiredPermission[action]) : false}
            onClick={() => onAction(action)}
          >
            {action}
          </Button>
        ))}
      </HStack>
    </Flex>
  );
};

const WorkflowTimeline = ({ status }) => {
  const normalized = String(status || 'draft').toLowerCase();
  const activeIndex = Math.max(workflowSteps.findIndex((step) => step.toLowerCase() === normalized), normalized === 'posted' ? 3 : 0);
  return (
    <HStack spacing={1} minW="230px">
      {workflowSteps.map((step, index) => (
        <HStack key={step} spacing={1}>
          <Box
            w="7px"
            h="7px"
            borderRadius="full"
            bg={index <= activeIndex ? purple : '#d8dde6'}
          />
          <Text fontSize="10px" color={index <= activeIndex ? 'gray.700' : 'gray.400'}>{step}</Text>
        </HStack>
      ))}
    </HStack>
  );
};

const JournalFeed = ({ rows }) => (
  <Box bg="white" border="1px solid" borderColor={border} borderRadius="6px" overflow="hidden">
    <Flex justify="space-between" align="center" px={3} py={2} borderBottom="1px solid" borderColor={border}>
      <Text fontWeight="semibold" fontSize="sm">Journal Activity Feed</Text>
      <Badge colorScheme="green" borderRadius="full">Live ledger</Badge>
    </Flex>
    <VStack align="stretch" spacing={0} maxH="286px" overflowY="auto">
      {(rows || []).map((row, index) => (
        <Flex key={row._id || index} gap={2} px={3} py={2} borderBottom="1px solid" borderColor="#edf0f4">
          <Box w="8px" h="8px" mt={1.5} borderRadius="full" bg={statusColor(row.status) === 'green' ? '#16a34a' : purple} />
          <Box minW={0}>
            <HStack spacing={2}>
              <Text fontSize="12px" fontWeight="semibold">{row.number || row.paymentNumber || `JE-${index + 1}`}</Text>
              <Badge colorScheme={statusColor(row.status)} borderRadius="full" fontSize="9px">{row.status || 'posted'}</Badge>
            </HStack>
            <Text fontSize="11px" color="gray.500" noOfLines={1}>{row.memo || row.sourceType || 'Accounting transaction posted to ledger'}</Text>
            <Text fontSize="11px" color="gray.600">{formatMoney(row.totalDebit || row.amount || row.total || 0)}</Text>
          </Box>
        </Flex>
      ))}
    </VStack>
  </Box>
);

const DataTable = ({ title, rows, columns, showWorkflow = false, onRowAction, getRowActions, onSort, onBulkAction }) => (
  <Box bg="white" border="1px solid" borderColor={border} borderRadius="6px" overflow="hidden">
    <Flex justify="space-between" align="center" px={3} py={2} borderBottom="1px solid" borderColor={border}>
      <HStack spacing={2}>
        <Text fontWeight="semibold" fontSize="sm">{title}</Text>
        <Badge colorScheme="purple" borderRadius="full">{rows?.length || 0}</Badge>
      </HStack>
      {(onBulkAction || onSort) && (
        <HStack spacing={1}>
          {onBulkAction && <Button size="xs" h="24px" variant="outline" onClick={onBulkAction}>Bulk Actions</Button>}
          {onSort && <Button size="xs" h="24px" variant="outline" onClick={onSort}>Sort</Button>}
        </HStack>
      )}
    </Flex>
    <Box overflowX="auto" maxH="560px" overflowY="auto">
      <Table size="sm" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <Thead bg="#f8fafc" position="sticky" top={0} zIndex={1}>
          <Tr>
            <Th w="34px" fontSize="11px" color="gray.500" borderColor={border}>
              <input type="checkbox" aria-label="Select all rows" />
            </Th>
            {(columns || []).map((column) => (
              <Th key={column} fontSize="10px" color="gray.500" borderColor={border} py={2}>{column.replace(/([A-Z])/g, ' $1')}</Th>
            ))}
            {showWorkflow && <Th fontSize="10px" color="gray.500" borderColor={border}>Workflow</Th>}
            {showWorkflow && <Th fontSize="10px" color="gray.500" borderColor={border}>Actions</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {(rows || []).map((row, index) => (
            <Tr key={row._id || index} _hover={{ bg: '#fafafa' }} h="34px">
              <Td py={1.5} borderColor={border}>
                <input type="checkbox" aria-label={`Select row ${index + 1}`} />
              </Td>
              {(columns || []).map((column) => {
                const value = flattenValue(row[column]);
                const isStatus = column.toLowerCase().includes('status') || column === 'active';
                const isMoney = ['total', 'amount', 'balance', 'currentBalance', 'paidAmount', 'netSalary', 'totalCommission', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(column);
                return (
                  <Td key={column} fontSize="11px" borderColor={border} whiteSpace="nowrap" py={1.5}>
                    {isStatus ? (
                      <Badge colorScheme={statusColor(value || (row.active ? 'active' : 'inactive'))} borderRadius="full" fontSize="10px">
                        {String(value || (row.active ? 'active' : 'inactive')).replace(/_/g, ' ')}
                      </Badge>
                    ) : isMoney ? formatMoney(value) : String(value || '-')}
                  </Td>
                );
              })}
              {showWorkflow && (
                <Td py={1.5} borderColor={border}>
                  <WorkflowTimeline status={row.status} />
                </Td>
              )}
              {showWorkflow && (
                <Td py={1.5} borderColor={border}>
                  <HStack spacing={1}>
                    <Button size="xs" h="22px" variant="ghost" onClick={() => onRowAction?.('Ledger', row)}>Ledger</Button>
                    {(getRowActions?.(row) || []).map((action) => (
                      <Button key={action.label} size="xs" h="22px" variant="ghost" color={purple} onClick={() => onRowAction?.(action.label, row)}>
                        {action.label}
                      </Button>
                    ))}
                  </HStack>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
    <Flex justify="space-between" align="center" px={3} py={2} borderTop="1px solid" borderColor={border} color="gray.500" fontSize="xs">
      <Text>Page 1</Text>
      <HStack><Button size="xs" variant="outline" isDisabled>Previous</Button><Button size="xs" variant="outline" isDisabled>Next</Button></HStack>
    </Flex>
  </Box>
);

export default FinanceERPPage;
