import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Grid,
  GridItem,
  Stat,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Icon,
  HStack
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';
import NotificationsPanel from '../../../components/NotificationsPanel';

const OverviewTab = ({
  stats,
  cardBg,
  borderColor,
  accentIconColor,
  mutedTextColor,
  warningTextColor,
  placeholderBg,
  cardTextColor,
  onOpenNewCustomer,
  getIcon
}) => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" mb={1}>TradexTV Dashboard</Heading>
          <Text color={mutedTextColor}>Welcome back! Here's what's happening with your customer support.</Text>
        </Box>
        <HStack spacing={3}>
          <NotificationsPanel
            buttonProps={{
              colorScheme: 'purple',
              variant: 'outline',
              size: 'sm',
            }}
            buttonLabel="Notifications"
          />
          <Button colorScheme="purple" onClick={onOpenNewCustomer}>
            New customer
          </Button>
        </HStack>
      </Flex>

      {/* Stats Grid */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        {stats.map((stat) => (
          <GridItem key={stat.id}>
            <Box 
              bg={cardBg}
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Flex align="center" mb={3}>
                <Icon as={getIcon(stat.icon)} w={6} h={6} color={accentIconColor} mr={3} />
                <Text fontSize="sm" color={mutedTextColor}>{stat.label}</Text>
              </Flex>
              <Flex align="flex-end" justify="space-between">
                <Stat>
                  <StatNumber fontSize="2xl" fontWeight="bold">{stat.value}</StatNumber>
                  <StatHelpText mb={0}>
                    <StatArrow type={stat.isUp ? 'increase' : 'decrease'} />
                    {stat.change}% from last week
                  </StatHelpText>
                </Stat>
              </Flex>
            </Box>
          </GridItem>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
        <Box 
          bg={cardBg}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="sm" mb={4} display="flex" alignItems="center">
            <Icon as={FiAlertCircle} mr={2} color={warningTextColor} />
            Quick Actions
          </Heading>
          <Button colorScheme="blue" size="sm" w="full" mb={2}>
            Create Knowledge Base Article
          </Button>
          <Button colorScheme="green" size="sm" w="full" mb={2}>
            Generate Report
          </Button>
          <Button colorScheme="purple" size="sm" w="full">
            View Analytics
          </Button>
        </Box>
        
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Box 
            bg={cardBg}
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            h="100%"
            color={cardTextColor}
          >
            <Heading size="sm" mb={4}>Performance Overview</Heading>
            <Text color={mutedTextColor} mb={4}>
              Track your team's performance and response times to improve customer satisfaction.
            </Text>
            <Box bg={placeholderBg} h="200px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
              <Text color={mutedTextColor}>Performance metrics chart will be displayed here</Text>
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default OverviewTab;
