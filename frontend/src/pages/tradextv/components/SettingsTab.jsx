import React from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Button,
  Tag
} from '@chakra-ui/react';

const SettingsTab = ({
  cardBg,
  borderColor,
  sectionHeadingColor,
  sectionTextColor,
  newServiceName,
  setNewServiceName,
  handleAddServiceType,
  handleRemoveServiceType,
  isLoadingServices,
  serviceOptions,
  serviceInputTextColor,
  serviceInputPlaceholderColor,
  mutedTextColor,
  cardTextColor
}) => {
  return (
    <Box 
      bg={cardBg}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="lg" mb={6} color={sectionHeadingColor}>
        Settings
      </Heading>
      <Text mb={4} color={sectionTextColor}>
        Configure your dashboard preferences and notification settings.
      </Text>
      <Box 
        bg={cardBg} 
        p={6} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        mt={6}
        color={cardTextColor || 'inherit'}
      >
        <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
          <Box>
            <Text fontWeight="medium">Service types</Text>
            <Text fontSize="sm" color={sectionTextColor}>Add or manage the deliverables your team offers.</Text>
          </Box>
          <Flex gap={2} wrap="wrap" align="center">
            <Input
              size="sm"
              placeholder="Add a new service"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              maxW="260px"
              color={serviceInputTextColor}
              _placeholder={{ color: serviceInputPlaceholderColor }}
            />
            <Button size="sm" colorScheme="purple" onClick={handleAddServiceType} isDisabled={!newServiceName.trim() || isLoadingServices} isLoading={isLoadingServices}>
              Add service
            </Button>
            {isLoadingServices && (
              <Tag size="sm" colorScheme="purple" variant="subtle">Updating...</Tag>
            )}
          </Flex>
        </Flex>
        <Flex gap={2} flexWrap="wrap">
          {serviceOptions.map((service) => (
            <Tag
              key={service}
              size="md"
              colorScheme="purple"
              variant="subtle"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Text>{service}</Text>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveServiceType(service)}>
                Remove
              </Button>
            </Tag>
          ))}
          {serviceOptions.length === 0 && (
            <Text color={mutedTextColor} fontSize="sm">No services yet. Add your first one above.</Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default SettingsTab;
