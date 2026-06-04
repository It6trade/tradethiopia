import React, { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Button, Text, Badge } from '@chakra-ui/react';
import { getDemands, resolveDemand } from '../../services/financeService';

const DemandsPage = () => {
  const [demands, setDemands] = useState([]);

  const load = async () => {
    try {
      const res = await getDemands();
      setDemands(res);
    } catch (err) {
      console.error('Failed to load demands', err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (id) => {
    try {
      await resolveDemand(id);
      await load();
    } catch (err) {
      console.error('Resolve failed', err);
      alert(err?.response?.data?.message || 'Resolve failed');
    }
  };

  return (
    <Box>
      <Text fontSize="xl" mb={4}>Demands</Text>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Followup</Th>
            <Th>Lines</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {demands.map(d => (
            <Tr key={d._id}>
              <Td>{d._id}</Td>
              <Td>{d.followup?._id || '—'}</Td>
              <Td>
                {d.lines && d.lines.map(l => (
                  <Box key={l._id}><Text fontSize="sm">{l.item?.name || l.item} — requested: {l.requestedQty} • unfulfilled: {l.unfulfilledQty}</Text></Box>
                ))}
              </Td>
              <Td><Badge colorScheme={d.status === 'open' ? 'red' : 'green'}>{d.status}</Badge></Td>
              <Td>
                {d.status !== 'resolved' && <Button size="sm" colorScheme="teal" onClick={() => handleResolve(d._id)}>Mark Resolved</Button>}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default DemandsPage;
