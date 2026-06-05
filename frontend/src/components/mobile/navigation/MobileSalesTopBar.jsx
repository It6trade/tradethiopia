import React from 'react';
import { Box, Flex, Heading, IconButton } from '@chakra-ui/react';
import { FiBell, FiPlus } from 'react-icons/fi';

const MobileSalesTopBar = ({ title = 'Sales', onMenu, onAdd }) => (
  <Box bg="white" borderBottom="1px solid" borderColor="#E8EDF5" px={4} py={3}>
    <Flex align="center" justify="space-between">
      <Heading color="#081A34" fontSize="22px" lineHeight="1" fontWeight="900">
        {title}
      </Heading>
      <Flex align="center" gap={2}>
        <IconButton
          aria-label="Notifications"
          icon={<FiBell />}
          variant="ghost"
          color="#081A34"
          fontSize="20px"
        />
        <IconButton
          aria-label="Add"
          icon={<FiPlus />}
          variant="ghost"
          color="#D99A00"
          fontSize="26px"
          onClick={onAdd}
        />
      </Flex>
    </Flex>
  </Box>
);

export default MobileSalesTopBar;
