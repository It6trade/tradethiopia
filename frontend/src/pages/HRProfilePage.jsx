// File: src/pages/HRProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  VStack,
  HStack,
  Avatar,
  Badge,
  Button,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  Switch,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Link,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiSend,
  FiEdit,
  FiEdit2,
  FiEdit3,
  FiCamera,
  FiCheckCircle,
  FiShield,
  FiLock,
  FiClock,
  FiActivity,
  FiMessageSquare,
  FiFileText,
  FiCheck,
  FiShare2,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiAward,
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiExternalLink,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useUserStore, normalizeRole } from '../store/user';
import axiosInstance from '../services/axiosInstance';

/* ─── Default Sample Activity Stream ─── */
const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'edit',
    icon: FiEdit,
    iconColor: 'blue.500',
    title: "Edited records in 'Workforce / Employee Directory'",
    description: 'Updated department classifications and verified digital credentials for 3 new team members.',
    signature: 'HR Operations',
    author: 'Dessie Ashagrie',
    date: '2026-08-18',
    category: 'Workforce',
  },
  {
    id: 'act-2',
    type: 'comment',
    icon: FiMessageSquare,
    iconColor: 'purple.500',
    title: "New comment in project 'Initiative - Onboarding 2026'",
    quote: "Ready for roll-out to technical recruits. Let's sync on the timeline before deployment.",
    author: 'Dessie Ashagrie',
    signature: 'Philip',
    date: '2026-08-17',
    category: 'Training',
  },
  {
    id: 'act-3',
    type: 'create',
    icon: FiFileText,
    iconColor: 'green.500',
    title: "New document uploaded: 'Trade Ethiopia - Annual Leave Guidelines 2026'",
    description: 'Uploaded official policy document to company archive and notified department leads.',
    author: 'Dessie Ashagrie',
    date: '2026-08-16',
    category: 'Documents',
  },
  {
    id: 'act-4',
    type: 'approval',
    icon: FiCheckCircle,
    iconColor: 'teal.500',
    title: 'Approved Leave Requests for Operations Team',
    description: 'Reviewed and approved 4 pending leave applications for the upcoming holiday cycle.',
    author: 'Dessie Ashagrie',
    date: '2026-08-15',
    category: 'Approvals',
  },
  {
    id: 'act-5',
    type: 'comment',
    icon: FiMessageSquare,
    iconColor: 'purple.500',
    title: "New comment in project 'Quarterly Review'",
    quote: 'Performance matrices have been aligned with standard KPI metrics across all teams.',
    author: 'Dessie Ashagrie',
    signature: 'Philip',
    date: '2026-08-14',
    category: 'Performance',
  },
  {
    id: 'act-6',
    type: 'edit',
    icon: FiEdit,
    iconColor: 'blue.500',
    title: "Updated payroll parameters in 'Finance / Payroll Module'",
    description: 'Synced attendance deduction adjustments for mid-month review.',
    author: 'Dessie Ashagrie',
    date: '2026-08-12',
    category: 'Finance',
  },
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
];

