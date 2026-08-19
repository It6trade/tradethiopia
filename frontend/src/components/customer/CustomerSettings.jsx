import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { FiBox, FiCheckCircle, FiEdit3, FiGlobe, FiPackage, FiPlus, FiRefreshCw, FiSearch, FiSettings, FiUserCheck, FiUsers } from "react-icons/fi";
import axiosInstance from "../../services/axiosInstance";
import Layout from "./Layout";

const normalizeRoleValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const CustomerSettings = () => {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingB2B, setPendingB2B] = useState([]);
  const [csUsers, setCsUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("all");

  const [form, setForm] = useState({
    packageNumber: "",
    services: [],
    serviceInput: "",
    price: "",
    description: "",
    market: "Local",
  });
  const [editingId, setEditingId] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const tableHoverBg = useColorModeValue("gray.50", "gray.750");

  const servicePalette = ["blue", "green", "purple", "orange", "teal", "pink", "cyan", "red", "yellow"];
  const getServiceColor = (name = "") => {
    const key = name.toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash + key.charCodeAt(i) * (i + 1)) % 9973;
    }
    return servicePalette[hash % servicePalette.length];
  };

  const normalizeUsersResponse = (payload) => {
    const raw =
      (Array.isArray(payload) && payload) ||
      payload?.users ||
      payload?.data ||
      [];
    return Array.isArray(raw) ? raw : [];
  };

  const fetchCsUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      const users = normalizeUsersResponse(res.data)
        .filter((u) => {
          const r = normalizeRoleValue(u.role || u.roleName);
          return r === "customerservice" || r === "customersuccessmanager";
        })
        .sort((a, b) =>
          (a.fullName || a.username || a.email || "").localeCompare(
            b.fullName || b.username || b.email || ""
          )
        );

      setCsUsers(users);
    } catch (err) {
      console.error("Failed to load CS users", err);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/packages");
      setPackages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load packages", err);
      toast({ title: "Failed to load packages", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingB2B = async () => {
    try {
      const res = await axiosInstance.get("/followups/b2b-pending");
      setPendingB2B(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load pending B2B customers", err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchCsUsers();
    fetchPendingB2B();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = () => {
    const service = form.serviceInput.trim();
    if (!service) return;
    if ((form.services || []).includes(service)) return;
    setForm((prev) => ({
      ...prev,
      services: [...(prev.services || []), service],
      serviceInput: "",
    }));
  };

  const handleRemoveService = (svc) => {
    setForm((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s !== svc),
    }));
  };

  const resetForm = () => {
    setForm({
      packageNumber: "",
      services: [],
      serviceInput: "",
      price: "",
      description: "",
      market: "Local",
    });
    setEditingId(null);
  };

  const handleAdd = async () => {
    const services = form.services || [];
    const market = form.market || "Local";
    if (!form.packageNumber || services.length === 0 || !form.price) {
      toast({
        title: "Missing fields",
        description: "Package number, at least one service, and price are required.",
        status: "warning",
      });
      return;
    }
    const exists = packages.some(
      (p) =>
        String(p.packageNumber) === String(form.packageNumber) &&
        (p.market || "Local") === market
    );
    if (exists) {
      toast({
        title: "Duplicate package number",
        description: "Use a unique number for each package.",
        status: "error",
      });
      return;
    }

    try {
      const payload = {
        packageNumber: form.packageNumber,
        services,
        price: form.price,
        description: form.description,
        market,
      };
      const res = await axiosInstance.post("/packages", payload);
      setPackages((prev) => [...prev, res.data]);
      resetForm();
      toast({ title: "Package created successfully", status: "success" });
    } catch (err) {
      toast({
        title: "Create failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      packageNumber: p.packageNumber,
      services: Array.isArray(p.services) ? p.services : [],
      serviceInput: "",
      price: p.price,
      description: p.description || "",
      market: p.market || "Local",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const services = form.services || [];
    const market = form.market || "Local";
    if (!form.packageNumber || services.length === 0 || !form.price) {
      toast({
        title: "Missing fields",
        description: "Package number, services, and price are required.",
        status: "warning",
      });
      return;
    }

    try {
      const payload = {
        packageNumber: form.packageNumber,
        services,
        price: form.price,
        description: form.description,
        market,
      };
      const res = await axiosInstance.put(`/packages/${editingId}`, payload);
      setPackages((prev) => prev.map((p) => (p._id === editingId ? res.data : p)));
      resetForm();
      toast({ title: "Package updated successfully", status: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await axiosInstance.delete(`/packages/${id}`);
      setPackages((prev) => prev.filter((p) => p._id !== id));
      toast({ title: "Package deleted", status: "info" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleAssignAgent = async (customerId) => {
    const agentId = selectedAgent[customerId];
    if (!agentId) {
      toast({ title: "Please select an agent to assign", status: "warning" });
      return;
    }

    setAssigningId(customerId);
    try {
      await axiosInstance.put(`/followups/assign/${customerId}`, { assignedTo: agentId });
      setPendingB2B((prev) => prev.filter((c) => c._id !== customerId));
      setSelectedAgent((prev) => {
        const next = { ...prev };
        delete next[customerId];
        return next;
      });
      toast({ title: "Customer assigned to agent successfully", status: "success" });
    } catch (err) {
      toast({
        title: "Assignment failed",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setAssigningId(null);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    if (marketFilter !== "all" && (pkg.market || "Local") !== marketFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = String(pkg.packageNumber || "").toLowerCase().includes(q);
      const descMatch = String(pkg.description || "").toLowerCase().includes(q);
      const svcMatch = (pkg.services || []).some((s) => s.toLowerCase().includes(q));
      if (!numMatch && !descMatch && !svcMatch) return false;
    }
    return true;
  });

  return (
    <Layout>
      <Box w="100%" minH="100vh" p={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch" w="100%">
          {/* Header Banner - Full Screen */}
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} flexWrap="wrap">
            <HStack spacing={3}>
              <Box p={2.5} bg="blue.500" color="white" borderRadius="xl" boxShadow="sm">
                <FiSettings size={24} />
              </Box>
              <Box>
                <Heading size="lg">Customer Service Settings</Heading>
                <Text color={mutedColor} fontSize="sm">
                  Configure client service tiers, package definitions, and assign incoming B2B inquiries.
                </Text>
              </Box>
            </HStack>

            <HStack spacing={3}>
              <IconButton
                aria-label="Refresh settings"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={() => {
                  fetchPackages();
                  fetchCsUsers();
                  fetchPendingB2B();
                }}
              />
            </HStack>
          </Flex>

          {/* Pending B2B Customer Assignments */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
            <CardHeader pb={2} pt={4} px={5}>
              <Flex justify="space-between" align="center">
                <HStack spacing={2}>
                  <Icon as={FiUserCheck} color="blue.500" />
                  <Heading size="md">Pending B2B Customer Assignments</Heading>
                </HStack>
                <Badge colorScheme={pendingB2B.length > 0 ? "orange" : "green"} borderRadius="full" px={2.5}>
                  {pendingB2B.length} Pending
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody px={5} pt={2} pb={5}>
              {pendingB2B.length === 0 ? (
                <Box p={6} textAlign="center" color={mutedColor}>
                  <Icon as={FiCheckCircle} boxSize={8} color="green.400" mb={2} />
                  <Text fontSize="sm">All incoming B2B customers are assigned to Customer Service agents.</Text>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="sm">
                    <Thead bg={sidebarBg}>
                      <Tr>
                        <Th>Company Name</Th>
                        <Th>Contact Person</Th>
                        <Th>Email</Th>
                        <Th>Market</Th>
                        <Th>Assign To Agent</Th>
                        <Th textAlign="right">Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pendingB2B.map((c) => (
                        <Tr key={c._id} _hover={{ bg: tableHoverBg }}>
                          <Td fontWeight="semibold">{c.companyName || "N/A"}</Td>
                          <Td>{c.contactPerson || "-"}</Td>
                          <Td fontSize="xs" color="gray.500">{c.email || "-"}</Td>
                          <Td>
                            <Badge colorScheme={c.market === "International" ? "purple" : "blue"} fontSize="2xs">
                              {c.market || "Local"}
                            </Badge>
                          </Td>
                          <Td>
                            <Select
                              size="xs"
                              w="200px"
                              placeholder="Select CS Agent..."
                              value={selectedAgent[c._id] || ""}
                              onChange={(e) =>
                                setSelectedAgent((prev) => ({ ...prev, [c._id]: e.target.value }))
                              }
                            >
                              {csUsers.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.fullName || u.username} ({u.email})
                                </option>
                              ))}
                            </Select>
                          </Td>
                          <Td textAlign="right">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => handleAssignAgent(c._id)}
                              isLoading={assigningId === c._id}
                              isDisabled={!selectedAgent[c._id]}
                            >
                              Assign
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>

          {/* Package Configuration Form */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
            <CardHeader pb={2} pt={4} px={5}>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Icon as={editingId ? FiEdit3 : FiPackage} color="blue.500" />
                  <Heading size="md">{editingId ? "Edit Service Package" : "Create New Service Package"}</Heading>
                </HStack>
                {editingId && (
                  <Button size="xs" variant="ghost" onClick={resetForm} leftIcon={<CloseIcon />}>
                    Cancel Edit
                  </Button>
                )}
              </HStack>
            </CardHeader>
            <CardBody px={5} pt={2} pb={5}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>PACKAGE NUMBER / TIER *</Text>
                    <Input
                      size="sm"
                      placeholder="e.g. 1, 2, Silver, Gold"
                      value={form.packageNumber}
                      onChange={(e) => handleChange("packageNumber", e.target.value)}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>MARKET SCOPE *</Text>
                    <Select
                      size="sm"
                      value={form.market}
                      onChange={(e) => handleChange("market", e.target.value)}
                    >
                      <option value="Local">Local (Ethiopia)</option>
                      <option value="International">International</option>
                    </Select>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>PRICE *</Text>
                    <Input
                      size="sm"
                      placeholder="e.g. 2500 ETB or $150 USD"
                      value={form.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>DESCRIPTION</Text>
                    <Input
                      size="sm"
                      placeholder="Optional brief description"
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </Box>
                </SimpleGrid>

                {/* Services Tags Builder */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={1} color={mutedColor}>PACKAGE SERVICES INCLUDED *</Text>
                  <HStack spacing={2} mb={2}>
                    <Input
                      size="sm"
                      placeholder="Type a service name and click Add (e.g., Training, Export Consultancy)..."
                      value={form.serviceInput}
                      onChange={(e) => handleChange("serviceInput", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                    />
                    <Button size="sm" colorScheme="blue" variant="outline" onClick={handleAddService} leftIcon={<AddIcon />}>
                      Add
                    </Button>
                  </HStack>

                  {form.services && form.services.length > 0 && (
                    <Wrap spacing={2} p={2} bg={sidebarBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                      {form.services.map((svc, idx) => (
                        <WrapItem key={idx}>
                          <Tag size="md" borderRadius="full" variant="solid" colorScheme={getServiceColor(svc)}>
                            <TagLabel>{svc}</TagLabel>
                            <TagCloseButton onClick={() => handleRemoveService(svc)} />
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </Box>

                <HStack justify="flex-end" spacing={2}>
                  {editingId && (
                    <Button size="sm" variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={editingId ? handleUpdate : handleAdd}
                    leftIcon={editingId ? <CheckIcon /> : <AddIcon />}
                  >
                    {editingId ? "Update Package" : "Save Package"}
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Existing Packages Table */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="sm">
            <CardHeader pb={3} pt={4} px={5}>
              <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} gap={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Heading size="md">Configured Service Packages</Heading>
                  <Badge colorScheme="blue" borderRadius="full" px={2.5}>
                    {filteredPackages.length} Packages
                  </Badge>
                </HStack>

                <HStack spacing={2} flexWrap="wrap">
                  <Select
                    size="sm"
                    w="150px"
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value)}
                  >
                    <option value="all">All Markets</option>
                    <option value="Local">Local Only</option>
                    <option value="International">International Only</option>
                  </Select>

                  <Input
                    size="sm"
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxW="200px"
                  />
                </HStack>
              </Flex>
            </CardHeader>

            <CardBody p={0}>
              <TableContainer>
                <Table size="sm">
                  <Thead bg={sidebarBg}>
                    <Tr>
                      <Th>Package Tier</Th>
                      <Th>Market</Th>
                      <Th>Price</Th>
                      <Th>Included Services</Th>
                      <Th>Description</Th>
                      <Th textAlign="right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loading ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={8}>
                          <Spinner size="md" color="blue.500" />
                          <Text fontSize="xs" color={mutedColor} mt={2}>Loading service packages...</Text>
                        </Td>
                      </Tr>
                    ) : filteredPackages.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={8} color={mutedColor}>
                          No service packages defined yet. Use the form above to add your first package.
                        </Td>
                      </Tr>
                    ) : (
                      filteredPackages.map((pkg) => (
                        <Tr key={pkg._id} _hover={{ bg: tableHoverBg }}>
                          <Td fontWeight="bold">Package {pkg.packageNumber}</Td>
                          <Td>
                            <Badge colorScheme={pkg.market === "International" ? "purple" : "blue"} fontSize="2xs">
                              {pkg.market || "Local"}
                            </Badge>
                          </Td>
                          <Td fontWeight="semibold">{pkg.price}</Td>
                          <Td>
                            <Wrap spacing={1}>
                              {(pkg.services || []).map((s, idx) => (
                                <WrapItem key={idx}>
                                  <Tag size="xs" colorScheme={getServiceColor(s)} borderRadius="md">
                                    {s}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </Td>
                          <Td fontSize="xs" color="gray.500">{pkg.description || "-"}</Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <Tooltip label="Edit Package">
                                <IconButton
                                  aria-label="Edit package"
                                  icon={<EditIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => handleEdit(pkg)}
                                />
                              </Tooltip>
                              <Tooltip label="Delete Package">
                                <IconButton
                                  aria-label="Delete package"
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDelete(pkg._id)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  );
};

export default CustomerSettings;
