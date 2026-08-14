import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Textarea, Select, Heading, useToast, Grid, GridItem } from '@chakra-ui/react';
import axios from '../../../../services/axiosInstance';

const CustomerFollowForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newFollowUp = {
        fullName,
        email,
        phoneNumber,
        followUpDate,
        status,
        notes,
      };

      const response = await axios.post('/followup', newFollowUp);
      console.log(response.data); // Log the response if needed

      toast({
        title: "Success",
        description: "Follow-up added successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form fields
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setFollowUpDate('');
      setStatus('');
      setNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "There was an issue adding the follow-up.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error adding follow-up:", error.response || error.message);
    }
  };

  return (
    <Box maxW={{ base: '90%', md: '800px' }} mx="auto" mt="50px" p="20px" boxShadow="md" borderRadius="md">
      <Heading mb="6" textAlign="center" color="teal.600">Add Follow-Up</Heading>
      <form onSubmit={handleSubmit}>
        <Grid
          templateColumns={{ base: '1fr', md: '1fr 1fr' }} // Stacked on small screens, two columns on larger screens
          gap={6}
        >
          <GridItem colSpan={1}>
            <FormControl id="fullName" isRequired mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Customer Name</FormLabel>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled" // Change input variant for a modern look
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={1}>
            <FormControl id="email" isRequired mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled"
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={1}>
            <FormControl id="phoneNumber" isRequired mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Phone Number</FormLabel>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled"
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={1}>
            <FormControl id="followUpDate" isRequired mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Follow-Up Date</FormLabel>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled"
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={1}>
            <FormControl id="status" isRequired mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Status</FormLabel>
              <Select
                placeholder="Select status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </Select>
            </FormControl>
          </GridItem>

          <GridItem colSpan={2}>
            <FormControl id="notes" mb="4">
              <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                focusBorderColor="teal.500"
                variant="filled"
              />
            </FormControl>
          </GridItem>
        </Grid>

        <Button type="submit" colorScheme="teal" width="full" mt="4" _hover={{ bg: "teal.600" }}>
          Add Follow-Up
        </Button>
      </form>
    </Box>
  );
};

export default CustomerFollowForm;
