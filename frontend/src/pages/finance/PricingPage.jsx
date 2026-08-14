import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Button,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Switch,
  FormControl,
  FormLabel,
  IconButton,
  Spinner,
  useToast
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { fetchExternalCourses, createExternalCourse, updateExternalCourse, deleteExternalCourse } from "../../services/api";

const emptyCourse = {
  name: "",
  description: "",
  price: "",
  isActive: true
};

const PricingPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const headerColor = useColorModeValue("teal.600", "teal.200");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyCourse);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchExternalCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Unable to load courses",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const summary = useMemo(() => {
    const active = courses.filter(c => c.isActive !== false);
    const totalPrice = active.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const avgPrice = active.length ? totalPrice / active.length : 0;
    return {
      total: courses.length,
      active: active.length,
      avgPrice
    };
  }, [courses]);

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `ETB ${num.toLocaleString()}`;
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price) || 0,
        isActive: formData.isActive
      };
      const isSeed = editingId && typeof editingId === "string" && editingId.startsWith("seed-");
      if (editingId && !isSeed) {
        await updateExternalCourse(editingId, payload);
        toast({ title: "Course updated", status: "success", duration: 2500, isClosable: true });
      } else {
        await createExternalCourse(payload);
        toast({ title: "Course added", status: "success", duration: 2500, isClosable: true });
      }
      setFormData(emptyCourse);
      setEditingId(null);
      loadCourses();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (course) => {
    setEditingId(course._id || null);
    setFormData({
      name: course.name || "",
      description: course.description || "",
      price: course.price ?? "",
      isActive: course.isActive !== false
    });
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast({
        title: "Cannot delete seeded course",
        description: "Add a course first, then delete real entries.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    try {
      await deleteExternalCourse(id);
      toast({ title: "Course removed", status: "info", duration: 2500, isClosable: true });
      loadCourses();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyCourse);
  };

  return (
    <Box>
        <HStack justify="space-between" mb={6} align={{ base: "flex-start", md: "center" }} spacing={4} flexDir={{ base: "column", md: "row" }}>
          <Box>
            <Heading as="h1" size="xl" color={headerColor} mb={1}>
              External Course Pricing
            </Heading>
            <Text color="gray.500">Finance creates priced external courses here, and they are stored in the external database.</Text>
          </Box>
          <HStack spacing={2}>
            {editingId && <Button leftIcon={<CloseIcon boxSize={3} />} variant="outline" onClick={cancelEdit}>Cancel edit</Button>}
            <Button colorScheme="teal" leftIcon={editingId ? <CheckIcon /> : <AddIcon />} onClick={handleSubmit} isLoading={saving}>
              {editingId ? "Update" : "Save"}
            </Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Text fontSize="sm" color="gray.500">Active external courses</Text>
              <Heading size="lg">{summary.active}</Heading>
              <Text color="gray.500">of {summary.total} total</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Text fontSize="sm" color="gray.500">Average price</Text>
              <Heading size="lg">{formatCurrency(summary.avgPrice)}</Heading>
              <Text color="gray.500">Across external courses</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Text fontSize="sm" color="gray.500">Sync status</Text>
              <Badge colorScheme="teal" mt={1}>Live for Sales follow-up</Badge>
              <Text color="gray.500">Sales reads training titles and prices from this external database.</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Box as="form" onSubmit={handleSubmit} bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={6}>
          <Heading size="md" mb={4}>{editingId ? "Edit external course" : "Add external course"}</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="External course title" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Price (ETB)</FormLabel>
              <Input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} />
            </FormControl>
            <FormControl gridColumn={{ md: "1 / span 2" }}>
              <FormLabel>Description</FormLabel>
              <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Short notes" />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Active</FormLabel>
              <Switch isChecked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
            </FormControl>
          </SimpleGrid>
          <HStack mt={4} spacing={3}>
            <Button type="submit" colorScheme="teal" leftIcon={editingId ? <CheckIcon /> : <AddIcon />} isLoading={saving}>
              {editingId ? "Update external course" : "Save external course"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
            )}
          </HStack>
        </Box>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <HStack justify="space-between" mb={3}>
              <Heading size="md">External course database</Heading>
              {loading && <Spinner size="sm" />}
            </HStack>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Description</Th>
                    <Th isNumeric>Price (ETB)</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {courses.map(course => (
                    <Tr key={course._id || course.name}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{course.name}</Text>
                        </VStack>
                      </Td>
                      <Td>{course.description || "—"}</Td>
                      <Td isNumeric>{formatCurrency(course.price)}</Td>
                      <Td>
                        <Badge colorScheme={course.isActive === false ? "red" : "green"}>
                          {course.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </Td>
                      <Td>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : ""}</Td>
                      <Td textAlign="right">
                        <HStack justify="flex-end" spacing={1}>
                          <IconButton size="sm" aria-label="Edit" icon={<EditIcon />} onClick={() => startEdit(course)} />
                          <IconButton size="sm" aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => handleDelete(course._id)} />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                  {!loading && courses.length === 0 && (
                    <Tr>
                      <Td colSpan={6}>
                        <Text color="gray.500">No external courses found. Add one above to save into the external database.</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </Box>
  );
};

export default PricingPage;
