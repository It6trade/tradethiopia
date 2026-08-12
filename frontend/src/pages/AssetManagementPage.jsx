import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box, Flex, Text, Heading, HStack, VStack, Button, IconButton,
  Input, Select, InputGroup, InputLeftElement, InputRightElement, Table, Thead, Tbody,
  Tr, Th, Td, Checkbox, Avatar, Badge, Progress, Tabs, TabList, TabPanels,
  Tab, TabPanel, Divider, useColorModeValue, useToast, Skeleton,
  Stack, SimpleGrid, Icon, CircularProgress, CircularProgressLabel,
  Menu, MenuButton, MenuList, MenuItem, Drawer, DrawerOverlay,
  DrawerContent, DrawerCloseButton, DrawerBody, DrawerFooter,
  FormControl, FormLabel, Alert, AlertIcon, Tag, TagLabel,
  TagCloseButton, useDisclosure, Textarea,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton
} from "@chakra-ui/react";
import {
  FiSearch, FiDownload, FiPlus, FiGrid, FiList, FiMoreVertical,
  FiEdit, FiTrash2, FiPrinter, FiAlertCircle, FiActivity, FiFile,
  FiPackage, FiMonitor, FiServer, FiSmartphone, FiTool, FiShield,
  FiUser, FiMapPin, FiCalendar, FiDollarSign, FiRefreshCw, FiX,
  FiChevronLeft, FiChevronRight, FiExternalLink, FiCpu, FiHardDrive,
  FiChevronDown, FiCamera, FiUploadCloud, FiVideo, FiLink, FiFolder, FiCornerDownRight, FiGitBranch
} from "react-icons/fi";
import axios from "axios";
import AssetForm from "../components/AssetForm";

/* ═══ DESIGN TOKENS ═══ */
const GREEN_PRIMARY = "#1a2e22";
const GREEN_ACCENT = "#2d6a4f";
const GREEN_LIGHT = "#d8f3dc";
const GREEN_HOVER = "#3a7d5c";

/* ─── dynamic asset fallback image ─── */
const getAssetMockImage = (asset) => {
  if (!asset) return "/workspace_asset.png";
  if (asset.imageURL) return asset.imageURL;

  const category = (asset.category || "").toLowerCase();
  const name = (asset.name || "").toLowerCase();
  const desc = (asset.description || "").toLowerCase();

  // 1. Desktop matches first
  if (
    category.includes("desktop") || name.includes("desktop") ||
    category === "pc" || name.includes("pc5") || name.includes("pc ")
  ) {
    return "/workspace_asset.png";
  }
  // 2. Laptop matches second
  if (
    category.includes("laptop") || name.includes("laptop") ||
    category.includes("notebook") || name.includes("notebook") ||
    name.includes("macbook") || desc.includes("laptop")
  ) {
    return "/laptop_asset.png";
  }
  // 3. Chairs
  if (category.includes("chair") || name.includes("chair") || category.includes("seating") || desc.includes("chair")) {
    return "/chair_asset.png";
  }
  // 4. Desks and Tables
  if (
    category.includes("table") || name.includes("table") ||
    category.includes("desk") || name.includes("desk") ||
    category.includes("furniture") || desc.includes("desk") ||
    desc.includes("table")
  ) {
    return "/table_asset.png";
  }
  return "/workspace_asset.png";
};

/* ─── condition badge colour ─── */
const conditionColor = (cond) => {
  if (!cond) return "gray";
  const c = cond.toLowerCase();
  if (c === "new") return "blue";
  if (c === "good") return "green";
  if (c === "need maintenance" || c === "need_maintenance") return "orange";
  if (c === "under maintenance" || c === "under_maintenance") return "yellow";
  if (c === "poor" || c === "damaged") return "red";
  return "gray";
};

/* ─── asset health % (profile completeness) ─── */
const calcAssetHealth = (asset) => {
  if (!asset) return 0;
  let score = 0;
  if (asset.name) score++;
  if (asset.nameTag) score++;
  if (asset.assignedTo && asset.assignedTo !== "Unassigned") score++;
  if (asset.location) score++;
  if (asset.status === "Active") score++;
  if (asset.category) score++;
  if (asset.amount && asset.amount > 0) score++;
  return Math.round((score / 7) * 100);
};

