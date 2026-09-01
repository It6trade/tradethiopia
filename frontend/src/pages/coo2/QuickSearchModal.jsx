// src/pages/coo2/QuickSearchModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Box,
  Kbd,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiTrendingUp,
  FiFileText,
  FiCpu,
  FiUsers,
  FiArrowRight,
} from 'react-icons/fi';
import { RiBuilding4Line } from 'react-icons/ri';
import { DEPARTMENTS } from './cooData';

const QuickSearchModal = ({
  isOpen,
  onClose,
  onSelectDepartment,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');

  const searchableItems = [
    ...DEPARTMENTS.map((d) => ({
      id: d.id,
      title: `${d.name} Department`,
      subtitle: `Division overview, KPIs, and activities`,
      type: 'department',
      icon: RiBuilding4Line,
      color: d.color,
      badge: d.badge,
    })),
    {
      id: 'analytics',
      title: 'Executive Analytics Hub',
      subtitle: 'Comparative metrics and corporate benchmarks',
      type: 'tab',
      icon: FiTrendingUp,
      color: '#8b5cf6',
      badge: 'Analytics',
    },
    {
      id: 'reports',
      title: 'Operational Reports & Downloads',
      subtitle: 'PDF digests and compliance audits',
      type: 'tab',
      icon: FiFileText,
      color: '#3b82f6',
      badge: 'Reports',
    },
    {
      id: 'agents',
      title: 'Autonomous AI Operational Bots',
      subtitle: 'Sales, Tessbin, and Finance automation workers',
      type: 'tab',
      icon: FiCpu,
      color: '#10b981',
      badge: 'AI Agents',
    },
  ];

  const filtered = searchableItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    if (item.type === 'department') {
      onSelectDepartment(item.id);
      onSelectTab('departments');
    } else {
      onSelectTab(item.id);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(15, 23, 42, 0.6)" backdropFilter="blur(4px)" />
      <ModalContent
        borderRadius="18px"
        overflow="hidden"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.3)"
        border="1px solid #e2e8f0"
        p={0}
      >
        <Box p={3.5} borderBottom="1px solid #f1f5f9" bg="#ffffff">
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="#3b82f6" boxSize="18px" />
            </InputLeftElement>
            <Input
              autoFocus
              placeholder="Type a command or search departments, metrics, reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="unstyled"
              fontSize="14px"
              pl={10}
              color="#0f172a"
            />
            <Kbd fontSize="11px" color="#94a3b8" alignSelf="center">
              ESC
            </Kbd>
          </InputGroup>
        </Box>

        <ModalBody p={2} maxH="380px" overflowY="auto" bg="#f8fafc">
          <VStack align="stretch" spacing={1}>
            {filtered.length === 0 ? (
              <Box py={8} textAlign="center">
                <Text fontSize="13px" color="#94a3b8">
                  No matching results found for "{query}"
                </Text>
              </Box>
            ) : (
              filtered.map((item, idx) => (
                <Flex
                  key={idx}
                  align="center"
                  justify="space-between"
                  p={2.5}
                  borderRadius="10px"
                  cursor="pointer"
                  _hover={{ bg: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                  onClick={() => handleSelect(item)}
                  transition="all 0.15s ease"
                >
                  <HStack spacing={3}>
                    <Flex
                      w="32px"
                      h="32px"
                      borderRadius="8px"
                      bg={item.color ? `${item.color}15` : 'rgba(59,130,246,0.1)'}
                      color={item.color || '#3b82f6'}
                      align="center"
                      justify="center"
                    >
                      <Icon as={item.icon} boxSize="16px" />
                    </Flex>
                    <Box>
                      <Text fontSize="13px" fontWeight="600" color="#0f172a">
                        {item.title}
                      </Text>
                      <Text fontSize="11px" color="#64748b">
                        {item.subtitle}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={2}>
                    <Badge fontSize="10px" borderRadius="6px" px={2} py={0.5}>
                      {item.badge}
                    </Badge>
                    <Icon as={FiArrowRight} color="#cbd5e1" boxSize="14px" />
                  </HStack>
                </Flex>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QuickSearchModal;
