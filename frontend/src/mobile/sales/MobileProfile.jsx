import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Center,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  FiAward,
  FiBriefcase,
  FiChevronRight,
  FiEdit3,
  FiFileText,
  FiHelpCircle,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const theme = {
  navy: '#001f4d',
  navyLight: '#062b63',
  gold: '#D99A00',
  goldSoft: '#FFF7DE',
  green: '#18A058',
  blue: '#2F6FED',
  ink: '#081A34',
  muted: '#6E7890',
  border: '#E8EDF5',
  page: '#FAFBFD'
};

const titleCase = (value = '') => (
  value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const cleanValue = (value, fallback = 'Not set') => {
  const text = value === null || value === undefined ? '' : value.toString().trim();
  return text || fallback;
};

const buildProfileForm = (user = {}) => ({
  fullName: user.fullName || user.name || user.username || localStorage.getItem('userName') || '',
  email: user.email || localStorage.getItem('userEmail') || '',
  phone: user.phone || user.altPhone || '',
  jobTitle: user.jobTitle || user.position || user.displayRole || user.role || '',
  department: user.department || localStorage.getItem('userDepartment') || '',
  location: user.location || '',
  notes: user.notes || ''
});

const AccountRow = ({ icon, label, value }) => (
  <Flex align="center" justify="space-between" gap={3} py={3} borderBottomWidth="1px" borderBottomColor={theme.border}>
    <HStack spacing={3} minW={0}>
      <Icon as={icon} color={theme.muted} boxSize={4} flexShrink={0} />
      <Text fontSize="12px" color={theme.muted} fontWeight="800" minW="72px">{label}</Text>
    </HStack>
    <HStack minW={0} spacing={2}>
      <Text fontSize="12px" color={theme.ink} fontWeight="800" textAlign="right" noOfLines={1}>{cleanValue(value)}</Text>
      <Icon as={FiChevronRight} color="#B4BDCB" boxSize={3.5} flexShrink={0} />
    </HStack>
  </Flex>
);

const StatCard = ({ icon, label, value, detail, color, bg }) => (
  <Flex align="center" gap={2} minW={0} flex="1">
    <Center w="30px" h="30px" borderRadius="10px" bg={bg} color={color} flexShrink={0}>
      <Icon as={icon} boxSize={4} />
    </Center>
    <Box minW={0} flex="1">
      <Text fontSize="7px" color={theme.muted} fontWeight="900" lineHeight="1.1" noOfLines={1}>{label}</Text>
      <Text fontSize="13px" color={theme.ink} fontWeight="900" lineHeight="1.05" mt="1px" noOfLines={1}>{value}</Text>
      <Text fontSize="7px" color={theme.muted} fontWeight="800" lineHeight="1.1" mt="1px" noOfLines={1}>{detail}</Text>
    </Box>
  </Flex>
);

const StatDivider = () => (
  <Box w="1px" h="38px" bg={theme.border} flexShrink={0} />
);

const QuickLink = ({ icon, label, onClick, color = theme.navy, bg = '#F7F9FC' }) => (
  <Box as="button" type="button" onClick={onClick} textAlign="center">
    <Center
      w="48px"
      h="48px"
      mx="auto"
      bg={bg}
      borderWidth="1px"
      borderColor={theme.border}
      borderRadius="14px"
      color={color}
      boxShadow="0 8px 18px rgba(8, 26, 52, 0.05)"
      transition="transform 0.16s ease, box-shadow 0.16s ease"
      _active={{ transform: 'scale(0.96)' }}
    >
      <Icon as={icon} boxSize={5} />
    </Center>
    <Text mt={2} fontSize="9px" color={theme.ink} fontWeight="900" lineHeight="1.1" noOfLines={2}>{label}</Text>
  </Box>
);

const ActionRow = ({ icon, label, color = theme.ink, onClick }) => (
  <Box as="button" type="button" w="100%" textAlign="left" onClick={onClick}>
    <Flex align="center" justify="space-between" py={3}>
      <HStack spacing={3}>
        <Icon as={icon} color={color} boxSize={4.5} />
        <Text fontSize="13px" color={color} fontWeight="900">{label}</Text>
      </HStack>
      <Icon as={FiChevronRight} color="#B4BDCB" boxSize={4} />
    </Flex>
  </Box>
);

const MobileProfile = ({ onNavigate }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const updateUserInfo = useUserStore((state) => state.updateUserInfo);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(currentUser));
  const [saving, setSaving] = useState(false);
  const editDisclosure = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const fullName = cleanValue(profileForm.fullName, cleanValue(currentUser?.username || localStorage.getItem('userName'), 'User'));
  const email = cleanValue(profileForm.email || currentUser?.email || localStorage.getItem('userEmail'));
  const phone = cleanValue(profileForm.phone);
  const role = titleCase(cleanValue(profileForm.jobTitle || currentUser?.displayRole || currentUser?.role, 'Sales Officer'));
  const department = titleCase(cleanValue(profileForm.department || currentUser?.department, 'Sales'));
  const location = cleanValue(profileForm.location);

  const completion = useMemo(() => {
    const fields = [profileForm.fullName, profileForm.email, profileForm.phone, profileForm.jobTitle, profileForm.department, profileForm.location];
    return Math.round((fields.filter((value) => value?.toString().trim()).length / fields.length) * 100);
  }, [profileForm]);

  const openEdit = () => {
    setProfileForm(buildProfileForm(currentUser));
    editDisclosure.onOpen();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const userId = currentUser?._id || localStorage.getItem('userId');
    if (!userId) {
      toast({ title: 'Profile unavailable', description: 'Could not determine the current user.', status: 'error', duration: 3000 });
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserInfo({ ...profileForm, _id: userId });
      if (!result?.success) throw new Error(result?.message || 'Profile update failed');
      toast({ title: 'Profile updated', status: 'success', duration: 2400 });
      editDisclosure.onClose();
    } catch (error) {
      toast({ title: 'Could not update profile', description: error.message || 'Please try again.', status: 'error', duration: 3600 });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  return (
    <Box bg={theme.page} minH="calc(100vh - 92px)" mx={-3} mt={-4}>
      <Box bg={`linear-gradient(180deg, ${theme.navy} 0%, ${theme.navyLight} 100%)`} color="white" px={4} pt={5} pb="76px" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} opacity={0.14} bg="radial-gradient(circle at 30% 30%, white 1px, transparent 1.5px)" backgroundSize="34px 34px" />
        <VStack spacing={2} mt={0} position="relative">
          <Box position="relative">
            <Avatar size="xl" name={fullName} bg="white" color={theme.navy} borderWidth="4px" borderColor="white" boxShadow="0 14px 28px rgba(0,0,0,0.22)" />
            <IconButton aria-label="Edit profile" icon={<FiEdit3 />} size="xs" position="absolute" right="-2px" bottom="4px" borderRadius="full" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} onClick={openEdit} />
          </Box>
          <Text fontSize="17px" fontWeight="900" lineHeight="1">{fullName}</Text>
          <Text fontSize="11px" color={theme.gold} fontWeight="900">{role}</Text>
          <Text fontSize="10px" color="rgba(255,255,255,0.78)" fontWeight="700">{department}</Text>
        </VStack>
      </Box>

      <Box px={3} mt="-58px" position="relative" zIndex={1}>
        <Flex
          align="center"
          gap={2}
          bg="white"
          borderRadius="18px"
          px={3}
          py={2.5}
          minH="62px"
          borderWidth="1px"
          borderColor={theme.border}
          boxShadow="0 14px 30px rgba(8, 26, 52, 0.1)"
        >
          <StatCard icon={FiTarget} label="Target Achievement" value={`${completion}%`} detail="Profile data" color={theme.blue} bg="#EAF2FF" />
          <StatDivider />
          <StatCard icon={FiTrendingUp} label="Deals Closed" value="Not set" detail="This Month" color={theme.green} bg="#EAF8F0" />
          <StatDivider />
          <StatCard icon={FiAward} label="Rank" value="Not set" detail="In Team" color={theme.gold} bg={theme.goldSoft} />
        </Flex>

        <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8,26,52,0.05)">
          <Text fontSize="13px" color={theme.ink} fontWeight="900" mb={1}>Account Information</Text>
          <AccountRow icon={FiUser} label="Full Name" value={fullName} />
          <AccountRow icon={FiMail} label="Email" value={email} />
          <AccountRow icon={FiPhone} label="Phone" value={phone} />
          <AccountRow icon={FiBriefcase} label="Position" value={role} />
          <AccountRow icon={FiUsers} label="Department" value={department} />
          <AccountRow icon={FiMapPin} label="Location" value={location} />
        </Box>

        <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8,26,52,0.05)">
          <Text fontSize="13px" color={theme.ink} fontWeight="900" mb={3}>Performance Overview</Text>
          <Flex align="center" gap={4}>
            <CircularProgress value={completion} color={theme.blue} trackColor="#EAF2FF" size="70px" thickness="12px">
              <CircularProgressLabel fontSize="14px" color={theme.blue} fontWeight="900">{completion}%</CircularProgressLabel>
            </CircularProgress>
            <Box flex="1" minW={0}>
              <Text fontSize="12px" color={theme.ink} fontWeight="900">Monthly Target Achievement</Text>
              <Text fontSize="10px" color={theme.green} fontWeight="900">+{Math.max(completion - 70, 0)}% vs Last Month</Text>
            </Box>
            <HStack align="flex-end" spacing={2} h="70px">
              {[28, 44, 34, 52, 46, 66].map((height, index) => (
                <Box key={index} w="9px" h={`${height}px`} borderRadius="full" bg={index === 5 ? theme.blue : '#BBD0FF'} />
              ))}
            </HStack>
          </Flex>
        </Box>

        <Box bg="white" borderRadius="16px" p={4} mt={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8,26,52,0.05)">
          <Flex align="center" justify="space-between" mb={3}>
            <Box>
              <Text fontSize="13px" color={theme.ink} fontWeight="900">Quick Links</Text>
              <Text fontSize="10px" color={theme.muted} fontWeight="700">Fast access to your sales workspace</Text>
            </Box>
          </Flex>
          <SimpleGrid columns={4} spacing={3}>
            <QuickLink icon={FiFileText} label="Documents" color={theme.navy} bg="#EAF2FF" onClick={() => navigate('/employee-file-upload')} />
            <QuickLink icon={FiTarget} label="My Goals" color={theme.gold} bg={theme.goldSoft} onClick={() => toast({ title: 'Goals', description: 'Goals view will be connected here.', status: 'info', duration: 2200 })} />
            <QuickLink icon={FiUsers} label="Team Members" color={theme.green} bg="#EAF8F0" onClick={() => toast({ title: 'Team', description: 'Team member view will be connected here.', status: 'info', duration: 2200 })} />
            <QuickLink icon={FiAward} label="Achievements" color="#7C3AED" bg="#F3ECFF" onClick={() => toast({ title: 'Achievements', description: 'Achievements view will be connected here.', status: 'info', duration: 2200 })} />
          </SimpleGrid>
        </Box>

        <Box bg="white" borderRadius="16px" p={4} mt={4} mb={4} borderWidth="1px" borderColor={theme.border} boxShadow="0 10px 26px rgba(8,26,52,0.05)">
          <ActionRow icon={FiHelpCircle} label="Help & Support" onClick={() => toast({ title: 'Support', description: 'Support center will be connected here.', status: 'info', duration: 2200 })} />
          <ActionRow icon={FiLogOut} label="Log Out" color="#DC2626" onClick={handleLogout} />
        </Box>
      </Box>

      <Modal isOpen={editDisclosure.isOpen} onClose={() => !saving && editDisclosure.onClose()} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.42)" />
        <ModalContent as="form" onSubmit={handleSave} mt="auto" mb={0} mx={0} maxH="90vh" borderTopRadius="24px" borderBottomRadius={0} bg={theme.page} overflow="hidden">
          <ModalHeader bg={theme.navy} color="white" px={5} py={5}>
            <Text fontSize="20px" fontWeight="900">Edit Profile</Text>
            <Text fontSize="12px" color="rgba(255,255,255,0.72)" fontWeight="700">Update precise account information.</Text>
          </ModalHeader>
          <ModalBody px={5} py={4} overflowY="auto">
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Full name</FormLabel>
                <Input name="fullName" value={profileForm.fullName} onChange={handleChange} bg="white" borderColor={theme.border} h="46px" borderRadius="12px" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Email</FormLabel>
                <Input name="email" type="email" value={profileForm.email} onChange={handleChange} bg="white" borderColor={theme.border} h="46px" borderRadius="12px" />
              </FormControl>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Phone</FormLabel>
                  <Input name="phone" value={profileForm.phone} onChange={handleChange} bg="white" borderColor={theme.border} h="44px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Location</FormLabel>
                  <Input name="location" value={profileForm.location} onChange={handleChange} bg="white" borderColor={theme.border} h="44px" borderRadius="12px" />
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Position</FormLabel>
                  <Input name="jobTitle" value={profileForm.jobTitle} onChange={handleChange} bg="white" borderColor={theme.border} h="44px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Department</FormLabel>
                  <Input name="department" value={profileForm.department} onChange={handleChange} bg="white" borderColor={theme.border} h="44px" borderRadius="12px" />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontSize="12px" color={theme.ink} fontWeight="900">Notes</FormLabel>
                <Textarea name="notes" value={profileForm.notes} onChange={handleChange} bg="white" borderColor={theme.border} borderRadius="12px" rows={4} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter px={5} py={4} bg="white" borderTopWidth="1px" borderTopColor={theme.border} gap={3}>
            <Button flex={1} h="46px" borderRadius="12px" variant="ghost" color={theme.muted} onClick={editDisclosure.onClose} isDisabled={saving}>Cancel</Button>
            <Button flex={1} h="46px" borderRadius="12px" bg={theme.gold} color="white" _hover={{ bg: '#C98D00' }} type="submit" isLoading={saving}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileProfile;
