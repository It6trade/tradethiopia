// src/pages/coo2/DepartmentSubSidebar.jsx
import { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  RiBuilding4Line,
  RiMoneyDollarCircleLine,
  RiCodeBoxLine,
  RiTvLine,
  RiArchiveLine,
  RiTeamLine,
  RiCustomerService2Line,
  RiBankLine,
  RiShieldCheckLine,
  RiShareLine,
  RiPlantLine,
  RiDashboardLine,
} from 'react-icons/ri';
import { DEPARTMENTS } from './cooData';

const iconMap = {
  RiDashboardLine,
  RiMoneyDollarCircleLine,
  RiCodeBoxLine,
  RiTvLine,
  RiArchiveLine,
  RiTeamLine,
  RiCustomerService2Line,
  RiBankLine,
  RiShieldCheckLine,
  RiShareLine,
  RiPlantLine,
};

const DepartmentSubSidebar = ({
  selectedDept,
  setSelectedDept,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepts = DEPARTMENTS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      w={collapsed ? '50px' : '194px'}
      minW={collapsed ? '50px' : '194px'}
      h="100%"
      minH={0}
      bg="#0f172a"
      color="#cbd5e1"
      p={collapsed ? 1.5 : 2.5}
      borderRight="1px solid rgba(255, 255, 255, 0.06)"
      transition="width 0.22s cubic-bezier(0.4, 0, 0.2, 1)"
      position="relative"
      display="flex"
      flexDirection="column"
      zIndex={15}
      overflow="hidden"
      flexShrink={0}
    >
      {/* Sub-sidebar Header */}
      <Flex
        align="center"
        justify="space-between"
        mb={3}
        px={collapsed ? 1 : 1.5}
        pt={1}
      >
        {!collapsed && (
          <Box>
            <HStack spacing={1.5}>
              <Icon as={RiBuilding4Line} color="#38bdf8" boxSize="15px" />
              <Text
                fontSize="12px"
                fontWeight="700"
                color="#e2e8f0"
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                Departments
              </Text>
            </HStack>
            <Text fontSize="11px" color="#64748b">
              Select division to filter
            </Text>
          </Box>
        )}

        <Tooltip label={collapsed ? 'Expand Sub-sidebar' : 'Collapse Sub-sidebar'} placement="right">
          <IconButton
            size="xs"
            variant="ghost"
            color="#64748b"
            _hover={{ color: '#ffffff', bg: 'rgba(255,255,255,0.06)' }}
            icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            aria-label="Toggle sub-sidebar"
            onClick={onToggleCollapse}
          />
        </Tooltip>
      </Flex>

      {/* Search Bar */}
      {!collapsed && (
        <Box mb={3}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="#475569" boxSize="13px" />
            </InputLeftElement>
            <Input
              placeholder="Filter department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(255, 255, 255, 0.04)"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="8px"
              fontSize="12px"
              color="#f1f5f9"
              _placeholder={{ color: '#64748b' }}
              _focus={{
                borderColor: '#3b82f6',
                bg: 'rgba(255, 255, 255, 0.07)',
                boxShadow: 'none',
              }}
            />
          </InputGroup>
        </Box>
      )}

      {/* Departments List */}
      <VStack
        align="stretch"
        spacing={1}
        overflowY="auto"
        flex={1}
        pr={0.5}
        sx={{
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 'full' },
        }}
      >
        {filteredDepts.map((dept) => {
          const isSelected = selectedDept === dept.id;
          const IconComp = iconMap[dept.icon] || RiBuilding4Line;

          return (
            <Tooltip
              key={dept.id}
              label={collapsed ? dept.name : ''}
              placement="right"
              hasArrow
              isDisabled={!collapsed}
            >
              <Flex
                align="center"
                justify={collapsed ? 'center' : 'space-between'}
                px={collapsed ? 2 : 3}
                py={2.2}
                borderRadius="10px"
                cursor="pointer"
                bg={isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'}
                border={isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent'}
                color={isSelected ? '#ffffff' : '#94a3b8'}
                transition="all 0.16s ease"
                _hover={{
                  bg: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  transform: 'translateX(2px)',
                }}
                onClick={() => setSelectedDept(dept.id)}
              >
                <HStack spacing={2.5} overflow="hidden">
                  <Flex
                    w="26px"
                    h="26px"
                    borderRadius="7px"
                    bg={isSelected ? dept.color : 'rgba(255, 255, 255, 0.06)'}
                    color={isSelected ? '#ffffff' : dept.color}
                    align="center"
                    justify="center"
                    flexShrink={0}
                    transition="all 0.18s ease"
                  >
                    <Icon as={IconComp} boxSize="15px" />
                  </Flex>

                  {!collapsed && (
                    <Text
                      fontSize="12.5px"
                      fontWeight={isSelected ? '600' : '500'}
                      isTruncated
                    >
                      {dept.name}
                    </Text>
                  )}
                </HStack>

                {!collapsed && (
                  <Badge
                    fontSize="9.5px"
                    fontWeight="600"
                    px={1.5}
                    py={0.2}
                    borderRadius="6px"
                    bg={isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'}
                    color={isSelected ? '#93c5fd' : '#64748b'}
                  >
                    {dept.badge}
                  </Badge>
                )}
              </Flex>
            </Tooltip>
          );
        })}
      </VStack>

      {/* Summary Footer */}
      {!collapsed && (
        <Box pt={3} mt={2} borderTop="1px solid rgba(255, 255, 255, 0.06)">
          <Flex align="center" justify="space-between" px={1}>
            <HStack spacing={1.5}>
              <Icon as={FiCheckCircle} color="#10b981" boxSize="13px" />
              <Text fontSize="11px" color="#94a3b8" fontWeight="500">
                10 Units Online
              </Text>
            </HStack>
            <Badge colorScheme="green" fontSize="9px" px={1.5} borderRadius="full">
              Synced
            </Badge>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default DepartmentSubSidebar;
