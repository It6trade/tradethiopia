import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiMic,
  FiPhone,
  FiPlus,
  FiUserPlus,
  FiUsers
} from 'react-icons/fi';

const metricCards = [
  { label: 'Total Customers', value: '69', detail: '+8% this month', icon: FiUsers, color: '#3182ce', bg: '#ebf8ff' },
  { label: 'Completed Deals', value: '12', detail: '+20% this month', icon: FiCheckCircle, color: '#22a66a', bg: '#e9fbf1' },
  { label: 'Total Commission', value: 'ETB 14,408.64', detail: '+12% this month', icon: FiDollarSign, color: '#d9901f', bg: '#fff7df' }
];

const followups = [
  { time: '10:00 AM', title: 'Call Alemayehu', detail: 'Regular follow-up', status: 'Callback', color: 'purple', iconColor: '#ef4444' },
  { time: '11:30 AM', title: 'Call Tesfaye', detail: 'Discuss proposal', status: 'Completed', color: 'green', iconColor: '#f59e0b' },
  { time: '02:00 PM', title: 'Follow-up Chamo', detail: 'Product demo', status: 'Pending', color: 'orange', iconColor: '#22c55e' }
];

const quickActions = [
  { label: 'Add Contact', icon: FiUserPlus, color: '#19a56b', bg: '#e7fbf1' },
  { label: 'Schedule Call', icon: FiPhone, color: '#8956dc', bg: '#f2ecff' },
  { label: 'New Follow-up', icon: FiCheckCircle, color: '#3182ce', bg: '#eaf4ff' },
  { label: 'Create Task', icon: FiCalendar, color: '#d9901f', bg: '#fff5dc' }
];

const theme = {
  navy: '#001f4d',
  navyLight: '#062b63',
  gold: '#D99A00',
  goldSoft: '#FFF7DE',
  ink: '#081A34',
  muted: '#6E7890',
  border: '#E8EDF5'
};

const getFirstName = () => {
  const storedName = localStorage.getItem('userName') || localStorage.getItem('name') || 'Amanuel';
  return storedName.split(' ')[0] || storedName;
};

