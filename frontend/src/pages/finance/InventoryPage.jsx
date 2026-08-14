import React from 'react';
import {
  Box,
  Heading,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import InventoryManagementPage from './InventoryManagementPage';

const InventoryPage = () => {
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        {/* <Heading as="h1" size="xl" color={headerColor}>
          Inventory Management
        </Heading> */}
      </HStack>
      <InventoryManagementPage />
    </Box>
  );
};

export default InventoryPage;
