import { Navigate } from 'react-router-dom';
import { normalizeRole, useUserStore } from '../../../../store/user';

const SalesManagerProtectedRoute = ({ children }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const role = normalizeRole(currentUser?.role || currentUser?.normalizedRole);

  if (!currentUser?.token) {
    return <Navigate to="/login" replace />;
  }

  if (!['salesmanager', 'admin'].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default SalesManagerProtectedRoute;