export default function HRProfilePage() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // User state from store
  const currentUser = useUserStore((state) => state.currentUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const refreshCurrentUser = useUserStore((state) => state.refreshCurrentUser);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const accentColor = '#2d6a4f';
  const quoteBg = useColorModeValue('gray.50', 'rgba(255,255,255,0.04)');
  const tagBg = useColorModeValue('green.50', 'rgba(45,106,79,0.2)');
  const tagColor = useColorModeValue('green.700', 'green.200');

  // Disclosures for Quick Edit Modals
  const {
    isOpen: isAboutOpen,
    onOpen: onAboutOpen,
    onClose: onAboutClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();
  const {
    isOpen: isPhotoOpen,
    onOpen: onPhotoOpen,
    onClose: onPhotoClose,
  } = useDisclosure();

  // Active Main Tab State
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Activity Stream State
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('hr_profile_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });
  const [activityFilter, setActivityFilter] = useState('all');
  const [newActivityText, setNewActivityText] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState('Workforce');

  // Profile Form State - initialized synchronously with cached user to eliminate mount flash
  const [formData, setFormData] = useState(() => {
    const user = currentUser || useUserStore.getState().currentUser || {};
    return {
      fullName: user.fullName || user.username || 'Dessie Ashagrie',
      username: user.username || 'dessie_hr',
      email: user.email || '',
      altEmail: user.altEmail || '',
      phone: user.phone || '+251 91 123 4567',
      altPhone: user.altPhone || '',
      jobTitle: user.jobTitle || 'Lead HR Specialist & People Operations',
      department: user.department || 'Human Resources',
      location: user.location || 'Addis Ababa, Ethiopia',
      gender: user.gender || 'male',
      bio:
        user.bio ||
        'Lead HR Specialist & People Operations at Trade Ethiopia. Passionate about organizational scaling and employee development.',
      website: user.website || 'https://tradethiopia.com/hr',
      twitter: user.twitter || '@tradethiopia_hr',
      linkedin: user.linkedin || 'in/dessie-ashagrie',
      facebook: user.facebook || 'TradeEthiopiaHR',
      telegram: user.telegram || '@dessie_hr',
      photoUrl: user.photoUrl || user.photo || '',
    };
  });

  // Password Security Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    leaveRequests: true,
    payrollReminders: true,
    newHireAnnouncements: true,
    systemUpdates: false,
  });

  // Compute sanitized photo URL to prevent empty-string image fetch flickering
  const rawPhotoUrl = formData.photoUrl || currentUser?.photoUrl || currentUser?.photo;
  const safePhotoUrl =
    rawPhotoUrl &&
    typeof rawPhotoUrl === 'string' &&
    rawPhotoUrl.trim() !== '' &&
    rawPhotoUrl !== 'null' &&
    rawPhotoUrl !== 'undefined'
      ? rawPhotoUrl
      : undefined;

  // Populate form with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => {
        const nextPhoto = currentUser.photoUrl || currentUser.photo || '';
        if (
          prev.username === (currentUser.username || '') &&
          prev.email === (currentUser.email || '') &&
          prev.fullName === (currentUser.fullName || currentUser.username || '') &&
          prev.photoUrl === nextPhoto &&
          prev.jobTitle === (currentUser.jobTitle || 'Lead HR Specialist & People Operations') &&
          prev.department === (currentUser.department || 'Human Resources')
        ) {
          return prev;
        }
        return {
          fullName: currentUser.fullName || currentUser.username || '',
          username: currentUser.username || '',
          email: currentUser.email || '',
          altEmail: currentUser.altEmail || '',
          phone: currentUser.phone || '+251 91 123 4567',
          altPhone: currentUser.altPhone || '',
          jobTitle: currentUser.jobTitle || 'Lead HR Specialist & People Operations',
          department: currentUser.department || 'Human Resources',
          location: currentUser.location || 'Addis Ababa, Ethiopia',
          gender: currentUser.gender || 'male',
          bio:
            currentUser.bio ||
            'Lead HR Specialist & People Operations at Trade Ethiopia. Experienced in talent acquisition, workforce planning, organizational development, and high-performance culture.',
          website: currentUser.website || 'https://tradethiopia.com/hr',
          twitter: currentUser.twitter || '@tradethiopia_hr',
          linkedin: currentUser.linkedin || 'in/dessie-ashagrie',
          facebook: currentUser.facebook || 'TradeEthiopiaHR',
          telegram: currentUser.telegram || '@dessie_hr',
          photoUrl: nextPhoto,
        };
      });
    }
  }, [currentUser]);

  // Sync fresh data once on mount
  useEffect(() => {
    refreshCurrentUser?.();
  }, []);

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem('hr_profile_activities', JSON.stringify(activities));
  }, [activities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser?._id) {
      toast({
        title: 'Error',
        description: 'No active session found. Please re-login.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        altEmail: formData.altEmail,
        phone: formData.phone,
        altPhone: formData.altPhone,
        jobTitle: formData.jobTitle,
        department: formData.department,
        location: formData.location,
        gender: formData.gender,
        bio: formData.bio,
        website: formData.website,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        facebook: formData.facebook,
        telegram: formData.telegram,
        photo: formData.photoUrl,
      };

      const result = await updateUser(currentUser._id, payload);
      if (result.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your HR profile details have been saved successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });

        // Add an activity record
        const newAct = {
          id: `act-${Date.now()}`,
          type: 'edit',
          icon: FiEdit,
          iconColor: 'blue.500',
          title: 'Updated HR Profile details and contact channels',
          description: 'Modified public bio, phone, and professional link information.',
          author: formData.fullName || formData.username,
          date: new Date().toISOString().split('T')[0],
          category: 'Profile',
        };
        setActivities((prev) => [newAct, ...prev]);
      } else {
        throw new Error(result.message || 'Failed to update');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not save profile changes.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick About Save from Modal
  const handleSaveAboutModal = async () => {
    await handleSaveProfile();
    onAboutClose();
  };

  // Quick Details Save from Modal
  const handleSaveDetailsModal = async () => {
    await handleSaveProfile();
    onDetailsClose();
  };

  // Handle Photo File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploadingPhoto(true);

    // Read as Data URL for immediate local preview and fallback
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target.result;
      setFormData((prev) => ({ ...prev, photoUrl: base64Url }));

      const uploadData = new FormData();
      uploadData.append('photo', file);

      try {
        const res = await axiosInstance.post('/infoupload/upload-info', uploadData);
        if (res.data && res.data.success && res.data.user) {
          const finalUrl = res.data.user.photoUrl || res.data.user.photo || base64Url;
          setFormData((prev) => ({ ...prev, photoUrl: finalUrl }));
          await updateUser(currentUser._id, { photo: res.data.user.photo || finalUrl });
        } else {
          await updateUser(currentUser._id, { photo: base64Url });
        }
        toast({
          title: 'Photo Uploaded',
          description: 'Your profile picture has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      } catch {
        // Direct update fallback
        await updateUser(currentUser._id, { photo: base64Url });
        toast({
          title: 'Photo Saved',
          description: 'Profile avatar updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      } finally {
        setIsUploadingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onPhotoClose();
      }
    };
    reader.readAsDataURL(file);
  };

  // Choose preset avatar
  const handleSelectPreset = async (url) => {
    setFormData((prev) => ({ ...prev, photoUrl: url }));
    try {
      await updateUser(currentUser._id, { photo: url });
      toast({
        title: 'Avatar Selected',
        description: 'Preset avatar applied to your profile.',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err) {
      toast({
        title: 'Failed to update avatar',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    onPhotoClose();
  };

  // Add custom activity
  const handleAddActivity = () => {
    if (!newActivityText.trim()) return;
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'comment',
      icon: FiMessageSquare,
      iconColor: 'purple.500',
      title: `HR Status Update: ${newActivityCategory}`,
      quote: newActivityText.trim(),
      author: formData.fullName || formData.username,
      signature: formData.username || 'HR',
      date: new Date().toISOString().split('T')[0],
      category: newActivityCategory,
    };
    setActivities([newAct, ...activities]);
    setNewActivityText('');
    toast({
      title: 'Activity Posted',
      description: 'Your status update has been added to the activity timeline.',
      status: 'success',
      duration: 2500,
      isClosable: true,
    });
  };

  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'New password must be at least 6 characters.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Mismatch',
        description: 'New password and confirmation do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await axiosInstance.put(`/users/${currentUser._id}`, {
        password: passwordData.newPassword,
      });
      if (res.data && res.data.success) {
        toast({
          title: 'Password Updated',
          description: 'Your security credentials have been updated.',
          status: 'success',
          duration: 3500,
          isClosable: true,
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(res.data?.message || 'Password update failed');
      }
    } catch (err) {
      toast({
        title: 'Update Error',
        description: err.response?.data?.message || err.message || 'Could not change password.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Filtered activities
  const filteredActivities = activities.filter((act) => {
    if (activityFilter === 'all') return true;
    return act.category.toLowerCase() === activityFilter.toLowerCase();
  });

  return (
    <Box maxW="1400px" mx="auto" pb={12} pt={2} px={{ base: 2, md: 4 }}>
      {/* Hidden File Input (Always mounted for Modal and Form access) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ─── Top Banner / Breadcrumb Bar ─── */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
        mb={6}
      >
        <Box>
          <HStack spacing={2} mb={1}>
            <Heading size="lg" fontWeight="800" letterSpacing="tight" color={textColor}>
              {formData.fullName || 'HR Profile'}
            </Heading>
            <Badge colorScheme="green" variant="solid" borderRadius="full" px={2} py={0.5} fontSize="11px">
              Verified HR
            </Badge>
          </HStack>
          <Text fontSize="sm" color={mutedText}>
            Manage your personal profile, contact channels, public bio, and HR workspace activities.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            size="sm"
            borderRadius="lg"
            onClick={() => refreshCurrentUser?.()}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Icon as={FiEdit3} />}
            bg={accentColor}
            color="white"
            size="sm"
            borderRadius="lg"
            _hover={{ bg: '#23563f' }}
            onClick={() => setActiveTabIndex(1)}
          >
            Edit Profile
          </Button>
        </HStack>
      </Flex>

      {/* ─── Main 2-Column Grid (Left: Profile Card, Right: Tabs) ─── */}
      <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={6} alignItems="flex-start">
        {/* ══════════════ LEFT COLUMN: Profile Sidebar / Card ══════════════ */}
        <Box gridColumn={{ base: 'span 1', lg: 'span 4' }}>
          <Card
            bg={cardBg}
            borderColor={cardBorder}
            borderWidth="1px"
            borderRadius="2xl"
            boxShadow="sm"
            overflow="hidden"
          >
            {/* Top decorative accent stripe */}
            <Box h="80px" bgGradient="linear(to-r, #1a2e22, #2d6a4f, #40916c)" position="relative" />

            <CardBody pt={0} px={6} pb={6}>
              {/* Profile Avatar with Camera Upload Overlay */}
              <Flex direction="column" align="center" mt="-50px" mb={4}>
                <Box position="relative">
                  <Avatar
                    size="2xl"
                    name={formData.fullName || formData.username}
                    src={safePhotoUrl}
                    ignoreFallback={!safePhotoUrl}
                    border="4px solid"
                    borderColor={cardBg}
                    boxShadow="lg"
                    bg="#2d6a4f"
                    color="white"
                    fontSize="3xl"
                  />
                  <IconButton
                    icon={<Icon as={FiCamera} boxSize={4} />}
                    size="sm"
                    isRound
                    aria-label="Change photo"
                    position="absolute"
                    bottom="2px"
                    right="2px"
                    bg={accentColor}
                    color="white"
                    _hover={{ bg: '#1b4332', transform: 'scale(1.05)' }}
                    boxShadow="md"
                    onClick={onPhotoOpen}
                  />
                </Box>

                <Heading size="md" mt={3} textAlign="center" fontWeight="800" color={textColor}>
                  {formData.fullName || 'Dessie Ashagrie'}
                </Heading>

                <Text fontSize="13px" fontWeight="600" color={mutedText} textAlign="center" mt={0.5}>
                  {formData.jobTitle || 'HR Lead & People Ops'}
                </Text>

                <HStack spacing={2} mt={2}>
                  <Tag size="sm" bg={tagBg} color={tagColor} borderRadius="full" px={2.5}>
                    <TagLeftIcon as={FiShield} boxSize="11px" />
                    <TagLabel fontSize="11px" fontWeight="700">
                      {currentUser?.role?.toUpperCase() || 'HR'}
                    </TagLabel>
                  </Tag>
                  <Tag size="sm" colorScheme="blue" borderRadius="full" px={2.5}>
                    <TagLabel fontSize="11px">{formData.department || 'Human Resources'}</TagLabel>
                  </Tag>
                </HStack>
              </Flex>

              <Divider my={4} borderColor={cardBorder} />

              {/* ─── About Section ─── */}
              <Box mb={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider" color={mutedText}>
                    About
                  </Text>
                  <Button
                    leftIcon={<Icon as={FiEdit2} boxSize="12px" />}
                    variant="ghost"
                    size="xs"
                    color="green.500"
                    fontWeight="600"
                    onClick={onAboutOpen}
                    _hover={{ bg: useColorModeValue('green.50', 'whiteAlpha.100') }}
                  >
                    Edit about
                  </Button>
                </Flex>

                <Text
                  fontSize="13px"
                  color={textColor}
                  lineHeight="tall"
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  p={3.5}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={cardBorder}
                >
                  {formData.bio ||
                    'Lead HR Specialist & People Operations at Trade Ethiopia. Passionate about organizational scaling and employee development.'}
                </Text>
              </Box>

              <Divider my={4} borderColor={cardBorder} />

              {/* ─── Connected / Contact Channels ─── */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="wider" color={mutedText}>
                    Connected & Contact
                  </Text>
                  <Button
                    leftIcon={<Icon as={FiEdit2} boxSize="12px" />}
                    variant="ghost"
                    size="xs"
                    color="green.500"
                    fontWeight="600"
                    onClick={onDetailsOpen}
                    _hover={{ bg: useColorModeValue('green.50', 'whiteAlpha.100') }}
                  >
                    Edit details
                  </Button>
                </Flex>

                <VStack align="stretch" spacing={2.5} fontSize="13px">
                  {/* Website */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiGlobe} color="blue.400" boxSize={4} />
                      <Text fontWeight="500">Website</Text>
                    </HStack>
                    {formData.website ? (
                      <Link
                        href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                        isExternal
                        color="green.500"
                        fontWeight="600"
                        fontSize="12px"
                        maxW="160px"
                        noOfLines={1}
                      >
                        {formData.website.replace(/^https?:\/\//, '')}
                      </Link>
                    ) : (
                      <Text fontSize="12px" color="gray.400">Not set</Text>
                    )}
                  </Flex>

                  {/* LinkedIn */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiLinkedin} color="blue.600" boxSize={4} />
                      <Text fontWeight="500">LinkedIn</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.linkedin || 'in/dessie-ashagrie'}
                    </Text>
                  </Flex>

                  {/* Twitter / X */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiTwitter} color="cyan.500" boxSize={4} />
                      <Text fontWeight="500">Twitter</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.twitter || '@tradethiopia_hr'}
                    </Text>
                  </Flex>

                  {/* Facebook */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiFacebook} color="blue.500" boxSize={4} />
                      <Text fontWeight="500">Facebook</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.facebook || 'TradeEthiopiaHR'}
                    </Text>
                  </Flex>

                  {/* Telegram */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiSend} color="teal.400" boxSize={4} />
                      <Text fontWeight="500">Telegram</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.telegram || '@dessie_hr'}
                    </Text>
                  </Flex>

                  {/* Work Email */}
                  <Flex align="center" justify="space-between" pt={1}>
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiMail} color="orange.400" boxSize={4} />
                      <Text fontWeight="500">Email</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.email || 'hr@tradethiopia.com'}
                    </Text>
                  </Flex>

                  {/* Phone */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiPhone} color="green.500" boxSize={4} />
                      <Text fontWeight="500">Phone</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor}>
                      {formData.phone || '+251 91 123 4567'}
                    </Text>
                  </Flex>

                  {/* Office Location */}
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2.5} color={mutedText}>
                      <Icon as={FiMapPin} color="red.400" boxSize={4} />
                      <Text fontWeight="500">Location</Text>
                    </HStack>
                    <Text fontSize="12px" fontWeight="600" color={textColor} maxW="160px" noOfLines={1}>
                      {formData.location || 'Addis Ababa, ET'}
                    </Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Digital ID Footer */}
              <Box mt={6} p={3} bg={sectionBg} borderRadius="xl" border="1px dashed" borderColor={cardBorder}>
                <Flex justify="space-between" align="center">
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase">
                      Employee ID
                    </Text>
                    <Text fontSize="12px" fontWeight="800" color={textColor}>
                      {currentUser?.digitalId || 'TE-HR-0024'}
                    </Text>
                  </VStack>
                  <Tag size="sm" colorScheme="green" variant="subtle" borderRadius="md">
                    Active
                  </Tag>
                </Flex>
              </Box>
            </CardBody>
          </Card>
        </Box>

        {/* ══════════════ RIGHT COLUMN: Tabbed Content ══════════════ */}
        <Box gridColumn={{ base: 'span 1', lg: 'span 8' }}>
          <Card
            bg={cardBg}
            borderColor={cardBorder}
            borderWidth="1px"
            borderRadius="2xl"
            boxShadow="sm"
          >
            <Tabs
              index={activeTabIndex}
              onChange={(index) => setActiveTabIndex(index)}
              variant="line"
              colorScheme="green"
              isLazy
            >
              <TabList px={6} pt={3} borderBottomColor={cardBorder}>
                <Tab
                  fontSize="14px"
                  fontWeight="700"
                  py={3.5}
                  _selected={{ color: accentColor, borderColor: accentColor, fontWeight: '800' }}
                >
                  <HStack spacing={2}>
                    <Icon as={FiActivity} boxSize={4} />
                    <Text>Activity</Text>
                  </HStack>
                </Tab>

                <Tab
                  fontSize="14px"
                  fontWeight="700"
                  py={3.5}
                  _selected={{ color: accentColor, borderColor: accentColor, fontWeight: '800' }}
                >
                  <HStack spacing={2}>
                    <Icon as={FiEdit3} boxSize={4} />
                    <Text>Edit Profile</Text>
                  </HStack>
                </Tab>

                <Tab
                  fontSize="14px"
                  fontWeight="700"
                  py={3.5}
                  _selected={{ color: accentColor, borderColor: accentColor, fontWeight: '800' }}
                >
                  <HStack spacing={2}>
                    <Icon as={FiLock} boxSize={4} />
                    <Text>Security & Settings</Text>
                  </HStack>
                </Tab>

                <Tab
                  fontSize="14px"
                  fontWeight="700"
                  py={3.5}
                  _selected={{ color: accentColor, borderColor: accentColor, fontWeight: '800' }}
                >
                  <HStack spacing={2}>
                    <Icon as={FiBriefcase} boxSize={4} />
                    <Text>HR Overview</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels p={{ base: 4, md: 6 }}>
                {/* ─────────────────── TAB 1: ACTIVITY TIMELINE (MATCHING MOCKUP) ─────────────────── */}
                <TabPanel p={0}>
                  {/* Post Status / Note Box */}
                  <Box
                    p={4}
                    mb={6}
                    bg={sectionBg}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={cardBorder}
                  >
                    <Text fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText} mb={2}>
                      Post an Activity / HR Status Update
                    </Text>
                    <HStack spacing={3} align="flex-start">
                      <Avatar
                        size="sm"
                        name={formData.fullName || formData.username}
                        src={safePhotoUrl}
                        ignoreFallback={!safePhotoUrl}
                      />
                      <VStack flex="1" spacing={2} align="stretch">
                        <Input
                          placeholder="What did you work on or want to share? (e.g. Completed payroll review...)"
                          size="sm"
                          borderRadius="lg"
                          bg={cardBg}
                          value={newActivityText}
                          onChange={(e) => setNewActivityText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddActivity();
                            }
                          }}
                        />
                        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                          <HStack spacing={2}>
                            <Select
                              size="xs"
                              w="140px"
                              borderRadius="md"
                              value={newActivityCategory}
                              onChange={(e) => setNewActivityCategory(e.target.value)}
                            >
                              <option value="Workforce">Workforce</option>
                              <option value="Training">Training</option>
                              <option value="Documents">Documents</option>
                              <option value="Approvals">Approvals</option>
                              <option value="Performance">Performance</option>
                              <option value="Finance">Finance</option>
                            </Select>
                          </HStack>

                          <Button
                            size="xs"
                            bg={accentColor}
                            color="white"
                            borderRadius="md"
                            px={3}
                            _hover={{ bg: '#23563f' }}
                            onClick={handleAddActivity}
                            isDisabled={!newActivityText.trim()}
                          >
                            Post Log
                          </Button>
                        </Flex>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Filter bar */}
                  <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
                    <Text fontSize="sm" fontWeight="700" color={textColor}>
                      Recent Timeline Activity
                    </Text>
                    <HStack spacing={1}>
                      {['all', 'workforce', 'training', 'documents', 'approvals'].map((cat) => (
                        <Button
                          key={cat}
                          size="xs"
                          variant={activityFilter === cat ? 'solid' : 'ghost'}
                          colorScheme={activityFilter === cat ? 'green' : 'gray'}
                          borderRadius="full"
                          textTransform="capitalize"
                          onClick={() => setActivityFilter(cat)}
                        >
                          {cat}
                        </Button>
                      ))}
                    </HStack>
                  </Flex>

                  {/* Activity Feed Items */}
                  <VStack spacing={4} align="stretch">
                    {filteredActivities.length === 0 ? (
                      <Box p={8} textAlign="center" color={mutedText}>
                        <Icon as={FiClock} boxSize={8} mb={2} opacity={0.4} />
                        <Text fontSize="sm">No activities recorded for this filter.</Text>
                      </Box>
                    ) : (
                      filteredActivities.map((item) => (
                        <Box
                          key={item.id}
                          p={4}
                          bg={cardBg}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={cardBorder}
                          transition="all 0.2s"
                          _hover={{ borderColor: 'green.300', boxShadow: 'sm' }}
                        >
                          <Flex justify="space-between" align="flex-start" gap={3}>
                            <HStack spacing={3} align="flex-start" flex="1">
                              <Flex
                                w="32px"
                                h="32px"
                                borderRadius="lg"
                                bg={useColorModeValue('green.50', 'rgba(45,106,79,0.25)')}
                                align="center"
                                justify="center"
                                flexShrink={0}
                                mt={0.5}
                              >
                                <Icon as={item.icon || FiActivity} color="green.600" boxSize={4} />
                              </Flex>

                              <Box flex="1">
                                <HStack spacing={2} wrap="wrap">
                                  <Text fontSize="13px" fontWeight="700" color={textColor}>
                                    {item.title}
                                  </Text>
                                  <Tag size="sm" fontSize="10px" borderRadius="md" variant="subtle" colorScheme="gray">
                                    {item.category}
                                  </Tag>
                                </HStack>

                                {item.description && (
                                  <Text fontSize="12px" color={mutedText} mt={1} lineHeight="tall">
                                    {item.description}
                                  </Text>
                                )}

                                {item.quote && (
                                  <Box
                                    mt={2.5}
                                    p={3}
                                    bg={quoteBg}
                                    borderRadius="lg"
                                    borderLeft="3px solid #2d6a4f"
                                  >
                                    <Text fontSize="12px" fontStyle="italic" color={textColor} mb={1.5}>
                                      "{item.quote}"
                                    </Text>
                                    <HStack spacing={2}>
                                      <Avatar size="2xs" name={item.author} src={formData.photoUrl} />
                                      <Text fontSize="11px" fontWeight="700" color={mutedText}>
                                        {item.signature || item.author}
                                      </Text>
                                    </HStack>
                                  </Box>
                                )}
                              </Box>
                            </HStack>

                            <Text fontSize="11px" fontWeight="600" color={mutedText} whiteSpace="nowrap">
                              {item.date}
                            </Text>
                          </Flex>
                        </Box>
                      ))
                    )}
                  </VStack>
                </TabPanel>

                {/* ─────────────────── TAB 2: EDIT PROFILE FORM ─────────────────── */}
                <TabPanel p={0}>
                  <Box as="form" onSubmit={handleSaveProfile}>
                    <VStack spacing={6} align="stretch">
                      {/* Avatar Selection Row */}
                      <Box p={4} bg={sectionBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                        <Text fontSize="xs" fontWeight="800" textTransform="uppercase" color={mutedText} mb={3}>
                          Profile Photo & Avatar
                        </Text>
                        <Flex direction={{ base: 'column', sm: 'row' }} align="center" gap={4}>
                          <Avatar
                            size="xl"
                            name={formData.fullName || formData.username}
                            src={safePhotoUrl}
                            ignoreFallback={!safePhotoUrl}
                            border="3px solid #2d6a4f"
                          />
                          <Box flex="1">
                            <Text fontSize="13px" fontWeight="700" color={textColor} mb={1}>
                              Upload new profile image
                            </Text>
                            <Text fontSize="11px" color={mutedText} mb={3}>
                              PNG, JPG, or WEBP up to 5MB. Recommended square aspect ratio.
                            </Text>
                            <HStack spacing={2} wrap="wrap">
                              <Button
                                size="sm"
                                leftIcon={<Icon as={FiCamera} />}
                                bg={accentColor}
                                color="white"
                                borderRadius="lg"
                                _hover={{ bg: '#23563f' }}
                                isLoading={isUploadingPhoto}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Upload Photo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                onClick={onPhotoOpen}
                              >
                                Choose Preset
                              </Button>
                              {formData.photoUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  borderRadius="lg"
                                  onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                                >
                                  Remove
                                </Button>
                              )}
                            </HStack>
                          </Box>
                        </Flex>
                      </Box>

                      {/* Primary Info */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Full Name
                          </FormLabel>
                          <Input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="e.g. Dessie Ashagrie"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Username
                          </FormLabel>
                          <Input
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="e.g. dessie_hr"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Primary Work Email
                          </FormLabel>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="hr@tradethiopia.com"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Alternative Email
                          </FormLabel>
                          <Input
                            name="altEmail"
                            type="email"
                            value={formData.altEmail}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="personal@gmail.com"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Phone Number
                          </FormLabel>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="+251 91 123 4567"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Alternative Phone
                          </FormLabel>
                          <Input
                            name="altPhone"
                            value={formData.altPhone}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="+251 92 987 6543"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Job Title
                          </FormLabel>
                          <Input
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="Lead HR Specialist & People Operations"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Department
                          </FormLabel>
                          <Input
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="Human Resources"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Office Location
                          </FormLabel>
                          <Input
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                            placeholder="Addis Ababa HQ, Ethiopia"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                            Gender
                          </FormLabel>
                          <Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            borderRadius="lg"
                            fontSize="13px"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      {/* Bio / About */}
                      <FormControl>
                        <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                          About / Bio
                        </FormLabel>
                        <Textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          borderRadius="lg"
                          fontSize="13px"
                          rows={4}
                          placeholder="Tell team members and employees about your role, background, and availability..."
                        />
                        <FormHelperText fontSize="11px">
                          This summary appears on your public HR profile card.
                        </FormHelperText>
                      </FormControl>

                      {/* Social & Contact Links */}
                      <Box pt={2}>
                        <Text fontSize="xs" fontWeight="800" textTransform="uppercase" color={mutedText} mb={3}>
                          Connected Services & Social Links
                        </Text>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl>
                            <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                              Website / Portal
                            </FormLabel>
                            <InputGroup size="sm">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiGlobe} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                borderRadius="lg"
                                placeholder="https://tradethiopia.com/hr"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                              LinkedIn
                            </FormLabel>
                            <InputGroup size="sm">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiLinkedin} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                name="linkedin"
                                value={formData.linkedin}
                                onChange={handleInputChange}
                                borderRadius="lg"
                                placeholder="in/username"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                              Twitter / X
                            </FormLabel>
                            <InputGroup size="sm">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiTwitter} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                name="twitter"
                                value={formData.twitter}
                                onChange={handleInputChange}
                                borderRadius="lg"
                                placeholder="@handle"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                              Facebook
                            </FormLabel>
                            <InputGroup size="sm">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiFacebook} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                name="facebook"
                                value={formData.facebook}
                                onChange={handleInputChange}
                                borderRadius="lg"
                                placeholder="page_or_handle"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="12px" fontWeight="700" color={textColor}>
                              Telegram
                            </FormLabel>
                            <InputGroup size="sm">
                              <InputLeftElement pointerEvents="none">
                                <Icon as={FiSend} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                name="telegram"
                                value={formData.telegram}
                                onChange={handleInputChange}
                                borderRadius="lg"
                                placeholder="@username"
                              />
                            </InputGroup>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      {/* Save Profile Button */}
                      <Flex justify="flex-end" pt={4} borderTop="1px solid" borderColor={cardBorder}>
                        <Button
                          type="submit"
                          bg={accentColor}
                          color="white"
                          size="md"
                          borderRadius="lg"
                          px={8}
                          _hover={{ bg: '#23563f' }}
                          isLoading={isSaving}
                          loadingText="Saving Profile..."
                        >
                          Save Profile Changes
                        </Button>
                      </Flex>
                    </VStack>
                  </Box>
                </TabPanel>

                {/* ─────────────────── TAB 3: SECURITY & SETTINGS ─────────────────── */}
                <TabPanel p={0}>
                  <VStack spacing={6} align="stretch">
                    {/* Change Password Card */}
                    <Box p={5} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <HStack spacing={2} mb={4}>
                        <Icon as={FiLock} color="green.500" boxSize={5} />
                        <Heading size="sm" fontWeight="700" color={textColor}>
                          Change Account Password
                        </Heading>
                      </HStack>

                      <Box as="form" onSubmit={handleUpdatePassword}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                          <FormControl isRequired>
                            <FormLabel fontSize="12px" fontWeight="700">New Password</FormLabel>
                            <InputGroup size="sm">
                              <Input
                                type={showPassword.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                                }
                                borderRadius="lg"
                                placeholder="Enter at least 6 characters"
                              />
                              <InputRightElement>
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  icon={<Icon as={showPassword.new ? FiEyeOff : FiEye} />}
                                  onClick={() =>
                                    setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                                  }
                                  aria-label="Toggle password view"
                                />
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel fontSize="12px" fontWeight="700">Confirm New Password</FormLabel>
                            <InputGroup size="sm">
                              <Input
                                type={showPassword.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                  setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                                borderRadius="lg"
                                placeholder="Re-type new password"
                              />
                              <InputRightElement>
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  icon={<Icon as={showPassword.confirm ? FiEyeOff : FiEye} />}
                                  onClick={() =>
                                    setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                                  }
                                  aria-label="Toggle password view"
                                />
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>
                        </SimpleGrid>

                        <Button
                          type="submit"
                          size="sm"
                          bg={accentColor}
                          color="white"
                          borderRadius="lg"
                          _hover={{ bg: '#23563f' }}
                          isLoading={isUpdatingPassword}
                        >
                          Update Password
                        </Button>
                      </Box>
                    </Box>

                    {/* Notification Preferences */}
                    <Box p={5} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                      <HStack spacing={2} mb={4}>
                        <Icon as={FiShare2} color="teal.500" boxSize={5} />
                        <Heading size="sm" fontWeight="700" color={textColor}>
                          Notification & Workspace Alerts
                        </Heading>
                      </HStack>

                      <VStack align="stretch" spacing={3}>
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="13px" fontWeight="700" color={textColor}>
                              Leave Request Email Notifications
                            </Text>
                            <Text fontSize="11px" color={mutedText}>
                              Receive email alerts when employees submit leave requests.
                            </Text>
                          </Box>
                          <Switch
                            colorScheme="green"
                            isChecked={notifications.leaveRequests}
                            onChange={(e) =>
                              setNotifications((prev) => ({ ...prev, leaveRequests: e.target.checked }))
                            }
                          />
                        </Flex>

                        <Divider />

                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="13px" fontWeight="700" color={textColor}>
                              Monthly Payroll Deadlines
                            </Text>
                            <Text fontSize="11px" color={mutedText}>
                              Alerts for payroll review and monthly closing reminders.
                            </Text>
                          </Box>
                          <Switch
                            colorScheme="green"
                            isChecked={notifications.payrollReminders}
                            onChange={(e) =>
                              setNotifications((prev) => ({ ...prev, payrollReminders: e.target.checked }))
                            }
                          />
                        </Flex>

                        <Divider />

                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="13px" fontWeight="700" color={textColor}>
                              New Hire Onboarding Alerts
                            </Text>
                            <Text fontSize="11px" color={mutedText}>
                              Notify when candidate statuses transition to hired.
                            </Text>
                          </Box>
                          <Switch
                            colorScheme="green"
                            isChecked={notifications.newHireAnnouncements}
                            onChange={(e) =>
                              setNotifications((prev) => ({ ...prev, newHireAnnouncements: e.target.checked }))
                            }
                          />
                        </Flex>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* ─────────────────── TAB 4: HR WORKSPACE OVERVIEW ─────────────────── */}
                <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
                        <Card bg={sectionBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                          <CardBody p={4}>
                            <HStack spacing={3}>
                              <Flex w="36px" h="36px" borderRadius="lg" bg="green.100" align="center" justify="center">
                                <Icon as={FiUsers} color="green.700" boxSize={5} />
                              </Flex>
                              <Box>
                                <Text fontSize="xs" fontWeight="700" color={mutedText}>Total Employees</Text>
                                <Heading size="md" color={textColor}>240+</Heading>
                              </Box>
                            </HStack>
                          </CardBody>
                        </Card>

                        <Card bg={sectionBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                          <CardBody p={4}>
                            <HStack spacing={3}>
                              <Flex w="36px" h="36px" borderRadius="lg" bg="blue.100" align="center" justify="center">
                                <Icon as={FiCalendar} color="blue.700" boxSize={5} />
                              </Flex>
                              <Box>
                                <Text fontSize="xs" fontWeight="700" color={mutedText}>Pending Leaves</Text>
                                <Heading size="md" color={textColor}>6</Heading>
                              </Box>
                            </HStack>
                          </CardBody>
                        </Card>

                        <Card bg={sectionBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                          <CardBody p={4}>
                            <HStack spacing={3}>
                              <Flex w="36px" h="36px" borderRadius="lg" bg="purple.100" align="center" justify="center">
                                <Icon as={FiAward} color="purple.700" boxSize={5} />
                              </Flex>
                              <Box>
                                <Text fontSize="xs" fontWeight="700" color={mutedText}>Open Positions</Text>
                                <Heading size="md" color={textColor}>12</Heading>
                              </Box>
                            </HStack>
                          </CardBody>
                        </Card>

                        <Card bg={sectionBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                          <CardBody p={4}>
                            <HStack spacing={3}>
                              <Flex w="36px" h="36px" borderRadius="lg" bg="teal.100" align="center" justify="center">
                                <Icon as={FiFileText} color="teal.700" boxSize={5} />
                              </Flex>
                              <Box>
                                <Text fontSize="xs" fontWeight="700" color={mutedText}>HR Documents</Text>
                                <Heading size="md" color={textColor}>58</Heading>
                              </Box>
                            </HStack>
                          </CardBody>
                        </Card>
                      </SimpleGrid>

                      <Box p={5} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                        <Heading size="sm" fontWeight="700" color={textColor} mb={3}>
                          Role Responsibilities & Permissions
                        </Heading>
                        <VStack align="stretch" spacing={2.5} fontSize="13px" color={mutedText}>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" />
                            <Text>Full management of Employee Directory, records, and credential approvals.</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" />
                            <Text>Leave management approval authority for all department requisitions.</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" />
                            <Text>Recruitment candidate pool curation and onboarding module setup.</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" />
                            <Text>Company document archival and policy distribution rights.</Text>
                          </HStack>
                        </VStack>
                      </Box>
                    </VStack>
                  </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </Box>
      </SimpleGrid>

      {/* ══════════════ MODAL 1: Quick Edit About ══════════════ */}
      <Modal isOpen={isAboutOpen} onClose={onAboutClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={cardBg}>
          <ModalHeader fontSize="md" fontWeight="800">
            Edit About / Bio
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="12px" fontWeight="700">
                Professional Bio Summary
              </FormLabel>
              <Textarea
                rows={5}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                borderRadius="lg"
                fontSize="13px"
                placeholder="Write a concise overview of your background, experience, and HR responsibilities..."
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={3} onClick={onAboutClose}>
              Cancel
            </Button>
            <Button
              bg={accentColor}
              color="white"
              size="sm"
              borderRadius="lg"
              _hover={{ bg: '#23563f' }}
              onClick={handleSaveAboutModal}
              isLoading={isSaving}
            >
              Save About
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ══════════════ MODAL 2: Quick Edit Details / Links ══════════════ */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={cardBg}>
          <ModalHeader fontSize="md" fontWeight="800">
            Edit Contact Channels & Links
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3.5}>
              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">Website</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiGlobe} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    borderRadius="lg"
                    placeholder="https://tradethiopia.com/hr"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">LinkedIn</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiLinkedin} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.linkedin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                    borderRadius="lg"
                    placeholder="in/dessie-ashagrie"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">Twitter / X</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiTwitter} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.twitter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, twitter: e.target.value }))}
                    borderRadius="lg"
                    placeholder="@tradethiopia_hr"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">Facebook</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiFacebook} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.facebook}
                    onChange={(e) => setFormData((prev) => ({ ...prev, facebook: e.target.value }))}
                    borderRadius="lg"
                    placeholder="TradeEthiopiaHR"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">Phone</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiPhone} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    borderRadius="lg"
                    placeholder="+251 91 123 4567"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="12px" fontWeight="700">Office Location</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiMapPin} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    borderRadius="lg"
                    placeholder="Addis Ababa HQ, Ethiopia"
                  />
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" mr={3} onClick={onDetailsClose}>
              Cancel
            </Button>
            <Button
              bg={accentColor}
              color="white"
              size="sm"
              borderRadius="lg"
              _hover={{ bg: '#23563f' }}
              onClick={handleSaveDetailsModal}
              isLoading={isSaving}
            >
              Save Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ══════════════ MODAL 3: Photo / Avatar Selector ══════════════ */}
      <Modal isOpen={isPhotoOpen} onClose={onPhotoClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={cardBg}>
          <ModalHeader fontSize="md" fontWeight="800">
            Update Profile Avatar
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="full" p={4} bg={sectionBg} borderRadius="xl" textAlign="center">
                <Avatar
                  size="xl"
                  name={formData.fullName || formData.username}
                  src={safePhotoUrl}
                  ignoreFallback={!safePhotoUrl}
                  mb={3}
                  border="3px solid #2d6a4f"
                  boxShadow="md"
                />
                <Text fontSize="12px" fontWeight="700" color={textColor} mb={1}>
                  Upload from Device
                </Text>
                <Text fontSize="11px" color={mutedText} mb={3}>
                  Supports JPG, PNG, WEBP (up to 5MB)
                </Text>
                <HStack spacing={2} justify="center">
                  <Button
                    size="sm"
                    leftIcon={<Icon as={FiCamera} />}
                    bg={accentColor}
                    color="white"
                    borderRadius="lg"
                    _hover={{ bg: '#23563f' }}
                    isLoading={isUploadingPhoto}
                    loadingText="Uploading..."
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File...
                  </Button>
                  {formData.photoUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      borderRadius="lg"
                      onClick={async () => {
                        setFormData((prev) => ({ ...prev, photoUrl: '' }));
                        await updateUser(currentUser._id, { photo: '' });
                        toast({
                          title: 'Photo Removed',
                          description: 'Profile photo removed.',
                          status: 'info',
                          duration: 2000,
                          isClosable: true,
                        });
                        onPhotoClose();
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </HStack>
              </Box>

              <Box w="full">
                <Text fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText} mb={2.5}>
                  Or Choose from Avatar Presets
                </Text>
                <HStack spacing={3} justify="center" flexWrap="wrap">
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = formData.photoUrl === preset;
                    return (
                      <Avatar
                        key={idx}
                        size="md"
                        src={preset}
                        cursor="pointer"
                        border={isSelected ? '3px solid #2d6a4f' : '2px solid transparent'}
                        boxShadow={isSelected ? '0 0 0 2px rgba(45, 106, 79, 0.4)' : 'sm'}
                        _hover={{ borderColor: '#2d6a4f', transform: 'scale(1.1)' }}
                        transition="all 0.15s"
                        onClick={() => handleSelectPreset(preset)}
                      />
                    );
                  })}
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={onPhotoClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
