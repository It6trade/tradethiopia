import React from 'react';
import { Box, Center, Flex, Icon, Text } from '@chakra-ui/react';
import { FiBriefcase, FiCheckSquare, FiHome, FiPlus, FiUser } from 'react-icons/fi';

const navItems = [
  { label: 'Home', value: 'Home', icon: FiHome },
  { label: 'Followup', value: 'Followup', icon: FiBriefcase },
  { label: 'Add', value: 'Add', icon: FiPlus, isAdd: true },
  { label: 'Tasks', value: 'Tasks', icon: FiCheckSquare },
  { label: 'Profile', value: 'More', icon: FiUser }
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
    px={3}
    pt={2}
    pb="calc(8px + env(safe-area-inset-bottom))"
    boxShadow="0 -10px 26px rgba(8, 26, 52, 0.08)"
  >
    <Flex justify="space-between" align="flex-end">
      {navItems.map((item) => {
        const isActive = activeItem === item.value || (item.value === 'Home' && !activeItem);

        if (item.isAdd) {
          return (
            <Box
              key={item.value}
              as="button"
              type="button"
              flex="1"
              minW={0}
              aria-label="Add"
              onClick={() => onChange('Followup')}
            >
              <Flex direction="column" align="center" gap={1}>
                <Center
                  w="58px"
                  h="58px"
                  mt="-28px"
                  borderRadius="full"
                  bg="linear-gradient(180deg, #E3AA18 0%, #C98D00 100%)"
                  color="white"
                  boxShadow="0 12px 24px rgba(217, 154, 0, 0.38)"
                  borderWidth="4px"
                  borderColor="white"
                >
                  <Icon as={item.icon} boxSize={7} strokeWidth={2.2} />
                </Center>
              </Flex>
            </Box>
          );
        }

        return (
          <Box
            key={item.value}
            as="button"
            type="button"
            flex="1"
            minW={0}
            color={isActive ? '#001f4d' : '#7A8497'}
            onClick={() => onChange(item.value)}
          >
            <Flex direction="column" align="center" gap={1}>
              <Icon as={item.icon} boxSize={5} strokeWidth={isActive ? 2.7 : 2.2} />
              <Text fontSize="10px" fontWeight="900" lineHeight="1.1" noOfLines={1}>
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
