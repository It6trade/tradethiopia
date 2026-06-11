import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Select,
  SimpleGrid,
  Switch,
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
import { AddIcon, CalendarIcon, CheckIcon, DownloadIcon, EditIcon, MinusIcon } from "@chakra-ui/icons";
import axios from "axios";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLayers,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaGoogle,
  FaInstagram,
  FaLinkedinIn,
  FaTelegramPlane,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import NoticeBoardPanel from "../NoticeBoardPanel";
import { EmptyStateBlock, MetricCard, SectionIntro, SurfaceCard } from "./SocialMediaPrimitives";

const initialTargets = [
  { platform: "Facebook", weeklyTarget: 5, posted: 3, actual: 3, completed: false },
  { platform: "Instagram", weeklyTarget: 5, posted: 4, actual: 4, completed: false },
  { platform: "LinkedIn", weeklyTarget: 3, posted: 2, actual: 2, completed: false },
  { platform: "TikTok", weeklyTarget: 4, posted: 1, actual: 1, completed: false },
  { platform: "Twitter (X)", weeklyTarget: 4, posted: 1, actual: 1, completed: false },
  { platform: "WhatsApp", weeklyTarget: 5, posted: 2, actual: 2, completed: false },
  { platform: "Telegram", weeklyTarget: 5, posted: 2, actual: 2, completed: false },
  { platform: "Google", weeklyTarget: 3, posted: 1, actual: 1, completed: false },
  { platform: "YouTube", weeklyTarget: 2, posted: 0, actual: 0, completed: false },
];

const calendarSlots = [
  { day: "Mon", slot: "9:00 AM", type: "Video", staff: "Ayele", approval: "Pending Review", topic: "Product", completed: false },
  { day: "Mon", slot: "2:00 PM", type: "Poster", staff: "Lily", approval: "Draft", topic: "Awareness", completed: false },
  { day: "Tue", slot: "11:00 AM", type: "Carousel", staff: "Martha", approval: "Scheduled", topic: "Company News", completed: false },
  { day: "Wed", slot: "4:00 PM", type: "Article", staff: "Hanna", approval: "Posted", topic: "Event", completed: true },
  { day: "Thu", slot: "10:00 AM", type: "Video", staff: "Dawit", approval: "Pending Review", topic: "Testimonial", completed: false },
  { day: "Fri", slot: "1:00 PM", type: "Poster", staff: "Lily", approval: "Draft", topic: "Awareness", completed: false },
];

const engagementMetrics = [
  { label: "Total Impressions", value: "124,831" },
  { label: "Engagement Rate", value: "5.6%" },
  { label: "Post Reach", value: "68,400" },
  { label: "Best Content", value: "Instagram Carousel (Onboarding)" },
];

const growthMetrics = [
  { label: "New Followers", value: "+1,420" },
  { label: "Followers by Platform", value: "FB 18k · IG 24k · LI 9k · TT 12k" },
  { label: "% vs Last Week", value: "+3.1%" },
];

const leadMetrics = [
  { label: "Leads Collected", value: "142" },
  { label: "Inquiries by Platform", value: "FB 60 · IG 45 · LI 20 · TT 17" },
  { label: "Conversion Rate", value: "18.4%" },
];

const reportCharts = [
  { label: "Posts vs Target", actual: 80, target: 100 },
  { label: "Engagement vs Target", actual: 65, target: 80 },
  { label: "Response Time vs Target", actual: 55, target: 70 },
];

const tabItems = [
  { key: "targets", label: "Weekly Targets" },
  { key: "planner", label: "Content Planner" },
  { key: "analytics", label: "Analytics" },
  { key: "reports", label: "Reports" },
  { key: "notice", label: "Notice Board" },
];

const statusToneMap = {
  Draft: { bg: "gray.100", color: "gray.700" },
  "Pending Review": { bg: "orange.100", color: "orange.700" },
  Scheduled: { bg: "blue.100", color: "blue.700" },
  Posted: { bg: "green.100", color: "green.700" },
};

const platformAccentMap = {
  Facebook: "blue",
  Instagram: "pink",
  LinkedIn: "linkedin",
  TikTok: "purple",
  "Twitter (X)": "gray",
  WhatsApp: "whatsapp",
  Telegram: "telegram",
  Google: "red",
  YouTube: "red",
};

const platformBrandMap = {
  Facebook: { icon: FaFacebookF, bg: "rgba(24,119,242,0.12)", color: "#1877F2" },
  Instagram: { icon: FaInstagram, bg: "rgba(225,48,108,0.12)", color: "#E1306C" },
  LinkedIn: { icon: FaLinkedinIn, bg: "rgba(10,102,194,0.12)", color: "#0A66C2" },
  TikTok: { icon: FaTiktok, bg: "rgba(15,23,42,0.08)", color: "#0F172A" },
  "Twitter (X)": { icon: FaTwitter, bg: "rgba(29,161,242,0.12)", color: "#1DA1F2" },
  WhatsApp: { icon: FaWhatsapp, bg: "rgba(37,211,102,0.12)", color: "#25D366" },
  Telegram: { icon: FaTelegramPlane, bg: "rgba(34,158,217,0.12)", color: "#229ED9" },
  Google: { icon: FaGoogle, bg: "rgba(234,67,53,0.12)", color: "#EA4335" },
  YouTube: { icon: FaYoutube, bg: "rgba(255,0,0,0.12)", color: "#FF0000" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const socialPlatformKpiSeeds = [
  { platform: "TikTok", videos: 7, graphics: 3, views: 48200, likes: 6400, shares: 920 },
  { platform: "Instagram", videos: 5, graphics: 8, views: 36500, likes: 5100, shares: 740 },
  { platform: "Facebook", videos: 4, graphics: 6, views: 28400, likes: 3200, shares: 480 },
  { platform: "YouTube", videos: 3, graphics: 1, views: 22100, likes: 1900, shares: 260 },
  { platform: "LinkedIn", videos: 2, graphics: 5, views: 12600, likes: 980, shares: 180 },
  { platform: "WhatsApp", videos: 2, graphics: 5, views: 18400, likes: 820, shares: 420 },
  { platform: "Telegram", videos: 2, graphics: 4, views: 15400, likes: 760, shares: 320 },
];

const getStatusInfo = (progress) => {
  if (progress === 100) return { status: "COMPLETED", colorScheme: "green" };
  if (progress >= 70) return { status: "ON TRACK", colorScheme: "green" };
  if (progress >= 30) return { status: "IN PROGRESS", colorScheme: "yellow" };
  if (progress >= 1) return { status: "NEEDS ATTENTION", colorScheme: "yellow" };
  return { status: "BEHIND", colorScheme: "red" };
};

const getProgressColorScheme = (progress) => {
  if (progress >= 70) return "green";
  if (progress >= 30) return "yellow";
  return "red";
};

const formatCompactNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const getMetricPeriod = (date) => {
  const current = new Date(date);
  return {
    month: current.toLocaleString("en-US", { month: "short" }),
    year: current.getFullYear(),
  };
};

const getWeekWindowForDate = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const mondayOffset = (day + 6) % 7;
  const weekStart = new Date(current);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(current.getDate() - mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    label: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
  };
};

const calculateKpiProgress = ({ videos, graphics, views, likes, shares }) => {
  const outputScore = (Number(videos || 0) + Number(graphics || 0)) * 4;
  const reachScore = Number(views || 0) / 1500;
  const engagementScore = (Number(likes || 0) + Number(shares || 0) * 2) / 180;
  return Math.max(0, Math.min(100, Math.round(outputScore + reachScore + engagementScore)));
};

const buildWeeklyKpisFromRecords = (records, date) => {
  const { weekStart, weekEnd } = getWeekWindowForDate(date);

  return socialPlatformKpiSeeds.map((seed) => {
    const match = records.find((item) => item.platform === seed.platform && item.weekStart === weekStart);
    const merged = {
      ...seed,
      ...match,
      platform: seed.platform,
      weekStart,
      weekEnd,
    };

    return {
      ...merged,
      progress: calculateKpiProgress(merged),
    };
  });
};

const buildTargetRowsFromActuals = (records, date) => {
  const { month, year } = getMetricPeriod(date);

  return initialTargets.map((seed) => {
    const match = records.find((record) => record.platform === seed.platform && record.month === month && Number(record.year) === Number(year));
    const actual = Number(match?.actual || 0);
    const target = Number(match?.target ?? seed.weeklyTarget ?? 0);
    const completed = target > 0 && actual >= target;

    return {
      platform: seed.platform,
      weeklyTarget: target,
      posted: actual,
      actual,
      completed,
      month,
      year,
    };
  });
};

const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};


