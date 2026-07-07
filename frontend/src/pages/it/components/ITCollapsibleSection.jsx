import React, { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Flex,
  Heading,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

export default function ITCollapsibleSection({
  title,
  subtitle,
  actions,
  defaultOpen = true,
  children,
  bodyProps = {},
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.800');

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="14px" bg={headerBg} overflow="hidden">
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        px={{ base: 4, md: 5 }}
        py={4}
        cursor="pointer"
        onClick={() => setIsOpen((value) => !value)}
      >
        <HStack spacing={3} minW={0}>
          <Button
            size="sm"
            variant="ghost"
            minW="34px"
            h="34px"
            p={0}
            borderRadius="10px"
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((value) => !value);
            }}
          >
            {isOpen ? <FiChevronDown /> : <FiChevronRight />}
          </Button>
          <Box minW={0}>
            <Heading size="sm">{title}</Heading>
            {subtitle ? (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {subtitle}
              </Text>
            ) : null}
          </Box>
        </HStack>
        {actions ? (
          <Box onClick={(event) => event.stopPropagation()}>
            {actions}
          </Box>
        ) : null}
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box px={{ base: 4, md: 5 }} pb={5} {...bodyProps}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
