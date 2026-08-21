export const normalizeRoleValue = (value = '') =>
  value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const isAccessGranted = (val) =>
  ['on', 'active', 'approved', 'enabled', 'true', 'passed', 'exempt'].includes(
    String(val || '').trim().toLowerCase()
  );

export const isBypassRole = (role = '') => {
  const norm = normalizeRoleValue(role);
  const bypassRoles = [
    'admin',
    'hr',
    'coo',
    'ceo',
    'tessbinadmin',
    'tessbin',
    'tessbin_admin',
    'salesmanager',
    'itadmin',
    'itmanager',
  ];
  return bypassRoles.includes(norm);
};

export const isUserPermittedForDashboard = (user) => {
  if (!user || !user.token) return false;

  const role = normalizeRoleValue(user.role || user.normalizedRole);

  // 1. Administrative roles bypass
  if (isBypassRole(role)) return true;

  // 2. Direct Dashboard Bypass switch toggled by HR
  if (user.examBypass === true || String(user.examBypass) === 'true') return true;

  // 3. Training status is exempt (HR exemption)
  if (String(user.trainingStatus || '').toLowerCase() === 'exempt') return true;

  // 4. Exam to Dashboard Permission approved by HR
  if (isAccessGranted(user.examStatus)) return true;

  return false;
};

export const getRoleDashboardPath = (role = '') => {
  const norm = normalizeRoleValue(role);
  switch (norm) {
    case 'admin':
    case 'hr':
      return '/dashboard';
    case 'finance':
      return '/finance-dashboard';
    case 'sales':
      return '/sdashboard';
    case 'salesmanager':
      return '/salesmanager';
    case 'customerservice':
    case 'customersuccessmanager':
      return '/Cdashboard';
    case 'coo':
      return '/coo-dashboard';
    case 'ceo':
      return '/ceo-dashboard';
    case 'reception':
      return '/reception-dashboard';
    case 'tradextv':
    case 'tetv':
      return '/tradextv-dashboard';
    case 'it':
    case 'itadmin':
    case 'itmanager':
    case 'itteamleader':
    case 'itleader':
    case 'itstaff':
    case 'itofficer':
      return '/it';
    case 'socialmediamanager':
    case 'socialmedia':
      return '/social-media';
    case 'supervisor':
      return '/supervisor';
    case 'enisra':
      return '/enisra/dashboard';
    case 'instructor':
      return '/instructor';
    case 'tessbinadmin':
    case 'tessbin':
      return '/tessbin-dashboard';
    default:
      return '/sdashboard';
  }
};

export const getOnboardingRedirectPath = (user) => {
  if (!user || !user.token) return '/login';

  if (isUserPermittedForDashboard(user)) {
    return getRoleDashboardPath(user.role);
  }

  // Step 1: Personal Info
  if (user.infoStatus !== 'active') {
    return '/employee-info';
  }

  // Step 2 / 3: Tutorials & Exam
  const isTrainingApproved = isAccessGranted(user.trainingStatus);
  const examStatus = String(user.examStatus || '').trim().toLowerCase();

  if (examStatus === 'completed') {
    // Exam was taken & submitted, waiting for HR to approve Exam-to-Dashboard permission
    return '/WaitingForApproval';
  }

  if (!isTrainingApproved) {
    // Tutorials not yet approved by HR
    return '/secondpage';
  }

  // If training approved but exam not taken yet
  return '/exam';
};
