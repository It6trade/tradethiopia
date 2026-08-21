import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Heading,
  Input,
  Textarea,
  Select,
  Button,
  IconButton,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Spinner,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  useColorModeValue,
  Tooltip,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Container,
} from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import {
  FiFolder,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiBriefcase,
  FiAlertCircle,
  FiX,
  FiLayers,
  FiArrowRight,
} from 'react-icons/fi';

const isEmployeeCategory = (section) => {
  const s = String(section || '').toLowerCase().trim();
  return s === 'employees' || s === 'employee';
};

const isCompanyCategory = (section) => {
  const s = String(section || '').toLowerCase().trim();
  return s === 'companys' || s === 'company' || s === 'company-documents' || (!s || !isEmployeeCategory(s));
};

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all'); // 'all', 'employees', 'company'
  
  // Create / Edit Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState('employees'); // 'employees' or 'companys'
  const [description, setDescription] = useState('');
  
  // Delete Modal State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();

  // Color Tokens
  const pageBg = useColorModeValue('#F8FAFC', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('white', 'gray.800');

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      const raw = Array.isArray(response.data?.data)
        ? response.data.data
        : (Array.isArray(response.data) ? response.data : []);
      setCategories(raw);
    } catch (error) {
      toast({
        title: 'Error loading categories',
        description: error.response?.data?.message || error.message || 'Failed to connect to backend server.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Create / Update Category
  const handleSaveCategory = async () => {
    if (!name.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a unique name for this category.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        // Update existing category
        await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${selectedCategory._id}`, {
          name: name.trim(),
          section,
          description: description.trim(),
        });
        toast({
          title: 'Category updated',
          description: `Category "${name}" updated successfully.`,
          status: 'success',
          duration: 3500,
          isClosable: true,
        });
      } else {
        // Create new category
        await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, {
          name: name.trim(),
          section,
          description: description.trim(),
        });
        toast({
          title: 'Category created',
          description: `New category "${name}" created for ${isEmployeeCategory(section) ? 'Employee Documents' : 'Company Documents'}.`,
          status: 'success',
          duration: 3500,
          isClosable: true,
        });
      }
      closeFormModal();
      fetchCategories();
    } catch (error) {
      toast({
        title: selectedCategory ? 'Error updating category' : 'Error creating category',
        description: error.response?.data?.message || error.response?.data?.error || error.message || 'Operation failed.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category with usage check
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      // Check usage before deleting
      try {
        const usageRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/check-usage/${categoryToDelete._id}`);
        if (usageRes.status === 400 || usageRes.data?.inUse) {
          toast({
            title: 'Cannot delete category',
            description: 'This category is actively referenced by document files and cannot be removed.',
            status: 'warning',
            duration: 4500,
            isClosable: true,
          });
          setIsDeleting(false);
          onDeleteClose();
          return;
        }
      } catch (checkErr) {
        // Continue to deletion if usage check endpoint is not strict
      }

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${categoryToDelete._id}`);
      toast({
        title: 'Category deleted',
        description: `Category "${categoryToDelete.name}" was permanently removed.`,
        status: 'success',
        duration: 3500,
        isClosable: true,
      });
      fetchCategories();
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Error deleting category',
        description: error.response?.data?.message || error.message || 'Failed to delete category.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Create Form Modal
  const openCreateModal = () => {
    setSelectedCategory(null);
    setName('');
    setSection('employees');
    setDescription('');
    onFormOpen();
  };

  // Open Edit Form Modal
  const openEditModal = (cat) => {
    setSelectedCategory(cat);
    setName(cat.name || '');
    setSection(isEmployeeCategory(cat.section) ? 'employees' : 'companys');
    setDescription(cat.description || '');
    onFormOpen();
  };

  const closeFormModal = () => {
    setSelectedCategory(null);
    setName('');
    setSection('employees');
    setDescription('');
    onFormClose();
  };

  // Filtered categories computed
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Section filter
      if (sectionFilter === 'employees' && !isEmployeeCategory(cat.section)) {
        return false;
      }
      if (sectionFilter === 'company' && !isCompanyCategory(cat.section)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (cat.name || '').toLowerCase().includes(q);
        const descMatch = (cat.description || '').toLowerCase().includes(q);
        const secMatch = (cat.section || '').toLowerCase().includes(q);
        return nameMatch || descMatch || secMatch;
      }
      return true;
    });
  }, [categories, sectionFilter, searchQuery]);

  // Statistics
  const totalCount = categories.length;
  const employeeCount = categories.filter((c) => isEmployeeCategory(c.section)).length;
  const companyCount = categories.filter((c) => isCompanyCategory(c.section)).length;

  return (
    <Box minH="100vh" bg={pageBg} pb="12">
      <Container maxW="7xl" pt="6" px={{ base: 4, md: 8 }}>
        {/* Top Header Card */}
        <Box
          bg={headerBg}
          p={{ base: 5, md: 6 }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
          mb="6"
        >
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap="4">
            <Box>
              <HStack spacing="2" mb="1">
                <Text color="teal.600" fontSize="xs" fontWeight="800" letterSpacing="wider" textTransform="uppercase">
                  HR Workspace
                </Text>
                <Text color="gray.400" fontSize="xs">/</Text>
                <Text color="gray.600" fontSize="xs" fontWeight="semibold">
                  Categories
                </Text>
              </HStack>
              <Heading size="lg" color="gray.800" fontWeight="extrabold">
                Document Category Management
              </Heading>
              <Text color={mutedText} fontSize="sm" mt="1">
                Define and manage classification categories for Employee dossiers and Company document repositories.
              </Text>
            </Box>

            <HStack spacing={3}>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="teal"
                bg="#004D40"
                _hover={{ bg: '#00796B' }}
                borderRadius="full"
                px="5"
                boxShadow="0 4px 12px rgba(0, 77, 64, 0.2)"
                onClick={openCreateModal}
              >
                New Category
              </Button>
              <IconButton
                aria-label="Refresh categories"
                icon={<FiRefreshCw />}
                variant="outline"
                colorScheme="teal"
                borderRadius="full"
                onClick={fetchCategories}
                isLoading={loading}
              />
            </HStack>
          </Flex>

          {/* Quick Metrics Banner */}
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing="4" mt="6" pt="6" borderTop="1px solid" borderColor={borderColor}>
            <Card variant="outline" borderRadius="xl" bg={useColorModeValue('teal.50', 'gray.750')}>
              <CardBody p="4">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="2xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
                      Total Categories
                    </Text>
                    <Heading size="md" color="teal.900">{totalCount}</Heading>
                  </VStack>
                  <Flex boxSize="40px" borderRadius="lg" bg="teal.500" color="white" align="center" justify="center">
                    <Icon as={FiLayers} boxSize={5} />
                  </Flex>
                </HStack>
              </CardBody>
            </Card>

            <Card variant="outline" borderRadius="xl" bg={useColorModeValue('emerald.50', 'gray.750')}>
              <CardBody p="4">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="2xs" fontWeight="bold" color="emerald.800" textTransform="uppercase" letterSpacing="wider">
                      Employee Document Categories
                    </Text>
                    <Heading size="md" color="emerald.900">{employeeCount}</Heading>
                  </VStack>
                  <Flex boxSize="40px" borderRadius="lg" bg="emerald.500" color="white" align="center" justify="center">
                    <Icon as={FiUsers} boxSize={5} />
                  </Flex>
                </HStack>
              </CardBody>
            </Card>

            <Card variant="outline" borderRadius="xl" bg={useColorModeValue('blue.50', 'gray.750')}>
              <CardBody p="4">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="2xs" fontWeight="bold" color="blue.800" textTransform="uppercase" letterSpacing="wider">
                      Company Document Categories
                    </Text>
                    <Heading size="md" color="blue.900">{companyCount}</Heading>
                  </VStack>
                  <Flex boxSize="40px" borderRadius="lg" bg="blue.500" color="white" align="center" justify="center">
                    <Icon as={FiBriefcase} boxSize={5} />
                  </Flex>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Controls & Filter Bar */}
        <Card borderRadius="2xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm" mb="6">
          <CardBody p="4">
            <Flex justify="space-between" align="center" wrap="wrap" gap="4">
              {/* Section Tabs / Filter */}
              <HStack spacing="2" wrap="wrap">
                <Button
                  size="sm"
                  borderRadius="full"
                  variant={sectionFilter === 'all' ? 'solid' : 'ghost'}
                  colorScheme="teal"
                  onClick={() => setSectionFilter('all')}
                >
                  All ({totalCount})
                </Button>
                <Button
                  size="sm"
                  borderRadius="full"
                  variant={sectionFilter === 'employees' ? 'solid' : 'ghost'}
                  colorScheme="emerald"
                  leftIcon={<Icon as={FiUsers} />}
                  onClick={() => setSectionFilter('employees')}
                >
                  Employee Documents ({employeeCount})
                </Button>
                <Button
                  size="sm"
                  borderRadius="full"
                  variant={sectionFilter === 'company' ? 'solid' : 'ghost'}
                  colorScheme="blue"
                  leftIcon={<Icon as={FiBriefcase} />}
                  onClick={() => setSectionFilter('company')}
                >
                  Company Documents ({companyCount})
                </Button>
              </HStack>

              {/* Search Bar */}
              <InputGroup size="sm" maxW={{ base: '100%', md: '280px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  borderRadius="full"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderColor={borderColor}
                  focusBorderColor="teal.500"
                />
                {searchQuery && (
                  <InputRightElement>
                    <Icon as={FiX} color="gray.400" cursor="pointer" onClick={() => setSearchQuery('')} />
                  </InputRightElement>
                )}
              </InputGroup>
            </Flex>
          </CardBody>
        </Card>

        {/* Category List Grid */}
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} borderRadius="2xl" p="4" borderWidth="1px" borderColor={borderColor}>
                <Skeleton height="20px" width="60%" mb="3" borderRadius="md" />
                <Skeleton height="14px" width="90%" mb="2" borderRadius="md" />
                <Skeleton height="14px" width="40%" borderRadius="md" />
              </Card>
            ))}
          </SimpleGrid>
        ) : filteredCategories.length === 0 ? (
          <Card borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p="10" textAlign="center">
            <VStack spacing="3">
              <Flex boxSize="54px" borderRadius="2xl" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiFolder} boxSize={7} />
              </Flex>
              <Heading size="md" color="gray.800">
                {searchQuery ? 'No matching categories found' : 'No document categories configured'}
              </Heading>
              <Text fontSize="sm" color={mutedText} maxW="450px" textAlign="center">
                {searchQuery
                  ? `No categories matched your search term "${searchQuery}". Try clearing your search.`
                  : 'Start by creating your first document category to organize employee and company records.'}
              </Text>
              {searchQuery ? (
                <Button size="sm" variant="outline" colorScheme="teal" borderRadius="full" onClick={() => setSearchQuery('')}>
                  Clear Search Filter
                </Button>
              ) : (
                <Button size="sm" colorScheme="teal" bg="#004D40" borderRadius="full" leftIcon={<FiPlus />} onClick={openCreateModal}>
                  Create First Category
                </Button>
              )}
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="5">
            {filteredCategories.map((cat) => {
              const isEmployee = isEmployeeCategory(cat.section);

              return (
                <Card
                  key={cat._id}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={cardBg}
                  boxShadow="sm"
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ transform: 'translateY(-3px)', boxShadow: 'md', borderColor: isEmployee ? 'emerald.400' : 'blue.400' }}
                >
                  <CardBody p="5" display="flex" flexDirection="column" justify="space-between">
                    <Box mb="4">
                      <Flex justify="space-between" align="start" gap="2" mb="2">
                        <HStack spacing="2.5">
                          <Flex
                            boxSize="36px"
                            borderRadius="xl"
                            bg={isEmployee ? 'emerald.50' : 'blue.50'}
                            color={isEmployee ? 'emerald.600' : 'blue.600'}
                            align="center"
                            justify="center"
                          >
                            <Icon as={isEmployee ? FiUsers : FiBriefcase} boxSize={5} />
                          </Flex>
                          <Heading size="sm" color="gray.800" fontWeight="bold">
                            {cat.name}
                          </Heading>
                        </HStack>

                        <Badge
                          colorScheme={isEmployee ? 'emerald' : 'blue'}
                          borderRadius="full"
                          px="2.5"
                          py="0.5"
                          fontSize="2xs"
                          fontWeight="bold"
                          textTransform="uppercase"
                        >
                          {isEmployee ? 'Employee' : 'Company'}
                        </Badge>
                      </Flex>

                      <Text fontSize="xs" color={mutedText} noOfLines={3} lineHeight="relaxed" mt="2">
                        {cat.description || 'No description provided for this document category.'}
                      </Text>
                    </Box>

                    <Flex justify="space-between" align="center" pt="3" borderTop="1px dashed" borderColor={borderColor}>
                      <Button
                        as={RouterLink}
                        to={isEmployee ? '/EmployeeDocument' : '/documentlist'}
                        size="xs"
                        variant="link"
                        colorScheme={isEmployee ? 'emerald' : 'blue'}
                        rightIcon={<FiArrowRight />}
                      >
                        Browse Files
                      </Button>

                      <HStack spacing="1">
                        <Tooltip label="Edit category details" hasArrow>
                          <IconButton
                            aria-label="Edit category"
                            icon={<FiEdit2 />}
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            borderRadius="lg"
                            onClick={() => openEditModal(cat)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete category" hasArrow>
                          <IconButton
                            aria-label="Delete category"
                            icon={<FiTrash2 />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            borderRadius="lg"
                            onClick={() => {
                              setCategoryToDelete(cat);
                              onDeleteOpen();
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}

        {/* Create / Edit Category Modal */}
        <Modal isOpen={isFormOpen} onClose={closeFormModal} isCentered size="lg">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="2xl" p="2">
            <ModalHeader>
              <HStack spacing="2.5">
                <Flex boxSize="36px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                  <Icon as={selectedCategory ? FiEdit2 : FiPlus} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="md" color="gray.800">
                    {selectedCategory ? 'Edit Category' : 'Create Document Category'}
                  </Heading>
                  <Text fontSize="2xs" color={mutedText} fontWeight="normal">
                    {selectedCategory ? 'Update category metadata and target repository section.' : 'Add a new category label to classify repository documents.'}
                  </Text>
                </Box>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py="4">
              <VStack spacing="4">
                {/* Category Name */}
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="bold" color="gray.700" mb="1">
                    Category Name <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Input
                    placeholder="e.g. Employment Contracts, Certifications, Company Policies..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    borderRadius="lg"
                    size="sm"
                    focusBorderColor="teal.500"
                  />
                </Box>

                {/* Target Section */}
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="bold" color="gray.700" mb="1">
                    Target Document Repository Section <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    borderRadius="lg"
                    size="sm"
                    focusBorderColor="teal.500"
                  >
                    <option value="employees">👤 Employee Documents (Dossiers & Staff Records)</option>
                    <option value="companys">🏢 Company Documents (Policies, Guides & Forms)</option>
                  </Select>
                </Box>

                {/* Description */}
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="bold" color="gray.700" mb="1">
                    Category Description
                  </Text>
                  <Textarea
                    placeholder="Provide context or guidance on what files should be stored under this category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    borderRadius="lg"
                    size="sm"
                    rows={3}
                    focusBorderColor="teal.500"
                  />
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter pt="2">
              <HStack spacing="2">
                <Button variant="ghost" size="sm" borderRadius="full" onClick={closeFormModal}>
                  Cancel
                </Button>
                <Button
                  colorScheme="teal"
                  bg="#004D40"
                  _hover={{ bg: '#00796B' }}
                  size="sm"
                  borderRadius="full"
                  px="6"
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  onClick={handleSaveCategory}
                >
                  {selectedCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="2xl" p="2">
            <ModalHeader>
              <HStack spacing="2.5">
                <Flex boxSize="36px" borderRadius="xl" bg="red.50" color="red.600" align="center" justify="center">
                  <Icon as={FiAlertCircle} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="md" color="gray.800">
                    Delete Category
                  </Heading>
                  <Text fontSize="2xs" color="red.600" fontWeight="bold">
                    PERMANENT ACTION
                  </Text>
                </Box>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py="3">
              <Text fontSize="sm" color="gray.700">
                Are you sure you want to delete the category <Text as="span" fontWeight="bold" color="gray.900">"{categoryToDelete?.name}"</Text>?
              </Text>
              <Text fontSize="xs" color={mutedText} mt="2">
                This action cannot be undone. If this category contains active document files, deletion will be prevented to protect repository data.
              </Text>
            </ModalBody>

            <ModalFooter>
              <HStack spacing="2">
                <Button variant="ghost" size="sm" borderRadius="full" onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  size="sm"
                  borderRadius="full"
                  px="5"
                  isLoading={isDeleting}
                  loadingText="Deleting..."
                  onClick={confirmDeleteCategory}
                >
                  Confirm Delete
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Category;
