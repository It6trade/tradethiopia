import { useState, useEffect } from 'react';
import { Box, Button, Input, FormLabel, FormControl, Select, Textarea, Grid, useToast, useColorModeValue } from '@chakra-ui/react';
import { useUserStore } from '../store/user';
import { useNavigate } from 'react-router-dom';

const EmployeeInfoForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        altEmail: '',
        altPhone: '',
        gender: '',
        jobTitle: '',
        employmentType: '',
        education: '',
        location: '',
        phone: '',
        additionalLanguages: '',
        notes: '',
        digitalId: '', // Added digitalId
        photo: '', // Added photo
        guarantorFile: '' // Added guarantorFile
    });

    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const currentUser = useUserStore((state) => state.currentUser);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            setFormData((prevData) => ({
                ...prevData,
                fullName: currentUser.fullName || '',
                altEmail: currentUser.altEmail || '',
                altPhone: currentUser.altPhone || '',
                gender: currentUser.gender || '',
                jobTitle: currentUser.jobTitle || '',
                hireDate: currentUser.hireDate || '', // Set hireDate
                employmentType: currentUser.employmentType || '',
                education: currentUser.education || '',
                location: currentUser.location || '',
                phone: currentUser.phone || '',
                additionalLanguages: currentUser.additionalLanguages || '',
                notes: currentUser.notes || '',
                digitalId: currentUser.digitalId || '', // Set digitalId
                photo: currentUser.photo || '', // Set photo
                guarantorFile: currentUser.guarantorFile || '' // Set guarantorFile
            }));
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validate numeric fields
        if (name === 'altPhone' || name === 'phone' || name === 'digitalId') {
            // Allow only numeric input
            if (!/^\d*$/.test(value)) {
                toast({
                    title: "Invalid Input.",
                    description: `Only numbers are allowed for ${name}.`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                return; // Prevent updating the state with non-numeric values
            }
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const requiredFields = [
            'fullName', 'jobTitle', 
            'employmentType', 'education', 
            'location', 'phone'
        ];
        for (const key of requiredFields) {
            if (!formData[key]) {
                toast({
                    title: "Validation Error.",
                    description: `Please fill out the ${key}.`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        const updatedInfo = { ...formData, _id: currentUser._id };

        try {
            const response = await useUserStore.getState().updateUserInfo(updatedInfo);

            if (response.success) {
                toast({
                    title: "Profile updated.",
                    description: "Your employee profile has been updated successfully.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                resetForm();
                navigate('/employee-file-upload');
                
            } else {
                toast({
                    title: "Update failed.",
                    description: response.message || "An error occurred.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error during submission:", error);
            toast({
                title: "Error.",
                description: "An error occurred during submission.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            altEmail: '',
            altPhone: '',
            gender: '',
            jobTitle: '',
            hireDate: '',
            employmentType: '',
            education: '',
            location: '',
            phone: '',
            additionalLanguages: '',
            notes: '',
            digitalId: '',
            photo: '',
            guarantorFile: ''
        });
    };

    return (
        <Box 
            p={6} 
            shadow="lg" 
            borderWidth="1px" 
            borderRadius="lg" 
            bg={useColorModeValue('gray.50', 'gray.800')} 
            mt={6}
        >
            <form onSubmit={handleSubmit}>
                <Grid 
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
                    gap={6}
                >
                    {/* Full Name */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="fullName" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Full Name
                        </FormLabel>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            size="sm"
                        />
                    </FormControl>

                    {/* Alternative Email */}
                    <FormControl>
                        <FormLabel 
                            htmlFor="altEmail" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Alternative Email
                        </FormLabel>
                        <Input
                            id="altEmail"
                            name="altEmail"
                            type="email"
                            value={formData.altEmail}
                            onChange={handleChange}
                            placeholder="Enter your personal email"
                            size="sm"
                        />
                    </FormControl>

                    {/* Emergency Phone */}
                    <FormControl>
                        <FormLabel 
                            htmlFor="altPhone" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Emergency Phone
                        </FormLabel>
                        <Input
                            id="altPhone"
                            name="altPhone"
                            type="tel"
                            value={formData.altPhone}
                            onChange={handleChange}
                            placeholder="Enter emergency phone"
                            size="sm"
                        />
                    </FormControl>

                    {/* Gender */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="gender" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Gender
                        </FormLabel>
                        <Select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            placeholder="Select your gender"
                            size="sm"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </Select>
                    </FormControl>

                    {/* Job Title */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="jobTitle" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Job Title
                        </FormLabel>
                        <Input
                            id="jobTitle"
                            name="jobTitle"
                            type="text"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            placeholder="Enter your job title"
                            size="sm"
                        />
                    </FormControl>

                    {/* Employment Type */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="employmentType" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Employment Type
                        </FormLabel>
                        <Select
                            id="employmentType"
                            name="employmentType"
                            value={formData.employmentType}
                            onChange={handleChange}
                            placeholder="Select employment type"
                            size="sm"
                        >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="remote">Remote</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                        </Select>
                    </FormControl>

                    {/* Educational Status */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="education" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Educational Status
                        </FormLabel>
                        <Input
                            id="education"
                            name="education"
                            type="text"
                            value={formData.education}
                            onChange={handleChange}
                            placeholder="Enter your educational status"
                            size="sm"
                        />
                    </FormControl>

                    {/* Address */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="location" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Address
                        </FormLabel>
                        <Input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter your Kebele/Sub-City"
                            size="sm"
                        />
                    </FormControl>

                    {/* Phone Number */}
                    <FormControl isRequired>
                        <FormLabel 
                            htmlFor="phone" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Phone Number
                        </FormLabel>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            size="sm"
                        />
                    </FormControl>

                    {/* Additional Languages */}
                    <FormControl>
                        <FormLabel 
                            htmlFor="additionalLanguages" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Additional Languages
                        </FormLabel>
                        <Input
                            id="additionalLanguages"
                            name="additionalLanguages"
                            type="text"
                            value={formData.additionalLanguages}
                            onChange={handleChange}
                            placeholder="List any additional languages"
                            size="sm"
                        />
                    </FormControl>

                    {/* Digital ID */}
                    <FormControl>
                        <FormLabel 
                            htmlFor="digitalId" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Digital ID
                        </FormLabel>
                        <Input
                            id="digitalId"
                            name="digitalId"
                            type="text"
                            value={formData.digitalId}
                            onChange={handleChange}
                            placeholder="your digital ID FIN Number"
                            size="sm"
                        />
                    </FormControl>

                    {/* Additional Notes */}
                    <FormControl>
                        <FormLabel 
                            htmlFor="notes" 
                            fontSize="sm" 
                            fontWeight="medium" 
                            mb={1}
                        >
                            Additional Notes
                        </FormLabel>
                        <Textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Provide any additional information"
                            size="sm"
                            resize="vertical"
                        />
                    </FormControl>
                </Grid>

                <Button 
                    isLoading={isLoading} 
                    colorScheme="teal" 
                    type="submit" 
                    width="full" 
                    mt={6} 
                    size="sm"
                >
                    Next
                </Button>
            </form>
        </Box>
    );
};

export default EmployeeInfoForm;