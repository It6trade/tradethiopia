import React from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FiCalendar, FiCheckSquare, FiHome, FiMoreHorizontal, FiUser } from 'react-icons/fi';

const navItems = [
  { label: 'Home', value: 'Home', icon: FiHome },
  { label: 'Contacts', value: 'Contacts', icon: FiUser },
  { label: 'Follow-ups', value: 'Followup', icon: FiCalendar },
  { label: 'Tasks', value: 'Tasks', icon: FiCheckSquare },
  { label: 'More', value: 'More', icon: FiMoreHorizontal }
];

const MobileBottomNav = ({ activeItem, onChange }) => (
  <Box
    position="fixed"
    left={0}
    right={0}
    bottom={0}
    zIndex={20}
    bg="white"
    borderTop="1px solid"
    borderColor="#E8EDF5"
    px={2}
    pt={2}
    pb="calc(8px + env(safe-area-inset-bottom))"
    boxShadow="0 -8px 24px rgba(8, 26, 52, 0.08)"
  >
    <Flex justify="space-between">
      {navItems.map((item) => {
        const isActive = activeItem === item.value || (item.value === 'Home' && !activeItem);
        return (
          <Box
            key={item.value}
            as="button"
            type="button"
            flex="1"
            minW={0}
            color={isActive ? '#D99A00' : '#7A8497'}
            onClick={() => onChange(item.value)}
          >
            <Flex direction="column" align="center" gap={0.5}>
              <Icon as={item.icon} boxSize={5} />
              <Text fontSize="10px" fontWeight="800" lineHeight="1.1" noOfLines={1}>
                {item.label}
              </Text>
            </Flex>
          </Box>
        );
      })}
    </Flex>
  </Box>
);

export default MobileBottomNav;
