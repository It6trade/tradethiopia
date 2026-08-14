import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Heading,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { REQUEST_DEPARTMENTS, REQUEST_PRIORITIES, REQUEST_STATUSES, useTeamRequests } from '../../hooks/useTeamRequests';

const TeamRequestsPage = () => {
  const {
    filters,
    handleFilterChange,
    resetFilters,
    requests,
    loading,
    requestSummary,
    fetchRequests,
    statusUpdatingId,
    handleStatusChange,
  } = useTeamRequests();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.500', 'gray.400');

  const formatRequestDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch ((status || 'Pending').toLowerCase()) {
      case 'approved':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'orange';
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || 'Medium').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap">
          <Heading size="xl" color={headerColor}>
            Team Requests
          </Heading>
          <Button size="sm" variant="outline" colorScheme="teal" onClick={fetchRequests} isLoading={loading}>
            Refresh
          </Button>
        </Flex>

        <Card bg={cardBg} boxShadow="md" mb={6}>
          <CardHeader>
            <Heading size="md">Filters</Heading>
            <Text fontSize="sm" color={textColor}>
              Narrow Team Requests by department, priority, status, or date range.
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs">Department</FormLabel>
                <Select value={filters.department} onChange={(event) => handleFilterChange('department', event.target.value)}>
                  <option value="">All</option>
                  {REQUEST_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Priority</FormLabel>
                <Select value={filters.priority} onChange={(event) => handleFilterChange('priority', event.target.value)}>
                  <option value="">All</option>
                  {REQUEST_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Status</FormLabel>
                <Select value={filters.status} onChange={(event) => handleFilterChange('status', event.target.value)}>
                  <option value="">All</option>
                  {REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">From date</FormLabel>
                <Input type="date" value={filters.fromDate} onChange={(event) => handleFilterChange('fromDate', event.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">To date</FormLabel>
                <Input type="date" value={filters.toDate} onChange={(event) => handleFilterChange('toDate', event.target.value)} />
              </FormControl>
            </SimpleGrid>
            <HStack spacing={3} mt={4}>
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
              <Button size="sm" colorScheme="teal" onClick={fetchRequests} isLoading={loading}>
                Apply filters
              </Button>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="md" mb={6}>
          <CardHeader>
            <Heading size="md">Summary</Heading>
            <Text fontSize="sm" color={textColor}>
              Overview of the current requests across departments.
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                <Text fontSize="xs" color={textColor}>
                  Total requests
                </Text>
                <Heading size="md">{requestSummary.total}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                <Text fontSize="xs" color={textColor}>
                  Open
                </Text>
                <Heading size="md">{requestSummary.open}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                <Text fontSize="xs" color={textColor}>
                  High priority
                </Text>
                <Heading size="md">{requestSummary.highPriority}</Heading>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="md">
          <CardHeader>
            <Heading size="md">Requests list</Heading>
            <Text fontSize="sm" color={textColor}>
              Track, triage, and update team requests without losing context.
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {loading ? (
                <Text textAlign="center" color={textColor}>
                  Loading requests...
                </Text>
              ) : requests.length === 0 ? (
                <Text textAlign="center" color={textColor}>
                  No requests match the current filters.
                </Text>
              ) : (
                requests.map((request) => {
                  const label = request.title || `${request.department || 'Team'} request`;
                  return (
                    <Box
                      key={request._id || request.createdAt || label}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                      p={4}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {label}
                        </Text>
                        <Badge colorScheme={getPriorityColor(request.priority)}>{request.priority || 'Medium'}</Badge>
                      </Flex>
                      <HStack spacing={2} fontSize="xs" color="gray.500" mb={1}>
                        <Text>{request.department || 'Department'}</Text>
                        <Text>•</Text>
                        <Badge colorScheme={getStatusColor(request.status)} fontSize="xx-small">
                          {request.status || 'Pending'}
                        </Badge>
                        <Text>•</Text>
                        <Text>{formatRequestDate(request.date || request.createdAt)}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Submitted by {request.createdBy || 'Team'}
                      </Text>
                      {request.details && (
                        <Text fontSize="sm" color="gray.600" noOfLines={3} mb={3}>
                          {request.details}
                        </Text>
                      )}
                      <Select
                        size="sm"
                        value={request.status || 'Pending'}
                        onChange={(event) => handleStatusChange(request._id, event.target.value)}
                        isDisabled={statusUpdatingId === request._id}
                      >
                        {REQUEST_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  );
                })
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
  );
};

export default TeamRequestsPage;
