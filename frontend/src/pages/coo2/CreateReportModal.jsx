// src/pages/coo2/CreateReportModal.jsx
import React, { useState } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  CheckboxGroup,
  Checkbox,
  VStack,
  HStack,
  Text,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiFileText, FiDownload, FiCheck } from 'react-icons/fi';
import { DEPARTMENTS } from './cooData';

const CreateReportModal = ({ isOpen, onClose, defaultDept = 'all' }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(defaultDept);
  const [reportType, setReportType] = useState('Executive Summary');
  const [timeframe, setTimeframe] = useState('This Month (May 2024)');
  const [includeAI, setIncludeAI] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Report Generated Successfully',
        description: `Your ${reportType} for ${department.toUpperCase()} has been prepared and queued for download.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(15, 23, 42, 0.6)" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="18px" boxShadow="0 20px 40px rgba(0,0,0,0.2)" border="1px solid #e2e8f0">
        <ModalHeader borderBottom="1px solid #f1f5f9" pb={3}>
          <HStack spacing={2}>
            <Icon as={FiFileText} color="#2563eb" boxSize="20px" />
            <Text fontSize="17px" fontWeight="700" color="#0f172a">
              Create Executive Report
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <form onSubmit={handleSubmit}>
          <ModalBody py={5}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="12.5px" fontWeight="600" color="#334155">
                  Report Title
                </FormLabel>
                <Input
                  placeholder="e.g. Q2 Operational & Revenue Benchmark"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderRadius="10px"
                  fontSize="13px"
                  bg="#f8fafc"
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="12.5px" fontWeight="600" color="#334155">
                    Target Department
                  </FormLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    borderRadius="10px"
                    fontSize="13px"
                    bg="#f8fafc"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="12.5px" fontWeight="600" color="#334155">
                    Report Type
                  </FormLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    borderRadius="10px"
                    fontSize="13px"
                    bg="#f8fafc"
                  >
                    <option value="Executive Summary">Executive Summary</option>
                    <option value="Revenue & Financial Audit">Revenue & Financial Audit</option>
                    <option value="Operational KPI Scorecard">Operational KPI Scorecard</option>
                    <option value="AI & Workforce Productivity">AI & Workforce Productivity</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="12.5px" fontWeight="600" color="#334155">
                  Reporting Period
                </FormLabel>
                <Select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  borderRadius="10px"
                  fontSize="13px"
                  bg="#f8fafc"
                >
                  <option value="Today">Today (Live)</option>
                  <option value="This Week (May 12 - May 18)">This Week (May 12 - May 18)</option>
                  <option value="This Month (May 2024)">This Month (May 2024)</option>
                  <option value="Q2 2024">Q2 2024</option>
                  <option value="Year to Date">Year to Date</option>
                </Select>
              </FormControl>

              <Box p={3} borderRadius="10px" bg="#eff6ff" border="1px solid #bfdbfe">
                <Checkbox
                  isChecked={includeAI}
                  onChange={(e) => setIncludeAI(e.target.checked)}
                  colorScheme="blue"
                >
                  <Text fontSize="12.5px" fontWeight="600" color="#1d4ed8">
                    Include AI Insights & Predictive Growth Forecast
                  </Text>
                </Checkbox>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid #f1f5f9" pt={3}>
            <Button variant="ghost" mr={3} onClick={onClose} size="sm" borderRadius="8px">
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              size="sm"
              borderRadius="8px"
              isLoading={isSubmitting}
              loadingText="Generating..."
              leftIcon={<FiDownload size={14} />}
            >
              Generate & Download
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateReportModal;