const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const toInputDate = (date) => {
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const buildTargetRow = (target) => {
  const remaining = Math.max(target.weeklyTarget - target.posted, 0);
  const progress = target.weeklyTarget > 0 ? Math.min(100, Math.round((target.posted / target.weeklyTarget) * 100)) : 0;
  const statusInfo = getStatusInfo(progress);

  return {
    ...target,
    remaining,
    progress,
    status: target.completed ? "COMPLETED" : statusInfo.status,
    colorScheme: target.completed ? "green" : statusInfo.colorScheme,
  };
};

const reportInsightItems = [
  "Completed tasks are saved automatically into weekly report snapshots.",
  "Historical report entries remain intact across weekly resets.",
  "Saturday reporting keeps weekly submissions consistent and auditable.",
  "Local persistence preserves dashboards between sessions.",
];

const automationItems = [
  "Weekly targets reset when a new working week begins.",
  "Posted and actual counts return to zero for the next cycle.",
  "Content completion toggles reset for a fresh planning pass.",
  "Previous report snapshots remain available for reporting.",
];

const detailMetricColumns = [
  { title: "Engagement Metrics", items: engagementMetrics, accent: "blue", icon: FiActivity },
  { title: "Growth Metrics", items: growthMetrics, accent: "green", icon: FiTrendingUp },
  { title: "Lead Performance", items: leadMetrics, accent: "orange", icon: FiUsers },
];

const bulletStyle = { w: 2, h: 2, borderRadius: "full", bg: "blue.500", mt: 2, flexShrink: 0 };

const SocialMediaManager = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isKpiEditOpen, onOpen: onKpiEditOpen, onClose: onKpiEditClose } = useDisclosure();

  const surfaceBorder = useColorModeValue("rgba(226,232,240,0.9)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const softBg = useColorModeValue("rgba(248,250,252,0.78)", "whiteAlpha.50");
  const tableHover = useColorModeValue("rgba(248,250,252,0.98)", "rgba(255,255,255,0.05)");
  const tableHeaderBg = useColorModeValue("rgba(248,250,252,0.92)", "whiteAlpha.100");
  const tableRowBg = useColorModeValue("rgba(255,255,255,0.96)", "whiteAlpha.50");
  const tableRowShadow = useColorModeValue("0 2px 10px rgba(15,23,42,0.035)", "0 12px 28px rgba(0,0,0,0.18)");
  const tableRowHoverShadow = useColorModeValue("0 14px 34px rgba(15,23,42,0.08)", "0 18px 38px rgba(0,0,0,0.26)");
  const cardHighlight = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.28))"
  );
  const tabBg = useColorModeValue("rgba(255,255,255,0.84)", "rgba(15,23,42,0.68)");
  const progressTrackBg = useColorModeValue("rgba(226,232,240,0.86)", "whiteAlpha.100");
  const primaryButtonProps = {
    bg: "#2563EB",
    color: "white",
    boxShadow: "0 12px 24px rgba(37,99,235,0.22)",
    _hover: { bg: "#1D4ED8", transform: "translateY(-1px)", boxShadow: "0 16px 30px rgba(37,99,235,0.28)" },
    _active: { bg: "#1E40AF", transform: "translateY(0)" },
    _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.3)" },
  };
  const outlineButtonProps = {
    borderColor: surfaceBorder,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
    _hover: { bg: softBg, borderColor: "rgba(37,99,235,0.3)", transform: "translateY(-1px)" },
    _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" },
  };
  const tableShellProps = {
    borderRadius: "22px",
    borderWidth: "1px",
    borderColor: surfaceBorder,
    bg: useColorModeValue("rgba(255,255,255,0.72)", "whiteAlpha.50"),
    p: { base: 2, md: 3 },
  };
  const tableProps = {
    variant: "unstyled",
    sx: { borderCollapse: "separate", borderSpacing: "0 10px" },
  };
  const headCellProps = {
    px: 4,
    py: 3,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: muted,
    bg: tableHeaderBg,
    borderYWidth: "1px",
    borderColor: surfaceBorder,
    _first: { borderLeftWidth: "1px", borderLeftRadius: "16px" },
    _last: { borderRightWidth: "1px", borderRightRadius: "16px" },
  };
  const rowProps = {
    bg: tableRowBg,
    boxShadow: tableRowShadow,
    transition: "all 0.2s ease",
    _hover: { bg: tableHover, transform: "translateY(-1px)", boxShadow: tableRowHoverShadow },
  };
  const cellProps = {
    px: 4,
    py: 4,
    borderYWidth: "1px",
    borderColor: surfaceBorder,
    _first: { borderLeftWidth: "1px", borderLeftRadius: "18px" },
    _last: { borderRightWidth: "1px", borderRightRadius: "18px" },
  };

  const [weeklyTargets, setWeeklyTargets] = useState(initialTargets);
  const [socialActuals, setSocialActuals] = useState([]);
  const [weeklyKpiRecords, setWeeklyKpiRecords] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState("");
  const [savingPlatform, setSavingPlatform] = useState("");
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [savingKpiPlatform, setSavingKpiPlatform] = useState("");
  const [posts, setPosts] = useState(() => {
    const savedPosts = localStorage.getItem("posts");
    return savedPosts ? JSON.parse(savedPosts) : calendarSlots;
  });
  const [weeklyReports] = useState(() => {
    const savedReports = localStorage.getItem("weeklyReports");
    return savedReports ? JSON.parse(savedReports) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newPost, setNewPost] = useState({
    day: "Mon",
    slot: "9:00 AM",
    type: "Video",
    staff: "",
    approval: "Draft",
    topic: "",
    completed: false,
  });
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editForm, setEditForm] = useState({ weeklyTarget: 0, actual: 0 });
  const [editingKpiPlatform, setEditingKpiPlatform] = useState("");
  const [kpiForm, setKpiForm] = useState({ videos: 0, graphics: 0, views: 0, likes: 0, shares: 0 });

  const monthOptions = ["All", ...MONTHS];
  const currentYear = new Date().getFullYear();
  const yearOptions = [String(currentYear - 1), String(currentYear), String(currentYear + 1)];
  const [reportMonth, setReportMonth] = useState(MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(currentYear));
  const [reportDate, setReportDate] = useState(toInputDate(new Date()));

  useEffect(() => {
    try {
      localStorage.setItem("posts", JSON.stringify(posts));
      localStorage.setItem("weeklyReports", JSON.stringify(weeklyReports));
    } catch (error) {
      console.warn("Failed to persist social media data", error);
    }
  }, [posts, weeklyReports]);

  useEffect(() => {
    setWeeklyTargets(buildTargetRowsFromActuals(socialActuals, selectedDate));
  }, [selectedDate, socialActuals]);

  const weekRange = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const calculatedTargets = useMemo(() => weeklyTargets.map(buildTargetRow), [weeklyTargets]);
  const completedTargets = useMemo(() => weeklyTargets.filter((target) => target.completed), [weeklyTargets]);

  const reportEntries = useMemo(() => {
    return weeklyReports.filter((report) => {
      const rawDate = report.date || report.createdAt || report.updatedAt;
      const entryDate = rawDate ? new Date(rawDate) : new Date();
      if (Number.isNaN(entryDate.getTime())) return false;
      const entryMonth = entryDate.toLocaleString("en-US", { month: "short" });
      const entryYear = entryDate.getFullYear();
      const monthMatch = reportMonth === "All" ? true : entryMonth === reportMonth;
      const yearMatch = Number(reportYear) === entryYear;
      const dayMatch = reportDate ? toInputDate(entryDate) === reportDate : true;
      return monthMatch && yearMatch && dayMatch;
    });
  }, [reportDate, reportMonth, reportYear, weeklyReports]);

  const reportSummary = useMemo(() => {
    const totalTarget = reportEntries.reduce((sum, report) => sum + (report.weeklyTarget || 0), 0);
    const totalActual = reportEntries.reduce((sum, report) => sum + (report.actual || 0), 0);
    const delta = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
    const periodLabel = reportMonth === "All" ? "All months" : `${reportMonth} ${reportYear}`;
    const dateLabel = reportDate ? formatDate(reportDate) : null;
    return { totalTasks: reportEntries.length, totalTarget, totalActual, delta, periodLabel, dateLabel };
  }, [reportDate, reportEntries, reportMonth, reportYear]);

  const plannerStats = useMemo(() => {
    const total = posts.length;
    const completed = posts.filter((post) => post.completed).length;
    const pendingReview = posts.filter((post) => post.approval === "Pending Review").length;
    const scheduled = posts.filter((post) => post.approval === "Scheduled").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pendingReview, scheduled, completionRate };
  }, [posts]);

  const dashboardSummary = useMemo(() => {
    const totalTarget = calculatedTargets.reduce((sum, row) => sum + row.weeklyTarget, 0);
    const totalPosted = calculatedTargets.reduce((sum, row) => sum + row.posted, 0);
    const totalActual = calculatedTargets.reduce((sum, row) => sum + row.actual, 0);
    const completedPlatforms = calculatedTargets.filter((row) => row.completed).length;
    const completionRate = totalTarget ? Math.round((totalPosted / totalTarget) * 100) : 0;
    const delta = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
    return { totalTarget, totalPosted, totalActual, completedPlatforms, completionRate, delta };
  }, [calculatedTargets]);

  const finalReportData = useMemo(() => {
    const totalTarget = completedTargets.reduce((sum, target) => sum + target.weeklyTarget, 0);
    const totalPosted = completedTargets.reduce((sum, target) => sum + target.posted, 0);
    const totalActual = completedTargets.reduce((sum, target) => sum + target.actual, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalPosted / totalTarget) * 100) : 0;
    return { totalTarget, totalPosted, totalActual, overallProgress };
  }, [completedTargets]);

  const kpiCards = [
    {
      label: "Output against target",
      value: `${dashboardSummary.totalPosted} / ${dashboardSummary.totalTarget}`,
      subtext: `${dashboardSummary.completedPlatforms} platform${dashboardSummary.completedPlatforms === 1 ? "" : "s"} completed this week`,
      icon: FiLayers,
      accent: "blue",
      trend: { label: `${dashboardSummary.completionRate}% completion`, positive: dashboardSummary.completionRate >= 70 },
      progress: dashboardSummary.completionRate,
    },
    {
      label: "Content planner health",
      value: `${plannerStats.pendingReview} pending`,
      subtext: `${plannerStats.scheduled} scheduled · ${plannerStats.completed} completed`,
      icon: FiCalendar,
      accent: "orange",
      trend: { label: plannerStats.pendingReview > 0 ? "Needs review" : "Queue healthy", positive: plannerStats.pendingReview === 0 },
      progress: plannerStats.completionRate,
    },
    {
      label: "Engagement rate",
      value: "5.6%",
      subtext: "Likes, comments, shares, saves",
      icon: FiTrendingUp,
      accent: "green",
      trend: { label: "+0.8% vs last week", positive: true },
      progress: 72,
    },
    {
      label: "Lead generation",
      value: dashboardSummary.totalActual || 142,
      subtext: "Organic + paid conversions tracked",
      icon: FiUsers,
      accent: "purple",
      trend: { label: `${reportSummary.totalTasks} archived reports`, positive: reportSummary.totalTasks > 0 },
      progress: Math.min(100, Math.max(18, finalReportData.overallProgress || 54)),
    },
  ];

  const currentWeeklyKpis = useMemo(() => buildWeeklyKpisFromRecords(weeklyKpiRecords, selectedDate), [selectedDate, weeklyKpiRecords]);

  const kpiHistoryRows = useMemo(() => {
    return [...weeklyKpiRecords]
      .sort((left, right) => {
        if (right.weekStart !== left.weekStart) return right.weekStart.localeCompare(left.weekStart);
        return left.platform.localeCompare(right.platform);
      })
      .map((item) => ({
        ...item,
        progress: calculateKpiProgress(item),
      }));
  }, [weeklyKpiRecords]);

  useEffect(() => {
    const fetchSocialActuals = async () => {
      try {
        setTargetsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/social-actuals`);
        const docs = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setSocialActuals(docs);
        setTargetsError("");
      } catch (error) {
        console.error("Failed to load social target data", error);
        setTargetsError("Failed to load social media target data from the backend.");
      } finally {
        setTargetsLoading(false);
      }
    };

    fetchSocialActuals();
  }, []);

  useEffect(() => {
    const fetchWeeklyKpis = async () => {
      try {
        setKpiLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/social-weekly-kpis`);
        const docs = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setWeeklyKpiRecords(docs);
        setKpiError("");
      } catch (error) {
        console.error("Failed to load weekly KPI data", error);
        setKpiError("Failed to load weekly KPI data from the backend.");
      } finally {
        setKpiLoading(false);
      }
    };

    fetchWeeklyKpis();
  }, []);

  const upsertSocialActualState = (nextDoc) => {
    setSocialActuals((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.platform === nextDoc.platform && item.month === nextDoc.month && Number(item.year) === Number(nextDoc.year)
      );
      if (existingIndex === -1) return [...prev, nextDoc];
      const next = [...prev];
      next[existingIndex] = nextDoc;
      return next;
    });
  };

  const upsertWeeklyKpiState = (nextDoc) => {
    setWeeklyKpiRecords((prev) => {
      const existingIndex = prev.findIndex((item) => item.platform === nextDoc.platform && item.weekStart === nextDoc.weekStart);
      if (existingIndex === -1) return [...prev, nextDoc];
      const next = [...prev];
      next[existingIndex] = nextDoc;
      return next;
    });
  };

  const saveSocialTarget = async ({ platform, target, actual }) => {
    const { month, year } = getMetricPeriod(selectedDate);
    setSavingPlatform(platform);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/social-actuals`, {
        platform,
        target,
        actual,
        month,
        year,
      });

      upsertSocialActualState(response.data);
      setTargetsError("");
      return response.data;
    } catch (error) {
      console.error("Failed to save social target", error);
      const message = error.response?.data?.message || "Failed to save social media target data.";
      setTargetsError(message);
      throw error;
    } finally {
      setSavingPlatform("");
    }
  };

  const saveWeeklyKpi = async ({ platform, videos, graphics, views, likes, shares }) => {
    const { weekStart } = getWeekWindowForDate(selectedDate);
    setSavingKpiPlatform(platform);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/social-weekly-kpis`, {
        platform,
        date: weekStart,
        videos,
        graphics,
        views,
        likes,
        shares,
      });

      upsertWeeklyKpiState(response.data);
      setKpiError("");
      return response.data;
    } catch (error) {
      console.error("Failed to save weekly KPI", error);
      const message = error.response?.data?.message || "Failed to save weekly KPI data.";
      setKpiError(message);
      throw error;
    } finally {
      setSavingKpiPlatform("");
    }
  };

  const handleEditOpen = (row) => {
    setEditingPlatform(row.platform);
    setEditForm({ weeklyTarget: row.weeklyTarget, actual: row.actual });
    onEditOpen();
  };

  const handleKpiEditOpen = (item) => {
    setEditingKpiPlatform(item.platform);
    setKpiForm({
      videos: Number(item.videos || 0),
      graphics: Number(item.graphics || 0),
      views: Number(item.views || 0),
      likes: Number(item.likes || 0),
      shares: Number(item.shares || 0),
    });
    onKpiEditOpen();
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: Number.isNaN(value) ? 0 : value }));
  };

  const handleEditClose = () => {
    setEditingPlatform(null);
    setEditForm({ weeklyTarget: 0, actual: 0 });
    onEditClose();
  };

  const handleKpiEditClose = () => {
    setEditingKpiPlatform("");
    setKpiForm({ videos: 0, graphics: 0, views: 0, likes: 0, shares: 0 });
    onKpiEditClose();
  };

  const handleKpiFormChange = (field, value) => {
    setKpiForm((prev) => ({ ...prev, [field]: Number.isNaN(value) ? 0 : value }));
  };

  const handleEditSave = async () => {
    if (!editingPlatform) return;
    const normalizedTarget = Math.max(0, Number(editForm.weeklyTarget) || 0);
    const normalizedActual = Math.max(0, Number(editForm.actual) || 0);
    try {
      await saveSocialTarget({ platform: editingPlatform, target: normalizedTarget, actual: normalizedActual });
      toast({ title: "Targets updated", status: "success", duration: 3000, isClosable: true });
      handleEditClose();
    } catch {
      toast({ title: "Save failed", description: "Backend update did not complete.", status: "error", duration: 3500, isClosable: true });
    }
  };

  const handleKpiSave = async () => {
    if (!editingKpiPlatform) return;

    try {
      await saveWeeklyKpi({
        platform: editingKpiPlatform,
        videos: Math.max(0, Number(kpiForm.videos) || 0),
        graphics: Math.max(0, Number(kpiForm.graphics) || 0),
        views: Math.max(0, Number(kpiForm.views) || 0),
        likes: Math.max(0, Number(kpiForm.likes) || 0),
        shares: Math.max(0, Number(kpiForm.shares) || 0),
      });
      toast({ title: "Weekly KPI updated", status: "success", duration: 3000, isClosable: true });
      handleKpiEditClose();
    } catch {
      toast({ title: "Save failed", description: "Weekly KPI update did not complete.", status: "error", duration: 3500, isClosable: true });
    }
  };

  const adjustTarget = async (platform, delta) => {
    const currentRow = weeklyTargets.find((row) => row.platform === platform);
    if (!currentRow) return;

    const nextTarget = Math.max(0, currentRow.weeklyTarget + delta);

    try {
      await saveSocialTarget({ platform, target: nextTarget, actual: currentRow.actual });
    } catch {
      toast({ title: "Update failed", description: `Could not update ${platform} target.`, status: "error", duration: 3500, isClosable: true });
    }
  };

  const completeTask = async (platform) => {
    const currentRow = weeklyTargets.find((row) => row.platform === platform);
    if (!currentRow) return;

    try {
      await saveSocialTarget({
        platform,
        target: currentRow.weeklyTarget,
        actual: Math.max(currentRow.actual, currentRow.weeklyTarget),
      });
      toast({ title: "Platform completed", status: "success", duration: 3000, isClosable: true });
    } catch {
      toast({ title: "Complete failed", description: `Could not mark ${platform} as complete.`, status: "error", duration: 3500, isClosable: true });
    }
  };

  const reopenTask = async (platform) => {
    const currentRow = weeklyTargets.find((row) => row.platform === platform);
    if (!currentRow) return;

    const reopenedActual = currentRow.weeklyTarget > 0 ? Math.max(0, Math.min(currentRow.actual, currentRow.weeklyTarget - 1)) : 0;

    try {
      await saveSocialTarget({
        platform,
        target: currentRow.weeklyTarget,
        actual: reopenedActual,
      });
      toast({ title: "Platform reopened", status: "success", duration: 3000, isClosable: true });
    } catch {
      toast({ title: "Reopen failed", description: `Could not reopen ${platform}.`, status: "error", duration: 3500, isClosable: true });
    }
  };

  const togglePostCompletion = (index) => {
    setPosts((prev) => prev.map((post, currentIndex) => (currentIndex === index ? { ...post, completed: !post.completed } : post)));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPost = () => {
    setPosts((prev) => [...prev, newPost]);
    setNewPost({
      day: "Mon",
      slot: "9:00 AM",
      type: "Video",
      staff: "",
      approval: "Draft",
      topic: "",
      completed: false,
    });
    onClose();
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  return (
    <VStack align="stretch" spacing={6}>
      <SurfaceCard bgImage={cardHighlight} display="none">
        <Box p={{ base: 5, md: 6 }}>
          <SectionIntro
            eyebrow="Performance command center"
            title="Operate social campaigns with more signal and less clutter"
            description="Track weekly targets, keep the planner moving, monitor analytics, and preserve reports without changing your underlying workflow."
            actions={[
              <Button key="export" leftIcon={<DownloadIcon />} variant="outline" borderRadius="16px" {...outlineButtonProps}>
                Export Report
              </Button>,
              <Button key="post" leftIcon={<CalendarIcon />} borderRadius="16px" onClick={onOpen} {...primaryButtonProps}>
                New Post
              </Button>,
            ]}
          />

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={5}>
            <Box borderRadius="18px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={4} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted} fontWeight="700">
                Week Window
              </Text>
              <Heading size="md" mt={2}>
                {formatDate(weekRange.start)} – {formatDate(weekRange.end)}
              </Heading>
              <Text mt={2} color={muted}>
                Reporting automatically aligns to the active weekly schedule.
              </Text>
            </Box>
            <Box borderRadius="18px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={4} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted} fontWeight="700">
                Weekly Velocity
              </Text>
              <Heading size="md" mt={2}>
                {dashboardSummary.completionRate}% completed
              </Heading>
              <Progress mt={3} value={dashboardSummary.completionRate} colorScheme="blue" size="sm" borderRadius="full" />
              <Text mt={2} color={muted}>
                {dashboardSummary.totalPosted} delivered from {dashboardSummary.totalTarget} planned posts.
              </Text>
            </Box>
            <Box borderRadius="18px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={4} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted} fontWeight="700">
                Reporting Delta
              </Text>
              <Heading size="md" mt={2} color={dashboardSummary.delta >= 0 ? "green.500" : "orange.500"}>
                {dashboardSummary.delta.toFixed(1)}%
              </Heading>
              <Text mt={2} color={muted}>
                Actual output versus weekly target across all active platforms.
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
      </SurfaceCard>

      <Alert
        display="none"
        status="info"
        borderRadius="18px"
        borderWidth="1px"
        borderColor={surfaceBorder}
        bg={useColorModeValue("rgba(255,255,255,0.85)", "rgba(17,24,39,0.82)")}
        boxShadow={useColorModeValue("0 12px 36px rgba(15,23,42,0.06)", "0 18px 42px rgba(0,0,0,0.25)")}
      >
        <AlertIcon />
        <Box>
          <AlertTitle>Weekly automation is active</AlertTitle>
          <AlertDescription>
            Targets and planner completion reset on a new week, while archived weekly reports remain available.
          </AlertDescription>
        </Box>
      </Alert>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5} display="none">
        {kpiCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </SimpleGrid>

      <Tabs variant="unstyled">
        <TabList
          display="none"
          p="6px"
          borderRadius="18px"
          borderWidth="1px"
          borderColor={surfaceBorder}
          bg={tabBg}
          overflowX="auto"
          gap={2}
        >
          {tabItems.map((item) => (
            <Tab
              key={item.key}
              flex={1}
              minW={{ base: "160px", md: "unset" }}
              h="44px"
              borderRadius="14px"
              fontWeight="600"
              color="gray.500"
              transition="background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease"
              _hover={{ bg: "rgba(255,255,255,0.72)", color: "#0F172A" }}
              _selected={{
                bg: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                color: "#0F172A",
                boxShadow: "0 12px 28px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
              _dark={{
                color: "gray.300",
                _selected: {
                  bg: "whiteAlpha.160",
                  color: "white",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
                },
              }}
              _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
            >
              {item.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels mt={0}>
          <TabPanel px={0}>
            <SurfaceCard>
              <Box p={{ base: 5, md: 6 }}>
                <SectionIntro
                  eyebrow="Operations"
                  title="Weekly platform targets"
                  description="Premium visibility over target attainment, remaining capacity, and completion status across each channel."
                  actions={[
                    <FormControl key="week" maxW={{ base: "100%", md: "240px" }}>
                      <FormLabel mb={2} fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                        Active week
                      </FormLabel>
                      <Input type="date" value={toInputDate(selectedDate)} onChange={handleDateChange} borderRadius="16px" borderColor={surfaceBorder} />
                    </FormControl>,
                  ]}
                />

                {targetsError ? (
                  <Alert status="error" mt={5} borderRadius="18px" borderWidth="1px" borderColor={surfaceBorder}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Backend sync issue</AlertTitle>
                      <AlertDescription>{targetsError}</AlertDescription>
                    </Box>
                  </Alert>
                ) : null}

                {kpiError ? (
                  <Alert status="error" mt={5} borderRadius="18px" borderWidth="1px" borderColor={surfaceBorder}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Weekly KPI sync issue</AlertTitle>
                      <AlertDescription>{kpiError}</AlertDescription>
                    </Box>
                  </Alert>
                ) : null}

                <Tabs variant="unstyled" mt={6}>
                  <TabList
                    p="6px"
                    borderRadius="18px"
                    borderWidth="1px"
                    borderColor={surfaceBorder}
                    bg={tabBg}
                    overflowX="auto"
                    gap={2}
                  >
                    {["This Week KPI", "History"].map((item) => (
                      <Tab
                        key={item}
                        minW={{ base: "150px", md: "180px" }}
                        h="44px"
                        borderRadius="14px"
                        fontWeight="700"
                        color="gray.500"
                        transition="background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease"
                        _hover={{ bg: "rgba(255,255,255,0.72)", color: "#0F172A" }}
                        _selected={{
                          bg: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                          color: "#0F172A",
                          boxShadow: "0 12px 28px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
                        }}
                        _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
                      >
                        {item}
                      </Tab>
                    ))}
                  </TabList>

                  <TabPanels mt={5}>
                    <TabPanel px={0} py={0}>
                      <Flex
                        mb={5}
                        gap={4}
                        align={{ base: "stretch", md: "center" }}
                        justify="space-between"
                        direction={{ base: "column", md: "row" }}
                      >
                        <Box>
                          <Text fontSize="sm" fontWeight="700" color="#0F172A">
                            Weekly KPI filter
                          </Text>
                          <Text fontSize="sm" color={muted}>
                            Showing KPI cards for {getWeekWindowForDate(selectedDate).label}
                          </Text>
                        </Box>
                        <FormControl maxW={{ base: "100%", md: "220px" }}>
                          <FormLabel mb={2} fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                            Filter by date
                          </FormLabel>
                          <Input type="date" value={toInputDate(selectedDate)} onChange={handleDateChange} borderRadius="16px" borderColor={surfaceBorder} />
                        </FormControl>
                      </Flex>

                      {kpiLoading ? (
                        <SurfaceCard>
                          <Box p={5}>
                            <Text fontSize="sm" color={muted}>
                              Loading weekly KPI cards for the selected week...
                            </Text>
                          </Box>
                        </SurfaceCard>
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
                          {currentWeeklyKpis.map((item) => {
                          const brand = platformBrandMap[item.platform] || { icon: FiLayers, bg: "blue.50", color: "blue.600" };
                          const colorScheme = getProgressColorScheme(item.progress);

                          return (
                            <SurfaceCard key={`${item.platform}-${item.weekStart}`} cursor="pointer" onClick={() => handleKpiEditOpen(item)}>
                              <Box p={5}>
                                <Flex justify="space-between" align="flex-start" gap={4}>
                                  <HStack spacing={3}>
                                    <Flex
                                      w="46px"
                                      h="46px"
                                      align="center"
                                      justify="center"
                                      borderRadius="16px"
                                      bg={brand.bg}
                                      color={brand.color}
                                      flexShrink={0}
                                    >
                                      <Icon as={brand.icon} boxSize={5} />
                                    </Flex>
                                    <Box>
                                      <Text fontWeight="800">{item.platform}</Text>
                                      <Text fontSize="sm" color={muted}>
                                        Video, likes, views, shares
                                      </Text>
                                    </Box>
                                  </HStack>
                                  <VStack spacing={2} align="end">
                                    <Badge colorScheme={colorScheme} borderRadius="full" px={3} py={1}>
                                      {item.progress}%
                                    </Badge>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      leftIcon={<EditIcon />}
                                      borderRadius="12px"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleKpiEditOpen(item);
                                      }}
                                      isLoading={savingKpiPlatform === item.platform}
                                      {...outlineButtonProps}
                                    >
                                      Edit
                                    </Button>
                                  </VStack>
                                </Flex>

                                <SimpleGrid columns={2} spacing={3} mt={5}>
                                  <Box borderRadius="16px" bg={softBg} p={3}>
                                    <HStack spacing={2} color={muted}>
                                      <Icon as={FiActivity} />
                                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                                        Views
                                      </Text>
                                    </HStack>
                                    <Text mt={1} fontSize="xl" fontWeight="800">
                                      {formatCompactNumber(item.views)}
                                    </Text>
                                  </Box>
                                  <Box borderRadius="16px" bg={softBg} p={3}>
                                    <HStack spacing={2} color={muted}>
                                      <Icon as={FiTrendingUp} />
                                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                                        Likes
                                      </Text>
                                    </HStack>
                                    <Text mt={1} fontSize="xl" fontWeight="800">
                                      {formatCompactNumber(item.likes)}
                                    </Text>
                                  </Box>
                                  <Box borderRadius="16px" bg={softBg} p={3}>
                                    <HStack spacing={2} color={muted}>
                                      <Icon as={FiFileText} />
                                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                                        Videos
                                      </Text>
                                    </HStack>
                                    <Text mt={1} fontSize="xl" fontWeight="800">
                                      {item.videos}
                                    </Text>
                                  </Box>
                                  <Box borderRadius="16px" bg={softBg} p={3}>
                                    <HStack spacing={2} color={muted}>
                                      <Icon as={FiLayers} />
                                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase">
                                        Graphics
                                      </Text>
                                    </HStack>
                                    <Text mt={1} fontSize="xl" fontWeight="800">
                                      {item.graphics}
                                    </Text>
                                  </Box>
                                </SimpleGrid>

                                <HStack justify="space-between" mt={5} mb={2}>
                                  <Text fontSize="sm" color={muted}>
                                    Weekly progress
                                  </Text>
                                  <Text fontSize="sm" fontWeight="800">
                                    {formatCompactNumber(item.shares)} shares
                                  </Text>
                                </HStack>
                                <Progress value={item.progress} colorScheme={colorScheme} size="sm" borderRadius="full" bg={progressTrackBg} />
                              </Box>
                            </SurfaceCard>
                          );
                          })}
                        </SimpleGrid>
                      )}
                    </TabPanel>

                    <TabPanel px={0} py={0}>
                      <SurfaceCard>
                        <Box p={{ base: 4, md: 5 }}>
                          <SectionIntro
                            eyebrow="History"
                            title="Weekly KPI history"
                            description="Review saved weekly KPI records by platform and selected reporting week."
                          />

                          <Box overflowX="auto" mt={5} {...tableShellProps}>
                            <Table {...tableProps}>
                              <Thead>
                                <Tr>
                                  {["Platform", "Week", "Videos", "Graphics", "Views", "Likes", "Shares", "Progress"].map((heading) => (
                                    <Th key={heading} {...headCellProps}>
                                      {heading}
                                    </Th>
                                  ))}
                                </Tr>
                              </Thead>
                              <Tbody>
                                {kpiHistoryRows.length === 0 ? (
                                  <Tr>
                                    <Td colSpan={8} px={4} py={6}>
                                      <EmptyStateBlock
                                        title="No backend history yet"
                                        description="Edit and save a weekly KPI card to create the first weekly KPI record."
                                        badge="No History"
                                      />
                                    </Td>
                                  </Tr>
                                ) : (
                                  kpiHistoryRows.map((entry) => {
                                    const colorScheme = getProgressColorScheme(entry.progress);
                                    const brand = platformBrandMap[entry.platform] || { icon: FiLayers, bg: "blue.50", color: "blue.600" };

                                    return (
                                      <Tr key={`${entry.platform}-${entry.weekStart}`} {...rowProps}>
                                        <Td {...cellProps} fontWeight="800">
                                          <HStack spacing={3}>
                                            <Flex
                                              w="38px"
                                              h="38px"
                                              align="center"
                                              justify="center"
                                              borderRadius="14px"
                                              bg={brand.bg}
                                              color={brand.color}
                                            >
                                              <Icon as={brand.icon} boxSize={4} />
                                            </Flex>
                                            <Text>{entry.platform}</Text>
                                          </HStack>
                                        </Td>
                                        <Td {...cellProps} color={muted}>{`${formatDate(entry.weekStart)} - ${formatDate(entry.weekEnd)}`}</Td>
                                        <Td {...cellProps} fontWeight="700">{entry.videos}</Td>
                                        <Td {...cellProps} fontWeight="700">{entry.graphics}</Td>
                                        <Td {...cellProps} fontWeight="700">{formatCompactNumber(entry.views)}</Td>
                                        <Td {...cellProps} fontWeight="700">{formatCompactNumber(entry.likes)}</Td>
                                        <Td {...cellProps} fontWeight="700">{formatCompactNumber(entry.shares)}</Td>
                                        <Td {...cellProps} minW="180px">
                                          <HStack spacing={3}>
                                            <Progress flex="1" value={entry.progress} colorScheme={colorScheme} size="sm" borderRadius="full" bg={progressTrackBg} />
                                            <Badge colorScheme={colorScheme} borderRadius="full" px={3} py={1}>
                                              {entry.progress}%
                                            </Badge>
                                          </HStack>
                                        </Td>
                                      </Tr>
                                    );
                                  })
                                )}
                              </Tbody>
                            </Table>
                          </Box>
                        </Box>
                      </SurfaceCard>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <Box overflowX="auto" mt={6} {...tableShellProps}>
                  <Table {...tableProps}>
                    <Thead>
                      <Tr>
                        {["Platform", "Date", "Weekly Target", "Posted", "Remaining", "Status", "Actual", "Progress", "Edit", "Actions"].map((heading) => (
                          <Th key={heading} {...headCellProps}>
                            {heading}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {calculatedTargets.map((row) => {
                        const accent = platformAccentMap[row.platform] || "blue";
                        const brand = platformBrandMap[row.platform] || { icon: FiLayers, bg: `${accent}.50`, color: `${accent}.600` };
                        return (
                          <Tr key={row.platform} {...rowProps}>
                            <Td {...cellProps}>
                              <HStack spacing={3}>
                                <Flex
                                  w="40px"
                                  h="40px"
                                  align="center"
                                  justify="center"
                                  borderRadius="16px"
                                  bg={brand.bg}
                                  color={brand.color}
                                  _dark={{ bg: "whiteAlpha.100", color: brand.color }}
                                >
                                  <Icon as={brand.icon} boxSize={5} />
                                </Flex>
                                <Box>
                                  <Text fontWeight="700">{row.platform}</Text>
                                  <Text fontSize="sm" color={muted}>
                                    Weekly publishing target
                                  </Text>
                                </Box>
                              </HStack>
                            </Td>
                            <Td {...cellProps} color={muted} minW="210px">
                              {`${formatDate(weekRange.start)} – ${formatDate(weekRange.end)}`}
                            </Td>
                            <Td {...cellProps}>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label={`Decrease target for ${row.platform}`}
                                  icon={<MinusIcon />}
                                  size="sm"
                                  variant="ghost"
                                  borderRadius="12px"
                                  isDisabled={targetsLoading || savingPlatform === row.platform}
                                  onClick={() => adjustTarget(row.platform, -1)}
                                />
                                <Text fontWeight="700" minW="24px" textAlign="center">
                                  {row.weeklyTarget}
                                </Text>
                                <IconButton
                                  aria-label={`Increase target for ${row.platform}`}
                                  icon={<AddIcon />}
                                  size="sm"
                                  variant="ghost"
                                  borderRadius="12px"
                                  isDisabled={targetsLoading || savingPlatform === row.platform}
                                  onClick={() => adjustTarget(row.platform, 1)}
                                />
                              </HStack>
                            </Td>
                            <Td {...cellProps}>
                              <Text fontWeight="600">{row.posted}</Text>
                            </Td>
                            <Td {...cellProps}>
                              <Text color={muted}>{row.remaining}</Text>
                            </Td>
                            <Td {...cellProps}>
                              <Badge colorScheme={row.colorScheme} borderRadius="full" px={3} py={1}>
                                {row.status}
                              </Badge>
                            </Td>
                            <Td {...cellProps}>
                              <Text fontWeight="600">{row.actual}</Text>
                            </Td>
                            <Td {...cellProps} minW="220px">
                              <VStack align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                  <Text fontSize="sm" color={muted}>
                                    Progress
                                  </Text>
                                  <Text fontSize="sm" fontWeight="700">
                                    {row.progress}%
                                  </Text>
                                </HStack>
                                <Progress value={row.progress} colorScheme={row.colorScheme} size="sm" borderRadius="full" />
                              </VStack>
                            </Td>
                            <Td {...cellProps}>
                              <Button size="sm" variant="outline" leftIcon={<EditIcon />} borderRadius="14px" onClick={() => handleEditOpen(row)} {...outlineButtonProps}>
                                Edit
                              </Button>
                            </Td>
                            <Td {...cellProps}>
                              {row.completed ? (
                                <VStack align="stretch" spacing={2}>
                                  <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                                    Completed
                                  </Badge>
                                  <Button size="sm" variant="outline" borderRadius="14px" isLoading={savingPlatform === row.platform} onClick={() => reopenTask(row.platform)} {...outlineButtonProps}>
                                    Reopen
                                  </Button>
                                </VStack>
                              ) : (
                                <Button size="sm" colorScheme="green" leftIcon={<CheckIcon />} borderRadius="14px" isLoading={savingPlatform === row.platform} onClick={() => completeTask(row.platform)}>
                                  Complete
                                </Button>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </SurfaceCard>
          </TabPanel>

          <TabPanel px={0}>
            <VStack align="stretch" spacing={6}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                <MetricCard
                  label="Planner completion"
                  value={`${plannerStats.completed}/${plannerStats.total}`}
                  subtext="Cards marked complete this week"
                  icon={FiCheckCircle}
                  accent="green"
                  trend={{ label: `${plannerStats.completionRate}% complete`, positive: plannerStats.completionRate >= 60 }}
                  progress={plannerStats.completionRate}
                />
                <MetricCard
                  label="Pending approvals"
                  value={plannerStats.pendingReview}
                  subtext="Posts waiting on review"
                  icon={FiClock}
                  accent="orange"
                  trend={{ label: plannerStats.pendingReview === 0 ? "No blockers" : "Action needed", positive: plannerStats.pendingReview === 0 }}
                  progress={plannerStats.total ? Math.max(12, Math.round((plannerStats.pendingReview / plannerStats.total) * 100)) : 0}
                />
                <MetricCard
                  label="Scheduled content"
                  value={plannerStats.scheduled}
                  subtext="Posts already lined up"
                  icon={FiCalendar}
                  accent="blue"
                  trend={{ label: `${plannerStats.total} total slots`, positive: plannerStats.scheduled > 0 }}
                  progress={plannerStats.total ? Math.round((plannerStats.scheduled / plannerStats.total) * 100) : 0}
                />
              </SimpleGrid>

              <SurfaceCard>
                <Box p={{ base: 5, md: 6 }}>
                  <SectionIntro
                    eyebrow="Planning"
                    title="Content planner"
                    description="A cleaner, scan-friendly planner for weekly scheduling, ownership, approvals, and completion."
                    actions={[
                      <FormControl key="plannerWeek" maxW={{ base: "100%", md: "240px" }}>
                        <FormLabel mb={2} fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                          Active week
                        </FormLabel>
                        <Input type="date" value={toInputDate(selectedDate)} onChange={handleDateChange} borderRadius="16px" borderColor={surfaceBorder} />
                      </FormControl>,
                      <Button key="add" leftIcon={<CalendarIcon />} borderRadius="16px" onClick={onOpen} {...primaryButtonProps}>
                        New Post
                      </Button>,
                    ]}
                  />

                  {posts.length === 0 ? (
                    <Box mt={6}>
                      <EmptyStateBlock
                        title="No scheduled posts yet"
                        description="Add the first content slot for this week to start filling the planner."
                        action={
                          <Button size="sm" borderRadius="14px" onClick={onOpen} {...primaryButtonProps}>
                            Create a post
                          </Button>
                        }
                        badge="Planner Empty"
                      />
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5} mt={6}>
                      {posts.map((slot, index) => {
                        const statusTone = statusToneMap[slot.approval] || statusToneMap.Draft;
                        return (
                          <SurfaceCard key={`${slot.day}-${slot.slot}-${index}`}>
                            <Box p={5}>
                              <Flex justify="space-between" align="flex-start" gap={4} mb={4}>
                                <Box>
                                  <HStack spacing={2} mb={2}>
                                    <Badge borderRadius="full" px={3} py={1} colorScheme="blue">
                                      {slot.day}
                                    </Badge>
                                    <Badge variant="subtle" borderRadius="full" px={3} py={1}>
                                      {slot.slot}
                                    </Badge>
                                  </HStack>
                                  <Heading size="sm">{slot.type}</Heading>
                                  <Text mt={1} color={muted}>
                                    {slot.topic || "Untitled topic"}
                                  </Text>
                                </Box>
                                <Flex
                                  w="42px"
                                  h="42px"
                                  borderRadius="16px"
                                  align="center"
                                  justify="center"
                                  bg="blue.50"
                                  color="blue.600"
                                  _dark={{ bg: "blue.500", color: "white" }}
                                >
                                  <Icon as={FiCalendar} boxSize={5} />
                                </Flex>
                              </Flex>

                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <Text color={muted}>Owner</Text>
                                  <Text fontWeight="600">{slot.staff || "Unassigned"}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color={muted}>Approval</Text>
                                  <Box px={3} py={1} borderRadius="full" bg={statusTone.bg} color={statusTone.color} fontSize="sm" fontWeight="600" boxShadow="inset 0 1px 0 rgba(255,255,255,0.45)">
                                    {slot.approval}
                                  </Box>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color={muted}>Completed</Text>
                                  <Switch size="md" isChecked={slot.completed} onChange={() => togglePostCompletion(index)} colorScheme="green" />
                                </HStack>
                              </VStack>
                            </Box>
                          </SurfaceCard>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </Box>
              </SurfaceCard>
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <VStack align="stretch" spacing={6}>
              <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
                {detailMetricColumns.map((column) => (
                  <SurfaceCard key={column.title}>
                    <Box p={5}>
                      <HStack justify="space-between" mb={5}>
                        <Heading size="sm">{column.title}</Heading>
                        <Flex
                          w="40px"
                          h="40px"
                          borderRadius="16px"
                          align="center"
                          justify="center"
                          bg={`${column.accent}.50`}
                          color={`${column.accent}.600`}
                          _dark={{ bg: `${column.accent}.500`, color: "white" }}
                        >
                          <Icon as={column.icon} boxSize={4} />
                        </Flex>
                      </HStack>
                      <VStack align="stretch" spacing={4}>
                        {column.items.map((metric) => (
                          <Box key={metric.label} borderRadius="16px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={4} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
                            <Text fontSize="sm" color={muted}>
                              {metric.label}
                            </Text>
                            <Text mt={2} fontSize="xl" fontWeight="700" letterSpacing="0">
                              {metric.value}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  </SurfaceCard>
                ))}
              </SimpleGrid>

              <SurfaceCard>
                <Box p={{ base: 5, md: 6 }}>
                  <SectionIntro
                    eyebrow="Analytics"
                    title="Target versus actual performance"
                    description="A clearer, premium view of how the week is tracking across the main operational KPIs."
                  />
                  <Grid templateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }} gap={5} mt={6}>
                    {reportCharts.map((chart) => (
                      <Box key={chart.label} borderRadius="20px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={5} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
                        <Text fontWeight="700">{chart.label}</Text>
                        <Text mt={1} color={muted}>
                          Actual versus target contribution
                        </Text>
                        <Box mt={5}>
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" color={muted}>
                              Target
                            </Text>
                            <Text fontSize="sm" fontWeight="600">
                              {chart.target}%
                            </Text>
                          </HStack>
                          <Progress value={chart.target} size="sm" borderRadius="full" bg={progressTrackBg} />
                        </Box>
                        <Box mt={4}>
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" color={muted}>
                              Actual
                            </Text>
                            <Text fontSize="sm" fontWeight="600">
                              {chart.actual}%
                            </Text>
                          </HStack>
                          <Progress
                            value={chart.actual}
                            colorScheme="blue"
                            size="sm"
                            borderRadius="full"
                            bg={progressTrackBg}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Grid>
                </Box>
              </SurfaceCard>
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <VStack align="stretch" spacing={6}>
              <SurfaceCard>
                <Box p={{ base: 5, md: 6 }}>
                  <SectionIntro
                    eyebrow="Reporting"
                    title="Weekly report archive"
                    description="Filter historical weekly snapshots by month, year, and reporting Saturday without touching the underlying data flow."
                    actions={[
                      <Button key="download" leftIcon={<DownloadIcon />} borderRadius="16px" {...primaryButtonProps}>
                        Export Report
                      </Button>,
                    ]}
                  />

                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} mt={6}>
                    <FormControl>
                      <FormLabel fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                        Month
                      </FormLabel>
                      <Select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} borderRadius="16px" borderColor={surfaceBorder}>
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                        Year
                      </FormLabel>
                      <Select value={reportYear} onChange={(e) => setReportYear(e.target.value)} borderRadius="16px" borderColor={surfaceBorder}>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                        Saturday date
                      </FormLabel>
                      <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} borderRadius="16px" borderColor={surfaceBorder} />
                    </FormControl>
                    <Box borderRadius="20px" borderWidth="1px" borderColor={surfaceBorder} bg={softBg} p={4} boxShadow="inset 0 1px 0 rgba(255,255,255,0.5)">
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted} fontWeight="700">
                        Filter Summary
                      </Text>
                      <Text mt={2} fontWeight="700">
                        {reportSummary.periodLabel}
                      </Text>
                      <Text mt={1} fontSize="sm" color={muted}>
                        {reportSummary.dateLabel ? `Report date: ${reportSummary.dateLabel}` : "All report dates"}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5} mt={6}>
                    <MetricCard
                      label="Report entries"
                      value={reportSummary.totalTasks}
                      subtext="Saved weekly snapshots"
                      icon={FiFileText}
                      accent="blue"
                      trend={{ label: reportSummary.totalTasks > 0 ? "Archive active" : "No entries yet", positive: reportSummary.totalTasks > 0 }}
                      progress={Math.min(100, reportSummary.totalTasks * 10)}
                    />
                    <MetricCard
                      label="Total target"
                      value={reportSummary.totalTarget}
                      subtext="Planned output in selected view"
                      icon={FiLayers}
                      accent="green"
                      trend={{ label: reportSummary.periodLabel, positive: true }}
                      progress={Math.min(100, reportSummary.totalTarget || 0)}
                    />
                    <MetricCard
                      label="Total actual"
                      value={reportSummary.totalActual}
                      subtext="Delivered output in selected view"
                      icon={FiCheckCircle}
                      accent="purple"
                      trend={{ label: `${finalReportData.totalActual || 0} all-time completed`, positive: reportSummary.totalActual >= reportSummary.totalTarget }}
                      progress={reportSummary.totalTarget ? Math.min(100, Math.round((reportSummary.totalActual / reportSummary.totalTarget) * 100)) : 0}
                    />
                    <MetricCard
                      label="Delta"
                      value={`${reportSummary.delta.toFixed(1)}%`}
                      subtext="Actual versus target"
                      icon={FiBarChart2}
                      accent="orange"
                      trend={{ label: reportSummary.delta >= 0 ? "Ahead of plan" : "Below target", positive: reportSummary.delta >= 0 }}
                      progress={Math.min(100, Math.abs(Math.round(reportSummary.delta)))}
                    />
                  </SimpleGrid>

                  {reportEntries.length === 0 ? (
                    <Box mt={6}>
                      <EmptyStateBlock
                        title="No reports for the selected filters"
                        description="Try a different month, year, or reporting Saturday to surface saved weekly report snapshots."
                        badge="No Results"
                      />
                    </Box>
                  ) : (
                    <Box overflowX="auto" mt={6}>
                      <Table variant="unstyled">
                        <Thead>
                          <Tr>
                            {["Month", "Year", "Date", "Platform", "Target", "Actual", "Delta"].map((heading) => (
                              <Th key={heading} px={4} py={3} fontSize="11px" textTransform="uppercase" letterSpacing="0.12em" color={muted}>
                                {heading}
                              </Th>
                            ))}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {reportEntries.map((report, index) => {
                            const rawDate = report.date || report.createdAt || report.updatedAt;
                            const entryDate = rawDate ? new Date(rawDate) : new Date();
                            const entryMonth = entryDate.toLocaleString("en-US", { month: "short" });
                            const entryYear = entryDate.getFullYear();
                            const deltaValue = report.weeklyTarget ? ((report.actual - report.weeklyTarget) / report.weeklyTarget) * 100 : 0;
                            return (
                              <Tr key={report._id || `${report.platform}-${index}`} _hover={{ bg: tableHover }} transition="background 0.18s ease">
                                <Td px={4} py={4} fontWeight="700">
                                  {entryMonth}
                                </Td>
                                <Td {...cellProps}>{entryYear}</Td>
                                <Td {...cellProps}>{formatDate(entryDate)}</Td>
                                <Td {...cellProps}>{report.platform}</Td>
                                <Td {...cellProps}>{report.weeklyTarget}</Td>
                                <Td {...cellProps}>{report.actual}</Td>
                                <Td {...cellProps}>
                                  <Badge colorScheme={deltaValue >= 0 ? "green" : "orange"} borderRadius="full" px={3} py={1}>
                                    {deltaValue.toFixed(1)}%
                                  </Badge>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>
              </SurfaceCard>

              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
                <SurfaceCard>
                  <Box p={5}>
                    <Heading size="sm" mb={4}>
                      Report Summary
                    </Heading>
                    <VStack align="stretch" spacing={3}>
                      {reportInsightItems.map((item) => (
                        <HStack key={item} align="start" spacing={3}>
                          <Box {...bulletStyle} />
                          <Text color={muted}>{item}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </SurfaceCard>
                <SurfaceCard>
                  <Box p={5}>
                    <Heading size="sm" mb={4}>
                      Automation Features
                    </Heading>
                    <VStack align="stretch" spacing={3}>
                      {automationItems.map((item) => (
                        <HStack key={item} align="start" spacing={3}>
                          <Box {...bulletStyle} />
                          <Text color={muted}>{item}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </SurfaceCard>
              </SimpleGrid>
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <SurfaceCard>
              <Box p={{ base: 4, md: 5 }}>
                <NoticeBoardPanel
                  title="Social Media Notice Board"
                  subtitle="Broadcast messages for the content team and leadership"
                  embedded
                />
              </Box>
            </SurfaceCard>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isKpiEditOpen} onClose={handleKpiEditClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="24px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="700">
                Edit {editingKpiPlatform || "Platform"} Weekly KPI
              </Text>
              <Text fontSize="sm" color={muted}>
                Update weekly videos, graphics, views, likes, and shares for {getWeekWindowForDate(selectedDate).label}.
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {[
                { key: "videos", label: "Videos" },
                { key: "graphics", label: "Graphics Posts" },
                { key: "views", label: "Views" },
                { key: "likes", label: "Likes" },
                { key: "shares", label: "Shares" },
              ].map((field) => (
                <FormControl key={field.key} gridColumn={field.key === "shares" ? { md: "span 2" } : undefined}>
                  <FormLabel>{field.label}</FormLabel>
                  <NumberInput
                    min={0}
                    value={kpiForm[field.key]}
                    onChange={(_, valueAsNumber) => handleKpiFormChange(field.key, valueAsNumber)}
                    clampValueOnBlur
                  >
                    <NumberInputField borderRadius="16px" borderColor={surfaceBorder} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              ))}
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} borderRadius="16px" onClick={handleKpiSave} isLoading={savingKpiPlatform === editingKpiPlatform} isDisabled={!editingKpiPlatform} {...primaryButtonProps}>
              Save Weekly KPI
            </Button>
            <Button variant="ghost" borderRadius="16px" onClick={handleKpiEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius="24px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>Create New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Day</FormLabel>
                <Select name="day" value={newPost.day} onChange={handleInputChange} borderRadius="16px" borderColor={surfaceBorder}>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Time Slot</FormLabel>
                <Input name="slot" value={newPost.slot} onChange={handleInputChange} placeholder="e.g., 9:00 AM" borderRadius="16px" borderColor={surfaceBorder} />
              </FormControl>

              <FormControl>
                <FormLabel>Content Type</FormLabel>
                <Select name="type" value={newPost.type} onChange={handleInputChange} borderRadius="16px" borderColor={surfaceBorder}>
                  <option value="Video">Video</option>
                  <option value="Poster">Poster</option>
                  <option value="Carousel">Carousel</option>
                  <option value="Article">Article</option>
                  <option value="Story">Story</option>
                  <option value="Live">Live Stream</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Assigned Staff</FormLabel>
                <Input name="staff" value={newPost.staff} onChange={handleInputChange} placeholder="Staff member name" borderRadius="16px" borderColor={surfaceBorder} />
              </FormControl>

              <FormControl>
                <FormLabel>Approval Status</FormLabel>
                <Select name="approval" value={newPost.approval} onChange={handleInputChange} borderRadius="16px" borderColor={surfaceBorder}>
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Posted">Posted</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Topic/Theme</FormLabel>
                <Textarea
                  name="topic"
                  value={newPost.topic}
                  onChange={handleInputChange}
                  placeholder="Content topic or theme"
                  borderRadius="16px"
                  borderColor={surfaceBorder}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} borderRadius="16px" onClick={handleSubmitPost} {...primaryButtonProps}>
              Create Post
            </Button>
            <Button variant="ghost" borderRadius="16px" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={handleEditClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="24px" boxShadow="0 24px 70px rgba(15,23,42,0.24)">
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="700">
                Edit {editingPlatform || "Platform"} Points
              </Text>
              <Text fontSize="sm" color={muted}>
                Update the weekly target and actual counts centrally.
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Weekly Target</FormLabel>
                <NumberInput
                  min={0}
                  value={editForm.weeklyTarget}
                  onChange={(_, valueAsNumber) => handleEditChange("weeklyTarget", valueAsNumber)}
                  clampValueOnBlur
                >
                  <NumberInputField borderRadius="16px" borderColor={surfaceBorder} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Actual</FormLabel>
                <NumberInput
                  min={0}
                  value={editForm.actual}
                  onChange={(_, valueAsNumber) => handleEditChange("actual", valueAsNumber)}
                  clampValueOnBlur
                >
                  <NumberInputField borderRadius="16px" borderColor={surfaceBorder} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} borderRadius="16px" onClick={handleEditSave} isDisabled={!editingPlatform} {...primaryButtonProps}>
              Save Changes
            </Button>
            <Button variant="ghost" borderRadius="16px" onClick={handleEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default SocialMediaManager;


