const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no user" 
      });
    }

    // Log for debugging
    console.log('=== AUTHORIZATION DEBUG INFO ===');
    console.log('User role from token:', req.user.role);
    console.log('Required roles:', roles);
    
    // More explicit role matching
    const userRole = req.user.role || '';
    const hasAccess = roles.some(requiredRole => {
      // Direct match
      if (userRole === requiredRole) {
        console.log(`Direct match found: ${userRole} === ${requiredRole}`);
        return true;
      }
      
      // Case insensitive match
      if (userRole.toLowerCase() === requiredRole.toLowerCase()) {
        console.log(`Case insensitive match found: ${userRole} =~ ${requiredRole}`);
        return true;
      }
      
      return false;
    });
    
    console.log('User role:', userRole);
    console.log('Required roles:', roles);
    console.log('Access granted:', hasAccess);
    console.log('=================================');
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}. User role: ${userRole}` 
      });
    }

    next();
  };
};

module.exports = { authorize };