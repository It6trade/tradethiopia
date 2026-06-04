import React, { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Badge } from '@chakra-ui/react';
import { listPayments } from '../../services/paymentService';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);

  const load = async () => {
    try {
      const res = await listPayments();
      setPayments(res);
    } catch (err) {
      console.error('Failed to load payments', err);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Text fontSize="xl" mb={4}>Payments</Text>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Followup</Th>
            <Th>Order</Th>
            <Th>Method</Th>
            <Th>Amount</Th>
            <Th>By</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {payments.map(p => (
            <Tr key={p._id}>
              <Td>{p._id}</Td>
              <Td>{p.followup?._id || '—'}</Td>
              <Td>{p.order?._id || '—'}</Td>
              <Td>{p.method}</Td>
              <Td>{p.amount ?? '—'}</Td>
              <Td>{p.createdBy?.username || p.createdBy?._id || '—'}</Td>
              <Td>{new Date(p.createdAt).toLocaleString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PaymentsPage;
