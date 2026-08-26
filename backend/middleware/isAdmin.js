// Simple admin/HR role checker
module.exports = function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const role = (req.user.role || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (role === 'admin' || role === 'hr' || role === 'coo' || role === 'coo2' || role === '2coo' || role === 'ceo') return next();
  return res.status(403).json({ success: false, message: 'Admin/HR role required' });
};
