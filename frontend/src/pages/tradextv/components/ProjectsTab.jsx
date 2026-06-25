import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';

const ProjectsTab = ({
  cardBg,
  borderColor,
  mutedTextColor,
  projectFilters,
  setProjectFilters,
  filteredProjects,
  handleProjectStatusChange,
  onOpenProjectModal
}) => {
  return (
    <Box 
      bg={cardBg}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
      mb={8}
    >
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">Projects</Heading>
          <Text color={mutedTextColor}>Track current work, update status, and add new projects quickly.</Text>
        </Box>
        <Button colorScheme="purple" size="sm" onClick={onOpenProjectModal}>
          Add project
        </Button>
      </Flex>
      <Flex gap={3} wrap="wrap" mb={4}>
        <FormControl maxW="240px">
          <FormLabel fontSize="sm">Search</FormLabel>
          <Input
            size="sm"
            placeholder="Search name or owner"
            value={projectFilters.search}
            onChange={(e) => setProjectFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </FormControl>
        <FormControl maxW="180px">
          <FormLabel fontSize="sm">Status</FormLabel>
          <Select
            size="sm"
            value={projectFilters.status}
            onChange={(e) => setProjectFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </Select>
        </FormControl>
        <FormControl maxW="200px">
          <FormLabel fontSize="sm">Sort</FormLabel>
          <Select
            size="sm"
            value={projectFilters.sort}
            onChange={(e) => setProjectFilters((p) => ({ ...p, sort: e.target.value }))}
          >
            <option value="dueAsc">Due date (soonest)</option>
            <option value="dueDesc">Due date (latest)</option>
            <option value="name">Name</option>
          </Select>
        </FormControl>
      </Flex>
      <Box>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th>Due</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredProjects.length === 0 ? (
              <Tr>
                <Td colSpan={4}>
                  <Text color={mutedTextColor}>No projects match your filters.</Text>
                </Td>
              </Tr>
            ) : filteredProjects.map((proj) => (
              <Tr key={proj.id}>
                <Td fontWeight="semibold">{proj.name}</Td>
                <Td>{proj.owner}</Td>
                <Td>
                  <Select
                    size="sm"
                    value={proj.status}
                    onChange={(e) => handleProjectStatusChange(proj.id, e.target.value)}
                  >
                    <option>In Progress</option>
                    <option>Review</option>
                    <option>Completed</option>
                  </Select>
                </Td>
                <Td>{proj.dueDate}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default ProjectsTab;
