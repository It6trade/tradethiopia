import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Text,
  VStack,
  Divider,
  Flex,
  Image,
  Alert,
  AlertIcon,
  Heading,
  Stack,
  useBreakpointValue,
  Switch,
  Input,
  Box,
  useToast, InputGroup, InputLeftElement,
} from "@chakra-ui/react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaLanguage,
  FaFileAlt,
  FaInfoCircle,
  FaPrint,
  FaIdCard,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useUserStore } from '../store/user';

const UserDetailDrawer = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [updatedUser, setUpdatedUser] = useState(user);
  const drawerSize = useBreakpointValue({ base: "full", md: "md" });
  const toast = useToast();
  const blinkingStyle = {
    animation: 'blink 1s infinite',
};

  const formatSalary = (value) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return "N/A";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  };

  const salaryLabel = formatSalary(user.salary);


  // Local state to manage editable fields
  const { deleteUser, updateUser, fetchUsers } = useUserStore();
  const [infoStatus, setInfoStatus] = useState(user.infoStatus);
  const [trainingStatus, setTrainingStatus] = useState(user.trainingStatus);
  const [hireDate, setHireDate] = useState(user.hireDate ? new Date(user.hireDate).toISOString().split("T")[0] : "");

  useEffect(() => {
    setInfoStatus(user.infoStatus);
    setTrainingStatus(user.trainingStatus);
    setHireDate(user.hireDate ? new Date(user.hireDate).toISOString().split("T")[0] : "");
  }, [user]);

  // Function to handle print
  const handlePrint = () => {
    window.print();
  };

  const handleUpdateUser = async () => {
    const { success } = await updateUser(user._id, updatedUser);
    toast({
      title: success ? 'Success' : 'Error',
      description: success ? "User updated successfully" : "Failed to update user",
      status: success ? 'success' : 'error',
      duration: 3000,
      isClosable: true,
    });

    if (success) onEditClose();
    await fetchUsers();
  };


  const toggleInfoStatus = async () => {
    const newInfoStatus = user.infoStatus === 'active' ? 'inactive' : 'active';
    const { success } = await updateUser(user._id, { ...updatedUser, infoStatus: newInfoStatus });
    toast({
      title: success ? 'Success' : 'Error',
      description: success ? `Info status updated to ${newInfoStatus}` : "Failed to update info status",
      status: success ? 'success' : 'error',
      duration: 3000,
      isClosable: true,
    });

    if (success) {
      setUpdatedUser({ ...updatedUser, infoStatus: newInfoStatus });
      await fetchUsers();
    }
  };

  const toggleTrainingStatus = async () => {
    const newTrainingStatus = user.trainingStatus === 'active' ? 'inactive' : 'active';
    const { success } = await updateUser(user._id, { ...updatedUser, trainingStatus: newTrainingStatus });
    toast({
      title: success ? 'Success' : 'Error',
      description: success ? `Training status updated to ${newTrainingStatus}` : "Failed to update training status",
      status: success ? 'success' : 'error',
      duration: 3000,
      isClosable: true,
    });

    if (success) {
      setUpdatedUser({ ...updatedUser, trainingStatus: newTrainingStatus });
      await fetchUsers();
    }
  };

  const handleHireDateChange = async (e) => {
    const newDate = e.target.value;
    const { success } = await onUpdateUser(user._id, { hireDate: newDate });

    toast({
      title: success ? 'Success' : 'Error',
      description: success ? "Hire date updated successfully" : "Failed to update hire date",
      status: success ? 'success' : 'error',
      duration: 3000,
      isClosable: true,
    });

    if (success) {
      setHireDate(newDate); // Update local state if the API call is successful
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent bg="gray.50">
        <DrawerHeader borderBottomWidth="1px" bg="blue.600" color="white" px={6} py={4}>
          <Heading size="lg">User Details</Heading>
        </DrawerHeader>
        <DrawerBody px={6} py={4}>
          <VStack spacing={6} align="start">
            {/* Profile Image and Guarantor File Button */}
            <Flex
              w="full"
              justify="space-between"
              align="center"
              bg="white"
              borderRadius="lg"
              p={4}
              shadow="md"
            >
              <Flex align="center" gap={4}>
                {user.photo ? (
                  <Image
                    borderRadius="full"
                    boxSize="100px"
                    src={user.photoUrl || `${import.meta.env.VITE_API_URL}/uploads/${user.photo}`}
                    alt={`${user.fullName}'s photo`}
                    objectFit="cover"
                  />
                ) : (
                  <Alert status="warning" width="50%">
                    <AlertIcon />
                    No photo
                  </Alert>
                )}

                <Flex direction="row" align="center" gap={2}>
                  <FaBriefcase />
                  {/* Status Indicator Dot */}
                  {/* <Box
                w={3}
                h={3}
                borderRadius="full"
                bg={
                    user.status === 'Active'
                        ? 'green.400' // Green for active users
                        : user.status === 'Inactive'
                        ? 'gray.400' // Grey for inactive users
                        : 'gray.400' // Gray for unknown or other statuses
                }
                border="2px solid white" // Optional border for aesthetics
            /> */}
                  <Text
                    fontSize="sm"
                    color={
                      user.status === 'Active'
                        ? 'green.500' // Green text for active
                        : user.status === 'Inactive'
                          ? 'gray.600' // Grey text for inactive
                          : 'gray.600' // Gray for unknown or other statuses
                    }
                  >
                    {user.status || "N/A"}
                  </Text>
                </Flex>
              </Flex>

              {user.guarantorFile ? (
                <Button
                  as="a"
                  href={user.guarantorFileUrl || `${import.meta.env.VITE_API_URL}/uploads/${user.guarantorFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="teal"
                  size="sm"
                >
                  View Guarantor File
                </Button>
              ) : (
                <Alert status="warning" width="50%">
                  <AlertIcon />
                  No guarantor file available.
                </Alert>
              )}
            </Flex>


            {/* User Information */}
            <Stack
              w="full"
              spacing={4}
              bg="white"
              borderRadius="lg"
              p={4}
              shadow="md"
            >
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {user.fullName || "N/A"}
              </Text>
              <Divider />
              <Flex direction="row" align="center" gap={4}>
                <FaUser />
                <Text fontSize="sm" color="gray.600">
                  <strong>Username:</strong> {user.username || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaEnvelope />
                <Text fontSize="sm" color="gray.600">
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${user.email}`} style={{ color: "#3182ce" }}>
                    {user.email || "N/A"}
                  </a>
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaPhone />
                <Text fontSize="sm" color="gray.600">
                  <strong>Phone:</strong> {user.phone || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaUser />
                <Text fontSize="sm" color="gray.600">
                  <strong>Gender:</strong> {user.gender || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaGraduationCap />
                <Text fontSize="sm" color="gray.600">
                  <strong>Education:</strong> {user.education || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaBriefcase />
                <Text fontSize="sm" color="gray.600">
                  <strong>Job Title:</strong> {user.jobTitle || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaMoneyBillWave />
                <Text fontSize="sm" color="gray.600">
                  <strong>Salary:</strong> {salaryLabel}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaLanguage />
                <Text fontSize="sm" color="gray.600">
                  <strong>Additional Languages:</strong> {user.additionalLanguages || "N/A"}
                </Text>
              </Flex>

              <Flex direction="row" align="center" gap={4}>
            <Flex direction="row" align="center" gap={4}>
                <FaInfoCircle style={infoStatus === 'pending' ? blinkingStyle : {}} />
                <Text fontSize="sm" color="gray.600">
                    <strong>Info Status:</strong>
                    <Switch
                        isChecked={infoStatus === 'active'}
                        onChange={toggleInfoStatus}
                        size="sm"
                        colorScheme="teal"
                        ml={2}
                    />
                </Text>
            </Flex>
            {infoStatus === 'pending' && (
                <Text fontSize="sm" color="yellow.500">
                    Pending...
                </Text>
            )}
        </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaInfoCircle />
                <Text fontSize="sm" color="gray.600">
                  <strong>Training Status:</strong>
                  <Switch
                    isChecked={trainingStatus === 'active'}
                    onChange={toggleTrainingStatus}
                    size="sm"
                    colorScheme="teal"
                    ml={2}
                  />
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaCalendarAlt />
                <Text fontSize="sm" color="gray.600" fontWeight="bold">
                  Hire Date:
                </Text>
                <InputGroup size="sm" width="auto">
                  <InputLeftElement pointerEvents="none">

                  </InputLeftElement>
                  <Input
                    type="date"
                    value={hireDate}
                    onChange={handleHireDateChange}
                  />
                </InputGroup>
              </Flex>

              <Flex direction="row" align="center" gap={4}>
                <FaMapMarkerAlt />
                <Text fontSize="sm" color="gray.600">
                  <strong>Address:</strong> {user.location || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaPhone />
                <Text fontSize="sm" color="gray.600">
                  <strong>Emergency Contact:</strong> {user.altPhone || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaIdCard />
                <Text fontSize="sm" color="gray.600">
                  <strong>
                    digitalId:</strong> {user.
                      digitalId || "N/A"}
                </Text>
              </Flex>
              <Flex direction="row" align="center" gap={4}>
                <FaInfoCircle />
                <Text fontSize="sm" color="gray.600">
                  <strong>Employment Type:</strong> {user.employmentType || "N/A"}
                </Text>
              </Flex>

              <Flex direction="row" align="center" gap={4}>
                <FaFileAlt />
                <Text fontSize="sm" color="gray.600">
                  <strong>Notes:</strong> {user.notes || "N/A"}
                </Text>
              </Flex>
            </Stack>

            {/* Print and Close Buttons */}
            <Flex w="full" justify="space-between" mt={4} className="print-hidden">
              <Button
                onClick={handlePrint}
                colorScheme="green"
                size="lg"
                leftIcon={<FaPrint />}
                w="40%"
              >
                Print
              </Button>

              <Button
                onClick={onClose}
                colorScheme="blue"
                size="lg"
                w="40%"
                variant="outline"
                borderRadius="md"
                fontWeight="bold"
                shadow="md"
              >
                Close
              </Button>
            </Flex>
          </VStack>
        </DrawerBody>
      </DrawerContent>
      <style>{`
        @media print {
          .print-hidden {
            display: none;
          }
        }
      `}</style>
    </Drawer>
  );
};

export default UserDetailDrawer;
