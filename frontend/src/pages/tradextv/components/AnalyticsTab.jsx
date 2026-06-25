import React from 'react';
import {
  Box,
  Heading,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text
} from '@chakra-ui/react';

const AnalyticsTab = ({
  cardBg,
  borderColor,
  cardTextColor,
  sectionTextColor,
  projectMetrics,
  positiveTextColor,
  accentIconColor,
  warningTextColor,
  placeholderBg,
  mutedTextColor
}) => {
  return (
    <Box 
      bg={cardBg}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
      mb={8}
    >
      <Heading size="lg" mb={6}>Analytics Dashboard</Heading>
      <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
          <Stat>
            <StatLabel color={sectionTextColor}>Projects (Total)</StatLabel>
            <StatNumber>{projectMetrics.total}</StatNumber>
          </Stat>
        </Box>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
          <Stat>
            <StatLabel color={sectionTextColor}>Completed</StatLabel>
            <StatNumber color={positiveTextColor}>{projectMetrics.completed}</StatNumber>
            <StatHelpText>{projectMetrics.completionRate}% done</StatHelpText>
          </Stat>
        </Box>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
          <Stat>
            <StatLabel color={sectionTextColor}>In Progress</StatLabel>
            <StatNumber color={accentIconColor}>{projectMetrics.inProgress}</StatNumber>
          </Stat>
        </Box>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} color={cardTextColor}>
          <Stat>
            <StatLabel color={sectionTextColor}>In Review</StatLabel>
            <StatNumber color={warningTextColor}>{projectMetrics.review}</StatNumber>
          </Stat>
        </Box>
      </Grid>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <Box 
          bg={cardBg}
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          color={cardTextColor}
        >
          <Text fontWeight="medium" mb={4}>Ticket Volume</Text>
          <Box bg={placeholderBg} h="300px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
            <Text color={mutedTextColor}>Ticket volume chart will be displayed here</Text>
          </Box>
        </Box>
        <Box 
          bg={cardBg}
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          color={cardTextColor}
        >
          <Text fontWeight="medium" mb={4}>Response Times</Text>
          <Box bg={placeholderBg} h="300px" borderRadius="md" p={4} display="flex" alignItems="center" justifyContent="center">
            <Text color={mutedTextColor}>Response time metrics will be displayed here</Text>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default AnalyticsTab;
