import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import axiosInstance from "../../services/axiosInstance";
import {
  fetchContentPlans,
  createContentPlan,
  updateContentPlan,
  deleteContentPlan,
} from "../../services/contentPlanService";
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
import { SurfaceCard, useSocialStyles } from "./SocialMediaPrimitives";
import DashboardOverview from "./DashboardOverview";
import WeeklyTargets from "./WeeklyTargets";
import WeeklyKpiSection from "./WeeklyKpiSection";
import ContentPlanner from "./ContentPlanner";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ReportsSection from "./ReportsSection";

/* ──────────────────────────────────────────────
   Static seed data
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   Pure helper functions
   ────────────────────────────────────────────── */

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const toInputDate = (date) => {
  try { return new Date(date).toISOString().split("T")[0]; } catch { return ""; }
};

const getMetricPeriod = (date) => {
  const current = new Date(date);
  return { month: current.toLocaleString("en-US", { month: "short" }), year: current.getFullYear() };
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

const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
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
    const merged = { ...seed, ...match, platform: seed.platform, weekStart, weekEnd };
    return { ...merged, progress: calculateKpiProgress(merged) };
  });
};

const buildTargetRowsFromActuals = (records, date) => {
  const { month, year } = getMetricPeriod(date);
  return initialTargets.map((seed) => {
    const match = records.find((r) => r.platform === seed.platform && r.month === month && Number(r.year) === Number(year));
    const actual = Number(match?.actual || 0);
    const target = Number(match?.target ?? seed.weeklyTarget ?? 0);
    const completed = target > 0 && actual >= target;
    return { platform: seed.platform, weeklyTarget: target, posted: actual, actual, completed, month, year };
  });
};

const buildTargetRow = (target) => {
  const remaining = Math.max(target.weeklyTarget - target.posted, 0);
  const progress = target.weeklyTarget > 0 ? Math.min(100, Math.round((target.posted / target.weeklyTarget) * 100)) : 0;
  return { ...target, remaining, progress, status: target.completed ? "COMPLETED" : "IN PROGRESS" };
};

/* ──────────────────────────────────────────────
   SocialMediaManager — data provider + section renderer
   ────────────────────────────────────────────── */

