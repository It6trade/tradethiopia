import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FiCheckCircle, FiGlobe, FiMail, FiPhone, FiPower, FiSlash } from "react-icons/fi";
import { EmptyStateBlock, SurfaceCard } from "./SocialMediaPrimitives";

const statusOptions = [
  { value: "all", label: "All accounts" },
  { value: "active", label: "Active" },
  { value: "deactive", label: "Deactive" },
];

const accountTypeOptions = [
  { value: "all", label: "All media and others" },
  { value: "social", label: "Social media" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other accounts" },
];

const socialPlatforms = new Set(["facebook", "instagram", "tiktok", "youtube", "linkedin", "whatsapp", "telegram", "x", "twitter"]);

const getAccountType = (platform = "") => {
  const normalized = platform.toString().trim().toLowerCase();
  if (normalized === "email") return "email";
  if (socialPlatforms.has(normalized) || normalized.includes("twitter")) return "social";
  return "other";
};

const buildUpdatePayload = (account, active) => ({
  platform: account.platform || "",
  employeeFullName: account.employeeFullName || "",
  accountName: account.accountName || "",
  email: account.email || "",
  phoneNumber: account.phoneNumber || "",
  password: account.password || "",
  notes: account.notes || "",
  active,
});

export default function SocialMediaActivationsManager() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const borderColor = useColorModeValue("rgba(226,232,240,0.9)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const tableHeaderBg = useColorModeValue("rgba(248,250,252,0.92)", "whiteAlpha.100");
  const tableRowBg = useColorModeValue("rgba(255,255,255,0.96)", "whiteAlpha.50");
  const tableHover = useColorModeValue("rgba(248,250,252,0.98)", "rgba(255,255,255,0.05)");
  const inputBg = useColorModeValue("white", "whiteAlpha.100");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/social-account-credentials`);
      setAccounts(Array.isArray(response.data) ? response.data : response.data?.data || []);
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch account activations", fetchError);
      setError("Failed to load account activations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const summary = useMemo(() => {
    const active = accounts.filter((account) => account.active !== false).length;
    const deactive = accounts.length - active;
    return {
      total: accounts.length,
      active,
      deactive,
    };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return accounts.filter((account) => {
      const isActive = account.active !== false;
      const accountType = getAccountType(account.platform);

      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "deactive" && isActive) return false;
      if (typeFilter !== "all" && accountType !== typeFilter) return false;

      if (!normalizedSearch) return true;

      return [account.platform, account.employeeFullName, account.accountName, account.email, account.phoneNumber]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(normalizedSearch));
    });
  }, [accounts, searchTerm, statusFilter, typeFilter]);

  const handleActivationChange = async (account, active) => {
    if (!account?._id) return;

    try {
      setUpdatingId(account._id);
      await axios.put(`${import.meta.env.VITE_API_URL}/api/social-account-credentials/${account._id}`, buildUpdatePayload(account, active));
      setAccounts((prev) => prev.map((item) => (item._id === account._id ? { ...item, active } : item)));
      toast({
        title: active ? "Account activated" : "Account deactivated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (updateError) {
      console.error("Failed to update account activation", updateError);
      toast({
        title: "Activation update failed",
        description: updateError.response?.data?.message || "Could not update the account status.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setUpdatingId("");
    }
  };

  const renderStatusBadge = (isActive) => (
    <Badge borderRadius="full" px={2} py={0.5} fontSize="10px" colorScheme={isActive ? "green" : "gray"} variant="subtle">
      {isActive ? "Active" : "Deactive"}
    </Badge>
  );

  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <SurfaceCard>
          <Box p={3.5}>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color={muted}>All accounts</StatLabel>
                  <StatNumber fontSize="xl">{summary.total}</StatNumber>
                </Box>
                <Icon as={FiGlobe} boxSize={5} color="#2563EB" />
              </HStack>
            </Stat>
          </Box>
        </SurfaceCard>
        <SurfaceCard>
          <Box p={3.5}>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color={muted}>Active</StatLabel>
                  <StatNumber fontSize="xl">{summary.active}</StatNumber>
                </Box>
                <Icon as={FiCheckCircle} boxSize={5} color="#16A34A" />
              </HStack>
            </Stat>
          </Box>
        </SurfaceCard>
        <SurfaceCard>
          <Box p={3.5}>
            <Stat>
              <HStack justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color={muted}>Deactive</StatLabel>
                  <StatNumber fontSize="xl">{summary.deactive}</StatNumber>
                </Box>
                <Icon as={FiSlash} boxSize={5} color="#64748B" />
              </HStack>
            </Stat>
          </Box>
        </SurfaceCard>
      </SimpleGrid>

      {error ? (
        <Alert status="error" borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
          <AlertIcon />
          <Box>
            <AlertTitle>Activation sync issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      <SurfaceCard>
        <Box p={{ base: 4, md: 5 }}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none" h="100%">
                <SearchIcon color={muted} boxSize={3} />
              </InputLeftElement>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search platform, user, email"
                borderRadius="10px"
                borderColor={borderColor}
                bg={inputBg}
                h="34px"
                fontSize="xs"
              />
            </InputGroup>
            <Select size="sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} borderRadius="10px" borderColor={borderColor} bg={inputBg} h="34px" fontSize="xs">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select size="sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} borderRadius="10px" borderColor={borderColor} bg={inputBg} h="34px" fontSize="xs">
              {accountTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SimpleGrid>

          {loading ? (
            <HStack spacing={3}>
              <Spinner size="sm" />
              <Text color={muted}>Loading account activations...</Text>
            </HStack>
          ) : filteredAccounts.length ? (
            <>
              <VStack display={{ base: "flex", md: "none" }} align="stretch" spacing={2.5}>
                {filteredAccounts.map((account) => {
                  const isActive = account.active !== false;
                  return (
                    <Box key={account._id} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="14px" bg={tableRowBg}>
                      <HStack justify="space-between" align="start" spacing={3}>
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="700" noOfLines={1}>
                            {account.platform || "Other"}
                          </Text>
                          <Text fontSize="xs" color={muted} noOfLines={1}>
                            {account.accountName}
                          </Text>
                        </Box>
                        {renderStatusBadge(isActive)}
                      </HStack>
                      <VStack align="stretch" spacing={2} mt={3}>
                        <Text fontSize="xs" color={muted}>
                          Assigned to: <Text as="span" color="inherit" fontWeight="600">{account.employeeFullName || "-"}</Text>
                        </Text>
                        <Text fontSize="xs" color={muted}>
                          Email: <Text as="span" color="inherit" fontWeight="600">{account.email || "-"}</Text>
                        </Text>
                        <HStack justify="space-between" pt={1}>
                          <Text fontSize="xs" fontWeight="700">
                            {isActive ? "Activated" : "Deactivated"}
                          </Text>
                          <Switch
                            size="sm"
                            colorScheme="green"
                            isChecked={isActive}
                            isDisabled={updatingId === account._id}
                            onChange={(event) => handleActivationChange(account, event.target.checked)}
                          />
                        </HStack>
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>

              <Box display={{ base: "none", md: "block" }} overflowX="auto">
                <Table variant="unstyled" sx={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <Thead>
                    <Tr>
                      {["Platform", "Account", "Assigned User", "Email", "Phone", "Status", "Activation"].map((heading) => (
                        <Th
                          key={heading}
                          px={4}
                          py={2}
                          fontSize="10px"
                          textTransform="uppercase"
                          letterSpacing="0.12em"
                          color={muted}
                          bg={tableHeaderBg}
                          borderY="1px"
                          borderColor={borderColor}
                          _first={{ borderLeftWidth: "1px", borderLeftRadius: "12px" }}
                          _last={{ borderRightWidth: "1px", borderRightRadius: "12px" }}
                        >
                          {heading}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAccounts.map((account) => {
                      const isActive = account.active !== false;
                      return (
                        <Tr key={account._id} bg={tableRowBg} transition="all 0.15s ease" _hover={{ bg: tableHover, transform: "translateY(-0.5px)", boxShadow: "0 6px 18px rgba(15,23,42,0.02)" }}>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor} _first={{ borderLeftWidth: "1px", borderLeftRadius: "14px" }}>
                            <HStack spacing={2}>
                              <Icon as={getAccountType(account.platform) === "email" ? FiMail : FiGlobe} color={muted} boxSize={3.5} />
                              <Text fontSize="sm" fontWeight="700">{account.platform || "Other"}</Text>
                            </HStack>
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                            <Text fontSize="sm" fontWeight="600">{account.accountName}</Text>
                            {account.notes ? <Text mt={0.5} fontSize="xs" color={muted}>{account.notes}</Text> : null}
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                            <Text fontSize="sm" fontWeight="600">{account.employeeFullName || "-"}</Text>
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                            <Text fontSize="xs" color={muted}>{account.email || "-"}</Text>
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                            <HStack spacing={2}>
                              <Icon as={FiPhone} color={muted} boxSize={3.5} />
                              <Text fontSize="xs" color={muted}>{account.phoneNumber || "-"}</Text>
                            </HStack>
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                            {renderStatusBadge(isActive)}
                          </Td>
                          <Td px={4} py={2} borderY="1px" borderColor={borderColor} _last={{ borderRightWidth: "1px", borderRightRadius: "14px" }}>
                            <HStack spacing={3}>
                              <Switch
                                size="sm"
                                colorScheme="green"
                                isChecked={isActive}
                                isDisabled={updatingId === account._id}
                                onChange={(event) => handleActivationChange(account, event.target.checked)}
                              />
                              <Button
                                size="xs"
                                borderRadius="10px"
                                leftIcon={<Icon as={FiPower} boxSize={3} />}
                                colorScheme={isActive ? "gray" : "green"}
                                variant={isActive ? "outline" : "solid"}
                                isLoading={updatingId === account._id}
                                onClick={() => handleActivationChange(account, !isActive)}
                                px={2.5}
                                h="28px"
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </>
          ) : (
            <EmptyStateBlock
              title="No accounts match this filter"
              description="Change the status, account type, or search term to view account activation records."
              badge="No Results"
            />
          )}
        </Box>
      </SurfaceCard>
    </VStack>
  );
}
