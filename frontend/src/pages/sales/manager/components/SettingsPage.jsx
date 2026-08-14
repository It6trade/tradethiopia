import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Card,
  CardBody,
  Text,
  useColorModeValue,
  Flex,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  VStack,
  Divider,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiSettings, FiBell, FiLock, FiUser } from 'react-icons/fi';
import { useUserStore } from '../../../../store/user';

const SettingsPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [settings, setSettings] = useState({
    notifications: true,
    emailReports: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (currentUser) {
          setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error loading profile',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, toast]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Save settings to backend
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleUpdateProfile = async () => {
    try {
      // TODO: Implement API call to update profile
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box p={{ base: 2, md: 6 }} maxW="100%" display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color={headerColor} thickness="4px" />
      </Box>
    );
  }

  return (
    <Box p={{ base: 2, md: 6 }} maxW="100%">
      <Heading 
        as="h1" 
        size={{ base: "lg", md: "xl" }} 
        mb={{ base: 4, md: 6 }}
        color={headerColor}
        fontWeight="bold"
      >
        Settings
      </Heading>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={{ base: 4, md: 6 }}>
        {/* Profile Settings */}
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiUser} mr={3} color={headerColor} boxSize={5} />
              <Heading as="h2" size="md" color={headerColor}>
                Profile Settings
              </Heading>
            </Flex>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input 
                  placeholder="Enter your name" 
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input 
                  placeholder="Enter your phone number"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </FormControl>
              <Button colorScheme="teal" onClick={handleUpdateProfile}>Update Profile</Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiBell} mr={3} color={headerColor} boxSize={5} />
              <Heading as="h2" size="md" color={headerColor}>
                Notifications
              </Heading>
            </Flex>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>
                  Email Notifications
                </FormLabel>
                <Switch 
                  isChecked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                  colorScheme="teal"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>
                  Daily Reports
                </FormLabel>
                <Switch 
                  isChecked={settings.emailReports}
                  onChange={(e) => handleChange('emailReports', e.target.checked)}
                  colorScheme="teal"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>
                  Push Notifications
                </FormLabel>
                <Switch 
                  isChecked={true}
                  isDisabled
                  colorScheme="teal"
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* System Settings */}
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Flex align="center" mb={4}>
              <Icon as={FiSettings} mr={3} color={headerColor} boxSize={5} />
              <Heading as="h2" size="md" color={headerColor}>
                System Settings
              </Heading>
            </Flex>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select 
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Timezone</FormLabel>
                <Select 
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="EAT">East Africa Time (EAT)</option>
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>
                  Dark Mode
                </FormLabel>
                <Switch 
                  isChecked={settings.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                  colorScheme="teal"
                />
              </FormControl>
              <Divider />
              <FormControl>
                <FormLabel>Security</FormLabel>
                <Button leftIcon={<FiLock />} colorScheme="red" width="100%">
                  Change Password
                </Button>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Save Button */}
      <Flex justify="flex-end" mt={{ base: 4, md: 6 }}>
        <Button 
          colorScheme="teal" 
          size="lg" 
          onClick={handleSubmit}
          px={8}
        >
          Save Settings
        </Button>
      </Flex>
    </Box>
  );
};

export default SettingsPage;