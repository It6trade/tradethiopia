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
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { FiGlobe, FiLock, FiMail, FiPhone } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegramPlane, FaTiktok, FaTwitter, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { EmptyStateBlock, SectionIntro, SurfaceCard } from "./SocialMediaPrimitives";

const initialForm = {
  platform: "",
  employeeFullName: "",
  accountName: "",
  email: "",
  phoneNumber: "",
  password: "",
  socialPlatforms: [],
  notes: "",
  active: true,
};

const preferredPlatforms = ["All", "Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Telegram", "X", "Email", "Other"];
const accountPlatformOptions = preferredPlatforms.filter((platform) => platform !== "All");
const emailSocialPlatformOptions = accountPlatformOptions.filter((platform) => platform !== "Email");
const tableRowShadow = "0 2px 10px rgba(15,23,42,0.035)";
const tableRowHoverShadow = "0 14px 34px rgba(15,23,42,0.08)";
const platformVisuals = {
  All: { icon: FiGlobe, color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  Facebook: { icon: FaFacebookF, color: "#1877F2", bg: "rgba(24,119,242,0.1)" },
  Instagram: { icon: FaInstagram, color: "#E4405F", bg: "rgba(228,64,95,0.1)" },
  TikTok: { icon: FaTiktok, color: "#111827", bg: "rgba(17,24,39,0.08)" },
  YouTube: { icon: FaYoutube, color: "#FF0000", bg: "rgba(255,0,0,0.1)" },
  LinkedIn: { icon: FaLinkedinIn, color: "#0A66C2", bg: "rgba(10,102,194,0.1)" },
  WhatsApp: { icon: FaWhatsapp, color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  Telegram: { icon: FaTelegramPlane, color: "#26A5E4", bg: "rgba(38,165,228,0.1)" },
  X: { icon: FaTwitter, color: "#111827", bg: "rgba(17,24,39,0.08)" },
  Email: { icon: FiMail, color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  Other: { icon: FiGlobe, color: "#64748B", bg: "rgba(100,116,139,0.1)" },
};

const getPlatformVisual = (platform) => platformVisuals[platform] || platformVisuals.Other;

export default function SocialMediaAccountsManager({ emailOnly = false, onSocialAccountsCreated }) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [activePlatformTab, setActivePlatformTab] = useState("All");
  const [hrAssets, setHrAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [syncingPlatforms, setSyncingPlatforms] = useState([]);

  const borderColor = useColorModeValue("rgba(226,232,240,0.9)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const tableHeaderBg = useColorModeValue("rgba(248,250,252,0.92)", "whiteAlpha.100");
  const tableRowBg = useColorModeValue("rgba(255,255,255,0.96)", "whiteAlpha.50");
  const tableHover = useColorModeValue("rgba(248,250,252,0.98)", "rgba(255,255,255,0.05)");
  const tabBg = useColorModeValue("rgba(255,255,255,0.86)", "whiteAlpha.100");
  const tabHoverBg = useColorModeValue("rgba(241,245,249,0.95)", "whiteAlpha.200");
  const activeTabBg = useColorModeValue("linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.2))", "rgba(59,130,246,0.22)");
  const activeTabBorder = useColorModeValue("rgba(59,130,246,0.22)", "rgba(96,165,250,0.3)");
  const activeTabText = useColorModeValue("#1D4ED8", "#BFDBFE");
  const tabHoverText = useColorModeValue("#0F172A", "white");
  const platformTabsBg = useColorModeValue("rgba(248,250,252,0.72)", "whiteAlpha.50");

  const platformTabs = useMemo(() => {
    return emailOnly ? ["Email"] : preferredPlatforms;
  }, [emailOnly]);

  const platformCounts = useMemo(() => {
    return accounts.reduce(
      (counts, account) => ({
        ...counts,
        [account.platform]: (counts[account.platform] || 0) + 1,
      }),
      { All: accounts.length },
    );
  }, [accounts]);

  const assetAssignees = useMemo(() => {
    const assignees = new Map();

    hrAssets.forEach((asset) => {
      const assignedTo = asset?.assignedTo?.trim();
      if (!assignedTo) return;

      const current = assignees.get(assignedTo) || { name: assignedTo, count: 0, assets: [] };
      current.count += 1;
      current.assets.push([asset.name, asset.nameTag, asset.assets].filter(Boolean).join(" - "));
      assignees.set(assignedTo, current);
    });

    if (form.employeeFullName && !assignees.has(form.employeeFullName)) {
      assignees.set(form.employeeFullName, { name: form.employeeFullName, count: 0, assets: [] });
    }

    return Array.from(assignees.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [form.employeeFullName, hrAssets]);

  const selectedAssignee = useMemo(
    () => assetAssignees.find((assignee) => assignee.name === form.employeeFullName),
    [assetAssignees, form.employeeFullName],
  );

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/social-account-credentials`);
      setAccounts(Array.isArray(response.data) ? response.data : response.data?.data || []);
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch social account credentials", fetchError);
      setError("Failed to load social media account credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchHrAssets = async () => {
      try {
        setAssetsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets`);
        setHrAssets(Array.isArray(response.data) ? response.data : response.data?.data || []);
        setAssetsError("");
      } catch (fetchError) {
        console.error("Failed to fetch HR asset users for account assignment", fetchError);
        setHrAssets([]);
        setAssetsError("Could not load HR asset users for assignment.");
      } finally {
        setAssetsLoading(false);
      }
    };

    fetchHrAssets();
  }, []);

  useEffect(() => {
    if (!platformTabs.includes(activePlatformTab)) {
      setActivePlatformTab("All");
    }
  }, [activePlatformTab, platformTabs]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setForm({
      ...initialForm,
      platform: emailOnly ? "Email" : activePlatformTab !== "All" ? activePlatformTab : "",
    });
    onOpen();
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setForm({
      platform: emailOnly ? "Email" : account.platform || "",
      employeeFullName: account.employeeFullName || "",
      accountName: account.accountName || "",
      email: account.email || "",
      phoneNumber: account.phoneNumber || "",
      password: account.password || "",
      socialPlatforms: Array.isArray(account.socialPlatforms) ? account.socialPlatforms : [],
      notes: account.notes || "",
      active: account.active !== false,
    });
    onOpen();
  };

  const closeModal = () => {
    setEditingAccount(null);
    setForm(initialForm);
    onClose();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSelectedSocialPlatform = (platform, checked) => {
    setForm((prev) => {
      const selected = new Set(prev.socialPlatforms || []);
      if (checked) {
        selected.add(platform);
      } else {
        selected.delete(platform);
      }
      return { ...prev, socialPlatforms: Array.from(selected) };
    });
  };

  const handleSocialPlatformToggle = async (platform, checked) => {
    if (!checked) {
      updateSelectedSocialPlatform(platform, false);
      return;
    }

    if (!form.accountName.trim() || !form.employeeFullName.trim()) {
      toast({
        title: "Fill required details first",
        description: "Choose the HR asset user and enter the username before creating the social media account.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    try {
      setSyncingPlatforms((prev) => [...prev, platform]);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/social-account-credentials/sync-email-social-account`, {
        ...form,
        socialPlatforms: [platform],
      });
      updateSelectedSocialPlatform(platform, true);
      toast({
        title: `${platform} account added`,
        description: "This email is now saved as a full social media account record too.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      const syncedAccounts = response?.data?.syncedAccounts || [];
      if (typeof onSocialAccountsCreated === "function") {
        onSocialAccountsCreated(syncedAccounts, { stayOnEmail: true });
      }
    } catch (syncError) {
      console.error("Failed to create social media account from email", syncError);
      toast({
        title: "Social account not created",
        description: syncError.response?.data?.message || `Could not add ${platform} to social media accounts.`,
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setSyncingPlatforms((prev) => prev.filter((item) => item !== platform));
    }
  };

  const renderSocialPlatformBadges = (platforms = []) => {
    const selectedPlatforms = Array.isArray(platforms) ? platforms.filter(Boolean) : [];
    if (!selectedPlatforms.length) {
      return <Text fontSize="sm" color={muted}>No media selected</Text>;
    }

    return (
      <HStack spacing={1.5} flexWrap="wrap">
        {selectedPlatforms.map((platform) => (
          <Badge key={platform} borderRadius="full" px={2.5} py={1} colorScheme="blue" variant="subtle">
            {platform}
          </Badge>
        ))}
      </HStack>
    );
  };

  const handleSave = async () => {
    if (!form.platform.trim() || !form.accountName.trim()) {
      toast({ title: "Missing fields", description: "Platform and account name are required.", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    if (!form.employeeFullName.trim()) {
      toast({
        title: "Assigned user required",
        description: "Choose a user from the HR asset user dropdown before saving.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      let response;
      if (editingAccount?._id) {
        response = await axios.put(`${import.meta.env.VITE_API_URL}/api/social-account-credentials/${editingAccount._id}`, form);
        toast({ title: "Account updated", status: "success", duration: 3000, isClosable: true });
      } else {
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/social-account-credentials`, form);
        toast({ title: "Account created", status: "success", duration: 3000, isClosable: true });
      }
      closeModal();
      await fetchAccounts();

      const syncedAccounts = response?.data?.syncedAccounts || [];
      if (emailOnly && (form.socialPlatforms || []).length && typeof onSocialAccountsCreated === "function") {
        onSocialAccountsCreated(syncedAccounts);
      }
    } catch (saveError) {
      console.error("Failed to save social account credential", saveError);
      toast({
        title: "Save failed",
        description: saveError.response?.data?.message || "Could not save social media account credential.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/social-account-credentials/${accountId}`);
      setAccounts((prev) => prev.map((item) => (item._id === accountId ? { ...item, active: false } : item)));
      toast({ title: "Account deactivated", status: "success", duration: 3000, isClosable: true });
    } catch (deleteError) {
      console.error("Failed to delete social account credential", deleteError);
      toast({
        title: "Delete failed",
        description: deleteError.response?.data?.message || "Could not deactivate social media account credential.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const renderAccountsTable = (rows) => (
    <>
      <VStack display={{ base: "flex", md: "none" }} align="stretch" spacing={3}>
        {rows.map((account) => {
          const platformVisual = getPlatformVisual(account.platform);
          const isActive = account.active !== false;
          return (
            <Box
              key={account._id}
              p={4}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="18px"
              bg={tableRowBg}
              boxShadow={tableRowShadow}
            >
              <HStack justify="space-between" align="start" spacing={3}>
                <HStack spacing={3} minW={0}>
                  <Box p={2.5} borderRadius="14px" bg={platformVisual.bg} color={platformVisual.color} flexShrink={0}>
                    <Icon as={platformVisual.icon} />
                  </Box>
                  <Box minW={0}>
                    <Text fontWeight="800" noOfLines={1}>{account.platform}</Text>
                    <Text fontSize="sm" color={muted} noOfLines={1}>{account.employeeFullName || "No assigned user"}</Text>
                  </Box>
                </HStack>
                <Badge borderRadius="full" px={2.5} py={1} colorScheme={isActive ? "green" : "gray"} variant="subtle" flexShrink={0}>
                  {isActive ? "Active" : "Deactive"}
                </Badge>
              </HStack>

              <VStack align="stretch" spacing={2.5} mt={4}>
                <HStack justify="space-between" gap={3}>
                  <Text fontSize="xs" color={muted} fontWeight="800" textTransform="uppercase">Username</Text>
                  <Text fontSize="sm" fontWeight="700" textAlign="right" noOfLines={1}>{account.accountName}</Text>
                </HStack>
                <HStack justify="space-between" gap={3}>
                  <Text fontSize="xs" color={muted} fontWeight="800" textTransform="uppercase">Email</Text>
                  <Text fontSize="sm" textAlign="right" noOfLines={1}>{account.email || "-"}</Text>
                </HStack>
                {emailOnly ? (
                  <Box>
                    <Text mb={1.5} fontSize="xs" color={muted} fontWeight="800" textTransform="uppercase">Created Social Media</Text>
                    {renderSocialPlatformBadges(account.socialPlatforms)}
                  </Box>
                ) : null}
                <HStack justify="space-between" gap={3}>
                  <Text fontSize="xs" color={muted} fontWeight="800" textTransform="uppercase">Password</Text>
                  <Text fontFamily="mono" fontSize="sm" fontWeight="700" textAlign="right" noOfLines={1}>{account.password || "-"}</Text>
                </HStack>
                <HStack justify="space-between" gap={3}>
                  <Text fontSize="xs" color={muted} fontWeight="800" textTransform="uppercase">Phone</Text>
                  <Text fontSize="sm" textAlign="right" noOfLines={1}>{account.phoneNumber || "-"}</Text>
                </HStack>
              </VStack>

              <HStack justify="flex-end" spacing={2} mt={4}>
                <IconButton aria-label={`Edit ${account.accountName}`} icon={<EditIcon />} size="sm" variant="outline" borderRadius="12px" onClick={() => openEditModal(account)} />
                <IconButton
                  aria-label={`Deactivate ${account.accountName}`}
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  borderRadius="12px"
                  isDisabled={!isActive}
                  onClick={() => handleDelete(account._id)}
                />
              </HStack>
            </Box>
          );
        })}
      </VStack>

      <Box display={{ base: "none", md: "block" }} overflowX="auto">
        <Table variant="unstyled" sx={{ borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <Thead>
            <Tr>
              {["Platform", ...(emailOnly ? ["Created Social Media"] : []), "Assigned User", "Username", "Email", "Password", "Phone Number", "Status", "Actions"].map((heading) => (
                <Th
                  key={heading}
                  px={4}
                  py={3}
                  fontSize="11px"
                  textTransform="uppercase"
                  letterSpacing="0.12em"
                  color={muted}
                  bg={tableHeaderBg}
                  borderYWidth="1px"
                  borderColor={borderColor}
                  _first={{ borderLeftWidth: "1px", borderLeftRadius: "16px" }}
                  _last={{ borderRightWidth: "1px", borderRightRadius: "16px" }}
                >
                  {heading}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((account) => {
              const platformVisual = getPlatformVisual(account.platform);
              const isActive = account.active !== false;
              return (
                <Tr
                  key={account._id}
                  bg={tableRowBg}
                  boxShadow={tableRowShadow}
                  transition="all 0.2s ease"
                  _hover={{ bg: tableHover, transform: "translateY(-1px)", boxShadow: tableRowHoverShadow }}
                >
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor} _first={{ borderLeftWidth: "1px", borderLeftRadius: "18px" }}>
                    <HStack spacing={3}>
                      <Box p={2.5} borderRadius="14px" bg={platformVisual.bg} color={platformVisual.color}>
                        <Icon as={platformVisual.icon} />
                      </Box>
                      <Box>
                        <Text fontWeight="700">{account.platform}</Text>
                        <Badge mt={1} borderRadius="full" px={2.5} py={0.5} colorScheme={isActive ? "green" : "gray"} variant="subtle">
                          {isActive ? "Active" : "Deactive"}
                        </Badge>
                      </Box>
                    </HStack>
                  </Td>
                  {emailOnly ? (
                    <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                      {renderSocialPlatformBadges(account.socialPlatforms)}
                    </Td>
                  ) : null}
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="700">{account.employeeFullName || "-"}</Text>
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="700">{account.accountName}</Text>
                    {account.notes ? <Text mt={1} fontSize="sm" color={muted}>{account.notes}</Text> : null}
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <HStack spacing={2}>
                      <Icon as={FiMail} color={muted} />
                      <Text>{account.email || "-"}</Text>
                    </HStack>
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <Text fontFamily="mono" fontSize="sm" fontWeight="700">{account.password || "-"}</Text>
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <HStack spacing={2}>
                      <Icon as={FiPhone} color={muted} />
                      <Text>{account.phoneNumber || "-"}</Text>
                    </HStack>
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor}>
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={isActive ? "#22C55E" : "#94A3B8"} />
                      <Badge borderRadius="full" px={2.5} py={1} colorScheme={isActive ? "green" : "gray"} variant="subtle">
                        {isActive ? "Active" : "Deactive"}
                      </Badge>
                    </HStack>
                  </Td>
                  <Td px={4} py={4} borderYWidth="1px" borderColor={borderColor} _last={{ borderRightWidth: "1px", borderRightRadius: "18px" }}>
                    <HStack spacing={2}>
                      <IconButton aria-label={`Edit ${account.accountName}`} icon={<EditIcon />} size="sm" variant="outline" borderRadius="12px" onClick={() => openEditModal(account)} />
                      <IconButton
                        aria-label={`Deactivate ${account.accountName}`}
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        borderRadius="12px"
                        isDisabled={!isActive}
                        onClick={() => handleDelete(account._id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </>
  );

  return (
    <VStack align="stretch" spacing={6}>
      <SectionIntro
        eyebrow={emailOnly ? "Email Accounts" : "Social Accounts"}
        title={emailOnly ? "Manage email credentials" : "Manage social media credentials"}
        actions={[
          <Button key="create" leftIcon={<AddIcon />} borderRadius="16px" onClick={openCreateModal} colorScheme="blue">
            {emailOnly ? "Add email" : "Add account"}
          </Button>,
        ]}
      />

      {error ? (
        <Alert status="error" borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
          <AlertIcon />
          <Box>
            <AlertTitle>Credential sync issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      {assetsError ? (
        <Alert status="warning" borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
          <AlertIcon />
          <Box>
            <AlertTitle>HR asset users unavailable</AlertTitle>
            <AlertDescription>{assetsError}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      {loading ? (
        <SurfaceCard>
          <Box p={6}>
            <HStack spacing={3}>
              <Spinner size="sm" />
              <Text color={muted}>Loading social media accounts...</Text>
            </HStack>
          </Box>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <Box p={{ base: 3, md: 4 }}>
            <Tabs
              variant="unstyled"
              index={Math.max(platformTabs.indexOf(activePlatformTab), 0)}
              onChange={(index) => setActivePlatformTab(platformTabs[index] || "All")}
            >
              <Box>
                <Box
                  p={2}
                  mb={4}
                  borderRadius="18px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={platformTabsBg}
                >
                  <Text px={3} py={2} fontSize="11px" fontWeight="800" letterSpacing="0.12em" textTransform="uppercase" color={muted}>
                    {emailOnly ? "Email" : "Social Media"}
                  </Text>
                  <TabList gap={2} overflowX="auto" flexWrap={{ base: "nowrap", lg: "wrap" }}>
                    {platformTabs.map((platform) => {
                      const platformVisual = getPlatformVisual(platform);
                      return (
                        <Tab
                          key={platform}
                          minW="max-content"
                          px={3}
                          py={2.5}
                          borderRadius="14px"
                          bg={tabBg}
                          borderWidth="1px"
                          borderColor="transparent"
                          color={muted}
                          fontSize="sm"
                          fontWeight="700"
                          justifyContent="space-between"
                          transition="all 0.2s ease"
                          _hover={{ bg: tabHoverBg, color: tabHoverText }}
                          _selected={{
                            bg: activeTabBg,
                            borderColor: activeTabBorder,
                            color: activeTabText,
                            boxShadow: "0 10px 22px rgba(37,99,235,0.08)",
                          }}
                        >
                          <HStack spacing={2}>
                            <Box display="grid" placeItems="center" w="24px" h="24px" borderRadius="9px" bg={platformVisual.bg} color={platformVisual.color}>
                              <Icon as={platformVisual.icon} boxSize={3.5} />
                            </Box>
                            <Text>{platform}</Text>
                          </HStack>
                          <Badge borderRadius="full" px={2} variant="subtle" colorScheme={platformCounts[platform] ? "blue" : "gray"}>
                            {platformCounts[platform] || 0}
                          </Badge>
                        </Tab>
                      );
                    })}
                  </TabList>
                </Box>
                <TabPanels minW={0}>
                  {platformTabs.map((platform) => {
                    const platformRows = platform === "All" ? accounts : accounts.filter((account) => account.platform === platform);
                    return (
                      <TabPanel key={platform} p={0}>
                      {platformRows.length ? (
                        renderAccountsTable(platformRows)
                      ) : (
                        <EmptyStateBlock
                            title={platform === "All" ? "No social media accounts saved" : `No ${platform} accounts saved`}
                            description={
                              platform === "All"
                                ? "Select a social media tab or add the first credential record for your team."
                                : `Add ${platform} credentials here to manage account email, phone number, and password details.`
                            }
                            badge={platform === "All" ? "Accounts Empty" : "No Records"}
                            action={
                              <Button size="sm" borderRadius="14px" onClick={openCreateModal} colorScheme="blue">
                                {emailOnly ? "Add email" : platform === "All" ? "Add first account" : "Add account"}
                              </Button>
                            }
                          />
                        )}
                      </TabPanel>
                    );
                  })}
                </TabPanels>
              </Box>
            </Tabs>
          </Box>
        </SurfaceCard>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="24px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>{editingAccount ? (emailOnly ? "Edit email account" : "Edit social account") : emailOnly ? "Add email account" : "Add social account"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Platform</FormLabel>
                <Select
                  placeholder={emailOnly ? undefined : "Select social platform"}
                  value={form.platform}
                  onChange={(event) => handleChange("platform", event.target.value)}
                  borderRadius="16px"
                  borderColor={borderColor}
                  isDisabled={emailOnly}
                >
                  {(emailOnly ? ["Email"] : accountPlatformOptions).map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Assign HR Asset User</FormLabel>
                <Select
                  placeholder={assetsLoading ? "Loading HR asset users..." : "Select HR asset user"}
                  value={form.employeeFullName}
                  onChange={(event) => handleChange("employeeFullName", event.target.value)}
                  borderRadius="16px"
                  borderColor={borderColor}
                  isDisabled={assetsLoading || assetAssignees.length === 0}
                >
                  {assetAssignees.map((assignee) => (
                    <option key={assignee.name} value={assignee.name}>
                      {assignee.count ? `${assignee.name} (${assignee.count} asset${assignee.count === 1 ? "" : "s"})` : assignee.name}
                    </option>
                  ))}
                </Select>
                {selectedAssignee?.assets?.length ? (
                  <Text mt={2} fontSize="xs" color={muted} noOfLines={2}>
                    Assets: {selectedAssignee.assets.slice(0, 3).join(", ")}
                    {selectedAssignee.assets.length > 3 ? ` +${selectedAssignee.assets.length - 3} more` : ""}
                  </Text>
                ) : null}
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input value={form.accountName} onChange={(event) => handleChange("accountName", event.target.value)} borderRadius="16px" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={form.email} onChange={(event) => handleChange("email", event.target.value)} borderRadius="16px" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input value={form.phoneNumber} onChange={(event) => handleChange("phoneNumber", event.target.value)} borderRadius="16px" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={form.active ? "active" : "deactive"}
                  onChange={(event) => handleChange("active", event.target.value === "active")}
                  borderRadius="16px"
                  borderColor={borderColor}
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </Select>
              </FormControl>
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    borderRadius="16px"
                    borderColor={borderColor}
                  />
                  <InputRightElement>
                    <Icon as={FiLock} color={muted} />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              {emailOnly ? (
                <FormControl gridColumn={{ md: "span 2" }}>
                  <FormLabel>Created Social Media</FormLabel>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                    {emailSocialPlatformOptions.map((platform) => (
                      <Checkbox
                        key={platform}
                        isChecked={(form.socialPlatforms || []).includes(platform)}
                        onChange={(event) => handleSocialPlatformToggle(platform, event.target.checked)}
                        isDisabled={syncingPlatforms.includes(platform)}
                        colorScheme="blue"
                      >
                        {platform}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                  <Text mt={2} fontSize="xs" color={muted}>
                    Select the social media accounts created using this email.
                  </Text>
                </FormControl>
              ) : null}
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel>Notes</FormLabel>
                <Textarea value={form.notes} onChange={(event) => handleChange("notes", event.target.value)} borderRadius="16px" borderColor={borderColor} rows={4} />
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} borderRadius="16px" colorScheme="blue" onClick={handleSave} isLoading={saving}>
              {editingAccount ? "Save changes" : "Create account"}
            </Button>
            <Button variant="ghost" borderRadius="16px" onClick={closeModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
