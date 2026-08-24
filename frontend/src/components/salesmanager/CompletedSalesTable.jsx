import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { getAllSales } from '../../services/salesManagerService';
import axiosInstance from '../../services/axiosInstance';

const getAgentName = (sale) => {
  if (!sale?.agentId) return sale?.agentName || 'Unassigned';
  if (typeof sale.agentId === 'object') {
    return sale.agentId.fullName || sale.agentId.username || sale.agentId.email || 'Unassigned';
  }
  return sale.agentId;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function CompletedSalesTable({
  title = 'Completed Sales Follow-ups',
  compact = false,
  dateFrom,
  dateTo,
}) {
  const [sales, setSales] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableStartDate, setTableStartDate] = useState(() => toDateInputValue(dateFrom));
  const [tableEndDate, setTableEndDate] = useState(() => toDateInputValue(dateTo));

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('#e2e8f0', '#1e293b');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const muted = useColorModeValue('#64748b', '#94a3b8');
  const headingColor = useColorModeValue('#0f172a', '#f8fafc');
  const textColor = useColorModeValue('#334155', '#cbd5e1');

  const tableDateRange = useMemo(() => {
    const start = tableStartDate ? new Date(`${tableStartDate}T00:00:00`) : null;
    const end = tableEndDate ? new Date(`${tableEndDate}T23:59:59.999`) : null;
    return {
      dateFrom: start && !Number.isNaN(start.getTime()) ? start.toISOString() : undefined,
      dateTo: end && !Number.isNaN(end.getTime()) ? end.toISOString() : undefined,
    };
  }, [tableStartDate, tableEndDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const response = await getAllSales({
          status: 'Completed',
          agentId: agentFilter || undefined,
          search: debouncedSearch || undefined,
          dateFrom: tableDateRange.dateFrom,
          dateTo: tableDateRange.dateTo,
          page,
          limit: pageSize,
        });
        const rows = Array.isArray(response) ? response : response?.data || [];
        setSales(rows);
        setTotal(Array.isArray(response) ? rows.length : response?.total || rows.length);
        setTotalPages(Math.max(1, Array.isArray(response) ? 1 : response?.totalPages || 1));
        setError('');
      } catch (loadError) {
        console.error('Failed to load completed sales follow-ups:', loadError);
        setError(loadError.response?.data?.message || loadError.message || 'Failed to load completed sales follow-ups.');
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [agentFilter, debouncedSearch, page, pageSize, tableDateRange]);

  useEffect(() => {
    setPage(1);
  }, [tableDateRange]);

  useEffect(() => {
    setTableStartDate(toDateInputValue(dateFrom));
    setTableEndDate(toDateInputValue(dateTo));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    let active = true;
    axiosInstance.get('/sales-manager/agents').then(({ data }) => {
      if (!active) return;
      setAgents((Array.isArray(data) ? data : [])
        .filter((agent) => String(agent.role || '').trim().toLowerCase() === 'sales')
        .map((agent) => ({
          id: agent._id,
          name: agent.fullName || agent.username || agent.email || 'Unnamed Agent',
        })));
    }).catch(() => {
      if (active) setAgents([]);
    });
    return () => { active = false; };
  }, []);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rangeStart = tableDateRange.dateFrom ? new Date(tableDateRange.dateFrom) : null;
    const rangeEnd = tableDateRange.dateTo ? new Date(tableDateRange.dateTo) : null;
    return sales.filter((sale) => {
      const resolvedAgentId = typeof sale.agentId === 'object' ? sale.agentId?._id : sale.agentId;
      if (agentFilter && String(resolvedAgentId || '') !== String(agentFilter)) return false;

      const saleDateValue = sale.date || sale.updatedAt || sale.createdAt;
      const saleDate = saleDateValue ? new Date(saleDateValue) : null;
      if ((rangeStart || rangeEnd) && (!saleDate || Number.isNaN(saleDate.getTime()))) return false;
      if (rangeStart && saleDate < rangeStart) return false;
      if (rangeEnd && saleDate > rangeEnd) return false;

      if (!term) return true;

      return [
        sale.customerName,
        sale.phone,
        sale.email,
        sale.contactTitle,
        sale.courseName,
        sale.productInterest,
        getAgentName(sale),
        sale.note,
        sale.supervisorComment,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [agentFilter, sales, search, tableDateRange]);

  const visiblePages = useMemo(() => {
    const visibleCount = Math.min(5, totalPages);
    const maxStart = Math.max(1, totalPages - visibleCount + 1);
    const start = Math.min(Math.max(1, page - Math.floor(visibleCount / 2)), maxStart);
    return Array.from({ length: visibleCount }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" boxShadow="xs">
      <CardBody p={{ base: 3, md: 4 }}>
        <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2} mb={3}>
          <Box>
            <Text fontSize="sm" fontWeight="700" color={headingColor}>
              {title}
            </Text>
            <Text fontSize="xs" color={muted}>
              {tableDateRange.dateFrom && tableDateRange.dateTo
                ? `Completed follow-ups from ${formatDate(tableDateRange.dateFrom)} through ${formatDate(tableDateRange.dateTo)}.`
                : 'Full table of sales follow-ups marked Completed.'}
            </Text>
          </Box>
          <Badge
            bg="#dcfce7"
            color="#16a34a"
            fontSize="10px"
            fontWeight="600"
            borderRadius="full"
            px={2.5}
            py={0.5}
            alignSelf={{ base: 'flex-start', md: 'center' }}
          >
            {total} COMPLETED
          </Badge>
        </Flex>

        <Flex gap={2.5} direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} flexWrap="wrap" mb={3}>
          <InputGroup size="sm" maxW={{ md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="#94A3B8" size={13} />
            </InputLeftElement>
            <Input
              size="sm"
              fontSize="xs"
              borderRadius="lg"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, course, agent"
            />
          </InputGroup>
          <Select
            size="sm"
            fontSize="xs"
            borderRadius="lg"
            maxW={{ md: '180px' }}
            value={agentFilter}
            onChange={(event) => {
              setAgentFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
          {(dateFrom || dateTo) && (
            <HStack spacing={2} flexWrap="wrap">
              <Box>
                <Text fontSize="10px" color={muted} mb={0.5}>Table Start Date</Text>
                <Input
                  type="date"
                  size="xs"
                  fontSize="xs"
                  borderRadius="md"
                  value={tableStartDate}
                  max={tableEndDate || undefined}
                  onChange={(event) => setTableStartDate(event.target.value)}
                />
              </Box>
              <Box>
                <Text fontSize="10px" color={muted} mb={0.5}>Table End Date</Text>
                <Input
                  type="date"
                  size="xs"
                  fontSize="xs"
                  borderRadius="md"
                  value={tableEndDate}
                  min={tableStartDate || undefined}
                  max={toDateInputValue(new Date())}
                  onChange={(event) => setTableEndDate(event.target.value)}
                />
              </Box>
            </HStack>
          )}
          <HStack ml={{ md: 'auto' }} flexWrap="wrap" spacing={2}>
            <Text fontSize="xs" color={muted}>
              Page {page} of {totalPages}
            </Text>
            <Select
              size="xs"
              fontSize="xs"
              borderRadius="md"
              w="105px"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </Select>
          </HStack>
        </Flex>

        {loading ? (
          <Flex align="center" justify="center" minH="120px" gap={2}>
            <Spinner size="sm" color="teal.500" />
            <Text fontSize="xs" color={muted}>Loading completed sales...</Text>
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="md" size="sm" fontSize="xs">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <VStack align="stretch" spacing={3}>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr borderBottom="1px solid" borderColor={borderColor}>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Agent Name</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Customer</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Phone</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Email</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Course / Interest</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Call</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Schedule</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Date</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3} isNumeric>Price</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3} isNumeric>Net Commission</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Source</Th>
                    <Th fontSize="10px" fontWeight="600" color={muted} textTransform="uppercase" letterSpacing="0.04em" py={2} px={3}>Supervisor Comment</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredSales.length ? (
                    filteredSales.map((sale) => (
                      <Tr key={sale._id} _hover={{ bg: rowHoverBg }} borderBottom="1px solid" borderColor={borderColor}>
                        <Td fontSize="xs" fontWeight="500" color={headingColor} py={2.5} px={3} whiteSpace="nowrap">
                          {getAgentName(sale)}
                        </Td>
                        <Td fontSize="xs" py={2.5} px={3} whiteSpace="nowrap">
                          <Text fontSize="xs" fontWeight="500" color={headingColor} lineHeight="1.2">
                            {sale.customerName || '-'}
                          </Text>
                          <Badge
                            mt={0.5}
                            fontSize="9px"
                            fontWeight="600"
                            borderRadius="full"
                            px={1.5}
                            py={0.2}
                            bg="#dcfce7"
                            color="#16a34a"
                          >
                            COMPLETED
                          </Badge>
                        </Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3} whiteSpace="nowrap">{sale.phone || '-'}</Td>
                        <Td fontSize="xs" color={muted} py={2.5} px={3}>{sale.email || '-'}</Td>
                        <Td fontSize="xs" py={2.5} px={3}>
                          <Text fontSize="xs" fontWeight="400" color={textColor} lineHeight="1.2">
                            {sale.courseName || sale.contactTitle || sale.productInterest || '-'}
                          </Text>
                          {sale.note ? <Text color={muted} fontSize="10px" noOfLines={1} mt={0.5}>{sale.note}</Text> : null}
                        </Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3}>{sale.callStatus || '-'}</Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3}>{sale.schedulePreference || '-'}</Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3} whiteSpace="nowrap">{formatDate(sale.date || sale.updatedAt)}</Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3} isNumeric whiteSpace="nowrap">{formatCurrency(sale.coursePrice)}</Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3} isNumeric whiteSpace="nowrap">{formatCurrency(sale.commission?.netCommission)}</Td>
                        <Td fontSize="xs" color={textColor} py={2.5} px={3}>{sale.source || '-'}</Td>
                        <Td fontSize="xs" color={muted} py={2.5} px={3}>
                          <Text maxW="200px" noOfLines={1}>{sale.supervisorComment || '-'}</Text>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={12} textAlign="center" py={6} color={muted} fontSize="xs">
                        No completed sales match the current filters.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>

            <HStack justify="flex-end" spacing={1} pt={1}>
              <Button size="xs" fontSize="xs" onClick={() => setPage((value) => Math.max(1, value - 1))} isDisabled={page <= 1}>
                Previous
              </Button>
              {visiblePages.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  size="xs"
                  fontSize="xs"
                  minW="28px"
                  variant={pageNumber === page ? 'solid' : 'outline'}
                  colorScheme={pageNumber === page ? 'teal' : 'gray'}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button size="xs" fontSize="xs" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} isDisabled={page >= totalPages}>
                Next
              </Button>
            </HStack>

          </VStack>
        )}
      </CardBody>
    </Card>
  );
}
