const SESSION_MARKER = 'tradeEthiopiaAuthSessionInitialized';
const RETURN_PATH_KEY = 'tradeEthiopiaReturnPath';

export const AUTH_KEYS = [
  'userToken', 'userRole', 'userRoleRaw', 'userName', 'userFullName',
  'userJobTitle', 'userStatus', 'infoStatus', 'userId', 'userEmail',
  'userDepartment', 'trainingStatus', 'examBypass',
  'userPhoto', 'userPhotoUrl', 'userPhone', 'userLocation', 'userBio',
  'userWebsite', 'userLinkedin', 'userTwitter', 'userFacebook', 'userTelegram',
];

const initializeTabSession = () => {
  if (sessionStorage.getItem(SESSION_MARKER) === 'true') return;
  // One-time compatibility migration. After this point, sessionStorage is the
  // authority for this tab, so another tab cannot replace its signed-in user.
  AUTH_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) sessionStorage.setItem(key, value);
  });
  sessionStorage.setItem(SESSION_MARKER, 'true');
};

export const getAuthItem = (key) => {
  initializeTabSession();
  return sessionStorage.getItem(key);
};

export const setAuthItem = (key, value) => {
  initializeTabSession();
  if (value === undefined || value === null || value === '') {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    return;
  }
  const serialized = String(value);
  sessionStorage.setItem(key, serialized);
  // Retain a bootstrap copy for a newly opened tab. Existing tabs continue to
  // use their isolated sessionStorage values.
  localStorage.setItem(key, serialized);
};

export const removeAuthItem = (key) => {
  initializeTabSession();
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export const clearAuthSession = () => {
  initializeTabSession();
  AUTH_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export const rememberReturnPath = (path, user = {}) => {
  const safePath = typeof path === 'string' ? path.trim() : '';
  if (safePath && safePath.startsWith('/') && !safePath.startsWith('/login')) {
    sessionStorage.setItem(RETURN_PATH_KEY, JSON.stringify({
      path: safePath,
      userId: user?._id ? String(user._id) : '',
      role: user?.role ? String(user.role) : '',
    }));
  }
};

export const consumeReturnPath = (user = {}) => {
  const stored = sessionStorage.getItem(RETURN_PATH_KEY);
  sessionStorage.removeItem(RETURN_PATH_KEY);
  if (!stored) return '';
  try {
    const entry = JSON.parse(stored);
    const sameUser = !entry.userId || String(user?._id || '') === entry.userId;
    const sameRole = !entry.role || String(user?.role || '') === entry.role;
    return sameUser && sameRole && entry.path?.startsWith('/') && !entry.path.startsWith('/login')
      ? entry.path
      : '';
  } catch {
    return '';
  }
};