/* ─── format ETB currency ─── */
const fmtETB = (val) => {
  if (!val || isNaN(val)) return "ETB 0";
  if (val >= 1000000) return `ETB ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `ETB ${(val / 1000).toFixed(0)}K`;
  return `ETB ${Number(val).toLocaleString()}`;
};

/* ─── category icon ─── */
const getCategoryIcon = (cat) => {
  if (!cat) return FiPackage;
  const c = cat.toLowerCase();
  if (c.includes("desktop") || c.includes("pc") || c.includes("computer")) return FiMonitor;
  if (c.includes("laptop")) return FiCpu;
  if (c.includes("server") || c.includes("network")) return FiServer;
  if (c.includes("phone") || c.includes("mobile")) return FiSmartphone;
  if (c.includes("printer") || c.includes("scanner")) return FiPrinter;
  if (c.includes("storage") || c.includes("drive") || c.includes("disk")) return FiHardDrive;
  return FiPackage;
};

/* ─── status dot colour ─── */
const statusDotColor = (status) => {
  if (status === "Active") return "green.400";
  if (status === "Under Maintenance") return "orange.400";
  return "gray.400";
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const AssetManagementPage = () => {
  /* ─── data ─── */
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  /* ─── selection ─── */
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());

  /* ─── detail drawer ─── */
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [detailAsset, setDetailAsset] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  /* ─── create, transfer & category manager drawers ─── */
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();
  const { isOpen: isCatManagerOpen, onOpen: onCatManagerOpen, onClose: onCatManagerClose } = useDisclosure();
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [migrateFromCategory, setMigrateFromCategory] = useState("");
  const [migrateToCategory, setMigrateToCategory] = useState("");
  const [isMigratingCategory, setIsMigratingCategory] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [editingCatId, setEditingCatId] = useState("");
  const [editingCatName, setEditingCatName] = useState("");
  const [editingCatParent, setEditingCatParent] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteMigrateTarget, setDeleteMigrateTarget] = useState("");
  const { isOpen: isDeleteSafetyOpen, onOpen: onDeleteSafetyOpen, onClose: onDeleteSafetyClose } = useDisclosure();
  const { isOpen: isTreeMapOpen, onOpen: onTreeMapOpen, onClose: onTreeMapClose } = useDisclosure();

  /* ─── tree builder state ─── */
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  /* ─── filters ─── */
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerSearchTerm, setDrawerSearchTerm] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list");

  /* ─── pagination ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ─── detail edit state ─── */
  const [editCondition, setEditCondition] = useState("Good");
  const [editLocation, setEditLocation] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* ─── maintenance log input state ─── */
  const [logAction, setLogAction] = useState("");
  const [logCost, setLogCost] = useState("");
  const [logTechnician, setLogTechnician] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [isAddingLog, setIsAddingLog] = useState(false);

  /* ─── documents input state ─── */
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Invoice");
  const [docUrl, setDocUrl] = useState("");
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  /* ─── image modifications state & camera handlers ─── */
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [webcamUrl, setWebcamUrl] = useState("");
  const videoRef = useRef(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    setWebcamUrl("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 480, height: 360 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      toast({ title: "Camera error", description: "Cannot open device camera. Make sure permissions are granted.", status: "error", duration: 3000 });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setWebcamUrl(dataUrl);
      stopCamera();
      handleSaveAssetImage(dataUrl);
    }
  };

  const handleSaveAssetImage = async (newImgUrl) => {
    if (!detailAsset) return;
    try {
      const payload = { ...detailAsset, imageURL: newImgUrl };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      if (res.data?.success && res.data?.data) {
        setDetailAsset(res.data.data);
      } else {
        setDetailAsset(payload);
      }
      toast({ title: "Asset image updated", status: "success", duration: 3000 });
      setShowImageOptions(false);
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to update image", description: err.message, status: "error" });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleSaveAssetImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const toast = useToast();

  const cleanCategory = (cat) => {
    if (!cat) return "";
    let s = String(cat).trim();
    if (!s) return "";
    s = s.split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const plurals = {
      "Chairs": "Chair",
      "Tables": "Table",
      "Laptops": "Laptop",
      "Desktops": "Desktop",
      "Phones": "Phone",
      "Phone Numbers": "Phone Number",
      "Printers": "Printer",
      "Servers": "Server",
      "Harddisks": "Harddisk 1TB",
      "Harddisk 1tb": "Harddisk 1TB",
      "Social Medias": "Social Media",
      "Adapters": "Adapter",
      "Adaptor": "Adapter",
      "Coffee Bowls": "Coffee Bowl",
      "Coffee Cups": "Coffee Cup",
      "Barista Caps": "Barista Cap",
      "Barista Coats": "Barista Coat",
      "Barista Stamps": "Barista Stamp",
      "Coffee Bags": "Coffee Bag",
      "Coffee Makers": "Coffee Maker",
      "Coffee Machine": "Coffee Machine",
      "Coffee Machines": "Coffee Machine",
      "Coffee Maker Chargers": "Coffee Maker Charger",
      "Coffee Cleaning Brushes": "Coffee Cleaning Brush"
    };

    if (plurals[s]) {
      s = plurals[s];
    } else if (s.endsWith("s") && !s.endsWith("ss") && s !== "Status" && s !== "Business" && s !== "Accounts" && s !== "Email & Accounts") {
      s = s.slice(0, -1);
    }
    return s;
  };

  /* ═══ FETCH ═══ */
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets`);
      const rawAssets = res.data?.data || [];
      const cleaned = rawAssets.map(a => ({
        ...a,
        category: cleanCategory(a.category)
      }));
      setAssets(cleaned);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assetcategories`);
      let data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      // Auto-seeding logic:
      // Scan all assets and register any category that is not yet present in the catalog!
      if (assets.length > 0) {
        const uniqueAssetCats = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));

        // Find existing category names in catalog (case-insensitive check)
        const catalogNames = new Set(data.map(c => c.name.trim().toLowerCase()));

        // Filter out categories that are already in the catalog database
        // Also split/check hierarchical paths (we check if the path itself or leaf name matches)
        const missingCats = uniqueAssetCats.filter(catName => {
          const trimmedLower = catName.trim().toLowerCase();
          if (!trimmedLower || trimmedLower === "unassigned") return false;
          return !catalogNames.has(trimmedLower);
        });

        if (missingCats.length > 0) {
          console.log("Auto-registering missing asset categories into catalog:", missingCats);
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/assetcategories/bulk`, { categories: missingCats.map(c => c.trim()) });
          } catch (seedErr) {
            console.error(`Failed to auto-seed categories:`, seedErr);
          }
          // Re-fetch fresh categories catalog list
          const refetched = await axios.get(`${import.meta.env.VITE_API_URL}/api/assetcategories`);
          data = Array.isArray(refetched.data) ? refetched.data : refetched.data?.data || [];
        }
      }
      setCatalogCategories(data);
    } catch (err) {
      console.error("Error fetching catalog categories:", err);
    }
  }, [assets]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllUsers(data.filter(u => u.username && u.username !== "." && u.username !== ".."));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const getCategoryPath = useCallback((catId, visited = []) => {
    if (visited.includes(catId)) {
      return "Cycle Detected";
    }
    const cat = catalogCategories.find(c => c._id === catId);
    if (!cat) return "";
    if (!cat.parent) return cat.name;
    const parentId = cat.parent._id || cat.parent;
    const parentPath = getCategoryPath(parentId, [...visited, catId]);
    return parentPath ? `${parentPath} > ${cat.name}` : cat.name;
  }, [catalogCategories]);

  // Generate resolved categories for dropdown selection
  const resolvedCatalog = useMemo(() => {
    return catalogCategories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      parent: cat.parent,
      path: getCategoryPath(cat._id)
    })).sort((a, b) => a.path.localeCompare(b.path));
  }, [catalogCategories, getCategoryPath]);

  useEffect(() => {
    fetchAssets();
    fetchUsers();
  }, [fetchAssets, fetchUsers]);

  useEffect(() => {
    if (assets.length > 0) {
      fetchCatalogCategories();
    }
  }, [assets, fetchCatalogCategories]);

  /* ─── populate detail edit fields when opening drawer ─── */
  const openAssetDetail = (asset) => {
    setDetailAsset(asset);
    setEditCondition(asset.condition || "Good");
    setEditLocation(asset.location || "");
    setEditAssignedTo(asset.assignedTo || "");
    setEditStatus(asset.status || "Active");
    setEditDescription(asset.description || "");
    setActiveTab(0);
    onDetailOpen();
  };

  /* ═══ FILTERING ═══ */
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (a.name || "").toLowerCase().includes(term) ||
        (a.nameTag || "").toLowerCase().includes(term) ||
        (a.assignedTo || "").toLowerCase().includes(term) ||
        (a.category || "").toLowerCase().includes(term) ||
        (a._id || "").toLowerCase().includes(term);
      const matchCat = catFilter === "All" || a.category === catFilter;

      const matchStatus = statusFilter === "All" ||
        (statusFilter === "Maintenance Due"
          ? (a.status === "Under Maintenance" || a.status === "Need Maintenance" || a.status === "Need maintenance")
          : a.status === statusFilter);

      const matchLoc = locationFilter === "All" || a.location === locationFilter;

      const matchAssignee = assigneeFilter === "All" ||
        (assigneeFilter === "Assigned"
          ? (a.assignedTo && a.assignedTo !== "Unassigned" && a.assignedTo !== "")
          : assigneeFilter === "Unassigned"
            ? (!a.assignedTo || a.assignedTo === "Unassigned" || a.assignedTo === "")
            : a.assignedTo === assigneeFilter);

      return matchSearch && matchCat && matchStatus && matchLoc && matchAssignee;
    });
  }, [assets, searchTerm, catFilter, statusFilter, locationFilter, assigneeFilter]);

  const categories = useMemo(() => {
    return ["All", ...resolvedCatalog.map(c => c.path)];
  }, [resolvedCatalog]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    assets.forEach(a => {
      if (a.category) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });

    const rolledUp = {};
    resolvedCatalog.forEach(cat => {
      let sum = 0;
      Object.keys(counts).forEach(path => {
        if (path === cat.path || path.startsWith(cat.path + " > ")) {
          sum += counts[path];
        }
      });
      rolledUp[cat.path] = sum;
    });
    return rolledUp;
  }, [assets, resolvedCatalog]);

  const statuses = useMemo(() => {
    const list = Array.from(new Set(assets.map(a => a.status).filter(Boolean)));
    return ["All", ...list.sort((a, b) => a.localeCompare(b))];
  }, [assets]);

  const locations = useMemo(() => {
    const list = Array.from(new Set(assets.map(a => a.location).filter(Boolean)));
    return ["All", ...list.sort((a, b) => a.localeCompare(b))];
  }, [assets]);

  const assignees = useMemo(() => {
    const list = Array.from(new Set(assets.map(a => a.assignedTo).filter(Boolean)));
    return ["All", ...list.sort((a, b) => a.localeCompare(b))];
  }, [assets]);

  const activeFilters = [];
  if (catFilter !== "All") activeFilters.push({ key: "cat", label: `Category: ${catFilter}`, clear: () => setCatFilter("All") });
  if (statusFilter !== "All") activeFilters.push({ key: "status", label: statusFilter === "Maintenance Due" ? "Status: Maintenance Required" : `Status: ${statusFilter}`, clear: () => setStatusFilter("All") });
  if (locationFilter !== "All") activeFilters.push({ key: "loc", label: `Location: ${locationFilter}`, clear: () => setLocationFilter("All") });
  if (assigneeFilter !== "All") activeFilters.push({ key: "assignee", label: assigneeFilter === "Assigned" ? "Assignee: Assigned Only" : assigneeFilter === "Unassigned" ? "Assignee: Unassigned Only" : `Assignee: ${assigneeFilter}`, clear: () => setAssigneeFilter("All") });
  const clearAllFilters = () => { setCatFilter("All"); setStatusFilter("All"); setLocationFilter("All"); setAssigneeFilter("All"); setSearchTerm(""); };

  /* ═══ STATS ═══ */
  const stats = useMemo(() => {
    const total = assets.length;
    const assigned = assets.filter(a => a.assignedTo && a.assignedTo !== "Unassigned" && a.assignedTo !== "").length;
    const available = total - assigned;
    const maintenance = assets.filter(a =>
      a.status === "Under Maintenance" ||
      a.status === "Need Maintenance" ||
      a.status === "Need maintenance" ||
      a.condition === "Need maintenance" ||
      a.condition === "Need Maintenance" ||
      a.condition === "Poor" ||
      a.condition === "Damaged"
    ).length;
    const totalValue = assets.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const assignedPct = total > 0 ? Math.round((assigned / total) * 100) : 0;
    return { total, assigned, available, maintenance, totalValue, assignedPct };
  }, [assets]);

  /* ═══ PAGINATION ═══ */
  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage) || 1;
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAssets.slice(start, start + rowsPerPage);
  }, [filteredAssets, currentPage, rowsPerPage]);

  /* ═══ SELECT HANDLERS ═══ */
  const handleSelectToggle = (id, e) => {
    e.stopPropagation();
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const handleSelectAll = (e) => {
    setSelectedAssetIds(e.target.checked ? new Set(filteredAssets.map(a => a._id)) : new Set());
  };

  /* ═══ BULK ACTIONS ═══ */
  const handleBulkAction = async (action) => {
    if (selectedAssetIds.size === 0) return;
    const targetStatus = action === "activate" ? "Active" : "Inactive";
    try {
      await Promise.all(Array.from(selectedAssetIds).map(id => {
        const found = assets.find(a => a._id === id);
        return axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${id}`, { ...found, status: targetStatus });
      }));
      toast({ title: "Bulk update complete", status: "success", duration: 3000 });
      setSelectedAssetIds(new Set());
      fetchAssets();
    } catch (err) {
      toast({ title: "Bulk action failed", description: err.message, status: "error" });
    }
  };

  /* ═══ SAVE DETAIL ═══ */
  const handleSaveAssetDetails = async () => {
    if (!detailAsset) return;
    setIsSaving(true);
    try {
      const payload = { ...detailAsset, condition: editCondition, location: editLocation, assignedTo: editAssignedTo, status: editStatus, description: editDescription };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      const updatedAsset = res.data?.data || payload;
      setDetailAsset(updatedAsset);
      // Also update the local state inputs if the asset was changed
      setEditAssignedTo(updatedAsset.assignedTo || "");
      setEditLocation(updatedAsset.location || "");
      toast({ title: "Asset updated", status: "success", duration: 3000 });
      fetchAssets();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  /* ═══ MAINTENANCE SERVICE LOGS ═══ */
  const handleAddMaintenanceLog = async () => {
    if (!detailAsset || !logAction.trim()) return;
    setIsAddingLog(true);
    try {
      const newEntry = {
        action: logAction,
        cost: Number(logCost) || 0,
        technician: logTechnician || "Internal Staff",
        date: logDate || new Date().toISOString().slice(0, 10),
        id: Date.now().toString()
      };
      const logs = Array.isArray(detailAsset.maintenanceLog) ? detailAsset.maintenanceLog : [];
      const updatedLogs = [...logs, newEntry];

      const payload = { ...detailAsset, maintenanceLog: updatedLogs };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      if (res.data?.success && res.data?.data) {
        setDetailAsset(res.data.data);
      } else {
        setDetailAsset(payload);
      }
      toast({ title: "Maintenance log added", status: "success", duration: 3000 });
      setLogAction("");
      setLogCost("");
      setLogTechnician("");
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to add service entry", description: err.message, status: "error" });
    } finally {
      setIsAddingLog(false);
    }
  };

  const handleDeleteMaintenanceLog = async (logId) => {
    if (!detailAsset) return;
    if (!window.confirm("Are you sure you want to remove this log entry?")) return;
    try {
      const logs = Array.isArray(detailAsset.maintenanceLog) ? detailAsset.maintenanceLog : [];
      const updatedLogs = logs.filter(l => l.id !== logId && l.id !== String(logId));
      const payload = { ...detailAsset, maintenanceLog: updatedLogs };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      if (res.data?.success && res.data?.data) {
        setDetailAsset(res.data.data);
      } else {
        setDetailAsset(payload);
      }
      toast({ title: "Log entry removed", status: "success" });
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to remove entry", description: err.message, status: "error" });
    }
  };

  /* ═══ DOCUMENTS ATTACHMENT ═══ */
  const handleAddDocument = async () => {
    if (!detailAsset || !docName.trim()) return;
    setIsAddingDoc(true);
    try {
      const isImg = docType === "Photo / Image" || docUrl.match(/\.(jpeg|jpg|gif|png)$/i);
      const newDoc = {
        name: docName,
        type: docType,
        url: docUrl || "",
        uploadedAt: new Date(),
        fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
        id: Date.now().toString()
      };
      const docs = Array.isArray(detailAsset.documents) ? detailAsset.documents : [];
      const updatedDocs = [...docs, newDoc];

      const payload = { ...detailAsset, documents: updatedDocs };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      if (res.data?.success && res.data?.data) {
        setDetailAsset(res.data.data);
      } else {
        setDetailAsset(payload);
      }
      toast({ title: "Detail/document attached", status: "success", duration: 3000 });
      setDocName("");
      setDocUrl("");
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to attach document", description: err.message, status: "error" });
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!detailAsset) return;
    if (!window.confirm("Are you sure you want to detach this document?")) return;
    try {
      const docs = Array.isArray(detailAsset.documents) ? detailAsset.documents : [];
      const updatedDocs = docs.filter(d => d.id !== docId && d.id !== String(docId));
      const payload = { ...detailAsset, documents: updatedDocs };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${detailAsset._id}`, payload);
      if (res.data?.success && res.data?.data) {
        setDetailAsset(res.data.data);
      } else {
        setDetailAsset(payload);
      }
      toast({ title: "Document detached", status: "success" });
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to detach document", description: err.message, status: "error" });
    }
  };

  /* ═══ DELETE ═══ */
  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/assets/${id}`);
      toast({ title: "Asset deleted", status: "success" });
      if (detailAsset?._id === id) { setDetailAsset(null); onDetailClose(); }
      fetchAssets();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, status: "error" });
    }
  };

  /* ═══ TRANSFER ═══ */
  const selectedUserAssets = assets.filter(a => a.assignedTo === transferFrom);
  const handleExecuteTransfer = async () => {
    setIsTransferring(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/transfer`, { fromUser: transferFrom, toUser: transferTo });
      if (res.data?.success) {
        toast({ title: "Transfer successful", status: "success" });
        onTransferClose();
        fetchAssets();
      } else throw new Error(res.data?.message || "Transfer failed");
    } catch (err) {
      toast({ title: "Transfer error", description: err.message, status: "error" });
    } finally {
      setIsTransferring(false);
    }
  };

  /* ═══ CATEGORY MIGRATION / MERGE ═══ */
  const handleMigrateCategory = async () => {
    if (!migrateFromCategory || !migrateToCategory) return;
    if (migrateFromCategory === migrateToCategory) {
      toast({ title: "Source and destination categories are identical.", status: "warning" });
      return;
    }
    setIsMigratingCategory(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/migrate-category`, {
        fromCategory: migrateFromCategory,
        toCategory: migrateToCategory
      });
      if (res.data?.success) {
        toast({
          title: "Categories merged successfully",
          description: `Moved ${res.data.data?.modifiedCount || 0} assets from '${migrateFromCategory}' to '${migrateToCategory}'.`,
          status: "success",
          duration: 5000,
          isClosable: true
        });
        setMigrateFromCategory("");
        setMigrateToCategory("");
        fetchAssets();
      } else throw new Error(res.data?.message || "Migration failed");
    } catch (err) {
      toast({ title: "Merge failed", description: err.message, status: "error" });
    } finally {
      setIsMigratingCategory(false);
    }
  };

  /* ═══ CATEGORY CRUD ACTIONS ═══ */
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast({ title: "Name is required.", status: "warning" });
      return;
    }
    setIsSavingCategory(true);
    try {
      const payload = {
        name: newCatName.trim(),
        parent: newCatParent || null
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/assetcategories`, payload);
      toast({ title: "Category added successfully", status: "success" });
      setNewCatName("");
      setNewCatParent("");
      fetchCatalogCategories();
    } catch (err) {
      toast({ title: "Failed to add category", description: err.message, status: "error" });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCatId || !editingCatName.trim()) return;
    setIsSavingCategory(true);
    try {
      const oldPath = getCategoryPath(editingCatId);
      const payload = {
        name: editingCatName.trim(),
        parent: editingCatParent || null
      };
      await axios.put(`${import.meta.env.VITE_API_URL}/api/assetcategories/${editingCatId}`, payload);

      const catRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/assetcategories`);
      const freshCats = Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [];
      setCatalogCategories(freshCats);

      const getFreshPath = (catId) => {
        const cat = freshCats.find(c => c._id === catId);
        if (!cat) return "";
        if (!cat.parent) return cat.name;
        const parentId = cat.parent._id || cat.parent;
        const pPath = getFreshPath(parentId);
        return pPath ? `${pPath} > ${cat.name}` : cat.name;
      };

      const newPath = getFreshPath(editingCatId);

      if (oldPath && newPath && oldPath !== newPath) {
        const affectedAssets = assets.filter(a => a.category === oldPath || a.category.startsWith(`${oldPath} > `));
        await Promise.all(affectedAssets.map(asset => {
          let updatedCatStr = asset.category;
          if (asset.category === oldPath) {
            updatedCatStr = newPath;
          } else if (asset.category.startsWith(`${oldPath} > `)) {
            updatedCatStr = newPath + asset.category.slice(oldPath.length);
          }
          return axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${asset._id}`, {
            ...asset,
            category: updatedCatStr
          });
        }));
      }

      toast({ title: "Category updated successfully", status: "success" });
      setEditingCatId("");
      setEditingCatName("");
      setEditingCatParent("");
      fetchCatalogCategories();
      fetchAssets();
    } catch (err) {
      toast({ title: "Failed to update category", description: err.message, status: "error" });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    const cat = catalogCategories.find(c => c._id === catId);
    if (!cat) return;

    const path = getCategoryPath(catId);

    // Safety check for assets in this category
    const count = assets.filter(a => a.category === path || a.category.startsWith(`${path} > `)).length;
    if (count > 0) {
      setCategoryToDelete({ id: catId, path, count });
      setDeleteMigrateTarget("");
      onDeleteSafetyOpen();
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${path}"?`)) {
      return;
    }

    setIsSavingCategory(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/assetcategories/${catId}`);

      toast({ title: "Category deleted", status: "success" });
      if (editingCatId === catId) {
        setEditingCatId("");
        setEditingCatName("");
        setEditingCatParent("");
      }
      fetchCatalogCategories();
      fetchAssets();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, status: "error" });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleExecuteSafeDelete = async () => {
    if (!categoryToDelete || !deleteMigrateTarget) return;
    if (categoryToDelete.path === deleteMigrateTarget) {
      toast({ title: "Target category must be different", status: "error" });
      return;
    }

    setIsSavingCategory(true);
    try {
      // 1. Migrate assets
      await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/migrate-category`, {
        fromCategory: categoryToDelete.path,
        toCategory: deleteMigrateTarget
      });

      // 2. Delete the category
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/assetcategories/${categoryToDelete.id}`);

      toast({ title: "Category migrated and deleted successfully!", status: "success" });
      if (editingCatId === categoryToDelete.id) {
        setEditingCatId("");
        setEditingCatName("");
        setEditingCatParent("");
      }
      onDeleteSafetyClose();
      setCategoryToDelete(null);
      fetchCatalogCategories();
      fetchAssets();
    } catch (err) {
      toast({ title: "Operation failed", description: err.message, status: "error" });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleBulkMergeAndClean = async () => {
    if (selectedCategoryIds.size === 0 || !migrateToCategory) return;

    // Check if the target category is among the selected categories to delete!
    const targetCat = catalogCategories.find(c => c.name === migrateToCategory || getCategoryPath(c._id) === migrateToCategory);
    if (targetCat && selectedCategoryIds.has(targetCat._id)) {
      toast({ title: "Target category cannot be in the deletion selection", status: "error" });
      return;
    }

    if (!window.confirm(`Are you sure you want to merge ${selectedCategoryIds.size} categories into "${migrateToCategory}" and delete them?`)) {
      return;
    }

    setIsSavingCategory(true);
    try {
      for (const catId of selectedCategoryIds) {
        const cat = catalogCategories.find(c => c._id === catId);
        if (!cat) continue;
        const path = getCategoryPath(catId);

        // 1. Migrate assets from this category to the target
        await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/migrate-category`, {
          fromCategory: path,
          toCategory: migrateToCategory
        });

        // 3. Delete the category
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/assetcategories/${catId}`);
      }

      toast({ title: "Bulk merge and cleanup completed!", status: "success" });
      setSelectedCategoryIds(new Set());
      setMigrateToCategory("");
      fetchCatalogCategories();
      fetchAssets();
    } catch (err) {
      toast({ title: "Bulk merge failed", description: err.message, status: "error" });
    } finally {
      setIsSavingCategory(false);
    }
  };

  /* ─── tree drag & drop ─── */
  const treeRoots = useMemo(() => {
    const map = {};
    const roots = [];
    resolvedCatalog.forEach(cat => {
      map[cat._id] = { ...cat, children: [] };
    });
    resolvedCatalog.forEach(cat => {
      const parentId = cat.parent?._id || cat.parent;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[cat._id]);
      } else {
        roots.push(map[cat._id]);
      }
    });
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(roots);
    return roots;
  }, [resolvedCatalog]);

  const filteredTreeRoots = useMemo(() => {
    if (!drawerSearchTerm) return treeRoots;

    const filterNodes = (nodes) => {
      return nodes
        .map(node => {
          const matchThis = node.name.toLowerCase().includes(drawerSearchTerm.toLowerCase());
          const filteredChildren = node.children ? filterNodes(node.children) : [];
          const matchChildren = filteredChildren.length > 0;

          if (matchThis || matchChildren) {
            return {
              ...node,
              children: filteredChildren
            };
          }
          return null;
        })
        .filter(Boolean);
    };

    return filterNodes(treeRoots);
  }, [treeRoots, drawerSearchTerm]);

  const handleTreeDragStart = (e, cat) => {
    e.stopPropagation();
    setDraggedNode(cat);
  };

  const handleTreeDragOver = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverNode !== catId) {
      setDragOverNode(catId);
    }
  };

  const handleTreeDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNode(null);
  };

  const handleTreeDrop = async (e, draggedNodeId, targetParentId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDragOverNode(null);

    const dNode = draggedNodeId ? catalogCategories.find(c => c._id === draggedNodeId) : draggedNode;
    if (!dNode) return;
    if (dNode._id === targetParentId) return;

    let current = targetParentId ? catalogCategories.find(c => c._id === targetParentId) : null;
    while (current) {
      if (current._id === dNode._id) {
        toast({ title: "Cannot drop a category into its own descendant", status: "error" });
        return;
      }
      const pId = current.parent?._id || current.parent;
      current = pId ? catalogCategories.find(c => c._id === pId) : null;
    }

    // Save previous state for rollback on error
    const previousCategories = [...catalogCategories];
    const targetObj = targetParentId ? catalogCategories.find(c => c._id === targetParentId) : null;

    // Optimistic Update: Modify state immediately so changes are instant
    setCatalogCategories(prev => prev.map(c => {
      if (c._id === dNode._id) {
        return { ...c, parent: targetObj || null };
      }
      return c;
    }));

    setDraggedNode(null);

    // Perform the API put request in the background
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/assetcategories/${dNode._id}`, {
        name: dNode.name,
        parent: targetParentId || null
      });
      // Silent success since it happened instantly in the UI
    } catch (err) {
      // Rollback to previous state on failure
      setCatalogCategories(previousCategories);
      toast({ title: "Failed to update hierarchy", description: err.message, status: "error" });
    }
  };

  const toggleCollapseNode = (catId) => {
    const next = new Set(collapsedNodes);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setCollapsedNodes(next);
  };

  const renderTreeNode = (node, level) => {
    const isDragOver = dragOverNode === node._id;
    const isBeingDragged = draggedNode?._id === node._id;
    const isCollapsed = drawerSearchTerm ? false : collapsedNodes.has(node._id);
    const path = node.path;
    const count = categoryCounts[path] || 0;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <Box key={node._id} w="100%">
        <Flex
          align="center"
          py={1.5}
          px={3}
          ml={level * 5}
          bg={isDragOver ? "green.100" : (isBeingDragged ? "gray.50" : "transparent")}
          border={draggedNode ? "1px dashed" : "1px solid"}
          borderColor={isDragOver ? "green.500" : (draggedNode ? "green.200" : (level > 0 ? "gray.100" : "transparent"))}
          borderRadius="md"
          opacity={isBeingDragged ? 0.5 : 1}
          draggable
          onDragStart={(e) => handleTreeDragStart(e, node)}
          onDragOver={(e) => handleTreeDragOver(e, node._id)}
          onDragLeave={handleTreeDragLeave}
          onDrop={(e) => handleTreeDrop(e, null, node._id)}
          cursor="grab"
          _hover={{ bg: "gray.50" }}
          transition="all 0.15s"
        >
          {/* Collapse/Expand Toggle */}
          <IconButton
            size="xs"
            variant="ghost"
            icon={<FiChevronDown style={{ transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }} />}
            isDisabled={!hasChildren}
            onClick={() => toggleCollapseNode(node._id)}
            aria-label="Toggle node"
            mr={1}
            pointerEvents={draggedNode ? "none" : "auto"}
          />
          <Icon as={level === 0 ? FiFolder : FiCornerDownRight} color={GREEN_PRIMARY} mr={2} pointerEvents={draggedNode ? "none" : "auto"} />
          <Text fontSize="sm" fontWeight="700" color="gray.700" flex="1" noOfLines={1} pointerEvents={draggedNode ? "none" : "auto"}>{node.name}</Text>
          <Badge bg="gray.100" color="gray.600" borderRadius="none" fontSize="9px" px={2} mr={2} pointerEvents={draggedNode ? "none" : "auto"}>{count} asset{count !== 1 ? "s" : ""}</Badge>

          {/* Quick parent-reassign native select */}
          <Select
            size="xs"
            w="65px"
            h="20px"
            variant="outline"
            borderRadius="none"
            fontSize="9px"
            placeholder="Move"
            bg="white"
            borderColor="gray.200"
            value=""
            onChange={(e) => {
              if (e.target.value === "root") {
                handleTreeDrop(null, node._id, null);
              } else if (e.target.value) {
                handleTreeDrop(null, node._id, e.target.value);
              }
            }}
            pointerEvents={draggedNode ? "none" : "auto"}
          >
            {node.parent && <option value="root">Make Top-Level</option>}
            {resolvedCatalog
              .filter(c => c._id !== node._id && (!c.parent || (c.parent._id || c.parent) !== node._id))
              .map(c => (
                <option key={c._id} value={c._id}>
                  {c.path}
                </option>
              ))}
          </Select>
        </Flex>

        {hasChildren && !isCollapsed && (
          <VStack
            align="stretch"
            spacing={1}
            mt={1}
            pl={3}
            borderLeft="1px dashed"
            borderColor="gray.200"
            ml={level * 5 + 4}
          >
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </VStack>
        )}
      </Box>
    );
  };

  const renderTreeMapNode = (node, level) => {
    const path = node.path;
    const count = categoryCounts[path] || 0;
    const hasChildren = node.children && node.children.length > 0;
    return (
      <Box key={node._id} w="100%">
        <HStack py={1.5} align="center" spacing={2} pl={level * 5}>
          {hasChildren ? (
            <Icon as={FiChevronDown} color="gray.400" size="10px" />
          ) : (
            <Box w="10px" />
          )}
          <Icon as={FiFolder} color="green.500" />
          <Text fontSize="xs" fontWeight="700" color="gray.700">{node.name}</Text>
          <Badge bg="green.50" color="green.750" fontSize="9px" borderRadius="full" px={2}>{count} asset{count !== 1 ? "s" : ""}</Badge>
        </HStack>
        {hasChildren && (
          <VStack align="stretch" spacing={0.5} pl={4} borderLeft="1px dashed" borderColor="gray.200" ml={level * 5 + 4}>
            {node.children.map(child => renderTreeMapNode(child, level + 1))}
          </VStack>
        )}
      </Box>
    );
  };

  /* ═══ EXPORT ═══ */
  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportData = filteredAssets.map(a => ({
        "Name Tag": a.nameTag || "", Name: a.name || "", Category: a.category || "",
        "Assigned To": a.assignedTo || "", Group: a.assets || "", Location: a.location || "",
        Status: a.status || "", Value: a.amount || 0,
        "Date Acquired": a.dateAcquired ? new Date(a.dateAcquired).toISOString().slice(0, 10) : "",
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Assets");
      XLSX.writeFile(wb, `assets_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Exported successfully", status: "success", duration: 3000 });
    } catch (err) {
      toast({ title: "Export failed", description: err.message, status: "error" });
    }
  };

  /* ═══ COLOUR MODE VALUES ═══ */
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const headingColor = useColorModeValue("gray.900", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const tableHoverBg = useColorModeValue("gray.50", "gray.700");
  const subtleBg = useColorModeValue("gray.50", "gray.750");

  const progressTrackColor = useColorModeValue("gray.100", "gray.700");
  const buttonHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const drawerBodyBg = useColorModeValue("white", "gray.900");
  const docItemBg = useColorModeValue("gray.50", "gray.750");
  const activityIconBg = useColorModeValue("gray.50", "gray.750");
  const drawerFooterBg = useColorModeValue("gray.50", "gray.950");

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <Box pt={2} px={{ base: 3, md: 5 }} pb={8} bg={pageBg} minH="100vh">

      {/* ─────── PAGE HEADER ─────── */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="10px" fontWeight="800" color={GREEN_ACCENT} textTransform="uppercase" letterSpacing="0.12em" mb={1}>
            Operations & Inventory
          </Text>
          <Heading size="lg" fontWeight="800" color={headingColor} mb={1}>
            Asset Management
          </Heading>
          <Text fontSize="sm" color={mutedColor} maxW="520px">
            Track ownership, condition, maintenance and the complete lifecycle of company assets across all departments.
          </Text>
        </Box>
        <HStack spacing={2} flexWrap="wrap">
          <Button variant="outline" borderColor={cardBorder} leftIcon={<FiDownload />} borderRadius="none" fontSize="xs" fontWeight="700" size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" borderColor={cardBorder} leftIcon={<FiRefreshCw />} borderRadius="none" fontSize="xs" fontWeight="700" size="sm"
            onClick={() => { setTransferFrom(""); setTransferTo(""); fetchUsers(); onTransferOpen(); }}>
            Transfer assets
          </Button>
          <Button variant="outline" borderColor={cardBorder} leftIcon={<FiList />} borderRadius="none" fontSize="xs" fontWeight="700" size="sm"
            onClick={onCatManagerOpen}>
            Manage categories
          </Button>
          <Button bg={GREEN_ACCENT} color="white" _hover={{ bg: GREEN_HOVER }} leftIcon={<FiPlus />} borderRadius="none" fontSize="xs" fontWeight="700" size="sm"
            onClick={() => { setAssetToEdit(null); onCreateOpen(); }}>
            Add asset
          </Button>
        </HStack>
      </Flex>

      {/* ─────── STATS CARDS ─────── */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
        {[
          {
            label: "Total Assets",
            value: stats.total,
            sub: "Across all locations",
            icon: FiPackage,
            theme: { bg: "teal.50", color: "teal.500" },
            isActive: catFilter === "All" && statusFilter === "All" && locationFilter === "All" && assigneeFilter === "All" && searchTerm === "",
            onClick: () => clearAllFilters()
          },
          {
            label: "Assigned",
            value: stats.assigned,
            sub: `${stats.assignedPct}% of total assets`,
            icon: FiUser,
            theme: { bg: "green.50", color: "green.500" },
            isActive: assigneeFilter === "Assigned",
            onClick: () => { clearAllFilters(); setAssigneeFilter("Assigned"); }
          },
          {
            label: "Available",
            value: stats.available,
            sub: "Ready for assignment",
            icon: FiShield,
            theme: { bg: "blue.50", color: "blue.500" },
            isActive: assigneeFilter === "Unassigned",
            onClick: () => { clearAllFilters(); setAssigneeFilter("Unassigned"); }
          },
          {
            label: "Maintenance Due",
            value: stats.maintenance,
            sub: stats.maintenance > 0 ? "Requires attention" : "No actions pending",
            icon: FiTool,
            theme: { bg: "orange.50", color: "orange.500" },
            isActive: statusFilter === "Maintenance Due",
            alert: stats.maintenance > 0,
            onClick: () => { clearAllFilters(); setStatusFilter("Maintenance Due"); }
          },
          {
            label: "Asset Value",
            value: fmtETB(stats.totalValue),
            sub: "Total book value",
            icon: FiDollarSign,
            theme: { bg: "purple.50", color: "purple.500" },
            isActive: false,
            onClick: () => clearAllFilters()
          },
        ].map((s) => (
          <Box
            key={s.label}
            p={4}
            bg={cardBg}
            border="1px solid"
            borderColor={s.isActive ? GREEN_ACCENT : cardBorder}
            borderRadius="none"
            shadow={s.isActive ? "sm" : "xs"}
            position="relative"
            cursor="pointer"
            onClick={s.onClick}
            transition="all 0.15s"
            _hover={{ borderColor: GREEN_ACCENT, shadow: "sm", transform: "translateY(-1px)" }}
          >
            {s.alert && (
              <Box position="absolute" top={2.5} right={2.5}>
                <Box w={2} h={2} borderRadius="full" bg="red.500" />
                <Box w={2} h={2} borderRadius="full" bg="red.500" position="absolute" top={0} animation="ping 1.5s cubic-bezier(0,0,0.2,1) infinite" opacity={0.7} />
              </Box>
            )}
            <HStack spacing={3}>
              <Flex w="44px" h="44px" align="center" justify="center" bg={s.theme.bg} color={s.theme.color} borderRadius="none" flexShrink={0}>
                <Icon as={s.icon} boxSize="22px" strokeWidth="2.5" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="850" color={headingColor} lineHeight="1">{s.value}</Text>
                <Text fontSize="10px" color="gray.500" fontWeight="800" mt={1}>{s.label}</Text>
                <Text fontSize="9px" color="gray.400" fontWeight="600">{s.sub}</Text>
              </VStack>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      {/* ─────── DIRECTORY TABLE (FULL WIDTH) ─────── */}
      <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="none" shadow="sm" overflow="hidden">

        {/* ── Filter Bar ── */}
        <Flex p={4} pb={3} flexWrap="wrap" gap={3} align="center" borderBottom="1px solid" borderColor={cardBorder}>
          <InputGroup size="sm" maxW="280px">
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input placeholder="Search asset, tag, serial or employee..." borderRadius="none" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              bg={subtleBg} _focus={{ borderColor: GREEN_ACCENT, boxShadow: `0 0 0 1px ${GREEN_ACCENT}` }} />
          </InputGroup>
          <Menu closeOnSelect={true}>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              borderRadius="none"
              bg={subtleBg}
              rightIcon={<FiChevronDown />}
              fontWeight="normal"
              fontSize="sm"
              w="180px"
              textAlign="left"
              color={catFilter === "All" ? "gray.500" : "gray.850"}
              border="1px solid"
              borderColor={cardBorder}
              _hover={{ bg: "gray.50" }}
              _active={{ bg: "gray.100" }}
            >
              <Text noOfLines={1} pr={2}>
                {catFilter === "All" ? "Category: All" : catFilter}
              </Text>
            </MenuButton>
            <MenuList minW="220px" p={2} borderRadius="none" zIndex={20}>
              <InputGroup size="xs" mb={2}>
                <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
                <Input
                  placeholder="Search categories..."
                  borderRadius="none"
                  value={categorySearchQuery}
                  onChange={e => setCategorySearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </InputGroup>
              <Box maxH="200px" overflowY="auto">
                <MenuItem
                  fontSize="xs"
                  onClick={() => { setCatFilter("All"); setCategorySearchQuery(""); setCurrentPage(1); }}
                  borderRadius="none"
                >
                  All Categories
                </MenuItem>
                {categories.filter(c => c !== "All" && c.toLowerCase().includes(categorySearchQuery.toLowerCase())).map(c => {
                  const count = assets.filter(a => a.category === c).length;
                  return (
                    <MenuItem
                      key={c}
                      fontSize="xs"
                      onClick={() => { setCatFilter(c); setCategorySearchQuery(""); setCurrentPage(1); }}
                      borderRadius="none"
                      justifyContent="space-between"
                    >
                      <Text noOfLines={1} maxW="150px">{c}</Text>
                      <Badge size="xs" colorScheme="green">{count}</Badge>
                    </MenuItem>
                  );
                })}
                {categories.filter(c => c !== "All" && c.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                  <Text fontSize="xs" color="gray.400" p={2} textAlign="center">No categories found</Text>
                )}
              </Box>
            </MenuList>
          </Menu>
          <Select placeholder="Status" size="sm" maxW="160px" borderRadius="none" bg={subtleBg} value={statusFilter === "All" ? "" : statusFilter} onChange={e => { setStatusFilter(e.target.value || "All"); setCurrentPage(1); }}>
            <option value="Maintenance Due">⚠️ Needs Maintenance ({stats.maintenance})</option>
            {statuses.filter(s => s !== "All" && s !== "Maintenance Due").map(s => {
              const count = assets.filter(a => a.status === s).length;
              return <option key={s} value={s}>{s} ({count})</option>;
            })}
          </Select>
          <Select placeholder="Location" size="sm" maxW="180px" borderRadius="none" bg={subtleBg} value={locationFilter === "All" ? "" : locationFilter} onChange={e => { setLocationFilter(e.target.value || "All"); setCurrentPage(1); }}>
            {locations.filter(l => l !== "All").map(l => {
              const count = assets.filter(a => a.location === l).length;
              return <option key={l} value={l}>{l} ({count})</option>;
            })}
          </Select>
          <Select placeholder="Assignee" size="sm" maxW="185px" borderRadius="none" bg={subtleBg} value={assigneeFilter === "All" ? "" : assigneeFilter} onChange={e => { setAssigneeFilter(e.target.value || "All"); setCurrentPage(1); }}>
            <option value="Assigned">All Assigned ({stats.assigned})</option>
            <option value="Unassigned">All Unassigned ({stats.available})</option>
            {assignees.filter(a => a !== "All" && a !== "Unassigned" && a !== "Assigned" && a !== "").map(a => {
              const count = assets.filter(item => item.assignedTo === a).length;
              return <option key={a} value={a}>{a} ({count})</option>;
            })}
          </Select>
        </Flex>

        {/* ── Active Filters + Controls ── */}
        <Flex px={4} py={2.5} justify="space-between" align="center" flexWrap="wrap" gap={2} borderBottom="1px solid" borderColor={cardBorder} bg={subtleBg}>
          <HStack spacing={2} flexWrap="wrap">
            {selectedAssetIds.size > 0 && (
              <Select placeholder="Bulk actions" size="xs" w="120px" borderRadius="lg" bg="orange.50" borderColor="orange.200" fontWeight="700"
                onChange={e => { if (e.target.value) { handleBulkAction(e.target.value); e.target.value = ""; } }}>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
              </Select>
            )}
            <Badge bg="transparent" color="gray.500" fontSize="xs" fontWeight="800" px={0}>
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}
            </Badge>
            {activeFilters.map(f => (
              <Tag key={f.key} size="sm" borderRadius="full" variant="subtle" colorScheme="green" cursor="pointer">
                <TagLabel fontSize="10px" fontWeight="700">{f.label}</TagLabel>
                <TagCloseButton onClick={f.clear} />
              </Tag>
            ))}
            {activeFilters.length > 0 && (
              <Button size="xs" variant="link" color="red.400" fontWeight="700" onClick={clearAllFilters}>Clear all</Button>
            )}
          </HStack>
          <HStack spacing={1}>
            <IconButton icon={<FiList />} size="xs" variant={viewMode === "list" ? "solid" : "ghost"} colorScheme={viewMode === "list" ? "green" : "gray"} borderRadius="lg" onClick={() => setViewMode("list")} aria-label="List view" />
            <IconButton icon={<FiGrid />} size="xs" variant={viewMode === "grid" ? "solid" : "ghost"} colorScheme={viewMode === "grid" ? "green" : "gray"} borderRadius="lg" onClick={() => setViewMode("grid")} aria-label="Grid view" />
          </HStack>
        </Flex>

        {/* ── Content ── */}
        {loading ? (
          <Stack spacing={0} p={5}>{[...Array(6)].map((_, i) => <Skeleton key={i} h="48px" borderRadius="lg" mb={2} />)}</Stack>
        ) : filteredAssets.length === 0 ? (
          <Flex align="center" justify="center" py={20} direction="column" gap={3}>
            <Flex w="64px" h="64px" align="center" justify="center" bg={GREEN_LIGHT} color={GREEN_ACCENT} borderRadius="2xl"><Icon as={FiPackage} boxSize={7} /></Flex>
            <Text fontWeight="800" color="gray.600" fontSize="md">No assets found</Text>
            <Text fontSize="xs" color="gray.400" textAlign="center" maxW="300px">Try adjusting your filters or add a new asset to get started.</Text>
            <Button size="sm" bg={GREEN_ACCENT} color="white" _hover={{ bg: GREEN_HOVER }} borderRadius="xl" leftIcon={<FiPlus />} mt={2} onClick={onCreateOpen}>Add asset</Button>
          </Flex>
        ) : viewMode === "list" ? (
          /* ── TABLE VIEW ── */
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg={subtleBg}>
                <Tr>
                  <Th w="40px" borderColor={cardBorder}><Checkbox colorScheme="green" isChecked={filteredAssets.length > 0 && selectedAssetIds.size === filteredAssets.length} isIndeterminate={selectedAssetIds.size > 0 && selectedAssetIds.size < filteredAssets.length} onChange={handleSelectAll} /></Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Asset</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Category</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Assigned To</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Location</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Condition</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Status</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder}>Value</Th>
                  <Th fontSize="10px" color="gray.400" fontWeight="700" borderColor={cardBorder} textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedAssets.map((asset) => {
                  const CatIcon = getCategoryIcon(asset.category);
                  return (
                    <Tr key={asset._id} cursor="pointer" onClick={() => openAssetDetail(asset)}
                      _hover={{ bg: tableHoverBg }} transition="background 0.12s">
                      <Td borderColor={cardBorder} onClick={e => e.stopPropagation()}>
                        <Checkbox colorScheme="green" isChecked={selectedAssetIds.has(asset._id)} onChange={e => handleSelectToggle(asset._id, e)} />
                      </Td>
                      <Td borderColor={cardBorder} py={3}>
                        <HStack spacing={3}>
                          <Flex
                            w="38px"
                            h="38px"
                            align="center"
                            justify="center"
                            bg="white"
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="lg"
                            flexShrink={0}
                            overflow="hidden"
                          >
                            <Box
                              as="img"
                              src={getAssetMockImage(asset)}
                              alt={asset.name}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          </Flex>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="800" color={headingColor} noOfLines={1}>{asset.name}</Text>
                            <Text fontSize="9px" color="gray.400">{asset.nameTag} · #{asset._id?.slice(-4)}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td borderColor={cardBorder}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" fontWeight="600" color="gray.600">{asset.category}</Text>
                          <Text fontSize="9px" color="gray.400">{asset.assets || "Tangible"}</Text>
                        </VStack>
                      </Td>
                      <Td borderColor={cardBorder}>
                        <HStack spacing={2}>
                          <Avatar size="xs" name={asset.assignedTo} bg={GREEN_ACCENT} color="white" fontSize="9px" />
                          <Text fontSize="xs" fontWeight="700" color="gray.700" noOfLines={1}>{asset.assignedTo || "Unassigned"}</Text>
                        </HStack>
                      </Td>
                      <Td borderColor={cardBorder}><Text fontSize="xs" color="gray.600">{asset.location}</Text></Td>
                      <Td borderColor={cardBorder}>
                        <Badge colorScheme={conditionColor(asset.condition || "Good")} borderRadius="lg" px={2.5} py={0.5} fontSize="9px" fontWeight="800">{asset.condition || "Good"}</Badge>
                      </Td>
                      <Td borderColor={cardBorder}>
                        <HStack spacing={1.5}>
                          <Box w="7px" h="7px" borderRadius="full" bg={statusDotColor(asset.status)} />
                          <Text fontSize="xs" fontWeight="600" color="gray.600">{asset.status}</Text>
                        </HStack>
                      </Td>
                      <Td borderColor={cardBorder}><Text fontSize="xs" fontWeight="800" color="gray.700">ETB {Number(asset.amount || 0).toLocaleString()}</Text></Td>
                      <Td borderColor={cardBorder} textAlign="right" onClick={e => e.stopPropagation()}>
                        <Menu size="sm">
                          <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" borderRadius="lg" />
                          <MenuList borderRadius="xl" shadow="lg" minW="140px">
                            <MenuItem icon={<FiEdit />} onClick={() => openAssetDetail(asset)} fontSize="xs" fontWeight="600">View Details</MenuItem>
                            <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteAsset(asset._id)} fontSize="xs" fontWeight="600">Delete</MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        ) : (
          /* ── GRID VIEW ── */
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4} p={5}>
            {paginatedAssets.map(asset => {
              const CatIcon = getCategoryIcon(asset.category);
              return (
                <Box key={asset._id} p={4} bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="2xl" shadow="sm" cursor="pointer" onClick={() => openAssetDetail(asset)}
                  _hover={{ borderColor: GREEN_ACCENT, shadow: "md", transform: "translateY(-2px)" }} transition="all 0.2s">
                  <VStack spacing={3} align="center">
                    <Flex
                      w="64px"
                      h="64px"
                      align="center"
                      justify="center"
                      bg="white"
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="xl"
                      overflow="hidden"
                    >
                      <Box
                        as="img"
                        src={getAssetMockImage(asset)}
                        alt={asset.name}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                      />
                    </Flex>
                    <Text fontSize="sm" fontWeight="800" color={headingColor} textAlign="center" noOfLines={1}>{asset.name}</Text>
                    <Text fontSize="10px" color="gray.400" fontWeight="600">{asset.nameTag}</Text>
                    <HStack spacing={1}>
                      <Badge colorScheme={conditionColor(asset.condition || "Good")} fontSize="8px" borderRadius="md">{asset.condition || "Good"}</Badge>
                      <Badge colorScheme={asset.status === "Active" ? "green" : asset.status === "Under Maintenance" ? "orange" : "gray"} fontSize="8px" borderRadius="md">{asset.status}</Badge>
                    </HStack>
                    <HStack spacing={1.5}>
                      <Avatar size="2xs" name={asset.assignedTo} bg={GREEN_ACCENT} color="white" />
                      <Text fontSize="10px" color="gray.500" fontWeight="600">{asset.assignedTo || "Unassigned"}</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="800" color={headingColor}>ETB {Number(asset.amount || 0).toLocaleString()}</Text>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        {/* ── Pagination ── */}
        {filteredAssets.length > 0 && (
          <Flex px={5} py={3.5} justify="space-between" align="center" flexWrap="wrap" gap={3} borderTop="1px solid" borderColor={cardBorder} bg={subtleBg}>
            <HStack spacing={2} fontSize="xs" fontWeight="700" color="gray.500">
              <Text>Rows per page</Text>
              <Select size="xs" w="65px" borderRadius="lg" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </Select>
              <Text color="gray.400">
                {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredAssets.length)} of {filteredAssets.length}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <IconButton icon={<FiChevronLeft />} size="xs" variant="outline" isDisabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} borderRadius="lg" aria-label="Previous page" />
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 7) { pageNum = i + 1; }
                else if (currentPage <= 4) { pageNum = i + 1; }
                else if (currentPage >= totalPages - 3) { pageNum = totalPages - 6 + i; }
                else { pageNum = currentPage - 3 + i; }
                return (
                  <Button key={pageNum} size="xs" variant={currentPage === pageNum ? "solid" : "ghost"} colorScheme={currentPage === pageNum ? "green" : "gray"}
                    onClick={() => setCurrentPage(pageNum)} borderRadius="lg" minW="28px" fontWeight="700">{pageNum}</Button>
                );
              })}
              <IconButton icon={<FiChevronRight />} size="xs" variant="outline" isDisabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} borderRadius="lg" aria-label="Next page" />
            </HStack>
          </Flex>
        )}
      </Box>

      <Drawer isOpen={isDetailOpen} onClose={onDetailClose} placement="right" size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.3)" backdropFilter="blur(4px)" />
        <DrawerContent borderLeftRadius="none" maxW={{ base: "100%", md: "500px" }} w="full" bg={useColorModeValue("white", "gray.900")}>

          {/* ─── Drawer Header ─── */}
          <Box bg="#0f2d1e" color="white" px={{ base: 4, md: 5 }} py={3.5} borderTopLeftRadius="none">
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={0.5} flex={1}>
                <HStack spacing={2} align="center">
                  <Text fontWeight="800" fontSize="11px" textTransform="uppercase" letterSpacing="0.05em" color="green.300">Asset details</Text>
                  {detailAsset && (
                    <Badge
                      variant="solid"
                      bg="green.500"
                      color="white"
                      borderRadius="md"
                      px={1.5}
                      py={0.2}
                      fontSize="8px"
                      fontWeight="800"
                    >
                      {detailAsset.nameTag}
                    </Badge>
                  )}
                </HStack>
                {detailAsset && (
                  <Text fontWeight="800" fontSize="md" color="white" lineHeight="1.1">
                    {detailAsset.name}
                  </Text>
                )}
              </VStack>
              <HStack spacing={1}>
                <Menu size="sm">
                  <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" color="white" _hover={{ bg: "whiteAlpha.200" }} borderRadius="lg" aria-label="Actions" />
                  <MenuList borderRadius="xl" color="gray.800" shadow="lg" minW="140px">
                    <MenuItem icon={<FiEdit />} onClick={() => { setAssetToEdit(detailAsset); onCreateOpen(); }}>Edit Asset</MenuItem>
                    <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteAsset(detailAsset?._id)}>Delete</MenuItem>
                  </MenuList>
                </Menu>
                <DrawerCloseButton position="static" color="white" size="sm" m={0} />
              </HStack>
            </Flex>
          </Box>

          <DrawerBody px={4} py={3.5} bg={drawerBodyBg} overflowY="auto">
            {detailAsset && (
              <VStack spacing={3.5} align="stretch">

                {/* ─── Hero Block ─── */}
                <Box p={0}>
                  <Flex justify="space-between" align={{ base: "start", sm: "center" }} gap={3} flexDir={{ base: "column", sm: "row" }}>
                    <HStack spacing={3} flex={1} align="center">
                      {/* Asset Image Mockup */}
                      <Flex
                        w="70px"
                        h="70px"
                        align="center"
                        justify="center"
                        bg="white"
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="xl"
                        shadow="xs"
                        flexShrink={0}
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          as="img"
                          src={getAssetMockImage(detailAsset)}
                          alt={detailAsset.name}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                        />
                      </Flex>

                      <VStack align="start" spacing={0.5}>
                        <Text fontSize="md" fontWeight="800" color={headingColor} lineHeight="1.2">{detailAsset.name}</Text>
                        <Text fontSize="xs" color="gray.400" fontWeight="600" isTruncated maxW="150px">{detailAsset.description || "Dell OptiPlex 7090"}</Text>

                        <HStack spacing={1.5} mt={0.5} flexWrap="wrap">
                          <Badge fontSize="8px" fontWeight="700" colorScheme="gray" borderRadius="md" px={1.5} py={0.5} variant="subtle">
                            {detailAsset.category}
                          </Badge>
                          <Badge fontSize="8px" fontWeight="700" colorScheme="gray" borderRadius="md" px={1.5} py={0.5} variant="outline">
                            {detailAsset.assets || "Tangible"}
                          </Badge>
                          <HStack spacing={1} pl={1}>
                            <Box w="5px" h="5px" borderRadius="full" bg={statusDotColor(detailAsset.status)} />
                            <Text fontSize="8px" fontWeight="700" color="gray.500">{detailAsset.status}</Text>
                          </HStack>
                        </HStack>

                        <Button
                          size="xs"
                          variant="link"
                          color={GREEN_ACCENT}
                          _hover={{ textDecoration: "underline" }}
                          leftIcon={<FiCamera />}
                          fontSize="9px"
                          fontWeight="800"
                          pt={1}
                          onClick={() => {
                            if (showImageOptions) {
                              stopCamera();
                            }
                            setShowImageOptions(!showImageOptions);
                          }}
                        >
                          Change photo
                        </Button>
                      </VStack>
                    </HStack>

                    {/* Circular Health Gauge */}
                    <HStack spacing={3} align="center" flexShrink={0} w={{ base: "full", sm: "auto" }} justify={{ base: "space-between", sm: "flex-end" }} pt={{ base: 2, sm: 0 }} borderTop={{ base: "1px dashed", sm: "none" }} borderColor={cardBorder}>
                      <Text fontSize="10px" fontWeight="700" color="gray.450" display={{ base: "block", sm: "none" }}>Asset Health</Text>
                      <HStack spacing={2}>
                        <CircularProgress value={calcAssetHealth(detailAsset)} color={GREEN_ACCENT} size="48px" thickness="8px" trackColor={progressTrackColor}>
                          <CircularProgressLabel fontSize="9px" fontWeight="800" color={headingColor} lineHeight="1">
                            {calcAssetHealth(detailAsset)}%
                          </CircularProgressLabel>
                        </CircularProgress>
                        <Text fontSize="9px" fontWeight="700" color="gray.450" display={{ base: "none", sm: "block" }}>Healthy</Text>
                      </HStack>
                    </HStack>
                  </Flex>

                  {/* Dynamic Image Upload & Camera Capture Console */}
                  {showImageOptions && (
                    <Box p={3.5} mt={3.5} border="1px dashed" borderColor={cardBorder} bg={docItemBg} borderRadius="none">
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontSize="10px" fontWeight="800" color={headingColor}>UPDATE ASSET PHOTO</Text>
                        <IconButton
                          size="xs"
                          icon={<FiX />}
                          variant="ghost"
                          onClick={() => { stopCamera(); setShowImageOptions(false); }}
                          aria-label="Close image options"
                        />
                      </Flex>

                      <VStack spacing={3} align="stretch">
                        {isCameraActive ? (
                          <VStack spacing={2.5} align="center" bg="black" p={2} borderRadius="none">
                            <video
                              ref={videoRef}
                              style={{ width: '100%', maxHeight: '180px', backgroundColor: 'black' }}
                              playsInline
                              muted
                            />
                            <HStack spacing={2.5}>
                              <Button size="xs" colorScheme="green" borderRadius="none" onClick={capturePhoto} leftIcon={<FiCamera />}>
                                Capture Photo
                              </Button>
                              <Button size="xs" variant="outline" borderRadius="none" color="white" borderColor="whiteAlpha.400" _hover={{ bg: "whiteAlpha.100" }} onClick={stopCamera}>
                                Cancel
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={2.5} align="stretch">
                            <SimpleGrid columns={3} spacing={2}>
                              <Button
                                size="xs"
                                variant="outline"
                                borderRadius="none"
                                leftIcon={<FiUploadCloud />}
                                onClick={() => document.getElementById('asset-image-file-input').click()}
                                fontSize="9px"
                                fontWeight="750"
                              >
                                Upload File
                              </Button>
                              <input
                                type="file"
                                id="asset-image-file-input"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                              />

                              <Button
                                size="xs"
                                variant="outline"
                                borderRadius="none"
                                leftIcon={<FiVideo />}
                                onClick={startCamera}
                                fontSize="9px"
                                fontWeight="750"
                              >
                                Live Camera
                              </Button>

                              <Button
                                size="xs"
                                variant="outline"
                                borderRadius="none"
                                leftIcon={<FiLink />}
                                onClick={() => {
                                  const url = window.prompt("Paste direct image URL/Link:");
                                  if (url !== null) handleSaveAssetImage(url);
                                }}
                                fontSize="9px"
                                fontWeight="750"
                              >
                                URL Link
                              </Button>
                            </SimpleGrid>
                          </VStack>
                        )}
                      </VStack>
                    </Box>
                  )}

                  {/* Quick Action Buttons */}
                  <Flex gap={2.5} mt={4} flexDir={{ base: "column", sm: "row" }} w="full">
                    <Button
                      size="sm"
                      bg={GREEN_ACCENT}
                      color="white"
                      _hover={{ bg: GREEN_HOVER }}
                      borderRadius="none"
                      leftIcon={<FiEdit />}
                      fontSize="xs"
                      fontWeight="700"
                      flex={1}
                      onClick={() => { setAssetToEdit(detailAsset); onCreateOpen(); }}
                    >
                      Edit asset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor={cardBorder}
                      borderRadius="none"
                      fontSize="xs"
                      fontWeight="700"
                      flex={1}
                      _hover={{ bg: buttonHoverBg }}
                      onClick={() => { setTransferFrom(detailAsset.assignedTo); onTransferOpen(); fetchUsers(); }}
                    >
                      Transfer
                    </Button>
                  </Flex>
                </Box>

                {/* ─── Warranty Warning Alert ─── */}
                {detailAsset.warrantyExpiry && (
                  <Alert
                    status="warning"
                    borderRadius="none"
                    bg="orange.50"
                    border="1px solid"
                    borderColor="orange.150"
                    py={1.5}
                    px={3}
                  >
                    <AlertIcon color="orange.500" boxSize={3.5} />
                    <Flex direction={{ base: "column", sm: "row" }} align={{ base: "start", sm: "center" }} justify="space-between" gap={2} w="full">
                      <Text fontSize="10px" fontWeight="700" color="orange.800" flex={1}>
                        {(() => {
                          const diffDays = Math.round((new Date(detailAsset.warrantyExpiry).getTime() - Date.now()) / 86400000);
                          return diffDays > 0
                            ? `Warranty expires in ${diffDays} days`
                            : "Warranty has expired";
                        })()}
                      </Text>
                      <Button size="xs" variant="link" color="orange.700" fontWeight="800" fontSize="10px" rightIcon={<FiChevronRight />} mt={{ base: 0.5, sm: 0 }}>
                        Review warranty
                      </Button>
                    </Flex>
                  </Alert>
                )}

                {/* ─── Tabs ─── */}
                <Tabs index={activeTab} onChange={setActiveTab} colorScheme="green" variant="line" isFitted>
                  <TabList borderBottomWidth="1px" borderColor={cardBorder} mb={3.5}>
                    {["Overview", "Assignment", "Maintenance", "Details", "Activity"].map(tab => (
                      <Tab key={tab} fontSize={{ base: "10px", sm: "11px" }} fontWeight="750" py={2} px={1} color="gray.500" _selected={{ color: GREEN_ACCENT, borderBottomColor: GREEN_ACCENT }}>
                        {tab}
                      </Tab>
                    ))}
                  </TabList>

                  <TabPanels>
                    {/* ─── Overview Tab ─── */}
                    <TabPanel p={0}>
                      <VStack spacing={4} align="stretch">

                        {/* 1. Asset Information Card */}
                        <Box bg={cardBg} px={4} py={3} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3}>Asset information</Text>
                          <SimpleGrid columns={2} spacing={0} position="relative">
                            {/* Column 1 */}
                            <VStack align="stretch" spacing={2} pr={4}>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Serial number</Text>
                                <Text fontSize="10px" fontWeight="800" color={headingColor}>{detailAsset.nameTag}</Text>
                              </Flex>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Category</Text>
                                <Text fontSize="10px" fontWeight="800" color={headingColor}>{detailAsset.category}</Text>
                              </Flex>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Condition</Text>
                                <HStack spacing={1}>
                                  <Box w="5px" h="5px" borderRadius="full" bg={detailAsset.condition === "New" || detailAsset.condition === "Good" ? "green.500" : (detailAsset.condition === "Poor" || detailAsset.condition === "Damaged" ? "red.500" : "orange.400")} />
                                  <Text fontSize="10px" fontWeight="800" color={headingColor}>{detailAsset.condition || "Good"}</Text>
                                </HStack>
                              </Flex>
                            </VStack>

                            {/* Vertical Divider */}
                            <Box position="absolute" left="50%" top="0" bottom="0" borderLeft="1px solid" borderColor="gray.150" />

                            {/* Column 2 */}
                            <VStack align="stretch" spacing={2} pl={4}>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Quantity</Text>
                                <Text fontSize="10px" fontWeight="800" color={headingColor}>1</Text>
                              </Flex>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Purchase value</Text>
                                <Text fontSize="10px" fontWeight="800" color={headingColor}>ETB {Number(detailAsset.amount || 0).toLocaleString()}</Text>
                              </Flex>
                              <Flex justify="space-between" align="center">
                                <Text fontSize="10px" color="gray.450" fontWeight="500">Acquired on</Text>
                                <Text fontSize="10px" fontWeight="800" color={headingColor}>
                                  {detailAsset.dateAcquired ? new Date(detailAsset.dateAcquired).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </Text>
                              </Flex>
                            </VStack>
                          </SimpleGrid>
                          {detailAsset.description && (
                            <VStack align="start" spacing={0.5} borderTop="1px solid" borderColor={cardBorder} pt={2.5} mt={2.5}>
                              <Text fontSize="9px" color="gray.450" fontWeight="600">Description</Text>
                              <Text fontSize="10.5px" fontWeight="700" color={headingColor}>
                                {detailAsset.description}
                              </Text>
                            </VStack>
                          )}
                        </Box>

                        {/* 2. Current Assignment Card */}
                        <Box bg={cardBg} px={4} py={3.5} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3}>Current assignment</Text>

                          <Flex align="center" justify="space-between" flexWrap="nowrap">
                            <HStack spacing={3}>
                              <Avatar size="sm" name={detailAsset.assignedTo || "Unassigned"} bg={GREEN_ACCENT} color="white" fontWeight="800" fontSize="xs" />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontWeight="800" color={headingColor}>{detailAsset.assignedTo || "Unassigned"}</Text>
                                <Text fontSize="10px" color="gray.450" fontWeight="600">Sales Department</Text>
                              </VStack>
                            </HStack>

                            {/* Vertical Line Separator */}
                            <Box borderLeft="1px solid" borderColor="gray.150" h="28px" mx={4} />

                            <VStack align="start" spacing={0} flexShrink={0}>
                              <Text fontSize="10px" color="gray.450" fontWeight="600">Assigned on</Text>
                              <Text fontSize="11px" fontWeight="800" color={headingColor}>
                                {detailAsset.dateAcquired ? new Date(detailAsset.dateAcquired).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                              </Text>
                            </VStack>
                          </Flex>

                          <Flex justify="space-between" align="center" mt={3} pt={2.5} borderTop="1px solid" borderColor="gray.100">
                            <HStack spacing={1}>
                              <Text fontSize="10px" color="gray.450" fontWeight="600">Location</Text>
                              <Text fontSize="11px" fontWeight="850" color={headingColor}>{detailAsset.location || "Room 802"}</Text>
                            </HStack>
                            <Button variant="link" color={GREEN_ACCENT} fontSize="11.5px" fontWeight="800" rightIcon={<FiChevronRight />}>
                              View employee
                            </Button>
                          </Flex>
                        </Box>

                        {/* 3. Lifecycle & Service Card */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Lifecycle & service</Text>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} spacingY={3.5} spacingX={4}>
                            <VStack align="start" spacing={0.5}>
                              <Text fontSize="10px" color="gray.400" fontWeight="600">Next service</Text>
                              <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="800" color={headingColor}>
                                  {detailAsset.dateAcquired ? new Date(new Date(detailAsset.dateAcquired).getTime() + 180 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </Text>
                                <Icon as={FiCalendar} color="gray.400" boxSize={3} />
                              </HStack>
                            </VStack>
                            <VStack align="start" spacing={0.5}>
                              <Text fontSize="10px" color="gray.400" fontWeight="600">Last audit</Text>
                              <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="800" color={headingColor}>
                                  {detailAsset.dateAcquired ? new Date(detailAsset.dateAcquired).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </Text>
                                <Icon as={FiCalendar} color="gray.400" boxSize={3} />
                              </HStack>
                            </VStack>
                            <VStack align="start" spacing={0.5}>
                              <Text fontSize="10px" color="gray.400" fontWeight="600">Warranty expiry</Text>
                              <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="800" color={headingColor}>
                                  {detailAsset.warrantyExpiry ? new Date(detailAsset.warrantyExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No warranty set"}
                                </Text>
                                <Icon as={FiAlertCircle} color={detailAsset.warrantyExpiry ? "orange.400" : "gray.400"} boxSize={3} />
                              </HStack>
                            </VStack>
                            <VStack align="start" spacing={0.5}>
                              <Text fontSize="10px" color="gray.400" fontWeight="600">Depreciation</Text>
                              <Text fontSize="xs" fontWeight="800" color={headingColor}>Straight-line</Text>
                            </VStack>
                          </SimpleGrid>
                        </Box>

                        {/* 4. Side-by-Side: Documents & QR Scan Code */}
                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3.5}>

                          {/* Documents Card */}
                          <Flex direction="column" justify="space-between" bg={cardBg} p={3.5} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm" minH="125px">
                            <Box>
                              <Text fontSize="xs" fontWeight="800" color={headingColor} mb={2.5}>Documents</Text>
                              <Flex align="center" gap={2}>
                                <Flex w="28px" h="28px" align="center" justify="center" bg="gray.100" borderRadius="none" color="gray.500">
                                  <Icon as={FiFile} boxSize={3.5} />
                                </Flex>
                                <VStack align="start" spacing={0} maxW="110px">
                                  <Text fontSize="9px" fontWeight="800" color={headingColor} lineHeight="1.2" noOfLines={1}>Invoice & handover</Text>
                                  <Text fontSize="8px" color="gray.400">3 of 4 uploaded</Text>
                                </VStack>
                              </Flex>
                            </Box>

                            <Box mt={2}>
                              <Progress value={75} colorScheme="green" size="xs" borderRadius="none" mb={2} />
                              <Button variant="link" color={GREEN_ACCENT} fontSize="10px" fontWeight="800" rightIcon={<FiChevronRight />}>
                                View documents
                              </Button>
                            </Box>
                          </Flex>

                          {/* Scan QR Card */}
                          <Flex direction="column" align="center" justify="center" bg={cardBg} p={3.5} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm" minH="125px" textAlign="center">
                            <Text fontSize="10px" fontWeight="800" color={headingColor} mb={1.5} w="full" textAlign="left">Scan asset tag</Text>

                            {/* Visual QR Code Generator representation */}
                            <Flex
                              p={1.5}
                              bg="white"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="none"
                              w="54px"
                              h="54px"
                              align="center"
                              justify="center"
                              shadow="xs"
                            >
                              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                                <rect x="2" y="2" width="6" height="6" />
                                <rect x="16" y="2" width="6" height="6" />
                                <rect x="2" y="16" width="6" height="6" />
                                <path d="M16 16h2v2h-2zm4 4h2v2h-2zm0-4h2v2h-2zm-4 4h2v2h-2z" />
                                <path d="M12 4h2v2h-2zm0 6h2v2h-2zm0 6h2v2h-2zm-6-4h2v2H6zm10 0h2v2h-2z" />
                              </svg>
                            </Flex>

                            <Text fontSize="8px" color="gray.400" fontWeight="600" mt={1.5}>QR Code Tag ID</Text>
                          </Flex>
                        </SimpleGrid>

                      </VStack>
                    </TabPanel>

                    {/* ─── Other Tabs: Rendered individually ─── */}
                    {/* Assignment */}
                    <TabPanel p={0} pt={4}>
                      <VStack spacing={4.5} align="stretch">

                        {/* Reassign card */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Reassign asset ownership</Text>
                          <VStack spacing={4} align="stretch">
                            {/* Custom User Select Dropdown with avatars */}
                            <FormControl>
                              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Employee Name</FormLabel>
                              <Menu matchWidth>
                                <MenuButton
                                  as={Button}
                                  w="full"
                                  size="sm"
                                  variant="outline"
                                  borderColor="gray.200"
                                  borderRadius="none"
                                  textAlign="left"
                                  px={3}
                                  fontWeight="700"
                                  bg="white"
                                  _hover={{ bg: "gray.50" }}
                                  rightIcon={<FiChevronDown />}
                                >
                                  <HStack spacing={2}>
                                    <Avatar size="2xs" name={editAssignedTo || "Unassigned"} src={allUsers.find(u => u.username === editAssignedTo)?.photoURL} bg={GREEN_ACCENT} color="white" />
                                    <Text fontSize="xs" isTruncated>{editAssignedTo || "Unassigned"}</Text>
                                  </HStack>
                                </MenuButton>
                                <MenuList borderRadius="none" shadow="md" maxH="240px" overflowY="auto" p={1} borderColor="gray.200" zIndex={10}>
                                  <MenuItem
                                    fontSize="xs"
                                    fontWeight="700"
                                    onClick={() => setEditAssignedTo("")}
                                    borderRadius="none"
                                  >
                                    <HStack spacing={2}>
                                      <Avatar size="2xs" name="Unassigned" bg="gray.300" />
                                      <Text>Unassigned</Text>
                                    </HStack>
                                  </MenuItem>
                                  {allUsers
                                    .filter(u => u.status === "active")
                                    .sort((a, b) => a.username.localeCompare(b.username))
                                    .map(u => (
                                      <MenuItem
                                        key={u._id}
                                        fontSize="xs"
                                        fontWeight="700"
                                        onClick={() => setEditAssignedTo(u.username)}
                                        borderRadius="none"
                                        bg={editAssignedTo === u.username ? "green.50" : "transparent"}
                                        _hover={{ bg: "gray.50" }}
                                      >
                                        <HStack spacing={2}>
                                          <Avatar size="2xs" name={u.username} src={u.photoURL} bg={GREEN_ACCENT} color="white" />
                                          <Text>{u.username}</Text>
                                        </HStack>
                                      </MenuItem>
                                    ))
                                  }
                                </MenuList>
                              </Menu>
                            </FormControl>

                            {/* Location & Condition side-by-side */}
                            <SimpleGrid columns={2} spacing={3.5}>
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Location / Room</FormLabel>
                                <Input size="sm" borderRadius="none" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. Room 802" />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Asset Condition</FormLabel>
                                <Select size="sm" borderRadius="none" value={editCondition} onChange={e => setEditCondition(e.target.value)} fontWeight="700">
                                  <option value="Damaged">Damaged</option>
                                  <option value="Good">Good</option>
                                  <option value="Need Maintenance">Need Maintenance</option>
                                  <option value="New">New</option>
                                  <option value="Poor">Poor</option>
                                  <option value="Under Maintenance">Under Maintenance</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            <Button
                              size="sm"
                              bg={GREEN_ACCENT}
                              color="white"
                              _hover={{ bg: GREEN_HOVER }}
                              borderRadius="none"
                              fontSize="xs"
                              fontWeight="700"
                              isLoading={isSaving}
                              onClick={handleSaveAssetDetails}
                              w="full"
                              mt={1.5}
                            >
                              Assign & Save Update
                            </Button>
                          </VStack>
                        </Box>

                        {/* Assignment History timeline */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Assignment History</Text>

                          {detailAsset.assignmentHistory && detailAsset.assignmentHistory.length > 0 ? (
                            <VStack align="stretch" spacing={4} position="relative" pl={2}>
                              {/* Left timeline dashed connector */}
                              <Box position="absolute" left="15px" top="10px" bottom="10px" borderLeft="2px dashed" borderColor="gray.200" />

                              {detailAsset.assignmentHistory.map((hist, idx) => (
                                <HStack key={idx} spacing={4} align="start" position="relative">
                                  {/* User initials circle mark */}
                                  <Avatar
                                    size="xs"
                                    name={hist.assignedTo}
                                    bg="gray.400"
                                    color="white"
                                    fontWeight="800"
                                    fontSize="9px"
                                    zIndex={2}
                                  />

                                  <VStack align="start" spacing={0.5} flex={1}>
                                    <Flex justify="space-between" align="center" w="full">
                                      <Text fontSize="xs" fontWeight="800" color={headingColor}>{hist.assignedTo}</Text>
                                      <Badge
                                        colorScheme={conditionColor(hist.condition)}
                                        fontSize="8px"
                                        borderRadius="none"
                                        px={1.5}
                                      >
                                        {hist.condition || "Good"}
                                      </Badge>
                                    </Flex>
                                    <Text fontSize="10px" color="gray.450" fontWeight="600">
                                      {hist.location || "N/A"}
                                    </Text>
                                    <Text fontSize="9px" color="gray.400">
                                      {new Date(hist.dateFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - {new Date(hist.dateTo).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </Text>
                                  </VStack>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="10px" color="gray.400" fontStyle="italic">
                              No previous assignment history recorded for this asset.
                            </Text>
                          )}
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Maintenance */}
                    <TabPanel p={0} pt={4}>
                      <VStack spacing={4.5} align="stretch">

                        {/* Status & Condition Box */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Service & Maintenance Log</Text>
                          <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={2} spacing={3.5}>
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Lifecycle Status</FormLabel>
                                <Select size="sm" borderRadius="none" value={editStatus} onChange={e => setEditStatus(e.target.value)} fontWeight="700">
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                  <option value="Under Maintenance">Under Maintenance</option>
                                </Select>
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Condition Grade</FormLabel>
                                <Select size="sm" borderRadius="none" value={editCondition} onChange={e => setEditCondition(e.target.value)} fontWeight="700">
                                  <option value="Damaged">Damaged</option>
                                  <option value="Good">Good</option>
                                  <option value="Need Maintenance">Need Maintenance</option>
                                  <option value="New">New</option>
                                  <option value="Poor">Poor</option>
                                  <option value="Under Maintenance">Under Maintenance</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            <Button
                              size="sm"
                              bg={GREEN_ACCENT}
                              color="white"
                              _hover={{ bg: GREEN_HOVER }}
                              borderRadius="none"
                              fontSize="xs"
                              fontWeight="700"
                              isLoading={isSaving}
                              onClick={handleSaveAssetDetails}
                              w="full"
                              mt={1}
                            >
                              Update Status & Condition
                            </Button>
                          </VStack>
                        </Box>

                        {/* Add Service Entry Box */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Log new service entry</Text>
                          <VStack spacing={3.5} align="stretch">
                            <FormControl>
                              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Issue / Action Done</FormLabel>
                              <Input size="sm" borderRadius="none" value={logAction} onChange={e => setLogAction(e.target.value)} placeholder="e.g. Replaced laptop battery" />
                            </FormControl>

                            <SimpleGrid columns={2} spacing={3.5}>
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Service Cost (ETB)</FormLabel>
                                <Input size="sm" type="number" borderRadius="none" value={logCost} onChange={e => setLogCost(e.target.value)} placeholder="e.g. 2500" />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Technician / Vendor</FormLabel>
                                <Input size="sm" borderRadius="none" value={logTechnician} onChange={e => setLogTechnician(e.target.value)} placeholder="e.g. Dell Service Center" />
                              </FormControl>
                            </SimpleGrid>

                            <Button
                              size="sm"
                              variant="outline"
                              borderColor={GREEN_ACCENT}
                              color={GREEN_ACCENT}
                              _hover={{ bg: "green.50" }}
                              borderRadius="none"
                              fontSize="xs"
                              fontWeight="700"
                              isLoading={isAddingLog}
                              onClick={handleAddMaintenanceLog}
                              w="full"
                            >
                              Add Service Log Entry
                            </Button>
                          </VStack>
                        </Box>

                        {/* Service Log Entries List */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Service History</Text>

                          {detailAsset.maintenanceLog && detailAsset.maintenanceLog.length > 0 ? (
                            <VStack align="stretch" spacing={3}>
                              {detailAsset.maintenanceLog.map((log, index) => (
                                <Flex
                                  key={log.id || index}
                                  p={3}
                                  bg={docItemBg}
                                  border="1px solid"
                                  borderColor={cardBorder}
                                  borderRadius="none"
                                  justify="space-between"
                                  align="center"
                                >
                                  <VStack align="start" spacing={0.5} flex={1}>
                                    <Text fontSize="xs" fontWeight="800" color={headingColor}>{log.action}</Text>
                                    <HStack spacing={2} fontSize="9px" color="gray.400" fontWeight="600">
                                      <Text>Cost: {fmtETB(log.cost)}</Text>
                                      <Text>•</Text>
                                      <Text>Vendor: {log.technician}</Text>
                                      <Text>•</Text>
                                      <Text>{new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                                    </HStack>
                                  </VStack>

                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    borderRadius="none"
                                    onClick={() => handleDeleteMaintenanceLog(log.id)}
                                    aria-label="Remove entry"
                                  />
                                </Flex>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="10px" color="gray.400" fontStyle="italic">
                              No service or maintenance history logged for this asset.
                            </Text>
                          )}
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Details */}
                    <TabPanel p={0} pt={4}>
                      <VStack spacing={4.5} align="stretch">

                        {/* Description Box */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3}>Asset specifications & description</Text>
                          <VStack spacing={3.5} align="stretch">
                            <FormControl>
                              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1.5}>Details Description</FormLabel>
                              <Textarea
                                size="sm"
                                borderRadius="none"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                placeholder="Describe the technical details of the asset (e.g. Core i7, 16GB RAM, 512GB SSD)..."
                                minH="80px"
                              />
                            </FormControl>
                            <Button
                              size="sm"
                              bg={GREEN_ACCENT}
                              color="white"
                              _hover={{ bg: GREEN_HOVER }}
                              borderRadius="none"
                              fontSize="xs"
                              fontWeight="700"
                              isLoading={isSaving}
                              onClick={handleSaveAssetDetails}
                              w="full"
                            >
                              Save Description
                            </Button>
                          </VStack>
                        </Box>

                        {/* Attach Document Form */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Attach spec details / document</Text>
                          <VStack spacing={3.5} align="stretch">
                            <SimpleGrid columns={2} spacing={3.5}>
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Detail Name / Title</FormLabel>
                                <Input size="sm" borderRadius="none" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Front Photo or Bill" />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Specification / Doc Type</FormLabel>
                                <Select size="sm" borderRadius="none" value={docType} onChange={e => setDocType(e.target.value)} fontWeight="700">
                                  <option value="Invoice">Invoice Document</option>
                                  <option value="Warranty Card">Warranty Card</option>
                                  <option value="User Manual">User Manual / Specs</option>
                                  <option value="Photo / Image">Photo / Image</option>
                                  <option value="Handover Protocol">Handover Protocol</option>
                                  <option value="Other">Other / Note</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            <FormControl>
                              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" mb={1}>Upload Spec File / Document (PDF, Word, Excel, etc.)</FormLabel>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  borderRadius="none"
                                  leftIcon={<FiUploadCloud />}
                                  onClick={() => document.getElementById('details-doc-file-input').click()}
                                  fontSize="xs"
                                  fontWeight="700"
                                  flex={1}
                                >
                                  {docUrl ? "Change Selected File" : "Choose File..."}
                                </Button>
                                <input
                                  type="file"
                                  id="details-doc-file-input"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    setDocName(file.name.split('.')[0]); // set name suggestion
                                    // Auto-detect type
                                    const ext = file.name.split('.').pop().toLowerCase();
                                    if (ext === 'pdf') setDocType("Invoice");
                                    else if (ext === 'doc' || ext === 'docx') setDocType("User Manual");
                                    else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) setDocType("Photo / Image");
                                    else setDocType("Other");

                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setDocUrl(event.target.result); // Base64 data string
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </HStack>
                              {docUrl && (
                                <Text fontSize="10px" color="green.600" fontWeight="700" mt={1.5}>
                                  ✓ File Loaded: {docName || "Attachment"} (Ready to attach)
                                </Text>
                              )}
                            </FormControl>

                            <Button
                              size="sm"
                              variant="outline"
                              borderColor={GREEN_ACCENT}
                              color={GREEN_ACCENT}
                              _hover={{ bg: "green.50" }}
                              borderRadius="none"
                              fontSize="xs"
                              fontWeight="700"
                              isLoading={isAddingDoc}
                              onClick={handleAddDocument}
                              w="full"
                              mt={1}
                            >
                              Attach Detail / Document
                            </Button>
                          </VStack>
                        </Box>

                        {/* Attached Files List */}
                        <Box bg={cardBg} p={4} borderRadius="none" border="1px solid" borderColor={cardBorder} shadow="sm">
                          <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Details & Attached Documents</Text>

                          {(() => {
                            const docs = Array.isArray(detailAsset.documents) ? detailAsset.documents : [];
                            const finalDocs = docs.length > 0 ? docs : [
                              { id: "mock1", name: "purchase_invoice.pdf", type: "Invoice", url: "", fileSize: "1.2 MB", uploadedAt: new Date(detailAsset.dateAcquired || "2026-01-01"), isMock: true },
                              { id: "mock2", name: "warranty_card.pdf", type: "Warranty Card", url: "", fileSize: "0.8 MB", uploadedAt: new Date(detailAsset.dateAcquired || "2026-01-01"), isMock: true },
                              { id: "mock3", name: "device_photo.png", type: "Photo / Image", url: getAssetMockImage(detailAsset), fileSize: "2.4 MB", uploadedAt: new Date(), isMock: true }
                            ];

                            return (
                              <VStack align="stretch" spacing={3}>
                                {finalDocs.map((doc) => {
                                  const isImg = doc.type === "Photo / Image" || (doc.url && doc.url.match(/\.(jpeg|jpg|gif|png)$/i));
                                  return (
                                    <Flex
                                      key={doc.id}
                                      p={3}
                                      bg={docItemBg}
                                      border="1px solid"
                                      borderColor={cardBorder}
                                      borderRadius="none"
                                      justify="space-between"
                                      align="center"
                                    >
                                      <HStack spacing={2.5} flex={1} align="center">
                                        {isImg && doc.url ? (
                                          <Flex w="40px" h="40px" bg="white" border="1px solid" borderColor={cardBorder} borderRadius="sm" overflow="hidden" align="center" justify="center" flexShrink={0}>
                                            <Box as="img" src={doc.url} alt={doc.name} objectFit="cover" w="100%" h="100%" />
                                          </Flex>
                                        ) : (
                                          <Icon as={FiFile} color="blue.500" boxSize={4} flexShrink={0} />
                                        )}

                                        <VStack align="start" spacing={0} flex={1}>
                                          <Text fontSize="xs" fontWeight="800" color={headingColor} isTruncated maxW="180px">
                                            {doc.name}
                                          </Text>
                                          <HStack spacing={1.5} fontSize="9px" color="gray.400" fontWeight="600" flexWrap="wrap">
                                            <Badge size="xs" fontSize="8px" colorScheme="blue" borderRadius="none" px={1}>{doc.type}</Badge>
                                            <Text>•</Text>
                                            <Text>{doc.fileSize}</Text>
                                            <Text>•</Text>
                                            <Text>{new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                                          </HStack>
                                        </VStack>
                                      </HStack>

                                      <HStack spacing={1}>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="blue"
                                          borderRadius="none"
                                          onClick={() => {
                                            if (doc.url) {
                                              window.open(doc.url, "_blank");
                                            } else {
                                              toast({ title: "Opening document...", description: `Downloading ${doc.name}`, status: "info" });
                                            }
                                          }}
                                        >
                                          {isImg ? "View Photo" : "Download"}
                                        </Button>
                                        {!doc.isMock && (
                                          <IconButton
                                            icon={<FiTrash2 />}
                                            size="xs"
                                            colorScheme="red"
                                            variant="ghost"
                                            borderRadius="none"
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            aria-label="Remove document"
                                          />
                                        )}
                                      </HStack>
                                    </Flex>
                                  );
                                })}
                              </VStack>
                            );
                          })()}
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Activity */}
                    <TabPanel p={0} pt={4}>
                      <Box bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={cardBorder} shadow="sm">
                        <Text fontSize="xs" fontWeight="800" color={headingColor} mb={3.5}>Activity timeline</Text>
                        <VStack align="stretch" spacing={3.5}>
                          {[
                            { title: "Asset record initialized", text: "Registered in inventory log", date: "Just now" },
                            { title: "Assigned owner updated", text: `Assigned to ${editAssignedTo || "Unassigned"}`, date: "2 days ago" },
                            { title: "Location relocated", text: `Relocated to ${editLocation || "Main Office"}`, date: "2 days ago" }
                          ].map((log, idx) => (
                            <Flex key={idx} gap={3}>
                              <Flex w="24px" h="24px" bg={GREEN_LIGHT} color={GREEN_ACCENT} align="center" justify="center" borderRadius="full" flexShrink={0} mt={0.5}>
                                <Icon as={FiActivity} boxSize={3} />
                              </Flex>
                              <VStack align="start" spacing={0} flex={1}>
                                <Text fontSize="xs" fontWeight="800" color={headingColor}>{log.title}</Text>
                                <Text fontSize="10px" color="gray.400" fontWeight="600">{log.text}</Text>
                                <Text fontSize="9px" color="gray.450" mt={0.5}>{log.date}</Text>
                              </VStack>
                            </Flex>
                          ))}
                        </VStack>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

              </VStack>
            )}
          </DrawerBody>

          {/* ─── Drawer Footer ─── */}
          <DrawerFooter borderTop="1px solid" borderColor={cardBorder} bg={drawerFooterBg} px={5} py={3.5} gap={2.5} borderBottomLeftRadius="2xl" flexDir={{ base: "column", sm: "row" }} h="auto">
            <Button size="sm" variant="outline" bg="white" color="gray.700" borderColor="gray.200" _hover={{ bg: "gray.50" }} leftIcon={<FiPrinter />} borderRadius="xl" fontSize="xs" fontWeight="700" onClick={() => window.print()} flex={1} w="full">
              Print label
            </Button>
            <Button size="sm" variant="outline" colorScheme="red" borderColor="red.200" color="red.500" _hover={{ bg: "red.50" }} borderRadius="xl" fontSize="xs" fontWeight="700" onClick={() => handleDeleteAsset(detailAsset?._id)} flex={1} w="full">
              Retire asset
            </Button>
            <Button size="sm" bg="#0d3f26" color="white" _hover={{ bg: "#092d1b" }} borderRadius="xl" fontSize="xs" fontWeight="700" isLoading={isSaving} onClick={handleSaveAssetDetails} flex={1} w="full">
              Save changes
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ═══ ADD/EDIT ASSET DRAWER ═══ */}
      <Drawer isOpen={isCreateOpen} placement="right" onClose={() => { onCreateClose(); setAssetToEdit(null); }} size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.2)" backdropFilter="blur(3px)" />
        <DrawerContent borderRadius="none">
          <DrawerCloseButton />
          <Box bg={GREEN_PRIMARY} color="white" px={5} py={4} borderRadius="none">
            <Text fontWeight="800" fontSize="md">{assetToEdit ? "Edit Asset Details" : "Add New Asset"}</Text>
            <Text fontSize="xs" color="whiteAlpha.700">
              {assetToEdit ? "Modify the properties of the asset below." : "Fill in the details below to register a new asset."}
            </Text>
          </Box>
          <DrawerBody>
            <AssetForm
              fetchAssets={fetchAssets}
              assetToEdit={assetToEdit}
              setAssetToEdit={setAssetToEdit}
              categories={categories.filter(c => c !== "All")}
              onSuccess={() => { onCreateClose(); setAssetToEdit(null); fetchAssets(); }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ═══ TRANSFER DRAWER ═══ */}
      <Drawer isOpen={isTransferOpen} placement="right" onClose={onTransferClose} size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.2)" backdropFilter="blur(3px)" />
        <DrawerContent borderRadius="none">
          <DrawerCloseButton />
          <Box bg={GREEN_PRIMARY} color="white" px={5} py={4} borderRadius="none">
            <Text fontWeight="800" fontSize="md">Asset Transfer Portal</Text>
            <Text fontSize="xs" color="whiteAlpha.700">Move all assets from one employee to another.</Text>
          </Box>
          <DrawerBody>
            <VStack spacing={5} align="stretch" py={4}>
              <FormControl isRequired><FormLabel fontWeight="700" fontSize="sm">From Employee</FormLabel>
                <Select placeholder="Select source" value={transferFrom} onChange={e => setTransferFrom(e.target.value)} borderRadius="xl">
                  {allUsers.sort((a, b) => a.username.localeCompare(b.username)).map(u => {
                    const count = assets.filter(a => a.assignedTo === u.username).length;
                    return <option key={u._id} value={u.username}>{u.username} ({count} assets)</option>;
                  })}
                </Select>
              </FormControl>
              {transferFrom && selectedUserAssets.length > 0 && (
                <Box p={3} bg={subtleBg} borderRadius="xl" maxH="180px" overflowY="auto" border="1px solid" borderColor={cardBorder}>
                  {selectedUserAssets.map(a => (
                    <Flex key={a._id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor={cardBorder} _last={{ border: "none" }}>
                      <VStack align="start" spacing={0}><Text fontSize="xs" fontWeight="800">{a.name}</Text><Text fontSize="9px" color="gray.400">{a.nameTag}</Text></VStack>
                      <Badge colorScheme={a.status === "Active" ? "green" : "gray"} fontSize="8px" borderRadius="md">{a.status}</Badge>
                    </Flex>
                  ))}
                </Box>
              )}
              {transferFrom && selectedUserAssets.length === 0 && (
                <Alert status="info" borderRadius="xl"><AlertIcon /><Text fontSize="xs">This employee has no assets assigned.</Text></Alert>
              )}
              <FormControl isRequired isDisabled={selectedUserAssets.length === 0}><FormLabel fontWeight="700" fontSize="sm">To Employee</FormLabel>
                <Select placeholder="Select recipient" value={transferTo} onChange={e => setTransferTo(e.target.value)} borderRadius="xl">
                  {allUsers.filter(u => u.status === "active" && u.username !== transferFrom).sort((a, b) => a.username.localeCompare(b.username)).map(u => <option key={u._id} value={u.username}>{u.username}</option>)}
                </Select>
              </FormControl>
              {transferFrom && transferTo && selectedUserAssets.length > 0 && (
                <Alert status="warning" borderRadius="xl"><AlertIcon /><Text fontSize="xs">This will transfer <strong>{selectedUserAssets.length}</strong> assets to <strong>{transferTo}</strong>.</Text></Alert>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter gap={2} borderTopWidth="1px" borderColor={cardBorder}>
            <Button bg={GREEN_ACCENT} color="white" _hover={{ bg: GREEN_HOVER }} onClick={handleExecuteTransfer} isLoading={isTransferring} isDisabled={!transferFrom || !transferTo || selectedUserAssets.length === 0} borderRadius="xl" fontWeight="700">Execute Transfer</Button>
            <Button variant="ghost" onClick={onTransferClose} isDisabled={isTransferring} borderRadius="xl">Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ═══ MANAGE CATEGORIES DRAWER ═══ */}
      <Drawer isOpen={isCatManagerOpen} placement="right" onClose={onCatManagerClose} size="xl" isLazy>
        <DrawerOverlay bg="rgba(0,0,0,0.2)" backdropFilter="blur(3px)" />
        <DrawerContent borderRadius="none">
          <DrawerCloseButton />
          <Box bg={GREEN_PRIMARY} color="white" px={5} py={4} borderRadius="none">
            <Text fontWeight="800" fontSize="md">Category Management Portal</Text>
            <Text fontSize="xs" color="whiteAlpha.700">Add, edit, delete, organize subcategories or merge inventory tags.</Text>
          </Box>
          <DrawerBody p={0} h="calc(100vh - 125px)" overflow="hidden">
            <Tabs isFitted colorScheme="teal" variant="enclosed" borderRadius="none" display="flex" flexDirection="column" h="100%">
              <TabList borderBottom="1px solid" borderColor={cardBorder} borderRadius="none" bg={subtleBg}>
                <Tab fontSize="xs" fontWeight="800" py={3} borderRadius="none" borderTop="none" borderLeft="none" borderRight="none">Catalog List</Tab>
                <Tab fontSize="xs" fontWeight="800" py={3} borderRadius="none" borderTop="none" borderLeft="none" borderRight="none">Add Category</Tab>
                <Tab fontSize="xs" fontWeight="800" py={3} borderRadius="none" borderTop="none" borderLeft="none" borderRight="none">Tree Builder</Tab>
              </TabList>
              <TabPanels p={5} flex={1} minH={0}>

                {/* ─── Tab 1: Category List & Edit ─── */}
                <TabPanel p={0} h="100%">
                  <VStack spacing={4} align="stretch" h="100%">
                    {editingCatId ? (
                      <Box p={4} border="1px solid" borderColor={GREEN_ACCENT} bg="green.50" mb={4} borderRadius="none">
                        <Text fontSize="xs" fontWeight="800" color={GREEN_PRIMARY} mb={3}>EDITING CATEGORY</Text>
                        <VStack spacing={3} align="stretch">
                          <FormControl isRequired>
                            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Category Name</FormLabel>
                            <Input size="sm" borderRadius="none" bg="white" value={editingCatName} onChange={e => setEditingCatName(e.target.value)} placeholder="e.g. Chair" />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Parent Category (Optional Sub-Category)</FormLabel>
                            <Select size="sm" borderRadius="none" bg="white" value={editingCatParent} onChange={e => setEditingCatParent(e.target.value)} placeholder="No Parent (Top-Level Category)">
                              {catalogCategories
                                .filter(c => c._id !== editingCatId && (!c.parent || (c.parent._id || c.parent) !== editingCatId))
                                .map(c => (
                                  <option key={c._id} value={c._id}>{getCategoryPath(c._id)}</option>
                                ))}
                            </Select>
                          </FormControl>
                          <HStack spacing={2} pt={1}>
                            <Button size="xs" bg={GREEN_ACCENT} color="white" _hover={{ bg: GREEN_HOVER }} borderRadius="none" isLoading={isSavingCategory} onClick={handleUpdateCategory} fontWeight="700">
                              SAVE CHANGES
                            </Button>
                            <Button size="xs" variant="outline" borderRadius="none" bg="white" onClick={() => setEditingCatId("")} fontWeight="700">
                              CANCEL
                            </Button>
                          </HStack>
                        </VStack>
                      </Box>
                    ) : null}

                    <Box display="flex" flexDirection="column">
                      <HStack justify="space-between" mb={3}>
                        <Text fontSize="xs" fontWeight="800" color={headingColor}>REGISTERED CATEGORIES TREE</Text>
                      </HStack>
                      <Box
                        border="1px solid"
                        borderColor={cardBorder}
                        overflowY="auto"
                        h="calc(100vh - 250px)"
                        css={{
                          "&::-webkit-scrollbar": { display: "none" },
                          msOverflowStyle: "none",
                          scrollbarWidth: "none"
                        }}
                      >
                        {resolvedCatalog.filter(cat => cat.path.toLowerCase().includes(drawerSearchTerm.toLowerCase())).length === 0 ? (
                          <Text fontSize="xs" p={4} color="gray.400" textAlign="center">No categories matched your search.</Text>
                        ) : (
                          resolvedCatalog.filter(cat => cat.path.toLowerCase().includes(drawerSearchTerm.toLowerCase())).map((cat, idx) => {
                            const count = categoryCounts[cat.path] || 0;
                            return (
                              <Flex key={cat._id} justify="space-between" align="center" px={4} py={2.5} borderBottom="1px solid" borderColor={cardBorder} _last={{ border: "none" }} bg={idx % 2 === 0 ? "white" : subtleBg}>
                                <VStack align="start" spacing={0.5}>
                                  <Text fontSize="xs" fontWeight="800" color="gray.700">{cat.path}</Text>
                                  {cat.parent && (
                                    <Badge size="xs" colorScheme="teal" borderRadius="none" fontSize="8px">
                                      Sub-Category
                                    </Badge>
                                  )}
                                </VStack>
                                <HStack spacing={3}>
                                  <Badge bg="gray.100" color="gray.700" borderRadius="none" fontSize="10px" px={2} py={0.5}>
                                    {count} asset{count !== 1 ? "s" : ""}
                                  </Badge>
                                  <HStack spacing={1}>
                                    <IconButton
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="teal"
                                      icon={<FiEdit />}
                                      borderRadius="none"
                                      onClick={() => {
                                        setEditingCatId(cat._id);
                                        setEditingCatName(cat.name);
                                        setEditingCatParent(cat.parent?._id || cat.parent || "");
                                      }}
                                      aria-label="Edit Category"
                                    />
                                    <IconButton
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="red"
                                      icon={<FiTrash2 />}
                                      borderRadius="none"
                                      onClick={() => handleDeleteCategory(cat._id)}
                                      aria-label="Delete Category"
                                    />
                                  </HStack>
                                </HStack>
                              </Flex>
                            );
                          })
                        )}
                      </Box>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* ─── Tab 2: Add Category / Sub-Category ─── */}
                <TabPanel p={0} h="100%">
                  <VStack
                    spacing={4}
                    align="stretch"
                    h="100%"
                    overflowY="auto"
                    css={{
                      "&::-webkit-scrollbar": { display: "none" },
                      msOverflowStyle: "none",
                      scrollbarWidth: "none"
                    }}
                  >
                    <Box p={4} border="1px solid" borderColor={cardBorder} bg={subtleBg} borderRadius="none">
                      <Text fontSize="xs" fontWeight="800" color={GREEN_PRIMARY} mb={3}>ADD NEW CATEGORY OR SUB-CATEGORY</Text>
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                          <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Category Name</FormLabel>
                          <Input size="sm" borderRadius="none" bg="white" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Chair, Monitor, Barista Cap" />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Parent Category (To Make It a Sub-Category)</FormLabel>
                          <Select size="sm" borderRadius="none" bg="white" value={newCatParent} onChange={e => setNewCatParent(e.target.value)} placeholder="No Parent (Top-Level Category)">
                            {resolvedCatalog.map(c => (
                              <option key={c._id} value={c._id}>{c.path}</option>
                            ))}
                          </Select>
                        </FormControl>
                        {newCatParent && (
                          <Alert status="info" borderRadius="none" py={2} px={3}>
                            <AlertIcon boxSize={3.5} />
                            <Text fontSize="10px">
                              This will register as a subcategory under <strong>{getCategoryPath(newCatParent)}</strong>.
                            </Text>
                          </Alert>
                        )}
                        <Button
                          bg={GREEN_ACCENT}
                          color="white"
                          _hover={{ bg: GREEN_HOVER }}
                          onClick={handleCreateCategory}
                          isLoading={isSavingCategory}
                          borderRadius="none"
                          size="sm"
                          fontSize="xs"
                          fontWeight="750"
                        >
                          REGISTER CATEGORY
                        </Button>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* ─── Tab 3: Drag & Drop Hierarchy Tree ─── */}
                <TabPanel p={0} h="100%">
                  <VStack spacing={4} align="stretch" h="100%">
                    <Box p={4} border="1px solid" borderColor={cardBorder} bg={subtleBg} borderRadius="none" h="100%" display="flex" flexDirection="column">
                      <Text fontSize="xs" fontWeight="800" color={GREEN_PRIMARY} mb={3} display="flex" alignItems="center" gap={1}>
                        <FiRefreshCw /> INTERACTIVE CATEGORY BUILDER
                      </Text>
                      <Text fontSize="xs" color="gray.500" mb={4}>
                        Drag categories from the catalog on the right and drop them onto top-level roots on the left to structure them.
                      </Text>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} flex={1} minH={0}>
                        {/* Left Column: Roots Hierarchy (Dropzones) */}
                        <VStack align="stretch" spacing={3} h="100%">
                          <Text fontSize="xs" fontWeight="800" color="gray.500">HIERARCHICAL ROOTS</Text>

                          <Box
                            p={3}
                            border="2px dashed"
                            borderColor={dragOverNode === 'root' ? "green.400" : "gray.200"}
                            bg={dragOverNode === 'root' ? "green.50" : "white"}
                            borderRadius="md"
                            textAlign="center"
                            onDragOver={(e) => handleTreeDragOver(e, 'root')}
                            onDragLeave={handleTreeDragLeave}
                            onDrop={(e) => handleTreeDrop(e, null, null)}
                            transition="all 0.2s"
                            cursor="pointer"
                          >
                            <Text fontSize="11px" fontWeight="800" color="gray.500">
                              Drop here to make Top-Level (Root)
                            </Text>
                          </Box>

                          <VStack
                            align="stretch"
                            spacing={1.5}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            p={2}
                            bg="white"
                            h="calc(100vh - 350px)"
                            overflowY="auto"
                            css={{
                              "&::-webkit-scrollbar": { display: "none" },
                              msOverflowStyle: "none",
                              scrollbarWidth: "none"
                            }}
                          >
                            {filteredTreeRoots.length === 0 ? (
                              <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>No categories match search.</Text>
                            ) : (
                              filteredTreeRoots.map(root => renderTreeNode(root, 0))
                            )}
                          </VStack>
                        </VStack>

                        {/* Right Column: Flat Draggable Catalog */}
                        <VStack align="stretch" spacing={3} h="100%">
                          <Text fontSize="xs" fontWeight="800" color="gray.500">CATEGORIES CATALOG (DRAGGABLES)</Text>

                          <VStack
                            align="stretch"
                            spacing={1.5}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            p={2}
                            bg="white"
                            h="calc(100vh - 290px)"
                            overflowY="auto"
                            css={{
                              "&::-webkit-scrollbar": { display: "none" },
                              msOverflowStyle: "none",
                              scrollbarWidth: "none"
                            }}
                          >
                            {resolvedCatalog.filter(cat => !cat.parent && cat.name.toLowerCase().includes(drawerSearchTerm.toLowerCase())).length === 0 ? (
                              <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>No categories found.</Text>
                            ) : (
                              resolvedCatalog.filter(cat => !cat.parent && cat.name.toLowerCase().includes(drawerSearchTerm.toLowerCase())).map(cat => {
                                const count = categoryCounts[cat.path] || 0;
                                const isBeingDragged = draggedNode?._id === cat._id;
                                return (
                                  <Flex
                                    key={cat._id}
                                    p={2.5}
                                    border="1px solid"
                                    borderColor="gray.100"
                                    bg="white"
                                    borderRadius="md"
                                    draggable
                                    onDragStart={(e) => handleTreeDragStart(e, cat)}
                                    opacity={isBeingDragged ? 0.4 : 1}
                                    cursor="grab"
                                    align="center"
                                    justify="space-between"
                                    _hover={{ bg: "gray.50" }}
                                    transition="all 0.15s"
                                  >
                                    <HStack spacing={2} pointerEvents={draggedNode ? "none" : "auto"}>
                                      <Icon as={FiFolder} color={GREEN_PRIMARY} />
                                      <Text fontSize="xs" fontWeight="700" color="gray.700" noOfLines={1}>
                                        {cat.name}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={2} pointerEvents={draggedNode ? "none" : "auto"}>
                                      <Badge bg="gray.100" color="gray.600" borderRadius="none" fontSize="9px">
                                        {count} asset{count !== 1 ? "s" : ""}
                                      </Badge>

                                      {/* Quick parent-reassign native select */}
                                      <Select
                                        size="xs"
                                        w="65px"
                                        h="20px"
                                        variant="outline"
                                        borderRadius="none"
                                        fontSize="9px"
                                        placeholder="Move"
                                        bg="white"
                                        borderColor="gray.200"
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value === "root") {
                                            handleTreeDrop(null, cat._id, null);
                                          } else if (e.target.value) {
                                            handleTreeDrop(null, cat._id, e.target.value);
                                          }
                                        }}
                                      >
                                        {cat.parent && <option value="root">Make Top-Level</option>}
                                        {resolvedCatalog
                                          .filter(c => c._id !== cat._id && (!c.parent || (c.parent._id || c.parent) !== cat._id))
                                          .map(c => (
                                            <option key={c._id} value={c._id}>
                                              {c.path}
                                            </option>
                                          ))}
                                      </Select>
                                    </HStack>
                                  </Flex>
                                );
                              })
                            )}
                          </VStack>
                        </VStack>
                      </SimpleGrid>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
          <DrawerFooter gap={3} borderTopWidth="1px" borderColor={cardBorder} bg={drawerFooterBg} justifyContent="space-between">
            <HStack spacing={2} flex={1}>
              <InputGroup size="sm" maxW="280px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search categories..."
                  borderRadius="none"
                  bg="white"
                  value={drawerSearchTerm}
                  onChange={(e) => setDrawerSearchTerm(e.target.value)}
                  pr="30px"
                />
                {drawerSearchTerm && (
                  <InputRightElement width="30px">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<FiX />}
                      onClick={() => setDrawerSearchTerm("")}
                      aria-label="Clear search"
                      minW="18px"
                      h="18px"
                      _hover={{ bg: "transparent", color: "gray.600" }}
                      color="gray.400"
                    />
                  </InputRightElement>
                )}
              </InputGroup>
              <Button
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                borderRadius="none"
                leftIcon={<FiGitBranch />}
                onClick={onTreeMapOpen}
                fontSize="xs"
                fontWeight="700"
                bg="white"
                _hover={{ bg: "gray.50" }}
              >
                View Structure Map
              </Button>
            </HStack>
            <Button variant="ghost" onClick={onCatManagerClose} borderRadius="none" size="sm">Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ═══ DELETE SAFETY MODAL ═══ */}
      <Modal isOpen={isDeleteSafetyOpen} onClose={onDeleteSafetyClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="lg" fontWeight="800" color="red.600">Action Required: Category in use</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="700">This category has {categoryToDelete?.count} asset(s).</Text>
                <Text fontSize="xs">You cannot delete a category that contains active assets. Please select a new category to transfer these assets into before completing the deletion.</Text>
              </VStack>
            </Alert>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="700" color="gray.700">Migrate Assets To</FormLabel>
              <Select
                placeholder="Select destination category"
                value={deleteMigrateTarget}
                onChange={e => setDeleteMigrateTarget(e.target.value)}
                borderRadius="md"
              >
                {categories.filter(c => c !== "All" && c !== categoryToDelete?.path).map(c => {
                  const count = assets.filter(a => a.category === c).length;
                  return <option key={c} value={c}>{c} ({count} assets)</option>;
                })}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100" gap={3}>
            <Button variant="ghost" onClick={onDeleteSafetyClose} borderRadius="lg" size="sm">Cancel</Button>
            <Button
              colorScheme="red"
              onClick={handleExecuteSafeDelete}
              isLoading={isSavingCategory}
              isDisabled={!deleteMigrateTarget}
              borderRadius="lg"
              size="sm"
              fontWeight="700"
            >
              Transfer & Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ═══ CATEGORY STRUCTURE MAP MODAL ═══ */}
      <Modal isOpen={isTreeMapOpen} onClose={onTreeMapClose} size="lg" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="800" color="gray.800" borderBottom="1px solid" borderColor="gray.100" display="flex" alignItems="center" gap={2}>
            <FiGitBranch color={GREEN_PRIMARY} /> OVERALL CATEGORIZED STRUCTURE MAP
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4} maxH="55vh" overflowY="auto">
            <VStack align="stretch" spacing={2}>
              {treeRoots.length === 0 ? (
                <Text fontSize="sm" color="gray.400" textAlign="center" py={8}>No categories registered yet.</Text>
              ) : (
                treeRoots.map(root => renderTreeMapNode(root, 0))
              )}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100" bg={subtleBg}>
            <Button size="sm" bg={GREEN_PRIMARY} color="white" _hover={{ bg: GREEN_HOVER }} onClick={onTreeMapClose} borderRadius="lg" fontWeight="700">
              Close Map
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AssetManagementPage;