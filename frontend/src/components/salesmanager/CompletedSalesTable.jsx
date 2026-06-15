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

export default function CompletedSalesTable({ title = 'Completed Sales Follow-ups', compact = false }) {
  const [sales, setSales] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(compact ? 10 : 25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const response = await getAllSales({
          status: 'Completed',
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
  }, [page, pageSize]);

  useEffect(() => {
    const agentMap = new Map();
    sales.forEach((sale) => {
      const id = typeof sale.agentId === 'object' ? sale.agentId?._id : sale.agentId;
      const name = getAgentName(sale);
      if (id || name) {
        agentMap.set(id || name, name);
      }
    });
    setAgents(Array.from(agentMap.entries()).map(([id, name]) => ({ id, name })));
  }, [sales]);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sales.filter((sale) => {
      const resolvedAgentId = typeof sale.agentId === 'object' ? sale.agentId?._id : sale.agentId;
      if (agentFilter && resolvedAgentId !== agentFilter && getAgentName(sale) !== agentFilter) return false;
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
  }, [agentFilter, sales, search]);

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
      <CardBody p={{ base: 3, md: 4 }}>
        <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <Box>
            <Text fontSize={compact ? 'lg' : 'xl'} fontWeight="800">
              {title}
            </Text>
            <Text fontSize="sm" color={muted}>
              Full table of sales follow-ups marked Completed.
            </Text>
          </Box>
          <Badge colorScheme="green" borderRadius="full" px={3} py={1} alignSelf={{ base: 'flex-start', md: 'center' }}>
            {total} completed
          </Badge>
        </Flex>

        <Flex gap={3} direction={{ base: 'column', md: 'row' }} mb={4}>
          <InputGroup maxW={{ md: '360px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="#94A3B8" />
            </InputLeftElement>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, course, agent" />
          </InputGroup>
          <Select maxW={{ md: '240px' }} value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </Flex>

        {loading ? (
          <Flex align="center" justify="center" minH="160px" gap={3}>
            <Spinner />
            <Text color={muted}>Loading completed sales...</Text>
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <VStack align="stretch" spacing={4}>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>Course / Interest</Th>
                    <Th>Agent</Th>
                    <Th>Call</Th>
                    <Th>Schedule</Th>
                    <Th>Date</Th>
                    <Th isNumeric>Price</Th>
                    <Th isNumeric>Net Commission</Th>
                    <Th>Source</Th>
                    <Th>Supervisor Comment</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredSales.length ? (
                    filteredSales.map((sale) => (
                      <Tr key={sale._id} _hover={{ bg: rowHoverBg }}>
                        <Td>
                          <Text fontWeight="700">{sale.customerName || '-'}</Text>
                          <Badge mt={1} colorScheme="green" size="sm">Completed</Badge>
                        </Td>
                        <Td>{sale.phone || '-'}</Td>
                        <Td>{sale.email || '-'}</Td>
                        <Td>
                          <Text fontWeight="600">{sale.courseName || sale.contactTitle || sale.productInterest || '-'}</Text>
                          {sale.note ? <Text color={muted} fontSize="xs" noOfLines={2}>{sale.note}</Text> : null}
                        </Td>
                        <Td>{getAgentName(sale)}</Td>
                        <Td>{sale.callStatus || '-'}</Td>
                        <Td>{sale.schedulePreference || '-'}</Td>
                        <Td>{formatDate(sale.date || sale.updatedAt)}</Td>
                        <Td isNumeric>{formatCurrency(sale.coursePrice)}</Td>
                        <Td isNumeric>{formatCurrency(sale.commission?.netCommission)}</Td>
                        <Td>{sale.source || '-'}</Td>
                        <Td>
                          <Text maxW="240px" noOfLines={2}>{sale.supervisorComment || '-'}</Text>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={12} textAlign="center" py={8} color={muted}>
                        No completed sales match the current filters.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>

            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack>
                <Text fontSize="sm" color={muted}>
                  Page {page} of {totalPages}
                </Text>
                <Select
                  size="sm"
                  w="120px"
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
              <HStack>
                <Button size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} isDisabled={page <= 1}>
                  Previous
                </Button>
                <Button size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} isDisabled={page >= totalPages}>
                  Next
                </Button>
              </HStack>
            </Flex>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
}
