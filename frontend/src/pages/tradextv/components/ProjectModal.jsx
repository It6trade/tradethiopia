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
  Select,
  Textarea
} from '@chakra-ui/react';

const ProjectModal = ({
  isOpen,
  onClose,
  projectForm,
  setProjectForm,
  handleAddProject
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add project</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Project name</FormLabel>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Launch video sprint"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Owner</FormLabel>
              <Input
                value={projectForm.owner}
                onChange={(e) => setProjectForm((p) => ({ ...p, owner: e.target.value }))}
                placeholder="Who owns it?"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Scope, deliverables, or notes for the team"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Due date</FormLabel>
              <Input
                type="date"
                value={projectForm.dueDate}
                onChange={(e) => setProjectForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={projectForm.status}
                onChange={(e) => setProjectForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleAddProject}
            isDisabled={!projectForm.name.trim() || !projectForm.owner.trim() || !projectForm.dueDate}
          >
            Save project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProjectModal;
