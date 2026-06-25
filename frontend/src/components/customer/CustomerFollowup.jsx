import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Layout from "./Layout";
import FollowupTabPage from "./tabs/FollowupTabPage";
import TrainingTabPage from "./tabs/TrainingTabPage";
import TrainingFollowupTabPage from "./tabs/TrainingFollowupTabPage";
import TrainingFollowupGrouped from "./tabs/TrainingFollowupGrouped";
import TesbinnTabPage from "./tabs/TesbinnTabPage";
import EnsraTabPage from "./tabs/EnsraTabPage";
import ConsultancyTabPage from "./tabs/ConsultancyTabPage";
import TradexTvTabPage from "../tradextv/TradexTvTabPage";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Select,
  Text,
  Spinner,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  Textarea,
  IconButton,
  useMediaQuery,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Tooltip,
  useToast,
  Flex,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  useColorModeValue,
  Radio,
  RadioGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  TableContainer,
  SimpleGrid,
  Checkbox,
  } from "@chakra-ui/react";
import { 
  ArrowBackIcon, 
  EditIcon, 
  DeleteIcon, 
  DownloadIcon,
  SearchIcon,
  RepeatIcon,
  CheckIcon,
  SmallCloseIcon,
  AddIcon,
  SettingsIcon,
  ChevronDownIcon,
  EmailIcon,
} from "@chakra-ui/icons";
import EditCustomerInfo from "./EditCustomerInfo";
import {
  fetchTrainingFollowups,
  createTrainingFollowup,
  updateTrainingFollowup,
  deleteTrainingFollowup,
  fetchEnsraFollowups,
  createEnsraFollowup,
  deleteEnsraFollowup,
  fetchUsers,
} from "../../services/api";

