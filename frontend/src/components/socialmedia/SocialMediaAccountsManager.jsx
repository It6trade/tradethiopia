import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { verifyWhatsAppConnection, sendWhatsAppBroadcast } from "../../services/whatsappService";
import { verifyLinkedInConnection } from "../../services/linkedinService";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { FiGlobe, FiLock, FiMail, FiPhone, FiEye, FiEyeOff, FiCopy, FiCheck, FiSearch, FiInfo, FiShield, FiLayers } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegramPlane, FaTiktok, FaTwitter, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { EmptyStateBlock, SectionIntro, SurfaceCard, ResponsiveDataView, PlatformBadge } from "./SocialMediaPrimitives";
import { useUserStore } from "../../store/user";

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
  Integrations: { icon: FiLayers, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  Other: { icon: FiGlobe, color: "#64748B", bg: "rgba(100,116,139,0.1)" },
};

const getPlatformVisual = (platform) => platformVisuals[platform] || platformVisuals.Other;

export default function SocialMediaAccountsManager({
  emailOnly = false,
  onSocialAccountsCreated,
  initialTab = "All",
  showIntegrationsOnly = false,
}) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [activePlatformTab, setActivePlatformTab] = useState(initialTab);
  const [hrAssets, setHrAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [syncingPlatforms, setSyncingPlatforms] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthPages, setOauthPages] = useState([]);
  const [showOauthModal, setShowOauthModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPageId, setManualPageId] = useState("");
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [manualEmployeeName, setManualEmployeeName] = useState("");
  const [oauthEmployeeName, setOauthEmployeeName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // --- WhatsApp Integration State ---
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappAccountId, setWhatsappAccountId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappEmployeeName, setWhatsappEmployeeName] = useState("");
  const [isVerifyingWhatsapp, setIsVerifyingWhatsapp] = useState(false);
  const [whatsappTestRecipient, setWhatsappTestRecipient] = useState("");
  const [whatsappTestMessage, setWhatsappTestMessage] = useState("");
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);

  // --- LinkedIn Integration State ---
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinUrn, setLinkedinUrn] = useState("");
  const [linkedinToken, setLinkedinToken] = useState("");
  const [linkedinEmployeeName, setLinkedinEmployeeName] = useState("");
  const [isVerifyingLinkedin, setIsVerifyingLinkedin] = useState(false);

  const borderColor = useColorModeValue("rgba(226,232,240,0.9)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const tableRowBg = useColorModeValue("rgba(255,255,255,0.96)", "whiteAlpha.50");
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

  const employeesList = useMemo(() => {
    if (!users || !users.length) return [];
    const list = users
      .map((u) => (u.fullName || u.username || "").trim())
      .filter((name) => name && name !== ".." && name !== ".");
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const facebookIntegration = useMemo(() => {
    return accounts.find(a => a.platform === "Facebook" && a.isConnected && a.active !== false);
  }, [accounts]);

  const whatsappIntegration = useMemo(() => {
    return accounts.find(a => a.platform === "WhatsApp" && a.isConnected && a.active !== false);
  }, [accounts]);

  const linkedinIntegration = useMemo(() => {
    return accounts.find(a => a.platform === "LinkedIn" && a.isConnected && a.active !== false);
  }, [accounts]);


  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/social-account-credentials");
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
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const fetchHrAssets = async () => {
      try {
        setAssetsLoading(true);
        const response = await axiosInstance.get("/assets");
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

  useEffect(() => {
    const fbSuccess = searchParams.get("fb_success");
    const fbError = searchParams.get("fb_error");
    const pagesData = searchParams.get("pages");

    if (fbSuccess && pagesData) {
      try {
        const parsedPages = JSON.parse(decodeURIComponent(pagesData));
        setOauthPages(parsedPages);
        setShowOauthModal(true);
        setActivePlatformTab("Integrations");
      } catch (e) {
        console.error("Pages parse error:", e);
        toast({
          title: "Pages parsing failed",
          description: "Failed to parse the pages list returned from Facebook.",
          status: "error",
          duration: 4500,
          isClosable: true,
        });
      }
      // Clear query parameters
      setSearchParams({}, { replace: true });
    } else if (fbError) {
      toast({
        title: "Facebook Integration Error",
        description: decodeURIComponent(fbError),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setSearchParams({}, { replace: true });
      setActivePlatformTab("Integrations");
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.source === "facebook-oauth") {
        const { success, pages, error: oauthError } = event.data;
        if (success && pages) {
          setOauthPages(pages);
          setShowOauthModal(true);
          toast({
            title: "OAuth Success",
            description: "Successfully fetched managed Facebook Pages.",
            status: "success",
            duration: 4000,
            isClosable: true,
          });
        } else if (oauthError) {
          toast({
            title: "Facebook Integration Error",
            description: oauthError,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }

      if (event.data && event.data.source === "linkedin-oauth") {
        const { success, urn, name, token, error: oauthError } = event.data;
        if (success && urn && token) {
          setLinkedinUrn(urn);
          setLinkedinToken(token);
          setShowLinkedinModal(true);
          toast({
            title: "LinkedIn Connected!",
            description: `Authenticated as "${name}". Please select an assigned manager to link.`,
            status: "success",
            duration: 6000,
            isClosable: true,
          });
        } else if (oauthError) {
          toast({
            title: "LinkedIn Integration Error",
            description: oauthError,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [toast]);


  const openCreateModal = () => {
    setEditingAccount(null);
    setForm({
      ...initialForm,
      platform: emailOnly ? "Email" : activePlatformTab !== "All" ? activePlatformTab : "",
    });
    setShowModalPassword(false);
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
    setShowModalPassword(false);
    onOpen();
  };

  const closeModal = () => {
    setEditingAccount(null);
    setForm(initialForm);
    setShowModalPassword(false);
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
      const response = await axiosInstance.post("/social-account-credentials/sync-email-social-account", {
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
        response = await axiosInstance.put(`/social-account-credentials/${editingAccount._id}`, form);
        toast({ title: "Account updated", status: "success", duration: 3000, isClosable: true });
        if (selectedAccount?._id === editingAccount._id) {
          setSelectedAccount({ ...selectedAccount, ...form });
        }
      } else {
        response = await axiosInstance.post("/social-account-credentials", form);
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
      await axiosInstance.delete(`/social-account-credentials/${accountId}`);
      setAccounts((prev) => prev.map((item) => (item._id === accountId ? { ...item, active: false } : item)));
      toast({ title: "Account deactivated", status: "success", duration: 3000, isClosable: true });
      if (selectedAccount?._id === accountId) {
        setSelectedAccount(prev => prev ? { ...prev, active: false } : null);
      }
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

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (accountId, field, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField({ accountId, field });
    toast({
      title: `${field.charAt(0).toUpperCase() + field.slice(1)} copied`,
      status: "success",
      duration: 1500,
      isClosable: true,
      position: "bottom-right",
    });
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleConnectPage = async (page, employeeName) => {
    if (!employeeName) {
      toast({
        title: "Manager required",
        description: "Please select an assigned manager for this Page integration.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        platform: "Facebook",
        employeeFullName: employeeName,
        accountName: page.name,
        pageId: page.id,
        accessToken: page.access_token,
        isConnected: true,
        active: true,
      };
      await axiosInstance.post("/social-account-credentials", payload);
      toast({
        title: "Facebook Page Connected!",
        description: `Successfully integrated with page "${page.name}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowOauthModal(false);
      setOauthEmployeeName("");
      await fetchAccounts();
    } catch (err) {
      console.error("Failed to connect page", err);
      toast({
        title: "Connection Failed",
        description: err.response?.data?.message || "Failed to save the connected page.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualVerifyAndLink = async () => {
    if (!manualPageId.trim() || !manualAccessToken.trim() || !manualEmployeeName.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter Page ID, Access Token, and choose an assigned manager.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Verify with backend
      const verifyRes = await axiosInstance.post("/facebook/verify-connection", {
        pageId: manualPageId.trim(),
        accessToken: manualAccessToken.trim(),
      });

      const pageName = verifyRes.data?.pageName || "Manual Page";

      // 2. Save
      const payload = {
        platform: "Facebook",
        employeeFullName: manualEmployeeName,
        accountName: pageName,
        pageId: manualPageId.trim(),
        accessToken: manualAccessToken.trim(),
        isConnected: true,
        active: true,
      };

      await axiosInstance.post("/social-account-credentials", payload);

      toast({
        title: "Linked Successfully!",
        description: `Verified and connected to Facebook Page "${pageName}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setManualPageId("");
      setManualAccessToken("");
      setManualEmployeeName("");
      setShowManualModal(false);
      await fetchAccounts();
    } catch (err) {
      console.error("Manual connection failed:", err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Verify your Page ID and Token and try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWhatsAppVerifyAndLink = async () => {
    if (!whatsappPhoneId.trim() || !whatsappAccountId.trim() || !whatsappToken.trim() || !whatsappEmployeeName.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter Phone Number ID, Business Account ID, Access Token, and choose an assigned manager.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifyingWhatsapp(true);
    try {
      await verifyWhatsAppConnection({
        phoneNumberId: whatsappPhoneId.trim(),
        whatsappBusinessAccountId: whatsappAccountId.trim(),
        accessToken: whatsappToken.trim(),
        employeeFullName: whatsappEmployeeName.trim(),
      });

      toast({
        title: "Linked Successfully!",
        description: "WhatsApp Business API verified and connected successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setWhatsappPhoneId("");
      setWhatsappAccountId("");
      setWhatsappToken("");
      setWhatsappEmployeeName("");
      setShowWhatsappModal(false);
      await fetchAccounts();
    } catch (err) {
      console.error("WhatsApp connection failed:", err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || err.message || "Failed to verify WhatsApp credentials.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsVerifyingWhatsapp(false);
    }
  };

  const handleLinkedInVerifyAndLink = async () => {
    if (!linkedinUrn.trim() || !linkedinToken.trim() || !linkedinEmployeeName.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter LinkedIn Member/Organization URN, Access Token, and choose an assigned manager.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifyingLinkedin(true);
    try {
      await verifyLinkedInConnection({
        linkedinUrn: linkedinUrn.trim(),
        accessToken: linkedinToken.trim(),
        employeeFullName: linkedinEmployeeName.trim(),
      });

      toast({
        title: "Linked Successfully!",
        description: "LinkedIn verified and connected successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setLinkedinUrn("");
      setLinkedinToken("");
      setLinkedinEmployeeName("");
      setShowLinkedinModal(false);
      await fetchAccounts();
    } catch (err) {
      console.error("LinkedIn connection failed:", err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || err.message || "Failed to verify LinkedIn credentials.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsVerifyingLinkedin(false);
    }
  };

  const handleWhatsAppSendBroadcast = async () => {
    if (!whatsappTestRecipient.trim()) {
      toast({
        title: "Recipient Required",
        description: "Please enter a recipient phone number with country code.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSendingWhatsapp(true);
    try {
      const isTemplate = !whatsappTestMessage.trim();
      const payload = {
        recipientPhone: whatsappTestRecipient.trim(),
      };
      if (isTemplate) {
        payload.templateName = "hello_world";
        payload.templateLanguage = "en_US";
      } else {
        payload.messageText = whatsappTestMessage.trim();
      }

      await sendWhatsAppBroadcast(payload);

      toast({
        title: "Broadcast Sent!",
        description: `Successfully sent message to ${whatsappTestRecipient}.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
      setWhatsappTestMessage("");
    } catch (err) {
      console.error("WhatsApp broadcast failed:", err);
      toast({
        title: "Send Failed",
        description: err.response?.data?.message || err.message || "Failed to send WhatsApp message.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  const renderIntegrationsPanel = () => {
    const isInstagramLinked = facebookIntegration && facebookIntegration.instagramBusinessAccountId;

    return (
      <Box p={{ base: 4, md: 6 }} borderRadius="16px" bg={tableRowBg} border="1px solid" borderColor={borderColor}>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
          {/* Facebook Integration Card */}
          <Flex
            direction="column"
            justify="space-between"
            p={5}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="14px"
            bg={useColorModeValue("white", "whiteAlpha.50")}
            boxShadow="0 4px 20px rgba(0,0,0,0.015)"
            position="relative"
            transition="all 0.25s ease"
            _hover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.04)", borderColor: "blue.200" }}
            minH="380px"
          >
            <Box>
              <HStack justify="space-between" align="flex-start" mb={4}>
                <HStack spacing={3}>
                  <Box p={3} borderRadius="12px" bg="rgba(24,119,242,0.1)" color="#1877F2">
                    <Icon as={FaFacebookF} boxSize={6} />
                  </Box>
                  <Box>
                    <Text fontSize="md" fontWeight="800">Facebook Page</Text>
                    <Text fontSize="xs" color={muted}>Direct API publishing</Text>
                  </Box>
                </HStack>
                <Badge colorScheme={facebookIntegration ? "green" : "gray"} borderRadius="full" px={2.5} py={0.5}>
                  {facebookIntegration ? "Connected" : "Not Linked"}
                </Badge>
              </HStack>

              {facebookIntegration ? (
                <VStack align="stretch" spacing={4} mt={6}>
                  <Box p={3.5} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="10px" fontSize="xs">
                    <VStack align="stretch" spacing={2.5}>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Connected Page Name</Text>
                        <Text fontWeight="800">{facebookIntegration.accountName}</Text>
                      </Flex>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Page ID</Text>
                        <Text fontWeight="700" fontFamily="mono">{facebookIntegration.pageId}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="600" color={muted}>Assigned Manager</Text>
                        <Text fontWeight="700">{facebookIntegration.employeeFullName || "-"}</Text>
                      </Flex>
                    </VStack>
                  </Box>

                  <Alert status="success" borderRadius="10px" py={2.5}>
                    <AlertIcon boxSize={4} />
                    <AlertDescription fontSize="11px">
                      The platform is linked and ready to publish directly to this Facebook Page.
                    </AlertDescription>
                  </Alert>
                </VStack>
              ) : (
                <Text fontSize="xs" color={muted} lineHeight="tall" mt={4}>
                  Connect your Facebook Page so that the platform can auto-publish scheduled posts. This flow will securely fetch your managed pages and allow you to select which one to connect.
                </Text>
              )}
            </Box>

            {facebookIntegration ? (
              <HStack spacing={2} justify="flex-end" width="100%" mt={4}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  width="100%"
                  leftIcon={<DeleteIcon />}
                  onClick={async () => {
                    await handleDelete(facebookIntegration._id);
                    await fetchAccounts();
                  }}
                >
                  Disconnect Integration
                </Button>
              </HStack>
            ) : (
              <VStack spacing={2.5} width="100%" mt={4}>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={FaFacebookF} />}
                  size="sm"
                  width="100%"
                  borderRadius="10px"
                  onClick={() => {
                    const loginUrl = `${import.meta.env.VITE_API_URL}/api/facebook/login`;
                    const width = 600;
                    const height = 650;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    window.open(
                      loginUrl,
                      "Facebook Login",
                      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                    );
                  }}
                >
                  Connect Automatically
                </Button>
                <Button size="sm" variant="outline" width="100%" borderRadius="10px" onClick={() => setShowManualModal(true)}>
                  Configure Manually
                </Button>
              </VStack>
            )}
          </Flex>

          {/* Instagram Integration Card */}
          <Flex
            direction="column"
            justify="space-between"
            p={5}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="14px"
            bg={useColorModeValue("white", "whiteAlpha.50")}
            boxShadow="0 4px 20px rgba(0,0,0,0.015)"
            position="relative"
            transition="all 0.25s ease"
            _hover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.04)", borderColor: "pink.200" }}
            minH="380px"
          >
            <Box>
              <HStack justify="space-between" align="flex-start" mb={4}>
                <HStack spacing={3}>
                  <Box p={3} borderRadius="12px" bg="rgba(228,64,95,0.1)" color="#E4405F">
                    <Icon as={FaInstagram} boxSize={6} />
                  </Box>
                  <Box>
                    <Text fontSize="md" fontWeight="800">Instagram Business</Text>
                    <Text fontSize="xs" color={muted}>Direct API publishing</Text>
                  </Box>
                </HStack>
                <Badge colorScheme={isInstagramLinked ? "green" : "gray"} borderRadius="full" px={2.5} py={0.5}>
                  {isInstagramLinked ? "Connected" : "Not Linked"}
                </Badge>
              </HStack>

              {isInstagramLinked ? (
                <VStack align="stretch" spacing={4} mt={6}>
                  <Box p={3.5} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="10px" fontSize="xs">
                    <VStack align="stretch" spacing={2.5}>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Instagram ID</Text>
                        <Text fontWeight="800" fontFamily="mono">{facebookIntegration.instagramBusinessAccountId}</Text>
                      </Flex>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Linked FB Page</Text>
                        <Text fontWeight="700">{facebookIntegration.accountName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="600" color={muted}>Assigned Manager</Text>
                        <Text fontWeight="700">{facebookIntegration.employeeFullName || "-"}</Text>
                      </Flex>
                    </VStack>
                  </Box>

                  <Alert status="success" borderRadius="10px" py={2.5}>
                    <AlertIcon boxSize={4} />
                    <AlertDescription fontSize="11px">
                      Instagram is connected via Facebook and ready to publish posts with image + caption.
                    </AlertDescription>
                  </Alert>
                </VStack>
              ) : (
                <Text fontSize="xs" color={muted} lineHeight="tall" mt={4}>
                  {facebookIntegration
                    ? "Your connected Facebook Page is not linked to an Instagram Business account. Please link an Instagram Business profile to your Facebook Page in Settings, then reconnect."
                    : "Connect your Facebook Page integration first. The system will automatically detect the linked Instagram Business account during authentication."}
                </Text>
              )}
            </Box>

            {!isInstagramLinked && (
              <Box p={3} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="10px" fontSize="10px" color={muted} mt={4}>
                <Text fontWeight="700" mb={1}>Requirements:</Text>
                <Text>• Instagram Business or Creator account</Text>
                <Text>• Linked to a managed Facebook Page</Text>
              </Box>
            )}
          </Flex>

          {/* WhatsApp Integration Card */}
          <Flex
            direction="column"
            justify="space-between"
            p={5}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="14px"
            bg={useColorModeValue("white", "whiteAlpha.50")}
            boxShadow="0 4px 20px rgba(0,0,0,0.015)"
            position="relative"
            transition="all 0.25s ease"
            _hover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.04)", borderColor: "green.200" }}
            minH="380px"
          >
            <Box>
              <HStack justify="space-between" align="flex-start" mb={4}>
                <HStack spacing={3}>
                  <Box p={3} borderRadius="12px" bg="rgba(37,211,102,0.1)" color="#25D366">
                    <Icon as={FaWhatsapp} boxSize={6} />
                  </Box>
                  <Box>
                    <Text fontSize="md" fontWeight="800">WhatsApp Business</Text>
                    <Text fontSize="xs" color={muted}>Automated messaging & broadcasts</Text>
                  </Box>
                </HStack>
                <Badge colorScheme={whatsappIntegration ? "green" : "gray"} borderRadius="full" px={2.5} py={0.5}>
                  {whatsappIntegration ? "Connected" : "Not Linked"}
                </Badge>
              </HStack>

              {whatsappIntegration ? (
                <VStack align="stretch" spacing={4} mt={6}>
                  <Box p={3.5} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="10px" fontSize="xs">
                    <VStack align="stretch" spacing={2.5}>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Phone Number ID</Text>
                        <Text fontWeight="800" fontFamily="mono">{whatsappIntegration.whatsappPhoneNumberId}</Text>
                      </Flex>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Business Account ID</Text>
                        <Text fontWeight="700" fontFamily="mono">{whatsappIntegration.whatsappBusinessAccountId}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="600" color={muted}>Assigned Manager</Text>
                        <Text fontWeight="700">{whatsappIntegration.employeeFullName || "-"}</Text>
                      </Flex>
                    </VStack>
                  </Box>

                  <Alert status="success" borderRadius="10px" py={2.5}>
                    <AlertIcon boxSize={4} />
                    <AlertDescription fontSize="11px">
                      WhatsApp Cloud API client is verified and ready to send broadcasts.
                    </AlertDescription>
                  </Alert>
                </VStack>
              ) : (
                <Text fontSize="xs" color={muted} lineHeight="tall" mt={4}>
                  Link your WhatsApp Business phone number using Meta Cloud API credentials to start sending automated broadcasts.
                </Text>
              )}
            </Box>

            {whatsappIntegration ? (
              <HStack spacing={2} justify="flex-end" width="100%" mt={4}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  width="100%"
                  leftIcon={<DeleteIcon />}
                  onClick={async () => {
                    await handleDelete(whatsappIntegration._id);
                    await fetchAccounts();
                  }}
                >
                  Disconnect Integration
                </Button>
              </HStack>
            ) : (
              <VStack spacing={2.5} width="100%" mt={4}>
                <Button size="sm" variant="outline" width="100%" borderRadius="10px" onClick={() => setShowWhatsappModal(true)} colorScheme="green">
                  Connect API Client
                </Button>
              </VStack>
            )}
          </Flex>

          {/* LinkedIn Integration Card */}
          <Flex
            direction="column"
            justify="space-between"
            p={5}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="14px"
            bg={useColorModeValue("white", "whiteAlpha.50")}
            boxShadow="0 4px 20px rgba(0,0,0,0.015)"
            position="relative"
            transition="all 0.25s ease"
            _hover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.04)", borderColor: "linkedin.200" }}
            minH="380px"
          >
            <Box>
              <HStack justify="space-between" align="flex-start" mb={4}>
                <HStack spacing={3}>
                  <Box p={3} borderRadius="12px" bg="rgba(10,102,194,0.1)" color="#0A66C2">
                    <Icon as={FaLinkedinIn} boxSize={6} />
                  </Box>
                  <Box>
                    <Text fontSize="md" fontWeight="800">LinkedIn Feed</Text>
                    <Text fontSize="xs" color={muted}>Direct API feed integration</Text>
                  </Box>
                </HStack>
                <Badge colorScheme={linkedinIntegration ? "green" : "gray"} borderRadius="full" px={2.5} py={0.5}>
                  {linkedinIntegration ? "Connected" : "Not Linked"}
                </Badge>
              </HStack>

              {linkedinIntegration ? (
                <VStack align="stretch" spacing={4} mt={6}>
                  <Box p={3.5} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="10px" fontSize="xs">
                    <VStack align="stretch" spacing={2.5}>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>LinkedIn URN</Text>
                        <Text fontWeight="800" fontFamily="mono" noOfLines={1} maxW="160px">{linkedinIntegration.linkedinUrn}</Text>
                      </Flex>
                      <Flex justify="space-between" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="600" color={muted}>Account Name</Text>
                        <Text fontWeight="700">{linkedinIntegration.accountName}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="600" color={muted}>Assigned Manager</Text>
                        <Text fontWeight="700">{linkedinIntegration.employeeFullName || "-"}</Text>
                      </Flex>
                    </VStack>
                  </Box>

                  <Alert status="success" borderRadius="10px" py={2.5}>
                    <AlertIcon boxSize={4} />
                    <AlertDescription fontSize="11px">
                      LinkedIn is linked and ready to publish posts directly.
                    </AlertDescription>
                  </Alert>
                </VStack>
              ) : (
                <Text fontSize="xs" color={muted} lineHeight="tall" mt={4}>
                  Connect your LinkedIn account to publish shares, updates, and articles to your personal profile or company organization page.
                </Text>
              )}
            </Box>

            {linkedinIntegration ? (
              <HStack spacing={2} justify="flex-end" width="100%" mt={4}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  width="100%"
                  leftIcon={<DeleteIcon />}
                  onClick={async () => {
                    await handleDelete(linkedinIntegration._id);
                    await fetchAccounts();
                  }}
                >
                  Disconnect Integration
                </Button>
              </HStack>
            ) : (
              <VStack spacing={2.5} width="100%" mt={4}>
                <Button
                  colorScheme="linkedin"
                  leftIcon={<Icon as={FaLinkedinIn} />}
                  size="sm"
                  width="100%"
                  borderRadius="10px"
                  onClick={() => {
                    const loginUrl = `${import.meta.env.VITE_API_URL}/api/linkedin/login`;
                    const width = 600;
                    const height = 650;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    window.open(
                      loginUrl,
                      "LinkedIn Login",
                      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                    );
                  }}
                >
                  Connect Automatically
                </Button>
                <Button size="sm" variant="outline" width="100%" borderRadius="10px" onClick={() => setShowLinkedinModal(true)}>
                  Configure Manually
                </Button>
              </VStack>
            )}
          </Flex>
        </SimpleGrid>

        {/* WhatsApp Broadcast Tester Panel */}
        {whatsappIntegration && (
          <Box mt={8} borderTop="1px solid" borderColor={borderColor} pt={6}>
            <Text fontSize="lg" fontWeight="800" mb={4}>WhatsApp Broadcast Tester</Text>
            <Box p={5} borderRadius="12px" border="1px solid" borderColor="blue.100" bg="blue.50" _dark={{ bg: "rgba(59,130,246,0.02)", borderColor: "blue.900" }}>
              <VStack align="stretch" spacing={4}>
                <Text fontSize="xs" color={muted}>
                  Send a direct notification or test message. Standard text messaging is subject to Meta's 24-hour response window. If the recipient hasn't messaged your business in 24 hours, leave the message field blank to send the official Meta <strong>hello_world</strong> template instead.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Recipient Phone Number</FormLabel>
                    <Input
                      placeholder="E.g. +251911123456 (with country code)"
                      value={whatsappTestRecipient}
                      onChange={(e) => setWhatsappTestRecipient(e.target.value)}
                      borderRadius="10px"
                      size="sm"
                      bg={useColorModeValue("white", "whiteAlpha.50")}
                      borderColor={borderColor}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Custom Message Text (Optional)</FormLabel>
                    <Input
                      placeholder="Leave blank to send default hello_world template"
                      value={whatsappTestMessage}
                      onChange={(e) => setWhatsappTestMessage(e.target.value)}
                      borderRadius="10px"
                      size="sm"
                      bg={useColorModeValue("white", "whiteAlpha.50")}
                      borderColor={borderColor}
                    />
                  </FormControl>
                </SimpleGrid>
                <HStack justify="flex-end">
                  <Button
                    colorScheme="whatsapp"
                    leftIcon={<Icon as={FaWhatsapp} />}
                    size="sm"
                    borderRadius="10px"
                    isLoading={isSendingWhatsapp}
                    onClick={handleWhatsAppSendBroadcast}
                  >
                    Send Broadcast
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const handleRowClick = (account) => {
    setSelectedAccount(account);
    onDrawerOpen();
  };

  const getFilteredRowsForTab = (platform) => {
    if (platform === "Integrations") {
      return accounts.filter((account) => account.isConnected);
    }
    let list = accounts;
    if (platform !== "All") {
      list = list.filter((account) => account.platform === platform);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((account) =>
        (account.platform || "").toLowerCase().includes(q) ||
        (account.employeeFullName || "").toLowerCase().includes(q) ||
        (account.accountName || "").toLowerCase().includes(q) ||
        (account.email || "").toLowerCase().includes(q) ||
        (account.phoneNumber || "").toLowerCase().includes(q) ||
        (account.notes || "").toLowerCase().includes(q)
      );
    }
    return list;
  };

  const renderCard = (account) => {
    const platformVisual = getPlatformVisual(account.platform);
    const isActive = account.active !== false;
    const isPwVisible = !!visiblePasswords[account._id];

    const isUserCopied = copiedField?.accountId === account._id && copiedField?.field === "username";
    const isEmailCopied = copiedField?.accountId === account._id && copiedField?.field === "email";
    const isPwCopied = copiedField?.accountId === account._id && copiedField?.field === "password";

    return (
      <Box
        key={account._id}
        p={3.5}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="12px"
        bg={tableRowBg}
        boxShadow="0 4px 12px rgba(0,0,0,0.02)"
        cursor="pointer"
        onClick={() => handleRowClick(account)}
        transition="all 0.2s"
        _hover={{ borderColor: "blue.200" }}
      >
        <HStack justify="space-between" align="center" mb={2.5}>
          <HStack spacing={2.5}>
            <Box p={1.5} borderRadius="8px" bg={platformVisual.bg} color={platformVisual.color} display="grid" placeItems="center">
              <Icon as={platformVisual.icon} boxSize={3.5} />
            </Box>
            <Text fontWeight="800" fontSize="sm">{account.platform}</Text>
          </HStack>
          <Badge borderRadius="full" px={2} py={0.2} colorScheme={isActive ? "green" : "gray"} variant="subtle">
            {isActive ? "Active" : "Deactive"}
          </Badge>
        </HStack>

        <VStack align="stretch" spacing={2} fontSize="xs">
          <HStack justify="space-between">
            <Text color={muted} fontWeight="600">Assigned User</Text>
            <Text fontWeight="700">{account.employeeFullName || "-"}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text color={muted} fontWeight="600">Username</Text>
            <HStack spacing={1}>
              <Text fontWeight="700">{account.accountName}</Text>
              <IconButton
                aria-label="Copy username"
                icon={isUserCopied ? <FiCheck /> : <FiCopy />}
                size="xs"
                variant="ghost"
                h="18px"
                w="18px"
                minW="18px"
                colorScheme={isUserCopied ? "green" : "gray"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(account._id, "username", account.accountName);
                }}
              />
            </HStack>
          </HStack>

          {account.email && (
            <HStack justify="space-between">
              <Text color={muted} fontWeight="600">Email</Text>
              <HStack spacing={1}>
                <Text>{account.email}</Text>
                <IconButton
                  aria-label="Copy email"
                  icon={isEmailCopied ? <FiCheck /> : <FiCopy />}
                  size="xs"
                  variant="ghost"
                  h="18px"
                  w="18px"
                  minW="18px"
                  colorScheme={isEmailCopied ? "green" : "gray"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(account._id, "email", account.email);
                  }}
                />
              </HStack>
            </HStack>
          )}

          <HStack justify="space-between">
            <Text color={muted} fontWeight="600">Password</Text>
            <HStack spacing={1.5}>
              <Text fontFamily="mono" fontWeight="700">
                {isPwVisible ? (account.password || "-") : "••••••••"}
              </Text>
              <HStack spacing={0.5}>
                <IconButton
                  aria-label="Toggle password visibility"
                  icon={isPwVisible ? <FiEyeOff /> : <FiEye />}
                  size="xs"
                  variant="ghost"
                  h="18px"
                  w="18px"
                  minW="18px"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePasswordVisibility(account._id);
                  }}
                />
                <IconButton
                  aria-label="Copy password"
                  icon={isPwCopied ? <FiCheck /> : <FiCopy />}
                  size="xs"
                  variant="ghost"
                  h="18px"
                  w="18px"
                  minW="18px"
                  colorScheme={isPwCopied ? "green" : "gray"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(account._id, "password", account.password);
                  }}
                />
              </HStack>
            </HStack>
          </HStack>
        </VStack>

        <HStack justify="flex-end" spacing={1.5} mt={3} onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="outline" leftIcon={<FiInfo />} onClick={() => handleRowClick(account)}>
            Details
          </Button>
          <IconButton aria-label={`Edit ${account.accountName}`} icon={<EditIcon />} size="xs" variant="outline" onClick={() => openEditModal(account)} />
          <IconButton
            aria-label={`Deactivate ${account.accountName}`}
            icon={<DeleteIcon />}
            size="xs"
            variant="outline"
            colorScheme="red"
            isDisabled={!isActive}
            onClick={() => handleDelete(account._id)}
          />
        </HStack>
      </Box>
    );
  };

  const renderRow = (account, index, { rowProps, cellProps }) => {
    const platformVisual = getPlatformVisual(account.platform);
    const isActive = account.active !== false;
    const isPwVisible = !!visiblePasswords[account._id];
    
    const isUserCopied = copiedField?.accountId === account._id && copiedField?.field === "username";
    const isEmailCopied = copiedField?.accountId === account._id && copiedField?.field === "email";
    const isPwCopied = copiedField?.accountId === account._id && copiedField?.field === "password";

    return (
      <Tr
        key={account._id}
        cursor="pointer"
        onClick={() => handleRowClick(account)}
        {...rowProps}
      >
        <Td {...cellProps}>
          <HStack spacing={2.5}>
            <Box p={1.5} borderRadius="8px" bg={platformVisual.bg} color={platformVisual.color} display="grid" placeItems="center">
              <Icon as={platformVisual.icon} boxSize={3.5} />
            </Box>
            <Text fontWeight="700">{account.platform}</Text>
          </HStack>
        </Td>
        
        <Td {...cellProps}>
          <Text fontWeight="600">{account.employeeFullName || "-"}</Text>
        </Td>
        
        <Td {...cellProps}>
          <HStack spacing={1} maxW="150px">
            <Text fontWeight="700" noOfLines={1}>{account.accountName}</Text>
            <IconButton
              aria-label="Copy username"
              icon={isUserCopied ? <FiCheck /> : <FiCopy />}
              size="xs"
              variant="ghost"
              colorScheme={isUserCopied ? "green" : "gray"}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(account._id, "username", account.accountName);
              }}
            />
          </HStack>
        </Td>
        
        <Td {...cellProps}>
          <HStack spacing={1} maxW="180px">
            <Text noOfLines={1} color={account.email ? "inherit" : muted}>{account.email || "-"}</Text>
            {account.email && (
              <IconButton
                aria-label="Copy email"
                icon={isEmailCopied ? <FiCheck /> : <FiCopy />}
                size="xs"
                variant="ghost"
                colorScheme={isEmailCopied ? "green" : "gray"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(account._id, "email", account.email);
                }}
              />
            )}
          </HStack>
        </Td>
        
        <Td {...cellProps}>
          <HStack spacing={1.5}>
            <Text fontFamily="mono" fontWeight="700">
              {isPwVisible ? (account.password || "-") : "••••••••"}
            </Text>
            <HStack spacing={0.5}>
              {account.password && (
                <>
                  <IconButton
                    aria-label="Toggle password visibility"
                    icon={isPwVisible ? <FiEyeOff /> : <FiEye />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePasswordVisibility(account._id);
                    }}
                  />
                  <IconButton
                    aria-label="Copy password"
                    icon={isPwCopied ? <FiCheck /> : <FiCopy />}
                    size="xs"
                    variant="ghost"
                    colorScheme={isPwCopied ? "green" : "gray"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(account._id, "password", account.password);
                    }}
                  />
                </>
              )}
            </HStack>
          </HStack>
        </Td>
        
        <Td {...cellProps}>
          <Text>{account.phoneNumber || "-"}</Text>
        </Td>
        
        <Td {...cellProps}>
          <HStack spacing={1.5}>
            <Box w="6px" h="6px" borderRadius="full" bg={isActive ? "#22C55E" : "#94A3B8"} />
            <Badge size="sm" borderRadius="full" px={2} py={0.2} colorScheme={isActive ? "green" : "gray"} variant="subtle">
              {isActive ? "Active" : "Deactive"}
            </Badge>
          </HStack>
        </Td>
        
        <Td {...cellProps} onClick={(e) => e.stopPropagation()}>
          <HStack spacing={1}>
            <Tooltip label="View Details">
              <IconButton
                aria-label="View details"
                icon={<FiInfo />}
                size="xs"
                variant="outline"
                borderRadius="6px"
                onClick={() => handleRowClick(account)}
              />
            </Tooltip>
            <Tooltip label="Edit Account">
              <IconButton
                aria-label={`Edit ${account.accountName}`}
                icon={<EditIcon />}
                size="xs"
                variant="outline"
                borderRadius="6px"
                onClick={() => openEditModal(account)}
              />
            </Tooltip>
            <Tooltip label="Deactivate Account">
              <IconButton
                aria-label={`Deactivate ${account.accountName}`}
                icon={<DeleteIcon />}
                size="xs"
                variant="outline"
                colorScheme="red"
                borderRadius="6px"
                isDisabled={!isActive}
                onClick={() => handleDelete(account._id)}
              />
            </Tooltip>
          </HStack>
        </Td>
      </Tr>
    );
  };

  return (
    <VStack align="stretch" spacing={6}>
      {!showIntegrationsOnly && (
        <SectionIntro
          eyebrow={emailOnly ? "Email Accounts" : "Social Accounts"}
          title={emailOnly ? "Manage email credentials" : "Manage social media credentials"}
          actions={[
            <Button key="create" leftIcon={<AddIcon />} borderRadius="14px" onClick={openCreateModal} colorScheme="blue" size="sm">
              {emailOnly ? "Add email" : "Add account"}
            </Button>,
          ]}
        />
      )}

      {error ? (
        <Alert status="error" borderRadius="12px" borderWidth="1px" borderColor={borderColor}>
          <AlertIcon />
          <Box>
            <AlertTitle>Credential sync issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      {assetsError ? (
        <Alert status="warning" borderRadius="12px" borderWidth="1px" borderColor={borderColor}>
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
              <Text color={muted}>{showIntegrationsOnly ? "Loading integration state..." : "Loading credentials..."}</Text>
            </HStack>
          </Box>
        </SurfaceCard>
      ) : showIntegrationsOnly ? (
        renderIntegrationsPanel()
      ) : (
        <SurfaceCard>
          <Box p={{ base: 3.5, md: 4 }}>
            {/* Inline Search Bar */}
            <HStack mb={4} justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <InputGroup maxW="320px" size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color={muted} />
                </InputLeftElement>
                <Input
                  placeholder="Search credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="10px"
                  bg={useColorModeValue("white", "whiteAlpha.50")}
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #2563EB" }}
                />
              </InputGroup>
            </HStack>

            <Tabs
              variant="unstyled"
              index={Math.max(platformTabs.indexOf(activePlatformTab), 0)}
              onChange={(index) => setActivePlatformTab(platformTabs[index] || "All")}
            >
              <Box>
                <Box
                  p={1.5}
                  mb={4}
                  borderRadius="12px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={platformTabsBg}
                >
                  <TabList gap={1.5} overflowX="auto" flexWrap={{ base: "nowrap", lg: "wrap" }}>
                    {platformTabs.map((platform) => {
                      const platformVisual = getPlatformVisual(platform);
                      const tabRows = getFilteredRowsForTab(platform);
                      const count = tabRows.length;
                      
                      return (
                        <Tab
                          key={platform}
                          minW="max-content"
                          px={2.5}
                          py={1.5}
                          borderRadius="8px"
                          bg={tabBg}
                          borderWidth="1px"
                          borderColor="transparent"
                          color={muted}
                          fontSize="xs"
                          fontWeight="700"
                          justifyContent="space-between"
                          transition="all 0.15s ease"
                          _hover={{ bg: tabHoverBg, color: tabHoverText }}
                          _selected={{
                            bg: activeTabBg,
                            borderColor: activeTabBorder,
                            color: activeTabText,
                            boxShadow: "0 4px 12px rgba(37,99,235,0.06)",
                          }}
                        >
                          <HStack spacing={1.5}>
                            <Box display="grid" placeItems="center" w="20px" h="20px" borderRadius="6px" bg={platformVisual.bg} color={platformVisual.color}>
                              <Icon as={platformVisual.icon} boxSize={3} />
                            </Box>
                            <Text>{platform}</Text>
                          </HStack>
                          <Badge ml={2} borderRadius="full" px={1.5} py={0.1} variant="subtle" colorScheme={count ? "blue" : "gray"}>
                            {count}
                          </Badge>
                        </Tab>
                      );
                    })}
                  </TabList>
                </Box>
                <TabPanels minW={0}>
                  {platformTabs.map((platform) => {
                    const platformRows = getFilteredRowsForTab(platform);
                    return (
                      <TabPanel key={platform} p={0}>
                        {platform === "Integrations" ? (
                          renderIntegrationsPanel()
                        ) : (
                          <ResponsiveDataView
                            columns={["Platform", "Assigned User", "Username", "Email", "Password", "Phone Number", "Status", "Actions"]}
                            data={platformRows}
                            renderRow={renderRow}
                            renderCard={renderCard}
                            emptyState={
                              <EmptyStateBlock
                                title={platform === "All" ? "No account records found" : `No ${platform} accounts matching filters`}
                                description={
                                  searchQuery.trim()
                                    ? "Try adjusting your search keywords or checking other tab filters."
                                    : `Add ${platform} credentials here to manage account access, passwords, and assignments.`
                                }
                                badge={platform === "All" ? "Accounts Empty" : "No Records"}
                                action={
                                  <Button size="xs" borderRadius="10px" onClick={openCreateModal} colorScheme="blue">
                                    {emailOnly ? "Add email" : platform === "All" ? "Add first account" : "Add account"}
                                  </Button>
                                }
                              />
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

      {/* Account Details Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={onDrawerClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue("white", "#0F172A")} borderLeft="1px solid" borderColor={borderColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} py={3.5}>
            <HStack spacing={3}>
              {selectedAccount && (
                <>
                  <Box p={2} borderRadius="10px" bg={getPlatformVisual(selectedAccount.platform).bg} color={getPlatformVisual(selectedAccount.platform).color}>
                    <Icon as={getPlatformVisual(selectedAccount.platform).icon} boxSize={4} />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="800">{selectedAccount.platform} Account</Text>
                    <Text fontSize="xs" color={muted}>{selectedAccount.accountName}</Text>
                  </Box>
                </>
              )}
            </HStack>
          </DrawerHeader>
          
          <DrawerBody py={5}>
            {selectedAccount && (
              <VStack align="stretch" spacing={4.5}>
                {/* Security warning */}
                <Box p={3} bg="orange.50" _dark={{ bg: "rgba(221,107,32,0.06)" }} borderRadius="10px" borderLeft="4px solid" borderColor="orange.400">
                  <HStack spacing={2.5} align="flex-start">
                    <Icon as={FiShield} color="orange.500" mt={0.5} boxSize={3.5} />
                    <Box>
                      <Text fontSize="xs" fontWeight="700" color="orange.800" _dark={{ color: "orange.200" }}>Credential Privacy Warning</Text>
                      <Text fontSize="10px" color="orange.700" _dark={{ color: "orange.300" }} mt={0.5}>
                        These credentials grant full operational access to official company platforms. Only share these with authorized team members.
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                {/* Account Details Group */}
                <SurfaceCard>
                  <Box p={3.5}>
                    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color={muted} mb={2.5}>Account Information</Text>
                    <VStack align="stretch" spacing={2.5}>
                      <Flex justify="space-between" py={1} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontSize="xs" fontWeight="600" color={muted}>Platform</Text>
                        <Badge colorScheme="blue" fontSize="xs" py={0.5} px={2} borderRadius="6px">{selectedAccount.platform}</Badge>
                      </Flex>
                      
                      <Flex justify="space-between" py={1} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontSize="xs" fontWeight="600" color={muted}>Status</Text>
                        <Badge colorScheme={selectedAccount.active !== false ? "green" : "gray"} fontSize="xs" py={0.5} px={2} borderRadius="6px">
                          {selectedAccount.active !== false ? "Active" : "Deactive"}
                        </Badge>
                      </Flex>

                      <Flex justify="space-between" py={1} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontSize="xs" fontWeight="600" color={muted}>Assigned Manager</Text>
                        <Text fontSize="xs" fontWeight="700">{selectedAccount.employeeFullName || "-"}</Text>
                      </Flex>
                    </VStack>
                  </Box>
                </SurfaceCard>

                {/* Credential details with copy keys */}
                <SurfaceCard>
                  <Box p={3.5}>
                    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color={muted} mb={2.5}>Access Credentials</Text>
                    <VStack align="stretch" spacing={3}>
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase">Username / ID</Text>
                        <HStack justify="space-between" p={2} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="8px" borderWidth="1px" borderColor={borderColor}>
                          <Text fontSize="xs" fontWeight="700">{selectedAccount.accountName}</Text>
                          <IconButton
                            aria-label="Copy username"
                            icon={copiedField?.accountId === selectedAccount._id && copiedField?.field === "username" ? <FiCheck /> : <FiCopy />}
                            size="xs"
                            variant="ghost"
                            colorScheme={copiedField?.accountId === selectedAccount._id && copiedField?.field === "username" ? "green" : "gray"}
                            onClick={() => handleCopy(selectedAccount._id, "username", selectedAccount.accountName)}
                          />
                        </HStack>
                      </VStack>

                      {selectedAccount.email && (
                        <VStack align="stretch" spacing={1}>
                          <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase">Account Email</Text>
                          <HStack justify="space-between" p={2} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="8px" borderWidth="1px" borderColor={borderColor}>
                            <Text fontSize="xs">{selectedAccount.email}</Text>
                            <IconButton
                              aria-label="Copy email"
                              icon={copiedField?.accountId === selectedAccount._id && copiedField?.field === "email" ? <FiCheck /> : <FiCopy />}
                              size="xs"
                              variant="ghost"
                              colorScheme={copiedField?.accountId === selectedAccount._id && copiedField?.field === "email" ? "green" : "gray"}
                              onClick={() => handleCopy(selectedAccount._id, "email", selectedAccount.email)}
                            />
                          </HStack>
                        </VStack>
                      )}

                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase">Password</Text>
                        <HStack justify="space-between" p={2} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="8px" borderWidth="1px" borderColor={borderColor}>
                          <Text fontSize="xs" fontFamily="mono" fontWeight="700">
                            {visiblePasswords[selectedAccount._id] ? selectedAccount.password : "••••••••••••"}
                          </Text>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Toggle password"
                              icon={visiblePasswords[selectedAccount._id] ? <FiEyeOff /> : <FiEye />}
                              size="xs"
                              variant="ghost"
                              onClick={() => togglePasswordVisibility(selectedAccount._id)}
                            />
                            <IconButton
                              aria-label="Copy password"
                              icon={copiedField?.accountId === selectedAccount._id && copiedField?.field === "password" ? <FiCheck /> : <FiCopy />}
                              size="xs"
                              variant="ghost"
                              colorScheme={copiedField?.accountId === selectedAccount._id && copiedField?.field === "password" ? "green" : "gray"}
                              onClick={() => handleCopy(selectedAccount._id, "password", selectedAccount.password)}
                            />
                          </HStack>
                        </HStack>
                      </VStack>

                      {selectedAccount.phoneNumber && (
                        <VStack align="stretch" spacing={1}>
                          <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase">Phone Number</Text>
                          <HStack justify="space-between" p={2} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="8px" borderWidth="1px" borderColor={borderColor}>
                            <Text fontSize="xs">{selectedAccount.phoneNumber}</Text>
                            <IconButton
                              aria-label="Copy phone"
                              icon={copiedField?.accountId === selectedAccount._id && copiedField?.field === "phone" ? <FiCheck /> : <FiCopy />}
                              size="xs"
                              variant="ghost"
                              colorScheme={copiedField?.accountId === selectedAccount._id && copiedField?.field === "phone" ? "green" : "gray"}
                              onClick={() => handleCopy(selectedAccount._id, "phone", selectedAccount.phoneNumber)}
                            />
                          </HStack>
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                </SurfaceCard>

                {/* Notes Block */}
                <SurfaceCard>
                  <Box p={3.5}>
                    <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color={muted} mb={2}>Administrative Notes</Text>
                    <Text fontSize="xs" bg={useColorModeValue("gray.50", "whiteAlpha.50")} p={3} borderRadius="8px" border="1px solid" borderColor={borderColor} whiteSpace="pre-wrap" color={selectedAccount.notes ? "inherit" : muted}>
                      {selectedAccount.notes || "No operational notes added for this account yet."}
                    </Text>
                  </Box>
                </SurfaceCard>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Modal Account Editor */}
      <Modal isOpen={isOpen} onClose={closeModal} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="18px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>{editingAccount ? (emailOnly ? "Edit Email Account" : "Edit Social Account") : emailOnly ? "Add Email Account" : "Add Social Account"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3.5}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Platform</FormLabel>
                <Select
                  placeholder={emailOnly ? undefined : "Select social platform"}
                  value={form.platform}
                  onChange={(event) => handleChange("platform", event.target.value)}
                  borderRadius="10px"
                  size="sm"
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
                <FormLabel fontSize="xs">Assign Employee</FormLabel>
                <Select
                  placeholder={loading ? "Loading employees..." : "Select employee"}
                  value={form.employeeFullName}
                  onChange={(event) => handleChange("employeeFullName", event.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                  isDisabled={loading || employeesList.length === 0}
                >
                  {employeesList.map((empName) => (
                    <option key={empName} value={empName}>
                      {empName}
                    </option>
                  ))}
                </Select>

              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Username</FormLabel>
                <Input value={form.accountName} onChange={(event) => handleChange("accountName", event.target.value)} borderRadius="10px" size="sm" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Email</FormLabel>
                <Input value={form.email} onChange={(event) => handleChange("email", event.target.value)} borderRadius="10px" size="sm" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Phone Number</FormLabel>
                <Input value={form.phoneNumber} onChange={(event) => handleChange("phoneNumber", event.target.value)} borderRadius="10px" size="sm" borderColor={borderColor} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Status</FormLabel>
                <Select
                  value={form.active ? "active" : "deactive"}
                  onChange={(event) => handleChange("active", event.target.value === "active")}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </Select>
              </FormControl>
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel fontSize="xs">Password</FormLabel>
                <InputGroup size="sm">
                  <Input
                    type={showModalPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    borderRadius="10px"
                    borderColor={borderColor}
                  />
                  <InputRightElement h="100%" display="flex" alignItems="center">
                    <IconButton
                      aria-label="Toggle password visibility"
                      icon={showModalPassword ? <FiEyeOff /> : <FiEye />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowModalPassword((prev) => !prev)}
                    />
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
                <FormLabel fontSize="xs">Notes</FormLabel>
                <Textarea value={form.notes} onChange={(event) => handleChange("notes", event.target.value)} borderRadius="10px" size="sm" borderColor={borderColor} rows={3} />
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter py={3}>
            <Button mr={2} borderRadius="10px" size="sm" colorScheme="blue" onClick={handleSave} isLoading={saving}>
              {editingAccount ? "Save changes" : "Create account"}
            </Button>
            <Button variant="ghost" borderRadius="10px" size="sm" onClick={closeModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Facebook OAuth Callback Modal --- */}
      <Modal isOpen={showOauthModal} onClose={() => setShowOauthModal(false)} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="18px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>Connect Facebook Page</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="xs" color={muted}>
                Select an assigned manager to oversee operations for this page, then choose the Facebook page you want to connect:
              </Text>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Assigned Manager</FormLabel>
                <Select
                  placeholder="Select assigned manager"
                  value={oauthEmployeeName}
                  onChange={(e) => setOauthEmployeeName(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                >
                  {employeesList.map((empName) => (
                    <option key={empName} value={empName}>
                      {empName}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Divider />
              <VStack align="stretch" spacing={2.5} maxH="280px" overflowY="auto">
                {oauthPages.length === 0 ? (
                  <Text fontSize="xs" color={muted} textAlign="center" py={4}>No Facebook Pages found for this account.</Text>
                ) : (
                  oauthPages.map((page) => (
                    <HStack key={page.id} justify="space-between" p={3} borderWidth="1px" borderColor={borderColor} borderRadius="10px" _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                      <VStack align="start" spacing={0.5}>
                        <Text fontSize="xs" fontWeight="700">{page.name}</Text>
                        <Text fontSize="10px" color={muted}>ID: {page.id} • {page.category || "General"}</Text>
                      </VStack>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        borderRadius="8px"
                        isLoading={saving}
                        onClick={() => handleConnectPage(page, oauthEmployeeName)}
                      >
                        Connect Page
                      </Button>
                    </HStack>
                  ))
                )}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={() => setShowOauthModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Facebook Manual Setup Modal --- */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="18px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>Configure Facebook Manually</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3.5}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Assigned Manager</FormLabel>
                <Select
                  placeholder="Select assigned manager"
                  value={manualEmployeeName}
                  onChange={(e) => setManualEmployeeName(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                >
                  {employeesList.map((empName) => (
                    <option key={empName} value={empName}>
                      {empName}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Facebook Page ID</FormLabel>
                <Input
                  placeholder="Enter Page ID (e.g., 1084293812345)"
                  value={manualPageId}
                  onChange={(e) => setManualPageId(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Never-Expiring Page Access Token</FormLabel>
                <Textarea
                  placeholder="Paste Page Access Token"
                  value={manualAccessToken}
                  onChange={(e) => setManualAccessToken(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                  rows={3}
                />
                 <Box mt={2} p={2.5} bg="blue.50" borderRadius="8px" borderWidth="1px" borderColor="blue.100" fontSize="10px" color="blue.700" _dark={{ bg: "rgba(59,130,246,0.06)", color: "blue.300" }}>
                  <HStack spacing={1.5} align="flex-start">
                    <Icon as={FiInfo} mt={0.5} />
                    <Text lineHeight="tall">
                      Use Meta Graph API Explorer or your System User access token settings to get a never-expiring token. Ensure the token has <strong>pages_manage_posts</strong> and <strong>pages_read_engagement</strong> permissions.
                    </Text>
                  </HStack>
                </Box>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="10px"
              mr={2}
              isLoading={isVerifying}
              onClick={handleManualVerifyAndLink}
            >
              Verify & Link Page
            </Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={() => setShowManualModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- WhatsApp API Setup Modal --- */}
      <Modal isOpen={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="18px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>Configure WhatsApp Business API</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3.5}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Assigned Manager</FormLabel>
                <Select
                  placeholder="Select assigned manager"
                  value={whatsappEmployeeName}
                  onChange={(e) => setWhatsappEmployeeName(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                >
                  {employeesList.map((empName) => (
                    <option key={empName} value={empName}>
                      {empName}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">WhatsApp Phone Number ID</FormLabel>
                <Input
                  placeholder="Enter Phone Number ID (e.g., 1056294723910)"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">WhatsApp Business Account ID</FormLabel>
                <Input
                  placeholder="Enter Business Account ID"
                  value={whatsappAccountId}
                  onChange={(e) => setWhatsappAccountId(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">System User Access Token</FormLabel>
                <Textarea
                  placeholder="Paste WhatsApp Cloud API Access Token"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                  rows={3}
                />
                <Box mt={2} p={2.5} bg="green.50" borderRadius="8px" borderWidth="1px" borderColor="green.100" fontSize="10px" color="green.700" _dark={{ bg: "rgba(37,211,102,0.06)", color: "green.300" }}>
                  <HStack spacing={1.5} align="flex-start">
                    <Icon as={FiInfo} mt={0.5} />
                    <Text lineHeight="tall">
                      Obtain your credentials from the Meta App Dashboard under WhatsApp &gt; API Setup. Ensure your System User token has <strong>whatsapp_business_messaging</strong> and <strong>whatsapp_business_management</strong> scopes.
                    </Text>
                  </HStack>
                </Box>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button
              size="sm"
              colorScheme="green"
              borderRadius="10px"
              mr={2}
              isLoading={isVerifyingWhatsapp}
              onClick={handleWhatsAppVerifyAndLink}
            >
              Verify & Link WhatsApp
            </Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={() => setShowWhatsappModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- LinkedIn API Setup Modal --- */}
      <Modal isOpen={showLinkedinModal} onClose={() => setShowLinkedinModal(false)} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="18px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>Configure LinkedIn Integration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3.5}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Assigned Manager</FormLabel>
                <Select
                  placeholder="Select assigned manager"
                  value={linkedinEmployeeName}
                  onChange={(e) => setLinkedinEmployeeName(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                >
                  {employeesList.map((empName) => (
                    <option key={empName} value={empName}>
                      {empName}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">LinkedIn Member or Org URN</FormLabel>
                <Input
                  placeholder="urn:li:person:XXXXX or urn:li:organization:XXXXX"
                  value={linkedinUrn}
                  onChange={(e) => setLinkedinUrn(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">LinkedIn Developer Access Token</FormLabel>
                <Textarea
                  placeholder="Paste LinkedIn Access Token"
                  value={linkedinToken}
                  onChange={(e) => setLinkedinToken(e.target.value)}
                  borderRadius="10px"
                  size="sm"
                  borderColor={borderColor}
                  rows={3}
                />
                <Box mt={2} p={2.5} bg="blue.50" borderRadius="8px" borderWidth="1px" borderColor="blue.100" fontSize="10px" color="blue.700" _dark={{ bg: "rgba(10,102,194,0.06)", color: "blue.300" }}>
                  <HStack spacing={1.5} align="flex-start">
                    <Icon as={FiInfo} mt={0.5} />
                    <Text lineHeight="tall">
                      Register your app in the LinkedIn Developer Portal. Ensure your OAuth token has <strong>w_member_social</strong> and/or <strong>w_organization_social</strong> permissions.
                    </Text>
                  </HStack>
                </Box>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button
              size="sm"
              colorScheme="linkedin"
              borderRadius="10px"
              mr={2}
              isLoading={isVerifyingLinkedin}
              onClick={handleLinkedInVerifyAndLink}
            >
              Verify & Link LinkedIn
            </Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={() => setShowLinkedinModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
