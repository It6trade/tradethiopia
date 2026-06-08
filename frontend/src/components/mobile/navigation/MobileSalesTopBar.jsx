import React from 'react';
import { Box, Flex, Heading, IconButton } from '@chakra-ui/react';
import { FiBell, FiMenu, FiPlus } from 'react-icons/fi';

const MobileSalesTopBar = ({ title = 'Sales', onMenu, onAdd }) => (
  <Box bg="#001f4d" borderBottom="1px solid" borderColor="#001a42" px={4} py={3}>
    <Flex align="center" justify="space-between">
      <Flex align="center" gap={2} minW={0}>
        {onMenu && (
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            color="white"
            fontSize="22px"
            size="sm"
            onClick={onMenu}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        )}
        <Heading color="white" fontSize="22px" lineHeight="1" fontWeight="900" noOfLines={1}>
          {title}
        </Heading>
      </Flex>
      <Flex align="center" gap={2}>
        <IconButton
          aria-label="Notifications"
          icon={<FiBell />}
          variant="ghost"
          color="white"
          fontSize="20px"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        <IconButton
          aria-label="Add"
          icon={<FiPlus />}
          variant="ghost"
          color="#D99A00"
          fontSize="26px"
          onClick={onAdd}
          _hover={{ bg: 'whiteAlpha.200' }}
        />
      </Flex>
    </Flex>
  </Box>
);

export default MobileSalesTopBar;
