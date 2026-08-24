import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Flex,
  Icon,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiAward,
  FiFileText,
  FiEdit2,
  FiMessageSquare,
  FiTarget,
} from 'react-icons/fi';

const CustomerDetails = ({ customer, customerType, onBack, onEdit }) => {
  const cardBg = useColorModeValue('#ffffff', '#1e293b');
  const cardBorder = useColorModeValue('#e2e8f0', '#334155');
  const labelColor = useColorModeValue('#64748b', '#94a3b8');
  const valueColor = useColorModeValue('#1e293b', '#f1f5f9');

  if (!customer) {
    return (
      <Flex justify="center" align="center" height="200px" color={labelColor} fontSize="xs">
        <Text>No customer profile data available.</Text>
      </Flex>
    );
  }

  const productsList = Array.isArray(customer.products)
    ? customer.products
    : typeof customer.products === 'string'
    ? customer.products.split(',').map((p) => p.trim())
    : [];

  const certificationsList = Array.isArray(customer.certifications)
    ? customer.certifications
    : typeof customer.certifications === 'string'
    ? customer.certifications.split(',').map((c) => c.trim())
    : [];

  return (
    <VStack align="stretch" spacing={4} pb={6}>
      {/* 1. Quick Stats Grid */}
      <SimpleGrid columns={2} spacing={2.5}>
        <Box p={3} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg">
          <Text fontSize="10px" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="0.5px">
            Country & Region
          </Text>
          <HStack spacing={1.5} mt={1}>
            <Text fontSize="12px">🇪🇹</Text>
            <Text fontSize="12px" fontWeight="500" color={valueColor}>
              {customer.country || 'Ethiopia'}
            </Text>
          </HStack>
        </Box>

        <Box p={3} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg">
          <Text fontSize="10px" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="0.5px">
            Industry Sector
          </Text>
          <Text fontSize="12px" fontWeight="500" color={valueColor} mt={1} noOfLines={1}>
            {customer.industry || 'General Trade'}
          </Text>
        </Box>

        <Box p={3} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg">
          <Text fontSize="10px" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="0.5px">
            Account Status
          </Text>
          <HStack spacing={1.5} mt={1}>
            <Badge
              bg="#e8f8ee"
              color="#16a34a"
              fontSize="10px"
              fontWeight="600"
              px={2}
              py={0.5}
              borderRadius="full"
              textTransform="none"
            >
              {customer.status || 'Active'}
            </Badge>
          </HStack>
        </Box>

        <Box p={3} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg">
          <Text fontSize="10px" fontWeight="600" color={labelColor} textTransform="uppercase" letterSpacing="0.5px">
            Package Plan
          </Text>
          <Badge
            bg="#f3e8ff"
            color="#9333ea"
            fontSize="10px"
            fontWeight="600"
            px={2}
            py={0.5}
            borderRadius="md"
            mt={1}
            textTransform="none"
          >
            {customer.packageType || 'Standard Plan'}
          </Badge>
        </Box>
      </SimpleGrid>

      {/* 2. Contact Person & Channel Details */}
      <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
        <Text fontSize="11px" fontWeight="700" color={valueColor} mb={3}>
          Contact Person & Communication
        </Text>

        <VStack align="stretch" spacing={2.5}>
          <Flex justify="space-between" align="center" fontSize="12px">
            <HStack spacing={2} color={labelColor}>
              <Icon as={FiUser} boxSize={3.5} />
              <Text fontSize="11px">Contact Name</Text>
            </HStack>
            <Text fontWeight="500" color={valueColor}>
              {customer.contactPerson || '-'}
            </Text>
          </Flex>

          <Divider borderColor={cardBorder} />

          <Flex justify="space-between" align="center" fontSize="12px">
            <HStack spacing={2} color={labelColor}>
              <Icon as={FiMail} boxSize={3.5} />
              <Text fontSize="11px">Email Address</Text>
            </HStack>
            <Text fontWeight="500" color={valueColor} fontSize="11px">
              {customer.email || '-'}
            </Text>
          </Flex>

          <Divider borderColor={cardBorder} />

          <Flex justify="space-between" align="center" fontSize="12px">
            <HStack spacing={2} color={labelColor}>
              <Icon as={FiPhone} boxSize={3.5} />
              <Text fontSize="11px">Phone Number</Text>
            </HStack>
            <Text fontWeight="500" color={valueColor} fontSize="11px">
              {customer.phoneNumber || customer.phone || '-'}
            </Text>
          </Flex>

          <Divider borderColor={cardBorder} />

          <Flex justify="space-between" align="center" fontSize="12px">
            <HStack spacing={2} color={labelColor}>
              <Icon as={FiCalendar} boxSize={3.5} />
              <Text fontSize="11px">Registered On</Text>
            </HStack>
            <Text fontWeight="400" color={labelColor} fontSize="11px">
              {customer.registrationDate
                ? new Date(customer.registrationDate).toLocaleDateString()
                : '12/04/2024'}
            </Text>
          </Flex>
        </VStack>
      </Box>

      {/* 3. Products Demand / Offering */}
      <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
        <HStack justify="space-between" align="center" mb={2.5}>
          <HStack spacing={2}>
            <Icon as={FiPackage} color="#0284c7" boxSize={3.5} />
            <Text fontSize="11px" fontWeight="700" color={valueColor}>
              {customerType === 'buyer' ? 'Products Looking For' : 'Products & Commodities Offered'}
            </Text>
          </HStack>
          <Badge bg="#e0f2fe" color="#0284c7" fontSize="10px" px={1.5} py={0.2} borderRadius="full">
            {productsList.length} items
          </Badge>
        </HStack>

        <Flex wrap="wrap" gap={1.5} mt={2}>
          {productsList.length > 0 ? (
            productsList.map((product, idx) => (
              <Badge
                key={idx}
                bg="#e0f2fe"
                color="#0284c7"
                fontSize="11px"
                fontWeight="500"
                px={2.5}
                py={1}
                borderRadius="md"
                textTransform="none"
              >
                {product}
              </Badge>
            ))
          ) : (
            <Text fontSize="11px" color={labelColor}>
              No specific products specified yet.
            </Text>
          )}
        </Flex>
      </Box>

      {/* 4. Match Readiness Score Bar */}
      <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
        <Flex justify="space-between" align="center" mb={2}>
          <HStack spacing={2}>
            <Icon as={FiTarget} color="#0d9488" boxSize={3.5} />
            <Text fontSize="11px" fontWeight="700" color={valueColor}>
              B2B Match Readiness Score
            </Text>
          </HStack>
          <Text fontSize="12px" fontWeight="700" color="#0d9488">
            {customer.matchReadiness || 75}%
          </Text>
        </Flex>
        <Box w="100%" h="6px" bg={useColorModeValue('#e2e8f0', '#334155')} borderRadius="full" overflow="hidden">
          <Box h="100%" w={`${customer.matchReadiness || 75}%`} bg="#0d9488" borderRadius="full" />
        </Box>
        <Text fontSize="10px" color={labelColor} mt={1.5}>
          High profile completion, verified tax identification and active product demands.
        </Text>
      </Box>

      {/* 5. Requirements or Certifications */}
      {customerType === 'seller' && certificationsList.length > 0 && (
        <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
          <HStack spacing={2} mb={2.5}>
            <Icon as={FiAward} color="#16a34a" boxSize={3.5} />
            <Text fontSize="11px" fontWeight="700" color={valueColor}>
              Trade Certifications
            </Text>
          </HStack>
          <Flex wrap="wrap" gap={1.5}>
            {certificationsList.map((cert, idx) => (
              <Badge
                key={idx}
                bg="#e8f8ee"
                color="#16a34a"
                fontSize="11px"
                fontWeight="500"
                px={2.5}
                py={0.8}
                borderRadius="md"
                textTransform="none"
              >
                {cert}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      {customerType === 'buyer' && customer.requirements && (
        <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
          <HStack spacing={2} mb={2}>
            <Icon as={FiFileText} color="#0284c7" boxSize={3.5} />
            <Text fontSize="11px" fontWeight="700" color={valueColor}>
              Special Requirements & Specs
            </Text>
          </HStack>
          <Text fontSize="11px" color={labelColor} lineHeight="1.5">
            {customer.requirements}
          </Text>
        </Box>
      )}

      {/* 6. Subscribed Packages */}
      {customer.packages && customer.packages.length > 0 && (
        <Box p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl">
          <Text fontSize="11px" fontWeight="700" color={valueColor} mb={2.5}>
            Subscription & Packages
          </Text>
          <VStack align="stretch" spacing={2}>
            {customer.packages.map((pkg, idx) => (
              <Flex
                key={idx}
                p={2.5}
                bg={useColorModeValue('#f8fafc', '#0f172a')}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="lg"
                justify="space-between"
                align="center"
              >
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={valueColor}>
                    {pkg.packageName || 'B2B Trade Pass'}
                  </Text>
                  <Text fontSize="10px" color={labelColor}>
                    Type: {pkg.packageType || 'Annual'}
                  </Text>
                </Box>
                <Badge
                  bg={pkg.status === 'Active' ? '#e8f8ee' : '#f1f5f9'}
                  color={pkg.status === 'Active' ? '#16a34a' : '#64748b'}
                  fontSize="10px"
                  fontWeight="600"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {pkg.status || 'Active'}
                </Badge>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {/* 7. Action Footer */}
      <HStack spacing={2.5} pt={2}>
        <Button
          flex={1}
          size="sm"
          bg="#0d9488"
          color="white"
          fontSize="xs"
          fontWeight="600"
          h="36px"
          borderRadius="lg"
          leftIcon={<Icon as={FiEdit2} boxSize={3.5} />}
          _hover={{ bg: '#0f766e' }}
          onClick={() => onEdit && onEdit(customer)}
        >
          Edit {customerType === 'buyer' ? 'Buyer' : 'Seller'}
        </Button>
        <Button
          flex={1}
          size="sm"
          variant="outline"
          borderColor={cardBorder}
          color={valueColor}
          fontSize="xs"
          fontWeight="500"
          h="36px"
          borderRadius="lg"
          leftIcon={<Icon as={FiMessageSquare} boxSize={3.5} />}
          _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100') }}
        >
          Contact Partner
        </Button>
      </HStack>
    </VStack>
  );
};

export default CustomerDetails;