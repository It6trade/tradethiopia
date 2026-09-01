import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
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
import { DeleteIcon, DownloadIcon, EditIcon, ViewIcon } from "@chakra-ui/icons";
import { FiBookOpen, FiCheckCircle, FiClock, FiGrid, FiLayers, FiList, FiSearch, FiUserPlus, FiUsers } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useUserStore } from "../../store/user";
import { fetchUsers } from "../../services/api";
import {
  createStudentRegistration,
  deleteStudentRegistration,
  getStudentRegistrations,
  updateStudentRegistration,
} from "../../services/studentRegistrationService";
import Layout from "./Layout";

const learningDepartments = [
  "Import and Export",
  "Digital Marketing",
  "Stock Marketing",
  "Barista",
  "AI for Business",
  "Coffee Cupping",
  "Logistics",
  "Transit",
];

const timeSlotOptions = ["Morning", "Afternoon", "Night", "Weekend", "VIP"];
const paymentOptions = ["Full Payment", "Half Payment"];
const classCompletionOptions = ["Completed", "Not Completed", "Stopped"];
const cocPaymentOptions = ["Paid", "Unpaid"];

const initialForm = {
  studentId: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  learningDepartment: "",
  program: "",
  enrollmentDate: "",
  examDate: "",
  preferredTimeSlot: "Morning",
  readinessStatus: "Not assessed",
  paymentOption: "Full Payment",
  paymentStatus: "Waiting",
  paymentBank: "",
  fsNumber: "",
  classCompleted: false,
  classCompletionStatus: "Not Completed",
  cocPaymentStatus: "Unpaid",
  status: "Active",
  registeredBy: "",
  registeredByEmail: "",
  notes: "",
};

const getStudentName = (student = {}) =>
  student.fullName ||
  student.studentName ||
  student["Student Name"] ||
  student["Full Name"] ||
  student.student_name ||
  student.full_name ||
  student.learnerName ||
  student.learner ||
  student.name ||
  [student.firstName, student.lastName].filter(Boolean).join(" ") ||
  "";

const normalizePaymentStatus = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "unpaid") return "Unpaid";
  return "Waiting";
};

const normalizePaymentOption = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized.includes("half")) return "Half Payment";
  return "Full Payment";
};

const normalizeTimeSlot = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "afternoon") return "Afternoon";
  if (normalized === "night") return "Night";
  if (normalized === "weekend") return "Weekend";
  if (normalized === "vip") return "VIP";
  return "Morning";
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = (value || "").toString().trim().toLowerCase();
  return ["true", "yes", "1", "completed", "complete"].includes(normalized);
};

const normalizeClassCompletionStatus = (value, classCompleted = false) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "stopped" || normalized === "stop") return "Stopped";
  if (normalized === "completed" || normalized === "complete") return "Completed";
  if (normalized === "not completed" || normalized === "not complete" || normalized === "incomplete") return "Not Completed";
  return classCompleted ? "Completed" : "Not Completed";
};

const generateUniqueStudentId = (records = []) => {
  const prefix = "CS-STU-";
  const usedIds = new Set(records.map((student) => student.studentId).filter(Boolean));
  const latestNumber = records.reduce((highest, student) => {
    const match = (student.studentId || "").match(/^CS-STU-(\d+)$/);
    return match ? Math.max(highest, Number.parseInt(match[1], 10) || 0) : highest;
  }, 0);
  let nextNumber = latestNumber + 1;
  let nextId = `${prefix}${String(nextNumber).padStart(4, "0")}`;

  while (usedIds.has(nextId)) {
    nextNumber += 1;
    nextId = `${prefix}${String(nextNumber).padStart(4, "0")}`;
  }

  return nextId;
};

const normalizeStudent = (student = {}, index = 0) => ({
  ...initialForm,
  ...student,
  id: student.id || student._id || `legacy-${index}-${Date.now()}`,
  studentId: student.studentId || student.studentID || student.registrationNo || `CS-STU-${String(index + 1).padStart(4, "0")}`,
  fullName: getStudentName(student),
  learningDepartment: student.learningDepartment || student.department || student.learningDept || "",
  program: student.program || student.course || student.trainingProgram || "",
  examDate: formatDate(student.examDate || student.testDate),
  enrollmentDate: formatDate(student.enrollmentDate || student.registrationDate || student.createdAt),
  preferredTimeSlot: normalizeTimeSlot(student.preferredTimeSlot || student.timeSlot || student.section),
  readinessStatus: student.readinessStatus || student.readiness || "Not assessed",
  paymentOption: normalizePaymentOption(student.paymentOption || student.paymentPlan),
  paymentStatus: normalizePaymentStatus(student.paymentStatus || student.payment),
  paymentBank: student.paymentBank || student.bankName || "",
  fsNumber: student.fsNumber || student.receiptFsNumber || student.receiptNumber || "",
  classCompleted: normalizeClassCompletionStatus(student.classCompletionStatus || student.classStatus, normalizeBoolean(student.classCompleted)) === "Completed",
  classCompletionStatus: normalizeClassCompletionStatus(student.classCompletionStatus || student.classStatus, normalizeBoolean(student.classCompleted)),
  cocPaymentStatus: student.cocPaymentStatus === "Paid" ? "Paid" : "Unpaid",
  registeredBy:
    student.registeredBy ||
    student.registeredByName ||
    student.csMember ||
    student.createdByName ||
    student.createdBy ||
    "Unknown CS member",
  registeredByEmail: student.registeredByEmail || student.registrarEmail || student.createdByEmail || "",
  createdAt: student.createdAt || student.registrationDate || new Date().toISOString(),
});

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const safeSheetName = (name) =>
  String(name || "Unassigned")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31)
    .trim() || "Unassigned";

const getStateColor = (status) => {
  if (status === "Completed" || status === "Ready" || status === "Paid" || status === "Full Payment" || status === "Morning") return "green";
  if (status === "Active" || status === "In preparation" || status === "Afternoon") return "blue";
  if (status === "Pending" || status === "Needs support" || status === "Waiting" || status === "Half Payment" || status === "Weekend") return "orange";
  if (status === "Night") return "purple";
  if (status === "VIP") return "pink";
  if (status === "Paused" || status === "Not ready" || status === "Unpaid" || status === "Stopped") return "red";
  if (status === "Not Completed") return "orange";
  return "gray";
};

