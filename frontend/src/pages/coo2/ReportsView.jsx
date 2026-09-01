// src/pages/coo2/ReportsView.jsx
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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiShare2,
  FiSearch,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { REPORTS_DATA } from './cooData';

const ReportsView = ({ onCreateReportModalOpen }) => {
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState(REPORTS_DATA);
  const toast = useToast();

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (report) => {
    toast({
      title: `Downloading ${report.title}`,
      description: 'Report PDF is being packaged and downloaded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <HStack spacing={2.5}>
            <Text fontSize="22px" fontWeight="800" color="#0f172a" letterSpacing="-0.02em">
              Executive Operational Reports
            </Text>
            <Badge colorScheme="blue" fontSize="11px" borderRadius="6px" px={2} py={0.5}>
              5 Ready for Download
            </Badge>
          </HStack>
          <Text fontSize="13.5px" color="#64748b">
            Generate, download, and schedule executive briefs across all 10 corporate departments.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            size="sm"
            bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
            color="#ffffff"
            borderRadius="10px"
            fontSize="12.5px"
            fontWeight="600"
            leftIcon={<FiPlus size={15} />}
            onClick={onCreateReportModalOpen}
            boxShadow="0 2px 8px rgba(37, 99, 235, 0.25)"
            _hover={{ bg: '#1d4ed8' }}
          >
            Generate New Report
          </Button>
        </HStack>
      </Flex>

      {/* Quick Summary Cards */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6}>
        <Box bg="#ffffff" p={4} borderRadius="14px" border="1px solid #e2e8f0">
          <HStack spacing={2.5} mb={1}>
            <Icon as={FiFileText} color="#2563eb" boxSize="16px" />
            <Text fontSize="12.5px" fontWeight="600" color="#64748b">
              Total Reports Generated
            </Text>
          </HStack>
          <Text fontSize="22px" fontWeight="800" color="#0f172a">
            48 Reports
          </Text>
          <Text fontSize="11.5px" color="#10b981" fontWeight="600">
            +12 this month
          </Text>
        </Box>

        <Box bg="#ffffff" p={4} borderRadius="14px" border="1px solid #e2e8f0">
          <HStack spacing={2.5} mb={1}>
            <Icon as={FiCalendar} color="#10b981" boxSize="16px" />
            <Text fontSize="12.5px" fontWeight="600" color="#64748b">
              Scheduled Recurrences
            </Text>
          </HStack>
          <Text fontSize="22px" fontWeight="800" color="#0f172a">
            10 Automated
          </Text>
          <Text fontSize="11.5px" color="#64748b">
            Weekly Monday 08:00 AM
          </Text>
        </Box>

        <Box bg="#ffffff" p={4} borderRadius="14px" border="1px solid #e2e8f0">
          <HStack spacing={2.5} mb={1}>
            <Icon as={FiCheckCircle} color="#8b5cf6" boxSize="16px" />
            <Text fontSize="12.5px" fontWeight="600" color="#64748b">
              Compliance Audit Rate
            </Text>
          </HStack>
          <Text fontSize="22px" fontWeight="800" color="#0f172a">
            100% Verified
          </Text>
          <Text fontSize="11.5px" color="#8b5cf6" fontWeight="600">
            Certified by Supervisor
          </Text>
        </Box>
      </SimpleGrid>

      {/* Reports Table Card */}
      <Box
        bg="#ffffff"
        p={5}
        borderRadius="16px"
        border="1px solid #e2e8f0"
        boxShadow="0 2px 6px rgba(0,0,0,0.02)"
      >
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
          <Text fontSize="15px" fontWeight="700" color="#0f172a">
            Available Operational Reports
          </Text>

          <InputGroup size="sm" maxW="280px">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="#94a3b8" boxSize="14px" />
            </InputLeftElement>
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              borderRadius="10px"
              bg="#f8fafc"
              fontSize="12.5px"
            />
          </InputGroup>
        </Flex>

        <Box overflowX="auto">
          <Table variant="unstyled" size="sm">
            <Thead>
              <Tr borderBottom="1px solid #f1f5f9">
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600" pl={0}>
                  Report Title
                </Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">
                  Department
                </Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">
                  Frequency
                </Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">
                  Generated Date
                </Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600">
                  Status
                </Th>
                <Th color="#94a3b8" fontSize="11px" textTransform="none" fontWeight="600" pr={0} textAlign="right">
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredReports.map((report) => (
                <Tr
                  key={report.id}
                  borderBottom="1px solid #f8fafc"
                  _hover={{ bg: '#f8fafc' }}
                  transition="background 0.15s ease"
                >
                  <Td pl={0} py={3.5}>
                    <HStack spacing={2.5}>
                      <Flex
                        w="28px"
                        h="28px"
                        borderRadius="8px"
                        bg="rgba(37, 99, 235, 0.1)"
                        color="#2563eb"
                        align="center"
                        justify="center"
                      >
                        <Icon as={FiFileText} boxSize="14px" />
                      </Flex>
                      <Box>
                        <Text fontSize="13px" fontWeight="600" color="#0f172a">
                          {report.title}
                        </Text>
                        <Text fontSize="11px" color="#94a3b8">
                          {report.size} • By {report.author}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>

                  <Td py={3.5}>
                    <Badge colorScheme="blue" fontSize="10px" borderRadius="6px" px={2} py={0.5}>
                      {report.department}
                    </Badge>
                  </Td>

                  <Td py={3.5}>
                    <Text fontSize="12px" color="#64748b">
                      {report.frequency}
                    </Text>
                  </Td>

                  <Td py={3.5}>
                    <Text fontSize="12px" color="#64748b">
                      {report.generatedDate}
                    </Text>
                  </Td>

                  <Td py={3.5}>
                    <Badge
                      fontSize="10px"
                      fontWeight="700"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bg="#dcfce7"
                      color="#15803d"
                    >
                      {report.status}
                    </Badge>
                  </Td>

                  <Td pr={0} py={3.5} textAlign="right">
                    <HStack spacing={1} justify="flex-end">
                      <Button
                        size="xs"
                        variant="ghost"
                        color="#2563eb"
                        leftIcon={<FiDownload size={12} />}
                        onClick={() => handleDownload(report)}
                      >
                        PDF
                      </Button>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        icon={<FiPrinter size={13} />}
                        aria-label="Print"
                        color="#64748b"
                        onClick={() => window.print()}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default ReportsView;
