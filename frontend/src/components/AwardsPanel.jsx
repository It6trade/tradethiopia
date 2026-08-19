import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import { getAwardsByMonth, getPerformanceDetail } from '../services/awardService';

const rankInfo = [
  { label: 'Gold', emoji: '🥇', color: 'yellow' },
  { label: 'Silver', emoji: '🥈', color: 'gray' },
  { label: 'Bronze', emoji: '🥉', color: 'orange' },
];

const knownDepartments = ['TradeXTV', 'IT', 'SocialMedia', 'Sales', 'CustomerSuccess', 'Finance', 'HR', 'Operations'];

const RankBadge = ({ rank }) => {
  if (typeof rank !== 'number' || rank < 0 || rank >= rankInfo.length) {
    return null;
  }
  const info = rankInfo[rank];
  return (
    <Badge colorScheme={info.color} px={2.5} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold">
      {info.emoji} {info.label}
    </Badge>
  );
};

const formatScore = (score) => {
  if (typeof score === 'number') return score.toFixed(2);
  if (score == null) return '0.00';
  return String(score);
};

const AwardsPanel = ({ month, refreshKey = 0, onAwardsLoaded }) => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedPerf, setSelectedPerf] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const emitAwardsChange = (list) => {
    if (typeof onAwardsLoaded === 'function') {
      onAwardsLoaded(Array.isArray(list) ? list : []);
    }
  };

  useEffect(() => {
    if (!month) {
      setAwards([]);
      setLoading(false);
      setError(null);
      emitAwardsChange([]);
      return;
    }
    setLoading(true);
    setError(null);
    getAwardsByMonth(month)
      .then((res) => {
        if (res && res.success) {
          const payload = res.data || [];
          setAwards(payload);
          emitAwardsChange(payload);
        } else {
          setAwards([]);
          emitAwardsChange([]);
          setError(res?.message || 'Failed to load awards');
        }
      })
      .catch((err) => {
        setAwards([]);
        emitAwardsChange([]);
        setError(err?.message || 'Unable to fetch awards');
      })
      .finally(() => setLoading(false));
  }, [month, refreshKey]);

  useEffect(() => {
    setDepartmentFilter('all');
  }, [month]);

  const sortedAwards = useMemo(
    () => [...awards].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [awards]
  );

  const departmentWinners = useMemo(() => {
    return awards
      .filter((award) => award.awardType === 'Department Winner')
      .sort((a, b) => (a.department || '').localeCompare(b.department || ''));
  }, [awards]);

  const departmentOptions = useMemo(() => {
    const extended = [...knownDepartments];
    departmentWinners.forEach((award) => {
      const dept = award.department;
      if (dept && !extended.includes(dept)) {
        extended.push(dept);
      }
    });
    return ['all', ...extended];
  }, [departmentWinners]);

  const visibleDepartmentWinners = useMemo(() => {
    if (departmentFilter === 'all') return departmentWinners;
    return departmentWinners.filter((award) => award.department === departmentFilter);
  }, [departmentFilter, departmentWinners]);

  const topThree = useMemo(() => {
    const unique = [];
    const seen = new Set();
    for (const award of sortedAwards) {
      const id = award.employeeId?._id || award.employeeId || award._id;
      if (!id) continue;
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(award);
      if (unique.length === 3) break;
    }
    return unique;
  }, [sortedAwards]);

  const overallWinner = useMemo(
    () => awards.find((award) => award.awardType === 'Overall Winner'),
    [awards]
  );

  const openDetail = async (award) => {
    if (!award) return;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const empId = award.employeeId?._id || award.employeeId;
      const resp = await getPerformanceDetail(month, empId);
      if (resp && resp.success) {
        setSelectedPerf(resp.data);
        onOpen();
      } else {
        setDetailError(resp?.message || 'Unable to load performance detail');
      }
    } catch (err) {
      setDetailError(err?.message || 'Unable to load performance detail');
    } finally {
      setDetailLoading(false);
    }
  };

  if (!month) {
    return <Text color="gray.500">Select a month to view awards.</Text>;
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Spinner size="lg" color="teal.500" thickness="3px" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box borderRadius="lg" p={4} bg="red.50" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontSize="sm">{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Filter and Overall Banner */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={4}
        mb={6}
      >
        <HStack spacing={2}>
          <Icon as={FiAward} color="teal.600" boxSize={5} />
          <Heading size="md" color="gray.800">
            Published Awards • {month}
          </Heading>
        </HStack>

        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            Filter Dept:
          </Text>
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            maxW="220px"
            size="sm"
            borderRadius="md"
          >
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Departments' : option}
              </option>
            ))}
          </Select>
        </HStack>
      </Flex>

      {/* Overall Winner Card */}
      {overallWinner ? (
        <Card
          borderRadius="xl"
          borderWidth="2px"
          borderColor="yellow.300"
          bg="gradient(to-r, yellow.50, orange.50)"
          shadow="sm"
          mb={6}
        >
          <CardBody p={5}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              gap={4}
            >
              <HStack spacing={4}>
                <Avatar
                  size="lg"
                  name={overallWinner.employeeId?.fullName || overallWinner.employeeId?.username}
                  bg="yellow.500"
                  color="white"
                  border="2px solid white"
                  shadow="sm"
                />
                <Box>
                  <HStack spacing={2} mb={1}>
                    <Badge colorScheme="yellow" px={2.5} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold">
                      🏆 Overall Company Winner
                    </Badge>
                    <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full" fontSize="xs">
                      {overallWinner.department}
                    </Badge>
                  </HStack>
                  <Text fontSize="xl" fontWeight="extrabold" color="gray.900">
                    {overallWinner.employeeId?.fullName || overallWinner.employeeId?.username || 'Employee'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {overallWinner.employeeId?.jobTitle || overallWinner.department} • Score: {formatScore(overallWinner.score)} / 100
                  </Text>
                </Box>
              </HStack>

              <Button
                size="sm"
                colorScheme="yellow"
                variant="solid"
                onClick={() => openDetail(overallWinner)}
              >
                View Performance Metrics
              </Button>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Box borderRadius="xl" p={5} mb={6} bg="gray.50" border="1px dashed" borderColor="gray.300" textAlign="center">
          <Text fontSize="sm" color="gray.500">
            No published awards found for {month}. Click <strong>Calculate Awards</strong> above to evaluate employee performance and publish winners.
          </Text>
        </Box>
      )}

      {/* Top 3 Performers & Department Winners Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Top 3 Overall */}
        <Card border="1px solid" borderColor="gray.200" shadow="sm" borderRadius="xl">
          <CardBody p={5}>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FiTrendingUp} color="teal.600" />
                <Heading size="sm" color="gray.800">Top 3 Performers (All Departments)</Heading>
              </HStack>
            </Flex>

            {topThree.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text fontSize="sm" color="gray.500">Awaiting published evaluations...</Text>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {topThree.map((award, idx) => (
                  <Flex
                    key={award._id || idx}
                    align="center"
                    justify="space-between"
                    p={3.5}
                    borderRadius="lg"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.100"
                    cursor="pointer"
                    _hover={{ bg: 'teal.50', borderColor: 'teal.200' }}
                    transition="all 0.15s ease"
                    onClick={() => openDetail(award)}
                  >
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={award.employeeId?.fullName || award.employeeId?.username}
                      />
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.900">
                          {award.employeeId?.fullName || award.employeeId?.username || 'Employee'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {award.department} • Performance Score: <strong>{formatScore(award.score)}%</strong>
                        </Text>
                      </Box>
                    </HStack>
                    <RankBadge rank={idx} />
                  </Flex>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Department Winners */}
        <Card border="1px solid" borderColor="gray.200" shadow="sm" borderRadius="xl">
          <CardBody p={5}>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FiAward} color="teal.600" />
                <Heading size="sm" color="gray.800">Department Excellence Winners</Heading>
              </HStack>
              <Badge colorScheme="teal" borderRadius="md" px={2}>
                {visibleDepartmentWinners.length} Depts
              </Badge>
            </Flex>

            {visibleDepartmentWinners.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text fontSize="sm" color="gray.500">No department winners published for this filter.</Text>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {visibleDepartmentWinners.map((award) => (
                  <Flex
                    key={award._id}
                    align="center"
                    justify="space-between"
                    p={3.5}
                    borderRadius="lg"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.100"
                    cursor="pointer"
                    _hover={{ bg: 'teal.50', borderColor: 'teal.200' }}
                    transition="all 0.15s ease"
                    onClick={() => openDetail(award)}
                  >
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={award.employeeId?.fullName || award.employeeId?.username}
                        bg="teal.600"
                        color="white"
                      />
                      <Box>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="sm" color="gray.900">
                            {award.employeeId?.fullName || award.employeeId?.username || 'Employee'}
                          </Text>
                          <Badge colorScheme="purple" fontSize="9px" px={1.5}>
                            {award.department}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          KPI Score: <strong>{formatScore(award.score)}%</strong>
                        </Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme="green" borderRadius="md" px={2} py={0.5} fontSize="xs">
                      Dept Winner
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Performance Details Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedPerf(null);
          setDetailError(null);
          onClose();
        }}
        size="lg"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader pb={2}>
            <HStack spacing={3}>
              <Icon as={FiAward} color="teal.500" />
              <Text fontSize="lg" fontWeight="bold">Performance Evaluation Breakdown</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {detailError && (
              <Box p={3} mb={4} borderRadius="md" bg="red.50" border="1px solid" borderColor="red.200">
                <Text color="red.700" fontSize="sm">{detailError}</Text>
              </Box>
            )}

            {detailLoading ? (
              <Flex justify="center" align="center" py={8}>
                <Spinner color="teal.500" />
              </Flex>
            ) : selectedPerf ? (
              <VStack spacing={4} align="stretch">
                {/* Employee Info Header */}
                <Card bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg">
                  <CardBody p={4}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Avatar
                          size="md"
                          name={selectedPerf.employeeId?.fullName || selectedPerf.employeeId?.username}
                          bg="teal.600"
                          color="white"
                        />
                        <Box>
                          <Text fontWeight="bold" fontSize="md" color="gray.900">
                            {selectedPerf.employeeId?.fullName || selectedPerf.employeeId?.username || 'Employee'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {selectedPerf.employeeId?.email || selectedPerf.employeeId?.jobTitle || selectedPerf.department}
                          </Text>
                        </Box>
                      </HStack>
                      <VStack align="flex-end" spacing={0}>
                        <Badge colorScheme="teal" fontSize="sm" px={2.5} py={1} borderRadius="md">
                          Score: {formatScore(selectedPerf.score)}%
                        </Badge>
                        <Text fontSize="10px" color="gray.400" mt={1}>
                          Month: {selectedPerf.month}
                        </Text>
                      </VStack>
                    </Flex>

                    <Box mt={3}>
                      <Flex justify="space-between" fontSize="xs" color="gray.600" mb={1}>
                        <Text>Evaluation Rating</Text>
                        <Text fontWeight="bold">{formatScore(selectedPerf.score)} / 100</Text>
                      </Flex>
                      <Progress
                        value={selectedPerf.score || 0}
                        colorScheme={selectedPerf.score >= 80 ? 'green' : selectedPerf.score >= 50 ? 'teal' : 'orange'}
                        size="sm"
                        borderRadius="full"
                      />
                    </Box>
                  </CardBody>
                </Card>

                {/* KPI Metrics Grid */}
                <SimpleGrid columns={2} spacing={3}>
                  <Card border="1px solid" borderColor="gray.100" p={3} borderRadius="lg">
                    <Stat size="sm">
                      <StatLabel color="gray.500">Work Target</StatLabel>
                      <StatNumber fontSize="lg" color="gray.800">{selectedPerf.target || 0}</StatNumber>
                      <StatHelpText fontSize="xs">Expected quota for month</StatHelpText>
                    </Stat>
                  </Card>

                  <Card border="1px solid" borderColor="gray.100" p={3} borderRadius="lg">
                    <Stat size="sm">
                      <StatLabel color="gray.500">Actual Achievements</StatLabel>
                      <StatNumber fontSize="lg" color="teal.600">{selectedPerf.actual || 0}</StatNumber>
                      <StatHelpText fontSize="xs">Completed work items</StatHelpText>
                    </Stat>
                  </Card>
                </SimpleGrid>

                {/* Department Specific Details */}
                {selectedPerf.department === 'Sales' && (
                  <Box p={3.5} borderRadius="lg" bg="blue.50" border="1px solid" borderColor="blue.100">
                    <Text fontSize="xs" fontWeight="bold" color="blue.800" mb={2}>Sales Pipeline Breakdown</Text>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="blue.700">Completed Deals:</Text>
                      <Text fontWeight="bold" color="blue.900">{selectedPerf.actualSales || selectedPerf.actual || 0}</Text>
                    </HStack>
                    <HStack justify="space-between" fontSize="sm" mt={1}>
                      <Text color="blue.700">Sales Target:</Text>
                      <Text fontWeight="bold" color="blue.900">{selectedPerf.salesTarget || selectedPerf.target || 10}</Text>
                    </HStack>
                  </Box>
                )}

                {selectedPerf.department === 'IT' && (
                  <Box p={3.5} borderRadius="lg" bg="purple.50" border="1px solid" borderColor="purple.100">
                    <Text fontSize="xs" fontWeight="bold" color="purple.800" mb={2}>IT Tasks & Projects</Text>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="purple.700">Completed IT Tasks:</Text>
                      <Text fontWeight="bold" color="purple.900">{selectedPerf.completedTasks || selectedPerf.actual || 0}</Text>
                    </HStack>
                    <HStack justify="space-between" fontSize="sm" mt={1}>
                      <Text color="purple.700">Assigned Tasks Target:</Text>
                      <Text fontWeight="bold" color="purple.900">{selectedPerf.taskTarget || selectedPerf.target || 5}</Text>
                    </HStack>
                  </Box>
                )}

                {selectedPerf.department === 'SocialMedia' && (
                  <Box p={3.5} borderRadius="lg" bg="pink.50" border="1px solid" borderColor="pink.100">
                    <Text fontSize="xs" fontWeight="bold" color="pink.800" mb={2}>Content Creation & Media</Text>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="pink.700">Published Content Entries:</Text>
                      <Text fontWeight="bold" color="pink.900">{selectedPerf.actualAchievements || selectedPerf.actual || 0}</Text>
                    </HStack>
                    <HStack justify="space-between" fontSize="sm" mt={1}>
                      <Text color="pink.700">Monthly Content Target:</Text>
                      <Text fontWeight="bold" color="pink.900">{selectedPerf.contentTarget || selectedPerf.target || 15}</Text>
                    </HStack>
                  </Box>
                )}

                {/* Attendance & Punctuality */}
                <Box p={3.5} borderRadius="lg" bg="gray.50" border="1px solid" borderColor="gray.200">
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack spacing={2}>
                      <Icon as={FiClock} color="gray.600" />
                      <Text fontSize="xs" fontWeight="bold" color="gray.700">Attendance & Punctuality</Text>
                    </HStack>
                    <Badge colorScheme={selectedPerf.attendanceScore >= 90 ? 'green' : 'orange'}>
                      {selectedPerf.attendanceScore || 100}% Punctuality
                    </Badge>
                  </Flex>
                  <HStack spacing={4} fontSize="xs" color="gray.600">
                    <Text>Late Days: <strong>{selectedPerf.lateDays || 0}</strong></Text>
                    <Text>Absence Days: <strong>{selectedPerf.absenceDays || 0}</strong></Text>
                  </HStack>
                </Box>

                {/* Manual HR Adjustment Note if any */}
                {selectedPerf.isManuallyAdjusted && (
                  <Badge colorScheme="purple" p={2} borderRadius="md" variant="subtle" fontSize="xs">
                    ✍️ Metrics verified / manually adjusted by HR
                  </Badge>
                )}

                {selectedPerf.notes && (
                  <Box p={3} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                    <Text fontSize="xs" fontWeight="bold" color="yellow.800">HR Evaluation Note:</Text>
                    <Text fontSize="xs" color="yellow.900">{selectedPerf.notes}</Text>
                  </Box>
                )}

                <Text fontSize="10px" color="gray.400" textAlign="right">
                  Calculated: {selectedPerf.calculatedAt ? new Date(selectedPerf.calculatedAt).toLocaleString() : 'Live'}
                </Text>
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">No performance details found.</Text>
            )}
          </ModalBody>
          <ModalFooter pt={2}>
            <Button onClick={() => { setSelectedPerf(null); onClose(); }}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AwardsPanel;
