const ROLE_DEPARTMENT_MAP = {
  admin: "Admin",
  finance: "Finance",
  hr: "HR",
  sales: "Sales",
  salesmanager: "Sales",
  salessupervisor: "Sales",
  customerservice: "Customer Success",
  customersuccess: "Customer Success",
  customersuccessmanager: "Customer Success",
  socialmediamanager: "Social Media",
  socialmedia: "Social Media",
  it: "IT",
  itstaff: "IT",
  itteamleader: "IT",
  itmanager: "IT",
  tetv: "TradexTV",
  tradex: "TradexTV",
  tradextv: "TradexTV",
  coo: "Operations",
  instructor: "Training",
  eventmanager: "Events",
};

const ROLE_DEPARTMENT_PATTERNS = [
  { regex: /finance/, department: "Finance" },
  { regex: /admin/, department: "Admin" },
  { regex: /sales/, department: "Sales" },
  { regex: /tradex/, department: "TradexTV" },
  { regex: /social/, department: "Social Media" },
  { regex: /customer/, department: "Customer Success" },
  { regex: /success/, department: "Customer Success" },
  { regex: /it/, department: "IT" },
  { regex: /hr/, department: "HR" },
];

const ROLE_EXEMPTIONS = new Set(["finance", "admin"]);

const normalizeText = (value) => (value ? value.toString().trim() : "");

const formatDepartmentFromTokens = (value) => {
  if (!value) return "";
  return value
    .split(/[\s_-]+/)
    .map((segment) => {
      const cleaned = segment.toLowerCase();
      return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
    })
    .filter(Boolean)
    .join(" ");
};

const normalizeRoleValue = (role) => normalizeText(role).toLowerCase();

export const getDepartmentFromRole = (role) => {
  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) return "";
  if (ROLE_DEPARTMENT_MAP[normalizedRole]) {
    return ROLE_DEPARTMENT_MAP[normalizedRole];
  }
  for (const entry of ROLE_DEPARTMENT_PATTERNS) {
    if (entry.regex.test(normalizedRole)) {
      return entry.department;
    }
  }
  return formatDepartmentFromTokens(normalizedRole);
};

export const getUserDepartment = (user) => {
  if (!user) return "";
  const profileDept = normalizeText(user.department);
  if (profileDept) return profileDept;
  const roleBasedDept = getDepartmentFromRole(user.role);
  if (roleBasedDept) return roleBasedDept;
  if (user.jobTitle) {
    return formatDepartmentFromTokens(user.jobTitle);
  }
  return "";
};

export const isFinanceOrAdminRole = (role) => {
  const normalized = normalizeRoleValue(role);
  return normalized ? ROLE_EXEMPTIONS.has(normalized) : false;
};
