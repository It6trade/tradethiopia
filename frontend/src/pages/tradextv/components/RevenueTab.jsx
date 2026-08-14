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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button
} from '@chakra-ui/react';

const RevenueTab = ({
  cardBg,
  borderColor,
  sectionTextColor,
  revenueReportRows,
  currencyFormatter,
  revenueSummaryCards,
  cardTextColor,
  negativeTextColor,
  positiveTextColor,
  warningTextColor,
  accentIconColor,
  actualForm,
  setActualForm,
  handleUpdateActual,
  departmentKpis,
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
      <Heading size="lg" mb={2}>Revenue</Heading>
      <Text color={sectionTextColor} mb={6}>
        Targets and actuals at a glance, including current-month pacing.
      </Text>
      <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={6}>
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
        <VStack spacing={4} align="stretch">
          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
            {revenueSummaryCards.map((item) => (
              <Box
                key={item.label}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                bg={cardBg}
                p={4}
                boxShadow="sm"
                color={cardTextColor}
              >
                <Stat>
                  <StatLabel color={sectionTextColor}>{item.label}</StatLabel>
                  <StatNumber fontSize="2xl">
                    {item.isCurrency ? currencyFormatter.format(item.value) : item.value}
                  </StatNumber>
                  <StatHelpText color={item.change.startsWith('-') ? negativeTextColor : positiveTextColor}>
                    {item.change}
                  </StatHelpText>
                </Stat>
              </Box>
            ))}
          </Grid>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={4} color={cardTextColor}>
            <Text fontWeight="semibold" mb={2}>Pacing to target</Text>
            <Text fontSize="sm" color={sectionTextColor} mb={2}>MTD revenue vs monthly plan</Text>
            {(() => {
              const target = revenueReportRows[0]?.target || 0;
              const actual = revenueReportRows[0]?.actual || 0;
              const progress = target ? (actual / target) * 100 : 0;
              const deltaPct = target ? ((actual - target) / target) * 100 : 0;
              const hit = actual >= target;
              return (
                <>
                  <Progress
                    value={Math.min(progress, 160)}
                    size="sm"
                    colorScheme={hit ? 'green' : 'purple'}
                    borderRadius="full"
                    mb={1.5}
                  />
                  <Flex justify="space-between" fontSize="sm" color={sectionTextColor}>
                    <Text>{currencyFormatter.format(actual)} actual</Text>
                    <Text>{currencyFormatter.format(target)} target</Text>
                  </Flex>
                  <Text fontSize="xs" color={deltaPct >= 0 ? positiveTextColor : warningTextColor} mt={1}>
                    {deltaPct >= 0 ? '+' : ''}
                    {deltaPct.toFixed(1)}% vs target
                  </Text>
                </>
              );
            })()}
          </Box>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={4} color={cardTextColor}>
            <Text fontWeight="semibold" mb={3}>Update actuals</Text>
            <VStack spacing={3} align="stretch">
              <FormControl size="sm">
                <FormLabel fontSize="sm">Metric</FormLabel>
                <Select
                  size="sm"
                  value={actualForm.metric}
                  onChange={(e) => {
                    const metric = e.target.value;
                    const currentTarget =
                      revenueReportRows.find((row) => row.metric === metric)?.target || '';
                    setActualForm((p) => ({ ...p, metric, target: currentTarget }));
                  }}
                >
                  {revenueReportRows.map((row) => (
                    <option key={row.metric} value={row.metric}>{row.metric}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="sm">Target amount</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={actualForm.target}
                  onChange={(e) => setActualForm((p) => ({ ...p, target: e.target.value }))}
                  placeholder="Enter target"
                />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="sm">Actual amount</FormLabel>
                <Input
                  size="sm"
                  type="number"
                  value={actualForm.actual}
                  onChange={(e) => setActualForm((p) => ({ ...p, actual: e.target.value }))}
                  placeholder="Enter actual"
                />
              </FormControl>
              <Button colorScheme="purple" size="sm" onClick={handleUpdateActual} isDisabled={!actualForm.actual}>
                Save actual
              </Button>
              <Text fontSize="xs" color={mutedTextColor}>
                Updates the dashboard locally; connect to your API to persist.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Grid>
      <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} p={4} mt={6}>
        <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={3}>
          <Heading size="md">Department KPIs</Heading>
          <Tag colorScheme="purple" variant="subtle">Monthly view</Tag>
        </Flex>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Department</Th>
              <Th>Revenue</Th>
              <Th>Attainment</Th>
              <Th>Followers</Th>
            </Tr>
          </Thead>
          <Tbody>
            {departmentKpis.map((dept) => {
              const revenueDiff = dept.revenueActual - dept.revenueTarget;
              const revenuePct = dept.revenueTarget ? (revenueDiff / dept.revenueTarget) * 100 : 0;
              const followerDiff = dept.followersActual - dept.followersTarget;
              const followerPct = dept.followersTarget ? (followerDiff / dept.followersTarget) * 100 : 0;
              return (
                <Tr key={dept.department}>
                  <Td fontWeight="semibold">{dept.department}</Td>
                  <Td>
                    <Flex direction="column" gap={0.5}>
                      <Text>{currencyFormatter.format(dept.revenueActual)}</Text>
                      <Text fontSize="xs" color={mutedTextColor}>Target {currencyFormatter.format(dept.revenueTarget)}</Text>
                    </Flex>
                  </Td>
                  <Td>
                    <Tag colorScheme={revenuePct >= 0 ? 'green' : 'orange'} variant="subtle">
                      {`${revenuePct >= 0 ? '+' : ''}${revenuePct.toFixed(1)}%`}
                    </Tag>
                  </Td>
                  <Td>
                    <VStack spacing={1} align="stretch">
                      <Flex justify="space-between" fontSize="sm">
                        <Text>{dept.followersActual.toLocaleString()}</Text>
                        <Text color={mutedTextColor}>/ {dept.followersTarget.toLocaleString()}</Text>
                      </Flex>
                      <Progress
                        value={Math.min((dept.followersActual / Math.max(dept.followersTarget, 1)) * 100, 160)}
                        size="xs"
                        colorScheme={dept.followersActual >= dept.followersTarget ? 'green' : 'purple'}
                        borderRadius="full"
                      />
                      <Text fontSize="xs" color={followerPct >= 0 ? positiveTextColor : warningTextColor}>
                        {followerPct >= 0 ? '+' : ''}
                        {followerPct.toFixed(1)}% vs target
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default RevenueTab;