const MobileSalesHome = ({ onNavigate }) => {
  const firstName = getFirstName();

  return (
    <VStack align="stretch" spacing={5}>
      <Flex align="flex-start" justify="space-between">
        <Box>
          <Text fontSize="12px" color={theme.muted} fontWeight="800" mb={1}>
            Good Morning,
          </Text>
          <Text fontSize="24px" color={theme.ink} fontWeight="900" lineHeight="1">
            {firstName}
          </Text>
          <Text fontSize="11px" color={theme.muted} fontWeight="700" mt={4}>
            Here's what's happening with your sales today.
          </Text>
        </Box>
        <HStack spacing={3} align="center">
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<FiBell />}
              variant="ghost"
              color={theme.ink}
              fontSize="20px"
              size="sm"
            />
            <Badge
              position="absolute"
              top="-1px"
              right="-1px"
              bg="#ef4444"
              color="white"
              borderRadius="full"
              fontSize="9px"
              minW="16px"
              h="16px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              3
            </Badge>
          </Box>
          <Avatar name={firstName} size="sm" bg={theme.navy} color="white" />
        </HStack>
      </Flex>

      <Flex
        align="center"
        justify="space-between"
        bg={`linear-gradient(135deg, ${theme.navy} 0%, ${theme.navyLight} 100%)`}
        color="white"
        borderRadius="16px"
        px={4}
        py={4}
        boxShadow="0 14px 32px rgba(0, 31, 77, 0.18)"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" right="-32px" top="-42px" w="132px" h="132px" borderRadius="full" bg="rgba(217,154,0,0.18)" />
        <HStack spacing={3}>
          <Flex w="38px" h="38px" borderRadius="10px" bg="whiteAlpha.200" align="center" justify="center">
            <Icon as={FiCalendar} boxSize={5} />
          </Flex>
          <Box>
            <HStack spacing={2} align="baseline">
              <Text fontSize="27px" fontWeight="900" lineHeight="1">12</Text>
              <Box>
                <Text fontSize="11px" fontWeight="900" lineHeight="1.1">Follow-ups</Text>
                <Text fontSize="10px" fontWeight="700" opacity={0.9}>Today</Text>
              </Box>
            </HStack>
          </Box>
        </HStack>
        <Button
          size="xs"
          rightIcon={<FiChevronRight />}
          bg="whiteAlpha.200"
          color="white"
          _hover={{ bg: 'whiteAlpha.300' }}
          onClick={() => onNavigate('Followup')}
        >
          View schedule
        </Button>
      </Flex>

      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="13px" color={theme.ink} fontWeight="900">Overview</Text>
          <Button variant="link" color={theme.gold} size="xs" onClick={() => onNavigate('Followup')}>See all</Button>
        </Flex>
        <SimpleGrid columns={3} spacing={2}>
          {metricCards.map((item) => (
            <Box key={item.label} bg="white" borderRadius="14px" p={3} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)">
              <Flex w="30px" h="30px" bg={item.label === 'Total Commission' ? theme.goldSoft : item.bg} color={item.label === 'Total Commission' ? theme.gold : item.color} borderRadius="9px" align="center" justify="center" mb={4}>
                <Icon as={item.icon} boxSize={4} />
              </Flex>
              <Text fontSize="9px" color={theme.muted} fontWeight="800" minH="24px">{item.label}</Text>
              <Text fontSize={item.label === 'Total Commission' ? '13px' : '23px'} color={theme.ink} fontWeight="900" lineHeight="1.1" mt={1}>
                {item.value}
              </Text>
              <Text fontSize="8px" color="#16a163" fontWeight="800" mt={1}>{item.detail}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="13px" color={theme.ink} fontWeight="900">Today's Follow-ups</Text>
          <Button variant="link" color={theme.gold} size="xs" onClick={() => onNavigate('Followup')}>View all</Button>
        </Flex>
        <Box bg="white" borderRadius="14px" borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)" overflow="hidden">
          {followups.map((item, index) => (
            <Flex key={item.title} align="center" gap={3} px={3} py={3} borderBottom={index === followups.length - 1 ? 'none' : '1px solid'} borderColor={theme.border}>
              <Text w="52px" fontSize="10px" color={theme.ink} fontWeight="800">{item.time}</Text>
              <Flex w="30px" h="30px" bg={`${item.color}.50`} color={item.iconColor} borderRadius="8px" align="center" justify="center" flexShrink={0}>
                <Icon as={FiPhone} boxSize={4} />
              </Flex>
              <Box minW={0} flex="1">
                <Text fontSize="11px" color={theme.ink} fontWeight="900" noOfLines={1}>{item.title}</Text>
                <Text fontSize="9px" color={theme.muted} fontWeight="700" noOfLines={1}>{item.detail}</Text>
              </Box>
              <Badge colorScheme={item.color} fontSize="8px" px={2} py={1} borderRadius="md">
                {item.status}
              </Badge>
            </Flex>
          ))}
        </Box>
      </Box>

      <Box>
        <Text fontSize="13px" color={theme.ink} fontWeight="900" mb={3}>Quick Actions</Text>
        <SimpleGrid columns={4} spacing={2}>
          {quickActions.map((item) => (
            <Box key={item.label} bg="white" borderRadius="14px" p={3} textAlign="center" borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)">
              <Flex w="32px" h="32px" mx="auto" bg={item.bg} color={item.color} borderRadius="8px" align="center" justify="center" mb={2}>
                <Icon as={item.icon} boxSize={4} />
              </Flex>
              <Text fontSize="8px" color={theme.ink} fontWeight="900" lineHeight="1.1">{item.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Flex bg="white" borderWidth="1px" borderColor={theme.border} borderRadius="14px" p={3} gap={3} align="center" boxShadow="0 10px 26px rgba(8, 26, 52, 0.05)">
        <Flex w="42px" h="42px" bg={theme.goldSoft} color={theme.gold} borderRadius="10px" align="center" justify="center" flexShrink={0}>
          <Icon as={FiMic} boxSize={6} />
        </Flex>
        <Box minW={0} flex="1">
          <Text fontSize="12px" color={theme.ink} fontWeight="900">AI Sales Assistant</Text>
          <Text fontSize="9px" color={theme.muted} fontWeight="700" noOfLines={2}>
            Ask anything about your leads, follow-ups, and get instant insights.
          </Text>
        </Box>
        <Button size="xs" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }}>
          Ask AI
        </Button>
      </Flex>
    </VStack>
  );
};

export default MobileSalesHome;