const getClassOutcome = (student) => {
  const record = student || {};
  return record.classCompletionStatus || (record.classCompleted ? "Completed" : "Not Completed");
};

const studentExportHeaders = [
  "Student ID",
  "Student Name",
  "Full Name",
  "Email",
  "Phone",
  "Gender",
  "Learning Department",
  "Program",
  "Enrollment Date",
  "Exam Date",
  "Preferred Time Slot",
  "Readiness Status",
  "Payment Option",
  "Payment Bank",
  "FS Number",
  "Class Completed",
  "Class Outcome",
  "CoC Payment Status",
  "Status",
  "Notes",
  "Registered By",
  "Registrar Email",
  "Registration Date",
  "Last Updated By",
  "Last Updated At",
];

const DetailItem = ({ label, value }) => (
  <Box>
    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase">
      {label}
    </Text>
    <Text fontWeight="700">{value || "Not provided"}</Text>
  </Box>
);

const StudentRegistrationPage = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isSectionCountsOpen,
    onOpen: onSectionCountsOpen,
    onClose: onSectionCountsClose,
  } = useDisclosure();
  const {
    isOpen: isExcelPreviewOpen,
    onOpen: onExcelPreviewOpen,
    onClose: onExcelPreviewClose,
  } = useDisclosure();
  const {
    isOpen: isRegistrationOpen,
    onOpen: onRegistrationOpen,
    onClose: onRegistrationClose,
  } = useDisclosure();
  const currentUser = useUserStore((state) => state.currentUser);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [registrarUsers, setRegistrarUsers] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [timeSlotFilter, setTimeSlotFilter] = useState("All");
  const [classCompletionFilter, setClassCompletionFilter] = useState("All");
  const [cocPaymentFilter, setCocPaymentFilter] = useState("All");
  const [selectedTimeSlotSection, setSelectedTimeSlotSection] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const pageBg = useColorModeValue("#f8fafc", "#090d1a");
  const cardBg = useColorModeValue("white", "#0f172a");
  const cardAltBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const mutedText = useColorModeValue("#64748b", "gray.400");
  const headingColor = useColorModeValue("#0f172a", "white");
  const borderColor = useColorModeValue("rgba(226,232,240,0.95)", "rgba(148,163,184,0.22)");
  const fieldBg = useColorModeValue("white", "whiteAlpha.50");
  const softPanelBg = useColorModeValue("rgba(240,253,244,0.72)", "rgba(22,101,52,0.16)");
  const rowHoverBg = useColorModeValue("green.50", "whiteAlpha.100");

  const registrarName =
    currentUser?.fullName ||
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    localStorage.getItem("userName") ||
    "Customer Service Member";

  const registrarEmail = currentUser?.email || localStorage.getItem("userEmail") || "";

  const getUserDisplayName = (user = {}) =>
    user.fullName ||
    user.name ||
    user.username ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "";

  const registrarOptions = useMemo(() => {
    const options = [
      {
        name: registrarName,
        email: registrarEmail,
        key: `${registrarName}|${registrarEmail}`,
      },
      ...registrarUsers.map((user) => {
        const name = getUserDisplayName(user);
        const email = user.email || "";
        return {
          name,
          email,
          key: `${name}|${email}`,
        };
      }),
    ].filter((option) => option.name);

    const unique = new Map();
    options.forEach((option) => {
      if (!unique.has(option.key)) {
        unique.set(option.key, option);
      }
    });

    return Array.from(unique.values());
  }, [registrarEmail, registrarName, registrarUsers]);

  const selectedRegistrarKey = useMemo(() => {
    const name = form.registeredBy || registrarName;
    const email = form.registeredByEmail || registrarEmail;
    const key = `${name}|${email}`;
    return registrarOptions.some((option) => option.key === key) ? key : "manual";
  }, [form.registeredBy, form.registeredByEmail, registrarEmail, registrarName, registrarOptions]);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      if (isMounted) setIsLoadingStudents(true);

      try {
        const databaseStudents = await getStudentRegistrations();
        const normalizedDatabaseStudents = Array.isArray(databaseStudents)
          ? databaseStudents.map(normalizeStudent)
          : [];

        if (isMounted) {
          setStudents(normalizedDatabaseStudents);
          setStudentLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setStudents([]);
          setStudentLoadError(error.response?.data?.message || error.message || "Database is not reachable.");
          toast({
            title: "Student database unavailable",
            description: "Student registration only uses the database. Please check the backend and MongoDB connection.",
            status: "error",
            duration: 3500,
            isClosable: true,
          });
        }
      } finally {
        if (isMounted) setIsLoadingStudents(false);
      }
    };

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    fetchUsers()
      .then((users) => {
        if (isMounted) {
          setRegistrarUsers(Array.isArray(users) ? users : []);
        }
      })
      .catch((error) => {
        console.warn("Unable to load registrar users for student registration", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedStudents = useMemo(() => {
    return students.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const matchesDepartment = departmentFilter === "All" || student.learningDepartment === departmentFilter;
      const matchesStatus = statusFilter === "All" || student.status === statusFilter;
      const matchesReadiness = readinessFilter === "All" || (student.readinessStatus || "Not assessed") === readinessFilter;
      const matchesPayment = paymentFilter === "All" || (student.paymentOption || "Full Payment") === paymentFilter;
      const matchesTimeSlot = timeSlotFilter === "All" || (student.preferredTimeSlot || "Morning") === timeSlotFilter;
      const matchesClassCompletion = classCompletionFilter === "All" || (student.classCompletionStatus || (student.classCompleted ? "Completed" : "Not Completed")) === classCompletionFilter;
      const matchesCocPayment = cocPaymentFilter === "All" || (student.cocPaymentStatus || "Unpaid") === cocPaymentFilter;
      const searchableText = [
        student.studentId,
        student.fullName,
        student.email,
        student.phone,
        student.learningDepartment,
        student.program,
        student.preferredTimeSlot,
        student.paymentOption,
        student.paymentBank,
        student.fsNumber,
        student.cocPaymentStatus,
        student.classCompletionStatus,
        student.classCompleted ? "class completed completed" : "class not completed incomplete",
        student.status,
        student.readinessStatus,
        student.registeredBy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesDepartment && matchesStatus && matchesReadiness && matchesPayment && matchesTimeSlot && matchesClassCompletion && matchesCocPayment && (!search || searchableText.includes(search));
    });

    const compareText = (first = "", second = "") =>
      first.toString().localeCompare(second.toString(), undefined, {
        numeric: true,
        sensitivity: "base",
      });

    const compareDate = (first, second) => {
      const firstTime = new Date(first.createdAt || first.enrollmentDate || 0).getTime() || 0;
      const secondTime = new Date(second.createdAt || second.enrollmentDate || 0).getTime() || 0;
      return firstTime - secondTime;
    };

    const sorted = [...filtered].sort((first, second) => {
      if (sortBy === "id") {
        return compareText(first.studentId, second.studentId);
      }
      if (sortBy === "alphabet") {
        return compareText(getStudentName(first), getStudentName(second));
      }
      return compareDate(first, second);
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [classCompletionFilter, cocPaymentFilter, departmentFilter, paymentFilter, readinessFilter, searchQuery, sortBy, sortDirection, statusFilter, students, timeSlotFilter]);

  const timeSlotCounts = useMemo(
    () =>
      timeSlotOptions.reduce((counts, slot) => {
        counts[slot] = students.filter((student) => (student.preferredTimeSlot || "Morning") === slot).length;
        return counts;
      }, {}),
    [students]
  );

  const selectedSectionStudents = useMemo(
    () =>
      selectedTimeSlotSection
        ? students.filter((student) => (student.preferredTimeSlot || "Morning") === selectedTimeSlotSection)
        : [],
    [selectedTimeSlotSection, students]
  );

  const filteredGroups = useMemo(() => {
    return filteredStudents.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});
  }, [filteredStudents]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    if (name === "classCompleted") {
      setForm((prev) => ({
        ...prev,
        classCompleted: checked,
        classCompletionStatus: checked ? "Completed" : "Not Completed",
      }));
      return;
    }
    if (name === "classCompletionStatus") {
      setForm((prev) => ({
        ...prev,
        classCompletionStatus: value,
        classCompleted: value === "Completed",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleRegistrarSelect = (event) => {
    const selected = registrarOptions.find((option) => option.key === event.target.value);
    if (!selected) {
      setForm((prev) => ({ ...prev, registeredBy: "", registeredByEmail: "" }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      registeredBy: selected.name,
      registeredByEmail: selected.email,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const openRegistrationForm = () => {
    resetForm();
    onRegistrationOpen();
  };

  const closeRegistrationForm = () => {
    resetForm();
    onRegistrationClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.learningDepartment) {
      toast({ title: "Student name and learning department are required.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    const now = new Date().toISOString();
    const requestedStudentId = form.studentId.trim();
    const duplicateStudentId = requestedStudentId
      ? students.find(
          (student) =>
            student.studentId?.toLowerCase() === requestedStudentId.toLowerCase() &&
            student.id !== editingId
        )
      : null;

    if (duplicateStudentId) {
      toast({
        title: "Duplicate Student ID",
        description: `${requestedStudentId} is already assigned to ${duplicateStudentId.fullName || "another student"}. Please use a different ID.`,
        status: "warning",
        duration: 4500,
        isClosable: true,
      });
      return;
    }

    setIsSavingStudent(true);

    if (editingId) {
      const updatedPayload = {
        ...form,
        fullName: form.fullName.trim(),
        classCompleted: form.classCompletionStatus === "Completed",
        registeredBy: form.registeredBy?.trim() || registrarName,
        registeredByEmail: form.registeredByEmail?.trim() || registrarEmail,
        updatedAt: now,
        updatedBy: registrarName,
        updatedByEmail: registrarEmail,
      };

      try {
        const updated = await updateStudentRegistration(editingId, updatedPayload);
        const normalizedUpdated = normalizeStudent(updated);
        setStudents((prev) => prev.map((student) => (student.id === editingId ? normalizedUpdated : student)));
      } catch (error) {
        if (error.response?.status === 409) {
          toast({
            title: "Duplicate Student ID",
            description: error.response?.data?.message || "This Student ID is already assigned. Please use a different ID.",
            status: "warning",
            duration: 4500,
            isClosable: true,
          });
          setIsSavingStudent(false);
          return;
        }
        toast({
          title: "Database update failed",
          description: error.response?.data?.message || "Student records are database-only. The update was not saved.",
          status: "error",
          duration: 3500,
          isClosable: true,
        });
        setIsSavingStudent(false);
        return;
      }

      toast({ title: "Student registration updated", status: "success", duration: 2500, isClosable: true });
      setDepartmentFilter("All");
      setStatusFilter("All");
      setReadinessFilter("All");
      setPaymentFilter("All");
      setTimeSlotFilter("All");
      setClassCompletionFilter("All");
      setCocPaymentFilter("All");
      setSearchQuery("");
      setViewMode("list");
      resetForm();
      onRegistrationClose();
      setIsSavingStudent(false);
      return;
    }

    const newStudent = {
      ...form,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      studentId: requestedStudentId || generateUniqueStudentId(students),
      fullName: form.fullName.trim(),
      classCompleted: form.classCompletionStatus === "Completed",
      registeredBy: form.registeredBy?.trim() || registrarName,
      registeredByEmail: form.registeredByEmail?.trim() || registrarEmail,
      createdAt: now,
    };

    try {
      const created = await createStudentRegistration({
        ...newStudent,
        clientLocalId: newStudent.id,
      });
      setStudents((prev) => [normalizeStudent(created), ...prev]);
    } catch (error) {
      if (error.response?.status === 409) {
        toast({
          title: "Duplicate Student ID",
          description: error.response?.data?.message || "This Student ID is already assigned. Please use a different ID.",
          status: "warning",
          duration: 4500,
          isClosable: true,
        });
        setIsSavingStudent(false);
        return;
      }
      toast({
        title: "Database save failed",
        description: error.response?.data?.message || "Student records are database-only. The student was not saved.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      setIsSavingStudent(false);
      return;
    }

    setDepartmentFilter("All");
    setStatusFilter("All");
    setReadinessFilter("All");
    setPaymentFilter("All");
    setTimeSlotFilter("All");
    setClassCompletionFilter("All");
    setCocPaymentFilter("All");
    setSearchQuery("");
    setViewMode("list");
    setForm(initialForm);
    onRegistrationClose();
    setIsSavingStudent(false);
    toast({
      title: "Student registered",
      description: `${newStudent.fullName} was added to ${newStudent.learningDepartment}.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({
      ...initialForm,
      ...student,
      enrollmentDate: formatDate(student.enrollmentDate),
      examDate: formatDate(student.examDate),
    });
    onRegistrationOpen();
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete ${student.fullName}'s registration?`);
    if (!confirmed) return;

    try {
      await deleteStudentRegistration(student.id);
      setStudents((prev) => prev.filter((item) => item.id !== student.id));
      if (editingId === student.id) resetForm();
      toast({ title: "Student deleted", status: "info", duration: 2500, isClosable: true });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "The student could not be deleted from the database.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const handleDetail = (student) => {
    setSelectedStudent(student);
    onOpen();
  };

  const toExportRow = (student) => ({
    "Student ID": student.studentId || "",
    "Student Name": getStudentName(student),
    "Full Name": getStudentName(student),
    Email: student.email || "",
    Phone: student.phone || "",
    Gender: student.gender || "",
    "Learning Department": student.learningDepartment || "Unassigned",
    Program: student.program || "",
    "Enrollment Date": formatDate(student.enrollmentDate),
    "Exam Date": formatDate(student.examDate),
    "Preferred Time Slot": student.preferredTimeSlot || "Morning",
    "Readiness Status": student.readinessStatus || "Not assessed",
    "Payment Option": student.paymentOption || "Full Payment",
    "Payment Bank": student.paymentBank || "",
    "FS Number": student.fsNumber || "",
    "Class Completed": student.classCompleted ? "Yes" : "No",
    "Class Outcome": student.classCompletionStatus || (student.classCompleted ? "Completed" : "Not Completed"),
    "CoC Payment Status": student.cocPaymentStatus || "Unpaid",
    Status: student.status || "",
    Notes: student.notes || "",
    "Registered By": student.registeredBy || "Unknown CS member",
    "Registrar Email": student.registeredByEmail || "",
    "Registration Date": formatDateTime(student.createdAt),
    "Last Updated By": student.updatedBy || "",
    "Last Updated At": formatDateTime(student.updatedAt),
  });

  const makeWorksheet = (rows, columns = []) => {
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: rows.length && "Student Name" in rows[0] ? studentExportHeaders : undefined,
    });
    worksheet["!cols"] = columns.length
      ? columns
      : [
          { wch: 18 },
          { wch: 26 },
          { wch: 26 },
          { wch: 30 },
          { wch: 18 },
          { wch: 14 },
          { wch: 30 },
          { wch: 24 },
          { wch: 16 },
          { wch: 16 },
          { wch: 20 },
          { wch: 18 },
          { wch: 16 },
          { wch: 22 },
          { wch: 22 },
          { wch: 18 },
          { wch: 18 },
          { wch: 20 },
          { wch: 16 },
          { wch: 34 },
          { wch: 24 },
          { wch: 26 },
          { wch: 30 },
          { wch: 20 },
          { wch: 24 },
        ];
    return worksheet;
  };

  const handleExport = () => {
    if (!filteredStudents.length) {
      toast({ title: "No student data to export for the selected filters.", status: "info", duration: 2500, isClosable: true });
      return;
    }

    const workbook = XLSX.utils.book_new();
    const detailRows = filteredStudents.map(toExportRow);

    XLSX.utils.book_append_sheet(workbook, makeWorksheet(detailRows), "Student Details");

    const exportGroups = filteredStudents.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});

    const summaryRows = Object.entries(exportGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([department, records]) => ({
        "Learning Department": department,
        "Exported Students": records.length,
        "Active Students": records.filter((student) => student.status === "Active").length,
        "Ready Students": records.filter((student) => student.readinessStatus === "Ready").length,
        "Full Payment Students": records.filter((student) => (student.paymentOption || "Full Payment") === "Full Payment").length,
      }));

    XLSX.utils.book_append_sheet(
      workbook,
      makeWorksheet(summaryRows, [{ wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 24 }]),
      "Department Summary"
    );

    Object.entries(exportGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([department, records]) => {
        XLSX.utils.book_append_sheet(workbook, makeWorksheet(records.map(toExportRow)), safeSheetName(department));
      });

    const label = departmentFilter === "All" ? "All_Departments" : departmentFilter.replace(/\s+/g, "_");
    XLSX.writeFile(workbook, `CS_Student_Registrations_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({
      title: "Excel export ready",
      description: `${filteredStudents.length} student records exported with full details.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onExcelPreviewClose();
  };

  const handleExcelPreview = () => {
    if (!filteredStudents.length) {
      toast({ title: "No student data to preview for the selected filters.", status: "info", duration: 2500, isClosable: true });
      return;
    }
    onExcelPreviewOpen();
  };

  const renderActions = (student) => (
    <ButtonGroup size="xs" variant="outline" spacing={2}>
      <Button
        leftIcon={<ViewIcon />}
        colorScheme="green"
        variant="solid"
        onClick={() => handleDetail(student)}
      >
        Detail
      </Button>
      <Button leftIcon={<EditIcon />} colorScheme="blue" onClick={() => handleEdit(student)}>Edit</Button>
      <Button leftIcon={<DeleteIcon />} colorScheme="red" onClick={() => handleDelete(student)}>Delete</Button>
    </ButtonGroup>
  );

  return (
    <Layout activeSection="Student Registration">
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} gap={4} direction={{ base: "column", lg: "row" }}>
            <Box>
              <HStack spacing={2} mb={2} flexWrap="wrap">
                <Badge colorScheme="green" borderRadius="full" px={3} py={1}>Customer Service</Badge>
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>Learning Registry</Badge>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>{filteredStudents.length} visible</Badge>
              </HStack>
              <Heading size="lg" color={headingColor}>Student Registration</Heading>
              <Text color={mutedText} mt={1}>Register, review, edit, and export students by assigned Learning Department.</Text>
            </Box>
            <ButtonGroup>
              <Button leftIcon={<FiUserPlus />} colorScheme="green" onClick={openRegistrationForm}>Register Student</Button>
              <Button leftIcon={<FiClock />} colorScheme="blue" variant="outline" onClick={onSectionCountsOpen}>View Sections</Button>
              <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={handleExcelPreview}>Preview Excel</Button>
            </ButtonGroup>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Registered Students</StatLabel><StatNumber color={headingColor}>{students.length}</StatNumber></Stat><Icon as={FiUsers} boxSize={6} color="green.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Visible Records</StatLabel><StatNumber color={headingColor}>{filteredStudents.length}</StatNumber></Stat><Icon as={FiList} boxSize={6} color="blue.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Departments</StatLabel><StatNumber color={headingColor}>{Object.keys(groupedStudents).length}</StatNumber></Stat><Icon as={FiLayers} boxSize={6} color="purple.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Ready for Exam</StatLabel><StatNumber color={headingColor}>{students.filter((student) => student.readinessStatus === "Ready").length}</StatNumber></Stat><Icon as={FiCheckCircle} boxSize={6} color="teal.500" /></HStack></CardBody>
            </Card>
          </SimpleGrid>

          {isLoadingStudents && (
            <Card bg={softPanelBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody py={3}>
                <HStack justify="space-between" gap={3} flexWrap="wrap">
                  <Text fontWeight="800" color={headingColor}>Loading student registrations...</Text>
                  <Text fontSize="sm" color={mutedText}>Reading student records from the database.</Text>
                </HStack>
              </CardBody>
            </Card>
          )}

          {!isLoadingStudents && studentLoadError && (
            <Card bg="red.50" border="1px solid" borderColor="red.200" borderRadius="16px">
              <CardBody py={4}>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="900" color="red.700">Student database is not reachable</Text>
                  <Text fontSize="sm" color="red.700">
                    Student Registration is database-only. No local browser records are being used.
                  </Text>
                  <Text fontSize="xs" color="red.600">{studentLoadError}</Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          <Box>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
              <CardBody>
                <Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} gap={4} direction={{ base: "column", lg: "row" }} mb={4}>
                  <Box>
                    <Heading size="md" color={headingColor}>Registered Students</Heading>
                    <Text fontSize="sm" color={mutedText}>Search, filter, switch view style, and export the selected records.</Text>
                  </Box>
                  <ButtonGroup size="sm" isAttached variant="outline">
                    <Button leftIcon={<FiList />} colorScheme={viewMode === "list" ? "green" : "gray"} variant={viewMode === "list" ? "solid" : "outline"} onClick={() => setViewMode("list")}>List</Button>
                    <Button leftIcon={<FiGrid />} colorScheme={viewMode === "grid" ? "green" : "gray"} variant={viewMode === "grid" ? "solid" : "outline"} onClick={() => setViewMode("grid")}>Grid</Button>
                    <Button leftIcon={<DownloadIcon />} onClick={handleExcelPreview}>Excel</Button>
                  </ButtonGroup>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, xl: 4, "2xl": 8 }} spacing={3} mb={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
                    <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search students..." bg={fieldBg} />
                  </InputGroup>
                  <Select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Learning Departments</option>
                    {learningDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </Select>
                  <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Registration States</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </Select>
                  <Select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Readiness States</option>
                    <option value="Not assessed">Not assessed</option>
                    <option value="In preparation">In preparation</option>
                    <option value="Ready">Ready</option>
                    <option value="Needs support">Needs support</option>
                    <option value="Not ready">Not ready</option>
                  </Select>
                  <Select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Payment Options</option>
                    {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                  <Select value={timeSlotFilter} onChange={(event) => setTimeSlotFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Time Slots</option>
                    {timeSlotOptions.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </Select>
                  <Select value={classCompletionFilter} onChange={(event) => setClassCompletionFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Class Outcomes</option>
                    {classCompletionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                  <Select value={cocPaymentFilter} onChange={(event) => setCocPaymentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All CoC Payment</option>
                    {cocPaymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={4} maxW={{ base: "full", lg: "520px" }}>
                  <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} bg={fieldBg}>
                    <option value="date">Sort by Date</option>
                    <option value="id">Sort by Student ID</option>
                    <option value="alphabet">Sort Alphabetically</option>
                  </Select>
                  <Select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)} bg={fieldBg}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Select>
                </SimpleGrid>

                <Divider mb={4} />

                {viewMode === "grid" ? (
                  <VStack align="stretch" spacing={5}>
                    {Object.entries(filteredGroups).length ? Object.entries(filteredGroups).map(([department, records]) => (
                      <Box key={department}>
                        <HStack mb={3}><Badge colorScheme="green">{department}</Badge><Text fontSize="sm" color={mutedText}>{records.length} students</Text></HStack>
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
                          {records.map((student) => (
                            <Card key={student.id} border="1px solid" borderColor={borderColor} bg={cardAltBg} borderRadius="14px">
                              <CardBody>
                                <VStack align="stretch" spacing={3}>
                                  <HStack align="flex-start" justify="space-between" gap={3}>
                                    <Box>
                                      <Text fontWeight="900" color={headingColor}>{student.fullName}</Text>
                                      <Text fontSize="xs" color={mutedText}>{student.studentId}</Text>
                                    </Box>
                                    <Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge>
                                  </HStack>
                                  <HStack flexWrap="wrap" spacing={2}>
                                    <Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge>
                                    <Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge>
                                  </HStack>
                                  <Flex justify="flex-end">{renderActions(student)}</Flex>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )) : <Box py={10} textAlign="center"><Text fontWeight="800">No students match the selected filters.</Text></Box>}
                  </VStack>
                ) : (
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Student</Th>
                          <Th>Learning Department</Th>
                          <Th>Class</Th>
                          <Th>Payment Option</Th>
                          <Th textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredStudents.length ? filteredStudents.map((student) => (
                          <Tr key={student.id} _hover={{ bg: rowHoverBg }}>
                            <Td>
                              <Text fontWeight="800" color={headingColor}>{student.fullName}</Text>
                              <Text fontSize="xs" color={mutedText}>{student.studentId}</Text>
                            </Td>
                            <Td><Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge></Td>
                            <Td><Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge></Td>
                            <Td><Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge></Td>
                            <Td textAlign="right">{renderActions(student)}</Td>
                          </Tr>
                        )) : (
                          <Tr><Td colSpan={5}><Box py={10} textAlign="center"><Text fontWeight="800" color={headingColor}>No students match the selected filters.</Text><Text fontSize="sm" color={mutedText}>Adjust search/filter settings or add a new student.</Text></Box></Td></Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </Box>

      <Drawer isOpen={isRegistrationOpen} placement="right" onClose={closeRegistrationForm} size="xl">
        <DrawerOverlay />
        <DrawerContent bg={pageBg} h="100dvh" maxH="100dvh" maxW={{ base: "100vw", md: "760px", xl: "860px" }}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} bg={cardBg} flexShrink={0} pr={12}>
            <HStack spacing={3}>
              <Box p={3} borderRadius="14px" bg={softPanelBg}>
                <Icon as={FiUserPlus} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <Heading size="md" color={headingColor}>{editingId ? "Edit Student" : "Register Student"}</Heading>
                <Text fontSize="sm" color={mutedText}>{editingId ? "Update student state and learning details." : "Capture learning assignment details."}</Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" flex="1" minH={0}>
            <DrawerBody py={5} flex="1" minH={0} overflowY="auto">
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl><FormLabel>Student ID</FormLabel><Input name="studentId" value={form.studentId} onChange={handleChange} placeholder="Auto generated if empty" bg={fieldBg} /></FormControl>
                  <FormControl isRequired><FormLabel>Full Name</FormLabel><Input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Student full name" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Email</FormLabel><Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@example.com" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Phone</FormLabel><Input name="phone" value={form.phone} onChange={handleChange} placeholder="+251..." bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Gender</FormLabel><Select name="gender" value={form.gender} onChange={handleChange} bg={fieldBg} placeholder="Select gender"><option value="Female">Female</option><option value="Male">Male</option><option value="Prefer not to say">Prefer not to say</option></Select></FormControl>
                  <FormControl isRequired><FormLabel>Learning Department</FormLabel><Select name="learningDepartment" value={form.learningDepartment} onChange={handleChange} bg={fieldBg} placeholder="Assign department">{form.learningDepartment && !learningDepartments.includes(form.learningDepartment) && <option value={form.learningDepartment}>{form.learningDepartment}</option>}{learningDepartments.map((department) => <option key={department} value={department}>{department}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Program / Course</FormLabel><Input name="program" value={form.program} onChange={handleChange} placeholder="Course or program name" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Enrollment Date</FormLabel><Input name="enrollmentDate" type="date" value={form.enrollmentDate} onChange={handleChange} bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Exam Date</FormLabel><Input name="examDate" type="date" value={form.examDate} onChange={handleChange} bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Preferred Time Slot</FormLabel><Select name="preferredTimeSlot" value={form.preferredTimeSlot} onChange={handleChange} bg={fieldBg}>{timeSlotOptions.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Readiness Status</FormLabel><Select name="readinessStatus" value={form.readinessStatus} onChange={handleChange} bg={fieldBg}><option value="Not assessed">Not assessed</option><option value="In preparation">In preparation</option><option value="Ready">Ready</option><option value="Needs support">Needs support</option><option value="Not ready">Not ready</option></Select></FormControl>
                  <FormControl><FormLabel>Payment Option</FormLabel><Select name="paymentOption" value={form.paymentOption} onChange={handleChange} bg={fieldBg}>{paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Payment Bank</FormLabel><Input name="paymentBank" value={form.paymentBank} onChange={handleChange} placeholder="Bank used for payment" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>FS Number</FormLabel><Input name="fsNumber" value={form.fsNumber} onChange={handleChange} placeholder="Paid receipt FS number" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>CoC Payment Status</FormLabel><Select name="cocPaymentStatus" value={form.cocPaymentStatus} onChange={handleChange} bg={fieldBg}><option value="Unpaid">Unpaid</option><option value="Paid">Paid</option></Select></FormControl>
                  <FormControl><FormLabel>Registration Status</FormLabel><Select name="status" value={form.status} onChange={handleChange} bg={fieldBg}><option value="Active">Active</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Paused">Paused</option></Select></FormControl>
                  <Box gridColumn={{ base: "auto", md: "1 / -1" }} border="1px solid" borderColor={form.classCompleted ? "green.300" : borderColor} borderRadius="18px" px={5} py={4} bg={form.classCompleted ? softPanelBg : cardAltBg}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} alignItems="center">
                      <FormControl>
                        <Checkbox name="classCompleted" colorScheme="green" size="lg" isChecked={form.classCompleted} onChange={handleChange}>
                          <Text as="span" fontSize={{ base: "md", md: "lg" }} fontWeight="900" color={headingColor}>
                            Class completed
                          </Text>
                        </Checkbox>
                        <Text fontSize="sm" color={mutedText} mt={2} pl={{ base: 0, md: 8 }}>
                          Mark this when the student finishes the assigned learning department class.
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Class Outcome</FormLabel>
                        <Select name="classCompletionStatus" value={form.classCompletionStatus} onChange={handleChange} bg={fieldBg}>
                          {classCompletionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                  <FormControl>
                    <FormLabel>Registered By</FormLabel>
                    <Select value={selectedRegistrarKey} onChange={handleRegistrarSelect} bg={fieldBg}>
                      <option value="manual">Manual entry</option>
                      {registrarOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.name}{option.email ? ` - ${option.email}` : ""}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Registrar Name</FormLabel>
                    <Input name="registeredBy" value={form.registeredBy} onChange={handleChange} placeholder={registrarName} bg={fieldBg} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Registrar Email</FormLabel>
                    <Input name="registeredByEmail" type="email" value={form.registeredByEmail} onChange={handleChange} placeholder={registrarEmail || "registrar@example.com"} bg={fieldBg} />
                  </FormControl>
                </SimpleGrid>
                <FormControl><FormLabel>Notes</FormLabel><Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Optional learning notes" bg={fieldBg} rows={3} /></FormControl>
              </VStack>
            </DrawerBody>
            <DrawerFooter
              borderTopWidth="1px"
              borderColor={borderColor}
              bg={cardBg}
              flexShrink={0}
              gap={3}
              flexWrap="wrap"
              justifyContent="flex-end"
              px={{ base: 4, md: 6 }}
              py={4}
            >
              <Button variant="outline" onClick={closeRegistrationForm} w={{ base: "full", sm: "auto" }} isDisabled={isSavingStudent}>Cancel</Button>
              <Button
                type="submit"
                colorScheme="green"
                leftIcon={<FiBookOpen />}
                w={{ base: "full", sm: "auto" }}
                whiteSpace="normal"
                isLoading={isSavingStudent}
                loadingText={editingId ? "Updating..." : "Saving..."}
              >
                {editingId ? "Update Student" : "Save Student Registration"}
              </Button>
            </DrawerFooter>
          </Box>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isSectionCountsOpen} onClose={onSectionCountsClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={headingColor}>Students by Time Section</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={5}>
              {timeSlotOptions.map((slot) => (
                <Card key={slot} bg={cardAltBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
                  <CardBody>
                    <HStack justify="space-between" align="flex-start">
                      <Stat>
                        <StatLabel color={mutedText}>{slot}</StatLabel>
                        <StatNumber color={headingColor}>{timeSlotCounts[slot] || 0}</StatNumber>
                      </Stat>
                      <VStack align="flex-end" spacing={2}>
                        <Badge colorScheme={getStateColor(slot)} borderRadius="full" px={3} py={1}>
                          {slot}
                        </Badge>
                        <Button
                          size="xs"
                          colorScheme={selectedTimeSlotSection === slot ? "green" : "blue"}
                          variant={selectedTimeSlotSection === slot ? "solid" : "outline"}
                          onClick={() => setSelectedTimeSlotSection((current) => (current === slot ? "" : slot))}
                        >
                          View Students
                        </Button>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {selectedTimeSlotSection && (
              <Box border="1px solid" borderColor={borderColor} borderRadius="16px" overflow="hidden">
                <Box px={4} py={3} bg={cardAltBg}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="900" color={headingColor}>{selectedTimeSlotSection} Students</Text>
                      <Text fontSize="sm" color={mutedText}>{selectedSectionStudents.length} enrolled in this section.</Text>
                    </Box>
                    <Badge colorScheme={getStateColor(selectedTimeSlotSection)} borderRadius="full" px={3} py={1}>
                      {selectedTimeSlotSection}
                    </Badge>
                  </HStack>
                </Box>
                <TableContainer maxH="320px" overflowY="auto">
                  <Table size="sm">
                    <Thead bg={cardBg} position="sticky" top={0} zIndex={1}>
                      <Tr>
                        <Th>Student</Th>
                        <Th>Learning Department</Th>
                        <Th>Program</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedSectionStudents.length ? selectedSectionStudents.map((student) => (
                        <Tr key={student.id}>
                          <Td>
                            <Text fontWeight="800">{getStudentName(student)}</Text>
                            <Text fontSize="xs" color={mutedText}>{student.studentId || "No student ID"}</Text>
                          </Td>
                          <Td><Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge></Td>
                          <Td>{student.program || "Not specified"}</Td>
                        </Tr>
                      )) : (
                        <Tr>
                          <Td colSpan={3}>
                            <Box py={8} textAlign="center">
                              <Text fontWeight="800" color={headingColor}>No students in this section.</Text>
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => { setSelectedTimeSlotSection(""); onSectionCountsClose(); }}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isExcelPreviewOpen} onClose={onExcelPreviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={headingColor}>Excel Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color={mutedText} mb={4}>
              Previewing {filteredStudents.length} student records from the current filters.
            </Text>
            <TableContainer border="1px solid" borderColor={borderColor} borderRadius="14px" maxH="60vh" overflowY="auto">
              <Table size="sm">
                <Thead bg={cardAltBg} position="sticky" top={0} zIndex={1}>
                  <Tr>
                    <Th>Student Name</Th>
                    <Th>Learning Department</Th>
                    <Th>Section</Th>
                    <Th>Payment</Th>
                    <Th>Class</Th>
                    <Th>CoC</Th>
                    <Th>Readiness</Th>
                    <Th>Exam Date</Th>
                    <Th>Registered By</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStudents.map((student) => (
                    <Tr key={student.id}>
                      <Td><Text fontWeight="800">{getStudentName(student)}</Text><Text fontSize="xs" color={mutedText}>{student.studentId}</Text></Td>
                      <Td>{student.learningDepartment || "Unassigned"}</Td>
                      <Td><Badge colorScheme={getStateColor(student.preferredTimeSlot)}>{student.preferredTimeSlot || "Morning"}</Badge></Td>
                      <Td><Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge></Td>
                      <Td><Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge></Td>
                      <Td><Badge colorScheme={getStateColor(student.cocPaymentStatus)}>{student.cocPaymentStatus || "Unpaid"}</Badge></Td>
                      <Td>{student.readinessStatus || "Not assessed"}</Td>
                      <Td>{formatDate(student.examDate) || "Not set"}</Td>
                      <Td>{student.registeredBy || "Unknown CS member"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="outline" onClick={onExcelPreviewClose}>Cancel</Button>
            <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={handleExport}>Export Excel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent bg={pageBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg={cardBg}>
            <HStack spacing={3} align="center">
              <Box p={3} borderRadius="14px" bg={softPanelBg}>
                <Icon as={FiBookOpen} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Badge colorScheme="green">{selectedStudent?.learningDepartment || "Unassigned"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.readinessStatus)}>{selectedStudent?.readinessStatus || "Not assessed"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.preferredTimeSlot)}>{selectedStudent?.preferredTimeSlot || "Morning"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.paymentOption)}>{selectedStudent?.paymentOption || "Full Payment"}</Badge>
                  <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))}>Class {getClassOutcome(selectedStudent)}</Badge>
                </HStack>
                <Text color={headingColor}>Student Detail</Text>
                <Text fontSize="sm" color={mutedText} fontWeight="600">{selectedStudent?.fullName}</Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={6}>
            {selectedStudent && (
              <VStack align="stretch" spacing={5}>
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
                      <Box>
                        <HStack spacing={2} mb={2} flexWrap="wrap">
                          <Badge colorScheme="green" borderRadius="full" px={3} py={1}>{selectedStudent.learningDepartment || "Unassigned"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.status)} borderRadius="full" px={3} py={1}>{selectedStudent.status || "Active"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.readinessStatus)} borderRadius="full" px={3} py={1}>{selectedStudent.readinessStatus || "Not assessed"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.preferredTimeSlot)} borderRadius="full" px={3} py={1}>{selectedStudent.preferredTimeSlot || "Morning"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.paymentOption)} borderRadius="full" px={3} py={1}>{selectedStudent.paymentOption || "Full Payment"}</Badge>
                          <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))} borderRadius="full" px={3} py={1}>Class {getClassOutcome(selectedStudent)}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.cocPaymentStatus)} borderRadius="full" px={3} py={1}>CoC {selectedStudent.cocPaymentStatus || "Unpaid"}</Badge>
                        </HStack>
                        <Heading size="md" color={headingColor}>{selectedStudent.fullName}</Heading>
                        <Text fontSize="sm" color={mutedText}>{selectedStudent.studentId || "No student ID"} - {selectedStudent.program || "No program assigned"}</Text>
                      </Box>
                      <ButtonGroup size="sm">
                        <Button leftIcon={<EditIcon />} colorScheme="blue" onClick={() => { handleEdit(selectedStudent); onClose(); }}>Edit</Button>
                        <Button leftIcon={<DeleteIcon />} colorScheme="red" variant="outline" onClick={() => { handleDelete(selectedStudent); onClose(); }}>Delete</Button>
                      </ButtonGroup>
                    </Flex>
                  </CardBody>
                </Card>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={mutedText}>Registration Date</StatLabel>
                        <StatNumber fontSize="lg" color={headingColor}>{formatDate(selectedStudent.createdAt) || "Not set"}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={mutedText}>Exam Date</StatLabel>
                        <StatNumber fontSize="lg" color={headingColor}>{formatDate(selectedStudent.examDate) || "Not set"}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={mutedText}>Registered By</StatLabel>
                        <StatNumber fontSize="md" color={headingColor}>{selectedStudent.registeredBy || "Unknown CS member"}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                        <Icon as={FiUsers} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={headingColor}>Student Information</Heading>
                        <Text fontSize="sm" color={mutedText}>Identity and contact details.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Student ID" value={selectedStudent.studentId} />
                      <DetailItem label="Full Name" value={selectedStudent.fullName} />
                      <DetailItem label="Email" value={selectedStudent.email} />
                      <DetailItem label="Phone" value={selectedStudent.phone} />
                      <DetailItem label="Gender" value={selectedStudent.gender} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                        <Icon as={FiBookOpen} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={headingColor}>Learning Details</Heading>
                        <Text fontSize="sm" color={mutedText}>Department, program, and readiness information.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Learning Department" value={selectedStudent.learningDepartment} />
                      <DetailItem label="Program / Course" value={selectedStudent.program} />
                      <DetailItem label="Enrollment Date" value={formatDate(selectedStudent.enrollmentDate)} />
                      <DetailItem label="Exam Date" value={formatDate(selectedStudent.examDate)} />
                      <DetailItem label="Preferred Time Slot" value={selectedStudent.preferredTimeSlot || "Morning"} />
                      <DetailItem label="Readiness Status" value={selectedStudent.readinessStatus || "Not assessed"} />
                      <DetailItem label="Payment Option" value={selectedStudent.paymentOption || "Full Payment"} />
                      <DetailItem label="Payment Bank" value={selectedStudent.paymentBank} />
                      <DetailItem label="FS Number" value={selectedStudent.fsNumber} />
                      <DetailItem label="Class Completed" value={selectedStudent.classCompleted ? "Yes" : "No"} />
                      <DetailItem label="Class Outcome" value={getClassOutcome(selectedStudent)} />
                      <DetailItem label="CoC Payment Status" value={selectedStudent.cocPaymentStatus || "Unpaid"} />
                      <DetailItem label="Registration Status" value={selectedStudent.status} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                        <Icon as={FiCheckCircle} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={headingColor}>Registration Record</Heading>
                        <Text fontSize="sm" color={mutedText}>CS member and update history.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Registering CS Member" value={selectedStudent.registeredBy || "Unknown CS member"} />
                      <DetailItem label="Registrar Email" value={selectedStudent.registeredByEmail} />
                      <DetailItem label="Registration Date" value={formatDateTime(selectedStudent.createdAt)} />
                      <DetailItem label="Last Updated By" value={selectedStudent.updatedBy} />
                      <DetailItem label="Last Updated At" value={formatDateTime(selectedStudent.updatedAt)} />
                    </SimpleGrid>
                  </CardBody>
                </Card>
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Notes</Text>
                    <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={4} bg={cardAltBg}>
                      <Text whiteSpace="pre-wrap">{selectedStudent.notes || "No notes recorded."}</Text>
                    </Box>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
};

export default StudentRegistrationPage;
