const normalize = (value) => (value || '').toString().trim().toLowerCase();

const financeRoles = ['admin', 'finance', 'coo', 'supervisor'];
const superAdminRoles = ['admin', 'super-admin', 'super_admin'];

const permissionAliases = {
  'finance:read': ['finance:read'],
  'finance:write': ['finance:write'],
  'finance:reports': ['finance:reports', 'can_export_financials'],
  can_post_bill: ['can_post_bill', 'can_post_journal'],
  can_reverse_bill: ['can_reverse_bill', 'can_reverse_journal']
};

const requireFinancePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const role = normalize(req.user.role);
  const isAllowedRole = financeRoles.includes(role);
  const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  const permissionsToCheck = [permission, ...(permissionAliases[permission] || [])];
  const hasNamedPermission = permissionsToCheck.some((item) => userPermissions.includes(item))
    || userPermissions.includes('finance:*')
    || userPermissions.includes('*');

  const roleFallbackAllowed = !permission.startsWith('can_') && isAllowedRole;

  if (!roleFallbackAllowed && !hasNamedPermission && !superAdminRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: `Finance permission required: ${permission}`
    });
  }

  next();
};

const hasFinancePermission = (user, permission) => {
  if (!user) return false;
  const role = normalize(user.role);
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return superAdminRoles.includes(role)
    || (!permission.startsWith('can_') && financeRoles.includes(role))
    || userPermissions.includes(permission)
    || userPermissions.includes('finance:*')
    || userPermissions.includes('*');
};

module.exports = { requireFinancePermission, hasFinancePermission };
