import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Tag
} from '@chakra-ui/react';

const TeamTab = ({
  cardBg,
  borderColor,
  mutedTextColor,
  usersLoading,
  usersError,
  tradextvUsers,
  negativeTextColor
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
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" mb={1}>Team</Heading>
          <Text color={mutedTextColor}>Accounts with the TradeXTV role.</Text>
        </Box>
        <Tag colorScheme="purple" variant="subtle">Role: tradextv</Tag>
      </Flex>
      <Box overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {usersLoading ? (
              <Tr>
                <Td colSpan={5}>
                  <Text color={mutedTextColor}>Loading team...</Text>
                </Td>
              </Tr>
            ) : usersError ? (
              <Tr>
                <Td colSpan={5}>
                  <Text color={negativeTextColor}>Failed to load users.</Text>
                </Td>
              </Tr>
            ) : tradextvUsers.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Text color={mutedTextColor}>No TradeXTV accounts found.</Text>
                </Td>
              </Tr>
            ) : (
              tradextvUsers.map((u) => (
                <Tr key={u._id || u.username}>
                  <Td fontWeight="semibold">{u.name || u.username || '???'}</Td>
                  <Td>{u.username || '???'}</Td>
                  <Td>{u.email || '???'}</Td>
                  <Td>
                    <Badge colorScheme="purple" variant="subtle">
                      {u.role || '???'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={(u.status || '').toLowerCase() === 'active' ? 'green' : 'gray'}
                      variant="subtle"
                    >
                      {u.status || 'unknown'}
                    </Badge>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default TeamTab;