const SocialMediaManager = ({ activeSection = "dashboard", setActiveSection }) => {
  const toast = useToast();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isKpiEditOpen, onOpen: onKpiEditOpen, onClose: onKpiEditClose } = useDisclosure();
  const { isOpen: isNewPostOpen, onOpen: onNewPostOpen, onClose: onNewPostClose } = useDisclosure();
  const { surfaceBorder, muted, primaryButton } = useSocialStyles();

  /* ── State ── */
  const [weeklyTargets, setWeeklyTargets] = useState(initialTargets);
  const [socialActuals, setSocialActuals] = useState([]);
  const [weeklyKpiRecords, setWeeklyKpiRecords] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState("");
  const [savingKpiPlatform, setSavingKpiPlatform] = useState("");
  const [posts, setPosts] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [weeklyReports] = useState(() => {
    const saved = localStorage.getItem("weeklyReports");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editForm, setEditForm] = useState({ weeklyTarget: 0, actual: 0 });
  const [editingKpiPlatform, setEditingKpiPlatform] = useState("");
  const [kpiForm, setKpiForm] = useState({ videos: 0, graphics: 0, views: 0, likes: 0, shares: 0 });

  /* ── Report filters ── */
  const currentYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState(MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(currentYear));
  const [reportDate, setReportDate] = useState(toInputDate(new Date()));

  /* ── Persistence ── */
  useEffect(() => {
    try {
      localStorage.setItem("weeklyReports", JSON.stringify(weeklyReports));
    } catch (error) { console.warn("Failed to persist social media data", error); }
  }, [weeklyReports]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await fetchContentPlans();
        setPosts(res.data || res || []);
      } catch (error) {
        console.error("Failed to load content plans", error);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("contentPlansUpdated"));
  }, [posts]);

  /* ── Recalc targets when date/actuals change ── */
  useEffect(() => {
    setWeeklyTargets(buildTargetRowsFromActuals(socialActuals, selectedDate));
  }, [selectedDate, socialActuals]);

  /* ── Computed data ── */
  const weekRange = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const calculatedTargets = useMemo(() => weeklyTargets.map(buildTargetRow), [weeklyTargets]);
  const currentWeeklyKpis = useMemo(() => buildWeeklyKpisFromRecords(weeklyKpiRecords, selectedDate), [selectedDate, weeklyKpiRecords]);

  const kpiHistoryRows = useMemo(() => {
    return [...weeklyKpiRecords]
      .sort((a, b) => (b.weekStart !== a.weekStart ? b.weekStart.localeCompare(a.weekStart) : a.platform.localeCompare(b.platform)))
      .map((item) => ({ ...item, progress: calculateKpiProgress(item) }));
  }, [weeklyKpiRecords]);

  const dashboardSummary = useMemo(() => {
    const totalTarget = calculatedTargets.reduce((sum, row) => sum + row.weeklyTarget, 0);
    const totalPosted = calculatedTargets.reduce((sum, row) => sum + row.posted, 0);
    const totalActual = calculatedTargets.reduce((sum, row) => sum + row.actual, 0);
    const completedPlatforms = calculatedTargets.filter((row) => row.completed).length;
    const completionRate = totalTarget ? Math.round((totalPosted / totalTarget) * 100) : 0;
    const delta = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
    return { totalTarget, totalPosted, totalActual, completedPlatforms, completionRate, delta };
  }, [calculatedTargets]);

  const plannerStats = useMemo(() => {
    const total = posts.length;
    const completed = posts.filter((p) => p.completed).length;
    const pendingReview = posts.filter((p) => p.approval === "Pending Review").length;
    const scheduled = posts.filter((p) => p.approval === "Scheduled").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pendingReview, scheduled, completionRate };
  }, [posts]);

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
    const totalTarget = reportEntries.reduce((sum, r) => sum + (r.weeklyTarget || 0), 0);
    const totalActual = reportEntries.reduce((sum, r) => sum + (r.actual || 0), 0);
    const delta = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
    const periodLabel = reportMonth === "All" ? "All months" : `${reportMonth} ${reportYear}`;
    const dateLabel = reportDate ? formatDate(reportDate) : null;
    return { totalTasks: reportEntries.length, totalTarget, totalActual, delta, periodLabel, dateLabel };
  }, [reportDate, reportEntries, reportMonth, reportYear]);

  /* ── API fetchers ── */
  useEffect(() => {
    const fetchSocialActuals = async () => {
      try {
        setTargetsLoading(true);
        const response = await axiosInstance.get('/social-actuals');
        setSocialActuals(Array.isArray(response.data) ? response.data : response.data?.data || []);
      } catch (error) { console.error("Failed to load social target data", error); }
      finally { setTargetsLoading(false); }
    };
    fetchSocialActuals();
  }, []);

  useEffect(() => {
    const fetchWeeklyKpis = async () => {
      try {
        setKpiLoading(true);
        const response = await axiosInstance.get('/social-weekly-kpis');
        setWeeklyKpiRecords(Array.isArray(response.data) ? response.data : response.data?.data || []);
      } catch (error) { console.error("Failed to load weekly KPI data", error); }
      finally { setKpiLoading(false); }
    };
    fetchWeeklyKpis();
  }, []);

  /* ── State updaters ── */
  const upsertSocialActual = (nextDoc) => {
    setSocialActuals((prev) => {
      const idx = prev.findIndex((i) => i.platform === nextDoc.platform && i.month === nextDoc.month && Number(i.year) === Number(nextDoc.year));
      if (idx === -1) return [...prev, nextDoc];
      const next = [...prev]; next[idx] = nextDoc; return next;
    });
  };

  const upsertWeeklyKpi = (nextDoc) => {
    setWeeklyKpiRecords((prev) => {
      const idx = prev.findIndex((i) => i.platform === nextDoc.platform && i.weekStart === nextDoc.weekStart);
      if (idx === -1) return [...prev, nextDoc];
      const next = [...prev]; next[idx] = nextDoc; return next;
    });
  };

  /* ── Save functions ── */
  const saveSocialTarget = async ({ platform, target, actual }) => {
    const { month, year } = getMetricPeriod(selectedDate);
    setSavingPlatform(platform);
    try {
      const response = await axiosInstance.post('/social-actuals', { platform, target, actual, month, year });
      upsertSocialActual(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to save social target", error);
      throw error;
    } finally { setSavingPlatform(""); }
  };

  const saveWeeklyKpi = async ({ platform, videos, graphics, views, likes, shares }) => {
    const { weekStart } = getWeekWindowForDate(selectedDate);
    setSavingKpiPlatform(platform);
    try {
      const response = await axiosInstance.post('/social-weekly-kpis', { platform, date: weekStart, videos, graphics, views, likes, shares });
      upsertWeeklyKpi(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to save weekly KPI", error);
      throw error;
    } finally { setSavingKpiPlatform(""); }
  };

  /* ── Event handlers ── */
  const handleDateChange = (e) => setSelectedDate(new Date(e.target.value));

  const handleEditOpen = (row) => {
    setEditingPlatform(row.platform);
    setEditForm({ weeklyTarget: row.weeklyTarget, actual: row.actual });
    onEditOpen();
  };

  const handleEditClose = () => { setEditingPlatform(null); setEditForm({ weeklyTarget: 0, actual: 0 }); onEditClose(); };

  const handleEditSave = async () => {
    if (!editingPlatform) return;
    try {
      await saveSocialTarget({ platform: editingPlatform, target: Math.max(0, Number(editForm.weeklyTarget) || 0), actual: Math.max(0, Number(editForm.actual) || 0) });
      toast({ title: "Targets updated", status: "success", duration: 3000, isClosable: true });
      handleEditClose();
    } catch { toast({ title: "Save failed", description: "Backend update did not complete.", status: "error", duration: 3500, isClosable: true }); }
  };

  const handleKpiEditOpen = (item) => {
    setEditingKpiPlatform(item.platform);
    setKpiForm({ videos: Number(item.videos || 0), graphics: Number(item.graphics || 0), views: Number(item.views || 0), likes: Number(item.likes || 0), shares: Number(item.shares || 0) });
    onKpiEditOpen();
  };

  const handleKpiEditClose = () => { setEditingKpiPlatform(""); setKpiForm({ videos: 0, graphics: 0, views: 0, likes: 0, shares: 0 }); onKpiEditClose(); };

  const handleKpiSave = async () => {
    if (!editingKpiPlatform) return;
    try {
      await saveWeeklyKpi({ platform: editingKpiPlatform, videos: Math.max(0, Number(kpiForm.videos) || 0), graphics: Math.max(0, Number(kpiForm.graphics) || 0), views: Math.max(0, Number(kpiForm.views) || 0), likes: Math.max(0, Number(kpiForm.likes) || 0), shares: Math.max(0, Number(kpiForm.shares) || 0) });
      toast({ title: "Weekly KPI updated", status: "success", duration: 3000, isClosable: true });
      handleKpiEditClose();
    } catch { toast({ title: "Save failed", description: "Weekly KPI update did not complete.", status: "error", duration: 3500, isClosable: true }); }
  };

  const adjustTarget = async (platform, delta) => {
    const row = weeklyTargets.find((r) => r.platform === platform);
    if (!row) return;
    try { await saveSocialTarget({ platform, target: Math.max(0, row.weeklyTarget + delta), actual: row.actual }); }
    catch { toast({ title: "Update failed", status: "error", duration: 3500, isClosable: true }); }
  };

  const completeTask = async (platform) => {
    const row = weeklyTargets.find((r) => r.platform === platform);
    if (!row) return;
    try {
      await saveSocialTarget({ platform, target: row.weeklyTarget, actual: Math.max(row.actual, row.weeklyTarget) });
      toast({ title: "Platform completed", status: "success", duration: 3000, isClosable: true });
    } catch { toast({ title: "Complete failed", status: "error", duration: 3500, isClosable: true }); }
  };

  const reopenTask = async (platform) => {
    const row = weeklyTargets.find((r) => r.platform === platform);
    if (!row) return;
    const reopenedActual = row.weeklyTarget > 0 ? Math.max(0, Math.min(row.actual, row.weeklyTarget - 1)) : 0;
    try {
      await saveSocialTarget({ platform, target: row.weeklyTarget, actual: reopenedActual });
      toast({ title: "Platform reopened", status: "success", duration: 3000, isClosable: true });
    } catch { toast({ title: "Reopen failed", status: "error", duration: 3500, isClosable: true }); }
  };

  const handleAddPost = async (newPost) => {
    try {
      const res = await createContentPlan(newPost);
      setPosts((prev) => [...prev, res.data || res]);
      toast({ title: "Plan created successfully", status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      console.error("Failed to create content plan", err);
      toast({ title: "Failed to create content plan", status: "error", duration: 3500, isClosable: true });
    }
  };

  const handleUpdatePost = async (id, updatedFields) => {
    try {
      const res = await updateContentPlan(id, updatedFields);
      setPosts((prev) => prev.map((post) => (post._id === id || post.id === id ? (res.data || res) : post)));
      if (updatedFields.scheduledDate) {
        toast({ title: "Plan rescheduled", status: "success", duration: 2000, isClosable: true });
      } else if (updatedFields.completed !== undefined) {
        toast({
          title: updatedFields.completed ? "Plan marked complete" : "Plan reopened",
          description: updatedFields.completed ? "Synced to Post Tracker" : "Removed from Post Tracker",
          status: "success",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (err) {
      console.error("Failed to update content plan", err);
      toast({ title: "Failed to update content plan", status: "error", duration: 3500, isClosable: true });
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await deleteContentPlan(id);
      setPosts((prev) => prev.filter((post) => post._id !== id && post.id !== id));
      toast({ title: "Plan deleted successfully", status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      console.error("Failed to delete content plan", err);
      toast({ title: "Failed to delete content plan", status: "error", duration: 3500, isClosable: true });
    }
  };

  /* ── Section renderer ── */
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardOverview
            calculatedTargets={calculatedTargets}
            dashboardSummary={dashboardSummary}
            plannerStats={plannerStats}
            currentWeeklyKpis={currentWeeklyKpis}
            posts={posts}
            weekRange={weekRange}
            selectedDate={selectedDate}
            onNewPost={() => setActiveSection("planner")}
            loading={targetsLoading || plansLoading}
          />
        );
      case "targets":
        return (
          <WeeklyTargets
            calculatedTargets={calculatedTargets}
            weekRange={weekRange}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onAdjustTarget={adjustTarget}
            onCompleteTask={completeTask}
            onReopenTask={reopenTask}
            onEditOpen={handleEditOpen}
            targetsLoading={targetsLoading}
            savingPlatform={savingPlatform}
            dashboardSummary={dashboardSummary}
            setActiveSection={setActiveSection}
          />
        );
      case "kpis":
        return (
          <WeeklyKpiSection
            currentWeeklyKpis={currentWeeklyKpis}
            kpiHistoryRows={kpiHistoryRows}
            selectedDate={selectedDate}
            weekLabel={getWeekWindowForDate(selectedDate).label}
            onDateChange={handleDateChange}
            onKpiEditOpen={handleKpiEditOpen}
            savingKpiPlatform={savingKpiPlatform}
            kpiLoading={kpiLoading}
          />
        );
      case "planner":
        return (
          <ContentPlanner
            posts={posts}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onAddPost={handleAddPost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
          />
        );
      case "analytics":
        return <AnalyticsDashboard />;
      case "reports":
        return (
          <ReportsSection
            reportEntries={reportEntries}
            reportSummary={reportSummary}
            reportInsightItems={reportInsightItems}
            automationItems={automationItems}
            reportMonth={reportMonth}
            setReportMonth={setReportMonth}
            reportYear={reportYear}
            setReportYear={setReportYear}
            reportDate={reportDate}
            setReportDate={setReportDate}
          />
        );
      case "notice":
        return (
          <SurfaceCard>
            <Box p={{ base: 4, md: 5 }}>
              <NoticeBoardPanel
                title="Social Media Notice Board"
                subtitle="Broadcast messages for the content team and leadership"
                embedded
              />
            </Box>
          </SurfaceCard>
        );
      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" spacing={0}>
      {renderSection()}

      {/* ── Edit Targets Modal ── */}
      <Modal isOpen={isEditOpen} onClose={handleEditClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px" boxShadow="0 12px 36px rgba(15,23,42,0.2)">
          <ModalHeader>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="md" fontWeight="800">Edit {editingPlatform || "Platform"} Target</Text>
              <Text fontSize="xs" color={muted}>Update the weekly target count centrally. Actual posts are tracked automatically.</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={2}>
            <VStack spacing={3} align="stretch">
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>Weekly Target</FormLabel>
                <NumberInput size="sm" min={0} value={editForm.weeklyTarget} onChange={(_, v) => setEditForm((p) => ({ ...p, weeklyTarget: Number.isNaN(v) ? 0 : v }))} clampValueOnBlur>
                  <NumberInputField borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl size="sm" isDisabled>
                <FormLabel fontSize="xs" mb={1} color="gray.500">Actual Posts (Calculated Automatically)</FormLabel>
                <NumberInput size="sm" isReadOnly value={editForm.actual}>
                  <NumberInputField borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" bg="gray.50" />
                </NumberInput>
                <Text fontSize="10px" color="gray.500" mt={1}>
                  This count updates in real time based on approved posts in the Post Tracker.
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter py={3}>
            <Button size="sm" mr={3} borderRadius="10px" onClick={handleEditSave} isDisabled={!editingPlatform} {...primaryButton}>Save Changes</Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={handleEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Edit Weekly KPI Modal ── */}
      <Modal isOpen={isKpiEditOpen} onClose={handleKpiEditClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px" boxShadow="0 12px 36px rgba(15,23,42,0.2)">
          <ModalHeader>
            <VStack align="start" spacing={0.5}>
              <Text fontSize="md" fontWeight="800">Edit {editingKpiPlatform || "Platform"} Weekly KPI</Text>
              <Text fontSize="xs" color={muted}>Update weekly videos, graphics, views, likes, and shares for {getWeekWindowForDate(selectedDate).label}.</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={2}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {[
                { key: "videos", label: "Videos" },
                { key: "graphics", label: "Graphics Posts" },
                { key: "views", label: "Views" },
                { key: "likes", label: "Likes" },
                { key: "shares", label: "Shares" },
              ].map((field) => (
                <FormControl key={field.key} size="sm" gridColumn={field.key === "shares" ? { md: "span 2" } : undefined}>
                  <FormLabel fontSize="xs" mb={1}>{field.label}</FormLabel>
                  <NumberInput size="sm" min={0} value={kpiForm[field.key]} onChange={(_, v) => setKpiForm((p) => ({ ...p, [field.key]: Number.isNaN(v) ? 0 : v }))} clampValueOnBlur>
                    <NumberInputField borderRadius="10px" borderColor={surfaceBorder} fontSize="xs" />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FormControl>
              ))}
            </SimpleGrid>
          </ModalBody>
          <ModalFooter py={3}>
            <Button size="sm" mr={3} borderRadius="10px" onClick={handleKpiSave} isLoading={savingKpiPlatform === editingKpiPlatform} isDisabled={!editingKpiPlatform} {...primaryButton}>Save Weekly KPI</Button>
            <Button size="sm" variant="ghost" borderRadius="10px" onClick={handleKpiEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default SocialMediaManager;
