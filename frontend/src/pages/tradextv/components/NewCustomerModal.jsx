import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  CheckboxGroup,
  Stack,
  Checkbox,
  Grid,
  Select,
  Textarea
} from '@chakra-ui/react';

const NewCustomerModal = ({
  isOpen,
  onClose,
  newCustomerForm,
  setNewCustomerForm,
  serviceOptions,
  isSavingFollowup,
  handleNewCustomerSubmit
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New customer follow-up</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Customer name</FormLabel>
              <Input
                value={newCustomerForm.customer}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, customer: e.target.value }))}
                placeholder="e.g., New marketplace seller"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Request / brief</FormLabel>
              <Input
                value={newCustomerForm.subject}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="What is the customer asking for?"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Services needed</FormLabel>
              <CheckboxGroup
                value={newCustomerForm.services}
                onChange={(values) => setNewCustomerForm((p) => ({ ...p, services: values }))}
              >
                <Stack spacing={2} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
                  {serviceOptions.map((service) => (
                    <Checkbox key={service} value={service}>
                      {service}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={newCustomerForm.status}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={newCustomerForm.priority}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, priority: e.target.value }))}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Follow-up date</FormLabel>
                <Input
                  type="date"
                  value={newCustomerForm.date}
                  onChange={(e) => setNewCustomerForm((p) => ({ ...p, date: e.target.value }))}
                />
              </FormControl>
            </Grid>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={newCustomerForm.notes}
                onChange={(e) => setNewCustomerForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Context for the creative team (links, goals, etc.)"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleNewCustomerSubmit}
            isDisabled={!newCustomerForm.customer.trim() || isSavingFollowup}
            isLoading={isSavingFollowup}
          >
            Add customer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewCustomerModal;
