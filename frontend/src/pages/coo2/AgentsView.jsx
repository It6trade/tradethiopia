// src/pages/coo2/AgentsView.jsx
import { useMemo, useState } from 'react';
import { Box, Flex, Input, Select, Text } from '@chakra-ui/react';
import CompletedSalesTable from '../../components/salesmanager/CompletedSalesTable';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FilterControl = ({ label, children, minW = '150px', flex }) => (
  <Box
    minW={minW}
    flex={flex}
    p={2}
    bg="white"
    border="1px solid #dbe4f0"
    borderRadius="10px"
  >
    <Text mb={1} color="#64748b" fontSize="10px" fontWeight="800" textTransform="uppercase">
      {label}
    </Text>
    {children}
  </Box>
);

const AgentsView = () => {
  const [now] = useState(() => new Date());
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [startMonth, setStartMonth] = useState(previousMonth.getMonth());
  const [startYear, setStartYear] = useState(previousMonth.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth());
  const [endYear, setEndYear] = useState(now.getFullYear());
  const [pillar, setPillar] = useState('All');
  const [status, setStatus] = useState('All');
  const [kpiSearch, setKpiSearch] = useState('');
  const [rows, setRows] = useState(25);

  const years = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - 3 + index);
  }, [now]);

  const tableDateRange = useMemo(() => ({
    dateFrom: new Date(startYear, startMonth, 1),
    dateTo: new Date(endYear, endMonth + 1, 1),
  }), [endMonth, endYear, startMonth, startYear]);

  return (
    <Box>
      <Box overflowX="auto" pb={2} mb={4} sx={{ scrollbarWidth: 'thin' }}>
        <Flex minW="1120px" gap={2} align="stretch">
          <FilterControl label="Start Month" minW="178px">
            <Flex gap={2}>
              <Select size="sm" value={startMonth} onChange={(event) => setStartMonth(Number(event.target.value))}>
                {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
              </Select>
              <Select size="sm" value={startYear} onChange={(event) => setStartYear(Number(event.target.value))}>
                {years.map((year) => <option key={year}>{year}</option>)}
              </Select>
            </Flex>
          </FilterControl>

          <FilterControl label="End Month" minW="178px">
            <Flex gap={2}>
              <Select size="sm" value={endMonth} onChange={(event) => setEndMonth(Number(event.target.value))}>
                {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
              </Select>
              <Select size="sm" value={endYear} onChange={(event) => setEndYear(Number(event.target.value))}>
                {years.map((year) => <option key={year}>{year}</option>)}
              </Select>
            </Flex>
          </FilterControl>

          <FilterControl label="Department" minW="150px">
            <Select size="sm" value="Sales" isReadOnly>
              <option>Sales</option>
            </Select>
          </FilterControl>

          <FilterControl label="Pillar" minW="145px">
            <Select size="sm" value={pillar} onChange={(event) => setPillar(event.target.value)}>
              <option value="All">All Pillars</option>
              <option value="Sales">Sales</option>
              <option value="Follow-ups">Follow-ups</option>
            </Select>
          </FilterControl>

          <FilterControl label="Status" minW="135px">
            <Select size="sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
            </Select>
          </FilterControl>

          <FilterControl label="Search KPI" minW="230px" flex="1">
            <Input
              size="sm"
              value={kpiSearch}
              onChange={(event) => setKpiSearch(event.target.value)}
              placeholder="Department, pillar, or KPI"
            />
          </FilterControl>

          <FilterControl label="Rows" minW="88px">
            <Select size="sm" value={rows} onChange={(event) => setRows(Number(event.target.value))}>
              {[10, 25, 50, 100].map((size) => <option key={size}>{size}</option>)}
            </Select>
          </FilterControl>
        </Flex>
      </Box>

      <CompletedSalesTable
        title="Completed Sales Follow-ups by Agent"
        dateFrom={tableDateRange.dateFrom}
        dateTo={tableDateRange.dateTo}
      />
    </Box>
  );
};

export default AgentsView;
