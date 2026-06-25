import React from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  VStack,
  Flex,
  Progress,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button
} from '@chakra-ui/react';

const ReportTab = ({
  cardBg,
  borderColor,
  sectionTextColor,
  revenueReportRows,
  currencyFormatter,
  socialTargets,
  cardTextColor,
  positiveTextColor,
  warningTextColor,
  socialForm,
  setSocialForm,
  handleUpdateSocial,
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  monthNames,
  today,
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
      <Heading size="lg" mb={6}>Report</Heading>
      <Text color={sectionTextColor} mb={6}>
        Revenue snapshot plus social media follower tracking against monthly targets.
      </Text>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4}>
          <Text fontWeight="semibold" mb={3}>Revenue vs target</Text>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Metric</Th>
                <Th>Target</Th>
                <Th>Actual</Th>
                <Th>Delta</Th>
              </Tr>
            </Thead>
            <Tbody>
              {revenueReportRows.map((row) => {
                const diff = row.actual - row.target;
                const pct = row.target ? (diff / row.target) * 100 : 0;
                const isPositive = diff >= 0;
                return (
                  <Tr key={row.metric}>
                    <Td>{row.metric}</Td>
                    <Td>{currencyFormatter.format(row.target)}</Td>
                    <Td>{currencyFormatter.format(row.actual)}</Td>
                    <Td>
                      <Tag colorScheme={isPositive ? 'green' : 'orange'} variant="subtle">
                        {`${isPositive ? '+' : ''}${pct.toFixed(1)}%`}
                      </Tag>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4}>
          <Text fontWeight="semibold" mb={3}>Social media followers</Text>
          <VStack spacing={3} align="stretch">
            {socialTargets.map((item) => {
              const progress = item.target ? (item.actual / item.target) * 100 : 0;
              const deltaPct = item.target ? ((item.actual - item.target) / item.target) * 100 : 0;
              const hit = item.actual >= item.target;
              return (
                <Box key={item.platform} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3} bg={cardBg} color={cardTextColor}>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text fontWeight="semibold">{item.platform}</Text>
                    <Tag size="sm" colorScheme={hit ? 'green' : 'orange'} variant="subtle">
                      {hit ? 'On track' : 'Behind target'}
                    </Tag>
                  </Flex>
                  <Flex justify="space-between" fontSize="sm" color={sectionTextColor} mb={1}>
                    <Text>Actual: {item.actual.toLocaleString()}/mo</Text>
                    <Text>Target: {item.target.toLocaleString()}/mo</Text>
                  </Flex>
                  <Progress
                    value={Math.min(progress, 140)}
                    size="sm"
                    colorScheme={hit ? 'green' : 'blue'}
                    borderRadius="full"
                  />
                  <Text fontSize="xs" color={deltaPct >= 0 ? positiveTextColor : warningTextColor} mt={1}>
                    {deltaPct >= 0 ? '+' : ''}
                    {deltaPct.toFixed(1)}% vs target
                  </Text>
                </Box>
              );
            })}
          </VStack>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3} mt={4} color={cardTextColor}>
            <Text fontWeight="semibold" mb={2}>Update social actuals</Text>
            <VStack spacing={2.5} align="stretch">
              <FormControl size="sm">
                <FormLabel fontSize="sm">Platform</FormLabel>
                <Select
                  size="sm"
                  value={socialForm.platform}
                  onChange={(e) => {
                    const platform = e.target.value;
                    const currentTarget =
                      socialTargets.find((item) => item.platform === platform)?.target || '';
                    setSocialForm((p) => ({ ...p, platform, target: currentTarget }));
                  }}
                >
                  {socialTargets.map((item) => (
                    <option key={item.platform} value={item.platform}>{item.platform}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="sm">Target followers / mo</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={socialForm.target}
                  onChange={(e) => setSocialForm((p) => ({ ...p, target: e.target.value }))}
                  placeholder="Enter target"
                />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="sm">Actual followers / mo</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={socialForm.actual}
                  onChange={(e) => setSocialForm((p) => ({ ...p, actual: e.target.value }))}
                  placeholder="Enter actual"
                />
              </FormControl>
              <Button colorScheme="purple" size="sm" onClick={handleUpdateSocial} isDisabled={!socialForm.actual}>
                Save social actual
              </Button>
              <Text fontSize="xs" color={mutedTextColor}>
                Updates the dashboard locally; connect to your API to persist.
              </Text>
            </VStack>
          </Box>
        </Box>
      </Grid>
      <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4} mt={6}>
        <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={3}>
          <Box>
            <Heading size="md">Monthly social media</Heading>
            <Text fontSize="sm" color={sectionTextColor}>Filter by month and year; defaults to today.</Text>
          </Box>
          <Tag colorScheme="purple" variant="subtle">
            {monthFilter === 'All' ? 'All months' : monthFilter} {yearFilter}
          </Tag>
        </Flex>
        <Flex gap={3} wrap="wrap" mb={3}>
          <FormControl maxW="200px" size="sm">
            <FormLabel fontSize="sm">Month</FormLabel>
            <Select
              size="sm"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="All">All</option>
              {monthNames.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl maxW="160px" size="sm">
            <FormLabel fontSize="sm">Year</FormLabel>
            <Select
              size="sm"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              {[today.getFullYear(), today.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </FormControl>
        </Flex>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Month</Th>
              <Th>Year</Th>
              <Th>Platform</Th>
              <Th>Target</Th>
              <Th>Actual</Th>
              <Th>Delta</Th>
            </Tr>
          </Thead>
          <Tbody>
            {socialTargets.flatMap((platform) => {
              const monthsToShow = monthFilter === 'All' ? monthNames : [monthFilter];
              return monthsToShow.map((month) => {
                const base = platform.target;
                const actual = platform.actual;
                const pct = base ? ((actual - base) / base) * 100 : 0;
                const positive = actual >= base;
                return (
                  <Tr key={`${platform.platform}-${month}-${yearFilter}`}>
                    <Td fontWeight="semibold">{month}</Td>
                    <Td>{yearFilter}</Td>
                    <Td>{platform.platform}</Td>
                    <Td>{base.toLocaleString()}</Td>
                    <Td>{actual.toLocaleString()}</Td>
                    <Td>
                      <Tag colorScheme={positive ? 'green' : 'orange'} variant="subtle">
                        {`${positive ? '+' : ''}${pct.toFixed(1)}%`}
                      </Tag>
                    </Td>
                  </Tr>
                );
              });
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default ReportTab;
