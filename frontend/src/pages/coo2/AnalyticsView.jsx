// src/pages/coo2/AnalyticsView.jsx
import React, { useState } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  HStack,
  VStack,
  Badge,
  Icon,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Progress,
} from '@chakra-ui/react';
import {
  FiPieChart,
  FiTrendingUp,
  FiBarChart2,
  FiLayers,
  FiCheckCircle,
  FiTarget,
  FiDownload,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { DEPARTMENTS } from './cooData';

const departmentPerformance = [
  { name: 'Sales', revenue: 4850, target: 4500, efficiency: 94, color: '#10b981' },
  { name: 'IT', revenue: 2100, target: 2000, efficiency: 99, color: '#6366f1' },
  { name: 'Tradex', revenue: 1420, target: 1200, efficiency: 88, color: '#ec4899' },
  { name: 'Tessbin', revenue: 3890, target: 3600, efficiency: 98, color: '#f59e0b' },
  { name: 'HR', revenue: 950, target: 900, efficiency: 96, color: '#8b5cf6' },
  { name: 'CS', revenue: 1200, target: 1100, efficiency: 96, color: '#06b6d4' },
  { name: 'Finance', revenue: 5400, target: 5000, efficiency: 99, color: '#14b8a6' },
  { name: 'Supervisor', revenue: 820, target: 800, efficiency: 98, color: '#f97316' },
  { name: 'Social', revenue: 1150, target: 1000, efficiency: 93, color: '#e11d48' },
  { name: 'Ensira', revenue: 3650, target: 3200, efficiency: 95, color: '#84cc16' },
];

const budgetAllocation = [
  { name: 'Sales & Marketing', value: 32, color: '#3b82f6' },
  { name: 'Logistics & Tessbin', value: 24, color: '#f59e0b' },
  { name: 'Agri & Ensira', value: 18, color: '#84cc16' },
  { name: 'IT & Infrastructure', value: 14, color: '#6366f1' },
  { name: 'Admin & Operations', value: 12, color: '#ec4899' },
];

const AnalyticsView = () => {
  const [metricFilter, setMetricFilter] = useState('revenue');

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <HStack spacing={2.5}>
            <Text fontSize="22px" fontWeight="800" color="#0f172a" letterSpacing="-0.02em">
              Executive Operations Analytics
            </Text>
            <Badge colorScheme="purple" fontSize="11px" borderRadius="6px" px={2} py={0.5}>
              10 Divisions Benchmarked
            </Badge>
          </HStack>
          <Text fontSize="13.5px" color="#64748b">
            Comparative performance, target vs actual revenue, and efficiency indices across all units.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Select
            size="sm"
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
            borderRadius="10px"
            bg="#ffffff"
            borderColor="#e2e8f0"
            fontSize="12.5px"
            w="160px"
          >
            <option value="revenue">Revenue Index</option>
            <option value="efficiency">Efficiency Score</option>
            <option value="target">Target Attainment</option>
          </Select>

          <Button
            size="sm"
            variant="outline"
            borderRadius="10px"
            borderColor="#e2e8f0"
            bg="#ffffff"
            color="#334155"
            fontSize="12.5px"
            leftIcon={<FiDownload size={14} />}
          >
            Export Analytics
          </Button>
        </HStack>
      </Flex>

      {/* Top Charts Grid */}
      <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={5} mb={6}>
        {/* Cross-Department Bar Chart (8 Cols) */}
        <Box
          gridColumn={{ base: 'span 1', lg: 'span 8' }}
          bg="#ffffff"
          p={5}
          borderRadius="16px"
          border="1px solid #e2e8f0"
          boxShadow="0 2px 6px rgba(0,0,0,0.02)"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Text fontSize="14px" fontWeight="700" color="#0f172a">
                Cross-Department Output vs Target (in Thousands ETB)
              </Text>
              <Text fontSize="12px" color="#64748b">
                Comparison of actual performance against Q2 corporate benchmarks
              </Text>
            </Box>
            <HStack spacing={3}>
              <HStack spacing={1}>
                <Box w="10px" h="10px" borderRadius="3px" bg="#2563eb" />
                <Text fontSize="11.5px" color="#64748b">Actual Output</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w="10px" h="10px" borderRadius="3px" bg="#cbd5e1" />
                <Text fontSize="11.5px" color="#64748b">Target Baseline</Text>
              </HStack>
            </HStack>
          </Flex>

          <Box h="300px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#f1f5f9' }} tick={{ fontSize: 11.5, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <RechartsTooltip />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} name="Actual (k ETB)" />
                <Bar dataKey="target" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Target (k ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Budget & Resource Share Pie (4 Cols) */}
        <Box
          gridColumn={{ base: 'span 1', lg: 'span 4' }}
          bg="#ffffff"
          p={5}
          borderRadius="16px"
          border="1px solid #e2e8f0"
          boxShadow="0 2px 6px rgba(0,0,0,0.02)"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box mb={2}>
            <Text fontSize="14px" fontWeight="700" color="#0f172a">
              Operational Budget Allocation
            </Text>
            <Text fontSize="12px" color="#64748b">
              Capital expenditure distribution across wings
            </Text>
          </Box>

          <Box h="200px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {budgetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <VStack align="stretch" spacing={2} mt={2}>
            {budgetAllocation.map((item, idx) => (
              <Flex key={idx} justify="space-between" align="center" fontSize="12px">
                <HStack spacing={2}>
                  <Box w="8px" h="8px" borderRadius="full" bg={item.color} />
                  <Text color="#475569" fontWeight="500">{item.name}</Text>
                </HStack>
                <Text fontWeight="700" color="#0f172a">{item.value}%</Text>
              </Flex>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Comprehensive Department Scorecard Table */}
      <Box
        bg="#ffffff"
        p={5}
        borderRadius="16px"
        border="1px solid #e2e8f0"
        boxShadow="0 2px 6px rgba(0,0,0,0.02)"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="15px" fontWeight="700" color="#0f172a">
            Department Performance & Efficiency Matrix
          </Text>
          <Badge colorScheme="green" fontSize="11px" borderRadius="full" px={2.5} py={0.5}>
            Overall Health: 97.4% Excellent
          </Badge>
        </Flex>

        <Box overflowX="auto">
          <Table variant="unstyled" size="sm">
            <Thead>
              <Tr borderBottom="1px solid #f1f5f9">
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600" pl={0}>Department</Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">Output Index</Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">Target Attainment</Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">Efficiency Score</Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">Health Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {departmentPerformance.map((dept, i) => {
                const attainment = Math.round((dept.revenue / dept.target) * 100);
                return (
                  <Tr key={i} borderBottom="1px solid #f8fafc" _hover={{ bg: '#f8fafc' }}>
                    <Td pl={0} py={3}>
                      <HStack spacing={2.5}>
                        <Box w="8px" h="8px" borderRadius="full" bg={dept.color} />
                        <Text fontSize="13px" fontWeight="700" color="#0f172a">
                          {dept.name}
                        </Text>
                      </HStack>
                    </Td>

                    <Td py={3}>
                      <Text fontSize="12.5px" fontWeight="600" color="#334155">
                        ETB {dept.revenue.toLocaleString()},000
                      </Text>
                    </Td>

                    <Td py={3}>
                      <HStack spacing={2} maxW="150px">
                        <Progress
                          value={attainment}
                          size="xs"
                          borderRadius="full"
                          colorScheme={attainment >= 100 ? 'green' : 'blue'}
                          bg="#f1f5f9"
                          flex={1}
                        />
                        <Text fontSize="12px" fontWeight="700" color={attainment >= 100 ? '#15803d' : '#2563eb'}>
                          {attainment}%
                        </Text>
                      </HStack>
                    </Td>

                    <Td py={3}>
                      <Badge
                        fontSize="11px"
                        fontWeight="700"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        bg="#f0fdf4"
                        color="#15803d"
                      >
                        {dept.efficiency}% Score
                      </Badge>
                    </Td>

                    <Td py={3}>
                      <HStack spacing={1.5}>
                        <Icon as={FiCheckCircle} color="#10b981" boxSize="14px" />
                        <Text fontSize="12px" color="#15803d" fontWeight="600">
                          Optimal
                        </Text>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsView;