const CustomerFollowup = ({ embedLayout = false, ensraOnly = false }) => {
  const [data, setData] = useState([]);
  const [completedSales, setCompletedSales] = useState([]);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [trainingError, setTrainingError] = useState("");
  const [trainingFollowups, setTrainingFollowups] = useState([]);
  const [ensraFollowups, setEnsraFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [note, setNote] = useState("");
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followupTypeFilter, setFollowupTypeFilter] = useState("all");
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const [updatedServiceProvided, setUpdatedServiceProvided] = useState("");
  const [updatedServiceNotProvided, setUpdatedServiceNotProvided] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [showEnsraFormCard, setShowEnsraFormCard] = useState(false);
  const [trainingSearch, setTrainingSearch] = useState("");
  const [trainingProgressFilter, setTrainingProgressFilter] = useState("all");
  const [trainingSortAsc, setTrainingSortAsc] = useState(true);
  const [trainingScheduleFilter, setTrainingScheduleFilter] = useState("all");
  const [trainingMaterialFilter, setTrainingMaterialFilter] = useState("all");
  const [trainingStartDateFilter, setTrainingStartDateFilter] = useState("");
  const [trainingCourseFilter, setTrainingCourseFilter] = useState("all");
  const [selectedTrainingFollowupIds, setSelectedTrainingFollowupIds] = useState([]);
  const [trainingBulkStartDate, setTrainingBulkStartDate] = useState("");
  const [trainingBulkEndDate, setTrainingBulkEndDate] = useState("");
  const [trainingBulkStartTime, setTrainingBulkStartTime] = useState("");
  const [trainingBulkEndTime, setTrainingBulkEndTime] = useState("");
  const [isApplyingTrainingDates, setIsApplyingTrainingDates] = useState(false);
  const [isTesbinnBulkModalOpen, setIsTesbinnBulkModalOpen] = useState(false);
  const [isCsvImportingTesbinn, setIsCsvImportingTesbinn] = useState(false);
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [trainingAgentOptions, setTrainingAgentOptions] = useState([]);
  const [selectedAgentForAssignment, setSelectedAgentForAssignment] = useState("");
  const [assignableInstructors, setAssignableInstructors] = useState([]);
  const [trainingInstructorOptions, setTrainingInstructorOptions] = useState([]);
  const [selectedInstructorForAssignment, setSelectedInstructorForAssignment] = useState("");
  const [ensraSearch, setEnsraSearch] = useState("");
  const [ensraTypeFilter, setEnsraTypeFilter] = useState("all");
  const [ensraSortAsc, setEnsraSortAsc] = useState(true);
  const [isTrainingEditOpen, setIsTrainingEditOpen] = useState(false);
  const [trainingEditData, setTrainingEditData] = useState(null);
  const [isEnsraEditOpen, setIsEnsraEditOpen] = useState(false);
  const [ensraEditData, setEnsraEditData] = useState(null);
  const [isAddPendingOpen, setIsAddPendingOpen] = useState(false);
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState(null);
  const [activityNote, setActivityNote] = useState("");
  const [activityChannel, setActivityChannel] = useState("");
  const [activityPriority, setActivityPriority] = useState("Medium");
  const [selectedFollowupIds, setSelectedFollowupIds] = useState([]);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationTarget, setConversationTarget] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationText, setConversationText] = useState("");
  const [packagesList, setPackagesList] = useState([]);
  const [providedServices, setProvidedServices] = useState([]);
  const [notProvidedServices, setNotProvidedServices] = useState([]);
  const [pendingForm, setPendingForm] = useState({
    type: "buyer",
    companyName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    country: "",
    industry: "",
    packageScope: "Local",
    packageType: "",
    products: "",
    notes: "",
  });

  const LOCAL_COUNTRY = "ethiopia";
  const normalizeScopeValue = (value = "") => {
    const cleaned = (value || "").toString().trim().toLowerCase();
    if (!cleaned) return "";
    if (cleaned.includes("local")) return "Local";
    if (cleaned.includes("international") || cleaned.includes("intl")) return "International";
    return "";
  };
  const isCountryLocal = (customer = {}) => {
    const countryValue = (customer.country || "").toString().trim().toLowerCase();
    return countryValue === LOCAL_COUNTRY || countryValue.includes("ethiopia");
  };
  const resolvePackageScope = (customer = {}) => {
    const scope = normalizeScopeValue(customer.packageScope);
    if (scope) {
      return scope;
    }
    return isCountryLocal(customer) ? "Local" : "International";
  };
  const isLocalCustomer = (customer = {}) =>
    resolvePackageScope(customer) === "Local";

  const resolveFollowupType = (customer = {}) => {
    const typeValue = (
      (customer.type || customer.customerType || customer.customerTypeName || "").toString().trim().toLowerCase()
    );
    if (typeValue.includes("buyer")) return "buyer";
    if (typeValue.includes("seller")) return "seller";
    return "";
  };

  const displayFollowupType = (customer = {}) => {
    const type = resolveFollowupType(customer);
    if (!type) return "N/A";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const updateFollowupPackageScope = (id, scope) => {
    setData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, packageScope: scope } : item))
    );
    setFilteredData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, packageScope: scope } : item))
    );
  };

  const getColumnPreferenceKey = () => {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    try {
      const base64Payload = token.split(".")[1];
      if (!base64Payload) return null;
      const payload = JSON.parse(atob(base64Payload));
      const userId =
        payload?.id ||
        payload?._id ||
        payload?.userId ||
        payload?.sub ||
        payload?.email ||
        payload?.username;
      return userId ? `columnPrefs_${userId}` : null;
    } catch (err) {
      console.error("Failed to parse user token for column preferences", err);
      return null;
    }
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    try {
      const base64Payload = token.split(".")[1];
      if (!base64Payload) return null;
      const payload = JSON.parse(atob(base64Payload));
      return (
        payload?.id ||
        payload?._id ||
        payload?.userId ||
        payload?.sub ||
        null
      );
    } catch (err) {
      console.error("Failed to parse user token for user ID", err);
      return null;
    }
  };

  const columnPreferenceKey = useMemo(getColumnPreferenceKey, []);
  const currentUserId = useMemo(getCurrentUserId, []);
  const currentUserEmail = useMemo(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      return payload?.email || null;
    } catch {
      return null;
    }
  }, []);
  const canEditColumns = Boolean(columnPreferenceKey);
  const [visibleColumns, setVisibleColumns] = useState({
    followup: {
      select: true,
      quickActions: true,
      clientName: true,
      companyName: true,
      type: true,
      phone: true,
      email: true,
      package: true,
      packageScope: true,
      service: true,
      priority: true,
      calls: true,
      messages: true,
      emails: true,
      deadline: true,
      actions: true,
    },
    completedSales: {
      agentName: true,
      customerName: true,
      trainingProgram: true,
      phone: true,
      email: true,
      schedulePreference: true,
    },
    trainingFollowup: {
      select: true,
      startDate: true,
      endDate: true,
      agentName: true,
      salesAgent: true,
      assignedInstructor: true,
      customerName: true,
      email: true,
      phone: true,
      fieldOfWork: true,
      course: true,
      batchGroup: true,
      schedule: true,
      materialStatus: true,
      progress: true,
      idInfo: true,
      packageStatus: true,
      actions: true,
    },
    ensra: {
      type: true,
      packageType: true,
      companyName: true,
      positionsOffered: true,
      salaryRange: true,
      jobRequirements: true,
      jobSeekerName: true,
      jobSeekerSkills: true,
      jobSeekerExperience: true,
      jobSeekerEducation: true,
      jobSeekerExpectedSalary: true,
      actions: true,
    },
  });

  const persistVisibleColumns = (updater) => {
    setVisibleColumns((prev) => {
      const updated =
        typeof updater === "function" ? updater(prev) : updater;
      if (columnPreferenceKey) {
        try {
          localStorage.setItem(columnPreferenceKey, JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save column preferences", err);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!columnPreferenceKey) return;
    try {
      const saved = localStorage.getItem(columnPreferenceKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setVisibleColumns((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (err) {
      console.error("Failed to load column preferences", err);
    }
  }, [columnPreferenceKey]);
  const normalizeTrainingFollowupId = (value) => {
    if (!value) return "";
    return typeof value === "string" ? value : value.toString();
  };

  const getTrainingFollowupId = (item) =>
    item ? normalizeTrainingFollowupId(item._id || item.id) : "";
  const normalizeRoleValue = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalizeDisplayName = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const currentUserName = useMemo(
    () => (localStorage.getItem("userName") || "").toString().trim(),
    []
  );
  const currentUserRole = useMemo(
    () =>
      normalizeRoleValue(
        localStorage.getItem("userRole") ||
          localStorage.getItem("userRoleRaw") ||
          ""
      ),
    []
  );
  const normalizedUserDisplayName = useMemo(
    () => normalizeDisplayName(currentUserName),
    [currentUserName]
  );
  const CUSTOMER_SUCCESS_ROLES = new Set([
    "customersuccessmanager",
    "customersuccess",
    "customerservice",
  ]);
  const isCustomerSuccessManager = currentUserRole === "customersuccessmanager";
  const isCustomerSuccessAgent =
    CUSTOMER_SUCCESS_ROLES.has(currentUserRole) &&
    currentUserRole !== "customersuccessmanager";
  const extractAgentId = (customer = {}) => {
    const agentId = customer?.agentId;
    if (!agentId) return "";
    if (typeof agentId === "string") return agentId;
    if (typeof agentId === "object") {
      return agentId._id || agentId.id || agentId.agentId || "";
    }
    return "";
  };

  const typeFilteredData = useMemo(() => {
    if (!Array.isArray(filteredData)) return [];
    if (followupTypeFilter === "all") return filteredData;
    return filteredData.filter((item) => resolveFollowupType(item) === followupTypeFilter);
  }, [filteredData, followupTypeFilter]);

  const assignmentFilteredData = useMemo(() => {
    if (isCustomerSuccessManager) return typeFilteredData;
    if (!currentUserId) return [];
    const normalizedCurrentUserId = currentUserId?.toString
      ? currentUserId.toString()
      : currentUserId;
    return typeFilteredData.filter((item) => {
      const assignedAgentId = extractAgentId(item);
      if (!assignedAgentId) return false;
      return assignedAgentId.toString().toLowerCase() === normalizedCurrentUserId.toString().toLowerCase();
    });
  }, [typeFilteredData, currentUserId, isCustomerSuccessManager]);

  const localFollowups = useMemo(
    () => assignmentFilteredData.filter((item) => resolvePackageScope(item) === "Local"),
    [assignmentFilteredData]
  );
  const internationalFollowups = useMemo(
    () => assignmentFilteredData.filter((item) => resolvePackageScope(item) === "International"),
    [assignmentFilteredData]
  );
 const toast = useToast();
  
  // Responsive breakpoints
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");
  
  // Color mode values for consistent theming
  const cardBg = useColorModeValue("white", "gray.700");
  const headerBg = useColorModeValue("blue.500", "blue.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const tableBg = useColorModeValue("white", "gray.800");
  const tableBorderColor = useColorModeValue("gray.200", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");

  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups`);
      if (Array.isArray(response.data)) {
        const normalized = response.data.map((item) => ({
          ...item,
          packageScope: resolvePackageScope(item),
        }));
        setData(normalized);
        setFilteredData(normalized);
      } else {
        setData([]);
        setFilteredData([]);
        setError("Invalid data format received from server");
      }
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      setData([]);
      setFilteredData([]);
      setError("Failed to fetch data: " + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const fetchCompletedSales = async () => {
    setLoadingTraining(true);
    setTrainingError("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setTrainingError("Unauthorized: please sign in to view completed sales.");
        setLoadingTraining(false);
        return;
      }
      
      // First try to get completed sales from SalesCustomer collection
      let completedSalesData = [];
      let hasSalesCustomerData = false;
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-customers`, {
          params: { 
            followupStatus: "Completed"
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
          completedSalesData = response.data;
          hasSalesCustomerData = true;
        }
      } catch (err) {
        console.warn("Failed to fetch from sales-customers, trying followups:", err);
      }
      
      // If no data from SalesCustomer, try Followup collection
      if (!hasSalesCustomerData) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (Array.isArray(response.data)) {
            // Filter for completed status in Followup collection
            completedSalesData = response.data.filter(item => 
              (item.followupStatus || "").toLowerCase() === "completed"
            );
          }
        } catch (err) {
          console.warn("Failed to fetch from followups:", err);
        }
      }

      if (Array.isArray(completedSalesData) && completedSalesData.length > 0) {
        const completed = completedSalesData
          .map((item) => {
            // The backend should now include agentName and agentUsername in the response
            const agentName = item.agentName || 
                            item.agentUsername || 
                            (item.agentId ? String(item.agentId) : "Unknown Agent");

            return {
              id: item._id || item.id,
              agentName,
              customerName: item.customerName || item.clientName || item.companyName || "N/A",
              trainingProgram: item.contactTitle || item.trainingProgram || item.serviceProvided || item.packageType || "Not specified",
              phone: item.phone || item.phoneNumber || "N/A",
              email: item.email || "N/A",
              schedulePreference: item.schedulePreference || item.scheduleShift || "-",
              // Include the raw item in case we need other fields
              _raw: item
            };
          });
        setCompletedSales(completed);
      } else {
        setCompletedSales([]);
        // Only show error if we couldn't fetch from either source
        if (!hasSalesCustomerData) {
          setTrainingError("No completed sales found for training.");
        }
      }
    } catch (err) {
      console.error("API Error:", err);
      setCompletedSales([]);
      setTrainingError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) {
        setTrainingError("Unauthorized: please sign in again to view completed sales.");
      }
      toast({
        title: "Error fetching completed sales",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingTraining(false);
    }
  };

  const resetPendingForm = () => {
    setPendingForm({
      type: "buyer",
      companyName: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      country: "",
      industry: "",
      packageScope: "Local",
      packageType: "",
      products: "",
      notes: "",
    });
  };

  const closeAddPendingModal = () => {
    setIsAddPendingOpen(false);
    resetPendingForm();
  };

  const handleAddPendingSubmit = async (e) => {
    e.preventDefault();
    setIsSavingPending(true);
    const isBuyer = pendingForm.type === "buyer";
    const endpoint = `${import.meta.env.VITE_API_URL}/api/${isBuyer ? "buyers" : "sellers"}`;
    const payload = {
      companyName: pendingForm.companyName,
      contactPerson: pendingForm.contactPerson,
      email: pendingForm.email,
      phoneNumber: pendingForm.phoneNumber,
      country: pendingForm.country,
      industry: pendingForm.industry,
      products: pendingForm.products,
      packageScope: pendingForm.packageScope,
      packageType: pendingForm.packageType,
      ...(isBuyer ? { requirements: pendingForm.notes } : { certifications: pendingForm.notes }),
      agentId: currentUserId,
    };

    try {
      await axios.post(endpoint, payload);
      toast({
        title: "Pending B2B added",
        description: "Customer added to pending list. Refreshing table...",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      resetPendingForm();
      setIsAddPendingOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to add pending B2B customer", err);
      toast({
        title: "Error adding customer",
        description: err.response?.data?.message || err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingPending(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (Array.isArray(data)) {
      const filtered = data.filter(
        (item) =>
          item.clientName && item.companyName &&
          (item.clientName.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  };

  const [trainingForm, setTrainingForm] = useState({
    trainingType: "",
    batch: "",
    startDate: "",
    startTime: "",
    duration: "",
    paymentOption: "full",
    paymentAmount: 0,
    totalAmount: 0,
    specialRequirements: "",
    previousTraining: "",
    agentName: "",
    customerName: "",
    email: "",
    phoneNumber: "",
    fieldOfWork: "",
    scheduleShift: "",
    endDate: "",
    endTime: "",
    materialStatus: "",
    progress: "",
    idInfo: "",
    packageStatus: "",
  });

  const [ensraForm, setEnsraForm] = useState({
    type: "company", // company or jobSeeker
    packageType: "", // numeric/string package id if needed
    companyName: "",
    positionsOffered: "", // comma-separated list
    salaryRange: "",
    jobRequirements: "",
    jobSeekerName: "",
    jobSeekerSkills: "",
    jobSeekerExperience: "",
    jobSeekerEducation: "",
    jobSeekerExpectedSalary: "",
  });

  const trainingPrograms = [
    { id: "International Trade Import Export", name: "International Trade Import Export", duration: "1 weeks", price: 6917 },
    { id: "Data Science", name: "Data Science", duration: "16 weeks", price: 2000 },
    { id: "Coffee Cupping", name: "Coffee Cupping", duration: "8 weeks", price: 29000 },
    { id: "UI/UX Design", name: "UI/UX Design", duration: "8 weeks", price: 1000 },
    { id: "Digital Marketing", name: "Digital Marketing", duration: "6 weeks", price: 800 },
    { id: "Cybersecurity", name: "Cybersecurity", duration: "14 weeks", price: 1800 },
    { id: "DevOps Engineering", name: "DevOps Engineering", duration: "18 weeks", price: 2200 },
    { id: "Cloud Computing", name: "Cloud Computing", duration: "16 weeks", price: 2100 },
  ];

  const handleTrainingTypeChange = (value) => {
    const program = trainingPrograms.find((p) => p.id === value);
    const totalAmount = program ? program.price : 0;
    const paymentAmount = trainingForm.paymentOption === "partial" ? totalAmount * 0.5 : totalAmount;
    setTrainingForm((prev) => ({
      ...prev,
      trainingType: value,
      duration: program ? program.duration : "",
      totalAmount,
      paymentAmount,
    }));
  };

  const handlePaymentOptionChange = (value) => {
    setTrainingForm((prev) => ({
      ...prev,
      paymentOption: value,
      paymentAmount: value === "partial" ? prev.totalAmount * 0.5 : prev.totalAmount,
    }));
  };

  const handleEnsraSubmit = async (e) => {
    e.preventDefault();
    try {
    await createEnsraFollowup({
      ...ensraForm,
      type: ensraForm.type === "individual" ? "jobSeeker" : ensraForm.type, // legacy safety
    });

    toast({
      title: "ENSRA customer added",
      description: "ENSRA follow-up record has been created.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });

    setEnsraForm({
      type: "company",
      packageType: "",
      companyName: "",
      positionsOffered: "",
      salaryRange: "",
      jobRequirements: "",
      jobSeekerName: "",
      jobSeekerSkills: "",
      jobSeekerExperience: "",
      jobSeekerEducation: "",
      jobSeekerExpectedSalary: "",
    });

    setShowEnsraFormCard(false);
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to save ENSRA follow-up", err);
    toast({
      title: "Error",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const mergeDateTimeToIso = (dateValue, timeValue) => {
  if (!dateValue) return null;
  const timePart = timeValue || "00:00";
  const combined = `${dateValue}T${timePart}`;
  const parsed = Date.parse(combined);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
};

const handleTrainingSubmit = async (e) => {
  e.preventDefault();
  try {
    await createTrainingFollowup(trainingForm);

    // Show success toast
    toast({
      title: "Training data captured",
      description: "Training registration data has been recorded.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });

    // Reset form
    setTrainingForm({
      trainingType: "",
      batch: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      duration: "",
      paymentOption: "full",
      paymentAmount: 0,
      totalAmount: 0,
      specialRequirements: "",
      previousTraining: "",
      agentName: "",
      customerName: "",
      email: "",
      phoneNumber: "",
      fieldOfWork: "",
      scheduleShift: "",
      materialStatus: "",
      progress: "",
      idInfo: "",
      packageStatus: "",
    });

    // Refresh the training follow-ups list
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to save training follow-up", err);
    toast({
      title: "Error",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};
  const handleInlineTrainingChange = async (id, field, value) => {
  // optimistic update
  setTrainingFollowups((prev) =>
    prev.map((item) =>
      item._id === id
        ? { ...item, [field]: value }
        : item
    )
  );

  try {
    await updateTrainingFollowup(id, { [field]: value });
  } catch (err) {
    console.error("Failed to update training follow-up", err);
    toast({
      title: "Error updating training",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
    loadTrainingFollowups();
  }
};

const loadTrainingFollowups = async () => {
  try {
    const result = await fetchTrainingFollowups();
    setTrainingFollowups(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error("Failed to load training follow-ups", err);
    setTrainingFollowups([]);
  }
};

const handleApplyTrainingDates = async () => {
  if (selectedTrainingFollowupIds.length === 0) {
    toast({
      title: "No trainings selected",
      description: "Select at least one training to update dates.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return false;
  }
  if (!trainingBulkStartDate && !trainingBulkEndDate) {
    toast({
      title: "Missing dates",
      description: "Provide at least a start or end date to apply.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return false;
  }

  const payload = {};
  if (trainingBulkStartDate) {
    const startIso = mergeDateTimeToIso(trainingBulkStartDate, trainingBulkStartTime);
    if (startIso) payload.startDate = startIso;
  }
  if (trainingBulkEndDate) {
    const endIso = mergeDateTimeToIso(trainingBulkEndDate, trainingBulkEndTime);
    if (endIso) payload.endDate = endIso;
  }
  if (trainingBulkStartTime) {
    payload.startTime = trainingBulkStartTime;
  }
  if (trainingBulkEndTime) {
    payload.endTime = trainingBulkEndTime;
  }

  setIsApplyingTrainingDates(true);
  try {
    await Promise.all(
      selectedTrainingFollowupIds.map((id) => updateTrainingFollowup(id, payload))
    );
    toast({
      title: "Training dates saved",
      description: `Updated ${selectedTrainingFollowupIds.length} record(s).`,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    await loadTrainingFollowups();
    resetTrainingSelection();
    setTrainingBulkStartDate("");
    setTrainingBulkEndDate("");
    setTrainingBulkStartTime("");
    setTrainingBulkEndTime("");
    return true;
  } catch (err) {
    console.error("Failed to apply training dates", err);
    toast({
      title: "Failed to update training dates",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
    return false;
  } finally {
    setIsApplyingTrainingDates(false);
  }
};

const handleBulkUpdate = async () => {
  if (selectedTrainingFollowupIds.length === 0) {
    toast({
      title: "No trainings selected",
      description: "Select at least one training to update.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return false;
  }

  const payload = {};
  if (trainingBulkStartDate) {
    const startIso = mergeDateTimeToIso(trainingBulkStartDate, trainingBulkStartTime);
    if (startIso) payload.startDate = startIso;
  }
  if (trainingBulkEndDate) {
    const endIso = mergeDateTimeToIso(trainingBulkEndDate, trainingBulkEndTime);
    if (endIso) payload.endDate = endIso;
  }
  if (trainingBulkStartTime) {
    payload.startTime = trainingBulkStartTime;
  }
  if (trainingBulkEndTime) {
    payload.endTime = trainingBulkEndTime;
  }

  if (selectedAgentForAssignment) {
    const matchedAgent = trainingAgentOptions.find(
      (option) => option.value === selectedAgentForAssignment
    );
    payload.agentName =
      matchedAgent?.label || selectedAgentForAssignment || "Customer Success Agent";
  }
  if (selectedInstructorForAssignment) {
    const matchedInstructor = trainingInstructorOptions.find(
      (option) => option.value === selectedInstructorForAssignment
    );
    payload.assignedInstructor =
      matchedInstructor?.label || selectedInstructorForAssignment || "Instructor";
  }

  if (Object.keys(payload).length === 0) {
    toast({
      title: "No updates specified",
      description: "Provide dates, times, or assignments before saving.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    return false;
  }

  setIsApplyingTrainingDates(true);
  try {
    await Promise.all(
      selectedTrainingFollowupIds.map((id) => updateTrainingFollowup(id, payload))
    );
    toast({
      title: "Bulk update applied",
      description: `Updated ${selectedTrainingFollowupIds.length} training(s).`,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    await loadTrainingFollowups();
    resetTrainingSelection();
    setTrainingBulkStartDate("");
    setTrainingBulkEndDate("");
    setTrainingBulkStartTime("");
    setTrainingBulkEndTime("");
    setSelectedAgentForAssignment("");
    setSelectedInstructorForAssignment("");
    return true;
  } catch (err) {
    console.error("Failed to apply bulk updates", err);
    toast({
      title: "Failed to apply updates",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
    return false;
  } finally {
    setIsApplyingTrainingDates(false);
  }
};

const loadEnsraFollowups = async () => {
  try {
    const result = await fetchEnsraFollowups();
    const normalized = Array.isArray(result)
      ? result.map((item) => ({
          ...item,
          type: item.type === "individual" ? "jobSeeker" : item.type,
        }))
      : [];
    setEnsraFollowups(normalized);
  } catch (err) {
    console.error("Failed to load ENSRA follow-ups", err);
    setEnsraFollowups([]);
  }
};

  useEffect(() => {
    const fetchPackagesList = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/packages`);
        setPackagesList(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load packages list", err);
      }
    };
    fetchPackagesList();
  }, []);

  useEffect(() => {
    if (!isCustomerSuccessManager) {
      setAssignableAgents([]);
      return;
    }

    let isMounted = true;
    const fetchAssignableAgents = async () => {
      try {
        const users = await fetchUsers();
        const list = Array.isArray(users) ? users : [];
        const filtered = list.filter((user) =>
          CUSTOMER_SUCCESS_ROLES.has(normalizeRoleValue(user.role))
        );
        if (isMounted) {
          setAssignableAgents(filtered);
        }
      } catch (err) {
        console.error("Failed to load Customer Success agents", err);
      }
    };

    fetchAssignableAgents();
    return () => {
      isMounted = false;
    };
  }, [isCustomerSuccessManager]);

  useEffect(() => {
    if (!isCustomerSuccessManager) {
      setAssignableInstructors([]);
      return;
    }

    let isMounted = true;
    const fetchAssignableInstructors = async () => {
      try {
        const users = await fetchUsers();
        const list = Array.isArray(users) ? users : [];
        const filtered = list.filter(
          (user) => normalizeRoleValue(user.role) === "instructor"
        );
        if (isMounted) {
          setAssignableInstructors(filtered);
        }
      } catch (err) {
        console.error("Failed to load instructors", err);
      }
    };

    fetchAssignableInstructors();
    return () => {
      isMounted = false;
    };
  }, [isCustomerSuccessManager]);

  useEffect(() => {
    const primaryOptions = assignableAgents.map((agent) => {
      const label =
        agent.fullName?.trim() ||
        agent.username?.trim() ||
        agent.email?.trim() ||
        `Agent ${agent._id}`;
      return {
        value: agent._id,
        label,
      };
    });

    const existingLabels = new Set(primaryOptions.map((opt) => opt.label));
    const fallbackNames = Array.from(
      new Set(
        trainingFollowups
          .map((item) => item.agentName)
          .filter((name) => name && !existingLabels.has(name))
      )
    ).map((name) => ({ value: name, label: name }));

    setTrainingAgentOptions([...primaryOptions, ...fallbackNames]);
  }, [assignableAgents, trainingFollowups]);

  useEffect(() => {
    const primaryOptions = assignableInstructors.map((instructor) => {
      const label =
        instructor.fullName?.trim() ||
        instructor.username?.trim() ||
        instructor.email?.trim() ||
        `Instructor ${instructor._id}`;
      return {
        value: instructor._id,
        label,
      };
    });

    const existingLabels = new Set(primaryOptions.map((opt) => opt.label));
    const fallbackNames = Array.from(
      new Set(
        trainingFollowups
          .map((item) => item.assignedInstructor)
          .filter((name) => name && !existingLabels.has(name))
      )
    ).map((name) => ({ value: name, label: name }));

    setTrainingInstructorOptions([...primaryOptions, ...fallbackNames]);
  }, [assignableInstructors, trainingFollowups]);

const handleDeleteTrainingFollowup = async (id) => {
  if (!window.confirm("Delete this training follow-up?")) return;
  try {
    await deleteTrainingFollowup(id);
    toast({
      title: "Training follow-up deleted",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to delete training follow-up", err);
    toast({
      title: "Error deleting training follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const handleDeleteEnsraFollowup = async (id) => {
  if (!window.confirm("Delete this ENSRA follow-up?")) return;
  try {
    await deleteEnsraFollowup(id);
    toast({
      title: "ENSRA follow-up deleted",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to delete ENSRA follow-up", err);
    toast({
      title: "Error deleting ENSRA follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const openTrainingEdit = (item) => {
  setTrainingEditData({ ...item });
  setIsTrainingEditOpen(true);
};

const handleTrainingEditChange = (field, value) => {
  setTrainingEditData((prev) => ({ ...prev, [field]: value }));
};

const saveTrainingEdit = async () => {
  if (!trainingEditData?._id) return;
  try {
    await updateTrainingFollowup(trainingEditData._id, trainingEditData);
    toast({
      title: "Training follow-up updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    setIsTrainingEditOpen(false);
    setTrainingEditData(null);
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to update training follow-up", err);
    toast({
      title: "Error updating training follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const openEnsraEdit = (item) => {
  setEnsraEditData({
    ...item,
    type: item.type === "individual" ? "jobSeeker" : item.type,
  });
  setIsEnsraEditOpen(true);
};

const handleEnsraEditChange = (field, value) => {
  setEnsraEditData((prev) => ({ ...prev, [field]: value }));
};

const saveEnsraEdit = async () => {
  const id = ensraEditData?._id || ensraEditData?.id;
  if (!id) return;
  try {
    await updateEnsraFollowup(id, ensraEditData);
    toast({
      title: "ENSRA follow-up updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    setIsEnsraEditOpen(false);
    setEnsraEditData(null);
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to update ENSRA follow-up", err);
    toast({
      title: "Error updating ENSRA follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};
  // Derived, filtered, and sorted arrays for Training Follow-Up
  const trainingCourseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (trainingFollowups || [])
            .map((item) => item.trainingType)
            .filter(Boolean)
        )
      ),
    [trainingFollowups]
  );

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const baseFilteredTrainingFollowups = [...trainingFollowups]
    .filter((item) => {
      const term = trainingSearch.trim().toLowerCase();
      if (!term) return true;
      return (
        (item.customerName && item.customerName.toLowerCase().includes(term)) ||
        (item.agentName && item.agentName.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.trainingType && item.trainingType.toLowerCase().includes(term))
      );
    })
    .filter((item) => {
      if (trainingProgressFilter === "all") return true;
      return (item.progress || "").toLowerCase() === trainingProgressFilter.toLowerCase();
    })
    .filter((item) => {
      if (trainingScheduleFilter === "all") return true;
      return (item.scheduleShift || "").toLowerCase() === trainingScheduleFilter.toLowerCase();
    })
    .filter((item) => {
      if (trainingMaterialFilter === "all") return true;
      return (item.materialStatus || "").toLowerCase() === trainingMaterialFilter.toLowerCase();
    })
    .filter((item) => {
      if (!trainingStartDateFilter) return true;
      const itemDate = item.startDate
        ? new Date(item.startDate).toISOString().split("T")[0]
        : "";
      return itemDate === trainingStartDateFilter;
    })
    .filter((item) => {
      if (trainingCourseFilter === "all") return true;
      return (item.trainingType || "").toLowerCase() === trainingCourseFilter.toLowerCase();
    })
    .filter((item) => {
      if (!isCustomerSuccessAgent || !normalizedUserDisplayName) return true;
      const agentIdentifier = normalizeDisplayName(item.agentName || "");
      return agentIdentifier.includes(normalizedUserDisplayName);
    })
    .sort((a, b) => {
      const nameA = (a.customerName || "").toLowerCase();
      const nameB = (b.customerName || "").toLowerCase();
      if (nameA < nameB) return trainingSortAsc ? -1 : 1;
      if (nameA > nameB) return trainingSortAsc ? 1 : -1;
      return 0;
    });

  const filteredTrainingFollowups = baseFilteredTrainingFollowups.filter((item) => {
    // Exclude completed trainings whose end date has passed
    const isCompleted = (item.progress || "").toLowerCase() === "completed";
    const end = item.endDate ? new Date(item.endDate) : null;
    if (isCompleted && end && end < todayMidnight) {
      return false;
    }
    return true;
  });

  const groupedTrainingFollowups = useMemo(() => {
    const groups = new Map();
    filteredTrainingFollowups.forEach((item) => {
      const dateKey = item.startDate
        ? new Date(item.startDate).toISOString().split("T")[0]
        : "Not set";
      const courseKey = item.trainingType || "Not set";
      const scheduleKey = item.scheduleShift || "Not set";
      const groupKey = `${dateKey}|${courseKey}|${scheduleKey}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          dateKey,
          courseKey,
          scheduleKey,
          items: [],
          timeRanges: new Set(),
        });
      }
      const group = groups.get(groupKey);
      group.items.push(item);
      const rangeParts = [];
      if (item.startTime) rangeParts.push(item.startTime);
      if (item.endTime) rangeParts.push(item.endTime);
      if (rangeParts.length) {
        group.timeRanges.add(rangeParts.join(" - "));
      }
    });
    return Array.from(groups.values())
      .filter((g) => g.items.length > 0)
      .map(({ dateKey, courseKey, scheduleKey, items, timeRanges }) => ({
        dateKey,
        courseKey,
        scheduleKey,
        items,
        timeRangeDisplay:
          timeRanges && timeRanges.size > 0 ? Array.from(timeRanges).join(", ") : null,
      }));
  }, [filteredTrainingFollowups]);

  const tesbinnFollowups = useMemo(() => {
    // Reuse user-facing filters (search, course, schedule, etc.) but allow completed records even if end date passed
    return baseFilteredTrainingFollowups.filter(
      (item) => (item.progress || "").toLowerCase() === "completed"
    );
  }, [baseFilteredTrainingFollowups]);

  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTesbinn = () => {
    if (!Array.isArray(tesbinnFollowups) || tesbinnFollowups.length === 0) {
      toast({
        title: "No TESBINN data",
        description: "There are no completed TESBINN records to export.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const headers = [
      "Customer Name",
      "Email",
      "Phone Number",
      "Course",
      "Schedule",
      "Batch/Group",
      "Start Date",
      "End Date",
      "Agent",
      "Instructor",
      "Progress",
    ];
    const escapeCsvValue = (value) =>
      `"${String(value || "").replace(/"/g, '""')}"`;
    const rows = tesbinnFollowups.map((item) =>
      [
        item.customerName,
        item.email,
        item.phoneNumber,
        item.trainingType,
        item.scheduleShift,
        item.batch || item.group || item.batchGroup,
        item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
        item.endDate ? new Date(item.endDate).toLocaleDateString() : "",
        item.agentName,
        item.assignedInstructor,
        item.progress,
      ]
        .map(escapeCsvValue)
        .join(",")
    );
    const csvContent = [headers.map(escapeCsvValue).join(","), ...rows].join("\n");
    downloadCsv(csvContent, "tesbinn-completed.csv");
  };

  const prepareTesbinnBulkSelection = (ids, toastMessage) => {
    if (!ids.length) return false;
    setSelectedTrainingFollowupIds(ids);
    const defaultDate = new Date().toISOString().split("T")[0];
    setTrainingBulkStartDate(defaultDate);
    setTrainingBulkEndDate(defaultDate);
    setTrainingBulkStartTime("09:00");
    setTrainingBulkEndTime("17:00");
    setIsTesbinnBulkModalOpen(true);
    if (toastMessage) {
      toast({
        title: toastMessage,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    }
    return true;
  };

  const parseCsvRows = (text) => {
    const rows = [];
    let current = "";
    let inQuotes = false;
    let row = [];

    const pushCell = () => {
      row.push(current);
      current = "";
    };

    const pushRow = () => {
      if (row.length) {
        rows.push(row);
        row = [];
      }
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];

      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        pushCell();
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        pushCell();
        if (char === "\r" && text[i + 1] === "\n") {
          i += 1;
        }
        pushRow();
        continue;
      }

      current += char;
    }

    if (current || row.length) {
      pushCell();
      pushRow();
    }

    return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
  };

  const normalizeCsvHeader = (value) =>
    value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "";

  const getCsvRecordValue = (record, keys = []) => {
    for (const key of keys) {
      if (record[key]) {
        const trimmed = record[key].trim();
        if (trimmed) return trimmed;
      }
    }
    return "";
  };

  const parseCsvDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  };

  const buildTrainingFollowupPayloadFromCsvRecord = (record) => {
    const batchValue = getCsvRecordValue(record, ["batch", "group", "batchgroup"]);
    const payload = {
      customerName: getCsvRecordValue(record, ["customername", "customer"]),
      email: getCsvRecordValue(record, ["email"]),
      phoneNumber: getCsvRecordValue(record, ["phonenumber", "phone"]),
      trainingType: getCsvRecordValue(record, ["course"]),
      scheduleShift: getCsvRecordValue(record, ["schedule"]),
      agentName: getCsvRecordValue(record, ["agent"]),
      salesAgent: getCsvRecordValue(record, ["agent"]),
      assignedInstructor: getCsvRecordValue(record, ["instructor"]),
      progress: getCsvRecordValue(record, ["progress"]) || "Not Started",
      materialStatus: "Not Delivered",
    };
    if (batchValue) {
      payload.batch = batchValue;
    }

    const startDate = getCsvRecordValue(record, ["startdate"]);
    const endDate = getCsvRecordValue(record, ["enddate"]);
    const parsedStart = parseCsvDate(startDate);
    const parsedEnd = parseCsvDate(endDate);
    if (parsedStart) payload.startDate = parsedStart;
    if (parsedEnd) payload.endDate = parsedEnd;

    return payload;
  };

  const handleTesbinnCsvImport = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) {
      return;
    }
    event.target.value = "";

    setIsCsvImportingTesbinn(true);
    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (!rows.length) {
        toast({
          title: "Empty file",
          description: "The selected CSV file contains no data.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const headers = rows[0].map(normalizeCsvHeader);
      const records = rows.slice(1).map((line) => {
        const record = {};
        line.forEach((value, idx) => {
          record[headers[idx] || `column${idx}`] = value || "";
        });
        return record;
      }).filter((record) => Object.values(record).some((value) => value && value.trim()));

      if (!records.length) {
        toast({
          title: "No valid rows",
          description: "The CSV file does not contain recognizable TESBINN data.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const settled = await Promise.allSettled(
        records.map((record) =>
          createTrainingFollowup(buildTrainingFollowupPayloadFromCsvRecord(record))
        )
      );

      const successful = settled
        .map((result) => (result.status === "fulfilled" ? getTrainingFollowupId(result.value) : null))
        .filter(Boolean);

      const failedCount = settled.filter((result) => result.status === "rejected").length;

      await loadTrainingFollowups();

      if (!successful.length) {
        toast({
          title: "Import failed",
          description: "Unable to create training follow-ups from the provided file.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      prepareTesbinnBulkSelection(successful, `Imported ${successful.length} TESBINN record(s) from CSV.`);
      if (failedCount > 0) {
        toast({
          title: "Partial import",
          description: `${failedCount} row(s) failed to import.`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("CSV import failed", err);
      toast({
        title: "CSV import failed",
        description: err.message || "Unable to process the selected file.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsCsvImportingTesbinn(false);
    }
  };

  const closeTesbinnBulkModal = () => setIsTesbinnBulkModalOpen(false);

  const applyTrainingDatesAndClose = async () => {
    const success = await handleApplyTrainingDates();
    if (success) {
      closeTesbinnBulkModal();
    }
  };

  // Derived, filtered, and sorted arrays for ENSRA Follow-Up
  const filteredEnsraFollowups = [...ensraFollowups]
    .filter((item) => {
      const term = ensraSearch.trim().toLowerCase();
      if (!term) return true;
      const company = (item.companyName || "").toLowerCase();
      const seeker = (item.jobSeekerName || "").toLowerCase();
      return company.includes(term) || seeker.includes(term);
    })
    .filter((item) => {
      if (ensraTypeFilter === "all") return true;
      return (item.type || "").toLowerCase() === ensraTypeFilter.toLowerCase();
    })
    .sort((a, b) => {
      const nameA = ((a.companyName || a.jobSeekerName || "").toLowerCase());
      const nameB = ((b.companyName || b.jobSeekerName || "").toLowerCase());
      if (nameA < nameB) return ensraSortAsc ? -1 : 1;
      if (nameA > nameB) return ensraSortAsc ? 1 : -1;
      return 0;
    });

  const handleInlineEnsraChange = (id, field, value) => {
    setEnsraFollowups((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

useEffect(() => {
  fetchData();
  fetchCompletedSales();
  loadTrainingFollowups();
  loadEnsraFollowups();
}, []);

  const handleUpdateServices = async (id) => {
    try {
      const serviceProvided = providedServices.join(", ");
      const serviceNotProvided = notProvidedServices.join(", ");

      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${id}/services`, {
        serviceProvided,
        serviceNotProvided,
      });

      const dataResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups`);
      setData(dataResponse.data);

      setUpdatedServiceProvided("");
      setUpdatedServiceNotProvided("");
      setProvidedServices([]);
      setNotProvidedServices([]);
      setShowUpdateCard(false);

      alert("Services updated successfully.");
    } catch (error) {
      console.error("Failed to update services:", error.message);
      alert("Failed to update services.");
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setNote("");
  };

  const openActivityModal = (client) => {
    setActivityTarget(client);
    setActivityPriority(client.priority || "Medium");
    setActivityChannel("");
    setActivityNote("");
    setSelectedClient(client);
    setIsActivityModalOpen(true);
  };

  const parseServices = (text) =>
    (text || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const initializeServiceLists = (client) => {
    if (!client) return;
    const pkgNumber = client.packageNumber || client.packageType || client.package;
    const marketScope = resolvePackageScope(client) || "Local";
    const pkg =
      packagesList.find(
        (p) =>
          String(p.packageNumber) === String(pkgNumber) &&
          ((p.market || "Local") === marketScope)
      ) ||
      packagesList.find(
        (p) => String(p.packageNumber) === String(pkgNumber)
      );
    const packageServices = pkg?.services || [];

    const provided = parseServices(client.serviceProvided);
    // Always prefer package services for the "not provided" list; fall back to stored notProvided if no package match
    let notProvided = packageServices.length
      ? packageServices.filter((svc) => !provided.includes(svc))
      : parseServices(client.serviceNotProvided).filter((svc) => !provided.includes(svc));

    setProvidedServices(provided);
    setNotProvidedServices(notProvided);
  };

  useEffect(() => {
    if (showUpdateCard && selectedClient) {
      initializeServiceLists(selectedClient);
    }
  }, [showUpdateCard, selectedClient, packagesList]);

  const moveToProvided = (svc) => {
    setNotProvidedServices((prev) => prev.filter((s) => s !== svc));
    setProvidedServices((prev) => (prev.includes(svc) ? prev : [...prev, svc]));
  };

  const moveToNotProvided = (svc) => {
    setProvidedServices((prev) => prev.filter((s) => s !== svc));
    setNotProvidedServices((prev) => (prev.includes(svc) ? prev : [...prev, svc]));
  };

  const updateLocalFollowup = (id, updater) => {
    setData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, ...updater(item) } : item))
    );
    setFilteredData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, ...updater(item) } : item))
    );
  };

  const handleIncrementAttempt = async (type) => {
    if (!activityTarget) return;
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${activityTarget._id}/attempts`, { type });
      const updated = res.data;
      updateLocalFollowup(activityTarget._id, () => updated);
      setActivityTarget(updated);
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} attempt logged`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error logging attempt",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleSavePriority = async () => {
    if (!activityTarget) return;
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${activityTarget._id}/priority`, {
        priority: activityPriority,
      });
      const updated = res.data;
      updateLocalFollowup(activityTarget._id, () => updated);
      setActivityTarget(updated);
      toast({
        title: "Priority updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error updating priority",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleAddCommunication = async () => {
    if (!activityTarget || !activityChannel) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/${activityTarget._id}/communications`, {
        channel: activityChannel,
        note: activityNote,
      });
      const updated = res.data;
      const communications = updated.communicationLogs || updated.communications || [];
      const normalized = { ...updated, communications };
      updateLocalFollowup(activityTarget._id, () => normalized);
      setActivityTarget(normalized);
      setSelectedClient((prev) =>
        prev && prev._id === activityTarget._id ? normalized : prev
      );
      setActivityChannel("");
      setActivityNote("");
      toast({
        title: "Communication logged",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error logging communication",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const toggleSelectFollowup = (id) => {
    setSelectedFollowupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = (list, checked) => {
    if (!Array.isArray(list)) return;
    if (checked) {
      const ids = list.map((item) => item._id);
      setSelectedFollowupIds(ids);
    } else {
      setSelectedFollowupIds([]);
    }
  };

  const clearSelection = () => setSelectedFollowupIds([]);

  const toggleTrainingSelection = (id) => {
    setSelectedTrainingFollowupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllTrainingFollowups = (checked) => {
    if (!Array.isArray(filteredTrainingFollowups)) return;
    if (checked) {
      const ids = filteredTrainingFollowups
        .map((item) => getTrainingFollowupId(item))
        .filter(Boolean);
      setSelectedTrainingFollowupIds(ids);
    } else {
      setSelectedTrainingFollowupIds([]);
    }
  };

  const resetTrainingSelection = () => setSelectedTrainingFollowupIds([]);

  useEffect(() => {
    setSelectedTrainingFollowupIds((prev) =>
      prev.filter((id) =>
        trainingFollowups.some((item) => getTrainingFollowupId(item) === id)
      )
    );
  }, [trainingFollowups]);

  useEffect(() => {
    if (!isCustomerSuccessManager) {
      setSelectedTrainingFollowupIds([]);
      setTrainingBulkStartDate("");
      setTrainingBulkEndDate("");
      setSelectedAgentForAssignment("");
      setSelectedInstructorForAssignment("");
      setTrainingBulkStartTime("");
      setTrainingBulkEndTime("");
    }
  }, [isCustomerSuccessManager]);

  const openBulkEmail = () => {
    if (selectedFollowupIds.length === 0) {
      toast({
        title: "No customers selected",
        description: "Select at least one customer to send bulk email.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsBulkEmailOpen(true);
  };

  const handleBulkEmailSend = async () => {
    if (!bulkSubject || !bulkBody) {
      toast({
        title: "Missing subject/body",
        status: "warning",
      });
      return;
    }
    setIsBulkSending(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/bulk-email`, {
        ids: selectedFollowupIds,
        subject: bulkSubject,
        body: bulkBody,
        sender: currentUserId || "Agent",
        senderEmail: currentUserEmail || undefined,
      });
      toast({
        title: "Bulk email queued",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsBulkEmailOpen(false);
      setBulkSubject("");
      setBulkBody("");
      clearSelection();
      fetchData();
    } catch (err) {
      toast({
        title: "Bulk email failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsBulkSending(false);
    }
  };

  const openConversation = async (client) => {
    setConversationTarget(client);
    setConversationOpen(true);
    setConversationLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/${client._id}/messages`);
      setConversationMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        title: "Failed to load messages",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
      setConversationMessages([]);
    } finally {
      setConversationLoading(false);
    }
  };

  const sendConversationMessage = async () => {
    if (!conversationTarget || !conversationText.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/${conversationTarget._id}/messages`, {
        body: conversationText,
        sender: currentUserId || "Agent",
      });
      setConversationMessages(Array.isArray(res.data) ? res.data : []);
      setConversationText("");
      fetchData();
    } catch (err) {
      toast({
        title: "Failed to send message",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleCloseCard = () => {
    setSelectedClient(null);
  };

  const handleAddNote = async () => {
    if (!selectedClient) {
      alert("No client selected. Please select a client first.");
      return;
    }

    if (note.trim() === "") {
      alert("Please enter a note.");
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/${selectedClient._id}/notes`, { text: note });
      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Note added",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        const notesArray = response.data || [];
        setNote("");
        // Optimistically update local selection and lists
        setSelectedClient((prev) =>
          prev && prev._id === selectedClient._id ? { ...prev, notes: notesArray } : prev
        );
        setActivityTarget((prev) =>
          prev && prev._id === selectedClient._id ? { ...prev, notes: notesArray } : prev
        );
        updateLocalFollowup(selectedClient._id, (prev) => ({ ...prev, notes: notesArray }));
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
      toast({
        title: "Failed to add note",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateLastCalled = async () => {
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${selectedClient._id}/lastCalled`);
      const updatedTime = response.data.lastCalled;
      alert("Last called time updated successfully.");
      setSelectedClient((prev) => ({ ...prev, lastCalled: updatedTime }));
    } catch (err) {
      console.error(err);
      alert("Failed to update last called time.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedRow(item);
    setIsMobileView(true);
  };

  const handleBackToCompanyList = () => {
    setSelectedRow(null);
    setIsMobileView(false);
  };

  const openNotesModal = () => {
    setIsNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    setIsNotesModalOpen(false);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/followups/${id}`);
      alert("Customer deleted successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to delete customer.");
    }
  };

  const renderColumnMenu = (tableKey, columns) => {
    if (!canEditColumns) return null;
    const current = visibleColumns[tableKey] || {};
    const selected = Object.entries(current)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    const handleChange = (values) => {
      persistVisibleColumns((prev) => ({
        ...prev,
        [tableKey]: columns.reduce(
          (acc, col) => ({
            ...acc,
            [col.key]: values.includes(col.key),
          }),
          {}
        ),
      }));
    };

    return (
      <Menu closeOnSelect={false}>
        <MenuButton
          as={Button}
          size="sm"
          leftIcon={<SettingsIcon />}
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          colorScheme="blue"
        >
          Columns
        </MenuButton>
        <MenuList maxH="300px" overflowY="auto">
          <MenuOptionGroup type="checkbox" value={selected} onChange={handleChange}>
            {columns.map((col) => (
              <MenuItemOption key={col.key} value={col.key}>
                {col.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    );
  };

  // Compact table cell component for better spacing
  const CompactCell = ({ children, isHeader = false }) => (
    <Td 
      py={isHeader ? 3 : 2} 
      px={3} 
      fontSize={isHeader ? "sm" : "sm"}
      fontWeight={isHeader ? "bold" : "normal"}
      borderBottom="1px solid"
      borderColor={borderColor}
      whiteSpace="nowrap"
    >
      {children}
    </Td>
  );

  // Compact header cell component
  const CompactHeaderCell = ({ children }) => (
    <Th 
      py={3} 
      px={3} 
      fontSize="sm"
      color="white"
      textTransform="none"
      position="sticky"
      top={0}
      bg={headerBg}
      zIndex={1}
      boxShadow="sm"
      borderColor={borderColor}
    >
      {children}
    </Th>
  );

  const followupColumnOptions = [
    { key: "select", label: "Select" },
    { key: "quickActions", label: "Quick Actions" },
    { key: "clientName", label: "Client Name" },
    { key: "companyName", label: "Company" },
    { key: "type", label: "Type" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "package", label: "Package" },
    { key: "service", label: "Service" },
    { key: "priority", label: "Priority" },
    { key: "calls", label: "Calls" },
    { key: "messages", label: "Messages" },
    { key: "emails", label: "Emails" },
    { key: "deadline", label: "Deadline" },
    { key: "actions", label: "Actions" },
  ];

  const completedSalesColumnOptions = [
    { key: "agentName", label: "Agent Name" },
    { key: "customerName", label: "Customer" },
    { key: "trainingProgram", label: "Training Program" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "schedulePreference", label: "Schedule Preference" },
  ];

  const trainingFollowupColumnOptions = [
    { key: "select", label: "Select" },
    { key: "startDate", label: "Training Start Date" },
    { key: "endDate", label: "Training End Date" },
    { key: "agentName", label: "Agent Name" },
    { key: "salesAgent", label: "Sales Agent" },
    { key: "assignedInstructor", label: "Assigned Instructor" },
    { key: "customerName", label: "Customer Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone Number" },
    { key: "fieldOfWork", label: "Field of Work" },
    { key: "course", label: "Course" },
    { key: "batchGroup", label: "Batch/Group" },
    { key: "schedule", label: "Schedule & Shift" },
    { key: "materialStatus", label: "Material Delivery Status" },
    { key: "progress", label: "Progress" },
    { key: "idInfo", label: "ID Info" },
    { key: "packageStatus", label: "Package Status" },
    { key: "actions", label: "Actions" },
  ];

  const ensraColumnOptions = [
    { key: "type", label: "Type" },
    { key: "packageType", label: "Package Type" },
    { key: "companyName", label: "Company Name" },
    { key: "positionsOffered", label: "Positions Offered" },
    { key: "salaryRange", label: "Salary Range" },
    { key: "jobRequirements", label: "Job Requirements" },
    { key: "jobSeekerName", label: "Job Seeker Name" },
    { key: "jobSeekerSkills", label: "Skills" },
    { key: "jobSeekerExperience", label: "Experience" },
    { key: "jobSeekerEducation", label: "Education" },
    { key: "jobSeekerExpectedSalary", label: "Expected Salary" },
    { key: "actions", label: "Actions" },
  ];

  const buildFollowupColumnsToRender = (currentList = []) => [
    {
      key: "select",
      visible: visibleColumns.followup.select !== false,
      header: (
        <Checkbox
          aria-label="Select all"
          onChange={(e) => selectAllFiltered(currentList, e.target.checked)}
          isChecked={
            Array.isArray(currentList) &&
            currentList.length > 0 &&
            currentList.every((it) => selectedFollowupIds.includes(it._id))
          }
          isIndeterminate={
            selectedFollowupIds.length > 0 &&
            Array.isArray(currentList) &&
            !currentList.every((it) => selectedFollowupIds.includes(it._id))
          }
        />
      ),
      render: (item) => (
        <CompactCell>
          <Checkbox
            aria-label="Select row"
            isChecked={selectedFollowupIds.includes(item._id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectFollowup(item._id);
            }}
          />
        </CompactCell>
      ),
    },
    {
      key: "quickActions",
      visible: visibleColumns.followup.quickActions,
      header: "",
      render: (item) => (
        <CompactCell>
          <HStack spacing={1}>
            <Tooltip label="Update Services">
              <IconButton
                aria-label="Update Services"
                icon={<EditIcon />}
                colorScheme="teal"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClient(item);
                  setShowUpdateCard(true);
                }}
              />
            </Tooltip>
            <Tooltip label="Notes & Activity">
              <IconButton
                aria-label="Notes and activity"
                icon={<SettingsIcon />}
                colorScheme="purple"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openActivityModal(item);
                }}
              />
            </Tooltip>
            <Tooltip label="Open Conversation">
              <IconButton
                aria-label="Open conversation"
                icon={<EmailIcon />}
                colorScheme="blue"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openConversation(item);
                }}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
    {
      key: "clientName",
      visible: visibleColumns.followup.clientName,
      header: "Client Name",
      render: (item) => <CompactCell>{item.clientName}</CompactCell>,
    },
    {
      key: "companyName",
      visible: visibleColumns.followup.companyName,
      header: "Company",
      render: (item) => <CompactCell>{item.companyName}</CompactCell>,
    },
    {
      key: "type",
      visible: visibleColumns.followup.type,
      header: "Type",
      render: (item) => {
        const badgeVariant = resolveFollowupType(item) === "buyer" ? "green" : "purple";
        return (
          <CompactCell>
            <Badge colorScheme={badgeVariant} fontSize="xs">
              {displayFollowupType(item)}
            </Badge>
          </CompactCell>
        );
      },
    },
    {
      key: "phone",
      visible: visibleColumns.followup.phone && !isMobile,
      header: "Phone",
      render: (item) => <CompactCell>{item.phoneNumber}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.followup.email && !isMobile,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "package",
      visible: visibleColumns.followup.package,
      header: "Package",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme="purple" fontSize="xs">
            {item.packageType || "Not specified"}
          </Badge>
        </CompactCell>
      ),
    },
    {
      key: "packageScope",
      visible: visibleColumns.followup.packageScope,
      header: "Package Scope",
      render: (item) => (
        <CompactCell>
          <Input
            as="select"
            size="sm"
            value={resolvePackageScope(item)}
            onChange={(e) => updateFollowupPackageScope(item._id, e.target.value)}
          >
            <option value="Local">Local</option>
            <option value="International">International</option>
          </Input>
        </CompactCell>
      ),
    },
    {
      key: "priority",
      visible: visibleColumns.followup.priority,
      header: "Priority",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme={item.priority === "High" ? "red" : item.priority === "Low" ? "green" : "yellow"} fontSize="xs">
            {item.priority || "Medium"}
          </Badge>
        </CompactCell>
      ),
    },
    {
      key: "calls",
      visible: visibleColumns.followup.calls,
      header: "Calls",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme="blue">{item.call_count || 0}</Badge>
        </CompactCell>
      ),
    },
    {
      key: "messages",
      visible: visibleColumns.followup.messages && !isMobile,
      header: "Messages",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme="purple">{item.message_count || 0}</Badge>
        </CompactCell>
      ),
    },
    {
      key: "emails",
      visible: visibleColumns.followup.emails && !isMobile,
      header: "Emails",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme="green">{item.email_count || 0}</Badge>
        </CompactCell>
      ),
    },
    {
      key: "service",
      visible: visibleColumns.followup.service && !isLargerThan768,
      header: "Service",
      render: (item) => (
        <CompactCell>
          <Text noOfLines={1} fontSize="xs">
            {item.serviceProvided}
          </Text>
        </CompactCell>
      ),
    },
    {
      key: "deadline",
      visible: visibleColumns.followup.deadline,
      header: "Deadline",
      render: (item) => (
        <CompactCell>{new Date(item.deadline).toLocaleDateString()}</CompactCell>
      ),
    },
    {
      key: "actions",
      visible: visibleColumns.followup.actions,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <HStack spacing={1}>
            <Tooltip label="Edit Customer">
              <IconButton
                aria-label="Edit customer"
                icon={<EditIcon />}
                colorScheme="blue"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClient(item);
                  onEditOpen();
                }}
              />
            </Tooltip>
            <Tooltip label="Delete Customer">
              <IconButton
                aria-label="Delete customer"
                icon={<SmallCloseIcon />}
                colorScheme="red"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomer(item._id);
                }}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
  ].filter((col) => col.visible);

  const buildTrainingFollowupPayloadFromSale = (sale, overrides = {}) => {
    const raw = sale._raw || {};
    const agentName = sale.agentName || raw.agentName || raw.agentUsername || "";
    const customerName =
      sale.customerName ||
      raw.customerName ||
      raw.clientName ||
      raw.companyName ||
      "Customer";

    return {
      customerName,
      email: sale.email || raw.email || "",
      phoneNumber: sale.phone || raw.phoneNumber || "",
      trainingType: sale.trainingProgram || raw.trainingProgram || raw.serviceProvided || "",
      scheduleShift: sale.schedulePreference || raw.schedulePreference || raw.scheduleShift || "",
      startDate: new Date().toISOString().split("T")[0],
      progress: "Not Started",
      materialStatus: "Not Delivered",
      agentName,
      salesAgent: raw.agentName || agentName || raw.agentId || "",
      ...overrides,
    };
  };

  // Function to import a completed sale to training follow-ups
  const importToTraining = async (sale) => {
    try {
      // Map the sale data to training follow-up format
      const trainingData = buildTrainingFollowupPayloadFromSale(sale);

      // Call the API to create a new training follow-up
      await createTrainingFollowup(trainingData);
      
      // Remove the imported entry from the completedSales state
      setCompletedSales(prevSales => prevSales.filter(item => item.id !== sale.id));
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Successfully imported to Training Follow-Up',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the training follow-ups list
      await loadTrainingFollowups();
    } catch (error) {
      console.error('Error importing to training:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to import to training',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const completedSalesColumnsToRender = [
    {
      key: "agentName",
      visible: visibleColumns.completedSales.agentName,
      header: "Agent",
      render: (item) => <CompactCell>{item.agentName}</CompactCell>,
    },
    {
      key: "customerName",
      visible: visibleColumns.completedSales.customerName,
      header: "Customer Name",
      render: (item) => <CompactCell>{item.customerName}</CompactCell>,
    },
    {
      key: "trainingProgram",
      visible: visibleColumns.completedSales.trainingProgram,
      header: "Training Program",
      render: (item) => <CompactCell>{item.trainingProgram}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.completedSales.phone && !isMobile,
      header: "Phone",
      render: (item) => <CompactCell>{item.phone}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.completedSales.email && !isMobile,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "schedulePreference",
      visible: visibleColumns.completedSales.schedulePreference,
      header: "Schedule Preference",
      render: (item) => <CompactCell>{item.schedulePreference}</CompactCell>
    },
    {
      key: "actions",
      visible: true,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <Tooltip label="Import to Training">
            <IconButton
              aria-label="Import to Training"
              icon={<AddIcon />}
              size="xs"
              colorScheme="green"
              variant="outline"
              onClick={() => importToTraining(item)}
            />
          </Tooltip>
        </CompactCell>
      )
    }
  ].filter((col) => col.visible);

  const trainingSelectAllChecked =
    Array.isArray(filteredTrainingFollowups) &&
    filteredTrainingFollowups.length > 0 &&
    filteredTrainingFollowups.every((item) =>
      selectedTrainingFollowupIds.includes(getTrainingFollowupId(item))
    );
  const trainingSelectAllIndeterminate =
    selectedTrainingFollowupIds.length > 0 && !trainingSelectAllChecked;

  const trainingFollowupColumnsToRender = [
    {
      key: "select",
      visible: isCustomerSuccessManager && visibleColumns.trainingFollowup.select !== false,
      header: (
        <Checkbox
          aria-label="Select all training follow-ups"
          isChecked={trainingSelectAllChecked}
          isIndeterminate={trainingSelectAllIndeterminate}
          onChange={(e) => selectAllTrainingFollowups(e.target.checked)}
        />
      ),
      render: (item) => {
        const itemId = getTrainingFollowupId(item);
        return (
          <CompactCell>
            <Checkbox
              isChecked={selectedTrainingFollowupIds.includes(itemId)}
              onChange={() => toggleTrainingSelection(itemId)}
            />
          </CompactCell>
        );
      },
    },
    {
      key: "startDate",
      visible: visibleColumns.trainingFollowup.startDate,
      header: "Training Start Date",
      render: (item) => (
        <CompactCell>
          {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"}
        </CompactCell>
      ),
    },
    {
      key: "endDate",
      visible: visibleColumns.trainingFollowup.endDate,
      header: "Training End Date",
      render: (item) => (
        <CompactCell>
          {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
        </CompactCell>
      ),
    },
    {
      key: "agentName",
      visible: visibleColumns.trainingFollowup.agentName,
      header: "Agent Name",
      render: (item) => <CompactCell>{item.agentName}</CompactCell>,
    },
    {
      key: "salesAgent",
      visible: visibleColumns.trainingFollowup.salesAgent,
      header: "Sales Agent",
      render: (item) => (
        <CompactCell>
          {item.salesAgent || item.salesAgentName || "-"}
        </CompactCell>
      ),
    },
    {
      key: "assignedInstructor",
      visible: visibleColumns.trainingFollowup.assignedInstructor,
      header: "Assigned Instructor",
      render: (item) => <CompactCell>{item.assignedInstructor || "-"}</CompactCell>,
    },
    {
      key: "customerName",
      visible: visibleColumns.trainingFollowup.customerName,
      header: "Customer Name",
      render: (item) => <CompactCell>{item.customerName}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.trainingFollowup.email,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.trainingFollowup.phone,
      header: "Phone Number",
      render: (item) => <CompactCell>{item.phoneNumber}</CompactCell>,
    },
    {
      key: "fieldOfWork",
      visible: visibleColumns.trainingFollowup.fieldOfWork,
      header: "Field of Work",
      render: (item) => <CompactCell>{item.fieldOfWork}</CompactCell>,
    },
    {
      key: "course",
      visible: visibleColumns.trainingFollowup.course,
      header: "Course",
      render: (item) => <CompactCell>{item.trainingType}</CompactCell>,
    },
    {
      key: "batchGroup",
      visible: visibleColumns.trainingFollowup.batchGroup,
      header: "Batch/Group",
      render: (item) => (
        <CompactCell>
          {item.batch || item.group || item.batchGroup || "-"}
        </CompactCell>
      ),
    },
    {
      key: "schedule",
      visible: visibleColumns.trainingFollowup.schedule,
      header: "Schedule & Shift",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.scheduleShift || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.scheduleShift || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "scheduleShift", e.target.value)
              }
            >
              <option value="">Select schedule</option>
              <option value="Regular">Regular</option>
              <option value="Night">Night</option>
              <option value="Weekend">Weekend</option>
              <option value="Night/Weekend">Night/Weekend</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "materialStatus",
      visible: visibleColumns.trainingFollowup.materialStatus,
      header: "Material Delivery Status",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.materialStatus || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.materialStatus || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "materialStatus", e.target.value)
              }
            >
              <option value="">Select status</option>
              <option value="Not Delivered">Not Delivered</option>
              <option value="Delivered">Delivered</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "progress",
      visible: visibleColumns.trainingFollowup.progress,
      header: "Progress",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.progress || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.progress || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "progress", e.target.value)
              }
            >
              <option value="">Select progress</option>
              <option value="Not Started">Not Started</option>
              <option value="Started">Started</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "idInfo",
      visible: visibleColumns.trainingFollowup.idInfo,
      header: "ID Info",
      render: (item) => <CompactCell>{item.idInfo}</CompactCell>,
    },
    {
      key: "packageStatus",
      visible: visibleColumns.trainingFollowup.packageStatus,
      header: "Package Status",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.packageStatus || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.packageStatus || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "packageStatus", e.target.value)
              }
            >
              <option value="">Select status</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Not Sure">Not Sure</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "actions",
      visible: visibleColumns.trainingFollowup.actions,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <HStack spacing={2}>
            <Tooltip label="Edit training follow-up">
              <IconButton
                aria-label="Edit training follow-up"
                icon={<EditIcon />}
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => openTrainingEdit(item)}
              />
            </Tooltip>
            <Tooltip label="Delete training follow-up">
              <IconButton
                aria-label="Delete training follow-up"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleDeleteTrainingFollowup(item._id)}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
  ].filter((col) => col.visible);

  const ensraColumnsToRender = [
    {
      key: "type",
      visible: visibleColumns.ensra.type,
      header: "Type",
      render: (item) => <CompactCell>{item.type}</CompactCell>,
    },
    {
      key: "packageType",
      visible: visibleColumns.ensra.packageType,
      header: "Package Type",
      render: (item) => <CompactCell>{item.packageType}</CompactCell>,
    },
    {
      key: "companyName",
      visible: visibleColumns.ensra.companyName,
      header: "Company Name",
      render: (item) => <CompactCell>{item.companyName}</CompactCell>,
    },
    {
      key: "positionsOffered",
      visible: visibleColumns.ensra.positionsOffered,
      header: "Positions Offered",
      render: (item) => <CompactCell>{item.positionsOffered}</CompactCell>,
    },
    {
      key: "salaryRange",
      visible: visibleColumns.ensra.salaryRange,
      header: "Salary Range",
      render: (item) => <CompactCell>{item.salaryRange}</CompactCell>,
    },
    {
      key: "jobRequirements",
      visible: visibleColumns.ensra.jobRequirements,
      header: "Job Requirements",
      render: (item) => <CompactCell>{item.jobRequirements}</CompactCell>,
    },
    {
      key: "jobSeekerName",
      visible: visibleColumns.ensra.jobSeekerName,
      header: "Job Seeker Name",
      render: (item) => <CompactCell>{item.jobSeekerName}</CompactCell>,
    },
    {
      key: "jobSeekerSkills",
      visible: visibleColumns.ensra.jobSeekerSkills,
      header: "Skills",
      render: (item) => <CompactCell>{item.jobSeekerSkills}</CompactCell>,
    },
    {
      key: "jobSeekerExperience",
      visible: visibleColumns.ensra.jobSeekerExperience,
      header: "Experience",
      render: (item) => <CompactCell>{item.jobSeekerExperience}</CompactCell>,
    },
    {
      key: "jobSeekerEducation",
      visible: visibleColumns.ensra.jobSeekerEducation,
      header: "Education",
      render: (item) => <CompactCell>{item.jobSeekerEducation}</CompactCell>,
    },
    {
      key: "jobSeekerExpectedSalary",
      visible: visibleColumns.ensra.jobSeekerExpectedSalary,
      header: "Expected Salary",
      render: (item) => <CompactCell>{item.jobSeekerExpectedSalary}</CompactCell>,
    },
    {
      key: "actions",
      visible: visibleColumns.ensra.actions,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <HStack spacing={2}>
            <Tooltip label="Edit ENSRA follow-up">
              <IconButton
                aria-label="Edit ENSRA follow-up"
                icon={<EditIcon />}
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => openEnsraEdit(item)}
              />
            </Tooltip>
            <Tooltip label="Delete ENSRA follow-up">
              <IconButton
                aria-label="Delete ENSRA follow-up"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleDeleteEnsraFollowup(item._id || item.id)}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
  ].filter((col) => col.visible);

  const ensraModule = (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="md" color={headerBg}>
              ENSRA Follow-Up
            </Heading>
            <HStack spacing={2}>
              {renderColumnMenu("ensra", ensraColumnOptions)}
              <Tooltip label="Add ENSRA customer">
                <IconButton
                  aria-label="Add ENSRA customer"
                  icon={<AddIcon />}
                  colorScheme="teal"
                  size="sm"
                  onClick={() => setShowEnsraFormCard(true)}
                />
              </Tooltip>
            </HStack>
          </Flex>

          <Flex
            direction={isMobile ? "column" : "row"}
            gap={3}
            align="center"
          >
            <Box flex={1} width="100%">
              <Input
                placeholder="Search by company or job seeker name..."
                value={ensraSearch}
                onChange={(e) => setEnsraSearch(e.target.value)}
                size="sm"
                borderRadius="md"
                borderColor={borderColor}
              />
            </Box>
            <HStack
              spacing={3}
              width={isMobile ? "100%" : "auto"}
              justify={isMobile ? "space-between" : "flex-end"}
            >
              <Box minW="160px">
                <Input
                  as="select"
                  size="sm"
                  value={ensraTypeFilter}
                  onChange={(e) => setEnsraTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="company">Company</option>
                  <option value="jobSeeker">Job Seeker</option>
                </Input>
              </Box>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setEnsraSortAsc((prev) => !prev)}
              >
                Sort {ensraSortAsc ? "A-Z" : "Z-A"}
              </Button>
            </HStack>
          </Flex>

          <TableContainer
            overflowX="auto"
            border="1px solid"
            borderColor={tableBorderColor}
            borderRadius="lg"
            bg={tableBg}
            boxShadow="sm"
          >
            <Table
              variant="striped"
              colorScheme="gray"
              size="sm"
              minWidth={isMobile ? "900px" : "auto"}
            >
              <Thead bg={headerBg}>
                <Tr>
                  {ensraColumnsToRender.map((col) => (
                    <CompactHeaderCell key={col.key}>
                      {col.header}
                    </CompactHeaderCell>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filteredEnsraFollowups.length > 0 ? (
                  filteredEnsraFollowups.map((item) => (
                    <Tr key={item._id || item.id} _hover={{ bg: rowHoverBg }}>
                      {ensraColumnsToRender.map((col) => (
                        <React.Fragment key={col.key}>
                          {col.render(item)}
                        </React.Fragment>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td
                      colSpan={ensraColumnsToRender.length || 1}
                      textAlign="center"
                      py={10}
                    >
                      <Text color="gray.500">
                        No ENSRA follow-up records found.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {showEnsraFormCard && (
            <>
              <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0,0,0,0.5)"
                zIndex={1000}
                onClick={() => setShowEnsraFormCard(false)}
              />
              <Card
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={1001}
                width={isMobile ? "95%" : "600px"}
                bg={cardBg}
                boxShadow="xl"
              >
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Add ENSRA Customer</Heading>
                    <IconButton
                      aria-label="Close"
                      icon={<SmallCloseIcon />}
                      size="sm"
                      onClick={() => setShowEnsraFormCard(false)}
                    />
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Box as="form" onSubmit={handleEnsraSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Text mb={1} fontWeight="medium">
                          Registration Type
                        </Text>
                        <RadioGroup
                          value={ensraForm.type}
                          onChange={(value) =>
                            setEnsraForm((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                        >
                          <HStack spacing={4}>
                            <Radio value="company">
                              Company - Looking to hire
                            </Radio>
                            <Radio value="jobSeeker">
                              Job Seeker - Managing opportunities
                            </Radio>
                          </HStack>
                        </RadioGroup>
                      </Box>

                      {ensraForm.type === "company" && (
                        <>
                          <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={4}
                          >
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Package Type
                              </Text>
                              <Input
                                value={ensraForm.packageType}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    packageType: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 1, 2, 3"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Company Name
                              </Text>
                              <Input
                                value={ensraForm.companyName}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    companyName: e.target.value,
                                  }))
                                }
                                placeholder="Enter company name"
                              />
                            </Box>
                          </Stack>

                          <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={4}
                          >
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Positions Offered
                              </Text>
                              <Input
                                value={ensraForm.positionsOffered}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    positionsOffered: e.target.value,
                                  }))
                                }
                                placeholder="Comma-separated positions"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Salary Range
                              </Text>
                              <Input
                                value={ensraForm.salaryRange}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    salaryRange: e.target.value,
                                  }))
                                }
                                placeholder="e.g., $50,000 - $80,000"
                              />
                            </Box>
                          </Stack>

                          <Box>
                            <Text mb={1} fontWeight="medium">
                              Job Requirements
                            </Text>
                            <Textarea
                              value={ensraForm.jobRequirements}
                              onChange={(e) =>
                                setEnsraForm((prev) => ({
                                  ...prev,
                                  jobRequirements: e.target.value,
                                }))
                              }
                              placeholder="Describe job requirements, qualifications, etc."
                              rows={4}
                            />
                          </Box>
                        </>
                      )}

                      {ensraForm.type === "jobSeeker" && (
                        <>
                          <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={4}
                          >
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Job Seeker Name
                              </Text>
                              <Input
                                value={ensraForm.jobSeekerName}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    jobSeekerName: e.target.value,
                                  }))
                                }
                                placeholder="Enter job seeker name"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Skills
                              </Text>
                              <Input
                                value={ensraForm.jobSeekerSkills}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    jobSeekerSkills: e.target.value,
                                  }))
                                }
                                placeholder="Comma-separated skills"
                              />
                            </Box>
                          </Stack>

                          <Stack
                            direction={isMobile ? "column" : "row"}
                            spacing={4}
                          >
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Experience
                              </Text>
                              <Input
                                value={ensraForm.jobSeekerExperience}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    jobSeekerExperience: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 2 years"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text mb={1} fontWeight="medium">
                                Education
                              </Text>
                              <Input
                                value={ensraForm.jobSeekerEducation}
                                onChange={(e) =>
                                  setEnsraForm((prev) => ({
                                    ...prev,
                                    jobSeekerEducation: e.target.value,
                                  }))
                                }
                                placeholder="e.g., Bachelor's Degree"
                              />
                            </Box>
                          </Stack>

                          <Box>
                            <Text mb={1} fontWeight="medium">
                              Expected Salary
                            </Text>
                            <Input
                              value={ensraForm.jobSeekerExpectedSalary}
                              onChange={(e) =>
                                setEnsraForm((prev) => ({
                                  ...prev,
                                  jobSeekerExpectedSalary: e.target.value,
                                }))
                              }
                              placeholder="e.g., $60,000"
                            />
                          </Box>
                        </>
                      )}

                      <Button
                        type="submit"
                        colorScheme="teal"
                        width="full"
                        isDisabled={
                          (ensraForm.type === "company" && !ensraForm.companyName) ||
                          (ensraForm.type === "jobSeeker" &&
                            !ensraForm.jobSeekerName)
                        }
                      >
                        Register for ENSRA
                      </Button>
                    </VStack>
                  </Box>
                </CardBody>
              </Card>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const followupPage = (
    <Box maxW="1400px" w="100%" mx="auto" px={{ base: 3, md: 6 }}>
      <VStack spacing={6} align="stretch" w="100%">
        <Heading 
          as="h1" 
          size={isMobile ? "lg" : "xl"} 
          textAlign="center" 
          color={headerBg}
          fontWeight="bold"
        >
          {ensraOnly ? "ENSRA Follow-Up" : "Customer Success Follow-up"}
        </Heading>
        <Flex justify={isMobile ? "center" : "flex-end"} align="center" gap={3} flexWrap="wrap">
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            Show
          </Text>
          <Select
            size="sm"
            value={followupTypeFilter}
            onChange={(e) => setFollowupTypeFilter(e.target.value)}
            w={{ base: "160px", md: "200px" }}
          >
            <option value="all">All types</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </Select>
        </Flex>
        
        {ensraOnly ? (
          <Box overflowX="auto" maxW="100%">
            {ensraModule}
          </Box>
        ) : (
          <Box overflowX="auto" maxW="100%">
            <Tabs variant="enclosed" colorScheme="blue" isFitted={!isMobile}>
            <TabList mb={2} flexWrap={isMobile ? "wrap" : "nowrap"} gap={isMobile ? 1 : 2}>
              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>Local B2B</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>International B2B</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <DownloadIcon />
                  <Text>Pending Training</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>Training</Text>
                </HStack>
              </Tab>

              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>All TESBINN Users</Text>
                </HStack>
              </Tab>

              <Tab>
                <HStack spacing={2}>
                  <DownloadIcon /><CheckIcon />
                  <Text>ENSRA</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>Consultancy</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <CheckIcon />
                  <Text>TradeXTV</Text>
                </HStack>
              </Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                <FollowupTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                  tableBorderColor={tableBorderColor}
                  tableBg={tableBg}
                  rowHoverBg={rowHoverBg}
                  renderColumnMenu={renderColumnMenu}
                  followupColumnOptions={followupColumnOptions}
                  loading={loading}
                  error={error}
                  searchQuery={searchQuery}
                  handleSearch={handleSearch}
                  isMobile={isMobile}
                  isMobileView={isMobileView}
                  handleBackToCompanyList={handleBackToCompanyList}
                  handleRowClick={handleRowClick}
                  selectedRow={selectedRow}
                  filteredData={localFollowups}
                  followupColumnsToRender={buildFollowupColumnsToRender(localFollowups)}
                  onRefresh={fetchData}
                  onSelectRow={toggleSelectFollowup}
                  onSelectAll={(checked) => selectAllFiltered(localFollowups, checked)}
                  selectedIds={selectedFollowupIds}
                  onBulkEmail={openBulkEmail}
                  onOpenConversation={openConversation}
                />
              </TabPanel>
              <TabPanel px={0}>
                <FollowupTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                  tableBorderColor={tableBorderColor}
                  tableBg={tableBg}
                  rowHoverBg={rowHoverBg}
                  renderColumnMenu={renderColumnMenu}
                  followupColumnOptions={followupColumnOptions}
                  loading={loading}
                  error={error}
                  searchQuery={searchQuery}
                  handleSearch={handleSearch}
                  isMobile={isMobile}
                  isMobileView={isMobileView}
                  handleBackToCompanyList={handleBackToCompanyList}
                  handleRowClick={handleRowClick}
                  selectedRow={selectedRow}
                  filteredData={internationalFollowups}
                  followupColumnsToRender={buildFollowupColumnsToRender(internationalFollowups)}
                  onRefresh={fetchData}
                  onSelectRow={toggleSelectFollowup}
                  onSelectAll={(checked) =>
                    selectAllFiltered(internationalFollowups, checked)
                  }
                  selectedIds={selectedFollowupIds}
                  onBulkEmail={openBulkEmail}
                  onOpenConversation={openConversation}
                />
              </TabPanel>
              <TabPanel px={0}>
                <TrainingTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                  tableBorderColor={tableBorderColor}
                  tableBg={tableBg}
                  rowHoverBg={rowHoverBg}
                  renderColumnMenu={renderColumnMenu}
                  completedSalesColumnOptions={completedSalesColumnOptions}
                  completedSalesColumnsToRender={completedSalesColumnsToRender}
                  completedSales={completedSales}
                  loadingTraining={loadingTraining}
                  trainingError={trainingError}
                  fetchCompletedSales={fetchCompletedSales}
                  trainingPrograms={trainingPrograms}
                  trainingForm={trainingForm}
                  setTrainingForm={setTrainingForm}
                  handleTrainingTypeChange={handleTrainingTypeChange}
                  handlePaymentOptionChange={handlePaymentOptionChange}
                  handleTrainingSubmit={handleTrainingSubmit}
                  isMobile={isMobile}
                />
              </TabPanel>
              <TabPanel px={0}>
                <TrainingFollowupTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                  tableBorderColor={tableBorderColor}
                  tableBg={tableBg}
                  rowHoverBg={rowHoverBg}
                  trainingSearch={trainingSearch}
                  setTrainingSearch={setTrainingSearch}
                  trainingProgressFilter={trainingProgressFilter}
                  setTrainingProgressFilter={setTrainingProgressFilter}
                  trainingScheduleFilter={trainingScheduleFilter}
                  setTrainingScheduleFilter={setTrainingScheduleFilter}
                  trainingMaterialFilter={trainingMaterialFilter}
                  setTrainingMaterialFilter={setTrainingMaterialFilter}
                  trainingCourseFilter={trainingCourseFilter}
                  setTrainingCourseFilter={setTrainingCourseFilter}
                  trainingStartDateFilter={trainingStartDateFilter}
                  setTrainingStartDateFilter={setTrainingStartDateFilter}
                  trainingCourseOptions={trainingCourseOptions}
                  renderColumnMenu={renderColumnMenu}
                  trainingFollowupColumnOptions={trainingFollowupColumnOptions}
                  trainingSortAsc={trainingSortAsc}
                  setTrainingSortAsc={setTrainingSortAsc}
                  trainingFollowupColumnsToRender={trainingFollowupColumnsToRender}
                  filteredTrainingFollowups={filteredTrainingFollowups}
                  selectedTrainingFollowupCount={selectedTrainingFollowupIds.length}
                  trainingBulkStartDate={trainingBulkStartDate}
                  trainingBulkEndDate={trainingBulkEndDate}
                  trainingBulkStartTime={trainingBulkStartTime}
                  trainingBulkEndTime={trainingBulkEndTime}
                  setTrainingBulkStartDate={setTrainingBulkStartDate}
                  setTrainingBulkEndDate={setTrainingBulkEndDate}
                  setTrainingBulkStartTime={setTrainingBulkStartTime}
                  setTrainingBulkEndTime={setTrainingBulkEndTime}
                  applyTrainingDates={handleApplyTrainingDates}
                  isApplyingTrainingDates={isApplyingTrainingDates}
                  assignableAgents={assignableAgents}
                  trainingAgentOptions={trainingAgentOptions}
                  selectedAgentForAssignment={selectedAgentForAssignment}
                  setSelectedAgentForAssignment={setSelectedAgentForAssignment}
                  trainingInstructorOptions={trainingInstructorOptions}
                  selectedInstructorForAssignment={selectedInstructorForAssignment}
                  setSelectedInstructorForAssignment={setSelectedInstructorForAssignment}
                  isCustomerSuccessManager={isCustomerSuccessManager}
                  isMobile={isMobile}
                  tableMinWidth="900px"
                  handleBulkUpdate={handleBulkUpdate}
                >
                  <TrainingFollowupGrouped
                    groupedTrainingFollowups={groupedTrainingFollowups}
                    cardBg={cardBg}
                    borderColor={borderColor}
                    headerBg={headerBg}
                    isLargerThan1024={isLargerThan1024}
                  />
                </TrainingFollowupTabPage>
              </TabPanel>
              <TabPanel px={0}>
                <TesbinnTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                  tableBorderColor={tableBorderColor}
                  tableBg={tableBg}
                  rowHoverBg={rowHoverBg}
                  trainingSearch={trainingSearch}
                  setTrainingSearch={setTrainingSearch}
                  trainingScheduleFilter={trainingScheduleFilter}
                  setTrainingScheduleFilter={setTrainingScheduleFilter}
                  trainingMaterialFilter={trainingMaterialFilter}
                  setTrainingMaterialFilter={setTrainingMaterialFilter}
                  trainingCourseFilter={trainingCourseFilter}
                  setTrainingCourseFilter={setTrainingCourseFilter}
                  trainingStartDateFilter={trainingStartDateFilter}
                  setTrainingStartDateFilter={setTrainingStartDateFilter}
                  trainingCourseOptions={trainingCourseOptions}
                  renderColumnMenu={renderColumnMenu}
                  trainingFollowupColumnOptions={trainingFollowupColumnOptions}
                  trainingSortAsc={trainingSortAsc}
                  setTrainingSortAsc={setTrainingSortAsc}
                  trainingFollowupColumnsToRender={trainingFollowupColumnsToRender}
                  tesbinnFollowups={tesbinnFollowups}
                  isMobile={isMobile}
                  isCustomerSuccessManager={isCustomerSuccessManager}
                  handleExportTesbinn={handleExportTesbinn}
                  handleCsvImport={handleTesbinnCsvImport}
                  isCsvImportingTesbinn={isCsvImportingTesbinn}
                />
              </TabPanel>
              <TabPanel px={0}>
                {ensraModule}
              </TabPanel>
              <TabPanel px={0}>
                <ConsultancyTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                />
              </TabPanel>
              <TabPanel px={0}>
                <TradexTvTabPage
                  cardBg={cardBg}
                  headerBg={headerBg}
                  borderColor={borderColor}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        )}
      </VStack>

      {/* Add Pending B2B Modal */}
      <Modal isOpen={isAddPendingOpen} onClose={closeAddPendingModal} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleAddPendingSubmit}>
          <ModalHeader>Add Pending B2B Customer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Input
                as="select"
                value={pendingForm.type}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </Input>
              <Input
                placeholder="Company Name"
                value={pendingForm.companyName}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, companyName: e.target.value }))
                }
                isRequired
              />
              <Input
                placeholder="Contact Person"
                value={pendingForm.contactPerson}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                }
                isRequired
              />
              <Input
                type="email"
                placeholder="Email"
                value={pendingForm.email}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, email: e.target.value }))
                }
                isRequired
              />
              <Input
                placeholder="Phone Number"
                value={pendingForm.phoneNumber}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                isRequired
              />
              <Input
                placeholder="Country"
                value={pendingForm.country}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, country: e.target.value }))
                }
              />
              <Input
                placeholder="Industry"
                value={pendingForm.industry}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, industry: e.target.value }))
                }
              />
              <Input
                placeholder="Package Type"
                value={pendingForm.packageType}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, packageType: e.target.value }))
                }
              />
              <Input
                as="select"
                value={pendingForm.packageScope}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, packageScope: e.target.value }))
                }
              >
                <option value="Local">Local Package</option>
                <option value="International">International Package</option>
              </Input>
              <Textarea
                placeholder="Products / Items of interest"
                value={pendingForm.products}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, products: e.target.value }))
                }
              />
              <Textarea
                placeholder={pendingForm.type === "buyer" ? "Requirements" : "Certifications"}
                value={pendingForm.notes}
                onChange={(e) =>
                  setPendingForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={closeAddPendingModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={isSavingPending}
              isDisabled={
                !pendingForm.companyName ||
                !pendingForm.contactPerson ||
                !pendingForm.email ||
                !pendingForm.phoneNumber
              }
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Drawer for EditCustomerInfo */}
      <Drawer isOpen={isEditOpen} placement="right" onClose={onEditClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Edit Customer</DrawerHeader>
          <DrawerBody>
            {selectedClient && (
              <EditCustomerInfo 
                customer={selectedClient} 
                onSuccess={() => { 
                  fetchData(); 
                  onEditClose(); 
                }} 
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Training Edit Modal */}
      <Modal isOpen={isTrainingEditOpen} onClose={() => setIsTrainingEditOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Training Follow-Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {trainingEditData && (
              <VStack spacing={3} align="stretch">
                <Input
                  placeholder="Agent Name"
                  value={trainingEditData.agentName || ""}
                  onChange={(e) => handleTrainingEditChange("agentName", e.target.value)}
                />
                <Input
                  placeholder="Customer Name"
                  value={trainingEditData.customerName || ""}
                  onChange={(e) => handleTrainingEditChange("customerName", e.target.value)}
                />
                <Input
                  placeholder="Email"
                  value={trainingEditData.email || ""}
                  onChange={(e) => handleTrainingEditChange("email", e.target.value)}
                />
                <Input
                  placeholder="Phone Number"
                  value={trainingEditData.phoneNumber || ""}
                  onChange={(e) => handleTrainingEditChange("phoneNumber", e.target.value)}
                />
                <Input
                  placeholder="Course"
                  value={trainingEditData.trainingType || ""}
                  onChange={(e) => handleTrainingEditChange("trainingType", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={trainingEditData.startDate ? trainingEditData.startDate.slice(0, 10) : ""}
                  onChange={(e) => handleTrainingEditChange("startDate", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={trainingEditData.endDate ? trainingEditData.endDate.slice(0, 10) : ""}
                  onChange={(e) => handleTrainingEditChange("endDate", e.target.value)}
                />
                <Input
                  type="time"
                  placeholder="Start Time"
                  value={trainingEditData.startTime || ""}
                  onChange={(e) => handleTrainingEditChange("startTime", e.target.value)}
                />
                <Input
                  type="time"
                  placeholder="End Time"
                  value={trainingEditData.endTime || ""}
                  onChange={(e) => handleTrainingEditChange("endTime", e.target.value)}
                />
                <Input
                  as="select"
                  value={trainingEditData.scheduleShift || ""}
                  onChange={(e) => handleTrainingEditChange("scheduleShift", e.target.value)}
                >
                  <option value="">Select schedule</option>
                  <option value="Regular">Regular</option>
                  <option value="Night">Night</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night/Weekend">Night/Weekend</option>
                </Input>
                <Input
                  as="select"
                  value={trainingEditData.materialStatus || ""}
                  onChange={(e) => handleTrainingEditChange("materialStatus", e.target.value)}
                >
                  <option value="">Select material status</option>
                  <option value="Not Delivered">Not Delivered</option>
                  <option value="Delivered">Delivered</option>
                </Input>
                <Input
                  as="select"
                  value={trainingEditData.progress || ""}
                  onChange={(e) => handleTrainingEditChange("progress", e.target.value)}
                >
                  <option value="">Select progress</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Started">Started</option>
                  <option value="Completed">Completed</option>
                  <option value="Dropped">Dropped</option>
                </Input>
                <Input
                  placeholder="ID Info"
                  value={trainingEditData.idInfo || ""}
                  onChange={(e) => handleTrainingEditChange("idInfo", e.target.value)}
                />
                <Input
                  as="select"
                  value={trainingEditData.packageStatus || ""}
                  onChange={(e) => handleTrainingEditChange("packageStatus", e.target.value)}
                >
                  <option value="">Select package status</option>
                  <option value="Interested">Interested</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Not Sure">Not Sure</option>
                </Input>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsTrainingEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={saveTrainingEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ENSRA Edit Modal */}
      <Modal isOpen={isEnsraEditOpen} onClose={() => setIsEnsraEditOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit ENSRA Follow-Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {ensraEditData && (
              <VStack spacing={3} align="stretch">
                <Input
                  as="select"
                  value={ensraEditData.type || ""}
                  onChange={(e) => handleEnsraEditChange("type", e.target.value)}
                >
                  <option value="company">Company</option>
                  <option value="jobSeeker">Job Seeker</option>
                </Input>
                <Input
                  placeholder="Package Type"
                  value={ensraEditData.packageType || ""}
                  onChange={(e) => handleEnsraEditChange("packageType", e.target.value)}
                />
                <Input
                  placeholder="Company Name"
                  value={ensraEditData.companyName || ""}
                  onChange={(e) => handleEnsraEditChange("companyName", e.target.value)}
                />
                <Input
                  placeholder="Positions Offered (comma separated)"
                  value={
                    Array.isArray(ensraEditData.positionsOffered)
                      ? ensraEditData.positionsOffered.join(", ")
                      : ensraEditData.positionsOffered || ""
                  }
                  onChange={(e) => handleEnsraEditChange("positionsOffered", e.target.value)}
                />
                <Input
                  placeholder="Salary Range"
                  value={ensraEditData.salaryRange || ""}
                  onChange={(e) => handleEnsraEditChange("salaryRange", e.target.value)}
                />
                <Textarea
                  placeholder="Job Requirements"
                  value={ensraEditData.jobRequirements || ""}
                  onChange={(e) => handleEnsraEditChange("jobRequirements", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Name"
                  value={ensraEditData.jobSeekerName || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerName", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Skills (comma separated)"
                  value={
                    Array.isArray(ensraEditData.jobSeekerSkills)
                      ? ensraEditData.jobSeekerSkills.join(", ")
                      : ensraEditData.jobSeekerSkills || ""
                  }
                  onChange={(e) => handleEnsraEditChange("jobSeekerSkills", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Experience"
                  value={ensraEditData.jobSeekerExperience || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerExperience", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Education"
                  value={ensraEditData.jobSeekerEducation || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerEducation", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Expected Salary"
                  value={ensraEditData.jobSeekerExpectedSalary || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerExpectedSalary", e.target.value)}
                />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsEnsraEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={saveEnsraEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Activity & Notes Modal */}
      <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {activityTarget ? `Activity for ${activityTarget.clientName}` : "Activity"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activityTarget && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Priority</Text>
                  <HStack>
                    <Input
                      as="select"
                      size="sm"
                      value={activityPriority}
                      onChange={(e) => setActivityPriority(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </Input>
                    <Button size="sm" colorScheme="teal" onClick={handleSavePriority}>
                      Save
                    </Button>
                  </HStack>
                </HStack>

                <HStack spacing={3} justify="space-between" align="center">
                  <Text fontWeight="bold">Contact Attempts</Text>
                  <HStack spacing={2}>
                    <Button size="xs" onClick={() => handleIncrementAttempt("call")}>Call Attempt</Button>
                    <Button size="xs" onClick={() => handleIncrementAttempt("message")}>Message Attempt</Button>
                    <Button size="xs" onClick={() => handleIncrementAttempt("email")}>Email Attempt</Button>
                  </HStack>
                </HStack>
                <HStack spacing={4}>
                  <Badge colorScheme="blue">Calls: {activityTarget.call_count || 0}</Badge>
                  <Badge colorScheme="purple">Messages: {activityTarget.message_count || 0}</Badge>
                  <Badge colorScheme="green">Emails: {activityTarget.email_count || 0}</Badge>
                </HStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Communication Channel</Text>
                  <HStack>
                    <Input
                      as="select"
                      value={activityChannel}
                      onChange={(e) => setActivityChannel(e.target.value)}
                    >
                      <option value="">Select channel</option>
                      <option value="Phone call">Phone call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Email">Email</option>
                      <option value="In-person visit">In-person visit</option>
                    </Input>
                    <Button size="sm" colorScheme="teal" onClick={handleAddCommunication} isDisabled={!activityChannel}>
                      Log Channel
                    </Button>
                  </HStack>
                </VStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Private Note</Text>
                  <Textarea
                    placeholder="Add a private note"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                  />
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => {
                      setNote(activityNote);
                      setSelectedClient(activityTarget);
                      handleAddNote();
                      setActivityNote("");
                    }}
                    isDisabled={!activityNote.trim()}
                  >
                    Save Note
                  </Button>
                </VStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Notes</Text>
                  <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto" border="1px solid" borderColor={borderColor} p={2} borderRadius="md">
                    {(activityTarget.notes || []).length === 0 && (
                      <Text color="gray.500">No notes yet.</Text>
                    )}
                    {(activityTarget.notes || []).map((n, idx) => (
                      <Box key={idx} p={2} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="sm">
                        <Text fontSize="sm">{n.text}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </VStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Communication Logs</Text>
                  <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto" border="1px solid" borderColor={borderColor} p={2} borderRadius="md">
                    {((activityTarget.communicationLogs || activityTarget.communications || []).length === 0) && (
                      <Text color="gray.500">No communications logged.</Text>
                    )}
                    {(activityTarget.communicationLogs || activityTarget.communications || []).map((c, idx) => (
                      <Box key={idx} p={2} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="sm">
                        <Text fontWeight="semibold" fontSize="sm">{c.channel}</Text>
                        {c.note && <Text fontSize="sm">{c.note}</Text>}
                        <Text fontSize="xs" color="gray.500">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsActivityModalOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Email Modal */}
      <Modal isOpen={isBulkEmailOpen} onClose={() => setIsBulkEmailOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Bulk Email</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">From: {currentUserEmail || "Configured SMTP user"} | To: {selectedFollowupIds.length} selected customers</Text>
              <Input
                placeholder="Subject"
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
              />
              <Textarea
                placeholder="Body (use {{clientName}} placeholder)"
                rows={6}
                value={bulkBody}
                onChange={(e) => setBulkBody(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsBulkEmailOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleBulkEmailSend} isLoading={isBulkSending}>
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Conversation Modal */}
      <Modal isOpen={conversationOpen} onClose={() => setConversationOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Conversation {conversationTarget ? `with ${conversationTarget.clientName}` : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {conversationLoading ? (
              <Flex justify="center" py={4}>
                <Spinner />
              </Flex>
            ) : (
              <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
                {conversationMessages.length === 0 && (
                  <Text color="gray.500">No messages yet.</Text>
                )}
                {conversationMessages.map((m, idx) => (
                  <Box key={idx} p={2} borderWidth="1px" borderRadius="md">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="sm">{m.sender || "Agent"}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" whiteSpace="pre-wrap">{m.body}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <VStack align="stretch" spacing={2} width="100%">
              <Textarea
                placeholder="Type a message"
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                rows={3}
              />
              <Button colorScheme="teal" onClick={sendConversationMessage} isDisabled={!conversationText.trim()}>
                Send
              </Button>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={closeNotesModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Note</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Enter your note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={handleAddNote}>
              Add Note
            </Button>
            <Button colorScheme="red" onClick={closeNotesModal} ml={3}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    

      {/* Update card for services */}
      {showUpdateCard && (
        <>
          <Box 
            position="fixed" 
            top={0} 
            left={0} 
            right={0} 
            bottom={0} 
            bg="rgba(0,0,0,0.5)" 
            zIndex={1000}
            onClick={() => setShowUpdateCard(false)}
          />
          <Card 
            position="fixed" 
            top="50%" 
            left="50%" 
            transform="translate(-50%, -50%)" 
            zIndex={1001}
            width={isMobile ? "95%" : "520px"}
            maxH={{ base: "90vh", md: "80vh" }}
            bg={cardBg}
            boxShadow="2xl"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Update Services</Heading>
                <IconButton
                  aria-label="Close"
                  icon={<SmallCloseIcon />}
                  size="sm"
                  onClick={() => {
                    setShowUpdateCard(false);
                    setSelectedClient(null);
                  }}
                />
              </Flex>
            </CardHeader>
            <CardBody
              maxH={{ base: "calc(90vh - 140px)", md: "calc(80vh - 140px)" }}
              overflowY="auto"
            >
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {selectedClient.clientName}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Package #: {selectedClient.packageNumber || selectedClient.packageType || "N/A"}
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Toggle services to move them between Provided and Not Provided.
                  </Text>
                </Box>

                <Flex gap={4} direction={isMobile ? "column" : "row"}>
                  <Box flex={1} border="1px solid" borderColor={borderColor} borderRadius="md" p={3} bg={useColorModeValue("green.50", "green.900")} >
                    <Text fontWeight="semibold" mb={2} color={useColorModeValue("green.700", "green.200")}>
                      Provided
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {providedServices.length === 0 && (
                        <Text fontSize="sm" color="gray.500">No services provided yet.</Text>
                      )}
                      {providedServices.map((svc) => (
                        <Checkbox
                          key={svc}
                          isChecked
                          colorScheme="green"
                          onChange={() => moveToNotProvided(svc)}
                        >
                          {svc}
                        </Checkbox>
                      ))}
                    </VStack>
                  </Box>

                  <Box flex={1} border="1px solid" borderColor={borderColor} borderRadius="md" p={3} bg={useColorModeValue("yellow.50", "orange.900")} >
                    <Text fontWeight="semibold" mb={2} color={useColorModeValue("orange.700", "orange.200")}>
                      Not Provided
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {notProvidedServices.length === 0 && (
                        <Text fontSize="sm" color="gray.500">All services provided.</Text>
                      )}
                      {notProvidedServices.map((svc) => (
                        <Checkbox
                          key={svc}
                          colorScheme="orange"
                          onChange={() => moveToProvided(svc)}
                        >
                          {svc}
                        </Checkbox>
                      ))}
                    </VStack>
                  </Box>
                </Flex>

                <HStack spacing={2}>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    onClick={() => handleUpdateServices(selectedClient._id)}
                    flex={1}
                  >
                    Update
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => {
                      setShowUpdateCard(false);
                      setSelectedClient(null);
                    }}
                    flex={1}
                  >
                    Close
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </>
      )}
      <Modal isOpen={isTesbinnBulkModalOpen} onClose={closeTesbinnBulkModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set date & time for TESBINN users</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Apply a default range before assigning agents or instructors.
              </Text>
              <Flex gap={3} flexWrap="wrap">
                <Box flex={1} minW="180px">
                  <Text mb={1} fontSize="xs" fontWeight="semibold">
                    Start Date
                  </Text>
                  <Input
                    size="sm"
                    type="date"
                    value={trainingBulkStartDate}
                    onChange={(e) => setTrainingBulkStartDate(e.target.value)}
                  />
                </Box>
                <Box flex={1} minW="160px">
                  <Text mb={1} fontSize="xs" fontWeight="semibold">
                    Start Time
                  </Text>
                  <Input
                    size="sm"
                    type="time"
                    value={trainingBulkStartTime}
                    onChange={(e) => setTrainingBulkStartTime(e.target.value)}
                  />
                </Box>
              </Flex>
              <Flex gap={3} flexWrap="wrap">
                <Box flex={1} minW="180px">
                  <Text mb={1} fontSize="xs" fontWeight="semibold">
                    End Date
                  </Text>
                  <Input
                    size="sm"
                    type="date"
                    value={trainingBulkEndDate}
                    onChange={(e) => setTrainingBulkEndDate(e.target.value)}
                  />
                </Box>
                <Box flex={1} minW="160px">
                  <Text mb={1} fontSize="xs" fontWeight="semibold">
                    End Time
                  </Text>
                  <Input
                    size="sm"
                    type="time"
                    value={trainingBulkEndTime}
                    onChange={(e) => setTrainingBulkEndTime(e.target.value)}
                  />
                </Box>
              </Flex>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeTesbinnBulkModal}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={applyTrainingDatesAndClose}
              isLoading={isApplyingTrainingDates}
            >
              Apply to selected
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );

  if (embedLayout) {
    return (
      <Box overflowX="auto" maxW="1100px" mx="auto" py={4} px={2}>
        {followupPage}
      </Box>
    );
  }

  return <Layout>{followupPage}</Layout>;
};


export default CustomerFollowup;
