import React, { useEffect, useState } from 'react';
import {
  Box,
  Badge,
  Card,
  CardBody,
  Flex,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  IconButton,
  Button,
  Heading,
  Tooltip,
  HStack
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiRefreshCw, FiUser, FiCheck } from 'react-icons/fi';

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB'
  }).format(number);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'yellow';
    case 'hr_submitted': return 'blue';
    case 'finance_reviewed': return 'purple';
    case 'approved': return 'green';
    case 'locked': return 'red';
    default: return 'gray';
  }
};

const getDisplayGrossSalary = (employee) => {
  return employee.grossSalaryWithBonus ?? employee.grossSalary ?? employee.basicSalary ?? 0;
};

const getDisplayFinanceAdjustment = (employee, field) => {
  const storedValue = Number(employee[field]) || 0;
  if (storedValue !== 0) return storedValue;

  const grossSalary = Number(getDisplayGrossSalary(employee)) || 0;
  const netSalary = Number(employee.netSalary || employee.finalSalary) || 0;
  const derivedAdjustment = grossSalary - netSalary;

  return derivedAdjustment > 0 ? derivedAdjustment : 0;
};

const FinancePayrollTable = ({
  data = [],
  loading,
  error,
  onRefresh,
  onEditRow,
  onDeleteRow,
  onViewProfile,
  onApproveRow,
  month,
  year
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('teal.600', 'teal.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const displayMonth = month || new Date().toISOString().slice(0, 7);

  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Payroll Records {displayMonth}</Heading>
          {onRefresh && (
            <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </Flex>

        <Box overflowX="auto">
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : error ? (
            <Text color="red.500" textAlign="center" py={6}>
              {error}
            </Text>
          ) : data.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={6}>
              No payroll records available for this period.
            </Text>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  {[
                    'Employee',
                    'Department',
                    'Gross',
                    'Tax',
                    'Pension',
                    'Overtime',
                    'Commission',
                    'Fin. Allowances',
                    'Fin. Deductions',
                    'Net',
                    'Status',
                    'Actions'
                  ].map((label) => (
                    <Th
                      key={label}
                      py={2}
                      px={3}
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      position="sticky"
                      top={0}
                      bg={headerBg}
                      zIndex={1}
                      borderColor={borderColor}
                    >
                      {label}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {data.map((employee) => (
                  <Tr key={employee._id || employee.userId?.value} _hover={{ bg: rowHoverBg }}>
                    <Td py={2} px={3} fontSize="xs">
                      <Text fontWeight="semibold">
                        {employee.employeeName || employee.userId?.fullName || 'Unknown'}
                      </Text>
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      <Badge colorScheme="blue" fontSize="xs">
                        {employee.department || 'N/A'}
                      </Badge>
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(getDisplayGrossSalary(employee))}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(employee.incomeTax)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(employee.pension)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(employee.overtimePay)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(employee.salesCommission)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(getDisplayFinanceAdjustment(employee, 'financeAllowances'))}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      {formatCurrency(employee.financeDeductions)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs" fontWeight="bold" color="teal.500">
                      {formatCurrency(employee.netSalary || employee.finalSalary)}
                    </Td>
                    <Td py={2} px={3} fontSize="xs">
                      <Badge colorScheme={getStatusColor(employee.status)} fontSize="xs">
                        {employee.status?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </Td>
                    <Td py={2} px={3}>
                      <HStack spacing={2}>
                        {onViewProfile && (
                          <Tooltip label="View profile">
                            <IconButton
                              size="xs"
                              icon={<FiUser />}
                              aria-label="View profile"
                              onClick={() => onViewProfile(employee)}
                            />
                          </Tooltip>
                        )}
                        {onApproveRow && (
                          <Tooltip label="Approve payroll entry">
                            <IconButton
                              size="xs"
                              icon={<FiCheck />}
                              aria-label="Approve payroll"
                              colorScheme="green"
                              onClick={() => onApproveRow(employee)}
                            />
                          </Tooltip>
                        )}
                        <Tooltip label="Edit payroll entry">
                          <IconButton
                            size="xs"
                            icon={<FiEdit />}
                            aria-label="Edit payroll"
                            onClick={() => onEditRow && onEditRow(employee)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete payroll entry">
                          <IconButton
                            size="xs"
                            icon={<FiTrash2 />}
                            aria-label="Delete payroll"
                            colorScheme="red"
                            onClick={() => onDeleteRow && onDeleteRow(employee)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </CardBody>
    </Card>
  );
};

export default FinancePayrollTable;
