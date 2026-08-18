import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { getAwardsByMonth, getPerformanceDetail } from '../services/awardService';

const rankInfo = [
  { label: 'Gold', emoji: '🥇', color: 'yellow' },
  { label: 'Silver', emoji: '🥈', color: 'gray' },
  { label: 'Bronze', emoji: '🥉', color: 'orange' },
];

const knownDepartments = ['TradeXTV', 'IT', 'SocialMedia', 'Sales', 'CustomerSuccess', 'Tessbin'];

const RankBadge = ({ rank }) => {
  if (typeof rank !== 'number' || rank < 0 || rank >= rankInfo.length) {
    return null;
  }
  const info = rankInfo[rank];
  return (
    <Badge colorScheme={info.color} px={2} borderRadius="md">
      {info.emoji} {info.label}
    </Badge>
  );
};

const formatScore = (score) => {
  if (typeof score === 'number') return score.toFixed(2);
  if (score == null) return 'N/A';
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
      const resp = await getPerformanceDetail(month, award.employeeId?._id || award.employeeId);
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
    return <Text>Select a month to view awards.</Text>;
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" py={8}>
        <Spinner />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box borderRadius="lg" p={4} bg="red.50">
        <Text color="red.600">{error}</Text>
      </Box>
    );
  }

  return (
    <Box borderRadius="lg" p={5} bg="white" boxShadow="md">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={4}
        mb={4}
      >
        <Heading size="md">Monthly Awards • {month}</Heading>
        <HStack spacing={3} width={{ base: 'full', md: 'auto' }}>
          <Select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            maxW="220px"
          >
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Departments' : option}
              </option>
            ))}
          </Select>
        </HStack>
      </Flex>

      {overallWinner ? (
        <Box
          borderRadius="lg"
          borderWidth={1}
          borderColor="yellow.200"
          bg="yellow.50"
          p={4}
          mb={4}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontWeight="bold">Overall Company Winner</Text>
              <Text fontSize="lg" fontWeight="semibold">
                {overallWinner.employeeId?.fullName || overallWinner.employeeId?.username}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {overallWinner.department} • Score {formatScore(overallWinner.score)}
              </Text>
            </Box>
            <RankBadge rank={0} />
          </Flex>
        </Box>
      ) : (
        <Box borderRadius="md" p={3} mb={4} bg="gray.50">
          <Text>No overall winner published yet.</Text>
        </Box>
      )}

      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="bold">Top 3 Overall</Text>
          {topThree.length === 0 && <Text fontSize="sm">Awaiting published awards...</Text>}
        </Flex>
        <VStack spacing={3} align="stretch">
          {topThree.map((award, idx) => (
            <Flex
              key={award._id || award.employeeId?._id}
              align="center"
              justify="space-between"
              p={3}
              borderRadius="md"
              bg="gray.50"
              cursor="pointer"
              onClick={() => openDetail(award)}
            >
              <Box>
                <Text fontWeight="semibold">
                  {award.employeeId?.fullName || award.employeeId?.username}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {award.department} • Score {formatScore(award.score)}
                </Text>
              </Box>
              <RankBadge rank={idx} />
            </Flex>
          ))}
          {topThree.length === 0 && (
            <Box p={3} borderRadius="md" bg="gray.10" textAlign="center">
              <Text fontSize="sm">Top performers will appear once awards are published.</Text>
            </Box>
          )}
        </VStack>
      </Box>

      <Divider />

      <Box mt={4}>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="bold">Department Winners</Text>
          <Badge colorScheme="green">🥇 Dept Winner</Badge>
        </Flex>
        {visibleDepartmentWinners.length === 0 ? (
          <Box p={4} borderRadius="md" bg="gray.50">
            <Text fontSize="sm">
              No winners published for the selected department yet.
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {visibleDepartmentWinners.map((award) => (
              <Box
                key={award._id}
                p={3}
                borderRadius="md"
                bg="gray.25"
                cursor="pointer"
                onClick={() => openDetail(award)}
              >
                <Flex justify="space-between">
                  <Box>
                    <Text fontWeight="semibold">{award.department}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {award.employeeId?.fullName || award.employeeId?.username} •
                      Score {formatScore(award.score)}
                    </Text>
                  </Box>
                  <Badge colorScheme="teal">Dept Winner</Badge>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedPerf(null);
          setDetailError(null);
          onClose();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Performance Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {detailError && (
              <Text color="red.500" mb={3}>
                {detailError}
              </Text>
            )}
            {detailLoading ? (
              <Flex justify="center" py={4}>
                <Spinner />
              </Flex>
            ) : selectedPerf ? (
              <VStack align="start" spacing={3}>
                <Text>
                  <strong>Employee:</strong> {selectedPerf.employeeId?.fullName || selectedPerf.employeeId?.username}
                </Text>
                <Text>
                  <strong>Department:</strong> {selectedPerf.department}
                </Text>
                <Text>
                  <strong>Month:</strong> {selectedPerf.month}
                </Text>
                <Text>
                  <strong>Score:</strong> {formatScore(selectedPerf.score)}
                </Text>
                <Text>
                  <strong>Target:</strong> {selectedPerf.target}
                </Text>
                <Text>
                  <strong>Actual:</strong> {selectedPerf.actual}
                </Text>
                <Text>
                  <strong>Sales Target:</strong> {selectedPerf.salesTarget}
                </Text>
                <Text>
                  <strong>Actual Sales:</strong> {selectedPerf.actualSales}
                </Text>
                <Text>
                  <strong>Task Target:</strong> {selectedPerf.taskTarget}
                </Text>
                <Text>
                  <strong>Completed Tasks:</strong> {selectedPerf.completedTasks}
                </Text>
                <Text>
                  <strong>Content Target:</strong> {selectedPerf.contentTarget}
                </Text>
                <Text>
                  <strong>Actual Achievements:</strong> {selectedPerf.actualAchievements}
                </Text>
                <Text>
                  <strong>Target Service Time:</strong> {selectedPerf.targetServiceTime}
                </Text>
                <Text>
                  <strong>Actual Service Time:</strong> {selectedPerf.actualServiceTime}
                </Text>
                <Text>
                  <strong>Calculated At:</strong>{' '}
                  {selectedPerf.calculatedAt ? new Date(selectedPerf.calculatedAt).toLocaleString() : 'Pending'}
                </Text>
              </VStack>
            ) : (
              <Text>No performance details available.</Text>
            )}
          </ModalBody>
          <ModalFooter>
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
